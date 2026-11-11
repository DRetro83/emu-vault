// GOG backups — a separate module.
// To take it out: delete gog.js and gog.css and their two lines in index.html (and gog.rs on the Rust side).
// Loaded BEFORE preview.js so the tabs exist when preview binds them. Errors stay inside this file.
(() => {
try {
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T = window.__TAURI__;
const inv = (c, a) => T.core.invoke(c, a);
const errMsg = e => String(e && e.message || e);
const gb = b => { const mb = b / 1048576; return mb >= 1048576 ? (mb / 1048576).toFixed(2) + " TB" : mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : mb >= 1 ? Math.round(mb) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; };
const say = m => { if (typeof window.toast === "function") window.toast(m); else { const t = $("#toast"); if (t) { t.textContent = m; t.hidden = false; setTimeout(() => t.hidden = true, 2800); } } };
const OSN = {windows: "Windows", linux: "Linux", osx: "macOS"};

// ---------- sidebar + views ----------
const nav = $("nav.tabs"), setTab = nav && nav.querySelector('[data-tab="set"]');
if (!nav || !setTab) return;
const ico = {
  lib: '<rect x="4" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><path d="M14 5.5l3.4-.9 3.1 15-3.4.9z"/>',
  upd: '<path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M4 15v4h16v-4"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
};
const tab = (k, lb, ic, hide) => `<button class="tab gog-tab" role="tab" data-tab="${k}" aria-selected="false"${hide ? " hidden" : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><span class="lb">${lb}</span><span class="n" id="n-${k}"></span></button>`;
// small banners above the two groups: EMU and GOG
const homeTab = nav.querySelector('[data-tab="home"]');
// EMU on top, GOG under it
if (homeTab) homeTab.insertAdjacentHTML("beforebegin", `<div class="rbar side-sec" role="presentation"><span>EMU</span></div>`);
setTab.insertAdjacentHTML("afterend", `<div class="rbar side-sec gog-sec" role="presentation"><span>GOG</span></div>` +
  tab("goghome", "Home", '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><rect x="9.5" y="13" width="5" height="4" rx="1"/>', true) +
  tab("goglib", "Library", ico.lib, true) + tab("gogupd", "Updates", ico.upd, true) + tab("gogset", "Settings", ico.set));
// the title shows where you are: ~/emu/home, ~/gog/library
const setTitle = t => setTimeout(() => { const pt = $("#ptitle"); if (pt && t.querySelector(".lb")) pt.textContent = (t.classList.contains("gog-tab") ? "gog/" : "emu/") + t.querySelector(".lb").textContent.toLowerCase(); }, 0);
nav.querySelectorAll(".tab[data-tab]:not(.gog-tab)").forEach(t => t.addEventListener("click", () => setTitle(t)));
window.addEventListener("DOMContentLoaded", () => { const t = nav.querySelector('.tab[aria-selected="true"]') || homeTab; if (t) setTitle(t); });
document.querySelectorAll(".gog-tab").forEach(t => t.addEventListener("click", () => setTimeout(() => { const pt = $("#ptitle"); if (pt) pt.textContent = "gog/" + t.querySelector(".lb").textContent.toLowerCase(); }, 0)));
const main = $("main.app"), logEl = main.querySelector("details.log");
["goghome", "goglib", "gogupd", "gogset"].forEach(k => { const s = document.createElement("section"); s.id = "view-" + k; s.className = "view gog"; s.hidden = true; main.insertBefore(s, logEl); });
if (!T) { ["goghome", "goglib", "gogupd", "gogset"].forEach(k => $("#view-" + k).innerHTML = `<p class="hint">GOG backups work in the Emu Vault app.</p>`); return; }

// ---------- state ----------
let V = null;                 // what the app knows (gog_view)
let H = null;                 // Heroic in the vault (heroic_status)
const U = {saves: {}, sel: new Set(), filter: "all", q: "", view: "grid", open: null, lbx: null, lbxIds: [], refresh: null, check: null, gd: null, stamp: Date.now(), err: ""};
try { U.view = localStorage.getItem("gog-view") || "grid"; } catch (e) {}
const ST = {ok: ["ok", "Up to date"], new: ["info", "Not downloaded"], upd: ["warn", "New version"], inc: ["warn", "Incomplete"], bad: ["bad", "Damaged"], extra: ["info", "Extras missing"], skip: ["plat", "Skipped"]};
const games = () => V ? V.games : [];
const need = () => games().filter(g => g.st !== "ok" && g.st !== "skip");
const inQ = id => V && V.queue.ids.includes(id);
const prog = id => V && V.queue.items.find(p => p.id === id);
const visible = k => { const v = $("#view-" + k); return v && !v.hidden; };

async function load(quick) {
  try { V = await inv("gog_view", {quick: !!quick}); U.err = ""; } catch (e) { U.err = errMsg(e); }
  try { const sv = await inv("gog_saves"); U.saves = {}; sv.forEach(x => U.saves[x.id] = x); } catch (e) {}
  try { H = await inv("heroic_status", {check: false}); } catch (e) { H = null; }
  render();
}
// 0.12.2: no installing games in Heroic from the vault anymore (Get Heroic stays; GOG brings its own Linux launcher later)
let heroChecked = false;
async function heroCheck() { if (heroChecked) return; heroChecked = true; try { H = await inv("heroic_status", {check: true}); render(); } catch (e) {} }

// ---------- pieces ----------
const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
function cover(g, big, full) {
  const src = full ? g.cover : (g.thumb || g.cover);
  if (src) return `<span class="cov gog-img${big ? " big" : ""}" aria-hidden="true"><img src="${T.core.convertFileSrc(src)}${g.custom ? "?t=" + U.stamp : ""}" alt="" loading="lazy" decoding="async"></span>`;
  return `<span class="cov${big ? " big" : ""}" style="--h:${hue(g.slug)}" aria-hidden="true"><b>GOG</b><i>${esc(g.title)}</i></span>`;
}
const osPills = g => g.os.map(o => `<span class="pill plat">${OSN[o] || o}</span>`).join("");
const verTxt = g => g.st === "upd" && g.have ? `<span class="mono">${esc(g.have)}</span> → <span class="mono">${esc(g.version)}</span>` : g.version ? `<span class="mono">${esc(g.version)}</span>` : "";
const actLabel = g => g.st === "new" ? "Download" : g.st === "upd" ? "Update" : g.st === "inc" ? "Download the rest" : g.st === "bad" ? "Download again" : g.st === "extra" ? "Get extras" : "";
function actBtn(g, small = true) {
  if (g.st === "ok" || g.st === "skip") return "";
  if (inQ(g.id)) return `<span class="pill info">${V.queue.running ? "In downloads" : "Paused"}</span>`;
  return `<button class="btn ${small ? "small " : ""}primary" data-gogdl="${g.id}">${actLabel(g)}</button>`;
}
const driveNote = () => V.drive_ok || !V.last_check ? "" : `<div class="gog-paused gog-gone" role="alert"><b>The GOG folder is not there</b><span><span class="mono">${esc(V.dir)}</span> cannot be found. Is the drive unplugged? Downloads are paused. Plug it in, wait until it shows up, then press Resume. Or pick another folder in Settings.</span></div>`;
const signedNote = () => driveNote() + (V.signed ? "" : `<div class="gog-paused" role="status"><b>Not signed in</b><span>Sign in to GOG to update the list and download. <button class="btn small" data-gogtab="gogset">Open GOG Settings</button></span></div>`);
function offHTML() {
  return `<div class="gog-wrap"><div class="form set-sec"><h2>GOG backups are off</h2><p class="hint">Turn them on in GOG Settings.</p><button class="btn primary" data-gogtab="gogset" style="align-self:flex-start">Open GOG Settings</button></div></div>`;
}
function emptyHTML() {
  return `<div class="form set-sec"><h2>No list yet</h2><p class="hint">${V.signed ? "Press Update list to read the games on your GOG account. The first time takes a while: GOG is asked for every file name and checksum." : "Sign in to GOG first, in GOG Settings."}</p>
    ${V.signed ? `<button class="btn primary" data-gogrefresh style="align-self:flex-start">Update list</button>` : `<button class="btn primary" data-gogtab="gogset" style="align-self:flex-start">Open GOG Settings</button>`}</div>`;
}

// ---------- GOG Library ----------
function libHTML() {
  if (!V.on) return offHTML();
  const all = games();
  const c = {all: all.length, ok: 0, need: 0, upd: 0, bad: 0, linux: 0};
  all.forEach(g => { if (g.st === "ok") c.ok++; else if (g.st !== "skip") c.need++; if (g.st === "upd") c.upd++; if (g.st === "bad") c.bad++; if (g.os.includes("linux") || g.other_os.includes("linux")) c.linux++; });
  const f = U.filter, q = U.q.toLowerCase();
  const rows = all.filter(g => (f === "all" || (f === "ok" && g.st === "ok") || (f === "need" && g.st !== "ok" && g.st !== "skip") || (f === "upd" && g.st === "upd") || (f === "bad" && g.st === "bad") || (f === "linux" && (g.os.includes("linux") || g.other_os.includes("linux")))) && (!q || g.title.toLowerCase().includes(q) || g.slug.includes(q)));
  const chip = (k, l) => `<button class="chip" data-goqf="${k}" aria-pressed="${f === k}">${l} <span class="mono">${c[k]}</span></button>`;
  return `<div class="gog-wrap">${signedNote()}
  ${!all.length ? emptyHTML() : `
  <div class="gog-sum">
    <div><b class="mono">${all.length}</b><span>games on your account</span></div>
    <div><b class="mono">${c.ok}</b><span>backed up and current</span></div>
    <div><b class="mono">${c.need}</b><span>need a download</span></div>
    <div><b class="mono">${gb(V.on_disk)}</b><span>on <span class="mono">${esc(V.dir)}</span></span></div>
  </div>
  <div class="filters">
    <input class="search" id="gog-q" type="search" placeholder="Search your GOG games" aria-label="Search your GOG games" value="${esc(U.q)}">
    <div class="seg" role="group" style="align-self:flex-start"><button data-gogview="list" aria-pressed="${U.view === "list"}">List</button><button data-gogview="grid" aria-pressed="${U.view === "grid"}">Covers</button></div>
    <div class="chips">${chip("all", "All")}${chip("ok", "Up to date")}${chip("need", "Needs download")}${chip("upd", "Updates")}${chip("bad", "Damaged")}${chip("linux", "Has Linux")}</div>
  </div>
  ${!rows.length ? `<p class="hint">No games match.</p>` : U.view === "grid"
    ? `<div class="cgrid gog-grid">${rows.map(tileHTML).join("")}</div>`
    : `<div class="gog-list" role="list">${rows.map(rowHTML).join("")}</div>`}`}
  </div>`;
}
function tileHTML(g) {
  const [cls, lb] = ST[g.st] || ST.ok;
  return `<div class="ctile gog-tile${g.st === "new" ? "" : " have"}"><button class="covbtn" data-goglbx="${g.id}" aria-label="View: ${esc(g.title)}">${cover(g, true)}</button>
    <div class="ct">${esc(g.title)}</div>
    <div class="gog-tmeta"><span class="pill ${cls}">${lb}</span><span class="mono">${g.os.map(o => o[0].toUpperCase()).join(" ")}</span></div></div>`;
}
function rowHTML(g) {
  const [cls, lb] = ST[g.st] || ST.ok, open = U.open === g.id;
  return `<div class="gog-row${open ? " open" : ""}" role="listitem">
    <button class="gog-head" data-gogfold="${g.id}" aria-expanded="${open}">${cover(g)}
      <span class="gog-t"><b>${esc(g.title)}</b><span class="gog-meta">${osPills(g)} ${verTxt(g)} · ${gb(g.size)}${g.extras.length ? ` · ${g.extras.length} extra${g.extras.length > 1 ? "s" : ""}` : ""}</span></span>
      <span class="pill ${cls}">${lb}</span></button>
    <span class="gog-act">${actBtn(g) || `<button class="btn small" data-gogfold="${g.id}">Files</button>`}</span>
    ${open ? detHTML(g) : ""}
  </div>`;
}
const FST = {ok: ["ok", "Present"], miss: ["info", "Missing"], part: ["warn", "Partly downloaded"], small: ["warn", "Incomplete"], changed: ["warn", "Changed on GOG"], bad: ["bad", "Damaged"]};
function fileCheck(f) {
  if (f.st === "ok" && f.md5 === "ok") return `<span class="pill ok">MD5 matches</span>`;
  if (f.st === "ok" && f.md5 === "gd") return `<span class="pill ok" title="gog-downloader checked this file">MD5 ok (gog-downloader)</span>`;
  if (f.st === "ok") return `<span class="pill plat" title="Name and size match. Press Check files now for the MD5.">Size matches</span>`;
  if (f.st === "bad" && f.md5 === "bad") return `<span class="pill bad">MD5 does not match</span>`;
  if (f.st === "part") return `<span class="pill warn">${Math.round(f.done / Math.max(1, f.size) * 100)}% downloaded</span>`;
  if (f.st === "small") return `<span class="pill warn" title="Smaller than GOG's file: the download stopped. Download the rest goes on from there.">Incomplete · ${Math.round(f.disk / Math.max(1, f.size) * 100)}%</span>`;
  if (f.st === "changed") return `<span class="pill warn" title="Another size than GOG's file: GOG changed it. It is downloaded again.">Changed on GOG</span>`;
  const [c, l] = FST[f.st] || FST.miss; return `<span class="pill ${c}">${l}</span>`;
}
function detHTML(g) {
  return `<div class="gog-det">
    <table class="gog-files"><thead><tr><th>File</th><th class="num">At GOG</th><th class="num">On the drive</th><th>Check</th></tr></thead><tbody>
    ${g.files.map(f => `<tr><td class="mono">${esc(f.rel)}</td><td class="num mono">${gb(f.size)}</td><td class="num mono${f.disk && f.disk !== f.size && f.st !== "ok" ? " gog-diff" : ""}">${f.disk ? gb(f.disk) : f.st === "part" ? gb(f.done) : "–"}</td><td>${fileCheck(f)}</td></tr>`).join("")}
    ${g.old.map(r => `<tr><td class="mono">${esc(r)}</td><td></td><td></td><td><span class="pill warn">Older version</span></td></tr>`).join("")}
    </tbody></table>
    ${savesBox(g)}
    <p class="hint">Folder: <span class="mono">${esc(g.folder)}/</span>${g.old.length ? ` · after the update the older files go ${V.settings.old === "delete" ? "away" : "to <span class=\"mono\">_duplicates</span>"}` : ""}${g.other_os.length ? ` · also on GOG for ${g.other_os.map(o => OSN[o] || o).join(", ")} (not picked in GOG Settings)` : ""}</p>
    <div class="row-btns">${actBtn(g)}<button class="btn small" data-gogopen="${esc(g.folder)}">Open folder</button><button class="btn small" data-gogcheck="${g.id}">Check files now</button><button class="btn small" data-gogskip="${g.id}">${g.st === "skip" ? "Don't skip" : "Skip this game"}</button></div>
  </div>`;
}

// ---------- the big cover viewer ----------
function lbxHTML() {
  const ids = U.lbxIds, i = ids.indexOf(U.lbx), g = games().find(x => x.id === U.lbx); if (!g) return "";
  const [cls, lb] = ST[g.st] || ST.ok;
  return `<div class="lbx-top"><span class="mono">${i + 1} / ${ids.length}</span><button class="x" id="gog-lbx-x" aria-label="Close">×</button></div>
  <div class="lbx-stage"><button class="lbx-nav prev" data-goglnav="-1" aria-label="Previous game" ${i <= 0 ? "disabled" : ""}>‹</button>
    <div class="lbx-cov">${cover(g, true, true)}</div>
    <button class="lbx-nav next" data-goglnav="1" aria-label="Next game" ${i >= ids.length - 1 ? "disabled" : ""}>›</button></div>
  <div class="lbx-info">
    <h3>${esc(g.title)}</h3>
    <div class="gog-meta"><span class="pill ${cls}">${lb}</span>${osPills(g)} ${verTxt(g)} · ${gb(g.size)}${g.extras.length ? ` · ${g.extras.map(e => esc(e[0])).join(", ")}` : ""}${actBtn(g) ? " " + actBtn(g) : ""}</div>
    ${lbxTabs(g)}
  </div>`;
}
// 0.12.3: the cover view stays quiet: saves, cover and files behind small tabs (the open one is remembered)
function lbxTabs(g) {
  const T2 = [["saves", "Saves"], ["cover", "Cover"], ["files", "Files"]], t = U.ltab || "";
  let body = "";
  if (t === "saves") body = savesBox(g) || `<p class="hint" style="margin:0">Looking at the saves…</p>`;
  if (t === "cover") body = `<div class="gog-hbox"><span class="hint">Cover: ${g.custom ? "your own picture" : g.cover ? "the original from GOG" : "none yet (comes with Update list)"}</span><span class="row-btns"><button class="btn small" data-gogcovpick="${esc(g.slug)}">Use my own cover…</button>${g.custom ? `<button class="btn small" data-gogcovreset="${esc(g.slug)}">Use GOG's cover</button>` : `<button class="btn small" data-gogcovagain="${esc(g.slug)}">Get GOG's cover again</button>`}</span></div>`;
  if (t === "files") body = `<div class="gog-hbox"><span class="hint mono" style="overflow-wrap:anywhere">${esc(g.folder)}</span><span class="row-btns"><button class="btn small" data-goglfiles="${g.id}">Files</button><button class="btn small" data-gogopen="${esc(g.folder)}">Open folder</button></span></div>`;
  return `<div class="lbx-tabs" role="tablist">${T2.map(([k, l]) => `<button role="tab" class="lbx-tab" data-gogltab="${k}" aria-selected="${t === k}">${l}</button>`).join("")}</div>${body}`;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-gogltab]"); if (!b) return;
  e.preventDefault(); U.ltab = U.ltab === b.dataset.gogltab ? "" : b.dataset.gogltab;
  const el = $("#gog-lbx"); if (el && !el.hidden) el.innerHTML = lbxHTML();
});
function savesBox(g) {
  const x = U.saves[g.id]; if (!x) return "";
  const cloud = x.cloud === "yes" ? `<b>Cloud saves</b> <span class="hint">· ${x.files} file${x.files === 1 ? "" : "s"}${x.last ? " · copied " + esc(x.last) : ""}</span>`
    : x.cloud === "no" ? `<b>No cloud saves</b> <span class="hint">· GOG keeps no saves of this game online</span>` : `<b>Cloud saves</b> <span class="hint">· not asked GOG yet</span>`;
  return `<div class="gog-hbox gog-saves"><span class="gog-sv">${cloud}<br><b>Your own saves</b> <span class="hint">· ${x.mine_files} file${x.mine_files === 1 ? "" : "s"} in <span class="mono">${esc(x.mine_dir)}</span></span></span>
    <span class="row-btns">${x.cloud !== "no" ? `<button class="btn small" data-gogsavesget="${g.id}" ${U.savesBusy ? "disabled" : ""}>${U.savesBusy ? "Getting saves…" : x.cloud === "yes" ? "Get cloud saves" : "Check cloud saves"}</button>` : ""}${x.cloud === "yes" ? `<button class="btn small" data-gogsavesopen="${esc(g.slug)}" data-which="cloud">Open cloud saves</button>` : ""}<button class="btn small" data-gogsavesopen="${esc(g.slug)}" data-which="mine">Open my saves folder</button><button class="btn small" data-gogsavescopy="${esc(g.slug)}">Copy saves from a folder…</button></span></div>`;
}
function openLbx(id) {
  U.lbxIds = [...document.querySelectorAll("#view-goglib [data-goglbx]")].map(b => +b.dataset.goglbx); U.lbx = id;
  let el = $("#gog-lbx");
  if (!el) { el = document.createElement("div"); el.id = "gog-lbx"; el.className = "lbx gog"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "GOG game"); document.body.appendChild(el); }
  el.hidden = false; document.body.style.overflow = "hidden"; el.innerHTML = lbxHTML();
  setTimeout(() => { const x = $("#gog-lbx-x"); x && x.focus(); }, 30);
}
function closeLbx() {
  const el = $("#gog-lbx"); if (!el || el.hidden) return false;
  el.hidden = true; document.body.style.overflow = ""; const id = U.lbx; U.lbx = null; render();
  const b = document.querySelector(`[data-goglbx="${id}"]`); b && b.focus(); return true;
}
function navLbx(d) {
  const i = U.lbxIds.indexOf(U.lbx) + d; if (i < 0 || i >= U.lbxIds.length) return;
  U.lbx = U.lbxIds[i]; $("#gog-lbx").innerHTML = lbxHTML();
  const c = $("#gog-lbx .lbx-cov"); c && c.classList.add(d > 0 ? "in-r" : "in-l");
}
window.addEventListener("keydown", e => {
  const el = $("#gog-lbx"); if (!el || el.hidden) return;
  if (e.key === "Escape" || (e.key === "Backspace" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) { e.preventDefault(); e.stopImmediatePropagation(); closeLbx(); }
  else if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopImmediatePropagation(); navLbx(e.key === "ArrowLeft" ? -1 : 1); }
}, true);

// ---------- GOG Home ----------
function ghomeHTML() {
  if (!V.on) return offHTML();
  if (!games().length) return `<div class="gog-wrap">${signedNote()}${emptyHTML()}${heroHomeHTML()}</div>`;
  const n = need(), by = st => n.filter(g => g.st === st), Q = V.queue;
  const row = (k, icon, t, sub, tabk, btn, id) => `<div class="hrow ${k}"><button class="hmain" data-gogtab="${tabk}"><span class="hico" aria-hidden="true">${icon}</span><span class="htx"><b>${esc(t)}</b><span>${esc(sub)}</span></span></button>${btn ? `<button class="btn small${k === "start" ? " primary" : ""}" ${id ? `id="${id}"` : `data-gogtab="${tabk}"`}>${btn}</button>` : `<span class="hchev" aria-hidden="true"></span>`}</div>`;
  const names = l => l.slice(0, 3).map(g => g.title).join(", ") + (l.length > 3 ? "…" : "");
  const todo = [];
  if (Q.paused && Q.ids.length) todo.push(row("start", "⏸", `Downloads paused · ${Q.ids.length} game${Q.ids.length > 1 ? "s" : ""}`, `${Q.paused_at ? "Paused " + Q.paused_at + ". " : ""}Resume goes on where it stopped`, "gogupd", "Resume", "gog-resume"));
  if (Q.running) todo.push(row("start", "↓", `Downloading · ${Q.ids.length} game${Q.ids.length > 1 ? "s" : ""}`, Q.speed ? gb(Q.speed) + "/s" : "…", "gogupd", "Pause", "gog-pause"));
  if (by("upd").length) todo.push(row("warn", "↑", `${by("upd").length} new version${by("upd").length > 1 ? "s" : ""} on GOG`, names(by("upd")), "gogupd", "Show"));
  if (by("new").length) todo.push(row("warn", "⇣", `${by("new").length} game${by("new").length > 1 ? "s" : ""} not downloaded yet`, names(by("new")), "gogupd"));
  if (!V.drive_ok && V.last_check) todo.unshift(row("start", "!", "The GOG folder is not there", `${V.dir} · drive unplugged? Plug it in, then Resume`, "gogset"));
  if (by("inc").length) todo.push(row("warn", "…", `${by("inc").length} incomplete download${by("inc").length > 1 ? "s" : ""}`, names(by("inc")) + " · download the rest", "gogupd"));
  if (by("bad").length) todo.push(row("warn", "!", `${by("bad").length} game${by("bad").length > 1 ? "s" : ""} with a damaged file`, names(by("bad")) + " · download again", "gogupd"));
  if (by("extra").length) todo.push(row("info", "♪", `${by("extra").length} game${by("extra").length > 1 ? "s" : ""} with extras missing`, names(by("extra")), "gogupd"));
  if (H && H.have && H.latest && H.latest !== H.ver) todo.push(row("warn", "↑", `Heroic ${H.latest} is available`, `You have ${H.ver} · the old version stays until the new one is in`, "gogset", "Update", "hero-upd"));
  if (!V.signed) todo.push(row("start", "●", "Not signed in to GOG", "Sign in to update the list and download", "gogset", "Sign in"));
  const ok = games().filter(g => g.st === "ok").length, hn = H && H.installed ? Object.keys(H.installed).length : 0;
  const good = [];
  if (H && H.have) good.push(row("ok", "▶", `Heroic ${H.ver} is in the vault`, "Start it from GOG › Settings, or from your desktop", "gogset"));
  good.push(row("ok", "✓", `${ok} of ${games().length} games backed up and current`, `List updated ${V.last_check || "never"} · ${({daily: "checks every day", weekly: "checks every week", start: "checks on startup", off: "checks when you press Update list"})[V.settings.bg] || ""}`, "goglib"));
  good.push(row("ok", "◔", `${gb(V.on_disk)} of GOG games on the drive`, `${gb(V.free)} free · ${V.dir}`, "gogset"));
  if (V.signed) good.push(row("ok", "●", `Signed in as ${V.user}`, "GOG account", "gogset"));
  { const sv = Object.values(U.saves), cl = sv.filter(x => x.cloud === "yes"), last = cl.map(x => x.last).sort().pop(); if (cl.length) good.push(row("ok", "▣", `Cloud saves of ${cl.length} game${cl.length > 1 ? "s" : ""} on the drive`, `${last ? "Copied " + last + " · " : ""}${V.saves_dir}`, "gogset")); }
  const recent = games().slice().sort((a, b) => b.id - a.id).slice(0, 6);
  return `<div class="gog-wrap">
  <div class="hhead"><span class="muted">${V.last_check ? "Last check " + esc(V.last_check) : "Not checked yet"}</span><span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" data-gogrefresh ${V.refreshing || U.refresh ? "disabled" : ""}>${V.refreshing || U.refresh ? "Updating list…" : "Update list"}</button>${n.length && !Q.running ? `<button class="btn small" id="gog-all">Download all (${n.filter(g => !inQ(g.id)).length || n.length})</button>` : ""}${H && H.have ? `<button class="btn small primary" id="hero-start">▶ Heroic</button>` : ""}<button class="btn small" data-gogopen="${esc(V.dir)}">Open GOG folder</button></span></div>
  ${U.refresh ? `<p class="hint">${esc(U.refresh.what)} ${U.refresh.total ? `(${U.refresh.done}/${U.refresh.total})` : ""}</p>` : ""}
  <div class="group"><h2>${todo.length ? `To do · ${todo.length}` : "Nothing to do"}</h2><div class="hlist">${todo.join("") || `<div class="empty-state">All caught up.</div>`}</div></div>
  <div class="group"><h2>All good</h2><div class="hlist">${good.join("")}</div></div>
  ${heroHomeHTML()}
  <div class="group"><h2>Newest on your account</h2><div class="cgrid gog-grid gog-recent">${recent.map(tileHTML).join("")}</div></div>
  </div>`;
}
function heroHomeHTML() {
  if (H && H.have) return "";
  return `<div class="group"><h2>Heroic Games Launcher</h2><div class="hlist"><div class="hrow info"><button class="hmain" data-gogtab="gogset"><span class="hico" aria-hidden="true">▶</span><span class="htx"><b>Get Heroic Games Launcher</b><span>A free launcher for GOG, Epic and Amazon games. You install your games in it yourself</span></span></button><button class="btn small" id="hero-get">${U.heroDl ? "Downloading…" : "Get Heroic"}</button></div></div></div>`;
}

// ---------- GOG Updates ----------
function updHTML() {
  if (!V.on) return offHTML();
  if (!games().length) return `<div class="gog-wrap">${signedNote()}${emptyHTML()}</div>`;
  const n = need(), Q = V.queue;
  const waiting = n.filter(g => !inQ(g.id));
  const grp = (st, title) => {
    const l = n.filter(g => g.st === st); if (!l.length) return "";
    const free = l.filter(g => !inQ(g.id)), allOn = free.length && free.every(g => U.sel.has(g.id));
    return `<div class="gog-grp"><h3>${free.length ? `<label class="gog-ck" title="Select all in this group"><input type="checkbox" data-gogselgrp="${st}" ${allOn ? "checked" : ""} aria-label="Select all: ${title}"></label>` : ""}${title} <span class="mono">${l.length}</span></h3>${l.map(g => {
      const p = prog(g.id), q = inQ(g.id);
      const why = st === "upd" ? (g.have ? verTxt(g) : `<span class="mono">${esc(g.bad_file)}</span> changed on GOG`) : st === "inc" ? `<span class="mono">${esc(g.bad_file)}</span> stopped halfway` : st === "bad" ? `<span class="mono">${esc(g.bad_file)}</span> does not match GOG's MD5` : st === "extra" ? g.files.filter(f => f.kind === "extra" && f.st !== "ok").map(f => esc(f.name)).join(", ") : osPills(g);
      const pct = p && p.total ? Math.min(100, p.done / p.total * 100) : 0;
      return `<div class="gog-q${q ? "" : " gog-sel"}">${q ? "" : `<label class="gog-ck"><input type="checkbox" data-gogsel="${g.id}" ${U.sel.has(g.id) ? "checked" : ""} aria-label="Select ${esc(g.title)}"></label>`}${cover(g)}<span class="gog-t"><b>${esc(g.title)}</b><span class="gog-meta">${why}${p && p.state === "err" ? ` · <span class="gog-err">${esc(p.err)}</span>` : p && p.state === "check" ? " · checking MD5…" : p && p.speed ? ` · <span class="mono">${gb(p.speed)}/s</span>` : ""}</span></span>
        <span class="mono gog-mb">${gb(g.need)}</span>
        ${q ? `<span class="gog-prog" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></span><span class="mono gog-pct">${(Q.paused ? "⏸ " : "") + Math.round(pct)}%</span><button class="x gog-unq" data-gogunq="${g.id}" aria-label="Take ${esc(g.title)} out of the downloads">×</button>`
            : `<button class="btn small" data-gogdl="${g.id}">${actLabel(g)}</button>`}
      </div>`;
    }).join("")}</div>`;
  };
  const r = U.refresh;
  return `<div class="gog-wrap">${signedNote()}
  <div class="form gog-top gog-top2">
    <div class="gog-topr"><button class="btn" data-gogrefresh ${V.refreshing || r ? "disabled" : ""}>${V.refreshing || r ? "Updating list…" : "Update list"}</button>
      ${Q.running ? `<button class="btn primary" id="gog-pause">Pause</button>` : Q.paused ? `<button class="btn primary" id="gog-resume">Resume (${Q.ids.length})</button>` : ""}
      ${[...U.sel].filter(id => waiting.some(g => g.id === id)).length ? `<button class="btn primary" id="gog-dlsel">Download selected (${[...U.sel].filter(id => waiting.some(g => g.id === id)).length})</button>` : ""}
      ${waiting.length ? `<button class="btn${Q.paused || U.sel.size ? "" : " primary"}" id="gog-all">Download all (${waiting.length})</button>` : ""}</div>
    <div class="gog-topl"><h2>${n.length ? `${n.length} game${n.length > 1 ? "s" : ""} need${n.length > 1 ? "" : "s"} a download` : "Everything is backed up"}</h2>
      <p class="hint">${V.last_check ? `List updated ${esc(V.last_check)}` : "List not updated yet"} · ${gb(n.reduce((a, g) => a + g.need, 0))} to download · ${gb(V.free)} free on this drive${Q.running && Q.speed ? ` · ${gb(Q.speed)}/s` : ""}</p>
      ${r ? `<p class="hint">${esc(r.what)} ${r.total ? `(${r.done}/${r.total})` : ""}</p>` : ""}</div>
  </div>
  ${(() => { const want = n.filter(g => !inQ(g.id) || Q.paused).reduce((a, g) => a + g.need, 0); return want > V.free ? `<div class="gog-paused" role="status"><b>Not enough room for everything</b><span>${gb(want)} to download, ${gb(V.free)} free on this drive. Emu Vault downloads what fits and skips a game that does not fit, with a note. Make room or pick fewer games.</span></div>` : ""; })()}
  ${Q.paused ? `<div class="gog-paused" role="status"><b>Paused${Q.paused_at ? " " + esc(Q.paused_at) : ""}</b><span>${Q.ids.length} game${Q.ids.length > 1 ? "s" : ""} waiting. What is already on the drive stays there. Resume goes on from that point.</span></div>` : ""}
  ${grp("upd", "New versions")}${grp("inc", "Incomplete downloads")}${grp("new", "Not downloaded yet")}${grp("bad", "Damaged files")}${grp("extra", "Extras missing")}
  <p class="hint">Downloads go on where they stopped after Pause, after closing Emu Vault, or when the drive was unplugged. They never start by themselves: after a restart you press Resume. ${V.settings.verify ? "Every file is checked against the MD5 from GOG. " : ""}${V.settings.old === "delete" ? "Old versions are deleted after the new one is in." : "Old versions move to <span class=\"mono\">_duplicates</span>."}</p>
  ${U.check ? `<p class="hint">Checking files: ${esc(U.check.title)} (${U.check.n + 1}/${U.check.count}) <button class="btn small" id="gog-checkstop">Stop</button></p>` : `<button class="btn small" data-gogcheck="all" style="align-self:flex-start">Check all files now (MD5)</button>`}
  </div>`;
}

// ---------- GOG Settings ----------
function setHTML() {
  if (!V) return `<p class="hint">${esc(U.err || "Loading…")}</p>`;
  const S = V.settings;
  const seg = (name, opts, val) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-${name}="${v}" aria-pressed="${String(v) === String(val)}">${l}</button>`).join("")}</div>`;
  const cmd = `gog-downloader download${["windows", "linux", "osx"].filter(o => S.os.includes(o)).map(o => " --os " + o).join("")} --language ${S.lang}${S.extras ? " --extras" : ""}${S.patches ? "" : " --no-patches"}`;
  const gd = V.gd, found = (U.gd || []).filter(x => !x.error && (!gd || x.path !== gd.path));
  return `<div class="gog-wrap" style="display:flex;flex-direction:column;gap:16px">
  <div class="form set-sec">
    <div class="field"><label class="inline gog-switch" for="gog-on"><input type="checkbox" id="gog-on" ${V.on ? "checked" : ""}> <b>GOG backups</b></label>
      <p class="hint">Turn off to hide GOG Library and GOG Updates. Your downloaded games stay on the drive.</p></div>
  </div>
  ${V.on ? `
  <div class="form set-sec"><h2>Account</h2>
    ${V.signed ? `<div class="gog-acc"><span class="gog-av" aria-hidden="true">${esc((V.user || "G")[0].toUpperCase())}</span><div><b>${esc(V.user)}</b><p class="hint" style="margin:0">Signed in${games().length ? ` · ${games().length} games on this account` : ""}</p></div><button class="btn small" id="gog-out">Sign out</button></div>`
      : `<div class="gog-acc"><div style="flex:1"><b>Not signed in</b><p class="hint" style="margin:0">A window opens with the real GOG login page. When you are logged in, Emu Vault catches the empty page by itself, you don't copy anything. Emu Vault never sees your password, only the key GOG gives back.</p></div><button class="btn primary" id="gog-in">Sign in with GOG</button></div>
      <details class="gog-man"><summary>Sign in by hand (if the window does not work)</summary>
        <ol class="gog-steps">
          <li>Open this link in your browser and log in:
            <div class="gog-path"><input type="text" id="gog-authurl" readonly value="${esc(V.login_url)}" aria-label="GOG login link"><button class="btn small" id="gog-copyurl">Copy link</button><button class="btn small" id="gog-openurl">Open</button></div></li>
          <li>After logging in you land on an empty page. Copy the address of that page from the address bar.<p class="hint" style="margin:2px 0 0">It starts with <span class="mono">https://embed.gog.com/on_login_success?origin=client&amp;code=</span></p></li>
          <li>Paste it here:
            <div class="gog-path"><input type="text" id="gog-code" placeholder="Paste the address or only the code" aria-label="Address of the empty page"><button class="btn small primary" id="gog-usecode">Sign in</button></div></li>
        </ol>
        <p class="hint" style="margin:0">The same login gog-downloader and lgogdownloader use. A code works only once and only for a few minutes.</p>
      </details>`}
  </div>
  <div class="form set-sec"><h2>Where the games go</h2>
    <div class="field"><span class="lbl">Folder</span>${seg("gogwhere", [["main", "In the main folder"], ["other", "Other folder or drive"]], V.in_main ? "main" : "other")}
      <div class="gog-path"><input type="text" id="gog-dir" value="${esc(V.dir)}" ${V.in_main ? "readonly" : ""} aria-label="GOG folder"><button class="btn small" id="gog-pick">Choose…</button></div>
      <p class="hint">${gb(V.free)} free · each game gets its own folder with the GOG name, extras in <span class="mono">extras/</span>.</p></div>
    ${gd ? `<div class="gog-found" role="status"><b>Using gog-downloader's list</b><span class="mono">${esc(gd.path)}</span><span>${gd.error ? esc(gd.error) : `${gd.games} games, ${gd.files} files · naming ${esc(gd.naming || "?")}. Read only: Emu Vault never writes in it. Files gog-downloader already checked count as checked.`}</span><span><button class="btn small" data-gogset-gd="">Stop using it</button></span></div>` : ""}
    ${found.map(x => `<div class="gog-found" role="status"><b>Found gog-downloader's list</b><span class="mono">${esc(x.path)}</span><span>${x.games} games, ${x.files} files${x.download_path ? ` · folder <span class="mono">${esc(x.download_path)}</span>` : ""} · naming ${esc(x.naming || "?")}</span>
      <span><button class="btn small primary" data-gogusegd="${esc(x.path)}">Use it${x.download_path ? " and its folder" : ""}</button></span></div>`).join("")}
    <div class="field"><span class="lbl">Layout inside a game folder</span>${seg("goglayout", [["gd", "Like gog-downloader"], ["split", "Separate windows/ and linux/"]], S.layout)}
      <p class="hint">${S.layout === "gd" ? `<span class="mono">game_name/setup_…exe</span> and <span class="mono">game_name/extras/…</span>. You can keep using gog-downloader on the same folder.` : `<span class="mono">game_name/windows/</span>, <span class="mono">linux/</span>, <span class="mono">extras/</span>. Files already in the game folder are not moved: they are counted as missing.`}</p></div>
    <div class="field"><span class="lbl">Covers</span>${seg("gogcov", [["", "Only in _emuvault"], ["game", "Also in each game folder"], ["folder", "Also in a covers folder"]], S.cover_copy || "")}
      <p class="hint">${S.cover_copy === "game" ? `A copy as <span class="mono">cover.jpg</span> in the folder of each game that is on the drive. Your own <span class="mono">cover.jpg</span> there is never overwritten.` : S.cover_copy === "folder" ? `A copy of every cover in <span class="mono">${esc(V.dir)}/covers/</span>, named like the game folders.` : `They stay in <span class="mono">${esc(V.dir)}/_emuvault/covers/</span> on the drive and are kept, also after a reinstall.`}</p></div>
    <div class="field"><button class="btn small" id="gog-covall" style="align-self:flex-start" ${U.covers ? "disabled" : ""}>${U.covers ? `Getting covers… ${U.covers.done || 0}/${U.covers.total || "?"}` : "Get all covers from GOG again"}</button>
      <p class="hint">Once a week Emu Vault checks by itself whether GOG has a new cover. Your own covers are never replaced.</p></div>
    <div class="field"><span class="lbl">Folder names</span>${seg("gognaming", [["gog-slug", "GOG name (baldurs_gate_iii)"], ["custom", "Title (Baldur_s_Gate_3)"], ["rom-manager", "win/ and linux/ first"]], S.naming)}
      <p class="hint">Same choices as gog-downloader's naming-convention. Existing folders are found either way.</p></div>
    <div class="field"><button class="btn small" id="gog-gdpick">Use a gog-downloader database…</button></div>
  </div>
  <div class="form set-sec"><h2>What to download</h2>
    <div class="field"><span class="lbl">Systems</span><div class="gog-checks">
      <label class="inline" for="gog-win"><input type="checkbox" id="gog-win" data-gogos="windows" ${S.os.includes("windows") ? "checked" : ""}> Windows</label>
      <label class="inline" for="gog-lin"><input type="checkbox" id="gog-lin" data-gogos="linux" ${S.os.includes("linux") ? "checked" : ""}> Linux</label>
      <label class="inline" for="gog-mac"><input type="checkbox" id="gog-mac" data-gogos="osx" ${S.os.includes("osx") ? "checked" : ""}> macOS</label></div>
      <p class="hint">Changes count after the next Update list.</p></div>
    <div class="field"><label for="gog-lang">Language</label><select id="gog-lang">${[["en", "English"], ["nl", "Dutch"], ["de", "German"], ["fr", "French"], ["es", "Spanish"], ["it", "Italian"], ["pl", "Polish"], ["pt", "Portuguese"], ["ru", "Russian"], ["jp", "Japanese"], ["cn", "Chinese"]].map(([v, l]) => `<option value="${v}" ${S.lang === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <p class="hint">Games without this language fall back to English.</p></div>
    <div class="field"><label class="inline" for="gog-ex"><input type="checkbox" id="gog-ex" ${S.extras ? "checked" : ""}> Extras: soundtracks, manuals, artbooks, wallpapers</label></div>
    <div class="field"><label class="inline" for="gog-pa"><input type="checkbox" id="gog-pa" ${S.patches ? "checked" : ""}> Patches (small update files between versions)</label>
      <p class="hint">Off: you always get the full installer of the newest version.</p></div>
    <div class="field"><span class="lbl">Old versions</span>${seg("gogold", [["delete", "Keep only the newest"], ["dup", "Keep the old one in _duplicates"]], S.old)}
      <p class="hint">${S.old === "delete" ? "When an update is in and its MD5 matches, the old version is deleted. One version per game stays." : "The old version moves to <span class=\"mono\">_duplicates</span>. You delete it yourself when you no longer need it."}</p></div>
    <div class="field"><label class="inline" for="gog-ver"><input type="checkbox" id="gog-ver" ${S.verify ? "checked" : ""}> Check every file against GOG's MD5 after download</label></div>
    <div class="field"><span class="lbl">Games downloading at the same time</span>${seg("gogpar", [[1, "1"], [2, "2"], [3, "3"], [4, "4"]], S.parallel)}</div>
    <div class="field"><span class="lbl">Connections per file</span>${seg("gogconn", [[1, "1"], [2, "2"], [4, "4"], [6, "6"], [8, "8"]], S.conns || 4)}
      <p class="hint">GOG gives each connection only part of your line. More connections download one file in pieces at the same time. All downloads together use at most 12 connections.</p></div>
    <div class="field"><span class="lbl">Same as this gog-downloader command</span><code class="gog-cmd">${esc(cmd)}</code></div>
  </div>
  <div class="form set-sec"><h2>Saves</h2>
    <div class="field"><label for="gog-savesdir">Saves folder</label><div class="gog-path"><input type="text" id="gog-savesdir" value="${esc(V.saves_dir)}" aria-label="Saves folder"><button class="btn small" id="gog-savespick">Choose…</button></div>
      <p class="hint">Per game: <span class="mono">&lt;game&gt;/cloud/</span> for GOG's cloud saves and <span class="mono">&lt;game&gt;/mine/</span> for your own, for games without cloud saves or copies from your pc. This folder is backed up in Backups, like your emulator saves.</p></div>
    <div class="field"><label class="inline" for="gog-savesauto"><input type="checkbox" id="gog-savesauto" ${S.saves_auto ? "checked" : ""}> Get GOG cloud saves after Update list</label>
      <p class="hint">Only downloads. Nothing is changed or deleted in your GOG cloud.</p></div>
    <div class="field"><button class="btn small" id="gog-savesall" style="align-self:flex-start" ${U.savesBusy ? "disabled" : ""}>${U.savesBusy ? `Getting saves… ${U.savesBusy.done || 0}/${U.savesBusy.total || "?"}` : "Get all cloud saves now"}</button>
      <p class="hint">The first time GOG is asked for every game whether it has cloud saves. That takes a while.</p></div>
  </div>
  ${heroSetHTML()}
  <div class="form set-sec"><h2>Checking in the background</h2>
    <div class="field"><span class="lbl">Update the list</span>${seg("gogbg", [["off", "Never"], ["start", "On startup"], ["daily", "Every day"], ["weekly", "Every week"]], S.bg)}
      <p class="hint">While Emu Vault is open.</p></div>
    <div class="field"><label class="inline" for="gog-nt"><input type="checkbox" id="gog-nt" ${S.notify ? "checked" : ""}> Show a notice and a Home card when something is new</label>
      <p class="hint">Emu Vault only checks. It downloads when you press Download.</p></div>
  </div>` : ""}
  </div>`;
}

function heroSetHTML() {
  const h = H || {have: false};
  return `<div class="form set-sec"><h2>Heroic Games Launcher</h2>
    ${h.have ? `<div class="gog-acc"><span class="gog-av" aria-hidden="true">▶</span><div><b>Heroic ${esc(h.ver)}</b><p class="hint" style="margin:0">${h.own ? "Your own AppImage, copied into the vault" : "In the vault, nothing installed on this pc"} · <span class="mono">${esc(h.dir)}</span></p></div>
        <span class="row-btns">${h.latest && h.latest !== h.ver ? `<button class="btn small primary" id="hero-upd">${U.heroDl ? "Downloading…" : "Update to " + esc(h.latest)}</button>` : ""}<button class="btn small" id="hero-start2">Start Heroic</button></span></div>`
      : `<div class="gog-acc"><div style="flex:1"><b>Not in the vault yet</b><p class="hint" style="margin:0">Heroic is a free, open source launcher for GOG, Epic and Amazon games. Emu Vault puts the AppImage in the vault and keeps it up to date.</p></div><button class="btn primary" id="hero-get">${U.heroDl ? "Downloading… " + (U.heroDl.total ? Math.round(U.heroDl.done / U.heroDl.total * 100) + "%" : "") : "Get Heroic"}</button></div>`}
    <div class="field"><span class="lbl">Where Heroic keeps its things</span>
      <p class="hint" style="margin:0">Settings, your Heroic login, Wine and Proton versions and its game list all stay in <span class="mono">Launchers/Heroic/home/</span>. Plug the drive into another pc and Heroic is ready there too.</p></div>
    <div class="field"><button class="btn small" id="hero-own" style="align-self:flex-start">Use the Heroic I already have…</button>
      <label class="inline" for="hero-copy"><input type="checkbox" id="hero-copy" checked> Take my Heroic settings and login along (not its Wine/Proton downloads)</label>
      <p class="hint">Pick your Heroic AppImage. It is copied into the vault, the one on your pc stays as it is.</p></div>
  </div>`;
}

// ---------- Home card ----------
function homeItem() {
  if (!V || !V.on || !V.settings.notify) return null;
  const n = need(); if (!n.length && !V.queue.paused) return null;
  if (V.queue.paused) return {k: "warn", icon: "⏸", t: `GOG: downloads paused (${V.queue.ids.length})`, s: "Press Resume to go on where it stopped", go: "goghome", btn: "Show"};
  return {k: "warn", icon: "⇣", t: `GOG: ${n.length} game${n.length > 1 ? "s" : ""} need${n.length > 1 ? "" : "s"} a download`, s: `${gb(n.reduce((a, g) => a + g.need, 0))} · list updated ${V.last_check || "never"}`, go: "goghome", btn: "Show"};
}

// ---------- render ----------
function render() {
  if (!V) { $("#view-gogset").innerHTML = setHTML(); return; }
  $("#view-goghome").innerHTML = ghomeHTML();
  if (!$("#view-goglib").hidden || U.lbx == null) $("#view-goglib").innerHTML = libHTML();
  $("#view-gogupd").innerHTML = updHTML();
  $("#view-gogset").innerHTML = setHTML();
  const n = need().length;
  $("#n-gogupd").textContent = V.on && (n || V.queue.ids.length) ? (V.queue.running ? "↓ " : "") + (n || V.queue.ids.length) : "";
  $("#n-goglib").textContent = V.on && games().length ? games().length : "";
  $("#n-goghome").textContent = V.on && n ? n + " to do" : "";
  document.querySelectorAll('.gog-tab[data-tab="goghome"],.gog-tab[data-tab="goglib"],.gog-tab[data-tab="gogupd"]').forEach(t => t.hidden = !V.on);
  if (!V.on && (visible("goghome") || visible("goglib") || visible("gogupd"))) { const b = $('.tab[data-tab="gogset"]'); b && b.click(); }
  if (typeof window.renderHome === "function" && visible("home")) { try { window.renderHome(); } catch (e) {} }
}
function keepFocus(f) {
  const a = document.activeElement, id = a && a.id, pos = a && a.selectionStart;
  f();
  if (id) { const e = document.getElementById(id); if (e && e !== document.activeElement) { e.focus(); try { if (pos != null) e.setSelectionRange(pos, pos); } catch (x) {} } }
}
let rqs = 0;
function renderSoonSet() { if (rqs) return; rqs = setTimeout(() => { rqs = 0; keepFocus(() => $("#view-gogset").innerHTML = setHTML()); }, 300); }
let rq = 0;
function renderSoon() { if (rq) return; rq = setTimeout(() => { rq = 0; keepFocus(() => { if (visible("gogupd")) $("#view-gogupd").innerHTML = updHTML(); if (visible("goghome") && V) $("#view-goghome").innerHTML = ghomeHTML(); if (visible("gogset") && V && U.heroDl) $("#view-gogset").innerHTML = setHTML(); const n = need().length; $("#n-gogupd").textContent = V && V.on && (n || V.queue.ids.length) ? (V.queue.running ? "↓ " : "") + (n || V.queue.ids.length) : ""; }); }, 250); }

async function set(s) { try { await inv("gog_set", {s}); } catch (e) { say(errMsg(e)); } await load(); }
async function act(f, okMsg) { try { const r = await f(); if (okMsg) say(typeof okMsg === "function" ? okMsg(r) : okMsg); } catch (e) { say(errMsg(e)); } await load(); }
async function refresh() {
  U.refresh = {done: 0, total: 0, what: "Asking GOG for your games…"}; render();
  try { const r = await inv("gog_refresh"); say(`GOG list updated: ${r.games} games, ${r.need} need a download${r.errors.length ? `, ${r.errors.length} problems (see Activity)` : ""}`); }
  catch (e) { say(errMsg(e)); }
  U.refresh = null; await load();
}

// ---------- events ----------
document.addEventListener("click", async e => {
  const t = e.target.closest && e.target.closest("[data-gogcovagain],#gog-covall,[data-gogsavesget],[data-gogsavesopen],[data-gogsavescopy],#gog-savesall,#gog-savespick,#hero-start,#hero-start2,#hero-start3,#hero-upd,#hero-get,#hero-own,[data-gogview],[data-goglbx],[data-goglnav],[data-gogcovpick],[data-gogcovreset],[data-goglfiles],#gog-lbx-x,[data-gogfold],[data-gogdl],[data-goqf],[data-gogtab],[data-gogrefresh],#gog-all,#gog-dlsel,#gog-pause,#gog-resume,[data-gogunq],#gog-out,#gog-in,#gog-copyurl,#gog-openurl,#gog-usecode,#gog-pick,#gog-gdpick,[data-gogusegd],[data-gogset-gd],[data-gogwhere],[data-goglayout],[data-gognaming],[data-gogold],[data-gogcov],[data-gogconn],[data-gogpar],[data-gogbg],[data-gogopen],[data-gogcheck],#gog-checkstop,[data-gogskip]");
  if (!t) return;
  const d = t.dataset;
  if (d.gogcovagain) { try { await inv("gog_cover_refetch", {slug: d.gogcovagain}); U.stamp = Date.now(); say("GOG's cover is in again"); } catch (x) { say(errMsg(x)); } await load(); if (U.lbx != null && $("#gog-lbx")) $("#gog-lbx").innerHTML = lbxHTML(); return; }
  if (t.id === "gog-covall") { U.covers = {done: 0, total: 0}; render(); try { const n = await inv("gog_cover_refetch", {slug: null}); say(`${n} covers in again`); } catch (x) { say(errMsg(x)); } U.covers = null; U.stamp = Date.now(); await load(); return; }
  if (d.gogsavesget || t.id === "gog-savesall") { U.savesBusy = {done: 0, total: 0}; render(); if (U.lbx != null && $("#gog-lbx")) $("#gog-lbx").innerHTML = lbxHTML();
    try { const [games, files] = await inv("gog_saves_get", {ids: d.gogsavesget ? [+d.gogsavesget] : null}); say(games ? `Cloud saves: ${files} new or changed file${files === 1 ? "" : "s"}` : "No cloud saves at GOG for this"); } catch (x) { say(errMsg(x)); }
    U.savesBusy = null; await load(); if (U.lbx != null && $("#gog-lbx")) $("#gog-lbx").innerHTML = lbxHTML(); return; }
  if (d.gogsavesopen) { try { const p = await inv("gog_saves_dir", {slug: d.gogsavesopen, which: d.which}); await inv("open_path", {path: p}); } catch (x) { say(errMsg(x)); } return; }
  if (d.gogsavescopy) { let p = null; try { p = await T.dialog.open({directory: true, title: "The folder with the saves"}); } catch (x) {} if (!p) return; try { const n = await inv("gog_saves_copy", {slug: d.gogsavescopy, from: p}); say(`${n} save file${n === 1 ? "" : "s"} copied`); } catch (x) { say(errMsg(x)); } await load(); if (U.lbx != null && $("#gog-lbx")) $("#gog-lbx").innerHTML = lbxHTML(); return; }
  if (t.id === "gog-savespick") { let p = null; try { p = await T.dialog.open({directory: true, title: "Where GOG saves go"}); } catch (x) {} if (p) await set({saves_dir: p}); return; }
  if (t.id === "hero-start" || t.id === "hero-start2" || t.id === "hero-start3") { inv("heroic_start").then(() => say("Heroic starts")).catch(x => say(errMsg(x))); return; }
  if (t.id === "hero-get" || t.id === "hero-upd") { if (U.heroDl) return; U.heroDl = {done: 0, total: 0}; render(); try { H = await inv("heroic_get"); say(`Heroic ${H.ver} is in the vault`); } catch (x) { say(errMsg(x)); } U.heroDl = null; await load(); return; }
  if (t.id === "hero-own") { let p = null; try { p = await T.dialog.open({title: "Your Heroic AppImage", filters: [{name: "AppImage", extensions: ["AppImage", "appimage"]}]}); } catch (x) {} if (!p) return; await act(() => inv("heroic_own", {path: p, copySettings: !!($("#hero-copy") && $("#hero-copy").checked)}), "Your Heroic is used, from the vault"); return; }
  if (d.gogview) { U.view = d.gogview; try { localStorage.setItem("gog-view", U.view); } catch (x) {} render(); return; }
  if (d.goglbx) { openLbx(+d.goglbx); return; }
  if (d.goglnav) { navLbx(+d.goglnav); return; }
  if (t.id === "gog-lbx-x") { closeLbx(); return; }
  if (d.gogcovpick != null) {
    let p = null; try { p = await T.dialog.open({filters: [{name: "Pictures", extensions: ["jpg", "jpeg", "png", "webp"]}], title: "A picture for the cover"}); } catch (x) {}
    if (!p) return;
    try { await inv("gog_cover_set", {slug: d.gogcovpick, path: p}); U.stamp = Date.now(); say("Your cover is used"); } catch (x) { say(errMsg(x)); }
    await load(); if (U.lbx != null) $("#gog-lbx").innerHTML = lbxHTML(); return;
  }
  if (d.gogcovreset != null) { try { await inv("gog_cover_reset", {slug: d.gogcovreset}); say("Back to GOG's cover"); } catch (x) { say(errMsg(x)); } await load(); if (U.lbx != null) $("#gog-lbx").innerHTML = lbxHTML(); return; }
  if (d.goglfiles) { const id = +d.goglfiles; closeLbx(); U.view = "list"; U.open = id; render(); const r = document.querySelector(`.gog-head[data-gogfold="${id}"]`); r && (r.scrollIntoView({block: "center"}), r.focus()); return; }
  if (d.gogfold) { const id = +d.gogfold; U.open = U.open === id ? null : id; render(); const r = document.querySelector(`.gog-head[data-gogfold="${id}"]`); r && r.focus(); return; }
  if (d.gogdl) { await act(() => inv("gog_download", {ids: [+d.gogdl]}), "Added to downloads"); if (U.lbx != null && $("#gog-lbx")) $("#gog-lbx").innerHTML = lbxHTML(); return; }
  if (d.goqf) { U.filter = d.goqf; render(); return; }
  if (d.gogtab) { const b = document.querySelector(`.tab[data-tab="${d.gogtab}"]`); b && b.click(); return; }
  if (d.gogrefresh != null) { refresh(); return; }
  if (t.id === "gog-dlsel") { const ids = [...U.sel].filter(id => need().some(g => g.id === id) && !inQ(id)); U.sel.clear(); await act(() => inv("gog_download", {ids}), `${ids.length} game${ids.length > 1 ? "s" : ""} added to downloads`); return; }
  if (t.id === "gog-all") { await act(() => inv("gog_download", {ids: need().filter(g => !inQ(g.id)).map(g => g.id)})); return; }
  if (t.id === "gog-pause") { await act(() => inv("gog_pause"), "Pausing… what is downloaded stays"); return; }
  if (t.id === "gog-resume") { await act(() => inv("gog_resume"), "Going on where it stopped"); return; }
  if (d.gogunq) { await act(() => inv("gog_unqueue", {ids: [+d.gogunq]})); return; }
  if (t.id === "gog-out") { await act(() => inv("gog_logout"), "Signed out of GOG"); return; }
  if (t.id === "gog-in") { try { await inv("gog_login_window"); } catch (x) { say(errMsg(x)); const m = $(".gog-man"); if (m) m.open = true; } return; }
  if (t.id === "gog-copyurl") { const i = $("#gog-authurl"); try { await navigator.clipboard.writeText(i.value); say("Link copied"); } catch (x) { i.select(); say("Press Ctrl+C to copy"); } return; }
  if (t.id === "gog-openurl") { inv("plugin:opener|open_url", {url: V.login_url}).catch(() => { try { T.opener.openUrl(V.login_url); } catch (x) { say("Copy the link and open it in your browser"); } }); return; }
  if (t.id === "gog-usecode") { const v = $("#gog-code").value; await act(() => inv("gog_login_code", {code: v}), u => `Signed in to GOG as ${u}`); return; }
  if (t.id === "gog-pick") { let p = null; try { p = await T.dialog.open({directory: true, title: "The folder for your GOG games"}); } catch (x) {} if (p) await set({dir: p}); return; }
  if (t.id === "gog-gdpick") { let p = null; try { p = await T.dialog.open({filters: [{name: "gog-downloader database", extensions: ["db"]}], title: "gog-downloader.db"}); } catch (x) {} if (p) await act(() => inv("gog_gd_use", {path: p, takeFolder: false}), "Using gog-downloader's list"); return; }
  if (d.gogusegd) { await act(() => inv("gog_gd_use", {path: d.gogusegd, takeFolder: true}), r => `Using gog-downloader's list (${r.games} games)`); U.gd = null; return; }
  if (d.gogsetGd != null) { await set({gd_db: ""}); return; }
  if (d.gogwhere) { await set({dir: d.gogwhere === "main" ? "" : V.dir}); if (d.gogwhere === "other") { const i = $("#gog-dir"); i && i.focus(); } return; }
  if (d.goglayout) { await set({layout: d.goglayout}); return; }
  if (d.gognaming) { await set({naming: d.gognaming}); return; }
  if (d.gogold) { await set({old: d.gogold}); return; }
  if (d.gogcov != null) { await set({cover_copy: d.gogcov}); say(d.gogcov ? "Covers copied" : "Covers stay in _emuvault only"); return; }
  if (d.gogpar) { await set({parallel: +d.gogpar}); return; }
  if (d.gogconn) { await set({conns: +d.gogconn}); return; }
  if (d.gogbg) { await set({bg: d.gogbg}); return; }
  if (d.gogopen) { inv("open_path", {path: d.gogopen}).catch(() => inv("open_path", {path: V.dir})).catch(x => say(errMsg(x))); return; }
  if (d.gogcheck) { const ids = d.gogcheck === "all" ? null : [+d.gogcheck]; U.check = {n: 0, count: 1, title: "…"}; renderSoon(); await act(() => inv("gog_check", {ids}), bad => bad ? `${bad} file${bad > 1 ? "s" : ""} do not match GOG's MD5` : "All checked files match GOG's MD5"); U.check = null; render(); return; }
  if (t.id === "gog-checkstop") { inv("gog_check_stop"); return; }
  if (d.gogskip) { const id = +d.gogskip, g = games().find(x => x.id === id); await set({skip: [id, g.st !== "skip"]}); return; }
});
document.addEventListener("change", e => {
  const t = e.target; if (!t.closest || !t.closest(".gog")) return;
  if (t.id === "gog-code" || t.id === "gog-authurl" || t.id === "gog-q") return;
  if (t.dataset.gogsel) { const id = +t.dataset.gogsel; t.checked ? U.sel.add(id) : U.sel.delete(id); keepFocus(() => $("#view-gogupd").innerHTML = updHTML()); return; }
  if (t.dataset.gogselgrp) { need().filter(g => g.st === t.dataset.gogselgrp && !inQ(g.id)).forEach(g => t.checked ? U.sel.add(g.id) : U.sel.delete(g.id)); keepFocus(() => $("#view-gogupd").innerHTML = updHTML()); return; }
  if (t.id === "gog-on") { set({on: t.checked}).then(() => { if (t.checked && V && !V.gd) findGd(); }); return; }
  if (t.dataset.gogos) { const os = ["windows", "linux", "osx"].filter(o => o === t.dataset.gogos ? t.checked : V.settings.os.includes(o)); set({os}); return; }
  if (t.id === "gog-lang") { set({lang: t.value}); return; }
  if (t.id === "gog-ex") { set({extras: t.checked}); return; }
  if (t.id === "gog-pa") { set({patches: t.checked}); return; }
  if (t.id === "gog-ver") { set({verify: t.checked}); return; }
  if (t.id === "gog-nt") { set({notify: t.checked}); return; }
  if (t.id === "gog-dir") { set({dir: t.value}); return; }
  if (t.id === "gog-savesdir") { set({saves_dir: t.value}); return; }
  if (t.id === "gog-savesauto") { set({saves_auto: t.checked}); return; }
  if (t.id === "hero-games") { act(() => inv("heroic_set_games", {dir: t.value})); return; }
  if (t.id === "hero-copy" || t.id === "gog-setup") return;
});
document.addEventListener("input", e => { if (e.target.id === "gog-q") { U.q = e.target.value; keepFocus(() => $("#view-goglib").innerHTML = libHTML()); } });
async function findGd() { try { U.gd = await inv("gog_gd_find"); } catch (e) { U.gd = []; } render(); }

const L = T.event.listen;
L("gog-progress", e => { if (!V) return; V.queue = e.payload; renderSoon(); });
L("gog-changed", () => load());
L("gog-view", e => { V = e.payload; renderSoon(); if (!visible("goglib") && !visible("goghome")) return; keepFocus(() => { if (visible("goglib") && U.lbx == null) $("#view-goglib").innerHTML = libHTML(); if (visible("goghome")) $("#view-goghome").innerHTML = ghomeHTML(); }); });
L("gog-drive", () => { say("The GOG folder is gone (drive unplugged?). Downloads are paused."); load(); });
L("gog-covers", e => { U.covers = e.payload.end ? null : e.payload; if (visible("gogset")) renderSoonSet(); });
L("gog-saves", e => { U.savesBusy = e.payload.end ? null : e.payload; if (visible("gogset")) renderSoonSet(); });
L("gog-refresh", e => { U.refresh = e.payload; renderSoon(); });
L("gog-check", e => { U.check = e.payload.end ? null : e.payload; renderSoon(); });
L("heroic-progress", e => { if (U.heroDl) { U.heroDl = e.payload; renderSoon(); } });
L("gog-login", e => { say(e.payload.ok ? `Signed in to GOG as ${e.payload.user}` : e.payload.error); load(); });

// ---------- hooks into the rest of the app (after preview.js) ----------
window.addEventListener("DOMContentLoaded", () => {
  // the Home list
  if (typeof window.homeItems === "function") {
    const orig = window.homeItems;
    window.homeItems = function () { const it = orig.apply(this, arguments); try { const g = homeItem(); if (g) it.splice(it[0] && it[0].k === "start" ? 1 : 0, 0, g); } catch (e) {} return it; };
    try { if (typeof GO === "object") GO.gogupd = () => go("gogupd"); GO.goghome = () => go("goghome"); } catch (e) {}
  }
  // the More menu on the phone
  document.addEventListener("click", e => {
    if (!e.target.closest(".tab-more")) return;
    setTimeout(() => {
      const menu = $(".more-menu"); if (!menu || menu.hidden || menu.querySelector("[data-gogtab]")) return;
      menu.insertAdjacentHTML("beforeend", (V && V.on ? [["goghome", "GOG Home"], ["goglib", "GOG Library"], ["gogupd", "GOG Updates"]] : []).concat([["gogset", "GOG Settings"]])
        .map(([k, l]) => `<button role="menuitem" data-gogtab="${k}"><span>${l}</span><span class="muted">${esc($("#n-" + k).textContent)}</span></button>`).join(""));
      menu.querySelectorAll("[data-gogtab]").forEach(x => x.addEventListener("click", () => menu.hidden = true));
    }, 0);
  }, true);
  document.querySelectorAll(".gog-tab").forEach(t => t.addEventListener("click", () => { if (t.dataset.tab === "gogset" && V && V.on && !U.gd) findGd(); if (V && V.on) heroCheck(); load(true); }));
  load(true).then(selftest);
});

// ---------- self-test of this module (only with EMUVAULT_GOG_SELFTEST) ----------
async function selftest() {
  const out = await inv("gog_selftest_path").catch(() => ""); if (!out) return;
  const r = [], w = ms => new Promise(res => setTimeout(res, ms)), I = inv;
  const step = async (n, f) => { try { r.push(n + ": " + JSON.stringify(await f())); } catch (e) { r.push(n + ": ERR " + errMsg(e)); } };
  const sum = v => v.games.map(g => [g.slug, g.st, g.have, g.files.map(f => f.st + (f.md5 ? "/" + f.md5 : "")).join(","), g.old.length, !!g.cover]);
  const dir = out.replace(/\/[^/]+$/, "") + "/gogdir";
  await step("on", () => I("gog_set", {s: {on: true, dir}}));
  await step("gd_find", async () => (await I("gog_gd_find")).map(x => [x.path.split("/").slice(-3).join("/"), x.games, x.naming, x.error]));
  await step("gd_use", async () => { const x = (await I("gog_gd_find"))[0]; return x ? (await I("gog_gd_use", {path: x.path, takeFolder: false})).games : "none"; });
  await step("bad code", () => I("gog_login_code", {code: "https://embed.gog.com/on_login_success?origin=client"}));
  await step("login", () => I("gog_login_code", {code: "http://127.0.0.1:8812/embed/on_login_success?origin=client&code=GOODCODE"}));
  await step("refresh", async () => { const x = await I("gog_refresh"); return [x.games, x.need, x.errors]; });
  let v = await I("gog_view"); r.push("after refresh: " + JSON.stringify(sum(v)));
  await step("saves after refresh", async () => (await I("gog_saves")).map(x => [x.id, x.cloud, x.files, x.mine_files]));
  await step("saves copy", () => I("gog_saves_copy", {slug: "beta_quest", from: out.replace(/\/[^/]+$/, "") + "/gog-backup"}));
  await step("thumbs", async () => { await w(1500); const v2 = await I("gog_view"); return v2.games.map(g => g.thumb !== g.cover && g.thumb.includes("gog-thumbs")); });
  await step("quick view", async () => (await I("gog_view", {quick: true})).games.length);
  await step("cover again", () => I("gog_cover_refetch", {slug: "alpha_test"}));
  r.push("tiles: " + (go("goglib"), await w(1200), document.querySelectorAll("#view-goglib .gog-tile").length) + " covers img " + document.querySelectorAll("#view-goglib .gog-tile img").length + " shown " + [...document.querySelectorAll("#view-goglib .gog-tile img")].filter(i => i.naturalWidth > 0).length);
  go("gogupd"); await w(400); r.push("select boxes: " + document.querySelectorAll("#view-gogupd [data-gogsel]").length + " groups " + document.querySelectorAll("#view-gogupd [data-gogselgrp]").length);
  await step("cover copy", () => I("gog_set", {s: {cover_copy: "game"}}));
  await step("download alpha", async () => (await I("gog_download", {ids: [v.games.find(g => g.slug === "alpha_test").id]})).ids.length);
  await w(1200); await step("speed while downloading", async () => { const q = (await I("gog_view")).queue; return [q.speed, q.items.map(x => [x.file, x.speed])]; });
  await w(300); await step("pause", async () => (await I("gog_pause")).ids);
  await w(1500); v = await I("gog_view"); r.push("paused: " + JSON.stringify([v.queue.running, v.queue.paused, v.queue.paused_at, sum(v).find(g => g[0] === "alpha_test")]));
  await step("resume", async () => (await I("gog_resume")).running);
  for (let i = 0; i < 60 && (await I("gog_view")).queue.running; i++) await w(500);
  v = await I("gog_view"); r.push("after resume: " + JSON.stringify(sum(v).find(g => g[0] === "alpha_test")));
  r.push("extra sizes: " + JSON.stringify((await I("gog_view")).games.find(g => g.slug === "alpha_test").files.filter(f => f.kind === "extra").map(f => [f.name, f.size, f.st])));
  await step("update gamma", async () => (await I("gog_download", {ids: [v.games.find(g => g.slug === "gamma").id]})).ids.length);
  for (let i = 0; i < 60 && (await I("gog_view")).queue.running; i++) await w(500);
  v = await I("gog_view"); r.push("after gamma: " + JSON.stringify(sum(v).find(g => g[0] === "gamma")));
  await I("write_text", {path: dir + "/beta_quest/setup_beta_quest_1.5_(64bit)_(150).exe", text: "broken"});
  v = await I("gog_view"); r.push("beta broken: " + JSON.stringify(sum(v).find(g => g[0] === "beta_quest")));
  await step("download beta again", async () => (await I("gog_download", {ids: [1002]})).ids.length);
  for (let i = 0; i < 60 && (await I("gog_view")).queue.running; i++) await w(500);
  v = await I("gog_view"); r.push("beta 1st try: " + JSON.stringify(sum(v).find(g => g[0] === "beta_quest")) + " " + JSON.stringify(v.queue.items.map(x => x.err)));
  if (sum(v).find(g => g[0] === "beta_quest")[1] !== "ok") { await I("gog_unqueue", {ids: [1002]}); await I("gog_download", {ids: [1002]}); for (let i = 0; i < 60 && (await I("gog_view")).queue.running; i++) await w(500); }
  v = await I("gog_view"); r.push("beta after: " + JSON.stringify(sum(v).find(g => g[0] === "beta_quest")));
  await I("write_text", {path: out + ".unplug", text: "x"});
  for (let i = 0; i < 20 && (await I("gog_view")).drive_ok; i++) await w(500);
  await step("unplugged view", async () => { const x = await I("gog_view"); return [x.drive_ok]; });
  await step("unplugged download", () => I("gog_download", {ids: [1003]}));
  await step("unplugged resume", () => I("gog_resume"));
  await I("write_text", {path: out + ".plug", text: "x"});
  for (let i = 0; i < 20 && !(await I("gog_view")).drive_ok; i++) await w(500);
  await step("plugged again", async () => (await I("gog_view")).drive_ok);
  r.push("title: " + (go("coll"), await w(200), $("#ptitle").textContent) + " / " + (go("gogupd"), await w(200), $("#ptitle").textContent));
  await step("check all", () => I("gog_check", {ids: null}));
  v = await I("gog_view"); r.push("after check: " + JSON.stringify(sum(v)));
  go("gogupd"); await w(300); r.push("updates page: " + $("#view-gogupd h2").textContent);
  go("home"); await w(500); r.push("home: " + ([...document.querySelectorAll("#view-home .hrow b")].map(b => b.textContent).find(t => t.startsWith("GOG")) || "no GOG row"));
  await step("heroic_get", async () => { const h = await I("heroic_get"); return [h.have, h.ver]; });
  await step("heroic install alpha (linux)", async () => (await I("heroic_install", {id: 1001})).how);
  await step("heroic install beta (windows)", async () => { const x = await I("heroic_install", {id: 1002}); return [x.how, x.setup.split("/").pop()]; });
  await step("heroic status", async () => { const h = await I("heroic_status", {check: true}); return [h.ver, h.latest, Object.keys(h.installed)]; });
  await step("heroic play", () => I("heroic_play", {id: 1001}));
  go("goghome"); await w(500); r.push("gog home: " + [...document.querySelectorAll("#view-goghome .hrow b")].map(b => b.textContent).join(" | ") + " · title " + $("#ptitle").textContent);
  await step("full_info", async () => { const f = await I("full_info"); return [f.can, f.retroarch, f.cores, f.esde, f.heroic, f.why]; });
  await step("full_make", () => I("full_make", {to: out.replace(/\/[^/]+$/, "") + "/emu-vault-full-test.sh"}));
  await step("logout", () => I("gog_logout"));
  await I("write_text", {path: out, text: r.join("\n") + "\n"});
}
window.EVGOG = {load, render, get view() { return V; }};
} catch (err) { console.error("GOG module failed, the rest of Emu Vault keeps working:", err); }
})();
