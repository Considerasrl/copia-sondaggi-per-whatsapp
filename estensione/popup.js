// Popup dell'estensione: lingua dell'interfaccia e formato di copia dei sondaggi.
// Il modello usa i segnaposto [n] (numero di voti) e [opzione] (etichetta);
// opzionalmente si aggiunge in fondo una riga con [votanti] (persone distinte).
// Tutto è salvato in chrome.storage.local, letto poi dal content script.
// Le traduzioni (CS_I18N) arrivano da i18n.js, caricato prima di questo file.
(function () {
  'use strict';

  const TEMPLATE_KEY = 'formato';
  const VOTERS_KEY = 'votanti';
  const VOTERS_TEMPLATE_KEY = 'formatoVotanti';
  const LANG_KEY = 'lingua'; // 'auto' (lingua del browser) o un codice di CS_I18N.LANGS

  const $ = (id) => document.getElementById(id);
  const langSelect = $('lang');
  const input = $('tpl');
  const votersCheck = $('voters');
  const votersInput = $('votersTpl');
  const preview = $('preview');
  const saved = $('saved');

  // Traduttore della lingua selezionata nel popup (anche prima di salvare).
  let t = CS_I18N.make(CS_I18N.resolve('auto'));

  function renderPreview() {
    const sample = [
      { label: t('sampleYes'), n: 7 },
      { label: t('sampleNo'), n: 2 },
    ];
    const tpl = input.value || t('defTemplate');
    let text = sample.map((o) => CS_I18N.formatOption(tpl, o.n, o.label)).join('\n');
    if (votersCheck.checked) {
      text += '\n\n' + CS_I18N.formatVoters(votersInput.value || t('defVotersTemplate'), 8);
    }
    preview.textContent = text;
    votersInput.disabled = !votersCheck.checked;
  }

  // Scrive i testi nella lingua corrente. I campi che mostrano ancora il
  // modello predefinito della lingua precedente passano a quello della nuova.
  function renderTexts(prevT) {
    const lang = langSelect.value;
    document.documentElement.lang = CS_I18N.resolve(lang);
    document.title = t('setTitle');
    $('title').textContent = t('setTitle');
    $('langLabel').textContent = t('setLang');
    langSelect.textContent = '';
    [['auto', t('setLangAuto')]]
      .concat(CS_I18N.LANGS.map((code) => [code, CS_I18N.NAMES[code]]))
      .forEach(([value, label]) => {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = label;
        langSelect.appendChild(o);
      });
    langSelect.value = lang;
    CS_I18N.rich($('help'), t('setHelp'), { n: '[n]', option: t('phOption') });
    $('tplLabel').textContent = t('setTemplate');
    $('votersLabel').textContent = t('setVoters');
    votersInput.setAttribute('aria-label', t('setVotersTplAria'));
    CS_I18N.rich($('votersNote'), t('setVotersNote'), { voters: t('phVoters') });
    $('previewLabel').textContent = t('preview');
    $('reset').textContent = t('setReset');
    saved.textContent = t('setSaved');
    $('save').textContent = t('setSave');
    if (prevT && input.value === prevT('defTemplate')) input.value = t('defTemplate');
    if (prevT && votersInput.value === prevT('defVotersTemplate')) votersInput.value = t('defVotersTemplate');
    renderPreview();
  }

  function flashSaved() {
    saved.classList.add('show');
    setTimeout(() => saved.classList.remove('show'), 1200);
  }

  function save() {
    const value = input.value.trim() || t('defTemplate');
    const votersValue = votersInput.value.trim() || t('defVotersTemplate');
    input.value = value;
    votersInput.value = votersValue;
    // Un modello uguale al predefinito non si salva: così segue la lingua.
    const data = { [LANG_KEY]: langSelect.value, [VOTERS_KEY]: votersCheck.checked };
    const toRemove = [];
    if (value === t('defTemplate')) toRemove.push(TEMPLATE_KEY);
    else data[TEMPLATE_KEY] = value;
    if (votersValue === t('defVotersTemplate')) toRemove.push(VOTERS_TEMPLATE_KEY);
    else data[VOTERS_TEMPLATE_KEY] = votersValue;
    chrome.storage.local.remove(toRemove, () => chrome.storage.local.set(data, flashSaved));
    renderPreview();
  }

  chrome.storage.local.get([TEMPLATE_KEY, VOTERS_KEY, VOTERS_TEMPLATE_KEY, LANG_KEY], (res) => {
    res = res || {};
    const pref = CS_I18N.LANGS.indexOf(res[LANG_KEY]) !== -1 ? res[LANG_KEY] : 'auto';
    t = CS_I18N.make(CS_I18N.resolve(pref));
    input.value = CS_I18N.custom(res[TEMPLATE_KEY], 'defTemplate') || t('defTemplate');
    votersCheck.checked = res[VOTERS_KEY] === true;
    votersInput.value = CS_I18N.custom(res[VOTERS_TEMPLATE_KEY], 'defVotersTemplate') || t('defVotersTemplate');
    langSelect.value = pref; // le opzioni vengono create da renderTexts
    const opt = document.createElement('option');
    opt.value = pref;
    langSelect.appendChild(opt);
    langSelect.value = pref;
    renderTexts(null);
  });

  langSelect.addEventListener('change', () => {
    const prevT = t;
    t = CS_I18N.make(CS_I18N.resolve(langSelect.value));
    renderTexts(prevT);
  });
  input.addEventListener('input', renderPreview);
  votersInput.addEventListener('input', renderPreview);
  votersCheck.addEventListener('change', renderPreview);
  [input, votersInput].forEach((el) =>
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    })
  );
  $('save').addEventListener('click', save);
  $('reset').addEventListener('click', () => {
    input.value = t('defTemplate');
    votersCheck.checked = false;
    votersInput.value = t('defVotersTemplate');
    save();
  });
})();
