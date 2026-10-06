// ==UserScript==
// @name         WhatsApp Web - Copia sondaggio
// @namespace    considera.whatsapp-copia-sondaggio
// @version      1.3.0
// @description  Aggiunge una voce "Copia sondaggio" al menu dei messaggi di WhatsApp Web: copia le opzioni con almeno 1 voto, con formato personalizzabile ([n] = voti, [opzione] = etichetta) e, a scelta, il numero di votanti effettivi.
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

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

  const GEAR_ICON_SVG =
    '<svg viewBox="0 0 24 24" height="18" width="18" preserveAspectRatio="xMidYMid meet" fill="currentColor">' +
    '<path d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7 7 0 0 0-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.28 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.62-.05.94s.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.38 1.05.7 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54a7 7 0 0 0 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>' +
    '</svg>';

  // --- Formato di copia personalizzabile -----------------------------------
  // Il modello usa i segnaposto [n] (numero di voti) e [opzione] (etichetta).
  // Salvato nel localStorage della pagina, così vale per estensione e userscript.
  const TEMPLATE_KEY = 'considera:copiaSondaggi:formato';
  const DEFAULT_TEMPLATE = 'x[n] [opzione]';

  function getTemplate() {
    try {
      const v = localStorage.getItem(TEMPLATE_KEY);
      return v && v.length ? v : DEFAULT_TEMPLATE;
    } catch (_) {
      return DEFAULT_TEMPLATE;
    }
  }
  function setTemplate(v) {
    try {
      localStorage.setItem(TEMPLATE_KEY, v);
    } catch (_) {}
  }
  // Riga opzionale in fondo con il numero di votanti effettivi ([votanti]).
  const VOTERS_KEY = 'considera:copiaSondaggi:votanti';
  const VOTERS_TEMPLATE_KEY = 'considera:copiaSondaggi:formatoVotanti';
  const DEFAULT_VOTERS_TEMPLATE = 'Votanti: [votanti]';

  function getVotersEnabled() {
    try {
      return localStorage.getItem(VOTERS_KEY) === '1';
    } catch (_) {
      return false;
    }
  }
  function setVotersEnabled(on) {
    try {
      localStorage.setItem(VOTERS_KEY, on ? '1' : '0');
    } catch (_) {}
  }
  function getVotersTemplate() {
    try {
      const v = localStorage.getItem(VOTERS_TEMPLATE_KEY);
      return v && v.length ? v : DEFAULT_VOTERS_TEMPLATE;
    } catch (_) {
      return DEFAULT_VOTERS_TEMPLATE;
    }
  }
  function setVotersTemplate(v) {
    try {
      localStorage.setItem(VOTERS_TEMPLATE_KEY, v);
    } catch (_) {}
  }
  function formatOption(tpl, votes, label) {
    return tpl.replace(/\[n\]/gi, votes).replace(/\[opzione\]/gi, label);
  }
  function formatVoters(tpl, voters) {
    return tpl.replace(/\[votanti\]/gi, voters);
  }

  // Finestra di impostazioni: modifica il modello con anteprima dal vivo.
  function openSettings() {
    if (document.getElementById('cs-settings-overlay')) return;
    const isDark =
      document.body.classList.contains('dark') ||
      document.documentElement.classList.contains('dark') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const bg = isDark ? '#233138' : '#ffffff';
    const fg = isDark ? '#e9edef' : '#111b21';
    const sub = isDark ? '#8696a0' : '#667781';
    const border = isDark ? '#2a3942' : '#e9edef';
    const field = isDark ? '#2a3942' : '#f0f2f5';
    const accent = '#00a884';

    const overlay = document.createElement('div');
    overlay.id = 'cs-settings-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgba(11,20,26,.55);' +
      'display:flex;align-items:center;justify-content:center;font-family:inherit;';

    const panel = document.createElement('div');
    panel.style.cssText =
      'width:min(440px,92vw);background:' + bg + ';color:' + fg + ';border-radius:12px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,.35);padding:22px 22px 18px;box-sizing:border-box;';

    const title = document.createElement('div');
    title.textContent = 'Formato copia sondaggio';
    title.style.cssText = 'font-size:17px;font-weight:600;margin-bottom:6px;';

    const help = document.createElement('div');
    help.innerHTML =
      'Personalizza il testo di ogni opzione. Segnaposto disponibili: ' +
      '<b style="color:' + accent + '">[n]</b> = numero di voti, ' +
      '<b style="color:' + accent + '">[opzione]</b> = etichetta.';
    help.style.cssText = 'font-size:13px;line-height:1.45;color:' + sub + ';margin-bottom:14px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = getTemplate();
    input.spellcheck = false;
    input.style.cssText =
      'width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid ' + border + ';' +
      'background:' + field + ';color:' + fg + ';font-size:15px;outline:none;font-family:inherit;';

    const previewLabel = document.createElement('div');
    previewLabel.textContent = 'Anteprima';
    previewLabel.style.cssText = 'font-size:12px;color:' + sub + ';margin:14px 0 6px;text-transform:uppercase;letter-spacing:.4px;';

    const preview = document.createElement('pre');
    preview.style.cssText =
      'margin:0;padding:10px 12px;border-radius:8px;background:' + field + ';color:' + fg + ';' +
      'font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;font-family:inherit;min-height:20px;';

    const votersRow = document.createElement('label');
    votersRow.style.cssText =
      'display:flex;align-items:center;gap:8px;margin-top:14px;font-size:14px;cursor:pointer;';
    const votersCheck = document.createElement('input');
    votersCheck.type = 'checkbox';
    votersCheck.checked = getVotersEnabled();
    votersCheck.style.cssText = 'margin:0;accent-color:' + accent + ';';
    votersRow.appendChild(votersCheck);
    votersRow.appendChild(document.createTextNode('Aggiungi il numero di votanti'));

    const votersInput = document.createElement('input');
    votersInput.type = 'text';
    votersInput.value = getVotersTemplate();
    votersInput.spellcheck = false;
    votersInput.setAttribute('aria-label', 'Modello riga votanti');
    votersInput.style.cssText = input.style.cssText + 'margin-top:8px;';

    const votersNote = document.createElement('div');
    votersNote.innerHTML =
      '<b style="color:' + accent + '">[votanti]</b> = persone che hanno votato, contate una volta sola ' +
      'anche se hanno scelto più opzioni. Per i sondaggi a scelta multipla viene aperto per un attimo ' +
      'il pannello "Visualizza voti".';
    votersNote.style.cssText = 'font-size:12px;line-height:1.4;color:' + sub + ';margin-top:6px;';

    const sample = [
      { label: 'Sì', n: 7 },
      { label: 'No', n: 2 },
    ];
    const sampleVoters = 8;
    const renderPreview = () => {
      const tpl = input.value || DEFAULT_TEMPLATE;
      let text = sample.map((o) => formatOption(tpl, o.n, o.label)).join('\n');
      if (votersCheck.checked) {
        text += '\n\n' + formatVoters(votersInput.value || DEFAULT_VOTERS_TEMPLATE, sampleVoters);
      }
      preview.textContent = text;
      votersInput.disabled = !votersCheck.checked;
      votersInput.style.opacity = votersCheck.checked ? '1' : '.5';
    };
    input.addEventListener('input', renderPreview);
    votersInput.addEventListener('input', renderPreview);
    votersCheck.addEventListener('change', renderPreview);
    renderPreview();

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:20px;';

    const mkBtn = (label, primary) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'padding:9px 18px;border-radius:20px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;' +
        (primary
          ? 'background:' + accent + ';color:#fff;'
          : 'background:transparent;color:' + accent + ';');
      return b;
    };

    const reset = mkBtn('Ripristina', false);
    reset.style.marginRight = 'auto';
    reset.addEventListener('click', () => {
      input.value = DEFAULT_TEMPLATE;
      votersCheck.checked = false;
      votersInput.value = DEFAULT_VOTERS_TEMPLATE;
      renderPreview();
    });

    const cancel = mkBtn('Annulla', false);
    const save = mkBtn('Salva', true);

    const close = () => overlay.remove();
    cancel.addEventListener('click', close);
    save.addEventListener('click', () => {
      setTemplate(input.value.trim() || DEFAULT_TEMPLATE);
      setVotersEnabled(votersCheck.checked);
      setVotersTemplate(votersInput.value.trim() || DEFAULT_VOTERS_TEMPLATE);
      close();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter') save.click();
    });

    btnRow.appendChild(reset);
    btnRow.appendChild(cancel);
    btnRow.appendChild(save);
    panel.appendChild(title);
    panel.appendChild(help);
    panel.appendChild(input);
    panel.appendChild(votersRow);
    panel.appendChild(votersInput);
    panel.appendChild(votersNote);
    panel.appendChild(previewLabel);
    panel.appendChild(preview);
    panel.appendChild(btnRow);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    input.focus();
    input.select();
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
        // Riga non numerica: è (o sovrascrive) l'etichetta corrente.
        // Titolo, "Seleziona…", orario e "Visualizza voti" restano senza un
        // numero subito dopo, quindi non producono output.
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
  // Su WhatsApp Web l'API asincrona navigator.clipboard può essere bloccata dalla
  // Permissions-Policy della pagina: quindi usiamo prima execCommand('copy')
  // (sincrono, affidabile durante il gesto di click) e solo come ripiego l'API
  // asincrona.
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

    const makeItem = (label, iconSvg, onClick) => {
      const it = template.cloneNode(true);
      it.setAttribute('aria-label', label);
      const iconSpan = it.querySelector('span[aria-hidden="true"]');
      const labelSpan = it.querySelector('span:not([aria-hidden])');
      if (iconSpan) iconSpan.innerHTML = iconSvg;
      if (labelSpan) labelSpan.textContent = label;
      it.addEventListener(
        'click',
        (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          onClick(iconSpan, labelSpan);
        },
        true
      );
      return it;
    };

    const copyItem = makeItem('Copia sondaggio', POLL_ICON_SVG, (iconSpan, labelSpan) => {
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
    });

    const settingsItem = makeItem('Formato copia', GEAR_ICON_SVG, () => {
      closeMenuByClickingOutside(menu);
      openSettings();
    });

    template.insertAdjacentElement('beforebegin', copyItem);
    copyItem.insertAdjacentElement('afterend', settingsItem);
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
