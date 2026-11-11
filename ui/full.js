// "Make a full package": emu-vault-full-<version>.sh with RetroArch, ES-DE and Heroic inside.
// Separate file: remove it and its line in index.html (and bundle.rs) to take it out.
(() => {
try {
const T = window.__TAURI__; if (!T || typeof renderSet !== "function") return;
const inv = (c, a) => T.core.invoke(c, a);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const gb = b => b >= 1073741824 ? (b / 1073741824).toFixed(1) + " GB" : Math.max(1, Math.round(b / 1048576)) + " MB";
const say = m => (typeof toast === "function" ? toast(m) : console.log(m));
let I = null, busy = "", last = "";
const load = async () => { try { I = await inv("full_info"); } catch (e) { I = null; } };

SET_SUB["Full package"] = () => I ? [I.retroarch && "RetroArch", I.esde && "ES-DE", I.heroic && "Heroic"].filter(Boolean).join(", ") + (I.from_full ? " · this is a full package" : "") || "Get RetroArch, ES-DE or Heroic first" : "";

function html() {
  if (!I) return "";
  const row = (name, ver, size, missing) => `<li>${ver ? `<b>${name}</b> ${esc(ver)} · ${gb(size)}` : `<span class="muted">${name}: not in the vault yet. ${missing}</span>`}</li>`;
  const total = I.base_size + I.retroarch_size + I.esde_size + I.heroic_size;
  return `<div class="form set-sec" id="full-sec"><h2>Full package</h2>
    <p class="hint" style="margin:0">Makes <span class="mono">emu-vault-full-…sh</span>: Emu Vault with what is in your vault now. On a new drive or pc it puts these in the main folder on the first start, without internet. What is already there is never overwritten.</p>
    <ul class="full-list" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:14px">
      ${row("RetroArch", I.retroarch, I.retroarch_size, "Get it on Home or in ROMs → Tools.")}${I.retroarch ? `<li class="muted" style="list-style:none;margin-top:-4px">${I.cores} cores, without your saves, states and settings</li>` : ""}
      ${row("ES-DE", I.esde, I.esde_size, "Get it on Home.")}
      ${row("Heroic", I.heroic, I.heroic_size, "Get it in GOG Settings.")}
    </ul>
    <p class="hint" style="margin:0">About ${gb(total)} before packing, a good part less after. It takes a few minutes and the same free space twice while packing.</p>
    ${I.can ? `<button class="btn primary" id="full-make" style="align-self:flex-start" ${busy || !(I.retroarch || I.esde || I.heroic) ? "disabled" : ""}>${busy ? "Packing… " : "Make a full package…"}</button>` : `<p class="hint" style="margin:0">${esc(I.why)}</p>`}
    ${busy ? `<p class="hint" style="margin:0">${esc(busy)}</p>` : last ? `<p class="hint" style="margin:0">${last}</p>` : ""}
    <p class="hint" style="margin:0">RetroArch and Heroic are GPLv3, ES-DE is MIT: their licenses and source links go into the package. Some RetroArch cores are for non-commercial use only, so check before you share the package with others.</p>
  </div>`;
}
const _set = renderSet;
renderSet = function () {
  _set.apply(this, arguments);
  const root = $("#view-set > div"); if (!root || root.querySelector("#full-sec") || !I) return;
  root.insertAdjacentHTML("beforeend", html());
};
document.addEventListener("click", async e => {
  if (!e.target.closest || !e.target.closest("#full-make")) return;
  let to = null;
  try { to = await T.dialog.save({defaultPath: `emu-vault-full-${I.ver}.sh`, title: "Where the full package goes"}); } catch (x) {}
  if (!to) return;
  busy = "Copying and packing… this takes a few minutes"; rerender();
  try { const what = await inv("full_make", {to}); last = `Made <span class="mono">${esc(to)}</span> with ${esc(what)}.`; say("Full package ready"); }
  catch (x) { last = `<span style="color:var(--bad)">${esc(String(x))}</span>`; say(String(x)); }
  busy = ""; await load(); rerender();
});
function rerender() { if ($("#view-set") && !$("#view-set").hidden) renderSet(); }
T.event.listen("full-progress", e => { if (busy) { busy = e.payload; rerender(); } });
T.event.listen("full-applied", e => say(`From the full package: ${e.payload} put in your main folder`));
document.querySelectorAll('.tab[data-tab="set"]').forEach(t => t.addEventListener("click", () => { load().then(() => { if (!$("#full-sec")) renderSet(); }); }));
load();
} catch (err) { console.error("Full package part failed, the rest keeps working:", err); }
})();
