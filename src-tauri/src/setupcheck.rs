//! Setup check (0.9): you set up RetroArch, ES-DE and the emulators yourself; this only READS their
//! settings files and says what points to your vault. Nothing here writes to them.

use crate::Core;
use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Serialize, Clone)]
pub struct Row {
    name: String,
    /// what the settings file says (already with ~ filled in)
    have: String,
    /// the path to fill in
    want: String,
    /// ok | bad | opt | none
    st: String,
    hint: String,
}

#[derive(Serialize)]
pub struct Group {
    id: String,
    name: String,
    /// which settings file was read ("" = none found)
    file: String,
    where_: String,
    rows: Vec<Row>,
}

#[derive(Serialize)]
pub struct Check {
    groups: Vec<Group>,
    ra_bios: String,
    ra_on: bool,
    bios_ref: String,
}

fn home() -> PathBuf {
    dirs::home_dir().unwrap_or_default()
}

fn norm(p: &str, base_home: &Path) -> String {
    let p = p.trim().trim_matches('"');
    let p = if let Some(r) = p.strip_prefix("~/") {
        base_home.join(r).to_string_lossy().to_string()
    } else if p == "~" {
        base_home.to_string_lossy().to_string()
    } else {
        p.to_string()
    };
    p.trim_end_matches('/').to_string()
}

fn same(a: &str, b: &Path) -> bool {
    if a.is_empty() {
        return false;
    }
    let pa = Path::new(a);
    match (pa.canonicalize(), b.canonicalize()) {
        (Ok(x), Ok(y)) => x == y,
        _ => pa == b,
    }
}

fn row(name: &str, have: String, wants: &[PathBuf], hint: &str, optional: bool) -> Row {
    let ok = wants.iter().any(|w| same(&have, w));
    Row {
        name: name.into(),
        want: wants.first().map(|w| w.to_string_lossy().to_string()).unwrap_or_default(),
        st: if ok {
            "ok"
        } else if optional {
            "opt"
        } else {
            "bad"
        }
        .into(),
        hint: if ok { String::new() } else { hint.into() },
        have,
    }
}

/// retroarch.cfg: key = "value"
fn cfg_get(t: &str, key: &str) -> Option<String> {
    t.lines().find_map(|l| {
        let (k, v) = l.split_once('=')?;
        if k.trim() == key {
            Some(v.trim().trim_matches('"').to_string())
        } else {
            None
        }
    })
}

/// an .ini file: [section] key = value
fn ini_get(t: &str, section: &str, key: &str) -> Option<String> {
    let mut inside = false;
    for l in t.lines() {
        let l = l.trim();
        if l.starts_with('[') {
            inside = l.trim_matches(|c| c == '[' || c == ']').eq_ignore_ascii_case(section);
            continue;
        }
        if inside {
            if let Some((k, v)) = l.split_once('=') {
                if k.trim().eq_ignore_ascii_case(key) {
                    return Some(v.trim().to_string());
                }
            }
        }
    }
    None
}

/// Files with this name under a folder (hidden folders too: RetroArch keeps its settings in .config).
fn find_named(dir: &Path, name: &str, depth: usize) -> Vec<PathBuf> {
    let mut out = vec![];
    if depth == 0 {
        return out;
    }
    for e in std::fs::read_dir(dir).into_iter().flatten().flatten() {
        let p = e.path();
        if p.is_symlink() {
            continue;
        }
        if p.is_dir() {
            let n = e.file_name().to_string_lossy().to_lowercase();
            if ["cores", "assets", "thumbnails", "shaders", "overlays", "autoconfig", "database", "saves", "states", "system"].contains(&n.as_str()) {
                continue;
            }
            out.extend(find_named(&p, name, depth - 1));
        } else if e.file_name().to_string_lossy() == name {
            out.push(p);
        }
    }
    out
}

fn retroarch(root: &Path, ra_on: bool) -> Vec<Group> {
    let h = home();
    let mut found: Vec<(String, PathBuf, PathBuf)> = vec![
        ("RetroArch".into(), h.join(".config/retroarch/retroarch.cfg"), h.join(".config/retroarch")),
        (
            "RetroArch (Flatpak)".into(),
            h.join(".var/app/org.libretro.RetroArch/config/retroarch/retroarch.cfg"),
            h.join(".var/app/org.libretro.RetroArch/config/retroarch"),
        ),
        ("RetroArch (its own settings in the vault)".into(), root.join("RetroArch/retroarch.cfg"), root.join("RetroArch")),
    ];
    // the AppImage from Apps, with its own home next to it (RetroArch-Linux-x86_64.AppImage.home/): portable
    for (sub, label) in [("Apps", "RetroArch (AppImage in Apps)"), ("Launchers/RetroArch", "RetroArch (in the vault, on its own)")] {
        for cfg in find_named(&root.join(sub), "retroarch.cfg", 7).into_iter().filter(|p| p.to_string_lossy().to_lowercase().contains("retroarch")) {
            let dir = cfg.parent().unwrap_or(Path::new("")).to_path_buf();
            found.push((label.into(), cfg, dir));
        }
    }
    if ra_on {
        found.push((
            "RetroArch (started by the vault)".into(),
            root.join("RetroArch/home/.config/retroarch/retroarch.cfg"),
            root.join("RetroArch/home/.config/retroarch"),
        ));
    }
    let bios = crate::retroarch::ra_bios_dir(&root.to_string_lossy());
    let mut out = vec![];
    for (name, cfg, dir) in found {
        let Ok(t) = std::fs::read_to_string(&cfg) else { continue };
        // "default" means RetroArch's own folder next to its settings
        let get = |k: &str, def: &str| {
            let v = cfg_get(&t, k).unwrap_or_default();
            if v.is_empty() || v == "default" {
                dir.join(def).to_string_lossy().to_string()
            } else {
                norm(&v, &h)
            }
        };
        out.push(Group {
            id: "ra".into(),
            name,
            file: cfg.to_string_lossy().into(),
            where_: "RetroArch › Settings › Directory".into(),
            rows: vec![
                row("System/BIOS", get("system_directory", "system"), &[bios.clone()], "Point it at RetroArch-BIOS in the vault", false),
                row("Saves", get("savefile_directory", "saves"), &[root.join("saves/retroarch")], "Set it to the vault, so Backups has your saves", false),
                row(
                    "Save states",
                    get("savestate_directory", "states"),
                    &[root.join("saves/retroarch-states")],
                    "Set it to the vault, so Backups has them",
                    false,
                ),
                row("File Browser", get("rgui_browser_directory", ""), &[root.join("roms")], "Optional: to find your games from RetroArch's menu", true),
            ],
        });
    }
    if out.is_empty() {
        out.push(Group {
            id: "ra".into(),
            name: "RetroArch".into(),
            file: String::new(),
            where_: "Install RetroArch (Flatpak, apt, or the AppImage in Apps), start it once, then look here again.".into(),
            rows: vec![],
        });
    }
    out
}

fn esde(core: &Core, root: &Path) -> Group {
    let f = crate::esde::settings_file_for(core);
    let Ok(t) = std::fs::read_to_string(&f) else {
        return Group { id: "esde".into(), name: "ES-DE".into(), file: String::new(), where_: "Start ES-DE once, then look here again.".into(), rows: vec![] };
    };
    let h = home();
    let v = |k: &str, def: &str| {
        let x = crate::esde::setting(&t, k);
        if x.is_empty() {
            h.join(def).to_string_lossy().to_string()
        } else {
            norm(&x, &h)
        }
    };
    Group {
        id: "esde".into(),
        name: "ES-DE".into(),
        file: f.to_string_lossy().into(),
        where_: "ES-DE › Main menu › Other settings (ROM folder: Game collection settings)".into(),
        rows: vec![
            row("ROM folder", v("ROMDirectory", "ROMs"), &[root.join("roms")], "Set it to the roms folder in the vault", false),
            row("Media", v("MediaDirectory", "ES-DE/downloaded_media"), &[root.join("media")], "Set it to the vault, so ES-DE shows the covers you have", true),
        ],
    }
}

fn emus(root: &Path) -> Vec<Group> {
    let h = home();
    let ra_bios = crate::retroarch::ra_bios_dir(&root.to_string_lossy());
    let mut out = vec![];
    // DuckStation: [BIOS] SearchDirectory, relative to its data folder when not absolute
    let duck = [
        (h.join(".local/share/duckstation"), "DuckStation"),
        (h.join(".var/app/org.duckstation.DuckStation/data/duckstation"), "DuckStation (Flatpak)"),
        (root.join("Emulators/DuckStation/home/.local/share/duckstation"), "DuckStation (in the vault)"),
    ];
    for (d, name) in duck {
        let Ok(t) = std::fs::read_to_string(d.join("settings.ini")) else { continue };
        let v = ini_get(&t, "BIOS", "SearchDirectory").unwrap_or_else(|| "bios".into());
        let have = if Path::new(&v).is_absolute() || v.starts_with('~') { norm(&v, &h) } else { d.join(&v).to_string_lossy().to_string() };
        out.push(Group {
            id: "emu".into(),
            name: name.into(),
            file: d.join("settings.ini").to_string_lossy().into(),
            where_: "DuckStation › Settings › BIOS".into(),
            rows: vec![row("BIOS folder", have, &[root.join("bios/psx"), ra_bios.clone()], "Point it at bios/psx in the vault", false)],
        });
    }
    // PCSX2: [Folders] Bios, relative to its settings folder when not absolute
    let pcsx2 = [
        (h.join(".config/PCSX2"), "PCSX2"),
        (h.join(".var/app/net.pcsx2.PCSX2/config/PCSX2"), "PCSX2 (Flatpak)"),
        (root.join("Emulators/PCSX2/home/.config/PCSX2"), "PCSX2 (in the vault)"),
    ];
    for (d, name) in pcsx2 {
        let ini = d.join("inis/PCSX2.ini");
        let Ok(t) = std::fs::read_to_string(&ini) else { continue };
        let v = ini_get(&t, "Folders", "Bios").unwrap_or_else(|| "bios".into());
        let have = if Path::new(&v).is_absolute() || v.starts_with('~') { norm(&v, &h) } else { d.join(&v).to_string_lossy().to_string() };
        out.push(Group {
            id: "emu".into(),
            name: name.into(),
            file: ini.to_string_lossy().into(),
            where_: "PCSX2 › Settings › BIOS".into(),
            rows: vec![row("BIOS folder", have, &[root.join("bios/ps2"), ra_bios.join("pcsx2/bios")], "Point it at bios/ps2 in the vault", false)],
        });
    }
    out
}

/// Read RetroArch's, ES-DE's and the emulators' settings and compare them with the vault. Read only.
#[tauri::command]
pub fn setup_check(core: tauri::State<Core>) -> Check {
    let (root, ra_on, bios_ref) = {
        let c = core.cfg.lock().unwrap();
        (PathBuf::from(&c.root), c.ra_on, c.bios_ref.clone())
    };
    // the folders to point at exist, so you can pick them in RetroArch's file dialog
    for d in ["saves/retroarch", "saves/retroarch-states"] {
        let _ = std::fs::create_dir_all(root.join(d));
    }
    crate::retroarch::bios_links(&core);
    let mut groups = retroarch(&root, ra_on);
    groups.push(esde(&core, &root));
    groups.extend(emus(&root));
    Check { groups, ra_bios: crate::retroarch::ra_bios_dir(&root.to_string_lossy()).to_string_lossy().into(), ra_on, bios_ref }
}

/// Settings: start games from the vault (the old way) or not. Off also takes the vault's ES-DE rules out.
#[tauri::command]
pub fn ra_mode(core: tauri::State<Core>, on: bool) -> Result<bool, String> {
    {
        let mut c = core.cfg.lock().unwrap();
        c.ra_on = on;
        // Backups gets the RetroArch saves folder in the vault
        let p = Path::new(&c.root).join("saves/retroarch").to_string_lossy().to_string();
        if !on && !c.save_sources.iter().any(|s| s.path == p) {
            let _ = std::fs::create_dir_all(&p);
            c.save_sources.push(crate::extras::SaveSource { label: "RetroArch saves (in the vault)".into(), path: p });
        }
        crate::store::save_config(&c).map_err(|e| e.to_string())?;
    }
    crate::play::write_find_rules(&core);
    crate::retroarch::bios_links(&core);
    core.log(if on {
        "Games start from the vault again (RetroArch in the vault, Play buttons)".to_string()
    } else {
        "Games start in ES-DE or RetroArch; the vault keeps the files".to_string()
    });
    Ok(on)
}

#[cfg(test)]
mod tests {
    #[test]
    fn reads_settings() {
        let t = "system_directory = \"~/emu/RetroArch-BIOS\"\nsavefile_directory = \"default\"\n";
        assert_eq!(super::cfg_get(t, "system_directory").as_deref(), Some("~/emu/RetroArch-BIOS"));
        assert_eq!(super::cfg_get(t, "savefile_directory").as_deref(), Some("default"));
        let i = "[Main]\nx=1\n[BIOS]\nSearchDirectory = /m/bios/psx\n";
        assert_eq!(super::ini_get(i, "BIOS", "SearchDirectory").as_deref(), Some("/m/bios/psx"));
        assert!(super::ini_get(i, "Main", "SearchDirectory").is_none());
        let h = std::path::Path::new("/home/x");
        assert_eq!(super::norm("~/a/b/", h), "/home/x/a/b");
    }
}

/// The RetroArch the vault used to start games with (RetroArch/app/…, RetroArch/home/…): how big it is.
#[derive(Serialize)]
pub struct OldRa {
    there: bool,
    bytes: u64,
    saves: usize,
    path: String,
}

fn du(p: &Path, n: &mut usize, count: bool) -> u64 {
    let mut s = 0;
    for e in std::fs::read_dir(p).into_iter().flatten().flatten() {
        let q = e.path();
        if q.is_symlink() {
            continue;
        }
        if q.is_dir() {
            s += du(&q, n, count);
        } else if let Ok(m) = q.metadata() {
            s += m.len();
            if count {
                *n += 1;
            }
        }
    }
    s
}

#[tauri::command]
pub fn old_ra_info(core: tauri::State<Core>) -> OldRa {
    let (root, on) = {
        let c = core.cfg.lock().unwrap();
        (PathBuf::from(&c.root), c.ra_on)
    };
    let d = root.join("RetroArch");
    if on || !d.join("app").is_dir() {
        return OldRa { there: false, bytes: 0, saves: 0, path: d.to_string_lossy().into() };
    }
    let mut n = 0;
    let bytes = du(&d, &mut 0, false);
    let h = d.join("home/.config/retroarch");
    du(&h.join("saves"), &mut n, true);
    du(&h.join("states"), &mut n, true);
    OldRa { there: true, bytes, saves: n, path: d.to_string_lossy().into() }
}

fn copy_tree(from: &Path, to: &Path) -> usize {
    let mut n = 0;
    for e in std::fs::read_dir(from).into_iter().flatten().flatten() {
        let p = e.path();
        let d = to.join(e.file_name());
        if p.is_dir() {
            n += copy_tree(&p, &d);
        } else if !d.exists() {
            let _ = std::fs::create_dir_all(to);
            if std::fs::copy(&p, &d).is_ok() {
                n += 1;
            }
        }
    }
    n
}

/// Saves and states of the old vault RetroArch go to saves/retroarch(-states) (nothing there is overwritten),
/// then the old folder goes to the trash (or to _removed/ in the vault when there is no trash).
#[tauri::command]
pub fn old_ra_remove(core: tauri::State<Core>) -> Result<String, String> {
    let (root, on) = {
        let c = core.cfg.lock().unwrap();
        (PathBuf::from(&c.root), c.ra_on)
    };
    if on {
        return Err("Games still start from the vault (Setup check, at the bottom). Turn that off first.".into());
    }
    let d = root.join("RetroArch");
    if !d.join("app").is_dir() {
        return Err("The old RetroArch isn't there.".into());
    }
    let h = d.join("home/.config/retroarch");
    let n = copy_tree(&h.join("saves"), &root.join("saves/retroarch")) + copy_tree(&h.join("states"), &root.join("saves/retroarch-states"));
    let trashed = std::process::Command::new("gio").arg("trash").arg(&d).status().map(|s| s.success()).unwrap_or(false);
    let msg = if trashed {
        format!("{n} saves kept in saves/retroarch; the old RetroArch folder is in the trash")
    } else {
        let to = root.join("_removed").join(format!("RetroArch-{}", chrono::Local::now().format("%Y%m%d-%H%M")));
        std::fs::create_dir_all(to.parent().unwrap()).map_err(|e| e.to_string())?;
        std::fs::rename(&d, &to).map_err(|e| e.to_string())?;
        format!("{n} saves kept in saves/retroarch; the old RetroArch folder is in {} (delete it when you like)", to.display())
    };
    core.log(format!("Old RetroArch: {msg}"));
    Ok(msg)
}
