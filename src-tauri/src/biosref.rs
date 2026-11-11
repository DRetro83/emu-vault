//! BIOS reference (0.9.5): a full RetroArch "system" folder of your own, kept somewhere else, that the vault
//! only READS. It is compared with RetroArch-BIOS (same layout), and what the vault doesn't have can be
//! copied into bios/<system>/ on your click. Nothing in the reference is ever written, moved or deleted.

use crate::Core;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

const BIG: u64 = 64 << 20; // larger files: compared by size only

#[derive(Serialize, Default)]
pub struct RefReport {
    path: String,
    found: bool,
    files: usize,
    same: usize,
    /// (path in the reference, its size, the vault's size)
    diff: Vec<(String, u64, u64)>,
    /// (path in the reference, size, where it goes in the vault)
    missing: Vec<(String, u64, String)>,
    missing_bytes: u64,
    /// in RetroArch-BIOS, not in the reference
    extra: Vec<String>,
    when: String,
}

fn walk(d: &Path, base: &Path, out: &mut Vec<(String, PathBuf)>) {
    for e in std::fs::read_dir(d).into_iter().flatten().flatten() {
        let p = e.path();
        let n = e.file_name().to_string_lossy().to_string();
        if n.starts_with('.') || p.is_symlink() {
            continue;
        }
        if p.is_dir() {
            walk(&p, base, out);
        } else if let Ok(r) = p.strip_prefix(base) {
            out.push((r.to_string_lossy().replace('\\', "/"), p));
        }
    }
}

/// where a file of a RetroArch system folder goes in the vault: bios/<system>/… (first one copied, the
/// others hard links), or bios/_retroarch/… for core data
fn dests(rel: &str, names: &HashMap<String, Vec<String>>, folders: &HashMap<String, String>) -> Vec<String> {
    let low = rel.to_lowercase();
    let (top, rest) = match rel.split_once('/') {
        Some((a, b)) => (a.to_string(), b.to_string()),
        None => (String::new(), rel.to_string()),
    };
    if let Some(r) = low.strip_prefix("pcsx2/bios/") {
        let _ = r;
        return vec![format!("ps2/{}", &rel["pcsx2/bios/".len()..])];
    }
    match top.to_lowercase().as_str() {
        "dc" => return vec![format!("dreamcast/{rest}")],
        "neocd" => return vec![format!("neogeocd/{rest}")],
        _ => {}
    }
    if top.is_empty() {
        if let Some(ss) = names.get(&low) {
            return ss.iter().map(|s| format!("{s}/{rel}")).collect();
        }
        return vec![format!("_retroarch/{rel}")];
    }
    if let Some(s) = folders.get(&top.to_lowercase()) {
        return vec![format!("{s}/{rel}")];
    }
    vec![format!("_retroarch/{rel}")]
}

fn tables() -> (HashMap<String, Vec<String>>, HashMap<String, String>) {
    let mut names: HashMap<String, Vec<String>> = HashMap::new();
    let mut folders: HashMap<String, String> = HashMap::new();
    for s in crate::library::bios_db() {
        let id = s["id"].as_str().unwrap_or("").to_string();
        for f in s["files"].as_array().into_iter().flatten() {
            let n = f["f"].as_str().unwrap_or("");
            if let Some((top, _)) = n.split_once('/') {
                folders.entry(top.to_lowercase()).or_insert_with(|| id.clone());
            } else if !n.is_empty() {
                let v = names.entry(n.to_lowercase()).or_default();
                if !v.contains(&id) {
                    v.push(id.clone());
                }
            }
        }
    }
    (names, folders)
}

struct Md5Cache {
    file: PathBuf,
    map: HashMap<String, String>,
    changed: bool,
}
impl Md5Cache {
    fn load() -> Self {
        let file = crate::store::app_dir().join("bios-ref-md5.json");
        let map = std::fs::read_to_string(&file).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default();
        Md5Cache { file, map, changed: false }
    }
    fn get(&mut self, p: &Path) -> Option<String> {
        let m = p.metadata().ok()?;
        let mt = m.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs()).unwrap_or(0);
        let key = format!("{}|{}|{}", p.display(), m.len(), mt);
        if let Some(h) = self.map.get(&key) {
            return Some(h.clone());
        }
        let h = {
            use md5::{Digest, Md5};
            let mut m = Md5::new();
            let mut f = std::fs::File::open(p).ok()?;
            std::io::copy(&mut f, &mut m).ok()?;
            hex::encode(m.finalize())
        };
        self.map.insert(key, h.clone());
        self.changed = true;
        Some(h)
    }
    fn save(&self) {
        if self.changed {
            let _ = std::fs::write(&self.file, serde_json::to_string(&self.map).unwrap_or_default());
        }
    }
}

fn scan(root: &str, refp: &str) -> RefReport {
    let mut r = RefReport { path: refp.into(), when: chrono::Local::now().format("%Y-%m-%d %H:%M").to_string(), ..Default::default() };
    let rp = PathBuf::from(refp);
    if refp.is_empty() || !rp.is_dir() {
        return r;
    }
    r.found = true;
    let ra = crate::retroarch::ra_bios_dir(root);
    let (names, folders) = tables();
    let mut files = vec![];
    walk(&rp, &rp, &mut files);
    files.sort();
    r.files = files.len();
    let mut cache = Md5Cache::load();
    let mut ref_set: HashSet<String> = HashSet::new();
    for (rel, p) in &files {
        ref_set.insert(rel.to_lowercase());
        let size = p.metadata().map(|m| m.len()).unwrap_or(0);
        let mut v = ra.join(rel);
        if !v.exists() {
            // the same file with other upper/lower case
            if let Some(alt) = v
                .parent()
                .and_then(|d| std::fs::read_dir(d).ok())
                .and_then(|rd| rd.flatten().find(|e| e.file_name().to_string_lossy().eq_ignore_ascii_case(&rel.rsplit('/').next().unwrap_or(""))))
            {
                v = alt.path();
            }
        }
        if v.is_file() {
            let vs = v.metadata().map(|m| m.len()).unwrap_or(0);
            let same = vs == size && (size > BIG || cache.get(p) == cache.get(&v));
            if same {
                r.same += 1;
            } else {
                r.diff.push((rel.clone(), size, vs));
            }
        } else {
            let d = dests(rel, &names, &folders);
            r.missing_bytes += size;
            r.missing.push((rel.clone(), size, format!("bios/{}", d.first().cloned().unwrap_or_default())));
        }
    }
    cache.save();
    // what RetroArch-BIOS has that the reference hasn't (lower-case twins the vault makes left out)
    let mut ours = vec![];
    walk(&ra, &ra, &mut ours);
    let ours_low: HashMap<String, usize> = ours.iter().fold(HashMap::new(), |mut m, (rel, _)| {
        *m.entry(rel.to_lowercase()).or_insert(0) += 1;
        m
    });
    for (rel, _) in ours {
        let l = rel.to_lowercase();
        if rel.starts_with(".emuvault") || ref_set.contains(&l) {
            continue;
        }
        if rel != l && ours_low.get(&l).copied().unwrap_or(0) > 1 {
            continue;
        }
        if rel == l && ours_low.get(&l).copied().unwrap_or(0) > 1 {
            continue;
        }
        r.extra.push(rel);
    }
    r.extra.sort();
    r
}

#[tauri::command]
pub fn bios_ref_set(core: tauri::State<Core>, path: String) -> Result<String, String> {
    let p = path.trim().trim_end_matches('/').to_string();
    if !p.is_empty() && !Path::new(&p).is_dir() {
        return Err(format!("That folder isn't there: {p}"));
    }
    let mut c = core.cfg.lock().unwrap();
    c.bios_ref = p.clone();
    crate::store::save_config(&c).map_err(|e| e.to_string())?;
    Ok(p)
}

/// Compare the reference with RetroArch-BIOS. Reads only.
#[tauri::command]
pub async fn bios_ref_scan(core: tauri::State<'_, Core>) -> Result<RefReport, String> {
    let (root, refp) = {
        let c = core.cfg.lock().unwrap();
        (c.root.clone(), c.bios_ref.clone())
    };
    // RetroArch-BIOS up to date first
    crate::retroarch::bios_links(&core);
    tokio::task::spawn_blocking(move || scan(&root, &refp)).await.map_err(|e| e.to_string())
}

#[derive(Serialize)]
pub struct CopyDone {
    copied: usize,
    there: usize,
    failed: usize,
}

/// Copy what the vault doesn't have from the reference into bios/<system>/ (the reference is only read).
#[tauri::command]
pub async fn bios_ref_copy(core: tauri::State<'_, Core>) -> Result<CopyDone, String> {
    let (root, refp) = {
        let c = core.cfg.lock().unwrap();
        (c.root.clone(), c.bios_ref.clone())
    };
    if refp.is_empty() || !Path::new(&refp).is_dir() {
        return Err("No reference folder (or it isn't there now).".into());
    }
    let r2 = root.clone();
    let done = tokio::task::spawn_blocking(move || {
        let rep = scan(&r2, &refp);
        let (names, folders) = tables();
        let bios = Path::new(&r2).join("bios");
        let (mut copied, mut there, mut failed) = (0, 0, 0);
        for (rel, _, _) in &rep.missing {
            let src = Path::new(&refp).join(rel);
            let mut ds = dests(rel, &names, &folders);
            // a PS2 BIOS loose at the top (ps2_scph39001.bin): as it is for RetroArch, and also in bios/ps2/
            let low = rel.to_lowercase();
            if !rel.contains('/')
                && low.ends_with(".bin")
                && (low.contains("ps2") || low.contains("scph"))
                && src.metadata().map(|m| m.len()).unwrap_or(0) == 4 << 20
            {
                ds.push(format!("ps2/{rel}"));
            }
            let Some(first) = ds.first() else { continue };
            if first.contains("..") {
                continue;
            }
            let to = bios.join(first);
            if to.exists() {
                there += 1;
            } else {
                if let Some(pd) = to.parent() {
                    let _ = std::fs::create_dir_all(pd);
                }
                if std::fs::copy(&src, &to).is_ok() {
                    copied += 1;
                } else {
                    failed += 1;
                    continue;
                }
            }
            for o in ds.iter().skip(1) {
                let x = bios.join(o);
                if !x.exists() && !o.contains("..") {
                    if let Some(pd) = x.parent() {
                        let _ = std::fs::create_dir_all(pd);
                    }
                    let _ = std::fs::hard_link(&to, &x).or_else(|_| std::fs::copy(&to, &x).map(|_| ()));
                }
            }
        }
        CopyDone { copied, there, failed }
    })
    .await
    .map_err(|e| e.to_string())?;
    crate::retroarch::bios_links(&core);
    core.log(format!(
        "BIOS reference: {} copied into bios/, {} already there, {} failed (the reference itself unchanged)",
        done.copied, done.there, done.failed
    ));
    Ok(done)
}

#[cfg(test)]
mod tests {
    #[test]
    fn where_files_go() {
        let (n, f) = super::tables();
        assert_eq!(super::dests("scph5501.bin", &n, &f), vec!["psx/scph5501.bin"]);
        assert_eq!(super::dests("pcsx2/bios/ps2_scph39001.bin", &n, &f), vec!["ps2/ps2_scph39001.bin"]);
        assert_eq!(super::dests("dc/dc_boot.bin", &n, &f), vec!["dreamcast/dc_boot.bin"]);
        assert_eq!(super::dests("PPSSPP/flash0/font/a.pgf", &n, &f), vec!["psp/PPSSPP/flash0/font/a.pgf"]);
        assert_eq!(super::dests("vice/JiffyDOS_C64.bin", &n, &f), vec!["_retroarch/vice/JiffyDOS_C64.bin"]);
        assert_eq!(super::dests("bass.dll", &n, &f), vec!["_retroarch/bass.dll"]);
        assert!(super::dests("syscard3.pce", &n, &f).len() >= 2);
    }

    #[test]
    fn compare_and_copy() {
        let d = std::env::temp_dir().join(format!("ev-ref-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let root = d.join("vault");
        let refd = d.join("ref");
        std::fs::create_dir_all(root.join("bios/psx")).unwrap();
        std::fs::create_dir_all(refd.join("pcsx2/bios")).unwrap();
        std::fs::write(root.join("bios/psx/scph5501.bin"), b"same").unwrap();
        std::fs::write(refd.join("scph5501.bin"), b"same").unwrap();
        std::fs::write(refd.join("gba_bios.bin"), b"gba").unwrap();
        std::fs::write(refd.join("pcsx2/bios/x.bin"), b"ps2").unwrap();
        let r = root.to_string_lossy().to_string();
        crate::retroarch::fill_bios(&r, &crate::retroarch::ra_bios_dir(&r));
        let rep = super::scan(&r, &refd.to_string_lossy());
        assert_eq!((rep.files, rep.same, rep.missing.len()), (3, 1, 2));
        let before = std::fs::read(refd.join("gba_bios.bin")).unwrap();
        // what copy does, by hand (no Core here)
        let (n, f) = super::tables();
        for (rel, _, _) in &rep.missing {
            let to = root.join("bios").join(&super::dests(rel, &n, &f)[0]);
            std::fs::create_dir_all(to.parent().unwrap()).unwrap();
            std::fs::copy(refd.join(rel), to).unwrap();
        }
        crate::retroarch::fill_bios(&r, &crate::retroarch::ra_bios_dir(&r));
        let rep = super::scan(&r, &refd.to_string_lossy());
        assert_eq!((rep.same, rep.missing.len(), rep.diff.len()), (3, 0, 0));
        assert_eq!(std::fs::read(refd.join("gba_bios.bin")).unwrap(), before);
        let _ = std::fs::remove_dir_all(&d);
    }
}
