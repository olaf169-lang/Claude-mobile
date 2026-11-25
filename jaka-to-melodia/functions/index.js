/* Cloud Functions dla Turnieju Piąteczki, jedyne miejsce w tym projekcie,
   które faktycznie WYSYŁA powiadomienia push. Appka sama (bez otwartej
   karty) nie może obudzić się o określonej porze ani zareagować na cudzy
   zapis w Firestore, do tego trzeba czegoś, co działa po stronie serwera.

   Cztery funkcje (trzy dla Turnieju, jedna dla Siłki Piąteczki):
     naRuchWTurnieju       : reaguje na każdy zapisany ruch w pojedynku:
                               powiadamia, czyja jest kolej, albo że pojedynek
                               się zakończył.
     naProsbePowiadomienia , reaguje na przycisk „Powiadom gracza” na
                               ekranie oczekiwania: natychmiastowe ręczne
                               przypomnienie, niezależne od naRuchWTurnieju.
     podsumowanieTygodniowe, w każdą niedzielę o 18:00 czasu polskiego
                               wysyła podsumowanie do wszystkich ksywek, które
                               rozegrały choć jeden mecz w ostatnim tygodniu.
     silkaPrzypomnienie    : codziennie o 17:00 czasu polskiego sprawdza,
                               ile dni minęło od ostatniego treningu w Siłce
                               Piąteczki (katalog silka-piateczki/), i pinguje,
                               gdy mijają 4, 5 albo 7 dni.

   Wdrożenie (jednorazowo, z Twojego komputera, ja nie mam jak stąd tego
   zrobić, to wymaga Twojego logowania do Firebase):
     1. npm install -g firebase-tools   (jeśli jeszcze nie masz)
     2. firebase login
     3. w konsoli Firebase: przełącz projekt na plan Blaze (płatność za
        użycie, sam plan nic nie kosztuje, płaci się dopiero po
        przekroczeniu darmowego limitu, przy grze znajomych się do niego
        nie zbliżycie)
     4. cd jaka-to-melodia/functions && npm install
     5. firebase deploy --only functions,firestore:rules
   Do momentu wdrożenia appka i tak działa normalnie, przycisk dzwonka
   i przycisk „Powiadom gracza” po prostu nic nie wyślą, bo nie ma kto. */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');

initializeApp();
const db = getFirestore();

async function pobierzTokeny(ksywka) {
  const zrzut = await db.collection('tokenyPush').where('ksywka', '==', ksywka).get();
  return zrzut.docs.map((d) => d.id);
}

async function wyslij(tokeny, dane) {
  if (!tokeny.length) return;
  try {
    await getMessaging().sendEachForMulticast({ tokens: tokeny, data: dane });
  } catch {
    // Token mógł wygasnąć albo appka zostać odinstalowana, nic wielkiego,
    // po prostu to jedno powiadomienie przepada.
  }
}

exports.naRuchWTurnieju = onDocumentCreated(
  'pojedynki/{pojedynekId}/gracze/{graczId}/ruchy/{ruchNr}',
  async (zdarzenie) => {
    const { pojedynekId } = zdarzenie.params;
    const pojedynekRef = db.collection('pojedynki').doc(pojedynekId);

    const graczeSnap = await pojedynekRef.collection('gracze').get();
    const gracze = graczeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const p1 = gracze.find((g) => g.rola === 'p1');
    const p2 = gracze.find((g) => g.rola === 'p2');
    if (!p1 || !p2) return; // P2 jeszcze nie dołączył, nie ma kogo powiadamiać

    const [ruchyP1, ruchyP2] = await Promise.all([
      pojedynekRef.collection('gracze').doc(p1.id).collection('ruchy').get(),
      pojedynekRef.collection('gracze').doc(p2.id).collection('ruchy').get(),
    ]);
    const liczbaP1 = ruchyP1.size;
    const liczbaP2 = ruchyP2.size;
    const url = `./#/turniej/${pojedynekId}`;

    if (liczbaP1 >= 2) {
      // P1 dograł resztę, pojedynek zamknięty, informujemy obu.
      const [tP1, tP2] = await Promise.all([pobierzTokeny(p1.ksywka), pobierzTokeny(p2.ksywka)]);
      await Promise.all([
        wyslij(tP1, { tytul: 'Turniej Piąteczki', tresc: `Pojedynek z ${p2.ksywka} zakończony!`, url }),
        wyslij(tP2, { tytul: 'Turniej Piąteczki', tresc: `Pojedynek z ${p1.ksywka} zakończony!`, url }),
      ]);
      return;
    }
    if (liczbaP1 >= 1 && liczbaP2 === 0) {
      // P1 skończył swoją część, teraz kolej P2.
      await wyslij(await pobierzTokeny(p2.ksywka), {
        tytul: 'Turniej Piąteczki', tresc: `${p1.ksywka} czeka na Twój ruch!`, url,
      });
      return;
    }
    if (liczbaP2 >= 1 && liczbaP1 === 1) {
      // P2 skończył swoją część, teraz kolej P1 na dogranie.
      await wyslij(await pobierzTokeny(p1.ksywka), {
        tytul: 'Turniej Piąteczki', tresc: `${p2.ksywka} czeka na dogranie przez Ciebie!`, url,
      });
    }
  },
);

// Ręczne "szturchnięcie", przycisk Powiadom gracza na ekranie oczekiwania.
// Osobna ścieżka od naRuchWTurnieju wyżej: tu żaden nowy ruch nie powstaje,
// czekający gracz sam prosi appkę o wysłanie przypomnienia drugiej stronie.
exports.naProsbePowiadomienia = onDocumentCreated(
  'pojedynki/{pojedynekId}/prosby/{prosbaId}',
  async (zdarzenie) => {
    const { pojedynekId } = zdarzenie.params;
    const od = zdarzenie.data?.data()?.od;
    if (od !== 'p1' && od !== 'p2') return;

    const pojedynekRef = db.collection('pojedynki').doc(pojedynekId);
    const graczeSnap = await pojedynekRef.collection('gracze').get();
    const gracze = graczeSnap.docs.map((d) => d.data());
    const nadawca = gracze.find((g) => g.rola === od);
    const odbiorca = gracze.find((g) => g.rola !== od);
    if (!nadawca || !odbiorca) return;

    await wyslij(await pobierzTokeny(odbiorca.ksywka), {
      tytul: 'Turniej Piąteczki',
      tresc: `${nadawca.ksywka} czeka na Twój ruch!`,
      url: `./#/turniej/${pojedynekId}`,
    });
  },
);

exports.podsumowanieTygodniowe = onSchedule(
  { schedule: '0 18 * * 0', timeZone: 'Europe/Warsaw' },
  async () => {
    // Ostatnie 7 dni zamiast precyzyjnych granic tygodnia poniedziałek-
    // -niedziela, funkcja i tak odpala się w niedzielę o 18, więc to
    // w praktyce ten sam tydzień, dużo prościej niż liczenie stref czasowych.
    const tydzienTemu = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const mecze = await db.collection('rankingTurnieju').where('zakonczono', '>=', tydzienTemu).get();
    if (mecze.empty) return;

    const ksywki = new Set();
    for (const dok of mecze.docs) {
      const mecz = dok.data();
      ksywki.add(mecz.p1Ksywka);
      ksywki.add(mecz.p2Ksywka);
    }

    await Promise.all([...ksywki].map(async (ksywka) => {
      const tokeny = await pobierzTokeny(ksywka);
      await wyslij(tokeny, {
        tytul: 'Turniej Piąteczki',
        tresc: 'Tydzień Turnieju Piąteczki zakończony. Sprawdź tablicę wyników!',
        url: './#/turniej/tablica',
      });
    }));
  },
);

/* ------------------------------------------------ Siłka Piąteczki
   Telefon zapisuje w kolekcji silkaPrzypomnienia swój token FCM i datę
   ostatniego treningu (silka-piateczki/js/przypomnienia.js). Zasada
   użytkownika: między treningami najwyżej 5 dni. Ping po 4 dniach (jutro
   ostatni dzień), po 5 (dziś ostatni dzień) i po 7 (seria przerwana).
   Potem cisza aż do kolejnego treningu, żeby nie spamować. */

const STREFA = 'Europe/Warsaw';
const dzienWarszawa = (data) => new Intl.DateTimeFormat('en-CA', { timeZone: STREFA }).format(data);
function dniOd(iso, teraz = new Date()) {
  const a = Date.parse(`${dzienWarszawa(new Date(iso))}T00:00:00Z`);
  const b = Date.parse(`${dzienWarszawa(teraz)}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

const SILKA_URL = 'https://olaf169-lang.github.io/Claude-mobile/silka-piateczki/#/start';
function silkaWiadomosc(dni) {
  if (dni === 4) return { tytul: 'Jutro mija 5 dni', tresc: 'Ostatni trening 4 dni temu. Jutro najpóźniej siłka, koks czeka.' };
  if (dni === 5) return { tytul: 'Minęło 5 dni bez siłki', tresc: 'Dziś ostatni dzień, żeby utrzymać serię. Pakuj torbę.' };
  if (dni === 7) return { tytul: 'Seria przerwana', tresc: 'Tydzień bez treningu. Wróć dziś, zaczniesz nową serię.' };
  return null;
}
exports._silka = { dniOd, silkaWiadomosc };

exports.silkaPrzypomnienie = onSchedule(
  { schedule: '0 17 * * *', timeZone: STREFA },
  async () => {
    const zrzut = await db.collection('silkaPrzypomnienia').get();
    await Promise.all(zrzut.docs.map(async (dok) => {
      const { token, ostatniTrening } = dok.data();
      if (!token || !ostatniTrening) return;
      const wiadomosc = silkaWiadomosc(dniOd(ostatniTrening));
      if (!wiadomosc) return;
      try {
        await getMessaging().send({
          token,
          data: { ...wiadomosc, url: SILKA_URL },
          webpush: { headers: { Urgency: 'high', TTL: '43200' } },
        });
      } catch (blad) {
        // Telefon odinstalował apkę albo cofnął zgodę: sprzątamy wpis.
        if (String(blad.code || '').includes('registration-token-not-registered')) await dok.ref.delete();
      }
    }));
  },
);
