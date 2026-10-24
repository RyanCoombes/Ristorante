/* =====================================================================
   Vizi Capitali · the customer's live order page (ordine.html)
   Polls api/status.php until the order is finished.
   ===================================================================== */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var CONFIG = window.SITE_CONFIG || {};
  var params = new URLSearchParams(location.search);
  var code = params.get("c") || "", token = params.get("t") || "";
  var lang = params.get("lang") || (function () { try { return JSON.parse(localStorage.getItem("vc-lang")); } catch (e) { return null; } })() || "it";
  if (lang !== "en") lang = "it";
  document.documentElement.lang = lang;

  var T = {
    it: {
      summary: "Il tuo ordine", back: "Torna al sito", code: "Ordine #{c}", call: "Chiama il locale", wa: "Scrivici su WhatsApp",
      cancel: "Annulla l'ordine", cancelConfirm: "Vuoi davvero annullare l'ordine?", subtotal: "Subtotale", discount: "Sconto",
      delivery: "Consegna", total: "Totale", toConfirm: "da confermare", card: "Carta", cash: "Contanti", online: "Pagato online", payWith: "paghi con {n}",
      "s.sent": "Inviato", "s.accepted": "Confermato", "s.ready": "Pronto", "s.out": "In consegna", "s.done.pickup": "Ritirato", "s.done.delivery": "Consegnato",
      "new.t": "Ordine ricevuto!", "new.m": "La cucina lo sta guardando: di solito confermiamo in pochi minuti. Resta su questa pagina.",
      "slow.m": "Ci stiamo mettendo più del solito. Se hai fretta, chiamaci.",
      "accepted.t.pickup": "Confermato! Pronto alle {time}", "accepted.t.delivery": "Confermato! Arriva verso le {time}",
      "accepted.m.pickup": "Ti aspettiamo al locale. Paghi al ritiro.", "accepted.m.delivery": "Lo stiamo preparando. Paghi al rider.",
      "ready.t": "È pronto!", "ready.m": "Vieni a prenderlo quando vuoi: ti aspettiamo.",
      "out.t": "In consegna!", "out.m": "Il rider sta arrivando. Tieni il telefono a portata di mano.",
      "done.t": "Buon appetito!", "done.m": "Grazie per aver scelto Vizi Capitali. Concediti il tuo vizio anche la prossima volta.",
      "rejected.t": "Ci dispiace, non possiamo accettarlo", "rejected.m": "Motivo: {r}. Nessun addebito. Per qualsiasi cosa chiamaci.",
      "cancelled.t": "Ordine annullato", "cancelled.m": "{r}. Nessun addebito.",
      "accepted.m.paid": "Già pagato online: grazie!", "refund.m": "Motivo: {r}. Ti rimborsiamo l'importo pagato online. Per qualsiasi cosa chiamaci.",
      "notfound.t": "Ordine non trovato", "notfound.m": "Il link potrebbe essere incompleto o scaduto. Chiamaci se hai bisogno.",
      "offline.m": "Connessione assente: riprovo tra poco."
    },
    en: {
      summary: "Your order", back: "Back to the website", code: "Order #{c}", call: "Call the pizzeria", wa: "Message us on WhatsApp",
      cancel: "Cancel order", cancelConfirm: "Do you really want to cancel your order?", subtotal: "Subtotal", discount: "Discount",
      delivery: "Delivery", total: "Total", toConfirm: "to be confirmed", card: "Card", cash: "Cash", online: "Paid online", payWith: "paying with {n}",
      "s.sent": "Sent", "s.accepted": "Confirmed", "s.ready": "Ready", "s.out": "On its way", "s.done.pickup": "Collected", "s.done.delivery": "Delivered",
      "new.t": "Order received!", "new.m": "The kitchen is looking at it: we usually confirm within a few minutes. Stay on this page.",
      "slow.m": "This is taking longer than usual. If you're in a hurry, call us.",
      "accepted.t.pickup": "Confirmed! Ready at {time}", "accepted.t.delivery": "Confirmed! Arriving around {time}",
      "accepted.m.pickup": "See you at the pizzeria. Pay on collection.", "accepted.m.delivery": "We're making it now. Pay the rider.",
      "ready.t": "It's ready!", "ready.m": "Come and collect it whenever you like.",
      "out.t": "On its way!", "out.m": "The rider is coming. Keep your phone handy.",
      "done.t": "Enjoy!", "done.m": "Thanks for choosing Vizi Capitali.",
      "rejected.t": "Sorry, we can't accept it", "rejected.m": "Reason: {r}. You haven't been charged. Call us for anything.",
      "cancelled.t": "Order cancelled", "cancelled.m": "{r}. You haven't been charged.",
      "accepted.m.paid": "Already paid online: thank you!", "refund.m": "Reason: {r}. We'll refund the amount you paid online. Call us for anything.",
      "notfound.t": "Order not found", "notfound.m": "The link may be incomplete or expired. Call us if you need help.",
      "offline.m": "No connection: retrying shortly."
    }
  };
  var t = function (k, v) {
    var s = T[lang][k] || T.it[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  };
  var money = function (n) { return new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-GB", { style: "currency", currency: "EUR" }).format(n); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  document.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
  var phone = String(CONFIG.phone || "");
  $("[data-call]").href = "tel:" + phone.replace(/[^\d+]/g, "");
  $("[data-call]").textContent = t("call") + " · " + phone;
  $("[data-wa]").href = "https://wa.me/" + String(CONFIG.whatsapp || "").replace(/\D/g, "") + "?text=" + encodeURIComponent((lang === "it" ? "Ciao! Riguardo al mio ordine #" : "Hi! About my order #") + code);
  $("[data-wa]").textContent = t("wa");
  $("[data-code]").textContent = code ? t("code", { c: code }) : "";

  var FINAL = ["done", "rejected", "cancelled"];
  var alertAfter = ((CONFIG.ordering || {}).alertAfterMin || 5) * 60;
  var timer;

  function render(res) {
    var o = res.order, s = o.status, pick = o.mode === "pickup";
    var title, msg;
    if (s === "new") {
      title = t("new.t");
      msg = Date.now() / 1000 - o.createdAt > alertAfter ? t("slow.m") : t("new.m");
    } else if (s === "accepted") {
      title = t("accepted.t." + (pick ? "pickup" : "delivery"), { time: o.readyAt || "" });
      msg = o.payment === "online" ? t("accepted.m.paid") : t("accepted.m." + (pick ? "pickup" : "delivery"));
    } else if (s === "rejected" || s === "cancelled") {
      title = t(s + ".t");
      msg = t(o.payment === "online" ? "refund.m" : s + ".m", { r: o.rejectReason || "" });
    } else {
      title = t(s + ".t");
      msg = t(s + ".m");
    }
    $("[data-title]").textContent = title;
    $("[data-msg]").textContent = msg;
    $("[data-card]").className = "track-card track-card--" + s;

    // progress steps
    var steps = ["sent", "accepted", pick ? "ready" : "out", "done"];
    var order = { new: 0, accepted: 1, ready: 2, out: 2, done: 3 };
    var at = order[s];
    $("[data-steps]").hidden = at == null;
    $("[data-steps]").innerHTML = steps.map(function (k, i) {
      var label = k === "done" ? t("s.done." + (pick ? "pickup" : "delivery")) : t("s." + k);
      var cls = i < at ? "is-done" : i === at ? "is-now" : "";
      return '<li class="' + cls + '"' + (i === at ? ' aria-current="step"' : "") + "><span></span>" + esc(label) + "</li>";
    }).join("");

    // summary
    $("[data-summary]").hidden = false;
    $("[data-items]").innerHTML = o.items.map(function (l) {
      return "<li><span>" + l.qty + "× " + esc(l.name) + "</span><span>" + money(l.total) + "</span></li>";
    }).join("");
    var rows = [[t("subtotal"), money(o.subtotal)]];
    if (o.discount) rows.push([t("discount") + (o.promo ? " (" + o.promo + ")" : ""), "−" + money(o.discount)]);
    if (o.mode === "delivery") rows.push([t("delivery"), o.fee == null ? t("toConfirm") : money(o.fee)]);
    rows.push([t("total"), money(o.total) + " · " + (o.payment === "cash" ? t("cash") + (o.cashWith ? ", " + t("payWith", { n: money(o.cashWith) }) : "") : o.payment === "online" ? t("online") : t("card"))]);
    $("[data-sums]").innerHTML = rows.map(function (r, i) {
      return '<div class="' + (i === rows.length - 1 ? "track-total" : "") + '"><dt>' + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("");

    var cancel = $("[data-cancel]");
    cancel.hidden = !res.canCancel;
    cancel.textContent = t("cancel");

    if (FINAL.indexOf(s) !== -1) clearInterval(timer);
  }

  function notFound() {
    $("[data-title]").textContent = t("notfound.t");
    $("[data-msg]").textContent = t("notfound.m");
    $("[data-steps]").hidden = true;
    clearInterval(timer);
  }

  function load() {
    if (!code || !token) { notFound(); return; }
    fetch("api/status.php?c=" + encodeURIComponent(code) + "&t=" + encodeURIComponent(token), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (res && res.ok) render(res); else notFound(); })
      .catch(function () { $("[data-msg]").textContent = t("offline.m"); });
  }

  $("[data-cancel]").addEventListener("click", function () {
    if (!confirm(t("cancelConfirm"))) return;
    fetch("api/status.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c: code, t: token, action: "cancel" }) })
      .then(function (r) { return r.json(); })
      .then(function () { load(); })
      .catch(load);
  });

  load();
  timer = setInterval(function () { if (document.visibilityState === "visible") load(); }, 10000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") load(); });
})();
