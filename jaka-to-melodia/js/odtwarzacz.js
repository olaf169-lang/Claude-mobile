/* ==========================================================================
   Odtwarzacz fragmentów — z myślą o telefonie prowadzącego.
   --------------------------------------------------------------------------
   Trzy rzeczy, które trzeba tu obejść:

   • iOS puszcza dźwięk tylko wtedy, gdy pierwsze odtworzenie wyszło z dotknięcia
     ekranu. Dlatego przy starcie gry „rozgrzewamy” oba elementy <audio> ciszą —
     potem można je już włączać z kodu, między rundami.
   • Safari na iPhonie ignoruje ustawianie głośności z JavaScriptu. Sprawdzamy
     to raz i tam, gdzie się nie da, po prostu nie wyciszamy płynnie.
   • Kolejny utwór musi być gotowy, zanim skończy się runda. Stąd dwa elementy
     na zmianę: jeden gra, drugi w tym czasie się doczytuje.
   ========================================================================== */

const CISZA = 'data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA';
export const DLUGOSC_PODGLADU_MS = 30_000;

export class Odtwarzacz {
  constructor() {
    this.elementy = [this._nowyElement(), this._nowyElement()];
    this.biezacy = 0;
    this.rozgrzany = false;
    this.steruje = false;              // czy da się zmieniać głośność z kodu
    this._wygaszanie = null;
    this._przygotowany = { url: null, nr: null };
    this.onBlad = () => {};
  }

  _nowyElement() {
    const element = new Audio();
    element.preload = 'auto';
    element.playsInline = true;        // iPhone inaczej otwiera pełny ekran
    element.addEventListener('error', () => {
      if (element.src && !element.src.startsWith('data:')) this.onBlad(element.src);
    });
    return element;
  }

  /**
   * Wywołaj z obsługi dotknięcia (np. przycisku „Zaczynamy”). Bez tego iPhone
   * odmówi odtwarzania w kolejnych rundach.
   */
  async rozgrzej() {
    if (this.rozgrzany) return true;
    const proby = await Promise.all(this.elementy.map(async (element) => {
      element.src = CISZA;
      try {
        await element.play();
        element.pause();
        element.currentTime = 0;
        return true;
      } catch {
        return false; // zablokowane — spróbujemy ponownie przy następnym dotknięciu
      }
    }));

    // Czy przeglądarka pozwala sterować głośnością? Safari na iOS udaje, że tak.
    const probny = this.elementy[0];
    probny.volume = 0.42;
    this.steruje = Math.abs(probny.volume - 0.42) < 0.01;
    probny.volume = 1;

    // Musi się udać na OBU elementach — inaczej rozgrzany=true kłamałby,
    // że telefon jest gotowy, mimo że kolejne odtworzenie i tak zostanie
    // zablokowane (dawny błąd: readyState>0 jest prawdą nawet po zablokowanym
    // play(), więc ta flaga zawsze wychodziła "gotowe", nawet gdy nie było).
    this.rozgrzany = proby.every(Boolean);
    return this.rozgrzany;
  }

  /** Doczytuje nagranie na wolnym elemencie, żeby następna runda ruszyła od razu. */
  przygotuj(url) {
    if (!url || this._przygotowany.url === url) return;
    const nr = 1 - this.biezacy;
    const element = this.elementy[nr];
    element.src = url;
    element.load();
    this._przygotowany = { url, nr };
  }

  /**
   * Puszcza fragment. `startS` to konkretny moment (w sekundach) w obrębie
   * 30-sekundowego podglądu, od którego ma ruszyć — podaje go wywołujący
   * (a nie ten odtwarzacz), żeby dało się rozesłać dokładnie tę samą wartość
   * na inne telefony i wszyscy usłyszeli to samo miejsce w piosence.
   */
  async zagraj(url, { startS = 0, dlugoscMs = 0 } = {}) {
    clearTimeout(this._wygaszanie);
    const nr = this._przygotowany.url === url ? this._przygotowany.nr : 1 - this.biezacy;
    const poprzedni = this.elementy[this.biezacy];
    const element = this.elementy[nr];

    poprzedni.pause();
    this.biezacy = nr;
    this._przygotowany = { url: null, nr: null };

    if (element.src !== url) {
      element.src = url;
      element.load();
    }
    if (this.steruje) element.volume = 1;

    const ustawStart = () => {
      if (startS <= 0) return;
      // Realna długość podglądu, jeśli już ją znamy — bywa krótsza niż 30 s,
      // a przeskoczenie za koniec potrafi się różnie zachować w różnych
      // przeglądarkach, więc zostawiamy sekundowy zapas.
      const znanaDlugoscS = Number.isFinite(element.duration) ? element.duration : DLUGOSC_PODGLADU_MS / 1000;
      const zapas = Math.max(0, znanaDlugoscS - 1);
      try { element.currentTime = Math.min(startS, zapas); } catch { /* jeszcze nie wie, ile trwa */ }
    };
    if (element.readyState >= 1) ustawStart();
    else element.addEventListener('loadedmetadata', ustawStart, { once: true });

    try {
      await element.play();
      return true;
    } catch (blad) {
      // Najczęściej: telefon nie został rozgrzany dotknięciem albo nagranie znikło.
      this.onBlad(url, blad);
      return false;
    }
  }

  /** Ścisza i zatrzymuje. Tam, gdzie głośności nie da się zmieniać — ucina. */
  zatrzymaj({ wygaszanieMs = 700 } = {}) {
    clearTimeout(this._wygaszanie);
    const element = this.elementy[this.biezacy];
    if (element.paused) return;

    if (!this.steruje || wygaszanieMs <= 0) {
      element.pause();
      return;
    }
    const krok = 50;
    const ubytek = element.volume / Math.max(1, wygaszanieMs / krok);
    const scisz = () => {
      const nowa = element.volume - ubytek;
      if (nowa <= 0.02) {
        element.pause();
        element.volume = 1;
        return;
      }
      element.volume = nowa;
      this._wygaszanie = setTimeout(scisz, krok);
    };
    scisz();
  }

  uciszWszystko() {
    clearTimeout(this._wygaszanie);
    for (const element of this.elementy) {
      element.pause();
      if (this.steruje) element.volume = 1;
    }
  }
}
