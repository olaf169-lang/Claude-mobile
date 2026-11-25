// Momenty nagrody: rekord w trakcie treningu i podsumowanie po treningu.
// Koks pręży się na pełnym ekranie, a z góry lecą tarcze.

import { rysujKoksa, animujKoksa } from './koks.js';
import { esc, dzwiek, wibruj, godloOdznaki } from './ui.js';
import { ODZNAKI } from './dane.js';
import { fmtKg } from './logika.js';

const KOLORY = ['var(--t-czerwona)', 'var(--t-niebieska)', 'var(--t-zolta)', 'var(--t-zielona)', 'var(--t-biala)'];

function konfetti(ile = 46) {
  const el = document.createElement('div');
  el.className = 'konfetti';
  el.setAttribute('aria-hidden', 'true');
  let html = '';
  for (let i = 0; i < ile; i++) {
    const lewo = Math.random() * 100;
    html += `<i style="left:${lewo}%;background:${KOLORY[i % 5]};--x:${Math.round((Math.random() - 0.5) * 160)}px;--r:${Math.round(360 + Math.random() * 720)}deg;--t:${(1.4 + Math.random() * 1.4).toFixed(2)}s;--o:${(Math.random() * 0.5).toFixed(2)}s;height:${14 + Math.round(Math.random() * 18)}px"></i>`;
  }
  el.innerHTML = html;
  return el;
}

function nakladka(html, klasa = '') {
  const el = document.createElement('section');
  el.className = `swieto ${klasa}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = html;
  el.prepend(konfetti());
  document.body.append(el);
  return el;
}

export function swietujRekord({ rekord, nazwa, masa }) {
  dzwiek('rekord');
  wibruj([60, 40, 60, 40, 160]);
  const el = nakladka(`
    <div class="koks" aria-hidden="true">${rysujKoksa(masa, 0)}</div>
    <p class="swieto-tytul">${esc(rekord.tytul)}!</p>
    <p class="swieto-cw">${esc(nazwa)}</p>
    <p class="swieto-opis">${esc(rekord.opis)}</p>
    <p class="cichy maly">Dotknij, żeby wrócić do treningu</p>`);
  const koks = el.querySelector('.koks');
  // Masa skacze odrobinę w górę na czas prężenia, żeby było widać „pompę”.
  animujKoksa(koks, { masa, poza: 0 }, { masa: Math.min(1, masa + 0.08), poza: 1 }, 520, { mina: 'radosc' });
  return new Promise((gotowe) => {
    const zamknij = () => { el.remove(); gotowe(); };
    el.addEventListener('click', zamknij);
    setTimeout(() => { if (el.isConnected) zamknij(); }, 3200);
  });
}

export function swietujTrening({ xp, przed, po, xpPo, nowe, rekordy, minuty, tonaz }) {
  dzwiek('rekord');
  wibruj([80, 50, 80, 50, 240]);
  const awans = po.numer > przed.numer;
  const el = nakladka(`
    <div class="koks" aria-hidden="true">${rysujKoksa(przed.masa, 0)}</div>
    <p class="swieto-tytul">Trening zaliczony</p>
    <p class="swieto-xp"><span data-xp>0</span> XP</p>
    <ul class="swieto-lista">
      ${xp.czesci.map((c) => `<li><span>${esc(c.co)}</span><b>+${c.ile}</b></li>`).join('')}
      <li><span>Czas</span><b>${minuty} min</b></li>
      ${tonaz ? `<li><span>Przerzucone</span><b>${fmtKg(Math.round(tonaz))} kg</b></li>` : ''}
    </ul>
    ${awans ? `<p class="swieto-awans">Awans! Poziom ${po.numer}: ${esc(po.nazwa)}</p>` : (po.nastepny ? `<p class="cichy maly">Do poziomu ${po.numer + 1} brakuje ${po.nastepny.prog - xpPo} XP</p>` : '')}
    ${rekordy.length ? `<p class="maly">Rekordy dziś: ${rekordy.map((r) => esc(r.nazwa)).join(', ')}</p>` : ''}
    ${nowe.length ? `<div class="swieto-odznaki">${nowe.map((o) => `<div class="odznaka">${godloOdznaki(ODZNAKI.indexOf(o))}<b>${esc(o.nazwa)}</b></div>`).join('')}</div>` : ''}
    <button class="btn btn-kreda" type="button" data-gotowe>Gotowe</button>`, 'swieto-podsumowanie');

  const liczba = el.querySelector('[data-xp]');
  const start = performance.now();
  const policz = (t) => {
    const k = Math.min(1, (t - start) / 1200);
    liczba.textContent = Math.round(xp.suma * (1 - Math.pow(1 - k, 3)));
    if (k < 1 && el.isConnected) requestAnimationFrame(policz);
  };
  requestAnimationFrame(policz);

  const koks = el.querySelector('.koks');
  animujKoksa(koks, { masa: przed.masa, poza: 0 }, { masa: po.masa, poza: 0 }, 1400)
    .then(() => animujKoksa(koks, { masa: po.masa, poza: 0 }, { masa: po.masa, poza: 1 }, 480, { mina: 'radosc' }));

  return new Promise((gotowe) => {
    el.querySelector('[data-gotowe]').addEventListener('click', () => { el.remove(); gotowe(); });
    el.querySelector('[data-gotowe]').focus({ preventScroll: true });
  });
}

export function swietujRozciaganie({ przed, po }) {
  dzwiek('koniec');
  wibruj([80, 40, 80]);
  const el = nakladka(`
    <div class="koks" aria-hidden="true">${rysujKoksa(przed.masa, 0)}</div>
    <p class="swieto-tytul">Rozciągnięty</p>
    <p class="swieto-xp">+40 XP</p>
    <p class="swieto-opis">Biodra Ci podziękują na badmintonie.</p>
    <button class="btn btn-kreda" type="button" data-gotowe>Gotowe</button>`);
  animujKoksa(el.querySelector('.koks'), { masa: przed.masa, poza: 0 }, { masa: po.masa, poza: 0.6 }, 900, { mina: 'radosc' });
  return new Promise((gotowe) => {
    el.querySelector('[data-gotowe]').addEventListener('click', () => { el.remove(); gotowe(); });
  });
}
