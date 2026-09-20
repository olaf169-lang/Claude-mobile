/* ==========================================================================
   MANTIS, album ciekawostek (etap M6)
   Karty odkrywają się w trakcie gry: za spotkane owady, wylinkę, każdą
   modliszkę, skrzydła i ootekę. W grze solo nic nie zatrzymuje rozgrywki,
   pojawia się tylko mały listek w rogu. We wspólnej grze z dorosłym album
   daje o czym rozmawiać: każda karta ma jedno lub dwa zdania dla dorosłego.
   ========================================================================== */

(function (globalny) {
  'use strict';

  /* Definicje kart. id musi być stałe (trafia do zapisu).
     rys: jak narysować miniaturę ('owad:typ', 'modliszka:gatunek', 'ikona:...'). */
  const KARTY = [
    { id: 'owad:muszka', tytul: 'Muszka owocówka', rys: 'owad:muszka',
      fakt: 'Malutka i wszędobylska. Idealny pierwszy kąsek dla młodej modliszki.' },
    { id: 'owad:mszyca', tytul: 'Mszyca', rys: 'owad:mszyca',
      fakt: 'Prawie się nie rusza, siedzi na łodygach. Łatwa zdobycz.' },
    { id: 'owad:mrowka', tytul: 'Mrówka', rys: 'owad:mrowka',
      fakt: 'Modliszki mrówek nie jadą, bo te gryzą i bronią się kwasem. Dlatego w grze mrówki tylko chodzą.' },
    { id: 'owad:mucha', tytul: 'Mucha domowa', rys: 'owad:mucha',
      fakt: 'Szybka i czujna. Trzeba podejść wolno, żeby jej nie spłoszyć.' },
    { id: 'owad:cma', tytul: 'Ćma', rys: 'owad:cma',
      fakt: 'Lata chwiejnie i ciągnie do światła. Miękka, więc smaczna.' },
    { id: 'owad:swierszcz', tytul: 'Świerszcz', rys: 'owad:swierszcz',
      fakt: 'Kiedy się przestraszy, robi ogromny skok. Duży posiłek dla większej modliszki.' },
    { id: 'owad:wazka', tytul: 'Ważka', rys: 'owad:wazka',
      fakt: 'Najszybszy owad na planszy. Złapać ważkę potrafi tylko dorosła modliszka, i to jest nie lada wyczyn.' },
    { id: 'modliszka:zwyczajna', tytul: 'Modliszka zwyczajna', lac: 'Mantis religiosa', rys: 'modliszka:zwyczajna',
      fakt: 'Żyje także w Polsce i jest pod ochroną. Pod odnóżem ma czarną plamkę jak oko, którą straszy.' },
    { id: 'modliszka:duchowa', tytul: 'Modliszka duchowa', lac: 'Phyllocrania paradoxa', rys: 'modliszka:duchowa',
      fakt: 'Wygląda jak zeschły liść i kołysze się na wietrze. Stojąc nieruchomo jest prawie niewidzialna.' },
    { id: 'modliszka:storczykowa', tytul: 'Modliszka storczykowa', lac: 'Hymenopus coronatus', rys: 'modliszka:storczykowa',
      fakt: 'Wygląda jak kwiat i wabi owady lepiej niż prawdziwe kwiaty. Młoda udaje mrówkę, żeby jej nie zjedzono.' },
    { id: 'ikona:glowa', tytul: 'Ruchoma głowa', rys: 'ikona:glowa',
      fakt: 'Modliszka jako jedyny owad obraca głowę prawie dookoła i patrzy wprost na ciebie.' },
    { id: 'ikona:atak', tytul: 'Błyskawiczny chwyt', rys: 'ikona:atak',
      fakt: 'Uderzenie odnóży trwa krócej niż mrugnięcie oka, około pięć setnych sekundy. W grze jest zwolnione, żeby dało się je zobaczyć.' },
    { id: 'ikona:wylinka', tytul: 'Wylinka', rys: 'ikona:wylinka',
      fakt: 'Żeby urosnąć, modliszka zrzuca starą skórę. Robi to wisząc głową w dół, bo grawitacja pomaga jej wyjść.' },
    { id: 'ikona:skrzydla', tytul: 'Skrzydła', rys: 'ikona:skrzydla',
      fakt: 'Skrzydła pojawiają się dopiero po ostatniej wylince, u dorosłej modliszki. Wychodzą zmięte i prostują się przez chwilę.' },
    { id: 'ikona:ooteka', tytul: 'Ooteka', rys: 'ikona:ooteka',
      fakt: 'Dorosła samica składa kokon z pianki, która twardnieje. Wychodzą z niego dziesiątki maleńkich modliszek.' }
  ];

  function karta(id) { return KARTY.find(k => k.id === id); }

  /* Rysuje miniaturę karty na podanym canvasie. */
  function rysujMini(canvas, def, odkryta) {
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;
    if (def.rys.startsWith('owad:')) {
      const typ = def.rys.slice(5);
      globalny.Owad.rysuj(c, { x: W / 2, y: H / 2 + 6, typ, faza: 1.2, kierunek: 1, naZiemi: false, rozmiar: 90 });
    } else if (def.rys.startsWith('modliszka:')) {
      const g = def.rys.slice(10);
      globalny.Modliszka.rysuj(c, { x: W / 2, y: H - 14, dlugosc: 120, stadium: 8, gatunek: g, kierunek: 1, cien: false,
        poza: { kolysanie: 0, rozlozoneOdnoza: 0.25, krok: 0, intensywnosc: 0 } });
    } else {
      /* ikony pojęć: prosty symbol */
      c.fillStyle = '#6e9a33'; c.font = '600 44px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const znak = { 'ikona:glowa': '👁️', 'ikona:atak': '⚡', 'ikona:wylinka': '🍃', 'ikona:skrzydla': '🦋', 'ikona:ooteka': '🥚' }[def.rys] || '⭐';
      c.fillText(znak, W / 2, H / 2);
    }
    if (!odkryta) {
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = 'rgba(40,50,30,0.9)'; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = 'rgba(80,100,60,0.5)'; c.font = '40px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('?', W / 2, H / 2);
    }
  }

  globalny.Album = { KARTY, karta, rysujMini };
})(window);
