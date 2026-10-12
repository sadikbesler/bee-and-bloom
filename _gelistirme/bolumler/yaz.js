// Bölüm üreticilerinin çıktısını data/dunyaN.js dosyasına okunur biçimde yazar.
const fs = require('fs');
const path = require('path');

function lit(v) {
  if (Array.isArray(v)) return '[' + v.map(lit).join(', ') + ']';
  if (v && typeof v === 'object') return '{ ' + Object.keys(v).map((k) => (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + lit(v[k])).join(', ') + ' }';
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  return String(v);
}

function writeWorld(n, title, levels, source, fileName) {
  const out = [];
  out.push(`/* Bee & Bloom — Dünya ${n}: ${title}. Bu dosya ${source} ile üretilir; harita değişikliklerini orada yapın. */`);
  out.push('(function (root) {');
  out.push("  'use strict';");
  out.push('  const BB = root.BB;');
  for (const L of levels) {
    out.push('  BB.LEVELS.push({');
    for (const k of Object.keys(L)) {
      if (k === 'map') {
        out.push('    map: [');
        for (const row of L.map) out.push("      '" + row + "',");
        out.push('    ],');
      } else if (k === 'objects') {
        out.push('    objects: [');
        for (const o of L.objects) out.push('      ' + lit(o) + ',');
        out.push('    ],');
      } else out.push('    ' + k + ': ' + lit(L[k]) + ',');
    }
    out.push('  });');
  }
  // sahneler.js'te henüz yazılmamış sahneler için yer tutucu (asıl metin data/sahneler.js'te; o önce yüklenir)
  const ids = new Set();
  for (const L of levels) {
    if (L.scenes) for (const k of Object.keys(L.scenes)) ids.add(L.scenes[k]);
    for (const o of L.objects || []) { if (o.scene) ids.add(o.scene); if (o.scenes) for (const k of Object.keys(o.scenes)) ids.add(o.scenes[k]); }
  }
  if (ids.size) {
    out.push('  // yer tutucular: asıl sahneler data/sahneler.js içinde');
    for (const id of [...ids].sort()) out.push(`  BB.SCENES['${id}'] = BB.SCENES['${id}'] || [{ say: 'anlatici', text: '…' }];`);
  }
  out.push("})(typeof window !== 'undefined' ? window : globalThis);");
  const file = path.resolve(__dirname, '..', '..', 'data', fileName || `dunya${n}.js`);
  fs.writeFileSync(file, out.join('\n') + '\n');
  return file;
}

module.exports = { writeWorld, lit };
