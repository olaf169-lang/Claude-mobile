/* ==========================================================================
   MANTIS, dźwięk (etap M5+)
   Dźwięki są syntezowane w Web Audio, bez plików. Delikatne, bo dziecko
   będzie je słyszeć setki razy. Na iOS dźwięk odblokowuje się dopiero po
   pierwszym dotknięciu ekranu, dlatego jest funkcja odblokuj().
   ========================================================================== */

(function (globalny) {
  'use strict';

  let ctx = null;
  let wlaczony = true;

  function odblokuj() {
    if (!ctx) {
      try {
        const AC = globalny.AudioContext || globalny.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      } catch (e) { return; }
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function ton(czest, czas, typ, glosnosc, przesuniecie) {
    if (!ctx || !wlaczony) return;
    const t0 = ctx.currentTime + (przesuniecie || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = typ || 'sine';
    osc.frequency.setValueAtTime(czest, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(glosnosc, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + czas);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + czas + 0.02);
  }

  /* krótki szum, np. chrupnięcie albo stąpnięcie */
  function szum(czas, glosnosc, filtr, przesuniecie) {
    if (!ctx || !wlaczony) return;
    const t0 = ctx.currentTime + (przesuniecie || 0);
    const n = Math.floor(ctx.sampleRate * czas);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = filtr || 1200; bp.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = glosnosc;
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(t0);
  }

  /* stąpnięcie: bardzo cichy, krótki, matowy tik. Lekko losowa wysokość,
     żeby kolejne kroki się nie zlewały w jeden dźwięk. */
  function krok() {
    szum(0.05, 0.05 + Math.random() * 0.02, 320 + Math.random() * 120);
  }

  /* złapanie i jedzenie: krótki „chrup" plus miękki, opadający ton. */
  function jedz() {
    szum(0.09, 0.09, 900);
    ton(520, 0.12, 'sine', 0.12, 0.02);
    ton(360, 0.16, 'sine', 0.10, 0.10);
  }

  /* wzrost po najedzeniu: krótki, wesoły dzwoneczek w górę. */
  function wzrost() {
    ton(660, 0.14, 'triangle', 0.12, 0);
    ton(880, 0.16, 'triangle', 0.12, 0.10);
  }

  /* wylinka: miękki, dłuższy akord. */
  function wylinka() {
    ton(392, 0.5, 'sine', 0.10, 0);
    ton(523, 0.5, 'sine', 0.10, 0.06);
    ton(659, 0.6, 'sine', 0.10, 0.12);
  }

  function ustaw(wl) { wlaczony = !!wl; if (wl) odblukajBezpiecznie(); }
  function odblukajBezpiecznie() { try { odblokuj(); } catch (e) {} }

  globalny.Dzwiek = { odblokuj, ustaw, krok, jedz, wzrost, wylinka };
})(window);
