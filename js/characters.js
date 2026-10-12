/* Bee & Bloom — hikâye karakterleri: sahne sprite'ları ve 48x48 diyalog portreleri (kodla çizilir). */
(function (root) {
  'use strict';
  const BB = root.BB;
  const { PixelCanvas } = BB.Art;
  const C = BB.PAL;
  const pc = (w, h) => new PixelCanvas(w, h);
  const INK = C.ink;

  // ------------------------------------------------------------ yardımcılar
  function eyesRound(p, x, y, r, iris, look) {
    p.ellipse(x, y, r, r, '#ffffff');
    p.ellipse(x + (look || 0), y + 0.3, r * 0.55, r * 0.6, iris || C.eye);
    p.set(Math.round(x + (look || 0) - r * 0.25), Math.round(y - r * 0.3), '#ffffff');
  }
  function smile(p, x, y, w, col) { p.set(x - w, y - 1, col); for (let i = -w + 1; i < w; i++) p.set(x + i, y, col); p.set(x + w, y - 1, col); }
  function happyEye(p, x, y, col) { p.set(x - 1, y + 1, col); p.set(x, y, col); p.set(x + 1, y + 1, col); }
  function sadEye(p, x, y, col) { p.set(x - 1, y, col); p.set(x, y + 1, col); p.set(x + 1, y + 1, col); }

  // ============================================================ KRALİÇE ARI
  function queenSprite(f) {
    const p = pc(32, 32);
    const dy = f === 1 ? 1 : 0;
    // kanatlar
    p.ellipse(8, 9 + dy, 6, 5, C.wingS); p.ellipse(12, 6 + dy, 5, 6.5, C.wing);
    // gövde
    p.ellipse(13, 23 + dy, 10, 7.5, C.yelS); p.ellipse(13.5, 22 + dy, 9.2, 6.6, C.yel);
    for (let y = 0; y < 32; y++) for (const x of [5, 8, 11]) if (p.alpha(x, y) && y > 14 + dy && p.get(x, y) && p.get(x, y)[0] > 200) p.set(x, y, C.ink2);
    // şal
    p.poly([[13, 15 + dy], [27, 14 + dy], [28, 20 + dy], [12, 21 + dy]], '#b49ad8');
    p.hline(13, 27, 20 + dy, '#8f74b8'); p.set(20, 18 + dy, '#ffd23c');
    // baş
    p.ellipse(22, 11 + dy, 6.6, 6.2, C.yelS); p.ellipse(22.3, 10.6 + dy, 6, 5.6, C.yel);
    p.set(19, 6 + dy, C.yelL); p.set(20, 6 + dy, C.yelL);
    // yüz
    if (f === 2) { p.rect(20, 10 + dy, 2, 2, C.eye); p.rect(24, 10 + dy, 2, 2, C.eye); p.set(20, 10 + dy, '#fff'); p.set(24, 10 + dy, '#fff'); }
    else { happyEye(p, 21, 10 + dy, C.eye); happyEye(p, 25, 10 + dy, C.eye); }
    p.set(19, 13 + dy, C.cheek); p.set(27, 13 + dy, C.cheek);
    if (f === 2) { p.set(23, 14 + dy, C.mouth); p.set(23, 15 + dy, C.mouth); } else smile(p, 23, 14 + dy, 1, C.mouth);
    // anten
    p.line(20, 5 + dy, 17, 1 + dy, INK); p.set(16, 1 + dy, INK); p.set(16, 2 + dy, INK);
    p.line(24, 5 + dy, 27, 1 + dy, INK); p.set(28, 1 + dy, INK); p.set(28, 2 + dy, INK);
    p.outline(INK);
    // taç (ana hattın üstünde)
    p.map(['#.#.#', '#####', 'gyryg'], { '#': '#ffcf3a', g: '#e8a020', y: '#fff3a6', r: '#ff5f8f' }, 19, 2 + dy);
    p.set(19, 1 + dy, '#ffcf3a'); p.set(21, 1 + dy, '#ffcf3a'); p.set(23, 1 + dy, '#ffcf3a');
    return p;
  }

  // ============================================================ PÜNTÜR (uğur böceği)
  function punturSprite(f) {
    const p = pc(24, 24);
    const dy = f === 1 ? -2 : 0;
    p.ellipse(11, 16 + dy, 8, 6.2, '#c8282c'); p.ellipse(11, 15.4 + dy, 7.4, 5.4, '#ff4a4a');
    p.vline(11, 10 + dy, 21 + dy, '#2b1a10');
    for (const [x, y] of [[7, 14], [8, 18], [14, 13], [15, 17], [10, 12]]) p.ellipse(x, y + dy, 1.2, 1.2, '#2b1a10');
    p.set(6, 12 + dy, '#ffb3b3'); p.set(7, 11 + dy, '#ffb3b3');
    p.ellipse(19, 16 + dy, 4, 3.8, '#2b1a10');
    p.ellipse(19.5, 15 + dy, 1.6, 1.8, '#ffffff'); p.ellipse(21.5, 15 + dy, 1.4, 1.7, '#ffffff');
    p.set(20, 15 + dy, '#2b1a10'); p.set(22, 15 + dy, '#2b1a10');
    p.set(20, 18 + dy, '#ff8fae'); p.set(21, 18 + dy, '#ff8fae');
    p.line(18, 12 + dy, 16, 7 + dy, '#2b1a10'); p.line(20, 12 + dy, 22, 7 + dy, '#2b1a10');
    p.ellipse(16, 7 + dy, 1.2, 1.2, '#2b1a10'); p.ellipse(22, 7 + dy, 1.2, 1.2, '#2b1a10');
    for (const x of [7, 11, 15]) { p.set(x, 22 + dy, '#2b1a10'); p.set(x - 1, 23 + Math.min(0, dy), '#2b1a10'); }
    p.outline(INK);
    return p;
  }

  // ============================================================ ZIPZIP (kurbağa kral)
  function frogSprite(f) {
    const p = pc(32, 32);
    const dy = f === 1 ? 1 : f === 3 ? -6 : 0;
    // pelerin
    p.poly([[5, 14 + dy], [12, 13 + dy], [11, 29 + dy], [2, 29 + dy]], '#d8343c'); p.hline(2, 11, 29 + dy, '#ffffff'); p.hline(3, 10, 28 + dy, '#ffffff');
    // gövde
    p.ellipse(16, 23 + dy, 11, 7.5, '#3f9a52'); p.ellipse(16, 22 + dy, 10.2, 6.8, '#5cc27a');
    p.ellipse(17, 25 + dy, 6.5, 4, '#d8f0a0');
    // baş
    p.ellipse(16, 15 + dy, 10.5, 6, '#3f9a52'); p.ellipse(16, 14.5 + dy, 9.8, 5.4, '#5cc27a');
    // göz tümsekleri
    p.ellipse(10, 9 + dy, 4.2, 4.2, '#5cc27a'); p.ellipse(22, 9 + dy, 4.2, 4.2, '#5cc27a');
    eyesRound(p, 10, 9 + dy, 3, C.eye, 0.6); eyesRound(p, 22, 9 + dy, 3, C.eye, 0.6);
    // ağız
    if (f === 2) { p.ellipse(16, 17.5 + dy, 4, 2, '#8a2a3a'); p.hline(13, 19, 17 + dy, '#ff8fae'); }
    else { for (let x = 9; x <= 23; x++) p.set(x, 17 + dy + (x === 9 || x === 23 ? -1 : 0), '#2f6a2a'); }
    p.set(8, 15 + dy, C.cheek); p.set(24, 15 + dy, C.cheek);
    // bacaklar
    p.ellipse(7, 29 + Math.max(0, dy), 3.5, 2, '#3f9a52'); p.ellipse(25, 29 + Math.max(0, dy), 3.5, 2, '#3f9a52');
    p.outline(INK);
    // yamuk taç
    p.map(['#..#..#', '#######', 'ggrgbgg'], { '#': '#ffcf3a', g: '#e8a020', r: '#ff5f8f', b: '#6fb6f2' }, 13, 2 + dy);
    return p;
  }

  // ============================================================ HU (baykuş profesör)
  function owlSprite(f) {
    const p = pc(32, 32);
    const dy = f === 1 ? 1 : 0;
    // dal
    p.rect(0, 29, 32, 3, '#7a4a24'); p.hline(0, 31, 29, '#9a6434');
    // gövde
    p.ellipse(16, 19 + dy, 10, 10.5, '#8a5a34'); p.ellipse(16, 21 + dy, 6.5, 7, '#d8b88a');
    for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) { const x = 13 + i * 3, y = 18 + k * 3 + dy; p.set(x, y, '#a88058'); p.set(x + 1, y + 1, '#a88058'); }
    // kanatlar
    p.ellipse(7, 21 + dy, 3.4, 7, '#6e4628'); p.ellipse(25, 21 + dy, 3.4, 7, '#6e4628');
    // kulak tüyleri
    p.poly([[7, 3 + dy], [12, 8 + dy], [8, 10 + dy]], '#6e4628'); p.poly([[25, 3 + dy], [20, 8 + dy], [24, 10 + dy]], '#6e4628');
    // yüz diski
    p.ellipse(12, 12 + dy, 5, 4.6, '#efe0c0'); p.ellipse(20, 12 + dy, 5, 4.6, '#efe0c0');
    if (f === 2) { happyEye(p, 12, 12 + dy, C.eye); happyEye(p, 20, 12 + dy, C.eye); }
    else { p.ellipse(12, 12 + dy, 2.4, 2.4, '#ffb32c'); p.ellipse(20, 12 + dy, 2.4, 2.4, '#ffb32c'); p.rect(11, 11 + dy, 2, 2, C.eye); p.rect(19, 11 + dy, 2, 2, C.eye); p.set(11, 11 + dy, '#fff'); p.set(19, 11 + dy, '#fff'); }
    // gözlük
    p.ring(12, 12 + dy, 4.4, 4.2, '#3a2a1c', 1); p.ring(20, 12 + dy, 4.4, 4.2, '#3a2a1c', 1); p.hline(15, 17, 11 + dy, '#3a2a1c');
    // gaga
    p.poly([[15, 15 + dy], [17, 15 + dy], [16, 18 + dy]], '#ffb32c');
    // papyon
    p.map(['#.#', '###', '#.#'], { '#': '#6f4ad8' }, 15, 20 + dy); p.set(16, 21 + dy, '#9f80ff');
    // ayaklar
    p.set(13, 29, '#ffb32c'); p.set(14, 29, '#ffb32c'); p.set(18, 29, '#ffb32c'); p.set(19, 29, '#ffb32c');
    p.outline(INK);
    return p;
  }

  // ============================================================ IŞIL (ateş böceği)
  function fireflySprite(f) {
    const p = pc(16, 16);
    const dy = f === 1 ? -1 : 0;
    p.ellipse(5, 10 + dy, 3.6, 3.2, f === 2 ? '#d8ff7f' : '#b8f060'); p.ellipse(4.5, 9.5 + dy, 2.2, 2, '#f4ffc0');
    p.ellipse(10, 9 + dy, 3.4, 3, '#3b2c66');
    p.ellipse(12, 7.5 + dy, 2.6, 2.6, '#4b3d82');
    p.set(13, 7 + dy, '#ffffff'); p.set(12, 7 + dy, '#ffffff'); p.set(13, 8 + dy, C.eye);
    p.set(11, 9 + dy, '#ff9ad0');
    p.ellipse(8, 5 + dy, 2.6, 2, '#e0f0ff'); p.ellipse(10, 4.5 + dy, 2.2, 2, '#c8e4ff');
    p.line(13, 5 + dy, 15, 2 + dy, INK); p.line(12, 5 + dy, 12, 2 + dy, INK);
    p.outline(INK);
    return p;
  }

  // ============================================================ BORA (kutup tilkisi) ve GÖLGE
  function foxSprite(mode, f) {
    // mode: 'stand' | 'run' | 'frozen' | 'warm' ; sağa bakar (32x24)
    const p = pc(32, 24);
    const white = mode === 'frozen' ? '#cfe6f4' : '#f8fbff', shade = mode === 'frozen' ? '#9fc4dc' : '#d6e2f2', dark = '#4a5a78';
    if (mode === 'frozen') {
      // kıvrılmış, donmuş
      p.ellipse(15, 17, 11, 6.5, shade); p.ellipse(15, 16.5, 10.2, 5.8, white);
      p.ellipse(8, 15, 7, 4.5, white); p.ellipse(7, 14.5, 5, 3, '#ffffff');
      p.ellipse(22, 14, 5, 4.2, white);
      p.poly([[19, 11], [21, 6], [23, 11]], white); p.poly([[23, 11], [26, 7], [26, 12]], white);
      sadEye(p, 23, 14, dark); p.set(26, 15, dark);
      for (const [x, y] of [[10, 12], [16, 13], [20, 18], [12, 19], [25, 12]]) p.set(x, y, '#ffffff');
      for (const [x, y] of [[6, 18], [18, 20], [27, 16]]) p.set(x, y, '#8fd0f0');
      p.outline('#2a3a58');
      return p;
    }
    const run = mode === 'run';
    const by = run ? (f % 2 ? 11 : 12) : 13;
    // kuyruk
    const tail = run ? [[1, by - 4], [8, by - 1], [8, by + 3], [0, by + 1]] : [[2, by - 9], [8, by - 2], [9, by + 2], [3, by - 3]];
    p.poly(tail, white); p.ellipse(run ? 2 : 3, run ? by - 1 : by - 7, 2.6, 2.6, white);
    if (mode === 'warm') p.ellipse(4, by - 6, 2.4, 2.4, '#ffd23c');
    // gövde
    p.ellipse(15, by + 2, 8.5, 5, shade); p.ellipse(15, by + 1.5, 8, 4.4, white);
    // bacaklar
    const legs = run ? (f % 2 ? [[9, 4, -2], [12, 4, 2], [19, 4, -2], [22, 4, 2]] : [[9, 4, 2], [12, 4, -2], [19, 4, 2], [22, 4, -2]]) : [[10, 5, 0], [13, 5, 0], [19, 5, 0], [22, 5, 0]];
    for (const [x, h, s] of legs) { p.line(x, by + 5, x + s, by + 5 + h, white); p.set(x + s, by + 5 + h, dark); }
    // baş
    p.ellipse(25, by - 3, 5, 4.4, white);
    p.poly([[21, by - 6], [22, by - 12], [25, by - 7]], white); p.poly([[25, by - 7], [28, by - 12], [28, by - 5]], white);
    p.set(23, by - 9, '#ffc0d0'); p.set(27, by - 9, '#ffc0d0');
    p.poly([[28, by - 4], [32, by - 2], [28, by]], white); p.set(31, by - 2, dark);
    p.rect(26, by - 4, 2, 2, '#3a7ab8'); p.set(26, by - 4, '#ffffff');
    // atkı (mavi)
    p.poly([[20, by - 1], [26, by + 1], [25, by + 3], [19, by + 2]], '#4a7ab8'); p.vline(20, by + 2, by + 5, '#4a7ab8');
    p.outline('#2a3a58');
    return p;
  }

  function shadowSprite(f) {
    const p = foxSprite('run', f);
    p.silhouette('#1e2440');
    for (const [x, y] of [[6, 9], [14, 10], [22, 7], [27, 9], [11, 14], [18, 15]]) p.set(x, y + (f % 2 ? 0 : 1), '#dff4ff');
    return p;
  }

  // ============================================================ PORTRELER (48x48)
  function frame48() { return pc(48, 48); }

  function beePortrait(role, face) {
    const p = frame48();
    // kanatlar
    p.ellipse(9, 14, 8, 10, C.wingS); p.ellipse(15, 10, 7, 10, C.wing);
    // gövde (alt)
    p.ellipse(22, 44, 18, 12, C.yelS); p.ellipse(22, 43, 17, 11, C.yel);
    for (let y = 33; y < 48; y++) for (const x of [10, 11, 17, 18]) if (p.alpha(x, y)) p.set(x, y, C.ink2);
    // baş
    p.ellipse(27, 22, 14, 13, C.yelS); p.ellipse(27.5, 21, 13.2, 12, C.yel);
    p.ellipse(22, 13, 4, 2, C.yelL);
    // anten
    p.line(22, 10, 18, 2, INK); p.ellipse(18, 2, 1.6, 1.6, INK);
    p.line(31, 10, 36, 2, INK); p.ellipse(36, 2, 1.6, 1.6, INK);
    // yüz
    const E = C.eye;
    const ex1 = 23, ex2 = 33, ey = 21;
    switch (face) {
      case 'happy': for (const ex of [ex1, ex2]) { p.line(ex - 3, ey + 1, ex, ey - 2, E); p.line(ex, ey - 2, ex + 3, ey + 1, E); p.line(ex - 2, ey + 1, ex, ey - 1, E); p.line(ex, ey - 1, ex + 2, ey + 1, E); } break;
      case 'surprised': for (const ex of [ex1, ex2]) { p.ellipse(ex, ey, 3.2, 4, E); p.ellipse(ex - 1, ey - 1.5, 1, 1.2, '#fff'); } break;
      case 'shy': for (const ex of [ex1, ex2]) { p.hline(ex - 3, ex + 3, ey + 1, E); p.set(ex - 3, ey, E); p.set(ex + 3, ey, E); } break;
      case 'angry': for (const ex of [ex1, ex2]) { p.ellipse(ex, ey + 1, 2.6, 2.8, E); p.set(ex - 1, ey, '#fff'); } p.line(ex1 - 4, ey - 5, ex1 + 3, ey - 2, E); p.line(ex2 + 4, ey - 5, ex2 - 3, ey - 2, E); break;
      case 'sad': for (const ex of [ex1, ex2]) { p.ellipse(ex, ey + 1, 2.6, 3, E); p.set(ex - 1, ey, '#fff'); p.set(ex - 1, ey - 0, '#fff'); } p.line(ex1 - 3, ey - 3, ex1 + 3, ey - 5, E); p.line(ex2 - 3, ey - 5, ex2 + 3, ey - 3, E); p.ellipse(ex1 - 2, ey + 6, 1, 1.6, C.blueL); break;
      default: for (const ex of [ex1, ex2]) { p.ellipse(ex, ey, 3, 3.6, E); p.ellipse(ex - 1, ey - 1.4, 1.1, 1.2, '#fff'); p.set(ex + 1, ey + 2, '#5a4a40'); }
    }
    // yanak + ağız
    const blush = face === 'shy' ? 2 : 1;
    p.ellipse(18, 27, 2.6 * blush, 1.4 * blush, C.cheek); p.ellipse(38, 27, 2.6 * blush, 1.4 * blush, C.cheek);
    if (face === 'surprised') p.ellipse(28, 29, 2, 2.4, C.mouth);
    else if (face === 'sad' || face === 'angry') { p.hline(26, 30, 30, C.mouth); p.set(25, 31, C.mouth); p.set(31, 31, C.mouth); }
    else { p.set(25, 28, C.mouth); p.hline(26, 30, 29, C.mouth); p.set(31, 28, C.mouth); if (face === 'happy') { p.hline(27, 29, 30, '#d84a6a'); } }
    // kirpik (dişi)
    if (role === 'disi') { p.line(ex2 + 3, ey - 3, ex2 + 5, ey - 5, E); p.line(ex1 - 3, ey - 3, ex1 - 5, ey - 5, E); }
    p.outline(INK);
    // aksesuar
    if (role === 'disi') {
      p.map([
        '.rrr...rrr.',
        'rrPrr.rrPrr',
        'rrrrRkRrrrr',
        'rrrrkkkrrrr',
        'rrrrRkRrrrr',
        '.rrr...rrr.',
      ], { r: C.pink, R: C.pinkD, P: C.pinkL, k: C.pinkD }, 26, 3);
      p.outline(INK);
    } else {
      p.map([
        '....kkkkkk......',
        '..kkbbbbBBkk....',
        '.kbbbbbbbBBbk...',
        'kbbbbbbbbbbbbk..',
        'kkkkkkkkkkkkkkkk',
        '..........kdddk.',
      ], { k: INK, b: C.blue, B: C.blueL, d: C.blueD }, 18, 4);
    }
    return p;
  }

  function queenPortrait(face) {
    const p = frame48();
    p.ellipse(7, 18, 7, 11, C.wingS); p.ellipse(12, 12, 7, 11, C.wing);
    p.ellipse(24, 46, 20, 10, C.yelS); p.ellipse(24, 45, 19, 9, C.yel);
    // şal
    p.poly([[6, 40], [16, 31], [34, 31], [44, 40], [44, 48], [6, 48]], '#b49ad8');
    p.poly([[16, 31], [34, 31], [30, 37], [20, 37]], '#c8b4e8');
    p.hline(8, 42, 46, '#8f74b8'); p.ellipse(25, 38, 2, 2, '#ffd23c');
    // baş
    p.ellipse(25, 21, 14, 13, C.yelS); p.ellipse(25.5, 20, 13.2, 12, C.yel);
    p.ellipse(19, 12, 4, 2, C.yelL);
    const E = C.eye;
    if (face === 'sad') { sadEye(p, 20, 21, E); sadEye(p, 31, 21, E); p.line(17, 19, 22, 18, E); p.line(29, 18, 34, 19, E); }
    else if (face === 'talk' || face === 'normal') { for (const ex of [20, 31]) { p.ellipse(ex, 21, 2.4, 2.8, E); p.set(ex - 1, 20, '#fff'); } }
    else { for (const ex of [20, 31]) { p.line(ex - 3, 22, ex, 19, E); p.line(ex, 19, ex + 3, 22, E); } }
    // gözlük izi değil, bilge kırışıklar
    p.set(15, 23, '#e0a040'); p.set(36, 23, '#e0a040');
    p.ellipse(16, 26, 2.4, 1.3, C.cheek); p.ellipse(35, 26, 2.4, 1.3, C.cheek);
    if (face === 'talk') p.ellipse(25.5, 28, 2, 1.6, C.mouth);
    else if (face === 'sad') p.hline(24, 27, 29, C.mouth);
    else { p.set(23, 27, C.mouth); p.hline(24, 27, 28, C.mouth); p.set(28, 27, C.mouth); }
    p.line(20, 9, 15, 1, INK); p.ellipse(14, 1, 1.4, 1.4, INK); p.line(31, 9, 36, 1, INK); p.ellipse(37, 1, 1.4, 1.4, INK);
    p.outline(INK);
    // taç
    p.map([
      '#...#...#...#',
      '##.###.###.##',
      '#############',
      'gyyrgyybgyyrg',
      'ggggggggggggg',
    ], { '#': '#ffcf3a', g: '#e8a020', y: '#fff3a6', r: '#ff5f8f', b: '#6fb6f2' }, 19, 3);
    p.outline(INK);
    return p;
  }

  function punturPortrait(face) {
    const p = frame48();
    p.ellipse(18, 40, 19, 14, '#c8282c'); p.ellipse(18, 39, 18, 13, '#ff4a4a');
    for (const [x, y, r] of [[8, 36, 3], [14, 44, 2.5], [24, 34, 2.6], [28, 44, 2.4]]) p.ellipse(x, y, r, r, '#2b1a10');
    p.vline(18, 26, 48, '#2b1a10');
    p.ellipse(9, 30, 3, 1.6, '#ffb3b3');
    // baş
    p.ellipse(31, 24, 13, 12, '#2b1a10');
    const look = face === 'surprised' ? 0 : 1;
    p.ellipse(27, 22, 4.6, 5.2, '#ffffff'); p.ellipse(37, 22, 4.2, 5, '#ffffff');
    if (face === 'happy') { p.line(24, 23, 27, 20, '#2b1a10'); p.line(27, 20, 30, 23, '#2b1a10'); p.line(34, 23, 37, 20, '#2b1a10'); p.line(37, 20, 40, 23, '#2b1a10'); p.rect(23, 24, 18, 3, '#2b1a10'); }
    else { p.ellipse(27 + look, 23, 2.2, 2.8, '#2b1a10'); p.ellipse(37 + look, 23, 2, 2.6, '#2b1a10'); p.set(27, 21, '#fff'); p.set(37, 21, '#fff'); }
    p.ellipse(25, 30, 2.4, 1.2, '#ff8fae'); p.ellipse(39, 30, 2.4, 1.2, '#ff8fae');
    if (face === 'surprised' || face === 'talk') p.ellipse(32, 31, 2.2, 2.2, '#ff8fae');
    else { p.hline(30, 34, 32, '#ff8fae'); p.set(29, 31, '#ff8fae'); p.set(35, 31, '#ff8fae'); }
    p.line(27, 13, 22, 3, '#2b1a10'); p.ellipse(21, 3, 2, 2, '#2b1a10');
    p.line(35, 13, 40, 3, '#2b1a10'); p.ellipse(41, 3, 2, 2, '#2b1a10');
    p.outline(INK);
    return p;
  }

  function frogPortrait(face) {
    const p = frame48();
    p.poly([[2, 30], [14, 28], [12, 48], [0, 48]], '#d8343c'); p.hline(0, 12, 47, '#ffffff'); p.hline(0, 12, 46, '#ffffff');
    p.ellipse(25, 44, 20, 10, '#3f9a52'); p.ellipse(25, 43, 19, 9, '#5cc27a'); p.ellipse(27, 46, 11, 5, '#d8f0a0');
    p.ellipse(25, 29, 19, 10, '#3f9a52'); p.ellipse(25, 28, 18, 9.3, '#5cc27a');
    p.ellipse(15, 17, 7, 7, '#3f9a52'); p.ellipse(35, 17, 7, 7, '#3f9a52'); p.ellipse(15, 16.5, 6.4, 6.4, '#5cc27a'); p.ellipse(35, 16.5, 6.4, 6.4, '#5cc27a');
    if (face === 'happy') { for (const ex of [15, 35]) { p.ellipse(ex, 17, 4.6, 4.6, '#ffffff'); p.line(ex - 3, 18, ex, 15, C.eye); p.line(ex, 15, ex + 3, 18, C.eye); } }
    else { eyesRound(p, 15, 17, 4.6, C.eye, face === 'surprised' ? 0 : 1); eyesRound(p, 35, 17, 4.6, C.eye, face === 'surprised' ? 0 : 1); }
    if (face === 'talk' || face === 'surprised') { p.ellipse(25, 32, 8, 3.4, '#8a2a3a'); p.hline(19, 31, 34, '#ff8fae'); }
    else { for (let x = 11; x <= 39; x++) { const y = 31 + Math.round(Math.sin((x - 11) / 28 * Math.PI) * 2); p.set(x, y, '#2f6a2a'); } }
    p.ellipse(9, 28, 2.6, 1.4, C.cheek); p.ellipse(41, 28, 2.6, 1.4, C.cheek);
    p.set(22, 25, '#2f6a2a'); p.set(28, 25, '#2f6a2a');
    p.outline(INK);
    p.map([
      '#....#....#',
      '##..###..##',
      '###########',
      'grgggbgggrg',
    ], { '#': '#ffcf3a', g: '#e8a020', r: '#ff5f8f', b: '#6fb6f2' }, 21, 4);
    p.outline(INK);
    return p;
  }

  function owlPortrait(face) {
    const p = frame48();
    p.ellipse(24, 40, 19, 14, '#8a5a34'); p.ellipse(24, 43, 11, 9, '#d8b88a');
    for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) { const x = 17 + i * 4, y = 38 + k * 3; p.set(x, y, '#a88058'); p.set(x + 1, y + 1, '#a88058'); }
    p.ellipse(24, 22, 17, 15, '#8a5a34');
    p.poly([[8, 2], [17, 11], [10, 14]], '#6e4628'); p.poly([[40, 2], [31, 11], [38, 14]], '#6e4628');
    p.ellipse(17, 22, 8, 7.6, '#efe0c0'); p.ellipse(31, 22, 8, 7.6, '#efe0c0');
    if (face === 'happy') { for (const ex of [17, 31]) { p.line(ex - 3, 23, ex, 20, C.eye); p.line(ex, 20, ex + 3, 23, C.eye); } }
    else { for (const ex of [17, 31]) { p.ellipse(ex, 22, 4, 4, '#ffb32c'); p.ellipse(ex, 22.3, 2, 2.2, C.eye); p.set(ex - 1, 21, '#fff'); } if (face === 'think') { p.hline(13, 21, 19, '#8a5a34'); } }
    p.ring(17, 22, 7, 6.6, '#3a2a1c', 1.2); p.ring(31, 22, 7, 6.6, '#3a2a1c', 1.2); p.hline(23, 25, 21, '#3a2a1c');
    p.poly([[22, 28], [26, 28], [24, face === 'talk' ? 34 : 32]], '#ffb32c');
    if (face === 'talk') p.hline(23, 25, 30, '#c8781a');
    p.map(['##...##', '###.###', '#######', '###.###', '##...##'], { '#': '#6f4ad8' }, 21, 35); p.set(24, 37, '#9f80ff');
    p.outline(INK);
    return p;
  }

  function fireflyPortrait(face) {
    const p = frame48();
    // ışıklı kuyruk (düz renk halka, parlama yok)
    p.ellipse(12, 34, 11, 10, '#b8f060'); p.ellipse(11, 33, 7, 6.4, '#f4ffc0');
    p.ellipse(28, 32, 11, 10, '#3b2c66');
    p.ellipse(15, 14, 8, 6, '#e0f0ff'); p.ellipse(22, 10, 7, 6, '#c8e4ff');
    p.ellipse(32, 22, 11, 10, '#4b3d82');
    if (face === 'sad') { sadEye(p, 28, 21, '#ffffff'); sadEye(p, 36, 21, '#ffffff'); p.ellipse(27, 26, 1, 1.6, '#9fd8ff'); }
    else if (face === 'happy') { happyEye(p, 28, 21, '#ffffff'); happyEye(p, 36, 21, '#ffffff'); }
    else { for (const ex of [28, 36]) { p.ellipse(ex, 21, 2.6, 3, '#ffffff'); p.ellipse(ex + 0.5, 21.6, 1.3, 1.7, '#1e120a'); } }
    p.ellipse(24, 26, 2, 1, '#ff9ad0'); p.ellipse(40, 26, 2, 1, '#ff9ad0');
    if (face === 'talk') p.ellipse(32, 28, 1.4, 1.2, '#ff9ad0'); else p.hline(31, 33, 28, '#ff9ad0');
    p.line(36, 13, 41, 4, INK); p.ellipse(42, 3, 1.4, 1.4, '#f4ffc0'); p.line(30, 13, 28, 4, INK); p.ellipse(28, 3, 1.4, 1.4, '#f4ffc0');
    p.outline(INK);
    return p;
  }

  function foxPortrait(face) {
    const p = frame48();
    const frozen = face === 'frozen';
    const white = frozen ? '#cfe6f4' : '#f8fbff', shade = frozen ? '#9fc4dc' : '#d6e2f2';
    p.ellipse(22, 44, 18, 9, shade); p.ellipse(22, 43, 17, 8, white);
    // atkı
    p.poly([[8, 36], [38, 34], [40, 40], [8, 42]], '#4a7ab8'); p.rect(30, 40, 5, 8, '#4a7ab8'); p.hline(8, 38, 38, '#6a9ad8');
    // baş
    p.ellipse(24, 24, 14, 12, shade); p.ellipse(24, 23, 13.4, 11.4, white);
    p.poly([[11, 18], [12, 1], [21, 13]], white); p.poly([[37, 18], [36, 1], [27, 13]], white);
    p.poly([[13, 15], [13.5, 5], [19, 13]], '#ffc0d0'); p.poly([[35, 15], [34.5, 5], [29, 13]], '#ffc0d0');
    // burun ucu
    p.ellipse(24, 30, 6, 4, white); p.ellipse(24, 27.5, 2, 1.4, '#3a3a4a');
    const E = '#3a7ab8';
    if (frozen) { sadEye(p, 18, 21, '#5a6a88'); sadEye(p, 30, 21, '#5a6a88'); for (const [x, y] of [[12, 12], [33, 9], [20, 33], [28, 16]]) p.set(x, y, '#ffffff'); }
    else if (face === 'soft' || face === 'happy') { happyEye(p, 18, 21, E); happyEye(p, 30, 21, E); p.ellipse(13, 26, 2.2, 1.2, '#ffb8c8'); p.ellipse(35, 26, 2.2, 1.2, '#ffb8c8'); }
    else if (face === 'sad') { for (const ex of [18, 30]) { p.ellipse(ex, 22, 2, 2.4, E); p.set(ex - 1, 21, '#fff'); } p.line(15, 18, 20, 19, '#5a6a88'); p.line(28, 19, 33, 18, '#5a6a88'); }
    else { for (const ex of [18, 30]) { p.ellipse(ex, 22, 2, 2.4, E); p.set(ex - 1, 21, '#fff'); } p.line(14, 17, 21, 19, '#5a6a88'); p.line(27, 19, 34, 17, '#5a6a88'); }
    if (face === 'talk') p.hline(22, 26, 32, '#5a3a4a'); else if (face === 'soft' || face === 'happy') { p.set(22, 31, '#5a3a4a'); p.set(23, 32, '#5a3a4a'); p.set(25, 32, '#5a3a4a'); p.set(26, 31, '#5a3a4a'); }
    else p.hline(22, 26, 32, '#8a6a7a');
    p.outline('#2a3a58');
    return p;
  }

  BB.buildCharacters = function (book) {
    book.add('npc_kralice', [0, 1, 2].map(queenSprite));
    book.add('npc_puntur', [0, 1].map(punturSprite));
    book.add('npc_zipzip', [0, 1, 2, 3].map(frogSprite));
    book.add('npc_hu', [0, 1, 2].map(owlSprite));
    book.add('npc_isil', [0, 1, 2].map(fireflySprite));
    book.add('npc_bora', [foxSprite('stand', 0), foxSprite('stand', 1)]);
    book.add('npc_bora_run', [0, 1].map((f) => foxSprite('run', f)));
    book.add('npc_bora_frozen', [foxSprite('frozen', 0)]);
    book.add('npc_bora_warm', [foxSprite('warm', 0)]);
    book.add('npc_golge', [0, 1].map(shadowSprite));
    for (const role of ['disi', 'erkek']) for (const f of ['normal', 'happy', 'surprised', 'shy', 'angry', 'sad']) book.add(`pt_${role}_${f}`, [beePortrait(role, f)]);
    for (const f of ['normal', 'talk', 'happy', 'sad']) book.add('pt_kralice_' + f, [queenPortrait(f)]);
    for (const f of ['normal', 'talk', 'happy', 'surprised']) book.add('pt_puntur_' + f, [punturPortrait(f)]);
    for (const f of ['normal', 'talk', 'happy', 'surprised']) book.add('pt_zipzip_' + f, [frogPortrait(f)]);
    for (const f of ['normal', 'talk', 'happy', 'think']) book.add('pt_hu_' + f, [owlPortrait(f)]);
    for (const f of ['normal', 'talk', 'happy', 'sad']) book.add('pt_isil_' + f, [fireflyPortrait(f)]);
    for (const f of ['normal', 'talk', 'soft', 'sad', 'frozen', 'happy']) book.add('pt_bora_' + f, [foxPortrait(f)]);
  };
})(typeof window !== 'undefined' ? window : globalThis);
