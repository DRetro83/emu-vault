//! Commands for the screens taken over from the preview: one snapshot of everything on disk,
//! and one command that carries out the file changes the screens make (move, copy, delete).

use crate::journal::{self, Recorder};
use crate::{cmds, store, Core};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Serialize)]
pub struct UFile {
    sys: String,
    name: String,
    /// path inside roms/<sys>/ (for files in subfolders)
    rel: String,
    path: String,
    size: u64,
    crc: String,
    dat: String,
    check: String,
    parts: Vec<String>,
    /// a front cover is in media/<system>/covers/
    cover: bool,
}

#[derive(Serialize)]
pub struct Loose {
    sys: String,
    /// inbox: first folder under inbox/ ("" when loose)
    dir: String,
    name: String,
    path: String,
    size: u64,
}

#[derive(Serialize)]
pub struct Snapshot {
    root: String,
    files: Vec<UFile>,
    trash: Vec<Loose>,
    inbox: Vec<Loose>,
    bios_have: Vec<String>,
    systems: Vec<String>,
    free: u64,
    total: u64,
    version: String,
    hist: Vec<journal::Batch>,
    ui_state: String,
    scanned: String,
    /// originals kept after converting: (system, bytes)
    converted: Vec<(String, u64)>,
    /// patch files in <main folder>/patches/
    patches: Vec<Loose>,
    /// changes when files are added, removed or changed outside Emu Vault
    stamp: String,
    /// every _duplicates folder: what's in it
    dups: Vec<DupDir>,
}

#[derive(Serialize)]
pub struct DupDir {
    label: String,
    path: String,
    bytes: u64,
    files: usize,
}

fn dup_dirs(root: &str) -> Vec<DupDir> {
    let mut out = vec![];
    let mut add = |label: String, p: PathBuf| {
        let mut v = vec![];
        walk(&p, &mut v);
        if !v.is_empty() {
            let bytes = v.iter().map(|f| f.metadata().map(|m| m.len()).unwrap_or(0)).sum();
            out.push(DupDir { label, path: p.to_string_lossy().into(), bytes, files: v.len() });
        }
    };
    for s in cmds::rom_systems_pub(root) {
        add(format!("roms/{s}"), Path::new(root).join("roms").join(&s).join("_duplicates"));
    }
    if let Ok(rd) = std::fs::read_dir(Path::new(root).join("_duplicates")) {
        let mut subs: Vec<_> = rd.flatten().filter(|e| e.path().is_dir()).map(|e| e.file_name().to_string_lossy().to_string()).collect();
        subs.sort();
        for s in subs {
            add(s.clone(), Path::new(root).join("_duplicates").join(&s));
        }
    }
    out
}

/// A fingerprint of what's in roms/, inbox/, bios/ and patches/ (names, sizes, times; no file is read).
pub fn stamp_of(root: &str) -> String {
    use std::hash::{Hash, Hasher};
    let mut v = vec![];
    for d in ["roms", "inbox", "bios", "patches", "Apps"] {
        walk(&Path::new(root).join(d), &mut v);
    }
    for (d, _) in crate::roms::extra_dirs() {
        walk(Path::new(&d), &mut v);
    }
    v.sort();
    let mut h = std::collections::hash_map::DefaultHasher::new();
    for p in &v {
        p.hash(&mut h);
        if let Ok(m) = p.metadata() {
            m.len().hash(&mut h);
            m.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs()).hash(&mut h);
        }
    }
    format!("{}:{:x}", v.len(), h.finish())
}

#[tauri::command]
pub async fn disk_stamp(core: tauri::State<'_, Core>) -> Result<String, String> {
    let r = core.cfg.lock().unwrap().root.clone();
    Ok(tokio::task::block_in_place(|| stamp_of(&r)))
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            let n = e.file_name().to_string_lossy().to_string();
            if n.starts_with('.') || n.ends_with(".part") {
                continue;
            }
            let p = e.path();
            if p.is_dir() {
                walk(&p, out);
            } else {
                out.push(p);
            }
        }
    }
}

pub fn ui_state_path() -> PathBuf {
    store::app_dir().join("ui-state.json")
}

#[tauri::command]
pub async fn ui_snapshot(app: tauri::AppHandle, core: tauri::State<'_, Core>, scan: bool) -> Result<Snapshot, String> {
    let r = core.cfg.lock().unwrap().root.clone();
    let c: &Core = &core;
    if scan || core.lib.lock().unwrap().is_empty() {
        // RetroArch-BIOS follows bios/ (only what changed is made again)
        tokio::task::block_in_place(|| crate::retroarch::bios_links(c));
        let systems = cmds::rom_systems_pub(&r);
        let n = systems.len();
        for (i, s) in systems.iter().enumerate() {
            use tauri::Emitter;
            let _ = app.emit("scan-progress", (i + 1, n, s.clone()));
            let files = tokio::task::block_in_place(|| crate::roms::scan_system(&r, s, &c.hashes));
            core.lib.lock().unwrap().insert(s.clone(), files);
        }
        core.lib.lock().unwrap().retain(|k, _| systems.contains(k));
        *core.lib_time.lock().unwrap() = store::now();
        cmds::save_hashes_pub(c);
    }
    let lib = core.lib.lock().unwrap().clone();
    let mut files = vec![];
    for (sys, v) in &lib {
        for f in v {
            let stem = f.rel.rsplit_once('.').map(|(a, _)| a).unwrap_or(&f.rel);
            let cover = Path::new(&r).join("media").join(sys).join("covers").join(format!("{stem}.png")).exists();
            files.push(UFile {
                sys: sys.clone(),
                name: f.name.clone(),
                rel: f.rel.clone(),
                path: f.path.clone(),
                size: f.size,
                crc: if f.crc == 0 { String::new() } else { format!("{:08x}", f.crc) },
                dat: f.dat.clone(),
                check: f.check.clone(),
                parts: f.parts.clone(),
                cover,
            });
        }
    }
    let root = Path::new(&r);
    let mut trash = vec![];
    for sys in cmds::rom_systems_pub(&r) {
        let mut v = vec![];
        walk(&root.join("roms").join(&sys).join("_duplicates"), &mut v);
        for p in v {
            trash.push(Loose {
                sys: sys.clone(),
                dir: String::new(),
                name: p.file_name().unwrap().to_string_lossy().into(),
                size: p.metadata().map(|m| m.len()).unwrap_or(0),
                path: p.to_string_lossy().into(),
            });
        }
    }
    let inbox_dir = root.join("inbox");
    let mut v = vec![];
    walk(&inbox_dir, &mut v);
    let inbox = v
        .into_iter()
        .map(|p| {
            let rel = p.strip_prefix(&inbox_dir).unwrap_or(&p).to_path_buf();
            let dir = if rel.components().count() > 1 { rel.components().next().unwrap().as_os_str().to_string_lossy().to_string() } else { String::new() };
            Loose {
                sys: String::new(),
                dir,
                name: p.file_name().unwrap().to_string_lossy().into(),
                size: p.metadata().map(|m| m.len()).unwrap_or(0),
                path: p.to_string_lossy().into(),
            }
        })
        .collect();
    let mut bios_have = vec![];
    if let Ok(rd) = std::fs::read_dir(root.join("bios")) {
        for e in rd.flatten() {
            if !e.path().is_dir() {
                continue;
            }
            let id = e.file_name().to_string_lossy().to_string();
            if let Ok(rd2) = std::fs::read_dir(e.path()) {
                for f in rd2.flatten() {
                    let n = f.file_name().to_string_lossy().to_string();
                    if !n.starts_with('.') {
                        bios_have.push(format!("{id}/{n}{}", if f.path().is_dir() { "/" } else { "" }));
                        // what is inside folders too (PPSSPP/flash0/font/, GC/USA/IPL.bin), so a file or folder on
                        // the list is seen wherever the emulator keeps it
                        if f.path().is_dir() {
                            let mut n_here = 0usize;
                            let mut st = vec![(f.path(), format!("{n}/"), 1)];
                            while let Some((d, rel, depth)) = st.pop() {
                                for g in std::fs::read_dir(&d).into_iter().flatten().flatten() {
                                    let gn = g.file_name().to_string_lossy().to_string();
                                    if gn.starts_with('.') || n_here > 4000 {
                                        continue;
                                    }
                                    if g.path().is_dir() {
                                        bios_have.push(format!("{id}/{rel}{gn}/"));
                                        n_here += 1;
                                        if depth < 5 {
                                            st.push((g.path(), format!("{rel}{gn}/"), depth + 1));
                                        }
                                    } else {
                                        // files deeper in (GC/USA/IPL.bin, dolphin-emu/Sys/GC/EUR/IPL.bin)
                                        bios_have.push(format!("{id}/{rel}{gn}"));
                                        n_here += 1;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let (free, total) = store::free_space(&r).unwrap_or((0, 0));
    let stamp = stamp_of(&r);
    Ok(Snapshot {
        stamp,
        dups: dup_dirs(&r),
        root: r.clone(),
        files,
        trash,
        inbox,
        bios_have,
        systems: cmds::rom_systems_pub(&r),
        free,
        total,
        version: env!("CARGO_PKG_VERSION").into(),
        hist: journal::load().batches.into_iter().take(60).collect(),
        converted: cmds::rom_systems_pub(&r)
            .into_iter()
            .filter_map(|s| {
                let mut v = vec![];
                walk(&Path::new(&r).join("roms").join(&s).join("_converted"), &mut v);
                let b: u64 = v.iter().map(|p| p.metadata().map(|m| m.len()).unwrap_or(0)).sum();
                (!v.is_empty()).then_some((s, b))
            })
            .collect(),
        patches: {
            let mut v = vec![];
            walk(&Path::new(&r).join("patches"), &mut v);
            v.into_iter()
                .filter(|p| {
                    p.extension()
                        .map(|e| ["ips", "ups", "bps", "xdelta", "xdelta3", "vcdiff"].contains(&e.to_string_lossy().to_lowercase().as_str()))
                        .unwrap_or(false)
                })
                .map(|p| Loose {
                    sys: String::new(),
                    dir: String::new(),
                    name: p.file_name().unwrap().to_string_lossy().into(),
                    size: p.metadata().map(|m| m.len()).unwrap_or(0),
                    path: p.to_string_lossy().into(),
                })
                .collect()
        },
        ui_state: std::fs::read_to_string(ui_state_path()).unwrap_or_default(),
        scanned: core.lib_time.lock().unwrap().clone(),
    })
}

#[tauri::command]
pub fn ui_state_save(json: String) -> Result<(), String> {
    let p = ui_state_path();
    if let Some(d) = p.parent() {
        let _ = std::fs::create_dir_all(d);
    }
    let tmp = p.with_extension("tmp");
    std::fs::write(&tmp, json).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &p).map_err(|e| e.to_string())
}

#[derive(Deserialize, Debug)]
pub struct Op {
    /// move | copy | delete | mkdir
    kind: String,
    from: String,
    #[serde(default)]
    to: String,
}

#[derive(Serialize)]
pub struct OpResult {
    ok: bool,
    /// where the file ended up (may get " (2)" when the name was taken)
    path: String,
    error: String,
}

/// Carry out file changes inside the main folder. Moves and copies can be undone (Recent changes).
#[tauri::command]
pub async fn apply_ops(core: tauri::State<'_, Core>, label: String, ops: Vec<Op>) -> Result<Vec<OpResult>, String> {
    let r = core.cfg.lock().unwrap().root.clone();
    let root = PathBuf::from(&r);
    let inside = |p: &Path| p.starts_with(&root);
    let mut rec = Recorder::new(&label);
    let mut out = vec![];
    let mut systems = std::collections::HashSet::new();
    let sys_of = |p: &Path| -> Option<String> {
        p.strip_prefix(root.join("roms")).ok().and_then(|x| x.components().next()).map(|c| c.as_os_str().to_string_lossy().to_string())
    };
    tokio::task::block_in_place(|| {
        for op in &ops {
            let from = PathBuf::from(&op.from);
            let to = PathBuf::from(&op.to);
            let res: Result<PathBuf, String> = match op.kind.as_str() {
                "move" if inside(&to) && (inside(&from) || from.exists()) => rec.mv(&from, &journal::free_name(&to)),
                "copy" if inside(&to) || inside(&from) => rec.cp(&from, &journal::free_name(&to)),
                "mkdir" if inside(&from) => std::fs::create_dir_all(&from).map(|_| from.clone()).map_err(|e| e.to_string()),
                "delete" if inside(&from) => {
                    if from.is_dir() { std::fs::remove_dir_all(&from) } else { std::fs::remove_file(&from) }.map(|_| from.clone()).map_err(|e| e.to_string())
                }
                _ => Err("Not allowed outside the main folder".into()),
            };
            for p in [&from, &to] {
                if let Some(s) = sys_of(p) {
                    systems.insert(s);
                }
            }
            match res {
                Ok(p) => out.push(OpResult { ok: true, path: p.to_string_lossy().into(), error: String::new() }),
                Err(e) => out.push(OpResult { ok: false, path: String::new(), error: e }),
            }
        }
    });
    let changed = rec.changed();
    rec.commit();
    // folders in the inbox that are empty now go away
    let inbox = root.join("inbox");
    if ops.iter().any(|o| Path::new(&o.from).starts_with(&inbox)) {
        fn prune(d: &Path, keep: &Path) {
            if let Ok(rd) = std::fs::read_dir(d) {
                for e in rd.flatten() {
                    if e.path().is_dir() {
                        prune(&e.path(), keep);
                    }
                }
            }
            if d != keep {
                let _ = std::fs::remove_dir(d);
            }
        }
        prune(&inbox, &inbox);
    }
    let systems: Vec<String> = systems.into_iter().filter(|s| !s.starts_with('_')).collect();
    let c: &Core = &core;
    tokio::task::block_in_place(|| cmds::rescan_pub(c, &systems));
    let errs = out.iter().filter(|o| !o.ok).count();
    if changed || errs > 0 {
        core.log(format!("{label}{}", if errs > 0 { format!(" ({errs} not done)") } else { String::new() }));
    }
    Ok(out)
}

#[tauri::command]
pub fn read_text(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[derive(Serialize)]
pub struct Picked {
    name: String,
    path: String,
    size: u64,
    is_dir: bool,
}

/// Name and size of files the person picked or dropped (the web view doesn't know them).
#[tauri::command]
pub fn file_info(paths: Vec<String>) -> Vec<Picked> {
    paths
        .into_iter()
        .map(|p| {
            let pb = PathBuf::from(&p);
            let md = pb.metadata().ok();
            Picked {
                name: pb.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                size: md.as_ref().map(|m| m.len()).unwrap_or(0),
                is_dir: md.map(|m| m.is_dir()).unwrap_or(false),
                path: p,
            }
        })
        .collect()
}

/// Everything inside folders that were dropped or picked.
#[tauri::command]
pub fn list_tree(path: String) -> Vec<Picked> {
    let mut v = vec![];
    walk(Path::new(&path), &mut v);
    v.into_iter()
        .map(|p| Picked {
            name: p.file_name().unwrap().to_string_lossy().into(),
            size: p.metadata().map(|m| m.len()).unwrap_or(0),
            is_dir: false,
            path: p.to_string_lossy().into(),
        })
        .collect()
}

/// Your app list plus the files you ticked, in one .zip (files are stored as they are).
#[tauri::command]
pub async fn export_zip(path: String, json: String, files: Vec<String>) -> Result<usize, String> {
    use std::io::Write;
    tokio::task::block_in_place(|| {
        let f = std::fs::File::create(&path).map_err(|e| e.to_string())?;
        let mut z = zip::ZipWriter::new(f);
        let opt = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored).large_file(true);
        z.start_file("emu-vault-apps.json", opt).map_err(|e| e.to_string())?;
        z.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
        let mut n = 0;
        for p in &files {
            let pb = PathBuf::from(p);
            let root = pb.ancestors().find(|a| a.file_name().map(|n| n == "Apps").unwrap_or(false)).map(|a| a.to_path_buf());
            let name = root
                .and_then(|r| pb.strip_prefix(r.parent().unwrap()).ok().map(|x| x.to_string_lossy().to_string()))
                .unwrap_or_else(|| pb.file_name().unwrap().to_string_lossy().to_string());
            let mut src = std::fs::File::open(&pb).map_err(|e| format!("{p}: {e}"))?;
            z.start_file(name, opt).map_err(|e| e.to_string())?;
            std::io::copy(&mut src, &mut z).map_err(|e| e.to_string())?;
            n += 1;
        }
        z.finish().map_err(|e| e.to_string())?;
        Ok(n)
    })
}

#[derive(Serialize)]
pub struct Drive {
    name: String,
    path: String,
    free: u64,
    total: u64,
}

/// Drives and SD cards that are plugged in (/media/<you>/…, /run/media/<you>/…).
#[tauri::command]
pub fn list_drives() -> Vec<Drive> {
    let user = std::env::var("USER").unwrap_or_default();
    let mut out = vec![];
    for base in [format!("/media/{user}"), format!("/run/media/{user}"), "/media".to_string(), "/mnt".to_string()] {
        if let Ok(rd) = std::fs::read_dir(&base) {
            for e in rd.flatten() {
                let p = e.path();
                if !p.is_dir() || out.iter().any(|d: &Drive| d.path == p.to_string_lossy()) || e.file_name().to_string_lossy() == user {
                    continue;
                }
                let (free, total) = store::free_space(&p.to_string_lossy()).unwrap_or((0, 0));
                out.push(Drive { name: e.file_name().to_string_lossy().into(), path: p.to_string_lossy().into(), free, total });
            }
        }
    }
    out
}

#[derive(Serialize)]
pub struct DriveFile {
    /// folder relative to the drive folder, e.g. "roms/snes" or "Roms/GBA"
    dir: String,
    name: String,
    path: String,
    size: u64,
}

/// Every file on a drive folder (skipping media and system folders).
#[tauri::command]
pub async fn read_drive(path: String) -> Result<Vec<DriveFile>, String> {
    let base = PathBuf::from(&path);
    if !base.is_dir() {
        return Err(format!("{path} isn't there (is the drive still plugged in?)"));
    }
    tokio::task::block_in_place(|| {
        let mut v = vec![];
        fn walk2(d: &Path, out: &mut Vec<PathBuf>, depth: usize) {
            if depth > 6 {
                return;
            }
            if let Ok(rd) = std::fs::read_dir(d) {
                for e in rd.flatten() {
                    let n = e.file_name().to_string_lossy().to_lowercase();
                    if n.starts_with('.')
                        || [
                            "media",
                            "images",
                            "videos",
                            "manuals",
                            "downloaded_media",
                            "thumbnails",
                            "_duplicates",
                            "android",
                            "lost+found",
                            "system volume information",
                        ]
                        .contains(&n.as_str())
                    {
                        continue;
                    }
                    let p = e.path();
                    if p.is_dir() {
                        walk2(&p, out, depth + 1)
                    } else {
                        out.push(p)
                    }
                }
            }
        }
        walk2(&base, &mut v, 0);
        Ok(v.into_iter()
            .filter_map(|p| {
                let rel = p.strip_prefix(&base).ok()?.to_path_buf();
                let dir = rel.parent().map(|x| x.to_string_lossy().to_string()).unwrap_or_default();
                Some(DriveFile {
                    dir,
                    name: p.file_name()?.to_string_lossy().into(),
                    size: p.metadata().map(|m| m.len()).unwrap_or(0),
                    path: p.to_string_lossy().into(),
                })
            })
            .collect())
    })
}

#[derive(Serialize)]
pub struct Found {
    id: String,
    /// bios | roms | saves | apps
    kind: String,
    path: String,
    what: String,
    n: usize,
    note: String,
    mb: f64,
}

/// Looks in the usual places for what you already have: BIOS folders, ROM folders, save folders, installers.
#[tauri::command]
pub async fn find_setup(core: tauri::State<'_, Core>) -> Result<Vec<Found>, String> {
    let root = PathBuf::from(core.cfg.lock().unwrap().root.clone());
    let home = dirs::home_dir().unwrap_or_default();
    tokio::task::block_in_place(|| {
        let mut out: Vec<Found> = vec![];
        let count = |d: &Path, exts: &[&str]| -> (usize, u64, Vec<String>) {
            let mut v = vec![];
            walk(d, &mut v);
            let mut n = 0;
            let mut b = 0;
            let mut subs = std::collections::BTreeSet::new();
            for p in v {
                let e = p.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
                if exts.is_empty() || exts.contains(&e.as_str()) {
                    n += 1;
                    b += p.metadata().map(|m| m.len()).unwrap_or(0);
                    if let Some(s) = p.strip_prefix(d).ok().and_then(|r| if r.components().count() > 1 { r.components().next() } else { None }) {
                        subs.insert(s.as_os_str().to_string_lossy().to_string());
                    }
                }
            }
            (n, b, subs.into_iter().collect())
        };
        let mut add = |kind: &str, p: PathBuf, what: &str, exts: &[&str], note: &dyn Fn(usize, &[String]) -> String| {
            if !p.is_dir() || p.starts_with(&root) || out.iter().any(|f| Path::new(&f.path) == p) {
                return;
            }
            let (n, b, subs) = count(&p, exts);
            if n == 0 {
                return;
            }
            out.push(Found {
                id: format!("{kind}{}", out.len()),
                kind: kind.into(),
                path: p.to_string_lossy().into(),
                what: what.into(),
                n,
                note: note(n, &subs),
                mb: b as f64 / 1_048_576.0,
            });
        };
        for rel in [
            ".config/retroarch/system",
            ".var/app/org.libretro.RetroArch/config/retroarch/system",
            "RetroArch/system",
            "Emulation/bios",
            "retrodeck/bios",
            ".local/share/duckstation/bios",
            ".config/PCSX2/bios",
        ] {
            add("bios", home.join(rel), "BIOS files", &[], &|_, _| "Copied by fingerprint: only real BIOS files, under the right name".into());
        }
        for rel in ["ROMs", "Roms", "roms", "Games/ROMs", "Games/roms", "Emulation/roms", "retrodeck/roms", "RetroPie/roms"] {
            add("roms", home.join(rel), "games", &[], &|_, subs| {
                if subs.is_empty() {
                    "in one folder".into()
                } else {
                    format!("{} folders: {}", subs.len(), subs.iter().take(6).cloned().collect::<Vec<_>>().join(", "))
                }
            });
        }
        for d in list_drives() {
            for rel in ["roms", "Roms", "ROMs"] {
                add("roms", PathBuf::from(&d.path).join(rel), "games", &[], &|_, subs| format!("on {} · {} folders", d.name, subs.len()));
            }
        }
        for s in crate::extras::detect_sources() {
            add("saves", PathBuf::from(&s.path), "saves", &[], &|_, _| format!("for {}", s.label));
        }
        add("apps", home.join("Downloads"), "emulator installers", &["apk", "appimage", "deb", "flatpak"], &|_, _| "AppImage, APK and .deb files".into());
        Ok(out)
    })
}

/// Where games and BIOS files go on a device with a given folder layout: system -> (roms folder, bios folder).
#[tauri::command]
pub fn device_dirs(target: String, layout: String, systems: Vec<String>) -> std::collections::HashMap<String, (String, String)> {
    let l = if layout == "ra" { "retroarch".to_string() } else { layout };
    systems
        .into_iter()
        .map(|s| {
            let (r, b) = crate::extras::device_dirs(&target, &l, &s);
            (s, (r.to_string_lossy().to_string(), b.to_string_lossy().to_string()))
        })
        .collect()
}

/// For checking the screens inside the real web view: a file to write a report to (EMUVAULT_SELFTEST).
#[tauri::command]
pub fn selftest_path() -> String {
    std::env::var("EMUVAULT_SELFTEST").unwrap_or_default()
}
