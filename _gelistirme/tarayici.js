// Bağımlılıksız tarayıcı otomasyonu: Chrome'u başsız açar, DevTools protokolü (CDP) ile konuşur.
// Node 22+ (yerleşik WebSocket) gerekir. Kullanım: const B = await launch(); const p = await B.open(url); ...
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
];

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('Chrome bulunamadı (CHROME ortam değişkeniyle yol verin)');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(opts) {
  opts = opts || {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-chrome-'));
  const args = ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + dir, '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--disable-gpu-vsync', '--hide-scrollbars',
    '--window-size=' + (opts.width || 1440) + ',' + (opts.height || 810), 'about:blank'];
  const proc = spawn(findChrome(), args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let port = null;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    const f = path.join(dir, 'DevToolsActivePort');
    if (fs.existsSync(f)) { const lines = fs.readFileSync(f, 'utf8').split('\n'); if (lines[0]) port = parseInt(lines[0], 10); }
  }
  if (!port) { proc.kill(); throw new Error('Chrome DevTools portu açılmadı'); }
  const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const waiting = new Map();
  const listeners = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(typeof m.data === 'string' ? m.data : m.data.toString());
    if (msg.id && waiting.has(msg.id)) { const w = waiting.get(msg.id); waiting.delete(msg.id); if (msg.error) w.rej(new Error(msg.error.message)); else w.res(msg.result); }
    else for (const l of listeners) l(msg);
  };
  const send = (method, params, sessionId) => new Promise((res, rej) => {
    const mid = ++id;
    waiting.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params: params || {}, sessionId }));
  });

  const B = {
    proc, dir, send,
    async open(url, o) {
      o = o || {};
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const page = {
        sessionId, targetId, logs: [],
        send: (m, p) => send(m, p, sessionId),
        async eval(expr, awaitPromise) {
          const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: !!awaitPromise }, sessionId);
          if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
          return r.result ? r.result.value : undefined;
        },
        async shot(file, clip) {
          const r = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: false }, sessionId);
          fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
        },
        async key(code, type) {
          const map = { ArrowLeft: [37, 'ArrowLeft'], ArrowRight: [39, 'ArrowRight'], ArrowUp: [38, 'ArrowUp'], ArrowDown: [40, 'ArrowDown'], Enter: [13, 'Enter'], Space: [32, ' '], Escape: [27, 'Escape'], Tab: [9, 'Tab'], Backspace: [8, 'Backspace'] };
          let vk, key;
          if (map[code]) [vk, key] = map[code];
          else if (code.startsWith('Key')) { key = code.slice(3).toLowerCase(); vk = key.toUpperCase().charCodeAt(0); }
          else if (code.startsWith('Digit')) { key = code.slice(5); vk = key.charCodeAt(0); }
          const base = { code, key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
          if (!type || type === 'down') await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown' }, base, key && key.length === 1 ? { text: key } : {}), sessionId);
          if (!type || type === 'up') await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base), sessionId);
        },
        async type(text) { for (const ch of text) await send('Input.dispatchKeyEvent', { type: 'char', text: ch }, sessionId); },
        async typeKeys(text) {
          // gerçek tuş olayı (e.key) ile yaz: Türkçe harfler dahil
          for (const ch of text) {
            await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, code: '' }, sessionId);
            await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, code: '' }, sessionId);
          }
        },
        async press(code, ms) { await page.key(code, 'down'); await sleep(ms || 60); await page.key(code, 'up'); },
        async wait(ms) { await sleep(ms); },
        async waitFor(expr, ms) { const t0 = Date.now(); while (Date.now() - t0 < (ms || 10000)) { try { if (await page.eval(expr)) return true; } catch (e) { /* henüz hazır değil */ } await sleep(100); } throw new Error('zaman aşımı: ' + expr); },
        errors() { return page.logs.filter((l) => l.level === 'error' || l.level === 'warning' || l.level === 'exception'); },
      };
      listeners.push((msg) => {
        if (msg.sessionId !== sessionId) return;
        if (msg.method === 'Runtime.consoleAPICalled') page.logs.push({ level: msg.params.type === 'warn' ? 'warning' : msg.params.type, text: msg.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' ') });
        else if (msg.method === 'Runtime.exceptionThrown') { const d = msg.params.exceptionDetails; page.logs.push({ level: 'exception', text: (d.exception && d.exception.description) || d.text }); }
        else if (msg.method === 'Log.entryAdded') page.logs.push({ level: msg.params.entry.level, text: msg.params.entry.text + (msg.params.entry.url ? ' ' + msg.params.entry.url : '') });
      });
      await page.send('Page.enable'); await page.send('Runtime.enable'); await page.send('Log.enable');
      await page.send('Emulation.setDeviceMetricsOverride', { width: o.width || 1440, height: o.height || 810, deviceScaleFactor: o.dpr || 1, mobile: false });
      if (url) { await page.send('Page.navigate', { url }); await sleep(o.wait || 800); }
      return page;
    },
    async close() { try { ws.close(); } catch (e) { /* kapalı */ } proc.kill(); await sleep(200); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* önemsiz */ } },
  };
  return B;
}

function fileUrl(rel, query) {
  const p = path.resolve(__dirname, '..', rel || 'index.html');
  return 'file://' + p.split(path.sep).map(encodeURIComponent).join('/').replace(/^file:\/\/%2F/, 'file:///').replace(/%3A/g, ':') + (query || '');
}

module.exports = { launch, fileUrl, sleep };

// Doğrudan çalıştırma: node _gelistirme/tarayici.js "?kum=1" cikti/kum.png 2000
if (require.main === module) {
  (async () => {
    const q = process.argv[2] || '';
    const out = process.argv[3] || path.join(__dirname, 'cikti', 'ekran.png');
    const wait = parseInt(process.argv[4] || '1500', 10);
    const B = await launch();
    const p = await B.open(fileUrl('index.html', q), { wait });
    await p.shot(out);
    const errs = p.errors();
    console.log(errs.length ? errs.map((e) => `[${e.level}] ${e.text}`).join('\n') : 'konsol temiz');
    await B.close();
  })().catch((e) => { console.error('HATA', e.message); process.exit(1); });
}
