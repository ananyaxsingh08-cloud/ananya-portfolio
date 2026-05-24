# Ananya Singh — Industrial & Product Design Portfolio

A cinematic editorial portfolio website. Pure HTML / CSS / JS — no build step, no framework.

## How to run

**Local preview (recommended):** open a terminal in this folder and run:
```
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

You can also just double-click `index.html` to open it directly.

## Deploy

Drop the folder onto Netlify, Vercel, GitHub Pages, or Cloudflare Pages. No build step.

## File structure

```
ananya-portfolio/
├── index.html            # Single-page portfolio
├── css/style.css         # Design system + components
├── js/main.js            # Scroll reveal, nav, parallax
└── assets/images/crops/  # 96 optimised images
```

## Design system

- **Palette:** Two-tone — ink #0A0A0A + dune #E8DCC4
- **Typography:** Fraunces (display serif) + Inter Tight (body) + JetBrains Mono (technical labels)
- **Layout:** 12-column editorial grid, asymmetric compositions
- **Motion:** Scroll-reveal masks, parallax, smooth-scroll. Respects prefers-reduced-motion.
- **Responsive:** Desktop / laptop / tablet / mobile breakpoints

## Editing

All copy is directly in `index.html`. All design tokens live in `:root` at the top of `css/style.css`.
