// Dünya 6 — 18. bölüm: Kraliçe Balı (final). Çalıştır: node _gelistirme/bolumler/d6_final.js → data/dunya6_final.js
const { Harita } = require('../harita.js');
const { writeWorld } = require('./yaz.js');

function L18() {
  const h = new Harita(152, 17);
  h.zemin(0, 151, 15);
  h.koy(4, 14, '1'); h.koy(6, 14, '2');
  // iki kalp, iki plaka
  for (const [c, r] of [[12, 12], [19, 11], [24, 12]]) h.koy(c, r, 'o');
  // 1. soru
  h.koy(33, 14, 'Q');
  // petek basamakları yukarı
  h.zemin(40, 61, 13, '%');
  h.koy(43, 12, 'C');
  h.koy(49, 12, 'Q');
  for (const [c, r] of [[41, 11], [46, 10], [52, 10], [58, 11]]) h.koy(c, r, 'o');
  h.zemin(62, 81, 11, '%');
  h.koy(66, 10, 'Q');
  for (const [c, r] of [[64, 8], [69, 8], [75, 9]]) h.koy(c, r, 'o');
  h.zemin(82, 101, 9, '%');
  h.koy(85, 8, 'C');
  h.koy(90, 8, 'Q');
  for (const [c, r] of [[88, 6], [94, 6], [99, 7]]) h.koy(c, r, 'o');
  h.zemin(102, 113, 7, '%');
  h.koy(106, 6, 'Q');
  for (const [c, r] of [[104, 4], [109, 4]]) h.koy(c, r, 'o');
  // gizli: tavana yakın petek oyuğu (omuz omuza)
  h.raf(87, 89, 2);
  h.koy(88, 1, '*');
  // kovanın kalbine iniş: taht salonu
  h.zemin(114, 151, 11, '%');
  h.koy(118, 10, 'C');
  h.koy(126, 10, 'Q');
  for (const [c, r] of [[116, 8], [121, 8], [130, 8], [134, 8]]) h.koy(c, r, 'o');
  h.koy(143, 10, 'E');
  return {
    id: 18, world: 6, name: 'Kraliçe Balı', theme: 'kovan', weather: 'pollen', music: 'kovan',
    map: h.satirlar(),
    questions: ['S34', 'S40', 'S30', 'F20', 'F17', 'S36'],
    scenes: { start: 'L18_start', end: 'L18_end' },
    objects: [
      { t: 'npc', x: 9, y: 14, who: 'bora', face: -1 },
      { t: 'decor', x: 2, y: 14, s: 'comb' },
      { t: 'sign', x: 13, y: 14, text: 'Kraliçe\'nin kapısı yalnızca ikiniz birlikteyken açılır: iki plaka, iki kalp.' },
      { t: 'plate', x: 17, y: 14, id: 'a' }, { t: 'plate', x: 22, y: 14, id: 'b' },
      { t: 'gate', x: 27, y: 0, h: 15, on: ['a', 'b'], latch: true, coop: true, style: 'wax' },
      { t: 'decor', x: 30, y: 14, s: 'flowers' },
      { t: 'gate', x: 37, y: 0, h: 15, on: 'q1', style: 'wax' },
      { t: 'gate', x: 55, y: 0, h: 13, on: 'q2', style: 'wax' },
      { t: 'decor', x: 60, y: 12, s: 'reeds' },
      { t: 'gate', x: 72, y: 0, h: 11, on: 'q3', style: 'wax' },
      { t: 'decor', x: 79, y: 10, s: 'stump' },
      { t: 'gate', x: 95, y: 0, h: 9, on: 'q4', style: 'wax' },
      { t: 'decor', x: 100, y: 8, s: 'crystal' },
      { t: 'gate', x: 111, y: 0, h: 7, on: 'q5', style: 'wax' },
      { t: 'decor', x: 112, y: 6, s: 'snowman' },
      { t: 'decor', x: 123, y: 10, s: 'lantern_post' },
      { t: 'gate', x: 131, y: 0, h: 11, on: 'q6', style: 'wax' },
      { t: 'decor', x: 136, y: 10, s: 'comb' },
      { t: 'decor', x: 139, y: 10, s: 'jar' },
      { t: 'npc', x: 141, y: 10, who: 'kralice', face: -1 },
      { t: 'decor', x: 147, y: 10, s: 'flowers' }, { t: 'decor', x: 150, y: 10, s: 'comb' },
    ],
  };
}

const levels = [L18()];
if (require.main === module) {
  const f = writeWorld(6, "Kovan'ın Kalbi (final)", levels, '_gelistirme/bolumler/d6_final.js', 'dunya6_final.js');
  console.log('yazıldı:', f);
}
module.exports = { levels };
