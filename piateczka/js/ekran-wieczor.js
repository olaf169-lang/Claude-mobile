/* ==========================================================================
   Ekran „Wieczór” — jedyne miejsce, gdzie się cokolwiek wpisuje.

   Dwa stany:
   • OTWARTY — wpisujesz liczby, wynik leci do wszystkich od razu, poprawiasz
     do woli. Nic nie trzeba zatwierdzać w trakcie.
   • ZAPISANY — po naciśnięciu „Zapisz wieczór” dokument jest zamknięty
     i nic się w nim już nie zmieni. Odblokowanie wymaga kodu (patrz zamek.js).
   ========================================================================== */

import { GRACZE, gracz, imieW, czyGosc, FORMAT_DOMYSLNY, FORMATY_SZYBKIE,
  normalizujFormat, opisFormatu, krotkiFormat,
  najblizszyWtorek, poPolsku, dzisiajIso, indeksTygodnia } from './dane.js';
import { ukladMeczow, wynikMeczu, ilePolNaSety, formatMeczu, meczKompletny,
  rekordyWieczoru, mvpWieczoru, trybMeczu, TRYBY, mecze as meczeZ } from './liczenie.js';
import { dymek, naglowekZPomoca } from './pomoc.js';
import { bez, potwierdz, komunikat, zapytaj, arkusz, zamknijArkusz,
  odmianaMeczow } from './ui.js';
import { kodPasuje, skrot, ujednolic, zamkniety } from './zamek.js';
import * as baza from './baza.js';
import { pochwalSie } from './pochwal.js';

let wybranaData = null;
let szkicSkladu = null;      // skład wybierany, zanim wieczór powstanie w bazie
let szkicFormatu = null;     // format wybrany przed utworzeniem wieczoru
let szkicGosci = {};         // dopisane osoby przed utworzeniem wieczoru
let szkicTrybu = 'debel';    // deble czy single — wybierane PRZED ustawieniem meczów

export function ustawDate(data) { wybranaData = data; szkicSkladu = null; szkicGosci = {}; }

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
  const zamek = zamkniety(wieczor);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Wieczór</h1>
      <p class="podtytul">${poPolsku(wybranaData)}${zamek ? ' · 🔒 zapisany' : ''}</p>
    </div>
    ${zamek ? pasekZamka() : ''}
    ${kartaTerminu(wieczor, zamek)}
    ${wieczor ? kartyMeczow(wieczor, zamek) : kartaSkladu()}
    ${wieczor ? kartaPodsumowania(wieczor) : ''}
    ${wieczor ? kartaZapisu(wieczor, zamek) : ''}`;

  podepnij(kontener, ctx);
}

/* ------------------------------------------------------------- zamek */

function pasekZamka() {
  return `<div class="pasek-zamka">
    <span class="pasek-zamka-ikona" aria-hidden="true">🔒</span>
    <div>
      <b>Wieczór zapisany</b>
      <span>Wynik jest już policzony i nikt go przypadkiem nie ruszy.</span>
    </div>
  </div>`;
}

/* ------------------------------------------------------------- termin */

function kartaTerminu(wieczor, zamek) {
  const format = normalizujFormat(wieczor?.format ?? szkicFormatu ?? FORMAT_DOMYSLNY);
  return `<section class="karta">
    ${naglowekZPomoca('Kiedy i jak gracie', 'format')}
    <label class="pole">
      <span>Dzień gry</span>
      <input type="date" id="pole-data" value="${wybranaData}">
      <small class="pole-hint">dowolny dzień — wtorek, sobota, kiedy chcecie</small>
    </label>
    <div class="format-wybor">
      <span class="pole-etykieta">Domyślny format ${dymek('format')}</span>
      <div class="chipy">
        ${FORMATY_SZYBKIE.map((f) => `<button class="chip ${rowneFormaty(f, format) ? 'wybrany' : ''}"
          type="button" data-format="${f.setow}-${f.doIlu}" ${zamek ? 'disabled' : ''}
          aria-pressed="${rowneFormaty(f, format)}">${krotkiFormat(f)}</button>`).join('')}
        <button class="chip chip-wlasny" type="button" id="format-wlasny"
          ${zamek ? 'disabled' : ''}>✎ własny</button>
      </div>
      <p class="wskazowka">Teraz: <b>${opisFormatu(format)}</b>. Przy remisie na styku gracie
      na przewagę dwóch punktów, więc pole przyjmuje wynik wyższy niż granica seta.
      Każdy mecz może mieć swój format — zmienisz go na jego karcie.</p>
    </div>
  </section>`;
}

const rowneFormaty = (a, b) => a.setow === b.setow && a.doIlu === b.doIlu;

/* -------------------------------------------------------------- skład */

const OPISY_TRYBU = {
  debel:   { ikona: '👥', pod: 'dwóch na dwóch' },
  singiel: { ikona: '🙋', pod: 'jeden na jednego' },
};

function kartaRodzaju(iluGra) {
  return `<section class="karta karta-rodzaj">
    ${naglowekZPomoca('W co gracie?', 'tryby')}
    <div class="rodzaj-wybor">
      ${TRYBY.map((t) => `<button class="rodzaj-kafel rodzaj-${t.id} ${t.id === szkicTrybu ? 'wybrany' : ''}"
        type="button" data-rodzaj="${t.id}" aria-pressed="${t.id === szkicTrybu}">
        <span class="rodzaj-ikona" aria-hidden="true">${OPISY_TRYBU[t.id].ikona}</span>
        <b>${t.nazwa}</b>
        <em>${OPISY_TRYBU[t.id].pod}</em>
      </button>`).join('')}
    </div>
    <p class="wskazowka">${opisUkladu(iluGra, szkicTrybu)}</p>
    <p class="wskazowka cichy">Drugi rodzaj dorzucisz w każdej chwili przyciskiem
    „Dograj mecz” — po deblach można jeszcze zagrać szybkiego singielka.</p>
  </section>`;
}

function kartaSkladu() {
  const wybrani = szkicSkladu ?? GRACZE.map((g) => g.id);
  const udawany = { goscie: szkicGosci };
  return kartaRodzaju(wybrani.length) + `<section class="karta">
    ${naglowekZPomoca('Kto przyszedł?', 'sklady')}
    <div class="chipy">
      ${GRACZE.map((g) => `
        <button class="chip ${wybrani.includes(g.id) ? 'wybrany' : ''}" type="button"
          data-przelacz="${g.id}" aria-pressed="${wybrani.includes(g.id)}">${g.imie}</button>`).join('')}
      ${Object.keys(szkicGosci).map((id) => `
        <button class="chip chip-gosc ${wybrani.includes(id) ? 'wybrany' : ''}" type="button"
          data-przelacz="${id}" aria-pressed="${wybrani.includes(id)}">${bez(imieW(udawany, id))}</button>`).join('')}
      <button class="chip chip-dopisz" type="button" id="dopisz-osobe">+ dopisz osobę ${dymek('gosc')}</button>
    </div>
    <button class="btn btn-glowny szeroki" type="button" id="ustaw-mecze"
      ${wybrani.length < 2 ? 'disabled' : ''}>${etykietaUstaw(wybrani.length)}</button>
  </section>`;
}

function etykietaUstaw(ilu) {
  if (ilu < 2) return 'Ustaw mecze';
  const n = ileMeczow(ilu, szkicTrybu);
  return `Ustaw ${n} ${odmianaMeczow(n)}`;
}

function ileMeczow(ilu, tryb) {
  return ukladMeczow(Array.from({ length: ilu }, (_, i) => i), 0, FORMAT_DOMYSLNY, tryb).length;
}

function opisUkladu(ilu, tryb) {
  if (ilu < 2) return 'Zaznacz przynajmniej dwie osoby.';
  const n = ileMeczow(ilu, tryb);
  if (tryb === 'debel' && ilu >= 4) {
    return `${ilu} grających → ${n} deble, pełna rotacja: każdy zagra w parze z każdym i dwa razy przeciw.`;
  }
  if (tryb === 'debel') {
    return `Na debla trzeba czterech — przy ${ilu} appka ułoży ${n} single, każdy z każdym.`;
  }
  if (ilu === 2) return 'Dwóch grających → jeden singiel. Kolejne dorzucisz przyciskiem na dole.';
  return `${ilu} grających → ${n} singli, każdy z każdym. W każdej rundzie gracie po jednym meczu.`;
}

/* -------------------------------------------------------------- mecze */

function kartyMeczow(wieczor, zamek) {
  const lista = meczeZ(wieczor);
  const sklad = wieczor.sklad ?? [];

  const naglowek = `<section class="karta karta-skladu">
    <div class="karta-tytul-rzad">
      <h2 class="karta-tytul">Skład ${dymek('rotacja')}</h2>
      ${zamek ? '' : '<button class="btn btn-maly" type="button" id="zmien-sklad">Zmień</button>'}
    </div>
    <div class="skladzik">${sklad.map((id) => `<span class="tag">${bez(imieW(wieczor, id))}</span>`).join('')}</div>
    <label class="przelacznik">
      <input type="checkbox" id="pole-towarzyski" ${wieczor.towarzyski ? 'checked' : ''}
        ${zamek ? 'disabled' : ''}>
      <span>Wieczór towarzyski — nie liczy się do sezonu ${dymek('towarzyski')}</span>
    </label>
  </section>`;

  return naglowek + lista.map((m) => kartaMeczu(m, wieczor, zamek)).join('')
    + (zamek ? '' : `<button class="btn szeroki btn-obrys" type="button" id="dograj-mecz">+ Dograj mecz</button>`);
}

function kartaMeczu(mecz, wieczor, zamek) {
  const r = wynikMeczu(mecz);
  const format = formatMeczu(mecz, wieczor);
  const pol = ilePolNaSety(format, mecz);
  const tryb = trybMeczu(mecz);

  const strona = (ids, klucz) => {
    const wygral = r.rozegrany && r.werdykt === klucz;
    return `
    <div class="mecz-strona ${wygral ? 'wygrala' : ''}">
      <div class="mecz-para">${ids.map((i) => `<span>${bez(imieW(wieczor, i))}</span>`).join('<i>+</i>')}
        ${wygral ? '<b class="mecz-ptaszek" aria-label="wygrana">✓</b>' : ''}</div>
      <div class="mecz-sety">
        ${Array.from({ length: pol }, (_, i) => `
          <input class="set" type="number" inputmode="numeric" min="0" max="99"
            id="set-${mecz.nr}-${i}-${klucz}" data-mecz="${mecz.nr}" data-set="${i}" data-strona="${klucz}"
            aria-label="Mecz ${mecz.nr}, set ${i + 1}" ${zamek ? 'disabled' : ''}
            value="${mecz.sety?.[i]?.[klucz === 'a' ? 0 : 1] ?? ''}">`).join('')}
      </div>
    </div>`;
  };

  return `<section class="karta karta-mecz karta-${tryb} ${r.rozegrany ? 'rozegrany' : ''}" data-karta-mecz="${mecz.nr}">
    <div class="karta-tytul-rzad">
      <h2 class="karta-tytul">Mecz ${mecz.nr}
        <span class="znacznik-trybu znacznik-${tryb}">${tryb === 'singiel' ? 'singiel' : 'debel'}</span>
        ${dymek('werdykt')}</h2>
      <div class="mecz-prawa">
        <button class="btn-format" type="button" data-format-meczu="${mecz.nr}"
          ${zamek ? 'disabled' : ''} title="Format tego meczu">${krotkiFormat(format)}</button>
        ${zamek ? '' : `<button class="btn-ikona" type="button" data-usun-mecz="${mecz.nr}"
          aria-label="Usuń mecz ${mecz.nr}">🗑</button>`}
      </div>
    </div>
    ${strona(mecz.a, 'a')}
    ${strona(mecz.b, 'b')}
    <div class="mecz-stopka" data-podsumowanie="${mecz.nr}">${podsumowanieMeczu(r, mecz, wieczor)}</div>
  </section>`;
}

function podsumowanieMeczu(r, mecz, wieczor) {
  if (!r.rozegrany) return '<span class="cichy">Wpisz wynik setów</span>';
  const komplet = meczKompletny(mecz, wieczor);
  return `<span class="sety">sety ${r.setyA}:${r.setyB}</span>
    <span class="punkciki">punkty ${r.pktA}:${r.pktB}</span>
    ${komplet
      ? '<span class="znak-ok">✓ policzony</span>'
      : '<span class="znak-toku">w toku</span>'}`;
}

/* ------------------------------------------------------- podsumowanie dnia */

function kartaPodsumowania(wieczor) {
  const rek = [...rekordyWieczoru(wieczor, { wszyscy: true }).values()].filter((r) => r.mecze > 0);
  if (!rek.length) return '';
  rek.sort((a, b) => b.meczeW - a.meczeW || b.setyW - a.setyW || b.zdobyte - a.zdobyte);
  const mvp = mvpWieczoru(wieczor);

  return `<section class="karta karta-podsumowanie">
    ${naglowekZPomoca('Wynik wieczoru', 'punktacja')}
    <ul class="lista-wynikow">
      ${rek.map((r) => `
        <li class="${mvp?.gracze.includes(r.id) ? 'mvp' : ''}">
          <span class="lista-imie">${bez(imieW(wieczor, r.id))}${czyGosc(r.id) ? '<em class="cichy"> (poza tabelą)</em>' : ''}</span>
          <span class="lista-detal">sety ${r.setyW}:${r.setyP} · ${r.zdobyte} pkt</span>
          <span class="lista-wygrane"><b>${r.meczeW}</b><em>W</em></span>
        </li>`).join('')}
    </ul>
    ${mvp && !wieczor.towarzyski ? `<div class="plakietka-mvp">
      <span class="plakietka-etykieta">MVP wieczoru ${dymek('mvp')}</span>
      <strong>${mvp.gracze.map((i) => bez(imieW(wieczor, i))).join(' i ')}</strong>
      <span class="mvp-liczba">${mvp.wygrane} W</span>
    </div>` : ''}
    <button class="btn btn-obrys szeroki" type="button" id="pochwal-sie" style="margin-top:12px">
      📣 Pochwal się na grupie</button>
  </section>`;
}

/* ------------------------------------------------------------ zapis */

function kartaZapisu(wieczor, zamek) {
  const lista = meczeZ(wieczor);
  const rozegrane = lista.filter((m) => wynikMeczu(m).rozegrany);
  const niedokonczone = rozegrane.filter((m) => !meczKompletny(m, wieczor));

  if (zamek) {
    return `<section class="karta karta-zapis zapisany">
      ${naglowekZPomoca('Zapisany na klucz', 'zamykanie')}
      <p class="wskazowka">Ten wieczór jest policzony i zamknięty. Żeby cokolwiek w nim poprawić,
      potrzebny jest kod od Pana Piąteczki — napisz na grupie, o co chodzi, i poproś o odblokowanie.</p>
      <button class="btn btn-obrys szeroki" type="button" id="odblokuj">🔑 Mam kod — odblokuj edycję</button>
    </section>`;
  }

  return `<section class="karta karta-zapis">
    ${naglowekZPomoca('Koniec grania?', 'zamykanie')}
    ${rozegrane.length === 0
      ? '<p class="wskazowka">Wpiszcie choć jeden wynik, a pojawi się przycisk zapisu.</p>'
      : `${niedokonczone.length ? `<p class="wskazowka ostrzezenie-tekst">
          ${niedokonczone.length === 1 ? 'Jeden mecz nie jest jeszcze dograny' : `${niedokonczone.length} mecze nie są jeszcze dograne`}
          do końca formatu. Możesz zapisać mimo to — wynik policzy się z tego, co jest.</p>` : ''}
        <button class="btn btn-glowny szeroki" type="button" id="zapisz-wieczor">
          ✅ Zapisz wieczór (${rozegrane.length} ${odmianaMeczow(rozegrane.length)})</button>
        <p class="wskazowka">Po zapisaniu wieczór się zamyka: wynik jest policzony i nikt go już
        przypadkiem nie ruszy. Odblokowanie wymaga kodu.</p>`}
    <button class="btn btn-groza szeroki" type="button" id="usun-wieczor"
      style="margin-top:14px">Usuń cały wieczór</button>
  </section>`;
}

/* ------------------------------------------------------------- obsługa */

function podepnij(kontener, ctx) {
  const wieczor = ctx.wieczory.find((w) => w.data === wybranaData) ?? null;
  const zamek = zamkniety(wieczor);

  kontener.querySelector('#pole-data')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    ustawDate(e.target.value);
    ctx.odswiez();
  });

  kontener.querySelectorAll('[data-format]').forEach((el) => el.addEventListener('click', () => {
    const [setow, doIlu] = el.dataset.format.split('-').map(Number);
    ustawFormatWieczoru(wieczor, { setow, doIlu }, ctx);
  }));

  kontener.querySelector('#format-wlasny')?.addEventListener('click', async () => {
    const teraz = normalizujFormat(wieczor?.format ?? szkicFormatu ?? FORMAT_DOMYSLNY);
    const nowy = await wybierzFormat(teraz);
    if (nowy) ustawFormatWieczoru(wieczor, nowy, ctx);
  });

  kontener.querySelectorAll('[data-rodzaj]').forEach((el) => el.addEventListener('click', () => {
    szkicTrybu = el.dataset.rodzaj;
    ctx.odswiez();
  }));

  kontener.querySelectorAll('[data-przelacz]').forEach((el) => el.addEventListener('click', () => {
    const id = el.dataset.przelacz;
    const teraz = szkicSkladu ?? GRACZE.map((g) => g.id);
    szkicSkladu = teraz.includes(id) ? teraz.filter((x) => x !== id) : [...teraz, id];
    // Dopisane osoby zawsze na końcu — pilnuje kolejności w rotacji par.
    szkicSkladu.sort((a, b) => (czyGosc(a) ? 1 : 0) - (czyGosc(b) ? 1 : 0));
    ctx.odswiez();
  }));

  kontener.querySelector('#dopisz-osobe')?.addEventListener('click', async () => {
    const imie = await zapytaj({
      tytul: 'Kto jeszcze gra?',
      opis: 'Osoba spoza czwórki gra normalnie i ma swój wynik wieczoru, ale nie wchodzi do tabeli sezonu ani do ELO.',
      etykieta: 'Imię', placeholder: 'np. Michał', ok: 'Dopisz',
    });
    if (!imie) return;
    const id = wolneIdGoscia({ ...(wieczor ?? {}), goscie: { ...szkicGosci, ...(wieczor?.goscie ?? {}) } });
    szkicGosci = { ...szkicGosci, [id]: imie };
    const teraz = szkicSkladu ?? GRACZE.map((g) => g.id);
    szkicSkladu = [...teraz, id];
    ctx.odswiez();
  });

  kontener.querySelector('#ustaw-mecze')?.addEventListener('click', async () => {
    const sklad = szkicSkladu ?? GRACZE.map((g) => g.id);
    const format = normalizujFormat(szkicFormatu ?? FORMAT_DOMYSLNY);
    // Kolejność meczów rotuje co tydzień: 0→1→2→0… — sąsiednie wtorki się różnią.
    const przesuniecie = ((indeksTygodnia(wybranaData) % 3) + 3) % 3;
    const lista = ukladMeczow(sklad, przesuniecie, format, szkicTrybu);
    const mecze = Object.fromEntries(lista.map((m) => [m.nr, m]));
    await baza.zapiszWieczor(wybranaData, {
      sklad, mecze, towarzyski: false, zamkniety: false,
      goscie: szkicGosci, format,
    });
    szkicSkladu = null;
    szkicGosci = {};
    komunikat('Mecze ustawione — wpisujcie wyniki');
  });

  kontener.querySelector('#zmien-sklad')?.addEventListener('click', async () => {
    if (!await potwierdz('Zmienić skład?',
      'Mecze zostaną ustawione od nowa, a wpisane wyniki przepadną.', 'Tak, ustaw od nowa')) return;
    szkicSkladu = wieczor?.sklad ?? null;
    szkicFormatu = wieczor?.format ?? null;
    szkicGosci = wieczor?.goscie ?? {};
    await baza.usunWieczor(wybranaData);
    ctx.odswiez();
  });

  kontener.querySelector('#pole-towarzyski')?.addEventListener('change', (e) => {
    baza.zapiszWieczor(wybranaData, { towarzyski: e.target.checked });
    komunikat(e.target.checked ? 'Ten wieczór nie liczy się do sezonu' : 'Wieczór wraca do klasyfikacji');
  });

  if (!zamek) {
    kontener.querySelectorAll('.set').forEach((input) => {
      input.addEventListener('input', () => podgladMeczu(kontener, wieczor, input.dataset.mecz));
      input.addEventListener('change', () => zapiszSet(wieczor, input));
    });
  }

  kontener.querySelectorAll('[data-format-meczu]').forEach((el) => el.addEventListener('click', async () => {
    const nr = el.dataset.formatMeczu;
    const mecz = wieczor?.mecze?.[nr];
    if (!mecz) return;
    const nowy = await wybierzFormat(formatMeczu(mecz, wieczor));
    if (nowy) await baza.zapiszMecz(wybranaData, nr, { ...mecz, format: nowy });
  }));

  kontener.querySelectorAll('[data-usun-mecz]').forEach((el) => el.addEventListener('click', async () => {
    const nr = el.dataset.usunMecz;
    if (!await potwierdz(`Usunąć mecz ${nr}?`, 'Wynik tego meczu zniknie z tabeli.')) return;
    await baza.usunMecz(wybranaData, nr);
  }));

  kontener.querySelector('#dograj-mecz')?.addEventListener('click', () => dograjMecz(wieczor, ctx));

  kontener.querySelector('#pochwal-sie')?.addEventListener('click', () => {
    const w = ctx.wieczory.find((x) => x.data === wybranaData);
    if (w) pochwalSie(w);
  });

  kontener.querySelector('#zapisz-wieczor')?.addEventListener('click', async () => {
    if (!await potwierdz('Zapisać i zamknąć wieczór?',
      'Wynik zostanie policzony, a wieczór zamknięty. Późniejsza poprawka wymaga kodu.',
      'Tak, zapisz')) return;
    await baza.zamknijWieczor(wybranaData);
    komunikat('✅ Zapisane — wieczór policzony i zamknięty');
  });

  kontener.querySelector('#odblokuj')?.addEventListener('click', async () => {
    const kod = await zapytaj({
      tytul: 'Kod odblokowania',
      opis: 'Kod ma tylko Pan Piąteczka. Napisz na grupie, co trzeba poprawić, i poproś o niego.',
      etykieta: 'Kod', placeholder: '••••••••', ok: 'Odblokuj',
    });
    if (!kod) return;
    if (!await kodPasuje(kod)) { komunikat('Kod się nie zgadza', 'blad'); return; }
    await baza.odblokujWieczor(wybranaData, await skrot(ujednolic(kod)));
    komunikat('🔓 Wieczór otwarty — poprawiaj i zapisz na nowo');
  });

  kontener.querySelector('#usun-wieczor')?.addEventListener('click', async () => {
    if (!await potwierdz('Usunąć cały wieczór?',
      `${poPolsku(wybranaData)} zniknie razem ze wszystkimi meczami.`)) return;
    await baza.usunWieczor(wybranaData);
    szkicSkladu = null;
    komunikat('Wieczór usunięty');
  });
}

function ustawFormatWieczoru(wieczor, format, ctx) {
  if (wieczor) baza.zapiszWieczor(wybranaData, { format });
  else { szkicFormatu = format; ctx.odswiez(); }
}

function wolneIdGoscia(wieczor) {
  const zajete = new Set(Object.keys(wieczor?.goscie ?? {}));
  for (let i = 1; i < 20; i += 1) if (!zajete.has(`gosc${i}`)) return `gosc${i}`;
  return `gosc${Date.now()}`;
}

/** Podgląd wyniku w trakcie pisania — bez przerysowywania całego ekranu. */
function podgladMeczu(kontener, wieczor, nr) {
  const mecz = zbudujMecz(wieczor, nr, kontener);
  const cel = kontener.querySelector(`[data-podsumowanie="${nr}"]`);
  if (cel && mecz) cel.innerHTML = podsumowanieMeczu(wynikMeczu(mecz), mecz, wieczor);
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

/* ------------------------------------------------- arkusz: format meczu */

function wybierzFormat(teraz) {
  return new Promise((gotowe) => {
    const { el } = arkusz({
      tytul: 'Format meczu',
      tresc: `
        <p>Do ilu wygranych setów gracie i do ilu punktów jest set. Przy remisie na styku
        i tak gra się na przewagę dwóch punktów.</p>
        <div class="chipy chipy-format">
          ${FORMATY_SZYBKIE.map((f) => `<button class="chip ${rowneFormaty(f, teraz) ? 'wybrany' : ''}"
            type="button" data-szybki="${f.setow}-${f.doIlu}">${krotkiFormat(f)}</button>`).join('')}
        </div>
        <div class="pola-obok" style="margin-top:12px">
          <label class="pole">
            <span>Wygranych setów</span>
            <select id="f-setow">
              <option value="1" ${teraz.setow === 1 ? 'selected' : ''}>1 set</option>
              <option value="2" ${teraz.setow === 2 ? 'selected' : ''}>2 wygrane sety</option>
            </select>
          </label>
          <label class="pole">
            <span>Set do ilu punktów</span>
            <input type="number" id="f-doilu" min="3" max="99" inputmode="numeric" value="${teraz.doIlu}">
          </label>
        </div>`,
      stopka: '<button class="btn btn-glowny" type="button" data-zastosuj>Ustaw format</button>',
    });
    // Domyślny przycisk „Rozumiem” jest tu zbędny — zostaje „Ustaw format”.
    el.querySelector('[data-zamknij]')?.remove();

    el.querySelectorAll('[data-szybki]').forEach((b) => b.addEventListener('click', () => {
      const [setow, doIlu] = b.dataset.szybki.split('-').map(Number);
      zamknijArkusz();
      gotowe({ setow, doIlu });
    }));
    el.querySelector('[data-zastosuj]')?.addEventListener('click', () => {
      const setow = Number(el.querySelector('#f-setow').value);
      const doIlu = Number(el.querySelector('#f-doilu').value);
      zamknijArkusz();
      gotowe(normalizujFormat({ setow, doIlu }));
    });
    el.addEventListener('click', (e) => { if (e.target === el) gotowe(null); });
  });
}

/* ------------------------------------------------- arkusz: dograj mecz */

function dograjMecz(wieczor, ctx) {
  const sklad = wieczor.sklad ?? [];
  const lista = meczeZ(wieczor);
  const nr = String(Math.max(0, ...lista.map((m) => Number(m.nr))) + 1);
  let strony = { a: [], b: [] };
  let format = normalizujFormat(wieczor.format ?? FORMAT_DOMYSLNY);

  const { el } = arkusz({
    tytul: `Mecz ${nr}`,
    tresc: `
      <p>Dotknij imienia, żeby wstawić je do strony <b>lewej</b>, potem <b>prawej</b>.
      Jeden na jednego to singiel, dwóch na dwóch — debel.</p>
      <div data-obsada></div>
      <p class="wskazowka" data-podglad></p>
      <div class="chipy chipy-format" style="margin-top:6px">
        ${FORMATY_SZYBKIE.map((f) => `<button class="chip ${rowneFormaty(f, format) ? 'wybrany' : ''}"
          type="button" data-szybki="${f.setow}-${f.doIlu}">${krotkiFormat(f)}</button>`).join('')}
      </div>`,
    stopka: '<button class="btn btn-glowny" type="button" data-dodaj disabled>Dodaj mecz</button>',
  });
  el.querySelector('[data-zamknij]')?.remove();

  const obsada = el.querySelector('[data-obsada]');
  const podglad = el.querySelector('[data-podglad]');
  const przycisk = el.querySelector('[data-dodaj]');

  const gdzie = (id) => (strony.a.includes(id) ? 'a' : strony.b.includes(id) ? 'b' : null);

  function rysuj() {
    obsada.innerHTML = `<div class="chipy">
      ${sklad.map((id) => {
        const s = gdzie(id);
        return `<button class="chip ${s ? `strona-${s}` : ''}" type="button" data-kto="${id}">
          ${s ? `<i class="chip-strona">${s === 'a' ? 'L' : 'P'}</i>` : ''}${bez(imieW(wieczor, id))}</button>`;
      }).join('')}
    </div>`;
    obsada.querySelectorAll('[data-kto]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.kto;
      const przypisany = gdzie(id) !== null;
      strony = { a: strony.a.filter((x) => x !== id), b: strony.b.filter((x) => x !== id) };
      // Dotknięcie wolnej osoby dorzuca ją do słabiej obsadzonej strony, więc
      // klikając po kolei dostajesz najpierw 1 na 1, a potem 2 na 2. Dotknięcie
      // kogoś już przypisanego po prostu go wypisuje.
      if (!przypisany) {
        if (strony.a.length <= strony.b.length && strony.a.length < 2) strony.a.push(id);
        else if (strony.b.length < 2) strony.b.push(id);
      }
      rysuj();
    }));

    const ok = strony.a.length >= 1 && strony.b.length >= 1
      && strony.a.length === strony.b.length;
    przycisk.disabled = !ok;
    podglad.innerHTML = ok
      ? `<b>${strony.a.length === 1 ? 'Singiel' : 'Debel'}</b> · ${opisFormatu(format)}`
      : 'Wybierz tyle samo osób po obu stronach.';
  }
  rysuj();

  el.querySelectorAll('[data-szybki]').forEach((b) => b.addEventListener('click', () => {
    const [setow, doIlu] = b.dataset.szybki.split('-').map(Number);
    format = { setow, doIlu };
    el.querySelectorAll('[data-szybki]').forEach((x) => x.classList.toggle('wybrany', x === b));
    rysuj();
  }));

  przycisk.addEventListener('click', async () => {
    zamknijArkusz();
    await baza.zapiszMecz(wybranaData, nr, { nr, a: strony.a, b: strony.b, sety: [], format });
    komunikat(`Mecz ${nr} dodany`);
    ctx.odswiez();
  });
}
