#!/usr/bin/env node
/* Skleja całą aplikację w jeden plik HTML:
     node narzedzia/jeden-plik.mjs
   Wynik ląduje w dist/gacha-miast.html — można go wysłać znajomym
   komunikatorem i otworzyć wprost z telefonu, bez internetu i bez hostingu. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const korzen = join(dirname(fileURLToPath(import.meta.url)), '..');
const czytaj = (nazwa) => readFileSync(join(korzen, nazwa), 'utf8');
const base64 = (nazwa) => readFileSync(join(korzen, nazwa)).toString('base64');

let html = czytaj('index.html');

// Style i skrypty wstawiamy w miejsce ich znaczników.
html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${czytaj('styles.css')}\n</style>`);
html = html.replace('<script src="dane.js"></script>', `<script>\n${czytaj('dane.js')}\n</script>`);
html = html.replace('<script src="app.js"></script>', `<script>\n${czytaj('app.js')}\n</script>`);

// Ikony jako data URI — plik ma być samowystarczalny.
const ikona = `data:image/png;base64,${base64('icons/icon-192.png')}`;
html = html.replace('<link rel="icon" href="icons/favicon.png" type="image/png">',
  `<link rel="icon" href="data:image/png;base64,${base64('icons/favicon.png')}" type="image/png">`);
html = html.replace('<link rel="apple-touch-icon" href="icons/icon-192.png">',
  `<link rel="apple-touch-icon" href="${ikona}">`);

// Manifest i podgląd linku mają sens tylko na serwerze.
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '');
html = html.replace(/^\s*<meta property="og:[^>]*>\n/gm, '');
html = html.replace(/^\s*<meta name="twitter:[^>]*>\n/gm, '');

mkdirSync(join(korzen, 'dist'), { recursive: true });
const wyjscie = join(korzen, 'dist', 'gacha-miast.html');
writeFileSync(wyjscie, html);
console.log(`✓ ${wyjscie}  (${Math.round(html.length / 1024)} kB)`);
