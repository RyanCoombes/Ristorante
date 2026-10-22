# Vizi Capitali · Pizza & Co

Sito web della pizzeria **Vizi Capitali**, in italiano e inglese, con menu, contatti, orari, mappa e ordini via WhatsApp.
Website for the **Vizi Capitali** pizzeria, in Italian and English, with menu, contacts, opening hours, map and WhatsApp ordering.

È un sito statico: niente database, niente server, niente installazioni.
It is a static site: no database, no server, nothing to install.

---

## 🇮🇹 Come aggiornare il sito

Tutto quello che cambia di solito si trova nella cartella `data/`. Si apre il file con un editor di testo qualsiasi (anche direttamente su GitHub, con l'icona della matita ✏️) e si salva.

| Cosa vuoi cambiare | File |
| --- | --- |
| Piatti, prezzi, descrizioni, piatti esauriti | `data/menu.js` |
| Numero WhatsApp, telefono, email, Instagram, indirizzo, orari, consegna, chi siamo | `data/config.js` |
| Testi del sito (titoli, pulsanti…) in italiano e inglese | `data/i18n.js` |

### Menu (`data/menu.js`)

Ogni piatto è un blocco così:

```js
{
  id: "margherita",                 // codice unico, senza spazi
  name: "Margherita",
  desc: {
    it: "Pomodoro, fior di latte, basilico, olio EVO.",
    en: "Tomato, fior di latte, basil, extra-virgin olive oil."
  },
  price: 7.0,                        // usa il punto: 7.50, non 7,50
  tags: ["veg"],                     // "veg", "piccante", "novita", "top"
  available: true                    // false = mostrato come "Esaurito"
},
```

- **Aggiungere un piatto:** copia un blocco, incollalo sotto, cambia i valori. Attenzione alle virgole tra i blocchi.
- **Togliere un piatto:** cancella il suo blocco.
- **Piatto finito per oggi:** metti `available: false`.
- **Nuova categoria:** copia un'intera categoria (`id`, `title`, `items`).

### WhatsApp

In `data/config.js`, `whatsapp` va scritto **solo con le cifre**, con il prefisso internazionale e senza `+` né spazi: `+39 333 123 4567` → `"393331234567"`.

Quando un cliente invia l'ordine, si apre WhatsApp con un messaggio già pronto (piatti, quantità, totale, nome, ritiro/consegna, indirizzo, orario, note). L'ordine **non** è automatico: arriva come normale messaggio in chat e va confermato rispondendo.

### Ordini: orari, chiusura, attesa (`data/config.js` → `ordering`)

- `open: false` chiude gli ordini online subito (forno pieno, serata privata). `true` per riaprire.
- Fuori orario gli ordini si chiudono da soli. `startBeforeOpenMin` = quanti minuti prima dell'apertura si accettano già ordini; `stopBeforeCloseMin` = quanti minuti prima della chiusura si smette.
- `prepMinutes` = tempo medio di preparazione. `busyExtraMinutes` = minuti in più nelle serate piene (es. 15). Il cliente vede "attesa ~20 min" e sceglie un orario tra quelli possibili.

### Consegna (`delivery`)

Fasce di distanza dal locale, in linea d'aria: per ognuna `upToKm`, costo (`fee`), ordine minimo (`minOrder`) e minuti in più (`extraMinutes`). Oltre l'ultima fascia non si consegna. Inserite le coordinate vere del locale in `shopLocation`.

Il cliente preme "Verifica indirizzo" (ricerca gratuita OpenStreetMap) oppure "Usa la mia posizione" (GPS del telefono). Se l'indirizzo non si trova, l'ordine arriva con "Distanza: da verificare". Nel messaggio c'è anche il link Google Maps per il fattorino.

### Codici sconto (`promoCodes`)

`type`: `"percent"` (percentuale), `"fixed"` (euro), `"freeDelivery"` (consegna gratis). `minOrder` = spesa minima, `validUntil` = ultimo giorno ("" = senza scadenza). I codici sono visibili a chi legge il codice del sito: usateli per promozioni pubbliche e controllate lo sconto sull'ordine.

### Allergeni, icone e foto (`data/menu.js`)

Per ogni piatto: `allergens` (i 14 allergeni UE: `"glutine"`, `"latte"`, `"uova"`…), `tags` con `"veg"` o `"vegan"` per le icone, `image` per la foto (quadrata, in `assets/img/menu/`). ⚠️ Gli allergeni inseriti ora sono esempi: vanno controllati piatto per piatto.

### La squadra

In `data/config.js`, sezione `team`: per ogni persona nome, ruolo, una frase e la foto (`photo`). Le foto vanno nella cartella `assets/img/team/`, in verticale (4:5). Senza foto si vede la mascotte.

### Controllare le modifiche

Dopo aver salvato, apri `index.html` nel browser (doppio clic) e ricarica la pagina. Se il menu sparisce, quasi sempre manca una virgola o una virgoletta nel file che hai modificato.

---

## 🇬🇧 How to update the site

Everything you normally change lives in the `data/` folder. Open the file in any text editor (or straight on GitHub with the pencil ✏️ icon) and save.

| What you want to change | File |
| --- | --- |
| Dishes, prices, descriptions, sold-out items | `data/menu.js` |
| WhatsApp number, phone, email, Instagram, address, hours, delivery, team | `data/config.js` |
| Site text (headings, buttons…) in Italian and English | `data/i18n.js` |

- **Add a dish:** copy a `{ … }` block, paste it below, change the values. Mind the commas between blocks.
- **Sold out today:** set `available: false`.
- **Prices:** use a dot for decimals (`7.50`).
- **WhatsApp number:** digits only, with country code, no `+` or spaces.
- **Stop orders now:** `ordering.open: false` in `data/config.js`. Outside opening hours orders close on their own; `startBeforeOpenMin` / `stopBeforeCloseMin` set the cut-offs.
- **Waiting times:** `prepMinutes`, plus `busyExtraMinutes` on busy nights. Customers pick from the times that are actually possible.
- **Delivery area:** distance rings from `shopLocation` (straight-line km), each with fee, minimum order and extra minutes. Address check uses OpenStreetMap (free) or the phone's location.
- **Promo codes:** `promoCodes` — percent, fixed amount or free delivery, with minimum spend and expiry. Codes are readable in the site source, so use them for public promotions.
- **Allergens, veg/vegan icons, photos:** `allergens`, `tags`, `image` on each dish in `data/menu.js`. The allergens filled in now are examples and must be checked.
- **Team:** name, role, one line and an optional portrait photo (4:5) per person in `data/config.js` → `team`.

Visitors can switch language with the IT / EN buttons; the choice is remembered. You can also link straight to English with `index.html?lang=en`.

---

## Pubblicazione / Publishing

Any static host works — just upload the whole folder:

- **GitHub Pages:** repository *Settings → Pages → Deploy from branch*, pick the branch and `/ (root)`.
- **Netlify / Vercel / Cloudflare Pages:** drag and drop the folder, or connect the repository (no build command, output directory = root).

Once you have a real domain, change `og:image` in `index.html` to a full URL (e.g. `https://vizicapitali.it/assets/img/logo-badge.png`) so link previews show the logo.

## Struttura / Structure

```
index.html            page layout
data/config.js        business details   ← edit
data/menu.js          menu               ← edit
data/i18n.js          IT / EN text       ← edit
assets/css/style.css  styles (brand colours: #EE1A37 red, #F0E3CC cream)
assets/js/app.js      menu, language switch, basket, WhatsApp message
assets/img/           logos, mascot, photos (from the brand identity book)
```

## Note sul brand / Brand notes

- Colours, logo, mascot, checkerboard and photography come from the *Vizi Capitali* brand identity guidelines.
- The brand book uses the fonts **Obviously** and **Amertha**, which are commercial licences (Amertha's embedded copy is marked *personal use only*). The site uses free Google Fonts lookalikes instead: **Archivo** (expanded, black) and **Yellowtail**. If you buy web licences for the originals, swap them in `assets/css/style.css` (`--font-display`, `--font-script`).
