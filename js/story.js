/* Bee & Bloom — sahne oynatıcı: diyalog kutusu (daktilo, blip, portre), tepkiler, kamera, Gölge kaçışları. */
(function () {
  'use strict';
  const BB = window.BB;
  const Gfx = BB.Gfx, Input = BB.Input;
  const W = BB.W, H = BB.H, TILE = BB.TILE;

  const SPEAKERS = {
    kralice: { name: 'Kraliçe Arı', col: 'lilac', pt: 'kralice' },
    puntur: { name: 'Püntür', col: 'red', pt: 'puntur' },
    zipzip: { name: 'Kral Zıpzıp', col: 'green', pt: 'zipzip' },
    hu: { name: 'Profesör Hu', col: 'honeyD', pt: 'hu' },
    isil: { name: 'Işıl', col: 'green', pt: 'isil' },
    bora: { name: 'Bora', col: 'blue', pt: 'bora' },
    golge: { name: '???', col: 'gray', pt: null },
    anlatici: { name: '', col: 'ink', pt: null },
  };
  BB.SPEAKERS = SPEAKERS;

  const S = {
    active: false, steps: null, i: 0, world: null, onDone: null,
    line: null, shown: 0, acc: 0, wait: 0, actors: [], title: null, flash: 0, letterbox: 0, skipHint: 0,
  };
  BB.Story = S;

  S.ctxNames = function () {
    const g = BB.Game;
    return { p1: g.names[0], p2: g.names[1], disi: g.names[g.roles.indexOf('disi')], erkek: g.names[g.roles.indexOf('erkek')] };
  };

  S.start = function (id, world, onDone) {
    const sc = BB.SCENES[id];
    if (!sc) { if (onDone) onDone(); return false; }
    S.steps = (sc.steps || sc).slice();
    S.id = id; S.i = 0; S.world = world; S.onDone = onDone; S.active = true;
    S.line = null; S.wait = 0; S.actors.length = 0; S.title = null; S.skipHint = 2.5;
    S.next();
    return true;
  };

  S.finish = function () {
    S.active = false;
    S.line = null; S.actors.length = 0; S.title = null;
    if (S.world) for (const n of S.world.e.npc) n.talking = false;
    if (S.world) for (const b of S.world.bees) { b.faceMood = null; }
    if (BB.Render) BB.Render.cam.focus = null;
    const cb = S.onDone; S.onDone = null;
    if (cb) cb();
  };

  // sahneyi atla: kalan dünya etkilerini uygula
  S.skip = function () {
    while (S.i < S.steps.length) { const st = S.steps[S.i++]; if (st.fx && S.world) S.world.applyFx(st); }
    S.finish();
  };

  function npcById(id) { return S.world ? S.world.e.npc.find((n) => n.id === id || n.who === id) : null; }
  // nokta: [sütun, satır] ya da bölümdeki işaret adı (def.marks)
  function pt(v) {
    if (Array.isArray(v)) return v;
    const m = S.world && S.world.def.marks && S.world.def.marks[v];
    return m || null;
  }
  function beeOf(who) {
    const w = S.world; if (!w) return [];
    const g = BB.Game;
    if (who === 'both') return w.bees;
    if (who === 'p1') return [w.bees[0]];
    if (who === 'p2') return [w.bees[1]];
    if (who === 'disi' || who === 'erkek') return [w.bees[g.roles.indexOf(who)]];
    return [];
  }

  S.next = function () {
    for (const n of (S.world ? S.world.e.npc : [])) n.talking = false;
    while (S.i < S.steps.length) {
      const st = S.steps[S.i++];
      if (st.round && !BB.roundMatch(st.round, BB.Game.round)) continue;
      if (st.say) {
        const sp = SPEAKERS[st.say] || SPEAKERS.anlatici;
        const text = BB.fmt(st.text, S.ctxNames());
        S.line = { who: st.say, sp, text, face: st.face || 'talk', lines: BB.Font.wrap(text, sp.pt ? 384 : 440), total: 0 };
        S.line.total = S.line.lines.reduce((a, l) => a + Array.from(l).length + 1, 0);
        S.shown = 0; S.acc = 0;
        const n = npcById(st.say); if (n) n.talking = true;
        return;
      }
      if (st.react) {
        for (const b of beeOf(st.react)) { if (st.e) { b.emote = st.e; b.emoteT = st.t || 1.4; } if (st.face) b.faceMood = st.face; }
        if (st.e && BB.Audio) BB.Audio.sfx(st.e === 'heart' ? 'free' : st.e === 'call' ? 'call' : 'pick', { id: 0 });
        S.wait = st.wait !== undefined ? st.wait : 0.9; return;
      }
      if (st.wait) { S.wait = st.wait; return; }
      if (st.cam !== undefined) {
        if (st.cam === null || st.cam === 'bees') BB.Render.cam.focus = null;
        else if (Array.isArray(st.cam)) BB.Render.cam.focus = { x: st.cam[0] * TILE + 8, y: st.cam[1] * TILE };
        else { const n = npcById(st.cam), m = pt(st.cam); if (n) BB.Render.cam.focus = { x: n.x, y: n.y - 20 }; else if (m) BB.Render.cam.focus = { x: m[0] * TILE + 8, y: m[1] * TILE }; }
        continue;
      }
      if (st.npc) {
        const n = npcById(st.npc);
        if (n) {
          if (st.face) n.face = st.face;
          if (st.hide) n.hidden = true;
          if (st.show) n.hidden = false;
          const to = st.to ? pt(st.to) : null;
          if (to) { S.actors.push({ kind: 'move', npc: n, fx: n.x, fy: n.y, tx: to[0] * TILE + 8, ty: (to[1] + 1) * TILE, t: 0, T: st.t || 1 }); if (st.blocking !== false) { S.wait = st.t || 1; return; } }
        }
        continue;
      }
      if (st.shadow) {
        const sh = st.shadow;
        const a = pt(sh.from), b = pt(sh.to);
        if (!a || !b) continue;
        S.actors.push({ kind: 'shadow', fx: a[0] * TILE, fy: (a[1] + 1) * TILE, tx: b[0] * TILE, ty: (b[1] + 1) * TILE, t: 0, T: sh.t || 1.2, hop: sh.hop || 0 });
        if (BB.Audio) BB.Audio.sfx('webBreak');
        if (sh.wait !== false) { S.wait = (sh.t || 1.2) + 0.2; return; }
        continue;
      }
      if (st.title) { S.title = { text: BB.fmt(st.title, S.ctxNames()), sub: st.sub ? BB.fmt(st.sub, S.ctxNames()) : '', t: 0, T: st.t || 2.6 }; S.wait = st.t || 2.6; return; }
      if (st.sfx) { if (BB.Audio) BB.Audio.sfx(st.sfx, st.opt); continue; }
      if (st.music !== undefined) { if (BB.Audio) { if (st.music) BB.Audio.play(st.music); else BB.Audio.stopMusic(); } continue; }
      if (st.shake) { BB.Render.shake(st.shake); continue; }
      if (st.flash) { S.flash = st.flash; continue; }
      if (st.fx) { if (S.world) S.world.applyFx(st); continue; }
      if (st.burst) { const p = pt(st.burst.at || st.burst) || st.burst; BB.Render.burst(p[0] * TILE + 8, p[1] * TILE + 8, st.burst.n || 20, st.burst.cols || ['#ffd23c', '#ffffff'], { sp: 70, life: 1 }); continue; }
    }
    S.finish();
  };

  S.update = function (dt) {
    if (!S.active) return;
    if (S.skipHint > 0) S.skipHint -= dt;
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 2);
    for (let k = S.actors.length - 1; k >= 0; k--) {
      const a = S.actors[k];
      a.t += dt;
      const u = Math.min(1, a.t / a.T);
      if (a.kind === 'move') { a.npc.x = BB.lerp(a.fx, a.tx, u); a.npc.y = BB.lerp(a.fy, a.ty, u); if (u >= 1) S.actors.splice(k, 1); }
      else if (a.kind === 'shadow') {
        a.x = BB.lerp(a.fx, a.tx, u); a.y = BB.lerp(a.fy, a.ty, u) - Math.abs(Math.sin(u * Math.PI * (a.hop || 1))) * (a.hop ? 14 : 0);
        if (Math.random() < 0.5) BB.Render.burst(a.x + 16, a.y - 2, 1, ['#dff4ff', '#ffffff'], { sp: 10, life: 0.6 });
        if (u >= 1) S.actors.splice(k, 1);
      }
    }
    if (S.title) S.title.t += dt;
    if (Input.hit('Tab')) { S.skip(); return; }
    if (S.wait > 0) { S.wait -= dt; if (S.wait <= 0) { S.wait = 0; if (S.title && S.title.t >= S.title.T - 0.01) S.title = null; S.next(); } return; }
    if (S.line) {
      const L = S.line;
      if (S.shown < L.total) {
        S.acc += dt * 46;
        while (S.acc >= 1 && S.shown < L.total) { S.acc -= 1; S.shown++; if (S.shown % 2 === 0 && BB.Audio) BB.Audio.blip(L.who); }
      }
      if (Input.confirm()) {
        if (S.shown < L.total) S.shown = L.total;
        else { S.line = null; if (BB.Audio) BB.Audio.sfx('move'); S.next(); }
      }
    }
  };

  // sahne aktörlerini dünya üstüne çiz
  S.drawActors = function (ctx, ox, oy) {
    for (const a of S.actors) if (a.kind === 'shadow' && a.x !== undefined) Gfx.spr(ctx, 'npc_golge', Math.floor(a.t * 10) % 2, a.x - ox, a.y - 24 - oy, a.tx < a.fx);
  };

  S.draw = function (ctx) {
    if (!S.active) return;
    if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash); Gfx.rect(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
    if (S.title) {
      const tt = S.title;
      const a = Math.min(1, tt.t * 2, (tt.T - tt.t) * 2);
      ctx.globalAlpha = Math.max(0, a);
      Gfx.rect(ctx, 0, 92, W, 64, 'rgba(43,26,16,0.72)');
      Gfx.text(ctx, tt.text, W / 2, 100, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      if (tt.sub) Gfx.text(ctx, tt.sub, W / 2, 134, { color: 'cream', align: 'center' });
      ctx.globalAlpha = 1;
    }
    if (S.line) drawBox(ctx, S.line);
    if (S.skipHint > 0 && S.steps && S.steps.length > 3) {
      ctx.globalAlpha = Math.min(1, S.skipHint);
      Gfx.text(ctx, 'Tab: sahneyi geç', W - 6, 4, { color: 'white', align: 'right', outline: 'shadow' });
      ctx.globalAlpha = 1;
    }
  };

  function portraitName(L) {
    const g = BB.Game;
    if (!L.sp.pt) return null;
    const face = L.face === 'talk' ? (S.shown < L.total && Math.floor(performance.now() / 120) % 2 ? 'talk' : 'normal') : L.face;
    const name = 'pt_' + L.sp.pt + '_' + face;
    if (Gfx.book.byName[name]) return name;
    return 'pt_' + L.sp.pt + '_normal';
    void g;
  }

  function drawBox(ctx, L) {
    const bx = 6, by = H - 76, bw = W - 12, bh = 72;
    Gfx.panel(ctx, bx, by, bw, bh, '#fff4dc', '#3b2516', '#e8d4b0');
    Gfx.rect(ctx, bx + 3, by + 3, bw - 6, 1, '#ffd96a');
    let tx = bx + 10;
    const pt = portraitName(L);
    if (pt) {
      Gfx.panel(ctx, bx + 6, by + 10, 52, 52, '#ffe9b8', '#3b2516');
      Gfx.spr(ctx, pt, 0, bx + 8, by + 12);
      tx = bx + 66;
    }
    if (L.sp.name) {
      const nw = BB.Font.measure(L.sp.name) + 12;
      Gfx.panel(ctx, bx + 8, by - 9, nw, 14, '#ffd23c', '#3b2516');
      Gfx.text(ctx, L.sp.name, bx + 14, by - 9, { color: 'ink' });
    }
    Gfx.text(ctx, L.lines.join('\n'), tx, by + 8, { color: L.who === 'anlatici' ? 'honeyD' : 'ink', chars: S.shown, lineH: 13 });
    if (S.shown >= L.total && Math.floor(performance.now() / 300) % 2) Gfx.text(ctx, '▼', bx + bw - 14, by + bh - 16, { color: 'honeyD' });
  }
})();
