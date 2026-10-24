/* =====================================================================
   Vizi Capitali · seasonal themes + the strip at the top of the page
   - Theme (Gestione → Temi, SITE_CONFIG.theme): a full re-skin loaded
     from assets/css/themes/<name>.css, with its own graphics.
   - Top strip (SITE_CONFIG.announce): a message and/or a promo code,
     with or without a theme, optionally between two dates.
   Loaded in <head> so a dark theme doesn't flash cream first.
   Preview any theme with index.html?tema=halloween (or natale, …).
   ===================================================================== */
(function () {
  "use strict";

  // dates are "MM-DD"; Easter-based holidays use days relative to Easter Sunday ("easter": [from, to]).
  // When two overlap, the higher "priority" wins: short local days beat longer seasons.
  // In the order of the year, which is also the order Gestione lists them in.
  var THEMES = {
    capodanno: {
      name: { it: "Capodanno", en: "New Year" }, title: { it: "Buon Anno", en: "Happy New Year" }, eyebrow: { it: "Edizione di mezzanotte", en: "Midnight edition" },
      swatch: "#1b1916", from: "12-28", to: "01-06", sticker: "🥂", check: "#1b1916", particles: "glitter",
      msg: { it: "Capodanno · Brindiamo a un nuovo anno di vizi", en: "New Year · A toast to a new year of vices" }
    },
    carnevale: {
      name: { it: "Carnevale", en: "Carnival" }, title: { it: "Carnevale", en: "Carnival" }, eyebrow: { it: "A Carnevale ogni vizio vale", en: "At Carnival every vice goes" },
      swatch: "#1c1424", easter: [-58, -47], sticker: "🎭", check: "#1c1424", particles: "glitter",
      msg: { it: "Carnevale · A Carnevale ogni vizio vale", en: "Carnival · At Carnival every vice goes" }
    },
    sanvalentino: {
      name: { it: "San Valentino", en: "Valentine's" }, title: { it: "San Valentino", en: "Valentine's Day" }, eyebrow: { it: "Edizione per due", en: "For two" },
      swatch: "#3a0f1b", from: "02-07", to: "02-14", priority: 2, sticker: "💘", check: "#2a0e15", particles: "petals",
      msg: { it: "San Valentino · Un vizio da condividere", en: "Valentine's Day · A vice to share" }
    },
    pasqua: {
      name: { it: "Pasqua", en: "Easter" }, title: { it: "Buona Pasqua", en: "Happy Easter" }, eyebrow: { it: "Edizione di primavera", en: "Spring edition" },
      swatch: "#3d5a40", easter: [-7, 1], sticker: "🐣", check: "#dfe7d4", particles: "blossom",   // Palm Sunday → Pasquetta
      msg: { it: "Pasqua · Buone feste da Vizi Capitali", en: "Easter · Happy holidays from Vizi Capitali" }
    },
    nataleroma: {
      name: { it: "Natale di Roma", en: "Rome's Birthday" }, title: { it: "Natale di Roma", en: "Rome's Birthday" }, eyebrow: { it: "{roman} · {age} anni", en: "{roman} · {age} years" },
      swatch: "#7a1420", from: "04-19", to: "04-21", priority: 3, sticker: "🏛️", check: "#e6d9c2", particles: "glints",
      msg: { it: "Natale di Roma · Tanti auguri, Roma: {age} anni", en: "Rome's Birthday · Happy {age}th birthday, Rome" }
    },
    repubblica: {
      name: { it: "Festa della Repubblica", en: "Republic Day" }, title: { it: "Festa della Repubblica", en: "Republic Day" }, eyebrow: { it: "2 giugno", en: "2 June" },
      swatch: "#1f5a3c", from: "05-30", to: "06-02", priority: 3, sticker: "🇮🇹", check: "#e3e8dc", particles: "",
      msg: { it: "Festa della Repubblica · Buon 2 giugno da Vizi Capitali", en: "Republic Day · Happy 2 June from Vizi Capitali" }
    },
    pietropaolo: {
      name: { it: "Santi Pietro e Paolo", en: "Saints Peter and Paul" }, title: { it: "Santi Pietro e Paolo", en: "Saints Peter and Paul" }, eyebrow: { it: "Festa di Roma", en: "Rome's feast day" },
      swatch: "#8c3b1f", from: "06-27", to: "06-29", priority: 3, sticker: "🗝️", check: "#ead8c2", particles: "glints",
      msg: { it: "Santi Pietro e Paolo · Buona festa, Roma", en: "Saints Peter and Paul · Happy feast day, Rome" }
    },
    ferragosto: {
      name: { it: "Ferragosto", en: "Ferragosto" }, title: { it: "Ferragosto", en: "Ferragosto" }, eyebrow: { it: "Edizione d'estate", en: "Summer edition" },
      swatch: "#123b63", from: "08-08", to: "08-16", sticker: "🏖️", check: "#dde7ee", particles: "",
      msg: { it: "Ferragosto · L'estate romana ha un nuovo vizio", en: "Ferragosto · Roman summer has a new vice" }
    },
    halloween: {
      name: { it: "Halloween", en: "Halloween" }, title: { it: "Halloween", en: "Halloween" }, eyebrow: { it: "Edizione notturna", en: "Night edition" },
      swatch: "#0b0908", from: "10-20", to: "11-01", sticker: "🎃", check: "#1d1714", particles: "embers",
      msg: { it: "Halloween · Una notte di vizi, fino al 1° novembre", en: "Halloween · A night of vices, until 1 November" }
    },
    natale: {
      name: { it: "Natale", en: "Christmas" }, title: { it: "Buon Natale", en: "Merry Christmas" }, eyebrow: { it: "Edizione delle feste", en: "Holiday edition" },
      swatch: "#0e1f18", from: "12-01", to: "12-27", sticker: "🎄", check: "#12261d", particles: "glints",
      msg: { it: "Natale · Il vizio più prezioso è stare insieme", en: "Christmas · The most precious vice is being together" }
    }
  };
  window.VC_THEMES = THEMES;   // the Gestione page lists these

  var CONFIG = window.SITE_CONFIG || {};
  // previewing unsaved changes from Gestione (same draft app.js uses)
  try {
    if (localStorage.getItem("vc-preview") === "1") {
      var draft = JSON.parse(localStorage.getItem("vc-admin-draft") || "null");
      if (draft && draft.config) CONFIG = draft.config;
    }
  } catch (e) { /* no storage */ }
  var TZ = CONFIG.timeZone || "Europe/Rome";

  function parts(d) {
    var p = {};
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d)
      .forEach(function (x) { p[x.type] = x.value; });
    return p;
  }
  function mmdd(d) { var p = parts(d); return p.month + "-" + p.day; }
  function isoDay(d) { var p = parts(d); return p.year + "-" + p.month + "-" + p.day; }
  function easter(y) {   // Gregorian Easter Sunday (anonymous algorithm)
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, month - 1, day, 12));
  }
  function inRange(today, from, to) {
    return from <= to ? today >= from && today <= to : today >= from || today <= to;   // ranges can cross New Year
  }
  /** This year's "MM-DD" range for a theme (Easter-based ones move). */
  function rangeFor(id, date) {
    var th = THEMES[id];
    if (!th.easter) return { from: th.from, to: th.to };
    var e = easter(Number(parts(date).year)), DAY = 864e5;
    return { from: mmdd(new Date(e.getTime() + th.easter[0] * DAY)), to: mmdd(new Date(e.getTime() + th.easter[1] * DAY)) };
  }
  window.VC_themeRange = rangeFor;
  /** Which theme the calendar suggests for a date (used by "Automatico"); on overlaps the higher priority wins. */
  function themeFor(date) {
    var today = mmdd(date), best = "", bestP = -1;
    Object.keys(THEMES).forEach(function (id) {
      var r = rangeFor(id, date), p = THEMES[id].priority || 0;
      if (inRange(today, r.from, r.to) && p > bestP) { best = id; bestP = p; }
    });
    return best;
  }
  /** Rome was founded on 21 April 753 BC: its age this year, in figures and Roman numerals. */
  function romeAge(date) {
    var n = Number(parts(date).year) + 753, out = "", num = n;
    [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]
      .forEach(function (r) { while (num >= r[0]) { out += r[1]; num -= r[0]; } });
    return { age: n, roman: out };
  }
  function fill(text) {
    var a = romeAge(new Date());
    var en = document.documentElement.lang === "en";
    return String(text).split("{age}").join(a.age.toLocaleString(en ? "en-GB" : "it-IT")).split("{roman}").join(a.roman);
  }
  window.VC_themeFor = themeFor;
  window.VC_themeText = fill;

  // the staff pages only need the list and the calendar
  if (/(admin|ordini)\.html$/.test(location.pathname)) return;

  var root = document.documentElement;
  var settings = CONFIG.theme || {};
  var mode = settings.mode || "off";
  var forced = (location.search.match(/[?&]tema=([a-z]+)/) || [])[1];
  var id = forced && THEMES[forced] ? forced : mode === "auto" ? themeFor(new Date()) : THEMES[mode] ? mode : "";
  var theme = id ? THEMES[id] : null;

  // the top strip: the staff's own message / promo code wins over the theme's greeting
  var ann = CONFIG.announce || {};
  var today = isoDay(new Date());
  // one strip at the top: shown unless switched off, between its dates if it has any.
  // Its text is the staff's own message, or the theme's greeting when they leave it empty.
  var inDates = (!ann.from || today >= ann.from) && (!ann.to || today <= ann.to);
  var annOn = ann.on !== false && inDates && !!((ann.text && (ann.text.it || ann.text.en)) || ann.code || theme);
  window.VC_ACTIVE_THEME = theme ? { id: id, name: theme.name } : null;   // app.js labels "Speciale <theme>" dishes

  if (theme) {
    root.setAttribute("data-theme", id);
    root.classList.add("lux");
    var link = document.createElement("link");
    link.rel = "stylesheet";
    // same version as the page's own files, so an update is never mixed with an old cached copy
    var ver = (document.querySelector('script[src*="themes.js?v="]') || { src: "" }).src.split("?v=")[1] || "";
    link.href = "assets/css/themes/lux.css" + (ver ? "?v=" + ver : "");
    document.head.appendChild(link);
  }
  if (!theme && !annOn) return;

  // ---------- hand-drawn graphics per theme (fine gold line, never cartoon) ----------
  // every SVG gets its own gradient id: a shared one stops painting when the SVG that
  // defines it is hidden (we hide some drawings on phones)
  var gid = 0;
  function foil(c1, c2, c3, c4) {
    var g = "lxg" + (++gid);
    return { id: "url(#" + g + ")", defs: '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 +
      '"/><stop offset=".45" stop-color="' + c2 + '"/><stop offset=".6" stop-color="' + c3 + '"/><stop offset="1" stop-color="' + c4 + '"/></linearGradient></defs>' };
  }
  function gold() { return foil("#f6e3ad", "#c9a45c", "#fff1c2", "#8a6a2e"); }
  var BAT = '<path d="M50 34c-2-6-6-9-11-8-1-6-7-11-14-12 3 4 4 8 3 12-5-2-11-1-16 3 6 1 10 4 12 9 4-3 9-3 13 0 3-3 8-4 13-4zm0 0c2-6 6-9 11-8 1-6 7-11 14-12-3 4-4 8-3 12 5-2 11-1 16 3-6 1-10 4-12 9-4-3-9-3-13 0-3-3-8-4-13-4z"/>';
  var FRAME = '<div class="lx-frame"></div>';

  var ART = {
    halloween: function () {
      var w = gold(), b = gold(), p = gold(), m = foil("#f3dfa6", "#c9a45c", "#e8cf8e", "#8a6a2e");
      return '<div class="lx-smoke"><span></span><span></span><span></span></div>' +
        '<svg class="lx-moon" viewBox="0 0 100 100">' + m.defs + '<path d="M62 6a46 46 0 1 0 32 66A38 38 0 1 1 62 6Z" fill="' + m.id + '"/></svg>' +
        '<svg class="lx-web" viewBox="0 0 200 200">' + w.defs + '<g fill="none" stroke="' + w.id + '" stroke-width=".9">' +
          '<path d="M0 0L200 120M0 0L150 200M0 0L60 200M0 0L200 40"/><path d="M0 34Q22 30 30 18Q30 8 34 0M0 70Q44 62 58 40Q62 20 68 0M0 110Q66 98 88 64Q96 32 104 0M0 150Q90 136 118 90Q130 46 140 0"/></g></svg>' +
        '<svg class="lx-bats" viewBox="0 0 300 160">' + b.defs + '<g fill="' + b.id + '"><g transform="translate(20 60) scale(.9)">' + BAT +
          '</g><g transform="translate(130 10) scale(.6)">' + BAT + '</g><g transform="translate(200 80) scale(.45)">' + BAT + '</g></g></svg>' +
        '<svg class="lx-pumpkin" viewBox="0 0 220 190">' + p.defs + '<g fill="none" stroke="' + p.id + '" stroke-width="1.6">' +
          '<ellipse cx="110" cy="118" rx="96" ry="62"/><ellipse cx="110" cy="118" rx="62" ry="66"/><ellipse cx="110" cy="118" rx="26" ry="68"/>' +
          '<path d="M106 52c0-14 2-26 10-38l9 4c-7 10-9 22-8 34"/><path d="M118 30c14-14 34-14 46-4-12 2-22 8-30 18"/></g>' +
          '<ellipse cx="110" cy="118" rx="96" ry="62" fill="' + p.id + '" opacity=".16"/></svg>' + FRAME;
    },
    natale: function () {
      return '<svg class="lx-garland" viewBox="0 0 1200 90" preserveAspectRatio="none"><g fill="none" stroke="#d4af62" stroke-width="1" opacity=".55">' +
          '<path d="M0 10Q150 80 300 10T600 10T900 10T1200 10"/><path d="M0 22Q150 86 300 22T600 22T900 22T1200 22" opacity=".5"/></g></svg>' +
        '<div class="lx-baubles">' + ["l", "m", "r"].map(function (k) {
          var g = gold();
          return '<span class="lx-b lx-b-' + k + '"><i></i><svg viewBox="0 0 80 96">' + g.defs +
            '<rect x="32" y="2" width="16" height="10" rx="2" fill="' + g.id + '"/><circle cx="40" cy="52" r="38" fill="' + g.id + '"/>' +
            '<g fill="none" stroke="#6b5220" stroke-width="1" opacity=".55"><ellipse cx="40" cy="52" rx="38" ry="9"/><path d="M6 40q34 12 68 0M6 64q34 -12 68 0"/></g>' +
            '<ellipse cx="27" cy="36" rx="8" ry="12" fill="#fff" opacity=".35" transform="rotate(30 27 36)"/></svg></span>';
        }).join("") + "</div>" + FRAME;
    },
    capodanno: function () {
      var c = "#e2c88c";
      return '<div class="lx-burst"></div>' +
        '<svg class="lx-coupe" viewBox="0 0 200 240"><g fill="none" stroke="' + c + '" stroke-width="1.8">' +
          '<path d="M30 70Q100 66 170 70Q160 130 100 132Q40 130 30 70Z"/><path d="M100 132V206"/><ellipse cx="100" cy="210" rx="44" ry="8"/><path d="M42 84Q100 92 158 84" opacity=".6"/></g>' +
          '<g fill="' + c + '" class="lx-bubbles"><circle cx="86" cy="104" r="3"/><circle cx="104" cy="96" r="2.4"/><circle cx="116" cy="110" r="2"/><circle cx="96" cy="118" r="1.8"/></g></svg>' +
        '<svg class="lx-clock" viewBox="0 0 120 120"><g fill="none" stroke="' + c + '" stroke-width="1.4"><circle cx="60" cy="60" r="54"/><circle cx="60" cy="60" r="48" opacity=".5"/></g>' +
          '<g stroke="' + c + '" stroke-width="2">' + Array.apply(null, Array(12)).map(function (_, i) {
            var a = i * Math.PI / 6, r2 = i % 3 ? 46 : 38;
            return '<line x1="' + (60 + Math.sin(a) * 42).toFixed(1) + '" y1="' + (60 - Math.cos(a) * 42).toFixed(1) + '" x2="' + (60 + Math.sin(a) * r2).toFixed(1) + '" y2="' + (60 - Math.cos(a) * r2).toFixed(1) + '"/>';
          }).join("") + '<line x1="60" y1="60" x2="60" y2="22" stroke-width="2.6"/><line x1="60" y1="60" x2="60" y2="14"/></g><circle cx="60" cy="60" r="3" fill="' + c + '"/></svg>' + FRAME;
    },
    sanvalentino: function () {
      var r = foil("#fbd9cc", "#e6a896", "#f6c8b8", "#a8675b");
      return '<svg class="lx-hearts" viewBox="0 0 240 180">' + r.defs + '<g fill="none" stroke="' + r.id + '" stroke-width="2">' +
          '<path d="M90 160C46 128 20 104 20 74 20 52 38 36 58 36c14 0 26 8 32 20 6-12 18-20 32-20 20 0 38 16 38 38 0 30-26 54-70 86Z"/>' +
          '<path d="M150 150C112 122 90 102 90 76c0-19 15-33 33-33 12 0 22 7 27 17 5-10 15-17 27-17 18 0 33 14 33 33 0 26-22 46-60 74Z"/>' +
          '<path d="M8 120L232 40"/></g><path d="M232 40l-14 2 6 6Z" fill="#e6a896"/></svg>' + FRAME;
    },
    pasqua: function () {
      var d = foil("#f4e3b0", "#c9a45c", "#fff1c2", "#8a6a2e"), e = foil("#e9d39a", "#b8963f", "#e9d39a", "#7d6224");
      return '<svg class="lx-olive" viewBox="0 0 200 80"><g fill="none" stroke="#3d5a40" stroke-width="1.6" stroke-linecap="round"><path d="M6 60C60 46 120 40 194 18"/></g>' +
          '<g fill="#7a9472"><ellipse cx="40" cy="44" rx="14" ry="4.5" transform="rotate(-30 40 44)"/><ellipse cx="62" cy="58" rx="14" ry="4.5" transform="rotate(22 62 58)"/>' +
          '<ellipse cx="92" cy="32" rx="14" ry="4.5" transform="rotate(-34 92 32)"/><ellipse cx="114" cy="46" rx="14" ry="4.5" transform="rotate(18 114 46)"/>' +
          '<ellipse cx="146" cy="18" rx="14" ry="4.5" transform="rotate(-38 146 18)"/><ellipse cx="166" cy="32" rx="14" ry="4.5" transform="rotate(14 166 32)"/></g></svg>' +
        // a gold dove carrying an olive sprig
        '<svg class="lx-dove" viewBox="0 0 210 130">' + d.defs +
          '<path d="M40 86C60 70 96 66 120 74c16 5 28 2 40-8 6-4 12-3 14 2-4 2-8 6-10 12-6 16-26 26-52 26-24 0-46-6-60-10L20 104l14-12-20-4Z" fill="' + d.id + '"/>' +
          '<path d="M96 76C92 50 104 22 132 8c-4 22 2 38 18 50-20 0-38 8-46 22Z" fill="' + d.id + '"/>' +
          '<g fill="none" stroke="#7a5a22" stroke-width="1" opacity=".55"><path d="M104 72c4-14 12-28 24-40M110 70c6-10 14-18 24-24M60 92c14 4 30 6 46 4"/></g>' +
          '<path d="M174 68l12 2-12 3Z" fill="#8a6a2e"/><circle cx="167" cy="67" r="1.6" fill="#3a2a10"/>' +
          '<path d="M184 71c6 4 10 10 12 18" fill="none" stroke="#3d5a40" stroke-width="1.4"/>' +
          '<g fill="#7a9472"><ellipse cx="190" cy="78" rx="6" ry="2.2" transform="rotate(50 190 78)"/><ellipse cx="196" cy="86" rx="6" ry="2.2" transform="rotate(-20 196 86)"/></g></svg>' +
        '<svg class="lx-eggs" viewBox="0 0 260 170">' + e.defs + '<g fill="#fbf8f1" stroke="' + e.id + '" stroke-width="1.8">' +
          '<ellipse cx="80" cy="100" rx="44" ry="58"/><ellipse cx="180" cy="104" rx="40" ry="54"/><ellipse cx="130" cy="78" rx="46" ry="62"/></g>' +
          '<g fill="none" stroke="' + e.id + '" stroke-width="1.3"><path d="M84 66l10 8 10-8 10 8 10-8 10 8 10-8 10 8M84 92h92M84 98h92M140 104l8 6 8-6 8 6M40 104q40 10 80 0M146 116q34 8 70 0"/></g>' +
          '<g fill="#b8963f"><circle cx="110" cy="120" r="2.4"/><circle cx="124" cy="128" r="2.4"/><circle cx="138" cy="120" r="2.4"/><circle cx="62" cy="80" r="2"/><circle cx="196" cy="132" r="2"/></g>' +
          '<path d="M20 156q110 -26 220 0" fill="none" stroke="#7a9472" stroke-width="1.6"/></svg>' + FRAME;
    },
    carnevale: function () {
      var g = gold();
      return '<svg class="lx-mask" viewBox="0 0 250 170">' + g.defs +
          '<path d="M30 70C30 44 70 34 120 44c50-10 90 0 90 26 0 26-24 42-54 38-18-2-28-14-36-14s-18 12-36 14c-30 4-54-12-54-38Z" fill="' + g.id + '" fill-opacity=".12" stroke="' + g.id + '" stroke-width="2"/>' +
          '<path d="M62 70c8-12 30-12 38 0-8 10-30 10-38 0ZM140 70c8-12 30-12 38 0-8 10-30 10-38 0Z" fill="#0d0a12" stroke="' + g.id + '" stroke-width="1.6"/>' +
          '<g fill="none" stroke="' + g.id + '" stroke-width="1.2"><path d="M48 88q12 8 26 2M192 88q-12 8-26 2M98 52q22-12 44 0M112 58q8-4 16 0"/>' +
          '<path d="M196 46C214 20 226 6 240 2M190 42C202 14 208 4 218 0M200 52C224 34 236 28 248 28"/>' +
          '<path d="M212 26l6-4M220 16l6-3M206 36l7-3M226 36l6 0M236 30l6 1"/></g>' +
          '<path d="M206 96l26 64" stroke="' + g.id + '" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="120" cy="52" r="3" fill="' + g.id + '"/></svg>' + FRAME;
    },
    nataleroma: function () {
      var g = foil("#e9c97a", "#b5852f", "#f2dca0", "#7a5a1e"), leaves = "";
      // leaves along a circle, from the bottom up the left side; the right branch is its mirror image
      for (var k = 0; k < 10; k++) {
        var deg = 102 + k * 13, th = deg * Math.PI / 180;
        var x = 120 + 80 * Math.cos(th), y = 112 + 80 * Math.sin(th), rot = deg + 90 - 25;
        leaves += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="13" ry="4.6" transform="rotate(' + rot + " " + x.toFixed(1) + " " + y.toFixed(1) + ')"/>' +
          '<ellipse cx="' + (240 - x).toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="13" ry="4.6" transform="rotate(' + (180 - rot) + " " + (240 - x).toFixed(1) + " " + y.toFixed(1) + ')"/>';
      }
      return '<svg class="lx-wreath" viewBox="0 0 240 220">' + g.defs +
          '<g fill="none" stroke="' + g.id + '" stroke-width="1.4"><path d="M106 190C60 180 34 140 40 96M134 190C180 180 206 140 200 96"/></g>' +
          '<g fill="' + g.id + '">' + leaves + "</g>" +
          '<path d="M108 190q12 10 24 0M112 192l-10 20M128 192l10 20" fill="none" stroke="#7a1420" stroke-width="2.2"/>' +
          '<text x="120" y="122" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="30" letter-spacing="4" fill="#7a1420">SPQR</text></svg>' + FRAME;
    },
    repubblica: function () {
      var g = gold();
      return '<svg class="lx-trails" viewBox="0 0 1200 260" preserveAspectRatio="none"><g fill="none" stroke-linecap="round" stroke-width="16" opacity=".5">' +
          '<path d="M520 250C700 120 900 40 1240 10" stroke="#2f7a4f"/><path d="M542 268C722 138 922 58 1262 28" stroke="#ffffff"/><path d="M564 286C744 156 944 76 1284 46" stroke="#c0303a"/></g>' +
          '<path d="M542 268C722 138 922 58 1262 28" fill="none" stroke="#d6d2c6" stroke-width="1" opacity=".7"/></svg>' +
        '<svg class="lx-stella" viewBox="0 0 100 100">' + g.defs + '<path d="M50 4l11 34h36l-29 21 11 35-29-21-29 21 11-35L3 38h36Z" fill="' + g.id + '"/></svg>' + FRAME;
    },
    pietropaolo: function () {
      // solid metals: a gradient can't paint a perfectly straight line (the shaft)
      var g = { id: "#c9a45c", defs: "" }, sv = { id: "#aeb3ba", defs: "" };
      var key = function (fid) {
        return '<g fill="none" stroke="' + fid + '" stroke-width="7" stroke-linejoin="round"><circle cx="100" cy="182" r="20"/><path d="M100 162V46"/></g>' +
          '<path d="M100 44h28v10h-10v8h10v10h-28Z" fill="' + fid + '"/><circle cx="100" cy="182" r="6" fill="' + fid + '"/>';
      };
      return '<svg class="lx-keys" viewBox="0 0 200 230">' + g.defs + sv.defs +
          '<g transform="rotate(-32 100 120)">' + key(g.id) + "</g><g transform=\"rotate(32 100 120) translate(200 0) scale(-1 1)\">" + key(sv.id) + "</g>" +
          "</svg>" + FRAME;
    },
    ferragosto: function () {
      return '<div class="lx-sun"></div>' +
        '<svg class="lx-umbrella" viewBox="0 0 240 280"><g transform="rotate(-10 120 120)">' +
          Array.apply(null, Array(8)).map(function (_, i) {
            var r = 112, cx = 120, cy = 116, a1 = Math.PI + i * Math.PI / 8, a2 = Math.PI + (i + 1) * Math.PI / 8;
            var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1), x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
            var nx = cx + (r - 14) * Math.cos((a1 + a2) / 2), ny = cy + (r - 14) * Math.sin((a1 + a2) / 2);
            return '<path d="M' + cx + " " + cy + "L" + x1.toFixed(1) + " " + y1.toFixed(1) + "A" + r + " " + r + " 0 0 1 " + x2.toFixed(1) + " " + y2.toFixed(1) +
              'Z" fill="' + (i % 2 ? "#fbf6ea" : "#123b63") + '" stroke="#123b63" stroke-width="1"/>' +
              '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + "Q" + nx.toFixed(1) + " " + ny.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1) + '" fill="none" stroke="#b8892f" stroke-width="1.2"/>';
          }).join("") +
          '<line x1="120" y1="116" x2="120" y2="272" stroke="#b8892f" stroke-width="3" stroke-linecap="round"/><circle cx="120" cy="2" r="5" fill="#b8892f"/><line x1="120" y1="4" x2="120" y2="116" stroke="#b8892f" stroke-width="2"/></g></svg>' +
        '<svg class="lx-waves" viewBox="0 0 1200 70" preserveAspectRatio="none"><g fill="none" stroke="currentColor" stroke-width="1.2">' +
          '<path d="M0 30Q50 18 100 30T200 30T300 30T400 30T500 30T600 30T700 30T800 30T900 30T1000 30T1100 30T1200 30"/>' +
          '<path d="M0 48Q50 36 100 48T200 48T300 48T400 48T500 48T600 48T700 48T800 48T900 48T1000 48T1100 48T1200 48" opacity=".6"/></g></svg>' + FRAME;
    }
  };

  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  ready(function () {
    var lang = function () { return root.lang === "en" ? "en" : "it"; };

    // ---------- top strip ----------
    var header = document.querySelector(".site-header");
    if (!header) return;
    var banner = document.createElement("aside");   // a landmark, so screen readers can find or skip it
    banner.className = "theme-banner";
    if (annOn) header.parentNode.insertBefore(banner, header);
    var title = null;
    function renderBanner() {
      var L = lang();
      if (title) title.innerHTML = '<span class="lx-eyebrow">' + fill(theme.eyebrow[L]) + '</span><span class="lx-word' +
        (theme.title[L].length > 14 ? " lx-word--long" : "") + '">' + theme.title[L] + "</span>";
      if (!annOn) return;
      banner.setAttribute("aria-label", L === "en" ? "News" : "Avviso");
      var custom = ann.text && (ann.text[L] || ann.text.it);
      var msg = custom || (theme ? (settings.messages && settings.messages[id] && settings.messages[id][L]) || fill(theme.msg[L]) : "");
      banner.innerHTML = "";
      if (msg) { var s = document.createElement("span"); s.textContent = msg; banner.appendChild(s); }
      if (ann.code) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "banner-code";
        b.textContent = (L === "en" ? "Use code " : "Usa il codice ") + ann.code;
        b.addEventListener("click", function () { window.dispatchEvent(new CustomEvent("vc:promo", { detail: ann.code })); });
        banner.appendChild(b);
      }
    }
    var hero = document.querySelector(".hero"), copy = document.querySelector(".hero-copy");
    // the holiday's name above the logo, in foil (can be switched off in Gestione)
    if (theme && copy && settings.title !== false) {
      title = document.createElement("p");
      title.className = "lx-title";
      copy.insertBefore(title, copy.querySelector(".hero-logo"));
    }
    renderBanner();
    new MutationObserver(renderBanner).observe(root, { attributes: true, attributeFilter: ["lang"] });

    if (!theme || !hero) return;

    // ---------- theme graphics ----------
    if (ART[id]) {
      var art = document.createElement("div");
      art.className = "theme-art";
      art.setAttribute("aria-hidden", "true");
      art.innerHTML = ART[id]();
      hero.appendChild(art);
    } else {
      var st = document.createElement("span");
      st.className = "theme-sticker";
      st.setAttribute("aria-hidden", "true");
      st.textContent = theme.sticker;
      hero.appendChild(st);
    }
    // the red logo gets the theme's treatment (e.g. glowing neon on black)
    document.querySelectorAll('img[src$="assets/img/logo.png"]').forEach(function (img) { img.classList.add("theme-logo"); });

    // ---------- light falling decorations, in the hero only ----------
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (settings.effects === false || still || !theme.particles) return;
    falling(hero, theme.particles);
  });

  function falling(hero, kind) {
    var canvas = document.createElement("canvas");
    canvas.className = "theme-fx";
    canvas.setAttribute("aria-hidden", "true");
    hero.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), list = [];
    var bat = kind === "bats", ember = kind === "embers", rise = bat || ember;
    var SIZE = { embers: [1, 1.8], glints: [2, 2.5], glitter: [1.4, 1.8], petals: [5, 4], blossom: [4, 3], bats: [14, 10] };
    var SLOW = { glints: 1, glitter: 1, petals: 1, blossom: 1 };
    var PALETTE = {
      embers: ["#f3dfa6", "#c9a45c", "#e0a24a", "#ff9a3c"], glints: ["#f6e3ad", "#ffffff", "#d4af62"], glitter: ["#fbf0d0", "#e2c88c", "#ffffff"],
      petals: ["#e6a896", "#f6d3c7", "#b8505f"], blossom: ["#f3d6dc", "#ffffff", "#e9e2c4"], bats: ["#1a0f26", "#2b1840", "#000000"], snow: ["#9fb7cc", "#b9cddd", "#ffffff"], confetti: ["#b8901c", "#ee1a37", "#0d0d0d", "#e9c46a"],
      hearts: ["#ee1a37", "#d6336c", "#f28cab"], eggs: ["#9fd3b0", "#f6c1d0", "#f7dc8a", "#a9c8f0"], sun: ["#f5b700", "#1484b8", "#ee1a37"]
    }[kind];
    function size() {
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // bats fly up and across; everything else falls
    function spawn(fresh) {
      return { x: Math.random() * W, y: fresh ? (rise ? H + 20 : -20) : Math.random() * H,
        s: (SIZE[kind] || [6, 10])[0] + Math.random() * (SIZE[kind] || [6, 10])[1],
        v: rise ? -(0.25 + Math.random() * (bat ? 0.9 : 0.45)) : (SLOW[kind] ? 0.15 + Math.random() * 0.35 : 0.3 + Math.random() * 0.8), dx: (Math.random() - 0.5) * (bat ? 1.8 : ember ? 0.3 : 0.6),
        r: bat ? 0 : Math.random() * 6.28, vr: bat ? 0 : (Math.random() - 0.5) * 0.04,
        c: PALETTE[Math.floor(Math.random() * PALETTE.length)], f: Math.random() * 6.28 };
    }
    function draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
      var s = p.s;
      switch (kind) {
        case "snow":
          ctx.lineWidth = 1.6; ctx.lineCap = "round";
          for (var i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0); ctx.stroke(); }
          break;
        case "confetti": ctx.fillRect(-s / 2, -s / 5, s, s / 2.5); break;
        case "hearts":
          ctx.beginPath(); ctx.moveTo(0, s / 3);
          ctx.bezierCurveTo(-s, -s / 3, -s / 3, -s, 0, -s / 3); ctx.bezierCurveTo(s / 3, -s, s, -s / 3, 0, s / 3); ctx.fill(); break;
        case "eggs": ctx.beginPath(); ctx.ellipse(0, 0, s / 2.6, s / 2, 0, 0, 6.29); ctx.fill(); break;
        case "sun": ctx.beginPath(); ctx.arc(0, 0, s / 3, 0, 6.29); ctx.fill(); break;
        case "glints":   // four-point sparkles that twinkle
          ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(p.f));
          ctx.beginPath(); ctx.moveTo(0, -s * 2); ctx.lineTo(s * 0.4, -s * 0.4); ctx.lineTo(s * 2, 0); ctx.lineTo(s * 0.4, s * 0.4);
          ctx.lineTo(0, s * 2); ctx.lineTo(-s * 0.4, s * 0.4); ctx.lineTo(-s * 2, 0); ctx.lineTo(-s * 0.4, -s * 0.4); ctx.fill(); break;
        case "glitter":
          ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(p.f));
          ctx.fillRect(-s, -s / 2, s * 2, s); break;
        case "petals": case "blossom":
          ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.55, 0, 0, 6.29); ctx.fill(); break;
        case "embers":   // tiny glowing sparks that fade out as they rise
          ctx.globalAlpha = Math.max(0, Math.min(1, p.y / H)) * (0.55 + 0.45 * Math.sin(p.f));
          ctx.shadowColor = p.c; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(0, 0, s, 0, 6.29); ctx.fill(); break;
        case "bats": {
          var flap = Math.sin(p.f) * s * 0.5;   // wings beat up and down
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-s / 2, -s / 3 - flap, -s, -flap);
          ctx.lineTo(-s * 0.7, s * 0.1); ctx.lineTo(-s * 0.45, -s * 0.02); ctx.lineTo(-s * 0.2, s * 0.18);
          ctx.lineTo(0, s * 0.3);
          ctx.lineTo(s * 0.2, s * 0.18); ctx.lineTo(s * 0.45, -s * 0.02); ctx.lineTo(s * 0.7, s * 0.1);
          ctx.lineTo(s, -flap); ctx.quadraticCurveTo(s / 2, -s / 3 - flap, 0, 0); ctx.fill();
          break;
        }
      }
      ctx.restore();
    }
    var running = true;
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      list.forEach(function (p, i) {
        p.y += p.v; p.x += p.dx + Math.sin((p.y + i * 40) / 60) * 0.3; p.r += p.vr; p.f += ember || SLOW[kind] ? 0.05 : 0.28;
        if (p.y > H + 30 || p.y < -30 || p.x < -40 || p.x > W + 40) list[i] = spawn(true);
        draw(p);
      });
      requestAnimationFrame(frame);
    }
    size();
    var count = Math.round(Math.min(bat ? 12 : ember ? 40 : SLOW[kind] ? 26 : 36, W / (bat ? 90 : SLOW[kind] ? 45 : 30)));
    for (var n = 0; n < count; n++) list.push(spawn(false));
    window.addEventListener("resize", size);
    var visible = true;
    function update() {
      var go = visible && document.visibilityState === "visible";
      if (go && !running) { running = true; requestAnimationFrame(frame); }
      if (!go) running = false;
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; update(); }).observe(hero);
    document.addEventListener("visibilitychange", update);
    requestAnimationFrame(frame);
  }
})();
