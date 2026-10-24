/* =====================================================================
   Vizi Capitali · "Gestione" page (admin.html)
   Edits the menu and settings and saves them straight to the server
   (api/admin.php → data/live.js). Unsaved changes are kept as a draft
   on this device and can be previewed on the site before saving.
   Same staff login (PIN) as the Ordini board.
   ===================================================================== */
(function () {
  "use strict";

  var DRAFT = "vc-admin-draft";
  var PREVIEW = "vc-preview";
  var LANG = "vc-admin-lang";
  var TZ = (window.SITE_CONFIG && window.SITE_CONFIG.timeZone) || "Europe/Rome";

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
      "pin.title": "Area staff", "pin.label": "PIN dello staff", "pin.enter": "Entra",
      "pin.wrong": "PIN sbagliato.", "pin.wait": "Troppi tentativi. Riprova tra 15 minuti.",
      "pin.server": "Server non raggiungibile. Questa pagina funziona solo sul sito online.",
      "pin.setup": "Il sistema non è ancora configurato: apri api/setup.php.",
      "app.logout": "Esci", "app.dirty": "Modifiche non salvate", "app.saved": "Salvato: il sito è aggiornato.",
      "app.save": "Salva e pubblica", "app.saving": "Salvo…", "app.preview": "Anteprima",
      "app.discard": "Annulla modifiche", "app.discardConfirm": "Annullare le modifiche non salvate?",
      "app.saveFail": "Non salvato ({e}). Riprova.", "app.badPrice": "Controlla il prezzo di \"{name}\".",
      "app.badMenu": "Due piatti hanno lo stesso codice (\"{name}\"): eliminane uno e ricrealo.",
      "app.conflict": "Qualcun altro ha salvato delle modifiche nel frattempo. Caricare la versione aggiornata? Le tue modifiche non salvate andranno perse.",
      "app.draftRestored": "Ho ripreso le modifiche non salvate su questo dispositivo.",
      "app.draftOld": "Le modifiche non salvate su questo dispositivo erano superate e sono state scartate.",
      "app.uploading": "Carico la foto…", "app.uploadFail": "Foto non caricata. Riprova.",
      "app.previewHelp": "L'anteprima mostra le modifiche non salvate, solo su questo dispositivo.",
      "nav.orders": "Ordini", "nav.admin": "Gestione",
      "tab.hours": "Orari e tempi", "tab.promo": "Sconti", "tab.history": "Versioni e PIN",
      "tab.menu": "Menu", "tab.delivery": "Consegna", "tab.info": "Contatti", "tab.team": "Squadra",
      "orders.timing": "Tempi degli ordini",
      "tab.theme": "Temi e avvisi", "theme.title": "Tema del sito",
      "ann.title": "Striscia in alto", "ann.help": "Un messaggio e/o un codice sconto in cima a tutte le pagine, con o senza tema. Se c'è un tema, prende il posto dei suoi auguri.",
      "ann.on": "Mostra la striscia", "ann.text": "Messaggio", "ann.code": "Codice sconto da mostrare", "ann.noCode": "Nessun codice",
      "ann.codeHelp": "Il cliente tocca \"Usa il codice\" e lo trova già nel carrello. Il codice diventa pubblico: usatelo per promozioni aperte a tutti.",
      "ann.from": "Dal (facoltativo)", "ann.to": "Al (facoltativo)", "ann.datesHelp": "Con le date, la striscia compare e sparisce da sola.",
      "ann.noPromos": "Nessun codice sconto: createne uno in Sconti.",
      "theme.help": "Un tocco di festa: striscia di auguri in alto, scacchiera colorata, adesivo sulla pizza e decorazioni animate nella prima schermata. Menu e ordini non cambiano.",
      "theme.off": "Nessun tema", "theme.offSub": "Il sito di sempre", "theme.auto": "Automatico", "theme.autoSub": "Cambia da solo con le feste",
      "theme.today": "Oggi: {name}", "theme.todayNone": "Oggi: nessuna festa",
      "theme.halloween": "Halloween", "theme.natale": "Natale", "theme.capodanno": "Capodanno", "theme.sanvalentino": "San Valentino",
      "theme.pasqua": "Pasqua", "theme.ferragosto": "Ferragosto", "theme.dates": "dal {from} al {to}", "theme.easter": "settimana di Pasqua",
      "theme.effects": "Decorazioni animate (neve, coriandoli…)", "theme.effectsHelp": "Non compaiono a chi ha disattivato le animazioni sul telefono.",
      "theme.msg": "Messaggio di auguri · {name}", "theme.msgHelp": "Lasciate vuoto per usare il testo proposto (grigio).",
      "theme.previewHint": "Per vederlo prima di pubblicarlo usate Anteprima nella barra in basso.",
      "orders.boardNote": "Pausa degli ordini online, attesa extra e manutenzione si cambiano dalla pagina Ordini, in alto: valgono subito.",
      "promo.help": "I codici non sono visibili sul sito: il cliente li scrive nel carrello e il server li controlla.",
      "hist.title": "Versioni precedenti", "hist.help": "A ogni salvataggio viene conservata la versione precedente (le ultime 15). Se qualcosa non va, ripristinala: il sito cambia subito.",
      "hist.none": "Ancora nessun salvataggio.", "hist.item": "Versione in uso fino al {when}", "hist.itemRestore": "Versione in uso fino al {when} (prima di un ripristino)",
      "hist.restore": "Ripristina", "hist.confirm": "Ripristinare la versione in uso fino al {when}? Il sito cambia subito.",
      "hist.done": "Versione ripristinata.", "hist.dirtyFirst": "Prima salva o annulla le modifiche in corso.",
      "pinc.title": "Cambia il PIN dello staff", "pinc.current": "PIN attuale", "pinc.new": "Nuovo PIN (6 cifre)", "pinc.new2": "Ripeti il nuovo PIN",
      "pinc.set": "Cambia PIN", "pinc.ok": "PIN cambiato. Sugli altri tablet e telefoni bisogna rientrare con il nuovo PIN.",
      "pinc.bad": "Il nuovo PIN deve avere 6 cifre e coincidere.", "pinc.wrong": "Il PIN attuale non è corretto.",
      "pinc.help": "Lo stesso PIN vale per Ordini e Gestione.",
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
      "pin.title": "Staff area", "pin.label": "Staff PIN", "pin.enter": "Enter",
      "pin.wrong": "Wrong PIN.", "pin.wait": "Too many attempts. Try again in 15 minutes.",
      "pin.server": "Can't reach the server. This page only works on the live site.",
      "pin.setup": "The system isn't set up yet: open api/setup.php.",
      "app.logout": "Log out", "app.dirty": "Unsaved changes", "app.saved": "Saved: the site is updated.",
      "app.save": "Save and publish", "app.saving": "Saving…", "app.preview": "Preview",
      "app.discard": "Discard changes", "app.discardConfirm": "Discard your unsaved changes?",
      "app.saveFail": "Not saved ({e}). Please try again.", "app.badPrice": "Check the price of \"{name}\".",
      "app.badMenu": "Two dishes share the same code (\"{name}\"): delete one and add it again.",
      "app.conflict": "Someone else saved changes in the meantime. Load the updated version? Your unsaved changes will be lost.",
      "app.draftRestored": "Your unsaved changes on this device have been restored.",
      "app.draftOld": "The unsaved changes on this device were out of date and have been discarded.",
      "app.uploading": "Uploading photo…", "app.uploadFail": "Photo not uploaded. Please try again.",
      "app.previewHelp": "The preview shows your unsaved changes, on this device only.",
      "nav.orders": "Orders", "nav.admin": "Management",
      "tab.hours": "Hours & timing", "tab.promo": "Promos", "tab.history": "Versions & PIN",
      "tab.menu": "Menu", "tab.delivery": "Delivery", "tab.info": "Contact", "tab.team": "Team",
      "orders.timing": "Order timing",
      "tab.theme": "Themes & notices", "theme.title": "Site theme",
      "ann.title": "Top strip", "ann.help": "A message and/or a promo code at the top of every page, with or without a theme. With a theme on, it replaces the theme's greeting.",
      "ann.on": "Show the strip", "ann.text": "Message", "ann.code": "Promo code to show", "ann.noCode": "No code",
      "ann.codeHelp": "Customers tap \"Use code\" and find it already in their basket. The code becomes public: use it for promotions open to everyone.",
      "ann.from": "From (optional)", "ann.to": "Until (optional)", "ann.datesHelp": "With dates, the strip appears and disappears by itself.",
      "ann.noPromos": "No promo codes yet: create one under Promos.",
      "theme.help": "A festive touch: a greeting strip at the top, a coloured checkerboard, a sticker on the pizza and animated decorations on the first screen. Menu and ordering don't change.",
      "theme.off": "No theme", "theme.offSub": "The usual site", "theme.auto": "Automatic", "theme.autoSub": "Changes by itself with the holidays",
      "theme.today": "Today: {name}", "theme.todayNone": "Today: no holiday",
      "theme.halloween": "Halloween", "theme.natale": "Christmas", "theme.capodanno": "New Year", "theme.sanvalentino": "Valentine's Day",
      "theme.pasqua": "Easter", "theme.ferragosto": "Ferragosto", "theme.dates": "{from} to {to}", "theme.easter": "Easter week",
      "theme.effects": "Animated decorations (snow, confetti…)", "theme.effectsHelp": "They don't appear for people who have turned off animations on their phone.",
      "theme.msg": "Greeting · {name}", "theme.msgHelp": "Leave empty to use the suggested text (in grey).",
      "theme.previewHint": "To see it before publishing, use Preview in the bar at the bottom.",
      "orders.boardNote": "Pausing online orders, extra waiting time and maintenance mode are on the Orders page, at the top: they apply straight away.",
      "promo.help": "Codes aren't visible on the site: customers type them in the basket and the server checks them.",
      "hist.title": "Previous versions", "hist.help": "Every save keeps the version before it (the last 15). If something goes wrong, restore it: the site changes straight away.",
      "hist.none": "Nothing saved yet.", "hist.item": "Version in use until {when}", "hist.itemRestore": "Version in use until {when} (before a restore)",
      "hist.restore": "Restore", "hist.confirm": "Restore the version in use until {when}? The site changes straight away.",
      "hist.done": "Version restored.", "hist.dirtyFirst": "Save or discard your current changes first.",
      "pinc.title": "Change the staff PIN", "pinc.current": "Current PIN", "pinc.new": "New PIN (6 digits)", "pinc.new2": "Repeat the new PIN",
      "pinc.set": "Change PIN", "pinc.ok": "PIN changed. Other tablets and phones need to log in again with the new PIN.",
      "pinc.bad": "The new PIN must be 6 digits and both must match.", "pinc.wrong": "The current PIN is wrong.",
      "pinc.help": "The same PIN works for Orders and Management.",
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

  // ---------- server ----------
  function api(action, data) {
    var url = action === "login" || action === "logout" ? "api/staff.php" : "api/admin.php";
    return fetch(url, {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ action: action }, data || {}))
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "server" }; }).then(function (j) { j.httpStatus = r.status; return j; });
    });
  }

  // ---------- state ----------
  // published = what the server has now; state = what is being edited
  var published = { config: {}, menu: [], promos: [] };
  var state = clone(published);
  var version = "";
  var history = [];
  var tab = "menu";
  var openKeys = {};
  var saving = false;

  function takeServer(r) {
    published = { config: r.config || {}, menu: r.menu || [], promos: r.promos || [] };
    version = r.version;
    history = r.history || [];
  }
  function writeDraft() {
    return save(DRAFT, { config: state.config, menu: state.menu, promos: state.promos, version: version, savedAt: new Date().toISOString() });
  }

  function isDirty() { return JSON.stringify(state) !== JSON.stringify(published); }

  var saveTimer;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (isDirty()) {
        if (!writeDraft()) {
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
    hours: function () {
      var h = state.config.hours = state.config.hours || {};
      state.config.ordering = state.config.ordering || {};
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
        }).join("") + "</section>" +
        '<section class="card"><h2>' + esc(t("orders.timing")) + '</h2><div class="grid2">' +
        field(t("orders.prep"), "config.ordering.prepMinutes", "int") +
        field(t("orders.slot"), "config.ordering.slotMinutes", "int") +
        field(t("orders.start"), "config.ordering.startBeforeOpenMin", "int") +
        field(t("orders.stop"), "config.ordering.stopBeforeCloseMin", "int") + "</div>" +
        '<p class="help">' + esc(t("orders.boardNote")) + ' <a href="ordini.html">' + esc(t("nav.orders")) + " →</a></p></section>";
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
      var list = state.promos = state.promos || [];
      return '<section class="card"><h2>' + esc(t("promo.title")) + '</h2><p class="help">' + esc(t("promo.help")) + "</p>" +
        list.map(function (p, i) {
          var pp = "promos." + i;
          return '<div class="row"><div class="grid2">' + field(t("promo.code"), pp + ".code", "upper") +
            '<label class="f"><span>' + esc(t("promo.type")) + '</span><select data-bind="' + pp + '.type" data-kind="text">' +
            ["percent", "fixed", "freeDelivery"].map(function (ty) {
              return '<option value="' + ty + '"' + (p.type === ty ? " selected" : "") + ">" + esc(t("promo." + ty)) + "</option>";
            }).join("") + "</select></label>" +
            (p.type === "freeDelivery" ? "" : field(t("promo.value"), pp + ".value", "num")) +
            field(t("promo.min"), pp + ".minOrder", "num") + field(t("promo.until"), pp + ".validUntil", "date") + "</div>" +
            rowTools(pp, p.code) + "</div>";
        }).join("") + btn(t("promo.add"), "addPromo", "promos", "btn btn--outline btn--sm") + "</section>";
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

    theme: function () {
      var th = state.config.theme || {};   // read only: opening the tab must not count as a change
      var an = state.config.announce || {};
      var codes = (state.promos || []).map(function (p) { return p.code; }).filter(Boolean);
      var annCard = '<section class="card"><h2>' + esc(t("ann.title")) + '</h2><p class="help">' + esc(t("ann.help")) + "</p>" +
        '<label class="chk"><input type="checkbox" data-bind="config.announce.on" data-kind="bool"' + (an.on ? " checked" : "") + "><span>" + esc(t("ann.on")) + "</span></label>" +
        '<div class="f-pair">' + field(t("ann.text") + " · " + t("common.it"), "config.announce.text.it") + field(t("ann.text") + " · " + t("common.en"), "config.announce.text.en") + "</div>" +
        '<label class="f"><span>' + esc(t("ann.code")) + '</span><select data-bind="config.announce.code" data-kind="text">' +
          '<option value="">' + esc(t("ann.noCode")) + "</option>" +
          codes.map(function (c) { return '<option value="' + esc(c) + '"' + (an.code === c ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") +
          (an.code && codes.indexOf(an.code) === -1 ? '<option value="' + esc(an.code) + '" selected>' + esc(an.code) + "</option>" : "") +
        "</select></label>" +
        '<p class="help">' + esc(codes.length ? t("ann.codeHelp") : t("ann.noPromos")) + "</p>" +
        '<div class="grid2">' + field(t("ann.from"), "config.announce.from", "date") + field(t("ann.to"), "config.announce.to", "date") + "</div>" +
        '<p class="help">' + esc(t("ann.datesHelp")) + "</p></section>";
      var THEMES = window.VC_THEMES || {}, ids = Object.keys(THEMES);
      var today = window.VC_themeFor ? window.VC_themeFor(new Date()) : "";
      var mode = th.mode || "off";
      var dm = function (x) { var p = x.split("-"); return parseInt(p[1], 10) + "/" + parseInt(p[0], 10); };
      var opt = function (value, title, sub, sticker, color) {
        return '<label class="theme-opt"><input type="radio" name="theme-mode" value="' + value + '" data-bind="config.theme.mode" data-kind="text"' +
          (mode === value ? " checked" : "") + '><span class="theme-card">' +
          '<span class="theme-sticker-mini" style="background:' + (color || "var(--cream-2)") + '">' + sticker + "</span>" +
          "<strong>" + esc(title) + "</strong><small>" + esc(sub) + "</small></span></label>";
      };
      var shown = mode === "auto" ? today : THEMES[mode] ? mode : "";
      var def = shown ? THEMES[shown].msg : null;
      return annCard + '<section class="card"><h2>' + esc(t("theme.title")) + '</h2><p class="help">' + esc(t("theme.help")) + "</p>" +
        '<div class="theme-grid" role="radiogroup" aria-label="' + esc(t("theme.title")) + '">' +
        opt("off", t("theme.off"), t("theme.offSub"), "🍕") +
        opt("auto", t("theme.auto"), today ? t("theme.today", { name: t("theme." + today) }) : t("theme.todayNone"), "📅") +
        ids.map(function (id) {
          var x = THEMES[id];
          return opt(id, t("theme." + id), x.easter ? t("theme.easter") : t("theme.dates", { from: dm(x.from), to: dm(x.to) }), x.sticker, x.check);
        }).join("") + "</div>" +
        '<label class="chk"><input type="checkbox" data-bind="config.theme.effects" data-kind="bool"' + (th.effects !== false ? " checked" : "") +
          "><span>" + esc(t("theme.effects")) + "</span></label>" + '<p class="help">' + esc(t("theme.effectsHelp")) + "</p>" +
        '<p class="help">' + esc(t("theme.previewHint")) + "</p></section>" +
        (shown ? '<section class="card"><h2>' + esc(t("theme.msg", { name: t("theme." + shown) })) + '</h2><p class="help">' + esc(t("theme.msgHelp")) + "</p>" +
          '<div class="f-pair">' +
          field(t("common.it"), "config.theme.messages." + shown + ".it", "text", ' placeholder="' + esc(def.it) + '"') +
          field(t("common.en"), "config.theme.messages." + shown + ".en", "text", ' placeholder="' + esc(def.en) + '"') + "</div></section>" : "");
    },

    history: function () {
      var fmt = function (ts) {
        return new Date(ts * 1000).toLocaleString(lang === "it" ? "it-IT" : "en-GB",
          { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
      };
      return '<section class="card"><h2>' + esc(t("hist.title")) + '</h2><p class="help">' + esc(t("hist.help")) + "</p>" +
        (history.length ? '<ul class="hist">' + history.map(function (h) {
          var when = fmt(h.at);
          return '<li><span>' + esc(t(h.label === "Prima del ripristino" ? "hist.itemRestore" : "hist.item", { when: when })) + "</span>" +
            '<button type="button" class="mini" data-act="restore" data-path="' + esc(h.id) + '" data-when="' + esc(when) + '">' + esc(t("hist.restore")) + "</button></li>";
        }).join("") + "</ul>" : '<p class="help">' + esc(t("hist.none")) + "</p>") + "</section>" +
        '<section class="card"><h2>' + esc(t("pinc.title")) + '</h2><p class="help">' + esc(t("pinc.help")) + '</p><div class="grid2">' +
        '<label class="f"><span>' + esc(t("pinc.current")) + '</span><input type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" data-pinc="current"></label><span></span>' +
        '<label class="f"><span>' + esc(t("pinc.new")) + '</span><input type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" data-pinc="new"></label>' +
        '<label class="f"><span>' + esc(t("pinc.new2")) + '</span><input type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" data-pinc="new2"></label></div>' +
        '<button type="button" class="btn btn--outline btn--sm" data-act="changePin" data-path="">' + esc(t("pinc.set")) + "</button></section>";
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
  var TABS = ["menu", "hours", "delivery", "promo", "info", "team", "theme", "history"];

  var rendering = false;
  function render() {
    // replacing the inputs blurs the focused one, which can fire another change → render; ignore that one
    if (rendering) return;
    rendering = true;
    try { renderNow(); } finally { rendering = false; }
  }
  function renderNow() {
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
    var dirty = isDirty();
    var bar = $("[data-savebar]");
    bar.hidden = !dirty;
    document.body.classList.toggle("has-savebar", dirty);
    $("[data-savebar-text]").textContent = t("app.dirty");
    $("[data-savebar-hint]").textContent = t("app.previewHelp");
    var sb = $('[data-act="save"]', bar);
    sb.textContent = saving ? t("app.saving") : t("app.save");
    sb.disabled = saving;
    $('[data-act="preview"]', bar).textContent = t("app.preview");
    $('[data-act="discard"]', bar).textContent = t("app.discard");
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
      if (/\.(name|price|available|type|mode|title\.(it|en))$/.test(path) || el.tagName === "SELECT") render();
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
      var target = el.getAttribute("data-image");
      toast(t("app.uploading"));
      resizeImage(el.files[0], +el.getAttribute("data-w"), +el.getAttribute("data-h"), el.getAttribute("data-fit"), function (dataUrl) {
        api("upload", { data: dataUrl }).then(function (r) {
          if (r.httpStatus === 401) { showLogin(); return; }
          if (!r.ok) { toast(t("app.uploadFail")); return; }
          setPath(target, r.url);
          persist();
          render();
        }).catch(function () { toast(t("app.uploadFail")); });
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
      writeDraft();
      try { localStorage.setItem(PREVIEW, "1"); } catch (e) { /* ignore */ }
      return false;   // let the link open normally
    },
    save: function () {
      if (saving) return false;
      saving = true;
      renderDirty();
      api("save", { version: version, config: state.config, menu: state.menu, promos: state.promos }).then(function (r) {
        saving = false;
        if (r.httpStatus === 401) { showLogin(); return; }
        if (r.error === "conflict") {
          if (confirm(t("app.conflict"))) reload(true); else renderDirty();
          return;
        }
        if (!r.ok) {
          toast(r.error === "bad_price" ? t("app.badPrice", { name: r.item || "" }) :
            r.error === "bad_menu" && r.item ? t("app.badMenu", { name: r.item }) : t("app.saveFail", { e: r.error }));
          renderDirty();
          return;
        }
        takeServer(r);
        state = clone(published);
        clearDraft();
        render();
        toast(t("app.saved"));
      }).catch(function () { saving = false; renderDirty(); toast(t("app.saveFail", { e: "rete" })); });
      return false;
    },
    discard: function () {
      if (!confirm(t("app.discardConfirm"))) return false;
      state = clone(published);
      clearDraft();
      openKeys = {};
    },
    restore: function (id, el) {
      if (isDirty()) { toast(t("hist.dirtyFirst")); return false; }
      if (!confirm(t("hist.confirm", { when: el.getAttribute("data-when") }))) return false;
      api("restore", { id: id }).then(function (r) {
        if (r.httpStatus === 401) { showLogin(); return; }
        if (!r.ok) { toast(t("app.saveFail", { e: r.error })); return; }
        takeServer(r);
        state = clone(published);
        clearDraft();
        render();
        toast(t("hist.done"));
      });
      return false;
    },
    changePin: function () {
      var cur = $('[data-pinc="current"]').value, a = $('[data-pinc="new"]').value, b = $('[data-pinc="new2"]').value;
      if (!/^\d{6}$/.test(a) || a !== b) { toast(t("pinc.bad")); return false; }
      api("change_pin", { current: cur, pin: a }).then(function (r) {
        if (r.ok) { $$("[data-pinc]").forEach(function (i) { i.value = ""; }); toast(t("pinc.ok")); return; }
        toast(r.error === "wrong_pin" ? t("pinc.wrong") : r.error === "rate_limited" ? t("pin.wait") : t("app.saveFail", { e: r.error }));
      });
      return false;
    }
  };

  function clearDraft() {
    try { localStorage.removeItem(DRAFT); localStorage.removeItem(PREVIEW); } catch (e) { /* ignore */ }
  }

  function move(p, dir) {
    var r = parentAndIndex(p), j = r.index + dir;
    if (j < 0 || j >= r.list.length) return;
    var x = r.list[r.index];
    r.list[r.index] = r.list[j];
    r.list[j] = x;
    openKeys = {};
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

  // ---------- login (same PIN and session as the Ordini board) ----------
  function showLogin(msg) {
    $("[data-app]").hidden = true;
    $("[data-pin-screen]").hidden = false;
    var err = $("[data-pin-error]");
    err.hidden = !msg;
    err.textContent = msg || "";
    $("#pin").focus();
  }

  /** Loads what the server has; keeps this device's unsaved draft if it was made on the same version. */
  function reload(dropDraft) {
    return api("load").then(function (r) {
      if (r.httpStatus === 401) { showLogin(); return; }
      if (r.error === "not_configured") { showLogin(t("pin.setup")); return; }
      if (!r.ok) { showLogin(t("pin.server")); return; }
      takeServer(r);
      state = clone(published);
      var draft = dropDraft ? null : load(DRAFT, null);
      if (draft && draft.config && draft.menu) {
        if (draft.version === version) {
          state = { config: draft.config, menu: draft.menu, promos: draft.promos || clone(published.promos) };
          if (isDirty()) toast(t("app.draftRestored"));
        } else {
          clearDraft();
          toast(t("app.draftOld"));
        }
      } else if (dropDraft) clearDraft();
      $("[data-pin-screen]").hidden = true;
      $("[data-app]").hidden = false;
      render();
    }).catch(function () { showLogin(t("pin.server")); });
  }

  $("[data-pin-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = this;
    api("login", { pin: form.elements.pin.value.trim() }).then(function (r) {
      if (r.ok) { form.elements.pin.value = ""; reload(false); return; }
      showLogin(r.error === "wrong_pin" ? t("pin.wrong") : r.error === "rate_limited" ? t("pin.wait") :
        r.error === "not_configured" ? t("pin.setup") : t("pin.server"));
      form.elements.pin.select();
    }).catch(function () { showLogin(t("pin.server")); });
  });

  $("[data-logout]").addEventListener("click", function () {
    api("logout").then(function () { location.reload(); });
  });

  window.addEventListener("beforeunload", function (e) {
    if (!isDirty()) return;
    writeDraft();          // kept on this device either way
    e.preventDefault();
    e.returnValue = "";    // the browser asks "leave the page?"
  });

  $$("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
  $$("[data-admin-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-admin-lang") === lang)); });
  reload(false);
})();
