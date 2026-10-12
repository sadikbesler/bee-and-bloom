/* Bee & Bloom — dünya paletleri, karo çizimi ve parallax arka planlar (DOM gerektirmez). */
(function (root) {
  'use strict';
  const BB = root.BB;
  const { PixelCanvas, bayer4 } = BB.Art;
  const T = BB.T, TILE = BB.TILE;
  const H = BB.hash2;

  // Her dünyanın sınırlı paleti ve ruh hali
  const THEMES = {
    bahar: {
      name: 'İlkbahar', world: 1,
      sky: ['#bfe8f7', '#d8f2fa', '#eef9fb'], cloud: '#ffffff', cloudS: '#e3f1f7',
      far: '#a9d9b4', farS: '#97cba3', mid: '#86c98e', midS: '#6fb67c', near: '#5aa86a', nearS: '#468f57',
      dirt: '#a8754f', dirtS: '#8c5f3f', dirtD: '#6e4830', dirtL: '#c08a5f',
      top: '#7ccf6a', topS: '#5fb35a', topL: '#a6e48a', edge: '#3f2a1c',
      stone: '#c9b8a3', stoneS: '#a99683', plank: '#d39b5d', plankS: '#a8733f',
      back: '#8a6447', backS: '#7a573c',
      water: '#6fc3e8', waterS: '#4fa6d4', waterL: '#c7ecfb',
      thorn: '#6a4a8a', thornL: '#9b7cc0',
      flowers: ['#ff8fb8', '#ffe066', '#ffffff', '#c6a0ff', '#ff9f6b'],
      weather: 'petals', light: null,
    },
    yaz: {
      name: 'Yaz', world: 2,
      sky: ['#7fd4ff', '#a3e2ff', '#cdf0ff'], cloud: '#ffffff', cloudS: '#e0f3ff',
      far: '#78c2d9', farS: '#5eabc6', mid: '#5cc27a', midS: '#43a564', near: '#3f9a52', nearS: '#2f7d41',
      dirt: '#c9a06a', dirtS: '#ac8350', dirtD: '#86633a', dirtL: '#e0bd86',
      top: '#5fd06a', topS: '#40b050', topL: '#9cea7f', edge: '#3a2a18',
      stone: '#d8cdb0', stoneS: '#b6a98a', plank: '#e0a86a', plankS: '#b07a42',
      back: '#9b7a50', backS: '#86683f',
      water: '#3fb0e8', waterS: '#2a8cc9', waterL: '#bdeeff',
      thorn: '#7a5236', thornL: '#a8784d',
      flowers: ['#ff6b6b', '#ffd23c', '#ffffff', '#ff9ad5', '#6bd0ff'],
      weather: 'sparkle', light: null,
    },
    sonbahar: {
      name: 'Sonbahar', world: 3,
      sky: ['#e9b98a', '#f0c9a0', '#f6dcbc'], cloud: '#f9e4cb', cloudS: '#e8c7a4',
      far: '#c98c63', farS: '#b67752', mid: '#a85a3c', midS: '#8f4630', near: '#7a3a2a', nearS: '#62291f',
      dirt: '#7d4f33', dirtS: '#663e27', dirtD: '#4d2d1c', dirtL: '#96613f',
      top: '#d9822b', topS: '#b8641f', topL: '#f2a64a', edge: '#2e1a10',
      stone: '#a89480', stoneS: '#8a7663', plank: '#b9783f', plankS: '#8e552a',
      back: '#5c3a26', backS: '#4d301f',
      water: '#7aa7b8', waterS: '#5d8a9c', waterL: '#c4dde6',
      thorn: '#5a2f3c', thornL: '#8a4f5f',
      flowers: ['#e84a3c', '#ffb43c', '#8a3fa0', '#f2d06b', '#c75b2a'],
      weather: 'rain', light: null,
    },
    magara: {
      name: 'Mağara', world: 4,
      sky: ['#1b1838', '#211d44', '#282350'], cloud: '#2e2858', cloudS: '#262150',
      far: '#2a2552', farS: '#241f48', mid: '#33295e', midS: '#2b2252', near: '#3b2c66', nearS: '#30245a',
      dirt: '#4b3d72', dirtS: '#3e3262', dirtD: '#2f254d', dirtL: '#5c4c88',
      top: '#6b5aa6', topS: '#584a8f', topL: '#8a78c8', edge: '#150f2a',
      stone: '#5a5280', stoneS: '#4a426c', plank: '#7a5a9e', plankS: '#5e4580',
      back: '#2a2148', backS: '#231b3e',
      water: '#3a6ea8', waterS: '#2b5688', waterL: '#7fb2e0',
      thorn: '#c04a8a', thornL: '#ff7fbf',
      flowers: ['#7fe0ff', '#ff7fd0', '#b0ff7f', '#ffd27f', '#c0a0ff'],
      weather: 'fireflies', light: '#ffe9a8', dark: '#0d0b1e',
    },
    kis: {
      name: 'Kış', world: 5,
      sky: ['#24345e', '#2c3f6e', '#36497a'], cloud: '#5a6c98', cloudS: '#4a5b86',
      far: '#47598a', farS: '#3d4e7c', mid: '#5f74a6', midS: '#4f6394', near: '#7a90c0', nearS: '#6478aa',
      dirt: '#6d7ea6', dirtS: '#5a6b92', dirtD: '#475678', dirtL: '#8496bc',
      top: '#f4f8ff', topS: '#d2def2', topL: '#ffffff', edge: '#1c2540',
      stone: '#8fa0c4', stoneS: '#7486ac', plank: '#9a7a5c', plankS: '#785c42',
      back: '#3c4a72', backS: '#333f63',
      water: '#9fd8f0', waterS: '#7cc0e0', waterL: '#e4f7ff',
      thorn: '#bfe8ff', thornL: '#ffffff',
      ice: '#b8e8ff', iceS: '#8fd0f0', iceL: '#eafaff',
      flowers: ['#ffffff', '#bfe8ff', '#ffd0e0', '#e0e8ff', '#ffe9a8'],
      weather: 'snow', light: null,
    },
    kovan: {
      name: 'Kovan', world: 6,
      sky: ['#ffd77a', '#ffe3a0', '#fff0c8'], cloud: '#fff6dc', cloudS: '#ffe7b0',
      far: '#f2b84b', farS: '#e3a33a', mid: '#e09a2e', midS: '#c98222', near: '#c47a1e', nearS: '#a86416',
      dirt: '#d99a2b', dirtS: '#bd7f1d', dirtD: '#9a6514', dirtL: '#f0b545',
      top: '#ffe08a', topS: '#f5c65a', topL: '#fff3c4', edge: '#5a3508',
      stone: '#f0c870', stoneS: '#d9ac52', plank: '#e8b05a', plankS: '#c08636',
      back: '#c98a24', backS: '#b2781c',
      water: '#ffb732', waterS: '#e8961c', waterL: '#ffe39a',
      thorn: '#8a4a12', thornL: '#c4782a',
      flowers: ['#ff8fb8', '#ffffff', '#ff7a5c', '#8fd8ff', '#c6a0ff'],
      weather: 'pollen', light: null,
    },
  };
  BB.THEMES = THEMES;

  const isSolidT = (t) => t === T.SOLID || t === T.SOLID2 || t === T.ICE;

  // ------------------------------------------------------------ karo katmanı (statik)
  // Döner: { back: PixelCanvas (arka duvar), front: PixelCanvas (zemin/dikenler) }
  function renderTiles(world, themeKey) {
    const th = THEMES[themeKey];
    const W = world.cols * TILE, Hh = world.rows * TILE;
    const back = new PixelCanvas(W, Hh), front = new PixelCanvas(W, Hh);
    const at = (c, r) => world.tileAt(c, r);
    const solidN = (c, r) => (c < 0 || c >= world.cols) ? true : r < 0 ? false : r >= world.rows ? true : isSolidT(at(c, r));
    for (let r = 0; r < world.rows; r++) for (let c = 0; c < world.cols; c++) {
      const t = at(c, r);
      const X = c * TILE, Y = r * TILE;
      // arka duvar; içindeki platform/boş karelerde delik kalmasın diye komşular arka duvarsa onları da doldur
      if (t === T.BACK || (!isSolidT(t) && backAround(at, c, r))) drawBack(back, th, X, Y, c, r, at);
      if (isSolidT(t)) drawSolid(front, th, X, Y, c, r, t, solidN, at);
      else if (t === T.ONEWAY) drawOneWay(front, th, X, Y, c, r, at);
      else if (t === T.THORN_UP || t === T.THORN_DOWN || t === T.THORN_L || t === T.THORN_R) drawThorn(front, th, X, Y, t, c, r);
      else if (t === T.PINK || t === T.BLUE) drawPetal(front, X, Y, t, c, r, at);
    }
    // zemin üstü süsler (çimen tutamı, çiçek, taş)
    for (let r = 1; r < world.rows; r++) for (let c = 0; c < world.cols; c++) {
      if (!isSolidT(at(c, r)) || at(c, r) === T.ICE) continue;
      if (at(c, r - 1) !== T.EMPTY && at(c, r - 1) !== T.BACK) continue;
      decorate(front, th, c * TILE, r * TILE, c, r, themeKey);
    }
    return { back, front };
  }

  // boş/platform kare iki yandan (ya da alttan-üstten) arka duvarla çevriliyse: aradaki boş/katı olmayan sırayı geçip bak
  function backAround(at, c, r) {
    const T_ = T;
    const look = (dc, dr) => {
      for (let k = 1; k <= 6; k++) {
        const t = at(c + dc * k, r + dr * k);
        if (t === T_.BACK) return true;
        if (isSolidT(t)) { if (dr === 0) return false; continue; }   // dikeyde dal tabakasının içinden geç
        if (t === T_.EMPTY && k > 2 && dr === 0) return false;
      }
      return false;
    };
    return (look(-1, 0) && look(1, 0)) || (look(0, -1) && look(0, 1));
  }

  function drawBack(p, th, X, Y, c, r) {
    p.rect(X, Y, TILE, TILE, th.back);
    for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
      const n = H(X + i, Y + j, 7);
      if (n < 0.06) p.set(X + i, Y + j, th.backS);
    }
    // tuğla/petek dokusu: hafif çizgiler
    if ((r & 1) === 0) p.hline(X, X + 15, Y + 15, th.backS);
    if (((c + r) & 1) === 0) p.vline(X + 15, Y, Y + 15, th.backS);
  }

  function drawSolid(p, th, X, Y, c, r, t, solidN, at) {
    const up = solidN(c, r - 1), dn = solidN(c, r + 1), lf = solidN(c - 1, r), rt = solidN(c + 1, r);
    if (t === T.ICE) {
      p.rect(X, Y, TILE, TILE, th.ice || '#b8e8ff');
      for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) if (((i + j + c * 3) % 9) === 0 && j < 8) p.set(X + i, Y + j, th.iceL || '#eafaff');
      p.hline(X, X + 15, Y + 15, th.iceS || '#8fd0f0');
      if (!up) { p.hline(X, X + 15, Y, th.edge); p.hline(X, X + 15, Y + 1, th.iceL || '#eafaff'); }
      if (!lf) p.vline(X, Y, Y + 15, th.edge);
      if (!rt) p.vline(X + 15, Y, Y + 15, th.edge);
      if (!dn) p.hline(X, X + 15, Y + 15, th.edge);
      return;
    }
    const alt = t === T.SOLID2;
    const base = alt ? th.stone : th.dirt, shade = alt ? th.stoneS : th.dirtS;
    p.rect(X, Y, TILE, TILE, base);
    // doku: benekler ve küçük taşlar
    for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
      const n = H(X + i, Y + j, alt ? 3 : 1);
      if (n < 0.07) p.set(X + i, Y + j, shade);
      else if (n > 0.975 && !alt) p.set(X + i, Y + j, th.dirtL);
    }
    if (alt) {
      // taş blok: derz çizgileri
      p.hline(X, X + 15, Y + 7, shade); p.hline(X, X + 15, Y + 15, shade);
      p.vline(X + ((r & 1) ? 4 : 11), Y, Y + 7, shade); p.vline(X + ((r & 1) ? 12 : 3), Y + 8, Y + 15, shade);
    } else if (H(c, r, 11) < 0.25) {
      // gömülü küçük taş
      const sx = X + 3 + Math.floor(H(c, r, 12) * 8), sy = Y + 5 + Math.floor(H(c, r, 13) * 6);
      p.rect(sx, sy, 3, 2, th.dirtD); p.set(sx, sy, th.dirtL);
    }
    // alt gölge
    if (!dn) { p.hline(X, X + 15, Y + 14, shade); p.hline(X, X + 15, Y + 15, th.edge); }
    if (!lf) { p.vline(X, Y, Y + 15, th.edge); p.vline(X + 1, Y + 1, Y + 14, shade); }
    if (!rt) { p.vline(X + 15, Y, Y + 15, th.edge); p.vline(X + 14, Y + 1, Y + 14, shade); }
    if (!up) {
      // üst yüzey (çimen/yaprak/kar/bal mumu)
      const lip = 4;
      p.rect(X, Y, TILE, lip, th.top);
      p.hline(X, X + 15, Y + lip, th.topS);
      for (let i = 0; i < TILE; i++) {
        const n = H(X + i, Y, 5);
        if (n < 0.35) p.set(X + i, Y + lip + 1, th.topS);   // sarkan çimen
        if (n > 0.8) p.set(X + i, Y + 1, th.topL);
      }
      p.hline(X, X + 15, Y, th.edge);
      // köşe yuvarlama
      if (!lf) { p.set(X, Y, null); p.set(X + 1, Y, th.edge); p.set(X, Y + 1, th.edge); p.vline(X, Y + 1, Y + lip, th.edge); }
      if (!rt) { p.set(X + 15, Y, null); p.set(X + 14, Y, th.edge); p.set(X + 15, Y + 1, th.edge); p.vline(X + 15, Y + 1, Y + lip, th.edge); }
    }
    if (!dn && !lf) { p.set(X, Y + 15, null); p.set(X + 1, Y + 15, th.edge); p.set(X, Y + 14, th.edge); }
    if (!dn && !rt) { p.set(X + 15, Y + 15, null); p.set(X + 14, Y + 15, th.edge); p.set(X + 15, Y + 14, th.edge); }
  }

  function drawOneWay(p, th, X, Y, c, r, at) {
    const lf = at(c - 1, r) === T.ONEWAY, rt = at(c + 1, r) === T.ONEWAY;
    p.rect(X, Y, TILE, 5, th.plank);
    p.hline(X, X + 15, Y + 4, th.plankS);
    p.hline(X, X + 15, Y, th.edge); p.hline(X, X + 15, Y + 5, th.edge);
    for (let i = 2; i < TILE; i += 5) p.set(X + ((i + c * 3) % 16), Y + 2, th.plankS);
    if (!lf) { p.vline(X, Y, Y + 5, th.edge); p.vline(X + 2, Y + 6, Y + 8, th.edge); p.set(X + 3, Y + 6, th.plankS); }
    if (!rt) { p.vline(X + 15, Y, Y + 5, th.edge); p.vline(X + 13, Y + 6, Y + 8, th.edge); p.set(X + 12, Y + 6, th.plankS); }
  }

  function drawThorn(p, th, X, Y, t) {
    // dikenli sarmaşık: 3 sivri uç
    const pts = [];
    for (let k = 0; k < 3; k++) pts.push(2 + k * 5);
    const tip = th.thornL, body = th.thorn;
    for (const o of pts) {
      for (let s = 0; s < 6; s++) {
        const w = Math.max(0, 2 - Math.floor(s / 2));
        for (let d = -w; d <= w; d++) {
          let x, y;
          if (t === T.THORN_UP) { x = X + o + d + 1; y = Y + 15 - s; }
          else if (t === T.THORN_DOWN) { x = X + o + d + 1; y = Y + s; }
          else if (t === T.THORN_L) { x = X + 15 - s; y = Y + o + d + 1; }
          else { x = X + s; y = Y + o + d + 1; }
          p.set(x, y, s >= 4 ? tip : body);
        }
      }
    }
    // gövde sapı
    if (t === T.THORN_UP) { p.hline(X, X + 15, Y + 15, body); p.hline(X, X + 15, Y + 14, body); }
    else if (t === T.THORN_DOWN) { p.hline(X, X + 15, Y, body); p.hline(X, X + 15, Y + 1, body); }
    else if (t === T.THORN_L) { p.vline(X + 15, Y, Y + 15, body); p.vline(X + 14, Y, Y + 15, body); }
    else { p.vline(X, Y, Y + 15, body); p.vline(X + 1, Y, Y + 15, body); }
  }

  function drawPetal(p, X, Y, t, c, r, at) {
    const pink = t === T.PINK;
    const fill = pink ? '#ff8fbd' : '#6fb6f2', shade = pink ? '#e2609a' : '#4a8fd0', light = pink ? '#ffd0e4' : '#cde9ff', edge = pink ? '#8a2a55' : '#1f4a80';
    const lf = at(c - 1, r) === t, rt = at(c + 1, r) === t;
    p.rect(X, Y + 1, TILE, 6, fill);
    p.hline(X, X + 15, Y, edge); p.hline(X, X + 15, Y + 7, edge);
    p.hline(X, X + 15, Y + 6, shade);
    p.hline(X + 2, X + 9, Y + 2, light);
    if (!lf) { p.vline(X, Y, Y + 7, edge); p.set(X, Y, null); p.set(X, Y + 7, null); }
    if (!rt) { p.vline(X + 15, Y, Y + 7, edge); p.set(X + 15, Y, null); p.set(X + 15, Y + 7, null); }
    // damarlar
    for (let i = 3; i < 16; i += 4) p.set(X + i, Y + 4, shade);
  }

  function decorate(p, th, X, Y, c, r, themeKey) {
    const n = H(c, r, 21);
    if (n < 0.28) {
      // çimen tutamı
      const x = X + 2 + Math.floor(H(c, r, 22) * 11);
      const g = themeKey === 'kis' ? th.topS : th.topL;
      p.set(x, Y - 1, g); p.set(x + 1, Y - 2, g); p.set(x + 2, Y - 1, g); p.set(x + 1, Y - 1, th.topS);
    } else if (n < 0.42 && themeKey !== 'magara') {
      // küçük çiçek
      const x = X + 3 + Math.floor(H(c, r, 23) * 9);
      const col = th.flowers[Math.floor(H(c, r, 24) * th.flowers.length)];
      p.set(x, Y - 1, th.topS); p.set(x, Y - 2, th.topS);
      p.set(x - 1, Y - 3, col); p.set(x + 1, Y - 3, col); p.set(x, Y - 4, col); p.set(x, Y - 3, '#ffe066');
    } else if (n < 0.5) {
      // çakıl
      const x = X + 4 + Math.floor(H(c, r, 25) * 8);
      p.set(x, Y - 1, th.stoneS); p.set(x + 1, Y - 1, th.stone);
    } else if (n < 0.56 && themeKey === 'magara') {
      // minik parlak mantar
      const x = X + 4 + Math.floor(H(c, r, 26) * 8);
      const col = th.flowers[Math.floor(H(c, r, 27) * th.flowers.length)];
      p.set(x, Y - 1, '#d8d0f0'); p.set(x - 1, Y - 2, col); p.set(x, Y - 2, col); p.set(x + 1, Y - 2, col);
    }
  }

  // ------------------------------------------------------------ parallax arka planlar
  // Döner: [{ pc, f (parallax katsayısı), y (dikey taban), wrap }]
  function makeBackground(themeKey) {
    const th = THEMES[themeKey];
    const W = 480, Hh = 270;
    const layers = [];
    // 0) gök: yatay bantlar + dithering geçişi (gradyan yok)
    const sky = new PixelCanvas(W, Hh);
    const bands = th.sky;
    const bandH = Math.ceil(Hh / bands.length);
    for (let i = 0; i < bands.length; i++) sky.rect(0, i * bandH, W, bandH, bands[i]);
    for (let i = 1; i < bands.length; i++) sky.dither(0, i * bandH - 8, W, 8, bands[i], 0.5);
    for (let i = 1; i < bands.length; i++) sky.dither(0, i * bandH, W, 6, bands[i - 1], 0.25);
    skyDetails(sky, th, themeKey);
    layers.push({ pc: sky, f: 0, wrap: false });
    // 1) uzak katman
    layers.push({ pc: farLayer(th, themeKey), f: 0.15, wrap: true });
    // 2) orta katman
    layers.push({ pc: midLayer(th, themeKey), f: 0.35, wrap: true });
    // 3) yakın katman
    layers.push({ pc: nearLayer(th, themeKey), f: 0.6, wrap: true });
    return layers;
  }

  function skyDetails(p, th, key) {
    const rnd = BB.rng(key.length * 977 + 13);
    if (key === 'magara') {
      // sarkıtlar (tavan)
      for (let x = 0; x < 480; x += 6 + Math.floor(rnd() * 14)) {
        const h = 8 + Math.floor(rnd() * 34), w = 3 + Math.floor(rnd() * 5);
        p.poly([[x, 0], [x + w, 0], [x + w / 2, h]], th.far);
      }
      for (let i = 0; i < 40; i++) { const x = Math.floor(rnd() * 480), y = 30 + Math.floor(rnd() * 200); p.set(x, y, rnd() < 0.5 ? '#3a3370' : '#4a4290'); }
      return;
    }
    if (key === 'kis') {
      for (let i = 0; i < 90; i++) { const x = Math.floor(rnd() * 480), y = Math.floor(rnd() * 150); p.set(x, y, rnd() < 0.2 ? '#ffffff' : '#9fb4e0'); if (rnd() < 0.1) { p.set(x + 1, y, '#9fb4e0'); p.set(x - 1, y, '#9fb4e0'); p.set(x, y + 1, '#9fb4e0'); p.set(x, y - 1, '#9fb4e0'); } }
      // ay
      p.ellipse(400, 46, 13, 13, '#f4f0dc'); p.ellipse(405, 42, 11, 11, th.sky[0]);
      return;
    }
    // güneş (düz) + bulutlar
    if (key === 'yaz' || key === 'bahar' || key === 'kovan') {
      const sx = key === 'yaz' ? 390 : 70, sy = key === 'yaz' ? 44 : 40;
      const sun = key === 'kovan' ? '#fff3c4' : '#fff6b0';
      p.ellipse(sx, sy, 16, 16, sun);
      p.ring(sx, sy, 21, 21, key === 'yaz' ? '#fff0a0' : '#fffbe0', 1);
      if (key === 'yaz') for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2; p.line(sx + Math.cos(ang) * 24, sy + Math.sin(ang) * 24, sx + Math.cos(ang) * 29, sy + Math.sin(ang) * 29, '#fff0a0'); }
    }
    const nC = key === 'sonbahar' ? 5 : 7;
    for (let i = 0; i < nC; i++) {
      const cx = 30 + Math.floor(rnd() * 420), cy = 20 + Math.floor(rnd() * 70), s = 0.7 + rnd() * 0.8;
      cloud(p, cx, cy, s, th);
    }
    if (key === 'sonbahar') { // sis bantları
      p.dither(0, 150, 480, 20, '#f6dcbc', 0.5);
      p.dither(0, 170, 480, 30, '#f6dcbc', 0.25);
    }
  }

  function cloud(p, cx, cy, s, th) {
    const parts = [[0, 0, 12, 7], [-11, 3, 9, 5], [11, 3, 10, 5], [-4, -5, 8, 6], [6, -3, 7, 5]];
    for (const [dx, dy, rx, ry] of parts) p.ellipse(cx + dx * s, cy + dy * s + 1, rx * s, ry * s, th.cloudS);
    for (const [dx, dy, rx, ry] of parts) p.ellipse(cx + dx * s, cy + dy * s - 1, rx * s, ry * s - 1, th.cloud);
  }

  // sinüs tepeleri
  function hills(p, base, amp, freq, phase, col, colS, seed) {
    for (let x = 0; x < p.w; x++) {
      const a = (x / p.w) * Math.PI * 2;
      const h = base + Math.sin(a * freq + phase) * amp + Math.sin(a * (freq * 2 + 1) + phase * 1.7) * amp * 0.35;
      const top = Math.round(p.h - h);
      p.vline(x, top, p.h - 1, col);
      if (colS) p.set(x, top, colS);
    }
    if (colS) p.ditherPred(0, 0, p.w, p.h, colS, (x, y) => { const a = (x / p.w) * Math.PI * 2; const h = base + Math.sin(a * freq + phase) * amp + Math.sin(a * (freq * 2 + 1) + phase * 1.7) * amp * 0.35; const top = p.h - h; return y > top + 6 && y < top + 14 ? 0.25 : 0; });
    void seed;
  }

  function farLayer(th, key) {
    const p = new PixelCanvas(480, 270);
    const rnd = BB.rng(key.length * 31 + 7);
    if (key === 'magara') {
      // uzak kayalık sütunlar
      for (let x = 0; x < 480; x += 40 + Math.floor(rnd() * 30)) {
        const w = 18 + Math.floor(rnd() * 22);
        p.rect(x, 0, w, 270, th.far);
        p.dither(x, 0, 3, 270, th.farS, 0.5);
        p.poly([[x - 6, 270], [x + w + 6, 270], [x + w, 200], [x, 200]], th.far);
      }
      return p;
    }
    if (key === 'kis') {
      // karlı dağlar
      for (let i = 0; i < 6; i++) {
        const x = i * 90 + Math.floor(rnd() * 30) - 20, w = 120 + Math.floor(rnd() * 60), h = 90 + Math.floor(rnd() * 50);
        p.poly([[x, 270], [x + w / 2, 270 - h], [x + w, 270]], th.far);
        p.poly([[x + w / 2 - w * 0.12, 270 - h + h * 0.24], [x + w / 2, 270 - h], [x + w / 2 + w * 0.12, 270 - h + h * 0.24], [x + w / 2 + 4, 270 - h + h * 0.3], [x + w / 2 - 3, 270 - h + h * 0.28]], '#dbe6fa');
      }
      return p;
    }
    if (key === 'kovan') {
      // dev petek duvarı
      hexWall(p, th.far, th.farS, 0, 60);
      return p;
    }
    hills(p, key === 'sonbahar' ? 110 : 95, 18, 2, 0.5, th.far, th.farS);
    if (key === 'yaz') {
      // uzak göl şeridi
      p.rect(0, 222, 480, 48, th.water); p.dither(0, 222, 480, 3, th.waterL, 0.5);
      for (let x = 0; x < 480; x += 7) p.set(x + Math.floor(rnd() * 5), 230 + Math.floor(rnd() * 30), th.waterL);
    }
    return p;
  }

  function hexWall(p, col, colS, x0, y0) {
    p.rect(0, y0, p.w, p.h - y0, col);
    for (let row = 0; row < 20; row++) for (let i = 0; i < 30; i++) {
      const cx = i * 20 + (row & 1) * 10, cy = y0 + row * 17;
      const pts = [];
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; pts.push([cx + Math.cos(a) * 10, cy + Math.sin(a) * 10]); }
      for (let k = 0; k < 6; k++) p.line(pts[k][0], pts[k][1], pts[(k + 1) % 6][0], pts[(k + 1) % 6][1], colS);
    }
  }

  function midLayer(th, key) {
    const p = new PixelCanvas(480, 270);
    const rnd = BB.rng(key.length * 53 + 11);
    if (key === 'magara') {
      // parlayan mantar kümeleri (düz renk + taranmış hale)
      hills(p, 60, 10, 3, 1.1, th.mid, th.midS);
      for (let i = 0; i < 9; i++) {
        const x = 20 + Math.floor(rnd() * 440), y = 270 - 50 - Math.floor(rnd() * 20);
        const col = th.flowers[i % th.flowers.length];
        p.ditherPred(x - 18, y - 22, 36, 36, col, (px, py) => { const d = Math.hypot(px - x, py - y + 6); return d < 16 ? 0.12 : 0; });
        p.vline(x, y - 4, y + 12, '#d8d0f0');
        p.ellipse(x, y - 6, 7, 4, col);
        p.set(x - 3, y - 7, '#ffffff');
      }
      return p;
    }
    if (key === 'kis') {
      hills(p, 70, 12, 2, 2.2, th.mid, th.midS);
      for (let x = 10; x < 480; x += 22 + Math.floor(rnd() * 20)) pine(p, x, 270 - 60 - Math.floor(rnd() * 10), 18 + Math.floor(rnd() * 10), th.midS, '#e8f0ff');
      return p;
    }
    if (key === 'kovan') {
      hexWall(p, th.mid, th.midS, 0, 170);
      for (let i = 0; i < 6; i++) { const x = 40 + i * 80 + Math.floor(rnd() * 20); p.rect(x, 150, 4, 20, th.midS); p.ellipse(x + 2, 150, 4, 6, '#ffd23c'); }
      return p;
    }
    hills(p, 70, 14, 3, 1.3, th.mid, th.midS);
    if (key === 'sonbahar') {
      for (let x = 0; x < 480; x += 30 + Math.floor(rnd() * 25)) tree(p, x, 270 - 62, 26 + Math.floor(rnd() * 14), th.midS, th.mid, '#5a2a1c');
    } else {
      for (let x = 0; x < 480; x += 36 + Math.floor(rnd() * 30)) tree(p, x, 270 - 66, 18 + Math.floor(rnd() * 10), th.midS, th.mid, '#7a5236');
    }
    return p;
  }

  function nearLayer(th, key) {
    const p = new PixelCanvas(480, 270);
    const rnd = BB.rng(key.length * 71 + 17);
    if (key === 'magara') {
      hills(p, 34, 8, 4, 0.4, th.near, th.nearS);
      return p;
    }
    hills(p, 38, 9, 4, 2.4, th.near, th.nearS);
    if (key === 'yaz') {
      // sazlıklar
      for (let x = 0; x < 480; x += 5 + Math.floor(rnd() * 6)) { const h = 14 + Math.floor(rnd() * 16); p.vline(x, 270 - 38 - h, 270 - 30, th.nearS); if (rnd() < 0.4) { p.rect(x - 1, 270 - 38 - h, 3, 6, '#8a5a32'); } }
    } else if (key !== 'kis' && key !== 'kovan') {
      for (let x = 0; x < 480; x += 9 + Math.floor(rnd() * 9)) {
        const col = th.flowers[Math.floor(rnd() * th.flowers.length)];
        const y = 270 - 36 - Math.floor(rnd() * 6);
        p.vline(x, y, y + 6, th.nearS); p.set(x - 1, y - 1, col); p.set(x + 1, y - 1, col); p.set(x, y - 2, col); p.set(x, y - 1, '#ffe066');
      }
    } else if (key === 'kis') {
      for (let x = 0; x < 480; x += 3) if (rnd() < 0.3) p.set(x, 270 - 36 - Math.floor(rnd() * 3), '#ffffff');
    } else {
      for (let x = 0; x < 480; x += 12 + Math.floor(rnd() * 10)) { const y = 270 - 34; p.ellipse(x, y, 3, 2, '#ffe39a'); }
    }
    return p;
  }

  function tree(p, x, y, r, colS, col, trunk) {
    p.rect(x - 1, y, 3, 30, trunk);
    p.ellipse(x, y - r * 0.4, r * 0.8, r * 0.7, colS);
    p.ellipse(x - 1, y - r * 0.5, r * 0.7, r * 0.6, col);
    p.dither(Math.floor(x - r * 0.6), Math.floor(y - r * 0.9), Math.floor(r * 0.7), Math.floor(r * 0.5), colS, 0.2);
  }

  function pine(p, x, y, h, col, snow) {
    p.vline(x, y + h - 4, y + h + 6, '#3a2a1c');
    for (let k = 0; k < 3; k++) {
      const ty = y + k * h * 0.28, w = 4 + k * 3;
      p.poly([[x - w, ty + h * 0.45], [x, ty], [x + w + 1, ty + h * 0.45]], col);
      p.hline(x - w + 1, x + w, Math.round(ty + h * 0.45) - 1, snow);
    }
    p.set(x, y, snow);
  }

  BB.Tiles = { renderTiles, makeBackground, isSolidT };
})(typeof window !== 'undefined' ? window : globalThis);
