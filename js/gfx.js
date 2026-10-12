/* Bee & Bloom — tarayıcı grafik katmanı: tuval, tam sayı ölçekleme, sprite atlası, yazı tipi atlası, çizim yardımcıları. */
(function () {
  'use strict';
  const BB = window.BB;
  const Gfx = {};
  BB.Gfx = Gfx;

  const TEXT_COLORS = {
    ink: '#3b2516', white: '#ffffff', cream: '#fff4dc', honey: '#ffb32c', honeyD: '#c8781a', pink: '#ff6fa3', blue: '#4a9be8',
    gray: '#8a7a70', dark: '#1a1020', red: '#e84a3c', green: '#3f9a52', shadow: '#2b1a10', gold: '#ffd23c', lilac: '#b49ad8', sky: '#cdeeff', mute: '#c8b8a8',
  };
  Gfx.TEXT_COLORS = TEXT_COLORS;

  function pcToCanvas(pc) {
    const c = document.createElement('canvas');
    c.width = pc.w; c.height = pc.h;
    const x = c.getContext('2d');
    const id = x.createImageData(pc.w, pc.h);
    id.data.set(pc.data);
    x.putImageData(id, 0, 0);
    return c;
  }
  Gfx.pcToCanvas = pcToCanvas;

  Gfx.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { c, ctx };
  };

  Gfx.init = function (canvas) {
    Gfx.canvas = canvas;
    canvas.width = BB.W; canvas.height = BB.H;
    Gfx.ctx = canvas.getContext('2d', { alpha: false });
    Gfx.ctx.imageSmoothingEnabled = false;
    // sprite atlası
    const book = BB.Sprites.build();
    const atlasPc = book.pack(1024);
    Gfx.book = book;
    Gfx.atlas = pcToCanvas(atlasPc);
    // yazı tipi atlası: her renk için bir satır
    const chars = Object.keys(BB.Font.glyphs);
    let x = 0;
    Gfx.glyphPos = Object.create(null);
    for (const ch of chars) { const g = BB.Font.glyphs[ch]; Gfx.glyphPos[ch] = x; x += g.w + 1; }
    const keys = Object.keys(TEXT_COLORS);
    const fpc = new BB.Art.PixelCanvas(x, BB.Font.CELL_H * keys.length);
    keys.forEach((k, row) => {
      for (const ch of chars) {
        const g = BB.Font.glyphs[ch], gx = Gfx.glyphPos[ch];
        for (let r = 0; r < BB.Font.CELL_H; r++) for (let c = 0; c < g.w; c++) if (g.bits[r * g.w + c]) fpc.set(gx + c, row * BB.Font.CELL_H + r, TEXT_COLORS[k]);
      }
    });
    Gfx.fontRow = Object.create(null);
    keys.forEach((k, i) => { Gfx.fontRow[k] = i * BB.Font.CELL_H; });
    Gfx.fontAtlas = pcToCanvas(fpc);
    Gfx.scaleMode = 0;
    Gfx.resize();
    window.addEventListener('resize', Gfx.resize);
  };

  // tam sayı ölçek (aygıt pikseli cinsinden) + siyah bantlı ortalama
  Gfx.resize = function () {
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    let s = Math.max(1, Math.floor(Math.min((W * dpr) / BB.W, (H * dpr) / BB.H)));
    if (Gfx.scaleMode > 0) s = Math.max(1, Math.min(s, Math.round(Gfx.scaleMode * dpr)));
    Gfx.scale = s;
    const cssW = (BB.W * s) / dpr, cssH = (BB.H * s) / dpr;
    const st = Gfx.canvas.style;
    st.width = cssW + 'px'; st.height = cssH + 'px';
    st.left = Math.floor((W - cssW) / 2) + 'px'; st.top = Math.floor((H - cssH) / 2) + 'px';
  };

  // ------------------------------------------------------------ sprite çizimi
  Gfx.spr = function (ctx, name, frame, x, y, flip, alpha) {
    const s = Gfx.book.byName[name];
    if (!s) return;
    const r = s.rects[(frame | 0) % s.rects.length];
    x = Math.round(x); y = Math.round(y);
    if (alpha !== undefined && alpha < 1) { ctx.globalAlpha = Math.max(0, alpha); }
    if (flip) {
      ctx.save(); ctx.translate(x + r[2], y); ctx.scale(-1, 1);
      ctx.drawImage(Gfx.atlas, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
      ctx.restore();
    } else ctx.drawImage(Gfx.atlas, r[0], r[1], r[2], r[3], x, y, r[2], r[3]);
    if (alpha !== undefined && alpha < 1) ctx.globalAlpha = 1;
  };
  // ölçekli sprite (portre büyütme, kart vb.)
  Gfx.sprScaled = function (ctx, name, frame, x, y, k, flip) {
    const s = Gfx.book.byName[name];
    if (!s) return;
    const r = s.rects[(frame | 0) % s.rects.length];
    if (flip) { ctx.save(); ctx.translate(Math.round(x) + r[2] * k, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(Gfx.atlas, r[0], r[1], r[2], r[3], 0, 0, r[2] * k, r[3] * k); ctx.restore(); }
    else ctx.drawImage(Gfx.atlas, r[0], r[1], r[2], r[3], Math.round(x), Math.round(y), r[2] * k, r[3] * k);
  };
  Gfx.sprSize = function (name) { const s = Gfx.book.byName[name]; return s ? { w: s.w, h: s.h, n: s.frames.length } : { w: 0, h: 0, n: 0 }; };

  // ------------------------------------------------------------ yazı
  function drawLine(ctx, str, x, y, color, k) {
    const row = Gfx.fontRow[color] !== undefined ? Gfx.fontRow[color] : 0;
    let cx = x;
    for (const ch of str) {
      const g = BB.Font.glyphs[ch] || BB.Font.glyphs['?'];
      const gx = Gfx.glyphPos[BB.Font.glyphs[ch] ? ch : '?'];
      if (ch !== ' ') ctx.drawImage(Gfx.fontAtlas, gx, row, g.w, BB.Font.CELL_H, cx, y, g.w * k, BB.Font.CELL_H * k);
      cx += (g.w + 1) * k;
    }
  }
  Gfx.measure = (s, k) => BB.Font.measure(s) * (k || 1);

  // opts: color, align (left|center|right), scale, shadow (renk), outline (renk), maxW, lineH, chars (daktilo sınırı)
  Gfx.text = function (ctx, str, x, y, opts) {
    opts = opts || {};
    const k = opts.scale || 1;
    const color = opts.color || 'ink';
    const lineH = (opts.lineH || BB.Font.LINE_H) * k;
    const lines = opts.maxW ? BB.Font.wrap(String(str), Math.floor(opts.maxW / k)) : String(str).split('\n');
    let left = opts.chars === undefined ? Infinity : opts.chars;
    let maxw = 0;
    x = Math.round(x); y = Math.round(y);
    lines.forEach((ln, i) => {
      if (left <= 0) return;
      let s = ln;
      if (s.length > left) s = Array.from(s).slice(0, left).join('');
      left -= Array.from(ln).length + 1;
      const w = BB.Font.measure(ln) * k;
      maxw = Math.max(maxw, w);
      let lx = x;
      if (opts.align === 'center') lx = x - Math.floor(w / 2);
      else if (opts.align === 'right') lx = x - w;
      const ly = y + i * lineH;
      if (opts.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) drawLine(ctx, s, lx + dx * k, ly + dy * k, opts.outline, k);
      else if (opts.shadow) drawLine(ctx, s, lx, ly + k, opts.shadow, k);
      drawLine(ctx, s, lx, ly, color, k);
    });
    return { w: maxw, h: lines.length * lineH, lines };
  };

  // ------------------------------------------------------------ panel / çerçeve (yuvarlak köşeli, düz renk)
  Gfx.panel = function (ctx, x, y, w, h, fill, edge, shade) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    ctx.fillStyle = edge || '#3b2516';
    ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4); ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = fill || '#fff4dc';
    ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
    if (shade) { ctx.fillStyle = shade; ctx.fillRect(x + 2, y + h - 3, w - 4, 1); }
  };
  Gfx.rect = function (ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  // klavye tuşu ikonu: [A]
  Gfx.key = function (ctx, label, x, y, opts) {
    opts = opts || {};
    const w = Math.max(9, BB.Font.measure(label) + 5);
    Gfx.panel(ctx, x, y, w, 11, opts.fill || '#ffffff', opts.edge || '#3b2516', opts.shade || '#c8b8a8');
    Gfx.text(ctx, label, x + Math.floor(w / 2), y - 2, { color: opts.color || 'ink', align: 'center' });
    return w;
  };

  // düz renkli, kenarı taranmış ışık/karanlık maskesi için daire şablonu (önbellekli)
  const circleCache = Object.create(null);
  Gfx.lightCircle = function (r) {
    r = Math.round(r);
    if (circleCache[r]) return circleCache[r];
    const size = r * 2 + 2;
    const pcv = new BB.Art.PixelCanvas(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - (r + 1), y + 0.5 - (r + 1));
      if (d <= r - 6) pcv.set(x, y, '#ffffff');
      else if (d <= r) { const lv = 1 - (d - (r - 6)) / 6; if (BB.Art.bayer4(x, y) < lv) pcv.set(x, y, '#ffffff'); }
    }
    circleCache[r] = pcToCanvas(pcv);
    return circleCache[r];
  };
})();
