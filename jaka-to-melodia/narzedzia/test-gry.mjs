#!/usr/bin/env node
/* Testy silnika gry — bez przeglądarki i bez sieci.
   Pilnują tego, co psuje wieczór: powtórzonej odpowiedzi w pytaniu, tej samej
   piosenki dwa razy w jednej grze i punktacji, która nie nagradza refleksu. */

import assert from 'node:assert/strict';

import { przygotujKatalog, KATEGORIE } from '../js/katalog.js';
import {
  USTAWIENIA_DOMYSLNE, MAKS_PUNKTOW,
  ulozRundy, pulaUtworow, zbudujRunde, dobierzBledne,
  punktyZaOdpowiedz, ranking, losowanie, przetasuj,
} from '../js/gra.js';

const katalog = przygotujKatalog();
const zdane = [];
const sprawdz = (opis, fn) => { fn(); zdane.push(opis); console.log(`✓ ${opis}`); };

/* --- pula --- */

sprawdz('filtr kategorii i dekad zwraca tylko to, co zaznaczone', () => {
  const pula = pulaUtworow({ kategorie: ['rock'], dekady: [1990] }, { katalog });
  assert.ok(pula.length > 5, `za mało rocka z lat 90.: ${pula.length}`);
  for (const u of pula) {
    assert.equal(u.gatunek, 'rock');
    assert.equal(u.dekada, 1990);
  }
});

sprawdz('kategoria „polskie” zbiera polskie utwory ze wszystkich gatunków', () => {
  const pula = pulaUtworow({ kategorie: ['polskie'], dekady: [1980, 1990, 2000, 2010, 2020] }, { katalog });
  assert.ok(pula.length > 50, `za mało polskich: ${pula.length}`);
  assert.ok(new Set(pula.map((u) => u.styl)).size >= 3, 'polskie powinny obejmować kilka stylów');
  assert.equal(pula.filter((u) => u.gatunek !== 'polskie').length, 0);
});

sprawdz('utwory bez nagrania wypadają z puli, gdy gramy z dźwiękiem', () => {
  const zNagraniem = new Set(katalog.slice(0, 30).map((u) => u.id));
  const pula = pulaUtworow(USTAWIENIA_DOMYSLNE, { katalog, maPodglad: (u) => zNagraniem.has(u.id) });
  assert.equal(pula.length, 30);
});

/* --- budowa rundy --- */

sprawdz('każda runda ma cztery różne odpowiedzi i dokładnie jedną poprawną', () => {
  const losuj = losowanie(1234);
  for (const utwor of przetasuj(katalog, losuj).slice(0, 120)) {
    for (const typ of ['tytul', 'wykonawca']) {
      const runda = zbudujRunde(utwor, katalog, typ, losuj);
      assert.equal(runda.odpowiedzi.length, 4, `${utwor.tytul}: nie cztery odpowiedzi`);
      assert.equal(new Set(runda.odpowiedzi.map((o) => o.toLowerCase())).size, 4,
        `${utwor.tytul} (${typ}): powtórzona odpowiedź — ${runda.odpowiedzi.join(' / ')}`);
      const oczekiwana = typ === 'wykonawca' ? utwor.wykonawca : utwor.tytul;
      assert.equal(runda.odpowiedzi[runda.poprawna], oczekiwana);
    }
  }
});

sprawdz('przy pytaniu „kto śpiewa” nie stoją obok siebie ten sam artysta i jego duet', () => {
  const losuj = losowanie(77);
  for (const utwor of katalog.filter((u) => u.kluczeWykonawcow.length > 1).slice(0, 40)) {
    const runda = zbudujRunde(utwor, katalog, 'wykonawca', losuj);
    const wszystkieNazwy = runda.odpowiedzi.flatMap((o) =>
      o.toLowerCase().split(/\s+(?:feat\.|ft\.|&|x|i)\s+|,\s+/).map((c) => c.trim()));
    assert.equal(new Set(wszystkieNazwy).size, wszystkieNazwy.length,
      `powtórzony artysta w pytaniu: ${runda.odpowiedzi.join(' / ')}`);
  }
});

sprawdz('błędne odpowiedzi trzymają się gatunku i dekady poprawnej', () => {
  const losuj = losowanie(9);
  let trafione = 0;
  let wszystkich = 0;
  for (const utwor of przetasuj(katalog, losuj).slice(0, 200)) {
    for (const zly of dobierzBledne(utwor, katalog, 'tytul', losuj)) {
      wszystkich += 1;
      if (zly.gatunek === utwor.gatunek || zly.dekada === utwor.dekada) trafione += 1;
    }
  }
  const udzial = trafione / wszystkich;
  assert.ok(udzial > 0.9, `za mało pasujących dystraktorów: ${Math.round(udzial * 100)}%`);
});

/* --- cała gra --- */

sprawdz('gra nie powtarza utworu i mieści się w zamówionej liczbie rund', () => {
  const ustawienia = { ...USTAWIENIA_DOMYSLNE, liczbaRund: 20 };
  for (const ziarno of [1, 2, 3, 4, 5]) {
    const rundy = ulozRundy(ustawienia, { katalog, ziarno });
    assert.equal(rundy.length, 20);
    assert.equal(new Set(rundy.map((r) => r.utwor.id)).size, 20, 'ten sam utwór dwa razy');
  }
});

sprawdz('ten sam wykonawca nie wypada w dwóch rundach z rzędu', () => {
  for (const ziarno of [11, 22, 33]) {
    const rundy = ulozRundy({ ...USTAWIENIA_DOMYSLNE, liczbaRund: 25 }, { katalog, ziarno });
    for (let i = 1; i < rundy.length; i += 1) {
      assert.notEqual(rundy[i].utwor.kluczWykonawcy, rundy[i - 1].utwor.kluczWykonawcy,
        `dwa razy z rzędu ${rundy[i].utwor.wykonawca}`);
    }
  }
});

sprawdz('mała pula skraca grę zamiast powtarzać utwory', () => {
  const rundy = ulozRundy({ ...USTAWIENIA_DOMYSLNE, kategorie: ['rap'], dekady: [1980], liczbaRund: 40 }, { katalog });
  const dostepne = pulaUtworow({ kategorie: ['rap'], dekady: [1980] }, { katalog }).length;
  assert.equal(rundy.length, dostepne);
  assert.equal(new Set(rundy.map((r) => r.utwor.id)).size, rundy.length);
});

sprawdz('to samo ziarno daje tę samą grę', () => {
  const a = ulozRundy(USTAWIENIA_DOMYSLNE, { katalog, ziarno: 4242 });
  const b = ulozRundy(USTAWIENIA_DOMYSLNE, { katalog, ziarno: 4242 });
  assert.deepEqual(a.map((r) => [r.utwor.id, r.poprawna]), b.map((r) => [r.utwor.id, r.poprawna]));
});

sprawdz('każda kategoria da się zagrać w pojedynkę', () => {
  for (const kategoria of KATEGORIE) {
    const rundy = ulozRundy(
      { ...USTAWIENIA_DOMYSLNE, kategorie: [kategoria.id], liczbaRund: 10 },
      { katalog },
    );
    assert.equal(rundy.length, 10, `${kategoria.nazwa}: wyszło ${rundy.length} rund`);
  }
});

/* --- punktacja --- */

sprawdz('szybciej znaczy więcej, a maksimum to setka', () => {
  const limitMs = 15_000;
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: 0, limitMs }), MAKS_PUNKTOW);
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: limitMs, limitMs }), MAKS_PUNKTOW / 2);
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: limitMs / 2, limitMs }), 75);
  assert.equal(punktyZaOdpowiedz({ poprawna: false, czasMs: 0, limitMs }), 0);

  let poprzednie = Infinity;
  for (let czasMs = 0; czasMs <= limitMs; czasMs += 500) {
    const punkty = punktyZaOdpowiedz({ poprawna: true, czasMs, limitMs });
    assert.ok(punkty <= poprzednie, 'punkty rosną wraz z czasem');
    poprzednie = punkty;
  }
});

sprawdz('czas ponad limit nie schodzi poniżej połowy puli', () => {
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: 99_000, limitMs: 10_000 }), 50);
});

sprawdz('bonus za serię działa dopiero od drugiego trafienia i ma sufit', () => {
  const wspolne = { poprawna: true, czasMs: 0, limitMs: 10_000, bonusSerii: true };
  assert.equal(punktyZaOdpowiedz({ ...wspolne, seria: 1 }), 100);
  assert.equal(punktyZaOdpowiedz({ ...wspolne, seria: 2 }), 110);
  assert.equal(punktyZaOdpowiedz({ ...wspolne, seria: 9 }), 150);
  assert.equal(punktyZaOdpowiedz({ ...wspolne, seria: 9, bonusSerii: false }), 100);
});

/* --- tabela --- */

sprawdz('tabela sortuje po punktach, przy remisie po trafieniach', () => {
  const gracze = new Map([
    ['a', { id: 'a', ksywka: 'Ala', punkty: 120, trafienia: 2 }],
    ['b', { id: 'b', ksywka: 'Bartek', punkty: 200, trafienia: 3 }],
    ['c', { id: 'c', ksywka: 'Celina', punkty: 120, trafienia: 3 }],
  ]);
  const tabela = ranking(gracze);
  assert.deepEqual(tabela.map((g) => g.ksywka), ['Bartek', 'Celina', 'Ala']);
  assert.deepEqual(tabela.map((g) => g.miejsce), [1, 2, 3]);
});

console.log(`\nSILNIK OK — ${zdane.length} sprawdzeń`);
