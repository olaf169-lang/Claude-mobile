/* ==========================================================================
   Ekran „Zasady” — wszystko w jednym miejscu.

   Nie ma tu ani jednego zdania napisanego osobno: treść składa się z tych
   samych haseł, które wyskakują po dotknięciu ⓘ na ekranach. Dopisujesz
   regułę w pomoc.js i pojawia się w obu miejscach naraz.
   ========================================================================== */

import { POMOC, SEKCJE } from './pomoc.js';
import { PRZYDOMKI, godlo } from './tytuly.js';
import { FORMATY, SEZON, GRACZE } from './dane.js';
import { arkusz } from './ui.js';

export function render(kontener, ctx) {
  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Zasady</h1>
      <p class="podtytul">Cały regulamin Turnieju Pana Piąteczki</p>
    </div>

    <nav class="spis" aria-label="Spis treści">
      ${SEKCJE.map((s) => `<a href="#/zasady/${s.id}" data-skok="${s.id}">
        <span aria-hidden="true">${s.godlo}</span>${s.nazwa}</a>`).join('')}
      <a href="#/zasady/sciaga" data-skok="sciaga"><span aria-hidden="true">⚡</span>Ściąga na halę</a>
    </nav>

    ${kartaSciagi()}

    ${SEKCJE.map((s) => `
      <section class="karta karta-sekcja" id="zasady-${s.id}">
        <h2 class="karta-tytul sekcja-tytul"><span aria-hidden="true">${s.godlo}</span> ${s.nazwa}</h2>
        <p class="sekcja-wstep">${s.wstep}</p>
        ${s.hasla.map((k) => haslo(k)).join('')}
      </section>`).join('')}

    <section class="karta karta-sekcja" id="zasady-przydomki">
      <h2 class="karta-tytul sekcja-tytul"><span aria-hidden="true">🎖️</span> Dziewięć przydomków</h2>
      <p class="sekcja-wstep">Big Boss nosi przydomek opisujący, czym wygrał swój miesiąc.
      Warunki sprawdzane są w tej kolejności — pierwszy pasujący wygrywa.</p>
      <ol class="lista-przydomkow">
        ${PRZYDOMKI.map((p, i) => `<li>
          <span class="mini-godlo">${godlo(p.id, { rozmiar: 44 })}</span>
          <div>
            <b>${i + 1}. ${p.nazwa}</b> <em>— ${p.haslo}</em>
            <p>${p.opis}</p>
          </div>
        </li>`).join('')}
      </ol>
    </section>

    <p class="stopka-zasady">Coś jest niejasne albo chcecie zmienić regułę? Wszystko siedzi w jednym
    pliku i da się poprawić w pięć minut — razem z tym, co widzisz na ekranach.</p>`;

  kontener.querySelectorAll('[data-skok]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById(`zasady-${el.dataset.skok}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function haslo(klucz) {
  const h = POMOC[klucz];
  if (!h) return '';
  return `<article class="haslo" id="haslo-${klucz}">
    <h3>${h.tytul}</h3>
    ${h.tresc}
  </article>`;
}

function kartaSciagi() {
  return `<section class="karta karta-sciaga" id="zasady-sciaga">
    <h2 class="karta-tytul sekcja-tytul"><span aria-hidden="true">⚡</span> Ściąga na halę</h2>
    <table class="sciaga">
      <tbody>
        <tr><th>Format</th><td>${FORMATY['3x15'].nazwa} — tak samo w deblu i w singlu</td></tr>
        <tr><th>Wieczór</th><td>3 mecze — każdy gra z każdym w parze dokładnie raz</td></tr>
        <tr><th>Punkty</th><td>saldo = zdobyte − stracone, w każdym secie</td></tr>
        <tr><th>Wygrana</th><td>więcej setów; przy 1:1 decyduje saldo</td></tr>
        <tr><th>MVP</th><td>najlepsze saldo wieczoru</td></tr>
        <tr><th>Big Boss</th><td>najlepsze saldo miesiąca + przydomek</td></tr>
        <tr><th>Nieobecność</th><td>0 punktów — czyli dokładnie tyle, co średnia</td></tr>
        <tr><th>Trzech graczy</th><td>single każdy z każdym, liczy się normalnie</td></tr>
        <tr><th>Gość</th><td>gra i ma saldo, ale poza tabelą i poza ELO</td></tr>
        <tr><th>Koniec sezonu</th><td>Puchar Pana Piąteczki — single, ${SEZON.final.split('-').reverse().join('.')}</td></tr>
      </tbody>
    </table>
  </section>`;
}

/** Otwiera pojedyncze hasło w arkuszu — używane przez dymki ⓘ na innych ekranach. */
export function pokazHaslo(klucz) {
  const h = POMOC[klucz];
  if (!h) return;
  arkusz({
    tytul: h.tytul,
    tresc: h.tresc,
    stopka: `<a class="btn btn-obrys" href="#/zasady/${sekcjaHasla(klucz)}" data-zamknij>Cała instrukcja</a>`,
  });
}

function sekcjaHasla(klucz) {
  return SEKCJE.find((s) => s.hasla.includes(klucz))?.id ?? '';
}
