/* ==========================================================================
   Ekran „Wieczór” — jedyne miejsce, gdzie się cokolwiek wpisuje.

   Zasada: nic nie trzeba zatwierdzać. Wpisujesz liczbę, wychodzisz z pola
   i wynik jest już u wszystkich. Poprawka działa tak samo — nadpisujesz
   i cała reszta (tabela, ELO, tytuły) przelicza się od nowa.
   ========================================================================== */

import { GRACZE, GOSC, gracz, FORMATY, FORMAT_DOMYSLNY, najblizszyWtorek, poPolsku, dzisiajIso } from './dane.js';
import { ukladMeczow, wynikMeczu, ilePolNaSety, rekordyWieczoru, mvpWieczoru, mecze as meczeZ } from './liczenie.js';
import { przelicz, fora } from './elo.js';
import { dymek, naglowekZPomoca } from './pomoc.js';
import { bez, zeZnakiem, klasaSalda, potwierdz, komunikat } from './ui.js';
import * as baza from './baza.js';

let wybranaData = null;
let szkicSkladu = null;      // skład wybierany, zanim wieczór powstanie w bazie
let szkicFormatu = null;     // format wybrany przed utworzeniem wieczoru

export function ustawDate(data) { wybranaData = data; szkicSkladu = null; }

function domyslnaData(wieczory) {
  const dzis = dzisiajIso();
  if (wieczory.some((w) => w.data === dzis)) return dzis;
  const przyszly = najblizszyWtorek();
  return przyszly >= dzis ? przyszly : dzis;
}

export function render(kontener, ctx) {
  const { wieczory } = ctx;
  wybranaData ??= domyslnaData(wieczory);
  const wieczor = wieczory.find((w) => w.data === wybranaData) ?? null;

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Wieczór</h1>
      <p class="podtytul">${poPolsku(wybranaData)}</p>
    </div>
    ${kartaTerminu(wieczor)}
    ${wieczor ? kartyMeczow(wieczor, ctx) : kartaSkladu()}
    ${wieczor ? kartaPodsumowania(wieczor) : ''}
    ${wieczor ? kartaKoniec() : ''}`;

  podepnij(kontener, ctx);
}

/* ------------------------------------------------------------- termin */

function kartaTerminu(wieczor) {
  const format = wieczor?.format ?? szkicFormatu ?? FORMAT_DOMYSLNY;
  return `<section class="karta">
    ${naglowekZPomoca('Termin i format', 'format')}
    <div class="pola-obok">
      <label class="pole">
        <span>Data</span>
        <input type="date" id="pole-data" value="${wybranaData}">
      </label>
      <label class="pole">
        <span>Format meczu</span>
        <select id="pole-format">
          ${Object.entries(FORMATY).map(([id, f]) =>
            `<option value="${id}" ${id === format ? 'selected' : ''}>${f.nazwa}</option>`).join('')}
        </select>
      </label>
    </div>
    <p class="wskazowka">${FORMATY[format].nazwa} — ${FORMATY[format].czas} na trzy mecze.
      ${format === FORMAT_DOMYSLNY ? 'Trzeci set pojawi się dopiero przy stanie 1:1.' : ''}</p>
  </section>`;
}

/* -------------------------------------------------------------- skład */

function kartaSkladu() {
  const wybrani = szkicSkladu ?? GRACZE.map((g) => g.id);
  const zGosciem = wybrani.includes(GOSC.id);
  return `<section class="karta">
    ${naglowekZPomoca('Kto przyszedł?', 'sklady')}
    <div class="chipy">
      ${GRACZE.map((g) => `
        <button class="chip ${wybrani.includes(g.id) ? 'wybrany' : ''}" type="button"
          data-przelacz="${g.id}" aria-pressed="${wybrani.includes(g.id)}">${g.imie}</button>`).join('')}
      <button class="chip chip-gosc ${zGosciem ? 'wybrany' : ''}" type="button"
        data-przelacz="${GOSC.id}" aria-pressed="${zGosciem}">+ Gość ${dymek('gosc')}</button>
    </div>
    ${zGosciem ? `<label class="pole">
      <span>Jak ma na imię Gość?</span>
      <input type="text" id="pole-gosc" placeholder="Gość" maxlength="18" value="">
    </label>` : ''}
    <p class="wskazowka">${opisUkladu(wybrani.length)}</p>
    <button class="btn btn-glowny szeroki" type="button" id="ustaw-mecze"
      ${wybrani.length < 2 ? 'disabled' : ''}>Ustaw mecze</button>
  </section>`;
}

function opisUkladu(ilu) {
  if (ilu >= 4) return 'Czterech grających → trzy deble, pełna rotacja: każdy zagra w parze z każdym.';
  if (ilu === 3) return 'Trzech grających → single każdy z każdym, każdy gra dwa mecze i raz odpoczywa.';
  if (ilu === 2) return 'Dwóch grających → jeden singiel. Kolejne mecze dorzucisz przyciskiem na dole.';
  return 'Zaznacz przynajmniej dwie osoby.';
}

/* -------------------------------------------------------------- mecze */

function kartyMeczow(wieczor, ctx) {
  const format = FORMATY[wieczor.format ?? FORMAT_DOMYSLNY];
  const lista = meczeZ(wieczor);
  const { rating } = przelicz(ctx.wieczory.filter((w) => w.data < wieczor.data));

  const sklad = wieczor.sklad ?? [];
  const naglowek = `<section class="karta karta-skladu">
    <div class="karta-tytul-rzad">
      <h2 class="karta-tytul">Skład ${dymek('rotacja')}</h2>
      <button class="btn btn-maly" type="button" id="zmien-sklad">Zmień</button>
    </div>
    <div class="skladzik">${sklad.map((id) => `<span class="tag">${bez(imie(wieczor, id))}</span>`).join('')}</div>
    <label class="przelacznik">
      <input type="checkbox" id="pole-towarzyski" ${wieczor.towarzyski ? 'checked' : ''}>
      <span>Wieczór towarzyski — nie liczy się do sezonu ${dymek('towarzyski')}</span>
    </label>
  </section>`;

  return naglowek + lista.map((m) => kartaMeczu(m, format, wieczor, rating)).join('')
    + `<button class="btn szeroki btn-obrys" type="button" id="dograj-mecz">+ Dograj mecz</button>`;
}

function imie(wieczor, id) {
  if (id === GOSC.id) return wieczor.goscImie || 'Gość';
  return gracz(id).imie;
}

function kartaMeczu(mecz, format, wieczor, rating) {
  const r = wynikMeczu(mecz);
  const pol = ilePolNaSety(format, mecz);
  const f = fora(mecz.a, mecz.b, rating);
  const podpowiedzFor = f.punkty > 0
    ? `<span class="fora" title="Propozycja wyrównania na podstawie 🏸ELO🏸">
         fora ${f.punkty} dla ${bez((f.mocniejsza === 'a' ? mecz.b : mecz.a).map((i) => imie(wieczor, i)).join(' + '))}
       </span>` : '';

  const strona = (ids, klucz) => `
    <div class="mecz-strona">
      <div class="mecz-para">${ids.map((i) => `<span>${bez(imie(wieczor, i))}</span>`).join('<i>+</i>')}</div>
      <div class="mecz-sety">
        ${Array.from({ length: pol }, (_, i) => `
          <input class="set" type="number" inputmode="numeric" min="0" max="40"
            id="set-${mecz.nr}-${i}-${klucz}" data-mecz="${mecz.nr}" data-set="${i}" data-strona="${klucz}"
            aria-label="Mecz ${mecz.nr}, set ${i + 1}"
            value="${mecz.sety?.[i]?.[klucz === 'a' ? 0 : 1] ?? ''}">`).join('')}
      </div>
    </div>`;

  return `<section class="karta karta-mecz ${r.rozegrany ? 'rozegrany' : ''}" data-karta-mecz="${mecz.nr}">
    <div class="karta-tytul-rzad">
      <h2 class="karta-tytul">Mecz ${mecz.nr} ${dymek('werdykt')}</h2>
      <div class="mecz-prawa">${podpowiedzFor}
        <button class="btn-ikona" type="button" data-usun-mecz="${mecz.nr}" aria-label="Usuń mecz ${mecz.nr}">🗑</button>
      </div>
    </div>
    ${strona(mecz.a, 'a')}
    ${strona(mecz.b, 'b')}
    <div class="mecz-stopka" data-podsumowanie="${mecz.nr}">${podsumowanieMeczu(r)}</div>
  </section>`;
}

function podsumowanieMeczu(r) {
  if (!r.rozegrany) return '<span class="cichy">Wpisz wynik setów</span>';
  return `<span class="sety">sety ${r.setyA}:${r.setyB}</span>
    <span class="saldo ${klasaSalda(r.saldo)}">saldo ${zeZnakiem(r.saldo)}</span>`;
}

/* ------------------------------------------------------- podsumowanie dnia */

function kartaPodsumowania(wieczor) {
  const rek = [...rekordyWieczoru(wieczor, true).values()].filter((r) => r.mecze > 0);
  if (!rek.length) return '';
  rek.sort((a, b) => b.saldo - a.saldo);
  const mvp = mvpWieczoru(wieczor);

  return `<section class="karta karta-podsumowanie">
    ${naglowekZPomoca('Saldo wieczoru', 'saldo')}
    <ul class="lista-salda">
      ${rek.map((r) => `
        <li class="${mvp?.gracze.includes(r.id) ? 'mvp' : ''}">
          <span class="lista-imie">${bez(imie(wieczor, r.id))}${r.id === GOSC.id ? '<em class="cichy"> (poza tabelą)</em>' : ''}</span>
          <span class="lista-detal">${r.meczeW}W ${r.meczeP}P · sety ${r.setyW}:${r.setyP}</span>
          <span class="lista-saldo ${klasaSalda(r.saldo)}">${zeZnakiem(r.saldo)}</span>
        </li>`).join('')}
    </ul>
    ${mvp && !wieczor.towarzyski ? `<div class="plakietka-mvp">
      <span class="plakietka-etykieta">MVP wieczoru ${dymek('mvp')}</span>
      <strong>${mvp.gracze.map((i) => bez(imie(wieczor, i))).join(' i ')}</strong>
      <span class="saldo plus">${zeZnakiem(mvp.saldo)}</span>
    </div>` : ''}
  </section>`;
}

function kartaKoniec() {
  return `<section class="karta karta-groza">
    <p class="wskazowka">Coś poszło nie tak przy wpisywaniu? Poprawki nanosisz wprost w polach —
    nic nie jest zamrożone. ${dymek('poprawianie')}</p>
    <button class="btn btn-groza szeroki" type="button" id="usun-wieczor">Usuń cały wieczór</button>
  </section>`;
}

/* ------------------------------------------------------------- obsługa */

function podepnij(kontener, ctx) {
  const wieczor = ctx.wieczory.find((w) => w.data === wybranaData) ?? null;

  kontener.querySelector('#pole-data')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    ustawDate(e.target.value);
    ctx.odswiez();
  });

  kontener.querySelector('#pole-format')?.addEventListener('change', (e) => {
    if (wieczor) baza.zapiszWieczor(wybranaData, { format: e.target.value });
    else { szkicFormatu = e.target.value; ctx.odswiez(); }
  });

  kontener.querySelectorAll('[data-przelacz]').forEach((el) => el.addEventListener('click', () => {
    const id = el.dataset.przelacz;
    const teraz = szkicSkladu ?? GRACZE.map((g) => g.id);
    szkicSkladu = teraz.includes(id) ? teraz.filter((x) => x !== id) : [...teraz, id];
    // Gość zawsze na końcu listy — pilnuje kolejności w rotacji par.
    szkicSkladu.sort((a, b) => (a === GOSC.id ? 1 : 0) - (b === GOSC.id ? 1 : 0));
    ctx.odswiez();
  }));

  kontener.querySelector('#ustaw-mecze')?.addEventListener('click', async () => {
    const sklad = szkicSkladu ?? GRACZE.map((g) => g.id);
    const goscImie = kontener.querySelector('#pole-gosc')?.value.trim() || null;
    const przesuniecie = Math.abs(hasz(wybranaData)) % 3;
    const lista = ukladMeczow(sklad, przesuniecie);
    const mecze = Object.fromEntries(lista.map((m) => [m.nr, m]));
    await baza.zapiszWieczor(wybranaData, {
      sklad, goscImie, mecze, towarzyski: false,
      format: szkicFormatu ?? FORMAT_DOMYSLNY,
    });
    szkicSkladu = null;
    komunikat('Mecze ustawione — wpisujcie wyniki');
  });

  kontener.querySelector('#zmien-sklad')?.addEventListener('click', async () => {
    if (!await potwierdz('Zmienić skład?',
      'Mecze zostaną ustawione od nowa, a wpisane wyniki przepadną.', 'Tak, ustaw od nowa')) return;
    szkicSkladu = wieczor?.sklad ?? null;
    szkicFormatu = wieczor?.format ?? null;
    await baza.usunWieczor(wybranaData);
    ctx.odswiez();
  });

  kontener.querySelector('#pole-towarzyski')?.addEventListener('change', (e) => {
    baza.zapiszWieczor(wybranaData, { towarzyski: e.target.checked });
    komunikat(e.target.checked ? 'Ten wieczór nie liczy się do sezonu' : 'Wieczór wraca do klasyfikacji');
  });

  kontener.querySelectorAll('.set').forEach((input) => {
    input.addEventListener('input', () => podgladMeczu(kontener, wieczor, input.dataset.mecz));
    input.addEventListener('change', () => zapiszSet(wieczor, input));
  });

  kontener.querySelectorAll('[data-usun-mecz]').forEach((el) => el.addEventListener('click', async () => {
    const nr = el.dataset.usunMecz;
    if (!await potwierdz(`Usunąć mecz ${nr}?`, 'Wynik tego meczu zniknie z tabeli.')) return;
    await baza.usunMecz(wybranaData, nr);
  }));

  kontener.querySelector('#dograj-mecz')?.addEventListener('click', () => dograjMecz(wieczor));

  kontener.querySelector('#usun-wieczor')?.addEventListener('click', async () => {
    if (!await potwierdz('Usunąć cały wieczór?',
      `${poPolsku(wybranaData)} zniknie razem ze wszystkimi meczami.`)) return;
    await baza.usunWieczor(wybranaData);
    szkicSkladu = null;
    komunikat('Wieczór usunięty');
  });
}

/** Podgląd salda w trakcie pisania — bez przerysowywania całego ekranu. */
function podgladMeczu(kontener, wieczor, nr) {
  const mecz = zbudujMecz(wieczor, nr, kontener);
  const cel = kontener.querySelector(`[data-podsumowanie="${nr}"]`);
  if (cel && mecz) cel.innerHTML = podsumowanieMeczu(wynikMeczu(mecz));
}

function zbudujMecz(wieczor, nr, kontener) {
  const bazowy = wieczor?.mecze?.[nr];
  if (!bazowy) return null;
  const sety = [];
  kontener.querySelectorAll(`.set[data-mecz="${nr}"]`).forEach((el) => {
    const i = Number(el.dataset.set);
    sety[i] ??= [null, null];
    const v = el.value === '' ? null : Number(el.value);
    sety[i][el.dataset.strona === 'a' ? 0 : 1] = Number.isFinite(v) ? v : null;
  });
  return { ...bazowy, sety };
}

function zapiszSet(wieczor, input) {
  const nr = input.dataset.mecz;
  const mecz = zbudujMecz(wieczor, nr, input.closest('main') ?? document);
  if (mecz) baza.zapiszMecz(wybranaData, nr, mecz);
}

function dograjMecz(wieczor) {
  const lista = meczeZ(wieczor);
  const nr = String(Math.max(0, ...lista.map((m) => Number(m.nr))) + 1);
  const sklad = wieczor.sklad ?? [];
  const wzor = ukladMeczow(sklad, lista.length);
  const nowy = { ...(wzor[0] ?? { a: sklad.slice(0, 1), b: sklad.slice(1, 2) }), nr, sety: [] };
  baza.zapiszMecz(wybranaData, nr, nowy);
}

function hasz(tekst) {
  let h = 0;
  for (const z of tekst) h = (h * 31 + z.charCodeAt(0)) | 0;
  return h;
}
