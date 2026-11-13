//! GOG backups: your GOG games (installers and extras) backed up on your own drive.
//!
//! A separate module. To take it out: delete this file and ui/gog.js + ui/gog.css, remove `mod gog;`,
//! the `gog::` commands and `gog::start` in lib.rs, the two lines in index.html, and rusqlite in Cargo.toml.
//! Nothing else in Emu Vault calls into it.
//!
//! The login, the game list and the download links use the same public GOG client access as
//! gog-downloader, lgogdownloader and Heroic. The folder layout follows gog-downloader:
//! `<folder>/<gog-slug>/<installers>` and `<folder>/<gog-slug>/extras/<extras>`, so both tools can share a folder.

use crate::{store, Core};
use futures_util::StreamExt;
use md5::{Digest, Md5};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, MutexGuard, OnceLock};
use tauri::{Emitter, Manager};

const CLIENT_ID: &str = "46899977096215655";
const CLIENT_SECRET: &str = "9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9";
const UA: &str = "EmuVault/0.6 (GOG backups)";

fn env_or(k: &str, d: &str) -> String {
    std::env::var(k).ok().filter(|v| !v.is_empty()).unwrap_or_else(|| d.to_string()).trim_end_matches('/').to_string()
}
fn auth_base() -> String {
    env_or("EMUVAULT_GOG_AUTH", "https://auth.gog.com")
}
fn embed_base() -> String {
    env_or("EMUVAULT_GOG_EMBED", "https://embed.gog.com")
}
fn api_base() -> String {
    env_or("EMUVAULT_GOG_API", "https://api.gog.com")
}
fn gamesdb_base() -> String {
    env_or("EMUVAULT_GOG_GAMESDB", "https://gamesdb.gog.com")
}
fn content_base() -> String {
    env_or("EMUVAULT_GOG_CONTENT", "https://content-system.gog.com")
}
fn rconfig_base() -> String {
    env_or("EMUVAULT_GOG_RCONFIG", "https://remote-config.gog.com")
}
fn cloud_base() -> String {
    env_or("EMUVAULT_GOG_CLOUD", "https://cloudstorage.gog.com")
}
fn redirect_uri() -> String {
    format!("{}/on_login_success?origin=client", embed_base())
}
fn enc(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}
pub fn auth_url() -> String {
    format!("{}/auth?client_id={CLIENT_ID}&redirect_uri={}&response_type=code&layout=client2", auth_base(), enc(&redirect_uri()))
}

// ------------------------------------------------------------------ settings (own file, not in config.json)

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Token {
    pub access: String,
    pub refresh: String,
    /// unix seconds
    pub until: i64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct GogCfg {
    pub on: bool,
    /// empty = <main folder>/GOG
    pub dir: String,
    pub os: Vec<String>,
    pub lang: String,
    pub extras: bool,
    pub patches: bool,
    /// "dup" = old versions to _duplicates, "delete"
    pub old: String,
    pub verify: bool,
    pub parallel: u8,
    /// off | start | daily | weekly
    pub bg: String,
    pub notify: bool,
    /// "gd" = installers together in the game folder (like gog-downloader), "split" = windows/ linux/ mac/
    pub layout: String,
    /// gog-slug | custom | rom-manager (gog-downloader's naming-convention)
    pub naming: String,
    /// gog-downloader's database (read only), "" = none
    pub gd_db: String,
    pub skip: Vec<u64>,
    pub user: String,
    pub last_check: String,
    pub last_check_ts: i64,
    pub paused_at: String,
    pub token: Option<Token>,
    /// 0.7: "keep only the newest" became the default once
    #[serde(default)]
    pub old_v2: bool,
    /// where "Install in Heroic" puts games, "" = <main folder>/Games
    pub heroic_games: String,
    /// also keep a copy of each cover: "" (only in _emuvault/covers), "game" (cover.jpg in the game folder), "folder" (<GOG folder>/covers/)
    pub cover_copy: String,
    /// connections per file (1-8): GOG gives each connection only part of your line
    pub conns: u8,
    /// where saves go, "" = <main folder>/Saves/GOG
    pub saves_dir: String,
    /// download GOG cloud saves after Update list
    pub saves_auto: bool,
    pub galaxy_id: String,
    pub covers_checked_ts: i64,
}
impl Default for GogCfg {
    fn default() -> Self {
        GogCfg {
            on: false,
            dir: String::new(),
            os: vec!["windows".into(), "linux".into()],
            lang: "en".into(),
            extras: true,
            patches: false,
            old: "delete".into(),
            verify: true,
            parallel: 2,
            bg: "daily".into(),
            notify: true,
            layout: "gd".into(),
            naming: "gog-slug".into(),
            gd_db: String::new(),
            skip: vec![],
            user: String::new(),
            last_check: String::new(),
            last_check_ts: 0,
            paused_at: String::new(),
            token: None,
            old_v2: true,
            heroic_games: String::new(),
            cover_copy: String::new(),
            conns: 4,
            saves_dir: String::new(),
            saves_auto: true,
            galaxy_id: String::new(),
            covers_checked_ts: 0,
        }
    }
}

fn cfg_path() -> PathBuf {
    store::app_dir().join("gog.json")
}
fn cfg() -> MutexGuard<'static, GogCfg> {
    static C: OnceLock<Mutex<GogCfg>> = OnceLock::new();
    C.get_or_init(|| {
        let c: GogCfg = std::fs::read_to_string(cfg_path()).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default();
        // 0.16.4: on a stick, the GOG folder is this computer's own
        let mut c = crate::stick::here_in("gog.json", crate::stick::GOG_HERE, c);
        if !c.old_v2 {
            // you asked for one version per game: the old one goes once the new one is in and checked
            c.old = "delete".into();
            c.old_v2 = true;
            let _ = save(&c);
        }
        Mutex::new(c)
    })
    .lock()
    .unwrap_or_else(|e| e.into_inner())
}
fn save(c: &GogCfg) -> Result<(), String> {
    crate::stick::here_out("gog.json", crate::stick::GOG_HERE, c);
    store::write_json(&cfg_path(), c)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(cfg_path(), std::fs::Permissions::from_mode(0o600));
    }
    Ok(())
}
fn now_ts() -> i64 {
    chrono::Local::now().timestamp()
}

fn vault_root(core: &Core) -> String {
    core.cfg.lock().unwrap().root.clone()
}
fn gog_dir(core: &Core) -> PathBuf {
    let d = cfg().dir.clone();
    if d.trim().is_empty() {
        Path::new(&vault_root(core)).join("GOG")
    } else {
        PathBuf::from(d.trim())
    }
}
/// Emu Vault's own files in the GOG folder (a normal folder: the app may not show pictures from hidden ones).
fn meta_dir(dir: &Path) -> PathBuf {
    let new = dir.join("_emuvault");
    let old = dir.join(".emuvault-gog");
    if !new.exists() && old.is_dir() {
        let _ = std::fs::rename(&old, &new);
    }
    new
}

// ------------------------------------------------------------------ login

#[derive(Deserialize)]
struct TokRes {
    access_token: String,
    refresh_token: String,
    #[serde(default)]
    expires_in: i64,
}

async fn token_call(core: &Core, q: &[(&str, &str)]) -> Result<Token, String> {
    let r = core.client.get(format!("{}/token", auth_base())).query(q).header("User-Agent", UA).send().await.map_err(|e| format!("GOG login: {e}"))?;
    if !r.status().is_success() {
        return Err(format!("GOG did not accept the login ({}). Sign in again.", r.status()));
    }
    let t: TokRes = r.json().await.map_err(|e| format!("GOG login: {e}"))?;
    Ok(Token { access: t.access_token, refresh: t.refresh_token, until: now_ts() + t.expires_in.max(60) })
}

/// A valid access key: refreshed when it is (almost) over.
async fn token(core: &Core) -> Result<String, String> {
    let t = cfg().token.clone().ok_or("Not signed in to GOG. Sign in in GOG Settings.")?;
    if now_ts() + 120 < t.until {
        return Ok(t.access);
    }
    let n = token_call(
        core,
        &[
            ("client_id", CLIENT_ID),
            ("client_secret", CLIENT_SECRET),
            ("grant_type", "refresh_token"),
            ("refresh_token", &t.refresh),
            ("without_new_session", "1"),
        ],
    )
    .await?;
    let mut c = cfg();
    c.token = Some(n.clone());
    let _ = save(&c);
    Ok(n.access)
}

/// The code from the address of the empty page (or the code itself).
fn code_of(s: &str) -> Option<String> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }
    if s.starts_with("http") {
        let u = url::Url::parse(s).ok()?;
        return u.query_pairs().find(|(k, _)| k == "code").map(|(_, v)| v.to_string()).filter(|v| !v.is_empty());
    }
    if s.contains("code=") {
        return s.split("code=").nth(1).map(|v| v.split('&').next().unwrap_or("").to_string()).filter(|v| !v.is_empty());
    }
    Some(s.to_string())
}

async fn login_with(core: &Core, code: &str) -> Result<String, String> {
    let ru = redirect_uri();
    let t = token_call(
        core,
        &[("client_id", CLIENT_ID), ("client_secret", CLIENT_SECRET), ("grant_type", "authorization_code"), ("code", code), ("redirect_uri", &ru)],
    )
    .await?;
    let mut user = String::new();
    if let Ok(r) = core.client.get(format!("{}/userData.json", embed_base())).bearer_auth(&t.access).header("User-Agent", UA).send().await {
        if let Ok(v) = r.json::<serde_json::Value>().await {
            user = v["username"].as_str().unwrap_or("").to_string();
        }
    }
    let mut c = cfg();
    c.token = Some(t);
    c.user = if user.is_empty() { "GOG account".into() } else { user.clone() };
    save(&c)?;
    core.log(format!("GOG: signed in as {}", c.user));
    Ok(c.user.clone())
}

#[tauri::command]
pub fn gog_login_url() -> String {
    auth_url()
}

#[tauri::command]
pub async fn gog_login_code(core: tauri::State<'_, Core>, code: String) -> Result<String, String> {
    let c = code_of(&code).ok_or("No code found. Paste the full address of the empty page, it contains code=…")?;
    login_with(&core, &c).await
}

/// Opens the real GOG login page in its own window and catches the empty page at the end.
#[tauri::command]
pub async fn gog_login_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("goglogin") {
        let _ = w.set_focus();
        return Ok(());
    }
    let url = url::Url::parse(&auth_url()).map_err(|e| e.to_string())?;
    let done = redirect_uri();
    let h = app.clone();
    tauri::WebviewWindowBuilder::new(&app, "goglogin", tauri::WebviewUrl::External(url))
        .title("Sign in to GOG")
        .inner_size(520.0, 760.0)
        .on_navigation(move |u| {
            let s = u.as_str();
            if !s.starts_with(&done) {
                return true;
            }
            let code = code_of(s);
            let h = h.clone();
            tauri::async_runtime::spawn(async move {
                if let Some(w) = h.get_webview_window("goglogin") {
                    let _ = w.close();
                }
                let core = h.state::<Core>();
                let r = match code {
                    Some(c) => login_with(&core, &c).await,
                    None => Err("GOG did not give a code. Try again, or sign in by hand.".into()),
                };
                let _ = h.emit(
                    "gog-login",
                    match r {
                        Ok(u) => serde_json::json!({ "ok": true, "user": u }),
                        Err(e) => serde_json::json!({ "ok": false, "error": e }),
                    },
                );
            });
            false
        })
        .build()
        .map_err(|e| format!("Could not open the GOG window: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn gog_logout(core: tauri::State<Core>) -> Result<(), String> {
    let mut c = cfg();
    c.token = None;
    c.user.clear();
    save(&c)?;
    core.log("GOG: signed out");
    Ok(())
}

// ------------------------------------------------------------------ the list of your games (cached on the drive)

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct LFile {
    /// installer | patch | extra | dlc
    pub kind: String,
    pub os: String,
    pub lang: String,
    pub name: String,
    pub version: String,
    pub size: u64,
    pub downlink: String,
    /// the real file name (from GOG's download link)
    pub fname: String,
    pub md5: String,
    pub gid: u64,
    /// the exact size from GOG's checksum file (the size in the game list is rounded to MB); 0 = not known
    pub real: u64,
}
impl LFile {
    /// the size to show and to download
    fn shown(&self) -> u64 {
        if self.real > 0 {
            self.real
        } else {
            self.size
        }
    }
    /// does a file of this size on the drive fit?
    fn fits(&self, disk: u64) -> bool {
        // without GOG's checksum file the size in its list is not reliable (extras): then any size counts
        if self.real > 0 {
            disk == self.real
        } else {
            disk > 0 || self.size == 0
        }
    }
}
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct LGame {
    pub id: u64,
    pub slug: String,
    pub title: String,
    pub image: String,
    pub files: Vec<LFile>,
    /// installers for systems you did not pick (only counted)
    pub other_os: Vec<String>,
}
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct Lib {
    pub updated: String,
    pub games: Vec<LGame>,
}
fn lib_path(dir: &Path) -> PathBuf {
    meta_dir(dir).join("library.json")
}
fn load_lib(dir: &Path) -> Lib {
    std::fs::read_to_string(lib_path(dir)).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}

async fn get_json(core: &Core, tok: &str, url: &str) -> Result<serde_json::Value, String> {
    let mut last = String::new();
    for i in 0..3 {
        if i > 0 {
            tokio::time::sleep(std::time::Duration::from_millis(800 * i)).await;
        }
        match core.client.get(url).bearer_auth(tok).header("User-Agent", UA).timeout(std::time::Duration::from_secs(60)).send().await {
            Ok(r) if r.status().is_success() => return r.json().await.map_err(|e| format!("{url}: {e}")),
            Ok(r) if r.status() == 401 => return Err("GOG says you are signed out. Sign in again in GOG Settings.".into()),
            Ok(r) if r.status() == 404 || r.status() == 403 => return Err(format!("{} ({url})", r.status())),
            Ok(r) => last = format!("{} ({url})", r.status()),
            Err(e) => last = e.to_string(),
        }
    }
    Err(last)
}

/// downlink -> (real download address, checksum address)
async fn resolve(core: &Core, tok: &str, downlink: &str) -> Result<(String, String), String> {
    let u = if downlink.starts_with('/') { format!("{}{downlink}", embed_base()) } else { downlink.to_string() };
    let v = get_json(core, tok, &u).await?;
    let dl = v["downlink"].as_str().unwrap_or("").to_string();
    if dl.is_empty() {
        return Err("GOG gave no download address".into());
    }
    Ok((dl, v["checksum"].as_str().unwrap_or("").to_string()))
}
fn name_of_url(u: &str) -> String {
    let p = u.split('?').next().unwrap_or(u);
    let last = p.rsplit('/').next().unwrap_or("");
    url::form_urlencoded::parse(format!("x={last}").as_bytes()).next().map(|(_, v)| v.to_string()).unwrap_or_else(|| last.to_string())
}
/// file name + md5 for one file
async fn file_info(core: &Core, tok: &str, downlink: &str) -> Result<(String, String, u64), String> {
    let (dl, ck) = resolve(core, tok, downlink).await?;
    let mut name = name_of_url(&dl);
    let mut md5 = String::new();
    let mut real = 0u64;
    if !ck.is_empty() {
        if let Ok(r) = core.client.get(&ck).header("User-Agent", UA).timeout(std::time::Duration::from_secs(60)).send().await {
            if r.status().is_success() {
                let x = r.text().await.unwrap_or_default();
                let at = |k: &str| regex::Regex::new(&format!(r#"<file[^>]*\b{k}="([^"]*)""#)).ok().and_then(|re| re.captures(&x).map(|c| c[1].to_string()));
                if let Some(m) = at("md5") {
                    md5 = m.to_lowercase();
                }
                if let Some(n) = at("total_size").and_then(|v| v.parse::<u64>().ok()) {
                    real = n;
                }
                if let Some(n) = at("name").filter(|n| !n.is_empty() && !n.contains('/')) {
                    name = n;
                }
            }
        }
    }
    if name.is_empty() || name.contains('/') || name == "." || name == ".." {
        return Err("odd file name from GOG".into());
    }
    // GOG's own name is nearly always safe already; otherwise make it safe
    let safe = name.chars().all(|c| c.is_alphanumeric() || "._-()[]+".contains(c));
    Ok((if safe { name } else { store::safe(&name) }, md5, real))
}

fn pick_lang<'a>(list: &'a [serde_json::Value], os: &str, lang: &str) -> Vec<&'a serde_json::Value> {
    let of = |l: &str| list.iter().filter(|i| i["os"].as_str() == Some(os) && i["language"].as_str() == Some(l)).collect::<Vec<_>>();
    let mine = of(lang);
    if !mine.is_empty() {
        mine
    } else {
        of("en")
    }
}

fn files_of(item: &serde_json::Value, kind: &str, gid: u64) -> Vec<LFile> {
    item["files"]
        .as_array()
        .map(|fs| {
            fs.iter()
                .map(|f| LFile {
                    kind: kind.into(),
                    os: item["os"].as_str().unwrap_or("").into(),
                    lang: item["language"].as_str().unwrap_or("").into(),
                    name: item["name"].as_str().unwrap_or("").into(),
                    version: item["version"].as_str().unwrap_or("").into(),
                    size: f["size"].as_u64().unwrap_or(0),
                    downlink: f["downlink"].as_str().unwrap_or("").into(),
                    fname: String::new(),
                    md5: String::new(),
                    gid,
                    real: 0,
                })
                .filter(|f| !f.downlink.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

/// One game: what to download with your settings (file names come later).
async fn game_detail(core: &Core, tok: &str, id: u64, slug: &str, title: &str, image: &str, c: &GogCfg) -> Result<LGame, String> {
    let owned = get_json(core, tok, &format!("{}/account/gameDetails/{id}.json", embed_base())).await.ok();
    let owned_dlc: Option<HashSet<String>> =
        owned.as_ref().and_then(|o| o["dlcs"].as_array()).map(|a| a.iter().filter_map(|d| d["title"].as_str().map(String::from)).collect());
    let owned_ex: Option<HashSet<String>> =
        owned.as_ref().and_then(|o| o["extras"].as_array()).map(|a| a.iter().filter_map(|d| d["name"].as_str().map(String::from)).collect());
    let p = get_json(core, tok, &format!("{}/products/{id}?expand=downloads,expanded_dlcs", api_base())).await?;
    let mut g = LGame {
        id,
        slug: slug.into(),
        title: if title.is_empty() { p["title"].as_str().unwrap_or("").into() } else { title.into() },
        image: image.into(),
        ..Default::default()
    };
    if g.slug.is_empty() {
        g.slug = p["slug"].as_str().unwrap_or("").into();
    }
    let empty = vec![];
    let inst = p["downloads"]["installers"].as_array().unwrap_or(&empty);
    let mut seen_os = HashSet::new();
    for i in inst {
        if let Some(o) = i["os"].as_str() {
            seen_os.insert(o.to_string());
        }
    }
    for os in &c.os {
        for i in pick_lang(inst, os, &c.lang) {
            g.files.extend(files_of(i, "installer", id));
        }
        if c.patches {
            for i in pick_lang(p["downloads"]["patches"].as_array().unwrap_or(&empty), os, &c.lang) {
                g.files.extend(files_of(i, "patch", id));
            }
        }
        for d in p["expanded_dlcs"].as_array().unwrap_or(&empty) {
            let t = d["title"].as_str().unwrap_or("");
            if owned_dlc.as_ref().map(|s| !s.contains(t)).unwrap_or(false) {
                continue;
            }
            let did = d["id"].as_u64().unwrap_or(id);
            for i in pick_lang(d["downloads"]["installers"].as_array().unwrap_or(&empty), os, &c.lang) {
                g.files.extend(files_of(i, "dlc", did));
            }
        }
    }
    g.other_os = seen_os.into_iter().filter(|o| !c.os.contains(o)).collect();
    g.other_os.sort();
    if c.extras {
        for b in p["downloads"]["bonus_content"].as_array().unwrap_or(&empty) {
            let n = b["name"].as_str().unwrap_or("");
            if owned_ex.as_ref().map(|s| !s.contains(n)).unwrap_or(false) {
                continue;
            }
            let mut fs = files_of(b, "extra", id);
            for f in fs.iter_mut() {
                f.os.clear();
                f.lang.clear();
                f.version.clear();
            }
            g.files.extend(fs);
        }
    }
    Ok(g)
}

/// Ask GOG again for one file's name, MD5 and exact size, and keep it in the list.
async fn fresh_file(core: &Core, dir: &Path, f: &LFile) -> Option<LFile> {
    let tok = token(core).await.ok()?;
    let (n, m, r) = file_info(core, &tok, &f.downlink).await.ok()?;
    let mut nf = f.clone();
    nf.fname = n;
    nf.md5 = m;
    nf.real = r;
    let _g = lib_mut();
    let mut lib = load_lib(dir);
    for g in lib.games.iter_mut() {
        for x in g.files.iter_mut().filter(|x| x.gid == f.gid && x.downlink == f.downlink) {
            *x = nf.clone();
        }
    }
    let _ = store::write_json(&lib_path(dir), &lib);
    Some(nf)
}
fn lib_mut() -> MutexGuard<'static, ()> {
    static L: OnceLock<Mutex<()>> = OnceLock::new();
    L.get_or_init(|| Mutex::new(())).lock().unwrap_or_else(|e| e.into_inner())
}

#[derive(Serialize, Clone, Default)]
pub struct RefreshSum {
    pub games: usize,
    pub need: usize,
    pub new_since: usize,
    pub errors: Vec<String>,
}

static REFRESHING: AtomicBool = AtomicBool::new(false);

async fn do_refresh(app: &tauri::AppHandle, core: &Core) -> Result<RefreshSum, String> {
    if REFRESHING.swap(true, Ordering::SeqCst) {
        return Err("The GOG list is already being updated".into());
    }
    let r = refresh_inner(app, core).await;
    REFRESHING.store(false, Ordering::SeqCst);
    r
}

async fn refresh_inner(app: &tauri::AppHandle, core: &Core) -> Result<RefreshSum, String> {
    let tok = token(core).await?;
    let c = cfg().clone();
    let dir = gog_dir(core);
    gone_guard(&dir)?;
    std::fs::create_dir_all(meta_dir(&dir)).map_err(|e| format!("Cannot write to {}: {e}", dir.display()))?;
    let before =
        view_blocking(core).ok().map(|v| v.games.iter().filter(|g| g.st != "ok" && g.st != "skip").map(|g| g.id).collect::<HashSet<u64>>()).unwrap_or_default();
    let old = load_lib(&dir);
    let emit = |done: usize, total: usize, what: &str| {
        let _ = app.emit("gog-refresh", serde_json::json!({ "done": done, "total": total, "what": what }));
    };
    // 1. the games on your account
    let mut list: Vec<(u64, String, String, String)> = vec![];
    let mut page = 1;
    loop {
        let v = get_json(core, &tok, &format!("{}/account/getFilteredProducts?mediaType=1&sortBy=title&hiddenFlag=0&page={page}", embed_base())).await?;
        for p in v["products"].as_array().cloned().unwrap_or_default() {
            if p["isGame"].as_bool() == Some(false) {
                continue;
            }
            let id = p["id"].as_u64().unwrap_or(0);
            if id == 0 {
                continue;
            }
            list.push((id, p["slug"].as_str().unwrap_or("").into(), p["title"].as_str().unwrap_or("").into(), p["image"].as_str().unwrap_or("").into()));
        }
        let pages = v["totalPages"].as_u64().unwrap_or(1);
        emit(0, list.len(), &format!("Reading your GOG account, page {page} of {pages}"));
        if page as u64 >= pages {
            break;
        }
        page += 1;
    }
    // 2. what each game has
    let total = list.len();
    let mut errors = vec![];
    let mut done = 0usize;
    let mut games: Vec<LGame> = vec![];
    let mut st = futures_util::stream::iter(
        list.iter()
            .map(|(id, slug, title, image)| {
                let tok = tok.clone();
                let c = c.clone();
                async move { (title.clone(), game_detail(core, &tok, *id, slug, title, image, &c).await) }
            })
            .collect::<Vec<_>>(),
    )
    .buffer_unordered(4);
    while let Some((title, r)) = st.next().await {
        done += 1;
        match r {
            Ok(g) => games.push(g),
            Err(e) => {
                errors.push(format!("{title}: {e}"));
                if let Some(g) = old.games.iter().find(|g| g.title == title) {
                    games.push(g.clone());
                }
            }
        }
        emit(done, total, &title);
    }
    drop(st);
    // 3. real file names and checksums (kept from last time when nothing changed)
    let mut known: HashMap<(u64, String), (String, u64, String, String, u64)> = HashMap::new();
    for g in &old.games {
        for f in &g.files {
            if !f.fname.is_empty() {
                // older lists had no exact size: ask again for those
                if f.real > 0 || f.md5.is_empty() {
                    known.insert((f.gid, f.downlink.clone()), (f.version.clone(), f.size, f.fname.clone(), f.md5.clone(), f.real));
                }
            }
        }
    }
    let mut jobs = vec![];
    for (gi, g) in games.iter_mut().enumerate() {
        let gl = LGame { id: g.id, slug: g.slug.clone(), title: g.title.clone(), ..Default::default() };
        for (fi, f) in g.files.iter_mut().enumerate() {
            if let Some((v, s, n, m, r)) = known.get(&(f.gid, f.downlink.clone())) {
                let mut probe = f.clone();
                probe.fname = n.clone();
                probe.real = *r;
                let on_disk = std::fs::metadata(path_of(&c, &dir, &gl, &probe)).map(|x| x.len()).ok();
                let differs = on_disk.map(|d| !probe.fits(d)).unwrap_or(false);
                if *v == f.version && *s == f.size && !differs {
                    f.fname = n.clone();
                    f.md5 = m.clone();
                    f.real = *r;
                    continue;
                }
            }
            jobs.push((gi, fi, f.downlink.clone(), g.title.clone()));
        }
    }
    let tj = jobs.len();
    let mut dj = 0usize;
    let mut st = futures_util::stream::iter(
        jobs.into_iter()
            .map(|(gi, fi, dl, title)| {
                let tok = tok.clone();
                async move { (gi, fi, title, file_info(core, &tok, &dl).await) }
            })
            .collect::<Vec<_>>(),
    )
    .buffer_unordered(6);
    let mut infos = vec![];
    while let Some(x) = st.next().await {
        dj += 1;
        if dj % 5 == 0 || dj == tj {
            emit(dj, tj, &format!("File names and checksums: {}", x.2));
        }
        infos.push(x);
    }
    drop(st);
    for (gi, fi, title, r) in infos {
        match r {
            Ok((n, m, r)) => {
                games[gi].files[fi].fname = n;
                games[gi].files[fi].md5 = m;
                games[gi].files[fi].real = r;
            }
            Err(e) => errors.push(format!("{title}: {e}")),
        }
    }
    for g in games.iter_mut() {
        g.files.retain(|f| !f.fname.is_empty());
    }
    games.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    let lib = Lib { updated: store::now(), games };
    store::write_json(&lib_path(&dir), &lib)?;
    // 4. covers (original from GOG)
    covers(core, &dir, &lib).await;
    copy_covers(&c, &dir, &lib);
    {
        let mut c = cfg();
        c.last_check = store::now();
        c.last_check_ts = now_ts();
        let _ = save(&c);
    }
    let v = view_blocking(core)?;
    let need: Vec<u64> = v.games.iter().filter(|g| g.st != "ok" && g.st != "skip").map(|g| g.id).collect();
    let sum = RefreshSum { games: lib.games.len(), need: need.len(), new_since: need.iter().filter(|i| !before.contains(i)).count(), errors };
    core.log(format!(
        "GOG: list updated, {} games, {} need a download{}",
        sum.games,
        sum.need,
        if sum.errors.is_empty() { String::new() } else { format!(", {} problems", sum.errors.len()) }
    ));
    let _ = app.emit("gog-changed", ());
    if cfg().saves_auto {
        let known = load_saves(&dir);
        let ids: Vec<u64> =
            lib.games.iter().filter(|g| known.get(&g.id.to_string()).map(|m| m.supported != Some(false)).unwrap_or(true)).map(|g| g.id).collect();
        if !ids.is_empty() {
            let _ = saves_get_inner(app, core, Some(ids)).await;
        }
    }
    Ok(sum)
}

#[tauri::command]
pub async fn gog_refresh(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<RefreshSum, String> {
    do_refresh(&app, &core).await
}

// ------------------------------------------------------------------ covers

fn cover_dir(dir: &Path) -> PathBuf {
    meta_dir(dir).join("covers")
}
async fn fetch_bytes(core: &Core, url: &str) -> Option<Vec<u8>> {
    let r = core.client.get(url).header("User-Agent", UA).timeout(std::time::Duration::from_secs(60)).send().await.ok()?;
    if !r.status().is_success() {
        return None;
    }
    let b = r.bytes().await.ok()?.to_vec();
    // a real picture, not an error page
    if b.len() > 800 && (b.starts_with(&[0xFF, 0xD8]) || b.starts_with(b"\x89PNG") || (b.len() > 12 && &b[8..12] == b"WEBP")) {
        Some(b)
    } else {
        None
    }
}
fn cover_src_path(dir: &Path) -> PathBuf {
    cover_dir(dir).join("sources.json")
}
fn cover_srcs(dir: &Path) -> HashMap<String, String> {
    std::fs::read_to_string(cover_src_path(dir)).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
/// Where GOG has this game's cover: the standing box art first, then the picture from the library list.
async fn cover_cands(core: &Core, g: &LGame) -> Vec<String> {
    let mut cands = vec![];
    if let Ok(r) = core.client.get(format!("{}/platforms/gog/external_releases/{}", gamesdb_base(), g.id)).header("User-Agent", UA).send().await {
        if let Ok(v) = r.json::<serde_json::Value>().await {
            if let Some(f) = v["game"]["vertical_cover"]["url_format"].as_str() {
                cands.push(f.replace("{formatter}", "").replace("{ext}", "jpg").replace("_.jpg", ".jpg"));
                cands.push(f.replace("{formatter}", "glx_vertical_cover").replace("{ext}", "jpg"));
            }
        }
    }
    if !g.image.is_empty() {
        let b = if g.image.starts_with("//") { format!("https:{}", g.image) } else { g.image.clone() };
        cands.push(format!("{b}_392.jpg"));
        cands.push(format!("{b}.jpg"));
    }
    cands
}
/// Get one cover (again). Returns the address it came from.
async fn fetch_cover(core: &Core, dir: &Path, g: &LGame, cands: Vec<String>) -> Option<String> {
    for u in cands {
        if let Some(b) = fetch_bytes(core, &u).await {
            let _ = std::fs::write(cover_dir(dir).join(format!("{}.jpg", g.slug)), b);
            return Some(u);
        }
    }
    None
}
/// New covers for games without one. Once a week also: is GOG's cover still the same? If not, the new one comes.
async fn covers(core: &Core, dir: &Path, lib: &Lib) {
    let cd = cover_dir(dir);
    let _ = std::fs::create_dir_all(&cd);
    let week = now_ts() - cfg().covers_checked_ts > 7 * 24 * 3600;
    let srcs = cover_srcs(dir);
    let todo: Vec<&LGame> = lib.games.iter().filter(|g| week || !cd.join(format!("{}.jpg", g.slug)).exists()).collect();
    let res: Vec<(String, Option<String>)> = futures_util::stream::iter(
        todo.into_iter()
            .map(|g| {
                let srcs = &srcs;
                let cd = cd.clone();
                async move {
                    let cands = cover_cands(core, g).await;
                    let have = cd.join(format!("{}.jpg", g.slug)).exists();
                    // the same address as last time: nothing to do
                    if have && cands.first().is_some() && srcs.get(&g.slug) == cands.first() {
                        return (g.slug.clone(), None);
                    }
                    if have && srcs.get(&g.slug).is_none() && !cands.is_empty() {
                        // covers from before 0.7.5: only note where they come from
                        return (g.slug.clone(), cands.first().cloned());
                    }
                    (g.slug.clone(), fetch_cover(core, dir, g, cands).await)
                }
            })
            .collect::<Vec<_>>(),
    )
    .buffer_unordered(4)
    .collect()
    .await;
    let mut srcs = srcs;
    for (slug, u) in res {
        if let Some(u) = u {
            srcs.insert(slug, u);
        }
    }
    let _ = store::write_json(&cover_src_path(dir), &srcs);
    if week {
        let mut c = cfg();
        c.covers_checked_ts = now_ts();
        let _ = save(&c);
    }
}
#[tauri::command]
pub async fn gog_cover_refetch(app: tauri::AppHandle, core: tauri::State<'_, Core>, slug: Option<String>) -> Result<usize, String> {
    let core: &Core = &core;
    let dir = gog_dir(core);
    let lib = load_lib(&dir);
    let list: Vec<&LGame> = lib.games.iter().filter(|g| slug.as_ref().map(|s| *s == g.slug).unwrap_or(true)).collect();
    let total = list.len();
    let mut srcs = cover_srcs(&dir);
    let mut got = 0;
    for (i, g) in list.into_iter().enumerate() {
        let _ = app.emit("gog-covers", serde_json::json!({ "done": i, "total": total, "title": g.title }));
        let cands = cover_cands(core, g).await;
        if let Some(u) = fetch_cover(core, &dir, g, cands).await {
            srcs.insert(g.slug.clone(), u);
            got += 1;
        }
    }
    let _ = store::write_json(&cover_src_path(&dir), &srcs);
    copy_covers_now(core);
    let _ = app.emit("gog-covers", serde_json::json!({ "end": true, "got": got }));
    let _ = app.emit("gog-changed", ());
    Ok(got)
}
fn own_cover(dir: &Path, folder: &Path, slug: &str) -> Option<PathBuf> {
    for e in ["jpg", "png", "webp", "jpeg"] {
        let p = cover_dir(dir).join(format!("{slug}.custom.{e}"));
        if p.exists() {
            return Some(p);
        }
    }
    let gog = std::fs::metadata(cover_dir(dir).join(format!("{slug}.jpg"))).map(|m| m.len()).ok();
    for e in ["jpg", "png", "webp", "jpeg"] {
        let p = folder.join(format!("cover.{e}"));
        if let Ok(m) = std::fs::metadata(&p) {
            // a copy Emu Vault made of GOG's cover is not "your own"
            if Some(m.len()) == gog && e == "jpg" {
                continue;
            }
            return Some(p);
        }
    }
    None
}

/// The extra copies of the covers you asked for (Settings → Covers).
fn copy_covers(c: &GogCfg, dir: &Path, lib: &Lib) {
    if c.cover_copy.is_empty() {
        return;
    }
    let cd = cover_dir(dir);
    for g in &lib.games {
        let folder = folder_of(c, dir, g, "windows");
        let own = own_cover(dir, &folder, &g.slug);
        // your own cover.jpg in the game folder is never overwritten
        if c.cover_copy == "game" && own.as_ref().map(|p| !p.starts_with(&cd)).unwrap_or(false) {
            continue;
        }
        let src = own.filter(|p| p.starts_with(&cd)).unwrap_or_else(|| cd.join(format!("{}.jpg", g.slug)));
        let Ok(sm) = std::fs::metadata(&src) else { continue };
        let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("jpg").to_string();
        let dst = match c.cover_copy.as_str() {
            // only for games that are on the drive: no empty folders for the others
            "game" if folder.is_dir() => folder.join(format!("cover.{ext}")),
            "folder" => dir.join("covers").join(format!("{}.{ext}", g.slug)),
            _ => continue,
        };
        if std::fs::metadata(&dst).map(|m| m.len() == sm.len()).unwrap_or(false) {
            continue;
        }
        if let Some(p) = dst.parent() {
            let _ = std::fs::create_dir_all(p);
        }
        let _ = std::fs::copy(&src, &dst);
    }
}
fn copy_covers_now(core: &Core) {
    let c = cfg().clone();
    let dir = gog_dir(core);
    copy_covers(&c, &dir, &load_lib(&dir));
}

#[tauri::command]
pub fn gog_cover_set(core: tauri::State<Core>, slug: String, path: String) -> Result<(), String> {
    let dir = gog_dir(&core);
    let src = PathBuf::from(&path);
    let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("jpg").to_lowercase();
    if !["jpg", "jpeg", "png", "webp"].contains(&ext.as_str()) {
        return Err("Pick a JPG, PNG or WebP picture".into());
    }
    let cd = cover_dir(&dir);
    std::fs::create_dir_all(&cd).map_err(|e| e.to_string())?;
    for e in ["jpg", "png", "webp", "jpeg"] {
        let _ = std::fs::remove_file(cd.join(format!("{slug}.custom.{e}")));
    }
    std::fs::copy(&src, cd.join(format!("{}.custom.{ext}", store::safe(&slug)))).map_err(|e| e.to_string())?;
    copy_covers_now(&core);
    Ok(())
}
#[tauri::command]
pub fn gog_cover_reset(core: tauri::State<Core>, slug: String) -> Result<(), String> {
    let dir = gog_dir(&core);
    let cd = cover_dir(&dir);
    let c = cfg().clone();
    let lib = load_lib(&dir);
    let folder = lib.games.iter().find(|g| g.slug == slug).map(|g| folder_of(&c, &dir, g, "windows"));
    for e in ["jpg", "png", "webp", "jpeg"] {
        let p = cd.join(format!("{slug}.custom.{e}"));
        if let Ok(m) = std::fs::metadata(&p) {
            // the copies Emu Vault made of it go too
            for d in [folder.as_ref().map(|f| f.join(format!("cover.{e}"))), Some(dir.join("covers").join(format!("{slug}.{e}")))].into_iter().flatten() {
                if std::fs::metadata(&d).map(|x| x.len() == m.len()).unwrap_or(false) {
                    let _ = std::fs::remove_file(&d);
                }
            }
        }
        let _ = std::fs::remove_file(p);
    }
    copy_covers(&c, &dir, &lib);
    Ok(())
}

// ------------------------------------------------------------------ gog-downloader's folder and database (read only)

fn custom_name(title: &str) -> String {
    let t: String = title.chars().map(|c| if c.is_ascii_alphanumeric() || "-_.".contains(c) { c } else { '_' }).collect();
    let re = regex::Regex::new("_{2,}").unwrap();
    re.replace_all(&t, "_").trim_matches('.').to_string()
}
fn os_short(os: &str) -> &'static str {
    match os {
        "linux" => "linux",
        "osx" | "mac" => "mac",
        _ => "win",
    }
}
/// The game's folder (the one that exists, else where new files go).
fn folder_of(c: &GogCfg, dir: &Path, g: &LGame, os: &str) -> PathBuf {
    if c.naming == "rom-manager" {
        return dir.join(os_short(os)).join(&g.slug);
    }
    let a = dir.join(&g.slug);
    if a.exists() {
        return a;
    }
    let b = dir.join(custom_name(&g.title));
    if b.exists() || c.naming == "custom" {
        return b;
    }
    a
}
fn path_of(c: &GogCfg, dir: &Path, g: &LGame, f: &LFile) -> PathBuf {
    if f.kind == "extra" {
        return folder_of(c, dir, g, "windows").join("extras").join(&f.fname);
    }
    let base = folder_of(c, dir, g, &f.os);
    if c.layout == "split" && c.naming != "rom-manager" {
        base.join(if f.os == "osx" { "mac" } else { &f.os }).join(&f.fname)
    } else {
        base.join(&f.fname)
    }
}

#[derive(Serialize, Default, Clone)]
pub struct GdInfo {
    pub path: String,
    pub naming: String,
    pub download_path: String,
    pub games: usize,
    pub files: usize,
    pub error: String,
}
fn gd_open(p: &str) -> Result<rusqlite::Connection, String> {
    let uri = format!("file:{}?mode=ro&immutable=1", p);
    rusqlite::Connection::open_with_flags(
        uri,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_URI | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|e| e.to_string())
}
fn gd_setting(db: &rusqlite::Connection, k: &str) -> String {
    let v: String = db.query_row("select value from settings where setting = ?1", [k], |r| r.get(0)).unwrap_or_default();
    serde_json::from_str::<String>(&v).unwrap_or(v)
}
fn gd_info(p: &str) -> GdInfo {
    let mut i = GdInfo { path: p.into(), ..Default::default() };
    match gd_open(p) {
        Ok(db) => {
            i.naming = gd_setting(&db, "naming-convention");
            i.download_path = gd_setting(&db, "download-path");
            i.games = db.query_row("select count(*) from games", [], |r| r.get::<_, i64>(0)).unwrap_or(0) as usize;
            i.files = db.query_row("select count(*) from downloads", [], |r| r.get::<_, i64>(0)).unwrap_or(0) as usize;
        }
        Err(e) => i.error = e,
    }
    i
}
/// (GOG game id, size) -> md5 that gog-downloader knows
fn gd_md5s(p: &str) -> HashMap<(u64, u64), String> {
    let mut m = HashMap::new();
    let Ok(db) = gd_open(p) else { return m };
    let q = "select g.game_id, d.size, d.md5 from downloads d join games g on d.game_id = g.id where d.md5 is not null and d.md5 != ''";
    if let Ok(mut s) = db.prepare(q) {
        if let Ok(rows) = s.query_map([], |r| Ok((r.get::<_, i64>(0)?, r.get::<_, f64>(1)?, r.get::<_, String>(2)?))) {
            for (g, sz, md5) in rows.flatten() {
                m.insert((g as u64, sz as u64), md5.to_lowercase());
            }
        }
    }
    m
}
fn gd_candidates(dir: &Path) -> Vec<PathBuf> {
    let h = dirs::home_dir().unwrap_or_default();
    let mut v = vec![
        h.join("gog-downloader.db"),
        h.join("gog-backup/Configs/gog-downloader.db"),
        h.join("Configs/gog-downloader.db"),
        h.join(".config/gog-downloader/gog-downloader.db"),
        dir.join("gog-downloader.db"),
    ];
    if let Some(p) = dir.parent() {
        v.push(p.join("Configs/gog-downloader.db"));
        v.push(p.join("gog-downloader.db"));
    }
    // ~/<anything>/Configs/gog-downloader.db (docker setups)
    if let Ok(rd) = std::fs::read_dir(&h) {
        for e in rd.flatten() {
            v.push(e.path().join("Configs/gog-downloader.db"));
        }
    }
    v.into_iter().filter(|p| p.is_file()).collect()
}

#[tauri::command]
pub fn gog_gd_find(core: tauri::State<Core>) -> Vec<GdInfo> {
    let dir = gog_dir(&core);
    let mut seen = HashSet::new();
    gd_candidates(&dir).into_iter().filter(|p| seen.insert(p.clone())).map(|p| gd_info(&p.to_string_lossy())).collect()
}
/// Use gog-downloader's database (and its naming and folder when you want).
#[tauri::command]
pub fn gog_gd_use(core: tauri::State<Core>, path: String, take_folder: bool) -> Result<GdInfo, String> {
    let i = gd_info(&path);
    if !i.error.is_empty() {
        return Err(format!("Cannot read {path}: {}", i.error));
    }
    let mut c = cfg();
    c.gd_db = path;
    if ["gog-slug", "custom", "rom-manager"].contains(&i.naming.as_str()) {
        c.naming = i.naming.clone();
    }
    if take_folder && !i.download_path.is_empty() && Path::new(&i.download_path).is_dir() {
        c.dir = i.download_path.trim_end_matches('/').to_string();
    }
    c.layout = "gd".into();
    save(&c)?;
    core.log(format!("GOG: using gog-downloader's list ({} games)", i.games));
    Ok(i)
}

// ------------------------------------------------------------------ what is on the drive

#[derive(Serialize, Deserialize, Clone, Default)]
struct Verified {
    size: u64,
    mtime: i64,
    md5: String,
}
fn ver_path(dir: &Path) -> PathBuf {
    meta_dir(dir).join("checked.json")
}
fn load_ver(dir: &Path) -> HashMap<String, Verified> {
    std::fs::read_to_string(ver_path(dir)).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
fn ver_mut() -> MutexGuard<'static, ()> {
    static V: OnceLock<Mutex<()>> = OnceLock::new();
    V.get_or_init(|| Mutex::new(())).lock().unwrap_or_else(|e| e.into_inner())
}
fn ver_put(dir: &Path, rel: &str, v: Verified) {
    let _g = ver_mut();
    let mut m = load_ver(dir);
    m.insert(rel.into(), v);
    let _ = store::write_json(&ver_path(dir), &m);
}
fn mtime(m: &std::fs::Metadata) -> i64 {
    m.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs() as i64).unwrap_or(0)
}
fn part_of(p: &Path) -> PathBuf {
    let mut s = p.as_os_str().to_owned();
    s.push(".part");
    PathBuf::from(s)
}

#[derive(Serialize, Clone, Default)]
pub struct FView {
    pub rel: String,
    pub kind: String,
    pub os: String,
    pub name: String,
    pub size: u64,
    /// ok | miss | part | small (incomplete) | changed (other size than GOG) | bad (MD5)
    pub st: String,
    pub done: u64,
    /// size on the drive (when it is there)
    pub disk: u64,
    /// ok | gd | bad | "" (not checked yet)
    pub md5: String,
}
#[derive(Serialize, Clone, Default)]
pub struct GView {
    pub id: u64,
    pub slug: String,
    pub title: String,
    pub cover: String,
    /// small copy for the grid (or the cover itself)
    pub thumb: String,
    pub custom: bool,
    pub os: Vec<String>,
    pub other_os: Vec<String>,
    pub version: String,
    pub have: String,
    pub size: u64,
    pub extras: Vec<(String, u64)>,
    /// ok | new | upd | inc | bad | extra | skip
    pub st: String,
    pub files: Vec<FView>,
    pub old: Vec<String>,
    pub folder: String,
    pub need: u64,
    pub bad_file: String,
}
#[derive(Serialize, Clone, Default)]
pub struct View {
    pub on: bool,
    pub signed: bool,
    pub user: String,
    pub dir: String,
    pub in_main: bool,
    pub free: u64,
    pub on_disk: u64,
    pub updated: String,
    pub last_check: String,
    pub refreshing: bool,
    pub settings: serde_json::Value,
    pub games: Vec<GView>,
    pub queue: QView,
    pub gd: Option<GdInfo>,
    pub login_url: String,
    /// the GOG folder is there (false: drive unplugged?)
    pub drive_ok: bool,
    pub saves_dir: String,
}

/// version text from an older installer's name: setup_<x>_<version>_(...)...
fn version_in(name: &str, prefix: &str) -> String {
    let rest = &name[prefix.len().min(name.len())..];
    rest.split("_(").next().unwrap_or("").trim_end_matches(".exe").trim_end_matches(".sh").trim_end_matches(".bin").trim_matches('_').replace('_', ".")
}

fn game_view(c: &GogCfg, dir: &Path, g: &LGame, ver: &HashMap<String, Verified>, gd: &HashMap<(u64, u64), String>) -> GView {
    let wanted: Vec<&LFile> = g.files.iter().filter(|f| f.kind == "extra" || c.os.contains(&f.os)).collect();
    let mut v = GView {
        id: g.id,
        slug: g.slug.clone(),
        title: g.title.clone(),
        other_os: g.other_os.clone(),
        version: wanted.iter().find(|f| f.kind == "installer").map(|f| f.version.clone()).unwrap_or_default(),
        ..Default::default()
    };
    let folder = folder_of(c, dir, g, wanted.iter().find(|f| f.kind != "extra").map(|f| f.os.as_str()).unwrap_or("windows"));
    v.folder = folder.to_string_lossy().into();
    let mut oss: Vec<String> = wanted.iter().filter(|f| f.kind != "extra").map(|f| f.os.clone()).collect();
    oss.sort();
    oss.dedup();
    v.os = oss;
    let mut names: HashSet<String> = HashSet::new();
    let mut inst_dirs: HashSet<PathBuf> = HashSet::new();
    let mut prefixes: Vec<(String, String)> = vec![];
    let (mut inst_miss, mut ex_miss, mut bad, mut inc, mut changed) = (0, 0, false, false, false);
    for f in &wanted {
        let p = path_of(c, dir, g, f);
        let rel = p.strip_prefix(dir).map(|r| r.to_string_lossy().to_string()).unwrap_or_else(|_| p.to_string_lossy().to_string());
        names.insert(f.fname.clone());
        if f.kind != "extra" {
            if let Some(d) = p.parent() {
                inst_dirs.insert(d.to_path_buf());
            }
            // the part of the name before the version: older versions start the same way
            let vtok = f.version.split_whitespace().next().unwrap_or("");
            if !vtok.is_empty() {
                if let Some(i) = f.fname.find(&format!("_{vtok}")) {
                    prefixes.push((f.fname[..i + 1].to_string(), f.fname.rsplit('.').next().unwrap_or("").to_string()));
                }
            }
        }
        let mut fv = FView {
            rel: rel.clone(),
            kind: f.kind.clone(),
            os: f.os.clone(),
            name: if f.kind == "extra" { f.name.clone() } else { f.fname.clone() },
            size: f.shown(),
            ..Default::default()
        };
        v.size += f.shown();
        if f.kind == "extra" {
            v.extras.push((f.name.clone(), f.shown()));
        }
        match std::fs::metadata(&p) {
            Ok(m) if f.fits(m.len()) => {
                fv.st = "ok".into();
                fv.disk = m.len();
                let mt = mtime(&m);
                if let Some(x) = ver.get(&rel).filter(|x| x.size == m.len() && x.mtime == mt) {
                    fv.md5 = if f.md5.is_empty() || x.md5 == f.md5 { "ok".into() } else { "bad".into() };
                } else if !f.md5.is_empty() && gd.get(&(f.gid, f.size)).or_else(|| gd.get(&(f.gid, m.len()))).map(|m| *m == f.md5).unwrap_or(false) {
                    fv.md5 = "gd".into();
                }
                if fv.md5 == "bad" {
                    fv.st = "bad".into();
                }
            }
            Ok(m) => {
                fv.disk = m.len();
                // smaller than GOG's: an interrupted download. Another size: GOG changed the file
                fv.st = if f.real > 0 && m.len() < f.real { "small".into() } else { "changed".into() };
            }
            Err(_) => {
                if let Ok(m) = std::fs::metadata(part_of(&p)) {
                    fv.st = "part".into();
                    fv.done = part_done(&part_of(&p), m.len()).min(f.shown());
                } else {
                    fv.st = "miss".into();
                }
            }
        }
        match fv.st.as_str() {
            "ok" => {}
            "bad" | "changed" | "small" => {
                match fv.st.as_str() {
                    "bad" => bad = true,
                    "small" => inc = true,
                    _ => changed = true,
                }
                if v.bad_file.is_empty() || fv.st == "bad" {
                    v.bad_file = f.fname.clone();
                }
                v.need += if fv.st == "small" { f.shown().saturating_sub(fv.disk) } else { f.shown() };
            }
            _ => {
                v.need += f.shown().saturating_sub(fv.done);
                if f.kind == "extra" {
                    ex_miss += 1
                } else {
                    inst_miss += 1
                }
            }
        }
        v.files.push(fv);
    }
    // older installers next to the new ones
    for d in &inst_dirs {
        if let Ok(rd) = std::fs::read_dir(d) {
            for e in rd.flatten() {
                let n = e.file_name().to_string_lossy().to_string();
                if names.contains(&n) || n.ends_with(".part") || n.starts_with('.') || !e.path().is_file() {
                    continue;
                }
                // same start, then a version number (so a German installer "setup_x_de_2.0.exe" is not taken for an old one)
                let found = prefixes.iter().find(|(p, ext)| {
                    n.starts_with(p.as_str())
                        && n[p.len()..].chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false)
                        && (n.ends_with(&format!(".{ext}")) || n.ends_with(".bin") || n.ends_with(".exe"))
                });
                if let Some((p, _)) = found {
                    if v.have.is_empty() {
                        v.have = version_in(&n, p);
                    }
                    v.old.push(e.path().strip_prefix(dir).map(|r| r.to_string_lossy().to_string()).unwrap_or(n));
                }
            }
        }
    }
    v.old.sort();
    v.st = if c.skip.contains(&g.id) {
        "skip"
    } else if bad {
        "bad"
    } else if inc {
        "inc"
    } else if changed {
        "upd"
    } else if inst_miss > 0 {
        if !v.old.is_empty() {
            "upd"
        } else {
            "new"
        }
    } else if ex_miss > 0 {
        "extra"
    } else {
        "ok"
    }
    .into();
    if let Some(p) = own_cover(dir, &folder, &g.slug) {
        v.cover = p.to_string_lossy().into();
        v.custom = true;
    } else {
        let p = cover_dir(dir).join(format!("{}.jpg", g.slug));
        if p.exists() {
            v.cover = p.to_string_lossy().into();
        }
    }
    v.thumb = v.cover.clone();
    if !v.cover.is_empty() {
        if let Some(t) = thumb_of(Path::new(&v.cover)) {
            if t.exists() {
                v.thumb = t.to_string_lossy().into();
            }
        }
    }
    v
}

/// Small copies of the covers on this pc (about 30 KB each), so the cover grid opens at once.
fn thumb_dir() -> PathBuf {
    store::app_dir().join("gog-thumbs")
}
fn thumb_of(src: &Path) -> Option<PathBuf> {
    let m = std::fs::metadata(src).ok()?;
    let name = src.file_name()?.to_string_lossy().replace('.', "_");
    Some(thumb_dir().join(format!("{name}-{}.jpg", m.len())))
}
fn make_thumb(src: &Path, dst: &Path) -> Result<(), String> {
    let img = image::open(src).map_err(|e| e.to_string())?;
    let t = img.thumbnail(240, 340).to_rgb8();
    if let Some(d) = dst.parent() {
        let _ = std::fs::create_dir_all(d);
    }
    let tmp = dst.with_extension("tmp");
    let f = std::fs::File::create(&tmp).map_err(|e| e.to_string())?;
    image::codecs::jpeg::JpegEncoder::new_with_quality(std::io::BufWriter::new(f), 82).encode_image(&t).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, dst).map_err(|e| e.to_string())
}
static THUMBING: AtomicBool = AtomicBool::new(false);
fn thumbs_later(app: &tauri::AppHandle, todo: Vec<(PathBuf, PathBuf)>) {
    if todo.is_empty() || THUMBING.swap(true, Ordering::SeqCst) {
        return;
    }
    allow_pictures(app);
    let app = app.clone();
    std::thread::spawn(move || {
        let mut n = 0;
        for (src, dst) in todo {
            if make_thumb(&src, &dst).is_ok() {
                n += 1;
            } else {
                // a picture we cannot read (webp…): mark it, the original is used
                let _ = std::fs::write(dst.with_extension("skip"), b"");
            }
        }
        THUMBING.store(false, Ordering::SeqCst);
        if n > 0 {
            let _ = app.emit("gog-changed", ());
        }
    });
}

fn settings_json(c: &GogCfg) -> serde_json::Value {
    serde_json::json!({
        "os": c.os, "lang": c.lang, "extras": c.extras, "patches": c.patches, "old": c.old, "verify": c.verify,
        "parallel": c.parallel, "bg": c.bg, "notify": c.notify, "layout": c.layout, "naming": c.naming, "gd_db": c.gd_db, "cover_copy": c.cover_copy, "conns": c.conns, "saves_dir": c.saves_dir, "saves_auto": c.saves_auto,
    })
}

fn view_blocking(core: &Core) -> Result<View, String> {
    let c = cfg().clone();
    let dir = gog_dir(core);
    let lib = load_lib(&dir);
    let ver = load_ver(&dir);
    let gd = if c.gd_db.is_empty() { HashMap::new() } else { gd_md5s(&c.gd_db) };
    let games: Vec<GView> = lib.games.iter().map(|g| game_view(&c, &dir, g, &ver, &gd)).collect();
    let on_disk = games.iter().map(|g| g.files.iter().map(|f| f.disk).sum::<u64>()).sum();
    Ok(View {
        on: c.on,
        signed: c.token.is_some(),
        user: c.user.clone(),
        dir: dir.to_string_lossy().into(),
        in_main: c.dir.trim().is_empty(),
        free: fs2::available_space(if dir.exists() { dir.clone() } else { PathBuf::from(vault_root(core)) }).unwrap_or(0),
        on_disk,
        updated: lib.updated.clone(),
        last_check: c.last_check.clone(),
        refreshing: REFRESHING.load(Ordering::SeqCst),
        settings: settings_json(&c),
        games,
        queue: qview(&dir),
        gd: if c.gd_db.is_empty() { None } else { Some(gd_info(&c.gd_db)) },
        login_url: auth_url(),
        drive_ok: drive_ok(&dir),
        saves_dir: saves_root(core).to_string_lossy().into(),
    })
}
/// Once Emu Vault has used a folder, it does not start over in an empty one: that is an unplugged drive
/// (otherwise the games would go to the pc's own disk, under the empty mount point).
fn gone_guard(dir: &Path) -> Result<(), String> {
    if !drive_ok(dir) && !cfg().last_check.is_empty() {
        return Err(format!("The GOG folder {} is not there (drive unplugged?). Plug it in, or pick another folder in GOG Settings.", dir.display()));
    }
    Ok(())
}
/// The GOG folder is reachable (an unplugged drive leaves an empty mount point behind).
fn drive_ok(dir: &Path) -> bool {
    dir.join("_emuvault").is_dir() || dir.join(".emuvault-gog").is_dir()
}

fn view_cache() -> MutexGuard<'static, Option<View>> {
    static V: OnceLock<Mutex<Option<View>>> = OnceLock::new();
    V.get_or_init(Default::default).lock().unwrap_or_else(|e| e.into_inner())
}
static VIEWING: AtomicBool = AtomicBool::new(false);
fn fresh_view(app: &tauri::AppHandle, core: &Core) -> Result<View, String> {
    let _ = app.asset_protocol_scope().allow_directory(gog_dir(core), true);
    let v = view_blocking(core)?;
    *view_cache() = Some(v.clone());
    // small copies of covers that do not have one yet
    let todo: Vec<(PathBuf, PathBuf)> = v
        .games
        .iter()
        .filter(|g| !g.cover.is_empty() && g.thumb == g.cover)
        .filter_map(|g| {
            let src = PathBuf::from(&g.cover);
            let t = thumb_of(&src)?;
            if t.with_extension("skip").exists() {
                None
            } else {
                Some((src, t))
            }
        })
        .collect();
    thumbs_later(app, todo);
    Ok(v)
}
/// quick: what was seen last time at once, the file checks follow in the background ("gog-view").
#[tauri::command]
pub async fn gog_view(app: tauri::AppHandle, core: tauri::State<'_, Core>, quick: Option<bool>) -> Result<View, String> {
    let core: &Core = &core;
    if quick.unwrap_or(false) {
        let cached = view_cache().clone();
        if let Some(mut v) = cached {
            v.queue = qview(&gog_dir(core));
            if !VIEWING.swap(true, Ordering::SeqCst) {
                let h = app.clone();
                std::thread::spawn(move || {
                    let core = h.state::<Core>();
                    if let Ok(v) = fresh_view(&h, &core) {
                        let _ = h.emit("gog-view", v);
                    }
                    VIEWING.store(false, Ordering::SeqCst);
                });
            }
            return Ok(v);
        }
    }
    fresh_view(&app, core)
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct SetIn {
    on: Option<bool>,
    dir: Option<String>,
    os: Option<Vec<String>>,
    lang: Option<String>,
    extras: Option<bool>,
    patches: Option<bool>,
    old: Option<String>,
    verify: Option<bool>,
    parallel: Option<u8>,
    bg: Option<String>,
    notify: Option<bool>,
    layout: Option<String>,
    naming: Option<String>,
    gd_db: Option<String>,
    skip: Option<(u64, bool)>,
    cover_copy: Option<String>,
    conns: Option<u8>,
    saves_dir: Option<String>,
    saves_auto: Option<bool>,
}
#[tauri::command]
pub fn gog_set(core: tauri::State<Core>, s: SetIn) -> Result<(), String> {
    let mut c = cfg();
    if let Some(v) = s.on {
        c.on = v;
        core.log(if v { "GOG backups on" } else { "GOG backups off" });
    }
    if let Some(v) = s.dir {
        let nd = v.trim().trim_end_matches('/').to_string();
        if nd != c.dir {
            c.dir = nd;
            let d = if c.dir.is_empty() { Path::new(&vault_root(&core)).join("GOG") } else { PathBuf::from(&c.dir) };
            // a folder you pick yourself may be new and empty
            if !drive_ok(&d) {
                c.last_check.clear();
            }
        }
    }
    if let Some(v) = s.os {
        c.os = v.into_iter().filter(|o| ["windows", "linux", "osx"].contains(&o.as_str())).collect();
    }
    if let Some(v) = s.lang {
        c.lang = v;
    }
    if let Some(v) = s.extras {
        c.extras = v;
    }
    if let Some(v) = s.patches {
        c.patches = v;
    }
    if let Some(v) = s.old {
        c.old = if v == "delete" { v } else { "dup".into() };
    }
    if let Some(v) = s.verify {
        c.verify = v;
    }
    if let Some(v) = s.parallel {
        c.parallel = v.clamp(1, 4);
    }
    if let Some(v) = s.bg {
        c.bg = v;
    }
    if let Some(v) = s.notify {
        c.notify = v;
    }
    if let Some(v) = s.layout {
        c.layout = if v == "split" { v } else { "gd".into() };
    }
    if let Some(v) = s.naming {
        c.naming = v;
    }
    if let Some(v) = s.gd_db {
        c.gd_db = v;
    }
    if let Some(v) = s.saves_dir {
        c.saves_dir = v.trim().trim_end_matches('/').to_string();
    }
    if let Some(v) = s.saves_auto {
        c.saves_auto = v;
    }
    if let Some(v) = s.conns {
        c.conns = v.clamp(1, 8);
    }
    let mut copy = false;
    if let Some(v) = s.cover_copy {
        c.cover_copy = if v == "game" || v == "folder" { v } else { String::new() };
        copy = true;
    }
    if let Some((id, on)) = s.skip {
        c.skip.retain(|x| *x != id);
        if on {
            c.skip.push(id);
        }
    }
    save(&c)?;
    drop(c);
    if copy {
        copy_covers_now(&core);
    }
    Ok(())
}

// ------------------------------------------------------------------ downloads: a queue on the drive, pause and resume

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
struct Queue {
    ids: Vec<u64>,
}
fn q_path(dir: &Path) -> PathBuf {
    meta_dir(dir).join("queue.json")
}
fn load_q(dir: &Path) -> Queue {
    std::fs::read_to_string(q_path(dir)).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
fn save_q(dir: &Path, q: &Queue) {
    let _ = store::write_json(&q_path(dir), q);
}

#[derive(Serialize, Clone, Default)]
pub struct Prog {
    pub id: u64,
    pub title: String,
    pub done: u64,
    pub total: u64,
    pub file: String,
    /// wait | run | check | done | err
    pub state: String,
    pub err: String,
    /// bytes per second right now
    pub speed: u64,
}
#[derive(Serialize, Clone, Default)]
pub struct QView {
    pub running: bool,
    pub paused: bool,
    pub paused_at: String,
    pub ids: Vec<u64>,
    pub items: Vec<Prog>,
    pub speed: u64,
}
static RUNNING: AtomicBool = AtomicBool::new(false);
static DRIVE_GONE: AtomicBool = AtomicBool::new(false);
static PAUSE: AtomicBool = AtomicBool::new(false);
fn progs() -> MutexGuard<'static, (HashMap<u64, Prog>, u64)> {
    static P: OnceLock<Mutex<(HashMap<u64, Prog>, u64)>> = OnceLock::new();
    P.get_or_init(Default::default).lock().unwrap_or_else(|e| e.into_inner())
}
fn qview(dir: &Path) -> QView {
    let q = load_q(dir);
    let running = RUNNING.load(Ordering::SeqCst);
    let p = progs();
    QView {
        running,
        paused: !running && !q.ids.is_empty(),
        paused_at: cfg().paused_at.clone(),
        items: q.ids.iter().filter_map(|i| p.0.get(i).cloned()).collect(),
        ids: q.ids,
        speed: if running { p.1 } else { 0 },
    }
}
fn emit_q(app: &tauri::AppHandle, dir: &Path) {
    let _ = app.emit("gog-progress", qview(dir));
}

fn md5_file(p: &Path) -> Result<String, String> {
    let mut f = std::fs::File::open(p).map_err(|e| e.to_string())?;
    let mut h = Md5::new();
    let mut buf = vec![0u8; 1 << 20];
    loop {
        let n = f.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        h.update(&buf[..n]);
    }
    Ok(hex::encode(h.finalize()))
}

enum DlEnd {
    Done,
    Paused,
}

/// For the files themselves: no limit on the whole download, only on silence (a stuck connection).
fn dl_client() -> &'static reqwest::Client {
    static C: OnceLock<reqwest::Client> = OnceLock::new();
    C.get_or_init(|| {
        reqwest::Client::builder().connect_timeout(std::time::Duration::from_secs(20)).read_timeout(std::time::Duration::from_secs(90)).build().unwrap()
    })
}
/// The real size of a file GOG gives no checksum for: ask the download server.
async fn probe_size(cdn: &str) -> Option<u64> {
    let r = dl_client().get(cdn).header("User-Agent", UA).header(reqwest::header::RANGE, "bytes=0-0").send().await.ok()?;
    if r.status().as_u16() == 206 {
        let cr = r.headers().get(reqwest::header::CONTENT_RANGE)?.to_str().ok()?.to_string();
        return cr.rsplit('/').next()?.trim().parse().ok();
    }
    r.content_length().filter(|n| *n > 1)
}
fn store_real(dir: &Path, f: &LFile, real: u64) {
    let _g = lib_mut();
    let mut lib = load_lib(dir);
    for g in lib.games.iter_mut() {
        for x in g.files.iter_mut().filter(|x| x.gid == f.gid && x.downlink == f.downlink) {
            x.real = real;
        }
    }
    let _ = store::write_json(&lib_path(dir), &lib);
}
fn state_of(part: &Path) -> PathBuf {
    PathBuf::from(format!("{}.json", part.display()))
}
/// how much of a .part is really downloaded (downloads in pieces keep a small list next to it)
fn part_done(part: &Path, len: u64) -> u64 {
    match std::fs::read_to_string(state_of(part)).ok().and_then(|t| serde_json::from_str::<PieceState>(&t).ok()) {
        Some(st) => st.segs.iter().map(|s| s[2]).sum(),
        None => len,
    }
}
#[derive(Serialize, Deserialize, Clone, Default)]
struct PieceState {
    size: u64,
    /// [start, end, done]
    segs: Vec<[u64; 3]>,
}
fn add_done(gid: u64, n: u64, file: &str) {
    let mut p = progs();
    if let Some(x) = p.0.get_mut(&gid) {
        x.done += n;
        x.state = "run".into();
        if x.file != file {
            x.file = file.to_string();
        }
    }
}
const BUF: usize = 4 << 20;

/// one piece of a file: bytes start..end, written at their place in the .part
async fn piece(
    core: &Core,
    cdn: &str,
    file: &std::fs::File,
    start: u64,
    end: u64,
    done: &std::sync::atomic::AtomicU64,
    gid: u64,
    name: &str,
) -> Result<bool, String> {
    use crate::gog::WriteAt as _;
    let mut tries = 0;
    loop {
        let pos = start + done.load(Ordering::SeqCst);
        if pos >= end {
            return Ok(true);
        }
        if PAUSE.load(Ordering::SeqCst) {
            return Ok(false);
        }
        let _ = core;
        let res = dl_client().get(cdn).header("User-Agent", UA).header(reqwest::header::RANGE, format!("bytes={pos}-{}", end - 1)).send().await;
        let res = match res {
            Ok(r) if r.status().as_u16() == 206 => r,
            Ok(r) if r.status().as_u16() == 200 => return Err("NORANGE".into()),
            Ok(r) => {
                tries += 1;
                if tries > 4 {
                    return Err(format!("{name}: GOG answered {}", r.status()));
                }
                tokio::time::sleep(std::time::Duration::from_secs(2 * tries)).await;
                continue;
            }
            Err(e) => {
                tries += 1;
                if tries > 4 {
                    return Err(format!("{name}: {e}"));
                }
                tokio::time::sleep(std::time::Duration::from_secs(2 * tries)).await;
                continue;
            }
        };
        let mut st = res.bytes_stream();
        let mut buf: Vec<u8> = Vec::with_capacity(BUF);
        let mut at = pos;
        let mut failed = false;
        while let Some(c) = st.next().await {
            match c {
                Ok(b) => {
                    let room = (end - at - buf.len() as u64) as usize;
                    buf.extend_from_slice(&b[..b.len().min(room)]);
                    if buf.len() >= BUF {
                        file.write_all_at(&buf, at).map_err(|e| format!("Cannot write {name}: {e}"))?;
                        at += buf.len() as u64;
                        done.fetch_add(buf.len() as u64, Ordering::SeqCst);
                        add_done(gid, buf.len() as u64, name);
                        buf.clear();
                    }
                    if PAUSE.load(Ordering::SeqCst) || at + buf.len() as u64 >= end {
                        break;
                    }
                }
                Err(_) => {
                    failed = true;
                    break;
                }
            }
        }
        if !buf.is_empty() {
            file.write_all_at(&buf, at).map_err(|e| format!("Cannot write {name}: {e}"))?;
            done.fetch_add(buf.len() as u64, Ordering::SeqCst);
            add_done(gid, buf.len() as u64, name);
        }
        if failed {
            // a connection that broke after real progress starts counting again
            if at + buf.len() as u64 > pos + (8 << 20) {
                tries = 0;
            }
            tries += 1;
            if tries > 8 {
                return Err(format!("{name}: the connection broke too often. Press Resume to go on."));
            }
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }
    }
}

/// Download in pieces over several connections. Ok(true) = complete, Ok(false) = paused.
async fn dl_pieces(core: &Core, cdn: &str, part: &Path, want: u64, conns: usize, gid: u64, name: &str) -> Result<bool, String> {
    use std::sync::atomic::AtomicU64;
    use std::sync::Arc;
    let sp = state_of(part);
    let mut st: PieceState = std::fs::read_to_string(&sp).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default();
    let len_ok = std::fs::metadata(part).map(|m| m.len() == want).unwrap_or(false);
    if st.size != want || st.segs.is_empty() || !len_ok {
        let f = std::fs::OpenOptions::new().create(true).write(true).truncate(true).open(part).map_err(|e| e.to_string())?;
        f.set_len(want).map_err(|e| format!("Not enough room for {name}? {e}"))?;
        let n = conns.max(1) as u64;
        let step = (want / n).max(1);
        st = PieceState { size: want, segs: (0..n).map(|i| [i * step, if i == n - 1 { want } else { (i + 1) * step }, 0]).collect() };
        let _ = store::write_json(&sp, &st);
    }
    let file = Arc::new(std::fs::OpenOptions::new().read(true).write(true).open(part).map_err(|e| e.to_string())?);
    let counters: Vec<Arc<AtomicU64>> = st.segs.iter().map(|s| Arc::new(AtomicU64::new(s[2]))).collect();
    // keep the list of pieces on the drive, so a closed app or an unplugged drive can go on later
    let stop = Arc::new(AtomicBool::new(false));
    let saver = {
        let (stop, counters, segs, sp) = (stop.clone(), counters.clone(), st.segs.clone(), sp.clone());
        tauri::async_runtime::spawn(async move {
            while !stop.load(Ordering::SeqCst) {
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                let s = PieceState { size: want, segs: segs.iter().zip(&counters).map(|(g, c)| [g[0], g[1], c.load(Ordering::SeqCst)]).collect() };
                let _ = store::write_json(&sp, &s);
            }
        })
    };
    let futs: Vec<_> = st.segs.iter().zip(&counters).map(|(g, c)| piece(core, cdn, &file, g[0], g[1], c, gid, name)).collect();
    let res = futures_util::future::join_all(futs).await;
    stop.store(true, Ordering::SeqCst);
    let _ = saver.await;
    let fin = PieceState { size: want, segs: st.segs.iter().zip(&counters).map(|(g, c)| [g[0], g[1], c.load(Ordering::SeqCst)]).collect() };
    let _ = store::write_json(&sp, &fin);
    if let Some(e) = res.iter().find_map(|r| r.as_ref().err()) {
        return Err(e.clone());
    }
    let complete = fin.segs.iter().all(|s| s[0] + s[2] >= s[1]);
    if complete {
        let _ = std::fs::remove_file(&sp);
    }
    Ok(complete)
}

async fn dl_file(app: &tauri::AppHandle, core: &Core, dir: &Path, gid: u64, f: &LFile, path: &Path, verify: bool, conns: usize) -> Result<DlEnd, String> {
    let part = part_of(path);
    if let Some(d) = path.parent() {
        std::fs::create_dir_all(d).map_err(|e| format!("Cannot make {}: {e}", d.display()))?;
    }
    let tok = token(core).await?;
    let (mut cdn, _) = resolve(core, &tok, &f.downlink).await?;
    let mut want = f.real;
    if want == 0 {
        // no checksum file: ask the download server how big the file really is
        if let Some(n) = probe_size(&cdn).await {
            want = n;
            store_real(dir, f, n);
        }
    }
    let mut got_md5: Option<String> = None;
    let pieces = want >= 64 << 20 && conns > 1;
    let mut done = false;
    if pieces || state_of(&part).exists() {
        match dl_pieces(core, &cdn, &part, want, conns.max(1), gid, &f.fname).await {
            Ok(true) => done = true,
            Ok(false) => return Ok(DlEnd::Paused),
            Err(e) if e == "NORANGE" => {
                // this server only gives whole files: one connection, from the start
                let _ = std::fs::remove_file(state_of(&part));
                let _ = std::fs::remove_file(&part);
            }
            Err(e) => return Err(e),
        }
    }
    if !done {
        let mut have = std::fs::metadata(&part).map(|m| m.len()).unwrap_or(0);
        if want > 0 && have > want {
            let _ = std::fs::remove_file(&part);
            have = 0;
        }
        // from the start: the MD5 is worked out while downloading, no second read afterwards
        let mut hasher = if have == 0 { Some(Md5::new()) } else { None };
        let mut tries = 0u32;
        let mut last_err = String::new();
        while want == 0 || have < want {
            if tries > 0 {
                if tries > 8 {
                    return Err(format!("{}: {last_err}. The connection broke too often. Press Resume to go on.", f.fname));
                }
                tokio::time::sleep(std::time::Duration::from_secs((2 * tries as u64).min(20))).await;
                // a fresh address: GOG's download links do not last forever
                if let Ok(t) = token(core).await {
                    if let Ok((c2, _)) = resolve(core, &t, &f.downlink).await {
                        cdn = c2;
                    }
                }
            }
            let mut req = dl_client().get(&cdn).header("User-Agent", UA);
            if have > 0 {
                req = req.header(reqwest::header::RANGE, format!("bytes={have}-"));
            }
            let res = match req.send().await {
                Ok(r) => r,
                Err(e) => {
                    last_err = e.to_string();
                    tries += 1;
                    continue;
                }
            };
            let code = res.status().as_u16();
            if code == 200 && have > 0 {
                // the server ignored the resume: start this file again
                have = 0;
                hasher = Some(Md5::new());
            } else if code != 200 && code != 206 {
                last_err = format!("GOG answered {code}");
                tries += 1;
                continue;
            }
            let out = std::fs::OpenOptions::new().create(true).write(true).append(have > 0).truncate(have == 0).open(&part).map_err(|e| e.to_string())?;
            let mut out = std::io::BufWriter::with_capacity(BUF, out);
            let mut stream = res.bytes_stream();
            let mut pend = 0u64;
            let start = have;
            let mut broke = false;
            while let Some(chunk) = stream.next().await {
                let b = match chunk {
                    Ok(b) => b,
                    Err(e) => {
                        last_err = e.to_string();
                        broke = true;
                        break;
                    }
                };
                out.write_all(&b).map_err(|e| format!("Cannot write {}: {e}", part.display()))?;
                if let Some(h) = hasher.as_mut() {
                    h.update(&b);
                }
                have += b.len() as u64;
                pend += b.len() as u64;
                if pend >= 1 << 20 {
                    add_done(gid, pend, &f.fname);
                    pend = 0;
                }
                if PAUSE.load(Ordering::SeqCst) {
                    let _ = out.flush();
                    add_done(gid, pend, &f.fname);
                    return Ok(DlEnd::Paused);
                }
            }
            add_done(gid, pend, &f.fname);
            out.flush().map_err(|e| e.to_string())?;
            drop(out);
            if have - start > 8 << 20 {
                tries = 0;
            }
            if broke || (want > 0 && have < want) {
                if !broke {
                    last_err = format!("the download stopped early ({have} of {want} bytes)");
                }
                tries += 1;
                continue;
            }
            if want == 0 {
                break;
            }
        }
        got_md5 = hasher.map(|h| hex::encode(h.finalize()));
        if f.real == 0 && want == 0 && have > 0 {
            store_real(dir, f, have);
        }
    }
    if verify && !f.md5.is_empty() {
        let got = match got_md5 {
            Some(m) => m,
            None => {
                {
                    let mut p = progs();
                    if let Some(x) = p.0.get_mut(&gid) {
                        x.state = "check".into();
                        x.file = f.fname.clone();
                    }
                }
                emit_q(app, dir);
                let pp = part.clone();
                tokio::task::spawn_blocking(move || md5_file(&pp)).await.map_err(|e| e.to_string())??
            }
        };
        if got != f.md5 {
            // maybe GOG changed its checksum: ask once more before giving up
            let fresh = fresh_file(core, dir, f).await;
            if fresh.map(|x| x.md5 != got).unwrap_or(true) {
                let _ = std::fs::remove_file(&part);
                return Err(format!("{}: MD5 does not match GOG's. The file was removed, download it again.", f.fname));
            }
        }
    }
    std::fs::rename(&part, path).map_err(|e| e.to_string())?;
    if let Ok(m) = std::fs::metadata(path) {
        let rel = path.strip_prefix(dir).map(|r| r.to_string_lossy().to_string()).unwrap_or_default();
        if !f.md5.is_empty() && verify {
            ver_put(dir, &rel, Verified { size: m.len(), mtime: mtime(&m), md5: f.md5.clone() });
        }
    }
    Ok(DlEnd::Done)
}

/// After all new files of a game are in: older installers to _duplicates (or deleted).
fn finish_game(core: &Core, dir: &Path, gv: &GView, old_mode: &str) {
    for rel in &gv.old {
        let src = dir.join(rel);
        if old_mode == "delete" {
            let _ = std::fs::remove_file(&src);
            continue;
        }
        let dst = dir.join("_duplicates").join(rel);
        if let Some(d) = dst.parent() {
            let _ = std::fs::create_dir_all(d);
        }
        if std::fs::rename(&src, &dst).is_err() {
            if std::fs::copy(&src, &dst).is_ok() {
                let _ = std::fs::remove_file(&src);
            }
        }
    }
    if !gv.old.is_empty() {
        core.log(format!("GOG: {}: {} older file(s) {}", gv.title, gv.old.len(), if old_mode == "delete" { "deleted" } else { "moved to _duplicates" }));
    }
}

async fn worker(app: tauri::AppHandle) {
    let core = app.state::<Core>();
    let core: &Core = &core;
    let dir = gog_dir(core);
    PAUSE.store(false, Ordering::SeqCst);
    // the speed per game and in total, once a second
    {
        let (app, dir) = (app.clone(), dir.clone());
        tauri::async_runtime::spawn(async move {
            let mut last: HashMap<u64, u64> = HashMap::new();
            let mut t = std::time::Instant::now();
            tokio::time::sleep(std::time::Duration::from_millis(300)).await;
            while RUNNING.load(Ordering::SeqCst) {
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                let dt = t.elapsed().as_secs_f64().max(0.2);
                t = std::time::Instant::now();
                {
                    let mut p = progs();
                    let mut total = 0u64;
                    for (id, x) in p.0.iter_mut() {
                        let before = last.insert(*id, x.done).unwrap_or(x.done);
                        x.speed = if x.state == "run" { (x.done.saturating_sub(before) as f64 / dt) as u64 } else { 0 };
                        total += x.speed;
                    }
                    p.1 = total;
                }
                emit_q(&app, &dir);
            }
        });
    }
    loop {
        let q = load_q(&dir);
        let c = cfg().clone();
        let lib = load_lib(&dir);
        let ver = load_ver(&dir);
        let gd = if c.gd_db.is_empty() { HashMap::new() } else { gd_md5s(&c.gd_db) };
        // games still waiting, in queue order
        let todo: Vec<(LGame, GView)> = q
            .ids
            .iter()
            .filter_map(|id| lib.games.iter().find(|g| g.id == *id))
            .filter(|g| progs().0.get(&g.id).map(|p| p.state != "err" && p.state != "done").unwrap_or(true))
            .map(|g| (g.clone(), game_view(&c, &dir, g, &ver, &gd)))
            .collect();
        if !drive_ok(&dir) {
            PAUSE.store(true, Ordering::SeqCst);
            if !DRIVE_GONE.swap(true, Ordering::SeqCst) {
                core.log(format!("GOG: the folder {} is not there (drive unplugged?). Downloads are paused.", dir.display()));
                let _ = app.emit("gog-drive", false);
            }
            break;
        }
        if todo.is_empty() || PAUSE.load(Ordering::SeqCst) {
            break;
        }
        {
            let mut p = progs();
            for (g, v) in &todo {
                let e = p.0.entry(g.id).or_default();
                e.id = g.id;
                e.title = g.title.clone();
                e.total = v.files.iter().filter(|f| f.st != "ok").map(|f| f.size).sum();
                e.done = v.files.iter().filter(|f| f.st == "part").map(|f| f.done).sum();
                if e.state.is_empty() || e.state == "done" {
                    e.state = "wait".into();
                }
            }
        }
        emit_q(&app, &dir);
        let par = c.parallel.clamp(1, 4) as usize;
        // all connections together stay at 12 or less, so GOG does not slow you down
        let conns = (c.conns.clamp(1, 8) as usize).min((12 / par).max(1));
        let mut st = futures_util::stream::iter(
            todo.into_iter()
                .map(|(g, v)| {
                    let c = c.clone();
                    let dir = dir.clone();
                    let app = app.clone();
                    async move {
                        // enough room for what is still to come? (pieces already took their room)
                        let need: u64 = v
                            .files
                            .iter()
                            .filter(|f| f.st != "ok")
                            .map(|f| {
                                let p = dir.join(&f.rel);
                                let taken = std::fs::metadata(part_of(&p)).map(|m| m.len()).unwrap_or(0).max(if f.st == "small" { f.disk } else { 0 });
                                f.size.saturating_sub(taken)
                            })
                            .sum();
                        let free = fs2::available_space(&dir).unwrap_or(u64::MAX);
                        if need + (1 << 30) > free {
                            return (
                                g.id,
                                v,
                                Err(format!(
                                    "NOSPACE:Not enough room: {} needs {:.1} GB, {:.1} GB is free. Make room, then press Resume.",
                                    g.title,
                                    need as f64 / 1073741824.0,
                                    free as f64 / 1073741824.0
                                )),
                            );
                        }
                        for fv in v.files.iter().filter(|f| f.st != "ok") {
                            if !drive_ok(&dir) {
                                return (g.id, v, Ok(false));
                            }
                            let Some(f) =
                                g.files.iter().find(|f| path_of(&c, &dir, &g, f).strip_prefix(&dir).map(|r| r.to_string_lossy() == fv.rel).unwrap_or(false))
                            else {
                                continue;
                            };
                            let mut f = f.clone();
                            let p = path_of(&c, &dir, &g, &f);
                            let mut file_conns = conns;
                            if fv.st == "small" {
                                // an interrupted download (gog-downloader writes straight into the name): go on where it stopped
                                if let Some(nf) = fresh_file(core, &dir, &f).await {
                                    if nf.fits(fv.disk) {
                                        continue;
                                    }
                                    f = nf;
                                }
                                let part = part_of(&p);
                                let _ = std::fs::remove_file(state_of(&part));
                                if !part.exists() {
                                    let _ = std::fs::rename(&p, &part);
                                }
                                file_conns = 1;
                            }
                            if fv.st == "bad" || fv.st == "changed" {
                                // ask GOG again first: maybe only its list was out of date
                                if let Some(nf) = fresh_file(core, &dir, &f).await {
                                    let disk = std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
                                    let checked = load_ver(&dir).get(&fv.rel).map(|x| x.md5.clone()).unwrap_or_default();
                                    if nf.fits(disk) && (fv.md5 != "bad" || checked == nf.md5) {
                                        core.log(format!("GOG: {} is fine after all (GOG's list was out of date)", nf.fname));
                                        continue;
                                    }
                                    f = nf;
                                }
                                let _ = std::fs::remove_file(&p);
                            }
                            let p = path_of(&c, &dir, &g, &f);
                            match dl_file(&app, core, &dir, g.id, &f, &p, c.verify, file_conns).await {
                                Ok(DlEnd::Done) => {}
                                Ok(DlEnd::Paused) => return (g.id, v, Ok(false)),
                                // the drive went away: that is a pause, not a broken game
                                Err(_) if !drive_ok(&dir) => return (g.id, v, Ok(false)),
                                Err(e) => return (g.id, v, Err(e)),
                            }
                        }
                        (g.id, v, Ok(true))
                    }
                })
                .collect::<Vec<_>>(),
        )
        .buffer_unordered(par);
        let mut any_done = false;
        while let Some((id, v, r)) = st.next().await {
            match r {
                Ok(true) => {
                    finish_game(core, &dir, &v, &c.old);
                    let mut q = load_q(&dir);
                    q.ids.retain(|x| *x != id);
                    save_q(&dir, &q);
                    if let Some(p) = progs().0.get_mut(&id) {
                        p.state = "done".into();
                        p.done = p.total;
                    }
                    core.log(format!("GOG: {} downloaded and checked", v.title));
                    copy_covers_now(core);
                    any_done = true;
                }
                Ok(false) => {
                    if !drive_ok(&dir) && !DRIVE_GONE.swap(true, Ordering::SeqCst) {
                        PAUSE.store(true, Ordering::SeqCst);
                        core.log(format!("GOG: the folder {} is gone (drive unplugged?). Downloads are paused.", dir.display()));
                        let _ = app.emit("gog-drive", false);
                    }
                }
                Err(e) => {
                    let e = e.strip_prefix("NOSPACE:").map(String::from).unwrap_or(e);
                    core.log(format!("GOG: {e}"));
                    if let Some(p) = progs().0.get_mut(&id) {
                        p.state = "err".into();
                        p.err = e;
                    }
                }
            }
            emit_q(&app, &dir);
            let _ = app.emit("gog-changed", ());
        }
        drop(st);
        if !any_done {
            break;
        }
    }
    RUNNING.store(false, Ordering::SeqCst);
    if PAUSE.load(Ordering::SeqCst) {
        let mut c = cfg();
        c.paused_at = store::now();
        let _ = save(&c);
    }
    emit_q(&app, &dir);
    let _ = app.emit("gog-changed", ());
}

fn start_worker(app: &tauri::AppHandle) {
    if RUNNING.swap(true, Ordering::SeqCst) {
        return;
    }
    let h = app.clone();
    tauri::async_runtime::spawn(worker(h));
}

#[tauri::command]
pub fn gog_download(app: tauri::AppHandle, core: tauri::State<Core>, ids: Vec<u64>) -> Result<QView, String> {
    if cfg().token.is_none() {
        return Err("Sign in to GOG first, in GOG Settings.".into());
    }
    let dir = gog_dir(&core);
    gone_guard(&dir)?;
    std::fs::create_dir_all(meta_dir(&dir)).map_err(|e| format!("Cannot write to {}: {e}", dir.display()))?;
    let mut q = load_q(&dir);
    for id in ids {
        if !q.ids.contains(&id) {
            q.ids.push(id);
        }
        progs().0.remove(&id);
    }
    save_q(&dir, &q);
    DRIVE_GONE.store(false, Ordering::SeqCst);
    PAUSE.store(false, Ordering::SeqCst);
    start_worker(&app);
    Ok(qview(&dir))
}
#[tauri::command]
pub fn gog_pause(core: tauri::State<Core>) -> QView {
    PAUSE.store(true, Ordering::SeqCst);
    qview(&gog_dir(&core))
}
#[tauri::command]
pub fn gog_resume(app: tauri::AppHandle, core: tauri::State<Core>) -> Result<QView, String> {
    let dir = gog_dir(&core);
    {
        let mut p = progs();
        p.0.retain(|_, x| x.state != "err");
    }
    if !drive_ok(&dir) {
        return Err(format!("The GOG folder {} is not there. Plug the drive in, then press Resume.", dir.display()));
    }
    DRIVE_GONE.store(false, Ordering::SeqCst);
    PAUSE.store(false, Ordering::SeqCst);
    start_worker(&app);
    Ok(qview(&dir))
}
/// Take games out of the queue (what was downloaded stays).
#[tauri::command]
pub fn gog_unqueue(app: tauri::AppHandle, core: tauri::State<Core>, ids: Vec<u64>) -> QView {
    let dir = gog_dir(&core);
    let mut q = load_q(&dir);
    q.ids.retain(|x| !ids.contains(x));
    save_q(&dir, &q);
    for id in ids {
        progs().0.remove(&id);
    }
    emit_q(&app, &dir);
    qview(&dir)
}

// ------------------------------------------------------------------ check files (MD5)

static CHECKING: AtomicBool = AtomicBool::new(false);
static STOP_CHECK: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn gog_check(app: tauri::AppHandle, core: tauri::State<'_, Core>, ids: Option<Vec<u64>>) -> Result<usize, String> {
    if CHECKING.swap(true, Ordering::SeqCst) {
        return Err("Files are already being checked".into());
    }
    STOP_CHECK.store(false, Ordering::SeqCst);
    let core: &Core = &core;
    let c = cfg().clone();
    let dir = gog_dir(core);
    let lib = load_lib(&dir);
    let mut todo = vec![];
    for g in lib.games.iter().filter(|g| ids.as_ref().map(|i| i.contains(&g.id)).unwrap_or(true)) {
        for f in g.files.iter().filter(|f| !f.md5.is_empty() && (f.kind == "extra" || c.os.contains(&f.os))) {
            let p = path_of(&c, &dir, g, f);
            if let Ok(m) = std::fs::metadata(&p) {
                todo.push((g.title.clone(), f.md5.clone(), p, m.len(), f.clone()));
            }
        }
    }
    let total: u64 = todo.iter().map(|t| t.3).sum();
    let mut done_b = 0u64;
    let mut bad = 0usize;
    for (i, (title, want, p, size, lf)) in todo.iter().enumerate() {
        if STOP_CHECK.load(Ordering::SeqCst) {
            break;
        }
        let _ = app.emit("gog-check", serde_json::json!({ "n": i, "count": todo.len(), "done": done_b, "total": total, "title": title }));
        let pp = p.clone();
        let got = tokio::task::spawn_blocking(move || md5_file(&pp)).await.map_err(|e| e.to_string())?;
        done_b += size;
        if let (Ok(got), Ok(m)) = (got, std::fs::metadata(p)) {
            if got != *want {
                // ask GOG once more: its checksum may have changed since the last Update list
                let again = fresh_file(core, &dir, lf).await.map(|x| x.md5 == got).unwrap_or(false);
                if !again {
                    bad += 1;
                    core.log(format!("GOG: {} does not match GOG's MD5", p.display()));
                }
            }
            let rel = p.strip_prefix(&dir).map(|r| r.to_string_lossy().to_string()).unwrap_or_default();
            ver_put(&dir, &rel, Verified { size: m.len(), mtime: mtime(&m), md5: got });
        }
    }
    CHECKING.store(false, Ordering::SeqCst);
    let _ = app.emit("gog-check", serde_json::json!({ "end": true, "bad": bad }));
    let _ = app.emit("gog-changed", ());
    Ok(bad)
}
#[tauri::command]
pub fn gog_check_stop() {
    STOP_CHECK.store(true, Ordering::SeqCst);
}

/// For the self-test of this module only (EMUVAULT_GOG_SELFTEST).
#[tauri::command]
pub fn gog_selftest_path() -> String {
    std::env::var("EMUVAULT_GOG_SELFTEST").unwrap_or_default()
}

// ------------------------------------------------------------------ in the background: only checking, never downloading

/// Let the screens show pictures from the small-covers folder (inside ~/.config) and from the GOG folder.
fn allow_pictures(app: &tauri::AppHandle) {
    let s = app.asset_protocol_scope();
    let _ = std::fs::create_dir_all(thumb_dir());
    let _ = s.allow_directory(thumb_dir(), true);
    let core = app.state::<Core>();
    let _ = s.allow_directory(cover_dir(&gog_dir(&core)), true);
    let _ = s.allow_directory(gog_dir(&core), true);
}
pub fn start(app: tauri::AppHandle) {
    allow_pictures(&app);
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_secs(25)).await;
        let mut first = true;
        loop {
            let (on, signed, bg, last) = {
                let c = cfg();
                (c.on, c.token.is_some(), c.bg.clone(), c.last_check_ts)
            };
            let age = now_ts() - last;
            let due = on
                && signed
                && match bg.as_str() {
                    "start" => first,
                    "daily" => age > 24 * 3600,
                    "weekly" => age > 7 * 24 * 3600,
                    _ => false,
                };
            first = false;
            if due {
                let core = app.state::<Core>();
                if let Ok(s) = do_refresh(&app, &core).await {
                    if s.new_since > 0 && cfg().notify {
                        use tauri_plugin_notification::NotificationExt;
                        let _ = app
                            .notification()
                            .builder()
                            .title("GOG")
                            .body(format!("{} game{} on GOG need a download", s.need, if s.need == 1 { "" } else { "s" }))
                            .show();
                    }
                }
            }
            tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
        }
    });
}

// ------------------------------------------------------------------ Heroic Games Launcher in the vault
//
// <main folder>/Launchers/Heroic/
//   app/<version>/Heroic.AppImage, current.AppImage -> app/<version>/Heroic.AppImage
//   home/            Heroic's HOME: .config/heroic (settings, login, Wine/Proton, game list), Games/Heroic (prefixes)
//   heroic.sh        starts Heroic with that HOME
// Games installed from your backups go to <main folder>/Games/<gog name>/ and are added to Heroic as "added games".

fn heroic_dir(core: &Core) -> PathBuf {
    Path::new(&vault_root(core)).join("Launchers").join("Heroic")
}
fn heroic_home(core: &Core) -> PathBuf {
    heroic_dir(core).join("home")
}
fn heroic_cfg(core: &Core) -> PathBuf {
    heroic_home(core).join(".config").join("heroic")
}
fn heroic_games(core: &Core) -> PathBuf {
    let d = cfg().heroic_games.clone();
    if d.trim().is_empty() {
        Path::new(&vault_root(core)).join("Games")
    } else {
        PathBuf::from(d.trim())
    }
}
fn gh_api() -> String {
    env_or("EMUVAULT_GH_API", "https://api.github.com")
}
const HEROIC_REPO: &str = "Heroic-Games-Launcher/HeroicGamesLauncher";

#[derive(Serialize, Clone, Default)]
pub struct HeroicGame {
    pub runner: String,
    pub app_name: String,
    pub path: String,
}
#[derive(Serialize, Clone, Default)]
pub struct HeroicView {
    pub have: bool,
    pub ver: String,
    pub latest: String,
    pub own: bool,
    pub dir: String,
    pub games_dir: String,
    /// GOG id -> how Heroic knows it
    pub installed: HashMap<String, HeroicGame>,
    pub running: bool,
}

fn heroic_ver(core: &Core) -> String {
    let cur = heroic_dir(core).join("current.AppImage");
    std::fs::read_link(&cur).ok().and_then(|t| t.parent().and_then(|p| p.file_name()).map(|n| n.to_string_lossy().to_string())).unwrap_or_default()
}
fn read_val(p: &Path) -> serde_json::Value {
    std::fs::read_to_string(p).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or(serde_json::json!({}))
}
fn sideload_path(core: &Core) -> PathBuf {
    heroic_cfg(core).join("sideload_apps").join("library.json")
}

fn heroic_installed(core: &Core, lib: &Lib) -> HashMap<String, HeroicGame> {
    let mut m = HashMap::new();
    // games Heroic downloaded itself
    let gi = read_val(&heroic_cfg(core).join("gog_store").join("installed.json"));
    for g in gi["installed"].as_array().cloned().unwrap_or_default() {
        if let Some(id) = g["appName"].as_str() {
            m.insert(id.to_string(), HeroicGame { runner: "gog".into(), app_name: id.into(), path: g["install_path"].as_str().unwrap_or("").into() });
        }
    }
    // added games: ours are called emuvault-<id>; others are matched by title
    let sl = read_val(&sideload_path(core));
    for g in sl["games"].as_array().cloned().unwrap_or_default() {
        let an = g["app_name"].as_str().unwrap_or("").to_string();
        let id = an.strip_prefix("emuvault-").map(String::from).or_else(|| {
            let t = g["title"].as_str().unwrap_or("").to_lowercase();
            lib.games.iter().find(|x| x.title.to_lowercase() == t).map(|x| x.id.to_string())
        });
        if let Some(id) = id {
            m.entry(id).or_insert(HeroicGame { runner: "sideload".into(), app_name: an, path: g["folder_name"].as_str().unwrap_or("").into() });
        }
    }
    m
}
fn heroic_running() -> bool {
    std::fs::read_dir("/proc")
        .map(|rd| {
            rd.flatten().any(|e| {
                std::fs::read(e.path().join("cmdline"))
                    .map(|c| {
                        let s = String::from_utf8_lossy(&c).to_lowercase();
                        (s.contains("heroic.appimage") || s.contains("/heroic\0") || s.contains("heroic-games-launcher")) && !s.contains("emu-vault")
                    })
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false)
}
fn heroic_view(core: &Core) -> HeroicView {
    let d = heroic_dir(core);
    let lib = load_lib(&gog_dir(core));
    HeroicView {
        have: d.join("current.AppImage").exists(),
        ver: heroic_ver(core),
        latest: std::fs::read_to_string(d.join("latest.txt")).unwrap_or_default().trim().to_string(),
        own: d.join("own.txt").exists(),
        dir: d.to_string_lossy().into(),
        games_dir: heroic_games(core).to_string_lossy().into(),
        installed: heroic_installed(core, &lib),
        running: heroic_running(),
    }
}

fn write_heroic_sh(core: &Core) -> Result<PathBuf, String> {
    let d = heroic_dir(core);
    std::fs::create_dir_all(heroic_cfg(core)).map_err(|e| e.to_string())?;
    let sh = d.join("heroic.sh");
    let text = "#!/bin/sh\n# Heroic Games Launcher from the vault: its settings, login and Wine stay in home/ next to this file\nD=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\nexport HOME=\"$D/home\"\nexport XDG_CONFIG_HOME=\"$HOME/.config\"\nexport XDG_DATA_HOME=\"$HOME/.local/share\"\nexec \"$D/current.AppImage\" \"$@\"\n";
    std::fs::write(&sh, text).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&sh, std::fs::Permissions::from_mode(0o755));
    }
    Ok(sh)
}
/// For the full package: Heroic's files are in app/<ver>/, make it the one in use.
pub fn heroic_put(core: &Core, ver: &str) -> Result<(), String> {
    set_current(core, ver)
}
fn set_current(core: &Core, ver: &str) -> Result<(), String> {
    let d = heroic_dir(core);
    let cur = d.join("current.AppImage");
    let _ = std::fs::remove_file(&cur);
    #[cfg(unix)]
    std::os::unix::fs::symlink(Path::new("app").join(ver).join("Heroic.AppImage"), &cur).map_err(|e| e.to_string())?;
    // keep the newest two versions
    if let Ok(rd) = std::fs::read_dir(d.join("app")) {
        let mut vs: Vec<(std::time::SystemTime, PathBuf)> =
            rd.flatten().filter(|e| e.path().is_dir()).map(|e| (e.metadata().and_then(|m| m.modified()).unwrap_or(std::time::UNIX_EPOCH), e.path())).collect();
        vs.sort_by(|a, b| b.0.cmp(&a.0));
        for (_, p) in vs.into_iter().skip(2) {
            if p.file_name().map(|n| n != ver).unwrap_or(true) {
                let _ = std::fs::remove_dir_all(p);
            }
        }
    }
    write_heroic_sh(core)?;
    Ok(())
}

/// The newest Heroic on GitHub: (version, AppImage address)
async fn heroic_latest(core: &Core) -> Result<(String, String), String> {
    let r = core
        .client
        .get(format!("{}/repos/{HEROIC_REPO}/releases/latest", gh_api()))
        .header("User-Agent", UA)
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("GitHub: {e}"))?;
    if !r.status().is_success() {
        return Err(format!("GitHub answered {}", r.status()));
    }
    let v: serde_json::Value = r.json().await.map_err(|e| e.to_string())?;
    let ver = v["tag_name"].as_str().unwrap_or("").trim_start_matches('v').to_string();
    let a = v["assets"].as_array().cloned().unwrap_or_default();
    let url = a
        .iter()
        .find(|x| x["name"].as_str().map(|n| n.ends_with("linux-x86_64.AppImage")).unwrap_or(false))
        .and_then(|x| x["browser_download_url"].as_str())
        .ok_or("No Linux AppImage in Heroic's newest release")?;
    Ok((ver, url.to_string()))
}

#[tauri::command]
pub async fn heroic_status(core: tauri::State<'_, Core>, check: Option<bool>) -> Result<HeroicView, String> {
    let core: &Core = &core;
    if check.unwrap_or(false) {
        if let Ok((v, _)) = heroic_latest(core).await {
            let _ = std::fs::create_dir_all(heroic_dir(core));
            let _ = std::fs::write(heroic_dir(core).join("latest.txt"), &v);
        }
    }
    Ok(heroic_view(core))
}

/// Get or update Heroic from GitHub into the vault.
#[tauri::command]
pub async fn heroic_get(app: tauri::AppHandle, core: tauri::State<'_, Core>) -> Result<HeroicView, String> {
    let core: &Core = &core;
    let (ver, url) = heroic_latest(core).await?;
    let d = heroic_dir(core);
    let to = d.join("app").join(&ver);
    std::fs::create_dir_all(&to).map_err(|e| e.to_string())?;
    let dst = to.join("Heroic.AppImage");
    if !dst.exists() {
        let part = to.join("Heroic.AppImage.part");
        let r = core.client.get(&url).header("User-Agent", UA).send().await.map_err(|e| format!("Heroic download: {e}"))?;
        if !r.status().is_success() {
            return Err(format!("Heroic download: {}", r.status()));
        }
        let total = r.content_length().unwrap_or(0);
        let mut f = std::fs::File::create(&part).map_err(|e| e.to_string())?;
        let mut st = r.bytes_stream();
        let mut got = 0u64;
        let mut last = std::time::Instant::now();
        while let Some(c) = st.next().await {
            let b = c.map_err(|e| e.to_string())?;
            f.write_all(&b).map_err(|e| e.to_string())?;
            got += b.len() as u64;
            if last.elapsed().as_millis() > 400 {
                last = std::time::Instant::now();
                let _ = app.emit("heroic-progress", serde_json::json!({ "done": got, "total": total }));
            }
        }
        drop(f);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&part, std::fs::Permissions::from_mode(0o755));
        }
        std::fs::rename(&part, &dst).map_err(|e| e.to_string())?;
    }
    let _ = std::fs::remove_file(d.join("own.txt"));
    set_current(core, &ver)?;
    let _ = std::fs::write(d.join("latest.txt"), &ver);
    core.log(format!("Heroic {ver} is in the vault"));
    Ok(heroic_view(core))
}

/// Use your own Heroic AppImage: it is copied into the vault. Optionally take your Heroic settings along (without its Wine/Proton tools).
#[tauri::command]
pub fn heroic_own(core: tauri::State<Core>, path: String, copy_settings: bool) -> Result<HeroicView, String> {
    let src = PathBuf::from(&path);
    if !src.is_file() {
        return Err("Pick the Heroic AppImage file".into());
    }
    let name = src.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let ver = regex::Regex::new(r"(\d+\.\d+\.\d+)").ok().and_then(|re| re.captures(&name).map(|c| c[1].to_string())).unwrap_or_else(|| "own".into());
    let d = heroic_dir(&core);
    let to = d.join("app").join(&ver);
    std::fs::create_dir_all(&to).map_err(|e| e.to_string())?;
    std::fs::copy(&src, to.join("Heroic.AppImage")).map_err(|e| format!("Could not copy {path}: {e}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(to.join("Heroic.AppImage"), std::fs::Permissions::from_mode(0o755));
    }
    set_current(&core, &ver)?;
    let _ = std::fs::write(d.join("own.txt"), &path);
    if copy_settings {
        let from = dirs::config_dir().unwrap_or_default().join("heroic");
        let dst = heroic_cfg(&core);
        if from.is_dir() && !dst.join("config.json").exists() {
            copy_tree(&from, &dst, &["tools", "logs", "Cache", "Code Cache", "GPUCache"]).map_err(|e| format!("Settings not copied: {e}"))?;
        }
    }
    core.log(format!("Heroic: using your own AppImage ({ver})"));
    Ok(heroic_view(&core))
}
fn copy_tree(from: &Path, to: &Path, skip: &[&str]) -> std::io::Result<()> {
    std::fs::create_dir_all(to)?;
    for e in std::fs::read_dir(from)?.flatten() {
        let n = e.file_name();
        if skip.iter().any(|s| n == *s) {
            continue;
        }
        let p = e.path();
        if p.is_symlink() {
            continue;
        }
        if p.is_dir() {
            copy_tree(&p, &to.join(&n), &[])?
        } else {
            std::fs::copy(&p, to.join(&n)).map(|_| ())?
        }
    }
    Ok(())
}

fn spawn_heroic(core: &Core, args: &[String]) -> Result<(), String> {
    crate::linux_only("Starting Heroic")?;
    let sh = write_heroic_sh(core)?;
    if !heroic_dir(core).join("current.AppImage").exists() {
        return Err("Heroic is not in the vault yet. Press Get Heroic in GOG Settings.".into());
    }
    std::process::Command::new("sh")
        .arg(&sh)
        .args(args)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Heroic did not start: {e}"))?;
    Ok(())
}
#[tauri::command]
pub fn heroic_start(core: tauri::State<Core>) -> Result<(), String> {
    spawn_heroic(&core, &[])
}
#[tauri::command]
pub fn heroic_play(core: tauri::State<Core>, id: u64) -> Result<(), String> {
    let lib = load_lib(&gog_dir(&core));
    let m = heroic_installed(&core, &lib);
    let g = m.get(&id.to_string()).ok_or("This game is not installed in Heroic")?;
    spawn_heroic(&core, &[format!("heroic://launch?appName={}&runner={}", enc(&g.app_name), g.runner)])
}
#[tauri::command]
pub fn heroic_set_games(core: tauri::State<Core>, dir: String) -> Result<HeroicView, String> {
    {
        let mut c = cfg();
        c.heroic_games = dir.trim().trim_end_matches('/').to_string();
        save(&c)?;
    }
    Ok(heroic_view(&core))
}

#[derive(Serialize, Default)]
pub struct InstallRes {
    /// done | windows
    pub how: String,
    pub path: String,
    /// for Windows games: the setup file to run in Heroic
    pub setup: String,
}

/// Unpack a GOG Linux installer (.sh: a shell script with a zip behind it) without running it: data/noarch/* -> dest.
fn unpack_gog_sh(sh: &Path, dest: &Path) -> Result<PathBuf, String> {
    let f = std::fs::File::open(sh).map_err(|e| e.to_string())?;
    let mut z = zip::ZipArchive::new(std::io::BufReader::new(f)).map_err(|e| format!("{}: not a GOG Linux installer ({e})", sh.display()))?;
    std::fs::create_dir_all(dest).map_err(|e| e.to_string())?;
    let mut n = 0;
    for i in 0..z.len() {
        let mut e = z.by_index(i).map_err(|e| e.to_string())?;
        let name = e.name().to_string();
        let Some(rel) = name.strip_prefix("data/noarch/") else { continue };
        if rel.is_empty() || rel.split('/').any(|c| c == "..") {
            continue;
        }
        let out = dest.join(rel);
        if e.is_dir() {
            std::fs::create_dir_all(&out).map_err(|e| e.to_string())?;
            continue;
        }
        if let Some(p) = out.parent() {
            std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
        }
        let mut w = std::fs::File::create(&out).map_err(|e| format!("{}: {e}", out.display()))?;
        std::io::copy(&mut e, &mut w).map_err(|e| e.to_string())?;
        #[cfg(unix)]
        if let Some(mode) = e.unix_mode() {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&out, std::fs::Permissions::from_mode(mode & 0o777));
        }
        n += 1;
    }
    if n == 0 {
        return Err(format!("{}: no game files found inside", sh.display()));
    }
    let start = dest.join("start.sh");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&start, std::fs::Permissions::from_mode(0o755));
    }
    Ok(start)
}

fn add_sideload(core: &Core, id: u64, title: &str, exe: &Path, platform: &str, cover: &str) -> Result<(), String> {
    let p = sideload_path(core);
    let mut v = read_val(&p);
    if !v["games"].is_array() {
        v = serde_json::json!({ "games": [] });
    }
    let an = format!("emuvault-{id}");
    let art = if cover.is_empty() { String::new() } else { format!("file://{cover}") };
    let entry = serde_json::json!({
        "runner": "sideload", "app_name": an, "title": title,
        "install": { "executable": exe.to_string_lossy(), "platform": platform, "is_dlc": false },
        "folder_name": exe.parent().map(|d| d.to_string_lossy().to_string()).unwrap_or_default(),
        "art_cover": art, "art_square": art, "is_installed": true, "canRunOffline": true
    });
    let games = v["games"].as_array_mut().unwrap();
    games.retain(|g| g["app_name"].as_str() != Some(an.as_str()));
    games.push(entry);
    store::write_json(&p, &v)
}

/// Install a game from your backup and add it to Heroic.
/// Linux games are unpacked here. Windows games need Heroic's Wine: Emu Vault gives you the setup file to run in Heroic's "Add game".
#[tauri::command]
pub async fn heroic_install(core: tauri::State<'_, Core>, id: u64) -> Result<InstallRes, String> {
    let core: &Core = &core;
    if !heroic_dir(core).join("current.AppImage").exists() {
        return Err("Get Heroic first (GOG Settings)".into());
    }
    let c = cfg().clone();
    let dir = gog_dir(core);
    let lib = load_lib(&dir);
    let g = lib.games.iter().find(|g| g.id == id).cloned().ok_or("Game not in the list")?;
    let have = |os: &str| g.files.iter().filter(|f| f.kind == "installer" && f.os == os).map(|f| path_of(&c, &dir, &g, f)).find(|p| p.exists());
    let cover = cover_dir(&dir).join(format!("{}.jpg", g.slug));
    let cover = own_cover(&dir, &folder_of(&c, &dir, &g, "windows"), &g.slug).unwrap_or(cover);
    let cover_s = if cover.exists() { cover.to_string_lossy().to_string() } else { String::new() };
    if let Some(sh) = have("linux").filter(|p| p.extension().map(|e| e == "sh").unwrap_or(false)) {
        let dest = heroic_games(core).join(&g.slug);
        let (sh2, dest2) = (sh.clone(), dest.clone());
        let start = tokio::task::spawn_blocking(move || unpack_gog_sh(&sh2, &dest2)).await.map_err(|e| e.to_string())??;
        add_sideload(core, g.id, &g.title, &start, "linux", &cover_s)?;
        core.log(format!("Heroic: {} installed from your backup in {}", g.title, dest.display()));
        return Ok(InstallRes { how: "done".into(), path: dest.to_string_lossy().into(), setup: String::new() });
    }
    if let Some(exe) = have("windows").filter(|p| p.extension().map(|e| e == "exe").unwrap_or(false)) {
        return Ok(InstallRes { how: "windows".into(), path: heroic_games(core).join(&g.slug).to_string_lossy().into(), setup: exe.to_string_lossy().into() });
    }
    Err("Download the game first: no installer of it is on the drive yet".into())
}

// ------------------------------------------------------------------ saves: GOG cloud saves (download only) and your own save folder per game
//
// <saves folder>/<gog name>/cloud/   what GOG keeps online for you (copied here, never changed online)
// <saves folder>/<gog name>/mine/    your own: for games without cloud saves, or copies from your pc
// The saves folder is a save source in Backups, so it is backed up like your emulator saves.

fn saves_root(core: &Core) -> PathBuf {
    let d = cfg().saves_dir.clone();
    if d.trim().is_empty() {
        Path::new(&vault_root(core)).join("Saves").join("GOG")
    } else {
        PathBuf::from(d.trim())
    }
}
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
struct SaveMeta {
    /// None = not asked yet
    supported: Option<bool>,
    client_id: String,
    client_secret: String,
    checked_ts: i64,
    last: String,
    files: usize,
    /// file name -> GOG's hash
    index: HashMap<String, String>,
}
fn saves_meta_path(dir: &Path) -> PathBuf {
    meta_dir(dir).join("saves.json")
}
fn load_saves(dir: &Path) -> HashMap<String, SaveMeta> {
    std::fs::read_to_string(saves_meta_path(dir)).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()
}
fn save_saves(dir: &Path, m: &HashMap<String, SaveMeta>) {
    let _ = store::write_json(&saves_meta_path(dir), m);
}

/// Put the saves folder in Backups (once).
fn saves_in_backups(core: &Core) {
    let p = saves_root(core).to_string_lossy().to_string();
    let mut c = core.cfg.lock().unwrap();
    if !c.save_sources.iter().any(|s| s.path == p) {
        c.save_sources.push(crate::extras::SaveSource { label: "GOG saves".into(), path: p });
        let _ = store::save_config(&c);
    }
}

async fn galaxy_id(core: &Core) -> Result<String, String> {
    let have = cfg().galaxy_id.clone();
    if !have.is_empty() {
        return Ok(have);
    }
    let tok = token(core).await?;
    let v = get_json(core, &tok, &format!("{}/userData.json", embed_base())).await?;
    let id = v["galaxyUserId"]
        .as_str()
        .map(String::from)
        .or_else(|| v["galaxyUserId"].as_u64().map(|n| n.to_string()))
        .ok_or("GOG did not say your Galaxy user id")?;
    let mut c = cfg();
    c.galaxy_id = id.clone();
    let _ = save(&c);
    Ok(id)
}

/// The game's own client (from its build manifest): needed for its cloud saves.
async fn game_client(core: &Core, id: u64) -> Option<(String, String)> {
    let v: serde_json::Value = core
        .client
        .get(format!("{}/products/{id}/os/windows/builds?generation=2", content_base()))
        .header("User-Agent", UA)
        .send()
        .await
        .ok()?
        .json()
        .await
        .ok()?;
    let link = v["items"].as_array()?.first()?["link"].as_str()?.to_string();
    let raw = core.client.get(&link).header("User-Agent", UA).send().await.ok()?.bytes().await.ok()?.to_vec();
    let j: serde_json::Value = serde_json::from_slice(&raw).ok().or_else(|| {
        let mut out = vec![];
        flate2::read::ZlibDecoder::new(&raw[..]).read_to_end(&mut out).ok()?;
        serde_json::from_slice(&out).ok()
    })?;
    Some((j["clientId"].as_str()?.to_string(), j["clientSecret"].as_str()?.to_string()))
}
async fn cloud_supported(core: &Core, cid: &str) -> bool {
    let url = format!("{}/components/galaxy_client/clients/{cid}?component_version=2.0.43", rconfig_base());
    match core.client.get(url).header("User-Agent", UA).send().await {
        Ok(r) => r.json::<serde_json::Value>().await.ok().and_then(|v| v["content"]["cloudStorage"]["quota"].as_u64()).unwrap_or(0) > 0,
        Err(_) => false,
    }
}
async fn game_token(core: &Core, cid: &str, cs: &str) -> Result<String, String> {
    token(core).await?;
    let refresh = cfg().token.clone().map(|t| t.refresh).unwrap_or_default();
    let r = core
        .client
        .get(format!("{}/token", auth_base()))
        .query(&[("client_id", cid), ("client_secret", cs), ("grant_type", "refresh_token"), ("refresh_token", refresh.as_str()), ("without_new_session", "1")])
        .header("User-Agent", UA)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let v: serde_json::Value = r.json().await.map_err(|e| e.to_string())?;
    v["access_token"].as_str().map(String::from).ok_or("GOG gave no key for this game's saves".into())
}

#[derive(Serialize, Default, Clone)]
pub struct SaveView {
    pub id: u64,
    /// yes | no | "" (not asked yet)
    pub cloud: String,
    pub files: usize,
    pub last: String,
    pub cloud_dir: String,
    pub mine_dir: String,
    pub mine_files: usize,
}
fn count_files(p: &Path) -> usize {
    std::fs::read_dir(p).map(|rd| rd.flatten().map(|e| if e.path().is_dir() { count_files(&e.path()) } else { 1 }).sum()).unwrap_or(0)
}
fn save_view(core: &Core, _dir: &Path, g: &LGame, m: Option<&SaveMeta>) -> SaveView {
    let base = saves_root(core).join(&g.slug);
    SaveView {
        id: g.id,
        cloud: match m.and_then(|m| m.supported) {
            Some(true) => "yes".into(),
            Some(false) => "no".into(),
            None => String::new(),
        },
        files: m.map(|m| m.files).unwrap_or(0),
        last: m.map(|m| m.last.clone()).unwrap_or_default(),
        cloud_dir: base.join("cloud").to_string_lossy().into(),
        mine_dir: base.join("mine").to_string_lossy().into(),
        mine_files: count_files(&base.join("mine")),
    }
}

#[tauri::command]
pub fn gog_saves(core: tauri::State<Core>) -> Vec<SaveView> {
    let dir = gog_dir(&core);
    let lib = load_lib(&dir);
    let m = load_saves(&dir);
    lib.games.iter().map(|g| save_view(&core, &dir, g, m.get(&g.id.to_string()))).collect()
}

/// One game's cloud saves into <saves>/<game>/cloud/. Only what changed is downloaded.
async fn saves_one(core: &Core, dir: &Path, g: &LGame, uid: &str, meta: &mut SaveMeta) -> Result<usize, String> {
    if meta.client_id.is_empty() || meta.supported.is_none() || now_ts() - meta.checked_ts > 30 * 24 * 3600 {
        match game_client(core, g.id).await {
            Some((cid, cs)) => {
                meta.supported = Some(cloud_supported(core, &cid).await);
                meta.client_id = cid;
                meta.client_secret = cs;
            }
            None => meta.supported = Some(false),
        }
        meta.checked_ts = now_ts();
    }
    if meta.supported != Some(true) {
        return Ok(0);
    }
    let tok = game_token(core, &meta.client_id, &meta.client_secret).await?;
    let base = format!("{}/v1/{uid}/{}", cloud_base(), meta.client_id);
    let ua = format!("{UA} dont_sync_marker/true");
    let list: serde_json::Value = core
        .client
        .get(&base)
        .bearer_auth(&tok)
        .header("Accept", "application/json")
        .header("User-Agent", &ua)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| format!("cloud saves list: {e}"))?;
    let to = saves_root(core).join(&g.slug).join("cloud");
    let mut n = 0;
    let mut count = 0;
    for f in list.as_array().cloned().unwrap_or_default() {
        let name = f["name"].as_str().unwrap_or("").to_string();
        let hash = f["hash"].as_str().unwrap_or("").to_string();
        // GOG marks deleted files with this hash
        if name.is_empty() || hash == "aadd86936a80ee8a369579c3926f1b3c" || name.split('/').any(|c| c == ".." || c.is_empty()) {
            continue;
        }
        count += 1;
        let dst = to.join(&name);
        if meta.index.get(&name) == Some(&hash) && dst.exists() {
            continue;
        }
        let r = core
            .client
            .get(format!("{base}/{}", name.replace('#', "%23")))
            .bearer_auth(&tok)
            .header("User-Agent", &ua)
            .header("Accept-Encoding", "deflate, gzip")
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if !r.status().is_success() {
            return Err(format!("{name}: GOG answered {}", r.status()));
        }
        let raw = r.bytes().await.map_err(|e| e.to_string())?.to_vec();
        // saves are stored packed (gzip) at GOG
        let mut data = vec![];
        if flate2::read::GzDecoder::new(&raw[..]).read_to_end(&mut data).is_err() || data.is_empty() && !raw.is_empty() {
            data = raw;
        }
        if let Some(p) = dst.parent() {
            std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
        }
        std::fs::write(&dst, data).map_err(|e| format!("Cannot write {}: {e}", dst.display()))?;
        meta.index.insert(name, hash);
        n += 1;
    }
    meta.files = count;
    meta.last = store::now();
    let _ = dir;
    Ok(n)
}

static SAVING: AtomicBool = AtomicBool::new(false);
/// Cloud saves of these games (or of all: the first time GOG is asked per game whether it has cloud saves at all).
async fn saves_get_inner(app: &tauri::AppHandle, core: &Core, ids: Option<Vec<u64>>) -> Result<(usize, usize), String> {
    if SAVING.swap(true, Ordering::SeqCst) {
        return Err("Cloud saves are already being downloaded".into());
    }
    let r = async {
        let dir = gog_dir(core);
        gone_guard(&dir)?;
        let uid = galaxy_id(core).await?;
        let lib = load_lib(&dir);
        let mut all = load_saves(&dir);
        let list: Vec<&LGame> = lib.games.iter().filter(|g| ids.as_ref().map(|i| i.contains(&g.id)).unwrap_or(true)).collect();
        let (mut files, mut games) = (0, 0);
        for (i, g) in list.iter().enumerate() {
            let _ = app.emit("gog-saves", serde_json::json!({ "done": i, "total": list.len(), "title": g.title }));
            let mut m = all.get(&g.id.to_string()).cloned().unwrap_or_default();
            match saves_one(core, &dir, g, &uid, &mut m).await {
                Ok(n) => {
                    files += n;
                    if m.supported == Some(true) {
                        games += 1;
                    }
                }
                Err(e) => core.log(format!("GOG saves, {}: {e}", g.title)),
            }
            all.insert(g.id.to_string(), m);
            if i % 10 == 9 {
                save_saves(&dir, &all);
            }
        }
        save_saves(&dir, &all);
        saves_in_backups(core);
        core.log(format!("GOG: cloud saves of {games} games are in {} ({files} new or changed files)", saves_root(core).display()));
        Ok::<_, String>((games, files))
    }
    .await;
    SAVING.store(false, Ordering::SeqCst);
    let _ = app.emit("gog-saves", serde_json::json!({ "end": true }));
    r
}
#[tauri::command]
pub async fn gog_saves_get(app: tauri::AppHandle, core: tauri::State<'_, Core>, ids: Option<Vec<u64>>) -> Result<(usize, usize), String> {
    saves_get_inner(&app, &core, ids).await
}
/// The folder for a game's saves (made when it is not there yet), for "Open folder".
#[tauri::command]
pub fn gog_saves_dir(core: tauri::State<Core>, slug: String, which: String) -> Result<String, String> {
    let d = saves_root(&core).join(store::safe(&slug)).join(if which == "cloud" { "cloud" } else { "mine" });
    std::fs::create_dir_all(&d).map_err(|e| format!("Cannot make {}: {e}", d.display()))?;
    saves_in_backups(&core);
    Ok(d.to_string_lossy().into())
}
/// Copy a folder with saves (from your pc, Heroic's Wine prefix…) into the game's own save folder.
#[tauri::command]
pub fn gog_saves_copy(core: tauri::State<Core>, slug: String, from: String) -> Result<usize, String> {
    let src = PathBuf::from(&from);
    if !src.is_dir() {
        return Err("Pick a folder".into());
    }
    let name = src.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| "saves".into());
    let to = saves_root(&core).join(store::safe(&slug)).join("mine").join(store::safe(&name));
    copy_tree(&src, &to, &[]).map_err(|e| format!("Not copied: {e}"))?;
    saves_in_backups(&core);
    let n = count_files(&to);
    core.log(format!("GOG: {n} save files of {slug} copied from {from}"));
    Ok(n)
}

#[cfg(test)]
mod t {
    use super::*;
    #[test]
    fn codes() {
        assert_eq!(code_of("https://embed.gog.com/on_login_success?origin=client&code=AbC-12").as_deref(), Some("AbC-12"));
        assert_eq!(code_of("AbC-12").as_deref(), Some("AbC-12"));
        assert_eq!(code_of("https://embed.gog.com/on_login_success?origin=client"), None);
        assert_eq!(custom_name("Baldur's Gate: Enhanced Edition"), "Baldur_s_Gate_Enhanced_Edition");
        assert_eq!(version_in("setup_ai_war_2_5.604_(64bit)_(77001).exe", "setup_ai_war_2_"), "5.604");
        assert_eq!(name_of_url("https://cdn.gog.com/x/setup_a%20b_1.0.exe?t=1"), "setup_a b_1.0.exe");
    }
}

/// Write at a position in the file, on Linux and on Windows (the chunks of a GOG download land in one file).
pub(crate) trait WriteAt {
    fn write_all_at(&self, buf: &[u8], at: u64) -> std::io::Result<()>;
}
impl WriteAt for std::fs::File {
    #[cfg(unix)]
    fn write_all_at(&self, buf: &[u8], at: u64) -> std::io::Result<()> {
        std::os::unix::fs::FileExt::write_all_at(self, buf, at)
    }
    #[cfg(windows)]
    fn write_all_at(&self, mut buf: &[u8], mut at: u64) -> std::io::Result<()> {
        use std::os::windows::fs::FileExt;
        while !buf.is_empty() {
            let n = self.seek_write(buf, at)?;
            if n == 0 {
                return Err(std::io::Error::new(std::io::ErrorKind::WriteZero, "nothing written"));
            }
            buf = &buf[n..];
            at += n as u64;
        }
        Ok(())
    }
}
