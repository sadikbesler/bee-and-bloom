// İzleme modu için çözüm kayıtlarını tarayıcının file:// ile yükleyebileceği bir JS dosyasına toplar.
// Kullanım: node _gelistirme/solve.js && node _gelistirme/izle_hazirla.js
// Sonra: index.html?izle=1   (1. bölümden başlar; ?izle=7 → 7. bölümden; &hiz=2 → 2 kat hızlı)
const fs = require('fs');
const path = require('path');
const REC = path.join(__dirname, 'cikti', 'kayit');
const out = {};
for (const f of fs.readdirSync(REC).filter((x) => /^L\d+\.json$/.test(x))) {
  const j = JSON.parse(fs.readFileSync(path.join(REC, f), 'utf8'));
  out[j.id] = j.rec;
}
const file = path.join(__dirname, 'cikti', 'kayitlar.js');
fs.writeFileSync(file, '// otomatik üretildi: izle_hazirla.js\nwindow.BB = window.BB || {};\nBB.KAYITLAR = ' + JSON.stringify(out) + ';\n');
console.log(`${Object.keys(out).length} bölüm kaydı yazıldı: ${path.relative(process.cwd(), file)}`);
