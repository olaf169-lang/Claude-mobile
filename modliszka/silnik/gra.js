/* ==========================================================================
   MANTIS, pętla gry (etap M1)
   Na tym etapie: świat, modliszka, chodzenie za palcem, kamera, kołysanie.
   Bez owadów, bez paska. Chodzi o sprawdzenie, czy prowadzenie modliszki
   jest samo w sobie przyjemne i zrozumiałe dla dziecka.
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('gra');
  const ctx = canvas.getContext('2d');

  /* --- rozmiar i skala ------------------------------------------------- */
  const SZER = 540, WYS = 960;                 // logiczna rozdzielczość (pion)
  let dpr = 1;

  function dopasuj() {
    const w = window.innerWidth, h = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    /* skalujemy logiczny świat 540x960 tak, by wypełnił ekran (cover) */
    const s = Math.max((w * dpr) / SZER, (h * dpr) / WYS);
    stan.skalaEkranu = s;
    stan.marginX = (w * dpr - SZER * s) / 2;
    stan.marginY = (h * dpr - WYS * s) / 2;
  }

  /* --- świat, rysowany raz na ukrytym canvasie ------------------------- */
  const SWIAT_SZER = 1500;                      // szerszy niż ekran, kamera się przesuwa
  const tloCanvas = document.createElement('canvas');
  tloCanvas.width = SWIAT_SZER; tloCanvas.height = WYS;
  const gruntY = WYS * 0.80;                    // wysokość, po której chodzi modliszka

  function przygotujTlo() {
    const c = tloCanvas.getContext('2d');
    /* tło rysujemy kafelkami szerokości ekranu, każde to Swiat.rysujSwiat */
    for (let x = 0; x < SWIAT_SZER; x += SZER) {
      c.save(); c.translate(x, 0);
      c.beginPath(); c.rect(0, 0, SZER, WYS); c.clip();
      Swiat.rysujSwiat(c, SZER, WYS);
      c.restore();
    }
  }

  /* --- stan ------------------------------------------------------------ */
  const stan = {
    skalaEkranu: 1, marginX: 0, marginY: 0,
    modliszka: {
      x: SWIAT_SZER * 0.5, kierunek: 1,
      predkosc: 0, krok: 0,
      dlugosc: 150, stadium: 4, gatunek: 'zwyczajna',
      katGlowy: 0, kolysanieFaza: 0
    },
    cel: null,                                  // dokąd idzie (świat X) albo null
    kamera: SWIAT_SZER * 0.5,
    czas: 0
  };

  const MAX_PREDKOSC = 130;                     // jednostki świata na sekundę

  /* --- wejście: dotyk i mysz ------------------------------------------ */
  function ekranNaSwiat(clientX) {
    /* z piksela ekranu na współrzędną X świata */
    const px = clientX * dpr;
    const logiczneX = (px - stan.marginX) / stan.skalaEkranu;   // 0..SZER
    return stan.kamera - SZER / 2 + logiczneX;
  }

  let wcisniete = false;
  function start(x) { wcisniete = true; stan.cel = ekranNaSwiat(x); }
  function ruch(x) { if (wcisniete) stan.cel = ekranNaSwiat(x); }
  function koniec() { wcisniete = false; }

  canvas.addEventListener('touchstart', e => { e.preventDefault(); start(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); ruch(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('touchend', e => { e.preventDefault(); koniec(); }, { passive: false });
  canvas.addEventListener('mousedown', e => start(e.clientX));
  window.addEventListener('mousemove', e => ruch(e.clientX));
  window.addEventListener('mouseup', koniec);

  /* --- aktualizacja --------------------------------------------------- */
  function aktualizuj(dt) {
    const m = stan.modliszka;

    if (stan.cel !== null) {
      const roznica = stan.cel - m.x;
      const odleglosc = Math.abs(roznica);
      if (odleglosc > 4) {
        m.kierunek = roznica > 0 ? 1 : -1;
        /* zwalnia tuż przed celem, żeby nie dygotać w miejscu */
        const docelowa = Math.min(1, odleglosc / 60) * MAX_PREDKOSC;
        m.predkosc += (docelowa - m.predkosc) * Math.min(1, dt * 6);
      } else {
        m.predkosc += (0 - m.predkosc) * Math.min(1, dt * 8);
        stan.cel = null;
      }
    } else {
      m.predkosc += (0 - m.predkosc) * Math.min(1, dt * 8);
    }

    m.x += m.kierunek * m.predkosc * dt;
    m.x = Math.max(60, Math.min(SWIAT_SZER - 60, m.x));

    /* faza chodu rośnie z przebytą drogą, nie z czasem, więc nogi nie
       ślizgają się przy zmianie prędkości */
    m.krok += (m.predkosc * dt) / 42;
    m.intensywnosc = Math.min(1, m.predkosc / 55);

    /* kołysanie: mocniejsze gdy modliszka stoi albo idzie wolno, jak
       prawdziwa modliszka udająca liść na wietrze */
    m.kolysanieFaza += dt * (1.1 + m.predkosc * 0.01);

    /* kamera podąża miękko, ale zostawia margines przy krawędziach świata */
    const celKamery = Math.max(SZER / 2, Math.min(SWIAT_SZER - SZER / 2, m.x));
    stan.kamera += (celKamery - stan.kamera) * Math.min(1, dt * 3.5);

    stan.czas += dt;
  }

  /* --- rysowanie ------------------------------------------------------ */
  function rysuj() {
    const m = stan.modliszka;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* przejście do układu logicznego z kamerą */
    ctx.setTransform(stan.skalaEkranu, 0, 0, stan.skalaEkranu, stan.marginX, stan.marginY);
    const przesuniecie = -(stan.kamera - SZER / 2);
    ctx.save();
    ctx.translate(przesuniecie, 0);

    /* tło */
    ctx.drawImage(tloCanvas, 0, 0);

    /* modliszka na gruncie */
    const kol = Math.sin(m.kolysanieFaza) * (0.05 + 0.05 * (1 - m.intensywnosc));
    Modliszka.rysuj(ctx, {
      x: m.x, y: gruntY, dlugosc: m.dlugosc,
      stadium: m.stadium, gatunek: m.gatunek, kierunek: m.kierunek,
      poza: {
        krok: m.krok, intensywnosc: m.intensywnosc,
        kolysanie: kol, katGlowy: kol * 0.5,
        rozlozoneOdnoza: 0.15
      }
    });

    /* delikatny plan bliski na wierzchu, przesuwany wolniej (paralaksa) */
    ctx.restore();
    ctx.save();
    ctx.translate(przesuniecie * 0.5, 0);
    /* plan bliski jest lekki, rysujemy go tylko raz w kadrze */
    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* --- pętla ---------------------------------------------------------- */
  let ostatni = 0;
  function klatka(teraz) {
    if (!ostatni) ostatni = teraz;
    let dt = (teraz - ostatni) / 1000;
    ostatni = teraz;
    if (dt > 0.05) dt = 0.05;                   // po powrocie z tła nie przeskakuj
    aktualizuj(dt);
    rysuj();
    requestAnimationFrame(klatka);
  }

  document.addEventListener('visibilitychange', () => { ostatni = 0; });
  window.addEventListener('resize', dopasuj);

  /* --- panel testowy: zmiana stadium i gatunku ------------------------ */
  window.MantisTest = {
    stadium: (s) => { stan.modliszka.stadium = s; },
    gatunek: (g) => { stan.modliszka.gatunek = g; },
    stan: stan
  };

  dopasuj();
  przygotujTlo();
  requestAnimationFrame(klatka);
})();
