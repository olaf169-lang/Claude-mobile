/* ==========================================================================
   Ekran „🏸ELO🏸” — ranking mocy i generator forów.
   ========================================================================== */

import { GRACZE, gracz, krotkaData } from './dane.js';
import { ranking, przelicz, oczekiwanie, START } from './elo.js';
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
      <p class="podtytul">Ranking mocy — nie daje tytułu, wyrównuje mecze</p>
    </div>

    <section class="karta">
      ${naglowekZPomoca('Rating', 'elo')}
      <ol class="tabela tabela-elo">
        ${lista.map((r) => `<li class="wiersz">
          <span class="miejsce">${r.miejsce}</span>
          <span class="kropka-serii" style="background:${kolorGracza(r.id)}" aria-hidden="true"></span>
          <span class="wiersz-glowna"><span class="wiersz-imie">${gracz(r.id).imie}</span></span>
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
    </section>` : ''}

    <section class="karta">
      ${naglowekZPomoca('Fory na dziś', 'fory')}
      <ul class="lista-for">
        ${ZESTAWIENIA.map((z) => wierszFor(z, rating)).join('')}
      </ul>
      <p class="wskazowka">Fory są dobrowolne i nie zmieniają liczenia — wpisujecie wynik z tablicy.</p>
    </section>`;

  if (jestWykres) {
    podepnijKrzyzyk(kontener.querySelector('.wykres'), serie, etykiety, kontener);
  }
}

function wierszFor([indeksyA, indeksyB], rating) {
  const a = indeksyA.map((i) => GRACZE[i]);
  const b = indeksyB.map((i) => GRACZE[i]);
  const ra = a.reduce((s, g) => s + rating[g.id], 0) / a.length;
  const rb = b.reduce((s, g) => s + rating[g.id], 0) / b.length;
  const roznica = Math.abs(ra - rb);
  const punkty = Math.min(5, Math.round(roznica / 40));
  const slabsza = ra > rb ? b : a;
  const szansa = Math.round(oczekiwanie(Math.max(ra, rb), Math.min(ra, rb)) * 100);

  return `<li>
    <span class="fora-pary">${a.map((g) => g.imie).join(' + ')} <i>vs</i> ${b.map((g) => g.imie).join(' + ')}</span>
    <span class="fora-wynik">${punkty === 0
      ? '<b class="rowno">równo</b>'
      : `<b>+${punkty}</b> dla ${slabsza.map((g) => g.imie).join(' + ')}`}
      <em>${szansa}%</em></span>
  </li>`;
}
