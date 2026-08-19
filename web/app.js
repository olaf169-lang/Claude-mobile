/* Przegląd News — logika aplikacji.
   Dane budowane są elementami DOM (nie innerHTML), bo teksty pochodzą
   z zewnętrznych serwisów i nie wolno ich wstrzykiwać jako HTML. */

(() => {
  'use strict';

  const DATA = 'data/';
  const STORE = {
    theme: 'pn:motyw',
    seenEdition: 'pn:ostatnie-wydanie',
    notify: 'pn:powiadomienia',
  };

  const $ = (id) => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }

  function formatTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }

  function toast(message, ms = 3200) {
    const node = $('toast');
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { node.hidden = true; }, ms);
  }

  function status(message, kind) {
    const bar = $('statusbar');
    if (!message) { bar.hidden = true; return; }
    bar.textContent = message;
    bar.dataset.kind = kind || 'info';
    bar.hidden = false;
  }

  /* ------------------------------------------------------------------ */
  /* Pobieranie danych                                                   */
  /* ------------------------------------------------------------------ */

  async function loadJSON(path, { allowCache = true } = {}) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { data: await response.json(), fromCache: false };
    } catch (error) {
      if (allowCache && 'caches' in window) {
        const hit = await caches.match(path);
        if (hit) return { data: await hit.json(), fromCache: true };
      }
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rysowanie                                                           */
  /* ------------------------------------------------------------------ */

  function renderSection(section) {
    const wrap = document.createDocumentFragment();
    wrap.append(el('h3', null, section['tytuł']));
    const body = section['treść'] || [];
    if (section['rodzaj'] === 'punkty') {
      const ul = el('ul');
      body.forEach((item) => ul.append(el('li', null, item)));
      wrap.append(ul);
    } else {
      body.forEach((paragraph) => wrap.append(el('p', null, paragraph)));
    }
    if (section['przypis']) {
      const note = el('p', 'note');
      if (section.url) {
        const link = el('a', null, section['przypis']);
        link.href = section.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        note.append(link);
      } else {
        note.textContent = section['przypis'];
      }
      wrap.append(note);
    }
    return wrap;
  }

  function renderCard(item, index) {
    const segment = item['dział'] || {};
    const card = el('article', 'card');
    card.id = `dzial-${segment.id || index}`;

    const head = el('div', 'card__head');
    const seg = el('div', 'card__seg');
    seg.append(el('span', null, `${segment.emoji || ''} ${segment.nazwa || ''}`.trim()));
    const source = item['źródło'] || {};
    seg.append(el('span', 'dot', `· ${source.nazwa || 'źródło nieznane'}`));
    if (item['liczba_źródeł'] > 1) {
      seg.append(el('span', 'dot', `· ${item['liczba_źródeł']} niezależne źródła`));
    }
    head.append(seg);
    head.append(el('h2', 'card__title', item['nagłówek'] || ''));
    if (item.lead) head.append(el('p', 'card__lead', item.lead));
    card.append(head);

    const meta = el('div', 'card__meta');
    if (item['opublikowano']) meta.append(el('span', null, `Opublikowano ${formatTime(item['opublikowano'])}`));
    meta.append(el('span', null, `${item['czas_czytania_min'] || 1} min czytania`));
    if (source.url) {
      const link = el('a', null, `Oryginał: ${source.domena || 'otwórz'} ↗`);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      meta.append(link);
    }
    card.append(meta);

    const numbers = item['liczby'] || [];
    if (numbers.length) {
      const row = el('div', 'numbers');
      numbers.slice(0, 5).forEach((n) => row.append(el('span', 'number', n)));
      card.append(row);
    }

    const toggle = el('button', 'card__toggle', 'Czytaj pogłębione omówienie ▾');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    card.append(toggle);

    const body = el('div', 'card__body');

    if (item['dlaczego_to_ważne']) {
      const why = el('div', 'why');
      why.append(el('strong', null, 'Dlaczego to ważne'));
      why.append(el('span', null, item['dlaczego_to_ważne']));
      body.append(why);
    }

    (item['sekcje'] || []).forEach((section) => body.append(renderSection(section)));

    const glossary = item['pojęcia'] || [];
    if (glossary.length) {
      body.append(el('h3', null, 'Pojęcia'));
      const dl = el('dl', 'glossary');
      glossary.forEach((entry) => {
        const box = el('div');
        box.append(el('dt', null, entry.termin));
        box.append(el('dd', null, entry['wyjaśnienie']));
        dl.append(box);
      });
      body.append(dl);
    }

    const perspectives = item['inne_spojrzenia'] || [];
    if (perspectives.length) {
      body.append(el('h3', null, 'Jak piszą inni'));
      const list = el('div', 'persp');
      perspectives.forEach((p) => {
        const box = el('div', 'persp__item');
        box.append(el('div', 'persp__src', p['źródło']));
        box.append(el('div', null, p['ujęcie']));
        list.append(box);
      });
      body.append(list);
    }

    const sources = item['wszystkie_źródła'] || [];
    if (sources.length) {
      body.append(el('h3', null, 'Źródła'));
      const list = el('ul', 'sources');
      sources.forEach((s) => {
        const li = el('li');
        const link = el('a', null, `${s.nazwa} — ${s['tytuł']}`);
        link.href = s.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        li.append(link);
        list.append(li);
      });
      body.append(list);
    }

    const tags = item.tagi || [];
    if (tags.length) {
      const row = el('div', 'tags');
      tags.forEach((t) => row.append(el('span', 'tag', t)));
      body.append(row);
    }

    toggle.addEventListener('click', () => {
      const open = card.classList.toggle('card--open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Zwiń omówienie ▴' : 'Czytaj pogłębione omówienie ▾';
    });

    card.append(body);
    return card;
  }

  function renderEdition(edition, { fromCache } = {}) {
    const items = edition['pozycje'] || [];

    $('edition-kicker').textContent =
      `Wydanie z ${formatDate(edition['wydanie'])} · newsy z ${formatDate(edition['dotyczy_dnia'])}`;

    const noteParts = [`${items.length} ${items.length === 1 ? 'dział' : 'działów'}`];
    if (edition['tryb'] === 'llm') noteParts.push('omówienia pogłębione');
    if ((edition['braki'] || []).length) noteParts.push(`bez materiału: ${edition['braki'].join(', ')}`);
    $('edition-note').textContent = noteParts.join(' · ');

    const chips = $('chips');
    chips.replaceChildren();
    items.forEach((item, i) => {
      const segment = item['dział'] || {};
      const chip = el('a', 'chip', `${segment.emoji || ''} ${segment.nazwa || ''}`.trim());
      chip.href = `#dzial-${segment.id || i}`;
      chips.append(chip);
    });

    const feed = $('feed');
    feed.replaceChildren();
    items.forEach((item, i) => feed.append(renderCard(item, i)));

    $('empty').hidden = items.length > 0;
    if (!items.length) {
      $('empty').textContent = 'To wydanie jest puste. Spróbuj wybrać inne z archiwum.';
    }

    const generated = edition['wygenerowano'] ? new Date(edition['wygenerowano']) : null;
    $('footer-meta').textContent = generated
      ? `Zebrano ${generated.toLocaleString('pl-PL')} · tryb: ${edition['tryb']} · wersja ${edition['wersja'] || '—'}`
      : '';

    if (edition.demo) {
      status('Wydanie demonstracyjne na danych przykładowych — prawdziwe pojawi się po pierwszej porannej zbiórce.', 'warn');
    } else {
      status(fromCache ? 'Tryb offline — pokazuję ostatnio pobrane wydanie.' : '', 'warn');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Archiwum                                                            */
  /* ------------------------------------------------------------------ */

  async function openArchive() {
    const dialog = $('archive');
    const list = $('archive-list');
    list.replaceChildren(el('li', null, 'Ładowanie…'));
    dialog.showModal();
    try {
      const { data } = await loadJSON(`${DATA}index.json`);
      const editions = data['wydania'] || [];
      list.replaceChildren();
      if (!editions.length) {
        list.append(el('li', null, 'Brak zarchiwizowanych wydań.'));
        return;
      }
      editions.forEach((entry) => {
        const li = el('li');
        const button = el('button');
        button.type = 'button';
        button.append(el('span', 'date', `${formatDate(entry['wydanie'])} — ${entry['działy']} działów`));
        button.append(el('span', 'headlines', (entry['nagłówki'] || []).slice(0, 3).join(' · ')));
        button.addEventListener('click', async () => {
          dialog.close();
          try {
            const { data: edition, fromCache } = await loadJSON(`${DATA}${entry['wydanie']}.json`);
            renderEdition(edition, { fromCache });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch {
            toast('Nie udało się wczytać tego wydania.');
          }
        });
        li.append(button);
        list.append(li);
      });
    } catch {
      list.replaceChildren(el('li', null, 'Archiwum niedostępne offline.'));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Motyw, instalacja, powiadomienia                                    */
  /* ------------------------------------------------------------------ */

  function initTheme() {
    const saved = localStorage.getItem(STORE.theme);
    if (saved) document.documentElement.dataset.theme = saved;
    $('btn-theme').addEventListener('click', () => {
      const current = document.documentElement.dataset.theme
        || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem(STORE.theme, next);
    });
  }

  function initInstall() {
    let deferred = null;
    const button = $('btn-install');
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferred = event;
      button.classList.remove('iconbtn--hidden');
    });
    button.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      button.classList.add('iconbtn--hidden');
      if (outcome === 'accepted') toast('Zainstalowano. Przegląd News jest teraz na ekranie głównym.');
    });
    window.addEventListener('appinstalled', () => button.classList.add('iconbtn--hidden'));
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      toast('Ta przeglądarka nie obsługuje powiadomień.');
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast('Powiadomienia pozostają wyłączone.');
      return false;
    }
    const registration = await navigator.serviceWorker.ready;
    if ('periodicSync' in registration) {
      try {
        const state = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (state.state === 'granted') {
          await registration.periodicSync.register('przeglad-news', {
            minInterval: 3 * 60 * 60 * 1000,
          });
        }
      } catch {
        /* przeglądarka bez okresowej synchronizacji — zostaje sprawdzanie przy otwarciu */
      }
    }
    return true;
  }

  function initNotifications() {
    const button = $('btn-notify');
    const on = localStorage.getItem(STORE.notify) === '1'
      && 'Notification' in window && Notification.permission === 'granted';
    button.setAttribute('aria-pressed', String(on));
    button.addEventListener('click', async () => {
      if (button.getAttribute('aria-pressed') === 'true') {
        localStorage.setItem(STORE.notify, '0');
        button.setAttribute('aria-pressed', 'false');
        toast('Powiadomienia wyłączone.');
        return;
      }
      if (await enableNotifications()) {
        localStorage.setItem(STORE.notify, '1');
        button.setAttribute('aria-pressed', 'true');
        toast('Będziesz dostawać sygnał, gdy pojawi się nowe wydanie.');
      }
    });
  }

  function announceIfNew(edition) {
    const seen = localStorage.getItem(STORE.seenEdition);
    if (seen && seen !== edition['wydanie']) {
      toast(`Nowe wydanie z ${formatDate(edition['wydanie'])} — 10 świeżych tematów.`, 5000);
    }
    localStorage.setItem(STORE.seenEdition, edition['wydanie']);
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'edycja-obejrzana', wydanie: edition['wydanie'],
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Start                                                               */
  /* ------------------------------------------------------------------ */

  async function refresh() {
    try {
      const { data, fromCache } = await loadJSON(`${DATA}latest.json`);
      renderEdition(data, { fromCache });
      announceIfNew(data);
    } catch {
      $('feed').replaceChildren();
      $('empty').hidden = false;
      $('empty').textContent =
        'Nie udało się wczytać wydania. Sprawdź połączenie — po pierwszym udanym pobraniu przegląd działa offline.';
      status('Brak połączenia z danymi.', 'warn');
    }
  }

  function init() {
    initTheme();
    initInstall();
    initNotifications();
    $('btn-archive').addEventListener('click', openArchive);
    $('archive-close').addEventListener('click', () => $('archive').close());

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refresh();
    });

    refresh();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {
        /* brak SW to tylko brak trybu offline, aplikacja działa dalej */
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
