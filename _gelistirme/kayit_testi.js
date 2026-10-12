// Kayıt sistemi testleri (Node, sahte localStorage ile).
// Kullanım: node _gelistirme/kayit_testi.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PROJ = path.resolve(__dirname, '..');
const { dataFiles } = require('./sim.js');

function fakeStorage(mode) {
  const m = new Map();
  let quota = mode === 'kota' ? 2 : Infinity;
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      if (mode === 'kota' && m.size >= quota && !m.has(k)) { const e = new Error('dolu'); e.name = 'QuotaExceededError'; throw e; }
      m.set(k, String(v));
    },
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

function load(mode) {
  const ctx = { console, Math, Object, Array, Uint8Array, Float32Array, Error, JSON, Set, Map, Date, String, Number, Boolean, RegExp, isFinite, parseInt };
  if (mode === 'engelli') Object.defineProperty(ctx, 'localStorage', { get() { throw new Error('SecurityError'); } });
  else ctx.localStorage = fakeStorage(mode);
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ['js/core.js', 'js/physics.js', 'js/entities.js', 'js/level.js', 'js/questions.js', 'js/save.js'].concat(dataFiles())) vm.runInContext(fs.readFileSync(path.join(PROJ, f), 'utf8'), ctx, { filename: f });
  ctx.BB.Game = { names: ['?', '?'], roles: ['disi', 'erkek'], round: 1 };
  ctx.BB.LEVELS.sort((a, b) => a.id - b.id);
  return ctx;
}

const results = [];
function test(name, fn) { try { fn(); results.push([name, true]); } catch (e) { results.push([name, false, e.message]); } }
function ok(c, m) { if (!c) throw new Error(m || 'beklenti sağlanmadı'); }

test('yeni oyun, otomatik kayıt, yeniden yükleme (sekmeyi kapat-aç)', () => {
  const ctx = load('normal'); const S = ctx.BB.Save;
  S.init();
  ok(S.available, 'localStorage kullanılabilir olmalı');
  S.create(2, ['İlkin', 'Çağrı'], ['erkek', 'disi']);
  S.cur.current = { level: 1, checkpoint: 2, taken: [0, 3], secret: true, deaths: 4, time: 81.5 };
  S.tick(12.5);
  ok(S.flush(), 'flush başarısız');
  // "yeniden açılış": aynı depoyla yeni bağlam
  const raw = ctx.localStorage.getItem('beeandbloom_v1_slot2');
  ok(raw && raw.includes('İlkin'), 'kayıt anahtarı/isim yok');
  const ctx2 = load('normal'); ctx2.localStorage = ctx.localStorage; const S2 = ctx2.BB.Save;
  S2.init();
  const d = S2.load(2);
  ok(d && !d.corrupt, 'yeniden okunamadı');
  ok(d.names[0] === 'İlkin' && d.roles[0] === 'erkek', 'isim/rol kaybolmuş');
  ok(d.current.level === 1 && d.current.checkpoint === 2 && d.current.taken.length === 2, 'kaldığı yer kaybolmuş');
  ok(d.playTime >= 12.5, 'süre kaydedilmemiş');
  const list = S2.list();
  ok(list.length === 3 && list[0].empty && !list[1].empty && list[2].empty, '3 slot listesi hatalı');
});

test('cevaplar ilk verildiğinde kilitlenir', () => {
  const ctx = load('normal'); const S = ctx.BB.Save; S.init();
  S.create(1, ['A', 'B'], ['disi', 'erkek']);
  ok(S.setAnswer('S24', { a: 0, b: 1, type: 'A' }), 'ilk cevap yazılmadı');
  ok(!S.setAnswer('S24', { a: 3, b: 3, type: 'A' }), 'ikinci cevap kabul edilmemeli');
  ok(S.cur.answers.S24.a === 0 && S.cur.answers.S24.b === 1, 'cevap değişmiş');
});

test('bölüm sonu: açılan bölüm, en iyi süre, düşme, polen, nadir çiçek', () => {
  const ctx = load('normal'); const BB = ctx.BB; const S = BB.Save; S.init();
  S.create(1, ['A', 'B'], ['disi', 'erkek']);
  const def = BB.LEVELS.find((l) => l.id === 1);
  const w = new BB.World(def);
  w.stats.time = 300; w.stats.deaths = 3; w.stats.pollen = 7; w.stats.secret = true;
  S.onLevelEnd({ world: w, def, idx: 0 });
  const d = S.cur;
  ok(d.unlocked === 2 && d.current.level === 1, 'sonraki bölüm açılmadı');
  ok(d.best[1] === 300 && d.deaths[1] === 3 && d.totalDeaths === 3 && d.pollen[1] === 7 && d.secrets[1], 'istatistikler yazılmadı');
  w.stats.time = 200; w.stats.deaths = 1;
  S.onLevelEnd({ world: w, def, idx: 0 });
  ok(d.best[1] === 200 && d.totalDeaths === 4, 'en iyi süre/toplam düşme güncellenmedi');
});

test('checkpoint yakalama: kaldığı Bal Çiçeği ve toplanan polenler', () => {
  const ctx = load('normal'); const BB = ctx.BB; const S = BB.Save; S.init();
  S.create(3, ['A', 'B'], ['disi', 'erkek']);
  const def = BB.LEVELS.find((l) => l.id === 1);
  const w = new BB.World(def);
  w.activateCheck(w.checks[1]); w.pollen[2].taken = true; w.pollen[5].taken = true;
  S.capture({ world: w, idx: 0 });
  ok(S.cur.current.checkpoint === 1 && S.cur.current.taken.join() === '2,5', 'yakalama hatalı: ' + JSON.stringify(S.cur.current));
  // devam: o checkpoint'ten başlayan dünya
  const w2 = new BB.World(def, { checkpoint: 1, taken: [2, 5] });
  ok(w2.cp === w2.checks[1] && w2.pollen[2].taken && w2.stats.pollen === 2, 'checkpointten devam hatalı');
});

test('bozuk kayıt çökertmez, "bozuk" olarak listelenir', () => {
  const ctx = load('normal'); const S = ctx.BB.Save; S.init();
  ctx.localStorage.setItem('beeandbloom_v1_slot1', '{bu json değil');
  ctx.localStorage.setItem('beeandbloom_v1_slot2', JSON.stringify({ game: 'bee-and-bloom', v: 1, names: ['', 'B'] }));
  const l = S.list();
  ok(l[0].corrupt && l[1].corrupt, 'bozuk kayıtlar tanınmadı');
  ok(S.load(1).corrupt, 'load bozuk dönmeli');
});

test('dışa aktar → içe aktar aynı veriyi geri getirir', () => {
  const ctx = load('normal'); const S = ctx.BB.Save; S.init();
  S.create(1, ['Ömer', 'Gülşen'], ['disi', 'erkek']);
  S.setAnswer('S24', { a: 1, b: 1, type: 'A' });
  S.cur.unlocked = 5; S.cur.current.level = 4; S.flush();
  const json = S.exportJSON(1);
  ok(json && JSON.parse(json).exported, 'dışa aktarma boş');
  const r = S.importJSON(json, 3);
  ok(r.ok, 'içe aktarma reddedildi: ' + r.why);
  const d = S.load(3);
  ok(d.names[1] === 'Gülşen' && d.unlocked === 5 && d.answers.S24.a === 1 && !d.exported, 'içe aktarılan veri farklı');
});

test('içe aktarma doğrulaması: yabancı dosya, yanlış sürüm, bilinmeyen soru', () => {
  const ctx = load('normal'); const S = ctx.BB.Save; S.init();
  ok(!S.importJSON('merhaba', 1).ok, 'JSON olmayan kabul edildi');
  ok(!S.importJSON(JSON.stringify({ game: 'baska-oyun', v: 1 }), 1).ok, 'yabancı oyun kabul edildi');
  const good = JSON.parse(JSON.stringify(S.blank(['A', 'B'], ['disi', 'erkek'])));
  ok(S.importJSON(JSON.stringify(good), 1).ok, 'geçerli kayıt reddedildi');
  ok(!S.importJSON(JSON.stringify(Object.assign({}, good, { v: 99 })), 1).ok, 'yanlış sürüm kabul edildi');
  ok(!S.importJSON(JSON.stringify(Object.assign({}, good, { answers: { X99: { a: 0, b: 0 } } })), 1).ok, 'bilinmeyen soru kabul edildi');
  ok(!S.importJSON(JSON.stringify(Object.assign({}, good, { names: ['A', 'Çok uzun bir isim burada'] })), 1).ok, 'uzun isim kabul edildi');
});

test('localStorage engelliyken çökmez, uyarı verir, bellekte çalışır', () => {
  const ctx = load('engelli'); const S = ctx.BB.Save;
  S.init();
  ok(!S.available && S.warning, 'uyarı yok');
  S.create(1, ['A', 'B'], ['disi', 'erkek']);
  S.setAnswer('S24', { a: 0, b: 0 });
  S.autosave('test');
  const l = S.list();
  ok(!l[0].empty, 'bellek yedeği çalışmıyor');
});

test('kota dolunca çökmez, anlaşılır uyarı verir', () => {
  const ctx = load('kota'); const S = ctx.BB.Save;
  S.init();
  S.create(1, ['A', 'B'], ['disi', 'erkek']);
  S.create(2, ['C', 'D'], ['disi', 'erkek']);
  S.create(3, ['E', 'F'], ['disi', 'erkek']);
  ok(/dolu/i.test(S.warning || ''), 'kota uyarısı yok: ' + S.warning);
});

test('ayarlar kaydedilir ve geri yüklenir', () => {
  const ctx = load('normal'); const S = ctx.BB.Save; S.init();
  S.setSetting('music', 0.3); S.setSetting('muted', true);
  const ctx2 = load('normal'); ctx2.localStorage = ctx.localStorage; const S2 = ctx2.BB.Save; S2.init();
  ok(S2.settings.music === 0.3 && S2.settings.muted === true, 'ayarlar geri gelmedi');
});

let pass = 0;
for (const [n, good, msg] of results) { console.log((good ? '  ✓ ' : '  ✗ ') + n + (good ? '' : '  → ' + msg)); if (good) pass++; }
console.log(`\n${pass}/${results.length} kayıt testi geçti.`);
process.exitCode = pass === results.length ? 0 : 1;
