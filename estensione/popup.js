// Popup dell'estensione: personalizza il formato di copia dei sondaggi.
// Il modello usa i segnaposto [n] (numero di voti) e [opzione] (etichetta)
// ed è salvato in chrome.storage.local, letto poi dal content script.
(function () {
  'use strict';

  const TEMPLATE_KEY = 'formato';
  const DEFAULT_TEMPLATE = 'x[n] [opzione]';

  const input = document.getElementById('tpl');
  const preview = document.getElementById('preview');
  const saved = document.getElementById('saved');
  const saveBtn = document.getElementById('save');
  const resetBtn = document.getElementById('reset');

  const sample = [
    { label: 'Sì', n: 7 },
    { label: 'No', n: 2 },
  ];

  function formatOption(tpl, votes, label) {
    return tpl.replace(/\[n\]/gi, votes).replace(/\[opzione\]/gi, label);
  }

  function renderPreview() {
    const tpl = input.value || DEFAULT_TEMPLATE;
    preview.textContent = sample.map((o) => formatOption(tpl, o.n, o.label)).join('\n');
  }

  function flashSaved() {
    saved.classList.add('show');
    setTimeout(() => saved.classList.remove('show'), 1200);
  }

  function save() {
    const value = input.value.trim() || DEFAULT_TEMPLATE;
    input.value = value;
    chrome.storage.local.set({ [TEMPLATE_KEY]: value }, flashSaved);
    renderPreview();
  }

  chrome.storage.local.get(TEMPLATE_KEY, (res) => {
    const v = res && res[TEMPLATE_KEY];
    input.value = typeof v === 'string' && v.length ? v : DEFAULT_TEMPLATE;
    renderPreview();
  });

  input.addEventListener('input', renderPreview);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
  });
  saveBtn.addEventListener('click', save);
  resetBtn.addEventListener('click', () => {
    input.value = DEFAULT_TEMPLATE;
    save();
  });
})();
