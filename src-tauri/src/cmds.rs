//! Commands for ROMs, collection, covers, backups, devices and settings files.

use crate::extras::{self, Profile};
use crate::journal::{self, Recorder};
use crate::lists;
use crate::roms::{self, RomFile};
use crate::{library, store, Core};
use futures_util::StreamExt;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use tauri::Emitter;

type Res<T> = Result<T, String>;

pub fn load_hashes() -> HashMap<String, (u64, i64, Vec<u32>)> {
    std::fs::read(store::app_dir().join("hashes.json")).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
}
fn save_hashes(core: &Core) {
    let h = core.hashes.lock().unwrap();
    let _ = std::fs::create_dir_all(store::app_dir());
    let _ = std::fs::write(store::app_dir().join("hashes.json"), serde_json::to_vec(&*h).unwrap());
}
fn root(core: &Core) -> String {
    core.cfg.lock().unwrap().root.clone()
}
fn order(core: &Core) -> Vec<String> {
    core.cfg.lock().unwrap().regions.clone()
}

fn system_name(id: &str) -> String {
    library::systems()
        .into_iter()
        .find(|s| s.id == id)
        .map(|s| if s.maker.is_empty() || s.name.starts_with(&s.maker) || s.maker == "Arcade" { s.name } else { format!("{} {}", s.maker, s.name) })
        .unwrap_or_else(|| id.to_string())
}

/// Systems that have a folder in roms/.
fn rom_systems(root: &str) -> Vec<String> {
    let mut v: Vec<String> = std::fs::read_dir(Path::new(root).join("roms"))
        .map(|rd| {
            rd.flatten()
                .filter(|e| e.path().is_dir())
                .map(|e| e.file_name().to_string_lossy().to_string())
                .filter(|n| !n.starts_with('.') && !n.starts_with('_'))
                .collect()
        })
        .unwrap_or_default();
    for (_, s) in roms::extra_dirs() {
        if !v.contains(&s) {
            v.push(s);
        }
    }
    v.sort();
    v
}

pub fn rescan_pub(core: &Core, systems: &[String]) {
    rescan(core, systems)
}
pub fn rom_systems_pub(root: &str) -> Vec<String> {
    rom_systems(root)
}
pub fn save_hashes_pub(core: &Core) {
    save_hashes(core)
}

fn rescan(core: &Core, systems: &[String]) {
    let r = root(core);
    for s in systems {
        let files = roms::scan_system(&r, s, &core.hashes);
        core.lib.lock().unwrap().insert(s.clone(), files);
    }
    save_hashes(core);
}

#[derive(Serialize)]
pub struct SysSummary {
    id: String,
    name: String,
    games: usize,
    bytes: u64,
    ok: usize,
    unknown: usize,
    bad: usize,
    different: usize,
    in_db: bool,
    kind: String,
}

#[derive(Serialize)]
pub struct LibSummary {
    scanned: String,
    systems: Vec<SysSummary>,
    games: usize,
    bytes: u64,
    dups: usize,
    copies: usize,
    multidisc: usize,
    inbox: usize,
    covers_missing: usize,
}

fn summary(core: &Core) -> LibSummary {
    let lib = core.lib.lock().unwrap().clone();
    let cfg = core.cfg.lock().unwrap().clone();
    let d = roms::db();
    let mut systems: Vec<SysSummary> = lib
        .iter()
        .filter(|(_, v)| !v.is_empty())
        .map(|(id, v)| SysSummary {
            id: id.clone(),
            name: system_name(id),
            games: v.len(),
            bytes: v.iter().map(|f| f.size).sum(),
            ok: v.iter().filter(|f| f.check == "ok").count(),
            unknown: v.iter().filter(|f| f.check == "unknown").count(),
            bad: v.iter().filter(|f| f.check == "bad").count(),
            different: v.iter().filter(|f| f.check == "different").count(),
            in_db: d.systems.contains_key(id),
            kind: d.systems.get(id).map(|s| s.kind.clone()).unwrap_or_default(),
        })
        .collect();
    systems.sort_by(|a, b| a.name.cmp(&b.name));
    let all: Vec<RomFile> = lib.values().flatten().cloned().collect();
    // per system: the same title on two systems is not a duplicate
    let dups: Vec<roms::DupGroup> = lib.values().flat_map(|v| roms::find_dups(v, &cfg.regions, true, cfg.keep_langs)).collect();
    let copies = dups.iter().map(|g| g.extra.iter().filter(|e| e.2 == "exact copy").count()).sum();
    let inbox_dir = Path::new(&cfg.root).join("inbox");
    let mut inbox = 0;
    let mut stack = vec![inbox_dir];
    while let Some(d) = stack.pop() {
        if let Ok(rd) = std::fs::read_dir(&d) {
            for e in rd.flatten() {
                if e.path().is_dir() {
                    stack.push(e.path());
                } else if !e.file_name().to_string_lossy().starts_with('.') {
                    inbox += 1;
                }
            }
        }
    }
    LibSummary {
        scanned: core.lib_time.lock().unwrap().clone(),
        games: systems.iter().map(|s| s.games).sum(),
        bytes: systems.iter().map(|s| s.bytes).sum(),
        systems,
        dups: dups.iter().filter(|g| !g.extra.is_empty()).count(),
        copies,
        multidisc: roms::find_multidisc(&all).iter().filter(|m| m.ready()).count(),
        inbox,
        covers_missing: extras::cover_jobs(&lib, &cfg.covers).0.iter().filter(|j| j.kind == "covers").count(),
    }
}

#[tauri::command]
pub async fn scan_library(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Res<LibSummary> {
    let r = root(&core);
    let systems = rom_systems(&r);
    let n = systems.len();
    let c: &Core = &core;
    for (i, s) in systems.iter().enumerate() {
        let _ = app.emit("scan-progress", (i + 1, n, system_name(s)));
        let files = tokio::task::block_in_place(|| roms::scan_system(&r, s, &c.hashes));
        core.lib.lock().unwrap().insert(s.clone(), files);
    }
    // forget systems whose folder is gone
    core.lib.lock().unwrap().retain(|k, _| systems.contains(k));
    *core.lib_time.lock().unwrap() = store::now();
    save_hashes(&core);
    let s = tokio::task::block_in_place(|| summary(c));
    core.log(format!("Library scanned: {} games in {} systems", s.games, s.systems.len()));
    Ok(s)
}

#[tauri::command]
pub async fn library_summary(core: tauri::State<'_, Core>) -> Res<LibSummary> {
    let c: &Core = &core;
    Ok(tokio::task::block_in_place(|| summary(c)))
}

#[tauri::command]
pub fn list_files(core: tauri::State<Core>, sys: String) -> Vec<RomFile> {
    core.lib.lock().unwrap().get(&sys).cloned().unwrap_or_default()
}

#[tauri::command]
pub fn find_duplicates(core: tauri::State<Core>, one_g_one_r: bool) -> Vec<roms::DupGroup> {
    let cfg = core.cfg.lock().unwrap().clone();
    let lib = core.lib.lock().unwrap().clone();
    let mut out = vec![];
    for files in lib.values() {
        out.extend(roms::find_dups(files, &cfg.regions, one_g_one_r, cfg.keep_langs));
    }
    out.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    out
}

fn find_rom(core: &Core, path: &str) -> Option<RomFile> {
    core.lib.lock().unwrap().values().flatten().find(|f| f.path == path).cloned()
}

/// The thing to move for a game: the file, or the whole "Game.m3u" folder.
fn game_top(f: &RomFile) -> PathBuf {
    let p = Path::new(&f.path);
    if p.parent().and_then(|d| d.extension()).map(|e| e.eq_ignore_ascii_case("m3u")).unwrap_or(false) {
        p.parent().unwrap().to_path_buf()
    } else {
        p.to_path_buf()
    }
}

#[tauri::command]
pub async fn move_to_duplicates(core: tauri::State<'_, Core>, paths: Vec<String>) -> Res<usize> {
    let r = root(&core);
    let mut rec = Recorder::new(&format!("Moved {} file{} to _duplicates", paths.len(), if paths.len() == 1 { "" } else { "s" }));
    let mut systems = HashSet::new();
    let mut n = 0;
    let mut errs = vec![];
    for p in &paths {
        let Some(f) = find_rom(&core, p) else { continue };
        let base = Path::new(&r).join("roms").join(&f.sys);
        let top = game_top(&f);
        let rel = top.strip_prefix(&base).unwrap_or(&top).to_path_buf();
        let dest = base.join("_duplicates").join(&rel);
        match rec.mv(&top, &dest) {
            Ok(to) => {
                n += 1;
                for part in &f.parts {
                    let pp = Path::new(part);
                    if pp.exists() && !pp.starts_with(&top) {
                        let _ = rec.mv(pp, &to.parent().unwrap().join(pp.file_name().unwrap()));
                    }
                }
            }
            Err(e) => errs.push(e),
        }
        systems.insert(f.sys.clone());
    }
    rec.batch.label = format!("Moved {n} game{} to _duplicates", if n == 1 { "" } else { "s" });
    let label = rec.batch.label.clone();
    rec.commit();
    let c: &Core = &core;
    tokio::task::block_in_place(|| rescan(c, &systems.into_iter().collect::<Vec<_>>()));
    core.log(label);
    if !errs.is_empty() {
        core.log(format!("Some files weren't moved: {}", errs.join("; ")));
    }
    Ok(n)
}

#[tauri::command]
pub fn find_multidisc(core: tauri::State<Core>) -> Vec<roms::MultiDisc> {
    let lib = core.lib.lock().unwrap().clone();
    let all: Vec<RomFile> = lib.values().flatten().cloned().collect();
    roms::find_multidisc(&all)
}

#[tauri::command]
pub async fn make_m3u(core: tauri::State<'_, Core>, names: Vec<String>) -> Res<usize> {
    let lib = core.lib.lock().unwrap().clone();
    let all: Vec<RomFile> = lib.values().flatten().cloned().collect();
    let todo: Vec<roms::MultiDisc> =
        roms::find_multidisc(&all).into_iter().filter(|m| m.ready()).filter(|m| names.is_empty() || names.contains(&format!("{}/{}", m.sys, m.name))).collect();
    let r = root(&core);
    let mut rec = Recorder::new("Multi-disc playlists made");
    let mut done = 0;
    let mut systems = HashSet::new();
    for m in &todo {
        let dir = Path::new(&r).join("roms").join(&m.sys).join(format!("{}.m3u", m.name));
        if dir.exists() {
            continue;
        }
        rec.mkdirs(&dir);
        let mut lines = vec![];
        for disc in &m.discs {
            let f = all.iter().find(|f| &f.path == disc).cloned();
            let p = Path::new(disc);
            if let Ok(to) = rec.mv(p, &dir.join(p.file_name().unwrap())) {
                lines.push(to.file_name().unwrap().to_string_lossy().to_string());
            }
            if let Some(f) = f {
                for part in &f.parts {
                    let pp = Path::new(part);
                    if pp.exists() {
                        let _ = rec.mv(pp, &dir.join(pp.file_name().unwrap()));
                    }
                }
            }
        }
        rec.write(&dir.join(format!("{}.m3u", m.name)), (lines.join("\n") + "\n").as_bytes())?;
        systems.insert(m.sys.clone());
        done += 1;
    }
    rec.batch.label = format!("Made {done} multi-disc playlist{}", if done == 1 { "" } else { "s" });
    let label = rec.batch.label.clone();
    rec.commit();
    let c: &Core = &core;
    tokio::task::block_in_place(|| rescan(c, &systems.into_iter().collect::<Vec<_>>()));
    if done > 0 {
        core.log(label);
    }
    Ok(done)
}

#[tauri::command]
pub async fn inbox_plan(app: tauri::AppHandle, core: tauri::State<'_, Core>, from: Option<String>) -> Res<Vec<roms::InboxItem>> {
    let r = root(&core);
    let from = from.unwrap_or_else(|| Path::new(&r).join("inbox").to_string_lossy().to_string());
    if !Path::new(&from).is_dir() {
        let _ = std::fs::create_dir_all(&from);
    }
    // the library must be known to spot games you already have
    if core.lib.lock().unwrap().is_empty() {
        let _ = app.emit("scan-progress", (0, 1, "your library".to_string()));
        let c: &Core = &core;
        tokio::task::block_in_place(|| rescan(c, &rom_systems(&r)));
        *core.lib_time.lock().unwrap() = store::now();
    }
    let lib = core.lib.lock().unwrap().clone();
    let ord = order(&core);
    let c: &Core = &core;
    let mut plan = tokio::task::block_in_place(|| roms::plan_inbox(&r, &from, &lib, &ord, &c.hashes, &c.md5));
    let names: Vec<String> = core.catalog.lock().unwrap().iter().map(|a| a.name.clone()).collect();
    for it in plan.iter_mut().filter(|i| i.state == "unknown") {
        if let Some((app, plat, ver)) = app_download(&names, &it.name) {
            it.state = "app".into();
            it.how = "app".into();
            it.sys = app.clone();
            it.dest = store::versions_dir(&r, &app, plat).join(store::safe(&ver)).join(&it.name).to_string_lossy().into();
            it.note = format!("Download of {app} {ver} ({})", store::plat_folder(plat));
        } else if APP_EXT.iter().any(|e| it.name.to_lowercase().ends_with(e)) {
            it.note = "Looks like an app download, but not of an app in your lists. Add the app in Apps first.".into();
        }
    }
    plan.sort_by(|a, b| a.state.cmp(&b.state).then(a.name.cmp(&b.name)));
    save_hashes(&core);
    *core.inbox.lock().unwrap() = plan.clone();
    Ok(plan)
}

const APP_EXT: &[&str] = &[".apk", ".appimage", ".deb", ".flatpak", ".flatpakref", ".rpm"];

/// "mGBA-0.10.6-appimage-x64.AppImage" -> ("mGBA", "linux", "0.10.6") when mGBA is in your lists.
fn app_download(apps: &[String], file: &str) -> Option<(String, &'static str, String)> {
    let low = file.to_lowercase();
    let ext = APP_EXT.iter().find(|e| low.ends_with(*e))?;
    let plat = if *ext == ".apk" { "android" } else { "linux" };
    let norm = |s: &str| s.chars().filter(|c| c.is_alphanumeric()).collect::<String>().to_lowercase();
    let f = norm(file);
    let app = apps
        .iter()
        .filter(|a| {
            let n = norm(a);
            n.len() >= 3 && f.starts_with(&n)
        })
        .max_by_key(|a| norm(a).len())?;
    let stem = &file[..file.len() - ext.len()];
    let ver = crate::re!(r"(?i)(?:^|[^a-z0-9])v?(\d+(?:\.\d+){1,3})")
        .captures(stem)
        .map(|c| c[1].to_string())
        .unwrap_or_else(|| format!("added {}", store::now()[..10].to_string()));
    Some((app.clone(), plat, ver))
}

/// Files that are of no use in the inbox when they come along inside a folder:
/// settings, text, pictures, music, saves, program parts.
const NOT_FOR_INBOX: &[&str] = &[
    "ini",
    "cfg",
    "conf",
    "config",
    "txt",
    "nfo",
    "diz",
    "md",
    "xml",
    "json",
    "yml",
    "yaml",
    "toml",
    "log",
    "db",
    "sqlite",
    "cache",
    "tmp",
    "bak",
    "lnk",
    "url",
    "desktop",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "webp",
    "ico",
    "svg",
    "tga",
    "psd",
    "pdf",
    "html",
    "htm",
    "css",
    "js",
    "py",
    "sh",
    "bat",
    "cmd",
    "ps1",
    "mp3",
    "ogg",
    "wav",
    "flac",
    "opus",
    "mp4",
    "mkv",
    "avi",
    "webm",
    "mov",
    "dll",
    "so",
    "dylib",
    "pdb",
    "ttf",
    "otf",
    "woff",
    "woff2",
    "lpl",
    "opt",
    "rmp",
    "slangp",
    "glslp",
    "cgp",
    "slang",
    "glsl",
    "sig",
    "sha1",
    "md5",
    "sfv",
    "part",
    "crdownload",
];

#[derive(Serialize)]
pub struct Taken {
    copied: usize,
    /// files inside folders that were left where they are (settings, pictures, saves…)
    skipped: usize,
}

/// Files and folders dropped on the Inbox (or chosen with a dialog) are copied into inbox/.
/// From folders only what Emu Vault can use comes along.
#[tauri::command]
pub async fn inbox_take(core: tauri::State<'_, Core>, paths: Vec<String>) -> Res<Taken> {
    let r = root(&core);
    let inbox = Path::new(&r).join("inbox");
    std::fs::create_dir_all(&inbox).map_err(|e| e.to_string())?;
    fn useful(p: &Path) -> bool {
        let n = p.file_name().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
        if n.starts_with('.') {
            return false;
        }
        let ext = n.rsplit_once('.').map(|(_, e)| e.to_string()).unwrap_or_default();
        !NOT_FOR_INBOX.contains(&ext.as_str())
    }
    fn copy_in(from: &Path, to: &Path, n: &mut usize, skipped: &mut usize, in_folder: bool) -> std::io::Result<()> {
        if from.is_dir() {
            for e in std::fs::read_dir(from)?.flatten() {
                let name = e.file_name().to_string_lossy().to_lowercase();
                if name.starts_with('.')
                    || [
                        "_duplicates",
                        "media",
                        "downloaded_media",
                        "thumbnails",
                        "screenshots",
                        "shaders",
                        "cores",
                        "info",
                        "overlays",
                        "assets",
                        "saves",
                        "states",
                        "config",
                    ]
                    .contains(&name.as_str())
                {
                    continue;
                }
                copy_in(&e.path(), &to.join(e.file_name()), n, skipped, true)?;
            }
        } else if in_folder && !useful(from) {
            *skipped += 1;
        } else if !to.exists() {
            if let Some(d) = to.parent() {
                std::fs::create_dir_all(d)?;
            }
            std::fs::copy(from, to)?;
            *n += 1;
        }
        Ok(())
    }
    let mut n = 0;
    let mut skipped = 0;
    let mut errs = vec![];
    tokio::task::block_in_place(|| {
        for p in &paths {
            let src = Path::new(p);
            if src.starts_with(&inbox) {
                continue;
            }
            let Some(name) = src.file_name() else { continue };
            if let Err(e) = copy_in(src, &inbox.join(name), &mut n, &mut skipped, false) {
                errs.push(format!("{}: {e}", name.to_string_lossy()));
            }
        }
    });
    core.log(format!(
        "{n} file{} put in the inbox{}",
        if n == 1 { "" } else { "s" },
        if skipped > 0 { format!(" ({skipped} settings, pictures and other files left where they are)") } else { String::new() }
    ));
    if !errs.is_empty() {
        core.log(format!("Not copied: {}", errs.join("; ")));
    }
    Ok(Taken { copied: n, skipped })
}

#[derive(Serialize)]
pub struct Applied {
    added: usize,
    to_duplicates: usize,
    skipped: usize,
    errors: Vec<String>,
}

#[tauri::command]
pub async fn inbox_apply(core: tauri::State<'_, Core>, srcs: Vec<String>, mode: String, other: String) -> Res<Applied> {
    let r = root(&core);
    let plan = core.inbox.lock().unwrap().clone();
    let copy = mode == "copy";
    let mut rec = Recorder::new(if copy { "Games copied into your library" } else { "Inbox sorted" });
    let mut out = Applied { added: 0, to_duplicates: 0, skipped: 0, errors: vec![] };
    let mut systems = HashSet::new();
    let lib = core.lib.lock().unwrap().clone();
    for it in plan.iter().filter(|i| srcs.contains(&i.src)) {
        let src = Path::new(&it.src);
        if !src.exists() {
            continue;
        }
        let dup_dir = Path::new(&r).join("roms").join(&it.sys).join("_duplicates");
        let put = |rec: &mut Recorder, from: &Path, to: &Path| -> Result<PathBuf, String> {
            if copy {
                rec.cp(from, to)
            } else {
                rec.mv(from, to)
            }
        };
        let with_parts = |rec: &mut Recorder, to: &Path| {
            for part in &it.parts {
                let pp = Path::new(part);
                if pp.exists() {
                    let dest = to.parent().unwrap().join(pp.file_name().unwrap());
                    let _ = if copy { rec.cp(pp, &dest) } else { rec.mv(pp, &dest) };
                }
            }
        };
        let res: Result<&str, String> = (|| {
            match it.state.as_str() {
                "new" | "bios" => {
                    let to = put(&mut rec, src, Path::new(&it.dest))?;
                    with_parts(&mut rec, &to);
                    Ok("added")
                }
                "app" => {
                    let to = put(&mut rec, src, Path::new(&it.dest))?;
                    let ver = to.parent().and_then(|d| d.file_name()).map(|v| v.to_string_lossy().to_string()).unwrap_or_default();
                    let sha = {
                        use sha2::{Digest, Sha256};
                        let mut h = Sha256::new();
                        if let Ok(mut f) = std::fs::File::open(&to) {
                            let _ = std::io::copy(&mut f, &mut h);
                        }
                        hex::encode(h.finalize())
                    };
                    let meta = store::Stored {
                        version: ver,
                        date: String::new(),
                        file: it.name.clone(),
                        path: String::new(),
                        size: it.size,
                        sha256: sha,
                        url: String::new(),
                        downloaded: store::now(),
                        hand: false,
                    };
                    let mp = to.parent().unwrap().join(store::META);
                    store::write_json(&mp, &meta)?;
                    rec.batch.made.push(mp.to_string_lossy().to_string());
                    let keep = core.cfg.lock().unwrap().keep;
                    let plat = if it.name.to_lowercase().ends_with(".apk") { "android" } else { "linux" };
                    for v in store::prune(&r, &it.sys, plat, keep) {
                        core.log(format!("{} {v} removed (keep {keep})", it.sys));
                    }
                    Ok("added")
                }
                "same" => {
                    if copy {
                        return Ok("skipped");
                    }
                    let to = rec.mv(src, &dup_dir.join(&it.name))?;
                    with_parts(&mut rec, &to);
                    Ok("dup")
                }
                "other" => {
                    if other == "both" || (other == "rule" && it.better) {
                        if other == "rule" {
                            // the one you had goes to _duplicates
                            if let Some(old) = lib.get(&it.sys).and_then(|v| v.iter().find(|f| f.name == it.have)) {
                                let top = game_top(old);
                                let base = Path::new(&r).join("roms").join(&it.sys);
                                let rel = top.strip_prefix(&base).unwrap_or(&top).to_path_buf();
                                let moved = rec.mv(&top, &base.join("_duplicates").join(rel))?;
                                for part in &old.parts {
                                    let pp = Path::new(part);
                                    if pp.exists() {
                                        let _ = rec.mv(pp, &moved.parent().unwrap().join(pp.file_name().unwrap()));
                                    }
                                }
                            }
                        }
                        let to = put(&mut rec, src, Path::new(&it.dest))?;
                        with_parts(&mut rec, &to);
                        Ok("added")
                    } else if copy {
                        Ok("skipped")
                    } else {
                        let to = rec.mv(src, &dup_dir.join(&it.name))?;
                        with_parts(&mut rec, &to);
                        Ok("dup")
                    }
                }
                _ => Ok("skipped"),
            }
        })();
        match res {
            Ok("added") => {
                out.added += 1;
                if it.state != "bios" && it.state != "app" {
                    systems.insert(it.sys.clone());
                }
            }
            Ok("dup") => {
                out.to_duplicates += 1;
                systems.insert(it.sys.clone());
            }
            Ok(_) => out.skipped += 1,
            Err(e) => out.errors.push(format!("{}: {e}", it.name)),
        }
    }
    rec.batch.label = format!(
        "{}: {} added{}",
        if copy { "Copied from drive" } else { "Inbox" },
        out.added,
        if out.to_duplicates > 0 { format!(", {} to _duplicates", out.to_duplicates) } else { String::new() }
    );
    let label = rec.batch.label.clone();
    rec.commit();
    let c: &Core = &core;
    tokio::task::block_in_place(|| rescan(c, &systems.into_iter().collect::<Vec<_>>()));
    core.log(label);
    // clean empty folders in the inbox
    if !copy {
        let inbox = Path::new(&r).join("inbox");
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
    Ok(out)
}

#[tauri::command]
pub fn recent_changes() -> Vec<journal::Batch> {
    journal::load().batches.into_iter().take(60).collect()
}

#[tauri::command]
pub async fn undo_change(core: tauri::State<'_, Core>, id: String) -> Res<(usize, Vec<String>)> {
    let label = journal::load().batches.iter().find(|b| b.id == id).map(|b| b.label.clone()).unwrap_or_default();
    let r = journal::undo(&id)?;
    let c: &Core = &core;
    let root_ = root(c);
    tokio::task::block_in_place(|| rescan(c, &rom_systems(&root_)));
    core.log(format!("Undone: {label}"));
    Ok(r)
}

#[tauri::command]
pub async fn empty_duplicates(core: tauri::State<'_, Core>) -> Res<usize> {
    let r = root(&core);
    let mut n = 0;
    for s in rom_systems(&r) {
        let d = Path::new(&r).join("roms").join(&s).join("_duplicates");
        if d.is_dir() {
            let mut files = vec![];
            fn walk(d: &Path, out: &mut usize) {
                if let Ok(rd) = std::fs::read_dir(d) {
                    for e in rd.flatten() {
                        if e.path().is_dir() {
                            walk(&e.path(), out)
                        } else {
                            *out += 1
                        }
                    }
                }
            }
            let mut k = 0;
            walk(&d, &mut k);
            files.push(k);
            if std::fs::remove_dir_all(&d).is_ok() {
                n += k;
            }
        }
    }
    let mut j = journal::load();
    for b in j.batches.iter_mut() {
        if b.moves.iter().any(|(_, t)| t.contains("/_duplicates/")) {
            b.purged = true;
        }
    }
    journal::save(&j);
    core.log(format!("Emptied _duplicates: {n} files deleted"));
    Ok(n)
}

// ------------------------------------------------------------------ collection

/// Games you have in a system: canonical key -> best region rank of your files, and the file name.
fn have_keys(core: &Core, sys: &str) -> HashMap<String, (usize, String)> {
    let ord = order(core);
    let mut m: HashMap<String, (usize, String)> = HashMap::new();
    if let Some(v) = core.lib.lock().unwrap().get(sys) {
        for f in v {
            if !f.p.special.is_empty() || f.p.bad {
                continue;
            }
            let k = lists::canon(sys, &f.p.key);
            let r = roms::region_rank(&f.p.regions, &ord);
            let e = m.entry(k).or_insert((usize::MAX, String::new()));
            if r < e.0 {
                *e = (r, f.name.clone());
            }
        }
    }
    m
}

const REG_NAMES: [(u8, &str, &str); 5] = [(1, "US", "USA"), (2, "EU", "Europe"), (4, "JP", "Japan"), (8, "W", "World"), (16, "OV", "Other")];

/// When your copy isn't in your first-choice region but the list has a better one: that region's name.
fn better_region(bits: u8, have_rank: usize, ord: &[String]) -> String {
    let mut best: Option<(usize, &str)> = None;
    for (b, code, name) in REG_NAMES {
        if bits & b != 0 {
            let r = roms::region_rank(&[code.to_string()], ord);
            if best.map(|x| r < x.0).unwrap_or(true) {
                best = Some((r, name));
            }
        }
    }
    match best {
        Some((r, n)) if r < have_rank => n.to_string(),
        _ => String::new(),
    }
}

#[derive(Serialize)]
pub struct CollSys {
    id: String,
    name: String,
    have: usize,
    total: usize,
    in_folder: usize,
    /// games you have where a version in a better region exists
    upgrades: usize,
}

fn shown_by(g: &lists::Row, mask: u8, unl: bool, test: bool) -> bool {
    (g.regions & mask != 0 || g.regions == 0) && (g.cat == 0 || (g.cat == 1 && unl) || (g.cat == 2 && test))
}

#[tauri::command]
pub async fn collection_overview(core: tauri::State<'_, Core>, mask: u8, unl: bool, test: bool, all: bool) -> Res<Vec<CollSys>> {
    let systems: Vec<String> = if all {
        roms::db().systems.keys().cloned().collect()
    } else {
        core.lib.lock().unwrap().iter().filter(|(_, v)| !v.is_empty()).map(|(k, _)| k.clone()).collect()
    };
    let c: &Core = &core;
    let ord = order(c);
    let mut out: Vec<CollSys> = tokio::task::block_in_place(|| {
        systems
            .iter()
            .filter(|s| roms::db().systems.contains_key(*s))
            .map(|s| {
                let list = lists::list_for(s);
                let have = have_keys(c, s);
                let shown: Vec<&lists::Row> = list.rows.iter().filter(|g| shown_by(g, mask, unl, test)).collect();
                CollSys {
                    id: s.clone(),
                    name: system_name(s),
                    have: shown.iter().filter(|g| have.contains_key(&g.key)).count(),
                    total: shown.len(),
                    in_folder: c.lib.lock().unwrap().get(s).map(|v| v.len()).unwrap_or(0),
                    upgrades: shown.iter().filter(|g| have.get(&g.key).map(|h| !better_region(g.regions, h.0, &ord).is_empty()).unwrap_or(false)).count(),
                }
            })
            .filter(|x| x.total > 0)
            .collect()
    });
    out.sort_by(|a, b| b.in_folder.cmp(&a.in_folder).then(a.name.cmp(&b.name)));
    Ok(out)
}

#[derive(Serialize)]
pub struct CollRow {
    title: String,
    regions: u8,
    cat: u8,
    have: bool,
    /// the file you have
    file: String,
    /// other names (another region's title)
    alts: Vec<String>,
    /// "merged by you" / "added by you"
    mine: String,
    /// a version in a region you rank higher exists, e.g. "USA"
    better: String,
}
#[derive(Serialize)]
pub struct CollPage {
    rows: Vec<CollRow>,
    total: usize,
    have: usize,
    shown: usize,
    upgrades: usize,
    /// regional names merged by the built-in clone lists
    merged_names: usize,
    /// your changes: lists/<system>.txt
    edits: String,
    edits_file: String,
    hidden: usize,
    merged: usize,
    added: usize,
    bad: Vec<usize>,
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn collection_list(
    core: tauri::State<Core>,
    sys: String,
    show: String,
    mask: u8,
    unl: bool,
    test: bool,
    q: String,
    offset: usize,
    limit: usize,
) -> CollPage {
    let list = lists::list_for(&sys);
    let have = have_keys(&core, &sys);
    let ord = order(&core);
    let ql = roms::title_key(&q);
    let base: Vec<&lists::Row> = list.rows.iter().filter(|g| shown_by(g, mask, unl, test)).collect();
    let better = |g: &lists::Row| have.get(&g.key).map(|h| better_region(g.regions, h.0, &ord)).unwrap_or_default();
    let total = base.len();
    let have_n = base.iter().filter(|g| have.contains_key(&g.key)).count();
    let upgrades = base.iter().filter(|g| !better(g).is_empty()).count();
    let rows: Vec<&&lists::Row> = base
        .iter()
        .filter(|g| match show.as_str() {
            "have" => have.contains_key(&g.key),
            "missing" => !have.contains_key(&g.key),
            "better" => !better(g).is_empty(),
            _ => true,
        })
        .filter(|g| ql.is_empty() || roms::title_key(&g.title).contains(&ql) || g.alts.iter().any(|a| roms::title_key(a).contains(&ql)))
        .collect();
    let r = root(&core);
    CollPage {
        shown: rows.len(),
        rows: rows
            .iter()
            .skip(offset)
            .take(limit)
            .map(|g| CollRow {
                title: g.title.clone(),
                regions: g.regions,
                cat: g.cat,
                have: have.contains_key(&g.key),
                file: have.get(&g.key).map(|h| h.1.clone()).unwrap_or_default(),
                alts: g.alts.clone(),
                mine: g.mine.clone(),
                better: better(g),
            })
            .collect(),
        total,
        have: have_n,
        upgrades,
        merged_names: lists::merged_names(&sys),
        edits: lists::edits_text(&sys).lines().filter(|l| !l.trim_start().starts_with('#')).collect::<Vec<_>>().join("\n"),
        edits_file: lists::edits_file(&r, &sys).to_string_lossy().into(),
        hidden: list.hidden,
        merged: list.merged,
        added: list.added,
        bad: list.bad.clone(),
    }
}

/// Save your changes to a system's list (lists/<system>.txt). Empty text removes the file.
#[tauri::command]
pub fn list_edits_save(core: tauri::State<Core>, sys: String, text: String) -> Res<()> {
    let r = root(&core);
    lists::save_edits(&r, &sys, &text).map_err(|e| format!("Couldn't save lists/{sys}.txt: {e}"))?;
    core.log(format!("{} list: your changes saved to lists/{sys}.txt", system_name(&sys)));
    Ok(())
}

/// A folder for a system Emu Vault doesn't have yet (roms/<id>/ and bios/<id>/).
#[tauri::command]
pub fn add_system(core: tauri::State<Core>, id: String) -> Res<String> {
    let id = id.trim().to_lowercase();
    if id.is_empty() || !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') || id.starts_with('_') {
        return Err("Use letters, numbers, - or _ for the folder name (for example: pokemini).".into());
    }
    let r = root(&core);
    for d in ["roms", "bios"] {
        std::fs::create_dir_all(Path::new(&r).join(d).join(&id)).map_err(|e| e.to_string())?;
    }
    core.lib.lock().unwrap().entry(id.clone()).or_default();
    core.log(format!("New system folder: roms/{id}/"));
    Ok(id)
}

// ------------------------------------------------------------------ covers

#[derive(Serialize)]
pub struct CoverStatus {
    missing: usize,
    have: usize,
}

#[tauri::command]
pub fn covers_status(core: tauri::State<Core>) -> CoverStatus {
    let lib = core.lib.lock().unwrap().clone();
    let cfg = core.cfg.lock().unwrap().covers.clone();
    let (j, have) = extras::cover_jobs(&lib, &cfg);
    CoverStatus { missing: j.len(), have }
}

#[tauri::command]
pub async fn covers_fetch(app: tauri::AppHandle, core: tauri::State<'_, Core>, skip: Option<Vec<String>>) -> Res<(usize, usize, Vec<String>)> {
    let lib = core.lib.lock().unwrap().clone();
    let cfg = core.cfg.lock().unwrap().covers.clone();
    let (mut jobs, _) = extras::cover_jobs(&lib, &cfg);
    // automatic runs leave out what wasn't found last time
    if let Some(skip) = skip.filter(|s| !s.is_empty()) {
        let skip: std::collections::HashSet<String> = skip.into_iter().collect();
        jobs.retain(|j| !skip.contains(&format!("{}|{}", j.kind, j.game)) && !(j.kind == "covers" && skip.contains(&j.game)));
    }
    let base = std::env::var("EMUVAULT_THUMBS").unwrap_or_else(|_| "https://thumbnails.libretro.com/".into());
    let total = jobs.len();
    let client = core.client.clone();
    let size = cfg.size;
    let futs: Vec<_> = jobs
        .into_iter()
        .map(|j| {
            let (client, base) = (client.clone(), base.clone());
            async move {
                let r = extras::fetch_cover(&client, &base, &j, size).await;
                (j, r)
            }
        })
        .collect();
    let mut s = futures_util::stream::iter(futs).buffer_unordered(4);
    let (mut got, mut miss, mut done) = (0, 0, 0);
    let mut not_found = vec![];
    let mut net_err = None;
    while let Some((j, r)) = s.next().await {
        done += 1;
        match r {
            Ok(true) => {
                if j.kind == "covers" {
                    got += 1
                }
            }
            Ok(false) => {
                if j.kind == "covers" {
                    miss += 1;
                }
                not_found.push(if j.kind == "covers" { j.game.clone() } else { format!("{}|{}", j.kind, j.game) });
            }
            Err(e) => {
                miss += 1;
                net_err = Some(e);
            }
        }
        let _ = app.emit("cover-progress", (done, total));
    }
    core.log(format!("Covers: {got} downloaded, {miss} not found"));
    if got == 0 {
        if let Some(e) = net_err {
            return Err(e);
        }
    }
    not_found.truncate(5000);
    Ok((got, miss, not_found))
}

// ------------------------------------------------------------------ backups

#[derive(Serialize)]
pub struct BackupStatus {
    sources: Vec<extras::SaveSource>,
    detected: Vec<extras::SaveSource>,
    snapshots: Vec<extras::Snapshot>,
    keep: usize,
    on_start: bool,
}

#[tauri::command]
pub fn backup_status(core: tauri::State<Core>) -> BackupStatus {
    let cfg = core.cfg.lock().unwrap().clone();
    BackupStatus {
        detected: extras::detect_sources_root(&cfg.root).into_iter().filter(|d| !cfg.save_sources.iter().any(|s| s.path == d.path)).collect(),
        snapshots: extras::list_snapshots(&cfg.root),
        sources: cfg.save_sources,
        keep: cfg.backup_keep,
        on_start: cfg.backup_on_start,
    }
}

#[tauri::command]
pub async fn backup_now(core: tauri::State<'_, Core>, force: bool) -> Res<Option<extras::Snapshot>> {
    let cfg = core.cfg.lock().unwrap().clone();
    let r = tokio::task::block_in_place(|| extras::snapshot(&cfg.root, &cfg.save_sources, cfg.backup_keep, "", force))?;
    match &r {
        Some(s) => core.log(format!("Saves backed up: {} files, {} MB", s.files, s.bytes / 1_048_576)),
        None => {}
    }
    Ok(r)
}

#[tauri::command]
pub async fn backup_restore(core: tauri::State<'_, Core>, id: String) -> Res<usize> {
    let r = root(&core);
    let n = tokio::task::block_in_place(|| extras::restore(&r, &id))?;
    core.log(format!("Saves put back from backup {id}: {n} files (your saves from just before are kept as a backup too)"));
    Ok(n)
}

// ------------------------------------------------------------------ devices

#[tauri::command]
pub async fn device_plan(core: tauri::State<'_, Core>, target: String, profile: Profile) -> Res<extras::DevPlan> {
    let r = root(&core);
    if core.lib.lock().unwrap().is_empty() {
        let c: &Core = &core;
        tokio::task::block_in_place(|| rescan(c, &rom_systems(&r)));
    }
    let lib = core.lib.lock().unwrap().clone();
    Ok(tokio::task::block_in_place(|| extras::device_plan(&r, &lib, &target, &profile)))
}

#[tauri::command]
pub async fn device_copy(app: tauri::AppHandle, core: tauri::State<'_, Core>, target: String, profile: Profile) -> Res<(usize, Vec<String>)> {
    let r = root(&core);
    let lib = core.lib.lock().unwrap().clone();
    let plan = tokio::task::block_in_place(|| extras::device_plan(&r, &lib, &target, &profile));
    if plan.bytes > plan.free {
        return Err(format!("Not enough space on the device: needs {} MB, {} MB free.", plan.bytes / 1_048_576, plan.free / 1_048_576));
    }
    let mut rec = Recorder::new(&format!("Copied to {} with profile {}", target, profile.name));
    let mut errs = vec![];
    let total = plan.items.len();
    let mut n = 0;
    for (i, it) in plan.items.iter().enumerate() {
        let _ = app.emit("device-progress", (i + 1, total));
        let res = tokio::task::block_in_place(|| -> Result<(), String> {
            let (from, to) = (Path::new(&it.src), Path::new(&it.dest));
            if it.is_dir {
                rec.mkdirs(to);
                for e in std::fs::read_dir(from).map_err(|e| e.to_string())?.flatten() {
                    rec.cp(&e.path(), &to.join(e.file_name()))?;
                }
                Ok(())
            } else {
                rec.cp(from, to).map(|_| ())
            }
        });
        match res {
            Ok(_) => n += 1,
            Err(e) => errs.push(e),
        }
    }
    rec.batch.label = format!("{n} items copied to {} (profile {})", target, profile.name);
    let label = rec.batch.label.clone();
    rec.commit();
    core.log(label);
    Ok((n, errs))
}

// ------------------------------------------------------------------ settings files, notifications, start-up

#[tauri::command]
pub fn export_settings(core: tauri::State<Core>, path: String) -> Res<()> {
    let mut c = core.cfg.lock().unwrap().clone();
    c.github_token = String::new();
    let v = serde_json::json!({"app": "Emu Vault", "kind": "settings", "version": 2, "exported": store::now(), "config": c});
    std::fs::write(&path, serde_json::to_vec_pretty(&v).unwrap()).map_err(|e| e.to_string())?;
    core.log(format!("Settings exported to {path} (without your GitHub token)"));
    Ok(())
}

#[tauri::command]
pub fn import_settings(core: tauri::State<Core>, path: String) -> Res<()> {
    let v: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&path).map_err(|e| e.to_string())?).map_err(|_| "This isn't an Emu Vault settings file.".to_string())?;
    if v.get("app").and_then(|x| x.as_str()) != Some("Emu Vault") {
        return Err("This isn't an Emu Vault settings file.".into());
    }
    let mut c: store::Config =
        serde_json::from_value(v.get("config").cloned().unwrap_or_default()).map_err(|e| format!("The settings file is damaged: {e}"))?;
    {
        let mut cur = core.cfg.lock().unwrap();
        // keep things that belong to this computer
        c.github_token = cur.github_token.clone();
        c.packs.retain(|p| Path::new(&p.file).exists());
        for p in &cur.packs {
            if !c.packs.iter().any(|x| x.name == p.name) {
                c.packs.push(p.clone());
            }
        }
        c.save_sources.retain(|s| Path::new(&s.path).is_dir());
        if c.save_sources.is_empty() {
            c.save_sources = cur.save_sources.clone();
        }
        *cur = c;
        store::save_config(&cur)?;
    }
    core.log(format!("Settings imported from {path}"));
    Ok(())
}

#[tauri::command]
pub fn notify(app: tauri::AppHandle, core: tauri::State<Core>, title: String, body: String) -> Res<()> {
    use tauri_plugin_notification::NotificationExt;
    if !core.cfg.lock().unwrap().notify {
        return Ok(());
    }
    app.notification().builder().title(title).body(body).show().map_err(|e| e.to_string())
}

#[derive(Serialize)]
pub struct Chores {
    purged: usize,
    backup: Option<extras::Snapshot>,
    backup_error: String,
}

/// Things done once when Emu Vault starts: empty old _duplicates, back up saves.
#[tauri::command]
pub async fn startup_chores(core: tauri::State<'_, Core>) -> Res<Chores> {
    let cfg = core.cfg.lock().unwrap().clone();
    let purged = journal::purge_old(cfg.trash_days);
    crate::esde::tidy_frontends(&core);
    crate::play::refresh(&core);
    if !cfg.root.is_empty() && Path::new(&cfg.root).is_dir() {
        let _ = std::fs::create_dir_all(Path::new(&cfg.root).join("patches"));
    }
    if purged > 0 {
        core.log(format!("_duplicates: {purged} files older than {} days deleted", cfg.trash_days));
    }
    let mut out = Chores { purged, backup: None, backup_error: String::new() };
    // saves: per folder, by the schedule in Backups
    if cfg.backup_when.is_empty() && !cfg.backup_on_start {
        core.cfg.lock().unwrap().backup_when = "manual".into();
    }
    let c: &Core = &core;
    let (n, files, errs) = tokio::task::block_in_place(|| crate::saves::run_due(c, true));
    if n > 0 {
        out.backup =
            Some(extras::Snapshot { id: String::new(), time: store::now(), files, bytes: 0, sources: vec![], fingerprint: String::new(), note: String::new() });
    }
    if !errs.is_empty() {
        out.backup_error = errs.join("; ");
    }
    Ok(out)
}

#[tauri::command]
pub fn write_text(path: String, text: String) -> Res<()> {
    std::fs::write(&path, text).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn app_downloads() {
        let apps: Vec<String> = ["mGBA", "Dolphin", "Dolphin MMJR", "Azahar"].iter().map(|s| s.to_string()).collect();
        assert_eq!(app_download(&apps, "mGBA-0.10.6-appimage-x64.AppImage"), Some(("mGBA".into(), "linux", "0.10.6".into())));
        assert_eq!(app_download(&apps, "azahar-2123.1-android-vanilla.apk"), Some(("Azahar".into(), "android", "2123.1".into())));
        assert_eq!(app_download(&apps, "Dolphin-MMJR-v1.4.apk").unwrap().0, "Dolphin MMJR");
        assert!(app_download(&apps, "Super Mario World (USA).sfc").is_none());
        assert!(app_download(&apps, "ppsspp-1.18.apk").is_none());
    }
}
