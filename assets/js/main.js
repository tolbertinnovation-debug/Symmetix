/* ==========================================================================
   Symmetrix Management Holdings LLC — site behaviour
   Vanilla JS, no dependencies. Every enhancement degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
      var top = document.querySelector('.fab--top');
      if (top) top.classList.toggle('is-visible', window.scrollY > 600);
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
    item.addEventListener('mouseleave', function () { closeTimer = window.setTimeout(function () { open(false); }, 140); });
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
  var toggle = document.querySelector('.nav-toggle');
  if (drawer && toggle) {
    var lastFocus = null;
    var setDrawer = function (state) {
      drawer.classList.toggle('is-open', state);
      drawer.setAttribute('aria-hidden', state ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
      document.body.classList.toggle('no-scroll', state);
      if (state) {
        lastFocus = document.activeElement;
        var first = drawer.querySelector('.drawer-close');
        if (first) first.focus();
      } else if (lastFocus) {
        lastFocus.focus();
      }
    };
    toggle.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('.drawer-scrim') || event.target.closest('.drawer-close') || event.target.closest('a')) {
        setDrawer(false);
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false);
    });
    // Keep focus inside the open drawer.
    drawer.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var nodes = drawer.querySelectorAll('a[href], button:not([disabled])');
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
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
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
    }
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      // Counting up from zero looks broken for small figures — leave those be.
      if (reduceMotion || target < 5) { el.textContent = el.getAttribute('data-pad') === 'true' && target < 10 ? '0' + target : String(target); return; }
      var start = null;
      var pad = el.getAttribute('data-pad') === 'true';
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / 1300, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var value = Math.round(target * eased);
        el.textContent = pad && value < 10 ? '0' + value : String(value);
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

  /* ---------- Contact form ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var fields = form.querySelectorAll('[data-validate]');

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

    Array.prototype.forEach.call(fields, function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        var wrap = input.closest('.field');
        if (wrap && wrap.classList.contains('has-error')) validate(input);
      });
    });

    var summarise = function (data) {
      return [
        'Name: ' + data.name,
        'Email: ' + data.email,
        'Phone: ' + data.phone,
        'Division: ' + data.division,
        '',
        data.message
      ].join('\n');
    };

    form.addEventListener('submit', function (event) {
      var ok = true;
      Array.prototype.forEach.call(fields, function (input) { if (!validate(input)) ok = false; });

      // Honeypot: silently drop obvious bots.
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

      // No form endpoint configured yet: hand the enquiry to the visitor's
      // mail client so no message is lost. Replace the form `action` with a
      // real endpoint (see README) to post server-side instead.
      if (!form.getAttribute('action')) {
        event.preventDefault();
        var data = {
          name: (form.elements.name.value || '').trim(),
          email: (form.elements.email.value || '').trim(),
          phone: (form.elements.phone.value || '').trim(),
          division: form.elements.division.value || 'General enquiry',
          message: (form.elements.message.value || '').trim()
        };
        var subject = 'Website enquiry — ' + data.division;
        var href = 'mailto:' + (form.getAttribute('data-mailto') || 'info@symmetrixholdings.com') +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(summarise(data));
        window.location.href = href;
        if (status) {
          status.hidden = false;
          status.setAttribute('data-state', 'ok');
          status.textContent = 'Thank you, ' + data.name.split(' ')[0] + '. Your email app is opening with this enquiry ready to send — or call us on (+231) 0880832316.';
        }
      }
    });
  }
})();
