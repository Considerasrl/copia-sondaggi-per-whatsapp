// ==UserScript==
// @name         WhatsApp Web - Copia sondaggio
// @namespace    considera.whatsapp-copia-sondaggio
// @version      1.4.0
// @description  Aggiunge una voce "Copia sondaggio" al menu dei messaggi di WhatsApp Web: copia le opzioni con almeno 1 voto, con formato personalizzabile ([n] = voti, [opzione] = etichetta) e, a scelta, il numero di votanti effettivi. Crea anche un sondaggio da una lista di testo (menu + → "Sondaggio da testo"). Interfaccia in italiano, inglese, francese, tedesco e spagnolo.
// @description:en Adds a "Copy poll" entry to WhatsApp Web message menus (voted options as text, customizable format, optional voter count) and creates polls from a text list. UI in Italian, English, French, German and Spanish.
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

  // ---- inizio i18n.js (copia verbatim di estensione/i18n.js) ----
  // Traduzioni dell'interfaccia (it, en, fr, de, es) e scelta della lingua.
  // Caricato sia dal content script (manifest.json) sia dal popup (popup.html):
  // MV3 non condivide moduli tra i due contesti. Copiato verbatim anche
  // nell'userscript, tra i marcatori "inizio/fine i18n.js".
  var CS_I18N = (function () {
    'use strict';

    var LANGS = ['it', 'en', 'fr', 'de', 'es'];
    var NAMES = { it: 'Italiano', en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español' };
    // Lingua usata quando quella del browser non è tra quelle supportate.
    var FALLBACK = 'en';

    var STRINGS = {
      it: {
        menuCopy: 'Copia sondaggio',
        copied: 'Copiato!',
        noVotes: 'Nessun voto',
        countingVoters: 'Conto i votanti…',
        copiedNoVoters: 'Copiato (senza votanti)',
        menuFromText: 'Sondaggio da testo',
        menuSettings: 'Formato copia',
        phOption: '[opzione]',
        phVoters: '[votanti]',
        defTemplate: 'x[n] [opzione]',
        defVotersTemplate: 'Votanti: [votanti]',
        sampleYes: 'Sì',
        sampleNo: 'No',
        setTitle: 'Formato copia sondaggio',
        setHelp: 'Come viene scritta ogni opzione. Segnaposto: {n} = numero di voti, {option} = etichetta.',
        setTemplate: 'Modello',
        setVoters: 'Aggiungi il numero di votanti',
        setVotersTplAria: 'Modello riga votanti',
        setVotersNote:
          '{voters} = persone che hanno votato, contate una volta sola anche se hanno scelto più opzioni. ' +
          'Per i sondaggi a scelta multipla viene aperto per un attimo il pannello "Visualizza voti".',
        setLang: 'Lingua',
        setLangAuto: 'Automatica (lingua del browser)',
        preview: 'Anteprima',
        setReset: 'Ripristina',
        setSaved: 'Salvato ✓',
        setSave: 'Salva',
        cancel: 'Annulla',
        ftHelp:
          'Incolla la lista: una riga per opzione. Righe vuote, puntati e ";" finali vengono tolti. ' +
          'Il sondaggio viene compilato nella chat aperta: lo controlli e lo invii tu.',
        ftQuestion: 'Domanda',
        ftQuestionPh: 'Es. Cosa ordiniamo?',
        ftOptions: 'Opzioni (una per riga)',
        ftOptionsPh: 'Opzione A\nOpzione B\nOpzione C',
        ftMulti: 'Consenti più risposte',
        ftFill: 'Compila sondaggio',
        errNoQuestion: 'Scrivi la domanda.',
        errQuestionLong: 'Domanda troppo lunga ({n}/{max} caratteri).',
        errFewOptions: 'Servono almeno 2 opzioni.',
        errManyOptions: 'Massimo {max} opzioni (ne hai {n}).',
        errOptionLong: 'Opzione {i} troppo lunga ({n}/{max} caratteri).',
        warnDuplicate: 'Duplicato ignorato: {x}',
        fillBusy: "C'è già un sondaggio in creazione: chiudilo e riprova.",
        fillNoChat: 'Apri prima la chat in cui creare il sondaggio.',
        fillNoMenuItem: 'Voce "Sondaggio" non trovata nel menu Allega.',
        fillNoModal: 'Il modulo del sondaggio non si è aperto.',
        fillQuestionRejected: 'WhatsApp non ha accettato la domanda.',
        fillOptionRejected: "WhatsApp non ha accettato l'opzione {i}.",
        fillDone: 'Sondaggio compilato: controllalo e premi Invia.',
        fillFailed: 'Qualcosa è andato storto durante la compilazione.',
      },
      en: {
        menuCopy: 'Copy poll',
        copied: 'Copied!',
        noVotes: 'No votes',
        countingVoters: 'Counting voters…',
        copiedNoVoters: 'Copied (without voters)',
        menuFromText: 'Poll from text',
        menuSettings: 'Copy format',
        phOption: '[option]',
        phVoters: '[voters]',
        defTemplate: 'x[n] [option]',
        defVotersTemplate: 'Voters: [voters]',
        sampleYes: 'Yes',
        sampleNo: 'No',
        setTitle: 'Poll copy format',
        setHelp: 'How each option is written. Placeholders: {n} = number of votes, {option} = label.',
        setTemplate: 'Template',
        setVoters: 'Add the number of voters',
        setVotersTplAria: 'Voters line template',
        setVotersNote:
          '{voters} = people who voted, each counted once even if they picked several options. ' +
          'For multiple-choice polls the "View votes" panel is opened for a moment.',
        setLang: 'Language',
        setLangAuto: 'Automatic (browser language)',
        preview: 'Preview',
        setReset: 'Reset',
        setSaved: 'Saved ✓',
        setSave: 'Save',
        cancel: 'Cancel',
        ftHelp:
          'Paste the list: one line per option. Empty lines, bullets and trailing ";" are removed. ' +
          'The poll is filled in in the open chat: you review it and send it yourself.',
        ftQuestion: 'Question',
        ftQuestionPh: 'E.g. What shall we order?',
        ftOptions: 'Options (one per line)',
        ftOptionsPh: 'Option A\nOption B\nOption C',
        ftMulti: 'Allow multiple answers',
        ftFill: 'Fill in poll',
        errNoQuestion: 'Write the question.',
        errQuestionLong: 'Question too long ({n}/{max} characters).',
        errFewOptions: 'At least 2 options are needed.',
        errManyOptions: 'At most {max} options (you have {n}).',
        errOptionLong: 'Option {i} too long ({n}/{max} characters).',
        warnDuplicate: 'Duplicate ignored: {x}',
        fillBusy: 'A poll is already being created: close it and try again.',
        fillNoChat: 'First open the chat where you want to create the poll.',
        fillNoMenuItem: '"Poll" entry not found in the Attach menu.',
        fillNoModal: 'The poll form did not open.',
        fillQuestionRejected: 'WhatsApp did not accept the question.',
        fillOptionRejected: 'WhatsApp did not accept option {i}.',
        fillDone: 'Poll filled in: review it and press Send.',
        fillFailed: 'Something went wrong while filling in the poll.',
      },
      fr: {
        menuCopy: 'Copier le sondage',
        copied: 'Copié !',
        noVotes: 'Aucun vote',
        countingVoters: 'Comptage des votants…',
        copiedNoVoters: 'Copié (sans votants)',
        menuFromText: 'Sondage depuis un texte',
        menuSettings: 'Format de copie',
        phOption: '[option]',
        phVoters: '[votants]',
        defTemplate: 'x[n] [option]',
        defVotersTemplate: 'Votants : [votants]',
        sampleYes: 'Oui',
        sampleNo: 'Non',
        setTitle: 'Format de copie du sondage',
        setHelp: 'Comment chaque option est écrite. Variables : {n} = nombre de votes, {option} = libellé.',
        setTemplate: 'Modèle',
        setVoters: 'Ajouter le nombre de votants',
        setVotersTplAria: 'Modèle de la ligne des votants',
        setVotersNote:
          '{voters} = personnes ayant voté, comptées une seule fois même si elles ont choisi plusieurs options. ' +
          'Pour les sondages à choix multiples, le panneau « Voir les votes » s’ouvre un instant.',
        setLang: 'Langue',
        setLangAuto: 'Automatique (langue du navigateur)',
        preview: 'Aperçu',
        setReset: 'Réinitialiser',
        setSaved: 'Enregistré ✓',
        setSave: 'Enregistrer',
        cancel: 'Annuler',
        ftHelp:
          'Collez la liste : une ligne par option. Les lignes vides, les puces et les « ; » finaux sont supprimés. ' +
          'Le sondage est rempli dans la discussion ouverte : vous le vérifiez et l’envoyez vous-même.',
        ftQuestion: 'Question',
        ftQuestionPh: 'Ex. : Qu’est-ce qu’on commande ?',
        ftOptions: 'Options (une par ligne)',
        ftOptionsPh: 'Option A\nOption B\nOption C',
        ftMulti: 'Autoriser plusieurs réponses',
        ftFill: 'Remplir le sondage',
        errNoQuestion: 'Écrivez la question.',
        errQuestionLong: 'Question trop longue ({n}/{max} caractères).',
        errFewOptions: 'Il faut au moins 2 options.',
        errManyOptions: 'Maximum {max} options (vous en avez {n}).',
        errOptionLong: 'Option {i} trop longue ({n}/{max} caractères).',
        warnDuplicate: 'Doublon ignoré : {x}',
        fillBusy: 'Un sondage est déjà en cours de création : fermez-le et réessayez.',
        fillNoChat: 'Ouvrez d’abord la discussion où créer le sondage.',
        fillNoMenuItem: 'Entrée « Sondage » introuvable dans le menu Joindre.',
        fillNoModal: 'Le formulaire du sondage ne s’est pas ouvert.',
        fillQuestionRejected: 'WhatsApp n’a pas accepté la question.',
        fillOptionRejected: 'WhatsApp n’a pas accepté l’option {i}.',
        fillDone: 'Sondage rempli : vérifiez-le et appuyez sur Envoyer.',
        fillFailed: 'Un problème est survenu pendant le remplissage du sondage.',
      },
      de: {
        menuCopy: 'Umfrage kopieren',
        copied: 'Kopiert!',
        noVotes: 'Keine Stimmen',
        countingVoters: 'Teilnehmer werden gezählt…',
        copiedNoVoters: 'Kopiert (ohne Teilnehmer)',
        menuFromText: 'Umfrage aus Text',
        menuSettings: 'Kopierformat',
        phOption: '[option]',
        phVoters: '[teilnehmer]',
        defTemplate: 'x[n] [option]',
        defVotersTemplate: 'Teilnehmer: [teilnehmer]',
        sampleYes: 'Ja',
        sampleNo: 'Nein',
        setTitle: 'Kopierformat der Umfrage',
        setHelp: 'Wie jede Option geschrieben wird. Platzhalter: {n} = Anzahl der Stimmen, {option} = Bezeichnung.',
        setTemplate: 'Vorlage',
        setVoters: 'Anzahl der Teilnehmer hinzufügen',
        setVotersTplAria: 'Vorlage für die Teilnehmerzeile',
        setVotersNote:
          '{voters} = Personen, die abgestimmt haben, jeweils nur einmal gezählt, auch bei mehreren gewählten Optionen. ' +
          'Bei Umfragen mit Mehrfachauswahl wird kurz das Feld „Stimmen anzeigen“ geöffnet.',
        setLang: 'Sprache',
        setLangAuto: 'Automatisch (Browsersprache)',
        preview: 'Vorschau',
        setReset: 'Zurücksetzen',
        setSaved: 'Gespeichert ✓',
        setSave: 'Speichern',
        cancel: 'Abbrechen',
        ftHelp:
          'Liste einfügen: eine Zeile pro Option. Leere Zeilen, Aufzählungszeichen und abschließende „;“ werden entfernt. ' +
          'Die Umfrage wird im geöffneten Chat ausgefüllt: Du prüfst sie und sendest sie selbst.',
        ftQuestion: 'Frage',
        ftQuestionPh: 'z. B. Was bestellen wir?',
        ftOptions: 'Optionen (eine pro Zeile)',
        ftOptionsPh: 'Option A\nOption B\nOption C',
        ftMulti: 'Mehrere Antworten erlauben',
        ftFill: 'Umfrage ausfüllen',
        errNoQuestion: 'Schreib die Frage.',
        errQuestionLong: 'Frage zu lang ({n}/{max} Zeichen).',
        errFewOptions: 'Mindestens 2 Optionen sind nötig.',
        errManyOptions: 'Höchstens {max} Optionen (du hast {n}).',
        errOptionLong: 'Option {i} zu lang ({n}/{max} Zeichen).',
        warnDuplicate: 'Duplikat ignoriert: {x}',
        fillBusy: 'Es wird bereits eine Umfrage erstellt: Schließ sie und versuch es erneut.',
        fillNoChat: 'Öffne zuerst den Chat, in dem die Umfrage erstellt werden soll.',
        fillNoMenuItem: 'Eintrag „Umfrage“ im Anhängen-Menü nicht gefunden.',
        fillNoModal: 'Das Umfrageformular hat sich nicht geöffnet.',
        fillQuestionRejected: 'WhatsApp hat die Frage nicht übernommen.',
        fillOptionRejected: 'WhatsApp hat Option {i} nicht übernommen.',
        fillDone: 'Umfrage ausgefüllt: Prüf sie und tippe auf Senden.',
        fillFailed: 'Beim Ausfüllen der Umfrage ist etwas schiefgelaufen.',
      },
      es: {
        menuCopy: 'Copiar encuesta',
        copied: '¡Copiado!',
        noVotes: 'Sin votos',
        countingVoters: 'Contando votantes…',
        copiedNoVoters: 'Copiado (sin votantes)',
        menuFromText: 'Encuesta desde texto',
        menuSettings: 'Formato de copia',
        phOption: '[opción]',
        phVoters: '[votantes]',
        defTemplate: 'x[n] [opción]',
        defVotersTemplate: 'Votantes: [votantes]',
        sampleYes: 'Sí',
        sampleNo: 'No',
        setTitle: 'Formato de copia de la encuesta',
        setHelp: 'Cómo se escribe cada opción. Marcadores: {n} = número de votos, {option} = etiqueta.',
        setTemplate: 'Plantilla',
        setVoters: 'Añadir el número de votantes',
        setVotersTplAria: 'Plantilla de la línea de votantes',
        setVotersNote:
          '{voters} = personas que han votado, contadas una sola vez aunque hayan elegido varias opciones. ' +
          'En las encuestas de opción múltiple se abre un momento el panel «Ver votos».',
        setLang: 'Idioma',
        setLangAuto: 'Automático (idioma del navegador)',
        preview: 'Vista previa',
        setReset: 'Restablecer',
        setSaved: 'Guardado ✓',
        setSave: 'Guardar',
        cancel: 'Cancelar',
        ftHelp:
          'Pega la lista: una línea por opción. Se quitan las líneas vacías, las viñetas y los «;» finales. ' +
          'La encuesta se rellena en el chat abierto: tú la revisas y la envías.',
        ftQuestion: 'Pregunta',
        ftQuestionPh: 'P. ej.: ¿Qué pedimos?',
        ftOptions: 'Opciones (una por línea)',
        ftOptionsPh: 'Opción A\nOpción B\nOpción C',
        ftMulti: 'Permitir varias respuestas',
        ftFill: 'Rellenar encuesta',
        errNoQuestion: 'Escribe la pregunta.',
        errQuestionLong: 'Pregunta demasiado larga ({n}/{max} caracteres).',
        errFewOptions: 'Se necesitan al menos 2 opciones.',
        errManyOptions: 'Máximo {max} opciones (tienes {n}).',
        errOptionLong: 'Opción {i} demasiado larga ({n}/{max} caracteres).',
        warnDuplicate: 'Duplicado ignorado: {x}',
        fillBusy: 'Ya hay una encuesta en creación: ciérrala y vuelve a intentarlo.',
        fillNoChat: 'Abre primero el chat donde crear la encuesta.',
        fillNoMenuItem: 'No se encontró la opción «Encuesta» en el menú Adjuntar.',
        fillNoModal: 'El formulario de la encuesta no se abrió.',
        fillQuestionRejected: 'WhatsApp no aceptó la pregunta.',
        fillOptionRejected: 'WhatsApp no aceptó la opción {i}.',
        fillDone: 'Encuesta rellenada: revísala y pulsa Enviar.',
        fillFailed: 'Algo salió mal al rellenar la encuesta.',
      },
    };

    // Segnaposto accettati in qualsiasi lingua, così un modello salvato funziona
    // anche dopo aver cambiato lingua.
    var OPTION_RE = /\[(opzione|option|opción|opcion)\]/gi;
    var VOTERS_RE = /\[(votanti|voters|votants|teilnehmer|votantes)\]/gi;

    function formatOption(tpl, votes, label) {
      // Funzione di sostituzione: un "$" nell'etichetta resta letterale.
      return tpl.replace(/\[n\]/gi, String(votes)).replace(OPTION_RE, function () {
        return label;
      });
    }
    function formatVoters(tpl, voters) {
      return tpl.replace(VOTERS_RE, String(voters));
    }

    // Modello salvato dall'utente, oppure null se è vuoto o uguale al predefinito
    // di una qualsiasi lingua: in quel caso segue la lingua attiva (fino alla
    // 1.3.0 veniva salvato anche il predefinito italiano).
    function custom(value, key) {
      if (typeof value !== 'string' || !value.length) return null;
      for (var i = 0; i < LANGS.length; i++) if (STRINGS[LANGS[i]][key] === value) return null;
      return value;
    }

    // Lingua del browser: prima quella dell'interfaccia (solo nell'estensione),
    // poi le lingue preferite; la prima supportata vince.
    function browserLang() {
      var list = [];
      try {
        if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
          list.push(chrome.i18n.getUILanguage());
        }
      } catch (_) {}
      if (navigator.languages) list = list.concat(Array.prototype.slice.call(navigator.languages));
      if (navigator.language) list.push(navigator.language);
      for (var i = 0; i < list.length; i++) {
        var code = String(list[i] || '').toLowerCase().split(/[-_]/)[0];
        if (LANGS.indexOf(code) !== -1) return code;
      }
      return FALLBACK;
    }

    // pref: 'auto' (o qualsiasi valore non valido) oppure un codice di LANGS.
    function resolve(pref) {
      return LANGS.indexOf(pref) !== -1 ? pref : browserLang();
    }

    // Restituisce t(chiave, variabili) per la lingua indicata, con l'italiano
    // come riserva per eventuali chiavi mancanti.
    function make(lang) {
      var dict = STRINGS[lang] || STRINGS[FALLBACK];
      return function t(key, vars) {
        var s = dict[key] != null ? dict[key] : STRINGS.it[key] != null ? STRINGS.it[key] : key;
        if (vars) {
          s = s.replace(/\{(\w+)\}/g, function (m, k) {
            return vars[k] != null ? String(vars[k]) : m;
          });
        }
        return s;
      };
    }

    // Scrive in el un testo con segnaposto {chiave}, resi in grassetto (b) con
    // il valore di tokens[chiave]; il resto come testo semplice (niente HTML).
    function rich(el, text, tokens, boldColor) {
      el.textContent = '';
      var re = /\{(\w+)\}/g;
      var last = 0;
      var m;
      while ((m = re.exec(text))) {
        if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
        var b = document.createElement('b');
        b.textContent = tokens[m[1]] != null ? tokens[m[1]] : m[0];
        if (boldColor) b.style.color = boldColor;
        el.appendChild(b);
        last = re.lastIndex;
      }
      if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
    }

    return {
      LANGS: LANGS,
      NAMES: NAMES,
      resolve: resolve,
      make: make,
      rich: rich,
      formatOption: formatOption,
      formatVoters: formatVoters,
      custom: custom,
    };
  })();
  // ---- fine i18n.js ----

  // --- Formato di copia personalizzabile e lingua --------------------------
  // Il modello usa i segnaposto [n] (numero di voti) e [opzione] (etichetta);
  // la riga opzionale dei votanti usa [votanti]. I segnaposto sono accettati in
  // tutte le lingue; finché l'utente non salva un modello si usa quello
  // predefinito della lingua attiva. Tutto nel localStorage della pagina.
  const TEMPLATE_KEY = 'considera:copiaSondaggi:formato';
  const VOTERS_KEY = 'considera:copiaSondaggi:votanti';
  const VOTERS_TEMPLATE_KEY = 'considera:copiaSondaggi:formatoVotanti';
  const LANG_KEY = 'considera:copiaSondaggi:lingua'; // 'auto' o un codice di CS_I18N.LANGS

  const load = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  };
  const store = (key, value) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (_) {}
  };

  function getLangPref() {
    return load(LANG_KEY) || 'auto';
  }
  let t = CS_I18N.make(CS_I18N.resolve(getLangPref()));

  function getTemplate() {
    return CS_I18N.custom(load(TEMPLATE_KEY), 'defTemplate') || t('defTemplate');
  }
  function getVotersEnabled() {
    return load(VOTERS_KEY) === '1';
  }
  function getVotersTemplate() {
    return CS_I18N.custom(load(VOTERS_TEMPLATE_KEY), 'defVotersTemplate') || t('defVotersTemplate');
  }
  const formatOption = CS_I18N.formatOption;
  const formatVoters = CS_I18N.formatVoters;

  // Finestra di impostazioni: lingua, modello, riga votanti, anteprima dal vivo.
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

    // La finestra si ridisegna nella lingua scelta nel selettore, prima ancora
    // di salvare; tt è il traduttore della lingua selezionata.
    let tt = t;

    const overlay = document.createElement('div');
    overlay.id = 'cs-settings-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgba(11,20,26,.55);' +
      'display:flex;align-items:center;justify-content:center;font-family:inherit;';

    const panel = document.createElement('div');
    panel.style.cssText =
      'width:min(440px,92vw);max-height:90vh;overflow:auto;background:' + bg + ';color:' + fg + ';' +
      'border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:22px 22px 18px;box-sizing:border-box;';

    const fieldCss =
      'width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid ' + border + ';' +
      'background:' + field + ';color:' + fg + ';font-size:15px;outline:none;font-family:inherit;';
    const labelCss = 'font-size:12px;color:' + sub + ';margin:14px 0 6px;text-transform:uppercase;letter-spacing:.4px;';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:17px;font-weight:600;margin-bottom:6px;';

    const langLabel = document.createElement('div');
    langLabel.style.cssText = labelCss;
    const langSelect = document.createElement('select');
    langSelect.style.cssText = fieldCss + 'cursor:pointer;';
    const langPref = getLangPref();

    const help = document.createElement('div');
    help.style.cssText = 'font-size:13px;line-height:1.45;color:' + sub + ';margin-top:14px;';

    const templateLabel = document.createElement('div');
    templateLabel.style.cssText = labelCss;
    const input = document.createElement('input');
    input.type = 'text';
    input.spellcheck = false;
    input.style.cssText = fieldCss;

    const votersRow = document.createElement('label');
    votersRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:14px;font-size:14px;cursor:pointer;';
    const votersCheck = document.createElement('input');
    votersCheck.type = 'checkbox';
    votersCheck.checked = getVotersEnabled();
    votersCheck.style.cssText = 'margin:0;accent-color:' + accent + ';';
    const votersText = document.createElement('span');
    votersRow.appendChild(votersCheck);
    votersRow.appendChild(votersText);

    const votersInput = document.createElement('input');
    votersInput.type = 'text';
    votersInput.spellcheck = false;
    votersInput.style.cssText = fieldCss + 'margin-top:8px;';

    const votersNote = document.createElement('div');
    votersNote.style.cssText = 'font-size:12px;line-height:1.4;color:' + sub + ';margin-top:6px;';

    const previewLabel = document.createElement('div');
    previewLabel.style.cssText = labelCss;
    const preview = document.createElement('pre');
    preview.style.cssText =
      'margin:0;padding:10px 12px;border-radius:8px;background:' + field + ';color:' + fg + ';' +
      'font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;font-family:inherit;min-height:20px;';

    const renderPreview = () => {
      const sample = [
        { label: tt('sampleYes'), n: 7 },
        { label: tt('sampleNo'), n: 2 },
      ];
      const tpl = input.value || tt('defTemplate');
      let text = sample.map((o) => formatOption(tpl, o.n, o.label)).join('\n');
      if (votersCheck.checked) {
        text += '\n\n' + formatVoters(votersInput.value || tt('defVotersTemplate'), 8);
      }
      preview.textContent = text;
      votersInput.disabled = !votersCheck.checked;
      votersInput.style.opacity = votersCheck.checked ? '1' : '.5';
    };

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:20px;';
    const mkBtn = (primary) => {
      const b = document.createElement('button');
      b.style.cssText =
        'padding:9px 18px;border-radius:20px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;' +
        (primary ? 'background:' + accent + ';color:#fff;' : 'background:transparent;color:' + accent + ';');
      return b;
    };
    const reset = mkBtn(false);
    reset.style.marginRight = 'auto';
    const cancel = mkBtn(false);
    const save = mkBtn(true);

    // Testi nella lingua selezionata. I campi che mostrano ancora il modello
    // predefinito passano al predefinito della nuova lingua.
    const renderTexts = (prevT) => {
      title.textContent = tt('setTitle');
      langLabel.textContent = tt('setLang');
      langSelect.textContent = '';
      [['auto', tt('setLangAuto')]]
        .concat(CS_I18N.LANGS.map((code) => [code, CS_I18N.NAMES[code]]))
        .forEach(([value, label]) => {
          const o = document.createElement('option');
          o.value = value;
          o.textContent = label;
          langSelect.appendChild(o);
        });
      CS_I18N.rich(help, tt('setHelp'), { n: '[n]', option: tt('phOption') }, accent);
      templateLabel.textContent = tt('setTemplate');
      votersText.textContent = tt('setVoters');
      votersInput.setAttribute('aria-label', tt('setVotersTplAria'));
      CS_I18N.rich(votersNote, tt('setVotersNote'), { voters: tt('phVoters') }, accent);
      previewLabel.textContent = tt('preview');
      reset.textContent = tt('setReset');
      cancel.textContent = tt('cancel');
      save.textContent = tt('setSave');
      if (!prevT) input.value = getTemplate();
      else if (input.value === prevT('defTemplate')) input.value = tt('defTemplate');
      if (!prevT) votersInput.value = getVotersTemplate();
      else if (votersInput.value === prevT('defVotersTemplate')) votersInput.value = tt('defVotersTemplate');
      renderPreview();
    };
    renderTexts(null);
    langSelect.value = langPref;

    langSelect.addEventListener('change', () => {
      const prevT = tt;
      tt = CS_I18N.make(CS_I18N.resolve(langSelect.value));
      const keep = langSelect.value;
      renderTexts(prevT);
      langSelect.value = keep;
    });
    input.addEventListener('input', renderPreview);
    votersInput.addEventListener('input', renderPreview);
    votersCheck.addEventListener('change', renderPreview);

    reset.addEventListener('click', () => {
      input.value = tt('defTemplate');
      votersCheck.checked = false;
      votersInput.value = tt('defVotersTemplate');
      renderPreview();
    });

    // I tasti si intercettano su window in fase di capture, prima di WhatsApp:
    // Escape in WhatsApp chiuderebbe la chat aperta.
    const onKeyDown = (e) => {
      if (!overlay.contains(e.target)) return;
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') save.click();
    };
    const close = () => {
      window.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
    };
    cancel.addEventListener('click', close);
    save.addEventListener('click', () => {
      // Un modello uguale al predefinito non si salva: così segue la lingua.
      const tpl = input.value.trim();
      const vtpl = votersInput.value.trim();
      store(LANG_KEY, langSelect.value === 'auto' ? null : langSelect.value);
      store(TEMPLATE_KEY, tpl && tpl !== tt('defTemplate') ? tpl : null);
      store(VOTERS_KEY, votersCheck.checked ? '1' : '0');
      store(VOTERS_TEMPLATE_KEY, vtpl && vtpl !== tt('defVotersTemplate') ? vtpl : null);
      t = CS_I18N.make(CS_I18N.resolve(getLangPref()));
      close();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    btnRow.appendChild(reset);
    btnRow.appendChild(cancel);
    btnRow.appendChild(save);
    [title, langLabel, langSelect, help, templateLabel, input, votersRow, votersInput, votersNote, previewLabel, preview, btnRow]
      .forEach((el) => panel.appendChild(el));
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    window.addEventListener('keydown', onKeyDown, true);
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

    const makeItem = (marker, label, iconSvg, onClick) => {
      const it = template.cloneNode(true);
      it.setAttribute('data-cs-item', marker);
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

    const copyItem = makeItem('copy', t('menuCopy'), POLL_ICON_SVG, (iconSpan, labelSpan) => {
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
    });

    const settingsItem = makeItem('settings', t('menuSettings'), GEAR_ICON_SVG, () => {
      closeMenuByClickingOutside(menu);
      openSettings();
    });

    template.insertAdjacentElement('beforebegin', copyItem);
    copyItem.insertAdjacentElement('afterend', settingsItem);
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
