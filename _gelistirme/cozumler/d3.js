// Dünya 3 (Kehribar Orman) çözüm betikleri. r: Run nesnesi (runner.js). Koordinatlar karo cinsindendir.
// Yerel yardımcılar: damladan kaçınarak yürüme/uçma, omuz omuza, kalkanla rüzgârda yürüme + gölgede izleme.
// İzleme: D3_IZ=1 ortam değişkeniyle arı durumları yazdırılır.
const T = 16;

function iz(r, etiket) {
  if (!process.env.D3_IZ) return;
  const b = (i) => { const x = r.bee(i); return `(${(r.cx(i) / T).toFixed(1)},${((x.y + x.h) / T).toFixed(1)} e${x.energy.toFixed(2)}${x.onGround ? ' y' : ''}${x.item ? ' K' : ''})`; };
  console.log(`  [${r.f}] ${etiket}: arı0 ${b(0)} arı1 ${b(1)}`);
}

// ------------------------------------------------------------ damlalar
// damla d'nin sütununda, damla ile y (px) arasında onu durduracak karo var mı (çatı/zemin)?
function korunmus(r, d, y) {
  const w = r.w, c = Math.floor(d.x / T);
  for (let rr = Math.floor((d.y0 + 4) / T); rr * T < y - 2; rr++) if (w.tileSolid({ role: '' }, c, rr)) return true;
  return false;
}
// damla s saniye içinde arının bulunduğu yüksekliğe tehlike oluşturur mu?
function tehlikeli(r, d, y, s) {
  if (korunmus(r, d, y)) return false;
  if (d.st === 'fall') return d.y0 + d.dy < y + 4;
  const t = ((r.w.time + d.phase) % d.period + d.period) % d.period;
  return d.period - t < s;
}
// i arısının yolundaki (x0..x1 px) damlalar s saniye boyunca güvenli olana dek bekle
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
      // önümüzde ve yakında (içinde değil) olan tehlikeli damla
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
// damlalara bakarak (c, rr) karosuna in
function* kon(r, i, c, rr, o) {
  yield* damlaBekle(r, i, r.cx(i), r.tx(c), (o && o.sure) || 0.8);
  yield* r.landT(i, c, rr, o);
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

// ------------------------------------------------------------ kalkan
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

module.exports = {
  7(r) {
    // tepe ve 1. su birikintisi
    r.run(r.path(0, [[15, 12, { land: true }], [19, 14, { land: true }], [24, 14, { land: true }]], { tiles: true }),
      r.path(1, [[14, 12, { land: true }], [18, 14, { land: true }], [23, 14, { land: true }]], { tiles: true }));
    // damla korusu
    r.run(yuru(r, 0, 55), yuru(r, 1, 53));
    // 1. soru
    r.run(yuru(r, 0, 62), yuru(r, 1, 64));
    r.run(r.gateOpen('q1'));
    // 2. su birikintisi (ortadaki taş)
    r.run(r.path(0, [[76, 13, { land: true }], [81, 14, { land: true }]], { tiles: true }), r.path(1, [[76, 13, { land: true }], [80, 14, { land: true }]], { tiles: true }));
    // Gölge sahnesi
    r.run(yuru(r, 0, 104), yuru(r, 1, 103));
    // yüksek plaka: omuz omuza
    r.run(yuru(r, 0, 110), yuru(r, 1, 108));
    omuz(r, 0, 1, 114, 7);
    r.run(r.gateOpen('k1'));
    r.run(r.landT(1, 123, 14), yuru(r, 0, 125));
    // yağmur patikası
    r.run(yuru(r, 0, 146, { hop: 30 }), (function* () { yield* r.wait(50); yield* yuru(r, 1, 144, { hop: 30 }); })());
    r.run(kon(r, 0, 152, 14), (function* () { yield* r.wait(40); yield* kon(r, 1, 152, 14); })());
    r.run(yuru(r, 0, 159), yuru(r, 1, 157));
    // gizli nadir çiçek (omuz omuza)
    r.run(yuru(r, 0, 163), yuru(r, 1, 161));
    omuz(r, 0, 1, 163, 6);
    r.run(r.landT(1, 166, 14), yuru(r, 0, 167));
    // 2. soru ve çıkış
    r.run(yuru(r, 0, 167), yuru(r, 1, 169));
    r.run(r.gateOpen('q2'));
    r.run(yuru(r, 0, 179), yuru(r, 1, 180));
    r.expectWin();
  },

  8(r) {
    // gizli nadir çiçek: başlangıçtaki yüksek raf (omuz omuza)
    r.run(r.walkT(0, 12), r.walkT(1, 10));
    omuz(r, 0, 1, 12, 6);
    r.run(r.landT(1, 15, 14), r.walkT(0, 16));
    // arkadan esen rüzgârla dikenli çukur
    r.run(r.landT(0, 34, 14), (function* () { yield* r.wait(20); yield* r.landT(1, 33, 14); })());
    r.run(r.walkT(0, 41), r.walkT(1, 40));
    // yukarı esen akım → yayla
    r.run(r.path(0, [[44, 2], [50, 4, { land: true }]], { tiles: true }), (function* () { yield* r.wait(30); yield* r.path(1, [[44, 2], [49, 4, { land: true }]], { tiles: true }); })());
    r.run(r.walkT(0, 59), r.walkT(1, 61));
    r.run(r.gateOpen('q1'));
    r.run(r.landT(0, 80, 14), (function* () { yield* r.wait(20); yield* r.landT(1, 79, 14); })());
    // kalkan koridoru: 0 kalkanla yürür, 1 gölgesinde izler
    r.run(r.walkT(0, 81), r.walkT(1, 78));
    r.run(kalkanAl(r, 0));
    r.run(r.walkT(0, 110, { max: 2500 }), takip(r, 1, 0, -22, () => r.cx(0) > 109 * T && r.cx(1) > 108.5 * T));
    r.run(r.gateOpen('k1'));
    r.run(r.act(0));
    r.run(r.walkT(0, 119), r.walkT(1, 121));
    r.run(r.gateOpen('q2'));
    // Fırtına Dalı
    r.run(r.walkT(0, 131), r.walkT(1, 129));
    r.run(kalkanAl(r, 0));
    r.run(r.walkT(0, 181, { max: 4000 }), takip(r, 1, 0, -20, () => r.cx(0) > 179 * T && r.cx(1) > 177.5 * T, 4000));
    r.run(r.walkT(0, 187), r.walkT(1, 188));
    r.expectWin();
  },

  9(r) {
    const runeBas = function* (i, sym) {
      yield* r.act(i);
      const rn = r.w.e.rune.find((x) => x.sym === sym);
      if (!rn.lit) r.fail('rün yanmadı: ' + sym);
    };
    // zemin katı: 1. soru
    r.run(r.walkT(0, 12), r.walkT(1, 14));
    r.run(r.gateOpen('q1'));
    r.run(r.walkT(0, 25), r.walkT(1, 23));
    // kovuk akımı → 1. kat, çift plaka
    r.run(r.path(0, [[29, 32], [36, 36, { land: true }]], { tiles: true }), (function* () { yield* r.wait(40); yield* r.path(1, [[30, 32], [52, 32, { land: true }]], { tiles: true }); })());
    r.run(r.gateOpen(['a', 'b']));
    // 2. akım → 2. kat
    r.run(r.path(0, [[45, 19], [41, 24, { land: true }]], { tiles: true }), (function* () { yield* r.wait(30); yield* r.path(1, [[46, 19], [42, 24, { land: true }]], { tiles: true }); })());
    // sembol taşları: yağmur → rüzgâr → yaprak → güneş
    r.run(r.walkT(0, 5), r.walkT(1, 22));
    r.run(runeBas(0, 'yagmur'));
    r.run(r.walkT(0, 24), r.landT(1, 39, 19));
    r.run(runeBas(1, 'ruzgar'));
    r.run(r.walkT(0, 41), r.landT(1, 59, 24));
    r.run(runeBas(1, 'yaprak'));
    r.run(r.landT(0, 22, 19), r.landT(1, 35, 24));
    r.run(runeBas(0, 'gunes'));
    r.run(r.gateOpen('hu'));
    // 3. akım → tepe
    r.run(r.path(0, [[17, 6], [23, 12, { land: true }]], { tiles: true }), (function* () { yield* r.wait(30); yield* r.path(1, [[18, 6], [24, 12, { land: true }]], { tiles: true }); })());
    r.run(r.walkT(0, 35), r.walkT(1, 37));
    r.run(r.gateOpen('q2'));
    // gizli nadir çiçek (omuz omuza)
    r.run(r.walkT(0, 49), r.walkT(1, 47));
    omuz(r, 0, 1, 49, 4);
    r.run(r.landT(1, 55, 12), r.walkT(0, 56));
    r.run(r.walkT(0, 56), r.walkT(1, 57));
    r.expectWin();
  },
};
