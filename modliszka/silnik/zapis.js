/* ==========================================================================
   MANTIS, zapis lokalny (etap M4)
   Trzyma stan gry w localStorage pod przedrostkiem mantis:, tak jak
   BANGladesz26 używa b26:. Numer wersji od początku, żeby dało się później
   zmienić strukturę bez psucia postępu dziecka.
   ========================================================================== */

(function (globalny) {
  'use strict';

  const KLUCZ = 'mantis:stan';
  const KOLEJNOSC = ['zwyczajna', 'duchowa', 'storczykowa'];

  const domyslny = {
    wersja: 2,
    dzwiek: true,
    wybrana: 'zwyczajna',
    odblokowane: ['zwyczajna'],
    ukonczone: [],
    odkryte: []            // odkryte karty w albumie ciekawostek
  };

  function wczytaj() {
    try {
      const s = localStorage.getItem(KLUCZ);
      if (!s) return Object.assign({}, domyslny);
      const d = JSON.parse(s);
      /* dokładamy brakujące pola, gdyby format urósł */
      return Object.assign({}, domyslny, d,
        { odblokowane: d.odblokowane || domyslny.odblokowane.slice(),
          ukonczone: d.ukonczone || [],
          odkryte: d.odkryte || [] });
    } catch (e) {
      return Object.assign({}, domyslny);
    }
  }

  function zapisz(d) {
    try { localStorage.setItem(KLUCZ, JSON.stringify(d)); } catch (e) { /* prywatne okno itp. */ }
  }

  /* Ukończenie modliszki: oznacza ją jako ukończoną i odblokowuje następną. */
  function ukoncz(d, gatunek) {
    if (!d.ukonczone.includes(gatunek)) d.ukonczone.push(gatunek);
    const i = KOLEJNOSC.indexOf(gatunek);
    const nast = KOLEJNOSC[i + 1];
    let nowaOdblokowana = null;
    if (nast && !d.odblokowane.includes(nast)) {
      d.odblokowane.push(nast);
      nowaOdblokowana = nast;
    }
    zapisz(d);
    return nowaOdblokowana;     // nazwa nowo odblokowanej modliszki albo null
  }

  /* Odkrycie karty w albumie. Zwraca true, jeśli była nowa. */
  function odkryj(d, id) {
    if (d.odkryte.includes(id)) return false;
    d.odkryte.push(id);
    zapisz(d);
    return true;
  }

  globalny.Zapis = { wczytaj, zapisz, ukoncz, odkryj, KOLEJNOSC };
})(window);
