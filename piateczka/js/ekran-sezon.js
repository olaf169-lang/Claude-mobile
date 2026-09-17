/* ==========================================================================
   Ekran „Sezon”: jedna karta na koniec sezonu, do wysłania na grupę.

   Nic tu się nie wpisuje i nic nie liczy inaczej niż reszta appki. To jest
   widok zbiorczy: mistrzowie obu rozgrywek, liczby sezonu, rekordy i galeria
   Graczy Miesiąca, plus przycisk „Pochwal się”.
   ========================================================================== */

import { gracz, SEZON, poPolsku } from './dane.js';
import { klasyfikacja, rekordySezonu, mecze as meczeZ, trybMeczu, wynikMeczu,
  wieczorRozegrany, TRYBY } from './liczenie.js';
import { graczMiesiaca, przydomkiGraczy, godlo } from './tytuly.js';
import { bez, odmianaMeczow, odmianaWygranych, odmianaWieczorow, odmianaSetow } from './ui.js';
import { pochwalSezonem } from './pochwal.js';

export function render(kontener, ctx) {
  const wieczory = ctx.wieczory.filter((w) => !w.towarzyski && wieczorRozegrany(w));
  const l = liczby(wieczory);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Sezon ${SEZON.nazwa}</h1>
      <p class="podtytul">${l.wieczorow
        ? `${l.wieczorow} ${odmianaWieczorow(l.wieczorow)} · ${l.meczow} ${odmianaMeczow(l.meczow)}`
        : 'Jeszcze nic nie rozegrano'}</p>
    </div>

    ${l.wieczorow ? `
      ${kartaMistrzow(wieczory, ctx.wybory)}
      ${kartaLiczb(l)}
      ${kartaRekordow(rekordySezonu(wieczory))}
      ${kartaBossow(graczMiesiaca(wieczory).wszystkie)}
      <section class="karta karta-pochwal">
        <h2 class="karta-tytul">Wyślij na grupę</h2>
        <p class="wskazowka">Gotowy tekst z mistrzami i liczbami sezonu, do wklejenia na czacie.</p>
        <button class="btn btn-glowny szeroki" type="button" id="pochwal-sezon">📣 Pochwal się sezonem</button>
      </section>`
      : `<section class="karta"><p class="pusto">Podsumowanie pojawi się po pierwszym
         rozegranym wieczorze.</p></section>`}`;

  kontener.querySelector('#pochwal-sezon')?.addEventListener('click', () => pochwalSezonem(wieczory));
}

/* ------------------------------------------------------------- liczydła */

function liczby(wieczory) {
  let meczow = 0, setow = 0, punktow = 0;
  const wTrybie = { debel: 0, singiel: 0 };
  for (const w of wieczory) {
    for (const m of meczeZ(w)) {
      const r = wynikMeczu(m);
      if (!r.rozegrany) continue;
      meczow += 1;
      wTrybie[trybMeczu(m)] += 1;
      setow += r.setyA + r.setyB;
      punktow += r.pktA + r.pktB;
    }
  }
  return { wieczorow: wieczory.length, meczow, setow, punktow, wTrybie };
}

/* ----------------------------------------------------------- mistrzowie */

function kartaMistrzow(wieczory, wybory) {
  const przydomki = przydomkiGraczy(wieczory, wybory ?? {});
  const kafle = TRYBY.map((t) => {
    const tabela = klasyfikacja(wieczory, { tryb: t.id }).filter((r) => r.mecze > 0);
    const mistrz = tabela[0] ?? null;
    if (!mistrz) {
      return `<div class="mistrz-kafel">
        <span class="mistrz-tryb">${t.nazwa}</span>
        <p class="pusto">Nie rozegrano</p>
      </div>`;
    }
    const p = przydomki.get(mistrz.id)?.przydomek ?? null;
    return `<div class="mistrz-kafel mistrz-${t.id}">
      <span class="mistrz-tryb">${t.nazwa}</span>
      ${godlo(p?.id ?? null, { rozmiar: 64 })}
      <b class="mistrz-imie">${bez(gracz(mistrz.id).imie)}</b>
      ${p ? `<em class="mistrz-ksywka">„${bez(p.nazwa)}”</em>` : ''}
      <span class="cichy">${mistrz.meczeW} ${odmianaWygranych(mistrz.meczeW)}
        · sety ${mistrz.setyW}:${mistrz.setyP}</span>
    </div>`;
  }).join('');

  return `<section class="karta">
    <h2 class="karta-tytul">Mistrzowie sezonu</h2>
    <div class="mistrzowie">${kafle}</div>
    <p class="wskazowka">Debel i singiel to dwie osobne rozgrywki, więc i dwóch mistrzów.
    Puchar Pana Piąteczki ${poPolsku(SEZON.final)} jest jeszcze osobno.</p>
  </section>`;
}

/* --------------------------------------------------------------- liczby */

function kartaLiczb(l) {
  return `<section class="karta">
    <h2 class="karta-tytul">Sezon w liczbach</h2>
    <div class="statystyki">
      <div><span>${l.wieczorow}</span><em>${odmianaWieczorow(l.wieczorow)}</em></div>
      <div><span>${l.meczow}</span><em>${odmianaMeczow(l.meczow)}</em></div>
      <div><span>${l.setow}</span><em>${odmianaSetow(l.setow)}</em></div>
      <div><span>${l.wTrybie.debel}</span><em>debli</em></div>
      <div><span>${l.wTrybie.singiel}</span><em>singli</em></div>
      <div><span>${l.punktow}</span><em>punktów</em></div>
    </div>
  </section>`;
}

/* -------------------------------------------------------------- rekordy */

function kartaRekordow(rek) {
  if (!rek) return '';
  const im = (id) => bez(gracz(id).imie);
  const w = [];
  if (rek.najlepszyWieczor) w.push(['🔥', 'Najlepszy wieczór',
    `${im(rek.najlepszyWieczor.id)} · ${rek.najlepszyWieczor.wygrane}W-${rek.najlepszyWieczor.przegrane}P · ${poPolsku(rek.najlepszyWieczor.data)}`]);
  if (rek.najwiekszyPogrom) w.push(['💥', 'Największy pogrom',
    `różnica ${rek.najwiekszyPogrom.roznica} pkt · ${poPolsku(rek.najwiekszyPogrom.data)}`]);
  if (rek.najdluzszaSeria) w.push(['🚂', 'Najdłuższa seria',
    `${im(rek.najdluzszaSeria.id)} · ${rek.najdluzszaSeria.dlugosc} ${odmianaMeczow(rek.najdluzszaSeria.dlugosc)} z rzędu`]);
  if (rek.najlepszyDuet) w.push(['🤝', 'Najlepszy duet',
    `${rek.najlepszyDuet.para.map(im).join(' + ')} · ${rek.najlepszyDuet.wygrane}W-${rek.najlepszyDuet.przegrane}P`]);
  if (!w.length) return '';
  return `<section class="karta">
    <h2 class="karta-tytul">Rekordy sezonu</h2>
    <ul class="rekordy">
      ${w.map(([ikona, tytul, opis]) => `<li>
        <span class="rekord-ikona" aria-hidden="true">${ikona}</span>
        <span class="rekord-tresc"><b>${tytul}</b><em>${opis}</em></span>
      </li>`).join('')}
    </ul>
  </section>`;
}

/* ------------------------------------------------------ gracze miesiąca */

function kartaBossow(okresy) {
  const zamkniete = okresy.filter((o) => o.zwyciezca && !o.otwarty);
  if (!zamkniete.length) return '';
  return `<section class="karta">
    <h2 class="karta-tytul">Gracze Miesiąca</h2>
    <ul class="lista-bossow">
      ${zamkniete.slice().reverse().map((o) => `<li>
        <span class="mini-godlo">${godlo(o.przydomek?.id ?? null, { rozmiar: 34, reign: true })}</span>
        <span class="boss-wiersz">
          <b>${bez(gracz(o.zwyciezca.id).imie)}</b>
          <em>${o.nazwa}</em>
        </span>
        <span class="mvp-liczba">${o.zwyciezca.meczeW} W</span>
      </li>`).join('')}
    </ul>
  </section>`;
}
