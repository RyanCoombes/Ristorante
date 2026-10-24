# Vizi Capitali · Pizza & Co

Sito web della pizzeria **Vizi Capitali**, in italiano e inglese, con menu, contatti, orari, mappa e ordini via WhatsApp.
Website for the **Vizi Capitali** pizzeria, in Italian and English, with menu, contacts, opening hours, map and WhatsApp ordering.

Gira su un normale hosting PHP (un solo abbonamento): ordini dal sito, bacheca ordini e pagina di gestione per lo staff.
It runs on ordinary PHP hosting (one bill): website orders, an orders board and a management page for the staff.

---

## 🇮🇹 Come aggiornare il sito

### La pagina di gestione (consigliato)

### Prima installazione (una volta sola)

1. Hosting con **PHP 8.1+** (con `pdo_sqlite`, quasi tutti ce l'hanno) e **HTTPS** attivo.
2. Caricate tutta la cartella, poi aprite **subito** `https://vostrosito.it/api/setup.php` e scegliete il **PIN di 6 cifre**. Basta questo: la parte "Ordini dal sito" si lascia vuota.

### La gestione: `admin.html`

Aprite `tuosito/admin.html` e inserite il PIN. Lì si cambia tutto senza toccare file:

- **Stato del sito** (prima scheda, vale subito senza salvare): ordini online aperti / in pausa, attesa extra nelle serate piene, **modalità manutenzione** con un messaggio facoltativo ("Torniamo presto").
- Menu (prezzi, descrizioni, foto, allergeni, esaurito), orari e tempi, consegna, codici sconto, contatti, squadra, temi e striscia in alto.

Gli ordini per ora arrivano su **WhatsApp**: il cliente prepara l'ordine sul sito e lo invia già scritto.

- Appena modificate qualcosa compare in basso la barra **Modifiche non salvate**:
  - **Anteprima** mostra il sito con le modifiche, solo su quel dispositivo;
  - **Salva e pubblica** le mette online subito;
  - **Annulla modifiche** torna alla versione online.
- **Versioni e PIN:** ogni salvataggio conserva la versione precedente (le ultime 15), ripristinabile con un tocco. Qui si cambia anche il PIN dello staff.
- Le modifiche vengono salvate sul server in `data/live.js` (non su GitHub), quindi un nuovo caricamento del sito da GitHub non le cancella.
- **Temi:** Halloween, Natale, Capodanno, San Valentino, Pasqua, Ferragosto, oppure *Automatico* (cambia da solo con le date delle feste) o *Nessun tema*. Ogni tema veste tutto il sito in stile elegante: colori della festa, logo in foglia metallica, cornici sottili e decorazioni discrete; carrello e ordini restano identici. Per provarne uno senza salvare: `index.html?tema=natale`.
- **Striscia in alto** (Temi e avvisi): una sola striscia in cima al sito. Con un tema mostra i suoi auguri, oppure il vostro messaggio; potete aggiungere un codice sconto (*Usa il codice* lo mette già nel carrello) e date di inizio e fine. Si può spegnere.
- **Nome della festa** sopra il logo (es. «Edizione notturna · Halloween»): si spegne da Temi e avvisi.
- **Etichetta speciale sui piatti** (Menu → piatto): *Speciale della festa* (es. «Speciale Halloween», visibile solo con un tema attivo), *Edizione limitata*, oppure un testo vostro (es. «Speciale Derby»). Il piatto viene messo in evidenza.

### Modificare i file a mano

Serve solo prima di mettere online il sito, o senza hosting PHP: sul sito online vince quello che è salvato dalla Gestione. Tutto quello che cambia di solito si trova nella cartella `data/`. Si apre il file con un editor di testo qualsiasi (anche direttamente su GitHub, con l'icona della matita ✏️) e si salva.

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
- `prepMinutes` = tempo medio di preparazione. I minuti in più nelle serate piene si impostano dalla pagina Ordini (pulsante di stato → Attesa extra). Il cliente vede "attesa ~20 min" e sceglie un orario tra quelli possibili.

### Consegna (`delivery`)

Fasce di distanza dal locale, in linea d'aria: per ognuna `upToKm`, costo (`fee`), ordine minimo (`minOrder`) e minuti in più (`extraMinutes`). Oltre l'ultima fascia non si consegna. Inserite le coordinate vere del locale in `shopLocation`.

Il cliente preme "Verifica indirizzo" (ricerca gratuita OpenStreetMap) oppure "Usa la mia posizione" (GPS del telefono). Se l'indirizzo non si trova, l'ordine arriva con "Distanza: da verificare". Nel messaggio c'è anche il link Google Maps per il fattorino.

### Codici sconto (`promoCodes`)

`type`: `"percent"` (percentuale), `"fixed"` (euro), `"freeDelivery"` (consegna gratis). `minOrder` = spesa minima, `validUntil` = ultimo giorno ("" = senza scadenza). Con l'hosting PHP si gestiscono dalla pagina Gestione → Sconti e restano sul server (`api/private/promos.json`): il sito controlla solo il codice scritto dal cliente, quindi l'elenco non è pubblico.

### Allergeni, icone e foto (`data/menu.js`)

Per ogni piatto: `allergens` (i 14 allergeni UE: `"glutine"`, `"latte"`, `"uova"`…), `tags` con `"veg"` o `"vegan"` per le icone, `image` per la foto (quadrata, in `assets/img/menu/`). ⚠️ Gli allergeni inseriti ora sono esempi: vanno controllati piatto per piatto.

### La squadra

In `data/config.js`, sezione `team`: per ogni persona nome, ruolo, una frase e la foto (`photo`). Le foto vanno nella cartella `assets/img/team/`, in verticale (4:5). Senza foto si vede la mascotte.

### Controllare le modifiche

Dopo aver salvato, apri `index.html` nel browser (doppio clic) e ricarica la pagina. Se il menu sparisce, quasi sempre manca una virgola o una virgoletta nel file che hai modificato.

---

## 🇬🇧 How to update the site

**First:** upload the folder to PHP hosting with HTTPS and open `api/setup.php` straight away to choose the 6-digit staff PIN (leave "Ordini dal sito" empty). **Then: the management page.** Open `admin.html` with the staff PIN. The first tab, **Stato del sito**, applies instantly: pause online orders, extra waiting time on busy nights, and **maintenance mode** with an optional message. Orders currently arrive on **WhatsApp**. Edit the menu (prices, photos, allergens, sold out), hours and timing, delivery, promo codes, contacts and team. A bar appears at the bottom while there are unsaved changes: **Anteprima** previews them on that device only, **Salva e pubblica** puts them live straight away. Every save keeps the previous version (the last 15) under *Versioni e PIN*, where the staff PIN can also be changed. Changes are stored on the server in `data/live.js`, not in git, so redeploying from GitHub doesn't overwrite them.  **Temi** (themes): Halloween, Christmas, New Year, Valentine's, Easter, Ferragosto, *Automatico* (follows the calendar) or none. Each dresses the whole site in an elegant holiday palette with a metallic-foil logo, fine frames and discreet decorations; the basket and ordering are unchanged. Try one without saving with `index.html?tema=natale`. **Top strip** (same tab): a message and/or a promo code at the top of the site, with optional start and end dates; *Use code* puts it straight into the basket.

**By hand** (only before going live, or without PHP hosting; on the live site whatever the management page saved wins):

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
- **Waiting times:** `prepMinutes`; extra minutes on busy nights are set on the Ordini page (status button → Attesa extra). Customers pick from the times that are actually possible.
- **Delivery area:** distance rings from `shopLocation` (straight-line km), each with fee, minimum order and extra minutes. Address check uses OpenStreetMap (free) or the phone's location.
- **Promo codes:** `promoCodes` — percent, fixed amount or free delivery, with minimum spend and expiry. On PHP hosting codes are kept on the server (`api/private/promos.json`) and checked one at a time, so the list isn't public; manage them from the management page.
- **Allergens, veg/vegan icons, photos:** `allergens`, `tags`, `image` on each dish in `data/menu.js`. The allergens filled in now are examples and must be checked.
- **Team:** name, role, one line and an optional portrait photo (4:5) per person in `data/config.js` → `team`.

Visitors can switch language with the IT / EN buttons; the choice is remembered. You can also link straight to English with `index.html?lang=en`.

---

## 🧾 Ordini dal sito / Website orders (pronto, non ancora attivo)

> **Per ora gli ordini arrivano su WhatsApp** (`data/config.js` → `ordering.channel: "whatsapp"`). Il sistema qui sotto (ordini sul sito, bacheca `ordini.html`, avvisi Telegram) è già scritto ma non è collegato dalla gestione. Per attivarlo più avanti: mettete `"channel": "website"`, completate la parte "Ordini dal sito" in `api/setup.php` (cancellando prima `api/private/config.php`) e rimettete il link alla bacheca in `admin.html`.
> *For now orders go through WhatsApp. The website-order system below is built but not linked from the management page; switch `channel` to `"website"` when you want it.*

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
- **Da accettare** (riquadro rosso in alto): gli ordini nuovi.
  - **Accetta** → scegliete l'orario (proposto in automatico). Il cliente lo vede sulla sua pagina dell'ordine.
  - **Rifiuta** → scegliete il motivo; il cliente lo vede subito.
- **Da preparare:** il totale dei piatti da fare in questo momento.
- **Elenco ordini:** una riga per ordine, in ordine di orario. Bordo giallo = manca poco, bordo rosso = in ritardo. Il pulsante verde fa il passo successivo (*Pronto*, *In consegna*, *Ritirato*, *Consegnato*). I filtri sopra l'elenco mostrano In cucina, Pronti / in consegna, Completati, Annullati.
- **Toccate una riga** per vedere l'ordine completo: piatti, note, cliente, indirizzo (con mappa), **Stampa** (scontrino 80 mm con QR per la mappa), **Scrivi al cliente**, **Annulla ordine**.
- **In consegna** → scegliete il rider: riceve su Telegram indirizzo, *Naviga* e *WhatsApp cliente*.
- **+ Ordine telefono / app** → aggiungete gli ordini di telefono, Just Eat, Glovo, Deliveroo, così la cucina ha tutto in un posto.
- **Archivio** → ordini dei giorni passati.
- **Pulsante di stato** in alto (es. "🟢 Ordini aperti"):
  - **Ordini online** — spegnetelo per mettere in pausa gli ordini (il menu resta visibile).
  - **Attesa extra** — +15/+30/+45 minuti nelle serate piene.
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

## Aggiornare il codice / Updating the code

Dopo aver cambiato un file in `assets/` o `data/`, aumentate il numero `?v=` nei file `.html` (es. `?v=20261024` → `?v=20261101`): così i browser scaricano subito la versione nuova invece di usarne una vecchia salvata. Il file `.htaccess` nella cartella principale chiede inoltre ai browser di controllare sempre se c'è una versione nuova.
*After changing anything in `assets/` or `data/`, bump the `?v=` number in the `.html` files so browsers fetch the new version instead of a cached one.*

## Struttura / Structure

```
index.html            page layout
data/config.js        business details   ← edit
data/menu.js          menu               ← edit
data/i18n.js          IT / EN text       ← edit
assets/css/style.css  styles (brand colours: #EE1A37 red, #F0E3CC cream)
assets/js/app.js      menu, language switch, basket, checkout
assets/js/themes.js   seasonal themes + top strip (Gestione → Temi e avvisi)
assets/css/themes/    lux.css: the luxury look shared by all themes, one palette each
ordine.html           customer's live order page (status, cancel)
ordini.html           staff: orders board (PIN), status menu, archive
admin.html            staff: management (menu, hours, delivery, promos, versions, PIN)
api/                  PHP + SQLite backend (orders, Telegram, staff, admin saves)
data/live.js          what the management page saved (server only, not in git)
assets/img/uploads/   photos uploaded from the management page (server only)
api/setup.php         one-time setup: PIN, Telegram
api/private/          secrets + database (never uploaded to GitHub)
assets/vendor/        qrcode-generator (MIT) for printed slips
assets/img/           logos, mascot, photos (from the brand identity book)
```

## Note sul brand / Brand notes

- Colours, logo, mascot, checkerboard and photography come from the *Vizi Capitali* brand identity guidelines.
- The brand book uses the fonts **Obviously** and **Amertha**, which are commercial licences (Amertha's embedded copy is marked *personal use only*). The site uses free Google Fonts lookalikes instead: **Archivo** (expanded, black) and **Yellowtail**. If you buy web licences for the originals, swap them in `assets/css/style.css` (`--font-display`, `--font-script`).
