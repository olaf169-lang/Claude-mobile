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

/* --- role --- */

let prowadzacyWczytany = null;
let graczWczytany = null;

async function wejdzJakoProwadzacy() {
  prowadzacyWczytany ??= import('./prowadzacy.js').then((m) => m.uruchom());
  await prowadzacyWczytany;
}

async function wejdzJakoGracz(kod = '', broker = null) {
  graczWczytany ??= import('./gracz.js').then((m) => m.uruchom());
  const gracz = await graczWczytany;
  gracz.pokazFormularz(kod, broker);
}

$('#rola-prowadzacy')?.addEventListener('click', () => { location.hash = '#/prowadze'; });
$('#rola-gracz')?.addEventListener('click', () => { location.hash = '#/dolacz'; });

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
