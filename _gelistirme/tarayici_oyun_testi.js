// Tarayıcıda uçtan uca oyun testi:
//  1) Menüden yeni oyun (gerçek tuşlar, Türkçe isimler), arı seçimi, tuşlar ekranı
//  2) Bölümleri Node çözüm kayıtlarıyla (cikti/kayit/L*.json) gerçek oyun döngüsünde oynatır; sahneler anında geçilir, sorular otomatik
//  3) Her bölümden ekran görüntüsü, ölüm sayısı, kare süresi, konsol hataları
//  4) "Sekmeyi kapat-aç → Devam" ile kaldığı yerden sürme
// Kullanım: node _gelistirme/tarayici_oyun_testi.js [bölümNo ...]   (önce: node _gelistirme/solve.js)
const fs = require('fs');
const path = require('path');
const { launch, fileUrl, sleep } = require('./tarayici.js');
const OUT = path.join(__dirname, 'cikti');
const REC = path.join(OUT, 'kayit');

const HOOK = `(function () {
  const BB = window.BB;
  if (BB.Test) return;
  const T = BB.Test = { recs: {}, rec: null, i: 0, qn: 0, deaths: 0, levelsDone: [] };
  BB.Game.speed = 4;
  const origPlayer = BB.Input.player;
  BB.Input.player = function (k) {
    if (!T.rec) return origPlayer(k);
    const v = T.rec[T.i] ? T.rec[T.i][k] : 0;
    if (k === 1) T.i++;
    return { left: !!(v & 1), right: !!(v & 2), flap: !!(v & 4), flapPressed: !!(v & 8), action: !!(v & 16), actionPressed: !!(v & 32) };
  };
  BB.Story.start = function (id, world, cb) { if (cb) cb(); return true; };
  BB.QFlow.start = function (play, p) {
    const w = play.world;
    if (p.type === 'question') {
      const q = BB.Q.get(p.qid);
      if (q.type === 'A') { w.resolvePending(); w.startOpen(p.qi); return; }
      const n = BB.Q.nOpts(q), c = T.qn++;
      BB.Save.setAnswer(q.id, { a: c % n, b: (c + (q.type === 'K' ? 0 : 1)) % n, type: q.type });
      w.resolvePending(); w.resolveQuestion(p.qi);
    } else if (p.type === 'openAnswer') {
      BB.Save.setAnswer(p.qid, { a: p.picks[0], b: p.picks[1], type: 'A' });
      w.resolvePending(); w.resolveQuestion(p.qi);
    }
    play.drops = Object.keys(BB.Save.cur.answers).length;
  };
  const origStart = BB.Game.startLevel;
  BB.Game.startLevel = function (idx, opt) {
    const id = BB.LEVELS[idx] && BB.LEVELS[idx].id;
    T.rec = T.recs[id] || null; T.i = 0; T.cur = id;
    return origStart.call(BB.Game, idx, opt);
  };
})();`;

(async () => {
  const want = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);
  const recs = {};
  for (const f of fs.readdirSync(REC).filter((x) => /^L\d+\.json$/.test(x))) { const j = JSON.parse(fs.readFileSync(path.join(REC, f), 'utf8')); recs[j.id] = j.rec; }
  const ids = (want.length ? want : Object.keys(recs).map(Number)).sort((a, b) => a - b);
  const B = await launch();
  const url = fileUrl('index.html');
  let p = await B.open(url, { wait: 1500 });
  const sc = (n) => p.shot(path.join(OUT, n + '.png'));
  const report = [];

  // ---- 1) menüden yeni oyun
  await p.press('Space', 40); await sleep(500);
  const menuSel = await p.eval('BB.Game.screen === BB.UI.Menu ? BB.UI.Menu.sel : -1');
  if (menuSel !== 0) { for (let k = 0; k < 6; k++) { await p.press('ArrowUp', 30); await sleep(60); } }
  await sc('t_menu');
  await p.press('Enter', 40); await sleep(400);           // Yeni Oyun → slot seçimi
  await p.press('Enter', 40); await sleep(400);           // 1. slot
  if (await p.eval('BB.Game.screen === BB.UI.Slots && !!BB.UI.Slots.confirm')) { await p.press('ArrowLeft', 30); await p.press('Enter', 40); await sleep(300); }
  await p.typeKeys('İlkin'); await sleep(200); await sc('t_isim1');
  await p.press('Enter', 40); await sleep(300);
  await p.typeKeys('Çağrı'); await sleep(200); await sc('t_isim2');
  await p.press('Enter', 40); await sleep(500);
  await sc('t_rol');
  await p.press('Enter', 40); await sleep(500);            // dişi arı = 1. oyuncu
  await sc('t_tuslar');
  const names = await p.eval('BB.Game.names.join("|")');
  report.push('isimler: ' + names + ' (beklenen İlkin|Çağrı)');
  await p.eval(HOOK);
  await p.eval('BB.Test.recs = ' + JSON.stringify(recs) + ';');
  await p.press('Enter', 40); await sleep(600);           // tuşlar ekranı → 1. bölüm (başlangıç sahnesi oynar)
  await sc('t_sahne_L1');
  // ilk bölüm, kanca kurulmadan başladıysa: sahneyi atla ve kaydı baştan bağla
  const started = await p.eval('BB.Game.screen === BB.Game.Play ? BB.Game.Play.def.id : 0');
  if (started && !(await p.eval('!!BB.Test.rec'))) {
    await p.eval(`(() => { if (BB.Story.active) BB.Story.skip(); BB.Test.rec = BB.Test.recs[${started}] || null; BB.Test.i = 0; BB.Test.cur = ${started}; })()`);
  }

  // ---- 2) bölümleri kayıtla oynat
  const t0 = Date.now();
  for (let guard = 0; guard < 4000; guard++) {
    const st = await p.eval(`(() => { const g = BB.Game, P = g.Play; const onPlay = g.screen === P; return { onPlay, id: onPlay ? P.def.id : null, i: BB.Test.i, n: BB.Test.rec ? BB.Test.rec.length : 0, state: onPlay ? P.world.state : null, overlay: onPlay && !!P.overlay, deaths: onPlay ? P.world.stats.deaths : 0, screen: g.screen === BB.UI.WorldCard ? 'kart' : g.screen === BB.Final.Scene ? 'final' : onPlay ? 'oyun' : '?' }; })()`);
    if (st.screen === 'final') { report.push('final sahnesine geçildi'); break; }
    if (st.screen === 'kart') { await sc('t_dunya_karti_' + (st.id || '')); await p.press('Enter', 40); await sleep(500); continue; }
    if (!st.onPlay) { await sleep(200); continue; }
    if (!ids.includes(st.id) || !recs[st.id]) { report.push(`bölüm ${st.id}: kayıt yok, test burada duruyor`); break; }
    const key = 'L' + st.id;
    const frac = st.n ? st.i / st.n : 0;
    for (const [k, f] of [[1, 0.3], [2, 0.6], [3, 0.9]]) if (frac >= f && !report[key + k]) { report[key + k] = true; await sc(`tarayici_L${st.id}_${k}`); }
    if (st.overlay) {
      if (report['bitti' + st.id]) { await p.press('Enter', 40); await sleep(500); continue; }
      report['bitti' + st.id] = true;
      const perf = await p.eval('(() => { const a = BB.Game.frameMs.slice().sort((x, y) => x - y), b = BB.Game.stepMs.slice().sort((x, y) => x - y); return [a[a.length >> 1], a[Math.floor(a.length * 0.95)], b[b.length >> 1]]; })()');
      report.push(`bölüm ${st.id}: BİTTİ  ölüm ${st.deaths}  kare(çizim) ort/95% ${perf[0].toFixed(2)}/${perf[1].toFixed(2)} ms  adım ${perf[2].toFixed(2)} ms`);
      await sc(`tarayici_L${st.id}_son`);
      // ---- 4) kapat-aç-devam testi: 2. bölüm başladığında bir kez
      const next = ids.find((x) => x > st.id);
      if (!next) break;
      await p.press('Enter', 40); await sleep(700);
      if (st.id === 1 && ids.includes(2)) {
        await sleep(1500);
        const before = await p.eval('JSON.stringify({ lv: BB.Save.cur.current.level, un: BB.Save.cur.unlocked, ans: Object.keys(BB.Save.cur.answers).length })');
        await p.send('Page.navigate', { url }); await sleep(1500);          // sekmeyi kapat-aç
        await p.press('Space', 40); await sleep(400);
        await p.eval('BB.UI.Menu.sel = 1'); await p.press('Enter', 40); await sleep(300);    // Devam
        await p.eval(HOOK); await p.eval('BB.Test.recs = ' + JSON.stringify(recs) + ';');
        await p.press('Enter', 40); await sleep(800);                               // 1. slot
        const after = await p.eval('JSON.stringify({ lv: BB.Save.cur.current.level, un: BB.Save.cur.unlocked, ans: Object.keys(BB.Save.cur.answers).length, id: BB.Game.Play.def && BB.Game.Play.def.id, names: BB.Game.names })');
        report.push('kapat-aç önce ' + before + ' → sonra ' + after);
        await p.eval(`(() => { if (BB.Story.active) BB.Story.skip(); BB.Test.rec = BB.Test.recs[2]; BB.Test.i = 0; })()`);
        // devam ettikten sonra bölüm 2'yi baştan kayıtla oynat (yeniden başlat)
        await p.eval('BB.Game.startLevel(1, { noScene: true })');
      }
      continue;
    }
    if (st.deaths > 0 && !report['olum' + st.id]) { report['olum' + st.id] = true; report.push(`bölüm ${st.id}: tarayıcıda ölüm oldu (kayıt sapması?) kare ${st.i}`); await sc(`tarayici_L${st.id}_olum`); }
    if (st.n && st.i >= st.n + 120 && st.state === 'play') { report.push(`bölüm ${st.id}: kayıt bitti ama bölüm bitmedi (sapma)`); await sc(`tarayici_L${st.id}_sapma`); break; }
    await sleep(250);
  }
  report.push(`süre ${((Date.now() - t0) / 1000).toFixed(0)} sn`);
  const errs = p.errors();
  for (const r of report) if (typeof r === 'string') console.log(r);
  console.log(errs.length ? errs.map((e) => `[${e.level}] ${e.text}`).join('\n') : 'konsol temiz');
  await B.close();
})().catch((e) => { console.error('HATA', e.message); process.exit(1); });
