/* ==========================================================================
   Tryb wyzwań — asynchroniczna gra solo. Grasz sam, w swoim tempie, a na
   koniec dostajesz link. Kto go otworzy, gra na dokładnie tych samych
   piosenkach (ułożonych raz przy tworzeniu wyzwania i zapisanych w bazie)
   i widzi, jak wypadł na tle reszty.

   To NIE jest ten sam silnik co prowadzacy.js/gracz.js — zero MQTT, zero
   "na żywo". Telefon nie rozmawia z innymi telefonami, tylko raz na
   początku i raz na końcu z bazą (Firestore), żeby przekazać dalej te same
   pytania i zebrać wyniki. Stąd osobny, dużo prostszy stan gry.
   ========================================================================== */

import {
  $, el, wyczysc, pokazEkran, powiadom, stuknij, odmiana, utnijZnaki,
} from './ui.js';
import { KATEGORIE, DEKADY, przygotujKatalog } from './katalog.js';
import {
  USTAWIENIA_DOMYSLNE, CZASY_ODPOWIEDZI, LICZBY_RUND, DLUGOSCI_SERII,
  pulaUtworow, ulozSerie, punktyZaOdpowiedz,
} from './gra.js';
import { idUrzadzenia } from './siec.js';
import { ZrodloPodgladow } from './podglady.js';
import { Odtwarzacz } from './odtwarzacz.js';
import { kodQr } from './qr.js';
import { baza } from './firebase.js';

const KSZTALTY = ['▲', '◆', '●', '■'];
const CZAS_WYBRZMIENIA_MS = 4000;

export function uruchom() {
  const katalog = przygotujKatalog();
  const zrodlo = new ZrodloPodgladow();
  const odtwarzacz = new Odtwarzacz();
  const mojeId = idUrzadzenia();

  const stan = {
    ustawienia: { ...USTAWIENIA_DOMYSLNE },
    id: null,             // id dokumentu wyzwania w Firestore
    utworca: null,        // ksywka tego, kto wyzwanie stworzył (do ekranu "dołącz")
    rundy: [],            // [{ seria: [pytanie...] }] — ułożone raz, wspólne dla wszystkich
    lacznaLiczbaPytan: 0,
    nrRundy: 0,
    nrPytania: -1,
    punkty: 0,
    trafienia: 0,
    seriaTrafien: 0,
    limitMs: 0,
    koniecPytania: 0,
    pokazano: 0,
    wybor: null,
  };
  let tykanie = null;
  let wygaszanieId = 0;
  let zaladowanoPodglady = null;

  async function gotowePodglady() {
    zaladowanoPodglady ??= zrodlo.wczytaj();
    return zaladowanoPodglady;
  }

  function opcjePuli() {
    const wartoFiltrowac = zrodlo.gotowe.size >= 40;
    return { katalog, maPodglad: wartoFiltrowac ? (u) => zrodlo.maPodglad(u) : null };
  }

  /* ------------------------------------------------------------- znaczki */

  function znaczek(tekst, wcisniety, naklik, specjalna = false) {
    return el('button', {
      klasa: specjalna ? 'znaczek specjalna' : 'znaczek', type: 'button', 'aria-pressed': String(wcisniety),
      tekst, naclick: naklik,
    });
  }

  function przelacz(lista, wartosc) {
    const bez = lista.filter((x) => x !== wartosc);
    if (bez.length === lista.length) return [...lista, wartosc];
    if (bez.length === 0) { powiadom('Zostaw przynajmniej jedną pozycję.'); return lista; }
    return bez;
  }

  /* --------------------------------------------------------- nowe wyzwanie */

  async function pokazNowe() {
    await gotowePodglady();
    const zapisana = localStorage.getItem('jtm:ksywka') || '';
    $('#wyzwanie-ksywka').value = zapisana;
    rysujNowe();
    pokazEkran('wyzwanie-nowe');
  }

  function rysujNowe() {
    const kategorie = wyczysc($('#wyzwanie-wybor-kategorii'));
    for (const kat of KATEGORIE) {
      kategorie.append(znaczek(`${kat.emoji} ${kat.nazwa}`, stan.ustawienia.kategorie.includes(kat.id), () => {
        stan.ustawienia.kategorie = przelacz(stan.ustawienia.kategorie, kat.id);
        rysujNowe();
      }, kat.specjalna));
    }
    const dekady = wyczysc($('#wyzwanie-wybor-dekad'));
    for (const dek of DEKADY) {
      dekady.append(znaczek(dek.nazwa, stan.ustawienia.dekady.includes(dek.id), () => {
        stan.ustawienia.dekady = przelacz(stan.ustawienia.dekady, dek.id);
        rysujNowe();
      }));
    }
    const czasy = wyczysc($('#wyzwanie-wybor-czasu'));
    for (const s of CZASY_ODPOWIEDZI) {
      czasy.append(znaczek(`${s} s`, stan.ustawienia.czasOdpowiedzi === s, () => {
        stan.ustawienia.czasOdpowiedzi = s;
        rysujNowe();
      }));
    }
    const seria = wyczysc($('#wyzwanie-wybor-serii'));
    for (const ile of DLUGOSCI_SERII) {
      seria.append(znaczek(String(ile), stan.ustawienia.dlugoscSerii === ile, () => {
        stan.ustawienia.dlugoscSerii = ile;
        rysujNowe();
      }));
    }
    const rundy = wyczysc($('#wyzwanie-wybor-rund'));
    for (const ile of LICZBY_RUND) {
      rundy.append(znaczek(String(ile), stan.ustawienia.liczbaRund === ile, () => {
        stan.ustawienia.liczbaRund = ile;
        rysujNowe();
      }));
    }
    const ile = pulaUtworow(stan.ustawienia, opcjePuli()).length;
    const licznik = $('#wyzwanie-licznik-puli');
    licznik.innerHTML = `Do wyboru <strong>${ile}</strong> ${odmiana(ile, 'utwór', 'utwory', 'utworów')}.`;
  }

  $('#wyzwanie-wroc').addEventListener('click', () => { location.hash = '#/'; });

  $('#wyzwanie-zacznij').addEventListener('click', async () => {
    const ksywka = utnijZnaki($('#wyzwanie-ksywka').value.trim(), 24);
    if (!ksywka) { powiadom('Wpisz swoją ksywkę.', 'blad'); return; }
    localStorage.setItem('jtm:ksywka', ksywka);
    await odtwarzacz.rozgrzej(); // prawdziwe dotknięcie ekranu — jedyna okazja na iOS

    $('#wyzwanie-tworzenie-opis').textContent = 'Układam pytania…';
    pokazEkran('wyzwanie-tworzenie');

    const seriaRund = zbudujRundy(stan.ustawienia);
    if (!seriaRund.length || !seriaRund[0].seria.length) {
      powiadom('Z tego tematu nie da się ułożyć żadnej piosenki — wybierz coś innego.', 'blad');
      pokazEkran('wyzwanie-nowe');
      return;
    }

    $('#wyzwanie-tworzenie-opis').textContent = 'Wysyłam do bazy…';
    try {
      stan.id = await utworzWyzwanie({
        ustawienia: stan.ustawienia,
        rundy: seriaRund,
        utworca: ksywka,
      });
    } catch (blad) {
      powiadom('Nie udało się utworzyć wyzwania — sprawdź internet i spróbuj ponownie.', 'blad');
      pokazEkran('wyzwanie-nowe');
      return;
    }

    history.replaceState(null, '', `#/wyzwanie/${stan.id}`);
    stan.rundy = seriaRund;
    stan.utworca = ksywka;
    rozpocznijGre(ksywka);
  });

  /** Serie, jedna na rundę, bez powtórek utworu między rundami. */
  function zbudujRundy(ustawienia) {
    const pominiete = new Set();
    const bazowe = Math.floor(Math.random() * 2 ** 31);
    const wynik = [];
    for (let i = 0; i < ustawienia.liczbaRund; i += 1) {
      const seria = ulozSerie(ustawienia, { ...opcjePuli(), ziarno: bazowe + i, pomin: pominiete });
      if (!seria.length) break;
      for (const pytanie of seria) pominiete.add(pytanie.utwor.id);
      wynik.push({ seria });
    }
    return wynik;
  }

  /* ------------------------------------------------------- dołącz do cudzego */

  async function pokazDolacz(id) {
    pokazEkran('wyzwanie-tworzenie');
    $('#wyzwanie-tworzenie-opis').textContent = 'Wczytuję wyzwanie…';
    await gotowePodglady();

    let dane;
    try {
      dane = await pobierzWyzwanie(id);
    } catch {
      dane = null;
    }
    if (!dane) {
      powiadom('Nie znalazłem tego wyzwania — link mógł wygasnąć albo się urwać.', 'blad');
      location.hash = '#/';
      return;
    }
    stan.id = id;
    stan.ustawienia = dane.ustawienia;
    stan.rundy = dane.rundy;
    stan.utworca = dane.utworca;

    // Już grałem? Prosto do wyników, bez powtarzania.
    let jaGralem = null;
    try {
      jaGralem = await pobierzWynikGracza(id, mojeId);
    } catch { /* brak sieci — spróbujemy zagrać, zapis i tak może się nie udać */ }
    if (jaGralem) {
      await pokazWyniki(id);
      return;
    }

    const lacznaLiczbaPytan = dane.rundy.reduce((suma, r) => suma + r.seria.length, 0);
    $('#wyzwanie-dolacz-tytul').textContent = `${dane.utworca} Cię wyzwał!`;
    $('#wyzwanie-dolacz-opis').textContent =
      `${dane.rundy.length} ${odmiana(dane.rundy.length, 'runda', 'rundy', 'rund')}, `
      + `${lacznaLiczbaPytan} ${odmiana(lacznaLiczbaPytan, 'piosenka', 'piosenki', 'piosenek')} łącznie. `
      + 'Zagraj na tych samych, a zobaczymy, kto lepszy.';
    let graczeDotychczas = [];
    try { graczeDotychczas = await pobierzGraczy(id); } catch { /* nieistotne tutaj */ }
    rysujRanking($('#wyzwanie-dolacz-ranking'), uszereguj(graczeDotychczas));

    $('#wyzwanie-dolacz-ksywka').value = localStorage.getItem('jtm:ksywka') || '';
    pokazEkran('wyzwanie-dolacz');
  }

  $('#wyzwanie-przyjmij').addEventListener('click', async () => {
    const ksywka = utnijZnaki($('#wyzwanie-dolacz-ksywka').value.trim(), 24);
    if (!ksywka) { powiadom('Wpisz swoją ksywkę.', 'blad'); return; }
    localStorage.setItem('jtm:ksywka', ksywka);
    await odtwarzacz.rozgrzej();
    rozpocznijGre(ksywka);
  });

  /* ------------------------------------------------------------- rozgrywka */

  function rozpocznijGre(ksywka) {
    stan.ksywka = ksywka;
    stan.lacznaLiczbaPytan = stan.rundy.reduce((suma, r) => suma + r.seria.length, 0);
    stan.nrRundy = 0;
    stan.nrPytania = -1;
    stan.punkty = 0;
    stan.trafienia = 0;
    stan.seriaTrafien = 0;
    stan.limitMs = stan.ustawienia.czasOdpowiedzi * 1000;
    nastepnePytanie();
  }

  function nastepnePytanie() {
    clearInterval(tykanie);
    wygaszanieId += 1;
    stan.nrPytania += 1;
    if (stan.nrPytania >= stan.rundy[stan.nrRundy].seria.length) {
      stan.nrRundy += 1;
      stan.nrPytania = 0;
    }
    if (stan.nrRundy >= stan.rundy.length) { zakonczGre(); return; }

    const pytanie = stan.rundy[stan.nrRundy].seria[stan.nrPytania];
    stan.wybor = null;
    const numerLacznyPoprzednich = stan.rundy.slice(0, stan.nrRundy).reduce((s, r) => s + r.seria.length, 0);
    $('#wyzwanie-numer-rundy').textContent =
      `Runda ${stan.nrRundy + 1}/${stan.rundy.length} · piosenka ${numerLacznyPoprzednich + stan.nrPytania + 1}/${stan.lacznaLiczbaPytan}`;
    $('#wyzwanie-pytanie').textContent = pytanie.pytanie;
    rysujOdpowiedzi(pytanie);

    stan.pokazano = performance.now();
    stan.koniecPytania = performance.now() + stan.limitMs;
    pokazEkran('wyzwanie-runda');
    wlaczZegar();
    puscUtwor(pytanie.utwor);
  }

  async function puscUtwor(utwor) {
    const wpis = await zrodlo.znajdz(utwor);
    if (!wpis?.podglad) return;
    odtwarzacz.zagraj(wpis.podglad, { dlugoscMs: stan.limitMs });
  }

  function rysujOdpowiedzi(pytanie) {
    const miejsce = wyczysc($('#wyzwanie-odpowiedzi'));
    pytanie.odpowiedzi.forEach((tresc, nr) => {
      miejsce.append(el('button', {
        klasa: 'odp', type: 'button', 'data-kolor': nr, 'data-nr': nr,
        naclick: () => odpowiedz(nr),
      }, [
        el('span', { klasa: 'ksztalt', 'aria-hidden': 'true', tekst: KSZTALTY[nr] }),
        el('span', { klasa: 'tresc', tekst: tresc }),
      ]));
    });
  }

  function wlaczZegar() {
    clearInterval(tykanie);
    const wskaz = $('#wyzwanie-zegar-wskaz');
    const obwod = 2 * Math.PI * 52;
    wskaz.style.strokeDasharray = String(obwod);
    const tyknij = () => {
      const zostalo = Math.max(0, stan.koniecPytania - performance.now());
      const udzial = zostalo / stan.limitMs;
      wskaz.style.strokeDashoffset = String(obwod * (1 - udzial));
      $('#wyzwanie-zegar-liczba').textContent = String(Math.ceil(zostalo / 1000));
      $('[data-ekran="wyzwanie-runda"] .zegar').dataset.koniec = udzial > 0.34 ? 'daleko' : udzial > 0.14 ? 'blisko' : 'juz';
      if (zostalo <= 0) odslon();
    };
    tyknij();
    tykanie = setInterval(tyknij, 100);
  }

  function odpowiedz(nr) {
    if (stan.wybor !== null) return;
    stan.wybor = nr;
    stuknij([12, 40, 12]);
    for (const kafelek of $('#wyzwanie-odpowiedzi').children) {
      const jego = Number(kafelek.dataset.nr);
      kafelek.dataset.wybrana = jego === nr ? 'tak' : 'nie';
      if (jego !== nr) kafelek.dataset.stan = 'przygasla';
      kafelek.disabled = true;
    }
    odslon();
  }

  function odslon() {
    clearInterval(tykanie);
    const pytanie = stan.rundy[stan.nrRundy].seria[stan.nrPytania];
    const czasMs = Math.min(Math.max(0, Math.round(performance.now() - stan.pokazano)), stan.limitMs);
    const trafil = stan.wybor === pytanie.poprawna;
    stan.seriaTrafien = trafil ? stan.seriaTrafien + 1 : 0;
    const punkty = trafil
      ? punktyZaOdpowiedz({
        poprawna: true, czasMs, limitMs: stan.limitMs, seria: stan.seriaTrafien, bonusSerii: stan.ustawienia.bonusSerii,
      })
      : 0;
    stan.punkty += punkty;
    if (trafil) stan.trafienia += 1;

    for (const kafelek of $('#wyzwanie-odpowiedzi').children) {
      const nr = Number(kafelek.dataset.nr);
      kafelek.dataset.stan = nr === pytanie.poprawna ? 'poprawna' : 'przygasla';
    }

    const werdykt = $('#wyzwanie-werdykt');
    werdykt.hidden = false;
    if (trafil) {
      werdykt.dataset.jak = 'dobrze';
      werdykt.innerHTML = `Dobrze!<span class="punkty">+${punkty} pkt · razem ${stan.punkty}</span>`;
    } else if (stan.wybor !== null) {
      werdykt.dataset.jak = 'zle';
      werdykt.innerHTML = `Pudło<span class="punkty">razem ${stan.punkty} pkt</span>`;
    } else {
      werdykt.dataset.jak = 'brak';
      werdykt.innerHTML = `Nie zdążyłeś<span class="punkty">razem ${stan.punkty} pkt</span>`;
    }

    const okladka = $('#wyzwanie-okladka');
    const wpisPodgladu = zrodlo.zPamieci(pytanie.utwor);
    if (wpisPodgladu?.okladka) {
      okladka.src = wpisPodgladu.okladka;
      okladka.alt = `Okładka: ${pytanie.utwor.tytul}`;
      okladka.hidden = false;
    } else {
      okladka.hidden = true;
    }
    if (pytanie.typ === 'film') {
      $('#wyzwanie-odsloniety-tytul').textContent = pytanie.utwor.film;
      $('#wyzwanie-odsloniety-wykonawca').textContent = `${pytanie.utwor.tytul} — ${pytanie.utwor.wykonawca}`;
    } else {
      $('#wyzwanie-odsloniety-tytul').textContent = pytanie.utwor.tytul;
      $('#wyzwanie-odsloniety-wykonawca').textContent = `${pytanie.utwor.wykonawca} · ${pytanie.utwor.rok}`;
    }
    const dekadaInfo = DEKADY.find((d) => d.id === pytanie.utwor.dekada);
    const kategoriaInfo = KATEGORIE.find((k) => k.id === pytanie.utwor.gatunek);
    const znaczniki = wyczysc($('#wyzwanie-znaczniki-utworu'));
    if (kategoriaInfo) znaczniki.append(el('span', { tekst: `${kategoriaInfo.emoji} ${kategoriaInfo.nazwa}` }));
    if (dekadaInfo) znaczniki.append(el('span', { tekst: dekadaInfo.nazwa }));
    if (pytanie.typ !== 'film' && pytanie.utwor.film) {
      znaczniki.append(el('span', { tekst: `🎬 ${pytanie.utwor.film}` }));
    }

    const ostatnie = stan.nrRundy === stan.rundy.length - 1 && stan.nrPytania === stan.rundy[stan.nrRundy].seria.length - 1;
    $('#wyzwanie-dalej').textContent = ostatnie ? 'Zobacz wynik' : 'Następna piosenka';

    wygaszanieId += 1;
    const mojeWygaszanie = wygaszanieId;
    setTimeout(() => { if (mojeWygaszanie === wygaszanieId) odtwarzacz.zatrzymaj(); }, CZAS_WYBRZMIENIA_MS);

    pokazEkran('wyzwanie-odslona');
  }

  $('#wyzwanie-dalej').addEventListener('click', () => {
    wygaszanieId += 1;
    odtwarzacz.zatrzymaj({ wygaszanieMs: 200 });
    nastepnePytanie();
  });

  async function zakonczGre() {
    odtwarzacz.uciszWszystko();
    pokazEkran('wyzwanie-tworzenie');
    $('#wyzwanie-tworzenie-opis').textContent = 'Zapisuję wynik…';
    try {
      await zapiszWynikGracza(stan.id, mojeId, { ksywka: stan.ksywka, punkty: stan.punkty, trafienia: stan.trafienia });
    } catch {
      powiadom('Nie udało się zapisać wyniku do wspólnej tabeli — sprawdź internet.', 'blad');
    }
    await pokazWyniki(stan.id);
  }

  /* --------------------------------------------------------------- wyniki */

  async function pokazWyniki(id) {
    let gracze = [];
    try { gracze = await pobierzGraczy(id); } catch { /* pokażemy chociaż to, co mamy lokalnie */ }
    if (!gracze.length && stan.ksywka) {
      gracze = [{ id: mojeId, ksywka: stan.ksywka, punkty: stan.punkty, trafienia: stan.trafienia }];
    }
    const tabela = uszereguj(gracze);

    const moje = tabela.find((g) => g.id === mojeId);
    const werdykt = $('#wyzwanie-wyniki-werdykt');
    werdykt.dataset.jak = moje?.miejsce === 1 ? 'dobrze' : 'brak';
    werdykt.textContent = ['🥇', '🥈', '🥉'][(moje?.miejsce ?? 9) - 1] || '🎯';
    $('#wyzwanie-moj-wynik').textContent = moje
      ? `${moje.miejsce}. miejsce · ${moje.punkty} pkt`
      : 'Wynik zapisany';
    rysujRanking($('#wyzwanie-ranking'), tabela);

    const link = adresWyzwania(id);
    $('#wyzwanie-qr').replaceChildren(kodQr(link));
    $('#wyzwanie-udostepnij').onclick = () => udostepnijLink(link);

    pokazEkran('wyzwanie-wyniki');
  }

  /** Punkty, przy remisie trafienia, przy dalszym remisie ksywka — tak samo
      jak w rankingu na żywo (patrz ranking() w gra.js). */
  function uszereguj(gracze) {
    return gracze
      .slice()
      .sort((a, b) => b.punkty - a.punkty || (b.trafienia ?? 0) - (a.trafienia ?? 0) || a.ksywka.localeCompare(b.ksywka, 'pl'))
      .map((g, i) => ({ ...g, miejsce: i + 1 }));
  }

  function rysujRanking(lista, tabela) {
    wyczysc(lista);
    for (const gracz of tabela) {
      lista.append(el('li', { 'data-miejsce': gracz.miejsce, 'data-ja': gracz.id === mojeId ? 'tak' : 'nie' }, [
        el('span', { klasa: 'miejsce', tekst: `${gracz.miejsce}.` }),
        el('span', { klasa: 'kto', tekst: gracz.ksywka }),
        el('span', { klasa: 'ile', tekst: String(gracz.punkty) }),
      ]));
    }
  }

  function adresWyzwania(id) {
    const adres = new URL(location.href);
    adres.hash = `#/wyzwanie/${id}`;
    return adres.toString();
  }

  async function udostepnijLink(link) {
    const tekst = `${stan.ksywka || stan.utworca} wyzwał Cię w Jaka to Melodia! Zagrasz?`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Jaka to Melodia', text: tekst, url: link }); return; } catch { /* anulowane */ }
    }
    try {
      await navigator.clipboard.writeText(link);
      powiadom('Link skopiowany — wklej go, gdzie chcesz.');
    } catch {
      powiadom(link);
    }
  }

  /* ------------------------------------------------------------- Firestore */

  async function utworzWyzwanie({ ustawienia, rundy, utworca }) {
    const { db, f } = await baza();
    const ref = f.doc(f.collection(db, 'wyzwania'));
    await f.setDoc(ref, { ustawienia, rundy, utworca, utworzono: f.serverTimestamp() });
    return ref.id;
  }

  async function pobierzWyzwanie(id) {
    const { db, f } = await baza();
    const zrzut = await f.getDoc(f.doc(db, 'wyzwania', id));
    return zrzut.exists() ? zrzut.data() : null;
  }

  async function zapiszWynikGracza(id, graczId, dane) {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, 'wyzwania', id, 'gracze', graczId), { ...dane, ukonczono: f.serverTimestamp() });
  }

  async function pobierzWynikGracza(id, graczId) {
    const { db, f } = await baza();
    const zrzut = await f.getDoc(f.doc(db, 'wyzwania', id, 'gracze', graczId));
    return zrzut.exists() ? zrzut.data() : null;
  }

  async function pobierzGraczy(id) {
    const { db, f } = await baza();
    const zrzut = await f.getDocs(f.collection(db, 'wyzwania', id, 'gracze'));
    return zrzut.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  window.addEventListener('beforeunload', () => odtwarzacz.uciszWszystko());

  return { pokazNowe, pokazDolacz };
}
