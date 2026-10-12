/* Bee & Bloom — saf piksel tuvali ve çizim ilkelleri (DOM gerektirmez; Node'da önizleme için de kullanılır). */
(function (root) {
  'use strict';
  const BB = root.BB;

  const hexCache = Object.create(null);
  function rgba(hex) {
    if (hex == null) return null;
    if (Array.isArray(hex)) return hex;
    let c = hexCache[hex];
    if (c) return c;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255;
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
    hexCache[hex] = c;
    return c;
  }

  class PixelCanvas {
    constructor(w, h) {
      this.w = w; this.h = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }
    clone() { const p = new PixelCanvas(this.w, this.h); p.data.set(this.data); return p; }
    idx(x, y) { return (y * this.w + x) * 4; }
    get(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
      const i = this.idx(x, y), d = this.data;
      return d[i + 3] ? [d[i], d[i + 1], d[i + 2], d[i + 3]] : null;
    }
    alpha(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.data[this.idx(x, y) + 3]; }
    set(x, y, col) {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const c = rgba(col);
      const i = this.idx(x, y), d = this.data;
      if (!c) { d[i + 3] = 0; return; }
      if (c[3] === 255 || d[i + 3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; return; }
      const a = c[3] / 255;
      d[i] = d[i] * (1 - a) + c[0] * a; d[i + 1] = d[i + 1] * (1 - a) + c[1] * a; d[i + 2] = d[i + 2] * (1 - a) + c[2] * a; d[i + 3] = Math.max(d[i + 3], c[3]);
    }
    rect(x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, col); }
    clear() { this.data.fill(0); }
    hline(x0, x1, y, col) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, col); }
    vline(x, y0, y1, col) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, col); }
    line(x0, y0, x1, y1, col) {
      x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.set(x0, y0, col);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    // dolu elips (merkez + yarıçap; yarım piksel merkezleri desteklenir)
    ellipse(cx, cy, rx, ry, col) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.set(x, y, col);
        }
      }
    }
    ring(cx, cy, rx, ry, col, t) {
      t = t || 1;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          const d2 = dx * dx + dy * dy;
          const ix = (x + 0.5 - cx) / Math.max(0.5, rx - t), iy = (y + 0.5 - cy) / Math.max(0.5, ry - t);
          if (d2 <= 1 && ix * ix + iy * iy > 1) this.set(x, y, col);
        }
      }
    }
    poly(pts, col) {
      let minY = Infinity, maxY = -Infinity;
      for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, col);
      }
    }
    // piksel haritası: dize satırları + palet (karakter → renk). '.' ve ' ' saydam.
    map(rows, pal, ox, oy, flip) {
      ox = ox || 0; oy = oy || 0;
      for (let y = 0; y < rows.length; y++) {
        const row = rows[y];
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch === '.' || ch === ' ') continue;
          const col = pal[ch];
          if (col === undefined) throw new Error('palette eksik: ' + ch);
          const px = flip ? ox + row.length - 1 - x : ox + x;
          this.set(px, oy + y, col);
        }
      }
    }
    // dış hat: saydam olup dolu bir komşusu olan piksellere renk
    outline(col, diag) {
      const src = this.clone();
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (src.alpha(x, y)) continue;
        let n = src.alpha(x - 1, y) || src.alpha(x + 1, y) || src.alpha(x, y - 1) || src.alpha(x, y + 1);
        if (!n && diag) n = src.alpha(x - 1, y - 1) || src.alpha(x + 1, y - 1) || src.alpha(x - 1, y + 1) || src.alpha(x + 1, y + 1);
        if (n) this.set(x, y, col);
      }
      return this;
    }
    replace(from, to) {
      const f = rgba(from), t = rgba(to);
      const d = this.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] === f[0] && d[i + 1] === f[1] && d[i + 2] === f[2]) { d[i] = t[0]; d[i + 1] = t[1]; d[i + 2] = t[2]; d[i + 3] = t[3]; }
      return this;
    }
    // her dolu pikseli tek renge boya (siluet)
    silhouette(col) {
      const c = rgba(col), d = this.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; }
      return this;
    }
    blit(src, dx, dy, flip, sx, sy, sw, sh) {
      sx = sx || 0; sy = sy || 0; sw = sw || src.w; sh = sh || src.h;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const i = src.idx(sx + x, sy + y), d = src.data;
        if (!d[i + 3]) continue;
        const tx = flip ? dx + sw - 1 - x : dx + x;
        this.set(tx, dy + y, [d[i], d[i + 1], d[i + 2], d[i + 3]]);
      }
    }
    // iki renkli düzenli tarama (dithering) — 'b4' Bayer 4x4 eşiği ile
    dither(x, y, w, h, col, level) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (bayer4(x + i, y + j) < level) this.set(x + i, y + j, col);
    }
    ditherPred(x, y, w, h, col, fn) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const lv = fn(x + i, y + j); if (lv > 0 && bayer4(x + i, y + j) < lv) this.set(x + i, y + j, col); }
    }
    flipped() {
      const p = new PixelCanvas(this.w, this.h);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const s = this.idx(x, y), t = p.idx(this.w - 1 - x, y); for (let k = 0; k < 4; k++) p.data[t + k] = this.data[s + k]; }
      return p;
    }
  }

  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bayer4(x, y) { return (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16; }

  // Sprite kayıt defteri: ad → kareler (PixelCanvas listesi) + çapa noktası
  class SpriteBook {
    constructor() { this.list = []; this.byName = Object.create(null); }
    add(name, frames, ax, ay) {
      if (!Array.isArray(frames)) frames = [frames];
      const s = { name, frames, ax: ax || 0, ay: ay || 0, w: frames[0].w, h: frames[0].h };
      this.byName[name] = s; this.list.push(s);
      return s;
    }
    get(name) { return this.byName[name]; }
    // basit raf paketleme → atlas
    pack(maxW) {
      maxW = maxW || 1024;
      const items = [];
      for (const s of this.list) s.frames.forEach((f, i) => items.push({ s, i, f }));
      items.sort((a, b) => b.f.h - a.f.h);
      let x = 0, y = 0, rowH = 0;
      for (const it of items) {
        if (x + it.f.w + 1 > maxW) { x = 0; y += rowH + 1; rowH = 0; }
        it.x = x; it.y = y;
        x += it.f.w + 1; rowH = Math.max(rowH, it.f.h);
      }
      const H = y + rowH + 1;
      const atlas = new PixelCanvas(maxW, H);
      for (const it of items) {
        atlas.blit(it.f, it.x, it.y);
        if (!it.s.rects) it.s.rects = [];
        it.s.rects[it.i] = [it.x, it.y, it.f.w, it.f.h];
      }
      return atlas;
    }
  }

  BB.Art = { rgba, PixelCanvas, SpriteBook, bayer4 };
})(typeof window !== 'undefined' ? window : globalThis);
