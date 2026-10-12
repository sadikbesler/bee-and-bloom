// Dünya 1 — Çiçek Çayırı (ilkbahar). Çalıştır: node _gelistirme/bolumler/d1.js
const { Harita } = require('../harita.js');
const { writeWorld } = require('./yaz.js');

// ------------------------------------------------------------ 1. Kovanda Sabah (öğretici)
function L1() {
  const h = new Harita(142, 17);
  h.zemin(0, 141, 15);
  h.koy(10, 14, '1'); h.koy(12, 14, '2');
  h.koy(17, 14, 'Q');
  // küçük basamak ve polen izi
  h.koy(37, 14, '#');
  for (const [c, r] of [[34, 13], [36, 12], [38, 11], [40, 13]]) h.koy(c, r, 'o');
  // uçuş çıkıntısı (4 karo)
  h.zemin(44, 53, 11);
  h.koy(42, 9, 'n');
  for (const [c, r] of [[45, 9], [47, 8], [51, 9]]) h.koy(c, r, 'o');
  h.koy(49, 10, 'C');
  // diken tarlası (süzülerek geç)
  h.sira(56, 58, 14, '^');
  for (const [c, r] of [[56, 11], [58, 10]]) h.koy(c, r, 'o');
  // çiçeği açık tut bulmacası
  for (const [c, r] of [[65, 12], [69, 12], [72, 13]]) h.koy(c, r, 'o');
  h.koy(77, 14, 'C');
  // Püntür ve açık soru: uçarak konulan çiçekler
  h.koy(88, 14, 'Q');
  h.raf(90, 92, 13); h.raf(93, 95, 11); h.raf(96, 98, 13); h.raf(99, 101, 11);
  // diken çayırı + nektar
  h.sira(107, 116, 14, '^');
  h.koy(110, 10, 'n');
  for (const [c, r] of [[108, 11], [112, 9], [114, 11], [116, 12]]) h.koy(c, r, 'o');
  // gizli nadir çiçek: yüksek raf (omuz omuza gerekir)
  h.raf(121, 123, 7);
  h.koy(122, 6, '*');
  h.koy(126, 14, 'C');
  h.raf(129, 131, 13); h.raf(133, 135, 12);
  for (const [c, r] of [[130, 12], [134, 11], [136, 13]]) h.koy(c, r, 'o');
  h.koy(138, 14, 'E');
  return {
    id: 1, world: 1, name: 'Kovanda Sabah', theme: 'bahar', weather: 'petals',
    map: h.satirlar(),
    questions: ['S24', 'S25'],
    scenes: { start: 'L1_start', end: 'L1_end' },
    hints: true,
    objects: [
      { t: 'decor', x: 3, y: 14, s: 'hive' },
      { t: 'decor', x: 5, y: 14, s: 'jar' },
      { t: 'npc', x: 7, y: 14, who: 'kralice', face: 1 },
      { t: 'sign', x: 14, y: 14, text: '{p1}: {k1sol} {k1sag} yürü. {p2}: {k2sol} {k2sag} yürü. Sorulardaki çiçeklere girin!' },
      { t: 'choice', x: 20, y: 13, q: 1, opt: 0 }, { t: 'choice', x: 23, y: 13, q: 1, opt: 1 }, { t: 'choice', x: 26, y: 13, q: 1, opt: 2 }, { t: 'choice', x: 29, y: 13, q: 1, opt: 3 },
      { t: 'gate', x: 32, y: 0, h: 15, on: 'q1', style: 'petal' },
      { t: 'sign', x: 40, y: 14, text: 'Kanat: {p1} {k1kanat}, {p2} {k2kanat}. Kısa bas: zıpla. Basılı tut: uç! Bırakınca süzülürsün.' },
      { t: 'decor', x: 41, y: 14, s: 'flowers' },
      { t: 'sign', x: 52, y: 10, text: 'Dikenlere değmeyin! Yukarıdan süzülerek geçin. Kanat yorulursa yere ya da çiçeğe konun.' },
      { t: 'sign', x: 61, y: 14, text: 'Biriniz çiçeği tutsun ({k1eylem} ya da {k2eylem} basılı), öbürü kapıdan geçsin. Karşıdaki çiçek de aynı kapıyı açar!' },
      { t: 'flower', x: 63, y: 14, id: 'f1' },
      { t: 'gate', x: 67, y: 0, h: 15, on: ['f1', 'f2'], any: true, coop: true, style: 'petal' },
      { t: 'flower', x: 70, y: 14, id: 'f2' },
      { t: 'decor', x: 74, y: 14, s: 'bush' },
      { t: 'trigger', x: 80, y: 0, w: 3, h: 15, scene: 'L1_puntur', need: 'both' },
      { t: 'npc', x: 85, y: 14, who: 'puntur', face: -1 },
      { t: 'choice', x: 91, y: 11, q: 2, opt: 0 }, { t: 'choice', x: 94, y: 9, q: 2, opt: 1 }, { t: 'choice', x: 97, y: 11, q: 2, opt: 2 }, { t: 'choice', x: 100, y: 9, q: 2, opt: 3 },
      { t: 'gate', x: 104, y: 0, h: 15, on: 'q2', style: 'hedge' },
      { t: 'sign', x: 119, y: 14, text: 'Bazı yerlere tek kanat yetmez… Biriniz öbürünün başına konsun; alttaki uçsun, üstteki en tepede zıplasın!' },
      { t: 'decor', x: 124, y: 14, s: 'rock' },
      { t: 'decor', x: 136, y: 14, s: 'flowers' },
    ],
  };
}

// ------------------------------------------------------------ 2. Polen Yolu
function L2() {
  const h = new Harita(172, 17);
  h.zemin(0, 171, 15);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // küçük tepe ve polen izi
  h.zemin(13, 18, 13);
  for (const [c, r] of [[10, 13], [12, 12], [14, 11], [16, 11], [18, 11], [20, 13]]) h.koy(c, r, 'o');
  // sarmaşıkla çıkılan yüksek yar (10 karo: omuz omuza bile yetmez → saksı gerekir)
  h.zemin(40, 58, 5);
  h.koy(44, 4, 'C');
  for (const [c, r] of [[47, 3], [50, 2], [53, 3]]) h.koy(c, r, 'o');
  // yardan iniş basamakları
  h.zemin(59, 61, 9); h.zemin(62, 64, 12);
  h.koy(60, 7, 'o'); h.koy(63, 10, 'o');
  // ağır polen + yüksek saksı rafı (5 karo): taşıma gerekir
  h.zemin(74, 79, 10);
  for (const [c, r] of [[69, 13], [71, 12], [76, 8]]) h.koy(c, r, 'o');
  h.koy(87, 14, 'C');
  // Gölge'nin bal damlasını kaptığı kaya
  h.zemin(101, 103, 14);
  for (const [c, r] of [[92, 12], [95, 11], [98, 12], [106, 12]]) h.koy(c, r, 'o');
  // soru 1 (açık): raflardaki çiçekler
  h.koy(118, 14, 'Q');
  h.raf(120, 122, 13); h.raf(123, 125, 11); h.raf(126, 128, 13); h.raf(129, 131, 11);
  // çift plaka (kalıcı açılır)
  h.zemin(141, 143, 12);
  for (const [c, r] of [[136, 13], [142, 10], [146, 12]]) h.koy(c, r, 'o');
  // gizli: yüksek raf (omuz omuza)
  h.raf(139, 141, 6);
  h.koy(140, 5, '*');
  h.koy(152, 14, 'Q');
  h.koy(158, 14, 'C');
  for (const [c, r] of [[161, 12], [163, 11], [165, 12]]) h.koy(c, r, 'o');
  h.koy(167, 14, 'E');
  return {
    id: 2, world: 1, name: 'Polen Yolu', theme: 'bahar', weather: 'petals',
    map: h.satirlar(),
    questions: ['S38', 'S35'],
    scenes: { start: 'L2_start', end: 'L2_end' },
    marks: { golgeA: [104, 14], golgeB: [124, 14], damla: [102, 13] },
    objects: [
      { t: 'decor', x: 2, y: 14, s: 'bush' }, { t: 'decor', x: 9, y: 14, s: 'flowers' },
      { t: 'sign', x: 22, y: 14, text: 'Polen topunu {k1eylem} / {k2eylem} ile alın, saksıya bırakın. Ağırdır: onunla yüksek uçamazsınız!' },
      { t: 'item', x: 25, y: 14, kind: 'pollen' },
      { t: 'pot', x: 35, y: 14, id: 'pot1' },
      { t: 'vine', x: 38, y: 14, h: 10, on: 'pot1' },
      { t: 'decor', x: 31, y: 14, s: 'rock' },
      { t: 'decor', x: 56, y: 4, s: 'bush' },
      { t: 'sign', x: 66, y: 14, text: 'Bu top tek kanatla o rafa çıkmaz… Biriniz topu alsın, öbürü onu taşısın! (Ortağın yanında {k1eylem} / {k2eylem})' },
      { t: 'item', x: 68, y: 14, kind: 'pollen' },
      { t: 'pot', x: 77, y: 9, id: 'pot2' },
      { t: 'gate', x: 82, y: 0, h: 15, on: 'pot2', coop: true, style: 'hedge' },
      { t: 'decor', x: 90, y: 14, s: 'flowers' },
      { t: 'decor', x: 102, y: 13, s: 'drop', id: 'damla' },
      { t: 'trigger', x: 95, y: 0, w: 2, h: 15, scene: 'L2_golge', need: 'both' },
      { t: 'decor', x: 110, y: 14, s: 'fur' },
      { t: 'npc', x: 116, y: 14, who: 'puntur', face: 1, id: 'puntur1' },
      { t: 'choice', x: 121, y: 11, q: 1, opt: 0 }, { t: 'choice', x: 124, y: 9, q: 1, opt: 1 }, { t: 'choice', x: 127, y: 11, q: 1, opt: 2 }, { t: 'choice', x: 130, y: 9, q: 1, opt: 3 },
      { t: 'gate', x: 133, y: 0, h: 15, on: 'q1', style: 'petal' },
      { t: 'sign', x: 135, y: 14, text: 'İki plakaya birlikte basın: kapı bir kez açılınca açık kalır.' },
      { t: 'plate', x: 137, y: 14, id: 'a' }, { t: 'plate', x: 142, y: 11, id: 'b' },
      { t: 'gate', x: 147, y: 0, h: 15, on: ['a', 'b'], latch: true, coop: true, style: 'hedge' },
      { t: 'npc', x: 150, y: 14, who: 'puntur', face: 1, id: 'puntur2' },
      { t: 'gate', x: 155, y: 0, h: 15, on: 'q2', style: 'petal' },
      { t: 'decor', x: 162, y: 14, s: 'bush' },
    ],
  };
}

// ------------------------------------------------------------ 3. Çayır Kapısı
function L3() {
  const h = new Harita(170, 17);
  h.zemin(0, 169, 15);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // ağ tanıtımı
  h.koy(15, 14, 'w'); h.koy(21, 10, 'w');
  for (const [c, r] of [[11, 13], [13, 12], [17, 11], [19, 12], [23, 13]]) h.koy(c, r, 'o');
  h.zemin(25, 29, 13);
  h.koy(31, 14, 'C');
  // örümcek bahçesi: dikenli zemin üstünde örümcekler
  h.sira(35, 55, 14, '^');
  h.raf(39, 41, 11); h.raf(47, 49, 10);
  for (const [c, r] of [[37, 10], [40, 9], [44, 8], [48, 8], [52, 10]]) h.koy(c, r, 'o');
  h.koy(43, 6, 'n');
  // Ağ Koridoru'nun önündeki alçak sütun (gizli çiçeğe omuz omuza buradan)
  h.zemin(58, 61, 11);
  h.koy(63, 14, 'C');
  // Ağ Koridoru: tavan 4–11, iç boşluk 12–14
  h.doldur(66, 4, 99, 11, '#');
  for (const [c, r] of [[70, 14], [74, 12], [78, 13], [83, 14], [86, 12]]) h.koy(c, r, 'w');
  h.sira(80, 81, 14, '^');
  for (const [c, r] of [[68, 13], [72, 13], [76, 13], [81, 12], [85, 13], [90, 13], [95, 13]]) h.koy(c, r, 'o');
  // koridorun çatısında gizli çiçek
  h.koy(79, 3, '*');
  h.koy(103, 14, 'C');
  // papatya yolu ve Püntür'ün tepesi
  h.raf(108, 110, 12); h.raf(113, 115, 10);
  for (const [c, r] of [[109, 11], [114, 9], [118, 9]]) h.koy(c, r, 'o');
  h.zemin(120, 151, 11);
  h.koy(124, 10, 'C');
  h.koy(129, 10, 'Q'); h.koy(136, 10, 'Q');
  for (const [c, r] of [[154, 13], [157, 12], [160, 13]]) h.koy(c, r, 'o');
  h.koy(164, 14, 'E');
  return {
    id: 3, world: 1, name: 'Çayır Kapısı', theme: 'bahar', weather: 'petals',
    map: h.satirlar(),
    questions: ['A3', 'A2'],
    scenes: { start: 'L3_start', end: 'L3_end' },
    objects: [
      { t: 'decor', x: 2, y: 14, s: 'flowers' },
      { t: 'sign', x: 9, y: 14, text: 'Ağa yapışan arıyı ortağı {k1eylem} / {k2eylem} ile kurtarır. Yalnızsanız kanat tuşuna art arda basın!' },
      { t: 'decor', x: 27, y: 12, s: 'bush' },
      { t: 'sign', x: 33, y: 14, text: 'Örümcekler iner, çıkar. Aralarından geçin; dikenlere konmayın!' },
      { t: 'spider', x: 38, y: 0, len: 9, period: 2.6, phase: 0 },
      { t: 'spider', x: 45, y: 0, len: 9, period: 2.6, phase: 0.5 },
      { t: 'spider', x: 52, y: 0, len: 9, period: 2.6, phase: 0.25 },
      { t: 'decor', x: 57, y: 14, s: 'rock' },
      { t: 'mastery', x: 64, w: 36, name: 'Ağ Koridoru' },
      { t: 'decor', x: 72, y: 14, s: 'brokenweb' },
      { t: 'decor', x: 70, y: 3, s: 'bush' }, { t: 'decor', x: 76, y: 3, s: 'flowers' }, { t: 'decor', x: 84, y: 3, s: 'rock' }, { t: 'decor', x: 96, y: 3, s: 'bush' },
      { t: 'spider', x: 77, y: 12, len: 1.4, period: 2.2, phase: 0 },
      { t: 'spider', x: 84, y: 12, len: 1.4, period: 2.2, phase: 0.5 },
      { t: 'sign', x: 88, y: 14, text: 'Biriniz çiçeği tutsun, öbürü geçsin; karşıdaki çiçek de aynı kapıyı açar.' },
      { t: 'flower', x: 89, y: 14, id: 'f1' },
      { t: 'gate', x: 92, y: 12, h: 3, on: ['f1', 'f2'], any: true, coop: true, style: 'petal' },
      { t: 'flower', x: 95, y: 14, id: 'f2' },
      { t: 'decor', x: 106, y: 14, s: 'flowers' },
      { t: 'trigger', x: 121, y: 0, w: 2, h: 11, scene: 'L3_kapi', need: 'both' },
      { t: 'npc', x: 132, y: 10, who: 'puntur', face: -1 },
      { t: 'gate', x: 140, y: 0, h: 11, on: ['q1', 'q2'], style: 'petal' },
      { t: 'decor', x: 145, y: 10, s: 'bush' },
      { t: 'decor', x: 166, y: 14, s: 'flowers' },
    ],
  };
}

const levels = [L1(), L2(), L3()];
if (require.main === module) {
  const f = writeWorld(1, 'Çiçek Çayırı', levels, '_gelistirme/bolumler/d1.js');
  console.log('yazıldı:', f);
}
module.exports = { levels };
