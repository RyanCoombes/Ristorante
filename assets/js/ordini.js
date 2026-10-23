/* =====================================================================
   Vizi Capitali · "Ordini" board for the shop (ordini.html)
   Talks to api/staff.php; refreshes every few seconds and rings while
   there are new orders.
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

  var state = { orders: [], riders: [], reasons: [], serverOffset: 0, panel: null, riderChat: false, orderingOpen: true,
    flags: { paused: false, maintenance: false } };

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
  var audio = null, soundOn = false, wake = null;
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
    navigator.wakeLock.request("screen").then(function (w) { wake = w; }).catch(function () { /* not allowed: fine */ });
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
  });
  setInterval(function () {
    if (state.orders.some(function (o) { return o.status === "new"; })) ring();
  }, 4000);

  // ---------- helpers ----------
  function nowSec() { return Date.now() / 1000 + state.serverOffset; }
  function ago(ts) {
    var m = Math.max(0, Math.round((nowSec() - ts) / 60));
    return m < 1 ? "adesso" : m < 60 ? m + " min fa" : new Date(ts * 1000).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  }
  function addMin(hhmm, m) {
    var p = hhmm.split(":"), t = (parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + m + 1440) % 1440;
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
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
  function customerMessage(o) {
    var name = o.name ? o.name.split(" ")[0] : "";
    if (o.status === "accepted") {
      return "Ciao " + name + "! Il tuo ordine #" + o.code + " da Vizi Capitali è confermato: " +
        (o.mode === "delivery" ? "arriva verso le " : "è pronto alle ") + o.readyAt + ". Grazie!";
    }
    if (o.status === "out") return "Ciao " + name + "! Il tuo ordine #" + o.code + " è in consegna, il rider sta arrivando.";
    return "Ciao " + name + ", ti scriviamo per il tuo ordine #" + o.code + " da Vizi Capitali.";
  }

  // ---------- cards ----------
  function card(o) {
    var isPanel = state.panel && state.panel.id === o.id;
    var items = o.items.map(function (l) {
      return "<li><strong>" + l.qty + "×</strong> " + esc(l.name) + (l.note ? ' <em>(' + esc(l.note) + ")</em>" : "") + "</li>";
    }).join("");
    var pay = o.payment === "cash" ? "Contanti" + (o.cashWith ? " · paga con " + money(o.cashWith) : "") : "Carta";
    var contact = o.purged ? '<p class="muted">Dati cliente cancellati (privacy)</p>' :
      '<p class="cust"><strong>' + esc(o.name || "—") + "</strong>" +
      (o.phone ? ' · <a href="tel:' + esc(o.phone) + '">' + esc(o.phone) + "</a>" : "") + "</p>" +
      (o.mode === "delivery" && addressText(o) ? '<p class="addr"><a href="' + esc(mapsUrl(o)) + '" target="_blank" rel="noopener">' + esc(addressText(o)) + "</a>" +
        (o.buzzer ? " · " + esc(o.buzzer) : "") + (o.km != null ? " · " + String(o.km).replace(".", ",") + " km" : "") +
        (o.geo === "unverified" ? ' <span class="warn">indirizzo da verificare</span>' : "") + "</p>" : "");

    var actions = "";
    if (o.status === "new") actions = btn("Accetta", "accept-open", o, "go") + btn("Rifiuta", "reject-open", o, "ghost");
    if (o.status === "accepted") {
      actions = (o.mode === "delivery" ? btn("In consegna", "out-open", o, "go") : btn("Pronto", "ready", o, "go")) +
        btn("Stampa", "print", o, "ghost") + btn("Annulla", "cancel-open", o, "ghost");
    }
    if (o.status === "ready") actions = btn("Ritirato", "done", o, "go") + btn("Stampa", "print", o, "ghost");
    if (o.status === "out") actions = btn("Consegnato", "done", o, "go") + btn("Stampa", "print", o, "ghost");
    if (o.phone && !o.purged && ["accepted", "ready", "out", "new"].indexOf(o.status) !== -1) {
      actions += '<a class="cbtn cbtn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + waNumber(o.phone) + "?text=" +
        encodeURIComponent(customerMessage(o)) + '">Scrivi al cliente</a>';
    }

    return '<article class="ocard ocard--' + o.status + '" data-id="' + o.id + '">' +
      '<header><span class="code">#' + esc(o.code) + "</span>" +
      '<span class="badge badge--' + o.mode + '">' + (o.mode === "delivery" ? "Consegna" : "Ritiro") + "</span>" +
      (o.source !== "web" ? '<span class="badge badge--src">' + esc(SOURCE[o.source] || o.source) + "</span>" : "") +
      '<span class="ago">' + ago(o.createdAt) + "</span></header>" +
      '<p class="when">' + esc(whenText(o)) + "</p>" +
      '<ul class="items">' + items + "</ul>" +
      (o.notes ? '<p class="notes">Note: ' + esc(o.notes) + "</p>" : "") +
      '<p class="tot"><strong>' + money(o.total) + "</strong>" + (o.fee == null && o.mode === "delivery" && o.source === "web" ? " + consegna" : "") + " · " + pay + "</p>" +
      contact +
      (o.rejectReason ? '<p class="muted">Motivo: ' + esc(o.rejectReason) + "</p>" : "") +
      (o.rider ? '<p class="muted">Rider: ' + esc(o.rider) + "</p>" : "") +
      (isPanel ? panel(o) : '<div class="acts">' + actions + "</div>") +
      "</article>";
  }
  function btn(label, act, o, kind) {
    return '<button type="button" class="cbtn cbtn--' + kind + '" data-act="' + act + '" data-id="' + o.id + '">' + label + "</button>";
  }
  function chip(label, value, on, group) {
    return '<button type="button" class="pchip" data-pick="' + group + '" data-value="' + esc(value) + '" aria-pressed="' + on + '">' + esc(label) + "</button>";
  }
  function panel(o) {
    var p = state.panel;
    if (p.kind === "accept") {
      var base = o.suggestedTime;
      var opts = [[base, base + (o.slot && o.slot !== "asap" ? " (richiesto)" : "")], [addMin(base, 10), "+10′ · " + addMin(base, 10)],
        [addMin(base, 20), "+20′ · " + addMin(base, 20)], [addMin(base, 30), "+30′ · " + addMin(base, 30)]];
      return '<div class="panel"><p class="panel-q">' + (o.mode === "delivery" ? "Arriva verso le…" : "Pronto alle…") + "</p>" +
        '<div class="pchips">' + opts.map(function (x) { return chip(x[1], x[0], p.value === x[0], "time"); }).join("") + "</div>" +
        '<label class="panel-custom">Altro orario <input type="time" data-custom-time value="' + esc(p.value || "") + '"></label>' +
        '<div class="acts">' + btn("Conferma " + (p.value || ""), "accept", o, "go") + btn("Indietro", "close", o, "ghost") + "</div></div>";
    }
    if (p.kind === "reject" || p.kind === "cancel") {
      return '<div class="panel"><p class="panel-q">' + (p.kind === "reject" ? "Perché rifiuti?" : "Perché annulli?") + "</p>" +
        '<div class="pchips">' + state.reasons.map(function (r) { return chip(r, r, p.value === r, "reason"); }).join("") + "</div>" +
        '<label class="panel-custom">Altro motivo <input type="text" maxlength="120" data-custom-reason value="' + esc(p.custom || "") + '"></label>' +
        '<div class="acts">' + btn(p.kind === "reject" ? "Rifiuta ordine" : "Annulla ordine", p.kind, o, "danger") + btn("Indietro", "close", o, "ghost") + "</div>" +
        '<p class="muted">Il cliente vede il motivo sulla pagina del suo ordine.</p></div>';
    }
    if (p.kind === "out") {
      var riders = state.riders.length ? state.riders : [];
      return '<div class="panel"><p class="panel-q">Chi consegna?</p>' +
        '<div class="pchips">' + riders.map(function (r) { return chip(r, r, p.value === r, "rider"); }).join("") + chip("Nessuno / altro", "", p.value === "", "rider") + "</div>" +
        '<div class="acts">' + btn(state.riderChat ? "In consegna · avvisa il rider" : "In consegna", "out", o, "go") + btn("Stampa", "print", o, "ghost") + btn("Indietro", "close", o, "ghost") + "</div></div>";
    }
    return "";
  }

  // ---------- board ----------
  function renderBoard() {
    var groups = { new: [], accepted: [], go: [], done: [], off: [] };
    state.orders.forEach(function (o) {
      var g = o.status === "ready" || o.status === "out" ? "go" : o.status === "rejected" || o.status === "cancelled" ? "off" : o.status;
      if (groups[g]) groups[g].push(o);
    });
    groups.done.reverse(); groups.off.reverse();
    Object.keys(groups).forEach(function (g) {
      var col = $('[data-col="' + g + '"]');
      // don't redraw a column while someone is typing in it
      if (col.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;
      col.innerHTML = groups[g].length ? groups[g].map(card).join("") : '<p class="empty">Nessun ordine</p>';
      $('[data-n="' + g + '"]').textContent = groups[g].length ? "(" + groups[g].length + ")" : "";
    });
    var n = groups.new.length;
    $("[data-count-new]").textContent = n ? n : "";
    document.title = (n ? "(" + n + ") NUOVO · " : "") + "Ordini · Vizi Capitali";
    var banner = $("[data-banner]");
    var msgs = [];
    if (state.flags.maintenance) msgs.push("MANUTENZIONE ATTIVA: i clienti vedono la pagina \u201CTorniamo presto\u201D.");
    else if (state.flags.paused) msgs.push("Ordini online IN PAUSA: il sito è visibile ma non accetta ordini.");
    else if (!state.orderingOpen) msgs.push("Ordini online chiusi in questo momento (fuori orario o chiusi nelle impostazioni).");
    if (!soundOn) msgs.push("Suono disattivato: premi “Attiva suono” per sentire i nuovi ordini.");
    banner.hidden = !msgs.length;
    banner.textContent = msgs.join(" ");
  }

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
      if (state.panel && !state.orders.some(function (o) { return o.id === state.panel.id; })) state.panel = null;
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
      return refresh();
    });
  }

  $("[data-view=live]").addEventListener("click", function (e) {
    var pick = e.target.closest("[data-pick]");
    if (pick && state.panel) { state.panel.value = pick.getAttribute("data-value"); renderBoard(); return; }
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var id = parseInt(b.getAttribute("data-id"), 10), o = find(id), a = b.getAttribute("data-act");
    if (!o) return;
    switch (a) {
      case "accept-open": state.panel = { id: id, kind: "accept", value: o.suggestedTime }; break;
      case "reject-open": state.panel = { id: id, kind: "reject", value: "" }; break;
      case "cancel-open": state.panel = { id: id, kind: "cancel", value: "" }; break;
      case "out-open": state.panel = { id: id, kind: "out", value: state.riders[0] || "" }; break;
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
  $("[data-view=live]").addEventListener("input", function (e) {
    if (!state.panel) return;
    if (e.target.matches("[data-custom-time]")) { state.panel.value = e.target.value; $('[data-act="accept"]').textContent = "Conferma " + e.target.value; }
    if (e.target.matches("[data-custom-reason]")) state.panel.custom = e.target.value;
  });

  // ---------- switches: pause online orders / maintenance mode ----------
  function renderFlags() {
    var p = state.flags.paused, m = state.flags.maintenance;
    var bp = $('[data-flag="paused"]'), bm = $('[data-flag="maintenance"]');
    bp.setAttribute("aria-pressed", String(!p));             // pressed = orders open
    bp.classList.toggle("is-off", p);
    $('[data-flag-label="paused"]').textContent = p ? "In pausa" : "Aperti";
    bm.setAttribute("aria-pressed", String(m));
    bm.classList.toggle("is-on", m);
    $('[data-flag-label="maintenance"]').textContent = m ? "Attiva" : "Spenta";
  }
  $$("[data-flag]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-flag"), next = !state.flags[k];
      if (k === "maintenance" && next && !confirm("Attivare la manutenzione? I clienti vedranno \u201CTorniamo presto\u201D e non potranno ordinare online.")) return;
      if (k === "paused" && next && !confirm("Mettere in pausa gli ordini online? Il sito resta visibile.")) return;
      var data = {}; data[k] = next;
      api("flags", data).then(function (r) { if (r.ok) { state.flags = r.state; renderFlags(); renderBoard(); } else alert("Non riuscito."); });
    });
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
