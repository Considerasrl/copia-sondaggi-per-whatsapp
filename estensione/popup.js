// Popup dell'estensione: personalizza il formato di copia dei sondaggi.
// Il modello usa i segnaposto [n] (numero di voti) e [opzione] (etichetta);
// opzionalmente si aggiunge in fondo una riga con [votanti] (persone distinte).
// Tutto è salvato in chrome.storage.local, letto poi dal content script.
(function () {
  'use strict';

  const TEMPLATE_KEY = 'formato';
  const DEFAULT_TEMPLATE = 'x[n] [opzione]';
  const VOTERS_KEY = 'votanti';
  const VOTERS_TEMPLATE_KEY = 'formatoVotanti';
  const DEFAULT_VOTERS_TEMPLATE = 'Votanti: [votanti]';

  const input = document.getElementById('tpl');
  const votersCheck = document.getElementById('voters');
  const votersInput = document.getElementById('votersTpl');
  const preview = document.getElementById('preview');
  const saved = document.getElementById('saved');
  const saveBtn = document.getElementById('save');
  const resetBtn = document.getElementById('reset');

  const sample = [
    { label: 'Sì', n: 7 },
    { label: 'No', n: 2 },
  ];
  const sampleVoters = 8;

  function formatOption(tpl, votes, label) {
    return tpl.replace(/\[n\]/gi, votes).replace(/\[opzione\]/gi, label);
  }
  function formatVoters(tpl, voters) {
    return tpl.replace(/\[votanti\]/gi, voters);
  }

  function renderPreview() {
    const tpl = input.value || DEFAULT_TEMPLATE;
    let text = sample.map((o) => formatOption(tpl, o.n, o.label)).join('\n');
    if (votersCheck.checked) {
      text += '\n\n' + formatVoters(votersInput.value || DEFAULT_VOTERS_TEMPLATE, sampleVoters);
    }
    preview.textContent = text;
    votersInput.disabled = !votersCheck.checked;
  }

  function flashSaved() {
    saved.classList.add('show');
    setTimeout(() => saved.classList.remove('show'), 1200);
  }

  function save() {
    const value = input.value.trim() || DEFAULT_TEMPLATE;
    const votersValue = votersInput.value.trim() || DEFAULT_VOTERS_TEMPLATE;
    input.value = value;
    votersInput.value = votersValue;
    chrome.storage.local.set(
      {
        [TEMPLATE_KEY]: value,
        [VOTERS_KEY]: votersCheck.checked,
        [VOTERS_TEMPLATE_KEY]: votersValue,
      },
      flashSaved
    );
    renderPreview();
  }

  chrome.storage.local.get([TEMPLATE_KEY, VOTERS_KEY, VOTERS_TEMPLATE_KEY], (res) => {
    const v = res && res[TEMPLATE_KEY];
    input.value = typeof v === 'string' && v.length ? v : DEFAULT_TEMPLATE;
    votersCheck.checked = !!(res && res[VOTERS_KEY] === true);
    const vt = res && res[VOTERS_TEMPLATE_KEY];
    votersInput.value = typeof vt === 'string' && vt.length ? vt : DEFAULT_VOTERS_TEMPLATE;
    renderPreview();
  });

  input.addEventListener('input', renderPreview);
  votersInput.addEventListener('input', renderPreview);
  votersCheck.addEventListener('change', renderPreview);
  [input, votersInput].forEach((el) =>
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    })
  );
  saveBtn.addEventListener('click', save);
  resetBtn.addEventListener('click', () => {
    input.value = DEFAULT_TEMPLATE;
    votersCheck.checked = false;
    votersInput.value = DEFAULT_VOTERS_TEMPLATE;
    save();
  });
})();
