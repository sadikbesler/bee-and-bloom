// Bölümün tamamını gerçek karolar ve nesne işaretleriyle PNG'ye çizer (tasarımı gözle incelemek için).
// Kullanım: node _gelistirme/bolum_onizleme.js <bölümNo> [ölçek]
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { writePNG } = require('./png.js');
const PROJ = path.resolve(__dirname, '..');
const { dataFiles } = require('./sim.js');

const ctx = { console, Math, Object, Array, Uint8Array, Uint8ClampedArray, Float32Array, Error, JSON, Set, Map, String, Number, Date, RegExp, parseInt, isFinite };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/core.js', 'js/physics.js', 'js/entities.js', 'js/level.js', 'js/art.js', 'js/font.js', 'js/sprites.js', 'js/characters.js', 'js/themes.js', 'js/questions.js'].concat(dataFiles())) {
  vm.runInContext(fs.readFileSync(path.join(PROJ, f), 'utf8'), ctx, { filename: f });
}
const BB = ctx.BB;

function render(id, scale) {
  const def = BB.LEVELS.find((l) => l.id === id);
  if (!def) throw new Error('bölüm yok: ' + id);
  const w = new BB.World(def);
  const theme = def.theme || 'bahar';
  const W = w.cols * 16, H = w.rows * 16;
  const pc = new BB.Art.PixelCanvas(W, H + 14);
  const bg = BB.Tiles.makeBackground(theme);
  for (let x = 0; x < W; x += 480) for (const L of bg) pc.blit(L.pc, x, H - 270);
  const t = BB.Tiles.renderTiles(w, theme);
  pc.blit(t.back, 0, 0); pc.blit(t.front, 0, 0);
  const book = BB.Sprites.build();
  const spr = (name, fr, x, y, flip) => { const s = book.get(name); if (s) pc.blit(s.frames[fr % s.frames.length], Math.round(x), Math.round(y), flip); };
  // su
  for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) if (w.tileAt(c, r) === BB.T.WATER) pc.rect(c * 16, r * 16 + 3, 16, 13, BB.THEMES[theme].water);
  for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) if (w.tileAt(c, r) === BB.T.WEB) { pc.line(c * 16, r * 16, c * 16 + 15, r * 16 + 15, '#ffffff'); pc.line(c * 16 + 15, r * 16, c * 16, r * 16 + 15, '#ffffff'); }
  const box = (x, y, ww, hh, col) => { pc.hline(x, x + ww - 1, y, col); pc.hline(x, x + ww - 1, y + hh - 1, col); pc.vline(x, y, y + hh - 1, col); pc.vline(x + ww - 1, y, y + hh - 1, col); };
  const label = (s, x, y, col) => BB.Font.drawPx(pc, s, x, y, col || '#ffffff');
  for (const g of w.e.gate) { pc.rect(g.x, g.y, g.w, g.h, g.coop ? '#ff9f2a' : '#a06030'); label(String(g.on), g.x + 2, g.y + 2, '#000'); }
  for (const p of w.e.platform) { pc.rect(p.ax, p.ay, p.w, 5, '#5cc27a'); pc.line(p.ax + p.w / 2, p.ay, p.bx + p.w / 2, p.by, '#ffffff'); pc.rect(p.bx, p.by, p.w, 2, '#ffffff'); }
  for (const l of w.e.lily) pc.rect(l.x, l.y, l.w, 4, l.mode === 'pair' ? '#ff9ad5' : '#5cc27a');
  for (const z of w.e.wind) box(z.x, z.y, z.w, z.h, z.cold ? '#bfe8ff' : '#ffffff');
  for (const p of w.e.pulse) pc.rect(p.x, p.y, p.w, 5, '#7fe0ff');
  for (const b of w.e.bridge) pc.rect(b.x, b.y, b.w, 4, '#b0ff7f');
  for (const c of w.e.crumble) pc.rect(c.x, c.y, c.w, 16, '#b8e8ff');
  for (const b of w.e.bounce) spr('mushroom', 0, b.x, b.y);
  for (const p of w.e.plate) { spr('plate', 0, p.x, p.y + 10); label(p.id + (p.timer ? '⏱' : ''), p.x, p.y - 2, '#ffff00'); }
  for (const f of w.e.flower) { spr('holdflower', 0, f.x, f.y); label(f.id, f.x, f.y - 10, '#ffff00'); }
  for (const p of w.e.pot) { spr('pot', 0, p.x, p.y); label(p.id, p.x, p.y - 10, '#ffff00'); }
  for (const v of w.e.vine) pc.vline(v.x + 8, v.y + 16 - v.h * 16, v.y + 16, '#4f9a3f');
  for (const it of w.items) spr('item_' + it.kind, 0, it.x, it.y);
  for (const r of w.e.rune) spr('rune_' + r.sym, 0, r.x, r.y);
  for (const s of w.e.sign) spr('sign', 0, s.x, s.y);
  for (const n of w.e.npc) { const nm = 'npc_' + n.who; const s = book.get(nm); if (s) spr(nm, 0, n.x - s.w / 2, n.y - s.h, n.face < 0); }
  for (const b of w.e.bora) spr('npc_bora_frozen', 0, b.x - 16, b.y - 24);
  for (const c of w.checks) spr('honeyflower', 3, c.x, c.y - 8);
  for (const q of w.questions) { spr('pedestal', 0, q.x, q.y - 6); box(q.zone.x, q.zone.y, q.zone.w, q.zone.h, '#ffb32c'); label('Q' + (q.qi + 1) + ' ' + q.qid, q.x - 10, q.y - 40, '#ffff00'); }
  for (const ch of w.e.choice) spr('choice' + ch.opt, 1, ch.x, ch.y);
  for (const p of w.pollen) spr('pollen', 0, p.x, p.y);
  for (const s of w.secrets) spr('rare', 0, s.x - 1, s.y - 1);
  for (const n of w.nectars) spr('nectar', 0, n.x - 3, n.y - 3);
  for (const f of w.e.fire) spr('brazier', 0, f.x - 8, f.y - 10);
  for (const i of w.e.icicle) spr('icicle', 0, i.x, i.y);
  for (const s of w.e.spider) { pc.vline(s.x, s.y0, s.y0 + s.len, '#ffffff'); spr('spider', 0, s.x - 6, s.y0 + s.len); }
  for (const d of w.e.drip) pc.rect(d.x - 1, d.y0, 3, 4, '#7fc8f0');
  for (const t2 of w.e.trigger) { box(t2.x, t2.y, t2.w, t2.h, '#ff4fd8'); label(t2.scene, t2.x + 2, t2.y + 2, '#ff4fd8'); }
  for (const c of w.e.collapse) { box(c.trig.x, c.trig.y, c.trig.w, c.trig.h, '#ff0000'); label('ÇÖKÜŞ', c.trig.x + 2, c.trig.y + 2, '#ff0000'); }
  for (const r of w.e.race) { box(r.start.x, r.start.y, r.start.w, r.start.h, '#00ff00'); pc.vline(r.finish, 0, H - 1, '#00ff00'); for (let k = 0; k + 1 < r.path.length; k++) pc.line(r.path[k][0], r.path[k][1], r.path[k + 1][0], r.path[k + 1][1], '#00ff00'); }
  spr('hivedoor', 0, w.exit.x, w.exit.y - 16);
  w.bees.forEach((b, i) => spr((i ? 'erkek' : 'disi') + '_idle', 0, b.x - 3, b.y - 4));
  // sütun cetveli
  for (let c = 0; c < w.cols; c += 10) { pc.vline(c * 16, H, H + 13, '#ffffff'); label(String(c), c * 16 + 2, H + 1, '#ffffff'); }
  const out = path.join(__dirname, 'cikti', `bolum_${id}.png`);
  writePNG(out, pc.w, pc.h, pc.data, scale || 1, [20, 20, 30, 255]);
  return out;
}

if (require.main === module) {
  const id = parseInt(process.argv[2] || '1', 10);
  const s = parseInt(process.argv[3] || '1', 10);
  console.log('yazıldı:', render(id, s));
}
module.exports = { render };
