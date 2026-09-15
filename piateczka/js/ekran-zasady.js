/* ==========================================================================
   Ekran „Zasady” — wszystko w jednym miejscu.

   Nie ma tu ani jednego zdania napisanego osobno: treść składa się z tych
   samych haseł, które wyskakują po dotknięciu ⓘ na ekranach. Dopisujesz
   regułę w pomoc.js i pojawia się w obu miejscach naraz.
   ========================================================================== */

import { POMOC, SEKCJE } from './pomoc.js';
import { PRZYDOMKI, POZIOMY, godlo } from './tytuly.js';
import { SEZON, opisFormatu, FORMAT_DOMYSLNY } from './dane.js';
import { arkusz, bez } from './ui.js';

export function render(kontener) {
  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Zasady</h1>
      <p class="podtytul">Najważniejsze na górze. Szczegóły rozwijasz, gdy zechcesz.</p>
    </div>

    <section class="karta karta-esencja">
      <h2 class="karta-tytul">W 20 sekund</h2>
      <ol class="esencja">
        <li><span><b>Liczą się zwycięstwa.</b> Wygrany mecz to wygrany mecz — 15:2 i 15:13 znaczą
          dokładnie tyle samo.</span></li>
        <li><span><b>Debel i singiel osobno.</b> Dwie tabele, dwa rankingi. Tryb bierze się sam
          z tego, ilu was stoi po stronie.</span></li>
        <li><span><b>Wpisujecie i zapisujecie.</b> Tylko wyniki setów — resztę appka liczy sama.
          Na koniec „Zapisz wieczór” i wynik jest ustalony.</span></li>
      </ol>
      <p class="esencja-nota">Najlepiej po prostu zagrać pierwszy wieczór — reszta wchodzi sama.
        A przy każdej karcie w apce jest <span class="dymek-przyklad" aria-hidden="true">i</span>
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
      <span class="akord-tytul"><b>Wszystkie przydomki</b><em>Za co się je dostaje — i za co obrywa</em></span>
      <span class="akord-chevron" aria-hidden="true">\u203a</span>
    </summary>
    <div class="akord-tresc">
      <p class="sekcja-wstep">Na starcie nikt nie ma przydomka — liczą się same z Twoich wyników.
      Zawsze nosisz ten najlepszy, na jaki się aktualnie łapiesz: złoto przykrywa srebro,
      srebro przykrywa brąz.</p>
      <ol class="lista-przydomkow">
        ${PRZYDOMKI.map((p) => `<li>
          <span class="mini-godlo">${godlo(p.id, { rozmiar: 44 })}</span>
          <div>
            <b>${bez(p.nazwa)}</b> <em>\u2014 ${bez(p.haslo)}</em>
            <span class="przydomek-poziom poziom-${p.poziom}">${POZIOMY[p.poziom].nazwa}</span>
            <p>${bez(p.opis)}</p>
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
        <tr><th>Format</th><td>${opisFormatu(FORMAT_DOMYSLNY)} — da się zmienić przy każdym meczu</td></tr>
        <tr><th>Przy 15:15</th><td>gramy na przewagę dwóch punktów: 17:15, 21:19…</td></tr>
        <tr><th>Wieczór</th><td>3 deble — każdy gra z każdym w parze dokładnie raz</td></tr>
        <tr><th>Tabela</th><td>zwycięstwa → sety → punkty → mecz bezpośredni</td></tr>
        <tr><th>Stracone punkty</th><td>nie liczą się wcale — przegrana to przegrana</td></tr>
        <tr><th>Wygrana</th><td>więcej setów; przy 1:1 decyduje suma punktów</td></tr>
        <tr><th>Singiel i debel</th><td>osobna tabela i osobne 🏸ELO🏸</td></tr>
        <tr><th>MVP</th><td>najwięcej wygranych meczów danego dnia</td></tr>
        <tr><th>Gracz Miesiąca</th><td>najwięcej wygranych w miesiącu — jego godło świeci</td></tr>
        <tr><th>Nieobecność</th><td>zero — nie zyskujesz i nie tracisz</td></tr>
        <tr><th>Zapisany wieczór</th><td>🔒 zamknięty; poprawka tylko na kod</td></tr>
        <tr><th>Dopisane osoby</th><td>grają i mają wynik dnia, ale poza tabelą i ELO</td></tr>
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
