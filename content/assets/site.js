/* Shared behavior for JunePoint Resources pages with no dependencies. */
(function () {
  'use strict';

  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.getElementById('jp-mobile-nav');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var open = mobileNav.hasAttribute('hidden');
      if (open) mobileNav.removeAttribute('hidden');
      else mobileNav.setAttribute('hidden', '');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.jp-toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    var targets = [];
    tocLinks.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      var el = document.getElementById(id);
      if (el) {
        byId[id] = link;
        targets.push(el);
      }
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (l) {
            l.classList.remove('is-active');
          });
          var active = byId[entry.target.id];
          if (active) active.classList.add('is-active');
        });
      },
      { rootMargin: '-88px 0px -70% 0px', threshold: 0 }
    );
    targets.forEach(function (t) {
      observer.observe(t);
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy]');
    if (!button) return;
    var source = document.getElementById(button.getAttribute('data-copy'));
    if (!source) return;
    var text = 'value' in source ? source.value : source.textContent;
    var done = function () {
      var original = button.dataset.originalLabel || button.textContent;
      button.dataset.originalLabel = original;
      button.textContent = 'Copied';
      setTimeout(function () {
        button.textContent = original;
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  });

  function openTargetDetails() {
    if (!location.hash) return;
    var target = document.getElementById(location.hash.slice(1));
    while (target) {
      if (target.tagName === 'DETAILS') target.open = true;
      target = target.parentElement;
    }
  }
  openTargetDetails();
  window.addEventListener('hashchange', openTargetDetails);
})();
