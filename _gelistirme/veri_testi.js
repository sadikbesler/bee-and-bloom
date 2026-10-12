// Veri doğrulama: 40 soru, sahneler, tabelalar, yazı tipi kapsamı, Türkçe ekler, bölüm ↔ soru eşleşmesi.
// Kullanım: node _gelistirme/veri_testi.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PROJ = path.resolve(__dirname, '..');
const { dataFiles } = require('./sim.js');

const ctx = { console, Math, Object, Array, Uint8Array, Uint8ClampedArray, Float32Array, Error, JSON, Set, Map, String, Number, Date, RegExp, parseInt, isFinite, Boolean };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/core.js', 'js/physics.js', 'js/entities.js', 'js/level.js', 'js/art.js', 'js/font.js', 'js/sprites.js', 'js/characters.js', 'js/questions.js'].concat(dataFiles())) {
  vm.runInContext(fs.readFileSync(path.join(PROJ, f), 'utf8'), ctx, { filename: f });
}
const BB = ctx.BB;
BB.LEVELS.sort((a, b) => a.id - b.id);
const errs = [], warns = [];
const E = (m) => errs.push(m), Wn = (m) => warns.push(m);

const NAME_SETS = [['Ayşe', 'Mert'], ['İlkin', 'Işıl'], ['Çağrı', 'Ömer'], ['Gülşen', 'Ufuk'], ['Jo', 'X'], ['Ali Can', 'Zeynep Su'], ['ÖĞÜŞÇI', 'iıİI'], ['Bb', '42']];

function checkText(t, where) {
  if (typeof t !== 'string' || !t.trim()) { E(`${where}: boş metin`); return; }
  if (/undefined|null|NaN/.test(t)) E(`${where}: "undefined/null/NaN" içeriyor → ${t}`);
  if (/\{[a-zA-Z0-9_|]+\}/.test(t)) E(`${where}: çözülmemiş yer tutucu → ${t}`);
  const bad = BB.Font.unsupported(t);
  if (bad.length) E(`${where}: yazı tipinde olmayan karakter(ler) ${JSON.stringify(bad)} → ${t}`);
}

// ------------------------------------------------------------ 1) sorular
const Q = BB.QUESTIONS;
if (Q.length !== 40) E(`soru sayısı ${Q.length}, 40 olmalı`);
const ids = new Set();
const cats = { ARK: 0, FLR: 0, SOH: 0 }, types = { G: 0, A: 0, T: 0, K: 0 };
const perLevel = {};
for (const q of Q) {
  if (ids.has(q.id)) E(`tekrarlanan soru kimliği ${q.id}`);
  ids.add(q.id);
  if (!(q.cat in cats)) E(`${q.id}: kategori ${q.cat}`); else cats[q.cat]++;
  if (!(q.type in types)) E(`${q.id}: tip ${q.type}`); else types[q.type]++;
  const n = q.type === 'K' ? 2 : 4;
  if (!Array.isArray(q.opts) || q.opts.length !== n) E(`${q.id}: ${n} seçenek olmalı (${q.opts && q.opts.length})`);
  if (q.type === 'K' && (q.opts[0] !== '{p1}' || q.opts[1] !== '{p2}')) E(`${q.id}: kim sorusunun seçenekleri {p1}/{p2} olmalı`);
  const need = q.type === 'K' ? ['same', 'other', 'self'] : q.type === 'T' ? ['right', 'wrong'] : ['same', 'diff'];
  for (const k of need) if (!q[k]) E(`${q.id}: '${k}' tepkisi eksik`);
  if (q.type === 'T' && q.subject !== 0 && q.subject !== 1) E(`${q.id}: tahmin sorusunda subject 0/1 olmalı`);
  if (!q.text || !q.ask) E(`${q.id}: text/ask eksik`);
  if (!BB.SPEAKERS_LIST.includes(q.who)) E(`${q.id}: soran bilinmiyor (${q.who})`);
  perLevel[q.level] = (perLevel[q.level] || 0) + 1;
  // her isim çiftiyle biçimlendir
  for (const names of NAME_SETS) {
    checkText(BB.Q.ask(q, names), `${q.id}.ask ${names}`);
    checkText(q.text, `${q.id}.text`);
    BB.Q.options(q, names).forEach((o, i) => checkText(o, `${q.id}.opt${i}`));
    const recs = [];
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) recs.push({ a, b });
    for (const rec of recs) checkText(BB.Q.reaction(q, rec, names), `${q.id}.tepki(${rec.a},${rec.b}) ${names}`);
  }
}
if (cats.ARK !== 10 || cats.FLR !== 10 || cats.SOH !== 20) E(`kategori dağılımı ${JSON.stringify(cats)} (10/10/20 olmalı)`);
for (const t of ['G', 'A', 'T', 'K']) if (!types[t]) E(`'${t}' tipinde soru yok`);
for (let l = 1; l <= 18; l++) { const want = l === 18 ? 6 : 2; if ((perLevel[l] || 0) !== want) E(`bölüm ${l}: ${perLevel[l] || 0} soru (${want} olmalı)`); }
// uyum hesabı
{
  const ans = {};
  Q.forEach((q, i) => { ans[q.id] = { a: 0, b: i % 4 === 0 ? 0 : (q.type === 'K' ? 1 : 2) }; });
  const u = BB.Q.uyum(ans), exp = Q.filter((q, i) => i % 4 === 0).length;
  if (u.ok !== exp || u.total !== 40 || u.pct !== Math.round(exp / 40 * 100)) E(`uyum hesabı yanlış: ${JSON.stringify(u)} (beklenen ${exp}/40)`);
  if (BB.Q.uyum({}).pct !== 0) E('boş cevaplarda uyum 0 olmalı');
}

// ------------------------------------------------------------ 2) bölümler ↔ sorular
const used = {};
for (const L of BB.LEVELS) {
  const v = BB.validateLevel(L);
  for (const e of v.errors) E(e);
  for (const w of v.warnings) Wn(w);
  for (const id of L.questions || []) {
    const q = BB.Q.get(id);
    if (!q) continue;
    used[id] = (used[id] || 0) + 1;
    if (q.level !== L.id) E(`soru ${id} bölüm ${q.level}'e ait ama bölüm ${L.id}'de kullanılmış`);
  }
  // tabelalar
  for (const o of L.objects || []) {
    if (o.t !== 'sign') continue;
    for (const names of NAME_SETS.slice(0, 3)) {
      const c = { p1: names[0], p2: names[1], k1sol: 'A', k1sag: 'D', k1kanat: 'W', k1eylem: 'S', k2sol: '←', k2sag: '→', k2kanat: '↑', k2eylem: '↓', disi: names[0], erkek: names[1] };
      checkText(BB.fmt(o.text, c), `bölüm ${L.id} tabela (${o.x},${o.y})`);
    }
  }
}
const levelIds = BB.LEVELS.map((l) => l.id).filter((id) => id < 90);
const missingLevels = [];
for (let l = 1; l <= 18; l++) if (!levelIds.includes(l)) missingLevels.push(l);
if (missingLevels.length) Wn(`henüz yüklenmeyen bölümler: ${missingLevels.join(', ')}`);
else for (const q of Q) if ((used[q.id] || 0) !== 1) E(`soru ${q.id} ${used[q.id] || 0} kez kullanılmış (1 olmalı)`);

// ------------------------------------------------------------ 3) sahneler
const book = BB.Sprites.build();
const SPK = { kralice: 'kralice', puntur: 'puntur', zipzip: 'zipzip', hu: 'hu', isil: 'isil', bora: 'bora' };
const EMO = ['call', 'q', 'heart', 'dots', 'note', 'sweat', 'angry', 'star', 'zz', 'left', 'right', 'up'];
const BFACE = ['normal', 'happy', 'surprised', 'shy', 'angry', 'sad', 'dizzy', 'blink'];
const refScenes = new Set();
for (const L of BB.LEVELS) {
  if (L.scenes) for (const k of Object.keys(L.scenes)) refScenes.add(L.scenes[k]);
  for (const o of L.objects || []) { if (o.scene) refScenes.add(o.scene); if (o.scenes) for (const k of Object.keys(o.scenes)) refScenes.add(o.scenes[k]); }
}
for (const id of Object.keys(BB.SCENES)) {
  if (id.startsWith('__')) continue;
  const steps = BB.SCENES[id].steps || BB.SCENES[id];
  if (!Array.isArray(steps) || !steps.length) { E(`sahne ${id}: boş`); continue; }
  if (steps.length === 1 && steps[0].text === '…') Wn(`sahne ${id}: henüz yer tutucu`);
  if (!refScenes.has(id) && !missingLevels.length) Wn(`sahne ${id}: hiçbir bölümde kullanılmıyor`);
  steps.forEach((st, i) => {
    if (st.say) {
      if (st.say !== 'anlatici' && !SPK[st.say]) E(`sahne ${id}[${i}]: bilinmeyen konuşmacı ${st.say}`);
      if (SPK[st.say] && st.face && !book.get('pt_' + SPK[st.say] + '_' + (st.face === 'talk' ? 'normal' : st.face)) && !book.get('pt_' + SPK[st.say] + '_' + st.face)) E(`sahne ${id}[${i}]: ${st.say} için '${st.face}' portresi yok`);
      for (const names of NAME_SETS) checkText(BB.fmt(st.text, { p1: names[0], p2: names[1], disi: names[0], erkek: names[1] }), `sahne ${id}[${i}] ${names}`);
    }
    if (st.react) {
      if (!['both', 'p1', 'p2', 'disi', 'erkek'].includes(st.react)) E(`sahne ${id}[${i}]: react hedefi ${st.react}`);
      if (st.e && !EMO.includes(st.e)) E(`sahne ${id}[${i}]: bilinmeyen duygu ${st.e}`);
      if (st.face && !BFACE.includes(st.face)) E(`sahne ${id}[${i}]: arı yüzü yok ${st.face}`);
    }
    if (st.title) checkText(st.title, `sahne ${id}[${i}] başlık`);
    if (st.music && !BB.SONGS_LIST.includes(st.music)) E(`sahne ${id}[${i}]: şarkı yok ${st.music}`);
  });
}
for (const id of refScenes) if (!BB.SCENES[id]) E(`sahne bulunamadı: ${id}`);

// ------------------------------------------------------------ 4) Türkçe ekler
const EK = [
  ['Ali', 'in', "Ali'nin"], ['Ayşe', 'in', "Ayşe'nin"], ['Mert', 'in', "Mert'in"], ['Can', 'in', "Can'ın"], ['Gül', 'in', "Gül'ün"], ['Oğuz', 'in', "Oğuz'un"],
  ['Işıl', 'in', "Işıl'ın"], ['İlkin', 'in', "İlkin'in"], ['Ömer', 'in', "Ömer'in"], ['Su', 'in', "Su'nun"], ['Ufuk', 'i', "Ufuk'u"], ['Ayşe', 'i', "Ayşe'yi"],
  ['Mert', 'e', "Mert'e"], ['Can', 'e', "Can'a"], ['Ayşe', 'e', "Ayşe'ye"], ['Mert', 'de', "Mert'te"], ['Can', 'de', "Can'da"], ['Ufuk', 'den', "Ufuk'tan"],
  ['Zeynep', 'le', "Zeynep'le"], ['Ali', 'le', "Ali'yle"], ['Sadık', 'in', "Sadık'ın"], ['Ece', 'de', "Ece'de"],
];
for (const [n, k, want] of EK) { const got = BB.ek(n, k); if (got !== want) E(`ek: ${n}+${k} → ${got} (beklenen ${want})`); }

// ------------------------------------------------------------ 5) kaynak dosyalardaki metin karakterleri yazı tipinde mi
const SRC = ['js/ui.js', 'js/story.js', 'js/questions.js', 'js/final.js', 'js/card.js', 'js/render.js', 'js/main.js', 'js/save.js'];
for (const f of SRC) {
  const src = fs.readFileSync(path.join(PROJ, f), 'utf8');
  src.split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    const strs = code.match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g) || [];
    for (const s of strs) {
      const t = s.slice(1, -1).replace(/\\'/g, "'");
      if (!/[^\x00-\x7f]/.test(t)) continue;
      const bad = BB.Font.unsupported(t.replace(/\$\{[^}]*\}/g, '').replace(/\{[a-zA-Z0-9_|]+\}/g, ''));
      if (bad.length) E(`${f}:${i + 1}: yazı tipinde olmayan karakter ${JSON.stringify(bad)} → ${t.slice(0, 60)}`);
    }
  });
}

// ------------------------------------------------------------ 6) müzik notaları ve akorlar
{
  const NOTE = /^([A-G][#b]?)(-?\d)$/, CHORD = /^([A-G][#b]?)(|m|7|m7|maj7|sus4|add9|dim)$/;
  let nNotes = 0;
  for (const name of Object.keys(BB.SONGS || {})) {
    const sg = BB.SONGS[name];
    if (!(sg.bpm > 40 && sg.bpm < 220) || !sg.steps) E(`şarkı ${name}: bpm/steps hatalı`);
    sg.bars.forEach((b, i) => {
      if (b.chord && !CHORD.test(b.chord)) E(`şarkı ${name} ölçü ${i}: akor '${b.chord}'`);
      for (const tr of ['lead', 'alt', 'bass']) {
        if (!b[tr]) continue;
        if (b[tr].length !== sg.steps) E(`şarkı ${name} ölçü ${i} ${tr}: ${b[tr].length} adım (${sg.steps} olmalı)`);
        for (const tok of b[tr]) { if (tok === '.' || tok === '-') continue; nNotes++; if (!NOTE.test(tok)) E(`şarkı ${name} ölçü ${i} ${tr}: nota '${tok}'`); }
      }
    });
  }
  console.log(`Müzik: ${Object.keys(BB.SONGS || {}).length} şarkı, ${nNotes} nota`);
}

console.log(`Sorular: ${Q.length} (ARK ${cats.ARK}, FLR ${cats.FLR}, SOH ${cats.SOH}) · tipler ${JSON.stringify(types)}`);
console.log(`Sahneler: ${Object.keys(BB.SCENES).filter((k) => !k.startsWith('__')).length} · bölümler: ${levelIds.join(',')}`);
for (const w of warns) console.log('  uyarı: ' + w);
for (const e of errs) console.log('  HATA: ' + e);
console.log(errs.length ? `\n${errs.length} hata` : '\nveri testi: hata yok');
process.exitCode = errs.length ? 1 : 0;
