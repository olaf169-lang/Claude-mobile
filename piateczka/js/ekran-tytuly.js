/* ==========================================================================
   Ekran „Tytuły” — MVP, Big Boss, katalog przydomków i Puchar.

   Katalog na dole jest jednocześnie instrukcją: każdy przydomek ma godło,
   hasło i dokładny warunek, jaki trzeba spełnić, żeby go dostać.
   ========================================================================== */

import { gracz, poPolsku, krotkaData, SEZON } from './dane.js';
import { bigBoss, historiaMvp, PRZYDOMKI, godlo } from './tytuly.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { zeZnakiem, arkusz, bez } from './ui.js';

export function render(kontener, ctx) {
  const { aktualny, wToku, wszystkie } = bigBoss(ctx.wieczory);
  const mvpy = historiaMvp(ctx.wieczory);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Tytuły</h1>
      <p class="podtytul">Jeden wieczór, jeden miesiąc, cały sezon</p>
    </div>

    ${kartaBigBossa(aktualny, wToku)}
    ${kartaMvp(mvpy)}
    ${kartaHistorii(wszystkie)}
    ${kartaPucharu()}
    ${kartaKatalogu()}`;

  kontener.querySelectorAll('[data-przydomek]').forEach((el) =>
    el.addEventListener('click', () => opisPrzydomka(el.dataset.przydomek)));
}

/* ---------------------------------------------------------- Big Boss */

function kartaBigBossa(aktualny, wToku) {
  if (!aktualny) {
    return `<section class="karta karta-boss pusta">
      ${naglowekZPomoca('Big Boss', 'bigboss')}
      <p class="pusto">Tytuł czeka na pierwszy zamknięty miesiąc.
      ${wToku?.zwyciezca ? `W tej chwili prowadzi <b>${gracz(wToku.zwyciezca.id).imie}</b>
        (${zeZnakiem(wToku.zwyciezca.saldo)}).` : 'Potrzebne są przynajmniej dwa rozegrane wieczory w miesiącu.'}</p>
    </section>`;
  }
  const p = aktualny.przydomek;
  return `<section class="karta karta-boss">
    ${naglowekZPomoca('Big Boss', 'bigboss')}
    <div class="boss-tresc">
      <div class="boss-godlo">${godlo(p.id, { rozmiar: 84 })}</div>
      <div class="boss-opis">
        <strong class="boss-imie">${gracz(aktualny.zwyciezca.id).imie}</strong>
        <span class="boss-przydomek">„${p.nazwa}”</span>
        <span class="boss-haslo">${p.haslo}</span>
        <span class="boss-okres">${aktualny.nazwa} · saldo ${zeZnakiem(aktualny.zwyciezca.saldo)}</span>
        <button class="btn btn-maly" type="button" data-przydomek="${p.id}">Za co ten przydomek?</button>
      </div>
    </div>
    ${wToku?.zwyciezca ? `<p class="boss-nota">W bieżącym okresie (${wToku.nazwa}) prowadzi
      <b>${gracz(wToku.zwyciezca.id).imie}</b> — ${zeZnakiem(wToku.zwyciezca.saldo)}. Tytuł przechodzi,
      gdy miesiąc się zamknie.</p>` : ''}
  </section>`;
}

/* --------------------------------------------------------------- MVP */

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

/* ------------------------------------------------------------ historia */

function kartaHistorii(okresy) {
  const zamkniete = okresy.filter((o) => o.zwyciezca);
  if (!zamkniete.length) return '';
  return `<section class="karta">
    <h2 class="karta-tytul">Galeria Big Bossów</h2>
    <ul class="lista-bossow">
      ${zamkniete.slice().reverse().map((o) => `<li>
        <span class="mini-godlo">${godlo(o.przydomek.id, { rozmiar: 34 })}</span>
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
  return `<section class="karta">
    ${naglowekZPomoca('Wszystkie przydomki', 'przydomki')}
    <p class="wskazowka">Przydomek nie jest losowy — appka sprawdza warunki po kolei, od najrzadszego
    do najzwyklejszego, i przyznaje pierwszy pasujący. Dotknij godła, żeby zobaczyć pełny opis.</p>
    <div class="katalog">
      ${PRZYDOMKI.map((p) => `<button class="katalog-kafel" type="button" data-przydomek="${p.id}">
        ${godlo(p.id, { rozmiar: 52 })}
        <b>${p.nazwa}</b>
        <em>${p.haslo}</em>
      </button>`).join('')}
    </div>
  </section>`;
}

function opisPrzydomka(id) {
  const p = PRZYDOMKI.find((x) => x.id === id);
  if (!p) return;
  arkusz({
    tytul: `„${p.nazwa}”`,
    tresc: `<div class="arkusz-godlo">${godlo(p.id, { rozmiar: 96 })}</div>
      <p class="arkusz-haslo">${p.haslo}</p>
      <p>${p.opis}</p>
      <p class="pomoc-nota">Przydomek nosi Big Boss danego okresu — do chwili, gdy ktoś zdejmie mu tytuł.</p>`,
  });
}
