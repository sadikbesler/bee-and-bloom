// Dünya 3 — Kehribar Orman (sonbahar) · bekçi Profesör Hu. Çalıştır: node _gelistirme/bolumler/d3.js
// Mekanikler: damla (drip) + yaprak çatılar (=), su birikintisi (~), rüzgâr akımları (yatay/yukarı),
// rüzgâr kalkanı (item shield), Hu'nun sembol bulmacası (rune + sequence).
const { Harita } = require('../harita.js');
const { writeWorld } = require('./yaz.js');

const P = (h, list) => { for (const [c, r] of list) h.koy(c, r, 'o'); };

// ------------------------------------------------------------ 7. Yağmurun İlk Damlası
function L7() {
  const W = 184;
  const h = new Harita(W, 17);
  h.zemin(0, W - 1, 15);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // küçük tepe
  h.zemin(13, 17, 13);
  P(h, [[11, 13], [13, 11], [15, 11], [17, 11]]);
  // su birikintisi 1
  h.doldur(21, 15, 22, 15, '~');
  P(h, [[21, 12], [22, 12]]);
  // damla korusu: yapraklı dal (çatı) ve damlalar
  h.doldur(27, 3, 51, 4, '#');
  h.bosalt(27, 4, 28, 4); h.bosalt(50, 4, 51, 4);
  h.raf(34, 36, 10);            // damlayı tutan yaprak çatı
  h.raf(44, 46, 10);
  P(h, [[32, 13], [38, 13], [42, 13], [48, 13], [34, 9], [46, 9]]);
  h.doldur(25, 4, 26, 14, ':');   // ağaç gövdesi (süs)
  h.doldur(25, 3, 26, 3, '#');
  h.koy(54, 14, 'C');
  h.raf(57, 60, 11); h.raf(59, 61, 8);
  P(h, [[58, 10], [60, 7]]);
  // Hu ve 1. soru
  h.koy(63, 14, 'Q');
  // su birikintisi 2: ortasında taş
  h.doldur(73, 15, 75, 15, '~'); h.doldur(77, 15, 79, 15, '~');
  h.koy(76, 14, '%');
  P(h, [[74, 12], [76, 11], [78, 12]]);
  h.raf(81, 84, 11);
  P(h, [[82, 10], [96, 9]]);
  // Gölge'nin temizlediği ağ: alçak dal
  h.doldur(94, 10, 99, 10, '%');
  h.koy(98, 11, 'w'); h.koy(99, 11, 'w');
  P(h, [[88, 13], [91, 12], [102, 12]]);
  // iş birliği: yüksek dalda plaka (omuz omuza)
  h.koy(106, 14, 'C');
  h.doldur(112, 8, 116, 8, '%');   // havada duran kütük dalı
  h.doldur(113, 9, 115, 9, '%');
  P(h, [[110, 12], [117, 11]]);
  h.koy(124, 14, 'C');
  // yağmur patikası: yayla + çatılar + damlalar
  h.doldur(128, 2, 156, 3, '#');
  h.bosalt(128, 3, 129, 3); h.bosalt(155, 3, 156, 3);
  h.doldur(126, 3, 127, 14, ':');
  h.zemin(131, 136, 13);
  h.zemin(141, 146, 12);
  h.raf(137, 140, 10);
  h.doldur(149, 15, 151, 15, '~');
  P(h, [[133, 12], [135, 12], [140, 9], [143, 11], [145, 11], [150, 12], [154, 13]]);
  // gizli nadir çiçek: yüksek yaprak rafı (omuz omuza)
  h.raf(162, 164, 7);
  h.koy(163, 6, '*');
  h.koy(158, 14, 'C');
  // 2. soru
  h.koy(168, 14, 'Q');
  P(h, [[176, 12], [178, 11]]);
  h.koy(179, 14, 'E');
  return {
    id: 7, world: 3, name: 'Yağmurun İlk Damlası', theme: 'sonbahar', weather: 'rain',
    map: h.satirlar(),
    questions: ['S33', 'A6'],
    scenes: { start: 'L7_start', end: 'L7_end' },
    marks: { golgeA: [92, 14], golgeB: [106, 14] },
    objects: [
      { t: 'decor', x: 2, y: 14, s: 'stump' }, { t: 'decor', x: 9, y: 14, s: 'bush' },
      { t: 'sign', x: 12, y: 14, text: 'Kehribar Orman! Yağmur başladı: damlalara değmeyin.' },
      { t: 'decor', x: 19, y: 14, s: 'rock' },
      { t: 'sign', x: 24, y: 14, text: 'Yaprak çatılar damlayı tutar. Damla düşünce koşun!' },
      { t: 'drip', x: 30, y: 5, period: 1.9, phase: 0 },
      { t: 'drip', x: 35, y: 5, period: 1.7, phase: 0.6 },
      { t: 'drip', x: 40, y: 5, period: 2.0, phase: 1.0 },
      { t: 'drip', x: 45, y: 5, period: 1.6, phase: 0.3 },
      { t: 'drip', x: 49, y: 5, period: 2.1, phase: 1.4 },
      { t: 'decor', x: 52, y: 14, s: 'stump' },
      { t: 'npc', x: 66, y: 14, who: 'hu', face: -1, id: 'hu1' },
      { t: 'gate', x: 70, y: 0, h: 15, on: 'q1', style: 'root' },
      { t: 'decor', x: 82, y: 14, s: 'rock' },
      { t: 'trigger', x: 86, y: 0, w: 2, h: 15, scene: 'L7_golge', need: 'both' },
      { t: 'decor', x: 93, y: 14, s: 'brokenweb' }, { t: 'decor', x: 96, y: 14, s: 'brokenweb' },
      { t: 'decor', x: 100, y: 14, s: 'fur' },
      { t: 'sign', x: 108, y: 14, text: 'Plaka çok yüksekte! Biriniz öbürünün başına konsun; alttaki uçsun, üstteki zıplasın.' },
      { t: 'plate', x: 114, y: 7, id: 'k1' },
      { t: 'gate', x: 120, y: 0, h: 15, on: 'k1', latch: true, coop: true, style: 'root' },
      { t: 'decor', x: 122, y: 14, s: 'bush' },
      { t: 'drip', x: 133, y: 4, period: 1.8, phase: 0.2 },
      { t: 'drip', x: 138, y: 4, period: 1.6, phase: 0.9 },
      { t: 'drip', x: 143, y: 4, period: 2.0, phase: 0.5 },
      { t: 'drip', x: 148, y: 4, period: 1.7, phase: 1.2 },
      { t: 'drip', x: 153, y: 4, period: 1.9, phase: 0.7 },
      { t: 'decor', x: 147, y: 14, s: 'stump' },
      { t: 'decor', x: 160, y: 14, s: 'rock' },
      { t: 'npc', x: 171, y: 14, who: 'hu', face: -1, id: 'hu2' },
      { t: 'gate', x: 174, y: 0, h: 15, on: 'q2', style: 'root' },
      { t: 'decor', x: 182, y: 14, s: 'bush' },
    ],
  };
}

// ------------------------------------------------------------ 8. Yaprak Rüzgârı
function L8() {
  const W = 192;
  const h = new Harita(W, 17);
  h.zemin(0, W - 1, 15);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // gizli nadir çiçek: başlangıcın üstünde yüksek yaprak rafı (omuz omuza)
  h.raf(11, 13, 7);
  h.koy(12, 6, '*');
  // arkadan esen rüzgârla geçilen dikenli çukur
  h.doldur(18, 15, 31, 15, '^');
  P(h, [[20, 10], [23, 9], [26, 9], [29, 10]]);
  h.raf(34, 36, 11);
  P(h, [[35, 10]]);
  h.koy(39, 14, 'C');
  // yukarı esen akım ve yüksek yayla (Hu, 1. soru)
  h.doldur(47, 5, 74, 7, '#');      // yaylanın kalın dalı
  h.zemin(73, 74, 8);               // sağdaki destek duvarı
  h.doldur(57, 8, 60, 14, ':');     // gövde (süs)
  h.raf(51, 54, 11); h.raf(64, 67, 11);
  P(h, [[52, 10], [65, 10], [62, 13]]);
  P(h, [[44, 12], [44, 9], [44, 6], [44, 3], [50, 3], [53, 3], [70, 3]]);
  h.koy(60, 4, 'Q');
  // yayladan iniş
  h.raf(76, 77, 10);
  P(h, [[76, 9]]);
  h.koy(79, 14, 'C');
  // kalkan koridoru: kalın dalın altı, karşıdan esen sert rüzgâr
  h.raf(81, 83, 11);
  h.doldur(84, 7, 107, 9, '#');
  h.koy(92, 14, '%'); h.koy(100, 14, '%');
  P(h, [[88, 13], [91, 12], [96, 13], [98, 12], [104, 13], [90, 5], [95, 5], [100, 5]]);
  h.koy(114, 14, 'C');
  // 2. soru
  h.koy(120, 14, 'Q');
  // Fırtına Dalı
  h.koy(130, 14, 'C');
  h.koy(133, 14, '%'); h.doldur(134, 13, 134, 14, '%');
  h.doldur(135, 12, 176, 12, '#');
  h.doldur(135, 15, 175, 15, '^');
  for (const c of [140, 146, 152, 158, 164, 170]) h.koy(c, 11, '%');
  P(h, [[138, 10], [143, 9], [149, 10], [155, 9], [161, 10], [167, 9], [173, 10]]);
  h.koy(182, 14, 'C');
  P(h, [[185, 12]]);
  h.koy(187, 14, 'E');
  return {
    id: 8, world: 3, name: 'Yaprak Rüzgârı', theme: 'sonbahar', weather: 'leaves',
    map: h.satirlar(),
    questions: ['S29', 'A9'],
    scenes: { start: 'L8_start', end: 'L8_end' },
    objects: [
      { t: 'decor', x: 2, y: 14, s: 'bush' }, { t: 'decor', x: 8, y: 14, s: 'stump' },
      { t: 'sign', x: 15, y: 14, text: 'Rüzgâr arkanızdan esiyor: uçun, sizi karşıya taşısın!' },
      { t: 'wind', x: 16, y: 4, w: 18, h: 11, vx: 75 },
      { t: 'decor', x: 37, y: 14, s: 'rock' },
      { t: 'sign', x: 42, y: 14, text: 'Yukarı esen akıma girin, kanadı basılı tutun!' },
      { t: 'wind', x: 43, y: 1, w: 3, h: 14, vy: -160 },
      { t: 'decor', x: 57, y: 4, s: 'feather' },
      { t: 'npc', x: 63, y: 4, who: 'hu', face: -1, id: 'hu1' },
      { t: 'gate', x: 66, y: 0, h: 5, on: 'q1', style: 'root' },
      { t: 'decor', x: 72, y: 4, s: 'bush' },
      { t: 'item', x: 81, y: 14, kind: 'shield' },
      { t: 'sign', x: 77, y: 14, text: 'Kalkanı tutan rüzgârdan etkilenmez ama uçamaz. Öbürünüz arkasında, gölgesinde uçsun!' },
      { t: 'wind', x: 84, y: 10, w: 24, h: 5, vx: -200 },
      { t: 'gate', x: 107, y: 0, h: 7, on: 'k1', latch: true, coop: true, style: 'root' },
      { t: 'plate', x: 110, y: 14, id: 'k1' },
      { t: 'decor', x: 112, y: 14, s: 'stump' },
      { t: 'npc', x: 123, y: 14, who: 'hu', face: -1, id: 'hu2' },
      { t: 'gate', x: 126, y: 0, h: 15, on: 'q2', style: 'root' },
      { t: 'decor', x: 128, y: 14, s: 'feather' },
      { t: 'item', x: 131, y: 14, kind: 'shield' },
      { t: 'mastery', x: 134, w: 43, name: 'Fırtına Dalı' },
      { t: 'wind', x: 135, y: 4, w: 42, h: 8, vx: -150, gust: { period: 3.2, on: 2.2, phase: 0 } },
      { t: 'sign', x: 179, y: 14, text: 'Fırtınayı birlikte aştınız! Kovan yolu açık.' },
      { t: 'decor', x: 184, y: 14, s: 'flowers' },
      { t: 'decor', x: 190, y: 14, s: 'bush' },
    ],
  };
}

// ------------------------------------------------------------ 9. Bilge Ağaç (dikey: dört kat dal, kovuktan esen akımlar)
function L9() {
  const W = 64, H = 52;
  const h = new Harita(W, H);
  h.zemin(0, W - 1, 50);
  // gövde (arka plan) ve dal katmanları; her katta kovuktan yukarı esen bir akım
  h.doldur(26, 15, 37, 49, ':');
  const kat = (r, d0, d1) => {
    h.doldur(3, r, 60, r + 1, '#'); h.bosalt(d0, r, d1, r + 1);
    h.bosalt(3, r + 1, 5, r + 1); h.bosalt(58, r + 1, 60, r + 1);   // incelen dal uçları
  };
  kat(37, 28, 31); kat(25, 44, 47); kat(13, 16, 19);
  // ---- zemin katı
  h.koy(5, 49, '1'); h.koy(7, 49, '2');
  h.koy(13, 49, 'Q');
  h.koy(24, 49, 'C');
  h.doldur(40, 50, 42, 50, '~');
  h.raf(38, 40, 46); h.raf(45, 48, 45); h.raf(52, 55, 44);
  P(h, [[10, 46], [39, 45], [42, 47], [46, 44], [53, 43], [57, 47], [24, 45], [39, 41]]);
  // ---- 1. kat: yağmur, çift plaka
  h.koy(24, 36, 'C');
  h.raf(7, 10, 32); h.raf(14, 17, 32);
  h.raf(50, 54, 33);
  P(h, [[8, 31], [15, 31], [11, 35], [40, 34], [42, 31], [56, 35]]);
  // ---- 2. kat: Hu'nun sembol taşları
  h.koy(40, 24, 'C');
  h.raf(38, 41, 20); h.raf(21, 24, 20);
  h.raf(8, 11, 21);
  P(h, [[9, 20], [41, 19], [39, 22], [52, 22], [25, 22]]);
  // ---- 3. kat (tepe): 2. soru, gizli çiçek, çıkış
  h.koy(23, 12, 'C');
  h.doldur(5, 2, 12, 3, '#'); h.doldur(28, 1, 35, 2, '#'); h.doldur(50, 2, 58, 3, '#');
  h.raf(48, 50, 5);
  h.koy(49, 4, '*');
  h.koy(36, 12, 'Q');
  P(h, [[28, 9], [31, 8], [46, 10], [52, 9], [10, 9], [6, 11]]);
  h.koy(56, 12, 'E');
  return {
    id: 9, world: 3, name: 'Bilge Ağaç', theme: 'sonbahar', weather: 'leaves',
    map: h.satirlar(),
    questions: ['S23', 'A4'],
    scenes: { start: 'L9_start', end: 'L9_end' },
    objects: [
      // zemin katı
      { t: 'decor', x: 3, y: 49, s: 'stump' }, { t: 'decor', x: 10, y: 49, s: 'feather' },
      { t: 'npc', x: 16, y: 49, who: 'hu', face: -1, id: 'hu1' },
      { t: 'gate', x: 20, y: 39, h: 11, on: 'q1', style: 'root' },
      { t: 'sign', x: 26, y: 49, text: 'Kovuktan rüzgâr esiyor! İçine girin, kanadı basılı tutun.' },
      { t: 'wind', x: 28, y: 31, w: 4, h: 19, vy: -160 },
      { t: 'decor', x: 34, y: 49, s: 'rock' }, { t: 'decor', x: 48, y: 49, s: 'stump' }, { t: 'decor', x: 58, y: 49, s: 'bush' },
      // 1. kat
      { t: 'drip', x: 8, y: 27, period: 1.8, phase: 0 }, { t: 'drip', x: 15, y: 27, period: 2.0, phase: 0.7 },
      { t: 'drip', x: 12, y: 27, period: 1.7, phase: 1.1 },
      { t: 'sign', x: 34, y: 36, text: 'İki plakaya aynı anda basın: kovuk açılır.' },
      { t: 'plate', x: 36, y: 36, id: 'a' },
      { t: 'plate', x: 52, y: 32, id: 'b' },
      { t: 'gate', x: 44, y: 25, w: 4, h: 2, on: ['a', 'b'], latch: true, coop: true, style: 'root' },
      { t: 'wind', x: 44, y: 18, w: 4, h: 18, vy: -160 },
      { t: 'decor', x: 19, y: 36, s: 'stump' }, { t: 'decor', x: 58, y: 36, s: 'rock' },
      // 2. kat
      { t: 'npc', x: 50, y: 24, who: 'hu', face: 1, id: 'hu2' },
      { t: 'sign', x: 48, y: 24, text: 'Önce gökten düşen, sonra onu taşıyan, sonra yere düşen, en son hepsini kurutan.' },
      { t: 'trigger', x: 54, y: 15, w: 3, h: 10, scene: 'L9_tuy', need: 'any' },
      { t: 'decor', x: 55, y: 24, s: 'fur' },
      { t: 'rune', x: 5, y: 24, sym: 'yagmur', seq: 'hu' },
      { t: 'rune', x: 39, y: 19, sym: 'ruzgar', seq: 'hu' },
      { t: 'rune', x: 59, y: 24, sym: 'yaprak', seq: 'hu' },
      { t: 'rune', x: 22, y: 19, sym: 'gunes', seq: 'hu' },
      { t: 'sequence', id: 'hu', order: ['yagmur', 'ruzgar', 'yaprak', 'gunes'] },
      { t: 'gate', x: 16, y: 13, w: 4, h: 2, on: 'hu', style: 'root' },
      { t: 'wind', x: 16, y: 5, w: 4, h: 19, vy: -160 },
      { t: 'decor', x: 12, y: 24, s: 'stump' }, { t: 'decor', x: 36, y: 24, s: 'feather' },
      // 3. kat
      { t: 'npc', x: 39, y: 12, who: 'hu', face: -1, id: 'hu3' },
      { t: 'gate', x: 42, y: 0, h: 13, on: 'q2', style: 'root' },
      { t: 'decor', x: 26, y: 12, s: 'stump' }, { t: 'decor', x: 53, y: 12, s: 'flowers' }, { t: 'decor', x: 60, y: 12, s: 'bush' },
    ],
  };
}

const levels = [L7(), L8(), L9()];
if (require.main === module) {
  const f = writeWorld(3, 'Kehribar Orman', levels, '_gelistirme/bolumler/d3.js');
  console.log('yazıldı:', f);
  if (process.argv.includes('--cetvel')) for (const L of levels) { const hh = new Harita(L.map[0].length, L.map.length); hh.g = L.map.map((r) => r.split('')); console.log(hh.cetvel()); }
}
module.exports = { levels };
