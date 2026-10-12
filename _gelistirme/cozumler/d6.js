// Dünya 6 (Kovan'ın Kalbi) çözüm betikleri: 16 Kovan Yolu, 17 Balın Kapısı. r: Run nesnesi (runner.js). Koordinatlar karo cinsindendir.
// Yerel yardımcılar önceki dünyaların betiklerinden alındı: damladan kaçınarak yürüme (d3), nilüfer sıçrayışı (d2),
// mantar/ritim/fener (d4), esinti bekleme (d5), kalkan gölgesinde izleme (d3), taşıma (d2), omuz omuza.
// İzleme: D6_IZ=1 ortam değişkeniyle arı durumları yazdırılır.
const T = 16;

function iz(r, etiket) {
  if (!process.env.D6_IZ) return;
  const b = (i) => { const x = r.bee(i); return `(${(r.cx(i) / T).toFixed(1)},${((x.y + x.h) / T).toFixed(1)} e${x.energy.toFixed(2)}${x.onGround ? ' y' : ''}${x.item ? ' ' + x.item.kind : ''}${x.carrying ? ' T' : ''})`; };
  console.log(`  [${r.f}] ${etiket}: arı0 ${b(0)} arı1 ${b(1)}`);
}

// ------------------------------------------------------------ omuz omuza
// ust, alt'ın başına konar; alt kanat çırpar; alt yorulunca ust zıplayıp (c, rr) karosuna iner.
function omuz(r, alt, ust, c, rr, o) {
  o = o || {};
  r.run(r.flyTo(ust, r.cx(alt), r.bee(alt).y - 8, { tol: 2, tolY: 4 }), r.wait(1));
  r.run(r.until(() => r.bee(ust).onGround && r.bee(ust).groundKind === 'partner', 200, 'omuza konma'));
  r.run(r.until(() => r.bee(ust).energy > 0.99 && r.bee(alt).energy > 0.99, 60, 'omuzda enerji'));
  r.run((function* () {
    const a = r.inp[alt];
    a.flap = true; a.flapPressed = true;
    if (o.yon) { if (o.yon > 0) a.right = true; else a.left = true; }
    for (let k = 0; k < 120; k++) { if (r.bee(alt).energy <= 0.02 && r.bee(alt).vy > -20) break; yield; }
    a.flap = false; a.left = a.right = false;
  })());
  r.run(r.landT(ust, c, rr, { tol: 6, max: 500 }));
}

// ------------------------------------------------------------ taşıma
// tasiyan ortağını alır, (c, rr) karosuna uçup iner ve bırakır. cruiseRow: uçuş sırasında hedeflenen en yüksek satır.
function tasi(r, tasiyan, c, rr, cruiseRow, o) {
  o = o || {};
  r.run(r.pickUp(tasiyan));
  r.run(r.until(() => r.bee(tasiyan).energy + r.bee(tasiyan).carrying.energy > 1.98, 60, 'taşıma enerjisi'));
  r.run(r.flyTo(tasiyan, r.tx(c), rr * T + 16 - 6 - 12, { land: true, cruise: cruiseRow * T, tol: 6, tolY: 10, max: 900 }));
  if (o.tut) return;
  r.run(r.drop(tasiyan));
  r.run(r.wait(4));
  if (r.bee(tasiyan).groundKind === 'partner') r.run(r.walkTo(tasiyan, r.cx(tasiyan) + (o.ayril || 16), { tol: 3 }));
  r.run(r.until(() => r.bee(tasiyan).onGround && r.bee(tasiyan).groundKind !== 'partner', 120, 'taşıyan ayrılsın'));
}

// ------------------------------------------------------------ nilüfer / uzun sıçrayış
function* sicra(r, i, c, rr, yuk, o) {
  const satir = Math.min((r.bee(i).y + r.bee(i).h) / T, rr + 1) - (yuk === undefined ? 3 : yuk) - 1;
  yield* r.landT(i, c, rr, Object.assign({ cruise: satir * T + 8 }, o || {}));
}
function* adim(r, i, list, yuk) { for (const [c, rr] of list) yield* sicra(r, i, c, rr, yuk); }

// ------------------------------------------------------------ damlalar
function korunmus(r, d, y) {
  const w = r.w, c = Math.floor(d.x / T);
  for (let rr = Math.floor((d.y0 + 4) / T); rr * T < y - 2; rr++) if (w.tileSolid({ role: '' }, c, rr)) return true;
  return false;
}
function tehlikeli(r, d, y, s) {
  if (korunmus(r, d, y)) return false;
  if (d.st === 'fall') return d.y0 + d.dy < y + 4;
  const t = ((r.w.time + d.phase) % d.period + d.period) % d.period;
  return d.period - t < s;
}
function* damlaBekle(r, i, x0, x1, s, max) {
  const lo = Math.min(x0, x1) - 12, hi = Math.max(x0, x1) + 12;
  let n = 0;
  while (r.w.e.drip.some((d) => d.x >= lo && d.x <= hi && tehlikeli(r, d, r.bee(i).y + r.bee(i).h, s))) {
    if (++n > (max || 400)) r.fail('damla beklemesi uzadı');
    yield;
  }
}
// damla sütunlarına girmeden önce durup bekleyerek yürü
function* yuru(r, i, c, o) {
  o = o || {};
  const x = r.tx(c), b = r.bee(i), inp = r.inp[i];
  let n = 0, hop = 0;
  while (Math.abs(r.cx(i) - x) > 3) {
    const d = x - r.cx(i), dir = Math.sign(d);
    let dur = false;
    for (const dr of r.w.e.drip) {
      const ax = dr.x - r.cx(i);
      if (Math.sign(ax) === dir && Math.abs(ax) < 15 && Math.abs(ax) > 8 && tehlikeli(r, dr, b.y + b.h, 0.5)) dur = true;
    }
    inp.left = !dur && d < 0; inp.right = !dur && d > 0;
    if (Math.abs(d) < 6 && Math.abs(b.vx) > 40) inp.left = inp.right = false;
    if (!dur && b.onGround && b.hitX && hop <= 0) { inp.flap = true; inp.flapPressed = true; hop = o.hop || 16; }
    if (hop > 0 && --hop === 0) inp.flap = false;
    if (++n > (o.max || 2500)) r.fail(`yuru zaman aşımı arı${i} hedef ${c}`);
    yield;
  }
  inp.left = inp.right = false; inp.flap = false;
  for (let k = 0; k < 4; k++) yield;
}
function* kon(r, i, c, rr, o) {
  yield* damlaBekle(r, i, r.cx(i), r.tx(c), (o && o.sure) || 0.8);
  yield* r.landT(i, c, rr, o);
}

// ------------------------------------------------------------ fener, mantar, ritim
function fenerAl(r, i) {
  r.run(r.act(i));
  if (!r.bee(i).item) r.fail(`arı${i} feneri alamadı`);
}
function* sek(r, i, c, rr) {
  yield* r.flyTo(i, r.tx(c), r.ty(rr || 11), { tol: 4, tolY: 14 });
  const inp = r.inp[i], b = r.bee(i);
  let n = 0;
  inp.flap = false;
  while (!(b.vy < -150 && !b.onGround)) {
    const d = r.tx(c) - r.cx(i);
    inp.left = d < -2; inp.right = d > 2;
    if (++n > 200) r.fail(`arı${i} mantara sekemedi (${c})`);
    yield;
  }
  inp.left = inp.right = false;
}
// mantara kanat basılıyken sek (bounceHold): mantarın üstüne gel, düş; değmeden hemen önce kanadı bas
function* sekK(r, i, c, rr) {
  const m = r.w.e.bounce.find((q) => q.x === c * T);
  if (!m) r.fail('mantar yok: ' + c);
  yield* r.flyTo(i, r.tx(c), r.ty(rr), { tol: 3, tolY: 10 });
  const inp = r.inp[i], b = r.bee(i);
  let n = 0;
  inp.flap = false;
  while (!(b.vy < -150 && !b.onGround)) {
    const d = r.tx(c) - r.cx(i);
    inp.left = d < -2; inp.right = d > 2;
    inp.flap = b.y + b.h >= m.solid.y - 5;
    if (++n > 200) r.fail(`arı${i} mantara sekemedi (${c})`);
    yield;
  }
  inp.left = inp.right = false;
}
function ritim(r, c) { const p = r.w.e.pulse.find((q) => q.x === c * T); if (!p) r.fail('ritim yok: ' + c); return p; }
function kalan(r, p) { const t = ((r.w.time + p.phase) % p.period + p.period) % p.period; return t < p.on ? p.on - t : -(p.period - t); }
function* ritimBekle(r, p, s) { yield* r.until(() => kalan(r, p) >= s, 600, 'ritim'); }
// ritim platformu sönükken, belirmesine en çok 'once' saniye kala (uzak sıçrayışlarda erken kalkış için)
function* ritimHazir(r, p, once) { yield* r.until(() => { const k = kalan(r, p); return k < 0 && -k <= once; }, 600, 'ritim hazır'); }

// ------------------------------------------------------------ rüzgâr
function* dingin(r, z) {
  yield* r.until(() => z.f > 0.5, 400, 'esinti');
  yield* r.until(() => z.f < 0.5, 400, 'dinginlik');
}
// i arısı j'yi izler: j'nin dx px gerisinde, aynı yükseklikte (kalkanın gölgesinde) kalır
function* takip(r, i, j, dx, bitti, max) {
  const inp = r.inp[i], b = r.bee(i);
  let n = 0;
  while (!bitti()) {
    const d = r.cx(j) + dx - r.cx(i);
    inp.right = d > 3; inp.left = d < -3;
    const alt = b.y > r.bee(j).y + 2;
    inp.flap = alt || (b.onGround && !!b.hitX);
    inp.flapPressed = inp.flap && b.onGround;
    if (++n > (max || 3000)) r.fail('takip zaman aşımı');
    yield;
  }
  inp.left = inp.right = inp.flap = false;
  for (let k = 0; k < 6; k++) yield;
}
function* kalkanAl(r, i) {
  yield* r.act(i);
  if (!r.bee(i).item || r.bee(i).item.kind !== 'shield') r.fail('kalkan alınamadı');
}
// çiçeği açık tut: a çiçeği tutar, b geçip karşı çiçeğe gider; sonra b tutar, a geçer
function cicekKapisi(r, on, a, b, fa, fb, varisA) {
  const gate = r.gate(on);
  r.run(r.holdWhile(a, () => !(r.cx(b) > fb * T && r.cx(b) < fb * T + 16)), (function* () { yield* r.until(() => gate.open > 0.8, 200, 'çiçek kapısı'); yield* r.walkT(b, fb); })());
  r.run(r.holdWhile(b, () => !(r.cx(a) > (fb - 2) * T)), (function* () { yield* r.until(() => gate.open > 0.8, 200, 'çiçek kapısı 2'); yield* r.walkT(a, varisA); })());
}

module.exports = {
  16(r) {
    // başlangıç tepeciği ve yırtılmış ağ
    r.run(r.landT(0, 17, 12), r.landT(1, 15, 12));
    r.run(r.landT(0, 21, 14), r.landT(1, 20, 14));
    r.run(r.path(0, [[23, 12], [26, 14, { land: true }]], { tiles: true }), (function* () { yield* r.wait(8); yield* r.path(1, [[23, 12], [25, 14, { land: true }]], { tiles: true }); })());
    // Püntür'ün sorusu
    r.run(r.walkT(0, 30), r.walkT(1, 32));
    r.run(r.gateOpen('q1'));
    iz(r, 'q1');
    // çiçek kapısı
    r.run(r.walkT(0, 39), r.walkT(1, 40));
    cicekKapisi(r, ['f1', 'f2'], 0, 1, 39, 45, 47);
    r.run(r.walkT(0, 51), r.walkT(1, 49));
    iz(r, 'çiçek 1');
    // Zıpzıp'ın sorusu
    r.run(r.walkT(0, 55), r.walkT(1, 57));
    r.run(r.gateOpen('q2'));
    // tek nilüfer: birer birer; çift nilüfer: birlikte
    r.run(r.walkT(0, 66), r.walkT(1, 65));
    r.run(adim(r, 0, [[72, 14], [80, 13]]));
    r.run(adim(r, 1, [[72, 14], [79, 13]]));
    iz(r, 'ada');
    r.run(r.landT(0, 88, 14), r.landT(1, 86, 14));
    r.run(r.landT(0, 96, 14), r.landT(1, 95, 14));
    r.run(r.walkT(0, 99), r.walkT(1, 97));
    iz(r, 'çiçek 2');
    // Hu'nun korusu: damlalar
    r.run(yuru(r, 0, 126), (function* () { yield* r.wait(20); yield* yuru(r, 1, 125); })());
    // yukarı esen akım → yayla
    r.run(r.path(0, [[127.5, 4], [133, 8, { land: true }]], { tiles: true }), (function* () { yield* r.wait(30); yield* r.path(1, [[127.5, 4], [132, 8, { land: true }]], { tiles: true }); })());
    r.run(r.walkT(0, 135), r.walkT(1, 133));
    iz(r, 'çiçek 3');
    // Işıl'ın yolu: fener ve ışık köprüsü
    r.run(r.landT(0, 144, 14), r.landT(1, 143, 14));
    r.run(r.walkT(0, 148), r.walkT(1, 146));
    fenerAl(r, 0);
    r.run(r.walkT(0, 165), (function* () { yield* r.wait(6); yield* r.walkT(1, 164); })());
    r.run(r.act(0));
    iz(r, 'köprü');
    // mantar → kaya
    r.run(r.walkT(0, 166), r.walkT(1, 164));
    r.run(sek(r, 0, 168), (function* () { yield* r.wait(24); yield* sek(r, 1, 168); })());
    r.run(r.landT(0, 173, 9), (function* () { yield* r.wait(10); yield* r.landT(1, 172, 9); })());
    iz(r, 'mantar');
    // ritim platformları
    const p1 = ritim(r, 178), p2 = ritim(r, 183);
    r.run(r.walkT(0, 175), r.walkT(1, 174));
    r.run(ritimBekle(r, p1, 1.3));
    r.run(r.landT(0, 179, 10, { tol: 5 }), r.landT(1, 178, 10, { tol: 5 }));
    r.run(r.until(() => kalan(r, p1) < 0.6, 300, 'ritim sönüşü'));
    r.run(r.landT(0, 184, 10, { tol: 5 }), r.landT(1, 183, 10, { tol: 5 }));
    r.run(r.until(() => kalan(r, p2) < 0.6, 300, 'ritim sönüşü 2'));
    r.run(r.landT(0, 191, 11), r.landT(1, 189, 11));
    iz(r, 'çiçek 4');
    // kış: buz pisti, kırılan buz, sarkıtlar
    r.run(r.landT(0, 195, 14), r.landT(1, 194, 14));
    r.run(r.walkT(0, 222), r.walkT(1, 221));
    iz(r, 'kış');
    // gizli: omuz omuza
    r.run(r.walkT(0, 224), r.walkT(1, 222));
    omuz(r, 0, 1, 224, 6);
    r.run(r.landT(1, 227, 14), r.walkT(0, 226));
    r.run(r.walkT(0, 228), r.walkT(1, 229));
    r.expectWin();
  },  17(r) {
    // petek tavanlı damla koridoru
    r.run(yuru(r, 0, 42), (function* () { yield* r.wait(20); yield* yuru(r, 1, 40); })());
    iz(r, 'damlalar');
    // ağır bal topu: 0 topu alır, 1 onu saksının rafına taşır
    r.run(r.walkT(0, 44), r.walkT(1, 42));
    r.run(r.act(0));
    if (!r.bee(0).item) r.fail('bal topu alınamadı');
    r.run(r.walkT(0, 48), r.walkT(1, 47));
    r.run(r.walkT(1, 48, { tol: 2 }));
    tasi(r, 1, 52, 9, 6);
    r.run(r.walkT(0, 53, { tol: 2 }));
    r.run(r.act(0));
    r.run(r.until(() => r.w.e.pot[0].bloomed, 120, 'saksı'));
    r.run(r.gateOpen('saksi'));
    iz(r, 'saksı');
    r.run(r.landT(0, 63, 14), r.landT(1, 61, 14));
    // Bora'nın 1. sorusu
    r.run(r.walkT(0, 66), r.walkT(1, 68));
    r.run(r.gateOpen('q1'));
    r.run(r.walkT(0, 78), r.walkT(1, 76));
    iz(r, 'çiçek 2');
    // Balın Kapısı I
    const p1 = ritim(r, 81), p2 = ritim(r, 86), p3 = ritim(r, 105), p4 = ritim(r, 111);
    r.run(ritimBekle(r, p1, 1.3));
    r.run(r.landT(0, 82, 11, { tol: 5 }), r.landT(1, 81, 11, { tol: 5 }));
    r.run(r.until(() => kalan(r, p1) < 0.6, 300, 'ritim 1 sönüşü'));
    r.run(r.landT(0, 87, 10, { tol: 5 }), r.landT(1, 86, 10, { tol: 5 }));
    r.run(r.until(() => kalan(r, p2) < 0.6, 300, 'ritim 2 sönüşü'));
    r.run(r.landT(0, 95, 11, { tol: 5 }), r.landT(1, 93, 11, { tol: 5 }));
    iz(r, 'sütun');
    r.run((function* () { yield* sekK(r, 0, 94, 8); yield* r.landT(0, 101, 4); })());
    iz(r, 'duvar 0');
    r.run((function* () { yield* sekK(r, 1, 94, 8); yield* r.landT(1, 100, 4); })());
    iz(r, 'duvar 1');
    r.run(ritimHazir(r, p3, 0.4));
    r.run(r.landT(0, 106, 7, { tol: 5 }), r.landT(1, 105, 7, { tol: 5 }));
    iz(r, 'p3 ' + kalan(r, p3).toFixed(2));
    r.run(r.until(() => kalan(r, p3) < 0.6, 300, 'ritim 3 sönüşü'));
    iz(r, 'p3 sonu p4=' + kalan(r, p4).toFixed(2));
    r.run(r.landT(0, 112, 9, { tol: 5 }), r.landT(1, 111, 9, { tol: 5 }));
    iz(r, 'p4 ' + kalan(r, p4).toFixed(2));
    r.run(r.until(() => kalan(r, p4) < 0.6, 300, 'ritim 4 sönüşü'));
    r.run(r.landT(0, 119, 12), r.landT(1, 117, 12));
    r.run(r.walkT(0, 121), r.walkT(1, 119));
    iz(r, 'çiçek 3');
    // buz pisti ve sarkıtlar
    r.run(r.landT(0, 125, 14), r.landT(1, 124, 14));
    r.run(r.walkT(0, 136), r.walkT(1, 135));
    // iki ışık taşı: 1 yerdekine, 0 fenerle petek rafındakine
    r.run(r.walkT(0, 137, { tol: 2 }), r.walkT(1, 140));
    fenerAl(r, 0);
    r.run(r.landT(0, 143, 11));
    r.run(r.landT(0, 146, 8));
    r.run(r.path(0, [[146, 3], [151, 5, { land: true }]], { tiles: true }));
    r.run(r.gateOpen(['a', 'b']));
    iz(r, 'ışık taşları');
    r.run(r.act(0));
    r.run(r.landT(0, 158, 14), r.walkT(1, 157));
    // Bora'nın 2. sorusu
    r.run(r.walkT(0, 160), r.walkT(1, 162));
    r.run(r.gateOpen('q2'));
    r.run(r.walkT(0, 172), r.walkT(1, 170));
    iz(r, 'çiçek 4');
    // Balın Kapısı II
    const W = r.w.e.wind;
    const zon = (c) => W.find((z) => z.x <= c * T && z.x + z.w >= c * T);
    r.run(r.landT(0, 177, 11, { tol: 3 }), r.landT(1, 176, 11, { tol: 3 }));
    r.run(dingin(r, zon(180)));
    r.run(r.walkT(0, 184), r.walkT(1, 183));
    iz(r, 'köprü 1');
    r.run(r.landT(0, 190, 14), r.landT(1, 188, 14));
    r.run(r.landT(0, 194, 11, { tol: 3 }), r.landT(1, 193, 11, { tol: 3 }));
    iz(r, 'nilüfer');
    r.run(dingin(r, zon(197)));
    r.run(r.walkT(0, 202), r.walkT(1, 201));
    iz(r, 'köprü 2');
    r.run(r.landT(0, 207, 14), r.landT(1, 206, 14));
    r.run(r.walkT(0, 209), r.walkT(1, 207));
    iz(r, 'çiçek 5');
    // gizli: omuz omuza
    r.run(r.walkT(0, 214), r.walkT(1, 212));
    omuz(r, 0, 1, 214, 6);
    r.run(r.landT(1, 217, 14), r.walkT(0, 216));
    r.run(r.walkT(0, 221), r.walkT(1, 222));
    r.expectWin();
  },
};
