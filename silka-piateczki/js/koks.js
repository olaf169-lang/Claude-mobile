// Koks: rysunkowy siłacz, który rośnie razem z poziomem.
// Wszystko liczone z dwóch liczb: masa (0 = patyczak, 1 = legenda)
// i poza (0 = luz, 1 = podwójny biceps).
// Proporcje jak u człowieka, około 7,5 głowy wzrostu: krok w połowie wysokości,
// łokieć na wysokości talii, pięść w połowie uda. Ręce i nogi rysujemy dwa razy
// (najpierw gruby obrys, potem samo wypełnienie), więc łokieć i kolano nie mają
// szwu i nie wyglądają jak zawiasy lalki.

const SKORA = '#E2A57B';
const CIEN = '#BF7E57';
const BLASK = '#F4C9A4';
const OBRYS = '#3B2720';

// Pionowe punkty orientacyjne (podłoga na 290, czubek głowy na 33).
const Y = { bark: 86, talia: 146, pas: 150, biodro: 160, krok: 188, kolano: 234, kostka: 280 };

const l = (a, b, t) => a + (b - a) * t;
const r1 = (n) => Math.round(n * 10) / 10;

function wymiary(m) {
  return {
    sx: 30 + 14 * m, // środek barku od osi ciała
    dr: 9 + 8.5 * m, // promień naramiennego
    nw: 7 + 5 * m, // pół szerokości szyi
    lat: 26 + 16 * m, // najszersze plecy
    talia: 19 + 4 * m,
    biodra: 22 + 4 * m,
  };
}

// tryb: 'obrys' | 'skora' | 'detal'
function ramie(m, p, strona, tryb) {
  const { sx } = wymiary(m);
  const L1 = 48;
  const L2 = 41;
  const w1 = 7.5 + 7 * m;
  const b = (2.5 + 7 * m) * (1 + 0.55 * p);
  const w2 = 6.5 + 4.5 * m;
  const wr = 4.5 + 1.5 * m;
  const fr = 7 + 2.5 * m;
  const theta = l(-12, -100, p);
  const phi = l(-8, -94, p);
  const gora = `M${r1(-w1)},0 Q${r1(-w1 - 1.5)},${L1 * 0.5} ${r1(-w1 * 0.75)},${L1} L${r1(w1 * 0.75)},${L1} C${r1(w1 + b)},${L1 * 0.76} ${r1(w1 + b)},${L1 * 0.3} ${r1(w1)},0 Z`;
  const dol = `M${r1(-w2)},0 Q${r1(-w2 - 2.5)},${L2 * 0.35} ${r1(-wr)},${L2} L${r1(wr)},${L2} Q${r1(w2 + 2)},${L2 * 0.3} ${r1(w2)},0 Z`;
  const fy = r1(L2 + fr * 0.6);
  const styl = tryb === 'obrys'
    ? `fill="${OBRYS}" stroke="${OBRYS}" stroke-width="4.6" stroke-linejoin="round"`
    : `fill="${SKORA}"`;
  let przed = '';
  let ramieG = '';
  if (tryb === 'detal') {
    przed = `<path d="M${r1(-w2 * 0.35)},5 q-2,${L2 * 0.4} 0,${L2 * 0.72}" fill="none" stroke="${CIEN}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
      <path d="M${r1(-fr * 0.5)},${r1(L2 + fr * 0.3)} h${r1(fr)}" stroke="${CIEN}" stroke-width="1.5" stroke-linecap="round"/>`;
    ramieG = `<path d="M${r1(w1 * 0.2)},${L1 * 0.24} Q${r1(w1 + b * 0.7)},${L1 * 0.5} ${r1(w1 * 0.3)},${L1 * 0.78}" fill="${BLASK}" opacity=".5"/>
      <path d="M${r1(-w1 * 0.55)},${L1 * 0.15} q-1,${L1 * 0.35} ${r1(w1 * 0.15)},${L1 * 0.6}" fill="none" stroke="${CIEN}" stroke-width="1.4" stroke-linecap="round" opacity="${r1(0.3 + 0.5 * m)}"/>
      ${m > 0.45 ? `<path d="M${r1(w1 * 0.55)},${L1 * 0.22} q${r1(b * 0.45)},${L1 * 0.25} ${r1(b * 0.12)},${L1 * 0.52}" fill="none" stroke="${CIEN}" stroke-width="1.5" stroke-linecap="round" opacity="${r1(m)}"/>` : ''}`;
  } else {
    przed = `<path d="${dol}" ${styl}/><circle cx="0" cy="${fy}" r="${r1(fr)}" ${styl}/>`;
    ramieG = `<circle cx="0" cy="${L1}" r="${r1(w1 * 0.78)}" ${styl}/><path d="${gora}" ${styl}/>`;
  }
  return `<g transform="translate(${r1(120 + strona * sx)},${Y.bark}) scale(${strona},1) rotate(${r1(theta)})">
    <g transform="translate(0,${L1}) rotate(${r1(phi)})">${przed}</g>${ramieG}</g>`;
}

function noga(m, s, tryb) {
  const cx = 120 + s * (12 + 5 * m);
  const w = 12 + 7.5 * m;
  const k = Y.kolano;
  const udo = `M${r1(cx - w)},172 C${r1(cx - w - 3)},196 ${r1(cx - w * 0.7)},${k - 12} ${r1(cx - 7)},${k} L${r1(cx + 7)},${k} C${r1(cx + w * 0.7)},${k - 12} ${r1(cx + w + 2)},196 ${r1(cx + w)},172 Z`;
  const lydka = `M${r1(cx - 7)},${k - 2} C${r1(cx - 10 - 4 * m)},${k + 12} ${r1(cx - 6)},${Y.kostka - 12} ${r1(cx - 4)},${Y.kostka} L${r1(cx + 4)},${Y.kostka} C${r1(cx + 6)},${Y.kostka - 12} ${r1(cx + 10 + 4 * m)},${k + 12} ${r1(cx + 7)},${k - 2} Z`;
  if (tryb === 'detal') {
    return `<path d="M${r1(cx - 4)},${k - 3} q4,3 8,0" fill="none" stroke="${CIEN}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M${r1(cx + s * w * 0.15)},184 q${r1(-s * 3)},20 ${r1(-s * 1)},38" fill="none" stroke="${CIEN}" stroke-width="1.4" stroke-linecap="round" opacity="${r1(0.25 + 0.5 * m)}"/>
      <path d="M${r1(cx - 9)},${Y.kostka} h18 q5,0 5,4 v4 h-28 v-4 q0,-4 5,-4 Z" fill="#2A2F37" stroke="${OBRYS}" stroke-width="2"/>`;
  }
  const styl = tryb === 'obrys'
    ? `fill="${OBRYS}" stroke="${OBRYS}" stroke-width="4.6" stroke-linejoin="round"`
    : `fill="${SKORA}"`;
  return `<path d="${udo}" ${styl}/><path d="${lydka}" ${styl}/>`;
}

function bark(m, strona) {
  const { sx, dr } = wymiary(m);
  const cx = 120 + strona * sx;
  const cy = Y.bark - 1 * m;
  return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(dr)}" ry="${r1(dr * 1.08)}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.3"/>
    <path d="M${r1(cx - strona * dr * 0.5)},${r1(cy - dr * 0.6)} a${r1(dr * 0.7)},${r1(dr * 0.7)} 0 0 ${strona > 0 ? 1 : 0} ${r1(strona * dr * 0.9)},${r1(dr * 0.5)}" fill="none" stroke="${BLASK}" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>`;
}

export function rysujKoksa(masa = 0, poza = 0, { mina = 'spokoj' } = {}) {
  const m = Math.max(0, Math.min(1, masa));
  const p = Math.max(0, Math.min(1, poza));
  const { sx, nw, lat, talia, biodra } = wymiary(m);
  const trapY = 80 - 7 * m;

  const tulow = `M${r1(120 - nw)},72 C${r1(120 - nw - 6)},${r1(trapY)} ${r1(120 - sx + 6)},${r1(trapY + 2)} ${r1(120 - sx)},${Y.bark}
    C${r1(120 - lat - 2)},98 ${r1(120 - lat)},106 ${r1(120 - lat + 3)},114
    C${r1(120 - talia - 3)},126 ${r1(120 - talia)},136 ${r1(120 - talia)},${Y.talia}
    L${r1(120 - biodra)},${Y.biodro} L${r1(120 + biodra)},${Y.biodro} L${r1(120 + talia)},${Y.talia}
    C${r1(120 + talia)},136 ${r1(120 + talia + 3)},126 ${r1(120 + lat - 3)},114
    C${r1(120 + lat)},106 ${r1(120 + lat + 2)},98 ${r1(120 + sx)},${Y.bark}
    C${r1(120 + sx - 6)},${r1(trapY + 2)} ${r1(120 + nw + 6)},${r1(trapY)} ${r1(120 + nw)},72 Z`;

  const pw = sx - 6;
  const pd = 106 + 6 * m;
  const klata = (s) => `M120,${r1(91 - 2 * m)} L${r1(120 + s * pw * 0.6)},${r1(90 - 2 * m)} Q${r1(120 + s * pw)},92 ${r1(120 + s * pw)},${r1(100 + 2 * m)}
    Q${r1(120 + s * (pw - 2))},${r1(pd)} ${r1(120 + s * pw * 0.45)},${r1(pd + 1.5)} Q${r1(120 + s * 5)},${r1(pd + 1.5)} 120,${r1(pd - 2)} Z`;

  const kaloryfer = [];
  const az = 0.22 + 0.6 * m;
  for (let w = 0; w < 3; w++) {
    for (const s of [-1, 1]) {
      const y = pd + 5 + w * 11;
      const szer = 8 + 2.5 * m;
      const x = s < 0 ? 120 - 3 - szer : 120 + 3;
      kaloryfer.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(szer)}" height="9" rx="4" fill="${CIEN}" opacity="${r1(az)}"/>`);
    }
  }

  const usmiech = mina === 'radosc' || p > 0.6;
  const twarz = `
    <g class="koks-oczy"><ellipse cx="113" cy="51" rx="2.2" ry="${usmiech ? 1.4 : 2.6}" fill="${OBRYS}"/>
    <ellipse cx="127" cy="51" rx="2.2" ry="${usmiech ? 1.4 : 2.6}" fill="${OBRYS}"/></g>
    <path d="M108,${usmiech ? 45 : 46} l9,${usmiech ? 1 : 2.5} M132,${usmiech ? 45 : 46} l-9,${usmiech ? 1 : 2.5}" stroke="${OBRYS}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M120,53 q-1.5,4 1,6" fill="none" stroke="${CIEN}" stroke-width="1.6" stroke-linecap="round"/>
    ${usmiech ? '<path d="M112,63 q8,7 16,0 Z" fill="#fff" stroke="#3B2720" stroke-width="1.6" stroke-linejoin="round"/>' : ''}
    <path class="koks-wasy" d="M120,60 c-4,-2 -9,-2 -12,1 c-2,2 -5,3 -7,1 c2,4 7,4 10,2 c3,-2 6,-2 9,-1 c3,-1 6,-1 9,1 c3,2 8,2 10,-2 c-2,2 -5,1 -7,-1 c-3,-3 -8,-3 -12,-1 Z" fill="#4A2E22" stroke="${OBRYS}" stroke-width="1.2" stroke-linejoin="round"/>`;

  return `<svg viewBox="-30 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Koks na poziomie siły ${Math.round(m * 100)} procent">
  <ellipse cx="120" cy="290" rx="${r1(46 + 16 * m)}" ry="7" fill="#000" opacity=".28"/>
  <g class="koks-cialo">
    ${noga(m, -1, 'obrys')}${noga(m, 1, 'obrys')}
    ${noga(m, -1, 'skora')}${noga(m, 1, 'skora')}
    ${noga(m, -1, 'detal')}${noga(m, 1, 'detal')}
    <path d="${tulow}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M${r1(120 - biodra - 2)},${Y.pas} L${r1(120 + biodra + 2)},${Y.pas} L${r1(120 + biodra + 7 + 5 * m)},${Y.krok} L${r1(123)},${Y.krok + 2} L120,${Y.krok - 9} L${r1(117)},${Y.krok + 2} L${r1(120 - biodra - 7 - 5 * m)},${Y.krok} Z" fill="var(--t-niebieska, #2F6FDB)" stroke="${OBRYS}" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="${r1(120 - biodra - 2)}" y="${Y.pas - 4}" width="${r1(2 * biodra + 4)}" height="8" rx="3" fill="#1D4FA8" stroke="${OBRYS}" stroke-width="2"/>
    <path d="${klata(-1)}" fill="${BLASK}" stroke="${CIEN}" stroke-width="1.8" stroke-linejoin="round" opacity=".95"/>
    <path d="${klata(1)}" fill="${BLASK}" stroke="${CIEN}" stroke-width="1.8" stroke-linejoin="round" opacity=".95"/>
    <path d="M120,${r1(pd + 3)} V${Y.pas - 5}" stroke="${CIEN}" stroke-width="1.6" opacity="${r1(az)}"/>
    ${kaloryfer.join('')}
    <path d="M${r1(120 - talia - 1)},${Y.talia - 14} q5,6 4,14 M${r1(120 + talia + 1)},${Y.talia - 14} q-5,6 -4,14" fill="none" stroke="${CIEN}" stroke-width="1.4" stroke-linecap="round" opacity="${r1(0.2 + 0.5 * m)}"/>
    ${ramie(m, p, -1, 'obrys')}${ramie(m, p, 1, 'obrys')}
    ${ramie(m, p, -1, 'skora')}${ramie(m, p, 1, 'skora')}
    ${ramie(m, p, -1, 'detal')}${ramie(m, p, 1, 'detal')}
    ${bark(m, -1)}${bark(m, 1)}
    <path d="M${r1(120 - nw)},76 L${r1(120 - nw)},60 L${r1(120 + nw)},60 L${r1(120 + nw)},76 Z" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2"/>
    <path d="M${r1(120 - nw)},74 Q${r1(120 - sx * 0.6)},${r1(trapY - 2)} ${r1(120 - sx + 4)},${r1(Y.bark - 5 - 2 * m)} M${r1(120 + nw)},74 Q${r1(120 + sx * 0.6)},${r1(trapY - 2)} ${r1(120 + sx - 4)},${r1(Y.bark - 5 - 2 * m)}" fill="none" stroke="${CIEN}" stroke-width="1.6" stroke-linecap="round"/>
    <g class="koks-glowa">
      <circle cx="120" cy="50" r="17" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.4"/>
      <path d="M103,46 C103,30 137,30 137,46 C137,40 130,36 120,36 C110,36 103,40 103,46 Z" fill="#4A2E22" stroke="${OBRYS}" stroke-width="1.6"/>
      <rect x="102.5" y="40" width="35" height="6" rx="2" fill="var(--t-czerwona, #E03A3E)" stroke="${OBRYS}" stroke-width="1.6"/>
      <path class="koks-opaska" d="M137,42 q8,-1 12,4 M137,44 q7,3 9,9" fill="none" stroke="var(--t-czerwona, #E03A3E)" stroke-width="3.2" stroke-linecap="round"/>
      ${twarz}
    </g>
  </g>
</svg>`;
}

// Animuje masę i pozę elementu. Zwraca obietnicę, która kończy się z animacją.
export function animujKoksa(el, od, doCelu, czas = 900, opcje = {}) {
  const ogranicz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ogranicz) {
    el.innerHTML = rysujKoksa(doCelu.masa, doCelu.poza, opcje);
    return Promise.resolve();
  }
  return new Promise((gotowe) => {
    const start = performance.now();
    const krok = (t) => {
      const k = Math.min(1, (t - start) / czas);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      el.innerHTML = rysujKoksa(l(od.masa, doCelu.masa, e), l(od.poza, doCelu.poza, e), opcje);
      if (k < 1) requestAnimationFrame(krok);
      else gotowe();
    };
    requestAnimationFrame(krok);
  });
}

// Sztanga jako pasek postępu: tarcze dokładają się od środka na zewnątrz,
// od największej (czerwona 25) do najmniejszej (biała 5).
const TARCZE = [
  { kolor: 'var(--t-czerwona)', h: 54 },
  { kolor: 'var(--t-niebieska)', h: 50 },
  { kolor: 'var(--t-zolta)', h: 44 },
  { kolor: 'var(--t-zielona)', h: 38 },
  { kolor: 'var(--t-biala)', h: 30 },
];

export function rysujSztange(postep) {
  const ile = postep * TARCZE.length;
  const tarcze = [];
  for (let i = 0; i < TARCZE.length; i++) {
    const czesc = Math.max(0, Math.min(1, ile - i));
    if (czesc <= 0) break;
    const t = TARCZE[i];
    for (const s of [-1, 1]) {
      const x = s > 0 ? 230 + i * 14 : 78 - i * 14;
      tarcze.push(`<rect x="${x}" y="${r1(36 - t.h / 2)}" width="12" height="${t.h}" rx="3" fill="${t.kolor}" opacity="${czesc < 1 ? r1(0.25 + 0.5 * czesc) : 1}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`);
    }
  }
  return `<svg viewBox="0 0 320 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="6" y="31" width="92" height="10" rx="3" fill="var(--chrom)"/>
    <rect x="222" y="31" width="92" height="10" rx="3" fill="var(--chrom)"/>
    <rect x="98" y="33" width="124" height="6" rx="3" fill="var(--chrom-ciemny)"/>
    <rect x="92" y="25" width="8" height="22" rx="2" fill="var(--chrom)"/>
    <rect x="220" y="25" width="8" height="22" rx="2" fill="var(--chrom)"/>
    ${tarcze.join('')}
  </svg>`;
}
