/* ==========================================================================
   „Pochwal się" — udostępnianie wieczoru na grupę.

   Jeden przycisk: na telefonie odpala systemowe okno „wyślij do…" (Web Share),
   a jak go nie ma (np. desktop) — kopiuje do schowka. W obu przypadkach leci
   gotowa laurka + link do widoku podsumowania tego konkretnego wieczoru.
   ========================================================================== */

import { poPolsku, imieW } from './dane.js';
import { rekordyWieczoru, mvpWieczoru, trybyWieczoru } from './liczenie.js';
import { komunikat } from './ui.js';

export function linkPodsumowania(data) {
  return `${location.origin}${location.pathname}#/podsumowanie/${data}`;
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

export async function pochwalSie(wieczor) {
  const url = linkPodsumowania(wieczor.data);
  const text = tekstPodsumowania(wieczor);
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Turniej Pana Piąteczki', text, url });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;   // user zamknął okno — to nie błąd
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    komunikat('Skopiowane — wklej na grupie 📋');
  } catch {
    komunikat('Skopiuj link ręcznie z paska adresu');
  }
}
