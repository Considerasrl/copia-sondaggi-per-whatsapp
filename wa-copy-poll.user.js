// ==UserScript==
// @name         WhatsApp Web - Copia sondaggio
// @namespace    considera.whatsapp-copia-sondaggio
// @version      1.0.2
// @description  Aggiunge una voce "Copia sondaggio" al menu dei messaggi di WhatsApp Web: copia le opzioni con almeno 1 voto nel formato "x{voti} {opzione}", una per riga.
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
  function extractPoll(bubble) {
    const lines = (bubble.innerText || '')
      .split('\n')
      .map(clean)
      .filter(Boolean);

    const out = [];
    let label = null;
    for (const line of lines) {
      if (/^\d+$/.test(line)) {
        if (label !== null) {
          const v = parseInt(line, 10);
          if (v > 0) out.push('x' + v + ' ' + label);
          label = null;
        }
      } else {
        // Riga non numerica: è (o sovrascrive) l'etichetta corrente.
        // Titolo, "Seleziona…", orario e "Visualizza voti" restano senza un
        // numero subito dopo, quindi non producono output.
        label = line;
      }
    }
    return out.join('\n');
  }

  // Copia negli appunti.
  // Su WhatsApp Web l'API asincrona navigator.clipboard può essere bloccata dalla
  // Permissions-Policy della pagina: quindi usiamo prima execCommand('copy')
  // (sincrono, affidabile durante il gesto di click) e solo come ripiego l'API
  // asincrona.
  function copyToClipboard(text) {
    if (execCopy(text)) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
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
        const text = extractPoll(bubble); // ricalcolo al click (voti aggiornati)
        copyToClipboard(text);
        if (iconSpan) iconSpan.innerHTML = CHECK_ICON_SVG;
        if (labelSpan) labelSpan.textContent = text ? 'Copiato!' : 'Nessun voto';
        setTimeout(() => closeMenuByClickingOutside(menu), 250);
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
