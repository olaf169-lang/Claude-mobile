#!/usr/bin/env node
/* Pełny przebieg gry w prawdziwej przeglądarce: jeden ekran prowadzącego
   i cztery telefony graczy, wszystko na własnym brokerze i własnym serwerze
   plików. Sprawdza to, czego nie widać w testach jednostkowych — czy pytanie
   dociera na telefony, czy szybsza odpowiedź daje więcej punktów, czy
   poprawna odpowiedź nie leci w eter przed czasem.

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
import { USTAWIENIA_DOMYSLNE, ulozRundy } from '../js/gra.js';

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

/* --- z góry wiemy, jaka będzie gra: to samo ziarno co w przeglądarce --- */

const oczekiwaneRundy = ulozRundy(
  { ...USTAWIENIA_DOMYSLNE, liczbaRund: 5 },
  { katalog: przygotujKatalog(), ziarno: ZIARNO },
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

try {
  /* --- prowadzący otwiera pokój --- */

  const host = await nowaKarta('prowadzący', 420, 920);
  await host.goto(ADRES, { waitUntil: 'domcontentloaded' });
  await host.click('#rola-prowadzacy');
  await host.waitForSelector('[data-ekran="ustawienia"]:not([hidden])');
  await zrzut(host, 'ekran-ustawienia', true);
  zapisz('prowadzący wchodzi w ustawienia');

  await host.click('#wybor-czasu .znaczek >> nth=2');        // 10 s
  await host.click('#wybor-rund .znaczek >> nth=0');         // 5 rund
  await host.uncheck('#opcja-dzwiek');                       // w teście nie ma czego grać

  await host.click('#otworz-pokoj');
  await host.waitForSelector('[data-ekran="lobby"]:not([hidden])', { timeout: 20_000 });
  const kod = (await host.textContent('#kod-pokoju')).trim();
  assert.match(kod, /^[A-Z2-9]{4}$/, `dziwny kod pokoju: ${kod}`);
  assert.ok(await host.$('#qr svg'), 'nie narysował kodu QR');
  zapisz(`pokój otwarty, kod ${kod}, kod QR narysowany`);

  /* --- gracze dołączają z linku z QR --- */

  const linkZQr = `http://127.0.0.1:${PORT_STRON}/${PARAMETRY}#/dolacz/${kod}/0`;
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

  /* --- runda pierwsza --- */

  await host.click('#zacznij-gre');
  await host.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });
  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-runda"]:not([hidden])', { timeout: 10_000 });

  const pytanieHosta = (await host.textContent('#pytanie-hosta')).trim();
  const odpowiedziHosta = await host.$$eval('#odpowiedzi-hosta .tresc', (n) => n.map((e) => e.textContent));
  const odpowiedziGracza = await gracze[0].strona.$$eval('#odpowiedzi-gracza .tresc', (n) => n.map((e) => e.textContent));
  assert.equal((await gracze[0].strona.textContent('#pytanie-gracza')).trim(), pytanieHosta);
  assert.deepEqual(odpowiedziGracza, odpowiedziHosta, 'gracz widzi inne odpowiedzi niż prowadzący');
  zapisz(`to samo pytanie na wszystkich ekranach („${pytanieHosta}”)`);

  // Ziarno przesądziło o kolejności rund, więc wiemy, co jest poprawne.
  const pierwsza = oczekiwaneRundy[0];
  assert.deepEqual(odpowiedziHosta, pierwsza.odpowiedzi, 'przeglądarka ułożyła inną rundę niż silnik');
  const poprawna = pierwsza.poprawna;
  zapisz(`runda z ziarna zgadza się z silnikiem (poprawna: „${pierwsza.odpowiedzi[poprawna]}”)`);

  // Poprawna odpowiedź nie ma prawa pojawić się w eterze przed odsłoną.
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

  /* --- odsłona --- */

  await host.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 15_000 });
  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-odslona"]:not([hidden])', { timeout: 10_000 });
  assert.equal((await host.textContent('#odsloniety-tytul')).trim(), pierwsza.utwor.tytul);
  await zrzut(host, 'ekran-odslona', true);
  await zrzut(gracze[0].strona, 'ekran-odslona-gracz');
  zapisz(`runda kończy się sama i odsłania „${pierwsza.utwor.tytul}”`);

  const punkty = {};
  for (const g of gracze) {
    punkty[g.ksywka] = Number((await g.strona.textContent('#werdykt')).match(/\+(\d+)/)?.[1] ?? 0);
  }
  assert.ok(punkty.Zosia > 0 && punkty.Bartek > 0, `trafione odpowiedzi bez punktów: ${JSON.stringify(punkty)}`);
  assert.ok(punkty.Zosia > punkty.Bartek, `szybsza odpowiedź nie dała więcej: ${JSON.stringify(punkty)}`);
  assert.equal(punkty.Ola, 0, 'zła odpowiedź dostała punkty');
  assert.equal(await gracze[3].strona.getAttribute('#werdykt', 'data-jak'), 'brak');
  zapisz(`szybciej znaczy więcej: Zosia ${punkty.Zosia} pkt, Bartek ${punkty.Bartek} pkt`);

  /* --- telefon wchodzący w środku rundy --- */

  const spozniony = await nowaKarta('Spóźnialski', 390, 844);
  await spozniony.goto(linkZQr, { waitUntil: 'domcontentloaded' });
  await spozniony.waitForSelector('[data-ekran="dolaczanie"]:not([hidden])');
  await spozniony.fill('#pole-ksywki', 'Spóźnialski');

  await host.click('#nastepna-runda');
  await host.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });
  await spozniony.click('#dolacz');
  await spozniony.waitForSelector('[data-ekran="gracz-runda"]:not([hidden])', { timeout: 12_000 });
  assert.equal((await spozniony.textContent('#pytanie-gracza')).trim(), (await host.textContent('#pytanie-hosta')).trim());
  const zostaloMu = await spozniony.$eval('#pasek-czasu-wypelnienie',
    (e) => Number(getComputedStyle(e).transform.match(/matrix\(([\d.]+)/)?.[1] ?? 1));
  assert.ok(zostaloMu < 0.98, 'spóźniony dostał pełny czas rundy zamiast reszty');
  zapisz(`spóźniony telefon wskakuje w trwającą rundę z resztą czasu (${Math.round(zostaloMu * 100)}%)`);

  /* --- do końca gry --- */

  await host.click('#odslon-teraz');
  await host.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 10_000 });
  zapisz('„Odsłoń teraz” kończy rundę przed czasem');

  for (let nr = 3; nr <= 5; nr += 1) {
    await host.click('#nastepna-runda');
    await host.waitForSelector('[data-ekran="runda"]:not([hidden])', { timeout: 10_000 });
    const wlasciwa = oczekiwaneRundy[nr - 1].poprawna;
    await gracze[0].strona.click(`#odpowiedzi-gracza .odp >> nth=${wlasciwa}`).catch(() => {});
    await host.click('#odslon-teraz');
    await host.waitForSelector('[data-ekran="odslona"]:not([hidden])', { timeout: 10_000 });
  }

  await host.click('#nastepna-runda');
  await host.waitForSelector('[data-ekran="koniec"]:not([hidden])', { timeout: 10_000 });
  const podium = await host.$$eval('.stopien .kto', (n) => n.map((e) => e.textContent));
  assert.equal(podium.length, 3, 'podium nie ma trzech stopni');
  assert.equal(podium[1], 'Zosia', `na pierwszym stopniu stoi ${podium[1]}, a powinna Zosia`);
  await zrzut(host, 'ekran-koniec', true);
  zapisz(`gra kończy się podium: ${podium.join(' · ')}`);

  for (const g of gracze) await g.strona.waitForSelector('[data-ekran="gracz-koniec"]:not([hidden])', { timeout: 10_000 });
  assert.match(await gracze[0].strona.textContent('#moje-miejsce'), /1\. miejsce/);
  await zrzut(gracze[0].strona, 'ekran-koniec-gracz');
  zapisz('gracze widzą swoje miejsce w tabeli końcowej');

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
