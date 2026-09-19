/* ==========================================================================
   MANTIS, pętla gry (etap M2)
   Dochodzi: owady, czujność i płoszenie, atak odnóżami, jedzenie, pasek
   wzrostu segmentowy, osiem stadiów z rosnącą skalą i odjeżdżającą kamerą.
   Wylinka jest na tym etapie uproszczona (błysk plus zmiana rozmiaru).
   Pełną, wiszącą wylinkę robimy w M3.
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
    { food: 2, dl: 90,  zoom: 1.30 },
    { food: 2, dl: 106, zoom: 1.20 },
    { food: 2, dl: 124, zoom: 1.10 },
    { food: 3, dl: 146, zoom: 1.00 },
    { food: 3, dl: 172, zoom: 0.90 },
    { food: 4, dl: 205, zoom: 0.80 },
    { food: 4, dl: 240, zoom: 0.72 },
    { food: 0, dl: 285, zoom: 0.64 }   // L8 dorosła, koniec wzrostu
  ];

  const SWIAT_SZER = 1600;
  const tloCanvas = document.createElement('canvas');
  tloCanvas.width = SWIAT_SZER; tloCanvas.height = WYS;
  const gruntY = WYS * 0.80;

  function przygotujTlo() {
    const c = tloCanvas.getContext('2d');
    for (let x = 0; x < SWIAT_SZER; x += SZER) {
      c.save(); c.translate(x, 0);
      c.beginPath(); c.rect(0, 0, SZER, WYS); c.clip();
      Swiat.rysujSwiat(c, SZER, WYS);
      c.restore();
    }
    /* ciągły pas gruntu, żeby modliszka i owady chodziły po jednej
       powierzchni, a nie po powietrzu między liśćmi */
    const grunt = c.createLinearGradient(0, gruntY - 10, 0, WYS);
    grunt.addColorStop(0, 'rgba(120,150,70,0.0)');
    grunt.addColorStop(0.25, 'rgba(96,132,60,0.55)');
    grunt.addColorStop(1, 'rgba(70,104,44,0.85)');
    c.fillStyle = grunt;
    c.fillRect(0, gruntY - 6, SWIAT_SZER, WYS - gruntY + 6);
    /* źdźbła na krawędzi gruntu */
    for (let x = 0; x < SWIAT_SZER; x += 26) {
      const dl = 24 + (x * 7 % 30);
      Swiat.zdzblo(c, x, gruntY + 6, dl, ((x % 3) - 1) * 10, 3, 'rgba(88,132,58,0.8)');
    }
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
    if (stan.faza !== 'gra') return;
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
  function start(x, y) { wcisniete = true; celuj(x, y); }
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

    if (stan.faza === 'wylinka') { aktualizujWylinke(dt); return; }

    uzupelnijOwady(dt);
    stan.owady.forEach(o => {
      if (!o.zyje && !(o.znika > 0)) return;
      ruchOwada(o, dt);
      /* czujność: szybki ruch modliszki w promieniu płoszy owada */
      const t = Owad.TYPY[o.typ];
      if (t.czujnosc > 0 && o.zyje && !o.ucieka && o !== m.owadCel) {
        const d = Math.abs(o.x - glowaX(m));
        /* na M2 każde spłoszenie = ucieczka i pojawia się nowy owad.
           Powrót po 1. i 2. spłoszeniu (jak w projekcie) dostroimy przy
           testach na dziecku. */
        if (m.predkosc > SKRADANIE + 6 && d < t.czujnosc * 130) sploszenie(o);
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
    m.krok += (m.predkosc * dt) / 34;
    m.intensywnosc = Math.min(1, m.predkosc / 42);
    m.kolysanieFaza += dt * (1.1 + m.predkosc * 0.01);

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

    /* kamera z uwzględnieniem zoomu: modliszka blisko środka */
    const widoczne = SZER / m.zoom;
    const celKamery = Math.max(widoczne / 2, Math.min(SWIAT_SZER - widoczne / 2, m.x));
    stan.kamera += (celKamery - stan.kamera) * Math.min(1, dt * 7);
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

  /* --- wylinka (uproszczona na M2) ------------------------------------- */
  function rozpocznijWylinke() {
    if (stan.modliszka.stadiumIdx >= STADIA.length - 1) { stan.faza = 'zwyciestwo'; return; }
    stan.faza = 'wylinka'; stan.wylinka = 0;
    stan.modliszka.predkosc = 0; stan.modliszka.cel = null; stan.modliszka.owadCel = null;
  }

  function aktualizujWylinke(dt) {
    const m = stan.modliszka;
    stan.wylinka += dt / 3;                       // około 3 sekundy
    if (stan.wylinka >= 0.5 && m.stadiumIdx < STADIA.length - 1 && !m.wyrosla) {
      m.wyrosla = true;
      m.stadiumIdx++;
      m.food = 0;
      const st = STADIA[m.stadiumIdx];
      m.dlugoscCel = st.dl; m.zoomCel = st.zoom;
      if (dzwiek) dzwiek('wzrost');
    }
    m.dlugosc += (m.dlugoscCel - m.dlugosc) * Math.min(1, dt * 4);
    m.zoom += (m.zoomCel - m.zoom) * Math.min(1, dt * 4);
    const widoczne = SZER / m.zoom;
    const celKamery = Math.max(widoczne / 2, Math.min(SWIAT_SZER - widoczne / 2, m.x));
    stan.kamera += (celKamery - stan.kamera) * Math.min(1, dt * 4);
    if (stan.wylinka >= 1) { stan.faza = 'gra'; m.wyrosla = false; }
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
    /* tło zapasowe, żeby przy zoomie nie było gołych rogów */
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#e7f2b8'); g.addColorStop(0.6, '#a9d894'); g.addColorStop(1, '#5c9a4c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ustawSwiat();
    ctx.drawImage(tloCanvas, 0, 0);

    /* owady za modliszką (tło) i przed nią rozdzielamy po wysokości */
    stan.owady.forEach(o => {
      if (!o.zyje && !(o.znika > 0)) return;
      if (o.zlapany) return;                       // złapany owad znika w chwycie
      Owad.rysuj(ctx, {
        x: o.x, y: o.y, typ: o.typ, faza: o.faza, kierunek: o.kierunek,
        naZiemi: o.naZiemi, rozmiar: 40
      });
    });

    /* modliszka */
    const migotanie = stan.faza === 'wylinka'
      ? (Math.sin(stan.wylinka * 40) * 0.5 + 0.5) * (1 - Math.abs(stan.wylinka - 0.5) * 2)
      : 0;
    const kol = Math.sin(m.kolysanieFaza) * (0.05 + 0.05 * (1 - m.intensywnosc));
    /* głowa śledzi cel albo najbliższego owada */
    let katG = kol * 0.5;
    const patrzOwad = m.owadCel && m.owadCel.zyje ? m.owadCel : najblizszyOwad();
    if (patrzOwad) {
      const dx = (patrzOwad.x - glowaX(m)) * m.kierunek;
      katG = Math.max(-0.5, Math.min(0.5, (patrzOwad.y - (gruntY - m.dlugosc * 0.4)) / 120)) + (dx < 0 ? 0.2 : 0);
    }
    m.katGlowyWyg += (katG - m.katGlowyWyg) * Math.min(1, 0.15);

    Modliszka.rysuj(ctx, {
      x: m.x, y: gruntY, dlugosc: m.dlugosc,
      stadium: m.stadium, gatunek: m.gatunek, kierunek: m.kierunek,
      poza: {
        krok: m.krok, intensywnosc: m.intensywnosc,
        kolysanie: kol, katGlowy: m.katGlowyWyg,
        rozlozoneOdnoza: 0.15, atak: Math.sin(Math.min(1, m.atak) * Math.PI)
      }
    });

    if (migotanie > 0.01) {
      ctx.save(); ustawSwiat();
      ctx.globalAlpha = migotanie * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(m.x, gruntY - m.dlugosc * 0.3, m.dlugosc * 0.7, 0, 7); ctx.fill();
      ctx.restore();
    }

    /* iskry energii */
    stan.iskry.forEach(s => {
      ctx.globalAlpha = Math.max(0, s.zyc / 0.6);
      ctx.fillStyle = '#fff2a0';
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    rysujHUD();
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

    /* pasek segmentowy na górze */
    if (potrzeba > 0) {
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
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = 'rgba(60,80,30,0.6)'; ctx.lineWidth = 2;
    okragly(ctx, W - 62, 46, 46, 32, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3d5c1e'; ctx.font = '700 22px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('L' + m.stadium, W - 39, 63);

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
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 0, W, stan.wysEkranuCss);
      ctx.fillStyle = '#3d5c1e'; ctx.font = '800 56px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('BRAWO!', W / 2, stan.wysEkranuCss * 0.4);
      ctx.font = '400 18px system-ui'; ctx.fillText('(ekran zwycięstwa w M3)', W / 2, stan.wysEkranuCss * 0.4 + 44);
    }
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

  /* --- dźwięk (zaślepka do M5) ---------------------------------------- */
  let dzwiek = null;

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

  dopasuj();
  przygotujTlo();
  zasiej();
  requestAnimationFrame(klatka);
})();
