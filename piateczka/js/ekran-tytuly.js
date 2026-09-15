/* ==========================================================================
   Ekran „Tytuły” — MVP, Gracz Miesiąca, katalog przydomków i Puchar.

   Katalog na dole jest jednocześnie instrukcją: każdy przydomek ma godło,
   hasło i dokładny warunek, jaki trzeba spełnić, żeby go dostać.
   ========================================================================== */

import { GRACZE, gracz, poPolsku, krotkaData, SEZON } from './dane.js';
import { graczMiesiaca, przydomkiGraczy, historiaMvp, PRZYDOMKI, POZIOMY, godlo } from './tytuly.js';
import { rekordySezonu } from './liczenie.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { zeZnakiem, arkusz, bez } from './ui.js';

export function render(kontener, ctx) {
  const { aktualny, wToku, wszystkie } = graczMiesiaca(ctx.wieczory);
  const mvpy = historiaMvp(ctx.wieczory);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Tytuły</h1>
      <p class="podtytul">Jeden wieczór, jeden miesiąc, cały sezon</p>
    </div>

    ${kartaBigBossa(aktualny, wToku)}
    ${kartaDruzyna(ctx.wieczory)}
    ${kartaMvp(mvpy)}
    ${kartaRekordy(rekordySezonu(ctx.wieczory))}
    ${kartaHistorii(wszystkie)}
    ${kartaPucharu()}
    ${kartaKatalogu()}`;

  kontener.querySelectorAll('[data-przydomek]').forEach((el) =>
    el.addEventListener('click', () => opisPrzydomka(el.dataset.przydomek)));
}

/* ------------------------------------------------------- Gracz Miesiąca */

function kartaBigBossa(aktualny, wToku) {
  // Po jednym wtorku ktoś już prowadzi i od razu dostaje odznakę. Różnica jest
  // tylko w podpisie: zamknięty miesiąc = tytuł pewny, bieżący = „na żywo".
  const okres = aktualny ?? (wToku?.zwyciezca ? wToku : null);
  if (!okres) {
    return `<section class="karta karta-boss pusta">
      ${naglowekZPomoca('Gracz Miesiąca', 'bigboss')}
      <p class="pusto">Pierwszy Gracz Miesiąca zostanie koronowany, gdy tylko rozegracie pierwszy wtorek.</p>
    </section>`;
  }
  const biezacy = !aktualny;
  const p = okres.przydomek;
  return `<section class="karta karta-boss">
    ${naglowekZPomoca('Gracz Miesiąca', 'bigboss', { dodatek: biezacy
      ? '<span class="plakietka-live">na żywo</span>' : '' })}
    <div class="boss-tresc">
      <div class="boss-godlo">${godlo(p.id, { rozmiar: 96, reign: true })}</div>
      <div class="boss-opis">
        <strong class="boss-imie">${gracz(okres.zwyciezca.id).imie}</strong>
        <span class="boss-przydomek">„${p.nazwa}”</span>
        <span class="boss-haslo">${p.haslo}</span>
        <span class="boss-okres">${biezacy ? 'Prowadzi — ' : ''}${okres.nazwa} · saldo ${zeZnakiem(okres.zwyciezca.saldo)}</span>
        <button class="btn btn-maly" type="button" data-przydomek="${p.id}">Za co ten przydomek?</button>
      </div>
    </div>
    ${biezacy ? `<p class="boss-nota">To układ na dziś — tytuł zamknie się z końcem miesiąca.
      Do tego czasu każdy dobry wieczór może go przejąć.</p>` : (wToku?.zwyciezca ? `<p class="boss-nota">
      W bieżącym okresie (${wToku.nazwa}) prowadzi <b>${gracz(wToku.zwyciezca.id).imie}</b> —
      ${zeZnakiem(wToku.zwyciezca.saldo)}.</p>` : '')}
  </section>`;
}

/* --------------------------------------------------------------- MVP */

function kartaDruzyna(wieczory) {
  const mapa = przydomkiGraczy(wieczory);
  return `<section class="karta">
    ${naglowekZPomoca('Przydomki drużyny', 'przydomki')}
    <div class="druzyna">
      ${GRACZE.map((g) => {
        const { przydomek: p, reign } = mapa.get(g.id);
        return `<button class="druzyna-kafel ${reign ? 'druzyna-krol' : ''}" type="button" data-przydomek="${p.id}">
          ${godlo(p.id, { rozmiar: 60, reign })}
          <b>${gracz(g.id).imie}</b>
          <em>${p.nazwa}</em>
          ${reign ? '<span class="druzyna-krol-tag">👑 Gracz Miesiąca</span>' : ''}
        </button>`;
      }).join('')}
    </div>
    <p class="wskazowka">Każdy nosi swój przydomek — rośnie razem z formą. Kto jest Graczem Miesiąca,
    tego godło świeci na złoto.</p>
  </section>`;
}

function kartaMvp(mvpy) {
  return `<section class="karta">
    ${naglowekZPomoca('MVP wieczorów', 'mvp')}
    ${mvpy.length ? `<ul class="lista-mvp">
      ${mvpy.slice(0, 12).map((x) => `<li>
        <span class="mvp-data">${krotkaData(x.data)}</span>
        <span class="mvp-kto">${x.mvp.gracze.map((i) => bez(gracz(i).imie)).join(' i ')}</span>
        <span class="mvp-saldo plus">${zeZnakiem(x.mvp.saldo)}</span>
      </li>`).join('')}
    </ul>` : '<p class="pusto">Pierwszy MVP czeka na pierwszy rozegrany wtorek.</p>'}
  </section>`;
}

/* ------------------------------------------------------------- rekordy */

function kartaRekordy(rek) {
  if (!rek) return '';
  const im = (id) => bez(gracz(id).imie);
  const para = (ids) => ids.map(im).join(' + ');
  const wiersze = [];
  if (rek.najlepszyWieczor) wiersze.push(['🔥', 'Najlepszy wieczór',
    `${im(rek.najlepszyWieczor.id)} · ${zeZnakiem(rek.najlepszyWieczor.saldo)} · ${poPolsku(rek.najlepszyWieczor.data)}`]);
  if (rek.najwiekszyPogrom) wiersze.push(['💥', 'Największy pogrom',
    `${para(rek.najwiekszyPogrom.wygrani)} rozbili ${para(rek.najwiekszyPogrom.przegrani)} · różnica ${rek.najwiekszyPogrom.roznica}`]);
  if (rek.najdluzszaSeria) wiersze.push(['🚂', 'Najdłuższa seria setów',
    `${im(rek.najdluzszaSeria.id)} · ${rek.najdluzszaSeria.dlugosc} z rzędu`]);
  if (rek.najlepszyDuet) wiersze.push(['🤝', 'Najlepszy duet',
    `${para(rek.najlepszyDuet.para)} · ${zeZnakiem(rek.najlepszyDuet.saldo)} razem`]);
  if (!wiersze.length) return '';
  return `<section class="karta">
    <h2 class="karta-tytul">Rekordy sezonu</h2>
    <ul class="rekordy">
      ${wiersze.map(([ikona, tytul, opis]) => `<li>
        <span class="rekord-ikona" aria-hidden="true">${ikona}</span>
        <span class="rekord-tresc"><b>${tytul}</b><em>${opis}</em></span>
      </li>`).join('')}
    </ul>
  </section>`;
}

/* ------------------------------------------------------------ historia */

function kartaHistorii(okresy) {
  const zamkniete = okresy.filter((o) => o.zwyciezca);
  if (!zamkniete.length) return '';
  return `<section class="karta">
    <h2 class="karta-tytul">Galeria Graczy Miesiąca</h2>
    <ul class="lista-bossow">
      ${zamkniete.slice().reverse().map((o) => `<li>
        <span class="mini-godlo">${godlo(o.przydomek.id, { rozmiar: 34, reign: true })}</span>
        <span class="boss-wiersz">
          <b>${gracz(o.zwyciezca.id).imie}</b> „${o.przydomek.nazwa}”
          <em>${o.nazwa}${o.otwarty ? ' · w toku' : ''}</em>
        </span>
        <span class="mvp-saldo">${zeZnakiem(o.zwyciezca.saldo)}</span>
      </li>`).join('')}
    </ul>
  </section>`;
}

/* -------------------------------------------------------------- Puchar */

function kartaPucharu() {
  return `<section class="karta karta-puchar">
    ${naglowekZPomoca('Puchar Pana Piąteczki', 'puchar')}
    <p>Turniej Pana Piąteczki kończy się Pucharem Pana Piąteczki — singlowym wieczorem
    ${poPolsku(SEZON.final)}, każdy z każdym, rozstawienie według tabeli.</p>
    <p class="wskazowka">Mistrz sezonu i zdobywca Pucharu to mogą być dwie różne osoby.
    Sezon nagradza regularność, Puchar — jeden dobry wieczór.</p>
  </section>`;
}

/* ------------------------------------------------------------- katalog */

function kartaKatalogu() {
  const grupy = [
    ['braz', '🥉 Brąz — na start i za drobne wyczyny'],
    ['srebro', '🥈 Srebro — dla ambitnych'],
    ['zloto', '🥇 Złoto — najtrudniejsze'],
  ];
  return `<section class="karta">
    ${naglowekZPomoca('Wszystkie przydomki', 'przydomki')}
    <p class="wskazowka">Każdy ma przydomek cały czas. Zakwalifikujesz się na lepszy — stary znika.
    Dotknij godła, żeby zobaczyć pełny opis.</p>
    ${grupy.map(([poz, tytul]) => `
      <h4 class="katalog-grupa">${tytul}</h4>
      <div class="katalog">
        ${PRZYDOMKI.filter((p) => p.poziom === poz).map((p) => `
          <button class="katalog-kafel" type="button" data-przydomek="${p.id}">
            ${godlo(p.id, { rozmiar: 56 })}
            <b>${p.nazwa}</b>
            <em>${p.haslo}</em>
          </button>`).join('')}
      </div>`).join('')}
  </section>`;
}

function opisPrzydomka(id) {
  const p = PRZYDOMKI.find((x) => x.id === id);
  if (!p) return;
  arkusz({
    tytul: `„${p.nazwa}”`,
    tresc: `<div class="arkusz-godlo">${godlo(p.id, { rozmiar: 96 })}</div>
      <p class="arkusz-poziom">${{ zloto: '🥇 Złoto', srebro: '🥈 Srebro', braz: '🥉 Brąz' }[p.poziom]}</p>
      <p class="arkusz-haslo">${p.haslo}</p>
      <p>${p.opis}</p>
      <p class="pomoc-nota">Przydomek nosi Gracz Miesiąca danego okresu — do chwili, gdy ktoś zdejmie mu tytuł.</p>`,
  });
}
