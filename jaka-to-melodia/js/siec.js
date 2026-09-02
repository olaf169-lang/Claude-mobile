/* ==========================================================================
   Pokój gry — protokół między telefonem prowadzącego a telefonami graczy.
   --------------------------------------------------------------------------
   Nie ma tu żadnego naszego serwera. Prowadzący i gracze spotykają się na
   publicznym brokerze MQTT, na dwóch tematach:

       jtm/<KOD>/h   prowadzący → wszyscy   (stan gry)
       jtm/<KOD>/g   gracz → prowadzący     (dołączenie, odpowiedzi)

   Prowadzący jest jedynym źródłem prawdy. Poprawna odpowiedź nie jedzie w
   eterze przed czasem — telefony dostają ją dopiero na odsłonie, więc nie da
   się jej podejrzeć w podglądzie ruchu.

   Stan rundy jest nadawany cyklicznie, nie raz. Dzięki temu telefon, który
   dołączył w trakcie albo na chwilę stracił zasięg, sam się dostraja i nie
   trzeba niczego potwierdzać ani powtarzać ręcznie.
   ========================================================================== */

import { KlientMqtt } from './mqtt.js';

const BROKERY_PUBLICZNE = [
  { nazwa: 'EMQX', adres: 'wss://broker.emqx.io:8084/mqtt' },
  { nazwa: 'HiveMQ', adres: 'wss://broker.hivemq.com:8884/mqtt' },
  { nazwa: 'Mosquitto', adres: 'wss://test.mosquitto.org:8081/mqtt' },
];

/**
 * Własny broker: dopisz do adresu `?serwer=wss://twoj.broker/mqtt`, a gra
 * spróbuje go w pierwszej kolejności. Link do dołączenia zachowuje ten
 * parametr, więc wystarczy ustawić go raz, u prowadzącego. Przydaje się, gdy
 * publiczne brokery są zablokowane w sieci albo gdy ktoś woli własny.
 */
function brokerZAdresu() {
  try {
    const podany = new URLSearchParams(location.search).get('serwer');
    if (podany && /^wss?:\/\//.test(podany)) return [{ nazwa: 'własny', adres: podany }];
  } catch { /* brak location — np. w teście modułu */ }
  return [];
}

export const BROKERY = [...brokerZAdresu(), ...BROKERY_PUBLICZNE];

// Bez O/0 i I/1 — kod ma być czytelny z ekranu i do podyktowania przez pokój.
const ZNAKI_KODU = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function losowyKod(dlugosc = 4) {
  const bajty = new Uint8Array(dlugosc);
  crypto.getRandomValues(bajty);
  return [...bajty].map((b) => ZNAKI_KODU[b % ZNAKI_KODU.length]).join('');
}

/** Identyfikator telefonu — przeżywa odświeżenie strony, więc wracasz z punktami. */
export function idUrzadzenia() {
  const klucz = 'jtm:urzadzenie';
  let id = localStorage.getItem(klucz);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem(klucz, id);
  }
  return id;
}

export const tematProwadzacego = (kod) => `jtm/${kod}/h`;
export const tematGraczy = (kod) => `jtm/${kod}/g`;

/** Adres z kodem pokoju i numerem brokera — to ląduje w kodzie QR. */
export function adresDolaczenia(kod, brokerNr) {
  const adres = new URL(location.href);
  adres.hash = `#/dolacz/${kod}/${brokerNr}`;
  return adres.toString();
}

async function pierwszyDzialajacy(kolejnosc, klientId, limitMs) {
  const bledy = [];
  for (const nr of kolejnosc) {
    const broker = BROKERY[nr];
    if (!broker) continue;
    const klient = new KlientMqtt({ adres: broker.adres, klientId: `${klientId}-${nr}` });
    try {
      await klient.polacz(limitMs);
      return { klient, brokerNr: nr };
    } catch (blad) {
      bledy.push(`${broker.nazwa}: ${blad.message}`);
    }
  }
  throw new Error(`Żaden broker nie odpowiedział.\n${bledy.join('\n')}`);
}

/* ------------------------------------------------------------------ pokój */

class Pokoj {
  constructor() {
    this.klient = null;
    this.brokerNr = null;
    this.kod = null;
    this.zamkniety = false;
    this.onWiadomosc = () => {};
    this.onStanLacza = () => {};       // 'lacze' | 'polaczono' | 'zerwane'
    this._ponowienie = null;
    this._probaNr = 0;
  }

  nadaj(wiadomosc) {
    if (this.klient?.zywy) this.klient.opublikuj(this._tematNadawania, JSON.stringify(wiadomosc));
  }

  zamknij() {
    this.zamkniety = true;
    clearTimeout(this._ponowienie);
    this.klient?.rozlacz();
  }

  _podepnij(klient) {
    this.klient = klient;
    klient.onWiadomosc = (_temat, tresc) => {
      let wiadomosc;
      try { wiadomosc = JSON.parse(tresc); } catch { return; }   // cudze śmieci na brokerze
      this.onWiadomosc(wiadomosc);
    };
    klient.onRozlaczenie = () => {
      if (this.zamkniety) return;
      this.onStanLacza('zerwane');
      this._wznow();
    };
    klient.subskrybuj(this._tematOdbioru);
    this._probaNr = 0;
    this.onStanLacza('polaczono');
  }

  /** Po zerwaniu wracamy na ten sam broker — kod pokoju ma zostać ten sam. */
  _wznow() {
    clearTimeout(this._ponowienie);
    const opoznienie = Math.min(1000 * 2 ** this._probaNr, 15000);
    this._probaNr += 1;
    this._ponowienie = setTimeout(async () => {
      if (this.zamkniety) return;
      this.onStanLacza('lacze');
      try {
        const { klient } = await pierwszyDzialajacy([this.brokerNr], this._klientId(), 8000);
        this._podepnij(klient);
      } catch {
        this._wznow();
      }
    }, opoznienie);
  }
}

/* --- strona prowadzącego --- */

export class PokojProwadzacego extends Pokoj {
  constructor() {
    super();
    this._id = `h${Math.random().toString(36).slice(2, 8)}`;
  }

  _klientId() { return this._id; }
  get _tematNadawania() { return tematProwadzacego(this.kod); }
  get _tematOdbioru() { return tematGraczy(this.kod); }

  async otworz(preferowanyBroker = null) {
    this.onStanLacza('lacze');
    const kolejnosc = preferowanyBroker === null
      ? BROKERY.map((_, i) => i)
      : [preferowanyBroker, ...BROKERY.map((_, i) => i).filter((i) => i !== preferowanyBroker)];
    const { klient, brokerNr } = await pierwszyDzialajacy(kolejnosc, this._id, 8000);
    this.brokerNr = brokerNr;
    this.kod = losowyKod();
    this._podepnij(klient);
    return { kod: this.kod, brokerNr, broker: BROKERY[brokerNr].nazwa };
  }
}

/* --- strona gracza --- */

export class PokojGracza extends Pokoj {
  constructor(idGracza) {
    super();
    this.idGracza = idGracza;
    this._id = `g${idGracza.slice(0, 8)}`;
  }

  _klientId() { return this._id; }
  get _tematNadawania() { return tematGraczy(this.kod); }
  get _tematOdbioru() { return tematProwadzacego(this.kod); }

  /**
   * Kod z QR niesie numer brokera i łączy od razu. Kod wklepany ręcznie go nie
   * ma, więc obchodzimy brokery po kolei i pytamy „jest tu pokój ABCD?”.
   */
  async dolacz(kod, ksywka, podpowiedzBrokera = null, naProbe = () => {}) {
    this.kod = kod.trim().toUpperCase();
    this.ksywka = ksywka;
    this.zamkniety = false;
    const kolejnosc = podpowiedzBrokera === null
      ? BROKERY.map((_, i) => i)
      : [podpowiedzBrokera, ...BROKERY.map((_, i) => i).filter((i) => i !== podpowiedzBrokera)];

    const bledy = [];
    for (const nr of kolejnosc) {
      naProbe(BROKERY[nr].nazwa);
      let klient;
      try {
        klient = new KlientMqtt({ adres: BROKERY[nr].adres, klientId: `${this._id}-${nr}` });
        await klient.polacz(8000);
      } catch (blad) {
        bledy.push(`${BROKERY[nr].nazwa}: ${blad.message}`);
        continue;
      }

      const powitanie = await this._zapukaj(klient, ksywka);
      if (powitanie) {
        this.brokerNr = nr;
        this._podepnij(klient);
        return powitanie;
      }
      klient.rozlacz();
      bledy.push(`${BROKERY[nr].nazwa}: nikt nie prowadzi pokoju ${this.kod}`);
    }
    throw new Error(bledy.join('\n'));
  }

  /** Trzy zawołania po sekundzie — pakiet potrafi zginąć, prowadzący nie. */
  _zapukaj(klient, ksywka) {
    return new Promise((spelnij) => {
      let gotowe = false;
      const skoncz = (wynik) => {
        if (gotowe) return;
        gotowe = true;
        clearInterval(powtarzacz);
        clearTimeout(poddanie);
        spelnij(wynik);
      };

      klient.onWiadomosc = (_temat, tresc) => {
        let wiadomosc;
        try { wiadomosc = JSON.parse(tresc); } catch { return; }
        if (wiadomosc.t === 'witaj' && wiadomosc.id === this.idGracza) skoncz(wiadomosc);
        if (wiadomosc.t === 'pelno' && wiadomosc.id === this.idGracza) skoncz({ ...wiadomosc });
      };
      klient.subskrybuj(tematProwadzacego(this.kod));

      const zawolaj = () =>
        klient.opublikuj(tematGraczy(this.kod), JSON.stringify({ t: 'hej', id: this.idGracza, ksywka }));
      setTimeout(zawolaj, 250);                       // chwila na potwierdzenie subskrypcji
      const powtarzacz = setInterval(zawolaj, 1200);
      const poddanie = setTimeout(() => skoncz(null), 4200);
    });
  }

  /** Po zerwaniu łącza wracamy z tym samym „hej” — prowadzący rozpozna nas po
      identyfikatorze urządzenia i odda dotychczasowe punkty. */
  _podepnij(klient) {
    super._podepnij(klient);
    if (this.ksywka) this.nadaj({ t: 'hej', id: this.idGracza, ksywka: this.ksywka });
  }
}
