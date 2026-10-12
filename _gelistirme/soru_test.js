// Soru akışı görsel testi (Chrome, gerçek tuşlar): diyalog kutusu + gizli (G), kim (K), tahmin (T) ve açık (A) sorular.
// Ekran görüntüleri: _gelistirme/cikti/soru_*.png
const fs = require('fs');
const path = require('path');
const { launch, fileUrl, sleep } = require('./tarayici.js');
const OUT = path.join(__dirname, 'cikti');

(async () => {
  const B = await launch();
  let p = await B.open(fileUrl('index.html', '?level=1&p1=Gülşen&p2=Ömer'), { wait: 2600 });
  const shot = (n) => p.shot(path.join(OUT, 'soru_' + n + '.png'));
  const phase = () => p.eval('BB.QFlow.active ? BB.QFlow.phase : (BB.Story.active ? "diyalog" : "yok")');
  const log = [];
  await shot('0_diyalog');                                   // Kraliçe'nin açılış konuşması
  for (let i = 0; i < 30 && (await p.eval('BB.Story.active')); i++) { await p.press('Enter', 30); await sleep(120); }

  async function runQuestion(qid, keysP1, keysP2, tag) {
    await p.eval(`BB.QFlow.start(BB.Game.Play, { type: 'question', qi: 0, qid: '${qid}' })`);
    await sleep(900); await shot(tag + '_1_soru');
    for (let i = 0; i < 20 && (await p.eval('BB.Story.active')); i++) { await p.press('Enter', 30); await sleep(150); }
    await sleep(300); await shot(tag + '_2_uyari');
    await p.press('Enter', 30); await sleep(500); await shot(tag + '_3_secim1');
    await p.press(keysP1, 30); await sleep(200); await shot(tag + '_4_secildi');
    await p.press(keysP1, 30); await sleep(1100);
    await shot(tag + '_5_uyari2');
    await p.press('Enter', 30); await sleep(500); await shot(tag + '_6_secim2');
    await p.press(keysP2, 30); await sleep(150); await p.press(keysP2, 30); await sleep(1100);
    await sleep(1200); await shot(tag + '_7_acilis');
    await p.press('Enter', 30); await sleep(700); await shot(tag + '_8_tepki');
    for (let i = 0; i < 20 && (await p.eval('BB.Story.active')); i++) { await p.press('Enter', 30); await sleep(150); }
    await sleep(1300);
    const rec = await p.eval(`JSON.stringify(BB.Save.cur.answers['${qid}'] || null)`);
    log.push(`${qid}: kayıt ${rec}, faz ${await phase()}, damla ${await p.eval('BB.Game.Play.drops')}`);
  }
  await runQuestion('S35', 'KeyE', 'KeyO', 'G');            // gizli: 1. oyuncu E (3. seçenek), 2. oyuncu O (3. seçenek) → aynı
  await runQuestion('A2', 'KeyW', 'KeyU', 'K');             // kim: 1. oyuncu W (Ömer), 2. oyuncu U (Gülşen) → birbirini
  await runQuestion('A8', 'KeyQ', 'KeyI', 'T');             // tahmin: konu 1. oyuncu Q, tahmin I → ıska

  // açık soru: L1 kaydıyla çiçeklere uçarak (gerçek QFlow)
  const rec = JSON.parse(fs.readFileSync(path.join(OUT, 'kayit', 'L1.json'), 'utf8')).rec;
  p = await B.open(fileUrl('index.html', '?level=1&scene=0'), { wait: 1500 });
  await p.eval(`(() => { const T = window.__rec = { rec: ${JSON.stringify(rec)}, i: 0 }; const o = BB.Input.player; BB.Input.player = (k) => { const v = T.rec[T.i] ? T.rec[T.i][k] : 0; if (k === 1) T.i++; return { left: !!(v & 1), right: !!(v & 2), flap: !!(v & 4), flapPressed: !!(v & 8), action: !!(v & 16), actionPressed: !!(v & 32) }; }; })()`);
  let gotIntro = false;
  for (let i = 0; i < 200; i++) {
    const ph = await phase();
    if (await p.eval('BB.Story.active')) { if (!gotIntro) { await sleep(900); await p.shot(path.join(OUT, 'soru_A_0_giris.png')); gotIntro = true; } await p.press('Enter', 30); }
    if (ph === 'open') { await sleep(1000); await p.shot(path.join(OUT, 'soru_A_1_cicekler.png')); break; }
    await sleep(150);
  }
  for (let i = 0; i < 120; i++) { const ph = await phase(); if (ph === 'reveal') { await sleep(1500); await p.shot(path.join(OUT, 'soru_A_2_acilis.png')); break; } await sleep(150); }
  for (let i = 0; i < 60; i++) { if (await p.eval('BB.Story.active')) await p.press('Enter', 30); else if ((await phase()) === 'reveal') await p.press('Enter', 30); if (!(await p.eval('BB.QFlow.active'))) break; await sleep(200); }
  log.push('S24: kayıt ' + await p.eval(`JSON.stringify(BB.Save.cur.answers.S24 || null)`));
  console.log(log.join('\n'));
  const errs = p.errors();
  console.log(errs.length ? errs.map((e) => `[${e.level}] ${e.text}`).join('\n') : 'konsol temiz');
  await B.close();
})().catch((e) => { console.error('HATA', e.message); process.exit(1); });
