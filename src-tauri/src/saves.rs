//! Saves: a backup per save folder (per emulator), on a schedule, and saves from the Inbox put
//! into the right emulator folder. Backups live in <main folder>/Backups/saves/<folder name>/<date>/.

use crate::extras::SaveSource;
use crate::journal::{self, Recorder};
use crate::{store, Core};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snap {
    pub id: String,
    pub time: String,
    pub files: usize,
    pub bytes: u64,
    pub fingerprint: String,
    /// "" for normal backups, e.g. "before restoring …" for the safety copy
    pub note: String,
}

#[derive(Serialize)]
pub struct Folder {
    label: String,
    path: String,
    exists: bool,
    files: usize,
    bytes: u64,
    /// what's in it, a few names
    sample: Vec<String>,
    snaps: Vec<Snap>,
}

#[derive(Serialize)]
pub struct SavesStatus {
    folders: Vec<Folder>,
    detected: Vec<SaveSource>,
    keep: usize,
    /// daily | weekly | start | manual
    when: String,
    /// older backups made of all folders together (before 0.4.8)
    legacy: Vec<crate::extras::Snapshot>,
    dir: String,
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            let p = e.path();
            if p.is_dir() {
                walk(&p, out)
            } else {
                out.push(p)
            }
        }
    }
}

fn base(root: &str, s: &SaveSource) -> PathBuf {
    crate::extras::backups_dir(root).join(store::safe(&s.label))
}

fn fingerprint(dir: &Path) -> (String, usize, u64) {
    use sha2::{Digest, Sha256};
    let mut h = Sha256::new();
    let mut files = vec![];
    walk(dir, &mut files);
    files.sort();
    let mut bytes = 0;
    for f in &files {
        let m = f.metadata().ok();
        let len = m.as_ref().map(|m| m.len()).unwrap_or(0);
        let mt = m.and_then(|m| m.modified().ok()).and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs()).unwrap_or(0);
        h.update(format!("{}|{len}|{mt}\n", f.strip_prefix(dir).unwrap_or(f).display()));
        bytes += len;
    }
    (hex::encode(h.finalize())[..16].to_string(), files.len(), bytes)
}

pub fn snaps(root: &str, s: &SaveSource) -> Vec<Snap> {
    let mut v: Vec<Snap> = std::fs::read_dir(base(root, s))
        .map(|rd| rd.flatten().filter_map(|e| serde_json::from_str(&std::fs::read_to_string(e.path().join("snap.json")).ok()?).ok()).collect())
        .unwrap_or_default();
    v.sort_by(|a, b| b.id.cmp(&a.id));
    v
}

/// Back up one save folder. None when nothing changed since its last backup.
pub fn backup_one(root: &str, s: &SaveSource, keep: usize, note: &str, force: bool) -> Result<Option<Snap>, String> {
    let src = Path::new(&s.path);
    if !src.is_dir() {
        return Err(format!("{}: the folder {} isn't there", s.label, s.path));
    }
    let (fp, n, bytes) = fingerprint(src);
    if !force && snaps(root, s).iter().find(|x| x.note.is_empty()).map(|x| x.fingerprint == fp).unwrap_or(false) {
        return Ok(None);
    }
    if let Some((free, _)) = store::free_space(root) {
        if bytes + 20 * 1024 * 1024 > free {
            return Err("Not enough space on the drive for this backup.".into());
        }
    }
    let now = chrono::Local::now();
    let mut id = now.format("%Y-%m-%d_%H%M%S").to_string();
    if !note.is_empty() {
        id.push_str("_before");
    }
    let dir = base(root, s).join(&id);
    journal::copy_dir(src, &dir.join("files"))?;
    let snap = Snap { id, time: now.format("%Y-%m-%d %H:%M").to_string(), files: n, bytes, fingerprint: fp, note: note.into() };
    std::fs::write(dir.join("snap.json"), serde_json::to_vec_pretty(&snap).unwrap()).map_err(|e| e.to_string())?;
    let all = snaps(root, s);
    for old in all.iter().filter(|x| x.note.is_empty()).skip(keep.max(1)) {
        let _ = std::fs::remove_dir_all(base(root, s).join(&old.id));
    }
    for old in all.iter().filter(|x| !x.note.is_empty()).skip(2) {
        let _ = std::fs::remove_dir_all(base(root, s).join(&old.id));
    }
    Ok(Some(snap))
}

/// Put a backup back. The current saves are backed up first, so this can be reversed.
pub fn restore_one(root: &str, s: &SaveSource, id: &str) -> Result<usize, String> {
    let snap = snaps(root, s).into_iter().find(|x| x.id == id).ok_or("Backup not found")?;
    backup_one(root, s, 99, &format!("before restoring {}", snap.time), true)?;
    let from = base(root, s).join(id).join("files");
    let mut files = vec![];
    walk(&from, &mut files);
    let mut n = 0;
    for f in files {
        let rel = f.strip_prefix(&from).unwrap();
        let to = Path::new(&s.path).join(rel);
        std::fs::create_dir_all(to.parent().unwrap()).map_err(|e| e.to_string())?;
        std::fs::copy(&f, &to).map_err(|e| format!("Couldn't put back {}: {e}", rel.display()))?;
        n += 1;
    }
    Ok(n)
}

/// Is a backup due by the schedule? (looked at when Emu Vault starts and every half hour while it runs)
fn due(when: &str, last: Option<&Snap>, at_start: bool) -> bool {
    let Some(last) = last else { return when != "manual" };
    let age = |h: i64| last.time < (chrono::Local::now() - chrono::Duration::hours(h)).format("%Y-%m-%d %H:%M").to_string();
    match when {
        "daily" => age(20),
        "weekly" => age(24 * 6 + 20),
        "start" => at_start && age(1),
        _ => false,
    }
}

/// Back up every folder that is due and changed. Returns (folders backed up, files).
pub fn run_due(core: &Core, at_start: bool) -> (usize, usize, Vec<String>) {
    let cfg = core.cfg.lock().unwrap().clone();
    let mut done = 0;
    let mut files = 0;
    let mut errs = vec![];
    for s in &cfg.save_sources {
        let last = snaps(&cfg.root, s).into_iter().find(|x| x.note.is_empty());
        if !due(&cfg.backup_when, last.as_ref(), at_start) {
            continue;
        }
        match backup_one(&cfg.root, s, cfg.backup_keep, "", false) {
            Ok(Some(x)) => {
                done += 1;
                files += x.files;
            }
            Ok(None) => {}
            Err(e) => errs.push(e),
        }
    }
    if done > 0 {
        core.log(format!("Saves backed up: {done} folder{}, {files} files", if done == 1 { "" } else { "s" }));
    }
    (done, files, errs)
}

#[tauri::command]
pub fn saves_status(core: tauri::State<Core>) -> SavesStatus {
    let cfg = core.cfg.lock().unwrap().clone();
    let folders = cfg
        .save_sources
        .iter()
        .map(|s| {
            let mut v = vec![];
            walk(Path::new(&s.path), &mut v);
            let bytes = v.iter().map(|p| p.metadata().map(|m| m.len()).unwrap_or(0)).sum();
            let mut sample: Vec<String> = v.iter().take(200).filter_map(|p| p.strip_prefix(&s.path).ok().map(|x| x.to_string_lossy().to_string())).collect();
            sample.sort();
            sample.truncate(4);
            Folder {
                label: s.label.clone(),
                path: s.path.clone(),
                exists: Path::new(&s.path).is_dir(),
                files: v.len(),
                bytes,
                sample,
                snaps: snaps(&cfg.root, s),
            }
        })
        .collect();
    SavesStatus {
        folders,
        detected: crate::extras::detect_sources_root(&cfg.root).into_iter().filter(|d| !cfg.save_sources.iter().any(|s| s.path == d.path)).collect(),
        keep: cfg.backup_keep,
        when: cfg.backup_when.clone(),
        legacy: crate::extras::list_snapshots(&cfg.root),
        dir: crate::extras::backups_dir(&cfg.root).to_string_lossy().into(),
    }
}

/// Back up one folder (label) or all of them now.
#[tauri::command]
pub async fn saves_backup(core: tauri::State<'_, Core>, label: Option<String>) -> Result<(usize, usize), String> {
    let cfg = core.cfg.lock().unwrap().clone();
    let mut n = 0;
    let mut files = 0;
    let mut errs = vec![];
    tokio::task::block_in_place(|| {
        for s in cfg.save_sources.iter().filter(|s| label.as_ref().map(|l| l == &s.label).unwrap_or(true)) {
            match backup_one(&cfg.root, s, cfg.backup_keep, "", false) {
                Ok(Some(x)) => {
                    n += 1;
                    files += x.files;
                }
                Ok(None) => {}
                Err(e) => errs.push(e),
            }
        }
    });
    if n > 0 {
        core.log(format!("Saves backed up: {n} folder{}, {files} files", if n == 1 { "" } else { "s" }));
    }
    if n == 0 && !errs.is_empty() {
        return Err(errs.join("; "));
    }
    Ok((n, files))
}

#[tauri::command]
pub async fn saves_restore(core: tauri::State<'_, Core>, label: String, id: String) -> Result<usize, String> {
    let cfg = core.cfg.lock().unwrap().clone();
    let s = cfg.save_sources.iter().find(|s| s.label == label).cloned().ok_or("That save folder isn't in your list anymore")?;
    let n = tokio::task::block_in_place(|| restore_one(&cfg.root, &s, &id))?;
    core.log(format!("{label}: saves from {id} put back ({n} files; the ones from just before are kept as a backup)"));
    Ok(n)
}

/// Called every half hour by the screens while Emu Vault runs.
#[tauri::command]
pub async fn saves_tick(core: tauri::State<'_, Core>, at_start: bool) -> Result<(usize, usize), String> {
    let c: &Core = &core;
    let (d, f, _) = tokio::task::block_in_place(|| run_due(c, at_start));
    Ok((d, f))
}

/// A save file from the Inbox goes into an emulator's save folder. When a save with the same name
/// is there, it goes to _duplicates first (so you can undo), after a backup of that folder.
#[tauri::command]
pub async fn save_put(core: tauri::State<'_, Core>, src: String, folder: String, replace: bool) -> Result<String, String> {
    let cfg = core.cfg.lock().unwrap().clone();
    let from = PathBuf::from(&src);
    let name = from.file_name().ok_or("Not a file")?.to_owned();
    let to = Path::new(&folder).join(&name);
    if to.exists() && !replace {
        return Err("exists".into());
    }
    let mut rec = Recorder::new(&format!("Save {} put in {}", name.to_string_lossy(), folder));
    tokio::task::block_in_place(|| -> Result<(), String> {
        if to.exists() {
            if let Some(s) = cfg.save_sources.iter().find(|s| Path::new(&folder).starts_with(&s.path)) {
                let _ = backup_one(&cfg.root, s, cfg.backup_keep, "", false);
            }
            let stamp = chrono::Local::now().format("%Y-%m-%d_%H-%M").to_string();
            rec.mv(&to, &Path::new(&cfg.root).join("_duplicates").join("saves").join(stamp).join(&name))?;
        }
        rec.mv(&from, &to)?;
        Ok(())
    })?;
    let l = rec.batch.label.clone();
    rec.commit();
    core.log(l);
    Ok(to.to_string_lossy().into())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn backup_restore_per_folder() {
        let t = std::env::temp_dir().join(format!("ev-saves-{}", std::process::id()));
        let root = t.join("root");
        let ra = t.join("ra");
        std::fs::create_dir_all(&ra).unwrap();
        std::fs::write(ra.join("Zelda.srm"), b"one").unwrap();
        let r = root.to_string_lossy().to_string();
        let s = SaveSource { label: "RetroArch saves".into(), path: ra.to_string_lossy().into() };
        let a = backup_one(&r, &s, 3, "", false).unwrap().unwrap();
        assert_eq!(a.files, 1);
        assert!(backup_one(&r, &s, 3, "", false).unwrap().is_none(), "nothing changed");
        std::thread::sleep(std::time::Duration::from_millis(1100));
        std::fs::write(ra.join("Zelda.srm"), b"two!").unwrap();
        assert!(backup_one(&r, &s, 3, "", false).unwrap().is_some());
        assert_eq!(snaps(&r, &s).len(), 2);
        assert_eq!(restore_one(&r, &s, &a.id).unwrap(), 1);
        assert_eq!(std::fs::read(ra.join("Zelda.srm")).unwrap(), b"one");
        assert!(snaps(&r, &s).iter().any(|x| !x.note.is_empty()), "the state before restoring is kept");
        assert!(due("daily", None, false) && !due("manual", None, false));
        std::fs::remove_dir_all(t).unwrap();
    }
}
