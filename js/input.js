/* Bee & Bloom — klavye girişi (iki oyuncu aynı klavye) ve metin girişi. */
(function () {
  'use strict';
  const BB = window.BB;

  const KEYS = {
    p: [
      { left: 'KeyA', right: 'KeyD', flap: 'KeyW', action: 'KeyS', pick: ['KeyQ', 'KeyW', 'KeyE', 'KeyR'], names: { left: 'A', right: 'D', flap: 'W', action: 'S', pick: ['Q', 'W', 'E', 'R'] } },
      { left: 'ArrowLeft', right: 'ArrowRight', flap: 'ArrowUp', action: 'ArrowDown', pick: ['KeyU', 'KeyI', 'KeyO', 'KeyP'], names: { left: '←', right: '→', flap: '↑', action: '↓', pick: ['U', 'I', 'O', 'P'] } },
    ],
  };
  const GAME_CODES = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Tab', 'Backspace']);

  const Input = {
    KEYS,
    down: Object.create(null),
    hits: Object.create(null),     // UI için tüketilen basışlar
    simHits: Object.create(null),  // simülasyon için bir sonraki adıma kadar tutulan basışlar
    textMode: false,
    typed: [],
    lastKeyTime: 0,
    anyKey: false,
    listeners: [],
  };
  BB.Input = Input;

  function onDown(e) {
    const code = e.code || e.key;
    Input.lastKeyTime = performance.now();
    if (Input.textMode) {
      if (e.key === 'Backspace') { Input.typed.push('\b'); e.preventDefault(); return; }
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab' || e.key.startsWith('Arrow')) { /* aşağıda normal işlenir */ }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { Input.typed.push(e.key); e.preventDefault(); return; }
    }
    if (GAME_CODES.has(code) || (!e.metaKey && !e.ctrlKey && code && code.startsWith('Key'))) e.preventDefault();
    if (e.repeat) { if (code.startsWith('Arrow') || code === 'KeyA' || code === 'KeyD' || code === 'KeyW' || code === 'KeyS') Input.hits[code + ':rep'] = true; return; }
    Input.down[code] = true;
    Input.hits[code] = true;
    Input.simHits[code] = true;
    Input.anyKey = true;
    for (const fn of Input.listeners) fn(code, e);
  }
  function onUp(e) {
    const code = e.code || e.key;
    Input.down[code] = false;
  }
  function clearAll() {
    for (const k in Input.down) Input.down[k] = false;
  }

  Input.init = function () {
    window.addEventListener('keydown', onDown, { passive: false });
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearAll);
  };

  Input.isDown = (code) => !!Input.down[code];
  // UI: bir basışı tüket
  Input.hit = function (code) {
    if (Input.hits[code]) { Input.hits[code] = false; return true; }
    return false;
  };
  Input.hitRep = function (code) {
    if (Input.hits[code] || Input.hits[code + ':rep']) { Input.hits[code] = false; Input.hits[code + ':rep'] = false; return true; }
    return false;
  };
  Input.hitAny = function (codes) { for (const c of codes) if (Input.hit(c)) return true; return false; };
  Input.clearHits = function () { for (const k in Input.hits) Input.hits[k] = false; };
  Input.confirm = () => Input.hitAny(['Enter', 'Space', 'NumpadEnter']);
  Input.back = () => Input.hit('Escape');
  Input.up = () => Input.hitRep('ArrowUp') || Input.hitRep('KeyW');
  Input.downNav = () => Input.hitRep('ArrowDown') || Input.hitRep('KeyS');
  Input.leftNav = () => Input.hitRep('ArrowLeft') || Input.hitRep('KeyA');
  Input.rightNav = () => Input.hitRep('ArrowRight') || Input.hitRep('KeyD');

  // simülasyon girdisi: oyuncu i (0/1)
  Input.player = function (i) {
    const k = KEYS.p[i];
    const sh = Input.simHits;
    return {
      left: !!Input.down[k.left], right: !!Input.down[k.right],
      flap: !!Input.down[k.flap] || !!sh[k.flap], flapPressed: !!sh[k.flap],
      action: !!Input.down[k.action] || !!sh[k.action], actionPressed: !!sh[k.action],
    };
  };
  Input.endSimStep = function () { for (const k in Input.simHits) Input.simHits[k] = false; };

  Input.takeTyped = function () { const t = Input.typed; Input.typed = []; return t; };
})();
