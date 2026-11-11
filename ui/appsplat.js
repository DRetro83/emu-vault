// 0.10: Apps per platform (Linux · Windows · Android · All), which platforms and chips each app keeps,
// and the Catalog with the awesome-emulators list. Own module: remove this file, appsplat.css and their
// two lines in index.html to take it out (the render hook in preview.js then does nothing).
const EVAP = (() => {
const PLS = ["Linux", "Windows", "Android", "All"];
const KEYS = { Linux: "linux", Windows: "windows", Android: "android", macOS: "macos" };
const LBL = { linux: "Linux", windows: "Windows", android: "Android", macos: "macOS" };
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
let cur = PLS.includes(store("ev-apps-plat")) ? store("ev-apps-plat") : "Linux";
let catF = "new", catQ = "", busy = "";
const e = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MB = mb => mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : Math.max(1, Math.round(mb || 0)) + " MB";
const other = () => (EV.OV && EV.OV.machine === "aarch64") ? "x64" : "arm64";
const auto = a => a.src === "github" || a.src === "gitlab";

function chipOf(n){
  n = String(n).toLowerCase();
  if (/(^|[^a-z0-9])(aarch64|arm64|arm64-v8a)([^a-z0-9]|$)/.test(n)) return "arm64";
  if (/(^|[^a-z0-9])(armeabi-v7a|armv7|armhf|armeabi)([^a-z0-9]|$)/.test(n)) return "arm32";
  if (/(^|[^a-z0-9])(x86_64|x86-64|amd64|x64|win64)([^a-z0-9]|$)/.test(n)) return "x64";
  if (/(^|[^a-z0-9])(i386|i686|x86|win32)([^a-z0-9]|$)/.test(n)) return "x86";
  return "";
}
function typeOf(n){
  n = String(n).toLowerCase();
  for (const [r, t] of [[/\.appimage$/, "AppImage"], [/\.deb$/, ".deb"], [/\.flatpak$/, "Flatpak"], [/\.apk$/, "APK"], [/\.exe$/, ".exe"], [/\.msi$/, ".msi"], [/\.zip$/, ".zip"], [/\.7z$/, ".7z"], [/\.tar\.(gz|xz|zst)$|\.tgz$/, ".tar"], [/\.dmg$/, ".dmg"]]) if (r.test(n)) return t;
  return "file";
}

// apps from the sample screen (no core) have none of the 0.10 fields
function N(a){ a.avail ||= []; a.offers ||= []; a.keys ||= a.keep.map(p => KEYS[p]); a.files.forEach(f => { f.variant ||= ""; }); return a; }
// what one platform view shows of an app
function shows(a, p){
  N(a);
  if (!a.keep.includes(p)) return false;
  if (a.files.some(f => f.plat === p)) return true;
  // checked, and the releases have nothing for this platform: listed apart, not as a card
  if (auto(a) && a.checked && !a.avail.includes(KEYS[p])) return false;
  return true;
}
function project(full){
  full.forEach(N);
  if (cur === "All") return full;
  return full.filter(a => shows(a, cur)).map(a => {
    const files = a.files.filter(f => f.plat === cur);
    let update = a.update;
    if (update){ const as = update.assets.filter(x => x.plat.split(" · ")[0] === cur); update = as.length ? { ...update, assets: as } : null; }
    return { ...a, files, update, keep: a.keep.filter(p => p === cur), latest: files[0] ? { ver: files[0].ver, date: files[0].added.slice(0, 10) } : a.latest };
  });
}
const count = p => p === "All" ? MA.M.apps.length : MA.M.apps.filter(a => shows(a, p)).length;
function bar(n = true){
  return `<div class="seg ap-plat" role="group" aria-label="Platform">${PLS.map(p => `<button data-applat="${p}" aria-pressed="${cur === p}">${p}${n ? ` <span class="ap-n">${count(p)}</span>` : ""}</button>`).join("")}</div>`;
}

// ------------------------------------------------------------------ Apps
async function setPlats(id, keys, msg){
  busy = id;
  try { EVA.apply(await EV.inv("set_app_plats", { id, plats: keys })); if (msg) toast(msg); } catch (err) { toast(EV.errMsg(err)); }
  busy = ""; MA.render();
}
function keysOf(a){ return a.keys && a.keys.length ? a.keys.slice() : a.keep.map(p => KEYS[p]); }
function togglePlat(id, p){
  const a = MA.M.apps.find(x => x.id === id); if (!a) return;
  let k = keysOf(a); const key = KEYS[p];
  if (k.includes(key)){ if (k.filter(x => !/[@~]/.test(x)).length === 1){ toast("Keep at least one platform"); return; } k = k.filter(x => x !== key && !x.startsWith(key + "@") && !x.startsWith(key + "~")); }
  else k.push(key);
  setPlats(id, k, k.includes(key) ? `${a.name}: ${p} kept. Its newest ${p} file shows as an update.` : `${a.name}: ${p} no longer kept. Files already in Apps/${a.name}/${p}/ stay.`);
}
function toggleVar(id, k){
  const a = MA.M.apps.find(x => x.id === id); if (!a) return;
  let ks = keysOf(a); const on = !ks.includes(k);
  ks = on ? [...ks, k] : ks.filter(x => x !== k);
  setPlats(id, ks, on ? `${a.name}: this file is kept too. Press Download on its update.` : `${a.name}: no longer kept. Its files stay.`);
}
// ---- ticks: every file of the newest release for the platforms in view
const baseOf = k => String(k).split(/[@~]/)[0];
function relRows(a, vis){
  const bases = vis.map(p => KEYS[p]);
  return (a.release || []).filter(r => bases.includes(baseOf(r[0])));
}
function haveIt(id, key, name, ver){
  const av = (EVA.OVA || []).find(x => x.id === id), p = av && av.plats.find(x => x.plat === key);
  return !!(p && p.stored.some(s => s.version === ver || s.file === name));
}
function ticks(a, vis, inUpdate){
  const rows = relRows(a, vis);
  if (rows.length < (inUpdate ? 1 : 2)) return "";
  const vs = [...new Set(rows.map(r => r[3]))], ver = vs.length === 1 ? vs[0] : "";
  return `<div class="ap-ticks" data-aptick="${e(a.id)}">${inUpdate ? "" : `<span class="lbl2">Newest release${ver ? " " + e(ver) : "s"} · tick the files you keep</span>`}
    ${rows.map(([k, name, size, v]) => { const on = a.keys.includes(k), have = on && haveIt(a.id, k, name, v);
      return `<label class="ap-tick"><input type="checkbox" data-apfile="${e(k)}" data-apname="${e(name)}" ${on ? "checked" : ""}><span class="p">${e(EVA.labelOf ? EVA.labelOf(k) : k)}</span><span class="fn mono">${e(name)}</span><span class="muted">${size ? MB(size / 1048576) : ""}</span><span class="pill ${have ? "ok" : on ? "warn" : "plat"}">${have ? "have it" : on ? "to get" : "not kept"}</span></label>`; }).join("")}
    <div class="ma-row" style="gap:10px"><button class="btn small ${inUpdate ? "primary" : ""}" data-apget="${e(a.id)}" ${busy === a.id ? "disabled" : ""}>${busy === a.id ? "Working…" : "Download the ticked ones"}</button><span class="hint" style="margin:0">Ticks are remembered: Update all gets the same files of every new version.</span></div></div>`;
}
async function getTicked(id){
  const box = document.querySelector(`[data-aptick="${CSS.escape(id)}"]`), a = MA.M.apps.find(x => x.id === id);
  if (!box || !a) return;
  const ticked = [...box.querySelectorAll("[data-apfile]")].filter(x => x.checked).map(x => ({ key: x.dataset.apfile, name: x.dataset.apname }));
  const shown = [...new Set([...box.querySelectorAll("[data-apfile]")].map(x => baseOf(x.dataset.apfile)))];
  if (!ticked.length){ toast("Tick at least one file. To stop keeping a platform, use Keep for."); return; }
  busy = id; MA.render();
  try {
    // a base platform without its main file ticked: the first ticked one becomes the main file
    let check = false;
    for (const b of shown){
      const t = ticked.filter(x => baseOf(x.key) === b);
      if (t.length && !t.some(x => x.key === b)){ await EV.inv("set_prefer", { id, plat: b, file: t[0].name }); check = true; }
    }
    if (check) EVA.apply(await EV.inv("check_apps", { ids: [id] }));
    const av = (EVA.OVA || []).find(x => x.id === id), rel = (av && av.release) || [];
    const names = new Set(ticked.map(x => x.name));
    const keep = keysOf(a).filter(k => !shown.includes(baseOf(k)));
    for (const b of shown) if (ticked.some(x => baseOf(x.key) === b)) keep.push(...rel.filter(r => baseOf(r[0]) === b && names.has(r[1])).map(r => r[0]), b);
    const uniq = [...new Set(keep)];
    EVA.apply(await EV.inv("set_app_plats", { id, plats: uniq }));
    let n = 0;
    for (const k of uniq.filter(k => shown.includes(baseOf(k)))){
      const v = (EVA.OVA || []).find(x => x.id === id), p = v && v.plats.find(x => x.plat === k);
      if (p && (p.status === "update" || p.status === "missing")){ EVA.apply(await EV.inv("download_app", { id, plat: k })); n++; }
    }
    toast(n ? `${a.name}: ${n} file${n > 1 ? "s" : ""} downloaded` : `${a.name}: you have every ticked file`);
  } catch (err) { toast(EV.errMsg(err)); }
  busy = ""; MA.render();
}
function cardBox(a){
  const vis = cur === "All" ? a.keep : [cur];
  const files = a.files.filter(f => vis.includes(f.plat));
  let h = `<div class="ap-box"><div class="ma-row ap-keep"><span class="lbl2">Keep for</span>${["Linux", "Windows", "Android"].map(p => {
      const on = a.keep.includes(p), offered = !a.offers.length || a.offers.includes(KEYS[p]) || a.avail.includes(KEYS[p]) || a.files.some(f => f.plat === p);
      return `<button class="ma-chip" data-apkeep="${e(a.id)}|${p}" aria-pressed="${on}" ${busy === a.id ? "disabled" : ""} title="${offered ? "" : "The makers don't offer a " + p + " version"}">${p}${offered ? "" : " ?"}</button>`; }).join("")}</div>`;
  if (files.length) h += `<div class="ap-tw"><table class="ap-t"><thead><tr><th>File</th><th>Version</th><th>Type</th><th>Chip</th><th>Size</th></tr></thead><tbody>${files.map(f => `<tr><td class="mono">${e(f.file)}${f.hand ? ` <span class="pill plat">by hand</span>` : ""}</td><td>${e(f.ver)}</td><td>${e(typeOf(f.file))}</td><td>${e(f.variant || chipOf(f.file) || "–")}</td><td>${MB(f.mb)}</td></tr>`).join("")}</tbody></table></div>`;
  // 0.11: the files of the newest release, ticked = kept (also the Classic build, the v3 build, the arm64 one)
  if (!a.update) h += ticks(a, vis, false);
  for (const p of vis){
    const base = KEYS[p];
    for (const k of a.keys.filter(k => (k.startsWith(base + "~") || k.startsWith(base + "@")) && !(a.release || []).some(r => r[0] === k)))
      h += `<div class="hint">Also keeping the “${e(k.split(/[@~]/)[1])}” file, not in the newest release anymore. <button class="linkbtn" data-apvar="${e(a.id)}|${e(k)}">Stop</button></div>`;
  }
  return h + `</div>`;
}
function after(el){
  const n = $("#n-emu"), up = MA.updates().length; if (n){ n.textContent = up ? `${up} update${up > 1 ? "s" : ""}` : `${MA.M.apps.length}`; n.classList.toggle("quiet", !up); }
  if (MA.M.sub === "cat"){ bindCat(el); return; }
  if (MA.M.sub !== "mine") return;
  const tabs = el.querySelector(".ma-subtabs"); if (!tabs) return;
  const A = MA.M.apps, list = cur === "All" ? A : A.filter(a => shows(a, cur));
  const files = list.flatMap(a => a.files.filter(f => cur === "All" || f.plat === cur));
  let h = `<div class="ma-sum"><div><b>${list.length}</b>${cur === "All" ? "apps" : cur + " apps"}</div><div><b>${project(A).filter(a => a.update).length}</b>updates</div><div><b>${list.filter(a => !auto(a) && !a.retired).length}</b>by hand</div><div><b>${files.length ? MB(files.reduce((s, f) => s + f.mb, 0)) : "–"}</b>${cur === "All" ? "in Apps/" : "in Apps/*/" + cur} · ${files.length} files</div></div>`;
  const sum = el.querySelector(".ma-panel .ma-sum");
  if (sum){ sum.insertAdjacentHTML("beforebegin", bar()); sum.outerHTML = h; } else tabs.insertAdjacentHTML("afterend", `<div class="ma-panel">${bar()}${h}</div>`);
  const empty = el.querySelector(".ma-cards .empty-state");
  if (empty && cur !== "All" && A.length && !MA.M.q) empty.textContent = `No ${cur} apps yet. Keep ${cur} on an app (below, or on its card in All), or add one with “+ Add app”.`;
  el.querySelectorAll("article[data-macard]").forEach(card => {
    const a = A.find(x => x.id === card.dataset.macard), body = card.querySelector(".ma-body");
    if (!a || !body || body.hidden) return;
    const drop = body.querySelector(".ma-drop"); (drop || body.lastChild).insertAdjacentHTML(drop ? "beforebegin" : "afterend", cardBox(a));
    // 0.11: the update shows every file of the release with a tick
    const ua = body.querySelector(".ma-upd .ma-assets");
    if (ua && (a.release || []).length){ const t = ticks(a, cur === "All" ? a.keep : [cur], true); if (t){ ua.outerHTML = t; const hint = body.querySelector(".ma-upd > .hint"); if (hint) hint.textContent = "Tick the files you keep and press Download: they go into Apps/" + a.name + "/<platform>/<version>/ and the newest 3 stay. You can also drop a file you downloaded yourself on this card."; } }
  });
  if (cur !== "All"){
    const key = KEYS[cur], can = A.filter(a => !a.keep.includes(cur) && (a.avail.includes(key) || a.offers.includes(key)));
    const none = A.filter(a => a.keep.includes(cur) && !shows(a, cur));
    let x = "";
    if (can.length) x += `<div class="ma-panel"><div class="ma-row"><h3 class="ma-grow">Not kept for ${cur} · ${can.length}</h3></div><p class="hint">These apps also come for ${cur}. Keep makes Apps/&lt;app&gt;/${cur}/ and the newest ${cur} file shows as an update.</p>
      <div>${can.map(a => `<div class="ma-catrow"><div><b>${e(a.name)}</b> <span class="muted" style="font-size:12.5px">${a.avail.includes(key) ? "newest release has a " + cur + " file" : "offered for " + cur}</span></div><button class="btn small" data-apkeep="${e(a.id)}|${cur}" ${busy === a.id ? "disabled" : ""}>Keep ${cur}</button></div>`).join("")}</div></div>`;
    if (none.length) x += `<details class="ma-panel"><summary class="lbl2" style="cursor:pointer">Kept for ${cur}, but the releases have no ${cur} file · ${none.length}</summary><div>${none.map(a => `<div class="ma-catrow"><div><b>${e(a.name)}</b></div><button class="linkbtn" data-apkeep="${e(a.id)}|${cur}">Stop keeping ${cur}</button></div>`).join("")}</div></details>`;
    if (x){ const cards = el.querySelector(".ma-cards"); if (cards) cards.insertAdjacentHTML("afterend", x); }
  }
}

// ------------------------------------------------------------------ Catalog
const ALIAS = { "3ds": ["n3ds"], n3ds: ["3ds"], genesis: ["megadrive"], megadrive: ["genesis"], tg16: ["pcengine"], pcengine: ["tg16"] };
const KNOWN = { "pc.pcsx2": ["ps2"], "pc.duckstation": ["psx"], "pc.rpcs3": ["ps3"], "pc.cemu": ["wiiu"], "pc.xemu": ["xbox"], "pc.melonds": ["nds"], "pc.mgba": ["gba", "gb", "gbc"], "pc.shadps4": ["ps4"], "pc.vita3k": ["psvita"] };
const BYNAME = [[/azahar|lime3ds|citra/i, ["n3ds", "3ds"]], [/dolphin/i, ["gc", "wii"]], [/eden|citron|ryujinx|ryubing/i, ["switch"]], [/flycast/i, ["dreamcast", "naomi", "naomi2"]], [/ppsspp/i, ["psp"]], [/duckstation/i, ["psx"]], [/pcsx2|nethersx2|armsx2/i, ["ps2"]], [/melonds/i, ["nds"]], [/cemu/i, ["wiiu"]], [/xemu/i, ["xbox"]], [/vita3k/i, ["psvita"]], [/rpcs3|aps3e/i, ["ps3"]], [/shadps4|obliteration|pspsx4/i, ["ps4"]], [/gopher64|mupen/i, ["n64"]], [/scummvm/i, ["scummvm"]], [/winlator|gamehub|gamenative|mobox|box64|pluvia/i, ["windows"]]];
const RETRO = ["nes", "fds", "snes", "gb", "gbc", "gba", "megadrive", "genesis", "mastersystem", "gamegear", "sega32x", "segacd", "n64", "psx", "pcengine", "pcenginecd", "arcade", "neogeo", "atari2600", "atari7800", "atarilynx", "ngp", "ngpc", "wonderswan", "wonderswancolor", "virtualboy", "pokemini", "msx", "c64", "amiga", "zxspectrum", "colecovision", "intellivision", "vectrex"];
const nk = n => String(n).toLowerCase().replace(/\(.*?\)/g, "").replace(/\b(emulator|pc|the)\b/g, "").replace(/[^a-z0-9]/g, "");
function sysOf(av){
  if (av.systems && av.systems.length) return av.systems;
  if (KNOWN[av.id]) return KNOWN[av.id];
  for (const [r, s] of BYNAME) if (r.test(av.name)) return s;
  if (/^retroarch/i.test(av.name)) return RETRO;
  return [];
}
function offersOf(av){
  const o = new Set([...(av.offers || []), ...(av.avail || []).map(k => k.split("@")[0])]);
  if (!o.size){ if (av.pack === "Obtainium Emulation Pack") o.add("android"); else o.add("linux"); }
  av.plats.forEach(p => o.add(p.plat.split("@")[0]));
  return [...o];
}
const mine = () => { const m = new Set(typeof mySystemIds === "function" ? mySystemIds() : []); [...m].forEach(id => (ALIAS[id] || []).forEach(x => m.add(x))); return m; };
const sname = id => { try { return typeof biosName === "function" ? biosName(id) : id; } catch (err) { return id; } };
function catHTML(){
  const all = EVA.OVA || [], en = all.filter(a => a.enabled), haveN = new Map(en.map(a => [nk(a.name), a]));
  const key = cur === "All" ? "" : KEYS[cur], M2 = mine();
  const fits = av => !key || offersOf(av).includes(key);
  const have = av => av.enabled ? av : haveN.get(nk(av.name));
  const forMine = av => sysOf(av).some(s => M2.has(s));
  const q = catQ.trim().toLowerCase();
  const pool = all.filter(av => av.pack !== "My apps" && fits(av) && (!q || (av.name + " " + av.about + " " + sysOf(av).join(" ")).toLowerCase().includes(q)));
  const F = { new: pool.filter(av => !have(av)), mine: pool.filter(av => !have(av) && forMine(av)), have: pool.filter(av => have(av)), all: pool };
  const list = F[catF] || F.new;
  // recommended for the systems you have games for
  const awe = all.filter(av => av.pack === "Awesome Emulators" && fits(av));
  const sys = [...M2].filter(s => awe.some(av => (av.systems || []).includes(s)) && !(ALIAS[s] || []).some(x => M2.has(x) && x < s)).sort((x, y) => sname(x).localeCompare(sname(y)));
  const inV = s => en.filter(av => sysOf(av).includes(s) && (!key || av.plats.some(p => p.plat === key))).map(av => av.name);
  let h = `<div class="ma-panel">${bar(false)}
    <div class="ma-row ma-chips" role="group">${[["new", "Not in my vault yet"], ["mine", "For my systems"], ["have", "Already have"], ["all", "Everything"]].map(([k, l]) => `<button class="ma-chip" data-apcf="${k}" aria-pressed="${catF === k}">${l} · ${F[k].length}</button>`).join("")}</div>
    <p class="hint" style="margin:0">Active, recommended emulators from <a href="https://github.com/DerekTurtleRoe/awesome-emulators" target="_blank" rel="noopener">awesome-emulators</a> by DerekTurtleRoe (CC BY-NC-SA 4.0), the Obtainium Emulation Pack for Android and the PC emulators pack. Nothing is added until you press Add.</p></div>`;
  if (sys.length && catF !== "have") h += `<div class="ma-panel"><h3>Recommended for your systems${key ? " · " + cur : ""}</h3><div class="ap-tw"><table class="ap-t"><thead><tr><th>System</th><th>Recommended</th><th>In your vault</th><th></th></tr></thead><tbody>${sys.map(s => {
      const rec = awe.filter(av => (av.systems || []).includes(s)), v = inV(s), add = rec.find(av => !have(av));
      return `<tr><td>${e(sname(s))}</td><td>${e(rec.slice(0, 3).map(av => av.name).join(", "))}${rec.length > 3 ? ` <span class="muted">+${rec.length - 3}</span>` : ""}</td><td class="${v.length ? "ap-ok" : "ap-no"}">${v.length ? "✓ " + e(v.slice(0, 2).join(", ")) : "none" + (key ? " for " + cur : "")}</td><td>${add ? `<button class="btn small ${v.length ? "" : "primary"}" data-mafollow="${e(add.id)}">Add ${e(add.name)}</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div></div>`;
  h += `<div class="ma-panel"><div class="ma-row"><h3 class="ma-grow">${{ new: "Not in my vault yet", mine: "For my systems", have: "Already have", all: "Everything" }[catF]}</h3><input type="search" class="search" id="ap-catq" placeholder="Search name or system" value="${e(catQ)}" style="flex:0 1 260px;width:auto" aria-label="Search the catalog"></div>
    ${list.length ? `<div class="ap-tw"><table class="ap-t"><thead><tr><th>App</th><th>Plays</th><th>Updates</th><th>Also for</th><th>License</th><th></th></tr></thead><tbody>${list.slice(0, 250).map(av => {
      const h2 = have(av), also = offersOf(av).filter(p => p !== key).map(p => LBL[p] || p).join(", ");
      const upd = av.source === "github" || av.source === "gitlab" || av.source === "codeberg" || av.source === "forgejo" ? `<span class="ap-ok">auto · ${e({ github: "GitHub", gitlab: "GitLab" }[av.source] || av.source)}</span>` : av.source === "manual" ? "by hand · website" : av.source === "html" ? "auto · website" : "–";
      return `<tr><td><b>${e(av.name)}</b><div class="muted" style="font-size:12px">${e(av.pack)}</div></td><td class="muted">${e((av.about || "").slice(0, 90))}</td><td>${upd}</td><td class="muted">${e(also || "–")}</td><td class="muted">${e(av.license || "")}</td><td>${av.enabled ? `<span class="pill ok">in my list</span>` : h2 ? `<span class="pill plat" title="You have ${e(h2.name)}">have ${e(h2.name)}</span> <button class="linkbtn" data-mafollow="${e(av.id)}">Add anyway</button>` : `<button class="btn small" data-mafollow="${e(av.id)}">Add</button>`}</td></tr>`; }).join("")}</tbody></table></div>${list.length > 250 ? `<p class="hint">Showing 250 of ${list.length}. Search to narrow it down.</p>` : ""}` : `<div class="empty-state">Nothing here${q ? ` for “${e(catQ)}”` : ""}.</div>`}
    <p class="hint">Add puts the app in your list with the platforms from Settings it is offered for. Auto apps show their newest file as an update; website apps remind you to look.</p></div>`;
  h += `<details class="ma-panel"><summary class="lbl2" style="cursor:pointer">Packs</summary>${oldCat()}</details>`;
  return h;
}
let oldCat = () => "";
function bindCat(el){
  const qi = el.querySelector("#ap-catq");
  if (qi) qi.oninput = () => { catQ = qi.value; MA.render(); const n = $("#ap-catq"); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } };
}

// ------------------------------------------------------------------ events
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-applat],[data-apkeep],[data-apcf],[data-apvar],[data-apget]");
  if (!t) return;
  ev.preventDefault();
  if (t.dataset.applat){ cur = t.dataset.applat; store("ev-apps-plat", cur); MA.render(); }
  else if (t.dataset.apkeep){ const [id, p] = t.dataset.apkeep.split("|"); togglePlat(id, p); }
  else if (t.dataset.apget){ getTicked(t.dataset.apget); }
  else if (t.dataset.apvar){ const i = t.dataset.apvar.indexOf("|"); toggleVar(t.dataset.apvar.slice(0, i), t.dataset.apvar.slice(i + 1)); }
  else if (t.dataset.apcf){ catF = t.dataset.apcf; MA.render(); }
});
if (typeof EVA === "object"){ oldCat = EVA.catHTML; EVA.catHTML = catHTML; }
return { project, after, chipOf, typeOf, shows, ticks, sysOf, offersOf, nk, mine, sname, setCur(p){ if (PLS.includes(p)){ cur = p; store("ev-apps-plat", p); } }, get cur(){ return cur; } };
})();
window.EVAP = EVAP;
