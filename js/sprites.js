/* Bee & Bloom — karakter ve nesne sprite'ları (kodla piksel piksel çizilir; DOM gerektirmez). */
(function (root) {
  'use strict';
  const BB = root.BB;
  const { PixelCanvas, SpriteBook } = BB.Art;

  // ------------------------------------------------------------ ortak palet
  const C = {
    ink: '#2b1a10', ink2: '#4a2c17',
    yel: '#ffd23c', yelS: '#eba524', yelL: '#fff3a6',
    wing: '#f4fcff', wingS: '#bfe6f7', wingL: '#9fd2ea',
    eye: '#1e120a', shine: '#ffffff', cheek: '#ff8fae', mouth: '#8a3a2a',
    pink: '#ff6fa3', pinkD: '#c93f74', pinkL: '#ffb8d2',
    blue: '#4a9be8', blueD: '#2b67b0', blueL: '#a6d6ff',
    white: '#ffffff', cream: '#fff4dc',
  };
  BB.PAL = C;

  const pc = (w, h) => new PixelCanvas(w, h);

  // ------------------------------------------------------------ arı (16x16, sağa bakar)
  // poz: { dy (gövde kayması), sq (ezilme: -1 uzama, 1 basık), legs: 0..3 }
  function beeBody(o) {
    o = o || {};
    const p = pc(16, 16);
    const dy = o.dy || 0;
    const sq = o.sq || 0;
    const rx = 5.9 + sq * 0.5, ry = 4.5 - sq * 0.5;
    const cy = 10.5 + dy + sq * 0.5;
    p.ellipse(7.6, cy, rx, ry, C.yelS);
    p.ellipse(7.8, cy - 0.8, rx - 0.5, ry - 0.8, C.yel);
    // iki ince çizgi (arka tarafta)
    for (let y = 0; y < 16; y++) for (const x of [3, 5]) if (p.alpha(x, y)) p.set(x, y, C.ink2);
    // parlama
    const ty = Math.round(cy - ry + 1);
    p.set(8, ty, C.yelL); p.set(9, ty, C.yelL); p.set(10, ty + 1, C.yelL);
    // iğne
    const sy = Math.round(cy);
    p.set(1, sy, C.ink2);
    p.outline(C.ink);
    // bacaklar
    const ly = Math.min(15, Math.round(cy + ry + 1));
    const L = o.legs || 0;
    if (ly <= 15) {
      const lx = [6, 9];
      p.set(lx[0] + (L === 1 ? -1 : L === 3 ? 1 : 0), ly, C.ink);
      p.set(lx[1] + (L === 1 ? 1 : L === 3 ? -1 : 0), ly, C.ink);
    }
    return p;
  }

  // yüz: ifadeye göre gözler/ağız. Gövde merkezine göre konumlanır.
  function beeFace(p, face, dy) {
    dy = Math.round(dy || 0);
    const ey = 9 + dy, ex1 = 9, ex2 = 11;
    const E = C.eye, S = C.shine;
    switch (face) {
      case 'happy':   // ^ ^
        p.set(ex1 - 1, ey + 1, E); p.set(ex1, ey, E); p.set(ex1 + 1, ey + 1, E);
        p.set(ex2, ey, E); p.set(ex2 + 1, ey + 1, E);
        p.set(11, ey + 3, C.mouth); p.set(10, ey + 2, C.mouth); p.set(12, ey + 2, C.mouth);
        p.set(8, ey + 2, C.cheek); p.set(13, ey + 2, C.cheek);
        break;
      case 'surprised':
        p.rect(ex1 - 1, ey - 1, 2, 3, E); p.set(ex1 - 1, ey - 1, S);
        p.rect(ex2, ey - 1, 2, 3, E); p.set(ex2, ey - 1, S);
        p.set(11, ey + 3, C.mouth); p.set(11, ey + 4, C.mouth);
        break;
      case 'shy':
        p.set(ex1 - 1, ey + 1, E); p.set(ex1, ey + 1, E); p.set(ex2, ey + 1, E); p.set(ex2 + 1, ey + 1, E);
        p.set(8, ey + 2, C.cheek); p.set(9, ey + 2, C.cheek); p.set(12, ey + 2, C.cheek); p.set(13, ey + 2, C.cheek);
        p.set(11, ey + 3, C.mouth);
        break;
      case 'angry':
        p.rect(ex1 - 1, ey, 2, 2, E); p.rect(ex2, ey, 2, 2, E);
        p.set(ex1 - 1, ey - 1, E); p.set(ex2 + 1, ey - 1, E);
        p.set(10, ey + 3, C.mouth); p.set(11, ey + 3, C.mouth); p.set(12, ey + 3, C.mouth);
        break;
      case 'sad':
        p.rect(ex1 - 1, ey, 2, 2, E); p.rect(ex2, ey, 2, 2, E);
        p.set(ex1 - 1, ey, S); p.set(ex2, ey, S);
        p.set(10, ey + 4, C.mouth); p.set(11, ey + 3, C.mouth); p.set(12, ey + 4, C.mouth);
        p.set(ex1 - 1, ey + 2, C.blueL);
        break;
      case 'dizzy':   // x x
        for (const ex of [ex1 - 1, ex2]) { p.set(ex, ey - 1, E); p.set(ex + 1, ey, E); p.set(ex, ey + 1, E); p.set(ex + 1, ey - 1, E); p.set(ex + 1, ey + 1, E); }
        p.set(11, ey + 3, C.mouth);
        break;
      case 'blink':
        p.set(ex1 - 1, ey + 1, E); p.set(ex1, ey + 1, E); p.set(ex2, ey + 1, E); p.set(ex2 + 1, ey + 1, E);
        p.set(11, ey + 3, C.mouth);
        p.set(8, ey + 2, C.cheek); p.set(13, ey + 2, C.cheek);
        break;
      default:        // normal: iri parlak gözler
        p.rect(ex1 - 1, ey, 2, 2, E); p.set(ex1 - 1, ey, S);
        p.rect(ex2, ey, 2, 2, E); p.set(ex2, ey, S);
        p.set(11, ey + 3, C.mouth);
        p.set(8, ey + 2, C.cheek); p.set(13, ey + 2, C.cheek);
    }
  }

  // antenler ve aksesuar (dişi: fiyonk, erkek: şapka)
  function beeHead(p, role, dy, bob) {
    dy = dy || 0; bob = bob || 0;
    const top = Math.round(6 + dy);
    // antenler (uçları yuvarlak)
    p.set(10, top - 1, C.ink); p.set(10, top - 2, C.ink); p.set(9, top - 3 + bob, C.ink); p.set(8, top - 4 + bob, C.ink); p.set(9, top - 4 + bob, C.ink);
    p.set(12, top - 1, C.ink); p.set(13, top - 2, C.ink); p.set(13, top - 3 + bob, C.ink); p.set(14, top - 4 + bob, C.ink); p.set(13, top - 4 + bob, C.ink);
    if (role === 'disi') {
      // fiyonk (başın üstünde)
      p.map([
        'rr.rr',
        'rRPRr',
        'rr.rr',
      ], { r: C.pink, R: C.pinkD, P: C.pinkL }, 9, top - 2);
      p.set(9, top - 3, C.ink); p.set(13, top - 3, C.ink);
      // kirpik
      p.set(12, Math.round(9 + dy) - 1, C.ink);
    } else {
      // küçük şapka (siperi önde)
      p.map([
        '..kkkk..',
        '.kbbbBk.',
        'kbbbbbbk',
        '.kkkkkkkk',
      ], { k: C.ink, b: C.blue, B: C.blueL }, 7, top - 3);
    }
  }

  // kanatlar: f = 0 yukarı, 1 orta, 2 aşağı; 'g' süzülme, 'fold' katlı. near = öndeki kanat, far = arkadaki
  const WING = {
    fold: { rows: ['.kkk..', 'kwwwk.', 'kwwssk', '.kkkk.'], ox: 2, oy: -2 },
    g: { rows: ['.kkkkk..', 'kwwwwwk.', 'kwwwsssk', '.kkkkkk.'], ox: 0, oy: -3 },
    0: { rows: ['..kk.', '.kwwk', 'kwwwk', 'kwwsk', 'kwssk', '.kkk.'], ox: 3, oy: -6 },
    1: { rows: ['.kkkk..', 'kwwwwk.', 'kwwsssk', '.kkkkk.'], ox: 1, oy: -3 },
    2: { rows: ['.kkk.', 'kwwsk', 'kwssk', 'kssk.', '.kk..'], ox: 2, oy: 0 },
  };
  function beeWings(f, dy, far) {
    const p = pc(16, 16);
    const top = Math.round(6 + (dy || 0));
    const def = WING[f];
    if (!def) return p;
    const pal = far ? { k: C.wingL, w: C.wingS, s: C.wingL } : { k: C.wingL, w: C.wing, s: C.wingS };
    p.map(def.rows, pal, def.ox + (far ? 2 : 0), top + def.oy - (far ? 1 : 0));
    return p;
  }

  function bee(role, pose) {
    const dy = pose.dy || 0;
    const p = pc(16, 16);
    if (pose.w !== 'none') p.blit(beeWings(pose.w, dy, true), 0, 0);
    p.blit(beeBody(pose), 0, 0);
    beeFace(p, pose.face || 'normal', dy + (pose.sq || 0) * 0.5);
    if (pose.w !== 'none') p.blit(beeWings(pose.w, dy, false), 0, 0);
    beeHead(p, role, dy + (pose.sq || 0) * 0.7, pose.bob || 0);
    return p;
  }

  const FACES = ['normal', 'happy', 'surprised', 'shy', 'angry', 'sad', 'dizzy', 'blink'];

  function buildBees(book) {
    for (const role of ['disi', 'erkek']) {
      const R = role;
      book.add(R + '_idle', [bee(R, { w: 'fold', dy: 0 }), bee(R, { w: 'fold', dy: 0, bob: 1 }), bee(R, { w: 'fold', dy: 1, sq: 0.4 }), bee(R, { w: 'fold', dy: 0, bob: 1 })], 3, 4);
      book.add(R + '_walk', [0, 1, 2, 3].map((i) => bee(R, { w: 'fold', dy: i % 2 ? -1 : 0, legs: i, bob: i % 2 })), 3, 4);
      book.add(R + '_fly', [0, 1, 2, 3].map((i) => bee(R, { w: i === 3 ? 1 : i, dy: i === 0 ? -1 : i === 2 ? 0 : -0.5 })), 3, 4);
      book.add(R + '_glide', [bee(R, { w: 'g', dy: 0 }), bee(R, { w: 'g', dy: -0.5 })], 3, 4);
      book.add(R + '_fall', [bee(R, { w: 0, dy: 0, face: 'surprised', sq: -0.6 })], 3, 4);
      book.add(R + '_land', [bee(R, { w: 'fold', dy: 1, sq: 1 })], 3, 4);
      book.add(R + '_held', [bee(R, { w: 'fold', dy: 0, face: 'happy', sq: 0.3 })], 3, 4);
      book.add(R + '_dead', [bee(R, { w: 2, dy: 0, face: 'dizzy' })], 3, 4);
      for (const f of FACES) book.add(R + '_face_' + f, [bee(R, { w: 'fold', face: f })], 3, 4);
    }
  }

  // ------------------------------------------------------------ nesneler
  const G = { stem: '#4f9a3f', stemD: '#2f6a2a', leaf: '#6cc04f', leafL: '#a6e48a', honey: '#ffb32c', honeyL: '#ffd96a', honeyD: '#d9821a', brown: '#7a4a24', brownD: '#4a2c17' };

  function honeyFlower(stage) {
    // stage: 0 kapalı tomurcuk … 3 tam açık (16x24, ayak tabanı alt kenarda)
    const p = pc(16, 24);
    p.vline(8, 12, 23, G.stem); p.vline(7, 14, 23, G.stemD);
    p.map(['.ll.', 'lLl.', '.ll.'], { l: G.leaf, L: G.leafL }, 9, 17);
    p.map(['.ll.', '.lLl', '.ll.'], { l: G.leaf, L: G.leafL }, 3, 19);
    const cx = 8, cy = 8;
    if (stage === 0) {
      p.ellipse(cx, cy + 2, 3, 4.5, G.honeyD); p.ellipse(cx, cy + 1.5, 2.4, 3.8, G.honey); p.set(cx - 1, cy - 1, G.honeyL);
    } else {
      const r = stage === 1 ? 3.2 : stage === 2 ? 4.6 : 5.6;
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 - Math.PI / 2;
        p.ellipse(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75, r * 0.55, r * 0.55, G.honey);
      }
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 - Math.PI / 2; p.set(Math.round(cx + Math.cos(a) * r * 0.9), Math.round(cy + Math.sin(a) * r * 0.9), G.honeyL); }
      p.ellipse(cx, cy, Math.max(1.6, r * 0.42), Math.max(1.6, r * 0.42), G.brown);
      p.set(cx - 1, cy - 1, G.honeyD);
    }
    p.outline(C.ink);
    return p;
  }

  function pollenOrb(f) {
    const p = pc(8, 8);
    p.ellipse(4, 4, 3, 3, '#f0b020'); p.ellipse(3.6, 3.6, 2.3, 2.3, '#ffd84a');
    p.set(2, 2, '#fff6c0');
    if (f) { p.set(5, 2, '#fff6c0'); }
    p.outline('#a8650f');
    return p;
  }

  function rareFlower(f) {
    const p = pc(14, 14);
    const cols = ['#ff7fbf', '#ffd23c', '#7fd0ff', '#b08aff'];
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2 + (f ? 0.4 : 0);
      p.ellipse(7 + Math.cos(a) * 3.2, 7 + Math.sin(a) * 3.2, 2.4, 2.4, cols[k]);
    }
    p.ellipse(7, 7, 1.8, 1.8, '#ffffff');
    p.outline(C.ink);
    return p;
  }

  function nectarFlower(full) {
    const p = pc(16, 16);
    p.vline(8, 9, 15, G.stem);
    const pet = full ? '#ff9ad0' : '#d9a6c2', petL = full ? '#ffd0ea' : '#ead3df';
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; p.ellipse(8 + Math.cos(a) * 3.4, 6 + Math.sin(a) * 3.4, 2.4, 2.4, pet); }
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; p.set(Math.round(8 + Math.cos(a) * 4), Math.round(6 + Math.sin(a) * 4), petL); }
    p.ellipse(8, 6, 2, 2, full ? '#7fd0ff' : '#b8c8d0');
    if (full) p.set(7, 5, '#e8f8ff');
    p.outline(C.ink);
    return p;
  }

  function plate(down) {
    const p = pc(16, 6);
    const y = down ? 3 : 1;
    p.rect(1, y, 14, 6 - y, '#c9b8a3');
    p.hline(1, 14, y, '#ead9c3');
    p.rect(6, y + 1, 4, 1, '#ffb32c');
    p.outline(C.ink);
    return p;
  }

  function holdFlower(open) {
    // lale: kapalıyken tomurcuk, açıkken çanak
    const p = pc(16, 16);
    p.vline(8, 8, 15, G.stem); p.map(['ll.', 'lLl'], { l: G.leaf, L: G.leafL }, 9, 11); p.map(['.ll', 'lLl'], { l: G.leaf, L: G.leafL }, 4, 12);
    if (!open) {
      p.ellipse(8, 5.5, 3, 4, '#e2457a'); p.ellipse(7.5, 5, 2, 3, '#ff6f9f'); p.set(7, 3, '#ffb3cc');
    } else {
      p.poly([[2, 1], [5, 5], [8, 3], [11, 5], [14, 1], [13, 7], [8, 9.5], [3, 7]], '#ff6f9f');
      p.poly([[5, 5], [8, 3], [11, 5], [8, 7]], '#ffd23c');
      p.set(3, 2, '#ffb3cc'); p.set(13, 2, '#ffb3cc');
    }
    p.outline(C.ink);
    return p;
  }

  function hiveDoor(open) {
    const p = pc(32, 32);
    // petek kemeri
    p.ellipse(16, 18, 15, 15, '#e09a2e');
    p.rect(1, 18, 30, 14, '#e09a2e');
    p.ellipse(16, 18, 12, 12, open ? '#ffe9a8' : '#7a4a24');
    p.rect(4, 18, 24, 14, open ? '#ffe9a8' : '#7a4a24');
    if (!open) {
      for (let x = 6; x < 27; x += 5) p.vline(x, 8, 31, '#5e3618');
      p.ellipse(22, 22, 1.5, 1.5, '#ffd23c');
    } else {
      p.dither(4, 10, 24, 22, '#fff6dc', 0.4);
    }
    // çiçek çelengi
    const cols = ['#ff8fb8', '#ffffff', '#ffd23c', '#c6a0ff'];
    for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI; const x = 16 + Math.cos(a) * 14, y = 18 + Math.sin(a) * 14; p.ellipse(x, y, 1.6, 1.6, cols[k % 4]); }
    p.rect(0, 30, 32, 2, '#c47a1e');
    p.outline(C.ink);
    return p;
  }

  function choiceFlower(col, colL, stage) {
    // açık soru çiçeği: 16x32 uzun saplı; stage 0 tomurcuk, 1 açık, 2 seçildi
    const p = pc(16, 32);
    p.vline(8, 14, 31, G.stem); p.vline(7, 16, 31, G.stemD);
    p.map(['.ll.', 'lLll', '.ll.'], { l: G.leaf, L: G.leafL }, 9, 22);
    p.map(['.ll.', 'llLl', '.ll.'], { l: G.leaf, L: G.leafL }, 3, 25);
    if (stage === 0) {
      p.ellipse(8, 10, 3.5, 5, col); p.ellipse(7.5, 9.5, 2.2, 3.6, colL);
    } else {
      const r = 6.2;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; p.ellipse(8 + Math.cos(a) * r * 0.7, 9 + Math.sin(a) * r * 0.7, 2.6, 2.6, col); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; p.set(Math.round(8 + Math.cos(a) * r * 0.8), Math.round(9 + Math.sin(a) * r * 0.8), colL); }
      p.ellipse(8, 9, 2.6, 2.6, stage === 2 ? '#ffffff' : '#ffd23c');
      if (stage === 2) p.ellipse(8, 9, 1.4, 1.4, '#ffd23c');
    }
    p.outline(C.ink);
    return p;
  }

  function sign() {
    const p = pc(16, 16);
    p.rect(7, 9, 2, 7, G.brown);
    p.rect(1, 2, 14, 8, '#d39b5d'); p.hline(2, 13, 3, '#e8b878'); p.hline(2, 13, 8, '#a8733f');
    p.hline(4, 11, 5, G.brownD); p.hline(4, 9, 7, G.brownD);
    p.outline(C.ink);
    return p;
  }

  function pedestal(lit) {
    // soru noktası: küçük petek kaide + bal damlası
    const p = pc(16, 22);
    p.rect(3, 14, 10, 8, '#e09a2e'); p.hline(3, 12, 14, '#ffd96a'); p.hline(3, 12, 21, '#c47a1e');
    p.rect(5, 16, 2, 2, '#c47a1e'); p.rect(9, 18, 2, 2, '#c47a1e');
    if (lit) {
      p.ellipse(8, 7, 3.2, 3.6, G.honey); p.poly([[6, 5], [8, 1], [10, 5]], G.honey); p.set(7, 6, G.honeyL); p.set(7, 7, G.honeyL);
    }
    p.outline(C.ink);
    return p;
  }

  function itemPollenBall() {
    const p = pc(10, 10);
    p.ellipse(5, 5, 4.5, 4.5, '#f0b020'); p.ellipse(4.5, 4.5, 3.6, 3.6, '#ffd84a');
    for (const [x, y] of [[2, 3], [6, 2], [4, 6], [7, 6], [3, 5]]) p.set(x, y, '#e09a10');
    p.set(3, 2, '#fff6c0');
    p.outline('#a8650f');
    return p;
  }
  function itemLantern(f) {
    const p = pc(10, 12);
    p.rect(3, 0, 4, 2, '#8a6a3a'); p.hline(2, 7, 2, '#5e4628');
    p.ellipse(5, 7, 4, 4.2, '#d8f0ff'); p.ellipse(5, 7, 3, 3.2, '#eef9ff');
    p.ellipse(5, 7.5, 1.6 + (f ? 0.4 : 0), 1.6 + (f ? 0.4 : 0), '#ffe066'); p.set(5, 7, '#fffbe0');
    p.outline(C.ink);
    return p;
  }
  function itemShield() {
    const p = pc(18, 10);
    p.ellipse(9, 5, 8.5, 4.3, '#3f9a52'); p.ellipse(9, 4.5, 7.5, 3.3, '#5cc27a');
    p.hline(2, 16, 5, '#2f7d41');
    for (let x = 4; x < 16; x += 3) { p.set(x, 4, '#2f7d41'); p.set(x + 1, 3, '#2f7d41'); p.set(x, 6, '#2f7d41'); p.set(x + 1, 7, '#2f7d41'); }
    p.set(5, 2, '#9cea7f'); p.set(6, 2, '#9cea7f');
    p.outline(C.ink);
    return p;
  }

  function lily(w, f) {
    const p = pc(w, 7);
    p.ellipse(w / 2, 3.5, w / 2 - 0.5, 3, '#3f9a52');
    p.ellipse(w / 2, 3, w / 2 - 1.5, 2.2, '#5cc27a');
    p.poly([[w / 2, 3.5], [w / 2 + 3, 0], [w / 2 + 6, 0]], null);
    for (let x = 4; x < w - 4; x += 4) p.set(x, 3 + ((x / 4) & 1), '#2f7d41');
    if (f) { p.ellipse(w * 0.3, 2, 1.8, 1.4, '#ff9ad5'); p.set(Math.round(w * 0.3), 1, '#ffffff'); }
    p.outline(C.ink);
    return p;
  }

  function mushroom(squash) {
    const p = pc(16, 16);
    const top = squash ? 9 : 7;
    p.rect(6, top + 3, 4, 16 - top - 3, '#f2e6d0'); p.vline(9, top + 3, 15, '#d8c8b0');
    p.ellipse(8, top + 2, 7.5, squash ? 3 : 4, '#e2457a');
    p.ellipse(8, top + 1.5, 6.5, squash ? 2.2 : 3, '#ff6f9f');
    p.ellipse(5, top + 1, 1.2, 1, '#ffffff'); p.ellipse(10, top, 1.4, 1, '#ffffff'); p.set(12, top + 2, '#ffffff');
    p.outline(C.ink);
    return p;
  }

  function shelf(on, warn) {
    const p = pc(16, 7);
    const col = on ? (warn ? '#ffd27f' : '#7fe0ff') : '#3e3262', colL = on ? '#ffffff' : '#5c4c88';
    p.ellipse(8, 3, 7.5, 3, col); p.hline(3, 9, 2, colL);
    p.outline(on ? '#150f2a' : '#2a2148');
    return p;
  }
  function bridgeSeg(lit) {
    const p = pc(16, 7);
    if (lit) { p.rect(0, 1, 16, 4, '#b0ff7f'); p.hline(0, 15, 1, '#e8ffd0'); p.hline(0, 15, 4, '#6fc04a'); }
    else { for (let x = 0; x < 16; x += 2) p.set(x, 3, '#4a6a5a'); }
    if (lit) p.outline('#1c3a14');
    return p;
  }

  function pot(bloomed) {
    const p = pc(16, 16);
    p.poly([[2, 6], [14, 6], [12, 15], [4, 15]], '#c8683a'); p.rect(1, 5, 14, 3, '#e0804a'); p.hline(2, 13, 6, '#f2a070');
    p.rect(3, 4, 10, 1, '#6e4830');
    if (bloomed) { p.vline(8, 0, 4, G.stem); p.ellipse(8, 1, 2, 1.5, '#ffd23c'); }
    p.outline(C.ink);
    return p;
  }

  function crumbleBlock(stage) {
    const p = pc(16, 16);
    p.rect(0, 0, 16, 16, '#b8e8ff'); p.hline(0, 15, 0, '#eafaff'); p.hline(0, 15, 1, '#eafaff');
    p.rect(0, 13, 16, 3, '#8fd0f0');
    if (stage >= 1) { p.line(3, 2, 6, 7, '#5a9cc0'); p.line(6, 7, 4, 12, '#5a9cc0'); p.line(10, 3, 12, 9, '#5a9cc0'); }
    if (stage >= 2) { p.line(6, 7, 11, 8, '#5a9cc0'); p.line(12, 9, 14, 14, '#5a9cc0'); }
    p.outline('#1c2540');
    return p;
  }

  function icicle() {
    const p = pc(8, 14);
    p.poly([[0, 0], [8, 0], [4.5, 14]], '#b8e8ff'); p.vline(3, 1, 8, '#eafaff');
    p.outline('#4a6a9a');
    return p;
  }

  function dripSpr() {
    const p = pc(5, 7);
    p.ellipse(2.5, 4.5, 2.2, 2.4, '#7fc8f0'); p.set(2, 1, '#7fc8f0'); p.set(2, 2, '#7fc8f0'); p.set(1, 4, '#e0f6ff');
    p.outline('#2a5a80');
    return p;
  }

  function spider(f) {
    const p = pc(12, 10);
    p.ellipse(6, 5, 3.5, 3, '#3a2a4a'); p.ellipse(6, 3, 2.3, 2, '#4a3a5e');
    const legs = f ? [[0, 3], [0, 7], [11, 3], [11, 7]] : [[0, 4], [1, 8], [11, 4], [10, 8]];
    for (const [x, y] of legs) p.line(6, 5, x, y, '#3a2a4a');
    p.set(5, 3, '#ffffff'); p.set(7, 3, '#ffffff');
    p.outline(C.ink);
    return p;
  }

  const RUNES = {
    yagmur: ['..#..', '.###.', '#####', '#####', '.###.'],
    ruzgar: ['####.', '....#', '###..', '...##', '##...'],
    yaprak: ['...##', '..###', '.###.', '###..', '#....'],
    gunes: ['#.#.#', '.###.', '#####', '.###.', '#.#.#'],
    ay: ['.###.', '##...', '#....', '##...', '.###.'],
  };
  function rune(sym, lit) {
    const p = pc(16, 16);
    p.rect(2, 3, 12, 13, lit ? '#e8d8a0' : '#a89480'); p.hline(2, 13, 3, lit ? '#fff6d0' : '#c8b8a0');
    p.rect(2, 14, 12, 2, lit ? '#c8a860' : '#8a7663');
    const rows = RUNES[sym];
    rows.forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] === '#') p.set(5 + x, 6 + y, lit ? '#ff9f2a' : '#5c4a3a'); });
    p.outline(C.ink);
    return p;
  }

  function brazier(f) {
    const p = pc(16, 16);
    p.poly([[2, 9], [14, 9], [12, 15], [4, 15]], '#8a6a3a'); p.hline(2, 13, 9, '#c8a060'); p.hline(4, 11, 12, '#5e4628');
    const fl = [['..#..', '.##..', '.###.', '#####', '.###.'], ['...#.', '..##.', '.###.', '####.', '.###.'], ['.#...', '.##..', '.###.', '.####', '.###.']][f % 3];
    fl.forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] === '#') p.set(5 + x, 3 + y, y < 2 ? '#ffe066' : '#ffa52c'); });
    p.set(7, 6, '#fff6c0');
    p.outline(C.ink);
    return p;
  }

  function glowShroom(col) {
    const p = pc(16, 16);
    p.rect(7, 8, 2, 8, '#d8d0f0');
    p.ellipse(8, 7, 5, 3.4, col); p.set(6, 6, '#ffffff'); p.set(10, 7, '#ffffff');
    p.outline('#150f2a');
    return p;
  }

  const EMOTES = {
    call: ['..##..', '..##..', '..##..', '..##..', '......', '..##..'],
    q: ['.####.', '##..##', '...##.', '..##..', '......', '..##..'],
    heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
    dots: ['......', '......', '......', '#.#.#.', '......', '......'],
    note: ['..###', '..#.#', '..#..', '###..', '###..', '.....'],
    sweat: ['..#..', '.###.', '#####', '#####', '.###.', '.....'],
    angry: ['#.#.#', '.###.', '##.##', '.###.', '#.#.#', '.....'],
    star: ['...#...', '..###..', '#######', '.#####.', '.##.##.', '.#...#.'],
    zz: ['####.', '..#..', '.#...', '####.', '.....', '.....'],
    left: ['..#...', '.##...', '######', '.##...', '..#...', '......'],
    right: ['...#..', '...##.', '######', '...##.', '...#..', '......'],
    up: ['..#..', '.###.', '#####', '..#..', '..#..', '.....'],
  };
  function emote(key) {
    const rows = EMOTES[key];
    const w = rows[0].length + 4, h = 11;
    const p = pc(w, h);
    p.rect(1, 0, w - 2, 9, '#ffffff'); p.rect(0, 1, w, 7, '#ffffff');
    p.set(Math.floor(w / 2), 9, '#ffffff'); p.set(Math.floor(w / 2) - 1, 9, '#ffffff');
    const col = key === 'heart' ? '#ff4f8a' : key === 'angry' ? '#e84a3c' : key === 'sweat' ? '#5ab0e8' : key === 'note' ? '#8a5ad0' : key === 'star' ? '#ffb32c' : '#2b1a10';
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') p.set(2 + x, 2 + y - (rows.length > 5 ? 1 : 0), col); });
    p.outline(C.ink);
    return p;
  }

  function jar(fill) {
    // bal kavanozu 14x16, fill 0..1 (HUD ve kart için çerçeve)
    const p = pc(14, 16);
    p.rect(3, 0, 8, 3, '#c8683a'); p.hline(3, 10, 0, '#e0804a');
    p.rect(1, 3, 12, 13, '#e8f6ff');
    const h = Math.round(fill * 12);
    if (h > 0) { p.rect(2, 15 - h, 10, h, '#ffb32c'); p.hline(2, 11, 15 - h, '#ffd96a'); }
    p.vline(3, 5, 12, '#ffffff');
    p.outline(C.ink);
    return p;
  }

  // büyük süsler (zemine oturur)
  function bigDecor(kind) {
    let p;
    switch (kind) {
      case 'hive': { // hasır kovan (skep)
        p = pc(64, 72);
        for (let k = 0; k < 7; k++) { const y = 66 - k * 9, rw = 30 - k * k * 0.55; p.ellipse(32, y, Math.max(6, rw), 5.5, k % 2 ? '#e8a020' : '#f2b84b'); p.hline(Math.round(32 - Math.max(6, rw)) + 2, Math.round(32 + Math.max(6, rw)) - 2, y + 3, '#c47a1e'); }
        p.ellipse(32, 8, 7, 5, '#f2b84b');
        p.ellipse(32, 60, 9, 8, '#5e3618'); p.rect(23, 60, 18, 12, '#5e3618'); p.ellipse(32, 61, 6.5, 6, '#3b2516');
        p.rect(0, 70, 64, 2, '#c47a1e');
        for (const [x, y, c] of [[14, 50, '#ff8fb8'], [50, 46, '#ffffff'], [20, 34, '#ffd23c'], [45, 28, '#c6a0ff']]) { p.ellipse(x, y, 2, 2, c); p.set(x, y, '#ffd23c'); }
        p.outline(C.ink);
        break;
      }
      case 'jar': { // sönük kraliçe balı kavanozu
        p = pc(20, 24);
        p.rect(5, 0, 10, 4, '#c8683a'); p.rect(2, 4, 16, 20, '#e8f6ff');
        p.rect(3, 13, 14, 10, '#c8a060'); p.hline(3, 16, 13, '#e0c080');
        p.vline(5, 6, 20, '#ffffff');
        p.outline(C.ink);
        break;
      }
      case 'bush': {
        p = pc(32, 18);
        p.ellipse(9, 11, 8, 7, '#4f9a3f'); p.ellipse(22, 10, 10, 8, '#5aa86a'); p.ellipse(16, 8, 8, 7, '#6cc04f');
        for (const [x, y] of [[8, 7], [18, 5], [25, 8]]) p.set(x, y, '#a6e48a');
        for (const [x, y, c] of [[12, 10, '#ff8fb8'], [24, 12, '#ffffff'], [6, 13, '#ffd23c']]) p.set(x, y, c);
        p.outline(C.ink);
        break;
      }
      case 'rock': {
        p = pc(20, 12);
        p.ellipse(10, 8, 9, 5, '#a99683'); p.ellipse(9, 7, 7, 4, '#c9b8a3'); p.set(6, 5, '#e8dccb');
        p.outline(C.ink);
        break;
      }
      case 'flowers': {
        p = pc(24, 14);
        const cols = ['#ff8fb8', '#ffd23c', '#ffffff', '#c6a0ff', '#ff9f6b'];
        for (let k = 0; k < 6; k++) { const x = 2 + k * 4, h = 5 + ((k * 7) % 6); p.vline(x, 14 - h, 13, '#4f9a3f'); p.ellipse(x, 14 - h, 1.6, 1.6, cols[k % 5]); p.set(x, 14 - h, '#ffe066'); }
        break;
      }
      case 'reeds': {
        p = pc(20, 30);
        for (let k = 0; k < 5; k++) { const x = 2 + k * 4, h = 18 + (k * 5) % 10; p.vline(x, 30 - h, 29, '#3f7a2a'); p.rect(x - 1, 30 - h, 3, 6, '#8a5a32'); }
        break;
      }
      case 'stump': {
        p = pc(24, 18);
        p.rect(3, 4, 18, 14, '#8a5a34'); p.ellipse(12, 4, 9, 3, '#d8b88a'); p.ring(12, 4, 6, 2, '#a88058', 1);
        p.vline(7, 8, 16, '#6e4628'); p.vline(16, 6, 16, '#6e4628');
        p.outline(C.ink);
        break;
      }
      case 'crystal': {
        p = pc(16, 20);
        p.poly([[3, 20], [5, 6], [8, 0], [10, 6], [12, 20]], '#7fb2e0'); p.poly([[8, 0], [10, 6], [9, 20], [8, 20]], '#c8e4ff');
        p.outline('#150f2a');
        break;
      }
      case 'snowman': {
        p = pc(18, 24);
        p.ellipse(9, 18, 7, 6, '#f4f8ff'); p.ellipse(9, 8, 5, 5, '#ffffff'); p.set(7, 7, '#2b1a10'); p.set(11, 7, '#2b1a10'); p.rect(9, 9, 3, 1, '#ff8f3a');
        p.rect(4, 12, 10, 2, '#e84a3c');
        p.outline('#4a5a78');
        break;
      }
      case 'comb': { // bal peteği parçası
        p = pc(24, 22);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = 4 + c * 8 + (r % 2) * 4, y = 4 + r * 7; p.ellipse(x, y, 3.6, 3.4, '#ffb32c'); p.ellipse(x, y, 2, 2, '#ffd96a'); }
        p.outline('#8a4a12');
        break;
      }
      case 'lantern_post': {
        p = pc(12, 32);
        p.rect(5, 8, 2, 24, '#5e4628'); p.rect(2, 2, 8, 8, '#ffe066'); p.rect(3, 3, 6, 6, '#fff6c0'); p.rect(1, 0, 10, 2, '#5e4628');
        p.outline(C.ink);
        break;
      }
      default: return null;
    }
    return p;
  }

  function decorSpr(kind) {
    const big = bigDecor(kind);
    if (big) return big;
    const p = pc(16, 8);
    switch (kind) {
      case 'paw': // buzlu pati izi
        for (const [x, y] of [[3, 5], [10, 6]]) { p.ellipse(x, y, 1.6, 1.3, '#dff4ff'); p.set(x - 2, y - 2, '#dff4ff'); p.set(x, y - 3, '#dff4ff'); p.set(x + 2, y - 2, '#dff4ff'); }
        break;
      case 'fur': // beyaz tüy yumağı
        p.ellipse(8, 5, 4, 2.4, '#ffffff'); p.set(4, 3, '#ffffff'); p.set(12, 3, '#ffffff'); p.set(9, 2, '#e8eef8'); p.outline('#8a9ab8');
        break;
      case 'feather':
        p.line(2, 7, 13, 1, '#d8d0c0'); for (let i = 3; i < 13; i += 2) { p.set(i, 7 - Math.floor(i / 2) - 1, '#ffffff'); p.set(i + 1, 7 - Math.floor(i / 2) + 1, '#ffffff'); } p.outline('#8a8070');
        break;
      case 'brokenweb':
        p.line(1, 1, 6, 6, '#e8e8f0'); p.line(14, 1, 10, 5, '#e8e8f0'); p.line(4, 7, 12, 7, '#e8e8f0');
        break;
      case 'drop': // yere düşmüş bal damlası izi
        p.ellipse(8, 6, 4, 1.6, '#ffb32c'); p.set(6, 5, '#ffd96a');
        break;
      default: p.rect(6, 4, 4, 4, '#ff00ff');
    }
    return p;
  }

  function buildObjects(book) {
    book.add('honeyflower', [0, 1, 2, 3].map(honeyFlower), 0, 0);
    book.add('pollen', [pollenOrb(0), pollenOrb(1)]);
    book.add('rare', [rareFlower(0), rareFlower(1)]);
    book.add('nectar', [nectarFlower(true), nectarFlower(false)]);
    book.add('plate', [plate(false), plate(true)]);
    book.add('holdflower', [holdFlower(false), holdFlower(true)]);
    book.add('hivedoor', [hiveDoor(false), hiveDoor(true)]);
    const ch = [['#ff8fb8', '#ffd0e4'], ['#ffd23c', '#fff3a6'], ['#6fb6f2', '#cde9ff'], ['#f4f4f4', '#ffffff']];
    ch.forEach((c, i) => book.add('choice' + i, [0, 1, 2].map((s) => choiceFlower(c[0], c[1], s))));
    book.add('sign', [sign()]);
    book.add('pedestal', [pedestal(true), pedestal(false)]);
    book.add('item_pollen', [itemPollenBall()]);
    book.add('item_lantern', [itemLantern(0), itemLantern(1)]);
    book.add('item_shield', [itemShield()]);
    book.add('lily32', [lily(32, 0), lily(32, 1)]);
    book.add('lily48', [lily(48, 1)]);
    book.add('mushroom', [mushroom(false), mushroom(true)]);
    book.add('shelf', [shelf(true, false), shelf(true, true), shelf(false, false)]);
    book.add('bridge', [bridgeSeg(true), bridgeSeg(false)]);
    book.add('pot', [pot(false), pot(true)]);
    book.add('crumble', [0, 1, 2].map(crumbleBlock));
    book.add('icicle', [icicle()]);
    book.add('drip', [dripSpr()]);
    book.add('spider', [spider(0), spider(1)]);
    for (const s of Object.keys(RUNES)) book.add('rune_' + s, [rune(s, false), rune(s, true)]);
    book.add('brazier', [0, 1, 2].map(brazier));
    book.add('glowshroom', ['#7fe0ff', '#ff7fd0', '#b0ff7f', '#ffd27f'].map(glowShroom));
    for (const k of Object.keys(EMOTES)) book.add('emote_' + k, [emote(k)]);
    book.add('jar', [0, 0.25, 0.5, 0.75, 1].map(jar));
    for (const k of ['paw', 'fur', 'feather', 'brokenweb', 'drop', 'hive', 'jar', 'bush', 'rock', 'flowers', 'reeds', 'stump', 'crystal', 'snowman', 'comb', 'lantern_post']) book.add('decor_' + k, [decorSpr(k)]);
    // uçan bal damlası (soru sonrası)
    const hd = pc(9, 11);
    hd.ellipse(4.5, 7, 3.6, 3.6, G.honey); hd.poly([[2, 5], [4.5, 0], [7, 5]], G.honey); hd.set(3, 6, G.honeyL); hd.set(3, 7, G.honeyL);
    hd.outline(C.ink);
    book.add('honeydrop', [hd]);
  }

  const Sprites = {
    build() {
      const book = new SpriteBook();
      buildBees(book);
      buildObjects(book);
      if (BB.buildCharacters) BB.buildCharacters(book);
      return book;
    },
    preview(book, filter) {
      const all = [];
      for (const s of book.list) if (!filter || filter(s.name)) for (const f of s.frames) all.push(f);
      // satır satır yerleştir (farklı boyutlar)
      const W = 400; let x = 2, y = 2, rowH = 0; const pos = [];
      for (const f of all) { if (x + f.w + 2 > W) { x = 2; y += rowH + 3; rowH = 0; } pos.push([x, y]); x += f.w + 3; rowH = Math.max(rowH, f.h); }
      const p = pc(W, y + rowH + 3);
      p.rect(0, 0, p.w, p.h, '#8fd0a0');
      all.forEach((f, i) => p.blit(f, pos[i][0], pos[i][1]));
      return p;
    },
  };
  BB.Sprites = Sprites;
})(typeof window !== 'undefined' ? window : globalThis);
