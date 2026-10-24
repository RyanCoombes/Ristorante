/* =====================================================================
   Vizi Capitali · legal pages (privacy.html, note-legali.html)
   Shows the Italian or English text and fills in the business details
   entered in Gestione → Contatti → Dati dell'impresa.
   ===================================================================== */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  var L = CONFIG.legal || {};
  var q = new URLSearchParams(location.search).get("lang");
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem("vc-lang")); } catch (e) { /* no storage */ }
  var lang = q === "en" || q === "it" ? q : stored === "en" ? "en" : "it";

  function setLang(l) {
    lang = l;
    try { localStorage.setItem("vc-lang", JSON.stringify(l)); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
    document.querySelectorAll("[data-lang]").forEach(function (el) { el.hidden = el.getAttribute("data-lang") !== l; });
    document.querySelectorAll("[data-set-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === l)); });
    document.querySelectorAll("[data-home]").forEach(function (a) { a.href = "index.html" + (l === "en" ? "?lang=en" : ""); });
    document.querySelectorAll("[data-page-link]").forEach(function (a) { a.href = a.getAttribute("data-page-link") + (l === "en" ? "?lang=en" : ""); });
    var title = document.querySelector('[data-lang="' + l + '"] h1');
    if (title) document.title = title.textContent + " · Vizi Capitali";
    fill();
  }

  // business details; anything missing is marked so it gets filled in before launch
  function fill() {
    var addr = CONFIG.address || {};
    var values = {
      company: L.company, vat: L.vat, seat: L.seat, rea: L.rea, pec: L.pec,
      privacyEmail: L.privacyEmail || CONFIG.email, email: CONFIG.email, phone: CONFIG.phone,
      shop: [addr.street, addr.city].filter(Boolean).join(", ")
    };
    document.querySelectorAll("[data-l]").forEach(function (el) {
      var v = values[el.getAttribute("data-l")];
      if (v) {
        el.textContent = v;
        el.classList.remove("todo");
      } else {
        el.textContent = lang === "en" ? "to be completed" : "da completare";
        el.classList.add("todo");
      }
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-set-lang]");
    if (b) setLang(b.getAttribute("data-set-lang"));
  });
  setLang(lang);
})();
