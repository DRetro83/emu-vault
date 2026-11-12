//! Checks while Emu Vault is closed: a systemd user timer starts `emu-vault --background` every few hours.
//! It looks for app updates, new files in the inbox, saves that are due for a backup and covers for new games,
//! and says what it found in one desktop notification. When the Emu Vault window is open it does nothing:
//! the window does all of this itself.

use crate::{store, Core};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

const UNIT: &str = "emu-vault-check";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct BgState {
    pub last_run: String,
    pub last_text: String,
    pub inbox_seen: usize,
    pub updates_seen: Vec<String>,
    /// covers that weren't found, not asked again
    pub covers_nf: Vec<String>,
}

fn state_path() -> PathBuf {
    store::app_dir().join("background.json")
}
pub fn load_state() -> BgState {
    std::fs::read_to_string(state_path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
fn save_state(s: &BgState) {
    let _ = store::write_json(&state_path(), s);
}

// ------------------------------------------------------------------ the window is open: don't run

fn lock_path() -> PathBuf {
    store::app_dir().join("window.pid")
}
/// The window writes its process id here when it starts.
pub fn mark_window_open() {
    let _ = std::fs::create_dir_all(store::app_dir());
    let _ = std::fs::write(lock_path(), std::process::id().to_string());
}
fn window_open() -> bool {
    std::fs::read_to_string(lock_path())
        .ok()
        .and_then(|t| t.trim().parse::<u32>().ok())
        .map(|pid| {
            pid != std::process::id()
                && Path::new(&format!("/proc/{pid}")).exists()
                && std::fs::read_to_string(format!("/proc/{pid}/cmdline")).map(|c| c.contains("emu-vault") && !c.contains("--background")).unwrap_or(false)
        })
        .unwrap_or(false)
}

// ------------------------------------------------------------------ the timer

fn unit_dir() -> PathBuf {
    dirs::config_dir().unwrap_or_default().join("systemd/user")
}

/// What starts Emu Vault: the AppImage/.sh launcher when there is one, else the program itself.
fn launcher() -> String {
    if let Ok(d) = std::env::var("APPDIR") {
        let a = Path::new(&d).join("AppRun");
        if a.is_file() {
            return a.to_string_lossy().into();
        }
    }
    std::env::current_exe().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|_| "emu-vault".into())
}

fn systemctl(args: &[&str]) -> bool {
    crate::desktop_cmd("systemctl").arg("--user").args(args).status().map(|s| s.success()).unwrap_or(false)
}

/// Write (or remove) the timer, so it matches the settings. Also called when the window starts, so a new
/// version (the .sh unpacks to a new folder) is the one that runs.
pub fn apply(cfg: &store::BgCfg) -> Result<(), String> {
    if cfg.on {
        crate::linux_only("Checking while Emu Vault is closed")?;
    }
    let d = unit_dir();
    let svc = d.join(format!("{UNIT}.service"));
    let tim = d.join(format!("{UNIT}.timer"));
    if !cfg.on {
        if tim.exists() {
            systemctl(&["disable", "--now", &format!("{UNIT}.timer")]);
        }
        let _ = std::fs::remove_file(&svc);
        let _ = std::fs::remove_file(&tim);
        systemctl(&["daemon-reload"]);
        return Ok(());
    }
    std::fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    let exe = launcher();
    let home = std::env::var("EMUVAULT_HOME").map(|h| format!("Environment=EMUVAULT_HOME={h}\n")).unwrap_or_default();
    let s = format!("[Unit]\nDescription=Emu Vault: check for updates, new files, saves and covers\n\n[Service]\nType=oneshot\n{home}ExecStart=\"{exe}\" --background\nNice=10\nIOSchedulingClass=idle\n");
    let h = cfg.hours.clamp(1, 24);
    let t = format!("[Unit]\nDescription=Emu Vault checks every {h} hours\n\n[Timer]\nOnBootSec=10min\nOnUnitActiveSec={h}h\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n");
    let old = (std::fs::read_to_string(&svc).unwrap_or_default(), std::fs::read_to_string(&tim).unwrap_or_default());
    if old.0 != s || old.1 != t {
        std::fs::write(&svc, s).map_err(|e| e.to_string())?;
        std::fs::write(&tim, t).map_err(|e| e.to_string())?;
        systemctl(&["daemon-reload"]);
    }
    if !systemctl(&["enable", "--now", &format!("{UNIT}.timer")]) {
        return Err("systemd couldn't start the timer. Is this a desktop with systemd (most Linux desktops are)?".into());
    }
    Ok(())
}

#[derive(Serialize)]
pub struct BgStatus {
    cfg: store::BgCfg,
    last_run: String,
    last_text: String,
    systemd: bool,
    active: bool,
}

#[tauri::command]
pub fn bg_status(core: tauri::State<Core>) -> BgStatus {
    let cfg = core.cfg.lock().unwrap().bg.clone();
    let st = load_state();
    BgStatus {
        cfg,
        last_run: st.last_run,
        last_text: st.last_text,
        systemd: Path::new("/run/systemd/system").exists(),
        active: crate::desktop_cmd("systemctl")
            .args(["--user", "is-active", "--quiet", &format!("{UNIT}.timer")])
            .status()
            .map(|s| s.success())
            .unwrap_or(false),
    }
}

#[tauri::command]
pub fn bg_set(core: tauri::State<Core>, bg: store::BgCfg) -> Result<BgStatus, String> {
    {
        let mut c = core.cfg.lock().unwrap();
        c.bg = bg.clone();
        store::save_config(&c)?;
    }
    if let Err(e) = apply(&bg) {
        let mut c = core.cfg.lock().unwrap();
        c.bg.on = false;
        let _ = store::save_config(&c);
        drop(c);
        let _ = apply(&store::BgCfg { on: false, ..bg });
        return Err(e);
    }
    core.log(if bg.on { format!("Checks while Emu Vault is closed: on, every {} hours", bg.hours) } else { "Checks while Emu Vault is closed: off".into() });
    Ok(bg_status(core))
}

// ------------------------------------------------------------------ the run itself

fn notify(title: &str, body: &str) {
    let ok = crate::desktop_cmd("notify-send").args(["-a", "Emu Vault", "-i", "emu-vault", title, body]).status().map(|s| s.success()).unwrap_or(false);
    if !ok {
        let _ = crate::desktop_cmd("gdbus")
            .args([
                "call",
                "--session",
                "--dest",
                "org.freedesktop.Notifications",
                "--object-path",
                "/org/freedesktop/Notifications",
                "--method",
                "org.freedesktop.Notifications.Notify",
                "Emu Vault",
                "0",
                "emu-vault",
                title,
                body,
                "[]",
                "{}",
                "8000",
            ])
            .status();
    }
}

fn count_files(d: &Path) -> usize {
    let mut n = 0;
    let mut stack = vec![d.to_path_buf()];
    while let Some(d) = stack.pop() {
        for e in std::fs::read_dir(&d).into_iter().flatten().flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if name.starts_with('.') || name.ends_with(".part") {
                continue;
            }
            if e.path().is_dir() {
                stack.push(e.path());
            } else {
                n += 1;
            }
        }
    }
    n
}

/// `emu-vault --background`
pub fn run_background() -> i32 {
    if window_open() {
        return 0;
    }
    let core = Core::new();
    let cfg = core.cfg.lock().unwrap().clone();
    let bg = cfg.bg.clone();
    let mut st = load_state();
    // the very first run only takes note of what's there
    let first = st.last_run.is_empty();
    let mut news: Vec<String> = vec![];
    let rt = match tokio::runtime::Runtime::new() {
        Ok(r) => r,
        Err(_) => return 1,
    };
    rt.block_on(async {
        // 1. app updates
        if bg.apps {
            let ups = crate::check_enabled_quiet(&core).await;
            let fresh: Vec<&String> = ups.iter().filter(|u| !st.updates_seen.contains(u)).collect();
            if !fresh.is_empty() && !first {
                news.push(format!("{} new version{} of your apps", fresh.len(), if fresh.len() == 1 { "" } else { "s" }));
            }
            st.updates_seen = ups;
        }
        // 2. new files in the inbox
        if bg.inbox {
            let n = count_files(&Path::new(&cfg.root).join("inbox"));
            if n > st.inbox_seen && !first {
                news.push(format!("{} new file{} in the Inbox", n - st.inbox_seen, if n - st.inbox_seen == 1 { "" } else { "s" }));
            }
            st.inbox_seen = n;
        }
        // 3. saves
        if bg.saves {
            let (done, files, errs) = crate::saves::run_due(&core, false);
            if done > 0 {
                news.push(format!("saves backed up ({files} file{})", if files == 1 { "" } else { "s" }));
            }
            if !errs.is_empty() {
                news.push(format!("a save backup didn't work: {}", errs[0]));
            }
        }
        // 4. covers for new games
        if bg.covers && cfg.covers.auto && cfg.covers.source != "esde" && Path::new(&cfg.root).is_dir() {
            let systems = crate::cmds::rom_systems_pub(&cfg.root);
            for s in &systems {
                let files = crate::roms::scan_system(&cfg.root, s, &core.hashes);
                core.lib.lock().unwrap().insert(s.clone(), files);
            }
            crate::cmds::save_hashes_pub(&core);
            let lib = core.lib.lock().unwrap().clone();
            let mut covers = cfg.covers.clone();
            covers.esde_dir = Path::new(&cfg.root).join("media").to_string_lossy().into();
            let (jobs, _) = crate::extras::cover_jobs(&lib, &covers);
            let jobs: Vec<_> = jobs.into_iter().filter(|j| !st.covers_nf.contains(&format!("{}|{}", j.kind, j.game))).take(300).collect();
            let base = std::env::var("EMUVAULT_THUMBS").unwrap_or_else(|_| "https://thumbnails.libretro.com/".into());
            let mut got = 0;
            for j in &jobs {
                match crate::extras::fetch_cover(&core.client, &base, j, covers.size).await {
                    Ok(true) => {
                        if j.kind == "covers" {
                            got += 1
                        }
                    }
                    Ok(false) => st.covers_nf.push(format!("{}|{}", j.kind, j.game)),
                    Err(_) => break,
                }
            }
            st.covers_nf.truncate(20000);
            if got > 0 {
                news.push(format!("{got} cover{} downloaded", if got == 1 { "" } else { "s" }));
            }
        }
    });
    st.last_run = store::now();
    st.last_text = if news.is_empty() { "Nothing new".into() } else { news.join(" · ") };
    save_state(&st);
    core.log(format!("Background check: {}", st.last_text));
    if !news.is_empty() && cfg.notify {
        let mut t = news.join("\n");
        if let Some(f) = t.get(..1) {
            t = f.to_uppercase() + &t[1..];
        }
        notify("Emu Vault", &t);
    }
    0
}
