// Arkusze dolne: szczegóły ćwiczenia (technika, historia, wykres)
// i wybór ćwiczenia (zamienniki, wszystkie wg obszaru, własne).

import { OBSZARY } from './dane.js';
import { cwiczenie, wszystkieCwiczenia, dodajWlasne, pobierz } from './magazyn.js';
import { arkusz, esc, ruch, kolor, IKONY, toast } from './ui.js';
import { punktyCwiczenia, duzy } from './wykres.js';
import { TECHNIKA, ZASADY_SERII } from './technika.js';
import { fmtKg, e1rm, serieCwiczenia, trudnosc, fmtMnoznik } from './logika.js';

const TYPY = { hantle: 'Hantle', maszyna: 'Maszyna', wyciag: 'Wyciąg', cialo: 'Masa ciała' };

function opisTechniki(c) {
  const t = TECHNIKA[c.id];
  if (!c.rady?.length && !t) return `<p class="cichy">Ćwiczenie dodane przez Ciebie, bez opisu techniki.</p>${zasadySerii()}`;
  return `
    ${t?.ustawienie ? `<h3 class="tech-tytul">Ustawienie</h3><p class="tech-tekst">${esc(t.ustawienie)}</p>` : ''}
    ${c.rady?.length ? `<h3 class="tech-tytul">Technika</h3><ul class="rady">${c.rady.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    ${t?.blad ? `<h3 class="tech-tytul">Najczęstszy błąd</h3><p class="tech-tekst tech-blad">${esc(t.blad)}</p>` : ''}
    ${t?.pro?.length ? `<h3 class="tech-tytul">Dla zaawansowanych</h3><ul class="rady">${t.pro.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    ${zasadySerii()}`;
}

function zasadySerii() {
  return `<details class="tech-zasady"><summary>Jak robić serie</summary><ul class="rady">${ZASADY_SERII.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></details>`;
}

function opisTrudnosci(cwId) {
  const t = trudnosc(cwId, pobierz().wlasne);
  const masa = pobierz().ustawienia.masaCiala || 80;
  return `Trudność ${fmtMnoznik(t.trud)}: XP = ${t.udzial ? `(${Math.round(t.udzial * 100)}% Twojej wagi, czyli ${Math.round(masa * t.udzial)} kg, plus dociążenie)` : 'ciężar'} × powtórzenia × ${String(t.trud).replace('.', ',')} / 10.`;
}

export function szczegoly(cwId, { akcje = '' } = {}) {
  const c = cwiczenie(cwId);
  if (!c) return null;
  const s = pobierz();
  const serie = serieCwiczenia(s.treningi, cwId);
  const punkty = punktyCwiczenia(s.treningi, cwId);
  const zCiezarem = serie.some((x) => x.kg > 0);
  const najKg = serie.length ? Math.max(...serie.map((x) => x.kg || 0)) : null;
  const najE = zCiezarem ? Math.max(...serie.map((x) => e1rm(x.kg, x.powt))) : null;
  const najP = serie.length ? Math.max(...serie.map((x) => x.powt)) : null;
  const j = c.jednostka === 's' ? 's' : 'powt.';
  const ostatnie = [...s.treningi].reverse()
    .map((t) => ({ t, c: t.cwiczenia.find((x) => x.cw === cwId) }))
    .filter((x) => x.c && x.c.serie.some((y) => y.ok)).slice(0, 4);

  return arkusz(`
    <div class="arkusz-gora">
      <div>
        <span class="chip" style="--kolor:${kolor(c.obszar)}"><i></i>${esc(OBSZARY[c.obszar]?.nazwa || '')}</span>
        <h2 style="margin-top:8px">${esc(c.nazwa)}</h2>
        ${c.cel ? `<p class="cichy maly" style="margin:4px 0 0">Cel: ${esc(c.cel)}</p>` : ''}
        <p class="cichy maly" style="margin:4px 0 0">${opisTrudnosci(cwId)}</p>
      </div>
      <button class="btn btn-ikona" type="button" data-zamknij aria-label="Zamknij">${IKONY.zamknij}</button>
    </div>
    ${ruch(c.img, { duzy: true, obszar: c.obszar, nazwa: c.nazwa, id: c.id })}
    ${opisTechniki(c)}
    ${akcje}
    <section class="sekcja">
      <h3>Twoje wyniki</h3>
      ${serie.length ? `
        <div class="licznik" style="grid-template-columns:repeat(${zCiezarem ? 3 : 1},1fr);margin:10px 0">
          ${zCiezarem ? `<div class="kafel"><div class="kafel-tytul">Największy ciężar</div><div class="kafel-wartosc">${fmtKg(najKg)}<small>kg</small></div></div>
          <div class="kafel"><div class="kafel-tytul">Szac. maks</div><div class="kafel-wartosc">${fmtKg(Math.round(najE))}<small>kg</small></div></div>` : ''}
          <div class="kafel"><div class="kafel-tytul">Najwięcej ${j === 's' ? 'sekund' : 'powtórzeń'}</div><div class="kafel-wartosc">${najP}</div></div>
        </div>
        ${duzy(punkty, kolor(c.obszar))}
        <table class="historia" style="width:100%;margin-top:8px;font-size:14.5px">${ostatnie.map(({ t, c: x }) => `<tr><td style="padding:5px 0;border-top:1px solid var(--linia)">${new Date(t.data).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</td><td style="padding:5px 0;border-top:1px solid var(--linia);text-align:right">${x.serie.filter((y) => y.ok).map((y) => `${fmtKg(y.kg)} kg × ${y.powt}`).join(', ')}</td></tr>`).join('')}</table>`
    : '<div class="pusto">Jeszcze tego nie robiłeś. Pierwszy wpis będzie punktem startowym do rekordów.</div>'}
    </section>
  `);
}

function elementListy(c, wybrane = false) {
  return `<li><button type="button" data-wybierz="${esc(c.id)}" aria-pressed="${wybrane}">
    ${ruch(c.img, { obszar: c.obszar, nazwa: c.nazwa, id: c.id })}
    <span><b>${esc(c.nazwa)}</b><small><span class="partia" style="--kolor:${kolor(c.obszar)}">${esc(OBSZARY[c.obszar]?.nazwa || '')}</span> ${esc((TYPY[c.typ] || '').toLowerCase())}, trudność ${fmtMnoznik(trudnosc(c.id, pobierz().wlasne).trud)}${c.wlasne ? ', Twoje własne' : ''}</small></span>
  </button></li>`;
}

// Wybór ćwiczenia. `obecny`: id zamienianego (albo null przy dodawaniu).
// `zasiegi`: lista [{ id, etykieta }]; gdy jest więcej niż jeden, po wyborze
// ćwiczenia apka pyta, czy zamiana jest jednorazowa, czy na stałe.
function normalizuj(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Dodatkowe słowa, którymi ludzie nazywają sprzęt na siłowni.
const SLOWA_TYPU = { wyciag: 'wyciag brama linka linki bloczek', maszyna: 'maszyna', hantle: 'hantle hantel', cialo: 'masa ciala bez sprzetu' };

function szukaj(lista, q, { luzno = false } = {}) {
  const slowa = q.split(' ').filter((w) => w && (!luzno || w.length >= 4));
  return lista
    .map((c) => {
      const nazwa = normalizuj(c.nazwa);
      const tlo = `${nazwa} ${normalizuj(OBSZARY[c.obszar]?.nazwa)} ${SLOWA_TYPU[c.typ] || ''} ${normalizuj(c.cel)} ${normalizuj(c.img)}`;
      if (!slowa.length || !(luzno ? slowa.some((w) => nazwa.includes(w.slice(0, 5))) : slowa.every((w) => tlo.includes(w)))) return null;
      // Wyżej to, co zaczyna się od wpisanego słowa w samej nazwie.
      const punkty = (nazwa.startsWith(slowa[0]) ? 4 : 0) + slowa.filter((w) => nazwa.includes(w)).length * 2
        + slowa.filter((w) => nazwa.split(' ').some((x) => x.startsWith(w))).length;
      return { c, punkty };
    })
    .filter(Boolean)
    .sort((a, b) => b.punkty - a.punkty || a.c.nazwa.localeCompare(b.c.nazwa, 'pl'))
    .map((x) => x.c);
}

export function wyborCwiczenia({ tytul, obecny = null, obszarStart = null, zasiegi = [], przycisk = 'Wybierz', onWybierz }) {
  const akt = obecny ? cwiczenie(obecny) : null;
  const zamienniki = akt ? (akt.alt || []).map(cwiczenie).filter(Boolean) : [];
  const wlasne = wszystkieCwiczenia().filter((c) => c.wlasne && (!akt || c.obszar === akt.obszar));
  const startObszar = obszarStart || akt?.obszar || 'klatka';
  const zakladkaStart = zamienniki.length ? 'zam' : 'wsz';

  const a = arkusz(`
    <div class="arkusz-gora">
      <div><h2>${esc(tytul)}</h2>${akt ? `<p class="cichy maly" style="margin:4px 0 0">Teraz: ${esc(akt.nazwa)}</p>` : ''}</div>
      <button class="btn btn-ikona" type="button" data-zamknij aria-label="Zamknij">${IKONY.zamknij}</button>
    </div>
    <div data-krok="lista">
      <label class="szukaj">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input type="search" data-szukaj autocomplete="off" enterkeyhint="search" placeholder="Szukaj, np. podciąganie" aria-label="Szukaj ćwiczenia">
      </label>
      <div data-wyniki hidden></div>
      <div data-zakladki-wrap>
      <div class="zakladki" role="tablist">
        ${zamienniki.length ? '<button type="button" role="tab" data-zakladka="zam">Zamienniki</button>' : ''}
        <button type="button" role="tab" data-zakladka="wsz">Wszystkie</button>
        <button type="button" role="tab" data-zakladka="wl">Wpisz własne</button>
      </div>
      <div data-panel="zam" hidden>
        <p class="maly cichy" style="margin:0 0 8px">Pracują ten sam mięsień. Przydają się, gdy maszyna jest zajęta.</p>
        <ul class="lista-cw">${zamienniki.map((c) => elementListy(c)).join('')}${wlasne.map((c) => elementListy(c)).join('')}</ul>
      </div>
      <div data-panel="wsz" hidden>
        <label class="pole"><span>Obszar</span>
          <select data-obszar>${Object.entries(OBSZARY).map(([k, o]) => `<option value="${k}" ${k === startObszar ? 'selected' : ''}>${esc(o.nazwa)}</option>`).join('')}</select>
        </label>
        <ul class="lista-cw" data-lista-obszaru></ul>
      </div>
      <form data-panel="wl" hidden>
        <p class="maly cichy" style="margin:0 0 10px">Własne ćwiczenie zapisze się na stałe i będzie na liście przy kolejnych zamianach.</p>
        <label class="pole"><span>Nazwa ćwiczenia</span><input name="nazwa" required maxlength="60" autocomplete="off" placeholder="np. Wyciskanie na maszynie Hammer"></label>
        <label class="pole"><span>Co trenuje</span>
          <select name="obszar">${Object.entries(OBSZARY).map(([k, o]) => `<option value="${k}" ${k === startObszar ? 'selected' : ''}>${esc(o.nazwa)}</option>`).join('')}</select>
        </label>
        <label class="pole"><span>Sprzęt</span>
          <select name="typ">${Object.entries(TYPY).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
        </label>
        <div data-podobne></div>
        <button class="btn btn-pelny" type="submit">Dodaj ćwiczenie</button>
      </form>
      </div>
    </div>
    <div data-krok="zasieg" hidden></div>
  `);
  const el = a.el;

  const pokazObszar = (k) => {
    const lista = wszystkieCwiczenia().filter((c) => c.obszar === k && c.id !== obecny);
    el.querySelector('[data-lista-obszaru]').innerHTML = lista.map((c) => elementListy(c)).join('');
  };
  const pokazZakladke = (k) => {
    el.querySelectorAll('[data-zakladka]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.zakladka === k)));
    el.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== k; });
  };
  pokazObszar(startObszar);
  pokazZakladke(zakladkaStart);

  // Wyszukiwarka: pasuje każde słowo z zapytania, bez polskich znaków
  // i bez wielkości liter. W bazie jest też angielska nazwa ze zdjęcia,
  // więc „pull up” albo „lateral” też coś znajdą.
  const wszystkie = wszystkieCwiczenia().filter((c) => c.id !== obecny);
  const wyniki = el.querySelector('[data-wyniki]');
  const zakladkiWrap = el.querySelector('[data-zakladki-wrap]');
  const pole = el.querySelector('[data-szukaj]');
  const pokazWyniki = () => {
    const q = normalizuj(pole.value);
    zakladkiWrap.hidden = !!q;
    wyniki.hidden = !q;
    if (!q) return;
    const lista = szukaj(wszystkie, q);
    wyniki.innerHTML = lista.length
      ? `<p class="maly cichy" style="margin:0 0 8px">Znalezione: ${lista.length}</p><ul class="lista-cw">${lista.map((c) => elementListy(c)).join('')}</ul>`
      : `<div class="pusto">Nie ma takiego ćwiczenia w apce.</div>`;
    wyniki.insertAdjacentHTML('beforeend', `<button class="btn btn-pelny" type="button" data-jako-wlasne style="margin-top:10px">Dodaj „${esc(pole.value.trim())}” jako własne</button>`);
  };
  pole.addEventListener('input', pokazWyniki);
  el.addEventListener('click', (e) => {
    if (!e.target.closest('[data-jako-wlasne]')) return;
    const nazwa = pole.value.trim();
    pole.value = '';
    pokazWyniki();
    pokazZakladke('wl');
    const inp = el.querySelector('[name="nazwa"]');
    inp.value = nazwa.charAt(0).toUpperCase() + nazwa.slice(1);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.focus();
  });

  // Przy wpisywaniu własnego: podpowiedź, że takie ćwiczenie już jest.
  const podobne = el.querySelector('[data-podobne]');
  el.querySelector('[name="nazwa"]').addEventListener('input', (e) => {
    const q = normalizuj(e.target.value);
    const lista = q.length >= 3 ? szukaj(wszystkie, q, { luzno: true }).slice(0, 4) : [];
    podobne.innerHTML = lista.length
      ? `<p class="maly cichy" style="margin:0 0 8px">Może chodzi Ci o któreś z tych? Dotknij, żeby wybrać.</p><ul class="lista-cw" style="margin-bottom:12px">${lista.map((c) => elementListy(c)).join('')}</ul>`
      : '';
  });

  const zatwierdz = (id) => {
    if (zasiegi.length <= 1) {
      a.zamknij();
      onWybierz(id, zasiegi[0]?.id);
      return;
    }
    const c = cwiczenie(id);
    const krok = el.querySelector('[data-krok="zasieg"]');
    el.querySelector('[data-krok="lista"]').hidden = true;
    krok.hidden = false;
    krok.innerHTML = `
      <ul class="lista-cw">${elementListy(c, true)}</ul>
      <div class="wybor-zasiegu" role="radiogroup" aria-label="Na jak długo">
        ${zasiegi.map((z, i) => `<label><input type="radio" name="zasieg" value="${z.id}" ${i === 0 ? 'checked' : ''}><span>${esc(z.etykieta)}</span></label>`).join('')}
      </div>
      <button class="btn btn-kreda btn-pelny" type="button" data-potwierdz>${esc(przycisk)}</button>
      <button class="btn-tekst btn-pelny" type="button" data-wstecz>Wybierz inne</button>`;
    krok.querySelector('[data-potwierdz]').addEventListener('click', () => {
      const z = krok.querySelector('input[name="zasieg"]:checked').value;
      a.zamknij();
      onWybierz(id, z);
    });
    krok.querySelector('[data-wstecz]').addEventListener('click', () => {
      krok.hidden = true;
      el.querySelector('[data-krok="lista"]').hidden = false;
    });
  };

  el.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zakladka]');
    if (z) pokazZakladke(z.dataset.zakladka);
    const w = e.target.closest('[data-wybierz]');
    if (w) zatwierdz(w.dataset.wybierz);
  });
  el.querySelector('[data-obszar]').addEventListener('change', (e) => pokazObszar(e.target.value));
  el.querySelector('[data-panel="wl"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nazwa = String(f.get('nazwa') || '').trim();
    if (!nazwa) return;
    const c = dodajWlasne({ nazwa, obszar: f.get('obszar'), typ: f.get('typ') });
    toast(`Dodano: ${c.nazwa}`);
    zatwierdz(c.id);
  });
  return a;
}
