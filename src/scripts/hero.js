// Hero shark: realistic photocopy raster + live ASCII tail, drawn on one canvas in stage (design) units.
// Geometry follows brut/compose2.py (v10) at 1x: shark box at (12,160), 1396.5 x 430.
const SX = 12, SY = 160, SW = 1396.5;
const CW = 6, LH = 10;              // ASCII cell (design px)
const RAMP = ' .:-=+*%#@';
const POOL = '01#%+.:=*@<>/';
const INK = '#0E0E0E', GREY = '#96948E', KB = '#002FA7';

export class SharkCanvas {
  constructor(canvas, img, opts = {}) {
    this.cv = canvas; this.img = img; this.ctx = canvas.getContext('2d');
    this.reduce = !!opts.reduce;
    this.SH = SW * img.naturalHeight / img.naturalWidth;
    this.cols = Math.ceil(SW / CW); this.rows = Math.ceil(this.SH / LH);
    this.k = img.naturalWidth / SW;   // image px per design px
    this.t = 0; this.mx = 0; this.my = 0; this.smx = 0; this.smy = 0;
    this.push = 0; this.tear = 0; this.dissolve = 0.2; this._mDiss = -1;
    this.intro = 0; this.jit = 0; this.jitT = 2; this.visible = true; this.s = 1; this.dpr = 1;
    this.onDissolve = opts.onDissolve || (() => {});
    this._grid(); this._strays();
    this.buf = document.createElement('canvas'); this.buf.width = img.naturalWidth; this.buf.height = img.naturalHeight;
    this.mask = document.createElement('canvas'); this.mask.width = this.cols; this.mask.height = this.rows;
    let seed = 9; this.rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    this.tearRnd = Array.from({ length: 12 }, () => this.rnd() * 2 - 1);
  }
  _grid() {
    const c = document.createElement('canvas'); c.width = this.cols; c.height = this.rows;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(this.img, 0, 0, this.cols * CW * this.k, this.rows * LH * this.k, 0, 0, this.cols, this.rows);
    const d = x.getImageData(0, 0, this.cols, this.rows).data;
    const n = this.cols * this.rows;
    this.v = new Float32Array(n); this.r = new Float32Array(n); this.ch = new Uint8Array(n); this.col = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const v = d[i * 4 + 3] / 255; this.v[i] = v; this.r[i] = Math.random();
      this.ch[i] = Math.min(9, (v * 10) | 0);
      this.col[i] = v > 0.25 && v < 0.5 && Math.random() < 0.12 ? 2 : 0;
    }
    this.scr = new Uint8Array(n); // 255 = ramp glyph, else POOL index
    this.scr.fill(255);
  }
  _strays() {
    this.st = [];
    for (let i = 0; i < 90; i++) this.st.push(this._stray(true));
  }
  _stray(init) {
    const az = SW * (0.2 + this.dissolve * 0.25);
    return {
      x: init ? -120 + Math.random() * (az + 120) : az * (0.4 + Math.random() * 0.6),
      y: Math.random() * this.SH, vx: -(6 + Math.random() * 22), vy: (Math.random() - 0.5) * 3,
      c: POOL[(Math.random() * POOL.length) | 0], f: [7, 9.5, 12][(Math.random() * 3) | 0],
      k: Math.random() < 0.55 ? INK : Math.random() < 0.5 ? GREY : KB, a: 0.5 + Math.random() * 0.5,
    };
  }
  resize(s, dpr) {
    this.s = s; this.dpr = dpr;
    const w = Math.round(1440 * s * dpr), h = Math.round(900 * s * dpr);
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    this.cv.style.width = 1440 * s + 'px'; this.cv.style.height = 900 * s + 'px';
    this.cv.style.transform = `scale(${1 / s})`;
    this._atlas();
  }
  _atlas() {
    // glyph atlas: rows = colour (ink, grey, blue), cols = RAMP + POOL
    const sc = this.s * this.dpr, gw = Math.ceil(CW * sc), gh = Math.ceil(LH * sc);
    const chars = RAMP + POOL, a = document.createElement('canvas');
    a.width = gw * chars.length; a.height = gh * 3;
    const x = a.getContext('2d');
    x.font = `${9.5 * sc}px "JetBrains Mono", monospace`; x.textBaseline = 'top';
    [INK, GREY, KB].forEach((c, row) => { x.fillStyle = c; for (let i = 0; i < chars.length; i++) x.fillText(chars[i], i * gw, row * gh); });
    this.atlas = a; this.gw = gw; this.gh = gh;
  }
  // which cells are ASCII for a given dissolve (0.2 = v10 look)
  _isAscii(c, i, d) {
    const a = (d) * this.cols, tr = (d + 0.11) * this.cols;
    if (c <= a) return true;
    if (c >= tr) return false;
    return this.r[i] > (c - a) / (tr - a);
  }
  _rebuildMask() {
    const d = this.dissolve, m = this.mask.getContext('2d');
    const id = m.createImageData(this.cols, this.rows);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const i = r * this.cols + c;
      id.data[i * 4 + 3] = this._isAscii(c, i, d) ? 0 : 255;
    }
    m.putImageData(id, 0, 0);
    const b = this.buf.getContext('2d');
    b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, this.buf.width, this.buf.height);
    b.drawImage(this.img, 0, 0);
    b.globalCompositeOperation = 'destination-in'; b.imageSmoothingEnabled = false;
    b.drawImage(this.mask, 0, 0, this.cols * CW * this.k, this.rows * LH * this.k);
    b.globalCompositeOperation = 'source-over';
    this._mDiss = d;
    this.asc = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const i = r * this.cols + c;
      if (this.v[i] > 0.08 && this._isAscii(c, i, d)) this.asc.push(i);
    }
    this.onDissolve(d);
  }
  bands() {
    const SH = this.SH, t = this.tear;
    if (t > 0.001) {
      const n = 9, out = [];
      for (let i = 0; i < n; i++) out.push([i / n, (i + 1) / n, this.tearRnd[i] * 300 * t * t + (i % 2 ? 1 : -1) * 40 * t, (i - n / 2) * 16 * t]);
      return out;
    }
    const j = this.jit;
    const b = [[0, 0.40, 0, 0], [0.40, 0.47, 46 + j * 40, 0], [0.47, 0.62, 0, 0], [0.62, 0.66, -28 - j * 50, 0], [0.66, 1, 0, 0]];
    if (j > 0) { b[2] = [0.47, 0.53, 0, 0]; b.splice(3, 0, [0.53, 0.56, 70 * j * (this.jitDir || 1), 0], [0.56, 0.62, 0, 0]); }
    return b;
  }
  wave(x) {
    const TZ = SW * 0.5;
    if (x >= TZ) return 0;
    const w = Math.pow(1 - x / TZ, 1.6);
    return Math.sin(this.t * 1.7 - x * 0.009) * 11 * w;
  }
  update(dt) {
    this.t += dt;
    this.smx += (this.mx - this.smx) * Math.min(1, dt * 3); this.smy += (this.my - this.smy) * Math.min(1, dt * 3);
    // occasional glitch jitter
    this.jitT -= dt;
    if (this.jitT < 0) { this.jit = 1; this.jitDir = Math.random() < 0.5 ? -1 : 1; this.jitT = 2.2 + Math.random() * 3; this.jitOff = 0.16; }
    if (this.jitOff > 0) { this.jitOff -= dt; if (this.jitOff <= 0) this.jit = 0; }
    if (Math.abs(this.dissolve - this._mDiss) > 0.008) this._rebuildMask();
    // scramble: re-pick a share of glyphs
    this._sc = (this._sc || 0) + dt;
    if (this._sc > 0.09) {
      this._sc = 0;
      const rate = 0.025 + this.dissolve * 0.12 + this.tear * 0.3, A = this.asc;
      for (let n = (A.length * rate) | 0; n > 0; n--) {
        const i = A[(Math.random() * A.length) | 0];
        this.scr[i] = Math.random() < 0.55 ? 255 : (Math.random() * POOL.length) | 0;
      }
    }
    for (const s of this.st) {
      s.x += s.vx * dt * (1 + this.dissolve * 2); s.y += s.vy * dt;
      if (s.x < -170) Object.assign(s, this._stray(false));
    }
  }
  draw() {
    const { ctx } = this, sc = this.s * this.dpr, SH = this.SH;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    // shark transform: idle bob, cursor parallax, push forward, intro swim-in
    const bob = Math.sin(this.t * 0.9) * 4;
    const px = -this.smx * 14 + this.push * 260 - (1 - this.intro) * 900;
    const py = -this.smy * 8 + bob + this.push * 40;
    const scl = 1 + this.push * 0.28;
    const hx = SX + SW * 0.9, hy = SY + SH * 0.52;
    const glance = Math.max(-0.04, Math.min(0.04, this.smy * 0.035)) + Math.sin(this.t * 0.6) * 0.004;
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
    ctx.translate(hx + px, hy + py); ctx.rotate(glance); ctx.scale(scl, scl); ctx.translate(-hx, -hy);
    ctx.translate(SX, SY);
    const B = this.bands(), k = this.k, TZ = SW * 0.5, SL = CW * 2;
    ctx.imageSmoothingEnabled = true;
    for (const [f0, f1, dx, dy] of B) {
      const y0 = f0 * SH, h = (f1 - f0) * SH;
      for (let x = 0; x < TZ; x += SL) {
        const w = Math.min(SL, TZ - x) + 0.6;
        ctx.drawImage(this.buf, x * k, y0 * k, w * k, h * k, x + dx, y0 + dy + this.wave(x + SL / 2), w, h);
      }
      ctx.drawImage(this.buf, TZ * k, y0 * k, (SW - TZ) * k, h * k, TZ + dx, y0 + dy, SW - TZ, h);
    }
    // ASCII cells
    const A = this.asc, gw = this.gw, gh = this.gh, cols = this.cols;
    const rowBand = new Float32Array(this.rows * 2);
    for (let r = 0; r < this.rows; r++) {
      const fy = (r + 0.5) * LH / SH; let dx = 0, dy = 0;
      for (const b of B) if (fy >= b[0] && fy < b[1]) { dx = b[2]; dy = b[3]; break; }
      rowBand[r * 2] = dx; rowBand[r * 2 + 1] = dy;
    }
    const sink = this.tear * 60;
    for (let n = 0; n < A.length; n++) {
      const i = A[n], r = (i / cols) | 0, c = i - r * cols;
      const s = this.scr[i];
      const gi = s === 255 ? this.ch[i] : 10 + s;
      const x = c * CW + rowBand[r * 2], y = r * LH + rowBand[r * 2 + 1] + this.wave(c * CW + 3) + sink * this.r[i];
      ctx.drawImage(this.atlas, gi * gw, this.col[i] * gh, gw, gh, x, y, CW, LH);
    }
    // stray glyphs drifting off the tail
    ctx.textBaseline = 'top';
    for (const f of [7, 9.5, 12]) {
      ctx.font = `${f}px "JetBrains Mono", monospace`;
      for (const s of this.st) {
        if (s.f !== f) continue;
        ctx.globalAlpha = s.a; ctx.fillStyle = s.k;
        ctx.fillText(s.c, s.x, s.y + this.wave(Math.max(0, s.x)));
      }
    }
    ctx.globalAlpha = 1;
  }
}
