/* ==========================================================================
   MANTIS, pętla gry (etap M3)
   M2 dało: owady, czujność, atak, jedzenie, pasek, osiem stadiów.
   M3 dokłada: prawdziwą wylinkę (wiszenie głową w dół, pękanie pancerza,
   wychodzenie większej modliszki), ekran zwycięstwa ze skrzydłami i
   gwiazdkami, wolne polowanie z ważką oraz ootekę jako epilog.
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('gra');
  const ctx = canvas.getContext('2d');

  const SZER = 540, WYS = 960;
  let dpr = 1;

  function dopasuj() {
    const w = window.innerWidth, h = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const s = Math.max((w * dpr) / SZER, (h * dpr) / WYS);
    stan.skalaEkranu = s;
    stan.marginX = (w * dpr - SZER * s) / 2;
    stan.marginY = (h * dpr - WYS * s) / 2;
    stan.szerEkranuCss = w; stan.wysEkranuCss = h;
  }

  /* --- stadia -----------------------------------------------------------
     Dla każdego stadium: ile owadów do wylinki, długość ciała w pikselach
     i zoom świata. Iloczyn długości i zoomu to rozmiar na ekranie, który
     rośnie, podczas gdy zoom maleje, więc świat kurczy się względem
     modliszki. To daje odczucie wzrostu mocniej niż samo powiększenie. */
  const STADIA = [
    { food: 3, dl: 90,  zoom: 1.040 },
    { food: 4, dl: 106, zoom: 0.960 },
    { food: 4, dl: 124, zoom: 0.880 },
    { food: 5, dl: 146, zoom: 0.800 },
    { food: 5, dl: 172, zoom: 0.720 },
    { food: 6, dl: 205, zoom: 0.640 },
    { food: 6, dl: 240, zoom: 0.576 },
    { food: 0, dl: 285, zoom: 0.512 }   // L8 dorosła, koniec wzrostu
  ];

  const SWIAT_SZER = 1600;
  const tloCanvas = document.createElement('canvas');
  tloCanvas.width = SWIAT_SZER; tloCanvas.height = WYS;
  const gruntY = WYS * 0.80;

  /* który świat dla którego gatunku */
  const SWIAT_GATUNKU = { zwyczajna: 'laka', duchowa: 'sciolka', storczykowa: 'zmierzch' };

  function przygotujTlo(swiatKey) {
    const c = tloCanvas.getContext('2d');
    let pal = null;
    for (let x = 0; x < SWIAT_SZER; x += SZER) {
      c.save(); c.translate(x, 0);
      c.beginPath(); c.rect(0, 0, SZER, WYS); c.clip();
      const info = Swiat.rysujSwiat(c, SZER, WYS, swiatKey);
      pal = info.paleta;
      c.restore();
    }
    /* ciągły pas gruntu w kolorze świata */
    const grunt = c.createLinearGradient(0, gruntY - 10, 0, WYS);
    grunt.addColorStop(0, pal.grunt[0]);
    grunt.addColorStop(0.25, pal.grunt[1]);
    grunt.addColorStop(1, pal.grunt[2]);
    c.fillStyle = grunt;
    c.fillRect(0, gruntY - 6, SWIAT_SZER, WYS - gruntY + 6);
    for (let x = 0; x < SWIAT_SZER; x += 26) {
      const dl = 24 + (x * 7 % 30);
      Swiat.zdzblo(c, x, gruntY + 6, dl, ((x % 3) - 1) * 10, 3, pal.gruntZdzblo);
    }
    stan.paleta = pal;
  }

  /* --- stan ------------------------------------------------------------ */
  const stan = {
    skalaEkranu: 1, marginX: 0, marginY: 0, szerEkranuCss: 360, wysEkranuCss: 640,
    faza: 'gra',                                 // 'gra' | 'wylinka'
    modliszka: {
      x: SWIAT_SZER * 0.5, kierunek: 1, predkosc: 0, krok: 0, intensywnosc: 0,
      stadiumIdx: 0, gatunek: 'zwyczajna',
      dlugosc: STADIA[0].dl, dlugoscCel: STADIA[0].dl,
      zoom: STADIA[0].zoom, zoomCel: STADIA[0].zoom,
      kolysanieFaza: 0, katGlowyWyg: 0,
      food: 0, atak: 0, je: 0,                    // atak 0..1, je = licznik jedzenia
      cel: null, owadCel: null
    },
    owady: [],
    kamera: SWIAT_SZER * 0.5,
    wylinka: 0,                                   // postęp animacji wylinki 0..1
    zwyc: 0, wolneCzas: 0, konfetti: [], ooteka: null,
    czas: 0, iskry: []
  };

  const MAX_PREDKOSC = 88, SKRADANIE = 24;

  function stadium() { return stan.modliszka.stadium; }   // 1-based numer

  Object.defineProperty(stan.modliszka, 'stadium', {
    get() { return this.stadiumIdx + 1; }
  });

  /* --- owady ----------------------------------------------------------- */
  function dostepneTypy() {
    const st = stan.modliszka.stadium;
    return Object.keys(Owad.TYPY).filter(k => {
      const t = Owad.TYPY[k];
      if (t.ruch === 'tlo') return true;                   // mrówka zawsze jako tło
      if (k === 'wazka') return stan.faza === 'wolne';      // ważka tylko po zwycięstwie
      return t.odStadium <= st && st < t.odStadium + 4;    // owady znikają, gdy modliszka za duża
    });
  }

  function nowyOwad(zaKadrem) {
    const typy = dostepneTypy().filter(k => Owad.TYPY[k].ruch !== 'tlo');
    /* zawsze trzymamy przynajmniej jeden łatwy owad na planszy */
    const latwe = typy.filter(k => Owad.TYPY[k].czujnosc === 0);
    const brakLatwego = !stan.owady.some(o => o.zyje && Owad.TYPY[o.typ].czujnosc === 0 && Owad.TYPY[o.typ].ruch !== 'tlo');
    const pula = (brakLatwego && latwe.length) ? latwe : typy;
    const typ = pula[(Math.random() * pula.length) | 0];
    if (!typ) return null;
    const t = Owad.TYPY[typ];
    const m = stan.modliszka;
    const strona = Math.random() < 0.5 ? -1 : 1;
    const x = zaKadrem
      ? stan.kamera + strona * (SZER / m.zoom / 2 + 60)
      : m.x + strona * (90 + Math.random() * 130);
    const lata = t.ruch.startsWith('lot') || t.ruch === 'lot-chwiej';
    const naZiemi = !lata;
    return {
      typ, x: Math.max(40, Math.min(SWIAT_SZER - 40, x)),
      bazaY: naZiemi ? gruntY : gruntY - (40 + Math.random() * 40),
      y: naZiemi ? gruntY : gruntY - 60,
      kierunek: -strona, vx: 0, faza: Math.random() * 6,
      naZiemi, zyje: true, sploszenia: 0, ucieka: false,
      siedziDo: 0, celY: 0
    };
  }

  function uzupelnijOwady(dt) {
    stan.owady = stan.owady.filter(o => o.zyje || o.znika > 0);
    const zywe = stan.owady.filter(o => o.zyje && Owad.TYPY[o.typ].ruch !== 'tlo').length;
    const ile = 4;
    if (zywe < ile && Math.random() < dt * 1.4) {
      const o = nowyOwad(true);
      if (o) stan.owady.push(o);
    }
    /* mrówka tła, jeśli żadnej nie ma */
    if (!stan.owady.some(o => o.typ === 'mrowka' && o.zyje) && Math.random() < dt * 0.25) {
      const m = stan.modliszka, strona = Math.random() < 0.5 ? -1 : 1;
      stan.owady.push({ typ: 'mrowka', x: stan.kamera + strona * (SZER / m.zoom / 2 + 50),
        bazaY: gruntY, y: gruntY, kierunek: -strona, vx: 0, faza: 0, naZiemi: true,
        zyje: true, sploszenia: 0, ucieka: false, siedziDo: 0, celY: 0 });
    }
  }

  function ruchOwada(o, dt) {
    const t = Owad.TYPY[o.typ];
    o.faza += dt;
    if (o.ucieka) {
      o.x += o.vx * dt;
      o.y += (o.bazaY - 120 - o.y) * Math.min(1, dt * 2);
      o.znika = (o.znika || 1) - dt * 0.5;
      if (o.znika <= 0) o.zyje = false;
      return;
    }
    switch (t.ruch) {
      case 'pelza':
        o.x += Math.sin(o.faza * 0.6) * 6 * dt; break;
      case 'tlo':
        o.x += o.kierunek * 34 * dt;
        if (o.x < 30 || o.x > SWIAT_SZER - 30) o.kierunek *= -1;
        break;
      case 'skok':
        if (stan.czas > o.siedziDo) {
          o.vx = o.kierunek * (70 + Math.random() * 40);
          o.siedziDo = stan.czas + 0.8 + Math.random() * 1.5;
          o.skokDo = stan.czas + 0.35;
        }
        if (stan.czas < o.skokDo) { o.x += o.vx * dt; o.y = o.bazaY - Math.sin((o.skokDo - stan.czas) / 0.35 * Math.PI) * 40; }
        else o.y = o.bazaY;
        break;
      case 'lot-zryw':
        if (stan.czas > o.siedziDo) {
          o.vx = (Math.random() - 0.5) * 90; o.celY = o.bazaY + (Math.random() - 0.5) * 50;
          o.siedziDo = stan.czas + 0.4 + Math.random() * 0.9;
        }
        o.x += o.vx * dt; o.y += (o.celY - o.y) * Math.min(1, dt * 3); break;
      case 'lot-luk':
        o.x += Math.cos(o.faza * 1.5) * 55 * dt * o.kierunek;
        o.y = o.bazaY + Math.sin(o.faza * 3) * 18; break;
      case 'lot-chwiej':
        o.x += Math.sin(o.faza * 0.8) * 30 * dt;
        o.y = o.bazaY + Math.sin(o.faza * 1.7) * 22; break;
      case 'lot-szybki':
        o.x += Math.cos(o.faza * 2.2) * 110 * dt * o.kierunek;
        o.y = o.bazaY + Math.sin(o.faza * 4) * 26; break;
    }
    if (o.kierunek === undefined) o.kierunek = o.vx >= 0 ? 1 : -1;
    else if (Math.abs(o.vx) > 1) o.kierunek = o.vx > 0 ? 1 : -1;
    o.x = Math.max(30, Math.min(SWIAT_SZER - 30, o.x));
  }

  function sploszenie(o) {
    const m = stan.modliszka;
    o.ucieka = true; o.sploszenia++;
    o.vx = (o.x >= m.x ? 1 : -1) * (140 + Math.random() * 60);
    o.kierunek = o.vx > 0 ? 1 : -1;
    o.znika = 1.4;
  }

  /* --- wejście --------------------------------------------------------- */
  function ekranNaSwiat(clientX, clientY) {
    const m = stan.modliszka;
    const px = clientX * dpr, py = clientY * dpr;
    const logX = (px - stan.marginX) / stan.skalaEkranu;
    const logY = (py - stan.marginY) / stan.skalaEkranu;
    const wx = stan.kamera + (logX - SZER / 2) / m.zoom;
    const wy = gruntY + (logY - gruntY) / m.zoom;
    return { x: wx, y: wy };
  }

  let wcisniete = false;
  function celuj(clientX, clientY) {
    /* po zwycięstwie (gdy skrzydła już rozłożone) dotknięcie przechodzi
       do wolnego polowania */
    if (stan.faza === 'zwyciestwo') { if (stan.zwyc > 2.5) wejdzWolne(); return; }
    if (stan.faza !== 'gra' && stan.faza !== 'wolne') return;
    const p = ekranNaSwiat(clientX, clientY);
    const m = stan.modliszka;
    /* szukamy owada blisko punktu dotyku, z dużym marginesem wybaczania */
    let naj = null, najD = 170;
    stan.owady.forEach(o => {
      if (!o.zyje || o.ucieka || Owad.TYPY[o.typ].ruch === 'tlo') return;
      const d = Math.hypot(o.x - p.x, o.y - p.y);
      if (d < najD) { najD = d; naj = o; }
    });
    if (naj) { m.owadCel = naj; m.cel = naj.x; }
    else { m.owadCel = null; m.cel = p.x; }
  }
  function start(x, y) { wcisniete = true; if (globalThis.Dzwiek) globalThis.Dzwiek.odblokuj(); celuj(x, y); }
  function ruch(x, y) { if (wcisniete) celuj(x, y); }
  function koniec() { wcisniete = false; }

  canvas.addEventListener('touchstart', e => { e.preventDefault(); start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); ruch(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  canvas.addEventListener('touchend', e => { e.preventDefault(); koniec(); }, { passive: false });
  canvas.addEventListener('mousedown', e => start(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => ruch(e.clientX, e.clientY));
  window.addEventListener('mouseup', koniec);

  /* --- łapanie i jedzenie --------------------------------------------- */
  function glowaX(m) { return m.x + m.kierunek * m.dlugosc * 0.42; }

  function sprobujAtak() {
    const m = stan.modliszka;
    if (!m.owadCel || !m.owadCel.zyje || m.owadCel.ucieka) { m.owadCel = null; return; }
    const o = m.owadCel;
    const dx = o.x - glowaX(m), dy = o.y - (gruntY - m.dlugosc * 0.35);
    const zasieg = m.dlugosc * 0.55;
    if (Math.abs(dx) < zasieg && dy > -zasieg && dy < m.dlugosc * 0.4 && m.atak === 0 && m.je === 0) {
      m.atak = 0.001;                 // zaczyna uderzenie
      m.kierunek = o.x >= m.x ? 1 : -1;
    }
  }

  function iskra(x, y) {
    for (let i = 0; i < 10; i++) {
      stan.iskry.push({ x, y, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 60, zyc: 0.6 });
    }
  }

  /* --- aktualizacja ---------------------------------------------------- */
  function aktualizuj(dt) {
    stan.czas += dt;
    const m = stan.modliszka;

    /* iskry energii */
    stan.iskry = stan.iskry.filter(s => (s.zyc -= dt) > 0);
    stan.iskry.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt; });
    aktualizujCzasteczki(dt);

    if (stan.faza === 'menu') return;             // ekran domowy, gra stoi
    if (stan.faza === 'wylinka') { aktualizujWylinke(dt); return; }
    if (stan.faza === 'zwyciestwo') { aktualizujZwyciestwo(dt); return; }

    uzupelnijOwady(dt);
    stan.owady.forEach(o => {
      if (!o.zyje && !(o.znika > 0)) return;
      ruchOwada(o, dt);
      const t = Owad.TYPY[o.typ];
      const lata = t.ruch.indexOf('lot') === 0;
      /* czujność: szybki ruch modliszki w promieniu płoszy owada.
         Modliszka duchowa maskuje się (kamuflaż): może iść szybciej bez
         spłoszenia, bo wygląda jak zeschły liść. */
      if (t.czujnosc > 0 && o.zyje && !o.ucieka && o !== m.owadCel) {
        const d = Math.abs(o.x - glowaX(m));
        const prog = (m.gatunek === 'duchowa') ? SKRADANIE * 2 + 6 : SKRADANIE + 6;
        /* im wyższe stadium, tym owady czujniejsze: promień rośnie z L */
        const stMnoznik = 1 + (m.stadium - 1) * 0.12;    // L1 x1.0 ... L8 x1.84
        if (m.predkosc > prog && d < t.czujnosc * 130 * stMnoznik) sploszenie(o);
      }
      /* wabienie: modliszka storczykowa stojąc nieruchomo przyciąga
         latające owady, bo wygląda i wabi jak kwiat. */
      if (m.gatunek === 'storczykowa' && lata && o.zyje && !o.ucieka && m.predkosc < 12) {
        const dx = glowaX(m) - o.x;
        if (Math.abs(dx) < 320) o.x += Math.sign(dx) * 30 * dt;
      }
    });

    /* ruch modliszki */
    let docelowa = 0;
    if (m.atak === 0 && m.je === 0 && m.cel !== null) {
      const cx = m.owadCel && m.owadCel.zyje ? m.owadCel.x : m.cel;
      const roznica = cx - m.x, odl = Math.abs(roznica);
      if (odl > 4) {
        m.kierunek = roznica > 0 ? 1 : -1;
        docelowa = Math.min(1, odl / 90) * MAX_PREDKOSC;
        /* skradanie: przy podchodzeniu do celu zwalniamy, by nie płoszyć */
        if (m.owadCel && m.owadCel.zyje) {
          const t = Owad.TYPY[m.owadCel.typ];
          if (t.czujnosc > 0 && odl < t.czujnosc * 150 + 40) docelowa = Math.min(docelowa, SKRADANIE);
        }
      } else if (!m.owadCel) { m.cel = null; }
    }
    m.predkosc += (docelowa - m.predkosc) * Math.min(1, dt * 2.6);
    if (m.atak > 0 || m.je > 0) m.predkosc *= (1 - Math.min(1, dt * 10));
    m.x += m.kierunek * m.predkosc * dt;
    m.x = Math.max(60, Math.min(SWIAT_SZER - 60, m.x));
    const krokPrzed = m.krok;
    m.krok += (m.predkosc * dt) / 34;
    m.intensywnosc = Math.min(1, m.predkosc / 42);
    m.kolysanieFaza += dt * (1.1 + m.predkosc * 0.01);
    /* stąpnięcie przy każdym półkroku, jeśli modliszka rzeczywiście idzie */
    if (m.intensywnosc > 0.25 && Math.floor(krokPrzed * 2) !== Math.floor(m.krok * 2)) dzwiek('krok');

    /* atak */
    if (m.atak > 0) {
      m.atak += dt * 6;
      if (m.atak >= 0.5 && m.owadCel && m.owadCel.zyje && !m.owadCel.zlapany) {
        /* w połowie ruchu chwytamy owada */
        const o = m.owadCel;
        const dx = o.x - glowaX(m);
        if (Math.abs(dx) < m.dlugosc * 0.7) { o.zlapany = true; }
      }
      if (m.atak >= 1) {
        m.atak = 0;
        const o = m.owadCel;
        if (o && o.zlapany) { o.zyje = false; zjedz(o); }
        m.owadCel = null; m.cel = null;
      }
    }

    /* jedzenie (krótka animacja po złapaniu) */
    if (m.je > 0) { m.je -= dt; if (m.je < 0) m.je = 0; }

    /* płynne dorastanie rozmiaru i zoomu podczas wylinki, tu tylko domykanie */
    m.dlugosc += (m.dlugoscCel - m.dlugosc) * Math.min(1, dt * 5);
    m.zoom += (m.zoomCel - m.zoom) * Math.min(1, dt * 5);

    /* automatyczny atak, gdy cel w zasięgu */
    if (m.owadCel) sprobujAtak();

    /* wolne polowanie: ważka i ooteka */
    if (stan.faza === 'wolne') {
      stan.wolneCzas += dt;
      if (!stan.owady.some(o => o.typ === 'wazka' && o.zyje) && Math.random() < dt * 0.25) {
        const o = nowyOwad(true); if (o) { o.typ = 'wazka'; o.naZiemi = false; o.bazaY = gruntY - 90; }
      }
      if (stan.wolneCzas > 22 && !stan.ooteka) rozpocznijOoteke();
    }

    /* kamera z uwzględnieniem zoomu: modliszka blisko środka */
    const widoczne = SZER / m.zoom;
    const celKamery = Math.max(widoczne / 2, Math.min(SWIAT_SZER - widoczne / 2, m.x));
    stan.kamera += (celKamery - stan.kamera) * Math.min(1, dt * 7);

    if (stan.ooteka) aktualizujOoteke(dt);
  }

  /* --- ooteka: epilog, dorosła samica składa kokon, wychodzą maleństwa - */
  function rozpocznijOoteke() {
    const m = stan.modliszka;
    stan.ooteka = { x: m.x + m.kierunek * 40, y: gruntY - m.dlugosc * 0.9, t: 0, male: [] };
    m.cel = null; m.owadCel = null;
  }
  function aktualizujOoteke(dt) {
    const o = stan.ooteka; o.t += dt;
    if (o.t > 6 && o.male.length === 0) {
      for (let i = 0; i < 12; i++) {
        o.male.push({ x: o.x, y: o.y + 20, vx: (Math.random() - 0.5) * 90, faza: Math.random() * 6, zyc: 0 });
      }
    }
    o.male.forEach(mm => { mm.zyc += dt; mm.x += mm.vx * dt; mm.faza += dt; });
  }

  function zjedz(o) {
    const m = stan.modliszka;
    m.je = 1.1;
    iskra(glowaX(m), gruntY - m.dlugosc * 0.4);
    const t = Owad.TYPY[o.typ];
    m.food += t.pozywienie;
    if (dzwiek) dzwiek('jedz');
    const potrzeba = STADIA[m.stadiumIdx].food;
    if (potrzeba > 0 && m.food >= potrzeba) rozpocznijWylinke();
  }

  /* --- wylinka (M3, prawdziwa) -----------------------------------------
     Prawdziwa modliszka linieje wisząc głową w dół: grawitacja pomaga wyjść
     ze starej skóry. Sekwencja: wspina się na gałązkę, zawisa, pancerz pęka,
     nowa modliszka wysuwa się w dół, blada i miękka, stara skóra zostaje
     wisząca. Ostatnia wylinka daje skrzydła i prowadzi do zwycięstwa. */
  const WYL = { czas: 5.5 };
  function rozpocznijWylinke() {
    const m = stan.modliszka;
    stan.faza = 'wylinka'; stan.wylinka = 0; m.wyrosla = false;
    m.predkosc = 0; m.cel = null; m.owadCel = null;
    m.finalowa = (m.stadiumIdx >= STADIA.length - 2);   // wylinka do L8
    /* punkt zawieszenia nad modliszką (gałązka) */
    m.pinX = m.x; m.pinY = gruntY - m.dlugosc * 1.55;
    if (dzwiek) dzwiek('wylinka');
  }

  function aktualizujWylinke(dt) {
    const m = stan.modliszka;
    stan.wylinka += dt / WYL.czas;
    const w = stan.wylinka;
    /* zmiana stadium następuje, gdy nowa modliszka zaczyna wychodzić */
    if (w >= 0.45 && !m.wyrosla) {
      m.wyrosla = true;
      if (m.stadiumIdx < STADIA.length - 1) m.stadiumIdx++;
      m.food = 0;
      const st = STADIA[m.stadiumIdx];
      m.dlugoscCel = st.dl; m.zoomCel = st.zoom;
      if (dzwiek) dzwiek('wzrost');
    }
    /* kamera i zoom dojeżdżają dopiero pod koniec, przy odsłonięciu */
    if (w > 0.8) {
      m.zoom += (m.zoomCel - m.zoom) * Math.min(1, dt * 3);
    }
    const widoczne = SZER / m.zoom;
    const celKamery = Math.max(widoczne / 2, Math.min(SWIAT_SZER - widoczne / 2, m.pinX));
    stan.kamera += (celKamery - stan.kamera) * Math.min(1, dt * 3);
    if (w >= 1) {
      stan.wylinka = 1;
      if (m.finalowa) {
        stan.faza = 'zwyciestwo'; stan.zwyc = 0;
        if (onUkonczono) onUkonczono(m.gatunek);   // zapis i odblokowanie następnej
      } else { stan.faza = 'gra'; m.dlugosc = m.dlugoscCel; m.zoom = m.zoomCel; }
    }
  }

  /* Rysunek jednej modliszki z dowolnym obrotem, skalą i przezroczystością.
     Pozwala pokazać starą skórę (wisząca, przezroczysta) i nową (wychodzącą). */
  function rysujModliszke(px, py, dlugosc, stadium, obrot, alpha, poza, biel) {
    const m = stan.modliszka;
    ctx.save();
    ctx.translate(px, py); ctx.rotate(obrot || 0);
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    if (biel > 0.01) {                            // świeżo po wylince blada i jasna: miękka poświata
      const gl = ctx.createRadialGradient(0, -dlugosc * 0.4, 0, 0, -dlugosc * 0.4, dlugosc * 0.9);
      gl.addColorStop(0, 'rgba(255,255,255,' + (biel * 0.5) + ')');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, -dlugosc * 0.4, dlugosc * 0.9, 0, 7); ctx.fill();
    }
    Modliszka.rysuj(ctx, { x: 0, y: 0, dlugosc, stadium, gatunek: m.gatunek, kierunek: m.kierunek, poza });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function rysujWylinke() {
    const m = stan.modliszka;
    const w = stan.wylinka;
    const staraDl = STADIA[Math.max(0, m.stadiumIdx - (m.wyrosla ? 1 : 0))].dl;

    /* gałązka, na której wisi */
    ctx.strokeStyle = '#7d6a3f'; ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(m.pinX - 120, m.pinY - 14);
    ctx.quadraticCurveTo(m.pinX, m.pinY - 4, m.pinX + 120, m.pinY - 16);
    ctx.stroke();

    const kol = Math.sin(stan.czas * 2) * 0.03;

    if (w < 0.15) {
      /* wspinaczka i zawiśnięcie: modliszka unosi się do gałązki */
      const t = w / 0.15;
      const y = mieszaj(gruntY, m.pinY, t);
      const obrot = mieszaj(0, Math.PI, t);
      rysujModliszke(m.pinX, y, staraDl, m.stadium, obrot, 1,
        { kolysanie: kol, rozlozoneOdnoza: 0.2 }, 0);
      return;
    }

    /* stara skóra wisi cały czas; po pęknięciu blednie do husk */
    const skoraAlpha = w < 0.45 ? 1 : mieszaj(1, 0.4, Math.min(1, (w - 0.45) / 0.4));
    rysujModliszke(m.pinX, m.pinY, staraDl, m.stadium, Math.PI, skoraAlpha,
      { kolysanie: kol, rozlozoneOdnoza: 0.15, pekniecie: w > 0.3 ? Math.min(1, (w - 0.3) / 0.2) : 0 }, 0);

    if (w >= 0.42) {
      /* nowa modliszka wychodzi: z początku zwisa tuż pod skórą, potem
         prostuje się i schodzi na gałązkę, na końcu staje normalnie */
      const e = Math.min(1, (w - 0.42) / 0.46);          // wyłanianie 0..1
      const nowaDl = mieszaj(staraDl * 0.85, m.dlugoscCel, e);
      const biel = 1 - Math.min(1, (w - 0.55) / 0.3);    // blednie przez pierwsze chwile
      if (w < 0.86) {
        /* wisi głową w dół, wysuwa się coraz niżej */
        const zsun = mieszaj(nowaDl * 0.25, nowaDl * 0.7, e);
        rysujModliszke(m.pinX, m.pinY + zsun, nowaDl, m.stadium, Math.PI, Math.min(1, e * 1.6),
          { kolysanie: kol * 2, rozlozoneOdnoza: mieszaj(-0.1, 0.25, e) }, biel);
      } else {
        /* prostuje się i schodzi na ziemię */
        const s = (w - 0.86) / 0.14;
        const obrot = mieszaj(Math.PI, 0, s);
        const y = mieszaj(m.pinY + nowaDl * 0.7, gruntY, s);
        m.dlugosc = nowaDl;
        rysujModliszke(m.pinX, y, nowaDl, m.stadium, obrot, 1,
          { kolysanie: kol, rozlozoneOdnoza: 0.2, katGlowy: 0,
            skrzydlaRozlozone: false }, biel * 0.5);
      }
    }

    /* iskry i pyłek podczas wychodzenia */
    if (w > 0.5 && Math.random() < 0.4) iskra(m.pinX + (Math.random() - 0.5) * 80, m.pinY + Math.random() * 100);
  }

  const mieszaj = (a, b, t) => a + (b - a) * t;

  /* --- zwycięstwo, wolne polowanie, ooteka ----------------------------- */
  function aktualizujZwyciestwo(dt) {
    stan.zwyc = (stan.zwyc || 0) + dt;
    /* skrzydła rozprostowują się przez pierwsze dwie sekundy, potem
       konfetti; po chwili dotknięcie ekranu przechodzi do wolnego polowania */
    if (stan.zwyc < 3 && Math.random() < dt * 8) {
      stan.konfetti.push(nowyKawalek());
    }
    stan.kamera += ((SZER / stan.modliszka.zoom / 2 > stan.modliszka.x
      ? SZER / stan.modliszka.zoom / 2 : stan.modliszka.x) - stan.kamera) * Math.min(1, dt * 3);
    aktualizujKonfetti(dt);
  }

  let konfettiInit = false;
  function nowyKawalek() {
    const W = stan.szerEkranuCss, kolory = ['#ffd23f', '#f2789f', '#7ec4ff', '#9be870', '#c79bff'];
    return { x: Math.random() * W, y: -20, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 120,
      obrot: Math.random() * 6, vobrot: (Math.random() - 0.5) * 8,
      kolor: kolory[(Math.random() * kolory.length) | 0], r: 5 + Math.random() * 6 };
  }
  function aktualizujKonfetti(dt) {
    stan.konfetti.forEach(k => { k.x += k.vx * dt; k.y += k.vy * dt; k.obrot += k.vobrot * dt; });
    stan.konfetti = stan.konfetti.filter(k => k.y < stan.wysEkranuCss + 30);
  }
  function rysujKonfetti() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stan.konfetti.forEach(k => {
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.obrot);
      ctx.fillStyle = k.kolor;
      ctx.fillRect(-k.r / 2, -k.r / 2, k.r, k.r * 0.6);
      ctx.restore();
    });
  }

  /* wolne polowanie po zwycięstwie: dorosła modliszka zostaje na planszy,
     bez paska, pojawia się ważka; po chwili modliszka składa ootekę */
  function wejdzWolne() {
    stan.faza = 'wolne'; stan.wolneCzas = 0; stan.owady = [];
    for (let i = 0; i < 3; i++) { const o = nowyOwad(false); if (o) stan.owady.push(o); }
  }

  /* --- rysowanie ------------------------------------------------------- */
  function ustawSwiat() {
    const m = stan.modliszka;
    const sx = stan.skalaEkranu * m.zoom;
    const tx = stan.marginX + stan.skalaEkranu * (SZER / 2 - m.zoom * stan.kamera);
    const ty = stan.marginY + stan.skalaEkranu * gruntY * (1 - m.zoom);
    ctx.setTransform(sx, 0, 0, sx, tx, ty);
  }

  function rysuj() {
    const m = stan.modliszka;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    /* tło zapasowe w kolorach bieżącego świata, żeby przy zoomie nie było
       gołych rogów ani obcego koloru u dołu */
    const pal = stan.paleta || Swiat.SWIATY.laka;
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, pal.niebo[1]); g.addColorStop(0.6, pal.niebo[2]); g.addColorStop(1, pal.grunt[2].replace(/0\.\d+\)$/, '1)'));
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ustawSwiat();
    ctx.drawImage(tloCanvas, 0, 0);
    rysujCzasteczki();

    /* owady za modliszką (tło) i przed nią rozdzielamy po wysokości */
    stan.owady.forEach(o => {
      if (!o.zyje && !(o.znika > 0)) return;
      if (o.zlapany) return;                       // złapany owad znika w chwycie
      Owad.rysuj(ctx, {
        x: o.x, y: o.y, typ: o.typ, faza: o.faza, kierunek: o.kierunek,
        naZiemi: o.naZiemi, rozmiar: 66
      });
    });

    /* modliszka */
    if (stan.faza === 'wylinka') {
      rysujWylinke();
    } else {
      const kol = Math.sin(m.kolysanieFaza) * (0.05 + 0.05 * (1 - m.intensywnosc));
      /* głowa śledzi cel albo najbliższego owada */
      let katG = kol * 0.5;
      const patrzOwad = m.owadCel && m.owadCel.zyje ? m.owadCel : najblizszyOwad();
      if (patrzOwad) {
        const dx = (patrzOwad.x - glowaX(m)) * m.kierunek;
        katG = Math.max(-0.5, Math.min(0.5, (patrzOwad.y - (gruntY - m.dlugosc * 0.4)) / 120)) + (dx < 0 ? 0.2 : 0);
      }
      m.katGlowyWyg += (katG - m.katGlowyWyg) * Math.min(1, 0.15);

      /* poświata pod modliszką, żeby zawsze odcinała się od tła.
         W jasnym świecie ciemna, w ciemnych światach jasna. */
      const halo = { laka: 'rgba(30,55,18,', sciolka: 'rgba(255,238,200,', zmierzch: 'rgba(255,240,255,' }[stan.swiatKey] || 'rgba(30,55,18,';
      const hx = m.x, hy = gruntY - m.dlugosc * 0.32, hr = m.dlugosc * 0.85;
      const hg = ctx.createRadialGradient(hx, hy, hr * 0.2, hx, hy, hr);
      hg.addColorStop(0, halo + '0.34)');
      hg.addColorStop(1, halo + '0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.ellipse(hx, hy, hr, hr * 0.9, 0, 0, 7); ctx.fill();

      const dorosla = m.stadium >= STADIA.length;
      const skrzydlaRoz = dorosla && (stan.faza === 'zwyciestwo' || stan.faza === 'wolne');
      Modliszka.rysuj(ctx, {
        x: m.x, y: gruntY, dlugosc: m.dlugosc,
        stadium: m.stadium, gatunek: m.gatunek, kierunek: m.kierunek,
        poza: {
          krok: m.krok, intensywnosc: m.intensywnosc,
          kolysanie: kol, katGlowy: m.katGlowyWyg,
          rozlozoneOdnoza: 0.15, atak: Math.sin(Math.min(1, m.atak) * Math.PI),
          skrzydlaRozlozone: skrzydlaRoz
        }
      });
    }

    /* ooteka i maleństwa (świat) */
    if (stan.ooteka) rysujOoteke();

    /* iskry energii (świat) */
    stan.iskry.forEach(s => {
      ctx.globalAlpha = Math.max(0, s.zyc / 0.6);
      ctx.fillStyle = '#fff2a0';
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    /* konfetti (ekran) na zwycięstwie i w wolnym polowaniu */
    if (stan.faza === 'zwyciestwo' || stan.faza === 'wolne') rysujKonfetti();

    rysujHUD();
  }

  function rysujOoteke() {
    const o = stan.ooteka;
    /* kokon z pianki na gałązce */
    ctx.fillStyle = '#e6d3a0'; ctx.strokeStyle = '#b79a63'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(o.x, o.y, 22, 13, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,120,70,0.5)'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(o.x + i * 7, o.y - 11); ctx.lineTo(o.x + i * 7, o.y + 11); ctx.stroke();
    }
    /* maleństwa L1 */
    o.male.forEach(mm => {
      ctx.globalAlpha = Math.min(1, mm.zyc * 2);
      Modliszka.rysuj(ctx, { x: mm.x, y: gruntY, dlugosc: 26, stadium: 1,
        gatunek: stan.modliszka.gatunek, kierunek: mm.vx >= 0 ? 1 : -1,
        poza: { krok: mm.faza, intensywnosc: 1, kolysanie: 0, rozlozoneOdnoza: 0.2 } });
    });
    ctx.globalAlpha = 1;
  }

  function najblizszyOwad() {
    const m = stan.modliszka; let naj = null, d = 400;
    stan.owady.forEach(o => {
      if (!o.zyje || o.ucieka || Owad.TYPY[o.typ].ruch === 'tlo') return;
      const dd = Math.abs(o.x - m.x);
      if (dd < d) { d = dd; naj = o; }
    });
    return naj;
  }

  /* --- HUD (rysowany w pikselach ekranu) ------------------------------ */
  function rysujHUD() {
    const m = stan.modliszka;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = stan.szerEkranuCss;
    const potrzeba = STADIA[m.stadiumIdx].food;
    const graWtoku = stan.faza === 'gra';

    /* pasek segmentowy na górze */
    if (potrzeba > 0 && graWtoku) {
      const seg = potrzeba, sz = 26, odstep = 6;
      const calk = seg * sz + (seg - 1) * odstep;
      const x0 = (W - calk) / 2, y0 = 54;
      for (let i = 0; i < seg; i++) {
        const x = x0 + i * (sz + odstep);
        ctx.fillStyle = i < m.food ? '#ffd23f' : 'rgba(255,255,255,0.35)';
        ctx.strokeStyle = 'rgba(60,80,30,0.5)'; ctx.lineWidth = 2;
        okragly(ctx, x, y0, sz, 16, 7);
        ctx.fill(); ctx.stroke();
        if (i < m.food) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; okragly(ctx, x + 4, y0 + 3, sz - 8, 5, 3); ctx.fill(); }
      }
    }
    /* numer stadium po prawej */
    if (graWtoku) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeStyle = 'rgba(60,80,30,0.6)'; ctx.lineWidth = 2;
      okragly(ctx, W - 62, 46, 46, 32, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3d5c1e'; ctx.font = '700 22px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('L' + m.stadium, W - 39, 63);
    }

    /* duża cyfra stadium podczas wylinki */
    if (stan.faza === 'wylinka' && stan.wylinka > 0.5) {
      const a = Math.min(1, (stan.wylinka - 0.5) * 4) * Math.min(1, (1 - stan.wylinka) * 4 + 0.3);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#6e9a33'; ctx.lineWidth = 6;
      ctx.font = '800 120px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText('L' + m.stadium, W / 2, stan.wysEkranuCss * 0.42);
      ctx.fillText('L' + m.stadium, W / 2, stan.wysEkranuCss * 0.42);
      ctx.globalAlpha = 1;
    }

    if (stan.faza === 'zwyciestwo') {
      const a = Math.min(1, stan.zwyc / 1.5);
      /* rozświetlenie */
      ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#fffbe0'; ctx.fillRect(0, 0, W, stan.wysEkranuCss);
      ctx.globalAlpha = 1;
      /* osiem gwiazdek, po jednej za stadium */
      const gy = stan.wysEkranuCss * 0.26;
      for (let i = 0; i < 8; i++) {
        const gx = W / 2 + (i - 3.5) * 34;
        const wejscie = Math.max(0, Math.min(1, stan.zwyc * 3 - i * 0.2));
        gwiazdka(ctx, gx, gy, 13 * wejscie, '#ffd23f');
      }
      /* BRAWO */
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const skala = 1 + Math.sin(stan.zwyc * 3) * 0.03 * Math.max(0, 1 - stan.zwyc / 3);
      ctx.save(); ctx.translate(W / 2, stan.wysEkranuCss * 0.34); ctx.scale(skala, skala);
      ctx.lineWidth = 8; ctx.strokeStyle = '#6e9a33'; ctx.fillStyle = '#fff';
      ctx.font = '800 64px system-ui, sans-serif';
      ctx.globalAlpha = a; ctx.strokeText('BRAWO!', 0, 0); ctx.fillText('BRAWO!', 0, 0);
      ctx.globalAlpha = 1; ctx.restore();
      /* podpowiedź po chwili */
      if (stan.zwyc > 2.5) {
        ctx.fillStyle = 'rgba(40,60,20,' + (0.5 + Math.sin(stan.czas * 3) * 0.3) + ')';
        ctx.font = '600 18px system-ui, sans-serif';
        ctx.fillText('dotknij, aby polować dalej', W / 2, stan.wysEkranuCss * 0.7);
      }
    }

    if (stan.faza === 'wolne' && stan.ooteka && stan.ooteka.male.length > 0) {
      ctx.fillStyle = 'rgba(40,60,20,0.7)'; ctx.textAlign = 'center';
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText('Wykluły się małe modliszki', W / 2, stan.wysEkranuCss * 0.14);
    }
  }

  function gwiazdka(c, x, y, r, kolor) {
    if (r < 0.5) return;
    c.save(); c.translate(x, y); c.fillStyle = kolor;
    c.strokeStyle = 'rgba(150,110,20,0.6)'; c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r, a = i / 10 * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath(); c.fill(); c.stroke(); c.restore();
  }

  function okragly(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* --- dźwięk ---------------------------------------------------------- */
  stan.dzwiekWl = true;
  function dzwiek(co) {
    if (stan.dzwiekWl && globalThis.Dzwiek && globalThis.Dzwiek[co]) globalThis.Dzwiek[co]();
  }

  /* --- pętla ---------------------------------------------------------- */
  let ostatni = 0;
  function klatka(teraz) {
    if (!ostatni) ostatni = teraz;
    let dt = (teraz - ostatni) / 1000;
    ostatni = teraz;
    if (dt > 0.05) dt = 0.05;
    aktualizuj(dt);
    rysuj();
    requestAnimationFrame(klatka);
  }

  document.addEventListener('visibilitychange', () => { ostatni = 0; });
  window.addEventListener('resize', dopasuj);

  window.MantisTest = {
    stadium: (s) => { const m = stan.modliszka; m.stadiumIdx = s - 1; m.food = 0;
      m.dlugoscCel = STADIA[m.stadiumIdx].dl; m.zoomCel = STADIA[m.stadiumIdx].zoom;
      m.dlugosc = m.dlugoscCel; m.zoom = m.zoomCel; stan.faza = 'gra'; zasiej(); },
    gatunek: (g) => { stan.modliszka.gatunek = g; },
    wylinka: () => rozpocznijWylinke(),
    zwyciestwo: () => { const m = stan.modliszka; m.stadiumIdx = STADIA.length - 1;
      m.dlugosc = m.dlugoscCel = STADIA[m.stadiumIdx].dl; m.zoom = m.zoomCel = STADIA[m.stadiumIdx].zoom;
      stan.faza = 'zwyciestwo'; stan.zwyc = 0; },
    postep: () => stan.wylinka,
    stan: stan
  };

  function zasiej() {
    stan.owady = [];
    for (let i = 0; i < 3; i++) { const o = nowyOwad(false); if (o) stan.owady.push(o); }
    /* jedna mrówka tła */
    const m = stan.modliszka;
    stan.owady.push({ typ: 'mrowka', x: m.x + 160, bazaY: gruntY, y: gruntY,
      kierunek: -1, vx: 0, faza: 0, naZiemi: true, zyje: true, sploszenia: 0, ucieka: false, siedziDo: 0, celY: 0 });
  }

  /* --- publiczne API dla menu (M4) ------------------------------------- */
  let onUkonczono = null;
  function startGry(gatunek) {
    const m = stan.modliszka;
    m.gatunek = gatunek || 'zwyczajna';
    m.stadiumIdx = 0; m.food = 0; m.predkosc = 0; m.krok = 0; m.atak = 0; m.je = 0;
    m.cel = null; m.owadCel = null; m.finalowa = false; m.wyrosla = false;
    m.dlugosc = m.dlugoscCel = STADIA[0].dl;
    m.zoom = m.zoomCel = STADIA[0].zoom;
    m.x = SWIAT_SZER * 0.5; stan.kamera = m.x;
    stan.wylinka = 0; stan.zwyc = 0; stan.wolneCzas = 0; stan.konfetti = []; stan.ooteka = null;
    stan.iskry = [];
    stan.faza = 'gra';
    stan.swiatKey = SWIAT_GATUNKU[m.gatunek] || 'laka';
    przygotujTlo(stan.swiatKey);      // tło pod dany gatunek
    zasiejCzasteczki();
    zasiej();
  }

  /* --- cząsteczki w powietrzu, zależne od świata ----------------------- */
  function zasiejCzasteczki() {
    stan.czasteczki = [];
    const typ = stan.paleta ? stan.paleta.czasteczki : 'pylki';
    const ile = typ === 'liscie' ? 14 : 26;
    for (let i = 0; i < ile; i++) stan.czasteczki.push(nowaCzasteczka(typ, true));
  }
  function nowaCzasteczka(typ, gdziekolwiek) {
    const x = stan.kamera + (Math.random() - 0.5) * SZER * 1.6;
    return { typ, x, y: gdziekolwiek ? Math.random() * WYS : -20,
      faza: Math.random() * 6, vx: (Math.random() - 0.5) * 12,
      vy: typ === 'liscie' ? 18 + Math.random() * 20 : (typ === 'swietliki' ? (Math.random() - 0.5) * 8 : -6 - Math.random() * 8),
      r: typ === 'liscie' ? 6 + Math.random() * 5 : 1.5 + Math.random() * 2.5 };
  }
  function aktualizujCzasteczki(dt) {
    if (!stan.czasteczki) return;
    stan.czasteczki.forEach(c => {
      c.faza += dt;
      c.x += (c.vx + Math.sin(c.faza * 1.3) * 10) * dt;
      c.y += c.vy * dt;
      if (c.typ === 'swietliki') c.y += Math.sin(c.faza * 0.8) * 6 * dt;
      /* zawijanie w pionie */
      if (c.typ === 'liscie' && c.y > WYS + 20) { Object.assign(c, nowaCzasteczka('liscie', false)); }
      if (c.typ === 'pylki' && c.y < -20) { Object.assign(c, nowaCzasteczka('pylki', false)); c.y = WYS + 20; }
    });
  }
  function rysujCzasteczki() {
    if (!stan.czasteczki) return;
    stan.czasteczki.forEach(c => {
      if (c.typ === 'liscie') {
        Swiat.lisc(ctx, c.x, c.y, c.r * 3, c.r * 1.3, c.faza, ['#d8a860', '#b8823e', '#8a5a2e']);
      } else if (c.typ === 'swietliki') {
        const pul = 0.5 + 0.5 * Math.sin(c.faza * 3);
        const gl = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 5);
        gl.addColorStop(0, 'rgba(255,246,150,' + (0.6 * pul) + ')');
        gl.addColorStop(1, 'rgba(255,246,150,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 5, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,200,' + (0.7 + 0.3 * pul) + ')';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 0.8, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,220,0.5)';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill();
      }
    });
  }

  window.MantisGra = {
    start: startGry,
    doMenu: () => { stan.faza = 'menu'; },
    naUkonczenie: (cb) => { onUkonczono = cb; },
    ustawDzwiek: (wl) => { stan.dzwiekWl = wl; if (globalThis.Dzwiek) globalThis.Dzwiek.ustaw(wl); },
    faza: () => stan.faza,
    stan: stan
  };

  dopasuj();
  stan.swiatKey = 'laka';
  przygotujTlo('laka');
  zasiejCzasteczki();
  stan.faza = 'menu';        // start od ekranu domowego; menu wywoła start()
  requestAnimationFrame(klatka);
})();
