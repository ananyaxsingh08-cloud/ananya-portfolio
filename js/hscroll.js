/* ============================================================
   HORIZONTAL SCROLL — RESEARCH SECTIONS
   
   CoreHome-style: scroll down = panels move right.
   
   Mechanism:
   ┌─ .hs-outer ─────────────────────────────────────────────┐
   │  height = sum of all panel scroll-heights               │
   │  (this creates the vertical "budget" to pay for         │
   │  scrolling through all panels)                          │
   │                                                         │
   │  ┌─ .hs-sticky  position:sticky top:0 h:100vh ───────┐  │
   │  │  overflow:hidden                                   │  │
   │  │                                                    │  │
   │  │  ┌─ .hs-track  display:flex ───────────────────┐  │  │
   │  │  │  transform:translateX(-progress * totalW)   │  │  │
   │  │  │                                             │  │  │
   │  │  │  [section 0] [section 1] [section 2] ...   │  │  │
   │  │  │  each: width:100vw, height:100vh            │  │  │
   │  │  │  overflow-y:auto on each panel              │  │  │
   │  │  └─────────────────────────────────────────────┘  │  │
   │  └────────────────────────────────────────────────────┘  │
   └─────────────────────────────────────────────────────────┘
   
   For each panel, its "scroll budget" in vertical px =
     max(viewport-height, panel's natural scrollHeight)
   
   As the user scrolls through a panel's budget:
   - If panel fits in viewport: snap/hold then advance
   - If panel is taller: inner scrollTop advances, THEN
     the track translates to the next panel
   ============================================================ */

(function () {
  'use strict';

  /* ── Bail conditions ──────────────────────────────────── */
  if (window.matchMedia('(pointer:coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if (window.innerWidth < 768) return;

  var VW = window.innerWidth;
  var VH = window.innerHeight;

  /* ── Find all horizontal scroll blocks ───────────────── */
  var outers = Array.from(document.querySelectorAll('.hs-outer'));
  if (!outers.length) return;

  /* ── Build instance per block ─────────────────────────── */
  var instances = outers.map(function (outer) {
    var sticky  = outer.querySelector('.hs-sticky');
    var track   = outer.querySelector('.hs-track');
    var panels  = Array.from(track.querySelectorAll(':scope > section'));

    /* progress bar */
    var bar = document.createElement('div');
    bar.className = 'hs-bar';
    sticky.appendChild(bar);

    /* scroll indicator label */
    var hint = document.createElement('div');
    hint.className = 'hs-hint';
    hint.innerHTML = '<span>scroll</span><svg width="32" height="10" viewBox="0 0 32 10"><path d="M0 5h30M26 1l4 4-4 4" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>';
    sticky.appendChild(hint);

    return {
      outer:  outer,
      sticky: sticky,
      track:  track,
      panels: panels,
      bar:    bar,
      hint:   hint,
      /* measured data filled by measure() */
      budgets:    [],   /* px budget per panel */
      cumulative: [],   /* cumulative scroll start per panel */
      totalBudget: 0,
    };
  });

  /* ── measure() — called on load and resize ─────────────── */
  function measure(inst) {
    VW = window.innerWidth;
    VH = window.innerHeight;

    var budgets    = [];
    var cumulative = [];
    var total      = 0;

    inst.panels.forEach(function (panel, i) {
      /* Reset any previously forced size so we get natural height */
      panel.style.height    = '';
      panel.style.overflowY = '';
      panel.scrollTop       = 0;

      /* Read natural content height */
      var natural = panel.scrollHeight;

      /* Budget: at least one full viewport, at most natural height.
         Short panels (< VH) still get VH worth of scroll so the
         user has time to read before the panel snaps away. */
      var budget = Math.max(VH, natural);

      /* Set panel display height */
      panel.style.height    = VH + 'px';
      panel.style.overflowY = natural > VH ? 'auto' : 'hidden';

      cumulative.push(total);
      budgets.push(budget);
      total += budget;
    });

    inst.budgets     = budgets;
    inst.cumulative  = cumulative;
    inst.totalBudget = total;

    /* Size outer to hold total budget so page has enough scroll room.
       Add VH at end so the last panel fully comes to rest before
       the sticky releases. */
    inst.outer.style.height = (total + VH) + 'px';
  }

  /* ── update() — called on every scroll event ─────────────── */
  function update(inst) {
    var rect    = inst.outer.getBoundingClientRect();
    var scrolled = -rect.top;   /* 0 when outer hits top of viewport */

    /* Before block: reset */
    if (scrolled <= 0) {
      inst.track.style.transform = 'translate3d(0,0,0)';
      inst.bar.style.transform   = 'scaleX(0)';
      /* reset all inner scrolls */
      inst.panels.forEach(function (p) { p.scrollTop = 0; });
      inst.hint.style.opacity = '1';
      return;
    }

    /* After block: clamp to last state */
    if (scrolled >= inst.totalBudget) {
      var lastX = (inst.panels.length - 1) * VW;
      inst.track.style.transform = 'translate3d(-' + lastX + 'px,0,0)';
      inst.bar.style.transform   = 'scaleX(1)';
      inst.hint.style.opacity    = '0';
      return;
    }

    /* ── Find which panel we're in ── */
    var panelIdx = 0;
    for (var i = inst.panels.length - 1; i >= 0; i--) {
      if (scrolled >= inst.cumulative[i]) {
        panelIdx = i;
        break;
      }
    }

    var panelProgress = scrolled - inst.cumulative[panelIdx];
    var budget        = inst.budgets[panelIdx];
    var panel         = inst.panels[panelIdx];
    var naturalH      = panel.scrollHeight;

    /* translateX: move to current panel position */
    var translateX = panelIdx * VW;
    inst.track.style.transform = 'translate3d(-' + translateX + 'px,0,0)';

    /* Inner scroll for tall panels */
    if (naturalH > VH) {
      /* The inner scroll runs from 0 to (naturalH - VH) */
      var maxInner = naturalH - VH;
      /* panelProgress goes 0 → budget
         inner scroll uses the first maxInner px of budget */
      var innerScroll = Math.min(panelProgress, maxInner);
      panel.scrollTop = innerScroll;
    }

    /* Reset inner scroll on panels we've left */
    inst.panels.forEach(function (p, j) {
      if (j < panelIdx) {
        /* panels we've passed: scroll to bottom */
        p.scrollTop = p.scrollHeight;
      } else if (j > panelIdx) {
        /* panels ahead: scroll to top */
        p.scrollTop = 0;
      }
    });

    /* Progress bar */
    var progress = scrolled / inst.totalBudget;
    inst.bar.style.transform = 'scaleX(' + Math.min(progress, 1).toFixed(4) + ')';

    /* Hide hint once user has scrolled past first panel */
    inst.hint.style.opacity = scrolled > inst.budgets[0] * 0.2 ? '0' : '1';
  }

  /* ── Init ───────────────────────────────────────────────── */
  /* Wait for fonts/images to settle before measuring */
  function init() {
    instances.forEach(measure);
    instances.forEach(update);
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

  /* ── Scroll listener (passive — native scroll untouched) ── */
  window.addEventListener('scroll', function () {
    instances.forEach(update);
  }, { passive: true });

  /* ── Resize ─────────────────────────────────────────────── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      instances.forEach(measure);
      instances.forEach(update);
    }, 150);
  }, { passive: true });

})();
