// Tarayıcıda gerçek tuşlarla kısa bir oynanış: yürü, uç, taşı; ekran görüntüleri al.
// Kullanım: node _gelistirme/oyna_test.js [sorgu]
const path = require('path');
const { launch, fileUrl, sleep } = require('./tarayici.js');
const OUT = path.join(__dirname, 'cikti');

(async () => {
  const q = process.argv[2] || '?kum=1';
  const B = await launch();
  const p = await B.open(fileUrl('index.html', q), { wait: 1500 });
  const st = () => p.eval(`(() => { const w = BB.Game.Play.world; return w.bees.map(b => ({x: Math.round(b.x), y: Math.round(b.y), e: +b.energy.toFixed(2), g: b.onGround, c: !!b.carrying})); })()`);
  // 1) ikisi de sağa yürüsün
  await p.key('KeyD', 'down'); await p.key('ArrowRight', 'down');
  await sleep(900);
  await p.key('KeyD', 'up'); await p.key('ArrowRight', 'up');
  console.log('yürüdükten sonra', JSON.stringify(await st()));
  // 2) 1. oyuncu uçsun (W basılı)
  await p.key('KeyW', 'down'); await p.key('KeyD', 'down');
  await sleep(450);
  await p.shot(path.join(OUT, 'oyna_ucus.png'));
  await sleep(500);
  await p.key('KeyD', 'up');
  console.log('uçarken', JSON.stringify(await st()));
  await sleep(700);
  await p.key('KeyW', 'up');
  await sleep(1200);
  console.log('indikten sonra', JSON.stringify(await st()));
  // 3) 2. oyuncu 1.'ye yaklaşsın ve onu taşısın
  const s = await st();
  const dir = s[0].x > s[1].x ? 'ArrowRight' : 'ArrowLeft';
  await p.key(dir, 'down');
  for (let i = 0; i < 40; i++) { const t = await st(); if (Math.abs(t[0].x - t[1].x) < 6) break; await sleep(50); }
  await p.key(dir, 'up');
  await sleep(150);
  await p.press('ArrowDown', 80);
  await sleep(200);
  console.log('taşıma', JSON.stringify(await st()));
  await p.key('ArrowUp', 'down');
  await sleep(500);
  await p.shot(path.join(OUT, 'oyna_tasima.png'));
  await sleep(600);
  await p.key('ArrowUp', 'up');
  await sleep(1500);
  console.log('son', JSON.stringify(await st()));
  const perf = await p.eval(`(() => { const a = BB.Game.frameMs.slice().sort((x,y)=>x-y), b = BB.Game.stepMs.slice().sort((x,y)=>x-y); return { frameMedian: a[a.length>>1], frame95: a[Math.floor(a.length*0.95)], stepMedian: b[b.length>>1] }; })()`);
  console.log('perf ms', JSON.stringify(perf));
  const errs = p.errors();
  console.log(errs.length ? errs.map((e) => `[${e.level}] ${e.text}`).join('\n') : 'konsol temiz');
  await B.close();
})().catch((e) => { console.error('HATA', e); process.exit(1); });
