/* =====================================================================
   Vizi Capitali · site logic
   Content lives in data/config.js, data/menu.js and data/i18n.js —
   there should be no need to edit this file to update the site.
   ===================================================================== */
(function () {
  "use strict";

  // preview of unpublished changes from the admin page (only on that device)
  var PREVIEWING = false;
  try {
    if (localStorage.getItem("vc-preview") === "1") {
      var draft = JSON.parse(localStorage.getItem("vc-admin-draft") || "null");
      if (draft && draft.config && draft.menu) {
        window.SITE_CONFIG = draft.config;
        window.MENU = draft.menu;
        PREVIEWING = true;
      }
    }
  } catch (e) { /* no storage: show the published site */ }

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

  // ---------- ordering window, cut-offs and waiting times ----------
  var ORD = CONFIG.ordering || {};
  var num = function (v, d) { return isFinite(v) ? Number(v) : d; };
  function fmtTime(min) {
    var m = ((Math.round(min) % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  }
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function dayLabel(offset, day) {
    return offset === 0 ? t("status.today") : offset === 1 ? t("status.tomorrow") : t("day." + day).toLowerCase();
  }

  // services that matter right now, in minutes from today's midnight (yesterday's late shift is negative)
  function periodsAround(day) {
    var y = slotsFor((day + 6) % 7).map(function (p) { return { open: p.open - 1440, close: p.close - 1440 }; });
    return y.concat(slotsFor(day));
  }

  var REMOTE = { maintenance: false, paused: false, busy: null };   // switches from the Ordini board (api/state.php)
  function ordering() {
    if (REMOTE.paused) return { ok: false, msg: t("orders.paused") };
    var now = nowInZone();
    var early = num(ORD.startBeforeOpenMin, 0), stop = num(ORD.stopBeforeCloseMin, 0);
    if (ORD.open === false || CONFIG.ordersOpen === false) return { ok: false, msg: t("orders.paused") };
    var periods = periodsAround(now.day), i, p;
    for (i = 0; i < periods.length; i++) {
      p = periods[i];
      if (now.min >= p.open - early && now.min < p.close - stop) return { ok: true, period: p, now: now.min };
    }
    var msg = t("orders.closed");
    for (i = 0; i < periods.length; i++) {
      p = periods[i];
      if (now.min >= p.open && now.min < p.close) { msg = t("orders.cutoff"); break; }
    }
    // next time orders open
    for (var d = 0; d < 8; d++) {
      var slots = slotsFor((now.day + d) % 7);
      for (i = 0; i < slots.length; i++) {
        var start = slots[i].open - early + d * 1440;
        if (start > now.min) {
          var off = Math.floor(start / 1440);   // the start may fall on the evening before
          return { ok: false, msg: msg + " " + t("orders.reopen", { day: dayLabel(off, (now.day + off) % 7), time: fmtTime(start) }) };
        }
      }
    }
    return { ok: false, msg: msg };
  }

  function baseWait() { return num(ORD.prepMinutes, 20) + num(REMOTE.busy != null ? REMOTE.busy : ORD.busyExtraMinutes, 0); }

  function renderOrdering() {
    var o = ordering();
    var banner = $("[data-orders-closed]");
    if (banner) { banner.hidden = o.ok; banner.textContent = o.msg || ""; }
    document.documentElement.classList.toggle("orders-off", !o.ok);
    if (o.ok) {
      $$("[data-status].is-open").forEach(function (el) { el.textContent += " · " + t("status.wait", { n: baseWait() }); });
    }
    return o.ok;
  }

  // collection / delivery times offered to the customer
  function timeSlots(forMode) {
    var o = ordering();
    if (!o.ok) return [];
    var step = Math.max(5, num(ORD.slotMinutes, 15));
    var lead = baseWait() + ((forMode || mode()) === "delivery" ? zoneFor().extraMinutes || 0 : 0);
    var first = Math.ceil((Math.max(o.now, o.period.open) + lead) / step) * step;
    var out = [first];
    for (var m = first + step; m <= o.period.close; m += step) out.push(m);
    return out;
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

  var LEAF = '<svg class="ico" aria-hidden="true"><use href="#i-leaf"/></svg>';

  function dishHtml(item) {
    var soldOut = item.available === false;
    var canOrder = ordering().ok;
    var tags = (item.tags || []).map(function (tg) {
      var icon = tg === "veg" || tg === "vegan" ? LEAF : "";
      return '<span class="tag tag--' + esc(tg) + '">' + icon + esc(t("tag." + tg)) + "</span>";
    });
    if (soldOut) tags.unshift('<span class="tag tag--soldout">' + esc(t("menu.soldOut")) + "</span>");
    var allergens = (item.allergens || []).map(function (a) { return t("allergen." + a); });
    return '<article class="dish' + (soldOut ? " is-soldout" : "") + (item.image ? " has-img" : "") + '" data-dish="' + esc(item.id) + '">' +
      (item.image ? '<img class="dish-img" src="' + esc(item.image) + '" alt="' + esc(item.name) + '" loading="lazy" width="96" height="96">' : "") +
      '<h4 class="dish-name">' + esc(item.name) + "</h4>" +
      '<span class="dish-price">' + money(item.price) + "</span>" +
      '<p class="dish-desc">' + esc(pick(item.desc)) + "</p>" +
      (allergens.length ? '<p class="dish-allergens"><strong>' + esc(t("menu.allergensLabel")) + ":</strong> " + esc(allergens.join(", ")) + "</p>" : "") +
      '<div class="dish-foot"><div class="tags">' + tags.join("") + "</div>" +
      (soldOut || !canOrder ? "" : '<div data-ctrl="' + esc(item.id) + '">' + qtyControl(item, cart[item.id] || 0) + "</div>") +
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
  var round2 = function (n) { return Math.round(n * 100) / 100; };

  var form = $("[data-cart-form]");
  function mode() {
    var r = form && form.querySelector('input[name="mode"]:checked');
    return r ? r.value : "pickup";
  }
  function payment() {
    var r = form && form.querySelector('input[name="payment"]:checked');
    return r ? r.value : "card";
  }

  // ---------- delivery distance ----------
  var DEL = CONFIG.delivery || {};
  var ZONES = (DEL.zones || []).slice().sort(function (a, b) { return a.upToKm - b.upToKm; });
  function deliveryOn() { return !!(DEL.enabled && ZONES.length); }
  function maxKm() { return ZONES.length ? ZONES[ZONES.length - 1].upToKm : 0; }

  // status: none | checking | ok | out | unknown
  var geo = { status: "none" };

  function kmBetween(lat1, lng1, lat2, lng2) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function setGeoPoint(lat, lng, source, query, label) {
    var shop = CONFIG.shopLocation || {};
    var km = Math.round(kmBetween(shop.lat, shop.lng, lat, lng) * 10) / 10;
    var zone = ZONES.filter(function (z) { return km <= z.upToKm; })[0];
    geo = { status: zone ? "ok" : "out", km: km, zone: zone, lat: lat, lng: lng, source: source, query: query, label: label };
  }
  // "Via del Corso 12, 00186 Roma" from a Nominatim result
  function placeLabel(a) {
    a = a || {};
    var street = [a.road || a.pedestrian || a.square || "", a.house_number || ""].join(" ").trim();
    var town = a.city || a.town || a.village || a.municipality || "";
    return [street, [a.postcode || "", town].join(" ").trim()].filter(Boolean).join(", ");
  }
  function addressQuery() {
    return form.elements.address.value.trim() + "|" + form.elements.civico.value.trim() + "|" + form.elements.cap.value.trim();
  }
  // the zone to use for fees/times: the verified one, or the nearest ring as a best guess
  function zoneFor() { return geo.zone || ZONES[0] || {}; }

  var NOMINATIM = "https://nominatim.openstreetmap.org/";

  function checkAddress(then) {
    var civico = form.elements.civico.value.trim();
    var street = (form.elements.address.value.trim() + " " + civico).trim();
    var cap = form.elements.cap.value.trim();
    var bad = [];
    if (!form.elements.address.value.trim()) bad.push(form.elements.address);
    if (!/\d/.test(civico)) bad.push(form.elements.civico);
    if (!/^\d{5}$/.test(cap)) bad.push(form.elements.cap);
    if (bad.length) {
      markInvalid(bad);
      if (bad.length === 1 && bad[0] === form.elements.cap) $("[data-cart-warn]").textContent = t("cart.capInvalid");
      return;
    }
    if (geo.status === "checking") return;
    var query = addressQuery();
    geo = { status: "checking" };
    renderCart();
    var area = (CONFIG.address && CONFIG.address.searchArea) || "";
    var shop = CONFIG.shopLocation || {};
    var base = NOMINATIM + "search?format=jsonv2&limit=1&addressdetails=1&countrycodes=it&accept-language=it" +
      "&viewbox=" + [shop.lng - 0.15, shop.lat + 0.15, shop.lng + 0.15, shop.lat - 0.15].join(",");
    // 1) structured search: street + CAP;  2) fall back to free text if that finds nothing
    var structured = base + "&street=" + encodeURIComponent(street) + "&postalcode=" + cap + (area ? "&city=" + encodeURIComponent(area) : "");
    var freeText = base + "&q=" + encodeURIComponent(street + ", " + cap + (area ? " " + area : ""));
    var get = function (url) {
      return fetch(url, { headers: { "Accept": "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    };
    get(structured)
      .then(function (res) { return res && res[0] ? res : get(freeText); })
      .then(function (res) {
        var hit = res && res[0];
        if (!hit) { geo = { status: "unknown", query: query }; return; }
        var found = ((hit.address && hit.address.postcode) || "").replace(/\s/g, "");
        if (found && found.slice(0, 5) !== cap) {
          geo = { status: "mismatch", query: query, found: found.slice(0, 5), cap: cap };
          return;
        }
        setGeoPoint(parseFloat(hit.lat), parseFloat(hit.lon), "address", query, placeLabel(hit.address));
        // the street exists but the map doesn't know this house number: warn, don't block
        if (!(hit.address && hit.address.house_number)) geo.noNumber = civico;
      })
      .catch(function () { geo = { status: "unknown", query: query }; })
      .then(function () { renderCart(); if (then) then(); });
  }

  function useLocation() {
    var res = $("[data-zone-result]");
    if (!navigator.geolocation) { geo = { status: "denied" }; renderCart(); return; }
    geo = { status: "checking" };
    renderCart();
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      setGeoPoint(lat, lng, "gps");
      renderCart();
      // fill in the street for the rider if the field is empty
      if (!form.elements.address.value.trim() || !form.elements.civico.value.trim() || !form.elements.cap.value.trim()) {
        fetch(NOMINATIM + "reverse?format=jsonv2&zoom=18&accept-language=it&lat=" + lat + "&lon=" + lng)
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var a = (j && j.address) || {};
            var road = a.road || a.pedestrian || "";
            if (road && !form.elements.address.value.trim()) form.elements.address.value = road;
            if (a.house_number && !form.elements.civico.value.trim()) form.elements.civico.value = a.house_number;
            if (a.postcode && !form.elements.cap.value.trim()) form.elements.cap.value = a.postcode.slice(0, 5);
            geo.label = placeLabel(a);
            geo.query = addressQuery();
            renderCart();
          })
          .catch(function () { /* the coordinates alone are enough */ });
      }
    }, function () {
      geo = { status: "denied" };
      renderCart();
      if (res) res.focus && res.focus();
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  // ---------- promo codes ----------
  var promoCode = null;
  var promoDef = null;   // the code's rules as checked by the server (the list itself is not public)
  function todayISO() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: CONFIG.timeZone || "Europe/Rome" }).format(new Date());
  }
  function evalPromo(code, sub) {
    if (!code) return null;
    if (promoDef === "checking") return { ok: false, keep: true, msg: t("cart.promoChecking") };
    var p = promoDef && String(promoDef.code).toUpperCase() === code ? promoDef :
      (CONFIG.promoCodes || []).filter(function (c) { return String(c.code).toUpperCase() === code; })[0];
    if (!p || (p.validUntil && todayISO() > p.validUntil)) return { ok: false, msg: t("cart.promoInvalid") };
    if (p.minOrder && sub < p.minOrder) return { ok: false, keep: true, msg: t("cart.promoMin", { code: p.code, amount: money(p.minOrder) }) };
    var discount = p.type === "percent" ? round2(sub * p.value / 100) : p.type === "fixed" ? Math.min(p.value, sub) : 0;
    return { ok: true, code: p.code, discount: discount, freeDelivery: p.type === "freeDelivery", msg: t("cart.promoOk", { code: p.code }) };
  }

  // ---------- totals ----------
  function totals() {
    var sub = subtotal();
    var promo = evalPromo(promoCode, sub);
    var discount = promo && promo.ok ? promo.discount : 0;
    var fee = 0, feeKnown = true;
    if (deliveryOn() && mode() === "delivery") {
      if (geo.status === "ok") fee = geo.zone.fee || 0;
      else { fee = 0; feeKnown = false; }
      if (promo && promo.ok && promo.freeDelivery) { fee = 0; feeKnown = true; }
    }
    return { sub: sub, promo: promo, discount: discount, fee: fee, feeKnown: feeKnown, total: round2(sub - discount + fee) };
  }

  var MAX_SLOTS = 8;
  function selectedTime() {
    var r = form.querySelector('input[name="time"]:checked');
    return r ? { value: r.value, label: r.getAttribute("data-time") } : { value: "asap", label: "" };
  }
  function renderTimes() {
    var host = $("[data-time]");
    var prev = selectedTime().value;
    var slots = timeSlots().slice(0, MAX_SLOTS);
    host.innerHTML = slots.map(function (m, i) {
      var value = i === 0 ? "asap" : fmtTime(m);
      var label = i === 0 ? t("cart.asap", { time: fmtTime(m) }) : fmtTime(m);
      return '<label class="slot' + (i === 0 ? " slot--asap" : "") + '"><input type="radio" name="time" value="' + value + '" data-time="' + fmtTime(m) + '"' +
        ((value === prev || (i === 0 && !prev)) ? " checked" : "") + "><span>" + esc(label) + "</span></label>";
    }).join("");
    if (!form.querySelector('input[name="time"]:checked') && host.querySelector("input")) host.querySelector("input").checked = true;
  }
  function renderModeInfo() {
    var p = timeSlots("pickup")[0], d = timeSlots("delivery")[0];
    var z = zoneFor();
    $('[data-mode-info="pickup"]').textContent = p != null ? t("cart.pickupInfo", { time: fmtTime(p) }) : "";
    $('[data-mode-info="delivery"]').textContent = d != null
      ? t("cart.deliveryInfo", { time: fmtTime(d), fee: money(geo.status === "ok" ? geo.zone.fee || 0 : (ZONES[0] || {}).fee || 0), min: money(z.minOrder || 0) })
      : "";
  }

  function renderZone() {
    var el = $("[data-zone-result]");
    var msg = "", cls = "";
    if (geo.status === "checking") msg = t("cart.checking");
    else if (geo.status === "ok") {
      cls = "is-ok";
      msg = t("cart.zoneOk", { addr: geo.label || "", km: String(geo.km).replace(".", lang === "it" ? "," : "."), fee: money(geo.zone.fee || 0), min: money(geo.zone.minOrder || 0) }).replace("✓  · ", "✓ ");
      if (geo.noNumber) { msg += " " + t("cart.noNumber", { n: geo.noNumber }); cls = ""; }
    } else if (geo.status === "out") {
      cls = "is-bad";
      msg = t("cart.zoneOut", { max: maxKm(), km: String(geo.km).replace(".", lang === "it" ? "," : ".") });
    } else if (geo.status === "unknown") msg = t("cart.zoneUnknown");
    else if (geo.status === "mismatch") { cls = "is-bad"; msg = t("cart.capMismatch", { found: geo.found, cap: geo.cap }); }
    else if (geo.status === "denied") { cls = "is-bad"; msg = t("cart.geoDenied"); }
    el.hidden = !msg;
    el.textContent = msg;
    el.className = "zone-result " + cls;
    $("[data-check-address]").disabled = geo.status === "checking";
  }

  function renderCart() {
    var count = cartCount();
    var tot = totals();
    var bar = $("[data-cart-open]");
    var open = ordering();
    var delivery = deliveryOn() && mode() === "delivery";
    bar.hidden = count === 0 || !open.ok;
    $("[data-cart-count]").textContent = count === 1 ? t("cart.item") : t("cart.items", { n: count });
    $("[data-cart-total]").textContent = money(tot.total);

    var empty = count === 0;
    $("[data-cart-empty]").hidden = !empty;
    $("[data-cart-sums]").hidden = empty;
    $("[data-cart-fields]").hidden = empty;

    $("[data-cart-lines]").innerHTML = cartLines().map(function (l) {
      return '<li class="' + (l.item.image ? "has-img" : "") + '">' +
        (l.item.image ? '<img class="line-img" src="' + esc(l.item.image) + '" alt="" width="56" height="56">' : "") +
        '<span class="line-name">' + esc(l.item.name) + "</span>" +
        '<span class="line-price">' + money(l.total) + "</span>" +
        qtyControl(l.item, l.qty) +
        "</li>";
    }).join("");

    $("[data-sum-sub]").textContent = money(tot.sub);
    $("[data-sum-disc-row]").hidden = !tot.discount;
    $("[data-sum-disc-label]").textContent = t("cart.discount") + (tot.promo && tot.promo.code ? " (" + tot.promo.code + ")" : "");
    $("[data-sum-disc]").textContent = "−" + money(tot.discount);
    $("[data-sum-fee-row]").hidden = !delivery;
    $("[data-sum-fee-label]").textContent = geo.status === "ok" ? t("cart.deliveryFeeKm", { km: String(geo.km).replace(".", lang === "it" ? "," : ".") }) : t("cart.deliveryFee");
    $("[data-sum-fee]").textContent = tot.feeKnown ? money(tot.fee) : t("cart.toConfirm");
    $("[data-sum-total]").textContent = money(tot.total);

    $("[data-delivery-opt]").hidden = !deliveryOn();
    $("[data-address-field]").hidden = !delivery;
    renderZone();
    renderTimes();
    renderModeInfo();
    $("[data-continue-total]").textContent = money(tot.total) + (tot.feeKnown ? "" : " +");

    var promoEl = $("[data-promo-result]");
    promoEl.hidden = !tot.promo;
    if (tot.promo) {
      promoEl.textContent = tot.promo.msg;
      promoEl.className = "promo-result " + (tot.promo.ok ? "is-ok" : "is-bad");
    }

    var warn = [];
    var min = delivery ? Number(zoneFor().minOrder || 0) : 0;
    var belowMin = delivery && min > 0 && tot.sub < min;
    if (belowMin) warn.push(t("cart.minOrder", { amount: money(min) }));
    if (!open.ok) warn.push(open.msg);
    var warnEl = $("[data-cart-warn]");
    warnEl.hidden = empty || warn.length === 0 || step === "sent";
    warnEl.textContent = warn.join(" ");

    var blocked = empty || belowMin || !open.ok ||
      (delivery && (geo.status === "out" || geo.status === "checking" || geo.status === "mismatch"));
    $("[data-cart-continue]").disabled = blocked;
    $("[data-cart-send]").disabled = blocked;
    $("[data-cart-submit]").disabled = blocked || submitting;
    if (step === "review" && empty) step = "order";
    renderStep();
  }

  // ---------- checkout steps: order -> review -> sent ----------
  var step = "order";
  var CHANNEL = ORD.channel === "website" ? "website" : "whatsapp";
  var webFailed = false;   // the order server isn't reachable (e.g. site opened as plain files): fall back to WhatsApp
  var lastWaUrl = "";
  var STEP_TITLE = { order: "cart.titleOrder", review: "cart.titleReview", sent: "cart.titleSent" };

  function renderStep() {
    dialog.setAttribute("data-step", step);
    $$("[data-panel]").forEach(function (el) { el.hidden = el.getAttribute("data-panel") !== step; });
    $$("[data-foot]").forEach(function (el) { el.hidden = el.getAttribute("data-foot") !== step; });
    $("[data-step-back]").hidden = step !== "review";
    $("[data-step-label]").textContent = step === "order" ? t("cart.step1") : step === "review" ? t("cart.step2") : "";
    $("[data-cart-title]").textContent = t(STEP_TITLE[step]);
    var web = CHANNEL === "website" && !webFailed;
    $("[data-cart-submit]").hidden = !web;
    $("[data-cart-send]").hidden = web;
    $$("[data-wa-only]").forEach(function (el) { el.hidden = web; });
    $("[data-email-field]").hidden = !web;
    $("[data-send-hint]").textContent = web ? t("cart.sendHintWeb") : t("cart.sendHint");
    $("[data-submit-total]").textContent = money(totals().total);
    renderCashOptions();
    if (step === "review") renderReview();
  }

  function goStep(next) {
    step = next;
    renderCart();
    $("[data-cart-body]").scrollTop = 0;
    $("[data-cart-title]").focus({ preventScroll: true });
  }

  function collectData() {
    var tm = selectedTime();
    return {
      mode: deliveryOn() ? mode() : "pickup",
      address: form.elements.address.value.trim(),
      civico: form.elements.civico.value.trim(),
      cap: form.elements.cap.value.trim(),
      buzzer: form.elements.buzzer.value.trim(),
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      cashWith: payment() === "cash" ? cashWith() : null,
      time: tm.value,
      timeLabel: tm.label,
      payment: payment(),
      notes: form.elements.notes.value.trim()
    };
  }

  // checks that step 1 is complete; runs `then` when it is (possibly after an address lookup)
  function validateOrder(then) {
    if (!ordering().ok) { renderCart(); return; }
    var data = collectData();
    $$(".is-invalid", form).forEach(function (el) { el.classList.remove("is-invalid"); });
    if (data.mode === "delivery") {
      if (!data.address || !/\d/.test(data.civico) || !/^\d{5}$/.test(data.cap)) { checkAddress(); return; }   // flags the missing field
      if (geo.status === "none") { checkAddress(function () { validateOrder(then); }); return; }
      if (geo.status === "out" || geo.status === "checking" || geo.status === "mismatch") return;
    }
    var bad = [];
    if (data.name.length < 2) bad.push(form.elements.name);
    if (!validPhone(data.phone)) bad.push(form.elements.phone);
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) bad.push(form.elements.email);
    if (bad.length) {
      markInvalid(bad);
      if (bad.length === 1 && bad[0] === form.elements.phone) $("[data-cart-warn]").textContent = t("cart.badPhone");
      return;
    }
    then(data);
  }

  function validPhone(p) { return /^\+?\d{8,15}$/.test(String(p).replace(/[\s().\/-]/g, "")); }

  // ---------- cash: "what will you pay with?" so the rider brings change ----------
  function cashWith() {
    var r = form.querySelector('input[name="cashwith"]:checked');
    return r && r.value !== "exact" ? parseInt(r.value, 10) : null;
  }
  function renderCashOptions() {
    var box = $("[data-cash-with]");
    var show = payment() === "cash";
    box.hidden = !show;
    if (!show) return;
    var total = totals().total;
    var prev = (form.querySelector('input[name="cashwith"]:checked') || {}).value || "exact";
    var opts = [["exact", t("cart.cashExact")]].concat((ORD.cashOptions || [20, 50])
      .filter(function (n) { return n > total; }).map(function (n) { return [String(n), money(n)]; }));
    $("[data-cash-options]").innerHTML = opts.map(function (o) {
      return '<label class="slot"><input type="radio" name="cashwith" value="' + o[0] + '"' + (o[0] === prev ? " checked" : "") + "><span>" + esc(o[1]) + "</span></label>";
    }).join("");
    if (!form.querySelector('input[name="cashwith"]:checked')) form.querySelector('input[name="cashwith"]').checked = true;
  }

  function renderReview() {
    var data = collectData();
    var tot = totals();
    $("[data-review-lines]").innerHTML = cartLines().map(function (l) {
      return "<li>" + (l.item.image ? '<img src="' + esc(l.item.image) + '" alt="" width="40" height="40">' : "<span></span>") +
        '<span class="rl-name">' + l.qty + " × " + esc(l.item.name) + '</span><span class="rl-price">' + money(l.total) + "</span></li>";
    }).join("");
    var area = (CONFIG.address && CONFIG.address.searchArea) || "";
    var rows = [[t("cart.detailMode"), data.mode === "delivery" ? t("cart.delivery") : t("cart.pickup")]];
    rows.push([t("cart.reviewContact"), data.name + " · " + data.phone]);
    if (data.mode === "delivery") rows.push([t("cart.detailAddress"), data.address + " " + data.civico + ", " + data.cap + (area ? " " + area : "") + (data.buzzer ? " · " + data.buzzer : "")]);
    rows.push([t("cart.detailTime"), data.time === "asap" ? t("cart.asap", { time: data.timeLabel }) : data.time]);
    rows.push([t("cart.detailPayment"), t(data.payment === "cash" ? "cart.cash" : "cart.card") + (data.cashWith ? " · " + money(data.cashWith) : "")]);
    if (data.notes) rows.push([t("cart.detailNotes"), data.notes]);
    $("[data-review-details]").innerHTML = rows.map(function (r) {
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("");
    $("[data-wa-preview]").textContent = buildMessage(data);
    var sums = [[t("cart.subtotal"), money(tot.sub)]];
    if (tot.discount) sums.push([t("cart.discount") + " (" + tot.promo.code + ")", "−" + money(tot.discount)]);
    if (data.mode === "delivery") sums.push([geo.status === "ok" ? t("cart.deliveryFeeKm", { km: String(geo.km).replace(".", lang === "it" ? "," : ".") }) : t("cart.deliveryFee"), tot.feeKnown ? money(tot.fee) : t("cart.toConfirm")]);
    $("[data-review-sums]").innerHTML = sums.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") +
      '<div class="cart-total"><dt>' + esc(t("cart.total")) + "</dt><dd>" + esc(money(tot.total)) + "</dd></div>";
    $("[data-sent-summary]").textContent = cartLines().map(function (l) { return l.qty + "× " + l.item.name; }).join(", ") + " · " + money(tot.total);
  }

  function buildMessage(data) {
    var tot = totals();
    var km = function (v) { return String(v).replace(".", lang === "it" ? "," : "."); };
    var lines = [t("wa.greeting"), ""];
    cartLines().forEach(function (l) {
      lines.push(l.qty + "× " + l.item.name + " — " + money(l.total));
    });
    lines.push("");
    if (tot.discount || data.mode === "delivery") lines.push(t("wa.subtotal") + ": " + money(tot.sub));
    if (tot.discount) lines.push(t("wa.discount") + " (" + tot.promo.code + "): −" + money(tot.discount));
    if (data.mode === "delivery") lines.push(t("wa.delivery") + ": " + (tot.feeKnown ? money(tot.fee) : t("cart.toConfirm")));
    lines.push("*" + t("wa.total") + ": " + money(tot.total) + (tot.feeKnown ? "" : " + " + t("wa.delivery").toLowerCase()) + "*");
    lines.push("");
    lines.push(t("wa.name") + ": " + data.name + " · " + data.phone);
    lines.push(t("wa.mode") + ": " + (data.mode === "delivery" ? t("cart.delivery") : t("cart.pickup")));
    if (data.mode === "delivery") {
      var area = (CONFIG.address && CONFIG.address.searchArea) || "";
      lines.push(t("wa.address") + ": " + data.address + " " + data.civico + ", " + data.cap + (area ? " " + area : ""));
      if (data.buzzer) lines.push(t("wa.buzzer") + ": " + data.buzzer);
      lines.push(t("wa.distance") + ": " + (geo.status === "ok" ? km(geo.km) + " km" : t("wa.toCheck")));
      if (geo.lat) lines.push(t("wa.map") + ": https://maps.google.com/?q=" + geo.lat.toFixed(5) + "," + geo.lng.toFixed(5));
    }
    lines.push(t("wa.time") + ": " + (data.time === "asap" ? t("wa.asap", { time: data.timeLabel }) : data.time));
    lines.push(t("wa.payment") + ": " + t(data.payment === "cash" ? "cart.cash" : "cart.card") + (data.cashWith ? " (" + money(data.cashWith) + ")" : ""));
    if (data.notes) lines.push(t("wa.notes") + ": " + data.notes);
    lines.push("");
    lines.push(t("wa.thanks"));
    return lines.join("\n");
  }

  function markInvalid(els) {
    els.forEach(function (el) { el.classList.add("is-invalid"); el.setAttribute("aria-invalid", "true"); });
    if (els[0]) els[0].focus();
    var warnEl = $("[data-cart-warn]");
    warnEl.hidden = false;
    warnEl.textContent = t("cart.required");
  }

  function openWhatsApp(url) {
    var win = window.open(url, "_blank");
    if (win) win.opener = null; else location.href = url;
  }

  function sendOrder() {
    validateOrder(function (data) {
      save(STORE_CUSTOMER, { address: data.address, civico: data.civico, cap: data.cap, buzzer: data.buzzer, payment: data.payment,
        mode: data.mode, name: data.name, phone: data.phone, email: data.email });
      lastWaUrl = waUrl(buildMessage(data));
      openWhatsApp(lastWaUrl);
      goStep("sent");
    });
  }

  var submitting = false;
  var LAST_ORDER = "vc-last-order";
  function submitOrder() {
    validateOrder(function (data) {
      if (submitting) return;
      submitting = true;
      var btn = $("[data-cart-submit]");
      btn.firstElementChild.textContent = t("cart.sending");
      renderCart();
      save(STORE_CUSTOMER, { address: data.address, civico: data.civico, cap: data.cap, buzzer: data.buzzer, payment: data.payment,
        mode: data.mode, name: data.name, phone: data.phone, email: data.email });
      var payload = {
        items: cart, mode: data.mode, name: data.name, phone: data.phone, email: data.email,
        street: data.address, civico: data.civico, cap: data.cap, buzzer: data.buzzer,
        lat: geo.status === "ok" ? geo.lat : null, lng: geo.status === "ok" ? geo.lng : null,
        slot: data.time, payment: data.payment, cashWith: data.cashWith, notes: data.notes,
        promo: promoCode || "", lang: lang, website: form.elements.website.value
      };
      fetch("api/order.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: "network", status: r.status }; }); })
        .then(function (res) {
          submitting = false;
          btn.firstElementChild.textContent = t("cart.sendWeb");
          if (res && res.ok) {
            save(LAST_ORDER, { c: res.code, t: res.token, at: Date.now() });
            Object.keys(cart).forEach(function (id) { delete cart[id]; });
            save(STORE_CART, cart);
            location.href = "ordine.html?c=" + encodeURIComponent(res.code) + "&t=" + encodeURIComponent(res.token) + (lang === "en" ? "&lang=en" : "");
            return;
          }
          var err = (res && res.error) || "network";
          if (err === "invalid" && res.fields) {
            var map = { name: "name", phone: "phone", email: "email", street: "address", civico: "civico", cap: "cap" };
            step = "order"; renderCart();
            markInvalid(res.fields.map(function (f) { return form.elements[map[f]]; }).filter(Boolean));
          }
          if (err === "maintenance" || err === "paused") { checkRemote(); err = err === "paused" ? "closed" : err; }
          if (["closed", "out_of_zone", "below_minimum", "invalid", "rate_limited", "maintenance"].indexOf(err) === -1) {
            err = "network";
            webFailed = true;               // offer WhatsApp instead
          }
          renderCart();
          var warnEl = $("[data-cart-warn]");
          warnEl.hidden = false;
          warnEl.textContent = t("err." + err);
        })
        .catch(function () {
          submitting = false;
          btn.firstElementChild.textContent = t("cart.sendWeb");
          webFailed = true;
          renderCart();
          var warnEl = $("[data-cart-warn]");
          warnEl.hidden = false;
          warnEl.textContent = t("err.network");
        });
    });
  }

  var toastTimer;
  function toast(msg) {
    var el = $("[data-toast]");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 5000);
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
    if (step !== "sent") step = "order";
    renderCart();
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
  });
  $("[data-cart-continue]").addEventListener("click", function () {
    validateOrder(function () { goStep("review"); });
  });
  $("[data-step-back]").addEventListener("click", function () { goStep("order"); });
  dialog.addEventListener("click", function (e) {
    var g = e.target.closest("[data-goto]");
    if (g) goStep(g.getAttribute("data-goto"));
  });
  $("[data-sent-again]").addEventListener("click", function () { if (lastWaUrl) openWhatsApp(lastWaUrl); });
  $("[data-sent-yes]").addEventListener("click", function () {
    Object.keys(cart).forEach(function (id) { delete cart[id]; });
    save(STORE_CART, cart);
    promoCode = null;
    promoDef = null;
    form.elements.promo.value = "";
    form.elements.notes.value = "";
    step = "order";
    dialog.close();
    renderMenu();
    renderCart();
    toast(t("sent.thanks"));
  });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  $("[data-cart-send]").addEventListener("click", sendOrder);
  $("[data-cart-submit]").addEventListener("click", submitOrder);
  $("[data-cart-clear]").addEventListener("click", function () {
    Object.keys(cart).forEach(function (id) { delete cart[id]; });
    save(STORE_CART, cart);
    renderMenu();
    renderCart();
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "mode" || e.target.name === "payment") renderCart();
    if (e.target.name === "cashwith") renderReview();
  });
  form.addEventListener("input", function (e) {
    e.target.classList.remove("is-invalid");
    e.target.removeAttribute("aria-invalid");
    // a typed address that changed since it was checked needs checking again
    if ((e.target.name === "address" || e.target.name === "civico" || e.target.name === "cap") && geo.source !== "gps" &&
        geo.status !== "none" && geo.status !== "checking" && geo.query !== addressQuery()) {
      geo = { status: "none" };
      renderCart();
    }
    // check the address by itself once street and a full CAP are typed
    if ((e.target.name === "address" || e.target.name === "civico" || e.target.name === "cap") && geo.status === "none") {
      clearTimeout(autoCheck);
      autoCheck = setTimeout(function () {
        if (form.elements.address.value.trim() && /\d/.test(form.elements.civico.value) &&
            /^\d{5}$/.test(form.elements.cap.value.trim()) && geo.status === "none") checkAddress();
      }, 900);
    }
  });
  var autoCheck;
  form.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.target.tagName === "TEXTAREA") return;
    e.preventDefault();
    if (e.target.name === "address" || e.target.name === "civico" || e.target.name === "cap") checkAddress();
    if (e.target.name === "promo") applyPromo();
  });
  $("[data-check-address]").addEventListener("click", function () { checkAddress(); });
  $("[data-use-location]").addEventListener("click", useLocation);
  function applyPromo() {
    var v = form.elements.promo.value.trim().toUpperCase();
    form.elements.promo.value = v;
    promoCode = v || null;
    promoDef = null;
    if (promoCode && CHANNEL === "website") {
      promoDef = "checking";
      renderCart();
      var done = function (def) { if (promoCode !== v) return; promoDef = def; renderCart(); };
      fetch("api/promo.php?code=" + encodeURIComponent(v), { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (j) { done(j && j.ok ? j.promo : null); })
        .catch(function () { done(null); });
      return;
    }
    renderCart();
  }
  $("[data-promo-apply]").addEventListener("click", applyPromo);
  // "Usa il codice" in the strip at the top of the page (assets/js/themes.js)
  window.addEventListener("vc:promo", function (e) {
    var code = String(e.detail || "").toUpperCase();
    if (!code) return;
    form.elements.promo.value = code;
    var box = $("[data-promo-box]");
    if (box) box.open = true;
    applyPromo();
    toast(t("promo.saved", { code: code }));
  });

  // remember returning customers
  var customer = load(STORE_CUSTOMER, {});
  if (customer.address) form.elements.address.value = customer.address;
  if (customer.cap) form.elements.cap.value = customer.cap;
  if (customer.buzzer) form.elements.buzzer.value = customer.buzzer;
  if (customer.payment === "cash") form.elements.payment.value = "cash";
  if (customer.civico) form.elements.civico.value = customer.civico;
  if (customer.name) form.elements.name.value = customer.name;
  if (customer.phone) form.elements.phone.value = customer.phone;
  if (customer.email) form.elements.email.value = customer.email;
  // delivery is the default; remember a customer who prefers collection
  if (customer.mode === "pickup" || !deliveryOn()) form.elements.mode.value = "pickup";

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

  // a recent order: offer a way back to its live status page
  (function () {
    var last = load("vc-last-order", null);
    if (!last || !last.c || Date.now() - last.at > 6 * 3600 * 1000) return;
    var a = document.createElement("a");
    a.className = "order-pill";
    a.href = "ordine.html?c=" + encodeURIComponent(last.c) + "&t=" + encodeURIComponent(last.t);
    a.textContent = t("orderPill", { c: last.c });
    document.body.appendChild(a);
  })();

  if (PREVIEWING) {
    var pv = document.createElement("div");
    pv.className = "preview-bar";
    pv.innerHTML = "<span>" + esc(t("preview.on")) + '</span><button type="button">' + esc(t("preview.exit")) + "</button>";
    pv.querySelector("button").addEventListener("click", function () {
      try { localStorage.removeItem("vc-preview"); } catch (e) { /* ignore */ }
      location.reload();
    });
    document.body.appendChild(pv);
  }

  // switches set from the Ordini board: maintenance page / orders paused
  function showMaintenance(on) {
    var el = $("[data-maint]");
    if (on && !el) {
      el = document.createElement("div");
      el.className = "maint"; el.setAttribute("data-maint", "");
      el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "maint-title");
      el.innerHTML = '<div class="maint-box"><img src="assets/img/logo.png" alt="Vizi Capitali" width="1000" height="438">' +
        '<img class="maint-mascot" src="assets/img/mascot-peel.png" alt="" width="560" height="640">' +
        '<h1 id="maint-title">' + esc(t("maint.title")) + "</h1><p>" + esc(REMOTE.message || t("maint.body")) + "</p>" +
        '<div class="maint-actions"><a class="btn btn--red" href="tel:' + esc(String(CONFIG.phone || "").replace(/[^\d+]/g, "")) + '">' + esc(t("maint.call")) + "</a>" +
        '<a class="btn btn--wa" href="' + esc(waUrl(t("wa.hello"))) + '" target="_blank" rel="noopener">WhatsApp</a></div></div>';
      document.body.appendChild(el);
      document.body.style.overflow = "hidden";
    }
    if (!on && el) { el.remove(); document.body.style.overflow = ""; }
  }
  function checkRemote() {
    if (CHANNEL !== "website") return;
    fetch("api/state.php", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (st) {
      if (!st || !st.ok) return;
      var busy = typeof st.busy === "number" ? st.busy : null;
      var changed = st.paused !== REMOTE.paused || st.maintenance !== REMOTE.maintenance || busy !== REMOTE.busy;
      REMOTE = { maintenance: !!st.maintenance, paused: !!st.paused, message: st.message || "", busy: busy };
      showMaintenance(REMOTE.maintenance);
      if (changed) { renderOrdering(); renderMenu(); renderCart(); renderStatus(); }
    }).catch(function () { /* no order server (e.g. opened as files): ignore */ });
  }

  renderAll();
  checkRemote();
  setInterval(checkRemote, 60 * 1000);
  // re-check every minute so ordering closes/opens on time without a reload
  var wasOpen = ordering().ok;
  setInterval(function () {
    renderStatus();
    var isOpen = renderOrdering();
    if (isOpen !== wasOpen) { wasOpen = isOpen; renderMenu(); }
    renderCart();  // keeps the offered times current
  }, 60 * 1000);
})();
