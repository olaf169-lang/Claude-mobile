/* ==========================================================================
   Drobiazgi wspólne dla wszystkich ekranów: budowanie HTML, arkusz
   wysuwany od dołu (pomoc, potwierdzenia) i krótkie komunikaty.
   ========================================================================== */

export const $  = (sel, gdzie = document) => gdzie.querySelector(sel);
export const $$ = (sel, gdzie = document) => [...gdzie.querySelectorAll(sel)];

/** Zamienia niebezpieczne znaki. Wszystko, co wpisze użytkownik (imię Gościa),
    przechodzi przez to zanim trafi do innerHTML. */
export function bez(tekst) {
  return String(tekst ?? '').replace(/[&<>"']/g, (z) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z]));
}

export function zeZnakiem(n) {
  return n > 0 ? `+${n}` : String(n);
}

export function klasaSalda(n) {
  return n > 0 ? 'plus' : n < 0 ? 'minus' : 'zero';
}

/** Polska odmiana przez liczbę: 1 mecz, 2 mecze, 5 meczów. */
export function odmiana(n, poj, malo, duzo) {
  const d = n % 10, s = n % 100;
  if (n === 1) return poj;
  return (d >= 2 && d <= 4 && !(s >= 12 && s <= 14)) ? malo : duzo;
}

export const odmianaWygranych = (n) => odmiana(n, 'wygrana', 'wygrane', 'wygranych');
export const odmianaMeczow = (n) => odmiana(n, 'mecz', 'mecze', 'meczów');
export const odmianaWieczorow = (n) => odmiana(n, 'wieczór', 'wieczory', 'wieczorów');
export const odmianaSetow = (n) => odmiana(n, 'set', 'sety', 'setów');

/* ---------------------------------------------------------------- arkusz */

let arkuszEl = null;

/** Panel wysuwany od dołu. Zwraca funkcję zamykającą. */
export function arkusz({ tytul, tresc, stopka = '' }) {
  zamknijArkusz();
  arkuszEl = document.createElement('div');
  arkuszEl.className = 'arkusz-tlo';
  arkuszEl.innerHTML = `
    <div class="arkusz" role="dialog" aria-modal="true" aria-label="${bez(tytul)}">
      <div class="arkusz-uchwyt" aria-hidden="true"></div>
      <h3 class="arkusz-tytul">${tytul}</h3>
      <div class="arkusz-tresc">${tresc}</div>
      <div class="arkusz-stopka">${stopka}
        <button class="btn btn-glowny" type="button" data-zamknij>Rozumiem</button>
      </div>
    </div>`;
  document.body.appendChild(arkuszEl);
  requestAnimationFrame(() => arkuszEl?.classList.add('widoczny'));
  arkuszEl.addEventListener('click', (e) => {
    if (e.target === arkuszEl || e.target.closest('[data-zamknij]')) zamknijArkusz();
  });
  document.addEventListener('keydown', naEscape);
  arkuszEl.querySelector('[data-zamknij]')?.focus();
  const el = arkuszEl;
  return { el, zamknij: zamknijArkusz };
}

function naEscape(e) { if (e.key === 'Escape') zamknijArkusz(); }

export function zamknijArkusz() {
  document.removeEventListener('keydown', naEscape);
  if (!arkuszEl) return;
  const el = arkuszEl;
  arkuszEl = null;
  el.classList.remove('widoczny');
  setTimeout(() => el.remove(), 220);
}

/** Pytanie tak/nie w tym samym arkuszu. */
export function potwierdz(tytul, tresc, etykietaTak = 'Tak, usuń') {
  return new Promise((gotowe) => {
    zamknijArkusz();
    const el = document.createElement('div');
    el.className = 'arkusz-tlo';
    el.innerHTML = `
      <div class="arkusz" role="dialog" aria-modal="true">
        <div class="arkusz-uchwyt" aria-hidden="true"></div>
        <h3 class="arkusz-tytul">${bez(tytul)}</h3>
        <div class="arkusz-tresc"><p>${bez(tresc)}</p></div>
        <div class="arkusz-stopka dwa">
          <button class="btn" type="button" data-nie>Anuluj</button>
          <button class="btn btn-groza" type="button" data-tak>${bez(etykietaTak)}</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('widoczny'));
    const koniec = (odp) => {
      el.classList.remove('widoczny');
      setTimeout(() => el.remove(), 220);
      gotowe(odp);
    };
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('[data-nie]')) koniec(false);
      if (e.target.closest('[data-tak]')) koniec(true);
    });
  });
}

/** Arkusz z jednym polem: imię dopisanej osoby, kod administratora.
    Zwraca wpisany tekst albo null, gdy ktoś się rozmyślił. */
export function zapytaj({ tytul, opis = '', etykieta, wartosc = '', placeholder = '',
  typ = 'text', ok = 'Zapisz' }) {
  return new Promise((gotowe) => {
    zamknijArkusz();
    const el = document.createElement('div');
    el.className = 'arkusz-tlo';
    el.innerHTML = `
      <div class="arkusz" role="dialog" aria-modal="true">
        <div class="arkusz-uchwyt" aria-hidden="true"></div>
        <h3 class="arkusz-tytul">${bez(tytul)}</h3>
        <div class="arkusz-tresc">
          ${opis ? `<p>${opis}</p>` : ''}
          <label class="pole">
            <span>${bez(etykieta)}</span>
            <input type="${typ}" id="arkusz-pole" value="${bez(wartosc)}"
              placeholder="${bez(placeholder)}" autocomplete="off" maxlength="24">
          </label>
        </div>
        <div class="arkusz-stopka dwa">
          <button class="btn" type="button" data-nie>Anuluj</button>
          <button class="btn btn-glowny" type="button" data-tak>${bez(ok)}</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.add('widoczny');
      el.querySelector('#arkusz-pole')?.focus();
    });
    const koniec = (odp) => {
      el.classList.remove('widoczny');
      setTimeout(() => el.remove(), 220);
      gotowe(odp);
    };
    const zatwierdz = () => {
      const v = el.querySelector('#arkusz-pole')?.value.trim() ?? '';
      koniec(v || null);
    };
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') zatwierdz(); });
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('[data-nie]')) koniec(null);
      if (e.target.closest('[data-tak]')) zatwierdz();
    });
  });
}

/* ----------------------------------------------------------------- toast */

let toastTimer = null;

export function komunikat(tekst, rodzaj = '') {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.className = `toast ${rodzaj} widoczny`;
  el.textContent = tekst;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('widoczny'), 2800);
}

/* ------------------------------------------------------- ostrożne skupienie */

/** Zapamiętuje, w którym polu stoi kursor, żeby przerysowanie ekranu
    (bo ktoś inny właśnie dopisał wynik) nie wyrzuciło Cię z pisania. */
export function zapamietajSkupienie() {
  const el = document.activeElement;
  if (!el || !el.id || !['INPUT', 'SELECT'].includes(el.tagName)) return null;
  return { id: el.id, start: el.selectionStart, koniec: el.selectionEnd };
}

export function przywrocSkupienie(zapis) {
  if (!zapis) return;
  const el = document.getElementById(zapis.id);
  if (!el) return;
  el.focus();
  try { el.setSelectionRange(zapis.start, zapis.koniec); } catch { /* number input */ }
}
