/* Bee & Bloom — bölüm nesneleri (mekanikler). Her tür: make (kurulum), snap (checkpoint'te saklanan alanlar), update. */
(function (root) {
  'use strict';
  const BB = root.BB;
  const TILE = BB.TILE, PHYS = BB.PHYS;
  const ov = BB.overlap, approach = BB.approach;
  const px = (v) => v * TILE;
  const K = {};

  const centerIn = (b, z) => { const x = b.x + b.w / 2, y = b.y + b.h / 2; return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h; };
  const near = (b, x, y, r) => Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y) <= r;
  BB.centerIn = centerIn;
  BB.nearPt = near;

  // ------------------------------------------------------------ basınç plakası (timer: bırakınca n sn daha açık kalır)
  K.plate = {
    make: (o) => ({ x: px(o.x), y: px(o.y), w: TILE, h: TILE, id: o.id, timer: o.timer || 0, pressed: false, t: 0 }),
    snap: ['t'],
    update(e, w, dt) {
      const zone = { x: e.x + 1, y: e.y + 9, w: 14, h: 7 };
      let p = false;
      for (const b of w.bodyList) if (ov(b, zone)) { p = true; break; }
      if (p !== e.pressed) { e.pressed = p; w.emit('plate', { on: p, x: e.x + 8, y: e.y + 14 }); }
      if (e.timer) {
        if (p) e.t = e.timer;
        else if (e.t > 0) { e.t -= dt; if (e.t <= 0) { e.t = 0; w.emit('timerEnd', { x: e.x + 8, y: e.y + 12 }); } }
      }
      if (p || e.t > 0) w.chan[e.id] = true;
    },
  };

  // ------------------------------------------------------------ kapı / geçit (dir: up = yukarı çekilir, down = yere iner)
  K.gate = {
    make(o) {
      const e = { x: px(o.x), y: px(o.y), w: px(o.w || 1), h: px(o.h || 1), on: o.on, any: !!o.any, invert: !!o.invert, latch: !!o.latch,
        coop: !!o.coop, style: o.style || null, dir: o.dir || 'up', open: 0, latched: false, id: o.id || null };
      e.solid = { x: e.x, y: e.y, w: e.w, h: e.h, kind: 'gate', active: true, ref: e };
      return e;
    },
    snap: ['open'],
    init(e, w) {
      if (e.latch && w.perm[(e.id || ('gate@' + e.x + ',' + e.y))]) e.latched = true;   // kayıttan dönüşte mandallı kapı açık kalsın
      const want = e.latched || (w.active(e.on, e.any) !== e.invert); e.open = want ? 1 : 0; K.gate.shape(e);
    },
    shape(e) {
      const h = e.h * (1 - e.open);
      e.solid.h = h; e.solid.y = e.dir === 'up' ? e.y : e.y + e.h - h;
      e.solid.active = h > 0.5;
    },
    update(e, w, dt) {
      let want = e.latched || (w.active(e.on, e.any) !== e.invert);
      if (want && e.latch && !e.latched) { e.latched = true; w.perm[(e.id || ('gate@' + e.x + ',' + e.y))] = true; }
      let target = want ? 1 : 0;
      if (target < e.open) {
        const full = { x: e.x, y: e.y, w: e.w, h: e.h };
        for (const b of w.bodyList) if (ov(b, full)) { target = e.open; break; }
      }
      const prev = e.open;
      e.open = approach(e.open, target, dt * 2.6);
      if ((prev <= 0 && e.open > 0) || (prev >= 1 && e.open < 1)) w.emit('gate', { opening: e.open > prev, x: e.x + e.w / 2, y: e.y + e.h / 2, style: e.style });
      K.gate.shape(e);
    },
  };

  // ------------------------------------------------------------ açık tutulan çiçek (eylem basılı tutulur)
  K.flower = {
    make: (o) => ({ x: px(o.x), y: px(o.y), w: TILE, h: TILE, id: o.id, held: false, open: 0, by: -1 }),
    snap: [],
    update(e, w, dt) {
      let held = false, by = -1;
      for (const b of w.bees) if (b.holdFlower === e) { held = true; by = b.id; }
      if (held !== e.held) w.emit('flower', { on: held, x: e.x + 8, y: e.y + 8 });
      e.held = held; e.by = by;
      e.open = approach(e.open, held ? 1 : 0, dt * 7);
      if (held) w.chan[e.id] = true;
    },
  };

  // ------------------------------------------------------------ taşınabilir eşya: polen topu, fener, rüzgâr kalkanı
  K.item = {
    make(o) {
      const e = { isItem: true, kind: o.kind, x: px(o.x) + 3, y: px(o.y) + 6, w: 10, h: 10, vx: 0, vy: 0, holder: null, used: false,
        onGround: false, homeX: 0, homeY: 0, support: null, groundKind: null, id: o.id || null };
      e.homeX = e.x; e.homeY = e.y;
      return e;
    },
    snap: ['x', 'y', 'vx', 'vy', 'used'],
    update(e, w, dt) {
      if (e.used) return;
      if (e.holder) {
        const b = e.holder;
        if (!b.alive) { e.holder = null; b.item = null; return; }
        e.x = b.x + b.w / 2 - e.w / 2 + (e.kind === 'shield' ? 0 : b.facing * 6);
        e.y = e.kind === 'shield' ? b.y - 9 : b.y + b.h - e.h + 3;
        e.vx = b.vx; e.vy = b.vy;
        return;
      }
      e.vy = Math.min(PHYS.fallMax + 60, e.vy + PHYS.gravity * dt);
      e.vx = approach(e.vx, 0, (e.onGround ? 900 : 120) * dt);
      e.onGround = false; e.support = null;
      w.moveX(e, e.vx * dt);
      if (e.hitX) e.vx = 0;
      w.moveY(e, e.vy * dt);
      if (e.y > w.rows * TILE + 32 || w.hazardTileUnder(e)) w.resetItem(e);
    },
  };

  // ------------------------------------------------------------ polen saksısı (polen topu girince açar; kalıcı)
  K.pot = {
    make: (o) => ({ x: px(o.x), y: px(o.y), w: TILE, h: TILE, id: o.id, bloomed: false, grow: 0 }),
    snap: [],
    update(e, w, dt) {
      if (!e.bloomed) {
        const zone = { x: e.x - 2, y: e.y - 6, w: 20, h: 22 };
        for (const it of w.items) {
          if (it.used || it.kind !== 'pollen' || it.holder) continue;
          if (ov(it, zone)) { it.used = true; e.bloomed = true; w.perm[e.id] = true; w.emit('bloom', { x: e.x + 8, y: e.y + 4 }); break; }
        }
      }
      if (e.bloomed) e.grow = approach(e.grow, 1, dt * 1.5);
    },
  };

  // ------------------------------------------------------------ sarmaşık: kanal açılınca büyür, yapraklar tek yönlü platform olur
  K.vine = {
    make(o) {
      const e = { x: px(o.x), y: px(o.y), h: o.h, on: o.on, grow: 0, leaves: [] };
      for (let i = 2; i <= o.h; i += 2) {
        const side = (i / 2) % 2 === 0 ? -1 : 1;
        const s = { x: e.x + (side < 0 ? -12 : 4), y: e.y + TILE - i * TILE, w: 24, h: 5, oneWay: true, kind: 'leaf', active: false, at: i / o.h };
        e.leaves.push(s);
      }
      return e;
    },
    snap: ['grow'],
    update(e, w, dt) {
      const want = w.active(e.on) ? 1 : 0;
      const prev = e.grow;
      e.grow = approach(e.grow, want, dt * 0.7);
      if (prev === 0 && e.grow > 0) w.emit('vine', { x: e.x + 8, y: e.y });
      for (const s of e.leaves) s.active = e.grow >= s.at - 0.001;
    },
  };

  // ------------------------------------------------------------ hareketli platform / asansör çiçeği
  K.platform = {
    make(o) {
      const e = { ax: px(o.x), ay: px(o.y), bx: px(o.to ? o.to[0] : o.x), by: px(o.to ? o.to[1] : o.y), w: px(o.w || 2), speed: o.speed || 40,
        on: o.on || null, loop: !!o.loop, u: o.start || 0, dir: 1, dwell: 0, style: o.style || 'leaf', moving: false };
      e.len = Math.hypot(e.bx - e.ax, e.by - e.ay) || 1;
      e.solid = { x: BB.lerp(e.ax, e.bx, e.u), y: BB.lerp(e.ay, e.by, e.u), w: e.w, h: 6, oneWay: true, kind: 'platform', active: true, ref: e };
      return e;
    },
    snap: ['u', 'dir', 'dwell'],
    restore(e) { e.solid.x = BB.lerp(e.ax, e.bx, e.u); e.solid.y = BB.lerp(e.ay, e.by, e.u); },
    update(e, w, dt) {
      if (e.loop) {
        if (e.dwell > 0) e.dwell -= dt;
        else {
          e.u += e.dir * e.speed * dt / e.len;
          if (e.u >= 1) { e.u = 1; e.dir = -1; e.dwell = 0.6; } else if (e.u <= 0) { e.u = 0; e.dir = 1; e.dwell = 0.6; }
        }
      } else {
        const target = e.on ? (w.active(e.on) ? 1 : 0) : 0;
        e.u = approach(e.u, target, e.speed * dt / e.len);
      }
      const nx = BB.lerp(e.ax, e.bx, e.u), ny = BB.lerp(e.ay, e.by, e.u);
      const dx = nx - e.solid.x, dy = ny - e.solid.y;
      e.moving = Math.abs(dx) + Math.abs(dy) > 0.001;
      if (e.moving) w.moveSolid(e.solid, dx, dy);
    },
  };

  // ------------------------------------------------------------ nilüfer: cap1 = tek arıyı taşır (iki arıda batar), pair = tek arıda batar, ikisinde dengede
  K.lily = {
    make(o) {
      const e = { x: px(o.x), restY: px(o.y) + 3, w: px(o.w || 2), mode: o.mode || 'cap1', y: 0, load: 0, sinking: false };
      e.y = e.restY;
      e.solid = { x: e.x, y: e.y, w: e.w, h: 4, oneWay: true, kind: 'lily', active: true, ref: e };
      return e;
    },
    snap: ['y'],
    restore(e) { e.solid.y = e.y; },
    update(e, w, dt) {
      let load = 0;
      for (const b of w.bees) {
        if (!b.alive || !b.onGround) continue;
        // doğrudan yaprakta duran ya da yapraktaki ortağın başında duran arı ağırlık yapar
        const on = b.support === e.solid || (b.support && b.support.isBee && b.support.onGround && b.support.support === e.solid);
        if (on) load += b.carrying ? 2 : 1;
      }
      e.load = load;
      const sink = e.mode === 'pair' ? load === 1 : load > 1;
      const target = sink ? e.restY + 22 : e.restY;
      const sp = sink ? 16 : 30;
      if (sink !== e.sinking) { e.sinking = sink; if (sink) w.emit('lilySink', { x: e.x + e.w / 2, y: e.restY }); }
      const ny = approach(e.y, target, sp * dt);
      const dy = ny - e.y;
      e.y = ny;
      if (dy) w.moveSolid(e.solid, 0, dy);
    },
  };

  // ------------------------------------------------------------ rüzgâr bölgesi (gust: {period,on,phase} ile esinti)
  K.wind = {
    make: (o) => ({ x: px(o.x), y: px(o.y), w: px(o.w), h: px(o.h), vx: o.vx || 0, vy: o.vy || 0, gust: o.gust || null, cold: !!o.cold, f: 1, warn: false, on: o.on || null, invert: !!o.invert }),
    snap: [],
    update(e, w) {
      let f = 1;
      if (e.gust) {
        const t = (w.time + (e.gust.phase || 0)) % e.gust.period;
        f = t < e.gust.on ? 1 : (e.gust.calm !== undefined ? e.gust.calm : 0.12);
        e.warn = t >= e.gust.period - 0.8;
      }
      if (e.on && (w.active(e.on) === !e.invert)) f = 0;
      e.f = f;
    },
  };

  // ------------------------------------------------------------ zıplama mantarı
  K.bounce = {
    make(o) {
      const e = { x: px(o.x), y: px(o.y), w: px(o.w || 1), squash: 0 };
      e.solid = { x: e.x + 1, y: e.y + 8, w: e.w - 2, h: 8, kind: 'bounce', active: true, ref: e };
      return e;
    },
    snap: [],
    update(e, w, dt) { if (e.squash > 0) e.squash = Math.max(0, e.squash - dt * 4); },
  };

  // ------------------------------------------------------------ ritim platformu (period içinde 'on' saniye katı)
  K.pulse = {
    make(o) {
      const e = { x: px(o.x), y: px(o.y), w: px(o.w || 2), period: o.period || 2, on: o.on || 1, phase: o.phase || 0, solidNow: true, warn: false };
      e.solid = { x: e.x, y: e.y, w: e.w, h: 6, oneWay: true, kind: 'pulse', active: true, ref: e };
      return e;
    },
    snap: [],
    update(e, w) {
      const t = ((w.time + e.phase) % e.period + e.period) % e.period;
      const s = t < e.on;
      if (s !== e.solidNow) w.emit('pulse', { on: s, x: e.x + e.w / 2, y: e.y });
      e.solidNow = s; e.solid.active = s;
      e.warn = s && t > e.on - 0.45;
    },
  };

  // ------------------------------------------------------------ ışık köprüsü (yalnızca fener ışığında katı)
  K.bridge = {
    make(o) {
      const e = { x: px(o.x), y: px(o.y), w: px(o.w || 1), segs: [] };
      for (let i = 0; i < (o.w || 1); i++) e.segs.push({ x: e.x + i * TILE, y: e.y, w: TILE, h: 6, oneWay: true, kind: 'bridge', active: false, lit: 0 });
      return e;
    },
    snap: [],
    update(e, w, dt) {
      for (const s of e.segs) {
        const lit = w.litAt(s.x + 8, s.y + 3, true);
        if (lit && !s.active) w.emit('bridgeOn', { x: s.x + 8, y: s.y });
        // üzerinde arı varken sönmesin diye kısa bir tolerans
        if (lit) { s.active = true; s.lit = 0.25; } else if (s.lit > 0) { s.lit -= dt; if (s.lit <= 0) s.active = false; }
      }
    },
  };

  // ------------------------------------------------------------ sabit ışık (mantar/ateş böceği) — yalnız görsel
  K.glow = { make: (o) => ({ x: px(o.x) + 8, y: px(o.y) + 8, r: o.r || 40, color: o.color || null }), snap: [], update() {} };

  // ------------------------------------------------------------ bal-ateş noktası (kışta ısıtır)
  K.fire = { make: (o) => ({ x: px(o.x) + 8, y: px(o.y) + 10, r: o.r || 34 }), snap: [], update() {} };

  // ------------------------------------------------------------ kırılan zemin (buz/kabuk)
  K.crumble = {
    make(o) {
      const e = { x: px(o.x), y: px(o.y), w: px(o.w || 1), segs: [] };
      for (let i = 0; i < (o.w || 1); i++) e.segs.push({ x: e.x + i * TILE, y: e.y, w: TILE, h: TILE, kind: 'crumble', active: true, st: 'ok', t: 0 });
      return e;
    },
    snapFn: (e) => e.segs.map((s) => [s.active, s.st, s.t]),
    restoreFn: (e, d) => e.segs.forEach((s, i) => { s.active = d[i][0]; s.st = d[i][1]; s.t = d[i][2]; }),
    update(e, w, dt) {
      for (const s of e.segs) {
        if (s.st === 'ok') {
          for (const b of w.bodyList) if (b.onGround && b.support === s) { s.st = 'shake'; s.t = 0.5; w.emit('crack', { x: s.x + 8, y: s.y }); break; }
        } else if (s.st === 'shake') {
          s.t -= dt;
          if (s.t <= 0) { s.st = 'gone'; s.t = 3.2; s.active = false; w.emit('crumble', { x: s.x + 8, y: s.y + 8 }); }
        } else if (s.st === 'gone') {
          s.t -= dt;
          if (s.t <= 0) {
            let free = true;
            for (const b of w.bodyList) if (ov(b, s)) { free = false; break; }
            if (free) { s.st = 'ok'; s.active = true; }
          }
        }
      }
    },
  };

  // ------------------------------------------------------------ buz sarkıtı: altından geçince düşer
  K.icicle = {
    make: (o) => ({ x: px(o.x) + 4, y: px(o.y), y0: px(o.y), w: 8, h: 14, st: 'hang', t: 0, vy: 0 }),
    snap: ['y', 'st', 't', 'vy'],
    update(e, w, dt) {
      if (e.st === 'hang') {
        for (const b of w.bees) {
          if (!b.alive || b.carriedBy) continue;
          const cx = b.x + b.w / 2;
          if (Math.abs(cx - (e.x + 4)) < 14 && b.y > e.y && b.y - e.y < 9 * TILE) { e.st = 'shake'; e.t = 0.45; w.emit('icicleShake', { x: e.x + 4, y: e.y + 4 }); break; }
        }
      } else if (e.st === 'shake') {
        e.t -= dt; if (e.t <= 0) { e.st = 'fall'; e.vy = 0; }
      } else if (e.st === 'fall') {
        e.vy = Math.min(320, e.vy + 900 * dt);
        e.y += e.vy * dt;
        const c = Math.floor((e.x + 4) / TILE), r = Math.floor((e.y + e.h) / TILE);
        const box = { x: e.x + 1, y: e.y + 4, w: 6, h: e.h - 4 };
        for (const b of w.bees) if (b.alive && !b.carriedBy && ov(w.hurtBox(b), box)) { w.kill(b, 'icicle'); e.st = 'gone'; w.emit('shatter', { x: e.x + 4, y: e.y + e.h }); return; }
        if (w.tileSolid({ role: '' }, c, r) === 1 || e.y > w.rows * TILE) { e.st = 'gone'; w.emit('shatter', { x: e.x + 4, y: e.y + e.h }); }
      }
    },
  };

  // ------------------------------------------------------------ damla (yağmur): period'da bir düşer
  K.drip = {
    make: (o) => ({ x: px(o.x) + 8, y: px(o.y) + 4, y0: px(o.y) + 4, period: o.period || 2.2, phase: o.phase || 0, st: 'form', dy: 0, vy: 0, t: 0, form: 0 }),
    snap: [],
    update(e, w, dt) {
      const t = ((w.time + e.phase) % e.period + e.period) % e.period;
      if (e.st === 'form') {
        e.form = t / e.period;
        if (t + dt >= e.period - 0.0001 || (e.lastT !== undefined && t < e.lastT)) { e.st = 'fall'; e.dy = 0; e.vy = 40; }
      } else if (e.st === 'fall') {
        e.vy = Math.min(300, e.vy + 700 * dt);
        e.dy += e.vy * dt;
        const y = e.y0 + e.dy;
        const c = Math.floor(e.x / TILE), r = Math.floor((y + 3) / TILE);
        const s = w.tileSolid({ role: '' }, c, r);
        let stop = (s === 1 || (s === 2 && y + 3 >= r * TILE && y + 3 < r * TILE + 6)) || y > w.rows * TILE;
        if (!stop) for (const sh of w.umbrellas) if (e.x >= sh.x && e.x <= sh.x + sh.w && y + 3 >= sh.y && y < sh.y + sh.h) { stop = true; break; }
        if (!stop) for (const sd of w.solids) if (sd.active && e.x >= sd.x && e.x <= sd.x + sd.w && y + 3 >= sd.y && y + 3 <= sd.y + 6) { stop = true; break; }
        if (stop) { e.st = 'form'; w.emit('splash', { x: e.x, y: y + 2 }); e.form = 0; }
        else {
          const box = { x: e.x - 2, y: y - 3, w: 4, h: 6 };
          for (const b of w.bees) if (b.alive && !b.carriedBy && ov(w.hurtBox(b), box)) { w.kill(b, 'drip'); break; }
        }
      }
      e.lastT = t;
    },
  };

  // ------------------------------------------------------------ örümcek (iplikte iner-çıkar)
  K.spider = {
    make: (o) => ({ x: px(o.x) + 8, y0: px(o.y), len: px(o.len || 3), period: o.period || 2.6, phase: o.phase || 0, y: px(o.y) }),
    snap: [],
    update(e, w) {
      const a = (w.time / e.period + e.phase) * Math.PI * 2;
      e.y = e.y0 + 6 + e.len * (0.5 - 0.5 * Math.cos(a));
      for (const b of w.bees) {
        if (!b.alive || b.carriedBy) continue;
        const h = w.hurtBox(b);
        const cx = Math.max(h.x, Math.min(e.x, h.x + h.w)), cy = Math.max(h.y, Math.min(e.y, h.y + h.h));
        if (Math.hypot(cx - e.x, cy - e.y) < 5) { w.kill(b, 'spider'); break; }
      }
    },
  };

  // ------------------------------------------------------------ çöküş duvarı (kaçış)
  K.collapse = {
    make: (o) => ({ x0: px(o.x), front: px(o.x), speed: o.speed || 52, until: px(o.until || 9999), trig: { x: px(o.trigger[0]), y: px(o.trigger[1]), w: px(o.trigger[2]), h: px(o.trigger[3]) }, on: false, done: false, scene: o.scene || null }),
    snap: ['front', 'on'],
    update(e, w, dt) {
      if (e.done) return;
      if (!e.on) {
        if (w.bees.some((b) => b.alive && centerIn(b, e.trig))) {
          e.on = true; e.front = Math.max(e.front, e.trig.x - 7 * TILE); w.emit('collapseStart', { x: e.front });
          if (e.scene && !w.seen[e.scene]) { w.seen[e.scene] = true; w.pending = { type: 'scene', id: e.scene }; }
        }
        return;
      }
      e.front += e.speed * dt;
      if (e.front >= e.until) { e.done = true; e.on = false; w.emit('collapseEnd', {}); return; }
      for (const b of w.bees) if (b.alive && !b.carriedBy && b.x + b.w / 2 < e.front) { w.kill(b, 'collapse'); break; }
    },
    onRespawn(e, w, cp) { if (e.on) e.front = Math.min(e.front, cp.x - 9 * TILE); },
  };

  // ------------------------------------------------------------ sembol taşı + sıra denetleyici
  K.rune = {
    make: (o) => ({ x: px(o.x), y: px(o.y), sym: o.sym, seq: o.seq, lit: false, flash: 0 }),
    snap: [],
    update(e, w, dt) { if (e.flash > 0) e.flash -= dt; },
  };
  K.sequence = {
    make: (o) => ({ id: o.id, order: o.order.slice(), prog: 0, solved: false }),
    snap: [],
    update(e, w) { if (e.solved) w.chan[e.id] = true; },
  };

  // ------------------------------------------------------------ yarış (Zıpzıp)
  K.race = {
    make(o) {
      const e = { id: o.id || 'race', start: { x: px(o.start[0]), y: px(o.start[1]), w: px(o.start[2]), h: px(o.start[3]) }, finish: px(o.finish),
        path: o.path.map((p) => [px(p[0]) + 8, px(p[1]) + 16]), speed: o.speed || 70, st: 'idle', t: 0, seg: 0, fx: 0, fy: 0, hop: 0,
        scenes: o.scenes || {}, spawn: o.spawn ? [px(o.spawn[0]), px(o.spawn[1])] : null };
      e.fx = e.path[0][0]; e.fy = e.path[0][1];
      return e;
    },
    snap: ['st', 't', 'seg', 'fx', 'fy'],
    update(e, w, dt) {
      if (w.perm[e.id]) { e.st = 'won'; return; }
      if (e.st === 'idle') {
        e.fx = e.path[0][0]; e.fy = e.path[0][1]; e.seg = 0;
        if (w.bees.every((b) => b.alive && centerIn(b, e.start))) w.pending = { type: 'scene', id: e.scenes.start, fx: [{ fx: 'raceGo', id: e.id }] };
      } else if (e.st === 'count') {
        e.t -= dt;
        for (const b of w.bees) { b.vx = 0; b.frozen = true; }
        if (e.t <= 0) { e.st = 'run'; for (const b of w.bees) b.frozen = false; w.emit('raceGo', {}); }
      } else if (e.st === 'run') {
        let d = e.speed * dt;
        while (d > 0 && e.seg < e.path.length - 1) {
          const a = e.path[e.seg], b = e.path[e.seg + 1];
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const cur = Math.hypot(e.fx - a[0], e.fy - a[1]);
          const left = L - cur;
          if (d < left) { const k = (cur + d) / L; e.fx = a[0] + (b[0] - a[0]) * k; e.fy = a[1] + (b[1] - a[1]) * k; d = 0; }
          else { e.fx = b[0]; e.fy = b[1]; d -= left; e.seg++; }
        }
        e.hop += dt;
        const beesDone = w.bees.every((b) => b.alive && b.x + b.w / 2 >= e.finish);
        if (beesDone) {
          e.st = 'won'; w.perm[e.id] = true; w.emit('raceWin', {});
          if (e.scenes.win) w.pending = { type: 'scene', id: e.scenes.win };
        } else if (e.seg >= e.path.length - 1) {
          e.st = 'lost'; w.emit('raceLose', {});
          w.pending = { type: 'scene', id: e.scenes.lose, fx: [{ fx: 'raceReset', id: e.id }] };
        }
      }
    },
  };

  // ------------------------------------------------------------ NPC (görsel; sahnelerde konuşmacı)
  K.npc = { make: (o) => ({ x: px(o.x) + 8, y: px(o.y) + 16, who: o.who, face: o.face || -1, talk: o.talk || null, hidden: !!o.hidden, id: o.id || o.who }), snap: ['hidden'], update() {} };

  // ------------------------------------------------------------ Bora (donmuş; iki arı yanında durunca ısınır)
  K.bora = {
    make: (o) => ({ x: px(o.x) + 8, y: px(o.y) + 16, heat: 0, need: o.need || 7, flag: o.flag || 'boraWarm', scene: o.scene || null, done: false }),
    snap: [],
    update(e, w, dt) {
      if (e.done) return;
      const close = w.bees.filter((b) => b.alive && near(b, e.x, e.y - 8, 30)).length;
      if (close === 2) e.heat = Math.min(1, e.heat + dt / e.need);
      else e.heat = Math.max(0, e.heat - dt / (e.need * 3));
      if (e.heat >= 1) {
        e.done = true; w.perm[e.flag] = true; w.emit('boraWarm', { x: e.x, y: e.y });
        if (e.scene) w.pending = { type: 'scene', id: e.scene };
      }
    },
  };

  // ------------------------------------------------------------ tetikleyici (sahne)
  K.trigger = {
    make: (o) => ({ x: px(o.x), y: px(o.y), w: px(o.w || 1), h: px(o.h || 1), scene: o.scene, need: o.need || 'any', done: false, req: o.req || null, round: o.round || 0 }),
    snap: [],
    update(e, w) {
      if (e.done || w.pending) return;
      if (e.req && !w.active(e.req)) return;
      if (e.round && !BB.roundMatch(e.round, w.round)) return;
      const inside = w.bees.filter((b) => b.alive && centerIn(b, e)).length;
      if ((e.need === 'both' && inside === 2) || (e.need !== 'both' && inside > 0)) {
        e.done = true;
        if (!w.seen[e.scene]) { w.seen[e.scene] = true; w.pending = { type: 'scene', id: e.scene }; }
      }
    },
  };

  // ------------------------------------------------------------ tabela (ipucu)
  K.sign = { make: (o) => ({ x: px(o.x), y: px(o.y), text: o.text, keys: o.keys || null, show: 0 }), snap: [], update(e, w, dt) {
    const any = w.bees.some((b) => b.alive && Math.abs(b.x + b.w / 2 - (e.x + 8)) < 28 && Math.abs(b.y - e.y) < 40);
    e.show = approach(e.show, any ? 1 : 0, dt * 6);
  } };

  // ------------------------------------------------------------ ustalık geçidi (adı ekranda gösterilir)
  K.mastery = {
    make: (o) => ({ x: px(o.x), w: px(o.w || 1), name: o.name, shown: false }),
    snap: [],
    update(e, w) {
      if (e.shown) return;
      for (const b of w.bees) if (b.alive && b.x + b.w / 2 >= e.x && b.x + b.w / 2 <= e.x + e.w) { e.shown = true; w.emit('mastery', { name: e.name }); break; }
    },
  };

  // ------------------------------------------------------------ süs (görsel)
  K.decor = { make: (o) => ({ x: px(o.x), y: px(o.y), s: o.s, flip: !!o.flip, round: o.round || 0, id: o.id || null, hidden: !!o.hidden }), snap: [], update() {} };

  // ------------------------------------------------------------ açık soru çiçeği (uçarak seçim)
  K.choice = { make: (o) => ({ x: px(o.x), y: px(o.y), w: TILE, h: TILE * 2, q: o.q, opt: o.opt, open: 0, who: [] }), snap: [], update(e, w, dt) {
    const act = w.openQ && w.openQ.qi + 1 === e.q;
    e.open = approach(e.open, act ? 1 : 0, dt * 4);
  } };

  BB.KINDS = K;
})(typeof window !== 'undefined' ? window : globalThis);
