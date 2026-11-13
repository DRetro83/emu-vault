//! Playing from the vault:
//! - which emulator ES-DE offers per system (read from ES-DE's own es_systems.xml, so the names match exactly),
//! - your choice per system (a RetroArch core, or a standalone emulator), also told to ES-DE,
//! - PC emulators (AppImages Emu Vault downloaded) running from the vault with their settings in the vault,
//! - ES-DE's find rules for RetroArch and those emulators,
//! - a Play button: start a game straight from Emu Vault.

use crate::{store, Core};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// app id -> (ES-DE emulator name, folder name, systems, settings folders in a home folder)
pub const VAULT_EMUS: &[(&str, &str, &str, &[&str], &[&str])] = &[
    ("pc.pcsx2", "PCSX2", "PCSX2", &["ps2"], &[".config/PCSX2"]),
    ("pc.duckstation", "DUCKSTATION", "DuckStation", &["psx"], &[".local/share/duckstation"]),
    ("pc.rpcs3", "RPCS3", "RPCS3", &["ps3"], &[".config/rpcs3"]),
    ("pc.cemu", "CEMU", "Cemu", &["wiiu"], &[".config/Cemu", ".local/share/Cemu"]),
    ("pc.xemu", "XEMU", "xemu", &["xbox"], &[".local/share/xemu"]),
    ("pc.melonds", "MELONDS", "melonDS", &["nds"], &[".config/melonDS"]),
    ("pc.mgba", "MGBA", "mGBA", &["gba", "gb", "gbc"], &[".config/mgba"]),
    ("pc.shadps4", "SHADPS4", "shadPS4", &["ps4"], &[".local/share/shadPS4"]),
    ("pc.vita3k", "VITA3K", "Vita3K", &["psvita"], &[".local/share/Vita3K", ".config/Vita3K"]),
];

fn root(core: &Core) -> String {
    core.cfg.lock().unwrap().root.clone()
}
fn emus_dir(core: &Core) -> PathBuf {
    Path::new(&root(core)).join("Emulators")
}

// ------------------------------------------------------------------ ES-DE's systems and emulators

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct EsCommand {
    pub label: String,
    /// RetroArch core ("mgba") or "" for a standalone emulator
    pub core: String,
    /// standalone emulator name ("PCSX2") or "RETROARCH"
    pub emulator: String,
}

/// system -> ES-DE's commands for it (the first one is ES-DE's default)
pub type EsSystems = HashMap<String, Vec<EsCommand>>;

fn es_cache(core: &Core) -> PathBuf {
    crate::esde::esde_dir(core).join("emu-vault-systems.json")
}

pub fn parse_es_systems(xml: &str) -> EsSystems {
    let mut out = EsSystems::new();
    for b in crate::re!(r"(?s)<system>(.*?)</system>").captures_iter(xml) {
        let body = &b[1];
        let Some(name) = crate::re!(r"<name>([^<]+)</name>").captures(body).map(|c| c[1].trim().to_string()) else { continue };
        let mut cmds = vec![];
        for c in crate::re!(r#"<command(?:\s+label="([^"]*)")?\s*>([^<]+)</command>"#).captures_iter(body) {
            let label = c.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();
            let cmd = &c[2];
            let core =
                crate::re!(r"%CORE_RETROARCH%[/\\]([A-Za-z0-9_\-]+)_libretro\.(?:so|dll|dylib)").captures(cmd).map(|m| m[1].to_string()).unwrap_or_default();
            let emulator = crate::re!(r"%EMULATOR_([A-Z0-9\-_]+)%").captures(cmd).map(|m| m[1].to_string()).unwrap_or_default();
            cmds.push(EsCommand { label, core, emulator });
        }
        if !cmds.is_empty() {
            out.insert(name, cmds);
        }
    }
    out
}

/// ES-DE's es_systems.xml from inside its AppImage (unpacked once, the result is kept).
pub fn es_systems(core: &Core) -> EsSystems {
    let cache = es_cache(core);
    let ver = crate::overview_pub(core).esde_version;
    if let Ok(t) = std::fs::read_to_string(&cache) {
        if let Ok((v, s)) = serde_json::from_str::<(String, EsSystems)>(&t) {
            if v == ver && !s.is_empty() {
                return s;
            }
        }
    }
    let Some(img) = crate::overview_pub(core).esde_appimage else { return EsSystems::new() };
    if cfg!(windows) {
        // the portable ES-DE: its list is in resources\systems\windows (winplay.rs)
        let s = crate::winplay::esde_exe(&img).ok().and_then(|e| crate::winplay::esde_systems_xml(&e)).map(|t| parse_es_systems(&t)).unwrap_or_default();
        if !s.is_empty() {
            let _ = std::fs::create_dir_all(cache.parent().unwrap());
            let _ = std::fs::write(&cache, serde_json::to_vec(&(ver, &s)).unwrap_or_default());
        }
        return s;
    }
    let tmp = std::env::temp_dir().join(format!("emuvault-esde-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tmp);
    let _ = std::fs::create_dir_all(&tmp);
    chmod_x(Path::new(&img));
    let ok = crate::desktop_cmd(&img)
        .arg("--appimage-extract")
        .arg("*es_systems.xml")
        .current_dir(&tmp)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false);
    let mut found = None;
    if ok {
        let mut stack = vec![tmp.clone()];
        while let Some(d) = stack.pop() {
            for e in std::fs::read_dir(&d).into_iter().flatten().flatten() {
                let p = e.path();
                if p.is_dir() {
                    stack.push(p);
                } else if e.file_name() == "es_systems.xml" && p.to_string_lossy().contains("linux") {
                    found = Some(p);
                }
            }
        }
    }
    let s = found.and_then(|p| std::fs::read_to_string(p).ok()).map(|t| parse_es_systems(&t)).unwrap_or_default();
    let _ = std::fs::remove_dir_all(&tmp);
    if !s.is_empty() {
        let _ = std::fs::create_dir_all(cache.parent().unwrap());
        let _ = std::fs::write(&cache, serde_json::to_vec(&(ver, &s)).unwrap_or_default());
    }
    s
}

pub fn chmod_x(p: &Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(m) = std::fs::metadata(p) {
            let mut perm = m.permissions();
            if perm.mode() & 0o111 == 0 {
                perm.set_mode(perm.mode() | 0o755);
                let _ = std::fs::set_permissions(p, perm);
            }
        }
    }
}

// ------------------------------------------------------------------ emulators installed as Flatpak on this pc
/// (Flatpak id, name, systems, arguments before the game)
const FLATPAKS: &[(&str, &str, &[&str], &[&str])] = &[("org.DolphinEmu.dolphin-emu", "Dolphin", &["gc", "wii"], &["-b", "-e"])];
fn flatpak_has(id: &str) -> bool {
    let Ok(o) = crate::desktop_cmd("flatpak").args(["info", id]).output() else { return false };
    o.status.success()
}

// ------------------------------------------------------------------ choices per system

/// What plays a system: "ra:<core>" (RetroArch core) or "emu:<app id>" (a PC emulator from the vault)
pub fn choice(core: &Core, sys: &str) -> String {
    if let Some(c) = core.cfg.lock().unwrap().play_with.get(sys) {
        return c.clone();
    }
    if let Some((c, _)) = crate::retroarch::default_core(sys) {
        return format!("ra:{c}");
    }
    let vault: Vec<String> = core.cfg.lock().unwrap().vault_emus.clone();
    for (id, _, _, systems, _) in VAULT_EMUS {
        if systems.contains(&sys) && vault.iter().any(|v| v == id) {
            return format!("emu:{id}");
        }
    }
    String::new()
}

#[derive(Serialize)]
pub struct SysPlay {
    sys: String,
    /// current choice
    choice: String,
    /// what can be chosen: (value, label, ready on this computer)
    options: Vec<(String, String, bool)>,
    /// ES-DE's label for the choice ("" when ES-DE's list isn't known)
    es_label: String,
}

const ARC: &[&str] = &["neogeo", "arcade", "fbneo", "fba", "mame", "cps", "cps1", "cps2", "cps3"];
const MORE_CORES: &[(&[&str], &[(&str, &str)])] = &[
    (ARC, &[("fbneo", "FinalBurn Neo"), ("mame2003_plus", "MAME 2003-Plus"), ("mame2010", "MAME 2010"), ("mame", "MAME (current)")]),
    (&["nes", "famicom"], &[("fceumm", "FCEUmm"), ("nestopia", "Nestopia UE"), ("mesen", "Mesen")]),
    (&["snes", "sfc", "snesna"], &[("snes9x", "Snes9x"), ("bsnes", "bsnes"), ("mesen-s", "Mesen-S")]),
    (&["gba"], &[("mgba", "mGBA"), ("vbam", "VBA-M"), ("gpsp", "gpSP")]),
    (&["gb", "gbc", "sgb"], &[("gambatte", "Gambatte"), ("sameboy", "SameBoy"), ("mgba", "mGBA")]),
    (
        &["megadrive", "genesis", "megadrivejp", "mastersystem", "gamegear", "segacd", "megacd", "sg-1000"],
        &[("genesis_plus_gx", "Genesis Plus GX"), ("picodrive", "PicoDrive")],
    ),
    (&["psx"], &[("mednafen_psx_hw", "Beetle PSX HW"), ("swanstation", "SwanStation"), ("pcsx_rearmed", "PCSX ReARMed")]),
    (&["n64"], &[("mupen64plus_next", "Mupen64Plus-Next"), ("parallel_n64", "ParaLLEl N64")]),
    (&["pcengine", "pcenginecd", "tg16", "tg-cd"], &[("mednafen_pce", "Beetle PCE"), ("mednafen_pce_fast", "Beetle PCE Fast")]),
    (&["nds"], &[("melonds", "melonDS"), ("desmume", "DeSmuME")]),
    (&["saturn", "saturnjp"], &[("mednafen_saturn", "Beetle Saturn"), ("kronos", "Kronos")]),
    (&["dreamcast", "naomi", "atomiswave"], &[("flycast", "Flycast")]),
];

#[tauri::command]
pub fn play_options(core: tauri::State<Core>) -> Vec<SysPlay> {
    if !crate::retroarch::ra_on(&core) {
        return vec![];
    }
    let lib = core.lib.lock().unwrap().clone();
    let es = es_systems(&core);
    let cores = crate::retroarch::cores_dir(&core);
    let vault = core.cfg.lock().unwrap().vault_emus.clone();
    let mut systems: Vec<&String> = lib.iter().filter(|(_, v)| !v.is_empty()).map(|(k, _)| k).collect();
    systems.sort();
    let mut out = vec![];
    for s in systems {
        let mut opts: Vec<(String, String, bool)> = vec![];
        if let Some(cmds) = es.get(s.as_str()) {
            for c in cmds {
                if !c.core.is_empty() {
                    let v = format!("ra:{}", c.core);
                    if !opts.iter().any(|o| o.0 == v) {
                        opts.push((v, format!("{} (RetroArch)", c.label), cores.join(crate::winplay::core_file(&c.core)).is_file()));
                    }
                } else if let Some((id, _, name, _, _)) = VAULT_EMUS.iter().find(|e| e.1 == c.emulator) {
                    let v = format!("emu:{id}");
                    if !opts.iter().any(|o| o.0 == v) {
                        opts.push((v, format!("{name} (standalone)"), vault.iter().any(|x| x == id)));
                    }
                }
            }
        }
        if opts.is_empty() {
            if let Some((c, n)) = crate::retroarch::default_core(s) {
                opts.push((format!("ra:{c}"), format!("{n} (RetroArch)"), cores.join(crate::winplay::core_file(c)).is_file()));
            }
            for (id, _, name, systems, _) in VAULT_EMUS {
                if systems.contains(&s.as_str()) {
                    opts.push((format!("emu:{id}"), format!("{name} (standalone)"), vault.iter().any(|x| x == id)));
                }
            }
        }
        // other RetroArch cores that play this system, so there is always a second choice
        for (syss, list) in MORE_CORES {
            if syss.contains(&s.as_str()) {
                for (c, n) in *list {
                    let v = format!("ra:{c}");
                    if !opts.iter().any(|o| o.0 == v) {
                        opts.push((v, format!("{n} (RetroArch)"), cores.join(crate::winplay::core_file(c)).is_file()));
                    }
                }
            }
        }
        // an emulator you installed as Flatpak (Dolphin: its own Linux version comes only as Flatpak)
        for (id, name, systems, _) in FLATPAKS {
            if cfg!(windows) {
                break;
            }
            if systems.contains(&s.as_str()) {
                let v = format!("fp:{id}");
                if !opts.iter().any(|o| o.0 == v) {
                    opts.push((v, format!("{name} (Flatpak on this pc)"), flatpak_has(id)));
                }
            }
        }
        if opts.is_empty() {
            continue;
        }
        let ch = {
            let c = choice(&core, s);
            if c.is_empty() {
                opts[0].0.clone()
            } else {
                c
            }
        };
        let es_label = es
            .get(s.as_str())
            .and_then(|cmds| {
                cmds.iter().find(|c| {
                    (!c.core.is_empty() && ch == format!("ra:{}", c.core))
                        || (c.core.is_empty() && VAULT_EMUS.iter().any(|e| e.1 == c.emulator && ch == format!("emu:{}", e.0)))
                })
            })
            .map(|c| c.label.clone())
            .unwrap_or_default();
        out.push(SysPlay { sys: s.clone(), choice: ch, options: opts, es_label });
    }
    out
}

/// Choose what plays a system; ES-DE is told too (alternativeEmulator in its game list).
#[tauri::command]
pub fn play_set(core: tauri::State<Core>, sys: String, with: String) -> Result<(), String> {
    {
        let mut c = core.cfg.lock().unwrap();
        c.play_with.insert(sys.clone(), with.clone());
        store::save_config(&c)?;
    }
    let es = es_systems(&core);
    if let Some(cmds) = es.get(&sys) {
        let first = cmds.first().map(|c| c.label.clone()).unwrap_or_default();
        let fp_name = with.strip_prefix("fp:").and_then(|id| FLATPAKS.iter().find(|e| e.0 == id)).map(|e| e.1.to_uppercase());
        let label = cmds
            .iter()
            .find(|c| {
                (!c.core.is_empty() && with == format!("ra:{}", c.core))
                    || (c.core.is_empty() && VAULT_EMUS.iter().any(|e| e.1 == c.emulator && with == format!("emu:{}", e.0)))
                    || (c.core.is_empty() && fp_name.as_deref() == Some(c.emulator.as_str()))
            })
            .map(|c| c.label.clone());
        if let Some(l) = label {
            set_alt_emulator(&core, &sys, if l == first { None } else { Some(&l) });
        }
    }
    core.log(format!("{sys}: plays with {with}"));
    Ok(())
}

fn set_alt_emulator(core: &Core, sys: &str, label: Option<&str>) {
    let p = crate::esde::esde_dir(core).join("gamelists").join(sys).join("gamelist.xml");
    let t = std::fs::read_to_string(&p).unwrap_or_else(|_| "<?xml version=\"1.0\"?>\n<gameList>\n</gameList>\n".into());
    let mut t = crate::re!(r"(?s)\s*<alternativeEmulator>.*?</alternativeEmulator>").replace(&t, "").to_string();
    if let Some(l) = label {
        let block = format!("\n<alternativeEmulator>\n\t<label>{}</label>\n</alternativeEmulator>", l.replace('&', "&amp;").replace('<', "&lt;"));
        if let Some(i) = t.find("?>") {
            t.insert_str(i + 2, &block);
        } else {
            t = format!("<?xml version=\"1.0\"?>{block}\n{t}");
        }
    }
    let _ = std::fs::create_dir_all(p.parent().unwrap());
    let _ = std::fs::write(&p, t);
}

// ------------------------------------------------------------------ PC emulators in the vault

fn stored_appimage(core: &Core, id: &str) -> Option<String> {
    // one you chose yourself ("Use one I already have")
    let own = core.cfg.lock().unwrap().emu_paths.get(id).cloned();
    if let Some(p) = own {
        let full = if Path::new(&p).is_absolute() { PathBuf::from(&p) } else { Path::new(&root(core)).join(&p) };
        if full.is_file() {
            return Some(full.to_string_lossy().into());
        }
    }
    let ov = crate::overview_any(core);
    ov.into_iter().find(|(i, _)| i == id).and_then(|(_, p)| p)
}

#[derive(Serialize)]
pub struct VaultEmu {
    id: String,
    name: String,
    systems: Vec<String>,
    /// an AppImage Emu Vault downloaded
    downloaded: bool,
    /// the program you chose yourself, if any
    own: String,
    /// runs from the vault
    in_vault: bool,
    dir: String,
}

#[tauri::command]
pub fn vault_emus(core: tauri::State<Core>) -> Vec<VaultEmu> {
    let on = core.cfg.lock().unwrap().vault_emus.clone();
    let paths = core.cfg.lock().unwrap().emu_paths.clone();
    VAULT_EMUS
        .iter()
        .map(|(id, _, name, systems, _)| VaultEmu {
            id: id.to_string(),
            name: name.to_string(),
            systems: systems.iter().map(|s| s.to_string()).collect(),
            downloaded: stored_appimage(&core, id).is_some(),
            own: paths.get(*id).cloned().unwrap_or_default(),
            in_vault: on.iter().any(|x| x == id) && emus_dir(&core).join(name).join(format!("{}.sh", name.to_lowercase())).is_file(),
            dir: emus_dir(&core).join(name).to_string_lossy().into(),
        })
        .collect()
}

fn rel_from(dir: &Path, target: &Path) -> PathBuf {
    // both inside the main folder: ../.. back to the common part
    let d: Vec<_> = dir.components().collect();
    let t: Vec<_> = target.components().collect();
    let mut i = 0;
    while i < d.len() && i < t.len() && d[i] == t[i] {
        i += 1;
    }
    let mut p = PathBuf::new();
    for _ in i..d.len() {
        p.push("..");
    }
    for c in &t[i..] {
        p.push(c);
    }
    p
}

/// Put (or refresh) a PC emulator in the vault: Emulators/<Name>/current.AppImage (link to the newest download),
/// <name>.sh (starts it with its settings in Emulators/<Name>/home) and, the first time, a copy of the settings
/// it already has on this computer.
pub fn link_emu(core: &Core, id: &str) -> Result<(), String> {
    let (_, _, name, _, cfgdirs) = VAULT_EMUS.iter().find(|e| e.0 == id).ok_or("Unknown emulator")?;
    let img = stored_appimage(core, id).ok_or(format!("{name} isn't downloaded yet."))?;
    let d = emus_dir(core).join(name);
    let home = d.join("home");
    let first = !home.exists();
    std::fs::create_dir_all(&home).map_err(|e| e.to_string())?;
    let cur = d.join("current.AppImage");
    let _ = std::fs::remove_file(&cur);
    chmod_x(Path::new(&img));
    #[cfg(unix)]
    {
        let r = root(core);
        let target = if Path::new(&img).starts_with(&r) { rel_from(&d, Path::new(&img)) } else { PathBuf::from(&img) };
        std::os::unix::fs::symlink(target, &cur).map_err(|e| e.to_string())?;
    }
    let sh = format!("#!/bin/sh\n# Starts {name} from the Emu Vault folder, with its settings in home/ next to this file.\nD=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\nexport HOME=\"$D/home\"\nexport XDG_CONFIG_HOME=\"$D/home/.config\"\nexport XDG_DATA_HOME=\"$D/home/.local/share\"\nexport XDG_CACHE_HOME=\"$D/home/.cache\"\nif [ ! -e /usr/lib/x86_64-linux-gnu/libfuse.so.2 ] && [ ! -e /lib/x86_64-linux-gnu/libfuse.so.2 ] && [ ! -e /usr/lib64/libfuse.so.2 ] && [ ! -e /usr/lib/libfuse.so.2 ]; then export APPIMAGE_EXTRACT_AND_RUN=1; fi\nexec \"$D/current.AppImage\" \"$@\"\n");
    let shp = d.join(format!("{}.sh", name.to_lowercase()));
    std::fs::write(&shp, sh).map_err(|e| e.to_string())?;
    chmod_x(&shp);
    if first {
        let h = dirs::home_dir().unwrap_or_default();
        for c in cfgdirs.iter() {
            let from = h.join(c);
            if from.is_dir() {
                let _ = copy_tree(&from, &home.join(c));
            }
        }
    }
    Ok(())
}

fn copy_tree(from: &Path, to: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(to)?;
    for e in std::fs::read_dir(from)?.flatten() {
        let (s, d) = (e.path(), to.join(e.file_name()));
        if s.is_dir() {
            copy_tree(&s, &d)?;
        } else if !d.exists() {
            std::fs::copy(&s, &d)?;
        }
    }
    Ok(())
}

/// An emulator you downloaded yourself: an AppImage is copied into the vault (Emulators/<Name>/app/), so it goes
/// along to other computers; any other program is linked where it is.
#[tauri::command]
pub fn vault_emu_link(core: tauri::State<Core>, id: String, path: String) -> Result<String, String> {
    let (_, _, name, _, _) = VAULT_EMUS.iter().find(|e| e.0 == id).ok_or("Unknown emulator")?;
    let src = PathBuf::from(&path);
    if !src.is_file() {
        return Err("That isn't a file.".into());
    }
    let r = root(&core);
    let appimage = src.extension().map(|e| e.to_string_lossy().eq_ignore_ascii_case("appimage")).unwrap_or(false);
    let stored: String = if appimage && !src.starts_with(&r) {
        let dir = emus_dir(&core).join(name).join("app");
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let dest = dir.join(src.file_name().unwrap());
        if dest != src {
            std::fs::copy(&src, &dest).map_err(|e| format!("Copying didn't work: {e}"))?;
        }
        chmod_x(&dest);
        dest.strip_prefix(&r).map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|_| dest.to_string_lossy().into())
    } else if src.starts_with(&r) {
        src.strip_prefix(&r).unwrap().to_string_lossy().into()
    } else {
        src.to_string_lossy().into()
    };
    {
        let mut c = core.cfg.lock().unwrap();
        c.emu_paths.insert(id.clone(), stored.clone());
        c.vault_emus.retain(|x| x != &id);
        c.vault_emus.push(id.clone());
        store::save_config(&c)?;
    }
    link_emu(&core, &id)?;
    write_find_rules(&core);
    core.log(format!(
        "{name}: your own {} {}",
        if appimage { "AppImage, copied into" } else { "program, linked from" },
        if appimage { "the vault" } else { path.as_str() }
    ));
    Ok(if appimage { "copied".into() } else { "linked".into() })
}

#[tauri::command]
pub fn vault_emu_set(core: tauri::State<Core>, id: String, on: bool) -> Result<(), String> {
    if on {
        link_emu(&core, &id)?;
    }
    {
        let mut c = core.cfg.lock().unwrap();
        c.vault_emus.retain(|x| x != &id);
        if on {
            c.vault_emus.push(id.clone());
        }
        store::save_config(&c)?;
    }
    write_find_rules(&core);
    core.log(format!("{id}: {}", if on { "runs from the vault" } else { "no longer from the vault" }));
    Ok(())
}

/// Refresh the links (a newer AppImage was downloaded) and ES-DE's find rules.
pub fn refresh(core: &Core) {
    if crate::retroarch::script(core).is_file() {
        crate::retroarch::bios_links(core);
    }
    // the separate emulators are Linux programs (.sh + AppImage): not on Windows yet
    let on = if cfg!(windows) { vec![] } else { core.cfg.lock().unwrap().vault_emus.clone() };
    for id in &on {
        let _ = link_emu(core, id);
    }
    write_find_rules(core);
}

/// ES-DE: start RetroArch and the PC emulators from the vault.
pub fn write_find_rules(core: &Core) {
    let dir = crate::esde::esde_dir(core).join("custom_systems");
    let p = dir.join("es_find_rules.xml");
    if !crate::retroarch::ra_on(core) {
        // you set up ES-DE yourself: take out the rules the vault wrote (and put back yours, if it kept a copy)
        if std::fs::read_to_string(&p).map(|x| x.contains("Written by Emu Vault")).unwrap_or(false) {
            let bk = p.with_extension("xml.emuvault-backup");
            if bk.is_file() {
                let _ = std::fs::rename(&bk, &p);
            } else {
                let _ = std::fs::remove_file(&p);
            }
        }
        return;
    }
    let esc = |s: &Path| s.to_string_lossy().replace('&', "&amp;").replace('<', "&lt;");
    let mut body = String::new();
    let ra = crate::retroarch::script(core);
    if ra.is_file() {
        body.push_str(&format!("    <emulator name=\"RETROARCH\">\n        <rule type=\"staticpath\">\n            <entry>{}</entry>\n        </rule>\n    </emulator>\n    <core name=\"RETROARCH\">\n        <rule type=\"corepath\">\n            <entry>{}</entry>\n        </rule>\n    </core>\n", esc(&ra), esc(&crate::retroarch::cores_dir(core))));
    }
    let on = if cfg!(windows) { vec![] } else { core.cfg.lock().unwrap().vault_emus.clone() };
    for (id, es, name, _, _) in VAULT_EMUS {
        if !on.iter().any(|x| x == id) {
            continue;
        }
        let sh = emus_dir(core).join(name).join(format!("{}.sh", name.to_lowercase()));
        if sh.is_file() {
            body.push_str(&format!(
                "    <emulator name=\"{es}\">\n        <rule type=\"staticpath\">\n            <entry>{}</entry>\n        </rule>\n    </emulator>\n",
                esc(&sh)
            ));
        }
    }
    if body.is_empty() {
        return;
    }
    let x = format!("<?xml version=\"1.0\"?>\n<!-- Written by Emu Vault: emulators from the vault. -->\n<ruleList>\n{body}</ruleList>\n");
    if std::fs::read_to_string(&p).map(|o| o == x).unwrap_or(false) {
        return;
    }
    let _ = std::fs::create_dir_all(&dir);
    if p.exists() && !std::fs::read_to_string(&p).unwrap_or_default().contains("Written by Emu Vault") {
        let _ = std::fs::copy(&p, p.with_extension("xml.emuvault-backup"));
    }
    let _ = std::fs::write(&p, x);
}

// ------------------------------------------------------------------ Play

/// What to give the emulator: a "Game.m3u" folder is opened through its playlist (or its first disc).
fn game_file(path: &str) -> String {
    let p = Path::new(path);
    if !p.is_dir() {
        return path.to_string();
    }
    let mut v: Vec<PathBuf> = std::fs::read_dir(p).into_iter().flatten().flatten().map(|e| e.path()).collect();
    v.sort();
    let pick = |exts: &[&str]| v.iter().find(|f| f.extension().map(|e| exts.contains(&e.to_string_lossy().to_lowercase().as_str())).unwrap_or(false)).cloned();
    pick(&["m3u"]).or_else(|| pick(&["chd", "cue", "iso", "pbp"])).map(|f| f.to_string_lossy().to_string()).unwrap_or_else(|| path.to_string())
}

#[tauri::command]
pub fn play(app: tauri::AppHandle, core: tauri::State<Core>, path: String, sys: String, with: Option<String>) -> Result<String, String> {
    if !crate::retroarch::ra_on(&core) {
        return Err("Games start in ES-DE or RetroArch now. Playing from the vault can be turned back on in Settings.".into());
    }
    let path = game_file(&path);
    // `with`: just this once with another emulator (testing duplicates); the system's choice stays
    let ch = with.filter(|w| !w.is_empty()).unwrap_or_else(|| choice(&core, &sys));
    let (prog, args): (PathBuf, Vec<String>) = if let Some(c) = ch.strip_prefix("ra:") {
        let sh = crate::retroarch::script(&core);
        if !sh.is_file() {
            return Err("RetroArch isn't in the vault yet: Roms › Tools › RetroArch › Get RetroArch.".into());
        }
        let so = crate::retroarch::cores_dir(&core).join(crate::winplay::core_file(c));
        if !so.is_file() {
            return Err(format!("The {c} core isn't there yet: Roms › Tools › RetroArch › Add cores."));
        }
        crate::retroarch::bios_links(&core);
        let log = crate::retroarch::script(&core).with_file_name("last-game.log");
        let _ = std::fs::remove_file(&log);
        (sh, vec!["--verbose".into(), format!("--log-file={}", log.display()), "-L".into(), so.to_string_lossy().into(), path.clone()])
    } else if let Some(id) = ch.strip_prefix("emu:") {
        let (_, _, name, _, _) = VAULT_EMUS.iter().find(|e| e.0 == id).ok_or("Unknown emulator")?;
        if cfg!(windows) {
            return Err(format!("{name} as a separate program doesn't work on Windows yet. Choose a RetroArch core for this system in Roms › Ready to play."));
        }
        let sh = emus_dir(&core).join(name).join(format!("{}.sh", name.to_lowercase()));
        if !sh.is_file() {
            return Err(format!("{name} isn't in the vault yet: Roms › Tools › Emulators in the vault."));
        }
        (sh, vec![path.clone()])
    } else if let Some(id) = ch.strip_prefix("fp:") {
        let (_, name, _, pre) = FLATPAKS.iter().find(|e| e.0 == id).ok_or("Unknown emulator")?;
        if !flatpak_has(id) {
            return Err(format!("{name} isn't installed as Flatpak on this pc. Install it: flatpak install flathub {id}"));
        }
        let mut a: Vec<String> = vec!["run".into(), id.to_string()];
        a.extend(pre.iter().map(|x| x.to_string()));
        a.push(path.clone());
        (PathBuf::from("flatpak"), a)
    } else {
        return Err("Emu Vault doesn't know an emulator for this system yet.".into());
    };
    let child = if cfg!(windows) {
        crate::winplay::spawn(&prog, &args, true)
    } else {
        crate::desktop_cmd(&prog.to_string_lossy()).args(&args).stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::piped()).spawn()
    }
    .map_err(|e| format!("The emulator didn't start: {e}"))?;
    // the emulator stopped right away: say why (RetroArch's log, or what the program printed)
    let log = if ch.starts_with("ra:") { Some(crate::retroarch::script(&core).with_file_name("last-game.log")) } else { None };
    let started = std::time::Instant::now();
    std::thread::spawn(move || {
        use std::io::Read;
        let mut c = child;
        let mut err = String::new();
        if let Some(mut e) = c.stderr.take() {
            let _ = e.read_to_string(&mut err);
        }
        let st = c.wait();
        let secs = started.elapsed().as_secs();
        if secs < 15 {
            let code = st.as_ref().ok().and_then(|s| s.code());
            #[cfg(unix)]
            let crashed = {
                use std::os::unix::process::ExitStatusExt;
                st.as_ref().ok().and_then(|s| s.signal()).is_some() || code == Some(139)
            };
            #[cfg(not(unix))]
            let crashed = false;
            let ok = st.map(|s| s.success()).unwrap_or(false);
            let text = log.and_then(|l| std::fs::read_to_string(l).ok()).unwrap_or_default();
            let all: Vec<&str> = text.lines().chain(err.lines()).map(|l| l.trim()).filter(|l| !l.is_empty()).collect();
            let mut lines: Vec<&str> = all
                .iter()
                .copied()
                .filter(|l| {
                    let u = l.to_lowercase();
                    !u.contains("no missing")
                        && (u.contains("error") || u.contains("failed") || u.contains("could not") || u.contains("missing") || u.contains("not found"))
                })
                .collect();
            if crashed {
                lines.push("The emulator crashed. Try another core in Roms › Ready to play, or ↻ to get this core again.");
            }
            // closed within a few seconds: that's no game, even without an error line
            if !ok || !lines.is_empty() || secs < 4 {
                if lines.is_empty() || (crashed && lines.len() == 1) {
                    let note = lines.pop();
                    lines = all.iter().rev().take(3).rev().copied().collect();
                    lines.extend(note);
                }
                use tauri::{Emitter, Manager};
                let tail: Vec<String> = lines.iter().rev().take(4).rev().map(|s| s.chars().take(200).collect()).collect();
                app.state::<Core>().log(format!(
                    "The game stopped after {secs} s (exit {}): {}",
                    code.map(|c| c.to_string()).unwrap_or("-".into()),
                    if tail.is_empty() { "nothing printed".to_string() } else { tail.join(" · ") }
                ));
                let _ = app.emit("play-failed", tail);
            }
        }
    });
    let name = Path::new(&path).file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    core.log(format!(
        "Playing {name} with {ch}: {} {}",
        prog.display(),
        args.iter().map(|a| if a.contains(' ') { format!("\"{a}\"") } else { a.clone() }).collect::<Vec<_>>().join(" ")
    ));
    Ok(ch)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn reads_es_systems() {
        let x = r#"<systemList>
  <system>
    <name>psx</name>
    <fullname>Sony PlayStation</fullname>
    <command label="Beetle PSX">%EMULATOR_RETROARCH% -L %CORE_RETROARCH%/mednafen_psx_libretro.so %ROM%</command>
    <command label="SwanStation">%EMULATOR_RETROARCH% -L %CORE_RETROARCH%/swanstation_libretro.so %ROM%</command>
    <command label="DuckStation (Standalone)">%EMULATOR_DUCKSTATION% -batch %ROM%</command>
  </system>
</systemList>"#;
        let s = parse_es_systems(x);
        let p = &s["psx"];
        assert_eq!(p.len(), 3);
        assert_eq!(p[0].core, "mednafen_psx");
        assert_eq!(p[2].emulator, "DUCKSTATION");
        assert_eq!(p[2].core, "");
        let r = rel_from(Path::new("/v/Emulators/PCSX2"), Path::new("/v/Apps/PCSX2/Linux/2.1/pcsx2.AppImage"));
        assert_eq!(r, PathBuf::from("../../Apps/PCSX2/Linux/2.1/pcsx2.AppImage"));
    }
}
