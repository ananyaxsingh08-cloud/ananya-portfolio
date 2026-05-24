/* =========================================================
   ANANYA SINGH — ANIMATIONS, CURSOR, SCROLL, INTERACTIONS
   ========================================================= */
(function () {
  'use strict';

  const IS_TOUCH   = 'ontouchstart' in window || window.matchMedia('(pointer:coarse)').matches;
  const PRM        = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const RAF        = requestAnimationFrame.bind(window);
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  /* ════════════════════════════════════════════════════════
     1. INERTIA SCROLL — proper physics-based smooth scroll
     ════════════════════════════════════════════════════════ */
  if (!IS_TOUCH && !PRM) {
    let ease   = 0.072;   // lerp factor — tweak: lower = more liquid
    let target = window.scrollY;
    let current= window.scrollY;
    let lastY  = window.scrollY;
    let rafID  = null;
    let fromWheel = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function scrollLoop() {
      current = lerp(current, target, ease);
      const diff = Math.abs(target - current);

      if (diff > 0.08) {
        window.scrollTo(0, current);
        rafID = RAF(scrollLoop);
      } else {
        window.scrollTo(0, target);
        current = target;
        fromWheel = false;
        rafID = null;
      }
    }

    // Only intercept wheel; let keyboard/touch/anchor do native scroll
    window.addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey) return; // pinch zoom
      if (e.target.closest('.code-block,.cwc-circuits,.keyshot-showcase,.lb-content')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2) return; // horizontal

      e.preventDefault();

      // Normalise delta across deltaMode
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 28;      // line mode
      if (e.deltaMode === 2) delta *= window.innerHeight; // page mode

      // Trackpad: smaller steps naturally; mouse wheel: amplify a little
      const isMouse = !e.deltaMode && Math.abs(delta) >= 100;
      if (isMouse) delta *= 0.9;

      fromWheel = true;
      target = Math.max(0, Math.min(
        target + delta,
        document.documentElement.scrollHeight - window.innerHeight
      ));

      if (!rafID) {
        current = window.scrollY;
        rafID = RAF(scrollLoop);
      }
    }, { passive: false });

    // Keep target in sync when programmatic / anchor / keyboard scroll
    window.addEventListener('scroll', () => {
      if (!fromWheel) {
        target  = window.scrollY;
        current = window.scrollY;
      }
      lastY = window.scrollY;
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════════════
     2. CURSOR SYSTEM — ring + trailing dot + magnetic pull
     ════════════════════════════════════════════════════════ */
  if (IS_TOUCH) return; // nothing below runs on touch

  // Build cursor DOM
  const ring = document.createElement('div');
  ring.className = 'cr-ring';

  const dot = document.createElement('div');
  dot.className = 'cr-dot';

  // Trail dots
  const TRAIL_COUNT = 8;
  const trail = Array.from({ length: TRAIL_COUNT }, (_, i) => {
    const t = document.createElement('div');
    t.className = 'cr-trail';
    t.style.setProperty('--i', i);
    document.body.appendChild(t);
    return t;
  });

  // Ripple pool
  const RIPPLE_POOL = 4;
  const ripples = Array.from({ length: RIPPLE_POOL }, () => {
    const r = document.createElement('div');
    r.className = 'cr-ripple';
    document.body.appendChild(r);
    return r;
  });
  let rippleIdx = 0;

  document.body.appendChild(ring);
  document.body.appendChild(dot);

  let mx = -200, my = -200;   // mouse raw
  let rx = -200, ry = -200;   // ring position (lerped)
  let trailPos = Array(TRAIL_COUNT).fill({ x: -200, y: -200 });
  let isHover  = false;
  let isClick  = false;
  let cursorLabel = '';

  // State machine
  const STATES = {
    default: { ringScale: 1,    ringOpacity: 1,   dotScale: 1 },
    hover:   { ringScale: 2.2,  ringOpacity: 0.7, dotScale: 0.4 },
    image:   { ringScale: 3,    ringOpacity: 0.5, dotScale: 0.3 },
    link:    { ringScale: 1.5,  ringOpacity: 0.85,dotScale: 0.7 },
    click:   { ringScale: 0.7,  ringOpacity: 1,   dotScale: 1.8 },
    text:    { ringScale: 0.15, ringOpacity: 0,   dotScale: 1   },
  };
  let currentState = 'default';
  let rScale = 1, rOp = 1, dScale = 1;

  function applyState(name) {
    const s = STATES[name] || STATES.default;
    rScale = s.ringScale; rOp = s.ringOpacity; dScale = s.dotScale;
    currentState = name;
    ring.style.transform = `translate(-50%,-50%) scale(${rScale})`;
    ring.style.opacity   = rOp;
    dot.style.transform  = `translate(-50%,-50%) scale(${dScale})`;

    if (name === 'image') {
      ring.classList.add('cr-ring--zoom');
      ring.dataset.label = 'View';
    } else {
      ring.classList.remove('cr-ring--zoom');
      ring.dataset.label = '';
    }
  }

  // Detect what's under cursor
  const IMG_TARGETS  = '.canvas, .opener-image, .about-portrait, .index-item .thumb';
  const LINK_TARGETS = 'a, button, .index-item, .scroll-cue, .bt-item, .audience-card, .edu-card, .principle, .attr-chip, .insight-node';
  const TEXT_TARGETS = 'p, h1, h2, h3, h4, h5, li, blockquote, .editorial-body, .about-intro';

  function detectState(e) {
    if (isClick) { applyState('click'); return; }
    const el = e.target;
    if (el.closest(IMG_TARGETS))  { applyState('image'); return; }
    if (el.closest(LINK_TARGETS)) { applyState('link');  return; }
    if (el.closest(TEXT_TARGETS)) { applyState('text');  return; }
    applyState('default');
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    // Dot snaps
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    detectState(e);
  });

  document.addEventListener('mousedown', () => { isClick = true;  applyState('click'); fireRipple(); });
  document.addEventListener('mouseup',   () => { isClick = false; applyState(currentState); });
  document.addEventListener('mouseleave',() => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  document.addEventListener('mouseenter',() => { ring.style.opacity = ''; dot.style.opacity  = ''; });

  // Ring lerp loop
  let ringRaf;
  function ringLoop() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';

    // Trail: each follows the one before with increasing delay
    let px = mx, py = my;
    trail.forEach((t, i) => {
      const lf = 0.38 - i * 0.035;
      const prev = trailPos[i];
      const nx = prev.x + (px - prev.x) * lf;
      const ny = prev.y + (py - prev.y) * lf;
      trailPos[i] = { x: nx, y: ny };
      const scale = 1 - i / TRAIL_COUNT;
      const op = (1 - i / TRAIL_COUNT) * 0.5;
      t.style.transform = `translate(-50%,-50%) scale(${scale})`;
      t.style.opacity   = op;
      t.style.left = nx + 'px';
      t.style.top  = ny + 'px';
      px = nx; py = ny;
    });

    ringRaf = RAF(ringLoop);
  }
  ringLoop();

  // Click ripple
  function fireRipple() {
    const r = ripples[rippleIdx % RIPPLE_POOL];
    rippleIdx++;
    r.style.left    = mx + 'px';
    r.style.top     = my + 'px';
    r.style.opacity = '1';
    r.style.transform = 'translate(-50%,-50%) scale(0)';
    // Force reflow
    void r.offsetWidth;
    r.style.transition = 'transform 0.65s cubic-bezier(0.16,1,0.3,1), opacity 0.65s ease';
    r.style.transform = 'translate(-50%,-50%) scale(1)';
    r.style.opacity   = '0';
  }

  /* ════════════════════════════════════════════════════════
     3. FLOATING DOT FIELD — animated background particles
     ════════════════════════════════════════════════════════ */
  const canvas = document.createElement('canvas');
  canvas.className = 'dot-field';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W, H;
  const DOT_COUNT = 55;
  const dots = [];

  class Dot {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.6 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.18;
      this.vy = -(Math.random() * 0.25 + 0.06);
      this.op = Math.random() * 0.35 + 0.05;
      this.pulse = Math.random() * Math.PI * 2;
    }
    update(t) {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += 0.018;
      // Drift toward cursor very softly
      const dx = mx - this.x, dy = my - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 200) {
        this.x += (dx / dist) * 0.12;
        this.y += (dy / dist) * 0.12;
      }
      if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset(false);
    }
    draw() {
      const op = this.op * (0.7 + 0.3 * Math.sin(this.pulse));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,118,${op})`;
      ctx.fill();
    }
  }

  function resizeDots() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initDots() {
    resizeDots();
    for (let i = 0; i < DOT_COUNT; i++) dots.push(new Dot());
  }

  let dotRaf;
  function dotLoop(t) {
    ctx.clearRect(0, 0, W, H);
    // Connection lines near cursor
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      d.update(t);
      // Connect nearby dots
      for (let j = i + 1; j < dots.length; j++) {
        const d2 = dots[j];
        const dist = Math.hypot(d.x - d2.x, d.y - d2.y);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d2.x, d2.y);
          ctx.strokeStyle = `rgba(201,168,118,${0.07 * (1 - dist / 90)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      d.draw();
    }
    dotRaf = RAF(dotLoop);
  }

  window.addEventListener('resize', resizeDots, { passive: true });
  initDots();
  dotLoop(0);

  /* ════════════════════════════════════════════════════════
     4. CURSOR MAGNETIC PULL on buttons & links
     ════════════════════════════════════════════════════════ */
  const magnetTargets = $$('.scroll-cue, .nav-mark, .lb-close');
  magnetTargets.forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = e.clientX - cx;
      const dy   = e.clientY - cy;
      el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => { el.style.transition = ''; }, 550);
    });
  });

  /* ════════════════════════════════════════════════════════
     5. SCROLL PROGRESS BAR
     ════════════════════════════════════════════════════════ */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
  }, { passive: true });

  /* ════════════════════════════════════════════════════════
     6. SECTION ACTIVE NAV
     ════════════════════════════════════════════════════════ */
  const navAs = $$('.nav-links a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navAs.forEach(a => a.classList.toggle('nav-active', a.getAttribute('href') === `#${id}`));
    });
  }, { threshold: 0.25 });
  $$('.project, #about, #index').forEach(s => sectionObserver.observe(s));

  /* ════════════════════════════════════════════════════════
     7. STATS COUNT-UP
     ════════════════════════════════════════════════════════ */
  if (!PRM) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el  = entry.target;
        const raw = el.textContent.trim();
        const num = parseFloat(raw.replace(/[^\d.]/g, ''));
        const suf = raw.replace(/[\d.]/g, '');
        if (isNaN(num)) return;
        const dur = 1400, start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const e = 1 - Math.pow(1 - p, 4);
          el.textContent = (num < 10 ? (e * num).toFixed(1) : Math.round(e * num)) + suf;
          if (p < 1) RAF(tick);
        };
        RAF(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.8 });
    $$('.stat .n').forEach(el => io.observe(el));
  }

  /* ════════════════════════════════════════════════════════
     8. REVEAL STAGGER for sibling groups
     ════════════════════════════════════════════════════════ */
  if (!PRM) {
    const groups = '.edu-grid,.skills-list,.journey,.bidet-types-row,.tp-cues,.cwc-circuits,.audience-col-list,.principle-grid,.index-list,.stat-row';
    $$(groups).forEach(parent => {
      Array.from(parent.children).forEach((child, i) => {
        if (!child.classList.contains('reveal')) {
          child.classList.add('reveal');
          child.style.transitionDelay = `${i * 0.06}s`;
        }
      });
    });
    // Re-observe any new reveals
    const io2 = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    $$('.reveal:not(.in)').forEach(el => io2.observe(el));
  }

  /* ════════════════════════════════════════════════════════
     9. CANVAS IMAGE HOVER — opener tilt
     ════════════════════════════════════════════════════════ */
  $$('.opener-image').forEach(panel => {
    if (PRM) return;
    const img = panel.querySelector('img');
    if (!img) return;
    panel.addEventListener('mousemove', e => {
      const r = panel.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      img.style.transform = `scale(1.05) translate(${x * -14}px,${y * -9}px)`;
    });
    panel.addEventListener('mouseleave', () => {
      img.style.transition = 'transform 0.9s cubic-bezier(0.16,1,0.3,1)';
      img.style.transform = '';
      setTimeout(() => { img.style.transition = ''; }, 950);
    });
  });

  /* ════════════════════════════════════════════════════════
     10. LIGHTBOX
     ════════════════════════════════════════════════════════ */
  let lb = null;
  function buildLB() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop"></div>
      <button class="lb-close">✕</button>
      <div class="lb-content"><img class="lb-img" alt=""/><div class="lb-caption"></div></div>`;
    document.body.appendChild(lb);
    lb.querySelector('.lb-backdrop').addEventListener('click', closeLB);
    lb.querySelector('.lb-close').addEventListener('click', closeLB);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLB(); });
  }
  function openLB(img) {
    if (!lb) buildLB();
    lb.querySelector('.lb-img').src = img.src;
    lb.querySelector('.lb-img').alt = img.alt;
    const fig = img.closest('.canvas')?.nextElementSibling;
    lb.querySelector('.lb-caption').textContent =
      (fig && fig.classList.contains('figure-caption')) ? fig.textContent.trim() : img.alt;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLB() {
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  $$('.canvas img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLB(img));
  });

  /* ════════════════════════════════════════════════════════
     11. INDEX ITEM CLICK → project section
     ════════════════════════════════════════════════════════ */
  $$('.index-item[data-href]').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const target = document.querySelector(item.dataset.href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

})();
