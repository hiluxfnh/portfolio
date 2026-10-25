/* subpage.js — lightbox, accordion, and certificate search.
   Theme toggle, mobile nav, and .io reveals come from landing.js. */
(function () {
  // ---- Lightbox: any element with [data-full] opens its image enlarged ----
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");
    function openLb(src, cap) {
      lbImg.src = src;
      lbImg.alt = cap || "";
      lbCap.textContent = cap || "";
      lb.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
    }
    function closeLb() {
      lb.setAttribute("data-open", "false");
      lbImg.src = "";
      document.body.style.overflow = "";
    }
    document.querySelectorAll("[data-full]").forEach(function (el) {
      el.addEventListener("click", function () {
        openLb(el.getAttribute("data-full"), el.getAttribute("data-cap") || "");
      });
    });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest(".lb-close")) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.getAttribute("data-open") === "true") closeLb();
    });
  }

  // ---- Accordion ----
  document.querySelectorAll(".acc-head").forEach(function (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var body = btn.nextElementSibling;
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".acc-head").forEach(function (h) {
        h.setAttribute("aria-expanded", "false");
        if (h.nextElementSibling) h.nextElementSibling.style.maxHeight = null;
      });
      if (!isOpen && body) {
        btn.setAttribute("aria-expanded", "true");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });

  // ---- Certificate search ----
  var search = document.getElementById("certSearch");
  if (search) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".media-card[data-title]"));
    var note = document.querySelector(".empty-note");
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var match = c.getAttribute("data-title").toLowerCase().indexOf(q) !== -1;
        c.hidden = !match;
        if (match) shown++;
      });
      if (note) note.hidden = shown !== 0;
    });
  }
})();
