// Bölüm çözüm testleri: her bölüm için iki oyunculu betiği gerçek simülasyonla oynatır ve bölüm sonuna ulaşıldığını doğrular.
// Kullanım: node _gelistirme/solve.js [bölümNo ...] [--rol=ters] [--kaydet]
const fs = require('fs');
const path = require('path');
const { loadBB } = require('./sim.js');
const { Run, unpack } = require('./runner.js');

const BB = loadBB();
const sols = {};
const dir = path.join(__dirname, 'cozumler');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) Object.assign(sols, require(path.join(dir, f)));

const args = process.argv.slice(2);
const ids = args.filter((a) => /^\d+$/.test(a)).map(Number);
const swapRoles = args.includes('--rol=ters');
const save = args.includes('--kaydet') || true;
const list = ids.length ? ids : BB.LEVELS.map((l) => l.id).filter((id) => id < 90);

let ok = 0, bad = 0;
const allAnswers = {};
const recDir = path.join(__dirname, 'cikti', 'kayit');
fs.mkdirSync(recDir, { recursive: true });

for (const id of list) {
  const fn = sols[id];
  if (!fn) { console.log(`Bölüm ${id}: ÇÖZÜM YOK`); bad++; continue; }
  const roles = swapRoles ? ['erkek', 'disi'] : ['disi', 'erkek'];
  const t0 = Date.now();
  let r;
  try {
    r = new Run(id, { BB, roles });
    fn(r);
    if (r.w.state !== 'won') throw new Error('bölüm bitmedi');
    // determinizm: kaydı yeniden oynat, aynı karede bitmeli
    const w2 = new BB.World(r.def, { roles });
    let f = 0, won = -1;
    const answered = {};
    for (const [a, b] of r.rec) {
      if (w2.pending) {
        const p = w2.pending;
        if (p.type === 'question') { const q = BB.Q.get(p.qid); w2.resolvePending(); if (q.type === 'A') w2.startOpen(p.qi); else { answered[p.qid] = 1; w2.resolveQuestion(p.qi); } }
        else if (p.type === 'openAnswer') { w2.resolvePending(); w2.resolveQuestion(p.qi); }
        else w2.resolvePending();
      }
      w2.step([unpack(a), unpack(b)]); w2.events.length = 0; f++;
      if (w2.state === 'won' && won < 0) won = f;
    }
    if (won < 0) throw new Error('kayıt yeniden oynatılınca bölüm bitmedi (determinizm sorunu)');
    const s = r.summary();
    Object.assign(allAnswers, r.answers);
    if (save) fs.writeFileSync(path.join(recDir, `L${id}${swapRoles ? '_ters' : ''}.json`), JSON.stringify({ id, roles, answers: r.answers, frames: r.rec.length, rec: r.rec }));
    console.log(`Bölüm ${String(id).padStart(2)} ${r.def.name.padEnd(22)} TAMAM  ${String(s.sec).padStart(6)} sn oyun  çiçek ${s.checks}  polen ${s.pollen}  nadir ${s.secret ? '✓' : '·'}  soru ${s.answered}  ölüm ${s.deaths}  (${Date.now() - t0} ms)`);
    ok++;
  } catch (e) {
    console.log(`Bölüm ${String(id).padStart(2)} HATA: ${e.message}`);
    if (r && r.log.length) console.log('   ' + r.log.slice(-5).join('\n   '));
    bad++;
  }
}
console.log(`\n${ok} bölüm geçti, ${bad} sorunlu.`);
process.exitCode = bad ? 1 : 0;
