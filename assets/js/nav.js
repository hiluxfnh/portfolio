/* nav.js — shared mobile nav toggle + active link highlighting */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var list = document.querySelector('.site-nav .nav-list');

  if (toggle && list) {
    toggle.addEventListener('click', function () {
      var open = list.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close menu when a link is tapped (mobile)
    list.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        list.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // auto-highlight current page
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.site-nav .nav-list a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    if (href === here) a.classList.add('active');
  });
})();
