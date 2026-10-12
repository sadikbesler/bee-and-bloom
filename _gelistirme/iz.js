// Çözüm betiğini çalıştırırken arıların durumunu kare kare yazar (hata ayıklama).
// Kullanım: node _gelistirme/iz.js <bölüm> [ilkKare] [sonKare] [adım]
const fs = require('fs');
const path = require('path');
const { Run } = require('./runner.js');
const sols = {};
for (const f of fs.readdirSync(path.join(__dirname, 'cozumler')).filter((x) => x.endsWith('.js'))) Object.assign(sols, require(path.join(__dirname, 'cozumler', f)));
const [id, f0, f1, every] = [parseInt(process.argv[2] || '1', 10), parseInt(process.argv[3] || '0', 10), parseInt(process.argv[4] || '999999', 10), parseInt(process.argv[5] || '4', 10)];
const r = new Run(id, {});
const orig = r.step.bind(r);
r.step = function () {
  orig();
  if (r.f >= f0 && r.f <= f1 && r.f % every === 0) {
    console.log(r.f, r.w.bees.map((b, i) => `${i}:(${(b.x / 16).toFixed(1)},${(b.y / 16).toFixed(1)}) v(${b.vx.toFixed(0)},${b.vy.toFixed(0)}) e${b.energy.toFixed(2)} ${b.onGround ? 'G' : 'A'}${b.stuck ? 'S' : ''} ${r.inp[i].flap ? 'F' : '-'}${r.inp[i].left ? 'L' : ''}${r.inp[i].right ? 'R' : ''}${r.inp[i].action ? 'E' : ''}`).join('  '));
  }
};
try { sols[id](r); console.log('bitti:', r.w.state, JSON.stringify(r.summary())); } catch (e) { console.log(e.message); }
