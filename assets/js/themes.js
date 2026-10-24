/* =====================================================================
   Vizi Capitali · seasonal themes (Halloween, Natale, Capodanno…)
   Chosen in Gestione → Temi (saved in SITE_CONFIG.theme). Adds a
   greeting strip, recolours the checkerboard, puts a sticker on the
   hero and, if allowed, light falling decorations in the hero only.
   Preview any theme with index.html?tema=halloween (or natale, …).
   ===================================================================== */
(function () {
  "use strict";

  // dates are "MM-DD"; Easter moves every year, so it's worked out below
  var THEMES = {
    halloween: {
      from: "10-20", to: "11-01", sticker: "🎃", check: "#e8620c", particles: "bats",
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
  var TZ = CONFIG.timeZone || "Europe/Rome";

  function mmdd(d) {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, month: "2-digit", day: "2-digit" }).formatToParts(d);
    var m = p.filter(function (x) { return x.type === "month"; })[0].value, dd = p.filter(function (x) { return x.type === "day"; })[0].value;
    return m + "-" + dd;
  }
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
    var today = mmdd(date);
    var y = Number(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric" }).format(date));
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

  // the Gestione page only needs the list and the calendar
  if (!document.querySelector(".site-header")) return;

  var settings = CONFIG.theme || {};
  var mode = settings.mode || "off";
  var forced = (location.search.match(/[?&]tema=([a-z]+)/) || [])[1];
  var id = forced && THEMES[forced] ? forced : mode === "auto" ? themeFor(new Date()) : THEMES[mode] ? mode : "";
  if (!id) return;
  var theme = THEMES[id];
  var root = document.documentElement;
  root.setAttribute("data-theme", id);
  root.style.setProperty("--check-color", theme.check);

  // greeting strip above the header
  var banner = document.createElement("aside");   // a landmark, so screen readers can find or skip it
  banner.className = "theme-banner";
  banner.setAttribute("aria-label", root.lang === "en" ? "Greetings" : "Auguri");
  var header = document.querySelector(".site-header");
  header.parentNode.insertBefore(banner, header);
  function text() {
    var lang = root.lang === "en" ? "en" : "it";
    var custom = settings.messages && settings.messages[id] && settings.messages[id][lang];
    banner.textContent = custom || theme.msg[lang];
  }
  text();
  new MutationObserver(text).observe(root, { attributes: true, attributeFilter: ["lang"] });

  // sticker in the corner of the hero, over the pizza
  var art = document.querySelector(".hero");
  if (art) {
    var st = document.createElement("span");
    st.className = "theme-sticker";
    st.setAttribute("aria-hidden", "true");
    st.textContent = theme.sticker;
    art.appendChild(st);
  }

  // light falling decorations, in the hero only
  var hero = document.querySelector(".hero");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!hero || settings.effects === false || still) return;
  var canvas = document.createElement("canvas");
  canvas.className = "theme-fx";
  canvas.setAttribute("aria-hidden", "true");
  hero.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [];
  var PALETTE = {
    bats: ["#1a1a1a", "#2b1d33", "#e8620c"], snow: ["#9fb7cc", "#b9cddd", "#ffffff"], confetti: ["#b8901c", "#ee1a37", "#0d0d0d", "#e9c46a"],
    hearts: ["#ee1a37", "#d6336c", "#f28cab"], eggs: ["#9fd3b0", "#f6c1d0", "#f7dc8a", "#a9c8f0"], sun: ["#f5b700", "#1484b8", "#ee1a37"]
  }[theme.particles];
  function size() {
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function spawn(top) {
    return { x: Math.random() * W, y: top ? -20 : Math.random() * H, s: 6 + Math.random() * 10, v: 0.3 + Math.random() * 0.8,
      dx: (Math.random() - 0.5) * 0.6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04, c: PALETTE[Math.floor(Math.random() * PALETTE.length)] };
  }
  function draw(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
    var s = p.s;
    switch (theme.particles) {
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
      case "bats":
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-s / 2, -s / 2, -s, 0); ctx.quadraticCurveTo(-s / 2, -s / 6, 0, s / 4);
        ctx.quadraticCurveTo(s / 2, -s / 6, s, 0); ctx.quadraticCurveTo(s / 2, -s / 2, 0, 0); ctx.fill(); break;
    }
    ctx.restore();
  }
  var running = true;
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    parts.forEach(function (p, i) {
      p.y += p.v; p.x += p.dx + Math.sin((p.y + i * 40) / 60) * 0.3; p.r += p.vr;
      if (p.y > H + 20) parts[i] = spawn(true);
      draw(p);
    });
    requestAnimationFrame(frame);
  }
  size();
  var count = Math.round(Math.min(36, W / 30));
  for (var n = 0; n < count; n++) parts.push(spawn(false));
  window.addEventListener("resize", size);
  // stop drawing when the hero is off screen or the tab is hidden
  var visible = true;
  function update() {
    var go = visible && document.visibilityState === "visible";
    if (go && !running) { running = true; requestAnimationFrame(frame); }
    if (!go) running = false;
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; update(); }).observe(hero);
  document.addEventListener("visibilitychange", update);
  requestAnimationFrame(frame);
})();
