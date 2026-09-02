/* ==========================================================================
   Telefon gracza — brzęczyk z czterema kafelkami.
   --------------------------------------------------------------------------
   Nic tu nie jest rozstrzygane: telefon pokazuje to, co nadał prowadzący,
   i odsyła jedno kliknięcie (albo, gdy przyjdzie kolej, wybrany temat rundy).
   Czas mierzy jednak u siebie — od chwili, w której pytanie faktycznie
   pojawiło się na ekranie. Dzięki temu wolniejsze łącze nie zabiera punktów,
   a szybsze ich nie dodaje.

   Telefon gracza celowo nie zna katalogu utworów — prowadzący dosyła w każdej
   wiadomości gotowe opisy (nazwy kategorii, emoji, liczbę pytań), żeby nie
   trzeba było ściągać tu tysiąca kilkuset piosenek tylko po to, żeby kliknąć
   jedną z czterech odpowiedzi albo zaznaczyć temat swojej rundy.
   ========================================================================== */

import { $, el, wyczysc, pokazEkran, biezacyEkran, powiadom, stuknij, trzymajEkran } from './ui.js';
import { PokojGracza, idUrzadzenia } from './siec.js';

const KSZTALTY = ['▲', '◆', '●', '■'];
const ODSTEP_PUKANIA_MS = 6000;

export function uruchom() {
  const mojeId = idUrzadzenia();
  const pokoj = new PokojGracza(mojeId);

  const stan = {
    ksywka: localStorage.getItem('jtm:ksywka') || '',
    nrPytania: -1,
    limitMs: 15_000,
    pokazano: 0,
    offsetMs: 0,
    koniec: 0,
    wybor: null,
    punkty: 0,
    blokadaEkranu: null,
    // Rundy: który zestaw broadcastów już obsłużyliśmy, żeby cykliczne
    // powtórki tej samej wiadomości nie zresetowały tego, co gracz właśnie robi.
    kluczWyboru: null,           // `${nrRundyGry}/${probaTematu}` ostatnio pokazanego ekranu wyboru
    kluczOdliczania: null,
    kluczWynikowRundy: null,
    tematOpcje: null,            // { kategorie, dekady } — opcje do wyboru, przysłane przez prowadzącego
    wyborTemat: null,            // robocza (jeszcze niewysłana) wersja wyboru
  };

  let tykanie = null;
  let pukanie = null;

  /* ------------------------------------------------------------ dołączanie */

  function pokazFormularz(kod = '', broker = null) {
    $('#pole-kodu').value = kod;
    $('#pole-ksywki').value = stan.ksywka;
    $('#formularz-dolaczenia').dataset.broker = broker === null ? '' : String(broker);
    pokazEkran('dolaczanie');
    // Kod z QR jest już wpisany, więc od razu kursor tam, gdzie trzeba coś zrobić.
    setTimeout(() => (kod ? $('#pole-ksywki') : $('#pole-kodu')).focus(), 120);
  }

  $('#formularz-dolaczenia').addEventListener('submit', async (zdarzenie) => {
    zdarzenie.preventDefault();
    const kod = $('#pole-kodu').value.trim().toUpperCase();
    const ksywka = $('#pole-ksywki').value.trim().slice(0, 14);
    if (kod.length !== 4 || !ksywka) {
      powiadom('Wpisz czteroznakowy kod i swoją ksywkę.', 'blad');
      return;
    }

    const przycisk = $('#dolacz');
    przycisk.disabled = true;
    przycisk.textContent = 'Szukam pokoju…';
    const podpowiedz = $('#formularz-dolaczenia').dataset.broker;

    try {
      const powitanie = await pokoj.dolacz(
        kod, ksywka,
        podpowiedz === '' ? null : Number(podpowiedz),
        (nazwa) => { $('#stan-dolaczania').textContent = `Sprawdzam ${nazwa}…`; },
      );
      if (powitanie.t === 'pelno') {
        powiadom(powitanie.powod || 'Pokój jest pełny.', 'blad');
        return;
      }
      stan.ksywka = powitanie.ksywka || ksywka;
      stan.punkty = powitanie.punkty || 0;
      localStorage.setItem('jtm:ksywka', stan.ksywka);
      $('#moja-ksywka').textContent = stan.ksywka;
      $('#stan-dolaczania').textContent = '';
      stan.blokadaEkranu = await trzymajEkran();
      wlaczPukanie();
      pokazEkran('poczekalnia');
    } catch (blad) {
      $('#stan-dolaczania').textContent = '';
      powiadom(pierwszyPowod(blad.message), 'blad');
    } finally {
      przycisk.disabled = false;
      przycisk.textContent = 'Wchodzę';
    }
  });

  /** Z listy prób pokazujemy tę najbardziej wymowną, nie wszystkie trzy. */
  function pierwszyPowod(tekst) {
    const wiersze = String(tekst).split('\n').filter(Boolean);
    const oPokoju = wiersze.find((w) => w.includes('nikt nie prowadzi'));
    if (oPokoju) return 'Nie ma takiego pokoju. Sprawdź kod — prowadzący musi mieć otwarte lobby.';
    return wiersze[0] || 'Nie udało się połączyć.';
  }

  function wlaczPukanie() {
    clearInterval(pukanie);
    pukanie = setInterval(() => pokoj.nadaj({ t: 'puk', id: mojeId }), ODSTEP_PUKANIA_MS);
  }

  /* -------------------------------------------------- wiadomości od prowadzącego */

  pokoj.onStanLacza = (jak) => {
    const znacznik = $('#stan-lacza');
    znacznik.hidden = false;
    znacznik.dataset.stan = jak;
    znacznik.textContent = { lacze: 'łączę…', polaczono: 'w sieci', zerwane: 'brak łącza' }[jak] || jak;
  };

  pokoj.onWiadomosc = (wiadomosc) => {
    if (wiadomosc.t === 'lobby') pokazLobby(wiadomosc);
    else if (wiadomosc.t === 'wybor') pokazWybor(wiadomosc);
    else if (wiadomosc.t === 'odliczanie') pokazOdliczanie(wiadomosc);
    else if (wiadomosc.t === 'runda') pokazRunde(wiadomosc);
    else if (wiadomosc.t === 'odslona') pokazOdslone(wiadomosc);
    else if (wiadomosc.t === 'wyniki-rundy') pokazWynikiRundy(wiadomosc);
    else if (wiadomosc.t === 'koniec') pokazKoniec(wiadomosc);
  };

  function pokazLobby(wiadomosc) {
    if (biezacyEkran() === 'dolaczanie') return;
    if (biezacyEkran() !== 'poczekalnia') pokazEkran('poczekalnia');
    const lista = wyczysc($('#lista-graczy-gracz'));
    for (const gracz of wiadomosc.gracze || []) {
      lista.append(el('li', { klasa: 'gracz' }, [el('span', { klasa: 'kropka' }), gracz.ksywka]));
    }
    const ilu = (wiadomosc.gracze || []).length;
    $('#poczekalnia-info').textContent = ilu > 1
      ? `Jest was ${ilu}. Czekamy na prowadzącego.`
      : 'Czekamy na resztę i na prowadzącego.';
  }

  /* -------------------------------------------------------- wybór tematu */

  function pokazWybor(wiadomosc) {
    const klucz = `${wiadomosc.nrRundyGry}/${wiadomosc.probaTematu}`;
    const jaWybieram = !wiadomosc.sterujeProwadzacy && wiadomosc.wybierajacy === mojeId;

    if (jaWybieram) {
      if (stan.kluczWyboru === klucz) return;      // ten sam panel już stoi — nie zrywaj wyboru w trakcie klikania
      stan.kluczWyboru = klucz;
      stan.tematOpcje = { kategorie: wiadomosc.kategorieDostepne || [], dekady: wiadomosc.dekadyDostepne || [] };
      stan.wyborTemat = {
        kategorie: stan.tematOpcje.kategorie.map((k) => k.id),
        dekady: stan.tematOpcje.dekady.map((d) => d.id),
      };
      rysujWyborGracza();
      $('#gracz-zacznij-runde').disabled = false;
      $('#gracz-zacznij-runde').textContent = 'Zaczynamy rundę';
      pokazEkran('gracz-wybor');
      stuknij(20);
      return;
    }

    if (stan.kluczWyboru === klucz) return;
    stan.kluczWyboru = klucz;
    $('#gracz-czekaj-temat-tytul').textContent = `Runda ${wiadomosc.nrRundyGry}/${wiadomosc.ileRund}`;
    $('#gracz-czekaj-temat-opis').textContent = wiadomosc.sterujeProwadzacy
      ? 'Prowadzący wybiera temat tej rundy.'
      : wiadomosc.ksywka
        ? `${wiadomosc.ksywka} wybiera temat tej rundy.`
        : 'Losujemy, kto wybierze temat…';
    pokazEkran('gracz-czekaj-temat');
  }

  /** Wielokrotny wybór, w którym nie da się odznaczyć wszystkiego. */
  function przelaczWybor(lista, wartosc) {
    const bez = lista.filter((x) => x !== wartosc);
    if (bez.length === lista.length) return [...lista, wartosc];
    if (!bez.length) { powiadom('Zostaw przynajmniej jedną pozycję.'); return lista; }
    return bez;
  }

  function znaczekWyboru(tekst, wcisniety, naklik) {
    return el('button', {
      klasa: 'znaczek', type: 'button', 'aria-pressed': String(wcisniety), tekst, naclick: naklik,
    });
  }

  function rysujWyborGracza() {
    const kategorie = wyczysc($('#gracz-wybor-kategorii'));
    for (const kat of stan.tematOpcje.kategorie) {
      kategorie.append(znaczekWyboru(`${kat.emoji} ${kat.nazwa}`, stan.wyborTemat.kategorie.includes(kat.id), () => {
        stan.wyborTemat.kategorie = przelaczWybor(stan.wyborTemat.kategorie, kat.id);
        rysujWyborGracza();
      }));
    }
    const dekady = wyczysc($('#gracz-wybor-dekad'));
    for (const dek of stan.tematOpcje.dekady) {
      dekady.append(znaczekWyboru(dek.nazwa, stan.wyborTemat.dekady.includes(dek.id), () => {
        stan.wyborTemat.dekady = przelaczWybor(stan.wyborTemat.dekady, dek.id);
        rysujWyborGracza();
      }));
    }
  }

  $('#gracz-temat-wszystko').addEventListener('click', () => {
    if (!stan.tematOpcje) return;
    stan.wyborTemat = {
      kategorie: stan.tematOpcje.kategorie.map((k) => k.id),
      dekady: stan.tematOpcje.dekady.map((d) => d.id),
    };
    rysujWyborGracza();
  });

  $('#gracz-zacznij-runde').addEventListener('click', () => {
    if (!stan.wyborTemat) return;
    pokoj.nadaj({ t: 'temat', id: mojeId, kategorie: stan.wyborTemat.kategorie, dekady: stan.wyborTemat.dekady });
    $('#gracz-zacznij-runde').disabled = true;
    $('#gracz-zacznij-runde').textContent = 'Wysłano — czekamy…';
  });

  /* -------------------------------------------------------------- odliczanie */

  function pokazOdliczanie(wiadomosc) {
    const klucz = `${wiadomosc.nrRundyGry}`;
    if (stan.kluczOdliczania !== klucz || biezacyEkran() !== 'gracz-odliczanie') {
      stan.kluczOdliczania = klucz;
      $('#gracz-temat-rundy-opis').textContent = wiadomosc.temat || '';
      pokazEkran('gracz-odliczanie');
    }
    stan.koniec = performance.now() + wiadomosc.pozostaloMs;
    wlaczOdliczanieGracza();
  }

  function wlaczOdliczanieGracza() {
    clearInterval(tykanie);
    const tyknij = () => {
      const zostalo = Math.max(0, stan.koniec - performance.now());
      $('#gracz-odliczanie-liczba').textContent = String(Math.max(1, Math.ceil(zostalo / 1000)));
      if (zostalo <= 0) clearInterval(tykanie);
    };
    tyknij();
    tykanie = setInterval(tyknij, 100);
  }

  /* ------------------------------------------------------------------ runda */

  function pokazRunde(wiadomosc) {
    const nowa = wiadomosc.nr !== stan.nrPytania;
    if (nowa) {
      stan.nrPytania = wiadomosc.nr;
      stan.limitMs = wiadomosc.limitMs;
      stan.wybor = null;
      // Ile z pytania już przeszło, zanim trafiło na ten ekran. Dla telefonu,
      // który dołączył w połowie, to nie będzie zero.
      stan.offsetMs = Math.max(0, wiadomosc.limitMs - wiadomosc.pozostaloMs);
      stan.pokazano = performance.now();

      $('#numer-rundy-gracz').textContent =
        `Runda ${wiadomosc.nrRundyGry}/${wiadomosc.ileRund} · piosenka ${wiadomosc.nr + 1}/${wiadomosc.ile}`;
      $('#moje-punkty').textContent = `${stan.punkty} pkt`;
      $('#pytanie-gracza').textContent = wiadomosc.pytanie;
      $('#potwierdzenie').hidden = true;
      rysujKafelki(wiadomosc.odpowiedzi);
      pokazEkran('gracz-runda');
      stuknij(18);
    }
    stan.koniec = performance.now() + wiadomosc.pozostaloMs;
    wlaczPasek();
  }

  function rysujKafelki(odpowiedzi) {
    const miejsce = wyczysc($('#odpowiedzi-gracza'));
    odpowiedzi.forEach((tresc, nr) => {
      miejsce.append(el('button', {
        klasa: 'odp', type: 'button', 'data-kolor': nr, 'data-nr': nr,
        naclick: () => odpowiedz(nr),
      }, [
        el('span', { klasa: 'ksztalt', 'aria-hidden': 'true', tekst: KSZTALTY[nr] }),
        el('span', { klasa: 'tresc', tekst: tresc }),
      ]));
    });
  }

  function odpowiedz(nr) {
    if (stan.wybor !== null) return;
    stan.wybor = nr;
    const czasMs = Math.round(stan.offsetMs + (performance.now() - stan.pokazano));
    pokoj.nadaj({ t: 'odp', id: mojeId, nr: stan.nrPytania, wybor: nr, czasMs });
    stuknij([12, 40, 12]);

    for (const kafelek of $('#odpowiedzi-gracza').children) {
      const jego = Number(kafelek.dataset.nr);
      kafelek.dataset.wybrana = jego === nr ? 'tak' : 'nie';
      if (jego !== nr) kafelek.dataset.stan = 'przygasla';
      kafelek.disabled = true;
    }
    const sekundy = (czasMs / 1000).toFixed(1).replace('.', ',');
    $('#potwierdzenie').textContent = `Zapisane po ${sekundy} s. Czekamy na resztę.`;
    $('#potwierdzenie').hidden = false;
  }

  function wlaczPasek() {
    clearInterval(tykanie);
    const wypelnienie = $('#pasek-czasu-wypelnienie');
    const tyknij = () => {
      const zostalo = Math.max(0, stan.koniec - performance.now());
      wypelnienie.style.transform = `scaleX(${zostalo / stan.limitMs})`;
      if (zostalo <= 0) {
        clearInterval(tykanie);
        if (stan.wybor === null) {
          $('#potwierdzenie').textContent = 'Czas minął.';
          $('#potwierdzenie').hidden = false;
          for (const kafelek of $('#odpowiedzi-gracza').children) kafelek.disabled = true;
        }
      }
    };
    tyknij();
    tykanie = setInterval(tyknij, 100);
  }

  /* --------------------------------------------------------------- odsłona */

  function pokazOdslone(wiadomosc) {
    if (biezacyEkran() === 'gracz-odslona' && wiadomosc.nr === stan.nrPytania) return;
    clearInterval(tykanie);
    stan.nrPytania = wiadomosc.nr;

    const moj = wiadomosc.wyniki?.[mojeId];
    stan.punkty = moj?.razem ?? stan.punkty;

    const werdykt = $('#werdykt');
    if (moj?.trafil) {
      werdykt.dataset.jak = 'dobrze';
      werdykt.innerHTML = `Dobrze!<span class="punkty">+${moj.punkty} pkt</span>`;
      stuknij([25, 60, 25]);
    } else if (moj?.odpowiedzial) {
      werdykt.dataset.jak = 'zle';
      werdykt.innerHTML = 'Niestety<span class="punkty">tym razem bez punktów</span>';
    } else {
      werdykt.dataset.jak = 'brak';
      werdykt.innerHTML = 'Nie zdążyłeś<span class="punkty">następnym razem szybciej</span>';
    }

    $('#odsloniety-tytul-gracz').textContent = wiadomosc.tytul;
    $('#odsloniety-wykonawca-gracz').textContent = `${wiadomosc.wykonawca} · ${wiadomosc.rok}`;
    rysujZnacznikiUtworu($('#znaczniki-utworu-gracz'), wiadomosc);
    $('#moja-pozycja').textContent = moj?.miejsce
      ? `${moj.miejsce}. miejsce · ${stan.punkty} pkt`
      : `${stan.punkty} pkt`;
    pokazEkran('gracz-odslona');
  }

  /** Dwa znaczniki pod tytułem: gatunek i dekada tego konkretnego utworu. */
  function rysujZnacznikiUtworu(miejsce, wiadomosc) {
    wyczysc(miejsce);
    if (wiadomosc.kategoria) {
      miejsce.append(el('span', { tekst: `${wiadomosc.kategoria.emoji} ${wiadomosc.kategoria.nazwa}` }));
    }
    if (wiadomosc.dekada) miejsce.append(el('span', { tekst: wiadomosc.dekada }));
  }

  /* ---------------------------------------------------------- wyniki rundy */

  function pokazWynikiRundy(wiadomosc) {
    const klucz = `${wiadomosc.nrRundyGry}`;
    if (stan.kluczWynikowRundy === klucz && biezacyEkran() === 'gracz-wyniki-rundy') return;
    stan.kluczWynikowRundy = klucz;
    clearInterval(tykanie);

    const tabela = wiadomosc.ranking || [];
    const ja = tabela.find((g) => g.id === mojeId);

    const werdykt = $('#werdykt-rundy');
    werdykt.dataset.jak = ja?.miejsce === 1 ? 'dobrze' : 'brak';
    werdykt.textContent = ['🥇', '🥈', '🥉'][(ja?.miejsce ?? 9) - 1] || '🎯';
    $('#gracz-moje-miejsce-rundy').textContent = ja
      ? `${ja.miejsce}. miejsce · ${ja.punkty} pkt`
      : `Runda ${wiadomosc.nrRundyGry} zakończona`;
    $('#gracz-wyniki-rundy-info').textContent = wiadomosc.ostatniaRunda
      ? 'To była ostatnia runda — zaraz podsumowanie całej gry.'
      : 'Zaraz kolejna runda…';

    const lista = wyczysc($('#ranking-gracza-rundy'));
    tabela.forEach((gracz, i) => {
      const wiersz = el('li', { 'data-miejsce': gracz.miejsce, 'data-ja': gracz.id === mojeId ? 'tak' : 'nie' }, [
        el('span', { klasa: 'miejsce', tekst: `${gracz.miejsce}.` }),
        el('span', { klasa: 'kto', tekst: gracz.ksywka }),
        el('span', { klasa: 'ile', tekst: String(gracz.punkty) }),
      ]);
      wiersz.style.setProperty('--i', String(i));
      lista.append(wiersz);
    });
    pokazEkran('gracz-wyniki-rundy');
    stuknij(16);
  }

  /* ---------------------------------------------------------------- koniec */

  function pokazKoniec(wiadomosc) {
    clearInterval(tykanie);
    const tabela = wiadomosc.ranking || [];
    const ja = tabela.find((g) => g.id === mojeId);

    const werdykt = $('#werdykt-koncowy');
    werdykt.dataset.jak = ja?.miejsce === 1 ? 'dobrze' : 'brak';
    werdykt.textContent = ['🥇', '🥈', '🥉'][(ja?.miejsce ?? 9) - 1] || '🎵';
    $('#moje-miejsce').textContent = ja
      ? `${ja.miejsce}. miejsce · ${ja.punkty} pkt`
      : 'Koniec gry';

    const lista = wyczysc($('#ranking-gracza'));
    for (const gracz of tabela) {
      lista.append(el('li', { 'data-miejsce': gracz.miejsce, 'data-ja': gracz.id === mojeId ? 'tak' : 'nie' }, [
        el('span', { klasa: 'miejsce', tekst: `${gracz.miejsce}.` }),
        el('span', { klasa: 'kto', tekst: gracz.ksywka }),
        el('span', { klasa: 'ile', tekst: String(gracz.punkty) }),
      ]));
    }
    pokazEkran('gracz-koniec');
  }

  /* Kod wpisywany ręcznie: przepuszczamy tylko znaki, które w kodach w ogóle
     występują. Nie ma wśród nich O, I ani cyfr 0 i 1 — właśnie po to, żeby nie
     dało się ich pomylić. Litera wklepana z pomyłki po prostu się nie pokaże. */
  $('#pole-kodu').addEventListener('input', (zdarzenie) => {
    zdarzenie.target.value = zdarzenie.target.value
      .toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ2-9]/g, '').slice(0, 4);
  });

  window.addEventListener('beforeunload', () => { clearInterval(pukanie); pokoj.zamknij(); });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && stan.ksywka) {
      stan.blokadaEkranu = await trzymajEkran();
      pokoj.nadaj({ t: 'puk', id: mojeId });
    }
  });

  return { pokazFormularz, stan };
}
