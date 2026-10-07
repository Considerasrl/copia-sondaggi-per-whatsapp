// Copia sondaggi per Web — content script (Manifest V3)
// Aggiunge una voce "Copia sondaggio" al menu dei messaggi di WhatsApp Web:
// copia le opzioni con almeno 1 voto nel formato "x{voti} {opzione}".
// Le traduzioni (CS_I18N) arrivano da i18n.js, caricato prima di questo file.

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

  // --- Formato di copia personalizzabile e lingua --------------------------
  // Il modello usa i segnaposto [n] (numero di voti) e [opzione] (etichetta).
  // In fondo si può aggiungere (opzionale) una riga con il numero di votanti
  // effettivi, segnaposto [votanti]. I segnaposto sono accettati in tutte le
  // lingue (vedi i18n.js); finché l'utente non salva un modello si usa quello
  // predefinito della lingua attiva.
  // Si imposta dal popup dell'estensione (icona nella barra) ed è salvato in
  // chrome.storage.local; qui lo teniamo in cache e lo aggiorniamo al volo.
  const TEMPLATE_KEY = 'formato';
  const VOTERS_KEY = 'votanti';
  const VOTERS_TEMPLATE_KEY = 'formatoVotanti';
  const LANG_KEY = 'lingua'; // 'auto' (lingua del browser) o un codice di CS_I18N.LANGS
  let currentTemplate = null;
  let currentVotersEnabled = false;
  let currentVotersTemplate = null;
  let t = CS_I18N.make(CS_I18N.resolve('auto'));

  const applySettings = (res) => {
    if (!res) return;
    if (TEMPLATE_KEY in res) currentTemplate = CS_I18N.custom(res[TEMPLATE_KEY], 'defTemplate');
    if (VOTERS_KEY in res) currentVotersEnabled = res[VOTERS_KEY] === true;
    if (VOTERS_TEMPLATE_KEY in res) currentVotersTemplate = CS_I18N.custom(res[VOTERS_TEMPLATE_KEY], 'defVotersTemplate');
    if (LANG_KEY in res) t = CS_I18N.make(CS_I18N.resolve(res[LANG_KEY]));
  };

  try {
    chrome.storage.local.get([TEMPLATE_KEY, VOTERS_KEY, VOTERS_TEMPLATE_KEY, LANG_KEY], applySettings);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const res = {};
      for (const k of Object.keys(changes)) res[k] = changes[k].newValue;
      applySettings(res);
    });
  } catch (_) {}

  function getTemplate() {
    return currentTemplate || t('defTemplate');
  }
  function getVotersEnabled() {
    return currentVotersEnabled;
  }
  function getVotersTemplate() {
    return currentVotersTemplate || t('defVotersTemplate');
  }
  const formatOption = CS_I18N.formatOption;
  const formatVoters = CS_I18N.formatVoters;

  // --- Bolla del messaggio cliccato (catturata al click) -------------------
  let lastBubble = null;
  const rememberBubble = (e) => {
    const b = e.target && e.target.closest && e.target.closest('[data-id]');
    if (b) lastBubble = b;
  };
  document.addEventListener('pointerdown', rememberBubble, true);
  document.addEventListener('contextmenu', rememberBubble, true);

  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // Segnale indipendente dalla lingua di WhatsApp; la regex resta come riserva.
  function isPoll(bubble) {
    if (!bubble) return false;
    if (bubble.querySelector('[data-testid="poll-bubble"]')) return true;
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

  // Solo una scorciatoia: se non si riconosce la risposta singola (per esempio
  // con WhatsApp in un'altra lingua) si passa dal pannello, che è comunque esatto.
  function isSingleChoice(bubble) {
    if (bubble.querySelector('[data-icon^="multi-select"]')) return false;
    if (bubble.querySelector('[data-testid="poll-bubble"] input[type="radio"]')) return true;
    return /seleziona un'|select one(?! or)/i.test(bubble.textContent || '');
  }

  const findDrawer = () => document.querySelector(DRAWER_SEL);
  const drawerOptions = (root) => Array.prototype.slice.call(root.querySelectorAll(DRAWER_OPTION_SEL));
  const drawerRows = (root) => Array.prototype.slice.call(root.querySelectorAll(DRAWER_ROW_SEL));

  // "7 voti", "7 votes", "7 Stimmen"…: cerco il nodo che contiene solo numero +
  // parola (in qualsiasi lingua), fuori dall'etichetta dell'opzione e dalle
  // righe dei votanti, per non confonderlo con numeri presenti nel testo.
  function drawerOptionVotes(opt) {
    const nodes = opt.querySelectorAll('span, div');
    for (const n of nodes) {
      if (n.closest('[data-testid="selectable-text"], ' + DRAWER_ROW_SEL)) continue;
      const m = (n.textContent || '').trim().match(/^(\d+)\s+[^\d\s]+$/);
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

  // Nome dell'icona di un elemento (<title> dell'svg o data-icon): a differenza
  // degli aria-label non dipende dalla lingua di WhatsApp.
  const iconName = (el) => {
    const title = el.querySelector('svg title');
    const icon = el.querySelector('[data-icon]');
    return (title && title.textContent) || (icon && icon.getAttribute('data-icon')) || '';
  };
  // Pulsante con una delle icone indicate o, in mancanza, con un aria-label che
  // corrisponde alla regex (riserva per WhatsApp in italiano o inglese).
  const findButton = (root, icons, re) => {
    const all = Array.prototype.slice.call(root.querySelectorAll('button, [role="button"]'));
    return (
      all.find((b) => icons.indexOf(iconName(b)) !== -1) ||
      all.find((b) => re.test(b.getAttribute('aria-label') || ''))
    );
  };
  const CLOSE_ICONS = ['ic-close'];
  const BACK_ICONS = ['ic-arrow-back'];
  // "Mostra tutti (altri N)": nell'opzione è l'unico pulsante che non è la riga
  // di un votante, quindi si riconosce senza leggerne il testo.
  const showAllButton = (opt) =>
    Array.prototype.slice
      .call(opt.querySelectorAll('button'))
      .find((b) => b.getAttribute('data-testid') !== 'cell-frame-container' && !b.closest(DRAWER_ROW_SEL));

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
      const btn = findButton(d, CLOSE_ICONS.concat(BACK_ICONS), /^(chiudi|close|indietro|back)$/i);
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
        const back = findButton(sub, BACK_ICONS, /^(indietro|back)$/i);
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

  // "Copia" nelle lingue supportate: la voce da clonare per ereditarne lo stile.
  const COPY_LABELS = ['copia', 'copy', 'copier', 'kopieren', 'copiar'];

  // Inietta (o reinietta) la voce nel menu. Nessun flag permanente: WhatsApp
  // riusa lo stesso menu e ne rigenera le voci a ogni apertura; le nostre voci
  // si riconoscono dall'attributo data-cs-item, non dall'etichetta tradotta.
  function injectInto(menu, bubble) {
    if (!menu || !isPoll(bubble)) return true;
    if (findPollMenuItem(menu)) return true; // è il menu Allega, non quello del messaggio
    if (menu.querySelector('[data-cs-item="copy"]')) return true;

    const items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]'));
    if (!items.length) return false;

    const template =
      items.find((b) => COPY_LABELS.indexOf((b.getAttribute('aria-label') || '').trim().toLowerCase()) !== -1) ||
      items[0];

    const newItem = template.cloneNode(true);
    newItem.setAttribute('data-cs-item', 'copy');
    newItem.setAttribute('aria-label', t('menuCopy'));
    const iconSpan = newItem.querySelector('span[aria-hidden="true"]');
    const labelSpan = newItem.querySelector('span:not([aria-hidden])');
    if (iconSpan) iconSpan.innerHTML = POLL_ICON_SVG;
    if (labelSpan) labelSpan.textContent = t('menuCopy');

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
        if (!text) return done(t('noVotes'));
        if (!getVotersEnabled()) return done(t('copied'));
        if (labelSpan) labelSpan.textContent = t('countingVoters');
        countVoters(bubble, poll.total).then((voters) => {
          if (voters === null) return done(t('copiedNoVoters'));
          copyToClipboard(text + '\n\n' + formatVoters(getVotersTemplate(), voters)).then((ok) =>
            done(ok ? t('copied') : t('copiedNoVoters'))
          );
        });
      },
      true
    );

    template.insertAdjacentElement('beforebegin', newItem);
    return true;
  }

  // --- Sondaggio da testo --------------------------------------------------
  // Voce "Sondaggio da testo" nel menu Allega (+): l'utente incolla una lista,
  // una riga per opzione; apriamo il modulo "Sondaggio" di WhatsApp e lo
  // compiliamo simulando la digitazione. L'invio resta all'utente.
  // Limiti del modulo di WhatsApp: oltre questi il testo viene rifiutato per
  // intero (non troncato) e le opzioni duplicate bloccano l'invio.
  const POLL_MAX_OPTIONS = 12;
  const POLL_MAX_OPTION_LEN = 100;
  const POLL_MAX_QUESTION_LEN = 255;
  const POLL_MODAL_SEL = '[data-testid="poll-creation-modal"]';
  const LIST_ICON_SVG =
    '<svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="currentColor">' +
    '<path d="M4 6h2v2H4V6zm4 0h12v2H8V6zm-4 5h2v2H4v-2zm4 0h12v2H8v-2zm-4 5h2v2H4v-2zm4 0h12v2H8v-2z"/>' +
    '</svg>';

  // Le emoji contano come un solo carattere, come nel modulo di WhatsApp.
  const charLen = (s) => Array.from(s).length;

  // Una riga = un'opzione. Toglie righe vuote, puntati ("- ", "• ", "1. ",
  // "2) ") e punteggiatura finale ";" o ","; scarta i duplicati esatti.
  function parsePollText(text) {
    const options = [];
    const duplicates = [];
    for (const raw of (text || '').split('\n')) {
      const line = clean(raw.replace(/^\s*(?:[-*•·–]|\d+[.)])\s+/, '').replace(/[;,]+\s*$/, ''));
      if (!line) continue;
      if (options.indexOf(line) !== -1) duplicates.push(line);
      else options.push(line);
    }
    return { options, duplicates };
  }

  function pollTextProblems(question, parsed) {
    const errors = [];
    if (!question) errors.push(t('errNoQuestion'));
    else if (charLen(question) > POLL_MAX_QUESTION_LEN)
      errors.push(t('errQuestionLong', { n: charLen(question), max: POLL_MAX_QUESTION_LEN }));
    if (parsed.options.length < 2) errors.push(t('errFewOptions'));
    if (parsed.options.length > POLL_MAX_OPTIONS)
      errors.push(t('errManyOptions', { n: parsed.options.length, max: POLL_MAX_OPTIONS }));
    parsed.options.forEach((o, i) => {
      if (charLen(o) > POLL_MAX_OPTION_LEN)
        errors.push(t('errOptionLong', { i: i + 1, n: charLen(o), max: POLL_MAX_OPTION_LEN }));
    });
    const warnings = parsed.duplicates.map((d) => t('warnDuplicate', { x: d }));
    return { errors, warnings };
  }

  // Pulsante Allega (+) e voce "Sondaggio": riconosciuti dall'icona, che non
  // cambia con la lingua di WhatsApp; aria-label solo come riserva.
  const findAttachButton = () => {
    const all = Array.prototype.slice.call(document.querySelectorAll('footer button, footer [role="button"]'));
    return (
      all.find((b) => iconName(b) === 'ic-add') ||
      all.find((b) => /^(allega|attach)$/i.test(b.getAttribute('aria-label') || ''))
    );
  };
  const findPollMenuItem = (root) => {
    const all = Array.prototype.slice.call((root || document).querySelectorAll('[role="menuitem"]:not([data-cs-item])'));
    return (
      all.find((b) => iconName(b) === 'wds-ic-poll') ||
      all.find((b) => /^(sondaggio|poll)$/i.test(b.getAttribute('aria-label') || ''))
    );
  };

  // Scrive in un editor Lexical di WhatsApp come se l'utente digitasse.
  async function typeInto(el, text) {
    if (!el) return false;
    el.focus();
    document.getSelection().selectAllChildren(el);
    document.execCommand('insertText', false, text);
    await sleep(80);
    return clean(el.textContent) === clean(text);
  }

  // Apre il modulo "Sondaggio" della chat corrente e lo compila.
  // Restituisce null se è andato tutto bene, altrimenti un messaggio d'errore.
  async function fillWhatsAppPoll(question, options, multi) {
    if (document.querySelector(POLL_MODAL_SEL)) return t('fillBusy');
    const attach = findAttachButton();
    if (!attach) return t('fillNoChat');
    if (!findPollMenuItem()) attach.click();
    const item = await waitFor(() => findPollMenuItem(), 2000);
    if (!item) return t('fillNoMenuItem');
    item.click();
    const modal = await waitFor(() => document.querySelector(POLL_MODAL_SEL), 3000);
    if (!modal) return t('fillNoModal');

    if (!(await typeInto(modal.querySelector('[data-testid="poll-question-input"]'), question)))
      return t('fillQuestionRejected');
    for (let i = 0; i < options.length; i++) {
      const field = await waitFor(() => {
        const m = document.querySelector(POLL_MODAL_SEL);
        return m && m.querySelector('[data-testid="poll-option-input-' + i + '"]');
      }, 2000);
      if (!(await typeInto(field, options[i]))) return t('fillOptionRejected', { i: i + 1 });
    }
    const multiSwitch = document.getElementById('polls-single-option-switch');
    if (multiSwitch && multiSwitch.checked !== multi) multiSwitch.click();
    return null;
  }

  function isDarkTheme() {
    return (
      document.body.classList.contains('dark') ||
      document.documentElement.classList.contains('dark') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText =
      'position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:2147483647;' +
      'background:#233138;color:#e9edef;padding:10px 16px;border-radius:8px;font-size:14px;' +
      'box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:min(480px,90vw);';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // Finestra: domanda, lista incollata, anteprima con i controlli sui limiti.
  function openPollFromText() {
    if (document.getElementById('cs-poll-overlay')) return;
    const dark = isDarkTheme();
    const bg = dark ? '#233138' : '#ffffff';
    const fg = dark ? '#e9edef' : '#111b21';
    const sub = dark ? '#8696a0' : '#667781';
    const border = dark ? '#2a3942' : '#e9edef';
    const field = dark ? '#2a3942' : '#f0f2f5';
    const accent = '#00a884';
    const danger = dark ? '#f15c6d' : '#d42b3e';

    const overlay = document.createElement('div');
    overlay.id = 'cs-poll-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgba(11,20,26,.55);' +
      'display:flex;align-items:center;justify-content:center;font-family:inherit;';

    const panel = document.createElement('div');
    panel.style.cssText =
      'width:min(480px,92vw);max-height:90vh;overflow:auto;background:' + bg + ';color:' + fg + ';' +
      'border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:22px 22px 18px;box-sizing:border-box;';

    const mkLabel = (text) => {
      const l = document.createElement('div');
      l.textContent = text;
      l.style.cssText = 'font-size:12px;color:' + sub + ';margin:14px 0 6px;text-transform:uppercase;letter-spacing:.4px;';
      return l;
    };
    const fieldCss =
      'width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid ' + border + ';' +
      'background:' + field + ';color:' + fg + ';font-size:15px;outline:none;font-family:inherit;';

    const title = document.createElement('div');
    title.textContent = t('menuFromText');
    title.style.cssText = 'font-size:17px;font-weight:600;margin-bottom:6px;';

    const help = document.createElement('div');
    help.textContent = t('ftHelp');
    help.style.cssText = 'font-size:13px;line-height:1.45;color:' + sub + ';';

    const question = document.createElement('input');
    question.type = 'text';
    question.placeholder = t('ftQuestionPh');
    question.style.cssText = fieldCss;

    const list = document.createElement('textarea');
    list.rows = 8;
    list.placeholder = t('ftOptionsPh');
    list.style.cssText = fieldCss + 'resize:vertical;line-height:1.4;';

    const multiRow = document.createElement('label');
    multiRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:12px;font-size:14px;cursor:pointer;';
    const multi = document.createElement('input');
    multi.type = 'checkbox';
    multi.checked = true;
    multi.style.cssText = 'margin:0;accent-color:' + accent + ';';
    multiRow.appendChild(multi);
    multiRow.appendChild(document.createTextNode(t('ftMulti')));

    const preview = document.createElement('ol');
    preview.style.cssText =
      'margin:0;padding:10px 12px 10px 34px;border-radius:8px;background:' + field + ';font-size:14px;' +
      'line-height:1.5;min-height:20px;';
    const problems = document.createElement('div');
    problems.style.cssText = 'font-size:13px;line-height:1.45;margin-top:8px;';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:18px;';
    const mkBtn = (label, primary) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'padding:9px 18px;border-radius:20px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;' +
        (primary ? 'background:' + accent + ';color:#fff;' : 'background:transparent;color:' + accent + ';');
      return b;
    };
    const cancel = mkBtn(t('cancel'), false);
    const go = mkBtn(t('ftFill'), true);

    let state = null;
    const render = () => {
      const parsed = parsePollText(list.value);
      const q = clean(question.value);
      state = { q, parsed, check: pollTextProblems(q, parsed) };
      preview.textContent = '';
      parsed.options.forEach((o, i) => {
        const li = document.createElement('li');
        li.textContent = o;
        if (i >= POLL_MAX_OPTIONS || charLen(o) > POLL_MAX_OPTION_LEN) li.style.color = danger;
        preview.appendChild(li);
      });
      problems.textContent = '';
      state.check.errors.concat(state.check.warnings).forEach((m, i) => {
        const d = document.createElement('div');
        d.textContent = m;
        d.style.color = i < state.check.errors.length ? danger : sub;
        problems.appendChild(d);
      });
      const ok = !state.check.errors.length;
      go.disabled = !ok;
      go.style.opacity = ok ? '1' : '.5';
      go.style.cursor = ok ? 'pointer' : 'default';
    };
    question.addEventListener('input', render);
    list.addEventListener('input', render);

    // WhatsApp, chiudendo il menu Allega, rimette il focus sulla casella del
    // messaggio subito dopo l'apertura e i tasti finirebbero lì. Nel primo
    // secondo riportiamo il focus dentro, in modo asincrono e al massimo poche
    // volte: una guardia permanente e sincrona entra in un rimpallo infinito con
    // WhatsApp e blocca la pagina.
    // I tasti si intercettano su window in fase di capture, prima di WhatsApp:
    // Escape chiude solo la finestra (altrimenti chiuderebbe la chat).
    let lastFocus = question;
    let refocusLeft = 3;
    const openedAt = Date.now();
    const onFocusIn = (e) => {
      if (overlay.contains(e.target)) {
        lastFocus = e.target;
        return;
      }
      if (refocusLeft > 0 && Date.now() - openedAt < 1000) {
        refocusLeft--;
        setTimeout(() => {
          if (document.contains(overlay)) lastFocus.focus();
        }, 0);
      }
    };
    const onKeyDown = (e) => {
      if (!overlay.contains(e.target)) return;
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) go.click();
    };
    const close = () => {
      document.removeEventListener('focusin', onFocusIn, true);
      window.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
    };
    cancel.addEventListener('click', close);
    go.addEventListener('click', () => {
      render();
      if (state.check.errors.length) return;
      const s = state;
      const wantMulti = multi.checked;
      close();
      fillWhatsAppPoll(s.q, s.parsed.options, wantMulti).then(
        (err) => showToast(err || t('fillDone')),
        () => showToast(t('fillFailed'))
      );
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    btnRow.appendChild(cancel);
    btnRow.appendChild(go);
    panel.appendChild(title);
    panel.appendChild(help);
    panel.appendChild(mkLabel(t('ftQuestion')));
    panel.appendChild(question);
    panel.appendChild(mkLabel(t('ftOptions')));
    panel.appendChild(list);
    panel.appendChild(multiRow);
    panel.appendChild(mkLabel(t('preview')));
    panel.appendChild(preview);
    panel.appendChild(problems);
    panel.appendChild(btnRow);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.addEventListener('focusin', onFocusIn, true);
    window.addEventListener('keydown', onKeyDown, true);
    render();
    question.focus();
  }

  // Aggiunge "Sondaggio da testo" sotto la voce "Sondaggio" del menu Allega.
  function injectAttachItem(menu) {
    const pollItem = menu && findPollMenuItem(menu);
    if (!pollItem) return false;
    if (menu.querySelector('[data-cs-item="from-text"]')) return true;
    const item = pollItem.cloneNode(true);
    item.setAttribute('data-cs-item', 'from-text');
    item.setAttribute('aria-label', t('menuFromText'));
    const iconSpan = item.querySelector('span[aria-hidden="true"]');
    const labelSpan = item.querySelector('span:not([aria-hidden])');
    if (iconSpan) iconSpan.innerHTML = LIST_ICON_SVG;
    if (labelSpan) labelSpan.textContent = t('menuFromText');
    item.addEventListener(
      'click',
      (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        // Il pulsante Allega apre e chiude il menu: lo usiamo per chiuderlo.
        const attach = findAttachButton();
        if (attach && document.contains(menu)) attach.click();
        openPollFromText();
      },
      true
    );
    pollItem.insertAdjacentElement('afterend', item);
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

  // AGGANCIO 3: click sul pulsante Allega (+), per il menu riusato.
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target.closest && e.target.closest('footer button, footer [role="button"]');
      if (!btn || btn !== findAttachButton()) return;
      let tries = 0;
      const tick = () => {
        if (injectAttachItem(findOpenMenu())) return;
        if (tries++ < 60) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    true
  );

  // AGGANCIO 2: MutationObserver (per i menu montati da zero, es. chevron, menu Allega).
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        const menu = node.matches('div[role="menu"]') ? node : node.querySelector('div[role="menu"]');
        if (menu) {
          injectInto(menu, lastBubble);
          injectAttachItem(menu);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
