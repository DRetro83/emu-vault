//! ROMs: reading file names, recognising games by fingerprint (No-Intro, Redump,
//! FinalBurn Neo), scanning the library, the inbox, duplicates / 1G1R and multi-disc.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

#[macro_export]
macro_rules! re {
    ($s:expr) => {{
        static R: std::sync::LazyLock<regex::Regex> = std::sync::LazyLock::new(|| regex::Regex::new($s).unwrap());
        &*R
    }};
}

// ------------------------------------------------------------------ names

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub struct Parsed {
    pub title: String,
    pub key: String,
    pub regions: Vec<String>,
    pub rev: u32,
    pub disc: u32,
    pub special: Vec<String>,
    pub verified: bool,
    pub bad: bool,
    pub langs: String,
    pub ext: String,
}

fn region_of(word: &str) -> Option<&'static str> {
    Some(match word {
        "usa" | "us" | "canada" | "u" => "US",
        "europe" | "eu" | "e" | "germany" | "france" | "spain" | "italy" | "netherlands" | "united kingdom" | "uk" | "australia" | "sweden" | "scandinavia"
        | "denmark" | "norway" | "finland" | "portugal" | "greece" | "poland" | "austria" | "switzerland" | "belgium" | "ireland" | "new zealand"
        | "croatia" | "czech" | "hungary" | "g" | "f" | "s" | "i" | "nl" | "uk " => "EU",
        "japan" | "jp" | "j" => "JP",
        "world" | "w" => "W",
        "korea" | "k" | "china" | "c" | "asia" | "a" | "brazil" | "b" | "taiwan" | "hong kong" | "russia" | "india" | "latin america" | "mexico"
        | "argentina" | "south africa" | "singapore" | "thailand" | "turkey" | "israel" => "OV",
        _ => return None,
    })
}

pub fn title_key(title: &str) -> String {
    // "Legend of Zelda, The" -> "The Legend of Zelda"
    let re = re!(r"(?i)^(.*?),\s*(The|A|An|De|Het|Le|La|Les|Die|Der)\b(.*)$");
    let t = re.replace(title, "$2 $1$3").to_string();
    let mut s = String::new();
    for c in t.to_lowercase().chars() {
        let c = match c {
            'à' | 'á' | 'â' | 'ã' | 'ä' | 'å' => 'a',
            'è' | 'é' | 'ê' | 'ë' => 'e',
            'ì' | 'í' | 'î' | 'ï' => 'i',
            'ò' | 'ó' | 'ô' | 'õ' | 'ö' => 'o',
            'ù' | 'ú' | 'û' | 'ü' => 'u',
            'ñ' => 'n',
            'ç' => 'c',
            _ => c,
        };
        if c == '&' {
            s.push_str(" and ");
        } else if c.is_ascii_alphanumeric() {
            s.push(c);
        } else {
            s.push(' ');
        }
    }
    let words: Vec<&str> = s.split_whitespace().filter(|w| !matches!(*w, "the" | "version" | "edition")).collect();
    words.join(" ")
}

pub fn display_title(title: &str) -> String {
    let re = re!(r"(?i)^(.*?),\s*(The|A|An|De|Het|Le|La|Les|Die|Der)\b(.*)$");
    re.replace(title.trim(), "$2 $1$3").to_string()
}

pub fn parse_rom(name: &str) -> Parsed {
    let (base, ext) = match name.rfind('.') {
        Some(i) if i > 0 && name.len() - i <= 6 && !name[i + 1..].contains(' ') && !name[i + 1..].contains(')') => (&name[..i], name[i..].to_lowercase()),
        _ => (name, String::new()),
    };
    let round: Vec<String> = re!(r"\(([^)]*)\)").captures_iter(base).map(|c| c[1].trim().to_string()).collect();
    let square: Vec<String> = re!(r"\[([^\]]*)\]").captures_iter(base).map(|c| c[1].trim().to_string()).collect();
    let mut p = Parsed { ext, ..Default::default() };
    let lang_re = re!(r"^[A-Z][a-z](\+[A-Z][a-z])*(,\s*[A-Z][a-z](\+[A-Z][a-z])*)*$");
    for t in &round {
        let tl = t.to_lowercase();
        if lang_re.is_match(t) {
            p.langs = t.replace(' ', "");
            continue;
        }
        // GoodTools short codes like (U), (E), (JU), (UE)
        if t.len() <= 3 && t.chars().all(|c| "UEJWKCAB".contains(c)) && !t.is_empty() {
            for c in t.chars() {
                if let Some(r) = region_of(&c.to_ascii_lowercase().to_string()) {
                    p.regions.push(r.into());
                }
            }
            continue;
        }
        let parts: Vec<&str> = tl.split(',').map(|x| x.trim()).collect();
        if parts.iter().all(|x| region_of(x).is_some() && x.len() > 1) {
            for x in parts {
                p.regions.push(region_of(x).unwrap().into());
            }
            continue;
        }
        if let Some(c) = re!(r"^rev\s*([0-9a-z]+)$").captures(&tl) {
            let v = &c[1];
            p.rev = v.parse().unwrap_or_else(|_| v.chars().next().map(|ch| ch as u32 - 'a' as u32 + 1).unwrap_or(0));
            continue;
        }
        if let Some(c) = re!(r"^v(\d+)(?:\.(\d+))?").captures(&tl) {
            p.rev = c[1].parse::<u32>().unwrap_or(0) * 100 + c.get(2).and_then(|m| m.as_str().parse().ok()).unwrap_or(0);
            continue;
        }
        if let Some(c) = re!(r"^(?:disc|disk|cd)\s*(\d+)").captures(&tl) {
            p.disc = c[1].parse().unwrap_or(0);
            continue;
        }
        if re!(r"^(hack|beta|proto|demo|sample|unl|pirate|aftermarket|homebrew|kiosk|debug)").is_match(&tl) {
            p.special.push(t.clone());
        }
    }
    for t in &square {
        let tl = t.to_lowercase();
        if tl == "!" {
            p.verified = true;
        } else if re!(r"^b\d*$").is_match(&tl) {
            p.bad = true;
        } else if re!(r"^(t[-+]|h\d*$|hack)").is_match(&tl) {
            p.special.push(t.clone());
        }
    }
    p.regions.sort();
    p.regions.dedup();
    let title_raw = re!(r"\([^)]*\)|\[[^\]]*\]").replace_all(base, " ").replace('_', " ");
    let title_raw = title_raw.split_whitespace().collect::<Vec<_>>().join(" ");
    p.title = display_title(&title_raw);
    p.key = title_key(&title_raw);
    if !p.special.is_empty() {
        p.key.push_str(" #");
        p.key.push_str(&p.special.join("|").to_lowercase());
    }
    p
}

// ------------------------------------------------------------------ game database

pub const GAMES_GZ: &[u8] = include_bytes!("../data/games.tsv.gz");

#[derive(Debug, Clone)]
pub struct Entry {
    pub crc: u32,
    pub name: String,
    /// arcade set name (e.g. "sf2")
    pub set: String,
    /// 'b' bios, 'c' clone
    pub flag: char,
}

#[derive(Debug, Default, Clone)]
pub struct SysDb {
    /// libretro / DAT system name, e.g. "Nintendo - Super Nintendo Entertainment System"
    pub full: String,
    /// cart | disc | arcade
    pub kind: String,
    pub ver: String,
    pub entries: Vec<Entry>,
    pub by_crc: HashMap<u32, Vec<usize>>,
    pub by_name: HashMap<String, usize>,
}

pub struct Db {
    pub systems: HashMap<String, SysDb>,
    pub crc_any: HashMap<u32, Vec<(String, usize)>>,
}

static DB: OnceLock<Db> = OnceLock::new();

/// ES-DE folders that are another name for a console with a list.
pub const ESDE_ALIAS: &[(&str, &str)] = &[
    ("genesis", "megadrive"),
    ("megadrivejp", "megadrive"),
    ("famicom", "nes"),
    ("sfc", "snes"),
    ("snesna", "snes"),
    ("tg16", "pcengine"),
    ("tg-cd", "pcenginecd"),
    ("megacd", "segacd"),
    ("megacdjp", "segacd"),
    ("sega32xjp", "sega32x"),
    ("sega32xna", "sega32x"),
    ("saturnjp", "saturn"),
    ("neogeocdjp", "neogeocd"),
    ("mark3", "mastersystem"),
    ("msx1", "msx"),
    ("amiga600", "amiga"),
    ("amiga1200", "amiga"),
    ("atarixe", "atari800"),
    ("sgb", "gb"),
    ("naomigd", "naomi"),
    ("fbneo", "arcade"),
    ("fba", "arcade"),
    ("mame", "arcade"),
    ("cps", "arcade"),
    ("arcadia", "emerson-arcadia-2001"),
    ("gamecom", "tiger-game-com"),
    ("supervision", "watara-supervision"),
    ("vsmile", "vtech-v-smile"),
    ("crvision", "vtech-creativision"),
    ("supracan", "funtech-super-acan"),
    ("gmaster", "hartung-game-master"),
    ("pv1000", "casio-pv-1000"),
    ("arduboy", "arduboy-inc-arduboy"),
];

pub fn db() -> &'static Db {
    DB.get_or_init(|| {
        use std::io::Read;
        let mut text = String::new();
        let _ = flate2::read::GzDecoder::new(GAMES_GZ).read_to_string(&mut text);
        let mut systems: HashMap<String, SysDb> = HashMap::new();
        let mut cur: Option<String> = None;
        for line in text.lines() {
            if let Some(h) = line.strip_prefix('@') {
                let f: Vec<&str> = h.split('\t').collect();
                let id = f[0].to_string();
                systems.insert(
                    id.clone(),
                    SysDb {
                        full: f.get(1).unwrap_or(&"").to_string(),
                        kind: f.get(2).unwrap_or(&"cart").to_string(),
                        ver: f.get(3).unwrap_or(&"").to_string(),
                        ..Default::default()
                    },
                );
                cur = Some(id);
                continue;
            }
            let Some(id) = &cur else { continue };
            let s = systems.get_mut(id).unwrap();
            let f: Vec<&str> = line.split('\t').collect();
            let e = Entry {
                crc: u32::from_str_radix(f[0], 16).unwrap_or(0),
                name: f.get(1).unwrap_or(&"").to_string(),
                set: f.get(2).unwrap_or(&"").to_string(),
                flag: f.get(3).and_then(|x| x.chars().next()).unwrap_or(' '),
            };
            let i = s.entries.len();
            if e.crc != 0 {
                s.by_crc.entry(e.crc).or_default().push(i);
            }
            s.by_name.entry(e.name.to_lowercase()).or_insert(i);
            if !e.set.is_empty() {
                s.by_name.entry(e.set.to_lowercase()).or_insert(i);
            }
            s.entries.push(e);
        }
        // newer lists downloaded with "Update the game lists" (Settings): <config>/lists/<system>.tsv
        if let Ok(rd) = std::fs::read_dir(crate::store::app_dir().join("lists")) {
            for e in rd.flatten() {
                let p = e.path();
                if p.extension().map(|x| x != "tsv").unwrap_or(true) {
                    continue;
                }
                let id = p.file_stem().unwrap().to_string_lossy().to_string();
                let Ok(t) = std::fs::read_to_string(&p) else { continue };
                let Some(s) = systems.get_mut(&id) else { continue };
                let mut lines = t.lines();
                if let Some(h) = lines.next().and_then(|l| l.strip_prefix('@')) {
                    s.ver = h.split('\t').nth(3).unwrap_or("").to_string();
                }
                s.entries.clear();
                s.by_crc.clear();
                s.by_name.clear();
                for line in lines {
                    let f: Vec<&str> = line.split('\t').collect();
                    let e = Entry { crc: u32::from_str_radix(f[0], 16).unwrap_or(0), name: f.get(1).unwrap_or(&"").to_string(), set: String::new(), flag: ' ' };
                    let i = s.entries.len();
                    if e.crc != 0 {
                        s.by_crc.entry(e.crc).or_default().push(i);
                    }
                    s.by_name.entry(e.name.to_lowercase()).or_insert(i);
                    s.entries.push(e);
                }
            }
        }
        let mut crc_any: HashMap<u32, Vec<(String, usize)>> = HashMap::new();
        for (id, s) in &systems {
            for (c, v) in &s.by_crc {
                crc_any.entry(*c).or_default().push((id.clone(), v[0]));
            }
        }
        // ES-DE folder names for the same console use that console's list (after crc_any, so the
        // Inbox keeps sorting into the main name)
        for (alias, src) in ESDE_ALIAS {
            if !systems.contains_key(*alias) {
                if let Some(s) = systems.get(*src).cloned() {
                    systems.insert(alias.to_string(), s);
                }
            }
        }
        Db { systems, crc_any }
    })
}

// ------------------------------------------------------------------ fingerprints

pub type HashCache = Mutex<HashMap<String, (u64, i64, Vec<u32>)>>;

pub fn mtime_pub(p: &Path) -> u64 {
    mtime(p) as u64
}
fn mtime(p: &Path) -> i64 {
    p.metadata().and_then(|m| m.modified()).ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs() as i64).unwrap_or(0)
}

/// CRC32 candidates for a file: the whole file and, for files with a copier/emulator
/// header (NES, FDS, Lynx, Atari 7800, SNES copier), the file without it.
/// For a .zip: the CRCs of the files inside, read from the zip index (no unpacking).
pub fn crcs(p: &Path, cache: &HashCache) -> Vec<u32> {
    let Ok(meta) = p.metadata() else { return vec![] };
    let len = meta.len();
    let key = p.to_string_lossy().to_string();
    let mt = mtime(p);
    if let Some((l, m, v)) = cache.lock().unwrap().get(&key) {
        if *l == len && *m == mt {
            return v.clone();
        }
    }
    let ext = p.extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default();
    let mut out = vec![];
    if ext == "zip" {
        if let Ok(f) = std::fs::File::open(p) {
            if let Ok(mut z) = zip::ZipArchive::new(f) {
                for i in 0..z.len().min(64) {
                    if let Ok(e) = z.by_index_raw(i) {
                        if !e.is_dir() {
                            out.push(e.crc32());
                        }
                    }
                }
            }
        }
    } else if len > 0
        && len <= 1024 * 1024 * 1024
        && !matches!(ext.as_str(), "7z" | "rar" | "chd" | "rvz" | "cso" | "pbp" | "wbfs" | "cue" | "gdi" | "cdi" | "m3u")
        // .bin/.iso/.img are cartridge dumps when small (Mega Drive, Atari…), disc images when big
        && !(matches!(ext.as_str(), "bin" | "iso" | "img") && len > 64 * 1024 * 1024)
    {
        use std::io::Read;
        if let Ok(mut f) = std::fs::File::open(p) {
            let mut whole = crc32fast::Hasher::new();
            let mut skip_hdr: Option<(usize, crc32fast::Hasher)> = None;
            let mut first = true;
            let mut buf = vec![0u8; 1 << 20];
            loop {
                let n = match f.read(&mut buf) {
                    Ok(0) | Err(_) => break,
                    Ok(n) => n,
                };
                let chunk = &buf[..n];
                if first {
                    first = false;
                    let hdr = if chunk.starts_with(b"NES\x1a") || chunk.starts_with(b"FDS\x1a") {
                        16
                    } else if chunk.starts_with(b"LYNX") {
                        64
                    } else if chunk.len() > 128 && &chunk[1..10] == b"ATARI7800" {
                        128
                    } else if (ext == "smc" || ext == "sfc" || ext == "fig" || ext == "swc") && len % 1024 == 512 {
                        512
                    } else {
                        0
                    };
                    if hdr > 0 && chunk.len() > hdr {
                        let mut h = crc32fast::Hasher::new();
                        h.update(&chunk[hdr..]);
                        skip_hdr = Some((hdr, h));
                    }
                } else if let Some((_, h)) = &mut skip_hdr {
                    h.update(chunk);
                }
                whole.update(chunk);
            }
            out.push(whole.finalize());
            if let Some((_, h)) = skip_hdr {
                out.push(h.finalize());
            }
        }
    }
    cache.lock().unwrap().insert(key, (len, mt, out.clone()));
    out
}

// ------------------------------------------------------------------ extensions and folder names

pub fn system_for_ext(ext: &str) -> Option<&'static str> {
    Some(match ext.trim_start_matches('.') {
        "sfc" | "smc" | "fig" | "swc" | "bs" => "snes",
        "nes" | "unf" | "unif" => "nes",
        "fds" => "fds",
        "gb" => "gb",
        "gbc" => "gbc",
        "gba" => "gba",
        "n64" | "z64" | "v64" => "n64",
        "nds" => "nds",
        "3ds" | "cia" | "cci" | "cxi" => "n3ds",
        "md" | "gen" | "smd" | "68k" => "megadrive",
        "sms" => "mastersystem",
        "gg" => "gamegear",
        "32x" => "sega32x",
        "sg" => "sg-1000",
        "pce" => "pcengine",
        "sgx" => "supergrafx",
        "ws" => "wonderswan",
        "wsc" => "wonderswancolor",
        "ngp" => "ngp",
        "ngc" => "ngpc",
        "a26" => "atari2600",
        "a52" => "atari5200",
        "a78" => "atari7800",
        "lnx" => "atarilynx",
        "j64" | "jag" => "atarijaguar",
        "vb" | "vboy" => "virtualboy",
        "min" => "pokemini",
        "col" => "colecovision",
        "int" => "intellivision",
        "vec" => "vectrex",
        "gcm" | "rvz" | "gcz" => "gc",
        "wbfs" | "wad" => "wii",
        "xci" | "nsp" => "switch",
        "vpk" => "psvita",
        "d64" | "t64" | "crt" | "prg" => "c64",
        "adf" | "ipf" => "amiga",
        "st" | "msa" => "atarist",
        "tzx" | "z80" => "zxspectrum",
        "gdi" | "cdi" => "dreamcast",
        "cso" => "psp",
        "pbp" => "psx",
        _ => return None,
    })
}

pub fn system_for_folder(name: &str) -> Option<String> {
    let n = name.to_lowercase().replace([' ', '_', '-'], "");
    let m = match n.as_str() {
        "snes" | "sfc" | "supernintendo" | "superfamicom" | "supernes" => "snes",
        "nes" | "famicom" | "fc" | "nintendo" => "nes",
        "gb" | "gameboy" => "gb",
        "gbc" | "gameboycolor" => "gbc",
        "gba" | "gameboyadvance" => "gba",
        "n64" | "nintendo64" => "n64",
        "nds" | "ds" | "nintendods" => "nds",
        "3ds" | "n3ds" | "nintendo3ds" => "n3ds",
        "md" | "megadrive" | "genesis" | "segagenesis" | "segamegadrive" => "megadrive",
        "sms" | "mastersystem" | "segamastersystem" => "mastersystem",
        "gg" | "gamegear" | "segagamegear" => "gamegear",
        "32x" | "sega32x" => "sega32x",
        "segacd" | "megacd" | "scd" => "segacd",
        "saturn" | "segasaturn" | "ss" => "saturn",
        "dc" | "dreamcast" | "segadreamcast" => "dreamcast",
        "ps1" | "psx" | "playstation" | "psone" | "playstation1" => "psx",
        "ps2" | "playstation2" => "ps2",
        "ps3" | "playstation3" => "ps3",
        "psp" | "playstationportable" => "psp",
        "psvita" | "vita" => "psvita",
        "pce" | "pcengine" | "tg16" | "turbografx16" | "turbografx" => "pcengine",
        "pcecd" | "pcenginecd" | "tgcd" | "turbografxcd" => "pcenginecd",
        "gc" | "ngc" | "gamecube" | "nintendogamecube" => "gc",
        "wii" => "wii",
        "wiiu" => "wiiu",
        "switch" | "nintendoswitch" => "switch",
        "ngp" | "neogeopocket" => "ngp",
        "ngpc" | "neogeopocketcolor" => "ngpc",
        "neogeo" => "neogeo",
        "neogeocd" | "neocd" => "neogeocd",
        "ws" | "wonderswan" => "wonderswan",
        "wsc" | "wonderswancolor" => "wonderswancolor",
        "lynx" | "atarilynx" => "atarilynx",
        "atari2600" | "a2600" | "2600" => "atari2600",
        "atari7800" | "7800" => "atari7800",
        "arcade" | "mame" | "fbneo" | "fba" | "finalburnneo" => "arcade",
        "vb" | "virtualboy" => "virtualboy",
        "xbox" => "xbox",
        "3do" => "3do",
        "msx" => "msx",
        "c64" | "commodore64" => "c64",
        "amiga" => "amiga",
        _ => {
            return crate::library::systems().into_iter().find(|s| s.id.replace('-', "") == n).map(|s| s.id);
        }
    };
    Some(m.to_string())
}

/// Systems whose emulators read .m3u playlists (discs, and floppies in RetroArch), with what reads them.
pub const DISC_SYSTEMS: &[(&str, &str)] = &[
    ("psx", "DuckStation, RetroArch"),
    ("saturn", "RetroArch (Beetle Saturn, Yabasanshiro)"),
    ("segacd", "RetroArch (Genesis Plus GX)"),
    ("dreamcast", "Flycast"),
    ("pcenginecd", "RetroArch (Beetle PCE)"),
    ("3do", "RetroArch (Opera)"),
    ("pcfx", "RetroArch (Beetle PC-FX)"),
    ("neogeocd", "RetroArch (NeoCD)"),
    ("amigacd32", "RetroArch (PUAE)"),
    ("cdtv", "RetroArch (PUAE)"),
    ("atarijaguarcd", "RetroArch"),
    ("cdimono1", "RetroArch (SAME CDi)"),
    ("gc", "Dolphin"),
    ("amiga", "RetroArch (PUAE), floppies"),
    ("msx", "RetroArch (blueMSX), floppies"),
    ("pc98", "RetroArch (Neko Project II), floppies"),
    ("atarist", "RetroArch (Hatari), floppies"),
    ("c64", "RetroArch (VICE), disks"),
];
/// Systems with more than one disc where a playlist doesn't work.
pub const M3U_NO: &[(&str, &str)] = &[
    ("ps2", "PCSX2 can't read playlists. Keep the discs as they are and use Change Disc in PCSX2."),
    ("xbox", "xemu can't read playlists. Load the next disc from xemu's menu."),
    ("wii", "Dolphin plays Wii games from one disc; nothing to combine."),
];
const MEDIA_DIRS: &[&str] =
    &["media", "images", "videos", "manuals", "downloaded_media", "snaps", "boxart", "_duplicates", "_converted", "covers", "screenshots"];
const NOT_GAMES: &[&str] = &[
    "txt", "xml", "nfo", "md", "png", "jpg", "jpeg", "webp", "gif", "db", "ini", "cfg", "srm", "sav", "state", "json", "log", "dat", "pdf", "mp4", "lpl",
    "part", "sha1", "md5", "sfv", "url", "html", "htm",
];

// ------------------------------------------------------------------ library scan

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RomFile {
    pub sys: String,
    pub path: String,
    pub rel: String,
    pub name: String,
    pub size: u64,
    /// matched entry name in the database ("" if unknown)
    pub dat: String,
    /// ok | unknown | bad | different (name says one game, fingerprint says no match)
    pub check: String,
    pub p: Parsed,
    pub crc: u32,
    /// files that belong to this game (cue tracks, discs in an m3u folder)
    pub parts: Vec<String>,
}

/// Files listed in a .cue sheet (the .bin tracks).
pub fn cue_files(cue: &Path) -> Vec<PathBuf> {
    let dir = cue.parent().unwrap_or(Path::new("."));
    std::fs::read_to_string(cue)
        .unwrap_or_default()
        .lines()
        .filter_map(|l| {
            let t = l.trim();
            if !t.to_uppercase().starts_with("FILE") {
                return None;
            }
            let rest = t[4..].trim();
            let name = if let Some(r) = rest.strip_prefix('"') { r.split('"').next()?.to_string() } else { rest.split_whitespace().next()?.to_string() };
            Some(dir.join(name))
        })
        .collect()
}

fn identify(sys: &str, path: &Path, name: &str, cache: &HashCache) -> (String, String, u32) {
    let d = db();
    let Some(s) = d.systems.get(sys) else { return (String::new(), "unknown".into(), 0) };
    let stem = name.rsplit_once('.').map(|(a, _)| a).unwrap_or(name);
    if s.kind == "cart" {
        let c = crcs(path, cache);
        for crc in &c {
            if let Some(ix) = s.by_crc.get(crc) {
                let pick = ix.iter().find(|&&i| s.entries[i].name.eq_ignore_ascii_case(stem)).copied().unwrap_or(ix[0]);
                return (s.entries[pick].name.clone(), "ok".into(), *crc);
            }
        }
        if s.by_name.contains_key(&stem.to_lowercase()) && !c.is_empty() {
            return (String::new(), "different".into(), c[0]);
        }
        return (String::new(), "unknown".into(), c.first().copied().unwrap_or(0));
    }
    // discs and arcade: by name
    let lookup = stem.to_lowercase();
    if let Some(&i) = s.by_name.get(&lookup) {
        return (s.entries[i].name.clone(), "ok".into(), 0);
    }
    if s.kind == "disc" {
        // "Game (USA) (Disc 1)" may be stored as one game per disc; try without track info
        let t = re!(r"(?i)\s*\(track \d+\)").replace_all(&lookup, "").to_string();
        if let Some(&i) = s.by_name.get(&t) {
            return (s.entries[i].name.clone(), "ok".into(), 0);
        }
    }
    (String::new(), "unknown".into(), 0)
}

// games in other folders: (folder, system)
static EXTRA: std::sync::RwLock<Vec<(String, String)>> = std::sync::RwLock::new(vec![]);
pub fn set_extra(dirs: &[crate::store::ExtraDir]) {
    *EXTRA.write().unwrap() = dirs.iter().filter(|d| !d.path.is_empty() && !d.sys.is_empty()).map(|d| (d.path.clone(), d.sys.clone())).collect();
}
pub fn extra_dirs() -> Vec<(String, String)> {
    EXTRA.read().unwrap().clone()
}

/// The games of a system: roms/<system>/ in the main folder, plus the other folders you added for it.
pub fn scan_system(root: &str, sys: &str, cache: &HashCache) -> Vec<RomFile> {
    let mut out = scan_base(&Path::new(root).join("roms").join(sys), sys, cache);
    for (dir, s) in extra_dirs() {
        if s == sys {
            out.extend(scan_base(Path::new(&dir), sys, cache));
        }
    }
    out
}

fn scan_base(base: &Path, sys: &str, cache: &HashCache) -> Vec<RomFile> {
    let base = base.to_path_buf();
    let mut out = vec![];
    if !base.is_dir() {
        return out;
    }
    let mut stack = vec![base.clone()];
    let mut claimed: HashSet<PathBuf> = HashSet::new();
    let mut files: Vec<PathBuf> = vec![];
    let mut m3u_dirs: Vec<PathBuf> = vec![];
    while let Some(d) = stack.pop() {
        let Ok(rd) = std::fs::read_dir(&d) else { continue };
        for e in rd.flatten() {
            let p = e.path();
            let n = e.file_name().to_string_lossy().to_string();
            if n.starts_with('.') {
                continue;
            }
            if p.is_dir() {
                if MEDIA_DIRS.contains(&n.to_lowercase().as_str()) {
                    continue;
                }
                if n.to_lowercase().ends_with(".m3u") {
                    m3u_dirs.push(p);
                } else {
                    stack.push(p);
                }
                continue;
            }
            let ext = p.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
            if NOT_GAMES.contains(&ext.as_str()) {
                continue;
            }
            files.push(p);
        }
    }
    // a "Game.m3u" folder is one game (ES-DE reads it as a file)
    for d in m3u_dirs {
        let n = d.file_name().unwrap().to_string_lossy().to_string();
        let inner = d.join(&n);
        let mut parts: Vec<String> = vec![];
        let mut size = 0;
        if let Ok(rd) = std::fs::read_dir(&d) {
            for e in rd.flatten() {
                size += e.metadata().map(|m| m.len()).unwrap_or(0);
                parts.push(e.path().to_string_lossy().into());
            }
        }
        let p = parse_rom(&n);
        out.push(RomFile {
            sys: sys.into(),
            rel: d.strip_prefix(&base).unwrap_or(&d).to_string_lossy().into(),
            path: if inner.exists() { inner.to_string_lossy().into() } else { d.to_string_lossy().into() },
            name: n,
            size,
            dat: String::new(),
            check: "ok".into(),
            p,
            crc: 0,
            parts,
        });
    }
    // cue sheets and loose m3u files claim their tracks/discs
    for f in &files {
        let ext = f.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
        if ext == "cue" {
            claimed.extend(cue_files(f));
        } else if ext == "gdi" {
            if let Ok(t) = std::fs::read_to_string(f) {
                for l in t.lines().skip(1) {
                    if let Some(n) = l.split_whitespace().nth(4) {
                        claimed.insert(f.parent().unwrap().join(n.trim_matches('"')));
                    }
                }
            }
        }
    }
    for f in files {
        if claimed.contains(&f) {
            continue;
        }
        let name = f.file_name().unwrap().to_string_lossy().to_string();
        let ext = f.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
        let mut parts = vec![];
        let mut size = f.metadata().map(|m| m.len()).unwrap_or(0);
        if ext == "cue" {
            for t in cue_files(&f) {
                size += t.metadata().map(|m| m.len()).unwrap_or(0);
                parts.push(t.to_string_lossy().to_string());
            }
        }
        let (dat, check, crc) = identify(sys, &f, &name, cache);
        let mut p = parse_rom(&name);
        if !dat.is_empty() {
            let q = parse_rom(&format!("{dat}.x"));
            if p.regions.is_empty() {
                p.regions = q.regions;
            }
            if p.langs.is_empty() {
                p.langs = q.langs;
            }
            if p.special.is_empty() {
                p.key = q.key;
                p.title = q.title;
                p.rev = p.rev.max(q.rev);
                p.disc = if p.disc == 0 { q.disc } else { p.disc };
            }
            p.verified = true;
        }
        let check = if p.bad { "bad".to_string() } else { check };
        out.push(RomFile {
            sys: sys.into(),
            rel: f.strip_prefix(&base).unwrap_or(&f).to_string_lossy().into(),
            path: f.to_string_lossy().into(),
            name,
            size,
            dat,
            check,
            p,
            crc,
            parts,
        });
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out
}

// ------------------------------------------------------------------ region rule, duplicates, 1G1R

pub fn region_rank(regions: &[String], order: &[String]) -> usize {
    if regions.is_empty() {
        return order.len() + 1;
    }
    let mut best = order.len() + 1;
    for r in regions {
        let i = if r == "W" { 0 } else { order.iter().position(|o| o == r).unwrap_or(order.len()) };
        best = best.min(i);
    }
    best
}

fn lang_count(p: &Parsed) -> usize {
    if p.langs.is_empty() {
        0
    } else {
        p.langs.split([',', '+']).count()
    }
}

/// Lower is better.
fn score(f: &RomFile, order: &[String]) -> (u8, usize, i64, i64, usize) {
    (
        if f.check == "ok" {
            0
        } else if f.check == "bad" {
            2
        } else {
            1
        },
        region_rank(&f.p.regions, order),
        -(f.p.rev as i64),
        -(lang_count(&f.p) as i64),
        f.name.len(),
    )
}

#[derive(Debug, Clone, Serialize)]
pub struct DupGroup {
    pub sys: String,
    pub title: String,
    pub key: String,
    pub keep: String,
    /// (path, name, reason) to move to _duplicates
    pub extra: Vec<(String, String, String)>,
    /// files that stay next to the kept one, with why
    pub also_keep: Vec<(String, String, String)>,
}

/// Same game in more than one file. With `one_g_one_r` every other version goes;
/// otherwise only exact copies (same fingerprint or same name) go.
pub fn find_dups(files: &[RomFile], order: &[String], one_g_one_r: bool, keep_langs: bool) -> Vec<DupGroup> {
    let mut out = vec![];
    // 1. byte-for-byte copies (same fingerprint), whatever their names
    let mut by_crc: HashMap<u32, Vec<&RomFile>> = HashMap::new();
    for f in files.iter().filter(|f| f.crc != 0) {
        by_crc.entry(f.crc).or_default().push(f);
    }
    let mut copies: HashSet<String> = HashSet::new();
    for (_, mut g) in by_crc {
        if g.len() < 2 {
            continue;
        }
        g.sort_by_key(|f| score(f, order));
        for f in g.iter().skip(1) {
            copies.insert(f.path.clone());
        }
        out.push(DupGroup {
            sys: g[0].sys.clone(),
            title: g[0].p.title.clone(),
            key: g[0].p.key.clone(),
            keep: g[0].name.clone(),
            extra: g.iter().skip(1).map(|f| (f.path.clone(), f.name.clone(), "exact copy".to_string())).collect(),
            also_keep: vec![],
        });
    }
    // 2. same game, other names/versions
    let mut groups: HashMap<(String, u32), Vec<&RomFile>> = HashMap::new();
    for f in files {
        if f.p.key.is_empty() || copies.contains(&f.path) {
            continue;
        }
        groups.entry((crate::lists::canon(&f.sys, &f.p.key), f.p.disc)).or_default().push(f);
    }
    for ((key, _), mut g) in groups {
        if g.len() < 2 {
            continue;
        }
        g.sort_by_key(|f| score(f, order));
        let keep = g[0];
        let mut extra = vec![];
        let mut also = vec![];
        for f in g.iter().skip(1) {
            let exact = (f.crc != 0 && f.crc == keep.crc) || (!f.dat.is_empty() && f.dat == keep.dat);
            if exact {
                extra.push((f.path.clone(), f.name.clone(), "exact copy".into()));
                continue;
            }
            if !one_g_one_r {
                also.push((f.path.clone(), f.name.clone(), "other version".into()));
                continue;
            }
            if keep_langs && !f.p.langs.is_empty() {
                let mine: HashSet<&str> = keep.p.langs.split([',', '+']).collect();
                if f.p.langs.split([',', '+']).any(|l| !mine.contains(l)) {
                    also.push((f.path.clone(), f.name.clone(), format!("has other languages ({})", f.p.langs)));
                    continue;
                }
            }
            let why = if region_rank(&f.p.regions, order) > region_rank(&keep.p.regions, order) {
                "region lower in your order".to_string()
            } else if f.p.rev < keep.p.rev {
                "older revision".to_string()
            } else if f.check != "ok" && keep.check == "ok" {
                "not a verified dump".to_string()
            } else {
                "other version".to_string()
            };
            extra.push((f.path.clone(), f.name.clone(), why));
        }
        if extra.is_empty() && !(!one_g_one_r && !also.is_empty()) {
            continue;
        }
        out.push(DupGroup { sys: keep.sys.clone(), title: keep.p.title.clone(), key, keep: keep.name.clone(), extra, also_keep: also });
    }
    // one group per kept file
    let mut merged: Vec<DupGroup> = vec![];
    for g in out {
        if let Some(m) = merged.iter_mut().find(|m| m.keep == g.keep && m.sys == g.sys) {
            m.extra.extend(g.extra);
            m.also_keep.extend(g.also_keep);
        } else {
            merged.push(g);
        }
    }
    merged.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    merged
}

// ------------------------------------------------------------------ multi-disc

#[derive(Debug, Clone, Serialize)]
pub struct MultiDisc {
    pub sys: String,
    pub name: String,
    pub discs: Vec<String>,
    /// disc numbers that are missing (e.g. only Disc 1 and 3 found)
    pub missing: Vec<u32>,
    /// why this can't be combined ("" when it can)
    pub no: String,
}

pub fn find_multidisc(files: &[RomFile]) -> Vec<MultiDisc> {
    let mut g: HashMap<String, Vec<&RomFile>> = HashMap::new();
    let disc_re = re!(r"(?i)\s*\((?:disc|disk|cd)\s*\d+[^)]*\)");
    for f in files {
        let known = DISC_SYSTEMS.iter().chain(M3U_NO).any(|(s, _)| *s == f.sys);
        if f.p.disc == 0 || !known || f.rel.contains('/') || f.name.to_lowercase().ends_with(".m3u") {
            continue;
        }
        let stem = f.name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&f.name);
        let base = disc_re.replace_all(stem, "").trim().to_string();
        g.entry(format!("{}/{}", f.sys, base)).or_default().push(f);
    }
    let mut out: Vec<MultiDisc> = g
        .into_iter()
        .map(|(key, mut v)| {
            v.sort_by_key(|f| f.p.disc);
            let name = key.split_once('/').map(|(_, n)| n.to_string()).unwrap_or(key);
            let max = v.iter().map(|f| f.p.disc).max().unwrap_or(1);
            let missing = (1..=max).filter(|i| !v.iter().any(|f| f.p.disc == *i)).collect();
            let no = M3U_NO.iter().find(|(s, _)| *s == v[0].sys).map(|(_, w)| w.to_string()).unwrap_or_default();
            MultiDisc { sys: v[0].sys.clone(), name, discs: v.iter().map(|f| f.path.clone()).collect(), missing, no }
        })
        .collect();
    out.sort_by(|a, b| a.name.cmp(&b.name));
    out
}

impl MultiDisc {
    /// All discs are there and the system reads playlists.
    pub fn ready(&self) -> bool {
        self.no.is_empty() && self.discs.len() >= 2 && self.missing.is_empty()
    }
}

// ------------------------------------------------------------------ inbox

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InboxItem {
    pub src: String,
    pub name: String,
    pub size: u64,
    pub sys: String,
    /// fingerprint | extension | folder | name | bios | unknown
    pub how: String,
    pub dest: String,
    /// new | same | other | bios | unknown | exists
    pub state: String,
    pub note: String,
    /// for "other": the file you already have, and whether the new one is better by your rule
    pub have: String,
    pub better: bool,
    pub parts: Vec<String>,
}

pub fn plan_inbox(
    root: &str,
    from: &str,
    library: &HashMap<String, Vec<RomFile>>,
    order: &[String],
    cache: &HashCache,
    md5: &crate::library::Md5Cache,
) -> Vec<InboxItem> {
    let d = db();
    let from_p = PathBuf::from(from);
    let mut files = vec![];
    let mut stack = vec![from_p.clone()];
    while let Some(dir) = stack.pop() {
        let Ok(rd) = std::fs::read_dir(&dir) else { continue };
        for e in rd.flatten() {
            let p = e.path();
            let n = e.file_name().to_string_lossy().to_string();
            if n.starts_with('.') || n.ends_with(".part") {
                continue;
            }
            if p.is_dir() {
                if !MEDIA_DIRS.contains(&n.to_lowercase().as_str()) {
                    stack.push(p);
                }
            } else {
                files.push(p);
            }
        }
    }
    // known BIOS fingerprints
    let mut bios_md5: HashMap<String, (String, String)> = HashMap::new();
    for e in crate::library::bios_db() {
        let id = e.get("id").and_then(|x| x.as_str()).unwrap_or("").to_string();
        for f in e.get("files").and_then(|f| f.as_array()).cloned().unwrap_or_default() {
            if let (Some(m), Some(n)) = (f.get("md5").and_then(|x| x.as_str()), f.get("f").and_then(|x| x.as_str())) {
                bios_md5.insert(m.to_lowercase(), (id.clone(), n.to_string()));
            }
        }
    }
    let mut claimed: HashSet<PathBuf> = HashSet::new();
    for f in &files {
        if f.extension().map(|e| e.to_string_lossy().eq_ignore_ascii_case("cue")).unwrap_or(false) {
            claimed.extend(cue_files(f));
        }
    }
    let mut out = vec![];
    for f in files {
        if claimed.contains(&f) {
            continue;
        }
        let name = f.file_name().unwrap().to_string_lossy().to_string();
        let ext = f.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
        let size = f.metadata().map(|m| m.len()).unwrap_or(0);
        if NOT_GAMES.contains(&ext.as_str()) && ext != "dat" {
            continue;
        }
        let mut item = InboxItem {
            src: f.to_string_lossy().into(),
            name: name.clone(),
            size,
            sys: String::new(),
            how: "unknown".into(),
            dest: String::new(),
            state: "unknown".into(),
            note: String::new(),
            have: String::new(),
            better: false,
            parts: vec![],
        };
        if ext == "cue" {
            item.parts = cue_files(&f).iter().map(|p| p.to_string_lossy().to_string()).collect();
            item.size += cue_files(&f).iter().map(|p| p.metadata().map(|m| m.len()).unwrap_or(0)).sum::<u64>();
        }
        // 1. BIOS by fingerprint
        if size > 0 && size <= 64 * 1024 * 1024 && !matches!(ext.as_str(), "zip" | "7z" | "chd" | "iso" | "cue") {
            if let Some(h) = crate::library::md5_file(&f, md5) {
                if let Some((sys, file)) = bios_md5.get(&h) {
                    let dest = Path::new(root).join("bios").join(sys).join(file);
                    item.sys = sys.clone();
                    item.how = "bios".into();
                    item.state = if dest.exists() { "same".into() } else { "bios".into() };
                    item.note = format!("BIOS file {file}");
                    item.dest = dest.to_string_lossy().into();
                    out.push(item);
                    continue;
                }
            }
        }
        // 2. fingerprint
        let mut sys: Option<(String, String)> = None;
        let c = crcs(&f, cache);
        for crc in &c {
            if let Some(hits) = d.crc_any.get(crc) {
                let by_ext = system_for_ext(&ext);
                let h = hits.iter().find(|(s, _)| Some(s.as_str()) == by_ext).unwrap_or(&hits[0]);
                sys = Some((h.0.clone(), "fingerprint".into()));
                break;
            }
        }
        // 3. folder name (inbox/GBA/...), 4. extension, 5. disc name
        if sys.is_none() {
            let mut p = f.parent();
            while let Some(dir) = p {
                if dir == from_p.as_path() {
                    break;
                }
                if let Some(s) = system_for_folder(&dir.file_name().unwrap_or_default().to_string_lossy()) {
                    sys = Some((s, "folder".into()));
                    break;
                }
                p = dir.parent();
            }
        }
        if sys.is_none() {
            if let Some(s) = system_for_ext(&ext) {
                sys = Some((s.into(), "extension".into()));
            }
        }
        if sys.is_none() {
            let stem = name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&name).to_lowercase();
            for (id, s) in &d.systems {
                if (s.kind == "disc" || s.kind == "arcade") && s.by_name.contains_key(&stem) {
                    sys = Some((id.clone(), "name".into()));
                    break;
                }
            }
        }
        let Some((sys, how)) = sys else {
            item.note = "Couldn't tell which system this is. Put it in a folder with the system's name (e.g. inbox/gba/) and look again.".into();
            out.push(item);
            continue;
        };
        item.sys = sys.clone();
        item.how = how;
        let dest = Path::new(root).join("roms").join(&sys).join(&name);
        item.dest = dest.to_string_lossy().into();
        let (dat, _check, crc) = identify(&sys, &f, &name, cache);
        let mut p = parse_rom(&name);
        if !dat.is_empty() {
            let q = parse_rom(&format!("{dat}.x"));
            if p.special.is_empty() {
                p.key = q.key;
            }
            if p.regions.is_empty() {
                p.regions = q.regions;
            }
            item.note = format!("Recognised: {dat}");
        }
        let lib = library.get(&sys).cloned().unwrap_or_default();
        if dest.exists() {
            item.state = "exists".into();
            item.note = "A file with this name is already there".into();
        } else if let Some(same) = lib.iter().find(|x| (crc != 0 && x.crc == crc) || (!dat.is_empty() && x.dat == dat)) {
            item.state = "same".into();
            item.have = same.name.clone();
            item.note = format!("You already have this exact game: {}", same.name);
        } else if let Some(other) = {
            let ck = crate::lists::canon(&sys, &p.key);
            lib.iter().filter(|x| crate::lists::canon(&sys, &x.p.key) == ck && x.p.disc == p.disc).min_by_key(|x| score(x, order))
        } {
            item.state = "other".into();
            item.have = other.name.clone();
            let mine = RomFile {
                sys: sys.clone(),
                path: String::new(),
                rel: String::new(),
                name: name.clone(),
                size,
                dat: dat.clone(),
                check: if dat.is_empty() { "unknown".into() } else { "ok".into() },
                p: p.clone(),
                crc,
                parts: vec![],
            };
            item.better = score(&mine, order) < score(other, order);
            item.note = format!("Other version of a game you have: {}", other.name);
        } else {
            item.state = "new".into();
        }
        out.push(item);
    }
    out.sort_by(|a, b| a.state.cmp(&b.state).then(a.name.cmp(&b.name)));
    out
}

// ------------------------------------------------------------------ collection lists

#[derive(Debug, Clone, Serialize)]
pub struct ListGame {
    pub title: String,
    pub key: String,
    /// bits: 1 US, 2 EU, 4 JP, 8 World, 16 other
    pub regions: u8,
    /// 0 official, 1 unlicensed/homebrew, 2 beta/proto/demo
    pub cat: u8,
    /// other names for the same game (another region's title)
    pub alts: Vec<String>,
}

pub fn region_bits(r: &[String]) -> u8 {
    r.iter().fold(0, |a, x| {
        a | match x.as_str() {
            "US" => 1,
            "EU" => 2,
            "JP" => 4,
            "W" => 8,
            _ => 16,
        }
    })
}

static LISTS: OnceLock<Mutex<HashMap<String, std::sync::Arc<Vec<ListGame>>>>> = OnceLock::new();

pub fn game_list(sys: &str) -> std::sync::Arc<Vec<ListGame>> {
    let m = LISTS.get_or_init(|| Mutex::new(HashMap::new()));
    if let Some(l) = m.lock().unwrap().get(sys) {
        return l.clone();
    }
    let mut games: HashMap<String, (ListGame, usize)> = HashMap::new();
    let skip = re!(r"\((Program|Test Program|Enhancement Chip|Update|DLC|Theme|Avatar|Demo Disc)\)");
    let test = re!(r"(?i)\b(beta|proto|demo|sample|kiosk|promo|debug|preview|trial)\b");
    let unl = re!(r"(?i)\b(unl|pirate|aftermarket|homebrew|bootleg|hack)\b");
    if let Some(s) = db().systems.get(sys) {
        for e in &s.entries {
            if e.name.starts_with("[BIOS]") || skip.is_match(&e.name) || e.flag == 'b' || e.flag == 'c' {
                continue;
            }
            let mut p = parse_rom(&format!("{}.x", e.name));
            let tags: String = re!(r"\(([^)]*)\)").captures_iter(&e.name).map(|c| c[1].to_string()).collect::<Vec<_>>().join(" ");
            let cat = if test.is_match(&tags) {
                2
            } else if unl.is_match(&tags) {
                1
            } else {
                0
            };
            if s.kind == "arcade" {
                p.regions = vec!["W".into()];
            }
            p.key = p.key.split(" #").next().unwrap_or("").to_string();
            if p.key.is_empty() {
                continue;
            }
            let rank = region_rank(&p.regions, &["US".into(), "EU".into(), "JP".into()]);
            let gk = crate::lists::clone_key(sys, &p.key);
            let g = games.entry(gk.clone()).or_insert((ListGame { title: p.title.clone(), key: gk, regions: 0, cat, alts: vec![] }, 99));
            g.0.regions |= region_bits(&p.regions);
            g.0.cat = g.0.cat.min(cat);
            if !g.0.alts.contains(&p.title) {
                g.0.alts.push(p.title.clone());
            }
            if cat == 0 && rank < g.1 {
                g.0.title = p.title.clone();
                g.1 = rank;
            }
        }
    }
    for (g, _) in games.values_mut() {
        let tk = title_key(&g.title);
        let mut seen = HashSet::new();
        g.alts.retain(|a| {
            let k = title_key(a);
            k != tk && seen.insert(k)
        });
    }
    let mut v: Vec<ListGame> = games.into_values().map(|x| x.0).collect();
    v.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    let a = std::sync::Arc::new(v);
    m.lock().unwrap().insert(sys.to_string(), a.clone());
    a
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn names() {
        let p = parse_rom("Legend of Zelda, The - A Link to the Past (USA) (Rev 1).sfc");
        assert_eq!(p.title, "The Legend of Zelda - A Link to the Past");
        assert_eq!(p.regions, vec!["US"]);
        assert_eq!(p.rev, 1);
        let p = parse_rom("Final Fantasy VII (Europe) (En,Fr,De) (Disc 2).chd");
        assert_eq!((p.disc, p.langs.as_str(), p.regions[0].as_str()), (2, "En,Fr,De", "EU"));
        let p = parse_rom("Super Mario World (U) [!].smc");
        assert!(p.verified && p.regions == vec!["US"]);
        let p = parse_rom("Final Fantasy V (Japan) [T-En by RPGe].sfc");
        assert!(p.key.contains("#t-en"));
        assert_eq!(title_key("Pokémon - Edición Roja"), "pokemon edicion roja");
    }
    #[test]
    fn database() {
        let d = db();
        assert!(d.systems.len() > 80);
        let snes = &d.systems["snes"];
        assert_eq!(snes.kind, "cart");
        assert!(snes.entries.len() > 3000);
        assert!(d.systems["psx"].kind == "disc");
        let l = game_list("snes");
        assert!(l.len() > 1500, "regional names count once");
        assert!(l.iter().any(|g| g.title.contains("Chrono Trigger") && g.regions & 1 == 1 && g.regions & 4 == 4));
        assert!(game_list("arcade").len() > 2300);
        assert!(game_list("neogeo").len() > 200);
        assert!(game_list("genesis").len() > 500);
        assert!(db().systems["neogeo"].by_name.contains_key("mslug"));
    }
    #[test]
    fn library_dups_m3u_inbox() {
        let root = std::env::temp_dir().join(format!("ev-roms-{}", std::process::id()));
        let r = root.to_string_lossy().to_string();
        let snes = root.join("roms/snes");
        std::fs::create_dir_all(&snes).unwrap();
        // a real No-Intro CRC: take any entry with a known crc, write a file with that content? We can't fake a CRC easily,
        // so test name/region logic with unknown dumps.
        for n in ["Chrono Trigger (USA).sfc", "Chrono Trigger (Japan).sfc", "Super Metroid (Japan, USA) (En,Ja).sfc", "Super Metroid (Europe) (En,Fr,De).sfc"] {
            std::fs::write(snes.join(n), n.as_bytes()).unwrap();
        }
        std::fs::write(snes.join("Chrono Trigger (USA) copy.sfc"), b"Chrono Trigger (USA).sfc").unwrap();
        let cache = HashCache::default();
        let files = scan_system(&r, "snes", &cache);
        assert_eq!(files.len(), 5);
        let order: Vec<String> = vec!["US".into(), "EU".into(), "JP".into()];
        let g = find_dups(&files, &order, true, true);
        let ct = g.iter().find(|x| x.title == "Chrono Trigger").unwrap();
        assert_eq!(ct.keep, "Chrono Trigger (USA).sfc");
        assert_eq!(ct.extra.len(), 2);
        assert!(ct.extra.iter().any(|e| e.2 == "exact copy"));
        assert!(g.iter().all(|x| x.title != "Super Metroid"), "European version has extra languages, so it stays");
        let g3 = find_dups(&files, &order, true, false);
        let sm = g3.iter().find(|x| x.title == "Super Metroid").unwrap();
        assert_eq!(sm.keep, "Super Metroid (Japan, USA) (En,Ja).sfc");
        assert_eq!(sm.extra.len(), 1);
        // only exact copies when 1G1R is off
        let g2 = find_dups(&files, &order, false, true);
        let ct2 = g2.iter().find(|x| x.title == "Chrono Trigger").unwrap();
        assert_eq!(ct2.extra.len(), 1);
        // multi-disc
        let psx = root.join("roms/psx");
        std::fs::create_dir_all(&psx).unwrap();
        for i in 1..=3 {
            std::fs::write(psx.join(format!("Final Fantasy VII (USA) (Disc {i}).cue")), format!("FILE \"Final Fantasy VII (USA) (Disc {i}).bin\" BINARY\n"))
                .unwrap();
            std::fs::write(psx.join(format!("Final Fantasy VII (USA) (Disc {i}).bin")), b"x").unwrap();
        }
        let pf = scan_system(&r, "psx", &cache);
        assert_eq!(pf.len(), 3, "bin tracks belong to their cue");
        assert_eq!(pf[0].check, "ok", "Redump name recognised");
        let mut both = pf.clone();
        let mut sat = pf[0].clone();
        sat.sys = "saturn".into();
        sat.path = "/x/sat.cue".into();
        both.push(sat);
        assert_eq!(find_multidisc(&both).len(), 2, "a Saturn disc doesn't join the PS1 game");
        assert!(find_multidisc(&both).iter().any(|m| m.sys == "saturn" && m.missing.is_empty() && m.discs.len() == 1));
        let md = find_multidisc(&pf);
        assert_eq!(md.len(), 1);
        assert_eq!(md[0].name, "Final Fantasy VII (USA)");
        // inbox
        let inbox = root.join("inbox");
        std::fs::create_dir_all(inbox.join("GBA")).unwrap();
        std::fs::write(inbox.join("GBA/mystery.bin"), b"abc").unwrap();
        std::fs::write(inbox.join("Chrono Trigger (Europe).sfc"), b"zz").unwrap();
        std::fs::write(inbox.join("Chrono Trigger (USA).sfc"), b"Chrono Trigger (USA).sfc").unwrap();
        std::fs::write(inbox.join("readme.txt"), b"x").unwrap();
        std::fs::write(inbox.join("weird.xyz"), b"x").unwrap();
        let mut lib = HashMap::new();
        lib.insert("snes".to_string(), files.clone());
        let plan = plan_inbox(&r, &inbox.to_string_lossy(), &lib, &order, &cache, &Default::default());
        let get = |n: &str| plan.iter().find(|x| x.name == n).unwrap().clone();
        assert_eq!(get("mystery.bin").sys, "gba");
        assert_eq!(get("mystery.bin").how, "folder");
        assert_eq!(get("Chrono Trigger (Europe).sfc").state, "other");
        assert!(!get("Chrono Trigger (Europe).sfc").better);
        assert_eq!(get("Chrono Trigger (USA).sfc").state, "exists");
        assert_eq!(get("weird.xyz").state, "unknown");
        assert!(plan.iter().all(|x| x.name != "readme.txt"));
        std::fs::remove_dir_all(root).unwrap();
    }
}
