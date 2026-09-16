/* ==========================================================================
   Wybór noszonego przydomka. Gdy gracz łapie się na kilka, może sam wskazać,
   który nosi. Wybór jest wspólny (leci do wszystkich przez `baza.zapiszWybor`),
   a „Auto” wraca na tryb automatyczny (appka wystawia najlepszy).
   ========================================================================== */

import { godlo } from './tytuly.js';
import { bez } from './ui.js';
import { zapiszWybor } from './baza.js';

/** HTML listy trafionych przydomków. Przy dwóch i więcej robi się z niej
    wybieralna lista z opcją „Auto”. `reczny` mówi, czy noszony jest z wyboru. */
export function listaWyboru({ id, trafione, noszonyId, reczny }) {
  const wybieralne = trafione.length >= 2;

  const wiersz = (p, nosze, tag) => {
    const tresc = `
      ${godlo(p ? p.id : null, { rozmiar: 40 })}
      <span class="moje-tresc"><b>${p ? bez(p.nazwa) : 'Auto (najlepszy)'}</b>
        <em>${p ? bez(p.opis) : 'Appka sama wystawia najwyższy przydomek, jaki masz.'}</em></span>
      ${nosze ? '<span class="moje-znacznik">nosisz</span>'
              : (tag ? `<span class="moje-tag">${tag}</span>` : '')}`;
    return `<li class="${nosze ? 'noszony' : ''}">${wybieralne
      ? `<button type="button" data-nosze="${p ? p.id : ''}" data-kto="${id}">${tresc}</button>`
      : `<div class="moje-statyczny">${tresc}</div>`}</li>`;
  };

  const auto = wybieralne ? wiersz(null, !reczny, '') : '';
  const items = trafione.map((p) =>
    wiersz(p, reczny && p.id === noszonyId, (!reczny && p.id === noszonyId) ? 'teraz' : '')).join('');

  return `${wybieralne
    ? '<p class="wybor-info">👇 Dotknij, który chcesz nosić. „Auto” zawsze wystawia najlepszy, jaki masz.</p>'
    : ''}
    <ul class="moje-przydomki ${wybieralne ? 'moje-wybor' : ''}">${auto}${items}</ul>`;
}

/** Podpina kliknięcia wyboru w otwartym arkuszu. `poWyborze` przerysowuje go
    świeżym stanem, bo arkusz wisi obok ekranu i sam się nie odświeży. */
export function podepnijWybor(el, poWyborze) {
  el?.querySelectorAll('[data-nosze]').forEach((b) =>
    b.addEventListener('click', async () => {
      await zapiszWybor(b.dataset.kto, b.dataset.nosze || null);
      poWyborze();
    }));
}
