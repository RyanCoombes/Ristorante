# Vizi Capitali · Pizza & Co

Sito web della pizzeria **Vizi Capitali**, in italiano e inglese, con menu, contatti, orari, mappa e ordini via WhatsApp.
Website for the **Vizi Capitali** pizzeria, in Italian and English, with menu, contacts, opening hours, map and WhatsApp ordering.

È un sito statico: niente database, niente server, niente installazioni.
It is a static site: no database, no server, nothing to install.

---

## 🇮🇹 Come aggiornare il sito

### La pagina di gestione: `admin.html` (consigliato)

Aprite `tuosito/admin.html` dal telefono e inserite il PIN (iniziale: **000000**, cambiatelo subito da "Pubblica"). Lì si cambia tutto senza toccare file: ordini aperti/chiusi, serata piena, orari, menu (prezzi, descrizioni, foto, allergeni, esaurito), consegna, codici sconto, contatti e squadra.

Le modifiche restano salvate sul telefono finché non le pubblicate:
1. **Anteprima:** "Vedi anteprima sul sito" mostra il sito con le modifiche, solo su quel telefono.
2. **Pubblica:** "Scarica config.js e menu.js", poi caricateli su GitHub nella cartella `data` (pulsante "Apri la pagina di caricamento su GitHub" → trascinate i due file → "Commit changes"). Dopo 1–2 minuti il sito è aggiornato.

⚠️ Per ora il PIN è controllato nel browser: protegge la pagina ma non è una vera sicurezza. Non è un rischio perché il sito cambia solo con il caricamento su GitHub. Quando aggiungeremo un server, il PIN sarà verificato lì e le modifiche andranno online subito, senza caricare file.

### Modificare i file a mano

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

**Easiest: `admin.html`.** Open it on a phone and enter the PIN (starting PIN **000000** — change it under "Publish"). Edit orders, busy-night delays, hours, menu (prices, photos, allergens, sold out), delivery, promo codes, contacts and team. Changes are a draft on that device: preview them on the site, then "Download config.js and menu.js" and upload both into the `data` folder on GitHub. The PIN is checked in the browser for now (a screen lock, not real security); once a backend is added it will be checked on the server and changes will go live instantly.

**By hand:**

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

## 🧾 Ordini dal sito / Website orders

Con un hosting PHP i clienti ordinano direttamente dal sito: niente WhatsApp a pagamento, le notifiche arrivano gratis su Telegram e sulla bacheca `ordini.html`.
*With PHP hosting, customers order straight from the website. Notifications are free, via Telegram and the `ordini.html` board.*

### Prima installazione / First setup (una volta sola)

1. Hosting: **PHP 8.1+** con `pdo_sqlite` e `curl` (quasi tutti gli hosting li hanno) e **HTTPS** attivo.
2. Caricate tutta la cartella, poi aprite **subito** `https://vostrosito.it/api/setup.php` — finché non è configurato, chiunque potrebbe aprirlo.
3. Telegram (gratis):
   - in Telegram scrivete a **@BotFather** → `/newbot` → copiate il *token*;
   - create un gruppo "Ordini" (e, se volete, uno "Rider") e aggiungete il bot;
   - scrivete un messaggio nel gruppo, poi in `setup.php` premete **Trova chat** per ottenere gli ID.
4. Scegliete il **PIN di 6 cifre** dello staff, i nomi dei rider, ed eventualmente l'email mittente per le conferme.
5. Salvate. Il file con i segreti finisce in `api/private/config.php` (mai su GitHub, protetto da `.htaccess`). Per rifare la configurazione cancellate quel file e riaprite `setup.php`.

> **nginx:** `.htaccess` funziona solo su Apache/LiteSpeed. Su nginx aggiungete `location ^~ /api/private/ { deny all; }`.

### Ogni giorno / Daily use

Aprite `ordini.html` su tablet o PC in cucina e inserite il PIN.

- **Attiva suono** a inizio turno (i browser lo richiedono): suona finché c'è un ordine nuovo. Arriva anche un messaggio su Telegram, con i pulsanti *Accetta* / *Rifiuta*.
- **Accetta** → scegliete l'orario (proposto in automatico). Il cliente lo vede sulla sua pagina dell'ordine.
- **Rifiuta** → scegliete il motivo; il cliente lo vede subito.
- **Stampa** → scontrino 80 mm con codice, piatti, indirizzo, resto e QR per la mappa.
- **In consegna** → scegliete il rider: riceve su Telegram indirizzo, *Naviga* e *WhatsApp cliente*.
- **+ Ordine telefono / app** → aggiungete gli ordini di telefono, Just Eat, Glovo, Deliveroo, così la cucina ha tutto in un posto.
- **Archivio** → ordini dei giorni passati.
- Interruttori in alto:
  - **Ordini online** — spegnetelo per mettere in pausa gli ordini (il menu resta visibile).
  - **Modalità manutenzione** — copre il sito con "Torniamo presto" e i pulsanti per chiamare/WhatsApp.

Il pagamento resta alla consegna/al ritiro (SumUp o contanti): gli ordini vanno battuti in cassa come sempre.

### Privacy

Nome, telefono, email e indirizzo vengono cancellati automaticamente dopo **30 giorni** (`retention_days` in `setup.php`); restano solo i totali per l'archivio.

### Senza PHP / Without PHP

In `data/config.js` → `ordering.channel`: `"website"` (ordini al server) oppure `"whatsapp"` (vecchio metodo, messaggio precompilato). Se il server non risponde, il carrello offre comunque l'invio via WhatsApp.

---

## Pubblicazione / Publishing

For **website orders** you need PHP hosting (see above) — any cheap shared host or VPS with PHP works, one bill. Without the order system, any static host works:

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
assets/js/app.js      menu, language switch, basket, checkout
ordine.html           customer's live order page (status, cancel)
ordini.html           staff board (PIN) ← orders, switches, archive
api/                  PHP + SQLite backend (orders, Telegram, staff)
api/setup.php         one-time setup: PIN, Telegram
api/private/          secrets + database (never uploaded to GitHub)
assets/vendor/        qrcode-generator (MIT) for printed slips
assets/img/           logos, mascot, photos (from the brand identity book)
```

## Note sul brand / Brand notes

- Colours, logo, mascot, checkerboard and photography come from the *Vizi Capitali* brand identity guidelines.
- The brand book uses the fonts **Obviously** and **Amertha**, which are commercial licences (Amertha's embedded copy is marked *personal use only*). The site uses free Google Fonts lookalikes instead: **Archivo** (expanded, black) and **Yellowtail**. If you buy web licences for the originals, swap them in `assets/css/style.css` (`--font-display`, `--font-script`).
