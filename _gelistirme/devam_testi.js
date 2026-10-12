// "Devam" testi: her Bal Çiçeği (checkpoint) anında kayda yazılacak durumla yeni dünya kurulur;
// kalıcı bayraklar, kapıların açıklığı ve açık Bal Çiçekleri oyundaki durumla aynı olmalı.
// Kullanım: node _gelistirme/devam_testi.js [bölümNo ...]   (önce: node _gelistirme/solve.js)
const fs = require('fs');
const path = require('path');
const { loadBB } = require('./sim.js');
const { unpack } = require('./runner.js');
const BB = loadBB();
const REC = path.join(__dirname, 'cikti', 'kayit');
const ids = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : BB.LEVELS.map((l) => l.id);
function drive(w, ans) {
  const p = w.pending; if (!p) return;
  if (p.type === 'question') { const q = BB.Q.get(p.qid); w.resolvePending(); if (q.type === 'A') w.startOpen(p.qi); else { ans.add(p.qid); w.resolveQuestion(p.qi); } }
  else if (p.type === 'openAnswer') { ans.add(p.qid); w.resolvePending(); w.resolveQuestion(p.qi); }
  else w.resolvePending();
}
const gates = (w) => w.e.gate.map((g) => (g.latched || g.open > 0.5 ? 1 : 0)).join('');
let bad = 0, n = 0;
for (const id of ids) {
  const j = JSON.parse(fs.readFileSync(path.join(REC, 'L' + id + '.json'), 'utf8'));
  const def = BB.LEVELS.find((l) => l.id === id);
  const w = new BB.World(def, { roles: j.roles }); const ans = new Set();
  const errs = [];
  for (let f = 0; f < j.rec.length; f++) {
    drive(w, ans);
    w.step([unpack(j.rec[f][0]), unpack(j.rec[f][1])]);
    for (const ev of w.events) if (ev.type === 'checkpoint' && ev.first) {
      const ci = w.checks.indexOf(w.cp);
      const opts = { roles: j.roles, answered: [...ans], checkpoint: ci, perm: Object.keys(w.perm), cps: w.checks.map((k, i) => (k.on ? i : -1)).filter((i) => i >= 0), seen: Object.keys(w.seen) };
      const w2 = new BB.World(def, JSON.parse(JSON.stringify(opts)));
      n++;
      const p1 = Object.keys(w.perm).sort().join(','), p2 = Object.keys(w2.perm).sort().join(',');
      if (p1 !== p2) errs.push(`cp${ci}: bayrak ${p1} ≠ ${p2}`);
      // kapılar: bayrakla açılan kapı (mandallı ya da kalıcı kanal) aynı olmalı
      const g1 = w.e.gate.map((g) => (g.latched ? 1 : 0)).join(''), g2 = w2.e.gate.map((g) => (g.latched ? 1 : 0)).join('');
      if (g1 !== g2) errs.push(`cp${ci}: mandallı kapılar ${g1} ≠ ${g2}`);
      const c1 = w.checks.map((k) => (k.on ? 1 : 0)).join(''), c2 = w2.checks.map((k) => (k.on ? 1 : 0)).join('');
      if (c1 !== c2) errs.push(`cp${ci}: Bal Çiçekleri ${c1} ≠ ${c2}`);
      if (w2.bees.some((b) => w2.blockedAt(b, b.x, b.y))) errs.push(`cp${ci}: doğuşta arı duvarda`);
    }
    w.events.length = 0;
  }
  if (errs.length) bad++;
  console.log(`Bölüm ${String(id).padStart(2)}: ${errs.length ? 'SORUN\n    ' + errs.join('\n    ') : 'tamam'}`);
}
console.log(`\n${n} Bal Çiçeği denendi, ${bad ? bad + ' bölümde sorun' : 'hepsi tutarlı'}.`);
process.exitCode = bad ? 1 : 0;
