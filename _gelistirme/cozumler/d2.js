// Dünya 2 (Yaz Gölü) çözüm betikleri. r: Run nesnesi (runner.js). Koordinatlar karo cinsindendir.
// Yerel yardımcılar: omuz omuza, taşıma uçuşu, platform bekleme. İzleme: D2_IZ=1 ortam değişkeniyle arı durumları yazdırılır.
const T = 16;

// izleme görevi: her n karede bir arı durumlarını yazdır (yalnız D2_IZ ile); dur() true olunca biter
function* izle(r, n, dur, ek) {
  let k = 0;
  while (!dur()) { if (process.env.D2_IZ && k++ % n === 0) iz(r, ek ? ek() : 'izle'); yield; }
}

function iz(r, etiket) {
  if (!process.env.D2_IZ) return;
  const b = (i) => { const x = r.bee(i); return `(${(r.cx(i) / T).toFixed(1)},${((x.y + x.h) / T).toFixed(1)} e${x.energy.toFixed(2)}${x.onGround ? ' y' : ''}${x.carrying ? ' T' : ''})`; };
  console.log(`  [${r.f}] ${etiket}: arı0 ${b(0)} arı1 ${b(1)}`);
}

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

// tasiyan ortağını alır, (c, rr) karosuna uçup iner ve bırakır. cruise: uçuş sırasında hedeflenen en yüksek satır.
function tasi(r, tasiyan, c, rr, cruiseRow, o) {
  o = o || {};
  r.run(r.pickUp(tasiyan));
  r.run(r.until(() => r.bee(tasiyan).energy + r.bee(tasiyan).carrying.energy > 1.98, 60, 'taşıma enerjisi'));
  r.run(r.flyTo(tasiyan, r.tx(c), rr * T + 16 - 6 - 12, { land: true, cruise: cruiseRow * T, tol: 6, tolY: 10, max: 900 }));
  if (o.tut) return;
  r.run(r.drop(tasiyan));
  // bırakınca taşıyan, ortağın başında kalır: yana inip ayrıl
  r.run(r.wait(4));
  if (r.bee(tasiyan).groundKind === 'partner') r.run(r.walkTo(tasiyan, r.cx(tasiyan) + (o.ayril || 16), { tol: 3 }));
  r.run(r.until(() => r.bee(tasiyan).onGround && r.bee(tasiyan).groundKind !== 'partner', 120, 'taşıyan ayrılsın'));
}

// sıçra: (c, rr) karosuna in; uçuş sırasında başlangıç/hedef satırının 'yuk' karo üstüne tırman (uzun atlayışlar için)
function* sicra(r, i, c, rr, yuk, o) {
  const satir = Math.min((r.bee(i).y + r.bee(i).h) / T, rr + 1) - (yuk === undefined ? 3 : yuk) - 1;
  yield* r.landT(i, c, rr, Object.assign({ cruise: satir * T + 8 }, o || {}));
}
// nilüfere kon: hedefi yüzeyin biraz altına koy (batmakta olan yaprağın üstünde asılı kalmasın)
function* konT(r, i, c, rr, o) { yield* r.flyTo(i, r.tx(c), rr * T + 16 - 6 + 5, Object.assign({ land: true, tolY: 12 }, o || {})); }
// yukarıdaki rafa çık: önce rafın kenarının (kc sütunu) üstüne yüksel, sonra (c, rr) karosuna in
function* cik(r, i, kc, c, rr) {
  yield* r.flyTo(i, r.tx(kc), rr * T + 2, { tol: 6, tolY: 6 });
  yield* r.landT(i, c, rr);
}
// bir arıyı sırayla karolara indir
function* adim(r, i, list, yuk) { for (const [c, rr] of list) yield* sicra(r, i, c, rr, yuk); }

module.exports = {
  4(r) {
    // ilk soru: Zıpzıp'ın tahtının önü
    r.run(r.walkT(0, 13), r.walkT(1, 15));
    r.run(r.gateOpen('q1'));
    iz(r, 'q1');
    // Gölet A: tek arılık nilüfer, birer birer
    r.run(r.walkT(0, 25), r.walkT(1, 23));
    r.run(adim(r, 0, [[34, 12], [46, 11]]));
    r.run(adim(r, 1, [[34, 12], [48, 11]]));
    iz(r, 'gölet A');
    // Gölet B: çift nilüfer, birlikte
    r.run(r.walkT(0, 50), r.walkT(1, 51));
    r.run(r.landT(0, 59, 12), r.landT(1, 61, 12));
    r.run(r.landT(0, 71, 12), r.landT(1, 72, 12));
    iz(r, 'gölet B');
    // tepe, Gölge sahnesi, Gölet C
    r.run(adim(r, 0, [[76, 9], [81, 12]]), adim(r, 1, [[78, 9], [83, 12]]));
    r.run(adim(r, 0, [[89, 12], [95, 12]]));
    r.run(adim(r, 1, [[90, 12], [97, 12]]));
    iz(r, 'gölet C');
    // büyük göl: 1, 0'ı taşır
    r.run(r.walkT(0, 103), r.walkT(1, 103));
    tasi(r, 1, 119, 12, 5);
    iz(r, 'göl');
    // karışık gölet: çifte birlikte, sonra ayrı yeşillere
    r.run(r.walkT(0, 126), r.walkT(1, 127));
    r.run(r.landT(0, 133, 12), r.landT(1, 135, 12));
    r.run(r.landT(0, 145, 12), r.landT(1, 140, 12));
    r.run(r.landT(0, 151, 12));
    r.run(r.landT(1, 150, 12));
    iz(r, 'karışık');
    // ikinci soru
    r.run(r.walkT(0, 152), r.walkT(1, 154));
    r.run(r.gateOpen('q2'));
    // Kral'ın kapısı: omuz omuza plakaya
    r.run(r.walkT(0, 162), r.walkT(1, 160));
    omuz(r, 0, 1, 164, 5);
    r.run(r.gateOpen('kral'));
    iz(r, 'kral');
    r.run(r.landT(1, 168, 12), r.walkT(0, 167));
    // gizli: yüksek ada (omuz omuza)
    r.run(r.walkT(0, 175), r.walkT(1, 173));
    omuz(r, 0, 1, 177, 5);
    r.run(r.landT(1, 182, 11));
    // çıkış
    r.run(r.landT(0, 186, 11), r.landT(1, 187, 11));
    r.expectWin();
  },
  5(r) {
    const race = r.w.e.race[0];
    const plat = r.w.e.platform;
    // ilk soru
    r.run(r.walkT(0, 14), r.walkT(1, 16));
    r.run(r.gateOpen('q1'));
    // gizli: tünel tavanı (omuz omuza), 1 tavanda polenleri toplar ve geri iner
    r.run(r.walkT(0, 24), r.walkT(1, 22));
    omuz(r, 0, 1, 27, 6);
    r.run(r.walkT(1, 36));
    r.run(r.walkT(1, 26));
    r.run(r.landT(1, 23, 12));
    iz(r, 'gizli');
    // tünel: birinci havuz (tek nilüfer), ikinci havuz (iki tek nilüfer, akıntı)
    r.run(r.walkT(0, 29), r.walkT(1, 28));
    r.run(adim(r, 0, [[32, 12], [38, 12]], 1));
    r.run(adim(r, 1, [[33, 12], [39, 12]], 1));
    r.run(r.walkT(0, 41), r.walkT(1, 40));
    r.run(adim(r, 0, [[44, 12], [48, 12], [53, 12]], 1));
    r.run(adim(r, 1, [[45, 12], [49, 12], [54, 12]], 1));
    iz(r, 'tünel');
    // Kral Yarışı
    r.run(r.walkT(0, 64), r.walkT(1, 65));
    r.run(r.until(() => race.st === 'run', 400, 'yarış başlamadı'));
    iz(r, 'yarış başladı');
    const yol = [[73, 12], [81, 10], [97, 11], [99, 10], [102, 11], [110, 12]];
    let bitti = false;
    r.run((function* () { yield* adim(r, 0, yol, 2); })(), (function* () { yield* adim(r, 1, [[74, 12], [82, 10], [98, 11], [99, 10], [103, 11], [111, 12]], 2); bitti = true; })(),
      izle(r, 30, () => bitti || race.st !== 'run', () => `kurbağa ${(race.fx / T).toFixed(1)} st=${race.st}`));
    r.run(r.walkT(0, 111), r.walkT(1, 112));
    iz(r, `yarış bitti st=${race.st} kurbağa=${(race.fx / T).toFixed(1)} seg=${race.seg}/${race.path.length - 1}`);
    r.run(r.gateOpen('yaris'));
    // ikinci soru (A7)
    r.run(r.walkT(0, 125), r.walkT(1, 127));
    r.run(r.gateOpen('q2'));
    // yusufçuk asansörü: 0 plakada, 1 asansörle yukarıdaki plakaya
    const lift = plat[0];
    r.run(r.walkT(0, 133), r.walkT(1, 142));
    r.run(r.flyTo(1, lift.solid.x + 16, lift.solid.y - 6, { land: true, tol: 4, tolY: 4 }));
    r.run(r.walkT(0, 134));
    r.run(r.until(() => lift.u > 0.99, 300, 'asansör yukarı'));
    r.run(r.walkT(1, 147));
    r.run(r.gateOpen('tepe'));
    iz(r, 'asansör');
    r.run(r.landT(1, 151, 12), r.walkT(0, 150));
    // köprü (Gölge'nin onardığı) ve Yusufçuk Geçidi
    r.run(r.walkT(0, 173), r.walkT(1, 174));
    const [d1, d2] = [plat[1], plat[2]];
    r.run(r.until(() => d1.u < 0.01 && d1.dwell > 0.45, 600, 'yusufçuk 1 yakında'));
    r.run(r.landT(0, 176, 11, { tol: 3 }), r.landT(1, 177, 11, { tol: 3 }));
    r.run(r.until(() => d1.u > 0.99, 400, 'yusufçuk 1 karşıda'));
    r.run(konT(r, 0, 186, 12), konT(r, 1, 185, 12));
    iz(r, 'çift nilüfer');
    r.run(r.walkT(0, 187, { tol: 2 }), r.walkT(1, 186, { tol: 2 }));
    r.run(r.until(() => d2.dir < 0 && d2.u < 0.12, 600, 'yusufçuk 2 geliyor'));
    r.run(r.landT(0, 190, 11, { tol: 3 }), r.landT(1, 189, 11, { tol: 3 }));
    r.run(r.until(() => d2.u > 0.99, 400, 'yusufçuk 2 karşıda'));
    r.run(r.landT(0, 200, 10), r.landT(1, 199, 10));
    iz(r, 'kaya adası');
    r.run(adim(r, 0, [[203, 12], [209, 12]], 1));
    r.run(adim(r, 1, [[204, 12], [210, 12]], 1));
    r.run(r.walkT(0, 212), r.walkT(1, 213));
    r.expectWin();
  },
  6(r) {
    const plat = r.w.e.platform;
    // alt kat: küçük gölet (tek nilüfer, birer birer)
    r.run(r.walkT(0, 12), r.walkT(1, 10));
    r.run(adim(r, 0, [[16, 39], [22, 39]], 2));
    r.run(adim(r, 1, [[17, 39], [23, 39]], 2));
    // dere: yusufçuk feribotu
    const f = plat[0];
    r.run(r.walkT(0, 30), r.walkT(1, 29));
    r.run(r.until(() => f.u < 0.01 && f.dwell > 0.45, 900, 'feribot yakında'));
    r.run(r.landT(0, 33, 38, { tol: 3 }), r.landT(1, 32, 38, { tol: 3 }));
    r.run(r.until(() => f.u > 0.99, 400, 'feribot karşıda'));
    r.run(r.landT(0, 47, 39), r.landT(1, 46, 39));
    iz(r, 'dere');
    // tepe ve A8
    r.run(adim(r, 0, [[50, 36], [56, 39]], 1), adim(r, 1, [[51, 36], [58, 39]], 1));
    r.run(r.gateOpen('q1'));
    iz(r, 'A8');
    // Şelale Tırmanışı
    r.run(r.walkT(0, 68), r.walkT(1, 69));
    r.run(cik(r, 0, 70, 72, 35), cik(r, 1, 70, 73, 35));
    r.run(cik(r, 0, 75, 78, 31), cik(r, 1, 75, 79, 31));
    // geçiş 1: 1, 0'ı taşıyıp şelalenin içinden R1'e
    r.run(r.walkT(0, 80, { tol: 2 }), r.walkT(1, 80, { tol: 2 }));
    tasi(r, 1, 89, 31, 28);
    iz(r, 'geçiş 1');
    r.run(cik(r, 0, 92, 95, 27), (function* () { yield* r.wait(20); yield* cik(r, 1, 92, 94, 27); })());
    // omuz omuza: 1 R3'e çıkar, plakaya basar → kapak açılır, sarmaşık büyür
    r.run(r.walkT(0, 96, { tol: 2 }), r.walkT(1, 94));
    omuz(r, 0, 1, 93, 20);
    r.run(r.walkT(1, 94));
    r.run(r.gateOpen('kaya'));
    const vine = r.w.e.vine[0];
    r.run(r.until(() => vine.grow >= 1, 400, 'sarmaşık'));
    for (const L of vine.leaves) r.run(r.flyTo(0, L.x + L.w / 2, L.y - 6, { land: true }));
    r.run(r.landT(0, 92, 20));
    iz(r, 'sarmaşık');
    // geçiş 2: R3'ün sol kenarından sola, L3'e
    r.run(r.walkT(0, 90, { tol: 2 }), r.walkT(1, 90, { tol: 2 }));
    tasi(r, 1, 81, 20, 16, { ayril: -16 });
    iz(r, 'geçiş 2');
    r.run(cik(r, 0, 78, 75, 16), (function* () { yield* r.wait(15); yield* cik(r, 1, 78, 76, 16); })());
    r.run(cik(r, 0, 73, 70, 12), (function* () { yield* r.wait(15); yield* cik(r, 1, 73, 71, 12); })());
    r.run(cik(r, 0, 74, 76, 8), (function* () { yield* r.wait(15); yield* cik(r, 1, 74, 77, 8); })());
    iz(r, 'tepe');
    // gizli: yüksek kaya (omuz omuza)
    r.run(r.walkT(0, 78, { tol: 2 }), r.walkT(1, 77));
    omuz(r, 0, 1, 75, 2);
    r.run(r.landT(1, 77, 8));
    // F12: şelalenin tepesinde
    r.run(r.walkT(0, 79), r.walkT(1, 81));
    r.run(r.gateOpen('q2'));
    // nehir: tek nilüferlerde birer birer, çift nilüferde birlikte
    r.run(r.walkT(0, 82, { tol: 2 }), r.walkT(1, 81));
    r.run(konT(r, 0, 86, 7));
    r.run(konT(r, 0, 89, 7), (function* () { yield* r.until(() => r.cx(0) > 87.5 * T, 300); yield* konT(r, 1, 85, 7); })());
    r.run(konT(r, 0, 95, 7), konT(r, 1, 94, 7));
    r.run(r.landT(0, 108, 8), r.landT(1, 107, 8));
    r.run(r.walkT(0, 113), r.walkT(1, 114));
    r.expectWin();
  },
};
