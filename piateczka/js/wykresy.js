/* ==========================================================================
   Dwa wykresy, oba rysowane ręcznie w SVG, bez żadnej biblioteki.

   Paleta serii jest przypisana NA STAŁE do gracza (Jacek zawsze ten sam
   kolor, niezależnie od miejsca w tabeli) i przeszła walidację kontrastu
   oraz rozróżnialności przy daltonizmie na tle #101F38.
   ========================================================================== */

import { GRACZE } from './dane.js';

export const KOLORY_SERII = ['#2F9FCC', '#C87730', '#9578D8', '#D4587F'];

export function kolorGracza(id) {
  const i = GRACZE.findIndex((g) => g.id === id);
  return i >= 0 ? KOLORY_SERII[i % KOLORY_SERII.length] : 'var(--tekst-cichy)';
}

const zaokr = (n) => Math.round(n * 10) / 10;

/* --------------------------------------------------------------- iskra */

/** Mikro-wykres do wiersza tabeli: przebieg salda narastająco.
    Jedna seria, więc bez legendy: opisuje ją wiersz, przy którym stoi. */
export function iskra(wartosci, kolor, { szer = 66, wys = 24 } = {}) {
  if (!wartosci || wartosci.length < 2) return `<svg class="iskra" width="${szer}" height="${wys}" aria-hidden="true"></svg>`;
  const min = Math.min(0, ...wartosci);
  const max = Math.max(0, ...wartosci);
  const rozpietosc = (max - min) || 1;
  const x = (i) => zaokr(2 + (i * (szer - 4)) / (wartosci.length - 1));
  const y = (v) => zaokr(wys - 3 - ((v - min) / rozpietosc) * (wys - 6));
  const sciezka = wartosci.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
  const zero = y(0);
  return `<svg class="iskra" width="${szer}" height="${wys}" viewBox="0 0 ${szer} ${wys}"
    role="img" aria-label="Przebieg salda">
    <line class="iskra-zero" x1="0" y1="${zero}" x2="${szer}" y2="${zero}"/>
    <path d="${sciezka}" fill="none" stroke="${kolor}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x(wartosci.length - 1)}" cy="${y(wartosci.at(-1))}" r="2.6" fill="${kolor}"/>
  </svg>`;
}

/* ---------------------------------------------------------------- linie */

/** Wykres przebiegu 🏸ELO🏸: cztery serie, jedna oś, cienkie linie,
    siatka wycofana do tła. Punkty mają promień 4 px, ale obszar dotyku
    obsługuje wspólny krzyżyk (patrz podepnijKrzyzyk). */
export function linie({ serie, etykiety, szer = 340, wys = 190 }) {
  const margines = { gora: 12, dol: 24, lewo: 34, prawo: 12 };
  const w = szer - margines.lewo - margines.prawo;
  const h = wys - margines.gora - margines.dol;
  const wszystkie = serie.flatMap((s) => s.wartosci);
  if (!wszystkie.length) return '<p class="cichy">Za mało danych na wykres.</p>';

  const min = Math.min(...wszystkie);
  const max = Math.max(...wszystkie);
  const zapas = Math.max(8, (max - min) * 0.12);
  const dol = Math.floor((min - zapas) / 10) * 10;
  const gora = Math.ceil((max + zapas) / 10) * 10;
  const ile = Math.max(...serie.map((s) => s.wartosci.length));

  const x = (i) => zaokr(margines.lewo + (ile === 1 ? w / 2 : (i * w) / (ile - 1)));
  const y = (v) => zaokr(margines.gora + h - ((v - dol) / (gora - dol)) * h);

  const kreski = [dol, Math.round((dol + gora) / 2 / 10) * 10, gora];
  const siatka = kreski.map((v) => `
    <line class="os-linia" x1="${margines.lewo}" y1="${y(v)}" x2="${szer - margines.prawo}" y2="${y(v)}"/>
    <text class="os-opis" x="${margines.lewo - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');

  const linie = serie.map((s) => {
    const d = s.wartosci.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="${s.kolor}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${x(s.wartosci.length - 1)}" cy="${y(s.wartosci.at(-1))}" r="4"
        fill="${s.kolor}" stroke="var(--plyta-pelna)" stroke-width="2"/>`;
  }).join('');

  const podpisyX = etykiety?.length
    ? [0, Math.floor((ile - 1) / 2), ile - 1].filter((v, i, t) => t.indexOf(v) === i && etykiety[v])
      .map((i) => `<text class="os-opis" x="${x(i)}" y="${wys - 6}"
        text-anchor="${i === 0 ? 'start' : i === ile - 1 ? 'end' : 'middle'}">${etykiety[i]}</text>`).join('')
    : '';

  const punkty = serie.map((s) => s.wartosci.map((v, i) => `${x(i)},${y(v)}`).join(';')).join('|');

  return `<svg class="wykres" viewBox="0 0 ${szer} ${wys}" width="100%" role="img"
    aria-label="Przebieg formy w sezonie" data-punkty="${punkty}" data-lewo="${margines.lewo}" data-prawo="${szer - margines.prawo}">
    ${siatka}${podpisyX}${linie}
    <line class="krzyzyk" x1="0" y1="${margines.gora}" x2="0" y2="${margines.gora + h}"/>
  </svg>`;
}

/** Krzyżyk + dymek z wartościami, działa i myszą, i palcem. */
export function podepnijKrzyzyk(svg, serie, etykiety, kontener) {
  if (!svg) return;
  const krzyzyk = svg.querySelector('.krzyzyk');
  const dymek = kontener.querySelector('[data-dymek-wykresu]');
  if (!krzyzyk || !dymek) return;
  const punkty = svg.dataset.punkty.split('|').map((s) => s.split(';').map((p) => p.split(',').map(Number)));
  const ile = Math.max(...punkty.map((p) => p.length));

  const rusz = (e) => {
    const pud = svg.getBoundingClientRect();
    const skala = svg.viewBox.baseVal.width / pud.width;
    const mx = (e.clientX - pud.left) * skala;
    const lewo = Number(svg.dataset.lewo);
    const prawo = Number(svg.dataset.prawo);
    const i = Math.max(0, Math.min(ile - 1, Math.round(((mx - lewo) / (prawo - lewo)) * (ile - 1))));
    krzyzyk.setAttribute('x1', punkty[0]?.[i]?.[0] ?? lewo);
    krzyzyk.setAttribute('x2', punkty[0]?.[i]?.[0] ?? lewo);
    krzyzyk.classList.add('widoczny');
    dymek.hidden = false;
    dymek.innerHTML = `<b>${etykiety[i] ?? ''}</b>` + serie.map((s, k) => `
      <span><i style="background:${s.kolor}"></i>${s.nazwa} ${Math.round(s.wartosci[i] ?? s.wartosci.at(-1))}</span>`).join('');
  };
  // W SVG atrybut `hidden` bywa ignorowany, a klasa .dymek-wykresu ma własne
  // `display`, które przebiłoby regułę [hidden], stąd jawne klasy i reguły CSS.
  const schowaj = () => { krzyzyk.classList.remove('widoczny'); dymek.hidden = true; };

  svg.addEventListener('pointermove', rusz);
  svg.addEventListener('pointerdown', rusz);
  svg.addEventListener('pointerleave', schowaj);
  svg.addEventListener('pointercancel', schowaj);
}
