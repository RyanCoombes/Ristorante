/* =====================================================================
   Vizi Capitali · "Ordini" board for the shop (ordini.html)
   Talks to api/staff.php; refreshes every few seconds and rings while
   there are new orders. Layout: new orders on top, then one list of
   the orders in progress sorted by the time they are due; tapping a
   row opens the whole order in a side panel.
   ===================================================================== */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CONFIG = window.SITE_CONFIG || {};
  var MENU = window.MENU || [];
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n || 0); };
  var TZ = CONFIG.timeZone || "Europe/Rome";   // the shop always sees Rome time, whatever the device is set to
  var SOURCE = { web: "Sito", phone: "Telefono", justeat: "Just Eat", glovo: "Glovo", deliveroo: "Deliveroo", other: "Altro" };
  var STATUS = { new: "Nuovo", accepted: "In cucina", ready: "Pronto", out: "In consegna", done: "Completato", rejected: "Rifiutato", cancelled: "Annullato" };
  var BUSY = [0, 15, 30, 45];
  var FILTER_KEY = "vc-board-filter";

  var state = { orders: [], riders: [], reasons: [], serverOffset: 0, panel: null, riderChat: false, orderingOpen: true,
    flags: { paused: false, maintenance: false, busy: 0 }, open: null, filter: "active" };
  try { state.filter = localStorage.getItem(FILTER_KEY) || "active"; } catch (e) { /* ignore */ }

  // ---------- API ----------
  function api(action, data) {
    return fetch("api/staff.php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ action: action }, data || {}))
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "server" }; }).then(function (j) { j.httpStatus = r.status; return j; });
    });
  }

  // ---------- login ----------
  function showLogin(err) {
    $("[data-app]").hidden = true;
    $("[data-login]").hidden = false;
    var e = $("[data-login-err]");
    e.hidden = !err; e.textContent = err || "";
    $("#pin").focus();
  }
  $("[data-login-form]").addEventListener("submit", function (ev) {
    ev.preventDefault();
    api("login", { pin: $("#pin").value.trim() }).then(function (r) {
      if (r.ok) { $("#pin").value = ""; start(); return; }
      if (r.error === "not_configured") { $("[data-setup-hint]").hidden = false; showLogin("Il sistema ordini non è ancora configurato."); return; }
      showLogin(r.error === "rate_limited" ? "Troppi tentativi. Riprova tra 15 minuti." : r.error === "wrong_pin" ? "PIN sbagliato." : "Server non raggiungibile.");
    }).catch(function () { showLogin("Server non raggiungibile."); });
  });
  $("[data-logout]").addEventListener("click", function () { api("logout").then(function () { location.reload(); }); });

  // ---------- sound + keep the tablet awake ----------
  var audio = null, soundOn = false;
  function beep(freq, at, len) {
    var o = audio.createOscillator(), g = audio.createGain();
    o.type = "square"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audio.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + len);
    o.connect(g); g.connect(audio.destination);
    o.start(audio.currentTime + at); o.stop(audio.currentTime + at + len + 0.05);
  }
  function ring() {
    if (!soundOn || !audio) return;
    beep(880, 0, 0.18); beep(1175, 0.22, 0.18); beep(880, 0.44, 0.18); beep(1175, 0.66, 0.3);
  }
  function keepAwake() {
    if (!("wakeLock" in navigator)) return;
    navigator.wakeLock.request("screen").catch(function () { /* not allowed: fine */ });
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && soundOn) keepAwake(); });
  $("[data-sound]").addEventListener("click", function () {
    soundOn = !soundOn;
    if (soundOn) {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
      ring();
      keepAwake();
    }
    this.setAttribute("aria-pressed", String(soundOn));
    this.textContent = soundOn ? "Suono attivo" : "Attiva suono";
    renderBanner();
  });
  setInterval(function () {
    if (state.orders.some(function (o) { return o.status === "new"; })) ring();
  }, 4000);

  // ---------- helpers ----------
  function nowSec() { return Date.now() / 1000 + state.serverOffset; }
  function romeMinutes() {
    var p = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(new Date(nowSec() * 1000)).split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function hhmm(ts) { return new Date(ts * 1000).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: TZ }); }
  function ago(ts) {
    var m = Math.max(0, Math.round((nowSec() - ts) / 60));
    return m < 1 ? "adesso" : m < 60 ? m + " min fa" : hhmm(ts);
  }
  function addMin(t, m) {
    var p = t.split(":"), x = (parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + m + 1440) % 1440;
    return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0");
  }
  /** The time an order is due ("HH:MM"): the accepted time, else the requested slot. */
  function dueTime(o) { return o.readyAt || (o.slot && o.slot !== "asap" ? o.slot : ""); }
  /** Minutes until due (negative = late), across midnight. */
  function minsLeft(o) {
    var d = dueTime(o);
    if (!d) return null;
    var p = d.split(":"), diff = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) - romeMinutes();
    if (diff < -720) diff += 1440;
    if (diff > 720) diff -= 1440;
    return diff;
  }
  function sortKey(o) {
    var m = minsLeft(o);
    return m == null ? (o.createdAt - nowSec()) / 60 : m;
  }
  function waNumber(p) {
    var d = String(p || "").replace(/\D/g, "");
    if (String(p).trim().charAt(0) !== "+" && d.length === 10 && d.charAt(0) === "3") d = "39" + d;   // Italian mobile without prefix
    return d;
  }
  function addressText(o) { return [((o.street || "") + " " + (o.civico || "")).trim(), o.cap].filter(Boolean).join(", "); }
  function mapsUrl(o) {
    if (o.lat != null) return "https://www.google.com/maps/dir/?api=1&destination=" + o.lat + "," + o.lng;
    var area = (CONFIG.address && CONFIG.address.searchArea) || "";
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(addressText(o) + " " + area);
  }
  function whenText(o) {
    if (o.readyAt) return (o.mode === "delivery" ? "consegna " : "pronto ") + o.readyAt;
    return o.slot && o.slot !== "asap" ? "richiesto per le " + o.slot : "prima possibile";
  }
  function itemCount(o) { return o.items.reduce(function (n, l) { return n + (l.qty || 0); }, 0); }
  function itemsShort(o) { return o.items.map(function (l) { return l.qty + "× " + l.name; }).join(", "); }
  function payText(o) { return o.payment === "cash" ? "Contanti" + (o.cashWith ? " (paga con " + money(o.cashWith) + ")" : "") : "Carta"; }
  function feePending(o) { return o.fee == null && o.mode === "delivery" && o.source === "web"; }
  function customerMessage(o) {
    var name = o.name ? o.name.split(" ")[0] : "";
    if (o.status === "accepted") {
      return "Ciao " + name + "! Il tuo ordine #" + o.code + " da Vizi Capitali è confermato: " +
        (o.mode === "delivery" ? "arriva verso le " : "è pronto alle ") + o.readyAt + ". Grazie!";
    }
    if (o.status === "out") return "Ciao " + name + "! Il tuo ordine #" + o.code + " è in consegna, il rider sta arrivando.";
    return "Ciao " + name + ", ti scriviamo per il tuo ordine #" + o.code + " da Vizi Capitali.";
  }
  function modeBadge(o) {
    return '<span class="badge badge--' + o.mode + '">' + (o.mode === "delivery" ? "Consegna" : "Ritiro") + "</span>" +
      (o.source !== "web" ? '<span class="badge badge--src">' + esc(SOURCE[o.source] || o.source) + "</span>" : "");
  }
  function btn(label, act, o, kind) {
    return '<button type="button" class="cbtn cbtn--' + kind + '" data-act="' + act + '" data-id="' + o.id + '">' + label + "</button>";
  }
  function chip(label, value, on, group) {
    return '<button type="button" class="pchip" data-pick="' + group + '" data-value="' + esc(value) + '" aria-pressed="' + on + '">' + esc(label) + "</button>";
  }
  /** The one next step for an order, as [label, action]. */
  function nextStep(o) {
    if (o.status === "accepted") return o.mode === "delivery" ? ["In consegna", "out-open"] : ["Pronto", "ready"];
    if (o.status === "ready") return o.mode === "delivery" ? ["In consegna", "out-open"] : ["Ritirato", "done"];
    if (o.status === "out") return ["Consegnato", "done"];
    return null;
  }

  // ---------- accept / reject / rider / cancel choices ----------
  function panel(o) {
    var p = state.panel;
    if (p.kind === "accept") {
      var base = o.suggestedTime;
      var opts = [[base, base + (o.slot && o.slot !== "asap" ? " (richiesto)" : "")], [addMin(base, 10), "+10′ · " + addMin(base, 10)],
        [addMin(base, 20), "+20′ · " + addMin(base, 20)], [addMin(base, 30), "+30′ · " + addMin(base, 30)]];
      return '<div class="panel"><p class="panel-q">' + (o.mode === "delivery" ? "Arriva verso le…" : "Pronto alle…") + "</p>" +
        '<div class="pchips">' + opts.map(function (x) { return chip(x[1], x[0], p.value === x[0], "time"); }).join("") + "</div>" +
        '<label class="panel-custom">Altro orario <input type="time" data-custom-time value="' + esc(p.value || "") + '"></label>' +
        '<div class="acts">' + btn("Conferma " + esc(p.value || ""), "accept", o, "go") + btn("Indietro", "close", o, "ghost") + "</div></div>";
    }
    if (p.kind === "reject" || p.kind === "cancel") {
      return '<div class="panel"><p class="panel-q">' + (p.kind === "reject" ? "Perché rifiuti?" : "Perché annulli?") + "</p>" +
        '<div class="pchips">' + state.reasons.map(function (r) { return chip(r, r, p.value === r, "reason"); }).join("") + "</div>" +
        '<label class="panel-custom">Altro motivo <input type="text" maxlength="120" data-custom-reason value="' + esc(p.custom || "") + '"></label>' +
        '<div class="acts">' + btn(p.kind === "reject" ? "Rifiuta ordine" : "Annulla ordine", p.kind, o, "danger") + btn("Indietro", "close", o, "ghost") + "</div>" +
        '<p class="muted">Il cliente vede il motivo sulla pagina del suo ordine.</p></div>';
    }
    if (p.kind === "out") {
      return '<div class="panel"><p class="panel-q">Chi consegna?</p>' +
        '<div class="pchips">' + state.riders.map(function (r) { return chip(r, r, p.value === r, "rider"); }).join("") + chip("Nessuno / altro", "", p.value === "", "rider") + "</div>" +
        '<div class="acts">' + btn(state.riderChat ? "In consegna · avvisa il rider" : "In consegna", "out", o, "go") + btn("Indietro", "close", o, "ghost") + "</div></div>";
    }
    return "";
  }

  // ---------- new orders: always on top, can't be missed ----------
  function newCard(o) {
    var isPanel = state.panel && state.panel.id === o.id && !state.open;
    return '<article class="ncard" data-id="' + o.id + '">' +
      '<header><span class="code">#' + esc(o.code) + "</span>" + modeBadge(o) + '<span class="ago">' + ago(o.createdAt) + "</span></header>" +
      '<p class="when">' + esc(whenText(o)) + "</p>" +
      '<ul class="items">' + o.items.map(function (l) {
        return "<li><b>" + l.qty + "×</b> " + esc(l.name) + (l.note ? " <em>(" + esc(l.note) + ")</em>" : "") + "</li>";
      }).join("") + "</ul>" +
      (o.notes ? '<p class="notes">Note: ' + esc(o.notes) + "</p>" : "") +
      '<p class="meta"><b>' + money(o.total) + "</b>" + (feePending(o) ? " + consegna" : "") + " · " + esc(payText(o)) + "</p>" +
      '<p class="meta">' + esc(o.name || "") + (o.mode === "delivery" && addressText(o) ? " · " + esc(addressText(o)) +
        (o.km != null ? " · " + String(o.km).replace(".", ",") + " km" : "") : "") +
      (o.geo === "unverified" ? ' <span class="warn">indirizzo da verificare</span>' : "") + "</p>" +
      (isPanel ? panel(o) : '<div class="acts">' + btn("Accetta", "accept-open", o, "go") + btn("Rifiuta", "reject-open", o, "ghost") +
        btn("Dettagli", "open", o, "ghost") + "</div>") +
      "</article>";
  }

  // ---------- the list: one row per order ----------
  function row(o) {
    var left = minsLeft(o), active = ["accepted", "ready", "out"].indexOf(o.status) !== -1;
    var tone = !active || left == null ? "" : left < 0 ? " is-late" : left <= 10 ? " is-soon" : "";
    var timeNote = !active ? esc(STATUS[o.status]) : left == null ? "" : left < 0 ? "in ritardo " + (-left) + "′" : left === 0 ? "adesso" : "tra " + left + "′";
    var step = nextStep(o);
    var status = o.status === "out" ? "In consegna" + (o.rider ? " · " + esc(o.rider) : "") : o.status === "ready" ? "Pronto" : "";
    return '<article class="orow orow--' + o.status + tone + '" data-id="' + o.id + '">' +
      '<button type="button" class="orow-main" data-act="open" data-id="' + o.id + '" aria-label="Apri ordine #' + esc(o.code) + '">' +
        '<span class="orow-time"><b>' + esc(dueTime(o) || hhmm(o.createdAt)) + "</b><small>" + timeNote + "</small></span>" +
        '<span class="orow-body">' +
          '<span class="orow-top"><span class="code">#' + esc(o.code) + "</span>" + modeBadge(o) +
            (status ? '<span class="badge badge--state">' + status + "</span>" : "") +
            (o.notes ? '<span class="badge badge--note">Note</span>' : "") + "</span>" +
          '<span class="orow-line">' + esc(o.name || "—") + " · " + itemCount(o) + " pz · <b>" + money(o.total) + "</b>" +
            (o.payment === "cash" ? " · contanti" : "") + "</span>" +
          '<span class="orow-items">' + esc(itemsShort(o)) + "</span>" +
        "</span>" +
      "</button>" +
      (step ? '<button type="button" class="cbtn cbtn--go orow-next" data-act="' + step[1] + '" data-id="' + o.id + '">' + step[0] + "</button>" : "") +
      "</article>";
  }

  function group(o) {
    if (o.status === "accepted") return "kitchen";
    if (o.status === "ready" || o.status === "out") return "go";
    if (o.status === "done") return "done";
    if (o.status === "rejected" || o.status === "cancelled") return "off";
    return "new";
  }

  function renderBoard() {
    var g = { new: [], kitchen: [], go: [], done: [], off: [] };
    state.orders.forEach(function (o) { g[group(o)].push(o); });
    g.active = g.kitchen.concat(g.go);
    ["active", "kitchen", "go"].forEach(function (k) { g[k].sort(function (a, b) { return sortKey(a) - sortKey(b); }); });
    ["done", "off"].forEach(function (k) { g[k].sort(function (a, b) { return b.createdAt - a.createdAt; }); });

    // new orders
    var nw = $("[data-new]");
    if (!(nw.contains(document.activeElement) && document.activeElement.tagName === "INPUT")) {
      $("[data-new-wrap]").hidden = !g.new.length;
      nw.innerHTML = g.new.map(newCard).join("");
      $("[data-n-new]").textContent = g.new.length ? "(" + g.new.length + ")" : "";
    }

    // what the oven has to make right now
    var count = {};
    g.kitchen.forEach(function (o) { o.items.forEach(function (l) { count[l.name] = (count[l.name] || 0) + l.qty; }); });
    var names = Object.keys(count).sort(function (a, b) { return count[b] - count[a] || a.localeCompare(b); });
    var k = $("[data-kitchen]");
    k.hidden = !names.length;
    k.innerHTML = "<b>Da preparare:</b> " + names.map(function (n) { return "<span>" + count[n] + "× " + esc(n) + "</span>"; }).join(" ");

    // filters + list
    $$("[data-filter]").forEach(function (b) {
      var f = b.getAttribute("data-filter");
      b.setAttribute("aria-pressed", String(f === state.filter));
      $('[data-fn="' + f + '"]', b).textContent = g[f].length;
    });
    var list = g[state.filter] || [];
    $("[data-list]").innerHTML = list.length ? list.map(row).join("") :
      '<p class="empty">' + (state.filter === "active" ? "Nessun ordine in corso." : "Nessun ordine qui.") + "</p>";

    var n = g.new.length;
    $("[data-count-new]").textContent = n ? n : "";
    document.title = (n ? "(" + n + ") NUOVO · " : "") + "Ordini · Vizi Capitali";
    renderBanner();
    renderDrawer();
  }

  function renderBanner() {
    var msgs = [];
    if (state.flags.maintenance) msgs.push("Manutenzione attiva: i clienti vedono “Torniamo presto”.");
    else if (state.flags.paused) msgs.push("Ordini online in pausa: il sito è visibile ma non accetta ordini.");
    else if (!state.orderingOpen) msgs.push("Ordini online chiusi in questo momento (fuori orario).");
    if (!soundOn) msgs.push("Suono spento: premi “Attiva suono” per sentire i nuovi ordini.");
    var banner = $("[data-banner]");
    banner.hidden = !msgs.length;
    banner.textContent = msgs.join(" ");
  }

  // ---------- one order in full (side panel) ----------
  var drawer = $("[data-drawer]");
  function renderDrawer() {
    if (!state.open) return;
    var o = find(state.open);
    if (!o) { closeDrawer(); return; }
    var box = $("[data-drawer-box]");
    if (box.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;   // don't redraw while typing
    var isPanel = state.panel && state.panel.id === o.id;
    var step = nextStep(o);
    var actions = "";
    if (o.status === "new") actions = btn("Accetta", "accept-open", o, "go") + btn("Rifiuta", "reject-open", o, "ghost");
    else if (step) actions = btn(step[0], step[1], o, "go");
    if (o.status === "accepted" && o.mode === "delivery") actions += btn("Pronto (aspetta il rider)", "ready", o, "ghost");
    actions += btn("Stampa", "print", o, "ghost");
    if (o.phone && !o.purged && ["new", "accepted", "ready", "out"].indexOf(o.status) !== -1) {
      actions += '<a class="cbtn cbtn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + waNumber(o.phone) + "?text=" +
        encodeURIComponent(customerMessage(o)) + '">Scrivi al cliente</a>';
    }
    if (["accepted", "ready", "out"].indexOf(o.status) !== -1) actions += btn("Annulla ordine", "cancel-open", o, "ghost");

    box.innerHTML =
      '<header class="drawer-head"><h2 id="drawer-title">#' + esc(o.code) + "</h2>" + modeBadge(o) +
        '<span class="badge badge--state">' + esc(STATUS[o.status]) + "</span>" +
        '<button type="button" class="drawer-x" data-act="close-drawer" data-id="' + o.id + '" aria-label="Chiudi">×</button></header>' +
      '<p class="when">' + esc(whenText(o)) + "</p>" +
      '<p class="muted">Ricevuto alle ' + hhmm(o.createdAt) + " · " + esc(SOURCE[o.source] || o.source) + "</p>" +
      '<ul class="items">' + o.items.map(function (l) {
        return "<li><b>" + l.qty + "×</b> " + esc(l.name) + (l.note ? " <em>(" + esc(l.note) + ")</em>" : "") +
          (l.price != null ? '<span class="pr">' + money(l.price * l.qty) + "</span>" : "") + "</li>";
      }).join("") + "</ul>" +
      (o.notes ? '<p class="notes">Note: ' + esc(o.notes) + "</p>" : "") +
      '<dl class="facts">' +
        (o.discount ? "<div><dt>Sconto" + (o.promo ? " " + esc(o.promo) : "") + "</dt><dd>−" + money(o.discount) + "</dd></div>" : "") +
        (o.mode === "delivery" ? "<div><dt>Consegna</dt><dd>" + (o.fee == null ? (o.source === "web" ? "da confermare" : "—") : money(o.fee)) + "</dd></div>" : "") +
        '<div class="tot"><dt>Totale</dt><dd>' + money(o.total) + "</dd></div>" +
        "<div><dt>Pagamento</dt><dd>" + esc(payText(o)) + (o.payment === "cash" && o.cashWith ? " · resto " + money(o.cashWith - o.total) : "") + "</dd></div>" +
      "</dl>" +
      (o.purged ? '<p class="muted">Dati del cliente cancellati (privacy).</p>' :
        '<dl class="facts">' +
          "<div><dt>Cliente</dt><dd>" + esc(o.name || "—") + "</dd></div>" +
          (o.phone ? '<div><dt>Telefono</dt><dd><a href="tel:' + esc(o.phone) + '">' + esc(o.phone) + "</a></dd></div>" : "") +
          (o.mode === "delivery" && addressText(o) ? '<div><dt>Indirizzo</dt><dd><a href="' + esc(mapsUrl(o)) + '" target="_blank" rel="noopener">' + esc(addressText(o)) + "</a>" +
            (o.km != null ? " · " + String(o.km).replace(".", ",") + " km" : "") +
            (o.geo === "unverified" ? ' <span class="warn">da verificare</span>' : "") + "</dd></div>" : "") +
          (o.buzzer ? "<div><dt>Citofono</dt><dd>" + esc(o.buzzer) + "</dd></div>" : "") +
        "</dl>") +
      (o.rider ? '<p class="muted">Rider: ' + esc(o.rider) + "</p>" : "") +
      (o.rejectReason ? '<p class="muted">Motivo: ' + esc(o.rejectReason) + "</p>" : "") +
      (isPanel ? panel(o) : '<div class="acts">' + actions + "</div>");
  }
  function openDrawer(id, panelKind) {
    state.open = id;
    var o = find(id);
    state.panel = panelKind ? { id: id, kind: panelKind, value: panelKind === "out" ? (state.riders[0] || "") : panelKind === "accept" ? o.suggestedTime : "" } : null;
    renderDrawer();
    if (!drawer.open) { if (drawer.showModal) drawer.showModal(); else drawer.setAttribute("open", ""); }
  }
  function closeDrawer() {
    state.open = null;
    state.panel = null;
    if (drawer.open) { if (drawer.close) drawer.close(); else drawer.removeAttribute("open"); }
  }
  drawer.addEventListener("close", function () { state.open = null; state.panel = null; renderBoard(); });
  drawer.addEventListener("click", function (e) { if (e.target === drawer) closeDrawer(); });   // tap outside the panel

  var failures = 0;
  function refresh() {
    return api("board").then(function (r) {
      if (r.httpStatus === 401) { showLogin(); return; }
      if (!r.ok) throw new Error(r.error);
      failures = 0;
      $("[data-online]").textContent = "";
      state.orders = r.orders; state.riders = r.riders || []; state.reasons = r.rejectReasons || [];
      state.riderChat = !!r.riderChat; state.orderingOpen = !!r.orderingOpen;
      if (r.state) state.flags = r.state;
      renderFlags();
      state.serverOffset = r.now - Date.now() / 1000;
      if (state.panel && !find(state.panel.id)) state.panel = null;
      renderBoard();
    }).catch(function () {
      failures++;
      $("[data-online]").textContent = failures > 1 ? "Connessione assente" : "";
    });
  }

  function find(id) { return state.orders.filter(function (o) { return o.id === id; })[0]; }
  function act(action, data) {
    return api(action, data).then(function (r) {
      if (!r.ok) alert(r.error === "not_new" ? "Questo ordine è già stato gestito." : "Operazione non riuscita (" + r.error + ").");
      if (r.ok && action === "status" && data.to === "out" && state.riderChat && r.riderNotified === false) alert("Ordine in consegna, ma il messaggio al rider non è partito: controlla Telegram.");
      state.panel = null;
      if (r.ok && (action === "reject" || data.to === "done" || data.to === "out")) closeDrawer();
      return refresh();
    });
  }

  document.addEventListener("click", function (e) {
    var pick = e.target.closest("[data-pick]");
    if (pick && state.panel) { state.panel.value = pick.getAttribute("data-value"); renderBoard(); return; }
    var b = e.target.closest("[data-act][data-id]");
    if (!b) return;
    var id = parseInt(b.getAttribute("data-id"), 10), o = find(id), a = b.getAttribute("data-act");
    if (!o) return;
    var inDrawer = !!b.closest("[data-drawer]");
    switch (a) {
      case "open": openDrawer(id); return;
      case "close-drawer": closeDrawer(); return;
      case "accept-open": state.panel = { id: id, kind: "accept", value: o.suggestedTime }; break;
      case "reject-open": state.panel = { id: id, kind: "reject", value: "" }; break;
      case "cancel-open": state.panel = { id: id, kind: "cancel", value: "" }; break;
      case "out-open":
        if (!inDrawer) { openDrawer(id, "out"); return; }
        state.panel = { id: id, kind: "out", value: state.riders[0] || "" }; break;
      case "close": state.panel = null; break;
      case "accept": act("accept", { id: id, time: state.panel.value }); return;
      case "reject": case "cancel": {
        var reason = (state.panel.custom || "").trim() || state.panel.value;
        if (!reason) { alert("Scegli un motivo."); return; }
        act("reject", { id: id, reason: reason }); return;
      }
      case "out": act("status", { id: id, to: "out", rider: state.panel.value }); return;
      case "ready": act("status", { id: id, to: "ready" }); return;
      case "done": act("status", { id: id, to: "done" }); return;
      case "print": printSlip(o); return;
    }
    renderBoard();
  });
  document.addEventListener("input", function (e) {
    if (!state.panel) return;
    var host = e.target.closest(".panel");
    if (e.target.matches("[data-custom-time]")) {
      state.panel.value = e.target.value;
      var c = host && $('[data-act="accept"]', host);
      if (c) c.textContent = "Conferma " + e.target.value;
    }
    if (e.target.matches("[data-custom-reason]")) state.panel.custom = e.target.value;
  });
  $$("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.filter = b.getAttribute("data-filter");
      try { localStorage.setItem(FILTER_KEY, state.filter); } catch (e) { /* ignore */ }
      renderBoard();
    });
  });

  // ---------- site status: pause online orders, extra waiting time, maintenance ----------
  var stateBtn = $("[data-state-btn]"), statePanel = $("[data-state-panel]");
  function renderFlags() {
    var f = state.flags, p = f.paused, m = f.maintenance;
    var bp = $('[data-flag="paused"]'), bm = $('[data-flag="maintenance"]');
    bp.setAttribute("aria-pressed", String(!p));             // pressed = orders open
    bp.classList.toggle("is-off", p);
    $('[data-flag-label="paused"]').textContent = p ? "In pausa" : "Aperti";
    bm.setAttribute("aria-pressed", String(m));
    bm.classList.toggle("is-on", m);
    $('[data-flag-label="maintenance"]').textContent = m ? "Attiva" : "Spenta";
    $("[data-busy]").innerHTML = BUSY.map(function (b) {
      return '<button type="button" class="pchip" data-busy-value="' + b + '" aria-pressed="' + ((f.busy || 0) === b) + '">' + (b ? "+" + b + "′" : "Normale") + "</button>";
    }).join("");
    var tone = m ? "maint" : p ? "paused" : !state.orderingOpen ? "closed" : "open";
    stateBtn.className = "state-pill state-pill--" + tone;
    $("[data-state-text]").textContent = (m ? "Manutenzione" : p ? "Ordini in pausa" : !state.orderingOpen ? "Fuori orario" : "Ordini aperti") +
      (f.busy && !m ? " · +" + f.busy + "′" : "");
  }
  function setFlags(data) {
    return api("flags", data).then(function (r) { if (r.ok) { state.flags = r.state; renderFlags(); renderBoard(); } else alert("Non riuscito."); });
  }
  function toggleStatePanel(show) {
    statePanel.hidden = !show;
    stateBtn.setAttribute("aria-expanded", String(show));
  }
  stateBtn.addEventListener("click", function () { toggleStatePanel(statePanel.hidden); });
  document.addEventListener("click", function (e) {
    if (!statePanel.hidden && !e.target.closest("[data-state-panel]") && !e.target.closest("[data-state-btn]")) toggleStatePanel(false);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !statePanel.hidden) { toggleStatePanel(false); stateBtn.focus(); } });
  $$("[data-flag]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-flag"), next = !state.flags[k];
      if (k === "maintenance" && next && !confirm("Attivare la manutenzione? I clienti vedranno “Torniamo presto” e non potranno ordinare online.")) return;
      if (k === "paused" && next && !confirm("Mettere in pausa gli ordini online? Il sito resta visibile.")) return;
      var data = {}; data[k] = next;
      setFlags(data);
    });
  });
  $("[data-busy]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-busy-value]");
    if (b) setFlags({ busy: parseInt(b.getAttribute("data-busy-value"), 10) });
  });

  // ---------- printed slip (80 mm receipt printer; any printer works) ----------
  function printSlip(o) {
    var qr = "";
    if (o.mode === "delivery" && window.qrcode && !o.purged) {
      var q = window.qrcode(0, "M"); q.addData(mapsUrl(o)); q.make();
      qr = '<div class="qr">' + q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }) + "<small>Naviga</small></div>";
    }
    var items = o.items.map(function (l) {
      return "<tr><td class=q>" + l.qty + "×</td><td>" + esc(l.name) + (l.note ? "<br><i>" + esc(l.note) + "</i>" : "") + "</td></tr>";
    }).join("");
    var html = "<!doctype html><html><head><meta charset=utf-8><style>" +
      "@page{size:80mm auto;margin:3mm}body{font-family:Arial,sans-serif;width:72mm;margin:0;color:#000}" +
      "h1{font-size:28px;margin:0}h2{font-size:18px;margin:4px 0}.big{font-size:16px;font-weight:bold}" +
      "table{width:100%;border-collapse:collapse;font-size:16px}td{padding:2px 0;vertical-align:top}.q{width:28px;font-weight:bold}" +
      "hr{border:0;border-top:1px dashed #000;margin:6px 0}.qr{text-align:center}.qr svg{width:34mm;height:34mm}p{margin:3px 0;font-size:14px}" +
      "</style></head><body>" +
      "<p>VIZI CAPITALI · " + new Date().toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short", timeZone: TZ }) + "</p>" +
      "<h1>#" + esc(o.code) + "</h1><h2>" + (o.mode === "delivery" ? "CONSEGNA" : "RITIRO") + (o.source !== "web" ? " · " + esc(SOURCE[o.source]) : "") + "</h2>" +
      '<p class="big">' + esc(whenText(o)) + "</p><hr><table>" + items + "</table>" +
      (o.notes ? "<hr><p><b>Note:</b> " + esc(o.notes) + "</p>" : "") + "<hr>" +
      '<p class="big">TOTALE ' + money(o.total) + (o.fee == null && o.mode === "delivery" && o.source === "web" ? " + consegna" : "") + "</p>" +
      '<p class="big">' + (o.payment === "cash" ? "CONTANTI" + (o.cashWith ? " · paga con " + money(o.cashWith) + " → resto " + money(o.cashWith - o.total) : "") : "CARTA · porta il POS") + "</p><hr>" +
      (o.purged ? "" : "<p><b>" + esc(o.name || "") + "</b> · " + esc(o.phone || "") + "</p>" +
        (o.mode === "delivery" ? '<p class="big">' + esc(addressText(o)) + "</p>" + (o.buzzer ? "<p>" + esc(o.buzzer) + "</p>" : "") : "")) +
      qr + "<p>Non è uno scontrino fiscale.</p></body></html>";
    var f = $("[data-print]");
    f.onload = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { /* ignore */ } };
    f.srcdoc = html;
  }

  // ---------- "+ Ordine" (phone, Just Eat, Glovo, Deliveroo) ----------
  var picks = {};
  var ITEMS = {};
  MENU.forEach(function (c) { (c.items || []).forEach(function (i) { ITEMS[i.id] = i; }); });
  function renderPicker() {
    $("[data-picker]").innerHTML = MENU.map(function (c) {
      return '<div class="pick-cat"><h4>' + esc((c.title && c.title.it) || "") + "</h4>" + (c.items || []).map(function (i) {
        var q = picks[i.id] || 0;
        return '<div class="pick-row' + (q ? " has" : "") + '"><span>' + esc(i.name) + ' <small>' + money(i.price) + "</small></span>" +
          '<span class="pick-q"><button type="button" data-pk="' + esc(i.id) + '" data-d="-1" aria-label="Meno ' + esc(i.name) + '">−</button>' +
          "<b>" + q + '</b><button type="button" data-pk="' + esc(i.id) + '" data-d="1" aria-label="Più ' + esc(i.name) + '">+</button></span></div>';
      }).join("") + "</div>";
    }).join("");
    var sum = Object.keys(picks).reduce(function (n, id) { return n + ITEMS[id].price * picks[id]; }, 0);
    $("[data-add-total]").textContent = sum ? "Totale dal menu: " + money(sum) : "";
  }
  $("[data-picker]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-pk]");
    if (!b) return;
    var id = b.getAttribute("data-pk");
    picks[id] = Math.max(0, (picks[id] || 0) + parseInt(b.getAttribute("data-d"), 10));
    if (!picks[id]) delete picks[id];
    renderPicker();
  });
  var addForm = $("[data-add-form]");
  addForm.addEventListener("change", function (e) {
    if (e.target.name === "mode") $$("[data-addr]", addForm).forEach(function (el) { el.hidden = e.target.value !== "delivery"; });
  });
  addForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = addForm.elements;
    var data = {
      source: f.source.value, mode: f.mode.value, name: f.name.value, phone: f.phone.value,
      street: f.street.value, civico: f.civico.value, cap: f.cap.value, buzzer: f.buzzer.value,
      time: f.time.value, total: f.total.value.replace(",", "."), payment: f.payment.value,
      items: picks, extra: f.extra.value
    };
    api("external", data).then(function (r) {
      if (!r.ok) { alert(r.error === "no_items" ? "Aggiungi almeno un piatto o scrivi cosa hanno ordinato." : "Non salvato (" + r.error + ")."); return; }
      addForm.reset(); picks = {}; renderPicker();
      $$("[data-addr]", addForm).forEach(function (el) { el.hidden = false; });
      showTab("live"); refresh();
    });
  });

  // ---------- archive ----------
  function loadArchive(day) {
    api("archive", { day: day || "" }).then(function (r) {
      if (!r.ok) return;
      $("[data-days]").innerHTML = r.days.map(function (d) {
        return '<button type="button" class="day-btn" data-day="' + d.day + '" aria-pressed="' + (d.day === day) + '">' +
          new Date(d.day + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) +
          "<small>" + d.n + " ordini · " + money(d.total) + "</small></button>";
      }).join("") || '<p class="empty">Ancora nessun ordine.</p>';
      $("[data-day-orders]").innerHTML = r.orders.length ? '<table class="arch"><thead><tr><th>Ora</th><th>Ordine</th><th>Da</th><th>Tipo</th><th>Piatti</th><th>Totale</th><th>Stato</th></tr></thead><tbody>' +
        r.orders.map(function (o) {
          return "<tr><td>" + new Date(o.createdAt * 1000).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) + "</td><td>#" + esc(o.code) +
            "</td><td>" + esc(SOURCE[o.source]) + "</td><td>" + (o.mode === "delivery" ? "Consegna" : "Ritiro") + "</td><td>" +
            o.items.map(function (l) { return l.qty + "× " + esc(l.name); }).join(", ") + "</td><td>" + money(o.total) + "</td><td>" + esc(o.status) +
            (o.rejectReason ? " · " + esc(o.rejectReason) : "") + "</td></tr>";
        }).join("") + "</tbody></table>" : (day ? '<p class="empty">Nessun ordine in questo giorno.</p>' : '<p class="empty">Scegli un giorno.</p>');
    });
  }
  $("[data-days]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-day]");
    if (b) loadArchive(b.getAttribute("data-day"));
  });

  // ---------- tabs ----------
  function showTab(name) {
    $$("[data-tab]").forEach(function (b) { b.setAttribute("aria-current", String(b.getAttribute("data-tab") === name)); });
    $$("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== name; });
    if (name === "archive") loadArchive("");
    if (name === "add") renderPicker();
  }
  $$("[data-tab]").forEach(function (b) { b.addEventListener("click", function () { showTab(b.getAttribute("data-tab")); }); });

  // ---------- start ----------
  function clock() {
    $("[data-clock]").textContent = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  }
  var started = false;
  function start() {
    $("[data-login]").hidden = true;
    $("[data-app]").hidden = false;
    if (started) { refresh(); return; }
    started = true;
    clock(); setInterval(clock, 15000);
    refresh();
    setInterval(function () { if (!state.panel) refresh(); }, 6000);
  }
  api("board").then(function (r) {
    if (r.ok) { start(); return; }
    if (r.error === "not_configured") $("[data-setup-hint]").hidden = false;
    showLogin(r.error === "not_configured" ? "Il sistema ordini non è ancora configurato." : "");
  }).catch(function () { showLogin("Server non raggiungibile. Questa pagina funziona solo sull'hosting con PHP."); });
})();
