// Çözüm betiği koşucusu: gerçek dünya simülasyonunu iki "bot" oyuncuyla oynatır.
// Görevler (task) üreteç fonksiyonlarıdır; her kare bir 'yield' ile ilerler ve paralel çalışabilir.
const { loadBB, mkIn } = require('./sim.js');

const BIT = { left: 1, right: 2, flap: 4, flapPressed: 8, action: 16, actionPressed: 32 };
const pack = (i) => (i.left ? 1 : 0) | (i.right ? 2 : 0) | (i.flap ? 4 : 0) | (i.flapPressed ? 8 : 0) | (i.action ? 16 : 0) | (i.actionPressed ? 32 : 0);
const unpack = (n) => ({ left: !!(n & 1), right: !!(n & 2), flap: !!(n & 4), flapPressed: !!(n & 8), action: !!(n & 16), actionPressed: !!(n & 32) });

class Run {
  constructor(levelId, opts) {
    opts = opts || {};
    this.BB = opts.BB || loadBB();
    const BB = this.BB;
    this.def = opts.def || BB.LEVELS.find((l) => l.id === levelId);
    if (!this.def) throw new Error('bölüm yok: ' + levelId);
    this.roles = opts.roles || ['disi', 'erkek'];
    this.names = opts.names || ['Ayşe', 'Mert'];
    this.answers = opts.answers || {};
    this.w = new BB.World(this.def, { roles: this.roles, answered: Object.keys(this.answers), noLeash: !!opts.noLeash, checkpoint: opts.checkpoint, round: opts.round || 1 });
    this.T = BB.TILE;
    this.f = 0;
    this.inp = [mkIn(), mkIn()];
    this.rec = [];
    this.allowDeath = !!opts.allowDeath;
    this.log = [];
    this.events = { checkpoint: 0, pollen: 0, secret: 0, qDone: 0, death: 0 };
    this.pickFn = opts.pick || ((q, n) => [n % Q_OPTS(q), (n + (q.type === 'K' ? 0 : 1)) % Q_OPTS(q)]);
    this.qCount = 0;
    this.maxFrames = opts.maxFrames || 60 * 60 * 15;
  }
  bee(i) { return this.w.bees[i]; }
  gate(on) { const key = JSON.stringify(on); const g = this.w.e.gate.find((x) => JSON.stringify(x.on) === key); if (!g) this.fail('kapı yok: ' + key); return g; }
  *gateOpen(on, max) { const g = this.gate(on); yield* this.until(() => g.open > 0.9, max || 300, 'kapı açılması ' + JSON.stringify(on)); }
  cx(i) { const b = this.bee(i); return b.x + b.w / 2; }
  cy(i) { const b = this.bee(i); return b.y + b.h / 2; }
  tx(c) { return c * this.T + 8; }
  ty(r) { return r * this.T + 8; }
  fail(msg) {
    const [a, b] = this.w.bees;
    throw new Error(`[Bölüm ${this.def.id} kare ${this.f}] ${msg}\n  durum=${this.w.state} arı0=(${a.x.toFixed(0)},${a.y.toFixed(0)} e${a.energy.toFixed(2)}) arı1=(${b.x.toFixed(0)},${b.y.toFixed(0)} e${b.energy.toFixed(2)}) ölüm=${JSON.stringify(this.w.deathInfo)}`);
  }

  // tek kare: bekleyen sahne/soruyu otomatik çöz, adımla, kaydet
  step() {
    const w = this.w, BB = this.BB;
    if (w.pending) this.autoResolve();
    const ins = this.inp.map((x) => Object.assign({}, x));
    w.step(ins);
    this.rec.push([pack(ins[0]), pack(ins[1])]);
    this.f++;
    for (const x of this.inp) { x.flapPressed = false; x.actionPressed = false; }
    for (const ev of w.events) {
      if (this.events[ev.type] !== undefined) this.events[ev.type]++;
      if (ev.type === 'death') {
        this.log.push(`kare ${this.f}: ölüm (${ev.cause}) arı${ev.id} @${Math.round(ev.x)},${Math.round(ev.y)}`);
        if (!this.allowDeath) { w.events.length = 0; this.fail('oyuncu öldü: ' + ev.cause); }
      }
    }
    w.events.length = 0;
    if (this.f > this.maxFrames) this.fail('kare sınırı aşıldı');
    void BB;
  }

  autoResolve() {
    const w = this.w, BB = this.BB, p = w.pending;
    if (p.type === 'scene') { w.resolvePending(); return; }
    if (p.type === 'question') {
      const q = BB.Q.get(p.qid);
      if (q.type === 'A') { w.resolvePending(); w.startOpen(p.qi); this.openQi = p.qi; return; }
      const [a, b] = this.pickFn(q, this.qCount++);
      this.answers[q.id] = { a, b, type: q.type };
      w.resolvePending(); w.resolveQuestion(p.qi);
      return;
    }
    if (p.type === 'openAnswer') {
      this.answers[p.qid] = { a: p.picks[0], b: p.picks[1], type: 'A' };
      w.resolvePending(); w.resolveQuestion(p.qi); this.openQi = null;
      return;
    }
    w.resolvePending();
  }

  // paralel görevleri çalıştır
  run(...tasks) {
    const live = tasks.filter(Boolean).map((t) => ({ it: t, done: false }));
    let guard = 0;
    while (live.some((t) => !t.done)) {
      if (this.w.state === 'won') break;
      for (const t of live) if (!t.done) { const r = t.it.next(); if (r.done) t.done = true; }
      if (live.every((t) => t.done)) break;
      this.step();
      if (++guard > 60 * 120) this.fail('görev zaman aşımı');
    }
  }
  seq(...tasks) { for (const t of tasks) this.run(t); }

  // ------------------------------------------------------------ görevler
  *wait(n) { for (let k = 0; k < n; k++) yield; }
  *until(cond, max, label) { let n = 0; while (!cond()) { if (++n > (max || 1200)) this.fail('zaman aşımı: ' + (label || 'koşul')); yield; } }
  *release(i) { Object.assign(this.inp[i], { left: false, right: false, flap: false, action: false }); yield; }
  *act(i) { this.inp[i].actionPressed = true; this.inp[i].action = true; yield; this.inp[i].action = false; }
  *holdAction(i, frames) { this.inp[i].action = true; this.inp[i].actionPressed = true; for (let k = 0; k < frames; k++) yield; this.inp[i].action = false; }
  // eylemi bir koşul sağlanana kadar basılı tut
  *holdWhile(i, cond, max) { this.inp[i].action = true; this.inp[i].actionPressed = true; let n = 0; while (cond()) { if (++n > (max || 3000)) this.fail('holdWhile zaman aşımı'); yield; } this.inp[i].action = false; }

  // yerde yürü (x: merkez px). Önünde duvar varsa küçük zıplama yapar.
  *walkTo(i, x, o) {
    o = o || {};
    const tol = o.tol || 3, b = this.bee(i);
    let n = 0, hop = 0;
    while (Math.abs(this.cx(i) - x) > tol) {
      const d = x - this.cx(i);
      const inp = this.inp[i];
      inp.left = d < 0; inp.right = d > 0;
      if (Math.abs(d) < 6 && Math.abs(b.vx) > 40) { inp.left = inp.right = false; }
      if (o.hop !== false && b.onGround && b.hitX && hop <= 0) { inp.flap = true; inp.flapPressed = true; hop = 16; }
      if (hop > 0 && --hop === 0) inp.flap = false;
      if (++n > (o.max || 1500)) { if (o.noFail) break; this.fail(`walkTo zaman aşımı arı${i} hedef x=${x}`); }
      yield;
    }
    this.inp[i].left = this.inp[i].right = false; this.inp[i].flap = false;
    for (let k = 0; k < (o.settle === undefined ? 4 : o.settle); k++) yield;
  }

  // uç: hedef (x,y) merkez noktası. land: varınca yere kon (tek yönlü platforma üstten yaklaşır).
  // Dikey denetim: istenen yüksekliğin altındaysa kanat çırp, üstündeyse bırak; enerji bitince uzaksa süzül.
  *flyTo(i, x, y, o) {
    o = o || {};
    const tol = o.tol || (o.land ? 4 : 8), tolY = o.tolY || (o.land ? 6 : 10), b = this.bee(i);
    let n = 0;
    let over = !!o.land;
    for (;;) {
      const cx = this.cx(i), cy = this.cy(i);
      const dx = x - cx;
      if (over && cy < y - 10) over = false;
      const near = Math.abs(dx) <= tol && Math.abs(y - cy) <= tolY;
      if (near && (!o.land || b.onGround)) break;
      const inp = this.inp[i];
      // yatay: hedefe doğru, yaklaşınca fren
      const brake = Math.abs(dx) < 8 + Math.abs(b.vx) * 0.12;
      inp.left = dx < -tol && !(brake && b.vx < -30); inp.right = dx > tol && !(brake && b.vx > 30);
      if (Math.abs(dx) <= tol) inp.left = inp.right = false;
      // hedef epey aşağıdaysa ve yerdeysek kenardan yürüyüp in
      if (b.onGround && y - cy > 20 && Math.abs(dx) <= tol + 14) { const d = dx !== 0 ? Math.sign(dx) : (b.facing || 1); inp.left = d < 0; inp.right = d > 0; }
      // dikey
      // hedef aşağıdaysa süzülme hattında kal (en fazla biraz yükselerek), yukarıdaysa doğrudan çık
      let desired = y;
      if (y > cy + 4) {
        const glide = y - Math.max(0, Math.abs(dx) - tol) * (o.slope || 0.72);
        desired = Math.max(Math.min(y, glide), cy - 20);
      }
      if (over && Math.abs(dx) < 48) desired = Math.min(desired, y - 16);
      if (o.cruise !== undefined && Math.abs(dx) > 24) desired = Math.min(desired, o.cruise);
      // önünde duvar varsa (yerde ya da havada) duvar boyunca tırman
      const dir = Math.sign(dx);
      if (Math.abs(dx) > tol && dir && (b.hitX === dir || this.w.blockedAt(b, b.x + dir * 3, b.y))) desired = Math.min(desired, cy - 40);
      const err = cy - desired;   // >0: hedefin altındayız (çıkmak gerek)
      inp.flapPressed = false;
      // yerdeyken hedef uzaksa ve önü güvenliyse önce yürü
      const launch = o.launch !== undefined ? o.launch : Math.max(20, Math.min(90, (cy - y) * 0.6 + 20));
      const walkFirst = b.onGround && Math.abs(dx) > launch && this.safeAhead(i, Math.sign(dx)) && !o.noWalk;
      if (walkFirst) inp.flap = false;
      else if (b.onGround) {
        const ready = b.energy + (b.carrying ? b.carrying.energy : 0) >= (b.carrying ? 1.9 : 0.95);
        if (err > tolY * 0.5 && ready) { inp.flap = true; inp.flapPressed = true; } else inp.flap = false;
      } else if (err > 2) inp.flap = true;
      else if (err < -3) inp.flap = b.energy + (b.carrying ? b.carrying.energy : 0) <= 0 && Math.abs(dx) > -err * 1.1;
      else inp.flap = b.energy <= 0 ? Math.abs(dx) > tol : b.vy > 15;
      if (o.land && near && !over) { inp.flap = false; inp.left = inp.right = false; }
      if (++n > (o.max || 900)) this.fail(`flyTo zaman aşımı arı${i} hedef (${Math.round(x)},${Math.round(y)})`);
      yield;
    }
    this.inp[i].left = this.inp[i].right = false;
    if (!o.keepFlap) this.inp[i].flap = false;
    for (let k = 0; k < (o.settle === undefined ? 2 : o.settle); k++) yield;
    if (o.land) { let k = 0; while (b.energy < 0.99 && k++ < 40) yield; }
  }

  // yürürken önü güvenli mi: zemin var, tehlike yok, duvar yok
  safeAhead(i, dir) {
    const b = this.bee(i), w = this.w, BB = this.BB, T = this.T;
    if (!dir) return false;
    if (b.hitX === dir) return false;
    const fx = dir > 0 ? b.x + b.w + 3 : b.x - 3;
    const probe = { x: dir > 0 ? b.x + 6 : b.x - 6, y: b.y, w: b.w, h: b.h, role: b.role, isBee: true };
    if (!w.probeGround(probe)) return false;
    const c = Math.floor(fx / T);
    const bad = [BB.T.THORN_UP, BB.T.THORN_DOWN, BB.T.THORN_L, BB.T.THORN_R, BB.T.WATER, BB.T.WEB];
    for (const r of [Math.floor((b.y + 2) / T), Math.floor((b.y + b.h - 2) / T), Math.floor((b.y + b.h + 2) / T)]) if (bad.includes(w.tileAt(c, r))) return false;
    if (w.blockedAt(b, b.x + dir * 4, b.y)) return false;
    return true;
  }

  // yol noktaları: [x, y, {land}] — karo cinsinden de verilebilir: path(i, [[c, r]], {tiles:true})
  *path(i, pts, o) {
    o = o || {};
    for (const p of pts) {
      const x = o.tiles ? this.tx(p[0]) : p[0], y = o.tiles ? this.ty(p[1]) : p[1];
      const po = Object.assign({}, o, p[2] || {});
      if (po.walk) yield* this.walkTo(i, x, po);
      else yield* this.flyTo(i, x, y, po);
    }
  }

  // karo hedefine yürü/uç kısayolları
  *walkT(i, c, o) { yield* this.walkTo(i, this.tx(c), o); }
  *flyT(i, c, r, o) { yield* this.flyTo(i, this.tx(c), this.ty(r) + 2, o); }
  *landT(i, c, r, o) { yield* this.flyTo(i, this.tx(c), r * this.T + 16 - 6, Object.assign({ land: true }, o)); }

  // taşı: i, ortağını alır (yakında olmalı)
  *pickUp(i) {
    const o = 1 - i;
    yield* this.until(() => Math.abs(this.bee(i).x - this.bee(o).x) <= 12 && Math.abs(this.bee(i).y - this.bee(o).y) <= 12, 300, 'taşıma için yakınlık');
    yield* this.act(i);
    if (!this.bee(i).carrying) this.fail(`arı${i} ortağını alamadı`);
  }
  *drop(i) { yield* this.act(i); if (this.bee(i).carrying) this.fail(`arı${i} bırakamadı`); }

  // açık soru: iki arıyı seçenek çiçeklerine uçur
  *pickFlowers(a, b) {
    const qi = this.openQi;
    if (qi === null || qi === undefined) this.fail('açık soru başlamadı');
    const ch = (opt) => this.w.e.choice.find((c) => c.q === qi + 1 && c.opt === opt);
    const ca = ch(a), cb = ch(b);
    if (!ca || !cb) this.fail('seçenek çiçeği yok');
    this.run(this.flyTo(0, ca.x + 8, ca.y + 14, { tolY: 8, hover: true, keepFlap: false }), this.flyTo(1, cb.x + 8, cb.y + 14, { tolY: 8, hover: true }));
    yield* this.until(() => this.openQi === null, 240, 'açık soru cevabı');
  }

  expectWin() {
    this.run(this.until(() => this.w.state === 'won', 600, 'bölüm sonu'));
  }
  summary() {
    const w = this.w;
    return { frames: this.f, sec: +(this.f / 60).toFixed(1), checks: w.checks.filter((c) => c.on).length + '/' + w.checks.length, pollen: w.stats.pollen + '/' + w.stats.pollenTotal, secret: w.stats.secret, answered: Object.keys(this.answers).length, deaths: w.stats.deaths };
  }
}

function Q_OPTS(q) { return q.type === 'K' ? 2 : 4; }

module.exports = { Run, pack, unpack, BIT };
