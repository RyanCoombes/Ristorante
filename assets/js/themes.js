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
      from: "10-20", to: "11-01", sticker: "🎃", check: "#3a1d5e", particles: "bats", css: true,
      msg: { it: "🎃 Dolcetto o pizzetta? Buon Halloween da Vizi Capitali!", en: "🎃 Trick or treat? Happy Halloween from Vizi Capitali!" }
    },
    natale: {
      from: "12-01", to: "12-27", sticker: "🎄", check: "#1d6b3c", particles: "snow",
      msg: { it: "🎄 Buon Natale! Il vizio più buono è stare insieme.", en: "🎄 Merry Christmas! The best vice is being together." }
    },
    capodanno: {
      from: "12-28", to: "01-06", sticker: "🥂", check: "#b8901c", particles: "confetti",
      msg: { it: "🥂 Buon anno! Inizia il nuovo anno con un vizio.", en: "🥂 Happy New Year! Start the year with a vice." }
    },
    sanvalentino: {
      from: "02-07", to: "02-14", sticker: "💘", check: "#d6336c", particles: "hearts",
      msg: { it: "💘 San Valentino: una pizza per due, il vizio è condiviso.", en: "💘 Valentine's Day: one pizza for two, a vice to share." }
    },
    pasqua: {
      easter: true, sticker: "🐣", check: "#5f9e6e", particles: "eggs",
      msg: { it: "🐣 Buona Pasqua da Vizi Capitali!", en: "🐣 Happy Easter from Vizi Capitali!" }
    },
    ferragosto: {
      from: "08-08", to: "08-16", sticker: "🏖️", check: "#1484b8", particles: "sun",
      msg: { it: "☀️ Buon Ferragosto da Vizi Capitali!", en: "☀️ Happy Ferragosto from Vizi Capitali!" }
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
    root.style.setProperty("--check-color", theme.check);
    if (theme.css) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "assets/css/themes/" + id + ".css";
      document.head.appendChild(link);
    }
  }
  if (!theme && !annOn) return;

  // ---------- hand-drawn graphics per theme ----------
  var ART = {
    halloween:
      // moon behind the pizza
      '<div class="hw-moon"><span></span><span></span><span></span></div>' +
      // cobweb in the top-left corner, with a spider on a thread
      '<svg class="hw-web" viewBox="0 0 200 200"><g fill="none" stroke="currentColor" stroke-width="1.4">' +
        '<path d="M0 0L200 120M0 0L150 200M0 0L60 200M0 0L200 40"/>' +
        '<path d="M0 34Q22 30 30 18Q30 8 34 0M0 70Q44 62 58 40Q62 20 68 0M0 110Q66 98 88 64Q96 32 104 0M0 150Q90 136 118 90Q130 46 140 0M0 190Q112 172 150 116Q164 60 178 0"/></g></svg>' +
      '<div class="hw-spider"><i></i><svg viewBox="0 0 40 40"><g stroke="currentColor" stroke-width="2" fill="none">' +
        '<path d="M14 18L4 10M14 21L2 21M14 24L4 32M26 18L36 10M26 21L38 21M26 24L36 32"/></g>' +
        '<ellipse cx="20" cy="21" rx="7" ry="9" fill="currentColor"/><circle cx="20" cy="11" r="5" fill="currentColor"/>' +
        '<circle cx="18" cy="10" r="1.2" fill="#ff7a1a"/><circle cx="22" cy="10" r="1.2" fill="#ff7a1a"/></svg></div>' +
      // haunted skyline along the bottom: graves, a crooked tree, the house on the hill, a fence
      '<svg class="hw-skyline" viewBox="0 0 1200 160" preserveAspectRatio="none"><g fill="#000">' +
        '<path d="M0 160V118Q150 96 300 112T620 104T900 110T1200 100V160Z"/>' +
        '<path d="M900 110V60l28-26 28 26V48h10v18l18 14V110Z"/>' +
        '<path d="M160 116V78q0-14 14-14t14 14v38ZM230 112V86q0-10 10-10t10 10v26ZM700 108V80q0-12 12-12t12 12v28Z"/>' +
        '<path d="M430 108c4-40-6-52-26-66l4-4c12 8 18 12 22 20 2-14-2-26-12-38l5-3c12 14 14 30 12 44 6-10 16-16 28-18v6c-14 4-22 12-24 26-2 12 0 22 2 33Z"/>' +
        '<path d="M1040 104v-24h4v24M1056 104v-28h4v28M1072 104v-24h4v24M1088 104v-28h4v28M1104 104v-24h4v24M1036 86h76v4h-76Z"/></g>' +
        '<rect x="934" y="70" width="10" height="12" fill="#ffb347"/><rect x="954" y="70" width="10" height="12" fill="#ff8a2a"/></svg>' +
      '<div class="hw-fog"><span></span><span></span></div>' +
      // the jack-o'-lantern
      '<svg class="hw-pumpkin" viewBox="0 0 120 110"><defs><radialGradient id="hwp" cx="50%" cy="45%" r="60%">' +
        '<stop offset="0" stop-color="#ffb04a"/><stop offset=".7" stop-color="#ef6a0c"/><stop offset="1" stop-color="#b8430a"/></radialGradient></defs>' +
        '<path d="M58 18c0-8 4-14 10-16l3 4c-5 2-7 6-7 12Z" fill="#3c5a1e"/>' +
        '<ellipse cx="38" cy="62" rx="30" ry="40" fill="url(#hwp)"/><ellipse cx="82" cy="62" rx="30" ry="40" fill="url(#hwp)"/><ellipse cx="60" cy="62" rx="26" ry="44" fill="url(#hwp)"/>' +
        '<g fill="#fff36a"><path d="M36 48l12 4-12 10ZM84 48l-12 4 12 10Z"/><path d="M56 62l4-8 4 8Z"/>' +
        '<path d="M30 76q30 22 60 0l-6 4-4-5-6 7-6-6-6 6-6-7-4 5Z"/></g></svg>'
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
    if (theme.css) document.querySelectorAll('img[src$="assets/img/logo.png"]').forEach(function (img) { img.classList.add("theme-logo"); });

    // ---------- light falling decorations, in the hero only ----------
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (settings.effects === false || still) return;
    falling(hero, theme.particles);
  });

  function falling(hero, kind) {
    var canvas = document.createElement("canvas");
    canvas.className = "theme-fx";
    canvas.setAttribute("aria-hidden", "true");
    hero.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), list = [];
    var bat = kind === "bats";
    var PALETTE = {
      bats: ["#1a0f26", "#2b1840", "#000000"], snow: ["#9fb7cc", "#b9cddd", "#ffffff"], confetti: ["#b8901c", "#ee1a37", "#0d0d0d", "#e9c46a"],
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
      return { x: Math.random() * W, y: fresh ? (bat ? H + 20 : -20) : Math.random() * H, s: (bat ? 14 : 6) + Math.random() * 10,
        v: bat ? -(0.5 + Math.random() * 0.7) : 0.3 + Math.random() * 0.8, dx: (Math.random() - 0.5) * (bat ? 1.8 : 0.6),
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
        p.y += p.v; p.x += p.dx + Math.sin((p.y + i * 40) / 60) * 0.3; p.r += p.vr; p.f += 0.28;
        if (p.y > H + 30 || p.y < -30 || p.x < -40 || p.x > W + 40) list[i] = spawn(true);
        draw(p);
      });
      requestAnimationFrame(frame);
    }
    size();
    var count = Math.round(Math.min(bat ? 12 : 36, W / (bat ? 90 : 30)));
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
