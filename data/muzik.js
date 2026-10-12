/* Bee & Bloom — kodla bestelenmiş chiptune döngüler. Her ölçü: akor + melodi (8 adım = sekizlik notalar).
   '-' önceki notayı uzatır, '.' sus. bassPat: r = kök, f = beşli, o = oktav, t = üçlü. arp: akor notalarının sırası. */
(function (root) {
  'use strict';
  const BB = root.BB;
  const S = {};

  // ölçü yardımcısı: [akor, melodi, (ikinci ses)]
  const bars = (list) => list.map(([chord, lead, alt]) => ({ chord, lead: lead.split(' '), alt: alt ? alt.split(' ') : null }));

  S.menu = {
    bpm: 96, steps: 8, leadWave: 'sq25', leadVol: 0.075, arp: '0121', arpVol: 0.022, bassPat: 'r...f...', bassOct: 2, drums: 'k...s...',
    bars: bars([
      ['F', 'A4 . C5 . F5 - E5 .'], ['C', 'G4 - - . E5 . D5 C5'], ['Dm', 'D5 - F5 . A5 - G5 F5'], ['Bb', 'F5 - - - D5 . . .'],
      ['F', 'A4 . C5 . F5 - G5 .'], ['C', 'A5 - G5 . E5 . C5 .'], ['Dm', 'D5 . E5 . F5 . A5 .'], ['C', 'G5 - - - - . . .'],
    ]),
  };

  S.bahar = {
    bpm: 120, steps: 8, leadWave: 'sq25', leadVol: 0.08, arp: '0121', arpVol: 0.025, bassPat: 'r.f.r.f.', bassOct: 2, drums: 'k.h.s.h.',
    bars: bars([
      ['C', 'E5 . G5 . C6 . G5 .'], ['Am', 'A5 . G5 . E5 . C5 .'], ['F', 'F5 . A5 . G5 . F5 .'], ['G', 'E5 - D5 . - . G4 .'],
      ['C', 'E5 . G5 . C6 . D6 .'], ['Am', 'E6 . D6 . C6 . A5 .'], ['F', 'G5 . F5 . E5 . D5 .'], ['G', 'C5 - - - . . G4 .'],
      ['F', 'A5 . A5 . G5 . F5 .'], ['G', 'G5 . B5 . D6 . B5 .'], ['Em', 'G5 . E5 . B4 . E5 .'], ['Am', 'A5 - - . C6 . A5 .'],
      ['F', 'F5 . A5 . C6 . A5 .'], ['G7', 'G5 . B5 . D6 . F6 .'], ['C', 'E6 - C6 . G5 . E5 .'], ['C', 'C6 - - - . . . .'],
    ]),
  };

  S.yaz = {
    bpm: 132, steps: 8, leadWave: 'sq25', leadVol: 0.08, arp: '0212', arpVol: 0.026, bassPat: 'r..r.fo.', bassOct: 2, drums: 'k.hks.h.',
    bars: bars([
      ['G', 'B4 . D5 G5 . B5 . A5'], ['D', 'F#5 - D5 . A4 . D5 .'], ['Em', 'E5 . G5 B5 . G5 . E5'], ['C', 'G5 - - . E5 . C5 .'],
      ['G', 'B4 . D5 G5 . B5 . D6'], ['D', 'C6 - A5 . F#5 . D5 .'], ['C', 'E5 . G5 . C6 . E6 .'], ['D', 'D6 - - - A5 . F#5 .'],
      ['Em', 'G5 . . B5 . . E6 .'], ['C', 'E6 - D6 . C6 . G5 .'], ['G', 'B5 . . D6 . . G6 .'], ['D', 'F#6 - E6 . D6 . A5 .'],
      ['C', 'G5 . E5 . G5 . C6 .'], ['D', 'A5 . F#5 . A5 . D6 .'], ['G', 'B5 - G5 . D5 . G5 .'], ['G', 'G5 - - - . . . .'],
    ]),
  };

  S.sonbahar = {
    bpm: 100, steps: 8, leadWave: 'sq25', leadVol: 0.075, arp: '0123', arpVol: 0.024, bassPat: 'r...r.f.', bassOct: 2, drums: 'k...s..h',
    bars: bars([
      ['Am', 'E5 - - . A5 . C6 .'], ['F', 'B5 - A5 . F5 - - .'], ['C', 'G5 . E5 . C5 . E5 .'], ['G', 'D5 - - - B4 . D5 .'],
      ['Am', 'E5 . A5 . C6 . E6 .'], ['F', 'D6 - C6 . A5 . F5 .'], ['G', 'G5 . B5 . D6 . B5 .'], ['E', 'G#5 - - - E5 . . .'],
      ['F', 'A5 - - . C6 . A5 .'], ['C', 'G5 - - . E5 . C5 .'], ['Dm', 'F5 . A5 . D6 . C6 .'], ['E', 'B5 - G#5 . E5 . . .'],
    ]),
  };

  S.magara = {
    bpm: 88, steps: 8, leadWave: 'triangle', leadVol: 0.12, echo: true, arp: '0.2.1.2.', arpVol: 0.02, bassPat: 'r.......', bassOct: 2, drums: 'k.......h...s...',
    bars: bars([
      ['Dm', 'D5 . . F5 . . A5 .'], ['Bb', '. . Bb5 . A5 . F5 .'], ['C', 'G5 . . E5 . . C5 .'], ['Am', 'E5 - - - . . . .'],
      ['Dm', 'A5 . . D6 . . C6 .'], ['Gm', 'Bb5 . . G5 . . D5 .'], ['A', 'C#5 . E5 . A5 . G5 .'], ['A', 'E5 - - - . . . .'],
    ]),
  };

  S.kis = {
    bpm: 76, steps: 8, leadWave: 'triangle', leadVol: 0.12, echo: true, arp: '0.1.2.1.', arpVol: 0.022, bassPat: 'r.......', bassOct: 2, drums: '........h.......',
    bars: bars([
      ['Em', 'B4 - - - E5 - G5 -'], ['C', 'G5 - - - E5 - - -'], ['G', 'D5 - - - B4 - D5 -'], ['D', 'F#5 - - - - - - -'],
      ['Em', 'B5 - - - G5 - E5 -'], ['C', 'E5 - G5 - C6 - B5 -'], ['Am', 'A5 - - - E5 - C5 -'], ['B', 'D#5 - - - - - - -'],
    ]),
  };

  S.kovan = {
    bpm: 108, steps: 8, leadWave: 'sq25', leadVol: 0.08, arp: '0121', arpVol: 0.025, bassPat: 'r.r.f.o.', bassOct: 2, drums: 'k.h.s.hk',
    bars: bars([
      ['D', 'F#5 . A5 . D6 - C#6 .'], ['A', 'E5 . A5 . C#6 - B5 .'], ['Bm', 'D5 . F#5 . B5 - A5 .'], ['G', 'G5 - - . D5 . G5 .'],
      ['D', 'F#5 . A5 . D6 . E6 .'], ['A', 'F#6 - E6 . C#6 . A5 .'], ['G', 'B5 . A5 . G5 . F#5 .'], ['A', 'E5 - - - . . . .'],
      ['Bm', 'F#5 . B5 . D6 . B5 .'], ['G', 'G5 . B5 . D6 . G6 .'], ['D', 'F#6 - D6 . A5 . F#5 .'], ['A', 'E5 . A5 . C#6 . E6 .'],
      ['G', 'D6 - B5 . G5 . B5 .'], ['A', 'C#6 - A5 . E5 . C#6 .'], ['D', 'D6 - - . A5 . F#5 .'], ['D', 'D6 - - - . . . .'],
    ]),
  };

  S.kamp = {
    bpm: 84, steps: 8, leadWave: 'triangle', leadVol: 0.11, arp: '0.1.2.1.', arpVol: 0.022, bassPat: 'r...f...', bassOct: 2, drums: '',
    bars: bars([
      ['F', 'C5 - F5 - A5 - G5 -'], ['Am', 'E5 - - - C5 - E5 -'], ['Bb', 'D5 - F5 - Bb5 - A5 -'], ['C', 'G5 - - - - - - -'],
      ['F', 'A5 - G5 - F5 - C5 -'], ['Am', 'E5 - G5 - A5 - C6 -'], ['Bb', 'Bb5 - A5 - G5 - F5 -'], ['C', 'E5 - - - G5 - - -'],
    ]),
  };

  S.kacis = {
    bpm: 150, steps: 8, leadWave: 'sq25', leadVol: 0.075, arp: '0120', arpVol: 0.022, bassPat: 'rorororo', bassOct: 2, drums: 'khshkhsh',
    bars: bars([
      ['Dm', 'D5 . F5 . A5 . F5 .'], ['C', 'E5 . G5 . C6 . G5 .'], ['Bb', 'F5 . Bb5 . D6 . Bb5 .'], ['A', 'C#6 . A5 . E5 . C#5 .'],
      ['Dm', 'A5 . D6 . F6 . D6 .'], ['C', 'G5 . C6 . E6 . C6 .'], ['Bb', 'D6 . Bb5 . F5 . D5 .'], ['A', 'E5 - - . A5 - - .'],
    ]),
  };

  S.firtina = {
    bpm: 112, steps: 8, leadWave: 'triangle', leadVol: 0.11, echo: true, arp: '01210121', arpVol: 0.022, bassPat: 'r.r.r.r.', bassOct: 2, drums: 'k..hk.s.',
    bars: bars([
      ['Em', 'E5 - - . G5 . B5 .'], ['C', 'C6 - - . B5 . G5 .'], ['D', 'A5 - - . F#5 . D5 .'], ['B', 'D#5 - - - F#5 - - -'],
      ['Em', 'B5 - - . E6 . D6 .'], ['C', 'C6 - - . G5 . E5 .'], ['Am', 'A5 . C6 . E6 . C6 .'], ['B', 'B5 - - - - - - -'],
    ]),
  };

  S.final = {
    bpm: 72, steps: 8, leadWave: 'sq25', leadVol: 0.085, altWave: 'triangle', altVol: 0.06, arp: '0123', arpVol: 0.022, bassPat: 'r...f...', bassOct: 2, drums: 'k.......h.......',
    bars: bars([
      ['C', 'E5 - - - G5 - - -', 'C5 - - - E5 - - -'], ['G', 'D5 - - - B4 - - -', 'B4 - - - G4 - - -'], ['Am', 'C5 - E5 - A5 - - -', 'A4 - C5 - E5 - - -'], ['F', 'A5 - G5 - F5 - - -', 'F5 - E5 - C5 - - -'],
      ['C', 'E5 - G5 - C6 - - -', 'C5 - E5 - G5 - - -'], ['G', 'B5 - - - D6 - - -', 'G5 - - - B5 - - -'], ['F', 'C6 - A5 - F5 - A5 -', 'A5 - F5 - C5 - F5 -'], ['C', 'G5 - - - - - - -', 'E5 - - - - - - -'],
      ['Am', 'E5 - A5 - C6 - B5 -', 'C5 - E5 - A5 - G5 -'], ['Em', 'B5 - G5 - E5 - - -', 'G5 - E5 - B4 - - -'], ['F', 'F5 - A5 - C6 - D6 -', 'C5 - F5 - A5 - B5 -'], ['G', 'D6 - - - B5 - - -', 'B5 - - - G5 - - -'],
      ['C', 'E6 - D6 - C6 - G5 -', 'C6 - B5 - G5 - E5 -'], ['F', 'A5 - C6 - F6 - E6 -', 'F5 - A5 - C6 - C6 -'], ['G', 'D6 - - - B5 - D6 -', 'B5 - - - G5 - B5 -'], ['C', 'C6 - - - - - - -', 'E5 - - - - - - -'],
    ]),
  };

  BB.SONGS = S;
  BB.SONGS_LIST = Object.keys(S);
})(typeof window !== 'undefined' ? window : globalThis);
