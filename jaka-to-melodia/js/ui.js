/* Drobiazgi do DOM-u — tyle, żeby reszta kodu czytała się jak opis ekranu. */

export const $ = (wybor, gdzie = document) => gdzie.querySelector(wybor);
export const $$ = (wybor, gdzie = document) => [...gdzie.querySelectorAll(wybor)];

export function el(znacznik, wlasciwosci = {}, dzieci = []) {
  const element = document.createElement(znacznik);
  for (const [klucz, wartosc] of Object.entries(wlasciwosci)) {
    if (klucz === 'klasa') element.className = wartosc;
    else if (klucz === 'tekst') element.textContent = wartosc;
    else if (klucz === 'html') element.innerHTML = wartosc;
    else if (klucz.startsWith('na')) element.addEventListener(klucz.slice(2).toLowerCase(), wartosc);
    else if (wartosc !== null && wartosc !== undefined && wartosc !== false) {
      element.setAttribute(klucz, wartosc === true ? '' : String(wartosc));
    }
  }
  for (const dziecko of [dzieci].flat()) {
    if (dziecko) element.append(dziecko.nodeType ? dziecko : document.createTextNode(String(dziecko)));
  }
  return element;
}

export function wyczysc(element) {
  while (element.firstChild) element.firstChild.remove();
  return element;
}

/** Pokazuje jeden ekran z <main>, resztę chowa.
    Nazwa bieżącego ekranu ląduje na <body> jako `data-widok` — celowo pod inną
    nazwą niż `data-ekran` na sekcjach, żeby pętla niżej nie schowała <body>. */
export function pokazEkran(nazwa) {
  for (const ekran of $$('main [data-ekran]')) {
    ekran.hidden = ekran.dataset.ekran !== nazwa;
  }
  document.body.dataset.widok = nazwa;
  window.scrollTo(0, 0);
}

/** Który ekran jest teraz na wierzchu. */
export const biezacyEkran = () => document.body.dataset.widok || '';

export function odmiana(liczba, jeden, kilka, wiele) {
  const n = Math.abs(liczba);
  if (n === 1) return jeden;
  const dziesiatki = n % 100;
  const jednosci = n % 10;
  if (jednosci >= 2 && jednosci <= 4 && (dziesiatki < 12 || dziesiatki > 14)) return kilka;
  return wiele;
}

/** Krótki komunikat u dołu ekranu. */
let znikanie = null;
export function powiadom(tekst, rodzaj = 'info') {
  const pasek = $('#powiadomienie');
  if (!pasek) return;
  pasek.textContent = tekst;
  pasek.dataset.rodzaj = rodzaj;
  pasek.hidden = false;
  clearTimeout(znikanie);
  znikanie = setTimeout(() => { pasek.hidden = true; }, 4200);
}

/** Delikatne stuknięcie — Android potrafi, iPhone udaje, że nie słyszał. */
export function stuknij(wzor = 12) {
  try { navigator.vibrate?.(wzor); } catch { /* nieistotne */ }
}

/** Nie pozwala telefonowi zgasić ekranu w trakcie gry. */
export async function trzymajEkran() {
  try {
    if (!('wakeLock' in navigator)) return null;
    return await navigator.wakeLock.request('screen');
  } catch {
    return null;                      // np. bateria na wyczerpaniu — trudno
  }
}
