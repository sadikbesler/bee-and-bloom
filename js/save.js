/* Bee & Bloom — kayıt: localStorage (3 slot), otomatik kayıt, yedek indir/yükle, doğrulama. Node'da da test edilir. */
(function (root) {
  'use strict';
  const BB = root.BB;
  const PREFIX = 'beeandbloom_v1_';
  const VERSION = 1;

  const Save = {
    available: false, warning: null, cur: null, slot: null, temp: false,
    settings: { music: 0.6, sfx: 0.8, muted: false, scale: 0 },
    mem: Object.create(null), lastWrite: 0, lastError: null,
  };
  BB.Save = Save;

  // ------------------------------------------------------------ depolama bağdaştırıcısı
  function ls() { try { return root.localStorage || null; } catch (e) { return null; } }
  Save.read = function (key) {
    if (Save.available) { try { return ls().getItem(PREFIX + key); } catch (e) { Save.fail(e); } }
    return Save.mem[key] !== undefined ? Save.mem[key] : null;
  };
  Save.write = function (key, val) {
    Save.mem[key] = val;
    if (!Save.available) return false;
    try { ls().setItem(PREFIX + key, val); Save.lastWrite = Date.now(); return true; }
    catch (e) { Save.fail(e); return false; }
  };
  Save.remove = function (key) {
    delete Save.mem[key];
    if (!Save.available) return;
    try { ls().removeItem(PREFIX + key); } catch (e) { Save.fail(e); }
  };
  Save.fail = function (e) {
    Save.lastError = e;
    const quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
    const first = !Save.warning;
    Save.warning = quota ? 'Kayıt alanı dolu: ilerleme kaydedilemedi. Menüden "Kaydı indir" ile yedek alın.' : 'Tarayıcı kayda izin vermiyor: ilerleme bu oturumla sınırlı. Menüden "Kaydı indir" ile yedek alabilirsiniz.';
    if (first && BB.UI && BB.UI.toast) BB.UI.toast(Save.warning, 6);
  };

  Save.init = function () {
    const s = ls();
    Save.available = false;
    if (s) {
      try { const k = PREFIX + '__test'; s.setItem(k, '1'); s.removeItem(k); Save.available = true; }
      catch (e) { Save.fail(e); }
    } else Save.warning = 'Tarayıcı kayda izin vermiyor: ilerleme bu oturumla sınırlı. Menüden "Kaydı indir" ile yedek alabilirsiniz.';
    try {
      const raw = Save.read('ayarlar');
      if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') for (const k of Object.keys(Save.settings)) if (typeof o[k] === typeof Save.settings[k]) Save.settings[k] = o[k]; }
    } catch (e) { /* bozuk ayar: varsayılanlar */ }
    Save.applySettings();
  };
  Save.applySettings = function () {
    const A = BB.Audio;
    if (A) { A.musicVol = Save.settings.music; A.sfxVol = Save.settings.sfx; A.muted = Save.settings.muted; if (A.applyVolumes) A.applyVolumes(); }
    if (BB.Gfx && BB.Gfx.canvas) { BB.Gfx.scaleMode = Save.settings.scale; BB.Gfx.resize(); }
  };
  Save.setSetting = function (k, v) { Save.settings[k] = v; Save.write('ayarlar', JSON.stringify(Save.settings)); Save.applySettings(); };

  // ------------------------------------------------------------ slot verisi
  Save.blank = function (names, roles) {
    const now = Date.now();
    return {
      v: VERSION, game: 'bee-and-bloom', names: names.slice(), roles: roles.slice(), created: now, updated: now,
      playTime: 0, unlocked: 1, finished: false, round: 1, rounds: 0,
      current: { level: 0, checkpoint: null, taken: [], secret: false, deaths: 0, time: 0 },
      best: {}, deaths: {}, totalDeaths: 0, pollen: {}, secrets: {}, answers: {}, cardShown: false,
    };
  };

  // isim: 1–12 karakter ve yalnız isim ekranında yazılabilen harfler (yazı tipinde olmayan karakter ekrana çizilemez)
  const NAME_CH = /^[A-Za-zÇĞİÖŞÜçğıiöşüÂÎÛâîûÄËÏäëïÉÈÊéèêÁÀáàÓÒÔóòôÚÙúùÍÌíìÑñß0-9 .'\-]+$/;
  const nameOk = (s) => typeof s === 'string' && s.trim().length >= 1 && Array.from(s.trim()).length <= 12 && NAME_CH.test(s);
  // içe aktarılan/okunan veriyi doğrula; sorun varsa { ok:false, why }
  Save.validate = function (d) {
    if (!d || typeof d !== 'object') return { ok: false, why: 'Dosya bir kayıt değil.' };
    if (d.game !== 'bee-and-bloom') return { ok: false, why: 'Bu kayıt Bee & Bloom\'a ait değil.' };
    if (d.v !== VERSION) return { ok: false, why: `Kayıt sürümü uyumsuz (${d.v}).` };
    if (!Array.isArray(d.names) || d.names.length !== 2 || !d.names.every(nameOk)) return { ok: false, why: 'Oyuncu isimleri geçersiz.' };
    if (!Array.isArray(d.roles) || d.roles.length !== 2 || !d.roles.includes('disi') || !d.roles.includes('erkek')) return { ok: false, why: 'Arı seçimi geçersiz.' };
    const n = Math.max(18, BB.LEVELS.length);
    if (!Number.isInteger(d.unlocked) || d.unlocked < 1 || d.unlocked > n + 1) return { ok: false, why: 'Açılan bölüm bilgisi geçersiz.' };
    if (!d.current || !Number.isInteger(d.current.level) || d.current.level < 0 || d.current.level >= n) return { ok: false, why: 'Kaldığınız bölüm bilgisi geçersiz.' };
    if (!d.answers || typeof d.answers !== 'object') return { ok: false, why: 'Cevaplar okunamadı.' };
    for (const id of Object.keys(d.answers)) {
      const a = d.answers[id];
      if (BB.QUESTIONS.length && !BB.QUESTIONS.find((q) => q.id === id)) return { ok: false, why: 'Bilinmeyen soru: ' + id };
      if (!a || !Number.isInteger(a.a) || !Number.isInteger(a.b)) return { ok: false, why: 'Cevap kaydı bozuk: ' + id };
      const q = BB.QUESTIONS.find((x) => x.id === id), n = q && BB.Q ? BB.Q.nOpts(q) : 4;
      if (a.a < 0 || a.b < 0 || a.a >= n || a.b >= n) return { ok: false, why: 'Cevap kaydı bozuk: ' + id };
    }
    for (const k of ['best', 'deaths', 'pollen', 'secrets']) if (!d[k] || typeof d[k] !== 'object') d[k] = {};
    if (typeof d.playTime !== 'number' || !isFinite(d.playTime) || d.playTime < 0) d.playTime = 0;
    if (typeof d.totalDeaths !== 'number' || d.totalDeaths < 0) d.totalDeaths = 0;
    if (!Array.isArray(d.current.taken)) d.current.taken = [];
    if (typeof d.round !== 'number') d.round = 1;
    return { ok: true };
  };

  Save.load = function (slot) {
    const raw = Save.read('slot' + slot);
    if (!raw) return null;
    try {
      const d = JSON.parse(raw);
      const v = Save.validate(d);
      if (!v.ok) return { corrupt: true, why: v.why };
      return d;
    } catch (e) { return { corrupt: true, why: 'Kayıt bozuk (okunamadı).' }; }
  };

  Save.list = function () {
    const out = [];
    for (let s = 1; s <= 3; s++) {
      const d = Save.load(s);
      if (!d) out.push({ slot: s, empty: true });
      else if (d.corrupt) out.push({ slot: s, corrupt: true, why: d.why });
      else out.push({ slot: s, names: d.names, level: d.current.level, unlocked: d.unlocked, playTime: d.playTime, drops: Object.keys(d.answers).length, updated: d.updated, finished: d.finished, data: d });
    }
    return out;
  };

  Save.use = function (slot, data) {
    Save.slot = slot; Save.cur = data; Save.temp = false;
    BB.Game.names = data.names.slice(); BB.Game.roles = data.roles.slice(); BB.Game.round = data.round || 1;
  };
  Save.useTemp = function (names, roles) { Save.slot = null; Save.temp = true; Save.cur = Save.blank(names, roles); };
  Save.create = function (slot, names, roles) { const d = Save.blank(names, roles); Save.use(slot, d); Save.flush(); return d; };
  Save.deleteSlot = function (slot) { Save.remove('slot' + slot); if (Save.slot === slot) { Save.slot = null; Save.cur = null; } };

  Save.flush = function () {
    if (!Save.cur || Save.temp || !Save.slot) return false;
    Save.cur.updated = Date.now();
    return Save.write('slot' + Save.slot, JSON.stringify(Save.cur));
  };

  // ------------------------------------------------------------ oyun içi kancalar
  Save.capture = function (play) {
    const d = Save.cur;
    if (!d || !play || !play.world) return;
    if (!Save.isMainLine(play)) return;          // eski bir bölümü tekrar oynamak "Devam" noktasını ezmesin
    const w = play.world;
    d.current = {
      level: play.idx,
      checkpoint: w.cp && !w.cp.start ? w.checks.indexOf(w.cp) : null,
      taken: w.pollen.map((p, i) => (p.taken ? i : -1)).filter((i) => i >= 0),
      perm: Object.keys(w.perm),                                          // kalıcı bayraklar (mandallı kapılar, bulmacalar, saksılar)
      cps: w.checks.map((k, i) => (k.on ? i : -1)).filter((i) => i >= 0),  // açılmış Bal Çiçekleri (dikey bölümlerde x sırası yetmez)
      seen: Object.keys(w.seen),                                          // görülmüş sahne tetikleyicileri
      secret: !!w.stats.secret,
      deaths: w.stats.deaths, time: w.stats.time,
    };
  };
  // ana ilerleme çizgisinde mi (kaldığı bölüm ya da ilerisi)? bölüm seçiminden geri dönüp oynamak değil
  Save.isMainLine = function (play) {
    const d = Save.cur;
    if (!d || !d.current) return true;
    if (d.atEnd) return false;
    return play.idx >= d.current.level;
  };
  Save.onLevelStart = function (play) {
    const d = Save.cur;
    if (d && d.atEnd && play.idx === 0 && (BB.Game.round || 1) > 1) d.atEnd = false;   // ikinci tur başı
    Save.capture(play); Save.flush();
  };
  Save.markProgress = function (play) { Save.capture(play); };
  Save.autosave = function (why) {
    const g = BB.Game;
    if (g && g.Play && g.screen === g.Play && g.Play.world && !g.Play.ended) Save.capture(g.Play);
    Save.flush();
    void why;
  };
  Save.tick = function (dt) { if (Save.cur) Save.cur.playTime += dt; };

  Save.onLevelEnd = function (play) {
    const d = Save.cur;
    if (!d) return;
    const w = play.world, id = play.def.id;
    const t = w.stats.time;
    if (!d.best[id] || t < d.best[id]) d.best[id] = Math.round(t * 10) / 10;
    d.deaths[id] = (d.deaths[id] || 0) + w.stats.deaths;
    d.totalDeaths += w.stats.deaths;
    d.pollen[id] = Math.max(d.pollen[id] || 0, w.stats.pollen);
    if (w.stats.secret) d.secrets[id] = true;
    d.unlocked = Math.max(d.unlocked, Math.min(BB.LEVELS.length, play.idx + 2));
    const next = play.idx + 1;
    if (!Save.isMainLine(play)) { Save.flush(); return; }   // tekrar oynanan bölüm: istatistik güncellendi, Devam noktası aynı kalır
    d.atEnd = next >= BB.LEVELS.length;
    if (next >= BB.LEVELS.length) { d.finished = true; d.current = { level: play.idx, checkpoint: null, taken: [], secret: false, deaths: 0, time: 0 }; }
    else d.current = { level: next, checkpoint: null, taken: [], secret: false, deaths: 0, time: 0 };
    Save.flush();
  };

  // cevap ilk verildiğinde kilitlenir
  Save.setAnswer = function (qid, rec) {
    const d = Save.cur;
    if (!d) return false;
    if (d.answers[qid]) return false;
    d.answers[qid] = Object.assign({ t: Date.now() }, rec);
    Save.flush();
    return true;
  };

  // ------------------------------------------------------------ yedek
  Save.exportJSON = function (slot) {
    const d = slot === Save.slot && Save.cur ? Save.cur : Save.load(slot);
    if (!d || d.corrupt) return null;
    return JSON.stringify(Object.assign({}, d, { exported: Date.now() }), null, 1);
  };
  Save.importJSON = function (text, slot) {
    let d;
    try { d = JSON.parse(text); } catch (e) { return { ok: false, why: 'Dosya okunamadı (JSON değil).' }; }
    const v = Save.validate(d);
    if (!v.ok) return v;
    delete d.exported;
    const ok = Save.write('slot' + slot, JSON.stringify(d));
    if (!ok && Save.available) return { ok: false, why: Save.warning || 'Kayıt yazılamadı.' };
    return { ok: true, data: d };
  };
})(typeof window !== 'undefined' ? window : globalThis);
