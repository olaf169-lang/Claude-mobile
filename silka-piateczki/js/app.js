// Siłka Piąteczki: przełączanie ekranów i rejestracja trybu offline.

import { pobierz } from './magazyn.js';
import { ekranStart } from './ekran-start.js';
import { ekranTrening } from './ekran-trening.js';
import { ekranRozciaganie } from './ekran-rozciaganie.js';
import { ekranPostepy } from './ekran-postepy.js';
import { zglosTrening } from './przypomnienia.js';

const EKRANY = {
  start: ekranStart,
  trening: ekranTrening,
  rozciaganie: ekranRozciaganie,
  postepy: ekranPostepy,
};

const ekran = document.getElementById('ekran');

function pokaz() {
  const trasa = (location.hash.match(/^#\/(\w+)/) || [])[1];
  const nazwa = EKRANY[trasa] ? trasa : 'start';
  ekran.onclick = null;
  ekran.onchange = null;
  ekran.onfocusin = null;
  document.querySelectorAll('.zaslona, .arkusz').forEach((x) => x.remove());
  EKRANY[nazwa](ekran);
  document.querySelectorAll('.nawigacja a').forEach((a) => {
    if (a.dataset.trasa === nazwa) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  // Zielona kropka przy „Trening”, gdy trening jest w toku.
  const t = document.querySelector('[data-trasa="trening"]');
  t.querySelector('.kropka-aktywny')?.remove();
  if (pobierz().aktywny) t.insertAdjacentHTML('beforeend', '<i class="kropka-aktywny" aria-label="trening w toku"></i>');
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', pokaz);
pokaz();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Serwer od przypomnień dostaje datę ostatniego treningu (gdy push włączony).
const daty = pobierz().treningi.map((t) => t.data).sort();
zglosTrening(daty[daty.length - 1]);
