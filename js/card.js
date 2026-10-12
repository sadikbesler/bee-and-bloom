/* Bee & Bloom — Anı Kartı (270x338 piksel, 4x büyütülüp PNG indirilir) ve tüm cevaplar sayfası. */
(function () {
  'use strict';
  const BB = window.BB;
  const Card = {};
  BB.Card = Card;
  const CW = 270, CH = 372, SCALE = 4;

  const CAT_W = { FLR: 3, ARK: 2, SOH: 1 };
  const TYPE_W = { G: 0.5, T: 0.7, K: 0.2, A: 0 };

  // kart için örnek seçimi: duygusal değeri yüksek aynı cevaplar + en farklı tek örnek
  Card.pick = function (answers, names) {
    const list = [];
    for (const id of Object.keys(answers || {})) {
      const q = BB.Q.get(id);
      if (!q) continue;
      const rec = answers[id];
      list.push({ q, rec, score: (CAT_W[q.cat] || 1) + (TYPE_W[q.type] || 0) + (q.level / 100) });
    }
    const same = list.filter((x) => BB.Q.match(x.rec)).sort((a, b) => b.score - a.score).slice(0, 3);
    const diff = list.filter((x) => !BB.Q.match(x.rec)).sort((a, b) => b.score - a.score)[0] || null;
    const fmtSame = (x) => {
      const opts = BB.Q.options(x.q, names);
      if (x.q.type === 'T') return { q: x.q.text.replace('?', '') + '?', a: (names[x.q.subject || 0]) + ': ' + opts[x.rec.a] + ' (bildi!)' };
      if (x.q.type === 'K') return { q: x.q.text, a: 'İkiniz de: ' + opts[x.rec.a] };
      return { q: x.q.text, a: 'İkiniz de: ' + opts[x.rec.a] };
    };
    return { same: same.map(fmtSame), diff: diff ? { q: diff.q.text, a: BB.Q.options(diff.q, names)[diff.rec.a], b: BB.Q.options(diff.q, names)[diff.rec.b], type: diff.q.type } : null, total: list.length };
  };

  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return { c, x }; }

  // düz renk bal peteği çerçeve deseni
  function honeyFrame(x, w, h) {
    x.fillStyle = '#c47a1e'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e09a2e';
    for (let r = 0; r < h / 7 + 1; r++) for (let c = 0; c < w / 8 + 1; c++) {
      const cx = c * 8 + (r % 2) * 4, cy = r * 7;
      x.fillRect(cx - 2, cy - 2, 4, 4); x.fillRect(cx - 3, cy - 1, 6, 2);
    }
    x.fillStyle = '#fff4dc'; x.fillRect(6, 6, w - 12, h - 12);
    x.fillStyle = '#3b2516'; x.fillRect(6, 6, w - 12, 1); x.fillRect(6, h - 7, w - 12, 1); x.fillRect(6, 6, 1, h - 12); x.fillRect(w - 7, 6, 1, h - 12);
  }

  function jarBig(x, ox, oy, fill) {
    // 34x42 bal kavanozu (dolu oranı)
    x.fillStyle = '#3b2516'; x.fillRect(ox + 7, oy, 20, 7); x.fillRect(ox + 1, oy + 7, 32, 35);
    x.fillStyle = '#c8683a'; x.fillRect(ox + 8, oy + 1, 18, 5);
    x.fillStyle = '#e8f6ff'; x.fillRect(ox + 2, oy + 8, 30, 33);
    const hh = Math.round(31 * BB.clamp(fill, 0, 1));
    if (hh > 0) { x.fillStyle = '#ffb32c'; x.fillRect(ox + 3, oy + 40 - hh, 28, hh); x.fillStyle = '#ffd96a'; x.fillRect(ox + 3, oy + 40 - hh, 28, 2); }
    x.fillStyle = '#ffffff'; x.fillRect(ox + 5, oy + 11, 2, 16);
  }

  // kartı düşük çözünürlükte çiz (içerik ölçülür; alt bilgi sabit yerde)
  Card.render = function (d) {
    const Gfx = BB.Gfx;
    const { c, x } = makeCanvas(CW, CH);
    const names = d.names, roles = d.roles;
    honeyFrame(x, CW, CH);
    // başlık
    Gfx.text(x, 'Bee & Bloom', CW / 2, 12, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
    Gfx.text(x, 'Anı Kartı', CW / 2, 38, { color: 'honeyD', align: 'center' });
    // portreler
    x.fillStyle = '#ffe9b8'; x.fillRect(28, 54, 52, 52); x.fillRect(190, 54, 52, 52);
    x.fillStyle = '#3b2516'; for (const px of [27, 189]) { x.fillRect(px, 53, 54, 1); x.fillRect(px, 106, 54, 1); x.fillRect(px, 53, 1, 54); x.fillRect(px + 53, 53, 1, 54); }
    Gfx.spr(x, 'pt_' + roles[0] + '_happy', 0, 30, 56);
    Gfx.spr(x, 'pt_' + roles[1] + '_happy', 0, 192, 56, true);
    Gfx.text(x, names[0], 54, 109, { color: roles[0] === 'disi' ? 'pink' : 'blue', align: 'center' });
    Gfx.text(x, names[1], 216, 109, { color: roles[1] === 'disi' ? 'pink' : 'blue', align: 'center' });
    Gfx.text(x, '♥', CW / 2, 62, { color: 'pink', align: 'center', scale: 2 });
    Gfx.text(x, BB.fmtDate(d.finishedAt || Date.now()), CW / 2, 88, { color: 'gray', align: 'center' });
    // uyum: kavanoz + yüzde
    const u = BB.Q.uyum(d.answers);
    jarBig(x, 70, 126, u.pct / 100);
    Gfx.text(x, '%' + u.pct, 172, 124, { color: 'honeyD', align: 'center', scale: 3 });
    Gfx.text(x, 'uyum', 172, 156, { color: 'ink', align: 'center' });
    Gfx.text(x, u.ok + ' / ' + u.total + ' eşleşme', 172, 168, { color: 'gray', align: 'center' });
    // içerik bloklarını ölç ve yerleştir
    const pk = Card.pick(d.answers, names);
    const top = 186, bottom = CH - 60, Wt = 236;
    const lines = (t, w) => BB.Font.wrap(t, w).length;
    const blockH = (same) => {
      let h = 12;
      if (!same.length) h += 11 * lines('Hiçbirinde! Siz birbirinizi tamamlıyorsunuz.', Wt);
      for (const s2 of same) h += 10 * lines('• ' + s2.q, Wt) + 10 * lines(s2.a, Wt - 10) + 2;
      h += 4 + 12;
      if (pk.diff) h += 10 * lines('• ' + pk.diff.q, Wt) + 10 * lines(names[0] + ': ' + pk.diff.a, Wt - 10) + 10 * lines(names[1] + ': ' + pk.diff.b, Wt - 10);
      else h += 10;
      return h;
    };
    let same = pk.same;
    while (same.length > 1 && top + blockH(same) > bottom) same = same.slice(0, -1);
    let y = top;
    const put = (t, xx, col, w) => { const ls = BB.Font.wrap(t, w); ls.forEach((ln) => { Gfx.text(x, ln, xx, y, { color: col }); y += 10; }); };
    Gfx.text(x, 'Aynı düşündünüz', 14, y, { color: 'green' }); y += 12;
    if (!same.length) put('Hiçbirinde! Siz birbirinizi tamamlıyorsunuz.', 18, 'ink', Wt);
    for (const s2 of same) { put('• ' + s2.q, 16, 'ink', Wt); put(s2.a, 26, 'honeyD', Wt - 10); y += 2; }
    y += 4;
    Gfx.text(x, 'En farklı düşündüğünüz', 14, y, { color: 'red' }); y += 12;
    if (pk.diff) { put('• ' + pk.diff.q, 16, 'ink', Wt); put(names[0] + ': ' + pk.diff.a, 26, 'honeyD', Wt - 10); put(names[1] + ': ' + pk.diff.b, 26, 'honeyD', Wt - 10); }
    else put('Hiç! Her soruda aynı yerdeydiniz.', 18, 'ink', Wt);
    // alt bilgi (sabit)
    const pollen = Object.values(d.pollen || {}).reduce((a, b) => a + b, 0);
    const secrets = Object.keys(d.secrets || {}).length;
    x.fillStyle = '#e8d4b0'; x.fillRect(12, CH - 58, CW - 24, 1);
    Gfx.text(x, 'Süre ' + BB.fmtTime(d.playTime) + '   Düşme ' + (d.totalDeaths || 0) + '   Bal ' + Object.keys(d.answers || {}).length + '/40', CW / 2, CH - 54, { color: 'ink', align: 'center' });
    Gfx.text(x, 'Polen ' + pollen + '   Nadir çiçek ' + secrets + '/18', CW / 2, CH - 42, { color: 'gray', align: 'center' });
    Gfx.text(x, 'Bee & Bloom · designed by sadixck', CW / 2, CH - 26, { color: 'honeyD', align: 'center' });
    return c;
  };

  // tüm cevaplar (uzun sayfa)
  Card.renderAll = function (d) {
    const Gfx = BB.Gfx;
    const names = d.names;
    const qs = BB.Q.order().filter((q) => d.answers[q.id]);
    const rows = qs.map((q) => {
      const rec = d.answers[q.id];
      const o = BB.Q.options(q, names);
      const lines = BB.Font.wrap(q.text, 244).length + BB.Font.wrap(names[0] + ': ' + o[rec.a], 230).length + BB.Font.wrap(names[1] + ': ' + o[rec.b], 230).length;
      return { q, rec, o, h: lines * 11 + 10 };
    });
    const H = 60 + rows.reduce((a, r) => a + r.h, 0) + 30;
    const { c, x } = makeCanvas(CW, H);
    honeyFrame(x, CW, H);
    Gfx.text(x, 'Bee & Bloom', CW / 2, 10, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
    Gfx.text(x, 'Bütün cevaplar · ' + names[0] + ' & ' + names[1], CW / 2, 36, { color: 'honeyD', align: 'center', maxW: 250 });
    let y = 56;
    rows.forEach((r, i) => {
      Gfx.text(x, (i + 1) + '. ' + r.q.text, 14, y, { color: 'ink', maxW: 244 }); y += BB.Font.wrap((i + 1) + '. ' + r.q.text, 244).length * 11;
      const st = BB.Q.stamp(r.q, r.rec), good = BB.Q.match(r.rec);
      Gfx.text(x, names[0] + ': ' + r.o[r.rec.a], 22, y, { color: 'honeyD', maxW: 180 });
      Gfx.text(x, st, CW - 14, y, { color: good ? 'green' : 'red', align: 'right' });
      y += BB.Font.wrap(names[0] + ': ' + r.o[r.rec.a], 180).length * 11;
      Gfx.text(x, names[1] + ': ' + r.o[r.rec.b], 22, y, { color: 'honeyD', maxW: 180 }); y += BB.Font.wrap(names[1] + ': ' + r.o[r.rec.b], 180).length * 11 + 10;
    });
    Gfx.text(x, 'Bee & Bloom · designed by sadixck', CW / 2, H - 22, { color: 'honeyD', align: 'center' });
    return c;
  };

  Card.upscale = function (src, k) {
    const { c, x } = makeCanvas(src.width * k, src.height * k);
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, src.width * k, src.height * k);
    return c;
  };

  Card.download = function (canvas, name, done) {
    const big = Card.upscale(canvas, SCALE);
    const finish = (url, revoke) => {
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(url), 5000);
      if (done) done(true);
    };
    try {
      if (big.toBlob) big.toBlob((blob) => { if (blob) finish(URL.createObjectURL(blob), true); else finish(big.toDataURL('image/png'), false); }, 'image/png');
      else finish(big.toDataURL('image/png'), false);
    } catch (e) { if (done) done(false); }
  };

  Card.SIZE = { w: CW, h: CH, scale: SCALE };
})();
