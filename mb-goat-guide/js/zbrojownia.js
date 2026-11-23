/* M&B Goat Guide: Zbrojownia (najlepszy sprzęt i tablica mistrzów kultur) */
const ZB_CULTS = ["emp","vla","stu","bat","ase","khu","nor"];
const ZB_ABBR = { emp:"Ces", vla:"Wla", stu:"Stu", bat:"Bat", ase:"Ase", khu:"Huz", nor:"Nor" };
const zbName = c => c==="any" ? "bez kultury" : CULT[c].n;
const zbCol = c => c==="any" ? "var(--muted)" : CULT[c].c;
const zbNum = v => v==null ? "bd" : String(v);

function zbMatrix(){
  const head = `<div class="zb-line zb-head"><span class="zb-rl"></span>${ZB_CULTS.map(c=>`<button type="button" class="zb-cc" data-c="${c}" style="--cc:${CULT[c].c}" aria-label="Mocne strony: ${CULT[c].n}"><span class="zb-cell ch"></span><small>${ZB_ABBR[c]}</small></button>`).join("")}</div>`;
  let grp = "";
  const rows = ARMORY.map(a=>{
    const g = a.grp!==grp ? `<div class="zb-grp">${esc(a.grp)}</div>` : ""; grp = a.grp;
    const cells = ZB_CULTS.map(c=>{
      const ch = a.champ.includes(c), has = a.items.some(i=>i[2]===c);
      const lbl = `${CULT[c].n}: ${ch ? "najlepsze" : has ? "w czołówce" : "brak w czołówce"}`;
      return `<span class="zb-cell${ch?" ch":has?" has":""}" style="--cc:${CULT[c].c}" role="img" aria-label="${lbl}" title="${lbl}"></span>`;
    }).join("");
    return g + `<button type="button" class="zb-line zb-row" data-id="${a.id}"><span class="zb-rl">${ico(a.ic)}<b>${esc(a.s||a.n)}</b></span>${cells}</button>`;
  }).join("");
  $("zb-mx").innerHTML = head + rows;
  $("zb-mx").querySelectorAll(".zb-row").forEach(b=>b.addEventListener("click",()=>{
    const el = $("zb-"+b.dataset.id); if(!el) return;
    el.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"start"});
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }));
  $("zb-mx").querySelectorAll(".zb-cc").forEach(b=>b.addEventListener("click",()=>zbCult(b.dataset.c)));
}

let zbSel = null;
function zbCult(c){
  const box = $("zb-cult");
  document.querySelectorAll(".zb-cc").forEach(b=>b.setAttribute("aria-pressed", b.dataset.c===c && zbSel!==c));
  if(zbSel===c){ zbSel = null; box.hidden = true; return; }
  zbSel = c;
  const wins = ARMORY.filter(a=>a.champ.includes(c));
  const tops = ARMORY.flatMap(a=>a.items.filter(i=>i[2]===c).map(i=>[a,i])).slice(0,8);
  box.style.setProperty("--cc", CULT[c].c);
  box.innerHTML = `<b>${esc(CULT[c].n)}</b>${c==="nor"?` <span class="pill">tylko z War Sails</span>`:""}
    <p>${wins.length ? `Najlepsze w: ${wins.map(a=>esc(a.n.toLowerCase())).join(", ")}.` : "Nie wygrywa żadnej kategorii, ale ma mocne przedmioty niżej."}</p>
    ${tops.length ? `<ul>${tops.map(([a,i])=>`<li><b>${esc(i[0])}</b> <span>${esc(a.n.toLowerCase())}${i[4]!=null?`, ${i[4]}`:""}</span></li>`).join("")}</ul>` : ""}`;
  box.hidden = false;
}

function zbCards(){
  $("zb-cards").innerHTML = ARMORY.map(a=>{
    const max = Math.max(1, ...a.items.map(i=>i[4]||0));
    const srcs = [...new Set([...a.items.map(i=>i[7]), a.tipSrc].filter(Boolean))];
    const champ = a.champ.map(c=>`<span class="zb-cult" style="--cc:${zbCol(c)}"><i></i>${esc(zbName(c))}</span>`).join("");
    const rows = a.items.map(([en,pl,c,t,v,extra,note],k)=>`
      <li class="zb-it${k===0?" top":""}" style="--cc:${zbCol(c)}">
        <span class="zb-rk">${k+1}</span>
        <div class="zb-body">
          <b>${esc(en)}</b><small>${esc(pl)}</small>
          <div class="zb-meta"><span class="zb-cult"><i></i>${esc(zbName(c))}</span>${t?`<span class="pill">T${t}</span>`:""}${extra?`<span>${esc(extra)}</span>`:""}</div>
          ${note?`<p>${esc(note)}</p>`:""}
        </div>
        <div class="zb-val${v==null?" na":""}"><strong>${zbNum(v)}</strong>${v!=null?`<span class="zb-bar"><i style="width:${Math.round(v/max*100)}%"></i></span>`:""}</div>
      </li>`).join("");
    return `<section class="sec zb-card" id="zb-${a.id}" aria-labelledby="zbh-${a.id}">
      <div class="panel">
        <header class="zb-ch"><div class="pennant" style="--tc:${zbCol(a.champ[0])}">${ico(a.ic)}</div>
          <div><h3 id="zbh-${a.id}">${esc(a.n)}</h3><div class="zb-champ">Mistrz: ${champ}</div></div></header>
        <p class="zb-why">${esc(a.why)}</p>
        <p class="zb-stat">Liczba po prawej: ${esc(a.stat)}${a.stat==="wybór graczy"?"":", im więcej, tym lepiej"}.</p>
        <ol class="zb-list">${rows}</ol>
        ${a.tip?`<div class="zb-tip">${esc(a.tip)}</div>`:""}
        <div class="src">Źródła: ${srcs.map(srcLink).join(", ")}</div>
      </div></section>`;
  }).join("");
}

function zbHow(){
  $("zb-how").innerHTML = ARMORY_HOW.map(([t,b,s])=>`<div class="camp-item"><div><b>${esc(t)}</b><p>${esc(b)}</p><div class="src">Źródło: ${srcLink(s)}</div></div></div>`).join("");
}
zbMatrix(); zbCards(); zbHow();
