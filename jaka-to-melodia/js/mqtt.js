/* ==========================================================================
   Mini-klient MQTT 3.1.1 po WebSocket.
   --------------------------------------------------------------------------
   Telefony gadają ze sobą przez publiczny broker MQTT — nie trzeba stawiać
   serwera, wystarczy internet w telefonie. Gotowe biblioteki ważą ponad sto
   kilobajtów i ciągną zależności; nam potrzeba czterech typów pakietów, więc
   są tutaj napisane wprost. Wszystko idzie z QoS 0: gra i tak co chwilę
   nadaje aktualny stan, więc zgubiony pakiet nadrabia się sam.

   Działa tak samo w przeglądarce i w Node 22 (globalne WebSocket), dzięki
   czemu narzedzia/test-polaczenie.mjs sprawdza dokładnie ten sam kod.
   ========================================================================== */

const POLACZ = 0x10;
const POTWIERDZENIE_POLACZENIA = 0x20;
const PUBLIKUJ = 0x30;
const SUBSKRYBUJ = 0x82;
const POTWIERDZENIE_SUBSKRYPCJI = 0x90;
const PING = 0xc0;
const ODPOWIEDZ_PING = 0xd0;
const ROZLACZ = 0xe0;

const koder = new TextEncoder();
const dekoder = new TextDecoder();

/** Długość pozostałej części pakietu — MQTT zapisuje ją po 7 bitów na bajt. */
function zapiszDlugosc(dlugosc) {
  const bajty = [];
  let reszta = dlugosc;
  do {
    let bajt = reszta % 128;
    reszta = Math.floor(reszta / 128);
    if (reszta > 0) bajt |= 128;
    bajty.push(bajt);
  } while (reszta > 0);
  return bajty;
}

function czytajDlugosc(bufor, od) {
  let mnoznik = 1;
  let wartosc = 0;
  let i = od;
  for (let krok = 0; krok < 4; krok += 1) {
    if (i >= bufor.length) return null;          // pakiet jeszcze nie doszedł w całości
    const bajt = bufor[i];
    i += 1;
    wartosc += (bajt & 127) * mnoznik;
    if ((bajt & 128) === 0) return { wartosc, dlugoscPola: i - od };
    mnoznik *= 128;
  }
  throw new Error('Uszkodzona długość pakietu MQTT');
}

/** Napis MQTT: dwa bajty długości i treść w UTF-8. */
function zapiszNapis(tekst) {
  const dane = koder.encode(tekst);
  return [dane.length >> 8, dane.length & 255, ...dane];
}

function zlozPakiet(naglowek, tresc) {
  return Uint8Array.from([naglowek, ...zapiszDlugosc(tresc.length), ...tresc]);
}

export class KlientMqtt {
  /**
   * @param {object} opcje
   * @param {string} opcje.adres        adres wss:// brokera
   * @param {string} [opcje.klientId]   identyfikator sesji u brokera
   * @param {number} [opcje.keepAlive]  co ile sekund wysyłać ping
   */
  constructor({ adres, klientId, keepAlive = 45 }) {
    this.adres = adres;
    this.klientId = klientId || `jtm-${Math.random().toString(36).slice(2, 12)}`;
    this.keepAlive = keepAlive;
    this.gniazdo = null;
    this.bufor = new Uint8Array(0);
    this.nastepnyIdPakietu = 1;
    this.zywy = false;
    this.onWiadomosc = () => {};
    this.onRozlaczenie = () => {};
    this._ping = null;
  }

  /** Łączy się i czeka na CONNACK. Odrzuca obietnicę po `limitMs`. */
  polacz(limitMs = 8000) {
    return new Promise((spelnij, odrzuc) => {
      let zamkniete = false;
      const przerwij = (powod) => {
        if (zamkniete) return;
        zamkniete = true;
        clearTimeout(licznik);
        try { this.gniazdo?.close(); } catch { /* już zamknięte */ }
        odrzuc(new Error(powod));
      };
      const licznik = setTimeout(() => przerwij(`Broker ${this.adres} nie odpowiada`), limitMs);

      let gniazdo;
      try {
        gniazdo = new WebSocket(this.adres, 'mqtt');
      } catch (blad) {
        clearTimeout(licznik);
        odrzuc(blad);
        return;
      }
      gniazdo.binaryType = 'arraybuffer';
      this.gniazdo = gniazdo;

      gniazdo.onopen = () => {
        const tresc = [
          ...zapiszNapis('MQTT'),
          4,                                  // wersja 3.1.1
          0x02,                               // czysta sesja, bez testamentu
          this.keepAlive >> 8, this.keepAlive & 255,
          ...zapiszNapis(this.klientId),
        ];
        gniazdo.send(zlozPakiet(POLACZ, tresc));
      };

      gniazdo.onmessage = (zdarzenie) => {
        this._dolozDoBufora(new Uint8Array(zdarzenie.data));
        this._przetworzBufor((typ, pakiet) => {
          if (typ === POTWIERDZENIE_POLACZENIA) {
            clearTimeout(licznik);
            const kod = pakiet[1];
            if (kod !== 0) { przerwij(`Broker odmówił połączenia (kod ${kod})`); return; }
            if (zamkniete) return;
            zamkniete = true;
            this.zywy = true;
            this._ping = setInterval(() => this._wyslij(zlozPakiet(PING, [])), this.keepAlive * 500);
            spelnij(this);
          } else if (typ === PUBLIKUJ) {
            this._odbierzPublikacje(pakiet);
          }
        });
      };

      gniazdo.onerror = () => przerwij(`Nie udało się połączyć z ${this.adres}`);
      gniazdo.onclose = () => {
        const bylZywy = this.zywy;
        this.zywy = false;
        clearInterval(this._ping);
        if (!zamkniete) przerwij('Połączenie zamknięte przed potwierdzeniem');
        else if (bylZywy) this.onRozlaczenie();
      };
    });
  }

  subskrybuj(temat) {
    const id = this.nastepnyIdPakietu;
    this.nastepnyIdPakietu = (this.nastepnyIdPakietu % 65535) + 1;
    this._wyslij(zlozPakiet(SUBSKRYBUJ, [id >> 8, id & 255, ...zapiszNapis(temat), 0]));
  }

  opublikuj(temat, tresc) {
    const dane = koder.encode(typeof tresc === 'string' ? tresc : JSON.stringify(tresc));
    this._wyslij(zlozPakiet(PUBLIKUJ, [...zapiszNapis(temat), ...dane]));
  }

  rozlacz() {
    clearInterval(this._ping);
    this.zywy = false;
    this.onRozlaczenie = () => {};
    try { this._wyslij(zlozPakiet(ROZLACZ, [])); } catch { /* i tak zamykamy */ }
    try { this.gniazdo?.close(); } catch { /* już zamknięte */ }
  }

  /* ---- środek ---- */

  _wyslij(pakiet) {
    if (this.gniazdo?.readyState === 1) this.gniazdo.send(pakiet);
  }

  _dolozDoBufora(kawalek) {
    const nowy = new Uint8Array(this.bufor.length + kawalek.length);
    nowy.set(this.bufor, 0);
    nowy.set(kawalek, this.bufor.length);
    this.bufor = nowy;
  }

  /**
   * Jedna ramka WebSocket bywa kawałkiem pakietu MQTT albo kilkoma naraz,
   * więc tniemy bufor tak długo, jak leży w nim komplet.
   */
  _przetworzBufor(obsluz) {
    for (;;) {
      if (this.bufor.length < 2) return;
      const dlugosc = czytajDlugosc(this.bufor, 1);
      if (!dlugosc) return;
      const poczatek = 1 + dlugosc.dlugoscPola;
      const koniec = poczatek + dlugosc.wartosc;
      if (this.bufor.length < koniec) return;
      const typ = this.bufor[0] & 0xf0;
      const pakiet = this.bufor.subarray(poczatek, koniec);
      this.bufor = this.bufor.subarray(koniec);
      if (typ === ODPOWIEDZ_PING || typ === POTWIERDZENIE_SUBSKRYPCJI) continue;
      obsluz(typ, pakiet, this.bufor[0]);
    }
  }

  _odbierzPublikacje(pakiet) {
    const dlugoscTematu = (pakiet[0] << 8) | pakiet[1];
    const temat = dekoder.decode(pakiet.subarray(2, 2 + dlugoscTematu));
    // QoS 0 nie niesie identyfikatora pakietu, więc treść zaczyna się od razu.
    const tresc = dekoder.decode(pakiet.subarray(2 + dlugoscTematu));
    this.onWiadomosc(temat, tresc);
  }
}
