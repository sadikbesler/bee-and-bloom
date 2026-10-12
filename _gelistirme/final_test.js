// Final uçtan uca testi (tarayıcıda): final sahnesi → Anı Defteri → Anı Kartı (PNG) → jenerik → son menü.
// Ekran görüntüleri ve üretilen PNG'ler: _gelistirme/cikti/final_*.png, ani_karti.png, tum_cevaplar.png
const path = require('path');
const fs = require('fs');
const { launch, fileUrl, sleep } = require('./tarayici.js');
const OUT = path.join(__dirname, 'cikti');
(async () => {
  const B = await launch();
  const p = await B.open(fileUrl('index.html', '?final=1&p1=İlkin&p2=Çağrı'), { wait: 1200 });
  const shot = (n) => p.shot(path.join(OUT, 'final_' + n + '.png'));
  const scr = () => p.eval(`(() => { const g = BB.Game, F = BB.Final; return g.screen === F.Scene ? 'sahne:' + F.Scene.phase : g.screen === F.Notebook ? 'defter' : g.screen === F.CardScreen ? 'kart' : g.screen === F.Credits ? 'jenerik' : g.screen === F.EndMenu ? 'sonmenu' : g.screen === BB.UI.Menu ? 'anamenu' : '?'; })()`);
  // sahne boyunca: konuşma varsa ilerlet, yoksa bekle
  const shots = { orbs: false, burst: false, bloom: false, title: false };
  for (let i = 0; i < 400; i++) {
    const s = await scr();
    if (!s.startsWith('sahne')) break;
    const ph = s.split(':')[1];
    if (ph === 'orbs' && !shots.orbs) { await sleep(2500); await shot('2_kureler'); shots.orbs = true; }
    if (ph === 'burst' && !shots.burst) { await sleep(1200); await shot('3_kavanoz'); shots.burst = true; }
    if (ph === 'bloom' && !shots.bloom) { await sleep(2600); await shot('4_vadi'); shots.bloom = true; }
    if (ph === 'title' && !shots.title) { await sleep(1500); await shot('5_baslik'); shots.title = true; }
    const talking = await p.eval('BB.Story.active');
    if (talking) await p.press('Enter', 30);
    else if (ph === 'title') await p.press('Enter', 30);
    await sleep(250);
  }
  await sleep(600); await shot('6_defter_kapak');
  await p.press('ArrowRight', 40); await sleep(150); await shot('7b_defter_cevirme'); await sleep(500); await shot('7_defter_s2');
  for (let i = 0; i < 30; i++) {
    const st = await p.eval('[BB.Final.Notebook.spread, BB.Final.Notebook.nSpreads, BB.Final.Notebook.flip]');
    if (st[0] >= st[1] - 1 && st[2] === 0) break;
    await p.press('ArrowRight', 40); await sleep(450);
  }
  await shot('8_defter_son');
  await p.press('Enter', 40); await sleep(800);
  if (await scr() !== 'kart') throw new Error('kart ekranına geçilmedi: ' + await scr());
  await sleep(2500); await shot('9_kart_ekran');
  const data = await p.eval(`(() => { const c = BB.Card.upscale(BB.Final.lastCard, 4); return c.width + 'x' + c.height + '|' + c.toDataURL('image/png'); })()`);
  const [size, url] = data.split('|');
  fs.writeFileSync(path.join(OUT, 'ani_karti.png'), Buffer.from(url.split(',')[1], 'base64'));
  const all = await p.eval(`(() => { const c = BB.Card.upscale(BB.Card.renderAll(BB.Save.cur), 2); return c.toDataURL('image/png'); })()`);
  fs.writeFileSync(path.join(OUT, 'tum_cevaplar.png'), Buffer.from(all.split(',')[1], 'base64'));
  console.log('Anı Kartı PNG:', size);
  // indirme düğmesi gerçekten çalışıyor mu (hata yok)
  await p.press('Enter', 40); await sleep(800);
  console.log('indirme mesajı:', await p.eval('BB.Final.CardScreen.msg'));
  await p.press('Space', 40); await sleep(5000); await shot('10_jenerik');
  for (let i = 0; i < 60 && (await scr()) === 'jenerik'; i++) { await p.key('Space', 'down'); await sleep(500); }
  await p.key('Space', 'up');
  await p.press('Enter', 40); await sleep(800);
  console.log('son ekran:', await scr());
  await shot('11_sonmenu');
  const errs = p.errors();
  console.log(errs.length ? errs.map((e) => `[${e.level}] ${e.text}`).join('\n') : 'konsol temiz');
  await B.close();
})().catch((e) => { console.error('HATA', e.message); process.exit(1); });
