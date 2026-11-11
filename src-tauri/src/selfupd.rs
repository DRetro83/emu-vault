// 0.16: Emu Vault updates itself from its GitHub releases (github.com/DRetro83/emu-vault).
// check: the newest release and the file that fits how this copy was installed (.sh, lite .sh or .deb).
// download: into ~/.cache/emu-vault/update, checked against GitHub's sha256 when the release has one.
// install: .sh  -> starts the new .sh (it unpacks itself, removes the old version and starts) and closes this one;
//          .deb -> pkexec dpkg -i (the system asks for your password), then starts the new version.
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::Emitter;

pub const REPO: &str = "DRetro83/emu-vault";
const UA: &str = concat!("EmuVault/", env!("CARGO_PKG_VERSION"));

#[derive(Serialize, Clone, Default)]
pub struct Asset {
    pub name: String,
    pub url: String,
    pub size: u64,
    pub sha256: String,
}

#[derive(Serialize, Clone, Default)]
pub struct Info {
    pub current: String,
    /// sh | lite | deb | other (run from a raw AppImage or a dev build: no update from inside the app)
    pub kind: String,
    pub latest: String,
    pub tag: String,
    pub name: String,
    pub notes: String,
    pub date: String,
    pub page: String,
    pub newer: bool,
    /// the file for this kind of install (None: the release doesn't have it)
    pub asset: Option<Asset>,
}

/// "0.15.0", "v0.15.0" -> [0, 15, 0]; anything after '-' (beta) is ignored
fn nums(v: &str) -> Vec<u64> {
    v.trim().trim_start_matches(['v', 'V']).split('-').next().unwrap_or("").split('.').map(|p| p.trim().parse().unwrap_or(0)).collect()
}
pub fn newer(latest: &str, current: &str) -> bool {
    let (a, b) = (nums(latest), nums(current));
    for i in 0..a.len().max(b.len()) {
        let (x, y) = (a.get(i).copied().unwrap_or(0), b.get(i).copied().unwrap_or(0));
        if x != y {
            return x > y;
        }
    }
    false
}

/// How this copy runs: from the .sh (unpacked in ~/.local/share/emu-vault/<version>/), the lite .sh, or the .deb.
pub fn kind() -> String {
    let exe = std::env::current_exe().ok().and_then(|p| p.canonicalize().ok()).unwrap_or_default();
    kind_of(&exe, &sh_base())
}
fn sh_base() -> PathBuf {
    dirs::data_dir().unwrap_or_else(|| PathBuf::from("/tmp")).join("emu-vault")
}
fn kind_of(exe: &Path, base: &Path) -> String {
    if exe.starts_with("/usr/") {
        return "deb".into();
    }
    if exe.starts_with(base) {
        // <base>/<version>/usr/bin/emu-vault; the full .sh carries chdman in <version>/usr/lib/emu-vault/
        let root = exe.parent().and_then(|p| p.parent()).unwrap_or(exe);
        return if root.join("lib/emu-vault/chdman").exists() { "sh".into() } else { "lite".into() };
    }
    "other".into()
}

fn pick(assets: &[Asset], kind: &str) -> Option<Asset> {
    let n = |a: &Asset| a.name.to_lowercase();
    assets
        .iter()
        .find(|a| match kind {
            "deb" => n(a).ends_with("_amd64.deb"),
            "lite" => n(a).starts_with("emu-vault-lite-") && n(a).ends_with(".sh"),
            "sh" => n(a).starts_with("emu-vault-") && !n(a).starts_with("emu-vault-lite-") && n(a).ends_with(".sh"),
            _ => false,
        })
        .cloned()
}

fn net(e: reqwest::Error) -> String {
    if e.is_connect() || e.is_timeout() {
        "Can't reach GitHub. Are you online?".into()
    } else {
        format!("GitHub didn't answer: {e}")
    }
}

#[tauri::command]
pub async fn self_check(core: tauri::State<'_, crate::Core>) -> Result<Info, String> {
    let url = format!("https://api.github.com/repos/{REPO}/releases/latest");
    let res = core.client.get(&url).header("User-Agent", UA).header("Accept", "application/vnd.github+json").timeout(std::time::Duration::from_secs(20)).send().await.map_err(net)?;
    if res.status().as_u16() == 404 {
        return Err("There is no release on GitHub yet.".into());
    }
    if res.status().as_u16() == 403 || res.status().as_u16() == 429 {
        return Err("GitHub says: too many checks for now. Try again in an hour.".into());
    }
    if !res.status().is_success() {
        return Err(format!("GitHub answered {}", res.status()));
    }
    let v: serde_json::Value = res.json().await.map_err(|e| format!("GitHub's answer wasn't readable: {e}"))?;
    let s = |k: &str| v.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string();
    let assets: Vec<Asset> = v
        .get("assets")
        .and_then(|a| a.as_array())
        .map(|a| {
            a.iter()
                .map(|x| Asset {
                    name: x.get("name").and_then(|n| n.as_str()).unwrap_or("").into(),
                    url: x.get("browser_download_url").and_then(|n| n.as_str()).unwrap_or("").into(),
                    size: x.get("size").and_then(|n| n.as_u64()).unwrap_or(0),
                    sha256: x.get("digest").and_then(|n| n.as_str()).and_then(|d| d.strip_prefix("sha256:")).unwrap_or("").to_lowercase(),
                })
                .collect()
        })
        .unwrap_or_default();
    let current = env!("CARGO_PKG_VERSION").to_string();
    let tag = s("tag_name");
    let latest = tag.trim_start_matches(['v', 'V']).to_string();
    let k = kind();
    Ok(Info {
        newer: newer(&latest, &current),
        asset: pick(&assets, &k),
        kind: k,
        current,
        latest,
        tag,
        name: s("name"),
        notes: s("body"),
        date: s("published_at").chars().take(10).collect(),
        page: s("html_url"),
    })
}

#[derive(Serialize, Clone)]
struct Prog {
    got: u64,
    total: u64,
}

/// Downloads the release file and gives back where it is.
#[tauri::command]
pub async fn self_download(app: tauri::AppHandle, core: tauri::State<'_, crate::Core>, asset: serde_json::Value) -> Result<String, String> {
    use futures_util::StreamExt;
    use sha2::{Digest, Sha256};
    use tokio::io::AsyncWriteExt;
    let g = |k: &str| asset.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string();
    let (name, url, want) = (g("name"), g("url"), g("sha256"));
    if name.is_empty() || name.contains('/') || !url.starts_with(&format!("https://github.com/{REPO}/releases/download/")) {
        return Err("That isn't an Emu Vault release file.".into());
    }
    let dir = dirs::cache_dir().unwrap_or_else(|| PathBuf::from("/tmp")).join("emu-vault/update");
    let _ = tokio::fs::remove_dir_all(&dir).await;
    tokio::fs::create_dir_all(&dir).await.map_err(|e| format!("Can't make {}: {e}", dir.display()))?;
    let res = core.client.get(&url).header("User-Agent", UA).send().await.map_err(net)?;
    if !res.status().is_success() {
        return Err(format!("Download failed: GitHub answered {}", res.status()));
    }
    let total = res.content_length().unwrap_or(0);
    let part = dir.join(format!("{name}.part"));
    let mut f = tokio::fs::File::create(&part).await.map_err(|e| e.to_string())?;
    let (mut got, mut h, mut last) = (0u64, Sha256::new(), std::time::Instant::now());
    let mut st = res.bytes_stream();
    while let Some(c) = st.next().await {
        let c = c.map_err(|e| format!("Download stopped halfway: {e}"))?;
        h.update(&c);
        f.write_all(&c).await.map_err(|e| format!("Can't write the download: {e}"))?;
        got += c.len() as u64;
        if last.elapsed().as_millis() > 150 {
            last = std::time::Instant::now();
            let _ = app.emit("self-progress", Prog { got, total });
        }
    }
    f.flush().await.map_err(|e| e.to_string())?;
    drop(f);
    let _ = app.emit("self-progress", Prog { got, total: total.max(got) });
    if total > 0 && got != total {
        return Err("The download is incomplete. Try again.".into());
    }
    let sum = format!("{:x}", h.finalize());
    if !want.is_empty() && sum != want {
        let _ = tokio::fs::remove_file(&part).await;
        return Err("The download doesn't match the release (sha256). Nothing was installed. Try again.".into());
    }
    let to = dir.join(&name);
    tokio::fs::rename(&part, &to).await.map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&to, std::fs::Permissions::from_mode(0o755));
    }
    Ok(to.to_string_lossy().into())
}

/// Starts `sh -c <script>` on its own (survives this app closing).
fn detach(script: &str, args: &[&str]) -> Result<(), String> {
    use std::process::{Command, Stdio};
    let mut c = if Path::new("/usr/bin/setsid").exists() || Path::new("/bin/setsid").exists() {
        let mut c = Command::new("setsid");
        c.arg("-f").arg("sh");
        c
    } else {
        Command::new("sh")
    };
    c.arg("-c").arg(script).arg("emu-vault-update").args(args).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    c.spawn().map(|_| ()).map_err(|e| format!("Couldn't start the new version: {e}"))
}

/// Installs the downloaded file and restarts Emu Vault. For the .deb the system asks for your password.
#[tauri::command]
pub async fn self_install(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    let cache = dirs::cache_dir().unwrap_or_default().join("emu-vault/update");
    if !p.starts_with(&cache) || !p.is_file() {
        return Err("The downloaded file isn't there any more. Download it again.".into());
    }
    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();
    if name.ends_with(".sh") {
        // the .sh unpacks into ~/.local/share/emu-vault/<new version>, removes the old one and starts;
        // --install also points the app-menu entry at the new version when you had one
        let menu = dirs::data_dir().unwrap_or_default().join("applications/emu-vault.desktop").exists();
        detach("sleep 1; exec sh \"$1\" $2", &[&path, if menu { "--install" } else { "" }])?;
        app.exit(0);
        return Ok("restarting".into());
    }
    if name.ends_with(".deb") {
        let out = tokio::task::spawn_blocking(move || std::process::Command::new("pkexec").args(["dpkg", "-i"]).arg(&p).output())
            .await
            .map_err(|e| e.to_string())?;
        match out {
            Ok(o) if o.status.success() => {
                detach("sleep 1; exec /usr/bin/emu-vault", &[])?;
                app.exit(0);
                Ok("restarting".into())
            }
            Ok(o) if matches!(o.status.code(), Some(126) | Some(127)) => Err("cancelled".into()),
            Ok(o) => Err(format!("The install didn't work: {}", String::from_utf8_lossy(&o.stderr).lines().last().unwrap_or("dpkg failed"))),
            Err(_) => Err("nopkexec".into()),
        }
    } else {
        Err("That isn't an Emu Vault release file.".into())
    }
}

/// The downloaded .deb in your file manager / software installer, when pkexec isn't there or you cancelled.
#[tauri::command]
pub fn self_open_deb() -> Result<(), String> {
    let dir = dirs::cache_dir().unwrap_or_default().join("emu-vault/update");
    let f = std::fs::read_dir(&dir).map_err(|e| e.to_string())?.flatten().map(|e| e.path()).find(|p| p.extension().is_some_and(|x| x == "deb")).ok_or("No downloaded .deb")?;
    std::process::Command::new("xdg-open").arg(&f).spawn().map(|_| ()).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn versions() {
        assert!(newer("0.16.0", "0.15.0"));
        assert!(newer("v0.15.1", "0.15.0"));
        assert!(newer("1.0", "0.99.9"));
        assert!(!newer("0.15.0", "0.15.0"));
        assert!(!newer("0.14.9", "0.15.0"));
        assert!(!newer("0.15.0-beta.1", "0.15.0"));
    }
    #[test]
    fn kinds() {
        let base = Path::new("/home/x/.local/share/emu-vault");
        assert_eq!(kind_of(Path::new("/usr/bin/emu-vault"), base), "deb");
        assert_eq!(kind_of(Path::new("/opt/dev/target/release/emu-vault"), base), "other");
        assert_eq!(kind_of(Path::new("/home/x/.local/share/emu-vault/0.15.0/usr/bin/emu-vault"), base), "lite");
    }
    #[test]
    fn picks() {
        let a = |n: &str| Asset { name: n.into(), ..Default::default() };
        let l = vec![a("emu-vault-0.16.0.sh"), a("emu-vault-lite-0.16.0.sh"), a("emu-vault_0.16.0_amd64.deb")];
        assert_eq!(pick(&l, "sh").unwrap().name, "emu-vault-0.16.0.sh");
        assert_eq!(pick(&l, "lite").unwrap().name, "emu-vault-lite-0.16.0.sh");
        assert_eq!(pick(&l, "deb").unwrap().name, "emu-vault_0.16.0_amd64.deb");
        assert!(pick(&l, "other").is_none());
    }
}
