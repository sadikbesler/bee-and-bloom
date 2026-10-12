/* Bee & Bloom — fizik: karo türleri, sabitler, çarpışma ve arı hareketi. Tarayıcıya bağımlı değildir. */
(function (root) {
  'use strict';
  const BB = root.BB;
  const TILE = BB.TILE;
  const E = 0.01;

  // Karo türleri
  const T = {
    EMPTY: 0, SOLID: 1, SOLID2: 2, ONEWAY: 3, THORN_UP: 4, THORN_DOWN: 5, WATER: 6, WEB: 7, ICE: 8,
    BACK: 9, PINK: 10, BLUE: 11, THORN_L: 12, THORN_R: 13,
  };
  const TILE_CHARS = {
    '.': T.EMPTY, ' ': T.EMPTY, '#': T.SOLID, '%': T.SOLID2, '=': T.ONEWAY, '^': T.THORN_UP, 'v': T.THORN_DOWN,
    '~': T.WATER, 'w': T.WEB, 'I': T.ICE, ':': T.BACK, 'p': T.PINK, 'b': T.BLUE, '<': T.THORN_L, '>': T.THORN_R,
  };

  const PHYS = {
    walk: 80, gAccel: 1100, gDecel: 1500,
    iceAccel: 260, iceDecel: 60, iceMax: 105,
    airMax: 84, aAccel: 780, aDecel: 320,
    gravity: 820, fallMax: 165, glideFall: 62, glideBrake: 700,
    jumpV: 210, cutMult: 2.1,
    rise: 96, riseAccel: 1700,
    energyTime: 0.55, refill: 9,
    coyote: 0.1, buffer: 0.12,
    carryRise: 0.72, carryJump: 0.8,
    bounceV: 330, bounceHold: 380,
    throwVX: 120, throwVY: 175,
    bw: 10, bh: 12,
  };

  class Bee {
    constructor(id, role, x, y) {
      this.id = id; this.role = role; this.isBee = true;
      this.w = PHYS.bw; this.h = PHYS.bh;
      this.x = x; this.y = y; this.px = x; this.py = y;
      this.vx = 0; this.vy = 0;
      this.facing = id === 0 ? 1 : -1;
      this.onGround = true; this.groundKind = 'solid'; this.support = null;
      this.energy = 1; this.heat = 1;
      this.coyote = 0; this.jumpBuf = 0;
      this.alive = true;
      this.carrying = null; this.carriedBy = null; this.item = null;
      this.stuck = null; this.strain = 0; this.holdFlower = null;
      this.flapping = false; this.gliding = false; this.jumping = false;
      this.hitX = 0; this.windX = 0; this.windY = 0; this.shielded = false;
      this.animT = 0; this.flapT = 0; this.landT = 0; this.emote = null; this.emoteT = 0;
      this.pointDir = 0; this.callT = 0; this.nectarCd = 0; this.lastSafe = null;
      this.coldT = 0; this.warmBoost = 0;
    }
    get mass() { return this.carrying ? 2 : 1; }
  }

  // Dünya sınıfına eklenecek çarpışma yöntemleri
  const Collide = {
    tileAt(c, r) {
      if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return T.EMPTY;
      return this.tiles[r * this.cols + c];
    },

    // 0: boş, 1: katı, 2: yalnız üstten katı
    tileSolid(b, c, r) {
      if (c < 0 || c >= this.cols) return 1;
      if (r < 0) return 1;                 // haritanın üstü görünmez tavan
      if (r >= this.rows) return 0;        // alt: boşluk (düşüş)
      const t = this.tiles[r * this.cols + c];
      switch (t) {
        case T.SOLID: case T.SOLID2: case T.ICE: return 1;
        case T.ONEWAY: return 2;
        case T.PINK: return b.role === 'disi' ? 2 : 0;
        case T.BLUE: return b.role === 'erkek' ? 2 : 0;
        default: return 0;
      }
    },

    solidFor(s, b) {
      if (!s.active) return false;
      if (s.only && s.only !== b.role) return false;
      if (s.noItems && b.isItem) return false;
      return true;
    },

    // b, (x,y) konumunda bir katıyla çakışıyor mu? (tek yönlüler sayılmaz)
    blockedAt(b, x, y, h) {
      const hh = h || b.h;
      const c0 = Math.floor((x + E) / TILE), c1 = Math.floor((x + b.w - E) / TILE);
      const r0 = Math.floor((y + E) / TILE), r1 = Math.floor((y + hh - E) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.tileSolid(b, c, r) === 1) return true;
      const box = { x, y, w: b.w, h: hh };
      for (const s of this.solids) if (!s.oneWay && this.solidFor(s, b) && ovE(box, s)) return true;
      return false;
    },

    moveX(b, dx) {
      let moved = 0;
      b.hitX = 0;
      while (Math.abs(dx) > 1e-9) {
        const st = Math.abs(dx) > 4 ? 4 * Math.sign(dx) : dx;
        dx -= st;
        const x0 = b.x;
        b.x += st;
        let hit = false;
        const r0 = Math.floor((b.y + E) / TILE), r1 = Math.floor((b.y + b.h - E) / TILE);
        if (st > 0) {
          const c = Math.floor((b.x + b.w - E) / TILE);
          for (let r = r0; r <= r1; r++) if (this.tileSolid(b, c, r) === 1) { const nx = c * TILE - b.w; if (nx >= x0 - 1) { b.x = nx; hit = true; } break; }
        } else {
          const c = Math.floor((b.x + E) / TILE);
          for (let r = r0; r <= r1; r++) if (this.tileSolid(b, c, r) === 1) { const nx = (c + 1) * TILE; if (nx <= x0 + 1) { b.x = nx; hit = true; } break; }
        }
        for (const s of this.solids) {
          if (s.oneWay || !this.solidFor(s, b) || !ovE(b, s)) continue;
          if (st > 0 ? x0 + b.w > s.x + 0.5 : x0 < s.x + s.w - 0.5) continue;   // zaten içindeydi
          b.x = st > 0 ? s.x - b.w : s.x + s.w; hit = true;
        }
        moved += b.x - x0;
        if (hit) { b.hitX = Math.sign(st); break; }
      }
      return moved;
    },

    // dikey hareket; aşağı inerken tek yönlülere ve ortağın başına konabilir
    moveY(b, dy) {
      let moved = 0;
      while (Math.abs(dy) > 1e-9) {
        const st = Math.abs(dy) > 4 ? 4 * Math.sign(dy) : dy;
        dy -= st;
        const y0 = b.y;
        b.y += st;
        let hit = null;
        const c0 = Math.floor((b.x + E) / TILE), c1 = Math.floor((b.x + b.w - E) / TILE);
        if (st > 0) {
          const r = Math.floor((b.y + b.h - E) / TILE);
          for (let c = c0; c <= c1; c++) {
            const s = this.tileSolid(b, c, r);
            if (s === 1 || (s === 2 && y0 + b.h <= r * TILE + E)) {
              const ny = r * TILE - b.h;
              if (ny >= y0 - 1) { b.y = ny; hit = { kind: this.tileAt(c, r) === T.ICE ? 'ice' : 'solid' }; }
              break;
            }
          }
        } else {
          const r = Math.floor((b.y + E) / TILE);
          for (let c = c0; c <= c1; c++) if (this.tileSolid(b, c, r) === 1) {
            const ny = (r + 1) * TILE;
            if (ny <= y0 + 1) {
              // köşe düzeltme: kafa bir karonun köşesine az değdiyse yana kaydır
              if (b.isBee && this.cornerNudge(b, y0, b.y)) break;
              b.y = ny; hit = { kind: 'ceiling' };
            }
            break;
          }
        }
        for (const s of this.solids) {
          if (!this.solidFor(s, b) || !ovE(b, s)) continue;
          if (st > 0) {
            if (y0 + b.h > s.y + 0.5) continue;
            b.y = s.y - b.h; hit = { kind: s.kind || 'solid', solid: s };
          } else {
            if (s.oneWay) continue;
            if (y0 < s.y + s.h - 0.5) continue;
            b.y = s.y + s.h; hit = { kind: 'ceiling' };
          }
        }
        if (st > 0 && b.isBee && !hit) {
          const o = this.partnerOf(b);
          if (o && o.alive && !o.carriedBy && !b.carrying && o !== b.carriedBy && !o.stuck) {
            if (y0 + b.h <= o.y + 0.5 && b.y + b.h > o.y && b.x + b.w > o.x + 2 && b.x < o.x + o.w - 2) {
              b.y = o.y - b.h; hit = { kind: 'partner', bee: o };
            }
          }
        }
        moved += b.y - y0;
        if (hit) {
          if (st > 0) { b.onGround = true; b.groundKind = hit.kind; b.support = hit.solid || hit.bee || null; }
          if (b.vy * st > 0) b.vy = 0;
          b.lastHit = hit;
          break;
        }
      }
      return moved;
    },

    cornerNudge(b, y0, ny) {
      for (const d of [1, -1, 2, -2, 3, -3]) {
        if (!this.blockedAt(b, b.x + d, y0) && !this.blockedAt(b, b.x + d, ny)) { b.x += d; return true; }
      }
      return false;
    },

    // b'nin ayağının altında ne var (yerde durma testi)
    probeGround(b) {
      const y = b.y + b.h;
      const c0 = Math.floor((b.x + E) / TILE), c1 = Math.floor((b.x + b.w - E) / TILE);
      const r = Math.floor((y + 0.5) / TILE);
      if (Math.abs(y - r * TILE) < 0.6) {
        for (let c = c0; c <= c1; c++) {
          const s = this.tileSolid(b, c, r);
          if (s) return this.tileAt(c, r) === T.ICE ? 'ice' : 'solid';
        }
      }
      for (const s of this.solids) {
        if (!this.solidFor(s, b)) continue;
        if (Math.abs(s.y - y) < 0.6 && b.x + b.w > s.x + E && b.x < s.x + s.w - E) return s.kind || 'solid';
      }
      return null;
    },
  };

  function ovE(a, b) {
    return a.x < b.x + b.w - E && a.x + a.w > b.x + E && a.y < b.y + b.h - E && a.y + a.h > b.y + E;
  }

  BB.T = T; BB.TILE_CHARS = TILE_CHARS; BB.PHYS = PHYS; BB.Bee = Bee; BB.Collide = Collide; BB.ovE = ovE;
})(typeof window !== 'undefined' ? window : globalThis);
