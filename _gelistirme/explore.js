// Erişilebilirlik tarayıcısı: TEK bir arının gerçek fizikle (yürüme + uçuş makroları) nerelere ulaşabildiğini tarar.
// Kullanım:
//   node _gelistirme/explore.js <bölüm> [--kapilar=acik|kapali] [--omuz] [--ari=0|1]
//   --kapilar=acik : bütün kapılar açık (bulmacalar çözülmüş gibi) → tüm hedefler erişilebilir mi?
//   --kapilar=kapali: iş birliği kapıları (coop) kapalı, diğerleri açık → tek arı çıkışa ULAŞAMAMALI.
//   --omuz : ortağın başından kalkış (iki arının yükseklik birleşimi) hareketini de dene.
const { loadBB } = require('./sim.js');

const NO = { left: false, right: false, flap: false, flapPressed: false, action: false, actionPressed: false };

function sandbox(BB, def, o) {
  const w = new BB.World(def, { noLeash: true, roles: [o.role || 'disi', o.role === 'erkek' ? 'disi' : 'erkek'] });
  const me = w.bees[o.bee || 0], other = w.bees[1 - (o.bee || 0)];
  other.alive = false; other.x = -1000; other.y = -1000;
  for (const g of w.e.gate) {
    const open = o.gates === 'acik' ? true : !g.coop;
    g.open = open ? 1 : 0; BB.KINDS.gate.shape(g);
  }
  // iş birliği gerektiren dinamikler: tek arı için güvenli varsayımlar
  for (const l of w.e.lily) if (l.mode === 'pair') l.solid.active = o.gates === 'acik';
  for (const b of w.e.bridge) for (const s of b.segs) s.active = o.gates === 'acik';
  for (const p of w.e.pulse) p.solid.active = true;
  w.e.vine.forEach((v) => { if (o.gates === 'acik') { v.grow = 1; for (const s of v.leaves) s.active = true; } });
  w.e.platform.forEach((p) => {
    if (o.gates === 'acik' && p.on) { /* açık modda hem A hem B konumu denenir: B'ye ikinci bir katı ekle */ w.solids.push({ x: p.bx, y: p.by, w: p.w, h: 6, oneWay: true, kind: 'platform', active: true }); }
  });
  for (const c of w.e.crumble) for (const s of c.segs) s.active = true;
  w.state = 'play';
  return { w, me };
}

const FIELDS = ['x', 'y', 'vx', 'vy', 'onGround', 'groundKind', 'support', 'energy', 'coyote', 'jumpBuf', 'jumping', 'facing', 'flapT', 'animT', 'bounced'];
const snap = (b) => { const s = {}; for (const f of FIELDS) s[f] = b[f]; return s; };
const restore = (b, s) => { for (const f of FIELDS) b[f] = s[f]; b.alive = true; b.stuck = null; b.dead = false; b.h = 12; b.carrying = null; b.carriedBy = null; b.item = null; b.holdFlower = null; b.heat = 1; };

function explore(BB, def, o) {
  o = o || {};
  const { w, me } = sandbox(BB, def, o);
  const T = BB.TILE, DT = BB.DT;
  const targets = [];
  for (const p of w.pollen) targets.push({ type: 'polen', x: p.x, y: p.y, w: 8, h: 8 });
  for (const s of w.secrets) targets.push({ type: 'nadir', x: s.x, y: s.y, w: 12, h: 12 });
  for (const c of w.checks) targets.push({ type: 'cicek', x: c.x + 1, y: c.y - 6, w: 14, h: 22 });
  for (const q of w.questions) targets.push({ type: 'soru', x: q.zone.x, y: q.zone.y, w: q.zone.w, h: q.zone.h, center: true });
  targets.push({ type: 'cikis', x: w.exit.x + 2, y: w.exit.y - 14, w: 28, h: 30, center: true });
  for (const p of w.e.plate) targets.push({ type: 'plaka-' + p.id, x: p.x + 1, y: p.y + 9, w: 14, h: 7 });
  for (const f of w.e.flower) targets.push({ type: 'cicekkol-' + f.id, x: f.x - 6, y: f.y + 6, w: 28, h: 10 });
  for (const t of targets) t.hit = false;
  const mark = () => {
    const b = me, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    for (const t of targets) if (!t.hit) {
      let h = false;
      if (t.center) { if (cx >= t.x && cx <= t.x + t.w && cy >= t.y && cy <= t.y + t.h) h = true; }
      else if (b.x < t.x + t.w && b.x + b.w > t.x && b.y < t.y + t.h && b.y + b.h > t.y) h = true;
      if (h) { t.hit = true; t.via = { parent: curParent, act: curAct }; }
    }
  };
  const seen = new Set(), queue = [];
  const key = (s) => Math.round(s.x / 4) + ',' + Math.round(s.y / 4);
  let curParent = null, curAct = null;
  const add = (s) => { const k = key(s); if (seen.has(k)) return; seen.add(k); s._parent = curParent; s._act = curAct; queue.push(s); };
  let frames = 0;

  function frame(inp) {
    w.time += DT;
    for (const z of w.e.wind) BB.KINDS.wind.update(z, w, DT);
    w.updateBee(me, inp, DT);
    frames++;
    if (me.stuck) return false;
    w.tileHazards(me);
    if (w.state !== 'play' || me.stuck) { w.state = 'play'; return false; }
    if (me.y > w.hpx + 24) return false;
    // nektar
    for (const n of w.nectars) if (BB.overlap(me, n)) me.energy = 1;
    mark();
    return true;
  }

  function walk(s, d) {
    restore(me, s); me.energy = 1;
    let lastX = me.x, air = false;
    for (let i = 0; i < 600; i++) {
      if (!frame({ left: d < 0, right: d > 0, flap: false, flapPressed: false, action: false, actionPressed: false })) return;
      if (me.onGround) {
        if (Math.abs(me.x - lastX) >= 8) { add(snap(me)); lastX = me.x; }
        if (me.hitX) { add(snap(me)); return; }
        if (air) { add(snap(me)); return; }
      } else air = true;
    }
  }

  // uçuş: d yön, k kanat karesi (0 = dokunuş), pol: 0 yönü tut + süzül, 1 yönü tut + bırak, 2 dur + süzül, 3 ters dön + süzül
  function fly(s, d, k, pol, boost) {
    restore(me, s); me.energy = 1;
    if (boost) { me.y -= 60; if (w.blockedAt(me, me.x, me.y)) return; me.onGround = true; me.coyote = 0.1; }
    let started = false;
    for (let i = 0; i < 360; i++) {
      let dir = d;
      const after = i > k + 8;
      if (after && pol === 2) dir = 0;
      if (after && pol === 3) dir = -d;
      const flap = i < Math.max(2, k + 8) || (after && pol !== 1);
      if (!frame({ left: dir < 0, right: dir > 0, flap, flapPressed: i === 0, action: false, actionPressed: false })) return;
      if (!me.onGround) started = true;
      if (started && me.onGround) { add(snap(me)); return; }
    }
  }

  restore(me, snap(me));
  add(snap(me));
  for (const c of w.checks) { if (o.allChecks) { const s = snap(me); s.x = c.x + 3; s.y = c.y + T - 12; add(s); } }
  let head = 0;
  const limit = o.limit || 12000;
  while (head < queue.length && seen.size < limit) {
    const s = queue[head++];
    curParent = s;
    curAct = 'yürü sol'; walk(s, -1); curAct = 'yürü sağ'; walk(s, 1);
    for (const d of [-1, 0, 1]) for (const k of [0, 10, 24, 40]) for (const pol of (d === 0 ? [0, 1] : [0, 1, 2, 3])) { curAct = `uç yön=${d} kanat=${k} pol=${pol}`; fly(s, d, k, pol, false); }
    if (o.omuz) for (const d of [-1, 0, 1]) for (const k of [24, 40]) { curAct = `omuzdan yön=${d} kanat=${k}`; fly(s, d, k, 0, true); }
  }
  return { targets, nodes: seen.size, frames, capped: seen.size >= limit };
}

module.exports = { explore };

if (require.main === module) {
  const BB = loadBB();
  const args = process.argv.slice(2);
  const id = parseInt(args.find((a) => /^\d+$/.test(a)) || '1', 10);
  const opt = { gates: 'acik', omuz: false, bee: 0 };
  for (const a of args) if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); if (k === 'kapilar') opt.gates = v; if (k === 'omuz') opt.omuz = true; if (k === 'ari') opt.bee = parseInt(v, 10); if (k === 'hepsi') opt.allChecks = true; }
  const def = BB.LEVELS.find((l) => l.id === id);
  const t0 = Date.now();
  const r = explore(BB, def, opt);
  const miss = r.targets.filter((t) => !t.hit);
  console.log(`Bölüm ${id} (${def.name}) kapılar=${opt.gates}${opt.omuz ? ' +omuz' : ''} arı=${opt.bee}: düğüm ${r.nodes}${r.capped ? ' (SINIR)' : ''}, ${(Date.now() - t0) / 1000}s`);
  console.log('  ulaşılamayan:', miss.length ? miss.map((t) => `${t.type}@${Math.floor(t.x / 16)},${Math.floor(t.y / 16)}`).join(' ') : 'yok');
  const want = args.find((a) => a.startsWith('--yol='));
  if (want) {
    const ty = want.split('=')[1];
    const t = r.targets.find((x) => x.type === ty);
    if (t && t.hit) {
      const chain = [t.via.act];
      for (let n = t.via.parent; n; n = n._parent) chain.push(`(${(n.x / 16).toFixed(1)},${(n.y / 16).toFixed(1)})` + (n._act ? ' ← ' + n._act : ''));
      console.log('  yol (' + ty + '):\n    ' + chain.join('\n    '));
    } else console.log('  yol yok: ' + ty);
  }
}
