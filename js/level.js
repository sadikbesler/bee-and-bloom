/* Bee & Bloom — bölüm dünyası: ayrıştırma, doğrulama, simülasyon adımı. Tarayıcıya bağımlı değildir. */
(function (root) {
  'use strict';
  const BB = root.BB;
  const TILE = BB.TILE, PHYS = BB.PHYS, T = BB.T, K = BB.KINDS;
  const ov = BB.overlap, approach = BB.approach, centerIn = BB.centerIn;

  const OBJ_CHARS = { '1': 1, '2': 1, 'C': 1, 'E': 1, 'o': 1, '*': 1, 'Q': 1, 'n': 1, 'F': 1, 'M': 1 };
  const UPDATE_ORDER = ['plate', 'flower', 'pot', 'sequence', 'race', 'bora', 'wind', 'gate', 'vine', 'platform', 'lily', 'pulse', 'bridge', 'crumble', 'bounce'];
  const LATE_ORDER = ['icicle', 'drip', 'spider', 'collapse', 'rune', 'trigger', 'mastery', 'sign', 'choice', 'npc', 'glow', 'fire', 'decor'];
  const LEASH_X = 380, LEASH_Y = 205;
  const LIGHT_R = 60;
  BB.LEASH = { x: LEASH_X, y: LEASH_Y };
  BB.LIGHT_R = LIGHT_R;

  // ------------------------------------------------------------ doğrulama
  BB.validateLevel = function (def) {
    const errors = [], warnings = [];
    const err = (m) => errors.push(`Bölüm ${def.id} (${def.name}): ${m}`);
    const warn = (m) => warnings.push(`Bölüm ${def.id} (${def.name}): ${m}`);
    if (!Array.isArray(def.map) || def.map.length < 17) { err('harita en az 17 satır olmalı'); return { errors, warnings }; }
    const W = def.map[0].length;
    if (W < 30) err('harita en az 30 sütun olmalı');
    const count = {};
    def.map.forEach((row, r) => {
      if (row.length !== W) err(`satır ${r} uzunluğu ${row.length}, ${W} olmalı`);
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (BB.TILE_CHARS[ch] === undefined && !OBJ_CHARS[ch]) err(`bilinmeyen karakter '${ch}' (${c},${r})`);
        count[ch] = (count[ch] || 0) + 1;
      }
    });
    if (count['1'] !== 1 || count['2'] !== 1) err('tam bir "1" ve bir "2" başlangıç noktası olmalı');
    if (count['E'] !== 1) err('tam bir "E" çıkış olmalı');
    const nq = count['Q'] || 0;
    if (!Array.isArray(def.questions) || def.questions.length !== nq) err(`Q sayısı (${nq}) ile questions listesi (${(def.questions || []).length}) uyuşmuyor`);
    if (BB.QUESTIONS.length && def.questions) for (const id of def.questions) if (!BB.QUESTIONS.find((q) => q.id === id)) err(`soru bulunamadı: ${id}`);
    const nc = count['C'] || 0;
    if (nc < 1) err('en az bir C (bal çiçeği) olmalı');
    else if (nc < 3 || nc > 6) warn(`bal çiçeği sayısı ${nc} (önerilen 3–6)`);
    // başlangıçlar zeminde mi
    for (const ch of ['1', '2', 'C', 'E']) def.map.forEach((row, r) => {
      const c = row.indexOf(ch);
      if (c < 0) return;
      const below = def.map[r + 1] ? def.map[r + 1][c] : '';
      if (!'#%=I'.includes(below)) err(`'${ch}' (${c},${r}) zemin üzerinde değil (altı '${below}')`);
    });
    def.map.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== 'C') continue;
        for (const dc of [-1, 1]) {
          const side = row[c + dc], under = def.map[r + 1] ? def.map[r + 1][c + dc] : '';
          if (side === undefined || '#%I'.includes(side)) warn(`bal çiçeği (${c},${r}) yanı dolu: ${dc < 0 ? 'sol' : 'sağ'}`);
          else if (!'#%=I'.includes(under)) warn(`bal çiçeği (${c},${r}) ${dc < 0 ? 'sol' : 'sağ'} yanında zemin yok`);
        }
      }
    });
    const sources = new Set(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
    const H = def.map.length;
    for (const o of def.objects || []) {
      if (!K[o.t]) { err(`bilinmeyen nesne türü '${o.t}'`); continue; }
      if (o.x !== undefined && (o.x < 0 || o.x >= W)) err(`${o.t} x=${o.x} harita dışında`);
      if (o.y !== undefined && (o.y < 0 || o.y >= H)) err(`${o.t} y=${o.y} harita dışında`);
      if (o.id && ['plate', 'flower', 'pot', 'sequence', 'race'].includes(o.t)) sources.add(o.id);
      if (o.t === 'bora') sources.add(o.flag || 'boraWarm');
      if (o.t === 'gate' && !o.on) err('kapının "on" alanı yok');
    }
    for (const f of def.flags || []) sources.add(f);
    const chk = (on, what) => { const list = typeof on === 'string' ? [on] : on || []; for (const id of list) if (!sources.has(id)) err(`${what}: kaynağı olmayan kanal '${id}'`); };
    for (const o of def.objects || []) {
      if (o.t === 'gate') chk(o.on, `kapı (${o.x},${o.y})`);
      if ((o.t === 'platform' || o.t === 'vine') && o.on) chk(o.on, `${o.t} (${o.x},${o.y})`);
    }
    if (!(def.objects || []).some((o) => o.coop) && !(def.coop && def.coop.length)) err('zorunlu iş birliği işaretlenmemiş (gate.coop ya da def.coop)');
    if (BB.SCENES && Object.keys(BB.SCENES).length) {
      const refs = [];
      if (def.scenes) for (const k in def.scenes) refs.push(def.scenes[k]);
      for (const o of def.objects || []) { if (o.scene) refs.push(o.scene); if (o.scenes) for (const k in o.scenes) refs.push(o.scenes[k]); }
      for (const id of refs) if (id && !BB.SCENES[id]) err(`sahne bulunamadı: ${id}`);
    }
    return { errors, warnings };
  };

  // ------------------------------------------------------------ dünya
  class World {
    constructor(def, opts) {
      opts = opts || {};
      const v = BB.validateLevel(def);
      if (v.errors.length) throw new Error(v.errors.join('\n'));
      this.def = def;
      this.roles = opts.roles || ['disi', 'erkek'];
      this.round = opts.round || 1;
      this.answered = new Set(opts.answered || []);
      this.events = [];
      this.time = 0; this.frame = 0;
      this.state = 'play'; this.stateT = 0;
      this.chan = Object.create(null); this.perm = Object.create(null); this.seen = Object.create(null);
      this.pending = null; this.openQ = null;
      this.stats = { deaths: 0, pollen: 0, pollenTotal: 0, secret: false, time: 0 };
      this.deathInfo = null; this.leashN = 0; this.exitT = 0; this.noLeash = !!opts.noLeash;
      this.cold = !!def.cold; this.dark = !!def.dark;
      this.solids = []; this.umbrellas = []; this.bodyList = [];
      this._parse(def);
      for (const f of def.startFlags || []) this.perm[f] = true;
      if (Array.isArray(opts.perm)) for (const f of opts.perm) if (typeof f === 'string') this.perm[f] = true;
      this.questions.forEach((q, i) => { if (this.answered.has(q.qid)) { this.perm['q' + (i + 1)] = true; q.done = true; } });
      this._computeChannels();
      for (const g of this.e.gate) K.gate.init(g, this);
      this._rebuildSolids();
      this.cp = this.startCp;
      if (opts.checkpoint !== undefined && opts.checkpoint !== null && opts.checkpoint >= 0 && this.checks[opts.checkpoint]) {
        const c = this.checks[opts.checkpoint];
        if (Array.isArray(opts.cps)) { for (const i of opts.cps) if (this.checks[i]) this.checks[i].on = true; c.on = true; }
        else for (const k of this.checks) if (k.x <= c.x) k.on = true;
        this.cp = c;
        if (Array.isArray(opts.seen)) { for (const t of this.e.trigger) if (opts.seen.includes(t.scene)) { t.done = true; this.seen[t.scene] = true; } }
        else for (const t of this.e.trigger) if (t.x + t.w < c.x) { t.done = true; this.seen[t.scene] = true; }
        this._placeAtCp(c);
      }
      if (opts.taken) for (const i of opts.taken) if (this.pollen[i]) { this.pollen[i].taken = true; this.stats.pollen++; }
      if (opts.secret && this.secrets[0]) { this.secrets[0].taken = true; this.stats.secret = true; }
      this.snap = this.snapshot();
    }

    _parse(def) {
      const rows = def.map;
      this.rows = rows.length; this.cols = rows[0].length;
      this.wpx = this.cols * TILE; this.hpx = this.rows * TILE;
      this.tiles = new Uint8Array(this.rows * this.cols);
      this.e = {};
      for (const k in K) this.e[k] = [];
      this.checks = []; this.pollen = []; this.secrets = []; this.questions = []; this.nectars = []; this.exit = null;
      const spawns = [];
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const ch = rows[r][c];
        const t = BB.TILE_CHARS[ch];
        this.tiles[r * this.cols + c] = t === undefined ? T.EMPTY : t;
        const X = c * TILE, Y = r * TILE;
        switch (ch) {
          case '1': spawns[0] = [c, r]; break;
          case '2': spawns[1] = [c, r]; break;
          case 'C': this.checks.push({ x: X, y: Y, c, r, on: false, bloom: 0 }); break;
          case 'E': this.exit = { x: X, y: Y, c, r, open: 0 }; break;
          case 'o': this.pollen.push({ x: X + 4, y: Y + 4, w: 8, h: 8, taken: false, ph: (c * 7 + r * 3) % 10 }); break;
          case '*': this.secrets.push({ x: X + 2, y: Y + 2, w: 12, h: 12, taken: false }); break;
          case 'Q': this.questions.push({ x: X, y: Y, c, r, done: false, qid: null }); break;
          case 'n': this.nectars.push({ x: X + 3, y: Y + 3, w: 10, h: 10, cd: 0 }); break;
          case 'F': this.e.fire.push(K.fire.make({ x: c, y: r })); break;
          case 'M': this.e.bounce.push(K.bounce.make({ x: c, y: r })); break;
        }
      }
      this.checks.sort((a, b) => a.x - b.x || a.y - b.y);
      this.questions.sort((a, b) => a.x - b.x || a.y - b.y);
      this.questions.forEach((q, i) => { q.qid = def.questions[i]; q.qi = i; q.zone = { x: q.x - 28, y: q.y - 40, w: 72, h: 56 }; });
      this.stats.pollenTotal = this.pollen.length;
      for (const o of def.objects || []) {
        const ent = K[o.t].make(o);
        ent.type = o.t;
        this.e[o.t].push(ent);
      }
      this.items = this.e.item;
      this.bees = [0, 1].map((i) => {
        const s = spawns[i];
        return new BB.Bee(i, this.roles[i], s[0] * TILE + 3, (s[1] + 1) * TILE - PHYS.bh);
      });
      this.startCp = { x: (spawns[0][0] + spawns[1][0]) / 2 * TILE, y: spawns[0][1] * TILE, start: true, spawns: spawns.map((s) => [s[0] * TILE + 3, (s[1] + 1) * TILE - PHYS.bh]) };
    }

    _rebuildSolids() {
      const s = [];
      for (const g of this.e.gate) s.push(g.solid);
      for (const v of this.e.vine) for (const l of v.leaves) s.push(l);
      for (const p of this.e.platform) s.push(p.solid);
      for (const l of this.e.lily) s.push(l.solid);
      for (const p of this.e.pulse) s.push(p.solid);
      for (const b of this.e.bridge) for (const g of b.segs) s.push(g);
      for (const c of this.e.crumble) for (const g of c.segs) s.push(g);
      for (const b of this.e.bounce) s.push(b.solid);
      this.solids = s;
    }

    emit(type, data) { const ev = data || {}; ev.type = type; this.events.push(ev); }
    partnerOf(b) { return this.bees[1 - b.id]; }

    active(on, any) {
      if (!on) return false;
      if (typeof on === 'string') return !!this.chan[on];
      return any ? on.some((i) => this.chan[i]) : on.every((i) => this.chan[i]);
    }

    _computeChannels() {
      this.chan = Object.create(null);
      for (const k in this.perm) this.chan[k] = true;
    }

    // ------------------------------------------------------------ ışık
    lights() {
      const out = [];
      for (const it of this.items) if (!it.used && it.kind === 'lantern') out.push({ x: it.x + 5, y: it.y + 5, r: LIGHT_R, lantern: true });
      return out;
    }
    litAt(x, y, lanternOnly) {
      for (const it of this.items) if (!it.used && it.kind === 'lantern' && Math.hypot(it.x + 5 - x, it.y + 5 - y) <= LIGHT_R) return true;
      if (!lanternOnly) for (const g of this.e.glow) if (Math.hypot(g.x - x, g.y - y) <= g.r) return true;
      return false;
    }

    // ------------------------------------------------------------ yardımcılar
    hurtBox(b) { return { x: b.x + 2, y: b.y + 3, w: b.w - 4, h: b.h - 5 }; }

    hazardTileUnder(e) {
      const c0 = Math.floor((e.x + 2) / TILE), c1 = Math.floor((e.x + e.w - 2) / TILE), r = Math.floor((e.y + e.h - 2) / TILE);
      for (let c = c0; c <= c1; c++) { const t = this.tileAt(c, r); if (t === T.WATER || t === T.THORN_UP) return true; }
      return false;
    }

    resetItem(it) {
      if (it.holder) { it.holder.item = null; it.holder = null; }
      it.x = it.homeX; it.y = it.homeY; it.vx = 0; it.vy = 0;
      this.emit('itemReset', { x: it.x + 5, y: it.y + 5, kind: it.kind });
    }

    moveSolid(s, dx, dy) {
      const riders = [];
      for (const b of this.bees) if (b.alive && !b.carriedBy && b.onGround && b.support === s) riders.push(b);
      for (const it of this.items) if (!it.used && !it.holder && it.onGround && it.support === s) riders.push(it);
      s.x += dx; s.y += dy;
      for (const b of riders) {
        if (dx) this.moveX(b, dx);
        if (dy) {
          this.moveY(b, dy);
          if (dy > 0 || Math.abs(b.y + b.h - s.y) < 0.6) { b.onGround = true; b.support = s; }
        }
        if (b.carrying) this.attachCarried(b);
      }
    }

    attachCarried(a) {
      const b = a.carrying;
      if (!b) return;
      b.x = a.x; b.y = a.y + PHYS.bh; b.vx = a.vx; b.vy = a.vy; b.facing = a.facing; b.onGround = a.onGround;
      b.px = b.x; b.py = b.y;
    }

    // ------------------------------------------------------------ eylemler
    doAction(b) {
      const o = this.partnerOf(b);
      if (b.carrying) { this.release(b, true); return; }
      if (o.alive && o.stuck && this.beesNear(b, o, 16)) { this.freeBee(o, b); return; }
      if (b.item) {
        if (this.dropItem(b)) return;
      }
      const fl = this.nearFlower(b);
      if (fl) { b.holdFlower = fl; this.emit('grab', { id: b.id, x: fl.x + 8, y: fl.y + 8 }); return; }
      const rn = this.nearRune(b);
      if (rn) { this.pressRune(rn, b); return; }
      const it = this.nearItem(b);
      if (it) { this.pickItem(b, it); return; }
      if (o.alive && !o.carrying && !o.carriedBy && !o.stuck && !b.item && this.beesNear(b, o, 13)) { if (this.pickBee(b, o)) return; }
      const npc = this.nearNpc(b);
      if (npc) { this.emit('talk', { id: b.id, who: npc.who, npc }); return; }
      b.callT = 1.1; b.emote = 'call'; b.emoteT = 1.1;
      this.emit('call', { id: b.id, x: b.x + b.w / 2, y: b.y });
    }

    beesNear(a, b, r) { return Math.abs(a.x - b.x) <= r && Math.abs(a.y - b.y) <= r; }
    nearFlower(b) {
      for (const f of this.e.flower) if (Math.abs(b.x + b.w / 2 - (f.x + 8)) < 14 && Math.abs(b.y + b.h - (f.y + 16)) < 10) return f;
      return null;
    }
    nearRune(b) {
      for (const r of this.e.rune) if (!r.lit && Math.abs(b.x + b.w / 2 - (r.x + 8)) < 13 && Math.abs(b.y + b.h - (r.y + 16)) < 12) return r;
      return null;
    }
    nearItem(b) {
      const box = { x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8 };
      for (const it of this.items) if (!it.used && !it.holder && ov(box, it)) return it;
      return null;
    }
    nearNpc(b) {
      for (const n of this.e.npc) if (!n.hidden && n.talk && Math.abs(b.x + b.w / 2 - n.x) < 22 && Math.abs(b.y + b.h - n.y) < 24) return n;
      return null;
    }

    pressRune(r, b) {
      const seq = this.e.sequence.find((s) => s.id === r.seq);
      r.lit = true; r.flash = 0.4;
      if (!seq || seq.solved) return;
      if (seq.order[seq.prog] === r.sym) {
        seq.prog++;
        this.emit('rune', { ok: true, x: r.x + 8, y: r.y + 8, n: seq.prog });
        if (seq.prog >= seq.order.length) { seq.solved = true; this.perm[seq.id] = true; this.emit('seqDone', { id: seq.id, x: r.x + 8, y: r.y }); }
      } else {
        seq.prog = 0;
        for (const o of this.e.rune) if (o.seq === r.seq) { o.lit = false; o.flash = 0.5; }
        this.emit('rune', { ok: false, x: r.x + 8, y: r.y + 8 });
      }
    }

    pickItem(b, it) {
      b.item = it; it.holder = b; it.onGround = false; it.support = null;
      this.emit('pickup', { id: b.id, kind: it.kind, x: it.x + 5, y: it.y + 5 });
    }
    dropItem(b) {
      const it = b.item;
      let nx = b.x + b.w / 2 - it.w / 2 + b.facing * 6, ny = b.y + b.h - it.h;
      if (this.blockedAt(it, nx, ny)) nx = b.x + b.w / 2 - it.w / 2;
      if (this.blockedAt(it, nx, ny)) return false;
      it.x = nx; it.y = ny; it.vx = b.vx * 0.5; it.vy = Math.min(0, b.vy) * 0.3;
      it.holder = null; b.item = null;
      this.emit('drop', { id: b.id, kind: it.kind, x: it.x + 5, y: it.y + 5 });
      return true;
    }

    pickBee(a, b) {
      let x = b.x, y = b.y - PHYS.bh;
      if (this.blockedAt(a, x, y, PHYS.bh * 2)) { y = b.y; if (this.blockedAt(a, x, y, PHYS.bh * 2)) return false; }
      a.x = x; a.y = y; a.h = PHYS.bh * 2; a.carrying = b; b.carriedBy = a;
      a.vx = (a.vx + b.vx) / 2; a.vy = Math.min(a.vy, b.vy, 0);
      b.holdFlower = null; a.holdFlower = null;
      this.attachCarried(a);
      this.emit('carry', { id: a.id, other: b.id, x: a.x + 5, y: a.y + 12 });
      return true;
    }

    release(a, byCarrier) {
      const b = a.carrying;
      if (!b) return;
      a.carrying = null; b.carriedBy = null; a.h = PHYS.bh;
      b.x = a.x; b.y = a.y + PHYS.bh; b.vx = a.vx; b.vy = a.vy;
      b.onGround = false; b.coyote = 0; b.jumping = false; b.support = null;
      let thrown = false;
      if (byCarrier) {
        const inp = a.inp || {};
        const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        if (inp.flap) { b.vy = -PHYS.throwVY; b.vx = a.vx * 0.5; thrown = true; }
        else if (dir) { b.vx = dir * PHYS.throwVX; b.vy = -PHYS.throwVY * 0.55; thrown = true; }
      }
      this.emit('release', { id: a.id, other: b.id, thrown, x: b.x + 5, y: b.y + 6 });
    }

    freeBee(b, helper) {
      b.stuck = null; b.strain = 0;
      const box = { x: b.x - 3, y: b.y - 3, w: b.w + 6, h: b.h + 6 };
      const c0 = Math.floor(box.x / TILE), c1 = Math.floor((box.x + box.w) / TILE), r0 = Math.floor(box.y / TILE), r1 = Math.floor((box.y + box.h) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.tileAt(c, r) === T.WEB) { this.tiles[r * this.cols + c] = T.EMPTY; this.emit('webBreak', { x: c * TILE + 8, y: r * TILE + 8 }); }
      b.webImmune = 0.35;
      if (helper) { helper.emote = 'heart'; helper.emoteT = 1; b.emote = 'heart'; b.emoteT = 1; }
      this.emit('free', { id: b.id, by: helper ? helper.id : -1, x: b.x + 5, y: b.y + 6 });
    }

    // ------------------------------------------------------------ rüzgâr
    windFor(b) {
      let x = 0, y = 0;
      b.shielded = false;
      if (b.item && b.item.kind === 'shield') return { x: 0, y: 0 };
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      for (const z of this.e.wind) {
        if (z.f === 0 || cx < z.x || cx > z.x + z.w || cy < z.y || cy > z.y + z.h) continue;
        if (this.inShadow(b, z)) { b.shielded = true; continue; }
        x += z.vx * z.f; y += z.vy * z.f;
      }
      return { x, y };
    }
    shadowOf(s, z) {
      // s: kalkan tutan arı; z: rüzgâr bölgesi → rüzgâr altındaki gölge dikdörtgeni
      if (Math.abs(z.vx) >= Math.abs(z.vy)) {
        const L = 110;
        return z.vx > 0 ? { x: s.x + s.w, y: s.y - 30, w: L, h: 30 + s.h + 14 } : { x: s.x - L, y: s.y - 30, w: L, h: 30 + s.h + 14 };
      }
      const L = 120;
      return z.vy < 0 ? { x: s.x - 20, y: s.y - L, w: s.w + 40, h: L } : { x: s.x - 20, y: s.y + s.h, w: s.w + 40, h: L };
    }
    inShadow(b, z) {
      for (const s of this.bees) {
        if (s === b || !s.alive || !s.item || s.item.kind !== 'shield') continue;
        const scx = s.x + s.w / 2, scy = s.y + s.h / 2;
        if (scx < z.x - 40 || scx > z.x + z.w + 40 || scy < z.y - 40 || scy > z.y + z.h + 40) continue;
        if (centerIn(b, this.shadowOf(s, z))) return true;
      }
      return false;
    }

    // ------------------------------------------------------------ arı güncellemesi
    updateBee(b, inp, dt) {
      b.inp = inp;
      b.animT += dt;
      if (b.landT > 0) b.landT -= dt;
      if (b.emoteT > 0) { b.emoteT -= dt; if (b.emoteT <= 0) b.emote = null; }
      if (b.callT > 0) b.callT -= dt;
      if (b.webImmune > 0) b.webImmune -= dt;
      if (!b.alive) return;
      if (b.carriedBy) {
        b.pointDir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        if (inp.actionPressed) this.release(b.carriedBy, false);
        return;
      }
      if (b.stuck) {
        b.vx = 0; b.vy = 0;
        if (inp.flapPressed || inp.actionPressed) { b.strain++; this.emit('strain', { id: b.id, x: b.x + 5, y: b.y + 6 }); }
        if (inp.actionPressed) { const o = this.partnerOf(b); if (o.alive && o.stuck && this.beesNear(b, o, 16)) this.freeBee(o, b); }
        if (b.strain >= 9) this.freeBee(b, null);
        return;
      }
      if (b.frozen) { b.vx = 0; inp = BB.NO_INPUT; }
      if (inp.actionPressed) this.doAction(b);
      if (b.holdFlower && !(inp.action && this.nearFlower(b) === b.holdFlower)) b.holdFlower = null;
      const rooted = !!b.holdFlower;
      const dir = rooted ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (dir) b.facing = dir;

      const wind = this.windFor(b);
      const m = b.mass;
      b.windX = wind.x / m; b.windY = wind.y / m;
      const it = b.item;
      const partner = this.partnerOf(b);
      const rider = partner.alive && !partner.carriedBy && partner.onGround && partner.support === b ? partner : null;
      const walkMul = it ? (it.kind === 'shield' ? 0.6 : it.kind === 'pollen' ? 0.8 : 1) : 1;
      const thrustMul = (it ? (it.kind === 'shield' ? 0 : it.kind === 'pollen' ? 0.55 : 0.92) : 1) * (b.carrying || rider ? PHYS.carryRise : 1);

      // yatay
      const ice = b.onGround && b.groundKind === 'ice';
      let maxV = (b.onGround ? PHYS.walk : PHYS.airMax) * walkMul;
      if (ice) maxV = PHYS.iceMax;
      const target = dir * maxV + b.windX;
      let acc;
      if (b.onGround) acc = ice ? (dir ? PHYS.iceAccel : PHYS.iceDecel) : (dir ? PHYS.gAccel : PHYS.gDecel);
      else acc = dir ? PHYS.aAccel : PHYS.aDecel;
      if (b.windX && !ice) acc = Math.max(acc, 500);
      b.vx = approach(b.vx, target, acc * dt);

      // zıplama (coyote + tampon)
      b.coyote = b.onGround ? PHYS.coyote : Math.max(0, b.coyote - dt);
      b.jumpBuf = inp.flapPressed ? PHYS.buffer : Math.max(0, b.jumpBuf - dt);
      let jumped = false;
      if (b.jumpBuf > 0 && b.coyote > 0 && !rooted) {
        b.vy = -PHYS.jumpV * (b.carrying ? PHYS.carryJump : 1) * (it && it.kind === 'pollen' ? 0.85 : 1);
        b.coyote = 0; b.jumpBuf = 0; b.onGround = false; b.jumping = true; b.bounced = false; jumped = true;
        this.emit('jump', { id: b.id, x: b.x + b.w / 2, y: b.y + b.h });
      }

      // dikey: kanat çırpma / süzülme / düşme
      b.flapping = false; b.gliding = false;
      if (b.onGround && !jumped) {
        b.vy = Math.max(b.vy, 0) + PHYS.gravity * dt;
        if (b.windY < -40) { b.onGround = false; b.vy = b.windY * 0.5; }
        const grounded = b.groundKind !== 'partner' || this.partnerOf(b).onGround;
        if (grounded) {
          b.energy = Math.min(1, b.energy + PHYS.refill * dt);
          if (b.carrying) b.carrying.energy = Math.min(1, b.carrying.energy + PHYS.refill * dt);
        }
      } else {
        const pool = b.energy + (b.carrying ? b.carrying.energy : 0);
        if (inp.flap && pool > 0 && thrustMul > 0) {
          const tgt = -PHYS.rise * thrustMul + b.windY;
          if (b.vy < tgt) b.vy = Math.min(tgt, b.vy + PHYS.gravity * dt);
          else {
            b.vy = Math.max(tgt, b.vy - PHYS.riseAccel * dt);
            const d = dt / PHYS.energyTime;
            if (b.energy > 0) b.energy = Math.max(0, b.energy - d);
            else if (b.carrying) b.carrying.energy = Math.max(0, b.carrying.energy - d);
            if (b.energy + (b.carrying ? b.carrying.energy : 0) <= 0) this.emit('tired', { id: b.id, x: b.x + 5, y: b.y });
          }
          b.flapping = true;
        } else if (inp.flap) {
          const tgt = PHYS.glideFall + b.windY;
          if (b.vy < tgt) b.vy = Math.min(tgt, b.vy + PHYS.gravity * dt);
          else b.vy = Math.max(tgt, b.vy - PHYS.glideBrake * dt);
          b.gliding = true;
        } else {
          const tgt = PHYS.fallMax + b.windY;
          const g = PHYS.gravity * (b.vy < 0 && b.jumping ? PHYS.cutMult : 1);
          if (b.vy < tgt) b.vy = Math.min(tgt, b.vy + g * dt);
          else b.vy = Math.max(tgt, b.vy - PHYS.glideBrake * dt);
        }
      }
      if (b.flapping) b.flapT += dt * 3; else if (b.gliding || !b.onGround) b.flapT += dt * 1.6; else b.flapT += dt * 0.6;

      // hareket
      const wasGround = b.onGround;
      const vyIn = b.vy;
      const x0 = b.x, y0 = b.y;
      b.onGround = false; b.support = null;
      this.moveX(b, b.vx * dt);
      if (b.hitX) b.vx = b.windX && Math.sign(b.windX) === b.hitX ? b.windX : 0;
      this.moveY(b, b.vy * dt);
      // başımızdaki ortak bizimle birlikte taşınır
      if (rider) {
        const dx = b.x - x0, dy = b.y - y0;
        if (dx) this.moveX(rider, dx);
        if (dy) {
          this.moveY(rider, dy);
          if (dy < 0 && b.y < rider.y + rider.h - 0.01) { b.y = rider.y + rider.h; if (b.vy < 0) b.vy = 0; }
          rider.onGround = true; rider.support = b; rider.groundKind = 'partner';
        }
        if (rider.carrying) this.attachCarried(rider);
      }
      if (b.onGround) {
        b.jumping = false;
        if (b.groundKind === 'bounce' && vyIn > 30) {
          const sup = b.support;
          b.vy = -(inp.flap ? PHYS.bounceHold : PHYS.bounceV) * (b.carrying ? 0.85 : 1);
          b.onGround = false; b.bounced = true;
          if (sup && sup.ref) sup.ref.squash = 1;
          this.emit('bounce', { id: b.id, x: b.x + b.w / 2, y: b.y + b.h });
        } else if (!wasGround && vyIn > 40) {
          b.landT = 0.12;
          this.emit('land', { id: b.id, x: b.x + b.w / 2, y: b.y + b.h, v: vyIn });
        }
      }
      if (b.carrying) this.attachCarried(b);
    }

    // ------------------------------------------------------------ bal ipi
    leash(dt) {
      const [a, b] = this.bees;
      this.leashN = 0;
      if (this.noLeash || !a.alive || !b.alive || a.carriedBy || b.carriedBy) return;
      const dx = (b.x + b.w / 2) - (a.x + a.w / 2), dy = (b.y + b.h / 2) - (a.y + a.h / 2);
      const n = Math.hypot(dx / LEASH_X, dy / LEASH_Y);
      this.leashN = n;
      if (n <= 0.88) return;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      // a'nın b'ye doğru yönü (ux,uy); b'nin a'ya doğru yönü (-ux,-uy)
      const awayA = -(a.vx * ux + a.vy * uy), awayB = (b.vx * ux + b.vy * uy);
      if (n > 1) {
        const excess = len - len / n;
        const lead = awayA > awayB ? a : b;
        const sgn = lead === a ? 1 : -1;
        this.moveX(lead, ux * sgn * excess);
        this.moveY(lead, uy * sgn * excess);
        if (lead.carrying) this.attachCarried(lead);
        const away = lead === a ? awayA : awayB;
        if (away > 0) { lead.vx += ux * sgn * away; lead.vy += uy * sgn * away; }
      }
      // geride kalan, hafifçe ve güvenli biçimde çekilir
      const pull = Math.min(24, (n - 0.88) * 260) * dt;
      for (const [p, sx, sy] of [[a, ux, uy], [b, -ux, -uy]]) {
        const inp = p.inp || {};
        if (inp.left || inp.right || p.stuck || p.holdFlower || p.frozen) continue;
        const mx = sx * pull;
        if (p.onGround) {
          const nx = p.x + mx;
          const probe = { x: nx, y: p.y, w: p.w, h: p.h, role: p.role, isBee: true };
          if (!this.probeGround(probe)) continue;
          if (this.hazardNear(probe)) continue;
          this.moveX(p, mx);
        } else {
          this.moveX(p, mx);
          this.moveY(p, sy * pull);
        }
        if (p.carrying) this.attachCarried(p);
      }
    }

    hazardNear(b) {
      const c0 = Math.floor((b.x - 2) / TILE), c1 = Math.floor((b.x + b.w + 2) / TILE), r0 = Math.floor(b.y / TILE), r1 = Math.floor((b.y + b.h + 4) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const t = this.tileAt(c, r);
        if (t === T.THORN_UP || t === T.THORN_DOWN || t === T.THORN_L || t === T.THORN_R || t === T.WATER || t === T.WEB) return true;
      }
      return false;
    }

    // ------------------------------------------------------------ tehlikeler
    tileHazards(b) {
      const h = this.hurtBox(b);
      const c0 = Math.floor(h.x / TILE), c1 = Math.floor((h.x + h.w) / TILE);
      const r0 = Math.floor(h.y / TILE), r1 = Math.floor((h.y + h.h) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const t = this.tileAt(c, r);
        if (!t) continue;
        const X = c * TILE, Y = r * TILE;
        let z = null, cause = null;
        switch (t) {
          case T.THORN_UP: z = { x: X + 2, y: Y + 9, w: 12, h: 7 }; cause = 'thorn'; break;
          case T.THORN_DOWN: z = { x: X + 2, y: Y, w: 12, h: 7 }; cause = 'thorn'; break;
          case T.THORN_L: z = { x: X + 8, y: Y + 2, w: 8, h: 12 }; cause = 'thorn'; break;
          case T.THORN_R: z = { x: X, y: Y + 2, w: 8, h: 12 }; cause = 'thorn'; break;
          case T.WATER: z = this.tileAt(c, r - 1) === T.WATER ? { x: X, y: Y, w: TILE, h: TILE } : { x: X, y: Y + 6, w: TILE, h: 10 }; cause = 'water'; break;
          case T.WEB:
            if (!b.webImmune && ov(h, { x: X + 2, y: Y + 2, w: 12, h: 12 })) {
              b.stuck = { c, r }; b.strain = 0; b.vx = 0; b.vy = 0; b.holdFlower = null;
              this.emit('stuck', { id: b.id, x: b.x + 5, y: b.y + 6 });
              return;
            }
            break;
        }
        if (z && ov(h, z)) { this.kill(b, cause); return; }
      }
    }

    kill(b, cause) {
      if (this.state !== 'play' || !b.alive) return;
      this.state = 'dying'; this.stateT = 0.8;
      this.stats.deaths++;
      this.deathInfo = { id: b.id, cause, x: b.x + b.w / 2, y: b.y + b.h / 2 };
      b.dead = true;
      if (b.carrying) b.carrying.dead = true;
      this.emit('death', { id: b.id, cause, x: b.x + b.w / 2, y: b.y + b.h / 2 });
    }

    // ------------------------------------------------------------ checkpoint
    snapshot() {
      const s = { tiles: this.tiles.slice(), ents: {}, items: this.items.map((it) => ({ x: it.x, y: it.y, used: it.used, held: !!it.holder })) };
      for (const kind in this.e) {
        const k = K[kind];
        if (!k || kind === 'item') continue;
        if (!k.snapFn && !(k.snap && k.snap.length)) continue;
        s.ents[kind] = this.e[kind].map((e) => (k.snapFn ? k.snapFn(e) : k.snap.map((f) => e[f])));
      }
      return s;
    }

    restore(s) {
      this.tiles.set(s.tiles);
      for (const kind in s.ents) {
        const k = K[kind];
        s.ents[kind].forEach((d, i) => {
          const e = this.e[kind][i];
          if (k.restoreFn) k.restoreFn(e, d); else k.snap.forEach((f, j) => { e[f] = d[j]; });
          if (k.restore) k.restore(e);
        });
      }
      this.items.forEach((it, i) => {
        const d = s.items[i];
        it.holder = null; it.vx = 0; it.vy = 0; it.used = d.used; it.onGround = false; it.support = null;
        if (d.held) { it.x = this.cp.x + 18; it.y = this.cp.y + 6; if (this.blockedAt(it, it.x, it.y)) { it.x = it.homeX; it.y = it.homeY; } }
        else { it.x = d.x; it.y = d.y; }
      });
      for (const b of this.bees) b.item = null;
    }

    _placeAtCp(cp) {
      const pos = cp.start ? cp.spawns : [[cp.x - 7, cp.y + TILE - PHYS.bh], [cp.x + 13, cp.y + TILE - PHYS.bh]];
      this.bees.forEach((b, i) => {
        b.h = PHYS.bh;
        // doğuş yeri doluysa en yakın boş yere kaydır
        let x = pos[i][0];
        const y = pos[i][1];
        if (this.blockedAt(b, x, y)) {
          for (const d of [3, -3, 6, -6, 9, -9, 12, -12, 16, -16, 20, -20, 24, -24]) if (!this.blockedAt(b, x + d, y)) { x += d; break; }
        }
        b.x = x; b.y = y; b.px = b.x; b.py = b.y;
        b.vx = 0; b.vy = 0; b.h = PHYS.bh; b.alive = true; b.dead = false;
        b.carrying = null; b.carriedBy = null; b.item = null; b.stuck = null; b.holdFlower = null; b.frozen = false;
        b.energy = 1; b.heat = 1; b.onGround = true; b.support = null; b.coyote = 0; b.jumpBuf = 0; b.jumping = false;
        b.emote = null; b.emoteT = 0; b.webImmune = 0;
      });
    }

    activateCheck(c) {
      if (this.cp === c) return;
      const first = !c.on;
      c.on = true;
      this.cp = c;
      this.snap = this.snapshot();
      this.emit('checkpoint', { x: c.x + 8, y: c.y + 8, first, index: this.checks.indexOf(c) });
    }

    respawn() {
      const cp = this.cp;
      this.restore(this.snap);
      for (const kind in this.e) { const k = K[kind]; if (k && k.onRespawn) for (const e of this.e[kind]) k.onRespawn(e, this, cp); }
      this._placeAtCp(cp);
      this.openQ = null;
      for (const r of this.e.race) if (r.st !== 'won') { r.st = 'idle'; }
      this.state = 'respawn'; this.stateT = 0.45;
      this.emit('respawn', { x: cp.x + 8, y: cp.y + 8 });
    }

    // ------------------------------------------------------------ sorular ve sahneler
    startOpen(qi) { this.openQ = { qi, pick: [-1, -1], t: [0, 0] }; this.emit('openStart', { qi }); }
    resolveQuestion(qi) {
      const q = this.questions[qi];
      if (!q) return;
      q.done = true;
      this.perm['q' + (qi + 1)] = true;
      this.answered.add(q.qid);
      if (this.openQ && this.openQ.qi === qi) this.openQ = null;
      this.emit('qDone', { qi, x: q.x + 8, y: q.y });
    }
    resolvePending() {
      const p = this.pending;
      if (!p) return;
      this.pending = null;
      if (p.type === 'scene') {
        const sc = BB.SCENES[p.id];
        if (sc) for (const st of sc.steps || sc) if (st && st.fx) this.applyFx(st);
        if (p.fx) for (const f of p.fx) this.applyFx(f);
      }
    }
    applyFx(f) {
      switch (f.fx) {
        case 'flag': this.perm[f.name] = true; this.chan[f.name] = true; break;
        case 'hide': for (const n of this.e.npc.concat(this.e.decor)) if (n.id === f.id) n.hidden = true; break;
        case 'show': for (const n of this.e.npc.concat(this.e.decor)) if (n.id === f.id) n.hidden = false; break;
        case 'raceGo': case 'raceReset': {
          const r = this.e.race.find((x) => x.id === (f.id || 'race'));
          if (!r) break;
          r.st = 'count'; r.t = 2.4; r.seg = 0; r.fx = r.path[0][0]; r.fy = r.path[0][1];
          const sx = r.spawn ? r.spawn[0] : r.start.x + r.start.w / 2, sy = r.spawn ? r.spawn[1] : r.start.y + r.start.h - PHYS.bh;
          this.bees.forEach((b, i) => {
            if (b.carrying) this.release(b, false);
            if (b.item) { b.item.holder = null; b.item = null; }
            b.x = sx + (i ? 6 : -10); b.y = sy; b.vx = 0; b.vy = 0; b.stuck = null; b.holdFlower = null;
          });
          this.emit('raceCount', {});
          break;
        }
        case 'warp':
          this.bees.forEach((b, i) => { b.x = f.x * TILE + (i ? 10 : -4); b.y = (f.y + 1) * TILE - PHYS.bh; b.vx = b.vy = 0; });
          break;
      }
    }

    // ------------------------------------------------------------ ana adım
    step(inputs) {
      if (this.pending) return;
      const dt = BB.DT;
      this.frame++;
      if (this.state === 'dying') {
        this.stateT -= dt;
        if (this.stateT <= 0) this.respawn();
        return;
      }
      if (this.state === 'respawn') {
        this.stateT -= dt;
        for (const b of this.bees) { b.animT += dt; b.flapT += dt; }
        if (this.stateT <= 0) this.state = 'play';
        return;
      }
      if (this.state === 'won') { this.stateT += dt; for (const b of this.bees) { b.animT += dt; b.flapT += dt * 2; } return; }
      this.time += dt;
      this.stats.time += dt;
      for (const b of this.bees) { b.px = b.x; b.py = b.y; }

      this.bodyList.length = 0;
      for (const b of this.bees) if (b.alive && !b.carriedBy) this.bodyList.push(b);
      for (const it of this.items) if (!it.used && !it.holder) this.bodyList.push(it);

      this._computeChannels();
      for (const q of this.questions) if (q.done) this.chan['q' + (q.qi + 1)] = true;
      for (const kind of UPDATE_ORDER) { const k = K[kind]; for (const e of this.e[kind]) k.update(e, this, dt); }
      this.umbrellas.length = 0;
      for (const b of this.bees) if (b.alive && b.item && b.item.kind === 'shield') this.umbrellas.push({ x: b.x - 6, y: b.y - 12, w: b.w + 12, h: 8 });
      for (const it of this.items) K.item.update(it, this, dt);

      for (let i = 0; i < 2; i++) this.updateBee(this.bees[i], inputs[i] || BB.NO_INPUT, dt);
      this.leash(dt);
      for (const it of this.items) if (it.holder) K.item.update(it, this, dt);

      for (const kind of LATE_ORDER) { const k = K[kind]; for (const e of this.e[kind]) k.update(e, this, dt); }
      if (this.state !== 'play') return;
      this._interactions(dt);
    }

    _interactions(dt) {
      const [a, b] = this.bees;
      // karo tehlikeleri, düşme
      for (const p of this.bees) {
        if (!p.alive || p.carriedBy) continue;
        if (!p.stuck) this.tileHazards(p);   // taşıyanın kutusu (24 px) taşınanı da kapsar
        if (this.state !== 'play') return;
        if (p.y > this.hpx + 24) { this.kill(p, 'fall'); return; }
      }
      // ikisi de ağa takıldıysa
      if (a.stuck && b.stuck) {
        this.bothStuckT = (this.bothStuckT || 0) + dt;
        if (this.bothStuckT > 1.2) { this.bothStuckT = 0; this.kill(a, 'web'); return; }
      } else this.bothStuckT = 0;
      // soğuk
      if (this.cold) {
        const close = Math.hypot((a.x - b.x), (a.y - b.y)) < 26 || a.carrying || b.carrying;
        for (const p of this.bees) {
          if (!p.alive) continue;
          let rate = -1 / 18;
          for (const z of this.e.wind) if (z.cold && z.f > 0.5 && centerIn(p, z) && !p.shielded) rate *= 2.6;
          if (close) rate = 0.4;
          for (const f of this.e.fire) if (Math.hypot(p.x + p.w / 2 - f.x, p.y + p.h / 2 - f.y) < f.r) rate = 1.3;
          p.heat = BB.clamp(p.heat + rate * dt, 0, 1);
          if (p.heat <= 0) { this.kill(p, 'cold'); return; }
        }
      }
      // toplanabilirler ve bölgeler
      for (const p of this.bees) {
        if (!p.alive) continue;
        const box = p;
        for (const n of this.nectars) {
          if (n.cd > 0) continue;
          if (ov(box, n)) { if (p.energy < 0.999 || (p.carrying && p.carrying.energy < 0.999)) this.emit('nectar', { x: n.x + 5, y: n.y + 5, id: p.id }); p.energy = 1; if (p.carrying) p.carrying.energy = 1; n.cd = 0.4; }
        }
        for (const pl of this.pollen) if (!pl.taken && ov(box, pl)) { pl.taken = true; this.stats.pollen++; this.emit('pollen', { x: pl.x + 4, y: pl.y + 4, id: p.id, n: this.stats.pollen }); }
        for (const s of this.secrets) if (!s.taken && ov(box, s)) { s.taken = true; this.stats.secret = true; this.emit('secret', { x: s.x + 6, y: s.y + 6, id: p.id }); }
        for (const c of this.checks) if (ov(box, { x: c.x + 1, y: c.y - 6, w: 14, h: 22 })) this.activateCheck(c);
      }
      for (const n of this.nectars) if (n.cd > 0) n.cd -= dt;
      // sorular
      if (!this.pending && !this.openQ) {
        for (const q of this.questions) {
          if (q.done) continue;
          if (a.alive && b.alive && centerIn(a, q.zone) && centerIn(b, q.zone)) {
            if (this.answered.has(q.qid)) { this.resolveQuestion(q.qi); this.emit('qAlready', { qi: q.qi, qid: q.qid, x: q.x + 8, y: q.y }); }
            else { this.pending = { type: 'question', qi: q.qi, qid: q.qid }; this.emit('qStart', { qi: q.qi, qid: q.qid }); }
            break;
          }
        }
      }
      // açık soru: çiçeklere girerek seçim
      if (this.openQ && !this.pending) {
        const oq = this.openQ;
        const cur = [-1, -1];
        for (const ch of this.e.choice) {
          if (ch.q !== oq.qi + 1) continue;
          for (const p of this.bees) if (p.alive && centerIn(p, { x: ch.x - 2, y: ch.y - 4, w: 20, h: 36 })) cur[p.id] = ch.opt;
        }
        for (let i = 0; i < 2; i++) {
          if (cur[i] >= 0 && cur[i] === oq.pick[i]) oq.t[i] += dt;
          else if (cur[i] >= 0) { oq.pick[i] = cur[i]; oq.t[i] = 0; this.emit('openPick', { id: i, opt: cur[i] }); }
          else oq.t[i] = Math.max(0, oq.t[i] - dt);
        }
        if (oq.t[0] >= 0.5 && oq.t[1] >= 0.5 && cur[0] >= 0 && cur[1] >= 0) {
          this.pending = { type: 'openAnswer', qi: oq.qi, qid: this.questions[oq.qi].qid, picks: [oq.pick[0], oq.pick[1]] };
          this.emit('openDone', { qi: oq.qi, picks: this.pending.picks });
        }
      }
      // çıkış
      const ex = this.exit;
      const ez = { x: ex.x + 2, y: ex.y - 14, w: 28, h: 30 };
      if (a.alive && b.alive && centerIn(a, ez) && centerIn(b, ez) && !this.pending) {
        this.exitT += dt;
        ex.open = Math.min(1, ex.open + dt * 4);
        if (this.exitT > 0.35) { this.state = 'won'; this.stateT = 0; this.emit('won', {}); }
      } else { this.exitT = 0; ex.open = Math.max(0, ex.open - dt * 3); }
    }
  }
  Object.assign(World.prototype, BB.Collide);

  BB.NO_INPUT = Object.freeze({ left: false, right: false, flap: false, flapPressed: false, action: false, actionPressed: false });
  BB.World = World;
})(typeof window !== 'undefined' ? window : globalThis);
