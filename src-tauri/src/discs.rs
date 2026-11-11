//! Disc games: reading them for RetroAchievements (the same fingerprint RetroArch makes) and comparing their
//! tracks with Redump. A .chd is unpacked once to a temporary .cue/.bin with chdman; what's found is kept,
//! so the next check is instant.

use crate::{store, Core};
use md5::{Digest, Md5};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DiscInfo {
    /// RetroAchievements hash ("" when this system isn't done yet or the disc couldn't be read)
    pub ra: String,
    /// per track: (size, crc32) in the order of the .cue
    pub tracks: Vec<(u64, u32)>,
}

fn cache_path() -> PathBuf {
    store::app_dir().join("discs.json")
}
fn load_cache() -> HashMap<String, (u64, DiscInfo)> {
    std::fs::read_to_string(cache_path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
fn save_cache(c: &HashMap<String, (u64, DiscInfo)>) {
    let _ = std::fs::write(cache_path(), serde_json::to_vec(c).unwrap_or_default());
}

pub fn stamp(p: &Path) -> u64 {
    p.metadata().map(|m| m.len()).unwrap_or(0) ^ crate::roms::mtime_pub(p).wrapping_mul(1_000_003)
}

// ------------------------------------------------------------------ a disc image: sectors and tracks

struct Track {
    file: PathBuf,
    /// byte offset in the file where the track starts (with its pregap)
    start: u64,
    /// byte offset where the data starts (INDEX 01)
    data: u64,
    /// sector size in the file: 2352 or 2048
    ssize: u64,
    /// where the 2048 user bytes are in a sector: 0, 16 or 24
    uoff: u64,
    audio: bool,
}

struct Image {
    tracks: Vec<Track>,
}

fn msf(s: &str) -> u64 {
    let p: Vec<u64> = s.split(':').filter_map(|x| x.trim().parse().ok()).collect();
    if p.len() == 3 {
        (p[0] * 60 + p[1]) * 75 + p[2]
    } else {
        0
    }
}

fn parse_cue(cue: &Path) -> Option<Image> {
    let t = std::fs::read_to_string(cue).ok()?;
    let dir = cue.parent()?;
    let mut tracks: Vec<Track> = vec![];
    let mut file: Option<PathBuf> = None;
    for line in t.lines() {
        let l = line.trim();
        let up = l.to_uppercase();
        if up.starts_with("FILE ") {
            let name = l.split('"').nth(1).map(|s| s.to_string()).unwrap_or_else(|| l[5..].rsplit_once(' ').map(|(a, _)| a.to_string()).unwrap_or_default());
            file = Some(dir.join(name));
        } else if up.starts_with("TRACK ") {
            let mode = up.split_whitespace().nth(2).unwrap_or("MODE1/2352").to_string();
            let (ssize, uoff, audio) = match mode.as_str() {
                "MODE1/2048" => (2048, 0, false),
                "MODE1/2352" => (2352, 16, false),
                "MODE2/2352" | "CDI/2352" => (2352, 24, false),
                "MODE2/2336" => (2336, 8, false),
                "AUDIO" => (2352, 0, true),
                _ => (2352, 16, false),
            };
            tracks.push(Track { file: file.clone()?, start: u64::MAX, data: u64::MAX, ssize, uoff, audio });
        } else if up.starts_with("INDEX ") {
            let mut it = up.split_whitespace().skip(1);
            let n = it.next().unwrap_or("01");
            let at = msf(it.next().unwrap_or("00:00:00"));
            if let Some(tr) = tracks.last_mut() {
                let b = at * tr.ssize;
                if n == "00" || tr.start == u64::MAX {
                    tr.start = tr.start.min(b);
                }
                if n == "01" {
                    tr.data = b;
                    tr.start = tr.start.min(b);
                }
            }
        }
    }
    if tracks.is_empty() {
        return None;
    }
    Some(Image { tracks })
}

impl Image {
    fn iso(p: &Path) -> Image {
        Image { tracks: vec![Track { file: p.to_path_buf(), start: 0, data: 0, ssize: 2048, uoff: 0, audio: false }] }
    }
    /// 2048 user bytes of a sector of the first data track
    fn sector(&self, lba: u64) -> Option<Vec<u8>> {
        let t = self.tracks.iter().find(|t| !t.audio)?;
        let mut f = std::fs::File::open(&t.file).ok()?;
        f.seek(SeekFrom::Start(t.data + lba * t.ssize + t.uoff)).ok()?;
        let mut b = vec![0u8; 2048];
        f.read_exact(&mut b).ok()?;
        Some(b)
    }
    /// (size, crc) of every track, split the way Redump has them
    fn track_crcs(&self) -> Vec<(u64, u32)> {
        let mut out = vec![];
        for (i, t) in self.tracks.iter().enumerate() {
            let len_file = t.file.metadata().map(|m| m.len()).unwrap_or(0);
            let end = self.tracks.get(i + 1).filter(|n| n.file == t.file).map(|n| n.start).unwrap_or(len_file);
            let Ok(mut f) = std::fs::File::open(&t.file) else { continue };
            if f.seek(SeekFrom::Start(t.start)).is_err() {
                continue;
            }
            let mut left = end.saturating_sub(t.start);
            let size = left;
            let mut h = crc32fast::Hasher::new();
            let mut buf = vec![0u8; 1 << 20];
            while left > 0 {
                let n = (left as usize).min(buf.len());
                if f.read_exact(&mut buf[..n]).is_err() {
                    break;
                }
                h.update(&buf[..n]);
                left -= n as u64;
            }
            out.push((size, h.finalize()));
        }
        out
    }
}

// ------------------------------------------------------------------ ISO 9660

fn find_file(img: &Image, path: &str) -> Option<(u64, u64)> {
    let pvd = img.sector(16)?;
    if &pvd[1..6] != b"CD001" {
        return None;
    }
    let rec = &pvd[156..190];
    let mut lba = u32::from_le_bytes(rec[2..6].try_into().ok()?) as u64;
    let mut size = u32::from_le_bytes(rec[10..14].try_into().ok()?) as u64;
    let parts: Vec<String> = path.split(['\\', '/']).filter(|s| !s.is_empty()).map(|s| s.to_uppercase()).collect();
    for (pi, part) in parts.iter().enumerate() {
        let mut found = None;
        let sectors = size.div_ceil(2048);
        'outer: for s in 0..sectors {
            let sec = img.sector(lba + s)?;
            let mut o = 0usize;
            while o < 2048 {
                let len = sec[o] as usize;
                if len == 0 {
                    break;
                }
                if o + 33 > 2048 {
                    break;
                }
                let nlen = sec[o + 32] as usize;
                let name = String::from_utf8_lossy(&sec[o + 33..(o + 33 + nlen).min(2048)]).to_uppercase();
                let name = name.split(';').next().unwrap_or("").trim_end_matches('.').to_string();
                if name == *part {
                    let l = u32::from_le_bytes(sec[o + 2..o + 6].try_into().ok()?) as u64;
                    let z = u32::from_le_bytes(sec[o + 10..o + 14].try_into().ok()?) as u64;
                    let dir = sec[o + 25] & 2 != 0;
                    if (pi + 1 < parts.len()) == dir {
                        found = Some((l, z));
                        break 'outer;
                    }
                }
                o += len;
            }
        }
        let (l, z) = found?;
        lba = l;
        size = z;
    }
    Some((lba, size))
}

fn read_file(img: &Image, lba: u64, size: u64, max: u64) -> Option<Vec<u8>> {
    let n = size.min(max);
    let mut out = Vec::with_capacity(n as usize);
    let mut s = 0;
    while (out.len() as u64) < n {
        let sec = img.sector(lba + s)?;
        let take = ((n - out.len() as u64) as usize).min(2048);
        out.extend_from_slice(&sec[..take]);
        s += 1;
    }
    Some(out)
}

/// "BOOT = cdrom:\SLUS_007.08;1" -> "SLUS_007.08"
fn boot_exe(cnf: &str, key: &str) -> Option<String> {
    for line in cnf.lines() {
        let l = line.trim();
        let Some(rest) = l.strip_prefix(key) else { continue };
        let rest = rest.trim_start();
        let Some(rest) = rest.strip_prefix('=') else { continue };
        let v = rest.trim();
        let v = v.split_once(':').map(|(_, b)| b).unwrap_or(v);
        let v = v.trim_start_matches(['\\', '/']);
        let v: String = v.chars().take_while(|c| *c != ';' && !c.is_whitespace()).collect();
        if !v.is_empty() {
            return Some(v);
        }
    }
    None
}

/// The RetroAchievements fingerprint of a disc image (rcheevos' rules for these systems).
fn ra_hash(sys: &str, img: &Image) -> Option<String> {
    match sys {
        // Sega CD and Saturn: the first 512 bytes of the disc
        "segacd" | "saturn" => {
            let s = img.sector(0)?;
            Some(hex::encode(Md5::digest(&s[..512])))
        }
        // PlayStation: the name of the boot program and the program itself
        "psx" | "ps2" => {
            let (cl, cs) = find_file(img, "SYSTEM.CNF")?;
            let cnf = String::from_utf8_lossy(&read_file(img, cl, cs, 4096)?).to_string();
            let exe = boot_exe(&cnf, if sys == "psx" { "BOOT" } else { "BOOT2" }).or_else(|| if sys == "psx" { None } else { boot_exe(&cnf, "BOOT") })?;
            let (el, es) = find_file(img, &exe)?;
            let mut size = es;
            if sys == "psx" {
                let first = img.sector(el)?;
                if &first[..8] == b"PS-X EXE" {
                    size = u32::from_le_bytes(first[28..32].try_into().ok()?) as u64 + 2048;
                }
            }
            let data = read_file(img, el, size, 64 * 1024 * 1024)?;
            let mut m = Md5::new();
            m.update(exe.as_bytes());
            m.update(&data);
            Some(hex::encode(m.finalize()))
        }
        _ => None,
    }
}

pub fn ra_supported(sys: &str) -> bool {
    matches!(sys, "psx" | "ps2" | "segacd" | "saturn")
}

fn chdman() -> Option<std::process::Command> {
    crate::convert::chdman_cmd_pub()
}

/// Read a disc game (.cue, .iso, .chd, .m3u): its RetroAchievements hash and its tracks.
pub fn analyze(sys: &str, path: &Path) -> Result<DiscInfo, String> {
    if path.is_dir() {
        // a "Game.m3u" folder: its first disc
        let mut v: Vec<PathBuf> = std::fs::read_dir(path)
            .map_err(|e| e.to_string())?
            .flatten()
            .map(|e| e.path())
            .filter(|p| p.extension().map(|e| matches!(e.to_string_lossy().to_lowercase().as_str(), "chd" | "cue" | "iso")).unwrap_or(false))
            .collect();
        v.sort();
        let first = v.into_iter().next().ok_or("No disc in this folder")?;
        return analyze(sys, &first);
    }
    let mut cache = load_cache();
    let key = path.to_string_lossy().to_string();
    let st = stamp(path);
    if let Some((s, d)) = cache.get(&key) {
        if *s == st {
            return Ok(d.clone());
        }
    }
    let ext = path.extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default();
    let mut tmp: Option<PathBuf> = None;
    let img = match ext.as_str() {
        "cue" => parse_cue(path).ok_or("The .cue can't be read")?,
        "iso" => Image::iso(path),
        "m3u" => {
            let t = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
            let first = t.lines().map(|l| l.trim()).find(|l| !l.is_empty() && !l.starts_with('#')).ok_or("Empty playlist")?;
            return analyze(sys, &path.parent().unwrap().join(first));
        }
        "chd" => {
            let d = std::env::temp_dir().join(format!("emuvault-disc-{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&d);
            std::fs::create_dir_all(&d).map_err(|e| e.to_string())?;
            tmp = Some(d.clone());
            let cue = d.join("disc.cue");
            let mut c = chdman().ok_or("chdman isn't there (Save space › Install chdman)")?;
            let ok = c
                .args(["extractcd", "-f", "-i"])
                .arg(path)
                .arg("-o")
                .arg(&cue)
                .arg("-ob")
                .arg(d.join("disc.bin"))
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .status()
                .map(|s| s.success())
                .unwrap_or(false);
            if ok && cue.is_file() {
                parse_cue(&cue).ok_or("The unpacked disc can't be read")?
            } else {
                let iso = d.join("disc.iso");
                let mut c = chdman().ok_or("chdman isn't there")?;
                let ok = c
                    .args(["extractdvd", "-f", "-i"])
                    .arg(path)
                    .arg("-o")
                    .arg(&iso)
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .status()
                    .map(|s| s.success())
                    .unwrap_or(false);
                if !ok {
                    let _ = std::fs::remove_dir_all(&d);
                    return Err("chdman couldn't unpack this .chd".into());
                }
                Image::iso(&iso)
            }
        }
        _ => return Err(format!("Emu Vault can't read .{ext} discs yet")),
    };
    let info = DiscInfo { ra: if ra_supported(sys) { ra_hash(sys, &img).unwrap_or_default() } else { String::new() }, tracks: img.track_crcs() };
    if let Some(d) = tmp {
        let _ = std::fs::remove_dir_all(d);
    }
    cache.insert(key, (st, info.clone()));
    save_cache(&cache);
    Ok(info)
}

// ------------------------------------------------------------------ checking disc games against Redump

#[derive(Serialize, Clone)]
pub struct DiscCheck {
    sys: String,
    name: String,
    path: String,
    /// good | partly | unknown | error
    status: String,
    /// the Redump name it matches
    redump: String,
    note: String,
}

/// Redump's list for a system (from libretro-database, kept in the lists folder): crc -> (game, track name, size)
async fn redump_list(core: &Core, sys: &str) -> Result<HashMap<u32, (String, u64)>, String> {
    let db = crate::roms::db();
    let s = db.systems.get(sys).ok_or("Unknown system")?;
    let p = store::app_dir().join("lists").join(format!("{sys}.redump.dat"));
    let young = p.metadata().ok().and_then(|m| m.modified().ok()).and_then(|t| t.elapsed().ok()).map(|e| e.as_secs() < 30 * 86400).unwrap_or(false);
    let txt = if young {
        std::fs::read_to_string(&p).map_err(|e| e.to_string())?
    } else {
        let base = std::env::var("EMUVAULT_LDB").unwrap_or_else(|_| "https://raw.githubusercontent.com/libretro/libretro-database/master/metadat/".into());
        let mut u = url::Url::parse(&base).map_err(|e| e.to_string())?;
        u.path_segments_mut().map_err(|_| "bad url")?.pop_if_empty().push("redump").push(&format!("{}.dat", s.full));
        let r = core.client.get(u).header("User-Agent", "EmuVault/0.6").send().await.map_err(|e| format!("Network problem: {e}"))?;
        if !r.status().is_success() {
            return Err(format!("Redump's list for {} couldn't be downloaded ({})", s.full, r.status()));
        }
        let t = r.text().await.map_err(|e| e.to_string())?;
        let _ = std::fs::create_dir_all(p.parent().unwrap());
        let _ = std::fs::write(&p, &t);
        t
    };
    let mut out = HashMap::new();
    let mut game = String::new();
    for line in txt.lines() {
        let l = line.trim();
        if let Some(c) = crate::re!(r#"^name "([^"]+)""#).captures(l) {
            game = c[1].to_string();
        }
        if let Some(c) = crate::re!(r#"rom \( name "[^"]+" size (\d+) crc ([0-9A-Fa-f]{8})"#).captures(l) {
            if let (Ok(z), Ok(crc)) = (c[1].parse::<u64>(), u32::from_str_radix(&c[2], 16)) {
                out.insert(crc, (game.clone(), z));
            }
        }
    }
    Ok(out)
}

#[tauri::command]
pub async fn discs_check(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<Vec<DiscCheck>, String> {
    use tauri::Emitter;
    let lib = core.lib.lock().unwrap().clone();
    let mut todo: Vec<(String, crate::roms::RomFile)> = vec![];
    for (sys, files) in &lib {
        if crate::roms::db().systems.get(sys).map(|s| s.kind != "disc").unwrap_or(true) {
            continue;
        }
        for f in files {
            let ext = f.name.rsplit_once('.').map(|(_, e)| e.to_lowercase()).unwrap_or_default();
            if matches!(ext.as_str(), "chd" | "cue" | "iso") {
                todo.push((sys.clone(), f.clone()));
            }
        }
    }
    let n = todo.len();
    let mut lists: HashMap<String, HashMap<u32, (String, u64)>> = HashMap::new();
    let mut out = vec![];
    for (i, (sys, f)) in todo.into_iter().enumerate() {
        let _ = app.emit("discs-progress", (i, n, f.name.clone()));
        if !lists.contains_key(&sys) {
            match redump_list(&core, &sys).await {
                Ok(l) => {
                    lists.insert(sys.clone(), l);
                }
                Err(e) => {
                    out.push(DiscCheck {
                        sys: sys.clone(),
                        name: f.name.clone(),
                        path: f.path.clone(),
                        status: "error".into(),
                        redump: String::new(),
                        note: e,
                    });
                    continue;
                }
            }
        }
        let list = &lists[&sys];
        let p = PathBuf::from(&f.path);
        let s2 = sys.clone();
        let r = tokio::task::spawn_blocking(move || analyze(&s2, &p)).await.map_err(|e| e.to_string())?;
        match r {
            Ok(info) => {
                let hits: Vec<&(String, u64)> = info.tracks.iter().filter_map(|(_, c)| list.get(c)).collect();
                let (status, redump, note) = if !info.tracks.is_empty() && hits.len() == info.tracks.len() {
                    ("good", hits[0].0.clone(), format!("{} track{} match Redump", hits.len(), if hits.len() == 1 { "" } else { "s" }))
                } else if !hits.is_empty() {
                    (
                        "partly",
                        hits[0].0.clone(),
                        format!(
                            "{} of {} tracks match Redump: the others are different (damaged, or another version of the audio tracks)",
                            hits.len(),
                            info.tracks.len()
                        ),
                    )
                } else {
                    ("unknown", String::new(), "Not in Redump's list: a damaged copy, a hack/translation, or a disc made another way".into())
                };
                out.push(DiscCheck { sys: sys.clone(), name: f.name.clone(), path: f.path.clone(), status: status.into(), redump, note });
            }
            Err(e) => {
                out.push(DiscCheck { sys: sys.clone(), name: f.name.clone(), path: f.path.clone(), status: "error".into(), redump: String::new(), note: e })
            }
        }
    }
    let _ = app.emit("discs-progress", (n, n, String::new()));
    let good = out.iter().filter(|c| c.status == "good").count();
    core.log(format!("Disc games checked: {good} of {} match Redump", out.len()));
    let _ = std::fs::write(store::app_dir().join("discs-last.json"), serde_json::to_vec(&out).unwrap_or_default());
    Ok(out)
}

#[tauri::command]
pub fn discs_last() -> Option<serde_json::Value> {
    std::fs::read_to_string(store::app_dir().join("discs-last.json")).ok().and_then(|t| serde_json::from_str(&t).ok())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn boot_line() {
        assert_eq!(boot_exe("BOOT = cdrom:\\SLUS_007.08;1\r\nTCB = 4", "BOOT").as_deref(), Some("SLUS_007.08"));
        assert_eq!(boot_exe("BOOT2 = cdrom0:\\SLUS_200.62;1", "BOOT2").as_deref(), Some("SLUS_200.62"));
        assert_eq!(msf("00:02:00"), 150);
    }
    #[test]
    fn iso_and_tracks() {
        // a small ISO: PVD at 16, root dir at 18 with SYSTEM.CNF (lba 20) and SLUS_000.01 (lba 21)
        let mut iso = vec![0u8; 2048 * 24];
        let pvd = 16 * 2048;
        iso[pvd] = 1;
        iso[pvd + 1..pvd + 6].copy_from_slice(b"CD001");
        let root = pvd + 156;
        iso[root] = 34;
        iso[root + 2..root + 6].copy_from_slice(&18u32.to_le_bytes());
        iso[root + 10..root + 14].copy_from_slice(&2048u32.to_le_bytes());
        iso[root + 25] = 2;
        let mut o = 18 * 2048;
        for (name, lba, size) in [("SYSTEM.CNF;1", 20u32, 30u32), ("SLUS_000.01;1", 21u32, 4096u32)] {
            let len = 33 + name.len() + (name.len() + 1) % 2;
            iso[o] = len as u8;
            iso[o + 2..o + 6].copy_from_slice(&lba.to_le_bytes());
            iso[o + 10..o + 14].copy_from_slice(&size.to_le_bytes());
            iso[o + 32] = name.len() as u8;
            iso[o + 33..o + 33 + name.len()].copy_from_slice(name.as_bytes());
            o += len;
        }
        let cnf = b"BOOT = cdrom:\\SLUS_000.01;1\r\n";
        iso[20 * 2048..20 * 2048 + cnf.len()].copy_from_slice(cnf);
        let exe = 21 * 2048;
        iso[exe..exe + 8].copy_from_slice(b"PS-X EXE");
        iso[exe + 28..exe + 32].copy_from_slice(&100u32.to_le_bytes());
        for i in 0..2148 {
            iso[exe + 40 + (i % 2000)] ^= (i % 251) as u8;
        }
        let d = std::env::temp_dir().join(format!("evdisc{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        let p = d.join("t.iso");
        std::fs::write(&p, &iso).unwrap();
        let img = Image::iso(&p);
        let h = ra_hash("psx", &img).unwrap();
        let mut m = Md5::new();
        m.update(b"SLUS_000.01");
        m.update(&iso[exe..exe + 2148]);
        assert_eq!(h, hex::encode(m.finalize()));
        assert_eq!(ra_hash("saturn", &img).unwrap(), hex::encode(Md5::digest(&iso[..512])));
        // a cue with two tracks in one bin: split at the second track's INDEX 00
        let bin = d.join("g.bin");
        std::fs::write(&bin, vec![7u8; 2352 * 300]).unwrap();
        std::fs::write(
            d.join("g.cue"),
            "FILE \"g.bin\" BINARY\n  TRACK 01 MODE2/2352\n    INDEX 01 00:00:00\n  TRACK 02 AUDIO\n    INDEX 00 00:02:00\n    INDEX 01 00:04:00\n",
        )
        .unwrap();
        let im = parse_cue(&d.join("g.cue")).unwrap();
        let t = im.track_crcs();
        assert_eq!(t.len(), 2);
        assert_eq!(t[0].0, 150 * 2352);
        assert_eq!(t[1].0, 150 * 2352);
        let _ = std::fs::remove_dir_all(&d);
    }
}
