/* ============================================================
   ANANYA SINGH — animations.js  v17
   Smooth scroll + CoreHome-inspired entrance animations.
   No structural changes — pure progressive enhancement.
   ============================================================ */
(function () {
  'use strict';

  const TOUCH = window.matchMedia('(pointer:coarse)').matches;
  const PRM   = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* Custom cursor removed entirely — native OS cursor used */

  /* ══════════════════════════════════════════════════════════
     2. SCROLL PROGRESS BAR
  ══════════════════════════════════════════════════════════ */
  if (!TOUCH && !PRM) {
    const bar = document.createElement('div');
    bar.id = 'c-bar';
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const pct = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      bar.style.transform = `scaleX(${Math.min(pct, 1).toFixed(4)})`;
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════
     3. INTERSECTION OBSERVER — base reveal + stagger
        Existing .reveal / .reveal-mask handled by main.js.
        Here we enhance specific elements further.
  ══════════════════════════════════════════════════════════ */
  if (PRM) {
    /* Reduced motion: just make everything visible */
    document.querySelectorAll('.reveal, .reveal-mask').forEach(el => el.classList.add('in'));
    return;
  }

  /* ── 4a. Standard reveals (main.js also does this — belt+braces) */
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
    });
  }, { threshold: TOUCH ? 0.02 : 0.08, rootMargin: TOUCH ? '0px 0px 8% 0px' : '0px 0px -4% 0px' });
  document.querySelectorAll('.reveal, .reveal-mask').forEach(el => rio.observe(el));

  /* ── 4b. Stagger children of grid containers */
  const STAGGER_SELECTORS = [
    '.insight-matrix',
    '.tension-grid',
    '.process-timeline',
    '.edu-grid',
    '.skills-list',
    '.stat-row',
    '.principle-grid',
    '.brand-pillars',
    '.audience-col-list',
    '.bidet-types-row',
    '.persona-spread',
    '.tp-cues',
    '.three-col',
    '.two-col',
  ];

  document.querySelectorAll(STAGGER_SELECTORS.join(',')).forEach(parent => {
    const children = Array.from(parent.children);
    children.forEach((child, i) => {
      if (!child.classList.contains('reveal')) {
        child.classList.add('reveal');
      }
      /* Override any existing delay with stagger */
      child.style.transitionDelay = `${i * 70}ms`;
    });
  });

  /* ── 4c. Chapter headings: label line draws in, then h3 rises */
  document.querySelectorAll('.chapter-head').forEach(head => {
    head.classList.add('ch-anim');
    if (!head.classList.contains('reveal')) {
      head.classList.add('reveal');
    }
  });

  /* ── 4d. Insight cells: individual stagger regardless of parent */
  document.querySelectorAll('.insight-cell').forEach((cell, i) => {
    if (!cell.classList.contains('reveal')) cell.classList.add('reveal');
    /* Stagger within each matrix independently */
    const siblings = Array.from(cell.parentNode.children);
    const idx = siblings.indexOf(cell);
    cell.style.transitionDelay = `${idx * 55}ms`;
  });

  /* ── 4e. Persona cards: lift + fade */
  document.querySelectorAll('.persona-card').forEach((card) => {
    if (!card.classList.contains('reveal-mask')) card.classList.add('reveal-mask');
  });

  /* Re-observe anything newly marked */
  document.querySelectorAll('.reveal:not(.in), .reveal-mask:not(.in)').forEach(el => rio.observe(el));

  /* ══════════════════════════════════════════════════════════
     4. PARALLAX — images deepen on scroll (CoreHome's main move)
        Images inside .canvas scale very slightly as they
        enter and exit viewport — creates the "alive" feeling.
  ══════════════════════════════════════════════════════════ */
  const parallaxEls = TOUCH ? [] : document.querySelectorAll('[data-parallax]');
  const canvasImgs  = TOUCH ? [] : document.querySelectorAll('.canvas img');

  /* Track all elements needing scroll-driven transforms */
  const scrollDriven = [];

  parallaxEls.forEach(el => {
    scrollDriven.push({ el, type: 'parallax', speed: parseFloat(el.dataset.parallax) || 0.12 });
  });

  canvasImgs.forEach(img => {
    scrollDriven.push({ el: img, type: 'scale' });
  });

  let scrollRAF = false;
  const onScroll = () => {
    if (scrollRAF) return;
    scrollRAF = true;
    requestAnimationFrame(() => {
      scrollRAF = false;
      const vy = window.innerHeight;
      scrollDriven.forEach(({ el, type, speed }) => {
        const rect = el.getBoundingClientRect();
        /* Only process when near viewport */
        if (rect.bottom < -vy || rect.top > vy * 2) return;

        if (type === 'parallax') {
          const offset = (vy / 2 - (rect.top + rect.height / 2)) * speed;
          el.style.transform = `translate3d(0,${offset.toFixed(1)}px,0)`;
        } else if (type === 'scale') {
          /* Subtle scale: 1.00 when centred in viewport, 1.06 at edges */
          const center = rect.top + rect.height / 2;
          const dist   = Math.abs(vy / 2 - center) / vy;
          const scale  = 1.06 - dist * 0.06;
          el.style.transform = `scale3d(${scale.toFixed(4)},${scale.toFixed(4)},1)`;
        }
      });
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ══════════════════════════════════════════════════════════
     5. SECTION ENTRANCE — chapter background crossfade
        Dark ↔ light sections: fade the bg slightly as they
        enter, giving a breathing quality to long scrolls.
  ══════════════════════════════════════════════════════════ */
  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('chapter-visible');
      } else {
        e.target.classList.remove('chapter-visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.chapter').forEach(ch => chapterObserver.observe(ch));

  /* ══════════════════════════════════════════════════════════
     6. STATS COUNT-UP
  ══════════════════════════════════════════════════════════ */
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const raw = el.textContent.trim();
      const num = parseFloat(raw.replace(/[^\d.]/g, ''));
      const suf = raw.replace(/[\d.]/g, '');
      if (isNaN(num)) return;
      const dur = 1400, t0 = performance.now();
      const countTick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const v = 1 - Math.pow(1 - p, 3); /* ease-out-cubic */
        el.textContent = (num < 10 ? (v * num).toFixed(1) : Math.round(v * num)) + suf;
        if (p < 1) requestAnimationFrame(countTick);
      };
      requestAnimationFrame(countTick);
      sio.unobserve(el);
    });
  }, { threshold: TOUCH ? 0.3 : 0.8 });
  document.querySelectorAll('.stat .n').forEach(el => sio.observe(el));

  /* Lightbox removed — images are non-interactive */

  /* ══════════════════════════════════════════════════════════
     8. NAV ACTIVE SECTION HIGHLIGHT
  ══════════════════════════════════════════════════════════ */
  const navAs = document.querySelectorAll('.nav-links a');
  const nio   = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navAs.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`)
      );
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.project, #about, #index').forEach(s => nio.observe(s));

  /* ══════════════════════════════════════════════════════════
     9. PULL STATEMENT — word-by-word stagger
         The big italic research questions reveal word by word.
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.pull-statement').forEach(el => {
    /* Split into word spans */
    const html = el.innerHTML;
    /* Preserve existing HTML tags — only split text nodes */
    const frag = document.createDocumentFragment();
    const tmp  = document.createElement('div');
    tmp.innerHTML = html;

    let wordIdx = 0;
    function processNode(node, target) {
      if (node.nodeType === 3) { /* text node */
        const words = node.textContent.split(/(\s+)/);
        words.forEach(w => {
          if (/^\s+$/.test(w)) {
            target.appendChild(document.createTextNode(w));
          } else if (w) {
            const span = document.createElement('span');
            span.className = 'ps-word';
            span.textContent = w;
            span.style.transitionDelay = `${wordIdx * 40}ms`;
            wordIdx++;
            target.appendChild(span);
          }
        });
      } else if (node.nodeType === 1) {
        const clone = node.cloneNode(false);
        Array.from(node.childNodes).forEach(child => processNode(child, clone));
        target.appendChild(clone);
      }
    }

    Array.from(tmp.childNodes).forEach(child => processNode(child, frag));
    el.innerHTML = '';
    el.appendChild(frag);
    el.classList.add('ps-ready');

    /* Observe for reveal */
    const psObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { el.classList.add('ps-in'); psObs.unobserve(el); }
      });
    }, { threshold: TOUCH ? 0.1 : 0.3 });
    psObs.observe(el);
  });

  /* ══════════════════════════════════════════════════════════
     10. OPENER TITLE — line-by-line slide up
         Project opener h2 titles slide each line up on entry.
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.opener-title').forEach(el => {
    el.classList.add('opener-title-anim');
    const ot = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { el.classList.add('ot-in'); ot.unobserve(el); }
      });
    }, { threshold: TOUCH ? 0.15 : 0.4 });
    ot.observe(el);
  });

  /* ══════════════════════════════════════════════════════════
     11. HORIZONTAL LINE DRAW — chapter labels
         The small gold line before chapter labels animates
         from 0 to full width on section entry.
  ══════════════════════════════════════════════════════════ */
  /* Handled entirely in CSS via .chapter-visible + ::before transitions */

})();
