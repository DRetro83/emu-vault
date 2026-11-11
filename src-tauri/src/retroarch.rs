//! RetroArch in the vault: <main folder>/RetroArch/
//!   app/<version>/RetroArch-Linux-x86_64.AppImage   (from libretro's buildbot; the version from GitHub releases)
//!   app/current.AppImage                             link to the version in use
//!   home/.config/retroarch/                          RetroArch's settings, cores, saves, states, system (BIOS links)
//!   retroarch.sh                                     starts RetroArch with that home, so nothing goes to the computer
//! Everything inside uses relative paths, so the vault works on a drive that's mounted elsewhere on another PC.

use crate::{store, Core};
use futures_util::StreamExt;
use serde::Serialize;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::Emitter;

fn base(core: &Core) -> PathBuf {
    Path::new(&core.cfg.lock().unwrap().root).join("RetroArch")
}
fn ra_home(core: &Core) -> PathBuf {
    base(core).join("home/.config/retroarch")
}
pub fn script(core: &Core) -> PathBuf {
    base(core).join("retroarch.sh")
}
pub fn cores_dir(core: &Core) -> PathBuf {
    ra_home(core).join("cores")
}

/// The core Emu Vault puts in for each system (the ones ES-DE uses by default).
pub fn default_core(sys: &str) -> Option<(&'static str, &'static str)> {
    Some(match sys {
        "nes" | "famicom" | "fds" => ("mesen", "Mesen"),
        "snes" | "sfc" => ("snes9x", "Snes9x"),
        "gba" => ("mgba", "mGBA"),
        "gb" | "gbc" => ("gambatte", "Gambatte"),
        "megadrive" | "genesis" | "mastersystem" | "gamegear" | "segacd" | "sg-1000" => ("genesis_plus_gx", "Genesis Plus GX"),
        "sega32x" => ("picodrive", "PicoDrive"),
        "n64" => ("mupen64plus_next", "Mupen64Plus-Next"),
        "psx" => ("mednafen_psx_hw", "Beetle PSX HW"),
        "psp" => ("ppsspp", "PPSSPP"),
        "nds" => ("melondsds", "melonDS DS"),
        "pcengine" | "pcenginecd" | "tg16" => ("mednafen_pce", "Beetle PCE"),
        "saturn" => ("mednafen_saturn", "Beetle Saturn"),
        "dreamcast" => ("flycast", "Flycast"),
        "atari2600" => ("stella", "Stella"),
        "atari7800" => ("prosystem", "ProSystem"),
        "atarilynx" => ("handy", "Handy"),
        "ngp" | "ngpc" => ("mednafen_ngp", "Beetle NeoPop"),
        "wonderswan" | "wonderswancolor" => ("mednafen_wswan", "Beetle Cygne"),
        "virtualboy" => ("mednafen_vb", "Beetle VB"),
        "msx" | "msx2" => ("bluemsx", "blueMSX"),
        "colecovision" => ("bluemsx", "blueMSX"),
        "pokemini" => ("pokemini", "PokeMini"),
        "3do" => ("opera", "Opera"),
        "fbneo" | "arcade" | "neogeo" | "cps1" | "cps2" | "cps3" => ("fbneo", "FinalBurn Neo"),
        "ps2" => ("pcsx2", "LRPS2"),
        "gc" | "wii" => ("dolphin", "Dolphin"),
        "n3ds" | "3ds" => ("citra", "Citra"),
        "neogeocd" => ("neocd", "NeoCD"),
        "pcfx" => ("mednafen_pcfx", "Beetle PC-FX"),
        "atari5200" | "atari800" => ("atari800", "Atari800"),
        "atarijaguar" | "jaguar" => ("virtualjaguar", "Virtual Jaguar"),
        "intellivision" => ("freeintv", "FreeIntv"),
        "vectrex" => ("vecx", "vecx"),
        "odyssey2" => ("o2em", "O2EM"),
        "amiga" | "amiga500" | "amiga1200" | "amigacd32" => ("puae", "PUAE"),
        "c64" => ("vice_x64sc", "VICE x64sc"),
        "dos" => ("dosbox_pure", "DOSBox Pure"),
        "x68000" => ("px68k", "PX68k"),
        "zxspectrum" => ("fuse", "Fuse"),
        "amstradcpc" => ("cap32", "Caprice32"),
        "gamecom" | "supervision" => ("mame", "MAME"),
        _ => return None,
    })
}

fn buildbot() -> String {
    std::env::var("EMUVAULT_BUILDBOT").unwrap_or_else(|_| "https://buildbot.libretro.com/".into())
}

#[derive(Serialize, Default)]
pub struct RaStatus {
    installed: bool,
    version: String,
    latest: String,
    /// RetroArch from somewhere else on this computer (Flatpak / installed), when it isn't in the vault
    other: String,
    cores: Vec<RaCore>,
    bios_links: usize,
    esde_linked: bool,
    dir: String,
}

#[derive(Serialize)]
pub struct RaCore {
    systems: Vec<String>,
    core: String,
    name: String,
    have: bool,
}

fn installed_version(core: &Core) -> String {
    std::fs::read_link(base(core).join("app/current.AppImage"))
        .ok()
        .and_then(|p| p.parent().and_then(|v| v.file_name()).map(|v| v.to_string_lossy().to_string()))
        .unwrap_or_default()
}

fn wanted_cores(core: &Core) -> Vec<RaCore> {
    let lib = core.lib.lock().unwrap().clone();
    let mut systems: Vec<&String> = lib.iter().filter(|(_, v)| !v.is_empty()).map(|(k, _)| k).collect();
    systems.sort();
    let cd = cores_dir(core);
    let mut out: Vec<RaCore> = vec![];
    for s in systems {
        let ch = crate::play::choice(core, s);
        let picked = ch.strip_prefix("ra:").map(|c| c.to_string());
        if ch.starts_with("emu:") {
            continue;
        }
        let def = default_core(s);
        let pair: Option<(String, String)> = match (picked, def) {
            (Some(c), Some((dc, dn))) if c == dc => Some((c, dn.to_string())),
            (Some(c), _) => Some((c.clone(), c.replace('_', " "))),
            (None, Some((dc, dn))) => Some((dc.to_string(), dn.to_string())),
            _ => None,
        };
        if let Some((c, n)) = pair.as_ref().map(|(a, b)| (a.as_str(), b.as_str())) {
            if let Some(x) = out.iter_mut().find(|x| x.core == c) {
                x.systems.push(s.clone());
            } else {
                out.push(RaCore { systems: vec![s.clone()], core: c.to_string(), name: n.to_string(), have: cd.join(format!("{c}_libretro.so")).is_file() });
            }
        }
    }
    out
}

fn other_retroarch() -> String {
    let h = dirs::home_dir().unwrap_or_default();
    if h.join(".var/app/org.libretro.RetroArch").is_dir() {
        return "Flatpak".into();
    }
    for d in std::env::var("PATH").unwrap_or_default().split(':') {
        if Path::new(d).join("retroarch").is_file() {
            return "installed".into();
        }
    }
    String::new()
}

#[tauri::command]
pub fn rarch_status(core: tauri::State<Core>) -> RaStatus {
    let v = installed_version(&core);
    let sys = ra_home(&core).join("system");
    let links = walk_count(&sys);
    let st = crate::bg::load_state();
    let _ = st;
    RaStatus {
        installed: !v.is_empty() && script(&core).is_file(),
        version: v,
        latest: std::fs::read_to_string(base(&core).join("latest.txt")).unwrap_or_default().trim().to_string(),
        other: other_retroarch(),
        cores: wanted_cores(&core),
        bios_links: links,
        esde_linked: crate::esde::esde_dir(&core).join("custom_systems/es_find_rules.xml").is_file(),
        dir: base(&core).to_string_lossy().into(),
    }
}

fn walk_count(d: &Path) -> usize {
    let mut n = 0;
    for e in std::fs::read_dir(d).into_iter().flatten().flatten() {
        let p = e.path();
        if p.is_dir() && !p.is_symlink() {
            n += walk_count(&p);
        } else if p.is_symlink() {
            n += 1;
        }
    }
    n
}

/// The newest stable RetroArch version (from GitHub releases), remembered in RetroArch/latest.txt.
#[tauri::command]
pub async fn rarch_check(core: tauri::State<'_, Core>) -> Result<String, String> {
    let api = std::env::var("EMUVAULT_GH_API").unwrap_or_else(|_| "https://api.github.com".into());
    let res = core
        .client
        .get(format!("{api}/repos/libretro/RetroArch/releases/latest"))
        .header("User-Agent", "EmuVault/0.5")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("Network problem: {e}"))?;
    if !res.status().is_success() {
        return Err(format!("GitHub answered {}", res.status()));
    }
    let v: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let tag = v.get("tag_name").and_then(|t| t.as_str()).unwrap_or("").trim_start_matches('v').to_string();
    if tag.is_empty() {
        return Err("GitHub didn't say which version is the newest.".into());
    }
    let _ = std::fs::create_dir_all(base(&core));
    let _ = std::fs::write(base(&core).join("latest.txt"), &tag);
    Ok(tag)
}

async fn fetch_to(app: &tauri::AppHandle, core: &Core, url: &str, dest: &Path, what: &str) -> Result<(), String> {
    let res = core.client.get(url).header("User-Agent", "EmuVault/0.5").send().await.map_err(|e| format!("Network problem: {e}"))?;
    if !res.status().is_success() {
        return Err(format!("{what}: the download server answered {}", res.status()));
    }
    let total = res.content_length().unwrap_or(0);
    let tmp = dest.with_extension("part");
    std::fs::create_dir_all(dest.parent().unwrap()).map_err(|e| e.to_string())?;
    let mut f = std::fs::File::create(&tmp).map_err(|e| e.to_string())?;
    let mut got = 0u64;
    let mut s = res.bytes_stream();
    let mut last = std::time::Instant::now();
    while let Some(c) = s.next().await {
        let c = c.map_err(|e| format!("Network problem: {e}"))?;
        f.write_all(&c).map_err(|e| e.to_string())?;
        got += c.len() as u64;
        if last.elapsed().as_millis() > 300 {
            last = std::time::Instant::now();
            let _ = app.emit("ra-dl", (what.to_string(), got, total));
        }
    }
    drop(f);
    std::fs::rename(&tmp, dest).map_err(|e| e.to_string())
}

fn chmod_x(p: &Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(m) = std::fs::metadata(p) {
            let mut perm = m.permissions();
            perm.set_mode(perm.mode() | 0o755);
            let _ = std::fs::set_permissions(p, perm);
        }
    }
}

fn find_named(d: &Path, pred: &dyn Fn(&str) -> bool, dirs_too: bool) -> Option<PathBuf> {
    for e in std::fs::read_dir(d).ok()?.flatten() {
        let p = e.path();
        let n = e.file_name().to_string_lossy().to_string();
        if pred(&n) && (dirs_too || p.is_file()) {
            return Some(p);
        }
        if p.is_dir() && !n.ends_with(".home") {
            if let Some(x) = find_named(&p, pred, dirs_too) {
                return Some(x);
            }
        }
    }
    None
}

fn move_merge(from: &Path, to: &Path) {
    let _ = std::fs::create_dir_all(to);
    for e in std::fs::read_dir(from).into_iter().flatten().flatten() {
        let d = to.join(e.file_name());
        if e.path().is_dir() && d.is_dir() {
            move_merge(&e.path(), &d);
        } else if !d.exists() {
            let _ = std::fs::rename(e.path(), &d);
        }
    }
}

/// Download (or update) RetroArch into the vault, then set it up.
#[tauri::command]
pub async fn rarch_install(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<String, String> {
    let ver = match rarch_check(core.clone()).await {
        Ok(v) => v,
        Err(e) => {
            let v = std::fs::read_to_string(base(&core).join("latest.txt")).unwrap_or_default().trim().to_string();
            if v.is_empty() {
                return Err(e);
            }
            v
        }
    };
    let b = base(&core);
    let vdir = b.join("app").join(&ver);
    let tmp = b.join("download");
    let _ = std::fs::remove_dir_all(&tmp);
    std::fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;
    let z = tmp.join("RetroArch.7z");
    fetch_to(&app, &core, &format!("{}stable/{ver}/linux/x86_64/RetroArch.7z", buildbot()), &z, "RetroArch").await?;
    let _ = app.emit("ra-dl", ("Unpacking".to_string(), 0u64, 0u64));
    let x = tmp.join("x");
    {
        let (z, x) = (z.clone(), x.clone());
        tokio::task::spawn_blocking(move || sevenz_rust::decompress_file(&z, &x))
            .await
            .map_err(|e| e.to_string())?
            .map_err(|e| format!("Unpacking RetroArch didn't work: {e}"))?;
    }
    let img = find_named(&x, &|n: &str| n.to_lowercase().ends_with(".appimage"), false).ok_or("There was no RetroArch AppImage in the download.")?;
    std::fs::create_dir_all(&vdir).map_err(|e| e.to_string())?;
    let dest = vdir.join(img.file_name().unwrap());
    std::fs::rename(&img, &dest).map_err(|e| e.to_string())?;
    chmod_x(&dest);
    // the assets, shaders, controller profiles… that come with it: into RetroArch's home (what's there stays)
    if let Some(h) = find_named(&x, &|n: &str| n.ends_with(".AppImage.home"), true) {
        move_merge(&h, &b.join("home"));
    }
    let _ = std::fs::remove_dir_all(&tmp);
    // current.AppImage -> app/<ver>/…AppImage (relative)
    let cur = b.join("app/current.AppImage");
    let _ = std::fs::remove_file(&cur);
    #[cfg(unix)]
    std::os::unix::fs::symlink(Path::new(&ver).join(dest.file_name().unwrap()), &cur).map_err(|e| e.to_string())?;
    // keep the version before, to go back
    if let Ok(rd) = std::fs::read_dir(b.join("app")) {
        let mut vs: Vec<(std::time::SystemTime, PathBuf)> =
            rd.flatten().filter(|e| e.path().is_dir()).map(|e| (e.metadata().and_then(|m| m.modified()).unwrap_or(std::time::UNIX_EPOCH), e.path())).collect();
        vs.sort();
        while vs.len() > 2 {
            let (_, p) = vs.remove(0);
            let _ = std::fs::remove_dir_all(p);
        }
    }
    setup(&core)?;
    core.log(format!("RetroArch {ver} is in the vault ({})", b.display()));
    Ok(ver)
}

// ---------- 0.9.7: RetroArch on its own (you set it up), like Heroic ----------
// <main folder>/Launchers/RetroArch/RetroArch-Linux-x86_64.AppImage, with its own home next to it
// (RetroArch-Linux-x86_64.AppImage.home/): the AppImage keeps its settings, cores and saves there, so it
// stays on your drive. Emu Vault only downloads it and starts it; it doesn't touch its settings.

fn solo_dir(core: &Core) -> PathBuf {
    Path::new(&core.cfg.lock().unwrap().root).join("Launchers/RetroArch")
}
fn solo_img(core: &Core) -> Option<PathBuf> {
    let d = solo_dir(core);
    std::fs::read_dir(&d).ok()?.flatten().map(|e| e.path()).find(|p| p.is_file() && p.to_string_lossy().to_lowercase().ends_with(".appimage"))
}

#[derive(Serialize)]
pub struct Solo {
    have: bool,
    version: String,
    latest: String,
    path: String,
}

#[tauri::command]
pub fn ra_solo_status(core: tauri::State<Core>) -> Solo {
    let d = solo_dir(&core);
    let img = solo_img(&core);
    Solo {
        have: img.is_some(),
        version: std::fs::read_to_string(d.join("version.txt")).unwrap_or_default().trim().to_string(),
        latest: std::fs::read_to_string(base(&core).join("latest.txt")).unwrap_or_default().trim().to_string(),
        path: img.map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|| d.to_string_lossy().to_string()),
    }
}

/// Download (or update) RetroArch for Linux from libretro into Launchers/RetroArch/. Its own home folder stays.
#[tauri::command]
pub async fn ra_solo_get(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<String, String> {
    let ver = rarch_check(core.clone()).await?;
    let d = solo_dir(&core);
    let tmp = d.join(".download");
    let _ = std::fs::remove_dir_all(&tmp);
    std::fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;
    let z = tmp.join("RetroArch.7z");
    fetch_to(&app, &core, &format!("{}stable/{ver}/linux/x86_64/RetroArch.7z", buildbot()), &z, "RetroArch").await?;
    let _ = app.emit("ra-dl", ("Unpacking".to_string(), 0u64, 0u64));
    let x = tmp.join("x");
    {
        let (z, x) = (z.clone(), x.clone());
        tokio::task::spawn_blocking(move || sevenz_rust::decompress_file(&z, &x))
            .await
            .map_err(|e| e.to_string())?
            .map_err(|e| format!("Unpacking RetroArch didn't work: {e}"))?;
    }
    let img = find_named(&x, &|n: &str| n.to_lowercase().ends_with(".appimage"), false).ok_or("There was no RetroArch AppImage in the download.")?;
    let name = img.file_name().unwrap().to_os_string();
    let dest = d.join(&name);
    let _ = std::fs::remove_file(&dest);
    std::fs::rename(&img, &dest).map_err(|e| e.to_string())?;
    chmod_x(&dest);
    // its home next to it (assets, shaders… from the download; your settings, cores and saves stay)
    let home = d.join(format!("{}.home", name.to_string_lossy()));
    if let Some(h) = find_named(&x, &|n: &str| n.ends_with(".AppImage.home"), true) {
        move_merge(&h, &home);
    }
    let _ = std::fs::create_dir_all(&home);
    let _ = std::fs::write(d.join("version.txt"), &ver);
    let _ = std::fs::remove_dir_all(&tmp);
    core.log(format!("RetroArch {ver} (on its own) is in {}", d.display()));
    Ok(ver)
}

#[tauri::command]
pub fn ra_solo_start(core: tauri::State<Core>) -> Result<(), String> {
    let img = solo_img(&core).ok_or("RetroArch isn't in the vault yet.")?;
    let mut c = std::process::Command::new(&img);
    c.current_dir(img.parent().unwrap()).stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
    // a PC without FUSE: the AppImage unpacks itself first
    if !Path::new("/usr/lib/x86_64-linux-gnu/libfuse.so.2").exists()
        && !Path::new("/usr/lib/libfuse.so.2").exists()
        && !Path::new("/lib/x86_64-linux-gnu/libfuse.so.2").exists()
    {
        c.env("APPIMAGE_EXTRACT_AND_RUN", "1");
    }
    c.spawn().map_err(|e| format!("RetroArch didn't start: {e}"))?;
    Ok(())
}

/// The BIOS folder's size, for the BIOS page.
#[tauri::command]
pub fn bios_size(core: tauri::State<Core>) -> (u64, u64) {
    fn du(p: &Path, n: &mut u64) -> u64 {
        let mut s = 0;
        for e in std::fs::read_dir(p).into_iter().flatten().flatten() {
            let q = e.path();
            if q.is_symlink() {
                continue;
            }
            if q.is_dir() {
                s += du(&q, n);
            } else if let Ok(m) = q.metadata() {
                s += m.len();
                *n += 1;
            }
        }
        s
    }
    let mut n = 0;
    let s = du(&Path::new(&core.cfg.lock().unwrap().root).join("bios"), &mut n);
    (s, n)
}

fn cfg_put(t: &str, key: &str, val: &str) -> String {
    let line = format!("{key} = \"{val}\"");
    let re = regex::Regex::new(&format!(r"(?m)^{}\s*=.*$", regex::escape(key))).unwrap();
    if re.is_match(t) {
        re.replace(t, line.as_str()).to_string()
    } else {
        format!("{}{}{line}\n", t, if t.is_empty() || t.ends_with('\n') { "" } else { "\n" })
    }
}

/// RetroArch's settings (paths relative to its home), the start script, BIOS links, ES-DE's find rules,
/// and the saves folder in Backups.
pub fn setup(core: &Core) -> Result<(), String> {
    let b = base(core);
    let h = ra_home(core);
    for d in ["cores", "info", "saves", "states", "system", "screenshots", "playlists", "thumbnails"] {
        std::fs::create_dir_all(h.join(d)).map_err(|e| e.to_string())?;
    }
    let cfgp = h.join("retroarch.cfg");
    let mut t = std::fs::read_to_string(&cfgp).unwrap_or_default();
    for (k, v) in [
        ("libretro_directory", "~/.config/retroarch/cores"),
        ("libretro_info_path", "~/.config/retroarch/info"),
        ("savefile_directory", "~/.config/retroarch/saves"),
        ("savestate_directory", "~/.config/retroarch/states"),
        ("system_directory", "~/.config/retroarch/system"),
        ("screenshot_directory", "~/.config/retroarch/screenshots"),
        ("playlist_directory", "~/.config/retroarch/playlists"),
        ("thumbnails_directory", "~/.config/retroarch/thumbnails"),
        ("core_updater_buildbot_cores_url", "http://buildbot.libretro.com/nightly/linux/x86_64/latest/"),
    ] {
        t = cfg_put(&t, k, v);
    }
    std::fs::write(&cfgp, t).map_err(|e| e.to_string())?;
    let sh = "#!/bin/sh\n# Starts RetroArch from the Emu Vault folder: its settings, cores and saves stay in RetroArch/home.\nD=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\nexport HOME=\"$D/home\"\nexport XDG_CONFIG_HOME=\"$D/home/.config\"\nif [ ! -e /usr/lib/x86_64-linux-gnu/libfuse.so.2 ] && [ ! -e /lib/x86_64-linux-gnu/libfuse.so.2 ] && [ ! -e /usr/lib64/libfuse.so.2 ] && [ ! -e /usr/lib/libfuse.so.2 ]; then export APPIMAGE_EXTRACT_AND_RUN=1; fi\nexec \"$D/app/current.AppImage\" \"$@\"\n";
    std::fs::write(b.join("retroarch.sh"), sh).map_err(|e| e.to_string())?;
    chmod_x(&b.join("retroarch.sh"));
    bios_links(core);
    write_find_rules(core);
    // the saves in Backups
    {
        let mut c = core.cfg.lock().unwrap();
        let p = h.join("saves").to_string_lossy().to_string();
        if !c.save_sources.iter().any(|s| s.path == p) {
            c.save_sources.push(crate::extras::SaveSource { label: "RetroArch (in the vault)".into(), path: p });
            let _ = store::save_config(&c);
        }
    }
    Ok(())
}

/// Where each core wants a BIOS from bios/<system>/: the sub folder of RetroArch's system folder.
fn bios_subs(system: &str) -> &'static [&'static str] {
    match system {
        "dreamcast" | "naomi" | "naomi2" | "atomiswave" => &["dc"],
        "ps2" => &["pcsx2/bios"],
        // 0.14.3: no RetroArch core plays these: their files stay out of RetroArch-BIOS
        "ps3" | "ps4" | "switch" | "wiiu" | "psvita" | "xbox360" => &[],
        "neogeocd" => &["neocd"],
        "n3ds" | "3ds" => &["citra/sysdata"],
        // FinalBurn Neo looks next to the game and in system/fbneo/
        "neogeo" | "arcade" | "fbneo" | "fba" | "mame" | "cps" | "cps1" | "cps2" | "cps3" => &["", "fbneo"],
        _ => &[""],
    }
}

/// Every BIOS file and where it goes in a RetroArch system folder: (bios/<system>/<file>, <target>).
/// Cores look for lower-case names (scph5501.bin) and Linux sees SCPH5501.BIN as another file: both are made.
fn bios_plan(root: &str) -> Vec<(String, String)> {
    let bios = Path::new(root).join("bios");
    let mut out: Vec<(String, String)> = vec![];
    let mut sys_dirs: Vec<_> = std::fs::read_dir(&bios).into_iter().flatten().flatten().filter(|e| e.path().is_dir()).collect();
    // bios/_retroarch/ last: a real BIOS from bios/<system>/ wins over a file with the same name in it
    sys_dirs.sort_by_key(|e| (e.file_name() == "_retroarch", e.file_name()));
    for e in sys_dirs {
        let s = e.file_name().to_string_lossy().to_string();
        // bios/_retroarch/: files and folders of RetroArch's own system folder that aren't a BIOS of one system
        // (core data: dolphin-emu, PPSSPP, scummvm, Databases…): as they are, at the top of RetroArch-BIOS
        let as_is = s == "_retroarch";
        if s.starts_with('.') || (s.starts_with('_') && !as_is) {
            continue;
        }
        let mut stack = vec![(e.path(), String::new())];
        while let Some((d, rel)) = stack.pop() {
            let mut fs: Vec<_> = std::fs::read_dir(&d).into_iter().flatten().flatten().collect();
            fs.sort_by_key(|f| f.file_name());
            for f in fs {
                let name = f.file_name().to_string_lossy().to_string();
                if name.starts_with('.') {
                    continue;
                }
                if f.path().is_dir() {
                    stack.push((f.path(), format!("{rel}{name}/")));
                    continue;
                }
                let from = format!("{s}/{rel}{name}");
                if as_is {
                    let to = format!("{rel}{name}");
                    if !out.iter().any(|(_, t)| *t == to) {
                        out.push((from, to));
                    }
                    continue;
                }
                for sub in bios_subs(&s) {
                    let pre = if sub.is_empty() { String::new() } else { format!("{sub}/") };
                    // lower-case twins only at the top of a system folder (cores look for scph5501.bin there);
                    // deeper (dolphin-emu/Sys/…) names stay as they are
                    let names = if rel.is_empty() { vec![name.clone(), name.to_lowercase()] } else { vec![name.clone()] };
                    for n in names {
                        let to = format!("{pre}{rel}{n}");
                        if !out.iter().any(|(_, t)| *t == to) {
                            out.push((from.clone(), to));
                        }
                    }
                }
            }
        }
    }
    out
}

#[cfg(unix)]
fn same_file(a: &Path, b: &Path) -> bool {
    use std::os::unix::fs::MetadataExt;
    match (a.metadata(), b.symlink_metadata()) {
        (Ok(x), Ok(y)) => {
            (x.dev() == y.dev() && x.ino() == y.ino()) || (!y.file_type().is_symlink() && x.len() == y.len() && x.mtime() <= y.mtime() && y.nlink() == 1)
        }
        _ => false,
    }
}
#[cfg(not(unix))]
fn same_file(a: &Path, b: &Path) -> bool {
    a.metadata().map(|m| m.len()).ok() == b.metadata().map(|m| m.len()).ok()
}

/// Fill a RetroArch system folder from bios/: hard links (real files to the cores, no extra space), a copy where
/// the drive can't. Only what changed is made again; what Emu Vault put there and is gone from bios/ is removed.
/// Your own files in that folder are left alone. Returns (files there, files changed).
pub fn fill_bios(root: &str, sys: &Path) -> (usize, usize) {
    let _ = std::fs::create_dir_all(sys);
    // old symbolic links (0.8.3 and before)
    fn clean(d: &Path) {
        for e in std::fs::read_dir(d).into_iter().flatten().flatten() {
            let p = e.path();
            if p.is_symlink() {
                let _ = std::fs::remove_file(&p);
            } else if p.is_dir() {
                clean(&p);
            }
        }
    }
    clean(sys);
    let made = sys.join(".emuvault-bios.json");
    let txt = std::fs::read_to_string(&made).unwrap_or_default();
    let old: Vec<String> = serde_json::from_str::<Vec<(String, String)>>(&txt)
        .map(|v| v.into_iter().map(|x| x.1).collect())
        .or_else(|_| serde_json::from_str::<Vec<String>>(&txt))
        .unwrap_or_default();
    let plan = bios_plan(root);
    let bios = Path::new(root).join("bios");
    let mut done: Vec<(String, String)> = vec![];
    let mut changed = 0;
    for (from, to) in &plan {
        if to.contains("..") {
            continue;
        }
        let src = bios.join(from);
        let dst = sys.join(to);
        let ours = old.iter().any(|o| o == to);
        if dst.exists() {
            if same_file(&src, &dst) {
                done.push((from.clone(), to.clone()));
                continue;
            }
            if !ours {
                continue; // your own file
            }
            let _ = std::fs::remove_file(&dst);
        }
        if let Some(pd) = dst.parent() {
            let _ = std::fs::create_dir_all(pd);
        }
        if std::fs::hard_link(&src, &dst).is_ok() || std::fs::copy(&src, &dst).is_ok() {
            changed += 1;
            done.push((from.clone(), to.clone()));
        }
    }
    for o in &old {
        if !o.contains("..") && !done.iter().any(|(_, t)| t == o) {
            if std::fs::remove_file(sys.join(o)).is_ok() {
                changed += 1;
            }
        }
    }
    let _ = std::fs::write(&made, serde_json::to_string(&done).unwrap_or_default());
    (done.len(), changed)
}

/// <main folder>/RetroArch-BIOS: your BIOS files in the layout RetroArch wants. You point RetroArch's
/// System/BIOS setting there yourself.
pub fn ra_bios_dir(root: &str) -> PathBuf {
    Path::new(root).join("RetroArch-BIOS")
}

pub fn ra_on(core: &Core) -> bool {
    core.cfg.lock().unwrap().ra_on
}

/// Keep RetroArch-BIOS up to date (and the vault's own RetroArch, when that's on).
pub fn bios_links(core: &Core) -> usize {
    let root = core.cfg.lock().unwrap().root.clone();
    if root.is_empty() || !Path::new(&root).join("bios").is_dir() {
        return 0;
    }
    let (n, ch) = fill_bios(&root, &ra_bios_dir(&root));
    if ch > 0 {
        core.log(format!("RetroArch-BIOS: {ch} file(s) updated, {n} in the folder"));
    }
    if ra_on(core) {
        fill_bios(&root, &ra_home(core).join("system"));
    }
    n
}

#[derive(Serialize)]
pub struct RaBios {
    path: String,
    files: Vec<(String, String)>,
    made: String,
}

/// RetroArch-BIOS: where it is and which file is there under which name.
#[tauri::command]
pub fn ra_bios_info(core: tauri::State<Core>, again: Option<bool>) -> RaBios {
    if again.unwrap_or(false) {
        bios_links(&core);
    }
    let root = core.cfg.lock().unwrap().root.clone();
    let d = ra_bios_dir(&root);
    let m = d.join(".emuvault-bios.json");
    let files = std::fs::read_to_string(&m).ok().and_then(|x| serde_json::from_str::<Vec<(String, String)>>(&x).ok()).unwrap_or_default();
    let made = m
        .metadata()
        .and_then(|x| x.modified())
        .ok()
        .map(|t| chrono::DateTime::<chrono::Local>::from(t).format("%Y-%m-%d %H:%M").to_string())
        .unwrap_or_default();
    RaBios { path: d.to_string_lossy().into(), files, made }
}

/// ES-DE: start RetroArch (and the PC emulators) from the vault.
pub fn write_find_rules(core: &Core) {
    crate::play::write_find_rules(core)
}

/// Get one core again (a core that crashes may be a broken download): delete it, then fetch what's missing.
#[tauri::command]
pub async fn rarch_core_again(app: tauri::AppHandle, core: tauri::State<'_, Core>, name: String) -> Result<usize, String> {
    if name.is_empty() || name.contains('/') || name.contains("..") {
        return Err("No core named".into());
    }
    let so = cores_dir(&core).join(format!("{name}_libretro.so"));
    let _ = std::fs::remove_file(&so);
    core.log(format!("Getting the {name} core again"));
    rarch_cores(app, core).await
}

/// The cores for the systems you have (the ones missing), from libretro's buildbot, plus the core info files.
#[tauri::command]
pub async fn rarch_cores(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<usize, String> {
    let want: Vec<RaCore> = wanted_cores(&core).into_iter().filter(|c| !c.have).collect();
    let cd = cores_dir(&core);
    let tmp = base(&core).join("download");
    std::fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;
    let mut n = 0;
    let mut failed: Vec<String> = vec![];
    for c in &want {
        let z = tmp.join(format!("{}.zip", c.core));
        let got = async {
            fetch_to(&app, &core, &format!("{}nightly/linux/x86_64/latest/{}_libretro.so.zip", buildbot(), c.core), &z, &c.name).await?;
            let f = std::fs::File::open(&z).map_err(|e| e.to_string())?;
            let mut a = zip::ZipArchive::new(f).map_err(|e| e.to_string())?;
            a.extract(&cd).map_err(|e| e.to_string())
        }
        .await;
        let _ = std::fs::remove_file(&z);
        match got {
            Ok(()) => n += 1,
            Err(e) => {
                if e.starts_with("Network problem") {
                    return Err(e);
                }
                failed.push(c.name.clone());
            }
        }
    }
    if n == 0 && !failed.is_empty() {
        return Err(format!("These cores couldn't be downloaded: {}", failed.join(", ")));
    }
    if !failed.is_empty() {
        core.log(format!("RetroArch: these cores couldn't be downloaded: {}", failed.join(", ")));
    }
    let info = ra_home(&core).join("info");
    if std::fs::read_dir(&info).map(|r| r.count() == 0).unwrap_or(true) {
        let z = tmp.join("info.zip");
        if fetch_to(&app, &core, &format!("{}assets/frontend/info.zip", buildbot()), &z, "Core info").await.is_ok() {
            if let Ok(f) = std::fs::File::open(&z) {
                if let Ok(mut a) = zip::ZipArchive::new(f) {
                    let _ = a.extract(&info);
                }
            }
            let _ = std::fs::remove_file(&z);
        }
    }
    let _ = std::fs::remove_dir_all(&tmp);
    core.log(format!("RetroArch: {n} core{} added", if n == 1 { "" } else { "s" }));
    Ok(n)
}

#[tauri::command]
pub fn rarch_setup(core: tauri::State<Core>) -> Result<usize, String> {
    if !script(&core).exists() && installed_version(&core).is_empty() {
        return Err("RetroArch isn't in the vault yet.".into());
    }
    setup(&core)?;
    Ok(walk_count(&ra_home(&core).join("system")))
}

#[tauri::command]
pub fn rarch_start(core: tauri::State<Core>) -> Result<(), String> {
    let sh = script(&core);
    if !sh.is_file() {
        return Err("RetroArch isn't in the vault yet. Press \"Get RetroArch\" first.".into());
    }
    let child = crate::desktop_cmd(&sh.to_string_lossy())
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("RetroArch didn't start: {e}"))?;
    std::thread::spawn(move || {
        let mut c = child;
        let _ = c.wait();
    });
    core.log("RetroArch started");
    Ok(())
}

#[cfg(test)]
mod bios_tests {
    #[test]
    fn bios_folder_for_retroarch() {
        let d = std::env::temp_dir().join(format!("ev-bios-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let root = d.join("vault");
        std::fs::create_dir_all(root.join("bios/ps2")).unwrap();
        std::fs::create_dir_all(root.join("bios/neogeo")).unwrap();
        std::fs::write(root.join("bios/ps2/SCPH39001.bin"), b"bios").unwrap();
        std::fs::write(root.join("bios/neogeo/neogeo.zip"), b"zip").unwrap();
        let r = root.to_string_lossy().to_string();
        let sys = super::ra_bios_dir(&r);
        std::fs::create_dir_all(&sys).unwrap();
        std::os::unix::fs::symlink("nowhere", sys.join("old.bin")).unwrap();
        std::fs::write(sys.join("mine.bin"), b"my own").unwrap();
        let (n, ch) = super::fill_bios(&r, &sys);
        assert_eq!((n, ch), (4, 4), "SCPH39001.bin, scph39001.bin, neogeo.zip, fbneo/neogeo.zip");
        // core data in bios/_retroarch/ goes in as it is (no lower-case copies)
        std::fs::create_dir_all(root.join("bios/_retroarch/dolphin-emu/Sys")).unwrap();
        std::fs::write(root.join("bios/_retroarch/dolphin-emu/Sys/GC.TXT"), b"x").unwrap();
        assert_eq!(super::fill_bios(&r, &sys), (5, 1));
        assert!(sys.join("dolphin-emu/Sys/GC.TXT").is_file() && !sys.join("dolphin-emu/Sys/gc.txt").exists());
        std::fs::remove_dir_all(root.join("bios/_retroarch")).unwrap();
        assert_eq!(super::fill_bios(&r, &sys), (4, 1));
        let f = sys.join("pcsx2/bios/scph39001.bin");
        assert!(!f.is_symlink() && std::fs::read(&f).unwrap() == b"bios");
        assert!(sys.join("fbneo/neogeo.zip").is_file() && sys.join("neogeo.zip").is_file());
        assert!(!sys.join("old.bin").exists() && sys.join("mine.bin").exists());
        // nothing changed: nothing made again
        assert_eq!(super::fill_bios(&r, &sys), (4, 0));
        // a BIOS you removed disappears
        std::fs::remove_file(root.join("bios/neogeo/neogeo.zip")).unwrap();
        assert_eq!(super::fill_bios(&r, &sys), (2, 2));
        assert!(f.is_file() && !sys.join("fbneo/neogeo.zip").exists() && sys.join("mine.bin").exists());
        let _ = std::fs::remove_dir_all(&d);
    }
}
