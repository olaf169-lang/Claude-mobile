/* ==========================================================================
   MANTIS, rysunek modliszki
   Modliszka jest złożona z osobnych części (głowa, oczy, czułki, przedtułów,
   tułów, odwłok, dwie pary odnóży krocznych, odnóża chwytne, zawiązki
   skrzydeł, skrzydła). Kod ustawia je w przegubach, więc ten sam zestaw
   obsługuje osiem stadiów, trzy gatunki i całą animację.

   Sylwetka trzyma się prawdziwej modliszki: długi przedtułów uniesiony
   skośnie do góry, głowa wysoko z przodu, odnóża chwytne złożone przed
   ciałem, odnóża kroczne cienkie jak szczudła, odwłok u nimfy podwinięty.

   Układ lokalny: długość ciała to 100 jednostek, punkt (0,0) leży na ziemi
   pod biodrem, oś Y rośnie w dół, modliszka patrzy w prawo.
   ========================================================================== */

(function (globalny) {
  'use strict';

  const mieszaj = (a, b, t) => a + (b - a) * t;
  const pkt = (x, y) => ({ x, y });
  const przesun = (p, dx, dy) => ({ x: p.x + dx, y: p.y + dy });

  /* --- gatunki --------------------------------------------------------- */

  const GATUNKI = {
    zwyczajna: {
      nazwa: 'modliszka zwyczajna', lacinska: 'Mantis religiosa',
      jasny: '#d2e98a', sredni: '#9fc957', ciemny: '#6e9a33',
      kontur: '#3d5c1e', oko: '#f4f8dc', zrenica: '#2a3d13',
      skrzydlo: 'rgba(208,233,152,0.70)', plamka: true
    },
    duchowa: {
      nazwa: 'modliszka duchowa', lacinska: 'Phyllocrania paradoxa',
      jasny: '#ddc396', sredni: '#b58a5c', ciemny: '#855d39',
      kontur: '#4b3220', oko: '#f0e2c6', zrenica: '#392615',
      skrzydlo: 'rgba(216,188,144,0.70)', plamka: false, lisciasta: true
    },
    storczykowa: {
      nazwa: 'modliszka storczykowa', lacinska: 'Hymenopus coronatus',
      jasny: '#fff5f8', sredni: '#f8cfdf', ciemny: '#e09ab8',
      kontur: '#8f5471', oko: '#fff8fb', zrenica: '#5e2d45',
      skrzydlo: 'rgba(255,240,246,0.74)', plamka: false, platki: true
    }
  };

  /* --- proporcje stadium ------------------------------------------------ */

  function proporcje(stadium) {
    const p = Math.min(1, Math.max(0, (stadium - 1) / 7));
    return {
      p,
      glowa: mieszaj(1.45, 1.0, p),        // nimfa ma proporcjonalnie dużą głowę i oczy
      przedtulow: mieszaj(15, 30, p),      // przedtułów wydłuża się z każdą wylinką
      odwlok: mieszaj(32, 46, p),
      podwiniecie: mieszaj(0.42, 0.10, p), // nimfa trzyma odwłok podwinięty do góry
      grubosc: mieszaj(1.35, 0.92, p),
      nogi: mieszaj(0.80, 1.14, p),
      biodro: mieszaj(21, 28, p),
      zawiazki: stadium >= 5 && stadium <= 7 ? mieszaj(10, 22, (stadium - 5) / 2) : 0,
      skrzydla: stadium >= 8
    };
  }

  /* --- pomocnicze -------------------------------------------------------- */

  function gradientProstopadly(ctx, a, b, szer, pal) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d * szer, ny = dx / d * szer;
    const g = ctx.createLinearGradient(a.x + nx, a.y + ny, a.x - nx, a.y - ny);
    g.addColorStop(0, pal.jasny); g.addColorStop(0.5, pal.sredni); g.addColorStop(1, pal.ciemny);
    return g;
  }

  function segment(ctx, a, b, wa, wb, pal) {
    const n = 14;
    const rysuj = (dodatek, styl) => {
      ctx.strokeStyle = styl; ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        ctx.beginPath();
        ctx.moveTo(mieszaj(a.x, b.x, t0), mieszaj(a.y, b.y, t0));
        ctx.lineTo(mieszaj(a.x, b.x, t1), mieszaj(a.y, b.y, t1));
        ctx.lineWidth = (mieszaj(wa, wb, (t0 + t1) / 2) + dodatek) * 2;
        ctx.stroke();
      }
    };
    rysuj(pal.tlo ? 0.35 : 0.8, pal.kontur);
    rysuj(0, pal.tlo ? pal.sredni : gradientProstopadly(ctx, a, b, Math.max(wa, wb), pal));
  }

  function kolce(ctx, a, b, ile, dlugosc, strona, pal) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d * strona, ny = dx / d * strona;
    ctx.fillStyle = pal.kontur;
    for (let i = 1; i <= ile; i++) {
      const t = i / (ile + 1);
      const x = mieszaj(a.x, b.x, t), y = mieszaj(a.y, b.y, t);
      const dl = dlugosc * (0.55 + 0.45 * Math.sin(Math.PI * t));
      ctx.beginPath();
      ctx.moveTo(x + nx * 0.4 - dx / d * dl * 0.3, y + ny * 0.4 - dy / d * dl * 0.3);
      ctx.lineTo(x + nx * dl, y + ny * dl);
      ctx.lineTo(x + nx * 0.4 + dx / d * dl * 0.3, y + ny * 0.4 + dy / d * dl * 0.3);
      ctx.closePath(); ctx.fill();
    }
  }

  function ksztalt(ctx, sciezka, wypelnienie, pal, konturSzer) {
    ctx.beginPath(); sciezka();
    ctx.lineJoin = 'round'; ctx.lineWidth = konturSzer || 1.6;
    ctx.strokeStyle = pal.kontur; ctx.stroke();
    ctx.fillStyle = wypelnienie; ctx.fill();
  }

  const przyciemniona = (pal) =>
    Object.assign({}, pal, {
      jasny: pal.sredni, sredni: pal.ciemny, ciemny: pal.kontur,
      kontur: 'rgba(40,50,25,0.45)', tlo: true
    });

  /* --- szkielet ---------------------------------------------------------- */

  function szkielet(pr, poza) {
    const z = poza || {};
    const kol = z.kolysanie || 0;
    const biodro = pkt(0, -pr.biodro);
    const meso = pkt(11, -pr.biodro - 4);
    const pro = pkt(17, -pr.biodro - 7);
    const kat = -0.72 + kol;                       // przedtułów skośnie do góry
    const kark = pkt(pro.x + Math.cos(kat) * pr.przedtulow, pro.y + Math.sin(kat) * pr.przedtulow);
    const ogon = pkt(biodro.x - pr.odwlok, biodro.y - pr.odwlok * pr.podwiniecie);
    return { biodro, meso, pro, kark, ogon, katGlowy: z.katGlowy || 0 };
  }

  /* --- części ------------------------------------------------------------ */

  /* Odnóże kroczne: cienkie szczudło z kolanem wysoko nad ciałem. */
  /* Liściasty płatek na udzie: u modliszki duchowej wygląda jak zeschły listek. */
  function platekNaUdzie(ctx, a, b, wielkosc, pal, ksztaltP) {
    const mx = mieszaj(a.x, b.x, 0.5), my = mieszaj(a.y, b.y, 0.5);
    const kat = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(kat);
    if (ksztaltP === 'lisc') {
      ksztalt(ctx, () => {
        ctx.moveTo(-wielkosc, 0);
        ctx.quadraticCurveTo(0, -wielkosc * 1.15, wielkosc, 0);
        ctx.quadraticCurveTo(0, wielkosc * 0.5, -wielkosc, 0);
        ctx.closePath();
      }, pal.sredni, pal, 1.2);
      ctx.strokeStyle = pal.kontur; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(-wielkosc, 0); ctx.lineTo(wielkosc, 0); ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      const g = ctx.createRadialGradient(0, -wielkosc * 0.3, wielkosc * 0.1, 0, 0, wielkosc);
      g.addColorStop(0, pal.jasny); g.addColorStop(1, pal.sredni);
      ksztalt(ctx, () => ctx.ellipse(0, 0, wielkosc, wielkosc * 0.62, 0, 0, 7), g, pal, 1.1);
    }
    ctx.restore();
  }

  function odnozeKroczne(ctx, biodro, kolano, stopa, gr, pal, dalekie) {
    const p = dalekie ? przyciemniona(pal) : pal;
    segment(ctx, biodro, kolano, 1.9 * gr, 1.25 * gr, p);
    if (!dalekie && (pal.lisciasta || pal.platki)) {
      platekNaUdzie(ctx, biodro, kolano, (pal.platki ? 4.6 : 3.4) * gr, pal,
        pal.lisciasta ? 'lisc' : 'platek');
    }
    segment(ctx, kolano, stopa, 1.25 * gr, 0.62 * gr, p);
    segment(ctx, stopa, przesun(stopa, -7 * (stopa.x < 0 ? 1 : -1), -1.2), 0.62 * gr, 0.3 * gr, p);
  }

  /* Odnóże chwytne: biodro do przodu, grube udo w dół i do tyłu, goleń
     złożona z powrotem do góry. Kolce po wewnętrznej stronie. */
  function odnozeChwytne(ctx, pr, s, pal, uniesienie, dalekie) {
    const p = dalekie ? przyciemniona(pal) : pal;
    const gr = pr.grubosc, n = pr.nogi, u = uniesienie || 0;
    const a = przesun(s.kark, -3, 4);
    const b = pkt(a.x + 11 * n, a.y + (11 - u * 5) * n);
    const c = pkt(b.x - 7 * n, b.y + (17 - u * 6) * n);
    const d = pkt(c.x + 14 * n, c.y - (11 + u * 3) * n);
    segment(ctx, a, b, 2.3 * gr, 2.6 * gr, p);
    segment(ctx, b, c, 4.8 * gr, 2.7 * gr, p);
    kolce(ctx, b, c, 5, 2.8 * gr, 1, p);
    segment(ctx, c, d, 2.5 * gr, 1.1 * gr, p);
    kolce(ctx, c, d, 5, 2.2 * gr, -1, p);
    segment(ctx, d, przesun(d, 5 * n, -3.5 * n), 1.0 * gr, 0.45 * gr, p);
    if (pal.plamka && !dalekie) {
      const px = mieszaj(b.x, c.x, 0.3), py = mieszaj(b.y, c.y, 0.3);
      ctx.fillStyle = pal.kontur;
      ctx.beginPath(); ctx.arc(px, py, 2.8 * gr, 0, 7); ctx.fill();
      ctx.fillStyle = pal.oko;
      ctx.beginPath(); ctx.arc(px, py, 1.2 * gr, 0, 7); ctx.fill();
    }
    if (pal.platki && !dalekie) {          // płatkowate rozszerzenia u storczykowej
      ksztalt(ctx, () => {
        const mx = mieszaj(b.x, c.x, 0.5), my = mieszaj(b.y, c.y, 0.5);
        ctx.ellipse(mx - 3, my, 7.5 * gr, 4.6 * gr, 1.1, 0, 7);
      }, pal.jasny, pal, 1.3);
    }
  }

  function odwlok(ctx, pr, s, pal) {
    const w = (6.2 + (1 - pr.p) * 2.4) * pr.grubosc * 0.9;
    const hak = pkt(s.ogon.x - 2, s.ogon.y - w * 0.55);      // zadarty koniec odwłoka
    const g = ctx.createLinearGradient(0, s.meso.y - w * 2, 0, s.meso.y + w * 1.6);
    g.addColorStop(0, pal.jasny); g.addColorStop(0.5, pal.sredni); g.addColorStop(1, pal.ciemny);
    ksztalt(ctx, () => {
      ctx.moveTo(s.meso.x + 2, s.meso.y - w * 0.85);
      ctx.bezierCurveTo(s.meso.x - w * 1.4, s.meso.y - w * 1.5,
        mieszaj(s.meso.x, hak.x, 0.6), mieszaj(s.meso.y, hak.y, 0.55) - w * 1.25, hak.x, hak.y);
      ctx.quadraticCurveTo(hak.x + w * 0.5, hak.y + w * 0.7, s.ogon.x + w * 0.9, s.ogon.y + w * 0.35);
      ctx.bezierCurveTo(mieszaj(s.meso.x, s.ogon.x, 0.5), mieszaj(s.meso.y, s.ogon.y, 0.5) + w * 1.1,
        s.meso.x - w * 0.6, s.meso.y + w * 1.1, s.meso.x + 2, s.meso.y + w * 0.75);
      ctx.closePath();
    }, g, pal, 1.7);
    if (pal.lisciasta) {                       // postrzępiony, liściasty odwłok
      ctx.fillStyle = pal.sredni; ctx.strokeStyle = pal.kontur; ctx.lineWidth = 1.1;
      for (let i = 0; i < 4; i++) {
        const t = 0.25 + i * 0.2;
        const x = mieszaj(s.meso.x, hak.x, t), y = mieszaj(s.meso.y, hak.y, t) + w * 0.7;
        const r = w * (0.5 - i * 0.06);
        ctx.beginPath();
        ctx.moveTo(x - r, y - r * 0.4);
        ctx.quadraticCurveTo(x, y + r * 1.3, x + r, y - r * 0.4);
        ctx.quadraticCurveTo(x, y + r * 0.2, x - r, y - r * 0.4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 0.85;
    for (let i = 1; i <= 6; i++) {
      const t = i / 7;
      const x = mieszaj(s.meso.x, hak.x, t), y = mieszaj(s.meso.y, hak.y, t);
      ctx.beginPath();
      ctx.moveTo(x, y - w * (1 - t * 0.55));
      ctx.quadraticCurveTo(x - 1.5, y, x, y + w * 0.8 * (1 - t * 0.55));
      ctx.stroke();
    }
  }

  /* Tułów środkowy i długi przedtułów. */
  function tulow(ctx, pr, s, pal) {
    const gr = pr.grubosc;
    ksztalt(ctx, () => {
      ctx.moveTo(s.meso.x + 4, s.meso.y - 5 * gr);
      ctx.quadraticCurveTo(s.pro.x + 3, s.pro.y - 5.4 * gr, s.pro.x + 4, s.pro.y + 1);
      ctx.quadraticCurveTo(s.meso.x + 2, s.meso.y + 5 * gr, s.meso.x - 3, s.meso.y + 3 * gr);
      ctx.quadraticCurveTo(s.meso.x - 4, s.meso.y - 3 * gr, s.meso.x + 4, s.meso.y - 5 * gr);
      ctx.closePath();
    }, gradientProstopadly(ctx, s.meso, s.pro, 6 * gr, pal), pal, 1.7);
    segment(ctx, s.pro, s.kark, 3.7 * gr, 2.5 * gr, pal);
    /* delikatny grzbiet przedtułowia */
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(s.pro.x - 1, s.pro.y - 2.2 * gr);
    ctx.lineTo(s.kark.x - 1, s.kark.y - 1.6 * gr);
    ctx.stroke();
  }

  function zawiazkiSkrzydel(ctx, pr, s, pal) {
    if (!pr.zawiazki) return;
    const a = przesun(s.meso, 3, -4.5);
    const b = pkt(a.x - pr.zawiazki, a.y + pr.zawiazki * 0.22);
    ksztalt(ctx, () => {
      ctx.moveTo(a.x, a.y - 3.4);
      ctx.quadraticCurveTo(b.x + 3, b.y - 5, b.x, b.y);
      ctx.quadraticCurveTo(b.x + 5, b.y + 3, a.x, a.y + 3);
      ctx.closePath();
    }, pal.sredni, pal, 1.3);
  }

  function skrzydla(ctx, pr, s, pal, rozlozone) {
    if (!pr.skrzydla) return;
    const a = przesun(s.meso, 4, -5);
    const dl = pr.odwlok + 14;
    const b = rozlozone ? pkt(a.x - dl * 0.86, a.y - dl * 0.42) : pkt(a.x - dl, a.y + 3);
    ksztalt(ctx, () => {
      ctx.moveTo(a.x, a.y - 2);
      ctx.bezierCurveTo(mieszaj(a.x, b.x, 0.35), a.y - 12, mieszaj(a.x, b.x, 0.78), b.y - 12, b.x, b.y);
      ctx.bezierCurveTo(mieszaj(a.x, b.x, 0.78), b.y + 5, mieszaj(a.x, b.x, 0.35), a.y + 7, a.x, a.y + 4);
      ctx.closePath();
    }, pal.skrzydlo, pal, 1.2);
    ctx.strokeStyle = 'rgba(60,80,35,0.25)'; ctx.lineWidth = 0.65;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(a.x - 1, a.y - 2 + i * 1.2);
      ctx.quadraticCurveTo(mieszaj(a.x, b.x, 0.5), mieszaj(a.y, b.y, 0.5) - 7 + i * 2.6, b.x + 2, b.y + i * 0.5);
      ctx.stroke();
    }
  }

  /* Głowa: trójkąt szerszy niż wyższy, w profilu widać jedno duże oko,
     drugie tylko wystaje zza niego. Fałszywa źrenica patrzy na cel. */
  function glowa(ctx, pr, s, pal, patrzy) {
    const sk = pr.glowa * 1.15;
    ctx.save();
    ctx.translate(s.kark.x, s.kark.y);
    ctx.rotate(s.katGlowy + 0.18);

    /* dalsze oko */
    ksztalt(ctx, () => ctx.ellipse(1.5 * sk, -5.6 * sk, 3.5 * sk, 4.0 * sk, 0.1, 0, 7),
      pal.ciemny, pal, 1.2);

    const g = ctx.createLinearGradient(0, -6 * sk, 2 * sk, 5 * sk);
    g.addColorStop(0, pal.jasny); g.addColorStop(0.65, pal.sredni); g.addColorStop(1, pal.ciemny);
    ksztalt(ctx, () => {
      ctx.moveTo(-3.8 * sk, -6.2 * sk);
      ctx.quadraticCurveTo(5 * sk, -8.2 * sk, 11.8 * sk, -5.4 * sk);
      ctx.quadraticCurveTo(11.2 * sk, -0.4 * sk, 7.4 * sk, 3.2 * sk);
      ctx.quadraticCurveTo(4.4 * sk, 6.4 * sk, 1.2 * sk, 4.4 * sk);
      ctx.quadraticCurveTo(-3.2 * sk, 1.6 * sk, -3.8 * sk, -6.2 * sk);
      ctx.closePath();
    }, g, pal, 1.6);

    if (pal.lisciasta) {                     // wyrostek na głowie modliszki duchowej
      ksztalt(ctx, () => {
        ctx.moveTo(1 * sk, -6 * sk);
        ctx.quadraticCurveTo(-1 * sk, -14 * sk, 4 * sk, -16 * sk);
        ctx.quadraticCurveTo(8 * sk, -13 * sk, 5.5 * sk, -5.6 * sk);
        ctx.closePath();
      }, pal.sredni, pal, 1.3);
    }

    /* bliższe oko, duże, na górno przednim rogu głowy */
    const ox = 8.4 * sk, oy = -4.4 * sk, r = 4.0 * sk;
    const go = ctx.createRadialGradient(ox - r * 0.3, oy - r * 0.45, r * 0.1, ox, oy, r);
    go.addColorStop(0, pal.oko); go.addColorStop(0.55, pal.jasny); go.addColorStop(1, pal.sredni);
    ksztalt(ctx, () => ctx.ellipse(ox, oy, r * 0.94, r * 1.24, 0.3, 0, 7), go, pal, 1.4);
    /* fałszywa źrenica, ciemny punkt, który zawsze zdaje się patrzeć na gracza */
    ctx.fillStyle = pal.zrenica;
    ctx.beginPath();
    ctx.arc(ox + (patrzy === false ? 0 : 1.2) * sk, oy + 0.9 * sk, r * 0.36, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(ox - r * 0.36, oy - r * 0.52, r * 0.2, 0, 7);
    ctx.fill();

    /* czułki */
    ctx.strokeStyle = pal.kontur; ctx.lineWidth = 1.0 * pr.grubosc; ctx.lineCap = 'round';
    [[1, -1], [0.85, 0.35]].forEach(([dl, od]) => {
      ctx.beginPath();
      ctx.moveTo(7 * sk, -6.2 * sk);
      ctx.quadraticCurveTo(22 * sk * dl, -14 * sk * dl, 38 * sk * dl, (-9 + od * 5) * sk * dl);
      ctx.stroke();
    });

    /* aparat gębowy */
    ctx.fillStyle = pal.ciemny;
    ctx.beginPath(); ctx.ellipse(5.6 * sk, 3.6 * sk, 2.1 * sk, 1.5 * sk, 0.5, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* --- całość ------------------------------------------------------------ */

  function rysuj(ctx, o) {
    const pr = proporcje(o.stadium || 1);
    const pal = GATUNKI[o.gatunek || 'zwyczajna'];
    const z = o.poza || {};
    const s = szkielet(pr, z);
    const gr = pr.grubosc, n = pr.nogi;
    const u = z.rozlozoneOdnoza || 0;

    ctx.save();
    ctx.translate(o.x, o.y);
    const skala = (o.dlugosc || 100) / 100;
    ctx.scale(skala * (o.kierunek === -1 ? -1 : 1), skala);

    if (o.cien !== false) {
      ctx.fillStyle = 'rgba(40,60,20,0.15)';
      ctx.beginPath(); ctx.ellipse(-4, 1.5, pr.odwlok * 0.9, 3.6, 0, 0, 7); ctx.fill();
    }

    /* dalsza strona ciała */
    odnozeKroczne(ctx, przesun(s.biodro, 3, 0), pkt(-10 * n + 3, s.biodro.y - 19 * n), pkt(-24 * n, 0), gr, pal, true);
    odnozeKroczne(ctx, przesun(s.meso, 3, 0), pkt(17 * n + 3, s.meso.y - 17 * n), pkt(25 * n, 0), gr, pal, true);
    odnozeChwytne(ctx, pr, s, pal, u, true);

    skrzydla(ctx, pr, s, pal, !!z.skrzydlaRozlozone);
    odwlok(ctx, pr, s, pal);
    zawiazkiSkrzydel(ctx, pr, s, pal);
    tulow(ctx, pr, s, pal);

    /* bliższa strona */
    odnozeKroczne(ctx, s.biodro, pkt(-13 * n, s.biodro.y - 21 * n), pkt(-29 * n, 0), gr, pal, false);
    odnozeKroczne(ctx, s.meso, pkt(19 * n, s.meso.y - 19 * n), pkt(29 * n, 0), gr, pal, false);
    odnozeChwytne(ctx, pr, s, pal, u, false);
    glowa(ctx, pr, s, pal, o.patrzy);

    ctx.restore();
  }

  globalny.Modliszka = { rysuj, proporcje, GATUNKI };
})(window);
