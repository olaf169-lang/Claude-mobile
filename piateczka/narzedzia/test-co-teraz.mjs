// Regresja karty „co teraz” na Starcie. Podstawia dzisiejszą datę i przechodzi
// przez wszystkie stany. Uruchom: node piateczka/narzedzia/test-co-teraz.mjs
// Podstawiamy "dzisiaj", zeby przejsc przez wszystkie stany karty.
const RealDate = Date;
function ustawDzis(iso) {
  const t = new RealDate(`${iso}T15:00:00`).getTime();
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [t])); }
    static now() { return t; }
  };
}
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { kartaCoTeraz } = await import(new URL('../js/ekran-start.js', import.meta.url).href);
const tekst = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const M = (nr, sety) => ({ nr, a: ['jacek'], b: ['tomek'], sety });
const przypadki = [
  ['sobota, nic dzis',        '2026-11-28', []],
  ['wtorek, nic wpisane',     '2026-12-01', []],
  ['dzis wieczor w toku',     '2026-11-28', [{ data: '2026-11-28', format: '2x15', mecze: { 1: M(1, [[15,9],[15,8]]), 2: M(2, [[15,9]]), 3: M(3, []) } }]],
  ['dzis wieczor zapisany',   '2026-11-28', [{ data: '2026-11-28', format: '2x15', zamkniety: true, mecze: { 1: M(1, [[15,9],[15,8]]) } }]],
  ['wtorek wolny (Wigilia)',  '2026-12-20', []],
];
for (const [opis, dzis, wieczory] of przypadki) {
  ustawDzis(dzis);
  console.log(opis.padEnd(24), '|', tekst(kartaCoTeraz(wieczory)));
}
