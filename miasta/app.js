/* ==========================================================================
   Gacha Miast — logika losowania
   Stan mieści się w kilku polach: wybrane kontynenty, wybrana litera i pamięć
   tego, co już padło. Reszta to rysowanie.
   ========================================================================== */

const KLUCZ = 'gm:';
const LOSOWA = '*';                 // „dowolna litera" — kostka w siatce
const HISTORIA_MAX = 14;

/* Pierwsza litera bez ogonków: Łódź trafia pod L, Örebro pod O. */
function litera(nazwa) {
  return nazwa
    .replace(/^Ł/, 'L')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .charAt(0)
    .toUpperCase();
}

const ALFABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

/* Surowe wiersze z dane.js na obiekty — reszta kodu nie musi pamiętać kolejności kolumn. */
const miasta = MIASTA.map(([nazwa, kraj, flaga, kontynent, ludnosc, opis]) => ({
  nazwa, kraj, flaga, kontynent, ludnosc, opis, litera: litera(nazwa),
}));

const komentarze = [
  'Pakuj plecak.',
  'Bilety same się nie kupią.',
  'Tam naprawdę jest co robić.',
  'Dobre losowanie. Sugoi!',
  'Zapisz sobie na później.',
  'To by było na tyle w kategorii wymówek.',
  'Rzadko wypada tak dobrze.',
  'Yatta! Kolejny punkt na mapie.',
  'Sprawdź loty, zanim ktoś inny sprawdzi.',
  'Wygląda na plan na długi weekend.',
];

/* --------------------------------------------------------------------- stan */

const stan = {
  kontynenty: wczytaj('kontynenty', []),   // pusto = cały świat
  litera: wczytaj('litera', LOSOWA),
  historia: wczytaj('historia', []),
  wyczerpane: wczytaj('wyczerpane', {}),   // klucz puli → nazwy już wylosowane
  ostatnie: null,
};

function wczytaj(nazwa, domyslne) {
  try {
    const surowe = localStorage.getItem(KLUCZ + nazwa);
    return surowe ? JSON.parse(surowe) : domyslne;
  } catch { return domyslne; }
}

function zapisz(nazwa, wartosc) {
  try { localStorage.setItem(KLUCZ + nazwa, JSON.stringify(wartosc)); } catch { /* tryb prywatny */ }
}

/* ------------------------------------------------------------------ selekcja */

function wKontynentach(m) {
  return stan.kontynenty.length === 0 || stan.kontynenty.includes(m.kontynent);
}

/* Miasta pasujące do bieżących filtrów. */
function pula() {
  return miasta.filter((m) => wKontynentach(m) && (stan.litera === LOSOWA || m.litera === stan.litera));
}

function kluczPuli() {
  const k = stan.kontynenty.length ? [...stan.kontynenty].sort().join('+') : 'swiat';
  return `${k}|${stan.litera}`;
}

/* --------------------------------------------------------------------- DOM */

const el = {
  kontynenty: document.getElementById('kontynenty'),
  litery: document.getElementById('litery'),
  losuj: document.getElementById('losuj'),
  pula: document.getElementById('pula'),
  wynik: document.getElementById('wynik'),
  historiaPanel: document.getElementById('historia-panel'),
  historia: document.getElementById('historia'),
  wyczysc: document.getElementById('wyczysc'),
  platki: document.getElementById('platki'),
  toast: document.getElementById('toast'),
  motyw: document.getElementById('motyw'),
  udostepnij: document.getElementById('udostepnij-app'),
  instaluj: document.getElementById('instaluj'),
};

/* --------------------------------------------------------------- kontynenty */

function rysujKontynenty() {
  el.kontynenty.innerHTML = '';
  const swiat = przycisk('🌍', 'Cały świat', miasta.length, stan.kontynenty.length === 0);
  swiat.addEventListener('click', () => {
    stan.kontynenty = [];
    zapisz('kontynenty', stan.kontynenty);
    odswiezFiltry();
  });
  el.kontynenty.append(swiat);

  for (const k of KONTYNENTY) {
    const ile = miasta.filter((m) => m.kontynent === k.id).length;
    const b = przycisk(k.emoji, k.krotko, ile, stan.kontynenty.includes(k.id));
    b.addEventListener('click', () => {
      stan.kontynenty = stan.kontynenty.includes(k.id)
        ? stan.kontynenty.filter((x) => x !== k.id)
        : [...stan.kontynenty, k.id];
      zapisz('kontynenty', stan.kontynenty);
      odswiezFiltry();
    });
    el.kontynenty.append(b);
  }
}

function przycisk(emoji, etykieta, ile, wybrany) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'kontynent';
  b.setAttribute('aria-pressed', String(wybrany));
  b.innerHTML = `<span aria-hidden="true">${emoji}</span><span>${etykieta}</span><span class="licznik">${ile}</span>`;
  return b;
}

/* ------------------------------------------------------------------- litery */

function rysujLitery() {
  el.litery.innerHTML = '';
  const dostepne = new Set(miasta.filter(wKontynentach).map((m) => m.litera));

  el.litery.append(kafelLitery(LOSOWA, '🎲', 'Losowa litera', true));
  for (const l of ALFABET) {
    el.litery.append(kafelLitery(l, l, `Litera ${l}`, dostepne.has(l)));
  }
}

function kafelLitery(wartosc, napis, etykieta, dostepna) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'litera' + (wartosc === LOSOWA ? ' kostka' : '');
  b.textContent = napis;
  b.disabled = !dostepna;
  b.setAttribute('role', 'radio');
  b.setAttribute('aria-checked', String(stan.litera === wartosc));
  b.setAttribute('aria-label', etykieta);
  b.addEventListener('click', () => {
    stan.litera = wartosc;
    zapisz('litera', wartosc);
    odswiezFiltry();
  });
  return b;
}

/* Zmiana kontynentów może zabrać literę, która wcześniej miała miasta. */
function odswiezFiltry() {
  const dostepne = new Set(miasta.filter(wKontynentach).map((m) => m.litera));
  if (stan.litera !== LOSOWA && !dostepne.has(stan.litera)) {
    stan.litera = LOSOWA;
    zapisz('litera', stan.litera);
    pokazToast('Na tę literę nie ma tu miast — wracam do losowej');
  }
  rysujKontynenty();
  rysujLitery();
  opiszPule();
}

function opiszPule() {
  const wszystkie = pula().length;
  const znane = (stan.wyczerpane[kluczPuli()] || []).length;
  const wybrane = stan.kontynenty.map((id) => KONTYNENTY.find((k) => k.id === id).gdzie);
  const gdzie = wybrane.length === 0
    ? 'na całym świecie'
    : wybrane.slice(0, -1).join(', ') + (wybrane.length > 1 ? ' i ' : '') + wybrane.at(-1);
  const co = stan.litera === LOSOWA ? 'miast' : `miast na ${stan.litera}`;
  el.pula.textContent = `${znane} z ${wszystkie} ${co} ${gdzie}`;
  el.losuj.disabled = wszystkie === 0;
}

/* ----------------------------------------------------------------- losowanie */

function losowe(tablica) {
  return tablica[Math.floor(Math.random() * tablica.length)];
}

function losuj() {
  const wszystkie = pula();
  if (!wszystkie.length) return;

  const klucz = kluczPuli();
  let znane = stan.wyczerpane[klucz] || [];
  let zostalo = wszystkie.filter((m) => !znane.includes(m.nazwa));

  if (!zostalo.length) {                     // koło się zamknęło — tasujemy od nowa
    znane = [];
    zostalo = wszystkie;
    pokazToast('Znasz już wszystkie z tej puli — tasuję od nowa 🌸');
  }

  const wybrane = losowe(zostalo);
  stan.wyczerpane[klucz] = [...znane, wybrane.nazwa];
  zapisz('wyczerpane', stan.wyczerpane);

  stan.historia = [wybrane, ...stan.historia.filter((m) => m.nazwa !== wybrane.nazwa)].slice(0, HISTORIA_MAX);
  zapisz('historia', stan.historia);

  animujLosowanie(wszystkie, wybrane);
}

/* Krótkie „przewijanie bębna" przed pokazaniem wyniku. */
function animujLosowanie(kandydaci, wybrane) {
  const skrocone = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.losuj.disabled = true;
  el.losuj.classList.add('kreci');
  wibruj(12);

  const klatki = skrocone ? 0 : 11;
  let i = 0;
  const bebno = setInterval(() => {
    if (i >= klatki) {
      clearInterval(bebno);
      el.losuj.classList.remove('kreci');
      el.losuj.disabled = false;
      pokazMiasto(wybrane);
      sypniePlatkami();
      wibruj([18, 40, 26]);
      opiszPule();
      rysujHistorie();
      return;
    }
    rysujBeben(losowe(kandydaci));
    i += 1;
  }, 55);

  if (skrocone) return;
  rysujBeben(losowe(kandydaci));
}

function rysujBeben(m) {
  el.wynik.classList.remove('pusty', 'wchodzi');
  el.wynik.innerHTML = `
    <span class="litera-tlo" aria-hidden="true">${m.litera}</span>
    <p class="miasto" style="opacity:.45">${m.nazwa}</p>
    <p class="kraj"><span class="flaga">${m.flaga}</span><span>${m.kraj}</span></p>`;
}

function ludnoscTekst(tysiace) {
  return tysiace >= 1000
    ? `≈ ${(tysiace / 1000).toFixed(1).replace('.', ',').replace(',0', '')} mln mieszkańców`
    : `≈ ${tysiace} tys. mieszkańców`;
}

function pokazMiasto(m) {
  stan.ostatnie = m;
  const kontynent = KONTYNENTY.find((k) => k.id === m.kontynent);
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.nazwa}, ${m.kraj}`)}`;

  el.wynik.classList.remove('pusty');
  el.wynik.innerHTML = `
    <span class="litera-tlo" aria-hidden="true">${m.litera}</span>
    <h2 class="miasto">${m.nazwa}</h2>
    <p class="kraj"><span class="flaga">${m.flaga}</span><span>${m.kraj}</span></p>
    <div class="plakietki">
      <span class="plakietka">${kontynent.emoji} ${kontynent.nazwa}</span>
      <span class="plakietka">👥 ${ludnoscTekst(m.ludnosc)}</span>
      <span class="plakietka">🔤 na ${m.litera}</span>
    </div>
    <p class="opis">${m.opis}</p>
    <p class="komentarz">${losowe(komentarze)}</p>
    <div class="akcje">
      <a class="akcja" href="${mapa}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        Pokaż na mapie
      </a>
      <button class="akcja" id="wyslij-miasto" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"/><path d="m8 7 4-4 4 4"/><path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></svg>
        Wyślij komuś
      </button>
    </div>`;

  // Restart animacji wjazdu — bez tego druga karta wjechałaby bez ruchu.
  void el.wynik.offsetWidth;
  el.wynik.classList.add('wchodzi');

  document.getElementById('wyslij-miasto').addEventListener('click', () => {
    udostepnij(`${m.nazwa} (${m.kraj}) — ${m.opis}`, 'Wylosowane w Gacha Miast');
  });
}

/* ----------------------------------------------------------------- historia */

function rysujHistorie() {
  el.historiaPanel.hidden = stan.historia.length === 0;
  el.historia.innerHTML = '';
  for (const m of stan.historia) {
    const w = document.createElement('span');
    w.className = 'wpis';
    w.innerHTML = `<span aria-hidden="true">${m.flaga}</span>${m.nazwa}`;
    el.historia.append(w);
  }
}

el.wyczysc.addEventListener('click', () => {
  stan.historia = [];
  stan.wyczerpane = {};
  zapisz('historia', stan.historia);
  zapisz('wyczerpane', stan.wyczerpane);
  rysujHistorie();
  opiszPule();
  pokazToast('Wyczyszczone — wszystkie miasta znów w puli');
});

/* ------------------------------------------------------------------ drobiazgi */

function sypniePlatkami() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const kolory = ['#FF8FC8', '#FFB8DC', '#8A7BFF', '#7DD8FF'];
  for (let i = 0; i < 14; i += 1) {
    const p = document.createElement('span');
    p.className = 'platek';
    const rozmiar = 7 + Math.random() * 9;
    p.style.left = `${Math.random() * 100}vw`;
    p.style.width = `${rozmiar}px`;
    p.style.height = `${rozmiar}px`;
    p.style.background = losowe(kolory);
    p.style.animationDuration = `${2.4 + Math.random() * 2.2}s`;
    p.style.animationDelay = `${Math.random() * .5}s`;
    p.addEventListener('animationend', () => p.remove());
    el.platki.append(p);
  }
}

function wibruj(wzor) {
  try { navigator.vibrate?.(wzor); } catch { /* iOS nie wibruje z przeglądarki */ }
}

let toastTimer;
function pokazToast(tekst) {
  el.toast.textContent = tekst;
  el.toast.classList.add('widoczny');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('widoczny'), 2600);
}

async function udostepnij(tekst, tytul) {
  const dane = { title: tytul, text: tekst, url: location.href };
  if (navigator.share) {
    try { await navigator.share(dane); return; } catch { /* anulowane */ }
  }
  try {
    await navigator.clipboard.writeText(`${tekst}\n${location.href}`);
    pokazToast('Skopiowane do schowka');
  } catch {
    pokazToast('Skopiuj link z paska adresu');
  }
}

el.udostepnij.addEventListener('click', () => {
  udostepnij('Gacha Miast — losownik miast, do których warto pojechać', 'Gacha Miast');
});

el.motyw.addEventListener('click', () => {
  const jasny = document.documentElement.dataset.theme === 'jasny';
  document.documentElement.dataset.theme = jasny ? 'ciemny' : 'jasny';
  zapisz('motyw', jasny ? 'ciemny' : 'jasny');
});

el.losuj.addEventListener('click', losuj);

/* Klawiatura: litera wybiera literę, spacja losuje. */
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.matches('input, textarea')) return;
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    losuj();
    return;
  }
  const znak = litera(e.key);
  if (e.key.length === 1 && ALFABET.includes(znak)) {
    const kafel = [...el.litery.children].find((b) => b.textContent === znak);
    if (kafel && !kafel.disabled) kafel.click();
  }
});

/* Instalacja PWA — Chrome podpowiada, Safari nie, więc guzik bywa ukryty. */
let promptInstalacji = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptInstalacji = e;
  el.instaluj.hidden = false;
});
el.instaluj.addEventListener('click', async () => {
  if (!promptInstalacji) return;
  promptInstalacji.prompt();
  await promptInstalacji.userChoice;
  promptInstalacji = null;
  el.instaluj.hidden = true;
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ------------------------------------------------------------------- start */

rysujKontynenty();
rysujLitery();
opiszPule();
rysujHistorie();
