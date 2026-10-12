// Arayüz ekranları görsel testi (Chrome): duraklatma, ayarlar, bölüm sonu, mevsim kartı, slotlar, isim doğrulama, bölüm seçimi, ölüm.
const path = require('path');
const { launch, fileUrl, sleep } = require('./tarayici.js');
const OUT = path.join(__dirname, 'cikti');
(async () => {
  const B = await launch();
  let p = await B.open(fileUrl('index.html', '?level=2&scene=0&p1=Zeynep&p2=Kaan'), { wait: 1500 });
  const shot = (n) => p.shot(path.join(OUT, 'ui_' + n + '.png'));
  const log = [];
  // ölüm: bir arıyı dikene ışınla
  await p.eval(`(() => { const w = BB.Game.Play.world; const b = w.bees[0]; b.x = 8 * 16; b.y = 0; w.kill(b, 'thorn'); })()`);
  await sleep(250); await shot('olum');
  await sleep(1500);
  // duraklatma + ayarlar
  await p.press('Escape', 40); await sleep(400); await shot('duraklat');
  for (let i = 0; i < 3; i++) { await p.press('ArrowDown', 30); await sleep(80); }
  await p.press('Enter', 40); await sleep(300); await shot('ayarlar');
  await p.press('Escape', 40); await sleep(200); await p.press('Escape', 40); await sleep(300);
  // bölüm sonu
  await p.eval(`(() => { const P = BB.Game.Play, w = P.world; w.state = 'won'; w.stateT = 1; w.stats.time = 312; w.stats.pollen = 17; w.stats.secret = true; P.endLevel(); })()`);
  await sleep(1200); await shot('bolum_sonu');
  // mevsim kartı
  await p.eval(`BB.Game.go(BB.UI.WorldCard, { world: 1, then: () => BB.Game.go(BB.UI.Menu) })`);
  await sleep(1300); await shot('mevsim_karti');
  await p.eval(`BB.Game.go(BB.UI.WorldCard, { world: 4, then: () => BB.Game.go(BB.UI.Menu) })`);
  await sleep(1300); await shot('mevsim_karti_kis');
  // kayıtlı slotlar
  p = await B.open(fileUrl('index.html'), { wait: 1200 });
  await p.eval(`(() => { const S = BB.Save; S.create(1, ['Zeynep', 'Kaan'], ['disi', 'erkek']); S.cur.current.level = 7; S.cur.unlocked = 8; S.cur.playTime = 5000; for (const id of ['S24','S25','S38','S35','A3','A2']) S.cur.answers[id] = { a: 0, b: 1 }; S.flush(); S.create(3, ['Işıl', 'Ömer'], ['erkek', 'disi']); S.cur.finished = true; S.cur.current.level = 17; S.cur.unlocked = 18; S.flush(); })()`);
  await p.press('Space', 40); await sleep(400); await shot('menu_kayitli');
  await p.press('Enter', 40); await sleep(400); await shot('slotlar');
  await p.press('Escape', 40); await sleep(200);
  // bölüm seçimi
  await p.eval('BB.Save.use(1, BB.Save.load(1)); BB.Game.go(BB.UI.Levels)'); await sleep(500); await shot('bolum_secimi');
  // isim doğrulama
  await p.eval(`BB.Game.go(BB.UI.Names, { slot: 2 })`); await sleep(300);
  await p.press('Enter', 40); await sleep(300); await shot('isim_bos');
  await p.typeKeys('Çok uzun bir isim'); await sleep(300); await shot('isim_uzun');
  log.push('isim alanı: ' + await p.eval('JSON.stringify(BB.UI.Names.vals) + " hata: " + BB.UI.Names.err'));
  // yedek ekranı
  await p.eval(`BB.Game.go(BB.UI.Slots, { mode: 'backup' })`); await sleep(400); await shot('yedek');
  console.log(log.join('\n'));
  const errs = p.errors();
  console.log(errs.length ? errs.map((e) => `[${e.level}] ${e.text}`).join('\n') : 'konsol temiz');
  await B.close();
})().catch((e) => { console.error('HATA', e.message); process.exit(1); });
