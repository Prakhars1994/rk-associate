// RK Associates — shared premium theme (white + Apple red)
// Built on reusable open-source pieces loaded from CDNs:
//   - Inter typeface (Google Fonts), with Apple system font fallback
//   - Lucide icons (lucide.dev) replace emoji glyphs
//   - AOS (Animate On Scroll) for subtle reveal animations
// Each page keeps its own layout CSS; this layer sets tokens and refines it.

const CSS = `
:root {
  --rk-red: #D70015;          /* Apple systemRed, accessible variant (5:1 on white) */
  --rk-red-bright: #FF3B30;   /* Apple systemRed, for glows and accents only */
  --rk-red-hover: #B5000F;
  --rk-red-tint: #FFF2F2;
  --rk-ink: #1D1D1F;
  --rk-ink-2: #6E6E73;
  --rk-ink-3: #86868B;
  --rk-line: #D2D2D7;
  --rk-line-soft: #E8E8ED;
  --rk-gray-bg: #F5F5F7;
  --rk-green: #248A3D;
  --rk-orange: #C93400;
  --rk-surface: #FFFFFF;
  --rk-font: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  --rk-radius: 18px;
  --rk-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04);
  --rk-shadow-lg: 0 2px 6px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.10);
  --rk-ease: cubic-bezier(.25,.1,.25,1);
}
html { scroll-behavior: smooth; }
body { font-family: var(--rk-font); color: var(--rk-ink); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-feature-settings: 'cv11','ss01'; letter-spacing: -0.011em; accent-color: var(--rk-red); }
h1, h2, h3, h4 { color: var(--rk-ink) !important; letter-spacing: -0.022em; font-weight: 600; }
h1 { letter-spacing: -0.03em; font-weight: 700; }
p { color: var(--rk-ink-2); }
::selection { background: rgba(215,0,21,.14); }
.rk-icon { width: 1em; height: 1em; vertical-align: -0.12em; stroke-width: 1.75; }

/* Header: frosted glass, hairline border */
header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,.78) !important; -webkit-backdrop-filter: saturate(180%) blur(20px); backdrop-filter: saturate(180%) blur(20px); box-shadow: none !important; border-bottom: 1px solid var(--rk-line-soft); color: var(--rk-ink) !important; padding: 14px 20px !important; }
header .header-content { padding: 0 !important; }
header h1 { font-size: 20px !important; }
header a[style*="color: white"] { color: var(--rk-red) !important; font-weight: 500; font-size: 15px; }
.logo { color: var(--rk-ink) !important; font-size: 21px !important; font-weight: 700; letter-spacing: -0.03em; display: flex; align-items: center; gap: 10px; }
.logo::before { content: 'RK'; display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: var(--rk-red); color: #fff; font-size: 12px; letter-spacing: 0; }
nav { align-items: center; gap: 28px !important; }
nav a { color: var(--rk-ink-2) !important; font-size: 15px; transition: color .2s var(--rk-ease); }
nav a:hover { color: var(--rk-ink) !important; }
nav a.btn-login, nav a[style*="background"] { background: var(--rk-red) !important; color: #fff !important; padding: 8px 18px !important; border-radius: 980px !important; font-weight: 500; }
nav a.btn-login:hover, nav a[style*="background"]:hover { background: var(--rk-red-hover) !important; color: #fff !important; }

/* Buttons: Apple-style pills */
.btn, .btn-primary, button:not(.tab-btn) { border-radius: 980px !important; font-weight: 500 !important; letter-spacing: -0.01em; transition: background .2s var(--rk-ease), transform .2s var(--rk-ease), box-shadow .2s var(--rk-ease); border: none; }
.btn, .btn-primary { padding: 12px 24px !important; }
.btn:hover, .btn-primary:hover, button:not(.tab-btn):hover { background: var(--rk-red-hover) !important; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(215,0,21,.22); }
.btn:active, .btn-primary:active, button:not(.tab-btn):active { transform: scale(.98); }
a, button { -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 3px solid rgba(215,0,21,.35); outline-offset: 2px; }

/* Homepage hero */
.hero { position: relative; overflow: hidden; background: radial-gradient(1200px 500px at 50% -10%, rgba(255,59,48,.10), transparent 60%), var(--rk-surface) !important; color: var(--rk-ink) !important; padding: 128px 20px 112px !important; }
.hero::before { content: 'HR Training · Compliance · Payroll'; display: inline-block; margin-bottom: 22px; padding: 6px 14px; border-radius: 980px; background: var(--rk-red-tint); color: var(--rk-red); font-size: 13px; font-weight: 600; letter-spacing: .01em; }
.hero h1 { font-size: clamp(40px, 6.4vw, 76px) !important; line-height: 1.04; max-width: 980px; margin: 0 auto 22px !important; letter-spacing: -0.045em; }
.hero p { font-size: clamp(17px, 1.6vw, 21px) !important; line-height: 1.5; color: var(--rk-ink-2); max-width: 720px; margin: 0 auto 40px !important; }
.hero .btn-primary { margin: 6px 6px !important; padding: 15px 30px !important; font-size: 17px; }
.hero .btn-primary + .btn-primary { background: transparent !important; color: var(--rk-red) !important; box-shadow: inset 0 0 0 1.5px var(--rk-red); }
.hero .btn-primary + .btn-primary:hover { background: var(--rk-red-tint) !important; }

/* Sections */
section { padding: 96px 20px !important; }
section.hero { padding: 128px 20px 112px !important; }
section h2, .container > h1 { font-size: clamp(32px, 4vw, 48px) !important; letter-spacing: -0.035em; font-weight: 700; margin-bottom: 48px !important; }
.about, section[style*="background"] { background: var(--rk-gray-bg) !important; }
.stat-number { color: var(--rk-red) !important; font-weight: 700 !important; letter-spacing: -0.04em; }
.price { color: var(--rk-ink) !important; font-weight: 600 !important; font-size: 24px !important; letter-spacing: -0.02em; }
small { color: var(--rk-ink-3); }

/* Cards */
.course-card, .resource-card, .card, .stat-card, .course-item, .admin-menu, .tab-content, .order-summary { background: #fff !important; border: 1px solid var(--rk-line-soft); border-radius: var(--rk-radius) !important; box-shadow: var(--rk-shadow) !important; transition: transform .35s var(--rk-ease), box-shadow .35s var(--rk-ease); }
.course-card, .resource-card { padding: 28px !important; }
.course-card:hover, .resource-card:hover, .card:hover, .stat-card:hover { transform: translateY(-4px); box-shadow: var(--rk-shadow-lg) !important; }
.course-card a[style] { color: var(--rk-red) !important; font-weight: 600 !important; }
.resource-card h3 { display: flex; flex-direction: column; align-items: center; gap: 14px; font-size: 18px; }
.resource-card h3 .rk-icon { width: 48px; height: 48px; padding: 12px; border-radius: 14px; background: var(--rk-red-tint); color: var(--rk-red); box-sizing: border-box; }
.resource-card a { color: var(--rk-red) !important; }
.card .number { color: var(--rk-ink) !important; font-weight: 700 !important; letter-spacing: -0.03em; }
.card .label, .stat-label { color: var(--rk-ink-2) !important; font-weight: 500; }
.order-summary { background: var(--rk-gray-bg) !important; box-shadow: none !important; }

/* Forms */
input, select, textarea { border: 1px solid var(--rk-line) !important; border-radius: 12px !important; padding: 13px 15px !important; font-size: 15px !important; background: #fff; color: var(--rk-ink); transition: border-color .2s var(--rk-ease), box-shadow .2s var(--rk-ease); }
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--rk-red) !important; box-shadow: 0 0 0 4px rgba(215,0,21,.12); }
input[type="radio"], input[type="checkbox"] { width: auto !important; padding: 0 !important; box-shadow: none !important; }
label { color: var(--rk-ink) !important; font-size: 14px; }

/* Auth + checkout pages (centered card on soft backdrop) */
body:not(:has(> header)) { background: radial-gradient(900px 480px at 50% 0%, rgba(255,59,48,.09), transparent 65%), var(--rk-gray-bg) !important; }
body:not(:has(> header)) > .container { border-radius: 24px !important; border: 1px solid var(--rk-line-soft); box-shadow: var(--rk-shadow-lg) !important; padding: 48px 40px !important; }
body:not(:has(> header)) > .container > h1 { font-size: 32px !important; margin-bottom: 32px !important; }
.links a { color: var(--rk-red) !important; font-weight: 500; }
.method { border: 1.5px solid var(--rk-line) !important; border-radius: 14px !important; display: flex !important; align-items: center; gap: 12px; transition: all .2s var(--rk-ease); }
.method:hover, .method:has(input:checked) { border-color: var(--rk-red) !important; background: var(--rk-red-tint) !important; }
.total { color: var(--rk-ink) !important; border-top-color: var(--rk-line) !important; }

/* Dashboards, tables, tabs */
.progress-bar, div[style*="height: 10px"] { background: var(--rk-line-soft) !important; border-radius: 980px !important; }
.progress, div[style*="height: 100%"] { background: var(--rk-red) !important; border-radius: 980px; }
table { border-radius: var(--rk-radius) !important; border: 1px solid var(--rk-line-soft); box-shadow: var(--rk-shadow) !important; border-collapse: separate !important; border-spacing: 0; }
th { background: var(--rk-gray-bg) !important; color: var(--rk-ink-2) !important; font-size: 12px; font-weight: 600 !important; text-transform: uppercase; letter-spacing: .04em; }
td { border-bottom-color: var(--rk-line-soft) !important; }
tr:hover td { background: #FAFAFC; }
.menu-item { border-bottom-color: var(--rk-line-soft) !important; transition: background .2s; }
.menu-item:hover { background: var(--rk-red-tint) !important; color: var(--rk-red); }
.tabs { gap: 6px !important; border-bottom: none !important; background: var(--rk-gray-bg); padding: 4px; border-radius: 980px; width: fit-content; max-width: 100%; overflow-x: auto; }
.tab-btn { border-radius: 980px !important; border-bottom: none !important; padding: 9px 18px !important; color: var(--rk-ink-2) !important; white-space: nowrap; }
.tab-btn.active { background: #fff !important; color: var(--rk-ink) !important; box-shadow: 0 1px 3px rgba(0,0,0,.12); }

/* Footer */
footer { background: var(--rk-gray-bg) !important; color: var(--rk-ink-3) !important; border-top: 1px solid var(--rk-line-soft); font-size: 13px; padding: 40px 20px !important; }
footer p { color: var(--rk-ink-3); }

/* Mobile */
@media (max-width: 768px) {
  header .header-content { flex-wrap: wrap; gap: 10px; }
  nav { display: flex !important; gap: 16px !important; overflow-x: auto; }
  nav a { font-size: 14px; white-space: nowrap; }
  section { padding: 64px 20px !important; }
  section.hero { padding: 84px 20px 72px !important; }
  body:not(:has(> header)) > .container { padding: 32px 22px !important; }
}
`;

export const RK_HEAD = `<meta name="theme-color" content="#ffffff"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css"><style>${CSS}</style>`;

export const RK_FOOT = `<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script><script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script><script>(function(){try{if(window.lucide)lucide.createIcons();if(window.AOS){document.querySelectorAll('.course-card,.resource-card,.card,.stat-card,.course-item,section h2,.stat').forEach(function(el,i){el.setAttribute('data-aos','fade-up');el.setAttribute('data-aos-delay',String((i%4)*60));});AOS.init({once:true,duration:700,easing:'ease-out-cubic',offset:40});}}catch(e){}})();</script>`;
