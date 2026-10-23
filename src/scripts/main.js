// ZZH v3 — boot, smooth scroll, hero (the v10 cover, live), global loop. Chapters live in scenes.js.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { state, rain, vhs, scramble, cursor, magnetic, marquees } from './fx.js';
import { SharkCanvas } from './hero.js';
import { scenes } from './scenes.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
root.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
state.reduce = reduce;
if (reduce) root.classList.add('reduced');
if (fine && !reduce) root.classList.add('fine');
gsap.defaults({ ease: 'power3.out', duration: 0.8 });
const DPR = () => Math.min(2, devicePixelRatio || 1);
const loaded = (img) => (img.complete && img.naturalWidth ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }));

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
  window.__lenis = lenis;
  lenis.on('scroll', (e) => { state.vel = e.velocity; ScrollTrigger.update(); });
  lenis.stop();
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = $(a.getAttribute('href')); if (!t) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(a.getAttribute('href') === '#top' ? 0 : t, { duration: 1.6, easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) }) : t.scrollIntoView();
}));

/* ---------- hero stage fit: 1440x900 design stage scaled to cover, anchored right ---------- */
const hero = $('#hero'), stage = $('#stage');
function fit() {
  const vw = innerWidth, vh = hero.clientHeight;
  const s = Math.max(vw / 1440, vh / 900);
  const sx = (vw - 1440 * s) * (vw < 821 ? 1 : 0.82), sy = Math.min(0, (vh - 900 * s) * 0.15);
  stage.style.transform = `translate(${sx}px,${sy}px) scale(${s})`;
  hero.style.setProperty('--s', Math.min(s, vh / 900 * 1.2).toFixed(4));
  return s;
}

/* ---------- loader: VHS boot, rewinds 2000 -> 2026 ---------- */
function loader() {
  const L = $('#loader');
  if (reduce) { L.remove(); return Promise.resolve(); }
  const cv = $('#static'), cx = cv.getContext('2d'), id = cx.createImageData(cv.width, cv.height);
  let live = true;
  (function noise() {
    if (!live) return;
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    cx.putImageData(id, 0, 0); requestAnimationFrame(noise);
  })();
  const yr = $('#ldYear'), tc = $('#ldTc'), log = $('#ldLog'), mode = $('#ldMode');
  const lines = ['> INSERTING TAPE…', '> TRACKING 12 COL GRID', '> RHINCODON.WEBP · SPOTS SOFTENED', '> SONAR: PINGING', '> DEPTH 0000 M', '> DESCEND'];
  const o = { y: 2000, f: 0 };
  return new Promise((res) => {
    const tl = gsap.timeline({ onComplete() { live = false; L.remove(); res(); } });
    tl.to(o, { y: 2026, f: 1, duration: 1.5, ease: 'power2.inOut', onUpdate() {
      yr.textContent = Math.round(o.y);
      const fr = Math.floor(o.f * 9000);
      tc.textContent = ['00', String(Math.floor(fr / 1500)).padStart(2, '0'), String(Math.floor(fr / 25) % 60).padStart(2, '0'), String(fr % 25).padStart(2, '0')].join(':');
      log.textContent = lines[Math.min(lines.length - 1, Math.floor(o.f * lines.length))];
    } });
    tl.add(() => { mode.textContent = '▶ PLAY'; mode.classList.remove('blink'); }, '>');
    tl.to(L, { scaleY: 0.006, duration: 0.22, ease: 'power4.in', delay: 0.15 });
    tl.to(L, { scaleX: 0, duration: 0.16, ease: 'power4.in', backgroundColor: '#FAF7F0' });
  });
}

/* ---------- terminal typing ---------- */
function terminal() {
  const el = $('#term');
  const sets = [
    [['$ whoami', 0], ['zzh // dev · ui · garbage human', 1], ['$ ./render rhincodon --dissolve 0.2', 0], ['[ok] 312 spots · 0 deps', 1]],
    [['$ cat /etc/os-release | head -1', 0], ['NAME="Arch Linux"', 1], ['$ echo $STATUS', 0], ['open for collab', 1]],
    [['$ ls ~/works', 0], ['ui-handbook  music-player  zzz-time', 1], ['$ date +%Y', 0], ['2026', 1]],
  ];
  if (reduce) { el.innerHTML = sets[0].map(([t, b]) => (b ? `<span class="b">${t}</span>` : t)).join('\n'); return; }
  let si = 0;
  const run = async () => {
    for (;;) {
      const set = sets[si++ % sets.length]; let done = [];
      for (const [t, b] of set) {
        for (let i = 1; i <= t.length; i++) {
          el.innerHTML = [...done, (b ? `<span class="b">${t.slice(0, i)}</span>` : t.slice(0, i)) + '<i class="cur"></i>'].join('\n');
          await new Promise((r) => setTimeout(r, b ? 12 : 38 + Math.random() * 40));
        }
        done.push(b ? `<span class="b">${t}</span>` : t);
        await new Promise((r) => setTimeout(r, b ? 380 : 220));
      }
      el.innerHTML = done.join('\n') + '<i class="cur"></i>';
      await new Promise((r) => setTimeout(r, 3800));
    }
  };
  run();
}

/* ---------- hero ---------- */
let shark = null;
async function heroInit() {
  const img = $('#srcShark'); await loaded(img);
  if (img.decode) { try { await img.decode(); } catch (e) { /* ignore */ } }
  const pct = $('#dissPct');
  shark = new SharkCanvas($('#sharkCv'), img, { reduce, onDissolve: (d) => pct && (pct.textContent = Math.round(d * 100)) });
  const s = fit(); shark.resize(s, DPR());
  addEventListener('resize', () => { const s = fit(); shark.resize(s, DPR()); ScrollTrigger.refresh(); });
  shark.intro = reduce ? 1 : 0;
  shark.update(0); shark.draw();
  // cursor parallax target (in -1..1 around hero centre)
  addEventListener('pointermove', (e) => { shark.mx = (e.clientX / innerWidth - 0.5) * 2; shark.my = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  new IntersectionObserver(([e]) => { shark.visible = e.isIntersecting; }).observe(hero);
  terminal();
}

function heroIntro() {
  if (reduce) return;
  const tl = gsap.timeline();
  tl.from('.h-grid .plus', { x: () => gsap.utils.random(-260, 260), y: () => gsap.utils.random(-200, 200), rotation: () => gsap.utils.random(-180, 180), opacity: 0, duration: 0.9, ease: 'expo.out', stagger: { each: 0.012, from: 'random' } }, 0);
  tl.from('.h-grid line', { opacity: 0, duration: 0.6, stagger: 0.008 }, 0);
  tl.to(shark, { intro: 1, duration: 1.6, ease: 'expo.out' }, 0.05);
  tl.from('.h-blue', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.8, ease: 'power4.inOut' }, 0.05);
  tl.from('.h-zzh .zl', { y: 420, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.15);
  tl.from('.h-press .inkp', { opacity: 0, duration: 0.4, ease: 'steps(3)' }, 0.55);
  tl.from('.h-press .ghost', { opacity: 0, x: -14, duration: 0.6 }, 0.6);
  tl.from('.h-top > *, .h-works li', { y: -14, opacity: 0, duration: 0.5, stagger: 0.04 }, 0.35);
  tl.from(['.h-receipt', '.h-keycap', '.h-term', '.h-collab', '.h-barcode', '.h-stamp', '.h-state', '.h-scroll'],
    { xPercent: -30, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.06 }, 0.45);
  tl.from('.h-notes .note', { opacity: 0, x: -20, duration: 0.5, stagger: 0.08 }, 0.7);
  tl.add(() => $$('.h-notes text, .h-sub').forEach((t) => scramble(t, 0.6)), 0.7);
  tl.from('.h-notes .lead', { strokeDasharray: 400, strokeDashoffset: 400, duration: 0.8, ease: 'power2.inOut' }, 0.8);
  tl.fromTo('.scribble', { strokeDasharray: 140, strokeDashoffset: 140 }, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 1.1);
  return tl;
}

function heroIdle() {
  if (reduce) return;
  $$('.stage .float').forEach((el, i) => {
    const a = +el.dataset.amp || 2;
    gsap.to(el, { y: `+=${a}`, rotation: `+=${a * 0.5}`, duration: 2.6 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 0%' });
  });
  gsap.to('.scribble', { keyframes: [{ strokeDashoffset: -140, duration: 0.8, delay: 5 }, { strokeDashoffset: 140, duration: 0 }, { strokeDashoffset: 0, duration: 0.8 }], repeat: -1, ease: 'power2.inOut' });
  // clutter parallax with cursor (depth per item)
  const items = [['.h-receipt', 10], ['.h-keycap', 16], ['.h-term', 8], ['.h-stamp', 12], ['.h-notes', 4], ['.h-press', -6], ['.h-barcode', 6]];
  const q = items.map(([s, d]) => [gsap.quickTo(s, 'xPercent', { duration: 1.2 }), gsap.quickTo(s, 'yPercent', { duration: 1.2 }), d, $(s)]);
  addEventListener('pointermove', (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    q.forEach(([qx, qy, d, el]) => { const w = el.offsetWidth || 1440, h = el.offsetHeight || 900; qx((-nx * d * 100) / w); qy((-ny * d * 100) / h); });
  }, { passive: true });
}

function heroScroll() {
  if (reduce) return;
  const tear = $('#tear');
  const words = ['LOG I', 'SUBJECT: ZZH', '2000 → 2026', 'SPECIMEN 01', 'WHO', 'DEPTH 0012 M', 'DESCEND ▼'];
  const n = words.length;
  words.forEach((w, i) => { const s = document.createElement('i'); s.style.top = (i * 900) / n - 6 + 'px'; s.style.height = 900 / n + 14 + 'px'; s.innerHTML = `<b>${w}</b>`; tear.appendChild(s); });
  const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=140%', pin: true, scrub: 0.8, anticipatePin: 1, refreshPriority: 10 } });
  tl.to(shark, { push: 1, duration: 1, ease: 'power1.in' }, 0);
  tl.to(shark, { dissolve: 0.62, duration: 0.9, ease: 'none' }, 0);
  tl.to(shark, { tear: 1, duration: 0.6, ease: 'power2.in' }, 0.3);
  const fly = ['.h-receipt', '.stage .tape', '.h-keycap', '.h-term', '.h-collab', '.h-barcode', '.h-stamp', '.h-notes', '.h-works', '.h-scroll'];
  fly.forEach((s, i) => tl.to(s, { x: gsap.utils.random(-260, 260), y: gsap.utils.random(-300, 200), rotation: gsap.utils.random(-25, 25), opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.12 + i * 0.03));
  tl.to('.h-zzh .zl', { y: (i) => [-140, 40, -90][i], x: (i) => [-120, -60, -20][i], duration: 0.6, ease: 'power2.in' }, 0.25);
  tl.to('.h-state', { x: -200, opacity: 0, duration: 0.4 }, 0.2);
  tl.to('.h-press', { y: -180, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.3);
  tl.to('.h-blue', { xPercent: 105, duration: 0.5, ease: 'power3.in' }, 0.3);
  // collage strips slide left -> right, staggered top -> bottom (slow-fast-slow)
  tl.to('#tear i', { xPercent: 105, duration: 0.42, ease: 'power3.inOut', stagger: 0.045 }, 0.62);
  tl.from('#tear i b', { xPercent: -80, opacity: 0, duration: 0.3, stagger: 0.045 }, 0.7);
}

/* ---------- global loop ---------- */
function loop(r, mq) {
  let last = performance.now();
  const pct = $('#scrollPct');
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (lenis) lenis.raf(now);
    if (!lenis) state.vel *= 0.9;
    r.frame(dt); mq && mq(dt);
    if (shark && !reduce && shark.visible && !document.hidden) { shark.update(dt); shark.draw(); }
    if (pct) { const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); pct.textContent = String(Math.round(p * 100)).padStart(3, '0'); }
  });
  gsap.ticker.lagSmoothing(0);
}

/* ---------- boot ---------- */
(async function boot() {
  fit();
  const r = rain($('#rain'));
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((x) => setTimeout(x, 2500))]) : Promise.resolve();
  const [_, __] = await Promise.all([loader(), fontsReady.then(heroInit)]);
  if (fine && !reduce) cursor();
  if (!reduce) magnetic();
  const mq = reduce ? null : marquees();
  loop(r, mq);
  heroIntro();
  heroIdle();
  heroScroll();
  scenes({ lenis, reduce, vhs, scramble, shark: () => shark });
  if (lenis) lenis.start();
  if (!lenis) addEventListener('scroll', () => ScrollTrigger.update(), { passive: true });
  requestAnimationFrame(() => ScrollTrigger.refresh());
  if (reduce && shark) { shark.update(0); shark.draw(); }
})();
