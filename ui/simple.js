// 0.12: the simple Apps page (the default). My apps: one line per app, one button, "Download all" on top,
// "More options" for the rest. Get more apps: one recommended emulator per system you have. A short start
// the first time. "Expert view" shows the full page as before. Own module: remove this file, simple.css and
// their lines in index.html to take it out (the hook in preview.js then does nothing).
const EVS = (() => {
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (err) {} return null; };
let simple = ls("ev-simple") !== "0", auto = ls("ev-auto-dl") === "1";
let open = null, filesOpen = null, q = "", busyAll = false, busyId = "", showAll = false, more = false;
let wiz = 0, picks = null, wizBusy = "", cq = "";
// 0.13: the page shows one section of APPS (the menu): "linux", "linux@arm64", "windows", "windows@arm64", "android", "android@arm32"
let sec = ls("ev-apps-sec") || "linux";
const ARM = () => !!(EV.OV && EV.OV.machine === "aarch64");
// what a section is called; on an ARM pc the main Linux file is the ARM one
function secKey(k){ if (!ARM()) return k; return { "linux": "linux@x64", "linux@arm64": "linux", "windows": "windows@x64", "windows@arm64": "windows" }[k] || k; }
const SECN = { "linux": "Linux x64", "linux@arm64": "Linux ARM", "windows": "Windows x64", "windows@arm64": "Windows ARM", "android": "Android 64-bit", "android@arm32": "Android 32-bit" };
const SECS = Object.keys(SECN);
const e = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MB = mb => mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : Math.max(1, Math.round(mb || 0)) + " MB";
const live = () => typeof EV === "object" && EV.inv && window.__TAURI__;
const OVA = () => (typeof EVA === "object" && EVA.OVA) || [];
const err = x => (EV.errMsg ? EV.errMsg(x) : String(x));
const PLN = { Linux: "Linux PC", Windows: "Windows PC", Android: "Android" };

function handles(sub){ return simple && (sub === "mine" || (sub === "cat" && !showAll)); }
function setSimple(v){ simple = v; ls("ev-simple", v ? "1" : "0"); if (!v) showAll = false; MA.render(); }

// ---------------------------------------------------------------- status in plain words
function stateIn(a, K){
  const av = OVA().find(x => x.id === a.id) || {}, pv = (av.plats || []).find(p => p.plat === K);
  if (a.src === "web") return { k: "web", txt: `a website: look for new versions yourself${a.checked ? ` (last time ${MA.days(a.checked, MA.TODAY)} days ago)` : ""}` };
  if (a.src === "none") return { k: "hand", txt: "you add new versions yourself" };
  if (av.error) return { k: "err", txt: `couldn't check: ${av.error}` };
  if (!pv) return { k: "none", txt: "not kept" };
  const mb = pv.latest && pv.latest.asset ? (pv.latest.asset.size || 0) / 1048576 : 0;
  if (pv.status === "update") return { k: "new", txt: `new version ${pv.latest.version}`, mb };
  if (pv.status === "missing") return { k: "new", txt: "not downloaded yet", mb };
  if (pv.status === "ok") return { k: "ok", txt: `up to date (${pv.stored[0] ? pv.stored[0].version : pv.latest.version})` };
  if (pv.stored.length) return { k: "ok", txt: `you have ${pv.stored[0].version}` };
  return { k: "none", txt: av.checked ? `no ${SECN[sec] || ""} file in the releases` : "not checked yet" };
}
function state(a){
  if (sec) return stateIn(a, secKey(sec));
  const av = OVA().find(x => x.id === a.id) || {};
  if (a.update){ const size = a.update.assets.filter(x => a.keep.includes(x.plat.split(" · ")[0])).reduce((s, x) => s + (x.mb || 0), 0);
    return { k: "new", txt: a.files.length ? `new version ${a.update.ver}` : "not downloaded yet", mb: size }; }
  if (a.src === "web") return { k: "web", txt: `a website: look for new versions yourself${a.checked ? ` (last time ${MA.days(a.checked, MA.TODAY)} days ago)` : ""}` };
  if (a.src === "none") return { k: "hand", txt: "you add new versions yourself" };
  if (av.error) return { k: "err", txt: `couldn't check: ${av.error}` };
  if (!a.files.length) return { k: "none", txt: a.checked ? "no file for your devices in the releases" : "not checked yet" };
  return { k: "ok", txt: `up to date (${a.files[0].ver})` };
}
const sysLine = a => (a.about || a.cat || "").split(/[.(·]/)[0].trim().slice(0, 60);

async function dlApp(id){
  busyId = id; MA.render();
  let n = 0;
  try {
    const av = OVA().find(x => x.id === id);
    for (const p of (av ? av.plats : []).filter(p => (!sec || p.plat === secKey(sec)) && (p.status === "update" || p.status === "missing"))){ EVA.apply(await EV.inv("download_app", { id, plat: p.plat })); n++; }
    const a = MA.M.apps.find(x => x.id === id);
    toast(n ? `${a ? a.name : "App"}: ${n} file${n > 1 ? "s" : ""} downloaded` : "Nothing to download");
  } catch (x) { toast(err(x)); }
  busyId = ""; MA.render(); if (typeof renderHome === "function") renderHome();
}
async function dlSec(){
  // only the files of this section (Linux ARM: only the ARM files)
  const K = secKey(sec), todo = OVA().filter(av => av.enabled).flatMap(av => av.plats.filter(p => p.plat === K && (p.status === "update" || p.status === "missing")).map(p => av.id));
  let n = 0, errs = [];
  for (const id of todo){ try { EVA.apply(await EV.inv("download_app", { id, plat: K })); n++; } catch (x) { errs.push(err(x)); } MA.render(); }
  return [errs, n];
}
async function dlAll(quiet){
  if (busyAll || !live()) return;
  busyAll = true; MA.render();
  try {
    if (!quiet && sec){ const [errs, n] = await dlSec(); busyAll = false; MA.render(); toast(errs.length ? `${n} downloaded, ${errs.length} failed: ${errs[0]}` : `${SECN[sec]}: ${n} file${n === 1 ? "" : "s"} downloaded`); if (typeof renderHome === "function") renderHome(); return; }
    const [ov, errs] = await EV.inv("update_all");
    EVA.apply(ov);
    if (errs.length) toast(`${errs.length} download${errs.length > 1 ? "s" : ""} failed: ${errs[0]}`);
    else if (!quiet) toast("Everything is up to date");
    if (quiet) log(`Downloaded new versions by itself${errs.length ? `, ${errs.length} failed` : ""}`);
  } catch (x) { toast(err(x)); }
  busyAll = false; MA.render(); if (typeof renderHome === "function") renderHome();
}

function tabs(sub){
  const mode = `<span class="sv-mode">Simple · <button class="linkbtn" data-svmode="0">switch to Expert</button></span>`;
  if (sub === "cat") return `<div class="sv-tabs"><h2 class="sv-h">Get more apps</h2>${mode}</div>`;
  const andr = sec.startsWith("android");
  return `<div class="sv-tabs"><h2 class="sv-h">${andr ? "Android" : e(SECN[sec] || "Apps")}</h2>${andr ? `<span class="sv-sub">${["android", "android@arm32"].map(k => `<button class="sv-tab small" data-svsec="${k}" aria-pressed="${sec === k}">${k === "android" ? "64-bit" : "32-bit"}</button>`).join("")}</span>` : ""}${mode}</div>`;
}

// ---------------------------------------------------------------- My apps
function row(a){
  const st = state(a), isOpen = open === a.id, busy = busyId === a.id || busyAll;
  const btn = st.k === "new" ? `<button class="btn primary" data-svdl="${e(a.id)}" ${busy ? "disabled" : ""}>${busyId === a.id ? "Downloading…" : "Download"}</button>`
    : st.k === "web" ? `<a class="btn" href="${e(a.url)}" target="_blank" rel="noopener">Open the website</a><button class="btn" data-svlooked="${e(a.id)}">I looked</button>` : "";
  let h = `<article class="sv-row ${st.k === "new" ? "hot" : ""} ${st.k === "web" ? "web" : ""} ${isOpen ? "open" : ""}"><div class="sv-main"><div class="sv-name"><b>${e(a.name)}</b><span class="sv-st ${st.k}">${e(sysLine(a))}${sysLine(a) ? " · " : ""}<span>${st.k === "ok" ? "✓ " : ""}${e(st.txt)}</span></span></div>
    ${btn}<button class="linkbtn" data-svopen="${e(a.id)}">${isOpen ? "Fewer options" : "More options"}</button></div>`;
  if (isOpen){
    h += `<div class="sv-more"><div class="ma-row" style="gap:8px;flex-wrap:wrap;align-items:center"><span class="lbl2">I use this on</span>${SECS.map(k => { const kk = secKey(k), on = (a.keys || []).includes(kk), has = on || (a.avail || []).includes(kk) || !(a.avail || []).length; return `<button class="ma-chip" data-svkeep="${e(a.id)}|${e(kk)}" aria-pressed="${on}" ${has ? "" : `title="Not in the newest release"`}>${on ? "✓ " : ""}${SECN[k]}${has ? "" : " ?"}</button>`; }).join("")}</div>
      ${EVAP.ticks ? EVAP.ticks(a, a.keep, false) : ""}
      <div class="hint" style="margin:0">You keep the newest ${S.keep || 3} versions. <button class="linkbtn" data-svfiles="${e(a.id)}">${filesOpen === a.id ? "Hide my files" : `Show my files (${a.files.length})`}</button> · <button class="linkbtn" data-svexpert="${e(a.id)}">Everything else (Expert view)</button> · <button class="linkbtn" data-svremove="${e(a.id)}">Remove from my apps</button></div>
      ${filesOpen === a.id ? `<div class="sv-files">${a.files.length ? a.files.map(f => `<div><span class="muted">${e(f.plat)}${f.variant ? " · " + e(f.variant) : ""}</span> <span class="mono">${e(f.file)}</span> <span class="muted">${e(f.ver)} · ${MB(f.mb)}</span></div>`).join("") : `<span class="muted">No files yet.</span>`}<span class="hint">In ${e(S.dir || "your vault")}/Apps/${e(a.name)}/</span></div>` : ""}</div>`;
  }
  return h + `</article>`;
}
function mine(el){
  const ALL = MA.M.apps.filter(a => !a.retired), K = secKey(sec);
  if (!ALL.length && ls("ev-simple-setup") !== "done" && !wiz) wiz = 1;
  if (wiz){ el.innerHTML = tabs("mine") + wizard(); return; }
  const kept = ALL.filter(a => (a.keys || []).includes(K));
  // kept for this section, but its makers have no file for it: left out of the list, counted below
  const nofile = kept.filter(a => stateIn(a, K).k === "none" && a.checked), A = kept.filter(a => !nofile.includes(a));
  // apps you have that also come for this section
  const can = ALL.filter(a => !(a.keys || []).includes(K) && (a.avail || []).includes(K));
  const ups = A.filter(a => state(a).k === "new"), mb = ups.reduce((s, a) => s + (state(a).mb || 0), 0);
  const order = { new: 0, err: 1, web: 2, none: 3, hand: 4, ok: 5 };
  let list = A.slice().sort((x, y) => (order[state(x).k] - order[state(y).k]) || x.name.localeCompare(y.name));
  if (q) list = list.filter(a => (a.name + " " + (a.about || "")).toLowerCase().includes(q.toLowerCase()));
  let h = tabs("mine");
  h += ups.length ? `<section class="sv-bar"><div class="sv-grow"><b>${ups.length} new version${ups.length > 1 ? "s" : ""}</b><span>${e(ups.slice(0, 3).map(a => a.name).join(", "))}${ups.length > 3 ? ` and ${ups.length - 3} more` : ""}${mb ? `. About ${MB(mb)}.` : ""}</span></div><button class="btn primary big" data-svall ${busyAll ? "disabled" : ""}>${busyAll ? "Downloading…" : "Download all"}</button></section>`
    : `<section class="sv-bar calm"><div class="sv-grow"><b>All your apps are up to date</b><span>Last check ${e(MA.M.lastCheck || "–")}.</span></div><button class="btn" data-svcheck>Check now</button></section>`;
  if (A.length > 10) h += `<input type="search" class="search" id="sv-q" placeholder="Search your apps" value="${e(q)}" aria-label="Search your apps">`;
  h += `<div class="sv-list">${list.map(row).join("") || `<div class="empty-state">${A.length ? "No apps match." : `No ${e(SECN[sec])} apps yet.`} <button class="linkbtn" data-svsub="cat">Get more apps</button></div>`}</div>`;
  if (nofile.length) h += `<p class="hint">Not shown: ${nofile.length} app${nofile.length > 1 ? "s" : ""} with no ${e(SECN[sec])} file in the releases (${e(nofile.slice(0, 4).map(a => a.name).join(", "))}${nofile.length > 4 ? "…" : ""}). Remove ${e(SECN[sec])} from them in More options on another page, or leave it: they show up here once their makers bring one.</p>`;
  if (can.length) h += `<section class="ma-panel" style="margin-top:12px"><h3 style="margin:0">Also for ${e(SECN[sec])} · ${can.length}</h3><p class="hint" style="margin:0">Apps of yours whose newest release has a ${e(SECN[sec])} file too.</p>
    ${can.map(a => `<div class="ma-catrow"><b>${e(a.name)}</b><button class="btn small" data-svkeep="${e(a.id)}|${e(K)}">Keep ${e(SECN[sec])}</button></div>`).join("")}</section>`;
  h += `<div class="sv-foot"><label class="inline" for="sv-auto"><input type="checkbox" id="sv-auto" ${auto ? "checked" : ""}> Download new versions by itself (when Emu Vault starts and every 6 hours)</label>
    <button class="linkbtn" data-svwiz>Set up again</button></div>`;
  el.innerHTML = h;
  const qi = el.querySelector("#sv-q"); if (qi) qi.oninput = () => { q = qi.value; MA.render(); const n = $("#sv-q"); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } };
  const ai = el.querySelector("#sv-auto"); if (ai) ai.onchange = () => { auto = ai.checked; ls("ev-auto-dl", auto ? "1" : "0"); toast(auto ? "New versions are downloaded by themselves." : "Downloads only when you press Download."); if (auto) autoRun(); };
}

// ---------------------------------------------------------------- recommended
const PRI = { "PC emulators (Linux)": 3, "Awesome Emulators": 2, "Obtainium Emulation Pack": 1 };
function wantPlats(){ return (S.plats && S.plats.length ? S.plats : ["linux"]); }
function systems(){
  const roms = (S.roms || []).filter(r => r.n > 0).map(r => r.id);
  const ids = roms.length ? roms : [...(EVAP.mine ? EVAP.mine() : [])];
  const seen = new Set(), out = [];
  for (const id of ids){ const k = { n3ds: "3ds", genesis: "megadrive", tg16: "pcengine" }[id] || id; if (!seen.has(k)){ seen.add(k); out.push(id); } }
  return out;
}
const games = id => { const r = (S.roms || []).find(x => x.id === id); return r && r.n ? r.n : 0; };
function covered(s){ const P = wantPlats(); return OVA().filter(av => av.enabled && EVAP.sysOf(av).includes(s) && EVAP.offersOf(av).some(p => P.includes(p))).map(av => av.name); }
function best(s, exclude){
  const P = wantPlats(), have = new Set(OVA().filter(a => a.enabled).map(a => EVAP.nk(a.name)));
  const c = OVA().filter(av => !av.enabled && av.pack !== "My apps" && !have.has(EVAP.nk(av.name)) && !(exclude || new Set()).has(av.id) && EVAP.sysOf(av).includes(s) && EVAP.offersOf(av).some(p => P.includes(p)));
  const score = av => (PRI[av.pack] || 0) * 10 + (av.source === "manual" ? 0 : 5) + EVAP.offersOf(av).filter(p => P.includes(p)).length - (/^retroarch/i.test(av.name) ? 6 : 0);
  return c.sort((x, y) => score(y) - score(x))[0] || null;
}
function blurb(av){ return (av.about || "").split(/(?<=\.)\s/)[0].slice(0, 110); }
function recs(){
  const out = [], used = new Set();
  for (const s of systems()){ if (covered(s).length) continue; const b = best(s, used); if (b){ used.add(b.id); out.push({ s, av: b }); } }
  return out;
}
function found(){
  const w = cq.trim().toLowerCase(); if (!w) return null;
  return OVA().filter(av => av.pack !== "My apps" && (av.name + " " + (av.about || "") + " " + (av.category || "")).toLowerCase().includes(w))
    .sort((x, y) => (y.name.toLowerCase().startsWith(w) - x.name.toLowerCase().startsWith(w)) || x.name.localeCompare(y.name)).slice(0, 40);
}
function card(av, top){
  const auto2 = av.source !== "manual", plats = EVAP.offersOf(av).map(p => PLN[p[0].toUpperCase() + p.slice(1)] || p).join(" · ");
  return `<article class="sv-card"><span class="lbl2">${e(top)}</span><b>${e(av.name)}</b><span class="muted">${e(blurb(av))} ${auto2 ? "Updates by itself." : "A website: you look for new versions yourself."}</span>
    <div class="ma-row" style="gap:10px;align-items:center">${av.enabled ? `<span class="pill ok">in my apps</span>` : `<button class="btn primary" data-svadd="${e(av.id)}">Add</button>`}<span class="muted" style="font-size:12px">${e(plats)}</span></div></article>`;
}
function cat(el){
  const R = recs(), show = more ? R : R.slice(0, 12), F = found();
  let h = tabs("cat") + `<input type="search" class="search" id="sv-cq" placeholder="Search every app, like GameNative or Dolphin" value="${e(cq)}" aria-label="Search every app" style="margin-top:12px">`;
  if (F){
    h += F.length ? `<div class="sv-cards">${F.map(av => card(av, av.pack === "Obtainium Emulation Pack" ? "Android app" : av.pack)).join("")}</div>` : `<div class="empty-state">Nothing called “${e(cq)}”. <button class="linkbtn" data-svaddlink>Add it by its link</button></div>`;
    el.innerHTML = h; bindQ(el); return;
  }
  h += `<section class="ma-panel"><h3 style="margin:0">Recommended for you</h3><p class="hint" style="margin:0">The best emulator for each system you have ${(S.roms || []).some(r => r.n) ? "games" : "BIOS files"} for, on ${wantPlats().map(p => PLN[p[0].toUpperCase() + p.slice(1)] || p).join(" and ")}. Systems an app of yours already covers are left out.</p></section>`;
  h += show.length ? `<div class="sv-cards">${show.map(({ s, av }) => { const g = games(s), auto2 = av.source !== "manual";
      return `<article class="sv-card"><span class="lbl2">${e(EVAP.sname(s))}${g ? ` · ${g} games` : ""}</span><b>${e(av.name)}</b><span class="muted">${e(blurb(av))} ${auto2 ? "Updates by itself." : "A website: you look for new versions yourself."}</span>
        <div class="ma-row" style="gap:10px;align-items:center"><button class="btn primary" data-svadd="${e(av.id)}">Add</button><span class="muted" style="font-size:12px">${e(EVAP.offersOf(av).map(p => PLN[p[0].toUpperCase() + p.slice(1)] || p).join(" · "))}</span></div></article>`; }).join("")}</div>`
    : `<div class="empty-state">Every system you have is covered by your apps.</div>`;
  if (R.length > 12 && !more) h += `<button class="linkbtn" data-svmore>Show ${R.length - 12} more systems</button>`;
  const total = OVA().filter(av => !av.enabled && av.pack !== "My apps").length;
  h += `<section class="sv-bar calm dashed"><div class="sv-grow"><span>Looking for something else? ${total} more emulators and tools, from awesome-emulators and the Obtainium Emulation Pack.</span></div><button class="btn" data-svall-cat>Show all apps</button><button class="btn" data-svaddlink>Add an app by its link</button></section>`;
  el.innerHTML = h; bindQ(el);
}
function bindQ(el){ const qi = el.querySelector("#sv-cq"); if (qi) qi.oninput = () => { cq = qi.value; MA.render(); const n = $("#sv-cq"); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }; }

// ---------------------------------------------------------------- first start
function wizard(){
  const P = wantPlats();
  if (wiz === 1) return `<section class="ma-panel sv-wiz"><span class="lbl2">Step 1 of 2</span><h3>Where do you play?</h3><p class="hint" style="margin:0">Emu Vault keeps the right emulators for these. You can change it later in Settings.</p>
    <div class="sv-pick">${[["linux", "Linux PC", "this computer, Steam Deck"], ["windows", "Windows PC", "another computer"], ["android", "Android", "handheld or phone"]].map(([k, l, s]) => `<button class="sv-opt" data-svplat="${k}" aria-pressed="${P.includes(k)}"><b>${P.includes(k) ? "✓ " : ""}${l}</b><span>${s}</span></button>`).join("")}</div>
    <div class="ma-row" style="gap:12px"><button class="btn primary big" data-svnext>Next</button><button class="linkbtn" data-svskip>Skip, I'll choose myself</button></div></section>`;
  const sys = systems();
  if (!picks){ picks = new Set(); const used = new Set(); sys.forEach(s => { const b = covered(s).length ? null : best(s, used); if (b){ used.add(b.id); picks.add(b.id); } }); }
  const rows = sys.map(s => { const c = covered(s); if (c.length) return `<div class="sv-wrow"><span class="sv-ok">✓</span><b>${e(EVAP.sname(s))}${games(s) ? ` (${games(s)})` : ""}</b><span class="muted">you have ${e(c.slice(0, 2).join(", "))}</span></div>`;
    const b = best(s, new Set([...picks].filter(id => !EVAP.sysOf(OVA().find(x => x.id === id) || {}).includes(s)))); if (!b) return `<div class="sv-wrow"><span></span><b>${e(EVAP.sname(s))}</b><span class="muted">no emulator for your devices in the catalog</span></div>`;
    return `<label class="sv-wrow"><input type="checkbox" data-svpick="${e(b.id)}" ${picks.has(b.id) ? "checked" : ""}><b>${e(EVAP.sname(s))}${games(s) ? ` (${games(s)})` : ""}</b><span class="muted">${e(b.name)}</span></label>`; }).join("");
  const n = picks.size;
  return `<section class="ma-panel sv-wiz"><span class="lbl2">Step 2 of 2</span><h3>${sys.length ? "Your games need these emulators" : "No games or BIOS files found yet"}</h3><p class="hint" style="margin:0">${sys.length ? `Found ${sys.length} systems. One good emulator each.` : "Put your games in roms/ (or use Bring in your existing setup on Home), then come back. You can also pick apps yourself."}</p>
    <div class="sv-wlist">${rows}</div>
    <div class="ma-row" style="gap:12px;flex-wrap:wrap"><button class="btn primary big" data-svgo ${!n || wizBusy ? "disabled" : ""}>${wizBusy || (n ? `Add these ${n} and download them` : "Nothing to add")}</button><button class="linkbtn" data-svback>Back</button><button class="linkbtn" data-svskip>Skip, I'll choose myself</button></div></section>`;
}
async function wizGo(){
  const ids = [...picks]; if (!ids.length) return;
  if (!live()){ toast("Only in the app"); return; }
  try {
    wizBusy = "Adding…"; MA.render();
    EVA.apply(await EV.inv("set_enabled", { ids, on: true }));
    wizBusy = "Looking for the newest versions…"; MA.render();
    EVA.apply(await EV.inv("check_apps", { ids }));
    wizBusy = "Downloading…"; MA.render();
    const [ov, errs] = await EV.inv("update_all"); EVA.apply(ov);
    toast(errs.length ? `Added ${ids.length} apps; ${errs.length} download${errs.length > 1 ? "s" : ""} failed` : `Added and downloaded ${ids.length} apps`);
    log(`Simple start: added ${ids.length} apps`);
  } catch (x) { toast(err(x)); }
  wizBusy = ""; wiz = 0; picks = null; ls("ev-simple-setup", "done"); MA.render();
}

async function toggleKey(id, K){
  const a = MA.M.apps.find(x => x.id === id); if (!a) return;
  let ks = (a.keys && a.keys.length ? a.keys : a.keep.map(p => p.toLowerCase())).slice();
  const on = !ks.includes(K);
  if (!on && ks.filter(k => !k.includes("~")).length === 1){ toast("Keep at least one"); return; }
  ks = on ? [...ks, K] : ks.filter(k => k !== K && !k.startsWith(K + "~"));
  const lb = Object.keys(SECN).find(k => secKey(k) === K);
  try { EVA.apply(await EV.inv("set_app_plats", { id, plats: ks })); toast(on ? `${a.name}: ${SECN[lb] || K} kept. Its newest file shows as "not downloaded yet".` : `${a.name}: ${SECN[lb] || K} no longer kept. Its files stay.`); } catch (x) { toast(err(x)); }
  MA.render(); if (window.EVN) EVN.counts();
}
function setSec(k){ sec = k; ls("ev-apps-sec", k); open = null; q = ""; MA.M.sub = "mine";
  if (window.EVAP && EVAP.setCur) EVAP.setCur(k.startsWith("linux") ? "Linux" : k.startsWith("windows") ? "Windows" : "Android");
  MA.render(); if (window.EVN) EVN.mark(); }

// ---------------------------------------------------------------- hook, events
function render(el){ if (MA.M.sub === "cat") cat(el); else mine(el); }
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-svsec],[data-svkeep],[data-svsub],[data-svmode],[data-svdl],[data-svall],[data-svcheck],[data-svopen],[data-svfiles],[data-svexpert],[data-svremove],[data-svlooked],[data-svadd],[data-svmore],[data-svall-cat],[data-svaddlink],[data-svplat],[data-svnext],[data-svback],[data-svskip],[data-svgo],[data-svwiz],[data-svsimple]");
  if (!t) return;
  const d = t.dataset;
  if (t.tagName !== "A") ev.preventDefault();
  if (d.svsub){ MA.M.sub = d.svsub; showAll = false; MA.render(); if (window.EVN) EVN.mark(); }
  else if (d.svsec){ setSec(d.svsec); }
  else if (d.svkeep){ const i = d.svkeep.indexOf("|"); toggleKey(d.svkeep.slice(0, i), d.svkeep.slice(i + 1)); }
  else if (d.svmode !== undefined) setSimple(d.svmode === "1");
  else if (d.svsimple !== undefined){ showAll = false; setSimple(true); }
  else if (d.svdl) dlApp(d.svdl);
  else if (t.hasAttribute("data-svall")) dlAll(false);
  else if (t.hasAttribute("data-svcheck")) MA.checkNow();
  else if (d.svopen){ open = open === d.svopen ? null : d.svopen; MA.render(); }
  else if (d.svfiles){ filesOpen = filesOpen === d.svfiles ? null : d.svfiles; MA.render(); }
  else if (d.svexpert){ MA.M.open = MA.M.open || new Set(); try { MA.M.open.add(d.svexpert); } catch (x) {} MA.M.q = ""; setSimple(false); }
  else if (d.svremove){ const a = MA.M.apps.find(x => x.id === d.svremove); if (t.dataset.sure === "1") { EVA.removeApp(d.svremove); open = null; } else { t.dataset.sure = "1"; t.textContent = `Sure? Remove ${a ? a.name : "it"} (its files stay)`; } }
  else if (d.svlooked){ const a = MA.M.apps.find(x => x.id === d.svlooked); if (a){ a.checked = MA.TODAY; log(`${a.name}: checked by hand`); toast(`Noted: ${a.name}`); MA.render(); if (typeof renderHome === "function") renderHome(); } }
  else if (d.svadd){ EVA.follow(d.svadd); }
  else if (t.hasAttribute("data-svmore")){ more = true; MA.render(); }
  else if (t.hasAttribute("data-svall-cat")){ showAll = true; MA.render(); }
  else if (t.hasAttribute("data-svaddlink")) MA.openSheet();
  else if (d.svplat){ let p = wantPlats().filter(x => x !== d.svplat); if (!wantPlats().includes(d.svplat)) p.push(d.svplat); if (!p.length){ toast("Pick at least one"); return; } S.plats = ["linux", "windows", "android"].filter(x => p.includes(x)); S.platform = S.plats.includes("android") && S.plats.includes("linux") ? "beide" : S.plats.includes("android") ? "android" : "linux"; picks = null; if (typeof renderAll === "function") renderAll(); else MA.render(); }
  else if (t.hasAttribute("data-svnext")){ wiz = 2; picks = null; MA.render(); }
  else if (t.hasAttribute("data-svback")){ wiz = 1; MA.render(); }
  else if (t.hasAttribute("data-svskip")){ wiz = 0; ls("ev-simple-setup", "done"); MA.M.sub = "cat"; MA.render(); }
  else if (t.hasAttribute("data-svgo")) wizGo();
  else if (t.hasAttribute("data-svwiz")){ wiz = 1; picks = null; MA.render(); }
});
document.addEventListener("change", ev => { const t = ev.target; if (t && t.dataset && t.dataset.svpick){ if (t.checked) picks.add(t.dataset.svpick); else picks.delete(t.dataset.svpick); const b = document.querySelector("[data-svgo]"); if (b){ b.disabled = !picks.size; b.textContent = picks.size ? `Add these ${picks.size} and download them` : "Nothing to add"; } } });

// expert view: a way back, and "Show all apps" gets a way back to the recommendations
if (typeof EVAP === "object"){
  const prev = EVAP.after;
  EVAP.after = function(el){
    prev(el);
    const t = el.querySelector(".ma-subtabs");
    if (t && !simple) t.insertAdjacentHTML("beforeend", `<span class="sv-mode">Expert · <button class="linkbtn" data-svmode="1">switch to Simple</button></span>`);
    if (t && simple && showAll) t.insertAdjacentHTML("beforeend", `<span class="sv-mode"><button class="linkbtn" data-svsimple>← Recommended for you</button></span>`);
  };
}

// download by itself: when there are new versions, at most once per set of versions
let lastAuto = "";
function autoRun(){
  if (!auto || busyAll || !live() || !MA.M.apps.length) return;
  const ups = MA.updates(), key = ups.map(a => a.id + a.update.ver).join();
  if (!ups.length || key === lastAuto) return;
  lastAuto = key; dlAll(true);
}
setInterval(autoRun, 60000); setTimeout(autoRun, 20000);

return { handles, render, setSimple, setSec, secKey, SECN, stateIn, get sec(){ return sec; }, get simple(){ return simple; } };
})();
window.EVS = EVS;
