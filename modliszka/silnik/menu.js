/* ==========================================================================
   MANTIS, menu i ekran domowy (etap M4)
   Łączy zapis (Zapis), grę (MantisGra) i rysunek modliszki (Modliszka).
   Ekran domowy: duża modliszka, wybór z trzech gatunków (odblokowywane po
   kolei), przycisk GRAJ, wyciszenie. Po ukończeniu gatunku odblokowuje się
   następny i zapis trafia do localStorage.
   ========================================================================== */

(function () {
  'use strict';

  const KOLEJNOSC = Zapis.KOLEJNOSC;
  const dane = Zapis.wczytaj();

  const elDom = document.getElementById('dom');
  const elKarty = document.getElementById('karty');
  const elGraj = document.getElementById('graj');
  const elDzwiek = document.getElementById('dzwiek');
  const elDoDomu = document.getElementById('doDomu');

  let wybrana = dane.wybrana && dane.odblokowane.includes(dane.wybrana)
    ? dane.wybrana : 'zwyczajna';

  /* --- duża modliszka na ekranie domowym, lekko się kołysze ------------ */
  const domCanvas = document.getElementById('domModliszka');
  const domCtx = domCanvas.getContext('2d');
  let domFaza = 0, domCzas = 0;
  function rysujDomModliszke(dt) {
    domFaza += dt;
    domCtx.clearRect(0, 0, domCanvas.width, domCanvas.height);
    const kol = Math.sin(domFaza * 1.2) * 0.06;
    Modliszka.rysuj(domCtx, {
      x: domCanvas.width / 2, y: domCanvas.height - 40, dlugosc: 250,
      stadium: 8, gatunek: wybrana, kierunek: 1,
      poza: { kolysanie: kol, katGlowy: kol * 0.6, rozlozoneOdnoza: 0.25, krok: 0, intensywnosc: 0 }
    });
  }
  let domOstatni = 0;
  function domPetla(t) {
    if (!domOstatni) domOstatni = t;
    const dt = Math.min(0.05, (t - domOstatni) / 1000); domOstatni = t;
    if (!elDom.classList.contains('ukryty')) rysujDomModliszke(dt);
    requestAnimationFrame(domPetla);
  }
  requestAnimationFrame(domPetla);

  /* --- karty gatunków -------------------------------------------------- */
  function rysujMiniModliszke(canvas, gatunek, zablokowana) {
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    Modliszka.rysuj(c, { x: canvas.width / 2, y: canvas.height - 12, dlugosc: 128,
      stadium: 8, gatunek, kierunek: 1, cien: false,
      poza: { kolysanie: 0, rozlozoneOdnoza: 0.25, krok: 0, intensywnosc: 0 } });
    if (zablokowana) {
      /* ciemna sylwetka: przyciemniamy tylko narysowaną modliszkę */
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = 'rgba(30,45,20,0.82)';
      c.fillRect(0, 0, canvas.width, canvas.height);
      c.globalCompositeOperation = 'source-over';
    }
  }

  function budujKarty() {
    elKarty.innerHTML = '';
    KOLEJNOSC.forEach(gat => {
      const info = Modliszka.GATUNKI[gat];
      const odblokowana = dane.odblokowane.includes(gat);
      const ukonczona = dane.ukonczone.includes(gat);
      const karta = document.createElement('div');
      karta.className = 'karta' + (odblokowana ? '' : ' zablokowana') + (gat === wybrana ? ' wybrana' : '');
      const cv = document.createElement('canvas'); cv.width = 150; cv.height = 138;
      karta.appendChild(cv);
      if (odblokowana) {
        const nz = document.createElement('div'); nz.className = 'nazwa'; nz.textContent = info.nazwa;
        const lc = document.createElement('div'); lc.className = 'lac'; lc.textContent = info.lacinska;
        karta.appendChild(nz); karta.appendChild(lc);
        if (ukonczona) { const o = document.createElement('div'); o.className = 'odznaka'; o.textContent = '⭐'; karta.appendChild(o); }
        karta.addEventListener('click', () => { wybrana = gat; dane.wybrana = gat; Zapis.zapisz(dane); budujKarty(); });
      } else {
        const nz = document.createElement('div'); nz.className = 'nazwa'; nz.textContent = '???';
        karta.appendChild(nz);
        const k = document.createElement('div'); k.className = 'klodka'; k.textContent = '🔒'; karta.appendChild(k);
      }
      elKarty.appendChild(karta);
      rysujMiniModliszke(cv, gat, !odblokowana);
    });
  }
  budujKarty();

  /* --- dźwięk ---------------------------------------------------------- */
  function odswiezDzwiek() {
    elDzwiek.textContent = dane.dzwiek ? '🔊' : '🔇';
    MantisGra.ustawDzwiek(dane.dzwiek);
  }
  elDzwiek.addEventListener('click', () => { dane.dzwiek = !dane.dzwiek; Zapis.zapisz(dane); odswiezDzwiek(); });
  odswiezDzwiek();

  /* --- start i powrót -------------------------------------------------- */
  const elAlbumBtn = document.getElementById('album');
  function pokazDom() {
    elDom.classList.remove('ukryty');
    elDoDomu.style.display = 'none';
    elAlbumBtn.style.display = 'flex';
    MantisGra.doMenu();
    budujKarty();
  }
  function graj() {
    elDom.classList.add('ukryty');
    elDoDomu.style.display = 'flex';
    elAlbumBtn.style.display = 'none';
    MantisGra.start(wybrana);
  }
  elGraj.addEventListener('click', graj);
  elDoDomu.addEventListener('click', pokazDom);

  /* po ukończeniu gatunku: zapis, odblokowanie następnego */
  MantisGra.naUkonczenie((gat) => {
    const nowa = Zapis.ukoncz(dane, gat);
    dane._nowoOdblokowana = nowa;
  });

  /* --- album ciekawostek ---------------------------------------------- */
  const elAlbumEkran = document.getElementById('albumEkran');
  const elAlbumSiatka = document.getElementById('albumSiatka');
  const elAlbumLicznik = document.getElementById('albumLicznik');
  const elAlbumZamknij = document.getElementById('albumZamknij');
  const elKartaOpis = document.getElementById('kartaOpis');
  const elKartaOpisTresc = document.getElementById('kartaOpisTresc');
  const elListek = document.getElementById('listek');

  function budujAlbum() {
    elAlbumSiatka.innerHTML = '';
    const odkryte = dane.odkryte.length, wszystkie = Album.KARTY.length;
    elAlbumLicznik.textContent = odkryte + ' z ' + wszystkie + ' kart';
    Album.KARTY.forEach(def => {
      const jest = dane.odkryte.includes(def.id);
      const k = document.createElement('div'); k.className = 'albKarta';
      const cv = document.createElement('canvas'); cv.width = 130; cv.height = 100;
      k.appendChild(cv);
      const t = document.createElement('div'); t.className = 't';
      t.textContent = jest ? def.tytul : '???';
      k.appendChild(t);
      elAlbumSiatka.appendChild(k);
      Album.rysujMini(cv, def, jest);
      if (jest) k.addEventListener('click', () => pokazKarte(def));
    });
  }
  function pokazKarte(def) {
    elKartaOpisTresc.innerHTML = '';
    const cv = document.createElement('canvas'); cv.width = 260; cv.height = 190;
    elKartaOpisTresc.appendChild(cv);
    Album.rysujMini(cv, def, true);
    const t = document.createElement('div'); t.className = 't'; t.textContent = def.tytul;
    elKartaOpisTresc.appendChild(t);
    if (def.lac) { const l = document.createElement('div'); l.className = 'lac'; l.textContent = def.lac; elKartaOpisTresc.appendChild(l); }
    const f = document.createElement('div'); f.className = 'f'; f.textContent = def.fakt;
    elKartaOpisTresc.appendChild(f);
    elKartaOpis.classList.add('pokaz');
  }
  function otworzAlbum() { budujAlbum(); elAlbumEkran.classList.add('pokaz'); elAlbumZamknij.classList.add('pokaz'); }
  function zamknijAlbum() { elAlbumEkran.classList.remove('pokaz'); elAlbumZamknij.classList.remove('pokaz'); }
  elAlbumBtn.addEventListener('click', otworzAlbum);
  elAlbumZamknij.addEventListener('click', zamknijAlbum);
  elKartaOpis.addEventListener('click', () => elKartaOpis.classList.remove('pokaz'));

  /* odkrycie karty w trakcie gry: zapis plus mały listek w rogu, gra się
     nie zatrzymuje */
  let listekTimer = null;
  MantisGra.naKarta((id) => {
    const nowa = Zapis.odkryj(dane, id);
    if (!nowa) return;
    const def = Album.karta(id);
    elListek.textContent = '🍃 ' + (def ? def.tytul : 'nowa karta');
    elListek.classList.add('pokaz');
    clearTimeout(listekTimer);
    listekTimer = setTimeout(() => elListek.classList.remove('pokaz'), 2200);
  });
})();
