/* ==========================================================================
   Telefon prowadzącego — jedyne miejsce, w którym mieszka stan gry.
   --------------------------------------------------------------------------
   Ekran po ekranie: ustawienia → lobby z kodem QR → runda → odsłona → podium.
   Prowadzący puszcza muzykę, liczy punkty i nadaje to, co telefony mają
   pokazać. Nikt inny niczego nie rozstrzyga.

   Stan rundy leci w eter cyklicznie, nie jednorazowo — telefon, który wszedł
   w połowie albo na moment stracił zasięg, dostraja się sam, bez proszenia.
   ========================================================================== */

import { $, $$, el, wyczysc, pokazEkran, powiadom, odmiana, stuknij, trzymajEkran } from './ui.js';
import { KATEGORIE, DEKADY, przygotujKatalog } from './katalog.js';
import {
  USTAWIENIA_DOMYSLNE, CZASY_ODPOWIEDZI, MAKS_GRACZY,
  ulozRundy, pulaUtworow, punktyZaOdpowiedz, ranking,
} from './gra.js';
import { PokojProwadzacego, BROKERY, adresDolaczenia } from './siec.js';
import { ZrodloPodgladow } from './podglady.js';
import { Odtwarzacz } from './odtwarzacz.js';
import { kodQr } from './qr.js';

const KSZTALTY = ['▲', '◆', '●', '■'];
const LICZBY_RUND = [5, 8, 10, 12, 15, 20, 25];
const ODSTEP_NADAWANIA_MS = 1200;
const ZWLOKA_PO_WSZYSTKICH_MS = 900;      // chwila na „wszyscy odpowiedzieli”
const CZAS_ZNIKNIECIA_MS = 25_000;        // po tylu bez znaku życia gracz szarzeje

const KLUCZ_USTAWIEN = 'jtm:ustawienia';

// Prowadzący bywa też graczem. Siedzi wtedy w tej samej mapie co reszta, więc
// punktacja, tabela i podium nie wiedzą, że jest w czymkolwiek wyjątkowy.
// Krzyżyk na początku wyklucza zderzenie z identyfikatorem telefonu, bo te
// składają się wyłącznie z liter i cyfr.
const ID_PROWADZACEGO = '#prowadzacy';

export function uruchom() {
  const katalog = przygotujKatalog();
  const zrodlo = new ZrodloPodgladow();
  const odtwarzacz = new Odtwarzacz();
  const pokoj = new PokojProwadzacego();

  const stan = {
    ustawienia: wczytajUstawienia(),
    gracze: new Map(),
    rundy: [],
    nrRundy: -1,
    faza: 'ustawienia',
    limitMs: 15_000,
    koniecRundy: 0,
    odpowiedzi: new Map(),
    ostatniaOdslona: null,
    blokadaEkranu: null,
    pokazanoRunde: 0,        // od tego momentu liczy się czas odpowiedzi prowadzącego
  };

  let tykanie = null;
  let nadawanie = null;

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

    const rundy = wyczysc($('#wybor-rund'));
    for (const ile of LICZBY_RUND) {
      rundy.append(znaczek(
        String(ile),
        stan.ustawienia.liczbaRund === ile,
        () => { stan.ustawienia.liczbaRund = ile; rysujUstawienia(); },
      ));
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
    const zaMalo = ile < stan.ustawienia.liczbaRund;
    licznik.dataset.alarm = zaMalo ? 'tak' : 'nie';
    licznik.innerHTML = zaMalo
      ? `Do wyboru <strong>${ile}</strong> ${odmiana(ile, 'utwór', 'utwory', 'utworów')} — mniej niż rund. Gra skróci się sama albo dorzuć kategorię.`
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
    stan.ustawienia.ksywkaProwadzacego = z.target.value.slice(0, 14);
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
    const ksywka = (stan.ustawienia.ksywkaProwadzacego || '').trim().slice(0, 14) || 'Ja';
    const wpis = stan.gracze.get(ID_PROWADZACEGO);

    if (!gra) {
      stan.gracze.delete(ID_PROWADZACEGO);
    } else if (wpis) {
      wpis.ksywka = ksywka;
      wpis.widziany = Date.now();
    } else {
      stan.gracze.set(ID_PROWADZACEGO, {
        id: ID_PROWADZACEGO, ksywka, punkty: 0, trafienia: 0, seria: 0, widziany: Date.now(),
      });
    }
    if (stan.faza === 'lobby') { rysujLobby(); nadajStan(); }
  }

  for (const [pole, klucz] of [['#opcja-dzwiek', 'dzwiekWAplikacji'], ['#opcja-fragment', 'losowyFragment'], ['#opcja-seria', 'bonusSerii']]) {
    $(pole).addEventListener('change', (z) => {
      stan.ustawienia[klucz] = z.target.checked;
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
    } else if (stan.faza === 'runda') {
      const runda = stan.rundy[stan.nrRundy];
      pokoj.nadaj({
        t: 'runda',
        nr: stan.nrRundy,
        ile: stan.rundy.length,
        pytanie: runda.pytanie,
        odpowiedzi: runda.odpowiedzi,
        limitMs: stan.limitMs,
        pozostaloMs: Math.max(0, stan.koniecRundy - performance.now()),
        ilu: stan.odpowiedzi.size,
        zGrajacych: stan.gracze.size,
      });
    } else if (stan.faza === 'odslona' && stan.ostatniaOdslona) {
      pokoj.nadaj(stan.ostatniaOdslona);
    } else if (stan.faza === 'koniec') {
      pokoj.nadaj({ t: 'koniec', ranking: ranking(stan.gracze).map(lekkiWpis) });
    }
    if (stan.faza === 'lobby') rysujLobby();
  }

  const lekkiWpis = (g) => ({ id: g.id, ksywka: g.ksywka, punkty: g.punkty, miejsce: g.miejsce });

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
    else if (wiadomosc.t === 'puk') {
      const gracz = stan.gracze.get(wiadomosc.id);
      if (gracz) gracz.widziany = Date.now();
    }
  };

  function przyjmijGracza({ id, ksywka }) {
    const czysta = String(ksywka || '').trim().slice(0, 14) || 'Ktoś';
    let gracz = stan.gracze.get(id);

    if (id === ID_PROWADZACEGO) return;        // to miejsce jest zajęte lokalnie

    if (!gracz) {
      if (stan.gracze.size >= MAKS_GRACZY) {
        pokoj.nadaj({ t: 'pelno', id, powod: `Komplet — ${MAKS_GRACZY} telefonów to maksimum.` });
        return;
      }
      gracz = { id, ksywka: czysta, punkty: 0, trafienia: 0, seria: 0, widziany: Date.now() };
      stan.gracze.set(id, gracz);
      if (stan.faza !== 'lobby') powiadom(`${czysta} dołącza w trakcie.`);
    } else {
      gracz.ksywka = czysta;
      gracz.widziany = Date.now();
    }

    pokoj.nadaj({ t: 'witaj', id, ksywka: gracz.ksywka, punkty: gracz.punkty, faza: stan.faza });
    if (stan.faza === 'lobby') { rysujLobby(); nadajStan(); }
  }

  function przyjmijOdpowiedz({ id, nr, wybor, czasMs }) {
    if (stan.faza !== 'runda' || nr !== stan.nrRundy) return;
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

  /* ------------------------------------------------------------------- gra */

  async function zacznijGre() {
    // Pierwsze odtworzenie musi wyjść z dotknięcia ekranu — jesteśmy właśnie
    // w obsłudze kliknięcia, więc to jedyny dobry moment na rozgrzewkę.
    if (stan.ustawienia.dzwiekWAplikacji) await odtwarzacz.rozgrzej();

    // `?ziarno=123` w adresie ustala kolejność rund — z tego korzysta test
    // przeglądarkowy, żeby wiedzieć z góry, która odpowiedź jest poprawna.
    // Bez tego parametru każda gra losuje się od nowa.
    const ziarno = Number(new URLSearchParams(location.search).get('ziarno')) || undefined;
    stan.rundy = ulozRundy(stan.ustawienia, { ...opcjePuli(), ziarno });
    if (!stan.rundy.length) {
      powiadom('Z tych ustawień nie da się ułożyć żadnej rundy.', 'blad');
      return;
    }
    if (stan.rundy.length < stan.ustawienia.liczbaRund) {
      powiadom(`Starczyło na ${stan.rundy.length} ${odmiana(stan.rundy.length, 'rundę', 'rundy', 'rund')}.`);
    }

    for (const gracz of stan.gracze.values()) {
      gracz.punkty = 0; gracz.trafienia = 0; gracz.seria = 0;
    }
    stan.nrRundy = -1;
    stan.limitMs = stan.ustawienia.czasOdpowiedzi * 1000;
    stan.blokadaEkranu ??= await trzymajEkran();
    await nastepnaRunda();
  }

  async function nastepnaRunda() {
    stan.nrRundy += 1;
    if (stan.nrRundy >= stan.rundy.length) { zakonczGre(); return; }

    const runda = stan.rundy[stan.nrRundy];
    stan.odpowiedzi.clear();
    stan.faza = 'runda';
    stan.ostatniaOdslona = null;

    $('#numer-rundy').textContent = `Runda ${stan.nrRundy + 1}/${stan.rundy.length}`;
    $('#ilu-odpowiedzialo').textContent = `0 z ${stan.gracze.size}`;
    $('#pytanie-hosta').textContent = runda.pytanie;
    rysujOdpowiedziHosta(runda);
    $('#uwaga-dzwieku').textContent = stan.ustawienia.dzwiekWAplikacji ? '' : 'Puść fragment ze swojego źródła.';
    $('#potwierdzenie-hosta').hidden = true;
    pokazEkran('runda');
    stan.pokazanoRunde = performance.now();

    if (stan.ustawienia.dzwiekWAplikacji) await puscUtwor(runda.utwor);

    stan.koniecRundy = performance.now() + stan.limitMs;
    wlaczZegar();
    nadajStan();
    przygotujNastepny();
  }

  function rysujOdpowiedziHosta(runda) {
    const miejsce = wyczysc($('#odpowiedzi-hosta'));
    const gram = stan.ustawienia.prowadzacyGra;
    // Ta sama siatka służy za tablicę dla pokoju i za brzęczyk prowadzącego —
    // klikalna tylko wtedy, gdy prowadzący jest też w stawce.
    miejsce.classList.toggle('grywalne', gram);
    runda.odpowiedzi.forEach((tresc, nr) => {
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

  /** Prowadzący klika u siebie; czas liczy się od pokazania rundy na tym ekranie. */
  function odpowiedzProwadzacego(nr) {
    if (stan.faza !== 'runda' || !stan.ustawienia.prowadzacyGra) return;
    if (stan.odpowiedzi.has(ID_PROWADZACEGO)) return;

    const czasMs = Math.round(performance.now() - stan.pokazanoRunde);
    przyjmijOdpowiedz({ id: ID_PROWADZACEGO, nr: stan.nrRundy, wybor: nr, czasMs });
    stuknij([12, 40, 12]);

    for (const kafelek of $('#odpowiedzi-hosta').children) {
      const jego = Number(kafelek.dataset.nr);
      kafelek.dataset.wybrana = jego === nr ? 'tak' : 'nie';
      if (jego !== nr) kafelek.dataset.stan = 'przygasla';
      kafelek.disabled = true;
    }
    const sekundy = (czasMs / 1000).toFixed(1).replace('.', ',');
    $('#potwierdzenie-hosta').textContent = `Zapisane po ${sekundy} s.`;
    $('#potwierdzenie-hosta').hidden = false;
  }

  async function puscUtwor(utwor) {
    const wpis = await zrodlo.znajdz(utwor);
    if (!wpis?.podglad) {
      $('#uwaga-dzwieku').textContent = 'Nie znalazłem nagrania — puść ten kawałek sam albo pomiń rundę.';
      return;
    }
    const zagrane = await odtwarzacz.zagraj(wpis.podglad, {
      losowyStart: stan.ustawienia.losowyFragment,
      dlugoscMs: stan.limitMs,
    });
    if (!zagrane) {
      // Adres mógł wygasnąć (tak bywa z Deezerem) — pytamy o świeży i próbujemy raz.
      const swiezy = await zrodlo.odswiez(utwor);
      if (swiezy?.podglad) await odtwarzacz.zagraj(swiezy.podglad, { losowyStart: stan.ustawienia.losowyFragment, dlugoscMs: stan.limitMs });
      else $('#uwaga-dzwieku').textContent = 'Nagranie nie chce zagrać — puść je sam albo pomiń rundę.';
    }
  }

  /** Kolejny utwór doczytuje się w tle, żeby następna runda ruszyła bez ciszy. */
  function przygotujNastepny() {
    const nastepna = stan.rundy[stan.nrRundy + 1];
    if (!nastepna || !stan.ustawienia.dzwiekWAplikacji) return;
    zrodlo.znajdz(nastepna.utwor).then((wpis) => {
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
    odtwarzacz.zatrzymaj();

    const runda = stan.rundy[stan.nrRundy];
    const wyniki = {};

    for (const gracz of stan.gracze.values()) {
      const odpowiedz = stan.odpowiedzi.get(gracz.id);
      const trafil = odpowiedz?.wybor === runda.poprawna;
      gracz.seria = trafil ? gracz.seria + 1 : 0;
      const punkty = punktyZaOdpowiedz({
        poprawna: trafil,
        czasMs: odpowiedz?.czasMs ?? stan.limitMs,
        limitMs: stan.limitMs,
        seria: gracz.seria,
        bonusSerii: stan.ustawienia.bonusSerii,
      });
      gracz.punkty += punkty;
      if (trafil) gracz.trafienia += 1;
      wyniki[gracz.id] = { punkty, razem: gracz.punkty, trafil, odpowiedzial: Boolean(odpowiedz) };
    }

    const tabela = ranking(stan.gracze);
    for (const wpis of tabela) {
      if (wyniki[wpis.id]) wyniki[wpis.id].miejsce = wpis.miejsce;
    }

    const wpisPodgladu = zrodlo.zPamieci(runda.utwor);
    stan.ostatniaOdslona = {
      t: 'odslona',
      nr: stan.nrRundy,
      poprawna: runda.poprawna,
      tytul: runda.utwor.tytul,
      wykonawca: runda.utwor.wykonawca,
      rok: runda.utwor.rok,
      wyniki,
      ranking: tabela.slice(0, 5).map(lekkiWpis),
      ostatnia: stan.nrRundy + 1 >= stan.rundy.length,
    };
    nadajStan();
    rysujOdslone(runda, tabela, wpisPodgladu);
    pokazEkran('odslona');
  }

  function rysujOdslone(runda, tabela, wpisPodgladu) {
    const okladka = $('#okladka');
    if (wpisPodgladu?.okladka) {
      okladka.src = wpisPodgladu.okladka;
      okladka.alt = `Okładka: ${runda.utwor.tytul}`;
      okladka.hidden = false;
    } else {
      okladka.hidden = true;
    }

    $('#odsloniety-tytul').textContent = runda.utwor.tytul;
    $('#odsloniety-wykonawca').textContent = `${runda.utwor.wykonawca} · ${runda.utwor.rok}`;

    for (const kafelek of $$('#odpowiedzi-hosta .odp')) {
      const nr = Number(kafelek.dataset.nr);
      kafelek.dataset.stan = nr === runda.poprawna ? 'poprawna' : 'przygasla';
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
    $('#nastepna-runda').textContent = stan.ostatniaOdslona.ostatnia ? 'Podsumowanie' : 'Następna runda';
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

  function rysujRanking(lista, tabela, mojeId = null) {
    wyczysc(lista);
    for (const gracz of tabela) {
      lista.append(el('li', { 'data-miejsce': gracz.miejsce, 'data-ja': gracz.id === mojeId ? 'tak' : 'nie' }, [
        el('span', { klasa: 'miejsce', tekst: `${gracz.miejsce}.` }),
        el('span', { klasa: 'kto', tekst: gracz.ksywka }),
        el('span', { klasa: 'ile', tekst: `${gracz.punkty}` }),
      ]));
    }
  }

  /* ---------------------------------------------------------------- koniec */

  function zakonczGre() {
    clearInterval(tykanie);
    stan.faza = 'koniec';
    odtwarzacz.uciszWszystko();
    const tabela = ranking(stan.gracze);

    const podium = wyczysc($('#podium'));
    const medale = ['🥇', '🥈', '🥉'];
    for (const miejsce of [2, 1, 3]) {                 // 2 – 1 – 3, jak na prawdziwym podium
      const gracz = tabela[miejsce - 1];
      if (!gracz) continue;
      podium.append(el('div', { klasa: 'stopien', 'data-miejsce': miejsce }, [
        el('span', { klasa: 'medal', tekst: medale[miejsce - 1] }),
        el('span', { klasa: 'kto', tekst: gracz.ksywka }),
        el('span', { klasa: 'ile', tekst: `${gracz.punkty} pkt` }),
      ]));
    }

    rysujRanking($('#ranking-koncowy'), tabela, stan.ustawienia.prowadzacyGra ? ID_PROWADZACEGO : null);
    nadajStan();
    pokazEkran('koniec');
  }

  /* ------------------------------------------------------------- przyciski */

  $('#otworz-pokoj').addEventListener('click', otworzPokoj);
  $('#wroc-do-ustawien').addEventListener('click', () => { stan.faza = 'lobby'; pokazEkran('ustawienia'); });
  $('#zacznij-gre').addEventListener('click', zacznijGre);
  $('#nastepna-runda').addEventListener('click', nastepnaRunda);
  $('#odslon-teraz').addEventListener('click', () => { stan.koniecRundy = performance.now(); });
  $('#pomin-runde').addEventListener('click', () => {
    clearInterval(tykanie);
    odtwarzacz.zatrzymaj({ wygaszanieMs: 200 });
    stan.rundy.splice(stan.nrRundy, 1);
    stan.nrRundy -= 1;
    nastepnaRunda();
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
