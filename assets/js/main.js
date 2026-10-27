(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header shadow on scroll
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-locked');
      });
    });
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('menu-locked', header.classList.contains('menu-open'));
    });
  }

  // Section links: scroll without putting a hash in the URL.
  // Links look like <a href="./" data-section="pricing">. If the section is on another page,
  // the target is remembered and applied after that page loads.
  var PENDING_KEY = 'cw-scroll-to';

  function goToSection(id, smooth) {
    var el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto', block: 'start' });
    if (id === 'main') el.focus({ preventScroll: true });
    return true;
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-section]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var id = link.getAttribute('data-section');
    var clean = function (p) { return p.replace(/index\.html$/, ''); };
    var samePage = clean(new URL(link.href, location.href).pathname) === clean(location.pathname);
    if (samePage && goToSection(id, true)) {
      e.preventDefault();
      return;
    }
    try { sessionStorage.setItem(PENDING_KEY, id); } catch (err) {}
  });

  function applyPendingSection() {
    var id = null;
    try {
      id = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
    } catch (err) {}
    if (!id && location.hash) id = location.hash.slice(1);
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (id) requestAnimationFrame(function () { goToSection(id, false); });
  }
  if (document.readyState === 'complete') applyPendingSection();
  else window.addEventListener('load', applyPendingSection);

  // Mobile call bar: step aside while the lead form is on screen
  var mobileBar = document.querySelector('.mobile-bar');
  var quote = document.getElementById('quote');
  if (mobileBar && quote && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      mobileBar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(quote);
  }

  // Hero video: pause for reduced motion, keep playing otherwise
  var video = document.querySelector('.hero-video');
  if (video) {
    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  // Lead forms
  // Replace the submit handler body with your CRM / form endpoint (GoHighLevel, Formspree, Netlify, etc).
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var phone = form.querySelector('input[type="tel"]');
    if (phone) {
      phone.addEventListener('input', function () {
        var d = phone.value.replace(/\D/g, '').slice(0, 10);
        if (d.length > 6) phone.value = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
        else if (d.length > 3) phone.value = '(' + d.slice(0, 3) + ') ' + d.slice(3);
        else phone.value = d;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (el) {
        var field = el.closest('.field');
        var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && el.checkValidity();
        if (field) field.classList.toggle('has-error', !ok);
        if (!ok && valid) { el.focus(); valid = false; }
      });
      if (!valid) return;

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

      setTimeout(function () {
        var card = form.closest('.form-card');
        if (card) card.classList.add('is-sent');
      }, 600);
    });
  });

  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Legal page table of contents: highlight the current section
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('data-section')] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); });
          var link = map[entry.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
