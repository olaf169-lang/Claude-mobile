// Kontrola przed publikacją. Uruchom z katalogu mb-goat-guide/:
//   node narzedzia/sprawdz.mjs
// Sprawdza: składnię skryptów, czy service worker zna wszystkie pliki,
// czy dane mają sensowny kształt i czy w tekstach nie ma pauz ani półpauz.
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const bledy = [];
const czytaj = (p) => readFileSync(p, 'utf8');
const html = czytaj('index.html');
const skrypty = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

// 1. Składnia każdego skryptu i całości złożonej w kolejności z index.html.
for (const p of skrypty) {
  try { new vm.Script(czytaj(p), { filename: p }); } catch (e) { bledy.push(`Składnia ${p}: ${e.message}`); }
}
try { new vm.Script(skrypty.map(czytaj).join('\n'), { filename: 'całość' }); } catch (e) { bledy.push(`Składnia całości: ${e.message}`); }

// 2. Service worker musi trzymać na półce każdy plik, który wczytuje strona.
const sw = czytaj('sw.js');
for (const p of [...skrypty, 'styles.css', 'manifest.webmanifest']) {
  if (!sw.includes(`'./${p}'`)) bledy.push(`sw.js nie ma na liście ${p}, bez zasięgu ten plik się nie wczyta`);
}
for (const m of sw.matchAll(/'\.\/([^']+)'/g)) {
  if (m[1] && !existsSync(m[1])) bledy.push(`sw.js wymienia ${m[1]}, a takiego pliku nie ma`);
}

// 3. Dane: liczby i kształt wpisów.
const ctx = vm.createContext({});
vm.runInContext(['dane/jednostki.js', 'dane/drzewka.js', 'dane/kodeks.js', 'dane/zbrojownia.js', 'dane/biblia.js'].map(czytaj).join('\n')
  + '\n;globalThis.__d = { RAW, TREES, TOPICS, KB, SRC, ARMORY, ARMORY_HOW };', ctx);
const { RAW, TREES, TOPICS, KB, SRC, ARMORY, ARMORY_HOW } = ctx.__d;
const KULTURY = ['emp', 'vla', 'stu', 'bat', 'ase', 'khu', 'nor', 'any'];
for (const a of ARMORY) {
  for (const c of a.champ) if (!KULTURY.includes(c)) bledy.push(`Zbrojownia ${a.id}: nieznana kultura mistrza ${c}`);
  if (a.tipSrc && !SRC[a.tipSrc]) bledy.push(`Zbrojownia ${a.id}: nieznane źródło rady ${a.tipSrc}`);
  for (const i of a.items) {
    if (i.length !== 8) bledy.push(`Zbrojownia ${a.id}: przedmiot ${i[0]} ma ${i.length} pól zamiast 8`);
    if (!KULTURY.includes(i[2])) bledy.push(`Zbrojownia ${a.id}: ${i[0]} ma nieznaną kulturę ${i[2]}`);
    if (!SRC[i[7]]) bledy.push(`Zbrojownia ${a.id}: ${i[0]} wskazuje nieznane źródło ${i[7]}`);
  }
}
for (const h of ARMORY_HOW) if (!SRC[h[2]]) bledy.push(`Zbrojownia, jak zdobyć: nieznane źródło ${h[2]}`);
if (RAW.length < 100) bledy.push(`Za mało jednostek: ${RAW.length}`);
if (Object.keys(TREES).length < 7) bledy.push(`Za mało drzewek: ${Object.keys(TREES).length}`);
const ids = new Set();
for (const w of KB) {
  if (w.length !== 6) bledy.push(`Biblia: wpis ${w[0]} ma ${w.length} pól zamiast 6`);
  if (ids.has(w[0])) bledy.push(`Biblia: powtórzony identyfikator ${w[0]}`);
  ids.add(w[0]);
  for (const k of w[4]) if (!SRC[k]) bledy.push(`Biblia: wpis ${w[0]} wskazuje nieznane źródło ${k}`);
}
for (const t of TOPICS) for (const lv of t.levels) for (const tip of lv) {
  if (tip[2] && !SRC[tip[2]]) bledy.push(`Kodeks ${t.id}: porada „${tip[0]}” wskazuje nieznane źródło ${tip[2]}`);
}

// 4. Bez pauz i półpauz w tekstach (wyjątek: wyrażenie w czacie, które je usuwa).
for (const p of ['index.html', ...skrypty, 'manifest.webmanifest']) {
  czytaj(p).split('\n').forEach((linia, i) => {
    if (/[–—]/.test(linia) && !linia.includes('const nodash')) bledy.push(`${p}:${i + 1} ma pauzę lub półpauzę`);
  });
}

if (bledy.length) {
  console.error(`Problemy (${bledy.length}):\n- ${bledy.join('\n- ')}`);
  process.exit(1);
}
console.log(`W porządku: ${skrypty.length} skryptów, ${RAW.length} jednostek, ${Object.keys(TREES).length} drzewek, ${KB.length} wpisów Biblii, ${TOPICS.length} działów Kodeksu, ${ARMORY.length} kategorii Zbrojowni.`);
