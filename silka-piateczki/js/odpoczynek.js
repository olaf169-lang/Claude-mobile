// Odliczanie przerwy między seriami. Liczy od godziny końca, nie od ticków,
// więc wygaszony ekran albo przełączenie apki nie psują czasu.

import { pobierz } from './magazyn.js';
import { czas, dzwiek, wibruj } from './ui.js';

const el = () => document.getElementById('odpoczynek');
let koniec = 0;
let calosc = 0;
let zegar = null;
let chowaj = null;

export function startOdpoczynku(sekundy = pobierz().ustawienia.przerwa) {
  calosc = sekundy;
  koniec = Date.now() + sekundy * 1000;
  clearTimeout(chowaj);
  el().hidden = false;
  el().classList.remove('koniec');
  el().innerHTML = `
    <div class="odpoczynek-czas"><small>Odpoczynek</small><span data-czas>${czas(sekundy)}</span></div>
    <button type="button" data-o="-15" aria-label="Krócej o 15 sekund">−15</button>
    <button type="button" data-o="15" aria-label="Dłużej o 15 sekund">+15</button>
    <button type="button" data-o="stop">Pomiń</button>
    <i class="pasek" style="width:100%"></i>`;
  clearInterval(zegar);
  zegar = setInterval(tik, 250);
  tik();
}

export function stopOdpoczynku() {
  clearInterval(zegar);
  clearTimeout(chowaj);
  if (el()) el().hidden = true;
}

function tik() {
  const zostalo = (koniec - Date.now()) / 1000;
  const e = el();
  if (!e || e.hidden) return;
  const pole = e.querySelector('[data-czas]');
  const pasek = e.querySelector('.pasek');
  if (zostalo <= 0) {
    clearInterval(zegar);
    e.classList.add('koniec');
    e.querySelector('small').textContent = 'Koniec przerwy';
    pole.textContent = 'Seria!';
    pasek.style.width = '0';
    dzwiek('koniec');
    wibruj([200, 100, 200]);
    chowaj = setTimeout(stopOdpoczynku, 6000);
    return;
  }
  pole.textContent = czas(Math.ceil(zostalo));
  pasek.style.width = `${Math.max(0, (zostalo / calosc) * 100)}%`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('#odpoczynek [data-o]');
  if (!b) return;
  if (b.dataset.o === 'stop') { stopOdpoczynku(); return; }
  const d = Number(b.dataset.o);
  koniec += d * 1000;
  calosc = Math.max(calosc + d, 1);
  if (el().classList.contains('koniec')) startOdpoczynku(Math.max(15, d));
  tik();
});
