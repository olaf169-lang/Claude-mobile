// Trening: wybór i edycja planu, a w trakcie odhaczanie serii, zamiany,
// rekordy i podsumowanie.

import { SERII, PLANY_START, OBSZARY } from './dane.js';
import { pobierz, zmien, zapisz, cwiczenie } from './magazyn.js';
import {
  podpowiedz, sprawdzRekord, serieCwiczenia, krok, fmtKg, policzXp, poziom,
  xpLaczne, noweOdznaki, tonaz, nastepnyPlan, trudnosc, fmtMnoznik,
} from './logika.js';
import { esc, ruch, kolor, IKONY, arkusz, toast, wibruj, dzwiek } from './ui.js';
import { szczegoly, wyborCwiczenia } from './arkusze.js';
import { startOdpoczynku, stopOdpoczynku } from './odpoczynek.js';
import { swietujRekord, swietujTrening } from './swieto.js';
import { zglosTrening } from './przypomnienia.js';

let widokPlanu = null;
let blokada = null;
let zegarCzasu = null;

// Ekran nie gaśnie w trakcie treningu, bo telefon leży na ławce.
async function trzymajEkran(wlacz) {
  try {
    if (wlacz && 'wakeLock' in navigator && !blokada) {
      blokada = await navigator.wakeLock.request('screen');
      blokada.addEventListener('release', () => { blokada = null; });
    } else if (!wlacz && blokada) {
      await blokada.release();
      blokada = null;
    }
  } catch { /* bez blokady ekranu apka i tak działa */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && pobierz().aktywny) trzymajEkran(true);
});

// Ciężar po polsku, z przecinkiem. Pole jest tekstowe, bo pole liczbowe
// w Chrome na Androidzie potrafi odrzucić przecinek z polskiej klawiatury.
function pokazKg(kg) {
  return kg === null || kg === undefined || kg === '' ? '' : String(kg).replace('.', ',');
}

function noweSerie(cwId, zakres) {
  const c = cwiczenie(cwId);
  const pp = podpowiedz(pobierz().treningi, cwId, zakres, c?.typ);
  return Array.from({ length: SERII }, () => ({
    kg: pp ? pp.kg : (c?.typ === 'cialo' ? 0 : null),
    powt: pp ? pp.powt : zakres[1],
    ok: false,
  }));
}

function pozycja(wpis) {
  return { cw: wpis.cw, zakres: [...wpis.zakres], para: wpis.para || null, serie: noweSerie(wpis.cw, wpis.zakres) };
}

export function zacznijTrening(plan) {
  zmien((s) => {
    s.aktywny = { plan, start: new Date().toISOString(), cwiczenia: s.plany[plan].map(pozycja) };
  });
  trzymajEkran(true);
  if (location.hash === '#/trening') window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = '#/trening';
}

export function ekranTrening(el) {
  clearInterval(zegarCzasu);
  const s = pobierz();
  if (s.aktywny) {
    trzymajEkran(true);
    rysujSesje(el);
  } else {
    rysujPlany(el);
  }
}

/* PLANY: przegląd i zmiany na stałe */

function rysujPlany(el) {
  const s = pobierz();
  widokPlanu = widokPlanu || nastepnyPlan(s.treningi);
  const plan = s.plany[widokPlanu];
  el.innerHTML = `
    <h1>Trening</h1>
    <p class="cichy" style="margin:6px 0 0">Robisz je na zmianę. Każdy to całe ciało, 2 serie na ćwiczenie.</p>
    <div class="plan-wybor" role="group" aria-label="Plan">
      ${['A', 'B'].map((p) => `<button type="button" data-widok="${p}" aria-pressed="${p === widokPlanu}">Trening ${p}<small>${s.plany[p].length} ćwiczeń${p === nastepnyPlan(s.treningi) ? ', następny' : ''}</small></button>`).join('')}
    </div>
    <ul class="plan-lista">
      ${plan.map((w, i) => {
        const c = cwiczenie(w.cw);
        return `<li style="--kolor:${kolor(c?.obszar)}">
          <span class="nazwa"><span class="partia" style="--kolor:${kolor(c?.obszar)}">${esc(OBSZARY[c?.obszar]?.nazwa || 'Inne')}</span>${esc(c?.nazwa || w.cw)}<small>${SERII} × ${w.zakres[0]}-${w.zakres[1]}${w.para ? ', superseria' : ''}</small></span>
          <button class="menu-cw" type="button" data-menu-planu="${i}" aria-label="Zmień: ${esc(c?.nazwa || '')}">${IKONY.menu}</button>
        </li>`;
      }).join('')}
    </ul>
    <div class="start-akcje">
      <button class="btn btn-kreda btn-pelny" type="button" data-start>Zacznij trening ${widokPlanu}</button>
      <button class="btn btn-pelny" type="button" data-dodaj-do-planu>Dodaj ćwiczenie do planu ${widokPlanu}</button>
      <button class="btn-tekst" type="button" data-przywroc>Przywróć plan ${widokPlanu} z początku</button>
    </div>`;

  el.querySelectorAll('[data-widok]').forEach((b) => b.addEventListener('click', () => { widokPlanu = b.dataset.widok; rysujPlany(el); }));
  el.querySelector('[data-start]').addEventListener('click', () => zacznijTrening(widokPlanu));
  el.querySelector('[data-dodaj-do-planu]').addEventListener('click', () => {
    wyborCwiczenia({
      tytul: `Dodaj do planu ${widokPlanu}`,
      onWybierz: (id) => {
        zmien((st) => st.plany[widokPlanu].push({ cw: id, zakres: [8, 12] }));
        toast('Dodano do planu');
        rysujPlany(el);
      },
    });
  });
  el.querySelector('[data-przywroc]').addEventListener('click', () => {
    potwierdz(`Przywrócić plan ${widokPlanu}?`, 'Plan wróci do ćwiczeń z początku. Historia treningów zostaje.', 'Przywróć', () => {
      zmien((st) => { st.plany[widokPlanu] = structuredClone(PLANY_START[widokPlanu]); });
      rysujPlany(el);
    });
  });
  el.querySelectorAll('[data-menu-planu]').forEach((b) => b.addEventListener('click', () => menuPlanu(el, Number(b.dataset.menuPlanu))));
}

function menuPlanu(el, i) {
  const p = widokPlanu;
  const w = pobierz().plany[p][i];
  const c = cwiczenie(w.cw);
  const a = arkusz(`
    <div class="arkusz-gora"><h2>${esc(c?.nazwa || '')}</h2><button class="btn btn-ikona" type="button" data-zamknij aria-label="Zamknij">${IKONY.zamknij}</button></div>
    <label class="pole"><span>Zakres powtórzeń</span>
      <select data-zakres>${[[6, 10], [6, 12], [8, 12], [10, 12], [10, 14], [10, 15], [12, 15], [12, 20]].map(([x, y]) => `<option value="${x}-${y}" ${x === w.zakres[0] && y === w.zakres[1] ? 'selected' : ''}>${x}-${y}</option>`).join('')}</select>
    </label>
    <div style="display:grid;gap:8px">
      <button class="btn" type="button" data-a="tech">Technika i wyniki</button>
      <button class="btn" type="button" data-a="zamien">Zamień na stałe</button>
      <button class="btn" type="button" data-a="gora" ${i === 0 ? 'disabled' : ''}>Przesuń wyżej</button>
      <button class="btn" type="button" data-a="dol" ${i === pobierz().plany[p].length - 1 ? 'disabled' : ''}>Przesuń niżej</button>
      <button class="btn btn-zagrozenie" type="button" data-a="usun">Usuń z planu</button>
    </div>`);
  a.el.querySelector('[data-zakres]').addEventListener('change', (e) => {
    const [x, y] = e.target.value.split('-').map(Number);
    zmien((s) => { s.plany[p][i].zakres = [x, y]; });
    rysujPlany(el);
  });
  a.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const akcja = b.dataset.a;
    a.zamknij();
    if (akcja === 'tech') szczegoly(w.cw);
    if (akcja === 'zamien') {
      wyborCwiczenia({
        tytul: 'Zamień w planie', obecny: w.cw,
        onWybierz: (id) => { zmien((s) => { s.plany[p][i].cw = id; }); toast('Plan zmieniony na stałe'); rysujPlany(el); },
      });
    }
    if (akcja === 'gora' || akcja === 'dol') {
      const j = akcja === 'gora' ? i - 1 : i + 1;
      zmien((s) => { const l = s.plany[p]; [l[i], l[j]] = [l[j], l[i]]; });
      rysujPlany(el);
    }
    if (akcja === 'usun') {
      zmien((s) => { s.plany[p].splice(i, 1); });
      rysujPlany(el);
    }
  });
}

function potwierdz(tytul, tekst, przycisk, tak, { nie = 'Wróć', zagrozenie = false } = {}) {
  const a = arkusz(`
    <h2>${esc(tytul)}</h2>
    <p class="cichy">${esc(tekst)}</p>
    <div style="display:grid;gap:8px">
      <button class="btn ${zagrozenie ? 'btn-zagrozenie' : 'btn-kreda'} btn-pelny" type="button" data-tak>${esc(przycisk)}</button>
      <button class="btn btn-pelny" type="button" data-zamknij>${esc(nie)}</button>
    </div>`);
  a.el.querySelector('[data-tak]').addEventListener('click', () => { a.zamknij(); tak(); });
}

/* SESJA */

function ileSerii(akt) {
  let wszystkie = 0;
  let ok = 0;
  for (const c of akt.cwiczenia) for (const x of c.serie) { wszystkie++; if (x.ok) ok++; }
  return { wszystkie, ok };
}

function minutOdStartu(akt) {
  return Math.max(0, Math.round((Date.now() - new Date(akt.start)) / 60000));
}

function kartaCwiczenia(akt, i) {
  const w = akt.cwiczenia[i];
  const c = cwiczenie(w.cw) || { nazwa: w.cw, obszar: '', typ: 'maszyna' };
  const pp = podpowiedz(pobierz().treningi, w.cw, w.zakres, c.typ);
  const jedn = c.jednostka === 's' ? 's' : 'powt.';
  const kgEtykieta = c.typ === 'cialo' ? 'kg +/−' : 'kg';
  const gotowe = w.serie.length && w.serie.every((x) => x.ok);
  const ostatnio = pp
    ? `Ostatnio ${pp.ostatnio.map((x) => `${fmtKg(x.kg)}×${x.powt}`).join(', ')}${pp.dokladaj && c.typ !== 'cialo' ? ` <span class="w-gore">Dołóż: ${fmtKg(pp.kg)} kg</span>` : pp.dokladaj ? ' <span class="w-gore">Czas na trudniejszą wersję</span>' : ''}`
    : '<span class="cichy">Pierwszy raz. Dobierz ciężar na ' + w.zakres[1] + ' ruchów.</span>';
  return `
  <article class="cw ${gotowe ? 'gotowe' : ''}" style="--kolor:${kolor(c.obszar)}" data-cw="${i}">
    <div class="cw-gora">
      <button class="cw-otworz" type="button" data-tech="${i}" aria-label="Technika: ${esc(c.nazwa)}">
        ${ruch(c.img, { obszar: c.obszar, nazwa: c.nazwa })}
        <div>
          <span class="partia" style="--kolor:${kolor(c.obszar)}">${esc(OBSZARY[c.obszar]?.nazwa || 'Inne')}${c.cel ? `: ${esc(c.cel.toLowerCase())}` : ''}</span>
          <div class="cw-nazwa">${esc(c.nazwa)}</div>
          <div class="cw-meta">${w.serie.length} × ${w.zakres[0]}-${w.zakres[1]}, trudność ${fmtMnoznik(trudnosc(w.cw, pobierz().wlasne).trud)}</div>
        </div>
      </button>
      <button class="menu-cw" type="button" data-menu="${i}" aria-label="Opcje: ${esc(c.nazwa)}">${IKONY.menu}</button>
    </div>
    <div class="cw-serie">
      <div class="cw-ostatnio" style="margin:0 0 4px">${ostatnio}</div>
      ${w.serie.map((x, j) => `
      <div class="seria ${x.ok ? 'ok' : ''}" data-seria="${i}-${j}">
        <span class="seria-nr" aria-label="Seria ${j + 1}">${j + 1}</span>
        <div class="krokomierz">
          <button type="button" data-krok="${i}|${j}|kg|-" aria-label="Mniej kilogramów">−</button>
          <label><input type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" data-pole="${i}-${j}-kg" value="${pokazKg(x.kg)}" placeholder="0" aria-label="Ciężar, seria ${j + 1}"><span>${kgEtykieta}</span></label>
          <button type="button" data-krok="${i}|${j}|kg|+" aria-label="Więcej kilogramów">+</button>
        </div>
        <div class="krokomierz">
          <button type="button" data-krok="${i}|${j}|powt|-" aria-label="Mniej powtórzeń">−</button>
          <label><input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="done" data-pole="${i}-${j}-powt" value="${x.powt ?? ''}" placeholder="0" aria-label="Powtórzenia, seria ${j + 1}"><span>${jedn}</span></label>
          <button type="button" data-krok="${i}|${j}|powt|+" aria-label="Więcej powtórzeń">+</button>
        </div>
        <button class="odhacz" type="button" data-odhacz="${i}-${j}" aria-pressed="${x.ok}" aria-label="Seria ${j + 1} zrobiona">${IKONY.ok}</button>
      </div>`).join('')}
    </div>
  </article>`;
}

function rysujSesje(el) {
  const akt = pobierz().aktywny;
  const { wszystkie, ok } = ileSerii(akt);
  // Ćwiczenia z tą samą literą pary obok siebie tworzą superserię.
  let html = '';
  for (let i = 0; i < akt.cwiczenia.length; i++) {
    const para = akt.cwiczenia[i].para;
    if (para && akt.cwiczenia[i + 1]?.para === para) {
      html += `<div class="superseria"><p class="superseria-etykieta">Superseria: seria jednego, od razu seria drugiego, potem odpoczynek</p>${kartaCwiczenia(akt, i)}${kartaCwiczenia(akt, i + 1)}</div>`;
      i++;
    } else {
      html += kartaCwiczenia(akt, i);
    }
  }
  el.innerHTML = `
    <div class="trening-gora">
      <div class="trening-gora-wiersz">
        <div><h2>Trening ${akt.plan}</h2><div class="maly cichy"><span data-minuty>${minutOdStartu(akt)}</span> min, <span data-ile>${ok} z ${wszystkie}</span> serii</div></div>
        <button class="btn" type="button" data-zakoncz>Zakończ</button>
      </div>
      <div class="postep-serii" aria-hidden="true"><i style="width:${wszystkie ? (ok / wszystkie) * 100 : 0}%"></i></div>
    </div>
    ${html}
    <div class="start-akcje" style="margin-top:4px">
      <button class="btn btn-pelny" type="button" data-dodaj>Dodaj ćwiczenie</button>
      <button class="btn btn-kreda btn-pelny" type="button" data-zakoncz>Zakończ trening</button>
      <button class="btn-tekst btn-zagrozenie" type="button" data-porzuc>Odrzuć trening</button>
    </div>`;

  zegarCzasu = setInterval(() => {
    const m = el.querySelector('[data-minuty]');
    if (!m || !pobierz().aktywny) { clearInterval(zegarCzasu); return; }
    m.textContent = minutOdStartu(pobierz().aktywny);
  }, 20000);

  el.onclick = (e) => obsluzKlik(el, e);
  // Dotknięcie pola zaznacza całą liczbę, więc nowa wpisuje się od razu w jej miejsce.
  el.onfocusin = (e) => { if (e.target.dataset?.pole) setTimeout(() => e.target.select(), 0); };
  el.onchange = (e) => {
    const p = e.target.dataset.pole;
    if (!p) return;
    const [i, j, pole] = p.split('-');
    const surowe = String(e.target.value).trim().replace(',', '.').replace(/[^0-9.+-]/g, '');
    const v = surowe === '' ? null : Number(surowe);
    const wartosc = Number.isFinite(v) ? v : null;
    zmien((s) => {
      const serie = s.aktywny.cwiczenia[i].serie;
      serie[j][pole] = wartosc;
      if (Number(j) === 0) {
        serie.slice(1).forEach((x, k) => {
          if (x.ok) return;
          x[pole] = wartosc;
          const inp = el.querySelector(`[data-pole="${i}-${k + 1}-${pole}"]`);
          if (inp) inp.value = pole === 'kg' ? pokazKg(wartosc) : (wartosc ?? '');
        });
      }
    });
  };
}

function odswiezLicznik(el) {
  const { wszystkie, ok } = ileSerii(pobierz().aktywny);
  el.querySelector('[data-ile]').textContent = `${ok} z ${wszystkie}`;
  el.querySelector('.postep-serii i').style.width = `${wszystkie ? (ok / wszystkie) * 100 : 0}%`;
}

function obsluzKlik(el, e) {
  const t = (sel) => e.target.closest(sel);
  const akt = pobierz().aktywny;
  if (!akt) return;

  const kr = t('[data-krok]');
  if (kr) {
    const [i, j, pole, znak] = kr.dataset.krok.split('|').map((x, k) => (k < 2 ? Number(x) : x));
    const c = cwiczenie(akt.cwiczenia[i].cw);
    const seria = akt.cwiczenia[i].serie[j];
    const d = pole === 'kg' ? krok(c?.typ) : 1;
    const ile = (znak === '+' ? 1 : -1) * d;
    let v = (Number(seria[pole]) || 0) + ile;
    if (pole === 'powt') v = Math.max(0, v);
    if (pole === 'kg' && c?.typ !== 'cialo') v = Math.max(0, v);
    seria[pole] = Math.round(v * 10) / 10;
    // Zmiana pierwszej serii przenosi się na kolejne, jeszcze nieodhaczone.
    if (j === 0) for (const nast of akt.cwiczenia[i].serie.slice(1)) if (!nast.ok) nast[pole] = seria[pole];
    zapisz();
    akt.cwiczenia[i].serie.forEach((x, k) => {
      const inp = el.querySelector(`[data-pole="${i}-${k}-${pole}"]`);
      if (inp) inp.value = pole === 'kg' ? pokazKg(x[pole]) : (x[pole] ?? '');
    });
    return;
  }

  const od = t('[data-odhacz]');
  if (od) { odhacz(el, ...od.dataset.odhacz.split('-').map(Number)); return; }

  const tech = t('[data-tech]');
  if (tech) { szczegoly(akt.cwiczenia[Number(tech.dataset.tech)].cw); return; }

  const menu = t('[data-menu]');
  if (menu) { menuSesji(el, Number(menu.dataset.menu)); return; }

  if (t('[data-dodaj]')) {
    wyborCwiczenia({
      tytul: 'Dodaj ćwiczenie',
      zasiegi: [{ id: 'dzis', etykieta: 'Tylko w tym treningu' }, { id: 'stale', etykieta: `Też na stałe w planie ${akt.plan}` }],
      przycisk: 'Dodaj',
      onWybierz: (id, zasieg) => {
        zmien((s) => {
          s.aktywny.cwiczenia.push(pozycja({ cw: id, zakres: [8, 12] }));
          if (zasieg === 'stale') s.plany[s.aktywny.plan].push({ cw: id, zakres: [8, 12] });
        });
        rysujSesje(el);
        el.querySelector('.cw:last-of-type')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    });
    return;
  }
  if (t('[data-zakoncz]')) { zakoncz(el); return; }
  if (t('[data-porzuc]')) {
    potwierdz('Odrzucić trening?', 'Nic z tego treningu się nie zapisze i nie dostaniesz za niego XP.', 'Odrzuć trening', () => {
      zmien((s) => { s.aktywny = null; });
      stopOdpoczynku();
      trzymajEkran(false);
      location.hash = '#/start';
    }, { zagrozenie: true });
  }
}

async function odhacz(el, i, j) {
  const s = pobierz();
  const akt = s.aktywny;
  const w = akt.cwiczenia[i];
  const seria = w.serie[j];
  const c = cwiczenie(w.cw) || { typ: 'maszyna', nazwa: w.cw };
  const wiersz = el.querySelector(`[data-seria="${i}-${j}"]`);

  if (seria.ok) {
    seria.ok = false;
    delete seria.rekord;
    zapisz();
    wiersz.classList.remove('ok');
    wiersz.querySelector('.odhacz').setAttribute('aria-pressed', 'false');
    el.querySelector(`[data-cw="${i}"]`).classList.remove('gotowe');
    odswiezLicznik(el);
    return;
  }
  if (!(seria.powt > 0)) { toast('Wpisz liczbę powtórzeń'); return; }
  if (c.typ !== 'cialo' && !(seria.kg > 0)) { toast('Wpisz ciężar'); return; }

  // Do porównania: cała historia plus serie tego ćwiczenia już zrobione dziś.
  const dzis = akt.cwiczenia.filter((x) => x.cw === w.cw)
    .flatMap((x) => x.serie.filter((y) => y.ok && y !== seria));
  const rekord = sprawdzRekord([...serieCwiczenia(s.treningi, w.cw), ...dzis], seria);
  seria.ok = true;
  if (rekord) seria.rekord = rekord;
  zapisz();

  wiersz.classList.add('ok');
  wiersz.querySelector('.odhacz').setAttribute('aria-pressed', 'true');
  if (w.serie.every((x) => x.ok)) el.querySelector(`[data-cw="${i}"]`).classList.add('gotowe');
  odswiezLicznik(el);
  wibruj(30);

  // W superserii przerwa dopiero po drugim ćwiczeniu z pary.
  const wParze = w.para && akt.cwiczenia[i + 1]?.para === w.para;
  if (wParze) toast('Teraz od razu drugie ćwiczenie z superserii');
  else startOdpoczynku();

  if (rekord) {
    await swietujRekord({ rekord, nazwa: c.nazwa, masa: poziom(xpLaczne(s)).masa });
  } else {
    dzwiek('seria');
  }
}

function menuSesji(el, i) {
  const akt = pobierz().aktywny;
  const w = akt.cwiczenia[i];
  const c = cwiczenie(w.cw);
  const a = arkusz(`
    <div class="arkusz-gora"><h2>${esc(c?.nazwa || '')}</h2><button class="btn btn-ikona" type="button" data-zamknij aria-label="Zamknij">${IKONY.zamknij}</button></div>
    <div style="display:grid;gap:8px">
      <button class="btn" type="button" data-a="tech">Technika i wyniki</button>
      <button class="btn" type="button" data-a="zamien">Zamień ćwiczenie</button>
      <button class="btn" type="button" data-a="plus">Dodaj serię</button>
      <button class="btn" type="button" data-a="minus" ${w.serie.length <= 1 ? 'disabled' : ''}>Usuń ostatnią serię</button>
      <button class="btn btn-zagrozenie" type="button" data-a="usun">Pomiń dziś to ćwiczenie</button>
    </div>`);
  a.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    a.zamknij();
    const akcja = b.dataset.a;
    if (akcja === 'tech') szczegoly(w.cw);
    if (akcja === 'zamien') {
      wyborCwiczenia({
        tytul: 'Zamień ćwiczenie', obecny: w.cw,
        zasiegi: [{ id: 'dzis', etykieta: 'Tylko w tym treningu' }, { id: 'stale', etykieta: `Na stałe w planie ${akt.plan}` }],
        przycisk: 'Zamień',
        onWybierz: (id, zasieg) => {
          const stary = w.cw;
          zmien((s) => {
            const nowa = pozycja({ cw: id, zakres: w.zakres, para: w.para });
            s.aktywny.cwiczenia[i] = nowa;
            if (zasieg === 'stale') {
              const wp = s.plany[s.aktywny.plan].find((x) => x.cw === stary);
              if (wp) wp.cw = id;
            }
          });
          toast(zasieg === 'stale' ? 'Zamienione, także w planie' : 'Zamienione na dziś');
          rysujSesje(el);
        },
      });
    }
    if (akcja === 'plus') {
      zmien((s) => {
        const l = s.aktywny.cwiczenia[i].serie;
        const ost = l[l.length - 1];
        l.push({ kg: ost?.kg ?? null, powt: ost?.powt ?? w.zakres[1], ok: false });
      });
      rysujSesje(el);
    }
    if (akcja === 'minus') { zmien((s) => { s.aktywny.cwiczenia[i].serie.pop(); }); rysujSesje(el); }
    if (akcja === 'usun') { zmien((s) => { s.aktywny.cwiczenia.splice(i, 1); }); rysujSesje(el); }
  });
}

function zakoncz(el) {
  const akt = pobierz().aktywny;
  const { wszystkie, ok } = ileSerii(akt);
  if (!ok) {
    potwierdz('Nic nie odhaczone', 'Nie zapisałeś żadnej serii. Możesz wrócić do treningu albo go odrzucić.', 'Odrzuć trening', () => {
      zmien((s) => { s.aktywny = null; });
      stopOdpoczynku();
      trzymajEkran(false);
      location.hash = '#/start';
    }, { nie: 'Wróć do treningu', zagrozenie: true });
    return;
  }
  if (ok < wszystkie) {
    potwierdz(`Zostało ${wszystkie - ok} serii`, 'Zapiszę to, co odhaczone. Bonus za komplet serii przepadnie.', 'Zakończ trening', () => zapiszTrening(), { nie: 'Wróć do treningu' });
    return;
  }
  zapiszTrening();
}

async function zapiszTrening() {
  const s = pobierz();
  const akt = s.aktywny;
  const xpPrzed = xpLaczne(s);
  const przed = poziom(xpPrzed);

  // Jeden rekord na ćwiczenie: liczy się ostatni, najlepszy z dnia.
  const rekordy = new Map();
  for (const c of akt.cwiczenia) {
    for (const x of c.serie) if (x.ok && x.rekord) rekordy.set(c.cw, { cw: c.cw, nazwa: cwiczenie(c.cw)?.nazwa || c.cw, ...x.rekord });
  }
  const koniec = new Date().toISOString();
  const xp = policzXp({ data: akt.start, cwiczenia: akt.cwiczenia, rekordy: [...rekordy.values()] }, s.treningi,
    { planDlugosc: s.plany[akt.plan].length, wlasne: s.wlasne, masaCiala: s.ustawienia.masaCiala });
  const trening = {
    id: Date.now().toString(36),
    data: akt.start,
    koniec,
    plan: akt.plan,
    cwiczenia: akt.cwiczenia
      .map((c) => ({ cw: c.cw, serie: c.serie.filter((x) => x.ok).map(({ kg, powt }) => ({ kg: kg || 0, powt, ok: true })) }))
      .filter((c) => c.serie.length),
    rekordy: [...rekordy.values()],
    xp: xp.suma,
    komplet: xp.komplet,
  };

  let nowe = [];
  zmien((st) => {
    st.treningi.push(trening);
    st.aktywny = null;
    nowe = noweOdznaki(st);
    for (const o of nowe) st.odznaki[o.id] = koniec;
  });
  stopOdpoczynku();
  trzymajEkran(false);
  zglosTrening(trening.data);
  const xpPo = xpLaczne(pobierz());
  await swietujTrening({
    xp, przed, po: poziom(xpPo), xpPo, nowe, rekordy: trening.rekordy,
    minuty: Math.max(1, Math.round((new Date(koniec) - new Date(akt.start)) / 60000)),
    tonaz: tonaz(trening),
  });
  widokPlanu = null;
  location.hash = '#/start';
}
