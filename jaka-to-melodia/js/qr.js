/* Kod QR do zeskanowania telefonem — rysowany jako SVG, żeby był ostry
   niezależnie od tego, jak duży zrobi się kafelek w lobby. */

import { qrcode } from '../vendor/qrcode.mjs';

/**
 * @param {string} tekst  adres, który ma się zakodować
 * @param {object} opcje
 * @param {number} [opcje.margines]  ile pustych modułów dookoła (norma: 4)
 * @returns {SVGElement}
 */
export function kodQr(tekst, { margines = 3 } = {}) {
  // 0 = sam dobierz najmniejszą wersję, „M” = średnia korekcja błędów:
  // wystarcza, gdy ktoś skanuje pod kątem, a kod zostaje gęsty i czytelny.
  const kod = qrcode(0, 'M');
  kod.addData(tekst);
  kod.make();

  const modulow = kod.getModuleCount();
  const bok = modulow + margines * 2;

  // Jedna ścieżka na wszystkie ciemne moduły — mniej węzłów niż tysiąc <rect>.
  const kawalki = [];
  for (let wiersz = 0; wiersz < modulow; wiersz += 1) {
    for (let kolumna = 0; kolumna < modulow; kolumna += 1) {
      if (kod.isDark(wiersz, kolumna)) {
        kawalki.push(`M${kolumna + margines} ${wiersz + margines}h1v1h-1z`);
      }
    }
  }

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${bok} ${bok}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Kod QR z adresem do dołączenia');

  const tlo = document.createElementNS(NS, 'rect');
  tlo.setAttribute('width', String(bok));
  tlo.setAttribute('height', String(bok));
  tlo.setAttribute('fill', '#ffffff');
  svg.append(tlo);

  const sciezka = document.createElementNS(NS, 'path');
  sciezka.setAttribute('d', kawalki.join(''));
  sciezka.setAttribute('fill', '#0b0f22');
  svg.append(sciezka);

  return svg;
}
