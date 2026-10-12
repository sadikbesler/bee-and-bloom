// Sprite/yazı tipi önizlemesi: kodla üretilen grafikleri PNG olarak kaydeder (gözle incelemek için).
// Kullanım: node _gelistirme/onizleme.js [font|sprites|all] [ölçek]
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { writePNG } = require('./png.js');
const PROJ = path.resolve(__dirname, '..');

function loadArt() {
  const ctx = { console, Math, Object, Array, Uint8Array, Uint8ClampedArray, Float32Array, Error, JSON, Set, Map, String, Number, parseInt };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ['js/core.js', 'js/physics.js', 'js/entities.js', 'js/level.js', 'js/art.js', 'js/font.js', 'js/sprites.js', 'js/characters.js', 'js/themes.js']) {
    const p = path.join(PROJ, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
  }
  return ctx.BB;
}

const BB = loadArt();
const mode = process.argv[2] || 'all';
const scale = parseInt(process.argv[3] || '4', 10);
const out = path.join(__dirname, 'cikti');
fs.mkdirSync(out, { recursive: true });

if (mode === 'font' || mode === 'all') {
  const pc = new BB.Art.PixelCanvas(300, 120);
  pc.rect(0, 0, 300, 120, '#fff4dc');
  const lines = [
    'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ',
    'abcçdefgğhıijklmnoöprsştuüvyz',
    '0123456789 .,!?:;\'"-()/%+=*&',
    'Işıl, İlkin, Çağrı, Ömer, Gülşen',
    'ğĞ üÜ şŞ ıI iİ öÖ çÇ âîû ♥✓★←→',
    'Bee & Bloom — Anı Kartı… QWXqwx',
    'Zıpzıp bilmek ister: deniz mi dağ mı?',
    'Püntür: "Aaa! Hay aksi!" (%100)',
  ];
  lines.forEach((l, i) => BB.Font.drawPx(pc, l, 4, 4 + i * 14, '#3b2516'));
  writePNG(path.join(out, 'font.png'), pc.w, pc.h, pc.data, scale);
  console.log('yazildi: cikti/font.png');
}

if ((mode === 'sprites' || mode === 'bees' || mode === 'all') && BB.Sprites) {
  const book = BB.Sprites.build();
  const atlas = book.pack(512);
  writePNG(path.join(out, 'atlas.png'), atlas.w, atlas.h, atlas.data, scale);
  console.log('yazildi: cikti/atlas.png', atlas.w + 'x' + atlas.h, 'sprite:', book.list.length);
  if (BB.Sprites.preview) {
    const flt = process.argv[4] ? (n) => n.startsWith(process.argv[4]) || n.includes(process.argv[4]) : (n) => !n.startsWith('disi') && !n.startsWith('erkek');
    const pv = BB.Sprites.preview(book, mode === 'bees' ? (n) => n.startsWith('disi') || n.startsWith('erkek') : flt);
    writePNG(path.join(out, 'sprites.png'), pv.w, pv.h, pv.data, scale);
    console.log('yazildi: cikti/sprites.png');
  }
}

if (mode === 'themes' || mode === 'all') {
  const map = [
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '.......====...........pppp....',
    '..............................',
    '......................bbbb....',
    '..........vvvv................',
    '...:::::..####................',
    '...:::::..####......%%%%......',
    '...:::::............%%%%..III.',
    '1.2..........................E',
    '#####^^^^####~~~~~####C##########'.slice(0, 30),
    '##############~~~~###########',
    '##############################',
  ].map((r) => (r + '#'.repeat(30)).slice(0, 30));
  map[15] = '##############~~~~############';
  const def = { id: 0, name: 'tema', map, objects: [], questions: [], coop: ['t'] };
  const w = new BB.World(def);
  const keys = Object.keys(BB.THEMES);
  const W = 480, Hh = 270;
  const sheet = new BB.Art.PixelCanvas(W * 2, Hh * 3);
  keys.forEach((k, i) => {
    const ox = (i % 2) * W, oy = Math.floor(i / 2) * Hh;
    const layers = BB.Tiles.makeBackground(k);
    for (const L of layers) sheet.blit(L.pc, ox, oy);
    const t = BB.Tiles.renderTiles(w, k);
    sheet.blit(t.back, ox, oy - 2);
    sheet.blit(t.front, ox, oy - 2);
    BB.Font.drawPx(sheet, BB.THEMES[k].name, ox + 4, oy + 4, '#2b1a10');
  });
  writePNG(path.join(out, 'temalar.png'), sheet.w, sheet.h, sheet.data, Math.max(1, Math.floor(scale / 2)));
  console.log('yazildi: cikti/temalar.png');
}
