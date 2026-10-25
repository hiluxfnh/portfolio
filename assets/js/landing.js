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
})();
