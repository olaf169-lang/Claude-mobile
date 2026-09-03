/* ==========================================================================
   Świętowanie na koniec gry — konfetti i krótka fanfarka na telefonie
   zwycięzcy (i, ciszej, drugiego i trzeciego miejsca).
   --------------------------------------------------------------------------
   Żadnych plików dźwiękowych do ściągania — melodyjki to kilka oscylatorów
   Web Audio, więc działa offline i waży prawie nic. Złoto dostaje najdłuższy,
   najjaśniejszy efekt; srebro i brąz — coraz skromniejszy, tak jak było
   zamówione: pierwsze miejsce ma wyraźnie świętować najbardziej.
   ========================================================================== */

const MOTYWY = {
  zloto: {
    kolory: ['#FFD700', '#FFC24B', '#FFF3C4', '#FF9F1C', '#FF4D9D'],
    ile: 140,
    czasMs: 4200,
    fala: 'sawtooth',
    glosnosc: 0.09,
    nuty: [
      { f: 523.25, t: 0, d: 0.16 },   // C5
      { f: 659.25, t: 0.14, d: 0.16 }, // E5
      { f: 783.99, t: 0.28, d: 0.16 }, // G5
      { f: 1046.50, t: 0.42, d: 0.55 }, // C6 — trzymana na koniec
    ],
  },
  srebro: {
    kolory: ['#F1F1F6', '#D6D6E4', '#B8B8C8', '#9A9AB0', '#38E1D6'],
    ile: 90,
    czasMs: 3200,
    fala: 'triangle',
    glosnosc: 0.07,
    nuty: [
      { f: 587.33, t: 0, d: 0.18 },   // D5
      { f: 739.99, t: 0.16, d: 0.4 }, // F#5
    ],
  },
  braz: {
    kolory: ['#CD7F32', '#B5651D', '#8B5A2B', '#E8B98A'],
    ile: 55,
    czasMs: 2400,
    fala: 'sine',
    glosnosc: 0.05,
    nuty: [
      { f: 440.00, t: 0, d: 0.14 },   // A4
      { f: 523.25, t: 0.12, d: 0.22 }, // C5
    ],
  },
};

const MOTYW_MIEJSCA = { 1: 'zloto', 2: 'srebro', 3: 'braz' };

/* ------------------------------------------------------------------ dźwięk */

let kontekst = null;
function pobierzKontekst() {
  const Klasa = window.AudioContext || window.webkitAudioContext;
  if (!Klasa) return null;
  kontekst ??= new Klasa();
  return kontekst;
}

/** Wołane z prawdziwego dotknięcia ekranu w trakcie gry (patrz gracz.js) —
    na iOS dźwięk startuje tylko z gestu, a ekran końcowy przychodzi sam,
    z sieci, więc trzeba się „rozgrzać” wcześniej. */
export function odblokujDzwiekSwieta() {
  try { pobierzKontekst()?.resume(); } catch { /* nieistotne */ }
}

function zagrajNute(ctx, poczatek, { f, t, d }, fala, glosnosc) {
  const osc = ctx.createOscillator();
  osc.type = fala;
  osc.frequency.value = f;
  const wzmocnienie = ctx.createGain();
  const start = poczatek + t;
  wzmocnienie.gain.setValueAtTime(0, start);
  wzmocnienie.gain.linearRampToValueAtTime(glosnosc, start + 0.02);
  wzmocnienie.gain.exponentialRampToValueAtTime(0.0001, start + d);
  osc.connect(wzmocnienie).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + d + 0.05);
}

function zagrajFanfare(motyw) {
  const ctx = pobierzKontekst();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const teraz = ctx.currentTime + 0.02;
  for (const nuta of motyw.nuty) zagrajNute(ctx, teraz, nuta, motyw.fala, motyw.glosnosc);
}

/* ----------------------------------------------------------------- wizual */

function losuj(min, maks) { return min + Math.random() * (maks - min); }

function nowaCzasteczka(szerokosc, kolory) {
  return {
    x: losuj(0, szerokosc),
    y: losuj(-140, -20),
    w: losuj(6, 11),
    h: losuj(9, 16),
    kolor: kolory[Math.floor(Math.random() * kolory.length)],
    predkoscY: losuj(2.2, 4.6),
    kolyszA: losuj(18, 46),
    kolyszT: losuj(0, Math.PI * 2),
    kolyszV: losuj(.018, .045),
    rot: losuj(0, Math.PI),
    rotV: losuj(-.14, .14),
  };
}

function sypnijKonfetti(motyw) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const kanwa = document.createElement('canvas');
  kanwa.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;transition:opacity .5s ease;';
  kanwa.width = window.innerWidth;
  kanwa.height = window.innerHeight;
  document.body.append(kanwa);
  const kontekst2d = kanwa.getContext('2d');

  const czasteczki = [];
  const startAnimacji = performance.now();
  // Sypią się porcjami przez pierwszy ułamek sekundy, nie wszystkie naraz —
  // wygląda to jak prawdziwe konfetti, nie jak jednorazowy wybuch.
  const rozlozenieMs = Math.min(700, motyw.czasMs * .25);

  let klatka;
  function krok(teraz) {
    const uplynelo = teraz - startAnimacji;
    const ileMa = Math.min(motyw.ile, Math.ceil(motyw.ile * Math.min(1, uplynelo / rozlozenieMs)));
    while (czasteczki.length < ileMa) czasteczki.push(nowaCzasteczka(kanwa.width, motyw.kolory));

    kontekst2d.clearRect(0, 0, kanwa.width, kanwa.height);
    for (const cz of czasteczki) {
      cz.y += cz.predkoscY;
      cz.kolyszT += cz.kolyszV;
      cz.rot += cz.rotV;
      const x = cz.x + Math.sin(cz.kolyszT) * cz.kolyszA;
      kontekst2d.save();
      kontekst2d.translate(x, cz.y);
      kontekst2d.rotate(cz.rot);
      kontekst2d.fillStyle = cz.kolor;
      kontekst2d.fillRect(-cz.w / 2, -cz.h / 2, cz.w, cz.h);
      kontekst2d.restore();
    }

    if (uplynelo < motyw.czasMs) {
      klatka = requestAnimationFrame(krok);
    } else {
      kanwa.style.opacity = '0';
      setTimeout(() => kanwa.remove(), 520);
    }
  }
  klatka = requestAnimationFrame(krok);

  // Gdyby ktoś zmienił rozmiar okna (obrót telefonu) w trakcie sypania.
  const naZmianeRozmiaru = () => { kanwa.width = window.innerWidth; kanwa.height = window.innerHeight; };
  window.addEventListener('resize', naZmianeRozmiaru);
  setTimeout(() => {
    window.removeEventListener('resize', naZmianeRozmiaru);
    cancelAnimationFrame(klatka);
  }, motyw.czasMs + 600);
}

/* -------------------------------------------------------------- wejście */

/** Konfetti + fanfarka dobrane do miejsca (1 = złoto, 2 = srebro, 3 = brąz).
    Miejsca niżej niż trzecie nic nie dostają — tam już nie ma medalu. */
export function swietuj(miejsce) {
  const klucz = MOTYW_MIEJSCA[miejsce];
  if (!klucz) return;
  const motyw = MOTYWY[klucz];
  sypnijKonfetti(motyw);
  zagrajFanfare(motyw);
}
