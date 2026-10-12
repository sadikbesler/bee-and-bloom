// 18. bölüm (Kraliçe Balı) çözüm betiği.
module.exports = {
  18(r) {
    const T = 16;
    // iki plaka → kalıcı kapı
    r.run(r.walkT(0, 17), r.walkT(1, 22));
    r.run(r.gateOpen(['a', 'b']));
    // soru 1
    r.run(r.walkT(0, 32), r.walkT(1, 34));
    r.run(r.gateOpen('q1'));
    // petek basamakları: soru 2
    r.run(r.landT(0, 43, 12), r.landT(1, 44, 12));
    r.run(r.walkT(0, 48), r.walkT(1, 50));
    r.run(r.gateOpen('q2'));
    // soru 3
    r.run(r.landT(0, 63, 10), r.landT(1, 64, 10));
    r.run(r.walkT(0, 65), r.walkT(1, 67));
    r.run(r.gateOpen('q3'));
    // gizli çiçek: omuz omuza (raf 87-89, satır 2)
    r.run(r.landT(0, 84, 8), r.landT(1, 85, 8));
    r.run(r.walkT(0, 88), r.walkT(1, 87));
    r.run(r.flyTo(1, r.cx(0), r.bee(0).y - 8, { tol: 2, tolY: 4 }));
    r.run(r.until(() => r.bee(1).onGround && r.bee(1).groundKind === 'partner', 200, 'omuza konma'));
    r.run(r.until(() => r.bee(1).energy > 0.99, 60));
    r.run((function* () {
      const a = r.inp[0];
      a.flap = true; a.flapPressed = true;
      for (let k = 0; k < 120; k++) { if (r.bee(0).energy <= 0.02 && r.bee(0).vy > -20) break; yield; }
      a.flap = false;
    })());
    r.run(r.landT(1, 88, 1, { tol: 6, max: 400 }));
    if (!r.w.stats.secret) r.fail('nadir çiçek alınamadı');
    r.run(r.flyTo(1, 86 * T + 8, 9 * T - 6, { land: true }), r.flyTo(0, 85 * T + 8, 9 * T - 6, { land: true }));
    // soru 4
    r.run(r.walkT(0, 89), r.walkT(1, 91));
    r.run(r.gateOpen('q4'));
    // soru 5
    r.run(r.landT(0, 104, 6), r.landT(1, 105, 6));
    r.run(r.walkT(0, 105), r.walkT(1, 107));
    r.run(r.gateOpen('q5'));
    // taht salonu: soru 6 ve çıkış
    r.run(r.flyTo(0, 117 * T + 8, 11 * T - 6, { land: true }), r.flyTo(1, 118 * T + 8, 11 * T - 6, { land: true }));
    r.run(r.walkT(0, 125), r.walkT(1, 127));
    r.run(r.gateOpen('q6'));
    r.run(r.walkT(0, 143), r.walkT(1, 144));
    r.expectWin();
  },
};
