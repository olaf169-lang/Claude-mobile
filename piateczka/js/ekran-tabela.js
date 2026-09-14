/* ==========================================================================
   Ekran „Tabela” — oficjalna klasyfikacja sezonu.
   ========================================================================== */

import { GRACZE, gracz, SEZON } from './dane.js';
import { klasyfikacja, wFiltrze } from './liczenie.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { zeZnakiem, klasaSalda, arkusz, bez } from './ui.js';
import { iskra, kolorGracza } from './wykresy.js';

let zakres = 'sezon';

const ZAKRESY = [
  { id: 'sezon', nazwa: 'Generalna' },
  ...SEZON.rundy.map((r) => ({ id: r.id, nazwa: r.nazwa, od: r.od, do: r.do })),
];

export function render(kontener, ctx) {
  const wybrany = ZAKRESY.find((z) => z.id === zakres) ?? ZAKRESY[0];
  const wieczory = wFiltrze(ctx.wieczory, { od: wybrany.od, do: wybrany.do })
    .filter((w) => !w.towarzyski);
  const tabela = klasyfikacja(wieczory);
  const cokolwiek = tabela.some((r) => r.mecze > 0);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Tabela</h1>
      <p class="podtytul">Sezon ${SEZON.nazwa} · ${wieczory.length} ${odmiana(wieczory.length)}</p>
    </div>

    <div class="chipy chipy-zakres">
      ${ZAKRESY.map((z) => `<button class="chip ${z.id === zakres ? 'wybrany' : ''}" type="button"
        data-zakres="${z.id}">${z.nazwa}</button>`).join('')}
    </div>

    <section class="karta">
      ${naglowekZPomoca('Klasyfikacja', 'saldo', { dodatek: '<span class="cichy naglowek-nota">wg salda</span>' })}
      ${cokolwiek ? `<ol class="tabela">
        ${tabela.map((r) => wiersz(r)).join('')}
      </ol>
      <p class="wskazowka">Dotknij wiersza, żeby zobaczyć szczegóły gracza.</p>`
      : `<p class="pusto">Jeszcze nic nie rozegrano. Wpisz pierwszy wynik na ekranie <a href="#/wieczor">Wieczór</a>.</p>`}
    </section>

    <section class="karta">
      ${naglowekZPomoca('Skąd się bierze saldo', 'saldo')}
      <p class="wskazowka">Przy trzech meczach bilans samych wygranych może wyjść tylko na trzy sposoby
      (3-1-1-1, 2-2-1-1 albo 2-2-2-0), więc remisy byłyby na porządku dziennym. Dlatego liczymy różnicę
      punktów, a do niej dokładamy <b>+3 za każdy wygrany mecz</b> — żeby zwycięstwo znaczyło więcej niż
      ładna przegrana. Nieobecność nic nie kosztuje: nie grasz, saldo stoi w miejscu.</p>
    </section>`;

  kontener.querySelectorAll('[data-zakres]').forEach((el) =>
    el.addEventListener('click', () => { zakres = el.dataset.zakres; ctx.odswiez(); }));

  kontener.querySelectorAll('[data-gracz]').forEach((el) =>
    el.addEventListener('click', () => szczegoly(el.dataset.gracz, tabela)));
}

function odmiana(n) {
  if (n === 1) return 'wieczór';
  const d = n % 10, s = n % 100;
  return (d >= 2 && d <= 4 && !(s >= 12 && s <= 14)) ? 'wieczory' : 'wieczorów';
}

function wiersz(r) {
  const narastajaco = [];
  let suma = 0;
  for (const h of r.historia) { suma += h.saldo; narastajaco.push(suma); }
  return `<li class="wiersz podium-${r.miejsce <= 3 ? r.miejsce : 'x'}" data-gracz="${r.id}" tabindex="0" role="button">
    <span class="miejsce">${r.miejsce}</span>
    <span class="wiersz-glowna">
      <span class="wiersz-imie">${gracz(r.id).imie}</span>
      <span class="wiersz-detal">${r.meczeW}W ${r.meczeR ? r.meczeR + 'R ' : ''}${r.meczeP}P
        · sety ${r.setyW}:${r.setyP} · ${r.wieczory} ${odmiana(r.wieczory)}</span>
    </span>
    ${iskra(narastajaco, kolorGracza(r.id))}
    <span class="wiersz-saldo ${klasaSalda(r.saldo)}">${zeZnakiem(r.saldo)}</span>
  </li>`;
}

function szczegoly(id, tabela) {
  const r = tabela.find((x) => x.id === id);
  if (!r) return;
  const listaSald = (obj) => Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([pid, saldo]) => `<li><span>${bez(gracz(pid).imie)}</span>
      <b class="${klasaSalda(saldo)}">${zeZnakiem(saldo)}</b></li>`).join('');
  const partnerzy = listaSald(r.partnerzy);
  const rywale = listaSald(r.przeciwnicy);

  arkusz({
    tytul: `${bez(gracz(id).imie)} — szczegóły`,
    tresc: `
      <div class="statystyki">
        <div><span>${zeZnakiem(r.saldo)}</span><em>saldo</em></div>
        <div><span>${r.zdobyte}</span><em>zdobyte</em></div>
        <div><span>${r.stracone}</span><em>stracone</em></div>
        <div><span>${r.najdluzszaSeria}</span><em>seria setów</em></div>
        <div><span>${r.setyNaStyk ? Math.round((r.setyNaStykW / r.setyNaStyk) * 100) : 0}%</span><em>setów na styk</em></div>
        <div><span>${r.wieczory}</span><em>wieczorów</em></div>
      </div>
      ${partnerzy ? `<h4>Najlepszy duet</h4>
        <ul class="lista-prosta">${partnerzy}</ul>
        <p class="pomoc-nota">Saldo, gdy graliście w jednej parze — z kim Ci po drodze.</p>` : ''}
      ${rywale ? `<h4>Bilans z rywalem</h4>
        <ul class="lista-prosta">${rywale}</ul>
        <p class="pomoc-nota">Twój wynik przeciw każdemu. Na plus — to Ty jesteś ich zmorą,
        na minus — oni Twoją.</p>` : ''}`,
  });
}
