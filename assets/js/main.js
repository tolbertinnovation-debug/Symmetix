/* ==========================================================================
   Symmetrix Management Holdings LLC — site behaviour
   Vanilla JS, no dependencies. Every enhancement degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Colour theme ---------- */
  (function theme() {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    if (!buttons.length) return;
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    var current = function () {
      var set = root.getAttribute('data-theme');
      return set || (systemDark.matches ? 'dark' : 'light');
    };
    var paintMeta = function (mode) {
      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', mode === 'dark' ? '#071A11' : '#FBF9F5');
    };
    var sync = function () {
      var mode = current();
      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
        b.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      });
      paintMeta(mode);
    };

    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('sx-theme', next); } catch (e) {}
        sync();
      });
    });
    // Follow the system only while the visitor has not chosen for themselves.
    if (systemDark.addEventListener) {
      systemDark.addEventListener('change', function () {
        if (!root.getAttribute('data-theme')) sync();
      });
    }
    sync();
  })();

  /* ---------- Sticky header + back to top ---------- */
  var header = document.querySelector('.site-header');
  var toTop = document.querySelector('.fab--top');
  if (header || toTop) {
    var onScroll = function () {
      if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
      if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Desktop dropdown (hover + keyboard) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.has-dropdown'), function (item) {
    var trigger = item.querySelector('.nav-link');
    var closeTimer;
    var open = function (state) {
      item.classList.toggle('is-open', state);
      if (trigger) trigger.setAttribute('aria-expanded', state ? 'true' : 'false');
    };
    item.addEventListener('mouseenter', function () { window.clearTimeout(closeTimer); open(true); });
    item.addEventListener('mouseleave', function () { closeTimer = window.setTimeout(function () { open(false); }, 150); });
    if (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        open(!item.classList.contains('is-open'));
      });
    }
    item.addEventListener('focusout', function (event) {
      if (!item.contains(event.relatedTarget)) open(false);
    });
    item.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { open(false); if (trigger) trigger.focus(); }
    });
  });

  /* ---------- Mobile drawer ---------- */
  var drawer = document.getElementById('drawer');
  var navToggle = document.querySelector('.nav-toggle');
  if (drawer && navToggle) {
    var lastFocus = null;
    var setDrawer = function (state) {
      drawer.classList.toggle('is-open', state);
      drawer.setAttribute('aria-hidden', state ? 'false' : 'true');
      navToggle.setAttribute('aria-expanded', state ? 'true' : 'false');
      document.body.classList.toggle('no-scroll', state);
      if (state) {
        lastFocus = document.activeElement;
        var first = drawer.querySelector('.drawer-close');
        if (first) first.focus();
      } else if (lastFocus) {
        lastFocus.focus();
      }
    };
    navToggle.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('.drawer-scrim') || event.target.closest('.drawer-close') || event.target.closest('a')) {
        setDrawer(false);
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false);
    });
    drawer.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var nodes = drawer.querySelectorAll('a[href], button:not([disabled])');
      if (!nodes.length) return;
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
    }
  }

  /* ---------- Count-up figures ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var pad = function (el, v) { return el.getAttribute('data-pad') === 'true' && v < 10 ? '0' + v : String(v); };
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      // Counting up from zero looks broken for small figures — leave those be.
      if (reduceMotion || target < 5) { el.textContent = pad(el, target); return; }
      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / 1300, 1);
        el.textContent = pad(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, run);
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { run(entry.target); co.unobserve(entry.target); }
        });
      }, { threshold: 0.5 });
      Array.prototype.forEach.call(counters, function (el) { co.observe(el); });
    }
  }

  /* ---------- Current year ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var divisionSelect = form.elements.division;
    var branches = form.querySelectorAll('[data-branch]');

    /* Show only the follow-up questions that belong to the chosen division, and
       take hidden fields out of validation so they can never block a submit. */
    var syncBranches = function () {
      var chosen = divisionSelect ? divisionSelect.value : '';
      Array.prototype.forEach.call(branches, function (branch) {
        var match = branch.getAttribute('data-branch') === chosen;
        branch.hidden = !match;
        Array.prototype.forEach.call(branch.querySelectorAll('input, select, textarea'), function (f) {
          f.disabled = !match;
        });
      });
    };
    if (divisionSelect) {
      divisionSelect.addEventListener('change', syncBranches);
      syncBranches();
    }

    var liveFields = function () {
      return Array.prototype.filter.call(form.querySelectorAll('[data-validate]'), function (f) {
        return !f.disabled && f.offsetParent !== null;
      });
    };

    var messageFor = function (input) {
      if (!input.value.trim()) return 'This field is required.';
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
        return 'Enter a valid email address, e.g. name@example.com.';
      }
      if (input.type === 'tel' && input.value.replace(/[^\d]/g, '').length < 7) {
        return 'Enter a phone number we can reach you on.';
      }
      if (input.tagName === 'TEXTAREA' && input.value.trim().length < 12) {
        return 'Please add a little more detail (at least 12 characters).';
      }
      return '';
    };

    var validate = function (input) {
      var wrap = input.closest('.field');
      var slot = wrap ? wrap.querySelector('.err') : null;
      var msg = messageFor(input);
      if (wrap) wrap.classList.toggle('has-error', Boolean(msg));
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (slot) slot.textContent = msg;
      return !msg;
    };

    Array.prototype.forEach.call(form.querySelectorAll('[data-validate]'), function (input) {
      input.addEventListener('blur', function () { if (!input.disabled) validate(input); });
      input.addEventListener('input', function () {
        var wrap = input.closest('.field');
        if (wrap && wrap.classList.contains('has-error')) validate(input);
      });
    });

    var summarise = function () {
      var lines = [];
      Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (f) {
        if (f.disabled || !f.name || f.name === 'company-website' || !f.value.trim()) return;
        var label = form.querySelector('label[for="' + f.id + '"]');
        var name = label ? label.textContent.replace('*', '').trim() : f.name;
        lines.push(name + ': ' + f.value.trim());
      });
      return lines.join('\n');
    };

    form.addEventListener('submit', function (event) {
      var ok = true;
      liveFields().forEach(function (input) { if (!validate(input)) ok = false; });

      var trap = form.querySelector('input[name="company-website"]');
      if (trap && trap.value) { event.preventDefault(); return; }

      if (!ok) {
        event.preventDefault();
        if (status) {
          status.hidden = false;
          status.setAttribute('data-state', 'err');
          status.textContent = 'Please correct the highlighted fields and try again.';
        }
        var firstBad = form.querySelector('.field.has-error input, .field.has-error select, .field.has-error textarea');
        if (firstBad) firstBad.focus();
        return;
      }

      // No form endpoint configured yet: hand the enquiry to the visitor's mail
      // client so nothing is lost. Setting the form's `action` to a real
      // endpoint makes this branch step aside — see the README.
      if (!form.getAttribute('action')) {
        event.preventDefault();
        var division = (divisionSelect && divisionSelect.value) || 'General enquiry';
        var name = (form.elements.name.value || '').trim();
        var href = 'mailto:' + (form.getAttribute('data-mailto') || '') +
          '?subject=' + encodeURIComponent('Website enquiry — ' + division) +
          '&body=' + encodeURIComponent(summarise());
        window.location.href = href;
        if (status) {
          status.hidden = false;
          status.setAttribute('data-state', 'ok');
          status.textContent = 'Thank you, ' + (name.split(' ')[0] || 'and welcome') +
            '. Your email app is opening with this enquiry ready to send — or call us on (+231) 0880832316.';
        }
      }
    });
  }
})();
