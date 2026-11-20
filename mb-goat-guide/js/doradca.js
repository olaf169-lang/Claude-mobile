/* ---------- DORADCA BITWY ---------- */
const BT_DEF = {
  mode:"siegeAtt", lead:"lead", tac:0, high:false, relief:false,
  you:{ n:1050, elite:40, inf:45, rng:25, cav:25, ha:5, touched:false },
  foe:{ n:620, elite:35, inf:40, rng:30, cav:20, ha:10, touched:false, eliteKnown:false },
  town:{ g:420, m:200, splitKnown:false, gElite:35, gEliteKnown:false, dr:35, drKnown:false, wall:2, wallKnown:false, breach:0, eng:2, ram:false, towers:0, starve:0 },
  mine:{ g:300, m:150, gElite:35, pn:0, pElite:50, dr:40, wall:2, eng:1, breach:0, ram:false, towers:0, starve:0 }
};
const deep = o => JSON.parse(JSON.stringify(o));
let BT = (()=>{ const s = store.get("battle", null); if(!s) return deep(BT_DEF); const d = deep(BT_DEF); for(const k in d){ if(typeof d[k]==="object") Object.assign(d[k], s[k]||{}); else if(s[k]!==undefined) d[k]=s[k]; } return d; })();

const MODES = {
  siegeAtt:["Szturm na miasto","Ty oblegasz miasto lub zamek","tower"],
  siegeDef:["Obrona miasta","Ty bronisz swoich murów","shield"],
  fieldAtt:["Pole: atakuję","Ty dopadasz wroga na mapie","swords"],
  fieldDef:["Pole: bronię się","Wróg dopadł Ciebie na mapie","banner"]
};
const tp = t => Math.pow(1.4, t-1);
const avgT = e => 2.5 + 2.7*e/100;
const norm = x => { const t = Math.max(1, x.inf+x.rng+x.cav+x.ha); return {inf:x.inf/t, rng:x.rng/t, cav:x.cav/t, ha:x.ha/t}; };
const ROLEF = { siege:{inf:1, rng:0.8, cav:0.65, ha:0.6}, field:{inf:1, rng:0.95, cav:1.25, ha:1.15} };
const roleF = (c, kind) => { const t = ROLEF[kind]; let f = c.inf*t.inf + c.rng*t.rng + c.cav*t.cav + c.ha*t.ha; if(kind==="siege" && c.inf<0.3) f *= 0.85; return f; };
const sig = (r, k=3) => 1/(1+Math.pow(r,-k));
function wallMult(t, defEng){
  const base = {1:1.45, 2:1.7, 3:1.95}[t.wall];
  let ex = (base-1) * (t.breach===0 ? 1 : t.breach===1 ? 0.55 : 0.3);
  const eff = defEng===0 ? 1 : Math.max(0.25, 1-0.22*defEng); // machiny obrońców niszczą taran i wieże w drodze
  if(t.ram) ex *= 1 - 0.28*eff;        // rozbita brama to dodatkowe wejście i ściąga obrońców z murów
  ex *= 1 - 0.12*eff*t.towers;         // każda wieża to szerokie wejście na mury
  return Math.max(1.05, 1+ex);
}
function match(a, b){ return 0.3*a.cav*b.rng + 0.25*a.ha*b.inf + 0.15*a.rng*b.inf - 0.2*a.cav*b.inf*0.5 - 0.1*a.inf*b.ha; }

function btModel(S){
  const m = S.mode, auto = S.lead==="auto", tacF = auto ? 1 + S.tac/1000 : 1;
  let R, p, unk = 0, need = 0, loss = 0, needLbl = "ludzi o Twojej jakości do 70% szans", lossLbl = "Twoich rannych i zabitych, orientacyjnie", extra = "";
  if(m==="siegeAtt"){
    const c = norm(S.you), t = S.town, perMan = tp(avgT(S.you.elite))*roleF(c,"siege")*tacF;
    const A = S.you.n*perMan;
    const gEff = t.g*Math.max(0.45, 1-0.035*t.starve), mEff = t.m*Math.max(0.7, 1-0.015*t.starve);
    const wm = wallMult(t, t.eng), rf = 0.85 + 0.6*t.dr/100;
    const D = (gEff*tp(2.3+2.7*t.gElite/100) + mEff*tp(2.6)) * wm * rf * (1+0.07*t.eng) * (auto?1.1:1);
    R = A/D; p = sig(R);
    unk = [!S.you.touched, !t.splitKnown, !t.gEliteKnown, !t.wallKnown, !t.drKnown].filter(Boolean).length;
    need = Math.max(0, Math.ceil((1.326*D - A)/perMan));
    loss = Math.min(S.you.n, Math.round((t.g+t.m)*wm*0.6/Math.pow(R,0.7)));
    extra = `stosunek sił po uwzględnieniu murów`;
  } else if(m==="siegeDef"){
    const c = norm(S.foe), t = S.mine;
    const A = S.foe.n*tp(avgT(S.foe.elite))*roleF(c,"siege")*(auto?1/1.1:1);
    const gEff = t.g*Math.max(0.45, 1-0.035*t.starve), mEff = t.m*Math.max(0.7, 1-0.015*t.starve);
    const wm = wallMult(t, t.eng), rf = 0.85 + 0.6*t.dr/100, ef = (1+0.07*t.eng);
    const partyPer = tp(avgT(t.pElite));
    const D = (gEff*tp(2.3+2.7*t.gElite/100) + mEff*tp(2.6) + t.pn*partyPer) * wm * rf * ef * tacF;
    R = A/D; p = 1 - sig(R);
    unk = [!S.foe.touched, !S.foe.eliteKnown].filter(Boolean).length;
    need = Math.max(0, Math.ceil((A/0.754 - D)/(wm*rf*ef*tacF*partyPer)));
    needLbl = "obrońców jakości Twojej drużyny do 70% szans";
    loss = Math.min(t.g+t.m+t.pn, Math.round(S.foe.n*0.3*Math.pow(R,0.7)/wm));
    lossLbl = "Twoich obrońców rannych i zabitych, orientacyjnie";
    extra = `siła oblegających wobec Twojej obrony z murami`;
  } else {
    const cy = norm(S.you), cf = norm(S.foe);
    const perMan = tp(avgT(S.you.elite))*roleF(cy,"field")*(1+match(cy,cf))*(S.high?1.08:1)*tacF;
    const Ay = S.you.n*perMan;
    const Af = S.foe.n*tp(avgT(S.foe.elite))*roleF(cf,"field")*(1+match(cf,cy));
    R = Ay/Af; p = sig(R, 3.2);
    unk = [!S.you.touched, !S.foe.touched, !S.foe.eliteKnown].filter(Boolean).length;
    need = Math.max(0, Math.ceil((Math.pow(7/3,1/3.2)*Af - Ay)/perMan));
    loss = Math.min(S.you.n, Math.round(S.foe.n*0.5/Math.pow(R,0.8)));
    extra = `stosunek sił z jakością i składem`;
  }
  const e = 0.08 + 0.045*unk + (S.lead==="lead" ? 0.04 : 0);
  const k = m.startsWith("field") ? 3.2 : 3;
  let lo, hi;
  if(m==="siegeDef"){ lo = 1 - sig(R*(1+e),k); hi = 1 - sig(R*(1-e),k); } else { lo = sig(R*(1-e),k); hi = sig(R*(1+e),k); }
  return { p, lo, hi, R, need, needLbl, loss, lossLbl, extra, unk };
}
const pct = x => Math.round(x*100);
function btVerdict(m, S){
  const def = S.mode==="siegeDef", field = S.mode.startsWith("field");
  if(m.p>=0.7 && m.lo>=0.55) return ["go", def?"Utrzymasz":field?"Bij":"Atakuj", def?"Mury są po Twojej stronie. Trzymaj ludzi w środku.":field?"Masz wyraźną przewagę. Wchodź do bitwy.":"Masz wyraźną przewagę. Ruszaj, zanim przyjdzie odsiecz."];
  if(m.p>=0.5) return ["prep","Na styk", def?"Obrona jest możliwa, ale ryzykowna. Wzmocnij ją, zanim ruszą.":"Szansa jest, ale ryzykowna. Jeszcze jeden krok zrobi dużą różnicę."];
  return ["no", def?"Zagrożone":field?"Unikaj":"Jeszcze nie", def?"Bez wzmocnienia raczej stracisz miasto. Zobacz niżej, co pomoże najbardziej.":field?"Lepiej się wycofać albo dobrać ludzi. Zobacz niżej, co da największy skok.":"Na dziś przegrasz albo wygrasz bardzo drogo. Zobacz niżej, co da największy skok."];
}
function btGains(S, base){
  const out = [];
  const tryG = (label, how, mutate, src) => { const T = deep(S); mutate(T); const d = btModel(T).p - base.p; if(d > 0.009) out.push({label, how, d, src}); };
  const add100 = T => { T.you.elite = Math.min(100, Math.round((T.you.n*T.you.elite + 100*60)/(T.you.n+100))); T.you.n += 100; };
  if(S.mode==="siegeAtt"){
    const t = S.town;
    if(t.eng>0) tryG("Zniszcz machiny obrońców","Zbuduj 2 lub 3 trebusze albo onagery, trzymaj gotowe w rezerwie i wystaw razem.",T=>T.town.eng=0,"engines");
    if(t.breach<2) tryG(t.breach===0?"Zrób dwa wyłomy w murach":"Zrób drugi wyłom","Trebusze burzą mury. Przez wyłom wchodzi dużo więcej ludzi niż po drabinach czy wieży.",T=>T.town.breach=2,"ladders");
    if(t.towers<2) tryG(t.towers? "Postaw drugą wieżę":"Postaw wieżę oblężniczą","Wieża daje szerokie wejście na mury. Ma sens, gdy machiny obrońców są zniszczone.",T=>T.town.towers=Math.min(2,t.towers+1),"devblog");
    if(!t.ram) tryG("Zbuduj taran","Taran ściąga obrońców z murów pod bramę, więc drabiny i wieże mają łatwiej.",T=>T.town.ram=true,"ramwalls");
    if(t.starve<14 && !S.relief) tryG("Przeczekaj głód "+(t.starve<7?"7":"kolejne 7")+" dni","Gdy w mieście kończy się jedzenie, garnizon słabnie.",T=>T.town.starve=Math.min(20,t.starve+7),"howsiege");
    tryG("Dobierz 100 żołnierzy tieru 4","Wezwij armię albo ściągnij oddział z garnizonu własnego zamku.",add100,null);
    if(norm(S.you).inf<0.4) tryG("Więcej piechoty z tarczami","W szturmie liczy się piechota, jeźdźcy walczą pieszo jako słabsza piechota.",T=>{T.you.inf=Math.max(T.you.inf,45);T.you.cav=Math.min(T.you.cav,20);T.you.touched=true;},null);
  } else if(S.mode==="siegeDef"){
    const t = S.mine;
    if(t.eng<4) tryG("Zbuduj machiny obronne","Machiny na murach niszczą wieże i taran oblegających, zanim dojdą do murów.",T=>T.mine.eng=Math.min(4,t.eng+2),"engines");
    tryG("Wprowadź 100 ludzi do miasta","Wejdź do miasta drużyną albo dorzuć ludzi do garnizonu przed szturmem.",T=>{T.mine.pn+=100;},"siegedef");
    if(t.starve>0) tryG("Zatrzymaj głód","Racjonowanie jedzenia kosztuje lojalność i dobrobyt, ale to lepsze niż głód garnizonu.",T=>T.mine.starve=0,"ration");
    if(S.lead==="auto") tryG("Dowodź osobiście","W automatycznej bitwie liczą się głównie machiny i mury. Sam wykorzystasz mury lepiej.",T=>T.lead="lead","autores");
  } else {
    const cf = norm(S.foe);
    if(!S.high) tryG("Zajmij wzgórze","Strzelcy na wzniesieniu za ścianą tarcz to klasyka. Ustaw się, zanim ruszy wróg.",T=>T.high=true,"formation");
    tryG("Dobierz 100 żołnierzy tieru 4","Wezwij armię albo dołącz do niej, zanim wejdziesz w bitwę.",add100,null);
    if(cf.rng>=0.3) tryG("Więcej jazdy na ich łuczników","Wróg ma dużo strzelców: jazda zjada ich najszybciej.",T=>{T.you.cav=Math.min(100,T.you.cav+15);T.you.touched=true;},"formation");
    if(cf.cav>=0.3) tryG("Więcej piechoty przeciw ich jeździe","Piechota w kwadracie zatrzymuje szarżę.",T=>{T.you.inf=Math.min(100,T.you.inf+15);T.you.touched=true;},"formation");
  }
  return out.sort((a,b)=>b.d-a.d).slice(0,4);
}
function btPlan(S, m){
  const s = [];
  if(S.mode==="siegeAtt"){
    const t = S.town;
    if(S.relief) s.push(["Odsiecz w drodze: czas gra przeciw Tobie","Nie czekaj na głód. Zrób tylko to, co najszybsze (taran, jeden wyłom), i atakuj, zanim odsiecz dotrze.","howsiege"]);
    if(t.eng>0) s.push(["Najpierw zniszcz machiny obrońców","Zbuduj 2 lub 3 trebusze albo onagery. Odstaw gotowe do rezerwy i wystaw wszystkie naraz. Bez tego wieże i taran zginą w drodze.","engines"]);
    if(t.breach<2) s.push([t.breach===0?"Potem burz mury":"Zrób drugi wyłom","Dwa wyłomy zmieniają szturm prawie w bitwę w polu, bo przez dziury wchodzi cała armia naraz.","ramwalls"]);
    if(!t.ram) s.push(["Postaw taran","Jest szybszy niż wieża i ściąga część obrońców pod bramę.","ladders"]);
    if(t.eng===0 && t.breach<2) s.push(["Wieże dopiero teraz","Wieża ma sens tylko wtedy, gdy machiny obrońców są zniszczone.","devblog"]);
    s.push(["Kiedy ruszyć", m.p>=0.7 ? "Teraz. Każdy dzień czekania to ryzyko odsieczy." : "Gdy machiny obrońców padną, masz co najmniej jeden wyłom, a szansa przekroczy 65%.","howsiege"]);
    s.push(["W bitwie: piechota przodem","Piechota z tarczami w ścianie tarcz prosto na wyłom albo bramę. Łucznicy na wzniesieniu poza zasięgiem łuków z murów. Trzymaj odwód i dorzucaj go tam, gdzie się przebijasz.","siege"]);
    s.push(["Sztuczka z bramą","Gdy Twoi są na murach, zajmij odcinek nad bramą, zejdź i otwórz bramę od środka.","ladders"]);
  } else if(S.mode==="siegeDef"){
    s.push(["Mury robią robotę","Mniejszy garnizon wytrzyma dużo większą armię, jeśli dobrze wykorzysta mury. Nie wychodź z miasta bez potrzeby.","siegedef"]);
    if(S.mine.eng<2) s.push(["Postaw machiny obronne","Machiny na murach niszczą wieże i taran. Szturm na miasto z działającymi machinami to dla wroga rzeź.","engines"]);
    s.push(["Łucznicy przy drabinach i wieżach","Najlepszych strzelców ustaw naprzeciw drabin i wież, piechotę trzymaj w odwodzie przy bramie.","siegedef"]);
    s.push(["Bij, gdy wchodzą","Atakujący na drabinach i w przejściach są najbardziej bezbronni: wtedy zabijaj jak najwięcej.","ladderkill"]);
    if(S.mine.starve>0 || S.mine.g+S.mine.m>600) s.push(["Pilnuj jedzenia","Duży garnizon szybko zjada zapasy. Racjonowanie obniża lojalność i dobrobyt, ale chroni przed głodem.","ration"]);
    s.push(["Wezwij odsiecz","Jeśli szansa jest niska, ściągnij armię sojuszników albo własnych wasali, zanim oblegający skończą machiny.","howsiege"]);
  } else {
    s.push(["Ustaw szyk przed starciem","Piechota w ścianie tarcz z przodu, strzelcy tuż za nią, najlepiej na wzniesieniu, jazda na skrzydle.","formation"]);
    s.push(["Na jazdę kwadrat, na strzały tarcze","Gdy szarżuje jazda, piechota w kwadrat. Przeciw łucznikom trzymaj tarcze, aż skończy im się amunicja. Strzelców przestaw w luźny szyk.","formation"]);
    s.push(["Młot i kowadło","Piechota z tarczami trzyma wroga w miejscu, a jazda uderza od tyłu.","tier"]);
    s.push(["Szarża na końcu","Rozkaz szarży dawaj dopiero, gdy wróg jest związany walką, inaczej Twoi się rozbiegną.","tactics"]);
    if(S.mode==="fieldDef") s.push(["Jeśli szansa jest niska, uciekaj","Gdy wróg Cię dopadnie, a doradca pokazuje mało, lepiej się wycofać i wrócić z armią, niż stracić drużynę.","begin"]);
  }
  if(S.lead==="auto") s.push(["„Wyślij wojska” to symulacja","Każdy punkt Taktyki dowódcy dodaje Twojej stronie 0,1% siły. W oblężeniu bardzo liczą się machiny i poziom murów.", S.mode.startsWith("siege")?"autores":"begin"]);
  return s;
}

let btLast = null, btDT = 0;
function btRender(){
  const S = BT, m = btModel(S), [vk, vt, vd] = btVerdict(m, S);
  const vcol = {go:"var(--gA)", prep:"var(--or)", no:"var(--gules)"}[vk];
  const conf = m.unk<=1 ? "wysoka" : m.unk<=3 ? "średnia" : "niska";
  const head = S.mode==="siegeDef" ? "Szansa na utrzymanie" : S.mode==="siegeAtt" ? "Szansa na zdobycie" : "Szansa na zwycięstwo";
  $("sg-out").innerHTML = `<div class="gauge">
     <div class="g-top"><div><span class="g-lbl">${head}</span><b class="g-num" style="color:${vcol}">${pct(m.p)}%</b></div><span class="verdict" style="--vc:${vcol}">${vt}</span></div>
     <div class="g-bar"><i style="left:${pct(m.lo)}%; width:${Math.max(2,pct(m.hi)-pct(m.lo))}%; background:${vcol}"></i><em style="left:${pct(m.p)}%"></em><span style="left:50%"></span><span style="left:70%"></span></div>
     <div class="g-scale"><span>0</span><span style="left:50%">50</span><span style="left:70%">70</span><span style="right:0">100</span></div>
     <p class="g-txt">${vd} Prawdopodobny przedział: <b>${pct(m.lo)} do ${pct(m.hi)}%</b>. Pewność oszacowania: <b>${conf}</b>${m.unk?`, bo ${m.unk} ${m.unk===1?"pole jest":"pola są"} na „nie wiem”`:""}.</p>
     <div class="g-stats">
       <div><b>${m.R.toFixed(2).replace(".",",")}</b><span>${m.extra}</span></div>
       <div><b>${m.need?("+"+m.need):"0"}</b><span>${m.needLbl}</span></div>
       <div><b>${Math.round(m.loss*0.7)} do ${Math.round(m.loss*1.3)}</b><span>${m.lossLbl}</span></div>
     </div></div>`;
  const g = btGains(S, m);
  $("sg-gains").innerHTML = g.length ? g.map(x=>`<div class="gain"><span class="gd">+${pct(x.d)} pkt</span><div><b>${x.label}</b><p>${x.how}</p>${x.src?`<div class="src">Źródło: ${srcLink(x.src)}</div>`:""}</div></div>`).join("") : `<p class="note">Nic więcej nie podniesie wyraźnie szansy.</p>`;
  $("sg-plan").innerHTML = btPlan(S, m).map(([t,b,src])=>`<li><div><b>${t}</b>${b}<div class="src">Źródło: ${srcLink(src)}</div></div></li>`).join("");
  ["you","foe"].forEach(side=>{ const el=$("bar-"+side); if(!el) return; const x=S[side], tot=Math.max(1,x.inf+x.rng+x.cav+x.ha);
    el.innerHTML=[["inf","var(--t-azure)","Piechota"],["rng","var(--t-vert)","Strzelcy"],["cav","var(--t-gules)","Jazda"],["ha","var(--t-teal)","KŁ"]].map(([k,c,l])=>{ const sh=Math.round(x[k]/tot*100); return sh>0?`<div style="flex:${x[k]}; background:${c}">${sh>=14?l+" "+sh+"%":sh+"%"}</div>`:""; }).join("");
    ["inf","rng","cav","ha"].forEach(k=>{ const o=$(`v-${side}-${k}`); if(o) o.textContent=Math.round(x[k]/tot*100)+"%"; });
    const eo=$(`v-${side}-elite`); if(eo) eo.textContent = x.elite+"%, średnio tier "+avgT(x.elite).toFixed(1).replace(".",",");
  });
  document.querySelectorAll("[data-out]").forEach(o=>{ const [grp,key,suf]=o.dataset.out.split("|"); const v=BT[grp][key]; o.textContent = key==="starve" ? (v===0?"nie głoduje":v+" dni") : v+(suf||""); });
  const lv = $("sg-live"); if(lv){
    if(!lv.firstChild) lv.innerHTML = `<div class="l-top"><span class="l-lbl"></span><span class="l-d"></span></div><b class="l-num"></b><div><div class="l-bar"><i></i><em></em></div><div class="l-rng"></div></div><span class="verdict"></span>`;
    lv.querySelector(".l-lbl").textContent = `${head}, pewność ${conf}`;
    const nb = lv.querySelector(".l-num"); nb.textContent = pct(m.p)+"%"; nb.style.color = vcol;
    const bi = lv.querySelector(".l-bar i"); bi.style.left = pct(m.lo)+"%"; bi.style.width = Math.max(2,pct(m.hi)-pct(m.lo))+"%"; bi.style.background = vcol;
    const be = lv.querySelector(".l-bar em"); be.style.left = pct(m.p)+"%"; be.style.background = vcol;
    lv.querySelector(".l-rng").textContent = `możliwe ${pct(m.lo)} do ${pct(m.hi)}%`;
    const vv = lv.querySelector(".verdict"); vv.textContent = vt; vv.style.setProperty("--vc", vcol);
    const d = pct(m.p) - (btLast ?? pct(m.p)), dl = lv.querySelector(".l-d");
    if(d){ dl.textContent = (d>0?"+":"")+d+" pkt"; dl.className = "l-d on "+(d>0?"up":"dn"); clearTimeout(btDT); btDT = setTimeout(()=>dl.classList.remove("on"), 1600); }
    btLast = pct(m.p);
  }
  document.querySelectorAll("[data-impact]").forEach(o=>{ const [g,k] = o.dataset.impact.split("|"); const T = deep(S);
    if(k==="ram") T[g].ram = !S[g].ram; else T[g].towers = S[g].towers<2 ? S[g].towers+1 : S[g].towers-1;
    const d = pct(btModel(T).p) - pct(m.p), def = S.mode==="siegeDef";
    const what = k==="ram" ? (S[g].ram ? (def?"Bez taranu wroga":"Bez taranu") : (def?"Gdy wróg postawi taran":"Z taranem")) : (S[g].towers<2 ? (def?"Z kolejną wieżą wroga":"Z kolejną wieżą") : (def?"Z jedną wieżą wroga mniej":"Z jedną wieżą mniej"));
    const why = (S.mode==="siegeAtt" ? S.town.eng : S.mine.eng) > 0 ? " Działające machiny obrońców niszczą go w drodze, więc daje mniej." : "";
    o.innerHTML = `${what} szansa: <b>${d>0?"+":""}${d} pkt</b>.${k==="ram"?why:""}`; });
  $("sg-mini").textContent = `${pct(m.p)}%, ${vt.toLowerCase()}`;
  $("sg-mini").style.background = vcol;
  const es=$("eng-sec"); if(es) es.hidden = S.mode.startsWith("field");
  store.set("battle", BT);
}

function btBuild(){
  const S = BT, mode = S.mode;
  const seg = (id, opts, val) => `<div class="seg wide" id="${id}">${opts.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${String(v)===String(val)}">${l}</button>`).join("")}</div>`;
  const rng = (grp,key,label,min,max,step,suf="%") => `<label class="sl"><span class="sl-h"><span>${label}</span><b data-out="${grp}|${key}|${suf}"></b></span><input type="range" data-g="${grp}" data-k="${key}" min="${min}" max="${max}" step="${step}" value="${S[grp][key]}"></label>`;
  const num = (grp,key,label) => `<label class="field">${label}<input type="number" inputmode="numeric" min="0" data-g="${grp}" data-k="${key}" value="${S[grp][key]}"></label>`;
  const unk = (grp,key,txt) => `<label class="check small"><input type="checkbox" data-unk="${grp}|${key}" ${S[grp][key]?"":"checked"}> ${txt}</label>`;
  const army = (side, title, hintElite) => `<div class="panel sg-card"><h3>${title}</h3>
    <div class="fields two">${num(side,"n", side==="you"?"Zdrowi żołnierze":"Liczba wojsk wroga")}
    ${side==="you" ? `<label class="field">Bitwa${seg("i-lead",[["lead","Prowadzę"],["auto","Wysyłam"]],S.lead)}</label>` : `<span></span>`}</div>
    <label class="sl"><span class="sl-h"><span>Udział elity, tier 4 do 6</span><b id="v-${side}-elite"></b></span><input type="range" data-g="${side}" data-k="elite" min="0" max="100" step="5" value="${S[side].elite}"></label>
    ${side==="foe" ? unk("foe","eliteKnown","Nie wiem, zgaduję") : `<p class="hint">${hintElite}</p>`}
    <div class="mix" id="bar-${side}"></div>
    ${[["inf","Piechota"],["rng","Łucznicy i kusznicy"],["cav","Jazda"],["ha","Konni łucznicy"]].map(([k,l])=>`<label class="sl"><span class="sl-h"><span>${l}</span><b id="v-${side}-${k}"></b></span><input type="range" data-g="${side}" data-k="${k}" data-comp="1" min="0" max="100" step="5" value="${S[side][k]}"></label>`).join("")}
    <p class="hint">Suwaki składu działają jak proporcje, nie muszą dawać razem 100.${side==="foe"?" Skład wroga zobaczysz, najeżdżając na jego oddział na mapie.":""}</p>
    ${side==="you" ? `<div id="tac-wrap" ${S.lead==="auto"?"":"hidden"}>${`<label class="field">Taktyka dowódcy<input type="number" inputmode="numeric" min="0" max="330" id="i-tac" value="${S.tac}"></label>`}</div>` : ""}
  </div>`;
  let h = "";
  if(mode==="siegeAtt"){
    const t="town";
    h += army("you","Twoje wojsko","Ilu z Twoich ludzi to tier 4, 5 i 6. Na oko wystarczy.");
    h += `<div class="panel sg-card"><h3>Obrońcy miasta</h3>
      <div class="fields two">${num(t,"g","Garnizon")}${num(t,"m","Milicja")}</div>
      ${unk(t,"splitKnown","Nie wiem dokładnie, ile to garnizon, a ile milicja")}
      <p class="hint">Obie liczby pokazuje podgląd miasta na mapie. Milicja jest słabsza od garnizonu.</p>
      ${rng(t,"gElite","Elita w garnizonie, tier 4 do 6",0,100,5)}${unk(t,"gEliteKnown","Nie wiem, zgaduję")}
      ${rng(t,"dr","Strzelcy wśród obrońców",0,100,5)}${unk(t,"drKnown","Nie wiem, zgaduję")}</div>
     <div class="panel sg-card"><h3>Mury i machiny</h3>
      <label class="field">Poziom murów${seg("w-"+t,[[1,"1"],[2,"2"],[3,"3"]],S[t].wall)}</label>${unk(t,"wallKnown","Nie wiem, jaki poziom")}
      <label class="field">Wyłomy w murach${seg("b-"+t,[[0,"Brak"],[1,"Jeden"],[2,"Dwa"]],S[t].breach)}</label>
      <label class="field">Działające machiny obrońców${seg("e-"+t,[[0,"0"],[1,"1"],[2,"2"],[3,"3"],[4,"4+"]],S[t].eng)}</label>
      <label class="field">Taran${seg("r-"+t,[["0","Nie mam"],["1","Gotowy"]],S[t].ram?"1":"0")}</label>
      <p class="sg-impact" data-impact="${t}|ram"></p>
      <label class="field">Twoje wieże oblężnicze${seg("t-"+t,[[0,"0"],[1,"1"],[2,"2"]],S[t].towers)}</label>
      <p class="sg-impact" data-impact="${t}|towers"></p></div>
     <div class="panel sg-card"><h3>Sytuacja</h3>${rng(t,"starve","Miasto głoduje od",0,20,1,"")}
      <label class="check"><input type="checkbox" data-root="relief" ${S.relief?"checked":""}> Wroga armia idzie z odsieczą</label></div>`;
  } else if(mode==="siegeDef"){
    const t="mine";
    h += army("foe","Oblegający");
    h += `<div class="panel sg-card"><h3>Twoja obrona</h3>
      <div class="fields two">${num(t,"g","Garnizon")}${num(t,"m","Milicja")}</div>
      ${rng(t,"gElite","Elita w garnizonie, tier 4 do 6",0,100,5)}
      <div class="fields two">${num(t,"pn","Twoja drużyna w mieście")}<span></span></div>
      ${rng(t,"pElite","Elita w Twojej drużynie",0,100,5)}
      ${rng(t,"dr","Strzelcy wśród obrońców",0,100,5)}
      <div class="fields two"><label class="field">Bitwa${seg("i-lead",[["lead","Prowadzę"],["auto","Wysyłam"]],S.lead)}</label><span></span></div>
      <div id="tac-wrap" ${S.lead==="auto"?"":"hidden"}><label class="field">Taktyka dowódcy<input type="number" inputmode="numeric" min="0" max="330" id="i-tac" value="${S.tac}"></label></div></div>
     <div class="panel sg-card"><h3>Mury i machiny</h3>
      <label class="field">Poziom Twoich murów${seg("w-"+t,[[1,"1"],[2,"2"],[3,"3"]],S[t].wall)}</label>
      <label class="field">Twoje działające machiny${seg("e-"+t,[[0,"0"],[1,"1"],[2,"2"],[3,"3"],[4,"4+"]],S[t].eng)}</label>
      <label class="field">Wyłomy zrobione przez wroga${seg("b-"+t,[[0,"Brak"],[1,"Jeden"],[2,"Dwa"]],S[t].breach)}</label>
      <label class="field">Taran wroga${seg("r-"+t,[["0","Nie ma"],["1","Gotowy"]],S[t].ram?"1":"0")}</label>
      <p class="sg-impact" data-impact="${t}|ram"></p>
      <label class="field">Wieże oblężnicze wroga${seg("t-"+t,[[0,"0"],[1,"1"],[2,"2"]],S[t].towers)}</label>
      <p class="sg-impact" data-impact="${t}|towers"></p>
      ${rng(t,"starve","Twoje miasto głoduje od",0,20,1,"")}</div>`;
  } else {
    h += army("you","Twoje wojsko","Ilu z Twoich ludzi to tier 4, 5 i 6. Na oko wystarczy.");
    h += army("foe","Wróg");
    h += `<div class="panel sg-card"><h3>Teren</h3><label class="check"><input type="checkbox" data-root="high" ${S.high?"checked":""}> Ja zajmę wzgórze albo lepszą pozycję</label>
      <p class="hint">W bitwie w polu atakujący i broniący liczą się podobnie, różnicę robi teren i to, kto się ustawi pierwszy.</p></div>`;
  }
  $("sg-form").innerHTML = h + `<button class="btn ghost" type="button" id="sg-reset" style="justify-self:start">Wróć do ustawień startowych</button>`;
  // podpięcia
  $("sg-form").querySelectorAll("input[data-g]").forEach(i=>i.addEventListener("input",()=>{ const g=i.dataset.g, k=i.dataset.k; BT[g][k]=Math.max(0,+i.value||0);
    if(i.dataset.comp) BT[g].touched=true;
    if(g==="foe" && k==="elite"){ BT.foe.eliteKnown=true; const c=$("sg-form").querySelector('[data-unk="foe|eliteKnown"]'); if(c) c.checked=false; }
    if(g==="town" && (k==="gElite"||k==="dr")){ const kk=k==="gElite"?"gEliteKnown":"drKnown"; BT.town[kk]=true; const c=$("sg-form").querySelector(`[data-unk="town|${kk}"]`); if(c) c.checked=false; }
    btRender(); }));
  $("sg-form").querySelectorAll("[data-unk]").forEach(c=>c.addEventListener("change",()=>{ const [g,k]=c.dataset.unk.split("|"); BT[g][k]=!c.checked; btRender(); }));
  $("sg-form").querySelectorAll("[data-bool]").forEach(c=>c.addEventListener("change",()=>{ const [g,k]=c.dataset.bool.split("|"); BT[g][k]=c.checked; btRender(); }));
  $("sg-form").querySelectorAll("[data-root]").forEach(c=>c.addEventListener("change",()=>{ BT[c.dataset.root]=c.checked; btRender(); }));
  const segBind = (id, fn) => { const el=$(id); if(!el) return; el.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ el.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed", x===b)); fn(b.dataset.v); btRender(); })); };
  segBind("i-lead", v=>{ BT.lead=v; $("tac-wrap").hidden = v!=="auto"; });
  ["town","mine"].forEach(t=>{
    segBind("w-"+t, v=>{ BT[t].wall=+v; if(t==="town"){ BT.town.wallKnown=true; const c=$("sg-form").querySelector('[data-unk="town|wallKnown"]'); if(c) c.checked=false; } });
    segBind("b-"+t, v=>BT[t].breach=+v); segBind("e-"+t, v=>BT[t].eng=+v); segBind("t-"+t, v=>BT[t].towers=+v); segBind("r-"+t, v=>BT[t].ram=v==="1");
  });
  const tac=$("i-tac"); if(tac) tac.addEventListener("input",()=>{ BT.tac=Math.min(330,Math.max(0,+tac.value||0)); btRender(); });
  $("sg-reset").addEventListener("click",()=>{ const keep=BT.mode; BT=deep(BT_DEF); BT.mode=keep; btBuild(); btRender(); });
}
function btModes(){
  $("bt-modes").innerHTML = Object.entries(MODES).map(([k,[t,d,i]])=>`<button type="button" class="mode" data-m="${k}" aria-pressed="${BT.mode===k}">${ico(i)}<b>${t}</b><small>${d}</small></button>`).join("");
  $("bt-modes").querySelectorAll(".mode").forEach(b=>b.addEventListener("click",()=>{ BT.mode=b.dataset.m; btLast=null; btModes(); btBuild(); btRender(); }));
}
btModes(); btBuild(); btRender();
