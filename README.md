# Copia sondaggi per WhatsApp Web

![Copia sondaggi per WhatsApp Web](estensione/store-1280x800.png)

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

Ci sono due modi per usare l'estensione. Fanno esattamente la stessa cosa: scegli quello più comodo per te.

### Modalità A — Estensione Chrome (cartella `estensione/`)

![Chrome](https://img.shields.io/badge/Chrome-4285F4?logo=googlechrome&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-0078D7?logo=microsoftedge&logoColor=white)
![Brave](https://img.shields.io/badge/Brave-FB542B?logo=brave&logoColor=white)

È l'estensione vera e propria, caricata da Chrome in "modalità sviluppatore". Consigliata se usi Chrome/Edge/Brave e vuoi qualcosa di stabile che resta installato.

1. Scarica il progetto: pulsante verde **Code › Download ZIP** in cima alla pagina GitHub, poi estrai lo ZIP (oppure `git clone` del repository).
2. Apri il browser su `chrome://extensions` (su Edge: `edge://extensions`, su Brave: `brave://extensions`).
3. Attiva l'interruttore **Modalità sviluppatore** (in alto a destra).
4. Clicca **Carica estensione non pacchettizzata** e seleziona la cartella **`estensione/`** (quella che contiene `manifest.json`).
5. Fatto: apri `web.whatsapp.com` e trovi la voce **"Copia sondaggio"** nel menu dei messaggi con sondaggio.

> Nota: la "modalità sviluppatore" è necessaria perché l'estensione non è (ancora) pubblicata sul Chrome Web Store. Non cancellare la cartella dopo l'installazione: Chrome la carica da lì a ogni avvio. Per aggiornare, sostituisci i file e clicca l'icona **↻ Aggiorna** sulla scheda dell'estensione.

### Modalità B — Userscript (`wa-copy-poll.user.js`)

![Firefox](https://img.shields.io/badge/Firefox-FF7139?logo=firefoxbrowser&logoColor=white)
![Chrome](https://img.shields.io/badge/Chrome-4285F4?logo=googlechrome&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-0078D7?logo=microsoftedge&logoColor=white)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-00485B?logo=tampermonkey&logoColor=white)
![Violentmonkey](https://img.shields.io/badge/Violentmonkey-663399?logo=violentmonkey&logoColor=white)

Stessa funzionalità in un unico file, gestito da un'estensione "gestore di userscript" come **Tampermonkey** o **Violentmonkey**. Consigliata se già usi Tampermonkey o vuoi installare/aggiornare con un clic, anche su Firefox.

1. Installa **[Tampermonkey](https://www.tampermonkey.net/)** (o Violentmonkey) dal web store del tuo browser.
2. Apri il file [`wa-copy-poll.user.js`](wa-copy-poll.user.js) in versione **raw**: sulla pagina GitHub del file, clicca il pulsante **Raw**.
3. Tampermonkey riconosce lo userscript e apre la schermata di installazione: clicca **Installa**.
4. Fatto: apri `web.whatsapp.com` e trovi la voce **"Copia sondaggio"** nel menu.

> Nota: gli aggiornamenti automatici di Tampermonkey scattano quando il numero di `@version` **cresce**. Per aggiornare manualmente, reinstalla dal link Raw.

### Quale scegliere?

| | Estensione (Modalità A) | Userscript (Modalità B) |
|---|---|---|
| Installazione | carichi una cartella | un clic sul file Raw |
| Serve un'app in più | no | sì (Tampermonkey/Violentmonkey) |
| Browser | ![Chrome](https://img.shields.io/badge/-4285F4?logo=googlechrome&logoColor=white) ![Edge](https://img.shields.io/badge/-0078D7?logo=microsoftedge&logoColor=white) ![Brave](https://img.shields.io/badge/-FB542B?logo=brave&logoColor=white) | ![Firefox](https://img.shields.io/badge/-FF7139?logo=firefoxbrowser&logoColor=white) ![Chrome](https://img.shields.io/badge/-4285F4?logo=googlechrome&logoColor=white) ![Edge](https://img.shields.io/badge/-0078D7?logo=microsoftedge&logoColor=white) |
| Aggiornamento | ↻ manuale | automatico (se la versione cresce) |

In entrambi i casi il codice è lo stesso e nessun dato viene raccolto o inviato: tutto resta in locale nel browser.

---

Estensione indipendente, non affiliata né approvata da WhatsApp o Meta. "WhatsApp" è un marchio dei rispettivi proprietari.
