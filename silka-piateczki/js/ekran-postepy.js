// Postępy: odznaki, rekordy z wykresami, historia i ustawienia z kopią.

import { ODZNAKI, OBSZARY } from './dane.js';
import { pobierz, zmien, cwiczenie, eksport, importuj, wyczysc } from './magazyn.js';
import { statystyki, fmtKg, tonaz } from './logika.js';
import { esc, kolor, godloOdznaki, toast, arkusz, dataLadnie } from './ui.js';
import { punktyCwiczenia, mini } from './wykres.js';
import { szczegoly } from './arkusze.js';
import { wspierane, wlaczone, wlacz, wylacz, zablokowane } from './przypomnienia.js';

export function ekranPostepy(el) {
  const s = pobierz();
  const st = statystyki(s);
  const robione = [...new Set(s.treningi.flatMap((t) => t.cwiczenia.map((c) => c.cw)))]
    .map((id) => ({ id, c: cwiczenie(id), punkty: punktyCwiczenia(s.treningi, id) }))
    .filter((x) => x.c && x.punkty.length)
    .sort((a, b) => Object.keys(OBSZARY).indexOf(a.c.obszar) - Object.keys(OBSZARY).indexOf(b.c.obszar));

  el.innerHTML = `
    <h1>Postępy</h1>
    <div class="licznik" style="grid-template-columns:repeat(3,1fr)">
      <div class="kafel"><div class="kafel-tytul">Treningi</div><div class="kafel-wartosc">${st.treningi}</div></div>
      <div class="kafel"><div class="kafel-tytul">Rekordy</div><div class="kafel-wartosc">${st.rekordy}</div></div>
      <div class="kafel"><div class="kafel-tytul">Rozciągania</div><div class="kafel-wartosc">${st.rozciagania}</div></div>
    </div>

    <section class="sekcja">
      <div class="sekcja-tytul"><h2>Odznaki</h2><span class="cichy maly">${Object.keys(s.odznaki).length} z ${ODZNAKI.length}</span></div>
      <div class="odznaki">
        ${ODZNAKI.map((o, i) => `<div class="odznaka ${s.odznaki[o.id] ? '' : 'zablokowana'}">${godloOdznaki(i)}<b>${esc(o.nazwa)}</b>${esc(o.opis)}</div>`).join('')}
      </div>
    </section>

    <section class="sekcja">
      <div class="sekcja-tytul"><h2>Rekordy</h2></div>
      ${robione.length ? `<ul class="rekordy">${robione.map(({ id, c, punkty }) => {
        const n = punkty.reduce((a, p) => (p.wartosc > a.wartosc ? p : a));
        const opis = n.zCiezarem ? `${fmtKg(n.najlepsza.kg)} kg × ${n.najlepsza.powt}` : `${n.najlepsza.powt} ${c.jednostka === 's' ? 's' : 'powt.'}`;
        return `<li><button type="button" data-cw="${esc(id)}" style="--kolor:${kolor(c.obszar)}">
          <span><b>${esc(c.nazwa)}</b><span class="maly cichy">Najlepiej <span class="liczba" style="color:var(--kreda);font-size:17px">${opis}</span></span></span>
          ${mini(punkty, kolor(c.obszar))}
        </button></li>`;
      }).join('')}</ul>` : '<div class="pusto">Zrób pierwszy trening, a tu pojawią się Twoje rekordy z wykresami.</div>'}
    </section>

    <section class="sekcja">
      <div class="sekcja-tytul"><h2>Historia</h2></div>
      ${s.treningi.length ? `<ul class="historia">${[...s.treningi].reverse().slice(0, 30).map((t) => `
        <li><details>
          <summary><span><b>Trening ${esc(t.plan)}</b><br><span class="maly cichy">${dataLadnie(t.data)}</span></span>
          <span style="text-align:right"><span class="liczba" style="font-size:20px">+${t.xp} XP</span><br><span class="maly cichy">${t.rekordy.length ? `${t.rekordy.length} rek., ` : ''}${fmtKg(Math.round(tonaz(t)))} kg</span></span></summary>
          <table>${t.cwiczenia.map((c) => `<tr><td>${esc(cwiczenie(c.cw)?.nazwa || c.cw)}${t.rekordy.some((r) => r.cw === c.cw) ? ' <span style="color:var(--t-zolta)">rekord</span>' : ''}</td><td>${c.serie.map((x) => `${fmtKg(x.kg)}×${x.powt}`).join(', ')}</td></tr>`).join('')}</table>
          <button class="btn-tekst btn-zagrozenie" type="button" data-usun="${esc(t.id)}">Usuń ten trening</button>
        </details></li>`).join('')}</ul>` : '<div class="pusto">Jeszcze pusto. Pierwszy trening czeka w zakładce Trening.</div>'}
    </section>

    <section class="sekcja">
      <div class="sekcja-tytul"><h2>Ustawienia</h2></div>
      <div class="ustawienia">
        <label class="wiersz-ust"><span>Odpoczynek między seriami</span>
          <select data-przerwa>${[60, 75, 90, 120, 150, 180].map((v) => `<option value="${v}" ${v === s.ustawienia.przerwa ? 'selected' : ''}>${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}</option>`).join('')}</select>
        </label>
        ${wspierane() ? `<div class="wiersz-ust"><span>Przypomnienie o przerwie<br><span class="maly cichy">${zablokowane() ? 'Powiadomienia są zablokowane w ustawieniach strony w Chrome.' : 'Push o 17:00 po 4 i 5 dniach bez treningu'}</span></span><button class="przelacznik" type="button" role="switch" aria-checked="${wlaczone()}" data-push aria-label="Przypomnienie o przerwie"></button></div>` : ''}
        <div class="wiersz-ust"><span>Dźwięki</span><button class="przelacznik" type="button" role="switch" aria-checked="${s.ustawienia.dzwiek}" data-dzwiek aria-label="Dźwięki"></button></div>
        <div class="wiersz-ust" style="display:grid;gap:8px">
          <span>Kopia zapasowa<br><span class="maly cichy">Dane są tylko w tym telefonie. Zrób kopię przed zmianą telefonu albo czyszczeniem przeglądarki.</span></span>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn" type="button" data-eksport>Zapisz kopię</button>
            <label class="btn" style="cursor:pointer">Wczytaj kopię<input type="file" accept="application/json,.json" data-import hidden></label>
          </div>
        </div>
        <button class="btn-tekst btn-zagrozenie" type="button" data-wyczysc>Wyczyść wszystkie dane</button>
      </div>
    </section>`;

  el.querySelectorAll('[data-cw]').forEach((b) => b.addEventListener('click', () => szczegoly(b.dataset.cw)));
  el.querySelector('[data-przerwa]').addEventListener('change', (e) => { zmien((x) => { x.ustawienia.przerwa = Number(e.target.value); }); toast('Zapisane'); });
  el.querySelector('[data-dzwiek]').addEventListener('click', (e) => {
    zmien((x) => { x.ustawienia.dzwiek = !x.ustawienia.dzwiek; });
    e.currentTarget.setAttribute('aria-checked', String(pobierz().ustawienia.dzwiek));
  });
  el.querySelector('[data-push]')?.addEventListener('click', async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    try {
      if (wlaczone()) { await wylacz(); toast('Przypomnienia wyłączone'); } else {
        const daty = s.treningi.map((t) => t.data).sort();
        await wlacz(daty[daty.length - 1]);
        toast('Przypomnienia włączone');
      }
    } catch (err) {
      toast(err.message || 'Nie udało się zmienić przypomnień', 4000);
    }
    b.disabled = false;
    b.setAttribute('aria-checked', String(wlaczone()));
  });
  el.querySelector('[data-eksport]').addEventListener('click', () => {
    const blob = new Blob([eksport()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `silka-piateczki-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Kopia zapisana w Pobranych');
  });
  el.querySelector('[data-import]').addEventListener('change', async (e) => {
    const plik = e.target.files[0];
    if (!plik) return;
    try {
      importuj(await plik.text());
      toast('Kopia wczytana');
      ekranPostepy(el);
    } catch (err) {
      toast(err.message.includes('Siłki') ? err.message : 'Ten plik nie jest kopią Siłki Piąteczki');
    }
  });
  el.querySelectorAll('[data-usun]').forEach((b) => b.addEventListener('click', () => {
    pytaj('Usunąć ten trening?', 'Zniknie z historii razem z jego XP i rekordami.', 'Usuń trening', () => {
      zmien((x) => { x.treningi = x.treningi.filter((t) => t.id !== b.dataset.usun); });
      ekranPostepy(el);
    });
  }));
  el.querySelector('[data-wyczysc]').addEventListener('click', () => {
    pytaj('Wyczyścić wszystko?', 'Znikną treningi, rekordy, odznaki i Twoje zmiany w planach. Tego nie da się cofnąć, chyba że masz kopię.', 'Wyczyść dane', () => {
      wyczysc();
      location.hash = '#/start';
    });
  });
}

function pytaj(tytul, tekst, przycisk, tak) {
  const a = arkusz(`
    <h2>${esc(tytul)}</h2><p class="cichy">${esc(tekst)}</p>
    <div style="display:grid;gap:8px">
      <button class="btn btn-zagrozenie btn-pelny" type="button" data-tak>${esc(przycisk)}</button>
      <button class="btn btn-pelny" type="button" data-zamknij>Wróć</button>
    </div>`);
  a.el.querySelector('[data-tak]').addEventListener('click', () => { a.zamknij(); tak(); });
}
