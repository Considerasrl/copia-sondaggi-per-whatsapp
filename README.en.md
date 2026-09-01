# Copy Polls for WhatsApp Web

[🇮🇹 Italiano](README.md) · **🇬🇧 English**

![Copy Polls for WhatsApp Web](estensione/store-1280x800.png)

[![Available in the Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/copia-sondaggi-per-whatsa/okhehibbboeojefajcjcikeehgkijnfk)

Chrome extension that adds a **"Copy poll"** entry to the message menu on [WhatsApp Web](https://web.whatsapp.com).
With one click it copies the poll's voted options to the clipboard in the format `x{votes} option`, one per line — ready to paste into a note, a spreadsheet or a chat. The format is **customizable**.

## How to use

1. Open `web.whatsapp.com`
2. Open the menu (right‑click or the chevron) on a message with a poll
3. Choose **"Copy poll"**
4. Paste wherever you want

Example output:

```
x8 Option A
x4 Option B
x3 Option C
```

## Customizable format

You can decide how each option is written, using two placeholders:

- `[n]` — the number of votes
- `[opzione]` — the option's label

**Extension:** click the **extension icon** in the browser toolbar → a small popup opens with the template field, a live preview and Save / Reset buttons. (If you don't see the icon, open it from the extensions menu 🧩 and pin it.)

**Userscript:** open the poll menu (right‑click) and choose the **"Copy format"** entry (gear icon).

The default format is `x[n] [opzione]`. A **live preview** and a **Reset** button (back to the default) are provided. A few examples:

| Template | Result |
|---|---|
| `x[n] [opzione]` | `x8 Option A` |
| `[opzione]: [n] votes` | `Option A: 8 votes` |
| `[n] × [opzione]` | `8 × Option A` |

> Note: the placeholder is `[opzione]` (Italian) in both languages, so the same saved template works across versions.

The setting is stored locally in your browser (via `chrome.storage` in the extension, in the page's `localStorage` for the userscript).

## Features

- Copies only the options with at least one vote, keeping the poll's order
- Customizable copy format with the `[n]` and `[opzione]` placeholders
- Works out of the box with a sensible default format
- Does not collect, store or transmit any data — everything happens locally in your browser

## Project structure

- `estensione/` — Chrome extension (`manifest.json`, `content.js`, icons, store assets)
- `wa-copy-poll.user.js` — userscript version (Tampermonkey/Violentmonkey)

## Installation

Pick whatever is most convenient — they all do exactly the same thing. For most users that's **Option A**.

### Option A — Chrome Web Store (recommended) ⭐

<img src="docs/icons/chrome.svg" height="24" alt="Chrome" title="Chrome">&nbsp;
<img src="docs/icons/edge.svg" height="24" alt="Microsoft Edge" title="Microsoft Edge">&nbsp;
<img src="docs/icons/brave.svg" height="24" alt="Brave" title="Brave">

Official one‑click install with automatic updates. Works on Chrome and any Chromium‑based browser (Edge, Brave, Dia, etc.).

1. Open the store page: **[Copy Polls for WhatsApp Web](https://chromewebstore.google.com/detail/copia-sondaggi-per-whatsa/okhehibbboeojefajcjcikeehgkijnfk)**
2. Click **Add** (or **Install**) and confirm.
3. Done: open `web.whatsapp.com` and you'll find the **"Copy poll"** entry in the menu of messages with a poll.

> On Chromium browsers other than Chrome (Edge, Brave, Dia…) the store page opens from the same link: allow installing extensions from the Chrome Web Store and click **Add**.

### Option B — Load the `estensione/` folder (developers)

<img src="docs/icons/chrome.svg" height="24" alt="Chrome" title="Chrome">&nbsp;
<img src="docs/icons/edge.svg" height="24" alt="Microsoft Edge" title="Microsoft Edge">&nbsp;
<img src="docs/icons/brave.svg" height="24" alt="Brave" title="Brave">

The extension loaded "unpacked" straight from the sources. Handy to try the latest changes before they reach the store, or to develop.

1. Download the project: green **Code › Download ZIP** button at the top of the GitHub page, then extract the ZIP (or `git clone` the repository).
2. Open your browser at `chrome://extensions` (on Edge: `edge://extensions`, on Brave: `brave://extensions`).
3. Turn on the **Developer mode** toggle (top‑right).
4. Click **Load unpacked** and select the **`estensione/`** folder (the one containing `manifest.json`).
5. Done: open `web.whatsapp.com` and you'll find the **"Copy poll"** entry in the menu.

> Note: don't delete the folder after installing — Chrome loads it from there on every startup. To update, replace the files and click the **↻ Reload** icon on the extension card.

### Option C — Userscript (`wa-copy-poll.user.js`)

<img src="docs/icons/firefox.svg" height="24" alt="Firefox" title="Firefox">&nbsp;
<img src="docs/icons/chrome.svg" height="24" alt="Chrome" title="Chrome">&nbsp;
<img src="docs/icons/edge.svg" height="24" alt="Microsoft Edge" title="Microsoft Edge">
&nbsp;&nbsp;·&nbsp;&nbsp;
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-00485B?logo=tampermonkey&logoColor=white)
![Violentmonkey](https://img.shields.io/badge/Violentmonkey-663399)

The same functionality in a single file, managed by a "userscript manager" extension such as **Tampermonkey** or **Violentmonkey**. Recommended if you already use Tampermonkey or want one‑click install/updates, including on Firefox.

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** (or Violentmonkey) from your browser's web store.
2. Open the [`wa-copy-poll.user.js`](wa-copy-poll.user.js) file in **raw** view: on the file's GitHub page, click the **Raw** button.
3. Tampermonkey recognizes the userscript and opens the install screen: click **Install**.
4. Done: open `web.whatsapp.com` and you'll find the **"Copy poll"** entry in the menu.

> Note: Tampermonkey's automatic updates kick in when the `@version` number **increases**. To update manually, reinstall from the Raw link.

### Which one to choose?

| | A · Web Store | B · Folder | C · Userscript |
|---|---|---|---|
| For whom | everyone | developers | Tampermonkey users |
| Install | one click | load a folder | one click on the Raw file |
| Needs an extra app | no | no | yes (Tampermonkey/Violentmonkey) |
| Browser | <img src="docs/icons/chrome.svg" height="18" alt="Chrome" title="Chrome"> <img src="docs/icons/edge.svg" height="18" alt="Edge" title="Microsoft Edge"> <img src="docs/icons/brave.svg" height="18" alt="Brave" title="Brave"> | <img src="docs/icons/chrome.svg" height="18" alt="Chrome" title="Chrome"> <img src="docs/icons/edge.svg" height="18" alt="Edge" title="Microsoft Edge"> <img src="docs/icons/brave.svg" height="18" alt="Brave" title="Brave"> | <img src="docs/icons/firefox.svg" height="18" alt="Firefox" title="Firefox"> <img src="docs/icons/chrome.svg" height="18" alt="Chrome" title="Chrome"> <img src="docs/icons/edge.svg" height="18" alt="Edge" title="Microsoft Edge"> |
| Updates | automatic | ↻ manual | automatic (when the version increases) |

In every case the code is the same and no data is collected or sent: everything stays local in your browser.

---

Independent extension, not affiliated with or endorsed by WhatsApp or Meta. "WhatsApp" is a trademark of its respective owners.
