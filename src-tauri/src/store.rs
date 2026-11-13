//! Settings, remembered check results, and the versions kept on disk.

use crate::sources::{Latest, Pick};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackRef {
    pub name: String,
    pub file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Config {
    pub root: String,
    /// android | linux | both
    pub platform: String,
    pub arch: String,
    pub keep: usize,
    pub enabled: Vec<String>,
    pub github_token: String,
    pub packs: Vec<PackRef>,
    pub check_on_start: bool,
    pub skin: String,
    pub first_run_done: bool,
    /// region order for duplicates/1G1R, e.g. ["US","EU","JP"]
    pub regions: Vec<String>,
    pub keep_langs: bool,
    /// delete files in _duplicates after this many days (0 = never)
    pub trash_days: i64,
    pub covers: crate::extras::CoverCfg,
    pub save_sources: Vec<crate::extras::SaveSource>,
    pub backup_keep: usize,
    pub backup_on_start: bool,
    /// saves schedule: daily | weekly | start | manual
    pub backup_when: String,
    pub profiles: Vec<crate::extras::Profile>,
    pub notify: bool,
    /// collection: which regions count (bits 1 US, 2 EU, 4 JP, 8 World, 16 other)
    pub coll_mask: u8,
    pub pc_pack_added: bool,
    /// apps you added yourself
    pub my_apps: Vec<MyApp>,
    /// "<app id>|<platform>" -> words of the file you chose when a release has several
    pub prefer: HashMap<String, String>,
    /// checks while Emu Vault is closed (a systemd timer)
    pub bg: BgCfg,
    /// RetroAchievements account (Web API key from retroachievements.org › Settings)
    pub ra_user: String,
    pub ra_key: String,
    /// games kept in other folders (another drive…): read where they are, never moved
    pub extra_dirs: Vec<ExtraDir>,
    /// ES-DE keeps its settings, game lists, collections and themes in <main folder>/ES-DE (started with --home)
    pub esde_vault: bool,
    /// system -> "ra:<core>" or "emu:<app id>"
    pub play_with: HashMap<String, String>,
    /// PC emulators that run from the vault
    pub vault_emus: Vec<String>,
    /// 0.9: RetroArch and the emulators started from the vault (Play, cores, ES-DE find rules). Off: you set up
    /// RetroArch, ES-DE and the emulators yourself; the vault keeps the files.
    pub ra_on: bool,
    /// 0.9.5: a full RetroArch system folder of your own, only read, to compare the vault's BIOS with
    pub bios_ref: String,
    /// emulators you chose yourself: app id -> program (relative to the main folder when it's inside)
    pub emu_paths: HashMap<String, String>,
    /// 0.10: platforms kept for apps you didn't set yourself ("linux", "windows", "android"); empty: `platform`
    pub plats_default: Vec<String>,
    /// 0.10: app id -> platforms you keep for it, also another chip ("linux@arm64")
    pub app_plats: HashMap<String, Vec<String>>,
    /// 0.11: RetroArch from libretro: the daily build instead of the stable one
    pub ra_nightly: bool,
    /// 0.11: RetroArch extras you ticked ("frontend/shaders_slang.zip", "system/PPSSPP.zip")
    pub ra_extras: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(default)]
pub struct ExtraDir {
    pub path: String,
    pub sys: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct BgCfg {
    pub on: bool,
    pub hours: u32,
    pub apps: bool,
    pub inbox: bool,
    pub saves: bool,
    pub covers: bool,
}
impl Default for BgCfg {
    fn default() -> Self {
        BgCfg { on: false, hours: 6, apps: true, inbox: true, saves: true, covers: true }
    }
}

/// An app you added yourself: a link to its releases (or none), and where you use it.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct MyApp {
    pub id: String,
    pub name: String,
    pub url: String,
    pub category: String,
    pub about: String,
    /// android | linux | windows | macos
    pub plats: Vec<String>,
    pub notes: String,
}

impl Default for Config {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp"));
        Config {
            root: home.join("Emulators").to_string_lossy().into(),
            platform: "both".into(),
            arch: "arm64-v8a".into(),
            keep: 3,
            enabled: vec![],
            github_token: String::new(),
            packs: vec![],
            check_on_start: true,
            skin: "retro".into(),
            first_run_done: false,
            regions: vec!["US".into(), "EU".into(), "JP".into()],
            keep_langs: true,
            trash_days: 30,
            covers: Default::default(),
            save_sources: crate::extras::detect_sources(),
            backup_keep: 3,
            backup_on_start: true,
            backup_when: "daily".into(),
            profiles: vec![],
            notify: true,
            coll_mask: 1 | 2 | 8,
            pc_pack_added: false,
            my_apps: vec![],
            prefer: HashMap::new(),
            bg: Default::default(),
            ra_user: String::new(),
            ra_key: String::new(),
            extra_dirs: vec![],
            esde_vault: true,
            play_with: HashMap::new(),
            vault_emus: vec![],
            ra_on: false,
            bios_ref: String::new(),
            emu_paths: HashMap::new(),
            plats_default: vec![],
            app_plats: HashMap::new(),
            ra_nightly: false,
            ra_extras: vec![],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppState {
    pub latest: Option<Latest>,
    pub checked: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct State {
    pub apps: HashMap<String, AppState>,
    pub last_check: String,
    pub log: Vec<(String, String)>,
}

pub fn app_dir() -> PathBuf {
    if let Ok(h) = std::env::var("EMUVAULT_HOME") {
        return PathBuf::from(h);
    }
    crate::stick::portable_dir().unwrap_or_else(home_dir)
}
/// Where the settings live when Emu Vault isn't run from a stick (~/.config/emu-vault, %APPDATA%\emu-vault).
pub(crate) fn home_dir() -> PathBuf {
    dirs::config_dir().unwrap_or_else(|| PathBuf::from("/tmp")).join("emu-vault")
}

fn read_json<T: for<'a> Deserialize<'a> + Default>(p: &Path) -> T {
    std::fs::read_to_string(p).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
pub(crate) fn write_json<T: Serialize>(p: &Path, v: &T) -> Result<(), String> {
    if let Some(d) = p.parent() {
        std::fs::create_dir_all(d).map_err(|e| e.to_string())?;
    }
    let tmp = p.with_extension("tmp");
    std::fs::write(&tmp, serde_json::to_vec_pretty(v).unwrap()).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, p).map_err(|e| e.to_string())
}

pub fn load_config() -> Config {
    use crate::stick::{here_in, here_out, is_portable, places_file, CONFIG_HERE};
    let had = places_file().exists();
    let c: Config = here_in("config.json", CONFIG_HERE, read_json(&app_dir().join("config.json")));
    if is_portable() && !had {
        here_out("config.json", CONFIG_HERE, &c);
    }
    c
}
pub fn save_config(c: &Config) -> Result<(), String> {
    crate::stick::here_out("config.json", crate::stick::CONFIG_HERE, c);
    write_json(&app_dir().join("config.json"), c)
}
pub fn load_state() -> State {
    read_json(&app_dir().join("state.json"))
}
pub fn save_state(s: &State) -> Result<(), String> {
    write_json(&app_dir().join("state.json"), s)
}

pub fn now() -> String {
    chrono::Local::now().format("%Y-%m-%d %H:%M").to_string()
}

/// A safe folder name: no slashes or odd characters.
pub fn safe(s: &str) -> String {
    let t: String = s.chars().map(|c| if c.is_alphanumeric() || " .-_+()[]".contains(c) { c } else { '_' }).collect();
    let t = t.trim().trim_matches('.').to_string();
    if t.is_empty() {
        "_".into()
    } else {
        t
    }
}

pub fn plat_folder(p: &str) -> String {
    // "linux@arm64": its own folder next to Linux/, so both chips keep their newest versions
    match p.split_once('@').or_else(|| p.split_once('~')) {
        Some((b, chip)) => format!("{}-{}", crate::sources::plat_name(b), safe(chip)),
        None => crate::sources::plat_name(p).to_string(),
    }
}

pub fn versions_dir(root: &str, app_name: &str, plat: &str) -> PathBuf {
    Path::new(root).join("Apps").join(safe(app_name)).join(plat_folder(plat))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stored {
    pub version: String,
    pub date: String,
    pub file: String,
    pub path: String,
    pub size: u64,
    pub sha256: String,
    pub url: String,
    pub downloaded: String,
    /// put in the folder by hand (no .emuvault.json): shown, never deleted by "keep the newest"
    #[serde(default)]
    pub hand: bool,
}

pub const META: &str = ".emuvault.json";

fn mtime_str(p: &Path) -> String {
    p.metadata().and_then(|m| m.modified()).ok().map(|t| chrono::DateTime::<chrono::Local>::from(t).format("%Y-%m-%d %H:%M:%S").to_string()).unwrap_or_default()
}

/// A version number out of a file or folder name ("dolphin-master-2609-180.apk" -> "2609-180").
pub fn guess_version(name: &str) -> String {
    let stem = name.trim_end_matches(".part");
    let re = regex::Regex::new(r"(?i)v?(\d+(?:[._\-]\d+)+[a-z]?|\d{3,})").unwrap();
    re.captures_iter(stem)
        .map(|c| c[1].trim_end_matches(['.', '-', '_']).to_string())
        .filter(|v| !v.is_empty() && !matches!(v.as_str(), "64" | "86" | "32"))
        .max_by_key(|v| v.len())
        .unwrap_or_else(|| "by hand".into())
}

/// Which platform a loose file is for, from its extension.
fn ext_plat(name: &str) -> Option<&'static str> {
    let n = name.to_lowercase();
    if n.ends_with(".apk") || n.ends_with(".apks") || n.ends_with(".xapk") {
        Some("android")
    } else if n.ends_with(".appimage")
        || n.ends_with(".flatpak")
        || n.ends_with(".deb")
        || n.ends_with(".tar.gz")
        || n.ends_with(".tar.xz")
        || n.ends_with(".tar.zst")
        || n.ends_with(".sh")
    {
        Some("linux")
    } else if n.ends_with(".exe") || n.ends_with(".msi") {
        Some("windows")
    } else if n.ends_with(".dmg") || n.ends_with(".pkg") {
        Some("macos")
    } else {
        None
    }
}

fn hand_file(p: &Path, version: String) -> Stored {
    let name = p.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    Stored {
        version,
        date: mtime_str(p).chars().take(10).collect(),
        file: name,
        path: p.to_string_lossy().into(),
        size: p.metadata().map(|m| m.len()).unwrap_or(0),
        sha256: String::new(),
        url: String::new(),
        downloaded: mtime_str(p),
        hand: true,
    }
}

fn skip_name(n: &str) -> bool {
    n.starts_with('.') || n.ends_with(".part") || n.ends_with(".json") || n.ends_with(".txt") || n.ends_with(".md")
}

pub fn list_versions(root: &str, app_name: &str, plat: &str) -> Vec<Stored> {
    let dir = versions_dir(root, app_name, plat);
    let mut out: Vec<Stored> = vec![];
    if let Ok(rd) = std::fs::read_dir(&dir) {
        for e in rd.flatten() {
            let p = e.path();
            let n = e.file_name().to_string_lossy().to_string();
            if p.is_dir() {
                let m = p.join(META);
                if m.exists() {
                    if let Some(mut s) = std::fs::read_to_string(&m).ok().and_then(|x| serde_json::from_str::<Stored>(&x).ok()) {
                        s.path = p.join(&s.file).to_string_lossy().into();
                        if Path::new(&s.path).exists() {
                            out.push(s);
                        }
                    }
                } else if !n.starts_with('.') {
                    // a version folder you made yourself: the folder name is the version
                    if let Some(f) = find_main(&p).filter(|f| !skip_name(f)) {
                        out.push(hand_file(&p.join(f), n.clone()));
                    }
                }
            } else if !skip_name(&n) {
                // a download you put straight in Apps/<app>/<platform>/
                out.push(hand_file(&p, guess_version(&n)));
            }
        }
    }
    // loose files straight in Apps/<app>/, for the platform their extension belongs to
    if let Some(app_dir) = dir.parent().filter(|_| !plat.contains('@') && !plat.contains('~')) {
        let want = crate::sources::plat_name(plat).to_lowercase();
        if let Ok(rd) = std::fs::read_dir(app_dir) {
            for e in rd.flatten() {
                let p = e.path();
                let n = e.file_name().to_string_lossy().to_string();
                if p.is_file() && !skip_name(&n) && ext_plat(&n).map(|x| crate::sources::plat_name(x).to_lowercase() == want).unwrap_or(false) {
                    out.push(hand_file(&p, guess_version(&n)));
                }
            }
        }
    }
    out.sort_by(|a, b| b.downloaded.cmp(&a.downloaded).then(crate::sources::natural_cmp(&b.version, &a.version)));
    out
}

/// Delete the oldest versions so at most `keep` stay. Returns what was removed.
pub fn prune(root: &str, app_name: &str, plat: &str, keep: usize) -> Vec<String> {
    let keep = keep.max(1);
    let list: Vec<Stored> = list_versions(root, app_name, plat).into_iter().filter(|s| !s.hand).collect();
    let mut gone = vec![];
    for s in list.iter().skip(keep) {
        if let Some(dir) = Path::new(&s.path).parent() {
            if dir.join(META).exists() && std::fs::remove_dir_all(dir).is_ok() {
                gone.push(s.version.clone());
            }
        }
    }
    gone
}

/// Free space in bytes on the drive that holds `root` (or its nearest existing parent).
pub fn free_space(root: &str) -> Option<(u64, u64)> {
    let mut p = PathBuf::from(root);
    while !p.exists() {
        p = p.parent()?.to_path_buf();
    }
    Some((fs2::available_space(&p).ok()?, fs2::total_space(&p).ok()?))
}

/// The file to show for an unpacked download: the AppImage if there is one.
fn find_main(dir: &Path) -> Option<String> {
    let mut stack = vec![dir.to_path_buf()];
    let mut first: Option<PathBuf> = None;
    while let Some(d) = stack.pop() {
        for e in std::fs::read_dir(&d).ok()?.flatten() {
            let p = e.path();
            if p.is_dir() {
                stack.push(p);
            } else if p.to_string_lossy().to_lowercase().ends_with(".appimage") {
                return p.strip_prefix(dir).ok().map(|x| x.to_string_lossy().to_string());
            } else if first.is_none() && p.file_name().map(|n| n != META).unwrap_or(false) {
                first = Some(p);
            }
        }
    }
    first.and_then(|p| p.strip_prefix(dir).ok().map(|x| x.to_string_lossy().to_string()))
}

#[cfg(unix)]
fn mark_runnable(dir: &Path) {
    use std::os::unix::fs::PermissionsExt;
    let mut stack = vec![dir.to_path_buf()];
    while let Some(d) = stack.pop() {
        let Ok(rd) = std::fs::read_dir(&d) else { continue };
        for e in rd.flatten() {
            let p = e.path();
            if p.is_dir() {
                stack.push(p);
            } else if p.to_string_lossy().to_lowercase().ends_with(".appimage") {
                let _ = std::fs::set_permissions(&p, std::fs::Permissions::from_mode(0o755));
            }
        }
    }
}

/// Download `pick` into the version folder, then keep only `keep` versions.
pub async fn download<F: Fn(u64, u64) + Send>(
    client: &reqwest::Client,
    root: &str,
    app_name: &str,
    plat: &str,
    pick: &Pick,
    keep: usize,
    headers: &[(String, String)],
    progress: F,
) -> Result<(Stored, Vec<String>), String> {
    use futures_util::StreamExt;
    use sha2::{Digest, Sha256};
    use tokio::io::AsyncWriteExt;
    let asset = pick.asset.as_ref().ok_or("This app is only followed, there is nothing to download.")?;
    let dir = versions_dir(root, app_name, plat).join(safe(&pick.version));
    if dir.join(META).exists() {
        return Err(format!("Version {} is already in the vault.", pick.version));
    }
    tokio::fs::create_dir_all(&dir).await.map_err(|e| format!("Can't make the folder {}: {e}", dir.display()))?;
    let mut req = client.get(&asset.url);
    if !headers.iter().any(|(k, _)| k.eq_ignore_ascii_case("user-agent")) {
        req = req.header("User-Agent", "EmuVault/0.2");
    }
    for (k, v) in headers {
        req = req.header(k.as_str(), v.as_str());
    }
    let res = req.send().await.map_err(|e| {
        if e.is_connect() {
            "Download failed: can't reach the site. Are you online?".to_string()
        } else {
            format!("Download failed: {e}")
        }
    })?;
    if !res.status().is_success() {
        return Err(format!("Download failed: the site answered {}", res.status()));
    }
    let total = res.content_length().unwrap_or(asset.size);
    if let Some((free, _)) = free_space(root) {
        if total > 0 && total + 200 * 1024 * 1024 > free {
            let _ = tokio::fs::remove_dir(&dir).await;
            return Err(format!("Not enough space: needs {} MB, {} MB free.", total / 1_048_576, free / 1_048_576));
        }
    }
    let file_name = safe(&asset.name);
    let part = dir.join(format!("{file_name}.part"));
    let mut f = tokio::fs::File::create(&part).await.map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut got: u64 = 0;
    let mut stream = res.bytes_stream();
    let mut last = std::time::Instant::now();
    while let Some(chunk) = stream.next().await {
        let chunk = match chunk {
            Ok(c) => c,
            Err(e) => {
                drop(f);
                let _ = tokio::fs::remove_file(&part).await;
                let _ = tokio::fs::remove_dir(&dir).await;
                return Err(format!("Download stopped halfway: {e}"));
            }
        };
        hasher.update(&chunk);
        got += chunk.len() as u64;
        if let Err(e) = f.write_all(&chunk).await {
            drop(f);
            let _ = tokio::fs::remove_file(&part).await;
            let _ = tokio::fs::remove_dir(&dir).await;
            return Err(format!("Couldn't write the file: {e}"));
        }
        if last.elapsed().as_millis() > 150 {
            progress(got, total);
            last = std::time::Instant::now();
        }
    }
    f.flush().await.map_err(|e| e.to_string())?;
    drop(f);
    progress(got, total.max(got));
    let final_path = dir.join(&file_name);
    tokio::fs::rename(&part, &final_path).await.map_err(|e| e.to_string())?;
    // a .7z (RetroArch for Linux) is unpacked; the AppImage inside becomes the main file
    let mut main_file = file_name.clone();
    if file_name.to_lowercase().ends_with(".7z") && plat.starts_with("linux") {
        let (arc, out) = (final_path.clone(), dir.clone());
        let res = tokio::task::spawn_blocking(move || sevenz_rust::decompress_file(&arc, &out)).await;
        match res {
            Ok(Ok(())) => {
                let _ = std::fs::remove_file(&final_path);
                main_file = find_main(&dir).unwrap_or_else(|| file_name.clone());
            }
            _ => { /* keep the archive as it is */ }
        }
    }
    #[cfg(unix)]
    mark_runnable(&dir);
    let final_path = dir.join(&main_file);
    let stored = Stored {
        version: pick.version.clone(),
        date: pick.date.clone(),
        file: main_file,
        path: final_path.to_string_lossy().into(),
        size: got,
        sha256: hex::encode(hasher.finalize()),
        url: asset.url.clone(),
        downloaded: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        hand: false,
    };
    write_json(&dir.join(META), &stored)?;
    let gone = prune(root, app_name, plat, keep);
    Ok((stored, gone))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn chip_folder() {
        assert_eq!(plat_folder("linux@arm64"), "Linux-arm64");
        assert_eq!(plat_folder("windows"), "Windows");
        assert!(versions_dir("/r", "Eden", "linux@arm64").ends_with("Apps/Eden/Linux-arm64"));
    }
    #[test]
    fn by_hand_files_show() {
        let d = std::env::temp_dir().join(format!("ev-hand-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let r = d.to_string_lossy().to_string();
        let a = d.join("Apps/Dolphin Emulator");
        std::fs::create_dir_all(a.join("Android/2609")).unwrap();
        std::fs::write(a.join("Android/dolphin-master-2609-180.apk"), b"x").unwrap();
        std::fs::write(a.join("Android/2609/dolphin.apk"), b"x").unwrap();
        std::fs::write(a.join("dolphin-master-2610-3.apk"), b"x").unwrap();
        std::fs::write(a.join("Android/x.apk.part"), b"x").unwrap();
        let l = list_versions(&r, "Dolphin Emulator", "android");
        let mut v: Vec<_> = l.iter().map(|s| s.version.clone()).collect();
        v.sort();
        assert_eq!(v, vec!["2609", "2609-180", "2610-3"]);
        assert!(l.iter().all(|s| s.hand));
        assert!(list_versions(&r, "Dolphin Emulator", "linux").is_empty());
        assert!(prune(&r, "Dolphin Emulator", "android", 1).is_empty());
        assert_eq!(guess_version("duckstation-x64-v0.1-9701.AppImage"), "0.1-9701");
        let _ = std::fs::remove_dir_all(&d);
    }
    #[test]
    fn keep_three() {
        let root = std::env::temp_dir().join(format!("ev-test-{}", std::process::id()));
        let r = root.to_string_lossy().to_string();
        for (i, v) in ["1.0", "1.1", "1.2", "1.3"].iter().enumerate() {
            let d = versions_dir(&r, "Duck/Station", "android").join(v);
            std::fs::create_dir_all(&d).unwrap();
            std::fs::write(d.join("a.apk"), b"x").unwrap();
            let s = Stored {
                version: v.to_string(),
                date: "".into(),
                file: "a.apk".into(),
                path: "".into(),
                size: 1,
                sha256: "".into(),
                url: "".into(),
                downloaded: format!("2026-10-0{} 10:00:00", i + 1),
                hand: false,
            };
            write_json(&d.join(META), &s).unwrap();
        }
        assert_eq!(list_versions(&r, "Duck/Station", "android").len(), 4);
        assert_eq!(prune(&r, "Duck/Station", "android", 3), vec!["1.0".to_string()]);
        let l = list_versions(&r, "Duck/Station", "android");
        assert_eq!(l.iter().map(|s| s.version.as_str()).collect::<Vec<_>>(), vec!["1.3", "1.2", "1.1"]);
        assert!(versions_dir(&r, "Duck/Station", "android").to_string_lossy().ends_with("Apps/Duck_Station/Android"));
        std::fs::remove_dir_all(root).unwrap();
    }
}
