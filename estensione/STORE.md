# Pubblicazione su Chrome Web Store — "Copia sondaggi per Web"

## 0. Account
- Dashboard: https://chrome.google.com/webstore/devconsole
- Registrazione **separata** da Google Play: **5 USD** una tantum, **2FA** attiva sull'account Google.
- Puoi usare l'account/brand **Considera** (stessa email Google va bene). La verifica org di Play NON si trasferisce: la CWS ha la sua verifica publisher (più leggera).

## 1. Cosa carichi
Il file **`copia-sondaggi-web.zip`** (già generato in questa cartella) che contiene:
- `manifest.json` (Manifest V3)
- `content.js`
- `icons/` (16, 48, 128 px)

> Non includere STORE.md / README.md nello zip: non servono e non devono finire nel pacchetto.

## 2. Scheda dello store (campi)
- **Nome**: Copia sondaggi per Web
  - ⚠️ NON usare "WhatsApp" nel nome né logo/branding Meta → rischio rifiuto per marchio.
- **Descrizione breve**: Copia le opzioni votate di un sondaggio come testo, dal menu del messaggio.
- **Descrizione lunga** (esempio):
  > Aggiunge la voce "Copia sondaggio" al menu dei messaggi su web.whatsapp.com.
  > Con un click copia le opzioni con almeno un voto nel formato "x{voti} opzione",
  > una per riga — comodo per riepiloghi e ordini. Nessun dato viene raccolto o inviato.
- **Categoria**: Produttività
- **Lingua**: Italiano
- **Icona**: `icons/icon128.png`
- **Screenshot**: almeno 1, formato **1280×800** o **640×400** (PNG/JPEG).
  Suggerito: uno screenshot del menu con la voce "Copia sondaggio" e uno del testo copiato.

## 3. Privacy / Data usage (nel dashboard)
- **Raccolta dati**: NESSUNA. Dichiara che non raccogli né trasmetti dati utente.
- **Permessi**: l'estensione **non richiede permessi** e gira solo su `https://web.whatsapp.com/*`.
  - Giustificazione host: "Il content script serve solo su web.whatsapp.com per aggiungere
    la voce di menu e leggere il testo del sondaggio nella pagina; nessun dato lascia il browser."
- **Privacy policy URL**: non obbligatoria (nessun dato personale trattato). Se il form la richiede,
  basta una pagina che dichiari "questa estensione non raccoglie, memorizza o trasmette alcun dato".

## 4. Visibilità
- **Public**: cercabile da tutti.
- **Unlisted**: accessibile solo con link (buono per uso interno/limitato).
- **Private**: solo utenti/organizzazione specifici.

## 5. Revisione
- Manuale, di solito da poche ore a qualche giorno.
- Le grane tipiche: permessi eccessivi (qui zero) e marchi (evita "WhatsApp"/logo).

## Note tecniche
- Clipboard: `navigator.clipboard.writeText` dentro il gesto di click, con fallback `execCommand`.
  Nessun permesso `clipboardWrite` dichiarato → revisione più semplice.
- Il codice usa solo ruoli/attributi stabili (`role="menu"`, `role="menuitem"`, `data-id`) e il
  testo visibile del sondaggio, quindi è robusto agli aggiornamenti di layout.
