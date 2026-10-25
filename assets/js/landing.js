/* landing.js — nav, theme, entrance and scroll reveals.
   No scroll listeners for reveals (IntersectionObserver only), per the
   design rules. Reduced motion is handled in CSS. */
(function () {
  var root = document.documentElement;

  // entrance: flip .reveal elements on once the page is ready
  function ready() { document.body.classList.add("ready"); }
  if (document.readyState === "complete") ready();
  else window.addEventListener("load", ready, { once: true });

  // theme toggle (data-theme is pre-set by an inline head script, no flash)
  var themeBtn = document.querySelector(".nav-theme");
  function paintTheme() {
    if (!themeBtn) return;
    var dark = root.getAttribute("data-theme") === "dark";
    themeBtn.innerHTML = dark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }
  paintTheme();
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    paintTheme();
  });

  // mobile overlay menu
  var overlay = document.querySelector(".nav-overlay");
  var burger = document.querySelector(".nav-burger");
  function setMenu(open) {
    if (!overlay || !burger) return;
    overlay.setAttribute("data-open", open ? "true" : "false");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger) burger.addEventListener("click", function () {
    setMenu(overlay.getAttribute("data-open") !== "true");
  });
  if (overlay) overlay.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // scroll reveals for sections below the fold
  var io = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" })
    : null;
  function observeAll() {
    document.querySelectorAll(".io").forEach(function (el) {
      if (io) io.observe(el); else el.classList.add("in");
    });
  }
  if (document.readyState !== "loading") observeAll();
  else document.addEventListener("DOMContentLoaded", observeAll);

  // tagline: words light up one at a time on scroll.
  // single rAF-throttled handler, gated by IntersectionObserver so it only
  // runs while the section is on screen. Full reduced-motion fallback.
  (function () {
    var text = document.querySelector(".tagline-text");
    if (!text) return;
    var words = Array.prototype.slice.call(text.querySelectorAll(".tw"));
    if (!words.length) return;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      words.forEach(function (w) { w.classList.add("lit"); });
      return;
    }
    text.classList.add("is-dimming");
    var ticking = false, active = false;
    function update() {
      ticking = false;
      var r = text.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var start = vh * 0.85, end = vh * 0.35;
      var prog = (start - r.top) / (start - end);
      prog = Math.max(0, Math.min(1, prog));
      var n = Math.round(prog * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("lit", i < n);
    }
    function onScroll() { if (!ticking) { requestAnimationFrame(update); ticking = true; } }
    var section = text.closest(".tagline") || text;
    var gate = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !active) {
          active = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll);
          update();
        } else if (!e.isIntersecting && active) {
          active = false;
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      });
    }, { threshold: 0 });
    gate.observe(section);
    update();
  })();
})();
