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

  /* --- palety trzech światów -------------------------------------------
     Każdy gatunek modliszki ma własne środowisko. Paleta steruje kolorami
     nieba, trawy, kwiatów i gruntu oraz rodzajem cząsteczek w powietrzu. */
  const SWIATY = {
    laka: {           // modliszka zwyczajna: letnia łąka w słońcu
      niebo: ['#fdf6d8', '#e7f2b8', '#b6e0a0', '#6cb673'],
      slonce: 'rgba(255,251,205,', slonceX: 0.76, slonceY: 0.11,
      promienie: true,
      daleko: 'rgba(150,200,140,0.75)', srednio: 'rgba(112,178,105,0.9)', lodyga: 'rgba(90,155,88,0.95)',
      grunt: ['rgba(120,150,70,0.0)', 'rgba(96,132,60,0.55)', 'rgba(70,104,44,0.85)'],
      gruntZdzblo: 'rgba(88,132,58,0.8)',
      lisc: ['#b6e07f', '#84c25c', '#5d9a3c'],
      kwiaty: [[0.15, 0.52, '#f2a8c8', '#ffd34d', 6], [0.87, 0.62, '#c6a8ee', '#ffe27a', 5], [0.71, 0.76, '#ffd27a', '#ff9b3d', 6]],
      dalekieKwiaty: ['rgba(255,200,120,0.55)', 'rgba(240,150,190,0.5)', 'rgba(200,170,240,0.5)', 'rgba(255,235,140,0.6)'],
      czasteczki: 'pylki', rosa: true
    },
    sciolka: {        // modliszka duchowa: sucha ściółka jesienią, tło ciemne
                      // i chłodne, żeby jasna brązowa modliszka mocno wybijała
      niebo: ['#e6d6b0', '#b89a6a', '#6e5236', '#3a2c1c'],
      slonce: 'rgba(255,216,150,', slonceX: 0.72, slonceY: 0.12,
      promienie: true,
      daleko: 'rgba(120,96,66,0.7)', srednio: 'rgba(92,72,48,0.92)', lodyga: 'rgba(70,52,34,0.95)',
      grunt: ['rgba(70,54,34,0.0)', 'rgba(58,42,26,0.7)', 'rgba(34,24,15,0.95)'],
      gruntZdzblo: 'rgba(70,52,34,0.9)',
      lisc: ['#8a6a3e', '#6a4e2c', '#48331d'],
      kwiaty: [[0.16, 0.55, '#e8843a', '#ffd06a', 6], [0.85, 0.64, '#d0662e', '#ffb35a', 5]],
      dalekieKwiaty: ['rgba(230,140,70,0.55)', 'rgba(255,180,90,0.5)', 'rgba(255,205,110,0.5)'],
      czasteczki: 'liscie', rosa: false
    },
    zmierzch: {       // modliszka storczykowa: kwiat o zmierzchu. Niebo mocno
                      // ciemnieje ku dołowi, a liść pod modliszką jest zielony
                      // (jak liść lilii), żeby różowa modliszka nie ginęła
      niebo: ['#f0cfe0', '#b48fc6', '#5f5090', '#2a2450'],
      slonce: 'rgba(255,204,170,', slonceX: 0.3, slonceY: 0.14,
      promienie: false,
      daleko: 'rgba(110,92,140,0.6)', srednio: 'rgba(84,70,120,0.85)', lodyga: 'rgba(60,52,92,0.92)',
      grunt: ['rgba(60,52,92,0.0)', 'rgba(44,38,74,0.6)', 'rgba(24,20,44,0.95)'],
      gruntZdzblo: 'rgba(60,52,92,0.9)',
      lisc: ['#5f9a72', '#417253', '#2b4d38'],
      kwiaty: [[0.16, 0.5, '#ffd1e6', '#ffe27a', 6], [0.86, 0.6, '#e6b3ff', '#fff0a0', 6], [0.7, 0.74, '#ffc1dd', '#ffd86a', 5]],
      dalekieKwiaty: ['rgba(255,200,230,0.55)', 'rgba(220,180,255,0.5)', 'rgba(255,230,150,0.5)'],
      czasteczki: 'swietliki', rosa: true
    }
  };


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

  /* Kwiatek: kilka płatków wokół środka, dowolny kolor. */
  function kwiat(ctx, x, y, r, platek, srodek, ileP) {
    ctx.save(); ctx.translate(x, y);
    const n = ileP || 6;
    for (let i = 0; i < n; i++) {
      const k = i / n * Math.PI * 2;
      const g = ctx.createLinearGradient(0, 0, Math.cos(k) * r, Math.sin(k) * r);
      g.addColorStop(0, srodek); g.addColorStop(1, platek);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(Math.cos(k) * r * 0.6, Math.sin(k) * r * 0.6, r * 0.5, r * 0.3, k, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = srodek;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    ctx.beginPath(); ctx.arc(-r * 0.08, -r * 0.08, r * 0.16, 0, 7); ctx.fill();
    ctx.restore();
  }

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

  function rysujSwiat(ctx, w, h, swiatKey) {
    const p = SWIATY[swiatKey] || SWIATY.laka;
    const r = losowy(7);

    /* niebo */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, p.niebo[0]); g.addColorStop(0.30, p.niebo[1]);
    g.addColorStop(0.60, p.niebo[2]); g.addColorStop(1, p.niebo[3]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    /* słońce lub księżycowa poświata */
    const sx = w * p.slonceX, sy = h * p.slonceY;
    const slonce = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.85);
    slonce.addColorStop(0, p.slonce + '0.98)');
    slonce.addColorStop(0.22, p.slonce + '0.5)');
    slonce.addColorStop(0.5, p.slonce + '0.16)');
    slonce.addColorStop(1, p.slonce + '0)');
    ctx.fillStyle = slonce; ctx.fillRect(0, 0, w, h);

    /* promienie światła (tylko dzień) */
    if (p.promienie) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 5; i++) {
        const x = w * (0.55 + i * 0.11);
        const gr = ctx.createLinearGradient(x, 0, x - w * 0.18, h);
        gr.addColorStop(0, 'rgba(255,250,210,0.10)'); gr.addColorStop(1, 'rgba(255,250,210,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w * 0.05, 0);
        ctx.lineTo(x - w * 0.13, h); ctx.lineTo(x - w * 0.20, h); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    /* plan daleki, mocno rozmyty */
    ctx.save(); ctx.filter = 'blur(' + (w * 0.012) + 'px)';
    for (let i = 0; i < 38; i++) {
      const x = r() * w, dl = h * (0.22 + r() * 0.3);
      zdzblo(ctx, x, h * 0.86, dl, (r() - 0.5) * w * 0.12, w * 0.012, p.daleko);
    }
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = p.dalekieKwiaty[i % p.dalekieKwiaty.length];
      ctx.beginPath(); ctx.arc(r() * w, h * (0.5 + r() * 0.3), w * (0.01 + r() * 0.02), 0, 7); ctx.fill();
    }
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = 'rgba(255,255,225,' + (0.14 + r() * 0.22) + ')';
      ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.7, w * (0.012 + r() * 0.03), 0, 7); ctx.fill();
    }
    ctx.restore();

    /* plan średni */
    ctx.save(); ctx.filter = 'blur(' + (w * 0.003) + 'px)';
    for (let i = 0; i < 26; i++) {
      const x = r() * w, dl = h * (0.3 + r() * 0.34);
      zdzblo(ctx, x, h * 0.95, dl, (r() - 0.5) * w * 0.16, w * 0.016, p.srednio);
    }
    ctx.restore();
    /* kwiaty na łodygach */
    p.kwiaty.forEach(k => {
      zdzblo(ctx, w * k[0], h * 0.97, h * (0.95 - k[1]), (k[0] - 0.5) * w * 0.05, w * 0.012, p.lodyga);
      kwiat(ctx, w * k[0], h * k[1], w * 0.055, k[2], k[3], k[4]);
    });

    /* gałązka z liściem (albo płatkiem), na której stoi modliszka */
    const lx = w * 0.06, ly = h * 0.74;
    ctx.strokeStyle = swiatKey === 'zmierzch' ? '#6a5a48' : (swiatKey === 'sciolka' ? '#6e5327' : '#7d6a3f');
    ctx.lineCap = 'round'; ctx.lineWidth = w * 0.026;
    ctx.beginPath(); ctx.moveTo(-w * 0.02, h * 0.97); ctx.quadraticCurveTo(w * 0.1, h * 0.88, w * 0.36, ly + h * 0.012); ctx.stroke();
    ctx.save(); ctx.filter = 'blur(' + (w * 0.02) + 'px)';
    ctx.fillStyle = 'rgba(30,40,20,0.22)';
    ctx.beginPath(); ctx.ellipse(w * 0.4, ly + h * 0.055, w * 0.36, h * 0.02, -0.04, 0, 7); ctx.fill();
    ctx.restore();
    lisc(ctx, lx + w * 0.02, ly + h * 0.004, w * 0.86, h * 0.052, -0.045, p.lisc);

    if (p.rosa && swiatKey !== 'zmierzch') {
      const kropla = ctx.createRadialGradient(w * 0.63, ly - h * 0.012, 0, w * 0.63, ly - h * 0.01, w * 0.022);
      kropla.addColorStop(0, 'rgba(255,255,255,0.95)');
      kropla.addColorStop(0.6, 'rgba(225,245,255,0.55)');
      kropla.addColorStop(1, 'rgba(200,235,255,0.15)');
      ctx.fillStyle = kropla;
      ctx.beginPath(); ctx.ellipse(w * 0.63, ly - h * 0.012, w * 0.022, w * 0.019, 0, 0, 7); ctx.fill();
    }

    /* grunt (dodawany w gra.js osobno, tu zwracamy tylko dane) */
    return { liscY: ly - h * 0.006, liscX: w * 0.3, paleta: p };
  }

  globalny.Swiat = { rysujSwiat, lisc, zdzblo, kwiat, SWIATY };
})(window);
