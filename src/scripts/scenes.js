// Logs I–IV: log cards, dossier flutter, case files (horizontal + camera push-in), keyboard signal, surfacing contact.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { state, burst } from './fx.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function scenes({ lenis, reduce, vhs, scramble }) {
  const mm = gsap.matchMedia();
  chapters(reduce, vhs, scramble);
  splitReveals(reduce);
  counters(reduce);
  mm.add('(min-width: 821px)', () => { who(reduce); works(reduce, lenis); });
  mm.add('(max-width: 820px)', () => { if (!reduce) $$('#papers .paper').forEach((p) => gsap.from(p, { y: 80, opacity: 0, rotation: gsap.utils.random(-12, 12), scrollTrigger: { trigger: p, start: 'top 90%' } })); });
  focusCases(reduce);
  tilt(reduce);
  signal(reduce, vhs);
  contact(reduce);
  hud();
  parallax(reduce);
  ScrollTrigger.sort();
}

/* ---------- HUD: log index + year (2000 -> 2026) and dive depth down the page ---------- */
function hud() {
  const h = $('.hud'), ch = $('#hudCh'), tc = $('#hudTc');
  const secs = [['#hero', '0'], ['#ch1', 'I'], ['#who', 'I'], ['#ch2', 'II'], ['#works', 'II'], ['#ch3', 'III'], ['#signal', 'III'], ['#ch4', 'IV'], ['#contact', 'IV']];
  secs.forEach(([s, n]) => ScrollTrigger.create({ trigger: s, start: 'top 50%', end: 'bottom 50%', onToggle: (e) => { if (e.isActive) ch.innerHTML = `LOG ${n} <em>/IV</em>`; } }));
  ScrollTrigger.create({ trigger: '#ch1', start: 'top 80%', onEnter: () => h.classList.add('on'), onLeaveBack: () => h.classList.remove('on') });
  const pad = (n) => String(n).padStart(2, '0');
  // dive profile: depth anchors at section tops (descend through I–III, surface in IV)
  const anchors = [['#hero', 0], ['#ch1', 0], ['#who', 12], ['#ch2', 50], ['#works', 200], ['#ch3', 200], ['#signal', 1000], ['#ch4', 1000], ['#contact', 0]];
  const top = (s) => { const e = $(s); const p = e.closest('.pin-spacer') || e; return p.getBoundingClientRect().top + scrollY; };
  let pts = []; const measure = () => (pts = anchors.map(([s, v]) => [top(s), v]));
  ScrollTrigger.addEventListener('refresh', measure); measure();
  const depthAt = (y) => { for (let i = pts.length - 1; i >= 0; i--) { if (y >= pts[i][0]) { const n = pts[i + 1]; if (!n) return pts[i][1]; const t = Math.min(1, (y - pts[i][0]) / Math.max(1, n[0] - pts[i][0])); return pts[i][1] + (n[1] - pts[i][1]) * t; } } return 0; };
  setInterval(() => {
    const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const d = new Date(); const y = Math.round(2000 + p * 26);
    const dep = Math.round(depthAt(scrollY + innerHeight / 2));
    tc.textContent = `${y} · DEPTH ${String(dep).padStart(4, '0')} M · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, 250);
}

/* ---------- chapter cards: VHS flicker, blue panels sweep L->R top->bottom, numeral rain reveal ---------- */
function chapters(reduce, vhs, scramble) {
  $$('.chapter').forEach((c) => {
    const num = $('.cc-num', c), panels = $$('.cc-panels i', c), title = $('.cc-title', c);
    if (reduce) return;
    const st = new SplitText(title, { type: 'chars' });
    const tl = gsap.timeline({ paused: true });
    tl.set(panels, { transformOrigin: '0% 50%', scaleX: 0 })
      .to(panels, { scaleX: 1, duration: 0.35, ease: 'power3.in', stagger: 0.06 }, 0)
      .set(panels, { transformOrigin: '100% 50%' })
      .to(panels, { scaleX: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 })
      .fromTo(num, { clipPath: 'inset(0 0 100% 0)', y: -60 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.1, ease: 'expo.out' }, 0.45)
      .from(st.chars, { yPercent: 110, opacity: 0, duration: 0.6, stagger: 0.04, ease: 'expo.out' }, 0.55)
      .from($$('.cc-l > *, .cc-note, .cc-case', c), { x: -40, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.6)
      .add(() => $$('.cc-head span:not(.dots), .cc-lab, .cc-act, .cc-case', c).forEach((e) => scramble(e, 0.6)), 0.5);
    ScrollTrigger.create({ trigger: c, start: 'top 62%', onEnter: () => { vhs(0.5); tl.restart(); }, onEnterBack: () => { vhs(0.4); } });
    // camera drift: the numeral pushes in slowly while the card passes (slow-fast-slow)
    gsap.fromTo(num, { scale: 0.92 }, { scale: 1.08, ease: 'power1.inOut', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

function splitReveals(reduce) {
  if (reduce) return;
  $$('.sec h2').forEach((h) => {
    const parts = $$('span', h).filter((s) => s.parentElement === h);
    gsap.from(parts, { yPercent: 40, clipPath: 'inset(0 0 100% 0)', duration: 1, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 80%' } });
  });
  $$('.sec .lede').forEach((p) => {
    const s = new SplitText(p, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 100, duration: 0.9, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 85%' } });
  });
  $$('.sec-head').forEach((h) => gsap.from($$('span:not(.dots)', h), { x: -30, opacity: 0, duration: 0.5, stagger: 0.07, scrollTrigger: { trigger: h, start: 'top 90%' } }));
}

function counters(reduce) {
  $$('[data-count]').forEach((el) => {
    const v = +el.dataset.count, pad = v < 10 ? 2 : 3;
    const out = (n) => (el.textContent = String(Math.round(n)).padStart(pad, '0'));
    if (reduce) return out(v);
    const o = { n: 0 }; out(0);
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { n: v, duration: 1.6, ease: 'power2.out', onUpdate: () => out(o.n) }) });
  });
}

/* ---------- I · WHO: papers flutter in one by one, then float ---------- */
function who(reduce) {
  const papers = $$('#papers .paper');
  if (reduce) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#who', start: 'top top', end: '+=110%', pin: true, scrub: 0.9, refreshPriority: 9 } });
  papers.forEach((p, i) => {
    tl.from(p, { xPercent: 70 + i * 20, yPercent: -140 - i * 30, rotation: gsap.utils.random(-50, 50), opacity: 0, duration: 1, ease: 'power3.inOut' }, i * 0.55);
  });
  tl.to({}, { duration: 0.4 });
  // idle drift (x/y px; the flutter uses percent + rotation so they compose)
  papers.forEach((p, i) => gsap.to(p, { y: gsap.utils.random(-9, 9), x: gsap.utils.random(-5, 5), duration: 3 + i * 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
}

/* ---------- II · WORKS: horizontal drawer with snap; focus scale; click = camera push-in ---------- */
let worksTween = null;
function works(reduce, lenis) {
  if (reduce) return;
  const track = $('#wTrack'), bar = $('#wBar'), count = $('#wCount'), cases = $$('.case'), needle = $('.gauge');
  const dist = () => track.scrollWidth - innerWidth;
  const centers = () => cases.map((c) => { const x = c.offsetLeft + c.offsetWidth / 2 - innerWidth / 2; return Math.max(0, Math.min(1, x / dist())); });
  let snaps = centers();
  worksTween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.w-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, refreshPriority: 8,
      onRefresh: () => { snaps = centers(); },
      snap: { snapTo: (v) => { const all = [0, ...snaps, 1]; return all.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)); }, duration: { min: 0.3, max: 0.9 }, ease: 'power2.inOut', delay: 0.08 },
      onUpdate: (st) => {
        bar.style.width = st.progress * 100 + '%';
        if (needle) needle.style.setProperty('--ndl', (st.progress * 300).toFixed(1) + 'deg');
        let best = 0, bd = 1e9;
        cases.forEach((c, i) => {
          const b = c.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - innerWidth / 2);
          if (d < bd) { bd = d; best = i; }
          const k = Math.min(1, d / innerWidth);
          gsap.set($('.case-in', c), { scale: 1 - k * 0.12, opacity: 1 - k * 0.35 });
        });
        count.textContent = `${String(best + 1).padStart(2, '0')}/04`;
        if (Math.abs(st.getVelocity()) > 200) closeFocus();
      },
      onLeave: closeFocus, onLeaveBack: closeFocus,
    },
  });
  // each file's contents slide in L->R, staggered top->bottom, as it enters the drawer
  cases.forEach((c, i) => {
    gsap.from($$('.cs-strip, .cs-title, .cs-tag, .cs-fig, .cs-body, .cs-spec, .cs-act', c), {
      x: -50, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: i === 0 ? { trigger: '#works', start: 'top 45%', toggleActions: 'play none none none' }
        : { trigger: c, containerAnimation: worksTween, start: 'left 85%', toggleActions: 'play none none none' },
    });
  });
}

let focused = null;
function closeFocus() {
  if (!focused) return;
  const w = $('#works'); w.classList.remove('focus'); focused.classList.remove('on'); focused = null;
  gsap.to('#wCam', { scale: 1, x: 0, y: 0, duration: 0.8, ease: 'power3.inOut' });
}
function focusCases(reduce) {
  const w = $('#works');
  $$('.case').forEach((c) => {
    const open = (e) => {
      if (e && e.target.closest('a')) return;
      if (focused === c) return closeFocus();
      if (focused) focused.classList.remove('on');
      focused = c; c.classList.add('on'); w.classList.add('focus');
      if (reduce || innerWidth < 821) return;
      const b = c.getBoundingClientRect(), cam = $('#wCam').getBoundingClientRect();
      const s = 1.14, cx = b.left + b.width / 2 - (cam.left + cam.width / 2), cy = b.top + b.height / 2 - (cam.top + cam.height / 2);
      gsap.to('#wCam', { scale: s, x: -cx * s, y: -cy * s + 10, duration: 1.1, ease: 'expo.inOut' });
    };
    c.addEventListener('click', open);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFocus(); });
  document.addEventListener('click', (e) => { if (focused && !e.target.closest('.case')) closeFocus(); });
}
function tilt(reduce) {
  if (reduce || !matchMedia('(pointer: fine)').matches) return;
  $$('.case').forEach((c) => {
    const inn = $('.case-in', c);
    const rx = gsap.quickTo(inn, 'rotationX', { duration: 0.6 }), ry = gsap.quickTo(inn, 'rotationY', { duration: 0.6 });
    c.addEventListener('pointermove', (e) => { const b = c.getBoundingClientRect(); ry(((e.clientX - b.left) / b.width - 0.5) * 12); rx(-((e.clientY - b.top) / b.height - 0.5) * 9); });
    c.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
  // papers in WHO tilt a little too
  $$('#papers .paper').forEach((p) => {
    const ry = gsap.quickTo(p, 'rotationY', { duration: 0.8 }), rx = gsap.quickTo(p, 'rotationX', { duration: 0.8 });
    p.addEventListener('pointermove', (e) => { const b = p.getBoundingClientRect(); ry(((e.clientX - b.left) / b.width - 0.5) * 10); rx(-((e.clientY - b.top) / b.height - 0.5) * 8); });
    p.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------- III · SIGNAL: typing lights keys; z-z-h makes the shark leap ---------- */
function signal(reduce, vhs) {
  const out = $('#tvOut'), kc = $('#kcount'), keys = {};
  $$('.key').forEach((k) => (keys[k.dataset.k] = k));
  let buf = '', typed = '', n = 0;
  const tape = signalLog(reduce);
  const press = (ch) => {
    const k = keys[ch]; if (!k) return;
    tape(ch);
    k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 140);
    n++; kc.textContent = String(n).padStart(3, '0');
    typed = (typed + (ch === ' ' ? ' ' : ch.toUpperCase())).slice(-16); out.textContent = typed + '_';
    buf = (buf + ch).slice(-3);
    if (buf === 'zzh') { buf = ''; leap(reduce, vhs); out.textContent = 'ZZH DETECTED ▶'; }
  };
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.closest && e.target.closest('input,textarea')) return;
    const ch = e.key.length === 1 ? e.key.toLowerCase() : null;
    if (ch && keys[ch]) { press(ch); if (ch === ' ' && e.target === document.body && $('#signal').getBoundingClientRect().top < innerHeight * 0.5 && $('#signal').getBoundingClientRect().bottom > innerHeight * 0.5) e.preventDefault(); }
  });
  $$('.key').forEach((k) => k.addEventListener('pointerdown', () => press(k.dataset.k)));
  if (reduce) return;
  gsap.from('.key', { y: -40, opacity: 0, rotation: () => gsap.utils.random(-20, 20), duration: 0.7, ease: 'back.out(2)', stagger: { each: 0.02, from: 'random' }, scrollTrigger: { trigger: '#kb', start: 'top 80%' } });
  gsap.to('.cassette', { y: -10, rotation: 5, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.tv', { rotation: -1.5, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  // idle demo: the keyboard types "zzh" by itself once when first seen
  ScrollTrigger.create({ trigger: '#kb', start: 'top 60%', once: true, onEnter: () => {
    ['h', 'e', 'l', 'l', 'o'].forEach((c, i) => setTimeout(() => { const k = keys[c]; if (k) { k.classList.add('lit'); setTimeout(() => k.classList.remove('lit'), 260); } }, 600 + i * 160));
  } });
}
function leap(reduce, vhs) {
  if (reduce) return;
  const el = $('#leap'), fx = $('#fx'), W = innerWidth, H = innerHeight;
  vhs(0.35);
  const p = { t: 0 };
  gsap.set(el, { opacity: 1 });
  gsap.to(p, { t: 1, duration: 1.5, ease: 'power1.inOut',
    onUpdate() {
      const t = p.t, x = -560 + (W + 700) * t, y = H * 0.75 - Math.sin(t * Math.PI) * H * 0.6;
      const ang = Math.cos(t * Math.PI) * -22;
      gsap.set(el, { x, y, rotation: ang });
      if (Math.random() < 0.7) {
        const g = document.createElement('span'); g.textContent = '01#%+.:@'[(Math.random() * 8) | 0];
        g.style.cssText = `position:absolute;left:${x + 40}px;top:${y + 60 + Math.random() * 80}px;font:12px "JetBrains Mono",monospace;color:${Math.random() < 0.3 ? '#002FA7' : '#0E0E0E'}`;
        fx.appendChild(g); gsap.to(g, { y: 60 + Math.random() * 60, x: -30, opacity: 0, duration: 1, onComplete: () => g.remove() });
      }
    },
    onComplete() { gsap.set(el, { opacity: 0 }); burst(W * 0.9, H * 0.4); } });
}

/* ---------- IV · CONTACT: ascent (particles rise like bubbles); shark sinks into ASCII and reassembles ---------- */
function contact(reduce) {
  const set = (v) => { state.ascent = v; document.documentElement.classList.toggle('ascent', v); };
  ScrollTrigger.create({ trigger: '#ch4', start: 'top 55%', endTrigger: '#contact', end: 'bottom top', onToggle: (e) => set(e.isActive) });
  const cv = $('#sinkCv'), img = $('#srcSharkSm');
  const sink = new Sink(cv, img);
  if (reduce) { const go = () => { sink.size(); sink.draw(0, 0); }; img.complete ? go() : img.addEventListener('load', go); return; }
  const o = { p: 0 };
  ScrollTrigger.create({ trigger: '.ct-pin', start: 'top top', end: '+=120%', pin: true, scrub: 0.6, refreshPriority: 7, onUpdate: (st) => (o.p = st.progress) });
  let on = false, t = 0;
  ScrollTrigger.create({ trigger: '#contact', start: 'top bottom', end: 'bottom top', onToggle: (e) => (on = e.isActive) });
  const go = () => { sink.size(); addEventListener('resize', () => sink.size()); gsap.ticker.add((tm, dt) => { if (!on) return; t += dt / 1000; const f = o.p < 0.5 ? o.p * 2 : (1 - o.p) * 2; sink.draw(Math.max(0, Math.min(1, f * 1.15)), t); }); };
  img.complete && img.naturalWidth ? go() : img.addEventListener('load', go);
  gsap.from('.tix', { x: -80, clipPath: 'inset(0 100% 0 0)', duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.tickets', start: 'top 75%' } });
  const bye = $('.bye .big');
  gsap.from(bye, { yPercent: 60, clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.bye', start: 'top 85%' } });
}
class Sink {
  constructor(cv, img) { this.cv = cv; this.img = img; this.ctx = cv.getContext('2d'); this.CW = 7; this.LH = 11; }
  size() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    this.W = r.width; this.H = r.height; this.dpr = dpr; this.cv.width = r.width * dpr; this.cv.height = r.height * dpr;
    const sw = Math.min(this.W * 0.9, 1300), sh = sw * this.img.naturalHeight / this.img.naturalWidth;
    this.box = { x: (this.W - sw) / 2, y: this.H * 0.5 - sh * 0.62, w: sw, h: sh };
    // tinted (paper) raster + cell darkness
    const t = document.createElement('canvas'); t.width = sw * dpr; t.height = sh * dpr; const tx = t.getContext('2d');
    tx.drawImage(this.img, 0, 0, t.width, t.height); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#ECE9E2'; tx.fillRect(0, 0, t.width, t.height);
    this.tint = t;
    this.cols = Math.ceil(sw / this.CW); this.rows = Math.ceil(sh / this.LH);
    const g = document.createElement('canvas'); g.width = this.cols; g.height = this.rows; const gx = g.getContext('2d', { willReadFrequently: true });
    gx.drawImage(this.img, 0, 0, this.cols, this.rows); const d = gx.getImageData(0, 0, this.cols, this.rows).data;
    this.cells = [];
    const CH = ' .:-=+*%#@01#%';
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) { const v = d[(r * this.cols + c) * 4 + 3] / 255; if (v > 0.1) this.cells.push({ c, r, v, k: Math.random(), ch: Math.min(9, (v * 10) | 0) }); }
    // glyph atlas (paper + blue), drawn with drawImage instead of thousands of fillText calls
    const gw = Math.ceil(this.CW * dpr), gh = Math.ceil(this.LH * dpr), at = document.createElement('canvas');
    at.width = gw * CH.length; at.height = gh * 2; const ax = at.getContext('2d');
    ax.font = `${10 * dpr}px "JetBrains Mono", monospace`; ax.textBaseline = 'top';
    ['#ECE9E2', '#5A82FF'].forEach((col, row) => { ax.fillStyle = col; for (let i = 0; i < CH.length; i++) ax.fillText(CH[i], i * gw, row * gh); });
    this.atlas = at; this.gw = gw; this.gh = gh;
  }
  draw(f, t) {
    const { ctx, dpr, box, CW, LH } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, this.W, this.H);
    if (!this.cells) return;
    const bob = Math.sin(t * 0.8) * 6;
    // raster where not yet dissolved: dissolve sweeps tail -> head
    ctx.save(); ctx.globalAlpha = 0.22;
    ctx.beginPath();
    const edge = 1.15 * f;
    for (let c = 0; c < this.cols; c++) { const x = c / this.cols; const thr = (1 - x) * 0.85 + 0.15; if (thr > edge) ctx.rect(box.x + c * CW, box.y + bob, CW + 0.5, box.h); }
    ctx.clip(); ctx.drawImage(this.tint, box.x, box.y + bob, box.w, box.h); ctx.restore();
    const at = this.atlas, gw = this.gw, gh = this.gh;
    for (const s of this.cells) {
      const x = s.c / this.cols, thr = (1 - x) * 0.85 + 0.15 * s.k;
      if (thr > edge) continue;
      const a = Math.min(1, (edge - thr) * 6);
      const fall = Math.pow(a, 2) * (120 + s.k * 260) * f;
      ctx.globalAlpha = 0.25 + 0.5 * s.v * (1 - f * 0.4);
      const gi = f > 0.6 && s.k < 0.3 ? 10 + (((t * 10) | 0) + s.c & 3) : s.ch;
      ctx.drawImage(at, gi * gw, (s.k < 0.06 ? 1 : 0) * gh, gw, gh, box.x + s.c * CW + (s.k - 0.5) * 30 * f, box.y + s.r * LH + bob + fall, CW, LH);
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- v3.1 · parallax layers: [data-depth] drifts against the scroll (foreground / midground / background) ---------- */
function parallax(reduce) {
  if (reduce) return;
  $$('[data-depth]').forEach((el) => {
    const d = +el.dataset.depth || 0.2, sec = el.closest('section') || el.parentElement;
    gsap.fromTo(el, { y: () => innerHeight * d * 0.35 }, { y: () => -innerHeight * d * 0.35, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
}

/* ---------- v3.1 · SIGNAL log: each key punches a 5-bit column into the paper tape and kicks the trace ---------- */
function signalLog(reduce) {
  const tape = $('#ptape'), path = $('#sgPath'), hz = $('#sgHz');
  if (!tape || !path) return () => {};
  const COLS = 24, cols = [];
  for (let i = 0; i < COLS; i++) { const c = document.createElement('i'); c.innerHTML = '<b></b><b></b><b class="sp"></b><b></b><b></b><b></b>'; tape.appendChild(c); cols.push([...c.children].filter((b) => !b.classList.contains('sp'))); }
  const codes = [];
  const paint = () => cols.forEach((bs, i) => { const v = codes[codes.length - COLS + i]; bs.forEach((b, j) => b.classList.toggle('h', v != null && ((v >> j) & 1) === 1)); });
  // seed with "ZZH 2026" so the tape is never blank
  [...'zzh 2026'].forEach((ch) => codes.push(ch === ' ' ? 0 : (ch.charCodeAt(0) & 31) || 1)); paint();
  let amp = 0.15, ph = 0, on = false;
  ScrollTrigger.create({ trigger: '#signal', start: 'top bottom', end: 'bottom top', onToggle: (e) => (on = e.isActive) });
  const draw = () => {
    const N = 90; let d = '';
    for (let i = 0; i <= N; i++) { const t = i / N, x = t * 300; const y = 30 + Math.sin(t * 26 + ph) * (4 + amp * 22) * Math.sin(t * Math.PI) + Math.sin(t * 71 + ph * 2.3) * amp * 6; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    path.setAttribute('d', d);
  };
  draw();
  if (!reduce) gsap.ticker.add((tm, dt) => { if (!on || document.hidden) return; ph += dt / 1000 * 3; amp += (0.15 - amp) * 0.05; draw(); });
  return (ch) => {
    codes.push(ch === ' ' ? 0 : (ch.charCodeAt(0) & 31) || 1); if (codes.length > 64) codes.splice(0, codes.length - COLS);
    paint(); amp = 1;
    if (hz) hz.textContent = (12 + (ch.charCodeAt(0) % 32) * 3.5).toFixed(1) + ' kHz';
    if (reduce) draw();
  };
}
