/* Bee & Bloom — soru sistemi: saf mantık (uyum, tepkiler) + oyun içi soru akışı (QFlow). */
(function (root) {
  'use strict';
  const BB = root.BB;

  // ------------------------------------------------------------ saf mantık (Node'da da çalışır)
  BB.SPEAKERS_LIST = ['kralice', 'puntur', 'zipzip', 'hu', 'isil', 'bora'];
  const Q = {
    get(id) { return BB.QUESTIONS.find((q) => q.id === id) || null; },
    nOpts(q) { return q.type === 'K' ? 2 : 4; },
    ctx(q, names) {
      const c = { p1: names[0], p2: names[1] };
      if (q.type === 'T') { c.sub = names[q.subject || 0]; c.gue = names[1 - (q.subject || 0)]; }
      return c;
    },
    options(q, names) { return q.opts.map((o) => BB.fmt(o, { p1: names[0], p2: names[1] })); },
    ask(q, names) { return BB.fmt(q.ask, Q.ctx(q, names)); },
    match(rec) { return !!rec && rec.a === rec.b; },
    // tepki metni
    reaction(q, rec, names) {
      const c = Q.ctx(q, names);
      if (q.type === 'T') return BB.fmt(rec.a === rec.b ? q.right : q.wrong, c);
      if (q.type === 'K') {
        if (rec.a === rec.b) { c.secilen = names[rec.a]; return BB.fmt(q.same, c); }
        // a: 1. oyuncunun seçimi (0 = kendisi), b: 2. oyuncunun (1 = kendisi)
        return BB.fmt(rec.a === 1 && rec.b === 0 ? q.other : q.self, c);
      }
      const sp = q.special && q.special[rec.a + ',' + rec.b];
      if (sp) return BB.fmt(sp, c);
      return BB.fmt(rec.a === rec.b ? q.same : q.diff, c);
    },
    // damga: aynı / farklı / bildin / ıska
    stamp(q, rec) {
      if (q.type === 'T') return rec.a === rec.b ? 'BİLDİN!' : 'ISKA!';
      if (q.type === 'K' && rec.a !== rec.b) return rec.a === 1 ? 'BİRBİRİNİZİ!' : 'KENDİNİZİ!';
      return rec.a === rec.b ? 'AYNI!' : 'FARKLI!';
    },
    // uyum % = (aynı cevaplar + doğru tahminler) / eşleştirilebilir soru sayısı
    uyum(answers) {
      let total = 0, ok = 0;
      for (const id of Object.keys(answers || {})) {
        const q = Q.get(id);
        if (!q) continue;
        total++;
        if (Q.match(answers[id])) ok++;
      }
      return { ok, total, pct: total ? Math.round((ok / total) * 100) : 0 };
    },
    // soru → seçim metinleri (defter/kart için)
    answerText(q, rec, names) {
      const opts = Q.options(q, names);
      return { a: opts[rec.a], b: opts[rec.b] };
    },
    order() { return BB.QUESTIONS.slice().sort((x, y) => x.level - y.level); },
  };
  BB.Q = Q;

  if (typeof window === 'undefined') return;

  // ------------------------------------------------------------ oyun içi akış
  const W = BB.W, H = BB.H;
  const F = {
    active: false, blocking: true, phase: null, q: null, qi: -1, play: null, t: 0,
    sel: [-1, -1], locked: [false, false], rec: null,
  };
  BB.QFlow = F;

  const names = () => BB.Game.names;
  // duraklatma yalnız açık soruda (arılar uçarken) güvenli; gizli seçimde simülasyon zaten durur
  F.canPause = function () { return F.active && F.phase === 'open'; };
  const keysOf = (i) => BB.Input.KEYS.p[i];

  F.start = function (play, p) {
    const w = play.world;
    F.play = play; F.world = w; F.t = 0;
    if (p.type === 'openAnswer') {
      w.resolvePending();
      F.q = Q.get(p.qid); F.qi = p.qi;
      F.active = true; F.blocking = true;
      F.finishPicks(p.picks[0], p.picks[1]);
      return;
    }
    const q = Q.get(p.qid);
    if (!q) { w.resolvePending(); w.resolveQuestion(p.qi); return; }
    F.q = q; F.qi = p.qi; F.active = true; F.blocking = true;
    F.sel = [-1, -1]; F.locked = [false, false]; F.rec = null;
    F.phase = 'intro';
    BB.Audio.play('kamp', { fade: 0.8 });
    BB.SCENES.__qintro = [{ say: q.who, face: 'talk', text: Q.ask(q, names()) }];
    BB.Story.start('__qintro', w, () => {
      if (q.type === 'A') {
        w.resolvePending();
        w.startOpen(p.qi);
        F.phase = 'open'; F.blocking = false;
        BB.Render.openLabels = Q.options(q, names());
        BB.Audio.play(BB.Game.themeMusic(F.play.def));
      } else {
        F.phase = 'warn1'; F.t = 0;
      }
    });
  };

  // T: önce seçen (subject), sonra tahmin eden; G/K: önce 1. oyuncu
  function order() { const q = F.q; if (q.type === 'T') { const s = q.subject || 0; return [s, 1 - s]; } return [0, 1]; }

  F.update = function (dt) {
    F.t += dt;
    const I = BB.Input;
    const q = F.q;
    if (F.phase === 'open') return;
    if (F.phase === 'warn1' || F.phase === 'warn2') {
      if (F.t > 0.4 && I.confirm()) { BB.Audio.sfx('select'); F.phase = F.phase === 'warn1' ? 'pick1' : 'pick2'; F.t = 0; }
      return;
    }
    if (F.phase === 'pick1' || F.phase === 'pick2') {
      const who = order()[F.phase === 'pick1' ? 0 : 1];
      const k = keysOf(who);
      const n = Q.nOpts(q);
      for (let i = 0; i < n; i++) if (I.hit(k.pick[i])) {
        if (F.sel[who] === i && F.t > 0.15) { lock(who); return; }
        F.sel[who] = i; BB.Audio.sfx('move');
      }
      // yön tuşlarıyla da seçilebilir
      // onay yalnız sıradaki oyuncunun eylem tuşuyla (ya da aynı harfe ikinci basış)
      if (F.sel[who] >= 0 && I.hit(k.action)) { lock(who); return; }
      return;
    }
    if (F.phase === 'chosen') {
      if (F.t > 0.7) {
        if (F.locked[0] && F.locked[1]) F.finishPicks(F.sel[0], F.sel[1]);
        else { F.phase = 'warn2'; F.t = 0; }
      }
      return;
    }
    if (F.phase === 'reveal') {
      if (F.t > 1.6 && (I.confirm() || F.t > 4)) {
        F.phase = 'react';
        BB.SCENES.__qreact = [{ say: q.who, face: 'happy', text: Q.reaction(q, F.rec, names()) }];
        BB.Story.start('__qreact', F.world, () => { F.phase = 'drop'; F.t = 0; BB.Audio.sfx('drop_honey'); });
      }
      return;
    }
    if (F.phase === 'drop') {
      if (F.t > 0.9) F.end();
    }
  };

  function lock(who) {
    F.locked[who] = true; F.phase = 'chosen'; F.t = 0;
    BB.Audio.sfx('pick');
  }

  F.finishPicks = function (a, b) {
    const q = F.q;
    F.rec = { a, b, type: q.type };
    if (BB.Save) BB.Save.setAnswer(q.id, { a, b, type: q.type, level: q.level });
    F.phase = 'reveal'; F.t = 0;
    BB.Audio.sfx(Q.match(F.rec) ? 'match' : 'diff');
  };

  F.end = function () {
    const w = F.world;
    if (w.pending) w.resolvePending();
    w.resolveQuestion(F.qi);
    BB.Render.openLabels = null;
    F.active = false; F.phase = null;
    if (F.play) F.play.drops = Object.keys(BB.Save.cur ? BB.Save.cur.answers : {}).length;
    BB.Audio.play(BB.Game.themeMusic(F.play.def), { fade: 1 });
    if (BB.Save) BB.Save.autosave('answer');
  };

  // ------------------------------------------------------------ çizim
  F.draw = function (ctx) {
    const Gfx = BB.Gfx;
    const q = F.q;
    if (!q) return;
    const nm = names();
    if (F.phase === 'open') {
      // üst şerit: soru + yönerge
      Gfx.panel(ctx, 70, 28, W - 140, 30, 'rgba(43,26,16,0.8)', '#ffd23c');
      Gfx.text(ctx, q.text, W / 2, 30, { color: 'honey', align: 'center' });
      Gfx.text(ctx, 'İkiniz de bir çiçeğe uçun ve içinde bekleyin.', W / 2, 43, { color: 'cream', align: 'center' });
      return;
    }
    if (F.phase === 'intro' || F.phase === 'react') return;
    Gfx.rect(ctx, 0, 0, W, H, 'rgba(25,14,10,0.78)');
    const ord = order();
    if (F.phase === 'warn1' || F.phase === 'warn2') {
      const picker = ord[F.phase === 'warn1' ? 0 : 1], other = 1 - picker;
      const T = q.type === 'T';
      const hideWho = T && F.phase === 'warn2' ? null : nm[other];
      Gfx.panel(ctx, W / 2 - 150, 54, 300, 130, '#fff4dc', '#3b2516');
      if (hideWho) {
        Gfx.text(ctx, hideWho + ' ekrana bakmasın!', W / 2, 64, { color: 'red', align: 'center', scale: 2 });
        Gfx.sprScaled(ctx, BB.Game.roles[other] + '_face_shy', 0, W / 2 - 16, 92, 2);
        Gfx.text(ctx, '(gözlerini kapatsın ya da arkasını dönsün)', W / 2, 128, { color: 'gray', align: 'center' });
      } else {
        Gfx.text(ctx, 'Tahmin zamanı!', W / 2, 64, { color: 'honeyD', align: 'center', scale: 2 });
        Gfx.text(ctx, nm[picker] + ', sence ' + nm[other] + ' hangisini seçti?', W / 2, 100, { color: 'ink', align: 'center', maxW: 280 });
      }
      if (Math.floor(F.t * 2) % 2) Gfx.text(ctx, nm[picker] + ' hazırsa Enter', W / 2, 160, { color: 'honeyD', align: 'center' });
      return;
    }
    if (F.phase === 'pick1' || F.phase === 'pick2' || F.phase === 'chosen') {
      const stage = F.phase === 'chosen' ? (F.locked[ord[1]] ? 1 : 0) : (F.phase === 'pick1' ? 0 : 1);
      const who = ord[stage];
      const k = keysOf(who).names.pick;
      const opts = Q.options(q, nm);
      const col = BB.Game.roles[who] === 'disi' ? 'pink' : 'blue';
      Gfx.panel(ctx, 24, 18, W - 48, 226, '#fff4dc', '#3b2516');
      let title = q.text;
      if (q.type === 'T') title = BB.fmt(stage === 0 ? '{sub}, kendin için seç:' : '{gue}, {sub} ne seçti?', Q.ctx(q, nm)) + ' ' + q.text;
      Gfx.text(ctx, title, W / 2, 26, { color: 'ink', align: 'center', maxW: W - 70 });
      Gfx.text(ctx, 'Sıra: ' + nm[who], W / 2, 52, { color: col, align: 'center', scale: 2 });
      if (F.phase === 'chosen') {
        Gfx.text(ctx, nm[who] + ' seçti ✓', W / 2, 120, { color: 'green', align: 'center', scale: 2 });
        return;
      }
      opts.forEach((o, i) => {
        const y = 86 + i * 34;
        const on = F.sel[who] === i;
        Gfx.panel(ctx, 70, y, W - 140, 28, on ? '#ffd23c' : '#ffffff', '#3b2516');
        Gfx.key(ctx, k[i], 78, y + 8);
        Gfx.text(ctx, o, 100, y + 7, { color: 'ink' });
        if (on) Gfx.text(ctx, '← tekrar bas ya da ' + keysOf(who).names.action + ': onayla', W - 78, y + 7, { color: 'honeyD', align: 'right' });
      });
      Gfx.text(ctx, 'Seçmek için harf tuşuna bas.', W / 2, 228, { color: 'gray', align: 'center' });
      return;
    }
    if (F.phase === 'reveal' || F.phase === 'drop') {
      const rec = F.rec;
      const opts = Q.options(q, nm);
      const k = Math.min(1, F.t * 1.8);
      Gfx.text(ctx, q.text, W / 2, 16, { color: 'honey', align: 'center', maxW: W - 40, outline: 'shadow' });
      for (let i = 0; i < 2; i++) {
        const x = W / 2 - 120 + i * 240, pick = i === 0 ? rec.a : rec.b;
        const stg = k < 0.5 ? 0 : 1;
        Gfx.sprScaled(ctx, 'choice' + (pick % 4), stg, x - 16, 50 + (1 - k) * 20, 2);
        const role = BB.Game.roles[i];
        let lbl = nm[i];
        if (q.type === 'T') lbl = i === (q.subject || 0) ? nm[i] + ' seçti' : nm[i] + ' tahmini';
        Gfx.text(ctx, lbl, x, 120, { color: role === 'disi' ? 'pink' : 'blue', align: 'center', outline: 'shadow' });
        if (k >= 0.5) Gfx.text(ctx, opts[pick], x, 134, { color: 'white', align: 'center', maxW: 200, outline: 'shadow' });
      }
      if (F.t > 0.7) {
        const st = Q.stamp(q, rec), good = Q.match(rec);
        const s = Math.min(1, (F.t - 0.7) * 4);
        Gfx.text(ctx, st, W / 2, 168 - (1 - s) * 10, { color: good ? 'gold' : 'pink', align: 'center', scale: 3, outline: 'shadow' });
      }
      if (F.phase === 'drop') {
        const u = Math.min(1, F.t / 0.9);
        const x = BB.lerp(W / 2, 14, u), y = BB.lerp(150, 12, u) - Math.sin(u * Math.PI) * 40;
        Gfx.spr(ctx, 'honeydrop', 0, x - 4, y - 5);
      } else if (F.t > 1.6) Gfx.text(ctx, 'Enter', W / 2, 230, { color: 'cream', align: 'center' });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
