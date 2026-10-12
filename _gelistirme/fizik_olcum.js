// Fizik ölçümleri: zıplama/uçuş yüksekliği, süzülme menzili, taşıma ve omuz (üst üste) yükseklikleri.
// Kullanım: node _gelistirme/fizik_olcum.js
const { loadBB, mkIn } = require('./sim.js');
const BB = loadBB({ noData: true });
const T = BB.TILE;

function flatMap(cols, rows) {
  const m = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      if (r >= rows - 2) row += '#';
      else if (c === 0 || c === cols - 1) row += '#';
      else row += '.';
    }
    m.push(row);
  }
  const put = (c, r, ch) => { m[r] = m[r].slice(0, c) + ch + m[r].slice(c + 1); };
  put(4, rows - 3, '1'); put(6, rows - 3, '2'); put(10, rows - 3, 'C'); put(cols - 4, rows - 3, 'E');
  return m;
}

function world(cols, rows, extra) {
  const def = Object.assign({ id: 0, name: 'olcum', theme: 'bahar', map: flatMap(cols || 120, rows || 40), objects: [], questions: [], coop: ['test'] }, extra || {});
  const w = new BB.World(def, { noLeash: true });
  return w;
}

function run(w, frames, inpFn) {
  for (let f = 0; f < frames; f++) {
    const ins = inpFn(f);
    w.step(ins);
    w.events.length = 0;
  }
}

const fmt = (px) => `${px.toFixed(1)} px (${(px / T).toFixed(2)} karo)`;

// 1) dokunuş zıplaması
{
  const w = world(); const b = w.bees[0]; const y0 = b.y; let minY = y0;
  run(w, 90, (f) => { const i = [mkIn(), mkIn()]; i[0].flap = f < 2; i[0].flapPressed = f === 0; minY = Math.min(minY, b.y); return i; });
  console.log('Dokunuş zıplaması      :', fmt(y0 - minY));
}
// 2) tam zıplama, enerji yok (yalnız impuls)
{
  const w = world(); const b = w.bees[0]; b.energy = 0; const y0 = b.y; let minY = y0;
  run(w, 2, () => [mkIn(), mkIn()]); b.energy = 0;
  run(w, 120, (f) => { const i = [mkIn(), mkIn()]; i[0].flap = true; i[0].flapPressed = f === 0; if (b.onGround === false) b.energy = 0; minY = Math.min(minY, b.y); return i; });
  console.log('Tam zıplama (enerjisiz):', fmt(y0 - minY));
}
// 3) tam uçuş (enerji dolu)
let peakFrames = 0;
{
  const w = world(); const b = w.bees[0]; const y0 = b.y; let minY = y0;
  run(w, 200, (f) => { const i = [mkIn(), mkIn()]; i[0].flap = true; i[0].flapPressed = f === 0; if (b.y < minY) { minY = b.y; peakFrames = f; } return i; });
  console.log('Tek arı en yüksek      :', fmt(y0 - minY), `(${peakFrames} karede)`);
}
// 4) en uzun yatay menzil (aynı seviyeye iniş)
{
  const w = world(200, 40); const b = w.bees[0]; const x0 = b.x;
  let landed = false, f = 0;
  while (!landed && f < 1200) {
    const i = [mkIn(), mkIn()]; i[0].flap = true; i[0].flapPressed = f === 0; i[0].right = true;
    w.step(i); w.events.length = 0; f++;
    if (f > 5 && b.onGround) landed = true;
  }
  console.log('Tek arı yatay menzil   :', fmt(b.x - x0), `(${(f / 60).toFixed(2)} sn)`);
}
// 5) yürüme hızı
{
  const w = world(); const b = w.bees[0]; const x0 = b.x;
  run(w, 60, () => { const i = [mkIn(), mkIn()]; i[0].right = true; return i; });
  console.log('Yürüme (1 sn)          :', fmt(b.x - x0));
}
// 6) düşme hızları
{
  const w = world(); const b = w.bees[0]; b.y -= 300; b.onGround = false;
  run(w, 50, () => [mkIn(), mkIn()]);
  console.log('Bırakınca düşme hızı   :', b.vy.toFixed(1), 'px/sn');
  const w2 = world(); const b2 = w2.bees[0]; b2.y -= 300; b2.onGround = false; b2.energy = 0;
  run(w2, 50, () => { const i = [mkIn(), mkIn()]; i[0].flap = true; return i; });
  console.log('Süzülme düşme hızı     :', b2.vy.toFixed(1), 'px/sn');
}
// 7) taşıma: A, B'yi taşıyıp uçar
{
  const w = world(); const a = w.bees[0], b = w.bees[1];
  b.x = a.x + 4; run(w, 5, () => [mkIn(), mkIn()]);
  run(w, 1, () => { const i = [mkIn(), mkIn()]; i[0].action = true; i[0].actionPressed = true; return i; });
  if (!a.carrying) console.log('TAŞIMA BAŞARISIZ');
  const y0 = b.y; let minY = y0;
  run(w, 240, (f) => { const i = [mkIn(), mkIn()]; i[0].flap = true; i[0].flapPressed = f === 0; minY = Math.min(minY, b.y); return i; });
  console.log('Taşıma ile en yüksek   :', fmt(y0 - minY), '(taşınanın ayağı)');
}
// 8) taşı + tepede yukarı fırlat
{
  const w = world(); const a = w.bees[0], b = w.bees[1];
  b.x = a.x + 4; run(w, 5, () => [mkIn(), mkIn()]);
  run(w, 1, () => { const i = [mkIn(), mkIn()]; i[0].action = true; i[0].actionPressed = true; return i; });
  const y0 = b.y + b.h; let minY = 1e9, thrown = false;
  run(w, 300, (f) => {
    const i = [mkIn(), mkIn()];
    if (!thrown) { i[0].flap = true; i[0].flapPressed = f === 0; if (a.energy + b.energy <= 0.001 && a.vy >= -5) { i[0].action = true; i[0].actionPressed = true; thrown = true; } }
    else { i[1].flap = true; i[1].flapPressed = false; }
    if (thrown) minY = Math.min(minY, b.y + b.h);
    return i;
  });
  console.log('Taşı + fırlat (B ayak) :', fmt(y0 - minY));
}
// 9) omuz: B, A'nın başında; A uçar, enerjisi bitince B atlar
{
  const w = world(); const a = w.bees[0], b = w.bees[1];
  b.x = a.x; b.y = a.y - 30; b.onGround = false; run(w, 40, () => [mkIn(), mkIn()]);
  const onHead = b.onGround && b.groundKind === 'partner';
  const y0 = a.y + a.h; let minY = 1e9, jumped = false, f0 = 0;
  run(w, 400, (f) => {
    const i = [mkIn(), mkIn()];
    if (!jumped) { i[0].flap = true; i[0].flapPressed = f === 0; if (f > 10 && a.energy <= 0.001 && a.vy >= -2) { jumped = true; f0 = f; i[1].flap = true; i[1].flapPressed = true; } }
    else { i[1].flap = true; }
    minY = Math.min(minY, b.y + b.h);
    return i;
  });
  console.log('Omuzda (B başta mı:', onHead, ') B ayak en yüksek:', fmt(y0 - minY));
}
// 10) zıplama mantarı
{
  const map = flatMap(60, 40); map[37] = map[37].slice(0, 20) + 'M' + map[37].slice(21);
  const w = new BB.World({ id: 0, name: 'm', theme: 'bahar', map, objects: [], questions: [], coop: ['t'] }, { noLeash: true });
  const b = w.bees[0]; b.x = 20 * T + 3; b.y = 30 * T; b.onGround = false;
  let minY = 1e9, bounced = false;
  run(w, 200, () => { const i = [mkIn(), mkIn()]; return i; });
  for (let f = 0; f < 200; f++) { w.step([mkIn(), mkIn()]); for (const e of w.events) if (e.type === 'bounce') bounced = true; w.events.length = 0; if (bounced) minY = Math.min(minY, b.y + b.h); }
  console.log('Mantar sekmesi         :', bounced ? fmt(37 * T + 8 - minY) : 'sekmedi');
}
