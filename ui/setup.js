// 0.9 Setup check: you set up RetroArch, ES-DE and the emulators yourself. This page only READS their settings
// and says what points to your vault. Plus RetroArch-BIOS: your BIOS files in the layout RetroArch wants.
(() => {
const nav = document.querySelector("nav.tabs"), after = nav && nav.querySelector('[data-tab="bk"]');
const setView = document.getElementById("view-set");
if (!nav || !after || !setView) return;
const TA = window.__TAURI__;
const inv = (c, a) => TA ? TA.core.invoke(c, a || {}) : Promise.reject("Open Emu Vault as an app to use this.");
const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const say = m => { try { toast(m); } catch (e) {} };

after.insertAdjacentHTML("afterend", `<button class="tab" role="tab" data-tab="setup" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10"/><path d="M4 20h16"/></svg><span class="lb">Setup check</span><span class="n" id="n-setup"></span></button>`);
setView.insertAdjacentHTML("afterend", `<section id="view-setup" class="view" hidden></section>`);
const tabEl = nav.querySelector('[data-tab="setup"]'), view = document.getElementById("view-setup");

const st = document.createElement("style");
st.textContent = `
#view-setup .sc-card{border:1px solid var(--line,#4a4535);padding:18px 20px;margin:0 0 16px;display:flex;flex-direction:column;gap:12px}
#view-setup .sc-head{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:baseline;justify-content:space-between}
#view-setup .sc-head h3{margin:0}
#view-setup .sc-fold.closed>:not(.sc-head){display:none}
#view-setup .sc-foldbtn{display:flex;align-items:baseline;gap:8px;background:none;border:0;padding:0;margin:0;color:inherit;font:inherit;cursor:pointer;text-align:left}
#view-setup .sc-foldbtn .chev{color:var(--accent,#f2a93b);width:1em}
#view-setup .sc-path{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
#view-setup .sc-path code{flex:1 1 320px;min-width:0;overflow-wrap:anywhere;padding:8px 10px;border:1px solid var(--line,#4a4535)}
#view-setup .sc-row{display:grid;grid-template-columns:24px minmax(120px,190px) minmax(0,1fr) auto;gap:6px 14px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line2,rgba(128,128,128,.18))}
#view-setup .sc-row:last-child{border-bottom:0}
#view-setup .sc-row .v{overflow-wrap:anywhere;min-width:0}
#view-setup .sc-ok{color:var(--ok,#9bc25a);font-weight:700}
#view-setup .sc-bad{color:var(--bad,#e8735a);font-weight:700}
#view-setup .sc-opt{color:var(--muted,#a39878);font-weight:700}
#view-setup .sc-map{overflow-x:auto}
#view-setup .sc-map table{border-collapse:collapse;width:100%;min-width:560px;font-size:12.5px}
#view-setup .sc-map td,#view-setup .sc-map th{padding:5px 8px;text-align:left;border-bottom:1px solid var(--line2,rgba(128,128,128,.18))}
#view-setup .sc-map th{font-weight:500;font-size:11px;letter-spacing:1px}
@media (max-width:640px){#view-setup .sc-row{grid-template-columns:24px minmax(0,1fr)}#view-setup .sc-row .v,#view-setup .sc-row .act{grid-column:2}}
.ra-off #rarch-tool,.ra-off #vemu-tool,.ra-off .rdy-block,.ra-off [data-play],.ra-off .dtest,.ra-off .dtest-with,.ra-off label:has([data-artra]),.ra-off [data-ragx="start"]{display:none!important}
.bios-rab{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:0 0 14px}`;
document.head.appendChild(st);

let OLDRA = null, oldConfirm = false;
let D = null, RB = null, busy = false, mapOpen = false, REF = null, refBusy = false, refOpen = {};
const copyBtn = p => `<button class="btn small" data-sccopy="${E(p)}">Copy path</button>`;
async function copy(p){ try { await navigator.clipboard.writeText(p); say("Path copied"); } catch (e) { say(p); } }

async function load(again){
  try { OLDRA = await inv("old_ra_info"); } catch (e) { OLDRA = null; }
  try { [D, RB] = await Promise.all([inv("setup_check"), inv("ra_bios_info", { again: !!again })]); }
  catch (e) { D = { groups: [], err: String(e) }; RB = null; }
  document.documentElement.classList.toggle("ra-off", !(D && D.ra_on));
  const bad = (D.groups || []).reduce((n, g) => n + g.rows.filter(r => r.st === "bad").length, 0);
  const n = document.getElementById("n-setup"); if (n) n.textContent = bad ? String(bad) : "";
  render();
  try { if (typeof renderBios === "function") renderBios(); } catch (e) {}
}

const MB = b => b >= 1 << 30 ? (b / (1 << 30)).toFixed(1) + " GB" : b >= 1 << 20 ? Math.round(b / (1 << 20)) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
// your own full RetroArch system folder, only read: what the vault has and hasn't of it
function refHTML(){
  const p = D && D.bios_ref;
  let h = `<div class="sc-card sys-block"><div class="sc-head"><h3>BIOS reference</h3>${REF && REF.found ? `<span class="pill ${REF.missing.length ? "warn" : "ok"}">${REF.missing.length ? `${REF.missing.length} not in the vault` : "the vault has all of it"}</span>` : ""}</div>
    <p class="hint" style="margin:0">A full RetroArch system folder of your own, somewhere else. Emu Vault only <b>reads</b> it and compares it with RetroArch-BIOS; nothing in it is written, moved or deleted.</p>
    <div class="sc-path"><code class="mono">${p ? E(p) : "no reference folder chosen"}</code><button class="btn small" data-refpick="1">${p ? "Another folder" : "Choose folder"}</button>${p ? `<button class="btn small" data-refscan="1" ${refBusy ? "disabled" : ""}>${refBusy ? "Comparing…" : "Compare"}</button><button class="linkbtn" data-refoff="1">Stop using it</button>` : ""}</div>`;
  if (p && REF && !REF.found) h += `<p class="hint" style="margin:0">That folder isn't there now (is the drive plugged in?).</p>`;
  if (REF && REF.found){
    h += `<p style="margin:0"><span class="sc-ok">✓</span> ${REF.same} the same in the vault · <span class="${REF.missing.length ? "sc-bad" : "muted"}">${REF.missing.length} not in the vault${REF.missing.length ? ` (${MB(REF.missing_bytes)})` : ""}</span> · ${REF.diff.length} another version · ${REF.extra.length} only in the vault <span class="muted">· ${REF.files} files, compared ${E(REF.when)}</span></p>`;
    const groups = {}; REF.missing.forEach(([rel, size, to]) => { const top = rel.includes("/") ? rel.split("/")[0] + "/" : "(loose files)"; (groups[top] ||= { n: 0, b: 0, items: [] }); groups[top].n++; groups[top].b += size; groups[top].items.push([rel, size, to]); });
    const keys = Object.keys(groups).sort((a, b) => a === "(loose files)" ? -1 : b === "(loose files)" ? 1 : a.localeCompare(b));
    if (keys.length){
      h += `<div class="sc-map"><table><thead><tr><th>NOT IN THE VAULT</th><th>FILES</th><th>SIZE</th><th>GOES TO</th></tr></thead><tbody>${keys.map(k => { const g = groups[k], open = !!refOpen[k];
        return `<tr><td><button class="linkbtn" data-refgrp="${E(k)}">${open ? "▾" : "▸"} ${E(k)}</button></td><td>${g.n}</td><td>${MB(g.b)}</td><td class="mono muted">${E(g.items[0][2].split("/").slice(0, 2).join("/"))}${g.items.some(x => x[2].split("/")[1] !== g.items[0][2].split("/")[1]) ? " …" : ""}</td></tr>${open ? g.items.slice(0, 300).map(([rel, size, to]) => `<tr><td class="mono" style="padding-left:24px">${E(rel)}</td><td></td><td>${MB(size)}</td><td class="mono muted">${E(to)}</td></tr>`).join("") + (g.items.length > 300 ? `<tr><td colspan="4" class="muted" style="padding-left:24px">… and ${g.items.length - 300} more</td></tr>` : "") : ""}`; }).join("")}</tbody></table></div>
        <div class="sc-path"><button class="btn small" data-refcopy="1" ${refBusy ? "disabled" : ""}>Copy what's missing into the vault (${MB(REF.missing_bytes)})</button><span class="hint">Into bios/&lt;system&gt;/ (core data into bios/_retroarch/). The reference stays as it is.</span></div>`;
    }
    if (REF.diff.length) h += `<details><summary>${REF.diff.length} another version (the vault keeps its own)</summary><div class="sc-map"><table><tbody>${REF.diff.slice(0, 300).map(([rel, a, b]) => `<tr><td class="mono">${E(rel)}</td><td>reference ${MB(a)}</td><td>vault ${MB(b)}</td></tr>`).join("")}</tbody></table></div></details>`;
    if (REF.extra.length) h += `<details><summary>${REF.extra.length} only in the vault</summary><div class="sc-map"><table><tbody>${REF.extra.slice(0, 300).map(x => `<tr><td class="mono">${E(x)}</td></tr>`).join("")}</tbody></table></div></details>`;
  }
  return h + `</div>`;
}
async function refScan(){
  if (!D || !D.bios_ref) return;
  refBusy = true; render();
  try { REF = await inv("bios_ref_scan"); } catch (e) { say(String(e)); }
  refBusy = false; render(); bannerRef();
}
function bannerRef(){ const b = document.querySelector("#view-bios .bios-ref-n"); if (b && REF && REF.found) b.textContent = REF.missing.length ? `Reference: ${REF.missing.length} not in the vault` : "Reference: the vault has all of it"; }

// RetroArch BIOS folder and BIOS reference fold open/closed (remembered)
const FOLD = { "RetroArch BIOS folder": "rab", "BIOS reference": "ref" };
let folded = { rab: true, ref: true };
try { Object.assign(folded, JSON.parse(localStorage.getItem("ev-setup-fold") || "{}")); } catch (e) {}
function foldCards(){
  view.querySelectorAll(".sc-card").forEach(c => {
    const h3 = c.querySelector(".sc-head h3"); const k = h3 && FOLD[h3.textContent.trim()]; if (!k) return;
    c.classList.add("sc-fold"); c.classList.toggle("closed", !!folded[k]);
    const b = document.createElement("button");
    b.type = "button"; b.className = "sc-foldbtn"; b.setAttribute("aria-expanded", String(!folded[k]));
    b.innerHTML = `<span class="chev" aria-hidden="true">${folded[k] ? "▸" : "▾"}</span>`; b.appendChild(h3.cloneNode(true));
    h3.replaceWith(b);
    b.onclick = () => { folded[k] = !folded[k]; try { localStorage.setItem("ev-setup-fold", JSON.stringify(folded)); } catch (e) {} render(); };
  });
}

function rowHTML(r){
  const mark = r.st === "ok" ? `<span class="sc-ok" aria-label="ok">✓</span>` : r.st === "bad" ? `<span class="sc-bad" aria-label="not set">✗</span>` : `<span class="sc-opt" aria-label="optional">·</span>`;
  return `<div class="sc-row">${mark}<span>${E(r.name)}</span><span class="v">${r.st === "ok" ? `<span class="muted">${E(r.have)}</span>` : `<span class="${r.st === "bad" ? "sc-bad" : "muted"}" style="font-weight:400">${E(r.have || "not set")}</span><br><span class="muted">${E(r.hint)}: <span class="mono">${E(r.want)}</span></span>`}</span><span class="act">${r.st === "ok" ? "" : copyBtn(r.want)}</span></div>`;
}
function groupHTML(g){
  return `<div class="sc-card sys-block"><div class="sc-head"><h3>${E(g.name)}</h3><span class="muted" style="font-size:12px">${g.file ? `Read from <span class="mono">${E(g.file)}</span>` : ""}</span></div>
    ${g.rows.length ? `<p class="hint" style="margin:0">Set these in ${E(g.where_)}.</p>${g.rows.map(rowHTML).join("")}` : `<p class="hint" style="margin:0">${E(g.where_)}</p>`}</div>`;
}

function render(){
  if (!view) return;
  if (!D){ view.innerHTML = `<p class="hint">Reading the settings…</p>`; return; }
  const files = (RB && RB.files) || [];
  // one row per BIOS file, with every name it has in RetroArch-BIOS
  const byFrom = []; files.forEach(([a, b]) => { const x = byFrom.find(r => r[0] === a); if (x) x[1].push(b); else byFrom.push([a, [b]]); });
  const shown = mapOpen ? byFrom : byFrom.slice(0, 8);
  let h = `<p class="hint" style="max-width:780px">You set up RetroArch, ES-DE and the emulators yourself. Emu Vault only <b>reads</b> their settings and tells you what points to your vault. It never changes them.</p>`;
  if (D.err) h += `<p class="hint">${E(D.err)}</p>`;
  h += `<div class="sc-card sys-block"><div class="sc-head"><h3>RetroArch BIOS folder</h3><span class="pill ${files.length ? "ok" : "warn"}">${files.length ? `${byFrom.length} BIOS files${RB.made ? ` · ${E(RB.made)}` : ""}` : "no BIOS files yet"}</span></div>
    <p class="hint" style="margin:0">Your BIOS files stay in <span class="mono">bios/&lt;system&gt;/</span>. This second folder has them in the layout RetroArch wants, and follows bios/ by itself. Point RetroArch's System/BIOS setting here once. Hard links: no extra space (a copy where the drive can't).</p>
    <div class="sc-path"><code class="mono">${E(RB ? RB.path : "")}</code>${RB ? copyBtn(RB.path) : ""}<button class="btn small" data-scopen="1">Open folder</button><button class="btn small" data-scagain="1" ${busy ? "disabled" : ""}>Make again</button></div>
    ${files.length ? `<div class="sc-map"><table><thead><tr><th>YOUR FILE</th><th>IN RETROARCH-BIOS</th></tr></thead><tbody>${shown.map(([a, b]) => `<tr><td class="mono">bios/${E(a)}</td><td class="mono" style="color:var(--accent)">${b.map(E).join(" · ")}</td></tr>`).join("")}</tbody></table></div>${byFrom.length > 8 ? `<button class="linkbtn" data-scmap="1">${mapOpen ? "Show less" : `Show all ${byFrom.length}`}</button>` : ""}` : ""}</div>`;
  h += (D.groups || []).map(groupHTML).join("");
  h += refHTML();
  if (OLDRA && OLDRA.there) h += `<div class="sc-card sys-block"><div class="sc-head"><h3>The old RetroArch in the vault</h3><span class="pill warn">${MB(OLDRA.bytes)}</span></div>
    <p class="hint" style="margin:0">${E(OLDRA.path)}: the RetroArch the vault used to start games with. You don't use it any more.${OLDRA.saves ? ` Its ${OLDRA.saves} saves and states are copied to saves/retroarch first.` : ""}</p>
    <div class="sc-path">${oldConfirm ? `<span>Sure? It goes to the trash.</span><button class="btn small primary" data-oldra="yes">Yes, remove it</button><button class="linkbtn" data-oldra="no">No</button>` : `<button class="btn small" data-oldra="ask">Remove it (to the trash)</button>`}</div></div>`;
  h += `<div class="sc-card sys-block"><div class="sc-head"><h3>Tips</h3></div>
    <p class="hint" style="margin:0">RetroArch AppImage from Apps, portable: make an empty folder next to it with the same name plus <span class="mono">.home</span> (<span class="mono">RetroArch-Linux-x86_64.AppImage.home</span>). RetroArch then keeps its settings, cores and saves there, on your drive.</p>
    <p class="hint" style="margin:0">Which core or emulator plays a system: ES-DE › Main menu › Other settings › Alternative emulators. Cores: RetroArch › Online Updater › Core Downloader.</p>
    <p class="hint" style="margin:0">Saves: the folders <span class="mono">saves/retroarch</span> and <span class="mono">saves/retroarch-states</span> are ready in the vault, and Backups takes them along.</p></div>`;
  h += `<div class="sc-card sys-block"><div class="sc-head"><h3>Start games from the vault</h3></div>
    <label class="inline"><input type="checkbox" data-scra="1" ${D.ra_on ? "checked" : ""}> The old way: RetroArch in the vault, Play buttons, cores, and rules for ES-DE written by the vault</label>
    <p class="hint" style="margin:0">Off (the default since 0.9): games start in ES-DE or RetroArch, set up by you. The vault keeps the files.</p></div>`;
  h += `<p class="hint">Read from the settings files when you open this page. Nothing is written to them. <button class="linkbtn" data-scre="1">Look again</button></p>`;
  view.innerHTML = h;
  foldCards();
}

view.addEventListener("click", async e => {
  const t = e.target.closest && e.target.closest("button,input"); if (!t) return;
  if (t.dataset.sccopy) copy(t.dataset.sccopy);
  else if (t.dataset.scopen && RB) { try { await inv("open_path", { path: RB.path }); } catch (err) { try { await inv("reveal", { path: RB.path }); } catch (e2) { copy(RB.path); } } }
  else if (t.dataset.scagain) { busy = true; render(); await load(true); busy = false; render(); say("RetroArch-BIOS is up to date"); }
  else if (t.dataset.scmap) { mapOpen = !mapOpen; render(); }
  else if (t.dataset.scre) load(false);
  else if (t.dataset.oldra === "ask") { oldConfirm = true; render(); }
  else if (t.dataset.oldra === "no") { oldConfirm = false; render(); }
  else if (t.dataset.oldra === "yes") { oldConfirm = false; try { say(await inv("old_ra_remove")); } catch (err) { say(String(err)); } load(false); }
  else if (t.dataset.refpick) {
    let p = null; try { p = await TA.dialog.open({ directory: true, title: "Your full RetroArch system folder (only read)" }); } catch (err) {}
    if (!p) return;
    try { await inv("bios_ref_set", { path: p }); D.bios_ref = p; REF = null; render(); refScan(); } catch (err) { say(String(err)); }
  }
  else if (t.dataset.refoff) { try { await inv("bios_ref_set", { path: "" }); D.bios_ref = ""; REF = null; render(); } catch (err) { say(String(err)); } }
  else if (t.dataset.refscan) refScan();
  else if (t.dataset.refgrp) { const k = t.dataset.refgrp; refOpen[k] = !refOpen[k]; render(); }
  else if (t.dataset.refcopy) {
    refBusy = true; render();
    try { const r = await inv("bios_ref_copy"); say(`${r.copied} copied into the vault${r.there ? `, ${r.there} already there` : ""}${r.failed ? `, ${r.failed} failed` : ""}. The reference is unchanged.`); } catch (err) { say(String(err)); }
    refBusy = false; await load(true); refScan();
  }
});
view.addEventListener("change", async e => {
  const t = e.target; if (!t.dataset || !t.dataset.scra) return;
  try { await inv("ra_mode", { on: t.checked }); say(t.checked ? "Games start from the vault again" : "Games start in ES-DE or RetroArch now"); } catch (err) { say(String(err)); }
  load(false);
});
tabEl.addEventListener("click", () => { load(false).then(() => { if (D && D.bios_ref && !REF && !refBusy) refScan(); }); setTimeout(() => { const pt = document.getElementById("ptitle"); if (pt) pt.textContent = "emu/setup"; }, 0); });

// ---------- Home: RetroArch on its own (like Heroic) ----------
let SOLO = null, soloBusy = "";
async function soloLoad(){ try { SOLO = await inv("ra_solo_status"); } catch (e) { SOLO = null; } try { renderHome(); } catch (e) {} }
function soloHTML(){
  if (!TA) return "";
  const s = SOLO || { have: false };
  const upd = s.have && s.latest && s.version && s.latest !== s.version;
  const btn = soloBusy ? `<button class="btn small" disabled>${E(soloBusy)}</button>` : s.have ? `<button class="btn small" data-solo="start">Start RetroArch</button>${upd ? `<button class="btn small" data-solo="get">Update to ${E(s.latest)}</button>` : ""}` : `<button class="btn small" data-solo="get">Get RetroArch</button>`;
  return `<div class="group solo-ra"><h2>RetroArch</h2><div class="hlist"><div class="hrow info"><div class="hmain"><span class="hico" aria-hidden="true">▶</span><span class="htx"><b>${s.have ? `RetroArch ${E(s.version || "")}` : "Get RetroArch for Linux"}</b><span>${s.have ? `On its own in ${E(s.path)}. You set it up yourself; its settings, cores and saves stay next to it on your drive.` : "Standalone and portable, from libretro. Free and open source"}</span></span></div>${btn}</div></div></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-solo]"); if (!b) return;
  e.preventDefault();
  if (b.dataset.solo === "start"){ try { await inv("ra_solo_start"); say("Starting RetroArch…"); } catch (err) { say(String(err)); } return; }
  soloBusy = "Downloading…"; try { renderHome(); } catch (x) {}
  try { const v = await inv("ra_solo_get"); say(`RetroArch ${v} is in the vault (Launchers/RetroArch)`); } catch (err) { say(String(err)); }
  soloBusy = ""; soloLoad();
});
if (TA && TA.event) TA.event.listen("ra-dl", ev => { const [w, got, tot] = ev.payload || []; if (!soloBusy) return; soloBusy = tot ? `${w} ${Math.round(got * 100 / tot)}%` : `${w}…`; const x = document.querySelector(".solo-ra .btn[disabled]"); if (x) x.textContent = soloBusy; });

// ---------- ROMs: a summary box, like the BIOS page ----------
function romsBox(){
  const f = S.romFiles || []; if (!f.length) return "";
  const sys = new Set(f.map(x => x.sys)).size, mb = f.reduce((a, x) => a + (x.mb || 0), 0);
  let d = 0; try { d = findDups().length; } catch (e) {}
  let cov = ""; try { const c = f.filter(x => x.cover).length; if (c) cov = `<div><b>${c}</b>with a cover</div>`; } catch (e) {}
  return `<div class="dupsum roms-sum sys-block" style="padding:14px 18px;margin:0 0 14px"><div class="nums"><div><b>${f.length.toLocaleString()}</b>games</div><div><b>${sys}</b>systems</div><div><b>${MB(mb * 1048576)}</b>in roms/</div><div><b>${d}</b>with duplicates</div>${cov}</div></div>`;
}

// ---------- the BIOS page: md5 of each file, and importing a folder or pack ----------
let BST = null, bstBusy = false, IMP = null, impBusy = "";
async function bstLoad(){ if (bstBusy || !TA) return; bstBusy = true; try { BST = await inv("get_bios"); } catch (e) { BST = null; } bstBusy = false; try { renderBios(); } catch (e) {} }
function md5Tags(){
  if (!BST) return;
  BST.forEach(s => {
    const card = document.querySelector(`#view-bios [data-bios="${CSS.escape(s.id)}"]`); if (!card) return;
    card.querySelectorAll(".frow .fn").forEach(fn => {
      if (fn.querySelector(".md5t")) return;
      const f = s.files.find(x => x.file.toLowerCase() === fn.textContent.trim().toLowerCase()); if (!f) return;
      const m = { ok: ["ok", "✓ md5"], other: ["plat", "~ other version"], wrong: ["warn", "✗ not the right dump"] }[f.state]; if (!m) return;
      fn.insertAdjacentHTML("beforeend", ` <span class="pill ${m[0]} md5t" title="${f.state === "other" ? "A zip or a file with your own settings: its md5 differs normally, the emulator checks it itself" : f.state === "wrong" ? "Another dump than the one on the list (md5 " + E(f.md5) + ")" : "The right dump"}">${m[1]}</span>`);
    });
  });
}
function impHTML(){
  if (!TA) return "";
  let h = `<div class="bios-imp sys-block" style="padding:12px 16px;margin:0 0 14px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center"><b>Import BIOS</b><span class="hint">From a folder or a pack (zip, 7z, rar): sorted by name and md5 into bios/&lt;system&gt;/. Only copies, nothing is overwritten.</span><button class="btn small" data-imp="folder" ${impBusy ? "disabled" : ""}>A folder…</button><button class="btn small" data-imp="pack" ${impBusy ? "disabled" : ""}>A pack…</button></div>`;
  if (impBusy) h += `<p class="hint" style="margin:0">${E(impBusy)}</p>`;
  if (IMP){
    const lines = IMP.text.split("\n"), sum = lines.slice(lines.findIndex(l => /^\d+ (to copy|copied)/.test(l))).filter(l => l.trim() && !/^Then open Emu Vault/.test(l));
    const detail = lines.filter(l => /^(copy|link|fingerprint)/.test(l));
    h += `<div><b>${IMP.dry ? "Test run" : "Done"}: ${E(IMP.src)}</b><pre class="mono" style="white-space:pre-wrap;margin:6px 0 0;max-height:260px;overflow:auto">${E(sum.join("\n"))}</pre>${detail.length ? `<details><summary>${detail.length} lines: what goes where</summary><pre class="mono" style="white-space:pre-wrap;max-height:320px;overflow:auto">${E(detail.join("\n"))}</pre></details>` : ""}</div>`;
    if (IMP.dry && /\d+ to copy/.test(IMP.text) && !/^0 to copy/m.test(IMP.text)) h += `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small primary" data-imp="go">Copy them</button>${/--fix/.test(IMP.text) ? `<button class="btn small" data-imp="fix">Copy, and swap the wrong dumps</button>` : ""}<button class="linkbtn" data-imp="close">Not now</button></div>`;
    else h += `<button class="linkbtn" data-imp="close">Close</button>`;
  }
  return h + `</div>`;
}
async function impRun(src, dry, fix){
  impBusy = dry ? "Looking at it… (packs are unpacked in a temporary folder; this can take a minute)" : "Copying…"; try { renderBios(); } catch (e) {}
  try { const r = await inv("bios_import", { src, dry, fix: !!fix }); IMP = { ...r, src, dry }; } catch (err) { say(String(err)); IMP = null; }
  impBusy = ""; if (!dry){ BST = null; BSIZE = null; try { await load(true); } catch (e) {} }
  try { renderBios(); } catch (e) {}
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-imp]"); if (!b) return;
  e.preventDefault(); const k = b.dataset.imp;
  if (k === "close"){ IMP = null; renderBios(); return; }
  if (k === "go" || k === "fix"){ if (IMP) impRun(IMP.src, false, k === "fix"); return; }
  let p = null;
  try { p = await TA.dialog.open(k === "folder" ? { directory: true, title: "A folder with BIOS files (only read)" } : { title: "A BIOS pack (only read)", filters: [{ name: "Packs", extensions: ["zip", "7z", "rar"] }] }); } catch (err) {}
  if (p) impRun(p, true, false);
});

// ---------- the BIOS page: how much is in bios/ ----------
let BSIZE = null;
async function bsizeLoad(){ try { BSIZE = await inv("bios_size"); } catch (e) { BSIZE = null; } }

// the BIOS page: where RetroArch-BIOS is
window.addEventListener("DOMContentLoaded", () => {
  if (typeof renderHome === "function"){
    const _rh = renderHome;
    renderHome = function(){
      const r = _rh.apply(this, arguments);
      try { const v = document.getElementById("view-home"); if (v && TA && !v.querySelector(".solo-ra")) { v.insertAdjacentHTML("beforeend", soloHTML()); } } catch (e) {}
      return r;
    };
    if (TA) soloLoad();
  }
  if (typeof renderRoms === "function"){
    const _rr = renderRoms;
    renderRoms = function(){
      const r = _rr.apply(this, arguments);
      try { const v = document.getElementById("view-roms"); if (v && !v.querySelector(".roms-sum")) v.insertAdjacentHTML("afterbegin", romsBox()); } catch (e) {}
      return r;
    };
  }
  const bt = document.querySelector('.tab[data-tab="bios"]'); if (bt) bt.addEventListener("click", () => { BSIZE = null; BST = null; });
  if (typeof renderBios === "function"){
    const _rb = renderBios;
    renderBios = function(){
      const r = _rb.apply(this, arguments);
      try {
        const vb = document.getElementById("view-bios");
        if (vb && TA && !vb.querySelector(".bios-imp")) { const at = vb.querySelector(".bios-rab"); (at ? at : vb.firstElementChild || vb).insertAdjacentHTML(at ? "afterend" : "beforebegin", impHTML()); }
        if (TA && !BST) bstLoad(); else md5Tags();
      } catch (e) {}
      try {
        const nums = document.querySelector("#view-bios .nums");
        if (nums && BSIZE && !nums.querySelector(".bios-size")) nums.insertAdjacentHTML("beforeend", `<div class="bios-size"><b>${MB(BSIZE[0])}</b>in bios/ · ${BSIZE[1]} files</div>`);
        if (TA && !BSIZE) bsizeLoad().then(() => { try { renderBios(); } catch (e) {} });
      } catch (e) {}
      try {
        const v = document.getElementById("view-bios");
        if (v && RB && !v.querySelector(".bios-rab")){
          const n = new Set((RB.files || []).map(x => x[0])).size;
          v.insertAdjacentHTML("afterbegin", `<div class="bios-rab sys-block" style="padding:12px 16px"><b>RetroArch BIOS folder</b><span class="pill ${n ? "ok" : "warn"}">${n ? `${n} BIOS files, up to date` : "empty"}</span><span class="mono muted" style="overflow-wrap:anywhere">${E(RB.path)}</span><button class="linkbtn" data-sccopy2="1">Copy path</button><span class="bios-ref-n muted"></span><button class="linkbtn" data-scgo="1">Setup check</button></div>`);
          bannerRef();
          v.querySelector("[data-sccopy2]").onclick = () => copy(RB.path);
          v.querySelector("[data-scgo]").onclick = () => tabEl.click();
        }
      } catch (e) {}
      return r;
    };
  }
  if (TA) load(false);
});
})();
