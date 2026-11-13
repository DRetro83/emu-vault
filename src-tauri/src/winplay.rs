//! 0.16.5: playing on Windows: RetroArch, its cores, ES-DE and the Play button.
//!
//! On Linux everything runs as AppImages with a start script. On Windows:
//!   <main folder>/RetroArch/windows/          RetroArch for Windows, portable: retroarch.exe with its settings,
//!                                             cores (.dll), saves, states and system (BIOS) folder next to it.
//!                                             Paths in its retroarch.cfg start with ":\", so they follow the drive
//!                                             letter (a stick is E:\ on one PC and F:\ on another).
//!   <main folder>/Launchers/RetroArch/        RetroArch on its own (Home), the same kind of folder.
//!   Apps/ES-DE (PC)/…/ES-DE_x.y-x64_Portable.zip  the download; unpacked next to it once, then started with
//!                                             --home, so its settings live where they do on Linux.
//! The Linux folders (RetroArch/app, RetroArch/home) are left alone, so one vault works on both systems.
//! Take it out: remove this file, `mod winplay;` in lib.rs and the `crate::winplay` lines in retroarch.rs,
//! esde.rs, play.rs and lib.rs.

use std::path::{Path, PathBuf};

/// RetroArch's folder for Windows inside the vault's RetroArch folder.
pub fn ra_dir(base: &Path) -> PathBuf {
    base.join("windows")
}

/// retroarch.exe somewhere in a RetroArch folder.
pub fn ra_exe(dir: &Path) -> PathBuf {
    dir.join("retroarch.exe")
}

/// A core file name: mgba_libretro.dll on Windows, mgba_libretro.so on Linux.
pub fn core_file(core: &str) -> String {
    format!("{core}_libretro.{}", if cfg!(windows) { "dll" } else { "so" })
}

/// libretro's folder for this system on its buildbot.
pub fn bb_os() -> &'static str {
    if cfg!(windows) {
        "windows"
    } else {
        "linux"
    }
}

/// The folder in an unpacked download that holds `file` (RetroArch.7z has RetroArch-Win64/retroarch.exe).
pub fn folder_with(d: &Path, file: &str) -> Option<PathBuf> {
    let mut stack = vec![d.to_path_buf()];
    while let Some(x) = stack.pop() {
        for e in std::fs::read_dir(&x).into_iter().flatten().flatten() {
            let p = e.path();
            if p.is_dir() {
                stack.push(p);
            } else if e.file_name().to_string_lossy().eq_ignore_ascii_case(file) {
                return Some(x);
            }
        }
    }
    None
}

/// Put a new RetroArch (or ES-DE) over the one that's there: program files are replaced, your settings
/// (retroarch.cfg and the like) and your own folders (saves, states, system, cores, playlists…) stay.
pub fn merge_program(from: &Path, to: &Path) -> std::io::Result<usize> {
    const KEEP: &[&str] = &["retroarch.cfg", "retroarch-core-options.cfg", "portable.txt"];
    let mut n = 0;
    std::fs::create_dir_all(to)?;
    for e in std::fs::read_dir(from)?.flatten() {
        let name = e.file_name();
        let low = name.to_string_lossy().to_lowercase();
        let (s, d) = (e.path(), to.join(&name));
        if s.is_dir() {
            n += merge_program(&s, &d)?;
        } else if KEEP.contains(&low.as_str()) && d.exists() {
            continue;
        } else {
            if d.exists() {
                let _ = std::fs::remove_file(&d);
            }
            if std::fs::rename(&s, &d).is_err() {
                std::fs::copy(&s, &d)?;
            }
            n += 1;
        }
    }
    Ok(n)
}

/// RetroArch's settings for a portable folder: everything next to retroarch.exe (":\" = that folder).
pub fn ra_cfg_lines() -> Vec<(&'static str, &'static str)> {
    vec![
        ("libretro_directory", ":\\cores"),
        ("libretro_info_path", ":\\info"),
        ("savefile_directory", ":\\saves"),
        ("savestate_directory", ":\\states"),
        ("system_directory", ":\\system"),
        ("screenshot_directory", ":\\screenshots"),
        ("playlist_directory", ":\\playlists"),
        ("thumbnails_directory", ":\\thumbnails"),
        ("core_updater_buildbot_cores_url", "http://buildbot.libretro.com/nightly/windows/x86_64/latest/"),
    ]
}

// ---------------------------------------------------------------- ES-DE

/// ES-DE's portable zip, unpacked next to itself (once): the folder with ES-DE.exe.
pub fn esde_exe(zip: &str) -> Result<PathBuf, String> {
    let z = Path::new(zip);
    if z.extension().map(|e| e.eq_ignore_ascii_case("exe")).unwrap_or(false) {
        return Err("Emu Vault downloaded ES-DE's installer. Press \"Check for ES-DE\" again: it gets the portable version now.".into());
    }
    let stem = z.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| "ES-DE".into());
    let dir = z.with_file_name(&stem);
    if let Some(d) = folder_with(&dir, "ES-DE.exe") {
        return Ok(d.join("ES-DE.exe"));
    }
    let tmp = z.with_file_name(format!("{stem}.unpacking"));
    let _ = std::fs::remove_dir_all(&tmp);
    let f = std::fs::File::open(z).map_err(|e| format!("ES-DE's download isn't there: {e}"))?;
    let mut a = zip::ZipArchive::new(f).map_err(|e| format!("ES-DE's download isn't a good zip: {e}"))?;
    a.extract(&tmp).map_err(|e| format!("Unpacking ES-DE didn't work: {e}"))?;
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::rename(&tmp, &dir).map_err(|e| e.to_string())?;
    let d = folder_with(&dir, "ES-DE.exe").ok_or("There was no ES-DE.exe in ES-DE's download.")?;
    // without portable.txt ES-DE goes by --home, like on Linux (Emu Vault always gives it)
    let _ = std::fs::remove_file(d.join("portable.txt"));
    Ok(d.join("ES-DE.exe"))
}

/// ES-DE's list of systems and emulators for Windows, from its folder.
pub fn esde_systems_xml(exe: &Path) -> Option<String> {
    let d = exe.parent()?;
    for p in ["resources/systems/windows/es_systems.xml", "resources\\systems\\windows\\es_systems.xml"] {
        if let Ok(t) = std::fs::read_to_string(d.join(p)) {
            return Some(t);
        }
    }
    let f = folder_with(&d.join("resources"), "es_systems.xml")?;
    std::fs::read_to_string(f.join("es_systems.xml")).ok()
}

/// Is a program running (by its .exe name)? Asks Windows' tasklist, without a console window.
pub fn running(exe: &str) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let out = std::process::Command::new("tasklist")
            .args(["/FI", &format!("IMAGENAME eq {exe}"), "/NH", "/FO", "CSV"])
            .creation_flags(0x0800_0000)
            .output();
        return out.map(|o| String::from_utf8_lossy(&o.stdout).to_lowercase().contains(&exe.to_lowercase())).unwrap_or(false);
    }
    #[allow(unreachable_code)]
    {
        let _ = exe;
        false
    }
}

/// Start a Windows program in its own folder, without a console window, and let it go.
pub fn spawn(prog: &Path, args: &[String], stderr: bool) -> std::io::Result<std::process::Child> {
    let mut c = std::process::Command::new(prog);
    if let Some(d) = prog.parent() {
        c.current_dir(d);
    }
    c.args(args).stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null());
    c.stderr(if stderr { std::process::Stdio::piped() } else { std::process::Stdio::null() });
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        c.creation_flags(0x0800_0000);
    }
    c.spawn()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn merge_keeps_settings() {
        let t = std::env::temp_dir().join(format!("evwin-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&t);
        let (from, to) = (t.join("new/RetroArch-Win64"), t.join("ra"));
        std::fs::create_dir_all(from.join("assets")).unwrap();
        std::fs::create_dir_all(to.join("saves")).unwrap();
        std::fs::write(from.join("retroarch.exe"), "new").unwrap();
        std::fs::write(from.join("retroarch.cfg"), "default").unwrap();
        std::fs::write(from.join("assets/a.png"), "a").unwrap();
        std::fs::write(to.join("retroarch.exe"), "old").unwrap();
        std::fs::write(to.join("retroarch.cfg"), "mine").unwrap();
        std::fs::write(to.join("saves/game.srm"), "save").unwrap();
        assert_eq!(folder_with(&t.join("new"), "RetroArch.exe"), Some(from.clone()));
        merge_program(&from, &to).unwrap();
        assert_eq!(std::fs::read_to_string(to.join("retroarch.exe")).unwrap(), "new");
        assert_eq!(std::fs::read_to_string(to.join("retroarch.cfg")).unwrap(), "mine");
        assert_eq!(std::fs::read_to_string(to.join("saves/game.srm")).unwrap(), "save");
        assert!(to.join("assets/a.png").is_file());
        let _ = std::fs::remove_dir_all(&t);
    }
    #[test]
    fn esde_zip_unpacks_once() {
        use std::io::Write;
        let t = std::env::temp_dir().join(format!("evesde-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&t);
        std::fs::create_dir_all(&t).unwrap();
        let z = t.join("ES-DE_3.3.0-x64_Portable.zip");
        {
            let mut w = zip::ZipWriter::new(std::fs::File::create(&z).unwrap());
            let o = zip::write::SimpleFileOptions::default();
            for (n, body) in [
                ("ES-DE/ES-DE.exe", "exe"),
                ("ES-DE/portable.txt", ""),
                ("ES-DE/resources/systems/windows/es_systems.xml", "<systemList/>"),
            ] {
                w.start_file(n, o).unwrap();
                w.write_all(body.as_bytes()).unwrap();
            }
            w.finish().unwrap();
        }
        let exe = esde_exe(&z.to_string_lossy()).unwrap();
        assert!(exe.is_file() && exe.ends_with("ES-DE/ES-DE.exe"));
        assert!(!exe.with_file_name("portable.txt").exists());
        assert_eq!(esde_systems_xml(&exe).as_deref(), Some("<systemList/>"));
        assert_eq!(esde_exe(&z.to_string_lossy()).unwrap(), exe);
        let _ = std::fs::remove_dir_all(&t);
    }
}
