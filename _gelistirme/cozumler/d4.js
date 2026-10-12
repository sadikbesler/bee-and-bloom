// Dünya 4 (Mantar Mağarası) çözüm betikleri. r: Run nesnesi (runner.js). Koordinatlar karo cinsindendir.
// Yardımcılar: fener al/bırak, ışık köprüsünde fenerciyle yan yana yürüme, ritim platformu bekleme, omuz omuza.
// İzleme: D4_IZ=1 ortam değişkeniyle arı durumları yazdırılır.
const T = 16;

function iz(r, etiket) {
  if (!process.env.D4_IZ) return;
  const b = (i) => { const x = r.bee(i); return `(${(r.cx(i) / T).toFixed(1)},${((x.y + x.h) / T).toFixed(1)} e${x.energy.toFixed(2)}${x.onGround ? ' y' : ''}${x.item ? ' F' : ''})`; };
  console.log(`  [${r.f}] ${etiket}: arı0 ${b(0)} arı1 ${b(1)}`);
}

// ust, alt'ın başına konar; alt kanat çırpar; alt yorulunca ust zıplayıp (c, rr) karosuna iner.
function omuz(r, alt, ust, c, rr) {
  r.run(r.flyTo(ust, r.cx(alt), r.bee(alt).y - 8, { tol: 2, tolY: 4 }), r.wait(1));
  r.run(r.until(() => r.bee(ust).onGround && r.bee(ust).groundKind === 'partner', 200, 'omuza konma'));
  r.run(r.until(() => r.bee(ust).energy > 0.99 && r.bee(alt).energy > 0.99, 60, 'omuzda enerji'));
  r.run((function* () {
    const a = r.inp[alt];
    a.flap = true; a.flapPressed = true;
    for (let k = 0; k < 120; k++) { if (r.bee(alt).energy <= 0.02 && r.bee(alt).vy > -20) break; yield; }
    a.flap = false;
  })());
  r.run(r.landT(ust, c, rr, { tol: 6, max: 500 }));
}

// i arısı yakındaki feneri alır
function fenerAl(r, i) {
  r.run(r.act(i));
  if (!r.bee(i).item) r.fail(`arı${i} feneri alamadı`);
}

// ritim platformu p (karo x'iyle bulunur): katı mı ve en az s saniye daha katı kalacak mı?
function ritim(r, c) { const p = r.w.e.pulse.find((q) => q.x === c * T); if (!p) r.fail('ritim yok: ' + c); return p; }
function kalan(r, p) { const t = ((r.w.time + p.phase) % p.period + p.period) % p.period; return t < p.on ? p.on - t : -(p.period - t); }
function* ritimBekle(r, p, s) { yield* r.until(() => kalan(r, p) >= s, 600, 'ritim'); }


// mantar c'nin üstüne gel, kanadı bırakıp üstüne düş, sekince devam et
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

module.exports = {
  10(r) {
    // Işıl'ın sorusu
    r.run(r.walkT(0, 14), r.walkT(1, 15));
    r.run(r.gateOpen('q1'));
    // fener
    r.run(r.walkT(0, 21), r.walkT(1, 20));
    fenerAl(r, 0);
    iz(r, 'fener');
    // 1. köprü: fenerci önde, ortak hemen arkasında
    r.run(r.walkT(0, 42), (function* () { yield* r.wait(6); yield* r.walkT(1, 41); })());
    r.run(r.walkT(0, 47), r.walkT(1, 45));
    iz(r, 'çiçek 1');
    // köprü basamağı ve yüksek kaya
    r.run(r.walkT(0, 55), r.walkT(1, 53));
    r.run(r.landT(0, 56, 11));
    r.run(r.landT(1, 55, 11));
    r.run(r.landT(0, 60, 8), (function* () { yield* r.wait(10); yield* r.landT(1, 59, 8); })());
    r.run(r.walkT(0, 68), r.walkT(1, 66));
    r.run(r.landT(0, 77, 14), r.landT(1, 79, 14));
    iz(r, 'çiçek 2');
    // iki ışık taşı: fenerci köprü merdiveniyle kovuğa, ortak yerdeki taşa
    r.run(r.walkT(0, 87), r.walkT(1, 85));
    r.run(r.landT(0, 88, 11));
    r.run(r.landT(0, 90, 8));
    r.run(r.path(0, [[90, 3], [96, 5, { land: true }]], { tiles: true }));
    r.run(r.gateOpen(['a', 'b']));
    iz(r, 'taşlar');
    r.run(r.landT(0, 104, 14), r.walkT(1, 103));
    r.run(r.walkT(0, 109), r.walkT(1, 107));
    iz(r, 'çiçek 3');
    // 2. köprü: iner çıkar
    r.run(r.walkT(0, 115), r.walkT(1, 114));
    r.run(r.walkT(0, 120), (function* () { yield* r.wait(4); yield* r.walkT(1, 119); })());
    r.run(r.landT(0, 124, 12), (function* () { yield* r.wait(8); yield* r.landT(1, 123, 12); })());
    r.run(r.walkT(0, 129), (function* () { yield* r.wait(4); yield* r.walkT(1, 128); })());
    r.run(r.landT(0, 133, 14), (function* () { yield* r.wait(8); yield* r.landT(1, 132, 14); })());
    r.run(r.walkT(0, 141), r.walkT(1, 139));
    iz(r, 'çiçek 4');
    r.run(r.walkT(0, 149), r.walkT(1, 150));
    r.run(r.gateOpen('q2'));
    // gizli çiçek: omuz omuza (fenerci feneri bırakır)
    r.run(r.act(0));
    r.run(r.walkT(0, 160), r.walkT(1, 158));
    omuz(r, 0, 1, 160, 6);
    r.run(r.landT(1, 163, 14), r.walkT(0, 162));
    r.run(r.walkT(0, 179), r.walkT(1, 180));
    r.expectWin();
  },
  11(r) {
    // ilk mantar ve kaya
    r.run(r.walkT(0, 14), r.walkT(1, 12));
    r.run(sek(r, 0, 15), (function* () { yield* r.wait(20); yield* sek(r, 1, 15); })());
    r.run(r.landT(0, 20, 9), (function* () { yield* r.wait(10); yield* r.landT(1, 18, 9); })());
    iz(r, 'kaya');
    r.run(r.walkT(0, 31), r.walkT(1, 33));
    r.run(r.gateOpen('q1'));
    r.run(r.walkT(0, 43), r.walkT(1, 41));
    iz(r, 'çiçek 1');
    // dikenli tarla: mantardan mantara
    r.run(r.walkT(0, 47), r.walkT(1, 46));
    for (const i of [0, 1]) {
      for (const c of [50, 56, 62]) r.run(sek(r, i, c));
      r.run(r.landT(i, 69 - i, 14));
    }
    r.run(r.walkT(0, 75), r.walkT(1, 73));
    iz(r, 'çiçek 2');
    // çiçeği açık tut: 0 tutar, 1 geçip karşı çiçeği tutar, 0 geçer
    const gate = r.gate(['f1', 'f2']);
    r.run(r.walkT(0, 83), r.walkT(1, 84.5));
    r.run((function* () { yield* r.holdWhile(0, () => !(r.cx(1) > 88.6 * T && r.bee(1).holdFlower)); yield* r.wait(6); yield* r.walkT(0, 92); })(), (function* () { yield* r.until(() => gate.open > 0.9, 200, 'çiçek kapısı'); yield* r.walkT(1, 89); yield* r.holdWhile(1, () => !(r.cx(0) > 87.5 * T), 900); })());
    iz(r, 'çiçek kapısı');
    r.run(r.walkT(0, 105), r.walkT(1, 103));
    iz(r, 'çiçek 3');
    // Ritim Köprüsü: biri sönerken öbürü yanar
    r.run(r.walkT(0, 109), r.walkT(1, 108));
    const rit = [[111, 13], [116, 11], [121, 12], [126, 10], [131, 12], [136, 11], [141, 13]];
    r.run(ritimBekle(r, ritim(r, 111), 1.3));
    rit.forEach(([c, rr], k) => {
      if (k > 0) { const p = ritim(r, rit[k - 1][0]); r.run(r.until(() => kalan(r, p) < 0.6, 300, 'ritim sönüşü')); }
      r.run(r.landT(0, c + 1, rr - 1, { tol: 5 }), r.landT(1, c, rr - 1, { tol: 5 }));
      iz(r, 'ritim ' + c);
    });
    r.run(r.until(() => kalan(r, ritim(r, 141)) < 0.6, 300, 'son ritim'));
    r.run(r.landT(0, 148, 14), r.landT(1, 147, 14));
    r.run(r.walkT(0, 153), r.walkT(1, 151));
    iz(r, 'çiçek 4');
    r.run(r.walkT(0, 161), r.walkT(1, 163));
    r.run(r.gateOpen('q2'));
    // gizli çiçek: omuz omuza
    r.run(r.walkT(0, 173), r.walkT(1, 171));
    omuz(r, 0, 1, 173, 6);
    r.run(r.landT(1, 176, 14), r.walkT(0, 175));
    r.run(r.walkT(0, 190), r.walkT(1, 191));
    r.expectWin();
  },
  12(r) {
    // fener ve köprü
    r.run(r.walkT(0, 10), r.walkT(1, 8));
    fenerAl(r, 0);
    r.run(r.landT(0, 17, 12), (function* () { yield* r.wait(6); yield* r.landT(1, 16, 12); })());
    r.run(r.walkT(0, 27), (function* () { yield* r.wait(6); yield* r.walkT(1, 26); })());
    r.run(r.landT(0, 30, 14), (function* () { yield* r.wait(6); yield* r.landT(1, 29, 14); })());
    r.run(r.walkT(0, 34), r.walkT(1, 32));
    iz(r, 'çiçek 1');
    // hatıra taşı: omuz omuza (fenerci feneri bırakır)
    r.run(r.act(0));
    r.run(r.walkT(0, 44), r.walkT(1, 42));
    omuz(r, 0, 1, 44, 7);
    r.run(r.gateOpen('tas'));
    r.run(r.landT(1, 47, 14), r.walkT(0, 46));
    // gizli çiçek: omuz omuza
    r.run(r.walkT(0, 58), r.walkT(1, 56));
    omuz(r, 0, 1, 58, 6);
    r.run(r.landT(1, 61, 14), r.walkT(0, 60));
    r.run(r.walkT(0, 68), r.walkT(1, 66));
    iz(r, 'çiçek 2');
    // sessiz oda: sorular ve hatıra
    r.run(r.walkT(0, 76), r.walkT(1, 77));
    r.run(r.gateOpen('q1'));
    r.run(r.walkT(0, 88), r.walkT(1, 89));
    r.run(r.gateOpen('q2'));
    r.run(r.walkT(0, 100), r.walkT(1, 98));
    iz(r, 'çiçek 3');
    // Çöküş Kaçışı
    r.run(r.walkT(0, 108), r.walkT(1, 107));
    iz(r, 'kaçış');
    r.run(r.landT(0, 118, 14), r.landT(1, 117, 14));
    r.run(r.landT(0, 124, 10), r.landT(1, 123, 10));
    r.run(r.walkT(0, 132), r.walkT(1, 131));
    r.run(r.walkT(0, 140), r.walkT(1, 139));
    r.run(r.landT(0, 151, 14), r.landT(1, 150, 14));
    r.run(r.walkT(0, 157), r.walkT(1, 155));
    iz(r, 'çiçek 4');
    r.run(r.walkT(0, 178), r.walkT(1, 177));
    r.run(r.path(0, [[181, 11], [184, 14, { land: true }]], { tiles: true }), r.path(1, [[180, 11], [183, 14, { land: true }]], { tiles: true }));
    r.run(r.path(0, [[188, 11], [192, 14, { land: true }]], { tiles: true }), r.path(1, [[187, 11], [191, 14, { land: true }]], { tiles: true }));
    r.run(r.landT(0, 203, 14), r.landT(1, 202, 14));
    r.run(r.walkT(0, 208), r.walkT(1, 206));
    iz(r, 'çiçek 5');
    r.run(r.walkT(0, 219), r.walkT(1, 220));
    r.expectWin();
  },
};
