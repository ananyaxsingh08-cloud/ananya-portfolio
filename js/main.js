/* =========================================================
   ANANYA SINGH — main.js   (clean, simple, fast)
   ========================================================= */
(function () {
  'use strict';

  /* ── NAV: blur on scroll ───────────────────────────────── */
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav && nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ── MOBILE NAV TOGGLE ─────────────────────────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ── SMOOTH ANCHOR LINKS ───────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── SCROLL REVEAL ─────────────────────────────────────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal, .reveal-mask').forEach(el => io.observe(el));

  /* Parallax removed for scroll performance */

  /* ── LAZY IMAGES ───────────────────────────────────────── */
  document.querySelectorAll('img').forEach(img => {
    img.setAttribute('loading',  'lazy');
    img.setAttribute('decoding', 'async');
  });

  /* ── iOS vh fix ────────────────────────────────────────── */
  const setVH = () => document.documentElement.style.setProperty('--vh', window.innerHeight * .01 + 'px');
  setVH();
  window.addEventListener('resize', setVH, { passive: true });

  /* ── STATS COUNT-UP ────────────────────────────────────── */
  const sio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const raw = el.textContent.trim();
      const num = parseFloat(raw.replace(/[^\d.]/g, ''));
      const suf = raw.replace(/[\d.]/g, '');
      if (isNaN(num)) return;
      const dur = 1200, t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const v = 1 - Math.pow(1 - p, 3);
        el.textContent = (num < 10 ? (v * num).toFixed(1) : Math.round(v * num)) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      sio.unobserve(el);
    });
  }, { threshold: 0.8 });
  document.querySelectorAll('.stat .n').forEach(el => sio.observe(el));

  /* Lightbox removed — images are non-interactive */

  /* ── ACTIVE NAV ────────────────────────────────────────── */
  const navAs = document.querySelectorAll('.nav-links a');
  const aio   = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navAs.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.project, #about, #index').forEach(s => aio.observe(s));

})();
