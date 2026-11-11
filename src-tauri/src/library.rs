//! BIOS and ROM folders: making the ES-DE folder structure, checking BIOS
//! files by their fingerprint (MD5), and collecting BIOS files from anywhere.

use md5::{Digest, Md5};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

pub const SYSTEMS: &str = include_str!("../data/systems.json");
pub const BIOSDB: &str = include_str!("../data/bios.json");

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct System {
    pub id: String,
    pub name: String,
    pub maker: String,
}

pub fn systems() -> Vec<System> {
    serde_json::from_str(SYSTEMS).unwrap_or_default()
}

pub fn bios_db() -> Vec<Value> {
    serde_json::from_str(BIOSDB).unwrap_or_default()
}

#[derive(Debug, Clone, Serialize)]
pub struct FolderInfo {
    pub id: String,
    pub name: String,
    pub maker: String,
    pub roms: usize,
    pub rom_bytes: u64,
    pub has_folder: bool,
}

const ROM_SKIP: &[&str] = &["txt", "xml", "nfo", "md", "png", "jpg", "jpeg", "webp", "db", "ini", "cfg", "srm", "sav", "state", "json", "log"];

fn count_files(dir: &Path) -> (usize, u64) {
    let mut n = 0;
    let mut bytes = 0;
    let mut stack = vec![dir.to_path_buf()];
    while let Some(d) = stack.pop() {
        if let Ok(rd) = std::fs::read_dir(&d) {
            for e in rd.flatten() {
                let p = e.path();
                let name = e.file_name().to_string_lossy().to_string();
                if name.starts_with('.') || name.starts_with('_') {
                    continue;
                }
                if p.is_dir() {
                    // multi-file games (e.g. .m3u + discs) count by their files; good enough for a count
                    stack.push(p);
                } else {
                    let ext = p.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
                    if ROM_SKIP.contains(&ext.as_str()) {
                        continue;
                    }
                    n += 1;
                    bytes += e.metadata().map(|m| m.len()).unwrap_or(0);
                }
            }
        }
    }
    (n, bytes)
}

pub fn folders(root: &str) -> Vec<FolderInfo> {
    let roms = Path::new(root).join("roms");
    systems()
        .into_iter()
        .map(|s| {
            let d = roms.join(&s.id);
            let (n, b) = if d.is_dir() { count_files(&d) } else { (0, 0) };
            FolderInfo { has_folder: d.is_dir(), roms: n, rom_bytes: b, id: s.id, name: s.name, maker: s.maker }
        })
        .collect()
}

/// Make roms/<system>, bios/<system> and inbox/ for every system. Never deletes anything.
pub fn make_folders(root: &str) -> Result<usize, String> {
    let r = Path::new(root);
    let mut made = 0;
    let mut mk = |p: PathBuf| -> Result<(), String> {
        if !p.exists() {
            std::fs::create_dir_all(&p).map_err(|e| format!("Can't make {}: {e}", p.display()))?;
            made += 1;
        }
        Ok(())
    };
    for s in systems() {
        mk(r.join("roms").join(&s.id))?;
        mk(r.join("bios").join(&s.id))?;
    }
    mk(r.join("inbox"))?;
    mk(r.join("Apps"))?;
    mk(r.join("Backups").join("saves"))?;
    let readme = r.join("README.txt");
    if !readme.exists() {
        let _ = std::fs::write(
            &readme,
            "Emu Vault\n\nApps/   emulators, the last versions of each\nbios/   BIOS files, one folder per system\nroms/   your games, one folder per system (ES-DE names)\ninbox/  drop new files here; Emu Vault sorts them\nBackups/ copies of your saves\n",
        );
    }
    Ok(made)
}

#[derive(Debug, Clone, Serialize)]
pub struct BiosFile {
    pub file: String,
    pub required: bool,
    pub note: String,
    pub md5: String,
    /// ok | wrong | missing | present (no fingerprint known)
    pub state: String,
    pub path: String,
    pub free_url: String,
    /// files with the same group: one of them is enough
    pub one: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct BiosSystem {
    pub id: String,
    pub name: String,
    pub used: String,
    pub why: String,
    pub tip: String,
    /// req | opt | none | game | ...
    pub need: String,
    pub files: Vec<BiosFile>,
}

pub type Md5Cache = std::sync::Mutex<HashMap<(PathBuf, u64, i64), String>>;

fn mtime(p: &Path) -> i64 {
    p.metadata().and_then(|m| m.modified()).ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs() as i64).unwrap_or(0)
}

pub fn md5_file(p: &Path, cache: &Md5Cache) -> Option<String> {
    let len = p.metadata().ok()?.len();
    let key = (p.to_path_buf(), len, mtime(p));
    if let Some(h) = cache.lock().unwrap().get(&key) {
        return Some(h.clone());
    }
    use std::io::Read;
    let mut f = std::fs::File::open(p).ok()?;
    let mut h = Md5::new();
    let mut buf = vec![0u8; 1 << 20];
    loop {
        let n = f.read(&mut buf).ok()?;
        if n == 0 {
            break;
        }
        h.update(&buf[..n]);
    }
    let out = hex::encode(h.finalize());
    cache.lock().unwrap().insert(key, out.clone());
    Some(out)
}

/// Find `name` in a folder, ignoring upper/lower case.
fn find_ci(dir: &Path, name: &str) -> Option<PathBuf> {
    let direct = dir.join(name);
    if direct.exists() {
        return Some(direct);
    }
    let low = name.to_lowercase();
    std::fs::read_dir(dir).ok()?.flatten().map(|e| e.path()).find(|p| p.file_name().map(|f| f.to_string_lossy().to_lowercase() == low).unwrap_or(false))
}

fn s(v: &Value, k: &str) -> String {
    v.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string()
}

/// Files whose md5 differs normally: zips (packed differently, other romset version) and files that hold your
/// own settings (DS firmware, Dreamcast flash, NVRAM), or lists that get new versions.
pub fn other_version_ok(file: &str) -> bool {
    let l = file.to_lowercase();
    l.ends_with(".zip")
        || l.ends_with(".7z")
        || ["firmware.bin", "dc_flash.bin", "dc_nvmem.bin", "hiscore.dat", "nvram.bin", "dsi_nand.bin", "flash.bin", "eeprom.dat", "nes.pal", "rom.db"]
            .contains(&l.as_str())
        || l.ends_with(".nvr")
        || l.ends_with(".nvm")
        || l.ends_with(".mec")
}

pub fn bios_status(root: &str, cache: &Md5Cache) -> Vec<BiosSystem> {
    let bios = Path::new(root).join("bios");
    let names: HashMap<String, String> = systems()
        .into_iter()
        .map(|s| (s.id.clone(), if s.maker.is_empty() || s.name.starts_with(&s.maker) { s.name } else { format!("{} {}", s.maker, s.name) }))
        .collect();
    bios_db()
        .iter()
        .map(|e| {
            let id = s(e, "id");
            let files = e
                .get("files")
                .and_then(|f| f.as_array())
                .map(|fs| {
                    fs.iter()
                        .map(|f| {
                            let file = s(f, "f");
                            let md5 = s(f, "md5").to_lowercase();
                            // look in bios/<system>/ first, then bios/ itself (RetroArch style)
                            let found = find_ci(&bios.join(&id), &file).or_else(|| find_ci(&bios, &file));
                            let state = match &found {
                                None => "missing",
                                Some(p) if md5.is_empty() => {
                                    let _ = p;
                                    "present"
                                }
                                Some(p) => {
                                    if md5_file(p, cache).as_deref() == Some(md5.as_str()) {
                                        "ok"
                                    } else if other_version_ok(&file) {
                                        // a zip (its md5 changes with how it was packed) or a file with your own
                                        // settings in it: the emulator checks it itself
                                        "other"
                                    } else {
                                        "wrong"
                                    }
                                }
                            };
                            BiosFile {
                                required: f.get("req").and_then(|x| x.as_bool()).unwrap_or(false),
                                note: s(f, "note"),
                                free_url: f.pointer("/free/u").and_then(|x| x.as_str()).unwrap_or("").into(),
                                state: state.into(),
                                path: found.map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
                                one: s(f, "one"),
                                file,
                                md5,
                            }
                        })
                        .collect::<Vec<BiosFile>>()
                })
                .unwrap_or_default();
            // "one of these is enough": once one is there, the others are optional;
            // if none is there, only the first one counts as required
            let mut files = files;
            let groups: Vec<String> = files.iter().filter(|f| !f.one.is_empty()).map(|f| f.one.clone()).collect();
            for g in groups {
                let have = files.iter().any(|f| f.one == g && (f.state == "ok" || f.state == "present" || f.state == "other"));
                let mut first = true;
                for f in files.iter_mut().filter(|f| f.one == g) {
                    if have || !first {
                        if f.required && f.state == "missing" {
                            f.required = false;
                            if !f.note.contains("one of") {
                                f.note = format!("{} · one of these is enough", f.note).trim_start_matches(" · ").to_string();
                            }
                        }
                    }
                    first = false;
                }
            }
            BiosSystem {
                name: names.get(&id).cloned().unwrap_or_else(|| id.clone()),
                used: s(e, "used"),
                why: s(e, "why"),
                tip: s(e, "tip"),
                need: s(e, "st"),
                files,
                id,
            }
        })
        .collect()
}

#[derive(Debug, Clone, Serialize)]
pub struct Collected {
    pub scanned: usize,
    pub copied: Vec<String>,
    pub already: usize,
}

/// Look through a folder (and its subfolders) for known BIOS files by fingerprint,
/// and copy each one to bios/<system>/ under the right name. Originals stay put.
pub fn collect_bios(root: &str, from: &str, cache: &Md5Cache) -> Result<Collected, String> {
    let mut want: HashMap<String, Vec<(String, String)>> = HashMap::new(); // md5 -> [(system, file)]
    for e in bios_db() {
        let id = s(&e, "id");
        for f in e.get("files").and_then(|f| f.as_array()).cloned().unwrap_or_default() {
            let m = s(&f, "md5").to_lowercase();
            if !m.is_empty() {
                want.entry(m).or_default().push((id.clone(), s(&f, "f")));
            }
        }
    }
    let bios = Path::new(root).join("bios");
    let mut out = Collected { scanned: 0, copied: vec![], already: 0 };
    let mut stack = vec![PathBuf::from(from)];
    let mut seen_dirs = 0;
    while let Some(d) = stack.pop() {
        seen_dirs += 1;
        if seen_dirs > 20000 {
            break;
        }
        let Ok(rd) = std::fs::read_dir(&d) else { continue };
        for e in rd.flatten() {
            let p = e.path();
            if p.is_dir() {
                if !e.file_name().to_string_lossy().starts_with('.') {
                    stack.push(p);
                }
                continue;
            }
            let len = e.metadata().map(|m| m.len()).unwrap_or(0);
            if len == 0 || len > 64 * 1024 * 1024 {
                continue;
            }
            out.scanned += 1;
            let Some(h) = md5_file(&p, cache) else { continue };
            if let Some(targets) = want.get(&h) {
                for (sys, file) in targets {
                    let dest = bios.join(sys).join(file);
                    if dest.exists() && md5_file(&dest, cache).as_deref() == Some(h.as_str()) {
                        out.already += 1;
                        continue;
                    }
                    if dest.exists() {
                        // never overwrite: keep the other file next to it
                        let _ = std::fs::rename(
                            &dest,
                            dest.with_extension(format!("{}.old", dest.extension().map(|x| x.to_string_lossy().to_string()).unwrap_or_default())),
                        );
                    }
                    std::fs::create_dir_all(dest.parent().unwrap()).map_err(|e| e.to_string())?;
                    std::fs::copy(&p, &dest).map_err(|e| format!("Couldn't copy {}: {e}", p.display()))?;
                    out.copied.push(format!("{sys}/{file}"));
                }
            }
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn folders_and_bios() {
        let root = std::env::temp_dir().join(format!("ev-lib-{}", std::process::id()));
        let r = root.to_string_lossy().to_string();
        assert!(make_folders(&r).unwrap() > 100);
        assert!(root.join("roms/snes").is_dir() && root.join("bios/psx").is_dir());
        std::fs::write(root.join("roms/snes/Chrono Trigger (USA).sfc"), vec![0u8; 1000]).unwrap();
        std::fs::write(root.join("roms/snes/gamelist.xml"), b"x").unwrap();
        let f = folders(&r);
        let snes = f.iter().find(|x| x.id == "snes").unwrap();
        assert_eq!((snes.roms, snes.rom_bytes), (1, 1000));
        let cache = Md5Cache::default();
        // a file whose md5 we don't match: wrong
        std::fs::write(root.join("bios/psx/SCPH5501.BIN"), b"not a bios").unwrap();
        let st = bios_status(&r, &cache);
        let psx = st.iter().find(|x| x.id == "psx").unwrap();
        let f5501 = psx.files.iter().find(|x| x.file == "scph5501.bin").unwrap();
        assert_eq!(f5501.state, "wrong");
        assert_eq!(psx.files.iter().find(|x| x.file == "scph5502.bin").unwrap().state, "missing");
        assert_eq!(psx.files.iter().filter(|x| x.required && x.state != "ok").count(), 1, "one PS1 BIOS is enough");
        // collecting: nothing in a random folder matches
        let src = root.join("downloads");
        std::fs::create_dir_all(&src).unwrap();
        std::fs::write(src.join("x.bin"), b"hello").unwrap();
        let c = collect_bios(&r, &src.to_string_lossy(), &cache).unwrap();
        assert_eq!((c.scanned, c.copied.len()), (1, 0));
        std::fs::remove_dir_all(root).unwrap();
    }
}
