// Dünya 5 (Kar Zirvesi) çözüm betikleri. r: Run nesnesi (runner.js). Koordinatlar karo cinsindendir.
// Kışta arılar uzun süre ayrı kalırsa donar: betikler arıları çoğunlukla yan yana yürütür.
// İzleme: D5_IZ=1 ortam değişkeniyle arı durumları (konum, enerji, ısı) yazdırılır.
const T = 16;

function iz(r, etiket) {
  if (!process.env.D5_IZ) return;
  const b = (i) => { const x = r.bee(i); return `(${(r.cx(i) / T).toFixed(1)},${((x.y + x.h) / T).toFixed(1)} e${x.energy.toFixed(2)} ı${x.heat.toFixed(2)}${x.onGround ? ' y' : ''}${x.carrying ? ' T' : ''})`; };
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

// rüzgâr bölgesinin esintisi dinene (ve dinginlik yeni başlamış olana) kadar bekle
function* dingin(r, z) {
  yield* r.until(() => z.f > 0.5, 400, 'esinti');
  yield* r.until(() => z.f < 0.5, 400, 'dinginlik');
}

module.exports = {
  13(r) {
    // Işıl'ın sorusu
    r.run(r.walkT(0, 15), r.walkT(1, 16));
    r.run(r.gateOpen('q1'));
    // tepecik, ateş, buz pisti, sarkıtlar (durmadan)
    r.run(r.walkT(0, 34), r.walkT(1, 33));
    r.run(r.walkT(0, 61), r.walkT(1, 59));
    iz(r, 'çiçek 1');
    // çift plaka: biri aşağıda, biri rafta (ikisinin yanında da ateş)
    r.run(r.walkT(0, 67), r.landT(1, 76, 10));
    r.run(r.gateOpen(['a', 'b']));
    r.run(r.path(0, [[74, 10, { land: true }], [85, 14, { land: true }]], { tiles: true }), r.path(1, [[78, 10, { walk: true }], [84, 14, { land: true }]], { tiles: true }));
    // Gölge sahnesi, düzlük
    r.run(r.walkT(0, 116), r.walkT(1, 115));
    iz(r, 'çiçek 2');
    // çatlak buz köprüsü: yan yana, durmadan
    r.run(r.walkT(0, 130), r.walkT(1, 129));
    r.run(r.landT(0, 137, 10), r.landT(1, 138, 10));
    r.run(r.gateOpen('q2'));
    r.run(r.walkT(0, 152), r.walkT(1, 150));
    iz(r, 'çiçek 3');
    // gizli çiçek: omuz omuza
    r.run(r.walkT(0, 159), r.walkT(1, 157));
    omuz(r, 0, 1, 159, 6);
    r.run(r.landT(1, 162, 14), r.walkT(0, 161));
    r.run(r.walkT(0, 174), r.walkT(1, 175));
    r.expectWin();
  },
  14(r) {
    // buzlu tepe, buz pisti ve diken çukuru
    r.run(r.landT(0, 20, 11), r.landT(1, 16, 11));
    r.run(r.landT(0, 30, 14), r.landT(1, 27, 14));
    r.run(r.landT(0, 41, 14), r.landT(1, 40, 14));
    r.run(r.walkT(0, 47), r.walkT(1, 45));
    iz(r, 'çiçek 1');
    // omuz omuza: yüksek raftaki plaka
    r.run(r.walkT(0, 59), r.walkT(1, 57));
    omuz(r, 0, 1, 59, 7);
    r.run(r.gateOpen('tepe'));
    r.run(r.landT(1, 63, 14), r.walkT(0, 62));
    r.run(r.walkT(0, 71), r.walkT(1, 69));
    iz(r, 'çiçek 2');
    // sarkıtlı mağara: yan yana, durmadan
    r.run(r.walkT(0, 100), r.walkT(1, 99));
    // Bora ve sorular
    r.run(r.walkT(0, 108), r.walkT(1, 109));
    r.run(r.gateOpen('q1'));
    r.run(r.walkT(0, 115), r.walkT(1, 117));
    r.run(r.gateOpen('q2'));
    // kuyudan tünele
    r.run(r.walkT(0, 120), r.walkT(1, 119.5));
    r.run(r.walkT(0, 127), r.walkT(1, 125));
    iz(r, 'çiçek 3');
    // Kırık Buz Köprüsü
    for (const [c, rr] of [[141, 16], [147, 18], [153, 16], [159, 17], [165, 15], [171, 17], [175, 14]]) {
      r.run(r.landT(0, c, rr), r.landT(1, c - 1, rr));
      iz(r, 'köprü ' + c);
    }
    r.run(r.walkT(0, 181), r.walkT(1, 179));
    // gizli çiçek: omuz omuza
    r.run(r.walkT(0, 187), r.walkT(1, 185));
    omuz(r, 0, 1, 187, 7);
    r.run(r.landT(1, 190, 14), r.walkT(0, 189));
    r.run(r.walkT(0, 195), r.walkT(1, 196));
    r.expectWin();
  },
  15(r) {
    const W = r.w.e.wind;
    const zon = (c) => W.find((z) => z.x <= c * T && z.x + z.w >= c * T);
    // fırtına düzlüğü: esinti dinince bir kayanın arkasından ötekine
    r.run(r.walkT(0, 21), r.walkT(1, 20));
    for (const [c, kz] of [[30, 25], [39, 34], [48, 43]]) {
      r.run(dingin(r, zon(kz)));
      r.run(r.landT(0, c, 14), r.landT(1, c - 1, 14));
      iz(r, 'sığınak ' + c);
    }
    r.run(r.landT(0, 55, 14), r.landT(1, 53, 14));
    iz(r, 'çiçek 1');
    // çiçeği açık tut: 0 tutar, 1 rüzgârlı geçitten karşı çiçeğe gider; sonra tersi
    const z = zon(66);
    const gate = r.gate(['f1', 'f2']);
    r.run(r.walkT(0, 59), r.walkT(1, 60.5));
    r.run(r.holdWhile(0, () => !(r.cx(1) > 72 * T)), (function* () { yield* r.until(() => gate.open > 0.9, 200, 'çiçek kapısı'); yield* dingin(r, z); yield* r.walkT(1, 73); })());
    r.run(r.holdWhile(1, () => !(r.cx(0) > 64 * T)), (function* () { yield* r.until(() => gate.open > 0.9, 200, 'çiçek kapısı 2'); yield* dingin(r, z); yield* r.walkT(0, 71); })());
    iz(r, 'çiçek geçildi');
    // Fırtına Sırtı
    r.run(r.landT(0, 81, 12), r.landT(1, 80, 12));
    r.run(r.landT(0, 89, 10), r.landT(1, 88, 10));
    iz(r, 'çiçek 2');
    r.run(dingin(r, zon(95)));
    r.run(r.walkT(0, 100), r.walkT(1, 99));
    iz(r, 'sırt 1');
    r.run(dingin(r, zon(104)));
    r.run(r.landT(0, 109, 9), r.landT(1, 108, 9));
    iz(r, 'sırt 2');
    r.run(dingin(r, zon(115)));
    r.run(r.landT(0, 124, 12), r.landT(1, 123, 12));
    iz(r, 'sırt 3');
    r.run(r.walkT(0, 130), r.walkT(1, 128));
    // Bora'yı ısıt
    r.run(r.walkT(0, 151), r.walkT(1, 152));
    r.run(r.gateOpen('boraWarm', 900));
    iz(r, 'bora');
    r.run(r.walkT(0, 160), r.walkT(1, 161));
    r.run(r.gateOpen('q1'));
    r.run(r.walkT(0, 168), r.walkT(1, 169));
    r.run(r.gateOpen('q2'));
    // gizli çiçek: omuz omuza
    r.run(r.walkT(0, 182), r.walkT(1, 180));
    omuz(r, 0, 1, 182, 7);
    r.run(r.landT(1, 185, 14), r.walkT(0, 184));
    r.run(r.walkT(0, 192), r.walkT(1, 193));
    r.expectWin();
  },
};
