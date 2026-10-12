// Dünya 1 çözüm betikleri. r: Run nesnesi (runner.js). Koordinatlar karo cinsindendir (tx/ty ile piksele çevrilir).
module.exports = {
  1(r) {
    const T = 16;
    // soru 1 (açık): kovanın önündeki çiçekler
    r.run(r.walkT(0, 16), r.walkT(1, 18));
    r.run(r.pickFlowers(0, 0));
    r.run(r.gateOpen('q1'));
    // basamak ve uçuş çıkıntısı
    r.run(r.walkT(0, 42), r.walkT(1, 41));
    r.run(r.landT(0, 47, 10), r.landT(1, 49, 10));
    // diken tarlasının üstünden süzülüp çiçek bulmacasına
    r.run(r.path(0, [[55, 9], [61, 14, { land: true }]], { tiles: true }), r.path(1, [[54, 9], [60, 14, { land: true }]], { tiles: true }));
    // 0 çiçeği tutar, 1 geçer ve karşıdaki çiçeği tutar, 0 geçer
    r.run(r.walkT(0, 63), r.walkT(1, 64));
    const gate = r.gate(['f1', 'f2']);
    r.run(r.holdWhile(0, () => !(r.cx(1) > 70 * T)), (function* () { yield* r.until(() => gate.open > 0.8, 200, 'çiçek kapısı'); yield* r.walkT(1, 70); })());
    r.run(r.holdWhile(1, () => !(r.cx(0) > 68 * T + 12)), (function* () { yield* r.until(() => gate.open > 0.8, 200, 'çiçek kapısı 2'); yield* r.walkT(0, 72); })());
    // Püntür sahnesi ve soru 2 (raflardaki çiçeklere uçarak)
    r.run(r.walkT(0, 87), r.walkT(1, 89));
    r.run(r.pickFlowers(1, 3));
    r.run(r.gateOpen('q2'));
    // diken çayırı: nektarla süzül
    r.run(r.path(0, [[106, 14, { land: true }], [110, 10], [114, 8], [119, 14, { land: true }]], { tiles: true }), (function* () { yield* r.walkT(1, 105); yield* r.until(() => r.cx(0) > 112 * 16, 400); yield* r.wait(20); yield* r.path(1, [[106, 14, { land: true }], [110, 10], [114, 8], [120, 14, { land: true }]], { tiles: true }); })());
    // gizli çiçek: 1, 0'ın başına konar; 0 uçar; 1 tepede zıplar
    r.run(r.walkT(0, 122));
    r.run(r.flyTo(1, r.cx(0), r.bee(0).y - 8, { tol: 2, tolY: 4 }), r.wait(1));
    r.run(r.until(() => r.bee(1).onGround && r.bee(1).groundKind === 'partner', 200, 'omuza konma'));
    r.run(r.until(() => r.bee(1).energy > 0.99, 60, 'omuzda enerji'));
    let jumped = false;
    r.run((function* () {
      const a = r.inp[0];
      a.flap = true; a.flapPressed = true;
      for (let k = 0; k < 120 && !jumped; k++) {
        if (r.bee(0).energy <= 0.02 && r.bee(0).vy > -20) { jumped = true; break; }
        yield;
      }
      a.flap = false;
    })());
    r.run(r.landT(1, 122, 6, { tol: 6, max: 400 }));
    r.run(r.flyTo(1, 125 * T + 8, 14 * T + 8, { land: true }), r.walkT(0, 126));
    // son raflar ve çıkış
    r.run(r.path(0, [[130, 12, { land: true }], [134, 11, { land: true }], [138, 14, { land: true }]], { tiles: true }), r.path(1, [[129, 12, { land: true }], [133, 11, { land: true }], [139, 14, { land: true }]], { tiles: true }));
    r.expectWin();
  },
  2(r) {
    const T = 16;
    // polen topu → saksı → sarmaşık
    r.run(r.walkT(0, 25), r.walkT(1, 23));
    r.run(r.act(0));
    if (!r.bee(0).item) r.fail('polen alınamadı');
    r.run(r.walkT(0, 35), r.walkT(1, 33));
    r.run(r.act(0));
    r.run(r.until(() => r.w.e.pot[0].bloomed, 120, 'saksı 1'));
    r.run(r.until(() => r.w.e.vine[0].grow >= 1, 600, 'sarmaşık'));
    // sarmaşık yapraklarından tırman (yaprak i: x≈38 ± , y = 240 - 16 i)
    const leaves = r.w.e.vine[0].leaves;
    for (const i of [0, 1]) {
      for (const L of leaves) r.run(r.flyTo(i, L.x + L.w / 2, L.y - 6, { land: true }));
      r.run(r.walkT(i, 44 + i));
    }
    // yardan inip ağır polene
    r.run(r.path(0, [[58, 4, { walk: true }], [61, 8, { land: true }], [64, 11, { land: true }], [67, 14, { land: true }]], { tiles: true }),
      r.path(1, [[57, 4, { walk: true }], [60, 8, { land: true }], [63, 11, { land: true }], [66, 14, { land: true }]], { tiles: true }));
    r.run(r.walkT(0, 68));
    r.run(r.act(0));
    if (!r.bee(0).item) r.fail('ağır polen alınamadı');
    // 1, 0'ı (topuyla) taşıyıp rafa çıkar
    r.run(r.walkT(1, 68));
    r.run(r.pickUp(1));
    r.run(r.flyTo(1, 76 * T + 8, 10 * T - 18, { land: true, tolY: 8, max: 600 }));
    r.run(r.drop(1));
    r.run(r.wait(10));
    r.run(r.walkT(0, 77));
    r.run(r.act(0));
    r.run(r.until(() => r.w.e.pot[1].bloomed, 120, 'saksı 2'));
    r.run(r.gateOpen('pot2'));
    // Gölge sahnesi ve soru 1
    r.run(r.path(0, [[85, 14, { land: true }]], { tiles: true }), r.path(1, [[84, 14, { land: true }]], { tiles: true }));
    r.run(r.walkT(0, 117), r.walkT(1, 119));
    r.run(r.pickFlowers(2, 1));
    r.run(r.gateOpen('q1'));
    // çift plaka
    r.run(r.walkT(0, 137), r.landT(1, 142, 11));
    r.run(r.gateOpen(['a', 'b']));
    // gizli çiçek: omuz omuza (raf 139-141, satır 6)
    r.run(r.walkT(0, 140), r.flyTo(1, 139 * T + 8, 14 * T - 8, { tol: 3 }));
    r.run(r.flyTo(1, r.cx(0), r.bee(0).y - 8, { tol: 2, tolY: 4 }));
    r.run(r.until(() => r.bee(1).onGround && r.bee(1).groundKind === 'partner', 200, 'omuza konma'));
    r.run(r.until(() => r.bee(1).energy > 0.99, 60));
    r.run((function* () {
      const a = r.inp[0];
      a.flap = true; a.flapPressed = true;
      for (let k = 0; k < 120; k++) { if (r.bee(0).energy <= 0.02 && r.bee(0).vy > -20) break; yield; }
      a.flap = false;
    })());
    r.run(r.landT(1, 140, 5, { tol: 6, max: 400 }));
    r.run(r.flyTo(1, 145 * T + 8, 15 * T - 6, { land: true }), r.flyTo(0, 146 * T + 8, 15 * T - 6, { land: true }));
    // soru 2 ve çıkış
    r.run(r.walkT(0, 151), r.walkT(1, 153));
    r.run(r.gateOpen('q2'));
    r.run(r.walkT(0, 167), r.walkT(1, 168));
    r.expectWin();
  },
  3(r) {
    const T = 16;
    const spiderUp = (k, lim) => { const sp = r.w.e.spider[k]; return sp.y - sp.y0 < (lim || 20); };
    // ağ tanıtımı: zemindeki ağın üstünden atla
    r.run(r.path(0, [[13, 14, { walk: true }], [17, 13], [19, 14, { land: true }]], { tiles: true }), r.path(1, [[12, 14, { walk: true }], [16, 13], [18, 14, { land: true }]], { tiles: true }));
    r.run(r.walkT(0, 30), r.walkT(1, 31));
    // örümcek bahçesi: örümcekler yukarıdayken raftan rafa
    r.run(r.walkT(0, 34), r.walkT(1, 33));
    for (const i of [0, 1]) {
      r.run(r.until(() => spiderUp(0, 30), 400, 'örümcek 1'));
      r.run(r.landT(i, 40, 10));
      r.run(r.until(() => spiderUp(1, 30), 400, 'örümcek 2'));
      r.run(r.landT(i, 48, 9));
      r.run(r.until(() => spiderUp(2, 30), 400, 'örümcek 3'));
      r.run(r.path(i, [[54, 8], [56 + i, 14, { land: true }]], { tiles: true }));
    }
    // gizli çiçek: alçak sütundan omuz omuza koridor çatısına
    r.run(r.landT(0, 60, 10), r.landT(1, 58, 10));
    r.run(r.flyTo(1, r.cx(0), r.bee(0).y - 8, { tol: 2, tolY: 4 }));
    r.run(r.until(() => r.bee(1).onGround && r.bee(1).groundKind === 'partner', 200, 'omuza konma'));
    r.run(r.until(() => r.bee(1).energy > 0.99, 60));
    r.run((function* () {
      const a = r.inp[0];
      a.flap = true; a.flapPressed = true;
      for (let k = 0; k < 120; k++) { if (r.bee(0).energy <= 0.02 && r.bee(0).vy > -20) break; yield; }
      a.flap = false;
    })());
    r.run(r.landT(1, 67, 3, { tol: 6, max: 400 }), r.landT(0, 60, 10));
    r.run(r.walkT(1, 79));
    if (!r.w.stats.secret) r.fail('nadir çiçek alınamadı');
    r.run(r.walkT(1, 67));
    r.run(r.flyTo(1, 64 * T + 8, 15 * T - 6, { land: true }), r.flyTo(0, 63 * T + 8, 15 * T - 6, { land: true }));
    // Ağ Koridoru
    const pass = function* (i) {
      yield* r.walkT(i, 69);
      yield* r.path(i, [[71, 13], [73, 14, { land: true }]], { tiles: true });   // zemindeki ağın üstünden
      yield* r.walkT(i, 79);
      yield* r.path(i, [[80.5, 13], [82, 14, { land: true }]], { tiles: true }); // dikenlerin üstünden
      yield* r.until(() => spiderUp(4, 9), 300, 'koridor örümceği');
      yield* r.path(i, [[83.5, 13], [85, 14, { land: true }]], { tiles: true }); // ağın üstünden, örümcek yukarıdayken
    };
    r.run(pass(0));
    r.run(pass(1));
    r.run(r.walkT(0, 89), r.walkT(1, 88));
    const g = r.gate(['f1', 'f2']);
    r.run(r.holdWhile(0, () => !(r.cx(1) > 95 * T)), (function* () { yield* r.until(() => g.open > 0.8, 200); yield* r.walkT(1, 95); })());
    r.run(r.holdWhile(1, () => !(r.cx(0) > 93 * T + 12)), (function* () { yield* r.until(() => g.open > 0.8, 200); yield* r.walkT(0, 97); })());
    // papatya yolu → Püntür'ün tepesi
    r.run(r.walkT(0, 106), r.walkT(1, 105));
    r.run(r.path(0, [[109, 11, { land: true }], [114, 9, { land: true }], [121, 10, { land: true }]], { tiles: true }), r.path(1, [[108, 11, { land: true }], [113, 9, { land: true }], [122, 10, { land: true }]], { tiles: true }));
    r.run(r.walkT(0, 128), r.walkT(1, 130));
    r.run(r.walkT(0, 135), r.walkT(1, 137));
    r.run(r.gateOpen(['q1', 'q2']));
    r.run(r.walkT(0, 150), r.walkT(1, 149));
    r.run(r.flyTo(0, 164 * T + 8, 15 * T - 6, { land: true }), r.flyTo(1, 165 * T + 8, 15 * T - 6, { land: true }));
    r.expectWin();
  },
};
