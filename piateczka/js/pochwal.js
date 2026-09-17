/* ==========================================================================
   „Pochwal się": udostępnianie wieczoru na grupę.

   Jeden przycisk: na telefonie odpala systemowe okno „wyślij do…" (Web Share),
   a jak go nie ma (np. desktop), kopiuje do schowka. W obu przypadkach leci
   gotowa laurka + link do widoku podsumowania tego konkretnego wieczoru.
   ========================================================================== */

import { poPolsku, imieW, gracz, SEZON } from './dane.js';
import { rekordyWieczoru, mvpWieczoru, trybyWieczoru, klasyfikacja, mecze as meczeZ,
  wynikMeczu, trybMeczu, TRYBY } from './liczenie.js';
import { komunikat, arkusz, bez, odmianaMeczow, odmianaWieczorow, odmianaSetow } from './ui.js';

/** Adres aplikacji bez ogona. Ktoś, kto wszedł przez „…/piateczka/index.html”,
    rozsyłałby ten sam brzydki adres dalej, więc obcinamy końcówkę, żeby na grupę
    zawsze szło czyste „…/piateczka/”. */
function adresBazowy() {
  return `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;
}

export function linkPodsumowania(data) {
  return `${adresBazowy()}#/podsumowanie/${data}`;
}

/** Krótka laurka do wklejenia na czacie, bez ozdobników, żeby dobrze
    wyglądała też jako zwykły tekst. */
export function tekstPodsumowania(wieczor) {
  const rek = [...rekordyWieczoru(wieczor, { wszyscy: true }).values()]
    .filter((r) => r.mecze > 0)
    .sort((a, b) => b.meczeW - a.meczeW || b.setyW - a.setyW || b.zdobyte - a.zdobyte);
  const mvp = mvpWieczoru(wieczor);
  const tryby = trybyWieczoru(wieczor).map((t) => t.nazwa.toLowerCase()).join(' i ');

  const linie = ['🏸 Turniej Pana Piąteczki', poPolsku(wieczor.data) + (tryby ? ` · ${tryby}` : '')];
  if (mvp && !wieczor.towarzyski) {
    linie.push(`🏆 MVP: ${mvp.gracze.map((i) => imieW(wieczor, i)).join(' i ')} (${mvp.wygrane} W)`);
  }
  linie.push('');
  rek.forEach((r, i) => linie.push(
    `${i + 1}. ${imieW(wieczor, r.id)}  ${r.meczeW}W-${r.meczeP}P  (sety ${r.setyW}:${r.setyP})`));
  if (wieczor.towarzyski) linie.push('\n(wieczór towarzyski, poza sezonem)');
  return linie.join('\n');
}

/** Zaproszenie do samej aplikacji, do wysłania na grupę. Adres liczymy
    z bieżącej lokalizacji, więc działa tak samo lokalnie i na GitHub Pages. */
export function linkAplikacji() {
  return adresBazowy();
}

export async function zapros() {
  const url = linkAplikacji();
  const text = [
    '🏸 Turniej Pana Piąteczki',
    'Nasza liga badmintona: tabela, forma i przydomki.',
    'Otwiera się w przeglądarce, nic nie trzeba instalować:',
  ].join('\n');
  await wyslij({ title: 'Turniej Pana Piąteczki', text, url },
    'Link skopiowany, wklej na grupie 📋');
}

/** Podsumowanie całego sezonu jako tekst na grupę: mistrzowie obu rozgrywek,
    podium i kilka liczb. Bez ozdobników, bo ma się kleić do czatu. */
export function tekstSezonu(wieczory) {
  let meczow = 0, setow = 0;
  for (const w of wieczory) {
    for (const m of meczeZ(w)) {
      const r = wynikMeczu(m);
      if (!r.rozegrany) continue;
      meczow += 1;
      setow += r.setyA + r.setyB;
    }
  }

  const linie = ['🏸 Turniej Pana Piąteczki', `Sezon ${SEZON.nazwa}, podsumowanie`, ''];
  for (const t of TRYBY) {
    const tabela = klasyfikacja(wieczory, { tryb: t.id }).filter((r) => r.mecze > 0);
    if (!tabela.length) continue;
    linie.push(`${t.nazwa.toUpperCase()}`);
    tabela.forEach((r, i) => linie.push(
      `${i + 1}. ${gracz(r.id).imie}  ${r.meczeW}W-${r.meczeP}P  (sety ${r.setyW}:${r.setyP})`));
    linie.push('');
  }
  linie.push(`Razem: ${wieczory.length} ${odmianaWieczorow(wieczory.length)}, `
    + `${meczow} ${odmianaMeczow(meczow)}, ${setow} ${odmianaSetow(setow)}.`);
  return linie.join('\n');
}

export async function pochwalSezonem(wieczory) {
  await wyslij({
    title: `Turniej Pana Piąteczki, sezon ${SEZON.nazwa}`,
    text: tekstSezonu(wieczory),
    url: linkAplikacji(),
  }, 'Skopiowane, wklej na grupie 📋');
}

export async function pochwalSie(wieczor) {
  await wyslij({
    title: 'Turniej Pana Piąteczki',
    text: tekstPodsumowania(wieczor),
    url: linkPodsumowania(wieczor.data),
  }, 'Skopiowane, wklej na grupie 📋');
}

/** Systemowe „wyślij do…”, a jak go nie ma (zwykle desktop), schowek.
    Gdy i schowek odmówi (np. brak HTTPS), pokazujemy sam adres, żeby dało się
    go przepisać, bo to lepsze niż komunikat „nie udało się” i nic więcej. */
async function wyslij({ title, text, url }, potwierdzenie) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;   // user zamknął okno, to nie błąd
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    komunikat(potwierdzenie);
  } catch {
    pokazLink(url);
  }
}

/** Ostatnia deska ratunku: adres w arkuszu, w polu tekstowym, zaznaczony
    w całości, wtedy kopiuje się nawet tam, gdzie API schowka nie działa. */
function pokazLink(url) {
  const { el } = arkusz({
    tytul: 'Link do skopiowania',
    tresc: `<p>Przeglądarka nie dała nam dostępu do schowka. Zaznacz adres
      i skopiuj ręcznie:</p>
      <input class="pole-link" id="link-do-kopiowania" type="text" readonly value="${bez(url)}">`,
  });
  const pole = el.querySelector('#link-do-kopiowania');
  pole?.focus();
  pole?.select();
}
