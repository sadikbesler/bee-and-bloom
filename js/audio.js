/* Bee & Bloom — ses: WebAudio ile kodla üretilen chiptune müzik ve efektler (dosya yok, lisans yok). */
(function () {
  'use strict';
  const BB = window.BB;
  const A = {};
  BB.Audio = A;

  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  A.musicVol = 0.6; A.sfxVol = 0.8; A.muted = false;
  A.ready = false;

  // ilk kullanıcı etkileşiminde başlat (tarayıcı otomatik oynatma kuralı)
  A.unlock = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    master = ctx.createGain(); master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let s = 7;
    for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x7fffffff) * 2 - 1; }
    A.waves = makeWaves();
    A.ready = true;
    A.applyVolumes();
    if (A._pendingSong) { const s2 = A._pendingSong; A._pendingSong = null; A.play(s2); }
  };
  A.applyVolumes = function () {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(A.muted ? 0 : 1, t, 0.02);
    musicBus.gain.setTargetAtTime(A.musicVol * 0.55, t, 0.05);
    sfxBus.gain.setTargetAtTime(A.sfxVol * 0.7, t, 0.02);
  };
  A.toggleMute = function () { A.muted = !A.muted; A.applyVolumes(); return A.muted; };

  function makeWaves() {
    // kare dalga görev oranları için PeriodicWave
    const mk = (duty) => {
      const n = 32, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) { re[k] = 0; im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); }
      return ctx.createPeriodicWave(re, im, { disableNormalization: false });
    };
    return { sq12: mk(0.125), sq25: mk(0.25), sq50: mk(0.5) };
  }

  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(n) {
    if (typeof n === 'number') return 440 * Math.pow(2, (n - 69) / 12);
    const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
    if (!m) return 0;
    return 440 * Math.pow(2, (NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69) / 12);
  }
  A.freq = freq;

  function osc(type, f, t0, dur, vol, bus, opts) {
    opts = opts || {};
    const o = ctx.createOscillator();
    if (A.waves[type]) o.setPeriodicWave(A.waves[type]); else o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + (opts.slideT || dur));
    if (opts.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t0 + 0.12); l.stop(t0 + dur + 0.05); }
    const g = ctx.createGain();
    const a = opts.a || 0.005, rel = opts.r || 0.06;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    if (opts.decay) g.gain.setTargetAtTime(vol * (opts.sus || 0.4), t0 + a, opts.decay);
    g.gain.setValueAtTime(opts.decay ? vol * (opts.sus || 0.4) : vol, t0 + Math.max(a, dur - rel));
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }
  function noise(t0, dur, vol, bus, opts) {
    opts = opts || {};
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.playbackRate.value = opts.rate || 1;
    const f = ctx.createBiquadFilter();
    f.type = opts.type || 'highpass'; f.frequency.value = opts.f || 1000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }

  // ------------------------------------------------------------ efektler
  const lastPlay = Object.create(null);
  A.sfx = function (name, opt) {
    if (!A.ready || A.muted) return;
    const now = ctx.currentTime;
    if (lastPlay[name] && now - lastPlay[name] < 0.03) return;
    lastPlay[name] = now;
    const t = now + 0.005;
    const p = opt || {};
    switch (name) {
      case 'flap': osc('sq25', 520 + (p.id ? 60 : 0), t, 0.05, 0.05, null, { slide: 760, slideT: 0.05 }); break;
      case 'jump': osc('sq25', 330 + (p.id ? 40 : 0), t, 0.12, 0.09, null, { slide: 660, slideT: 0.1 }); break;
      case 'land': noise(t, 0.06, 0.08, null, { f: 900, type: 'lowpass' }); break;
      case 'bounce': osc('triangle', 200, t, 0.25, 0.25, null, { slide: 700, slideT: 0.18 }); break;
      case 'pollen': osc('sq12', 1320 + (p.n % 5) * 70, t, 0.07, 0.06); osc('sq12', 1760 + (p.n % 5) * 70, t + 0.05, 0.08, 0.05); break;
      case 'secret': [0, 4, 7, 12, 16].forEach((s, i) => osc('sq25', freq(76 + s), t + i * 0.07, 0.18, 0.07)); break;
      case 'nectar': osc('sine', 880, t, 0.15, 0.08, null, { slide: 1320 }); break;
      case 'checkpoint': [0, 7, 12].forEach((s, i) => osc('triangle', freq(72 + s), t + i * 0.08, 0.25, 0.18)); osc('sq12', freq(84), t + 0.24, 0.3, 0.05); break;
      case 'plate': osc('square', p.on ? 180 : 140, t, 0.08, 0.06, null, { slide: p.on ? 120 : 200 }); break;
      case 'gate': noise(t, 0.35, 0.07, null, { f: 300, type: 'lowpass', rate: 0.5 }); osc('triangle', 90, t, 0.3, 0.12, null, { slide: p.opening ? 140 : 70 }); break;
      case 'flower': osc('triangle', p.on ? 660 : 440, t, 0.12, 0.1, null, { slide: p.on ? 990 : 330 }); break;
      case 'pickup': osc('sq25', 440, t, 0.06, 0.07); osc('sq25', 660, t + 0.05, 0.08, 0.07); break;
      case 'drop': osc('sq25', 520, t, 0.06, 0.06, null, { slide: 300 }); break;
      case 'carry': osc('triangle', 300, t, 0.15, 0.14, null, { slide: 520 }); break;
      case 'release': osc('triangle', 520, t, 0.15, 0.12, null, { slide: p.thrown ? 900 : 300 }); break;
      case 'call': osc('sq50', p.id ? 988 : 880, t, 0.07, 0.06); osc('sq50', p.id ? 1318 : 1175, t + 0.08, 0.1, 0.06); break;
      case 'stuck': osc('sawtooth', 220, t, 0.25, 0.05, null, { slide: 110 }); break;
      case 'free': [0, 5, 9].forEach((s, i) => osc('sq25', freq(74 + s), t + i * 0.05, 0.1, 0.06)); break;
      case 'webBreak': noise(t, 0.1, 0.06, null, { f: 3000 }); break;
      case 'death': osc('sq50', 660, t, 0.4, 0.08, null, { slide: 110, slideT: 0.4 }); noise(t + 0.05, 0.2, 0.06, null, { f: 1500 }); break;
      case 'respawn': [0, 4, 7, 12].forEach((s, i) => osc('triangle', freq(67 + s), t + i * 0.05, 0.12, 0.12)); break;
      case 'splash': noise(t, 0.12, 0.04, null, { f: 2000 }); break;
      case 'crack': noise(t, 0.08, 0.06, null, { f: 4000 }); break;
      case 'crumble': noise(t, 0.3, 0.1, null, { f: 600, type: 'lowpass' }); break;
      case 'shatter': noise(t, 0.2, 0.08, null, { f: 5000 }); osc('sq12', 2400, t, 0.1, 0.03, null, { slide: 1200 }); break;
      case 'icicleShake': noise(t, 0.2, 0.03, null, { f: 6000 }); break;
      case 'bloom': [0, 4, 7, 11, 14].forEach((s, i) => osc('triangle', freq(67 + s), t + i * 0.06, 0.3, 0.1)); break;
      case 'rune': if (p.ok) osc('triangle', freq(72 + p.n * 2), t, 0.3, 0.14); else osc('square', 120, t, 0.25, 0.08, null, { slide: 80 }); break;
      case 'seqDone': [0, 4, 7, 12, 16, 19].forEach((s, i) => osc('triangle', freq(64 + s), t + i * 0.08, 0.35, 0.12)); break;
      case 'drop_honey': osc('sine', 660, t, 0.22, 0.16, null, { slide: 1320, slideT: 0.18 }); osc('triangle', freq(84), t + 0.16, 0.25, 0.08); break;
      case 'match': [0, 4, 7, 12].forEach((s, i) => osc('sq25', freq(72 + s), t + i * 0.09, 0.22, 0.08)); break;
      case 'diff': osc('sq25', freq(67), t, 0.15, 0.07); osc('sq25', freq(70), t + 0.12, 0.25, 0.07); break;
      case 'select': osc('sq25', 880, t, 0.05, 0.06); break;
      case 'move': osc('sq12', 660, t, 0.03, 0.05); break;
      case 'back': osc('sq25', 440, t, 0.06, 0.05, null, { slide: 330 }); break;
      case 'pick': osc('sq12', 1046, t, 0.06, 0.06); osc('sq12', 1568, t + 0.05, 0.08, 0.05); break;
      case 'blip': osc(p.wave || 'sq25', p.f || 600, t, 0.025, 0.035); break;
      case 'win': [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => osc('sq25', freq(67 + s), t + i * 0.09, 0.2, 0.08)); break;
      case 'raceGo': osc('sq50', 880, t, 0.3, 0.08); break;
      case 'tick': osc('sq12', 1200, t, 0.03, 0.04); break;
      case 'warm': osc('sine', 330, t, 0.6, 0.1, null, { slide: 660 }); break;
      case 'celebrate': for (let i = 0; i < 12; i++) osc(i % 2 ? 'sq25' : 'triangle', freq(72 + [0, 4, 7, 12, 16, 19, 24, 19, 16, 12, 7, 4][i]), t + i * 0.07, 0.18, 0.07); break;
      case 'page': noise(t, 0.12, 0.05, null, { f: 2500 }); break;
      case 'shutter': osc('sq25', 1500, t, 0.04, 0.06); noise(t + 0.03, 0.08, 0.05, null, { f: 3000 }); break;
      case 'tired': osc('sq12', 300, t, 0.08, 0.03, null, { slide: 200 }); break;
      case 'lilySink': osc('sine', 200, t, 0.3, 0.06, null, { slide: 120 }); break;
      case 'pulse': if (p.on) osc('sine', 520, t, 0.08, 0.03); break;
      case 'bridgeOn': osc('sine', 1046, t, 0.08, 0.025); break;
      case 'timerEnd': osc('square', 300, t, 0.1, 0.04, null, { slide: 200 }); break;
      case 'strain': osc('sq12', 300 + Math.random() * 100, t, 0.04, 0.03); break;
      case 'grab': osc('triangle', 500, t, 0.06, 0.06); break;
      case 'talk': osc('sq25', 700, t, 0.05, 0.05); break;
      case 'collapse': noise(t, 1.2, 0.15, null, { f: 200, type: 'lowpass', rate: 0.4 }); break;
    }
  };

  // ------------------------------------------------------------ müzik sıralayıcı
  // Şarkı: { bpm, steps (adım/ölçü), bars: [{ chord: 'C', lead: [...], bass: [...] }], drums: 'k.h.s.h.' ... }
  let cur = null, nextT = 0, step = 0, timer = null;
  const LOOK = 0.12;

  A.play = function (name, opts) {
    if (!A.ready) { A._pendingSong = name; return; }
    if (cur && cur.name === name) return;
    const song = BB.SONGS && BB.SONGS[name];
    const old = cur;
    if (old) { old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => { try { old.gain.disconnect(); } catch (e) { /* zaten ayrılmış */ } }, 2500); }
    cur = null;
    if (!song) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.setTargetAtTime(1, ctx.currentTime + 0.1, (opts && opts.fade) || 0.5);
    g.connect(musicBus);
    cur = { name, song, gain: g, intensity: 0 };
    step = 0; nextT = ctx.currentTime + 0.1;
    if (!timer) timer = setInterval(tick, 25);
  };
  A.stopMusic = function () {
    if (!cur) return;
    const old = cur; cur = null;
    old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    setTimeout(() => { try { old.gain.disconnect(); } catch (e) { /* yok */ } }, 2000);
  };
  A.setIntensity = function (v) { if (cur) cur.intensity = v; };
  A.current = () => (cur ? cur.name : null);

  function tick() {
    if (!cur || !ctx) return;
    if (document.hidden) { nextT = ctx.currentTime + 0.1; return; }
    const s = cur.song;
    const stepDur = 60 / s.bpm / (s.steps / 4);
    while (nextT < ctx.currentTime + LOOK) {
      playStep(cur, s, step, nextT, stepDur);
      step++;
      nextT += stepDur;
    }
  }

  function playStep(c, s, i, t, sd) {
    const bars = s.bars;
    const total = bars.length * s.steps;
    const k = i % total;
    const bar = bars[Math.floor(k / s.steps)];
    const st = k % s.steps;
    const bus = c.gain;
    const tr = s.tr || 0;
    // melodi
    const lead = bar.lead && bar.lead[st];
    if (lead && lead !== '.' && lead !== '-') {
      let len = 1;
      while (st + len < s.steps && bar.lead[st + len] === '-') len++;
      osc(s.leadWave || 'sq25', freq(transpose(lead, tr)), t, sd * len * 0.95, (s.leadVol || 0.09), bus, { vib: len > 2, decay: 0.15, sus: 0.6, r: 0.04 });
      if (s.echo) osc(s.leadWave || 'sq25', freq(transpose(lead, tr)), t + sd * 3, sd * len * 0.8, (s.leadVol || 0.09) * 0.3, bus, { decay: 0.1, sus: 0.5 });
    }
    // ikinci ses (karşı ezgi)
    const alt = bar.alt && bar.alt[st];
    if (alt && alt !== '.' && alt !== '-') {
      let len = 1;
      while (st + len < s.steps && bar.alt[st + len] === '-') len++;
      osc(s.altWave || 'sq12', freq(transpose(alt, tr)), t, sd * len * 0.9, (s.altVol || 0.045), bus, { decay: 0.12, sus: 0.5 });
    }
    // bas (açık nota ya da akordan desen)
    const bass = bar.bass && bar.bass[st];
    if (bass && bass !== '.' && bass !== '-') {
      let len = 1;
      while (st + len < s.steps && bar.bass[st + len] === '-') len++;
      osc('triangle', freq(transpose(bass, tr)), t, sd * len * 0.9, s.bassVol || 0.16, bus, { r: 0.03 });
    } else if (!bar.bass && s.bassPat && bar.chord) {
      const ch = s.bassPat[st % s.bassPat.length];
      if (ch && ch !== '.') {
        const notes = chordNotes(bar.chord, s.bassOct || 2, tr);
        const root0 = notes[0];
        const n = ch === 'f' ? root0 + 7 : ch === 'o' ? root0 + 12 : ch === 't' ? notes[1] : root0;
        let len = 1;
        while (st + len < s.steps && s.bassPat[(st + len) % s.bassPat.length] === '.') len++;
        osc('triangle', freq(n), t, sd * Math.min(len, 2) * 0.9, s.bassVol || 0.16, bus, { r: 0.03 });
      }
    }
    // arpej (akor)
    if (s.arp && bar.chord) {
      const notes = chordNotes(bar.chord, s.arpOct || 5, tr);
      const pat = s.arp;
      const idx = pat[st % pat.length];
      if (idx !== '.') osc('sq12', freq(notes[parseInt(idx, 10) % notes.length]), t, sd * 0.8, s.arpVol || 0.03, bus, { decay: 0.05, sus: 0.3 });
    }
    // davul
    const dr = s.drums ? s.drums[(k % (s.drums.length))] : '.';
    const inten = c.intensity || 0;
    if (dr === 'k' || (inten > 0.5 && st % 4 === 0)) { osc('sine', 120, t, 0.12, s.kickVol || 0.22, bus, { slide: 45, slideT: 0.1 }); }
    if (dr === 's') noise(t, 0.12, (s.snareVol || 0.06), bus, { f: 1800 });
    if (dr === 'h' || (inten > 0.3 && st % 2 === 1)) noise(t, 0.03, (s.hatVol || 0.025), bus, { f: 7000 });
  }

  function transpose(n, tr) {
    if (!tr) return n;
    const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
    if (!m) return n;
    return NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 + tr;
  }

  const CH = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7], add9: [0, 4, 7, 14], dim: [0, 3, 6] };
  function chordNotes(ch, oct, tr) {
    const m = /^([A-G][#b]?)(.*)$/.exec(ch);
    const root = NOTE[m[1]] + (oct + 1) * 12 + (tr || 0);
    return (CH[m[2]] || CH['']).map((x) => root + x);
  }

  // daktilo blip'i: karakter başına farklı perde
  const VOICE = { kralice: { f: 420, wave: 'triangle' }, puntur: { f: 980, wave: 'sq25' }, zipzip: { f: 300, wave: 'sq50' }, hu: { f: 360, wave: 'triangle' }, isil: { f: 1240, wave: 'sine' }, bora: { f: 250, wave: 'sq12' }, disi: { f: 760, wave: 'sq25' }, erkek: { f: 640, wave: 'sq25' }, anlatici: { f: 520, wave: 'triangle' } };
  A.blip = function (who) { const v = VOICE[who] || VOICE.anlatici; A.sfx('blip', { f: v.f * (0.94 + Math.random() * 0.12), wave: v.wave }); };
})();
