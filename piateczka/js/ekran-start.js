/* ==========================================================================
   Ekran startowy — co się dzieje teraz i skrót do wpisania wyniku.
   ========================================================================== */

import { GRACZE, gracz, SEZON, poPolsku, najblizszyWtorek, dzisiajIso, krotkaData } from './dane.js';
import { klasyfikacja, wieczorRozegrany, mvpWieczoru } from './liczenie.js';
import { graczMiesiaca, godlo } from './tytuly.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { zeZnakiem, klasaSalda, bez } from './ui.js';
import { kolorGracza } from './wykresy.js';

const KAFELKI = [
  { href: '#/tabela',    ikona: '📊', nazwa: 'Tabela',    opis: 'Kto prowadzi w lidze' },
  { href: '#/elo',       ikona: '🏸', nazwa: 'ELO',       opis: 'Twoja forma i siła gry' },
  { href: '#/tytuly',    ikona: '🏆', nazwa: 'Tytuły',    opis: 'MVP, Gracz Miesiąca, Puchar' },
  { href: '#/kalendarz', ikona: '📅', nazwa: 'Kalendarz', opis: 'Terminy i wyniki' },
  { href: '#/zasady',    ikona: '📖', nazwa: 'Zasady',    opis: 'Jak to działa' },
];

export function render(kontener, ctx) {
  const rozegrane = ctx.wieczory.filter(wieczorRozegrany);
  const ostatni = rozegrane.filter((w) => !w.towarzyski)
    .sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;
  const mvp = ostatni ? mvpWieczoru(ostatni) : null;
  const tabela = klasyfikacja(ctx.wieczory.filter((w) => !w.towarzyski));
  const { aktualny, wToku } = graczMiesiaca(ctx.wieczory);
  const boss = aktualny ?? (wToku?.zwyciezca ? wToku : null);
  const dzis = dzisiajIso();
  const nastepny = najblizszyWtorek();

  kontener.innerHTML = `
    <section class="hero">
      <p class="hero-nad">Sezon ${SEZON.nazwa}</p>
      <h1 class="hero-nazwa">Turniej<br>Pana Piąteczki</h1>
      <p class="hero-pod">Liga czterech graczy w badmintona. Sprawdź formę, pokonaj rywali i sięgnij po Puchar Pana Piąteczki.</p>
      <div class="hero-akcje">
        <a class="btn btn-glowny" href="#/wieczor">${nastepny === dzis ? 'Gramy dziś — wpisz wynik' : 'Wpisz wynik'}</a>
        <a class="btn btn-obrys" href="#/zasady">Jak to działa</a>
      </div>
      <p class="hero-termin">${nastepny === dzis
        ? 'Dziś wtorek — miłego grania.'
        : `Najbliższy wtorek: <b>${poPolsku(nastepny)}</b>`}</p>
    </section>

    ${kartaCzworki(tabela, ctx.ja)}
    ${boss ? kartaBossa(boss, !aktualny) : ''}
    ${mvp ? kartaMvp(ostatni, mvp) : ''}

    <nav class="kafelki">
      ${KAFELKI.map((k) => `<a class="kafel" href="${k.href}">
        <span class="kafel-ikona" aria-hidden="true">${k.ikona}</span>
        <b>${k.nazwa}</b><em>${k.opis}</em></a>`).join('')}
    </nav>

    <section class="karta karta-ja">
      <h2 class="karta-tytul">Kim jesteś? ${dymek('ktowpisuje')}</h2>
      <div class="chipy">
        ${GRACZE.map((g) => `<button class="chip ${ctx.ja === g.id ? 'wybrany' : ''}" type="button"
          data-ja="${g.id}">${g.imie}</button>`).join('')}
      </div>
      <p class="wskazowka">Służy tylko do podświetlenia Twojego wiersza w tabeli. Wpisywać może każdy.</p>
    </section>`;

  kontener.querySelectorAll('[data-ja]').forEach((el) =>
    el.addEventListener('click', () => ctx.ustawJa(el.dataset.ja)));
}

function kartaCzworki(tabela, ja) {
  const cokolwiek = tabela.some((r) => r.mecze > 0);
  return `<section class="karta">
    ${naglowekZPomoca('Klasyfikacja', 'saldo', { dodatek: '<a class="naglowek-link" href="#/tabela">pełna tabela</a>' })}
    ${cokolwiek ? `<ol class="tabela tabela-skrot">
      ${tabela.map((r) => `<li class="wiersz ${r.id === ja ? 'to-ja' : ''} podium-${r.miejsce <= 3 ? r.miejsce : 'x'}">
        <span class="miejsce">${r.miejsce}</span>
        <span class="kropka-serii" style="background:${kolorGracza(r.id)}" aria-hidden="true"></span>
        <span class="wiersz-glowna"><span class="wiersz-imie">${gracz(r.id).imie}</span></span>
        <span class="wiersz-saldo ${klasaSalda(r.saldo)}">${zeZnakiem(r.saldo)}</span>
      </li>`).join('')}
    </ol>` : `<p class="pusto">Sezon jeszcze się nie zaczął. Pierwszy wynik wpiszecie na ekranie
      <a href="#/wieczor">Wieczór</a>.</p>`}
  </section>`;
}

function kartaBossa(okres, biezacy) {
  return `<section class="karta karta-boss-mini">
    <div class="boss-godlo">${godlo(okres.przydomek.id, { rozmiar: 58, reign: true })}</div>
    <div class="boss-opis">
      <span class="plakietka-etykieta">Gracz Miesiąca${biezacy ? ' — na żywo' : ''} ${dymek('bigboss')}</span>
      <strong>${gracz(okres.zwyciezca.id).imie} „${okres.przydomek.nazwa}”</strong>
      <span class="cichy">${biezacy ? 'prowadzi · ' : ''}${okres.nazwa} · ${zeZnakiem(okres.zwyciezca.saldo)}</span>
    </div>
    <a class="naglowek-link" href="#/tytuly">więcej</a>
  </section>`;
}

function kartaMvp(wieczor, mvp) {
  return `<section class="karta karta-mvp-mini">
    <div class="boss-opis">
      <span class="plakietka-etykieta">MVP ${krotkaData(wieczor.data)} ${dymek('mvp')}</span>
      <strong>${mvp.gracze.map((i) => bez(gracz(i).imie)).join(' i ')}</strong>
      <span class="cichy">saldo ${zeZnakiem(mvp.saldo)}</span>
    </div>
    <a class="naglowek-link" href="#/wieczor">wieczór</a>
  </section>`;
}
