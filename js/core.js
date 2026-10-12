/* Bee & Bloom — çekirdek: isim alanı, sabitler, küçük yardımcılar. Tarayıcıya bağımlı değildir (Node'da da çalışır). */
(function (root) {
  'use strict';
  const BB = root.BB = root.BB || {};

  BB.VERSION = '1.0.0';
  BB.W = 480;
  BB.H = 270;
  BB.TILE = 16;
  BB.DT = 1 / 60;

  BB.LEVELS = BB.LEVELS || [];
  BB.SCENES = BB.SCENES || {};
  BB.QUESTIONS = BB.QUESTIONS || [];

  // tura özel içerik: round 1 → yalnız ilk tur; round 2 → ikinci ve sonraki turlar
  BB.roundMatch = function (want, cur) { cur = cur || 1; return want === 1 ? cur === 1 : cur >= want; };
  BB.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  BB.lerp = (a, b, t) => a + (b - a) * t;
  BB.approach = (v, t, s) => (v < t ? Math.min(v + s, t) : Math.max(v - s, t));
  BB.sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  BB.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  BB.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  BB.cx = (b) => b.x + b.w / 2;
  BB.cy = (b) => b.y + b.h / 2;

  // Deterministik rastgele sayı üreteci (mulberry32)
  BB.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // Konuma bağlı sabit gürültü (süsleme yerleşimi vb. için)
  BB.hash2 = function (x, y, s) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // ------------------------------------------------------------ Türkçe metin yardımcıları
  BB.lowerTR = (s) => String(s).replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
  BB.upperTR = (s) => String(s).replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();

  const VOWELS = 'aeıioöuü';
  const BACK = 'aıou';
  const HARD = 'fstkçşhp';
  const NORM = { 'â': 'a', 'î': 'i', 'û': 'u', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'á': 'a', 'à': 'a', 'ä': 'e', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ú': 'u', 'ù': 'u', 'í': 'i', 'ì': 'i', 'ï': 'i' };

  function soundOf(name) {
    let s = BB.lowerTR(name).trim();
    let out = '';
    for (const ch of s) out += NORM[ch] !== undefined ? NORM[ch] : ch;
    return out;
  }

  // Özel isme güvenli Türkçe ek: BB.ek('Ali','in') → "Ali'nin", BB.ek('Mert','de') → "Mert'te"
  // Türler: in (tamlayan), i (belirtme), e (yönelme), de (bulunma), den (ayrılma), le (birliktelik)
  BB.ek = function (name, kind) {
    const raw = String(name).trim();
    const s = soundOf(raw);
    let last = '';
    for (let i = s.length - 1; i >= 0; i--) if (VOWELS.includes(s[i])) { last = s[i]; break; }
    const back = last ? BACK.includes(last) : false;
    const two = back ? 'a' : 'e';
    const four = !last ? 'i' : last === 'a' || last === 'ı' ? 'ı' : last === 'e' || last === 'i' ? 'i' : last === 'o' || last === 'u' ? 'u' : 'ü';
    const end = s[s.length - 1] || '';
    const endsVowel = VOWELS.includes(end);
    const hard = HARD.includes(end);
    let suf;
    switch (kind) {
      case 'in': suf = (endsVowel ? 'n' : '') + four + 'n'; break;
      case 'i': suf = (endsVowel ? 'y' : '') + four; break;
      case 'e': suf = (endsVowel ? 'y' : '') + two; break;
      case 'de': suf = (hard ? 't' : 'd') + two; break;
      case 'den': suf = (hard ? 't' : 'd') + two + 'n'; break;
      case 'le': suf = (endsVowel ? 'y' : '') + 'l' + two; break;
      default: return raw;
    }
    return raw + "'" + suf;
  };

  // Metindeki yer tutucuları çöz: {p1}, {p2}, {p1|in}, {bee1} ...
  BB.fmt = function (text, ctx) {
    if (text == null) return '';
    return String(text).replace(/\{([a-zA-Z0-9_]+)(?:\|([a-z]+))?\}/g, (m, key, suf) => {
      const v = ctx && ctx[key];
      if (v === undefined || v === null) return m;
      return suf ? BB.ek(v, suf) : String(v);
    });
  };

  BB.pad2 = (n) => (n < 10 ? '0' : '') + n;
  BB.fmtTime = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? h + ':' + BB.pad2(m) + ':' + BB.pad2(s) : m + ':' + BB.pad2(s);
  };
  BB.fmtDate = function (ts) {
    const d = new Date(ts);
    const ay = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return d.getDate() + ' ' + ay[d.getMonth()] + ' ' + d.getFullYear();
  };
  BB.fmtStamp = function (ts) {
    const d = new Date(ts);
    return BB.pad2(d.getDate()) + '.' + BB.pad2(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + BB.pad2(d.getHours()) + ':' + BB.pad2(d.getMinutes());
  };
})(typeof window !== 'undefined' ? window : globalThis);
