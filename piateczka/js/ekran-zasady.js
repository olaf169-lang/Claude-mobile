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

export function render(kontener) {
  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Zasady</h1>
      <p class="podtytul">Najważniejsze na górze. Szczegóły rozwijasz, gdy zechcesz.</p>
    </div>

    <section class="karta karta-esencja">
      <h2 class="karta-tytul">W 20 sekund</h2>
      <ol class="esencja">
        <li><span><b>Gracie trzy mecze.</b> Co wieczór każdy zagra z każdym w parze — składy ustawia
          appka, nic nie losujecie.</span></li>
        <li><span><b>Liczy się saldo.</b> Różnica punktów z setów plus <b class="plus">+3</b> za każdy
          wygrany mecz. Im ładniej grasz, tym więcej.</span></li>
        <li><span><b>Nic nie liczycie w głowie.</b> Wpisujecie tylko wyniki setów — tabelę, formę
          i tytuły appka wylicza sama.</span></li>
      </ol>
      <p class="esencja-nota">Najlepiej po prostu zagrać pierwszy wtorek — po jednym wieczorze reszta
        wchodzi sama. A przy każdej karcie w apce jest <span class="dymek-przyklad" aria-hidden="true">i</span>
        — dotknij, a wyjaśni to, co masz akurat przed oczami.</p>
    </section>

    ${kartaSciagi()}

    <p class="zasady-drogowskaz">Chcesz wejść głębiej? Rozwiń temat, który Cię interesuje:</p>

    ${SEKCJE.map((s) => sekcjaAkord(s)).join('')}
    ${przydomkiAkord()}

    <p class="stopka-zasady">Nie musicie znać wszystkiego na pamięć — od tego jest ta appka.
    Wpiszcie pierwszy wynik i grajcie.</p>`;
}

function sekcjaAkord(s) {
  return `<details class="karta akord">
    <summary class="akord-glowa">
      <span class="akord-godlo" aria-hidden="true">${s.godlo}</span>
      <span class="akord-tytul"><b>${s.nazwa}</b><em>${s.wstep}</em></span>
      <span class="akord-chevron" aria-hidden="true">\u203a</span>
    </summary>
    <div class="akord-tresc">
      ${s.hasla.map((k) => haslo(k)).join('')}
    </div>
  </details>`;
}

function przydomkiAkord() {
  return `<details class="karta akord">
    <summary class="akord-glowa">
      <span class="akord-godlo" aria-hidden="true">\ud83c\udf96\ufe0f</span>
      <span class="akord-tytul"><b>Dziewięć przydomków</b><em>Za co Big Boss dostaje swoją ksywkę</em></span>
      <span class="akord-chevron" aria-hidden="true">\u203a</span>
    </summary>
    <div class="akord-tresc">
      <p class="sekcja-wstep">Przydomek nie jest losowy — opisuje, czym wygrałeś miesiąc. Appka sprawdza
      warunki po kolei, od najrzadszego do najzwyklejszego, i przyznaje pierwszy pasujący.</p>
      <ol class="lista-przydomkow">
        ${PRZYDOMKI.map((p, i) => `<li>
          <span class="mini-godlo">${godlo(p.id, { rozmiar: 44 })}</span>
          <div>
            <b>${i + 1}. ${p.nazwa}</b> <em>\u2014 ${p.haslo}</em>
            <p>${p.opis}</p>
          </div>
        </li>`).join('')}
      </ol>
    </div>
  </details>`;
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
        <tr><th>Przy 15:15</th><td>gramy na przewagę dwóch punktów: 17:15, 21:19…</td></tr>
        <tr><th>Wieczór</th><td>3 mecze — każdy gra z każdym w parze dokładnie raz</td></tr>
        <tr><th>Punkty</th><td>saldo = zdobyte − stracone, w każdym secie</td></tr>
        <tr><th>Bonus</th><td>+3 do salda za wygrany mecz, dla obu z wygranej pary</td></tr>
        <tr><th>Wygrana</th><td>więcej setów; przy 1:1 decyduje różnica punktów</td></tr>
        <tr><th>MVP</th><td>najlepsze saldo wieczoru</td></tr>
        <tr><th>Big Boss</th><td>najlepsze saldo miesiąca + przydomek</td></tr>
        <tr><th>Nieobecność</th><td>0 punktów — nie zyskujesz i nie tracisz</td></tr>
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
