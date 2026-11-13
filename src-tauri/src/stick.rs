//! 0.16.4: Emu Vault on a USB stick, the Windows .exe and the Linux .sh side by side.
//! Take it out: remove this file, its `mod stick;` in lib.rs and the crate::stick lines in store.rs and gog.rs.

use crate::store::{app_dir, home_dir, write_json};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

// ---- 0.16.4: Emu Vault on a stick
// A folder `emu-vault-data` next to the program holds the settings, for the Windows .exe and the Linux .sh alike.
// The .exe makes it; the .sh uses it when it's there. Folders differ per computer (the stick is E:\ on Windows and
// /media/… on Linux, the ROMs may be on another drive), so those are kept per computer in places.json.
pub const DATA_DIR: &str = "emu-vault-data";

/// The program's own folder: next to the .exe on Windows, next to the .sh on Linux (the .sh passes EMU_VAULT_SH).
fn program_dir() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        std::env::current_exe().ok().and_then(|e| e.parent().map(Path::to_path_buf))
    }
    #[cfg(not(windows))]
    {
        let sh = PathBuf::from(std::env::var_os("EMU_VAULT_SH")?);
        sh.is_file().then(|| sh.parent().map(Path::to_path_buf)).flatten()
    }
}
pub fn portable_dir() -> Option<PathBuf> {
    static P: std::sync::OnceLock<Option<PathBuf>> = std::sync::OnceLock::new();
    P.get_or_init(|| {
        let d = program_dir()?.join(DATA_DIR);
        if d.is_dir() {
            return Some(d);
        }
        if !cfg!(windows) {
            return None;
        }
        // the portable .exe makes it; settings already on this PC come along the first time
        std::fs::create_dir_all(&d).ok()?;
        let probe = d.join(".write-test");
        if std::fs::write(&probe, b"").is_err() {
            let _ = std::fs::remove_dir(&d);
            return None;
        }
        let _ = std::fs::remove_file(&probe);
        if let Ok(rd) = std::fs::read_dir(home_dir()) {
            for e in rd.flatten() {
                let n = e.file_name().to_string_lossy().to_string();
                if n.ends_with(".json") && e.path().is_file() {
                    let _ = std::fs::copy(e.path(), d.join(&n));
                }
            }
        }
        Some(d)
    })
    .clone()
}
pub fn is_portable() -> bool {
    std::env::var_os("EMUVAULT_HOME").is_none() && portable_dir().is_some()
}

/// This computer, as the stick knows it: system and name ("windows:GAMEPC", "linux:vhalron-pc").
pub fn pc_key() -> String {
    let name = std::env::var("COMPUTERNAME")
        .ok()
        .or_else(|| std::fs::read_to_string("/proc/sys/kernel/hostname").ok())
        .or_else(|| std::fs::read_to_string("/etc/hostname").ok())
        .or_else(|| std::env::var("HOSTNAME").ok())
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| "this-pc".into());
    format!("{}:{}", std::env::consts::OS, name)
}

/// The settings that are folders on this computer, per file.
pub const CONFIG_HERE: &[&str] = &["root", "bios_ref", "extra_dirs", "emu_paths", "save_sources"];
pub const GOG_HERE: &[&str] = &["dir", "gd_db"];

type Places = serde_json::Map<String, serde_json::Value>;
pub(crate) fn places_file() -> PathBuf {
    app_dir().join("places.json")
}
fn read_places() -> Places {
    std::fs::read_to_string(places_file()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}

/// On reading `file` (config.json, gog.json) from the stick: this computer's folders go in.
/// A computer the stick doesn't know yet starts with the folders of an Emu Vault already on it
/// (~/.config/emu-vault), or else as a new install; the first computer keeps what the file has.
pub fn here_in<T: Serialize + for<'a> Deserialize<'a>>(file: &str, fields: &[&str], v: T) -> T {
    if !is_portable() {
        return v;
    }
    let mut j = match serde_json::to_value(&v) {
        Ok(serde_json::Value::Object(m)) => m,
        _ => return v,
    };
    let pl = read_places();
    let mine = pl.get(&pc_key()).and_then(|p| p.get(file)).and_then(|f| f.as_object()).cloned();
    let from = match mine {
        Some(m) => Some(m),
        None if pl.is_empty() => return v,
        None => std::fs::read_to_string(home_dir().join(file))
            .ok()
            .and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok())
            .and_then(|x| x.as_object().cloned()),
    };
    for f in fields {
        match from.as_ref().and_then(|m| m.get(*f)) {
            Some(x) => {
                j.insert((*f).to_string(), x.clone());
            }
            None => {
                j.remove(*f);
            }
        }
    }
    serde_json::from_value(serde_json::Value::Object(j)).unwrap_or(v)
}
/// On saving `file` to the stick: this computer's folders are remembered for this computer.
pub fn here_out<T: Serialize>(file: &str, fields: &[&str], v: &T) {
    if !is_portable() {
        return;
    }
    let Ok(serde_json::Value::Object(j)) = serde_json::to_value(v) else { return };
    let mut pl = read_places();
    let key = pc_key();
    let mut pc = pl.get(&key).and_then(|p| p.as_object()).cloned().unwrap_or_default();
    let mut m = Places::new();
    for f in fields {
        if let Some(x) = j.get(*f) {
            m.insert((*f).to_string(), x.clone());
        }
    }
    pc.insert(file.to_string(), serde_json::Value::Object(m));
    pl.insert(key, serde_json::Value::Object(pc));
    let _ = write_json(&places_file(), &pl);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::{load_config, save_config, write_json, Config};
    /// Run on its own (the stick folder is looked up once per run): cargo test stick_places -- --ignored
    #[test]
    #[ignore]
    fn stick_places() {
        let t = std::env::temp_dir().join(format!("evstick-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&t);
        let stick = t.join("STICK");
        std::fs::create_dir_all(stick.join(DATA_DIR)).unwrap();
        let sh = stick.join("emu-vault-0.16.4.sh");
        std::fs::write(&sh, "x").unwrap();
        // the home PC already had Emu Vault with its own folders
        std::env::set_var("XDG_CONFIG_HOME", t.join("home-config"));
        let mut home = Config::default();
        home.root = "/home/me/emu@vault".into();
        home.skin = "retro".into();
        write_json(&t.join("home-config/emu-vault/config.json"), &home).unwrap();
        std::env::remove_var("EMUVAULT_HOME");
        std::env::set_var("EMU_VAULT_SH", &sh);
        assert!(is_portable());
        assert_eq!(app_dir(), stick.join(DATA_DIR));
        // as if Windows used the stick first
        let mut win = Config::default();
        win.root = "D:/ROMs/emu@vault".into();
        win.skin = "amber".into();
        write_json(&app_dir().join("config.json"), &win).unwrap();
        let mut pl = Places::new();
        pl.insert("windows:GAMEPC".into(), serde_json::json!({"config.json": {"root": "D:/ROMs/emu@vault"}}));
        write_json(&places_file(), &pl).unwrap();
        // this (Linux) PC: new to the stick -> its own folder from ~/.config, the shared look from the stick
        let c = load_config();
        assert_eq!(c.root, "/home/me/emu@vault");
        assert_eq!(c.skin, "amber");
        // you pick another folder here: remembered for this PC only
        let mut c2 = c.clone();
        c2.root = "/media/me/ROMS/emu@vault".into();
        save_config(&c2).unwrap();
        let pl = read_places();
        assert_eq!(pl["windows:GAMEPC"]["config.json"]["root"], "D:/ROMs/emu@vault");
        assert_eq!(pl[&pc_key()]["config.json"]["root"], "/media/me/ROMS/emu@vault");
        assert_eq!(load_config().root, "/media/me/ROMS/emu@vault");
        // GOG: no folder known for this PC -> the default (<main folder>/GOG)
        let g: serde_json::Value = here_in("gog.json", GOG_HERE, serde_json::json!({"dir": "D:/GOG", "user": "dave"}));
        assert_eq!(g, serde_json::json!({"user": "dave"}));
        let _ = std::fs::remove_dir_all(&t);
    }
}
