//! ES-DE with everything set up: Emu Vault downloads and updates it (the "ES-DE (PC)" app), points it at
//! <main folder>/roms and <main folder>/media, writes its game lists, and starts it.

use crate::{store, Core};
use serde::Serialize;
use std::path::{Path, PathBuf};

/// ES-DE's own folder: <main folder>/ES-DE when it lives in the vault, else ~/ES-DE on this computer.
pub fn esde_dir(core: &Core) -> PathBuf {
    let c = core.cfg.lock().unwrap();
    if c.esde_vault {
        Path::new(&c.root).join("ES-DE")
    } else {
        dirs::home_dir().unwrap_or_default().join("ES-DE")
    }
}

pub fn settings_file_for(core: &Core) -> PathBuf {
    if core.cfg.lock().unwrap().esde_vault {
        return esde_dir(core).join("settings/es_settings.xml");
    }
    settings_file()
}

fn settings_file() -> PathBuf {
    let h = dirs::home_dir().unwrap_or_default();
    let old = h.join(".emulationstation/es_settings.xml");
    if old.is_file() && !h.join("ES-DE").is_dir() {
        return old;
    }
    h.join("ES-DE/settings/es_settings.xml")
}

pub fn setting(t: &str, name: &str) -> String {
    let re = regex::Regex::new(&format!(r#"<string name="{name}" value="([^"]*)""#)).unwrap();
    re.captures(t).map(|c| c[1].replace("&amp;", "&").replace("&quot;", "\"")).unwrap_or_default()
}

fn which(prog: &str) -> Option<PathBuf> {
    std::env::var("PATH").unwrap_or_default().split(':').chain(["/usr/bin", "/usr/local/bin"]).map(|d| Path::new(d).join(prog)).find(|p| p.is_file())
}

/// How ES-DE can be started on this computer: the AppImage Emu Vault downloaded, a Flatpak, or an installed one.
fn launcher(core: &Core) -> Option<(String, Vec<String>, String)> {
    let ov = crate::overview_pub(core);
    if let Some(p) = ov.esde_appimage {
        return Some((p.clone(), vec![], "downloaded by Emu Vault".into()));
    }
    if let Some(fp) = which("flatpak") {
        let ok = crate::desktop_cmd(&fp.to_string_lossy()).args(["info", "org.es_de.frontend"]).output().map(|o| o.status.success()).unwrap_or(false);
        if ok {
            return Some((fp.to_string_lossy().into(), vec!["run".into(), "org.es_de.frontend".into()], "Flatpak".into()));
        }
    }
    for n in ["es-de", "ES-DE", "emulationstation"] {
        if let Some(p) = which(n) {
            return Some((p.to_string_lossy().into(), vec![], "installed".into()));
        }
    }
    let apps = dirs::home_dir().unwrap_or_default().join("Applications");
    if let Ok(rd) = std::fs::read_dir(&apps) {
        for e in rd.flatten() {
            let n = e.file_name().to_string_lossy().to_lowercase();
            if (n.starts_with("es-de") || n.starts_with("emulationstation")) && n.ends_with(".appimage") {
                return Some((e.path().to_string_lossy().into(), vec![], "in ~/Applications".into()));
            }
        }
    }
    None
}

#[derive(Serialize)]
pub struct EsdeStatus {
    /// "" when ES-DE isn't on this computer
    how: String,
    path: String,
    version: String,
    settings: bool,
    rom_dir: String,
    media_dir: String,
    /// ES-DE uses <main folder>/roms and <main folder>/media
    roms_ok: bool,
    media_ok: bool,
    gamelists: usize,
    running: bool,
    /// newer version available ("" = none known)
    update: String,
    /// downloaded by Emu Vault (so Emu Vault can update it)
    managed: bool,
    /// ES-DE's settings and game lists are in the vault
    in_vault: bool,
    esde_dir: String,
    /// there is an ES-DE folder on this computer that isn't in the vault yet
    pc_data: bool,
}

fn same(a: &str, b: &Path) -> bool {
    let a = a.replace('~', &dirs::home_dir().unwrap_or_default().to_string_lossy());
    let pa = Path::new(&a);
    match (pa.canonicalize(), b.canonicalize()) {
        (Ok(x), Ok(y)) => x == y,
        _ => pa == b,
    }
}

fn running() -> bool {
    std::fs::read_dir("/proc").into_iter().flatten().flatten().any(|e| {
        std::fs::read_to_string(e.path().join("comm"))
            .map(|c| {
                let c = c.trim().to_lowercase();
                c == "es-de" || c.starts_with("es-de") || c == "emulationstatio"
            })
            .unwrap_or(false)
    })
}

#[tauri::command]
pub fn esde_status(core: tauri::State<Core>) -> EsdeStatus {
    let root = core.cfg.lock().unwrap().root.clone();
    let t = std::fs::read_to_string(settings_file_for(&core)).unwrap_or_default();
    let (rom_dir, media_dir) = (setting(&t, "ROMDirectory"), setting(&t, "MediaDirectory"));
    let l = launcher(&core);
    let ov = crate::overview_pub(&core);
    let ed = esde_dir(&core);
    let gl = ed.join("gamelists");
    let in_vault = core.cfg.lock().unwrap().esde_vault;
    let pc = dirs::home_dir().unwrap_or_default().join("ES-DE");
    EsdeStatus {
        how: l.as_ref().map(|x| x.2.clone()).unwrap_or_default(),
        path: l.as_ref().map(|x| x.0.clone()).unwrap_or_default(),
        version: ov.esde_version,
        settings: !t.is_empty(),
        roms_ok: !rom_dir.is_empty() && same(&rom_dir, &Path::new(&root).join("roms")),
        media_ok: !media_dir.is_empty() && same(&media_dir, &Path::new(&root).join("media")),
        rom_dir,
        media_dir,
        gamelists: std::fs::read_dir(&gl).map(|r| r.flatten().filter(|e| e.path().join("gamelist.xml").is_file()).count()).unwrap_or(0),
        running: running(),
        update: ov.esde_update.clone(),
        managed: ov.esde_appimage.is_some(),
        in_vault,
        esde_dir: ed.to_string_lossy().into(),
        pc_data: in_vault && pc.join("settings").is_dir() && !ed.join("settings").is_dir(),
    }
}

fn copy_tree(from: &Path, to: &Path, skip: &[&str]) -> std::io::Result<usize> {
    let mut n = 0;
    std::fs::create_dir_all(to)?;
    for e in std::fs::read_dir(from)?.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if skip.contains(&name.as_str()) {
            continue;
        }
        let (s, d) = (e.path(), to.join(&name));
        if s.is_dir() {
            n += copy_tree(&s, &d, &[])?;
        } else if !d.exists() {
            std::fs::copy(&s, &d)?;
            n += 1;
        }
    }
    Ok(n)
}

/// Older versions wrote ES-DE lists to <main folder>/frontends/ when ES-DE wasn't found. Those lists go to
/// ES-DE's own folder now, and the frontends folder goes to _duplicates (nothing is lost).
pub fn tidy_frontends(core: &Core) {
    let root = core.cfg.lock().unwrap().root.clone();
    let fe = Path::new(&root).join("frontends");
    if !fe.is_dir() {
        return;
    }
    let old = fe.join("ES-DE/gamelists");
    let new = esde_dir(core).join("gamelists");
    if let Ok(rd) = std::fs::read_dir(&old) {
        for e in rd.flatten() {
            let d = new.join(e.file_name());
            if !d.join("gamelist.xml").exists() && e.path().join("gamelist.xml").is_file() {
                let _ = std::fs::create_dir_all(&d);
                let _ = std::fs::copy(e.path().join("gamelist.xml"), d.join("gamelist.xml"));
            }
        }
    }
    let to = Path::new(&root).join("_duplicates/frontends").join(chrono::Local::now().format("%Y-%m-%d_%H-%M").to_string());
    let _ = std::fs::create_dir_all(to.parent().unwrap());
    if std::fs::rename(&fe, &to).is_ok() {
        core.log(format!("The old frontends/ folder moved to {} (ES-DE's lists are in {} now)", to.display(), new.display()));
    }
}

/// Settings and game lists in the vault, or on this computer.
#[tauri::command]
pub fn esde_where(core: tauri::State<Core>, vault: bool) -> Result<(), String> {
    let mut c = core.cfg.lock().unwrap();
    c.esde_vault = vault;
    store::save_config(&c)?;
    drop(c);
    core.log(if vault { "ES-DE: settings and game lists in the vault" } else { "ES-DE: settings and game lists on this computer (~/ES-DE)" });
    Ok(())
}

fn put(t: &str, name: &str, value: &str) -> String {
    let line = format!("<string name=\"{name}\" value=\"{}\" />", value.replace('&', "&amp;").replace('"', "&quot;"));
    let re = regex::Regex::new(&format!(r#"<string name="{name}" value="[^"]*"\s*/>"#)).unwrap();
    if re.is_match(t) {
        re.replace(t, line.as_str()).to_string()
    } else if let Some(i) = t.rfind("</config>") {
        format!("{}{}\n{}", &t[..i], line, &t[i..])
    } else if t.trim().is_empty() {
        format!("<?xml version=\"1.0\"?>\n{line}\n")
    } else {
        format!("{}\n{line}\n", t.trim_end())
    }
}

/// Point ES-DE at the main folder (ROMs and media), and write its game lists.
#[tauri::command]
pub async fn esde_setup(core: tauri::State<'_, Core>) -> Result<String, String> {
    if running() {
        return Err("Close ES-DE first: it saves its settings when it closes and would undo this.".into());
    }
    let root = core.cfg.lock().unwrap().root.clone();
    let roms = Path::new(&root).join("roms");
    let media = Path::new(&root).join("media");
    std::fs::create_dir_all(&media).map_err(|e| e.to_string())?;
    tidy_frontends(&core);
    let ed = esde_dir(&core);
    let in_vault = core.cfg.lock().unwrap().esde_vault;
    let pc = dirs::home_dir().unwrap_or_default().join("ES-DE");
    if in_vault && pc.join("settings").is_dir() && !ed.join("settings").is_dir() {
        // what ES-DE already knows on this computer comes along (a copy: ~/ES-DE stays as it is)
        let n = copy_tree(&pc, &ed, &["downloaded_media", "logs"]).map_err(|e| e.to_string())?;
        core.log(format!("ES-DE: {n} files copied from ~/ES-DE to {}", ed.display()));
    }
    let p = settings_file_for(&core);
    std::fs::create_dir_all(p.parent().unwrap()).map_err(|e| e.to_string())?;
    let old = std::fs::read_to_string(&p).unwrap_or_default();
    if !old.is_empty() {
        let b = p.with_extension("xml.emuvault-backup");
        if !b.exists() {
            let _ = std::fs::copy(&p, &b);
        }
    }
    let mut t = put(&old, "ROMDirectory", &roms.to_string_lossy());
    t = put(&t, "MediaDirectory", &media.to_string_lossy());
    std::fs::write(&p, t).map_err(|e| e.to_string())?;
    // ES-DE's own gamelists folder, so the lists land where ES-DE reads them
    let _ = std::fs::create_dir_all(ed.join("gamelists"));
    let w = crate::frontends::write_esde_lists(&core)?;
    core.log(format!("ES-DE set up: ROMs in {}, media in {}, game lists for {} systems", roms.display(), media.display(), w));
    Ok(roms.to_string_lossy().into())
}

#[tauri::command]
pub fn esde_start(core: tauri::State<Core>) -> Result<(), String> {
    crate::linux_only("Starting ES-DE")?;
    let (prog, mut args, _) = launcher(&core).ok_or("ES-DE isn't on this computer yet. Press \"Download ES-DE\" first.")?;
    let (root, in_vault) = {
        let c = core.cfg.lock().unwrap();
        (c.root.clone(), c.esde_vault)
    };
    if in_vault {
        // the vault can be on a drive that has another path on another computer: put the folders right first
        let p = settings_file_for(&core);
        if let Ok(t) = std::fs::read_to_string(&p) {
            let mut nt = put(&t, "ROMDirectory", &Path::new(&root).join("roms").to_string_lossy());
            nt = put(&nt, "MediaDirectory", &Path::new(&root).join("media").to_string_lossy());
            if nt != t {
                let _ = std::fs::write(&p, nt);
            }
        }
        crate::play::refresh(&core);
        args.push("--home".into());
        args.push(root.clone());
    }
    #[cfg(unix)]
    if prog.to_lowercase().ends_with(".appimage") {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(m) = std::fs::metadata(&prog) {
            let mut perm = m.permissions();
            if perm.mode() & 0o111 == 0 {
                perm.set_mode(perm.mode() | 0o755);
                let _ = std::fs::set_permissions(&prog, perm);
            }
        }
    }
    let mut cmd = crate::desktop_cmd(&prog);
    // AppImages need FUSE 2; without it they can still run by unpacking themselves first
    let fuse2 = ["/usr/lib/x86_64-linux-gnu/libfuse.so.2", "/lib/x86_64-linux-gnu/libfuse.so.2", "/usr/lib/libfuse.so.2", "/usr/lib64/libfuse.so.2"]
        .iter()
        .any(|p| Path::new(p).exists());
    if prog.to_lowercase().ends_with(".appimage") && !fuse2 {
        cmd.env("APPIMAGE_EXTRACT_AND_RUN", "1");
    }
    let child = cmd
        .args(&args)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("ES-DE didn't start: {e}"))?;
    std::thread::spawn(move || {
        let mut c = child;
        let _ = c.wait();
    });
    core.log("ES-DE started");
    let _ = store::now();
    Ok(())
}
