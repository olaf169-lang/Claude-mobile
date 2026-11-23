/* M&B Goat Guide: Banici i najemnicy (bandyci, najemnicy z karczmy, frakcje pomniejsze) */
const RBU = RB.map(r=>({n:r[0], pl:r[1], g:r[2], f:r[3], t:r[4], r:r[5], sk:r[6], gr:r[7], w:r[8], up:r[9], note:r[10], src:r[11]}));
const RB_ORDER = {S:5, A:4, B:3, C:2, D:1};
let rbF = "all";

// nazwa jednostki w tekście awansu: jeśli jest w Wojskach, staje się linkiem do jej karty
function rbLink(name){
  const u = UBY[name];
  return u ? `<button type="button" class="rb-go" data-go="${esc(name)}">${esc(u.pl)}</button>` : esc(name);
}
function rbUp(txt){
  if(!txt || txt==="bd") return "bd";
  return txt.split(/(, potem | albo )/).map(p => {
    if(p===", potem " || p===" albo ") return esc(p);
    const m = p.match(/^([A-Z][A-Za-z' ]+?)(\s*\(.*\))?$/);
    return m ? rbLink(m[1].trim()) + esc(m[2]||"") : esc(p);
  }).join("");
}
function rbTop3(u){
  return u.sk.map((v,i)=>[v,i]).filter(([v])=>v!=null).sort((a,b)=>b[0]-a[0]).slice(0,3).map(([v,i])=>`<span class="pill">${SK[i]} ${v}</span>`).join("");
}
function rbCard(u){
  const G = RB_GROUPS[u.g];
  return `<article class="rb-card" style="--gc:${G.c}">
    <span class="gb" style="--g:var(--g${u.gr})" aria-label="Ocena ${u.gr}">${u.gr}</span>
    <div class="rb-main">
      <b>${esc(u.n)}</b><small>${esc(u.pl)}</small>
      <div class="zb-meta"><span class="rb-fac">${esc(u.f)}</span><span class="pill">${u.t?`T${u.t}`:"tier bd"}</span><span class="rb-role">${roleIco(u.r)}${ROLE[u.r]}</span></div>
      <div class="rb-sk">${rbTop3(u)}</div>
      <p class="rb-up"><span>Awans:</span> ${rbUp(u.up)}${u.w!=null?` <span class="rb-w">żołd ${u.w}</span>`:""}</p>
      ${u.note?`<p class="rb-note">${esc(u.note)}</p>`:""}
      <div class="src">Źródło: ${srcLink(u.src)}</div>
    </div></article>`;
}
function rbBindGo(root){
  root.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>goUnit(b.dataset.go)));
}
function rbRender(){
  const list = RBU.filter(u=>rbF==="all"||u.g===rbF).sort((a,b)=>(RB_ORDER[b.gr]-RB_ORDER[a.gr]) || ((b.t??3.5)-(a.t??3.5)) || (Math.max(...b.sk)-Math.max(...a.sk)));
  const n = list.length;
  $("rb-count").textContent = n===1 ? "1 jednostka" : (n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14) ? `${n} jednostki` : `${n} jednostek`);
  $("rb-list").innerHTML = list.map(rbCard).join("");
  rbBindGo($("rb-list"));
}
function rbInit(){
  const F = [["all","Wszyscy"], ...Object.entries(RB_GROUPS).map(([k,v])=>[k,v.n])];
  $("rb-f").innerHTML = F.map(([k,l])=>`<button class="chip" type="button" data-f="${k}" aria-pressed="${k===rbF}">${esc(l)}</button>`).join("");
  $("rb-f").querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{ rbF = b.dataset.f; $("rb-f").querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed", x===b)); rbRender(); }));
  const TOP = [["Forest Bandit","Dla battańskiego klanu najlepsza inwestycja: łuk 150, a dalej Fianowie."],["Lake Rat Wrecker","Twoje Jeziorne Szczury: oszczepy i drzewce po 110, świetna zbroja."],["Sea Raider Chief","Piechota 160 w jednej ręce, potem sturgijska drużyna."],["Hired Crossbow","Najlepszy strzelec do kupienia w karczmie."],["Triarii","Najtańszy porządny garnizon, 8 denarów dziennie."]];
  $("rb-top").innerHTML = TOP.map(([n,why])=>{ const u = RBU.find(x=>x.n===n);
    return `<div class="rb-pick"><span class="gb" style="--g:var(--g${u.gr})">${u.gr}</span><div><b>${esc(u.n)}</b> <small>${esc(u.pl)}</small><p>${esc(why)}</p></div></div>`; }).join("");
  $("rb-paths").innerHTML = RB_PATHS.map(([a,via,to,txt,s])=>`<div class="rb-path">
      <div class="rb-chain"><span class="rb-from">${esc(a)}</span><span class="rb-arr" aria-hidden="true">${ico("chev")}</span>${via?`${rbLink(via)}<span class="rb-arr" aria-hidden="true">${ico("chev")}</span>`:""}${rbLink(to)}</div>
      <p>${esc(txt)} <span class="src">${srcLink(s)}</span></p></div>`).join("");
  rbBindGo($("rb-paths"));
  $("rb-how").innerHTML = Object.values(RB_GROUPS).map(G=>`<div class="camp-item" style="--gc:${G.c}"><div><b>${esc(G.n)}</b><p>${esc(G.how)}</p><div class="src">Źródło: ${srcLink(G.howSrc)}</div></div></div>`).join("")
    + RB_TIPS.map(([t,b,s])=>`<div class="camp-item"><div><b>${esc(t)}</b><p>${esc(b)}</p><div class="src">Źródło: ${srcLink(s)}</div></div></div>`).join("");
  rbRender();
}
rbInit();
