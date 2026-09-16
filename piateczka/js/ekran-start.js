/* ==========================================================================
   Ekran startowy: co się dzieje teraz i skrót do wpisania wyniku.
   ========================================================================== */

import { GRACZE, gracz, SEZON, poPolsku, najblizszyWtorek, dzisiajIso, krotkaData } from './dane.js';
import { klasyfikacja, wieczorRozegrany, mvpWieczoru, TRYBY } from './liczenie.js';
import { graczMiesiaca, godlo } from './tytuly.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { bez } from './ui.js';
import { kolorGracza } from './wykresy.js';
import { zapros } from './pochwal.js';

const KAFELKI = [
  { href: '#/tabela',    ikona: '📊', nazwa: 'Tabela',    opis: 'Debel i singiel osobno' },
  { href: '#/elo',       ikona: '🏸', nazwa: 'ELO',       opis: 'Forma i seria zwycięstw' },
  { href: '#/tytuly',    ikona: '🏆', nazwa: 'Tytuły',    opis: 'MVP, Gracz Miesiąca, Puchar' },
  { href: '#/kalendarz', ikona: '📅', nazwa: 'Kalendarz', opis: 'Terminy i wyniki' },
  { href: '#/zasady',    ikona: '📖', nazwa: 'Zasady',    opis: 'Jak to działa' },
];

/* Który rodzaj gry pokazuje skrót tabeli na Starcie. Przełącznik jest tu
   celowo mały, bo na Starcie chodzi o rzut oka, a pełna tabela jest obok. */
let trybSkrotu = 'debel';

export function render(kontener, ctx) {
  const rozegrane = ctx.wieczory.filter(wieczorRozegrany);
  const ostatni = rozegrane.filter((w) => !w.towarzyski)
    .sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;
  const mvp = ostatni ? mvpWieczoru(ostatni) : null;
  const tabela = klasyfikacja(ctx.wieczory.filter((w) => !w.towarzyski), { tryb: trybSkrotu });
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
        <a class="btn btn-glowny" href="#/wieczor">${nastepny === dzis ? 'Gramy dziś, wpisz wynik' : 'Wpisz wynik'}</a>
        <a class="btn btn-obrys" href="#/zasady">Jak to działa</a>
      </div>
      <p class="hero-termin">${nastepny === dzis
        ? 'Dziś wtorek, miłego grania.'
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

    <section class="karta karta-zapros">
      <div class="zapros-tresc">
        <b>Ktoś jeszcze nie ma appki?</b>
        <span class="cichy">Wyślij mu link, otwiera się w przeglądarce i nic się nie instaluje.</span>
      </div>
      <button class="btn btn-obrys" type="button" id="wyslij-link">🔗 Wyślij link</button>
    </section>

    <section class="karta karta-ja">
      <h2 class="karta-tytul">Kim jesteś? ${dymek('ktowpisuje')}</h2>
      <div class="chipy">
        ${GRACZE.map((g) => `<button class="chip ${ctx.ja === g.id ? 'wybrany' : ''}" type="button"
          data-ja="${g.id}">${g.imie}</button>`).join('')}
      </div>
      <p class="wskazowka">Służy tylko do podświetlenia Twojego wiersza w tabeli. Wpisywać może każdy.</p>
    </section>`;

  kontener.querySelectorAll('[data-skrot-tryb]').forEach((el) =>
    el.addEventListener('click', () => { trybSkrotu = el.dataset.skrotTryb; ctx.odswiez(); }));

  kontener.querySelectorAll('[data-ja]').forEach((el) =>
    el.addEventListener('click', () => ctx.ustawJa(el.dataset.ja)));

  kontener.querySelector('#wyslij-link')?.addEventListener('click', () => zapros());
}

function kartaCzworki(pelna, ja) {
  const tabela = pelna.filter((r) => r.mecze > 0);
  const cokolwiek = tabela.length > 0;
  return `<section class="karta">
    ${naglowekZPomoca('Tabela', 'punktacja', { dodatek: '<a class="naglowek-link" href="#/tabela">pełna tabela</a>' })}
    <div class="chipy chipy-skrot">
      ${TRYBY.map((t) => `<button class="chip chip-maly ${t.id === trybSkrotu ? 'wybrany' : ''}"
        type="button" data-skrot-tryb="${t.id}" aria-pressed="${t.id === trybSkrotu}">${t.nazwa}</button>`).join('')}
    </div>
    ${cokolwiek ? `<ol class="tabela tabela-skrot">
      ${tabela.map((r) => `<li class="wiersz ${r.id === ja ? 'to-ja' : ''} podium-${r.miejsce <= 3 ? r.miejsce : 'x'}">
        <span class="miejsce">${r.miejsce}</span>
        <span class="kropka-serii" style="background:${kolorGracza(r.id)}" aria-hidden="true"></span>
        <span class="wiersz-glowna"><span class="wiersz-imie">${gracz(r.id).imie}</span></span>
        <span class="wiersz-wygrane"><b>${r.meczeW}</b><em>W</em></span>
      </li>`).join('')}
    </ol>` : `<p class="pusto">${trybSkrotu === 'singiel'
        ? 'Żadnego singla jeszcze nie rozegraliście.'
        : 'Sezon jeszcze się nie zaczął.'} Pierwszy wynik wpiszecie na ekranie
      <a href="#/wieczor">Wieczór</a>.</p>`}
  </section>`;
}

function kartaBossa(okres, biezacy) {
  return `<section class="karta karta-boss-mini">
    <div class="boss-godlo">${godlo(okres.przydomek?.id ?? null, { rozmiar: 58, reign: true })}</div>
    <div class="boss-opis">
      <span class="plakietka-etykieta">Gracz Miesiąca${biezacy ? ' · na żywo' : ''} ${dymek('bigboss')}</span>
      <strong>${gracz(okres.zwyciezca.id).imie}${okres.przydomek ? ` „${bez(okres.przydomek.nazwa)}”` : ''}</strong>
      <span class="cichy">${biezacy ? 'prowadzi · ' : ''}${okres.nazwa} · ${okres.zwyciezca.meczeW} W</span>
    </div>
    <a class="naglowek-link" href="#/tytuly">więcej</a>
  </section>`;
}

function kartaMvp(wieczor, mvp) {
  return `<section class="karta karta-mvp-mini">
    <div class="boss-opis">
      <span class="plakietka-etykieta">MVP ${krotkaData(wieczor.data)} ${dymek('mvp')}</span>
      <strong>${mvp.gracze.map((i) => bez(gracz(i).imie)).join(' i ')}</strong>
      <span class="cichy">${mvp.wygrane} wygrane mecze</span>
    </div>
    <a class="naglowek-link" href="#/wieczor">wieczór</a>
  </section>`;
}
