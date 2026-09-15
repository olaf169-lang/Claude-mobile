/* ==========================================================================
   Ekran „Podsumowanie" — laurka jednego wieczoru pod link do udostępnienia.

   Tu ląduje ktoś, kto kliknie link z grupy (#/podsumowanie/RRRR-MM-DD).
   Read-only, ładne, do zrzutu ekranu albo dalszego podania dalej.
   ========================================================================== */

import { poPolsku, krotkaData, gracz, GOSC } from './dane.js';
import { rekordyWieczoru, mvpWieczoru, wynikMeczu, wieczorRozegrany, mecze } from './liczenie.js';
import { graczMiesiaca } from './tytuly.js';
import { zeZnakiem, klasaSalda, bez } from './ui.js';
import { pochwalSie } from './pochwal.js';

function imie(wieczor, id) {
  return id === GOSC.id ? bez(wieczor.goscImie || 'Gość') : bez(gracz(id).imie);
}

export function render(kontener, ctx) {
  const data = ctx.kotwica;
  const wieczor = ctx.wieczory.find((w) => w.data === data) ?? null;

  if (!wieczor || !wieczorRozegrany(wieczor)) {
    kontener.innerHTML = `
      <div class="ekran-naglowek"><h1>Podsumowanie</h1>
        <p class="podtytul">${data ? poPolsku(data) : ''}</p></div>
      <section class="karta">
        <p class="pusto">Ten wieczór nie ma jeszcze wyników.</p>
        <a class="btn btn-obrys szeroki" href="#/">Wróć na start</a>
      </section>`;
    return;
  }

  const rek = [...rekordyWieczoru(wieczor, true).values()]
    .filter((r) => r.mecze > 0).sort((a, b) => b.saldo - a.saldo);
  const mvp = mvpWieczoru(wieczor);
  const { aktualny, wToku } = graczMiesiaca(ctx.wieczory);
  const boss = aktualny ?? (wToku?.zwyciezca ? wToku : null);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Wieczór ${krotkaData(wieczor.data)}</h1>
      <p class="podtytul">${poPolsku(wieczor.data)}${wieczor.towarzyski ? ' · towarzyski' : ''}</p>
    </div>

    <section class="karta karta-laurka">
      ${mvp && !wieczor.towarzyski ? `<div class="laurka-mvp">
        <span class="plakietka-etykieta">MVP wieczoru</span>
        <strong>${mvp.gracze.map((i) => imie(wieczor, i)).join(' i ')}</strong>
        <span class="saldo plus">${zeZnakiem(mvp.saldo)}</span>
      </div>` : ''}

      <ol class="laurka-tabela">
        ${rek.map((r, i) => `<li class="${mvp?.gracze.includes(r.id) ? 'mvp' : ''}">
          <span class="laurka-miejsce">${i + 1}</span>
          <span class="laurka-kto">${imie(wieczor, r.id)}${r.id === GOSC.id ? '<em class="cichy"> (gość)</em>' : ''}
            <em class="laurka-detal">${r.meczeW}W ${r.meczeP}P · sety ${r.setyW}:${r.setyP}</em></span>
          <span class="lista-saldo ${klasaSalda(r.saldo)}">${zeZnakiem(r.saldo)}</span>
        </li>`).join('')}
      </ol>

      <div class="laurka-mecze">
        ${mecze(wieczor).map((m) => wierszMeczu(m, wieczor)).join('')}
      </div>

      ${boss && !wieczor.towarzyski ? `<p class="laurka-boss">👑 Gracz Miesiąca${aktualny ? '' : ' (prowadzi)'}:
        <b>${imie(wieczor, boss.zwyciezca.id)}</b> „${boss.przydomek.nazwa}"</p>` : ''}
    </section>

    <button class="btn btn-glowny szeroki" type="button" id="pochwal">📣 Pochwal się na grupie</button>
    <div class="kafelki-dol">
      <a class="btn btn-obrys" href="#/tabela">Cała tabela</a>
      <a class="btn btn-obrys" href="#/">Otwórz appkę</a>
    </div>`;

  kontener.querySelector('#pochwal')?.addEventListener('click', () => pochwalSie(wieczor));
}

function wierszMeczu(mecz, wieczor) {
  const r = wynikMeczu(mecz);
  if (!r.rozegrany) return '';
  const paraA = mecz.a.map((i) => imie(wieczor, i)).join(' + ');
  const paraB = mecz.b.map((i) => imie(wieczor, i)).join(' + ');
  const wa = r.werdykt === 'a';
  return `<div class="laurka-mecz">
    <span class="${wa ? 'wygrany' : ''}">${paraA}</span>
    <b>${r.setyA}:${r.setyB}</b>
    <span class="${r.werdykt === 'b' ? 'wygrany' : ''}">${paraB}</span>
  </div>`;
}
