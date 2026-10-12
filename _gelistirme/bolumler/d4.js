// Dünya 4 — Mantar Mağarası (gece, karanlık) · bekçi Ateş Böceği Işıl. Çalıştır: node _gelistirme/bolumler/d4.js
// Mekanikler: karanlık + fener (item lantern) + ışık köprüleri (bridge), sabit ışıklar (glow),
// zıplama mantarları (M), ritim platformları (pulse), çöküş kaçışı (collapse).
// Not: mantar + kanat basılı ~8 karo yükseltir (ölçüm: _gelistirme/cikti/ajan4/olcum.js); omuz omuza
// istenen raflar mantarlardan uzakta tutulur.
const { Harita } = require('../harita.js');
const { writeWorld } = require('./yaz.js');

const P = (h, list) => { for (const [c, r] of list) h.koy(c, r, 'o'); };
const glow = (x, y, r) => ({ t: 'glow', x, y, r: r || 40 });

// ------------------------------------------------------------ 10. Karanlığa Giriş (fener + ışık köprüleri)
function L10() {
  const W = 186;
  const h = new Harita(W, 18);
  h.zemin(0, W - 1, 15);
  // mağara tavanı (düzensiz)
  h.doldur(0, 0, W - 1, 0, '#');
  for (const [c0, c1, r] of [[0, 9, 3], [10, 20, 1], [24, 40, 2], [44, 52, 1], [72, 80, 2], [104, 114, 2], [134, 146, 1], [166, 185, 2]]) h.doldur(c0, 0, c1, r, '#');
  h.doldur(0, 4, 2, 14, '%');
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  P(h, [[9, 13], [16, 12]]);
  h.koy(14, 14, 'Q');
  // 1. karanlık çukur: ışık köprüsü (12 karo: tek kanatla aşılmaz)
  h.cukur(27, 38); h.doldur(24, 0, 40, 2, '#');
  P(h, [[29, 13], [32, 12], [35, 12], [38, 13]]);
  h.koy(46, 14, 'C');
  // köprü basamağıyla çıkılan yüksek kaya (6 karo)
  h.zemin(58, 70, 9);
  P(h, [[55, 10], [60, 7], [64, 6], [68, 7], [73, 12]]);
  h.koy(78, 14, 'C');
  // iş birliği: iki ışık taşı (biri yerde, biri köprü merdiveniyle çıkılan kovukta)
  h.doldur(92, 6, 99, 7, '%');
  P(h, [[88, 10], [90, 7], [94, 4], [97, 4], [86, 12]]);
  h.koy(108, 14, 'C');
  // 2. karanlık çukur: inip çıkan köprüler
  h.cukur(116, 135);
  h.doldur(122, 0, 129, 8, '#'); h.sira(122, 129, 9, 'v');
  P(h, [[118, 13], [121, 13], [125, 11], [128, 11], [132, 13]]);
  h.koy(140, 14, 'C');
  h.koy(149, 14, 'Q');
  // gizli: yüksek raf (omuz omuza)
  h.raf(159, 161, 7);
  h.koy(160, 6, '*');
  P(h, [[156, 12], [164, 12], [168, 13], [172, 12]]);
  h.koy(179, 14, 'E');
  return {
    id: 10, world: 4, name: 'Karanlığa Giriş', theme: 'magara', weather: 'fireflies', dark: true,
    map: h.satirlar(), _h: h,
    questions: ['F13', 'S31'],
    scenes: { start: 'L10_start', end: 'L10_end' },
    objects: [
      { t: 'decor', x: 3, y: 14, s: 'crystal' },
      { t: 'sign', x: 8, y: 14, text: 'Mantar Mağarası karanlıktır. Yakın durun: ışığınız birbirinize yeter.' },
      { t: 'npc', x: 11, y: 14, who: 'isil', face: -1, id: 'isil' },
      { t: 'gate', x: 18, y: 2, h: 13, on: 'q1' },
      { t: 'item', x: 21, y: 14, kind: 'lantern' },
      { t: 'sign', x: 23, y: 14, text: 'Feneri eylem tuşuyla alın. Işık köprüleri yalnız fenerin yanında belirir!' },
      { t: 'bridge', x: 27, y: 15, w: 12 },
      glow(25, 13, 30), glow(41, 13, 30),
      { t: 'decor', x: 42, y: 14, s: 'paw' }, { t: 'decor', x: 44, y: 14, s: 'paw' },
      { t: 'decor', x: 49, y: 14, s: 'crystal' }, glow(49, 13),
      { t: 'sign', x: 52, y: 14, text: 'Kaya çok yüksek. Feneri basamağa yaklaştırın!' },
      { t: 'bridge', x: 54, y: 12, w: 3 },
      { t: 'decor', x: 63, y: 8, s: 'crystal' }, glow(63, 7),
      { t: 'decor', x: 75, y: 14, s: 'paw' },
      glow(80, 13, 30),
      { t: 'sign', x: 82, y: 14, text: 'İki ışık taşına aynı anda basın. Yukarıdakine fenerle çıkılır!' },
      { t: 'plate', x: 85, y: 14, id: 'a' },
      { t: 'bridge', x: 87, y: 12, w: 3 },
      { t: 'bridge', x: 89, y: 9, w: 3 },
      { t: 'plate', x: 96, y: 5, id: 'b' }, glow(96, 4, 30),
      { t: 'gate', x: 102, y: 1, h: 14, on: ['a', 'b'], latch: true, coop: true },
      { t: 'decor', x: 105, y: 14, s: 'paw' },
      glow(110, 13, 30),
      { t: 'item', x: 112, y: 14, kind: 'lantern' },
      { t: 'sign', x: 114, y: 14, text: 'Köprüler iner, çıkar. Feneri taşıyanın peşinden ayrılmayın!' },
      { t: 'bridge', x: 116, y: 15, w: 6 },
      { t: 'bridge', x: 122, y: 13, w: 8 },
      { t: 'bridge', x: 130, y: 15, w: 6 },
      { t: 'decor', x: 137, y: 14, s: 'paw' }, { t: 'decor', x: 143, y: 14, s: 'fur' },
      { t: 'npc', x: 146, y: 14, who: 'isil', face: -1, id: 'isil2' },
      { t: 'gate', x: 153, y: 1, h: 14, on: 'q2' },
      { t: 'sign', x: 156, y: 14, text: 'O raf çok yüksek… Biriniz öbürünün başına konsun!' },
      glow(160, 5, 26),
      { t: 'decor', x: 166, y: 14, s: 'paw' }, { t: 'decor', x: 170, y: 14, s: 'crystal' }, glow(170, 13),
      { t: 'decor', x: 175, y: 14, s: 'paw' },
    ],
  };
}

// ------------------------------------------------------------ 11. Fısıldayan Mantarlar (zıplama mantarları + ritim)
function L11() {
  const W = 196;
  const h = new Harita(W, 18);
  h.zemin(0, W - 1, 15);
  h.doldur(0, 0, W - 1, 0, '#');
  for (const [c0, c1, r] of [[0, 12, 2], [26, 40, 2], [44, 60, 1], [66, 79, 2], [146, 160, 2], [176, 195, 2]]) h.doldur(c0, 0, c1, r, '#');
  h.doldur(0, 3, 2, 14, '%');
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // ilk mantar: 7 karoluk kaya (mantarsız çıkılmaz)
  h.koy(15, 14, 'M');
  h.zemin(16, 24, 10);
  P(h, [[15, 11], [15, 8], [18, 8], [22, 8], [26, 11]]);
  h.koy(32, 14, 'Q');
  h.koy(42, 14, 'C');
  // dikenli tarla üstünde mantar zinciri
  h.doldur(48, 14, 66, 14, '^');
  for (const c of [50, 56, 62]) { h.koy(c, 14, 'M'); h.koy(c, 15, '%'); }
  P(h, [[50, 9], [53, 8], [56, 9], [59, 8], [62, 9], [65, 10]]);
  h.koy(74, 14, 'C');
  // fısıldayan koridor: çiçeği açık tutma
  h.doldur(80, 0, 100, 9, '#');
  h.doldur(80, 10, 80, 10, '#'); h.doldur(100, 10, 100, 10, '#');
  P(h, [[82, 12], [93, 12], [96, 12]]);
  h.koy(104, 14, 'C');
  // Ritim Köprüsü (Ustalık Geçidi)
  h.cukur(110, 145);
  h.doldur(108, 0, 147, 2, '#');
  P(h, [[112, 11], [117, 9], [122, 10], [127, 8], [132, 10], [137, 9], [142, 11]]);
  h.koy(152, 14, 'C');
  h.koy(162, 14, 'Q');
  // gizli: yüksek raf (omuz omuza; mantarlardan uzak)
  h.raf(172, 174, 7);
  h.koy(173, 6, '*');
  P(h, [[169, 12], [177, 12], [181, 13], [185, 12]]);
  h.koy(190, 14, 'E');
  // ritim platformları: tekler ve çiftler sırayla yanar (biri sönerken öbürü yanar)
  const rit = [[111, 13], [116, 11], [121, 12], [126, 10], [131, 12], [136, 11], [141, 13]];
  const pulses = [], glows = [];
  rit.forEach(([c, rr], k) => { pulses.push({ t: 'pulse', x: c, y: rr, w: 2, period: 2.8, on: 1.4, phase: k % 2 ? 1.4 : 0 }); glows.push(glow(c + 1, rr, 22)); });
  return {
    id: 11, world: 4, name: 'Fısıldayan Mantarlar', theme: 'magara', weather: 'fireflies', dark: true,
    map: h.satirlar(), _h: h,
    questions: ['S26', 'A10'],
    scenes: { start: 'L11_start', end: 'L11_end' },
    objects: [
      { t: 'decor', x: 3, y: 14, s: 'crystal' },
      { t: 'sign', x: 9, y: 14, text: 'Mantara konun: zıplatır! Kanadı basılı tutarsanız çok daha yükseğe çıkarsınız.' },
      glow(15, 13, 30), glow(20, 9, 30),
      { t: 'decor', x: 21, y: 9, s: 'crystal' },
      { t: 'npc', x: 29, y: 14, who: 'isil', face: -1, id: 'isil' },
      { t: 'gate', x: 36, y: 3, h: 12, on: 'q1' },
      { t: 'decor', x: 39, y: 14, s: 'crystal' }, glow(39, 13, 30),
      { t: 'sign', x: 45, y: 14, text: 'Dikenlere basmayın: mantardan mantara sekin!' },
      glow(50, 13, 28), glow(56, 13, 28), glow(62, 13, 28),
      { t: 'decor', x: 70, y: 14, s: 'rock' }, glow(76, 13, 30),
      { t: 'sign', x: 78, y: 14, text: 'Fısıldayan çiçek kapıyı açık tutar. Biriniz tutsun, öbürü geçsin; karşıda da bir çiçek var!' },
      { t: 'flower', x: 83, y: 14, id: 'f1' }, glow(83, 13, 26),
      { t: 'gate', x: 86, y: 10, h: 5, on: ['f1', 'f2'], any: true, coop: true },
      { t: 'flower', x: 89, y: 14, id: 'f2' }, glow(89, 13, 26),
      { t: 'decor', x: 94, y: 14, s: 'crystal' }, glow(97, 13, 26),
      glow(104, 13, 30),
      { t: 'sign', x: 106, y: 14, text: 'Parlayan mantar basılır. Sönmeden önce göz kırpar: ritmi bekleyin!' },
      { t: 'mastery', x: 108, w: 3, name: 'Ritim Köprüsü' },
      ...pulses, ...glows,
      { t: 'decor', x: 148, y: 14, s: 'crystal' }, glow(152, 13, 30),
      { t: 'npc', x: 159, y: 14, who: 'isil', face: -1, id: 'isil2' },
      { t: 'gate', x: 166, y: 3, h: 12, on: 'q2' },
      { t: 'sign', x: 169, y: 14, text: 'Raftaki çiçeğe tek kanat yetmez…' },
      glow(173, 5, 24),
      { t: 'decor', x: 180, y: 14, s: 'rock' }, { t: 'decor', x: 186, y: 14, s: 'crystal' }, glow(186, 13, 30),
    ],
  };
}

// ------------------------------------------------------------ 12. Işıl'ın Hatırası (sessiz oda + çöküş kaçışı)
function L12() {
  const W = 226;
  const h = new Harita(W, 18);
  h.zemin(0, W - 1, 15);
  h.doldur(0, 0, W - 1, 0, '#');
  for (const [c0, c1, r] of [[0, 12, 2], [30, 40, 2], [52, 66, 1], [104, 118, 2], [134, 150, 1], [176, 190, 2], [200, 225, 2]]) h.doldur(c0, 0, c1, r, '#');
  h.doldur(0, 3, 2, 14, '%');
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // fenerle geçilen çukur
  h.cukur(16, 27);
  P(h, [[18, 11], [21, 11], [24, 11], [27, 11], [12, 13]]);
  h.koy(33, 14, 'C');
  // iş birliği: yüksek rafta hatıra taşı (omuz omuza)
  h.raf(43, 45, 8);
  P(h, [[39, 12], [44, 6], [48, 12]]);
  // gizli: yüksek raf
  h.raf(57, 59, 7);
  h.koy(58, 6, '*');
  P(h, [[54, 13], [62, 13]]);
  h.koy(67, 14, 'C');
  // Işıl'ın sessiz odası
  h.doldur(71, 0, 97, 6, '#'); h.doldur(71, 7, 71, 8, '#'); h.doldur(97, 7, 97, 8, '#');
  h.koy(76, 14, 'Q');
  h.koy(88, 14, 'Q');
  h.koy(99, 14, 'C');
  // Çöküş Kaçışı
  h.cukur(110, 116);
  P(h, [[111, 12], [113, 11], [115, 12]]);
  h.koy(120, 14, 'M');
  h.zemin(122, 132, 11);
  P(h, [[121, 10], [125, 9], [129, 9]]);
  h.cukur(141, 148);
  P(h, [[142, 11], [145, 10], [147, 11]]);
  h.koy(156, 14, 'C');
  h.doldur(162, 0, 175, 10, '#'); h.sira(164, 173, 11, 'v');
  P(h, [[165, 13], [169, 13], [173, 13]]);
  h.doldur(180, 14, 182, 14, '^'); h.doldur(187, 14, 189, 14, '^');
  P(h, [[181, 12], [188, 12]]);
  h.cukur(194, 201);
  P(h, [[195, 12], [198, 11], [201, 12]]);
  h.koy(207, 14, 'C');
  P(h, [[211, 13], [214, 13]]);
  h.koy(219, 14, 'E');
  return {
    id: 12, world: 4, name: 'Işıl\'ın Hatırası', theme: 'magara', weather: 'fireflies', dark: true,
    map: h.satirlar(), _h: h,
    questions: ['F18', 'A5'],
    scenes: { start: 'L12_start', end: 'L12_end' },
    objects: [
      { t: 'decor', x: 3, y: 14, s: 'crystal' },
      { t: 'item', x: 10, y: 14, kind: 'lantern' }, glow(9, 13, 30),
      { t: 'sign', x: 13, y: 14, text: 'Mağaranın en derini. Feneri alın, köprü yine ışıkta belirir.' },
      { t: 'bridge', x: 16, y: 13, w: 12 },
      glow(30, 13, 30), { t: 'decor', x: 30, y: 14, s: 'paw' },
      { t: 'sign', x: 37, y: 14, text: 'Hatıra taşı çok yüksekte. Biriniz öbürünün başına konsun, alttaki uçsun!' },
      { t: 'plate', x: 44, y: 7, id: 'tas' }, glow(44, 6, 28),
      { t: 'gate', x: 50, y: 2, h: 13, on: 'tas', latch: true, coop: true },
      { t: 'decor', x: 53, y: 14, s: 'crystal' }, glow(53, 13, 30),
      glow(58, 5, 24),
      { t: 'decor', x: 63, y: 14, s: 'fur' },
      glow(67, 13, 30),
      { t: 'decor', x: 73, y: 14, s: 'crystal' },
      { t: 'npc', x: 79, y: 14, who: 'isil', face: -1, id: 'isil' },
      { t: 'gate', x: 82, y: 7, h: 8, on: 'q1' },
      { t: 'trigger', x: 84, y: 7, w: 2, h: 8, scene: 'L12_hatira', need: 'both' },
      { t: 'decor', x: 86, y: 14, s: 'lantern_post' },
      { t: 'npc', x: 91, y: 14, who: 'isil', face: -1, id: 'isil2' },
      { t: 'gate', x: 94, y: 7, h: 8, on: 'q2' },
      glow(99, 13, 34),
      { t: 'mastery', x: 101, w: 3, name: 'Çöküş Kaçışı' },
      { t: 'collapse', x: 96, trigger: [103, 0, 2, 18], speed: 64, until: 216, scene: 'L12_cokus' },
      { t: 'sign', x: 106, y: 14, text: 'Durmayın! Birbirinizi bekleyin ama durmayın!' },
      glow(109, 13, 30), glow(117, 13, 30), glow(120, 13, 30), glow(127, 10, 34), glow(138, 13, 30), glow(150, 13, 30),
      glow(156, 13, 34), glow(162, 13, 30), glow(169, 13, 30), glow(176, 13, 30), glow(184, 13, 30), glow(192, 13, 30),
      glow(203, 13, 30), glow(207, 13, 34), glow(213, 13, 30),
      { t: 'decor', x: 153, y: 14, s: 'paw' }, { t: 'decor', x: 210, y: 14, s: 'paw' },
    ],
  };
}

const levels = [L10(), L11(), L12()];
if (require.main === module) {
  if (process.argv.includes('--cetvel')) {
    for (const L of levels) console.log(`\n== ${L.id}\n` + L._h.cetvel());
  }
  const f = writeWorld(4, 'Mantar Mağarası', levels.map((L) => { const c = Object.assign({}, L); delete c._h; return c; }), '_gelistirme/bolumler/d4.js');
  console.log('yazıldı:', f);
}
module.exports = { levels };
