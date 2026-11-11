//! RetroAchievements: which of your ROMs work with achievements.
//! Each file gets the same fingerprint (MD5) RetroArch uses ("RA hash"), and that is looked up in the
//! RetroAchievements list of the system (needs your user name and Web API key, free on retroachievements.org).
//! Cartridge systems are done here; disc systems (PlayStation, Saturn…) need their own hashing and come later.

use crate::{store, Core};
use md5::{Digest, Md5};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Read;
use std::path::{Path, PathBuf};
use tauri::Emitter;

/// Emu Vault system -> RetroAchievements console id (cartridge and arcade systems)
pub fn console_id(sys: &str) -> Option<u32> {
    Some(match sys {
        "megadrive" | "genesis" => 1,
        "n64" => 2,
        "snes" | "sfc" => 3,
        "gb" => 4,
        "gba" => 5,
        "gbc" => 6,
        "nes" | "famicom" => 7,
        "pcengine" | "tg16" => 8,
        "sega32x" => 10,
        "mastersystem" => 11,
        "atarilynx" => 13,
        "ngp" | "ngpc" => 14,
        "gamegear" => 15,
        "atari2600" => 25,
        "arcade" | "fbneo" | "mame" => 27,
        "virtualboy" => 28,
        "msx" | "msx2" => 29,
        "sg-1000" | "sg1000" => 33,
        "colecovision" => 44,
        "intellivision" => 45,
        "vectrex" => 46,
        "atari7800" => 51,
        "wonderswan" | "wonderswancolor" => 53,
        "pokemini" => 24,
        "fds" => 7,
        "psx" => 12,
        "ps2" => 21,
        "segacd" => 9,
        "saturn" => 39,
        _ => return None,
    })
}

pub fn is_disc_system(sys: &str) -> bool {
    matches!(sys, "nds" | "psp" | "dreamcast" | "pcenginecd" | "3do" | "gc" | "wii" | "neogeocd" | "pcfx" | "jaguarcd")
}

/// The RA hash of ROM bytes (after unpacking), with the system's own rules.
pub fn hash_bytes(sys: &str, name: &str, data: &[u8]) -> String {
    let mut d: &[u8] = data;
    let owned;
    match sys {
        "nes" | "famicom" | "fds" => {
            if d.starts_with(b"NES\x1a") || d.starts_with(b"FDS\x1a") {
                d = &d[16..];
            }
        }
        "snes" | "sfc" => {
            if d.len() % 8192 == 512 {
                d = &d[512..];
            }
        }
        "pcengine" | "tg16" => {
            if d.len() % 131072 == 512 {
                d = &d[512..];
            }
        }
        "atarilynx" => {
            if d.starts_with(b"LYNX\0") && d.len() > 64 {
                d = &d[64..];
            }
        }
        "atari7800" => {
            if d.len() > 128 && &d[1..10] == b"ATARI7800" {
                d = &d[128..];
            }
        }
        "n64" => {
            // RetroAchievements hashes N64 games in big-endian (.z64) order
            if d.len() >= 4 {
                match d[0] {
                    0x37 => {
                        // .v64: bytes swapped in pairs
                        owned = d.chunks(2).flat_map(|c| if c.len() == 2 { vec![c[1], c[0]] } else { c.to_vec() }).collect::<Vec<u8>>();
                        d = &owned;
                    }
                    0x40 => {
                        // .n64: little-endian words
                        owned = d.chunks(4).flat_map(|c| if c.len() == 4 { vec![c[3], c[2], c[1], c[0]] } else { c.to_vec() }).collect::<Vec<u8>>();
                        d = &owned;
                    }
                    _ => {}
                }
            }
        }
        "arcade" | "fbneo" | "mame" => {
            // arcade games are known by their file name
            let stem = name.rsplit_once('.').map(|(a, _)| a).unwrap_or(name);
            return hex::encode(Md5::digest(stem.as_bytes()));
        }
        _ => {}
    }
    hex::encode(Md5::digest(d))
}

/// Read a ROM: the file itself, or the first ROM inside a .zip / .7z.
fn read_rom(p: &Path) -> Option<(String, Vec<u8>)> {
    let ext = p.extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default();
    let name = p.file_name()?.to_string_lossy().to_string();
    match ext.as_str() {
        "zip" => {
            let f = std::fs::File::open(p).ok()?;
            let mut z = zip::ZipArchive::new(f).ok()?;
            for i in 0..z.len() {
                let mut e = z.by_index(i).ok()?;
                if e.is_dir() || e.size() > 256 * 1024 * 1024 {
                    continue;
                }
                let n = e.name().to_string();
                if n.ends_with(".txt") || n.ends_with(".nfo") {
                    continue;
                }
                let mut v = Vec::with_capacity(e.size() as usize);
                e.read_to_end(&mut v).ok()?;
                return Some((n, v));
            }
            None
        }
        "7z" => {
            let mut out = None;
            sevenz_rust::decompress_file_with_extract_fn(p, std::env::temp_dir(), |entry, reader, _| {
                if out.is_none() && !entry.is_directory() && entry.size() < 256 * 1024 * 1024 {
                    let mut v = vec![];
                    let _ = reader.read_to_end(&mut v);
                    out = Some((entry.name().to_string(), v));
                }
                Ok(true)
            })
            .ok()?;
            out
        }
        _ => {
            let m = p.metadata().ok()?;
            if m.len() > 512 * 1024 * 1024 {
                return None;
            }
            Some((name, std::fs::read(p).ok()?))
        }
    }
}

// ------------------------------------------------------------------ the RetroAchievements lists

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct RaGame {
    #[serde(rename = "ID")]
    pub id: u64,
    #[serde(rename = "Title")]
    pub title: String,
    #[serde(rename = "NumAchievements")]
    pub achievements: u32,
    #[serde(rename = "Points")]
    pub points: u32,
    #[serde(rename = "Hashes")]
    pub hashes: Vec<String>,
}

fn cache_dir() -> PathBuf {
    store::app_dir().join("retroachievements")
}

async fn game_list(core: &Core, id: u32, user: &str, key: &str, fresh: bool) -> Result<Vec<RaGame>, String> {
    let p = cache_dir().join(format!("{id}.json"));
    let young = p.metadata().ok().and_then(|m| m.modified().ok()).and_then(|t| t.elapsed().ok()).map(|e| e.as_secs() < 7 * 86400).unwrap_or(false);
    if young && !fresh {
        if let Some(v) = std::fs::read_to_string(&p).ok().and_then(|t| serde_json::from_str(&t).ok()) {
            return Ok(v);
        }
    }
    let base = std::env::var("EMUVAULT_RA_API").unwrap_or_else(|_| "https://retroachievements.org/API/".into());
    let url = format!("{base}API_GetGameList.php");
    let res = core
        .client
        .get(&url)
        .query(&[("i", id.to_string()), ("h", "1".into()), ("f", "0".into()), ("y", key.to_string()), ("z", user.to_string())])
        .header("User-Agent", "EmuVault/0.4")
        .send()
        .await
        .map_err(|e| format!("Network problem: {e}"))?;
    if res.status().as_u16() == 401 || res.status().as_u16() == 403 {
        return Err("RetroAchievements didn't accept your user name and Web API key.".into());
    }
    if !res.status().is_success() {
        return Err(format!("RetroAchievements answered {}", res.status()));
    }
    let v: Vec<RaGame> = res.json().await.map_err(|_| "RetroAchievements sent something Emu Vault doesn't understand. Check your Web API key.".to_string())?;
    let _ = std::fs::create_dir_all(cache_dir());
    let _ = std::fs::write(&p, serde_json::to_vec(&v).unwrap_or_default());
    Ok(v)
}

// ------------------------------------------------------------------ the check

#[derive(Serialize, Clone)]
pub struct RaRow {
    sys: String,
    name: String,
    path: String,
    /// ok | noset | other | no | disc | none
    status: String,
    game: String,
    achievements: u32,
    points: u32,
    game_id: u64,
}

fn key_of(t: &str) -> String {
    let t = t.to_lowercase();
    let t = crate::re!(r"\([^)]*\)|\[[^\]]*\]").replace_all(&t, " ");
    let t = t.replace('&', " and ").replace('+', " and ");
    crate::re!(r"[^a-z0-9]+").replace_all(&t, " ").replace(" the ", " ").trim().to_string()
}

#[derive(Serialize)]
pub struct RaResult {
    rows: Vec<RaRow>,
    checked: String,
}

fn hash_cache_path() -> PathBuf {
    cache_dir().join("hashes.json")
}

#[tauri::command]
pub async fn ra_check(app: tauri::AppHandle, core: tauri::State<'_, Core>, fresh: Option<bool>) -> Result<RaResult, String> {
    let (user, key) = {
        let c = core.cfg.lock().unwrap();
        (c.ra_user.clone(), c.ra_key.clone())
    };
    if key.trim().is_empty() {
        return Err("Fill in your RetroAchievements user name and Web API key first.".into());
    }
    let lib = core.lib.lock().unwrap().clone();
    let mut hc: HashMap<String, (u64, String)> =
        std::fs::read_to_string(hash_cache_path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default();
    let mut rows = vec![];
    let mut systems: Vec<&String> = lib.keys().collect();
    systems.sort();
    let total: usize = lib.values().map(|v| v.len()).sum();
    let mut done = 0;
    for sys in systems {
        let files = &lib[sys];
        let Some(cid) = console_id(sys) else {
            let st = if is_disc_system(sys) { "disc" } else { "none" };
            for f in files {
                rows.push(RaRow {
                    sys: sys.clone(),
                    name: f.name.clone(),
                    path: f.path.clone(),
                    status: st.into(),
                    game: String::new(),
                    achievements: 0,
                    points: 0,
                    game_id: 0,
                });
            }
            done += files.len();
            continue;
        };
        let list = game_list(&core, cid, &user, &key, fresh.unwrap_or(false)).await?;
        let mut by_hash: HashMap<String, &RaGame> = HashMap::new();
        let mut by_title: HashMap<String, &RaGame> = HashMap::new();
        for g in &list {
            for h in &g.hashes {
                by_hash.insert(h.to_lowercase(), g);
            }
            by_title.entry(key_of(&g.title)).or_insert(g);
        }
        for f in files {
            done += 1;
            if done % 20 == 0 {
                let _ = app.emit("ra-progress", (done, total));
            }
            let stamp = f.size ^ crate::roms::mtime_pub(Path::new(&f.path));
            let h = match hc.get(&f.path) {
                Some((s, h)) if *s == stamp => h.clone(),
                _ => {
                    let p = PathBuf::from(&f.path);
                    let s2 = sys.clone();
                    let h = if crate::discs::ra_supported(sys) {
                        let _ = app.emit("ra-progress", (done, total));
                        tokio::task::spawn_blocking(move || crate::discs::analyze(&s2, &p).map(|i| i.ra).unwrap_or_default()).await.unwrap_or_default()
                    } else {
                        tokio::task::spawn_blocking(move || read_rom(&p).map(|(n, d)| hash_bytes(&s2, &n, &d))).await.ok().flatten().unwrap_or_default()
                    };
                    hc.insert(f.path.clone(), (stamp, h.clone()));
                    h
                }
            };
            let (status, g) = if let Some(g) = by_hash.get(&h) {
                (if g.achievements > 0 { "ok" } else { "noset" }, Some(*g))
            } else if let Some(g) = by_title.get(&key_of(f.name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&f.name))) {
                ("other", Some(*g))
            } else {
                ("no", None)
            };
            rows.push(RaRow {
                sys: sys.clone(),
                name: f.name.clone(),
                path: f.path.clone(),
                status: status.into(),
                game: g.map(|g| g.title.clone()).unwrap_or_default(),
                achievements: g.map(|g| g.achievements).unwrap_or(0),
                points: g.map(|g| g.points).unwrap_or(0),
                game_id: g.map(|g| g.id).unwrap_or(0),
            });
        }
    }
    let _ = std::fs::create_dir_all(cache_dir());
    let _ = std::fs::write(hash_cache_path(), serde_json::to_vec(&hc).unwrap_or_default());
    let _ = app.emit("ra-progress", (total, total));
    let ok = rows.iter().filter(|r| r.status == "ok").count();
    core.log(format!("RetroAchievements: {ok} of {} games supported", rows.len()));
    let res = RaResult { rows, checked: store::now() };
    let _ = std::fs::write(cache_dir().join("last.json"), serde_json::to_vec(&res).unwrap_or_default());
    Ok(res)
}

/// The last check, so the screen shows it again after a restart.
#[tauri::command]
pub fn ra_last() -> Option<serde_json::Value> {
    std::fs::read_to_string(cache_dir().join("last.json")).ok().and_then(|t| serde_json::from_str(&t).ok())
}

#[tauri::command]
pub fn ra_account(core: tauri::State<Core>, user: String, key: String) -> Result<(), String> {
    let mut c = core.cfg.lock().unwrap();
    c.ra_user = user.trim().to_string();
    c.ra_key = key.trim().to_string();
    store::save_config(&c)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ra_hash_rules() {
        let body = vec![7u8; 8192];
        let mut nes = b"NES\x1a".to_vec();
        nes.extend(vec![0u8; 12]);
        nes.extend(&body);
        assert_eq!(hash_bytes("nes", "a.nes", &nes), hash_bytes("gba", "a.gba", &body));
        let mut snes = vec![0u8; 512];
        snes.extend(&body);
        assert_eq!(hash_bytes("snes", "a.smc", &snes), hash_bytes("snes", "a.sfc", &body));
        // N64: .v64 and .n64 hash like .z64
        let z: Vec<u8> = vec![0x80, 0x37, 0x12, 0x40, 1, 2, 3, 4];
        let v: Vec<u8> = vec![0x37, 0x80, 0x40, 0x12, 2, 1, 4, 3];
        let n: Vec<u8> = vec![0x40, 0x12, 0x37, 0x80, 4, 3, 2, 1];
        assert_eq!(hash_bytes("n64", "a.v64", &v), hash_bytes("n64", "a.z64", &z));
        assert_eq!(hash_bytes("n64", "a.n64", &n), hash_bytes("n64", "a.z64", &z));
        assert_eq!(hash_bytes("arcade", "sf2.zip", b"whatever"), hex::encode(Md5::digest(b"sf2")));
        assert_eq!(key_of("Super Mario World (USA) [!]"), "super mario world");
    }
}
