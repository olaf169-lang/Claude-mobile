/* ==========================================================================
   MANTIS, rysunek owadów (etap M2)
   Owady są złożone z części tak samo jak modliszka: korpus, głowa, skrzydła
   (machają), odnóża, czułki. Typ decyduje o rozmiarze, kolorze, kształcie
   i sposobie poruszania. Wartości polowania (czujność, pożywienie, od
   którego stadium) są w danych, żeby dało się je stroić bez ruszania kodu.

   Układ lokalny: owad ma około 40 jednostek długości, (0,0) to środek
   korpusu, patrzy w prawo.
   ========================================================================== */

(function (globalny) {
  'use strict';

  const TYPY = {
    muszka:   { nazwa: 'muszka owocówka', ruch: 'lot-zryw', czujnosc: 0.0, pozywienie: 1, odStadium: 1,
                skala: 0.62, korpus: '#6b6f78', oko: '#a33', skrzydla: true, dlugie: false },
    mszyca:   { nazwa: 'mszyca', ruch: 'pelza', czujnosc: 0.0, pozywienie: 1, odStadium: 1,
                skala: 0.58, korpus: '#9ccb6a', oko: '#2b3f14', skrzydla: false, pekata: true },
    mrowka:   { nazwa: 'mrówka', ruch: 'tlo', czujnosc: 1, pozywienie: 0, odStadium: 1,
                skala: 0.62, korpus: '#7a3b22', oko: '#1a0d06', skrzydla: false, segmenty: true },
    mucha:    { nazwa: 'mucha domowa', ruch: 'lot-luk', czujnosc: 0.5, pozywienie: 1, odStadium: 3,
                skala: 0.82, korpus: '#3b3f47', oko: '#8a2f2f', skrzydla: true, dlugie: false },
    cma:      { nazwa: 'ćma', ruch: 'lot-chwiej', czujnosc: 0.3, pozywienie: 2, odStadium: 5,
                skala: 1.05, korpus: '#b7a184', oko: '#3a2a18', skrzydla: true, cma: true },
    swierszcz:{ nazwa: 'świerszcz', ruch: 'skok', czujnosc: 0.7, pozywienie: 3, odStadium: 5,
                skala: 1.15, korpus: '#5f7a34', oko: '#20130a', skrzydla: false, dlugonogi: true },
    wazka:    { nazwa: 'ważka', ruch: 'lot-szybki', czujnosc: 0.9, pozywienie: 5, odStadium: 8,
                skala: 1.35, korpus: '#3aa6b0', oko: '#123', skrzydla: true, wazka: true, dlugie: true }
  };

  const mieszaj = (a, b, t) => a + (b - a) * t;

  function przyciemnij(hex, ile) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 255) * (1 - ile)) | 0;
    const g = Math.max(0, ((n >> 8) & 255) * (1 - ile)) | 0;
    const b = Math.max(0, (n & 255) * (1 - ile)) | 0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function skrzydlo(ctx, x, y, dl, sz, kat, cma) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(kat);
    const g = ctx.createLinearGradient(0, 0, dl, 0);
    if (cma) { g.addColorStop(0, 'rgba(210,196,170,0.9)'); g.addColorStop(1, 'rgba(180,160,130,0.55)'); }
    else { g.addColorStop(0, 'rgba(230,238,250,0.75)'); g.addColorStop(1, 'rgba(200,215,235,0.35)'); }
    ctx.fillStyle = g;
    ctx.strokeStyle = cma ? 'rgba(120,100,70,0.5)' : 'rgba(150,170,200,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(dl * 0.5, 0, dl * 0.5, sz, 0, 0, 7);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function rysuj(ctx, o) {
    const typ = TYPY[o.typ];
    const faza = o.faza || 0;
    ctx.save();
    ctx.translate(o.x, o.y);
    const sk = (o.skala || 1) * typ.skala * (o.rozmiar || 40);
    ctx.scale((o.kierunek === -1 ? -1 : 1) * sk / 40, sk / 40);

    const ciemny = przyciemnij(typ.korpus, 0.35);

    /* cień pod owadem, jeśli chodzi po ziemi */
    if (o.naZiemi) {
      ctx.fillStyle = 'rgba(30,50,15,0.14)';
      ctx.beginPath(); ctx.ellipse(0, 16, 15, 3, 0, 0, 7); ctx.fill();
    }

    /* odnóża */
    ctx.strokeStyle = ciemny; ctx.lineCap = 'round';
    ctx.lineWidth = typ.dlugonogi ? 2.2 : 1.6;
    const roznogi = typ.dlugonogi ? 3 : 3;
    for (let i = 0; i < roznogi; i++) {
      const bx = -6 + i * 6;
      const ruchN = Math.sin(faza * 6 + i) * (o.naZiemi ? 3 : 1);
      ctx.beginPath();
      ctx.moveTo(bx, 6);
      if (typ.dlugonogi && i === roznogi - 1) {          // tylne skoczne nogi świerszcza
        ctx.lineTo(bx - 4, 2); ctx.lineTo(bx + 6 + ruchN, 18);
      } else {
        ctx.lineTo(bx + ruchN, 15);
      }
      ctx.stroke();
    }

    /* skrzydła machają, gdy leci */
    if (typ.skrzydla) {
      const trzepot = o.naZiemi ? 0.15 : Math.sin(faza * 30) * 0.5 + 0.2;
      if (typ.wazka) {
        skrzydlo(ctx, -1, -2, 22, 4, -0.2 - trzepot * 0.4, false);
        skrzydlo(ctx, -1, -2, 22, 4, 0.2 + trzepot * 0.4, false);
        skrzydlo(ctx, -5, -1, 20, 3.5, -0.15 - trzepot * 0.4, false);
        skrzydlo(ctx, -5, -1, 20, 3.5, 0.15 + trzepot * 0.4, false);
      } else {
        const dl = typ.cma ? 26 : 18, sz = typ.cma ? 12 : 6;
        skrzydlo(ctx, -2, -3, dl, sz, -0.3 - trzepot, typ.cma);
        skrzydlo(ctx, -2, -3, dl, sz, -0.3 + trzepot, typ.cma);
      }
    }

    /* korpus */
    const g = ctx.createLinearGradient(0, -8, 0, 9);
    g.addColorStop(0, typ.korpus); g.addColorStop(1, ciemny);
    ctx.fillStyle = g; ctx.strokeStyle = ciemny; ctx.lineWidth = 1;
    ctx.beginPath();
    if (typ.pekata) ctx.ellipse(0, 2, 9, 8, 0, 0, 7);
    else if (typ.segmenty) {
      ctx.ellipse(-7, 2, 5, 4.5, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2, 2, 6, 5, 0, 0, 7);
    } else if (typ.wazka) {
      ctx.ellipse(-2, 2, 8, 5, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, 0);
      ctx.lineTo(-26, -1); ctx.lineTo(-26, 3); ctx.lineTo(-6, 4); ctx.closePath();
    } else ctx.ellipse(0, 2, 12, 6, 0, 0, 7);
    ctx.fill(); ctx.stroke();

    /* głowa */
    ctx.fillStyle = ciemny;
    ctx.beginPath(); ctx.arc(typ.segmenty ? 9 : 11, 0, typ.pekata ? 3.5 : 4.2, 0, 7); ctx.fill();
    /* oko */
    ctx.fillStyle = typ.oko;
    ctx.beginPath(); ctx.arc((typ.segmenty ? 10 : 12), -1, 1.8, 0, 7); ctx.fill();
    /* czułki */
    ctx.strokeStyle = ciemny; ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(12, -2); ctx.quadraticCurveTo(20, -8, 24, -5);
    ctx.moveTo(12, -2); ctx.quadraticCurveTo(20, -5, 25, -1);
    ctx.stroke();

    ctx.restore();
  }

  globalny.Owad = { rysuj, TYPY };
})(window);
