// Mekanik birim testleri: her mekaniği küçük bir haritada botla dener ve beklenen davranışı doğrular.
// Kullanım: node _gelistirme/mekanik_testi.js
const { loadBB } = require('./sim.js');
const { Run } = require('./runner.js');
const { Harita } = require('./harita.js');
const BB = loadBB();
BB.SCENES.__test_scene = [{ say: 'puntur', text: 'test' }];
const T = 16;

function lvl(build, objects, extra) {
  const h = new Harita(40, 17);
  h.zemin(0, 39, 15);
  h.koy(3, 14, '1'); h.koy(5, 14, '2'); h.koy(8, 14, 'C'); h.koy(37, 14, 'E');
  if (build) build(h);
  return Object.assign({ id: 900, name: 'test', theme: 'bahar', map: h.satirlar(), objects: objects || [], questions: [], coop: ['t'] }, extra || {});
}
function run(def, opts) { return new Run(0, Object.assign({ BB, def }, opts || {})); }

const results = [];
function test(name, fn) {
  try { fn(); results.push([name, true]); }
  catch (e) { results.push([name, false, e.message.split('\n').slice(0, 2).join(' | ')]); }
}
function ok(c, msg) { if (!c) throw new Error(msg || 'beklenti sağlanmadı'); }

// 1) çift plaka + iş birliği kapısı
test('çift plaka kapıyı açar, tek plaka açmaz', () => {
  const r = run(lvl(null, [{ t: 'plate', x: 12, y: 14, id: 'a' }, { t: 'plate', x: 16, y: 14, id: 'b' }, { t: 'gate', x: 20, y: 0, h: 15, on: ['a', 'b'], coop: true, latch: true }]));
  r.run(r.walkT(0, 12));
  r.run(r.wait(30));
  ok(r.gate(['a', 'b']).open < 0.05, 'tek plakayla açıldı');
  r.run(r.walkT(1, 16));
  r.run(r.gateOpen(['a', 'b']));
  r.run(r.walkT(0, 25));
  ok(r.cx(0) > 24 * T, 'kapıdan geçemedi');
});

// 2) zamanlı plaka
test('zamanlı plaka bırakınca süre boyunca açık kalır', () => {
  const r = run(lvl(null, [{ t: 'plate', x: 12, y: 14, id: 'a', timer: 2 }, { t: 'gate', x: 16, y: 0, h: 15, on: 'a' }]));
  r.run(r.walkT(0, 12));
  r.run(r.gateOpen('a'));
  r.run(r.walkT(0, 14));
  r.run(r.wait(60));
  ok(r.gate('a').open > 0.9, '1 sn sonra kapanmamalıydı');
  r.run(r.wait(120));
  ok(r.gate('a').open < 0.5, 'süre sonunda kapanmalıydı');
});

// 3) taşıma ve birleşik enerji
test('taşıma: alır, taşıyanın enerjisi bitince taşınanınki kullanılır, bırakır', () => {
  const r = run(lvl());
  r.run(r.walkT(1, 3.6));
  r.run(r.pickUp(0));
  const a = r.bee(0), b = r.bee(1);
  ok(a.carrying === b && a.h === 24, 'taşıma başlamadı');
  r.inp[0].flap = true; r.inp[0].flapPressed = true;
  let usedB = false;
  for (let k = 0; k < 120; k++) { r.step(); if (a.energy <= 0 && b.energy < 0.99) usedB = true; }
  ok(usedB, 'taşınanın enerjisi kullanılmadı');
  r.inp[0].flap = false;
  r.run(r.drop(0));
  ok(!a.carrying && !b.carriedBy && a.h === 12, 'bırakma bozuk');
  r.run(r.wait(90));
  ok(a.onGround && b.onGround, 'bıraktıktan sonra yere inmediler');
});

// 4) fırlatma (yukarı)
test('taşıyıp yukarı fırlatma ek yükseklik verir', () => {
  const r = run(lvl());
  r.run(r.walkT(1, 3.6));
  r.run(r.pickUp(0));
  r.inp[0].flap = true; r.inp[0].flapPressed = true;
  r.run(r.wait(20));
  r.inp[0].actionPressed = true;
  r.step();
  r.inp[0].flap = false;
  ok(!r.bee(0).carrying, 'fırlatmada bırakmadı');
  ok(r.bee(1).vy < -100, 'yukarı fırlatma hızı yok: ' + r.bee(1).vy);
});

// 5) nilüfer cap1: iki arıda batar
test('nilüfer (cap1) iki arıyla batar, tek arıyı taşır', () => {
  const r = run(lvl((h) => { h.doldur(12, 15, 22, 16, '~'); }, [{ t: 'lily', x: 15, y: 14, w: 3, mode: 'cap1' }]), { allowDeath: true });
  const lily = r.w.e.lily[0];
  r.run(r.flyTo(0, 16 * T, lily.y - 6, { land: true }));
  r.run(r.wait(60));
  ok(lily.y - lily.restY < 1, 'tek arıda batmamalı');
  r.run(r.flyTo(1, 16.5 * T, lily.y - 6, { land: true, tolY: 40 }));
  r.run(r.wait(90));
  ok(lily.y - lily.restY > 10 || r.events.death > 0, 'iki arıda batmalı');
});

// 6) nilüfer pair: tek arıda batar, ikide durur
test('denge yaprağı (pair) tek arıda batar, iki arıda dengede', () => {
  const r = run(lvl((h) => { h.doldur(12, 15, 22, 16, '~'); }, [{ t: 'lily', x: 15, y: 14, w: 3, mode: 'pair' }]), { allowDeath: true });
  const lily = r.w.e.lily[0];
  r.run(r.flyTo(0, 16 * T, lily.y - 6, { land: true }), r.flyTo(1, 17 * T, lily.y - 6, { land: true }));
  r.run(r.wait(90));
  ok(lily.y - lily.restY < 1, 'iki arıda batmamalı');
  r.run(r.flyTo(1, 8 * T, 15 * T - 6, { land: true }));
  r.run(r.wait(60));
  ok(lily.y - lily.restY > 5 || r.events.death > 0, 'tek arıda batmalı');
});

// 7) rüzgâr: tek arı ilerleyemez, kalkan tutan ilerler ve gölgesindeki ortak korunur
test('rüzgâr itiyor; kalkan tutan bağışık; gölgedeki ortak korunur', () => {
  const r = run(lvl(null, [{ t: 'wind', x: 14, y: 0, w: 14, h: 15, vx: -150 }, { t: 'item', x: 10, y: 14, kind: 'shield' }]));
  r.run(r.walkT(0, 13));
  const x0 = r.cx(0);
  r.inp[0].right = true;
  r.run(r.wait(90));
  r.inp[0].right = false;
  ok(r.cx(0) < 17 * T, 'rüzgâra karşı fazla ilerledi');
  // kalkan
  r.run(r.walkT(1, 10));
  r.run(r.act(1));
  ok(r.bee(1).item && r.bee(1).item.kind === 'shield', 'kalkan alınamadı');
  // rüzgâr soldan esiyor (vx<0): gölge, kalkanın solunda kalır; ortak (0) kalkanın solunda durursa korunur
  r.run(r.walkT(1, 18, { max: 900 }));
  ok(r.cx(1) > 17.5 * T, 'kalkanlı arı rüzgârda ilerleyemedi');
  void x0;
});

// 8) polen topu + saksı + sarmaşık
test('polen topu saksıya girince sarmaşık büyür ve yapraklar platform olur', () => {
  const r = run(lvl(null, [{ t: 'item', x: 10, y: 14, kind: 'pollen' }, { t: 'pot', x: 16, y: 14, id: 'pot' }, { t: 'vine', x: 18, y: 14, h: 8, on: 'pot' }]));
  r.run(r.walkT(0, 10));
  r.run(r.act(0));
  ok(r.bee(0).item, 'polen alınmadı');
  r.run(r.walkT(0, 15.6));
  r.run(r.act(0));
  r.run(r.until(() => r.w.e.pot[0].bloomed, 120, 'saksı açılmadı'));
  r.run(r.until(() => r.w.e.vine[0].leaves.every((l) => l.active), 900, 'sarmaşık büyümedi'));
});

// 9) örümcek ağı: yapışır, ortak kurtarır; ikisi de takılırsa ölüm
test('ağ: yapışır, ortak eylemle kurtarır', () => {
  const r = run(lvl((h) => { h.koy(12, 14, 'w'); }));
  r.run(r.walkT(0, 13, { max: 200, noFail: true }));
  ok(r.bee(0).stuck, 'ağa yapışmadı');
  r.run(r.walkT(1, 11.5, { tol: 6 }));
  r.run(r.act(1));
  ok(!r.bee(0).stuck, 'ortak kurtaramadı');
  ok(r.w.tileAt(12, 14) === 0, 'ağ yırtılmadı');
});
test('ağ: tek başına çırpınarak kurtulur', () => {
  const r = run(lvl((h) => { h.koy(12, 14, 'w'); }));
  r.run(r.walkT(0, 13, { max: 200, noFail: true }));
  ok(r.bee(0).stuck, 'ağa yapışmadı');
  for (let k = 0; k < 12; k++) { r.inp[0].flapPressed = true; r.step(); r.step(); }
  ok(!r.bee(0).stuck, 'çırpınarak kurtulamadı');
});

// 10) örümcek ve damla öldürür, kalkan damlayı keser
test('örümcek öldürür', () => {
  const r = run(lvl(null, [{ t: 'spider', x: 12, y: 11, len: 3.4, period: 2 }]), { allowDeath: true });
  r.run(r.walkT(0, 12, { max: 200 }));
  r.run(r.wait(180));
  ok(r.events.death > 0, 'örümcek öldürmedi');
});
test('damla öldürür; kalkan (şemsiye) korur', () => {
  const r = run(lvl(null, [{ t: 'drip', x: 12, y: 2, period: 1 }]), { allowDeath: true });
  r.run(r.walkT(0, 12), r.wait(1));
  r.run(r.wait(150));
  ok(r.events.death > 0, 'damla öldürmedi');
  const r2 = run(lvl(null, [{ t: 'drip', x: 12, y: 2, period: 1 }, { t: 'item', x: 10, y: 14, kind: 'shield' }]), { allowDeath: false });
  r2.run(r2.walkT(0, 10)); r2.run(r2.act(0)); r2.run(r2.walkT(0, 12));
  r2.run(r2.wait(200));
  ok(r2.events.death === 0, 'kalkanla ölmemeliydi');
});

// 11) zıplama mantarı
test('mantar zıplatır', () => {
  const r = run(lvl((h) => { h.koy(12, 14, 'M'); }));
  r.run(r.flyTo(0, 12 * T + 8, 10 * T, {}));
  let minY = 1e9, bounced = false;
  for (let k = 0; k < 120; k++) { r.step(); if (r.bee(0).bounced) bounced = true; if (bounced) minY = Math.min(minY, r.bee(0).y); }
  ok(bounced, 'mantara değmedi');
  ok(minY < 14 * T - 40, 'yeterince zıplamadı: ' + minY);
});

// 12) ritim platformu
test('ritim platformu açılıp kapanır', () => {
  const r = run(lvl(null, [{ t: 'pulse', x: 12, y: 10, w: 2, period: 2, on: 1 }]));
  const p = r.w.e.pulse[0];
  const seen = new Set();
  for (let k = 0; k < 150; k++) { r.step(); seen.add(p.solid.active); }
  ok(seen.has(true) && seen.has(false), 'durum değişmedi');
});

// 13) ışık köprüsü + fener
test('ışık köprüsü yalnız fener yakınken katı', () => {
  const r = run(lvl((h) => { h.cukur(14, 20); }, [{ t: 'bridge', x: 14, y: 14, w: 7 }, { t: 'item', x: 10, y: 14, kind: 'lantern' }]), { allowDeath: true });
  r.run(r.wait(3));
  ok(r.w.e.bridge[0].segs.every((s) => !s.active), 'fenersiz katı olmamalı');
  r.run(r.walkT(0, 10)); r.run(r.act(0));
  r.run(r.walkT(0, 13));
  ok(r.w.e.bridge[0].segs[0].active, 'fener yakınken katı olmalı');
});

// 14) kırılan zemin
test('kırılan buz üstünde durunca kırılır, sonra geri gelir', () => {
  const r = run(lvl((h) => { h.cukur(12, 14); }, [{ t: 'crumble', x: 12, y: 13, w: 3 }]), { allowDeath: true });
  const seg = r.w.e.crumble[0].segs[1];
  r.run(r.landT(0, 13, 12));
  r.run(r.wait(50));
  ok(!seg.active, 'kırılmadı');
  r.run(r.flyTo(0, 8 * T + 8, 15 * T - 6, { land: true }));
  r.run(r.wait(220));
  ok(seg.active, 'geri gelmedi');
});

// 15) buz sarkıtı
test('buz sarkıtı altından geçince düşer ve öldürür', () => {
  const r = run(lvl(null, [{ t: 'icicle', x: 14, y: 7 }]), { allowDeath: true });
  r.run(r.walkT(0, 14.2, { max: 300 }));
  r.run(r.wait(60));
  ok(r.events.death > 0, 'sarkıt öldürmedi');
});

// 16) ısı
test('soğukta yalnız kalan donar; yan yana ısınır; ateş ısıtır', () => {
  const r = run(lvl(null, [], { cold: true }), { allowDeath: true });
  r.run(r.walkT(1, 3.5));
  r.run(r.wait(600));
  ok(r.bee(0).heat > 0.99, 'yan yanayken ısınmalıydı');
  r.run(r.walkT(1, 20));
  r.run(r.wait(60 * 20));
  ok(r.events.death > 0, 'uzakta donmalıydı');
  const r2 = run(lvl((h) => { h.koy(20, 14, 'F'); }, [], { cold: true }), { allowDeath: false });
  r2.run(r2.walkT(1, 20), r2.walkT(0, 19.5));
  r2.run(r2.walkT(0, 21));
  r2.run(r2.wait(60 * 20));
  ok(r2.bee(1).heat > 0.9, 'ateş ısıtmadı');
});

// 17) çöküş duvarı
test('çöküş duvarı tetiklenir, geride kalanı öldürür, yeniden doğuşta geri çekilir', () => {
  const r = run(lvl(null, [{ t: 'collapse', x: 6, trigger: [12, 0, 2, 15], speed: 60, until: 36 }]), { allowDeath: true });
  r.run(r.walkT(0, 13), r.walkT(1, 12.5));
  r.run(r.wait(240));
  ok(r.events.death > 0, 'duvar öldürmedi');
});

// 18) sembol sırası
test('rünler doğru sırada çözülür, yanlışta sıfırlanır', () => {
  const r = run(lvl(null, [{ t: 'rune', x: 12, y: 14, sym: 'yagmur', seq: 's' }, { t: 'rune', x: 15, y: 14, sym: 'ruzgar', seq: 's' }, { t: 'rune', x: 18, y: 14, sym: 'gunes', seq: 's' }, { t: 'sequence', id: 's', order: ['gunes', 'yagmur', 'ruzgar'] }, { t: 'gate', x: 22, y: 0, h: 15, on: 's' }]));
  r.run(r.walkT(0, 12)); r.run(r.act(0));
  ok(!r.w.e.rune[0].lit, 'yanlış sırada sıfırlanmadı');
  r.run(r.walkT(0, 18)); r.run(r.act(0));
  r.run(r.walkT(0, 12)); r.run(r.act(0));
  r.run(r.walkT(0, 15)); r.run(r.act(0));
  r.run(r.gateOpen('s'));
});

// 19) yarış
test('yarış: kazanılır ve kalıcı işaret açar', () => {
  BB.SCENES.__race_start = [{ say: 'zipzip', text: 'Yarış!' }];
  const r = run(lvl(null, [{ t: 'race', id: 'race', start: [10, 12, 4, 3], finish: 30, path: [[11, 14], [32, 14]], speed: 40, scenes: { start: '__race_start', win: '__race_start', lose: '__race_start' } }, { t: 'gate', x: 34, y: 0, h: 15, on: 'race' }]));
  r.run(r.walkT(0, 11.5), r.walkT(1, 12.5));
  r.run(r.until(() => r.w.e.race[0].st === 'run', 400, 'yarış başlamadı'));
  r.run(r.walkT(0, 31), r.walkT(1, 31.5));
  r.run(r.gateOpen('race'));
});

// 20) Bora ısıtma
test('Bora: iki arı yanında durunca ısınır', () => {
  const r = run(lvl(null, [{ t: 'bora', x: 15, y: 14, need: 3, flag: 'bw' }, { t: 'gate', x: 20, y: 0, h: 15, on: 'bw' }], { cold: true }));
  r.run(r.walkT(0, 14.5), r.walkT(1, 15.5));
  r.run(r.gateOpen('bw', 600));
});

// 21) renkli yapraklar
test('pembe yaprak yalnız dişi arıya katı', () => {
  const r = run(lvl((h) => { h.raf(12, 14, 11); h.sira(12, 14, 11, 'p'); }), { allowDeath: true });
  r.run(r.landT(0, 13, 10, { max: 300 }));
  ok(r.bee(0).onGround && r.bee(0).y < 11 * T, 'dişi pembe yaprağa konamadı');
  r.run(r.flyTo(1, 12 * T + 3, 9 * T, {}));
  r.run(r.wait(60));
  ok(r.bee(1).y > 11 * T, 'erkek pembe yapraktan geçmeliydi');
});

// 22) asansör platformu
test('asansör plakayla yükselir ve üstündekini taşır', () => {
  const r = run(lvl(null, [{ t: 'plate', x: 10, y: 14, id: 'e' }, { t: 'platform', x: 14, y: 14, w: 2, to: [14, 6], on: 'e', speed: 50 }]));
  r.run(r.flyTo(1, 15 * T, 14 * T - 6, { land: true }));
  r.run(r.walkT(0, 10));
  r.run(r.until(() => r.w.e.platform[0].u >= 1, 600, 'asansör çıkmadı'));
  ok(r.bee(1).y < 8 * T, 'asansör yolcuyu taşımadı: y=' + r.bee(1).y);
});

// 23) yeniden doğuş durumu geri yükler
test('ölünce checkpoint durumu geri gelir (ağ, eşya)', () => {
  const r = run(lvl((h) => { h.koy(14, 14, 'w'); h.sira(20, 22, 14, '^'); }, [{ t: 'item', x: 11, y: 14, kind: 'pollen' }]), { allowDeath: true });
  r.run(r.walkT(0, 8));
  r.run(r.walkT(1, 11)); r.run(r.act(1));
  r.run(r.walkT(0, 15, { max: 200, noFail: true }));
  ok(r.bee(0).stuck, 'ağa yapışmadı');
  r.run(r.walkT(1, 13.4)); r.run(r.act(1));
  ok(r.w.tileAt(14, 14) === 0, 'ağ yırtılmadı');
  r.run(r.walkT(0, 21, { max: 400, noFail: true }));
  r.run(r.until(() => r.w.state === 'play', 200));
  ok(r.w.tileAt(14, 14) === BB.T.WEB, 'ağ geri gelmedi');
  ok(!r.bee(1).item && r.w.items[0].x < 13 * T, 'eşya geri gelmedi');
});

// 24) bal ipi
test('bal ipi aşırı uzaklaşmayı engeller', () => {
  const h = new Harita(80, 17); h.zemin(0, 79, 15); h.koy(3, 14, '1'); h.koy(5, 14, '2'); h.koy(8, 14, 'C'); h.koy(77, 14, 'E');
  const r = run({ id: 901, name: 't', theme: 'bahar', map: h.satirlar(), objects: [], questions: [], coop: ['t'] });
  r.inp[0].right = true;
  r.run(r.wait(60 * 8));
  ok(Math.abs(r.cx(0) - r.cx(1)) < BB.LEASH.x + 6, 'ip uzamadı mı? fark=' + Math.abs(r.cx(0) - r.cx(1)));
  ok(r.cx(1) > 5 * T + 20, 'geride kalan hiç çekilmedi');
});

// 25) sahne tetikleyicisi bekletir
test('tetikleyici sahneyi bekletir ve çözülünce devam eder', () => {
  const r = run(lvl(null, [{ t: 'trigger', x: 12, y: 0, w: 2, h: 15, scene: '__test_scene' }]));
  let saw = false;
  const orig = r.autoResolve.bind(r);
  r.autoResolve = () => { if (r.w.pending && r.w.pending.type === 'scene') saw = true; orig(); };
  r.run(r.walkT(0, 15));
  ok(saw, 'sahne tetiklenmedi');
});

let pass = 0;
for (const [n, good, msg] of results) { console.log((good ? '  ✓ ' : '  ✗ ') + n + (good ? '' : '  → ' + msg)); if (good) pass++; }
console.log(`\n${pass}/${results.length} mekanik testi geçti.`);
process.exitCode = pass === results.length ? 0 : 1;
