//! Finding the newest version of an app online: GitHub, GitLab, Codeberg/Forgejo
//! releases and plain web pages (the way Obtainium's "HTML" source works).

use crate::catalog::{AppDef, LinkStep, Rules};
use regex::{Regex, RegexBuilder};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::cmp::Ordering;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Asset {
    pub name: String,
    pub url: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Release {
    pub tag: String,
    pub title: String,
    pub date: String,
    pub prerelease: bool,
    pub assets: Vec<Asset>,
}

/// What we found for one platform.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Pick {
    pub version: String,
    pub date: String,
    /// None for "track only" apps: we only follow the version.
    pub asset: Option<Asset>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Latest {
    pub android: Option<Pick>,
    pub linux: Option<Pick>,
    pub windows: Option<Pick>,
    pub macos: Option<Pick>,
    pub page: String,
    /// Why a platform has nothing, e.g. "No Linux version".
    pub note_android: String,
    pub note_linux: String,
    pub note_windows: String,
    pub note_macos: String,
    /// Platforms where the release has more than one fitting file: their names, so you can choose once.
    pub choices: HashMap<String, Vec<Asset>>,
    /// 0.10: the same release for another chip, "linux@arm64" -> the best file for it
    #[serde(default)]
    pub extra: HashMap<String, Pick>,
}

pub const PLATS: [&str; 4] = ["android", "linux", "windows", "macos"];

impl Latest {
    pub fn get(&self, plat: &str) -> Option<&Pick> {
        match plat {
            "android" => self.android.as_ref(),
            "linux" => self.linux.as_ref(),
            "windows" => self.windows.as_ref(),
            "macos" => self.macos.as_ref(),
            p if p.contains('@') || p.contains('~') => self.extra.get(p),
            _ => None,
        }
    }
    fn slot(&mut self, plat: &str) -> (&mut Option<Pick>, &mut String) {
        match plat {
            "android" => (&mut self.android, &mut self.note_android),
            "linux" => (&mut self.linux, &mut self.note_linux),
            "windows" => (&mut self.windows, &mut self.note_windows),
            _ => (&mut self.macos, &mut self.note_macos),
        }
    }
    pub fn note(&self, plat: &str) -> &str {
        if plat.contains('@') || plat.contains('~') {
            return if self.extra.contains_key(plat) {
                ""
            } else if plat.contains('@') {
                "No version for this chip in the releases"
            } else {
                "This file is not in the newest release"
            };
        }
        match plat {
            "android" => &self.note_android,
            "linux" => &self.note_linux,
            "windows" => &self.note_windows,
            _ => &self.note_macos,
        }
    }
}

pub fn plat_name(p: &str) -> &'static str {
    match p.split(['@', '~']).next().unwrap_or(p) {
        "android" => "Android",
        "linux" => "Linux",
        "windows" => "Windows",
        _ => "macOS",
    }
}

/// Small cache so unchanged release lists cost nothing (GitHub answers 304).
#[derive(Default)]
pub struct HttpCache {
    pub map: Mutex<HashMap<String, (String, String)>>, // url -> (etag, body)
}

pub struct Ctx<'a> {
    pub client: &'a reqwest::Client,
    pub github_token: &'a str,
    pub arch: &'a str,
    pub cache: &'a HttpCache,
    /// For tests: replaces https://api.github.com etc.
    pub api_base: Option<&'a str>,
}

fn re(p: &str) -> Option<Regex> {
    if p.is_empty() {
        return None;
    }
    RegexBuilder::new(p).case_insensitive(false).build().ok()
}

pub async fn get_text_pub(ctx: &Ctx<'_>, url: &str) -> Result<String, String> {
    get_text(ctx, url, &[], false).await
}

async fn get_text(ctx: &Ctx<'_>, url: &str, headers: &[(String, String)], api: bool) -> Result<String, String> {
    let mut req = ctx.client.get(url).timeout(std::time::Duration::from_secs(30)).header("User-Agent", "EmuVault/0.2");
    if api && url.contains("api.github.com") {
        req = req.header("Accept", "application/vnd.github+json");
        if !ctx.github_token.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", ctx.github_token));
        }
    }
    for (k, v) in headers {
        req = req.header(k.as_str(), v.as_str());
    }
    let cached = ctx.cache.map.lock().unwrap().get(url).cloned();
    if let Some((etag, _)) = &cached {
        req = req.header("If-None-Match", etag.as_str());
    }
    let res = req.send().await.map_err(|e| net_err(&e))?;
    let status = res.status();
    if status.as_u16() == 304 {
        if let Some((_, body)) = cached {
            return Ok(body);
        }
    }
    if status.as_u16() == 403 || status.as_u16() == 429 {
        let left = res.headers().get("x-ratelimit-remaining").and_then(|v| v.to_str().ok()).unwrap_or("").to_string();
        if left == "0" {
            return Err("GitHub's limit for checks without an account is reached (60 per hour). Add a GitHub token in Settings, or try again later.".into());
        }
        return Err(format!("The site refused the request ({status})."));
    }
    if status.as_u16() == 404 {
        return Err("Not found. The project may have moved or been removed.".into());
    }
    if !status.is_success() {
        return Err(format!("The site answered with an error ({status})."));
    }
    let etag = res.headers().get("etag").and_then(|v| v.to_str().ok()).map(|s| s.to_string());
    let body = res.text().await.map_err(|e| net_err(&e))?;
    if let Some(etag) = etag {
        ctx.cache.map.lock().unwrap().insert(url.to_string(), (etag, body.clone()));
    }
    Ok(body)
}

fn net_err(e: &reqwest::Error) -> String {
    if e.is_timeout() {
        "The site took too long to answer.".into()
    } else if e.is_connect() {
        "Can't reach the site. Are you online?".into()
    } else {
        format!("Network problem: {e}")
    }
}

fn owner_repo(url: &str, host: &str) -> Option<String> {
    let i = url.find(host)? + host.len();
    let rest = url[i..].trim_start_matches('/');
    let parts: Vec<&str> = rest.split('/').filter(|p| !p.is_empty()).take(2).collect();
    if parts.len() < 2 {
        return None;
    }
    Some(format!("{}/{}", parts[0], parts[1].trim_end_matches(".git")))
}

fn parse_gh_like(body: &str) -> Result<Vec<Release>, String> {
    let v: Value = serde_json::from_str(body).map_err(|_| "Unexpected answer from the site.".to_string())?;
    let arr = v.as_array().ok_or("Unexpected answer from the site.")?;
    Ok(arr
        .iter()
        .filter(|r| !r.get("draft").and_then(|x| x.as_bool()).unwrap_or(false))
        .map(|r| Release {
            tag: r.get("tag_name").and_then(|x| x.as_str()).unwrap_or("").into(),
            title: r.get("name").and_then(|x| x.as_str()).unwrap_or("").into(),
            date: r.get("published_at").or_else(|| r.get("created_at")).and_then(|x| x.as_str()).unwrap_or("").chars().take(10).collect(),
            prerelease: r.get("prerelease").and_then(|x| x.as_bool()).unwrap_or(false),
            assets: r
                .get("assets")
                .and_then(|a| a.as_array())
                .map(|a| {
                    a.iter()
                        .map(|x| Asset {
                            name: x.get("name").and_then(|v| v.as_str()).unwrap_or("").into(),
                            url: x.get("browser_download_url").and_then(|v| v.as_str()).unwrap_or("").into(),
                            size: x.get("size").and_then(|v| v.as_u64()).unwrap_or(0),
                        })
                        .filter(|x| !x.url.is_empty())
                        .collect()
                })
                .unwrap_or_default(),
        })
        .collect())
}

fn parse_gitlab(body: &str) -> Result<Vec<Release>, String> {
    let v: Value = serde_json::from_str(body).map_err(|_| "Unexpected answer from GitLab.".to_string())?;
    let arr = v.as_array().ok_or("Unexpected answer from GitLab.")?;
    Ok(arr
        .iter()
        .map(|r| Release {
            tag: r.get("tag_name").and_then(|x| x.as_str()).unwrap_or("").into(),
            title: r.get("name").and_then(|x| x.as_str()).unwrap_or("").into(),
            date: r.get("released_at").and_then(|x| x.as_str()).unwrap_or("").chars().take(10).collect(),
            prerelease: r.get("upcoming_release").and_then(|x| x.as_bool()).unwrap_or(false),
            assets: r
                .pointer("/assets/links")
                .and_then(|a| a.as_array())
                .map(|a| {
                    a.iter()
                        .map(|x| Asset {
                            name: x.get("name").and_then(|v| v.as_str()).unwrap_or("").into(),
                            url: x.get("direct_asset_url").or_else(|| x.get("url")).and_then(|v| v.as_str()).unwrap_or("").into(),
                            size: 0,
                        })
                        .collect()
                })
                .unwrap_or_default(),
        })
        .collect())
}

/// Turn a tag/title into the version Obtainium would show.
pub fn extract_version(raw: &str, rules: &Rules) -> String {
    let raw = raw.trim();
    if let Some(r) = re(&rules.version_regex) {
        if let Some(c) = r.captures(raw) {
            if rules.version_group.is_empty() {
                return c.get(0).map(|m| m.as_str().to_string()).unwrap_or_else(|| raw.to_string());
            }
            let mut out = rules.version_group.clone();
            for i in (0..c.len()).rev() {
                out = out.replace(&format!("${i}"), c.get(i).map(|m| m.as_str()).unwrap_or(""));
            }
            return out;
        }
    }
    raw.to_string()
}

const SKIP_EXT: &[&str] = &[".sig", ".asc", ".sha256", ".sha256sum", ".sha512", ".md5", ".zsync", ".blockmap", ".txt", ".json", ".yml", ".pdb", ".dsym"];
const ARCHES: &[&str] = &["arm64-v8a", "armeabi-v7a", "armeabi", "x86_64", "x86", "arm64", "aarch64", "armv7", "armhf", "i386", "i686", "amd64", "riscv64"];

fn arch_family(token: &str) -> &'static str {
    match token {
        "arm64-v8a" | "arm64" | "aarch64" => "arm64",
        "armeabi-v7a" | "armeabi" | "armv7" | "armhf" => "arm32",
        "x86_64" | "amd64" => "x64",
        "x86" | "i386" | "i686" => "x86",
        _ => "other",
    }
}

fn arch_tokens(name: &str) -> Vec<&'static str> {
    let n = name.to_lowercase();
    let mut out = vec![];
    for a in ARCHES {
        // whole-word-ish match so "x86" doesn't match inside "x86_64"
        let mut start = 0;
        while let Some(i) = n[start..].find(a) {
            let s = start + i;
            let e = s + a.len();
            let before = n[..s].chars().last().map(|c| !c.is_ascii_alphanumeric()).unwrap_or(true);
            let after = n[e..].chars().next().map(|c| !c.is_ascii_alphanumeric()).unwrap_or(true)
                && !(*a == "x86" && (n[e..].starts_with("_64") || n[e..].starts_with("-64")));
            if before && after {
                out.push(arch_family(a));
                break;
            }
            start = e;
        }
    }
    out.dedup();
    out
}

/// Choose the APK, following Obtainium's filter rules (choose() does this per release; kept for the tests).
#[cfg(test)]
pub fn pick_apk<'a>(assets: &'a [Asset], rules: &Rules, arch: &str) -> Option<&'a Asset> {
    let list = apk_cands(assets, rules, arch);
    let i = rules.preferred_apk_index.min(list.len().saturating_sub(1));
    list.get(i).copied()
}

fn apk_cands<'a>(assets: &'a [Asset], rules: &Rules, arch: &str) -> Vec<&'a Asset> {
    let mut list: Vec<&Asset> = assets.iter().filter(|a| a.name.to_lowercase().ends_with(".apk")).collect();
    if let Some(r) = re(&rules.apk_filter) {
        list.retain(|a| r.is_match(&a.name) != rules.invert_apk_filter);
    }
    if list.len() > 1 && rules.auto_arch {
        let want = arch_family(arch);
        let exact: Vec<&Asset> = list.iter().copied().filter(|a| arch_tokens(&a.name).contains(&want)).collect();
        let neutral: Vec<&Asset> = list.iter().copied().filter(|a| arch_tokens(&a.name).is_empty()).collect();
        if !exact.is_empty() {
            list = exact;
        } else if !neutral.is_empty() {
            list = neutral;
        }
    }
    list
}

/// Choose a Linux download: AppImage first, then .deb, Flatpak, then archives (kept for the tests).
#[cfg(test)]
pub fn pick_linux<'a>(assets: &'a [Asset], machine: &str) -> Option<&'a Asset> {
    best_of(assets, |n| linux_score(n, machine)).first().copied()
}

/// All files with the best score (more than one when the release offers variants).
fn best_of<'a>(assets: &'a [Asset], score: impl Fn(&str) -> Option<i32>) -> Vec<&'a Asset> {
    let scored: Vec<(i32, &Asset)> = assets.iter().filter_map(|a| score(&a.name.to_lowercase()).map(|s| (s, a))).collect();
    let Some(top) = scored.iter().map(|x| x.0).max() else { return vec![] };
    scored.into_iter().filter(|x| x.0 == top).map(|x| x.1).collect()
}

fn linux_score(n: &str, machine: &str) -> Option<i32> {
    let want = if machine == "aarch64" { "arm64" } else { "x64" };
    if SKIP_EXT.iter().any(|e| n.ends_with(e))
        || n.ends_with(".apk")
        || n.ends_with(".exe")
        || n.ends_with(".dmg")
        || n.ends_with(".msi")
        || n.ends_with(".ipa")
    {
        return None;
    }
    if n.contains("windows")
        || n.contains("macos")
        || n.contains("-mac")
        || n.contains("_mac")
        || n.contains("android")
        || n.contains("win64")
        || n.contains("win32")
        || n.contains("darwin")
    {
        return None;
    }
    let archs = arch_tokens(n);
    if !archs.is_empty() && !archs.contains(&want) {
        return None;
    }
    let linuxy = n.contains("linux") || n.contains("appimage") || n.ends_with(".deb") || n.ends_with(".flatpak");
    let mut score = if n.ends_with(".appimage") {
        60
    } else if n.ends_with(".deb") {
        50
    } else if n.ends_with(".flatpak") {
        40
    } else if linuxy
        && (n.ends_with(".tar.gz") || n.ends_with(".tar.xz") || n.ends_with(".tar.zst") || n.ends_with(".tgz") || n.ends_with(".zip") || n.ends_with(".7z"))
    {
        30
    } else {
        return None;
    };
    if !archs.is_empty() {
        score += 5;
    }
    if n.contains("debug") || n.contains("symbols") || n.contains("source") || n.contains("src") {
        score -= 25;
    }
    Some(score)
}

const NOT_DESKTOP: &[&str] = &[".apk", ".appimage", ".deb", ".rpm", ".flatpak", ".ipa"];

fn windows_score(n: &str) -> Option<i32> {
    windows_score_for(n, "x64")
}

fn windows_score_for(n: &str, want: &str) -> Option<i32> {
    if SKIP_EXT.iter().chain(NOT_DESKTOP).any(|e| n.ends_with(e))
        || n.ends_with(".dmg")
        || n.contains("darwin")
        || n.contains("macos")
        || n.contains("linux")
        || n.contains("android")
    {
        return None;
    }
    if !(n.contains("win") || n.ends_with(".exe") || n.ends_with(".msi")) {
        return None;
    }
    let archs = arch_tokens(n);
    if !archs.is_empty() && !archs.contains(&want) {
        return None;
    }
    let mut s = if n.ends_with(".zip") || n.ends_with(".7z") {
        50
    } else if n.ends_with(".exe") {
        45
    } else if n.ends_with(".msi") {
        40
    } else {
        return None;
    };
    if !archs.is_empty() {
        s += 5;
    }
    if n.contains("debug") || n.contains("symbols") || n.contains("pdb") {
        s -= 25;
    }
    Some(s)
}

fn macos_score(n: &str) -> Option<i32> {
    if SKIP_EXT.iter().chain(NOT_DESKTOP).any(|e| n.ends_with(e))
        || n.ends_with(".exe")
        || n.ends_with(".msi")
        || n.contains("linux")
        || n.contains("android")
        || n.contains("windows")
    {
        return None;
    }
    if !(n.contains("mac") || n.contains("osx") || n.contains("darwin") || n.contains("apple") || n.ends_with(".dmg")) {
        return None;
    }
    let mut s = if n.ends_with(".dmg") {
        60
    } else if n.ends_with(".zip") || n.ends_with(".tar.xz") || n.ends_with(".tar.gz") || n.ends_with(".7z") {
        40
    } else {
        return None;
    };
    if n.contains("universal") {
        s += 5;
    }
    if n.contains("debug") || n.contains("symbols") {
        s -= 25;
    }
    Some(s)
}

/// Words that set the chosen file apart from the others ("vanilla" in azahar-…-vanilla.apk).
pub fn distinct_token(chosen: &str, others: &[String]) -> String {
    let words = |s: &str| {
        s.to_lowercase()
            .split(|c: char| !c.is_ascii_alphanumeric())
            .filter(|w| !w.is_empty() && !w.chars().all(|c| c.is_ascii_digit()))
            .map(String::from)
            .collect::<Vec<_>>()
    };
    let mine = words(chosen);
    let rest: Vec<Vec<String>> = others.iter().filter(|o| o.as_str() != chosen).map(|o| words(o)).collect();
    let uniq: Vec<String> = mine.iter().filter(|w| rest.iter().all(|r| !r.contains(w))).cloned().collect();
    if !uniq.is_empty() {
        return uniq.join(" ");
    }
    // 0.10.4: the plain one of "App.apk" and "App-Classic.apk": "without classic"
    let mut lack: Vec<String> = rest.iter().flatten().filter(|w| !mine.contains(w)).cloned().collect();
    lack.sort();
    lack.dedup();
    if lack.is_empty() {
        mine.join(" ")
    } else {
        lack.iter().map(|w| format!("!{w}")).collect::<Vec<_>>().join(" ")
    }
}

fn has_token(name: &str, tok: &str) -> bool {
    let n = name.to_lowercase();
    tok.split_whitespace().all(|w| match w.strip_prefix('!') {
        Some(x) => !n.contains(x),
        None => n.contains(w),
    })
}

/// 0.10.4: the key of another file in the same release: "android~classic" (folder Android-classic).
pub fn variant_key(plat: &str, name: &str, all: &[String]) -> String {
    let t = distinct_token(name, all);
    let t = t.split_whitespace().map(|w| w.replace('!', "not-")).collect::<Vec<_>>().join("-");
    let t: String = t.chars().filter(|c| c.is_ascii_alphanumeric() || *c == '-').take(40).collect();
    format!("{plat}~{t}")
}

/// The token of a variant key back as a filter ("not-classic" -> "!classic"); the tests check the keys with it.
#[cfg(test)]
pub fn variant_token(key: &str) -> Option<String> {
    let t = key.split_once('~')?.1;
    let mut out = vec![];
    let mut neg = false;
    for w in t.split('-').filter(|w| !w.is_empty()) {
        if w == "not" {
            neg = true;
            continue;
        }
        out.push(if neg { format!("!{w}") } else { w.to_string() });
        neg = false;
    }
    Some(out.join(" "))
}

fn cands<'a>(plat: &str, assets: &'a [Asset], rules: &Rules, arch: &str, machine: &str) -> Vec<&'a Asset> {
    match plat {
        "android" => apk_cands(assets, rules, arch),
        "linux" => best_of(assets, |n| linux_score(n, machine)),
        "windows" => best_of(assets, windows_score),
        _ => best_of(assets, macos_score),
    }
}

fn version_of(rel: &Release, rules: &Rules) -> String {
    if rules.date_as_version && !rel.date.is_empty() {
        return rel.date.clone();
    }
    let raw = if rules.title_as_version && !rel.title.is_empty() { &rel.title } else { &rel.tag };
    extract_version(raw, rules)
}

/// Pick the release + file per platform from a release list.
pub fn choose(releases: &[Release], rules: &Rules, arch: &str, machine: &str, page: &str) -> Latest {
    let title_re = re(&rules.title_filter);
    let mut list: Vec<&Release> = releases
        .iter()
        .filter(|r| rules.include_prereleases || !r.prerelease)
        .filter(|r| title_re.as_ref().map(|t| t.is_match(&r.title) || t.is_match(&r.tag)).unwrap_or(true))
        .collect();
    if rules.sort_by_date {
        list.sort_by(|a, b| b.date.cmp(&a.date));
    }
    let mut out = Latest { page: page.to_string(), ..Default::default() };
    if list.is_empty() {
        out.note_android = "No releases found".into();
        out.note_linux = out.note_android.clone();
        return out;
    }
    if rules.track_only {
        let r = list[0];
        let p = Pick { version: version_of(r, rules), date: r.date.clone(), asset: None };
        for plat in PLATS {
            *out.slot(plat).0 = Some(p.clone());
        }
        return out;
    }
    let take = if rules.fallback_to_older { list.len() } else { 1 };
    for plat in PLATS {
        for r in list.iter().take(take) {
            let c = cands(plat, &r.assets, rules, arch, machine);
            if c.is_empty() {
                continue;
            }
            let mut c2 = c.clone();
            if let Some(tok) = rules.prefer.get(plat).filter(|t| !t.is_empty()) {
                let f: Vec<&Asset> = c.iter().copied().filter(|a| has_token(&a.name, tok)).collect();
                if !f.is_empty() {
                    c2 = f;
                }
            }
            let pick = if plat == "android" && !rules.prefer.contains_key(plat) { c2[rules.preferred_apk_index.min(c2.len() - 1)] } else { c2[0] };
            if c2.len() > 1 && (plat != "android" || rules.apk_filter.is_empty()) {
                out.choices.insert(plat.to_string(), c2.iter().map(|a| (*a).clone()).collect());
            }
            *out.slot(plat).0 = Some(Pick { version: version_of(r, rules), date: r.date.clone(), asset: Some(pick.clone()) });
            // 0.10.4: the other files that fit just as well (Classic and normal build): keep them too if you like
            if c.len() > 1 && c.len() <= 6 {
                let names: Vec<String> = c.iter().map(|a| a.name.clone()).collect();
                for a in c.iter().filter(|a| a.name != pick.name) {
                    out.extra
                        .insert(variant_key(plat, &a.name, &names), Pick { version: version_of(r, rules), date: r.date.clone(), asset: Some((*a).clone()) });
                }
            }
            break;
        }
        if out.get(plat).is_none() {
            *out.slot(plat).1 = format!("No {} version in the releases", plat_name(plat));
        }
    }
    // 0.10: the other chip, from the same release as the main file
    for plat in ["linux", "windows", "android"] {
        let Some(main) = out.get(plat).cloned() else { continue };
        let Some(r) = list.iter().take(take).find(|r| version_of(r, rules) == main.version) else { continue };
        let c = if plat == "android" { apk_other(&r.assets, rules, arch) } else { extra_cands(plat, &r.assets, machine) };
        let mut c2 = c.clone();
        let key = if plat == "android" { format!("android@{}", android_other(arch)) } else { format!("{plat}@{}", other_chip(machine)) };
        if let Some(tok) = rules.prefer.get(&key).or_else(|| rules.prefer.get(plat)).filter(|t| !t.is_empty()) {
            let f: Vec<&Asset> = c.iter().copied().filter(|a| has_token(&a.name, tok)).collect();
            if !f.is_empty() {
                c2 = f;
            }
        }
        if let Some(a) = c2.first() {
            if c2.len() > 1 {
                out.choices.insert(key.clone(), c2.iter().map(|a| (*a).clone()).collect());
            }
            out.extra.insert(key, Pick { version: main.version.clone(), date: main.date.clone(), asset: Some((*a).clone()) });
        }
    }
    out
}

// ---------------------------------------------------------------- HTML pages

/// The other chip of a desktop platform: x64 <-> arm64.
pub fn other_chip(machine: &str) -> &'static str {
    if machine == "aarch64" {
        "x64"
    } else {
        "arm64"
    }
}

/// Files for `plat` built for the other chip ("linux@arm64" on an x64 PC), best one first.
/// 0.13: the other Android chip: 32-bit APKs next to 64-bit ones (older handhelds), or the other way round.
pub fn android_other(arch: &str) -> &'static str {
    if arch_family(arch) == "arm32" {
        "arm64"
    } else {
        "arm32"
    }
}
fn apk_other<'a>(assets: &'a [Asset], rules: &Rules, arch: &str) -> Vec<&'a Asset> {
    let want = android_other(arch);
    let mut list: Vec<&Asset> = assets.iter().filter(|a| a.name.to_lowercase().ends_with(".apk") && arch_tokens(&a.name).contains(&want)).collect();
    if let Some(r) = re(&rules.apk_filter) {
        list.retain(|a| r.is_match(&a.name) != rules.invert_apk_filter);
    }
    list
}

fn extra_cands<'a>(plat: &str, assets: &'a [Asset], machine: &str) -> Vec<&'a Asset> {
    let other = if machine == "aarch64" { "x86_64" } else { "aarch64" };
    let want = other_chip(machine);
    // only files that name that chip: a file without a chip in its name is the main one
    let named = |n: &str| arch_tokens(n).contains(&want);
    match plat {
        "linux" => best_of(assets, |n| linux_score(n, other).filter(|_| named(n))),
        "windows" => best_of(assets, |n| windows_score_for(n, want).filter(|_| named(n))),
        _ => vec![],
    }
}

/// Natural compare: "1.9.10" > "1.9.9".
pub fn natural_cmp(a: &str, b: &str) -> Ordering {
    let (mut ai, mut bi) = (a.chars().peekable(), b.chars().peekable());
    loop {
        match (ai.peek().copied(), bi.peek().copied()) {
            (None, None) => return Ordering::Equal,
            (None, _) => return Ordering::Less,
            (_, None) => return Ordering::Greater,
            (Some(x), Some(y)) if x.is_ascii_digit() && y.is_ascii_digit() => {
                let mut na = String::new();
                while let Some(c) = ai.peek().copied().filter(|c| c.is_ascii_digit()) {
                    na.push(c);
                    ai.next();
                }
                let mut nb = String::new();
                while let Some(c) = bi.peek().copied().filter(|c| c.is_ascii_digit()) {
                    nb.push(c);
                    bi.next();
                }
                let (ta, tb) = (na.trim_start_matches('0'), nb.trim_start_matches('0'));
                let o = ta.len().cmp(&tb.len()).then(ta.cmp(tb));
                if o != Ordering::Equal {
                    return o;
                }
            }
            (Some(x), Some(y)) => {
                if x != y {
                    return x.cmp(&y);
                }
                ai.next();
                bi.next();
            }
        }
    }
}

pub fn links_in(html: &str, base: &str, outside_a: bool) -> Vec<String> {
    let base_url = url::Url::parse(base).ok();
    let mut raw: Vec<String> = Regex::new(r#"(?i)<a\s[^>]*?href\s*=\s*["']([^"']+)["']"#).unwrap().captures_iter(html).map(|c| c[1].to_string()).collect();
    if outside_a {
        raw.extend(Regex::new(r#"https?://[^\s"'<>\\]+"#).unwrap().find_iter(html).map(|m| m.as_str().to_string()));
    }
    let mut out = vec![];
    for l in raw {
        let l = l.replace("&amp;", "&");
        let abs = match &base_url {
            Some(b) => b.join(&l).map(|u| u.to_string()).unwrap_or(l),
            None => l,
        };
        if !out.contains(&abs) {
            out.push(abs);
        }
    }
    out
}

fn last_segment(u: &str) -> &str {
    u.trim_end_matches('/').rsplit('/').next().unwrap_or(u)
}

fn pick_link(links: Vec<String>, filter: &str, default_apk: bool, skip_sort: bool, reverse: bool, by_last: bool) -> Option<String> {
    let f = re(filter);
    let mut l: Vec<String> = links
        .into_iter()
        .filter(|x| match &f {
            Some(r) => r.is_match(x),
            None => !default_apk || x.to_lowercase().split(['?', '#']).next().unwrap_or("").ends_with(".apk"),
        })
        .collect();
    if !skip_sort {
        if by_last {
            l.sort_by(|a, b| natural_cmp(last_segment(a), last_segment(b)));
        } else {
            l.sort_by(|a, b| natural_cmp(a, b));
        }
    }
    if reverse {
        l.reverse();
    }
    l.pop()
}

pub async fn check_html(ctx: &Ctx<'_>, app: &AppDef, force_linux: bool) -> Result<Latest, String> {
    let r = &app.rules;
    let mut page_url = app.url.clone();
    let mut html = get_text(ctx, &page_url, &r.headers, false).await?;
    for (i, st) in r.intermediate.iter().enumerate() {
        let LinkStep { filter, skip_sort, reverse_sort, by_last_segment } = st;
        let next = pick_link(links_in(&html, &page_url, r.links_outside_a), filter, false, *skip_sort, *reverse_sort, *by_last_segment)
            .ok_or_else(|| format!("Step {} on the download page found no link. The page may have changed.", i + 1))?;
        page_url = next;
        html = get_text(ctx, &page_url, &r.headers, false).await?;
    }
    let apk = pick_link(links_in(&html, &page_url, r.links_outside_a), &r.link_filter, true, r.skip_sort, false, r.by_last_segment)
        .ok_or("No download link found on the page. The page may have changed.")?;
    let src = if r.version_from_page { html.as_str() } else { apk.as_str() };
    let version = if r.version_regex.is_empty() {
        // like Obtainium's "link hash" pseudo version
        use sha2::{Digest, Sha256};
        format!("link-{}", &hex::encode(Sha256::digest(apk.as_bytes()))[..8])
    } else {
        let v = extract_version(src, r);
        if v == src.trim() && r.version_from_page {
            return Err("Couldn't read the version on the page. The page may have changed.".into());
        }
        v
    };
    let name = last_segment(&apk).split(['?', '#']).next().unwrap_or("app.apk").to_string();
    let is_apk = name.to_lowercase().ends_with(".apk") && !force_linux;
    let pick = Pick { version, date: String::new(), asset: Some(Asset { name: name.clone(), url: apk, size: 0 }) };
    if force_linux {
        return Ok(Latest { linux: Some(pick), page: app.url.clone(), ..Default::default() });
    }
    let n = name.to_lowercase();
    let plat = if is_apk {
        "android"
    } else if linux_score(&n, "x86_64").is_some() {
        "linux"
    } else if windows_score(&n).is_some() {
        "windows"
    } else if macos_score(&n).is_some() {
        "macos"
    } else {
        ""
    };
    let mut out = Latest { page: app.url.clone(), ..Default::default() };
    for p in PLATS {
        if p == plat {
            *out.slot(p).0 = Some(pick.clone());
        } else {
            *out.slot(p).1 = format!(
                "Only {} on this page",
                if plat.is_empty() { "a file Emu Vault doesn't know".to_string() } else { format!("a {} version", plat_name(plat)) }
            );
        }
    }
    Ok(out)
}

pub async fn check(ctx: &Ctx<'_>, app: &AppDef, machine: &str) -> Result<Latest, String> {
    let mut main = check_main(ctx, app, machine).await?;
    if let Some(alt) = app.linux_alt.as_ref().filter(|_| app.source != "libretro") {
        let a = AppDef { source: alt.source.clone(), url: alt.url.clone(), rules: alt.rules.clone(), linux_alt: None, win_alt: None, ..app.clone() };
        let r = if a.source == "html" { check_html(ctx, &a, true).await } else { check_main(ctx, &a, machine).await };
        match r {
            Ok(l) if l.linux.is_some() => {
                main.linux = l.linux;
                main.note_linux.clear();
            }
            Ok(l) => main.note_linux = if l.note_linux.is_empty() { "No Linux version found".into() } else { l.note_linux },
            Err(e) => main.note_linux = format!("Linux version: {e}"),
        }
    }
    if let Some(alt) = app.win_alt.as_ref().filter(|_| app.source != "libretro") {
        let a = AppDef { source: alt.source.clone(), url: alt.url.clone(), rules: alt.rules.clone(), linux_alt: None, win_alt: None, ..app.clone() };
        let r = if a.source == "html" {
            check_html(ctx, &a, true).await.map(|mut l| {
                l.windows = l.linux.take();
                l
            })
        } else {
            check_main(ctx, &a, machine).await
        };
        match r {
            Ok(l) if l.windows.is_some() => {
                main.windows = l.windows;
                main.note_windows.clear();
            }
            Ok(_) => main.note_windows = "No Windows version found".into(),
            Err(e) => main.note_windows = format!("Windows version: {e}"),
        }
    }
    Ok(main)
}

async fn check_main(ctx: &Ctx<'_>, app: &AppDef, machine: &str) -> Result<Latest, String> {
    match app.source.as_str() {
        "github" => {
            let or = owner_repo(&app.url, "github.com").ok_or("The GitHub link is incomplete.")?;
            let base = ctx.api_base.unwrap_or("https://api.github.com");
            let body = get_text(ctx, &format!("{base}/repos/{or}/releases?per_page=30"), &[], true).await?;
            let rel = parse_gh_like(&body)?;
            Ok(choose(&rel, &app.rules, ctx.arch, machine, &format!("https://github.com/{or}/releases")))
        }
        "codeberg" | "forgejo" => {
            let host = url::Url::parse(&app.url).ok().and_then(|u| u.host_str().map(|h| h.to_string())).ok_or("Bad link")?;
            let or = owner_repo(&app.url, &host).ok_or("The link is incomplete.")?;
            let base = ctx.api_base.map(|b| b.to_string()).unwrap_or(format!("https://{host}"));
            let body = get_text(ctx, &format!("{base}/api/v1/repos/{or}/releases?limit=30"), &[], true).await?;
            let rel = parse_gh_like(&body)?;
            Ok(choose(&rel, &app.rules, ctx.arch, machine, &format!("https://{host}/{or}/releases")))
        }
        "gitlab" => {
            let or = owner_repo(&app.url, "gitlab.com").ok_or("The GitLab link is incomplete.")?;
            let base = ctx.api_base.unwrap_or("https://gitlab.com");
            let enc = or.replace('/', "%2F");
            let body = get_text(ctx, &format!("{base}/api/v4/projects/{enc}/releases"), &[], true).await?;
            let rel = parse_gitlab(&body)?;
            Ok(choose(&rel, &app.rules, ctx.arch, machine, &format!("https://gitlab.com/{or}/-/releases")))
        }
        "libretro" => crate::libretro::check(ctx, app.rules.include_prereleases).await,
        "manual" => {
            let mut l = Latest { page: app.url.clone(), ..Default::default() };
            l.note_linux = "A website: look for new versions yourself and drop the file on this app".into();
            l.note_windows = l.note_linux.clone();
            l.note_android = l.note_linux.clone();
            l.note_macos = l.note_linux.clone();
            Ok(l)
        }
        _ => check_html(ctx, app, false).await,
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn dolphin_dev_builds() {
        let apps = crate::catalog::parse_pack(crate::catalog::BUILTIN_PACK, "x").unwrap();
        let d = apps.iter().find(|a| a.id == "org.dolphinemu.dolphinemu").unwrap();
        let links = vec![
            "https://dl.dolphin-emu.org/builds/3a/1b/dolphin-master-2609-175.apk".to_string(),
            "https://dl.dolphin-emu.org/builds/9c/0d/dolphin-master-2609-180.apk".to_string(),
            "https://dl.dolphin-emu.org/builds/9c/0d/dolphin-master-2609-180-x64.7z".to_string(),
            "https://dl.dolphin-emu.org/releases/2506/dolphin-2506a.apk".to_string(),
        ];
        let got = super::pick_link(links, &d.rules.link_filter, true, d.rules.skip_sort, false, d.rules.by_last_segment).unwrap();
        assert!(got.ends_with("dolphin-master-2609-180.apk"), "{got}");
        assert_eq!(super::extract_version(&got, &d.rules), "2609-180");
    }

    use super::*;
    fn a(n: &str) -> Asset {
        Asset { name: n.into(), url: format!("https://x/{n}"), size: 1 }
    }
    #[test]
    fn other_chip_extra() {
        let rel = vec![Release {
            tag: "v1.0".into(),
            title: "v1.0".into(),
            date: "2026-01-01".into(),
            prerelease: false,
            assets: vec![
                a("eden-linux-x86_64.AppImage"),
                a("eden-linux-aarch64.AppImage"),
                a("eden-windows-x64.zip"),
                a("eden-windows-arm64.zip"),
                a("eden.apk"),
            ],
        }];
        let r = Rules { fallback_to_older: true, ..Default::default() };
        let l = choose(&rel, &r, "arm64-v8a", "x86_64", "");
        assert_eq!(l.linux.as_ref().unwrap().asset.as_ref().unwrap().name, "eden-linux-x86_64.AppImage");
        assert_eq!(l.extra["linux@arm64"].asset.as_ref().unwrap().name, "eden-linux-aarch64.AppImage");
        assert_eq!(l.extra["windows@arm64"].asset.as_ref().unwrap().name, "eden-windows-arm64.zip");
        assert_eq!(l.get("linux@arm64").unwrap().version, "v1.0");
        assert_eq!(plat_name("linux@arm64"), "Linux");
        // no chip named: nothing extra
        let rel2 = vec![Release { assets: vec![a("app-linux.AppImage")], ..rel[0].clone() }];
        assert!(choose(&rel2, &r, "arm64-v8a", "x86_64", "").extra.is_empty());
    }
    #[test]
    fn same_release_variants() {
        let rel = vec![Release {
            tag: "v0.7".into(),
            title: "v0.7".into(),
            date: "2026-06-06".into(),
            prerelease: false,
            assets: vec![a("NetherSX2-Classic-v2.2n-3668-Turnip-v0.7.apk"), a("NetherSX2-v2.2n-4248-Turnip-v0.7.apk")],
        }];
        let mut r = Rules { fallback_to_older: true, ..Default::default() };
        let all: Vec<String> = rel[0].assets.iter().map(|a| a.name.clone()).collect();
        // you chose the normal one: "without classic"
        let tok = distinct_token("NetherSX2-v2.2n-4248-Turnip-v0.7.apk", &all);
        assert_eq!(tok, "!classic");
        r.prefer.insert("android".into(), tok);
        let l = choose(&rel, &r, "arm64-v8a", "x86_64", "");
        assert_eq!(l.android.as_ref().unwrap().asset.as_ref().unwrap().name, "NetherSX2-v2.2n-4248-Turnip-v0.7.apk");
        assert_eq!(l.extra["android~classic"].asset.as_ref().unwrap().name, "NetherSX2-Classic-v2.2n-3668-Turnip-v0.7.apk");
        assert_eq!(variant_token("android~classic").unwrap(), "classic");
        assert_eq!(variant_token("android~not-classic").unwrap(), "!classic");
        assert_eq!(plat_name("android~classic"), "Android");
        // you chose Classic: the other one is "not-classic"
        r.prefer.insert("android".into(), "classic".into());
        let l = choose(&rel, &r, "arm64-v8a", "x86_64", "");
        assert!(l.extra.contains_key("android~not-classic"));
    }
    #[test]
    fn android_32bit_extra() {
        let rel = vec![Release {
            tag: "v2".into(),
            title: "v2".into(),
            date: "2026-01-01".into(),
            prerelease: false,
            assets: vec![a("app-arm64-v8a.apk"), a("app-armeabi-v7a.apk"), a("app-x86_64.apk")],
        }];
        let r = Rules { fallback_to_older: true, auto_arch: true, ..Default::default() };
        let l = choose(&rel, &r, "arm64-v8a", "x86_64", "");
        assert_eq!(l.android.as_ref().unwrap().asset.as_ref().unwrap().name, "app-arm64-v8a.apk");
        assert_eq!(l.extra["android@arm32"].asset.as_ref().unwrap().name, "app-armeabi-v7a.apk");
        let one = vec![Release { assets: vec![a("app.apk")], ..rel[0].clone() }];
        assert!(!choose(&one, &r, "arm64-v8a", "x86_64", "").extra.contains_key("android@arm32"));
    }
    #[test]
    fn apk_arch() {
        let r = Rules { auto_arch: true, ..Default::default() };
        let l = vec![a("app-armeabi-v7a-release.apk"), a("app-arm64-v8a-release.apk"), a("app-x86_64-release.apk"), a("app-x86-release.apk")];
        assert_eq!(pick_apk(&l, &r, "arm64-v8a").unwrap().name, "app-arm64-v8a-release.apk");
        let l2 = vec![a("melonDS-nightly.apk"), a("melonDS.apk")];
        let r2 = Rules { auto_arch: true, apk_filter: ".*nightly.*".into(), ..Default::default() };
        assert_eq!(pick_apk(&l2, &r2, "arm64-v8a").unwrap().name, "melonDS-nightly.apk");
        let r3 = Rules { auto_arch: true, apk_filter: "nightly".into(), invert_apk_filter: true, ..Default::default() };
        assert_eq!(pick_apk(&l2, &r3, "arm64-v8a").unwrap().name, "melonDS.apk");
    }
    #[test]
    fn linux_pick() {
        let l = vec![
            a("duckstation-windows-x64-release.zip"),
            a("DuckStation-x64.AppImage"),
            a("DuckStation-arm64.AppImage"),
            a("duckstation-android.apk"),
            a("DuckStation-x64.AppImage.zsync"),
        ];
        assert_eq!(pick_linux(&l, "x86_64").unwrap().name, "DuckStation-x64.AppImage");
        assert_eq!(pick_linux(&l, "aarch64").unwrap().name, "DuckStation-arm64.AppImage");
        let l = vec![a("azahar-2121-windows-msvc.zip"), a("azahar-2121-linux-appimage.tar.gz"), a("azahar-2121-macos-universal.zip")];
        assert_eq!(pick_linux(&l, "x86_64").unwrap().name, "azahar-2121-linux-appimage.tar.gz");
        assert!(pick_linux(&[a("source.tar.gz"), a("app.apk")], "x86_64").is_none());
    }
    #[test]
    fn versions() {
        let r = Rules { version_regex: "(.+)".into(), version_group: "$1-vanilla".into(), ..Default::default() };
        assert_eq!(extract_version("2121.1", &r), "2121.1-vanilla");
        let r = Rules {
            version_regex: r"\/(?:(?:([0-9]+)_([0-9]+)\/ppsspp\.)|(?:([0-9]+)_([0-9]+)_([0-9]+)\/ppsspp(\.)))apk$".into(),
            version_group: "$1$3.$2$4$6$5".into(),
            ..Default::default()
        };
        assert_eq!(extract_version("https://www.ppsspp.org/files/1_19_3/ppsspp.apk", &r), "1.19.3");
        assert_eq!(extract_version("https://www.ppsspp.org/files/1_20/ppsspp.apk", &r), "1.20");
    }
    #[test]
    fn natural() {
        let mut v = vec!["/stable/1.9.9/", "/stable/1.10.0/", "/stable/1.9.10/"];
        v.sort_by(|a, b| natural_cmp(a, b));
        assert_eq!(v.last().unwrap(), &"/stable/1.10.0/");
    }
    #[test]
    fn choose_fallback_and_prerelease() {
        let rel = vec![
            Release { tag: "v3".into(), title: "".into(), date: "2026-10-01".into(), prerelease: true, assets: vec![a("x-arm64-v8a.apk")] },
            Release { tag: "v2".into(), title: "".into(), date: "2026-09-01".into(), prerelease: false, assets: vec![a("notes.txt")] },
            Release { tag: "v1".into(), title: "".into(), date: "2026-08-01".into(), prerelease: false, assets: vec![a("x.apk"), a("X-x86_64.AppImage")] },
        ];
        let r = Rules { fallback_to_older: true, auto_arch: true, sort_by_date: true, ..Default::default() };
        let l = choose(&rel, &r, "arm64-v8a", "x86_64", "");
        assert_eq!(l.android.unwrap().version, "v1");
        assert_eq!(l.linux.unwrap().asset.unwrap().name, "X-x86_64.AppImage");
        let r = Rules { include_prereleases: true, ..r };
        assert_eq!(choose(&rel, &r, "arm64-v8a", "x86_64", "").android.unwrap().version, "v3");
    }
    #[test]
    fn html_links() {
        let h = r#"<a href="/stable/1.19.0/">x</a> <a class=b href='/stable/1.21.0/'>y</a><a href="/stable/1.9.0/">z</a>"#;
        let l = links_in(h, "https://buildbot.libretro.com/stable", false);
        assert_eq!(pick_link(l, r"/stable/\d+\.\d+\.\d+/", false, false, false, false).unwrap(), "https://buildbot.libretro.com/stable/1.21.0/");
    }
}

#[cfg(test)]
mod tests_v3 {
    use super::*;
    fn a(n: &str) -> Asset {
        Asset { name: n.into(), url: format!("https://x/{n}"), size: 1 }
    }
    #[test]
    fn four_platforms_and_choices() {
        let rel = vec![Release {
            tag: "2123.1".into(),
            title: "".into(),
            date: "2026-10-24".into(),
            prerelease: false,
            assets: vec![
                a("azahar-2123.1-android-vanilla.apk"),
                a("azahar-2123.1-android-googleplay.apk"),
                a("azahar-2123.1-linux-appimage.tar.gz"),
                a("azahar-2123.1-windows-msvc.zip"),
                a("azahar-2123.1-windows-msys2.zip"),
                a("azahar-2123.1-macos-universal.zip"),
                a("azahar-2123.1.tar.xz.sig"),
            ],
        }];
        let r = Rules { auto_arch: true, ..Default::default() };
        let l = choose(&rel, &r, "arm64-v8a", "x86_64", "p");
        assert_eq!(l.linux.as_ref().unwrap().asset.as_ref().unwrap().name, "azahar-2123.1-linux-appimage.tar.gz");
        assert_eq!(l.macos.as_ref().unwrap().asset.as_ref().unwrap().name, "azahar-2123.1-macos-universal.zip");
        assert_eq!(l.choices["android"].len(), 2);
        assert_eq!(l.choices["windows"].len(), 2);
        assert!(!l.choices.contains_key("linux"));
        let names: Vec<String> = l.choices["android"].iter().map(|x| x.name.clone()).collect();
        let tok = distinct_token("azahar-2123.1-android-vanilla.apk", &names);
        assert_eq!(tok, "vanilla");
        let mut r2 = r.clone();
        r2.prefer.insert("android".into(), tok);
        let l2 = choose(&rel, &r2, "arm64-v8a", "x86_64", "p");
        assert_eq!(l2.android.unwrap().asset.unwrap().name, "azahar-2123.1-android-vanilla.apk");
        assert!(!l2.choices.contains_key("android"), "your choice settles it");
    }
}
