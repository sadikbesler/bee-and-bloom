// Rastgele stres testi: her bölümde rastgele girdiler + rastgele ışınlama ile motoru zorlar.
// Arar: NaN, katının içine gömülme, harita dışına kaçış, taşıma tutarsızlığı, yeniden doğma hataları, istisnalar.
// Kullanım: node _gelistirme/stres_testi.js [bölümNo ...] [--tohum=25] [--kare=6000]
const { loadBB } = require('./sim.js');
const BB = loadBB();
const T = BB.TILE;
const args = process.argv.slice(2);
const ids = args.filter((a) => /^\d+$/.test(a)).map(Number);
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? parseInt(a.split('=')[1], 10) : d; };
const SEEDS = opt('tohum', 12), FRAMES = opt('kare', 6000);

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function freeSpot(w, b, rand) {
  for (let k = 0; k < 60; k++) {
    const x = 32 + rand() * (w.wpx - 64), y = 16 + rand() * (w.hpx - 48);
    if (w.blockedAt(b, x, y)) continue;
    if (w.hazardNear({ x, y, w: b.w, h: b.h })) continue;
    return [x, y];
  }
  return null;
}

function check(w, tag, viol) {
  for (const b of w.bees) {
    if (!b.alive) continue;
    if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.vx) || !isFinite(b.vy)) { viol.push(`${tag}: NaN arı${b.id}`); return; }
    if (b.carriedBy) {
      const a = b.carriedBy;
      if (a.carrying !== b || Math.abs(b.x - a.x) > 0.01 || Math.abs(b.y - (a.y + 12)) > 0.01) { viol.push(`${tag}: taşıma tutarsız`); return; }
      continue;
    }
    if (b.carrying && b.h !== 24) { viol.push(`${tag}: taşıyan yüksekliği ${b.h}`); return; }
    if (!b.carrying && b.h !== 12) { viol.push(`${tag}: yükseklik ${b.h}`); return; }
    // katının içinde mi (0.6 px tolerans)
    const shr = { x: b.x + 0.6, y: b.y + 0.6, w: b.w - 1.2, h: b.h - 1.2, role: b.role, isBee: true };
    if (w.blockedAt(shr, shr.x, shr.y, shr.h)) { viol.push(`${tag}: arı${b.id} katının içinde (${(b.x / T).toFixed(2)},${(b.y / T).toFixed(2)})`); return; }
    if (b.x < -2 || b.x + b.w > w.wpx + 2 || b.y < -2) { viol.push(`${tag}: arı${b.id} harita dışında (${b.x.toFixed(1)},${b.y.toFixed(1)})`); return; }
  }
  for (const it of w.items) if (!it.used && !it.holder && (!isFinite(it.x) || !isFinite(it.y))) { viol.push(`${tag}: eşya NaN`); return; }
}

let total = 0, frames = 0, deaths = 0;
const list = (ids.length ? ids : BB.LEVELS.map((l) => l.id)).filter((id) => id < 90);
for (const id of list) {
  const def = BB.LEVELS.find((l) => l.id === id);
  const viol = [];
  for (let seed = 1; seed <= SEEDS && viol.length < 6; seed++) {
    const rand = rng(id * 7919 + seed * 104729);
    let w;
    try { w = new BB.World(def, { roles: seed % 2 ? ['disi', 'erkek'] : ['erkek', 'disi'] }); }
    catch (e) { viol.push(`kurulum: ${e.message}`); break; }
    const keys = [{}, {}], hold = [0, 0];
    let stuckFrames = 0;
    for (let f = 0; f < FRAMES; f++) {
      // ara sıra rastgele ışınlama (çarpışma kenar durumlarını zorlar)
      if (f % 700 === 350 && rand() < 0.7) {
        const b = w.bees[Math.floor(rand() * 2)];
        if (b.alive && !b.carriedBy && !b.carrying) { const sp = freeSpot(w, b, rand); if (sp) { b.x = sp[0]; b.y = sp[1]; b.vx = b.vy = 0; b.onGround = false; b.stuck = null; } }
      }
      const ins = [];
      for (let p = 0; p < 2; p++) {
        if (hold[p]-- <= 0) {
          hold[p] = 6 + Math.floor(rand() * 40);
          const d = rand();
          keys[p] = { left: d < 0.35, right: d >= 0.35 && d < 0.75, flap: rand() < 0.5, action: rand() < 0.08 };
        }
        ins.push({ left: keys[p].left, right: keys[p].right, flap: keys[p].flap, flapPressed: keys[p].flap && rand() < 0.25, action: keys[p].action, actionPressed: rand() < 0.03 });
      }
      try {
        if (w.pending) {
          const p = w.pending;
          if (p.type === 'question') { w.resolvePending(); const q = BB.Q.get(p.qid); if (q && q.type === 'A') w.startOpen(p.qi); else w.resolveQuestion(p.qi); }
          else if (p.type === 'openAnswer') { w.resolvePending(); w.resolveQuestion(p.qi); }
          else w.resolvePending();
        }
        w.step(ins);
      } catch (e) { viol.push(`L${id} tohum${seed} kare${f}: İSTİSNA ${e.stack.split('\n').slice(0, 3).join(' | ')}`); break; }
      for (const ev of w.events) if (ev.type === 'death') deaths++;
      w.events.length = 0; frames++;
      if (w.state === 'play') check(w, `L${id} tohum${seed} kare${f}`, viol);
      if (w.state === 'respawn' && w.stateT < 0.05) {
        // yeniden doğuş sonrası: iki arı da canlı, katı dışında, checkpoint yakınında
        for (const b of w.bees) if (!b.alive || b.dead) viol.push(`L${id} tohum${seed} kare${f}: yeniden doğuşta arı${b.id} ölü`);
      }
      if (w.state === 'won') break;
      if (w.state === 'dying') stuckFrames = 0;
      if (viol.length >= 6) break;
    }
  }
  total += viol.length;
  console.log(`Bölüm ${String(id).padStart(2)}: ${viol.length ? 'SORUN ' + viol.length : 'temiz'}`);
  for (const v of viol.slice(0, 4)) console.log('   ' + v);
}
console.log(`\ntoplam kare ${frames}, ölüm ${deaths}, ihlal ${total}`);
process.exitCode = total ? 1 : 0;
