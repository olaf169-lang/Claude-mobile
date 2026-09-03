/* ==========================================================================
   Turniej Piąteczki — pojedynek 1v1, asynchroniczny, przez Firestore.
   Pięć rund po pięć piosenek. Zapraszający (P1) wybiera temat rund 2 i 4
   w miarę jak do nich dochodzi; przeciwnik (P2) wybiera temat rund 1, 3 i 5.
   Celowo mniej rund dla P1 (dwie, nie trzy) — P1 i tak rusza pierwszy,
   więc z trzema rundami miałby zbyt duży wpływ na temat całego pojedynku.
   Sekwencja trzech ruchów:
     1. P1 gra swoje rundy (2, 4) i wysyła link.
     2. P2 gra WSZYSTKIE pięć rund — rundy P1 już gotowe, swoje (1, 3, 5)
        układa w locie tak jak P1 układał swoje.
     3. P1 wraca i dogrywa już gotowe rundy 1, 3 i 5 — pojedynek zamknięty,
        obaj gracze mają dokładnie te same dwadzieścia pięć piosenek.

   Ta sama filozofia co wyzwanie.js: zero MQTT, telefon rozmawia z bazą
   tylko wtedy, gdy trzeba coś dograć albo odebrać. Każdy zapis w Firestore
   jest tworzony raz i już niezmienny (patrz firestore.rules) — runda raz
   ułożona zostaje taka sama dla obu graczy, ruch raz zapisany się nie da
   poprawić.

   Trwała tablica wyników liczy się z zapisanych meczów po stronie klienta
   (agregacja po ksywce), a panel administratora (czyszczenie tablicy,
   ukrywanie ksywki) działa pod kodem, którego hash siedzi w regułach
   Firestore — patrz komentarz na górze firestore.rules.
   ========================================================================== */

import {
  $, el, wyczysc, pokazEkran, powiadom, stuknij, odmiana, utnijZnaki, dopiszStreak,
} from './ui.js';
import { KATEGORIE, DEKADY, przygotujKatalog } from './katalog.js';
import {
  USTAWIENIA_DOMYSLNE, CZASY_ODPOWIEDZI, pulaUtworow, ulozSerie, punktyZaOdpowiedz,
} from './gra.js';
import { idUrzadzenia } from './siec.js';
import { ZrodloPodgladow } from './podglady.js';
import { Odtwarzacz } from './odtwarzacz.js';
import { kodQr } from './qr.js';
import { baza } from './firebase.js';

const KSZTALTY = ['▲', '◆', '●', '■'];
const MEDALE = ['🥇', '🥈', '🥉'];
const CZAS_WYBRZMIENIA_MS = 4000;
const CZAS_ODLICZANIA_MS = 3000;
const PIOSENEK_W_RUNDZIE = 5;

// Które rundy (0-based) wybiera który gracz — patrz opis mechaniki wyżej.
// P1 zaczyna, więc dostaje mniej rund do ułożenia niż P2 (który i tak dogania
// wszystko na koniec) — inaczej P1 miałby zbyt dużą przewagę we wpływie na
// temat całego pojedynku, bo ustalałby go jako pierwszy i w większości.
const RUNDY_P1 = [1, 3];      // rundy 2, 4
const RUNDY_P2 = [0, 2, 4];   // rundy 1, 3, 5

// Hash SHA-256 kodu administratora — dokładnie ten sam literał co
// w firestore.rules. Tu służy tylko do lokalnego sprawdzenia, czy wpisany
// kod jest poprawny, zanim appka w ogóle spróbuje zapisu (żeby nie strzelać
// na ślepo w regułę, która i tak by go odrzuciła) — prawdziwe wymuszenie
// jest po stronie Firestore, nie tutaj.
const KOD_ADMINA_HASH = '0cc9e820e268fd7bfe1dbef054e34e44751aa6f69aaa2c279f3222779620fb63';
const KLUCZ_ADMIN_HASH = 'jtm:turniejAdminHash';

// Ile pojedynków (licząc rewanże i wyzwania ponowne) może rozegrać jedna
// ksywka w ciągu tygodnia — patrz sprawdzITykajLimitTygodniowy() niżej.
const LIMIT_TYGODNIOWY = 5;

async function shaHex(tekst) {
  const bufor = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tekst));
  return [...new Uint8Array(bufor)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function kluczKsywki(ksywka) {
  return ksywka.trim().toLowerCase();
}

/** Jeśli zgoda na powiadomienia jest już dana (np. z pytania przy pierwszej
    wizycie, gdy ksywka nie była jeszcze znana), po cichu dopina do niej
    token — bez tego appka wiedziałaby "wolno wysyłać", ale nie miałaby
    komu. Brak zgody albo brak sieci — nic się nie dzieje, to nie blokuje gry. */
function odswiezTokenPowiadomien(ksywka) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  import('./powiadomienia.js').then((m) => m.wlaczPowiadomienia(ksywka)).catch(() => {});
}

/** Numer tygodnia ISO (poniedziałek–niedziela) liczony w czasie polskim,
    np. "2026-W36" — klucz do limitu tygodniowego i do przyszłego
    cotygodniowego podsumowania. */
function tydzienTygodniowy(teraz = new Date()) {
  const czesci = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(teraz);
  const rok = Number(czesci.find((c) => c.type === 'year').value);
  const miesiac = Number(czesci.find((c) => c.type === 'month').value);
  const dzien = Number(czesci.find((c) => c.type === 'day').value);
  const data = new Date(Date.UTC(rok, miesiac - 1, dzien));
  const dzienTygodnia = (data.getUTCDay() + 6) % 7; // 0 = poniedziałek
  data.setUTCDate(data.getUTCDate() - dzienTygodnia + 3);
  const pierwszyCzwartek = new Date(Date.UTC(data.getUTCFullYear(), 0, 4));
  const numer = 1 + Math.round(
    ((data - pierwszyCzwartek) / 86_400_000 - 3 + ((pierwszyCzwartek.getUTCDay() + 6) % 7)) / 7,
  );
  return `${data.getUTCFullYear()}-W${String(numer).padStart(2, '0')}`;
}

export function uruchom() {
  const katalog = przygotujKatalog();
  const zrodlo = new ZrodloPodgladow();
  const odtwarzacz = new Odtwarzacz();
  const mojeId = idUrzadzenia();

  const stan = {
    id: null,                 // id dokumentu pojedynku
    rola: null,                // 'p1' | 'p2'
    ksywka: '',
    utworca: null,             // ksywka P1 — do ekranów dołączania/oczekiwania
    przeciwnik: null,          // ksywka drugiego gracza, gdy już znana
    ustawienia: { czasOdpowiedzi: 15, bonusSerii: false },
    rundy: [null, null, null, null, null],     // {temat, seria} albo null
    // bieżący ruch:
    kolejnoscRund: [],
    idxKolejnosci: -1,
    biezacaRunda: -1,
    nrPytania: -1,
    limitMs: 0, koniecPytania: 0, pokazano: 0, wybor: null,
    seriaTrafien: 0,
    punktyRundy: 0, trafieniaRundy: 0,
    wynikiRuchu: [],           // [{punkty,trafienia}, ...] po jednym na rundę tego ruchu
    wyborTematu: null,         // robocza wersja wyboru na ekranie wyboru tematu
    adminOdblokowany: false,
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

  /* --------------------------------------------------------- nowy pojedynek */

  async function pokazNowe() {
    await gotowePodglady();
    $('#turniej-ksywka').value = localStorage.getItem('jtm:ksywka') || '';
    rysujNowe();
    pokazEkran('turniej-nowe');
  }

  function rysujNowe() {
    const czasy = wyczysc($('#turniej-wybor-czasu'));
    for (const s of CZASY_ODPOWIEDZI) {
      czasy.append(znaczek(`${s} s`, stan.ustawienia.czasOdpowiedzi === s, () => {
        stan.ustawienia.czasOdpowiedzi = s;
        rysujNowe();
      }));
    }
  }

  $('#turniej-wroc').addEventListener('click', () => { location.hash = '#/'; });
  $('#turniej-bonus-serii').addEventListener('change', (z) => {
    stan.ustawienia.bonusSerii = z.target.checked;
  });

  /** Zakłada nowy pojedynek i od razu wchodzi w niego jako P1 — używane
      zarówno z ekranu ustawień, jak i z przycisków Rewanż/Wyzwij ponownie
      pod wynikiem poprzedniego pojedynku. Czyści cały stan gry, więc stara
      rozgrywka nie miesza się z nową. */
  async function zacznijPojedynek(ksywka, ustawienia, ekranPowrotu) {
    localStorage.setItem('jtm:ksywka', ksywka);
    await odtwarzacz.rozgrzej();

    $('#turniej-tworzenie-opis').textContent = 'Sprawdzam limit tygodniowy…';
    pokazEkran('turniej-tworzenie');

    let wolnoGrac;
    try {
      wolnoGrac = await sprawdzITykajLimitTygodniowy(ksywka);
    } catch {
      wolnoGrac = true; // brak sieci przy samym sprawdzaniu — spróbujemy dalej, zapis i tak może się nie udać
    }
    if (!wolnoGrac) {
      powiadom(`Masz już ${LIMIT_TYGODNIOWY} pojedynków w tym tygodniu — wróć w przyszłym tygodniu.`, 'blad');
      pokazEkran(ekranPowrotu);
      return;
    }

    $('#turniej-tworzenie-opis').textContent = 'Zakładam pojedynek…';
    let noweId;
    try {
      noweId = await utworzPojedynek({ ustawienia, utworca: ksywka });
      await utworzGracza(noweId, mojeId, { ksywka, rola: 'p1' });
    } catch {
      powiadom('Nie udało się założyć pojedynku — sprawdź internet i spróbuj ponownie.', 'blad');
      pokazEkran(ekranPowrotu);
      return;
    }

    history.replaceState(null, '', `#/turniej/${noweId}`);
    stan.id = noweId;
    stan.ustawienia = ustawienia;
    stan.rundy = [null, null, null, null, null];
    stan.rola = 'p1';
    stan.ksywka = ksywka;
    stan.utworca = ksywka;
    stan.przeciwnik = null;
    odswiezTokenPowiadomien(ksywka);
    rozpocznijRuch(RUNDY_P1);
  }

  $('#turniej-zacznij').addEventListener('click', () => {
    const ksywka = utnijZnaki($('#turniej-ksywka').value.trim(), 24);
    if (!ksywka) { powiadom('Wpisz swoją ksywkę.', 'blad'); return; }
    zacznijPojedynek(ksywka, { ...stan.ustawienia }, 'turniej-nowe');
  });

  /* ---------------------------------------------------- dołącz / wznów */

  async function pokazDolacz(id) {
    pokazEkran('turniej-tworzenie');
    $('#turniej-tworzenie-opis').textContent = 'Wczytuję pojedynek…';
    await gotowePodglady();

    let dane;
    try {
      dane = await pobierzPojedynek(id);
    } catch {
      dane = null;
    }
    if (!dane) {
      powiadom('Nie znalazłem tego pojedynku — link mógł się urwać.', 'blad');
      location.hash = '#/';
      return;
    }
    stan.id = id;
    stan.ustawienia = dane.ustawienia;
    stan.utworca = dane.utworca;

    try {
      const gracze = await pobierzGraczy(id);
      await wczytajZbudowaneRundy(id);

      const jaJuz = gracze.find((g) => g.id === mojeId);
      if (jaJuz) {
        stan.rola = jaJuz.rola;
        stan.ksywka = jaJuz.ksywka;
        const drugi = gracze.find((g) => g.id !== mojeId);
        stan.przeciwnik = drugi ? drugi.ksywka : null;
        await wznowGre(id);
        return;
      }

      if (gracze.length >= 2) {
        // Ktoś trzeci trafił na link cudzego pojedynku — może tylko popatrzeć.
        stan.przeciwnik = gracze.find((g) => g.rola === 'p2')?.ksywka || null;
        await pokazWynikPojedynku(id, { readOnly: true });
        return;
      }

      const p1 = gracze.find((g) => g.rola === 'p1');
      const p1Skonczyl = p1 ? (await pobierzRuchy(id, p1.id)).length >= 1 : false;
      if (!p1Skonczyl) {
        $('#turniej-jeszcze-opis').textContent =
          `${dane.utworca} jeszcze gra swoją część — spróbuj dołączyć za chwilę.`;
        pokazEkran('turniej-jeszcze');
        return;
      }

      $('#turniej-dolacz-tytul').textContent = `${dane.utworca} wyzwał Cię na Turniej Piąteczki!`;
      $('#turniej-dolacz-ksywka').value = localStorage.getItem('jtm:ksywka') || '';
      pokazEkran('turniej-dolacz');
    } catch {
      powiadom('Nie udało się wczytać pojedynku — sprawdź internet i spróbuj ponownie.', 'blad');
      location.hash = '#/';
    }
  }

  $('#turniej-jeszcze-sprawdz').addEventListener('click', () => pokazDolacz(stan.id));

  $('#turniej-przyjmij').addEventListener('click', async () => {
    const ksywka = utnijZnaki($('#turniej-dolacz-ksywka').value.trim(), 24);
    if (!ksywka) { powiadom('Wpisz swoją ksywkę.', 'blad'); return; }
    localStorage.setItem('jtm:ksywka', ksywka);
    await odtwarzacz.rozgrzej();

    let wolnoGrac;
    try {
      wolnoGrac = await sprawdzITykajLimitTygodniowy(ksywka);
    } catch {
      wolnoGrac = true;
    }
    if (!wolnoGrac) {
      powiadom(`Masz już ${LIMIT_TYGODNIOWY} pojedynków w tym tygodniu — wróć w przyszłym tygodniu.`, 'blad');
      return;
    }

    try {
      await utworzGracza(stan.id, mojeId, { ksywka, rola: 'p2' });
    } catch {
      powiadom('Nie udało się dołączyć — sprawdź internet i spróbuj ponownie.', 'blad');
      return;
    }
    stan.rola = 'p2';
    stan.ksywka = ksywka;
    stan.przeciwnik = stan.utworca;
    odswiezTokenPowiadomien(ksywka);
    rozpocznijRuch(RUNDY_P2.concat(RUNDY_P1).sort((a, b) => a - b));
  });

  /** Po powrocie na własny link: sprawdź, który ruch teraz gramy (albo
      czy już czekamy na przeciwnika, albo pojedynek jest zamknięty). */
  async function wznowGre(id) {
    try {
      const mojeRuchy = await pobierzRuchy(id, mojeId);

      if (stan.rola === 'p1') {
        if (mojeRuchy.length === 0) { rozpocznijRuch(RUNDY_P1); return; }
        if (mojeRuchy.length === 1) {
          const p2 = (await pobierzGraczy(id)).find((g) => g.rola === 'p2');
          const p2Skonczyl = p2 ? (await pobierzRuchy(id, p2.id)).length >= 1 : false;
          if (p2) stan.przeciwnik = p2.ksywka;
          if (!p2Skonczyl) { pokazCzekaj('p2', { przeciwnikDolaczyl: Boolean(p2) }); return; }
          rozpocznijRuch(RUNDY_P2);
          return;
        }
        await pokazWynikPojedynku(id, {});
        return;
      }

      // p2 ma dokładnie jeden ruch, obejmujący wszystkie pięć rund
      if (mojeRuchy.length === 0) { rozpocznijRuch(RUNDY_P2.concat(RUNDY_P1).sort((a, b) => a - b)); return; }
      await pokazWynikPojedynku(id, {});
    } catch {
      powiadom('Nie udało się sprawdzić stanu pojedynku — sprawdź internet i spróbuj ponownie.', 'blad');
      pokazCzekajEkran({
        opis: 'Nie udało się połączyć z bazą.', link: null, powiadomKogo: null, naSprawdz: () => wznowGre(id),
      });
    }
  }

  /** naKogo: 'p2' — czekam, aż przeciwnik dograje swoją część (jeszcze mogę
      nie znać jego ksywki, jeśli jeszcze nie dołączył). przeciwnikDolaczyl
      steruje tym, czy w ogóle jest kogo bezpośrednio szturchnąć. */
  function pokazCzekaj(naKogo, { przeciwnikDolaczyl = false } = {}) {
    const opis = naKogo === 'p2'
      ? `Czekasz, aż ${stan.przeciwnik || 'przeciwnik'} dograje swoją część.`
      : 'Czekasz na ruch przeciwnika.';
    pokazCzekajEkran({
      opis,
      link: adresPojedynku(stan.id),
      powiadomKogo: naKogo === 'p2' && przeciwnikDolaczyl ? stan.przeciwnik : null,
      naSprawdz: () => wznowGre(stan.id),
    });
  }

  /** Wspólny ekran oczekiwania: link/QR do wysłania, dopóki nie wiadomo
      jeszcze z kim się gra, i/albo przycisk do bezpośredniego szturchnięcia
      już znanego przeciwnika powiadomieniem push (patrz utworzProsbe niżej —
      to osobna, natychmiastowa ścieżka, niezależna od automatycznego
      powiadomienia wysyłanego przez Cloud Function po zapisaniu ruchu). */
  function pokazCzekajEkran({
    opis, link, powiadomKogo, naSprawdz,
  }) {
    $('#turniej-czekaj-opis').textContent = opis;
    $('#turniej-czekaj-karta').hidden = !link;
    if (link) {
      $('#turniej-czekaj-qr').replaceChildren(kodQr(link));
      $('#turniej-czekaj-kopiuj').onclick = () => kopiujLink(link);
    } else {
      $('#turniej-czekaj-qr').replaceChildren();
      $('#turniej-czekaj-kopiuj').onclick = null;
    }
    const przyciskPowiadom = $('#turniej-czekaj-powiadom');
    przyciskPowiadom.hidden = !powiadomKogo;
    if (powiadomKogo) {
      przyciskPowiadom.disabled = false;
      przyciskPowiadom.textContent = 'Powiadom gracza';
      przyciskPowiadom.onclick = async () => {
        przyciskPowiadom.disabled = true;
        try {
          await utworzProsbe(stan.id, stan.rola);
          przyciskPowiadom.textContent = 'Wysłano ✓';
          powiadom(`Wysłano powiadomienie do ${powiadomKogo}.`);
        } catch {
          powiadom('Nie udało się wysłać powiadomienia — sprawdź internet.', 'blad');
          przyciskPowiadom.disabled = false;
        }
      };
    } else {
      przyciskPowiadom.onclick = null;
    }
    $('#turniej-czekaj-sprawdz').onclick = naSprawdz;
    pokazEkran('turniej-czekaj');
  }

  /** Kopiowanie linku bez polegania na navigator.share (na części urządzeń
      albo w ogóle go nie ma, albo cicho nic nie robi) — Clipboard API, a gdy
      i to zawiedzie (starszy WebView, brak uprawnień), execCommand jako
      zapasowe wyjście, i dopiero na końcu goły link w powiadomieniu. */
  async function kopiujLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      powiadom('Link skopiowany — wklej go, gdzie chcesz.');
      return;
    } catch { /* spróbujemy starszego sposobu niżej */ }
    try {
      const pole = document.createElement('textarea');
      pole.value = link;
      pole.style.position = 'fixed';
      pole.style.opacity = '0';
      document.body.append(pole);
      pole.focus();
      pole.select();
      const udalo = document.execCommand('copy');
      pole.remove();
      if (udalo) { powiadom('Link skopiowany — wklej go, gdzie chcesz.'); return; }
    } catch { /* i to się nie udało — pokaż chociaż sam link */ }
    powiadom(link);
  }

  /* ------------------------------------------------------------- rozgrywka */

  function rozpocznijRuch(kolejnosc) {
    stan.kolejnoscRund = kolejnosc;
    stan.idxKolejnosci = -1;
    stan.wynikiRuchu = [];
    stan.seriaTrafien = 0;
    nastepnyKrokRuchu();
  }

  function nastepnyKrokRuchu() {
    stan.idxKolejnosci += 1;
    if (stan.idxKolejnosci >= stan.kolejnoscRund.length) { zakonczRuch(); return; }
    stan.biezacaRunda = stan.kolejnoscRund[stan.idxKolejnosci];
    stan.punktyRundy = 0;
    stan.trafieniaRundy = 0;
    stan.nrPytania = -1;
    if (stan.rundy[stan.biezacaRunda]) pokazOdliczanieRundy();
    else pokazWyborTematuRundy(stan.biezacaRunda);
  }

  function pokazWyborTematuRundy(indeksRundy) {
    stan.wyborTemat = { kategorie: KATEGORIE.map((k) => k.id), dekady: DEKADY.map((d) => d.id) };
    $('#turniej-numer-rundy-tematu').textContent = `Runda ${indeksRundy + 1}/5`;
    rysujWyborTematuRundy();
    pokazEkran('turniej-wybor-tematu');
  }

  function rysujWyborTematuRundy() {
    const kategorie = wyczysc($('#turniej-wybor-kategorii'));
    for (const kat of KATEGORIE) {
      kategorie.append(znaczek(`${kat.emoji} ${kat.nazwa}`, stan.wyborTemat.kategorie.includes(kat.id), () => {
        stan.wyborTemat.kategorie = przelacz(stan.wyborTemat.kategorie, kat.id);
        rysujWyborTematuRundy();
      }, kat.specjalna));
    }
    const dekady = wyczysc($('#turniej-wybor-dekad'));
    for (const dek of DEKADY) {
      dekady.append(znaczek(dek.nazwa, stan.wyborTemat.dekady.includes(dek.id), () => {
        stan.wyborTemat.dekady = przelacz(stan.wyborTemat.dekady, dek.id);
        rysujWyborTematuRundy();
      }));
    }
    const juzUzyte = new Set(stan.rundy.filter(Boolean).flatMap((r) => r.seria.map((p) => p.utwor.id)));
    const ile = pulaUtworow(stan.wyborTemat, opcjePuli()).filter((u) => !juzUzyte.has(u.id)).length;
    const licznik = $('#turniej-licznik-tematu');
    licznik.dataset.alarm = ile < PIOSENEK_W_RUNDZIE ? 'tak' : 'nie';
    licznik.innerHTML = `Do wyboru <strong>${ile}</strong> ${odmiana(ile, 'utwór', 'utwory', 'utworów')}.`;
    $('#turniej-zacznij-runde').disabled = ile === 0;
  }

  $('#turniej-zacznij-runde').addEventListener('click', async () => {
    const indeksRundy = stan.biezacaRunda;
    const temat = stan.wyborTemat;
    const juzUzyte = new Set(stan.rundy.filter(Boolean).flatMap((r) => r.seria.map((p) => p.utwor.id)));
    const seria = ulozSerie(
      { ...USTAWIENIA_DOMYSLNE, kategorie: temat.kategorie, dekady: temat.dekady, dlugoscSerii: PIOSENEK_W_RUNDZIE },
      { ...opcjePuli(), ziarno: Math.floor(Math.random() * 2 ** 31), pomin: juzUzyte, ile: PIOSENEK_W_RUNDZIE },
    );
    if (!seria.length) {
      powiadom('Z tego tematu nie da się ułożyć rundy — wybierz coś innego.', 'blad');
      return;
    }
    const danaRunda = { temat, seria };
    try {
      await utworzRunde(stan.id, indeksRundy, danaRunda);
    } catch {
      powiadom('Nie udało się zapisać rundy — sprawdź internet i spróbuj ponownie.', 'blad');
      return;
    }
    stan.rundy[indeksRundy] = danaRunda;
    pokazOdliczanieRundy();
  });

  /** Krótkie odliczanie 3-2-1 przed pierwszą piosenką rundy — bez tego
      ekran rundy potrafił się jeszcze nie domalować, gdy muzyka już leciała
      (pokazEkran + puszczenie utworu w tym samym takcie). Ten sam wzorzec
      co ekran prowadzącego/gracza w grze wieloosobowej. */
  function pokazOdliczanieRundy() {
    clearInterval(tykanie);
    $('#turniej-odliczanie-opis').textContent = `Runda ${stan.biezacaRunda + 1}/5`;
    pokazEkran('turniej-odliczanie');

    const pierwszePytanie = stan.rundy[stan.biezacaRunda].seria[0];
    zrodlo.znajdz(pierwszePytanie.utwor).then((wpis) => {
      if (wpis?.podglad) odtwarzacz.przygotuj(wpis.podglad);
    });

    const koniec = performance.now() + CZAS_ODLICZANIA_MS;
    let poprzedniaLiczba = null;
    const tyknij = () => {
      const zostalo = Math.max(0, koniec - performance.now());
      const liczba = Math.ceil(zostalo / 1000);
      if (liczba !== poprzedniaLiczba && liczba > 0) {
        poprzedniaLiczba = liczba;
        const wezel = $('#turniej-odliczanie-liczba');
        wezel.textContent = String(liczba);
        wezel.style.animation = 'none';
        void wezel.offsetWidth;
        wezel.style.animation = '';
      }
      if (zostalo <= 0) { clearInterval(tykanie); nastepnePytanie(); return; }
    };
    tyknij();
    tykanie = setInterval(tyknij, 100);
  }

  function nastepnePytanie() {
    clearInterval(tykanie);
    wygaszanieId += 1;
    stan.nrPytania += 1;
    if (stan.nrPytania >= PIOSENEK_W_RUNDZIE) { zakonczRunde(); return; }

    const pytanie = stan.rundy[stan.biezacaRunda].seria[stan.nrPytania];
    stan.wybor = null;
    $('#turniej-numer-rundy').textContent =
      `Runda ${stan.biezacaRunda + 1}/5 · piosenka ${stan.nrPytania + 1}/${PIOSENEK_W_RUNDZIE}`;
    $('#turniej-pytanie').textContent = pytanie.pytanie;
    rysujOdpowiedzi(pytanie);

    stan.pokazano = performance.now();
    stan.limitMs = stan.ustawienia.czasOdpowiedzi * 1000;
    stan.koniecPytania = performance.now() + stan.limitMs;
    pokazEkran('turniej-runda');
    wlaczZegar();
    puscUtwor(pytanie.utwor);
  }

  async function puscUtwor(utwor) {
    const wpis = await zrodlo.znajdz(utwor);
    if (!wpis?.podglad) return;
    odtwarzacz.zagraj(wpis.podglad, { dlugoscMs: stan.limitMs });
  }

  function rysujOdpowiedzi(pytanie) {
    const miejsce = wyczysc($('#turniej-odpowiedzi'));
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
    const wskaz = $('#turniej-zegar-wskaz');
    const obwod = 2 * Math.PI * 52;
    wskaz.style.strokeDasharray = String(obwod);
    const tyknij = () => {
      const zostalo = Math.max(0, stan.koniecPytania - performance.now());
      const udzial = zostalo / stan.limitMs;
      wskaz.style.strokeDashoffset = String(obwod * (1 - udzial));
      $('#turniej-zegar-liczba').textContent = String(Math.ceil(zostalo / 1000));
      $('[data-ekran="turniej-runda"] .zegar').dataset.koniec = udzial > 0.34 ? 'daleko' : udzial > 0.14 ? 'blisko' : 'juz';
      if (zostalo <= 0) odslon();
    };
    tyknij();
    tykanie = setInterval(tyknij, 100);
  }

  function odpowiedz(nr) {
    if (stan.wybor !== null) return;
    stan.wybor = nr;
    stuknij([12, 40, 12]);
    for (const kafelek of $('#turniej-odpowiedzi').children) {
      const jego = Number(kafelek.dataset.nr);
      kafelek.dataset.wybrana = jego === nr ? 'tak' : 'nie';
      if (jego !== nr) kafelek.dataset.stan = 'przygasla';
      kafelek.disabled = true;
    }
    odslon();
  }

  function odslon() {
    clearInterval(tykanie);
    const pytanie = stan.rundy[stan.biezacaRunda].seria[stan.nrPytania];
    const czasMs = Math.min(Math.max(0, Math.round(performance.now() - stan.pokazano)), stan.limitMs);
    const trafil = stan.wybor === pytanie.poprawna;
    stan.seriaTrafien = trafil ? stan.seriaTrafien + 1 : 0;
    const punkty = trafil
      ? punktyZaOdpowiedz({
        poprawna: true, czasMs, limitMs: stan.limitMs, seria: stan.seriaTrafien, bonusSerii: stan.ustawienia.bonusSerii,
      })
      : 0;
    stan.punktyRundy += punkty;
    if (trafil) stan.trafieniaRundy += 1;

    for (const kafelek of $('#turniej-odpowiedzi').children) {
      const nr = Number(kafelek.dataset.nr);
      kafelek.dataset.stan = nr === pytanie.poprawna ? 'poprawna' : 'przygasla';
    }

    const werdykt = $('#turniej-werdykt');
    werdykt.hidden = false;
    if (trafil) {
      werdykt.dataset.jak = 'dobrze';
      werdykt.innerHTML = `Dobrze!<span class="punkty">+${punkty} pkt · razem ${stan.punktyRundy}</span>`;
      dopiszStreak(werdykt.querySelector('.punkty'), stan.seriaTrafien);
    } else if (stan.wybor !== null) {
      werdykt.dataset.jak = 'zle';
      werdykt.innerHTML = `Pudło<span class="punkty">razem ${stan.punktyRundy} pkt</span>`;
    } else {
      werdykt.dataset.jak = 'brak';
      werdykt.innerHTML = `Nie zdążyłeś<span class="punkty">razem ${stan.punktyRundy} pkt</span>`;
    }

    const okladka = $('#turniej-okladka');
    const wpisPodgladu = zrodlo.zPamieci(pytanie.utwor);
    if (wpisPodgladu?.okladka) {
      okladka.src = wpisPodgladu.okladka;
      okladka.alt = `Okładka: ${pytanie.utwor.tytul}`;
      okladka.hidden = false;
    } else {
      okladka.hidden = true;
    }
    if (pytanie.typ === 'film') {
      $('#turniej-odsloniety-tytul').textContent = pytanie.utwor.film;
      $('#turniej-odsloniety-wykonawca').textContent = `${pytanie.utwor.tytul} — ${pytanie.utwor.wykonawca}`;
    } else {
      $('#turniej-odsloniety-tytul').textContent = pytanie.utwor.tytul;
      $('#turniej-odsloniety-wykonawca').textContent = `${pytanie.utwor.wykonawca} · ${pytanie.utwor.rok}`;
    }
    const dekadaInfo = DEKADY.find((d) => d.id === pytanie.utwor.dekada);
    const kategoriaInfo = KATEGORIE.find((k) => k.id === pytanie.utwor.gatunek);
    const znaczniki = wyczysc($('#turniej-znaczniki-utworu'));
    if (kategoriaInfo) znaczniki.append(el('span', { tekst: `${kategoriaInfo.emoji} ${kategoriaInfo.nazwa}` }));
    if (dekadaInfo) znaczniki.append(el('span', { tekst: dekadaInfo.nazwa }));
    if (pytanie.typ !== 'film' && pytanie.utwor.film) {
      znaczniki.append(el('span', { tekst: `🎬 ${pytanie.utwor.film}` }));
    }

    const ostatniePytanieRundy = stan.nrPytania === PIOSENEK_W_RUNDZIE - 1;
    const ostatniaRundaRuchu = stan.idxKolejnosci === stan.kolejnoscRund.length - 1;
    $('#turniej-dalej').textContent = !ostatniePytanieRundy
      ? 'Następna piosenka'
      : ostatniaRundaRuchu ? 'Zobacz wynik' : 'Następna runda';

    wygaszanieId += 1;
    const mojeWygaszanie = wygaszanieId;
    setTimeout(() => { if (mojeWygaszanie === wygaszanieId) odtwarzacz.zatrzymaj(); }, CZAS_WYBRZMIENIA_MS);

    pokazEkran('turniej-odslona');
  }

  $('#turniej-dalej').addEventListener('click', () => {
    wygaszanieId += 1;
    odtwarzacz.zatrzymaj({ wygaszanieMs: 200 });
    nastepnePytanie();
  });

  function zakonczRunde() {
    // Twarde uciszenie obu elementów audio, niezależnie od tego, czy
    // wcześniejsze wygaszanie (200 ms po kliknięciu „Dalej” albo naturalne po
    // odsłonie) zdążyło dobiec końca — bez tego, przy szybkim przejściu prosto
    // do kolejnej rundy (temat już ułożony, brak ekranu wyboru pomiędzy),
    // ostatnia piosenka potrafiła zostać słyszalna jeszcze na ekranie wyboru
    // tematu następnej rundy.
    odtwarzacz.uciszWszystko();
    stan.wynikiRuchu.push({ punkty: stan.punktyRundy, trafienia: stan.trafieniaRundy });
    nastepnyKrokRuchu();
  }

  async function zakonczRuch() {
    odtwarzacz.uciszWszystko();
    pokazEkran('turniej-tworzenie');
    $('#turniej-tworzenie-opis').textContent = 'Zapisuję Twój ruch…';
    try {
      const numerRuchu = (await pobierzRuchy(stan.id, mojeId)).length + 1;
      await utworzRuch(stan.id, mojeId, numerRuchu, {
        rundyZagrane: stan.kolejnoscRund,
        wyniki: stan.wynikiRuchu,
      });
      if (stan.rola === 'p1' && numerRuchu === 1) {
        pokazCzekaj('p2');
        return;
      }
      await pokazWynikPojedynku(stan.id, {});
    } catch {
      powiadom('Nie udało się zapisać wyniku — sprawdź internet i spróbuj ponownie.', 'blad');
      pokazCzekajEkran({
        opis: 'Nie udało się zapisać wyniku.', link: null, powiadomKogo: null, naSprawdz: () => zakonczRuch(),
      });
    }
  }

  /* --------------------------------------------------------------- wyniki */

  /** Sumuje wszystkie ruchy jednego gracza w komplet 5 wyników rund
      (indeks = numer rundy) — działa niezależnie od tego, w jakiej
      kolejności i w ilu ruchach ten gracz je rozegrał. */
  function scalRuchy(ruchy) {
    const wynikiRund = Array(5).fill(null);
    for (const ruch of ruchy) {
      ruch.rundyZagrane.forEach((indeksRundy, i) => { wynikiRund[indeksRundy] = ruch.wyniki[i]; });
    }
    const rozegrane = wynikiRund.filter(Boolean);
    return {
      wynikiRund,
      ukonczono: rozegrane.length === 5,
      punkty: rozegrane.reduce((s, w) => s + w.punkty, 0),
      trafienia: rozegrane.reduce((s, w) => s + w.trafienia, 0),
    };
  }

  async function pokazWynikPojedynku(id, { readOnly = false }) {
    pokazEkran('turniej-tworzenie');
    $('#turniej-tworzenie-opis').textContent = 'Liczę wynik…';

    try {
      const gracze = await pobierzGraczy(id);
      const p1 = gracze.find((g) => g.rola === 'p1');
      const p2 = gracze.find((g) => g.rola === 'p2');
      if (!p1 || !p2) {
        pokazCzekajEkran({
          opis: 'Czekasz, aż ktoś przyjmie wyzwanie.',
          link: adresPojedynku(id),
          powiadomKogo: null,
          naSprawdz: () => wznowGre(id),
        });
        return;
      }

      const [ruchyP1, ruchyP2] = await Promise.all([pobierzRuchy(id, p1.id), pobierzRuchy(id, p2.id)]);
      const wynikP1 = scalRuchy(ruchyP1);
      const wynikP2 = scalRuchy(ruchyP2);

      if (!wynikP1.ukonczono || !wynikP2.ukonczono) {
        const czyjaKolej = !wynikP1.ukonczono ? p1.ksywka : p2.ksywka;
        pokazCzekajEkran({
          opis: readOnly
            ? `Pojedynek między ${p1.ksywka} a ${p2.ksywka} jeszcze trwa (czeka się na ${czyjaKolej}).`
            : `Czekasz na ${czyjaKolej}.`,
          link: null,
          // !readOnly znaczy, że to ja jestem jednym z graczy — a skoro
          // dotarłem tutaj (a nie do rozgrywki), to zawsze ja już skończyłem
          // swoją część i to przeciwnik zwleka, nigdy odwrotnie.
          powiadomKogo: readOnly ? null : czyjaKolej,
          naSprawdz: () => (readOnly ? pokazDolacz(id) : wznowGre(id)),
        });
        return;
      }

      const zwyciezca = wynikP1.punkty === wynikP2.punkty ? 'remis' : wynikP1.punkty > wynikP2.punkty ? 'p1' : 'p2';
      try { await zapiszWynikTurnieju(id, { p1, p2, wynikP1, wynikP2, zwyciezca }); } catch { /* ktoś już zapisał, albo brak sieci — nic straconego */ }

      const jaWynik = stan.rola === 'p2' ? wynikP2 : wynikP1;
      const jaGracz = stan.rola === 'p2' ? p2 : p1;
      const jaWygral = !readOnly && zwyciezca === stan.rola;

      const werdykt = $('#turniej-wynik-werdykt');
      werdykt.dataset.jak = readOnly ? 'brak' : jaWygral ? 'dobrze' : zwyciezca === 'remis' ? 'brak' : 'zle';
      werdykt.textContent = readOnly ? '🎯' : zwyciezca === 'remis' ? '🤝' : jaWygral ? '🏆' : '🎯';
      $('#turniej-wynik-opis').textContent = zwyciezca === 'remis'
        ? `Remis: ${p1.ksywka} ${wynikP1.punkty} – ${wynikP2.punkty} ${p2.ksywka}`
        : `${zwyciezca === 'p1' ? p1.ksywka : p2.ksywka} wygrywa ${Math.max(wynikP1.punkty, wynikP2.punkty)} – ${Math.min(wynikP1.punkty, wynikP2.punkty)}`;
      if (!readOnly) $('#turniej-moj-wynik').textContent = `Twój wynik: ${jaWynik.punkty} pkt, ${jaGracz.ksywka}`;
      $('#turniej-moj-wynik').hidden = readOnly;

      rysujRozbicieRund(p1, p2, wynikP1, wynikP2);
      rysujAkcjeKoncowe(readOnly, { przeciwnik: stan.rola === 'p2' ? p1.ksywka : p2.ksywka });

      pokazEkran('turniej-wynik');
    } catch {
      powiadom('Nie udało się wczytać wyniku — sprawdź internet i spróbuj ponownie.', 'blad');
      pokazCzekajEkran({
        opis: 'Nie udało się połączyć z bazą.',
        link: null,
        powiadomKogo: null,
        naSprawdz: () => pokazWynikPojedynku(id, { readOnly }),
      });
    }
  }

  function rysujRozbicieRund(p1, p2, wynikP1, wynikP2) {
    const lista = wyczysc($('#turniej-rozbicie-rund'));
    for (let i = 0; i < 5; i += 1) {
      const runda = stan.rundy[i];
      const kategoriaOpis = runda
        ? runda.temat.kategorie.length === KATEGORIE.length ? 'wszystko' : `${runda.temat.kategorie.length} kat.`
        : '—';
      lista.append(el('li', {}, [
        el('span', { klasa: 'miejsce', tekst: `${i + 1}.` }),
        el('span', { klasa: 'kto-blok' }, [
          el('span', { klasa: 'kto', tekst: kategoriaOpis }),
        ]),
        el('span', { klasa: 'ile', tekst: `${wynikP1.wynikiRund[i]?.punkty ?? '—'} : ${wynikP2.wynikiRund[i]?.punkty ?? '—'}` }),
      ]));
    }
  }

  /** P2 (przyjmujący wyzwanie) dostaje Rewanż — od razu, bez ekranu ustawień,
      zakłada nowy pojedynek, w którym role się odwracają i to on rusza
      pierwszy. P1 tego przycisku nie widzi: rewanż ma sens tylko wtedy, gdy
      ktoś faktycznie odpowiada na cudze wyzwanie, nie kiedy sam je rzucił. */
  function rysujAkcjeKoncowe(readOnly, { przeciwnik }) {
    const miejsce = wyczysc($('#turniej-wynik-akcje'));
    if (readOnly) return;
    if (stan.rola === 'p2') {
      miejsce.append(el('button', {
        klasa: 'klawisz duzy rewanz', type: 'button',
        naclick: () => {
          zacznijPojedynek(stan.ksywka, { ...stan.ustawienia }, 'turniej-wynik');
        },
      }, [
        el('span', { klasa: 'klawisz-emoji', 'aria-hidden': 'true', tekst: '🗡️' }),
        el('span', { klasa: 'klawisz-tresc' }, [
          el('strong', { tekst: 'Rewanż' }),
          el('small', { tekst: przeciwnik ? `Odwet na ${przeciwnik} — tym razem to Ty ruszasz pierwszy` : 'Odwróćcie role — tym razem to Ty ruszasz pierwszy' }),
        ]),
      ]));
    }
    miejsce.append(el('button', {
      klasa: 'klawisz', type: 'button',
      tekst: 'Wyzwij ponownie',
      naclick: () => { location.hash = '#/turniej'; },
    }));
  }

  function adresPojedynku(id) {
    const adres = new URL(location.href);
    adres.hash = `#/turniej/${id}`;
    return adres.toString();
  }

  /* ------------------------------------------------------------ tablica wyników */

  async function pokazRanking() {
    pokazEkran('turniej-tworzenie');
    $('#turniej-tworzenie-opis').textContent = 'Wczytuję tablicę wyników…';
    try {
      await rysujRanking();
    } catch {
      powiadom('Nie udało się wczytać tablicy wyników — sprawdź internet i spróbuj ponownie.', 'blad');
      location.hash = '#/';
      return;
    }
    pokazEkran('turniej-ranking');
  }

  function wierszTablicy(wpis, miejsce) {
    const wiersz = el('li', {}, [
      el('span', { klasa: 'miejsce', tekst: `${miejsce}.` }),
      el('span', { klasa: 'kto-blok' }, [
        el('span', { klasa: 'kto', tekst: wpis.ksywka }),
        el('span', { klasa: 'staty-rundy', tekst: `${wpis.wygrane}/${wpis.mecze} wygranych` }),
      ]),
      el('span', { klasa: 'ile', tekst: String(wpis.punktySuma) }),
    ]);
    if (stan.adminOdblokowany) {
      wiersz.append(el('button', {
        klasa: 'usun-ksywke', type: 'button', 'aria-label': `Usuń ${wpis.ksywka} z tablicy`,
        tekst: '✕',
        naclick: async () => {
          if (!confirm(`Na pewno usunąć „${wpis.ksywka}” z tablicy wyników? Tego nie da się cofnąć z poziomu appki.`)) return;
          await ukryjKsywke(wpis.ksywka);
          await rysujRanking();
        },
      }));
    }
    return wiersz;
  }

  async function rysujRanking() {
    const tabela = await pobierzTabeleWynikow();
    const podium = wyczysc($('#turniej-podium'));
    const lista = wyczysc($('#turniej-tablica-wynikow'));

    if (!tabela.length) {
      podium.hidden = true;
      lista.append(el('li', { klasa: 'nikt-nie-trafil', tekst: 'Jeszcze nikt nie rozegrał pojedynku.' }));
      $('#turniej-admin-narzedzia').hidden = !stan.adminOdblokowany;
      return;
    }

    podium.hidden = false;
    for (const [i, miejsce] of [2, 1, 3].entries()) {
      const wpis = tabela[miejsce - 1];
      if (!wpis) continue;
      const stopien = el('div', { klasa: 'stopien', 'data-miejsce': miejsce }, [
        el('span', { klasa: 'medal', tekst: MEDALE[miejsce - 1] }),
        el('span', { klasa: 'kto', tekst: wpis.ksywka }),
        el('span', { klasa: 'ile', tekst: `${wpis.punktySuma} pkt` }),
      ]);
      stopien.style.setProperty('--i', String(i));
      podium.append(stopien);
    }

    tabela.slice(3).forEach((wpis, i) => lista.append(wierszTablicy(wpis, i + 4)));
    $('#turniej-admin-narzedzia').hidden = !stan.adminOdblokowany;
  }

  $('#turniej-ranking-wroc').addEventListener('click', () => { location.hash = '#/'; });

  $('#turniej-admin-odblokuj').addEventListener('click', async () => {
    const kod = $('#turniej-admin-kod').value;
    if (!kod) return;
    const hash = await shaHex(kod);
    if (hash !== KOD_ADMINA_HASH) {
      powiadom('Zły kod.', 'blad');
      return;
    }
    sessionStorage.setItem(KLUCZ_ADMIN_HASH, hash);
    stan.adminOdblokowany = true;
    $('#turniej-admin-kod').value = '';
    powiadom('Panel administratora odblokowany.');
    await rysujRanking();
  });

  $('#turniej-admin-czysc').addEventListener('click', async () => {
    if (!stan.adminOdblokowany) return;
    if (!confirm('Na pewno wyczyścić całą tablicę wyników Turnieju Piąteczki? Tego nie da się cofnąć.')) return;
    try {
      await wyczyscTablice();
      powiadom('Tablica wyczyszczona.');
      await rysujRanking();
    } catch {
      powiadom('Nie udało się wyczyścić tablicy.', 'blad');
    }
  });

  (async () => {
    const zapisanyHash = sessionStorage.getItem(KLUCZ_ADMIN_HASH);
    if (zapisanyHash === KOD_ADMINA_HASH) stan.adminOdblokowany = true;
  })();

  /* ------------------------------------------------------------- Firestore */

  /** Sprawdza i od razu podbija licznik pojedynków tej ksywki w bieżącym
      tygodniu (transakcyjnie, żeby dwa jednoczesne zapisy się nie
      pogubiły). Zwraca false, gdy limit już wyczerpany — wtedy nic nie
      zapisuje. */
  async function sprawdzITykajLimitTygodniowy(ksywka) {
    const { db, f } = await baza();
    const tydzien = tydzienTygodniowy();
    const ref = f.doc(db, 'limityTygodniowe', `${kluczKsywki(ksywka)}_${tydzien}`);
    return f.runTransaction(db, async (tx) => {
      const zrzut = await tx.get(ref);
      const obecnie = zrzut.exists() ? zrzut.data().pojedynki : 0;
      if (obecnie >= LIMIT_TYGODNIOWY) return false;
      if (zrzut.exists()) tx.update(ref, { pojedynki: obecnie + 1 });
      else tx.set(ref, { ksywka, tydzien, pojedynki: 1 });
      return true;
    });
  }

  async function utworzPojedynek({ ustawienia, utworca }) {
    const { db, f } = await baza();
    const ref = f.doc(f.collection(db, 'pojedynki'));
    await f.setDoc(ref, {
      utworca, ustawienia, rundyTematyP1: RUNDY_P1, rundyTematyP2: RUNDY_P2, utworzono: f.serverTimestamp(),
    });
    return ref.id;
  }

  async function pobierzPojedynek(id) {
    const { db, f } = await baza();
    const zrzut = await f.getDoc(f.doc(db, 'pojedynki', id));
    return zrzut.exists() ? zrzut.data() : null;
  }

  async function utworzGracza(id, graczId, dane) {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, 'pojedynki', id, 'gracze', graczId), { ...dane, dolaczono: f.serverTimestamp() });
  }

  async function pobierzGraczy(id) {
    const { db, f } = await baza();
    const zrzut = await f.getDocs(f.collection(db, 'pojedynki', id, 'gracze'));
    return zrzut.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function utworzRunde(id, indeks, dane) {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, 'pojedynki', id, 'rundy', String(indeks)), dane);
  }

  async function wczytajZbudowaneRundy(id) {
    const { db, f } = await baza();
    const zrzut = await f.getDocs(f.collection(db, 'pojedynki', id, 'rundy'));
    for (const dok of zrzut.docs) stan.rundy[Number(dok.id)] = dok.data();
  }

  async function utworzRuch(id, graczId, numerRuchu, dane) {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, 'pojedynki', id, 'gracze', graczId, 'ruchy', String(numerRuchu)), {
      ...dane, ukonczono: f.serverTimestamp(),
    });
  }

  /** Bezpośrednie "szturchnięcie" przeciwnika przyciskiem Powiadom gracza —
      osobny, natychmiastowy zapis, który po stronie serwera obsługuje
      Cloud Function naProsbePowiadomienia (functions/index.js). Niezależne
      od automatycznego powiadomienia po zapisaniu ruchu (naRuchWTurnieju),
      bo tu akurat żaden nowy ruch nie powstaje — czekamy na cudzy. */
  async function utworzProsbe(id, odRoli) {
    const { db, f } = await baza();
    await f.setDoc(f.doc(f.collection(db, 'pojedynki', id, 'prosby')), {
      od: odRoli, wyslano: f.serverTimestamp(),
    });
  }

  async function pobierzRuchy(id, graczId) {
    const { db, f } = await baza();
    const zrzut = await f.getDocs(f.collection(db, 'pojedynki', id, 'gracze', graczId, 'ruchy'));
    return zrzut.docs
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((d) => d.data());
  }

  async function pobierzResetId() {
    const { db, f } = await baza();
    const zrzut = await f.getDoc(f.doc(db, 'config', 'turniejReset'));
    return zrzut.exists() ? zrzut.data().resetId : null;
  }

  async function zapiszWynikTurnieju(pojedynekId, { p1, p2, wynikP1, wynikP2, zwyciezca }) {
    const { db, f } = await baza();
    const resetId = await pobierzResetId();
    await f.setDoc(f.doc(db, 'rankingTurnieju', pojedynekId), {
      pojedynekId,
      p1Ksywka: p1.ksywka, p2Ksywka: p2.ksywka,
      p1Punkty: wynikP1.punkty, p2Punkty: wynikP2.punkty,
      zwyciezca, resetId: resetId || null, zakonczono: f.serverTimestamp(),
    });
  }

  async function pobierzTabeleWynikow() {
    const { db, f } = await baza();
    const [zrzutMeczow, zrzutUkrytych, aktualnyReset] = await Promise.all([
      f.getDocs(f.collection(db, 'rankingTurnieju')),
      f.getDocs(f.collection(db, 'ukryteKsywki')),
      pobierzResetId(),
    ]);
    const ukryte = new Set(zrzutUkrytych.docs.map((d) => d.id));
    const agregat = new Map();
    for (const dok of zrzutMeczow.docs) {
      const mecz = dok.data();
      if (aktualnyReset && mecz.resetId !== aktualnyReset) continue;
      for (const [ksywka, punkty, wygral] of [
        [mecz.p1Ksywka, mecz.p1Punkty, mecz.zwyciezca === 'p1'],
        [mecz.p2Ksywka, mecz.p2Punkty, mecz.zwyciezca === 'p2'],
      ]) {
        const klucz = kluczKsywki(ksywka);
        if (ukryte.has(klucz)) continue;
        const wpis = agregat.get(klucz) || { ksywka, mecze: 0, wygrane: 0, punktySuma: 0 };
        wpis.mecze += 1;
        if (wygral) wpis.wygrane += 1;
        wpis.punktySuma += punkty;
        agregat.set(klucz, wpis);
      }
    }
    return [...agregat.values()].sort(
      (a, b) => b.wygrane - a.wygrane || b.punktySuma - a.punktySuma || a.ksywka.localeCompare(b.ksywka, 'pl'),
    );
  }

  async function ukryjKsywke(ksywka) {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, 'ukryteKsywki', kluczKsywki(ksywka)), { ksywka, kodHash: KOD_ADMINA_HASH });
  }

  async function wyczyscTablice() {
    const { db, f } = await baza();
    await f.setDoc(f.doc(db, 'config', 'turniejReset'), { resetId: crypto.randomUUID(), kodHash: KOD_ADMINA_HASH });
  }

  window.addEventListener('beforeunload', () => odtwarzacz.uciszWszystko());

  return { pokazNowe, pokazDolacz, pokazRanking };
}
