// Drobne klocki interfejsu: arkusz dolny, komunikat, dźwięk, wibracja,
// animowany podgląd ćwiczenia.

import { OBSZARY } from './dane.js';
import { pobierz } from './magazyn.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z]));

export const IKONY = {
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  zamknij: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

// 90/90 nie ma zdjęcia w bazie, więc dostaje prosty piktogram: siad,
// przednia noga zgięta przed sobą, tylna zgięta z boku.
const PIKTOGRAM_9090 = `<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M8 72h104" stroke-width="3" opacity=".4"/>
  <circle cx="58" cy="14" r="7"/>
  <path d="M58 22v30"/><path d="M58 30l-14 14M58 30l14 12"/>
  <path d="M56 54h28v16"/><path d="M60 54l-24 6 0 10"/>
</svg>`;

// Rozpiętki w pochyleniu stojąc: w bazie zdjęć ich nie ma, więc rysunek
// z przodu, ręce z hantlami schodzą się pod klatką i rozchodzą na boki.
const ramieRozp = (x, znak) => `<g><animateTransform attributeName="transform" type="rotate" values="${znak * 48} ${x} 27;${znak * -10} ${x} 27;${znak * 48} ${x} 27" dur="2.4s" repeatCount="indefinite"/>
  <path d="M${x} 27 v25"/><rect x="${x - 6}" y="51" width="12" height="6" rx="2" fill="currentColor" stroke="none"/></g>`;
const PIKTOGRAM_ROZP = `<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M8 76h104" stroke-width="3" opacity=".4"/>
  <circle cx="60" cy="13" r="7"/>
  <path d="M52 27h16M60 22v26M60 48l-9 26M60 48l9 26"/>
  ${ramieRozp(52, 1)}${ramieRozp(68, -1)}
</svg>`;
const PIKTOGRAMY = { '90-90': ['var(--t-zielona)', PIKTOGRAM_9090], 'rozpietki-pochylenie': ['var(--t-czerwona)', PIKTOGRAM_ROZP] };

export function kolor(obszar) {
  return (OBSZARY[obszar] || {}).kolor || 'var(--chrom)';
}

export function ruch(img, { duzy = false, obszar = '', nazwa = '', id = '' } = {}) {
  const kl = duzy ? ' ruch-duzy' : '';
  if (PIKTOGRAMY[id]) return `<div class="ruch-brak${kl}" style="--kolor:${PIKTOGRAMY[id][0]}">${PIKTOGRAMY[id][1]}</div>`;
  if (!img) {
    const inicjaly = nazwa.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    return `<div class="ruch-brak${kl}" style="--kolor:${kolor(obszar)}" aria-hidden="true">${esc(inicjaly)}</div>`;
  }
  return `<div class="ruch${kl}"><img src="img/cw/${img}-0.webp" alt="" loading="lazy" decoding="async"><img src="img/cw/${img}-1.webp" alt="" loading="lazy" decoding="async"></div>`;
}

export function arkusz(html, { poZamknieciu } = {}) {
  const zaslona = document.createElement('div');
  zaslona.className = 'zaslona';
  const a = document.createElement('section');
  a.className = 'arkusz';
  a.setAttribute('role', 'dialog');
  a.setAttribute('aria-modal', 'true');
  a.innerHTML = `<div class="arkusz-uchwyt" aria-hidden="true"></div>${html}`;
  const poprzedni = document.activeElement;
  const zamknij = () => {
    zaslona.remove();
    a.remove();
    document.removeEventListener('keydown', esc_);
    poprzedni?.focus?.();
    poZamknieciu?.();
  };
  const esc_ = (e) => { if (e.key === 'Escape') zamknij(); };
  zaslona.addEventListener('click', zamknij);
  a.addEventListener('click', (e) => { if (e.target.closest('[data-zamknij]')) zamknij(); });
  document.addEventListener('keydown', esc_);
  // Przesunięcie w dół za uchwyt zamyka arkusz, jak w natywnych apkach.
  let startY = null;
  a.addEventListener('touchstart', (e) => { if (a.scrollTop <= 0) startY = e.touches[0].clientY; }, { passive: true });
  a.addEventListener('touchend', (e) => {
    if (startY !== null && e.changedTouches[0].clientY - startY > 90) zamknij();
    startY = null;
  });
  document.body.append(zaslona, a);
  a.querySelector('button, input, select')?.focus({ preventScroll: true });
  return { el: a, zamknij };
}

export function toast(tekst, czas = 2200) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = tekst;
  document.body.append(t);
  setTimeout(() => t.remove(), czas);
}

export function wibruj(wzor) {
  try { navigator.vibrate?.(wzor); } catch { /* przeglądarka bez wibracji */ }
}

let audio = null;
export function dzwiek(rodzaj = 'koniec') {
  if (!pobierz().ustawienia.dzwiek) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const nuty = {
      koniec: [[880, 0], [1175, 0.16]],
      rekord: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]],
      seria: [[660, 0]],
    }[rodzaj];
    for (const [f, o] of nuty) {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = audio.currentTime + o;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(g).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  } catch { /* bez dźwięku też się da */ }
}

export function czas(sekundy) {
  const s = Math.max(0, Math.round(sekundy));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function dataLadnie(iso) {
  return new Date(iso).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' });
}

// Odznaka: tarcza w kolorze zależnym od pozycji na liście.
export function godloOdznaki(indeks) {
  const kolory = ['var(--t-czerwona)', 'var(--t-niebieska)', 'var(--t-zolta)', 'var(--t-zielona)', 'var(--t-biala)'];
  const k = kolory[indeks % kolory.length];
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="29" fill="${k}" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
    <circle cx="32" cy="32" r="21" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="3"/>
    <circle cx="32" cy="32" r="7" fill="#1F2329" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <path d="M14 22a21 21 0 0 1 12-9" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}
