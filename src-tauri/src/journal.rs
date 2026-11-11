//! Every change Emu Vault makes to your files is written down here, so it can be undone.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Batch {
    pub id: String,
    pub time: String,
    pub label: String,
    /// (from, to)
    pub moves: Vec<(String, String)>,
    /// files this batch made (copies, playlists); undo deletes them
    pub made: Vec<String>,
    /// folders this batch made; undo removes them when empty
    pub dirs: Vec<String>,
    pub undone: bool,
    /// files in _duplicates were deleted for good: can't undo any more
    pub purged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Journal {
    pub batches: Vec<Batch>,
}

pub fn path() -> PathBuf {
    crate::store::app_dir().join("changes.json")
}
pub fn load() -> Journal {
    std::fs::read_to_string(path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
pub fn save(j: &Journal) {
    let _ = std::fs::create_dir_all(crate::store::app_dir());
    let _ = std::fs::write(path(), serde_json::to_vec_pretty(j).unwrap());
}

/// Move a file; works across drives too (copy, then delete the original).
pub fn move_file(from: &Path, to: &Path) -> Result<(), String> {
    if to.exists() {
        return Err(format!("{} already exists", to.display()));
    }
    if let Some(d) = to.parent() {
        std::fs::create_dir_all(d).map_err(|e| format!("Can't make {}: {e}", d.display()))?;
    }
    if std::fs::rename(from, to).is_ok() {
        return Ok(());
    }
    if from.is_dir() {
        copy_dir(from, to)?;
        std::fs::remove_dir_all(from).map_err(|e| e.to_string())?;
    } else {
        std::fs::copy(from, to).map_err(|e| format!("Couldn't copy {}: {e}", from.display()))?;
        std::fs::remove_file(from).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn copy_dir(from: &Path, to: &Path) -> Result<(), String> {
    std::fs::create_dir_all(to).map_err(|e| e.to_string())?;
    for e in std::fs::read_dir(from).map_err(|e| e.to_string())?.flatten() {
        let t = to.join(e.file_name());
        if e.path().is_dir() {
            copy_dir(&e.path(), &t)?;
        } else {
            std::fs::copy(e.path(), &t).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// A free name next to `p`: "x (2).sfc", "x (3).sfc"…
pub fn free_name(p: &Path) -> PathBuf {
    if !p.exists() {
        return p.to_path_buf();
    }
    let stem = p.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
    let ext = p.extension().map(|s| format!(".{}", s.to_string_lossy())).unwrap_or_default();
    for i in 2..1000 {
        let q = p.with_file_name(format!("{stem} ({i}){ext}"));
        if !q.exists() {
            return q;
        }
    }
    p.to_path_buf()
}

pub struct Recorder {
    pub batch: Batch,
}

impl Recorder {
    pub fn new(label: &str) -> Self {
        let now = chrono::Local::now();
        Recorder {
            batch: Batch {
                id: format!("b{}", now.timestamp_millis()),
                time: now.format("%Y-%m-%d %H:%M").to_string(),
                label: label.into(),
                ..Default::default()
            },
        }
    }
    pub fn mv(&mut self, from: &Path, to: &Path) -> Result<PathBuf, String> {
        let to = free_name(to);
        self.mkdirs(to.parent().unwrap());
        move_file(from, &to)?;
        self.batch.moves.push((from.to_string_lossy().into(), to.to_string_lossy().into()));
        Ok(to)
    }
    pub fn cp(&mut self, from: &Path, to: &Path) -> Result<PathBuf, String> {
        let to = free_name(to);
        self.mkdirs(to.parent().unwrap());
        std::fs::copy(from, &to).map_err(|e| format!("Couldn't copy {}: {e}", from.display()))?;
        self.batch.made.push(to.to_string_lossy().into());
        Ok(to)
    }
    pub fn write(&mut self, to: &Path, data: &[u8]) -> Result<(), String> {
        self.mkdirs(to.parent().unwrap());
        std::fs::write(to, data).map_err(|e| e.to_string())?;
        self.batch.made.push(to.to_string_lossy().into());
        Ok(())
    }
    pub fn mkdirs(&mut self, d: &Path) {
        let mut missing = vec![];
        let mut p = Some(d);
        while let Some(x) = p {
            if x.exists() {
                break;
            }
            missing.push(x.to_path_buf());
            p = x.parent();
        }
        let _ = std::fs::create_dir_all(d);
        for m in missing.into_iter().rev() {
            self.batch.dirs.push(m.to_string_lossy().into());
        }
    }
    pub fn changed(&self) -> bool {
        !self.batch.moves.is_empty() || !self.batch.made.is_empty()
    }
    pub fn commit(self) -> Option<Batch> {
        if !self.changed() {
            return None;
        }
        let mut j = load();
        j.batches.insert(0, self.batch.clone());
        j.batches.truncate(200);
        save(&j);
        Some(self.batch)
    }
}

/// Undo one batch. Returns how many things were put back and what couldn't be.
pub fn undo(id: &str) -> Result<(usize, Vec<String>), String> {
    let mut j = load();
    let b = j.batches.iter_mut().find(|b| b.id == id).ok_or("That change is no longer in the list.")?;
    if b.undone {
        return Err("This was already undone.".into());
    }
    if b.purged {
        return Err("The files from this change were deleted for good, so it can't be undone.".into());
    }
    let mut n = 0;
    let mut problems = vec![];
    for (from, to) in b.moves.iter().rev() {
        let (f, t) = (Path::new(from), Path::new(to));
        if !t.exists() {
            problems.push(format!("{} is gone", t.display()));
            continue;
        }
        match move_file(t, f) {
            Ok(_) => n += 1,
            Err(e) => problems.push(e),
        }
    }
    for m in b.made.iter().rev() {
        let p = Path::new(m);
        if p.is_file() && std::fs::remove_file(p).is_ok() {
            n += 1;
        }
    }
    for d in b.dirs.iter().rev() {
        let _ = std::fs::remove_dir(d); // only if empty
    }
    b.undone = true;
    save(&j);
    Ok((n, problems))
}

/// Delete files that were moved to _duplicates more than `days` days ago.
pub fn purge_old(days: i64) -> usize {
    if days <= 0 {
        return 0;
    }
    let mut j = load();
    let cutoff = (chrono::Local::now() - chrono::Duration::days(days)).format("%Y-%m-%d %H:%M").to_string();
    let mut n = 0;
    for b in j.batches.iter_mut() {
        if b.undone || b.purged || b.time > cutoff {
            continue;
        }
        let mut any = false;
        for (_, to) in &b.moves {
            if to.contains("/_duplicates/") {
                any = true;
                let p = Path::new(to);
                if p.is_file() && std::fs::remove_file(p).is_ok() {
                    n += 1;
                } else if p.is_dir() && std::fs::remove_dir_all(p).is_ok() {
                    n += 1;
                }
            }
        }
        if any {
            b.purged = true;
        }
    }
    save(&j);
    n
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn move_copy_undo_purge() {
        let root = std::env::temp_dir().join(format!("ev-j-{}", std::process::id()));
        std::env::set_var("EMUVAULT_HOME", root.join("cfg"));
        std::fs::create_dir_all(root.join("inbox")).unwrap();
        std::fs::write(root.join("inbox/a.sfc"), b"a").unwrap();
        std::fs::write(root.join("inbox/b.sfc"), b"b").unwrap();
        std::fs::create_dir_all(root.join("roms/snes")).unwrap();
        std::fs::write(root.join("roms/snes/a.sfc"), b"old").unwrap();
        let mut r = Recorder::new("test");
        // name taken: gets "a (2).sfc"
        let to = r.mv(&root.join("inbox/a.sfc"), &root.join("roms/snes/a.sfc")).unwrap();
        assert!(to.ends_with("a (2).sfc"));
        r.mv(&root.join("inbox/b.sfc"), &root.join("roms/snes/_duplicates/b.sfc")).unwrap();
        r.write(&root.join("roms/snes/x.m3u"), b"x").unwrap();
        let b = r.commit().unwrap();
        assert!(!root.join("inbox/a.sfc").exists());
        let (n, probs) = undo(&b.id).unwrap();
        assert_eq!((n, probs.len()), (3, 0));
        assert!(root.join("inbox/a.sfc").exists() && root.join("inbox/b.sfc").exists());
        assert!(!root.join("roms/snes/x.m3u").exists());
        assert!(!root.join("roms/snes/_duplicates").exists(), "empty folder made by the batch is removed");
        assert!(undo(&b.id).is_err());
        // purge: an old batch with a _duplicates move
        let mut r = Recorder::new("old");
        r.mv(&root.join("inbox/b.sfc"), &root.join("roms/snes/_duplicates/b.sfc")).unwrap();
        let mut b2 = r.commit().unwrap();
        let mut j = load();
        j.batches[0].time = "2020-01-01 00:00".into();
        save(&j);
        b2.id = j.batches[0].id.clone();
        assert_eq!(purge_old(30), 1);
        assert!(!root.join("roms/snes/_duplicates/b.sfc").exists());
        assert!(undo(&b2.id).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }
}
