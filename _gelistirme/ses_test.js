// Ses duman testi (Chrome): bütün efektleri ve şarkıları kısa süre çalıştırır, hata olmamalı.
const { launch, fileUrl, sleep } = require('./tarayici.js');
(async () => {
  const B = await launch();
  const p = await B.open(fileUrl('index.html'), { wait: 1200 });
  await p.press('Space', 40); await sleep(300);
  const state = await p.eval('BB.Audio.ready ? "hazır" : "hazır değil"');
  const names = ['flap','jump','land','bounce','pollen','secret','nectar','checkpoint','plate','gate','flower','pickup','drop','carry','release','call','stuck','free','webBreak','death','respawn','splash','crack','crumble','shatter','icicleShake','bloom','rune','seqDone','drop_honey','match','diff','select','move','back','pick','blip','win','raceGo','tick','warm','celebrate','page','shutter','tired','lilySink','pulse','bridgeOn','timerEnd','strain','grab','talk','collapse'];
  for (const n of names) { await p.eval(`BB.Audio.sfx('${n}', { id: 0, n: 3, ok: true, on: true, opening: true, thrown: true })`); await sleep(40); }
  const songs = await p.eval('BB.SONGS_LIST');
  for (const s of songs) { await p.eval(`BB.Audio.play('${s}')`); await sleep(700); }
  await p.eval('BB.Audio.setIntensity(1)'); await sleep(500); await p.eval('BB.Audio.stopMusic()');
  for (const v of ['kralice','puntur','zipzip','hu','isil','bora','anlatici']) await p.eval(`BB.Audio.blip('${v}')`);
  console.log('ses:', state, '·', names.length, 'efekt ·', songs.length, 'şarkı:', songs.join(', '));
  const errs = p.errors();
  console.log(errs.length ? errs.map((e) => `[${e.level}] ${e.text}`).join('\n') : 'konsol temiz');
  await B.close();
})().catch((e) => { console.error('HATA', e.message); process.exit(1); });
