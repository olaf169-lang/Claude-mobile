/* ==========================================================================
   Telefon prowadzącego — jedyne miejsce, w którym mieszka stan gry.
   --------------------------------------------------------------------------
   Ekran po ekranie: ustawienia → lobby z kodem QR → (wybór tematu → odliczanie
   → seria pytań z odsłonami → wyniki rundy) × liczba rund → podium.
   Prowadzący puszcza muzykę, liczy punkty i nadaje to, co telefony mają
   pokazać. Nikt inny niczego nie rozstrzyga.

   Stan leci w eter cyklicznie, nie jednorazowo — telefon, który wszedł
   w połowie albo na moment stracił zasięg, dostraja się sam, bez proszenia.
   ========================================================================== */

import {
  $, $$, el, wyczysc, pokazEkran, powiadom, odmiana, stuknij, trzymajEkran, utnijZnaki, formatujCzasS,
  wezelStreaka,
} from './ui.js';
import { KATEGORIE, DEKADY, przygotujKatalog } from './katalog.js';
import {
  USTAWIENIA_DOMYSLNE, CZASY_ODPOWIEDZI, LICZBY_RUND, DLUGOSCI_SERII, MAKS_GRACZY,
  ulozSerie, pulaUtworow, punktyZaOdpowiedz, ranking, wylosujWybierajacego, opiszTemat,
} from './gra.js';
import { PokojProwadzacego, BROKERY, adresDolaczenia } from './siec.js';
import { ZrodloPodgladow } from './podglady.js';
import { Odtwarzacz, DLUGOSC_PODGLADU_MS } from './odtwarzacz.js';
import { swietuj, odblokujDzwiekSwieta } from './swietowanie.js';
import { kodQr } from './qr.js';

const KSZTALTY = ['▲', '◆', '●', '■'];
const ODSTEP_NADAWANIA_MS = 1200;
const ZWLOKA_PO_WSZYSTKICH_MS = 900;      // chwila na „wszyscy odpowiedzieli”
const CZAS_ZNIKNIECIA_MS = 25_000;        // po tylu bez znaku życia gracz szarzeje
const CZAS_WYBRZMIENIA_MS = 4000;         // ile jeszcze gra utwór na ekranie odsłony
const CZAS_ODLICZANIA_MS = 3000;

const KLUCZ_USTAWIEN = 'jtm:ustawienia';

// Prowadzący bywa też graczem. Siedzi wtedy w tej samej mapie co reszta, więc
// punktacja, tabela i podium nie wiedzą, że jest w czymkolwiek wyjątkowy.
// Krzyżyk na początku wyklucza zderzenie z identyfikatorem telefonu, bo te
// składają się wyłącznie z liter i cyfr.
const ID_PROWADZACEGO = '#prowadzacy';

const MEDALE = ['🥇', '🥈', '🥉'];

export function uruchom() {
  const katalog = przygotujKatalog();
  const zrodlo = new ZrodloPodgladow();
  const odtwarzacz = new Odtwarzacz();
  const pokoj = new PokojProwadzacego();

  const stan = {
    ustawienia: wczytajUstawienia(),
    gracze: new Map(),
    seria: [],                 // pytania (utwór + odpowiedzi) na bieżącą rundę
    nrPytania: -1,              // indeks pytania w serii
    nrRundyGry: 0,               // 1-based numer rundy w całej grze
    temat: null,                // { kategorie, dekady } bieżącej rundy
    wybor: null,                 // robocza (jeszcze niezatwierdzona) wersja tematu
    wybierajacy: null,           // id gracza, który wybiera temat (null = prowadzący)
    poprzedniWybierajacy: null,
    probaTematu: 0,               // rośnie przy każdym wylosowaniu — odróżnia powtórkę transmisji od nowej próby
    pominieteId: new Set(),      // utwory, które już padły w tej grze — nie powtarzamy
    faza: 'ustawienia',
    limitMs: 15_000,
    koniecRundy: 0,
    koniecOdliczania: 0,
    odpowiedzi: new Map(),
    ostatniaOdslona: null,
    ostatnieWynikiRundy: null,
    nagranieBiezace: null,   // { url, startS } rozsyłane graczom, gdy „muzykaWszedzie” jest włączona
    blokadaEkranu: null,
    pokazanoRunde: 0,        // od tego momentu liczy się czas odpowiedzi prowadzącego
    opoznienieStartuMs: 0,   // ile trwało, zanim ruszył utwór — patrz statystyki rundy w odslon()
  };

  let tykanie = null;
  let nadawanie = null;
  let wygaszanieId = 0;         // pozwala anulować nieaktualne wygaszanie dźwięku

  /* ------------------------------------------------------------ ustawienia */

  function wczytajUstawienia() {
    let ustawienia = { ...USTAWIENIA_DOMYSLNE };
    try {
      const zapisane = JSON.parse(localStorage.getItem(KLUCZ_USTAWIEN) || 'null');
      if (zapisane) ustawienia = { ...ustawienia, ...zapisane };
      // Ksywkę dzielimy z trybem gracza — kto raz grał na tym telefonie,
      // nie musi jej wpisywać drugi raz.
      ustawienia.ksywkaProwadzacego ||= localStorage.getItem('jtm:ksywka') || '';
    } catch { /* pierwszy raz albo zepsuty wpis */ }
    return ustawienia;
  }

  function zapiszUstawienia() {
    try {
      localStorage.setItem(KLUCZ_USTAWIEN, JSON.stringify(stan.ustawienia));
      if (stan.ustawienia.ksywkaProwadzacego) {
        localStorage.setItem('jtm:ksywka', stan.ustawienia.ksywkaProwadzacego);
      }
    } catch { /* nieistotne */ }
  }

  function znaczek(tekst, wcisniety, przyKliknieciu) {
    return el('button', {
      klasa: 'znaczek', type: 'button', 'aria-pressed': String(wcisniety),
      tekst, naclick: przyKliknieciu,
    });
  }

  /** Wielokrotny wybór, w którym nie da się odznaczyć wszystkiego. */
  function przelacz(lista, wartosc) {
    const bez = lista.filter((x) => x !== wartosc);
    if (bez.length === lista.length) return [...lista, wartosc];
    if (bez.length === 0) {
      powiadom('Zostaw przynajmniej jedną pozycję.');
      return lista;
    }
    return bez;
  }

  function rysujUstawienia() {
    const kategorie = wyczysc($('#wybor-kategorii'));
    for (const kat of KATEGORIE) {
      kategorie.append(znaczek(
        `${kat.emoji} ${kat.nazwa}`,
        stan.ustawienia.kategorie.includes(kat.id),
        () => { stan.ustawienia.kategorie = przelacz(stan.ustawienia.kategorie, kat.id); rysujUstawienia(); },
      ));
    }

    const dekady = wyczysc($('#wybor-dekad'));
    for (const dek of DEKADY) {
      dekady.append(znaczek(
        dek.nazwa,
        stan.ustawienia.dekady.includes(dek.id),
        () => { stan.ustawienia.dekady = przelacz(stan.ustawienia.dekady, dek.id); rysujUstawienia(); },
      ));
    }

    const czasy = wyczysc($('#wybor-czasu'));
    for (const sekundy of CZASY_ODPOWIEDZI) {
      czasy.append(znaczek(
        `${sekundy} s`,
        stan.ustawienia.czasOdpowiedzi === sekundy,
        () => { stan.ustawienia.czasOdpowiedzi = sekundy; rysujUstawienia(); },
      ));
    }

    const seria = wyczysc($('#wybor-serii'));
    for (const ile of DLUGOSCI_SERII) {
      seria.append(znaczek(
        String(ile),
        stan.ustawienia.dlugoscSerii === ile,
        () => { stan.ustawienia.dlugoscSerii = ile; rysujUstawienia(); },
      ));
    }

    const rundy = wyczysc($('#wybor-rund'));
    for (const ile of LICZBY_RUND) {
      rundy.append(znaczek(
        String(ile),
        stan.ustawienia.liczbaRund === ile,
        () => { stan.ustawienia.liczbaRund = ile; rysujUstawienia(); },
      ));
    }

    const ktoWybiera = wyczysc($('#wybor-kto-wybiera'));
    const trybyWyboru = [
      ['losowy', 'Losowy gracz'],
      ['prowadzacy', 'Zawsze ja'],
    ];
    for (const [id, nazwa] of trybyWyboru) {
      ktoWybiera.append(znaczek(nazwa, stan.ustawienia.ktoWybiera === id, () => {
        stan.ustawienia.ktoWybiera = id;
        rysujUstawienia();
      }));
    }

    const pytania = wyczysc($('#wybor-pytan'));
    const rodzaje = [
      ['tytul', 'Tytuł piosenki'],
      ['wykonawca', 'Kto śpiewa'],
      ['mix', 'Raz to, raz to'],
    ];
    for (const [id, nazwa] of rodzaje) {
      pytania.append(znaczek(nazwa, stan.ustawienia.typyPytan === id, () => {
        stan.ustawienia.typyPytan = id;
        rysujUstawienia();
      }));
    }

    $('#opcja-ja-gram').checked = stan.ustawienia.prowadzacyGra;
    $('#ksywka-prowadzacego').value = stan.ustawienia.ksywkaProwadzacego;
    $('#pole-ksywki-prowadzacego').hidden = !stan.ustawienia.prowadzacyGra;
    $('#opcja-dzwiek').checked = stan.ustawienia.dzwiekWAplikacji;
    $('#opcja-muzyka-wszedzie').checked = stan.ustawienia.muzykaWszedzie;
    $('#pole-muzyka-wszedzie').hidden = !stan.ustawienia.dzwiekWAplikacji;
    $('#opcja-fragment').checked = stan.ustawienia.losowyFragment;
    $('#opcja-seria').checked = stan.ustawienia.bonusSerii;

    odswiezLicznikPuli();
    zapiszUstawienia();
  }

  /**
   * Do losowania biorą się tylko utwory, które mają czym zabrzmieć — ale
   * dopiero wtedy, gdy plik z podglądami rzeczywiście coś zawiera. Inaczej
   * (np. przy pierwszym uruchomieniu) pula zostaje pełna, a brakujące
   * nagrania aplikacja doszuka w locie.
   */
  function opcjePuli() {
    const wartoFiltrowac = stan.ustawienia.dzwiekWAplikacji && zrodlo.gotowe.size >= 40;
    return { katalog, maPodglad: wartoFiltrowac ? (u) => zrodlo.maPodglad(u) : null };
  }

  function odswiezLicznikPuli() {
    const ile = pulaUtworow(stan.ustawienia, opcjePuli()).length;
    const licznik = $('#licznik-puli');
    const potrzeba = stan.ustawienia.dlugoscSerii;
    const zaMalo = ile < potrzeba;
    licznik.dataset.alarm = zaMalo ? 'tak' : 'nie';
    licznik.innerHTML = zaMalo
      ? `Do wyboru <strong>${ile}</strong> ${odmiana(ile, 'utwór', 'utwory', 'utworów')} — mniej niż piosenek w serii. Runda skróci się sama albo dorzuć kategorię.`
      : `Do wyboru <strong>${ile}</strong> ${odmiana(ile, 'utwór', 'utwory', 'utworów')}.`;
    $('#otworz-pokoj').disabled = ile === 0;
  }

  $('#opcja-ja-gram').addEventListener('change', (z) => {
    stan.ustawienia.prowadzacyGra = z.target.checked;
    $('#pole-ksywki-prowadzacego').hidden = !z.target.checked;
    zsynchronizujProwadzacego();
    zapiszUstawienia();
  });

  $('#ksywka-prowadzacego').addEventListener('input', (z) => {
    stan.ustawienia.ksywkaProwadzacego = utnijZnaki(z.target.value, 14);
    zsynchronizujProwadzacego();
    zapiszUstawienia();
  });

  /**
   * Dopisuje prowadzącego do stawki albo go z niej wyjmuje. Wołane przy każdej
   * zmianie ustawienia i przy otwieraniu pokoju, żeby lista graczy zawsze
   * zgadzała się z tym, co widać na ekranie.
   */
  function zsynchronizujProwadzacego() {
    const gra = stan.ustawienia.prowadzacyGra;
    const ksywka = utnijZnaki((stan.ustawienia.ksywkaProwadzacego || '').trim(), 14) || 'Ja';
    const wpis = stan.gracze.get(ID_PROWADZACEGO);

    if (!gra) {
      stan.gracze.delete(ID_PROWADZACEGO);
    } else if (wpis) {
      wpis.ksywka = ksywka;
      wpis.widziany = Date.now();
    } else {
      stan.gracze.set(ID_PROWADZACEGO, {
        id: ID_PROWADZACEGO, ksywka, punkty: 0, trafienia: 0, seria: 0,
        trafieniaRunda: 0, sumaCzasuTrafienRundaMs: 0, seriaMaxRunda: 0, widziany: Date.now(),
      });
    }
    if (stan.faza === 'lobby') { rysujLobby(); nadajStan(); }
  }

  for (const [pole, klucz] of [
    ['#opcja-dzwiek', 'dzwiekWAplikacji'], ['#opcja-muzyka-wszedzie', 'muzykaWszedzie'],
    ['#opcja-fragment', 'losowyFragment'], ['#opcja-seria', 'bonusSerii'],
  ]) {
    $(pole).addEventListener('change', (z) => {
      stan.ustawienia[klucz] = z.target.checked;
      if (pole === '#opcja-dzwiek') $('#pole-muzyka-wszedzie').hidden = !z.target.checked;
      odswiezLicznikPuli();
      zapiszUstawienia();
    });
  }

  /* ----------------------------------------------------------------- lobby */

  async function otworzPokoj() {
    const przycisk = $('#otworz-pokoj');
    przycisk.disabled = true;
    przycisk.textContent = 'Otwieram…';
    try {
      const { kod, brokerNr, broker } = await pokoj.otworz();
      $('#kod-pokoju').textContent = kod;
      const adres = adresDolaczenia(kod, brokerNr);
      // Pełny link (z kodem i numerem brokera) siedzi w QR. Na ekranie zostaje
      // sam adres strony — tyle, ile ktoś realnie przepisze do przeglądarki.
      const krotki = `${location.host}${location.pathname}`.replace(/\/$/, '/');
      $('#adres-pokoju').textContent = `albo wejdź na ${krotki} i wpisz kod`;
      const miejsceQr = wyczysc($('#qr'));
      miejsceQr.append(kodQr(adres));
      $('#pojemnosc').textContent = `miejsc: ${MAKS_GRACZY} · łącze: ${broker}`;
      zsynchronizujProwadzacego();
      stan.faza = 'lobby';
      pokazEkran('lobby');
      rysujLobby();
      wlaczNadawanie();
    } catch (blad) {
      powiadom(blad.message.split('\n')[0] || 'Nie udało się otworzyć pokoju.', 'blad');
    } finally {
      przycisk.disabled = false;
      przycisk.textContent = 'Otwórz pokój';
    }
  }

  function rysujLobby() {
    const lista = wyczysc($('#lista-graczy'));
    const gracze = [...stan.gracze.values()];
    for (const gracz of gracze) {
      const toJa = gracz.id === ID_PROWADZACEGO;
      lista.append(el('li', {
        klasa: 'gracz',
        'data-znikl': !toJa && Date.now() - gracz.widziany > CZAS_ZNIKNIECIA_MS ? 'tak' : 'nie',
      }, [el('span', { klasa: 'kropka' }), toJa ? `${gracz.ksywka} (ty)` : gracz.ksywka]));
    }
    $('#liczba-graczy').textContent = String(gracze.length);
    $('#lobby-pusto').hidden = gracze.length > 0;
    // Wystarczy jedna osoba w stawce — prowadzący, który gra, jest jedną z nich.
    $('#zacznij-gre').disabled = gracze.length === 0;
  }

  /* ------------------------------------------------------------ nadawanie */

  function wlaczNadawanie() {
    clearInterval(nadawanie);
    nadawanie = setInterval(nadajStan, ODSTEP_NADAWANIA_MS);
    nadajStan();
  }

  function nadajStan() {
    if (stan.faza === 'lobby') {
      pokoj.nadaj({
        t: 'lobby',
        kod: pokoj.kod,
        gracze: [...stan.gracze.values()].map((g) => ({ id: g.id, ksywka: g.ksywka })),
      });
      rysujLobby();
    } else if (stan.faza === 'wybor-tematu') {
      const sterujeProwadzacy = stan.ustawienia.ktoWybiera === 'prowadzacy';
      pokoj.nadaj({
        t: 'wybor',
        nrRundyGry: stan.nrRundyGry,
        ileRund: stan.ustawienia.liczbaRund,
        wybierajacy: sterujeProwadzacy ? null : stan.wybierajacy,
        ksywka: stan.wybierajacy ? stan.gracze.get(stan.wybierajacy)?.ksywka || null : null,
        sterujeProwadzacy,
        probaTematu: stan.probaTematu,
        // Telefon wylosowanego gracza rysuje panel wyboru z tych gotowych opisów —
        // sam nie musi znać katalogu ani stałych KATEGORIE/DEKADY. Idziemy po
        // kanonicznej kolejności tych stałych (nie po stan.ustawienia.kategorie/
        // dekady) — inaczej kolejność zależałaby od tego, w jakiej kolejności
        // ktoś klikał kategorie w Ustawieniach, a dekady wychodziłyby pomieszane.
        kategorieDostepne: KATEGORIE
          .filter((k) => stan.ustawienia.kategorie.includes(k.id))
          .map((k) => ({ id: k.id, nazwa: k.nazwa, emoji: k.emoji })),
        dekadyDostepne: DEKADY
          .filter((d) => stan.ustawienia.dekady.includes(d.id))
          .map((d) => ({ id: d.id, nazwa: d.nazwa })),
        dlugoscSerii: stan.ustawienia.dlugoscSerii,
      });
    } else if (stan.faza === 'odliczanie') {
      pokoj.nadaj({
        t: 'odliczanie',
        nrRundyGry: stan.nrRundyGry,
        ileRund: stan.ustawienia.liczbaRund,
        temat: opiszTemat(stan.temat),
        pozostaloMs: Math.max(0, stan.koniecOdliczania - performance.now()),
      });
    } else if (stan.faza === 'runda') {
      const pytanie = stan.seria[stan.nrPytania];
      pokoj.nadaj({
        t: 'runda',
        nr: stan.nrPytania,
        ile: stan.seria.length,
        nrRundyGry: stan.nrRundyGry,
        ileRund: stan.ustawienia.liczbaRund,
        pytanie: pytanie.pytanie,
        odpowiedzi: pytanie.odpowiedzi,
        limitMs: stan.limitMs,
        pozostaloMs: Math.max(0, stan.koniecRundy - performance.now()),
        ilu: stan.odpowiedzi.size,
        zGrajacych: stan.gracze.size,
        // Adres nagrania jedzie do graczy tylko, gdy prowadzący włączył granie
        // „wszędzie” — inaczej telefony graczy nigdy nie dostają tego pola
        // i zachowują się dokładnie tak jak wcześniej.
        nagranie: stan.ustawienia.muzykaWszedzie ? stan.nagranieBiezace : null,
      });
    } else if (stan.faza === 'odslona' && stan.ostatniaOdslona) {
      pokoj.nadaj(stan.ostatniaOdslona);
    } else if (stan.faza === 'wyniki-rundy' && stan.ostatnieWynikiRundy) {
      pokoj.nadaj(stan.ostatnieWynikiRundy);
    } else if (stan.faza === 'koniec') {
      pokoj.nadaj({ t: 'koniec', ranking: ranking(stan.gracze).map(lekkiWpis) });
    }
  }

  const lekkiWpis = (g) => ({ id: g.id, ksywka: g.ksywka, punkty: g.punkty, miejsce: g.miejsce });

  /** Jak lekkiWpis, ale z dorzuconymi statystykami tej jednej rundy — na
      użytek ekranu wyników rundy (u gracza liczy je host, nie on sam). */
  const lekkiWpisRundy = (g) => ({
    ...lekkiWpis(g),
    trafienRundy: g.trafieniaRunda,
    sredniCzasRundyMs: g.trafieniaRunda ? Math.round(g.sumaCzasuTrafienRundaMs / g.trafieniaRunda) : null,
    streakMax: g.seriaMaxRunda,
  });

  /* ----------------------------------------------- wiadomości od telefonów */

  pokoj.onStanLacza = (jak) => {
    const znacznik = $('#stan-lacza');
    znacznik.hidden = false;
    znacznik.dataset.stan = jak;
    znacznik.textContent = { lacze: 'łączę…', polaczono: 'w sieci', zerwane: 'brak łącza' }[jak] || jak;
  };

  pokoj.onWiadomosc = (wiadomosc) => {
    if (wiadomosc.t === 'hej') przyjmijGracza(wiadomosc);
    else if (wiadomosc.t === 'odp') przyjmijOdpowiedz(wiadomosc);
    else if (wiadomosc.t === 'temat') przyjmijTemat(wiadomosc);
    else if (wiadomosc.t === 'puk') {
      const gracz = stan.gracze.get(wiadomosc.id);
      if (gracz) gracz.widziany = Date.now();
    }
  };

  function przyjmijGracza({ id, ksywka }) {
    const czysta = utnijZnaki(String(ksywka || '').trim(), 14) || 'Ktoś';
    if (id === ID_PROWADZACEGO) return;        // to miejsce jest zajęte lokalnie
    let gracz = stan.gracze.get(id);

    if (!gracz) {
      if (stan.gracze.size >= MAKS_GRACZY) {
        pokoj.nadaj({ t: 'pelno', id, powod: `Komplet — ${MAKS_GRACZY} telefonów to maksimum.` });
        return;
      }
      gracz = {
        id, ksywka: czysta, punkty: 0, trafienia: 0, seria: 0,
        trafieniaRunda: 0, sumaCzasuTrafienRundaMs: 0, seriaMaxRunda: 0, widziany: Date.now(),
      };
      stan.gracze.set(id, gracz);
      if (stan.faza !== 'lobby') powiadom(`${czysta} dołącza w trakcie.`);
    } else {
      gracz.ksywka = czysta;
      gracz.widziany = Date.now();
    }

    // muzykaWszedzie jedzie tu, żeby telefon gracza wiedział od razu po dołączeniu,
    // czy w ogóle warto „rozgrzewać” swój odtwarzacz — a nie robił tego na ślepo
    // przy każdym dołączeniu, bo samo odtworzenie czegokolwiek (nawet ciszy) na
    // iPhonie zwykle ucina muzykę graną w tle w innej aplikacji.
    pokoj.nadaj({
      t: 'witaj', id, ksywka: gracz.ksywka, punkty: gracz.punkty, faza: stan.faza,
      muzykaWszedzie: stan.ustawienia.dzwiekWAplikacji && stan.ustawienia.muzykaWszedzie,
    });
    if (stan.faza === 'lobby') { rysujLobby(); nadajStan(); }
  }

  function przyjmijOdpowiedz({ id, nr, wybor, czasMs }) {
    if (stan.faza !== 'runda' || nr !== stan.nrPytania) return;
    const gracz = stan.gracze.get(id);
    if (!gracz || stan.odpowiedzi.has(id)) return;
    gracz.widziany = Date.now();

    stan.odpowiedzi.set(id, {
      wybor: Number(wybor),
      czasMs: Math.min(Math.max(0, Number(czasMs) || 0), stan.limitMs),
    });
    $('#ilu-odpowiedzialo').textContent = `${stan.odpowiedzi.size} z ${stan.gracze.size}`;

    // Wszyscy kliknęli — nie ma na co czekać, ale zostawiamy chwilę na
    // odpowiedź, która właśnie leci przez sieć.
    if (stan.odpowiedzi.size >= stan.gracze.size) {
      const zostalo = stan.koniecRundy - performance.now();
      if (zostalo > ZWLOKA_PO_WSZYSTKICH_MS) stan.koniecRundy = performance.now() + ZWLOKA_PO_WSZYSTKICH_MS;
    }
  }

  /** Temat rundy przychodzi tylko od tego, kto akurat został wylosowany. */
  function przyjmijTemat({ id, kategorie, dekady }) {
    if (stan.faza !== 'wybor-tematu' || id !== stan.wybierajacy) return;
    if (!Array.isArray(kategorie) || !kategorie.length || !Array.isArray(dekady) || !dekady.length) return;
    zacznijRunde({
      kategorie: kategorie.filter((k) => stan.ustawienia.kategorie.includes(k)),
      dekady: dekady.filter((d) => stan.ustawienia.dekady.includes(d)),
    });
  }

  /* ------------------------------------------------------------------- gra */

  async function zacznijGre() {
    // Pierwsze odtworzenie musi wyjść z dotknięcia ekranu — jesteśmy właśnie
    // w obsłudze kliknięcia, więc to jedyny dobry moment na rozgrzewkę.
    if (stan.ustawienia.dzwiekWAplikacji) await odtwarzacz.rozgrzej();
    odblokujDzwiekSwieta(); // ta sama okazja, na wypadek konfetti na koniec gry

    for (const gracz of stan.gracze.values()) {
      gracz.punkty = 0; gracz.trafienia = 0; gracz.seria = 0;
      gracz.trafieniaRunda = 0; gracz.sumaCzasuTrafienRundaMs = 0; gracz.seriaMaxRunda = 0;
    }
    stan.pominieteId = new Set();
    stan.nrRundyGry = 0;
    stan.poprzedniWybierajacy = null;
    stan.blokadaEkranu ??= await trzymajEkran();
    nastepnaRundaGry();
  }

  function nastepnaRundaGry() {
    stan.nrRundyGry += 1;
    if (stan.nrRundyGry > stan.ustawienia.liczbaRund) { zakonczGre(); return; }
    wylosujTemat();
  }

  /* ------------------------------------------------------------ wybór tematu */

  function wylosujTemat() {
    clearInterval(tykanie);
    stan.faza = 'wybor-tematu';
    stan.temat = null;
    stan.probaTematu += 1;
    const sterujeProwadzacy = stan.ustawienia.ktoWybiera === 'prowadzacy';
    stan.wybierajacy = sterujeProwadzacy
      ? null
      : wylosujWybierajacego([...stan.gracze.keys()], stan.poprzedniWybierajacy, Math.random);
    if (stan.wybierajacy) stan.poprzedniWybierajacy = stan.wybierajacy;

    const jaSteruje = sterujeProwadzacy || stan.wybierajacy === ID_PROWADZACEGO;

    $('#nagrodek-tematu').textContent = `Runda ${stan.nrRundyGry}/${stan.ustawienia.liczbaRund}`;
    $('#czekanie-na-wybor').hidden = jaSteruje;
    $('#panel-wyboru-tematu').hidden = !jaSteruje;

    if (jaSteruje) {
      $('#wybor-tematu-tytul').textContent = 'Wybierz temat rundy';
      stan.wybor = { kategorie: [...stan.ustawienia.kategorie], dekady: [...stan.ustawienia.dekady] };
      rysujWyborTematu();
    } else {
      $('#wybor-tematu-tytul').textContent = 'Kto wybiera temat?';
      const gracz = stan.gracze.get(stan.wybierajacy);
      $('#czekanie-na-wybor-opis').textContent = gracz
        ? `Temat rundy wybiera: ${gracz.ksywka}`
        : 'Losujemy, kto wybierze temat…';
    }

    pokazEkran('wybor-tematu');
    nadajStan();
  }

  function rysujWyborTematu() {
    // Kanoniczna kolejność KATEGORIE/DEKADY, nie stan.ustawienia.kategorie/dekady —
    // ta druga zależy od tego, w jakiej kolejności ktoś klikał w Ustawieniach.
    const kategorie = wyczysc($('#wybor-tematu-kategorii'));
    for (const kat of KATEGORIE) {
      if (!stan.ustawienia.kategorie.includes(kat.id)) continue;
      const id = kat.id;
      kategorie.append(znaczek(`${kat.emoji} ${kat.nazwa}`, stan.wybor.kategorie.includes(id), () => {
        stan.wybor.kategorie = przelacz(stan.wybor.kategorie, id);
        rysujWyborTematu();
      }));
    }

    const dekady = wyczysc($('#wybor-tematu-dekad'));
    for (const dek of DEKADY) {
      if (!stan.ustawienia.dekady.includes(dek.id)) continue;
      const id = dek.id;
      dekady.append(znaczek(dek.nazwa, stan.wybor.dekady.includes(id), () => {
        stan.wybor.dekady = przelacz(stan.wybor.dekady, id);
        rysujWyborTematu();
      }));
    }

    const ile = pulaUtworow(stan.wybor, opcjePuli()).length;
    const licznik = $('#licznik-tematu');
    const zaMalo = ile < stan.ustawienia.dlugoscSerii;
    licznik.dataset.alarm = zaMalo ? 'tak' : 'nie';
    licznik.innerHTML = `Do wyboru <strong>${ile}</strong> ${odmiana(ile, 'utwór', 'utwory', 'utworów')}.`;
    $('#zacznij-runde').disabled = ile === 0;
  }

  $('#temat-wszystko').addEventListener('click', () => {
    stan.wybor = { kategorie: [...stan.ustawienia.kategorie], dekady: [...stan.ustawienia.dekady] };
    rysujWyborTematu();
  });
  $('#zacznij-runde').addEventListener('click', () => zacznijRunde(stan.wybor));

  /* -------------------------------------------------------------- odliczanie */

  function zacznijRunde(temat) {
    stan.temat = temat;
    const ustawieniaRundy = { ...stan.ustawienia, kategorie: temat.kategorie, dekady: temat.dekady };
    const ziarnoBazowe = Number(new URLSearchParams(location.search).get('ziarno')) || undefined;
    stan.seria = ulozSerie(ustawieniaRundy, {
      ...opcjePuli(),
      ziarno: ziarnoBazowe ? ziarnoBazowe + stan.nrRundyGry : undefined,
      pomin: stan.pominieteId,
    });

    if (!stan.seria.length) {
      powiadom('Z tego tematu nie da się ułożyć żadnej piosenki — wybierzcie coś innego.', 'blad');
      wylosujTemat();
      return;
    }
    if (stan.seria.length < ustawieniaRundy.dlugoscSerii) {
      powiadom(`Starczyło na ${stan.seria.length} ${odmiana(stan.seria.length, 'piosenkę', 'piosenki', 'piosenek')}.`);
    }
    for (const pytanie of stan.seria) stan.pominieteId.add(pytanie.utwor.id);

    // Statystyki „ile trafień w tej rundzie” liczą się od zera przy każdej
    // rundzie — inaczej od drugiej rundy ułamek nigdy by się nie zamknął.
    for (const gracz of stan.gracze.values()) {
      gracz.trafieniaRunda = 0;
      gracz.sumaCzasuTrafienRundaMs = 0;
      gracz.seriaMaxRunda = 0;
    }

    stan.nrPytania = -1;
    stan.limitMs = stan.ustawienia.czasOdpowiedzi * 1000;
    stan.faza = 'odliczanie';
    stan.koniecOdliczania = performance.now() + CZAS_ODLICZANIA_MS;

    $('#temat-rundy-opis').textContent = opiszTemat(stan.temat);
    pokazEkran('odliczanie');

    // Pierwszy utwór doczytuje się w tle, w te same trzy sekundy odliczania.
    if (stan.ustawienia.dzwiekWAplikacji) {
      zrodlo.znajdz(stan.seria[0].utwor).then((wpis) => {
        if (wpis?.podglad) odtwarzacz.przygotuj(wpis.podglad);
      });
    }

    wlaczOdliczanie();
    nadajStan();
  }

  function wlaczOdliczanie() {
    clearInterval(tykanie);
    let poprzedniaLiczba = null;
    const tyknij = () => {
      const zostalo = Math.max(0, stan.koniecOdliczania - performance.now());
      const liczba = Math.ceil(zostalo / 1000);
      if (liczba !== poprzedniaLiczba && liczba > 0) {
        poprzedniaLiczba = liczba;
        const wezel = $('#odliczanie-liczba');
        wezel.textContent = String(liczba);
        // Odtwarzamy animację od nowa przy każdej cyfrze.
        wezel.style.animation = 'none';
        void wezel.offsetWidth;
        wezel.style.animation = '';
      }
      if (zostalo <= 0) { clearInterval(tykanie); nastepnePytanie(); return; }
      nadajStan();
    };
    tyknij();
    tykanie = setInterval(tyknij, 100);
  }

  /* ------------------------------------------------------------------ pytanie */

  async function nastepnePytanie() {
    clearInterval(tykanie);
    wygaszanieId += 1;      // unieważnia odroczone wygaszenie z poprzedniej odsłony
    stan.nrPytania += 1;
    if (stan.nrPytania >= stan.seria.length) { zakonczRunde(); return; }

    const pytanie = stan.seria[stan.nrPytania];
    stan.odpowiedzi.clear();
    stan.faza = 'runda';
    stan.ostatniaOdslona = null;
    stan.nagranieBiezace = null;

    $('#numer-rundy').textContent =
      `Runda ${stan.nrRundyGry}/${stan.ustawienia.liczbaRund} · piosenka ${stan.nrPytania + 1}/${stan.seria.length}`;
    $('#ilu-odpowiedzialo').textContent = `0 z ${stan.gracze.size}`;
    $('#pytanie-hosta').textContent = pytanie.pytanie;
    rysujOdpowiedziHosta(pytanie);
    $('#uwaga-dzwieku').textContent = stan.ustawienia.dzwiekWAplikacji ? '' : 'Puść fragment ze swojego źródła.';
    $('#potwierdzenie-hosta').hidden = true;
    pokazEkran('runda');
    stan.pokazanoRunde = performance.now();

    if (stan.ustawienia.dzwiekWAplikacji) await puscUtwor(pytanie.utwor);
    // Ile czasu minęło od pokazania pytania do faktycznego ruszenia utworu —
    // wyszukanie adresu podglądu chwilę trwa. Statystyki „czas odgadnięcia”
    // (patrz odslon()) odejmują to opóźnienie, żeby liczyć od muzyki, nie
    // od samego pojawienia się pytania na ekranie.
    stan.opoznienieStartuMs = Math.max(0, performance.now() - stan.pokazanoRunde);

    stan.koniecRundy = performance.now() + stan.limitMs;
    wlaczZegar();
    nadajStan();
    przygotujNastepny();
  }

  function rysujOdpowiedziHosta(pytanie) {
    const miejsce = wyczysc($('#odpowiedzi-hosta'));
    const gram = stan.ustawienia.prowadzacyGra;
    // Ta sama siatka służy za tablicę dla pokoju i za brzęczyk prowadzącego —
    // klikalna tylko wtedy, gdy prowadzący jest też w stawce.
    miejsce.classList.toggle('grywalne', gram);
    pytanie.odpowiedzi.forEach((tresc, nr) => {
      const dzieci = [
        el('span', { klasa: 'ksztalt', 'aria-hidden': 'true', tekst: KSZTALTY[nr] }),
        el('span', { klasa: 'tresc', tekst: tresc }),
      ];
      miejsce.append(gram
        ? el('button', { klasa: 'odp', type: 'button', 'data-kolor': nr, 'data-nr': nr,
            naclick: () => odpowiedzProwadzacego(nr) }, dzieci)
        : el('div', { klasa: 'odp', 'data-kolor': nr, 'data-nr': nr }, dzieci));
    });
  }

  /** Prowadzący klika u siebie; czas liczy się od pokazania pytania na tym ekranie. */
  function odpowiedzProwadzacego(nr) {
    if (stan.faza !== 'runda' || !stan.ustawienia.prowadzacyGra) return;
    if (stan.odpowiedzi.has(ID_PROWADZACEGO)) return;

    const czasMs = Math.round(performance.now() - stan.pokazanoRunde);
    przyjmijOdpowiedz({ id: ID_PROWADZACEGO, nr: stan.nrPytania, wybor: nr, czasMs });
    stuknij([12, 40, 12]);

    for (const kafelek of $('#odpowiedzi-hosta').children) {
      const jego = Number(kafelek.dataset.nr);
      kafelek.dataset.wybrana = jego === nr ? 'tak' : 'nie';
      if (jego !== nr) kafelek.dataset.stan = 'przygasla';
      kafelek.disabled = true;
    }
    $('#potwierdzenie-hosta').textContent = `Zapisane po ${formatujCzasS(czasMs)}.`;
    $('#potwierdzenie-hosta').hidden = false;
  }

  /** Losowy moment startu w obrębie podglądu — liczony raz, tu, żeby dało się
      rozesłać graczom dokładnie tę samą wartość (patrz odtwarzacz.js). */
  function wylosujStartS() {
    if (!stan.ustawienia.losowyFragment) return 0;
    const zapas = Math.max(0, DLUGOSC_PODGLADU_MS - Math.max(stan.limitMs, 8000));
    return (Math.random() * zapas) / 1000;
  }

  async function puscUtwor(utwor) {
    const wpis = await zrodlo.znajdz(utwor);
    if (!wpis?.podglad) {
      $('#uwaga-dzwieku').textContent = 'Nie znalazłem nagrania — puść ten kawałek sam albo pomiń rundę.';
      return;
    }
    const startS = wylosujStartS();
    // Adres rozsyłamy graczom od razu, jak tylko go znajdziemy — niezależnie od
    // tego, czy odtwarzanie akurat wyjdzie na TYM konkretnym telefonie (różne
    // przeglądarki różnie traktują autoodtwarzanie). Telefony graczy i tak
    // próbują same, u siebie.
    stan.nagranieBiezace = { url: wpis.podglad, startS };
    const zagrane = await odtwarzacz.zagraj(wpis.podglad, { startS, dlugoscMs: stan.limitMs });
    if (!zagrane) {
      // Adres mógł wygasnąć (tak bywa z Deezerem) — pytamy o świeży i próbujemy raz.
      const swiezy = await zrodlo.odswiez(utwor);
      if (swiezy?.podglad) {
        stan.nagranieBiezace = { url: swiezy.podglad, startS };
        const zagraneSwiezy = await odtwarzacz.zagraj(swiezy.podglad, { startS, dlugoscMs: stan.limitMs });
        if (!zagraneSwiezy) $('#uwaga-dzwieku').textContent = 'Nagranie nie chce zagrać — puść je sam albo pomiń rundę.';
      } else {
        $('#uwaga-dzwieku').textContent = 'Nagranie nie chce zagrać — puść je sam albo pomiń rundę.';
      }
    }
  }

  /** Kolejny utwór doczytuje się w tle, żeby następne pytanie ruszyło bez ciszy. */
  function przygotujNastepny() {
    const nastepne = stan.seria[stan.nrPytania + 1];
    if (!nastepne || !stan.ustawienia.dzwiekWAplikacji) return;
    zrodlo.znajdz(nastepne.utwor).then((wpis) => {
      if (wpis?.podglad) odtwarzacz.przygotuj(wpis.podglad);
    });
  }

  function wlaczZegar() {
    clearInterval(tykanie);
    const wskaz = $('#zegar-wskaz');
    const obwod = 2 * Math.PI * 52;
    wskaz.style.strokeDasharray = String(obwod);

    const tyknij = () => {
      const zostalo = Math.max(0, stan.koniecRundy - performance.now());
      const udzial = zostalo / stan.limitMs;
      wskaz.style.strokeDashoffset = String(obwod * (1 - udzial));
      $('#zegar-liczba').textContent = String(Math.ceil(zostalo / 1000));
      $('.zegar').dataset.koniec = udzial > 0.34 ? 'daleko' : udzial > 0.14 ? 'blisko' : 'juz';
      if (zostalo <= 0) odslon();
    };
    tyknij();
    tykanie = setInterval(tyknij, 100);
  }

  /* --------------------------------------------------------------- odsłona */

  function odslon() {
    if (stan.faza !== 'runda') return;
    clearInterval(tykanie);
    stan.faza = 'odslona';

    const pytanie = stan.seria[stan.nrPytania];
    const wyniki = {};

    for (const gracz of stan.gracze.values()) {
      const odpowiedz = stan.odpowiedzi.get(gracz.id);
      const trafil = odpowiedz?.wybor === pytanie.poprawna;
      gracz.seria = trafil ? gracz.seria + 1 : 0;
      gracz.seriaMaxRunda = Math.max(gracz.seriaMaxRunda, gracz.seria);
      const punkty = punktyZaOdpowiedz({
        poprawna: trafil,
        czasMs: odpowiedz?.czasMs ?? stan.limitMs,
        limitMs: stan.limitMs,
        seria: gracz.seria,
        bonusSerii: stan.ustawienia.bonusSerii,
      });
      gracz.punkty += punkty;
      if (trafil) {
        gracz.trafienia += 1;
        gracz.trafieniaRunda += 1;
        const czasOdUtworuMs = Math.max(0, (odpowiedz?.czasMs ?? 0) - (stan.opoznienieStartuMs || 0));
        gracz.sumaCzasuTrafienRundaMs += czasOdUtworuMs;
      }
      wyniki[gracz.id] = { punkty, razem: gracz.punkty, trafil, odpowiedzial: Boolean(odpowiedz) };
    }

    const tabela = ranking(stan.gracze);
    for (const wpis of tabela) {
      if (wyniki[wpis.id]) wyniki[wpis.id].miejsce = wpis.miejsce;
    }

    const dekadaInfo = DEKADY.find((d) => d.id === pytanie.utwor.dekada);
    const kategoriaInfo = KATEGORIE.find((k) => k.id === pytanie.utwor.gatunek);
    const wpisPodgladu = zrodlo.zPamieci(pytanie.utwor);
    stan.ostatniaOdslona = {
      t: 'odslona',
      nr: stan.nrPytania,
      nrRundyGry: stan.nrRundyGry,
      poprawna: pytanie.poprawna,
      tytul: pytanie.utwor.tytul,
      wykonawca: pytanie.utwor.wykonawca,
      rok: pytanie.utwor.rok,
      // Tylko przy pytaniu o film: prawidłowa odpowiedź to nazwa filmu, nie
      // tytuł ani wykonawca (te dwa lecą jako podpis, patrz rysujOdslone).
      film: pytanie.typ === 'film' ? pytanie.utwor.film : null,
      kategoria: kategoriaInfo ? { emoji: kategoriaInfo.emoji, nazwa: kategoriaInfo.nazwa } : null,
      dekada: dekadaInfo ? dekadaInfo.nazwa : null,
      okladka: wpisPodgladu?.okladka || null,
      wyniki,
      ranking: tabela.slice(0, 5).map(lekkiWpis),
      ostatniePytanieRundy: stan.nrPytania + 1 >= stan.seria.length,
    };

    // Utwór gra dalej na ekranie odsłony jeszcze przez chwilę, dopiero potem
    // milknie — chyba że ktoś zdąży kliknąć dalej wcześniej (patrz niżej).
    wygaszanieId += 1;
    const mojeWygaszanie = wygaszanieId;
    setTimeout(() => {
      if (mojeWygaszanie === wygaszanieId) odtwarzacz.zatrzymaj();
    }, CZAS_WYBRZMIENIA_MS);

    nadajStan();
    rysujOdslone(pytanie, tabela, wpisPodgladu);
    pokazEkran('odslona');
  }

  function rysujOdslone(pytanie, tabela, wpisPodgladu) {
    const okladka = $('#okladka');
    if (wpisPodgladu?.okladka) {
      okladka.src = wpisPodgladu.okladka;
      okladka.alt = `Okładka: ${pytanie.utwor.tytul}`;
      okladka.hidden = false;
    } else {
      okladka.hidden = true;
    }

    if (pytanie.typ === 'film') {
      $('#odsloniety-tytul').textContent = pytanie.utwor.film;
      $('#odsloniety-wykonawca').textContent = `${pytanie.utwor.tytul} — ${pytanie.utwor.wykonawca}`;
    } else {
      $('#odsloniety-tytul').textContent = pytanie.utwor.tytul;
      $('#odsloniety-wykonawca').textContent = `${pytanie.utwor.wykonawca} · ${pytanie.utwor.rok}`;
    }
    rysujZnacznikiUtworu($('#znaczniki-utworu'), stan.ostatniaOdslona);

    for (const kafelek of $$('#odpowiedzi-hosta .odp')) {
      const nr = Number(kafelek.dataset.nr);
      kafelek.dataset.stan = nr === pytanie.poprawna ? 'poprawna' : 'przygasla';
    }

    const trafili = wyczysc($('#trafili'));
    const zPunktami = tabela
      .filter((g) => stan.ostatniaOdslona.wyniki[g.id]?.trafil)
      .sort((a, b) => stan.ostatniaOdslona.wyniki[b.id].punkty - stan.ostatniaOdslona.wyniki[a.id].punkty);

    if (zPunktami.length) {
      for (const gracz of zPunktami) {
        trafili.append(el('span', { klasa: 'trafil' }, [
          gracz.ksywka, el('b', { tekst: `+${stan.ostatniaOdslona.wyniki[gracz.id].punkty}` }),
        ]));
      }
    } else {
      trafili.append(el('p', { klasa: 'nikt-nie-trafil', tekst: 'Nikt nie trafił. Bywa.' }));
    }

    pokazWerdyktProwadzacego();
    rysujRanking($('#ranking-podglad'), tabela.slice(0, 5),
      stan.ustawienia.prowadzacyGra ? ID_PROWADZACEGO : null);
    $('#nastepna-runda').textContent = stan.ostatniaOdslona.ostatniePytanieRundy ? 'Wyniki rundy' : 'Następna piosenka';
  }

  /** Dwa znaczniki pod tytułem: gatunek i dekada tego konkretnego utworu. */
  function rysujZnacznikiUtworu(miejsce, odslona) {
    wyczysc(miejsce);
    if (odslona.kategoria) {
      miejsce.append(el('span', { tekst: `${odslona.kategoria.emoji} ${odslona.kategoria.nazwa}` }));
    }
    if (odslona.dekada) miejsce.append(el('span', { tekst: odslona.dekada }));
  }

  /** Gdy prowadzący gra, ma prawo wiedzieć, jak mu poszło — tak jak reszta. */
  function pokazWerdyktProwadzacego() {
    const werdykt = $('#werdykt-hosta');
    const moj = stan.ostatniaOdslona?.wyniki?.[ID_PROWADZACEGO];
    if (!stan.ustawienia.prowadzacyGra || !moj) {
      werdykt.hidden = true;
      return;
    }
    werdykt.hidden = false;
    if (moj.trafil) {
      werdykt.dataset.jak = 'dobrze';
      werdykt.innerHTML = `Dobrze!<span class="punkty">+${moj.punkty} pkt · razem ${moj.razem}</span>`;
    } else if (moj.odpowiedzial) {
      werdykt.dataset.jak = 'zle';
      werdykt.innerHTML = `Pudło<span class="punkty">razem ${moj.razem} pkt</span>`;
    } else {
      werdykt.dataset.jak = 'brak';
      werdykt.innerHTML = `Nie zdążyłeś<span class="punkty">razem ${moj.razem} pkt</span>`;
    }
  }

  /** „4/8 · śr. 3,2 s” — ile trafień w tej rundzie i średni czas trafień
      liczony od startu utworu. Bez średniej, gdy nikt jeszcze nic nie trafił. */
  function tekstStatystykRundy(trafien, pytan, sredniMs) {
    const bazowe = `${trafien}/${pytan}`;
    return sredniMs == null ? bazowe : `${bazowe} · śr. ${formatujCzasS(sredniMs)}`;
  }

  function rysujRanking(lista, tabela, mojeId = null, animuj = false, statystykiRundy = false) {
    wyczysc(lista);
    const pytanRundy = stan.seria?.length || 0;
    tabela.forEach((gracz, i) => {
      const dzieciKto = [el('span', { klasa: 'kto', tekst: gracz.ksywka })];
      if (statystykiRundy) {
        const wiersz2 = [el('span', {
          klasa: 'staty-rundy',
          tekst: tekstStatystykRundy(gracz.trafieniaRunda, pytanRundy, gracz.trafieniaRunda
            ? Math.round(gracz.sumaCzasuTrafienRundaMs / gracz.trafieniaRunda) : null),
        })];
        const streak = wezelStreaka(gracz.seriaMaxRunda);
        if (streak) wiersz2.push(streak);
        dzieciKto.push(el('span', { klasa: 'wiersz-rundy' }, wiersz2));
      }
      const wiersz = el('li', { 'data-miejsce': gracz.miejsce, 'data-ja': gracz.id === mojeId ? 'tak' : 'nie' }, [
        el('span', { klasa: 'miejsce', tekst: `${gracz.miejsce}.` }),
        el('span', { klasa: 'kto-blok' }, dzieciKto),
        el('span', { klasa: 'ile', tekst: `${gracz.punkty}` }),
      ]);
      if (animuj) wiersz.style.setProperty('--i', String(i));
      lista.append(wiersz);
    });
  }

  /* ---------------------------------------------------------- wyniki rundy */

  function zakonczRunde() {
    clearInterval(tykanie);
    odtwarzacz.zatrzymaj({ wygaszanieMs: 200 });
    stan.faza = 'wyniki-rundy';

    const tabela = ranking(stan.gracze);
    const ostatniaRunda = stan.nrRundyGry >= stan.ustawienia.liczbaRund;

    // Przypomnienie ostatniej piosenki tej rundy — ten sam kawałek danych co
    // na odsłonie, więc ekran wyników nie jest gołą tabelą bez związku z tym,
    // co się właśnie działo.
    // Uwaga: stan.nrPytania w tym miejscu jest już ZA końcem serii (patrz
    // nastepnePytanie — inkrementacja i porównanie z długością serii zdarzają
    // się przed wywołaniem zakonczRunde) — ostatnie realne pytanie to ostatni
    // element seria, nie seria[nrPytania].
    const ostatniePytanie = stan.seria[stan.seria.length - 1];
    const dekadaOst = DEKADY.find((d) => d.id === ostatniePytanie.utwor.dekada);
    const kategoriaOst = KATEGORIE.find((k) => k.id === ostatniePytanie.utwor.gatunek);
    const ostatniaPiosenka = {
      tytul: ostatniePytanie.utwor.tytul,
      wykonawca: ostatniePytanie.utwor.wykonawca,
      rok: ostatniePytanie.utwor.rok,
      film: ostatniePytanie.typ === 'film' ? ostatniePytanie.utwor.film : null,
      okladka: zrodlo.zPamieci(ostatniePytanie.utwor)?.okladka || null,
      kategoria: kategoriaOst ? { emoji: kategoriaOst.emoji, nazwa: kategoriaOst.nazwa } : null,
      dekada: dekadaOst ? dekadaOst.nazwa : null,
    };

    stan.ostatnieWynikiRundy = {
      t: 'wyniki-rundy',
      nrRundyGry: stan.nrRundyGry,
      ileRund: stan.ustawienia.liczbaRund,
      pytanRundy: stan.seria.length,
      ranking: tabela.slice(0, 8).map(lekkiWpisRundy),
      ostatniaPiosenka,
      ostatniaRunda,
    };

    $('#wyniki-rundy-nadtytul').textContent = `Runda ${stan.nrRundyGry}/${stan.ustawienia.liczbaRund} — koniec`;
    rysujOstatniaPiosenke($('#karta-ostatniej-piosenki'), $('#okladka-rundy'), $('#ostatnia-piosenka-tytul'),
      $('#ostatnia-piosenka-wykonawca'), $('#ostatnia-piosenka-znaczniki'), ostatniaPiosenka);
    rysujPodiumRundy(tabela);
    rysujRanking($('#ranking-rundy'), tabela, stan.ustawienia.prowadzacyGra ? ID_PROWADZACEGO : null, true, true);
    $('#dalej-po-rundzie').textContent = ostatniaRunda ? 'Zobacz wynik gry' : 'Następna runda';

    nadajStan();
    pokazEkran('wyniki-rundy');
  }

  /** Wspólne dla prowadzącego i (przez broadcast) gracza — karta „co leciało”
      na ekranie wyników rundy. */
  function rysujOstatniaPiosenke(karta, okladka, tytul, wykonawca, znaczniki, dane) {
    karta.hidden = false;
    if (dane.okladka) {
      okladka.src = dane.okladka;
      okladka.alt = `Okładka: ${dane.tytul}`;
      okladka.hidden = false;
    } else {
      okladka.hidden = true;
    }
    if (dane.film) {
      tytul.textContent = dane.film;
      wykonawca.textContent = `${dane.tytul} — ${dane.wykonawca}`;
    } else {
      tytul.textContent = dane.tytul;
      wykonawca.textContent = `${dane.wykonawca} · ${dane.rok}`;
    }
    wyczysc(znaczniki);
    if (dane.kategoria) znaczniki.append(el('span', { tekst: `${dane.kategoria.emoji} ${dane.kategoria.nazwa}` }));
    if (dane.dekada) znaczniki.append(el('span', { tekst: dane.dekada }));
  }

  function rysujPodiumRundy(tabela) {
    const podium = wyczysc($('#podium-rundy'));
    for (const [i, miejsce] of [2, 1, 3].entries()) {
      const gracz = tabela[miejsce - 1];
      if (!gracz) continue;
      const stopien = el('div', { klasa: 'stopien', 'data-miejsce': miejsce }, [
        el('span', { klasa: 'medal', tekst: MEDALE[miejsce - 1] }),
        el('span', { klasa: 'kto', tekst: gracz.ksywka }),
        el('span', { klasa: 'ile', tekst: `${gracz.punkty} pkt` }),
      ]);
      stopien.style.setProperty('--i', String(i));
      podium.append(stopien);
    }
  }

  $('#dalej-po-rundzie').addEventListener('click', () => {
    if (stan.ostatnieWynikiRundy?.ostatniaRunda) zakonczGre();
    else nastepnaRundaGry();
  });
  $('#zakoncz-gre-z-wynikow').addEventListener('click', zakonczGre);

  /* ---------------------------------------------------------------- koniec */

  function zakonczGre() {
    clearInterval(tykanie);
    stan.faza = 'koniec';
    odtwarzacz.uciszWszystko();
    const tabela = ranking(stan.gracze);

    const podium = wyczysc($('#podium'));
    for (const miejsce of [2, 1, 3]) {                 // 2 – 1 – 3, jak na prawdziwym podium
      const gracz = tabela[miejsce - 1];
      if (!gracz) continue;
      podium.append(el('div', { klasa: 'stopien', 'data-miejsce': miejsce }, [
        el('span', { klasa: 'medal', tekst: MEDALE[miejsce - 1] }),
        el('span', { klasa: 'kto', tekst: gracz.ksywka }),
        el('span', { klasa: 'ile', tekst: `${gracz.punkty} pkt` }),
      ]));
    }

    // Prowadzący, który sam gra, ma na tym ekranie to samo osobiste podsumowanie
    // co reszta graczy (patrz pokazWerdyktProwadzacego) — konfetti też mu się należą.
    if (stan.ustawienia.prowadzacyGra) {
      const moje = tabela.find((g) => g.id === ID_PROWADZACEGO);
      if (moje) swietuj(moje.miejsce);
    }

    rysujRanking($('#ranking-koncowy'), tabela, stan.ustawienia.prowadzacyGra ? ID_PROWADZACEGO : null);
    nadajStan();
    pokazEkran('koniec');
  }

  /* ------------------------------------------------------------- przyciski */

  $('#otworz-pokoj').addEventListener('click', otworzPokoj);
  $('#wroc-do-ustawien').addEventListener('click', () => { stan.faza = 'lobby'; pokazEkran('ustawienia'); });
  $('#zacznij-gre').addEventListener('click', zacznijGre);
  $('#nastepna-runda').addEventListener('click', nastepnePytanie);
  $('#odslon-teraz').addEventListener('click', () => { stan.koniecRundy = performance.now(); });
  $('#pomin-runde').addEventListener('click', () => {
    clearInterval(tykanie);
    wygaszanieId += 1;                                  // anuluj odroczone wygaszanie z odsłony, jeśli akurat trwa
    odtwarzacz.zatrzymaj({ wygaszanieMs: 200 });
    stan.seria.splice(stan.nrPytania, 1);
    stan.nrPytania -= 1;
    nastepnePytanie();
  });
  $('#zakoncz-gre').addEventListener('click', zakonczGre);
  $('#jeszcze-raz').addEventListener('click', () => { stan.faza = 'lobby'; zacznijGre(); });
  $('#nowe-ustawienia').addEventListener('click', () => { stan.faza = 'lobby'; pokazEkran('ustawienia'); });

  $('#kopiuj-adres').addEventListener('click', async () => {
    const adres = adresDolaczenia(pokoj.kod, pokoj.brokerNr);
    try {
      await navigator.clipboard.writeText(adres);
      powiadom('Link skopiowany — wklej go na grupę.', 'sukces');
    } catch {
      powiadom(adres);
    }
  });

  $('#test-polaczenia').addEventListener('click', sprawdzPolaczenie);

  async function sprawdzPolaczenie() {
    const przycisk = $('#test-polaczenia');
    przycisk.disabled = true;
    przycisk.textContent = 'Sprawdzam…';
    const { KlientMqtt } = await import('./mqtt.js');
    const wyniki = [];
    for (const broker of BROKERY) {
      const klient = new KlientMqtt({ adres: broker.adres });
      const start = performance.now();
      try {
        await klient.polacz(6000);
        wyniki.push(`${broker.nazwa}: ✓ ${Math.round(performance.now() - start)} ms`);
        klient.rozlacz();
      } catch {
        wyniki.push(`${broker.nazwa}: ✗`);
      }
    }
    przycisk.disabled = false;
    przycisk.textContent = 'Sprawdź połączenie';
    const dziala = wyniki.filter((w) => w.includes('✓')).length;
    powiadom(dziala ? wyniki.join(' · ') : 'Żaden serwer nie odpowiada — sprawdź internet.', dziala ? 'sukces' : 'blad');
  }

  odtwarzacz.onBlad = () => {
    $('#uwaga-dzwieku').textContent = 'Coś nie zagrało — puść ten kawałek sam albo pomiń rundę.';
  };

  /* ------------------------------------------------------------------ start */

  rysujUstawienia();
  pokazEkran('ustawienia');

  zrodlo.wczytaj().then(() => {
    odswiezLicznikPuli();
    const ile = zrodlo.gotowe.size;
    $('#stan-podgladow').textContent = ile
      ? `Nagrania gotowe dla ${ile} ${odmiana(ile, 'utworu', 'utworów', 'utworów')}.`
      : 'Brak wcześniej pobranych nagrań — aplikacja poszuka ich w trakcie gry.';
  });

  // Ekran nie ma gasnąć w środku rundy; po powrocie z tła blokadę trzeba wziąć na nowo.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && stan.faza !== 'ustawienia') {
      stan.blokadaEkranu = await trzymajEkran();
    }
  });

  window.addEventListener('beforeunload', () => { clearInterval(nadawanie); pokoj.zamknij(); });

  return { stan, pokoj };
}
