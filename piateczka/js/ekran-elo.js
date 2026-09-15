/* ==========================================================================
   Ekran „🏸ELO🏸” — ranking mocy i forma zestawień.

   Żadnych ułatwień: appka pokazuje wyłącznie, jak rozkładają się szanse
   w danym zestawieniu par. Nikt nie dostaje punktów na start.
   ========================================================================== */

import { GRACZE, gracz, krotkaData } from './dane.js';
import { ranking, przelicz, szanse, poziomFormy, START } from './elo.js';
import { naglowekZPomoca } from './pomoc.js';
import { zeZnakiem, klasaSalda } from './ui.js';
import { linie, podepnijKrzyzyk, kolorGracza } from './wykresy.js';

/* Trzy możliwe zestawienia debla — te same, w których i tak gracie. */
const ZESTAWIENIA = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];

export function render(kontener, ctx) {
  const lista = ranking(ctx.wieczory);
  const { rating } = przelicz(ctx.wieczory);
  const grane = ctx.wieczory.filter((w) => !w.towarzyski).map((w) => w.data).sort();

  const serie = GRACZE.map((g) => {
    const h = lista.find((r) => r.id === g.id)?.historia ?? [{ rating: START }];
    return { nazwa: g.imie, kolor: kolorGracza(g.id), wartosci: h.map((p) => p.rating) };
  });
  const etykiety = ['start', ...grane.map(krotkaData)];
  const jestWykres = serie[0].wartosci.length > 1;

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>🏸ELO🏸</h1>
      <p class="podtytul">Twoja forma i siła gry — bez tytułów, bez ułatwień</p>
    </div>

    <section class="karta">
      ${naglowekZPomoca('Rating', 'elo')}
      <ol class="tabela tabela-elo">
        ${lista.map((r) => `<li class="wiersz">
          <span class="miejsce">${r.miejsce}</span>
          <span class="kropka-serii" style="background:${kolorGracza(r.id)}" aria-hidden="true"></span>
          <span class="wiersz-glowna">
            <span class="wiersz-imie">${gracz(r.id).imie}</span>
            <span class="poziom-formy" title="Poziom formy wg ELO">${poziomFormy(r.dokladny).emoji} ${poziomFormy(r.dokladny).nazwa}</span>
          </span>
          <span class="wiersz-zmiana ${klasaSalda(r.zmiana)}">${r.zmiana ? zeZnakiem(r.zmiana) : '—'}</span>
          <span class="wiersz-saldo">${r.rating}</span>
        </li>`).join('')}
      </ol>
    </section>

    ${jestWykres ? `<section class="karta">
      ${naglowekZPomoca('Przebieg sezonu', 'elo')}
      <div class="legenda">
        ${serie.map((s) => `<span><i style="background:${s.kolor}"></i>${s.nazwa}</span>`).join('')}
      </div>
      <div class="wykres-otoczka">
        ${linie({ serie, etykiety })}
        <div class="dymek-wykresu" data-dymek-wykresu hidden></div>
      </div>
      <p class="wskazowka">Dotknij wykresu, żeby zobaczyć rating po konkretnym wtorku.</p>
    </section>` : `<section class="karta karta-pusty-wykres">
      ${naglowekZPomoca('Przebieg sezonu', 'elo')}
      <div class="pusty-wykres">
        <span class="pusty-wykres-ikona" aria-hidden="true">📈</span>
        <p><b>Wykres formy pojawi się po pierwszym rozegranym wtorku.</b></p>
        <p class="cichy">Każdy startuje z 1000. Po pierwszej grze zaczyna się rysować linia,
        a po kilku wtorkach widać, kto rośnie, a kto spada.</p>
      </div>
    </section>`}

    <section class="karta">
      ${naglowekZPomoca('Forma zestawień', 'forma')}
      <ul class="lista-formy">
        ${ZESTAWIENIA.map((z) => wierszFormy(z, rating)).join('')}
      </ul>
      <p class="wskazowka">Sama informacja, jak rozkładają się szanse. Nikt nie dostaje punktów
      na start ani żadnego innego ułatwienia — gracie normalnie i wpisujecie wynik z tablicy.</p>
    </section>`;

  if (jestWykres) {
    podepnijKrzyzyk(kontener.querySelector('.wykres'), serie, etykiety, kontener);
  }
}

function wierszFormy([indeksyA, indeksyB], rating) {
  const a = indeksyA.map((i) => GRACZE[i]);
  const b = indeksyB.map((i) => GRACZE[i]);
  const s = szanse(a.map((g) => g.id), b.map((g) => g.id), rating);
  const procent = (x) => Math.round(x * 100);

  return `<li>
    <span class="forma-pary">
      <span>${a.map((g) => g.imie).join(' + ')}</span>
      <i>vs</i>
      <span>${b.map((g) => g.imie).join(' + ')}</span>
    </span>
    <span class="forma-belka" role="img"
      aria-label="Szanse ${procent(s.a)} do ${procent(s.b)} procent">
      <span class="forma-belka-a" style="width:${procent(s.a)}%"></span>
    </span>
    <span class="forma-wynik">
      <b>${procent(s.a)}%</b>
      ${s.wyrownany ? '<em class="rowno">wyrównane</em>' : ''}
      <b>${procent(s.b)}%</b>
    </span>
  </li>`;
}
