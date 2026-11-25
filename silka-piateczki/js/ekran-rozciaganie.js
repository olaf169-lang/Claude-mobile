// Rozciąganie: 6 pozycji, około 7 minut. Tryb prowadzony sam odlicza,
// zmienia strony i daje sygnał, więc telefon można odłożyć na matę.

import { ROZCIAGANIE, ROZCIAGANIE_W_TYGODNIU } from './dane.js';
import { pobierz, zmien } from './magazyn.js';
import { rozciaganieWTygodniu, poziom, xpLaczne, noweOdznaki } from './logika.js';
import { esc, ruch, IKONY, dzwiek, wibruj, czas } from './ui.js';
import { swietujRozciaganie } from './swieto.js';

const PRZYGOTUJ = 4;

function kroki() {
  const l = [];
  for (const r of ROZCIAGANIE) {
    if (r.strony === 2) {
      l.push({ r, strona: 'Lewa strona', sekundy: r.sekundy });
      l.push({ r, strona: 'Prawa strona', sekundy: r.sekundy });
    } else {
      l.push({ r, strona: '', sekundy: r.sekundy });
    }
  }
  return l;
}

export function ekranRozciaganie(el) {
  const s = pobierz();
  const wTyg = rozciaganieWTygodniu(s.rozciaganie);
  const calosc = kroki().reduce((a, k) => a + k.sekundy + PRZYGOTUJ, 0);
  el.innerHTML = `
    <h1>Rozciąganie</h1>
    <p class="cichy" style="margin:6px 0 0">${ROZCIAGANIE_W_TYGODNIU} razy w tygodniu, najlepiej od razu po badmintonie albo siłowni, kiedy mięśnie są ciepłe.</p>
    <div class="rozciaganie-karta" style="margin-top:14px">
      <div style="flex:1"><h3>W tym tygodniu ${wTyg} z ${ROZCIAGANIE_W_TYGODNIU}</h3><div class="maly cichy">${wTyg >= ROZCIAGANIE_W_TYGODNIU ? 'Tydzień zaliczony. Każda kolejna sesja to dalej XP.' : `Jeszcze ${ROZCIAGANIE_W_TYGODNIU - wTyg} do kompletu`}</div></div>
      <div class="kropki" aria-hidden="true">${Array.from({ length: ROZCIAGANIE_W_TYGODNIU }, (_, i) => `<i class="${i < wTyg ? 'pelny' : ''}"></i>`).join('')}</div>
    </div>
    <ol class="rozc-lista">
      ${ROZCIAGANIE.map((r) => `<li>${ruch(r.img, { id: r.id, obszar: 'nogi', nazwa: r.nazwa })}<span><b>${esc(r.nazwa)}</b><span class="maly cichy">${r.sekundy} s${r.strony === 2 ? ' na stronę' : ''}</span></span></li>`).join('')}
    </ol>
    <button class="btn btn-kreda btn-pelny" type="button" data-start>Start, ${Math.round(calosc / 60)} minut</button>
    <p class="maly cichy" style="text-align:center">Apka sama odlicza i daje sygnał przy zmianie strony.</p>`;
  el.querySelector('[data-start]').addEventListener('click', prowadz);
}

function prowadz() {
  const lista = kroki();
  let i = 0;
  let faza = 'przygotuj';
  let zostalo = PRZYGOTUJ;
  let pauza = false;
  let zegar = null;
  let blokada = null;
  try { navigator.wakeLock?.request('screen').then((b) => { blokada = b; }).catch(() => {}); } catch { /* bez blokady */ }

  const el = document.createElement('section');
  el.className = 'prowadzenie';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Rozciąganie prowadzone');
  document.body.append(el);
  const O = 2 * Math.PI * 95;

  const rysuj = () => {
    const k = lista[i];
    const nast = lista[i + 1];
    const max = faza === 'przygotuj' ? PRZYGOTUJ : k.sekundy;
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <span class="maly cichy">${i + 1} z ${lista.length}</span>
        <button class="btn btn-ikona" type="button" data-x aria-label="Przerwij rozciąganie">${IKONY.zamknij}</button>
      </div>
      <div class="prowadzenie-srodek">
        ${ruch(k.r.img, { duzy: true, id: k.r.id, nazwa: k.r.nazwa, obszar: 'nogi' })}
        <h2>${esc(k.r.nazwa)}</h2>
        ${k.strona ? `<div class="strona">${esc(k.strona)}</div>` : ''}
        <div class="zegar">
          <svg viewBox="0 0 210 210" aria-hidden="true"><circle cx="105" cy="105" r="95" fill="none" stroke="var(--grafit-3)" stroke-width="12"/>
          <circle data-luk cx="105" cy="105" r="95" fill="none" stroke="${faza === 'przygotuj' ? 'var(--t-zolta)' : 'var(--t-zielona)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${O}" stroke-dashoffset="${O * (1 - zostalo / max)}"/></svg>
          <div class="zegar-liczba" data-liczba aria-live="off">${faza === 'przygotuj' ? zostalo : czas(zostalo)}</div>
        </div>
        <p class="maly ${faza === 'przygotuj' ? '' : 'cichy'}" style="max-width:36ch;margin:0">${faza === 'przygotuj' ? 'Ustaw się w pozycji. ' : ''}${esc(k.r.rada)}</p>
        ${nast ? `<p class="maly cichy" style="margin:0">Dalej: ${esc(nast.r.nazwa)}${nast.strona ? `, ${nast.strona.toLowerCase()}` : ''}</p>` : ''}
      </div>
      <div class="prowadzenie-dol">
        <button class="btn" type="button" data-wstecz ${i === 0 ? 'disabled' : ''}>Wstecz</button>
        <button class="btn" type="button" data-pauza>${pauza ? 'Wznów' : 'Pauza'}</button>
        <button class="btn" type="button" data-dalej>Dalej</button>
      </div>`;
  };

  const aktualizuj = () => {
    const k = lista[i];
    const max = faza === 'przygotuj' ? PRZYGOTUJ : k.sekundy;
    const luk = el.querySelector('[data-luk]');
    if (luk) luk.setAttribute('stroke-dashoffset', String(O * (1 - zostalo / max)));
    const l = el.querySelector('[data-liczba]');
    if (l) l.textContent = faza === 'przygotuj' ? zostalo : czas(zostalo);
  };

  const idzDo = (n) => {
    if (n >= lista.length) { koniec(true); return; }
    i = Math.max(0, n);
    faza = 'przygotuj';
    zostalo = PRZYGOTUJ;
    rysuj();
  };

  const tik = () => {
    if (pauza) return;
    zostalo--;
    if (zostalo <= 0) {
      if (faza === 'przygotuj') {
        faza = 'trzymaj';
        zostalo = lista[i].sekundy;
        dzwiek('seria');
        wibruj(120);
        rysuj();
      } else {
        dzwiek('koniec');
        wibruj([150, 80, 150]);
        idzDo(i + 1);
      }
      return;
    }
    if (faza === 'trzymaj' && zostalo <= 3) wibruj(40);
    aktualizuj();
  };

  const koniec = async (zaliczone) => {
    clearInterval(zegar);
    try { blokada?.release(); } catch { /* nic */ }
    el.remove();
    if (!zaliczone) return;
    const przed = poziom(xpLaczne(pobierz()));
    zmien((s) => {
      s.rozciaganie.push(new Date().toISOString());
      for (const o of noweOdznaki(s)) s.odznaki[o.id] = new Date().toISOString();
    });
    await swietujRozciaganie({ przed, po: poziom(xpLaczne(pobierz())) });
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-x]')) koniec(false);
    else if (e.target.closest('[data-wstecz]')) idzDo(i - 1);
    else if (e.target.closest('[data-dalej]')) idzDo(i + 1);
    else if (e.target.closest('[data-pauza]')) { pauza = !pauza; rysuj(); }
  });

  rysuj();
  zegar = setInterval(tik, 1000);
}
