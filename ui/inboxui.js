"use strict";
// Emu Vault — Inbox for big piles: the totals and a clean-up on top, "Not games" folded away at the bottom,
// and what you skip stays skipped.
{
  let sure = null;
  const n = x => x.toLocaleString("en-US");
  { const _sk = skipInbox; skipInbox = function(f){ EV.skip([f.loc]); return _sk(f); }; }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-oskip]");
    if (b){ const o = S.ib.other.find(x => x.id === b.dataset.oskip); if (o) EV.skip([o.loc]); }
  }, true);
  // games in the inbox that you already have: the same choice as in Duplicates (your region rule) for all of them at once
  let haveRun = null;
  const haveOf = f => f.id_done && (f.conf === "sure" || f.conf === "name") && !f.mismatch && !(f.special || []).length && ownedVersions(f).length;
  const haveTxt = () => { const k = S.inbox.filter(haveOf).length, todo = S.inbox.filter(f => !f.id_done).length;
    return `<b>${n(k)}</b> game${k === 1 ? "" : "s"} you already have${todo ? ` (${n(todo)} not checked yet)` : ""}. Your region rule decides which copy stays; the other goes to <span class="mono">_duplicates</span>.`; };
  async function handleHave(){
    if (haveRun) return;
    const list = [...S.inbox]; haveRun = { done: 0, total: list.length }; renderInboxTab();
    let last = performance.now();
    for (const f of list){ try { await identify(f); } catch (e) {} haveRun.done++; if (performance.now() - last > 400){ last = performance.now(); renderInboxTab(); await new Promise(r => setTimeout(r, 0)); } }
    const todo = S.inbox.filter(haveOf); let kept = 0, newer = 0, both = 0;
    for (const f of todo){ const o = ownedVersions(f), r0 = dupAdvice(f, o).rec, rec = r0 === "delete" ? "keepold" : r0; doDup(f, rec, o); if (rec === "keepold" || rec === "delete") kept++; else if (rec === "both") both++; else newer++; }
    haveRun = null;
    log(`Inbox: ${todo.length} games you already have handled (${kept} kept your copy, ${newer} took the new one, ${both} kept both because of another language)`);
    toast(todo.length ? `${n(todo.length)} games handled: your copy stayed ${n(kept)}×, the new one was better ${n(newer)}×${both ? `, both kept ${n(both)}× (other language)` : ""}` : "No games in the inbox that you already have");
    renderInboxTab(); renderStrip(); EV.sync();
  }
  const _rit = renderInboxTab;
  renderInboxTab = function(){
    _rit();
    if (S.ib.view !== "inbox") return;
    const box = $("#ib-box"); if (!box) return;
    const games = S.inbox.length, other = S.ib.other.length, unknown = S.ib.other.filter(o => !["bios", "app", "save"].includes(o.kind)).length, skipped = (S.ib.skipped || []).length;
    // "Not games" goes to the bottom, folded
    const og = [...box.children].find(c => c.classList.contains("group") && /^Not games/.test(c.querySelector("h2")?.textContent || ""));
    if (og){
      const d = document.createElement("details"); d.className = "ib-notgames"; d.open = isOpen("ib:notgames");
      d.innerHTML = `<summary><span class="t">Not games · ${n(other)}</span><span class="fs">BIOS files, app downloads and files Emu Vault doesn't know</span><span class="ib-na">${unknown ? `<button class="linkbtn" data-ibskipall="1">Skip the ${n(unknown)} unknown</button>` : ""}</span></summary>`;
      const list = og.querySelector(".ilist"); if (list) d.appendChild(list);
      og.remove(); box.appendChild(d);
      d.addEventListener("toggle", () => { d.open ? S.ui.open.add("ib:notgames") : S.ui.open.delete("ib:notgames"); });
    }
    // totals and clean-up on top
    const bar = document.createElement("div"); bar.className = "ib-clean";
    const btn = (k, label, cnt) => `<button class="btn small" data-ibclean="${k}" ${cnt ? "" : "disabled"}>${sure === k ? `Sure? Press again (${n(cnt)})` : `${label} · ${n(cnt)}`}</button>`;
    bar.innerHTML = `<details class="filt" ${isOpen("ib:clean") ? "open" : ""} data-k="ib:clean"><summary>Clean up the inbox <span class="fs">${n(games)} games · ${n(unknown)} unknown files · ${n(skipped)} skipped</span></summary>
        <p class="hint" style="margin:0">Removed files go to <span class="mono">_duplicates/inbox/</span> in your main folder: undo in Settings › Recent changes, deleted for good after ${S.trashDays ? `${S.trashDays} days` : "you empty _duplicates"}. These are the copies in the inbox; files you brought in from elsewhere are still there.</p>
        <div class="gact">${btn("other", "Remove the unknown files", unknown)}${btn("skipped", "Remove what's skipped", skipped)}${btn("all", "Empty the inbox", games + other + skipped)}</div>
        <div class="ib-have"><span>${haveTxt()}</span><button class="btn small" data-ibhave="1" ${haveRun ? "disabled" : ""}>${haveRun ? `Checking… ${n(haveRun.done)} of ${n(haveRun.total)}` : "Handle the games you already have"}</button></div>
        ${skipped ? `<button class="linkbtn" data-ibunskip="1" style="align-self:flex-start">Show the ${n(skipped)} skipped file${skipped === 1 ? "" : "s"} again</button>` : ""}
      </details>`;
    box.prepend(bar);
    bar.querySelector("details").addEventListener("toggle", ev => { ev.target.open ? S.ui.open.add("ib:clean") : S.ui.open.delete("ib:clean"); });
    box.querySelectorAll("[data-ibclean]").forEach(b => b.onclick = () => {
      const k = b.dataset.ibclean;
      if (sure !== k){ sure = k; renderInboxTab(); setTimeout(() => { if (sure === k){ sure = null; renderInboxTab(); } }, 4000); return; }
      sure = null; EV.cleanInbox(k);
    });
    const hv = box.querySelector("[data-ibhave]"); if (hv) hv.onclick = handleHave;
    const un = box.querySelector("[data-ibunskip]"); if (un) un.onclick = () => EV.unskipAll();
    const sa = box.querySelector("[data-ibskipall]"); if (sa) sa.onclick = e => { e.preventDefault(); e.stopPropagation(); const un = S.ib.other.filter(o => !["bios", "app", "save"].includes(o.kind)), l = un.map(o => o.loc); EV.skip(l); S.ib.skipped = [...(S.ib.skipped || []), ...un.map(o => ({ path: o.loc, name: o.name }))]; S.ib.other = S.ib.other.filter(o => !un.includes(o)); toast(`${n(l.length)} files skipped. BIOS files, saves and app downloads stay in the list. Skipped files stay in the inbox folder until you clean up.`); renderInboxTab(); updateInboxBadge?.(); renderHome?.(); };
  };
}
