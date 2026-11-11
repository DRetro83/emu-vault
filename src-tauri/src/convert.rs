//! Making disc games smaller without losing anything: CHD (chdman, from MAME) for CD/DVD systems,
//! RVZ (dolphin-tool) for GameCube and Wii. The originals go to roms/<system>/_converted/ and every
//! step is in Recent changes, so it can be undone.

use crate::journal::Recorder;
use crate::{cmds, Core};
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::Emitter;

/// system -> what is made
pub fn target(sys: &str) -> Option<&'static str> {
    match sys {
        "psx" | "ps2" | "saturn" | "segacd" | "dreamcast" | "pcenginecd" | "3do" | "neogeocd" | "pcfx" | "psp" => Some("chd"),
        "gc" | "wii" => Some("rvz"),
        _ => None,
    }
}

fn source_ext(sys: &str, ext: &str) -> bool {
    match target(sys) {
        Some("chd") => matches!(ext, "cue" | "gdi" | "iso"),
        Some("rvz") => matches!(ext, "iso" | "gcm"),
        _ => false,
    }
}

fn which(prog: &str) -> Option<PathBuf> {
    let path = std::env::var("PATH").unwrap_or_default();
    let appdir = std::env::var("APPDIR").unwrap_or_default();
    for d in path.split(':').filter(|d| !d.is_empty() && (appdir.is_empty() || !d.starts_with(&appdir))).chain(["/usr/bin", "/usr/local/bin", "/usr/games"]) {
        let p = Path::new(d).join(prog);
        if p.is_file() {
            return Some(p);
        }
    }
    None
}

/// chdman that comes with Emu Vault (the .sh version): <exe>/../lib/emu-vault/chdman/chdman
fn bundled_chdman() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let p = exe.parent()?.join("../lib/emu-vault/chdman/chdman");
    p.is_file().then(|| p.canonicalize().unwrap_or(p))
}

pub fn chdman_cmd_pub() -> Option<std::process::Command> {
    chdman_cmd()
}

/// The chdman command, ready to run.
fn chdman_cmd() -> Option<std::process::Command> {
    if let Some(b) = bundled_chdman() {
        let mut c = crate::desktop_cmd(&b.to_string_lossy());
        c.env("LD_LIBRARY_PATH", b.parent().unwrap());
        return Some(c);
    }
    which("chdman").map(|p| crate::desktop_cmd(&p.to_string_lossy()))
}

#[derive(Serialize, Clone)]
pub struct Tools {
    chdman: bool,
    dolphin_tool: bool,
    /// how to get what's missing
    chdman_how: String,
    dolphin_how: String,
    flatpak: bool,
}

fn dolphin_cmd() -> Option<Vec<String>> {
    if let Some(p) = which("dolphin-tool") {
        return Some(vec![p.to_string_lossy().into()]);
    }
    let fp = which("flatpak")?;
    let ok = crate::desktop_cmd(&fp.to_string_lossy()).args(["info", "org.DolphinEmu.dolphin-emu"]).status().map(|s| s.success()).unwrap_or(false);
    ok.then(|| {
        vec![fp.to_string_lossy().into(), "run".into(), "--command=dolphin-tool".into(), "--filesystem=host".into(), "org.DolphinEmu.dolphin-emu".into()]
    })
}

#[tauri::command]
pub fn convert_tools() -> Tools {
    Tools {
        chdman: chdman_cmd().is_some(),
        flatpak: which("flatpak").is_some(),
        dolphin_tool: dolphin_cmd().is_some(),
        chdman_how: "sudo apt install mame-tools".into(),
        dolphin_how: "Install Dolphin (for example the Flatpak from Discover or Flathub); it brings dolphin-tool".into(),
    }
}

#[derive(Serialize)]
pub struct Converted {
    converted: usize,
    failed: Vec<String>,
    saved: u64,
}

fn size_with_parts(p: &Path, parts: &[String]) -> u64 {
    p.metadata().map(|m| m.len()).unwrap_or(0) + parts.iter().map(|x| Path::new(x).metadata().map(|m| m.len()).unwrap_or(0)).sum::<u64>()
}

/// Convert every disc game of a system that isn't converted yet.
#[tauri::command]
pub async fn convert_system(app: tauri::AppHandle, core: tauri::State<'_, Core>, sys: String) -> Result<Converted, String> {
    let kind = target(&sys).ok_or("Emu Vault doesn't convert games of this system.")?;
    if kind == "chd" && chdman_cmd().is_none() {
        return Err("chdman isn't there. Press \"Install chdman\" in Save space, or in a terminal:  sudo apt install mame-tools".into());
    }
    let tool: Vec<String> = match kind {
        "chd" => vec![],
        _ => dolphin_cmd().ok_or("dolphin-tool isn't there. Press \"Install Dolphin\" in Save space and try again.")?,
    };
    let root = core.cfg.lock().unwrap().root.clone();
    let files: Vec<crate::roms::RomFile> = core.lib.lock().unwrap().get(&sys).cloned().unwrap_or_default();
    let todo: Vec<_> = files
        .into_iter()
        .filter(|f| {
            let ext = f.name.rsplit_once('.').map(|(_, e)| e.to_lowercase()).unwrap_or_default();
            source_ext(&sys, &ext) && !f.rel.starts_with('_')
        })
        .collect();
    if todo.is_empty() {
        return Ok(Converted { converted: 0, failed: vec![], saved: 0 });
    }
    let n = todo.len();
    let mut rec = Recorder::new(&format!("{sys} disc games converted to {}", kind.to_uppercase()));
    let mut out = Converted { converted: 0, failed: vec![], saved: 0 };
    let conv_dir = Path::new(&root).join("roms").join(&sys).join("_converted");
    let c: &Core = &core;
    tokio::task::block_in_place(|| {
        for (i, f) in todo.iter().enumerate() {
            let _ = app.emit("convert-progress", (i, n, f.name.clone()));
            let src = PathBuf::from(&f.path);
            let stem = f.name.rsplit_once('.').map(|(a, _)| a).unwrap_or(&f.name).to_string();
            let dest = src.with_file_name(format!("{stem}.{kind}"));
            if dest.exists() {
                out.failed.push(format!("{}: {} already exists", f.name, dest.file_name().unwrap().to_string_lossy()));
                continue;
            }
            let ext = f.name.rsplit_once('.').map(|(_, e)| e.to_lowercase()).unwrap_or_default();
            let mut cmd = if kind == "chd" {
                chdman_cmd().unwrap()
            } else {
                let mut c = crate::desktop_cmd(&tool[0]);
                c.args(&tool[1..]);
                c
            };
            if kind == "chd" {
                // DVDs (PS2, PSP) as DVD, everything else as CD
                let dvd = ext == "iso" && (sys == "ps2" || sys == "psp");
                cmd.args([if dvd { "createdvd" } else { "createcd" }, "-i"]).arg(&src).arg("-o").arg(&dest);
            } else {
                cmd.args(["convert", "-f", "rvz", "-b", "131072", "-c", "zstd", "-l", "5", "-i"]).arg(&src).arg("-o").arg(&dest);
            }
            let before = size_with_parts(&src, &f.parts);
            let ok = cmd.status().map(|s| s.success()).unwrap_or(false) && dest.metadata().map(|m| m.len() > 0).unwrap_or(false);
            if !ok {
                let _ = std::fs::remove_file(&dest);
                out.failed.push(format!("{}: the converter stopped with an error", f.name));
                continue;
            }
            rec.batch.made.push(dest.to_string_lossy().into());
            // originals (and their track files) to _converted/
            let rel_dir = Path::new(&f.rel).parent().map(|p| p.to_path_buf()).unwrap_or_default();
            let keep_dir = conv_dir.join(&rel_dir);
            let _ = rec.mv(&src, &keep_dir.join(src.file_name().unwrap()));
            for part in &f.parts {
                let pp = Path::new(part);
                if pp.exists() {
                    let _ = rec.mv(pp, &keep_dir.join(pp.file_name().unwrap()));
                }
            }
            // a multi-disc playlist next to it: point it to the new file
            if let Ok(rd) = std::fs::read_dir(src.parent().unwrap()) {
                for e in rd.flatten() {
                    let p = e.path();
                    if p.extension().map(|x| x.eq_ignore_ascii_case("m3u")).unwrap_or(false) && p.is_file() {
                        if let Ok(t) = std::fs::read_to_string(&p) {
                            if t.lines().any(|l| l.trim() == f.name) {
                                let nt = t
                                    .lines()
                                    .map(|l| if l.trim() == f.name { dest.file_name().unwrap().to_string_lossy().to_string() } else { l.to_string() })
                                    .collect::<Vec<_>>()
                                    .join("\n")
                                    + "\n";
                                if rec.mv(&p, &keep_dir.join(p.file_name().unwrap())).is_ok() {
                                    let _ = rec.write(&p, nt.as_bytes());
                                }
                            }
                        }
                    }
                }
            }
            let after = dest.metadata().map(|m| m.len()).unwrap_or(0);
            out.saved += before.saturating_sub(after);
            out.converted += 1;
        }
        let _ = app.emit("convert-progress", (n, n, String::new()));
        rec.batch.label = format!(
            "{} {} game{} converted to {} ({} MB saved)",
            out.converted,
            sys,
            if out.converted == 1 { "" } else { "s" },
            kind.to_uppercase(),
            out.saved / 1_048_576
        );
        let l = rec.batch.label.clone();
        rec.commit();
        cmds::rescan_pub(c, &[sys.clone()]);
        c.log(l);
        if !out.failed.is_empty() {
            c.log(format!("Not converted: {}", out.failed.join("; ")));
        }
    });
    Ok(out)
}

/// Install what converting needs: chdman (asks your password, via pkexec + apt) or Dolphin (Flatpak, for you only, no password).
#[tauri::command]
pub async fn install_tool(app: tauri::AppHandle, which_tool: String) -> Result<String, String> {
    let _ = app.emit("install-progress", which_tool.clone());
    tokio::task::block_in_place(|| match which_tool.as_str() {
        "chdman" => {
            let pk = which("pkexec")
                .ok_or("This computer can't ask for your password from an app (pkexec is missing). In a terminal:  sudo apt install mame-tools")?;
            let ok = crate::desktop_cmd(&pk.to_string_lossy()).args(["apt-get", "install", "-y", "mame-tools"]).status().map(|s| s.success()).unwrap_or(false);
            if ok && chdman_cmd().is_some() {
                Ok("chdman is installed".into())
            } else {
                Err("Installing chdman didn't work (or was cancelled). In a terminal:  sudo apt install mame-tools".into())
            }
        }
        "dolphin" => {
            let fp = which("flatpak").ok_or("Flatpak isn't installed. In a terminal:  sudo apt install flatpak  and then press Install Dolphin again.")?;
            let fp = fp.to_string_lossy().to_string();
            let _ = crate::desktop_cmd(&fp)
                .args(["remote-add", "--user", "--if-not-exists", "flathub", "https://dl.flathub.org/repo/flathub.flatpakrepo"])
                .status();
            let ok = crate::desktop_cmd(&fp)
                .args(["install", "-y", "--noninteractive", "--user", "flathub", "org.DolphinEmu.dolphin-emu"])
                .status()
                .map(|s| s.success())
                .unwrap_or(false);
            if ok && dolphin_cmd().is_some() {
                Ok("Dolphin is installed".into())
            } else {
                Err("Installing Dolphin didn't work. Check your internet connection, or install Dolphin from Discover / Software.".into())
            }
        }
        _ => Err("Unknown tool".into()),
    })
}
