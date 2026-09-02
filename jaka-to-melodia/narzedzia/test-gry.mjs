#!/usr/bin/env node
/* Testy silnika gry — bez przeglądarki i bez sieci.
   Pilnują tego, co psuje wieczór: powtórzonej odpowiedzi w pytaniu, tej samej
   piosenki dwa razy w jednej grze i punktacji, która nie nagradza refleksu. */

import assert from 'node:assert/strict';

import { przygotujKatalog, KATEGORIE, DEKADY } from '../js/katalog.js';
import {
  USTAWIENIA_DOMYSLNE, MAKS_PUNKTOW, MIN_UDZIAL_PUNKTOW,
  ulozSerie, pulaUtworow, zbudujRunde, dobierzBledne,
  punktyZaOdpowiedz, ranking, losowanie, przetasuj,
  wylosujWybierajacego, opiszTemat,
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

sprawdz('domyślnie muzyka gra tylko u prowadzącego', () => {
  assert.equal(USTAWIENIA_DOMYSLNE.muzykaWszedzie, false);
});

/* --- budowa rundy --- */

sprawdz('każda runda ma cztery różne odpowiedzi i dokładnie jedną poprawną', () => {
  const losuj = losowanie(1234);
  // Filmowa ma inną zasadę (patrz niżej) — ten test sprawdza klasyczne tytuł/wykonawca.
  for (const utwor of przetasuj(katalog.filter((u) => u.gatunek !== 'filmowa'), losuj).slice(0, 120)) {
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
  for (const utwor of katalog.filter((u) => u.gatunek !== 'filmowa' && u.kluczeWykonawcow.length > 1).slice(0, 40)) {
    const runda = zbudujRunde(utwor, katalog, 'wykonawca', losuj);
    const wszystkieNazwy = runda.odpowiedzi.flatMap((o) =>
      o.toLowerCase().split(/\s+(?:feat\.|ft\.|&|x|i)\s+|,\s+/).map((c) => c.trim()));
    assert.equal(new Set(wszystkieNazwy).size, wszystkieNazwy.length,
      `powtórzony artysta w pytaniu: ${runda.odpowiedzi.join(' / ')}`);
  }
});

/* --- muzyka filmowa: wyjątek od zwykłych pytań --- */

sprawdz('filmowa pyta o film, nie o tytuł ani wykonawcę', () => {
  const losuj = losowanie(55);
  const filmoweZFilmem = katalog.filter((u) => u.gatunek === 'filmowa' && u.film);
  assert.ok(filmoweZFilmem.length > 100, `za mało filmowych z przypisanym filmem: ${filmoweZFilmem.length}`);
  for (const utwor of przetasuj(filmoweZFilmem, losuj).slice(0, 60)) {
    const runda = zbudujRunde(utwor, katalog, 'tytul', losuj);
    assert.equal(runda.typ, 'film', `${utwor.tytul}: powinien być typ „film”`);
    assert.ok(['tytul', 'wykonawca'].includes(runda.wskazany), `${utwor.tytul}: dziwna wartość wskazany`);
    assert.equal(runda.odpowiedzi.length, 4, `${utwor.tytul}: nie cztery odpowiedzi`);
    assert.equal(new Set(runda.odpowiedzi).size, 4, `${utwor.tytul}: powtórzony film wśród odpowiedzi`);
    assert.equal(runda.odpowiedzi[runda.poprawna], utwor.film, `${utwor.tytul}: poprawna odpowiedź to nie ten film`);
    // Podpowiedź na ekranie musi zdradzać dokładnie jedną z dwóch rzeczy —
    // tę wskazaną w `wskazany` — a nie obie naraz.
    if (runda.wskazany === 'tytul') {
      assert.ok(runda.pytanie.includes(utwor.tytul), `${utwor.tytul}: pytanie nie pokazuje tytułu`);
    } else {
      assert.ok(runda.pytanie.includes(utwor.wykonawca), `${utwor.tytul}: pytanie nie pokazuje wykonawcy`);
    }
  }
});

sprawdz('filmowa bez przypisanego filmu nie wchodzi do puli', () => {
  const bezFilmu = katalog.filter((u) => u.gatunek === 'filmowa' && !u.film);
  assert.ok(bezFilmu.length > 0, 'w danych testowych powinno zostać choć jedno „filmowa” bez filmu');
  const pula = pulaUtworow({ kategorie: ['filmowa'], dekady: DEKADY.map((d) => d.id) }, { katalog });
  for (const utwor of bezFilmu) {
    assert.ok(!pula.some((u) => u.id === utwor.id), `${utwor.tytul} nie powinien trafić do puli — brak pola „film”`);
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

sprawdz('seria nie powtarza utworu i mieści się w zamówionej długości', () => {
  const ustawienia = { ...USTAWIENIA_DOMYSLNE, dlugoscSerii: 20 };
  for (const ziarno of [1, 2, 3, 4, 5]) {
    const seria = ulozSerie(ustawienia, { katalog, ziarno });
    assert.equal(seria.length, 20);
    assert.equal(new Set(seria.map((r) => r.utwor.id)).size, 20, 'ten sam utwór dwa razy');
  }
});

sprawdz('ten sam wykonawca nie wypada w dwóch pytaniach z rzędu', () => {
  for (const ziarno of [11, 22, 33]) {
    const seria = ulozSerie({ ...USTAWIENIA_DOMYSLNE, dlugoscSerii: 25 }, { katalog, ziarno });
    for (let i = 1; i < seria.length; i += 1) {
      assert.notEqual(seria[i].utwor.kluczWykonawcy, seria[i - 1].utwor.kluczWykonawcy,
        `dwa razy z rzędu ${seria[i].utwor.wykonawca}`);
    }
  }
});

sprawdz('mała pula skraca serię zamiast powtarzać utwory', () => {
  const seria = ulozSerie({ ...USTAWIENIA_DOMYSLNE, kategorie: ['rap'], dekady: [1980], dlugoscSerii: 999 }, { katalog });
  const dostepne = pulaUtworow({ kategorie: ['rap'], dekady: [1980] }, { katalog }).length;
  assert.equal(seria.length, dostepne);
  assert.equal(new Set(seria.map((r) => r.utwor.id)).size, seria.length);
});

sprawdz('utwory z poprzednich rund tej gry się nie powtarzają', () => {
  const ustawienia = { ...USTAWIENIA_DOMYSLNE, kategorie: ['rap'], dekady: [1980], dlugoscSerii: 15 };
  const pierwsza = ulozSerie(ustawienia, { katalog, ziarno: 5 });
  const pominiete = new Set(pierwsza.map((r) => r.utwor.id));
  const druga = ulozSerie(ustawienia, { katalog, ziarno: 6, pomin: pominiete });
  const czescWspolna = druga.filter((r) => pominiete.has(r.utwor.id));
  assert.equal(czescWspolna.length, 0, 'druga runda powtórzyła utwór z pierwszej');
});

sprawdz('to samo ziarno daje tę samą serię', () => {
  const a = ulozSerie(USTAWIENIA_DOMYSLNE, { katalog, ziarno: 4242 });
  const b = ulozSerie(USTAWIENIA_DOMYSLNE, { katalog, ziarno: 4242 });
  assert.deepEqual(a.map((r) => [r.utwor.id, r.poprawna]), b.map((r) => [r.utwor.id, r.poprawna]));
});

sprawdz('każda kategoria da się zagrać w pojedynkę', () => {
  for (const kategoria of KATEGORIE) {
    const seria = ulozSerie(
      { ...USTAWIENIA_DOMYSLNE, kategorie: [kategoria.id], dlugoscSerii: 10 },
      { katalog },
    );
    assert.equal(seria.length, 10, `${kategoria.nazwa}: wyszło ${seria.length} pytań`);
  }
});

/* --- kto wybiera temat --- */

sprawdz('losowanie wybierającego omija tego, kto wybierał poprzednio', () => {
  const gracze = ['a', 'b', 'c'];
  for (let proba = 0; proba < 30; proba += 1) {
    const wybrany = wylosujWybierajacego(gracze, 'a', Math.random);
    assert.notEqual(wybrany, 'a', 'wylosował tego samego, choć był wybór');
  }
  // Przy jednej osobie nie ma z kogo wybierać inaczej.
  assert.equal(wylosujWybierajacego(['a'], 'a', Math.random), 'a');
  assert.equal(wylosujWybierajacego([], 'a', Math.random), null);
});

sprawdz('opis tematu czyta się naturalnie', () => {
  assert.equal(
    opiszTemat({ kategorie: KATEGORIE.map((k) => k.id), dekady: DEKADY.map((d) => d.id) }),
    'wszystko, co jest',
  );
  assert.equal(opiszTemat({ kategorie: ['rock'], dekady: DEKADY.map((d) => d.id) }), 'Rock');
  assert.equal(opiszTemat({ kategorie: ['rock', 'rap'], dekady: [1980, 1990] }), 'Rock i Rap · lata 80. i 90.');
});

/* --- punktacja --- */

sprawdz('szybciej znaczy więcej, a maksimum to setka', () => {
  const limitMs = 15_000;
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: 0, limitMs }), MAKS_PUNKTOW);
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: limitMs, limitMs }), MAKS_PUNKTOW * MIN_UDZIAL_PUNKTOW);
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: limitMs / 2, limitMs }), 65);
  assert.equal(punktyZaOdpowiedz({ poprawna: false, czasMs: 0, limitMs }), 0);

  let poprzednie = Infinity;
  for (let czasMs = 0; czasMs <= limitMs; czasMs += 500) {
    const punkty = punktyZaOdpowiedz({ poprawna: true, czasMs, limitMs });
    assert.ok(punkty <= poprzednie, 'punkty rosną wraz z czasem');
    poprzednie = punkty;
  }
});

sprawdz('czas ponad limit nie schodzi poniżej progu minimalnego', () => {
  assert.equal(punktyZaOdpowiedz({ poprawna: true, czasMs: 99_000, limitMs: 10_000 }), 30);
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
