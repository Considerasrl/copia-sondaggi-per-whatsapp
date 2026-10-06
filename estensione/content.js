// Copia sondaggi per Web — content script (Manifest V3)
// Aggiunge una voce "Copia sondaggio" al menu dei messaggi di WhatsApp Web:
// copia le opzioni con almeno 1 voto nel formato "x{voti} {opzione}".

(function () {
  'use strict';

  const POLL_ICON_SVG =
    '<svg viewBox="0 0 24 24" height="18" width="18" preserveAspectRatio="xMidYMid meet" fill="currentColor">' +
    '<path d="M4 11h3v9H4v-9zm6.5-7h3v16h-3V4zM17 8h3v12h-3V8z"/>' +
    '</svg>';

  const CHECK_ICON_SVG =
    '<svg viewBox="0 0 24 24" height="18" width="18" preserveAspectRatio="xMidYMid meet" fill="currentColor">' +
    '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>' +
    '</svg>';

  // --- Formato di copia personalizzabile -----------------------------------
  // Il modello usa i segnaposto [n] (numero di voti) e [opzione] (etichetta).
  // In fondo si può aggiungere (opzionale) una riga con il numero di votanti
  // effettivi, segnaposto [votanti].
  // Si imposta dal popup dell'estensione (icona nella barra) ed è salvato in
  // chrome.storage.local; qui lo teniamo in cache e lo aggiorniamo al volo.
  const TEMPLATE_KEY = 'formato';
  const DEFAULT_TEMPLATE = 'x[n] [opzione]';
  const VOTERS_KEY = 'votanti';
  const VOTERS_TEMPLATE_KEY = 'formatoVotanti';
  const DEFAULT_VOTERS_TEMPLATE = 'Votanti: [votanti]';
  let currentTemplate = DEFAULT_TEMPLATE;
  let currentVotersEnabled = false;
  let currentVotersTemplate = DEFAULT_VOTERS_TEMPLATE;

  const applySettings = (res) => {
    if (!res) return;
    if (TEMPLATE_KEY in res) {
      const v = res[TEMPLATE_KEY];
      currentTemplate = typeof v === 'string' && v.length ? v : DEFAULT_TEMPLATE;
    }
    if (VOTERS_KEY in res) currentVotersEnabled = res[VOTERS_KEY] === true;
    if (VOTERS_TEMPLATE_KEY in res) {
      const v = res[VOTERS_TEMPLATE_KEY];
      currentVotersTemplate = typeof v === 'string' && v.length ? v : DEFAULT_VOTERS_TEMPLATE;
    }
  };

  try {
    chrome.storage.local.get([TEMPLATE_KEY, VOTERS_KEY, VOTERS_TEMPLATE_KEY], applySettings);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const res = {};
      for (const k of Object.keys(changes)) res[k] = changes[k].newValue;
      applySettings(res);
    });
  } catch (_) {}

  function getTemplate() {
    return currentTemplate;
  }
  function getVotersEnabled() {
    return currentVotersEnabled;
  }
  function getVotersTemplate() {
    return currentVotersTemplate;
  }
  function formatOption(tpl, votes, label) {
    return tpl.replace(/\[n\]/gi, votes).replace(/\[opzione\]/gi, label);
  }
  function formatVoters(tpl, voters) {
    return tpl.replace(/\[votanti\]/gi, voters);
  }

  // --- Bolla del messaggio cliccato (catturata al click) -------------------
  let lastBubble = null;
  const rememberBubble = (e) => {
    const b = e.target && e.target.closest && e.target.closest('[data-id]');
    if (b) lastBubble = b;
  };
  document.addEventListener('pointerdown', rememberBubble, true);
  document.addEventListener('contextmenu', rememberBubble, true);

  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  function isPoll(bubble) {
    if (!bubble) return false;
    return /visualizza voti|view votes|seleziona (una o più|un')/i.test(bubble.textContent || '');
  }

  // Le opzioni non usano ruoli ARIA: si leggono dal testo visibile, dove
  // compaiono come coppie "etichetta" / "numero voti", fino all'orario o al
  // footer "Visualizza voti". Accoppio ogni etichetta col numero che la segue
  // e tengo solo le opzioni con voti > 0, nell'ordine del sondaggio.
  // Restituisce le righe formattate e il totale dei voti.
  function extractPoll(bubble) {
    const lines = (bubble.innerText || '')
      .split('\n')
      .map(clean)
      .filter(Boolean);

    const tpl = getTemplate();
    const out = [];
    let total = 0;
    let label = null;
    for (const line of lines) {
      if (/^\d+$/.test(line)) {
        if (label !== null) {
          const v = parseInt(line, 10);
          if (v > 0) {
            out.push(formatOption(tpl, v, label));
            total += v;
          }
          label = null;
        }
      } else {
        label = line;
      }
    }
    return { lines: out, total };
  }

  // --- Votanti effettivi ---------------------------------------------------
  // Con risposta singola i votanti coincidono con la somma dei voti. Con scelta
  // multipla una persona può votare più opzioni: i nomi stanno solo nel
  // pannello "Visualizza voti", che apriamo, leggiamo e richiudiamo.
  const DRAWER_SEL = '[data-testid="poll-details-drawer"]';
  const DRAWER_OPTION_SEL = '[data-testid^="poll-details-option-"]';
  const DRAWER_ROW_SEL = '[data-testid^="list-item-"]';

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function waitFor(fn, ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(50);
    }
    return null;
  }

  function isSingleChoice(bubble) {
    if (bubble.querySelector('[data-icon^="multi-select"]')) return false;
    return /seleziona un'|select one(?! or)/i.test(bubble.textContent || '');
  }

  const findDrawer = () => document.querySelector(DRAWER_SEL);
  const drawerOptions = (root) => Array.prototype.slice.call(root.querySelectorAll(DRAWER_OPTION_SEL));
  const drawerRows = (root) => Array.prototype.slice.call(root.querySelectorAll(DRAWER_ROW_SEL));

  // "7 voti" / "1 voto": cerco il nodo che contiene solo il conteggio, per non
  // confonderlo con eventuali numeri finali dell'etichetta.
  function drawerOptionVotes(opt) {
    const nodes = opt.querySelectorAll('span, div');
    for (const n of nodes) {
      const m = (n.textContent || '').trim().match(/^(\d+)\s+(vot[oi]|votes?)$/i);
      if (m) return parseInt(m[1], 10);
    }
    return 0;
  }

  // Identità del votante: nome del contatto oppure, per i non salvati, numero.
  // textContent e non innerText: le righe fuori vista hanno innerText vuoto.
  function voterKey(row) {
    const part = (id) => {
      const el = row.querySelector('[data-testid="' + id + '"]');
      return el ? clean(el.textContent) : '';
    };
    const key = part('cell-frame-title') + '|' + part('cell-frame-primary-detail');
    return key === '|' ? null : key;
  }

  const findButton = (root, re) =>
    Array.prototype.slice
      .call(root.querySelectorAll('button, [role="button"]'))
      .find((b) => re.test(b.getAttribute('aria-label') || ''));
  const showAllButton = (opt) =>
    Array.prototype.slice
      .call(opt.querySelectorAll('button'))
      .find((b) => /^(mostra tutt|view all|see all)/i.test(clean(b.textContent)));

  // Raccoglie i votanti di un contenitore, scorrendolo se la lista è lunga.
  async function collectVoters(root, set) {
    const grab = () =>
      drawerRows(root).forEach((r) => {
        const k = voterKey(r);
        if (k) set.add(k);
      });
    grab();
    const scroller = Array.prototype.slice
      .call(root.querySelectorAll('*'))
      .find((x) => /(auto|scroll)/.test(getComputedStyle(x).overflowY) && x.scrollHeight > x.clientHeight + 20);
    if (!scroller) return;
    const step = Math.max(scroller.clientHeight / 2, 100);
    for (let y = 0; y <= scroller.scrollHeight; y += step) {
      scroller.scrollTop = y;
      await sleep(120);
      grab();
    }
    scroller.scrollTop = 0;
  }

  async function closeDrawer() {
    for (let i = 0; i < 3; i++) {
      const d = findDrawer();
      if (!d) return;
      const btn = findButton(d, /^(chiudi|close|indietro|back)$/i);
      if (!btn) return;
      btn.click();
      await sleep(300);
    }
  }

  // Restituisce il numero di persone distinte che hanno votato, oppure null
  // se il pannello non si apre o i nomi letti non tornano con i voti.
  async function countVotersFromDrawer(bubble) {
    const viewBtn = bubble.querySelector('[data-testid="poll-view-votes"]');
    if (!viewBtn) return null;
    if (findDrawer()) {
      await closeDrawer();
      await waitFor(() => !findDrawer(), 2000);
    }
    viewBtn.click();
    try {
      // Pronto quando ogni opzione mostra tutti i suoi votanti o "Mostra tutti".
      const ready = (d) =>
        drawerOptions(d).length &&
        drawerOptions(d).every((o) => showAllButton(o) || drawerRows(o).length >= drawerOptionVotes(o));
      const main = await waitFor(() => {
        const d = findDrawer();
        return d && ready(d) ? d : null;
      }, 5000);
      if (!main) return null;

      const voters = new Set();
      const truncated = [];
      let complete = true;
      const nOptions = drawerOptions(main).length;
      for (const o of drawerOptions(main)) {
        if (showAllButton(o)) {
          truncated.push(o.getAttribute('data-testid'));
          continue;
        }
        const s = new Set();
        drawerRows(o).forEach((r) => {
          const k = voterKey(r);
          if (k) s.add(k);
        });
        if (s.size < drawerOptionVotes(o)) complete = false;
        s.forEach((k) => voters.add(k));
      }

      // Le opzioni troncate si aprono in una vista dedicata, poi "Indietro".
      for (const tid of truncated) {
        const o = await waitFor(() => {
          const d = findDrawer();
          const x = d && d.querySelector('[data-testid="' + tid + '"]');
          return x && showAllButton(x) ? x : null;
        }, 3000);
        if (!o) return null;
        const votes = drawerOptionVotes(o);
        showAllButton(o).click();
        const sub = await waitFor(() => {
          const d = findDrawer();
          return d && drawerOptions(d).length === 1 && drawerRows(d).length ? d : null;
        }, 3000);
        if (!sub) return null;
        const s = new Set();
        await collectVoters(sub, s);
        if (s.size < votes) complete = false;
        s.forEach((k) => voters.add(k));
        const back = findButton(sub, /^(indietro|back)$/i);
        if (!back) return null;
        back.click();
        await waitFor(() => {
          const d = findDrawer();
          return d && drawerOptions(d).length === nOptions;
        }, 3000);
      }
      return complete ? voters.size : null;
    } finally {
      await closeDrawer();
    }
  }

  async function countVoters(bubble, total) {
    if (!total) return 0;
    if (isSingleChoice(bubble)) return total;
    try {
      return await countVotersFromDrawer(bubble);
    } catch (_) {
      return null;
    }
  }

  // Copia negli appunti. Restituisce una Promise<boolean> con l'esito.
  // In un content script su WhatsApp Web l'API asincrona navigator.clipboard può
  // essere bloccata dalla Permissions-Policy della pagina: quindi usiamo prima
  // execCommand('copy') (sincrono, affidabile durante il gesto di click) e solo
  // come ripiego l'API asincrona.
  function copyToClipboard(text) {
    if (execCopy(text)) return Promise.resolve(true);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        () => true,
        () => false
      );
    }
    return Promise.resolve(false);
  }
  function execCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { ta.setSelectionRange(0, text.length); } catch (_) {}
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (_) {
      return false;
    }
  }

  function closeMenuByClickingOutside(menu) {
    if (!document.contains(menu)) return;
    const rect = menu.getBoundingClientRect();
    const x = Math.max(rect.left - 15, 2);
    const y = rect.top + rect.height / 2;
    const target = document.elementFromPoint(x, y);
    if (!target) return;
    ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach((type) => {
      target.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y })
      );
    });
  }

  // Trova il menu contestuale realmente aperto: visibile, con voci vere.
  function findOpenMenu() {
    const menus = Array.prototype.slice
      .call(document.querySelectorAll('div[role="menu"]'))
      .filter((m) => m.offsetParent !== null && m.querySelector('[role="menuitem"]'));
    return menus.length ? menus[menus.length - 1] : null;
  }

  // Inietta (o reinietta) la voce nel menu. Nessun flag permanente: WhatsApp
  // riusa lo stesso menu e ne rigenera le voci a ogni apertura.
  function injectInto(menu, bubble) {
    if (!menu || !isPoll(bubble)) return true;
    if (menu.querySelector('[aria-label="Copia sondaggio"]')) return true;

    const items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]'));
    if (!items.length) return false;

    const template =
      items.find((b) => (b.getAttribute('aria-label') || '').trim().toLowerCase() === 'copia') || items[0];

    const newItem = template.cloneNode(true);
    newItem.setAttribute('aria-label', 'Copia sondaggio');
    const iconSpan = newItem.querySelector('span[aria-hidden="true"]');
    const labelSpan = newItem.querySelector('span:not([aria-hidden])');
    if (iconSpan) iconSpan.innerHTML = POLL_ICON_SVG;
    if (labelSpan) labelSpan.textContent = 'Copia sondaggio';

    newItem.addEventListener(
      'click',
      (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        const poll = extractPoll(bubble); // ricalcolo al click (voti aggiornati)
        const text = poll.lines.join('\n');
        // Copia subito, dentro il gesto di click: se poi il conteggio dei
        // votanti fallisce, negli appunti restano comunque le opzioni.
        copyToClipboard(text);
        const done = (msg) => {
          if (iconSpan) iconSpan.innerHTML = CHECK_ICON_SVG;
          if (labelSpan) labelSpan.textContent = msg;
          setTimeout(() => closeMenuByClickingOutside(menu), 250);
        };
        if (!text) return done('Nessun voto');
        if (!getVotersEnabled()) return done('Copiato!');
        if (labelSpan) labelSpan.textContent = 'Conto i votanti…';
        countVoters(bubble, poll.total).then((voters) => {
          if (voters === null) return done('Copiato (senza votanti)');
          copyToClipboard(text + '\n\n' + formatVoters(getVotersTemplate(), voters)).then((ok) =>
            done(ok ? 'Copiato!' : 'Copiato (senza votanti)')
          );
        });
      },
      true
    );

    template.insertAdjacentElement('beforebegin', newItem);
    return true;
  }

  // AGGANCIO 1: al tasto destro cerca il menu aperto con un breve polling.
  document.addEventListener(
    'contextmenu',
    (e) => {
      const bubble = (e.target.closest && e.target.closest('[data-id]')) || lastBubble;
      if (!isPoll(bubble)) return;
      let tries = 0;
      const tick = () => {
        const menu = findOpenMenu();
        if (menu && injectInto(menu, bubble)) return;
        if (tries++ < 60) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    true
  );

  // AGGANCIO 2: MutationObserver (per i menu montati da zero, es. chevron).
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        const menu = node.matches('div[role="menu"]') ? node : node.querySelector('div[role="menu"]');
        if (menu) injectInto(menu, lastBubble);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
