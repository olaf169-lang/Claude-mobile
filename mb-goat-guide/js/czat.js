/* ---------- CZAT Z CLAUDE'EM ---------- */
IC.quill = '<path d="M20 4c-6 0-11 4.5-12.5 11L6 20"/><path d="M20 4c-.5 5-3.5 9-9 10.5"/><path d="M9 13.5 13 9"/>';
IC.send = '<path d="M4 12 20 4l-5 16-3.5-6.5z"/><path d="M11.5 13.5 20 4"/>';
IC.stop = '<rect x="7" y="7" width="10" height="10" rx="1.5"/>';
IC.key = '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.8-8.8M16.5 6.5l2.5 2.5M14 9l2 2"/>';
IC.back = '<path d="m15 6-6 6 6 6"/>';
IC.trash = '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>';
IC.brain = '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>';

/* --- indeks wiedzy: Biblia + Kodeks + kampania --- */
const fold = s => String(s).toLowerCase().replace(/ł/g,"l").normalize("NFD").replace(/[̀-ͯ]/g,"");
const STOP = new Set("jak czy co to jest sie nie na w z do o i a ze za po od dla przy jaki jaka jakie ktory ktora mam moge mi mnie ten ta tak jeszcze bo ale lub albo czym czego gdzie kiedy ile the and for how what with".split(" "));
const toks = s => fold(s).split(/[^a-z0-9]+/).filter(w => w.length>2 && !STOP.has(w)).map(w => w.length>=6 ? w.slice(0,5) : w);
const DOCS = [];
KB.forEach(([id,t,k,x,s,v]) => DOCS.push({id, t, k, x, s, v}));
TOPICS.forEach(tp => tp.levels.forEach((lv,li) => lv.forEach((tip,i) => DOCS.push({id:`kodeks-${tp.id}-${li}-${i}`, t:`${tip[0]} (Kodeks: ${tp.name}, ${LEVELS[li]?.n||""})`, k:tp.name+" "+tp.sub, x:tip[1], s:[tip[2]], v:tip[3]}))));
if(typeof RB!=="undefined"){
  const GN = {ban:"bandyci", mer:"najemnicy z karczmy", min:"frakcja pomniejsza"};
  RB.forEach(r => DOCS.push({id:"rabusie-"+r[0].toLowerCase().replace(/[^a-z]+/g,"-"), t:`Banici i najemnicy: ${r[0]} (${r[1]})`, k:`${GN[r[2]]} ${r[3]} bandyta najemnik jeniec rekrutacja ocena`,
    x:`${r[0]} (${r[1]}), ${GN[r[2]]}, ${r[3]}, tier ${r[4]??"bd"}, rola ${ROLE[r[5]]}, ocena aplikacji ${r[7]}. Umiejętności: ${SK.map((s,i)=>s+" "+r[6][i]).join(", ")}. Żołd: ${r[8]??"bd"}. Awans: ${r[9]}. ${r[10]}`, s:[r[11],"rb_stats"], v:"różne wersje gry"}));
  Object.entries(RB_GROUPS).forEach(([k,G]) => DOCS.push({id:"rabusie-jak-"+k, t:"Banici i najemnicy: jak zdobyć, "+G.n, k:"jak zdobyć zwerbować jeńcy karczma "+G.n, x:G.how, s:[G.howSrc], v:"różne wersje gry"}));
  DOCS.push({id:"rabusie-sciezki", t:"Banici i najemnicy: od bandyty do elity", k:"awans bandytów elita fian rycerz druzhinnik kheshig faris disciplinarian", x:RB_PATHS.map(p=>`${p[0]}${p[1]?" > "+p[1]:""} > ${p[2]}: ${p[3]}`).join("\n")+"\n"+RB_TIPS.map(t=>t[0]+": "+t[1]).join("\n"), s:RB_PATHS.map(p=>p[4]).concat(RB_TIPS.map(t=>t[2])), v:"różne wersje gry"});
}
if(typeof ARMORY!=="undefined"){
  ARMORY.forEach(a => DOCS.push({id:"zbrojownia-"+a.id, t:"Zbrojownia: "+a.n, k:"najlepszy sprzęt ekwipunek gdzie kupić kultura "+a.n+" "+a.items.map(i=>i[0]).join(" "),
    x:a.why+"\n"+a.items.map(([en,pl,c,t,v,ex,note],k)=>`${k+1}. ${en} (${pl}), ${c==="any"?"bez kultury":CULT[c].n}${t?", tier "+t:""}, ${a.stat}: ${v??"bd"}${ex?"; "+ex:""}${note?". "+note:""}`).join("\n")+(a.tip?"\nRada: "+a.tip:""),
    s:[...new Set([...a.items.map(i=>i[7]), a.tipSrc].filter(Boolean))], v:"różne wersje gry"}));
  DOCS.push({id:"zbrojownia-jak", t:"Zbrojownia: jak zdobyć najlepszy sprzęt", k:"sklep tier 6 zdobyć kupić warsztat żona turniej kuźnia", x:ARMORY_HOW.map(h=>h[0]+": "+h[1]).join("\n"), s:ARMORY_HOW.map(h=>h[2]), v:"różne wersje gry"});
}
MYCAMP.forEach((c,i) => DOCS.push({id:"kampania-"+i, t:"Twoja kampania: "+c[0], k:"bakalland ortyzja taraktor kampania moje", x:c[1], s:[c[2]], v:"kampania"}));
DOCS.forEach(d => { d._t = fold(d.t); d._k = fold(d.k); d._x = fold(d.x); });
function kbSearch(q, limit=5){
  const qt = [...new Set(toks(q))]; if(!qt.length) return [];
  return DOCS.map(d => { let sc = 0, hit = 0;
      qt.forEach(w => { let h = 0; if(d._t.includes(w)){ sc+=4; h=1; } if(d._k.includes(w)){ sc+=3; h=1; } const m = d._x.split(w).length-1; if(m){ sc += Math.min(3,m); h=1; } hit+=h; });
      return {d, sc: sc*(0.6+0.4*hit/qt.length)}; })
    .filter(r => r.sc>0).sort((a,b) => b.sc-a.sc).slice(0,limit).map(r => r.d);
}
const docOut = d => ({id:d.id, tytul:d.t, wersja:d.v, zrodla:(d.s||[]).map(k=>SRC[k]?.[0]).filter(Boolean), tresc:d.x.slice(0,1800)});

/* --- narzędzia dla modelu --- */
function unitOut(u){ const o = {en:u.n, pl:u.pl, kultura:CULT[u.c]?.n, tier:u.t, rola:ROLE[u.r], typ:u.sub, ocena:u.g||"bd", pancerz:u.a??"bd", zold:WAGE[u.t], opis:u.note};
  o.umiejetnosci = Object.fromEntries(SK.map((n,i)=>[n, u.sk[i]??"bd"])); if(u.ws) o.war_sails = true; return o; }
const CHAT_TOOLS = [
  { name:"search_kb", description:"Przeszukuje Biblię Bannerlorda w aplikacji (mechaniki, wzory, łatka 1.5, War Sails, strategie graczy, Kodeks, kampania gracza). Zapytanie po polsku lub angielsku, krótkie hasła. Wołaj kilka razy z różnymi hasłami, gdy temat jest szeroki.",
    inputSchema:{type:"object", properties:{query:{type:"string"}, limit:{type:"integer", minimum:1, maximum:8}}, required:["query"]},
    execute:({query, limit}) => { const r = kbSearch(query, Math.min(8, limit||4)); r.forEach(d => CHAT.used.add(d.id)); return r.length ? r.map(docOut) : {brak:"Nic nie znaleziono, spróbuj innych słów."}; } },
  { name:"get_units", description:"Dane jednostek z aplikacji: nazwa PL i EN, kultura, tier, rola, ocena S do D, pancerz, umiejętności, żołd. Filtry opcjonalne: query (fragment nazwy), culture (emp, vla, stu, bat, ase, khu, nor), role (inf, rng, cav, ha), tier (1 do 6).",
    inputSchema:{type:"object", properties:{query:{type:"string"}, culture:{type:"string"}, role:{type:"string"}, tier:{type:"integer"}}},
    execute:({query, culture, role, tier}) => { const q = query ? fold(query) : null;
      const r = U.filter(u => (!q || fold(u.n+" "+u.pl).includes(q)) && (!culture || u.c===culture) && (!role || u.r===role) && (!tier || u.t===tier));
      return r.length ? r.slice(0,12).map(unitOut) : {brak:"Brak jednostek dla tych filtrów."}; } },
  { name:"get_my_battle", description:"Zwraca bitwę, którą gracz ma teraz ustawioną w Doradcy bitwy w aplikacji: tryb, liczebności, skład, mury, machiny, oraz wynik modelu aplikacji (szansa, zakres niepewności, czego brakuje, co da największy skok).",
    inputSchema:{type:"object", properties:{}},
    execute:() => battleOut(BT) },
  { name:"battle_estimate", description:"Liczy szansę bitwy modelem aplikacji dla podanych danych. mode: siegeAtt (gracz szturmuje), siegeDef (gracz broni miasta), fieldAtt, fieldDef. you i foe: {n, elite (procent T4 do T6), inf, rng, cav, ha (procenty składu)}. town (gdy siegeAtt): {g garnizon, m milicja, gElite, dr procent strzelców, wall 1 do 3, breach 0 do 2, eng machiny obrońców 0 do 4, ram true/false, towers 0 do 2, starve dni głodu}. mine (gdy siegeDef): {g, m, gElite, pn ludzie gracza w środku, pElite, dr, wall, eng, breach, starve}. lead: lead (gracz dowodzi) albo auto. Pola pominięte biorą wartości z bitwy ustawionej w aplikacji.",
    inputSchema:{type:"object", properties:{mode:{type:"string"}, you:{type:"object", properties:{n:{type:"number"}, elite:{type:"number"}, inf:{type:"number"}, rng:{type:"number"}, cav:{type:"number"}, ha:{type:"number"}}}, foe:{type:"object", properties:{n:{type:"number"}, elite:{type:"number"}, inf:{type:"number"}, rng:{type:"number"}, cav:{type:"number"}, ha:{type:"number"}}}, town:{type:"object", properties:{g:{type:"number"}, m:{type:"number"}, gElite:{type:"number"}, pn:{type:"number"}, pElite:{type:"number"}, dr:{type:"number"}, wall:{type:"integer"}, breach:{type:"integer"}, eng:{type:"integer"}, ram:{type:"boolean"}, towers:{type:"integer"}, starve:{type:"number"}}}, mine:{type:"object", properties:{g:{type:"number"}, m:{type:"number"}, gElite:{type:"number"}, pn:{type:"number"}, pElite:{type:"number"}, dr:{type:"number"}, wall:{type:"integer"}, breach:{type:"integer"}, eng:{type:"integer"}, ram:{type:"boolean"}, towers:{type:"integer"}, starve:{type:"number"}}}, lead:{type:"string"}, tac:{type:"number"}, high:{type:"boolean"}, relief:{type:"boolean"}}},
    execute:(a) => { const S = deep(BT);
      ["mode","lead","tac","high","relief"].forEach(k => { if(a[k]!==undefined) S[k]=a[k]; });
      if(!MODES[S.mode]) throw new Error("Nieznany tryb: "+S.mode);
      ["you","foe","town","mine"].forEach(k => { if(a[k] && typeof a[k]==="object") Object.assign(S[k], a[k], k==="town"?{splitKnown:true,gEliteKnown:true,wallKnown:true,drKnown:true}:k==="you"?{touched:true}:k==="foe"?{touched:true, eliteKnown:a[k].elite!==undefined}:{}); });
      return battleOut(S); } }
];
function battleOut(S){
  const m = btModel(S), g = btGains(S, m);
  const pick = S.mode==="siegeAtt" ? {you:S.you, town:S.town} : S.mode==="siegeDef" ? {foe:S.foe, mine:S.mine} : {you:S.you, foe:S.foe, wzgorze:S.high};
  return { tryb:MODES[S.mode][0], dowodzenie:S.lead==="auto"?"automat":"gracz", dane:pick, odsiecz:!!S.relief,
    szansa_proc:pct(m.p), zakres_proc:[pct(m.lo), pct(m.hi)], stosunek_sil:+m.R.toFixed(2), niewiadome:m.unk,
    brakuje:m.need ? `${m.need} ${m.needLbl}` : "nic", straty_orient:`${m.loss} ${m.lossLbl}`,
    najwiekszy_skok:g.map(x => `${x.label}: +${pct(x.d)} pkt (${x.how})`),
    uwaga:"Model aplikacji: przybliżenie oparte na mechanice gry i doświadczeniach graczy, nie wzór TaleWorlds." };
}

/* --- polecenia dla modelu --- */
const CHAT_SYS = `Jesteś doradcą wbudowanym w aplikację M&B Goat Guide. Rozmawiasz z Olafem, który gra w Mount & Blade II: Bannerlord.
KONTEKST GRACZA: PS5, łatka 1.5 (na PC to 1.5.7, wyszła 11 listopada 2026) z opcjami startu i przeszukiwaniem pobojowisk. Ma zainstalowany War Sails, ale gra starą kampanię bez morza. Królestwo Bakalland, klan battański, miasto Ortyzja (kultura cesarska), zamek Taraktor. Na konsoli nie ma modów ani komend: nigdy ich nie proponuj.
ZASADY:
1. Pisz po polsku, rzeczowo, pod ekran telefonu. Nigdy nie używaj pauzy ani półpauzy (znaków \u2014 i \u2013). Zamiast nich przecinek, dwukropek, kropka albo słowo "do" w zakresach (np. "3 do 5").
2. Opieraj się na fragmentach Biblii w <biblia>. Gdy to za mało, wołaj search_kb (kilka razy, różne hasła, także angielskie). Jednostki: get_units. Bitwy i szanse: get_my_battle i battle_estimate. Nie zgaduj liczb, które możesz sprawdzić.
3. Oddzielaj pewność: mechanika gry, praktyka graczy, model aplikacji, Twój szacunek. Gdy w Biblii czegoś nie ma, powiedz to wprost i podaj najlepszą wiedzę z zaznaczeniem, że w 1.5 mogło się zmienić.
4. Gdy liczysz, pokaż rachunek w jednej, dwóch linijkach.
5. Format: zacznij od odpowiedzi w 1 do 2 zdaniach, potem konkretne kroki. Markdown: **pogrubienie**, listy "- " lub "1. ", nagłówki "### " tylko gdy pomagają. Bez wstępów i bez powtarzania pytania.
6. Nazwy z gry podawaj po polsku z angielską w nawiasie, gdy to pomaga znaleźć coś w menu.`;
const CHAT_MM = `TRYB MASTERMIND: głęboka analiza strategiczna. Zanim odpowiesz, przeszukaj Biblię co najmniej dwa razy różnymi hasłami i, jeśli chodzi o bitwę, policz warianty przez battle_estimate.
Struktura odpowiedzi:
### Diagnoza: co naprawdę decyduje w tej sytuacji.
### Liczby: wzory i rachunek krok po kroku, z oznaczeniem, co jest z gry, a co z modelu.
### Opcje: 2 do 4 strategii, także te sprawdzone przez graczy z forów. Porównaj w tabeli: koszt, czas, ryzyko, spodziewany efekt.
### Plan: kroki w kolejności z punktami decyzji "jeśli X, to Y".
### Ryzyka i co sprawdzić w grze: co może zepsuć plan i gdzie w menu zweryfikować liczby.`;

/* --- stan --- */
const CHAT = { sample:null, busy:false, ctrl:null, used:new Set(), mode:store.get("chatMode","std"), hist:store.get("chat",[]) };
const saveHist = () => store.set("chat", CHAT.hist.slice(-40));
const nodash = s => s.replace(/(\d)\s*[–—]\s*(\d)/g,"$1 do $2").replace(/\s[–—]\s/g,", ").replace(/[–—]/g,"-");

/* --- markdown na bezpieczny HTML --- */
function inl(s){ return esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g,"$1<i>$2</i>"); }
function md(src){
  const L = src.split("\n"); let h = "", list = null, para = [];
  const flushP = () => { if(para.length){ h += `<p>${para.map(inl).join("<br>")}</p>`; para = []; } };
  const flushL = () => { if(list){ h += `<${list.t}>${list.items.map(x=>`<li>${inl(x)}</li>`).join("")}</${list.t}>`; list = null; } };
  for(let i=0; i<L.length; i++){
    const l = L[i], t = l.trim();
    if(/^\|.*\|$/.test(t) && i+1<L.length && /^\|[\s:|-]+\|$/.test(L[i+1].trim())){
      flushP(); flushL(); const row = r => r.trim().slice(1,-1).split("|").map(c=>c.trim());
      const head = row(t); i++; const body = [];
      while(i+1<L.length && /^\|.*\|$/.test(L[i+1].trim())){ i++; body.push(row(L[i])); }
      h += `<div class="tbl"><table><thead><tr>${head.map(c=>`<th>${inl(c)}</th>`).join("")}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; continue; }
    let m;
    if(!t){ flushP(); flushL(); continue; }
    if((m = t.match(/^#{1,4}\s+(.*)/))){ flushP(); flushL(); h += `<h3>${inl(m[1])}</h3>`; continue; }
    if((m = t.match(/^[-*•]\s+(.*)/))){ flushP(); if(!list || list.t!=="ul"){ flushL(); list={t:"ul",items:[]}; } list.items.push(m[1]); continue; }
    if((m = t.match(/^\d+[.)]\s+(.*)/))){ flushP(); if(!list || list.t!=="ol"){ flushL(); list={t:"ol",items:[]}; } list.items.push(m[1]); continue; }
    if(list && /^\s{2,}/.test(l)){ list.items[list.items.length-1] += " "+t; continue; }
    flushL(); para.push(t);
  }
  flushP(); flushL(); return h;
}


/* --- poza claude.ai: własny klucz, trzymany tylko w tym telefonie ---
   gemini: darmowy klucz z Google AI Studio (domyślnie), claude: płatny klucz API Anthropic. */
const API = { prov: store.get("apiProv","gemini"), keys: { claude: store.get("apiKey",""), gemini: store.get("gemKey","") } };
const PROV = {
  gemini: { nazwa:"Gemini (Google)", krotko:"Gemini", store:"gemKey", ph:"AIza…", koszt:"Darmowy klucz z limitem pytań na minutę i na dzień." },
  claude: { nazwa:"Claude (Anthropic)", krotko:"Claude", store:"apiKey", ph:"sk-ant-…", koszt:"Płatny według zużycia. Tryb Zwykły używa modelu Sonnet, Mastermind droższego Opus." }
};
const apiKey = () => API.keys[API.prov] || "";
const makeSample = () => API.prov==="gemini" ? geminiSample() : apiSample();
const API_MODEL = { std:"claude-sonnet-5-5", mm:"claude-opus-5-5" };
function apiSample(){
  return async function(input, opts={}){
    const mm = opts.modelTier==="complex";
    const tools = (opts.tools||[]).map(t => ({name:t.name, description:t.description, input_schema:t.inputSchema||{type:"object", properties:{}}}));
    const messages = typeof input==="string" ? [{role:"user", content:input}] : input.map(m => ({role:m.role, content:m.content}));
    let full = "";
    const fail = (code, msg) => { const e = new Error(msg); e.code = code; e.text = full; return e; };
    for(let krok=0; krok<10; krok++){
      let res;
      try{
        res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", signal:opts.signal,
          headers:{ "content-type":"application/json", "x-api-key":API.keys.claude, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
          body:JSON.stringify({ model: mm ? API_MODEL.mm : API_MODEL.std, max_tokens: mm ? 8000 : 3000, stream:true, tools, messages }) });
      }catch(e){ if(opts.signal?.aborted) throw e; throw fail("offline", "Brak połączenia z internetem."); }
      if(!res.ok){ let m = ""; try{ m = (await res.json()).error?.message || ""; }catch(e){}
        throw fail(res.status===429||res.status===529 ? "rate_limited" : res.status===401||res.status===403 ? "bad_key" : "api_error", m || "HTTP "+res.status); }
      const bloki = []; let stop = null, buf = "";
      const rd = res.body.getReader(), dec = new TextDecoder();
      for(;;){ const {value, done} = await rd.read(); if(done) break; buf += dec.decode(value, {stream:true});
        let i; while((i = buf.indexOf("\n\n")) >= 0){ const kaw = buf.slice(0,i); buf = buf.slice(i+2);
          const linia = kaw.split("\n").find(l => l.startsWith("data:")); if(!linia) continue;
          let ev; try{ ev = JSON.parse(linia.slice(5)); }catch(e){ continue; }
          if(ev.type==="content_block_start"){ bloki[ev.index] = {...ev.content_block, _json:""}; if(bloki[ev.index].type==="text") bloki[ev.index].text = ""; }
          else if(ev.type==="content_block_delta"){ const b = bloki[ev.index]; if(!b) continue;
            if(ev.delta.type==="text_delta"){ b.text += ev.delta.text; full += ev.delta.text; opts.onText?.({text:full, delta:ev.delta.text}); }
            else if(ev.delta.type==="input_json_delta") b._json += ev.delta.partial_json; }
          else if(ev.type==="message_delta") stop = ev.delta?.stop_reason || stop;
          else if(ev.type==="error") throw fail(ev.error?.type==="overloaded_error" ? "rate_limited" : "api_error", ev.error?.message || "Błąd API");
        } }
      const tresc = bloki.filter(Boolean).map(b => b.type==="text" ? {type:"text", text:b.text}
        : b.type==="tool_use" ? {type:"tool_use", id:b.id, name:b.name, input:(()=>{ try{ return b._json ? JSON.parse(b._json) : (b.input||{}); }catch(e){ return {}; } })()} : null).filter(x => x && (x.type!=="text" || x.text));
      if(stop!=="tool_use") return {text:full, truncated:stop==="max_tokens"};
      messages.push({role:"assistant", content:tresc});
      const wyniki = [];
      for(const u of tresc.filter(x => x.type==="tool_use")){ const t = (opts.tools||[]).find(t => t.name===u.name); let out, blad = false;
        try{ if(!t) throw new Error("Nie ma takiego narzędzia"); out = await t.execute(u.input||{}); }catch(e){ out = String(e?.message||e); blad = true; }
        wyniki.push({type:"tool_result", tool_use_id:u.id, content: typeof out==="string" ? out : JSON.stringify(out), is_error:blad}); }
      messages.push({role:"user", content:wyniki});
      if(full && !/\n\n$/.test(full)){ full += "\n\n"; }
    }
    return {text:full, truncated:true};
  };
}

/* Gemini: ten sam kontrakt co sample(input, opts) z claude.ai. Modele Google często
   zmieniają nazwy, więc próbujemy po kolei, aż któryś odpowie. */
const GEM_MODELE = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-lite-latest"];
function gemSchema(s){
  if(!s || typeof s!=="object") return s;
  const o = {}; for(const [k,v] of Object.entries(s)){ if(k==="properties") o.properties = Object.fromEntries(Object.entries(v).map(([n,p]) => [n, gemSchema(p)])); else o[k] = v; }
  return o;
}
function geminiSample(){
  return async function(input, opts={}){
    const mm = opts.modelTier==="complex";
    const decl = (opts.tools||[]).map(t => { const d = {name:t.name, description:t.description}; const p = t.inputSchema;
      if(p && p.properties && Object.keys(p.properties).length) d.parameters = gemSchema(p); return d; });
    const msgs = typeof input==="string" ? [{role:"user", content:input}] : input;
    const contents = msgs.map(m => ({role: m.role==="assistant" ? "model" : "user", parts:[{text:m.content}]}));
    let full = "";
    const fail = (code, msg) => { const e = new Error(msg); e.code = code; e.text = full; return e; };
    let mi = Math.max(0, GEM_MODELE.indexOf(store.get("gemModel", GEM_MODELE[0])));
    for(let krok=0; krok<10; krok++){
      let res;
      for(;;){
        try{
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEM_MODELE[mi]}:streamGenerateContent?alt=sse`, { method:"POST", signal:opts.signal,
            headers:{ "content-type":"application/json", "x-goog-api-key":API.keys.gemini },
            body:JSON.stringify({ contents, tools: decl.length ? [{functionDeclarations:decl}] : undefined, generationConfig:{ maxOutputTokens: mm ? 8192 : 3072 } }) });
        }catch(e){ if(opts.signal?.aborted) throw e; throw fail("offline", "Brak połączenia z internetem."); }
        if(res.status===404 && mi < GEM_MODELE.length-1){ mi++; continue; }
        break;
      }
      if(!res.ok){ let m = ""; try{ m = (await res.json()).error?.message || ""; }catch(e){}
        throw fail(res.status===429 ? "rate_limited" : (res.status===400 && /api key/i.test(m)) || res.status===401 || res.status===403 ? "bad_key" : "api_error", m || "HTTP "+res.status); }
      store.set("gemModel", GEM_MODELE[mi]);
      const czesci = []; let koniec = null, buf = "";
      const rd = res.body.getReader(), dec = new TextDecoder();
      for(;;){ const {value, done} = await rd.read(); if(done) break; buf += dec.decode(value, {stream:true}).replace(/\r\n/g, "\n");
        let i; while((i = buf.indexOf("\n\n")) >= 0){ const kaw = buf.slice(0,i); buf = buf.slice(i+2);
          const linia = kaw.split("\n").find(l => l.startsWith("data:")); if(!linia) continue;
          let ev; try{ ev = JSON.parse(linia.slice(5)); }catch(e){ continue; }
          if(ev.error) throw fail(ev.error.code===429 ? "rate_limited" : "api_error", ev.error.message || "Błąd Gemini");
          const kand = ev.candidates?.[0]; if(!kand) continue;
          for(const p of kand.content?.parts || []){
            czesci.push(p);
            if(p.text && !p.thought){ full += p.text; opts.onText?.({text:full, delta:p.text}); }
          }
          if(kand.finishReason) koniec = kand.finishReason;
        } }
      const wywolania = czesci.filter(p => p.functionCall);
      if(!wywolania.length) return {text:full, truncated:koniec==="MAX_TOKENS"};
      contents.push({role:"model", parts:czesci});   // całe części, z podpisami myśli, tak jak przyszły
      const odp = [];
      for(const p of wywolania){ const {name, args} = p.functionCall; const t = (opts.tools||[]).find(t => t.name===name); let out;
        try{ if(!t) throw new Error("Nie ma takiego narzędzia"); out = await t.execute(args||{}); }catch(e){ out = {blad:String(e?.message||e)}; }
        odp.push({functionResponse:{name, response: Array.isArray(out) || typeof out!=="object" ? {wynik:out} : out}}); }
      contents.push({role:"user", parts:odp});
      if(full && !/\n\n$/.test(full)) full += "\n\n";
    }
    return {text:full, truncated:true};
  };
}

/* --- UI --- */
document.body.insertAdjacentHTML("beforeend", `
<button class="ask-fab" id="ask-fab" type="button" aria-label="Zapytaj doradcę">${ico("quill")}<span>Zapytaj</span></button>
<div class="chat" id="chat" role="dialog" aria-modal="true" aria-labelledby="chat-h">
  <div class="chat-top">
    <div class="chat-top-in">
      <button class="iconbtn" id="chat-close" type="button" aria-label="Wróć do aplikacji">${ico("back")}</button>
      <h2 id="chat-h">Zapytaj Claude'a</h2>
      <button class="iconbtn" id="chat-key" type="button" aria-label="Klucz API" hidden>${ico("key")}</button>
      <button class="iconbtn" id="chat-clear" type="button" aria-label="Wyczyść rozmowę">${ico("trash")}</button>
    </div>
    <div class="chat-mode">
      <div class="seg" role="group" aria-label="Tryb odpowiedzi">
        <button type="button" data-m="std">${ico("quill")}Zwykły</button>
        <button type="button" data-m="mm">${ico("brain")}Mastermind</button>
      </div>
      <p id="chat-mode-note"></p>
    </div>
  </div>
  <div class="chat-body" id="chat-body"><div class="chat-list" id="chat-list" aria-live="polite"></div></div>
  <div class="chat-foot">
    <div class="chat-foot-in">
      <textarea id="chat-in" rows="1" placeholder="Napisz pytanie o grę…" aria-label="Twoje pytanie"></textarea>
      <button class="chat-send" id="chat-send" type="button" aria-label="Wyślij">${ico("send")}</button>
    </div>
    <p class="chat-note">Odpowiada Claude na podstawie Biblii Bannerlorda w aplikacji. Sprawdzaj kluczowe liczby w grze.</p>
  </div>
</div>`);
$("flags").insertAdjacentHTML("beforebegin", `<button class="ask-band" id="ask-band" type="button">${ico("quill")}<div><b>Zapytaj doradcę</b><span>Czego nie ma w aplikacji, wyjaśnię tutaj. Tryb Mastermind liczy strategię do spodu.</span></div></button>`);

const MODE_NOTE = { std:"Szybka, konkretna odpowiedź oparta na Biblii Bannerlorda.", mm:"Głęboka analiza: wyliczenia, porównanie strategii graczy, plan z punktami decyzji. Trwa dłużej." };
function setChatMode(m){ CHAT.mode = m; store.set("chatMode", m);
  document.querySelectorAll(".chat-mode .seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.m===m));
  $("chat-mode-note").textContent = MODE_NOTE[m]; }
setChatMode(CHAT.mode==="mm" ? "mm" : "std");
document.querySelectorAll(".chat-mode .seg button").forEach(b => b.addEventListener("click", () => setChatMode(b.dataset.m)));

function viewNow(){ const h = (location.hash||"#start").slice(1)||"start"; return h; }
function contextLine(){
  const h = viewNow();
  if(h==="doradca"){ const m = btModel(BT); return `Gracz jest w Doradcy bitwy: ${MODES[BT.mode][0]}, model daje ${pct(m.p)}% (zakres ${pct(m.lo)} do ${pct(m.hi)}%).`; }
  if(h.startsWith("kodeks-")){ const t = TOPICS.find(x => x.id===h.slice(7)); return t ? `Gracz czyta Kodeks: ${t.name}.` : ""; }
  if(h.startsWith("drzewka")) return "Gracz ogląda drzewka awansów jednostek.";
  if(h==="wojska") return "Gracz przegląda listę wojsk i porównywarkę.";
  if(h==="narzedzia") return "Gracz jest w kalkulatorach: żołd, jedzenie, limit drużyny, lojalność.";
  return "";
}
function chips(){
  const h = viewNow(), c = [];
  if(h==="doradca") c.push("Rozpisz mi plan na tę bitwę, krok po kroku", "Co mi da największy skok szans i dlaczego?");
  else if(h.startsWith("kodeks-krolestwo")) c.push("Jak przeciągnąć lorda do Bakallandu najtaniej?", "Jak utrzymać lojalność Ortyzji?");
  else if(h.startsWith("kodeks-pieniadze")) c.push("Jak najszybciej zarobić 500 tysięcy na moim etapie?");
  else if(h==="wojska" || h.startsWith("drzewka")) c.push("Jaki skład armii na szturm miasta?", "Battania czy Wlandia: kogo awansować na elitę?");
  c.push("Dlaczego gracze chowają trebusze do rezerwy?", "Ortyzja jest cesarska: jak trzymać lojalność?", "Co zmieniła łatka 1.5 dla mojej kampanii?", "Jak zebrać armię najtaniej we wpływach?");
  return [...new Set(c)].slice(0,5);
}
function keyCard(){
  const P = PROV[API.prov], has = !!apiKey();
  const kroki = API.prov==="gemini" ? `<ol class="key-steps">
      <li>Wejdź na <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> i zaloguj się kontem Google.</li>
      <li>Stuknij „Create API key” (Utwórz klucz). Nie podajesz karty, klucz jest darmowy.</li>
      <li>Skopiuj klucz, wklej go poniżej i zapisz.</li></ol>`
    : `<ol class="key-steps">
      <li>Wejdź na <a href="https://console.anthropic.com" target="_blank" rel="noopener">console.anthropic.com</a> i załóż konto. To osobne konto od subskrypcji Claude.</li>
      <li>W zakładce Billing doładuj kilka dolarów i ustaw miesięczny limit wydatków.</li>
      <li>W zakładce API Keys utwórz klucz, wklej go poniżej i zapisz.</li></ol>`;
  return `<div class="chat-empty key-card"><h3>${has?"Twój klucz":"Podłącz czat"}</h3>
    <p>Poza claude.ai czat potrzebuje klucza do modelu językowego. Klucz zostaje tylko w tym telefonie i trafia wyłącznie do wybranej usługi.</p>
    <div class="seg prov-seg" role="group" aria-label="Kto odpowiada">
      <button type="button" data-p="gemini" aria-pressed="${API.prov==="gemini"}">Gemini, darmowo</button>
      <button type="button" data-p="claude" aria-pressed="${API.prov==="claude"}">Claude, płatnie</button></div>
    <p class="hint">${esc(P.koszt)}${API.prov==="gemini" ? " Google może używać pytań z darmowego klucza do ulepszania swoich modeli." : ""}</p>
    ${has ? `<p>Klucz ${esc(P.krotko)} jest zapisany: <b>…${esc(apiKey().slice(-4))}</b>. Możesz go podmienić albo usunąć.</p>` : kroki}
    <div class="key-row"><input id="key-in" type="password" placeholder="${P.ph}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Klucz ${esc(P.krotko)}"><button class="btn" type="button" id="key-save">Zapisz</button></div>
    ${has ? `<div class="key-row"><button class="btn ghost" type="button" id="key-del">Usuń klucz</button><button class="btn ghost" type="button" id="key-back">Wróć do rozmowy</button></div>` : ""}</div>`;
}
function setProv(p){ API.prov = p; store.set("apiProv", p); CHAT.sample = apiKey() ? makeSample() : null; syncKeyUI(); }
function bindKey(){
  document.querySelectorAll(".prov-seg [data-p]").forEach(b => b.addEventListener("click", () => { setProv(b.dataset.p); CHAT.showKey = true; render(); }));
  $("key-save")?.addEventListener("click", () => { const v = $("key-in").value.trim(); if(!v) return; API.keys[API.prov] = v; store.set(PROV[API.prov].store, v); CHAT.sample = makeSample(); CHAT.showKey = false; render(); syncKeyUI(); });
  $("key-del")?.addEventListener("click", () => { API.keys[API.prov] = ""; store.set(PROV[API.prov].store, ""); CHAT.sample = null; render(); syncKeyUI(); });
  $("key-back")?.addEventListener("click", () => { CHAT.showKey = false; render(); });
}
function syncKeyUI(){
  const api = CHAT.via==="api", has = !!apiKey();
  $("chat-key").hidden = !api || !has; $("chat-in").disabled = api && !has; $("chat-send").disabled = api && !has;
  const kto = api ? PROV[API.prov].krotko : "Claude";
  $("chat-h").textContent = api && API.prov==="gemini" ? "Zapytaj doradcę" : "Zapytaj Claude'a";
  document.querySelector(".chat-note").textContent = `Odpowiada ${kto} na podstawie Biblii Bannerlorda w aplikacji. Sprawdzaj kluczowe liczby w grze.`;
}
function render(){
  const L = $("chat-list");
  if(CHAT.via==="api" && (!apiKey() || CHAT.showKey)){ L.innerHTML = keyCard(); bindKey(); return; }
  if(!CHAT.hist.length){
    L.innerHTML = `<div class="chat-empty"><h3>O co chcesz zapytać?</h3><p>Mam w głowie mechaniki, wzory, łatkę 1.5, War Sails i sprawdzone strategie graczy. Znam Twoją kampanię i bitwę z Doradcy.</p>
      <div class="chat-chips">${chips().map(q=>`<button class="chip" type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>`;
    L.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => ask(b.dataset.q)));
    return;
  }
  L.innerHTML = CHAT.hist.map((m,i) => m.r==="user" ? `<div class="msg me">${esc(m.t)}</div>` : aiHTML(m, i)).join("");
}
function aiHTML(m, i){
  const tag = m.m==="mm" ? `<div class="tag">${ico("brain")}Mastermind</div>` : "";
  const src = (m.src||[]).length ? `<div class="msg-src">Na podstawie: ${m.src.map(k=>srcLink(k)).join("")}</div>` : "";
  const body = m.err ? `${m.t?md(m.t):""}<p class="err">${esc(m.err)}</p>` : (m.t ? md(m.t) : `<p class="wait">${m.m==="mm"?"Analizuję i liczę…":"Myślę…"}</p>`);
  return `<div class="msg ai${m.m==="mm"?" mm":""}" id="ai-${i}">${tag}${body}${src}</div>`;
}
const scrollEnd = () => { const b = $("chat-body"); b.scrollTop = b.scrollHeight; };
function openChat(prefill){ $("chat").classList.add("on"); document.body.classList.add("chat-open"); render(); scrollEnd();
  if(prefill){ $("chat-in").value = prefill; grow(); } setTimeout(()=>$("chat-in").focus({preventScroll:true}), 60); }
function closeChat(){ $("chat").classList.remove("on"); document.body.classList.remove("chat-open"); }
$("ask-fab").addEventListener("click", () => openChat());
$("ask-band").addEventListener("click", () => openChat());
$("chat-close").addEventListener("click", closeChat);
document.addEventListener("keydown", e => { if(e.key==="Escape" && $("chat").classList.contains("on")) closeChat(); });
$("chat-key").addEventListener("click", () => { CHAT.showKey = true; render(); });
$("chat-clear").addEventListener("click", () => { if(CHAT.busy) CHAT.ctrl?.abort(); CHAT.hist = []; saveHist(); render(); });
const grow = () => { const t = $("chat-in"); t.style.height = "auto"; t.style.height = Math.min(140, t.scrollHeight)+"px"; };
$("chat-in").addEventListener("input", grow);
$("chat-in").addEventListener("keydown", e => { if(e.key==="Enter" && !e.shiftKey && !e.isComposing && matchMedia("(pointer:fine)").matches){ e.preventDefault(); ask(); } });
$("chat-send").addEventListener("click", () => CHAT.busy ? CHAT.ctrl?.abort() : ask());
function setBusy(b){ CHAT.busy = b; const s = $("chat-send"); s.classList.toggle("stop", b); s.innerHTML = ico(b?"stop":"send"); s.setAttribute("aria-label", b?"Zatrzymaj odpowiedź":"Wyślij"); }

async function ask(q){
  q = (q ?? $("chat-in").value).trim(); if(!q || CHAT.busy) return;
  if(!CHAT.sample){ if(CHAT.via==="api"){ CHAT.showKey = true; render(); } return; }
  $("chat-in").value = ""; grow();
  const mode = CHAT.mode, prior = CHAT.hist.filter(m => !m.err && m.t).slice(-10);
  CHAT.hist.push({r:"user", t:q}); const ai = {r:"assistant", t:"", m:mode, src:[]}; CHAT.hist.push(ai); render(); scrollEnd();
  const idx = CHAT.hist.length-1, el = () => $("ai-"+idx);
  CHAT.used = new Set();
  const h = viewNow(), hint = h==="doradca" ? ({siegeAtt:"oblężenie szturm machiny mury", siegeDef:"obrona oblężenie garnizon", fieldAtt:"bitwa pole taktyka formacje", fieldDef:"bitwa pole taktyka obrona"}[BT.mode]||"") : h.startsWith("kodeks-") ? (TOPICS.find(x=>x.id===h.slice(7))?.name||"") : "";
  const found = kbSearch(q + " " + hint + " " + (prior.slice(-2).map(m=>m.r==="user"?m.t:"").join(" ")), mode==="mm" ? 8 : 5);
  found.forEach(d => CHAT.used.add(d.id));
  const ctx = contextLine();
  const prompt = `${CHAT_SYS}\n${mode==="mm" ? "\n"+CHAT_MM+"\n" : ""}
${ctx ? "TERAZ W APLIKACJI: "+ctx+"\n" : ""}<biblia>\n${found.map(d => `## ${d.t} [${d.v}; źródła: ${(d.s||[]).map(k=>SRC[k]?.[0]).filter(Boolean).join(", ")}]\n${d.x}`).join("\n\n")}\n</biblia>\n\nPYTANIE GRACZA:\n${q}`;
  let msgs = prior.map(m => ({role:m.r, content:m.t}));
  while(msgs.length && msgs[0].role!=="user") msgs.shift();
  msgs.push({role:"user", content:prompt});
  CHAT.ctrl = new AbortController(); setBusy(true);
  let raf = 0; const paint = () => { raf = 0; const e = el(); if(e){ e.outerHTML = aiHTML(ai, idx); } const b = $("chat-body"); if(b.scrollHeight - b.scrollTop - b.clientHeight < 160) scrollEnd(); };
  try{
    const res = await CHAT.sample(msgs, { signal:CHAT.ctrl.signal, cache:false, modelTier: mode==="mm" ? "complex" : "default", tools:CHAT_TOOLS,
      onText:({text}) => { ai.t = nodash(text); if(!raf) raf = requestAnimationFrame(paint); } });
    ai.t = nodash(res.text || ai.t);
    if(res.truncated) ai.t += "\n\n*(Odpowiedź ucięta, bo była za długa. Dopytaj o konkretny fragment.)*";
  }catch(e){
    if(e?.text) ai.t = nodash(e.text);
    if(e?.name==="AbortError" || CHAT.ctrl.signal.aborted) ai.err = "Zatrzymane.";
    else if(e?.code==="not_granted"){ ai.err = "Czat nie ma zgody na pytania do Claude'a, więc go ukrywam."; chatOff(); }
    else if(e?.code==="bad_key") ai.err = "Klucz nie działa. Stuknij ikonę klucza u góry i wklej go jeszcze raz.";
    else if(e?.code==="offline") ai.err = "Brak internetu. Czat potrzebuje zasięgu, reszta aplikacji działa bez niego.";
    else if(e?.code==="rate_limited" && CHAT.via==="api" && API.prov==="gemini") ai.err = "Darmowy limit Gemini chwilowo się wyczerpał. Odczekaj minutę; jeśli to limit dzienny, odnowi się rano.";
    else if(e?.code==="rate_limited") ai.err = "Za dużo pytań w krótkim czasie. Odczekaj chwilę i zapytaj ponownie.";
    else ai.err = "Nie udało się dostać odpowiedzi. " + (e?.message ? "Szczegóły: "+e.message : "Spróbuj jeszcze raz.");
  }
  if(raf) cancelAnimationFrame(raf);
  ai.src = [...new Set([...CHAT.used].map(id => DOCS.find(d=>d.id===id)).filter(Boolean).flatMap(d => d.s||[]))].filter(k => SRC[k]).slice(0,6);
  setBusy(false); saveHist(); const e = el(); if(e) e.outerHTML = aiHTML(ai, idx);
}

function chatOff(){ $("ask-fab").classList.remove("on"); $("ask-band").classList.remove("on"); }
function chatOn(){ $("ask-fab").classList.add("on"); $("ask-band").classList.add("on"); }
(async () => {
  CHAT.via = (window.claude && typeof claude.use==="function") ? "claude" : "api";
  if(CHAT.via==="claude"){ try{ const s = await claude.use("sample"); if(s){ CHAT.sample = s; chatOn(); } }catch(e){} }
  else { if(apiKey()) CHAT.sample = makeSample(); chatOn(); }
  syncKeyUI();
})();
const posSync = () => { document.body.classList.toggle("tray-on", $("tray").classList.contains("on")); document.body.classList.toggle("mini-on", !$("sg-mini").hidden); };
try{ const mo = new MutationObserver(posSync); mo.observe($("tray"), {attributes:true, attributeFilter:["class"]}); mo.observe($("sg-mini"), {attributes:true, attributeFilter:["hidden"]}); }catch(e){}
posSync();
