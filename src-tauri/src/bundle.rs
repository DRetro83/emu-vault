//! The full package: emu-vault-full-<version>.sh with RetroArch (and your cores), ES-DE and Heroic inside.
//! It is made on your own computer from what is already in your vault ("Make a full package" in Settings),
//! because those come from libretro, ES-DE and GitHub. On the first start of a full package, whatever is
//! missing in the main folder is copied in from it. Nothing that is already there is touched.

use crate::{store, Core};
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{Emitter, Manager};

const HEAD: &str = include_str!("full-head.sh");

fn root(core: &Core) -> PathBuf {
    PathBuf::from(core.cfg.lock().unwrap().root.clone())
}

/// The unpacked Emu Vault this runs from (<dir>/usr/bin/emu-vault), when it came from a .sh.
fn pkg_dir() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let d = exe.parent()?.parent()?.parent()?.to_path_buf();
    if d.join("AppRun").exists() {
        Some(d)
    } else {
        None
    }
}

fn du(p: &Path) -> u64 {
    if p.is_symlink() {
        return 0;
    }
    if p.is_file() {
        return p.metadata().map(|m| m.len()).unwrap_or(0);
    }
    std::fs::read_dir(p).map(|rd| rd.flatten().map(|e| du(&e.path())).sum()).unwrap_or(0)
}

/// RetroArch: the version in use and its home without your own things (saves, states, BIOS links, settings).
const RA_SKIP: &[&str] = &["saves", "states", "system", "screenshots", "playlists", "thumbnails", "logs", "retroarch.cfg", "content_history.lpl", "config"];

fn ra_parts(r: &Path) -> Option<(PathBuf, String)> {
    let cur = r.join("RetroArch/app/current.AppImage");
    let t = std::fs::read_link(&cur).ok()?;
    let ver = t.parent()?.file_name()?.to_string_lossy().to_string();
    if r.join("RetroArch/app").join(&ver).is_dir() {
        Some((r.join("RetroArch"), ver))
    } else {
        None
    }
}
fn esde_part(core: &Core) -> Option<PathBuf> {
    crate::overview_pub(core).esde_appimage.map(PathBuf::from).and_then(|p| p.parent().map(|d| d.to_path_buf())).filter(|d| d.join(store::META).exists())
}
fn heroic_part(r: &Path) -> Option<(PathBuf, String)> {
    let d = r.join("Launchers/Heroic");
    let t = std::fs::read_link(d.join("current.AppImage")).ok()?;
    let ver = t.parent()?.file_name()?.to_string_lossy().to_string();
    if d.join("app").join(&ver).is_dir() {
        Some((d, ver))
    } else {
        None
    }
}

#[derive(Serialize, Default)]
pub struct FullInfo {
    /// can this Emu Vault make one (it runs from the .sh)?
    pub can: bool,
    pub why: String,
    pub retroarch: String,
    pub retroarch_size: u64,
    pub cores: usize,
    pub esde: String,
    pub esde_size: u64,
    pub heroic: String,
    pub heroic_size: u64,
    pub base_size: u64,
    /// running from a full package: what it brought
    pub from_full: bool,
    pub ver: String,
}

#[tauri::command]
pub fn full_info(core: tauri::State<Core>) -> FullInfo {
    let r = root(&core);
    let mut i = FullInfo { ver: env!("CARGO_PKG_VERSION").into(), ..Default::default() };
    match pkg_dir() {
        Some(d) => {
            i.can = true;
            i.base_size = du(&d) - du(&d.join("bundle"));
            i.from_full = d.join("bundle").is_dir();
        }
        None => i.why = "Make it from the .sh version of Emu Vault (this one was installed another way).".into(),
    }
    if let Some((d, v)) = ra_parts(&r).filter(|_| crate::retroarch::ra_on(&core)) {
        i.retroarch = v.clone();
        i.retroarch_size = du(&d.join("app").join(&v));
        let h = d.join("home/.config/retroarch");
        if let Ok(rd) = std::fs::read_dir(&h) {
            for e in rd.flatten() {
                let n = e.file_name().to_string_lossy().to_string();
                if !RA_SKIP.contains(&n.as_str()) {
                    i.retroarch_size += du(&e.path());
                }
            }
        }
        i.cores = std::fs::read_dir(h.join("cores")).map(|rd| rd.flatten().filter(|e| e.file_name().to_string_lossy().ends_with(".so")).count()).unwrap_or(0);
    }
    if let Some(d) = esde_part(&core) {
        i.esde = d.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
        i.esde_size = du(&d);
    }
    if let Some((d, v)) = heroic_part(&r) {
        i.heroic = v.clone();
        i.heroic_size = du(&d.join("app").join(&v));
    }
    i
}

fn sh(cmd: &str) -> Result<(), String> {
    let o = std::process::Command::new("sh").arg("-c").arg(cmd).output().map_err(|e| e.to_string())?;
    if o.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&o.stderr).trim().to_string())
    }
}
fn q(p: &Path) -> String {
    format!("'{}'", p.to_string_lossy().replace('\'', "'\\''"))
}

/// Make emu-vault-full-<version>.sh at `to` (a file path).
#[tauri::command]
pub async fn full_make(app: tauri::AppHandle, core: tauri::State<'_, Core>, to: String) -> Result<String, String> {
    crate::linux_only("Making the full package")?;
    let pkg = pkg_dir().ok_or("Make it from the .sh version of Emu Vault.")?;
    let r = root(&core);
    let ra = ra_parts(&r).filter(|_| crate::retroarch::ra_on(&core));
    let es = esde_part(&core);
    let he = heroic_part(&r);
    if ra.is_none() && es.is_none() && he.is_none() {
        return Err("RetroArch, ES-DE and Heroic are not in the vault yet. Get them first, then make the package.".into());
    }
    let out = PathBuf::from(&to);
    let tmp = out.with_extension("building");
    let say = |s: &str| {
        let _ = app.emit("full-progress", s.to_string());
    };
    let job = move || -> Result<String, String> {
        let _ = std::fs::remove_dir_all(&tmp);
        let p = tmp.join("pkg");
        std::fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;
        sh(&format!("mkdir -p {p} && cp -a {src}/. {p}/ && rm -rf {p}/bundle", p = q(&p), src = q(&pkg)))?;
        let b = p.join("bundle");
        std::fs::create_dir_all(&b).map_err(|e| e.to_string())?;
        let mut what = vec![];
        let mut lic = String::from("Inside this full package, next to Emu Vault:\n\n");
        if let Some((d, v)) = &ra {
            let to = b.join("RetroArch");
            sh(&format!(
                "mkdir -p {t}/app {t}/home/.config && cp -a {a} {t}/app/ && cp -a {c} {t}/app/",
                t = q(&to),
                a = q(&d.join("app").join(v)),
                c = q(&d.join("app/current.AppImage"))
            ))?;
            let h = d.join("home/.config/retroarch");
            let th = to.join("home/.config/retroarch");
            std::fs::create_dir_all(&th).map_err(|e| e.to_string())?;
            if let Ok(rd) = std::fs::read_dir(&h) {
                for e in rd.flatten() {
                    let n = e.file_name().to_string_lossy().to_string();
                    if !RA_SKIP.contains(&n.as_str()) {
                        sh(&format!("cp -a {} {}/", q(&e.path()), q(&th)))?;
                    }
                }
            }
            what.push(format!("RetroArch {v}"));
            lic += &format!("RetroArch {v}: GPLv3, source https://github.com/libretro/RetroArch\nRetroArch cores: each has its own license (some are for non-commercial use only), see https://docs.libretro.com and the .info files in info/\n");
        }
        if let Some(d) = &es {
            let to = b.join("ES-DE");
            std::fs::create_dir_all(&to).map_err(|e| e.to_string())?;
            sh(&format!("cp -a {} {}/", q(d), q(&to)))?;
            what.push(format!("ES-DE {}", d.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default()));
            lic += "ES-DE: MIT license, source https://gitlab.com/es-de/emulationstation-de\n";
        }
        if let Some((d, v)) = &he {
            let to = b.join("Heroic");
            sh(&format!("mkdir -p {t}/app && cp -a {a} {t}/app/", t = q(&to), a = q(&d.join("app").join(v))))?;
            what.push(format!("Heroic {v}"));
            lic += &format!("Heroic Games Launcher {v}: GPLv3, source https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher\n");
        }
        lic += "\nThis package was made on your own computer from your own vault. Check the core licenses before you share it with others.\n";
        std::fs::write(b.join("LICENSES.txt"), lic).map_err(|e| e.to_string())?;
        let ver = env!("CARGO_PKG_VERSION");
        let name = out.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
        let head = HEAD.replace("VERSION-full", &format!("{ver}-full")).replace("emu-vault-full-VERSION.sh", &name).replace("VERSION", ver);
        std::fs::write(tmp.join("head.sh"), head).map_err(|e| e.to_string())?;
        sh(&format!(
            "cd {t} && tar -cf - -C pkg . | xz -T0 -6 > payload.txz && cat head.sh payload.txz > {o}.part && chmod +x {o}.part && mv {o}.part {o}",
            t = q(&tmp),
            o = q(&out)
        ))?;
        let _ = std::fs::remove_dir_all(&tmp);
        Ok(what.join(", "))
    };
    say("Copying and packing… this takes a few minutes");
    let what = tokio::task::spawn_blocking(job).await.map_err(|e| e.to_string())??;
    core.log(format!("Full package made: {to} ({what})"));
    Ok(what)
}

/// First start of a full package: copy in what the main folder doesn't have yet.
pub fn apply(app: tauri::AppHandle) {
    let Some(pkg) = pkg_dir() else { return };
    let b = pkg.join("bundle");
    if !b.is_dir() {
        return;
    }
    std::thread::spawn(move || {
        // wait until a main folder is chosen
        for _ in 0..720 {
            let r = root(&app.state::<Core>());
            if !r.as_os_str().is_empty() && r.is_dir() {
                break;
            }
            std::thread::sleep(std::time::Duration::from_secs(5));
        }
        let core = app.state::<Core>();
        let r = root(&core);
        if r.as_os_str().is_empty() || !r.is_dir() {
            return;
        }
        let mut done = vec![];
        if b.join("RetroArch").is_dir() && !r.join("RetroArch/app/current.AppImage").exists() {
            if sh(&format!("mkdir -p {d} && cp -an {s}/. {d}/", s = q(&b.join("RetroArch")), d = q(&r.join("RetroArch")))).is_ok() {
                let _ = crate::retroarch::setup(&core);
                done.push("RetroArch");
            }
        }
        if b.join("ES-DE").is_dir() {
            let have = std::fs::read_dir(r.join("Apps"))
                .map(|rd| rd.flatten().any(|e| e.file_name().to_string_lossy().to_lowercase().contains("es-de")))
                .unwrap_or(false);
            if !have {
                // Apps/<name>/Linux/<version>/ like a download by Emu Vault
                let name = crate::overview_name(&core, "pc.esde").unwrap_or_else(|| "ES-DE".into());
                let to = store::versions_dir(&r.to_string_lossy(), &name, "linux");
                if sh(&format!("mkdir -p {d} && cp -an {s}/. {d}/", s = q(&b.join("ES-DE")), d = q(&to))).is_ok() {
                    done.push("ES-DE");
                }
            }
        }
        if b.join("Heroic").is_dir() && !r.join("Launchers/Heroic/current.AppImage").exists() {
            let d = r.join("Launchers/Heroic");
            if sh(&format!("mkdir -p {d} && cp -an {s}/. {d}/", s = q(&b.join("Heroic")), d = q(&d))).is_ok() {
                if let Some(v) =
                    std::fs::read_dir(d.join("app")).ok().and_then(|mut rd| rd.next()).and_then(|e| e.ok()).map(|e| e.file_name().to_string_lossy().to_string())
                {
                    let _ = crate::gog::heroic_put(&core, &v);
                }
                done.push("Heroic");
            }
        }
        if !done.is_empty() {
            core.log(format!("From the full package: {} put in your main folder", done.join(", ")));
            let _ = app.emit("full-applied", done.join(", "));
        }
    });
}
