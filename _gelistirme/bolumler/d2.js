// Dünya 2 — Yaz Gölü (yaz). Çalıştır: node _gelistirme/bolumler/d2.js
// Bekçi: Kral Zıpzıp. Mekanikler: su, nilüfer (cap1 / pair), taşıma, akıntı ve şelale (rüzgâr), yusufçuk platformları, yarış.
// Nilüferler suyun hemen üstündeki satıra konur (su yüzeyi satırı + 1 yukarı); batınca ~1.3 sn tepki süresi kalır.
const { Harita } = require('../harita.js');
const { writeWorld } = require('./yaz.js');

// su: c0..c1 sütunları, 'ust' satırından haritanın dibine kadar; üstündeki karo boşaltılır
function gol(h, c0, c1, ust) {
  h.bosalt(c0, 0, c1, ust - 1);
  h.doldur(c0, ust, c1, h.rows - 1, '~');
}
const P = (h, list) => { for (const [c, r] of list) h.koy(c, r, 'o'); };

// ------------------------------------------------------------ 4. Nilüfer Basamakları
function L4() {
  const W = 192, G = 13;           // G: kıyı zemininin üst satırı; su G+1'den başlar, nilüferler G satırında
  const h = new Harita(W, 17);
  h.zemin(0, W - 1, G);
  h.koy(4, 12, '1'); h.koy(6, 12, '2');
  // Zıpzıp'ın tahtı ve ilk soru
  h.doldur(17, 12, 19, 12, '%');
  h.koy(14, 12, 'Q');
  P(h, [[8, 10], [10, 9], [12, 10]]);
  // Gölet A: tek arılık nilüfer (birer birer)
  gol(h, 26, 43, G + 1);
  P(h, [[29, 10], [31, 9], [38, 9], [40, 10]]);
  h.doldur(44, 12, 51, 12, '#');   // ada kıyısı (1 yüksek)
  h.koy(47, 11, 'C');
  // Gölet B: çift nilüfer (birlikte)
  gol(h, 52, 69, G + 1);
  P(h, [[55, 10], [65, 10]]);
  // kıyı tepesi + yüzen ada
  h.doldur(74, 10, 79, 12, '#');
  P(h, [[75, 9], [77, 8], [79, 9]]);
  h.doldur(70, 7, 72, 7, '#');
  P(h, [[71, 6]]);
  // Gölet C: Gölge'nin sıçradığı küçük gölet
  gol(h, 87, 93, G + 1);
  P(h, [[90, 10]]);
  h.koy(99, 12, 'C');
  // Büyük göl: taşıma (13 sütun su)
  gol(h, 104, 116, G + 1);
  P(h, [[107, 9], [110, 8], [113, 9]]);
  h.doldur(121, 12, 127, 12, '#');
  h.koy(124, 11, 'C');
  h.doldur(118, 8, 119, 8, '#');
  P(h, [[118, 7], [119, 7]]);
  // Karışık gölet: çift nilüfer, sonra iki tek nilüfer
  gol(h, 128, 148, G + 1);
  P(h, [[130, 10], [138, 9], [147, 10]]);
  // ikinci soru
  h.koy(153, 12, 'Q');
  // Kral'ın kapısı: plaka yüksek adada (omuz omuza)
  h.doldur(163, 6, 165, 6, '#');
  // gizli: yüksek ada
  h.doldur(176, 6, 178, 6, '#');
  h.koy(177, 5, '*');
  h.doldur(181, 12, W - 1, 12, '#');
  P(h, [[180, 10], [182, 9]]);
  h.koy(186, 11, 'E');
  return {
    id: 4, world: 2, name: 'Nilüfer Basamakları', theme: 'yaz', weather: 'sparkle',
    map: h.satirlar(),
    questions: ['S21', 'S27'],
    scenes: { start: 'L4_start', end: 'L4_end' },
    marks: { golgeA: [85, 12], golgeB: [96, 12] },
    objects: [
      { t: 'decor', x: 1, y: 12, s: 'reeds' }, { t: 'decor', x: 8, y: 12, s: 'flowers' },
      { t: 'npc', x: 18, y: 11, who: 'zipzip', face: -1, id: 'zipzip' },
      { t: 'gate', x: 22, y: 0, h: 13, on: 'q1' },
      { t: 'sign', x: 24, y: 12, text: 'Yeşil nilüfer tek arı taşır. Birer birer geçin!' },
      { t: 'decor', x: 25, y: 12, s: 'reeds' },
      { t: 'lily', x: 33, y: G, w: 3, mode: 'cap1' },
      { t: 'decor', x: 44, y: 11, s: 'reeds', flip: true },
      { t: 'sign', x: 50, y: 11, text: 'Pembe nilüfer tek arıda batar. İkiniz birlikte konun!' },
      { t: 'decor', x: 51, y: 11, s: 'reeds' },
      { t: 'lily', x: 59, y: G, w: 3, mode: 'pair' },
      { t: 'decor', x: 70, y: 12, s: 'reeds', flip: true }, { t: 'decor', x: 76, y: 9, s: 'flowers' },
      { t: 'trigger', x: 80, y: 0, w: 3, h: 13, scene: 'L4_golge', need: 'both' },
      { t: 'decor', x: 86, y: 12, s: 'reeds' },
      { t: 'lily', x: 89, y: G, w: 2, mode: 'cap1' },
      { t: 'decor', x: 96, y: 12, s: 'fur' },
      { t: 'sign', x: 102, y: 12, text: 'Göl tek kanada çok geniş! Biriniz öbürünü taşısın: ortağınızın yanında {k1eylem} / {k2eylem}.' },
      { t: 'decor', x: 103, y: 12, s: 'reeds' },
      { t: 'decor', x: 117, y: 12, s: 'reeds', flip: true }, { t: 'decor', x: 122, y: 11, s: 'bush' },
      { t: 'sign', x: 126, y: 11, text: 'Pembeye birlikte, yeşillere birer birer!' },
      { t: 'lily', x: 133, y: G, w: 3, mode: 'pair' },
      { t: 'lily', x: 140, y: G, w: 2, mode: 'cap1' },
      { t: 'lily', x: 144, y: G, w: 2, mode: 'cap1' },
      { t: 'decor', x: 149, y: 12, s: 'reeds', flip: true },
      { t: 'npc', x: 156, y: 12, who: 'zipzip', face: -1, id: 'zipzip2' },
      { t: 'gate', x: 158, y: 0, h: 13, on: 'q2' },
      { t: 'sign', x: 160, y: 12, text: 'Plaka çok yüksekte! Biriniz öbürünün başına konsun: alttaki uçsun, üstteki tepede zıplasın.' },
      { t: 'plate', x: 164, y: 5, id: 'kral' },
      { t: 'gate', x: 170, y: 0, h: 13, on: 'kral', latch: true, coop: true },
      { t: 'decor', x: 173, y: 12, s: 'rock' }, { t: 'decor', x: 183, y: 11, s: 'flowers' },
      { t: 'decor', x: 189, y: 11, s: 'reeds', flip: true },
    ],
  };
}

// ------------------------------------------------------------ 5. Kamış Tüneli
function L5() {
  const W = 218, G = 13;
  const h = new Harita(W, 17);
  h.zemin(0, W - 1, G);
  h.koy(4, 12, '1'); h.koy(6, 12, '2');
  // ilk soru: Zıpzıp'ın mutfağı
  h.koy(15, 12, 'Q');
  P(h, [[9, 10], [11, 9]]);
  h.koy(22, 12, 'C');
  // kamış tüneli: tavan 7–9. satırlar, içi 10–12; içeride iki havuz
  gol(h, 30, 36, G + 1);
  gol(h, 42, 51, G + 1);
  h.doldur(25, 7, 58, 9, '#');
  h.doldur(25, 10, 58, 12, ':');     // tünel içi (arka duvar; içine nesne karakteri koyma: duvarda delik açar)
  P(h, [[23, 9], [60, 10]]);
  // tavanın üstü: gizli çiçek ve polen (omuz omuza)
  h.koy(27, 6, '*');
  P(h, [[31, 6], [35, 6], [41, 6], [47, 6]]);
  // yarış pisti
  h.koy(61, 12, 'C');
  gol(h, 69, 72, G + 1);
  h.doldur(79, 11, 84, 12, '#');
  gol(h, 85, 94, G + 1);
  h.doldur(95, 12, 103, 12, '#');
  h.koy(99, 11, '%');
  gol(h, 104, 107, G + 1);
  P(h, [[70, 10], [80, 9], [88, 8], [92, 9], [105, 10]]);
  h.koy(118, 12, 'C');
  P(h, [[116, 10], [122, 9]]);
  // ikinci soru (yarıştan sonra)
  h.koy(126, 12, 'Q');
  // yusufçuk asansörü + kamış duvarı
  h.doldur(146, 6, 147, 6, '#');
  P(h, [[140, 9], [144, 4]]);
  // Gölge'nin onardığı köprü
  gol(h, 157, 168, G + 1);
  h.raf(157, 168, G);
  P(h, [[160, 11], [165, 11]]);
  h.koy(172, 12, 'C');
  // Yusufçuk Geçidi: alçak kamış tüneli; feribot yusufçuklar, çift nilüfer, kaya adası, tek nilüfer
  gol(h, 175, 207, G + 1);
  h.doldur(198, 11, 200, G, '#');      // kaya adası
  h.doldur(175, 7, 207, 8, '#');       // tünel tavanı
  h.doldur(175, 9, 207, 12, ':');
  h.doldur(175, 13, 207, 13, '.');
  h.doldur(198, 11, 200, 12, '#');
  P(h, [[184, 6], [194, 6], [209, 10], [211, 9]]);
  h.koy(212, 12, 'E');
  return {
    id: 5, world: 2, name: 'Kamış Tüneli', theme: 'yaz', weather: 'pollen',
    map: h.satirlar(),
    questions: ['S28', 'A7'],
    scenes: { start: 'L5_start', end: 'L5_end' },
    marks: { kopru: [162, 12] },
    objects: [
      { t: 'decor', x: 2, y: 12, s: 'reeds' }, { t: 'decor', x: 10, y: 12, s: 'jar' },
      { t: 'npc', x: 18, y: 12, who: 'zipzip', face: -1, id: 'zipzip' },
      { t: 'gate', x: 20, y: 0, h: 13, on: 'q1' },
      { t: 'sign', x: 24, y: 12, text: 'Tünelde tavan alçak, uzun uçamazsınız. Nilüferlerden birer birer geçin!' },
      { t: 'lily', x: 32, y: G, w: 2, mode: 'cap1' },
      { t: 'lily', x: 44, y: G, w: 2, mode: 'cap1' }, { t: 'lily', x: 48, y: G, w: 2, mode: 'cap1' },
      { t: 'wind', x: 42, y: 10, w: 10, h: 3, vx: 45 },
      { t: 'decor', x: 26, y: 12, s: 'reeds' }, { t: 'decor', x: 38, y: 12, s: 'reeds', flip: true }, { t: 'decor', x: 55, y: 12, s: 'reeds' },
      { t: 'decor', x: 40, y: 6, s: 'reeds' }, { t: 'decor', x: 52, y: 6, s: 'reeds', flip: true }, { t: 'decor', x: 46, y: 6, s: 'flowers' },
      // Kral Yarışı
      { t: 'sign', x: 59, y: 12, text: 'Kral Yarışı! Başlangıç çizgisine ikiniz birden gelin.' },
      { t: 'race', id: 'yaris', start: [63, 10, 4, 3], finish: 110, speed: 60,
        path: [[64, 12], [68, 12], [70, 10], [73, 12], [78, 12], [80, 10], [84, 10], [89, 8], [95, 11], [98, 10], [100, 11], [103, 11], [105, 10], [108, 12], [112, 12]],
        scenes: { start: 'L5_yaris', win: 'L5_yaris_kazan', lose: 'L5_yaris_kaybet' } },
      { t: 'wind', x: 85, y: 4, w: 10, h: 9, vx: 90 },
      { t: 'sign', x: 78, y: 12, text: 'Akıntı sizi ileri taşır!' },
      { t: 'decor', x: 74, y: 12, s: 'flowers' }, { t: 'decor', x: 101, y: 11, s: 'bush' },
      { t: 'gate', x: 113, y: 0, h: 13, on: 'yaris' },
      { t: 'decor', x: 115, y: 12, s: 'flowers' }, { t: 'decor', x: 121, y: 12, s: 'rock' },
      { t: 'npc', x: 129, y: 12, who: 'zipzip', face: -1, id: 'zipzip2' },
      { t: 'gate', x: 131, y: 0, h: 13, on: 'q2' },
      { t: 'sign', x: 132, y: 12, text: 'Biriniz plakada dursun, öbürü yusufçuğa binip yukarıdaki plakaya çıksın!' },
      { t: 'plate', x: 134, y: 12, id: 'kaldirac' },
      { t: 'platform', x: 144, y: 12.6, w: 2, to: [144, 6], on: 'kaldirac', speed: 50, style: 'leaf' },
      { t: 'plate', x: 147, y: 5, id: 'tepe' },
      { t: 'gate', x: 149, y: 0, h: 13, on: 'tepe', latch: true, coop: true },
      { t: 'decor', x: 151, y: 12, s: 'reeds' },
      // köprü
      { t: 'trigger', x: 152, y: 0, w: 3, h: 13, scene: 'L5_kopru', need: 'both' },
      { t: 'decor', x: 156, y: 12, s: 'stump' }, { t: 'decor', x: 161, y: 12, s: 'fur' }, { t: 'decor', x: 164, y: 12, s: 'fur' },
      { t: 'decor', x: 169, y: 12, s: 'stump', flip: true },
      // Yusufçuk Geçidi
      { t: 'mastery', x: 174, w: 4, name: 'Yusufçuk Geçidi' },
      { t: 'sign', x: 173, y: 12, text: 'Yusufçuklar gelip gider. Zamanı kollayın, birlikte binin!' },
      { t: 'platform', x: 176, y: 12, w: 2, to: [181, 12], loop: true, speed: 40, style: 'leaf', start: 0.5 },
      { t: 'lily', x: 185, y: G, w: 3, mode: 'pair' },
      { t: 'platform', x: 189, y: 12, w: 2, to: [195, 10], loop: true, speed: 40, style: 'leaf', start: 0.5 },
      { t: 'lily', x: 203, y: G, w: 2, mode: 'cap1' },
      { t: 'decor', x: 209, y: 12, s: 'reeds', flip: true }, { t: 'decor', x: 215, y: 12, s: 'bush' },
    ],
  };
}

// ------------------------------------------------------------ 6. Şelale Tepesi (kısmen dikey)
// Alt kat: göl kıyısı (A8). Orta: Şelale Tırmanışı (Ustalık Geçidi) — şelale 84–87. sütunlar, aşağı esen rüzgâr.
// Üst kat: şelalenin tepesi (F12), nehir nilüferleri, gün batımında çıkış.
function L6() {
  const W = 120, H = 44, G = 40;    // G: alt zeminin üst satırı
  const h = new Harita(W, H);
  h.zemin(0, W - 1, G);
  h.koy(4, 39, '1'); h.koy(6, 39, '2');
  P(h, [[9, 37], [11, 36]]);
  // alt kat: küçük gölet (tek nilüfer)
  gol(h, 13, 20, G + 1);
  P(h, [[16, 37]]);
  h.koy(24, 39, 'C');
  h.doldur(26, 36, 29, 36, '#');
  P(h, [[27, 35], [28, 35]]);
  // dere: yusufçuk feribotu
  gol(h, 31, 44, G + 1);
  P(h, [[34, 36], [38, 35], [42, 36]]);
  // tepe ve yüzen ada
  h.doldur(48, 37, 53, 39, '#');
  P(h, [[49, 36], [52, 36]]);
  h.doldur(44, 33, 46, 33, '#');
  P(h, [[45, 32]]);
  h.koy(57, 39, 'Q');
  h.koy(65, 39, 'C');
  // Şelale Tırmanışı: şelale 83–87. sütunlar; her geçişte raf kenarı ile şelale arasında 2 sütun boşluk
  gol(h, 81, 89, G + 1);
  h.doldur(71, 36, 74, 36, '#');      // L1
  h.doldur(76, 32, 80, 32, '#');      // L2
  h.koy(78, 31, 'C');
  h.doldur(88, 32, 91, 32, '#');      // R1 (geçiş 1'in inişi)
  h.doldur(93, 28, 97, 28, '#');      // R2 (sarmaşık 95. sütunda)
  h.doldur(90, 21, 94, 21, '#');      // R3 (omuzla çıkılır; geçiş 2 buradan)
  h.koy(93, 20, 'C');
  h.doldur(78, 21, 82, 21, '#');      // L3 (geçiş 2'nin inişi)
  h.doldur(73, 17, 77, 17, '#');      // L4
  h.doldur(68, 13, 72, 13, '#');      // L5
  P(h, [[73, 34], [79, 30], [85, 29], [90, 30], [92, 25], [85, 18], [80, 19], [75, 15], [70, 11]]);
  // sağ yar (kayalık) ve nehir
  h.doldur(100, 9, W - 1, H - 1, '%');
  h.doldur(100, 9, W - 1, 9, '#');
  h.doldur(83, 9, 102, 10, '~');      // nehir (yüzeyi 9. satır); 83–87 şelalenin ağzı
  h.doldur(88, 11, 99, 11, '%');      // nehir yatağı (kemer)
  // sol kıyı (şelalenin tepesi)
  h.doldur(75, 9, 82, 10, '#');
  h.koy(80, 8, 'Q');
  // gizli: yüksek kaya (omuz omuza)
  h.doldur(74, 3, 76, 3, '%');
  h.koy(75, 2, '*');
  P(h, [[87, 6], [92, 5], [98, 6], [107, 6], [110, 5]]);
  h.koy(113, 8, 'E');
  return {
    id: 6, world: 2, name: 'Şelale Tepesi', theme: 'yaz', weather: 'sparkle',
    map: h.satirlar(),
    questions: ['A8', 'F12'],
    scenes: { start: 'L6_start', end: 'L6_end' },
    marks: { veda: [110, 8], tepe: [81, 8] },
    flags: ['baraj'],
    objects: [
      { t: 'decor', x: 2, y: 39, s: 'reeds' }, { t: 'decor', x: 8, y: 39, s: 'flowers' }, { t: 'decor', x: 12, y: 39, s: 'reeds', flip: true },
      { t: 'lily', x: 16, y: G, w: 2, mode: 'cap1' },
      { t: 'decor', x: 21, y: 39, s: 'reeds' }, { t: 'decor', x: 28, y: 35, s: 'flowers' },
      { t: 'sign', x: 29, y: 39, text: 'Yusufçuk geldiğinde birlikte binin!' },
      { t: 'decor', x: 30, y: 39, s: 'reeds', flip: true },
      { t: 'platform', x: 32, y: 39, w: 2, to: [42, 39], loop: true, speed: 45, style: 'leaf', start: 0.5 },
      { t: 'decor', x: 45, y: 39, s: 'reeds' }, { t: 'decor', x: 51, y: 36, s: 'bush' },
      { t: 'npc', x: 60, y: 39, who: 'zipzip', face: -1, id: 'zipzip' },
      { t: 'gate', x: 62, y: 28, h: 12, on: 'q1' },
      { t: 'mastery', x: 66, w: 3, name: 'Şelale Tırmanışı' },
      { t: 'sign', x: 70, y: 39, text: 'Şelale aşağı iter! Tek kanat yetmez: birbirinizi taşıyarak geçin.' },
      { t: 'decor', x: 73, y: 39, s: 'rock' }, { t: 'decor', x: 80, y: 39, s: 'reeds' },
      { t: 'wind', x: 83, y: 11, w: 5, h: 29, vy: 130 },
      { t: 'decor', x: 91, y: 39, s: 'reeds', flip: true }, { t: 'decor', x: 95, y: 39, s: 'rock' },
      { t: 'sign', x: 97, y: 27, text: 'Raf çok yüksek! Biriniz öbürünün başından zıplasın, yukarıdaki plakaya bassın.' },
      { t: 'vine', x: 95, y: 27, h: 7, on: 'baraj' },
      { t: 'plate', x: 94, y: 20, id: 'kaya' },
      { t: 'gate', x: 91, y: 12, h: 9, on: 'kaya', latch: true, coop: true, id: 'baraj' },
      { t: 'decor', x: 69, y: 12, s: 'flowers' },
      // şelalenin tepesi
      { t: 'decor', x: 76, y: 8, s: 'bush' },
      { t: 'npc', x: 82, y: 8, who: 'zipzip', face: -1, id: 'zipzip2' },
      { t: 'lily', x: 85, y: 8, w: 2, mode: 'cap1' }, { t: 'lily', x: 89, y: 8, w: 2, mode: 'cap1' },
      { t: 'lily', x: 94, y: 8, w: 3, mode: 'pair' },
      { t: 'gate', x: 104, y: 0, h: 9, on: 'q2' },
      { t: 'decor', x: 103, y: 8, s: 'reeds' }, { t: 'decor', x: 107, y: 8, s: 'flowers' }, { t: 'decor', x: 116, y: 8, s: 'bush' },
    ],
  };
}

const levels = [L4(), L5(), L6()];
if (require.main === module) {
  const f = writeWorld(2, 'Yaz Gölü', levels, '_gelistirme/bolumler/d2.js');
  console.log('yazıldı:', f);
}
module.exports = { levels };
