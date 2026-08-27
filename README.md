# Copia sondaggi per WhatsApp Web

![Copia sondaggi per WhatsApp Web](estensione/store-1280x800.png)

[![Disponibile sul Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Installa-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/copia-sondaggi-per-whatsa/okhehibbboeojefajcjcikeehgkijnfk)

Estensione Chrome che aggiunge la voce **"Copia sondaggio"** al menu dei messaggi di [WhatsApp Web](https://web.whatsapp.com).
Con un clic copia negli appunti le opzioni votate del sondaggio nel formato `x{voti} opzione`, una per riga — pronte da incollare in una nota, un foglio o una chat.

## Come si usa

1. Apri `web.whatsapp.com`
2. Apri il menu (tasto destro o freccia) su un messaggio con sondaggio
3. Scegli **"Copia sondaggio"**
4. Incolla dove vuoi

Esempio di risultato:

```
x8 Opzione A
x4 Opzione B
x3 Opzione C
```

## Caratteristiche

- Copia solo le opzioni con almeno un voto, mantenendo l'ordine del sondaggio
- Nessuna configurazione: funziona subito
- Non raccoglie, memorizza o trasmette alcun dato — tutto avviene in locale nel browser

## Struttura del progetto

- `estensione/` — estensione Chrome (`manifest.json`, `content.js`, icone, materiali per lo store)
- `wa-copy-poll.user.js` — versione userscript (Tampermonkey/Violentmonkey)

## Installazione

Scegli il modo più comodo per te — fanno esattamente la stessa cosa. Per la maggior parte degli utenti è la **Modalità A**.

### Modalità A — Chrome Web Store (consigliata) ⭐

<img src="docs/icons/chrome.svg" height="24" alt="Chrome" title="Chrome">&nbsp;
<img src="docs/icons/edge.svg" height="24" alt="Microsoft Edge" title="Microsoft Edge">&nbsp;
<img src="docs/icons/brave.svg" height="24" alt="Brave" title="Brave">

Installazione ufficiale con un clic, con aggiornamenti automatici. Funziona su Chrome e su qualsiasi browser basato su Chromium (Edge, Brave, Dia, ecc.).

1. Apri la pagina dello store: **[Copia sondaggi per WhatsApp Web](https://chromewebstore.google.com/detail/copia-sondaggi-per-whatsa/okhehibbboeojefajcjcikeehgkijnfk)**
2. Clicca **Aggiungi** (o **Installa**) e conferma.
3. Fatto: apri `web.whatsapp.com` e trovi la voce **"Copia sondaggio"** nel menu dei messaggi con sondaggio.

> Su browser Chromium diversi da Chrome (Edge, Brave, Dia…) la pagina dello store si apre allo stesso link: accetta l'installazione di estensioni dal Chrome Web Store e clicca **Aggiungi**.

### Modalità B — Carica la cartella `estensione/` (sviluppatori)

<img src="docs/icons/chrome.svg" height="24" alt="Chrome" title="Chrome">&nbsp;
<img src="docs/icons/edge.svg" height="24" alt="Microsoft Edge" title="Microsoft Edge">&nbsp;
<img src="docs/icons/brave.svg" height="24" alt="Brave" title="Brave">

L'estensione caricata "non pacchettizzata" direttamente dai sorgenti. Utile per provare le ultime modifiche prima che arrivino sullo store, o per sviluppare.

1. Scarica il progetto: pulsante verde **Code › Download ZIP** in cima alla pagina GitHub, poi estrai lo ZIP (oppure `git clone` del repository).
2. Apri il browser su `chrome://extensions` (su Edge: `edge://extensions`, su Brave: `brave://extensions`).
3. Attiva l'interruttore **Modalità sviluppatore** (in alto a destra).
4. Clicca **Carica estensione non pacchettizzata** e seleziona la cartella **`estensione/`** (quella che contiene `manifest.json`).
5. Fatto: apri `web.whatsapp.com` e trovi la voce **"Copia sondaggio"** nel menu.

> Nota: non cancellare la cartella dopo l'installazione — Chrome la carica da lì a ogni avvio. Per aggiornare, sostituisci i file e clicca l'icona **↻ Aggiorna** sulla scheda dell'estensione.

### Modalità C — Userscript (`wa-copy-poll.user.js`)

<img src="docs/icons/firefox.svg" height="24" alt="Firefox" title="Firefox">&nbsp;
<img src="docs/icons/chrome.svg" height="24" alt="Chrome" title="Chrome">&nbsp;
<img src="docs/icons/edge.svg" height="24" alt="Microsoft Edge" title="Microsoft Edge">
&nbsp;&nbsp;·&nbsp;&nbsp;
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-00485B?logo=tampermonkey&logoColor=white)
![Violentmonkey](https://img.shields.io/badge/Violentmonkey-663399)

Stessa funzionalità in un unico file, gestito da un'estensione "gestore di userscript" come **Tampermonkey** o **Violentmonkey**. Consigliata se già usi Tampermonkey o vuoi installare/aggiornare con un clic, anche su Firefox.

1. Installa **[Tampermonkey](https://www.tampermonkey.net/)** (o Violentmonkey) dal web store del tuo browser.
2. Apri il file [`wa-copy-poll.user.js`](wa-copy-poll.user.js) in versione **raw**: sulla pagina GitHub del file, clicca il pulsante **Raw**.
3. Tampermonkey riconosce lo userscript e apre la schermata di installazione: clicca **Installa**.
4. Fatto: apri `web.whatsapp.com` e trovi la voce **"Copia sondaggio"** nel menu.

> Nota: gli aggiornamenti automatici di Tampermonkey scattano quando il numero di `@version` **cresce**. Per aggiornare manualmente, reinstalla dal link Raw.

### Quale scegliere?

| | A · Web Store | B · Cartella | C · Userscript |
|---|---|---|---|
| Per chi | tutti | sviluppatori | chi usa Tampermonkey |
| Installazione | un clic | carichi una cartella | un clic sul file Raw |
| Serve un'app in più | no | no | sì (Tampermonkey/Violentmonkey) |
| Browser | <img src="docs/icons/chrome.svg" height="18" alt="Chrome" title="Chrome"> <img src="docs/icons/edge.svg" height="18" alt="Edge" title="Microsoft Edge"> <img src="docs/icons/brave.svg" height="18" alt="Brave" title="Brave"> | <img src="docs/icons/chrome.svg" height="18" alt="Chrome" title="Chrome"> <img src="docs/icons/edge.svg" height="18" alt="Edge" title="Microsoft Edge"> <img src="docs/icons/brave.svg" height="18" alt="Brave" title="Brave"> | <img src="docs/icons/firefox.svg" height="18" alt="Firefox" title="Firefox"> <img src="docs/icons/chrome.svg" height="18" alt="Chrome" title="Chrome"> <img src="docs/icons/edge.svg" height="18" alt="Edge" title="Microsoft Edge"> |
| Aggiornamento | automatico | ↻ manuale | automatico (se la versione cresce) |

In entrambi i casi il codice è lo stesso e nessun dato viene raccolto o inviato: tutto resta in locale nel browser.

---

Estensione indipendente, non affiliata né approvata da WhatsApp o Meta. "WhatsApp" è un marchio dei rispettivi proprietari.
