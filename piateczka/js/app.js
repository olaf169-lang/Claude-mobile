/* ==========================================================================
   Turniej Pana Piąteczki: wejście do aplikacji.

   Routing po hashu, jeden nasłuch na bazę, jeden delegowany listener na
   wszystkie dymki ⓘ. Ekrany są głupie: dostają kontener i kontekst,
   rysują HTML od nowa i podpinają swoje przyciski.
   ========================================================================== */

import * as baza from './baza.js';
import { $, zapamietajSkupienie, przywrocSkupienie, komunikat, zamknijArkusz } from './ui.js';
import { pokazHaslo } from './ekran-zasady.js';
import * as start from './ekran-start.js';
import * as wieczor from './ekran-wieczor.js';
import * as tabela from './ekran-tabela.js';
import * as elo from './ekran-elo.js';
import * as tytuly from './ekran-tytuly.js';
import * as kalendarz from './ekran-kalendarz.js';
import * as zasady from './ekran-zasady.js';
import * as podsumowanie from './ekran-podsumowanie.js';
import * as sedzia from './ekran-sedzia.js';

const EKRANY = {
  '':          { modul: start,     nazwa: 'Start' },
  'wieczor':   { modul: wieczor,   nazwa: 'Wieczór' },
  'tabela':    { modul: tabela,    nazwa: 'Tabela' },
  'elo':       { modul: elo,       nazwa: 'ELO' },
  'tytuly':    { modul: tytuly,    nazwa: 'Tytuły' },
  'kalendarz': { modul: kalendarz, nazwa: 'Kalendarz' },
  'zasady':    { modul: zasady,    nazwa: 'Zasady' },
  'podsumowanie': { modul: podsumowanie, nazwa: 'Podsumowanie' },
  'sedzia':    { modul: sedzia,    nazwa: 'Sędzia' },
};

const KLUCZ_JA = 'pp:ja';
const KLUCZ_PODPOWIEDZ = 'pp:widzialDymki';

let aktualny = '';
let daneWieczorow = [];
let stanLacza = 'laczenie';

const kontekst = () => ({
  wieczory: daneWieczorow,
  wybory: baza.wybory(),
  stan: stanLacza,
  ja: localStorage.getItem(KLUCZ_JA),
  odswiez: () => rysuj(),
  ustawJa: (id) => {
    const teraz = localStorage.getItem(KLUCZ_JA);
    if (teraz === id) localStorage.removeItem(KLUCZ_JA);
    else localStorage.setItem(KLUCZ_JA, id);
    rysuj();
  },
  przejdzDoWieczoru: (data) => {
    wieczor.ustawDate(data);
    location.hash = '#/wieczor';
  },
  przejdzDoSedziego: (data, nr) => {
    sedzia.ustawMecz(data, nr);
    location.hash = '#/sedzia';
  },
});

/* ------------------------------------------------------------- routing */

function trasa() {
  const [sciezka] = location.hash.replace(/^#\/?/, '').split('?');
  const [glowna, kotwica] = sciezka.split('/');
  return { ekran: glowna in EKRANY ? glowna : '', kotwica };
}

function rysuj() {
  const { ekran, kotwica } = trasa();
  const zmianaEkranu = ekran !== aktualny;
  aktualny = ekran;
  const kontener = $('#tresc');
  const skupienie = zmianaEkranu ? null : zapamietajSkupienie();

  kontener.innerHTML = '';
  const ctx = kontekst();
  ctx.kotwica = kotwica;
  try {
    EKRANY[ekran].modul.render(kontener, ctx);
  } catch (blad) {
    console.error(blad);
    kontener.innerHTML = `<section class="karta"><h2 class="karta-tytul">Coś się posypało</h2>
      <p class="wskazowka">${blad.message}</p></section>`;
  }

  odswiezNawigacje(ekran);
  przywrocSkupienie(skupienie);
  if (zmianaEkranu) {
    if (ekran === 'zasady' && kotwica) {
      document.getElementById(`zasady-${kotwica}`)?.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }
}

function odswiezNawigacje(ekran) {
  document.querySelectorAll('.dol a').forEach((a) => {
    const cel = a.getAttribute('href').replace(/^#\/?/, '').split('/')[0];
    a.classList.toggle('aktywny', cel === ekran);
    a.setAttribute('aria-current', cel === ekran ? 'page' : 'false');
  });
}

/* ---------------------------------------------------------------- łącze */

function odswiezLacze() {
  const el = $('#stan-lacza');
  if (!el) return;
  const opisy = {
    laczenie: ['…', 'Łączę się z bazą wyników'],
    online:   ['●', 'Na żywo, wszyscy widzą to samo'],
    lokalnie: ['●', 'Tryb lokalny, wyniki wyślą się, gdy wróci sieć'],
  };
  const [znak, tytul] = opisy[stanLacza] ?? opisy.laczenie;
  el.textContent = znak;
  el.title = tytul;
  el.setAttribute('aria-label', tytul);
  el.className = `lacze lacze-${stanLacza}`;
}

/* ------------------------------------------------------------- podpięcia */

// Jeden listener na wszystkie dymki ⓘ w całej aplikacji.
document.addEventListener('click', (e) => {
  const dymek = e.target.closest('[data-pomoc]');
  if (dymek) {
    e.preventDefault();
    e.stopPropagation();
    pokazHaslo(dymek.dataset.pomoc);
    return;
  }
  const link = e.target.closest('.arkusz a[href^="#/"]');
  if (link) zamknijArkusz();
});

// Enter/spacja na wierszu tabeli (rola button, ale to <li>).
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][tabindex]')) {
    e.preventDefault();
    e.target.click();
  }
});

$('#przelacz-motyw')?.addEventListener('click', () => {
  const jasny = document.documentElement.dataset.motyw === 'jasny';
  document.documentElement.dataset.motyw = jasny ? 'ciemny' : 'jasny';
  localStorage.setItem('pp:motyw', document.documentElement.dataset.motyw);
});

window.addEventListener('hashchange', () => { zamknijArkusz(); rysuj(); });

baza.nasluchuj((wieczory, stan) => {
  daneWieczorow = wieczory;
  stanLacza = stan;
  odswiezLacze();
  rysuj();
});

/* Pierwsze wejście: powiedz wprost, że te kółeczka ⓘ są klikalne. */
if (!localStorage.getItem(KLUCZ_PODPOWIEDZ)) {
  setTimeout(() => {
    komunikat('Widzisz ⓘ przy nagłówku? Dotknij, a wytłumaczy, co jest na ekranie.');
    localStorage.setItem(KLUCZ_PODPOWIEDZ, '1');
  }, 1200);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
