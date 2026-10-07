# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Il progetto è interamente in italiano: commenti, stringhe UI, documentazione e messaggi di commit. Mantieni questa convenzione.

## Collegamenti

- Repository: <https://github.com/Considerasrl/copia-sondaggi-per-whatsapp> (`origin`, branch `main`)
- Estensione pubblicata: <https://chromewebstore.google.com/detail/copia-sondaggi-per-whatsa/okhehibbboeojefajcjcikeehgkijnfk> — item ID `okhehibbboeojefajcjcikeehgkijnfk`

## Cos'è

Estensione Chrome (Manifest V3) + userscript equivalente che aggiungono la voce **"Copia sondaggio"** al menu dei messaggi di WhatsApp Web e copiano negli appunti le opzioni con almeno un voto, una per riga, secondo un modello personalizzabile con i segnaposto `[n]` (voti) e `[opzione]` (etichetta). Default: `x[n] [opzione]`. Opzionalmente aggiunge in fondo, dopo una riga vuota, il numero di **votanti effettivi** (persone distinte) con il modello `[votanti]` (default `Votanti: [votanti]`, disattivato di default).

Fa anche il contrario: la voce **"Sondaggio da testo"** nel menu Allega (+) apre una finestra dove si incolla una lista (una riga per opzione) e compila il modulo "Sondaggio" di WhatsApp; l'invio resta all'utente.

Interfaccia in 5 lingue (it, en, fr, de, es): automatica in base al browser (inglese se non supportata) o scelta nelle impostazioni.

Nessun build system, nessuna dipendenza, nessun test automatico: JavaScript semplice caricato direttamente dal browser.

## Lingue (i18n)

- **`estensione/i18n.js`** definisce `CS_I18N`: dizionario `STRINGS` (stesse chiavi in tutte le lingue), `resolve(pref)` (`'auto'` → `chrome.i18n.getUILanguage()` poi `navigator.languages`, riserva `en`), `make(lang)` → `t(chiave, {variabili})`, `rich()` per i testi con segnaposto in grassetto (senza `innerHTML`), `formatOption`/`formatVoters` e `custom()`.
- È caricato dal content script (`manifest.json` → `js: ["i18n.js", "content.js"]`) e dal popup (`<script src="i18n.js">` prima di `popup.js`); nell'**userscript è copiato verbatim** tra i marcatori `inizio/fine i18n.js` (indentato di due spazi). Ogni modifica a `i18n.js` va ricopiata lì.
- **Nuove stringhe**: aggiungere la chiave in **tutte e 5** le lingue; `t()` ricade sull'italiano se manca, ma è un errore.
- Lingua salvata in `lingua` (estensione) / `considera:copiaSondaggi:lingua` (userscript): `'auto'` o un codice.
- **Segnaposto multilingua**: `[opzione]|[option]|[opción]` e `[votanti]|[voters]|[votants]|[teilnehmer]|[votantes]` sono equivalenti. I modelli **predefiniti non si salvano**: `custom()` tratta come "non personalizzato" anche un valore uguale al predefinito di qualsiasi lingua (la 1.3.0 salvava sempre il predefinito italiano), così segue la lingua attiva.
- `_locales/<lingua>/messages.json` traduce solo nome, descrizione e titolo dell'azione del manifest (`__MSG_extName__` ecc.); `default_locale` è `it`, come la scheda pubblicata. Il `description` di ogni lingua resta sotto i 132 caratteri.
- **WhatsApp può essere in un'altra lingua dell'interfaccia dell'estensione**: il riconoscimento della pagina non deve dipendere dai testi. Si usano icone (`svg title`/`data-icon`: `ic-add` per Allega, `wds-ic-poll` per Sondaggio, `ic-close`/`ic-arrow-back` nel pannello voti), `data-testid` e la struttura; gli aria-label italiani/inglesi restano solo come riserva. Le nostre voci di menu si riconoscono da `data-cs-item` (`copy`, `settings`, `from-text`), non dall'etichetta tradotta.

## Due implementazioni da tenere allineate

Il cuore della logica è **duplicato verbatim** in due file:

- `estensione/content.js` — content script dell'estensione MV3
- `wa-copy-poll.user.js` — userscript Tampermonkey/Violentmonkey (`@grant none`)

Condividono `isPoll`, `extractPoll`, `formatOption`, `formatVoters`, il blocco "Votanti effettivi" (`countVoters` e helper), il blocco "Sondaggio da testo" (`parsePollText`, `openPollFromText`, `fillWhatsAppPoll`, `injectAttachItem`), `copyToClipboard`/`execCopy`, `findOpenMenu`, `closeMenuByClickingOutside`, `injectInto` e i tre agganci (listener `contextmenu`, `MutationObserver`, `click` sul pulsante Allega). **Ogni modifica alla logica va replicata in entrambi** (vedi commit `7dc30f3`, che riallineava i due file).

Differenze intenzionali:

| | Estensione | Userscript |
|---|---|---|
| Persistenza modello | `chrome.storage.local`, chiavi `formato`, `votanti` (bool), `formatoVotanti` | `localStorage`, chiavi `considera:copiaSondaggi:formato`, `…:votanti` (`'1'`/`'0'`), `…:formatoVotanti` |
| Lettura modello | cache in `currentTemplate`, aggiornata da `chrome.storage.onChanged` | letta a ogni uso da `getTemplate()` |
| UI impostazioni | popup dell'estensione (`popup.html` + `popup.js`, `action.default_popup`) | modale iniettata nella pagina (`openSettings()`) + voce di menu **"Formato copia"** con icona ingranaggio |

`popup.js` e `content.js` ridefiniscono ciascuno `TEMPLATE_KEY`, `DEFAULT_TEMPLATE`, `formatOption` e gli equivalenti per i votanti (`VOTERS_KEY`, `VOTERS_TEMPLATE_KEY`, `DEFAULT_VOTERS_TEMPLATE`, `formatVoters`): MV3 non condivide moduli tra popup e content script, quindi questi valori vanno cambiati in coppia.

## Come funziona l'aggancio al DOM di WhatsApp Web

WhatsApp Web non espone API né classi stabili, quindi il codice si appoggia solo a segnali resistenti ai restyling:

- **Riconoscimento bolla**: `closest('[data-id]')` catturato in fase di capture su `pointerdown`/`contextmenu` e memorizzato in `lastBubble` (il menu può aprirsi dopo che l'evento è finito).
- **Riconoscimento sondaggio** (`isPoll`): `[data-testid="poll-bubble"]` nella bolla (indipendente dalla lingua); la regex sul testo (`visualizza voti|view votes|seleziona …`) resta come riserva.
- **Estrazione opzioni** (`extractPoll`): legge `innerText` della bolla e accoppia ogni riga non numerica con la riga numerica immediatamente successiva; tiene solo i voti `> 0`. Titolo, "Seleziona…", orario e footer non sono seguiti da un numero, quindi si scartano da soli. Il testo viene ricalcolato **al click**, non all'iniezione, per avere i voti aggiornati.
- **Iniezione voce** (`injectInto`): clona una `[role="menuitem"]` esistente (preferendo quella con `aria-label` "Copia") per ereditare stili e struttura, sostituisce icona (`span[aria-hidden="true"]`) ed etichetta (`span:not([aria-hidden])`). L'idempotenza è data dal controllo `[data-cs-item="copy"]`, non da un flag: WhatsApp riusa lo stesso nodo menu rigenerandone le voci.
- **Due agganci** perché i menu si aprono in due modi diversi: polling con `requestAnimationFrame` (max 60 tentativi) dopo `contextmenu`, e `MutationObserver` su `document.body` per i menu montati da zero (freccia/chevron).
- **Chiusura menu** (`closeMenuByClickingOutside`): sintetizza `pointerdown`/`mousedown`/`mouseup`/`click` su un punto appena fuori dal menu, perché non c'è API per chiuderlo.
- **Votanti effettivi** (`countVoters`): con risposta singola = somma dei voti. Con scelta multipla (icona `data-icon^="multi-select"`) la bolla non contiene i nomi: si clicca `[data-testid="poll-view-votes"]`, si legge il pannello `poll-details-drawer` (opzioni `poll-details-option-N`, righe `list-item-N`, identità = `cell-frame-title` + `cell-frame-primary-detail`, quest'ultimo è il numero per i contatti non salvati), si entra in "Mostra tutti" per le liste troncate (vista dedicata con "Indietro"), poi si chiude con "Chiudi". Usare `textContent`, **non** `innerText`: le righe fuori vista hanno `innerText` vuoto. Se i nomi letti per un'opzione sono meno dei voti, restituisce `null` e la voce mostra "Copiato (senza votanti)". La copia avviene due volte: subito (solo opzioni, dentro il gesto) e dopo il conteggio (~1 s, ancora entro l'attivazione utente).
- **Sondaggio da testo** (`injectAttachItem` → `openPollFromText` → `fillWhatsAppPoll`): la voce si clona da `[role="menuitem"][aria-label="Sondaggio"]` del menu Allega (pulsante `footer [aria-label="Allega"]`, che apre *e chiude* il menu; terzo aggancio: listener `click` in capture su quel pulsante). Il modulo è `poll-creation-modal` con editor Lexical `poll-question-input` e `poll-option-input-N` (il campo N+1 compare dopo aver riempito N); si scrive con `focus` + `selectAllChildren` + `execCommand('insertText')`, assegnare il valore non basta. Limiti verificati: 12 opzioni, 100 caratteri per opzione, 255 per la domanda (contati per code point: un'emoji = 1); oltre il limite WhatsApp **rifiuta l'intero inserimento** invece di troncare, e i duplicati esatti (case-sensitive) disattivano Invia — per questo `pollTextProblems` li controlla prima. "Consenti più risposte" è `#polls-single-option-switch`. In `injectInto` il menu Allega va escluso (`findPollMenuItem(menu)`), altrimenti `lastBubble` farebbe comparire "Copia sondaggio" anche lì.
- **Focus e tastiera nella finestra "Sondaggio da testo"**: chiudendo il menu Allega WhatsApp rimette il focus sulla casella del messaggio e i tasti finirebbero lì; la guardia `focusin` lo riporta dentro **solo nel primo secondo, al massimo 3 volte, in modo asincrono** — una guardia sincrona e permanente entra in un rimpallo infinito con WhatsApp e blocca la scheda (successo in test). I tasti si intercettano su `window` in capture: **Escape in WhatsApp chiude la chat aperta**, quindi va fermato prima.
- **Clipboard**: `document.execCommand('copy')` su una textarea nascosta **per primo** (sincrono, affidabile dentro il gesto di click), `navigator.clipboard.writeText` solo come ripiego — la Permissions-Policy di WhatsApp Web può bloccare l'API asincrona. Questo evita anche di dichiarare il permesso `clipboardWrite`.

Se un aggiornamento di WhatsApp Web rompe qualcosa, il punto da rivedere è quasi sempre `isPoll` o `extractPoll`, non i selettori di menu. Il conteggio votanti invece dipende dai `data-testid` del pannello "Dettagli sondaggio": se smette di funzionare, la copia delle opzioni resta intatta.

## Rilascio

Non c'è script di build (la GitHub Action di release è stata rimossa in `5750ef3`). Il pacchetto per lo store si genera a mano:

```bash
cd estensione
rm -f copia-sondaggi-web.zip
zip -r copia-sondaggi-web.zip manifest.json i18n.js content.js popup.html popup.js _locales/ icons/
```

Lo zip contiene **solo** questi file: niente `STORE.md`, `descrizione.md`, `privacy.html`, screenshot o PNG di marketing. È in `.gitignore`.

Bump di versione in due punti indipendenti, da tenere coerenti:
- `estensione/manifest.json` → `"version"`
- `wa-copy-poll.user.js` → `@version` (Tampermonkey aggiorna solo se il numero **cresce**)

## Vincoli Chrome Web Store

Documentati in `estensione/STORE.md` (procedura) e `estensione/descrizione.md` (testi della scheda). I due che condizionano il codice:

- **Permessi minimi**: il manifest dichiara solo `storage` e gira solo su `https://web.whatsapp.com/*`. Non aggiungere permessi senza necessità reale — è il motivo principale di rifiuto in revisione.
- **Marchi**: non usare logo o branding Meta nei materiali. Nota: `STORE.md` sconsiglia "WhatsApp" nel nome, ma la versione **effettivamente pubblicata e approvata** si chiama "Copia sondaggi per WhatsApp Web" (come in `manifest.json` e nello slug dello store) — non "correggere" il nome del manifest per allinearlo a `STORE.md`, che su questo punto è superato. Resta il disclaimer di non affiliazione in README e `descrizione.md`. Il `description` del manifest ha un limite di 132 caratteri (vedi `7adf193`).
- **Privacy**: la scheda dichiara zero raccolta dati. Qualsiasi chiamata di rete o telemetria renderebbe falsa quella dichiarazione e `estensione/privacy.html`.

## Test

Manuale, su `web.whatsapp.com` con un messaggio sondaggio reale:

1. `chrome://extensions` → Modalità sviluppatore → **Carica estensione non pacchettizzata** → cartella `estensione/`
2. Dopo ogni modifica: **↻ Aggiorna** sulla scheda dell'estensione, poi ricarica la scheda di WhatsApp Web
3. Verificare entrambi i percorsi di apertura menu (tasto destro **e** freccia sulla bolla) e le opzioni con 0 voti (escluse) — l'etichetta diventa "Copiato!" oppure "Nessun voto"
4. Con "Aggiungi il numero di votanti" attivo: un sondaggio a scelta multipla con un'opzione che mostra "Mostra tutti" (più di 5 votanti) — il pannello si apre e si richiude da solo e la riga `Votanti: N` conta le persone una volta sola
5. "Sondaggio da testo" nella chat con sé stessi (nessun rischio di invio per errore): digitando, il testo resta nella finestra; Escape chiude solo la finestra; il modulo di WhatsApp risulta compilato e si chiude con "Chiudi" → "Abbandona" senza inviare
6. Lingue: nel popup provare "Automatica" e almeno una lingua diversa dall'italiano — le voci di menu, la finestra "Sondaggio da testo" e i messaggi cambiano lingua senza ricaricare WhatsApp; con WhatsApp stesso in un'altra lingua (Impostazioni → Lingua di WhatsApp) le voci devono comparire comunque

Per l'userscript: reinstallare dal file locale nel gestore (Tampermonkey/Violentmonkey).

## README

`README.md` (italiano) e `README.en.md` (inglese) sono traduzioni l'uno dell'altro, con switch di lingua in testa: vanno aggiornati insieme. Le icone browser sono SVG locali in `docs/icons/` (non hotlink, vedi `ded7b65`).
