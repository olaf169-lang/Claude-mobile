// Koks: rysunkowy siłacz, który rośnie razem z poziomem.
// Wszystko liczone z dwóch liczb: masa (0 = patyczak, 1 = legenda)
// i poza (0 = luz, 1 = podwójny biceps). Każda część to osobna bryła
// z obrysem, bo jedna wspólna sylwetka czytała się jak worek.

const SKORA = '#E2A57B';
const CIEN = '#BF7E57';
const BLASK = '#F4C9A4';
const OBRYS = '#3B2720';

const l = (a, b, t) => a + (b - a) * t;
const r1 = (n) => Math.round(n * 10) / 10;

function ramie(m, p, strona) {
  // strona: 1 prawa (od widza), -1 lewa, rysowana lustrzanie.
  const L1 = 44;
  const L2 = 40;
  const w1 = 9 + 9 * m;
  const b = (3 + 9 * m) * (1 + 0.55 * p);
  const w2 = 7.5 + 5.5 * m;
  const wr = 5 + 2 * m;
  const fr = 8 + 3.5 * m;
  const theta = l(-13, -100, p);
  const phi = l(-10, -92, p);
  const ramieKs = `M${r1(-w1)},0 Q${r1(-w1 - 2)},${L1 * 0.5} ${r1(-w1 * 0.8)},${L1} L${r1(w1 * 0.8)},${L1} C${r1(w1 + b)},${L1 * 0.78} ${r1(w1 + b)},${L1 * 0.28} ${r1(w1)},0 Z`;
  const przed = `M${r1(-w2)},0 Q${r1(-w2 - 3)},${L2 * 0.35} ${r1(-wr)},${L2} L${r1(wr)},${L2} Q${r1(w2 + 2.5)},${L2 * 0.3} ${r1(w2)},0 Z`;
  // Żyła na bicepsie pojawia się dopiero przy większej masie.
  const zyla = m > 0.45
    ? `<path d="M${r1(w1 * 0.6)},${L1 * 0.2} q${r1(b * 0.5)},${L1 * 0.25} ${r1(b * 0.15)},${L1 * 0.55}" fill="none" stroke="${CIEN}" stroke-width="1.6" stroke-linecap="round" opacity="${r1(m)}"/>`
    : '';
  return `
  <g transform="translate(${r1(120 + strona * (34 + 22 * m))},92) scale(${strona},1) rotate(${r1(theta)})">
    <g transform="translate(0,${L1}) rotate(${r1(phi)})">
      <path d="${przed}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M${r1(-w2 * 0.4)},4 q-2,${L2 * 0.4} 0,${L2 * 0.75}" fill="none" stroke="${CIEN}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <circle cx="0" cy="${r1(L2 + fr * 0.55)}" r="${r1(fr)}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2"/>
      <path d="M${r1(-fr * 0.55)},${r1(L2 + fr * 0.2)} h${r1(fr * 1.1)}" stroke="${CIEN}" stroke-width="1.5" stroke-linecap="round"/>
    </g>
    <circle cx="0" cy="${L1}" r="${r1(w1 * 0.82)}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2"/>
    <path d="${ramieKs}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M${r1(w1 * 0.2)},${L1 * 0.22} Q${r1(w1 + b * 0.7)},${L1 * 0.5} ${r1(w1 * 0.3)},${L1 * 0.8}" fill="${BLASK}" opacity=".55"/>
    ${zyla}
  </g>`;
}

function bark(m, strona) {
  const sx = 34 + 22 * m;
  const dr = 11 + 9.5 * m;
  const cx = 120 + strona * sx;
  return `<circle cx="${r1(cx)}" cy="${r1(92 - 1 * m)}" r="${r1(dr)}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2"/>
    <path d="M${r1(cx - strona * dr * 0.5)},${r1(92 - dr * 0.55)} a${r1(dr * 0.7)},${r1(dr * 0.7)} 0 0 ${strona > 0 ? 1 : 0} ${r1(strona * dr * 0.9)},${r1(dr * 0.5)}" fill="none" stroke="${BLASK}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
}

export function rysujKoksa(masa = 0, poza = 0, { mina = 'spokoj' } = {}) {
  const m = Math.max(0, Math.min(1, masa));
  const p = Math.max(0, Math.min(1, poza));
  const sx = 34 + 22 * m;
  const nw = 8 + 7 * m;
  const lat = 30 + 21 * m;
  const talia = 21 + 5 * m;
  const biodra = 25 + 5 * m;
  const trapY = 84 - 9 * m;

  const tulow = `M${r1(120 - nw)},76 C${r1(120 - nw - 6)},${r1(trapY)} ${r1(120 - sx + 6)},${r1(trapY + 2)} ${r1(120 - sx)},90
    C${r1(120 - lat - 2)},104 ${r1(120 - lat)},118 ${r1(120 - lat + 4)},128
    C${r1(120 - talia - 4)},150 ${r1(120 - talia)},168 ${r1(120 - talia)},178
    L${r1(120 - biodra)},194 L${r1(120 + biodra)},194 L${r1(120 + talia)},178
    C${r1(120 + talia)},168 ${r1(120 + talia + 4)},150 ${r1(120 + lat - 4)},128
    C${r1(120 + lat)},118 ${r1(120 + lat + 2)},104 ${r1(120 + sx)},90
    C${r1(120 + sx - 6)},${r1(trapY + 2)} ${r1(120 + nw + 6)},${r1(trapY)} ${r1(120 + nw)},76 Z`;

  const pw = sx - 8;
  const pd = 118 + 8 * m;
  const klata = (s) => `M120,${r1(98 - 2 * m)} L${r1(120 + s * pw * 0.6)},${r1(96 - 2 * m)} Q${r1(120 + s * pw)},98 ${r1(120 + s * pw)},${r1(108 + 2 * m)}
    Q${r1(120 + s * (pw - 2))},${r1(pd)} ${r1(120 + s * pw * 0.45)},${r1(pd + 2)} Q${r1(120 + s * 6)},${r1(pd + 2)} 120,${r1(pd - 2)} Z`;

  const kaloryfer = [];
  const az = 0.22 + 0.6 * m;
  for (let w = 0; w < 3; w++) {
    for (const s of [-1, 1]) {
      const y = pd + 8 + w * 14;
      const x = s < 0 ? 120 - 4 - (9 + 3 * m) : 120 + 4;
      kaloryfer.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(9 + 3 * m)}" height="11" rx="4.5" fill="${CIEN}" opacity="${r1(az)}"/>`);
    }
  }

  const udo = (s) => {
    const cx = 120 + s * (14 + 6 * m);
    const w = 12 + 9 * m;
    return `<path d="M${r1(cx - w)},210 C${r1(cx - w - 3)},228 ${r1(cx - w * 0.7)},246 ${r1(cx - 7)},254 L${r1(cx + 7)},254 C${r1(cx + w * 0.7)},246 ${r1(cx + w + 2)},228 ${r1(cx + w)},210 Z" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M${r1(cx - 7)},252 C${r1(cx - 9 - 4 * m)},262 ${r1(cx - 6)},274 ${r1(cx - 4)},282 L${r1(cx + 4)},282 C${r1(cx + 6)},274 ${r1(cx + 9 + 4 * m)},262 ${r1(cx + 7)},252 Z" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M${r1(cx - 9)},282 h18 q5,0 5,4 v2 h-28 v-2 q0,-4 5,-4 Z" fill="#2A2F37" stroke="${OBRYS}" stroke-width="2"/>`;
  };

  const usmiech = mina === 'radosc' || p > 0.6;
  const twarz = `
    <ellipse cx="113" cy="51" rx="2.2" ry="${usmiech ? 1.4 : 2.6}" fill="${OBRYS}"/>
    <ellipse cx="127" cy="51" rx="2.2" ry="${usmiech ? 1.4 : 2.6}" fill="${OBRYS}"/>
    <path d="M108,${usmiech ? 45 : 46} l9,${usmiech ? 1 : 2.5} M132,${usmiech ? 45 : 46} l-9,${usmiech ? 1 : 2.5}" stroke="${OBRYS}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M120,53 q-1.5,4 1,6" fill="none" stroke="${CIEN}" stroke-width="1.6" stroke-linecap="round"/>
    ${usmiech ? '<path d="M112,63 q8,7 16,0 Z" fill="#fff" stroke="#3B2720" stroke-width="1.6" stroke-linejoin="round"/>' : ''}
    <path d="M120,60 c-4,-2 -9,-2 -12,1 c-2,2 -5,3 -7,1 c2,4 7,4 10,2 c3,-2 6,-2 9,-1 c3,-1 6,-1 9,1 c3,2 8,2 10,-2 c-2,2 -5,1 -7,-1 c-3,-3 -8,-3 -12,-1 Z" fill="#4A2E22" stroke="${OBRYS}" stroke-width="1.2" stroke-linejoin="round"/>`;

  return `<svg viewBox="-30 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Koks na poziomie siły ${Math.round(m * 100)} procent">
  <ellipse cx="120" cy="290" rx="${r1(52 + 20 * m)}" ry="7" fill="#000" opacity=".28"/>
  <g class="koks-cialo">
    ${udo(-1)}${udo(1)}
    <path d="M${r1(120 - biodra - 2)},188 L${r1(120 + biodra + 2)},188 L${r1(120 + biodra + 8 + 6 * m)},222 L${r1(120 + 3)},224 L120,214 L${r1(120 - 3)},224 L${r1(120 - biodra - 8 - 6 * m)},222 Z" fill="var(--t-niebieska, #2F6FDB)" stroke="${OBRYS}" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="${r1(120 - biodra - 2)}" y="184" width="${r1(2 * biodra + 4)}" height="8" rx="3" fill="#1D4FA8" stroke="${OBRYS}" stroke-width="2"/>
    <path d="${tulow}" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="${klata(-1)}" fill="${BLASK}" stroke="${CIEN}" stroke-width="1.8" stroke-linejoin="round" opacity=".95"/>
    <path d="${klata(1)}" fill="${BLASK}" stroke="${CIEN}" stroke-width="1.8" stroke-linejoin="round" opacity=".95"/>
    <path d="M120,${r1(pd + 4)} V180" stroke="${CIEN}" stroke-width="1.6" opacity="${r1(az)}"/>
    ${kaloryfer.join('')}
    ${ramie(m, p, -1)}${ramie(m, p, 1)}
    ${bark(m, -1)}${bark(m, 1)}
    <path d="M${r1(120 - nw)},80 L${r1(120 - nw)},64 L${r1(120 + nw)},64 L${r1(120 + nw)},80 Z" fill="${SKORA}" stroke="${OBRYS}" stroke-width="2.2"/>
    <path d="M${r1(120 - nw)},78 Q${r1(120 - sx * 0.6)},${r1(trapY - 2)} ${r1(120 - sx + 4)},${r1(86 - 2 * m)} M${r1(120 + nw)},78 Q${r1(120 + sx * 0.6)},${r1(trapY - 2)} ${r1(120 + sx - 4)},${r1(86 - 2 * m)}" fill="none" stroke="${CIEN}" stroke-width="1.6" stroke-linecap="round"/>
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
