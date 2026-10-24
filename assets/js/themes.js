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

  // dates are "MM-DD"; Easter moves every year, so it's worked out below
  var THEMES = {
    halloween: {
      swatch: "#0b0908", from: "10-20", to: "11-01", sticker: "🎃", check: "#1d1714", particles: "embers",
      msg: { it: "Halloween · Una notte di vizi, fino al 1° novembre", en: "Halloween · A night of vices, until 1 November" }
    },
    natale: {
      swatch: "#0e1f18", from: "12-01", to: "12-27", sticker: "🎄", check: "#12261d", particles: "glints",
      msg: { it: "Natale · Il vizio più prezioso è stare insieme", en: "Christmas · The most precious vice is being together" }
    },
    capodanno: {
      swatch: "#1b1916", from: "12-28", to: "01-06", sticker: "🥂", check: "#1b1916", particles: "glitter",
      msg: { it: "Capodanno · Brindiamo a un nuovo anno di vizi", en: "New Year · A toast to a new year of vices" }
    },
    sanvalentino: {
      swatch: "#3a0f1b", from: "02-07", to: "02-14", sticker: "💘", check: "#2a0e15", particles: "petals",
      msg: { it: "San Valentino · Un vizio da condividere", en: "Valentine's Day · A vice to share" }
    },
    pasqua: {
      swatch: "#3d5a40", easter: true, sticker: "🐣", check: "#dfe7d4", particles: "blossom",
      msg: { it: "Pasqua · Buone feste da Vizi Capitali", en: "Easter · Happy holidays from Vizi Capitali" }
    },
    ferragosto: {
      swatch: "#123b63", from: "08-08", to: "08-16", sticker: "🏖️", check: "#dde7ee", particles: "",
      msg: { it: "Ferragosto · L'estate romana ha un nuovo vizio", en: "Ferragosto · Roman summer has a new vice" }
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
  /** Which theme the calendar suggests for a date (used by "Automatico"). */
  function themeFor(date) {
    var today = mmdd(date), y = Number(parts(date).year);
    var e = easter(y), DAY = 864e5;
    var ids = Object.keys(THEMES);
    for (var i = 0; i < ids.length; i++) {
      var th = THEMES[ids[i]];
      if (th.easter) {
        if (inRange(today, mmdd(new Date(e.getTime() - 7 * DAY)), mmdd(new Date(e.getTime() + DAY)))) return ids[i];   // Palm Sunday → Pasquetta
      } else if (inRange(today, th.from, th.to)) return ids[i];
    }
    return "";
  }
  window.VC_themeFor = themeFor;

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
  var annOn = !!ann.on && (!ann.from || today >= ann.from) && (!ann.to || today <= ann.to) &&
    !!((ann.text && (ann.text.it || ann.text.en)) || ann.code);

  if (theme) {
    root.setAttribute("data-theme", id);
    root.classList.add("lux");
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "assets/css/themes/lux.css";
    document.head.appendChild(link);
  }
  if (!theme && !annOn) return;

  // ---------- hand-drawn graphics per theme ----------
  var ART = {
    halloween:
      // candle-lit smoke, a thin gold crescent and a gold hairline frame
      '<div class="lx-smoke"><span></span><span></span><span></span></div>' +
      '<svg class="lx-moon" viewBox="0 0 100 100"><defs><linearGradient id="lxg" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#f3dfa6"/><stop offset=".5" stop-color="#c9a45c"/><stop offset="1" stop-color="#8a6a2e"/></linearGradient></defs>' +
        '<path d="M62 6a46 46 0 1 0 32 66A38 38 0 1 1 62 6Z" fill="url(#lxg)"/></svg>' +
      '<div class="lx-frame"></div>',
    natale:
      '<svg class="lx-garland" viewBox="0 0 1200 90" preserveAspectRatio="none"><g fill="none" stroke="#d4af62" stroke-width="1" opacity=".55">' +
        '<path d="M0 10Q150 80 300 10T600 10T900 10T1200 10"/><path d="M0 22Q150 86 300 22T600 22T900 22T1200 22" opacity=".5"/></g>' +
        '<g fill="#d4af62"><circle cx="150" cy="45" r="3"/><circle cx="450" cy="45" r="3"/><circle cx="750" cy="45" r="3"/><circle cx="1050" cy="45" r="3"/></g></svg>' +
      '<svg class="lx-star" viewBox="0 0 100 100"><defs><linearGradient id="lxs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset=".5" stop-color="#d4af62"/><stop offset="1" stop-color="#9b7a3a"/></linearGradient></defs>' +
        '<path d="M50 2L57 39L94 26L66 50L94 74L57 61L50 98L43 61L6 74L34 50L6 26L43 39Z" fill="url(#lxs)"/></svg>' +
      '<div class="lx-frame"></div>',
    capodanno:
      '<div class="lx-burst"></div>' +
      '<svg class="lx-deco" viewBox="0 0 120 120"><g fill="none" stroke="#e2c88c" stroke-width="1.2">' +
        '<path d="M60 8L112 60L60 112L8 60Z"/><path d="M60 22L98 60L60 98L22 60Z" opacity=".6"/><path d="M60 8V112M8 60H112" opacity=".35"/></g>' +
        '<circle cx="60" cy="60" r="6" fill="#e2c88c"/></svg>' +
      '<div class="lx-frame"></div>',
    sanvalentino:
      '<svg class="lx-heart" viewBox="0 0 100 90"><path d="M50 84C20 62 4 46 4 27 4 13 15 4 28 4c9 0 17 5 22 13C55 9 63 4 72 4c13 0 24 9 24 23 0 19-16 35-46 57Z" fill="none" stroke="#e6a896" stroke-width="2.2"/></svg>' +
      '<div class="lx-frame"></div>',
    pasqua:
      '<svg class="lx-olive" viewBox="0 0 200 80"><g fill="none" stroke="#3d5a40" stroke-width="1.6" stroke-linecap="round"><path d="M6 60C60 46 120 40 194 18"/></g>' +
        '<g fill="#7a9472"><ellipse cx="40" cy="44" rx="14" ry="4.5" transform="rotate(-30 40 44)"/><ellipse cx="62" cy="58" rx="14" ry="4.5" transform="rotate(22 62 58)"/>' +
        '<ellipse cx="92" cy="32" rx="14" ry="4.5" transform="rotate(-34 92 32)"/><ellipse cx="114" cy="46" rx="14" ry="4.5" transform="rotate(18 114 46)"/>' +
        '<ellipse cx="146" cy="18" rx="14" ry="4.5" transform="rotate(-38 146 18)"/><ellipse cx="166" cy="32" rx="14" ry="4.5" transform="rotate(14 166 32)"/></g>' +
        '<g fill="#b8963f"><ellipse cx="80" cy="50" rx="5" ry="6.5"/><ellipse cx="132" cy="36" rx="5" ry="6.5"/></g></svg>' +
      '<div class="lx-frame"></div>',
    ferragosto:
      '<div class="lx-sun"></div>' +
      '<svg class="lx-waves" viewBox="0 0 1200 70" preserveAspectRatio="none"><g fill="none" stroke="currentColor" stroke-width="1.2">' +
        '<path d="M0 30Q50 18 100 30T200 30T300 30T400 30T500 30T600 30T700 30T800 30T900 30T1000 30T1100 30T1200 30"/>' +
        '<path d="M0 48Q50 36 100 48T200 48T300 48T400 48T500 48T600 48T700 48T800 48T900 48T1000 48T1100 48T1200 48" opacity=".6"/></g></svg>' +
      '<div class="lx-frame"></div>'
  };

  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  ready(function () {
    var lang = function () { return root.lang === "en" ? "en" : "it"; };

    // ---------- top strip ----------
    var header = document.querySelector(".site-header");
    if (!header) return;
    var banner = document.createElement("aside");   // a landmark, so screen readers can find or skip it
    banner.className = "theme-banner";
    header.parentNode.insertBefore(banner, header);
    function renderBanner() {
      var L = lang();
      banner.setAttribute("aria-label", L === "en" ? "News" : "Avviso");
      var msg = annOn ? (ann.text && (ann.text[L] || ann.text.it)) || "" :
        (settings.messages && settings.messages[id] && settings.messages[id][L]) || theme.msg[L];
      banner.innerHTML = "";
      if (msg) { var s = document.createElement("span"); s.textContent = msg; banner.appendChild(s); }
      if (annOn && ann.code) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "banner-code";
        b.textContent = (L === "en" ? "Use code " : "Usa il codice ") + ann.code;
        b.addEventListener("click", function () { window.dispatchEvent(new CustomEvent("vc:promo", { detail: ann.code })); });
        banner.appendChild(b);
      }
    }
    renderBanner();
    new MutationObserver(renderBanner).observe(root, { attributes: true, attributeFilter: ["lang"] });

    if (!theme) return;
    var hero = document.querySelector(".hero");
    if (!hero) return;

    // ---------- theme graphics ----------
    if (ART[id]) {
      var art = document.createElement("div");
      art.className = "theme-art";
      art.setAttribute("aria-hidden", "true");
      art.innerHTML = ART[id];
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
