/* Bee & Bloom — menüler ve arayüz ekranları. */
(function () {
  'use strict';
  const BB = window.BB;
  const Gfx = BB.Gfx, Input = BB.Input, Audio = BB.Audio;
  const W = BB.W, H = BB.H;
  const UI = {};
  BB.UI = UI;
  const Game = () => BB.Game;
  const Save = () => BB.Save;

  const WORLDS = [
    { n: 1, name: 'Çiçek Çayırı', season: 'İlkbahar', theme: 'bahar', sub: 'Uyanan çayırda ilk kanat çırpışları' },
    { n: 2, name: 'Yaz Gölü', season: 'Yaz', theme: 'yaz', sub: 'Güneş, nilüferler ve bir kral' },
    { n: 3, name: 'Kehribar Orman', season: 'Sonbahar', theme: 'sonbahar', sub: 'Yağmur, rüzgâr ve bilge bir baykuş' },
    { n: 4, name: 'Mantar Mağarası', season: 'Gece', theme: 'magara', sub: 'Karanlıkta yolu birlikte bulmak' },
    { n: 5, name: 'Kar Zirvesi', season: 'Kış', theme: 'kis', sub: 'Soğukta yan yana durmak' },
    { n: 6, name: 'Kovan\'ın Kalbi', season: 'Bütün mevsimler', theme: 'kovan', sub: 'Balın doğduğu yer' },
  ];
  UI.WORLDS = WORLDS;

  // ------------------------------------------------------------ ortak yardımcılar
  const QUIPS = {
    fall: ['Hoppala!', 'Pıt!', 'Vınnn… pof!'], thorn: ['Ay diken!', 'Vıjj!', 'Ayy!'], water: ['Şıpırt!', 'Blup blup!', 'Islandık!'],
    web: ['Yapış yapış!', 'Ağ oldu bu!'], spider: ['Örümcek!', 'Iyy!'], drip: ['Şap!', 'Damla!'], icicle: ['Tıng!', 'Buz!'],
    cold: ['Brrr!', 'Dondum!'], collapse: ['Çatırt!', 'Kaç!'],
  };
  let quipN = 0;
  UI.deathQuip = function (cause) { const l = QUIPS[cause] || ['Pof!']; return l[(quipN++) % l.length]; };

  UI.keyCtx = function () {
    const g = Game(), k = Input.KEYS.p;
    return {
      p1: g.names[0], p2: g.names[1],
      k1sol: k[0].names.left, k1sag: k[0].names.right, k1kanat: k[0].names.flap, k1eylem: k[0].names.action,
      k2sol: k[1].names.left, k2sag: k[1].names.right, k2kanat: k[1].names.flap, k2eylem: k[1].names.action,
      disi: g.names[g.roles.indexOf('disi')], erkek: g.names[g.roles.indexOf('erkek')],
    };
  };
  UI.signText = function (s) { return BB.fmt(s.text, UI.keyCtx()); };

  function menuList(ctx, items, sel, x, y, opts) {
    opts = opts || {};
    const lh = opts.lh || 16;
    items.forEach((it, i) => {
      const yy = y + i * lh;
      const label = typeof it === 'string' ? it : it.label;
      const dis = it && it.disabled;
      const on = i === sel;
      if (on) {
        const w = BB.Font.measure(label) + 20;
        Gfx.panel(ctx, x - w / 2, yy - 2, w, 15, '#ffd23c', '#3b2516');
        Gfx.spr(ctx, (Game().roles[0] || 'disi') + '_fly', Math.floor(performance.now() / 80) % 4, x - w / 2 - 18, yy - 4);
      }
      Gfx.text(ctx, label, x, yy, { color: dis ? 'mute' : on ? 'ink' : (opts.color || 'cream'), align: 'center', outline: on ? null : 'shadow' });
    });
  }
  function navList(sel, n) {
    if (Input.up()) { Audio.sfx('move'); return (sel + n - 1) % n; }
    if (Input.downNav()) { Audio.sfx('move'); return (sel + 1) % n; }
    return sel;
  }

  // canlı arka plan: bahar çayırı + uçuşan arılar
  const bgBees = [];
  for (let i = 0; i < 7; i++) bgBees.push({ x: Math.random() * W, y: 40 + Math.random() * 150, v: 14 + Math.random() * 18, ph: Math.random() * 6, role: i % 2 ? 'erkek' : 'disi' });
  let bgLayers = null, bgT = 0;
  UI.drawMenuBg = function (ctx, theme, dim) {
    theme = theme || 'bahar';
    if (!bgLayers || bgLayers.theme !== theme) bgLayers = { theme, L: BB.Tiles.makeBackground(theme).map((L) => ({ c: Gfx.pcToCanvas(L.pc), f: L.f, wrap: L.wrap })) };
    bgT += BB.Game.drawDt || 1 / 60;
    for (const L of bgLayers.L) {
      if (!L.wrap) { ctx.drawImage(L.c, 0, 0); continue; }
      const px = Math.floor(bgT * 40 * L.f) % L.c.width;
      ctx.drawImage(L.c, -px, 0); ctx.drawImage(L.c, -px + L.c.width, 0);
    }
    for (const b of bgBees) {
      b.x += b.v / 60; if (b.x > W + 20) { b.x = -20; b.y = 40 + Math.random() * 150; }
      const y = b.y + Math.sin(bgT * 2 + b.ph) * 6;
      Gfx.spr(ctx, b.role + '_fly', Math.floor(bgT * 12 + b.ph) % 4, b.x, y);
    }
    if (dim) { ctx.globalAlpha = dim; Gfx.rect(ctx, 0, 0, W, H, '#2b1a10'); ctx.globalAlpha = 1; }
  };

  // logo: "Bee & Bloom" (harfler zıplayarak gelir)
  UI.drawLogo = function (ctx, cx, y, t, k) {
    k = k || 3;
    const word = 'Bee & Bloom';
    const total = BB.Font.measure(word) * k;
    let x = cx - total / 2;
    let i = 0;
    for (const ch of word) {
      const d = Math.max(0, Math.min(1, (t - i * 0.07) * 3));
      const bounce = d < 1 ? (1 - d) * -30 : Math.sin((t - i * 0.07) * 3) * 1.2;
      if (d > 0) Gfx.text(ctx, ch, x, y + bounce, { color: ch === '&' ? 'pink' : 'honey', scale: k, outline: 'shadow' });
      x += BB.Font.adv(ch) * k;
      i++;
    }
    // bal damlası süsleri
    if (t > 1) {
      const dx = cx - total / 2 + 4 * k, dy = y + 9 * k;
      Gfx.rect(ctx, dx, dy, 2, 3 + Math.floor((t * 2) % 4), '#ffb32c');
      Gfx.rect(ctx, cx + total / 2 - 10 * k, dy, 2, 2 + Math.floor((t * 1.6) % 5), '#ffb32c');
    }
  };

  // bilgi kutusu (uyarılar)
  let toast = null;
  UI.toast = function (text, t) { toast = { text, t: t || 3 }; };
  UI.drawToast = function (ctx) {
    if (!toast) return;
    toast.t -= BB.Game.drawDt || 1 / 60;
    if (toast.t <= 0) { toast = null; return; }
    const lines = BB.Font.wrap(toast.text, 300);
    const h = lines.length * 12 + 8, w = 316;
    ctx.globalAlpha = Math.min(1, toast.t * 2);
    Gfx.panel(ctx, W / 2 - w / 2, H - h - 8, w, h, '#3b2516', '#ffd23c');
    lines.forEach((l, i) => Gfx.text(ctx, l, W / 2, H - h - 6 + i * 12, { color: 'cream', align: 'center' }));
    ctx.globalAlpha = 1;
  };

  // ------------------------------------------------------------ açılış
  UI.Title = {
    enter() { this.t = 0; },
    update(dt) {
      this.t += dt;
      if (this.t > 0.6 && (Input.anyKey || Input.confirm())) { Input.anyKey = false; Audio.unlock(); Audio.sfx('select'); Game().go(UI.Menu); }
      Input.anyKey = false;
    },
    draw(ctx) {
      UI.drawMenuBg(ctx, 'bahar', 0);
      UI.drawLogo(ctx, W / 2, 70, this.t, 4);
      if (this.t > 1.2 && Math.floor(this.t * 2) % 2) Gfx.text(ctx, 'Bir tuşa bas', W / 2, 170, { color: 'white', align: 'center', outline: 'shadow' });
      Gfx.text(ctx, 'designed by sadixck', W / 2, H - 16, { color: 'cream', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ ana menü
  UI.Menu = {
    enter() {
      this.sel = 0; this.t = 0;
      const slots = Save().list();
      const hasSave = slots.some((s) => !s.empty && !s.corrupt);
      const hasEnd = slots.some((s) => !s.empty && !s.corrupt && s.finished);
      this.items = [
        { label: 'Yeni Oyun', go: () => Game().go(UI.Slots, { mode: 'new' }) },
        { label: 'Nasıl Oynanır', go: () => Game().go(UI.Howto) },
        { label: 'Devam', disabled: !hasSave, go: () => Game().go(UI.Slots, { mode: 'continue' }) },
        { label: 'Bölümler', disabled: !hasSave, go: () => Game().go(UI.Slots, { mode: 'levels' }) },
        { label: 'Anılar', disabled: !hasEnd, go: () => Game().go(UI.Slots, { mode: 'memories' }) },
        { label: 'Ayarlar', go: () => Game().go(UI.Settings, { back: UI.Menu }) },
        { label: 'Yedek', go: () => Game().go(UI.Slots, { mode: 'backup' }) },
        { label: 'Jenerik', go: () => Game().go(BB.Final ? BB.Final.Credits : UI.Menu, { back: true }) },
      ];
      // ilk açılışta rehber seçili gelsin; kayıt varsa "Devam"
      this.sel = this.items.findIndex((it) => it.label === (hasSave ? 'Devam' : 'Nasıl Oynanır'));
      Audio.play('menu');
      if (Save().warning) UI.toast(Save().warning, 6);
    },
    update(dt) {
      this.t += dt;
      this.sel = navList(this.sel, this.items.length);
      if (Input.confirm()) {
        const it = this.items[this.sel];
        if (it.disabled) { Audio.sfx('back'); return; }
        Audio.sfx('select'); it.go();
      }
    },
    draw(ctx) {
      UI.drawMenuBg(ctx, 'bahar', 0.15);
      UI.drawLogo(ctx, W / 2, 26, 10, 3);
      Gfx.panel(ctx, W / 2 - 80, 84, 160, this.items.length * 16 + 16, 'rgba(43,26,16,0.55)', 'rgba(0,0,0,0)');
      menuList(ctx, this.items, this.sel, W / 2, 92);
      Gfx.text(ctx, '↑ ↓ seç · Enter onayla · F tam ekran · M ses', W / 2, H - 28, { color: 'white', align: 'center', outline: 'shadow' });
      Gfx.text(ctx, 'Bee & Bloom · designed by sadixck', W / 2, H - 14, { color: 'cream', align: 'center', outline: 'shadow' });
      UI.drawToast(ctx);
    },
  };

  // ------------------------------------------------------------ onay kutusu (üst katman)
  function confirmBox(ctx, text, yes) {
    Gfx.rect(ctx, 0, 0, W, H, 'rgba(20,10,8,0.6)');
    const lines = BB.Font.wrap(text, 260);
    const h = lines.length * 12 + 40;
    Gfx.panel(ctx, W / 2 - 140, H / 2 - h / 2, 280, h, '#fff4dc', '#3b2516');
    lines.forEach((l, i) => Gfx.text(ctx, l, W / 2, H / 2 - h / 2 + 8 + i * 12, { color: 'ink', align: 'center' }));
    const y = H / 2 + h / 2 - 20;
    Gfx.text(ctx, (yes ? '▶ ' : '  ') + 'Evet', W / 2 - 40, y, { color: yes ? 'red' : 'gray', align: 'center' });
    Gfx.text(ctx, (!yes ? '▶ ' : '  ') + 'Hayır', W / 2 + 40, y, { color: !yes ? 'ink' : 'gray', align: 'center' });
  }

  // ------------------------------------------------------------ slotlar
  UI.Slots = {
    enter(o) { this.mode = o.mode; this.sel = 0; this.confirm = null; this.refresh(); },
    refresh() { this.list = Save().list(); },
    update() {
      if (this.confirm) {
        if (Input.leftNav() || Input.rightNav()) { this.confirm.yes = !this.confirm.yes; Audio.sfx('move'); }
        if (Input.back()) { this.confirm = null; Audio.sfx('back'); return; }
        if (Input.confirm()) { const c = this.confirm; this.confirm = null; if (c.yes) c.fn(); else Audio.sfx('back'); }
        return;
      }
      if (Input.back()) { Audio.sfx('back'); Game().go(UI.Menu); return; }
      this.sel = navList(this.sel, 3);
      const s = this.list[this.sel];
      if ((Input.hit('Delete') || Input.hit('Backspace') || Input.hit('KeyX')) && !s.empty) {
        this.confirm = { yes: false, text: `${this.sel + 1}. slot silinsin mi? Bu geri alınamaz.`, fn: () => { Save().deleteSlot(s.slot); Audio.sfx('crumble'); this.refresh(); } };
        return;
      }
      if (this.mode === 'backup' && Input.hit('KeyI')) { this.importTo(s.slot); return; }
      if (!Input.confirm()) return;
      if (this.mode === 'new') {
        const go = () => { Audio.sfx('select'); Game().go(UI.Names, { slot: s.slot }); };
        if (s.empty) go();
        else if (s.corrupt) this.confirm = { yes: false, text: `${this.sel + 1}. slottaki kayıt bozuk. Üzerine yeni oyun başlasın mı?`, fn: go };
        else this.confirm = { yes: false, text: `${this.sel + 1}. slotta ${s.names[0]} & ${s.names[1]} kaydı var. Üzerine yeni oyun başlasın mı?`, fn: go };
      } else if (this.mode === 'backup') {
        if (s.empty || s.corrupt) { this.importTo(s.slot); return; }
        this.download(s.slot);
      } else {
        if (s.empty || s.corrupt) { Audio.sfx('back'); UI.toast(s.corrupt ? 'Bu slottaki kayıt bozuk; Yedek ekranından yükleyebilirsiniz.' : 'Bu slot boş.'); return; }
        if (this.mode === 'memories' && !s.finished) { Audio.sfx('back'); UI.toast('Bu kayıtta hikâye henüz bitmedi.'); return; }
        Audio.sfx('select');
        Save().use(s.slot, s.data);
        if (this.mode === 'levels') Game().go(UI.Levels);
        else if (this.mode === 'memories') Game().go(BB.Final.EndMenu);
        else UI.continueGame();
      }
    },
    download(slot) {
      const json = Save().exportJSON(slot);
      if (!json) { UI.toast('Bu slotta indirilecek kayıt yok.'); return; }
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `bee-and-bloom-kayit-slot${slot}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        UI.toast('Kayıt indirildi: ' + a.download);
        Audio.sfx('pick');
      } catch (e) { UI.toast('İndirme başarısız oldu.'); }
    },
    importTo(slot) {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          const r = Save().importJSON(String(rd.result), slot);
          if (r.ok) { UI.toast(`Kayıt ${slot}. slota yüklendi: ${r.data.names[0]} & ${r.data.names[1]}`); Audio.sfx('checkpoint'); this.refresh(); }
          else { UI.toast('Yüklenemedi: ' + r.why, 5); Audio.sfx('back'); }
        };
        rd.readAsText(f);
      };
      inp.click();
    },
    draw(ctx) {
      UI.drawMenuBg(ctx, 'bahar', 0.35);
      const title = { new: 'Yeni Oyun — slot seç', continue: 'Devam — slot seç', levels: 'Bölümler — slot seç', memories: 'Anılar — slot seç', backup: 'Yedek — slot seç' }[this.mode];
      Gfx.text(ctx, title, W / 2, 14, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      this.list.forEach((s, i) => {
        const y = 50 + i * 62, on = i === this.sel;
        Gfx.panel(ctx, 60, y, 360, 54, on ? '#fff4dc' : '#e8d8bc', on ? '#3b2516' : '#7a5a40');
        Gfx.text(ctx, (i + 1) + '.', 70, y + 4, { color: 'honeyD', scale: 2 });
        if (s.empty) Gfx.text(ctx, 'Boş slot', 100, y + 18, { color: 'gray' });
        else if (s.corrupt) Gfx.text(ctx, 'Bozuk kayıt: ' + s.why, 100, y + 18, { color: 'red', maxW: 300 });
        else {
          const lv = BB.LEVELS[s.level];
          Gfx.text(ctx, `${s.names[0]} & ${s.names[1]}`, 100, y + 4, { color: 'ink' });
          Gfx.text(ctx, `Bölüm ${lv ? lv.id + ' · ' + lv.name : '?'}${s.finished ? '  ★ bitti' : ''}`, 100, y + 17, { color: 'honeyD' });
          Gfx.text(ctx, `Süre ${BB.fmtTime(s.playTime)} · Bal damlası ${s.drops}/40`, 100, y + 30, { color: 'gray' });
          Gfx.text(ctx, BB.fmtStamp(s.updated), 410, y + 4, { color: 'gray', align: 'right' });
        }
      });
      const hint = this.mode === 'backup' ? 'Enter: kaydı indir (.json) · I: dosyadan yükle · X: sil · Esc: geri' : 'Enter: seç · X: slotu sil · Esc: geri';
      Gfx.text(ctx, hint, W / 2, H - 20, { color: 'white', align: 'center', outline: 'shadow' });
      if (this.confirm) confirmBox(ctx, this.confirm.text, this.confirm.yes);
      UI.drawToast(ctx);
    },
  };

  UI.continueGame = function () {
    const d = Save().cur;
    const c = d.current;
    const idx = Math.min(c.level, BB.LEVELS.length - 1);
    // hikâye bitmiş ve son bölümden sonra kalınmışsa: son menü (Anı Defteri / Kart / ikinci tur)
    const atEnd = d.atEnd !== undefined ? d.atEnd : (d.finished && c.checkpoint === null && idx === BB.LEVELS.length - 1);
    if (atEnd && BB.Final) { Game().go(BB.Final.EndMenu); return; }
    Game().startLevel(idx, { checkpoint: c.checkpoint, taken: c.taken, secret: c.secret, deaths: c.deaths, time: c.time, perm: c.perm, cps: c.cps, seen: c.seen });
  };

  // ------------------------------------------------------------ isim girişi
  const ALLOWED = /^[A-Za-zÇĞİÖŞÜçğıiöşüÂÎÛâîûÄËÏäëïÉÈÊéèêÁÀáàÓÒÔóòôÚÙúùÍÌíìÑñß0-9 .'\-]$/;
  UI.Names = {
    noHotkeys: true,
    enter(o) { this.slot = o.slot; this.step = 0; this.vals = ['', '']; this.err = ''; this.t = 0; Input.textMode = true; Input.takeTyped(); },
    leave() { Input.textMode = false; },
    update(dt) {
      this.t += dt;
      for (const ch of Input.takeTyped()) {
        const v = this.vals[this.step];
        if (ch === '\b') { this.vals[this.step] = Array.from(v).slice(0, -1).join(''); continue; }
        if (!ALLOWED.test(ch) || !BB.Font.has(ch)) { this.err = 'Bu karakter kullanılamıyor: ' + ch; Audio.sfx('back'); continue; }
        if (Array.from(v).length >= 12) { this.err = 'İsim en fazla 12 karakter olabilir.'; Audio.sfx('back'); continue; }
        this.vals[this.step] = v + ch; this.err = ''; Audio.sfx('blip', { f: 700 + Math.random() * 200 });
      }
      if (Input.back()) {
        Audio.sfx('back');
        if (this.step === 1) { this.step = 0; this.err = ''; } else Game().go(UI.Slots, { mode: 'new' });
        return;
      }
      if (Input.hit('Enter') || Input.hit('NumpadEnter')) {
        const v = this.vals[this.step].trim().replace(/\s+/g, ' ');
        if (!v.length) { this.err = 'Bir isim yazmalısın (1–12 karakter).'; Audio.sfx('back'); return; }
        if (Array.from(v).length > 12) { this.err = 'İsim en fazla 12 karakter olabilir.'; Audio.sfx('back'); return; }
        if (!/[A-Za-zÇĞİÖŞÜçğıiöşüÂÎÛâîûÄËÏäëïÉÈÊéèêÁÀáàÓÒÔóòôÚÙúùÍÌíìÑñß0-9]/.test(v)) { this.err = 'İsimde en az bir harf ya da rakam olmalı.'; Audio.sfx('back'); return; }
        if (this.step === 1 && BB.lowerTR(v) === BB.lowerTR(this.vals[0].trim())) { this.err = 'İki isim farklı olsun ki karışmasın.'; Audio.sfx('back'); return; }
        this.vals[this.step] = v;
        Audio.sfx('select');
        if (this.step === 0) { this.step = 1; this.err = ''; }
        else Game().go(UI.Roles, { slot: this.slot, names: this.vals.slice() });
      }
    },
    draw(ctx) {
      UI.drawMenuBg(ctx, 'bahar', 0.35);
      Gfx.text(ctx, 'Arılarınıza isim verin', W / 2, 20, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      for (let i = 0; i < 2; i++) {
        const y = 70 + i * 64, on = i === this.step;
        Gfx.panel(ctx, 90, y, 300, 50, on ? '#fff4dc' : '#e8d8bc', on ? '#3b2516' : '#7a5a40');
        Gfx.text(ctx, (i + 1) + '. oyuncu ' + (i === 0 ? '(A D W S)' : '(← → ↑ ↓)'), 100, y + 4, { color: 'honeyD' });
        const v = this.vals[i] + (on && Math.floor(this.t * 2) % 2 ? '_' : '');
        Gfx.text(ctx, v || (on ? '' : '…'), 100, y + 20, { color: 'ink', scale: 2 });
      }
      if (this.err) Gfx.text(ctx, this.err, W / 2, 202, { color: 'red', align: 'center', outline: 'shadow' });
      Gfx.text(ctx, 'Yaz · Enter onayla · Backspace sil · Esc geri  (Türkçe harfler olur: ğ ü ş ı ö ç İ)', W / 2, H - 20, { color: 'white', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ arı seçimi
  UI.Roles = {
    enter(o) { this.o = o; this.sel = 0; this.t = 0; },
    update(dt) {
      this.t += dt;
      if (Input.leftNav() || Input.rightNav()) { this.sel = 1 - this.sel; Audio.sfx('move'); }
      if (Input.back()) { Audio.sfx('back'); Game().go(UI.Names, { slot: this.o.slot }); return; }
      if (Input.confirm()) {
        Audio.sfx('checkpoint');
        const roles = this.sel === 0 ? ['disi', 'erkek'] : ['erkek', 'disi'];
        Save().create(this.o.slot, this.o.names, roles);
        Game().go(UI.Controls, { next: () => Game().startLevel(0) });
      }
    },
    draw(ctx) {
      UI.drawMenuBg(ctx, 'bahar', 0.35);
      const n = this.o.names;
      Gfx.text(ctx, n[0] + ', hangi arı olacaksın?', W / 2, 16, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      const roles = ['disi', 'erkek'];
      roles.forEach((r, i) => {
        const x = 110 + i * 200, on = i === this.sel;
        Gfx.panel(ctx, x - 60, 52, 120, 140, on ? '#fff4dc' : '#e8d8bc', on ? '#3b2516' : '#7a5a40');
        const face = on ? 'happy' : 'normal';
        Gfx.sprScaled(ctx, `pt_${r}_${face}`, 0, x - 48, 58 + (on ? Math.round(Math.sin(this.t * 4) * 2) : 0), 2);
        Gfx.text(ctx, r === 'disi' ? 'Fiyonklu arı' : 'Şapkalı arı', x, 158, { color: 'ink', align: 'center' });
        const who = on ? n[0] : n[1];
        Gfx.text(ctx, who, x, 172, { color: r === 'disi' ? 'pink' : 'blue', align: 'center' });
      });
      Gfx.text(ctx, '← → seç · Enter onayla · Esc geri', W / 2, H - 20, { color: 'white', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ tuşlar (nasıl oynanır)
  UI.Controls = {
    enter(o) { this.o = o; this.t = 0; },
    update(dt) { this.t += dt; if (this.t > 0.5 && Input.confirm()) { Audio.sfx('select'); this.o.next(); } if (Input.back() && this.o.back) this.o.back(); },
    draw(ctx) {
      UI.drawMenuBg(ctx, 'bahar', 0.45);
      const g = Game();
      Gfx.text(ctx, 'Tuşlar', W / 2, 10, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      for (let i = 0; i < 2; i++) {
        const x = 20 + i * 232, y = 40;
        const role = g.roles[i];
        Gfx.panel(ctx, x, y, 208, 150, '#fff4dc', '#3b2516');
        Gfx.sprScaled(ctx, role + '_idle', 0, x + 8, y + 6, 2);
        Gfx.text(ctx, g.names[i], x + 44, y + 12, { color: role === 'disi' ? 'pink' : 'blue', scale: 2 });
        const k = Input.KEYS.p[i].names;
        const rows = [[k.left + ' ' + k.right, 'yürü / yön'], [k.flap, 'kanat çırp (basılı: uç)'], [k.action, 'eylem: tut, bırak, taşı, çağır'], [k.pick.join(' '), 'gizli seçim (sorularda)']];
        rows.forEach((r, j) => { Gfx.key(ctx, r[0], x + 10, y + 46 + j * 24); Gfx.text(ctx, r[1], x + 16 + BB.Font.measure(r[0]) + 10, y + 46 + j * 24, { color: 'ink' }); });
      }
      Gfx.text(ctx, 'Enter / Boşluk: konuşmayı ilerlet · Esc: duraklat · F: tam ekran · M: ses', W / 2, 200, { color: 'white', align: 'center', outline: 'shadow' });
      Gfx.text(ctx, 'Kanadın yorulursa yere, çiçeğe ya da ortağının başına kon: enerji dolar.', W / 2, 214, { color: 'cream', align: 'center', outline: 'shadow' });
      if (Math.floor(this.t * 2) % 2) Gfx.text(ctx, 'Hazırsanız Enter', W / 2, H - 22, { color: 'honey', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ nasıl oynanır (sayfa sayfa, hikâye anlatmaz)
  const HOWTO = [
    { t: 'Hoş geldiniz', rows: [
      { i: 'disi_idle', i2: 'erkek_idle', s: 'Bee & Bloom iki kişilik bir oyun: aynı klavyede, yan yana oynanır.' },
      { p: 'Siz iki küçük arısınız. Kovanın Kraliçesi sizi önemli bir yolculuğa gönderiyor.' },
      { p: 'Bu yolculuk tek başına bitmez: her bölümde birbirinize ihtiyacınız olacak.' },
      { p: 'Bu rehber yalnızca nasıl oynanacağını anlatır. Hikâyeden hiçbir şey söylemez; onu oynarken birlikte keşfedin.' },
      { h: '← → ile sayfaları çevirin.' },
    ] },
    { t: 'Tuşlar', keys: true },
    { t: 'Uçmak', rows: [
      { k: 'W', k2: '↑', s: 'Basılı tutun: kanat çırparsınız, yükselirsiniz.' },
      { p: 'Kanat gücü kısa sürer. Arının üstündeki sarı çubuk azaldıkça güç biter.' },
      { p: 'Güç bitince tuşu basılı tutmaya devam ederseniz süzülürsünüz: yavaşça alçalırsınız. Tuşu bırakırsanız hızla düşersiniz.' },
      { p: 'Yere, çiçeğe ya da ortağınızın başına konunca güç hemen dolar.' },
      { h: 'İpucu: uzun boşlukları süzülerek geçin. Çok yüksek yerler için ortağınızdan yardım alın.' },
    ] },
    { t: 'Eylem tuşu', rows: [
      { k: 'S', k2: '↓', s: 'Ne yaptığı, yanınızda ne olduğuna bağlıdır:' },
      { b: 'Ortağınızın yanındaysanız: onu yakalar, taşırsınız.' },
      { b: 'Taşırken tekrar basın: bırakırsınız.' },
      { b: 'Taşırken ← ya da → basılıyken basın: ortağınızı o yöne fırlatırsınız.' },
      { b: 'Taşırken kanat tuşu basılıyken basın: ortağınızı yukarı fırlatırsınız.' },
      { b: 'Bir eşyanın yanında: alırsınız; tekrar basınca bırakırsınız.' },
      { b: 'Konuşabileceğiniz biri yanınızdaysa: konuşursunuz.' },
      { b: 'Yanınızda hiçbir şey yoksa: ortağınızı çağırırsınız.' },
    ] },
    { t: 'Birlikte daha güçlüsünüz', rows: [
      { b: 'Omuz omuza: ortağınızın başına konun. Alttaki uçarken üstteki de onunla gider; oradan kanat çırpan, tek başına çıkamayacağı kadar yükseğe ulaşır.' },
      { b: 'Taşıma: taşıyan arı ikinizin kanat gücünü birden kullanır; rüzgâra karşı daha sağlam durursunuz.' },
      { b: 'Fırlatma: ortağınızı tek başına ulaşamayacağı yere atın.' },
      { b: 'Biriniz bir yere takılırsa öteki yanına gidip eylem tuşuyla kurtarır.' },
      { b: 'Birbirinizden çok uzaklaşamazsınız: aranızda görünmez bir bağ vardır, gerilince sizi geri çeker.' },
    ] },
    { t: 'Yolda neler var?', rows: [
      { i: 'honeyflower', s: 'Bal Çiçeği: dokununca açılır. Düşerseniz buradan devam edersiniz.' },
      { i: 'pollen', s: 'Polen: toplayın; bölüm sonunda sayılır.' },
      { i: 'rare', s: 'Nadir çiçek: her bölümde iyi saklanmış bir tane vardır.' },
      { i: 'sign', s: 'Tabela: yanına gelince ipucunu okursunuz.' },
      { i: 'plate', s: 'Taş plaka: üstünde durunca bir şeyler açılır.' },
      { i: 'holdflower', s: 'Kapı çiçeği: eylem tuşuyla tutun; bıraktığınızda kapanabilir.' },
      { i: 'pedestal', s: 'Soru noktası: ikiniz de gelince bir soru sorulur.' },
      { h: 'Her dünyada yeni şeyler çıkar; tabelalar onları da anlatır.' },
    ] },
    { t: 'Sorular', rows: [
      { p: 'Yolda tanıştığınız dostlar size sorular soracak. Doğru ya da yanlış cevap yoktur: amaç birbirinizi tanımak.' },
      { b: 'Açık soru: cevabınızın yazdığı çiçeğe uçun.' },
      { b: 'Gizli soru: sırası gelen kendi tuşlarıyla (Q W E R ya da U I O P) seçer, aynı tuşa bir daha basarak ya da eylem tuşuyla onaylar. Öteki o sırada ekrana bakmasın!' },
      { b: '"Hanginiz?" sorularında seçenekler sizin isimlerinizdir.' },
      { b: 'Tahmin sorusu: biri gizlice seçer, öteki onun ne seçtiğini tahmin eder.' },
      { i: 'jar', s: 'Cevaplar ilk verildiğinde kilitlenir. Her cevap bir bal damlasıdır: sol üstteki kavanoz dolar.' },
    ] },
    { t: 'Düşmek ve kayıt', rows: [
      { p: 'Dikenlere değmek ya da aşağı düşmek sorun değil: can sınırı yoktur, son Bal Çiçeğinden devam edersiniz.' },
      { k: 'Esc', s: 'Duraklat: devam et, son Bal Çiçeğine dön, bölümü baştan başlat, ayarlar.' },
      { p: 'Oyun kendiliğinden kaydeder. Ana menüdeki "Devam" kaldığınız yerden başlatır; üç ayrı kayıt yeri vardır.' },
      { p: '"Ustalık Geçidi" yazan yerler daha zordur; önlerinde mutlaka bir Bal Çiçeği bulunur.' },
      { h: 'Takıldığınızda: tabelaları okuyun, taşımayı ve fırlatmayı deneyin, etrafa iyi bakın.' },
    ] },
    { t: 'Hazır mısınız?', rows: [
      { i: 'disi_fly', i2: 'erkek_fly', s: 'Birlikte uçun, birbirinizi dinleyin.' },
      { p: 'Ana menüden "Yeni Oyun"u seçin, isimlerinizi yazın ve arınızı seçin.' },
      { p: 'Bu rehbere ana menüden istediğiniz zaman dönebilirsiniz.' },
      { h: 'İyi eğlenceler!' },
    ] },
  ];

  UI.Howto = {
    enter() { this.page = 0; this.anim = 0; this.t = 0; },
    update(dt) {
      this.t += dt;
      this.anim += (this.page - this.anim) * Math.min(1, dt * 12);
      if (Math.abs(this.page - this.anim) < 0.002) this.anim = this.page;
      const n = HOWTO.length;
      if (Input.back()) { Audio.sfx('back'); Game().go(UI.Menu); return; }
      const conf = Input.confirm(), left = Input.leftNav(), right = Input.rightNav();
      if (left && this.page > 0) { this.page--; Audio.sfx('page'); }
      else if ((right || conf) && this.page < n - 1) { this.page++; Audio.sfx('page'); }
      else if (conf && this.page === n - 1) { Audio.sfx('select'); Game().go(UI.Menu); }
    },
    draw(ctx) {
      UI.drawMenuBg(ctx, 'bahar', 0.45);
      Gfx.text(ctx, 'Nasıl Oynanır', W / 2, 6, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      for (let i = 0; i < HOWTO.length; i++) {
        const x0 = Math.round((i - this.anim) * W);
        if (x0 <= -W || x0 >= W) continue;
        this.drawPage(ctx, HOWTO[i], x0);
      }
      // sayfa noktaları
      const n = HOWTO.length, dx = 10, sx = Math.round(W / 2 - (n - 1) * dx / 2);
      for (let i = 0; i < n; i++) Gfx.rect(ctx, sx + i * dx - (i === this.page ? 2 : 1), H - 31 - (i === this.page ? 1 : 0), i === this.page ? 5 : 3, i === this.page ? 5 : 3, i === this.page ? '#ffd23c' : '#fff4dc');
      const hint = this.page < n - 1 ? '← → sayfa · Enter ileri · Esc ana menü' : '← geri · Enter ana menü';
      Gfx.text(ctx, hint, W / 2, H - 20, { color: 'white', align: 'center', outline: 'shadow' });
    },
    drawPage(ctx, pg, x0) {
      const px = x0 + 16, py = 32, pw = W - 32, ph = H - 68;
      Gfx.panel(ctx, px, py, pw, ph, '#fff4dc', '#3b2516', '#e8d4b0');
      Gfx.text(ctx, pg.t, px + pw / 2, py + 6, { color: 'honeyD', align: 'center' });
      Gfx.rect(ctx, px + 12, py + 18, pw - 24, 1, '#e8d4b0');
      if (pg.keys) { this.drawKeys(ctx, px, py + 22, pw); return; }
      let y = py + 24;
      const L = px + 12, wrapW = pw - 24;
      for (const r of pg.rows) {
        if (r.p || r.h) {
          const lines = BB.Font.wrap(r.p || r.h, wrapW);
          lines.forEach((l, j) => Gfx.text(ctx, l, L, y + j * 11, { color: r.h ? 'honeyD' : 'ink' }));
          y += lines.length * 11 + 4;
        } else if (r.b) {
          const lines = BB.Font.wrap(r.b, wrapW - 10);
          Gfx.rect(ctx, L + 1, y + 4, 3, 3, '#ffb32c');
          lines.forEach((l, j) => Gfx.text(ctx, l, L + 10, y + j * 11, { color: 'ink' }));
          y += lines.length * 11 + 3;
        } else {
          // simge(ler) + metin: satır yüksekliği en uzun parçaya göre, hepsi dikeyde ortalı
          const icons = [r.i, r.i2].filter(Boolean).map((nm) => { const sz = Gfx.sprSize(nm), k = sz.w <= 8 ? 2 : 1; return { nm, k, w: sz.w * k, h: sz.h * k }; });
          let ix = L;
          const keyW = (r.k ? BB.Font.measure(r.k) + 8 : 0) + (r.k2 ? BB.Font.measure(r.k2) + 8 : 0);
          const textX = L + keyW + (icons.length ? icons.length * 20 : 0) + 4;
          const lines = BB.Font.wrap(r.s, L + wrapW - textX);
          const rowH = Math.max(13, lines.length * 11 + 2, ...icons.map((c) => c.h));
          if (r.k) { Gfx.key(ctx, r.k, ix, y + Math.round((rowH - 11) / 2)); ix += BB.Font.measure(r.k) + 8; }
          if (r.k2) { Gfx.key(ctx, r.k2, ix, y + Math.round((rowH - 11) / 2)); ix += BB.Font.measure(r.k2) + 8; }
          icons.forEach((c, j) => {
            const cx = ix + j * 20 + Math.round((18 - c.w) / 2), cy = y + Math.round((rowH - c.h) / 2);
            if (c.k > 1) Gfx.sprScaled(ctx, c.nm, 0, cx, cy, c.k, j === 1); else Gfx.spr(ctx, c.nm, 0, cx, cy, j === 1);
          });
          const ty = y + Math.round((rowH - lines.length * 11) / 2) + 1;
          lines.forEach((l, j) => Gfx.text(ctx, l, textX, ty + j * 11, { color: 'ink' }));
          y += rowH + 3;
        }
      }
    },
    drawKeys(ctx, px, y, pw) {
      const K = Input.KEYS.p;
      const cols = [['1. oyuncu', K[0].names, 'pink'], ['2. oyuncu', K[1].names, 'blue']];
      cols.forEach(([title, k, col], i) => {
        const x = px + 14 + i * (pw / 2);
        Gfx.text(ctx, title, x, y + 2, { color: col });
        const rows = [[k.left + ' ' + k.right, 'yürü'], [k.flap, 'kanat (basılı tut: uç)'], [k.action, 'eylem'], [k.pick.join(' '), 'sorularda gizli seçim']];
        rows.forEach((r, j) => { Gfx.key(ctx, r[0], x, y + 18 + j * 18); Gfx.text(ctx, r[1], x + BB.Font.measure(r[0]) + 12, y + 18 + j * 18, { color: 'ink' }); });
      });
      const yy = y + 96;
      Gfx.rect(ctx, px + 12, yy - 4, pw - 24, 1, '#e8d4b0');
      const common = [['Enter', 'konuşmayı ilerlet'], ['Esc', 'duraklat'], ['F', 'tam ekran'], ['M', 'sesi kapat / aç']];
      common.forEach((r, j) => { const x = px + 14 + (j % 2) * (pw / 2), yk = yy + 4 + Math.floor(j / 2) * 18; Gfx.key(ctx, r[0], x, yk); Gfx.text(ctx, r[1], x + BB.Font.measure(r[0]) + 12, yk, { color: 'ink' }); });
      Gfx.text(ctx, 'Oyuncular hangi arıyı yöneteceğini oyun başında seçer.', px + pw / 2, yy + 44, { color: 'honeyD', align: 'center' });
    },
  };

  // ------------------------------------------------------------ bölüm seçimi
  UI.Levels = {
    enter() { this.sel = Math.min(Save().cur.unlocked - 1, BB.LEVELS.length - 1); this.t = 0; Audio.play('menu'); },
    update(dt) {
      this.t += dt;
      const n = BB.LEVELS.length;
      if (Input.leftNav()) { this.sel = (this.sel + n - 1) % n; Audio.sfx('move'); }
      if (Input.rightNav()) { this.sel = (this.sel + 1) % n; Audio.sfx('move'); }
      if (Input.up()) { this.sel = (this.sel + n - 3) % n; }
      if (Input.downNav()) { this.sel = (this.sel + 3) % n; }
      if (Input.back()) { Audio.sfx('back'); Game().go(UI.Menu); return; }
      if (Input.confirm()) {
        if (this.sel >= Save().cur.unlocked) { Audio.sfx('back'); UI.toast('Bu bölüm henüz açılmadı.'); return; }
        Audio.sfx('select');
        Game().startLevel(this.sel);
      }
    },
    draw(ctx) {
      UI.drawMenuBg(ctx, WORLDS[Math.floor(this.sel / 3)] ? WORLDS[Math.floor(this.sel / 3)].theme : 'bahar', 0.4);
      const d = Save().cur;
      Gfx.text(ctx, 'Bölümler', W / 2, 6, { color: 'honey', align: 'center', scale: 2, outline: 'shadow' });
      BB.LEVELS.forEach((lv, i) => {
        const wi = Math.floor(i / 3), li = i % 3;
        const x = 10 + li * 156, y = 34 + wi * 36;
        const on = i === this.sel, open = i < d.unlocked;
        Gfx.panel(ctx, x, y, 150, 32, on ? '#fff4dc' : open ? '#e8d8bc' : '#9a8a7a', on ? '#3b2516' : '#7a5a40');
        Gfx.text(ctx, open ? lv.id + '. ' + lv.name : lv.id + '. ???', x + 6, y + 2, { color: open ? 'ink' : 'dark' });
        if (open) {
          const best = d.best[lv.id] ? BB.fmtTime(d.best[lv.id]) : '—';
          Gfx.text(ctx, 'süre ' + best, x + 6, y + 16, { color: 'gray' });
          if (d.pollen[lv.id] !== undefined) { Gfx.spr(ctx, 'pollen', 0, x + 90, y + 19); Gfx.text(ctx, String(d.pollen[lv.id]), x + 100, y + 16, { color: 'honeyD' }); }
          if (d.secrets[lv.id]) Gfx.spr(ctx, 'rare', 0, x + 130, y + 15);
        }
      });
      Gfx.text(ctx, '← → ↑ ↓ seç · Enter oyna · Esc geri · Cevaplar kilitli kalır', W / 2, H - 14, { color: 'white', align: 'center', outline: 'shadow' });
      UI.drawToast(ctx);
    },
  };

  // ------------------------------------------------------------ ayarlar
  UI.Settings = {
    enter(o) { this.o = o; this.sel = 0; },
    items() {
      const s = Save().settings;
      const pct = (v) => Math.round(v * 100) + '%';
      return [
        { label: 'Müzik: ' + pct(s.music), adj: (d) => Save().setSetting('music', BB.clamp(Math.round((s.music + d * 0.1) * 10) / 10, 0, 1)) },
        { label: 'Efekt: ' + pct(s.sfx), adj: (d) => { Save().setSetting('sfx', BB.clamp(Math.round((s.sfx + d * 0.1) * 10) / 10, 0, 1)); Audio.sfx('pick'); } },
        { label: 'Ses: ' + (s.muted ? 'kapalı' : 'açık') + ' (M)', adj: () => Save().setSetting('muted', !s.muted), act: () => Save().setSetting('muted', !s.muted) },
        { label: 'Tam ekran (F)', act: () => Game().toggleFullscreen() },
        { label: 'Ekran ölçeği: ' + (s.scale ? s.scale + '×' : 'otomatik'), adj: (d) => Save().setSetting('scale', (s.scale + d + 5) % 5), act: () => Save().setSetting('scale', (s.scale + 1) % 5) },
        { label: 'Geri', act: () => this.back() },
      ];
    },
    back() { Audio.sfx('back'); if (this.o.overlayBack) this.o.overlayBack(); else Game().go(this.o.back || UI.Menu); },
    update() {
      const items = this.items();
      this.sel = navList(this.sel, items.length);
      const it = items[this.sel];
      if (Input.leftNav() && it.adj) { it.adj(-1); Audio.sfx('move'); }
      if (Input.rightNav() && it.adj) { it.adj(1); Audio.sfx('move'); }
      if (Input.confirm() && it.act) { Audio.sfx('select'); it.act(); }
      if (Input.back()) this.back();
    },
    draw(ctx, noBg) {
      if (!noBg) UI.drawMenuBg(ctx, 'bahar', 0.35);
      Gfx.panel(ctx, W / 2 - 110, 40, 220, 150, 'rgba(43,26,16,0.75)', '#ffd23c');
      Gfx.text(ctx, 'Ayarlar', W / 2, 46, { color: 'honey', align: 'center', scale: 2 });
      menuList(ctx, this.items(), this.sel, W / 2, 80, { lh: 16 });
      Gfx.text(ctx, '← → değiştir · Enter seç · Esc geri', W / 2, H - 20, { color: 'white', align: 'center', outline: 'shadow' });
    },
  };

  // ------------------------------------------------------------ duraklatma (oyun içi katman)
  UI.makePause = function (play) {
    const o = {
      sel: 0, settings: null,
      items: [
        { label: 'Devam', act: () => { play.overlay = null; } },
        { label: 'Son Bal Çiçeğine dön', act: () => { play.overlay = null; play.world.kill(play.world.bees[0], 'fall'); } },
        { label: 'Bölümü baştan başlat', act: () => { o.confirm = { yes: false, text: 'Bölüm baştan başlasın mı? (Cevaplar ve toplananlar korunur.)', fn: () => Game().startLevel(play.idx, { noScene: true, taken: play.world.pollen.map((p, i) => (p.taken ? i : -1)).filter((i) => i >= 0), secret: play.world.stats.secret }) } ; } },
        { label: 'Ayarlar', act: () => { o.settings = Object.create(UI.Settings); o.settings.enter({ overlayBack: () => { o.settings = null; } }); } },
        { label: 'Ana menü', act: () => { BB.Save.autosave('menu'); Game().go(UI.Menu); } },
      ],
      update() {
        if (o.settings) { o.settings.update(); return; }
        if (o.confirm) {
          if (Input.leftNav() || Input.rightNav()) o.confirm.yes = !o.confirm.yes;
          if (Input.back()) o.confirm = null;
          else if (Input.confirm()) { const c = o.confirm; o.confirm = null; if (c.yes) c.fn(); }
          return;
        }
        o.sel = navList(o.sel, o.items.length);
        if (Input.back()) { play.overlay = null; Audio.sfx('select'); return; }
        if (Input.confirm()) { Audio.sfx('select'); o.items[o.sel].act(); }
      },
      draw(ctx) {
        Gfx.rect(ctx, 0, 0, W, H, 'rgba(20,10,8,0.55)');
        if (o.settings) { o.settings.draw(ctx, true); return; }
        Gfx.panel(ctx, W / 2 - 100, 34, 200, 132, 'rgba(43,26,16,0.85)', '#ffd23c');
        Gfx.text(ctx, 'Duraklatıldı', W / 2, 40, { color: 'honey', align: 'center', scale: 2 });
        menuList(ctx, o.items, o.sel, W / 2, 72, { lh: 17 });
        const g = Game(), k = Input.KEYS.p;
        Gfx.text(ctx, `${g.names[0]}: ${k[0].names.left} ${k[0].names.right} yürü · ${k[0].names.flap} kanat · ${k[0].names.action} eylem`, W / 2, 184, { color: 'cream', align: 'center', outline: 'shadow' });
        Gfx.text(ctx, `${g.names[1]}: ${k[1].names.left} ${k[1].names.right} yürü · ${k[1].names.flap} kanat · ${k[1].names.action} eylem`, W / 2, 198, { color: 'cream', align: 'center', outline: 'shadow' });
        Gfx.text(ctx, `${play.def.id}. ${play.def.name} · düşme ${play.world.stats.deaths} · ${BB.fmtTime(play.world.stats.time)}`, W / 2, 216, { color: 'white', align: 'center', outline: 'shadow' });
        if (o.confirm) confirmBox(ctx, o.confirm.text, o.confirm.yes);
      },
    };
    return o;
  };

  // ------------------------------------------------------------ bölüm sonu
  UI.makeLevelEnd = function (play) {
    const w = play.world, def = play.def;
    const o = {
      t: 0,
      update(dt) {
        o.t += dt;
        if (o.t > 0.8 && Input.confirm()) {
          Audio.sfx('select');
          const next = play.idx + 1;
          if (next >= BB.LEVELS.length) { if (BB.Final) BB.Final.begin(); else Game().go(UI.Menu); return; }
          const curW = Math.floor(play.idx / 3), nextW = Math.floor(next / 3);
          if (nextW !== curW) Game().go(UI.WorldCard, { world: nextW, then: () => Game().startLevel(next) });
          else Game().startLevel(next);
        }
        if (o.t > 0.8 && Input.back()) { Audio.sfx('back'); Game().go(UI.Menu); }
      },
      draw(ctx) {
        const k = Math.min(1, o.t * 3);
        Gfx.rect(ctx, 0, 0, W, H, 'rgba(20,10,8,' + (0.5 * k) + ')');
        const y = 40 + (1 - k) * 30;
        Gfx.panel(ctx, W / 2 - 130, y, 260, 168, '#fff4dc', '#3b2516', '#e8d4b0');
        Gfx.text(ctx, 'Bölüm tamamlandı!', W / 2, y + 8, { color: 'honeyD', align: 'center', scale: 2 });
        Gfx.text(ctx, def.id + '. ' + def.name, W / 2, y + 34, { color: 'ink', align: 'center' });
        const rows = [
          ['Süre', BB.fmtTime(w.stats.time)],
          ['Düşme', String(w.stats.deaths)],
          ['Polen', w.stats.pollen + ' / ' + w.stats.pollenTotal],
          ['Nadir çiçek', w.stats.secret ? 'bulundu ✓' : 'gizli kaldı…'],
          ['Bal damlası', Object.keys(BB.Save.cur ? BB.Save.cur.answers : {}).length + ' / 40'],
        ];
        rows.forEach((r, i) => { Gfx.text(ctx, r[0], W / 2 - 100, y + 54 + i * 16, { color: 'gray' }); Gfx.text(ctx, r[1], W / 2 + 100, y + 54 + i * 16, { color: 'ink', align: 'right' }); });
        // dans eden arılar
        const g = Game();
        for (let i = 0; i < 2; i++) {
          const hop = Math.abs(Math.sin(o.t * 5 + i * 1.5)) * 6;
          Gfx.spr(ctx, g.roles[i] + '_face_happy', 0, W / 2 - 110 + i * 204, y + 140 - hop, i === 1);
        }
        if (o.t > 0.8 && Math.floor(o.t * 2) % 2) Gfx.text(ctx, 'Enter: devam', W / 2, y + 146, { color: 'honeyD', align: 'center' });
      },
    };
    Audio.sfx('win');
    return o;
  };

  // ------------------------------------------------------------ mevsim geçiş kartı
  UI.WorldCard = {
    enter(o) { this.o = o; this.t = 0; const wd = WORLDS[o.world]; this.wd = wd; Audio.play({ bahar: 'bahar', yaz: 'yaz', sonbahar: 'sonbahar', magara: 'magara', kis: 'kis', kovan: 'kovan' }[wd.theme], { fade: 1 }); },
    update(dt) { this.t += dt; if ((this.t > 1 && Input.confirm()) || this.t > 4.5) { Audio.sfx('select'); this.o.then(); } },
    draw(ctx) {
      UI.drawMenuBg(ctx, this.wd.theme, 0.25);
      const a = Math.min(1, this.t * 1.5);
      ctx.globalAlpha = a;
      Gfx.rect(ctx, 0, 80, W, 100, 'rgba(43,26,16,0.7)');
      Gfx.text(ctx, 'Dünya ' + this.wd.n + ' · ' + this.wd.season, W / 2, 88, { color: 'cream', align: 'center' });
      Gfx.text(ctx, this.wd.name, W / 2, 104, { color: 'honey', align: 'center', scale: 3, outline: 'shadow' });
      Gfx.text(ctx, this.wd.sub, W / 2, 152, { color: 'cream', align: 'center' });
      ctx.globalAlpha = 1;
    },
  };
})();
