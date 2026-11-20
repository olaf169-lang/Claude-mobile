// Skleja aplikację w jeden plik HTML (dist/mb-goat-guide.html): style, skrypty
// i ikony wchodzą do środka. Tak powstaje wersja publikowana na claude.ai,
// gdzie strona musi być jednym plikiem i nie może mieć service workera.
// Uruchom z katalogu mb-goat-guide/:  node narzedzia/jeden-plik.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const czytaj = (p) => readFileSync(p, 'utf8');
const base64 = (p) => readFileSync(p).toString('base64');
let html = czytaj('index.html');

html = html.replace('<link rel="manifest" href="manifest.webmanifest">\n', '');
html = html.replace('href="icons/favicon.svg"', `href="data:image/svg+xml;base64,${base64('icons/favicon.svg')}"`);
html = html.replace('href="icons/apple-touch-icon.png"', `href="data:image/png;base64,${base64('icons/apple-touch-icon.png')}"`);
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${czytaj('styles.css')}</style>`);

const skrypty = [...html.matchAll(/<script src="([^"]+)"><\/script>\n?/g)];
if (!skrypty.length) throw new Error('Nie znalazłem skryptów w index.html');
const kod = skrypty.map((m) => czytaj(m[1])).join('\n');
html = html.replace(skrypty.map((m) => m[0]).join(''), () => `<script>\n${kod}\n</script>\n`);
if (html.includes('<script src=')) throw new Error('Skrypty nie stoją jeden pod drugim w index.html');

mkdirSync('dist', { recursive: true });
writeFileSync('dist/mb-goat-guide.html', html);
console.log(`dist/mb-goat-guide.html: ${(html.length / 1024).toFixed(0)} KB, ${skrypty.length} skryptów w środku`);
