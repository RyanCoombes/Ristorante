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

### Chiudere gli ordini

Fuori dagli orari scritti in `data/config.js` gli ordini online si chiudono da soli: il menu resta visibile ma senza pulsanti "Aggiungi". Per chiuderli subito (forno pieno, serata privata) metti `ordersOpen: false` e salva; rimetti `true` per riaprire.

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
- **Stop orders now:** set `ordersOpen: false` in `data/config.js`. Outside opening hours orders close on their own.
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
