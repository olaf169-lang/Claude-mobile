/* ==========================================================================
   Ekran „Kalendarz” — plan sezonu i to, co faktycznie zagraliście.

   Plan jest umowny: obok zaplanowanych wtorków pokazujemy każdy wieczór
   dopisany w innym terminie.
   ========================================================================== */

import { wtorkiSezonu, poPolsku, dzisiajIso, nazwaMiesiaca, gracz } from './dane.js';
import { wieczorRozegrany, mvpWieczoru, mecze, trybyWieczoru } from './liczenie.js';
import { zamkniety } from './zamek.js';
import { naglowekZPomoca } from './pomoc.js';
import { bez } from './ui.js';

export function render(kontener, ctx) {
  const dzis = dzisiajIso();
  const zaplanowane = wtorkiSezonu();
  const wpisane = new Map(ctx.wieczory.map((w) => [w.data, w]));

  const pozaplanem = ctx.wieczory
    .filter((w) => !zaplanowane.some((t) => t.data === w.data))
    .map((w) => ({ data: w.data, wolne: null, runda: null, dodatkowy: true }));

  const wszystkie = [...zaplanowane, ...pozaplanem].sort((a, b) => a.data.localeCompare(b.data));
  const miesiace = new Map();
  for (const t of wszystkie) {
    const klucz = t.data.slice(0, 7);
    if (!miesiace.has(klucz)) miesiace.set(klucz, []);
    miesiace.get(klucz).push(t);
  }

  const rozegranych = ctx.wieczory.filter(wieczorRozegrany).length;

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Kalendarz</h1>
      <p class="podtytul">${rozegranych} z ${zaplanowane.filter((t) => !t.wolne).length} planowanych wtorków</p>
    </div>

    <section class="karta">
      ${naglowekZPomoca('Terminy są umowne', 'kalendarz')}
      <p class="wskazowka">Nie zagracie w każdy wtorek i nic się nie stanie — opuszczony termin nie
      kosztuje w tabeli ani jednego punktu. Możesz też dopisać wieczór w dowolnym innym dniu.</p>
    </section>

    ${[...miesiace].map(([klucz, dni]) => `
      <section class="karta">
        <h2 class="karta-tytul">${nazwaMiesiaca(klucz)}</h2>
        <ul class="kalendarz">
          ${dni.map((t) => wiersz(t, wpisane.get(t.data), dzis)).join('')}
        </ul>
      </section>`).join('')}`;

  kontener.querySelectorAll('[data-idz]').forEach((el) => el.addEventListener('click', () => {
    ctx.przejdzDoWieczoru(el.dataset.idz);
  }));
}

function wiersz(termin, wieczor, dzis) {
  const rozegrany = wieczor && wieczorRozegrany(wieczor);
  let stan = 'plan', opis = 'Zaplanowany';

  if (termin.wolne) { stan = 'wolne'; opis = termin.wolne; }
  else if (rozegrany) {
    const mvp = mvpWieczoru(wieczor);
    stan = wieczor.towarzyski ? 'towarzyski' : 'rozegrany';
    const rodzaje = trybyWieczoru(wieczor).map((t) => t.nazwa.toLowerCase()).join(' + ');
    opis = wieczor.towarzyski
      ? `Towarzyski · ${mecze(wieczor).length} mecze`
      : mvp ? `MVP: ${bez(gracz(mvp.gracze[0]).imie)} (${mvp.wygrane} W) · ${rodzaje}` : `Rozegrany · ${rodzaje}`;
  } else if (wieczor) { stan = 'zaczety'; opis = 'Zaczęty — brak wyników'; }
  else if (termin.data < dzis) { stan = 'przepadl'; opis = 'Nie graliśmy'; }
  else if (termin.data === dzis) { stan = 'dzis'; opis = 'Dzisiaj!'; }

  if (termin.dodatkowy && stan !== 'wolne') opis += ' · termin dodatkowy';
  const zamek = zamkniety(wieczor);

  return `<li class="termin termin-${stan} ${zamek ? 'termin-zamkniety' : ''}">
    <button type="button" data-idz="${termin.data}" ${termin.wolne ? 'disabled' : ''}>
      <span class="termin-data">${poPolsku(termin.data).replace(/ \d{4}$/, '')}</span>
      <span class="termin-opis">${opis}${zamek ? ' · zapisany' : ''}</span>
      <span class="termin-znak" aria-hidden="true">${zamek ? '🔒' : {
        rozegrany: '✓', towarzyski: '≈', wolne: '—', dzis: '●', zaczety: '…', przepadl: '·', plan: '›',
      }[stan]}</span>
    </button>
  </li>`;
}
