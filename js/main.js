/* anthonymahon.com — main.js v6 */

/* ============================================================
   anthonymahon.xyz — main.js v5

   The split works purely through CSS clip-path on the panels.
   JS only needs to update one CSS variable: --split.
   Everything visual follows automatically.

   Systems:
   1. Drag (mouse + touch) → updates --split
   2. Animated snap (click panel, choose mode)
   3. Mode system (body class → CSS shows/hides content)
   4. Nav (appears on scroll, shows current mode)
   5. Scroll reveal, auto age
============================================================ */

const $  = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);

const divider      = $('divider');
const panelScholar = $('panel-scholar');
const panelFoot    = $('panel-footballer');
const nav          = $('nav');
const navLinks     = $('nav-links');
const hero         = $('hero');
const root         = document.documentElement;

let split    = 0.49;
let dragging = false;
let raf      = null;
let mode     = 'none';

const clamp  = (a, v, b) => Math.min(Math.max(v, a), b);
const ease   = t => t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;

/* ── SET SPLIT ───────────────────────────────────────────────
   Updates --split on <html>. The CSS clip-paths on both panels
   read this variable automatically — no JS DOM manipulation
   of individual elements needed beyond this one line.
────────────────────────────────────────────────────────── */
function setSplit(f) {
  split = clamp(0.08, f, 0.92);
  root.style.setProperty('--split', (split * 100).toFixed(2) + '%');
  divider.style.left = (split * 100).toFixed(2) + '%';

  panelScholar.classList.toggle('is-collapsed', split < 0.13);
  panelFoot.classList.toggle('is-collapsed',    split > 0.87);
}

/* ── ANIMATED SNAP ───────────────────────────────────────── */
function animateTo(target, ms = 500) {
  const from = split, delta = target - from;
  let t0 = null;
  (function step(ts) {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0) / ms, 1);
    setSplit(from + delta * ease(p));
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

/* ── MOUSE DRAG ──────────────────────────────────────────── */
divider.addEventListener('mousedown', e => {
  e.preventDefault();
  dragging = true;
  divider.classList.add('is-dragging');
  document.body.style.cursor = 'col-resize';
});

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => setSplit(e.clientX / window.innerWidth));
});

document.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  divider.classList.remove('is-dragging');
  document.body.style.cursor = '';
});

/* ── TOUCH DRAG ──────────────────────────────────────────── */
divider.addEventListener('touchstart', e => {
  e.preventDefault(); dragging = true;
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (!dragging) return;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() =>
    setSplit(e.touches[0].clientX / window.innerWidth));
}, { passive: true });

document.addEventListener('touchend', () => { dragging = false; });

/* ── KEYBOARD ────────────────────────────────────────────── */
divider.addEventListener('keydown', e => {
  const s = 0.05;
  const map = { ArrowLeft: split-s, ArrowRight: split+s, Home: 0.08, End: 0.92, Enter: 0.5, ' ': 0.5 };
  if (e.key in map) { e.preventDefault(); animateTo(clamp(0.08, map[e.key], 0.92), 300); }
});

/* ── DOUBLE-CLICK DIVIDER: reset ─────────────────────────── */
divider.addEventListener('dblclick', () => setMode('none'));

/* ── PANEL CLICKS ────────────────────────────────────────── */
panelScholar.addEventListener('click', e => {
  if (e.target.closest('.panel__cta') || dragging) return;
  split < 0.28 ? setMode('scholar') : animateTo(0.14, 420);
});

panelFoot.addEventListener('click', e => {
  if (e.target.closest('.panel__cta') || dragging) return;
  split > 0.72 ? setMode('footballer') : animateTo(0.86, 420);
});

/* CTA buttons */
$('cta-scholar').addEventListener('click',    e => { e.preventDefault(); setMode('scholar'); });
$('cta-footballer').addEventListener('click', e => { e.preventDefault(); setMode('footballer'); });

/* ── MODE SYSTEM ─────────────────────────────────────────── */
function setMode(m) {
  mode = m;
  document.body.classList.remove('mode--footballer', 'mode--scholar');

  if (m === 'footballer') {
    document.body.classList.add('mode--footballer');
    animateTo(0.86, 580);
    buildNav(m);
    setTimeout(() => $('footballer-content')?.scrollIntoView({ behavior: 'smooth' }), 420);

  } else if (m === 'scholar') {
    document.body.classList.add('mode--scholar');
    animateTo(0.14, 580);
    buildNav(m);
    setTimeout(() => $('scholar-content')?.scrollIntoView({ behavior: 'smooth' }), 420);

  } else {
    animateTo(0.5, 480);
    buildNav('none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ── NAV BUILDER ─────────────────────────────────────────── */
function buildNav(m) {
  if (!navLinks) return;
  if (m === 'none') {
    navLinks.innerHTML = `
      <a href="#footballer-content">Footballer</a>
      <a href="#video-library">Videos</a>
      <a href="#scholar-content">Scholar</a>
      <a href="#contact">Contact</a>`;
  } else if (m === 'footballer') {
    navLinks.innerHTML = `
      <a href="#" class="nav-reset" id="nav-reset">← Overview</a>
      <a href="#footballer-content">About</a>
      <a href="#video-library">Videos</a>
      <a href="#contact">Contact</a>`;
    $('nav-reset').addEventListener('click', e => { e.preventDefault(); setMode('none'); });
  } else {
    navLinks.innerHTML = `
      <a href="#" class="nav-reset" id="nav-reset">← Overview</a>
      <span style="font-size:0.68rem;letter-spacing:0.1em;opacity:0.35">Scholar</span>
      <a href="#contact">Contact</a>`;
    $('nav-reset').addEventListener('click', e => { e.preventDefault(); setMode('none'); });
  }
}

/* ── NAV VISIBILITY ──────────────────────────────────────── */
new IntersectionObserver(
  ([e]) => nav.classList.toggle('nav--visible', !e.isIntersecting),
  { threshold: 0.05 }
).observe(hero);

/* ── SCROLL REVEAL ───────────────────────────────────────── */
const revealObs = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObs.unobserve(e.target); }
  }),
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll([
  '.eyebrow','.section-title','.prose p','.info-card',
  '.cv-row','.honour-card','.video-wrap','.video-note',
  '.contact-email','.contact-sub','.contact-links',
  '.video-card','.video-coming-soon',
].join(',')).forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${Math.min(i * 0.04, 0.3)}s`;
  revealObs.observe(el);
});

/* ── AGE ─────────────────────────────────────────────────── */
function calcAge(y, m, d) {
  const now = new Date(); let a = now.getFullYear() - y;
  if (now < new Date(now.getFullYear(), m-1, d)) a--;
  return a;
}
const ageEl = $('hero-age');
if (ageEl) ageEl.textContent = calcAge(2007, 1, 4);

/* ── INIT ────────────────────────────────────────────────── */
setSplit(0.51);
window.addEventListener('resize', () => setSplit(split), { passive: true });
