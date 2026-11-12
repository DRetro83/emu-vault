// 0.16: Emu Vault updates itself from its GitHub releases. HOME › Settings › Emu Vault shows the version and
// a check button; on startup it checks by itself (unless you turn that off) and shows the new version with its
// notes. Update downloads the file that fits how you installed it (.sh, lite .sh or .deb) and restarts.
// Own module: remove this file and selfupd.css from index.html (and selfupd.rs) to take it out.
(() => {
const T = window.__TAURI__;
if (!T) return;
const inv = (c, a) => T.core.invoke(c, a);
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mb = b => (b / 1048576).toFixed(b > 104857600 ? 0 : 1) + " MB";
const say = m => typeof toast === "function" && toast(m);
const KIND = { sh: "the .sh", lite: "the lite .sh", deb: "the .deb", other: "a copy that can't update itself" };
const WIN = /Windows/i.test(navigator.userAgent);
if (WIN) KIND.other = "the portable .exe (download new versions from the release page for now)";
// idle | checking | current | available | downloading | ready | installing | error
const U = { st: "idle", info: null, err: "", got: 0, total: 0, path: "", denied: "" };
const auto = () => ls("ev-self-auto") !== "0";

// the release notes as short lines: "- New thing" and "* New thing", without markdown marks
function notes(body){
  const L = String(body || "").split(/\r?\n/).map(l => l.trim()).filter(l => /^[-*]\s+/.test(l)).map(l => l.replace(/^[-*]\s+/, "").replace(/\*\*|`/g, ""));
  return L.slice(0, 8);
}
function sync(){
  if (!S.self) return;
  S.self.state = U.st === "available" || U.st === "downloading" || U.st === "ready" ? U.st : "current";
  S.self.latest = U.info && U.info.newer ? { ver: U.info.latest } : null;
  try { renderSelfBadge(); } catch (e) {}
  const v = document.getElementById("view-set"); if (v && !v.hidden) try { renderSet(); } catch (e) {}
  const m = document.getElementById("selfupd"); if (m) m.querySelector(".su-body").innerHTML = body(true);
}
async function check(quiet){
  U.st = "checking"; U.err = ""; if (!quiet) sync();
  try { U.info = await inv("self_check"); U.st = U.info.newer ? "available" : "current"; }
  catch (e) { U.st = "error"; U.err = String(e); }
  sync();
  return U.info;
}
async function update(){
  const I = U.info; if (!I || !I.asset) return;
  U.st = "downloading"; U.got = 0; U.total = I.asset.size; U.denied = ""; sync();
  try { U.path = await inv("self_download", { asset: I.asset }); }
  catch (e) { U.st = "error"; U.err = String(e); sync(); return; }
  U.st = "installing"; sync();
  typeof log === "function" && log(`Emu Vault ${I.latest} downloaded, installing`);
  try { await inv("self_install", { path: U.path }); }   // the app closes and the new version starts
  catch (e) { const m = String(e); U.st = "ready"; U.denied = m === "cancelled" ? "cancelled" : m === "nopkexec" ? "nopkexec" : ""; if (!U.denied){ U.st = "error"; U.err = m; } sync(); }
}

// one block used in Settings and in the startup window
function body(win){
  const I = U.info, cur = (I && I.current) || (S.self && S.self.ver) || "";
  const bar = (p, t) => `<div class="su-bar" role="progressbar" aria-label="${esc(t)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><i style="width:${p}%"></i></div><p class="hint su-pt">${esc(t)}</p>`;
  const N = I ? notes(I.notes) : [];
  const btns = () => {
    if (!I) return "";
    if (I.kind === "other") return `<div class="gact"><a class="btn primary" href="${esc(I.page)}">Open the release page</a>${win ? `<button class="btn" data-su="later">Later</button>` : ""}</div><p class="hint" style="margin:0">This copy runs from ${esc(KIND.other)}. Download the new <span class="mono">.sh</span> or <span class="mono">.deb</span> from the release page.</p>`;
    if (!I.asset) return `<div class="gact"><a class="btn primary" href="${esc(I.page)}">Open the release page</a></div><p class="hint" style="margin:0">This release has no file for ${esc(KIND[I.kind])} yet.</p>`;
    return `<div class="gact"><button class="btn primary" data-su="go">Update and restart</button><button class="btn" data-su="later">Later</button>${win ? `<label class="inline su-skip" for="su-skip"><input type="checkbox" id="su-skip"> Skip ${esc(I.latest)}</label>` : ""}</div>
      <p class="hint" style="margin:0">Downloads ${esc(I.asset.name)} (${mb(I.asset.size)}).${I.kind === "deb" ? " Your system asks for your password to install it." : ""} Your vault, settings and GOG login stay as they are.</p>`;
  };
  let h = "";
  if (U.st === "checking") h = bar(35, "Checking GitHub for a new version…");
  else if (U.st === "current") h = `<div class="verdict ok"><b>Emu Vault is up to date.</b> ${esc(cur)} is the newest version.</div>`;
  else if (U.st === "error") h = `<div class="verdict warn"><b>${esc(U.err)}</b></div>${I && I.newer ? btns() : win ? `<div class="gact"><button class="btn" data-su="later">Close</button></div>` : ""}`;
  else if (U.st === "available") h = `<div class="verdict warn"><b>Emu Vault ${esc(I.latest)} is ready</b> · you have ${esc(cur)}${I.date ? ` · ${esc(I.date)}` : ""}</div>
      ${N.length ? `<div class="su-notes"><span class="hint">What's new</span>${N.map(n => `<span>· ${esc(n)}</span>`).join("")}</div>` : ""}${btns()}`;
  else if (U.st === "downloading"){ const p = U.total ? Math.min(100, Math.round(U.got / U.total * 100)) : 0; h = bar(p, `Downloading ${I.latest} · ${mb(U.got)} of ${mb(U.total)}`); }
  else if (U.st === "installing") h = bar(100, I && I.kind === "deb" ? "Installing… confirm with your password" : "Starting the new version…");
  else if (U.st === "ready") h = `<div class="verdict warn"><b>${U.denied === "cancelled" ? "The install was cancelled." : "Your system has no password window (pkexec) for the install."}</b> ${esc(I.latest)} is downloaded.</div>
      <div class="gact"><button class="btn primary" data-su="go2">Try again</button><button class="btn" data-su="deb">Open the .deb yourself</button>${win ? `<button class="btn" data-su="later">Later</button>` : ""}</div>`;
  else h = `<p class="hint" style="margin:0">Not checked yet.</p>`;
  return h;
}

// Settings › Emu Vault
selfHTML = function(){
  const I = U.info, cur = (I && I.current) || (S.self && S.self.ver) || "";
  return `<div class="form set-sec" id="self-sec"><h2>Emu Vault</h2>
    <div class="selfhead"><div><div class="selfver mono">v${esc(cur)}</div><div class="hint">${I ? `Installed with ${esc(KIND[I.kind])}` : (WIN ? "Windows" : "Linux")} · new versions come from <a href="https://github.com/DRetro83/emu-vault/releases">github.com/DRetro83/emu-vault</a></div></div>
      ${U.st === "checking" || U.st === "downloading" || U.st === "installing" ? "" : `<button class="btn small" data-su="check">Check for updates</button>`}</div>
    <div class="su-body">${body(false)}</div>
    <div class="field"><label class="inline" for="self-auto"><input type="checkbox" id="self-auto" ${auto() ? "checked" : ""}> Check for a new Emu Vault on startup</label></div>
  </div>`;
};
bindSelf = function(){
  const a = document.getElementById("self-auto"); if (a) a.onchange = () => { ls("ev-self-auto", a.checked ? null : "0"); say(a.checked ? "Emu Vault checks for a new version on startup" : "No check on startup; use Check for updates"); };
};

// the startup window, like the boot screen
function win(){
  if (document.getElementById("selfupd")) return;
  const el = document.createElement("div");
  el.id = "selfupd"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "A new Emu Vault");
  el.innerHTML = `<div class="su-box"><div class="rbar" aria-hidden="true"><span>EMU VAULT</span></div><span class="su-kick">NEW VERSION</span><div class="su-body">${body(true)}</div></div>`;
  document.body.appendChild(el);
  const b = el.querySelector("[data-su=go]"); if (b) b.focus();
}
const closeWin = () => { const w = document.getElementById("selfupd"); if (w) w.remove(); };

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-su]"); if (!t) return;
  ev.preventDefault();
  const k = t.dataset.su;
  if (k === "check") check(false).then(i => { if (i && !i.newer && U.st === "current") say(`Emu Vault ${i.current} is the newest version`); });
  else if (k === "go" || k === "go2") update();
  else if (k === "later"){ const sk = document.getElementById("su-skip"); if (sk && sk.checked && U.info){ ls("ev-self-skip", U.info.tag); say(`Emu Vault ${U.info.latest} skipped. Settings › Emu Vault still has it.`); } closeWin(); }
  else if (k === "deb") inv("self_open_deb").catch(e => say(String(e)));
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && document.getElementById("selfupd") && U.st !== "downloading" && U.st !== "installing") closeWin(); });
T.event.listen("self-progress", e => { U.got = e.payload.got; U.total = e.payload.total || U.total; if (U.st === "downloading") sync(); });

// 0.16.2: after an update, say where the new .sh went (or that the old one is still there)
inv("self_note").then(t => { if (!t) return; typeof log === "function" && log(t); setTimeout(() => say(t), 2500); }).catch(() => {});

// on startup: once the vault is loaded and the boot screen is gone
let tries = 0;
const wait = setInterval(async () => {
  if (++tries > 120){ clearInterval(wait); return; }
  if (!(typeof EV === "object" && EV.isReady && EV.isReady()) || document.getElementById("splash")) return;
  clearInterval(wait);
  if (!auto()) return;
  const i = await check(true);
  if (i && i.newer && ls("ev-self-skip") !== i.tag){ win(); typeof log === "function" && log(`Emu Vault ${i.latest} is available`); }
}, 500);
})();
