// Shared effects: rain + particles canvas, VHS flicker, cursor + click sparkle, magnetic, marquees, scramble.
import gsap from 'gsap';

export const state = { vel: 0, dir: 1, ascent: false, mx: innerWidth / 2, my: innerHeight / 2, reduce: false };
const DPR = () => Math.min(2, devicePixelRatio || 1);

/* ---------- rain (diagonal, same angle as the title hatch) + point/line/plane particles ---------- */
export function rain(cv) {
  const ctx = cv.getContext('2d');
  const ANG = { x: -0.375, y: 0.927 };
  let W = 0, H = 0, drops = [], parts = [], dpr = 1, speedK = 1, dirS = 1, run = true;
  const mkDrop = (init) => ({ x: Math.random() * (W + 400), y: init ? Math.random() * H : -100 - Math.random() * 200, l: 14 + Math.random() * 70, v: 520 + Math.random() * 900, a: 0.08 + Math.random() * 0.22, w: Math.random() < 0.15 ? 1.4 : 0.8 });
  const mkPart = () => ({ x: Math.random() * W, y: Math.random() * H, t: (Math.random() * 3) | 0, s: 3 + Math.random() * 6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 10, vy: -4 - Math.random() * 10, z: 0.2 + Math.random() * 0.8, f: Math.random() < 0.5 });
  function size() {
    dpr = 1; W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const n = Math.round((W * H) / 11000);
    drops = Array.from({ length: Math.min(220, n) }, () => mkDrop(true));
    parts = Array.from({ length: Math.round(Math.min(46, n / 4)) }, mkPart);
  }
  size(); addEventListener('resize', size);
  let lastY = scrollY;
  function frame(dt) {
    const dy = scrollY - lastY; lastY = scrollY;
    const want = state.ascent ? -1 : state.vel < -0.4 ? -1 : 1;
    dirS += (want - dirS) * Math.min(1, dt * 4);
    speedK += ((1 + Math.min(4, Math.abs(state.vel) * 0.06)) - speedK) * Math.min(1, dt * 5);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#FAF7F0'; ctx.lineCap = 'butt';
    for (const d of drops) {
      const sp = d.v * speedK * dirS * dt;
      d.x += ANG.x * sp; d.y += ANG.y * sp;
      if (dirS > 0 && d.y > H + 100) Object.assign(d, mkDrop(false));
      if (dirS < 0 && d.y < -120) { Object.assign(d, mkDrop(false)); d.y = H + 100 + Math.random() * 100; }
      ctx.globalAlpha = d.a; ctx.lineWidth = d.w;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - ANG.x * d.l, d.y - ANG.y * d.l); ctx.stroke();
    }
    ctx.fillStyle = '#FAF7F0';
    for (const p of parts) {
      p.r += p.vr * dt; p.x += p.vx * dt; p.y += (p.vy * dirS) * dt - dy * p.z * 0.25;
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20; if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      ctx.globalAlpha = 0.28 + p.z * 0.3; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.lineWidth = 1;
      if (p.t === 0) p.f ? ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s) : ctx.strokeRect(-p.s / 2, -p.s / 2, p.s, p.s);
      else if (p.t === 1) { ctx.beginPath(); ctx.moveTo(0, -p.s * 0.7); ctx.lineTo(p.s * 0.6, p.s * 0.4); ctx.lineTo(-p.s * 0.6, p.s * 0.4); ctx.closePath(); p.f ? ctx.fill() : ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(-p.s * 2, 0); ctx.lineTo(p.s * 2, 0); ctx.stroke(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  if (state.reduce) { frame(0); return { frame() {} }; }
  return { frame: (dt) => run && frame(dt), pause(v) { run = !v; } };
}

/* ---------- VHS tracking flicker (overlay only: never transform main, pins live inside it) ---------- */
let vhsBusy = false;
export function vhs(dur = 0.5) {
  if (state.reduce || vhsBusy) return;
  vhsBusy = true;
  const el = document.getElementById('vhs'), bands = el.querySelectorAll('.vhs-band');
  el.classList.add('on');
  const tl = gsap.timeline({ onComplete() { el.classList.remove('on'); vhsBusy = false; } });
  bands.forEach((b, i) => tl.fromTo(b, { top: (i ? 85 : -10) + '%' }, { top: (i ? -10 : 105) + '%', duration: dur, ease: 'none' }, 0));
  tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: dur * 0.5, ease: 'steps(4)' }, dur * 0.5);
  return tl;
}

/* ---------- scramble labels ---------- */
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#+/<>';
export function scramble(el, dur = 0.5) {
  if (state.reduce || !el) return;
  const nodes = [];
  const walk = (n) => (n.nodeType === 3 ? n.nodeValue.trim() && nodes.push(n) : n.childNodes.forEach(walk));
  walk(el);
  nodes.forEach((n) => {
    const fin = n.__f ?? (n.__f = n.nodeValue); const o = { p: 0 };
    gsap.to(o, { p: 1, duration: dur, ease: 'none', overwrite: true,
      onUpdate() { const k = Math.floor(o.p * fin.length); let s = fin.slice(0, k); for (let i = k; i < fin.length; i++) s += /\s/.test(fin[i]) ? fin[i] : POOL[(Math.random() * POOL.length) | 0]; n.nodeValue = s; },
      onComplete() { n.nodeValue = fin; } });
  });
}

/* ---------- cursor: crosshair + coordinates; click = ripple + four-point sparkle + bits ---------- */
export function cursor() {
  const c = document.getElementById('cursor'), xy = document.getElementById('cxy'), fx = document.getElementById('fx');
  const qx = gsap.quickTo(c, 'x', { duration: 0.12, ease: 'power3' }), qy = gsap.quickTo(c, 'y', { duration: 0.12, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    state.mx = e.clientX; state.my = e.clientY; qx(e.clientX); qy(e.clientY);
    xy.textContent = `X ${String(Math.round(e.clientX)).padStart(4, '0')} · Y ${String(Math.round(e.clientY + scrollY)).padStart(5, '0')}`;
    const hot = e.target.closest && e.target.closest('a,button,.case,.key,[data-mag]');
    c.classList.toggle('hot', !!hot);
  }, { passive: true });
  addEventListener('pointerdown', (e) => burst(e.clientX, e.clientY, fx));
}
export function burst(x, y, fx = document.getElementById('fx')) {
  if (state.reduce) return;
  const r = document.createElement('i'); r.className = 'ripple'; r.style.left = x + 'px'; r.style.top = y + 'px'; fx.appendChild(r);
  gsap.fromTo(r, { scale: 0, opacity: 1 }, { scale: 9, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => r.remove() });
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '-13 -13 26 26'); s.setAttribute('class', 'spark');
  s.innerHTML = '<path d="M0 -13 C1 -3 3 -1 13 0 C3 1 1 3 0 13 C-1 3 -3 1 -13 0 C-3 -1 -1 -3 0 -13Z"/>';
  s.style.left = x + 'px'; s.style.top = y + 'px'; fx.appendChild(s);
  gsap.fromTo(s, { scale: 0, rotation: -45 }, { scale: 1.2, rotation: 45, duration: 0.35, ease: 'back.out(3)', yoyo: true, repeat: 1, onComplete: () => s.remove() });
  for (let i = 0; i < 7; i++) {
    const b = document.createElement('i'); b.className = 'bit';
    const t = i % 3; if (t === 1) { b.style.background = 'transparent'; b.style.border = '1px solid #0E0E0E'; } if (t === 2) { b.style.width = '12px'; b.style.height = '1px'; }
    if (i === 3) b.style.background = '#002FA7';
    b.style.left = x + 'px'; b.style.top = y + 'px'; fx.appendChild(b);
    const a = (i / 7) * 6.283 + Math.random() * 0.5, d = 30 + Math.random() * 40;
    gsap.to(b, { x: Math.cos(a) * d, y: Math.sin(a) * d, rotation: Math.random() * 360, opacity: 0, duration: 0.6 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => b.remove() });
  }
}

/* ---------- magnetic ---------- */
export function magnetic(root = document) {
  root.querySelectorAll('[data-mag]').forEach((el) => {
    const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect(); const sc = b.width / (el.offsetWidth || b.width);
      qx(((e.clientX - b.left - b.width / 2) * 0.32) / sc); qy(((e.clientY - b.top - b.height / 2) * 0.32) / sc);
    });
    el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.4)' }); });
  });
}

/* ---------- marquees: speed and direction react to scroll velocity ---------- */
export function marquees() {
  const list = [...document.querySelectorAll('.marquee .mq-track, .ticker .tk-track')].map((t) => {
    const span = t.firstElementChild; t.appendChild(span.cloneNode(true));
    return { t, span, x: 0, base: +(t.closest('[data-speed]')?.dataset.speed || 50), on: true };
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { const m = list.find((m) => m.t.parentElement === e.target); if (m) m.on = e.isIntersecting; }));
  list.forEach((m) => io.observe(m.t.parentElement));
  return (dt) => {
    for (const m of list) {
      if (!m.on) continue;
      const w = m.span.offsetWidth || 1;
      const dir = state.vel < -0.3 ? -1 : 1;
      m.x -= (m.base + Math.min(900, Math.abs(state.vel) * 22)) * dt * dir;
      if (m.x <= -w) m.x += w; if (m.x > 0) m.x -= w;
      m.t.style.transform = `translate3d(${m.x}px,0,0)`;
    }
  };
}
