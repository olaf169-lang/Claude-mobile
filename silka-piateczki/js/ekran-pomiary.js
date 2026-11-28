// Pomiary ciała: waga, wyniki z wagi Huawei (tłuszcz, mięśnie, woda...)
// i obwody z taśmy. Każdy pomiar to data i tylko te wartości, które wpisałeś.
// Wykres dla każdej wielkości, zmiana od pierwszego i od poprzedniego pomiaru.

import { POMIARY, GRUPY_POMIAROW } from './dane.js';
import { pobierz, zmien } from './magazyn.js';
import { dniMiedzy } from './logika.js';
import { esc, arkusz, toast, IKONY, dataLadnie } from './ui.js';
import { liniowy, mini } from './wykres.js';

let wybrana = 'waga';

const fmt = (v, krokDziesietny = 1) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '';
  const n = Math.round(v * 10 ** krokDziesietny) / 10 ** krokDziesietny;
  return String(n).replace('.', ',');
};

// Punkty jednej wielkości, od najstarszego.
function punkty(pomiary, id) {
  return pomiary
    .filter((p) => typeof p.wartosci?.[id] === 'number')
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((p) => ({ data: p.data, wartosc: p.wartosci[id] }));
}

// Strzałka i kolor zmiany: zielony, gdy idzie w stronę Twojego celu.
function zmiana(roznica, def) {
  if (!roznica) return '<span class="cichy">bez zmian</span>';
  const dobrze = def.cel === 'gora' ? roznica > 0 : def.cel === 'dol' ? roznica < 0 : null;
  const kl = dobrze === null ? 'cichy' : dobrze ? 'zmiana-dobrze' : 'zmiana-zle';
  return `<span class="${kl}">${roznica > 0 ? '+' : '−'}${fmt(Math.abs(roznica), def.dzies ?? 1)} ${esc(def.jedn)}</span>`;
}

export function ekranPomiary(el) {
  const s = pobierz();
  const lista = s.pomiary;
  const daty = lista.map((p) => p.data).sort();
  const ostatni = daty[daty.length - 1];
  const odOstatniego = ostatni ? dniMiedzy(ostatni, new Date().toISOString()) : null;
  const zDanymi = POMIARY.filter((d) => punkty(lista, d.id).length);
  if (!zDanymi.some((d) => d.id === wybrana)) wybrana = zDanymi[0]?.id || 'waga';
  const def = POMIARY.find((d) => d.id === wybrana);
  const pkt = punkty(lista, wybrana);

  el.innerHTML = `
    <h1>Pomiary</h1>
    <p class="cichy" style="margin:6px 0 14px">${odOstatniego === null
      ? 'Zrób pierwszy pomiar. Potem co 2 do 4 tygodni, zawsze rano, na czczo, po toalecie.'
      : `Ostatni pomiar ${odOstatniego === 0 ? 'dziś' : odOstatniego === 1 ? 'wczoraj' : `${odOstatniego} dni temu`}. ${odOstatniego >= 14 ? 'Czas na kolejny.' : 'Następny najlepiej po 2 do 4 tygodniach.'}`}</p>
    <button class="btn btn-kreda btn-pelny" type="button" data-dodaj>Dodaj pomiar</button>

    ${zDanymi.length ? `
    <section class="sekcja">
      <div class="chipy" role="tablist" aria-label="Wykres">
        ${zDanymi.map((d) => `<button type="button" role="tab" data-wykres="${d.id}" aria-selected="${d.id === wybrana}">${esc(d.krotko || d.nazwa)}</button>`).join('')}
      </div>
      <div class="kafel" style="margin-top:10px">
        <div class="poziom-wiersz">
          <div><div class="kafel-tytul">${esc(def.nazwa)}</div><div class="kafel-wartosc">${fmt(pkt[pkt.length - 1].wartosc, def.dzies ?? 1)}<small>${esc(def.jedn)}</small></div></div>
          <div style="text-align:right" class="maly">${pkt.length > 1 ? `od początku ${zmiana(pkt[pkt.length - 1].wartosc - pkt[0].wartosc, def)}<br>od poprzedniego ${zmiana(pkt[pkt.length - 1].wartosc - pkt[pkt.length - 2].wartosc, def)}` : '<span class="cichy">Drugi pomiar pokaże zmianę</span>'}</div>
        </div>
        ${liniowy(pkt, { jednostka: def.jedn, kolor: 'var(--t-zolta)', dzies: def.dzies ?? 1 })}
      </div>
    </section>` : ''}

    ${GRUPY_POMIAROW.map((g) => {
      const defy = POMIARY.filter((d) => d.grupa === g.id && punkty(lista, d.id).length);
      if (!defy.length) return '';
      return `<section class="sekcja">
        <div class="sekcja-tytul"><h2>${esc(g.nazwa)}</h2></div>
        <ul class="rekordy">${defy.map((d) => {
          const p = punkty(lista, d.id);
          const ost = p[p.length - 1];
          return `<li><button type="button" data-wykres="${d.id}" style="--kolor:${g.kolor}">
            <span><b>${esc(d.nazwa)}</b><span class="maly"><span class="liczba" style="font-size:19px">${fmt(ost.wartosc, d.dzies ?? 1)} ${esc(d.jedn)}</span> ${p.length > 1 ? zmiana(ost.wartosc - p[0].wartosc, d) : ''}</span></span>
            ${mini(p, g.kolor)}
          </button></li>`;
        }).join('')}</ul>
      </section>`;
    }).join('')}

    ${lista.length ? `
    <section class="sekcja">
      <div class="sekcja-tytul"><h2>Historia pomiarów</h2></div>
      <ul class="historia">${[...lista].sort((a, b) => b.data.localeCompare(a.data)).map((p) => `
        <li><details>
          <summary><b>${dataLadnie(p.data)}</b><span class="cichy maly">${Object.keys(p.wartosci).length} wartości</span></summary>
          <table>${POMIARY.filter((d) => typeof p.wartosci[d.id] === 'number').map((d) => `<tr><td>${esc(d.nazwa)}</td><td>${fmt(p.wartosci[d.id], d.dzies ?? 1)} ${esc(d.jedn)}</td></tr>`).join('')}</table>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn" type="button" data-edytuj="${esc(p.id)}">Popraw</button>
            <button class="btn-tekst btn-zagrozenie" type="button" data-usun="${esc(p.id)}">Usuń</button>
          </div>
        </details></li>`).join('')}</ul>
    </section>` : `
    <section class="sekcja">
      <div class="pusto">Tu pojawią się wykresy: waga, tłuszcz, mięśnie z wagi Huawei i obwody z taśmy. Wystarczy wpisać to, co masz, reszta może zostać pusta.</div>
    </section>`}`;

  el.onclick = (e) => {
    const w = e.target.closest('[data-wykres]');
    if (w) {
      wybrana = w.dataset.wykres;
      ekranPomiary(el);
      el.querySelector('.chipy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (e.target.closest('[data-dodaj]')) { formularz(el); return; }
    const ed = e.target.closest('[data-edytuj]');
    if (ed) { formularz(el, ed.dataset.edytuj); return; }
    const us = e.target.closest('[data-usun]');
    if (us) {
      const a = arkusz(`<h2>Usunąć ten pomiar?</h2><p class="cichy">Zniknie z wykresów.</p>
        <div style="display:grid;gap:8px"><button class="btn btn-zagrozenie btn-pelny" type="button" data-tak>Usuń pomiar</button>
        <button class="btn btn-pelny" type="button" data-zamknij>Wróć</button></div>`);
      a.el.querySelector('[data-tak]').addEventListener('click', () => {
        a.zamknij();
        zmien((x) => { x.pomiary = x.pomiary.filter((p) => p.id !== us.dataset.usun); });
        ekranPomiary(el);
      });
    }
  };
}

function formularz(el, idEdycji = null) {
  const s = pobierz();
  const edytowany = idEdycji ? s.pomiary.find((p) => p.id === idEdycji) : null;
  // Podpowiedzi w polach: ostatnia znana wartość każdej wielkości.
  const ostatnie = {};
  for (const p of [...s.pomiary].sort((a, b) => a.data.localeCompare(b.data))) Object.assign(ostatnie, p.wartosci);
  const dzis = new Date();
  const dataPola = (edytowany ? new Date(edytowany.data) : dzis);
  const yyyyMmDd = `${dataPola.getFullYear()}-${String(dataPola.getMonth() + 1).padStart(2, '0')}-${String(dataPola.getDate()).padStart(2, '0')}`;

  const a = arkusz(`
    <div class="arkusz-gora"><h2>${edytowany ? 'Popraw pomiar' : 'Nowy pomiar'}</h2><button class="btn btn-ikona" type="button" data-zamknij aria-label="Zamknij">${IKONY.zamknij}</button></div>
    <form data-pomiar>
      <label class="pole"><span>Data</span><input type="date" name="data" value="${yyyyMmDd}" max="${new Date().toISOString().slice(0, 10)}" required></label>
      <p class="maly cichy" style="margin:0 0 6px">Wpisz tylko to, co masz. Puste pola się nie zapiszą. Szare liczby to Twój poprzedni wynik.</p>
      ${GRUPY_POMIAROW.map((g) => `
        <fieldset class="grupa-pomiarow">
          <legend>${esc(g.nazwa)}</legend>
          ${g.rada ? `<p class="maly cichy" style="margin:0 0 8px">${esc(g.rada)}</p>` : ''}
          <div class="pola-pomiarow">
          ${POMIARY.filter((d) => d.grupa === g.id).map((d) => `
            <label class="pole-pomiaru">
              <span>${esc(d.nazwa)}${d.rada ? `<small>${esc(d.rada)}</small>` : ''}</span>
              <span class="wpis"><input type="text" inputmode="decimal" autocomplete="off" name="${d.id}" value="${edytowany && typeof edytowany.wartosci[d.id] === 'number' ? fmt(edytowany.wartosci[d.id], 2) : ''}" placeholder="${typeof ostatnie[d.id] === 'number' ? fmt(ostatnie[d.id], d.dzies ?? 1) : ''}"><em>${esc(d.jedn)}</em></span>
            </label>`).join('')}
          </div>
        </fieldset>`).join('')}
      <button class="btn btn-kreda btn-pelny" type="submit">Zapisz pomiar</button>
    </form>`);

  a.el.querySelector('[data-pomiar]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const wartosci = {};
    const zle = [];
    for (const d of POMIARY) {
      const surowe = String(f.get(d.id) || '').trim().replace(',', '.');
      if (!surowe) continue;
      const v = Number(surowe);
      if (!Number.isFinite(v) || v < d.min || v > d.max) { zle.push(d.nazwa); continue; }
      wartosci[d.id] = v;
    }
    if (zle.length) { toast(`Sprawdź: ${zle.join(', ')}`, 3500); return; }
    if (!Object.keys(wartosci).length) { toast('Wpisz przynajmniej jedną wartość'); return; }
    const [r, m, dd] = String(f.get('data')).split('-').map(Number);
    const data = new Date(r, m - 1, dd, 8, 0, 0).toISOString();
    zmien((x) => {
      if (edytowany) {
        const p = x.pomiary.find((q) => q.id === edytowany.id);
        p.data = data;
        p.wartosci = wartosci;
      } else {
        x.pomiary.push({ id: Date.now().toString(36), data, wartosci });
      }
      // Najświeższa waga zasila XP za ćwiczenia z masą ciała (dipy, podciąganie).
      const zWaga = x.pomiary.filter((p) => typeof p.wartosci.waga === 'number').sort((p, q) => p.data.localeCompare(q.data));
      if (zWaga.length) x.ustawienia.masaCiala = zWaga[zWaga.length - 1].wartosci.waga;
    });
    a.zamknij();
    toast(edytowany ? 'Pomiar poprawiony' : 'Pomiar zapisany');
    if (wartosci[wybrana] === undefined) wybrana = Object.keys(wartosci)[0];
    ekranPomiary(el);
  });
}
