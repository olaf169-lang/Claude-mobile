#!/usr/bin/env node
/* Test klienta MQTT na własnym brokerze uruchomionym na czas testu.
   Sprawdza dokładnie ten kod, który potem chodzi w telefonach — Node 22 ma
   globalne WebSocket, więc js/mqtt.js działa tu bez żadnych podmianek.

   Wymaga pakietów deweloperskich: npm install (w katalogu jaka-to-melodia). */

import { createServer } from 'node:http';
import assert from 'node:assert/strict';

import { Aedes } from 'aedes';
import { WebSocketServer, createWebSocketStream } from 'ws';

import { KlientMqtt } from '../js/mqtt.js';

const PORT = 18830 + Math.floor(Math.random() * 200);
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));

const broker = await Aedes.createBroker();
const serwer = createServer();
const gniazda = new WebSocketServer({ server: serwer, handleProtocols: (p) => (p.has('mqtt') ? 'mqtt' : false) });
gniazda.on('connection', (ws, zadanie) => broker.handle(createWebSocketStream(ws), zadanie));
await new Promise((r) => serwer.listen(PORT, r));
const adres = `ws://127.0.0.1:${PORT}/mqtt`;

const zdane = [];
const zapisz = (opis) => { zdane.push(opis); console.log(`✓ ${opis}`); };

const prowadzacy = new KlientMqtt({ adres, klientId: 'test-host' });
const gracz = new KlientMqtt({ adres, klientId: 'test-gracz' });
await prowadzacy.polacz();
await gracz.polacz();
zapisz('połączenie i potwierdzenie (CONNECT/CONNACK)');

const doProwadzacego = [];
const doGracza = [];
prowadzacy.onWiadomosc = (_t, tresc) => doProwadzacego.push(JSON.parse(tresc));
gracz.onWiadomosc = (_t, tresc) => doGracza.push(JSON.parse(tresc));
prowadzacy.subskrybuj('jtm/TEST/g');
gracz.subskrybuj('jtm/TEST/h');
await czekaj(200);

gracz.opublikuj('jtm/TEST/g', { t: 'hej', ksywka: 'Zosia' });
await czekaj(200);
assert.equal(doProwadzacego[0]?.ksywka, 'Zosia');
zapisz('wiadomość od gracza dochodzi do prowadzącego');

// Pakiet dłuższy niż 127 bajtów sprawdza wielobajtowe pole długości,
// a polskie znaki — kodowanie UTF-8 w obie strony.
const duzy = {
  t: 'runda',
  odpowiedzi: ['Żółta łódź podwodna', 'Ćma barowa', 'Świerszcze za oknem', 'Ósmy dzień tygodnia'],
  wypelniacz: 'ą'.repeat(400),
};
prowadzacy.opublikuj('jtm/TEST/h', duzy);
await czekaj(250);
assert.equal(doGracza[0]?.wypelniacz.length, 400, 'duży pakiet doszedł ucięty');
assert.equal(doGracza[0]?.odpowiedzi[0], 'Żółta łódź podwodna', 'zepsute polskie znaki');
zapisz('duże pakiety i polskie znaki przechodzą bez szwanku');

// Kilkanaście pakietów pod rząd potrafi wylądować w jednej ramce WebSocket —
// bufor musi je rozdzielić z powrotem.
let policzone = 0;
gracz.onWiadomosc = () => { policzone += 1; };
for (let i = 0; i < 60; i += 1) prowadzacy.opublikuj('jtm/TEST/h', { t: 'licznik', nr: i });
await czekaj(500);
assert.equal(policzone, 60, `zgubione pakiety w serii: ${policzone}/60`);
zapisz('seria 60 pakietów dochodzi w komplecie');

// Zerwane łącze ma zawołać onRozlaczenie, ale własne wyjście z gry — nie.
const drugi = new KlientMqtt({ adres, klientId: 'test-zrywany' });
await drugi.polacz();
let zerwane = false;
drugi.onRozlaczenie = () => { zerwane = true; };
drugi.gniazdo.close();
await czekaj(250);
assert.equal(zerwane, true, 'zerwanie łącza nie zostało zauważone');
zapisz('zerwane łącze woła onRozlaczenie');

let poWlasnym = false;
gracz.onRozlaczenie = () => { poWlasnym = true; };
gracz.rozlacz();
await czekaj(250);
assert.equal(poWlasnym, false, 'własne rozłączenie nie powinno wyglądać na awarię');
zapisz('wyjście z gry nie udaje awarii');

await assert.rejects(
  () => new KlientMqtt({ adres: 'ws://127.0.0.1:1/mqtt' }).polacz(1500),
  /nie odpowiada|połączyć|zamknięte/i,
);
zapisz('martwy adres odrzuca obietnicę zamiast wisieć');

prowadzacy.rozlacz();
broker.close();
gniazda.close();
serwer.close();
console.log(`\nPOŁĄCZENIE OK — ${zdane.length} sprawdzeń`);
process.exit(0);
