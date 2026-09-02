/* ==========================================================================
   Skąd bierze się dźwięk.
   --------------------------------------------------------------------------
   Trzy warstwy, od najszybszej:

     1. dane/podglady.json — gotowe adresy, dobrane wcześniej na serwerze
        GitHuba. To normalna droga: nic nie trzeba pytać, gra zaczyna od razu.
     2. pamięć przeglądarki — to, co telefon sam kiedyś znalazł.
     3. wyszukiwanie w locie — dla utworów dopisanych po ostatnim przebiegu
        workflowu.

   Wyszukiwarki iTunes i Deezera nie wystawiają nagłówków CORS, więc z poziomu
   strony nie da się do nich zwyczajnie zapytać. Oba za to obsługują JSONP,
   czyli odpowiedź w postaci skryptu — i tą drogą idziemy. Samo nagranie to już
   zwykły plik dźwiękowy, do którego <audio> nie potrzebuje żadnej zgody.
   ========================================================================== */

import { wybierzNajlepszy, zITunes, zDeezera, zapytanie } from './dopasowanie.js';

const PREFIKS_PAMIECI = 'jtm:pg:';
let licznikWywolan = 0;

/** Zapytanie w stylu JSONP: odpowiedź przychodzi jako wywołanie naszej funkcji. */
function jsonp(adresBazowy, parametry, { nazwaParametru = 'callback', limitMs = 7000 } = {}) {
  return new Promise((spelnij, odrzuc) => {
    licznikWywolan += 1;
    const nazwa = `__jtm_${Date.now().toString(36)}_${licznikWywolan}`;
    const adres = new URL(adresBazowy);
    for (const [klucz, wartosc] of Object.entries(parametry)) adres.searchParams.set(klucz, wartosc);
    adres.searchParams.set(nazwaParametru, nazwa);

    const skrypt = document.createElement('script');
    let licznik;
    const posprzataj = () => {
      clearTimeout(licznik);
      delete window[nazwa];
      skrypt.remove();
    };

    window[nazwa] = (dane) => { posprzataj(); spelnij(dane); };
    licznik = setTimeout(() => { posprzataj(); odrzuc(new Error('Sklep nie odpowiedział')); }, limitMs);
    skrypt.onerror = () => { posprzataj(); odrzuc(new Error('Nie udało się odpytać sklepu')); };
    skrypt.src = adres.toString();
    document.head.append(skrypt);
  });
}

export class ZrodloPodgladow {
  constructor() {
    this.gotowe = new Map();      // id → { podglad, okladka, zrodlo }
    this.wTrakcie = new Map();    // id → obietnica, żeby nie pytać dwa razy
    this.wygenerowano = null;
    this.brakiZPliku = [];
  }

  /** Wczytuje plik z podglądami. Brak pliku nie jest błędem — gra pójdzie w locie. */
  async wczytaj() {
    try {
      const odpowiedz = await fetch('dane/podglady.json', { cache: 'no-cache' });
      if (!odpowiedz.ok) throw new Error(String(odpowiedz.status));
      const dane = await odpowiedz.json();
      for (const [id, wpis] of Object.entries(dane.utwory || {})) {
        if (wpis?.podglad) this.gotowe.set(id, wpis);
      }
      this.wygenerowano = dane.wygenerowano || null;
      this.brakiZPliku = dane.braki || [];
    } catch {
      this.wygenerowano = null;
    }
    return this;
  }

  /** Bez sieci: plik albo pamięć przeglądarki. Tym filtrujemy pulę utworów. */
  zPamieci(utwor) {
    const gotowy = this.gotowe.get(utwor.id);
    if (gotowy) return gotowy;
    try {
      const zapisany = localStorage.getItem(PREFIKS_PAMIECI + utwor.id);
      if (zapisany) {
        const wpis = JSON.parse(zapisany);
        if (wpis?.podglad) {
          this.gotowe.set(utwor.id, wpis);
          return wpis;
        }
      }
    } catch { /* pamięć zapełniona albo wyłączona */ }
    return null;
  }

  maPodglad(utwor) {
    return Boolean(this.zPamieci(utwor));
  }

  /** Pełne szukanie: pamięć, potem iTunes, potem Deezer. */
  async znajdz(utwor) {
    const zPamieci = this.zPamieci(utwor);
    if (zPamieci) return zPamieci;
    if (this.wTrakcie.has(utwor.id)) return this.wTrakcie.get(utwor.id);

    const szukanie = this._wSklepach(utwor).then((wpis) => {
      this.wTrakcie.delete(utwor.id);
      if (wpis) this._zapamietaj(utwor.id, wpis);
      return wpis;
    });
    this.wTrakcie.set(utwor.id, szukanie);
    return szukanie;
  }

  /** Nowy adres do tego samego nagrania — podglądy Deezera wygasają. */
  async odswiez(utwor) {
    this.gotowe.delete(utwor.id);
    try { localStorage.removeItem(PREFIKS_PAMIECI + utwor.id); } catch { /* nieistotne */ }
    return this.znajdz(utwor);
  }

  async _wSklepach(utwor) {
    const kraje = utwor.gatunek === 'polskie' ? ['PL', 'US'] : ['US', 'PL'];
    for (const kraj of kraje) {
      try {
        const dane = await jsonp('https://itunes.apple.com/search', {
          term: zapytanie(utwor), entity: 'song', limit: '12', country: kraj,
        });
        const trafienie = wybierzNajlepszy(utwor, (dane?.results || []).map(zITunes));
        if (trafienie) return this._wpis(trafienie);
      } catch { /* następne źródło */ }
    }
    try {
      const dane = await jsonp('https://api.deezer.com/search',
        { q: zapytanie(utwor), limit: '12', output: 'jsonp' });
      const trafienie = wybierzNajlepszy(utwor, (dane?.data || []).map(zDeezera));
      if (trafienie) return this._wpis(trafienie);
    } catch { /* nic z tego */ }
    return null;
  }

  _wpis(trafienie) {
    return {
      podglad: trafienie.podglad,
      okladka: trafienie.okladka,
      zrodlo: trafienie.zrodlo,
      zrodloId: trafienie.zrodloId,
    };
  }

  _zapamietaj(id, wpis) {
    this.gotowe.set(id, wpis);
    try {
      localStorage.setItem(PREFIKS_PAMIECI + id, JSON.stringify(wpis));
    } catch { /* pamięć pełna — wpis został przynajmniej w tej sesji */ }
  }
}
