/* Bee & Bloom — dünya çizimi: kamera, parallax, karolar, nesneler, arılar, parçacıklar, hava, ışık, HUD. */
(function () {
  'use strict';
  const BB = window.BB;
  const Gfx = BB.Gfx;
  const W = BB.W, H = BB.H, TILE = BB.TILE;
  const R = {};
  BB.Render = R;

  const bgCache = Object.create(null);
  const MAXP = 600;
  const parts = [];
  for (let i = 0; i < MAXP; i++) parts.push({ on: false });
  const weather = [];
  for (let i = 0; i < 140; i++) weather.push({ on: false });

  R.cam = { x: 0, y: 0, shake: 0, focus: null };
  R.time = 0;
  R.floaters = [];

  // ------------------------------------------------------------ kurulum
  R.setLevel = function (world) {
    R.world = world;
    const def = world.def;
    R.theme = def.theme || 'bahar';
    R.th = BB.THEMES[R.theme];
    const tiles = BB.Tiles.renderTiles(world, R.theme);
    R.tileBack = Gfx.pcToCanvas(tiles.back);
    R.tileFront = Gfx.pcToCanvas(tiles.front);
    if (!bgCache[R.theme]) bgCache[R.theme] = BB.Tiles.makeBackground(R.theme).map((L) => ({ c: Gfx.pcToCanvas(L.pc), f: L.f, wrap: L.wrap }));
    R.bg = bgCache[R.theme];
    for (const p of parts) p.on = false;
    for (const p of weather) p.on = false;
    R.floaters.length = 0;
    R.dark = !!world.dark;
    if (R.dark && !R.mask) R.mask = Gfx.makeCanvas(W, H);
    R.snapCamera();
    R.nameT = 3.5;
    R.banner = null;
    // karanlıkta dikenler hafifçe görünsün diye konumları
    R.thornTiles = [];
    const TT = BB.T;
    for (let r = 0; r < world.rows; r++) for (let c = 0; c < world.cols; c++) { const t = world.tileAt(c, r); if (t === TT.THORN_UP || t === TT.THORN_DOWN || t === TT.THORN_L || t === TT.THORN_R) R.thornTiles.push([c * 16 + 8, r * 16 + 8]); }
    R.waterTiles = [];
    for (let r = 0; r < world.rows; r++) for (let c = 0; c < world.cols; c++) if (world.tileAt(c, r) === BB.T.WATER) R.waterTiles.push([c, r, world.tileAt(c, r - 1) !== BB.T.WATER]);
    R.webTiles = true;
  };

  function camTarget() {
    const w = R.world;
    if (R.cam.focus) {
      // diyalog sırasında odak, kutunun (alt ~85 px) üstündeki alanın ortasına gelsin
      const talk = BB.Story && BB.Story.active;
      return { x: R.cam.focus.x - W / 2, y: R.cam.focus.y - (talk ? (H - 85) / 2 : H / 2) };
    }
    const a = w.bees[0], b = w.bees[1];
    const mx = (a.x + b.x) / 2 + 5, my = (a.y + b.y) / 2 + 6;
    const look = BB.clamp((a.vx + b.vx) * 0.12, -24, 24);
    return { x: mx - W / 2 + look, y: my - H / 2 - 8 };
  }
  function clampCam(c) {
    const w = R.world;
    const maxX = w.wpx - W, maxY = w.hpx - H;
    c.x = maxX <= 0 ? maxX / 2 : BB.clamp(c.x, 0, maxX);
    const extra = (R.cam.focus && BB.Story && BB.Story.active) ? 64 : 0;   // konuşurken haritanın altı kutunun arkasına kayabilir
    c.y = maxY <= 0 ? maxY / 2 : BB.clamp(c.y, 0, maxY + extra);
  }
  R.snapCamera = function () { const t = camTarget(); R.cam.x = t.x; R.cam.y = t.y; clampCam(R.cam); };

  // simülasyon adımı başına görsel güncelleme
  R.step = function (dt) {
    R.time += dt;
    if (R.world && R.world.state === 'play') for (const b of R.world.bees) {
      const idle = b.onGround && Math.abs(b.vx) < 2 && !b.inp?.left && !b.inp?.right;
      b._idleT = idle ? (b._idleT || 0) + dt : 0;
      if (b._idleT > 7 && !b.emote) { b.emote = ['note', 'heart', 'dots', 'zz'][Math.floor((R.time * 7 + b.id * 3) % 4)]; b.emoteT = 1.4; b._idleT = 0; }
    }
    const t = camTarget();
    const k = R.cam.focus ? 0.08 : 0.14;
    R.cam.x += (t.x - R.cam.x) * k;
    R.cam.y += (t.y - R.cam.y) * (R.cam.focus ? 0.08 : 0.1);
    clampCam(R.cam);
    if (R.cam.shake > 0) R.cam.shake = Math.max(0, R.cam.shake - dt * 2.5);
    if (R.nameT > 0) R.nameT -= dt;
    for (const p of parts) {
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = false; continue; }
      p.vy += (p.g || 0) * dt;
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.sway) p.x += Math.sin(R.time * p.sway + p.ph) * 0.3;
    }
    for (let i = R.floaters.length - 1; i >= 0; i--) { const f = R.floaters[i]; f.t += dt; f.y -= dt * (f.vy || 14); if (f.t > f.max) R.floaters.splice(i, 1); }
    stepWeather(dt);
    stepWindFx(dt);
  };

  // ------------------------------------------------------------ parçacıklar
  function spawn(o) {
    for (const p of parts) if (!p.on) { Object.assign(p, { on: true, g: 0, drag: 0, sway: 0, ph: Math.random() * 6, size: 1, kind: 'dot' }, o); p.max = p.life; return p; }
    return null;
  }
  R.burst = function (x, y, n, col, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const a = (opts.a0 !== undefined ? opts.a0 : 0) + Math.random() * (opts.spread !== undefined ? opts.spread : Math.PI * 2);
      const sp = (opts.sp || 40) * (0.4 + Math.random() * 0.8);
      spawn({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (opts.life || 0.5) * (0.6 + Math.random() * 0.6), col: Array.isArray(col) ? col[i % col.length] : col, g: opts.g || 0, drag: opts.drag || 2, size: opts.size || 1, kind: opts.kind || 'dot' });
    }
  };
  R.float = function (text, x, y, color, max) { R.floaters.push({ text, x, y, color: color || 'white', t: 0, max: max || 1.1 }); };
  R.shake = function (v) { R.cam.shake = Math.max(R.cam.shake, v); };

  // dünya olayları → görsel efekt
  R.event = function (ev) {
    const th = R.th;
    switch (ev.type) {
      case 'jump': R.burst(ev.x, ev.y, 4, ['#ffffff', th.topL], { a0: Math.PI * 0.1, spread: Math.PI * 0.8, sp: 30, life: 0.3, g: 0 }); break;
      case 'land': R.burst(ev.x, ev.y, 5, [th.topS, '#ffffff'], { a0: Math.PI, spread: Math.PI, sp: 34, life: 0.3, g: 60 }); break;
      case 'bounce': R.burst(ev.x, ev.y, 8, ['#ff6f9f', '#ffffff'], { a0: Math.PI, spread: Math.PI, sp: 60, life: 0.4, g: 80 }); R.shake(0.15); break;
      case 'death':
        R.burst(ev.x, ev.y, 18, ['#ffd23c', '#ffffff', '#ff8fae', '#2b1a10'], { sp: 90, life: 0.8, g: 120, size: 2 });
        R.shake(0.45);
        R.float(BB.UI ? BB.UI.deathQuip(ev.cause) : 'Pof!', ev.x, ev.y - 10, 'white', 1.2);
        break;
      case 'respawn': R.burst(ev.x, ev.y - 6, 14, ['#ffb32c', '#ffd96a', '#ffffff'], { sp: 60, life: 0.6, g: 40 }); break;
      case 'pollen': R.burst(ev.x, ev.y, 6, ['#ffd84a', '#fff6c0'], { sp: 40, life: 0.4 }); break;
      case 'secret': R.burst(ev.x, ev.y, 24, ['#ff7fbf', '#ffd23c', '#7fd0ff', '#b08aff', '#ffffff'], { sp: 80, life: 1, size: 2 }); R.float('Nadir çiçek!', ev.x, ev.y - 12, 'pink', 1.8); break;
      case 'nectar': R.burst(ev.x, ev.y, 6, ['#7fd0ff', '#ffffff'], { sp: 30, life: 0.5 }); break;
      case 'checkpoint': if (ev.first) { R.burst(ev.x, ev.y - 6, 16, ['#ffb32c', '#ffd96a', '#ffffff', '#7ccf6a'], { sp: 60, life: 0.8, g: 30 }); R.float('Bal Çiçeği', ev.x, ev.y - 20, 'honey', 1.5); } break;
      case 'gate': if (ev.opening) R.shake(0.08); break;
      case 'webBreak': R.burst(ev.x, ev.y, 8, ['#ffffff', '#e8e8f0'], { sp: 40, life: 0.5, g: 40 }); break;
      case 'stuck': R.float('Yapıştı!', ev.x, ev.y - 8, 'white', 0.9); break;
      case 'free': R.float(ev.by >= 0 ? 'Kurtardın!' : 'Kurtuldu!', ev.x, ev.y - 10, 'pink', 1); break;
      case 'bloom': R.burst(ev.x, ev.y, 18, ['#ffd23c', '#ff8fb8', '#7ccf6a', '#ffffff'], { sp: 60, life: 0.9, g: 20 }); R.float('Çiçek açtı!', ev.x, ev.y - 12, 'honey', 1.4); break;
      case 'splash': R.burst(ev.x, ev.y, 4, ['#7fc8f0', '#e0f6ff'], { a0: Math.PI, spread: Math.PI, sp: 40, life: 0.3, g: 120 }); break;
      case 'crumble': R.burst(ev.x, ev.y, 10, ['#b8e8ff', '#eafaff', '#8fd0f0'], { sp: 50, life: 0.6, g: 200, size: 2 }); break;
      case 'shatter': R.burst(ev.x, ev.y, 8, ['#b8e8ff', '#ffffff'], { a0: Math.PI, spread: Math.PI, sp: 60, life: 0.5, g: 200 }); break;
      case 'carry': R.burst(ev.x, ev.y, 5, ['#ffffff'], { sp: 30, life: 0.3 }); break;
      case 'release': if (ev.thrown) R.burst(ev.x, ev.y, 6, ['#ffffff', '#fff3a6'], { sp: 50, life: 0.3 }); break;
      case 'rune': if (ev.ok) R.burst(ev.x, ev.y, 10, ['#ff9f2a', '#fff6d0'], { sp: 50, life: 0.6 }); else R.shake(0.12); break;
      case 'seqDone': R.burst(ev.x, ev.y, 24, ['#ff9f2a', '#fff6d0', '#ffd23c'], { sp: 90, life: 1, size: 2 }); break;
      case 'boraWarm': R.burst(ev.x, ev.y - 8, 30, ['#ffd23c', '#ffb32c', '#ffffff'], { sp: 70, life: 1.4, g: -10, size: 2 }); break;
      case 'qDone': R.burst(ev.x, ev.y, 14, ['#ffb32c', '#ffd96a'], { sp: 50, life: 0.8, g: -20 }); break;
      case 'tired': break;
      case 'collapseStart': R.shake(0.6); break;
      case 'mastery': R.banner = { text: 'Ustalık Geçidi', sub: ev.name, t: 0 }; break;
    }
  };

  // ------------------------------------------------------------ hava
  function stepWeather(dt) {
    const kind = (R.world && R.world.def.weather) || (R.th && R.th.weather);
    if (!kind) return;
    const rate = { petals: 6, sparkle: 3, rain: 60, fireflies: 3, snow: 22, pollen: 5, leaves: 5, storm: 90 }[kind] || 0;
    R._wAcc = (R._wAcc || 0) + rate * dt;
    while (R._wAcc >= 1) {
      R._wAcc -= 1;
      const p = weather.find((q) => !q.on);
      if (!p) break;
      p.on = true; p.kind = kind; p.t = 0; p.ph = Math.random() * 6;
      p.x = Math.random() * (W + 40) - 20; p.y = -6;
      p.z = 0.5 + Math.random() * 0.8;
      switch (kind) {
        case 'rain': p.vx = -40; p.vy = 300 + Math.random() * 80; break;
        case 'storm': p.vx = -220 - Math.random() * 80; p.vy = 140 + Math.random() * 60; p.x = Math.random() * (W + 200); break;
        case 'snow': p.vx = -8; p.vy = 18 + Math.random() * 20; break;
        case 'petals': p.vx = -14; p.vy = 14 + Math.random() * 12; p.col = Math.random() < 0.5 ? '#ffb8d2' : '#ffffff'; break;
        case 'leaves': p.vx = -20; p.vy = 18 + Math.random() * 10; p.col = ['#e84a3c', '#ffb43c', '#d9822b'][Math.floor(Math.random() * 3)]; break;
        case 'pollen': p.x = Math.random() * W; p.y = H + 4; p.vx = 4; p.vy = -10 - Math.random() * 8; break;
        case 'fireflies': p.x = Math.random() * W; p.y = 40 + Math.random() * (H - 60); p.vx = (Math.random() - 0.5) * 8; p.vy = (Math.random() - 0.5) * 6; p.life = 4 + Math.random() * 3; break;
        case 'sparkle': p.x = Math.random() * W; p.y = 20 + Math.random() * (H - 80); p.vx = 0; p.vy = 0; p.life = 0.6; break;
      }
    }
    for (const p of weather) {
      if (!p.on) continue;
      p.t += dt;
      p.x += p.vx * dt * p.z; p.y += p.vy * dt * p.z;
      if (p.kind === 'snow' || p.kind === 'petals' || p.kind === 'leaves') p.x += Math.sin(p.t * 2 + p.ph) * 0.35;
      if (p.kind === 'fireflies') { p.vx += (Math.random() - 0.5) * 10 * dt; p.vy += (Math.random() - 0.5) * 10 * dt; if (p.t > p.life) p.on = false; }
      if (p.kind === 'sparkle' && p.t > p.life) p.on = false;
      if (p.y > H + 8 || p.y < -12 || p.x < -40 || p.x > W + 220) p.on = false;
    }
  }

  function drawWeather(ctx) {
    for (const p of weather) {
      if (!p.on) continue;
      const x = Math.round(p.x), y = Math.round(p.y);
      switch (p.kind) {
        case 'rain': ctx.fillStyle = '#c4dde6'; ctx.fillRect(x, y, 1, 5); break;
        case 'storm': ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, p.z > 1 ? 3 : 2, 1); break;
        case 'snow': ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, p.z > 1 ? 2 : 1, p.z > 1 ? 2 : 1); break;
        case 'petals': case 'leaves': ctx.fillStyle = p.col; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + ((p.t * 3 | 0) % 2), y + 1, 1, 1); break;
        case 'pollen': ctx.fillStyle = '#fff3a6'; ctx.fillRect(x, y, 1, 1); break;
        case 'fireflies': { const on = Math.sin(p.t * 3 + p.ph) > -0.2; if (on) { ctx.fillStyle = '#e8ff9a'; ctx.fillRect(x, y, 2, 2); ctx.fillStyle = 'rgba(232,255,154,0.25)'; ctx.fillRect(x - 1, y - 1, 4, 4); } break; }
        case 'sparkle': { const s = p.t < 0.3 ? 1 : 2; ctx.fillStyle = '#fffbe0'; ctx.fillRect(x - s, y, s * 2 + 1, 1); ctx.fillRect(x, y - s, 1, s * 2 + 1); break; }
      }
    }
  }

  // rüzgâr çizgileri
  const windFx = [];
  for (let i = 0; i < 120; i++) windFx.push({ on: false });
  function stepWindFx(dt) {
    const w = R.world;
    if (!w || !w.e.wind.length) return;
    for (const z of w.e.wind) {
      if (z.f <= 0.05) continue;
      if (z.x > R.cam.x + W + 40 || z.x + z.w < R.cam.x - 40) continue;
      const rate = (Math.abs(z.vx) + Math.abs(z.vy)) * z.f * (z.w * z.h) / 90000;
      z._acc = (z._acc || 0) + rate * dt * 6;
      while (z._acc >= 1) {
        z._acc -= 1;
        const p = windFx.find((q) => !q.on);
        if (!p) break;
        p.on = true; p.z = z; p.t = 0;
        p.x = z.x + Math.random() * z.w; p.y = z.y + Math.random() * z.h;
        p.leaf = Math.random() < 0.18;
        p.col = z.cold ? '#ffffff' : '#ffffff';
      }
    }
    for (const p of windFx) {
      if (!p.on) continue;
      const z = p.z;
      p.t += dt;
      p.x += z.vx * z.f * dt * 1.2; p.y += z.vy * z.f * dt * 1.2;
      if (p.t > 1.4 || p.x < z.x - 8 || p.x > z.x + z.w + 8 || p.y < z.y - 8 || p.y > z.y + z.h + 8) p.on = false;
    }
  }
  function drawWindFx(ctx, ox, oy) {
    for (const p of windFx) {
      if (!p.on) continue;
      const z = p.z;
      const x = Math.round(p.x - ox), y = Math.round(p.y - oy);
      if (p.leaf) { ctx.fillStyle = R.theme === 'kis' ? '#ffffff' : '#7ccf6a'; ctx.fillRect(x, y, 2, 2); continue; }
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      if (Math.abs(z.vx) >= Math.abs(z.vy)) ctx.fillRect(x, y, 6, 1); else ctx.fillRect(x, y, 1, 6);
    }
  }

  // ------------------------------------------------------------ ana çizim
  R.draw = function (ctx) {
    const w = R.world;
    const sh = R.cam.shake > 0 ? R.cam.shake * 4 : 0;
    const sx = sh ? Math.round((Math.random() - 0.5) * sh) : 0, sy = sh ? Math.round((Math.random() - 0.5) * sh) : 0;
    const ox = Math.round(R.cam.x) + sx, oy = Math.round(R.cam.y) + sy;
    R.ox = ox; R.oy = oy;
    // arka plan
    for (const L of R.bg) {
      if (!L.wrap) { ctx.drawImage(L.c, 0, 0); continue; }
      const px = Math.floor(ox * L.f) % L.c.width;
      const py = Math.round(((w.hpx - H) - R.cam.y) * L.f * 0.35);
      ctx.drawImage(L.c, -px, py); ctx.drawImage(L.c, -px + L.c.width, py);
    }
    // karolar (arka)
    ctx.drawImage(R.tileBack, ox, oy, W, H, 0, 0, W, H);
    drawBackObjects(ctx, w, ox, oy);
    ctx.drawImage(R.tileFront, ox, oy, W, H, 0, 0, W, H);
    drawWebs(ctx, w, ox, oy);
    drawMidObjects(ctx, w, ox, oy);
    drawRope(ctx, w, ox, oy);
    for (const b of w.bees) if (!b.carriedBy) drawBee(ctx, w, b, ox, oy);
    drawFrontObjects(ctx, w, ox, oy);
    drawWater(ctx, w, ox, oy);
    drawParticles(ctx, ox, oy);
    drawWindFx(ctx, ox, oy);
    if (!R.dark) drawCollapse(ctx, w, ox, oy);
    drawWeather(ctx);
    if (R.dark) drawDarkness(ctx, w, ox, oy);
    if (R.dark) drawCollapse(ctx, w, ox, oy);   // karanlıkta da görünsün: maskenin üstünde
    if (oy + H > w.hpx) Gfx.rect(ctx, 0, w.hpx - oy, W, oy + H - w.hpx, '#2b1a10');   // harita altı (yalnız diyalogda, kutunun arkası)
    drawOverlays(ctx, w, ox, oy);
    if (R.banner) {
      const bn = R.banner;
      bn.t += BB.Game.drawDt || 1 / 60;
      const a = Math.min(1, bn.t * 3, (2.6 - bn.t) * 2);
      if (a <= 0 && bn.t > 1) R.banner = null;
      else {
        // ince şerit, HUD hizasında: oyun alanının ortasını kapatmasın
        ctx.globalAlpha = Math.max(0, a);
        const label = bn.text + ' · ', tw = BB.Font.measure(label) + BB.Font.measure(bn.sub);
        const x0 = Math.round(W / 2 - tw / 2);
        Gfx.panel(ctx, x0 - 8, 26, tw + 16, 15, '#3b2516', '#2b1a10');
        Gfx.text(ctx, label, x0, 27, { color: 'cream' });
        Gfx.text(ctx, bn.sub, x0 + BB.Font.measure(label), 27, { color: 'honey' });
        ctx.globalAlpha = 1;
      }
    }
    for (const f of R.floaters) {
      const a = f.t > f.max - 0.3 ? (f.max - f.t) / 0.3 : 1;
      ctx.globalAlpha = Math.max(0, a);
      Gfx.text(ctx, f.text, f.x - ox, f.y - oy, { color: f.color, align: 'center', outline: 'shadow' });
      ctx.globalAlpha = 1;
    }
  };

  // ------------------------------------------------------------ nesneler
  function vis(x, y, w, h, ox, oy) { return x + w > ox - 8 && x < ox + W + 8 && y + h > oy - 8 && y < oy + H + 8; }

  function drawBackObjects(ctx, w, ox, oy) {
    const t = R.time;
    // çıkış
    const ex = w.exit;
    Gfx.spr(ctx, 'hivedoor', ex.open > 0.5 || w.state === 'won' ? 1 : 0, ex.x - ox, ex.y + 16 - 32 - oy);
    // tabelalar
    for (const s of w.e.sign) if (vis(s.x, s.y, 16, 16, ox, oy)) Gfx.spr(ctx, 'sign', 0, s.x - ox, s.y - oy);
    // süsler
    for (const d of w.e.decor) {
      if (d.hidden || (d.round && !BB.roundMatch(d.round, w.round))) continue;
      const sz = Gfx.sprSize('decor_' + d.s);
      const dx = d.x + 8 - Math.floor(sz.w / 2), dy = d.y + 16 - sz.h;
      if (vis(dx, dy, sz.w, sz.h, ox, oy)) Gfx.spr(ctx, 'decor_' + d.s, 0, dx - ox, dy - oy, d.flip);
    }
    // bal çiçekleri (checkpoint)
    for (const c of w.checks) {
      if (!vis(c.x, c.y - 8, 16, 24, ox, oy)) continue;
      c.bloom = c.on ? Math.min(3, (c.bloom || 0) + 0.12) : 0;
      Gfx.spr(ctx, 'honeyflower', Math.floor(c.bloom), c.x - ox, c.y + 16 - 24 - oy + (c.on && Math.floor(t * 2) % 2 ? 0 : 0));
    }
    // soru kaideleri
    for (const q of w.questions) {
      if (!vis(q.x, q.y - 8, 16, 24, ox, oy)) continue;
      Gfx.spr(ctx, 'pedestal', q.done ? 1 : 0, q.x - ox, q.y + 16 - 22 - oy + (q.done ? 0 : Math.round(Math.sin(t * 2) * 0.6)));
      if (!q.done) {
        const a = w.bees[0], b = w.bees[1];
        const near = Math.abs(a.x - q.x) < 80 || Math.abs(b.x - q.x) < 80;
        if (near) Gfx.spr(ctx, 'emote_q', 0, q.x + 4 - ox, q.y - 18 - oy + Math.round(Math.sin(t * 3) * 1.5));
      }
    }
    // rünler, saksılar, sarmaşıklar, plakalar
    for (const r of w.e.rune) if (vis(r.x, r.y, 16, 16, ox, oy)) Gfx.spr(ctx, 'rune_' + r.sym, r.lit ? 1 : 0, r.x - ox, r.y - oy);
    for (const p of w.e.pot) if (vis(p.x, p.y, 16, 16, ox, oy)) Gfx.spr(ctx, 'pot', p.bloomed ? 1 : 0, p.x - ox, p.y - oy);
    for (const v of w.e.vine) drawVine(ctx, v, ox, oy);
    for (const p of w.e.plate) if (vis(p.x, p.y, 16, 16, ox, oy)) {
      Gfx.spr(ctx, 'plate', p.pressed || p.t > 0 ? 1 : 0, p.x - ox, p.y + 10 - oy);
      if (p.timer && p.t > 0) { const k = p.t / p.timer; Gfx.rect(ctx, p.x + 2 - ox, p.y + 8 - oy, Math.round(12 * k), 1, '#ffb32c'); }
    }
    for (const f of w.e.flower) if (vis(f.x, f.y, 16, 16, ox, oy)) Gfx.spr(ctx, 'holdflower', f.open > 0.5 ? 1 : 0, f.x - ox, f.y - oy);
    for (const n of w.nectars) if (vis(n.x, n.y, 16, 16, ox, oy)) Gfx.spr(ctx, 'nectar', n.cd > 0 ? 1 : 0, n.x - 3 - ox, n.y - 3 - oy + Math.round(Math.sin(t * 2 + n.x) * 0.6));
    for (const f of w.e.fire) if (vis(f.x - 8, f.y - 10, 16, 16, ox, oy)) Gfx.spr(ctx, 'brazier', Math.floor(t * 8) % 3, f.x - 8 - ox, f.y - 10 - oy);
    for (const g of w.e.glow) if (vis(g.x - 8, g.y - 8, 16, 16, ox, oy)) Gfx.spr(ctx, 'glowshroom', (Math.floor(g.x / 16) + Math.floor(g.y / 16)) % 4, g.x - 8 - ox, g.y - 8 - oy);
    // NPC'ler
    for (const n of w.e.npc) if (!n.hidden) drawNpc(ctx, n, ox, oy);
    for (const b of w.e.bora) drawBora(ctx, b, ox, oy);
    for (const r of w.e.race) drawFrog(ctx, r, ox, oy);
  }

  const NPC_SPR = { kralice: 'npc_kralice', puntur: 'npc_puntur', zipzip: 'npc_zipzip', hu: 'npc_hu', isil: 'npc_isil', bora: 'npc_bora', golge: 'npc_golge' };
  function drawNpc(ctx, n, ox, oy) {
    const name = n.spr || NPC_SPR[n.who] || 'npc_puntur';
    const sz = Gfx.sprSize(name);
    if (!vis(n.x - sz.w / 2, n.y - sz.h, sz.w, sz.h, ox, oy)) return;
    const fr = n.talking ? (Math.floor(R.time * 6) % 2 ? 2 : 0) % sz.n : Math.floor(R.time * 1.6) % Math.min(2, sz.n);
    let y = n.y - sz.h;
    if (n.who === 'isil') y += Math.round(Math.sin(R.time * 2) * 2) - 6;
    Gfx.spr(ctx, name, fr, n.x - sz.w / 2 - ox, y - oy, n.face > 0 ? false : true);
  }
  function drawBora(ctx, b, ox, oy) {
    const name = b.done ? 'npc_bora_warm' : 'npc_bora_frozen';
    Gfx.spr(ctx, name, 0, b.x - 16 - ox, b.y - 24 - oy, true);
    if (!b.done) {
      const k = b.heat;
      Gfx.rect(ctx, b.x - 12 - ox, b.y - 30 - oy, 24, 3, '#1c2540');
      Gfx.rect(ctx, b.x - 11 - ox, b.y - 29 - oy, Math.round(22 * k), 1, k > 0.6 ? '#ffb32c' : '#9fd8f0');
    }
  }
  function drawFrog(ctx, r, ox, oy) {
    if (r.st === 'won') return;
    const hop = r.st === 'run' ? Math.abs(Math.sin(r.hop * 7)) * 6 : 0;
    const fr = r.st === 'run' ? 3 : Math.floor(R.time * 1.6) % 2;
    Gfx.spr(ctx, 'npc_zipzip', fr, r.fx - 16 - ox, r.fy - 32 - hop - oy);
    if (r.st === 'count') {
      const n = Math.ceil(r.t / 0.8);
      Gfx.text(ctx, n > 0 ? String(n) : 'Haydi!', W / 2, 60, { color: 'honey', align: 'center', scale: 3, outline: 'shadow' });
    }
  }

  function drawVine(ctx, v, ox, oy) {
    if (v.grow <= 0) return;
    const hpx = v.h * TILE * v.grow;
    const bx = v.x + 7 - ox, by = v.y + TILE - oy;
    Gfx.rect(ctx, bx, by - hpx, 2, hpx, '#4f9a3f');
    Gfx.rect(ctx, bx + 2, by - hpx, 1, hpx, '#2f6a2a');
    for (const s of v.leaves) if (s.active) drawPlat(ctx, s.x - ox, s.y - oy, s.w, 'leaf');
  }

  function drawPlat(ctx, x, y, w, style) {
    const cols = { leaf: ['#5cc27a', '#3f9a52', '#9cea7f'], wood: ['#d39b5d', '#a8733f', '#e8b878'], cloud: ['#ffffff', '#d8eaf4', '#ffffff'], shroom: ['#ff6f9f', '#e2457a', '#ffb3cc'], wax: ['#ffd96a', '#e0a020', '#fff3c4'], ice: ['#b8e8ff', '#8fd0f0', '#eafaff'], stone: ['#c9b8a3', '#a99683', '#e8dccb'] }[style] || ['#5cc27a', '#3f9a52', '#9cea7f'];
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = '#2b1a10';
    ctx.fillRect(x + 1, y, w - 2, 6); ctx.fillRect(x, y + 1, w, 4);
    ctx.fillStyle = cols[0]; ctx.fillRect(x + 1, y + 1, w - 2, 4);
    ctx.fillStyle = cols[1]; ctx.fillRect(x + 1, y + 4, w - 2, 1);
    ctx.fillStyle = cols[2]; ctx.fillRect(x + 2, y + 1, Math.max(1, w - 6), 1);
    if (style === 'leaf') { ctx.fillStyle = cols[1]; for (let i = 4; i < w - 3; i += 5) ctx.fillRect(x + i, y + 2, 1, 1); }
  }

  const GATE_STYLE = { bahar: 'hedge', yaz: 'reed', sonbahar: 'root', magara: 'crystal', kis: 'ice', kovan: 'wax' };
  const GATE_COLS = {
    hedge: ['#3f9a52', '#5cc27a', '#2f6a2a', '#9b7cc0'], petal: ['#ff8fbd', '#ffd0e4', '#e2609a', '#ffd23c'], reed: ['#6fae4a', '#9cd06a', '#3f7a2a', '#8a5a32'],
    root: ['#7a4a2a', '#9a6434', '#4d2d1c', '#d9822b'], crystal: ['#7fb2e0', '#c8e4ff', '#4a6ea8', '#ff7fd0'], ice: ['#b8e8ff', '#eafaff', '#7cc0e0', '#ffffff'],
    wax: ['#e0a020', '#ffd96a', '#a86416', '#fff3c4'], wood: ['#a8733f', '#d39b5d', '#6e4830', '#e8b878'], stone: ['#a99683', '#c9b8a3', '#7a6a5a', '#e8dccb'],
  };
  function drawGate(ctx, g, ox, oy) {
    const s = g.solid;
    if (!s.active || !vis(s.x, s.y, s.w, s.h, ox, oy)) return;
    const st = g.style || GATE_STYLE[R.theme] || 'hedge';
    const c = GATE_COLS[st] || GATE_COLS.hedge;
    const x = Math.round(s.x - ox), y = Math.round(s.y - oy), w = s.w, h = Math.round(s.h);
    ctx.fillStyle = '#2b1a10'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = c[0]; ctx.fillRect(x + 1, y, w - 2, h);
    // desen
    ctx.fillStyle = c[1];
    for (let yy = 0; yy < h; yy += 6) for (let xx = 2; xx < w - 2; xx += 5) {
      const off = ((yy / 6) & 1) * 2;
      if (st === 'ice' || st === 'crystal') ctx.fillRect(x + xx + off, y + yy + 1, 1, 3);
      else if (st === 'wax') { ctx.fillRect(x + xx + off, y + yy + 1, 3, 1); ctx.fillRect(x + xx + off - 1, y + yy + 2, 1, 2); }
      else ctx.fillRect(x + xx + off, y + yy + 2, 2, 2);
    }
    ctx.fillStyle = c[2]; ctx.fillRect(x + w - 3, y, 2, h);
    // dikenler / uçlar
    if (st === 'hedge' || st === 'root') { ctx.fillStyle = c[3]; for (let yy = 3; yy < h; yy += 7) { ctx.fillRect(x - 1, y + yy, 2, 1); ctx.fillRect(x + w - 1, y + yy + 3, 2, 1); } }
    // ön kenar başlığı
    const capY = g.dir === 'up' ? y + h - 3 : y;
    ctx.fillStyle = '#2b1a10'; ctx.fillRect(x - 1, capY, w + 2, 3);
    ctx.fillStyle = c[3]; ctx.fillRect(x, capY + 1, w, 1);
    if (g.coop) { ctx.fillStyle = '#ffd23c'; ctx.fillRect(x + w / 2 - 1, capY - (g.dir === 'up' ? 4 : -4), 2, 2); }
  }

  function drawMidObjects(ctx, w, ox, oy) {
    const t = R.time;
    for (const g of w.e.gate) drawGate(ctx, g, ox, oy);
    for (const p of w.e.platform) if (vis(p.solid.x, p.solid.y, p.w, 8, ox, oy)) drawPlat(ctx, p.solid.x - ox, p.solid.y - oy, p.w, p.style);
    for (const l of w.e.lily) if (vis(l.x, l.y, l.w, 8, ox, oy)) Gfx.spr(ctx, l.w >= 48 ? 'lily48' : 'lily32', l.mode === 'pair' ? 1 : 0, l.x + (l.w > 32 && l.w < 48 ? (l.w - 32) / 2 : 0) - ox, l.y - 2 - oy);
    for (const p of w.e.pulse) if (vis(p.x, p.y, p.w, 8, ox, oy)) for (let i = 0; i < p.w; i += 16) Gfx.spr(ctx, 'shelf', p.solidNow ? (p.warn && Math.floor(t * 10) % 2 ? 1 : 0) : 2, p.x + i - ox, p.y - 1 - oy);
    for (const b of w.e.bridge) for (const s of b.segs) if (vis(s.x, s.y, 16, 8, ox, oy)) Gfx.spr(ctx, 'bridge', s.active ? 0 : 1, s.x - ox, s.y - oy);
    for (const c of w.e.crumble) for (const s of c.segs) {
      if (!s.active || !vis(s.x, s.y, 16, 16, ox, oy)) continue;
      const jig = s.st === 'shake' ? Math.round(Math.sin(t * 60) * 1) : 0;
      Gfx.spr(ctx, 'crumble', s.st === 'shake' ? (s.t < 0.25 ? 2 : 1) : 0, s.x + jig - ox, s.y - oy);
    }
    for (const b of w.e.bounce) if (vis(b.x, b.y, 16, 16, ox, oy)) Gfx.spr(ctx, 'mushroom', b.squash > 0.3 ? 1 : 0, b.x - ox, b.y - oy);
    for (const ch of w.e.choice) drawChoice(ctx, w, ch, ox, oy);
    // yerdeki eşyalar
    for (const it of w.items) if (!it.used && !it.holder) drawItem(ctx, it, ox, oy);
    // toplanabilirler
    for (const p of w.pollen) if (!p.taken && vis(p.x, p.y, 8, 8, ox, oy)) Gfx.spr(ctx, 'pollen', Math.floor(t * 3 + p.ph) % 2, p.x - ox, p.y - oy + Math.round(Math.sin(t * 2.5 + p.ph) * 1.2));
    for (const s of w.secrets) if (!s.taken && vis(s.x, s.y, 14, 14, ox, oy)) Gfx.spr(ctx, 'rare', Math.floor(t * 2) % 2, s.x - 1 - ox, s.y - 1 - oy + Math.round(Math.sin(t * 2) * 1.5));
  }

  function drawChoice(ctx, w, ch, ox, oy) {
    if (!vis(ch.x, ch.y, 16, 32, ox, oy)) return;
    const oq = w.openQ;
    const active = oq && oq.qi + 1 === ch.q;
    let stage = ch.open > 0.5 ? 1 : 0;
    if (active && (oq.pick[0] === ch.opt || oq.pick[1] === ch.opt)) stage = 2;
    Gfx.spr(ctx, 'choice' + (ch.opt % 4), stage, ch.x - ox, ch.y - oy);
    if (active && R.openLabels) {
      const label = R.openLabels[ch.opt] || '';
      const lines = BB.Font.wrap(label, 64);
      const lh = lines.length * 11 + 6;
      const lw = Math.max(...lines.map((l) => BB.Font.measure(l))) + 8;
      const lx = ch.x + 8 - ox - Math.floor(lw / 2), ly = ch.y - oy - lh - 4;
      Gfx.panel(ctx, lx, ly, lw, lh, '#fff4dc', '#3b2516');
      lines.forEach((l, i) => Gfx.text(ctx, l, ch.x + 8 - ox, ly + 1 + i * 11, { color: 'ink', align: 'center' }));
      // kim seçti işaretleri
      for (let i = 0; i < 2; i++) if (oq.pick[i] === ch.opt) Gfx.spr(ctx, 'emote_' + (i === 0 ? 'left' : 'right'), 0, ch.x + (i === 0 ? -8 : 12) - ox, ch.y + 2 - oy);
    }
  }

  function drawItem(ctx, it, ox, oy) {
    if (!vis(it.x - 4, it.y - 4, 20, 16, ox, oy)) return;
    if (it.kind === 'pollen') Gfx.spr(ctx, 'item_pollen', 0, it.x - ox, it.y - oy);
    else if (it.kind === 'lantern') Gfx.spr(ctx, 'item_lantern', Math.floor(R.time * 4) % 2, it.x - ox, it.y - 2 - oy);
    else if (it.kind === 'shield') Gfx.spr(ctx, 'item_shield', 0, it.x - 4 - ox, it.y - oy);
  }

  function drawFrontObjects(ctx, w, ox, oy) {
    for (const s of w.e.spider) {
      if (!vis(s.x - 8, s.y0, 16, s.y - s.y0 + 10, ox, oy)) continue;
      Gfx.rect(ctx, s.x - ox, s.y0 - oy, 1, s.y - s.y0 - 3, 'rgba(255,255,255,0.7)');
      Gfx.spr(ctx, 'spider', Math.floor(R.time * 4) % 2, s.x - 6 - ox, s.y - 5 - oy);
    }
    for (const d of w.e.drip) {
      if (d.st === 'form') { if (d.form > 0.5 && vis(d.x - 2, d.y0 - 4, 6, 8, ox, oy)) { const k = (d.form - 0.5) * 2; Gfx.rect(ctx, d.x - 1 - ox, d.y0 - oy, 3, Math.max(1, Math.round(k * 3)), '#7fc8f0'); } }
      else if (vis(d.x - 3, d.y0 + d.dy - 4, 6, 8, ox, oy)) Gfx.spr(ctx, 'drip', 0, d.x - 2 - ox, d.y0 + d.dy - 5 - oy);
    }
    for (const i of w.e.icicle) if (i.st !== 'gone' && vis(i.x, i.y, 8, 14, ox, oy)) Gfx.spr(ctx, 'icicle', 0, i.x + (i.st === 'shake' ? Math.round(Math.sin(R.time * 50)) : 0) - ox, i.y - oy);
  }

  function drawWebs(ctx, w, ox, oy) {
    const c0 = Math.max(0, Math.floor(ox / TILE)), c1 = Math.min(w.cols - 1, Math.floor((ox + W) / TILE));
    const r0 = Math.max(0, Math.floor(oy / TILE)), r1 = Math.min(w.rows - 1, Math.floor((oy + H) / TILE));
    ctx.fillStyle = 'rgba(240,240,250,0.85)';
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (w.tileAt(c, r) !== BB.T.WEB) continue;
      const x = c * TILE - ox, y = r * TILE - oy;
      ctx.fillRect(x, y + 8, 16, 1); ctx.fillRect(x + 8, y, 1, 16);
      for (let k = 0; k < 16; k++) { ctx.fillRect(x + k, y + k, 1, 1); ctx.fillRect(x + 15 - k, y + k, 1, 1); }
      ctx.fillRect(x + 4, y + 4, 8, 1); ctx.fillRect(x + 4, y + 11, 8, 1); ctx.fillRect(x + 4, y + 4, 1, 8); ctx.fillRect(x + 11, y + 4, 1, 8);
    }
  }

  function drawWater(ctx, w, ox, oy) {
    if (!R.waterTiles.length) return;
    const th = R.th, t = R.time;
    for (const [c, r, surf] of R.waterTiles) {
      const x = c * TILE - ox, y = r * TILE - oy;
      if (x < -16 || x > W || y < -16 || y > H) continue;
      ctx.fillStyle = th.water; ctx.globalAlpha = 0.88;
      ctx.fillRect(x, y + (surf ? 3 : 0), 16, surf ? 13 : 16);
      ctx.globalAlpha = 1;
      if (surf) {
        ctx.fillStyle = th.waterL;
        const ph = Math.floor(t * 4 + c * 1.7) % 4;
        ctx.fillRect(x, y + 3, 16, 1);
        ctx.fillRect(x + ((ph * 4) % 16), y + 2, 3, 1);
        ctx.fillStyle = th.waterS; ctx.fillRect(x, y + 6, 16, 1);
        if ((c + Math.floor(t * 2)) % 5 === 0) { ctx.fillStyle = th.waterL; ctx.fillRect(x + 6, y + 9, 2, 1); }
      }
    }
  }

  function drawCollapse(ctx, w, ox, oy) {
    for (const c of w.e.collapse) {
      if (!c.on && !c.done) continue;
      if (c.done) continue;
      const fx = Math.round(c.front - ox);
      if (fx < -10) continue;
      ctx.fillStyle = '#150f2a'; ctx.fillRect(0, 0, Math.max(0, fx), H);
      ctx.fillStyle = '#2a2148';
      for (let y = 0; y < H; y += 8) { const j = Math.floor(Math.sin((y + R.time * 80) * 0.3) * 4 + 4); ctx.fillRect(fx - 2, y, j, 8); }
      // cephe kenarı: açık renkli kırık taş çizgisi (karanlıkta seçilsin)
      ctx.fillStyle = '#9a86d0';
      for (let y = 0; y < H; y += 8) { const j = Math.floor(Math.sin((y + R.time * 80) * 0.3) * 4 + 4); ctx.fillRect(fx - 2 + j, y + 1, 1, 6); }
      ctx.fillStyle = '#d8ccff';
      for (let k = 0; k < 10; k++) { const yy = Math.floor((k * 29 + R.time * 90) % H); ctx.fillRect(fx + 2 + ((k * 7) % 6), yy, 1, 1); }
      // düşen taşlar
      ctx.fillStyle = '#4b3d72';
      for (let k = 0; k < 6; k++) { const rx = fx + 10 + ((k * 37 + Math.floor(R.time * 7) * 13) % 70), ry = ((R.time * 160 + k * 53) % (H + 20)) - 10; ctx.fillRect(rx, ry, 3, 3); }
    }
  }

  function drawParticles(ctx, ox, oy) {
    for (const p of parts) {
      if (!p.on) continue;
      const a = Math.min(1, p.life / (p.max * 0.5));
      ctx.globalAlpha = a;
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x - ox), Math.round(p.y - oy), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ arılar
  function beeSprite(w, b) {
    const role = b.role;
    if (b.dead && w.state === 'dying') return [role + '_dead', 0];
    if (b.carriedBy) return [role + '_held', 0];
    if (b.stuck) return [role + '_fall', 0];
    if (w.state === 'won') return [role + '_face_happy', 0];
    if (b.emote === 'heart' || b.faceMood === 'happy') return [role + '_face_happy', 0];
    if (b.faceMood) return [role + '_face_' + b.faceMood, 0];
    if (b.onGround) {
      if (b.landT > 0) return [role + '_land', 0];
      if (Math.abs(b.vx) > 8) return [role + '_walk', Math.floor(b.animT * 10) % 4];
      const blink = (b.animT % 3.7) > 3.55;
      if (blink) return [role + '_face_blink', 0];
      return [role + '_idle', Math.floor(b.animT * 2.5) % 4];
    }
    if (b.flapping) return [role + '_fly', Math.floor(b.flapT * 8) % 4];
    if (b.gliding) return [role + '_glide', Math.floor(b.flapT * 2) % 2];
    if (b.vy > 110) return [role + '_fall', 0];
    return [role + '_fly', Math.floor(b.flapT * 5) % 4];
  }

  const headTopCache = {};
  function headTop(name, fr) {
    const key = name + ':' + fr;
    if (headTopCache[key] !== undefined) return headTopCache[key];
    let top = 2;
    try {
      const s = Gfx.book.byName[name], r = s.rects[(fr | 0) % s.rects.length];
      const c = document.createElement('canvas'); c.width = r[2]; c.height = r[3];
      const x = c.getContext('2d'); x.drawImage(Gfx.atlas, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
      const d = x.getImageData(0, 0, r[2], r[3]).data;
      search: for (let yy = 0; yy < r[3]; yy++) for (let xx = 10; xx <= 13; xx++) if (d[(yy * r[2] + xx) * 4 + 3] > 10) { top = yy; break search; }
    } catch (e) { /* varsayılan */ }
    return (headTopCache[key] = top);
  }

  function drawBee(ctx, w, b, ox, oy) {
    const flip = b.facing < 0;
    const bx = b.x - 3 - ox, by = b.y - 4 - oy;
    if (w.state === 'respawn') {
      const k = 1 - w.stateT / 0.45;
      if (Math.floor(k * 10) % 2 === 0 && k < 0.6) return;
    }
    // tutulan kalkan başın üstünde, arkada
    if (b.item && b.item.kind === 'shield') Gfx.spr(ctx, 'item_shield', 0, b.x - 4 - ox, b.y - 10 - oy);
    const [name, fr] = beeSprite(w, b);
    const dying = b.dead && w.state === 'dying';
    let dy = 0, rot = 0;
    if (dying) { const k = 1 - w.stateT / 0.8; dy = -Math.sin(Math.min(1, k * 1.4) * Math.PI) * 10; rot = k; }
    Gfx.spr(ctx, name, fr, bx, by + dy, dying ? (Math.floor(rot * 12) % 2 === 0) : flip);
    // ikinci tur: başlarında minik altın taç (antenlerin üstüne oturur)
    if (BB.Game && BB.Game.round >= 2 && !dying) {
      const top = headTop(name, fr);
      const cx = Math.round(bx) + (flip ? 2 : 9), cy = Math.round(by + dy) + top - 2;
      ctx.fillStyle = '#2b1a10'; ctx.fillRect(cx - 1, cy - 1, 7, 4);
      ctx.fillStyle = '#ffd23c'; ctx.fillRect(cx, cy + 1, 5, 1); ctx.fillRect(cx, cy, 1, 1); ctx.fillRect(cx + 2, cy, 1, 1); ctx.fillRect(cx + 4, cy, 1, 1);
      ctx.fillStyle = '#ff6fa3'; ctx.fillRect(cx + 2, cy + 1, 1, 1);
    }
    if (b.carrying) {
      const c = b.carrying;
      const [n2] = beeSprite(w, c);
      Gfx.spr(ctx, n2, 0, c.x - 3 - ox, c.y - 4 - oy + 1, flip);
      if (c.pointDir) Gfx.spr(ctx, c.pointDir < 0 ? 'emote_left' : 'emote_right', 0, c.x - 2 - ox, c.y + 12 - oy);
    }
    if (b.item && b.item.kind !== 'shield') drawItem(ctx, b.item, ox, oy);
    if (b.stuck) { ctx.fillStyle = 'rgba(240,240,250,0.9)'; const x = Math.round(b.x - ox), y = Math.round(b.y - oy); ctx.fillRect(x - 2, y + 3, 14, 1); ctx.fillRect(x + 4, y - 2, 1, 14); ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 10, y + 9, 1, 1); }
  }

  function drawRope(ctx, w, ox, oy) {
    const n = w.leashN;
    if (n < 0.72) return;
    const a = w.bees[0], b = w.bees[1];
    const x0 = a.x + 5, y0 = a.y + 6, x1 = b.x + 5, y1 = b.y + 6;
    const slack = Math.max(0, 1 - n) * 60;
    const steps = Math.max(6, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 7));
    ctx.fillStyle = n > 0.97 ? '#ff9f2a' : '#ffd23c';
    ctx.globalAlpha = Math.min(1, (n - 0.72) * 4);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * slack;
      ctx.fillRect(Math.round(x - ox), Math.round(y - oy), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ karanlık (düz renk + taranmış kenarlı ışık delikleri)
  function drawDarkness(ctx, w, ox, oy) {
    const m = R.mask.ctx;
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, W, H);
    m.fillStyle = R.th.dark || '#0d0b1e';
    m.globalAlpha = 0.9;
    m.fillRect(0, 0, W, H);
    m.globalAlpha = 1;
    m.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const c = Gfx.lightCircle(r); m.drawImage(c, Math.round(x - ox - c.width / 2), Math.round(y - oy - c.height / 2)); };
    for (const l of w.lights()) hole(l.x, l.y, l.r);
    for (const g of w.e.glow) hole(g.x, g.y, g.r);
    for (const f of w.e.fire) hole(f.x, f.y, 40);
    for (const b of w.bees) if (!b.carriedBy) hole(b.x + 5, b.y + 6, 16);
    for (const n of w.e.npc) if (!n.hidden && n.who === 'isil') hole(n.x, n.y - 10, 34);
    hole(w.exit.x + 16, w.exit.y, 30);
    for (const c of w.checks) hole(c.x + 8, c.y + 4, c.on ? 26 : 14);
    for (const q of w.questions) hole(q.x + 8, q.y + 4, 22);
    for (const s of w.e.sign) hole(s.x + 8, s.y + 6, 16);
    for (const [tx, ty] of R.thornTiles) if (tx > ox - 16 && tx < ox + W + 16 && ty > oy - 16 && ty < oy + H + 16) hole(tx, ty, 11);
    m.globalCompositeOperation = 'source-over';
    ctx.drawImage(R.mask.c, 0, 0);
    // fener ışığına düz sıcak renk tonu
    ctx.globalAlpha = 0.08;
    for (const l of w.lights()) { const c = Gfx.lightCircle(l.r); ctx.drawImage(c, Math.round(l.x - ox - c.width / 2), Math.round(l.y - oy - c.height / 2)); }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ arı üstü göstergeler, tabelalar
  function drawOverlays(ctx, w, ox, oy) {
    if (!(BB.Story && BB.Story.active) && !(BB.QFlow && BB.QFlow.active)) for (const s of w.e.sign) if (s.show > 0.05) drawSignBubble(ctx, s, ox, oy, w);
    for (const b of w.bees) {
      if (b.carriedBy || !b.alive || (b.dead && w.state === 'dying')) continue;
      const x = Math.round(b.x - ox), y = Math.round(b.y - oy);
      // enerji çubuğu
      const pool = b.energy + (b.carrying ? b.carrying.energy : 0), max = b.carrying ? 2 : 1;
      b._eShow = pool < max - 0.001 ? 1.2 : Math.max(0, (b._eShow || 0) - (BB.Game.drawDt || 1 / 60));
      if (b._eShow > 0) {
        const bw = b.carrying ? 16 : 10;
        const bx = x + 5 - bw / 2, byy = y - 7;
        ctx.globalAlpha = Math.min(1, b._eShow * 2);
        Gfx.rect(ctx, bx - 1, byy - 1, bw + 2, 4, '#2b1a10');
        Gfx.rect(ctx, bx, byy, bw, 2, '#5a4636');
        Gfx.rect(ctx, bx, byy, Math.round(bw * pool / max), 2, pool / max < 0.25 ? '#ff7a5c' : '#ffd23c');
        if (b.carrying) Gfx.rect(ctx, bx + bw / 2, byy, 1, 2, '#2b1a10');
        ctx.globalAlpha = 1;
      }
      // ısı (kış)
      if (w.cold) {
        const k = b.heat;
        const hx = x - 1, hy = y - (b._eShow > 0 ? 12 : 7);
        Gfx.rect(ctx, hx, hy, 12, 4, '#1c2540');
        Gfx.rect(ctx, hx + 1, hy + 1, Math.round(10 * k), 2, k < 0.3 ? (Math.floor(R.time * 6) % 2 ? '#ffffff' : '#7cc0e0') : k < 0.6 ? '#ffb32c' : '#ff7a5c');
      }
      // duygu baloncuğu
      if (b.emote && b.emoteT > 0 && !b.faceMood) Gfx.spr(ctx, 'emote_' + b.emote, 0, x + 1, y - 18 - (b._eShow > 0 ? 4 : 0));
      // isim etiketi (başta ve çağırınca)
      if (R.nameT > 0 || b.callT > 0) {
        const nm = BB.Game && BB.Game.names ? BB.Game.names[b.id] : (b.id ? '2' : '1');
        const col = b.role === 'disi' ? 'pink' : 'blue';
        Gfx.text(ctx, nm, x + 5, y - 30, { color: col, align: 'center', outline: 'shadow' });
      }
    }
    // çağrı oku: ortağın üstünde, çağırana doğru
    for (const b of w.bees) {
      if (b.callT <= 0) continue;
      const o = w.bees[1 - b.id];
      const x = Math.round(o.x + 5 - ox), y = Math.round(o.y - 14 - oy);
      Gfx.spr(ctx, b.x < o.x ? 'emote_left' : 'emote_right', 0, x - 5, y - (Math.floor(R.time * 8) % 2));
    }
  }

  function drawSignBubble(ctx, s, ox, oy, w) {
    const text = BB.UI ? BB.UI.signText(s) : s.text;
    const lines = BB.Font.wrap(text, 150);
    const lw = Math.max(...lines.map((l) => BB.Font.measure(l))) + 10;
    const lh = lines.length * 11 + 5;
    let x = Math.round(s.x + 8 - ox - lw / 2), y = Math.round(s.y - oy - lh - 6);
    x = BB.clamp(x, 2, W - lw - 2);
    // balon bir arıyı örtüyorsa arının üstüne kaydır
    if (w) for (const b of w.bees) {
      const bx = b.x - ox, by = b.y - oy - 10;   // isim/enerji çubuğu payı
      if (bx + b.w > x && bx < x + lw && by + b.h + 10 > y && by < y + lh) y = Math.min(y, Math.round(by - lh - 2));
    }
    y = Math.max(2, y);
    ctx.globalAlpha = Math.min(1, s.show * 1.5);
    Gfx.panel(ctx, x, y, lw, lh, '#fff4dc', '#3b2516', '#e8d4b0');
    lines.forEach((l, i) => Gfx.text(ctx, l, x + 5, y + 1 + i * 11, { color: 'ink' }));
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ HUD
  // ilk bölümlerde ekranın alt köşelerinde her oyuncunun tuşları
  R.drawKeyHints = function (ctx, w, alpha) {
    if (alpha <= 0) return;
    const g = BB.Game, K = BB.Input.KEYS.p;
    ctx.globalAlpha = Math.min(1, alpha);
    for (let i = 0; i < 2; i++) {
      const n = K[i].names, right = i === 1;
      const rows = [[n.left + ' ' + n.right, 'yürü'], [n.flap, 'kanat'], [n.action, 'eylem']];
      const bw = 88, bh = 14 + rows.length * 13, bx = right ? W - bw - 4 : 4, by = H - bh - 4;
      Gfx.panel(ctx, bx, by, bw, bh, 'rgba(43,26,16,0.6)', 'rgba(0,0,0,0)');
      const col = g.roles[i] === 'disi' ? 'pink' : 'blue';
      Gfx.text(ctx, g.names[i], bx + bw / 2, by + 1, { color: col, align: 'center', outline: 'shadow' });
      rows.forEach((r, j) => { const kw = Gfx.key(ctx, r[0], bx + 4, by + 14 + j * 13); Gfx.text(ctx, r[1], bx + 8 + kw, by + 13 + j * 13, { color: 'cream' }); });
    }
    ctx.globalAlpha = 1;
  };

  R.drawHUD = function (ctx, w, info) {
    info = info || {};
    const drops = info.drops || 0;
    const jarF = Math.min(4, Math.floor((drops / 40) * 4 + (drops > 0 ? 0.5 : 0)));
    Gfx.panel(ctx, 4, 4, 108, 20, 'rgba(43,26,16,0.55)', 'rgba(43,26,16,0.0)');
    Gfx.spr(ctx, 'jar', jarF, 8, 6);
    Gfx.text(ctx, drops + '/40', 25, 6, { color: 'white', outline: 'shadow' });
    Gfx.spr(ctx, 'pollen', 0, 62, 10);
    Gfx.text(ctx, w.stats.pollen + '/' + w.stats.pollenTotal, 73, 6, { color: 'white', outline: 'shadow' });
    if (w.stats.secret) Gfx.spr(ctx, 'rare', 0, 116, 7);
    if (info.title && info.titleT > 0) {
      ctx.globalAlpha = Math.min(1, info.titleT);
      Gfx.text(ctx, info.title, W - 6, 6, { color: 'white', align: 'right', outline: 'shadow' });
      ctx.globalAlpha = 1;
    }
  };
})();
