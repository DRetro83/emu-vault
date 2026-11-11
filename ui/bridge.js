"use strict";
// Emu Vault — bridge between the screens (preview.js, the same code as the preview) and the Rust core.
// The screens keep their own model (S.romFiles, S.trash, S.inbox, MA.M.apps, …). This file
//  1. fills that model with what is really on disk,
//  2. turns what the screens change in the model into real file operations (move, copy, delete),
//  3. replaces the parts that only pretended (links, file pickers, drops, downloads).
const EV = (() => {
const T = window.__TAURI__;
const inv = (c, a) => T ? T.core.invoke(c, a) : Promise.reject("not in the app");
const dirOf = p => p.slice(0, p.lastIndexOf("/") + 1);
const baseOf = p => p.slice(p.lastIndexOf("/") + 1);
const MB = b => (b || 0) / 1048576;
let ROOT = S.dir;
let busy = 0, queued = false, allowDelete = false, ready = false;
const errMsg = e => typeof e === "string" ? e : (e && e.message) || "Something went wrong";

// ------------------------------------------------------------------ start empty, not with the sample data
function clearSamples(){
  S.emus = []; S.romFiles = []; S.trash = []; S.inbox = []; S.inboxDone = []; S.ib.other = []; S.ib.done = [];
  S.roms = []; S.biosHave = new Set(); S.hist = []; S.log = [];
  S.drives = []; S.lastMove = null;
  if (S.self){ S.self.state = "current"; S.self.latest = null; S.self.installed = ""; }
  S.art.got = new Set(); S.art.source = "libretro"; S.art.signedIn = false; S.art.last = null; S.art.run = null;
  S.tools.chdDone = {}; S.tools.verify = null; S.tools.fe = { ra: (UI.fe || {}).ra || false, esde: (UI.fe || {}).esde || false, art: null }; if (S.tools.md) S.tools.md.done = {};
  S.patches = []; S.profiles = []; S.ra = { ran: false };
  if (typeof DAT === "object") for (const k of Object.keys(DAT)) delete DAT[k];
  if (typeof MA === "object"){ MA.M.apps = []; MA.M.pending = {}; MA.M.lastCheck = "not yet"; }
}

// ------------------------------------------------------------------ what's on disk -> the model
const sysTitle = id => (typeof GI === "object" && GI[id]) ? sysLabel(GI[id]) : ((BIOSDB.find(e => e.id === id) || {}).name || id);
const extsOf = id => Object.entries(EXT_SYS).filter(([, s]) => s === id).map(([e]) => e).join(" ");
const folderSys = d => { const l = (d || "").toLowerCase().trim(); if (!l) return ""; if (typeof GI === "object" && GI[l]) return l; if (FOLDER_ALIAS[l]) return FOLDER_ALIAS[l]; try { const m = l.length >= 4 && matchSystem(d); if (m) return m; } catch (e) {} return ""; };
let SNAP = null;
const COV = new Map();   // system|game -> cover file in media/
// box shape per console (width / height of the real box), so covers aren't cut off
const BOX_AR = { gb: "1", gbc: "1", gba: "1", nds: ".9", "3ds": ".9", nes: ".73", snes: "1.38", n64: "1.38", virtualboy: ".73", gamegear: ".73",
  megadrive: ".71", genesis: ".71", mastersystem: ".71", sega32x: ".71", segacd: "1", saturn: "1", dreamcast: "1", psx: "1", pcenginecd: "1", "3do": "1", neogeocd: "1",
  ps2: ".71", ps3: ".86", gc: ".71", wii: ".71", wiiu: ".71", switch: ".62", xbox: ".71", psp: ".58", psvita: ".86", pcengine: ".73", atari2600: ".73", n3ds: ".9" };
const boxAr = sys => (UI.boxShape || {})[sys] || BOX_AR[sys] || ".75";
// shapes you can choose for a system you add yourself (the known consoles keep theirs)
const SHAPES = [[".75", "Portrait", "most boxes"], [".71", "DVD case", "PC, PS2, Wii"], ["1", "Square", "CD case, GBA"], ["1.38", "Landscape", "US SNES, N64"], [".6", "Tall", "PSP, Switch"]];
let pendingShape = null;
const shapeIcon = ar => `<span aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:6px;height:18px;width:${Math.round(18 * ar)}px;border:1.5px solid currentColor;border-radius:2px"></span>`;
function shapeHTML(id){
  if (id && BOX_AR[id]) return `<p class="hint" style="margin:0">Covers for this console get its own box shape.</p>`;
  const cur = pendingShape || (UI.boxShape || {})[id] || ".75";
  return `<div class="q"><span class="lbl">Box shape for the covers</span><p class="help">How the boxes of these games look. For Windows games, for example, choose DVD case.</p>
    <div class="sugs">${SHAPES.map(([v, l, s]) => `<button class="sug" data-shape="${v}" aria-pressed="${v === cur}" title="${s}">${shapeIcon(+v)}${l}</button>`).join("")}</div></div>`;
}
function keepShape(id){ if (!id || BOX_AR[id]) return; (UI.boxShape ||= {})[id] = pendingShape || (UI.boxShape || {})[id] || ".75"; pendingShape = null; lastSaved = ""; saveState(); }
function shapeSettingsHTML(){
  const mine = [...new Set([...(UI.addedSys || []), ...Object.keys(UI.boxShape || {}), ...S.roms.filter(r => r.mine).map(r => r.id)])].filter(id => id && !BOX_AR[id]);
  if (!mine.length) return "";
  return `<div class="field"><span class="lbl">Box shape of your own systems</span>
    <div class="rows">${mine.map(id => `<div class="frow" style="flex-wrap:wrap;gap:8px"><div style="min-width:120px"><b>${esc(sysName(id))}</b></div><div class="sugs" style="margin:0">${SHAPES.map(([v, l]) => `<button class="sug" data-sysshape="${esc(id)}|${v}" aria-pressed="${v === boxAr(id)}">${shapeIcon(+v)}${l}</button>`).join("")}</div></div>`).join("")}</div>
    <p class="hint">The consoles Emu Vault knows already have the shape of their real box.</p></div>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-shape],[data-sysshape]"); if (!b) return;
  if (b.dataset.shape){ pendingShape = b.dataset.shape; b.parentElement.querySelectorAll("[data-shape]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); return; }
  const [id, v] = b.dataset.sysshape.split("|"); (UI.boxShape ||= {})[id] = v; lastSaved = ""; saveState();
  renderSet(); renderColl(); renderRoms();
});
{ const _c = coverHTML; coverHTML = function(sys, title, opt = {}){ const ar = boxAr(sys), p = !opt.none && T && COV.get(sys + "|" + ckey(title)); if (p) return `<span class="cov ${opt.big ? "big" : ""} img" style="--ar:${ar}" aria-hidden="true"><img src="${T.core.convertFileSrc(p)}" alt="" loading="lazy"></span>`; return _c(sys, title, opt).replace('<span class="cov', `<span style="--ar:${ar}" class="cov`).replace(/style="--ar:([^"]*)" class="cov([^"]*)" style="/, 'class="cov$2" style="--ar:$1;'); }; }

async function load(scan){
  const snap = await inv("ui_snapshot", { scan: !!scan });
  SNAP = snap; ROOT = snap.root; S.dir = snap.root;
  for (const k of Object.keys(DAT)) delete DAT[k];
  S.romFiles = snap.files.map(f => {
    const hash = f.crc || ("p" + f.path);
    if (f.dat && f.check === "ok"){ const ext = f.name.slice(f.name.lastIndexOf(".")); DAT[hash] = f.dat + ext; }
    return { id: "p:" + f.path, sys: f.sys, name: f.name, mb: MB(f.size), hash, loc: f.path, rel: f.rel, parts: f.parts, check: f.check, origSys: f.sys };
  });
  S.trash = snap.trash.map(t => ({ id: "t:" + t.path, sys: t.sys, name: t.name, mb: MB(t.size), hash: "t:" + t.path, why: "earlier", at: "", loc: t.path }));
  const added = (UI.addedSys || []);
  const ids = [...new Set([...S.romFiles.map(f => f.sys), ...added])].filter(id => snap.systems.includes(id));
  S.roms = ids.map(id => { const fs = S.romFiles.filter(f => f.sys === id); return { id, name: sysTitle(id), ext: extsOf(id), n: fs.length, mb: Math.round(fs.reduce((a, f) => a + f.mb, 0)) }; })
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  // BIOS: "system/File.bin" with the spelling the BIOS list uses
  const have = new Set();
  snap.bios_have.forEach(h => { const [id, ...rest] = h.split("/"); const n = rest.join("/"); const e = BIOSDB.find(x => x.id === id);
    const f = e && e.files.find(x => x.f.toLowerCase() === n.toLowerCase()); have.add(`${id}/${f ? f.f : n}`); });
  S.biosHave = have;
  BIOSDB.forEach(e => { if (S.roms.some(r => r.id === e.id) || [...have].some(h => h.startsWith(e.id + "/"))) e.mine = true; });
  S.space = { ...S.space, free: Math.round(MB(snap.free)), total: Math.round(MB(snap.total)) };
  if (S.self) S.self.ver = snap.version;
  S.art.got = new Set(S.romFiles.filter((f, i) => snap.files[i].cover).map(f => f.id));
  COV.clear();
  S.romFiles.forEach((f, i) => { if (!snap.files[i].cover) return; const stem = f.rel.replace(/\.[^./]+$/, ""), p = `${ROOT}/media/${f.sys}/covers/${stem}.png`, q = parseFile(f);
    COV.set(f.sys + "|" + q.key, p); if (q.datName) COV.set(f.sys + "|" + ckey(parseRom(q.datName).title), p); });
  if (S.tools.md){ S.tools.md.done = {}; S.romFiles.filter(f => /\.m3u\//i.test(f.rel || "")).forEach(f => { const m = f.name.match(/^(.*?)\s*\((?:Disc|Disk|CD) (\d+)[^)]*\)(.*)\.(\w+)$/i); if (m) S.tools.md.done[f.sys + "|" + (m[1] + m[3]).trim()] = true; }); }
  S.art.auto = UI.artAuto !== false;
  await loadPatches(snap.patches || []);
  await loadInbox(snap.inbox);
  remember();
  setTimeout(autoCovers, 2500);
}
async function loadPatches(list){
  const pick = UI.patchPick || {}, done = UI.patchDone || {};
  const byCrc = new Map(S.romFiles.map(f => [String(f.hash).toLowerCase(), f]));
  S.patches = [];
  for (const x of list){
    const q = parseRom(x.name), ext = (x.name.match(/\.([^.]+)$/) || [])[1].toLowerCase();
    const tag = (q.special.find(s => /^t[-+]/i.test(s)) || q.special[0] || "Patched").replace(/\s+by\s+.*$/i, "").trim();
    const p = { id: "pt:" + x.path, path: x.path, name: x.name, kind: { ips: "IPS patch", ups: "UPS patch", bps: "BPS patch" }[ext] || "xdelta patch", sys: null, title: null, reg: null, tag, mb: MB(x.size), pick: null, done: done[x.path] || null };
    if (ext === "bps" || ext === "ups"){ try { const i = await inv("patch_info", { path: x.path }); const f = i.source_crc && byCrc.get(i.source_crc); if (f){ p.pick = f.id; p.exact = true; } } catch (e) {} }
    if (!p.pick && pick[x.path]){ const f = S.romFiles.find(r => r.loc === pick[x.path]); if (f) p.pick = f.id; }
    if (!p.pick && q.title){
      const key = ckey(q.title), regs = q.regions;
      const f = S.romFiles.find(r => { const rp = parseFile(r); return rp.key === key && !rp.special.length && (!regs.length || rp.regions.some(g => regs.includes(g))); });
      if (f){ const rp = parseFile(f); p.sys = f.sys; p.title = q.title; p.reg = rp.regions[0] ? (REG_NAMES[rp.regions[0]] || rp.regions[0]) : null; }
    }
    S.patches.push(p);
  }
}

// inbox: games go in S.inbox, everything else (BIOS, app downloads, saves) in S.ib.other.
// First by name (instant), then by fingerprint in the background (reading every file takes a while).
let planRun = 0;
async function loadInbox(list){
  classify(list, {});
  if (!list.length) return;
  const run = ++planRun;
  inv("inbox_plan", {}).then(plan => {
    if (run !== planRun) return;
    const P = Object.fromEntries(plan.map(i => [i.src, i]));
    const before = new Set([...S.inbox, ...S.ib.other].map(x => x.loc).concat((S.ib.skipped || []).map(x => x.path)));
    const now = list.filter(x => before.has(x.path));
    classify(now, P); remember();
    if (activeTab?.() === "inbox") renderInboxTab(); updateInboxBadge?.(); renderStrip(); if (activeTab?.() === "home") renderHome();
  }).catch(() => {});
}
function classify(list, P){
  const skip = new Set(UI.skipped || []);
  S.ib.skipped = list.filter(x => skip.has(x.path));
  list = list.filter(x => !skip.has(x.path));
  const keepDone = new Map([...S.inbox, ...S.ib.other].filter(x => x.loc).map(x => [x.loc, x]));
  S.inbox = []; S.ib.other = [];
  list.forEach(x => {
    const p = P[x.path] || {}, mb = MB(x.size), old = keepDone.get(x.path);
    if (p.how === "bios"){ const f = baseOf(p.dest); S.ib.other.push({ id: "o:" + x.path, name: x.name, mb, kind: "bios", sys: p.sys, f, to: `bios/${p.sys}/${f}`, label: `BIOS for ${biosName(p.sys)}`, loc: x.path }); return; }
    const w = whatIs(x.name);
    if (w.kind !== "rom" && !(p.how === "fingerprint")){ S.ib.other.push({ id: "o:" + x.path, name: x.name, mb, ...w, loc: x.path }); return; }
    const e = { id: "i:" + x.path, dir: folderSys(x.dir), name: x.name, mb, loc: x.path };
    const m = (p.note || "").match(/^Recognised: (.+)$/);
    if (p.how === "fingerprint" && p.sys){ const q = parseRom(m ? m[1] + ".x" : x.name); e.known = { sys: p.sys, title: q.title, regs: q.regions.map(r => REG_GROUP[r] || r) }; }
    // what you already chose on a card stays chosen
    if (old && !e.known && old.id_done) Object.assign(e, { sys: old.sys, title: old.title, regs: old.regs, conf: old.conf, p: old.p, ext: old.ext, special: old.special, cands: old.cands, sysHow: old.sysHow, mismatch: old.mismatch, id_done: true });
    S.inbox.push(e);
  });
}

// ------------------------------------------------------------------ the model -> real file operations
let KNOWN = new Map();          // id -> loc, for what was on disk at the last sync
const PENDING = [];             // extra operations from screens (copies from a drive, BIOS files)
function remember(){
  KNOWN = new Map();
  for (const f of [...S.romFiles, ...S.trash, ...S.inbox, ...S.ib.other]) if (f.loc) KNOWN.set(f.id, f.loc);
}
// a game in one of your other folders stays where it is
const outside = loc => !!loc && !!ROOT && !loc.startsWith(ROOT + "/");
const romTarget = f => {
  if (outside(f.loc)) return f.loc;
  const sub = (f.rel && f.sys === f.origSys && f.rel.includes("/") && !f.rel.startsWith("_")) ? dirOf(f.rel) : "";
  return `${ROOT}/roms/${f.sys}/${sub}${f.name}`;
};
const trashTarget = t => {
  if (outside(t.loc) && !t.loc.includes("/_duplicates/")) return `${dirOf(t.loc)}_duplicates/${t.name}`;
  if (outside(t.loc)) return t.loc;
  const dup = `${ROOT}/roms/${t.sys}/_duplicates/`;
  if (t.loc && t.loc.startsWith(dup) && baseOf(t.loc) === t.name) return t.loc;
  return dup + t.name;
};
function plan(){
  const ops = [], who = [];
  const add = (f, from, to, kind) => {
    ops.push({ kind, from, to }); who.push(f);
    (f.parts || []).forEach(p => { ops.push({ kind, from: p, to: dirOf(to) + baseOf(p) }); who.push(null); });
  };
  for (const f of S.romFiles){ const to = romTarget(f); if (f.loc){ if (f.loc !== to) add(f, f.loc, to, "move"); } else if (f.src) add(f, f.src, to, f.srcKind || "move"); }
  for (const t of S.trash){ const to = trashTarget(t); if (t.loc){ if (t.loc !== to) add(t, t.loc, to, "move"); } else if (t.src) add(t, t.src, to, t.srcKind || "move"); }
  for (const o of S.ib.done || []) if (o.src && !o.loc && o.to) add(o, o.src, `${ROOT}/${o.to}`, o.srcKind || "move");
  while (PENDING.length){ ops.push(PENDING.shift()); who.push(null); }
  // gone from every list: only deleted when you asked for it
  const now = new Set([...S.romFiles, ...S.trash, ...S.inbox, ...S.ib.other].map(f => f.id));
  const used = new Set([...S.romFiles, ...S.trash, ...(S.ib.done || [])].map(f => f.src).filter(Boolean));
  if (allowDelete) for (const [id, loc] of KNOWN) if (!now.has(id) && !used.has(loc)) { ops.push({ kind: "delete", from: loc, to: "" }); who.push(null); }
  return { ops, who };
}
async function sync(){
  if (!ready) return;
  if (busy){ queued = true; return; }
  const { ops, who } = plan();
  const del = allowDelete; allowDelete = false;
  if (!ops.length){ if (del) remember(); return; }
  busy++;
  const label = (S.log[0] && S.log[0][1]) || "Changes from Emu Vault";
  try {
    const res = await inv("apply_ops", { label, ops });
    let bad = 0;
    res.forEach((r, i) => { const f = who[i]; if (!r.ok){ bad++; return; } if (f){ f.loc = r.path; delete f.src; if (f.name !== undefined && baseOf(r.path) !== f.name && !f.to) f.name = baseOf(r.path); if (f.rel !== undefined) { f.rel = r.path.slice(`${ROOT}/roms/${f.sys}/`.length); f.origSys = f.sys; } } });
    if (bad){ toast(`${bad} file change${bad > 1 ? "s" : ""} couldn't be done: ${res.find(r => !r.ok).error}`); await load(false); renderAll(); renderHome(); }
    else { remember(); if (SNAP) inv("disk_stamp").then(s => { if (!busy) SNAP.stamp = s; }).catch(() => {}); }
  } catch (e) { toast(errMsg(e)); await load(false).catch(() => {}); renderAll(); renderHome(); }
  busy--;
  if (queued){ queued = false; sync(); }
}
const soon = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => { sync(); saveState(); }, 60); }; })();
["click", "change", "keydown", "drop", "input"].forEach(ev => window.addEventListener(ev, e => {
  if (ev === "click" && e.target.closest && e.target.closest("#f-yes,#trash-now,[data-del-for-good]")) allowDelete = true;
  soon();
}, true));
setInterval(() => { if (ready && !busy) sync(); }, 2500);

// accepting an inbox file: the new entry remembers where the file is now
{ const _ai = acceptInbox; acceptInbox = function(f, opts){ const n1 = S.romFiles.length, n2 = S.trash.length;
  _ai(f, opts);
  const e = S.romFiles.length > n1 ? S.romFiles[S.romFiles.length - 1] : S.trash.length > n2 ? S.trash[S.trash.length - 1] : null;
  if (e && f.loc){ e.src = f.loc; e.srcKind = f.copy ? "copy" : "move"; e.origSys = e.sys; e.rel = ""; }
}; }
// BIOS file or app download sorted from the inbox
{ const _do = doOther; doOther = function(id){ const o = S.ib.other.find(x => x.id === id);
  _do(id);
  if (o && o.loc && o.kind === "bios"){ (S.ib.done ||= []).push({ id: "b" + Date.now(), src: o.loc, to: o.to }); }
  if (o && o.loc && o.kind === "app"){ const P = MA.M.pending[o.app]; if (P) P.path = o.loc; }
}; }

// ------------------------------------------------------------------ files coming in: drops, pickers
const REAL = new Map();          // File.lastModified -> {path, size}
let stamp = 1;
const sizeGet = Object.getOwnPropertyDescriptor(Blob.prototype, "size").get;
Object.defineProperty(Blob.prototype, "size", { configurable: true, get(){ const r = this instanceof File && REAL.get(this.lastModified); return r ? r.size : sizeGet.call(this); } });
Object.defineProperty(File.prototype, "path", { configurable: true, get(){ const r = REAL.get(this.lastModified); return r ? r.path : ""; } });
const fileFor = x => { const id = 1e12 + (stamp++); REAL.set(id, x); return new File([], x.name, { lastModified: id }); };
async function filesFor(paths){
  const info = await inv("file_info", { paths });
  let out = [];
  for (const i of info){ if (i.is_dir) out = out.concat(await inv("list_tree", { path: i.path })); else out.push(i); }
  return out;
}
const toList = files => { const dt = new DataTransfer(); files.forEach(f => dt.items.add(fileFor(f))); return dt; };
// Inbox: files from outside are copied into inbox/, then looked at again
async function intoInbox(paths){
  try { const r = await inv("inbox_take", { paths }); const n = r.copied;
    toast((n ? `${n} file${n > 1 ? "s" : ""} in the inbox` : "Nothing new for the inbox") + (r.skipped ? ` · ${r.skipped} settings, pictures and other files left where they are` : "")); } catch (e) { toast(errMsg(e)); }
  await reloadInbox();
}
async function reloadInbox(){ const snap = await inv("ui_snapshot", { scan: false }); await loadInbox(snap.inbox); remember(); renderInboxTab(); updateInboxBadge?.(); renderStrip(); renderHome?.(); }
{ const _tf = takeFiles; takeFiles = function(list, how){ const arr = [...list]; const paths = arr.map(f => f.path).filter(Boolean);
  if (paths.length) return intoInbox(paths);
  return _tf(list, how);
}; }
// <input type=file>: the system file picker, so files come with their real path
window.addEventListener("click", async e => {
  const lab = e.target.closest && e.target.closest("label[for]"), inp = lab ? document.getElementById(lab.htmlFor) : (e.target.matches && e.target.matches("input[type=file]") ? e.target : null);
  if (!inp || inp.type !== "file" || !T) return;
  e.preventDefault(); e.stopPropagation();
  const dir = inp.hasAttribute("webkitdirectory");
  let p = await T.dialog.open({ multiple: !dir && inp.multiple, directory: dir });
  if (!p) return; p = [].concat(p);
  const files = await filesFor(p);
  inp.files = toList(files).files;
  inp.dispatchEvent(new Event("change", { bubbles: true }));
}, true);
// files dropped on the window (Tauri gives paths): hand them to whatever is under the pointer
if (T){
  const at = pos => { const r = window.devicePixelRatio || 1; return document.elementFromPoint(pos.x / r, pos.y / r) || document.body; };
  let last = null;
  T.event.listen("tauri://drag-over", e => { const el = at(e.payload.position); if (el !== last){ last?.dispatchEvent(new DragEvent("dragleave", { bubbles: true })); el.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true })); last = el; } el.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true })); });
  T.event.listen("tauri://drag-leave", () => { last?.dispatchEvent(new DragEvent("dragleave", { bubbles: true })); last = null; });
  T.event.listen("tauri://drag-drop", async e => {
    const el = at(e.payload.position); last = null;
    const files = await filesFor(e.payload.paths || []);
    const ok = el.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: toList(files) }));
    // nobody took it: it goes to the inbox
    if (ok) intoInbox(e.payload.paths);
  });
}

// ------------------------------------------------------------------ links, folders, saving files
window.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("a[href]");
  if (a && /^https?:/.test(a.getAttribute("href"))){ e.preventDefault(); e.stopPropagation(); inv("open_url", { url: a.href }).catch(() => {}); return; }
  const o = e.target.closest && e.target.closest("[data-loc]");
  if (o){ e.preventDefault(); e.stopPropagation(); const p = o.dataset.loc.replace(/\/$/, ""); inv("open_path", { path: p }).catch(err => toast(errMsg(err))); }
}, true);
window.open = url => { inv("open_url", { url: String(url) }).catch(() => {}); return null; };
{ const _click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    if (this.download && /^(blob|data):/.test(this.href) && T){
      const name = this.download;
      fetch(this.href).then(r => r.text()).then(async text => { const p = await T.dialog.save({ defaultPath: name }); if (!p) return; await inv("write_text", { path: p, text }); toast(`Saved: ${baseOf(p)}`); }).catch(e => toast(errMsg(e)));
      return;
    }
    return _click.call(this);
  }; }

// ------------------------------------------------------------------ settings: the ones the core uses, and the rest of the screens' state
let UI = {};
const PICK_UI = ["skipped"];
document.addEventListener("change", e => { const s = e.target.closest && e.target.closest("[data-ppick]"); if (!s) return; setTimeout(() => { const p = S.patches.find(x => x.id === s.dataset.ppick); const f = p && S.romFiles.find(r => r.id === s.value); if (p){ (UI.patchPick ||= {})[p.path] = f ? f.loc : undefined; lastSaved = ""; saveState(); } }, 0); }, true);
const PICK = ["inboxMode", "inboxDup", "biosGoal", "trashDays", "dupKeep", "dupIgnored", "notif", "profiles", "bk", "art", "regions", "regionsOff"];
const enc = v => JSON.stringify(v, (k, x) => x instanceof Set ? { __set: [...x] } : x);
const dec = s => JSON.parse(s, (k, x) => x && x.__set ? new Set(x.__set) : x);
let lastSaved = "";
function stateNow(){
  const st = { addedSys: UI.addedSys || [], skipped: UI.skipped || [], patchPick: UI.patchPick || {}, patchDone: UI.patchDone || {}, fe: UI.fe || {}, boxShape: UI.boxShape || {}, artAuto: UI.artAuto !== false, artNF: UI.artNF || [], artMiss: UI.artMiss || [], s: {}, coll: { regs: S.coll.regs, unl: S.coll.unl, test: S.coll.test, wish: S.coll.wish, manual: S.coll.manual }, apps: UI.apps || {} };
  PICK.forEach(k => { if (S[k] !== undefined) st.s[k] = S[k]; });
  if (typeof MA === "object") MA.M.apps.forEach(a => { st.apps[a.id] = { remind: a.remind, checked: a.checked, retired: a.retired, skip: a.skip, notes: a.notes }; });
  return st;
}
let cfgSent = "";
async function saveState(){
  if (!ready) return;
  const st = stateNow(), j = enc(st);
  if (j !== lastSaved){ lastSaved = j; UI = st; inv("ui_state_save", { json: j }).catch(() => {}); }
  // what the core needs to know
  const want = { root: S.dir, keep: S.keep, platform: S.platform === "beide" ? "both" : S.platform, regions: S.regions.filter(r => ["US", "EU", "JP", "OV"].includes(r)), trash_days: S.trashDays || 0, plats_default: S.plats || [] };
  const w = JSON.stringify(want);
  if (w !== cfgSent && OV){
    cfgSent = w;
    const rootChanged = OV.config.root !== want.root;
    try { OV = await inv("save_settings", { cfg: { ...OV.config, ...want, regions: want.regions.length ? want.regions : OV.config.regions } }); } catch (e) { toast(errMsg(e)); }
    if (rootChanged){ await inv("make_folders").catch(() => {}); await load(true); renderAll(); renderHome(); }
  }
}
function applyState(j){
  try { UI = j ? dec(j) : {}; } catch (e) { UI = {}; }
  const s = UI.s || {};
  PICK.forEach(k => { if (s[k] !== undefined){ if (S[k] && typeof S[k] === "object" && !(S[k] instanceof Set) && !Array.isArray(S[k])) S[k] = { ...S[k], ...s[k] }; else S[k] = s[k]; } });
  if (UI.coll) Object.assign(S.coll, UI.coll);
}

// ------------------------------------------------------------------ start
let OV = null;
async function start(){
  clearSamples(); renderAll(); renderHome();
  if (!T){ toast("Open Emu Vault as an app to see your own files."); return; }
  try {
    OV = await inv("get_overview");
    S.keep = OV.config.keep; S.platform = OV.config.platform === "both" ? "beide" : OV.config.platform;
    S.plats = (OV.config.plats_default || []).length ? OV.config.plats_default.slice() : OV.config.platform === "both" ? ["linux", "android"] : [OV.config.platform];
    S.regions = OV.config.regions.length ? OV.config.regions : S.regions; S.regionsOff ||= []; S.trashDays = OV.config.trash_days;
    const first = await inv("ui_snapshot", { scan: false });
    applyState(first.ui_state);
    if (OV.config.skin === "modern") setSkin("modern");
    hooks.forEach(h => h(OV));
    await load(false);
    cfgSent = JSON.stringify({ root: S.dir, keep: S.keep, platform: OV.config.platform, regions: OV.config.regions, trash_days: OV.config.trash_days, plats_default: S.plats });
    lastSaved = enc(stateNow());
    ready = true;
    renderAll(); renderHome(); updateInboxBadge?.(); renderStrip();
    inv("startup_chores").then(ch => { if (ch.backup) toast(`Saves backed up (${ch.backup.files} files)`); if (ch.purged) toast(`${ch.purged} old files in _duplicates deleted (older than ${S.trashDays} days)`); EVB.loadB?.(); }).catch(() => {});
    // new versions of your apps, at most every 6 hours
    if (OV.config.check_on_start){
      const stale = OV.apps.filter(a => a.enabled && a.source !== "none" && !(UI.apps && UI.apps[a.id] && UI.apps[a.id].retired) && (!a.checked || a.error || Date.now() - new Date(a.checked.replace(" ", "T")).getTime() > 6 * 3600e3)).map(a => a.id);
      if (stale.length) inv("check_apps", { ids: stale }).then(ov => { EVA.apply(ov); MA.render(); renderHome(); renderStrip(); const u = MA.updates(); if (u.length) notify("apps", `${u.length} new version${u.length > 1 ? "s" : ""} of your apps`, u.slice(0, 3).map(a => `${a.name} ${a.update.ver}`).join(", "), "myapps"); }).catch(() => {});
    }
  } catch (e) { toast(errMsg(e)); }
}
if (T){ let lt = 0; T.event.listen("scan-progress", e => { const [i, n, s] = e.payload; if (Date.now() - lt > 700 || i === n){ lt = Date.now(); toast(i === n ? "Library read" : `Reading your library… ${i} of ${n} (${s})`); } }); }
const hooks = [];
const later = what => toast(`${what} isn't in this version of Emu Vault yet. It comes in a later one.`);
const queue = op => { PENDING.push(op); soon(); };
async function m3u(keys){
  await sync();
  const names = keys.map(k => k.replace("|", "/"));
  try { const n = await inv("make_m3u", { names }); if (n < names.length) toast(`${n} of ${names.length} combined; the others were already done or had a problem (see Activity)`); } catch (e) { toast(errMsg(e)); }
  await load(false); renderRoms(); renderHome?.();
}
async function pickDrive(){
  const p = await T.dialog.open({ directory: true, title: "A drive, SD card or folder with games" }); if (!p) return;
  const info = (await inv("list_drives").catch(() => [])).find(d => p.startsWith(d.path));
  const d = { id: "f" + Date.now(), name: baseOf(p.replace(/\/$/, "")) || p, path: p.replace(/\/$/, ""), size: info ? `${Math.round(info.total / 1e9)} GB` : "", free: info ? Math.round(MB(info.free)) : 999999, layout: "folder", scanned: false };
  S.drives.push(d); S.drv.sel = d.id; S.drv.dir = "in"; S.drv.done = null; renderRoms(); renderInboxTab?.();
}
async function listDrives(){
  const ds = await inv("list_drives").catch(() => []);
  const keep = S.drives.filter(d => d.id.startsWith("f"));
  S.drives = ds.map((d, i) => ({ id: "m" + i, name: d.name, path: d.path, size: `${Math.round(d.total / 1e9)} GB`, free: Math.round(MB(d.free)), layout: "drive", scanned: false })).concat(keep);
}
async function readDrive(drv){
  if (drv.files && drv.files.length) return;
  const files = await inv("read_drive", { path: drv.path }).catch(e => { toast(errMsg(e)); return []; });
  drv.files = files.map((f, i) => ({ id: "d" + i + Math.random().toString(36).slice(2, 5), dir: f.dir, name: f.name, mb: MB(f.size), hash: "x-" + f.name + "-" + f.size, path: f.path }));
  // the same file in your library counts as "you already have it"
  const bySize = new Map(S.romFiles.map(x => [x.name + "|" + Math.round(x.mb * 1048576), x.hash]));
  drv.files.forEach(f => { const h = bySize.get(f.name + "|" + Math.round(f.mb * 1048576)); if (h) f.hash = h; });
  const top = new Set(drv.files.map(f => f.dir.split("/")[0].toLowerCase()));
  drv.layout = top.has("roms") ? (drv.files.some(f => /^Roms\//.test(f.dir)) ? "handheld (muOS / Knulli style)" : "ES-DE style") : "folders by system";
  // a drive whose system folders sit at the top: read them as roms/<folder>
  if (!top.has("roms") && !top.has("bios")) drv.files.forEach(f => { f.dir = "roms/" + f.dir; });
}
let covRun = null;
async function covers(quiet){
  const A = S.art; if (A.run) return; artFromConfig(); if (A.from === "esde") return; await sync();
  artFromConfig(); const all = artTargets(); if (!all.length && !(A.kinds && A.kinds.size > 1)) return;
  A.run = { total: all.length || 1, done: 0 }; renderRoms();
  try {
    await saveArt();
    const [ok, nfN, nf] = await inv("covers_fetch", { skip: quiet ? (UI.artNF || []) : [] });
    A.last = { ok, lr: ok, req: 0, nf: quiet ? [...new Set([...(A.last ? A.last.nf : []), ...(nf || [])])] : (nf || []) };
    UI.artNF = quiet ? [...new Set([...(UI.artNF || []), ...(nf || [])])].slice(-5000) : (nf || []);
    if (ok || !quiet){ log(`Box art: ${ok} covers downloaded, ${nfN} not found${quiet ? " (automatic, for new games)" : ""}`); toast(`${ok} cover${ok === 1 ? "" : "s"} downloaded${quiet ? " for your new games" : ""}`); }
  } catch (e) { if (!quiet) toast(errMsg(e)); else log("Box art: automatic download didn't work: " + errMsg(e)); }
  A.run = null; await load(false);
  UI.artMiss = artTargets().map(f => f.loc).slice(0, 5000); lastSaved = ""; saveState();
  renderRoms(); renderColl(); renderHome?.();
}
// new games without a cover: download them in the background (Box art: "Download covers for new games automatically", on by default)
async function autoCovers(){
  const A = S.art; artFromConfig(); if (!A.auto || A.from === "esde" || A.run || !ready || busy || !artReady()) return;
  const known = new Set(UI.artMiss || []), fresh = artTargets().filter(f => f.loc && !known.has(f.loc));
  if (fresh.length) await covers(true);
}
document.addEventListener("change", e => {
  const c = e.target; if (!c || (c.id !== "art-auto" && c.id !== "art-auto2")) return;
  S.art.auto = c.checked; UI.artAuto = c.checked; lastSaved = ""; saveState(); saveArt().catch(() => {});
  log(c.checked ? "Covers for new games: downloaded automatically" : "Covers for new games: only when you press Download");
  if (c.id === "art-auto2") renderRoms(); if (c.checked) autoCovers();
});
if (T) T.event.listen("cover-progress", e => { if (S.art.run){ const [d, n] = e.payload; S.art.run.done = d; S.art.run.total = n || S.art.run.total; if (activeTab?.() === "roms") renderRoms(); } });

async function addSystem(id){
  try { await inv("add_system", { id }); (UI.addedSys ||= []).includes(id) || UI.addedSys.push(id); lastSaved = ""; saveState(); } catch (e) { toast(errMsg(e)); }
}
async function findSetup(){
  const f = await inv("find_setup").catch(e => { toast(errMsg(e)); return []; });
  FOUND = f.map(x => ({ ...x, mb: Math.round(x.mb) }));
}
async function importSetup(picked, how){
  let bios = 0, saves = 0, games = 0;
  for (const f of picked){
    try {
      if (f.kind === "bios"){ const r = await inv("collect_bios", { from: f.path }); bios += r.copied.length; }
      else if (f.kind === "saves"){ const c = OV.config; if (!c.save_sources.some(s => s.path === f.path)){ OV = await inv("save_settings", { cfg: { ...c, save_sources: [...c.save_sources, { label: f.note.replace(/^for /, ""), path: f.path }] } }); saves++; } }
      else if (how === "copy"){ games += (await inv("inbox_take", { paths: [f.path] })).copied; }
      else if (how === "move"){ const r = await inv("apply_ops", { label: `Moved ${f.path} into the inbox`, ops: [{ kind: "move", from: f.path, to: `${ROOT}/inbox/${baseOf(f.path)}` }] }); if (r[0] && r[0].ok) games += f.n; else toast(r[0] ? r[0].error : "Couldn't move"); }
    } catch (e) { toast(errMsg(e)); }
  }
  log(`Setup: ${bios} BIOS files copied, ${saves} save folders backed up${games ? `, ${games} files in the Inbox` : ""}`);
  await load(false); renderAll(); renderHome(); EVB.loadB?.();
}
async function fillDrive(drv){
  const prof = S.profiles.find(p => p.id === (drv.profile || S.profiles[0].id)), pl = profilePlan(drv, prof);
  const dirs = await inv("device_dirs", { target: drv.path, layout: prof.layout, systems: prof.systems });
  const ops = [];
  pl.games.forEach(f => { const d = dirs[f.sys][0]; ops.push({ kind: "copy", from: f.loc, to: `${d}/${f.name}` }); (f.parts || []).forEach(p => ops.push({ kind: "copy", from: p, to: `${d}/${baseOf(p)}` })); });
  pl.bios.forEach(k => { const [s, ...n] = k.split("/"); ops.push({ kind: "copy", from: `${ROOT}/bios/${k}`, to: `${dirs[s][1]}/${n.join("/")}` }); });
  try {
    const res = await inv("apply_ops", { label: `${drv.name}: filled with profile ${prof.name}`, ops });
    const bad = res.filter(r => !r.ok);
    const msg = `${drv.name}: ${pl.games.length} games${prof.bios ? `, ${pl.bios.length} BIOS file${pl.bios.length === 1 ? "" : "s"}` : ""} copied with profile ${prof.name}${bad.length ? ` (${bad.length} not copied: ${bad[0].error})` : ""}`;
    log(msg); toast(bad.length ? msg : `${prof.name}: drive filled`);
  } catch (e) { toast(errMsg(e)); }
  drv.files = []; drv.scanned = false; renderRoms(); renderInboxTab?.(); renderHome?.();
}
function bkHome(it){
  const B = typeof EVB === "object" && EVB.B; if (!B) return;
  const lasts = B.folders.map(f => f.snaps.find(s => !s.note)).filter(Boolean).map(s => s.time).sort(), never = B.folders.filter(f => !f.snaps.some(s => !s.note)).length;
  const W = { daily: "Next backup within a day, when something changed", weekly: "Next backup within a week", start: "Next backup when Emu Vault starts", manual: "Backups only when you ask" };
  if (!B.folders.length) it.push({ k: "info", icon: "◷", t: "Saves not backed up yet", s: B.detected.length ? `${B.detected.length} save folder${B.detected.length > 1 ? "s" : ""} found on this computer` : "Choose the save folders of your emulators", go: "bk" });
  else if (never) it.push({ k: "warn", icon: "◷", t: `${never} emulator${never > 1 ? "s" : ""} not backed up yet`, s: "Press Back up everything now in Backups", go: "bk" });
  else it.push({ k: "ok", icon: "✓", t: `Saves backed up ${lasts[0]}`, s: W[B.when] || W.daily, go: "bk" });
}
async function checkAll(){
  log("Checking everything…");
  try { await load(true); } catch (e) { toast(errMsg(e)); }
  await EVA.check().catch(() => {});
  EVB.loadB?.(); renderAll(); renderHome(); updateNotice?.();
  toast("Checked apps, your library, the Inbox and BIOS");
}
function skip(paths){
  UI.skipped = [...new Set([...(UI.skipped || []), ...paths.filter(Boolean)])];
  lastSaved = ""; saveState();
}
function unskipAll(){ UI.skipped = []; lastSaved = ""; saveState(); reloadInbox(); }
// clean up: files go to _duplicates/inbox/<date>/ (undo in Recent changes; deleted for good after your _duplicates days)
async function cleanInbox(kind){
  const pick = kind === "other" ? S.ib.other.filter(o => !["bios", "app", "save"].includes(o.kind)) : kind === "skipped" ? (S.ib.skipped || []).map(x => ({ loc: x.path, name: x.name })) : [...S.inbox, ...S.ib.other, ...(S.ib.skipped || []).map(x => ({ loc: x.path, name: x.name }))];
  const list = pick.filter(x => x.loc);
  if (!list.length) return;
  const d0 = new Date(), stamp = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, "0")}-${String(d0.getDate()).padStart(2, "0")}_${String(d0.getHours()).padStart(2, "0")}-${String(d0.getMinutes()).padStart(2, "0")}`, base = `${ROOT}/_duplicates/inbox/${stamp}/`, ib = `${ROOT}/inbox/`;
  const ops = list.map(x => ({ kind: "move", from: x.loc, to: base + (x.loc.startsWith(ib) ? x.loc.slice(ib.length) : baseOf(x.loc)) }));
  const label = `Inbox cleaned up: ${list.length} file${list.length > 1 ? "s" : ""} to _duplicates`;
  toast("Cleaning up…");
  try { const r = await inv("apply_ops", { label, ops }); const ok = r.filter(x => x.ok).length; log(label); toast(`${ok} file${ok === 1 ? "" : "s"} removed from the inbox. Undo in Settings › Recent changes.`);
    const back = ops.map((o, i) => r[i] && r[i].ok ? { kind: "move", from: r[i].path, to: o.from } : null).filter(Boolean);
    record(label, () => { inv("apply_ops", { label: "Undone: " + label, ops: back }).then(() => reloadInbox()).catch(e => toast(errMsg(e))); }, { tab: "inbox" }); }
  catch (e) { toast(errMsg(e)); }
  const gone = new Set(list.map(x => x.loc)); UI.skipped = (UI.skipped || []).filter(p => !gone.has(p)); lastSaved = ""; saveState();
  await reloadInbox();
}
async function addPatches(files){
  const ops = files.filter(f => f.path).map(f => ({ kind: "copy", from: f.path, to: `${ROOT}/patches/${f.name}` }));
  if (!ops.length){ toast("Drop the patch files on the window, or put them in " + ROOT + "/patches/"); return; }
  try { await inv("apply_ops", { label: `${ops.length} patch file${ops.length > 1 ? "s" : ""} added`, ops }); toast(`${ops.length} patch file${ops.length > 1 ? "s" : ""} added to patches/`); } catch (e) { toast(errMsg(e)); }
  await load(false); renderRoms();
}
async function applyPatch(id, btn){
  const p = S.patches.find(x => x.id === id), t = p && patchTarget(p); if (!t) return;
  if (btn){ btn.disabled = true; btn.textContent = "Patching…"; }
  await sync();
  try {
    const out = await inv("apply_patch", { rom: t.loc, patch: p.path, tag: p.tag });
    p.done = baseOf(out); (UI.patchDone ||= {})[p.path] = p.done; if (p.pick) (UI.patchPick ||= {})[p.path] = t.loc; lastSaved = ""; saveState();
    log(`Patched: ${p.done}`); toast(`Patched copy made: ${p.done}`);
  } catch (e) { toast(errMsg(e)); }
  await load(false); renderRoms(); renderStrip();
}
async function frontend(kind, btn){
  if (btn){ btn.disabled = true; btn.textContent = "Writing…"; }
  await sync();
  try {
    const r = await inv("write_frontend", { kind });
    if (kind === "ra") S.tools.fe.ra = r.systems || S.tools.fe.ra || 1; else S.tools.fe.esde = true;
    UI.fe = { ra: S.tools.fe.ra, esde: S.tools.fe.esde }; lastSaved = ""; saveState();
    const what = kind === "ra" ? "RetroArch playlists" : "ES-DE game lists";
    const msg = r.added ? `${what}: ${nl(r.added)} games added in ${r.systems} system${r.systems === 1 ? "" : "s"}` : `${what}: already up to date`;
    log(`${msg} (${r.dir})`);
    toast(r.fallback ? `${msg}. ${kind === "ra" ? "RetroArch" : "ES-DE"} wasn't found on this computer, so they are in ${r.dir}` : `${msg} · ${r.dir}`);
  } catch (e) { toast(errMsg(e)); }
  renderRoms();
}
// files changed outside Emu Vault (deleted in the file manager, copied in by hand): read the folders again
let watching = false;
async function diskCheck(){
  if (!ready || busy || watching || !SNAP || !SNAP.stamp || S.tools.chdRun) return;
  watching = true;
  try {
    const s = await inv("disk_stamp");
    if (s !== SNAP.stamp && !busy){
      await sync();
      await load(true);
      try { if (typeof EVA === "object" && EVA.refresh) await EVA.refresh(); } catch (e) {}
      renderAll(); renderHome(); renderStrip(); if (typeof renderInboxTab === "function") renderInboxTab();
      log("Folders changed outside Emu Vault: read them again");
    }
  } catch (e) {}
  watching = false;
}
window.addEventListener("focus", () => setTimeout(diskCheck, 300));
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(diskCheck, 300); });
setInterval(() => { if (!document.hidden) diskCheck(); }, 60000);
if (T) T.event.listen("disk-changed", () => setTimeout(diskCheck, 200));
// covers and videos that ES-DE (or you) put in media/: show them right away, without reading all folders again
let mediaBusy = false, mediaAgain = false;
async function mediaRefresh(){
  if (mediaBusy){ mediaAgain = true; return; }
  if (!ready || busy || S.art.run){ setTimeout(mediaRefresh, 2000); return; }
  mediaBusy = true;
  try { await load(false); renderRoms(); renderColl(); if (activeTab?.() === "home") renderHome(); } catch (e) {}
  mediaBusy = false;
  if (mediaAgain){ mediaAgain = false; setTimeout(mediaRefresh, 2000); }
}
if (T) T.event.listen("media-changed", () => mediaRefresh());
// Settings › Storage: everything in _duplicates in one place
let dupSure = false;
function dupStoreHTML(){
  const d = (SNAP && SNAP.dups) || []; const tot = d.reduce((a, x) => a + x.bytes, 0), files = d.reduce((a, x) => a + x.files, 0);
  const days = S.trashDays;
  return `<div class="field"><span class="lbl">_duplicates · ${nl(files)} file${files === 1 ? "" : "s"} · ${size(Math.max(tot ? 1 : 0, Math.round(MB(tot))))}</span>
    ${d.length ? `<div class="files">${d.map(x => `<div class="frow"><span class="dot"></span><div><div class="fn mono">${esc(x.label)}/_duplicates</div><div class="note">${nl(x.files)} file${x.files === 1 ? "" : "s"} · ${size(Math.max(1, Math.round(MB(x.bytes))))}</div></div><button class="linkbtn" data-dupopen="${esc(x.path)}">Open folder</button></div>`).join("")}</div>` : `<p class="hint" style="margin:0">Empty. What you clean up (duplicates, inbox, converted originals) waits here before it's deleted.</p>`}
    <p class="hint" style="margin:0">${days ? `Files are deleted for good ${days} days after they were moved here.` : "Files stay until you empty it."} Until then, Settings › Recent changes can put them back.</p>
    ${d.length ? `<div class="gact"><button class="btn small" data-dupempty="1">${dupSure ? `Sure? Delete ${nl(files)} files for good` : "Empty _duplicates now"}</button></div>` : ""}</div>`;
}
document.addEventListener("click", async e => {
  const o = e.target.closest && e.target.closest("[data-dupopen]"); if (o){ inv("open_path", { path: o.dataset.dupopen }).catch(err => toast(errMsg(err))); return; }
  const b = e.target.closest && e.target.closest("[data-dupempty]"); if (!b) return;
  if (!dupSure){ dupSure = true; renderSet(); setTimeout(() => { if (dupSure){ dupSure = false; renderSet(); } }, 4000); return; }
  dupSure = false; await sync();
  const d = (SNAP && SNAP.dups) || [];
  try { await inv("apply_ops", { label: "_duplicates emptied", ops: d.map(x => ({ kind: "delete", from: x.path, to: "" })) }); log("_duplicates emptied"); toast("_duplicates is empty"); } catch (err) { toast(errMsg(err)); }
  await load(false); renderAll(); renderHome(); renderStrip();
});
// ===================================================================== Box art: everything in Roms › Tools › Box art
const ART_KINDS = [["covers", "Front cover", "100–300 KB"], ["screenshots", "Screenshot", "50–150 KB"], ["titlescreens", "Title screen", "50–150 KB"]];
let mediaInfo = null, artInit = false, artBusy = "";
function artFromConfig(){
  if (artInit || !OV || !OV.config) return; artInit = true;
  const c = OV.config.covers || {}, A = S.art;
  A.kinds = new Set((c.media && c.media.length) ? c.media : ["covers"]); A.kinds.add("covers");
  A.size = c.size ? String(c.size) : "full";
  A.dest.ra = c.retroarch !== false;
  A.from = c.source === "esde" ? "esde" : "libretro";
}
async function loadMediaInfo(){ try { mediaInfo = await inv("media_info"); } catch (e) { mediaInfo = { esde_found: false, ra_thumbs: "", media_dir: ROOT + "/media" }; } renderRoms(); }
async function saveArt(){
  artFromConfig(); const A = S.art, c = OV.config; if (!mediaInfo) await loadMediaInfo().catch(() => {});
  const ra = !!A.dest.ra && !!(mediaInfo && mediaInfo.ra_thumbs);
  OV = await inv("save_settings", { cfg: { ...c, covers: { ...c.covers, esde: true, esde_dir: `${ROOT}/media`, retroarch: ra, ra_dir: ra ? mediaInfo.ra_thumbs : `${ROOT}/thumbnails`, kind: "Named_Boxarts", media: [...A.kinds], size: A.size === "full" ? 0 : +A.size, auto: !!A.auto, source: A.from || "libretro" } } });
}
artToolHTML = function(){
  artFromConfig(); if (!mediaInfo && T) { mediaInfo = { loading: true }; loadMediaInfo(); }
  const A = S.art, all = artCountable(), miss = artTargets(), have = all.length - miss.length, R = A.run, mi = mediaInfo || {};
  const kinds = ART_KINDS.filter(([k]) => A.kinds && A.kinds.has(k)).map(([, l]) => l.toLowerCase()).join(", ") || "front cover";
  const esdeMode = A.from === "esde";
  const fromSeg = `<div class="field" style="margin:0"><span class="lbl">Covers from</span><div class="seg" role="group"><button data-artfrom="libretro" aria-pressed="${!esdeMode}">libretro (Emu Vault downloads them)</button><button data-artfrom="esde" aria-pressed="${esdeMode}">ES-DE (you scrape in ES-DE)</button></div></div>`;
  const where = ["ES-DE", A.dest.ra && mi.ra_thumbs ? "RetroArch" : ""].filter(Boolean).join(", ");
  let h = `<div class="sys-block tool" id="art-tool" style="margin-top:12px"><header><div><h3>Box art</h3><div class="used">${A.from === "esde" ? "from ES-DE's scraper" : `${esc(kinds)} · from libretro-thumbnails`} · for ${where}</div></div>${miss.length ? `<span class="pill warn">${nl(miss.length)} missing</span>` : `<span class="pill ok">complete</span>`}</header>
    <div class="pbar"><i style="width:${all.length ? have / all.length * 100 : 0}%"></i></div>
    <p class="hint" style="margin:0">${nl(have)} of ${nl(all.length)} games have a cover. Translations, hacks and damaged files are skipped.</p>
    ${fromSeg}
    ${esdeMode ? "" : `<label class="inline" for="art-auto2" style="font-size:13px"><input type="checkbox" id="art-auto2" ${A.auto ? "checked" : ""}> Download covers for new games automatically</label>`}`;
  if (esdeMode && !R) h += `<p class="hint" style="margin:0">Emu Vault downloads nothing now: start ES-DE and use Main menu › Scraper. ES-DE saves in <span class="mono">${esc(ROOT)}/media</span>, and the covers show up here while it scrapes. To replace covers that are there already, switch on "Overwrite files" in ES-DE's scraper settings.</p><div class="gact">${typeof esdeHomeBtn === "function" ? esdeHomeBtn() : ""}${mi.esde_media && !mi.esde_here ? `<button class="btn small" data-esdeimport="1" ${artBusy ? "disabled" : ""}>${artBusy === "import" ? "Taking over…" : "Take over ES-DE's media"}</button>` : ""}</div>`;
  else if (R) h += `<p class="hint" style="margin:0">Downloading ${nl(R.done)} of ${nl(R.total)}…</p><div class="prog"><i style="width:${R.total ? R.done / R.total * 100 : 0}%"></i></div>`;
  else h += `<div class="gact"><button class="btn ${miss.length ? "primary" : ""} small" id="art-run">${miss.length ? `Download ${nl(miss.length)} missing` : "Check for missing pictures"}</button>${mi.esde_media && !mi.esde_here ? `<button class="btn small" data-esdeimport="1" ${artBusy ? "disabled" : ""}>${artBusy === "import" ? "Taking over…" : "Take over ES-DE's media"}</button>` : ""}</div>`;
  if (A.last && !R){ const nf = (A.last.nf || []).filter(x => !x.includes("|")); h += `<div class="verdict ${nf.length ? "warn" : "ok"}"><b>${nl(A.last.ok)} cover${A.last.ok === 1 ? "" : "s"} downloaded.</b>${nf.length ? ` Not found at libretro: ${nf.slice(0, 12).map(n => `<span class="mono">${esc(n)}</span>`).join(", ")}${nf.length > 12 ? ` and ${nl(nf.length - 12)} more` : ""}. Often a hack, a translation or an unusual name.` : ""}</div>`; }
  if (miss.length){
    const bySys = {}; miss.forEach(f => (bySys[f.sys] ||= []).push(f));
    h += `<details class="codes" ${isOpen("art:miss") ? "open" : ""} data-k="art:miss"><summary>Which games have no cover · ${nl(miss.length)}</summary><div class="files" style="margin-top:6px">${Object.entries(bySys).sort((a, b) => sysName(a[0]).localeCompare(sysName(b[0]))).map(([s, l]) =>
      `<div class="lbl2" style="margin-top:6px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">${esc(sysName(s))} · ${l.length}</div>` + l.slice(0, 300).map(f => `<div class="frow"><span class="dot"></span><div style="min-width:0"><div class="fn" style="overflow-wrap:anywhere">${esc(f.name)}</div><div class="note mono" style="overflow-wrap:anywhere">media/${esc(s)}/covers/${esc((f.rel || f.name).replace(/\.[^.\/]+$/, ""))}.png</div></div><button class="linkbtn" data-covopen="${esc(s)}">Open cover folder</button></div>`).join("") + (l.length > 300 ? `<p class="hint">and ${nl(l.length - 300)} more</p>` : "")).join("")}</div>
      <p class="hint" style="margin:6px 0 0">${esdeMode ? "Scrape these in ES-DE, or put a picture with exactly this name in the folder shown." : "Not found at libretro is often a hack, a translation or an unusual file name. You can also put your own picture with exactly the name shown."}</p></details>`;
  }
  if (!esdeMode) h += `<details class="codes" ${isOpen("art:opts") ? "open" : ""} data-k="art:opts"><summary>What, how big and where</summary><div class="form" style="gap:12px;margin-top:10px">
    <div class="field"><span class="lbl">What to download</span><div style="display:flex;flex-direction:column;gap:6px">${ART_KINDS.map(([k, l, s]) => `<label class="inline"><input type="checkbox" data-artk="${k}" ${A.kinds && A.kinds.has(k) ? "checked" : ""} ${k === "covers" ? "disabled" : ""}> ${l} <span class="muted" style="font-size:12px">${s} per game</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">Size</span><div class="seg" role="group">${[["full", "Original"], ["600", "600 px wide"], ["300", "300 px wide"]].map(([v, l]) => `<button data-artsz="${v}" aria-pressed="${A.size === v}">${l}</button>`).join("")}</div>
      <p class="hint">${A.size === "full" ? "As libretro has them: sharpest, about 200 KB per cover." : A.size === "600" ? "Sharp on handhelds and phones, about 80 KB per cover." : "Small and light, about 30 KB per cover. Fine for lists."} Only new downloads change size.</p></div>
    <div class="field"><span class="lbl">ES-DE</span><p class="hint" style="margin:0">Saved in <span class="mono">${esc(mi.media_dir || ROOT + "/media")}/&lt;system&gt;/covers/</span>, <span class="mono">screenshots/</span>, <span class="mono">titlescreens/</span>, named after your ROM file: exactly the layout of ES-DE's downloaded_media.</p>
      ${mi.esde_here ? `<div class="verdict ok"><b>ES-DE uses this folder.</b> What you download here shows up in ES-DE right away.</div>` : mi.esde_found ? `<div class="gact"><button class="btn small" data-esdepoint="1" ${artBusy ? "disabled" : ""}>${artBusy === "point" ? "Changing…" : "Let ES-DE use this folder"}</button></div><p class="hint" style="margin:0">Close ES-DE first: it writes its settings when it closes. A copy of ES-DE's settings is kept. ${mi.esde_media ? `Press "Take over ES-DE's media" first, so what ES-DE scraped before comes along.` : ""}</p>` : `<p class="hint" style="margin:0">ES-DE isn't on this computer. In ES-DE: Other settings › Game media directory › <span class="mono">${esc(ROOT)}/media</span>.</p>`}</div>
    <div class="field"><label class="inline"><input type="checkbox" data-artra="1" ${A.dest.ra ? "checked" : ""} ${mi.ra_thumbs ? "" : "disabled"}> Also for RetroArch</label>
      <p class="hint" style="margin:0">${mi.ra_thumbs ? `In <span class="mono">${esc(mi.ra_thumbs)}</span>, as links to the same files: no extra space.` : "RetroArch wasn't found on this computer."}</p></div>
    <div class="field"><label class="inline"><input type="checkbox" data-artshow="1" ${A.show ? "checked" : ""}> Show covers in Emu Vault</label></div>
  </div></details>`;
  return h + `</div>`;
};
artSettingsHTML = function(){
  const A = S.art;
  return `<div class="form set-sec" id="art-sec"><h2>Box art</h2>
    <div class="field"><label class="inline" for="art-show"><input type="checkbox" id="art-show" ${A.show ? "checked" : ""}> Show covers in Emu Vault</label></div>
    <div class="field"><label class="inline" for="art-auto"><input type="checkbox" id="art-auto" ${A.auto ? "checked" : ""}> Download covers for new games automatically</label></div>
    <p class="hint" style="margin:0">What to download, the size, ES-DE and RetroArch: Roms › Tools › Box art.</p>
    <div class="gact"><button class="btn small" id="art-go">Open Box art</button></div></div>`;
};
document.addEventListener("change", async e => {
  const c = e.target; if (!c || !c.dataset) return; const A = S.art;
  if (c.dataset.artk){ c.checked ? A.kinds.add(c.dataset.artk) : A.kinds.delete(c.dataset.artk); await saveArt().catch(err => toast(errMsg(err))); renderRoms(); }
  else if (c.dataset.artra){ A.dest.ra = c.checked; await saveArt().catch(err => toast(errMsg(err))); renderRoms(); }
  else if (c.dataset.artshow){ A.show = c.checked; renderRoms(); renderColl(); }
});
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-artsz],[data-esdeimport],[data-esdepoint],[data-artfrom]"); if (!b) return;
  if (b.dataset.artfrom){ S.art.from = b.dataset.artfrom; await saveArt().catch(err => toast(errMsg(err))); log(S.art.from === "esde" ? "Covers: from ES-DE's scraper" : "Covers: downloaded by Emu Vault from libretro"); renderRoms(); return; }
  const A = S.art;
  if (b.dataset.artsz){ A.size = b.dataset.artsz; await saveArt().catch(err => toast(errMsg(err))); renderRoms(); return; }
  if (artBusy) return;
  if (b.dataset.esdeimport){
    artBusy = "import"; renderRoms();
    try { const r = await inv("import_esde_media"); toast(r.files ? `${nl(r.files)} pictures and videos taken over from ES-DE (${r.systems} system${r.systems === 1 ? "" : "s"})` : "ES-DE has nothing for your games that Emu Vault doesn't have yet"); log(`Box art: ${r.files} files taken over from ES-DE`); } catch (err) { toast(errMsg(err)); }
    artBusy = ""; await load(false); renderRoms(); renderColl(); return;
  }
  if (b.dataset.esdepoint){
    artBusy = "point"; renderRoms();
    try { const d = await inv("point_esde"); toast(`ES-DE now uses ${d} for game media`); } catch (err) { toast(errMsg(err)); }
    artBusy = ""; await loadMediaInfo(); return;
  }
});
// the folder where this system's covers go (or the nearest one that exists)
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-covopen]"); if (!b) return;
  const s = b.dataset.covopen;
  for (const p of [`${ROOT}/media/${s}/covers`, `${ROOT}/media/${s}`, `${ROOT}/media`]){ try { await inv("open_path", { path: p }); return; } catch (err) {} }
  toast("The media folder isn't there yet");
});
document.addEventListener("toggle", e => { const d = e.target; if (d && d.dataset && (d.dataset.k === "art:opts" || d.dataset.k === "art:miss")) d.open ? S.ui.open.add(d.dataset.k) : S.ui.open.delete(d.dataset.k); }, true);
// ===================================================================== Settings › While Emu Vault is closed (systemd timer)
let bgSt = null, bgBusy = false;
async function loadBg(){ try { bgSt = await inv("bg_status"); } catch (e) { bgSt = { cfg: { on: false, hours: 6, apps: true, inbox: true, saves: true, covers: true }, systemd: false }; } renderSet(); }
function bgHTML(){
  if (!bgSt){ if (T) { bgSt = { loading: true, cfg: { on: false, hours: 6 } }; loadBg(); } return ""; }
  const c = bgSt.cfg || {}, dis = c.on ? "" : 'style="opacity:.5;pointer-events:none"';
  const what = [["apps", "New versions of your apps"], ["inbox", "New files in the Inbox"], ["saves", "Save backups that are due (your Backups schedule)"], ["covers", "Covers for new games (when that's on in Box art)"]];
  return `<div class="form set-sec" id="bg-sec"><h2>While Emu Vault is closed</h2>
    <label class="inline-t"><input type="checkbox" data-bgon="1" ${c.on ? "checked" : ""} ${bgBusy || bgSt.systemd === false ? "disabled" : ""}> Check in the background and send me a notification</label>
    ${bgSt.systemd === false ? `<p class="hint" style="margin:0">This needs systemd, which this computer doesn't seem to use.</p>` : ""}
    <div class="field" ${dis}><span class="lbl">How often</span><div class="seg" role="group">${[[3, "Every 3 hours"], [6, "Every 6 hours"], [12, "Twice a day"], [24, "Once a day"]].map(([v, l]) => `<button data-bgh="${v}" aria-pressed="${c.hours === v}">${l}</button>`).join("")}</div></div>
    <div class="field" ${dis}><span class="lbl">What</span>${what.map(([k, l]) => `<label class="inline-t"><input type="checkbox" data-bgk="${k}" ${c[k] ? "checked" : ""}> ${l}</label>`).join("")}</div>
    <p class="hint" style="margin:0">${bgSt.last_run ? `Last check: ${esc(bgSt.last_run)} · ${esc(bgSt.last_text || "")}` : c.on ? "The first check runs within 10 minutes after you log in, then on schedule." : "It uses a systemd timer of your own user, no password needed. While Emu Vault is open, the window does these checks itself."}</p></div>`;
}
if (typeof SET_SUB !== "undefined") SET_SUB["While Emu Vault is closed"] = () => bgSt && bgSt.cfg && bgSt.cfg.on ? `On · every ${bgSt.cfg.hours} hours` : "Off";
async function setBg(ch){
  if (!bgSt || bgBusy) return; bgBusy = true; const cfg = { ...bgSt.cfg, ...ch };
  try { bgSt = await inv("bg_set", { bg: cfg }); toast(cfg.on ? `Checks while Emu Vault is closed: every ${cfg.hours} hours` : "Checks while Emu Vault is closed: off"); } catch (e) { toast(errMsg(e)); await loadBg(); }
  bgBusy = false; renderSet();
}
document.addEventListener("change", e => {
  const c = e.target; if (!c || !c.dataset) return;
  if (c.dataset.bgon) setBg({ on: c.checked }); else if (c.dataset.bgk) setBg({ [c.dataset.bgk]: c.checked });
});
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-bgh]"); if (b) setBg({ hours: +b.dataset.bgh }); });
// ===================================================================== RetroAchievements (cartridge systems; disc systems later)
let raRes = null, raRun = null, raAcct = { user: "", key: "", edit: false }, raErr = "", raLoaded = false;
async function raInit(){ raLoaded = true; try { raRes = await inv("ra_last"); } catch (e) {} const c = (OV && OV.config) || {}; raAcct.user = c.ra_user || ""; raAcct.key = c.ra_key || ""; renderRoms(); }
const RA_ST = { ok: ["ok", "supported"], noset: ["plat", "no achievements yet"], other: ["warn", "other version"], no: ["bad", "not recognized"], disc: ["plat", "comes later"], none: ["plat", "not on RetroAchievements"] };
let raNow = "";
raToolHTML = function(){
  if (!raLoaded && T) raInit();
  const has = !!raAcct.key && !raAcct.edit;
  let h = `<div class="sys-block tool" id="ra-tool" style="margin-top:12px"><header><div><h3>RetroAchievements</h3><div class="used">Which of your ROMs work with achievements</div></div>${raRes ? `<span class="pill ok">${nl(raRes.rows.filter(r => r.status === "ok").length)} supported</span>` : ""}</header>`;
  if (!has){
    h += `<p class="hint" style="margin:0">Achievements only work with specific versions of a game. Emu Vault makes the same fingerprint RetroArch makes and looks it up on RetroAchievements. For that it needs your account: a free account on <a href="https://retroachievements.org" target="_blank" rel="noopener">retroachievements.org</a>, then Settings › Keys › Web API key.</p>
      <div class="q"><label for="ra-user">RetroAchievements user name</label><input type="text" id="ra-user" autocomplete="username" value="${esc(raAcct.user)}"></div>
      <div class="q"><label for="ra-key">Web API key</label><input type="password" id="ra-key" autocomplete="off" value="${esc(raAcct.key)}"></div>
      ${raErr ? `<div class="err" role="alert">${esc(raErr)}</div>` : ""}
      <div class="gact"><button class="btn small primary" data-rasave="1">Save and check</button>${raAcct.edit ? `<button class="btn small" data-racancel="1">Cancel</button>` : ""}</div>
      <p class="hint" style="margin:0">The key stays on this computer, in Emu Vault's settings.</p></div>`;
    return h;
  }
  if (raRun) return h + `<p class="hint" style="margin:0">Checking ${nl(raRun.done)} of ${nl(raRun.total)}…</p><div class="prog"><i style="width:${raRun.total ? raRun.done / raRun.total * 100 : 0}%"></i></div></div>`;
  if (!raRes) return h + `${raErr ? `<div class="err" role="alert">${esc(raErr)}</div>` : ""}<div class="gact"><button class="btn small primary" id="ra-run2" data-rarun="1">Check my ROMs</button><button class="linkbtn" data-raedit="1">Account: ${esc(raAcct.user || "set")}</button></div></div>`;
  const rows = raRes.rows, cnt = k => rows.filter(r => r.status === k).length;
  const show = rows.filter(r => r.status === "other" || r.status === "no").slice(0, 200);
  h += `<div class="nums vnums"><div><b>${nl(cnt("ok"))}</b>supported</div><div><b>${nl(cnt("other"))}</b>other version needed</div><div><b>${nl(cnt("no"))}</b>not recognized</div><div><b>${nl(cnt("noset"))}</b>no achievements yet</div><div><b>${nl(cnt("disc") + cnt("none"))}</b>not checked</div></div>
    <p class="hint" style="margin:0">PlayStation, PS2, Saturn and Sega CD discs are read too: the first time takes some seconds per disc (a .chd is unpacked for a moment), after that it's remembered.${cnt("disc") ? " Dreamcast, PSP, DS, GameCube and Wii come later." : ""}</p>
    ${show.length ? `<details class="codes"><summary>What needs another version · ${nl(cnt("other") + cnt("no"))}</summary><div class="files">${show.map(r => { const [c, l] = RA_ST[r.status]; return `<div class="frow"><span class="ck ${c}">${r.status === "no" ? "✗" : "!"}</span><div><div class="fn">${esc(r.name)}</div><div class="note">roms/${esc(r.sys)}/ · ${r.status === "other" ? `RetroAchievements has <b>${esc(r.game)}</b> (${r.achievements} achievements), but for another version of the file.${r.game_id ? ` <a href="https://retroachievements.org/game/${r.game_id}/hashes" target="_blank" rel="noopener">Which versions</a>` : ""}` : "This file isn't known to RetroAchievements. Often a hack, a translation, or a bad dump."}</div></div><span class="pill ${c}">${l}</span></div>`; }).join("")}</div></details>` : ""}
    <p class="hint" style="margin:0">Checked ${esc(raRes.checked || "")}.</p>
    ${raErr ? `<div class="err" role="alert">${esc(raErr)}</div>` : ""}
    <div class="gact"><button class="btn small" data-rarun="1">Check again</button><button class="linkbtn" data-raedit="1">Account: ${esc(raAcct.user)}</button><a class="linkbtn" href="https://retroachievements.org" target="_blank" rel="noopener" style="align-self:center">retroachievements.org</a></div></div>`;
  return h;
};
async function raCheck(fresh){
  if (raRun) return; raErr = ""; raRun = { done: 0, total: S.romFiles.length }; renderRoms();
  try { raRes = await inv("ra_check", { fresh: !!fresh }); const ok = raRes.rows.filter(r => r.status === "ok").length; log(`RetroAchievements: ${ok} of ${raRes.rows.length} games supported`); toast(`${nl(ok)} of your games work with achievements`); }
  catch (e) { raErr = errMsg(e); }
  raRun = null; renderRoms();
}
if (T) T.event.listen("ra-progress", e => { if (raRun){ const [d, n] = e.payload; raRun.done = d; raRun.total = n; if (activeTab?.() === "roms") renderRoms(); } });
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-rasave],[data-racancel],[data-raedit],[data-rarun],#ra-run"); if (!b) return;
  if (b.dataset.raedit){ raAcct.edit = true; renderRoms(); return; }
  if (b.dataset.racancel){ raAcct.edit = false; raErr = ""; renderRoms(); return; }
  if (b.dataset.rasave){
    const u = ($("#ra-user") || {}).value || "", k = ($("#ra-key") || {}).value || "";
    if (!u.trim() || !k.trim()){ raErr = "Fill in both: your user name and your Web API key."; renderRoms(); return; }
    try { await inv("ra_account", { user: u, key: k }); raAcct = { user: u.trim(), key: k.trim(), edit: false }; if (OV && OV.config){ OV.config.ra_user = raAcct.user; OV.config.ra_key = raAcct.key; } raErr = ""; } catch (err) { raErr = errMsg(err); renderRoms(); return; }
    return raCheck(true);
  }
  if (b.dataset.rarun || b.id === "ra-run"){ e.stopImmediatePropagation(); raCheck(!!raRes); }
}, true);
function mergeUI(o){ for (const k of Object.keys(o)) if (o[k] !== undefined) UI[k] = o[k]; lastSaved = ""; saveState(); }
// ===================================================================== Settings › Games in other folders (read where they are, never moved)
function extraHTML(){
  const list = ((OV && OV.config && OV.config.extra_dirs) || []);
  const systems = (typeof GAMEINDEX !== "undefined" ? GAMEINDEX.filter(i => i.kind !== "dl") : []).sort((a, b) => sysLabel(a).localeCompare(sysLabel(b)));
  return `<div class="form set-sec" id="extra-sec"><h2>Games in other folders</h2>
    <p class="hint" style="margin:0">For games you keep somewhere else, like a second drive. Emu Vault reads them where they are: they count in Collection, Duplicates, Box art and RetroAchievements, but nothing is moved into your main folder. What you clean up there goes to a <span class="mono">_duplicates</span> folder next to them.</p>
    ${list.length ? `<div class="files">${list.map((d, i) => `<div class="frow" style="flex-wrap:wrap;gap:8px"><span class="dot on"></span><div style="flex:1 1 200px;min-width:0"><div class="fn mono" style="overflow-wrap:anywhere">${esc(d.path)}</div></div>
      <select data-extrasys="${i}" aria-label="System for ${esc(d.path)}" style="max-width:220px;min-width:0">${systems.map(s => `<option value="${s.id}" ${s.id === d.sys ? "selected" : ""}>${esc(sysLabel(s))}</option>`).join("")}</select>
      <button class="linkbtn" data-extradel="${i}">Remove</button></div>`).join("")}</div>` : ""}
    <div class="gact"><button class="btn small" data-extraadd="1">Add a folder…</button></div>
    <p class="hint" style="margin:0">Pick a folder with the games of one system, for example <span class="mono">/media/drive/snes</span>. Emu Vault guesses the system from the folder name; change it if needed.</p></div>`;
}
async function saveExtra(list){
  try { OV = await inv("save_settings", { cfg: { ...OV.config, extra_dirs: list } }); } catch (e) { toast(errMsg(e)); return; }
  toast("Reading your folders…"); await load(true); renderAll(); renderHome(); renderStrip();
}
document.addEventListener("click", async e => {
  const a = e.target.closest && e.target.closest("[data-extraadd],[data-extradel]"); if (!a) return;
  const list = [...((OV && OV.config && OV.config.extra_dirs) || [])];
  if (a.dataset.extradel !== undefined){ const d = list.splice(+a.dataset.extradel, 1)[0]; log(`Games in other folders: ${d.path} removed (the files stay where they are)`); return saveExtra(list); }
  let p = null; try { p = await T.dialog.open({ directory: true, title: "A folder with games of one system" }); } catch (err) {}
  if (!p) return;
  if (ROOT && (p + "/").startsWith(ROOT + "/")) return toast("That folder is inside your main folder already.");
  if (list.some(d => d.path === p)) return toast("That folder is in the list already.");
  const name = baseOf(p.replace(/\/+$/, "")), sys = (typeof GI !== "undefined" && GI[name.toLowerCase()]) ? name.toLowerCase() : (matchSystem(name) || "");
  list.push({ path: p, sys: sys || "snes" });
  log(`Games in other folders: ${p} added${sys ? ` as ${sysName(sys)}` : ""}`);
  if (!sys) toast("Choose the system of this folder in the list");
  saveExtra(list);
});
document.addEventListener("change", e => {
  const s = e.target; if (!s || !s.dataset || s.dataset.extrasys === undefined) return;
  const list = [...((OV && OV.config && OV.config.extra_dirs) || [])]; list[+s.dataset.extrasys] = { ...list[+s.dataset.extrasys], sys: s.value }; saveExtra(list);
});
if (typeof SET_SUB !== "undefined") SET_SUB["Games in other folders"] = () => { const n = ((OV && OV.config && OV.config.extra_dirs) || []).length; return n ? `${n} folder${n === 1 ? "" : "s"}` : "None"; };
// ===================================================================== newer game lists (No-Intro / Redump from libretro-database)
let listsWhen = null, listsRun = null;
let discRes = undefined, discRun = null;
function discHTML(){
  if (discRes === undefined && T){ discRes = null; inv("discs_last").then(r => { discRes = r || null; renderRoms(); }).catch(() => {}); }
  const has = S.romFiles.some(f => /\.(chd|cue|iso)$/i.test(f.name) && ["psx", "ps2", "saturn", "segacd", "dreamcast", "pcenginecd", "3do", "gc", "wii", "psp", "neogeocd", "pcfx"].includes(f.sys));
  if (!has) return "";
  let h = `<div class="ib-have" style="margin-top:4px"><span><b>Disc games</b> (.chd, .cue/.bin, .iso): every track is compared with Redump. ${discRun ? `Checking ${nl(discRun.i)} of ${nl(discRun.n)}${discRun.name ? ` · ${esc(discRun.name)}` : ""}…` : "A .chd is unpacked for a moment for this, so it takes some seconds per disc the first time; after that it's remembered."}</span><button class="btn small" data-discchk="1" ${discRun ? "disabled" : ""}>${discRun ? "Checking…" : discRes ? "Check disc games again" : "Check disc games"}</button></div>`;
  if (discRun) h += `<div class="prog"><i style="width:${discRun.n ? discRun.i / discRun.n * 100 : 2}%"></i></div>`;
  if (discRes && !discRun){
    const c = k => discRes.filter(r => r.status === k).length;
    h += `<div class="nums vnums"><div><b>${nl(c("good"))}</b>match Redump</div><div><b>${nl(c("partly"))}</b>partly</div><div><b>${nl(c("unknown"))}</b>not in Redump</div><div><b>${nl(c("error"))}</b>couldn't be read</div></div>`;
    const bad = discRes.filter(r => r.status !== "good");
    if (bad.length) h += `<details class="codes"><summary>Which discs · ${nl(bad.length)}</summary><div class="files">${bad.slice(0, 300).map(r => `<div class="frow"><span class="ck ${r.status === "partly" ? "warn" : "bad"}">${r.status === "partly" ? "!" : "✗"}</span><div style="min-width:0"><div class="fn" style="overflow-wrap:anywhere">${esc(r.name)}</div><div class="note">roms/${esc(r.sys)}/ · ${esc(r.note)}${r.redump ? ` · Redump: <span class="mono">${esc(r.redump)}</span>` : ""}</div></div></div>`).join("")}</div></details>`;
  }
  return h;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-discchk]"); if (!b || discRun) return;
  discRun = { i: 0, n: 1, name: "" }; renderRoms();
  try { discRes = await inv("discs_check"); const g = discRes.filter(r => r.status === "good").length; log(`Disc games checked: ${g} of ${discRes.length} match Redump`); toast(`${nl(g)} of ${nl(discRes.length)} disc games match Redump`); } catch (err) { toast(errMsg(err)); }
  discRun = null; renderRoms();
});
if (T) T.event.listen("discs-progress", e => { if (discRun){ const [i, n, name] = e.payload; discRun = { i, n, name }; if (activeTab?.() === "roms") renderRoms(); } });
function listsHTML(){
  if (listsWhen === null && T){ listsWhen = ""; inv("lists_info").then(w => { listsWhen = w || ""; renderRoms(); }).catch(() => {}); }
  return discHTML() + `<div class="ib-have" style="margin-top:4px"><span>${listsRun ? `Updating the game lists… ${listsRun.i} of ${listsRun.n}` : listsWhen ? `Game lists updated ${esc(listsWhen)}.` : "Game lists from this version of Emu Vault."} New dumps and corrections appear in No-Intro and Redump every week.</span><button class="btn small" data-listsup="1" ${listsRun ? "disabled" : ""}>${listsRun ? "Updating…" : "Update the game lists"}</button></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-listsup]"); if (!b || listsRun) return;
  listsRun = { i: 0, n: 1 }; renderRoms();
  try {
    const r = await inv("lists_update");
    listsWhen = r.when;
    for (const k of Object.keys(LISTS)) delete LISTS[k];
    for (const k of Object.keys(LOADING)) delete LOADING[k];
    log(`Game lists updated for ${r.systems} systems${r.failed.length ? ` (not found: ${r.failed.join(", ")})` : ""}`);
    toast(`Game lists updated for ${r.systems} system${r.systems === 1 ? "" : "s"}. Collection uses them now; checking files uses them after you restart Emu Vault.`);
  } catch (err) { toast(errMsg(err)); }
  listsRun = null; renderRoms(); renderColl();
});
if (T) T.event.listen("lists-progress", e => { if (listsRun){ const [i, n] = e.payload; listsRun = { i, n }; renderRoms(); } });
// Collection lists: a newer downloaded one first, else the one that came with the app
if (T && typeof loadList === "function"){
  const _ll = loadList;
  loadList = function(id){
    if (LISTS[id]) return Promise.resolve(LISTS[id]);
    if (!LOADING[id]) LOADING[id] = inv("list_override", { sys: id }).then(j => { if (j){ LISTS[id] = JSON.parse(j); return LISTS[id]; } delete LOADING[id]; return _ll(id); }).catch(() => { delete LOADING[id]; return _ll(id); });
    return LOADING[id];
  };
}
// ===================================================================== ES-DE with everything set up
let esSt = null, esBusy = "";
async function loadEs(){ try { esSt = await inv("esde_status"); } catch (e) { esSt = { how: "" }; } renderRoms(); renderHome(); }
function esdeHTML(){
  if (!esSt){ if (T){ esSt = { loading: true, how: "" }; loadEs(); } else esSt = { how: "" }; }
  const s = esSt, have = !!s.how, ck = (ok, t, sub) => `<div class="crow2"><span class="ck ${ok ? "ok" : "warn"}">${ok ? "✓" : "!"}</span><span><b>${t}</b>${sub ? `<br><span class="muted" style="font-size:12.5px">${sub}</span>` : ""}</span></div>`;
  const busy = esBusy ? "disabled" : "";
  return `<div class="esde-card">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><div class="fn">ES-DE</div><div class="note">The frontend for all your emulators: your games with covers, videos and descriptions, in one menu.</div></div>
      <div class="gact" style="margin:0">${have ? `<button class="btn small primary" data-esgo="start" ${busy || (s.running ? "disabled" : "")}>${s.running ? "ES-DE is running" : "Start ES-DE"}</button>` : `<button class="btn small primary" data-esgo="download" ${busy}>${esBusy === "download" ? "Downloading ES-DE…" : "Download ES-DE"}</button>`}</div></div>
    <div class="checks">
      ${ck(have && !s.update, have ? (s.update ? `ES-DE ${esc(s.update)} is available` : `ES-DE is on this computer`) : `ES-DE isn't on this computer yet`, have ? `${esc(s.how)}${s.version ? ` · version ${esc(s.version)}` : ""} · <button class="linkbtn" data-esgo="${s.update ? "download" : "check"}" ${busy}>${esBusy === "download" ? "Updating…" : esBusy === "check" ? "Checking…" : s.update ? `Update to ${esc(s.update)}` : s.managed ? "Check for a new version" : "Let Emu Vault download and update it"}</button>${s.managed ? " · the version before stays, to go back" : ""}` : "Emu Vault downloads it (free, from ES-DE's GitLab) and keeps it up to date with your other apps.")}
      ${ck(!!s.roms_ok, "Your games come from your main folder", s.roms_ok ? `<span class="mono">${esc(s.rom_dir)}</span>` : s.rom_dir ? `ES-DE now looks in <span class="mono">${esc(s.rom_dir)}</span>` : `ES-DE doesn't know <span class="mono">${esc(ROOT)}/roms</span> yet`)}
      ${ck(!!s.media_ok, "Covers and videos are shared with Emu Vault", s.media_ok ? `<span class="mono">${esc(s.media_dir)}</span>: what Emu Vault downloads, ES-DE shows, and the other way round` : `ES-DE keeps its own media folder now`)}
      ${ck(true, s.in_vault ? "ES-DE's settings, game lists and favourites are in the vault" : "ES-DE's settings and game lists are on this computer", `${s.esde_dir ? `<span class="mono">${esc(s.esde_dir)}</span> · ` : ""}<button class="linkbtn" data-eswhere="${s.in_vault ? "pc" : "vault"}" ${busy}>${s.in_vault ? "Keep them on this computer instead" : "Put them in the vault"}</button>${s.pc_data ? `<br>What ES-DE knows on this computer (~/ES-DE: favourites, play time, collections, themes) is copied into the vault when you press Set up. ~/ES-DE itself stays as it is.` : ""}`)}
      ${ck((s.gamelists || 0) > 0, "Game lists with the official names", s.gamelists ? `${s.gamelists} system${s.gamelists === 1 ? "" : "s"}; favourites and play time in ES-DE stay` : "Not written yet")}
    </div>
    ${s.roms_ok && s.media_ok && s.gamelists && !s.pc_data ? `<div class="gact"><button class="btn small" data-esgo="setup" ${busy}>${esBusy === "setup" ? "Updating…" : "Update game lists"}</button></div>` : `<div class="gact"><button class="btn small ${have ? "primary" : ""}" data-esgo="setup" ${busy}>${esBusy === "setup" ? "Setting up…" : "Set up ES-DE"}</button></div>
    <p class="hint" style="margin:0">Sets ES-DE's ROM folder and media folder to your main folder and writes the game lists. ${s.running ? "<b>Close ES-DE first.</b> " : ""}A copy of ES-DE's settings is kept.</p>`}
    <details class="codes"><summary>Scraping in ES-DE</summary><p class="hint" style="margin:8px 0 0">ES-DE has its own scraper: Main menu › Scraper. It gets videos, 3D boxes, marquees, descriptions and ratings from ScreenScraper (a free ScreenScraper account makes it faster). Because ES-DE and Emu Vault share <span class="mono">${esc(ROOT)}/media</span>, everything ES-DE scrapes shows up in Emu Vault too, and covers Emu Vault downloads show up in ES-DE.</p></details>
  </div>`;
}
document.addEventListener("click", async e => {
  const w = e.target.closest && e.target.closest("[data-eswhere]");
  if (w && !esBusy){ try { await inv("esde_where", { vault: w.dataset.eswhere === "vault" }); toast(w.dataset.eswhere === "vault" ? "ES-DE will keep its things in the vault. Press Set up ES-DE." : "ES-DE will keep its things on this computer (~/ES-DE)"); } catch (err) { toast(errMsg(err)); } return loadEs(); }
  const b = e.target.closest && e.target.closest("[data-esgo]"); if (!b || esBusy) return;
  const what = b.dataset.esgo;
  if (what === "start"){ try { await inv("esde_start"); toast("ES-DE is starting…"); setTimeout(loadEs, 4000); } catch (err) { toast(errMsg(err)); } return; }
  esBusy = what; renderRoms();
  try {
    if (what === "check"){
      OV = await inv("set_enabled", { ids: ["pc.esde"], on: true });
      OV = await inv("check_apps", { ids: ["pc.esde"] });
      const st = await inv("esde_status");
      if (st.update) toast(`ES-DE ${st.update} is available`); else if (st.managed) toast("ES-DE is up to date"); else { OV = await inv("download_app", { id: "pc.esde", plat: "linux" }); toast("ES-DE is downloaded; Emu Vault keeps it up to date from now on"); }
      EVA.refresh?.();
    } else if (what === "download"){
      OV = await inv("set_enabled", { ids: ["pc.esde"], on: true });
      OV = await inv("check_apps", { ids: ["pc.esde"] });
      OV = await inv("download_app", { id: "pc.esde", plat: "linux" });
      const st = await inv("esde_status"); toast(st.version ? `ES-DE ${st.version} is ready` : "ES-DE is downloaded"); log(`ES-DE downloaded${st.version ? ` (${st.version})` : ""}`);
      EVA.refresh?.();
    } else {
      await sync();
      await inv("esde_setup"); S.tools.fe.esde = true;
      toast("ES-DE is set up: your games, covers and game lists"); log("ES-DE set up");
    }
  } catch (err) { toast(errMsg(err)); }
  esBusy = ""; await loadEs();
});
window.addEventListener("focus", () => { if (esSt && !esSt.loading) loadEs(); });
function esdePill(){ const s = esSt || {}; if (!s.how) return `<span class="pill warn">not set up</span>`; return s.roms_ok && s.media_ok ? `<span class="pill ok">ready</span>` : `<span class="pill warn">set up</span>`; }
// Home: ES-DE one press away
function esdeHomeBtn(){
  if (!esSt){ if (T){ esSt = { loading: true, how: "" }; loadEs(); } return ""; }
  if (!raSt && T){ raSt = { loading: true, cores: [] }; loadRa(); }
  const ra = raSt && raSt.installed ? `<button class="btn small" data-ragx="start">▶ RetroArch</button>` : "";
  if (!esSt.how) return `${ra}<button class="btn small" data-eshome="1">Get ES-DE</button>`;
  return `${ra}${esSt.update ? `<button class="btn small" data-esgo="download">Update ES-DE to ${esc(esSt.update)}</button>` : ""}<button class="btn small primary" data-esgo="start" ${esSt.running ? "disabled" : ""}>${esSt.running ? "ES-DE is running" : "▶ Start ES-DE"}</button>`;
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-eshome]"); if (!b) return; go("roms", () => { S.romView = "tools"; S.ui.open.add("blk:esde-tool"); renderRoms(); setTimeout(() => $("#esde-tool")?.scrollIntoView({ block: "start" }), 30); }); });
// ===================================================================== RetroArch in the vault
let raSt = null, raBusy = "", raDl = null;
async function loadRa(){ try { raSt = await inv("rarch_status"); } catch (e) { raSt = { installed: false, cores: [] }; } renderRoms(); renderHome(); }
function rarchPill(){ const s = raSt || {}; if (!s.installed) return `<span class="pill warn">not in the vault</span>`; const miss = (s.cores || []).filter(c => !c.have).length; return miss ? `<span class="pill warn">${miss} core${miss === 1 ? "" : "s"} to add</span>` : `<span class="pill ok">ready</span>`; }
function rarchHTML(){
  if (!raSt){ if (T){ raSt = { loading: true, cores: [] }; loadRa(); } else raSt = { cores: [] }; }
  const s = raSt, busy = raBusy ? "disabled" : "", ck = (ok, t, sub) => `<div class="crow2"><span class="ck ${ok ? "ok" : "warn"}">${ok ? "✓" : "!"}</span><span><b>${t}</b>${sub ? `<br><span class="muted" style="font-size:12.5px">${sub}</span>` : ""}</span></div>`;
  const miss = (s.cores || []).filter(c => !c.have), upd = s.installed && s.latest && s.version && s.latest !== s.version;
  let h = `<div class="esde-card">`;
  if (raDl) h += `<p class="hint" style="margin:0">${esc(raDl.what)}${raDl.total ? ` · ${Math.round(raDl.got / 1048576)} of ${Math.round(raDl.total / 1048576)} MB` : raDl.got ? ` · ${Math.round(raDl.got / 1048576)} MB` : "…"}</p><div class="prog"><i style="width:${raDl.total ? raDl.got / raDl.total * 100 : 30}%"></i></div>`;
  h += `<div class="checks">
    ${ck(!!s.installed && !upd, s.installed ? (upd ? `RetroArch ${esc(s.latest)} is available` : `RetroArch ${esc(s.version)} is in the vault`) : "RetroArch isn't in the vault yet", s.installed ? `<span class="mono">${esc(s.dir || "")}</span> · <button class="linkbtn" data-ragx="${upd ? "install" : "check"}" ${busy}>${raBusy === "install" ? "Downloading…" : raBusy === "check" ? "Checking…" : upd ? `Update to ${esc(s.latest)}` : "Check for a new version"}</button> · the version before stays` : `About 190 MB, from libretro's download server (buildbot), free and open source.${s.other ? ` RetroArch is on this computer too (${esc(s.other)}); the vault version is separate and goes along with the vault.` : ""}`)}
    ${s.installed ? ck(!miss.length, miss.length ? `${miss.length} core${miss.length === 1 ? "" : "s"} still to add` : "A core for each of your systems", (s.cores || []).map(c => `${c.have ? "✓" : "·"} ${esc(c.name)} <span class="muted">(${c.systems.map(esc).join(", ")})</span>`).join("<br>") || "No systems with games yet") : ""}
    ${s.installed ? ck(true, "Settings, saves and states stay in the vault", `RetroArch/home · saves are in Backups too`) : ""}
    ${s.installed ? ck((s.bios_links || 0) > 0, s.bios_links ? `${s.bios_links} BIOS file${s.bios_links === 1 ? "" : "s"} linked for RetroArch` : "No BIOS files linked yet", "Links in RetroArch's system folder to your bios/ files: no extra space; new BIOS files are linked when you press Set up again") : ""}
    ${s.installed ? ck(!!s.esde_linked, s.esde_linked ? "ES-DE starts this RetroArch" : "ES-DE doesn't know this RetroArch yet", "Choosing a game in ES-DE starts RetroArch from the vault with the right core") : ""}
  </div><div class="gact">`;
  if (!s.installed) h += `<button class="btn small primary" data-ragx="install" ${busy}>${raBusy === "install" ? "Getting RetroArch…" : "Get RetroArch"}</button>`;
  else {
    if (miss.length) h += `<button class="btn small primary" data-ragx="cores" ${busy}>${raBusy === "cores" ? "Adding cores…" : `Add ${miss.length} core${miss.length === 1 ? "" : "s"}`}</button>`;
    h += `<button class="btn small" data-ragx="setup" ${busy}>${raBusy === "setup" ? "Setting up…" : "Set up again (BIOS links, ES-DE)"}</button><button class="btn small ${miss.length ? "" : "primary"}" data-ragx="start" ${busy}>▶ Start RetroArch</button>`;
  }
  return h + `</div></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-ragx]"); if (!b || raBusy) return;
  const w = b.dataset.ragx;
  if (w === "start"){ try { await inv("rarch_start"); toast("RetroArch is starting…"); } catch (err) { toast(errMsg(err)); } return; }
  raBusy = w; renderRoms();
  try {
    if (w === "check"){ const v = await inv("rarch_check"); toast(raSt && raSt.version === v ? `RetroArch ${v} is the newest` : `RetroArch ${v} is available`); }
    else if (w === "install"){ const v = await inv("rarch_install"); raDl = null; toast(`RetroArch ${v} is in the vault`); log(`RetroArch ${v} downloaded into the vault`); await loadRa(); if ((raSt.cores || []).some(c => !c.have)){ raBusy = "cores"; renderRoms(); const n = await inv("rarch_cores"); toast(`RetroArch is ready: ${n} core${n === 1 ? "" : "s"} added`); } }
    else if (w === "cores"){ const n = await inv("rarch_cores"); toast(`${n} core${n === 1 ? "" : "s"} added`); }
    else if (w === "setup"){ const n = await inv("rarch_setup"); toast(`RetroArch set up: ${n} BIOS file${n === 1 ? "" : "s"} linked, ES-DE knows it`); }
  } catch (err) { toast(errMsg(err)); }
  raBusy = ""; raDl = null; await loadRa(); loadPlay();
});
if (T) T.event.listen("ra-dl", e => { if (raBusy){ const [what, got, total] = e.payload; raDl = { what, got, total }; if (activeTab?.() === "roms") renderRoms(); } });
// ===================================================================== Duplicates: "these are the discs of one game"
const DISC_SYSTEMS = new Set(["psx", "ps2", "saturn", "segacd", "dreamcast", "pcenginecd", "3do", "neogeocd", "pcfx", "gc", "wii", "psp", "xbox", "jaguarcd", "cdi", "amigacd32"]);
const discPick = {};
const discBase = n => n.replace(/\.[^.]+$/, "").replace(/\s*\((\d{1,2})\)$/, "").trim();
function discCandidates(g){
  if (!DISC_SYSTEMS.has(g.sys) || g.kind === "maybe" || g.variants.length < 2 || g.variants.length > 8) return null;
  const files = g.variants.map(v => v.files.length === 1 && !(v.discs > 1) ? v.files[0] : null);
  if (files.some(f => !f) || files.some(f => /\((disc|disk|cd)\s*\d/i.test(f.name))) return null;
  const base = discBase(files[0].name);
  if (!files.every(f => discBase(f.name) === base)) return null;
  const mbs = files.map(f => Math.round(f.mb || 0));
  if (new Set(mbs).size !== mbs.length) return null;      // two the same size: real copies
  return files.slice().sort((a, b) => { const n = x => +((x.name.replace(/\.[^.]+$/, "").match(/\((\d{1,2})\)$/) || [0, 1])[1]); return n(a) - n(b); });
}
function discHint(g){
  const files = discCandidates(g); if (!files) return "";
  const pick = discPick[g.key] ||= Object.fromEntries(files.map((f, i) => [f.id, i + 1]));
  const n = files.length, ext = f => (f.name.match(/\.[^.]+$/) || [""])[0];
  return `<div class="verdict warn" style="margin:6px 0"><b>Are these the ${n} discs of one game?</b> They have different sizes but the names don't say "Disc 1", "Disc 2"…, so they look like copies. Name them as discs: then they count as one game, leave Duplicates, and you can combine them under Tools › Multi-disc games.
    <div class="files" style="margin-top:6px">${files.map(f => `<div class="frow" style="flex-wrap:wrap;gap:8px"><div style="flex:1 1 220px;min-width:0"><div class="fn" style="overflow-wrap:anywhere">${esc(f.name)}</div><div class="note">${size(Math.max(1, Math.round(f.mb)))} → <span class="mono">${esc(discBase(f.name))} (Disc ${pick[f.id]})${esc(ext(f))}</span></div></div>
      <select data-discsel="${esc(g.key)}" data-f="${esc(f.id)}" aria-label="Disc number of ${esc(f.name)}">${files.map((_, i) => `<option value="${i + 1}" ${pick[f.id] === i + 1 ? "selected" : ""}>Disc ${i + 1}</option>`).join("")}</select></div>`).join("")}</div>
    <div class="gact"><button class="btn small" data-discname="${esc(g.key)}">Name them Disc 1–${n}</button></div>
    <p class="hint" style="margin:0">Not sure which disc is which? Start each one: the game shows its disc number, or check the disc labels on Redump.org.</p></div>`;
}
document.addEventListener("change", e => {
  const s = e.target; if (!s || !s.dataset || !s.dataset.discsel) return;
  (discPick[s.dataset.discsel] ||= {})[s.dataset.f] = +s.value; renderRoms();
});
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-discname]"); if (!b) return;
  const key = b.dataset.discname, pick = discPick[key] || {};
  const nums = Object.values(pick); if (new Set(nums).size !== nums.length){ toast("Every file needs its own disc number"); return; }
  let n = 0;
  for (const [id, d] of Object.entries(pick)){
    const f = S.romFiles.find(x => x.id === id); if (!f) continue;
    const ext = (f.name.match(/\.[^.]+$/) || [""])[0];
    f.name = `${discBase(f.name)} (Disc ${d})${ext}`; n++;
  }
  delete discPick[key];
  log(`${n} files named as discs: ${S.romFiles.find(x => pick[x.id])?.name.replace(/ \(Disc \d+\).*$/, "") || ""}`);
  await sync(); await load(false); renderRoms(); renderColl(); renderStrip();
  toast(`Named as Disc 1–${n}. Combine them under Tools › Multi-disc games to show one game in ES-DE.`);
});
// ===================================================================== Ready to play: per system, and what plays it
let playOpts = null, vemus = null, vemuBusy = "";
let playAsked = null;
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-ragain]"); if (!b) return;
  e.preventDefault(); const c = b.dataset.ragain; b.disabled = true; b.textContent = "…";
  toast(`Getting the ${c} core again…`);
  try { await inv("rarch_core_again", { name: c }); toast(`The ${c} core is fresh. Try the game again.`); } catch (err) { toast(errMsg(err)); }
  await loadPlay();
});
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-playagain]"); if (!b) return; e.preventDefault(); b.disabled = true; b.textContent = "Looking…"; loadPlay().then(() => { const n = (playOpts || []).length; toast(n ? `Emulators known for ${n} system${n === 1 ? "" : "s"}` : "Still no emulator known. Is RetroArch in the vault? Roms › Tools › RetroArch."); }); });
const playKey = () => [...new Set(S.romFiles.map(f => f.sys))].sort().join(",");
async function loadPlay(){ playAsked = playKey(); try { playOpts = await inv("play_options"); } catch (e) { playOpts = []; log("Couldn't read which emulators play your systems: " + errMsg(e)); } try { vemus = await inv("vault_emus"); } catch (e) { vemus = []; } renderRoms(); }
function readyHTML(){
  // ask again when your systems changed since the last time (the first ask can come before the folders are read)
  if (T && (playOpts === null || playAsked !== playKey())){ if (playOpts === null) playOpts = []; if (playAsked !== playKey()) loadPlay(); }
  const systems = [...new Set(S.romFiles.map(f => f.sys))].sort((a, b) => sysName(a).localeCompare(sysName(b)));
  if (!systems.length) return "";
  const es = esSt || {}, esOk = !!es.how && es.roms_ok;
  const rows = systems.map(s => {
    const files = S.romFiles.filter(f => f.sys === s), n = files.length;
    const bs = typeof biosState === "function" ? biosState(s) : { k: "none" };
    const biosOk = !bs || ["none", "ready", "opt", "game"].includes(bs.k);
    const po = (playOpts || []).find(p => p.sys === s);
    const cur = po && po.options.find(o => o[0] === po.choice);
    const playOk = !!(cur && cur[2]);
    const withCov = files.filter(f => S.art.got.has(f.id)).length, covOk = withCov >= n;
    const ck = (ok, t) => `<span class="rdy ${ok ? "ok" : "no"}" title="${esc(t)}">${ok ? "✓" : "!"}</span>`;
    const all = n && biosOk && playOk && esOk;
    return `<div class="rdy-row ${all ? "all" : ""}"><div class="rdy-name"><b>${esc(sysName(s))}</b><span class="muted">${nl(n)} game${n === 1 ? "" : "s"}</span></div>
      <div class="rdy-cells">
        <span>${ck(biosOk, "BIOS")} BIOS${!biosOk ? ` <button class="linkbtn" data-rdgo="bios" title="${esc(bs.label || "missing")}">${esc(bs.missing ? `${bs.missing} to collect` : (bs.label || "missing"))}</button>` : ""}</span>
        <span class="rdy-play">${ck(playOk, "Emulator")} ${po ? `<select data-playwith="${esc(s)}" aria-label="What plays ${esc(sysName(s))}">${po.options.map(o => `<option value="${esc(o[0])}" ${o[0] === po.choice ? "selected" : ""}>${esc(o[1])}${o[2] ? "" : " · not there yet"}</option>`).join("")}</select>${po.choice.startsWith("ra:") && (po.options.find(o => o[0] === po.choice) || [])[2] ? `<button class="linkbtn" data-ragain="${esc(po.choice.slice(3))}" title="Download this core again (if it crashes)">↻</button>` : ""}` : `<span class="muted">no emulator known</span> <button class="linkbtn" data-playagain="1">Look again</button>`}</span>
        <span>${ck(covOk, "Covers")} Covers ${nl(withCov)}/${nl(n)}</span>
        <span>${ck(esOk, "ES-DE")} ES-DE</span>
      </div></div>`;
  }).join("");
  const missing = (playOpts || []).filter(p => { const o = p.options.find(x => x[0] === p.choice); return o && !o[2]; });
  const nReady = systems.filter(s => { const n = S.romFiles.filter(f => f.sys === s).length; const bs = typeof biosState === "function" ? biosState(s) : { k: "none" }; const po = (playOpts || []).find(p => p.sys === s); const cur = po && po.options.find(o => o[0] === po.choice); return n && (!bs || ["none", "ready", "opt", "game"].includes(bs.k)) && cur && cur[2] && esOk; }).length;
  return `<details class="sys-block rdy-block" style="margin:10px 0" data-k="rdy" ${S.ui.open.has("rdy") ? "open" : ""}><summary style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:10px;align-items:center"><div><h3 style="margin:0">Ready to play</h3><div class="used">Per system: BIOS, emulator, covers and ES-DE. Choose what plays each system; ES-DE follows your choice.</div></div><span class="pill ${nReady === systems.length ? "ok" : "warn"}">${nReady} of ${systems.length} ready</span></summary>
    <div class="rdy-list" style="margin-top:8px">${rows}</div>
    ${missing.length ? `<div class="gact"><button class="btn small primary" data-rdfix="1" ${raBusy || vemuBusy ? "disabled" : ""}>${raBusy === "cores" ? "Adding…" : `Get what's missing (${missing.length})`}</button></div>` : ""}
    ${!esOk ? `<p class="hint" style="margin:0">ES-DE isn't set up yet: Tools › ES-DE.</p>` : ""}</details>`;
}
document.addEventListener("toggle", e => { const d = e.target; if (d && d.dataset && d.dataset.k === "rdy") d.open ? S.ui.open.add("rdy") : S.ui.open.delete("rdy"); }, true);
document.addEventListener("change", async e => {
  const s = e.target; if (!s || !s.dataset || !s.dataset.playwith) return;
  try { await inv("play_set", { sys: s.dataset.playwith, with: s.value }); toast(`${sysName(s.dataset.playwith)} plays with ${s.options[s.selectedIndex].text.replace(/ · not there yet$/, "")}`); } catch (err) { toast(errMsg(err)); }
  await loadPlay(); await loadRa();
});
document.addEventListener("click", async e => {
  const g = e.target.closest && e.target.closest("[data-rdgo]"); if (g){ go(g.dataset.rdgo); return; }
  const fx = e.target.closest && e.target.closest("[data-rdfix]");
  if (fx){
    const need = (playOpts || []).filter(p => { const o = p.options.find(x => x[0] === p.choice); return o && !o[2]; });
    const emus = [...new Set(need.filter(p => p.choice.startsWith("emu:")).map(p => p.choice.slice(4)))];
    try {
      if (need.some(p => p.choice.startsWith("ra:"))){
        if (!(raSt && raSt.installed)){ raBusy = "install"; renderRoms(); await inv("rarch_install"); }
        raBusy = "cores"; renderRoms(); await inv("rarch_cores");
      }
      for (const id of emus){ vemuBusy = id; renderRoms(); await getEmu(id); }
      toast("Everything that was missing is there now");
    } catch (err) { toast(errMsg(err)); }
    raBusy = ""; vemuBusy = ""; await loadRa(); await loadPlay(); return;
  }
  const p = e.target.closest && e.target.closest("[data-play]");
  if (p){
    const f = S.romFiles.find(x => x.id === p.dataset.play);
    if (!f || !f.loc){ toast("Emu Vault can't find this file anymore. Read the folders again (Home › Check everything)."); return; }
    toast(`Starting ${f.name}…`);
    try { await sync(); const ch = await inv("play", { path: f.loc, sys: f.sys }); log(`Play: ${f.name} with ${ch}`); } catch (err) { log("Play didn't start: " + errMsg(err)); toast(errMsg(err)); }
  }
});
if (T) T.event.listen("play-failed", e => {
  const lines = e.payload || [];
  const bios = lines.some(l => /bios|firmware|scph/i.test(l));
  log("The game didn't start: " + (lines.join(" · ") || "the emulator closed right away"));
  toast(bios ? "The game didn't start: the emulator misses a BIOS file. Check BIOS for this system, then try again." : `The game didn't start${lines.length ? ": " + lines[lines.length - 1] : ". The emulator closed right away"}. More in Activity.`);
});
// ===================================================================== Emulators in the vault (PC emulators as AppImage, settings in the vault)
async function getEmu(id){
  OV = await inv("set_enabled", { ids: [id], on: true });
  OV = await inv("check_apps", { ids: [id] });
  OV = await inv("download_app", { id, plat: "linux" });
  await inv("vault_emu_set", { id, on: true });
}
function vemuPill(){ const v = (vemus || []).filter(x => x.in_vault).length; return v ? `<span class="pill ok">${v} in the vault</span>` : ""; }
function vemuHTML(){
  if (vemus === null){ if (T){ vemus = []; loadPlay(); } }
  const mine = new Set(S.romFiles.map(f => f.sys));
  const list = (vemus || []).slice().sort((a, b) => (b.systems.some(s => mine.has(s)) - a.systems.some(s => mine.has(s))) || a.name.localeCompare(b.name));
  return `<div class="esde-card"><p class="hint" style="margin:0">Everything RetroArch can play goes through RetroArch. These are for systems RetroArch can't play (PS3, Wii U, Xbox, Vita, PS4), or when you'd rather use a standalone one (PCSX2 for PS2, DuckStation for PS1): choose it in Ready to play. Each one runs from <span class="mono">${esc(ROOT)}/Emulators/&lt;name&gt;/</span> with its settings, saves and memory cards in its own <span class="mono">home</span> folder there, so nothing goes to the computer. ES-DE starts them from there too. The first time, settings it already has on this computer are copied in.</p>
    <div class="files">${list.map(v => { const busy = vemuBusy === v.id; const yours = v.systems.some(s => mine.has(s));
      return `<div class="frow" style="flex-wrap:wrap;gap:8px"><span class="dot ${v.in_vault ? "on" : ""}"></span><div style="flex:1 1 220px;min-width:0"><div class="fn">${esc(v.name)}</div><div class="note">${v.systems.map(s => esc(sysName(s))).join(", ")}${yours ? "" : " · you have no games for it yet"}${v.in_vault ? ` · <span class="mono">Emulators/${esc(v.name)}</span>` : ""}</div></div>
        ${v.in_vault ? `<span class="pill ok">in the vault</span><button class="linkbtn" data-vemuoff="${esc(v.id)}" ${vemuBusy ? "disabled" : ""}>Not from the vault</button>` : `<button class="btn small ${yours ? "primary" : ""}" data-vemuon="${esc(v.id)}" ${vemuBusy ? "disabled" : ""}>${busy ? "Getting it…" : v.downloaded ? "Run from the vault" : "Get it"}</button>`}
        <button class="linkbtn" data-vemuown="${esc(v.id)}" ${vemuBusy ? "disabled" : ""}>${v.own ? "Use another one…" : "Use one I already have…"}</button>
        ${v.own ? `<div class="note" style="flex-basis:100%;overflow-wrap:anywhere">Your own: <span class="mono">${esc(v.own)}</span></div>` : ""}</div>`; }).join("")}</div>
    <p class="hint" style="margin:0">Downloaded an emulator yourself? "Use one I already have" takes your file: an AppImage is copied into the vault (so it goes along to another computer), any other program is used where it is. Its settings still go in the vault.</p></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-vemuown]"); if (!b || vemuBusy) return;
  const id = b.dataset.vemuown, v = (vemus || []).find(x => x.id === id);
  let p = null; try { p = await T.dialog.open({ title: `Your ${v ? v.name : "emulator"} (an AppImage or the program)` }); } catch (err) {}
  if (!p) return;
  vemuBusy = id; renderRoms();
  try { const how = await inv("vault_emu_link", { id, path: p }); toast(how === "copied" ? `${v.name}: your AppImage is copied into the vault and runs from there` : `${v.name}: runs from ${p}, with its settings in the vault`); } catch (err) { toast(errMsg(err)); }
  vemuBusy = ""; await loadPlay();
});
document.addEventListener("click", async e => {
  const on = e.target.closest && e.target.closest("[data-vemuon]"), off = e.target.closest && e.target.closest("[data-vemuoff]");
  if (!on && !off) return; if (vemuBusy) return;
  const id = (on || off).dataset[on ? "vemuon" : "vemuoff"];
  vemuBusy = id; renderRoms();
  try {
    if (on){ const v = (vemus || []).find(x => x.id === id); if (v && v.downloaded) await inv("vault_emu_set", { id, on: true }); else await getEmu(id); toast(`${v ? v.name : id} runs from the vault`); }
    else { await inv("vault_emu_set", { id, on: false }); toast("It no longer runs from the vault (its folder there stays)"); }
  } catch (err) { toast(errMsg(err)); }
  vemuBusy = ""; await loadPlay();
});
return { readyHTML, vemuHTML, vemuPill, discHint, rarchHTML, rarchPill, esdePill, esdeHomeBtn, esdeHTML, mergeUI, extraHTML, listsHTML, bgHTML, dupStoreHTML, shapeHTML, keepShape, shapeSettingsHTML, addPatches, applyPatch, frontend, snap: () => SNAP, skip, unskipAll, cleanInbox, bkHome, checkAll, fillDrive, findSetup, importSetup, addSystem, later, queue, m3u, pickDrive, listDrives, readDrive, covers, inv, load, sync, start, reloadInbox, intoInbox, filesFor, toList, get OV(){ return OV; }, set OV(v){ OV = v; }, onReady: f => hooks.push(f), isReady: () => ready, get UI(){ return UI; }, soon, errMsg, MB, baseOf, dirOf, root: () => ROOT, setAllowDelete: v => { allowDelete = v; } };
})();

// ===================================================================== Apps (MA): your followed apps from the core
const EVA = (() => {
const PL = { android: "Android", linux: "Linux", windows: "Windows", macos: "macOS" };
const LP = Object.fromEntries(Object.entries(PL).map(([k, v]) => [v, k]));
// 0.10: another chip of a platform: core "linux@arm64" <-> screen "Linux · arm64"
// 0.10.4: another file of the same release: "android~classic" <-> "Android · classic"
const labelOf = k => { const [b, c] = String(k).split(/[@~]/); return c ? `${PL[b]} · ${c}` : PL[b]; };
const keyOf = l => { const [b, c] = String(l).split(" · "); return c ? `${LP[b]}${["x64", "arm64"].includes(c) ? "@" : "~"}${c}` : LP[b]; };
const CAT = c => ({ "PC Emulation": "PC emulator", "Track Only": "Tool", "Frontend (PC)": "Frontend", "Utilities": "Tool", "Streaming": "Other" }[c] || (["Emulator", "PC emulator", "Frontend", "Tool", "Other"].includes(c) ? c : "Other"));
const SRCL = { github: "GitHub", gitlab: "GitLab", codeberg: "Codeberg", forgejo: "Forgejo", html: "Website", none: "No link" };
let OVA = [];
function toMA(av){
  const ux = (EV.UI.apps || {})[av.id] || {};
  const checkable = av.source !== "none" && av.source !== "manual" && !(av.source === "html" && !av.plats.some(p => p.latest));
  const files = av.plats.flatMap(p => p.stored.map(s => ({ plat: PL[p.plat.split(/[@~]/)[0]], variant: p.plat.split(/[@~]/)[1] || "", key: p.plat, hand: !!s.hand, ver: s.version, file: s.file, mb: EV.MB(s.size), added: (s.downloaded || "").replace(" ", "T"), path: s.path })));
  const newest = files.slice().sort((a, b) => b.added.localeCompare(a.added))[0];
  const ups = av.plats.filter(p => (p.status === "update" || p.status === "missing") && p.latest && p.latest.asset);
  const ver = ups[0] && ups[0].latest.version;
  const a = { id: av.id, name: av.name, cat: CAT(av.category), about: av.about || av.category, src: av.source === "none" ? "none" : checkable ? (av.source === "gitlab" ? "gitlab" : "github") : "web",
    srcLabel: SRCL[av.source] || av.source, url: av.url || av.page || "", keep: av.plats.filter(p => !/[@~]/.test(p.plat)).map(p => PL[p.plat]), keys: av.plats.map(p => p.plat), avail: av.avail || [], variants: av.variants || [], release: av.release || [], offers: av.offers || [], systems: av.systems || [], license: av.license || "", notes: ux.notes !== undefined ? ux.notes : (av.notes || ""),
    latest: newest ? { ver: newest.ver, date: newest.added.slice(0, 10) } : null, files, mine: av.mine, pack: av.pack,
    remind: ux.remind !== undefined ? ux.remind : (checkable ? undefined : 3), checked: ux.checked || (av.checked || "").slice(0, 10), retired: !!ux.retired, skip: ux.skip, error: av.error,
    update: null };
  if (ver && ux.skip !== ver){
    a.update = { ver, date: (ups[0].latest.date || "").slice(0, 10), assets: ups.flatMap(p => (p.choices.length > 1 && !p.prefer ? p.choices : [p.latest.asset]).map(x => ({ plat: labelOf(p.plat), name: x.name, mb: EV.MB(x.size) || 0, got: false }))) };
  }
  return a;
}
function apply(ov){
  OVA = ov.apps; EV.OV = ov;
  const old = Object.fromEntries(MA.M.apps.map(a => [a.id, a]));
  MA.M.apps = ov.apps.filter(a => a.enabled).map(toMA);
  MA.M.apps.forEach(a => { if (old[a.id] && old[a.id].update && !a.update && old[a.id].update.ver === a.update?.ver) {} });
  MA.M.lastCheck = ov.last_check || "not yet";
  if (typeof S === "object" && S.keep !== ov.config.keep) S.keep = ov.config.keep;
}
const re = () => { MA.render(); renderHome?.(); renderStrip(); };
async function refresh(){ apply(await EV.inv("get_overview")); re(); }
async function check(){
  const b = $("#ma-check"); if (b){ b.disabled = true; b.textContent = "Checking…"; }
  log("Checking your apps for new versions…");
  try { const ids = MA.M.apps.filter(a => !a.retired && a.src !== "none").map(a => a.id); apply(await EV.inv("check_apps", { ids })); } catch (e) { toast(EV.errMsg(e)); }
  const n = MA.updates().length, dd = MA.dueList().length;
  log(`${n} update${n === 1 ? "" : "s"} found`); toast(`${n ? `${n} update${n > 1 ? "s" : ""} found` : "No new versions"}${dd ? ` · ${dd} website${dd > 1 ? "s" : ""} to check by hand` : ""}`);
  re();
}
async function download(id, plat, name, btn){
  const a = MA.M.apps.find(x => x.id === id), av = OVA.find(x => x.id === id), p = av && av.plats.find(x => x.plat === keyOf(plat));
  if (!p) return;
  if (btn){ btn.disabled = true; btn.textContent = "Downloading…"; }
  try {
    if (p.choices.length > 1 && name && p.latest?.asset?.name !== name) await EV.inv("set_prefer", { id, plat: p.plat, file: name });
    apply(await EV.inv("download_app", { id, plat: p.plat }));
    toast(`${a.name}: ${name} kept in Apps/${a.name}/${plat.replace(" · ", "-")}/`);
  } catch (e) { toast(EV.errMsg(e)); }
  re();
}
window.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-madl]"); if (!b) return; e.preventDefault(); e.stopPropagation(); download(b.dataset.madl, b.dataset.maplat, b.dataset.maname, b); }, true);
let progT = 0;
EV.inv && window.__TAURI__ && window.__TAURI__.event.listen("dl-progress", e => { const p = e.payload; const b = document.querySelector(`[data-madl="${CSS.escape(p.id)}"][data-maplat="${labelOf(p.plat)}"]`); if (b && Date.now() - progT > 150){ progT = Date.now(); b.textContent = p.total ? `${Math.round(p.got / p.total * 100)}%` : `${Math.round(p.got / 1048576)} MB`; } });
async function saveDrop(id){
  const M = MA.M, a = M.apps.find(x => x.id === id), P = M.pending[id];
  const ver = $(`#mcv-${CSS.escape(id)}`).value.trim(), plat = $(`#mcp-${CSS.escape(id)}`).value;
  if (!P.path){ toast("Drop the file again, or use Choose file…"); return; }
  try {
    apply(await EV.inv("app_add_file", { id, plat: LP[plat], path: P.path, ver: ver || null }));
    if (P.fromInbox){ await EV.inv("apply_ops", { label: `Inbox: ${P.file} kept with ${a.name}`, ops: [{ kind: "delete", from: P.path, to: "" }] }).catch(() => {}); EV.reloadInbox(); }
    delete M.pending[id]; const msg = `Kept: ${a.name} ${ver || ""} (${plat})`; log(msg); toast(msg);
  } catch (e) { toast(EV.errMsg(e)); }
  re();
}
async function delVersion(id, file){
  const a = MA.M.apps.find(x => x.id === id), f = a && a.files.find(x => x.file === file);
  if (!f) return;
  try { apply(await EV.inv("delete_version", { path: f.path })); log(`Deleted ${file}`); toast(`Deleted ${file}`); } catch (e) { toast(EV.errMsg(e)); }
  re();
}
function openApp(id){ const a = MA.M.apps.find(x => x.id === id); EV.inv("open_path", { path: `${EV.root()}/Apps/${a.name}` }).catch(() => EV.inv("open_path", { path: `${EV.root()}/Apps` })).catch(e => toast(EV.errMsg(e))); }
async function saveSheet(d){
  // the screen already changed its own copy; now the core
  const a = d.edit ? MA.M.apps.find(x => x.id === d.edit) : MA.M.apps[0];
  if (!a) return;
  const ux = (EV.UI.apps ||= {});
  try {
    if (a.mine || !d.edit){
      apply(await EV.inv("save_my_app", { app: { id: d.edit && a.mine ? a.id : "", name: a.name, url: a.src === "none" ? "" : a.url, category: a.cat, about: a.about, plats: a.keep.map(p => LP[p]), notes: a.notes || "" } }));
      const id = d.edit ? a.id : MA.M.apps.find(x => x.name === a.name && x.mine)?.id;
      if (id){ ux[id] = { ...(ux[id] || {}), notes: a.notes, remind: a.remind, checked: a.checked }; MA.M.open.add(id); if (!d.edit && a.url && a.src !== "none") EV.inv("check_apps", { ids: [id] }).then(apply).then(re).catch(() => {}); }
      if (!d.edit && d.file && d.file.path && id){ MA.M.pending[id] = { file: d.file.name, path: d.file.path, ver: "", plat: a.keep[0] || "Linux", variant: "", match: true, mb: EV.MB(d.file.size) }; }
    } else {
      ux[a.id] = { ...(ux[a.id] || {}), notes: a.notes, remind: a.remind, retired: a.retired };
      const av = OVA.find(x => x.id === a.id), now = av.plats.filter(p => !/[@~]/.test(p.plat)).map(p => PL[p.plat]).join();
      if (a.keep.join() !== now){ const chips = av.plats.filter(p => /[@~]/.test(p.plat) && a.keep.includes(PL[p.plat.split(/[@~]/)[0]])).map(p => p.plat); apply(await EV.inv("set_app_plats", { id: a.id, plats: [...a.keep.map(p => LP[p]), ...chips] })); }
    }
  } catch (e) { toast(EV.errMsg(e)); }
  EV.soon(); re();
}
async function removeApp(id){
  const a = MA.M.apps.find(x => x.id === id); if (!a) return;
  try { apply(a.mine ? await EV.inv("remove_my_app", { id }) : await EV.inv("set_enabled", { ids: [id], on: false })); log(`${a.name} removed from my apps`); toast(`${a.name} removed from your list. Its folder and files stay in Apps/.`); } catch (e) { toast(EV.errMsg(e)); }
  re();
}
async function follow(id){ try { apply(await EV.inv("set_enabled", { ids: [id], on: true })); const a = MA.M.apps.find(x => x.id === id); toast(`${a ? a.name : "App"} added to your list`); EV.inv("check_apps", { ids: [id] }).then(apply).then(re).catch(() => {}); } catch (e) { toast(EV.errMsg(e)); } re(); }
async function addPack(){
  const T = window.__TAURI__; const f = await T.dialog.open({ filters: [{ name: "Obtainium export", extensions: ["json"] }], title: "Choose an Obtainium export" }); if (!f) return;
  try { apply(await EV.inv("add_pack", { path: f })); MA.M.catOpen = null; toast("Pack added. Press “+ My list” on the apps you want."); } catch (e) { toast(EV.errMsg(e)); }
  re();
}
async function removePack(name){ try { apply(await EV.inv("remove_pack", { name })); toast(`${name} removed. Apps you added from it stay in your list.`); } catch (e) { toast(EV.errMsg(e)); } re(); }
const BUILTIN = ["Obtainium Emulation Pack", "PC emulators (Linux)", "Awesome Emulators"];
function catHTML(){
  const M = MA.M, packs = (EV.OV ? EV.OV.packs : []).filter(([n]) => n !== "My apps"), q = (M.catQ || "").trim().toLowerCase();
  return `<div class="ma-panel"><h3>Packs</h3>
    <p class="hint">A pack is a ready-made list from someone else, like the Obtainium Emulation Pack or the Recomp/Decomp pack. Here a pack is only something to browse: nothing from it is followed until you press “+ My list”. Then it becomes a normal app in your own list.</p>
    <div class="ma-row"><button class="btn" id="ma-catadd">Add a pack (.json)…</button></div></div>
    ${packs.map(([n, k]) => { const open = M.catOpen === n, list = OVA.filter(a => a.pack === n && (!q || (a.name + " " + a.about).toLowerCase().includes(q)));
      return `<div class="ma-panel"><div class="ma-row"><h3 class="ma-grow">${esc(n)}</h3><span class="muted" style="font-size:12px">${k} apps · ${OVA.filter(a => a.pack === n && a.enabled).length} in my list</span><button class="btn small" data-mapack="${esc(n)}">${open ? "Close" : "Browse"}</button>${BUILTIN.includes(n) ? "" : `<button class="linkbtn" data-maunpack="${esc(n)}">Remove pack</button>`}</div>
      ${open ? `<input type="search" id="ma-catq" class="search" placeholder="Search this pack" value="${esc(M.catQ || "")}"><div>${list.map(a => `<div class="ma-catrow"><div><b>${esc(a.name)}</b> <span class="pill plat">${esc(CAT(a.category))}</span><div class="muted" style="font-size:12.5px">${esc(a.about || "")}</div></div>${a.enabled ? `<span class="pill ok">in my list</span>` : `<button class="btn small" data-mafollow="${esc(a.id)}">+ My list</button>`}</div>`).join("") || `<div class="empty-state">No apps match.</div>`}</div>` : ""}</div>`; }).join("")}`;
}
async function exportApps(){
  const M = MA.M, E = M.exp, T = window.__TAURI__;
  const chosen = M.apps.filter(a => E.pick[a.id] && E.pick[a.id].on);
  const json = JSON.stringify({ app: "Emu Vault", kind: "my-apps", version: 3, apps: chosen.map(a => ({ id: a.id, name: a.name, url: a.url, categories: [a.cat], about: a.about, keep: a.keep, notes: a.notes || undefined })) }, null, 2);
  if (E.mode === "list"){ const p = await T.dialog.save({ defaultPath: "emu-vault-apps.json" }); if (!p) return; try { await EV.inv("write_text", { path: p, text: json }); toast("Saved: " + EV.baseOf(p)); } catch (e) { toast(EV.errMsg(e)); } return; }
  const files = chosen.flatMap(a => a.files.filter(f => E.pick[a.id].files[f.file]).map(f => f.path));
  const p = await T.dialog.save({ defaultPath: "emu-vault-export.zip" }); if (!p) return;
  toast("Making the .zip…");
  try { const n = await EV.inv("export_zip", { path: p, json, files }); toast(`Saved: ${EV.baseOf(p)} (${n} file${n === 1 ? "" : "s"})`); } catch (e) { toast(EV.errMsg(e)); }
}
EV.onReady(ov => { apply(ov); re(); });
return { check, saveDrop, delVersion, openApp, saveSheet, removeApp, follow, addPack, removePack, catHTML, exportApps, refresh, apply, labelOf, keyOf, get OVA(){ return OVA; } };
})();

// ===================================================================== Backups: your real save folders
const EVB = (() => {
let B = null, busy = null, restore = null;
const MBs = b => size(Math.max(1, Math.round(EV.MB(b))));
const WHEN = { daily: "every day", weekly: "every week", start: "every time Emu Vault starts", manual: "only when you ask" };
async function loadB(){ try { B = await EV.inv("saves_status"); } catch (e) { B = null; } renderBackups(); renderHome?.(); }
renderBackups = function(){
  const el = $("#view-bk"); if (!el) return;
  if (!B){ el.innerHTML = `<div class="empty-state">Reading your save folders…</div>`; return; }
  const F = B.folders, tot = F.reduce((a, f) => a + f.bytes, 0), files = F.reduce((a, f) => a + f.files, 0);
  const seg = (name, opts, val) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-${name}="${v}" aria-pressed="${String(v) === String(val)}">${l}</button>`).join("")}</div>`;
  let h = `<div class="dupsum">
    <div class="nums"><div><b>${nl(files)}</b>saves</div><div><b>${F.length}</b>emulators</div><div><b>${F.length ? MBs(tot) : "–"}</b>per backup</div></div>
    <p class="hint">Your saves are the one thing you can't download again. Emu Vault copies the save folder of every emulator you back up to <span class="mono">${esc(B.dir)}/</span>, ${esc(WHEN[B.when] || WHEN.daily)}, and keeps the last ${B.keep} backups of each. A backup is only made when something changed. Emu Vault has to be open for it; when it was closed, it catches up when it starts.</p>
    <div class="gact"><button class="btn primary small" id="bk-all" ${busy || !F.length ? "disabled" : ""}>${busy === "*" ? "Backing up…" : "Back up everything now"}</button></div>
    <details class="filt" data-k="bk:sched" ${isOpen("bk:sched") ? "open" : ""}><summary>Schedule <span class="fs">${esc(WHEN[B.when] || "")} · keep ${B.keep}</span></summary>
      <div class="prefs" style="gap:14px"><span style="font-weight:600">When:</span>${seg("bkw", [["daily", "Every day"], ["weekly", "Every week"], ["start", "When Emu Vault starts"], ["manual", "Only when I ask"]], B.when)}</div>
      <div class="prefs" style="gap:14px"><span style="font-weight:600">Keep:</span>${seg("bkk", [[3, "3"], [5, "5"], [10, "10"]], B.keep)}</div>
    </details>
  </div>
  <div class="sys-block" style="margin-top:12px">
    <header><div><h3>Sync between your devices</h3><div class="used">With Syncthing</div></div><span class="pill plat">later</span></header>
    <p class="hint" style="margin:0">Keeping the same saves on your phone and your PC comes in a later version. Until then, the backups below are on your main drive.</p>
  </div>
  <div class="group" style="margin-top:14px"><h2>Per emulator · ${F.length}</h2><div style="display:flex;flex-direction:column;gap:10px">`;
  F.forEach(f => {
    const last = f.snaps.find(s => !s.note), run = busy === f.label || busy === "*";
    h += `<div class="sys-block">
      <header><div><h3>${esc(f.label)}</h3><div class="used mono" style="overflow-wrap:anywhere">${esc(f.path)}</div></div>${!f.exists ? `<span class="pill bad">folder not found</span>` : last ? `<span class="pill ok">backed up ${esc(fmtDate(last.time.slice(0, 10)))}, ${esc(last.time.slice(11))}</span>` : `<span class="pill warn">not backed up yet</span>`}</header>
      <div class="bkcols"><div><span class="lbl2">Saves · ${nl(f.files)} · ${MBs(f.bytes)}</span>${f.sample.length ? f.sample.map(p => `<div class="mono note">${esc(p)}</div>`).join("") + (f.files > f.sample.length ? `<div class="note">and ${nl(f.files - f.sample.length)} more</div>` : "") : `<div class="note">Nothing in this folder yet.</div>`}</div></div>
      <div class="snaps">${f.snaps.map((sn, i) => `<div class="snap"><span class="mono">${esc(fmtDate(sn.time.slice(0, 10)))} ${esc(sn.time.slice(11))}</span>${i === 0 && !sn.note ? `<span class="pill plat">newest</span>` : ""}${sn.note ? `<span class="pill plat">${esc(sn.note)}</span>` : ""}<span class="muted" style="font-size:12px">${nl(sn.files)} files · ${MBs(sn.bytes)}</span><button class="linkbtn" data-bkr="${esc(f.label)}" data-i="${esc(sn.id)}">Restore</button></div>`).join("") || `<p class="hint" style="margin:0">No backups yet.</p>`}</div>
      ${run ? `<div class="prog"><i style="width:60%"></i></div>` : ""}
      <div class="gact"><button class="btn small" data-bkone="${esc(f.label)}" ${busy || !f.exists ? "disabled" : ""}>${run ? "Backing up…" : "Back up now"}</button><button class="linkbtn" data-loc="${esc(f.path)}/">Open folder</button><button class="linkbtn" data-bkdel="${esc(f.label)}">Stop backing this up</button></div>
    </div>`;
  });
  if (!F.length) h += `<div class="empty-state">No save folders yet. Add the ones Emu Vault found below, or choose a folder.</div>`;
  if (B.detected.length) h += `<div class="sys-block"><header><div><h3>Found on this computer · ${B.detected.length}</h3><div class="used">Save folders of emulators you have</div></div><button class="btn small" id="bk-addall">Back up all ${B.detected.length}</button></header><div class="files">${B.detected.map((s, i) => `<div class="frow"><span class="dot"></span><div><div class="fn">${esc(s.label)}</div><div class="note mono">${esc(s.path)}</div></div><button class="btn small" data-bkadd="${i}">Back this up</button></div>`).join("")}</div></div>`;
  h += `<div class="gact"><button class="btn small" id="bk-addf">Add a save folder…</button></div></div></div>`;
  if (B.legacy.length) h += `<details class="filt" style="margin-top:14px" data-k="bk:old" ${isOpen("bk:old") ? "open" : ""}><summary>Older backups <span class="fs">${B.legacy.length} · all folders together, from before 0.4.8</span></summary><div class="snaps">${B.legacy.map(sn => `<div class="snap"><span class="mono">${esc(sn.time)}</span><span class="muted" style="font-size:12px">${nl(sn.files)} files · ${MBs(sn.bytes)}</span><button class="linkbtn" data-bkold="${esc(sn.id)}">Restore</button></div>`).join("")}</div></details>`;
  if (restore) h += `<div class="confirm" role="alertdialog"><b>Put back the saves of ${esc(restore.label)} from ${esc(restore.time)}?</b><p class="hint">The saves that are there now are backed up first, so you can go back.</p><div class="acts"><button class="btn" id="bkr-no">Cancel</button><button class="btn primary" id="bkr-yes">Restore</button></div></div>`;
  el.innerHTML = h;
  const save = async patch => { const c = EV.OV.config; try { EV.OV = await EV.inv("save_settings", { cfg: { ...c, ...patch } }); } catch (e) { toast(EV.errMsg(e)); } await loadB(); };
  const now = async label => { busy = label || "*"; renderBackups(); try { const [n, files] = await EV.inv("saves_backup", { label: label || null }); const m = n ? `Backup made: ${n} folder${n > 1 ? "s" : ""}, ${nl(files)} files` : "Nothing changed since the last backup"; toast(m); log(m); } catch (e) { toast(EV.errMsg(e)); } busy = null; await loadB(); };
  $("#bk-all").onclick = () => now(null);
  el.querySelectorAll("[data-bkone]").forEach(b => b.onclick = () => now(b.dataset.bkone));
  el.querySelectorAll("[data-bkw]").forEach(b => b.onclick = () => save({ backup_when: b.dataset.bkw, backup_on_start: b.dataset.bkw !== "manual" }));
  el.querySelectorAll("[data-bkk]").forEach(b => b.onclick = () => save({ backup_keep: +b.dataset.bkk }));
  el.querySelectorAll("[data-bkadd]").forEach(b => b.onclick = () => save({ save_sources: [...EV.OV.config.save_sources, B.detected[+b.dataset.bkadd]] }));
  const aa = $("#bk-addall"); if (aa) aa.onclick = () => save({ save_sources: [...EV.OV.config.save_sources, ...B.detected] });
  el.querySelectorAll("[data-bkdel]").forEach(b => b.onclick = () => save({ save_sources: EV.OV.config.save_sources.filter(s => s.label !== b.dataset.bkdel) }));
  $("#bk-addf").onclick = async () => { const d = await window.__TAURI__.dialog.open({ directory: true, title: "A folder with saves" }); if (d) save({ save_sources: [...EV.OV.config.save_sources, { label: d.split("/").filter(Boolean).slice(-2).join(" / "), path: d }] }); };
  el.querySelectorAll("[data-bkr]").forEach(b => b.onclick = () => { const f = B.folders.find(x => x.label === b.dataset.bkr), s = f.snaps.find(x => x.id === b.dataset.i); restore = { label: f.label, id: s.id, time: s.time }; renderBackups(); });
  el.querySelectorAll("[data-bkold]").forEach(b => b.onclick = async () => { if (!b.dataset.sure){ b.dataset.sure = "1"; b.textContent = "Sure? Press again"; return; } try { const n = await EV.inv("backup_restore", { id: b.dataset.bkold }); toast(`${n} files put back`); } catch (e) { toast(EV.errMsg(e)); } loadB(); });
  const no = $("#bkr-no"); if (no) no.onclick = () => { restore = null; renderBackups(); };
  const yes = $("#bkr-yes"); if (yes) yes.onclick = async () => { const r = restore; restore = null; try { const n = await EV.inv("saves_restore", { label: r.label, id: r.id }); toast(`${r.label}: ${nl(n)} files put back from ${r.time}`); log(`${r.label}: saves from ${r.time} put back`); } catch (e) { toast(EV.errMsg(e)); } await loadB(); };
  el.querySelectorAll("details[data-k]").forEach(d => d.addEventListener("toggle", () => { d.open ? S.ui.open.add(d.dataset.k) : S.ui.open.delete(d.dataset.k); }));
};
EV.onReady(() => { loadB(); });
// the schedule, while Emu Vault is open
setInterval(() => { if (EV.OV) EV.inv("saves_tick", { atStart: false }).then(([n]) => { if (n){ loadB(); notify?.("backup", "Saves backed up", `${n} emulator${n > 1 ? "s" : ""}`, "bk"); } }).catch(() => {}); }, 30 * 60 * 1000);
return { loadB, get B(){ return B; } };
})();

// ===================================================================== saves in the Inbox: into the right emulator folder
{
  const guess = (name, folders) => {
    const n = name.toLowerCase(), by = re => folders.find(f => re.test(f.label));
    if (/\.state\d*$|\.st\d$/.test(n)) return by(/retroarch states/i) || by(/retroarch/i);
    if (/\.(mcd|mcr)$/.test(n)) return by(/duckstation/i) || by(/retroarch saves/i);
    if (/\.ps2$/.test(n)) return by(/pcsx2/i);
    if (/\.dsv$/.test(n)) return by(/melonds/i) || by(/retroarch saves/i);
    if (/\.(srm|sav|sa1)$/.test(n)) return by(/retroarch saves/i) || by(/mgba/i);
    return folders[0];
  };
  const _oc = otherCard;
  otherCard = function(o){
    if (o.kind !== "save") return _oc(o);
    const B = EVB.B, folders = B ? [...B.folders.map(f => ({ label: f.label, path: f.path })), ...B.detected] : [];
    const g = o.folder || (guess(o.name, folders) || {}).path || "";
    return `<article class="icard ib-other"><header><div style="min-width:0"><div class="fn mono">${esc(o.name)}</div><div class="muted" style="font-size:12px">inbox/ · ${size(Math.max(1, Math.round(o.mb || 1)))}</div></div><span class="pill ${g ? "ok" : "warn"}">save</span></header>
      <div class="checks"><div class="crow2"><span class="ck ${g ? "ok" : "warn"}">${g ? "✓" : "?"}</span><span><b>A save file</b><br><span class="muted">It goes into the save folder of the emulator you play it with. A save with the same name that is already there is backed up first and moved to _duplicates, so you can go back.</span></span></div></div>
      ${folders.length ? `<div class="q"><label for="sv-${esc(o.id)}">Which emulator?</label><select id="sv-${esc(o.id)}" data-savefolder="${esc(o.id)}">${folders.map(f => `<option value="${esc(f.path)}" ${f.path === g ? "selected" : ""}>${esc(f.label)} · ${esc(f.path)}</option>`).join("")}</select></div>` : `<p class="hint">Emu Vault doesn't know your save folders yet. Add them in Backups first.</p>`}
      ${o.exists ? `<div class="verdict warn"><b>${esc(o.name)} is already in that folder.</b> Replace it? The one there now is backed up and moved to _duplicates.</div>` : ""}
      <div class="iact">${folders.length ? `<button class="btn small primary" data-saveput="${esc(o.id)}">${o.exists ? "Replace it" : "Put it there"}</button>` : `<button class="btn small" data-go-bk="1">Open Backups</button>`}<button class="linkbtn" data-oskip="${esc(o.id)}">Skip</button></div></article>`;
  };
  document.addEventListener("change", e => { const s = e.target.closest && e.target.closest("[data-savefolder]"); if (!s) return; const o = S.ib.other.find(x => x.id === s.dataset.savefolder); if (o){ o.folder = s.value; o.exists = false; renderInboxTab(); } });
  document.addEventListener("click", async e => {
    const g = e.target.closest && e.target.closest("[data-go-bk]"); if (g){ go("bk"); return; }
    const b = e.target.closest && e.target.closest("[data-saveput]"); if (!b) return;
    const o = S.ib.other.find(x => x.id === b.dataset.saveput); if (!o) return;
    const folder = document.getElementById("sv-" + o.id)?.value || o.folder;
    try {
      await EV.sync();
      const to = await EV.inv("save_put", { src: o.loc, folder, replace: !!o.exists });
      S.ib.other = S.ib.other.filter(x => x !== o); S.inboxDone.unshift({ name: `inbox/${o.name}`, to });
      log(`Save ${o.name} → ${to}`); toast(`${o.name} is in ${folder}`);
      EVB.loadB();
    } catch (err) { if (EV.errMsg(err) === "exists"){ o.exists = true; o.folder = folder; } else toast(EV.errMsg(err)); }
    renderInboxTab(); updateInboxBadge?.(); renderHome?.();
  });
}

// ===================================================================== small things
// your changes to a list also go to lists/<system>.txt, where the core reads them
{ const _se = saveEdits; saveEdits = function(){ _se(); const T = window.__TAURI__; if (!T) return; for (const [sys, text] of Object.entries(S.coll.edits || {})) EV.inv("list_edits_save", { sys, text }).catch(() => {}); }; }
// notifications: also on the desktop when Emu Vault isn't in front
{ const _n = notify; notify = function(kind, title, text, goKey){ const r = _n(kind, title, text, goKey); if (r && document.hidden) EV.inv("notify", { title, body: text }).catch(() => {}); return r; }; }
// the Drives view lists what's plugged in
{ const _rd = renderDrives; let last = 0; renderDrives = function(el){ if (Date.now() - last > 15000){ last = Date.now(); EV.listDrives().then(() => { renderDrives(el); }); } return _rd(el); }; }

// buttons that used inline handlers (not allowed by the app's content policy)
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("[data-openadd]"); if (a){ openAdd(a.dataset.openadd); return; }
  const c = e.target.closest && e.target.closest("[data-closeadd]"); if (c) closeAdd();
});
EV.start();

// self-test inside the real web view (only when EMUVAULT_SELFTEST is set)
if (window.__TAURI__) window.__TAURI__.core.invoke("selftest_path").then(async out => {
  if (!out) return;
  const r = [];
  const t = (name, f) => { try { r.push(name + ": " + f()); } catch (e) { r.push(name + ": ERR " + e.message); } };
  t("DataTransfer", () => { const dt = new DataTransfer(); dt.items.add(new File([], "a.gba", { lastModified: 77 })); return dt.files.length + " " + dt.files[0].lastModified; });
  t("input.files", () => { const dt = new DataTransfer(); dt.items.add(new File([], "a.gba")); const i = document.createElement("input"); i.type = "file"; i.files = dt.files; return i.files.length; });
  t("DragEvent", () => { const dt = new DataTransfer(); dt.items.add(new File([], "a.gba")); const e = new DragEvent("drop", { dataTransfer: dt }); return e.dataTransfer ? e.dataTransfer.files.length : "no dataTransfer"; });
  t("size override", () => { const f = new File([], "x", { lastModified: 1e12 + 999 }); return f.size; });
  await new Promise(res => setTimeout(res, 8000));
  t("inbox", () => `${S.inbox.length} games, ${S.ib.other.length} other`);
  let t0 = performance.now(); go("inbox"); await new Promise(res => setTimeout(res, 3000));
  r.push(`inbox shown: cards ${document.querySelectorAll("#view-inbox .icard").length}`);
  // a drop from outside, the same way the window gets it from Tauri
  const ext = out.replace(/[^/]+$/, "dropme (USA).gba");
  await window.__TAURI__.core.invoke("write_text", { path: ext, text: "x" });
  try { const files = await EV.filesFor([ext]); const el = document.querySelector("#ib-drop"); const ok = el.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: EV.toList(files) })); r.push("drop handled by page: " + !ok); } catch (e) { r.push("drop ERR " + e.message); }
  await new Promise(res => setTimeout(res, 4000));
  r.push("after drop: " + S.inbox.filter(f => f.name.startsWith("dropme")).length + " dropme in inbox");
  // sort one ready file and time it
  try { t0 = performance.now(); const f = S.inbox.find(x => x.name.startsWith("Golden Sun ")); await identify(f); acceptInbox(f); renderInboxTab(); r.push(`accept+render: ${Math.round(performance.now() - t0)}ms`); } catch (e) { r.push("accept ERR " + e.message); }
  t0 = performance.now(); renderInboxTab(); r.push(`render again: ${Math.round(performance.now() - t0)}ms`);
  await new Promise(res => setTimeout(res, 4000));
  try { const rows = EV.convRoms(); r.push("convertible: " + JSON.stringify(rows)); if (rows.find(x => x.id === "psx")){ await EV.convert("psx"); r.push("after convert: " + S.romFiles.filter(f => f.sys === "psx").map(f => f.rel).join(", ")); } } catch (e) { r.push("convert ERR " + e.message); }
  try {
    r.push("patches: " + JSON.stringify(S.patches.map(p => [p.name, p.tag, !!patchTarget(p)])));
    const ip = S.patches.find(p => p.name.endsWith(".ips")); if (ip) await EV.applyPatch(ip.id);
    const xd = S.patches.find(p => p.name.endsWith(".xdelta")); if (xd){ xd.pick = S.romFiles.find(f => f.name === "Super Mario World (Europe).sfc").id; await EV.applyPatch(xd.id); }
    r.push("after patch: " + S.romFiles.filter(f => /\[/.test(f.name)).map(f => f.name).join(", ") + " · done " + S.patches.filter(p => p.done).length);
    await EV.frontend("ra"); await EV.frontend("esde");
    r.push("lists: " + (await window.__TAURI__.core.invoke("activity").catch(() => [])).slice?.(-3).map?.(x => x.text || x).join(" | "));
  } catch (e) { r.push("patch ERR " + (e.message || e)); }
  try {
    go("roms"); S.romView = "tools"; S.ui.open.add("blk:art-tool"); renderRoms(); await new Promise(res => setTimeout(res, 1500));
    S.art.kinds = new Set(["covers", "screenshots"]); S.art.size = "300"; S.art.dest.ra = true; EV.UI.artNF = [];
    await EV.covers();
    r.push("covers: " + JSON.stringify(S.art.last) + " cfg " + JSON.stringify(EV.OV.config.covers));
    const ra = await window.__TAURI__.core.invoke("ra_account", { user: "tester", key: "k123" });
    const rr = await window.__TAURI__.core.invoke("ra_check", { fresh: true });
    r.push("ra: " + JSON.stringify(rr.rows.filter(x => x.sys === "snes" || x.sys === "gba").map(x => [x.name, x.status, x.game])));
    try { await window.__TAURI__.core.invoke("bg_set", { bg: { on: true, hours: 12, apps: true, inbox: true, saves: true, covers: true } }); r.push("bg_set ok"); } catch (e) { r.push("bg_set: " + e); }
    r.push("bg_status: " + JSON.stringify(await window.__TAURI__.core.invoke("bg_status")));
    try { await window.__TAURI__.core.invoke("esde_setup"); } catch (e) { r.push("esde_setup ERR " + e); }
    r.push("esde: " + JSON.stringify(await window.__TAURI__.core.invoke("esde_status")));
    try { await window.__TAURI__.core.invoke("esde_start"); r.push("esde_start ok"); } catch (e) { r.push("esde_start: " + e); }
    try {
      const v = await window.__TAURI__.core.invoke("rarch_install"); r.push("rarch_install " + v);
      const n = await window.__TAURI__.core.invoke("rarch_cores"); r.push("rarch_cores " + n);
      r.push("rarch: " + JSON.stringify(await window.__TAURI__.core.invoke("rarch_status")));
      await window.__TAURI__.core.invoke("rarch_start"); r.push("rarch_start ok");
    } catch (e) { r.push("rarch ERR " + e); }
    try {
      const I = window.__TAURI__.core.invoke;
      r.push("play_options: " + JSON.stringify((await I("play_options")).map(p => [p.sys, p.choice, p.options.length])));
      r.push("vault_emus: " + JSON.stringify((await I("vault_emus")).filter(v => v.downloaded).map(v => v.id)));
      await I("vault_emu_set", { id: "pc.duckstation", on: true });
      await I("play_set", { sys: "psx", with: "emu:pc.duckstation" });
      const ps = S.romFiles.find(f => f.sys === "psx"); await I("play", { path: ps.loc, sys: "psx" });
      window.__pf = null; window.__TAURI__.event.listen("play-failed", e => { window.__pf = e.payload; });
      const gb = S.romFiles.find(f => f.sys === "gba"); await I("play_set", { sys: "gba", with: "ra:mgba" }); await I("play", { path: gb.loc, sys: "gba" });
      await new Promise(res => setTimeout(res, 2500)); r.push("play-failed: " + JSON.stringify(window.__pf));
      r.push("play ok");
      r.push("link: " + await I("vault_emu_link", { id: "pc.pcsx2", path: EV.root().replace(/\/root$/, "") + "/Downloads/pcsx2-v2.4.0-linux-appimage-x64-Qt.AppImage" }));
      r.push("ps2 options: " + JSON.stringify((await I("play_options")).filter(p => p.sys === "ps2")));
      await I("rarch_setup");
      const p2 = S.romFiles.find(f => f.sys === "ps2"); if (p2){ await I("play_set", { sys: "ps2", with: "emu:pc.pcsx2" }); await I("play", { path: p2.loc, sys: "ps2" }); }
      const dc = await I("discs_check"); r.push("discs: " + JSON.stringify(dc.filter(x => x.sys === "psx").map(x => [x.name, x.status, x.redump, x.note.slice(0, 60)])));
    } catch (e) { r.push("play ERR " + e); }
    r.push("outside games: " + S.romFiles.filter(f => !f.loc.startsWith(EV.root() + "/")).map(f => f.loc).join(", "));
  } catch (e) { r.push("A/D ERR " + (e.message || e)); }
  try {
    const before = S.art.got.size;
    await window.__TAURI__.core.invoke("write_text", { path: out + ".cover-now", text: "x" });
    await new Promise(res => setTimeout(res, 9000));
    r.push(`covers shown before/after ES-DE wrote one: ${before} -> ${S.art.got.size}`);
  } catch (e) { r.push("media ERR " + (e.message || e)); }
  try {
    r.push("snes before: " + S.romFiles.filter(f => f.sys === "snes").length);
    await window.__TAURI__.core.invoke("write_text", { path: out + ".delete-now", text: "x" });
    await new Promise(res => setTimeout(res, 25000));
    r.push("snes after outside delete: " + S.romFiles.filter(f => f.sys === "snes").length);
  } catch (e) { r.push("watch ERR " + (e.message || e)); }
  window.addEventListener("error", e => r.push("window error: " + e.message));
  await new Promise(res => setTimeout(res, 1500));
  window.__TAURI__.core.invoke("write_text", { path: out, text: r.join("\n") + "\n" });
});

// ===================================================================== Save space: converting disc games (chdman / dolphin-tool)
{
  const T = window.__TAURI__;
  Object.assign(CHD_SYS, { psp: { from: ".iso", save: 0.3, to: "CHD" }, "3do": { from: ".bin/.cue", save: 0.4, to: "CHD" }, neogeocd: { from: ".bin/.cue", save: 0.45, to: "CHD" }, pcfx: { from: ".bin/.cue", save: 0.4, to: "CHD" }, wii: { from: ".iso", save: 0.6, to: "RVZ" } });
  CHD_SYS.ps2.from = ".iso/.cue"; CHD_SYS.gc.from = ".iso/.gcm";
  const SRC = { CHD: ["cue", "gdi", "iso"], RVZ: ["iso", "gcm"] };
  let tools = null, installing = null;
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-install]"); if (!b || installing) return;
    installing = b.dataset.install; renderRoms();
    try { toast(await T.core.invoke("install_tool", { whichTool: installing })); } catch (err) { toast(EV.errMsg(err)); }
    installing = null; tools = await T.core.invoke("convert_tools").catch(() => tools); renderRoms();
  });
  if (T) T.core.invoke("convert_tools").then(t => { tools = t; }).catch(() => {});
  EV.convRoms = () => {
    const by = {};
    S.romFiles.forEach(f => { const c = CHD_SYS[f.sys]; if (!c || (f.rel || "").startsWith("_")) return; const ext = ((f.name.match(/\.([^.]+)$/) || [])[1] || "").toLowerCase(); if (!ext) return;
      const done = ext === c.to.toLowerCase(), todo = SRC[c.to].includes(ext); if (!done && !todo) return;
      const r = by[f.sys] ||= { id: f.sys, name: sysName(f.sys), n: 0, mb: 0, already: 0 }; if (done) r.already++; else { r.n++; r.mb += f.mb; } });
    return Object.values(by).map(r => { r.mb = Math.round(r.mb); const to = CHD_SYS[r.id].to;
      const busy = installing ? ` disabled` : "";
      if (tools && to === "CHD" && !tools.chdman) r.need = `Needs chdman (from MAME). <button class="linkbtn" data-install="chdman"${busy}>${installing === "chdman" ? "Installing… (enter your password in the window)" : "Install chdman"}</button>`;
      if (tools && to === "RVZ" && !tools.dolphin_tool) r.need = tools.flatpak ? `Needs dolphin-tool, which comes with Dolphin. <button class="linkbtn" data-install="dolphin"${busy}>${installing === "dolphin" ? "Installing Dolphin… (a few minutes)" : "Install Dolphin"}</button>` : `Needs dolphin-tool, which comes with Dolphin. Install Dolphin from Discover / Software, or Flatpak first: <span class="mono">sudo apt install flatpak</span>`;
      return r; }).sort((a, b) => b.mb - a.mb);
  };
  EV.convertedHTML = () => {
    const c = (EV.snap()?.converted || []); if (!c.length) return "";
    const tot = c.reduce((a, x) => a + x[1], 0);
    return `<div class="verdict ok" style="margin-top:8px"><b>Originals kept after converting: ${size(Math.max(1, Math.round(tot / 1048576)))}</b> in ${c.map(([s]) => `<span class="mono">roms/${esc(s)}/_converted/</span>`).join(", ")}. Start a converted game or two first; when they work, delete the originals. <button class="linkbtn" data-convdel="1">${EV.convSure ? "Sure? Press again to delete them for good" : "Delete the originals"}</button></div>`;
  };
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest("[data-convdel]"); if (!b) return;
    if (!EV.convSure){ EV.convSure = true; renderRoms(); setTimeout(() => { EV.convSure = false; renderRoms(); }, 4000); return; }
    EV.convSure = false;
    const c = EV.snap()?.converted || [];
    try { await T.core.invoke("apply_ops", { label: "Originals of converted games deleted", ops: c.map(([s]) => ({ kind: "delete", from: `${EV.root()}/roms/${s}/_converted`, to: "" })) }); toast("Originals deleted"); log("Originals of converted games deleted"); } catch (err) { toast(EV.errMsg(err)); }
    await EV.load(false); renderRoms(); renderStrip();
  });
  EV.convert = async id => {
    const Tl = S.tools; if (Tl.chdRun) return;
    await EV.sync();
    Tl.chdRun = id; Tl.chdPct = 2; Tl.chdNow = "Starting…"; renderRoms();
    try {
      const r = await T.core.invoke("convert_system", { sys: id });
      Tl.chdDone[id] = Math.max(1, Math.round(r.saved / 1048576));
      const msg = `${sysName(id)}: ${r.converted} game${r.converted === 1 ? "" : "s"} converted, ${size(Tl.chdDone[id])} saved${r.failed.length ? ` · ${r.failed.length} not converted (see Activity)` : ""}. The originals are in roms/${id}/_converted/.`;
      log(msg); toast(msg);
      if (!r.converted) delete Tl.chdDone[id];
      else { const hs = await T.core.invoke("recent_changes").catch(() => []); const b = hs[0]; if (b) record(b.label, () => { T.core.invoke("undo_change", { id: b.id }).then(() => EV.load(false)).then(() => { renderRoms(); renderHome?.(); }).catch(e => toast(EV.errMsg(e))); }, { tab: "roms" }); }
    } catch (e) { toast(EV.errMsg(e)); }
    Tl.chdRun = null; Tl.chdNow = "";
    await EV.load(false); renderRoms(); renderHome?.(); renderStrip();
  };
  if (T) T.event.listen("convert-progress", e => { const [i, n, name] = e.payload; const Tl = S.tools; if (!Tl.chdRun) return; Tl.chdPct = Math.max(3, Math.round(i / Math.max(1, n) * 100)); Tl.chdNow = name ? `${i + 1} of ${n}: ${name}` : "Finishing…"; if (activeTab?.() === "roms") renderRoms(); });
}

// ===================================================================== a disc file loose in inbox/: find the system by the game's name
{
  const DISC_SYS = { chd: ["psx", "ps2", "saturn", "segacd", "dreamcast", "pcenginecd", "3do", "neogeocd", "psp", "pcfx"], iso: ["ps2", "psp", "gc", "wii", "psx", "3do", "xbox"],
    cue: ["psx", "saturn", "segacd", "pcenginecd", "neogeocd", "3do", "pcfx"], bin: ["psx", "saturn", "segacd"], gdi: ["dreamcast"], cdi: ["dreamcast"], cso: ["psp", "ps2"], rvz: ["gc", "wii"], gcm: ["gc"], m3u: ["psx", "saturn", "segacd", "dreamcast", "pcenginecd"], pbp: ["psx", "psp"] };
  EV.guessByName = async p => {
    const ext = String(p.ext || "").replace(/^\./, "").toLowerCase(), list = (DISC_SYS[ext] || []).filter(s => typeof GI === "undefined" || GI[s]);
    if (!list.length || !p.title) return null;
    const hits = [];
    for (const s of list){ try { await loadList(s); const c = EV.cands(s, p); if (c[0] && c[0].s === 1) hits.push(s); } catch (e) {} }
    if (hits.length === 1) return hits[0];
    // the same title on two systems: the one you already have games for
    const mine = hits.filter(s => S.romFiles.some(f => f.sys === s));
    return mine.length === 1 ? mine[0] : null;
  };
}

// ===================================================================== Settings › Emu Vault: version only, until updates come from GitHub releases
selfHTML = function(){
  const s = S.self;
  return `<div class="form set-sec" id="self-sec"><h2>Emu Vault</h2>
    <div class="selfhead"><div><div class="selfver mono">v${esc(s.ver)}</div><div class="hint">Linux · your settings, lists, saves and backups are kept when you install a new version</div></div></div>
    <p class="hint" style="margin:0">A new version: run the new <span class="mono">.sh</span> or install the new <span class="mono">.deb</span>. Updating from inside the app comes when Emu Vault has its own release page.</p></div>`;
};
bindSelf = function(){};

// ===================================================================== Move to another device: also your choices (skips, patches, box shapes,
// box art, RetroAchievements user name, background checks), saved with a real file dialog
{
  const T2 = window.__TAURI__;
  const _ex = exportSettings;
  exportSettings = function(){
    const d = _ex(), c = (EV.OV && EV.OV.config) || {};
    delete d.boxArt.user; d.boxArt.source = "libretro";
    d.choices = JSON.parse(JSON.stringify(EV.UI || {}));
    d.app2 = { covers: c.covers, bg: c.bg, ra_user: c.ra_user || "", save_sources: c.save_sources, backup_when: c.backup_when, backup_keep: c.backup_keep, trash_days: c.trash_days, keep_langs: c.keep_langs, coll_mask: c.coll_mask, my_apps: c.my_apps, prefer: c.prefer };
    return d;
  };
  const _ap = applySettings;
  applySettings = function(d){
    const before = _ap(d);
    if (d.choices && typeof d.choices === "object") EV.mergeUI?.(d.choices);
    if (d.app2 && EV.OV){ const c = EV.OV.config, a = d.app2, keep = { ...c };
      for (const k of Object.keys(a)) if (a[k] !== undefined && a[k] !== null) keep[k] = a[k];
      if (a.covers) keep.covers = { ...c.covers, ...a.covers, esde_dir: `${EV.root()}/media` };
      EV.inv("save_settings", { cfg: keep }).then(ov => { EV.OV = ov; }).catch(e => toast(EV.errMsg(e)));
      if (a.bg && a.bg.on) EV.inv("bg_set", { bg: a.bg }).catch(() => {});
    }
    return before;
  };
  if (T2) downloadSettings = async function(){
    const data = JSON.stringify(exportSettings(), null, 2);
    let p = null; try { p = await T2.dialog.save({ defaultPath: "emu-vault-settings.json", filters: [{ name: "Emu Vault settings", extensions: ["json"] }], title: "Save your Emu Vault settings" }); } catch (e) {}
    if (!p) return;
    try { await EV.inv("write_text", { path: p, text: data }); log(`Settings exported to ${p}`); toast(`Saved: ${p}. Your RetroAchievements key is not in it.`); } catch (e) { toast(EV.errMsg(e)); }
  };
}
