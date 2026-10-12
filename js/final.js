/* Bee & Bloom — final: Kraliçe'nin açıklaması, ışık küreleri, çiçek açan vadi, Anı Defteri, Anı Kartı, jenerik. */
(function () {
  'use strict';
  const BB = window.BB;
  const Gfx = BB.Gfx, Input = BB.Input, Audio = BB.Audio, Story = BB.Story;
  const W = BB.W, H = BB.H;
  const F = {};
  BB.Final = F;
  const Game = () => BB.Game;
  const save = () => BB.Save.cur;

  // ------------------------------------------------------------ final sahne metinleri
  BB.SCENES.__final_1 = [
    { say: 'kralice', face: 'happy', text: 'Bal hiç çalınmadı, küçüklerim.' },
    { say: 'kralice', face: 'talk', text: 'Kraliçe Balı, birbirini tanıyan iki kalpten doğar. Sönen ışık bir hırsız beklemiyordu. Sizi bekliyordu.' },
    { say: 'kralice', face: 'talk', text: 'Yol boyunca verdiğiniz her cevap bir bal damlasıydı. Aynı düşündüğünüzde de, farklı düşündüğünüzde de… Çünkü tanımak, aynı olmak değildir.' },
    { say: 'kralice', face: 'happy', text: 'Bakın…' },
  ];
  BB.SCENES.__final_2 = [
    { say: 'kralice', face: 'happy', text: 'Balı siz yaptınız.' },
    { say: 'bora', face: 'soft', text: 'Ben yalnızca bekledim. Işık sönmesin, siz gelene kadar.' },
    { say: 'kralice', face: 'talk', text: 'Son nöbetçim… Kışın en uzun gecesinde bile kapıdan ayrılmadın. Şimdi ısın, Bora. Artık yalnız değilsin.' },
  ];
  BB.SCENES.__final_3 = [
    { say: 'anlatici', text: 'Kırk damla ışık kavanoza aktı. Bal, ilk kez bu kadar parlak yandı.' },
    { say: 'anlatici', text: 'Vadide karlar eridi, yapraklar yeşerdi, göl ışıdı. Mevsimler yeniden dönmeye başladı.' },
    { say: 'kralice', face: 'happy', text: '{p1}, {p2}… Birbirinizi tanıdınız. Bundan sonra da tanımaya devam edin. Bal ancak böyle tazelenir.' },
  ];

  // ------------------------------------------------------------ yardımcılar
  const bgCache = {};
  function layers(theme) {
    if (!bgCache[theme]) bgCache[theme] = BB.Tiles.makeBackground(theme).map((L) => ({ c: Gfx.pcToCanvas(L.pc), f: L.f, wrap: L.wrap }));
    return bgCache[theme];
  }
  function drawBg(ctx, theme, scroll) {
    for (const L of layers(theme)) {
      if (!L.wrap) { ctx.drawImage(L.c, 0, 0); continue; }
      const px = Math.floor((scroll || 0) * L.f) % L.c.width;
      ctx.drawImage(L.c, -px, 0); ctx.drawImage(L.c, -px + L.c.width, 0);
    }
  }
  // düz renkli, kenarı taranmış disk (ışık halesi) — gradyan yok
  const discCache = {};
  function disc(r, col) {
    const k = r + col;
    if (discCache[k]) return discCache[k];
    const pc = new BB.Art.PixelCanvas(r * 2 + 2, r * 2 + 2);
    for (let y = 0; y < pc.h; y++) for (let x = 0; x < pc.w; x++) {
      const d = Math.hypot(x + 0.5 - (r + 1), y + 0.5 - (r + 1));
      if (d <= r - 5) pc.set(x, y, col);
      else if (d <= r && BB.Art.bayer4(x, y) < 1 - (d - (r - 5)) / 5) pc.set(x, y, col);
    }
    discCache[k] = Gfx.pcToCanvas(pc);
    return discCache[k];
  }
  // tarama ile geçiş maskesi (dithering crossfade)
  const ditherPat = [];
  function ditherFill(ctx, level, color) {
    const lv = Math.max(0, Math.min(16, Math.round(level * 16)));
    if (!ditherPat[lv]) {
      const c = document.createElement('canvas'); c.width = 4; c.height = 4;
      const x = c.getContext('2d');
      const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      x.fillStyle = '#fff';
      for (let i = 0; i < 16; i++) if (B4[i] < lv) x.fillRect(i % 4, Math.floor(i / 4), 1, 1);
      ditherPat[lv] = c;
    }
    return ctx.createPattern(ditherPat[lv], 'repeat');
  }

  function drawJar(ctx, cx, by, fill, glow, t) {
    // 2x büyüklükte bal kavanozu (68x84), alt orta noktası (cx, by)
    const x0 = Math.round(cx - 34), y0 = Math.round(by - 84);
    if (glow > 0) {
      for (const [r, a] of [[78, 0.12], [58, 0.18], [42, 0.25]]) {
        ctx.globalAlpha = a * glow;
        const rr = Math.round(r + Math.sin(t * 2 + r) * 3);
        const d = disc(rr, '#fff6c0');
        ctx.drawImage(d, Math.round(cx - d.width / 2), Math.round(y0 + 46 - d.height / 2));
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#3b2516'; ctx.fillRect(x0 + 14, y0, 40, 14); ctx.fillRect(x0 + 2, y0 + 14, 64, 70);
    ctx.fillStyle = '#c8683a'; ctx.fillRect(x0 + 16, y0 + 2, 36, 10); ctx.fillStyle = '#e0804a'; ctx.fillRect(x0 + 16, y0 + 2, 36, 2);
    ctx.fillStyle = '#e8f6ff'; ctx.fillRect(x0 + 4, y0 + 16, 60, 66);
    const hh = Math.round(62 * BB.clamp(fill, 0, 1));
    if (hh > 0) {
      ctx.fillStyle = glow > 0.5 ? '#ffc94a' : '#ffb32c'; ctx.fillRect(x0 + 6, y0 + 80 - hh, 56, hh);
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x0 + 6, y0 + 80 - hh, 56, 3);
      ctx.fillStyle = '#e8961c'; for (let k = 0; k < 4; k++) ctx.fillRect(x0 + 12 + k * 12, y0 + 82 - Math.max(4, hh * 0.6) + ((k * 7) % 5), 2, 2);
    }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + 10, y0 + 22, 4, 30); ctx.fillRect(x0 + 10, y0 + 56, 4, 6);
  }

  // ------------------------------------------------------------ final sahnesi
  F.begin = function () {
    const d = save();
    if (d) { d.finished = true; d.atEnd = true; d.finishedAt = d.finishedAt || Date.now(); BB.Save.flush(); }
    Game().go(F.Scene);
  };

  F.Scene = {
    enter() {
      this.t = 0; this.phase = 'in'; this.pt = 0;
      this.fill = 0.12; this.glow = 0; this.boraWarm = false; this.bloom = 0; this.flowers = [];
      this.orbs = [];
      const d = save();
      const ans = d ? d.answers : {};
      const qs = BB.Q.order().filter((q) => ans[q.id]);
      qs.forEach((q, i) => this.orbs.push({ match: BB.Q.match(ans[q.id]), t0: i * 0.16, a: i * 0.7, st: 'wait', x: 0, y: 0 }));
      this.total = Math.max(1, this.orbs.length);
      this.fx = [];
      Audio.play('kamp', { fade: 1.5 });
    },
    say(id, next) { this.phase = 'talk'; Story.start(id, null, () => { this.phase = next; this.pt = 0; }); },
    update(dt) {
      this.t += dt; this.pt += dt;
      if (Story.active) { Story.update(dt); this.stepOrbs(dt); return; }
      switch (this.phase) {
        case 'in': if (this.pt > 1.2) this.say('__final_1', 'orbs'); break;
        case 'orbs': {
          this.stepOrbs(dt);
          if (this.orbs.every((o) => o.st === 'in') && this.pt > 1) { this.phase = 'burst'; this.pt = 0; Audio.sfx('celebrate'); Audio.play('final', { fade: 0.8 }); }
          break;
        }
        case 'burst':
          this.glow = Math.min(1, this.pt * 1.5);
          if (this.pt > 2) { this.boraWarm = true; this.say('__final_2', 'bloom'); }
          break;
        case 'bloom':
          this.bloom = Math.min(1, this.pt / 3);
          if (this.flowers.length < 140 && Math.random() < 0.9) this.flowers.push({ x: Math.random() * W, y: 200 + Math.random() * 60, c: ['#ff8fb8', '#ffd23c', '#ffffff', '#c6a0ff', '#ff9f6b', '#7fd0ff'][Math.floor(Math.random() * 6)], t: 0 });
          if (this.pt > 3.4) this.say('__final_3', 'title');
          break;
        case 'title':
          if (this.pt > 4.5 || (this.pt > 1.2 && Input.confirm())) { Audio.sfx('select'); Game().go(F.Notebook, { fromFinal: true }); }
          break;
      }
      for (const f of this.flowers) f.t += dt;
    },
    stepOrbs(dt) {
      if (this.phase !== 'orbs' && this.phase !== 'talk') return;
      if (this.phase !== 'orbs') return;
      const jx = W / 2, jy = 130;
      for (const o of this.orbs) {
        if (o.st === 'wait' && this.pt > o.t0) { o.st = 'rise'; o.x = jx + (Math.random() < 0.5 ? -26 : 26); o.y = 230; o.r = 80 + Math.random() * 10; o.k = 0; Audio.sfx('blip', { f: 600 + Math.random() * 500, wave: 'sine' }); }
        if (o.st === 'rise' || o.st === 'orbit') {
          o.k += dt;
          o.a += dt * 3.2;
          o.r = Math.max(6, o.r - dt * 34);
          const tx = jx + Math.cos(o.a) * o.r, ty = jy + Math.sin(o.a) * o.r * 0.45;
          o.x += (tx - o.x) * Math.min(1, dt * 6); o.y += (ty - o.y) * Math.min(1, dt * 6);
          o.st = 'orbit';
          if (o.r <= 6.5 && o.k > 1.4) { o.st = 'in'; this.fill = Math.min(1, this.fill + 0.88 / this.total); Audio.sfx('blip', { f: 900 + this.fill * 600, wave: 'triangle' }); }
        }
      }
    },
    draw(ctx) {
      const t = this.t;
      if (this.phase === 'bloom' || this.phase === 'title' || (this.phase === 'talk' && this.bloom > 0)) { this.drawValley(ctx); }
      else {
        drawBg(ctx, 'kovan', t * 8);
        // zemin
        ctx.fillStyle = '#c98a24'; ctx.fillRect(0, 222, W, 48);
        ctx.fillStyle = '#e09a2e'; for (let x = 0; x < W; x += 12) ctx.fillRect(x + ((x / 12) % 2) * 6, 226, 8, 3);
        ctx.fillStyle = '#5a3508'; ctx.fillRect(0, 222, W, 1);
        drawJar(ctx, W / 2, 210, this.fill, this.glow, t);
        // karakterler (2x)
        Gfx.sprScaled(ctx, 'npc_kralice', Math.floor(t * 1.5) % 2, 72, 158, 2);
        Gfx.sprScaled(ctx, this.boraWarm ? 'npc_bora_warm' : 'npc_bora', 0, 330, 174, 2, true);
        const g = Game();
        const hop = this.phase === 'burst' ? Math.abs(Math.sin(t * 6)) * 6 : 0;
        Gfx.sprScaled(ctx, g.roles[0] + (this.phase === 'orbs' || this.phase === 'burst' ? '_face_happy' : '_idle'), 0, 172, 190 - hop, 2);
        Gfx.sprScaled(ctx, g.roles[1] + (this.phase === 'orbs' || this.phase === 'burst' ? '_face_happy' : '_idle'), 0, 276, 190 - hop, 2, true);
        // küreler
        for (const o of this.orbs) {
          if (o.st !== 'orbit') continue;
          ctx.fillStyle = o.match ? '#ffd23c' : '#ff8fb8';
          ctx.fillRect(Math.round(o.x) - 2, Math.round(o.y) - 2, 5, 5);
          ctx.fillStyle = '#fffbe0'; ctx.fillRect(Math.round(o.x) - 1, Math.round(o.y) - 1, 2, 2);
        }
        if (this.phase === 'burst' && this.pt < 0.6) { ctx.globalAlpha = 1 - this.pt / 0.6; Gfx.rect(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
        if (this.phase === 'in') { ctx.globalAlpha = Math.max(0, 1 - this.pt); Gfx.rect(ctx, 0, 0, W, H, '#000000'); ctx.globalAlpha = 1; }
        if (this.phase === 'orbs') Gfx.text(ctx, 'Cevaplarınız…', W / 2, 16, { color: 'cream', align: 'center', outline: 'shadow' });
      }
      Story.draw(ctx);
    },
    drawValley(ctx) {
      const k = this.bloom, t = this.t;
      // kıştan bahara taramalı geçiş
      drawBg(ctx, 'kis', t * 10);
      if (!F._off) { F._off = document.createElement('canvas'); F._off.width = W; F._off.height = H; }
      const off = F._off;
      const o = off.getContext('2d');
      o.imageSmoothingEnabled = false;
      o.globalCompositeOperation = 'source-over';
      o.clearRect(0, 0, W, H);
      drawBg(o, 'bahar', t * 10);
      o.globalCompositeOperation = 'destination-in';
      o.fillStyle = ditherFill(o, k);
      o.fillRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0);
      // zemin + çiçekler
      ctx.fillStyle = k > 0.5 ? '#7ccf6a' : '#f4f8ff'; ctx.fillRect(0, 236, W, 34);
      ctx.fillStyle = k > 0.5 ? '#5fb35a' : '#d2def2'; ctx.fillRect(0, 236, W, 2);
      for (const f of this.flowers) {
        const s = Math.min(1, f.t * 3);
        ctx.fillStyle = '#4f9a3f'; ctx.fillRect(Math.round(f.x), Math.round(f.y + 8 - 6 * s), 1, Math.round(6 * s) + 1);
        if (s >= 1) { ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) + 1, 3, 3); ctx.fillStyle = '#ffe066'; ctx.fillRect(Math.round(f.x), Math.round(f.y) + 2, 1, 1); }
      }
      // kovan ve dostlar
      Gfx.spr(ctx, 'decor_hive', 0, W / 2 - 32, 236 - 72);
      const friends = [['npc_puntur', 70, 236 - 24], ['npc_zipzip', 110, 236 - 32], ['npc_hu', 360, 236 - 32], ['npc_isil', 400, 236 - 40]];
      for (const [n, x, y] of friends) Gfx.spr(ctx, n, Math.floor(t * 2) % 2, x, y, x > W / 2);
      Gfx.spr(ctx, 'npc_kralice', 0, W / 2 - 54, 236 - 32);
      Gfx.spr(ctx, 'npc_bora_warm', 0, W / 2 + 26, 236 - 24, true);
      const g = Game();
      for (let i = 0; i < 2; i++) {
        const a = t * 1.3 + i * Math.PI;
        Gfx.spr(ctx, g.roles[i] + '_fly', Math.floor(t * 12) % 4, W / 2 - 8 + Math.cos(a) * 70, 120 + Math.sin(a * 2) * 18, Math.sin(a) > 0);
      }
      if (this.phase === 'title') {
        const a = Math.min(1, this.pt);
        ctx.globalAlpha = a;
        UI().drawLogo(ctx, W / 2, 40, 10, 4);
        ctx.globalAlpha = 1;
      }
    },
  };
  const UI = () => BB.UI;

  // ------------------------------------------------------------ Anı Defteri
  F.Notebook = {
    enter(o) {
      this.o = o || {};
      this.t = 0; this.spread = 0; this.flip = 0; this.dir = 0; this.cache = {};
      const d = save();
      this.d = d;
      this.qs = BB.Q.order().filter((q) => d && d.answers[q.id]);
      this.nSpreads = 1 + Math.ceil(this.qs.length / 4);
      Audio.play('final', { fade: 1 });
    },
    update(dt) {
      this.t += dt;
      if (this.flip > 0) { this.flip = Math.max(0, this.flip - dt / 0.35); return; }
      if (Input.leftNav() && this.spread > 0) { this.spread--; this.flip = 1; this.dir = -1; Audio.sfx('page'); }
      else if ((Input.rightNav() || Input.hit('Space')) && this.spread < this.nSpreads - 1) { this.spread++; this.flip = 1; this.dir = 1; Audio.sfx('page'); }
      else if (Input.hit('Enter') || Input.hit('NumpadEnter')) {
        if (this.spread < this.nSpreads - 1) { this.spread++; this.flip = 1; this.dir = 1; Audio.sfx('page'); }
        else { Audio.sfx('select'); Game().go(F.CardScreen, this.o); }
      } else if (Input.back()) { Audio.sfx('back'); Game().go(F.CardScreen, this.o); }
    },
    page(i) {
      // sayfa i (0: kapak sol, 1: kapak sağ, 2..: girişler) → önbellekli tuval
      if (this.cache[i]) return this.cache[i];
      const c = document.createElement('canvas'); c.width = 200; c.height = 214;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.fillStyle = '#fff4dc'; x.fillRect(0, 0, 200, 214);
      x.fillStyle = '#efe0c0'; for (let y = 24; y < 214; y += 14) x.fillRect(8, y, 184, 1);
      const d = this.d, g = Game(), names = d ? d.names : g.names, roles = d ? d.roles : g.roles;
      if (i === 0) {
        Gfx.text(x, 'Anı Defteri', 100, 14, { color: 'honeyD', align: 'center', scale: 2 });
        Gfx.spr(x, 'pt_' + roles[0] + '_happy', 0, 26, 52);
        Gfx.spr(x, 'pt_' + roles[1] + '_happy', 0, 126, 52, true);
        Gfx.text(x, '♥', 100, 70, { color: 'pink', align: 'center', scale: 2 });
        Gfx.text(x, names[0] + ' & ' + names[1], 100, 108, { color: 'ink', align: 'center' });
        const u = BB.Q.uyum(d ? d.answers : {});
        Gfx.text(x, 'Uyum: %' + u.pct, 100, 126, { color: 'honeyD', align: 'center', scale: 2 });
        Gfx.text(x, BB.fmtDate(d && d.finishedAt ? d.finishedAt : Date.now()), 100, 160, { color: 'gray', align: 'center' });
      } else if (i === 1) {
        Gfx.text(x, 'Kırk soru, kırk cevap.', 100, 30, { color: 'ink', align: 'center' });
        Gfx.text(x, 'Her biri bir bal damlası oldu.', 100, 44, { color: 'ink', align: 'center' });
        Gfx.text(x, '← → sayfa çevir', 100, 150, { color: 'gray', align: 'center' });
        Gfx.text(x, 'Enter: ileri · Esc: Anı Kartı', 100, 164, { color: 'gray', align: 'center' });
        Gfx.spr(x, 'jar', 4, 93, 80);
      } else {
        const base = (i - 2) * 2;
        for (let k = 0; k < 2; k++) {
          const q = this.qs[base + k];
          if (!q) continue;
          const rec = d.answers[q.id];
          const opts = BB.Q.options(q, names);
          let y = 8 + k * 104;
          const head = (base + k + 1) + '. ' + q.text;
          Gfx.text(x, head, 10, y, { color: 'ink', maxW: 182 }); y += BB.Font.wrap(head, 182).length * 12 + 2;
          const who = (j) => (q.type === 'T' ? (j === (q.subject || 0) ? names[j] + ' seçti' : names[j] + ' tahmini') : names[j]);
          for (let j = 0; j < 2; j++) {
            const line = who(j) + ': ' + opts[j === 0 ? rec.a : rec.b];
            Gfx.text(x, line, 16, y, { color: roles[j] === 'disi' ? 'pink' : 'blue', maxW: 176 }); y += BB.Font.wrap(line, 176).length * 12;
          }
          const st = BB.Q.stamp(q, rec), good = BB.Q.match(rec);
          const sw = BB.Font.measure(st) + 10;
          const sx = 190 - sw, sy = 8 + k * 104 + 84;
          x.fillStyle = good ? '#3f9a52' : '#e84a3c';
          x.fillRect(sx, sy, sw, 14); x.fillStyle = '#fff4dc'; x.fillRect(sx + 1, sy + 1, sw - 2, 12);
          Gfx.text(x, st, sx + sw / 2, sy + 1, { color: good ? 'green' : 'red', align: 'center' });
        }
        Gfx.text(x, String(i - 1), 100, 200, { color: 'gray', align: 'center' });
      }
      this.cache[i] = c;
      return c;
    },
    draw(ctx) {
      drawBg(ctx, 'kovan', this.t * 6);
      ctx.globalAlpha = 0.35; Gfx.rect(ctx, 0, 0, W, H, '#2b1a10'); ctx.globalAlpha = 1;
      // kitap
      const L = 38, R = 242, Y = 26;
      Gfx.rect(ctx, L - 6, Y - 6, 416, 226, '#7a4a24');
      Gfx.rect(ctx, L - 4, Y - 4, 412, 222, '#a8733f');
      const sp = this.spread;
      const left = this.page(sp * 2), right = this.page(sp * 2 + 1);
      ctx.drawImage(left, L, Y); ctx.drawImage(right, R, Y);
      Gfx.rect(ctx, 238, Y, 4, 214, '#5e3618');
      if (this.flip > 0) {
        // dönen sayfa: önce eski sağ sayfa kapanır, sonra yeni sol sayfa açılır (ileri)
        const u = 1 - this.flip;
        if (this.dir > 0) {
          const prevR = this.page((sp - 1) * 2 + 1);
          if (u < 0.5) { const w = Math.round(200 * (1 - u * 2)); ctx.drawImage(prevR, 0, 0, 200, 214, R, Y, w, 214); Gfx.rect(ctx, R + w - 2, Y, 2, 214, '#d8c8a8'); }
          else { const prevL = this.page((sp - 1) * 2); const w = Math.round(200 * (u - 0.5) * 2); ctx.drawImage(prevL, L, Y); ctx.drawImage(left, 0, 0, 200, 214, 238 - w, Y, w, 214); }
        } else {
          const nextL = this.page((sp + 1) * 2);
          if (u < 0.5) { const w = Math.round(200 * (1 - u * 2)); ctx.drawImage(nextL, 0, 0, 200, 214, 238 - w, Y, w, 214); }
          else { const nextR = this.page((sp + 1) * 2 + 1); const w = Math.round(200 * (u - 0.5) * 2); ctx.drawImage(nextR, R, Y); ctx.drawImage(right, 0, 0, 200, 214, R, Y, w, 214); }
        }
      }
      Gfx.text(ctx, (sp + 1) + ' / ' + this.nSpreads, W / 2, H - 13, { color: 'cream', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ Anı Kartı ekranı
  F.CardScreen = {
    enter(o) {
      this.o = o || {}; this.t = 0; this.scroll = 0; this.msg = ''; this.msgT = 0;
      this.card = BB.Card.render(save());
      F.lastCard = this.card;
    },
    update(dt) {
      this.t += dt;
      if (this.msgT > 0) this.msgT -= dt;
      const maxS = Math.max(0, this.card.height - (H - 16));
      if (Input.isDown('ArrowDown') || Input.isDown('KeyS')) this.scroll = Math.min(maxS, this.scroll + dt * 90);
      else if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) this.scroll = Math.max(0, this.scroll - dt * 90);
      else if (this.t > 1.5 && this.t < 6) this.scroll = Math.min(maxS, this.scroll + dt * 18);
      if (Input.hit('Enter') || Input.hit('NumpadEnter')) {
        const sz = (this.card.width * BB.Card.SIZE.scale) + '×' + (this.card.height * BB.Card.SIZE.scale);
        BB.Card.download(this.card, 'bee-and-bloom-ani-karti.png', (ok) => { this.msg = ok ? 'Anı Kartı indirildi (' + sz + ' PNG)' : 'İndirme başarısız oldu'; this.msgT = 3; });
        Audio.sfx('shutter');
      }
      if (Input.hit('KeyT')) {
        const all = BB.Card.renderAll(save());
        BB.Card.download(all, 'bee-and-bloom-tum-cevaplar.png', (ok) => { this.msg = ok ? 'Tüm cevaplar indirildi (PNG)' : 'İndirme başarısız oldu'; this.msgT = 3; });
        Audio.sfx('shutter');
      }
      if (Input.hit('Space') || Input.back()) { Audio.sfx('select'); Game().go(this.o.fromFinal ? F.Credits : (this.o.back || BB.UI.Menu), this.o); }
    },
    draw(ctx) {
      drawBg(ctx, 'kovan', this.t * 6);
      ctx.globalAlpha = 0.4; Gfx.rect(ctx, 0, 0, W, H, '#2b1a10'); ctx.globalAlpha = 1;
      const cx = 30;
      ctx.drawImage(this.card, 0, Math.round(this.scroll), this.card.width, H - 16, cx, 8, this.card.width, H - 16);
      const x = 316;
      Gfx.text(ctx, 'Anı Kartı', x + 72, 30, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      const rows = [['Enter', 'Kartı indir (PNG)'], ['T', 'Tüm cevaplar (PNG)'], ['↑ ↓', 'Kaydır'], ['Boşluk', 'Devam']];
      rows.forEach((r, i) => { const w = Gfx.key(ctx, r[0], x, 72 + i * 22); Gfx.text(ctx, r[1], x + w + 6, 72 + i * 22, { color: 'cream', outline: 'shadow' }); });
      if (this.msgT > 0) Gfx.text(ctx, this.msg, x + 72, 180, { color: 'gold', align: 'center', maxW: 150, outline: 'shadow' });
      Gfx.text(ctx, 'Bee & Bloom · designed by sadixck', x + 72, H - 24, { color: 'cream', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ jenerik
  F.Credits = {
    enter(o) {
      this.o = o || {}; this.t = 0; this.y = H + 10;
      const g = Game();
      this.lines = [
        ['Bee & Bloom', 'title'], ['', ''], ['', ''], ['designed by sadixck', 'big'], ['', ''],
        ...(save() ? [['Oynayanlar', 'head'], [g.names[0] + ' & ' + g.names[1], 'name'], ['', '']] : []),
        ['Karakterler', 'head'], ['Kraliçe Arı · Püntür · Kral Zıpzıp', ''], ['Profesör Hu · Işıl · Bora', ''], ['', ''],
        ['Hikâye, bölümler, bulmacalar', 'head'], ['sadixck · sevgiyle tasarlandı', ''], ['', ''],
        ['Müzik ve sesler', 'head'], ['WebAudio ile kodla bestelendi', ''], ['', ''],
        ['Grafikler', 'head'], ['Piksel piksel, kodla çizildi', ''], ['', ''],
        ['Yazı tipi', 'head'], ['Bee & Bloom piksel fontu (özgün, Türkçe harflerle)', ''], ['', ''],
        ['Lisanslar', 'head'], ['Dışarıdan alınmış görsel, ses ya da yazı tipi yok;', ''], ['hepsi bu oyun için üretildi. (bkz. LISANSLAR.txt)', ''], ['', ''],
        ['Teşekkürler', 'head'], ['Birlikte oynayan iki kalbe.', ''], ['', ''], ['', ''],
        ['"Tanımak, aynı olmak değildir."', 'quote'], ['', ''], ['', ''],
        ['Bee & Bloom · designed by sadixck', 'big'],
      ];
      this.total = this.lines.length * 16 + H;
      if (Audio.current() !== 'final') Audio.play('final', { fade: 1 });
    },
    update(dt) {
      this.t += dt;
      const fast = Input.isDown('Space') || Input.isDown('ArrowDown');
      this.y -= dt * (fast ? 90 : 22);
      const done = this.y < -this.lines.length * 16 + H / 2 - 20;
      if (done) this.y = -this.lines.length * 16 + H / 2 - 20;
      if ((done && Input.confirm()) || Input.back()) { Audio.sfx('select'); Game().go(this.o.back === true ? BB.UI.Menu : F.EndMenu); }
    },
    draw(ctx) {
      drawBg(ctx, 'bahar', this.t * 12);
      ctx.globalAlpha = 0.2; Gfx.rect(ctx, 0, 0, W, H, '#2b1a10'); ctx.globalAlpha = 1;
      const g = Game();
      for (let i = 0; i < 2; i++) { const a = this.t * 0.9 + i * Math.PI; Gfx.spr(ctx, g.roles[i] + '_fly', Math.floor(this.t * 12) % 4, W / 2 - 8 + Math.cos(a) * 190, 130 + Math.sin(a * 2) * 50, Math.sin(a) > 0); }
      this.lines.forEach(([s, k], i) => {
        const y = Math.round(this.y + i * 16);
        if (y < -30 || y > H + 10) return;
        if (k === 'title') UI().drawLogo(ctx, W / 2, y - 12, 10, 3);
        else if (k === 'big') Gfx.text(ctx, s, W / 2, y, { color: 'honey', align: 'center', outline: 'shadow' });
        else if (k === 'head') Gfx.text(ctx, s, W / 2, y, { color: 'gold', align: 'center', outline: 'shadow' });
        else if (k === 'name') Gfx.text(ctx, s, W / 2, y, { color: 'pink', align: 'center', outline: 'shadow' });
        else if (k === 'quote') Gfx.text(ctx, s, W / 2, y, { color: 'cream', align: 'center', outline: 'shadow' });
        else Gfx.text(ctx, s, W / 2, y, { color: 'white', align: 'center', outline: 'shadow' });
      });
      if (this.y < -this.lines.length * 16 + H / 2 - 18 && Math.floor(this.t * 2) % 2) Gfx.text(ctx, 'Enter', W / 2, H - 16, { color: 'cream', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ son menü
  F.EndMenu = {
    enter() {
      this.sel = 3; this.t = 0;
      this.items = [
        { label: 'İkinci tur (cevaplar kilitli)', act: () => F.secondRound() },
        { label: 'Bölüm seçimi', act: () => Game().go(BB.UI.Levels) },
        { label: 'Anı Defteri', act: () => Game().go(F.Notebook, { back: F.EndMenu }) },
        { label: 'Ana menü', act: () => Game().go(BB.UI.Menu) },
      ];
    },
    update(dt) {
      this.t += dt;
      if (Input.up()) { this.sel = (this.sel + this.items.length - 1) % this.items.length; Audio.sfx('move'); }
      if (Input.downNav()) { this.sel = (this.sel + 1) % this.items.length; Audio.sfx('move'); }
      if (Input.confirm()) { Audio.sfx('select'); this.items[this.sel].act(); }
    },
    draw(ctx) {
      UI().drawMenuBg(ctx, 'bahar', 0.25);
      UI().drawLogo(ctx, W / 2, 26, 10, 3);
      Gfx.text(ctx, 'Teşekkürler! Hikâye tamamlandı.', W / 2, 84, { color: 'cream', align: 'center', outline: 'shadow' });
      this.items.forEach((it, i) => {
        const on = i === this.sel, y = 112 + i * 18;
        if (on) { const w = BB.Font.measure(it.label) + 20; Gfx.panel(ctx, W / 2 - w / 2, y - 2, w, 15, '#ffd23c', '#3b2516'); }
        Gfx.text(ctx, it.label, W / 2, y, { color: on ? 'ink' : 'cream', align: 'center', outline: on ? null : 'shadow' });
      });
    },
  };

  F.secondRound = function () {
    const d = save();
    if (d) { d.atEnd = false; d.round = (d.round || 1) + 1; d.rounds = (d.rounds || 0) + 1; d.current = { level: 0, checkpoint: null, taken: [], secret: false, deaths: 0, time: 0 }; BB.Save.flush(); }
    Game().round = d ? d.round : 2;
    Game().startLevel(0);
  };
})();
