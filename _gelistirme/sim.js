// Başsız simülasyon: oyun çekirdeğini DOM/canvas olmadan Node'da yükler.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PROJ = path.resolve(__dirname, '..');

const SIM_FILES = ['js/core.js', 'js/physics.js', 'js/entities.js', 'js/level.js', 'js/questions.js', 'js/save.js'];

function dataFiles() {
  const dir = path.join(PROJ, 'data');
  if (!fs.existsSync(dir)) return [];
  // index.html ile aynı sıra: sorular, sahneler, bölümler
  const order = (f) => (f.startsWith('sorular') ? 0 : f.startsWith('sahneler') ? 1 : f.startsWith('dunya') ? 2 : 3);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort((a, b) => order(a) - order(b) || a.localeCompare(b)).map((f) => 'data/' + f);
}

function loadBB(opts) {
  opts = opts || {};
  const ctx = { console, Math, Object, Array, Uint8Array, Float32Array, Error, JSON, Set, Map, Date, String, Number, Boolean, RegExp, Symbol, Infinity, NaN, isFinite, parseInt, parseFloat };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const files = SIM_FILES.concat(opts.noData ? [] : dataFiles()).concat(opts.extra || []);
  ctx.__loadErrors = [];
  for (const f of files) {
    const p = path.join(PROJ, f);
    if (!fs.existsSync(p)) continue;
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); }
    catch (e) {
      // bir veri dosyasındaki hata diğer dünyaların testini durdurmasın
      if (f.startsWith('data/') && !opts.strict) { ctx.__loadErrors.push(f + ': ' + e.message); console.error('UYARI: ' + f + ' yüklenemedi: ' + e.message); }
      else throw e;
    }
  }
  ctx.BB.loadErrors = ctx.__loadErrors;
  ctx.BB.LEVELS.sort((a, b) => a.id - b.id);
  return ctx.BB;
}

const mkIn = () => ({ left: false, right: false, flap: false, flapPressed: false, action: false, actionPressed: false });

module.exports = { loadBB, mkIn, PROJ, dataFiles };
