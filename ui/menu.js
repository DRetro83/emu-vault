// 0.14: the menu in four groups, each about one thing.
//   HOME  Overview · Inbox · Setup check · Settings (general)
//   EMU   Collection · ROMs · BIOS · Backups · Settings (games: region, box art, folders…)
//   GOG   (as it was)
//   APPS  Linux x64 … · Get more apps · Settings (keep apps for, versions, updates, page style, RetroArch extras)
// The settings stay one page underneath (renderSet); this module moves each fold to the group it belongs to.
// Own module: remove this file, its css and line in index.html to go back.
(() => {
const ICO = '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>';
const tab = (k, lb, cls) => `<button class="tab ${cls}" role="tab" data-tab="${k}" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true">${ICO}</svg><span class="lb">${lb}</span><span class="n quiet" id="n-${k}"></span></button>`;
// which settings fold goes where (by its title); the rest stays in HOME › Settings
const EMU_FOLDS = [/^Box art/, /^Which region/, /^Games in other folders/, /^Add your own/, /^RetroArch/, /^ES-DE/, /^Emulators?\b/, /^Saves/];
const APP_FIELDS = [/^App list/, /^Keep apps for/, /^Versions to keep/, /^Check for updates/, /^Download for/];
const title = d => ((d.querySelector("summary .ft") || d.querySelector("summary") || d).textContent || "").replace(/\s+/g, " ").trim();

function build(){
  const nav = document.querySelector("nav.tabs"); if (!nav || nav.querySelector(".home-sec")) return;
  const q = k => nav.querySelector(`.tab[data-tab="${k}"]`);
  const first = nav.querySelector(".rbar.side-sec"); if (!first) return;
  first.classList.add("home-sec"); first.querySelector("span").textContent = "HOME";
  const lb = q("home") && q("home").querySelector(".lb"); if (lb) lb.textContent = "Overview";
  // HOME: overview, inbox, setup check, settings
  let at = q("home"); for (const k of ["inbox", "setup", "set"]) { const t = q(k); if (t){ at.after(t); at = t; } }
  // EMU: collection, ROMs, BIOS, backups, its own settings
  at.insertAdjacentHTML("afterend", `<div class="rbar side-sec emu-sec" role="presentation"><span>EMU</span></div>`);
  at = at.nextElementSibling;
  for (const k of ["coll", "roms", "emu", "bios", "bk"]) { const t = q(k); if (t){ at.after(t); at = t; } }
  at.insertAdjacentHTML("afterend", tab("emuset", "Settings", "emu-set-tab"));
  // APPS: its own settings at the end of the group
  const appsLast = [...nav.querySelectorAll(".apps-tab")].pop();
  if (appsLast) appsLast.insertAdjacentHTML("afterend", tab("appset", "Settings", "apps-set-tab"));
  // the two new pages
  const main = document.querySelector("main.app"), logEl = main && main.querySelector("details.log");
  for (const k of ["emuset", "appset"]) { const s = document.createElement("section"); s.id = "view-" + k; s.className = "view"; s.hidden = true; main.insertBefore(s, logEl); }
  for (const k of ["emuset", "appset"]) q(k).addEventListener("click", () => open(k));
  // titles: ~/home/…, ~/emu/…
  nav.querySelectorAll(".tab[data-tab]").forEach(t => t.addEventListener("click", () => setTimeout(() => titleFor(t), 0)));
  const sel = nav.querySelector('.tab[aria-selected="true"]'); if (sel) setTimeout(() => titleFor(sel), 50);
}
// 0.14.2: GOG above EMU (the default), or EMU first: HOME › Settings › Menu
const gogFirst = () => { try { return localStorage.getItem("ev-gog-first") !== "0"; } catch (e) { return true; } };
function order(){
  const nav = document.querySelector("nav.tabs"); if (!nav) return;
  const emuH = nav.querySelector(".emu-sec"), gogH = [...nav.querySelectorAll(".rbar.side-sec")].find(h => /GOG/.test(h.textContent));
  if (!emuH || !gogH) return;
  const grab = h => { const out = [h]; let n = h.nextElementSibling; while (n && !n.classList.contains("side-sec") && !n.classList.contains("rbar") && n.id !== "tab-more") { out.push(n); n = n.nextElementSibling; } return out; };
  const emu = grab(emuH), gog = grab(gogH);
  if (gogFirst()) gog.forEach(x => emuH.before(x)); else emu.forEach(x => gogH.before(x));
}
function titleFor(t){
  const pt = document.getElementById("ptitle"); if (!pt || t.classList.contains("apps-tab")) return;
  const k = t.dataset.tab, grp = ["home", "inbox", "setup", "set"].includes(k) ? "home" : t.classList.contains("gog-tab") ? "gog" : t.classList.contains("apps-set-tab") ? "apps" : "emu";
  pt.textContent = grp + "/" + t.querySelector(".lb").textContent.toLowerCase().replace(/ /g, "-");
}
function open(k){
  document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected", String(x.dataset.tab === k)));
  document.querySelectorAll(".view").forEach(v => v.hidden = v.id !== "view-" + k);
  try { window.scrollTo({ top: 0 }); } catch (e) {}
  renderSet();
}
// after the settings page is drawn: hand each fold to its group
function split(){
  const src = document.getElementById("view-set"), emu = document.getElementById("view-emuset"), app = document.getElementById("view-appset");
  if (!src || !emu || !app) return;
  const keepE = emu.querySelectorAll("details[open]"), keepA = app.querySelectorAll("details[open]");
  const wasOpen = new Set([...keepE, ...keepA].map(title));
  emu.innerHTML = `<div class="set-col"><p class="hint">Settings for your games: covers, regions, folders with games, what you add yourself.</p></div>`;
  app.innerHTML = `<div class="set-col"><p class="hint">Settings for your apps. General things (the vault folder, look, storage, notifications) are in HOME › Settings.</p></div>`;
  const ec = emu.firstElementChild, ac = app.firstElementChild;
  src.querySelectorAll("details.setfold").forEach(d => { if (EMU_FOLDS.some(r => r.test(title(d)))) { if (wasOpen.has(title(d))) d.open = true; ec.appendChild(d); } });
  // apps: the app fields out of "Folders & downloads", and per-app notifications
  const fold = document.createElement("div"); fold.className = "form set-sec"; fold.innerHTML = `<h2>Downloads</h2>`;
  src.querySelectorAll(".field").forEach(f => { const l = f.querySelector(".lbl"); if (l && APP_FIELDS.some(r => r.test(l.textContent.trim()))) fold.appendChild(f); });
  if (fold.children.length > 1) ac.appendChild(fold);
  const per = [...src.querySelectorAll("details.codes")].find(d => /^Updates per app/.test(title(d)));
  if (per) { const w = document.createElement("div"); w.className = "form set-sec"; w.innerHTML = `<h2>Notifications per app</h2>`; w.appendChild(per); ac.appendChild(w); }
  ac.insertAdjacentHTML("beforeend", pageBox());
  src.querySelectorAll("details.setfold summary .ft").forEach(f => { if (f.textContent.trim() === "Folders & downloads") f.textContent = "Vault folder"; });
  // HOME › Settings: tell where the rest went
  if (!src.querySelector(".menu-order") && src.firstElementChild) src.firstElementChild.insertAdjacentHTML("afterbegin", `<div class="field menu-order"><label class="inline" for="gog-first"><input type="checkbox" id="gog-first" ${gogFirst() ? "checked" : ""}> GOG above EMU in the menu</label></div>`);
  if (!src.querySelector(".moved-note")) src.firstElementChild && src.firstElementChild.insertAdjacentHTML("afterbegin", `<p class="hint moved-note">Settings for games are in <button class="linkbtn" data-goset="emuset">EMU › Settings</button>, for apps in <button class="linkbtn" data-goset="appset">APPS › Settings</button>, for GOG in GOG › Settings.</p>`);
}
function pageBox(){
  const simple = !window.EVS || EVS.simple, auto = (() => { try { return localStorage.getItem("ev-auto-dl") === "1"; } catch (e) { return false; } })();
  return `<div class="form set-sec"><h2>The apps pages</h2>
    <div class="field"><span class="lbl">Page style</span><div class="seg" role="group"><button data-pgmode="1" aria-pressed="${simple}">Simple</button><button data-pgmode="0" aria-pressed="${!simple}">Expert</button></div>
      <p class="hint">Simple: one line per app and one button. Expert: every file, version and chip.</p></div>
    <div class="field"><label class="inline" for="pg-auto"><input type="checkbox" id="pg-auto" ${auto ? "checked" : ""}> Download new versions by itself</label><p class="hint">While Emu Vault is open: when it starts and every 6 hours.</p></div>
    <div class="field"><span class="lbl">RetroArch extras</span><p class="hint" style="margin:0">Shaders, overlays, cheats, databases and system files for cores, from libretro.</p><button class="btn small" data-pgraex style="align-self:flex-start">Open RetroArch extras</button></div></div>`;
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-goset],[data-pgmode],[data-pgraex]"); if (!t) return;
  ev.preventDefault();
  if (t.dataset.goset){ const b = document.querySelector(`.tab[data-tab="${t.dataset.goset}"]`); if (b) b.click(); }
  else if (t.dataset.pgmode){ const on = t.dataset.pgmode === "1"; if (window.EVS && EVS.setSimple) EVS.setSimple(on); else { try { localStorage.setItem("ev-simple", on ? "1" : "0"); } catch (e) {} } renderSet(); toast(on ? "Apps pages: Simple" : "Apps pages: Expert"); }
  else if (t.hasAttribute("data-pgraex")){ try { localStorage.setItem("ev-simple", "0"); localStorage.setItem("ev-raextras", "1"); } catch (e) {} location.reload(); }
});
document.addEventListener("change", ev => { if (ev.target && ev.target.id === "gog-first"){ try { localStorage.setItem("ev-gog-first", ev.target.checked ? "1" : "0"); } catch (e) {} order(); return; } if (ev.target && ev.target.id === "pg-auto"){ const sv = document.getElementById("sv-auto"); try { localStorage.setItem("ev-auto-dl", ev.target.checked ? "1" : "0"); } catch (e) {} if (sv) sv.checked = ev.target.checked; toast(ev.target.checked ? "New versions are downloaded by themselves." : "Downloads only when you press Download."); } });

// Overview: also what GOG and APPS have waiting
function homeExtra(){
  const v = document.getElementById("view-home"); if (!v || v.querySelector(".ov-more")) return;
  const rows = [];
  const gu = document.getElementById("n-gogupd"), gt = gu && gu.textContent.trim();
  if (gt && /\d/.test(gt)) rows.push(["gogupd", "GOG", `${gt} in your GOG backups`, "Open GOG Updates"]);
  document.querySelectorAll(".apps-tab:not([hidden])").forEach(b => { const n = b.querySelector(".n"); if (n && /update/.test(n.textContent)) rows.push(["apps:" + b.dataset.apsec, "APPS", `${b.querySelector(".lb").textContent}: ${n.textContent}`, "Open"]); });
  if (!rows.length) return;
  const list = v.querySelector(".hlist"); if (!list) return;
  list.insertAdjacentHTML("afterbegin", rows.map(([k, g, t, b]) => `<div class="hrow warn ov-more"><button class="hmain" data-ovgo="${k}"><span class="hico" aria-hidden="true">${g === "GOG" ? "G" : "↑"}</span><span class="htx"><b>${t}</b><span>${g}</span></span></button><button class="btn small" data-ovgo="${k}">${b}</button></div>`).join(""));
}
document.addEventListener("click", ev => { const t = ev.target.closest && ev.target.closest("[data-ovgo]"); if (!t) return; ev.preventDefault(); const k = t.dataset.ovgo;
  if (k.startsWith("apps:")){ const b = document.querySelector(`.apps-tab[data-apsec="${k.slice(5)}"]`); if (b) b.click(); } else { const b = document.querySelector(`.tab[data-tab="${k}"]`); if (b) b.click(); } });

window.addEventListener("DOMContentLoaded", () => {
  build(); order();
  // the folds are made right after drawing (tidy); split after that
  const rs = window.renderSet; window.renderSet = function(){ rs.apply(this, arguments); setTimeout(() => { try { split(); } catch (e) { console.error(e); } }, 0); };
  const rh = window.renderHome; window.renderHome = function(){ const r = rh.apply(this, arguments); try { homeExtra(); } catch (e) {} return r; };
  try { renderSet(); renderHome(); } catch (e) {}
  setInterval(() => { try { homeExtra(); } catch (e) {} }, 5000);
});
})();
