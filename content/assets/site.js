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
    var original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;

    function showResult(label) {
      clearTimeout(button.copyResetTimer);
      button.textContent = label;
      button.copyResetTimer = setTimeout(function () {
        button.textContent = original;
      }, 1400);
    }

    function copyFallback() {
      var helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      helper.setSelectionRange(0, helper.value.length);

      var copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      }
      helper.remove();
      showResult(copied ? 'Copied' : 'Copy failed');
    }

    if (!text) {
      showResult('Nothing to copy');
      return;
    }

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      copyFallback();
      return;
    }

    var copySettled = false;
    showResult('Copying');
    var copyFallbackTimer = setTimeout(function () {
      if (copySettled) return;
      copySettled = true;
      copyFallback();
    }, 500);

    navigator.clipboard.writeText(text).then(function () {
      if (copySettled) return;
      copySettled = true;
      clearTimeout(copyFallbackTimer);
      showResult('Copied');
    }, function () {
      if (copySettled) return;
      copySettled = true;
      clearTimeout(copyFallbackTimer);
      copyFallback();
    });
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
