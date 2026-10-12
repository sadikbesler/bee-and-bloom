/* Geliştirme kum havuzu: tüm mekanikleri tek bölümde denemek için (oyuna dahil değildir). index.html?kum=1 */
(function (root) {
  'use strict';
  const BB = root.BB;
  const COLS = 200, ROWS = 17;
  const g = [];
  for (let r = 0; r < ROWS; r++) g.push(Array(COLS).fill('.'));
  const put = (c, r, ch) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const fill = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) put(c, r, ch); };
  fill(0, 15, COLS - 1, 16, '#');
  put(3, 14, '1'); put(5, 14, '2');
  fill(14, 12, 16, 14, '#');           // 3 karo duvar
  fill(20, 8, 22, 14, '%');            // 7 karo duvar (omuz gerekir)
  put(26, 14, 'C');
  fill(48, 15, 60, 16, '~');           // havuz
  put(62, 14, 'C');
  fill(91, 6, 96, 6, '=');             // sarmaşık tepesindeki raf
  put(94, 5, 'o'); put(95, 5, 'o');
  put(102, 13, 'w'); put(102, 14, 'w'); put(104, 14, 'w');
  put(113, 14, 'M'); put(116, 14, 'M');
  fill(122, 14, 126, 14, '^');
  put(124, 10, 'n');
  put(142, 14, 'C');
  fill(146, 15, 158, 16, '.');         // çukur
  fill(158, 12, 160, 14, 'I');
  for (let c = 30; c < 120; c += 7) put(c, 11, 'o');
  put(170, 9, '*');
  fill(168, 10, 172, 10, '=');
  fill(176, 13, 178, 13, 'p'); fill(180, 11, 182, 11, 'b');
  put(186, 14, 'Q');
  put(195, 14, 'E');
  const map = g.map((r) => r.join(''));
  BB.KUM = {
    id: 99, world: 1, name: 'Kum Havuzu', theme: (root.location && new URLSearchParams(root.location.search).get('tema')) || 'bahar',
    map, questions: ['S35'], coop: ['test'],
    objects: [
      { t: 'sign', x: 8, y: 14, text: '{p1}: {k1kanat} kanat, {k1eylem} eylem · {p2}: {k2kanat} kanat, {k2eylem} eylem' },
      { t: 'plate', x: 30, y: 14, id: 'a' }, { t: 'plate', x: 34, y: 14, id: 'b' },
      { t: 'gate', x: 37, y: 0, h: 15, on: ['a', 'b'], coop: true },
      { t: 'flower', x: 40, y: 14, id: 'f' }, { t: 'gate', x: 44, y: 0, h: 15, on: 'f', coop: true, style: 'petal' },
      { t: 'lily', x: 50, y: 14, w: 2, mode: 'cap1' }, { t: 'lily', x: 55, y: 14, w: 3, mode: 'pair' },
      { t: 'item', x: 63, y: 14, kind: 'shield' },
      { t: 'wind', x: 66, y: 4, w: 14, h: 11, vx: -160 },
      { t: 'item', x: 83, y: 14, kind: 'pollen' }, { t: 'pot', x: 88, y: 14, id: 'pot' }, { t: 'vine', x: 90, y: 14, h: 8, on: 'pot' },
      { t: 'spider', x: 107, y: 5, len: 5, period: 2.4 },
      { t: 'pulse', x: 118, y: 10, w: 2, period: 2, on: 1.2 },
      { t: 'plate', x: 133, y: 14, id: 'e' }, { t: 'platform', x: 136, y: 14, w: 2, to: [136, 7], on: 'e', speed: 40 },
      { t: 'crumble', x: 148, y: 12, w: 5 },
      { t: 'icicle', x: 152, y: 4 }, { t: 'drip', x: 155, y: 3, period: 1.8 },
      { t: 'npc', x: 184, y: 14, who: 'puntur', face: 1 },
      { t: 'item', x: 128, y: 14, kind: 'lantern' },
      { t: 'decor', x: 70, y: 14, s: 'paw' }, { t: 'decor', x: 74, y: 14, s: 'fur' },
    ],
  };
})(typeof window !== 'undefined' ? window : globalThis);
