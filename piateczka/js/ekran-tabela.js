/* ==========================================================================
   Ekran „Tabela”: oficjalna klasyfikacja sezonu.

   Dwie osobne rozgrywki: debel i singiel. Przełącznik u góry, a niżej
   zakres (generalna / runda). Kolejność: zwycięstwa → sety → punkty →
   mecz bezpośredni.
   ========================================================================== */

import { gracz, SEZON } from './dane.js';
import { klasyfikacja, wFiltrze, TRYBY, mecze, trybMeczu, wynikMeczu } from './liczenie.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { arkusz, bez, odmianaMeczow } from './ui.js';
import { iskra, kolorGracza } from './wykresy.js';
import { mojePrzydomki, godlo } from './tytuly.js';
import { wybory as wyboryPrzydomkow } from './baza.js';
import { listaWyboru, podepnijWybor } from './wybor-przydomka.js';
import { znaczekSerii, przelicz } from './elo.js';
import { ZDARZENIA, statystykiSezonu, ileSedziowanych, skutecznosc } from './sedzia.js';

let zakres = 'sezon';
let tryb = 'debel';

const ZAKRESY = [
  { id: 'sezon', nazwa: 'Cały sezon' },
  ...SEZON.rundy.map((r) => ({ id: r.id, nazwa: r.nazwa, od: r.od, do: r.do })),
];

export function render(kontener, ctx) {
  const wybrany = ZAKRESY.find((z) => z.id === zakres) ?? ZAKRESY[0];
  const wieczory = wFiltrze(ctx.wieczory, { od: wybrany.od, do: wybrany.do })
    .filter((w) => !w.towarzyski);
  // W tabeli pokazujemy TYLKO tych, którzy w tym trybie w ogóle zagrali.
  // Zagraliście singla we dwóch, to reszta się tu nie pojawia.
  const pelna = klasyfikacja(wieczory, { tryb });
  const tabela = pelna.filter((r) => r.mecze > 0);
  const cokolwiek = tabela.length > 0;
  const { seria } = przelicz(ctx.wieczory, tryb);
  const ileMeczow = wieczory.reduce((s, w) =>
    s + mecze(w).filter((m) => trybMeczu(m) === tryb && wynikMeczu(m).rozegrany).length, 0);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Tabela</h1>
      <p class="podtytul">Sezon ${SEZON.nazwa} · ${ileMeczow} ${odmianaMeczow(ileMeczow)} ${tryb === 'debel' ? 'debla' : 'singla'}</p>
    </div>

    <div class="przelacznik-trybu" role="tablist" aria-label="Rodzaj gry">
      ${TRYBY.map((t) => `<button class="tryb-przycisk ${t.id === tryb ? 'wybrany' : ''}" type="button"
        role="tab" aria-selected="${t.id === tryb}" data-tryb="${t.id}">
        <span aria-hidden="true">${t.id === 'debel' ? '👥' : '🙋'}</span>${t.nazwa}</button>`).join('')}
      ${dymek('tryby')}
    </div>

    <div class="chipy chipy-zakres">
      ${ZAKRESY.map((z) => `<button class="chip ${z.id === zakres ? 'wybrany' : ''}" type="button"
        data-zakres="${z.id}">${z.nazwa}</button>`).join('')}
    </div>

    <section class="karta">
      ${naglowekZPomoca('Klasyfikacja', 'punktacja', { dodatek: '<span class="cichy naglowek-nota">wg zwycięstw</span>' })}
      ${cokolwiek ? `<ol class="tabela">
        ${tabela.map((r) => wiersz(r, ctx.ja, seria[r.id] ?? 0)).join('')}
      </ol>
      <p class="wskazowka">Dotknij wiersza, żeby zobaczyć szczegóły gracza.</p>`
      : `<p class="pusto">Nic tu jeszcze nie rozegrano. ${tryb === 'singiel'
          ? 'Singla dorzucisz przyciskiem „Dograj mecz” na ekranie'
          : 'Pierwszy wynik wpiszecie na ekranie'} <a href="#/wieczor">Wieczór</a>.</p>`}
    </section>

    <section class="karta">
      ${naglowekZPomoca('Skąd się bierze kolejność', 'punktacja')}
      <ol class="lista-kryteriow">
        <li><b>Wygrane mecze</b>: to jest waluta. 15:2 i 15:13 znaczą tyle samo.</li>
        <li><b>Wygrane sety</b>: kto urywał więcej, ten wyżej.</li>
        <li><b>Zdobyte punkty</b>: dopiero tutaj liczą się liczby z tablicy.</li>
        <li><b>Mecz bezpośredni</b>: jak wszystko równe, decyduje, kto kogo ogrywał.</li>
      </ol>
      <p class="wskazowka">Punkty stracone nie liczą się w ogóle. Przegrana to przegrana,
      a to, że przegrałeś na styku, widać w 🏸ELO🏸.</p>
    </section>`;

  kontener.querySelectorAll('[data-tryb]').forEach((el) =>
    el.addEventListener('click', () => { tryb = el.dataset.tryb; ctx.odswiez(); }));

  kontener.querySelectorAll('[data-zakres]').forEach((el) =>
    el.addEventListener('click', () => { zakres = el.dataset.zakres; ctx.odswiez(); }));

  kontener.querySelectorAll('[data-gracz]').forEach((el) =>
    el.addEventListener('click', () => szczegoly(el.dataset.gracz, tabela, ctx.wieczory, tryb)));
}

function wiersz(r, ja, seria) {
  const narastajaco = [];
  let suma = 0;
  for (const h of r.historia) { suma += h.w; narastajaco.push(suma); }
  const znak = znaczekSerii(seria);
  return `<li class="wiersz ${r.id === ja ? 'to-ja' : ''} podium-${r.miejsce <= 3 ? r.miejsce : 'x'}"
    data-gracz="${r.id}" tabindex="0" role="button">
    <span class="miejsce">${r.miejsce}</span>
    <span class="wiersz-glowna">
      <span class="wiersz-imie">${gracz(r.id).imie}${znak ? `<b class="seria-znak">${znak}</b>` : ''}</span>
      <span class="wiersz-detal">sety ${r.setyW}:${r.setyP} · ${r.zdobyte} pkt · ${r.mecze} ${odmianaMeczow(r.mecze)}</span>
    </span>
    ${iskra(narastajaco, kolorGracza(r.id))}
    <span class="wiersz-wygrane"><b>${r.meczeW}</b><em>W</em></span>
  </li>`;
}

function szczegoly(id, tabela, wieczory, tryb) {
  const r = tabela.find((x) => x.id === id);
  if (!r) return;
  const zagr = statystykiSezonu(wieczory, { tryb }).get(id);
  const sedziowanych = ileSedziowanych(wieczory, { tryb });
  const lista = (obj, pusty) => {
    const wpisy = Object.entries(obj).filter(([, b]) => b.w + b.p > 0);
    if (!wpisy.length) return `<p class="pomoc-nota">${pusty}</p>`;
    return `<ul class="lista-prosta">${wpisy
      .sort((a, b) => (b[1].w - b[1].p) - (a[1].w - a[1].p))
      .map(([pid, b]) => `<li><span>${bez(gracz(pid).imie)}</span>
        <b class="${b.w > b.p ? 'plus' : b.w < b.p ? 'minus' : 'zero'}">${b.w}:${b.p}</b></li>`).join('')}</ul>`;
  };

  const { trafione, noszonyId, reczny } = mojePrzydomki(id, wieczory, wyboryPrzydomkow());
  const p = trafione.find((x) => x.id === noszonyId) ?? null;
  const procentWygranych = r.mecze ? Math.round((r.meczeW / r.mecze) * 100) : 0;
  const a = arkusz({
    tytul: `${bez(gracz(id).imie)}: szczegóły`,
    tresc: `
      <div class="szczegoly-przydomek">
        ${godlo(p?.id ?? null, { rozmiar: 60 })}
        <b>${p ? bez(p.nazwa) : 'Bez przydomka'}</b>
        <em>${p ? bez(p.haslo) : 'Jeszcze nic nie wpadło, zagraj kilka meczów'}</em>
      </div>
      ${trafione.length > 1 ? `<h4>Twoje przydomki</h4>
        ${listaWyboru({ id, trafione, noszonyId, reczny })}` : ''}
      <p class="pomoc-nota">Przydomki liczą się z wszystkich meczów, debla i singla razem.
      Oba tryby porównują tylko „Mistrz Pedałowania” i „Samotny Wilk”.</p>
      <div class="statystyki">
        <div><span>${r.meczeW}</span><em>wygranych</em></div>
        <div><span>${r.meczeP}</span><em>przegranych</em></div>
        <div><span>${procentWygranych}%</span><em>skuteczność</em></div>
        <div><span>${r.setyW}:${r.setyP}</span><em>sety</em></div>
        <div><span>${r.zdobyte}</span><em>zdobyte pkt</em></div>
        <div><span>${r.najdluzszaSeria}</span><em>najdłuższa seria</em></div>
      </div>
      ${zagr && zagr.razem ? `<h4>Zagrania ${dymek('sedzia')}</h4>
        <ul class="lista-prosta lista-zagran-staty">
          ${ZDARZENIA.map((z) => `<li><span>${z.ikona} ${z.nazwa}</span>
            <b class="${zagr[z.id] ? (z.dobre ? 'plus' : 'minus') : 'zero'}">${zagr[z.id]}</b></li>`).join('')}
          <li><span><b>Zagrania wygrywające</b></span>
            <b class="plus">${skutecznosc(zagr).procent}%</b></li>
        </ul>
        <p class="pomoc-nota">Z ${sedziowanych} ${sedziowanych === 1 ? 'sędziowanego meczu' : 'sędziowanych meczów'}.
        Nie liczy się do tabeli ani do 🏸ELO🏸.</p>` : ''}
      <h4>W parze z kim (bilans W:P)</h4>
      ${lista(r.partnerzy, 'W tym trybie nie było jeszcze partnerów, singla gra się samemu.')}
      <h4>Przeciw komu (bilans W:P)</h4>
      ${lista(r.przeciwnicy, 'Brak rozegranych meczów.')}
      <p class="pomoc-nota">Na plus to Ty jesteś ich zmorą, na minus oni Twoją.</p>`,
  });
  podepnijWybor(a.el, () => szczegoly(id, tabela, wieczory, tryb));
}
