// Bölüm haritası çizim yardımcısı: koordinatla karo yerleştirip ASCII satırları üretir.
// Örnek: const h = new Harita(140, 17); h.zemin(0, 139, 15); h.koy(3, 14, '1'); console.log(h.satirlar());
class Harita {
  constructor(cols, rows) {
    this.cols = cols; this.rows = rows;
    this.g = [];
    for (let r = 0; r < rows; r++) this.g.push(Array(cols).fill('.'));
  }
  koy(c, r, ch) { if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) this.g[r][c] = ch; return this; }
  al(c, r) { return this.g[r] ? this.g[r][c] : undefined; }
  doldur(c0, r0, c1, r1, ch) { for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) this.koy(c, r, ch); return this; }
  // c0..c1 arası, üst satırı 'ust' olan zemin (alta kadar dolu)
  zemin(c0, c1, ust, ch) { return this.doldur(c0, ust, c1, this.rows - 1, ch || '#'); }
  bosalt(c0, r0, c1, r1) { return this.doldur(c0, r0, c1, r1, '.'); }
  cukur(c0, c1) { return this.bosalt(c0, 0, c1, this.rows - 1); }
  raf(c0, c1, r) { return this.doldur(c0, r, c1, r, '='); }
  sira(c0, c1, r, ch, adim) { for (let c = c0; c <= c1; c += adim || 1) this.koy(c, r, ch); return this; }
  satirlar() { return this.g.map((r) => r.join('')); }
  cetvel() {
    const tens = Array.from({ length: this.cols }, (_, i) => (i % 10 === 0 ? String(Math.floor(i / 10) % 10) : ' ')).join('');
    const ones = Array.from({ length: this.cols }, (_, i) => String(i % 10)).join('');
    return ['   ' + tens, '   ' + ones].concat(this.g.map((r, i) => String(i).padStart(2) + ' ' + r.join(''))).join('\n');
  }
}
module.exports = { Harita };
