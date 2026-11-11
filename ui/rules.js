"use strict";
// Emu Vault — "Which region do you keep?": put regions in your order, World included,
// and leave out the ones you don't want (they only count when there is no other version).
{
  const ALL = ["US", "EU", "JP", "W", "OV"];
  const NAME = { US: "USA", EU: "Europe", JP: "Japan", W: "World", OV: "Other" };
  const ABOUT = { US: "(USA), (U)", EU: "(Europe), (E), and Germany, France…", JP: "(Japan), (J)", W: "(World): one version for every country", OV: "Korea, China, Brazil, Asia…" };
  S.regionsOff ||= [];
  const fix = () => {
    S.regions = S.regions.filter((r, i, a) => ALL.includes(r) && a.indexOf(r) === i);
    S.regionsOff = S.regionsOff.filter((r, i, a) => ALL.includes(r) && a.indexOf(r) === i && !S.regions.includes(r));
    // a region in neither list: World first (as before), the rest after your choices
    ALL.forEach(r => { if (!S.regions.includes(r) && !S.regionsOff.includes(r)){ if (r === "W") S.regions.unshift("W"); else if (r === "OV") S.regions.push("OV"); else S.regionsOff.push(r); } });
    if (!S.regions.length){ S.regions = [S.regionsOff.shift() || "US"]; }
  };
  const rank = g => { const i = S.regions.indexOf(g); return i >= 0 ? i : 40 + S.regionsOff.indexOf(g); };
  regionRank = function(regs){
    if (!regs.length) return 50;
    fix();
    return Math.min(...regs.map(r => { const g = REG_GROUP[r] || "OV"; return rank(g) + (g !== r ? 0.2 : 0); }));
  };
  ruleRank = r => { fix(); return rank(r); };
  regionRule = () => { fix(); const on = S.regions.map((r, i) => i === 0 ? `${NAME[r]} first` : `then ${NAME[r]}`).join(", ");
    return on + (S.regionsOff.length ? `; ${S.regionsOff.map(r => NAME[r]).join(" and ")} only when there's nothing else` : ""); };
  regionRuleHTML = function(){
    fix();
    const on = S.regions.map((r, i) => `<div class="rrow">
      <span class="rn">${i + 1}</span><span class="flag">${r === "OV" ? "OT" : r}</span><b>${NAME[r]}</b>
      <span class="muted rw">${i === 0 ? "first choice" : `if there is no ${S.regions.slice(0, i).map(x => NAME[x]).join(" or ")} version`} · ${esc(ABOUT[r])}</span>
      <span class="rbtn"><button data-rup="${i}" aria-label="Move ${NAME[r]} up" ${i === 0 ? "disabled" : ""}>▲</button><button data-rdown="${i}" aria-label="Move ${NAME[r]} down" ${i === S.regions.length - 1 ? "disabled" : ""}>▼</button><button data-roff="${r}" aria-label="Don't want ${NAME[r]}" title="Don't want ${NAME[r]}" ${S.regions.length < 2 ? "disabled" : ""}>✕</button></span></div>`).join("");
    const off = S.regionsOff.map(r => `<div class="rrow fixed off"><span class="rn">–</span><span class="flag q">${r === "OV" ? "OT" : r}</span><b>${NAME[r]}</b><span class="muted rw">not wanted: only kept when there is no other version · ${esc(ABOUT[r])}</span><span class="rbtn"><button data-ron="${r}" aria-label="Want ${NAME[r]} again" title="Add to my order">+</button></span></div>`).join("");
    return `<div class="rule">${on}
      ${off ? `<p class="lbl2" style="margin:8px 0 2px">Not wanted</p>${off}` : ""}
      <div class="rrow fixed"><span class="rn">·</span><span class="flag q">?</span><b>No region</b><span class="muted rw">always last: we look the region up in the database first, so this is only for files nobody knows</span><span></span></div>
      <p class="hint">In plain words: <b>${esc(regionRule())}</b>.</p>
      <p class="hint">▲▼ change the order. ✕ means you don't want that region: such a version is only kept when there is no version from your list, and in Duplicates it goes to _duplicates when a wanted one is there. + puts it back at the end of your order. Versions for a single country, like Germany or France, count as Europe. A file marked <span class="mono">(USA, Europe)</span> counts for both.</p></div>`;
  };
  bindRegionRule = function(after){
    const go = () => { S.dupKeep = {}; fix(); after(); EV.soon(); };
    document.querySelectorAll("[data-rup]").forEach(b => b.onclick = () => { const i = +b.dataset.rup; [S.regions[i - 1], S.regions[i]] = [S.regions[i], S.regions[i - 1]]; go(); });
    document.querySelectorAll("[data-rdown]").forEach(b => b.onclick = () => { const i = +b.dataset.rdown; [S.regions[i + 1], S.regions[i]] = [S.regions[i], S.regions[i + 1]]; go(); });
    document.querySelectorAll("[data-roff]").forEach(b => b.onclick = () => { const r = b.dataset.roff; if (S.regions.length < 2) return; S.regions = S.regions.filter(x => x !== r); S.regionsOff.push(r); toast(`${NAME[r]}: only kept when there is no other version`); go(); });
    document.querySelectorAll("[data-ron]").forEach(b => b.onclick = () => { const r = b.dataset.ron; S.regionsOff = S.regionsOff.filter(x => x !== r); S.regions.push(r); toast(`${NAME[r]} is back in your order, at the end. Use ▲ to move it up.`); go(); });
  };
  fix();
}
