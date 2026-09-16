/* ==========================================================================
   Ekran „Sędzia” — zliczanie zagrań w jednym meczu.

   Trzy drogi wejścia, wszystkie kończą się tą samą listą `mecz.zagrania`:
   • klikanie na żywo: wybierasz gracza, klikasz zdarzenie,
   • dyktowanie w apce (rozpoznawanie mowy przeglądarki — Android/Chrome),
   • wklejenie gotowej transkrypcji.

   Przy tekście NIC nie zapisuje się od razu: najpierw pokazujemy, co appka
   zrozumiała, i dopiero po zatwierdzeniu leci do bazy. Parser jest dobry,
   ale nie jest nieomylny, a cicha pomyłka byłaby gorsza niż brak funkcji.
   ========================================================================== */

import { imieW, poPolsku } from './dane.js';
import { wynikMeczu, formatMeczu, trybMeczu, mecze as meczeZ } from './liczenie.js';
import { ZDARZENIA, zdarzenie, zagrania, bilansZagran, parsujTranskrypcje,
  skutecznosc } from './sedzia.js';
import { zamkniety } from './zamek.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { bez, komunikat, potwierdz } from './ui.js';
import * as baza from './baza.js';

let cel = null;             // { data, nr } — który mecz sędziujemy
let wybrany = null;         // podświetlony gracz
let szkicTekstu = '';       // treść pola transkrypcji, przeżywa przerysowania
let podglad = null;         // wynik parsowania czekający na zatwierdzenie
let sluchanie = false;      // czy trwa dyktowanie
let rozpoznawacz = null;

export function ustawMecz(data, nr) {
  cel = { data, nr: String(nr) };
  wybrany = null;
  szkicTekstu = '';
  podglad = null;
}

const mowaDostepna = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export function render(kontener, ctx) {
  const wieczor = cel ? ctx.wieczory.find((w) => w.data === cel.data) : null;
  const mecz = wieczor?.mecze?.[cel?.nr] ?? null;

  if (!mecz) {
    kontener.innerHTML = `
      <div class="ekran-naglowek"><h1>Sędzia</h1></div>
      <section class="karta">
        <p class="pusto">Nie widzę tego meczu. Wejdź na ekran <a href="#/wieczor">Wieczór</a>
        i wybierz mecz przyciskiem „Sędziuj”.</p>
      </section>`;
    return;
  }

  const zamek = zamkniety(wieczor);
  const lista = zagrania(mecz);
  const r = wynikMeczu(mecz);
  const strony = [...mecz.a, ...mecz.b];
  const bil = bilansZagran([mecz]);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Sędzia</h1>
      <p class="podtytul">${poPolsku(cel.data)} · mecz ${bez(cel.nr)} ·
        ${trybMeczu(mecz) === 'singiel' ? 'singiel' : 'debel'}</p>
    </div>

    <section class="karta karta-mecz karta-${trybMeczu(mecz)}">
      <div class="sedzia-mecz">
        <span>${mecz.a.map((i) => bez(imieW(wieczor, i))).join(' + ')}</span>
        <b>${r.rozegrany ? `${r.setyA}:${r.setyB}` : 'vs'}</b>
        <span>${mecz.b.map((i) => bez(imieW(wieczor, i))).join(' + ')}</span>
      </div>
      <p class="wskazowka">Format: ${formatMeczu(mecz, wieczor).setow === 1 ? '1 set' : 'do 2 wygranych setów'}
      do ${formatMeczu(mecz, wieczor).doIlu}. Zsędziowanych zagrań: <b>${lista.length}</b>.</p>
    </section>

    ${zamek ? `<div class="pasek-zamka">
      <span class="pasek-zamka-ikona" aria-hidden="true">🔒</span>
      <div><b>Wieczór zapisany</b><span>Zagrań już nie dopiszesz — najpierw odblokuj wieczór kodem.</span></div>
    </div>` : klikanie(wieczor, strony) + tekstowanie(wieczor)}

    ${kartaBilansu(wieczor, strony, bil)}
    ${kartaHistorii(wieczor, lista, zamek)}

    <a class="btn btn-obrys szeroki" href="#/wieczor">← Wróć do wieczoru</a>`;

  podepnij(kontener, ctx, wieczor, mecz, strony);
}

/* ------------------------------------------------------ klikanie na żywo */

function klikanie(wieczor, strony) {
  const kto = strony.includes(wybrany) ? wybrany : null;
  return `<section class="karta">
    ${naglowekZPomoca('Kto zagrał?', 'sedzia')}
    <div class="chipy chipy-sedzia">
      ${strony.map((id) => `<button class="chip chip-duzy ${id === kto ? 'wybrany' : ''}" type="button"
        data-kto="${id}" aria-pressed="${id === kto}">${bez(imieW(wieczor, id))}</button>`).join('')}
    </div>
    <div class="sedzia-przyciski" ${kto ? '' : 'data-nieaktywne'}>
      ${ZDARZENIA.map((z) => `<button class="sedzia-klawisz ${z.dobre ? 'dobry' : 'zly'}" type="button"
        data-zdarzenie="${z.id}" ${kto ? '' : 'disabled'} title="${bez(z.opis)}">
        <span aria-hidden="true">${z.ikona}</span><b>${z.nazwa}</b></button>`).join('')}
    </div>
    <p class="wskazowka">${kto
      ? `Klikasz zdarzenie — dopisuje się do <b>${bez(imieW(wieczor, kto))}</b>. Gracz zostaje wybrany, więc serię akcji jednej osoby klikasz jednym palcem.`
      : 'Najpierw dotknij gracza, potem zdarzenie.'}</p>
  </section>`;
}

/* -------------------------------------------------- dyktowanie i wklejanie */

function tekstowanie(wieczor) {
  return `<section class="karta">
    ${naglowekZPomoca('Z transkrypcji', 'transkrypcja')}
    <p class="wskazowka">Wklej tekst albo podyktuj mikrofonem z klawiatury. Mów zwyczajnie:
    <i>„Tomek serwis w aut. Przy moim serwisie winner. Błąd Jacka.”</i></p>
    <textarea id="pole-transkrypcja" class="pole-tekst" rows="4"
      placeholder="Tomek serwis w aut. Winner Kafaara. Piąteczka w siatkę…">${bez(szkicTekstu)}</textarea>
    <div class="sedzia-akcje">
      ${mowaDostepna() ? `<button class="btn ${sluchanie ? 'btn-groza' : 'btn-obrys'}" type="button" id="dyktuj">
        ${sluchanie ? '⏹ Zatrzymaj' : '🎤 Dyktuj'}</button>` : ''}
      <button class="btn btn-glowny" type="button" id="rozpoznaj">Rozpoznaj</button>
    </div>
    ${mowaDostepna() ? '' : `<p class="pomoc-nota">Ta przeglądarka nie ma rozpoznawania mowy —
      użyj mikrofonu na klawiaturze telefonu, wychodzi na to samo.</p>`}
    ${podglad ? kartaPodgladu(wieczor) : ''}
  </section>`;
}

function kartaPodgladu(wieczor) {
  const { zdarzenia, nierozumiane } = podglad;
  return `<div class="podglad-parsera">
    <h3 class="podglad-tytul">Zrozumiałem ${zdarzenia.length}
      ${zdarzenia.length === 1 ? 'zagranie' : 'zagrań'}</h3>
    ${zdarzenia.length ? `<ul class="lista-zagran">
      ${zdarzenia.map((z, i) => {
        const def = zdarzenie(z.k);
        return `<li class="${def.dobre ? 'dobre' : 'zle'}">
          <span class="zagranie-ikona" aria-hidden="true">${def.ikona}</span>
          <span class="zagranie-tresc"><b>${bez(imieW(wieczor, z.kto))} — ${def.nazwa}</b>
            <em>„${bez(z.tekst)}”</em></span>
          <button class="btn-ikona" type="button" data-usun-podglad="${i}" aria-label="Wyrzuć">✕</button>
        </li>`;
      }).join('')}
    </ul>` : '<p class="pusto">Nic nie rozpoznałem.</p>'}
    ${nierozumiane.length ? `<p class="pomoc-nota"><b>Pominięte (${nierozumiane.length}):</b>
      ${nierozumiane.map((n) => `„${bez(n.tekst)}” — ${n.czemu}`).join('; ')}</p>` : ''}
    ${zdarzenia.length ? `<button class="btn btn-glowny szeroki" type="button" id="zatwierdz-podglad">
      ✓ Dopisz ${zdarzenia.length} do meczu</button>` : ''}
  </div>`;
}

/* --------------------------------------------------------------- bilans */

function kartaBilansu(wieczor, strony, bil) {
  const cokolwiek = strony.some((id) => (bil.get(id)?.razem ?? 0) > 0);
  if (!cokolwiek) return '';
  return `<section class="karta">
    ${naglowekZPomoca('Bilans meczu', 'sedzia')}
    <div class="tabela-zagran-otoczka">
      <table class="tabela-zagran">
        <thead><tr><th>Gracz</th>
          ${ZDARZENIA.map((z) => `<th title="${bez(z.nazwa)}">${z.krotko}</th>`).join('')}
          <th>%</th></tr></thead>
        <tbody>
          ${strony.map((id) => {
            const b = bil.get(id);
            const s = skutecznosc(b);
            return `<tr><th>${bez(imieW(wieczor, id))}</th>
              ${ZDARZENIA.map((z) => `<td class="${b && b[z.id] ? (z.dobre ? 'plus' : 'minus') : 'cichy'}">${b?.[z.id] ?? 0}</td>`).join('')}
              <td><b>${s ? `${s.procent}%` : '—'}</b></td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="wskazowka">% to udział zagrań wygrywających (winner, as) we wszystkim, co zapisaliście.</p>
  </section>`;
}

function kartaHistorii(wieczor, lista, zamek) {
  if (!lista.length) return '';
  const ostatnie = lista.slice(-12).reverse();
  return `<section class="karta">
    <div class="karta-tytul-rzad">
      <h2 class="karta-tytul">Ostatnie zagrania</h2>
      ${zamek ? '' : '<button class="btn btn-maly" type="button" id="cofnij">↶ Cofnij</button>'}
    </div>
    <ul class="lista-zagran">
      ${ostatnie.map((z, i) => {
        const def = zdarzenie(z.k);
        if (!def) return '';
        const nr = lista.length - 1 - i;
        return `<li class="${def.dobre ? 'dobre' : 'zle'}">
          <span class="zagranie-ikona" aria-hidden="true">${def.ikona}</span>
          <span class="zagranie-tresc"><b>${bez(imieW(wieczor, z.kto))} — ${def.nazwa}</b></span>
          ${zamek ? '' : `<button class="btn-ikona" type="button" data-usun-zagranie="${nr}"
            aria-label="Usuń zagranie">🗑</button>`}
        </li>`;
      }).join('')}
    </ul>
    ${lista.length > 12 ? `<p class="pomoc-nota">Pokazuję dwanaście ostatnich z ${lista.length}.</p>` : ''}
    ${zamek ? '' : '<button class="btn btn-groza szeroki" type="button" id="wyczysc">Wyczyść wszystkie zagrania</button>'}
  </section>`;
}

/* ------------------------------------------------------------- obsługa */

async function zapisz(wieczor, mecz, nowaLista) {
  await baza.zapiszMecz(cel.data, cel.nr, { ...mecz, zagrania: nowaLista });
}

function podepnij(kontener, ctx, wieczor, mecz, strony) {
  kontener.querySelectorAll('[data-kto]').forEach((el) => el.addEventListener('click', () => {
    wybrany = wybrany === el.dataset.kto ? null : el.dataset.kto;
    ctx.odswiez();
  }));

  kontener.querySelectorAll('[data-zdarzenie]').forEach((el) => el.addEventListener('click', async () => {
    if (!strony.includes(wybrany)) return;
    const k = el.dataset.zdarzenie;
    await zapisz(wieczor, mecz, [...zagrania(mecz), { k, kto: wybrany }]);
    komunikat(`${zdarzenie(k).ikona} ${imieW(wieczor, wybrany)} — ${zdarzenie(k).nazwa}`);
  }));

  kontener.querySelector('#cofnij')?.addEventListener('click', async () => {
    const lista = zagrania(mecz);
    if (!lista.length) return;
    await zapisz(wieczor, mecz, lista.slice(0, -1));
    komunikat('Cofnięte');
  });

  kontener.querySelectorAll('[data-usun-zagranie]').forEach((el) => el.addEventListener('click', async () => {
    const nr = Number(el.dataset.usunZagranie);
    await zapisz(wieczor, mecz, zagrania(mecz).filter((_, i) => i !== nr));
  }));

  kontener.querySelector('#wyczysc')?.addEventListener('click', async () => {
    if (!await potwierdz('Wyczyścić zagrania?',
      'Zniknie cała lista zsędziowanych zagrań tego meczu. Wynik setów zostaje.')) return;
    await zapisz(wieczor, mecz, []);
    komunikat('Wyczyszczone');
  });

  const pole = kontener.querySelector('#pole-transkrypcja');
  pole?.addEventListener('input', () => { szkicTekstu = pole.value; });

  kontener.querySelector('#rozpoznaj')?.addEventListener('click', () => {
    const tekst = pole?.value ?? '';
    if (!tekst.trim()) { komunikat('Najpierw wklej albo podyktuj tekst'); return; }
    szkicTekstu = tekst;
    podglad = parsujTranskrypcje(tekst, { sklad: strony, wieczor, ja: ctx.ja });
    ctx.odswiez();
  });

  kontener.querySelectorAll('[data-usunPodglad], [data-usun-podglad]').forEach((el) =>
    el.addEventListener('click', () => {
      const i = Number(el.dataset.usunPodglad);
      podglad = { ...podglad, zdarzenia: podglad.zdarzenia.filter((_, k) => k !== i) };
      ctx.odswiez();
    }));

  kontener.querySelector('#zatwierdz-podglad')?.addEventListener('click', async () => {
    const nowe = podglad.zdarzenia.map(({ k, kto }) => ({ k, kto }));
    // Czyścimy PRZED zapisem: zapis przerysowuje ekran jeszcze w trakcie
    // `await`, więc stan wyzerowany po nim zostałby na ekranie do następnego
    // odświeżenia — podgląd wisiałby mimo zatwierdzenia.
    podglad = null;
    szkicTekstu = '';
    await zapisz(wieczor, mecz, [...zagrania(mecz), ...nowe]);
    komunikat(`Dopisane: ${nowe.length}`);
    ctx.odswiez();
  });

  kontener.querySelector('#dyktuj')?.addEventListener('click', () => przelaczDyktowanie(ctx, pole));
}

/* Rozpoznawanie mowy przeglądarki. Na Androidzie/Chrome działa, na iPhonie
   nie — stąd fallback na mikrofon z klawiatury opisany w karcie. */
function przelaczDyktowanie(ctx, pole) {
  if (sluchanie) {
    try { rozpoznawacz?.stop(); } catch { /* już zatrzymany */ }
    sluchanie = false;
    ctx.odswiez();
    return;
  }
  const Silnik = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Silnik) return;
  rozpoznawacz = new Silnik();
  rozpoznawacz.lang = 'pl-PL';
  rozpoznawacz.continuous = true;
  rozpoznawacz.interimResults = false;
  rozpoznawacz.onresult = (e) => {
    let dopisz = '';
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      if (e.results[i].isFinal) dopisz += `${e.results[i][0].transcript.trim()}. `;
    }
    if (!dopisz) return;
    szkicTekstu = `${szkicTekstu} ${dopisz}`.trim();
    if (pole) { pole.value = szkicTekstu; pole.scrollTop = pole.scrollHeight; }
  };
  rozpoznawacz.onerror = () => { sluchanie = false; komunikat('Dyktowanie się urwało', 'blad'); ctx.odswiez(); };
  rozpoznawacz.onend = () => { if (sluchanie) { try { rozpoznawacz.start(); } catch { sluchanie = false; } } };
  try {
    rozpoznawacz.start();
    sluchanie = true;
    komunikat('🎤 Mów — tekst leci do pola');
    ctx.odswiez();
  } catch {
    komunikat('Nie udało się włączyć mikrofonu', 'blad');
  }
}

export { meczeZ };
