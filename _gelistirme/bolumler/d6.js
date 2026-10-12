// Dünya 6 — Kovan'ın Kalbi (kovan) · bütün mekanikler. Çalıştır: node _gelistirme/bolumler/d6.js → data/dunya6.js
// 16. Kovan Yolu: önceki dört dünyanın kısa tekrarı; her bölütte eski bir dost (Püntür, Zıpzıp, Hu, Işıl) yardım eder.
// 17. Balın Kapısı: bütün mekanikleri karıştıran en zor bölüm; iki Ustalık Geçidi ("Balın Kapısı I", "Balın Kapısı II").
// (18. bölüm, final: _gelistirme/bolumler/d6_final.js → data/dunya6_final.js)
// Not: karanlık (dark) ve soğuk (cold) bölüm genelidir; bu yüzden mağara/kış bölütleri karanlıksız ve ısısızdır
// (fener köprüleri, mantar, ritim, buz, kırılan buz, sarkıt ışıkta da çalışır).
const { Harita } = require('../harita.js');
const { writeWorld } = require('./yaz.js');

const P = (h, list) => { for (const [c, r] of list) h.koy(c, r, 'o'); };
// bal gölü: c0..c1 sütunları, 'ust' satırından haritanın dibine kadar (kovan temasında su bal rengidir)
function gol(h, c0, c1, ust) {
  h.bosalt(c0, 0, c1, ust - 1);
  h.doldur(c0, ust, c1, h.rows - 1, '~');
}
const glow = (x, y, r) => ({ t: 'glow', x, y, r: r || 40 });

// ------------------------------------------------------------ 16. Kovan Yolu
function L16() {
  const W = 232, G = 15;            // G: zeminin üst satırı; göletlerde bal G+1'den başlar, nilüferler G satırında
  const h = new Harita(W, 18);
  h.zemin(0, W - 1, G);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // ---- bahar: Püntür'ün çayırı (yırtılmış ağlar, 1. soru, çiçek kapısı)
  h.zemin(14, 18, 13);
  P(h, [[14, 11], [16, 11], [18, 11]]);
  h.koy(23, 14, 'w');
  h.doldur(26, 8, 29, 8, '%'); h.raf(46, 48, 9);
  P(h, [[23, 12]]);
  h.koy(31, 14, 'Q');
  // cameo dostlar tünekte durur (sahnede diyalog kutusunun üstünde görünsünler)
  const tunek = (c) => { h.raf(c - 1, c + 1, 12); h.doldur(c, 13, c, 14, ':'); };
  tunek(34);
  P(h, [[27, 7], [40, 12], [47, 8]]);
  h.koy(50, 14, 'C');
  // ---- yaz: Zıpzıp'ın gölü (2. soru, tek ve çift nilüfer)
  tunek(60);                        // Zıpzıp'ın tahtı
  h.koy(56, 14, 'Q');
  gol(h, 67, 77, G + 1);
  P(h, [[72, 11], [75, 12]]);
  h.zemin(78, 81, 14);              // ada
  P(h, [[80, 12]]);
  gol(h, 82, 93, G + 1);
  P(h, [[85, 12], [87, 11]]);
  h.koy(98, 14, 'C');
  // ---- sonbahar: Hu'nun korusu (damlalar + yaprak çatı, yukarı esen akım)
  h.doldur(106, 3, 124, 4, '#');
  h.bosalt(106, 4, 107, 4); h.bosalt(123, 4, 124, 4);
  h.doldur(104, 4, 105, 14, ':');
  tunek(102);
  h.doldur(104, 3, 105, 3, '#');
  h.raf(111, 113, 10); h.raf(118, 120, 10);
  P(h, [[112, 9], [115, 13], [119, 9]]);
  // akımla çıkılan yayla (6 karo: tek kanat yetmez, akım taşır)
  h.zemin(130, 140, 9);
  P(h, [[127, 12], [127, 4], [131, 6], [139, 7]]);
  h.koy(134, 8, 'C');
  // ---- mağara: Işıl'ın yolu (fener + ışık köprüsü, mantar, ritim)
  h.doldur(141, 0, 192, 2, '#');
  for (const [c0, c1, r] of [[146, 150, 3], [158, 163, 3], [176, 181, 3]]) h.doldur(c0, 0, c1, r, '#');
  h.cukur(152, 163);
  h.doldur(152, 0, 163, 2, '#'); h.doldur(158, 0, 163, 3, '#');
  P(h, [[157, 12], [160, 12]]);
  tunek(145);
  h.koy(168, 14, 'M');
  h.zemin(170, 175, 10);
  P(h, [[168, 10], [168, 7], [172, 7]]);
  h.cukur(176, 186);
  h.doldur(176, 0, 192, 2, '#'); h.doldur(176, 0, 181, 3, '#');
  P(h, [[178, 10], [183, 10]]);
  h.zemin(187, 192, 12);
  h.koy(190, 11, 'C');
  // ---- kış: buz pisti, kırılan buz köprüsü, sarkıtlar
  h.doldur(196, 15, 203, 15, 'I');
  h.koy(193, 14, 'F');
  P(h, [[197, 13]]);
  h.cukur(206, 211);
  P(h, [[207, 12], [210, 12]]);
  h.doldur(213, 0, 220, 8, '%');
  // gizli: yüksek raf (omuz omuza)
  h.raf(223, 225, 7);
  h.koy(224, 6, '*');
  P(h, [[215, 13], [227, 12]]);
  h.koy(228, 14, 'E');
  return {
    id: 16, world: 6, name: 'Kovan Yolu', theme: 'kovan', weather: 'pollen',
    map: h.satirlar(),
    questions: ['S39', 'S32'],
    scenes: { start: 'L16_start', end: 'L16_end' },
    objects: [
      { t: 'decor', x: 2, y: 14, s: 'hive' },
      { t: 'npc', x: 8, y: 14, who: 'bora', face: 1, id: 'bora' },
      { t: 'sign', x: 10, y: 14, text: 'Kovan Yolu: bütün mevsimler tek yolda. Dostlarınız yol boyunca sizi bekliyor!' },
      // bahar
      { t: 'decor', x: 21, y: 14, s: 'flowers' },
      { t: 'trigger', x: 24, y: 0, w: 2, h: 15, scene: 'L16_puntur', need: 'both' },
      { t: 'decor', x: 26, y: 14, s: 'brokenweb' }, { t: 'decor', x: 28, y: 14, s: 'brokenweb' },
      { t: 'npc', x: 34, y: 11, who: 'puntur', face: -1, id: 'puntur' },
      { t: 'gate', x: 36, y: 0, h: 15, on: 'q1', style: 'petal' },
      { t: 'sign', x: 38, y: 14, text: 'Çiçek kapısı! Biriniz çiçeği tutsun, öbürü geçip karşıdaki çiçeği tutsun.' },
      { t: 'flower', x: 39, y: 14, id: 'f1' },
      { t: 'gate', x: 42, y: 0, h: 15, on: ['f1', 'f2'], any: true, coop: true, style: 'petal' },
      { t: 'flower', x: 45, y: 14, id: 'f2' },
      { t: 'decor', x: 47, y: 14, s: 'bush' },
      // yaz
      { t: 'trigger', x: 53, y: 0, w: 2, h: 15, scene: 'L16_zipzip', need: 'both' },
      { t: 'npc', x: 60, y: 11, who: 'zipzip', face: -1, id: 'zipzip' },
      { t: 'gate', x: 63, y: 0, h: 15, on: 'q2', style: 'reed' },
      { t: 'sign', x: 65, y: 14, text: 'Yeşil nilüfer tek arı taşır: birer birer! Pembeye ikiniz birlikte konun.' },
      { t: 'decor', x: 66, y: 14, s: 'reeds' },
      { t: 'lily', x: 71, y: G, w: 3, mode: 'cap1' },
      { t: 'decor', x: 78, y: 13, s: 'reeds', flip: true },
      { t: 'lily', x: 86, y: G, w: 3, mode: 'pair' },
      { t: 'decor', x: 94, y: 14, s: 'reeds' },
      // sonbahar
      { t: 'trigger', x: 100, y: 0, w: 2, h: 15, scene: 'L16_hu', need: 'both' },
      { t: 'npc', x: 102, y: 11, who: 'hu', face: -1, id: 'hu' },
      { t: 'sign', x: 103, y: 14, text: 'Damlalar düşünce koşun; yaprak çatıların altı güvenlidir.' },
      { t: 'drip', x: 109, y: 5, period: 1.9, phase: 0 },
      { t: 'drip', x: 112, y: 5, period: 1.7, phase: 0.6 },
      { t: 'drip', x: 115, y: 5, period: 2.0, phase: 1.0 },
      { t: 'drip', x: 119, y: 5, period: 1.6, phase: 0.3 },
      { t: 'drip', x: 122, y: 5, period: 2.1, phase: 1.4 },
      { t: 'decor', x: 125, y: 14, s: 'feather' },
      { t: 'sign', x: 126, y: 14, text: 'Yukarı esen akıma girin, kanadı basılı tutun!' },
      { t: 'wind', x: 127, y: 2, w: 2, h: 13, vy: -160 },
      { t: 'decor', x: 137, y: 8, s: 'stump' },
      // mağara
      { t: 'trigger', x: 141, y: 0, w: 2, h: 15, scene: 'L16_isil', need: 'both' },
      { t: 'npc', x: 145, y: 11, who: 'isil', face: -1, id: 'isil' },
      { t: 'item', x: 148, y: 14, kind: 'lantern' },
      { t: 'sign', x: 150, y: 14, text: 'Işıl\'ın feneri: köprü yalnız fenerin yanında belirir. Fenercinin peşinden ayrılmayın!' },
      { t: 'bridge', x: 152, y: 15, w: 12 },
      glow(146, 12, 30), glow(157, 6, 30), glow(165, 12, 30),
      { t: 'decor', x: 166, y: 14, s: 'crystal' },
      { t: 'sign', x: 167, y: 14, text: 'Mantara konun, kanadı basılı tutun!' },
      glow(168, 12, 26), glow(172, 7, 30),
      { t: 'pulse', x: 178, y: 11, w: 2, period: 2.8, on: 1.4, phase: 0 },
      { t: 'pulse', x: 183, y: 11, w: 2, period: 2.8, on: 1.4, phase: 1.4 },
      glow(179, 10, 22), glow(184, 10, 22),
      { t: 'decor', x: 188, y: 11, s: 'crystal' },
      // kış
      { t: 'decor', x: 194, y: 14, s: 'snowman' },
      { t: 'sign', x: 195, y: 14, text: 'Buz kayar, çatlak buz kırılır: durmadan geçin!' },
      { t: 'crumble', x: 206, y: 15, w: 6 },
      { t: 'icicle', x: 215, y: 9 }, { t: 'icicle', x: 218, y: 9 },
      { t: 'decor', x: 212, y: 14, s: 'paw' },
      { t: 'sign', x: 221, y: 14, text: 'Raftaki çiçeğe tek kanat yetmez…' },
      { t: 'npc', x: 226, y: 14, who: 'bora', face: -1, id: 'bora2' },
      { t: 'decor', x: 230, y: 14, s: 'comb' },
    ],
  };
}

// ------------------------------------------------------------ 17. Balın Kapısı (en zor bölüm)
function L17() {
  const W = 226, G = 15;
  const h = new Harita(W, 18);
  h.zemin(0, W - 1, G);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // ---- petek tavanlı damla koridoru
  h.doldur(15, 3, 38, 4, '%');
  h.bosalt(15, 4, 16, 4); h.bosalt(37, 4, 38, 4);
  h.raf(20, 22, 10); h.raf(29, 31, 10);
  P(h, [[12, 13], [18, 13], [21, 9], [25, 13], [30, 9], [34, 13]]);
  // ---- 1. iş birliği: ağır polen topu yüksek saksıya (taşıma)
  h.zemin(50, 55, 10);
  P(h, [[46, 12], [51, 8], [54, 8]]);
  h.koy(62, 14, 'C');
  // 1. soru (Bora)
  h.koy(67, 14, 'Q');
  h.koy(77, 14, 'C');
  // ---- Balın Kapısı I: dikenli petek çukuru üstünde ritim, mantar ve petek duvarı
  h.doldur(81, 14, 118, 14, '^');
  h.zemin(93, 95, 12);
  h.koy(94, 11, 'M');
  h.zemin(99, 101, 5);
  h.zemin(116, 123, 13);
  P(h, [[82, 10], [87, 9], [94, 7], [100, 3], [106, 6], [112, 8]]);
  h.koy(120, 12, 'C');
  // ---- buz pisti ve sarkıtlar
  h.doldur(126, 15, 133, 15, 'I');
  h.doldur(127, 0, 134, 6, '%');
  P(h, [[128, 13], [131, 13]]);
  // ---- 2. iş birliği: iki ışık taşı (biri yerde, biri fenerle çıkılan petek rafında)
  h.doldur(147, 6, 153, 7, '%');
  P(h, [[143, 10], [146, 7], [149, 4], [152, 4], [139, 12]]);
  // 2. soru (Bora)
  h.koy(161, 14, 'Q');
  h.koy(171, 14, 'C');
  // ---- Balın Kapısı II: bal gölü; sütunlar, esintili kırık petek köprüleri, çift nilüfer
  gol(h, 174, 205, G + 1);
  h.zemin(176, 177, 12); h.zemin(183, 184, 12); h.zemin(193, 194, 12); h.zemin(201, 202, 12);
  P(h, [[176, 10], [180, 9], [184, 10], [187, 12], [190, 12], [194, 10], [198, 9], [202, 10]]);
  h.koy(208, 14, 'C');
  // gizli: yüksek raf (omuz omuza)
  h.raf(213, 215, 7);
  h.koy(214, 6, '*');
  P(h, [[211, 12], [218, 12]]);
  h.koy(221, 14, 'E');
  const gust = (x, w, phase) => ({ t: 'wind', x, y: 0, w, h: 12, vx: -130, gust: { period: 3.4, on: 1.4, phase: phase || 0 } });
  return {
    id: 17, world: 6, name: 'Balın Kapısı', theme: 'kovan', weather: 'pollen',
    map: h.satirlar(),
    questions: ['A1', 'F14'],
    scenes: { start: 'L17_start', end: 'L17_end' },
    objects: [
      { t: 'decor', x: 2, y: 14, s: 'comb' },
      { t: 'npc', x: 9, y: 14, who: 'bora', face: 1, id: 'bora' },
      { t: 'sign', x: 11, y: 14, text: 'Balın Kapısı: kovanın bütün sınavları tek yolda. Birlikte!' },
      { t: 'drip', x: 18, y: 5, period: 1.6, phase: 0 },
      { t: 'drip', x: 21, y: 5, period: 1.5, phase: 0.5 },
      { t: 'drip', x: 25, y: 5, period: 1.7, phase: 1.1 },
      { t: 'drip', x: 30, y: 5, period: 1.4, phase: 0.2 },
      { t: 'drip', x: 34, y: 5, period: 1.8, phase: 0.8 },
      { t: 'decor', x: 40, y: 14, s: 'jar' },
      { t: 'sign', x: 41, y: 14, text: 'Bal topu ağırdır, saksı yüksekte. Biriniz topu alsın, öbürü onu taşısın!' },
      { t: 'item', x: 44, y: 14, kind: 'pollen' },
      { t: 'pot', x: 53, y: 9, id: 'saksi' },
      { t: 'gate', x: 58, y: 0, h: 15, on: 'saksi', coop: true, style: 'wax' },
      { t: 'decor', x: 60, y: 14, s: 'flowers' },
      { t: 'npc', x: 70, y: 14, who: 'bora', face: -1, id: 'bora1' },
      { t: 'gate', x: 73, y: 0, h: 15, on: 'q1', style: 'wax' },
      { t: 'sign', x: 75, y: 14, text: 'Ritim peteklerini bekleyin; mantar sizi duvarın üstüne fırlatır. Kanadı basılı tutun!' },
      { t: 'mastery', x: 80, w: 3, name: 'Balın Kapısı I' },
      { t: 'pulse', x: 81, y: 12, w: 2, period: 2.8, on: 1.4, phase: 0 },
      { t: 'pulse', x: 86, y: 11, w: 2, period: 2.8, on: 1.4, phase: 1.4 },
      { t: 'pulse', x: 105, y: 8, w: 2, period: 2.8, on: 1.4, phase: 0 },
      { t: 'pulse', x: 111, y: 10, w: 2, period: 2.8, on: 1.4, phase: 1.4 },
      { t: 'decor', x: 117, y: 12, s: 'comb' },
      { t: 'sign', x: 124, y: 14, text: 'Buz kayar; sarkıtların altında durmayın!' },
      { t: 'icicle', x: 129, y: 7 }, { t: 'icicle', x: 132, y: 7 },
      { t: 'item', x: 137, y: 14, kind: 'lantern' },
      { t: 'sign', x: 138, y: 14, text: 'İki ışık taşı: biriniz yerdekine, fenerli olan petek rafındakine!' },
      { t: 'plate', x: 140, y: 14, id: 'a' },
      { t: 'bridge', x: 142, y: 12, w: 3 },
      { t: 'bridge', x: 145, y: 9, w: 3 },
      { t: 'plate', x: 151, y: 5, id: 'b' },
      { t: 'gate', x: 156, y: 0, h: 15, on: ['a', 'b'], latch: true, coop: true, style: 'wax' },
      { t: 'decor', x: 158, y: 14, s: 'lantern_post' },
      { t: 'npc', x: 164, y: 14, who: 'bora', face: -1, id: 'bora2' },
      { t: 'gate', x: 167, y: 0, h: 15, on: 'q2', style: 'wax' },
      { t: 'sign', x: 169, y: 14, text: 'Esinti dinince kırık peteklerden durmadan geçin. Pembe nilüfere birlikte!' },
      { t: 'mastery', x: 174, w: 3, name: 'Balın Kapısı II' },
      { t: 'crumble', x: 178, y: 12, w: 5 }, gust(178, 5, 0),
      { t: 'lily', x: 188, y: G, w: 3, mode: 'pair' },
      { t: 'crumble', x: 195, y: 12, w: 6 }, gust(195, 6, 1.7),
      { t: 'decor', x: 206, y: 14, s: 'flowers' },
      { t: 'sign', x: 211, y: 14, text: 'Son bir sır: raf çok yüksek…' },
      { t: 'npc', x: 218, y: 14, who: 'bora', face: -1, id: 'bora3' },
      { t: 'decor', x: 224, y: 14, s: 'hive' },
    ],
  };
}

const levels = [L16(), L17()];
if (require.main === module) {
  const f = writeWorld(6, "Kovan'ın Kalbi", levels, '_gelistirme/bolumler/d6.js');
  console.log('yazıldı:', f);
  if (process.argv.includes('--cetvel')) for (const L of levels) { const hh = new Harita(L.map[0].length, L.map.length); hh.g = L.map.map((r) => r.split('')); console.log(hh.cetvel()); }
}
module.exports = { levels };
