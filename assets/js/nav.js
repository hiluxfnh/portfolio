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

  // reading-progress bar
  var bar = document.createElement('div');
  bar.className = 'read-progress';
  document.body.appendChild(bar);

  // back-to-top button
  var top = document.createElement('button');
  top.className = 'to-top';
  top.type = 'button';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
  document.body.appendChild(top);
  // if the chat assistant FAB is present (contact page), stack above it
  if (document.querySelector('.hbot-fab')) top.style.bottom = '78px';
  top.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function onScroll() {
    var h = document.documentElement;
    var scrolled = h.scrollTop || document.body.scrollTop;
    var height = (h.scrollHeight - h.clientHeight) || 1;
    bar.style.width = (scrolled / height * 100) + '%';
    if (scrolled > 500) top.classList.add('show'); else top.classList.remove('show');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
