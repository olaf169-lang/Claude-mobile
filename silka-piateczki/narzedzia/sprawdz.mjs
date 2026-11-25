// Kontrola Siłki Piąteczki: składnia, spójność danych, tryb offline,
// liczenie rekordów i XP, brak pauz. Uruchom z katalogu silka-piateczki:
//   node narzedzia/sprawdz.mjs
// Wynik idzie na standardowe wyjście w Markdownie (podsumowanie w Actions).

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname } from 'node:path';
import assert from 'node:assert/strict';

import { CWICZENIA, PLANY_START, ROZCIAGANIE, POZIOMY, ODZNAKI } from '../js/dane.js';
import {
  sprawdzRekord, podpowiedz, serie, poziom, policzXp, wTerminie, rozciaganieWTygodniu,
} from '../js/logika.js';

const bledy = [];
const ok = [];
const test = (nazwa, fn) => {
  try { fn(); ok.push(nazwa); } catch (e) { bledy.push(`${nazwa}: ${e.message}`); }
};

function pliki(kat) {
  return readdirSync(kat).flatMap((n) => {
    const p = join(kat, n);
    return statSync(p).isDirectory() ? pliki(p) : [p];
  });
}
const wszystkie = pliki('.').filter((p) => !p.startsWith('node_modules'));

test('składnia JS', () => {
  for (const p of wszystkie.filter((x) => extname(x) === '.js' || extname(x) === '.mjs')) {
    execFileSync(process.execPath, ['--check', p]);
  }
});

test('ćwiczenia: unikalne id, istniejące zamienniki i zdjęcia', () => {
  const ids = new Set();
  for (const c of CWICZENIA) {
    assert(!ids.has(c.id), `powtórzone id ${c.id}`);
    ids.add(c.id);
  }
  for (const c of CWICZENIA) {
    for (const a of c.alt) assert(ids.has(a), `${c.id}: brak zamiennika ${a}`);
    for (const k of [0, 1]) assert(existsSync(`img/cw/${c.img}-${k}.webp`), `${c.id}: brak zdjęcia ${c.img}-${k}`);
  }
  for (const p of ['A', 'B']) for (const w of PLANY_START[p]) assert(ids.has(w.cw), `plan ${p}: nieznane ${w.cw}`);
  for (const r of ROZCIAGANIE) if (r.img) assert(existsSync(`img/cw/${r.img}-0.webp`), `rozciąganie ${r.id}: brak zdjęcia`);
});

test('lista zdjęć zgodna z danymi i z sw.js', () => {
  const lista = readFileSync('narzedzia/zdjecia.txt', 'utf8').split(/\s+/).filter(Boolean);
  const uzyte = new Set([...CWICZENIA.map((c) => c.img), ...ROZCIAGANIE.map((r) => r.img).filter(Boolean)]);
  for (const u of uzyte) assert(lista.includes(u), `${u} brakuje w zdjecia.txt`);
  const sw = readFileSync('sw.js', 'utf8');
  for (const z of lista) for (const k of [0, 1]) assert(sw.includes(`./img/cw/${z}-${k}.webp`), `sw.js nie ma ${z}-${k}`);
});

test('sw.js: każdy plik aplikacji na półce i istnieje', () => {
  const sw = readFileSync('sw.js', 'utf8');
  const szkielet = sw.slice(sw.indexOf('SZKIELET'), sw.indexOf('];', sw.indexOf('SZKIELET')));
  for (const m of szkielet.matchAll(/'\.\/([^']*)'/g)) if (m[1]) assert(existsSync(m[1]), `sw.js: nie ma pliku ${m[1]}`);
  for (const js of readdirSync('js')) assert(szkielet.includes(`./js/${js}`), `sw.js: brak ./js/${js}`);
});

// Zbudowane z kodów znaków, żeby sam ten plik nie zawierał pauzy.
const PAUZY = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

test('brak pauz i półpauz', () => {
  const zle = [];
  for (const p of wszystkie.filter((x) => /\.(js|mjs|css|html|md|json|webmanifest|py|txt|svg)$/.test(x))) {
    readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (PAUZY.test(l)) zle.push(`${p}:${i + 1}`); });
  }
  assert(!zle.length, zle.join(', '));
});

test('rekordy', () => {
  const hist = [{ kg: 20, powt: 12 }, { kg: 20, powt: 11 }];
  assert.equal(sprawdzRekord([], { kg: 20, powt: 12 }), null, 'pierwszy raz to nie rekord');
  assert.equal(sprawdzRekord(hist, { kg: 22, powt: 8 }).typ, 'ciezar');
  assert.equal(sprawdzRekord(hist, { kg: 20, powt: 13 }).typ, 'powt');
  assert.equal(sprawdzRekord(hist, { kg: 20, powt: 12 }), null);
  assert.equal(sprawdzRekord(hist, { kg: 18, powt: 12 }), null, 'mniej i tyle samo to nie rekord');
  assert.equal(sprawdzRekord([{ kg: 0, powt: 10 }], { kg: 0, powt: 11 }).typ, 'powt', 'masa ciała');
  assert.equal(sprawdzRekord([{ kg: -20, powt: 8 }], { kg: -15, powt: 6 }).typ, 'ciezar', 'mniejsze odciążenie');
});

test('podpowiedź ciężaru (podwójna progresja)', () => {
  const tr = (kg, a, b) => ({ data: '2026-11-01T10:00:00Z', cwiczenia: [{ cw: 'x', serie: [{ kg, powt: a, ok: true }, { kg, powt: b, ok: true }] }] });
  assert.equal(podpowiedz([], 'x', [8, 12], 'hantle'), null);
  const dol = podpowiedz([tr(20, 12, 12)], 'x', [8, 12], 'hantle');
  assert.equal(dol.kg, 22); assert.equal(dol.dokladaj, true); assert.equal(dol.powt, 8);
  const nie = podpowiedz([tr(20, 12, 10)], 'x', [8, 12], 'maszyna');
  assert.equal(nie.kg, 20); assert.equal(nie.dokladaj, false);
  assert.equal(podpowiedz([tr(40, 12, 12)], 'x', [8, 12], 'maszyna').kg, 42.5);
});

test('seria treningów z przerwą do 5 dni', () => {
  const t = (d) => ({ data: `2026-11-${d}T18:00:00` });
  const s = serie([t('01'), t('05'), t('10'), t('20')], '2026-11-22T10:00:00');
  assert.equal(s.najdluzsza, 3);
  assert.equal(s.biezaca, 1);
  assert.equal(serie([t('01'), t('05')], '2026-11-12T10:00:00').biezaca, 0, 'po 7 dniach seria przepada');
  assert.equal(wTerminie([t('01')], '2026-11-06T18:00:00'), true);
  assert.equal(wTerminie([t('01')], '2026-11-07T18:00:00'), false);
});

test('poziomy i XP', () => {
  assert.equal(poziom(0).numer, 1);
  assert.equal(poziom(POZIOMY[1].prog).numer, 2);
  assert.equal(poziom(999999).masa, 1);
  assert(poziom(300).masa > poziom(100).masa, 'masa rośnie w obrębie poziomu');
  const tr = { data: '2026-11-04T18:00:00', rekordy: [{}], cwiczenia: [{ serie: [{ ok: true }, { ok: true }] }] };
  const xp = policzXp(tr, [{ data: '2026-11-01T18:00:00' }], 1);
  assert.equal(xp.suma, 20 + 100 + 50 + 50 + 60);
  assert.equal(ODZNAKI.length, new Set(ODZNAKI.map((o) => o.id)).size);
});

test('rozciąganie liczy dni w bieżącym tygodniu', () => {
  const dzis = '2026-11-26T12:00:00';
  assert.equal(rozciaganieWTygodniu(['2026-11-23T08:00:00', '2026-11-23T20:00:00', '2026-11-25T08:00:00', '2026-11-21T08:00:00'], dzis), 2);
});

console.log('## Siłka Piąteczki, kontrola\n');
for (const o of ok) console.log(`- ✅ ${o}`);
for (const b of bledy) console.log(`- ❌ ${b}`);
if (bledy.length) process.exit(1);
