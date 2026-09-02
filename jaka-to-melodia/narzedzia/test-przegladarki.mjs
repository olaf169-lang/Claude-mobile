#!/usr/bin/env node
/* Pełny przebieg gry w prawdziwej przeglądarce, przez cały cykl rund: wybór
   tematu → odliczanie → seria pytań z odsłonami → wyniki rundy → koniec.
   Wszystko na własnym brokerze i własnym serwerze plików. Sprawdza to, czego
   nie widać w testach jednostkowych — czy pytanie dociera na telefony, czy
   szybsza odpowiedź daje więcej punktów, czy poprawna odpowiedź nie leci
   w eter przed czasem, czy losowo wybrany gracz dostaje panel wyboru tematu,
   a reszta tylko czeka.

       npm install && npx playwright install chromium
       node narzedzia/test-przegladarki.mjs

   Zrzuty ekranu lądują w docs/ (opcjonalnie: --zrzuty). */

import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

import { Aedes } from 'aedes';
import { WebSocketServer, createWebSocketStream } from 'ws';
import { chromium } from 'playwright';

import { przygotujKatalog } from '../js/katalog.js';
import { USTAWIENIA_DOMYSLNE, ulozSerie } from '../js/gra.js';

const KATALOG_APLIKACJI = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ZIARNO = 20260902;
const PORT_BROKERA = 19830;
const PORT_STRON = 19831;
const ZRZUTY = process.argv.includes('--zrzuty');

const TYPY = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
const zdane = [];
const zapisz = (opis) => { zdane.push(opis); console.log(`✓ ${opis}`); };

/* --- broker i serwer plików na czas testu --- */

const broker = await Aedes.createBroker();
const serwerBrokera = createServer();
const gniazda = new WebSocketServer({ server: serwerBrokera, handleProtocols: (p) => (p.has('mqtt') ? 'mqtt' : false) });
gniazda.on('connection', (ws, zadanie) => broker.handle(createWebSocketStream(ws), zadanie));
await new Promise((r) => serwerBrokera.listen(PORT_BROKERA, r));

const serwerStron = createServer((zadanie, odpowiedz) => {
  let sciezka = normalize(decodeURIComponent(zadanie.url.split('?')[0]));
  if (sciezka === '/') sciezka = '/index.html';
  const plik = join(KATALOG_APLIKACJI, sciezka);
  if (!plik.startsWith(KATALOG_APLIKACJI) || !existsSync(plik) || !statSync(plik).isFile()) {
    odpowiedz.writeHead(404); odpowiedz.end('nie ma'); return;
  }
  odpowiedz.writeHead(200, { 'content-type': TYPY[extname(plik)] || 'application/octet-stream' });
  createReadStream(plik).pipe(odpowiedz);
});
await new Promise((r) => serwerStron.listen(PORT_STRON, r));

const PARAMETRY = `?serwer=ws://127.0.0.1:${PORT_BROKERA}/mqtt&ziarno=${ZIARNO}`;
const ADRES = `http://127.0.0.1:${PORT_STRON}/${PARAMETRY}`;
const linkDolaczenia = (kod) => `http://127.0.0.1:${PORT_STRON}/${PARAMETRY}#/dolacz/${kod}/0`;

// Runda 1 z tematu „wszystko” — dokładnie to, co ułoży silnik przy pełnej puli.
// Host liczy ziarno rundy jako (ziarno bazowy + numer rundy w grze).
const oczekiwanaSeria = ulozSerie(
  { ...USTAWIENIA_DOMYSLNE, dlugoscSerii: 5 },
  { katalog: przygotujKatalog(), ziarno: ZIARNO + 1 },
);

const przegladarka = await chromium.launch(
  process.env.JTM_CHROMIUM ? { executablePath: process.env.JTM_CHROMIUM } : {},
);
const bledy = [];
async function nowaKarta(nazwa, szerokosc = 400, wysokosc = 880) {
  const kontekst = await przegladarka.newContext({
    viewport: { width: szerokosc, height: wysokosc }, colorScheme: 'dark',
  });
  const strona = await kontekst.newPage();
  strona.on('pageerror', (blad) => bledy.push(`[${nazwa}] ${blad.message}`));
  strona.on('console', (m) => {
    // Brak czcionek z sieci to nie awaria aplikacji — w CI i tak ich nie ma.
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) bledy.push(`[${nazwa}] ${m.text()}`);
  });
  return strona;
}

async function zrzut(strona, nazwa, pelna = false) {
  if (!ZRZUTY) return;
  const katalog = resolve(KATALOG_APLIKACJI, 'docs');
  mkdirSync(katalog, { recursive: true });
  await strona.screenshot({ path: join(katalog, `${nazwa}.png`), fullPage: pelna });
}

/** Ekran, na którym akurat stoi strona — czyta to samo, czego używa router aplikacji. */
const widok = (strona) => strona.evaluate(() => document.body.dataset.widok);

async function poczekajNaWidok(strona, kandydaci, opcje = {}) {
  await strona.waitForFunction(
    (lista) => lista.includes(document.body.dataset.widok),
    kandydaci, { timeout: 10_000, ...opcje },
  );
  return widok(strona);
}

try {
  /* ====================================================================
     SCENARIUSZ 1 — impreza: prowadzący tylko prowadzi, czworo graczy,
     temat rundy zawsze ustala on sam („Zawsze ja”), jedna runda z pięcioma
     piosenkami. Sprawdza cały szkielet: ustawienia, lobby, panel wyboru
     tematu, odliczanie, pytania z odsłonami, dołączenie w trakcie, wyniki
     rundy i koniec gry.
     ==================================================================== */

  const host = await nowaKarta('prowadzący', 420, 920);
  await host.goto(ADRES, { waitUntil: 'domcontentloaded' });
  await host.click('#rola-prowadzacy');
  await host.waitForSelector('[data-ekran="ustawienia"]:not([hidden])');
  await zrzut(host, 'ekran-ustawienia', true);
  zapisz('prowadzący wchodzi w ustawienia');

  await host.click('#wybor-czasu .znaczek >> nth=2');        // 10 s
  await host.click('#wybor-serii .znaczek >> nth=0');        // 5 piosenek w serii
  await host.click('#wybor-rund .znaczek >> nth=0');         // 1 runda
  await host.click('#wybor-kto-wybiera .znaczek >> nth=1');  // temat zawsze ustala prowadzący
  await host.uncheck('#opcja-dzwiek');                        // w teście nie ma czego grać
  await host.uncheck('#opcja-ja-gram');                        // tu prowadzący tylko prowadzi

  await host.click('#otworz-pokoj');
  await host.waitForSelector('[data-ekran="lobby"]:not([hidden])', { timeout: 20_000 });
  const kod = (await host.textContent('#kod-pokoju')).trim();
  assert.match(kod, /^[A-Z2-9]{4}$/, `dziwny kod pokoju: ${kod}`);
  assert.ok(await host.$('#qr svg'), 'nie narysował kodu QR');
  zapisz(`pokój otwarty, kod ${kod}, kod QR narysowany`);

  /* --- gracze dołączają z linku z QR --- */

  const linkZQr = linkDolaczenia(kod);
  const gracze = [];
  for (const ksywka of ['Zosia', 'Bartek', 'Ola', 'Kuba']) {
    const strona = await nowaKarta(ksywka, 390, 844);
    await strona.goto(linkZQr, { waitUntil: 'domcontentloaded' });
    await strona.waitForSelector('[data-ekran="dolaczanie"]:not([hidden])');
    assert.equal(await strona.inputValue('#pole-kodu'), kod, 'kod z QR nie wskoczył do pola');
    await strona.fill('#pole-ksywki', ksywka);
    await strona.click('#dolacz');
    await strona.waitForSelector('[data-ekran="poczekalnia"]:not([hidden])', { timeout: 20_000 });
    gracze.push({ ksywka, strona });
  }
  await host.waitForFunction(() => document.querySelector('#liczba-graczy').textContent === '4', undefined, { timeout: 10_000 });
  await zrzut(host, 'ekran-lobby', true);
  await zrzut(gracze[0].strona, 'ekran-poczekalnia');
  zapisz('czterech graczy dołącza z kodu QR i widnieje w lobby');

  /* --- start gry: panel wyboru tematu u prowadzącego --- */

  await host.click('#zacznij-gre');
  await host.waitForSelector('[data-ekran="wybor-tematu"]:not([hidden])', { timeout: 10_000 });
  assert.equal(await host.isHidden('#panel-wyboru-tematu'), false, 'prowadzący („Zawsze ja”) nie widzi panelu wyboru');
  await zrzut(host, 'ekran-wybor-tematu', true);
  zapisz('prowadzący dostaje panel wyboru tematu rundy');

  await host.click('#temat-wszystko');
  await host.click('#zacznij-runde');
  await host.waitForSelector('[data-ekran="odliczanie"]:not([hidden])', { timeout: 10_000 });
  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-odliczanie"]:not([hidden])', { timeout: 10_000 });
  const pierwszaCyfra = Number((await host.textContent('#odliczanie-liczba')).trim());
  assert.ok(pierwszaCyfra >= 1 && pierwszaCyfra <= 3, `dziwna pierwsza cyfra odliczania: ${pierwszaCyfra}`);
  zapisz('po „Zaczynamy rundę” leci odliczanie 3-2-1 na wszystkich ekranach');

  /* --- runda pierwsza (pytanie 1/5) --- */

  await host.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 8000 });
  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-runda"]:not([hidden])', { timeout: 8000 });

  // Prowadzący, który nie gra, ma tablicę, a nie brzęczyk — kafelki nie klikają.
  assert.equal(await host.$$eval('#odpowiedzi-hosta .odp', (n) => n.filter((e) => e.tagName === 'BUTTON').length), 0,
    'kafelki prowadzącego są klikalne, mimo że nie gra');
  zapisz('prowadzący poza stawką ma kafelki tylko do pokazywania');

  assert.match(await host.textContent('#numer-rundy'), /Runda 1\/1 · piosenka 1\/5/);
  const pytanieHosta = (await host.textContent('#pytanie-hosta')).trim();
  const odpowiedziHosta = await host.$$eval('#odpowiedzi-hosta .tresc', (n) => n.map((e) => e.textContent));
  const odpowiedziGracza = await gracze[0].strona.$$eval('#odpowiedzi-gracza .tresc', (n) => n.map((e) => e.textContent));
  assert.match(await gracze[0].strona.textContent('#numer-rundy-gracz'), /Runda 1\/1 · piosenka 1\/5/);
  assert.equal((await gracze[0].strona.textContent('#pytanie-gracza')).trim(), pytanieHosta);
  assert.deepEqual(odpowiedziGracza, odpowiedziHosta, 'gracz widzi inne odpowiedzi niż prowadzący');
  zapisz(`to samo pytanie na wszystkich ekranach („${pytanieHosta}”)`);

  // Ziarno przesądziło o kolejności, więc wiemy z góry, co jest poprawne.
  const pierwsze = oczekiwanaSeria[0];
  assert.deepEqual(odpowiedziHosta, pierwsze.odpowiedzi, 'przeglądarka ułożyła inną serię niż silnik');
  const poprawna = pierwsze.poprawna;
  zapisz(`pytanie z ziarna zgadza się z silnikiem (poprawna: „${pierwsze.odpowiedzi[poprawna]}”)`);

  // Poprawnej odpowiedzi nie wolno pojawić się w eterze przed odsłoną.
  const wEterze = [];
  broker.on('publish', (pakiet) => {
    if (pakiet.topic?.endsWith('/h')) wEterze.push(pakiet.payload.toString());
  });

  await gracze[0].strona.click(`#odpowiedzi-gracza .odp >> nth=${poprawna}`);        // Zosia: dobrze i szybko
  await zrzut(gracze[0].strona, 'ekran-runda-gracz');
  await zrzut(host, 'ekran-runda-prowadzacy');
  await czekaj(3000);
  await gracze[1].strona.click(`#odpowiedzi-gracza .odp >> nth=${poprawna}`);        // Bartek: dobrze, ale wolniej
  await gracze[2].strona.click(`#odpowiedzi-gracza .odp >> nth=${(poprawna + 1) % 4}`); // Ola: źle
  // Kuba nie klika w ogóle.

  await host.waitForFunction(() => document.querySelector('#ilu-odpowiedzialo').textContent.startsWith('3'),
    undefined, { timeout: 6000 });
  zapisz('prowadzący na bieżąco liczy odpowiedzi');

  assert.equal(wEterze.filter((t) => t.includes('"t":"runda"') && t.includes('"poprawna"')).length, 0,
    'poprawna odpowiedź poszła w eter przed odsłoną');
  zapisz('w trakcie rundy poprawna odpowiedź nie leci w eter');

  // „Graj też na telefonach graczy” jest domyślnie wyłączone — nikt nie
  // powinien dostawać adresu nagrania, dopóki prowadzący sam tego nie włączy.
  const rundyBezMuzykiWszedzie = wEterze.filter((t) => t.includes('"t":"runda"'));
  assert.ok(rundyBezMuzykiWszedzie.length > 0, 'nie złapałem żadnej wiadomości „runda” do sprawdzenia');
  assert.ok(rundyBezMuzykiWszedzie.every((t) => JSON.parse(t).nagranie === null),
    'gracz dostał adres nagrania, mimo że „muzyka wszędzie” jest domyślnie wyłączona');
  zapisz('domyślnie („muzyka wszędzie” wyłączona) gracze nie dostają adresu nagrania');

  /* --- odsłona pytania 1 --- */

  await host.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 15_000 });
  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-odslona"]:not([hidden])', { timeout: 10_000 });
  assert.equal((await host.textContent('#odsloniety-tytul')).trim(), pierwsze.utwor.tytul);
  const znaczniki = await host.$$eval('#znaczniki-utworu span', (n) => n.map((e) => e.textContent.trim()));
  assert.ok(znaczniki.length >= 1, 'brak znaczników kategorii/dekady na odsłonie');
  const znacznikiGracza = await gracze[0].strona.$$eval('#znaczniki-utworu-gracz span', (n) => n.map((e) => e.textContent.trim()));
  assert.deepEqual(znacznikiGracza, znaczniki, 'gracz widzi inne znaczniki niż prowadzący');
  await zrzut(host, 'ekran-odslona', true);
  await zrzut(gracze[0].strona, 'ekran-odslona-gracz');
  zapisz(`pytanie kończy się samo i odsłania „${pierwsze.utwor.tytul}” ze znacznikami: ${znaczniki.join(' · ')}`);

  assert.equal((await host.textContent('#nastepna-runda')).trim(), 'Następna piosenka');

  const punkty = {};
  for (const g of gracze) {
    punkty[g.ksywka] = Number((await g.strona.textContent('#werdykt')).match(/\+(\d+)/)?.[1] ?? 0);
  }
  assert.ok(punkty.Zosia > 0 && punkty.Bartek > 0, `trafione odpowiedzi bez punktów: ${JSON.stringify(punkty)}`);
  assert.ok(punkty.Zosia > punkty.Bartek, `szybsza odpowiedź nie dała więcej: ${JSON.stringify(punkty)}`);
  assert.equal(punkty.Ola, 0, 'zła odpowiedź dostała punkty');
  assert.equal(await gracze[3].strona.getAttribute('#werdykt', 'data-jak'), 'brak');
  zapisz(`szybciej znaczy więcej: Zosia ${punkty.Zosia} pkt, Bartek ${punkty.Bartek} pkt`);

  /* --- telefon wchodzący w środku pytania 2 --- */

  const spozniony = await nowaKarta('Spóźnialski', 390, 844);
  await spozniony.goto(linkZQr, { waitUntil: 'domcontentloaded' });
  await spozniony.waitForSelector('[data-ekran="dolaczanie"]:not([hidden])');
  await spozniony.fill('#pole-ksywki', 'Spóźnialski');

  await host.click('#nastepna-runda');
  await host.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });
  assert.match(await host.textContent('#numer-rundy'), /piosenka 2\/5/);
  await spozniony.click('#dolacz');
  await spozniony.waitForSelector('[data-ekran="gracz-runda"]:not([hidden])', { timeout: 12_000 });
  assert.equal((await spozniony.textContent('#pytanie-gracza')).trim(), (await host.textContent('#pytanie-hosta')).trim());
  const zostaloMu = await spozniony.$eval('#pasek-czasu-wypelnienie',
    (e) => Number(getComputedStyle(e).transform.match(/matrix\(([\d.]+)/)?.[1] ?? 1));
  assert.ok(zostaloMu < 0.98, 'spóźniony dostał pełny czas pytania zamiast reszty');
  zapisz(`spóźniony telefon wskakuje w trwające pytanie z resztą czasu (${Math.round(zostaloMu * 100)}%)`);

  /* --- do końca rundy (pytania 2–5) --- */

  await host.click('#odslon-teraz');
  await host.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 10_000 });
  zapisz('„Odsłoń teraz” kończy pytanie przed czasem');

  for (let nr = 3; nr <= 4; nr += 1) {
    await host.click('#nastepna-runda');
    await host.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });
    const wlasciwa = oczekiwanaSeria[nr - 1].poprawna;
    await gracze[0].strona.click(`#odpowiedzi-gracza .odp >> nth=${wlasciwa}`).catch(() => {});
    await host.click('#odslon-teraz');
    await host.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 10_000 });
  }

  // Ostatnie (piąte) pytanie w serii — przycisk ma już inną nazwę.
  await host.click('#nastepna-runda');
  await host.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });
  assert.match(await host.textContent('#numer-rundy'), /piosenka 5\/5/);
  await host.click('#odslon-teraz');
  await host.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 10_000 });
  assert.equal((await host.textContent('#nastepna-runda')).trim(), 'Wyniki rundy',
    'ostatnie pytanie serii nie zmieniło etykiety przycisku');
  zapisz('ostatnie pytanie serii prowadzi do wyników rundy, nie do kolejnej piosenki');

  /* --- wyniki rundy (bo liczbaRund = 1, to zarazem koniec gry) --- */

  await host.click('#nastepna-runda');
  await host.waitForSelector('[data-ekran="wyniki-rundy"]:not([hidden])', { timeout: 10_000 });
  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-wyniki-rundy"]:not([hidden])', { timeout: 10_000 });
  await czekaj(1500); // niech animacja podium i tabeli dobiegnie końca przed zrzutem
  await zrzut(host, 'ekran-wyniki-rundy', true);
  await zrzut(gracze[0].strona, 'ekran-wyniki-rundy-gracz');
  const podiumRundy = await host.$$eval('#podium-rundy .stopien .kto', (n) => n.map((e) => e.textContent));
  assert.ok(podiumRundy.length >= 1, 'brak podium na ekranie wyników rundy');
  assert.equal((await host.textContent('#dalej-po-rundzie')).trim(), 'Zobacz wynik gry',
    'jedna runda w grze, a przycisk nie prowadzi do końcowego podsumowania');
  const ostatnie = oczekiwanaSeria[oczekiwanaSeria.length - 1];
  assert.equal(await host.isHidden('#karta-ostatniej-piosenki'), false,
    'brak karty z ostatnią piosenką na ekranie wyników rundy (prowadzący)');
  assert.equal((await host.textContent('#ostatnia-piosenka-tytul')).trim(), ostatnie.utwor.tytul,
    'karta ostatniej piosenki pokazuje zły tytuł');
  assert.equal(await gracze[0].strona.isHidden('#karta-ostatniej-piosenki-gracz'), false,
    'brak karty z ostatnią piosenką na ekranie wyników rundy (gracz)');
  assert.equal((await gracze[0].strona.textContent('#ostatnia-piosenka-tytul-gracz')).trim(), ostatnie.utwor.tytul,
    'gracz widzi inny tytuł ostatniej piosenki niż prowadzący');
  zapisz(`ekran wyników rundy pokazuje podium (${podiumRundy.join(' · ')}) i ostatnią piosenkę (${ostatnie.utwor.tytul})`);

  /* --- koniec gry --- */

  await host.click('#dalej-po-rundzie');
  await host.waitForSelector('[data-ekran="koniec"]:not([hidden])', { timeout: 10_000 });
  const podium = await host.$$eval('#podium .stopien .kto', (n) => n.map((e) => e.textContent));
  assert.equal(podium.length, 3, 'podium nie ma trzech stopni');
  assert.equal(podium[1], 'Zosia', `na pierwszym stopniu stoi ${podium[1]}, a powinna Zosia`);
  await zrzut(host, 'ekran-koniec', true);
  zapisz(`gra kończy się podium: ${podium.join(' · ')}`);

  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-koniec"]:not([hidden])', { timeout: 10_000 });
  assert.match(await gracze[0].strona.textContent('#moje-miejsce'), /1\. miejsce/);
  await zrzut(gracze[0].strona, 'ekran-koniec-gracz');
  zapisz('gracze widzą swoje miejsce w tabeli końcowej');

  /* ====================================================================
     SCENARIUSZ 2 — losowy wybierający, prowadzący gra. Dwoje uczestników
     (prowadzący + jeden gracz), temat losuje jedną z tych dwóch osób —
     sprawdzamy oba możliwe wyniki losowania, a potem odpowiadamy tak jak
     zwykle, żeby przy okazji sprawdzić punktację prowadzącego grającego
     na własnym ekranie.
     ==================================================================== */

  const dwoje = await nowaKarta('Olaf', 420, 920);
  await dwoje.goto(ADRES, { waitUntil: 'domcontentloaded' });
  await dwoje.click('#rola-prowadzacy');
  await dwoje.waitForSelector('[data-ekran="ustawienia"]:not([hidden])');
  await dwoje.click('#wybor-czasu .znaczek >> nth=2');        // 10 s
  await dwoje.click('#wybor-serii .znaczek >> nth=0');        // 5 piosenek
  await dwoje.click('#wybor-rund .znaczek >> nth=0');         // 1 runda
  await dwoje.uncheck('#opcja-dzwiek');
  assert.equal(await dwoje.isChecked('#opcja-ja-gram'), true, '„Ja też gram” powinno być domyślnie włączone');
  assert.equal(await dwoje.getAttribute('#wybor-kto-wybiera .znaczek >> nth=0', 'aria-pressed'), 'true',
    '„Losowy gracz” powinien być domyślnym trybem wyboru tematu');
  await dwoje.fill('#ksywka-prowadzacego', 'Olaf');

  await dwoje.click('#otworz-pokoj');
  await dwoje.waitForSelector('[data-ekran="lobby"]:not([hidden])', { timeout: 20_000 });
  const kodDwoje = (await dwoje.textContent('#kod-pokoju')).trim();

  assert.equal(await dwoje.textContent('#liczba-graczy'), '1', 'prowadzący nie policzył się do stawki');
  assert.match(await dwoje.textContent('#lista-graczy'), /Olaf \(ty\)/);
  zapisz('prowadzący, który gra, stoi w stawce sam po otwarciu pokoju');

  const drugi = await nowaKarta('Kasia', 390, 844);
  await drugi.goto(linkDolaczenia(kodDwoje), { waitUntil: 'domcontentloaded' });
  await drugi.waitForSelector('[data-ekran="dolaczanie"]:not([hidden])');
  await drugi.fill('#pole-ksywki', 'Kasia');
  await drugi.click('#dolacz');
  await drugi.waitForSelector('[data-ekran="poczekalnia"]:not([hidden])', { timeout: 20_000 });
  await dwoje.waitForFunction(() => document.querySelector('#liczba-graczy').textContent === '2', undefined, { timeout: 10_000 });
  zapisz('drugi telefon dołącza — gra we dwoje');

  await dwoje.click('#zacznij-gre');

  // Losowanie mogło wskazać prowadzącego albo Kasię — sprawdzamy oba warianty
  // i w obu przypadkach doprowadzamy grę do tego samego punktu.
  const widokKasi = await poczekajNaWidok(drugi, ['gracz-wybor', 'gracz-czekaj-temat']);
  const wybieraKasia = widokKasi === 'gracz-wybor';

  if (wybieraKasia) {
    assert.equal(await dwoje.isHidden('#panel-wyboru-tematu'), true, 'prowadzący też widzi panel, choć losowanie wskazało Kasię');
    assert.match(await dwoje.textContent('#czekanie-na-wybor-opis'), /Kasia/);
    zapisz('wylosowana Kasia dostaje panel wyboru tematu na swoim telefonie');

    // Wybieramy węższy temat niż „wszystko” — jedna kategoria, żeby sprawdzić,
    // że runda faktycznie respektuje to, co wybrał gracz, a nie cały katalog.
    await drugi.click('#gracz-wybor-kategorii .znaczek >> nth=0');
    const zaznaczoneNaStarcie = await drugi.$$eval('#gracz-wybor-kategorii .znaczek[aria-pressed="true"]', (n) => n.length);
    assert.ok(zaznaczoneNaStarcie >= 1, 'po odznaczeniu jednej kategorii nie zostało nic do wyboru — błąd w chipach');
    await drugi.click('#gracz-zacznij-runde');
    await drugi.waitForSelector('[data-ekran="gracz-odliczanie"]:not([hidden])', { timeout: 10_000 });
    zapisz('gracz zawęża temat do wybranych kategorii i zaczyna rundę ze swojego telefonu');
  } else {
    assert.equal(await dwoje.isHidden('#panel-wyboru-tematu'), false, 'prowadzącemu nie pokazano panelu, choć to on wybiera');
    await dwoje.click('#temat-wszystko');
    await dwoje.click('#zacznij-runde');
    zapisz('wylosowany prowadzący dostaje panel wyboru tematu na swoim ekranie');
  }

  await dwoje.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });
  await drugi.waitForSelector('[data-ekran="gracz-runda"]:not([hidden])', { timeout: 10_000 });
  zapisz('po odliczaniu runda rusza na obu telefonach');

  // Prowadzący i gracz dostali to samo pytanie — klikamy tę samą treść po obu stronach.
  const trescPierwszej = await dwoje.$eval('#odpowiedzi-hosta .odp .tresc >> nth=0', (e) => e.textContent);
  const tresciGracza = await drugi.$$eval('#odpowiedzi-gracza .tresc', (n) => n.map((e) => e.textContent));
  const wybranyIndeks = tresciGracza.indexOf(trescPierwszej);
  assert.ok(wybranyIndeks >= 0, 'nie znalazłem wspólnej odpowiedzi u obu stron');

  await dwoje.click(`#odpowiedzi-hosta .odp >> nth=${wybranyIndeks}`);
  assert.match(await dwoje.textContent('#potwierdzenie-hosta'), /Zapisane po/);
  zapisz('prowadzący odpowiada na swoim ekranie i dostaje potwierdzenie');

  await czekaj(2500);
  await drugi.click(`#odpowiedzi-gracza .odp >> nth=${wybranyIndeks}`);

  // Obie osoby kliknęły tę samą (poprawną albo błędną — nieważne, obie tę
  // samą) odpowiedź — pytanie nie ma na co czekać do końca zegara.
  await dwoje.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 8000 });
  zapisz('gdy odpowiedzą wszyscy, pytanie odsłania się od razu');

  const werdyktHosta = (await dwoje.textContent('#werdykt-hosta')).replace(/\s+/g, ' ').trim();
  assert.ok(werdyktHosta.length > 0, 'prowadzący nie dostał żadnego werdyktu');
  const jaHostaOK = werdyktHosta.includes('Dobrze!') || werdyktHosta.includes('Pudło');
  assert.ok(jaHostaOK, `dziwny werdykt prowadzącego: ${werdyktHosta}`);

  const mojWiersz = await dwoje.$$eval('#ranking-podglad li',
    (n) => n.map((e) => [e.dataset.ja, e.textContent.replace(/\s+/g, ' ').trim()]));
  assert.ok(mojWiersz.some(([ja, tekst]) => ja === 'tak' && tekst.includes('Olaf')), 'własny wiersz w tabeli nie jest wyróżniony');
  zapisz('w tabeli widać, który wiersz jest twój — prowadzący liczy się na tych samych zasadach');
  await zrzut(dwoje, 'ekran-odslona-we-dwoje', true);

  /* ====================================================================
     SCENARIUSZ 3 — „graj też na telefonach graczy”. Sam prowadzący (gra
     solo, bo „Ja też gram” zostaje domyślnie włączone) — sprawdzamy tylko,
     czy po włączeniu tej opcji adres nagrania faktycznie leci w eter razem
     z pytaniem. Samego odtwarzania w tle nie da się tu wiarygodnie sprawdzić
     (headless przeglądarka i realna sieć do sklepu z muzyką to osobna
     zmienna), więc pilnujemy tego, za co realnie odpowiada nasz kod: czy
     protokół rozsyła to, co powinien.
     ==================================================================== */

  const solo = await nowaKarta('Solo', 420, 920);
  await solo.goto(ADRES, { waitUntil: 'domcontentloaded' });
  await solo.click('#rola-prowadzacy');
  await solo.waitForSelector('[data-ekran="ustawienia"]:not([hidden])');
  await solo.click('#wybor-serii .znaczek >> nth=0');        // 5 piosenek — ten sam pierwszy utwór co w scenariuszu 1
  await solo.click('#wybor-rund .znaczek >> nth=0');         // 1 runda
  await solo.click('#wybor-kto-wybiera .znaczek >> nth=1');  // temat zawsze ustala prowadzący
  await solo.check('#opcja-muzyka-wszedzie');
  assert.equal(await solo.isHidden('#pole-muzyka-wszedzie'), false,
    'przełącznik „graj wszędzie” jest schowany, mimo że „Muzyka z aplikacji” jest włączona');
  await solo.fill('#ksywka-prowadzacego', 'Solo');

  await solo.click('#otworz-pokoj');
  await solo.waitForSelector('[data-ekran="lobby"]:not([hidden])', { timeout: 20_000 });
  const kodSolo = (await solo.textContent('#kod-pokoju')).trim();

  const rundyZMuzyka = [];
  broker.on('publish', (pakiet) => {
    if (pakiet.topic === `jtm/${kodSolo}/h`) rundyZMuzyka.push(pakiet.payload.toString());
  });

  await solo.click('#zacznij-gre');
  await solo.waitForSelector('[data-ekran="wybor-tematu"]:not([hidden])', { timeout: 10_000 });
  await solo.click('#temat-wszystko');
  await solo.click('#zacznij-runde');
  await solo.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });

  let pierwszaRundaZMuzyka = null;
  for (let i = 0; i < 50 && !pierwszaRundaZMuzyka; i += 1) {
    pierwszaRundaZMuzyka = rundyZMuzyka.map((t) => JSON.parse(t)).find((w) => w.t === 'runda');
    if (!pierwszaRundaZMuzyka) await czekaj(100);
  }
  assert.ok(pierwszaRundaZMuzyka, 'nie złapałem żadnej wiadomości „runda” po włączeniu „muzyki wszędzie”');
  assert.ok(pierwszaRundaZMuzyka.nagranie?.url, 'brak adresu nagrania w wiadomości, mimo że „muzyka wszędzie” jest włączona');
  assert.match(pierwszaRundaZMuzyka.nagranie.url, /^https?:\/\//, 'adres nagrania nie wygląda jak URL');
  assert.equal(typeof pierwszaRundaZMuzyka.nagranie.startS, 'number', 'brak liczbowego momentu startu (startS) do zsynchronizowania telefonów');
  assert.ok(pierwszaRundaZMuzyka.nagranie.startS >= 0, 'moment startu nagrania jest ujemny');
  zapisz('„graj też na telefonach graczy”: adres nagrania i moment startu lecą w eter razem z pytaniem');

  assert.deepEqual([...new Set(bledy)], [], 'błędy w konsoli przeglądarki');
  console.log(`\nPRZEGLĄDARKA OK — ${zdane.length} sprawdzeń`);
} finally {
  await przegladarka.close();
  broker.close();
  gniazda.close();
  serwerBrokera.close();
  serwerStron.close();
}
process.exit(0);
