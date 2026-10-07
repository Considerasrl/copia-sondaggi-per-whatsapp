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
