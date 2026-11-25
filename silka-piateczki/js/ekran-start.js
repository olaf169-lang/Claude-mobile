// Ekran startowy: koks, poziom na sztandze, licznik przerwy i seria.

import { rysujKoksa, rysujSztange, animujKoksa } from './koks.js';
import { pobierz } from './magazyn.js';
import { poziom, xpLaczne, serie, nastepnyPlan, rozciaganieWTygodniu } from './logika.js';
import { MAKS_PRZERWA, ROZCIAGANIE_W_TYGODNIU, ODZNAKI } from './dane.js';
import { esc, godloOdznaki } from './ui.js';
import { zacznijTrening } from './ekran-trening.js';

function przerwaOpis(dni) {
  if (dni === null) return { wartosc: 'start', jednostka: '', klasa: '', tekst: 'Pierwszy trening przed Tobą' };
  const zostalo = MAKS_PRZERWA - dni;
  if (dni === 0) return { wartosc: 'dziś', jednostka: '', klasa: '', tekst: 'Trening zaliczony' };
  if (zostalo < 0) return { wartosc: String(dni), jednostka: 'dni', klasa: 'alarm', tekst: 'Seria przerwana, wracaj' };
  if (zostalo === 0) return { wartosc: String(dni), jednostka: 'dni', klasa: 'alarm', tekst: 'Ostatni dzień, dziś trening' };
  if (zostalo === 1) return { wartosc: String(dni), jednostka: dni === 1 ? 'dzień' : 'dni', klasa: 'uwaga', tekst: 'Najpóźniej jutro' };
  return { wartosc: String(dni), jednostka: dni === 1 ? 'dzień' : 'dni', klasa: '', tekst: `Zostało ${zostalo} dni` };
}

export function ekranStart(el) {
  const s = pobierz();
  const xp = xpLaczne(s);
  const p = poziom(xp);
  const sr = serie(s.treningi);
  const plan = nastepnyPlan(s.treningi);
  const inny = plan === 'A' ? 'B' : 'A';
  const prz = przerwaOpis(sr.odOstatniego);
  const pelne = sr.odOstatniego === null ? 0 : Math.min(MAKS_PRZERWA, sr.odOstatniego);
  const rozc = rozciaganieWTygodniu(s.rozciaganie);
  const zdobyte = ODZNAKI.filter((o) => s.odznaki[o.id])
    .sort((a, b) => s.odznaki[b.id].localeCompare(s.odznaki[a.id])).slice(0, 3);

  el.innerHTML = `
    <header class="naglowek-apki">
      <div class="znak"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="var(--t-czerwona)"/><circle cx="12" cy="12" r="7" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="var(--zeliwo)"/></svg>Siłka Piąteczki</div>
    </header>

    <button class="scena" type="button" id="koks-scena" aria-label="Napnij koksa">
      <div class="koks" id="koks">${rysujKoksa(p.masa, 0)}</div>
    </button>

    <div class="poziom">
      <div class="poziom-wiersz">
        <div class="poziom-nazwa"><small>Poziom ${p.numer}</small>${esc(p.nazwa)}</div>
        <div class="poziom-xp"><b>${xp}</b> XP${p.nastepny ? `<br>${esc(p.nastepny.nazwa)} od ${p.nastepny.prog}` : '<br>Szczyt osiągnięty'}</div>
      </div>
      <div class="sztanga" role="img" aria-label="Postęp do następnego poziomu: ${Math.round(p.postep * 100)} procent">${rysujSztange(p.postep)}</div>
    </div>

    <div class="licznik">
      <div class="kafel">
        <div class="kafel-tytul">Od treningu</div>
        <div class="kafel-wartosc">${prz.wartosc}<small>${prz.jednostka}</small></div>
        <div class="przerwa-paski ${prz.klasa}" aria-hidden="true">${Array.from({ length: MAKS_PRZERWA }, (_, i) => `<i class="${i < pelne ? 'pelny' : ''}"></i>`).join('')}</div>
        <div class="maly cichy" style="margin-top:6px">${prz.tekst}</div>
      </div>
      <div class="kafel">
        <div class="kafel-tytul">Seria w terminie</div>
        <div class="kafel-wartosc">${sr.biezaca}<small>${sr.biezaca === 1 ? 'trening' : sr.biezaca >= 2 && sr.biezaca <= 4 ? 'treningi' : 'treningów'}</small></div>
        <div class="maly cichy" style="margin-top:6px">Przerwa najwyżej ${MAKS_PRZERWA} dni. Najdłuższa seria: ${sr.najdluzsza}</div>
      </div>
    </div>

    <div class="start-akcje">
      ${s.aktywny
        ? `<a class="btn btn-kreda btn-pelny" href="#/trening">Wróć do treningu ${s.aktywny.plan}</a>`
        : `<button class="btn btn-kreda btn-pelny" type="button" data-plan="${plan}">Zacznij trening ${plan}</button>
           <button class="btn-tekst" type="button" data-plan="${inny}">albo trening ${inny}</button>`}
    </div>

    <section class="sekcja">
      <div class="rozciaganie-karta">
        <div style="flex:1">
          <h3>Rozciąganie</h3>
          <div class="maly cichy">W tym tygodniu ${rozc} z ${ROZCIAGANIE_W_TYGODNIU}, około 7 minut</div>
        </div>
        <div class="kropki" aria-hidden="true">${Array.from({ length: ROZCIAGANIE_W_TYGODNIU }, (_, i) => `<i class="${i < rozc ? 'pelny' : ''}"></i>`).join('')}</div>
        <a class="btn" href="#/rozciaganie">Start</a>
      </div>
    </section>

    ${zdobyte.length ? `
    <section class="sekcja">
      <div class="sekcja-tytul"><h2>Ostatnie odznaki</h2><a class="btn-tekst" href="#/postepy">Wszystkie</a></div>
      <div class="odznaki">${zdobyte.map((o) => `<div class="odznaka">${godloOdznaki(ODZNAKI.indexOf(o))}<b>${esc(o.nazwa)}</b>${esc(o.opis)}</div>`).join('')}</div>
    </section>` : ''}
  `;

  el.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => zacznijTrening(b.dataset.plan)));

  // Dotknięcie koksa: pręży się. Mała nagroda za samo wejście do apki.
  let trwa = false;
  el.querySelector('#koks-scena').addEventListener('click', async () => {
    if (trwa) return;
    trwa = true;
    const k = el.querySelector('#koks');
    await animujKoksa(k, { masa: p.masa, poza: 0 }, { masa: p.masa, poza: 1 }, 420, { mina: 'radosc' });
    await new Promise((r) => setTimeout(r, 650));
    await animujKoksa(k, { masa: p.masa, poza: 1 }, { masa: p.masa, poza: 0 }, 420);
    trwa = false;
  });
}
