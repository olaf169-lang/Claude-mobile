/* ==========================================================================
   „Pochwal się" — udostępnianie wieczoru na grupę.

   Jeden przycisk: na telefonie odpala systemowe okno „wyślij do…" (Web Share),
   a jak go nie ma (np. desktop) — kopiuje do schowka. W obu przypadkach leci
   gotowa laurka + link do widoku podsumowania tego konkretnego wieczoru.
   ========================================================================== */

import { poPolsku, imieW } from './dane.js';
import { rekordyWieczoru, mvpWieczoru, trybyWieczoru } from './liczenie.js';
import { komunikat, arkusz, bez } from './ui.js';

/** Adres aplikacji bez ogona. Ktoś, kto wszedł przez „…/piateczka/index.html”,
    rozsyłałby ten sam brzydki adres dalej — obcinamy końcówkę, żeby na grupę
    zawsze szło czyste „…/piateczka/”. */
function adresBazowy() {
  return `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;
}

export function linkPodsumowania(data) {
  return `${adresBazowy()}#/podsumowanie/${data}`;
}

/** Krótka laurka do wklejenia na czacie — bez ozdobników, żeby dobrze
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
  if (wieczor.towarzyski) linie.push('\n(wieczór towarzyski — poza sezonem)');
  return linie.join('\n');
}

/** Zaproszenie do samej aplikacji — do wysłania na grupę. Adres liczymy
    z bieżącej lokalizacji, więc działa tak samo lokalnie i na GitHub Pages. */
export function linkAplikacji() {
  return adresBazowy();
}

export async function zapros() {
  const url = linkAplikacji();
  const text = [
    '🏸 Turniej Pana Piąteczki',
    'Nasza liga badmintona — tabela, forma i przydomki.',
    'Otwiera się w przeglądarce, nic nie trzeba instalować:',
  ].join('\n');
  await wyslij({ title: 'Turniej Pana Piąteczki', text, url },
    'Link skopiowany — wklej na grupie 📋');
}

export async function pochwalSie(wieczor) {
  await wyslij({
    title: 'Turniej Pana Piąteczki',
    text: tekstPodsumowania(wieczor),
    url: linkPodsumowania(wieczor.data),
  }, 'Skopiowane — wklej na grupie 📋');
}

/** Systemowe „wyślij do…”, a jak go nie ma (zwykle desktop) — schowek.
    Gdy i schowek odmówi (np. brak HTTPS), pokazujemy sam adres, żeby dało się
    go przepisać — lepsze to niż komunikat „nie udało się” i nic więcej. */
async function wyslij({ title, text, url }, potwierdzenie) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;   // user zamknął okno — to nie błąd
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    komunikat(potwierdzenie);
  } catch {
    pokazLink(url);
  }
}

/** Ostatnia deska ratunku: adres w arkuszu, w polu tekstowym, zaznaczony
    w całości — wtedy kopiuje się nawet tam, gdzie API schowka nie działa. */
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
