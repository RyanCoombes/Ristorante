/* =====================================================================
   Vizi Capitali · site logic
   Content lives in data/config.js, data/menu.js and data/i18n.js —
   there should be no need to edit this file to update the site.
   ===================================================================== */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  var MENU = window.MENU || [];
  var I18N = window.I18N || {};
  var LANGS = ["it", "en"];
  var STORE_LANG = "vc-lang";
  var STORE_CART = "vc-cart";
  var STORE_CUSTOMER = "vc-customer";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---------- storage (may be unavailable in private mode) ----------
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  // ---------- language ----------
  var lang = (function () {
    var q = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(q) !== -1) return q;
    var stored = load(STORE_LANG, null);
    return LANGS.indexOf(stored) !== -1 ? stored : "it";
  })();

  function t(key, vars) {
    var s = (I18N[lang] && I18N[lang][key]) || (I18N.it && I18N.it[key]) || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  function pick(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.it || "";
  }
  function money(n) {
    return new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-GB", { style: "currency", currency: "EUR" }).format(n);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function applyStaticText() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", t("meta.description"));
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang)); });
    var map = $("[data-map]");
    if (map) map.title = t("visit.mapTitle");
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1 || next === lang) return;
    lang = next;
    save(STORE_LANG, lang);
    renderAll();
  }

  // ---------- opening hours ----------
  function toMin(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function slotsFor(day) {
    return ((CONFIG.hours || {})[day] || []).map(function (s) {
      var o = toMin(s[0]), c = toMin(s[1]);
      if (c <= o) c += 1440; // closes after midnight
      return { open: o, close: c, label: s };
    });
  }
  function nowInZone() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: CONFIG.timeZone || "Europe/Rome",
      weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var get = function (type) { return parts.filter(function (p) { return p.type === type; })[0].value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day: day, min: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
  }
  function openStatus() {
    var now = nowInZone();
    var today = slotsFor(now.day);
    var yesterday = slotsFor((now.day + 6) % 7);
    var i, s;
    for (i = 0; i < today.length; i++) {
      s = today[i];
      if (now.min >= s.open && now.min < s.close) return { open: true, until: s.label[1] };
    }
    for (i = 0; i < yesterday.length; i++) {
      s = yesterday[i];
      if (s.close > 1440 && now.min < s.close - 1440) return { open: true, until: s.label[1] };
    }
    for (var d = 0; d < 8; d++) {
      var day = (now.day + d) % 7;
      var slots = slotsFor(day);
      for (i = 0; i < slots.length; i++) {
        if (d > 0 || slots[i].open > now.min) {
          var dayLabel = d === 0 ? t("status.today") : d === 1 ? t("status.tomorrow") : t("day." + day).toLowerCase();
          return { open: false, day: dayLabel, time: slots[i].label[0] };
        }
      }
    }
    return { open: false };
  }

  function renderStatus() {
    var st = openStatus();
    var text = st.open
      ? t("status.open") + " · " + t("status.until", { time: st.until })
      : t("status.closed") + (st.time ? " · " + t("status.opens", { day: st.day, time: st.time }) : "");
    $$("[data-status]").forEach(function (el) {
      el.textContent = text;
      el.classList.toggle("is-open", st.open);
      el.hidden = false;
    });
    return st;
  }

  function renderHours() {
    var table = $("[data-hours]");
    if (!table) return;
    var today = nowInZone().day;
    var order = [1, 2, 3, 4, 5, 6, 0];
    table.innerHTML = order.map(function (d) {
      var slots = (CONFIG.hours || {})[d] || [];
      var val = slots.length
        ? slots.map(function (s) { return esc(s[0]) + "–" + esc(s[1]); }).join("<br>")
        : esc(t("visit.closed"));
      return '<tr class="' + (d === today ? "is-today" : "") + '"><th scope="row">' + esc(t("day." + d)) + "</th><td>" + val + "</td></tr>";
    }).join("");
  }

  // ---------- contact details ----------
  function waUrl(text) {
    return "https://wa.me/" + String(CONFIG.whatsapp || "").replace(/\D/g, "") + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  function renderContact() {
    $$("[data-wa-link]").forEach(function (a) { a.href = waUrl(t("wa.hello")); });
    $$("[data-phone-text]").forEach(function (el) { el.textContent = CONFIG.phone || ""; });
    $$("[data-tel]").forEach(function (a) { a.href = "tel:" + String(CONFIG.phone || "").replace(/[^\d+]/g, ""); });
    $$("[data-email]").forEach(function (a) { a.href = "mailto:" + (CONFIG.email || ""); });
    $$("[data-email-text]").forEach(function (el) { el.textContent = CONFIG.email || ""; });
    $$("[data-instagram]").forEach(function (a) { a.href = "https://instagram.com/" + (CONFIG.instagram || ""); });
    $$("[data-instagram-text]").forEach(function (el) { el.textContent = "@" + (CONFIG.instagram || ""); });

    var addr = CONFIG.address || {};
    var addrEl = $("[data-address]");
    if (addrEl) addrEl.innerHTML = esc(addr.street || "") + "<br>" + esc(addr.city || "");
    var q = encodeURIComponent(addr.mapsQuery || [addr.street, addr.city].join(", "));
    var dir = $("[data-directions]");
    if (dir) dir.href = "https://www.google.com/maps/dir/?api=1&destination=" + q;
    var map = $("[data-map]");
    var mapSrc = "https://www.google.com/maps?q=" + q + "&hl=" + lang + "&output=embed";
    if (map && map.getAttribute("src") !== mapSrc) map.setAttribute("src", mapSrc);

    var year = $("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  // ---------- team ----------
  var MASCOTS = ["assets/img/mascot-welcome.png", "assets/img/mascot-peel-cream.png"];

  function renderTeam() {
    var host = $("[data-team]");
    if (!host) return;
    host.innerHTML = (CONFIG.team || []).map(function (m, i) {
      var pic = m.photo
        ? '<div class="member-pic"><img src="' + esc(m.photo) + '" alt="' + esc(m.name || pick(m.role)) + '" loading="lazy" width="400" height="500"></div>'
        : '<div class="member-pic is-mascot"><img src="' + MASCOTS[i % 2] + '" alt="" loading="lazy" width="560" height="700"></div>';
      return '<article class="member">' + pic +
        "<h3>" + esc(m.name || pick(m.role)) + "</h3>" +
        (m.name ? '<span class="role">' + esc(pick(m.role)) + "</span>" : "") +
        "<p>" + esc(pick(m.bio)) + "</p></article>";
    }).join("");
  }

  // ---------- can people order right now? ----------
  function ordering() {
    if (CONFIG.ordersOpen === false) return { ok: false, msg: t("orders.paused") };
    var st = openStatus();
    if (!st.open) {
      return { ok: false, msg: t("orders.closed") + (st.time ? " " + capital(t("status.opens", { day: st.day, time: st.time })) + "." : "") };
    }
    return { ok: true };
  }
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderOrdering() {
    var o = ordering();
    var banner = $("[data-orders-closed]");
    if (banner) { banner.hidden = o.ok; banner.textContent = o.msg || ""; }
    document.documentElement.classList.toggle("orders-off", !o.ok);
    return o.ok;
  }

  // ---------- menu ----------
  var ITEMS = {};
  MENU.forEach(function (cat) { (cat.items || []).forEach(function (it) { ITEMS[it.id] = it; }); });

  function qtyControl(item, qty) {
    if (!qty) {
      return '<button type="button" class="add" data-add="' + esc(item.id) + '" aria-label="' +
        esc(t("menu.addAria", { name: item.name })) + '">+ ' + esc(t("menu.add")) + "</button>";
    }
    return '<span class="qty">' +
      '<button type="button" data-dec="' + esc(item.id) + '" aria-label="' + esc(t("menu.removeAria", { name: item.name })) + '">−</button>' +
      '<output aria-live="polite">' + qty + "</output>" +
      '<button type="button" data-add="' + esc(item.id) + '" aria-label="' + esc(t("menu.addAria", { name: item.name })) + '">+</button>' +
      "</span>";
  }

  function renderMenu() {
    var tabs = $("[data-menu-tabs]");
    var host = $("[data-menu]");
    if (!host) return;
    tabs.innerHTML = MENU.map(function (cat) {
      return '<a href="#cat-' + esc(cat.id) + '">' + esc(pick(cat.title)) + "</a>";
    }).join("");
    host.innerHTML = MENU.map(function (cat) {
      return '<section class="menu-cat" id="cat-' + esc(cat.id) + '">' +
        '<div class="menu-cat-head"><h3>' + esc(pick(cat.title)) + "</h3>" +
        (cat.note ? "<p>" + esc(pick(cat.note)) + "</p>" : "") + "</div>" +
        '<div class="menu-grid">' + (cat.items || []).map(dishHtml).join("") + "</div></section>";
    }).join("");
  }

  function dishHtml(item) {
    var soldOut = item.available === false;
    var tags = (item.tags || []).map(function (tg) {
      return '<span class="tag tag--' + esc(tg) + '">' + esc(t("tag." + tg)) + "</span>";
    });
    if (soldOut) tags.unshift('<span class="tag tag--soldout">' + esc(t("menu.soldOut")) + "</span>");
    return '<article class="dish' + (soldOut ? " is-soldout" : "") + '" data-dish="' + esc(item.id) + '">' +
      '<h4 class="dish-name">' + esc(item.name) + "</h4>" +
      '<span class="dish-price">' + money(item.price) + "</span>" +
      '<p class="dish-desc">' + esc(pick(item.desc)) + "</p>" +
      '<div class="dish-foot"><div class="tags">' + tags.join("") + "</div>" +
      (soldOut || !ordering().ok ? "" : '<div data-ctrl="' + esc(item.id) + '">' + qtyControl(item, cart[item.id] || 0) + "</div>") +
      "</div></article>";
  }

  function refreshDishControl(id) {
    var slot = $('[data-ctrl="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (slot) slot.innerHTML = qtyControl(ITEMS[id], cart[id] || 0);
  }

  // ---------- cart ----------
  var cart = (function () {
    var stored = load(STORE_CART, {});
    var clean = {};
    Object.keys(stored).forEach(function (id) {
      if (ITEMS[id] && ITEMS[id].available !== false && stored[id] > 0) clean[id] = Math.min(99, stored[id] | 0);
    });
    return clean;
  })();

  function changeQty(id, delta) {
    if (!ITEMS[id] || ITEMS[id].available === false || !ordering().ok) return;
    var q = Math.max(0, Math.min(99, (cart[id] || 0) + delta));
    if (q) cart[id] = q; else delete cart[id];
    save(STORE_CART, cart);
    refreshDishControl(id);
    renderCart();
  }

  function cartLines() {
    return Object.keys(cart).map(function (id) {
      return { item: ITEMS[id], qty: cart[id], total: ITEMS[id].price * cart[id] };
    });
  }
  function cartCount() { return cartLines().reduce(function (n, l) { return n + l.qty; }, 0); }
  function subtotal() { return cartLines().reduce(function (n, l) { return n + l.total; }, 0); }

  var form = $("[data-cart-form]");
  function mode() {
    var r = form && form.querySelector('input[name="mode"]:checked');
    return r ? r.value : "pickup";
  }
  function deliveryOn() { return !!(CONFIG.delivery && CONFIG.delivery.enabled); }
  function fee() { return deliveryOn() && mode() === "delivery" ? Number(CONFIG.delivery.fee || 0) : 0; }

  function renderCart() {
    var count = cartCount();
    var sub = subtotal();
    var bar = $("[data-cart-open]");
    var open = ordering();
    bar.hidden = count === 0 || !open.ok;
    $("[data-cart-count]").textContent = count === 1 ? t("cart.item") : t("cart.items", { n: count });
    $("[data-cart-total]").textContent = money(sub + fee());

    var empty = count === 0;
    $("[data-cart-empty]").hidden = !empty;
    $("[data-cart-sums]").hidden = empty;
    $("[data-cart-fields]").hidden = empty;

    $("[data-cart-lines]").innerHTML = cartLines().map(function (l) {
      return "<li>" +
        '<span class="line-name">' + esc(l.item.name) + "</span>" +
        '<span class="line-price">' + money(l.total) + "</span>" +
        qtyControl(l.item, l.qty) +
        "</li>";
    }).join("");

    var f = fee();
    $("[data-sum-sub]").textContent = money(sub);
    $("[data-sum-fee-row]").hidden = !f;
    $("[data-sum-fee]").textContent = money(f);
    $("[data-sum-total]").textContent = money(sub + f);

    var delOpt = $("[data-delivery-opt]");
    delOpt.hidden = !deliveryOn();
    $("[data-address-field]").hidden = mode() !== "delivery";

    var warn = [];
    var min = deliveryOn() ? Number(CONFIG.delivery.minOrder || 0) : 0;
    var belowMin = mode() === "delivery" && min > 0 && sub < min;
    if (belowMin) warn.push(t("cart.minOrder", { amount: money(min) }));
    if (!open.ok) warn.push(open.msg);
    var warnEl = $("[data-cart-warn]");
    warnEl.hidden = empty || warn.length === 0;
    warnEl.textContent = warn.join(" ");

    $("[data-cart-send]").disabled = empty || belowMin || !open.ok;
  }

  function buildMessage(data) {
    var lines = [t("wa.greeting"), ""];
    cartLines().forEach(function (l) {
      lines.push(l.qty + "× " + l.item.name + " — " + money(l.total));
    });
    lines.push("");
    var f = fee();
    if (f) {
      lines.push(t("wa.subtotal") + ": " + money(subtotal()));
      lines.push(t("wa.delivery") + ": " + money(f));
    }
    lines.push("*" + t("wa.total") + ": " + money(subtotal() + f) + "*");
    lines.push("");
    lines.push(t("wa.name") + ": " + data.name);
    lines.push(t("wa.mode") + ": " + (data.mode === "delivery" ? t("cart.delivery") : t("cart.pickup")));
    if (data.mode === "delivery") lines.push(t("wa.address") + ": " + data.address);
    if (data.time) lines.push(t("wa.time") + ": " + data.time);
    if (data.notes) lines.push(t("wa.notes") + ": " + data.notes);
    lines.push("");
    lines.push(t("wa.thanks"));
    return lines.join("\n");
  }

  function sendOrder() {
    if (!ordering().ok) { renderCart(); return; }
    var data = {
      name: form.elements.name.value.trim(),
      mode: mode(),
      address: form.elements.address.value.trim(),
      time: form.elements.time.value.trim(),
      notes: form.elements.notes.value.trim()
    };
    var missing = [];
    if (!data.name) missing.push(form.elements.name);
    if (data.mode === "delivery" && !data.address) missing.push(form.elements.address);
    $$(".is-invalid", form).forEach(function (el) { el.classList.remove("is-invalid"); });
    if (missing.length) {
      missing.forEach(function (el) { el.classList.add("is-invalid"); el.setAttribute("aria-invalid", "true"); });
      missing[0].focus();
      var warnEl = $("[data-cart-warn]");
      warnEl.hidden = false;
      warnEl.textContent = t("cart.required");
      return;
    }
    save(STORE_CUSTOMER, { name: data.name, address: data.address });
    var url = waUrl(buildMessage(data));
    var win = window.open(url, "_blank");
    if (win) win.opener = null; else location.href = url;
  }

  // ---------- render everything for the current language ----------
  function renderAll() {
    applyStaticText();
    renderStatus();
    renderHours();
    renderContact();
    renderTeam();
    renderOrdering();
    renderMenu();
    renderCart();
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { changeQty(add.getAttribute("data-add"), 1); return; }
    var dec = e.target.closest("[data-dec]");
    if (dec) { changeQty(dec.getAttribute("data-dec"), -1); return; }
    var lb = e.target.closest("[data-lang]");
    if (lb) { setLang(lb.getAttribute("data-lang")); return; }
  });

  // mobile nav
  var navToggle = $(".nav-toggle");
  var nav = $("#nav");
  function setNav(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("data-i18n-aria", open ? "nav.close" : "nav.open");
    navToggle.setAttribute("aria-label", t(open ? "nav.close" : "nav.open"));
  }
  navToggle.addEventListener("click", function () { setNav(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  // cart dialog
  var dialog = $("[data-cart]");
  $("[data-cart-open]").addEventListener("click", function () {
    renderCart();
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
  });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  $("[data-cart-send]").addEventListener("click", sendOrder);
  $("[data-cart-clear]").addEventListener("click", function () {
    Object.keys(cart).forEach(function (id) { delete cart[id]; });
    save(STORE_CART, cart);
    renderMenu();
    renderCart();
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "mode") renderCart();
  });
  form.addEventListener("input", function (e) {
    e.target.classList.remove("is-invalid");
    e.target.removeAttribute("aria-invalid");
  });

  // remember returning customers
  var customer = load(STORE_CUSTOMER, {});
  if (customer.name) form.elements.name.value = customer.name;
  if (customer.address) form.elements.address.value = customer.address;

  // highlight the menu tab of the section in view
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$("[data-menu-tabs] a").forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    var observeCats = function () { $$(".menu-cat").forEach(function (s) { io.observe(s); }); };
    var origRenderMenu = renderMenu;
    renderMenu = function () { io.disconnect(); origRenderMenu(); observeCats(); };
  }

  renderAll();
  // re-check every minute so ordering closes/opens on time without a reload
  var wasOpen = ordering().ok;
  setInterval(function () {
    renderStatus();
    var isOpen = renderOrdering();
    if (isOpen !== wasOpen) { wasOpen = isOpen; renderMenu(); renderCart(); }
  }, 60 * 1000);
})();
