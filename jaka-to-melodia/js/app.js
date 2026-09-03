/* ==========================================================================
   Wejście do aplikacji: motyw, adresy i rozdzielenie ról.
   Dwa tryby — prowadzący i gracz — siedzą w osobnych plikach i doczytują się
   dopiero wtedy, gdy ktoś je wybierze. Telefon gracza nie musi wciągać
   katalogu pięciuset utworów, żeby kliknąć jedną z czterech odpowiedzi.
   ========================================================================== */

import { $, pokazEkran, powiadom } from './ui.js';

/* --- motyw --- */

const przelacznikMotywu = $('#przelacz-motyw');
przelacznikMotywu?.addEventListener('click', () => {
  const jasny = document.documentElement.dataset.theme === 'jasny';
  document.documentElement.dataset.theme = jasny ? 'ciemny' : 'jasny';
  localStorage.setItem('jtm:motyw', jasny ? 'ciemny' : 'jasny');
  const kolor = getComputedStyle(document.documentElement).getPropertyValue('--tlo').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', kolor);
});

/* --- instalacja na urządzeniu ---
   beforeinstallprompt daje przycisk z prawdziwym oknem instalacji (Chrome,
   Edge, Android). iOS (Safari) tego eventu nigdy nie wywoła — tam pokazujemy
   przycisk zawsze (chyba że appka już działa jako zainstalowana) i po
   kliknięciu tłumaczymy ręczne kroki, bo natywnego okna tam nie ma. */

function jestZainstalowana() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function jestIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

let promptInstalacji = null;
const przyciskInstalacji = $('#zainstaluj-app');
if (przyciskInstalacji && !jestZainstalowana()) {
  if (jestIOS()) przyciskInstalacji.hidden = false;
  window.addEventListener('beforeinstallprompt', (zdarzenie) => {
    zdarzenie.preventDefault();
    promptInstalacji = zdarzenie;
    przyciskInstalacji.hidden = false;
  });
  window.addEventListener('appinstalled', () => { przyciskInstalacji.hidden = true; });
  przyciskInstalacji.addEventListener('click', async () => {
    if (promptInstalacji) {
      promptInstalacji.prompt();
      await promptInstalacji.userChoice;
      promptInstalacji = null;
      przyciskInstalacji.hidden = true;
      return;
    }
    powiadom('Otwórz menu udostępniania przeglądarki (ikona ze strzałką) i wybierz „Dodaj do ekranu początkowego”.');
  });
}

/* --- powiadomienia push --- */

const przyciskPowiadomien = $('#wlacz-powiadomienia');
if (przyciskPowiadomien && 'Notification' in window
  && Notification.permission === 'granted' && localStorage.getItem('jtm:powiadomieniaToken')) {
  przyciskPowiadomien.setAttribute('aria-pressed', 'true');
}
// Ksywka nie jest tu wymagana: zgoda przeglądarki i token FCM dają się
// załatwić od razu, jeszcze zanim ktoś zagra pierwszy pojedynek. Samo
// dopisanie tokenu do konkretnej ksywki w Firestore doczepia się później,
// automatycznie, gdy tylko appka się jej dowie (patrz turniej.js).
przyciskPowiadomien?.addEventListener('click', async () => {
  const { wlaczPowiadomienia } = await import('./powiadomienia.js');
  const ksywka = localStorage.getItem('jtm:ksywka') || '';
  let wlaczone = false;
  try { wlaczone = await wlaczPowiadomienia(ksywka); } catch { /* zgłoszone niżej jako niepowodzenie */ }
  if (wlaczone) {
    przyciskPowiadomien.setAttribute('aria-pressed', 'true');
    powiadom(ksywka
      ? 'Powiadomienia włączone.'
      : 'Powiadomienia włączone — dopiszemy je do Twojej ksywki, gdy zagrasz Turniej Piąteczki.');
  } else {
    powiadom('Nie udało się włączyć powiadomień — sprawdź uprawnienia przeglądarki.', 'blad');
  }
});

// Pytamy raz, przy pierwszej wizycie.
if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('jtm:powiadomieniaPytane')) {
  localStorage.setItem('jtm:powiadomieniaPytane', '1');
  setTimeout(async () => {
    if (!confirm('Włączyć powiadomienia o Turnieju Piąteczki (Twoja kolej, wynik tygodnia)?')) return;
    const { wlaczPowiadomienia } = await import('./powiadomienia.js');
    const wlaczone = await wlaczPowiadomienia(localStorage.getItem('jtm:ksywka') || '').catch(() => false);
    if (wlaczone) przyciskPowiadomien?.setAttribute('aria-pressed', 'true');
  }, 900);
}

/* --- role --- */

let prowadzacyWczytany = null;
let graczWczytany = null;
let wyzwanieWczytane = null;
let turniejWczytany = null;

async function wejdzJakoProwadzacy() {
  prowadzacyWczytany ??= import('./prowadzacy.js').then((m) => m.uruchom());
  await prowadzacyWczytany;
}

async function wejdzJakoGracz(kod = '', broker = null) {
  graczWczytany ??= import('./gracz.js').then((m) => m.uruchom());
  const gracz = await graczWczytany;
  gracz.pokazFormularz(kod, broker);
}

async function wejdzWyzwanie() {
  wyzwanieWczytane ??= import('./wyzwanie.js').then((m) => m.uruchom());
  return wyzwanieWczytane;
}

async function wejdzTurniej() {
  turniejWczytany ??= import('./turniej.js').then((m) => m.uruchom());
  return turniejWczytany;
}

$('#rola-prowadzacy')?.addEventListener('click', () => { location.hash = '#/prowadze'; });
$('#rola-gracz')?.addEventListener('click', () => { location.hash = '#/dolacz'; });
$('#rola-wyzwanie')?.addEventListener('click', () => { location.hash = '#/wyzwanie'; });
$('#rola-turniej')?.addEventListener('click', () => { location.hash = '#/turniej'; });

/* --- adresy ---
   Kod QR prowadzi pod #/dolacz/KOD/NUMER-BROKERA, więc telefon gościa od razu
   wie, gdzie się zgłosić. Wpisanie kodu ręcznie działa tak samo, tylko bez
   podpowiedzi o brokerze. */

async function obsluzAdres() {
  const sciezka = location.hash.replace(/^#\/?/, '').split('/');
  if (sciezka[0] === 'prowadze') {
    await wejdzJakoProwadzacy();
    return;
  }
  if (sciezka[0] === 'dolacz') {
    const broker = sciezka[2] === undefined ? null : Number(sciezka[2]);
    await wejdzJakoGracz((sciezka[1] || '').toUpperCase(), Number.isInteger(broker) ? broker : null);
    return;
  }
  if (sciezka[0] === 'wyzwanie') {
    const wyzwanie = await wejdzWyzwanie();
    if (sciezka[1]) await wyzwanie.pokazDolacz(sciezka[1]);
    else await wyzwanie.pokazNowe();
    return;
  }
  if (sciezka[0] === 'turniej') {
    const turniej = await wejdzTurniej();
    if (sciezka[1] === 'tablica') await turniej.pokazRanking();
    else if (sciezka[1]) await turniej.pokazDolacz(sciezka[1]);
    else await turniej.pokazNowe();
    return;
  }
  pokazEkran('start');
}

window.addEventListener('hashchange', obsluzAdres);
obsluzAdres();

/* --- praca bez sieci --- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Bez service workera aplikacja nadal działa, tylko nie chodzi offline.
    });
  });
}

window.addEventListener('unhandledrejection', (zdarzenie) => {
  const powod = zdarzenie.reason?.message || String(zdarzenie.reason || '');
  if (powod) powiadom(powod, 'blad');
});
