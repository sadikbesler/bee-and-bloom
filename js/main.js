/* Bee & Bloom — açılış, sabit adımlı ana döngü (60 Hz), ekran yönetimi ve oyun (bölüm) ekranı. */
(function () {
  'use strict';
  const BB = window.BB;
  const Gfx = BB.Gfx, Input = BB.Input, Render = BB.Render, Story = BB.Story;
  const W = BB.W, H = BB.H;

  const Game = {
    names: ['Arı 1', 'Arı 2'], roles: ['disi', 'erkek'], round: 1,
    screen: null, slot: null, params: new URLSearchParams(location.search),
    frameMs: [], stepMs: [],
  };
  BB.Game = Game;

  Game.go = function (screen, arg) {
    if (Game.screen && Game.screen.leave) Game.screen.leave();
    Game.screen = screen;
    Input.clearHits();
    if (screen.enter) screen.enter(arg || {});
  };

  Game.levelIndex = (id) => BB.LEVELS.findIndex((l) => l.id === id);
  Game.themeMusic = (def) => def.music || { bahar: 'bahar', yaz: 'yaz', sonbahar: 'sonbahar', magara: 'magara', kis: 'kis', kovan: 'kovan' }[def.theme] || 'bahar';

  // ------------------------------------------------------------ olay → ses
  function sfxFor(ev, w) {
    const A = BB.Audio;
    const onScreen = (x) => x === undefined || (x > Render.cam.x - 40 && x < Render.cam.x + W + 40);
    switch (ev.type) {
      case 'jump': A.sfx('jump', ev); break;
      case 'land': if (ev.v > 90) A.sfx('land'); break;
      case 'qDone': A.sfx('drop_honey'); break;
      case 'splash': case 'pulse': case 'bridgeOn': case 'crack': case 'icicleShake': if (onScreen(ev.x)) A.sfx(ev.type, ev); break;
      case 'collapseStart': A.sfx('collapse'); break;
      case 'raceWin': A.sfx('win'); break;
      case 'won': A.sfx('win'); break;
      case 'lilySink': case 'tired': case 'timerEnd': case 'strain': case 'grab': case 'talk': case 'bounce': case 'pollen': case 'secret': case 'nectar': case 'checkpoint':
      case 'plate': case 'gate': case 'flower': case 'pickup': case 'drop': case 'carry': case 'release': case 'call': case 'stuck': case 'free': case 'webBreak':
      case 'death': case 'respawn': case 'crumble': case 'shatter': case 'bloom': case 'rune': case 'seqDone': case 'raceGo':
        A.sfx(ev.type === 'checkpoint' && !ev.first ? 'pick' : ev.type, ev); break;
    }
    void w;
  }
  Game.sfxFor = sfxFor;

  // ------------------------------------------------------------ oyun ekranı
  const Play = {
    enter(opt) {
      this.opt = opt;
      this.idx = opt.level;
      this.def = BB.LEVELS[this.idx];
      const S = BB.Save;
      const st = S && S.cur ? S.cur : null;
      this.world = new BB.World(this.def, {
        roles: Game.roles, round: Game.round,
        answered: st ? Object.keys(st.answers) : [],
        checkpoint: opt.checkpoint, taken: opt.taken, secret: opt.secret,
        perm: opt.perm, cps: opt.cps, seen: opt.seen,
      });
      if (opt.deaths) this.world.stats.deaths = opt.deaths;
      if (opt.time) this.world.stats.time = opt.time;
      Render.setLevel(this.world);
      BB.Audio.play(Game.themeMusic(this.def));
      this.overlay = null; this.ended = false;
      this.titleT = 4; this.flapCd = [0, 0];
      this.drops = st ? Object.keys(st.answers).length : 0;
      if (S) S.onLevelStart(this);
      if (opt.checkpoint === undefined || opt.checkpoint === null) {
        if (this.def.scenes && this.def.scenes.start && !opt.noScene) Story.start(this.def.scenes.start, this.world, () => {});
      }
    },
    leave() { Story.active = false; if (BB.QFlow) BB.QFlow.active = false; BB.Audio.setIntensity(0); },
    pause() { this.overlay = BB.UI.makePause(this); BB.Audio.sfx('select'); if (BB.Save) BB.Save.autosave('pause'); },
    update(dt) {
      const w = this.world;
      if (this.titleT > 0) this.titleT -= dt;
      if (!this.overlay && BB.Save) BB.Save.tick(dt);   // oyun süresi: diyalog ve sorular dahil, duraklatma hariç
      if (this.overlay) { this.overlay.update(dt); Render.step(dt); return; }
      if (Story.active) { Story.update(dt); Render.step(dt); return; }
      if (BB.QFlow && BB.QFlow.active) {
        if (Input.hit('Escape') && BB.QFlow.canPause && BB.QFlow.canPause()) { this.pause(); return; }
        BB.QFlow.update(dt); Render.step(dt); if (!BB.QFlow.blocking) this.simStep(dt); return; }
      if (Input.hit('Escape')) { this.pause(); return; }
      this.simStep(dt);
    },
    simStep(dt) {
      const w = this.world;
      w.step([Input.player(0), Input.player(1)]);
      for (const ev of w.events) { Render.event(ev); sfxFor(ev, w); this.onEvent(ev); }
      w.events.length = 0;
      // kanat vızıltısı
      for (const b of w.bees) {
        if (this.flapCd[b.id] > 0) this.flapCd[b.id] -= dt;
        if (b.flapping && this.flapCd[b.id] <= 0) { BB.Audio.sfx('flap', { id: b.id }); this.flapCd[b.id] = 0.13; }
      }
      Render.step(dt);
      if (w.pending) this.handlePending(w.pending);
      if (w.state === 'won' && !this.ended && w.stateT > 0.5) this.endLevel();
    },
    onEvent(ev) {
      const S = BB.Save;
      if (!S) return;
      if (ev.type === 'checkpoint') S.autosave('checkpoint');
      if (ev.type === 'pollen' || ev.type === 'secret') S.markProgress(this);
      if (ev.type === 'qDone') this.drops = Object.keys(S.cur.answers).length;
      if (ev.type === 'qAlready') Render.float('Bu soruyu zaten yanıtladınız ✓', ev.x, ev.y - 26, 'honey', 2);
      if (ev.type === 'collapseStart') BB.Audio.setIntensity(1);
      if (ev.type === 'collapseEnd') BB.Audio.setIntensity(0);
      if (ev.type === 'respawn') { const c = this.world.e.collapse; BB.Audio.setIntensity(c.length && c.some((k) => k.on) ? 1 : 0); }
    },
    handlePending(p) {
      const w = this.world;
      if (p.type === 'scene') {
        if (!Story.start(p.id, w, () => w.resolvePending())) w.resolvePending();
      } else if (p.type === 'question' || p.type === 'openAnswer') {
        if (BB.QFlow) BB.QFlow.start(this, p);
        else { w.resolvePending(); w.resolveQuestion(p.qi); }
      }
    },
    endLevel() {
      this.ended = true;
      const last = this.idx >= BB.LEVELS.length - 1 && this.def.id === 18;
      const go = last ? () => BB.Final.begin() : () => { this.overlay = BB.UI.makeLevelEnd(this); };
      if (BB.Save) BB.Save.onLevelEnd(this);
      if (this.def.scenes && this.def.scenes.end) Story.start(this.def.scenes.end, this.world, go); else go();
    },
    draw(ctx) {
      Render.draw(ctx);
      Story.drawActors(ctx, Render.ox, Render.oy);
      if (!Story.active || !Story.line) {
        Render.drawHUD(ctx, this.world, { drops: this.drops, title: this.def.id + '. ' + this.def.name, titleT: this.titleT });
        if (this.def.id <= 3 && !(BB.QFlow && BB.QFlow.active)) Render.drawKeyHints(ctx, this.world, this.def.id === 1 ? 1 : Math.max(0, 1 - this.world.stats.time / 40));
      }
      if (BB.QFlow && BB.QFlow.active) BB.QFlow.draw(ctx);
      Story.draw(ctx);
      if (this.overlay) this.overlay.draw(ctx);
      if (this.world.state === 'dying' || this.world.state === 'respawn') {
        const w = this.world;
        // kısa iris geçişi (düz renk)
        const k = w.state === 'dying' ? Math.max(0, (0.35 - w.stateT) / 0.35) : Math.max(0, w.stateT / 0.45);
        if (k > 0) { ctx.globalAlpha = Math.min(1, k) * 0.85; Gfx.rect(ctx, 0, 0, W, H, '#2b1a10'); ctx.globalAlpha = 1; }
      }
      BB.UI.drawToast(ctx);   // kayıt hatası gibi uyarılar oyun sırasında da görünsün
    },
  };
  Game.Play = Play;

  Game.startLevel = function (idx, opt) { Game.go(Play, Object.assign({ level: idx }, opt || {})); };

  // ------------------------------------------------------------ ana döngü
  let last = 0, acc = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    Game.drawDt = Math.min(dt, 0.1);   // çizimde ilerleyen süreler kare hızından bağımsız olsun
    const speed = Game.speed || 1;   // testlerde hızlandırma için
    acc += dt * speed;
    let n = 0;
    const t0 = performance.now();
    while (acc >= BB.DT - 0.0005 && n < 4 * speed) {
      Game.screen.update(BB.DT);
      Input.endSimStep();
      Input.clearHits();
      acc -= BB.DT; n++;
    }
    if (n >= 4 * speed) acc = 0;
    const t1 = performance.now();
    Game.screen.draw(Gfx.ctx);
    if (Game.fsHint > 0) { Game.fsHint -= dt; }
    const t2 = performance.now();
    if (n) { Game.stepMs.push((t1 - t0) / n); if (Game.stepMs.length > 240) Game.stepMs.shift(); }
    Game.frameMs.push(t2 - t1); if (Game.frameMs.length > 240) Game.frameMs.shift();
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------ açılış
  function boot() {
    BB.LEVELS.sort((a, b) => a.id - b.id);
    Gfx.init(document.getElementById('c'));
    Input.init();
    Input.listeners.push((code) => {
      BB.Audio.unlock();
      if (Input.textMode) return;
      if (code === 'KeyF' && !(Game.screen && Game.screen.noHotkeys)) Game.toggleFullscreen();
      if (code === 'KeyM' && !(Game.screen && Game.screen.noHotkeys)) { const m = BB.Audio.toggleMute(); if (BB.Save) BB.Save.setSetting('muted', m); }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (Game.screen === Play && !Play.overlay && !Story.active) Play.pause(); if (BB.Save) BB.Save.autosave('hidden'); }
    });
    window.addEventListener('blur', () => { if (Game.screen === Play && !Play.overlay && !Story.active && !(BB.QFlow && BB.QFlow.active && !(BB.QFlow.canPause && BB.QFlow.canPause()))) Play.pause(); });
    window.addEventListener('beforeunload', () => { if (BB.Save) BB.Save.autosave('unload'); });
    if (BB.Save) BB.Save.init();
    const p = Game.params;
    if (p.get('kum')) {
      // geliştirme kum havuzu (oyuna dahil değil)
      const s = document.createElement('script');
      s.src = '_gelistirme/kum_havuzu.js';
      s.onload = () => {
        BB.LEVELS.push(BB.KUM);
        Game.names = ['Ayşe', 'Mert'];
        BB.Save.useTemp(Game.names, Game.roles);
        Game.startLevel(BB.LEVELS.length - 1, { noScene: true });
        requestAnimationFrame(frame);
      };
      document.body.appendChild(s);
      return;
    }
    if (p.get('izle')) {
      // izleme modu (geliştirme): bölümleri çözüm kayıtlarıyla oynatır; diyaloglar Enter ile, gizli sorular oyuncularca cevaplanır
      const s = document.createElement('script');
      s.src = '_gelistirme/cikti/kayitlar.js';
      s.onerror = () => { document.body.insertAdjacentHTML('beforeend', '<p style="color:#fff;font:16px sans-serif;position:fixed;top:8px;left:8px">Önce: node _gelistirme/solve.js && node _gelistirme/izle_hazirla.js</p>'); };
      s.onload = () => {
        const recs = BB.KAYITLAR || {};
        let rec = null, i = 0;
        const orig = Input.player;
        Input.player = function (k) {
          if (!rec) return orig(k);
          const v = rec[i] ? rec[i][k] : 0;
          if (k === 1) i++;
          return { left: !!(v & 1), right: !!(v & 2), flap: !!(v & 4), flapPressed: !!(v & 8), action: !!(v & 16), actionPressed: !!(v & 32) };
        };
        const origStart = Game.startLevel;
        Game.startLevel = function (idx, opt) { const L = BB.LEVELS[idx]; rec = L ? recs[L.id] || null : null; i = 0; return origStart.call(Game, idx, opt); };
        Game.speed = Math.max(1, Math.min(4, parseInt(p.get('hiz'), 10) || 1));
        Game.names = [p.get('p1') || 'Ayşe', p.get('p2') || 'Mert'];
        BB.Save.useTemp(Game.names, Game.roles);
        Game.startLevel(Math.max(0, Game.levelIndex(parseInt(p.get('izle'), 10) || 1)));
        requestAnimationFrame(frame);
      };
      document.body.appendChild(s);
      return;
    }
    if (p.get('final') || p.get('kart') || p.get('defter') || p.get('jenerik')) {
      // test girişi: 40 cevabı dolu geçici kayıtla finale/karta atla
      Game.names = [p.get('p1') || 'Ayşe', p.get('p2') || 'Mert'];
      BB.Save.useTemp(Game.names, Game.roles);
      const d = BB.Save.cur;
      BB.QUESTIONS.forEach((q, i) => { const n = q.type === 'K' ? 2 : 4; d.answers[q.id] = { a: i % n, b: (i % 3 === 0 ? (i + 1) : i) % n, type: q.type }; });
      d.playTime = 4 * 3600 + 23 * 60; d.totalDeaths = 57; d.finished = true; d.finishedAt = Date.now();
      for (let i = 1; i <= 18; i++) { d.pollen[i] = 20; if (i % 3) d.secrets[i] = true; }
      if (p.get('final')) BB.Final.begin();
      else if (p.get('kart')) Game.go(BB.Final.CardScreen, { back: BB.UI.Menu });
      else if (p.get('defter')) Game.go(BB.Final.Notebook, { back: BB.UI.Menu });
      else Game.go(BB.Final.Credits, {});
      requestAnimationFrame(frame);
      return;
    }
    if (p.get('level')) {
      const id = parseInt(p.get('level'), 10);
      Game.names = [p.get('p1') || 'Ayşe', p.get('p2') || 'Mert'];
      if (BB.Save) BB.Save.useTemp(Game.names, Game.roles);
      Game.startLevel(Math.max(0, Game.levelIndex(id)), { noScene: p.get('scene') === '0' });
    } else Game.go(BB.UI.Title);
    requestAnimationFrame(frame);
  }

  Game.toggleFullscreen = function () {
    const d = document;
    try {
      if (!d.fullscreenElement && !d.webkitFullscreenElement) { const el = d.documentElement; const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(() => {}); }
      else { const r = (d.exitFullscreen || d.webkitExitFullscreen).call(d); if (r && r.catch) r.catch(() => {}); }
    } catch (e) { /* tam ekran desteklenmiyor */ }
  };

  Game.boot = boot;
  window.addEventListener('load', boot);
})();
