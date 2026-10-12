// Dünya 5 — Kar Zirvesi (kış). Çalıştır: node _gelistirme/bolumler/d5.js
// Asıl gerilim ısıdır: arılar uzun süre ayrı kalamaz. Ayrılmayı gerektiren her bulmacanın yanında bal-ateşi (F) vardır.
const { Harita } = require('../harita.js');
const { writeWorld } = require('./yaz.js');

const pol = (h, list) => { for (const [c, r] of list) h.koy(c, r, 'o'); };

// ------------------------------------------------------------ 13. İlk Kar (ısı öğretisi)
function L13() {
  const h = new Harita(180, 18);
  h.zemin(0, 179, 15);
  // mağara ağzı (Işıl'ın dünyasından çıkış)
  h.doldur(0, 0, 9, 4, '%'); h.doldur(0, 5, 6, 6, '%'); h.doldur(0, 7, 2, 9, '%');
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  h.koy(15, 14, 'Q');
  // karlı tepecikler ve ilk ateş
  h.zemin(24, 29, 13);
  pol(h, [[22, 12], [24, 11], [26, 10], [28, 11], [30, 13]]);
  h.koy(32, 14, 'F');
  // buz pisti (kaygan) ve sarkıtlı kaya kemeri
  h.doldur(36, 15, 45, 15, 'I');
  pol(h, [[38, 13], [41, 12], [44, 13]]);
  h.doldur(49, 8, 56, 9, '%'); 
  pol(h, [[47, 11], [58, 11]]);
  h.koy(60, 14, 'C');
  // çift plaka: biri aşağıda, biri yüksek rafta; ikisinin yanında da ateş
  h.koy(66, 14, 'F');
  h.zemin(73, 78, 11);
  h.koy(74, 10, 'F');
  pol(h, [[69, 12], [71, 10], [77, 9]]);
  // geniş kar düzlüğü + uzak sırt (Gölge burada görünür)
  h.doldur(94, 5, 112, 6, '#'); h.doldur(97, 4, 110, 4, '#');
  h.zemin(96, 99, 14); h.zemin(104, 108, 13);
  pol(h, [[88, 12], [92, 11], [97, 12], [101, 11], [106, 11], [110, 12]]);
  h.koy(115, 14, 'C');
  // çatlak buz köprüsü (kısa)
  h.cukur(121, 126);
  pol(h, [[122, 12], [124, 11], [126, 12]]);
  // basamaklar ve ateş başında soru (Kraliçe'nin sesi)
  h.zemin(128, 131, 13); h.zemin(132, 143, 11);
  h.koy(135, 10, 'F');
  h.koy(138, 10, 'Q');
  h.zemin(144, 147, 13);
  h.koy(151, 14, 'C');
  // gizli: yüksek raf (omuz omuza)
  h.raf(158, 160, 7);
  h.koy(159, 6, '*');
  pol(h, [[155, 12], [163, 12], [166, 11], [169, 12]]);
  h.koy(174, 14, 'E');
  return {
    id: 13, world: 5, name: 'İlk Kar', theme: 'kis', weather: 'snow', cold: true,
    map: h.satirlar(),
    questions: ['S22', 'S37'],
    scenes: { start: 'L13_start', end: 'L13_end' },
    marks: { golgeA: [99, 3], golgeB: [109, 3] },
    objects: [
      { t: 'decor', x: 3, y: 14, s: 'crystal' },
      { t: 'sign', x: 9, y: 14, text: 'Kar Zirvesi soğuktur. Yan yana durun: ısınırsınız. Uzun süre ayrı kalmayın!' },
      { t: 'npc', x: 12, y: 14, who: 'isil', face: -1, id: 'isil' },
      { t: 'gate', x: 19, y: 0, h: 15, on: 'q1', style: 'ice' },
      { t: 'decor', x: 21, y: 14, s: 'rock' },
      { t: 'sign', x: 30, y: 14, text: 'Bal-ateşi ısıtır. Üşüyünce yanına sokulun.' },
      { t: 'sign', x: 34, y: 14, text: 'Buz kaygandır: erken fren yapın!' },
      { t: 'sign', x: 47, y: 14, text: 'Sarkıtların altında durmayın, hızla geçin!' },
      { t: 'icicle', x: 51, y: 10 }, { t: 'icicle', x: 54, y: 10 },
      { t: 'decor', x: 58, y: 14, s: 'snowman' },
      { t: 'sign', x: 63, y: 14, text: 'İki plakaya aynı anda basın. Ayrı kalınca ateşin yanında bekleyin!' },
      { t: 'plate', x: 67, y: 14, id: 'a' },
      { t: 'plate', x: 76, y: 10, id: 'b' },
      { t: 'gate', x: 81, y: 0, h: 15, on: ['a', 'b'], latch: true, coop: true, style: 'ice' },
      { t: 'decor', x: 84, y: 14, s: 'paw' }, { t: 'decor', x: 87, y: 14, s: 'paw' },
      { t: 'trigger', x: 89, y: 0, w: 2, h: 18, scene: 'L13_golge', need: 'both' },
      { t: 'decor', x: 93, y: 14, s: 'fur' },
      { t: 'decor', x: 102, y: 14, s: 'rock' },
      { t: 'decor', x: 112, y: 14, s: 'crystal' },
      { t: 'sign', x: 118, y: 14, text: 'Çatlak buz kırılır: durmadan geçin!' },
      { t: 'crumble', x: 121, y: 15, w: 6 },
      { t: 'decor', x: 133, y: 10, s: 'rock' },
      { t: 'gate', x: 142, y: 0, h: 11, on: 'q2', style: 'ice' },
      { t: 'decor', x: 149, y: 14, s: 'snowman', flip: true },
      { t: 'sign', x: 156, y: 14, text: 'O raf çok yüksek… Biriniz öbürünün başına konsun!' },
      { t: 'decor', x: 162, y: 14, s: 'crystal' },
      { t: 'decor', x: 170, y: 14, s: 'rock' },
    ],
  };
}

// ------------------------------------------------------------ 14. Buz Köprüsü (Bora ile yüzleşme)
function L14() {
  const H = 22;
  const h = new Harita(200, H);
  h.zemin(0, 199, 15);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  h.koy(11, 14, 'F');
  // buzlu tepe ve buz pisti, sonunda diken çukuru
  h.zemin(15, 22, 12); h.doldur(15, 12, 22, 12, 'I');
  pol(h, [[16, 10], [19, 10], [22, 10]]);
  h.doldur(25, 15, 35, 15, 'I');
  h.doldur(36, 15, 38, 15, '^');
  pol(h, [[30, 13], [37, 11], [40, 13]]);
  h.koy(46, 14, 'C');
  // omuz omuza: yüksek raftaki plaka
  h.koy(52, 14, 'F');
  h.raf(57, 60, 8);
  pol(h, [[54, 12], [61, 12], [64, 12]]);
  h.koy(70, 14, 'C');
  // sarkıtlı buz mağarası
  h.doldur(76, 0, 98, 9, '#'); h.doldur(76, 10, 77, 10, '#'); h.doldur(97, 10, 98, 10, '#');
  pol(h, [[80, 13], [84, 12], [89, 13], [94, 12]]);
  h.koy(88, 14, 'F');
  // Bora'nın yaylası: Bora'nın kapısı katı duvardır
  h.zemin(100, 131, 15);
  h.koy(108, 14, 'Q');
  h.koy(116, 14, 'Q');
  h.doldur(124, 0, 127, 14, '%');
  // q2 ile açılan kuyu → duvarın altından geçen tünel → uçurum (kırık buz köprüsü)
  h.bosalt(119, 15, 120, 18); h.bosalt(119, 17, 131, 18);
  h.koy(126, 18, 'C');
  h.cukur(132, 172);
  h.zemin(173, 199, 15);
  pol(h, [[135, 16], [141, 14], [147, 16], [153, 14], [159, 15], [165, 13]]);
  h.koy(180, 14, 'C');
  // gizli: yüksek raf (omuz omuza)
  h.raf(186, 188, 8);
  h.koy(187, 7, '*');
  pol(h, [[183, 12], [191, 12]]);
  h.koy(195, 14, 'E');
  return {
    id: 14, world: 5, name: 'Buz Köprüsü', theme: 'kis', weather: 'snow', cold: true,
    map: h.satirlar(),
    questions: ['F15', 'F11'],
    scenes: { start: 'L14_start', end: 'L14_end' },
    objects: [
      { t: 'decor', x: 2, y: 14, s: 'rock' },
      { t: 'sign', x: 9, y: 14, text: 'Buz kayar, çatlak buz kırılır. Birbirinizden uzaklaşmayın!' },
      { t: 'decor', x: 24, y: 14, s: 'crystal' },
      { t: 'sign', x: 42, y: 14, text: 'Buz pistinin sonunda diken var: zamanında zıplayın!' },
      { t: 'decor', x: 49, y: 14, s: 'snowman' },
      { t: 'sign', x: 54, y: 14, text: 'Plaka çok yüksekte. Biriniz öbürünün başına konsun, alttaki uçsun!' },
      { t: 'plate', x: 59, y: 7, id: 'tepe' },
      { t: 'gate', x: 66, y: 0, h: 15, on: 'tepe', latch: true, coop: true, style: 'ice' },
      { t: 'sign', x: 74, y: 14, text: 'Sarkıtlı mağara: yan yana ve durmadan geçin.' },
      { t: 'icicle', x: 81, y: 10 }, { t: 'icicle', x: 85, y: 10 }, { t: 'icicle', x: 92, y: 10 }, { t: 'icicle', x: 95, y: 10 },
      { t: 'decor', x: 102, y: 14, s: 'paw' },
      { t: 'trigger', x: 103, y: 0, w: 2, h: 15, scene: 'L14_bora', need: 'both' },
      { t: 'gate', x: 112, y: 0, h: 15, on: 'q1', style: 'ice' },
      { t: 'npc', x: 121, y: 14, who: 'bora', face: -1, id: 'bora' },
      { t: 'gate', x: 119, y: 15, w: 2, h: 2, on: 'q2', style: 'ice' },
      { t: 'decor', x: 129, y: 14, s: 'fur' },
      { t: 'mastery', x: 131, w: 3, name: 'Kırık Buz Köprüsü' },
      { t: 'crumble', x: 132, y: 19, w: 5 },
      { t: 'crumble', x: 139, y: 17, w: 4 },
      { t: 'crumble', x: 145, y: 19, w: 4 },
      { t: 'crumble', x: 151, y: 17, w: 4 },
      { t: 'crumble', x: 157, y: 18, w: 4 },
      { t: 'crumble', x: 163, y: 16, w: 4 },
      { t: 'crumble', x: 169, y: 18, w: 3 },
      { t: 'decor', x: 178, y: 14, s: 'crystal' },
      { t: 'sign', x: 184, y: 14, text: 'Raftaki çiçeğe tek kanat yetmez…' },
      { t: 'decor', x: 192, y: 14, s: 'snowman', flip: true },
    ],
  };
}

// ------------------------------------------------------------ 15. Fırtına Gecesi (Bora'nın kurtarılışı)
function L15() {
  const h = new Harita(198, 18);
  h.zemin(0, 197, 15);
  h.doldur(0, 0, 5, 6, '%'); h.doldur(0, 7, 2, 9, '%');
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  h.koy(9, 14, 'F');
  // fırtına düzlüğü: rüzgârın önündeki kayalar sığınaktır (rüzgâr sola eser)
  for (const c of [22, 31, 40, 49]) h.doldur(c, 13, c + 1, 14, '%');
  pol(h, [[19, 13], [22, 11], [29, 13], [31, 11], [38, 13], [40, 11], [47, 13]]);
  h.koy(54, 14, 'C');
  // çiçeği açık tut (iki yanda ateş)
  h.koy(58, 14, 'F');
  h.koy(74, 14, 'F');
  pol(h, [[65, 12], [68, 11], [71, 12]]);
  // Fırtına Sırtı: altı uçurum, kırılan buzlar, soğuk esintiler
  h.zemin(80, 83, 13); h.zemin(84, 89, 11);
  h.koy(86, 10, 'C');
  h.cukur(90, 121);
  h.doldur(90, 10, 94, 11, '#');
  h.doldur(98, 10, 103, 11, '#'); h.doldur(101, 8, 101, 9, '%');
  h.doldur(107, 10, 112, 11, '#'); h.doldur(110, 8, 110, 9, '%');
  h.doldur(116, 10, 121, 11, '#');
  pol(h, [[96, 8], [101, 7], [105, 8], [110, 7], [114, 8]]);
  h.zemin(122, 125, 13);
  h.koy(129, 14, 'C');
  // Bora'nın sığınağı (tavanlı, ateşli)
  h.doldur(136, 0, 176, 7, '%'); h.doldur(136, 8, 137, 9, '%');
  h.koy(146, 14, 'F'); h.koy(155, 14, 'F');
  h.koy(160, 14, 'Q');
  h.koy(168, 14, 'Q');
  pol(h, [[133, 12], [140, 12], [164, 12], [172, 12]]);
  // gizli: yüksek raf (omuz omuza)
  h.raf(181, 183, 8);
  h.koy(182, 7, '*');
  pol(h, [[179, 12], [186, 12]]);
  h.koy(192, 14, 'E');
  const gust = (x, w, phase) => ({ t: 'wind', x, y: 0, w, h: 15, vx: -125, cold: true, gust: { period: 4, on: 1.6, phase: phase || 0 } });
  return {
    id: 15, world: 5, name: 'Fırtına Gecesi', theme: 'kis', weather: 'storm', cold: true, music: 'firtina',
    map: h.satirlar(),
    questions: ['F16', 'F19'],
    scenes: { start: 'L15_start', end: 'L15_end' },
    objects: [
      { t: 'sign', x: 11, y: 14, text: 'Fırtına! Rüzgâr esince bir kayanın arkasına sığının.' },
      gust(24, 4), gust(33, 4), gust(42, 4),
      { t: 'decor', x: 17, y: 14, s: 'rock' },
      { t: 'sign', x: 56, y: 14, text: 'Biriniz çiçeği tutsun, öbürü geçsin. Karşıda da bir çiçek var!' },
      { t: 'flower', x: 59, y: 14, id: 'f1' },
      { t: 'gate', x: 62, y: 0, h: 15, on: ['f1', 'f2'], any: true, coop: true, style: 'ice' },
      gust(64, 6, 1),
      { t: 'flower', x: 73, y: 14, id: 'f2' },
      { t: 'sign', x: 77, y: 14, text: 'Rüzgârda yalnız kalan çabuk üşür. Taşınan da ısınır!' },
      { t: 'mastery', x: 88, w: 3, name: 'Fırtına Sırtı' },
      { t: 'wind', x: 90, y: 0, w: 8, h: 10, vx: -130, cold: true, gust: { period: 4.6, on: 1.3, phase: 0 } },
      { t: 'wind', x: 102, y: 0, w: 5, h: 10, vx: -130, cold: true, gust: { period: 4.6, on: 1.3, phase: 0 } },
      { t: 'wind', x: 111, y: 0, w: 11, h: 10, vx: -130, cold: true, gust: { period: 4.6, on: 1.3, phase: 0 } },
      { t: 'crumble', x: 95, y: 10, w: 3 },
      { t: 'crumble', x: 104, y: 10, w: 3 },
      { t: 'crumble', x: 113, y: 10, w: 3 },
      { t: 'decor', x: 127, y: 14, s: 'rock' },
      { t: 'icicle', x: 140, y: 8 },
      { t: 'trigger', x: 143, y: 0, w: 2, h: 18, scene: 'L15_bulus', need: 'both' },
      { t: 'sign', x: 148, y: 14, text: 'İkiniz birden Bora\'nın yanına sokulun!' },
      { t: 'bora', x: 151, y: 14, need: 7, flag: 'boraWarm', scene: 'L15_kurtarma' },
      { t: 'gate', x: 157, y: 0, h: 15, on: 'boraWarm', coop: true, style: 'ice' },
      { t: 'gate', x: 164, y: 0, h: 15, on: 'q1', style: 'ice' },
      { t: 'gate', x: 172, y: 0, h: 15, on: 'q2', style: 'ice' },
      { t: 'decor', x: 175, y: 14, s: 'crystal' },
      { t: 'decor', x: 189, y: 14, s: 'snowman' },
    ],
  };
}

const levels = [L13(), L14(), L15()];
if (require.main === module) {
  const f = writeWorld(5, 'Kar Zirvesi', levels, '_gelistirme/bolumler/d5.js');
  console.log('yazıldı:', f);
}
module.exports = { levels };
