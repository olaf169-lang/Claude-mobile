// Wykresy postępu ćwiczenia: najlepsza seria z każdego treningu.

import { e1rm, fmtKg } from './logika.js';

// Punkt na trening: szacowany maks z najlepszej serii. Ćwiczenia bez ciężaru
// (pompki, deska) liczą się powtórzeniami.
export function punktyCwiczenia(treningi, cwId) {
  const punkty = [];
  for (const t of treningi) {
    const c = (t.cwiczenia || []).find((x) => x.cw === cwId);
    const ok = c ? c.serie.filter((s) => s.ok && s.powt > 0) : [];
    if (!ok.length) continue;
    const zCiezarem = ok.some((s) => s.kg > 0);
    const wartosc = zCiezarem
      ? Math.max(...ok.map((s) => e1rm(s.kg, s.powt)))
      : Math.max(...ok.map((s) => s.powt));
    const najlepsza = ok.reduce((a, s) => (zCiezarem ? e1rm(s.kg, s.powt) > e1rm(a.kg, a.powt) : s.powt > a.powt) ? s : a);
    punkty.push({ data: t.data, wartosc, najlepsza, zCiezarem });
  }
  return punkty;
}

export function mini(punkty, kolor = 'var(--t-zolta)') {
  if (punkty.length < 2) return '<svg class="wykres-mini" viewBox="0 0 90 34" aria-hidden="true"><path d="M4 26h82" stroke="var(--grafit-3)" stroke-width="2" stroke-dasharray="3 4"/></svg>';
  const w = punkty.map((p) => p.wartosc);
  const min = Math.min(...w);
  const max = Math.max(...w);
  const zakres = max - min || 1;
  const xy = punkty.map((p, i) => [4 + (i / (punkty.length - 1)) * 82, 30 - ((p.wartosc - min) / zakres) * 24]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const [lx, ly] = xy[xy.length - 1];
  return `<svg class="wykres-mini" viewBox="0 0 90 34" aria-hidden="true"><path d="${d}" fill="none" stroke="${kolor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${lx}" cy="${ly}" r="3.5" fill="${kolor}"/></svg>`;
}

export function duzy(punkty, kolor = 'var(--t-zolta)') {
  if (!punkty.length) return '<div class="pusto">Brak wpisów. Zrób to ćwiczenie, a tu pojawi się wykres.</div>';
  const W = 340;
  const H = 170;
  const L = 34;
  const w = punkty.map((p) => p.wartosc);
  let min = Math.min(...w);
  let max = Math.max(...w);
  if (max - min < 4) { min -= 2; max += 2; }
  const x = (i) => (punkty.length === 1 ? (L + W) / 2 : L + (i / (punkty.length - 1)) * (W - L - 8));
  const y = (v) => 14 + (1 - (v - min) / (max - min)) * (H - 40);
  const d = punkty.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.wartosc).toFixed(1)}`).join('');
  const siatka = [min, (min + max) / 2, max].map((v) => `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--linia)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--popiol)">${fmtKg(Math.round(v))}</text>`).join('');
  const etykiety = [0, punkty.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => `<text x="${x(i)}" y="${H - 4}" text-anchor="${i === 0 && punkty.length > 1 ? 'start' : 'end'}" font-size="11" fill="var(--popiol)">${new Date(punkty[i].data).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</text>`).join('');
  const kropki = punkty.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.wartosc)}" r="3.5" fill="${kolor}"/>`).join('');
  const opis = punkty[0].zCiezarem ? 'Szacowany maks na 1 powtórzenie (kg)' : 'Najwięcej powtórzeń w serii';
  return `<svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opis}">${siatka}<path d="${d}" fill="none" stroke="${kolor}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${kropki}${etykiety}</svg><p class="maly cichy">${opis}, najlepsza seria z każdego treningu.</p>`;
}
