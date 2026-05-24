/* =========================================================
   ANANYA SINGH — PORTFOLIO · CORE JS
   ========================================================= */
(function () {
  'use strict';

  /* ── NAV scroll state ──────────────────────────────────── */
  const nav = document.querySelector('.nav');
  const darkSections = Array.from(document.querySelectorAll('[data-nav-dark]'));
  let ticking = false;

  function updateNav() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 30);
    let isDark = false;
    for (const s of darkSections) {
      const r = s.getBoundingClientRect();
      if (r.top < nav.offsetHeight && r.bottom > 0) { isDark = true; break; }
    }
    nav.classList.toggle('dark-context', isDark);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateNav); ticking = true; } }, { passive: true });
  updateNav();

  /* ── MOBILE NAV ────────────────────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ── SMOOTH ANCHOR SCROLL ──────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 10;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── INTERSECTION OBSERVER: reveal ────────────────────── */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal, .reveal-mask').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal, .reveal-mask').forEach(el => el.classList.add('in'));
  }

  /* ── PARALLAX ──────────────────────────────────────────── */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let pt = false;
    function applyP() {
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const rect = el.getBoundingClientRect();
        const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
        el.style.transform = `translate3d(0,${offset.toFixed(1)}px,0)`;
      });
      pt = false;
    }
    window.addEventListener('scroll', () => { if (!pt) { requestAnimationFrame(applyP); pt = true; } }, { passive: true });
    window.addEventListener('resize', applyP);
    applyP();
  }

  /* ── LAZY IMAGES ───────────────────────────────────────── */
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading'))  img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });

  /* ── iOS VIEWPORT HEIGHT FIX ───────────────────────────── */
  function setVH() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }
  setVH();
  window.addEventListener('resize', setVH, { passive: true });

})();
