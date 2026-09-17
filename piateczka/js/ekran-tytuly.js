/* ==========================================================================
   Ekran „Tytuły”: MVP, Gracz Miesiąca, katalog przydomków i Puchar.

   Katalog na dole jest jednocześnie instrukcją: każdy przydomek ma godło,
   hasło i dokładny warunek, jaki trzeba spełnić, żeby go dostać.
   ========================================================================== */

import { GRACZE, gracz, imieW, poPolsku, krotkaData, SEZON } from './dane.js';
import { graczMiesiaca, przydomkiGraczy, przydomekGracza, historiaMvp, mojePrzydomki, PRZYDOMKI, POZIOMY, godlo } from './tytuly.js';
import { wybory as wyboryPrzydomkow } from './baza.js';
import { listaWyboru, podepnijWybor } from './wybor-przydomka.js';
import { rekordySezonu } from './liczenie.js';
import { naglowekZPomoca, dymek } from './pomoc.js';
import { arkusz, bez, odmianaWygranych, odmianaMeczow } from './ui.js';

export function render(kontener, ctx) {
  const { aktualny, wToku, wszystkie } = graczMiesiaca(ctx.wieczory);
  const mvpy = historiaMvp(ctx.wieczory);

  kontener.innerHTML = `
    <div class="ekran-naglowek">
      <h1>Tytuły</h1>
      <p class="podtytul">Jeden wieczór, jeden miesiąc, cały sezon</p>
    </div>

    ${kartaBigBossa(aktualny, wToku, ctx.wieczory, ctx.wybory)}
    ${kartaDruzyna(ctx.wieczory, ctx.wybory)}
    ${kartaMvp(mvpy)}
    ${kartaRekordy(rekordySezonu(ctx.wieczory), ctx.wieczory)}
    ${kartaHistorii(wszystkie)}
    ${kartaPucharu()}
    ${kartaSezonu()}
    ${kartaKatalogu()}`;

  kontener.querySelectorAll('[data-przydomek]').forEach((el) =>
    el.addEventListener('click', () => opisPrzydomka(el.dataset.przydomek)));

  kontener.querySelectorAll('[data-kto]').forEach((el) =>
    el.addEventListener('click', () => kartaGracza(el.dataset.kto, ctx.wieczory)));
}

/* ------------------------------------------------------- Gracz Miesiąca */

function kartaBigBossa(aktualny, wToku, wieczory, wybory) {
  // Po jednym wtorku ktoś już prowadzi i od razu dostaje odznakę. Różnica jest
  // tylko w podpisie: zamknięty miesiąc = tytuł pewny, bieżący = „na żywo".
  const okres = aktualny ?? (wToku?.zwyciezca ? wToku : null);
  if (!okres) {
    return `<section class="karta karta-boss pusta">
      ${naglowekZPomoca('Gracz Miesiąca', 'bigboss')}
      <p class="pusto">Pierwszy Gracz Miesiąca zostanie koronowany, gdy tylko rozegracie pierwszy wtorek.</p>
    </section>`;
  }
  const biezacy = !aktualny;
  // Odznaka bossa pokazuje przydomek, który zwycięzca AKTUALNIE nosi (z jego
  // wyborem), a nie sztywno auto-najlepszy: żeby zgadzało się z kartą drużyny.
  const p = przydomekGracza(okres.zwyciezca.id, wieczory, wybory) ?? okres.przydomek;
  return `<section class="karta karta-boss">
    ${naglowekZPomoca('Gracz Miesiąca', 'bigboss', { dodatek: biezacy
      ? '<span class="plakietka-live">na żywo</span>' : '' })}
    <div class="boss-tresc">
      <div class="boss-godlo">${godlo(p?.id ?? null, { rozmiar: 96, reign: true })}</div>
      <div class="boss-opis">
        <strong class="boss-imie">${gracz(okres.zwyciezca.id).imie}</strong>
        <span class="boss-przydomek">${p ? `„${bez(p.nazwa)}”` : 'bez przydomka'}</span>
        <span class="boss-haslo">${p ? bez(p.haslo) : 'Wygrywa, ale na ksywkę jeszcze nie zapracował'}</span>
        <span class="boss-okres">${biezacy ? 'Prowadzi · ' : ''}${okres.nazwa} · ${okres.zwyciezca.meczeW} ${odmianaWygranych(okres.zwyciezca.meczeW)}</span>
        ${p ? `<button class="btn btn-maly" type="button" data-przydomek="${p.id}">Za co ten przydomek?</button>` : ''}
      </div>
    </div>
    ${biezacy ? `<p class="boss-nota">To układ na dziś, tytuł zamknie się z końcem miesiąca.
      Do tego czasu każdy dobry wieczór może go przejąć.</p>` : (wToku?.zwyciezca ? `<p class="boss-nota">
      W bieżącym okresie (${wToku.nazwa}) prowadzi <b>${gracz(wToku.zwyciezca.id).imie}</b>,
      ${wToku.zwyciezca.meczeW} ${odmianaWygranych(wToku.zwyciezca.meczeW)}.</p>` : '')}
  </section>`;
}

/* --------------------------------------------------------------- MVP */

function kartaDruzyna(wieczory, wybory) {
  const mapa = przydomkiGraczy(wieczory, wybory);
  return `<section class="karta">
    ${naglowekZPomoca('Przydomki', 'przydomki')}
    <div class="druzyna">
      ${GRACZE.map((g) => {
        const { przydomek: p, reign } = mapa.get(g.id);
        return `<button class="druzyna-kafel ${reign ? 'druzyna-krol' : ''} ${p ? '' : 'druzyna-pusty'}"
          type="button" data-kto="${g.id}">
          ${godlo(p?.id ?? null, { rozmiar: 60, reign })}
          <b>${gracz(g.id).imie}</b>
          <em>${p ? bez(p.nazwa) : 'bez przydomka'}</em>
          ${reign ? '<span class="druzyna-krol-tag">👑 Gracz Miesiąca</span>' : ''}
        </button>`;
      }).join('')}
    </div>
    <p class="wskazowka">Na starcie nikt nie ma przydomka, trzeba sobie zasłużyć albo przechlapać.
    Kto jest Graczem Miesiąca, tego godło świeci i dostaje koronę. <b>Dotknij kafelka,
    żeby zobaczyć wszystkie swoje przydomki i wybrać, który nosisz.</b></p>
  </section>`;
}

function kartaMvp(mvpy) {
  return `<section class="karta">
    ${naglowekZPomoca('MVP wieczorów', 'mvp')}
    ${mvpy.length ? `<ul class="lista-mvp">
      ${mvpy.slice(0, 12).map((x) => `<li>
        <span class="mvp-data">${krotkaData(x.data)}</span>
        <span class="mvp-kto">${x.mvp.gracze.map((i) => bez(gracz(i).imie)).join(' i ')}</span>
        <span class="mvp-liczba">${x.mvp.wygrane} W</span>
      </li>`).join('')}
    </ul>` : '<p class="pusto">Pierwszy MVP czeka na pierwszy rozegrany wtorek.</p>'}
  </section>`;
}

/* ------------------------------------------------------------- rekordy */

function kartaRekordy(rek, wieczory) {
  if (!rek) return '';
  const im = (id) => bez(gracz(id).imie);
  // Dopisane osoby żyją tylko w swoim wieczorze, więc imię trzeba wziąć stamtąd
  // bo inaczej w rekordzie wyświetliłoby się surowe „gosc1”.
  const imDnia = (id, data) => bez(imieW(wieczory.find((w) => w.data === data), id));
  const para = (ids, data) => ids.map((id) => imDnia(id, data)).join(' + ');
  const wiersze = [];
  if (rek.najlepszyWieczor) wiersze.push(['🔥', 'Najlepszy wieczór',
    `${im(rek.najlepszyWieczor.id)} · ${rek.najlepszyWieczor.wygrane}W-${rek.najlepszyWieczor.przegrane}P · ${poPolsku(rek.najlepszyWieczor.data)}`]);
  if (rek.najwiekszyPogrom) wiersze.push(['💥', 'Największy pogrom',
    `${para(rek.najwiekszyPogrom.wygrani, rek.najwiekszyPogrom.data)} rozbili `
    + `${para(rek.najwiekszyPogrom.przegrani, rek.najwiekszyPogrom.data)} · różnica ${rek.najwiekszyPogrom.roznica}`]);
  if (rek.najdluzszaSeria) wiersze.push(['🚂', 'Najdłuższa seria zwycięstw',
    `${im(rek.najdluzszaSeria.id)} · ${rek.najdluzszaSeria.dlugosc} ${odmianaMeczow(rek.najdluzszaSeria.dlugosc)} z rzędu`]);
  if (rek.najlepszyDuet) wiersze.push(['🤝', 'Najlepszy duet',
    `${rek.najlepszyDuet.para.map(im).join(' + ')} · ${rek.najlepszyDuet.wygrane}W-${rek.najlepszyDuet.przegrane}P razem`]);
  if (!wiersze.length) return '';
  return `<section class="karta">
    <h2 class="karta-tytul">Rekordy sezonu</h2>
    <ul class="rekordy">
      ${wiersze.map(([ikona, tytul, opis]) => `<li>
        <span class="rekord-ikona" aria-hidden="true">${ikona}</span>
        <span class="rekord-tresc"><b>${tytul}</b><em>${opis}</em></span>
      </li>`).join('')}
    </ul>
  </section>`;
}

/* ------------------------------------------------------------ historia */

function kartaHistorii(okresy) {
  const zamkniete = okresy.filter((o) => o.zwyciezca);
  if (!zamkniete.length) return '';
  return `<section class="karta">
    <h2 class="karta-tytul">Galeria Graczy Miesiąca</h2>
    <ul class="lista-bossow">
      ${zamkniete.slice().reverse().map((o) => `<li>
        <span class="mini-godlo">${godlo(o.przydomek?.id ?? null, { rozmiar: 34, reign: true })}</span>
        <span class="boss-wiersz">
          <b>${gracz(o.zwyciezca.id).imie}</b>${o.przydomek ? ` „${bez(o.przydomek.nazwa)}”` : ''}
          <em>${o.nazwa}${o.otwarty ? ' · w toku' : ''}</em>
        </span>
        <span class="mvp-liczba">${o.zwyciezca.meczeW} W</span>
      </li>`).join('')}
    </ul>
  </section>`;
}

/* -------------------------------------------------------------- Puchar */

function kartaPucharu() {
  return `<section class="karta karta-puchar">
    ${naglowekZPomoca('Puchar Pana Piąteczki', 'puchar')}
    <p>Turniej Pana Piąteczki kończy się Pucharem Pana Piąteczki, czyli singlowym wieczorem
    ${poPolsku(SEZON.final)}, każdy z każdym, rozstawienie według tabeli.</p>
    <p class="wskazowka">Mistrz sezonu i zdobywca Pucharu to mogą być dwie różne osoby.
    Sezon nagradza regularność, a Puchar jeden dobry wieczór.</p>
  </section>`;
}

/* Wejście do zbiorczego podsumowania sezonu. Stoi pod Pucharem, bo to
   ta sama półka: rzeczy, które domykają sezon. */
function kartaSezonu() {
  return `<section class="karta karta-sezon-wejscie">
    <div class="boss-opis">
      <span class="plakietka-etykieta">Na koniec sezonu</span>
      <strong>Podsumowanie sezonu</strong>
      <span class="cichy">Mistrzowie, rekordy i liczby, gotowe do wysłania na grupę.</span>
    </div>
    <a class="btn btn-obrys" href="#/sezon">Zobacz</a>
  </section>`;
}

/* ------------------------------------------------------------- katalog */

function kartaKatalogu() {
  const grupy = [
    ['braz', '🥉 Brąz: pocieszne, za pech i słabszą passę'],
    ['srebro', '🥈 Srebro: solidne, tu już coś umiesz'],
    ['zloto', '🥇 Złoto: wyczyn'],
  ];
  return `<section class="karta">
    ${naglowekZPomoca('Wszystkie przydomki', 'przydomki')}
    <p class="wskazowka">Na starcie nikt nie ma przydomka. Zakwalifikujesz się na lepszy, to stary znika.
    Dotknij godła, żeby zobaczyć pełny opis i warunek.</p>
    ${grupy.map(([poz, tytul]) => `
      <h4 class="katalog-grupa">${tytul}</h4>
      <div class="katalog">
        ${PRZYDOMKI.filter((p) => p.poziom === poz).map((p) => `
          <button class="katalog-kafel" type="button" data-przydomek="${p.id}">
            ${godlo(p.id, { rozmiar: 56 })}
            <b>${p.nazwa}</b>
            <em>${p.haslo}</em>
          </button>`).join('')}
      </div>`).join('')}
  </section>`;
}

function opisPrzydomka(id) {
  const p = PRZYDOMKI.find((x) => x.id === id);
  if (!p) return;
  arkusz({
    tytul: `„${bez(p.nazwa)}”`,
    tresc: `<div class="arkusz-godlo">${godlo(p.id, { rozmiar: 96 })}</div>
      <p class="arkusz-poziom">${{ zloto: '🥇 Złoto', srebro: '🥈 Srebro', braz: '🥉 Brąz' }[p.poziom]}</p>
      <p class="arkusz-haslo">${bez(p.haslo)}</p>
      <p>${bez(p.opis)}</p>
      <p class="pomoc-nota">Przydomki liczą się same, z Twoich wyników. Domyślnie nosisz najlepszy,
      na jaki się łapiesz, ale jak masz kilka, możesz wybrać swój ulubiony na karcie gracza.</p>`,
  });
}

/* --------------------------------------------- karta jednego zawodnika */

/** Wszystko, co dany gracz ma aktualnie trafione, plus wybór noszonego.
    Noszony jest jeden, ale warunki bywają spełnione równolegle i to też
    warto widzieć, a przy dwóch i więcej gracz może sam wskazać, co nosi. */
export function kartaGracza(id, wieczory) {
  const { trafione, noszonyId, reczny } = mojePrzydomki(id, wieczory, wyboryPrzydomkow());
  const a = arkusz({
    tytul: `${bez(gracz(id).imie)}: przydomki`,
    tresc: trafione.length ? `
      ${listaWyboru({ id, trafione, noszonyId, reczny })}
      <p class="pomoc-nota">Trafionych może być kilka, ale nosi się jeden. Warunki liczą się
      z wszystkich meczów, debla i singla razem. Osobno patrzą tylko „Mistrz Pedałowania”
      i „Samotny Wilk”, bo te dwa porównują oba tryby.</p>`
      : `<p class="pusto">Nic jeszcze nie wpadło. Warunki liczą się z wszystkich meczów,
        debla i singla razem.</p>`,
  });
  podepnijWybor(a.el, () => kartaGracza(id, wieczory));
}
