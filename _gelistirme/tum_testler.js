// Bütün testleri sırayla çalıştırır ve özet verir.
// Kullanım: node _gelistirme/tum_testler.js [--tarayicisiz]
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const noBrowser = process.argv.includes('--tarayicisiz');

const { loadBB } = require('./sim.js');
const BB = loadBB();
const ids = BB.LEVELS.map((l) => l.id).filter((id) => id < 90);

const steps = [
  ['Veri doğrulama', ['_gelistirme/veri_testi.js']],
  ['Mekanik birim testleri', ['_gelistirme/mekanik_testi.js']],
  ['Kayıt testleri', ['_gelistirme/kayit_testi.js']],
  ['Çözüm betikleri (18 bölüm)', ['_gelistirme/solve.js']],
  ['Devam (Bal Çiçeğinden yükleme) testi', ['_gelistirme/devam_testi.js']],
  ['Stres testi', ['_gelistirme/stres_testi.js', '--tohum=6', '--kare=5000']],
];
for (const id of ids) {
  steps.push([`Erişilebilirlik ${id} (iş birliği zorunlu)`, ['_gelistirme/explore.js', String(id), '--kapilar=kapali'], (out) => /ulaşılamayan:.*cikis@/.test(out)]);
  steps.push([`Erişilebilirlik ${id} (her şey erişilebilir)`, ['_gelistirme/explore.js', String(id), '--kapilar=acik', '--omuz'], (out) => /ulaşılamayan: yok/.test(out)]);
}
if (!noBrowser) {
  steps.push(['Tarayıcı: uçtan uca oyun', ['_gelistirme/tarayici_oyun_testi.js'], (out) => /konsol temiz/.test(out) && !/sapma|ölüm oldu/.test(out)]);
  steps.push(['Tarayıcı: soru akışları', ['_gelistirme/soru_test.js'], (out) => /konsol temiz/.test(out) && !/kayıt null/.test(out)]);
  steps.push(['Tarayıcı: final + Anı Kartı', ['_gelistirme/final_test.js'], (out) => /konsol temiz/.test(out) && /Anı Kartı PNG: 1080x/.test(out)]);
  steps.push(['Tarayıcı: arayüz ekranları', ['_gelistirme/ui_test.js'], (out) => /konsol temiz/.test(out)]);
  steps.push(['Tarayıcı: ses', ['_gelistirme/ses_test.js'], (out) => /konsol temiz/.test(out)]);
}

const results = [];
for (const [name, args, check] of steps) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 30 * 60 * 1000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = check ? check(out) && r.status === 0 : r.status === 0;
  results.push({ name, ok, sec: ((Date.now() - t0) / 1000).toFixed(1), tail: out.trim().split('\n').slice(-3).join(' | ') });
  console.log(`${ok ? '✓' : '✗'} ${name}  (${((Date.now() - t0) / 1000).toFixed(1)} sn)${ok ? '' : '\n    ' + out.trim().split('\n').slice(-6).join('\n    ')}`);
}
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} test grubu geçti.`);
fs.mkdirSync(path.join(__dirname, 'cikti'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'cikti', 'test_ozeti.json'), JSON.stringify({ tarih: new Date().toISOString(), results }, null, 1));
process.exitCode = bad.length ? 1 : 0;
