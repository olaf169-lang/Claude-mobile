/* ==========================================================================
   MANTIS, rysunek świata
   Tło jest rysowane warstwami (niebo, plan daleki, plan średni, gałązka
   z liściem, plan bliski). W grze powstanie raz na ukrytym canvasie i będzie
   tylko przesuwane, więc rozmycie i gradienty nic nie kosztują w klatce.
   ========================================================================== */

(function (globalny) {
  'use strict';

  function losowy(ziarno) {
    let s = ziarno;
    return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  }

  /* Źdźbło trawy: zakrzywiona, zwężająca się kreska. */
  function zdzblo(ctx, x, y, dl, odchyl, szer, kolor) {
    ctx.fillStyle = kolor;
    ctx.beginPath();
    ctx.moveTo(x - szer, y);
    ctx.quadraticCurveTo(x + odchyl * 0.4, y - dl * 0.55, x + odchyl, y - dl);
    ctx.quadraticCurveTo(x + odchyl * 0.4 + szer * 0.8, y - dl * 0.5, x + szer, y);
    ctx.closePath();
    ctx.fill();
  }

  /* Liść: dwie krzywe plus nerw główny i boczne. */
  function lisc(ctx, x, y, dl, szer, kat, kolory) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(kat);
    const g = ctx.createLinearGradient(0, -szer, dl, szer);
    g.addColorStop(0, kolory[0]); g.addColorStop(0.55, kolory[1]); g.addColorStop(1, kolory[2]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(dl * 0.25, -szer, dl * 0.72, -szer * 0.92, dl, -szer * 0.06);
    ctx.bezierCurveTo(dl * 0.72, szer * 0.86, dl * 0.25, szer, 0, 0);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(30,60,20,0.35)'; ctx.lineWidth = Math.max(1, dl * 0.006); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,70,25,0.22)'; ctx.lineWidth = Math.max(0.8, dl * 0.004);
    ctx.beginPath(); ctx.moveTo(dl * 0.02, -szer * 0.02);
    ctx.quadraticCurveTo(dl * 0.6, -szer * 0.12, dl * 0.97, -szer * 0.05); ctx.stroke();
    for (let i = 1; i <= 6; i++) {
      const t = i / 7;
      const bx = mieszajL(dl * 0.02, dl * 0.95, t), by = -szer * 0.08 * (1 - t);
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + dl * 0.08, by - szer * 0.35, bx + dl * 0.12, by - szer * 0.55 * (1 - t * 0.5));
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + dl * 0.08, by + szer * 0.35, bx + dl * 0.12, by + szer * 0.6 * (1 - t * 0.5));
      ctx.stroke();
    }
    ctx.restore();
  }

  const mieszajL = (a, b, t) => a + (b - a) * t;

  function koniczyna(ctx, x, y, r, kolor) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = kolor;
    for (let i = 0; i < 9; i++) {
      const k = i / 9 * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(k) * r * 0.55, Math.sin(k) * r * 0.55, r * 0.42, r * 0.3, k, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.2, r * 0.35, 0, 7); ctx.fill();
    ctx.restore();
  }

  function rysujSwiat(ctx, w, h) {
    const r = losowy(7);

    /* niebo i światło */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#eaf7cf'); g.addColorStop(0.42, '#cdebb4'); g.addColorStop(1, '#8fce8c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    const slonce = ctx.createRadialGradient(w * 0.74, h * 0.13, 0, w * 0.74, h * 0.13, w * 0.72);
    slonce.addColorStop(0, 'rgba(255,253,220,0.95)');
    slonce.addColorStop(0.35, 'rgba(255,250,200,0.28)');
    slonce.addColorStop(1, 'rgba(255,250,200,0)');
    ctx.fillStyle = slonce; ctx.fillRect(0, 0, w, h);

    /* plan daleki, mocno rozmyty */
    ctx.save(); ctx.filter = 'blur(' + (w * 0.012) + 'px)';
    for (let i = 0; i < 38; i++) {
      const x = r() * w, dl = h * (0.22 + r() * 0.3);
      zdzblo(ctx, x, h * 0.86, dl, (r() - 0.5) * w * 0.12, w * 0.012, 'rgba(150,200,140,0.75)');
    }
    /* punkty światła */
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = 'rgba(255,255,225,' + (0.14 + r() * 0.22) + ')';
      ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.7, w * (0.012 + r() * 0.03), 0, 7); ctx.fill();
    }
    ctx.restore();

    /* plan średni */
    ctx.save(); ctx.filter = 'blur(' + (w * 0.003) + 'px)';
    for (let i = 0; i < 26; i++) {
      const x = r() * w, dl = h * (0.3 + r() * 0.34);
      zdzblo(ctx, x, h * 0.95, dl, (r() - 0.5) * w * 0.16, w * 0.016, 'rgba(112,178,105,0.9)');
    }
    ctx.restore();
    koniczyna(ctx, w * 0.17, h * 0.55, w * 0.075, 'rgba(240,225,245,0.92)');
    zdzblo(ctx, w * 0.17, h * 0.95, h * 0.4, -w * 0.02, w * 0.012, 'rgba(96,160,92,0.95)');

    /* gałązka z dużym liściem, na której stoi modliszka */
    const lx = w * 0.06, ly = h * 0.74;
    ctx.strokeStyle = '#7d6a3f'; ctx.lineCap = 'round';
    ctx.lineWidth = w * 0.026;
    ctx.beginPath(); ctx.moveTo(-w * 0.02, h * 0.97); ctx.quadraticCurveTo(w * 0.1, h * 0.88, w * 0.36, ly + h * 0.012); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,220,0.35)'; ctx.lineWidth = w * 0.006;
    ctx.beginPath(); ctx.moveTo(-w * 0.02, h * 0.96); ctx.quadraticCurveTo(w * 0.1, h * 0.87, w * 0.36, ly + h * 0.006); ctx.stroke();
    lisc(ctx, lx + w * 0.02, ly + h * 0.004, w * 0.86, h * 0.052, -0.045, ['#a8d873', '#7cbb55', '#5d9a3c']);

    /* kropla rosy na liściu */
    const kropla = ctx.createRadialGradient(w * 0.63, ly - h * 0.012, 0, w * 0.63, ly - h * 0.01, w * 0.022);
    kropla.addColorStop(0, 'rgba(255,255,255,0.95)');
    kropla.addColorStop(0.6, 'rgba(225,245,255,0.55)');
    kropla.addColorStop(1, 'rgba(200,235,255,0.15)');
    ctx.fillStyle = kropla;
    ctx.beginPath(); ctx.ellipse(w * 0.63, ly - h * 0.012, w * 0.022, w * 0.019, 0, 0, 7); ctx.fill();

    return { liscY: ly - h * 0.006, liscX: w * 0.3 };
  }

  function planBliski(ctx, w, h) {
    const r = losowy(19);
    ctx.save(); ctx.filter = 'blur(' + (w * 0.016) + 'px)';
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      zdzblo(ctx, x, h * 1.02, h * (0.24 + r() * 0.26), (r() - 0.5) * w * 0.2, w * 0.03, 'rgba(70,130,64,0.55)');
    }
    ctx.restore();
    /* pyłki w powietrzu */
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = 'rgba(255,255,220,' + (0.25 + r() * 0.45) + ')';
      ctx.beginPath(); ctx.arc(r() * w, r() * h, w * (0.002 + r() * 0.005), 0, 7); ctx.fill();
    }
  }

  globalny.Swiat = { rysujSwiat, planBliski, lisc, zdzblo };
})(window);
