// Duplicates: try each version before you choose. "Test" starts that file once, with the emulator
// chosen for the system or another one from the list under the group (only for this test).
(() => {
if (typeof bindDups !== "function") return;
let opts = null, asking = false;
const pickFor = {};   // group key -> emulator for the test
function getOpts(){
  if (opts || asking || typeof EV === "undefined" || !EV.inv) return;
  asking = true;
  EV.inv("play_options").then(o => { opts = o || []; asking = false; decorate(); }).catch(() => { opts = []; asking = false; });
}
function decorate(){
  if (!document.querySelector(".dgroup [data-v]")) return;
  let groups; try { groups = findDups(); } catch (e) { return; }
  const G = Object.fromEntries(groups.map(g => [g.key, g]));
  document.querySelectorAll(".dgroup").forEach(art => {
    const first = art.querySelector("[data-v]"); if (!first) return;
    const g = G[first.dataset.g]; if (!g) return;
    const sp = (opts || []).find(p => p.sys === g.sys);
    const cur = pickFor[g.key] || (sp ? sp.choice : "");
    art.querySelectorAll(".vrow").forEach(row => {
      if (row.querySelector(".dtest")) return;
      const c = row.querySelector("[data-v]"), v = g.variants.find(x => x.id === c.dataset.v); if (!v) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn small dtest"; b.textContent = "▶ Test"; b.title = "Start this file to see if it works and what it is";
      b.onclick = async e => {
        e.preventDefault(); e.stopPropagation();
        const f = v.files[0], w = pickFor[g.key] || (sp ? sp.choice : "");
        if (!f || !f.loc){ toast("Open Emu Vault as an app to test games."); return; }
        b.disabled = true; b.textContent = "Starting…";
        try { await EV.inv("play", { path: f.loc, sys: g.sys, with: w || null }); toast(`Testing ${f.name}${sp && w ? ` with ${(sp.options.find(o => o[0] === w) || [, w])[1]}` : ""}. Close the emulator to come back.`); }
        catch (err) { toast(typeof errMsg === "function" ? errMsg(err) : String(err)); }
        setTimeout(() => { b.disabled = false; b.textContent = "▶ Test"; }, 2500);
      };
      const dest = row.querySelector(".dest");
      row.insertBefore(b, dest);
    });
    const act = art.querySelector(".gact");
    if (act && sp && sp.options.length > 1 && !act.querySelector(".dtest-with")){
      const lab = document.createElement("label");
      lab.className = "dtest-with";
      lab.innerHTML = `<span class="muted">Test with</span> <select>${sp.options.map(([val, name, ready]) => `<option value="${esc(val)}" ${val === cur ? "selected" : ""}>${esc(name)}${ready ? "" : " · not there yet"}</option>`).join("")}</select>`;
      lab.querySelector("select").onchange = e => { pickFor[g.key] = e.target.value; };
      act.appendChild(lab);
    }
  });
}
const _bind = bindDups;
bindDups = function(){ const r = _bind.apply(this, arguments); try { if (!opts) getOpts(); decorate(); } catch (e) {} return r; };
const st = document.createElement("style");
st.textContent = `.vrow:has(.dtest){grid-template-columns:auto minmax(0,1fr) auto auto}
.vrow .dtest{align-self:center;white-space:nowrap}
.gact .dtest-with{display:inline-flex;align-items:center;gap:6px;margin-left:auto;font-size:12.5px}
.gact .dtest-with select{width:auto;max-width:260px}
@media (max-width:560px){.vrow:has(.dtest){grid-template-columns:auto minmax(0,1fr) auto}.vrow .dtest{grid-column:2}}`;
document.head.appendChild(st);
})();
