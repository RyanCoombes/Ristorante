/* =====================================================================
   Vizi Capitali · admin page
   Edits a copy of data/config.js and data/menu.js in the browser.
   Changes are kept as a draft on this device, can be previewed on the
   site, and are published by downloading the two files and uploading
   them to the repository (until a real backend replaces this step).
   ===================================================================== */
(function () {
  "use strict";

  var DRAFT = "vc-admin-draft";
  var PREVIEW = "vc-preview";
  var SESSION = "vc-admin-ok";
  var ATTEMPTS = "vc-admin-attempts";
  var LANG = "vc-admin-lang";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- text ----------
  var T = {
    it: {
      "pin.title": "Area gestione", "pin.label": "Inserisci il PIN", "pin.enter": "Entra",
      "pin.wrong": "PIN sbagliato.", "pin.wait": "Troppi tentativi. Riprova tra {s} secondi.",
      "app.logout": "Esci", "app.dirty": "Modifiche non pubblicate", "app.saved": "Salvato",
      "tab.orders": "Ordini", "tab.hours": "Orari", "tab.menu": "Menu", "tab.delivery": "Consegna",
      "tab.promo": "Sconti", "tab.info": "Contatti", "tab.team": "Squadra", "tab.publish": "Pubblica",
      "orders.title": "Ordini online", "orders.open": "Aperti", "orders.closed": "Chiusi",
      "orders.switchHelp": "Chiudi subito se il forno è pieno o per una serata privata. Fuori orario si chiudono da soli.",
      "orders.busy": "Serata piena? Aggiungi attesa", "orders.normal": "Normale",
      "orders.prep": "Tempo di preparazione (minuti)",
      "orders.start": "Accetta ordini prima dell'apertura (minuti)",
      "orders.stop": "Smetti di accettare ordini prima della chiusura (minuti)",
      "orders.slot": "Ogni quanti minuti proporre un orario",
      "hours.title": "Orari di apertura", "hours.closed": "Chiuso", "hours.addShift": "+ Turno",
      "hours.help": "Se chiudete dopo mezzanotte scrivete l'orario (es. 00:30).",
      "menu.title": "Menu", "menu.addItem": "+ Aggiungi piatto", "menu.addCat": "+ Aggiungi categoria",
      "menu.catTitle": "Nome categoria", "menu.catNote": "Nota (facoltativa)", "menu.items": "{n} piatti",
      "menu.available": "Disponibile", "menu.soldOut": "Esaurito",
      "menu.name": "Nome del piatto", "menu.price": "Prezzo (€)", "menu.desc": "Descrizione / ingredienti",
      "menu.tags": "Etichette", "menu.allergens": "Allergeni (Reg. UE 1169/2011)", "menu.photo": "Foto",
      "menu.newItem": "Nuovo piatto", "menu.newCat": "Nuova categoria",
      "tag.veg": "Vegetariana", "tag.vegan": "Vegana", "tag.piccante": "Piccante", "tag.novita": "Novità", "tag.top": "Il più amato",
      "delivery.title": "Consegna a domicilio", "delivery.enabled": "Facciamo consegne",
      "delivery.shop": "Posizione del locale", "delivery.lat": "Latitudine", "delivery.lng": "Longitudine",
      "delivery.here": "Usa la posizione di questo telefono (fatelo dal locale)",
      "delivery.zones": "Fasce di distanza", "delivery.upTo": "Fino a (km)", "delivery.fee": "Costo (€)",
      "delivery.min": "Ordine minimo (€)", "delivery.extra": "Minuti in più", "delivery.addZone": "+ Aggiungi fascia",
      "delivery.help": "Distanza in linea d'aria dal locale. Oltre l'ultima fascia non si consegna.",
      "promo.title": "Codici sconto", "promo.code": "Codice", "promo.type": "Tipo", "promo.value": "Valore",
      "promo.min": "Spesa minima (€)", "promo.until": "Valido fino al (vuoto = sempre)",
      "promo.percent": "Percentuale (%)", "promo.fixed": "Importo fisso (€)", "promo.freeDelivery": "Consegna gratis",
      "promo.add": "+ Aggiungi codice",
      "info.title": "Contatti e indirizzo", "info.whatsapp": "WhatsApp per gli ordini (solo cifre, es. 393331234567)",
      "info.phone": "Telefono", "info.email": "Email", "info.instagram": "Instagram (senza @)",
      "info.street": "Via e numero", "info.city": "CAP e città", "info.maps": "Testo per la mappa",
      "info.search": "Città per la ricerca indirizzi",
      "team.title": "La squadra", "team.name": "Nome", "team.role": "Ruolo", "team.bio": "Una frase",
      "team.photo": "Foto (verticale)", "team.add": "+ Aggiungi persona",
      "pub.title": "Pubblica le modifiche", "pub.none": "Nessuna modifica da pubblicare.",
      "pub.some": "Hai modifiche salvate su questo dispositivo ma non ancora sul sito.",
      "pub.preview": "Vedi anteprima sul sito", "pub.previewHelp": "L'anteprima si vede solo su questo dispositivo.",
      "pub.step1": "Scarica i due file", "pub.download": "Scarica config.js e menu.js",
      "pub.step2": "Caricali su GitHub nella cartella data (sostituiscono quelli vecchi) e premi \"Commit changes\"",
      "pub.openGithub": "Apri la pagina di caricamento su GitHub",
      "pub.step3": "Dopo 1-2 minuti il sito è aggiornato.",
      "pub.discard": "Annulla tutte le modifiche", "pub.discardConfirm": "Annullare tutte le modifiche non pubblicate?",
      "pub.pin": "Cambia PIN", "pub.newPin": "Nuovo PIN (6 cifre)", "pub.newPin2": "Ripeti il nuovo PIN",
      "pub.setPin": "Imposta nuovo PIN", "pub.pinOk": "PIN cambiato: vale dopo la pubblicazione.",
      "pub.pinBad": "Il PIN deve avere 6 cifre e coincidere.",
      "pub.note": "Nota: finché non c'è un server, il PIN protegge solo questa pagina. Il sito cambia solo quando i file vengono caricati su GitHub.",
      "common.remove": "Elimina", "common.up": "Su", "common.down": "Giù", "common.it": "Italiano", "common.en": "Inglese",
      "common.removeConfirm": "Eliminare \"{name}\"?", "common.upload": "Scegli foto", "common.noPhoto": "Nessuna foto",
      "common.removePhoto": "Togli foto", "common.locFail": "Posizione non disponibile.",
      "day.0": "Domenica", "day.1": "Lunedì", "day.2": "Martedì", "day.3": "Mercoledì", "day.4": "Giovedì", "day.5": "Venerdì", "day.6": "Sabato",
      "allergen.glutine": "Glutine", "allergen.crostacei": "Crostacei", "allergen.uova": "Uova", "allergen.pesce": "Pesce",
      "allergen.arachidi": "Arachidi", "allergen.soia": "Soia", "allergen.latte": "Latte", "allergen.frutta_a_guscio": "Frutta a guscio",
      "allergen.sedano": "Sedano", "allergen.senape": "Senape", "allergen.sesamo": "Sesamo", "allergen.solfiti": "Solfiti",
      "allergen.lupini": "Lupini", "allergen.molluschi": "Molluschi"
    },
    en: {
      "pin.title": "Management area", "pin.label": "Enter your PIN", "pin.enter": "Enter",
      "pin.wrong": "Wrong PIN.", "pin.wait": "Too many attempts. Try again in {s} seconds.",
      "app.logout": "Log out", "app.dirty": "Unpublished changes", "app.saved": "Saved",
      "tab.orders": "Orders", "tab.hours": "Hours", "tab.menu": "Menu", "tab.delivery": "Delivery",
      "tab.promo": "Promos", "tab.info": "Contact", "tab.team": "Team", "tab.publish": "Publish",
      "orders.title": "Online orders", "orders.open": "Open", "orders.closed": "Closed",
      "orders.switchHelp": "Close straight away if the oven is full or for a private event. Outside opening hours they close by themselves.",
      "orders.busy": "Busy night? Add waiting time", "orders.normal": "Normal",
      "orders.prep": "Preparation time (minutes)",
      "orders.start": "Accept orders before opening (minutes)",
      "orders.stop": "Stop accepting orders before closing (minutes)",
      "orders.slot": "Offer a time every … minutes",
      "hours.title": "Opening hours", "hours.closed": "Closed", "hours.addShift": "+ Shift",
      "hours.help": "If you close after midnight, just type the time (e.g. 00:30).",
      "menu.title": "Menu", "menu.addItem": "+ Add dish", "menu.addCat": "+ Add category",
      "menu.catTitle": "Category name", "menu.catNote": "Note (optional)", "menu.items": "{n} dishes",
      "menu.available": "Available", "menu.soldOut": "Sold out",
      "menu.name": "Dish name", "menu.price": "Price (€)", "menu.desc": "Description / ingredients",
      "menu.tags": "Labels", "menu.allergens": "Allergens (EU Reg. 1169/2011)", "menu.photo": "Photo",
      "menu.newItem": "New dish", "menu.newCat": "New category",
      "tag.veg": "Vegetarian", "tag.vegan": "Vegan", "tag.piccante": "Spicy", "tag.novita": "New", "tag.top": "Fan favourite",
      "delivery.title": "Home delivery", "delivery.enabled": "We deliver",
      "delivery.shop": "Shop location", "delivery.lat": "Latitude", "delivery.lng": "Longitude",
      "delivery.here": "Use this phone's location (do it at the shop)",
      "delivery.zones": "Distance rings", "delivery.upTo": "Up to (km)", "delivery.fee": "Fee (€)",
      "delivery.min": "Minimum order (€)", "delivery.extra": "Extra minutes", "delivery.addZone": "+ Add ring",
      "delivery.help": "Straight-line distance from the shop. Beyond the last ring there's no delivery.",
      "promo.title": "Promo codes", "promo.code": "Code", "promo.type": "Type", "promo.value": "Value",
      "promo.min": "Minimum spend (€)", "promo.until": "Valid until (empty = always)",
      "promo.percent": "Percentage (%)", "promo.fixed": "Fixed amount (€)", "promo.freeDelivery": "Free delivery",
      "promo.add": "+ Add code",
      "info.title": "Contact and address", "info.whatsapp": "WhatsApp for orders (digits only, e.g. 393331234567)",
      "info.phone": "Phone", "info.email": "Email", "info.instagram": "Instagram (without @)",
      "info.street": "Street and number", "info.city": "Postcode and city", "info.maps": "Text for the map",
      "info.search": "City used for address lookups",
      "team.title": "The team", "team.name": "Name", "team.role": "Role", "team.bio": "One line",
      "team.photo": "Photo (portrait)", "team.add": "+ Add person",
      "pub.title": "Publish your changes", "pub.none": "Nothing to publish.",
      "pub.some": "You have changes saved on this device that aren't on the site yet.",
      "pub.preview": "Preview on the site", "pub.previewHelp": "The preview only shows on this device.",
      "pub.step1": "Download the two files", "pub.download": "Download config.js and menu.js",
      "pub.step2": "Upload them on GitHub into the data folder (they replace the old ones) and press \"Commit changes\"",
      "pub.openGithub": "Open the GitHub upload page",
      "pub.step3": "After 1–2 minutes the site is updated.",
      "pub.discard": "Discard all changes", "pub.discardConfirm": "Discard all unpublished changes?",
      "pub.pin": "Change PIN", "pub.newPin": "New PIN (6 digits)", "pub.newPin2": "Repeat the new PIN",
      "pub.setPin": "Set new PIN", "pub.pinOk": "PIN changed: it applies once published.",
      "pub.pinBad": "The PIN must be 6 digits and both must match.",
      "pub.note": "Note: until there's a server, the PIN only protects this page. The site only changes when the files are uploaded to GitHub.",
      "common.remove": "Delete", "common.up": "Up", "common.down": "Down", "common.it": "Italian", "common.en": "English",
      "common.removeConfirm": "Delete \"{name}\"?", "common.upload": "Choose photo", "common.noPhoto": "No photo",
      "common.removePhoto": "Remove photo", "common.locFail": "Location unavailable.",
      "day.0": "Sunday", "day.1": "Monday", "day.2": "Tuesday", "day.3": "Wednesday", "day.4": "Thursday", "day.5": "Friday", "day.6": "Saturday",
      "allergen.glutine": "Gluten", "allergen.crostacei": "Crustaceans", "allergen.uova": "Eggs", "allergen.pesce": "Fish",
      "allergen.arachidi": "Peanuts", "allergen.soia": "Soy", "allergen.latte": "Milk", "allergen.frutta_a_guscio": "Tree nuts",
      "allergen.sedano": "Celery", "allergen.senape": "Mustard", "allergen.sesamo": "Sesame", "allergen.solfiti": "Sulphites",
      "allergen.lupini": "Lupin", "allergen.molluschi": "Molluscs"
    }
  };
  var lang = load(LANG, "it") === "en" ? "en" : "it";
  function t(k, v) {
    var s = T[lang][k] || T.it[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }

  var ALLERGENS = ["glutine", "crostacei", "uova", "pesce", "arachidi", "soia", "latte", "frutta_a_guscio",
    "sedano", "senape", "sesamo", "solfiti", "lupini", "molluschi"];
  var TAGS = ["veg", "vegan", "piccante", "novita", "top"];

  // ---------- SHA-256 (works without a secure context, e.g. when opened as a file) ----------
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, max = mp(2, 32), result = "", words = [], bitLen = ascii.length * 8;
    var hash = [], k = [], primeCounter = 0, isComposite = {}, i, j;
    for (var c = 2; primeCounter < 64; c++) {
      if (!isComposite[c]) {
        for (i = 0; i < 313; i += c) isComposite[i] = c;
        hash[primeCounter] = (mp(c, 0.5) * max) | 0;
        k[primeCounter++] = (mp(c, 1 / 3) * max) | 0;
      }
    }
    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = (bitLen / max) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var temp1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
            (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : "") + b.toString(16); }
    }
    return result;
  }

  // ---------- state ----------
  var published = { config: clone(window.SITE_CONFIG || {}), menu: clone(window.MENU || []) };
  var draft = load(DRAFT, null);
  var state = draft && draft.config && draft.menu ? { config: draft.config, menu: draft.menu } : clone(published);
  var tab = "orders";
  var openKeys = {};

  function isDirty() { return JSON.stringify(state) !== JSON.stringify(published); }

  var saveTimer;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (isDirty()) {
        if (!save(DRAFT, { config: state.config, menu: state.menu, savedAt: new Date().toISOString() })) {
          toast("⚠️ Storage full — remove some photos");
        }
      } else {
        try { localStorage.removeItem(DRAFT); } catch (e) { /* ignore */ }
      }
      renderDirty();
    }, 250);
  }

  function getPath(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, state);
  }
  function setPath(path, value) {
    var keys = path.split("."), last = keys.pop();
    var obj = keys.reduce(function (o, k) {
      if (o[k] == null) o[k] = /^\d+$/.test(k) ? [] : {};
      return o[k];
    }, state);
    obj[last] = value;
  }

  // ---------- small HTML helpers ----------
  function field(label, path, kind, extra) {
    var v = getPath(path);
    var attrs = ' data-bind="' + path + '" data-kind="' + (kind || "text") + '"' + (extra || "");
    var input;
    if (kind === "textarea") input = "<textarea rows=\"2\"" + attrs + ">" + esc(v) + "</textarea>";
    else if (kind === "num" || kind === "int") input = '<input type="number" inputmode="decimal" step="' + (kind === "int" ? "1" : "0.01") + '" min="0" value="' + esc(v == null ? "" : v) + '"' + attrs + ">";
    else if (kind === "time") input = '<input type="time" value="' + esc(v) + '"' + attrs + ">";
    else if (kind === "date") input = '<input type="date" value="' + esc(v) + '"' + attrs + ">";
    else input = '<input type="text" value="' + esc(v) + '"' + attrs + ">";
    return '<label class="f"><span>' + esc(label) + "</span>" + input + "</label>";
  }
  function bilingual(label, path, kind) {
    return '<div class="f-pair">' + field(label + " · " + t("common.it"), path + ".it", kind) +
      field(label + " · " + t("common.en"), path + ".en", kind) + "</div>";
  }
  function check(label, path, extra) {
    return '<label class="chk"><input type="checkbox" data-bind="' + path + '" data-kind="bool"' +
      (getPath(path) ? " checked" : "") + (extra || "") + "><span>" + esc(label) + "</span></label>";
  }
  function toggleIn(label, path, value) {
    var arr = getPath(path) || [];
    return '<label class="chip"><input type="checkbox" data-toggle="' + path + '" data-value="' + value + '"' +
      (arr.indexOf(value) !== -1 ? " checked" : "") + "><span>" + esc(label) + "</span></label>";
  }
  function btn(label, act, path, cls) {
    return '<button type="button" class="' + (cls || "mini") + '" data-act="' + act + '" data-path="' + path + '">' + esc(label) + "</button>";
  }
  function rowTools(path, name) {
    return '<div class="row-tools">' + btn("↑ " + t("common.up"), "up", path) + btn("↓ " + t("common.down"), "down", path) +
      '<button type="button" class="mini mini--danger" data-act="remove" data-path="' + path + '" data-name="' + esc(name) + '">' + esc(t("common.remove")) + "</button></div>";
  }
  function photo(path, w, h, fit) {
    var v = getPath(path);
    return '<div class="photo">' +
      (v ? '<img src="' + esc(v) + '" alt="">' : '<span class="photo-empty">' + esc(t("common.noPhoto")) + "</span>") +
      '<div class="photo-tools"><label class="mini">' + esc(t("common.upload")) +
      '<input type="file" accept="image/*" hidden data-image="' + path + '" data-w="' + w + '" data-h="' + h + '" data-fit="' + fit + '"></label>' +
      (v ? btn(t("common.removePhoto"), "clear", path, "mini mini--danger") : "") + "</div></div>";
  }
  function details(key, summary, body, cls) {
    return '<details class="' + (cls || "box") + '" data-key="' + key + '"' + (openKeys[key] ? " open" : "") + ">" +
      "<summary>" + summary + "</summary><div class=\"box-body\">" + body + "</div></details>";
  }
  function money(n) { return new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-GB", { style: "currency", currency: "EUR" }).format(n || 0); }

  // ---------- panels ----------
  var PANELS = {
    orders: function () {
      var o = state.config.ordering = state.config.ordering || {};
      var isOpen = o.open !== false;
      var busy = Number(o.busyExtraMinutes || 0);
      return '<section class="card"><h2>' + esc(t("orders.title")) + "</h2>" +
        '<button type="button" class="big-switch ' + (isOpen ? "is-on" : "is-off") + '" data-act="toggleOrders" data-path="config.ordering.open" aria-pressed="' + isOpen + '">' +
        "<span class=\"knob\"></span><strong>" + esc(isOpen ? t("orders.open") : t("orders.closed")) + "</strong></button>" +
        '<p class="help">' + esc(t("orders.switchHelp")) + "</p></section>" +
        '<section class="card"><h2>' + esc(t("orders.busy")) + '</h2><div class="seg">' +
        [0, 15, 30, 45].map(function (m) {
          return '<button type="button" data-act="busy" data-path="config.ordering.busyExtraMinutes" data-value="' + m + '" aria-pressed="' + (busy === m) + '">' +
            (m ? "+" + m + " min" : esc(t("orders.normal"))) + "</button>";
        }).join("") + "</div></section>" +
        '<section class="card grid2">' +
        field(t("orders.prep"), "config.ordering.prepMinutes", "int") +
        field(t("orders.slot"), "config.ordering.slotMinutes", "int") +
        field(t("orders.start"), "config.ordering.startBeforeOpenMin", "int") +
        field(t("orders.stop"), "config.ordering.stopBeforeCloseMin", "int") + "</section>";
    },

    hours: function () {
      var h = state.config.hours = state.config.hours || {};
      return '<section class="card"><h2>' + esc(t("hours.title")) + '</h2><p class="help">' + esc(t("hours.help")) + "</p>" +
        [1, 2, 3, 4, 5, 6, 0].map(function (d) {
          var shifts = h[d] = h[d] || [];
          return '<div class="day"><div class="day-head"><strong>' + esc(t("day." + d)) + "</strong>" +
            '<label class="chk"><input type="checkbox" data-act="dayClosed" data-path="config.hours.' + d + '"' + (shifts.length ? "" : " checked") + "><span>" + esc(t("hours.closed")) + "</span></label></div>" +
            shifts.map(function (s, i) {
              return '<div class="shift">' + field("", "config.hours." + d + "." + i + ".0", "time") + "<span>–</span>" +
                field("", "config.hours." + d + "." + i + ".1", "time") +
                '<button type="button" class="mini mini--danger" data-act="removeShift" data-path="config.hours.' + d + '" data-index="' + i + '" aria-label="' + esc(t("common.remove")) + '">×</button></div>';
            }).join("") +
            (shifts.length && shifts.length < 3 ? btn(t("hours.addShift"), "addShift", "config.hours." + d) : "") + "</div>";
        }).join("") + "</section>";
    },

    menu: function () {
      return '<section class="card"><h2>' + esc(t("menu.title")) + "</h2>" +
        state.menu.map(function (cat, ci) {
          var cp = "menu." + ci;
          var items = cat.items = cat.items || [];
          var body = bilingual(t("menu.catTitle"), cp + ".title") + bilingual(t("menu.catNote"), cp + ".note") +
            rowTools(cp, (cat.title && cat.title.it) || "") +
            '<div class="items">' + items.map(function (it, ii) { return itemHtml(cp + ".items." + ii, it); }).join("") + "</div>" +
            btn(t("menu.addItem"), "addItem", cp + ".items", "btn btn--outline btn--sm");
          return details("cat-" + ci, "<strong>" + esc((cat.title && cat.title[lang]) || (cat.title && cat.title.it) || "—") + "</strong>" +
            '<span class="muted">' + esc(t("menu.items", { n: items.length })) + "</span>", body, "box box--cat");
        }).join("") +
        btn(t("menu.addCat"), "addCat", "menu", "btn btn--red btn--sm") + "</section>";
    },

    delivery: function () {
      var d = state.config.delivery = state.config.delivery || { enabled: true, zones: [] };
      d.zones = d.zones || [];
      state.config.shopLocation = state.config.shopLocation || { lat: 0, lng: 0 };
      return '<section class="card"><h2>' + esc(t("delivery.title")) + "</h2>" + check(t("delivery.enabled"), "config.delivery.enabled") + "</section>" +
        '<section class="card"><h2>' + esc(t("delivery.shop")) + '</h2><div class="grid2">' +
        field(t("delivery.lat"), "config.shopLocation.lat", "num", ' step="0.000001"') +
        field(t("delivery.lng"), "config.shopLocation.lng", "num", ' step="0.000001"') + "</div>" +
        btn("📍 " + t("delivery.here"), "shopHere", "config.shopLocation", "btn btn--outline btn--sm") + "</section>" +
        '<section class="card"><h2>' + esc(t("delivery.zones")) + '</h2><p class="help">' + esc(t("delivery.help")) + "</p>" +
        d.zones.map(function (z, i) {
          var p = "config.delivery.zones." + i;
          return '<div class="row"><div class="grid4">' + field(t("delivery.upTo"), p + ".upToKm", "num") + field(t("delivery.fee"), p + ".fee", "num") +
            field(t("delivery.min"), p + ".minOrder", "num") + field(t("delivery.extra"), p + ".extraMinutes", "int") + "</div>" +
            rowTools(p, z.upToKm + " km") + "</div>";
        }).join("") + btn(t("delivery.addZone"), "addZone", "config.delivery.zones", "btn btn--outline btn--sm") + "</section>";
    },

    promo: function () {
      var list = state.config.promoCodes = state.config.promoCodes || [];
      return '<section class="card"><h2>' + esc(t("promo.title")) + "</h2>" +
        list.map(function (p, i) {
          var pp = "config.promoCodes." + i;
          return '<div class="row"><div class="grid2">' + field(t("promo.code"), pp + ".code", "upper") +
            '<label class="f"><span>' + esc(t("promo.type")) + '</span><select data-bind="' + pp + '.type" data-kind="text">' +
            ["percent", "fixed", "freeDelivery"].map(function (ty) {
              return '<option value="' + ty + '"' + (p.type === ty ? " selected" : "") + ">" + esc(t("promo." + ty)) + "</option>";
            }).join("") + "</select></label>" +
            (p.type === "freeDelivery" ? "" : field(t("promo.value"), pp + ".value", "num")) +
            field(t("promo.min"), pp + ".minOrder", "num") + field(t("promo.until"), pp + ".validUntil", "date") + "</div>" +
            rowTools(pp, p.code) + "</div>";
        }).join("") + btn(t("promo.add"), "addPromo", "config.promoCodes", "btn btn--outline btn--sm") + "</section>";
    },

    info: function () {
      state.config.address = state.config.address || {};
      return '<section class="card"><h2>' + esc(t("info.title")) + '</h2><div class="grid2">' +
        field(t("info.whatsapp"), "config.whatsapp", "digits") + field(t("info.phone"), "config.phone") +
        field(t("info.email"), "config.email") + field(t("info.instagram"), "config.instagram") +
        field(t("info.street"), "config.address.street") + field(t("info.city"), "config.address.city") +
        field(t("info.maps"), "config.address.mapsQuery") + field(t("info.search"), "config.address.searchArea") +
        "</div></section>";
    },

    team: function () {
      var list = state.config.team = state.config.team || [];
      return '<section class="card"><h2>' + esc(t("team.title")) + "</h2>" +
        list.map(function (m, i) {
          var p = "config.team." + i;
          var body = field(t("team.name"), p + ".name") + bilingual(t("team.role"), p + ".role") +
            bilingual(t("team.bio"), p + ".bio", "textarea") +
            '<div class="f"><span>' + esc(t("team.photo")) + "</span>" + photo(p + ".photo", 480, 600, "cover") + "</div>" +
            rowTools(p, m.name || "");
          return details("team-" + i, "<strong>" + esc(m.name || (m.role && m.role[lang]) || "—") + "</strong>", body);
        }).join("") + btn(t("team.add"), "addPerson", "config.team", "btn btn--outline btn--sm") + "</section>";
    },

    publish: function () {
      var dirty = isDirty();
      var up = (state.config.admin && state.config.admin.uploadUrl) || "";
      return '<section class="card"><h2>' + esc(t("pub.title")) + "</h2>" +
        '<p class="pub-state ' + (dirty ? "is-dirty" : "") + '">' + esc(dirty ? t("pub.some") : t("pub.none")) + "</p>" +
        '<a class="btn btn--outline btn--sm" href="index.html" target="_blank" data-act="preview" data-path="">' + esc(t("pub.preview")) + "</a>" +
        '<p class="help">' + esc(t("pub.previewHelp")) + "</p>" +
        '<ol class="pub-steps"><li><strong>' + esc(t("pub.step1")) + "</strong><br>" +
        '<button type="button" class="btn btn--red btn--sm" data-act="download" data-path="">' + esc(t("pub.download")) + "</button></li>" +
        "<li><strong>" + esc(t("pub.step2")) + "</strong>" +
        (up ? '<br><a class="btn btn--outline btn--sm" href="' + esc(up) + '" target="_blank" rel="noopener">' + esc(t("pub.openGithub")) + "</a>" : "") + "</li>" +
        "<li>" + esc(t("pub.step3")) + "</li></ol>" +
        (dirty ? '<button type="button" class="mini mini--danger" data-act="discard" data-path="">' + esc(t("pub.discard")) + "</button>" : "") +
        "</section>" +
        '<section class="card"><h2>' + esc(t("pub.pin")) + '</h2><div class="grid2">' +
        '<label class="f"><span>' + esc(t("pub.newPin")) + '</span><input type="password" inputmode="numeric" maxlength="6" data-newpin="1"></label>' +
        '<label class="f"><span>' + esc(t("pub.newPin2")) + '</span><input type="password" inputmode="numeric" maxlength="6" data-newpin="2"></label></div>' +
        '<button type="button" class="btn btn--outline btn--sm" data-act="setPin" data-path="">' + esc(t("pub.setPin")) + "</button>" +
        '<p class="help">' + esc(t("pub.note")) + "</p></section>";
    }
  };

  function itemHtml(p, it) {
    var available = it.available !== false;
    var summary = (it.image ? '<img class="thumb" src="' + esc(it.image) + '" alt="">' : '<span class="thumb thumb--empty"></span>') +
      '<span class="item-name">' + esc(it.name || "—") + "</span>" +
      '<span class="item-price">' + money(it.price) + "</span>" +
      '<label class="avail" data-stop><input type="checkbox" data-bind="' + p + '.available" data-kind="bool"' + (available ? " checked" : "") + ">" +
      '<span>' + esc(available ? t("menu.available") : t("menu.soldOut")) + "</span></label>";
    var body = '<div class="grid2">' + field(t("menu.name"), p + ".name") + field(t("menu.price"), p + ".price", "num") + "</div>" +
      bilingual(t("menu.desc"), p + ".desc", "textarea") +
      '<div class="f"><span>' + esc(t("menu.tags")) + '</span><div class="chips">' +
      TAGS.map(function (tg) { return toggleIn(t("tag." + tg), p + ".tags", tg); }).join("") + "</div></div>" +
      '<div class="f"><span>' + esc(t("menu.allergens")) + '</span><div class="chips">' +
      ALLERGENS.map(function (a) { return toggleIn(t("allergen." + a), p + ".allergens", a); }).join("") + "</div></div>" +
      '<div class="f"><span>' + esc(t("menu.photo")) + "</span>" + photo(p + ".image", 360, 360, "contain") + "</div>" +
      rowTools(p, it.name);
    return details("item-" + p, summary, body, "box box--item" + (available ? "" : " is-soldout"));
  }

  // ---------- rendering ----------
  var TABS = ["orders", "hours", "menu", "delivery", "promo", "info", "team", "publish"];

  function render() {
    $$("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
    $$("[data-admin-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-admin-lang") === lang)); });
    document.documentElement.lang = lang;
    $("[data-tabs]").innerHTML = TABS.map(function (k) {
      return '<button type="button" data-tab="' + k + '" aria-current="' + (k === tab) + '">' + esc(t("tab." + k)) + "</button>";
    }).join("");
    var y = window.scrollY;
    var active = document.activeElement, bind = active && active.getAttribute && active.getAttribute("data-bind");
    $("[data-panel]").innerHTML = PANELS[tab]();
    window.scrollTo(0, y);
    // re-rendering replaces the inputs: put the cursor back where the user was
    if (bind) { var again = $('[data-bind="' + bind + '"]'); if (again) again.focus({ preventScroll: true }); }
    renderDirty();
  }

  function renderDirty() {
    var el = $("[data-dirty]");
    var dirty = isDirty();
    el.hidden = !dirty;
    el.textContent = t("app.dirty");
    var pubTab = $('[data-tab="publish"]');
    if (pubTab) pubTab.classList.toggle("has-dot", dirty);
  }

  var toastTimer;
  function toast(msg) {
    var el = $("[data-toast]");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  // ---------- editing ----------
  function coerce(kind, el) {
    var v = el.value;
    if (kind === "bool") return el.checked;
    if (kind === "num") return v === "" ? 0 : Math.round(parseFloat(v.replace(",", ".")) * 1000000) / 1000000;
    if (kind === "int") return v === "" ? 0 : parseInt(v, 10);
    if (kind === "upper") return v.toUpperCase().replace(/\s+/g, "");
    if (kind === "digits") return v.replace(/\D/g, "");
    return v;
  }

  document.addEventListener("input", function (e) {
    var el = e.target;
    if (!el.hasAttribute || !el.hasAttribute("data-bind")) return;
    var kind = el.getAttribute("data-kind");
    if (kind === "bool") return;   // handled on change
    setPath(el.getAttribute("data-bind"), coerce(kind, el));
    persist();
  });

  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.hasAttribute("data-bind")) {
      var path = el.getAttribute("data-bind");
      setPath(path, coerce(el.getAttribute("data-kind"), el));
      persist();
      // things shown elsewhere (summaries, promo type) need a refresh
      if (/\.(name|price|available|type|title\.(it|en))$/.test(path) || el.tagName === "SELECT") render();
      return;
    }
    if (el.hasAttribute("data-toggle")) {
      var tp = el.getAttribute("data-toggle"), val = el.getAttribute("data-value");
      var arr = (getPath(tp) || []).filter(function (x) { return x !== val; });
      if (el.checked) arr.push(val);
      if (tp.slice(-5) === ".tags") arr.sort(function (a, b) { return TAGS.indexOf(a) - TAGS.indexOf(b); });
      else arr.sort(function (a, b) { return ALLERGENS.indexOf(a) - ALLERGENS.indexOf(b); });
      setPath(tp, arr);
      persist();
      return;
    }
    if (el.hasAttribute("data-image") && el.files && el.files[0]) {
      resizeImage(el.files[0], +el.getAttribute("data-w"), +el.getAttribute("data-h"), el.getAttribute("data-fit"), function (url) {
        setPath(el.getAttribute("data-image"), url);
        persist();
        render();
      });
      return;
    }
    if (el.getAttribute("data-act") === "dayClosed") {
      setPath(el.getAttribute("data-path"), el.checked ? [] : [["18:30", "23:00"]]);
      persist();
      render();
    }
  });

  document.addEventListener("toggle", function (e) {
    var d = e.target;
    if (d.tagName === "DETAILS" && d.hasAttribute("data-key")) openKeys[d.getAttribute("data-key")] = d.open;
  }, true);

  function slug(s) {
    return String(s || "piatto").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "piatto";
  }
  function uniqueId(base) {
    var ids = {};
    state.menu.forEach(function (c) { ids["cat:" + c.id] = 1; (c.items || []).forEach(function (i) { ids[i.id] = 1; }); });
    var id = base, n = 2;
    while (ids[id]) id = base + "-" + n++;
    return id;
  }

  function parentAndIndex(path) {
    var keys = path.split("."), idx = parseInt(keys.pop(), 10);
    return { list: getPath(keys.join(".")), index: idx, listPath: keys.join(".") };
  }

  var ACTIONS = {
    toggleOrders: function (p) { setPath(p, !(getPath(p) !== false)); },
    busy: function (p, el) { setPath(p, parseInt(el.getAttribute("data-value"), 10)); },
    addShift: function (p) { getPath(p).push(["18:30", "23:00"]); },
    removeShift: function (p, el) { getPath(p).splice(parseInt(el.getAttribute("data-index"), 10), 1); },
    addItem: function (p) {
      var list = getPath(p);
      list.push({ id: uniqueId(slug(t("menu.newItem"))), name: t("menu.newItem"), desc: { it: "", en: "" }, price: 0, tags: [], allergens: ["glutine"], available: true });
      openKeys["item-" + p + "." + (list.length - 1)] = true;
    },
    addCat: function () {
      state.menu.push({ id: uniqueId("cat-" + Date.now().toString(36)), title: { it: T.it["menu.newCat"], en: T.en["menu.newCat"] }, items: [] });
      openKeys["cat-" + (state.menu.length - 1)] = true;
    },
    addZone: function (p) {
      var list = getPath(p), last = list[list.length - 1] || { upToKm: 0, fee: 0, minOrder: 0, extraMinutes: 0 };
      list.push({ upToKm: (last.upToKm || 0) + 2, fee: last.fee || 0, minOrder: last.minOrder || 0, extraMinutes: (last.extraMinutes || 0) + 10 });
    },
    addPromo: function (p) { getPath(p).push({ code: "NUOVO", type: "percent", value: 10, minOrder: 0, validUntil: "" }); },
    addPerson: function (p) {
      var list = getPath(p);
      list.push({ name: "", role: { it: "", en: "" }, bio: { it: "", en: "" }, photo: "" });
      openKeys["team-" + (list.length - 1)] = true;
    },
    remove: function (p, el) {
      if (!confirm(t("common.removeConfirm", { name: el.getAttribute("data-name") || "" }))) return false;
      var r = parentAndIndex(p);
      r.list.splice(r.index, 1);
      openKeys = {};
    },
    up: function (p) { move(p, -1); },
    down: function (p) { move(p, 1); },
    clear: function (p) { setPath(p, ""); },
    shopHere: function () {
      if (!navigator.geolocation) { toast(t("common.locFail")); return false; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        state.config.shopLocation = {
          lat: Math.round(pos.coords.latitude * 1e6) / 1e6,
          lng: Math.round(pos.coords.longitude * 1e6) / 1e6
        };
        persist();
        render();
      }, function () { toast(t("common.locFail")); }, { enableHighAccuracy: true, timeout: 15000 });
      return false;
    },
    preview: function () {
      save(DRAFT, { config: state.config, menu: state.menu, savedAt: new Date().toISOString() });
      try { localStorage.setItem(PREVIEW, "1"); } catch (e) { /* ignore */ }
      return false;   // let the link open normally
    },
    download: function () {
      var stamp = new Date().toLocaleString("it-IT");
      var head = function (what) {
        return "/* Vizi Capitali · " + what + "\n   Generato dalla pagina di gestione (admin.html) il " + stamp + ".\n" +
          "   Generated by the admin page. Edit it from admin.html rather than by hand. */\n\n";
      };
      downloadFile("config.js", head("impostazioni / settings") + "window.SITE_CONFIG = " + JSON.stringify(state.config, null, 2) + ";\n");
      setTimeout(function () {
        downloadFile("menu.js", head("menu") + "window.MENU = " + JSON.stringify(state.menu, null, 2) + ";\n");
      }, 400);
      return false;
    },
    discard: function () {
      if (!confirm(t("pub.discardConfirm"))) return false;
      state = clone(published);
      try { localStorage.removeItem(DRAFT); localStorage.removeItem(PREVIEW); } catch (e) { /* ignore */ }
      openKeys = {};
    },
    setPin: function () {
      var a = $('[data-newpin="1"]').value, b = $('[data-newpin="2"]').value;
      if (!/^\d{6}$/.test(a) || a !== b) { toast(t("pub.pinBad")); return false; }
      state.config.admin = state.config.admin || {};
      state.config.admin.pinHash = sha256(a);
      toast(t("pub.pinOk"));
    }
  };

  function move(p, dir) {
    var r = parentAndIndex(p), j = r.index + dir;
    if (j < 0 || j >= r.list.length) return;
    var x = r.list[r.index];
    r.list[r.index] = r.list[j];
    r.list[j] = x;
    openKeys = {};
  }

  function downloadFile(name, text) {
    var blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-stop]")) {
      // the sold-out switch sits inside <summary>: don't open/close the row
      if (e.target.tagName !== "INPUT") { e.preventDefault(); var i = e.target.closest("[data-stop]").querySelector("input"); i.click(); }
      return;
    }
    var tb = e.target.closest("[data-tab]");
    if (tb) { tab = tb.getAttribute("data-tab"); render(); window.scrollTo(0, 0); return; }
    var lb = e.target.closest("[data-admin-lang]");
    if (lb) { lang = lb.getAttribute("data-admin-lang"); save(LANG, lang); if (!$("[data-app]").hidden) render(); else $$("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); }); $$("[data-admin-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-admin-lang") === lang)); }); return; }
    var ab = e.target.closest("[data-act]");
    if (!ab || ab.tagName === "INPUT") return;
    var act = ACTIONS[ab.getAttribute("data-act")];
    if (!act) return;
    var keepGoing = act(ab.getAttribute("data-path"), ab);
    if (ab.getAttribute("data-act") === "preview") return;   // link opens the site
    e.preventDefault();
    if (keepGoing === false) return;
    persist();
    render();
  });

  // ---------- images: resize in the browser so files stay small ----------
  function resizeImage(file, w, h, fit, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        var ctx = c.getContext("2d");
        var s = fit === "cover" ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height);
        var dw = img.width * s, dh = img.height * s;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        var url = c.toDataURL("image/webp", 0.8);
        if (url.indexOf("data:image/webp") !== 0) url = c.toDataURL(fit === "cover" ? "image/jpeg" : "image/png", 0.85);
        done(url);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // ---------- PIN ----------
  function pinHash() { return (published.config.admin && published.config.admin.pinHash) || ""; }
  function unlocked() { try { return sessionStorage.getItem(SESSION) === pinHash() && !!pinHash(); } catch (e) { return false; } }

  function showApp() {
    $("[data-pin-screen]").hidden = true;
    $("[data-app]").hidden = false;
    render();
  }

  $("[data-pin-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("[data-pin-error]");
    var tries = load(ATTEMPTS, { n: 0, until: 0 });
    var now = Date.now();
    if (tries.until > now) {
      err.hidden = false;
      err.textContent = t("pin.wait", { s: Math.ceil((tries.until - now) / 1000) });
      return;
    }
    var pin = this.elements.pin.value.trim();
    if (pinHash() && sha256(pin) === pinHash()) {
      save(ATTEMPTS, { n: 0, until: 0 });
      try { sessionStorage.setItem(SESSION, pinHash()); } catch (x) { /* ignore */ }
      showApp();
      return;
    }
    tries.n += 1;
    if (tries.n >= 5) { tries.until = now + 60000; tries.n = 0; }
    save(ATTEMPTS, tries);
    err.hidden = false;
    err.textContent = t("pin.wrong");
    this.elements.pin.select();
  });

  $("[data-logout]").addEventListener("click", function () {
    try { sessionStorage.removeItem(SESSION); } catch (e) { /* ignore */ }
    location.reload();
  });

  window.addEventListener("beforeunload", function () {
    // flush any pending save
    if (isDirty()) save(DRAFT, { config: state.config, menu: state.menu, savedAt: new Date().toISOString() });
  });

  $$("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
  $$("[data-admin-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-admin-lang") === lang)); });
  if (unlocked()) showApp(); else $("#pin").focus();
})();
