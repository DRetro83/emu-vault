//! Box art (libretro-thumbnails), save backups, and copying games to a device.

use crate::roms::RomFile;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

// ------------------------------------------------------------------ covers

pub fn thumb_name(s: &str) -> String {
    s.chars().map(|c| if "&*/:`<>?\\|\"".contains(c) { '_' } else { c }).collect()
}

#[derive(Debug, Clone, Serialize)]
pub struct CoverJob {
    pub sys: String,
    pub game: String,
    /// ES-DE folder name: covers | screenshots | titlescreens
    pub kind: String,
    pub names: Vec<String>,
    /// the first one is the real file (media/<system>/<kind>/), the others link to it
    pub dests: Vec<String>,
}

/// ES-DE media folder -> libretro-thumbnails folder
pub fn lr_kind(kind: &str) -> &'static str {
    match kind {
        "screenshots" => "Named_Snaps",
        "titlescreens" => "Named_Titles",
        _ => "Named_Boxarts",
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct CoverCfg {
    pub esde: bool,
    pub esde_dir: String,
    pub retroarch: bool,
    pub ra_dir: String,
    pub kind: String,
    /// which ES-DE media folders to fill: covers, screenshots, titlescreens
    pub media: Vec<String>,
    /// 0 = original, else the width in pixels
    pub size: u32,
    /// download covers for new games by itself
    pub auto: bool,
    /// where covers come from: libretro (Emu Vault downloads them) | esde (you scrape in ES-DE)
    pub source: String,
}
impl Default for CoverCfg {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_default();
        CoverCfg {
            esde: true,
            esde_dir: home.join("ES-DE/downloaded_media").to_string_lossy().into(),
            retroarch: true,
            ra_dir: home.join(".config/retroarch/thumbnails").to_string_lossy().into(),
            kind: "Named_Boxarts".into(),
            media: vec!["covers".into()],
            size: 0,
            auto: true,
            source: "libretro".into(),
        }
    }
}

/// RetroArch's thumbnails folder on this computer (normal or Flatpak), if RetroArch is there.
pub fn ra_thumbs_dir() -> Option<PathBuf> {
    let h = dirs::home_dir()?;
    [h.join(".config/retroarch"), h.join(".var/app/org.libretro.RetroArch/config/retroarch")].into_iter().find(|d| d.is_dir()).map(|d| d.join("thumbnails"))
}

pub fn cover_jobs(lib: &HashMap<String, Vec<RomFile>>, cfg: &CoverCfg) -> (Vec<CoverJob>, usize) {
    let d = crate::roms::db();
    let disc_re = crate::re!(r"(?i)\s*\((?:disc|disk|cd)\s*\d+[^)]*\)");
    let mut jobs = vec![];
    let mut have = 0;
    let kinds: Vec<String> = if cfg.media.is_empty() { vec!["covers".into()] } else { cfg.media.clone() };
    for (sys, files) in lib {
        let Some(s) = d.systems.get(sys) else { continue };
        for f in files {
            if f.check == "bad" {
                continue;
            }
            let stem_rel = {
                let r = f.rel.trim_end_matches('/');
                match r.rsplit_once('.') {
                    Some((a, _)) if !a.ends_with('/') => a.to_string(),
                    _ => r.to_string(),
                }
            };
            let file_stem = f.name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&f.name).to_string();
            let mut names = vec![];
            for n in [f.dat.clone(), file_stem.clone(), disc_re.replace_all(&f.dat, "").to_string(), disc_re.replace_all(&file_stem, "").to_string()] {
                let n = thumb_name(n.trim());
                if !n.is_empty() && !names.contains(&n) {
                    names.push(n);
                }
            }
            // "Game (USA) (Rev 1) [!]" -> also try just "Game (USA)"
            if let Some(c) = crate::re!(r"^([^(\[]+\([^)]*\))").captures(&file_stem) {
                let n = thumb_name(c[1].trim());
                if !names.contains(&n) {
                    names.push(n);
                }
            }
            for kind in &kinds {
                let mut dests = vec![Path::new(&cfg.esde_dir).join(sys).join(kind).join(format!("{stem_rel}.png"))];
                if cfg.retroarch {
                    let label = if f.dat.is_empty() { file_stem.clone() } else { disc_re.replace_all(&f.dat, "").to_string() };
                    dests.push(Path::new(&cfg.ra_dir).join(&s.full).join(lr_kind(kind)).join(format!("{}.png", thumb_name(&label))));
                }
                if dests.iter().all(|p| p.exists()) {
                    if kind == "covers" {
                        have += 1;
                    }
                    continue;
                }
                jobs.push(CoverJob {
                    sys: s.full.clone(),
                    game: f.p.title.clone(),
                    kind: kind.clone(),
                    names: names.clone(),
                    dests: dests.iter().map(|p| p.to_string_lossy().to_string()).collect(),
                });
            }
        }
    }
    jobs.sort_by(|a, b| (&a.kind != "covers", &a.game).cmp(&(&b.kind != "covers", &b.game)));
    (jobs, have)
}

/// Make a picture smaller (keeps its shape). Pictures that are already small enough stay as they are.
pub fn shrink_png(bytes: &[u8], width: u32) -> Vec<u8> {
    if width == 0 {
        return bytes.to_vec();
    }
    let Ok(img) = image::load_from_memory_with_format(bytes, image::ImageFormat::Png) else { return bytes.to_vec() };
    if img.width() <= width {
        return bytes.to_vec();
    }
    let h = ((img.height() as f64) * (width as f64) / (img.width() as f64)).round().max(1.0) as u32;
    let small = img.resize_exact(width, h, image::imageops::FilterType::Triangle);
    let mut out = std::io::Cursor::new(vec![]);
    if small.write_to(&mut out, image::ImageFormat::Png).is_ok() {
        out.into_inner()
    } else {
        bytes.to_vec()
    }
}

/// Put a file at `dest` that is the same as `src`: a hard link, else a symbolic link, else a copy.
pub fn same_file(src: &Path, dest: &Path) -> std::io::Result<()> {
    if dest.exists() {
        return Ok(());
    }
    std::fs::create_dir_all(dest.parent().unwrap())?;
    if std::fs::hard_link(src, dest).is_ok() {
        return Ok(());
    }
    #[cfg(unix)]
    if std::os::unix::fs::symlink(src, dest).is_ok() {
        return Ok(());
    }
    std::fs::copy(src, dest).map(|_| ())
}

pub async fn fetch_cover(client: &reqwest::Client, base: &str, job: &CoverJob, size: u32) -> Result<bool, String> {
    let main = Path::new(&job.dests[0]);
    if main.exists() {
        for d in &job.dests[1..] {
            same_file(main, Path::new(d)).map_err(|e| e.to_string())?;
        }
        return Ok(true);
    }
    for n in &job.names {
        let mut u = url::Url::parse(base).map_err(|e| e.to_string())?;
        u.path_segments_mut().map_err(|_| "bad url")?.pop_if_empty().push(&job.sys).push(lr_kind(&job.kind)).push(&format!("{n}.png"));
        let res = client.get(u).header("User-Agent", "EmuVault/0.4").send().await.map_err(|e| format!("Network problem: {e}"))?;
        if res.status().is_success() {
            let bytes = res.bytes().await.map_err(|e| e.to_string())?;
            if bytes.len() < 100 || !bytes.starts_with(b"\x89PNG") {
                continue;
            }
            let data = tokio::task::block_in_place(|| shrink_png(&bytes, size));
            std::fs::create_dir_all(main.parent().unwrap()).map_err(|e| e.to_string())?;
            std::fs::write(main, &data).map_err(|e| e.to_string())?;
            for d in &job.dests[1..] {
                same_file(main, Path::new(d)).map_err(|e| e.to_string())?;
            }
            return Ok(true);
        }
    }
    Ok(false)
}

// ------------------------------------------------------------------ ES-DE media you already have

/// Where ES-DE keeps its downloaded media on this computer.
pub fn esde_media_dir() -> Option<PathBuf> {
    let h = dirs::home_dir()?;
    for settings in [h.join("ES-DE/settings/es_settings.xml"), h.join(".emulationstation/es_settings.xml")] {
        if let Ok(t) = std::fs::read_to_string(&settings) {
            if let Some(c) = crate::re!(r#"<string name="MediaDirectory" value="([^"]+)""#).captures(&t) {
                let p = PathBuf::from(c[1].replace("~", &h.to_string_lossy()));
                if p.is_dir() {
                    return Some(p);
                }
            }
        }
    }
    [h.join("ES-DE/downloaded_media"), h.join(".emulationstation/downloaded_media")].into_iter().find(|p| p.is_dir())
}

// ------------------------------------------------------------------ save backups

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SaveSource {
    pub label: String,
    pub path: String,
}

/// Also the emulators that live in the vault: RetroArch on its own (Launchers/RetroArch/…AppImage.home/) and
/// the RetroArch saves folder you point RetroArch at.
pub fn detect_sources_root(root: &str) -> Vec<SaveSource> {
    let mut v = detect_sources();
    let r = Path::new(root);
    for e in std::fs::read_dir(r.join("Launchers/RetroArch")).into_iter().flatten().flatten() {
        let n = e.file_name().to_string_lossy().to_string();
        if n.ends_with(".AppImage.home") {
            for (l, s) in [
                ("RetroArch saves (in the vault, on its own)", ".config/retroarch/saves"),
                ("RetroArch states (in the vault, on its own)", ".config/retroarch/states"),
            ] {
                let p = e.path().join(s);
                if p.is_dir() {
                    v.push(SaveSource { label: l.into(), path: p.to_string_lossy().into() });
                }
            }
        }
    }
    for (l, s) in [("RetroArch saves (in the vault)", "saves/retroarch"), ("RetroArch states (in the vault)", "saves/retroarch-states")] {
        let p = r.join(s);
        if p.is_dir() {
            v.push(SaveSource { label: l.into(), path: p.to_string_lossy().into() });
        }
    }
    v
}

pub fn detect_sources() -> Vec<SaveSource> {
    let h = dirs::home_dir().unwrap_or_default();
    let c = [
        ("RetroArch saves", ".config/retroarch/saves"),
        ("RetroArch states", ".config/retroarch/states"),
        ("RetroArch saves (Flatpak)", ".var/app/org.libretro.RetroArch/config/retroarch/saves"),
        ("RetroArch states (Flatpak)", ".var/app/org.libretro.RetroArch/config/retroarch/states"),
        ("DuckStation memory cards", ".local/share/duckstation/memcards"),
        ("DuckStation (Flatpak)", ".var/app/org.duckstation.DuckStation/data/duckstation/memcards"),
        ("PCSX2 memory cards", ".config/PCSX2/memcards"),
        ("PCSX2 (Flatpak)", ".var/app/net.pcsx2.PCSX2/config/PCSX2/memcards"),
        ("PPSSPP saves", ".config/ppsspp/PSP/SAVEDATA"),
        ("Dolphin GameCube", ".local/share/dolphin-emu/GC"),
        ("Dolphin GameCube (Flatpak)", ".var/app/org.DolphinEmu.dolphin-emu/data/dolphin-emu/GC"),
        ("melonDS", ".config/melonDS"),
        ("mGBA", ".config/mgba"),
        ("Azahar saves", ".local/share/azahar-emu/sdmc/Nintendo 3DS"),
    ];
    c.iter()
        .filter_map(|(l, p)| {
            let full = h.join(p);
            if full.is_dir() {
                Some(SaveSource { label: l.to_string(), path: full.to_string_lossy().into() })
            } else {
                None
            }
        })
        .collect()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub id: String,
    pub time: String,
    pub files: usize,
    pub bytes: u64,
    pub sources: Vec<SaveSource>,
    pub fingerprint: String,
    pub note: String,
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
    if let Ok(rd) = std::fs::read_dir(dir) {
        for e in rd.flatten() {
            let p = e.path();
            if p.is_dir() {
                walk(&p, out);
            } else {
                out.push(p);
            }
        }
    }
}

fn fingerprint(sources: &[SaveSource]) -> (String, usize, u64) {
    use sha2::{Digest, Sha256};
    let mut h = Sha256::new();
    let mut n = 0;
    let mut bytes = 0;
    for s in sources {
        let mut files = vec![];
        walk(Path::new(&s.path), &mut files);
        files.sort();
        for f in files {
            let m = f.metadata().ok();
            let len = m.as_ref().map(|m| m.len()).unwrap_or(0);
            let mt = m.and_then(|m| m.modified().ok()).and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs()).unwrap_or(0);
            h.update(format!("{}|{len}|{mt}\n", f.display()));
            n += 1;
            bytes += len;
        }
    }
    (hex::encode(h.finalize())[..16].to_string(), n, bytes)
}

pub fn backups_dir(root: &str) -> PathBuf {
    Path::new(root).join("Backups").join("saves")
}

pub fn list_snapshots(root: &str) -> Vec<Snapshot> {
    let mut v: Vec<Snapshot> = std::fs::read_dir(backups_dir(root))
        .map(|rd| rd.flatten().filter_map(|e| serde_json::from_str(&std::fs::read_to_string(e.path().join("snapshot.json")).ok()?).ok()).collect())
        .unwrap_or_default();
    v.sort_by(|a, b| b.id.cmp(&a.id));
    v
}

/// Copy all save folders into a new snapshot. Returns None when nothing changed since the last one.
pub fn snapshot(root: &str, sources: &[SaveSource], keep: usize, note: &str, force: bool) -> Result<Option<Snapshot>, String> {
    if sources.is_empty() {
        return Err("No save folders yet. Add one in Backups.".into());
    }
    let (fp, n, bytes) = fingerprint(sources);
    if !force {
        if let Some(last) = list_snapshots(root).first() {
            if last.fingerprint == fp {
                return Ok(None);
            }
        }
    }
    if let Some((free, _)) = crate::store::free_space(root) {
        if bytes + 50 * 1024 * 1024 > free {
            return Err("Not enough space on the drive for this backup.".into());
        }
    }
    let now = chrono::Local::now();
    let id = now.format("%Y-%m-%d_%H%M%S").to_string();
    let dir = backups_dir(root).join(&id);
    for s in sources {
        let dest = dir.join(crate::store::safe(&s.label));
        if Path::new(&s.path).is_dir() {
            crate::journal::copy_dir(Path::new(&s.path), &dest)?;
        }
    }
    let snap = Snapshot {
        id: id.clone(),
        time: now.format("%Y-%m-%d %H:%M").to_string(),
        files: n,
        bytes,
        sources: sources.to_vec(),
        fingerprint: fp,
        note: note.into(),
    };
    std::fs::write(dir.join("snapshot.json"), serde_json::to_vec_pretty(&snap).unwrap()).map_err(|e| e.to_string())?;
    // keep the newest `keep` (snapshots made before a restore don't count)
    let all = list_snapshots(root);
    let normal: Vec<&Snapshot> = all.iter().filter(|s| s.note.is_empty()).collect();
    for old in normal.iter().skip(keep.max(1)) {
        let _ = std::fs::remove_dir_all(backups_dir(root).join(&old.id));
    }
    let safety: Vec<&Snapshot> = all.iter().filter(|s| !s.note.is_empty()).collect();
    for old in safety.iter().skip(3) {
        let _ = std::fs::remove_dir_all(backups_dir(root).join(&old.id));
    }
    Ok(Some(snap))
}

/// Put a snapshot back. First saves the current state as an extra snapshot, so this can be reversed.
pub fn restore(root: &str, id: &str) -> Result<usize, String> {
    let snap = list_snapshots(root).into_iter().find(|s| s.id == id).ok_or("Backup not found")?;
    snapshot(root, &snap.sources, 99, &format!("before restoring {}", snap.time), true)?;
    let dir = backups_dir(root).join(id);
    let mut n = 0;
    for s in &snap.sources {
        let from = dir.join(crate::store::safe(&s.label));
        if !from.is_dir() {
            continue;
        }
        let mut files = vec![];
        walk(&from, &mut files);
        for f in files {
            let rel = f.strip_prefix(&from).unwrap();
            let to = Path::new(&s.path).join(rel);
            std::fs::create_dir_all(to.parent().unwrap()).map_err(|e| e.to_string())?;
            std::fs::copy(&f, &to).map_err(|e| format!("Couldn't put back {}: {e}", rel.display()))?;
            n += 1;
        }
    }
    Ok(n)
}

// ------------------------------------------------------------------ devices

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Profile {
    pub name: String,
    pub systems: Vec<String>,
    /// esde | batocera | muos | retroarch
    pub layout: String,
    pub bios: bool,
}

pub fn muos_folder(sys: &str) -> String {
    match sys {
        "snes" => "SFC",
        "nes" => "FC",
        "megadrive" => "MD",
        "mastersystem" => "MS",
        "gamegear" => "GG",
        "psx" => "PS",
        "sega32x" => "32X",
        "segacd" => "SEGACD",
        "atari2600" => "ATARI2600",
        "atarilynx" => "LYNX",
        "wonderswan" => "WS",
        "wonderswancolor" => "WSC",
        "pcengine" => "PCE",
        "pcenginecd" => "PCECD",
        "virtualboy" => "VB",
        "pokemini" => "POKEMINI",
        _ => return sys.to_uppercase(),
    }
    .into()
}

pub fn device_dirs(target: &str, layout: &str, sys: &str) -> (PathBuf, PathBuf) {
    let t = Path::new(target);
    match layout {
        "batocera" => (t.join("roms").join(sys), t.join("bios")),
        "muos" => (t.join("ROMS").join(muos_folder(sys)), t.join("MUOS").join("bios")),
        "retroarch" => (t.join("roms").join(sys), t.join("system")),
        _ => (t.join("ROMs").join(sys), t.join("RetroArch").join("system")),
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DevItem {
    pub src: String,
    pub dest: String,
    pub size: u64,
    pub sys: String,
    pub is_dir: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct DevPlan {
    pub items: Vec<DevItem>,
    pub already: usize,
    pub bytes: u64,
    pub free: u64,
    pub per_sys: Vec<(String, usize, u64)>,
}

pub fn device_plan(root: &str, lib: &HashMap<String, Vec<RomFile>>, target: &str, p: &Profile) -> DevPlan {
    let mut items = vec![];
    let mut already = 0;
    let mut per: HashMap<String, (usize, u64)> = HashMap::new();
    for sys in &p.systems {
        let (rdir, _) = device_dirs(target, &p.layout, sys);
        for f in lib.get(sys).cloned().unwrap_or_default() {
            if f.check == "bad" {
                continue;
            }
            // whole m3u folder, or the file plus its cue tracks
            let path = Path::new(&f.path);
            let in_m3u_dir = path.parent().and_then(|d| d.extension()).map(|e| e.eq_ignore_ascii_case("m3u")).unwrap_or(false);
            let top = if in_m3u_dir { path.parent().unwrap().to_path_buf() } else { path.to_path_buf() };
            let rel_top = top.strip_prefix(Path::new(root).join("roms").join(sys)).unwrap_or(&top).to_path_buf();
            let dest = rdir.join(&rel_top);
            if dest.exists() {
                already += 1;
                continue;
            }
            let e = per.entry(sys.clone()).or_default();
            e.0 += 1;
            e.1 += f.size;
            items.push(DevItem {
                src: top.to_string_lossy().into(),
                dest: dest.to_string_lossy().into(),
                size: f.size,
                sys: sys.clone(),
                is_dir: top.is_dir(),
            });
            if !top.is_dir() {
                for part in &f.parts {
                    let pp = Path::new(part);
                    let d = dest.parent().unwrap().join(pp.file_name().unwrap());
                    if !d.exists() {
                        items.push(DevItem { src: part.clone(), dest: d.to_string_lossy().into(), size: 0, sys: sys.clone(), is_dir: false });
                    }
                }
            }
        }
        if p.bios {
            let (_, bdir) = device_dirs(target, &p.layout, sys);
            let src = Path::new(root).join("bios").join(sys);
            let mut files = vec![];
            walk(&src, &mut files);
            for f in files {
                let rel = f.strip_prefix(&src).unwrap();
                let dest = bdir.join(rel);
                if dest.exists() {
                    continue;
                }
                let size = f.metadata().map(|m| m.len()).unwrap_or(0);
                items.push(DevItem { src: f.to_string_lossy().into(), dest: dest.to_string_lossy().into(), size, sys: "bios".into(), is_dir: false });
            }
        }
    }
    let bytes = items.iter().map(|i| i.size).sum();
    let free = crate::store::free_space(target).map(|x| x.0).unwrap_or(0);
    let mut per_sys: Vec<(String, usize, u64)> = per.into_iter().map(|(k, (a, b))| (k, a, b)).collect();
    per_sys.sort();
    DevPlan { items, already, bytes, free, per_sys }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn covers_and_backups_and_device() {
        let root = std::env::temp_dir().join(format!("ev-x-{}", std::process::id()));
        let r = root.to_string_lossy().to_string();
        std::fs::create_dir_all(root.join("roms/snes")).unwrap();
        std::fs::write(root.join("roms/snes/Chrono Trigger (USA).sfc"), b"x").unwrap();
        std::fs::create_dir_all(root.join("bios/snes")).unwrap();
        std::fs::write(root.join("bios/snes/BS-X.bin"), b"b").unwrap();
        let cache = Default::default();
        let mut lib = HashMap::new();
        lib.insert("snes".to_string(), crate::roms::scan_system(&r, "snes", &cache));
        let cfg = CoverCfg { esde_dir: root.join("esde").to_string_lossy().into(), ra_dir: root.join("ra").to_string_lossy().into(), ..Default::default() };
        let (jobs, have) = cover_jobs(&lib, &cfg);
        assert_eq!((jobs.len(), have), (1, 0));
        assert_eq!(jobs[0].sys, "Nintendo - Super Nintendo Entertainment System");
        assert!(jobs[0].names.contains(&"Chrono Trigger (USA)".to_string()));
        assert!(jobs[0].dests[0].ends_with("esde/snes/covers/Chrono Trigger (USA).png"));
        assert_eq!(thumb_name("Q*bert: A/B"), "Q_bert_ A_B");

        // backups: snapshot, unchanged = none, keep 2, restore
        let src = root.join("saves");
        std::fs::create_dir_all(&src).unwrap();
        std::fs::write(src.join("a.srm"), b"1").unwrap();
        let s = vec![SaveSource { label: "RA saves".into(), path: src.to_string_lossy().into() }];
        let first = snapshot(&r, &s, 2, "", false).unwrap().unwrap();
        assert!(snapshot(&r, &s, 2, "", false).unwrap().is_none());
        std::thread::sleep(std::time::Duration::from_millis(1100));
        std::fs::write(src.join("a.srm"), b"22").unwrap();
        snapshot(&r, &s, 2, "", false).unwrap().unwrap();
        std::thread::sleep(std::time::Duration::from_millis(1100));
        std::fs::write(src.join("a.srm"), b"333").unwrap();
        snapshot(&r, &s, 2, "", false).unwrap().unwrap();
        let l = list_snapshots(&r);
        assert_eq!(l.len(), 2);
        assert!(l.iter().all(|x| x.id != first.id), "oldest removed");
        std::thread::sleep(std::time::Duration::from_millis(1100));
        restore(&r, &l[1].id).unwrap();
        assert_eq!(std::fs::read(src.join("a.srm")).unwrap(), b"22");
        assert!(list_snapshots(&r).iter().any(|x| x.note.starts_with("before restoring")));

        // device
        let p = Profile { name: "RP5".into(), systems: vec!["snes".into()], layout: "muos".into(), bios: true };
        let plan = device_plan(&r, &lib, &root.join("sd").to_string_lossy(), &p);
        assert_eq!(plan.items.len(), 2);
        assert!(plan.items[0].dest.ends_with("sd/ROMS/SFC/Chrono Trigger (USA).sfc"));
        assert!(plan.items[1].dest.ends_with("sd/MUOS/bios/BS-X.bin"));
        std::fs::remove_dir_all(root).unwrap();
    }
}
