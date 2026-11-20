/* M&B Goat Guide: rdzeń aplikacji (widoki, Kodeks, Wojska, Drzewka, Narzędzia, Instalacja) */

/* ---------- wspólne ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = v => String(v).replace(".",",");
const COMBAT = [0,1,2,3,4,5];
const U = RAW.map(r=>({n:r[0],pl:r[1],c:r[2],t:r[3],r:r[4],sub:r[5],sk:r[6],g:r[7],a:r[8],note:r[9],ws:r[10],
  main:Math.max(...COMBAT.map(i=>r[6][i]??0))}));
const UBY = Object.fromEntries(U.map(u=>[u.n,u]));
const CULT = {
  emp:{n:"Cesarstwo", c:"var(--emp)"}, vla:{n:"Wlandia", c:"var(--vla)"}, stu:{n:"Sturgia", c:"var(--stu)"},
  bat:{n:"Battania", c:"var(--bat)"}, ase:{n:"Aserajowie", c:"var(--ase)"}, khu:{n:"Huzajczycy", c:"var(--khu-c)"}, nor:{n:"Nordowie", c:"var(--nor)"}
};
const ROLE = { inf:"Piechota", rng:"Strzelcy", cav:"Jazda", ha:"Konni łucznicy" };
const RCOL = { inf:"var(--t-azure)", rng:"var(--t-vert)", cav:"var(--t-gules)", ha:"var(--t-teal)" };
const SK = ["1 ręka","2 ręce","Drzewce","Łuk","Kusza","Rzut","Jazda","Atletyka"];
const GORDER = {S:5,A:4,B:3,C:2,D:1};
const WAGE = {1:2,2:3,3:5,4:8,5:12,6:17};
const ROMAN = ["I","II","III","IV"];

const IC = {
  keep:'<path d="M3 21V4h1.7v1.8h1.6V4H8v5h2v1.8h1.2V9h1.6v1.8H14V9h2V4h1.7v1.8h1.6V4H21v17z"/><path d="M10 21v-3.5a2 2 0 0 1 4 0V21"/><path d="M5.5 9v2.5M18.5 9v2.5"/>',
  ghelm:'<path d="M5.5 7.5C5.5 5 8.4 3.5 12 3.5s6.5 1.5 6.5 4V16c0 2-1.5 3.6-3.5 4.5H9C7 19.6 5.5 18 5.5 16z"/><path d="M5.5 10.5h13M12 3.5v17"/><path d="M8.5 14v2.5M15.5 14v2.5"/>',
  r_inf:'<path d="M3 6.5 8.5 4.5 14 6.5v4.8c0 3.8-2.4 6.6-5.5 7.9C5.4 17.9 3 15.1 3 11.3z"/><path d="M19 2.5v13M16.5 15.5h5M19 15.5V20M18 21h2"/>',
  r_rng:'<path d="M8 3c6 3.5 6 14.5 0 18"/><path d="M8 3v18"/><path d="M3 12h17M17 9.5l3 2.5-3 2.5"/>',
  r_cav:'<path d="M4 21h10"/><path d="M5.5 21v-1.6c0-1.9 1.1-3.3 2.6-4.5L4.8 13.6c-.8-.4-1-1.4-.4-2l3.4-4.2.3-3.4 2 2.1c3 .5 4.6 3 4.6 6.4V21"/><path d="M8.2 9h.01"/><path d="M15.5 13.5 21.5 2.5"/><path d="M20.6 4.2l-3-.2 1.4 2.6"/>',
  r_ha:'<path d="M4 21h10"/><path d="M5.5 21v-1.6c0-1.9 1.1-3.3 2.6-4.5L4.8 13.6c-.8-.4-1-1.4-.4-2l3.4-4.2.3-3.4 2 2.1c3 .5 4.6 3 4.6 6.4V21"/><path d="M8.2 9h.01"/><path d="M17 4c4.5 3 4.5 12 0 15"/><path d="M17 4v15"/>',
  home:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  book:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M12 6.5l2.5 2.8-2.5 2.8-2.5-2.8z"/><path d="M19 8.5h1.5v2.5H19"/>',
  shield:'<path d="M12 2.5 19.5 5v6c0 5-3.2 8.6-7.5 10.5C7.7 19.6 4.5 16 4.5 11V5z"/><path d="M12 6v12M8 10h8"/>',
  tree:'<path d="M9.5 2.5h5v3c0 1.6-1.1 2.6-2.5 3.1-1.4-.5-2.5-1.5-2.5-3.1z"/><path d="M3 14.5h5v3c0 1.6-1.1 2.6-2.5 3.1C4.1 20.1 3 19.1 3 17.5z"/><path d="M16 14.5h5v3c0 1.6-1.1 2.6-2.5 3.1-1.4-.5-2.5-1.5-2.5-3.1z"/><path d="M12 8.6v3M5.5 14.5v-2.9h13v2.9"/>',
  tools:'<path d="M3 9h12.5c0 2.4 2 3.8 5.5 3.8V14h-6c-.7 1.2-1.7 2-3 2.4V19h2.5v2h-9v-2H8v-2.6C5.3 15.8 3 13.6 3 11z"/><path d="M13.5 7 18 2.5M16.3 1.3l3.9 3.9"/>',
  phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
  helm:'<path d="M5 13a7 7 0 0 1 14 0v5H5z"/><path d="M12 6V3M5 15h14M9 15v3M15 15v3"/>',
  coin:'<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.6-1.2-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2.1c1.8.4 2.8 1 2.8 2.2s-1.2 2-2.8 2c-1.2 0-2.2-.5-2.8-1.3M12 6.5v11"/>',
  swords:'<path d="M4 4l10 10M4 4h3l9 9M20 4 10 14M20 4h-3l-4.5 4.5"/><path d="M6 15l3 3M15 18l3-3M7 19l-2 2M17 19l2 2"/>',
  tower:'<path d="M6 21V8h12v13"/><path d="M5 8V4h2.5v2h2V4h5v2h2V4H19v4"/><path d="M10 21v-5h4v5"/>',
  crown:'<path d="M3.5 18h17l-1.5-10-4.5 4L12 6l-2.5 6L5 8z"/><path d="M4 21h16"/>',
  banner:'<path d="M6 3v18"/><path d="M6 4h12l-3 4.5L18 13H6"/>',
  ship:'<path d="M3 16h18l-2.5 4h-13z"/><path d="M12 3v13M12 4l7 9h-7M12 6 6.5 13H12"/>',
  scroll:'<path d="M7 4h11a2 2 0 0 1 2 2v1h-4"/><path d="M16 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h10"/><path d="M7 4a2 2 0 0 0-2 2v11M9 9h5M9 12.5h5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  chev:'<path d="m9 6 6 6-6 6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  cmp:'<path d="M8 4v16M16 4v16M4 8h8M12 16h8"/>',
  axe:'<path d="M6 21 17 6"/><path d="M14 3c4 0 7 3 7 7-2 .5-4.5-.5-6-2s-2-3-1-5z"/>',
  spear:'<path d="M4 20 17 7"/><path d="M15 4h5v5l-3 1-3-3z"/>',
  javelin:'<path d="M3 17 18 6"/><path d="M15 4.5 21 3l-1.5 6"/><path d="M3 21 11 15"/>',
  bow:'<path d="M7 3c8 3 8 15 0 18"/><path d="M7 3v18"/><path d="M4 12h15"/><path d="M16 9l3 3-3 3"/>',
  xbow:'<path d="M3 9c5-4 13-4 18 0"/><path d="M3 9l9 3 9-3"/><path d="M12 5v16"/><path d="M10 18h4"/>',
  lance:'<path d="M7 4v7a5 5 0 0 0 10 0V4"/><path d="M5 4h4M15 4h4"/><path d="M12 13 21 22"/>',
  horsebow:'<path d="M5 4v6a5 5 0 0 0 10 0V4"/><path d="M3 4h4M13 4h4"/><path d="M13 16h8"/><path d="M18 13l3 3-3 3"/>'
};
const ico = (k, cls="i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]||""}</svg>`;
function unitIcon(u){
  if(u.r==="ha") return "r_ha"; if(u.r==="cav") return "r_cav";
  if(u.r==="rng") return u.sub.includes("kusz") ? "xbow" : "bow";
  if(u.sub.includes("harcownik")) return "javelin"; if(u.sub.includes("włócz")) return "spear";
  if(u.sub.includes("uderzeniowa")) return "axe"; return "shield";
}
const srcLink = k => SRC[k] ? `<a href="${SRC[k][1]}" target="_blank" rel="noopener">${esc(SRC[k][0])}</a>` : "";
const store = { get(k,d){ try{ const v=localStorage.getItem("chor_"+k); return v==null?d:JSON.parse(v);}catch(e){return d;} }, set(k,v){ try{ localStorage.setItem("chor_"+k, JSON.stringify(v)); }catch(e){} } };

/* ---------- motyw ---------- */
function applyTheme(t){ if(t) document.documentElement.setAttribute("data-theme",t); else document.documentElement.removeAttribute("data-theme");
  const dark = t ? t==="dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  $("theme").innerHTML = ico(dark?"sun":"moon"); }
let theme = store.get("theme", null); applyTheme(theme);
$("theme").addEventListener("click",()=>{ const dark = document.documentElement.getAttribute("data-theme") ? document.documentElement.getAttribute("data-theme")==="dark" : matchMedia("(prefers-color-scheme: dark)").matches; theme = dark?"light":"dark"; store.set("theme",theme); applyTheme(theme); });

/* ---------- nawigacja ---------- */
const NAV = [["start","Start","keep"],["kodeks","Kodeks","book"],["wojska","Wojska","ghelm"],["drzewka","Drzewka","tree"],["narzedzia","Narzędzia","tools"]];
$("nav").innerHTML = NAV.map(([k,l,i])=>`<a href="#${k}" data-k="${k}">${ico(i)}<span>${l}</span></a>`).join("");
const TITLES = {doradca:"Doradca bitwy", start:"M&B Goat Guide", kodeks:"Kodeks", topic:"Kodeks", wojska:"Wojska", drzewka:"Drzewka", narzedzia:"Narzędzia", instalacja:"Instalacja"};

function route(){
  const h = (location.hash||"#start").slice(1) || "start";
  let view = h, arg = null;
  if(h.startsWith("kodeks-")){ view="topic"; arg=h.slice(7); }
  else if(h.startsWith("drzewka-")){ view="drzewka"; arg=h.slice(8); }
  if(!$("v-"+view)) view="start";
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("on", v.id==="v-"+view));
  const navKey = view==="topic" ? "kodeks" : view==="doradca" ? "narzedzia" : view;
  document.querySelectorAll("#nav a").forEach(a=>{ if(a.dataset.k===navKey) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  $("bar-title").textContent = TITLES[view];
  if(view==="topic") renderTopic(arg);
  if(view==="drzewka") showTree(arg && TREES[arg] ? arg : treeCult);
  $("tray").classList.toggle("on", view==="wojska" && cmpList.length>0);
  sgMiniOn = view==="doradca"; updMini();
  window.scrollTo(0,0);
  if(view==="wojska" && pendingFocus){ const n=pendingFocus; pendingFocus=null; focusUnit(n); }
}
let pendingFocus=null; let sgMiniOn=false, sgOutVisible=true;
function goUnit(n){ pendingFocus=n; if(location.hash==="#wojska") route(); else location.hash="#wojska"; }
function updMini(){ $("sg-mini").hidden = !(sgMiniOn && !sgOutVisible); }
window.addEventListener("hashchange", route);

/* ---------- START ---------- */
const FLAGS = [
  ["#doradca","Doradca bitwy","Szturm, obrona, bitwa w polu","tower","--t-gules"],
  ["#kodeks","Kodeks","Porady od podstaw po mechanikę","book","--t-azure"],
  ["#wojska","Wojska","Karty, oceny, porównywarka","ghelm","--t-teal"],
  ["#drzewka","Drzewka","Ścieżki awansów 7 kultur","tree","--t-vert"],
  ["#narzedzia","Narzędzia","Żołd, jedzenie, lojalność","tools","--t-sable"],
  ["#kodeks-pieniadze","Pieniądze","Karawany, warsztaty, cła","coin","--t-or"],
  ["#kodeks-krolestwo","Królestwo","Lordowie, wpływy, bunty","crown","--t-purpure"],
  ["#instalacja","Na telefon","Ikona na ekranie głównym","phone","--t-brown"]
];
$("flags").innerHTML = FLAGS.map(([h,t,s,i,c])=>`<a class="flag-wrap" href="${h}"><div class="flag" style="--tc:var(${c})">${ico(i)}<h3>${t}</h3><span>${s}</span></div></a>`).join("");
$("camp").innerHTML = MYCAMP.map(([t,b,s])=>`<div class="camp-item"><div><b>${esc(t)}</b><p>${esc(b)}</p><div class="src">Źródło: ${srcLink(s)}</div></div></div>`).join("") + `<p class="note">Na podstawie tego, co pisaliśmy w rozmowie 19.11.2026.</p>`;

/* ---------- KODEKS ---------- */
const TINT = id => { const t = TOPICS.find(x=>x.id===id); return {"--azure":"--t-azure","--or":"--t-or","--gules":"--t-gules","--sable":"--t-sable","--purpure":"--t-purpure","--vert":"--t-vert","--khu":"--t-teal","--muted":"--t-brown"}[t.tint]; };
function renderTopics(){
  $("topics").innerHTML = TOPICS.map(t=>{
    const n = t.levels.reduce((a,l)=>a+l.length,0);
    return `<a class="topic" href="#kodeks-${t.id}"><div class="pennant" style="--tc:var(${TINT(t.id)})">${ico(t.icon)}</div><div><b>${esc(t.name)}</b><small>${esc(t.sub)}. ${n} porad na 4 poziomach.</small></div><span class="chev">${ico("chev")}</span></a>`;
  }).join("");
}
renderTopics();
function tipHTML(t, tip, i){
  const [title, body, src, ver] = tip;
  return `<article class="tip" style="--tc:var(${TINT(t.id)})"><h4>${esc(title)}</h4><p>${esc(body)}</p><div class="meta">${ver?`<span class="pill">${esc(ver)}</span>`:""}<span>Źródło: ${srcLink(src)}</span></div></article>`;
}
$("kq").addEventListener("input", e=>{
  const q = e.target.value.trim().toLowerCase();
  if(!q){ renderTopics(); return; }
  const hits = [];
  TOPICS.forEach(t=>t.levels.forEach((l,li)=>l.forEach(tip=>{ if((tip[0]+" "+tip[1]).toLowerCase().includes(q)) hits.push([t,li,tip]); })));
  $("topics").innerHTML = hits.length ? hits.map(([t,li,tip])=>`<div><div class="hit">${esc(t.name)}, poziom ${LEVELS[li].n.toLowerCase()}</div>${tipHTML(t,tip)}</div>`).join("") : `<div class="empty">Nic nie pasuje. Spróbuj innego słowa, na przykład „żołd” albo „bunt”.</div>`;
});
const opened = store.get("levels", {});
function renderTopic(id){
  const t = TOPICS.find(x=>x.id===id); if(!t){ location.hash="#kodeks"; return; }
  const max = Math.max(1, Math.min(4, opened[id]||1));
  const tint = TINT(id);
  let h = `<div class="topic-head" style="--tc:var(${tint})"><a href="#kodeks">← Wszystkie tematy</a><h2>${esc(t.name)}</h2><p>${esc(t.sub)}</p></div>`;
  h += `<div class="ladder" role="group" aria-label="Poziomy">${LEVELS.map((L,i)=>`<button class="rung" type="button" data-l="${i+1}" aria-pressed="${i<max}"><span class="rn">${ROMAN[i]}</span>${L.n}</button>`).join("")}</div>`;
  for(let i=0;i<max;i++){
    h += `<section class="level" id="lvl-${i+1}"><div class="level-h"><div class="shield">${ROMAN[i]}</div><div><b>${LEVELS[i].n}</b><small>${LEVELS[i].d}</small></div></div>${t.levels[i].map(tip=>tipHTML(t,tip)).join("")}</section>`;
  }
  if(max<4) h += `<button class="deeper" type="button" id="deeper">${ico("down")} Zejdź głębiej: ${LEVELS[max].n}</button>`;
  $("topic").innerHTML = h;
  $("topic").querySelectorAll(".rung").forEach(b=>b.addEventListener("click",()=>{ const l=+b.dataset.l; if(l>max){ opened[id]=l; store.set("levels",opened); renderTopic(id);} const el=$("lvl-"+l); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); }));
  const d=$("deeper"); if(d) d.addEventListener("click",()=>{ opened[id]=max+1; store.set("levels",opened); renderTopic(id); const el=$("lvl-"+(max+1)); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); });
}

/* ---------- WOJSKA ---------- */
const T4 = {
  "Imperial Veteran Infantryman":["pick","Najlepiej opancerzona piechota z tarczą na T4."],
  "Battanian Hero":["pick","Najlepszy łuk na T4."],
  "Vlandian Hardened Crossbowman":["pick","Ciężka kusza i pawęż za 8 dziennie."],
  "Battanian Veteran Skirmisher":["pick","Harpuny i tarcza, droga do Dzikusa."],
  "Varyag Veteran":["pick","Najwięcej pancerza wśród T4."],
  "Vlandian Knight":["pick","Destrier i kopia do szarży już na T4."],
  "Aserai Mamluke Cavalry":["pick","Tarcza i strzały przebijające."],
  "Nord Marauder":["pick","Dwuręczny topór w każdym zestawie, linia bez koni."],
  "Battanian Falxman":["trap","Krótszy falks, brak toporków, słaby pancerz. Od razu awansuj go na Weterana."]
};
U.forEach(u=>{ if(T4[u.n]){ u.t4=T4[u.n][0]; u.t4n=T4[u.n][1]; } });
if(UBY["Battanian Falxman"]) UBY["Battanian Falxman"].a = 93;
const BEST = [["Ściana tarcz","Nord Huscarl"],["Piechota z oszczepami","Battanian Wildling"],["Piechota bez dodatku","Aserai Veteran Infantry"],["Łucznik","Battanian Fian Champion"],["Kusznik","Vlandian Sharpshooter"],["Jazda uderzeniowa","Aserai Vanguard Faris"],["Konny łucznik","Khuzait Khan's Guard"],["Dla Cesarstwa","Imperial Naute"]];
const st = { cult:new Set(), role:new Set(), tier:new Set([5,6]), src:new Set(), q:"", sort:"grade" };
let cmpList = [];
const gradeBadge = u => u.g ? `<span class="gb" style="--g:var(--g${u.g})" title="Ocena ${u.g}">${u.g}</span>` : `<span class="gb none" title="Brak oceny">bd</span>`;
$("best").innerHTML = BEST.map(([role,n])=>{ const u=UBY[n]; return `<button class="pick" type="button" data-n="${esc(n)}" style="--cc:${CULT[u.c].c}"><span class="role">${role}</span><span class="nm">${esc(u.pl)}</span><span class="meta">${gradeBadge(u)}<span>T${u.t}, ${CULT[u.c].n}</span></span></button>`; }).join("");
document.querySelectorAll(".pick").forEach(b=>b.addEventListener("click",()=>focusUnit(b.dataset.n)));
function focusUnit(n){
  const u = UBY[n]; if(!u) return;
  st.cult.clear(); st.role.clear(); st.src.clear(); st.tier=new Set([u.t]); st.q=u.pl.toLowerCase(); $("q").value=u.pl; buildChips(); renderUnits(n);
  setTimeout(()=>{ const el=document.querySelector(".card.hl"); if(el) el.scrollIntoView({behavior:"smooth", block:"center"}); }, 60);
}
function chipRow(el, items){
  el.innerHTML="";
  items.forEach(([key,val,label,color])=>{
    const b=document.createElement("button"); b.type="button"; b.className="chip";
    b.setAttribute("aria-pressed", st[key].has(val)?"true":"false");
    b.innerHTML=(color?`<span class="dot" style="background:${color}"></span>`:"")+label;
    b.addEventListener("click",()=>{ st[key].has(val)?st[key].delete(val):st[key].add(val); b.setAttribute("aria-pressed", st[key].has(val)?"true":"false"); renderUnits(); });
    el.appendChild(b);
  });
}
function buildChips(){
  chipRow($("f-cult"), Object.entries(CULT).map(([k,v])=>["cult",k,v.n,v.c]));
  chipRow($("f-role"), Object.entries(ROLE).map(([k,v])=>["role",k,v]));
  chipRow($("f-tier"), [...[3,4,5,6].map(t=>["tier",t,"Tier "+t]), ["src","base","Gra podstawowa"], ["src","ws","War Sails"]]);
}
buildChips();
$("q").addEventListener("input",e=>{ st.q=e.target.value.trim().toLowerCase(); renderUnits(); });
$("sort").addEventListener("change",e=>{ st.sort=e.target.value; renderUnits(); });
const AMAX=220, SMAX=260;
function card(u, hl){
  const cc=CULT[u.c].c;
  const ranked=u.sk.map((v,i)=>[v,i]).filter(p=>p[0]!=null && COMBAT.includes(p[1])).sort((a,b)=>b[0]-a[0]);
  const topI=ranked.length?ranked[0][1]:-1;
  const sk=u.sk.map((v,i)=>`<div class="sk${i===topI?" top":""}${v==null?" bd":""}"><span>${SK[i]}</span><div class="bar"><i style="width:${v==null?0:Math.min(100,v/SMAX*100)}%"></i></div><b>${v==null?"bd":v}</b></div>`).join("");
  const armor=`<div class="armor${u.a==null?" bd":""}"><span>Pancerz</span><div class="bar"><i style="width:${u.a==null?0:Math.min(100,u.a/AMAX*100)}%"></i></div><b>${u.a==null?"bd":fmt(u.a)}</b></div>`;
  const t4=u.t4==="pick"?`<span class="tag pick4">Opłaca się na T4</span>`:u.t4==="trap"?`<span class="tag trap">Pułapka</span>`:"";
  const inC=cmpList.includes(u.n);
  return `<article class="card${hl?" hl":""}" style="--cc:${cc}"><div class="c-band"></div><div class="c-body">
    <div class="c-top"><div class="crest" aria-hidden="true">${ico(unitIcon(u))}</div><div><h3 class="c-name">${esc(u.pl)}</h3><div class="c-en">${esc(u.n)}</div></div><div class="badges">${gradeBadge(u)}<span class="tier">T${u.t}</span></div></div>
    <div class="tags"><span class="tag cult">${CULT[u.c].n}</span><span class="tag">${ROLE[u.r]}</span><span class="tag">${esc(u.sub)}</span>${t4}${u.ws?`<span class="tag ws">War Sails</span>`:""}</div>
    ${armor}<div class="skills">${sk}</div>
    <p class="c-note">${esc(u.note)}${u.t4==="trap"?` <strong>Uwaga:</strong> ${esc(u.t4n)}`:""}</p>
    <div class="c-foot"><span style="white-space:nowrap">Żołd <b class="num" style="color:var(--ink)">${WAGE[u.t]}</b>/dzień</span><span class="c-actions">
      <a class="sbtn" href="#drzewka-${u.c}" data-tree="${esc(u.n)}">${ico("tree")}Drzewko</a>
      <button class="sbtn cmp" type="button" data-n="${esc(u.n)}" aria-pressed="${inC}">${ico("cmp")}${inC?"W porównaniu":"Porównaj"}</button></span></div>
  </div></article>`;
}
const t4score=u=>u.t4==="pick"?0.5:u.t4==="trap"?-0.5:0;
function renderUnits(hlName){
  let list=U.filter(u=>(!st.cult.size||st.cult.has(u.c))&&(!st.role.size||st.role.has(u.r))&&(!st.tier.size||st.tier.has(u.t))&&(!st.src.size||st.src.has(u.ws?"ws":"base"))&&(!st.q||(u.pl+" "+u.n).toLowerCase().includes(st.q)));
  const by={grade:(a,b)=>((GORDER[b.g]||0)+t4score(b))-((GORDER[a.g]||0)+t4score(a))||b.t-a.t||(b.a??0)-(a.a??0), armor:(a,b)=>(b.a??-1)-(a.a??-1)||b.t-a.t, main:(a,b)=>b.main-a.main||b.t-a.t, tier:(a,b)=>b.t-a.t||(GORDER[b.g]||0)-(GORDER[a.g]||0)}[st.sort];
  list.sort(by);
  const n=list.length;
  $("count").textContent=n===1?"1 jednostka":(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?`${n} jednostki`:`${n} jednostek`);
  $("list").innerHTML=n?list.map(u=>card(u,u.n===hlName)).join(""):`<div class="empty">Żadna jednostka nie pasuje. Wyczyść wyszukiwanie albo odznacz któryś filtr.</div>`;
  $("list").querySelectorAll(".cmp").forEach(b=>b.addEventListener("click",()=>toggleCmp(b.dataset.n)));
  $("list").querySelectorAll("[data-tree]").forEach(a=>a.addEventListener("click",()=>{ treeHL=a.dataset.tree; }));
  updateTray();
}
function toggleCmp(n){ const i=cmpList.indexOf(n); if(i>=0) cmpList.splice(i,1); else { if(cmpList.length>=3) cmpList.shift(); cmpList.push(n);} renderUnits(); }
function updateTray(){ const on=cmpList.length>0 && $("v-wojska").classList.contains("on"); $("tray").classList.toggle("on",on); $("tray-names").textContent=cmpList.length?`${cmpList.length}/3: ${cmpList.map(n=>UBY[n].pl).join(", ")}`:""; }
$("tray-clear").addEventListener("click",()=>{ cmpList=[]; renderUnits(); });
$("tray-open").addEventListener("click",()=>{
  const us=cmpList.map(n=>UBY[n]);
  const rows=[["Kultura",us.map(u=>CULT[u.c].n),false],["Tier",us.map(u=>u.t),false],["Ocena",us.map(u=>u.g||"bd"),false],["Pancerz",us.map(u=>u.a??"bd"),true],...SK.map((s,i)=>[s,us.map(u=>u.sk[i]??"bd"),true]),["Żołd",us.map(u=>WAGE[u.t]),false]];
  const head=`<thead><tr><th></th>${us.map(u=>`<th>${esc(u.pl)}</th>`).join("")}</tr></thead>`;
  const body=rows.map(([l,vals,num])=>{ const nums=vals.filter(v=>typeof v==="number"); const max=num&&us.length>1&&nums.length?Math.max(...nums):null; return `<tr><td>${l}</td>${vals.map(v=>`<td class="${max!==null&&v===max?"best":""}">${typeof v==="number"?fmt(v):v}</td>`).join("")}</tr>`; }).join("");
  openSheet("Porównanie", `<table>${head}<tbody>${body}</tbody></table>`, []);
});

/* ---------- arkusz ---------- */
const sheet=$("sheet"); let sheetBack=null;
function openSheet(title, html, actions){
  $("sheet-h").textContent=title; $("sheet-body").innerHTML=html;
  $("sheet-actions").innerHTML=actions.map((a,i)=>`<button class="btn${a.ghost?" ghost":""}" type="button" data-i="${i}" style="flex:1">${a.label}</button>`).join("")+`<button class="btn ghost" type="button" id="sheet-close" style="flex:1">Zamknij</button>`;
  $("sheet-actions").querySelectorAll("[data-i]").forEach(b=>b.addEventListener("click",()=>{ closeSheet(); actions[+b.dataset.i].go(); }));
  $("sheet-close").addEventListener("click",closeSheet);
  sheetBack=document.activeElement; sheet.classList.add("on"); $("sheet-close").focus();
}
function closeSheet(){ sheet.classList.remove("on"); if(sheetBack&&sheetBack.focus) sheetBack.focus(); }
sheet.addEventListener("click",e=>{ if(e.target===sheet) closeSheet(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&sheet.classList.contains("on")) closeSheet(); });

/* ---------- DRZEWKA ---------- */
let treeCult=store.get("treeCult","emp"), treeMode="graph", treeZoom=store.get("treeZoom",0.85), treeHL=null;
const info = n => { const u=UBY[n]; if(u) return {pl:u.pl,t:u.t,r:u.r,ws:u.ws,g:u.g,u}; const l=LOWER[n]; return {pl:l[0],t:l[1],r:l[2],ws:n.startsWith("Nord "),g:null,u:null}; };
function chipsTree(){
  $("t-cult").innerHTML=Object.entries(CULT).map(([k,v])=>`<button class="chip" type="button" data-c="${k}" aria-pressed="${k===treeCult}"><span class="dot" style="background:${v.c}"></span>${v.n}</button>`).join("");
  $("t-cult").querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{ treeHL=null; location.hash="#drzewka-"+b.dataset.c; }));
}
function layout(c){
  const T=TREES[c], kids=T.e, prim={}, order=[]; const seen=new Set();
  const visit=n=>{ if(seen.has(n)) return; seen.add(n); order.push(n); (kids[n]||[]).forEach(k=>{ if(!seen.has(k)){ prim[k]=n; } }); (kids[n]||[]).forEach(k=>{ if(prim[k]===n) visit(k); }); };
  const ys={}; let slot=0;
  const place=n=>{ const ch=(kids[n]||[]).filter(k=>prim[k]===n); if(!ch.length){ ys[n]=slot++; return; } ch.forEach(place); ys[n]=ch.reduce((a,k)=>a+ys[k],0)/ch.length; };
  T.roots.forEach((r,i)=>{ if(i>0) slot+=0.35; visit(r); place(r); });
  const nodes=order.map(n=>({n, ...info(n), y:ys[n]}));
  const edges=[]; Object.entries(kids).forEach(([a,bs])=>bs.forEach(b=>edges.push([a,b])));
  return {nodes, edges, rows:slot};
}
const NW=156, NH=84, CW=186, RH=150, TOP=26, LEFT=74;
const roleIco = r => `<b class="ri" style="--rc:${RCOL[r]}" title="${ROLE[r]}">${ico("r_"+r)}</b>`;
function showTree(c){
  treeCult=c; store.set("treeCult",c); chipsTree();
  const L=layout(c);
  const pos={}; L.nodes.forEach(n=>pos[n.n]={x:LEFT+n.y*CW, y:TOP+(n.t-1)*RH});
  const W=LEFT+Math.max(1,L.rows)*CW+10, H=TOP+5*RH+NH+30;
  let svg=`<svg width="${W}" height="${H}" aria-hidden="true">`;
  [1,2,3,4,5,6].forEach(t=>{ const y=TOP+(t-1)*RH+NH/2; svg+=`<line x1="${LEFT-10}" y1="${y}" x2="${W}" y2="${y}" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="2 7"/>`; });
  L.edges.forEach(([a,b])=>{ const p=pos[a], q=pos[b]; const x1=p.x+NW/2, y1=p.y+NH, x2=q.x+NW/2, y2=q.y, my=(y1+y2)/2; const ws=info(b).ws;
    svg+=`<path d="M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}" fill="none" stroke="${ws?"var(--muted)":RCOL[info(b).r]}" stroke-width="2.6" ${ws?'stroke-dasharray="6 5"':""} opacity=".8"/>`;
    svg+=`<path d="M${x2-5} ${y2-8} L${x2} ${y2-1} L${x2+5} ${y2-8}" fill="none" stroke="${ws?"var(--muted)":RCOL[info(b).r]}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`; });
  svg+=`</svg>`;
  let html=svg + [1,2,3,4,5,6].map(t=>`<div class="tcol" style="top:${TOP+(t-1)*RH+NH/2-17}px">T${t}<small>tier</small></div>`).join("");
  html+=L.nodes.map(n=>`<button type="button" class="tnode${n.ws?" ws":""}${n.n===treeHL?" hl":""}" data-n="${esc(n.n)}" style="left:${pos[n.n].x}px; top:${pos[n.n].y}px; --rc:${RCOL[n.r]}">${roleIco(n.r)}<b>${esc(n.pl)}</b><small>${esc(n.n)}</small>${n.g?`<span class="tg"><span class="gb" style="--g:var(--g${n.g})">${n.g}</span></span>`:""}</button>`).join("");
  const cv=$("tree-canvas"); cv.innerHTML=html; cv.style.width=W+"px"; cv.style.height=H+"px";
  cv.dataset.w=W; cv.dataset.h=H; applyZoom();
  cv.querySelectorAll(".tnode").forEach(b=>b.addEventListener("click",()=>nodeSheet(b.dataset.n)));
  // lista
  const T=TREES[c], seen=new Set(); let rows="";
  const walk=(n,d)=>{ const i=info(n); const again=seen.has(n); seen.add(n);
    rows+=`<button type="button" class="orow" data-n="${esc(n)}" style="--rc:${RCOL[i.r]}; margin-left:${Math.min(d,5)*14}px"><span class="t">T${i.t}</span>${roleIco(i.r)}<span><b>${esc(i.pl)}${again?" (patrz wyżej)":""}</b><small>${esc(n)}${i.ws?", War Sails":""}</small></span>${i.g?gradeBadge(i):""}</button>`;
    if(!again) (T.e[n]||[]).forEach(k=>walk(k,d+1)); };
  T.roots.forEach(r=>walk(r,0));
  $("olist").innerHTML=rows;
  $("olist").querySelectorAll(".orow").forEach(b=>b.addEventListener("click",()=>nodeSheet(b.dataset.n)));
  setTimeout(()=>{ const el=cv.querySelector(".tnode.hl") || cv.querySelector(".tnode"); const box=$("tree-box"); if(el&&box){ box.scrollTo({left:Math.max(0,(el.offsetLeft+NW/2)*treeZoom - box.clientWidth/2), top:treeHL?Math.max(0,el.offsetTop*treeZoom - box.clientHeight/2 + 40):0, behavior:treeHL?"smooth":"auto"}); } },60);
}
function applyZoom(){ const cv=$("tree-canvas"); cv.style.transform=`scale(${treeZoom})`; $("tree-sizer").style.width=(+cv.dataset.w*treeZoom)+"px"; $("tree-sizer").style.height=(+cv.dataset.h*treeZoom)+"px"; }
$("z-in").addEventListener("click",()=>{ treeZoom=Math.min(1.6,+(treeZoom+0.15).toFixed(2)); store.set("treeZoom",treeZoom); applyZoom(); });
$("z-out").addEventListener("click",()=>{ treeZoom=Math.max(0.45,+(treeZoom-0.15).toFixed(2)); store.set("treeZoom",treeZoom); applyZoom(); });
function setMode(m){ treeMode=m; $("m-graph").setAttribute("aria-pressed",m==="graph"); $("m-list").setAttribute("aria-pressed",m==="list"); $("tree-box").hidden=m!=="graph"; $("zoomctl").style.visibility=m==="graph"?"visible":"hidden"; $("olist").hidden=m!=="list"; }
$("tree-legend").innerHTML=$("tree-legend").innerHTML.replace(/\$\{"(r_[a-z]+)"\}/g,(m,k)=>ico(k));
$("m-graph").addEventListener("click",()=>setMode("graph")); $("m-list").addEventListener("click",()=>setMode("list"));
function nodeSheet(n){
  const i=info(n), u=i.u;
  let body=`<p class="c-en" style="margin:0 0 10px">${esc(n)}, tier ${i.t}${i.ws?", War Sails":""}</p>`;
  if(u){ body+=`<div class="tags" style="margin-bottom:10px"><span class="tag cult" style="--cc:${CULT[u.c].c}">${CULT[u.c].n}</span><span class="tag">${ROLE[u.r]}</span>${u.g?`<span class="tag">Ocena ${u.g}</span>`:""}${u.a!=null?`<span class="tag">Pancerz ${fmt(u.a)}</span>`:""}</div><p style="margin:0; font-size:16.5px">${esc(u.note)}</p>`; }
  else body+=`<p style="margin:0; font-size:16.5px">Jednostka z tieru ${i.t}. Nie ma osobnej karty, bo na tym poziomie liczy się tylko to, w co ją awansujesz. Żołd ${WAGE[i.t]} dziennie.</p>`;
  const kids=(TREES[treeCult].e[n]||[]).map(k=>info(k).pl);
  if(kids.length) body+=`<p class="note" style="margin-top:10px">Awansuje na: ${kids.map(esc).join(", ")}.</p>`;
  openSheet(i.pl, body, u?[{label:"Otwórz kartę", go:()=>goUnit(u.n)}]:[]);
}

/* ---------- NARZĘDZIA ---------- */
const TOOLS = `
<div class="panel tool" id="tool-wage"><h3>Żołd drużyny</h3><p class="note">Wpisz, ilu masz żołnierzy na każdym tierze.</p>
 <div class="fields">${[1,2,3,4,5,6].map(t=>`<label class="field">Tier ${t}<input type="number" inputmode="numeric" min="0" value="0" data-w="${t}"></label>`).join("")}</div>
 <label class="check"><input type="checkbox" id="w-sea"> Na morzu, żołd −20% (War Sails)</label>
 <label class="check"><input type="checkbox" id="w-merc"> To najemnicy z tawerny, +50%</label>
 <div class="result"><div><b id="w-day">0</b><span>denarów dziennie</span></div><div><b id="w-week">0</b><span>denarów na 7 dni</span></div></div>
 <div class="src">Stawki: 2, 3, 5, 8, 12, 17 dziennie. Źródło: ${srcLink("money")}</div></div>

<div class="panel tool"><h3>Jedzenie</h3>
 <div class="fields"><label class="field">Żołnierze<input type="number" inputmode="numeric" min="0" value="120" id="f-men"></label><label class="field">Jeńcy<input type="number" inputmode="numeric" min="0" value="0" id="f-pri"></label><label class="field">Zapas jedzenia<input type="number" inputmode="numeric" min="0" value="40" id="f-food"></label></div>
 <div class="result"><div><b id="f-day">0</b><span>jedzenia dziennie</span></div><div><b id="f-days">0</b><span>dni do głodu</span></div></div>
 <div class="src">1 jedzenie na 20 ludzi dziennie, jeńcy za pół. Kupuj co najmniej 3 rodzaje. Źródło: ${srcLink("begin")}</div></div>

<div class="panel tool"><h3>Limit drużyny</h3>
 <div class="fields two"><label class="field">Tier klanu<select id="p-tier">${[0,1,2,3,4,5,6].map(t=>`<option value="${t}"${t===4?" selected":""}>Tier ${t}</option>`).join("")}</select></label><label class="field">Zarządzanie kwatermistrza<input type="number" inputmode="numeric" min="0" value="100" id="p-stew"></label></div>
 <div class="result"><div><b id="p-base">0</b><span>z tieru klanu</span></div><div><b id="p-total">0</b><span>razem bez perków</span></div></div>
 <div class="src">Plus 0,25 miejsca za punkt Zarządzania. Więcej dają perki Authority, Horde Leader, Imposing Stature i Leader of the Masses. Źródło: ${srcLink("begin")}</div></div>

<div class="panel tool"><h3>Lojalność miasta</h3><p class="note">Zsumuj dzienne pozycje z podpowiedzi lojalności (bez dryfu do 50).</p>
 <div class="fields two"><label class="field">Suma dziennie<input type="number" inputmode="decimal" step="0.1" value="-1" id="l-sum"></label><label class="field">Obecna lojalność<input type="number" inputmode="numeric" min="0" max="100" value="40" id="l-now"></label></div>
 <div class="result"><div id="l-rest-box"><b id="l-rest">0</b><span>punkt spoczynku</span></div><div><b id="l-week">0</b><span>za tydzień, mniej więcej</span></div></div>
 <p class="note" id="l-msg"></p>
 <div class="src">Punkt spoczynku = 50 + 10 × suma, codziennie domyka 10% różnicy. Bunt od 35, rewolta od 25 (łatka 1.5). Źródło: ${srcLink("loyalty")}</div></div>`;
$("tools").innerHTML=`<a class="panel tool-link" href="#doradca"><div class="pennant" style="--tc:var(--t-gules)">${ico("tower")}</div><div><b>Doradca bitwy</b><small>Szturm i obrona miasta, bitwa w polu: szanse i plan</small></div><span class="chev">${ico("chev")}</span></a>`+TOOLS;
const num=id=>Math.max(0, +($(id).value)||0);
function calcWage(){ let d=0; document.querySelectorAll("[data-w]").forEach(i=>d+=Math.max(0,+i.value||0)*WAGE[+i.dataset.w]); if($("w-merc").checked) d*=1.5; if($("w-sea").checked) d*=0.8; d=Math.round(d); $("w-day").textContent=d.toLocaleString("pl-PL"); $("w-week").textContent=(d*7).toLocaleString("pl-PL"); }
function calcFood(){ const per=(num("f-men")+num("f-pri")/2)/20; $("f-day").textContent=fmt(per.toFixed(1)); $("f-days").textContent=per>0?Math.floor(num("f-food")/per):"∞"; }
const PT=[20,45,70,95,120,145,170];
function calcParty(){ const b=PT[+$("p-tier").value]; const tot=b+Math.floor(num("p-stew")*0.25); $("p-base").textContent=b; $("p-total").textContent=tot; }
function calcLoy(){ const s=+$("l-sum").value||0, now=Math.min(100,num("l-now")); const rest=Math.max(0,Math.min(100,50+10*s)); let v=now; for(let i=0;i<7;i++) v+= (rest-v)*0.1; $("l-rest").textContent=fmt(rest.toFixed(0)); $("l-week").textContent=fmt(v.toFixed(0));
  const box=$("l-rest-box"); box.classList.toggle("warn", rest<=35);
  $("l-msg").textContent = rest<=25 ? "Miasto zmierza do strefy rewolty. Dodaj politykę, gubernatora albo festyn." : rest<=35 ? "Miasto będzie buntownicze: warsztaty staną, milicja nie pomoże w obronie." : rest>=75 ? "Świetnie: do +20% podatku i szybsze budowy." : "Bezpiecznie, ale bez premii."; }
document.querySelectorAll("#tools input, #tools select").forEach(i=>i.addEventListener("input",()=>{calcWage();calcFood();calcParty();calcLoy();}));
calcWage();calcFood();calcParty();calcLoy();

/* ---------- INSTALACJA ---------- */
const STEPS = {
 and:[["Skopiuj adres","Dotknij „Kopiuj” powyżej."],
      ["Otwórz go w Chrome","Wklej adres w pasku Chrome i otwórz. Nic nie trzeba się logować."],
      ["Zainstaluj","Chrome może sam pokazać na dole „Zainstaluj aplikację”. Jeśli nie, dotknij ⋮ w prawym górnym rogu i wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”."],
      ["Potwierdź nazwę","Wpisz „M&amp;B Goat Guide” i dotknij „Dodaj”. Ikona pojawi się na ekranie telefonu."],
      ["Gotowe","Aplikacja otwiera się na pełnym ekranie, bez paska przeglądarki, i działa też bez zasięgu. Stara ikona z claude.ai nie jest już potrzebna, możesz ją usunąć."]],
 ios:[["Skopiuj adres","Dotknij „Kopiuj” powyżej."],
      ["Otwórz go w Safari","Wklej adres w pasku Safari i otwórz. Musi to być Safari, inne przeglądarki na iPhonie nie instalują aplikacji tak samo."],
      ["Przycisk Udostępnij","Na dole ekranu dotknij kwadratu ze strzałką w górę."],
      ["Do ekranu początkowego","Przewiń listę w dół i wybierz „Do ekranu początkowego”. Wpisz „M&amp;B Goat Guide” i dotknij „Dodaj”."],
      ["Gotowe","Ikona jest na ekranie. Aplikacja działa też bez zasięgu."]]
};
function renderSteps(os){ $("os-and").setAttribute("aria-pressed",os==="and"); $("os-ios").setAttribute("aria-pressed",os==="ios"); $("steps").innerHTML=STEPS[os].map(([b,t])=>`<li><div><b>${b}</b>${t}</div></li>`).join(""); }
$("os-and").addEventListener("click",()=>renderSteps("and")); $("os-ios").addEventListener("click",()=>renderSteps("ios"));
renderSteps(/iPhone|iPad/.test(navigator.userAgent)?"ios":"and");
$("copy").addEventListener("click",async()=>{ try{ await navigator.clipboard.writeText($("applink").textContent); $("copy").textContent="Skopiowano"; }catch(e){ $("copy").textContent="Przytrzymaj link"; } setTimeout(()=>$("copy").textContent="Kopiuj",2200); });
$("srclist").innerHTML=Object.keys(SRC).map(k=>`<li>${srcLink(k)}</li>`).join("");
