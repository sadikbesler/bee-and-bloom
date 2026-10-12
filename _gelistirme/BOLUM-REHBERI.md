# Bee & Bloom — Bölüm Tasarım Rehberi

Bu rehber, bölüm (level) tasarlayan herkes içindir. Oyun motoru `js/` içindedir ve **değiştirilmez**; bölümler
veri olarak yazılır. Hikâye metinleri `data/sahneler.js` içindedir (ayrı yazılır). Ayrıntılı hikâye planı: `_gelistirme/HIKAYE.md`.

## 1. Dosyalar ve iş akışı
- Üretici: `_gelistirme/bolumler/dN.js` (N = dünya no). Örnek: `_gelistirme/bolumler/d1.js`. Koordinatla harita çizmek için
  `_gelistirme/harita.js` (`Harita` sınıfı: `koy, doldur, zemin, bosalt, cukur, raf, sira, satirlar, cetvel`).
- Üretici çalıştırılınca `data/dunyaN.js` yazılır: `node _gelistirme/bolumler/dN.js`. (data dosyasını elle düzenleme; üreticiyi düzenle.)
- Çözüm betiği: `_gelistirme/cozumler/dN.js` → `module.exports = { [bölümNo](r) { ... } }`. Örnek: `cozumler/d1.js`.
- Testler (proje kökünden):
  - `node _gelistirme/solve.js 4 5 6` → bölüm sonuna ulaşıldı mı + kayıt yeniden oynatma (determinizm).
  - `node _gelistirme/explore.js 4 --kapilar=kapali` → TEK arı, iş birliği kapıları (coop:true) kapalıyken **çıkışa ulaşamamalı**.
  - `node _gelistirme/explore.js 4 --kapilar=acik --omuz` → bütün polen/nadir çiçek/bal çiçeği/soru/çıkış erişilebilir olmalı ("ulaşılamayan: yok").
    (`--omuz` olmadan da dene: omuz omuza gerektirmesi istenen gizli ödül hariç her şey tek arıyla erişilebilir olmalı.)
  - `node _gelistirme/bolum_onizleme.js 4` → `_gelistirme/cikti/bolum_4.png` (bölümün tamamı; görsel inceleme).
  - Tarayıcıda: `index.html?level=4` (isimler: `&p1=Ayşe&p2=Mert`, sahnesiz: `&scene=0`).

## 2. Harita
- 16×16 karolar. Yükseklik **en az 17 satır** (ekran 270 px ≈ 16.9 karo). Genişlik 120–220 sütun önerilir (dikey bölümlerde daha dar/uzun olabilir).
- Haritanın **üstü görünmez tavandır** (arılar 0. satırın üstüne çıkamaz); sağ/sol kenarlar duvardır; alt kenardan düşmek ölümdür.
- Karakterler:

| Kar. | Anlam | | Kar. | Anlam |
|---|---|---|---|---|
| `.` | boş | | `1` `2` | başlangıç (1. ve 2. oyuncu); **altı zemin olmalı** |
| `#` | katı zemin (dünyanın dokusu) | | `C` | Bal Çiçeği (checkpoint); altı zemin, iki yanında 1'er karo düz zemin |
| `%` | ikinci katı doku (taş/tahta/petek) | | `E` | çıkış kapısı (2 karo genişlik); altı zemin |
| `=` | tek yönlü platform (alttan geçilir) | | `Q` | soru noktası (kaide); sırası soldan sağa `questions` listesiyle eşleşir |
| `^` `v` | diken (yukarı / tavandan aşağı) | | `o` | polen (toplanabilir) |
| `<` `>` | duvar dikeni (sola / sağa bakan) | | `*` | nadir çiçek (bölüm başına 1 gizli ödül) |
| `~` | su (öldürür; yüzeyi 6 px aşağıda) | | `n` | nektar çiçeği (havada kanat enerjisini doldurur) |
| `w` | örümcek ağı (yapıştırır) | | `F` | bal-ateşi (kışta ısıtır) |
| `I` | buz (kaygan katı) | | `M` | zıplama mantarı |
| `:` | arka plan duvarı (çarpışmasız, süs) | | `p` / `b` | pembe/mavi yaprak: yalnız fiyonklu (dişi) / şapkalı (erkek) arıya TEK YÖNLÜ platform |

## 3. Bölüm nesnesi
```js
{ id: 4, world: 2, name: 'Nilüfer Basamakları', theme: 'yaz', weather: 'sparkle', // bahar|yaz|sonbahar|magara|kis|kovan
  dark: false, cold: false, music: (isteğe bağlı şarkı adı: kacis, firtina…),
  map: [...], questions: ['S21', 'S27'],            // data/sorular.js içindeki id'ler (her sorunun level alanına bak)
  scenes: { start: 'L4_start', end: 'L4_end' },     // HIKAYE.md'deki sahne kimlikleri
  marks: { golgeA: [40, 14], golgeB: [70, 14] },    // sahnelerde kullanılan noktalar [sütun, satır]
  objects: [ ... ] }
```
Hava: petals, sparkle, rain, leaves, fireflies, snow, storm, pollen.

## 4. Nesneler (objects) — koordinatlar karo (sütun x, satır y)
| t | Alanlar | Açıklama |
|---|---|---|
| `plate` | x, y, id, timer? | Basınç plakası; üstünde arı/eşya varken `id` kanalı açık. `timer`: bırakınca n sn daha açık |
| `gate` | x, y, w=1, h, on, any?, invert?, latch?, coop?, style?, dir? | Kapı. `on`: 'a' ya da ['a','b'] (hepsi) / any:true (herhangi). `latch`: bir kez açılınca kalıcı. `coop:true`: iş birliği kapısı (testler bunu kapalı tutar). dir: 'up' (yukarı çekilir) / 'down'. style: hedge, petal, reed, root, crystal, ice, wax, wood, stone (boşsa dünyaya göre) |
| `flower` | x, y, id | "Çiçeği açık tut": arı yanında eylem tuşunu BASILI tuttukça `id` açık; tutan arı yürüyemez |
| `item` | x, y, kind | `pollen` (polen topu: ağır, az uçar, saksıya konur), `lantern` (fener: karanlıkta ışık + ışık köprüsü), `shield` (geniş yaprak: tutan rüzgârdan etkilenmez, uçamaz, yürür; rüzgârın estiği yöne doğru gölge oluşturur ve şemsiye gibi damlaları keser). Eşya, aynı checkpoint bölütünde kullanılmalı (ölünce başlangıç yerine döner) |
| `pot` | x, y, id | Polen topu içine bırakılınca kalıcı `id` açılır |
| `vine` | x, y, h, on | `on` açılınca h karo boyunca büyür; her 2 karoda bir yaprak (tek yönlü platform) |
| `platform` | x, y, w, to:[x,y], on?, speed=40, loop?, style? | Hareketli/asansör platformu (tek yönlü). `on` yoksa ve loop:true ise sürekli gider gelir. style: leaf, wood, cloud, shroom, wax, ice, stone |
| `lily` | x, y, w=2, mode | Su yüzeyi satırında (suyun hemen üstü). `cap1`: tek arıyı taşır, iki arıda batar. `pair`: tek arıda batar, iki arı (ya da omuz omuza) dengede tutar |
| `wind` | x, y, w, h, vx, vy, gust?, cold?, on?, invert? | Rüzgâr bölgesi (px/sn). Taşınan çift kütle 2 sayılır (rüzgâr yarı etkiler). `gust: {period, on, phase, calm}` esinti. `cold`: kışta ısıyı hızlı düşürür. `on`: kanal açıkken rüzgâr durur (invert ile tersi) |
| `bounce` (ya da `M` karakteri) | x, y | Zıplama mantarı (~4 karo; kanat basılıysa ~5) |
| `pulse` | x, y, w, period, on, phase | Ritim platformu: her period'un ilk `on` saniyesi katı (bitmeden yanıp söner) |
| `bridge` | x, y, w | Işık köprüsü: yalnız fener (lantern) 60 px yakınındayken katı |
| `glow` | x, y, r=40 | Sabit ışık (karanlıkta) |
| `crumble` | x, y, w | Kırılan buz: üstüne basınca 0.5 sn sonra kırılır, 3.2 sn sonra geri gelir |
| `icicle` | x, y | Buz sarkıtı: altından (9 karo içinde) geçince sallanıp düşer, değeni öldürür |
| `drip` | x, y, period, phase | Damla kaynağı: periyodik düşen damla öldürür; katı/tek yönlü karo ve kalkan durdurur |
| `spider` | x, y, len, period, phase | İpte inip çıkan örümcek (öldürür) |
| `collapse` | x, trigger:[x,y,w,h], speed=52, until, scene? | Çöküş duvarı: tetiklenince sağa ilerler, gerisinde kalanı öldürür. Ölünce son checkpoint'in 9 karo gerisine çekilir |
| `rune` + `sequence` | rune: x, y, sym, seq / sequence: id, order | Sembol taşları (yagmur, ruzgar, yaprak, gunes, ay): eylemle yakılır; `order` sırası doğruysa kalıcı `id` açılır, yanlışsa sıfırlanır |
| `race` | id, start:[x,y,w,h], finish, path:[[x,y]...], speed, scenes:{start,win,lose}, spawn? | Zıpzıp yarışı: iki arı start bölgesine girince başlar; ikisi de finish x'ini kurbağadan önce geçerse kalıcı `id` |
| `npc` | x, y, who, face, id?, talk?, hidden? | Görsel karakter: kralice, puntur, zipzip, hu, isil, bora, golge |
| `bora` | x, y, need=7, flag, scene | Donmuş Bora: iki arı 30 px içindeyse ısınır; dolunca kalıcı `flag` + sahne |
| `trigger` | x, y, w, h, scene, need='any'/'both', req? | Sahne tetikleyici (bir kez). `req`: kanal açıkken etkin |
| `sign` | x, y, text | Tabela (yaklaşınca baloncuk). Yer tutucular: {p1} {p2} {k1sol} {k1sag} {k1kanat} {k1eylem} {k2sol} {k2sag} {k2kanat} {k2eylem} |
| `decor` | x, y, s, flip? | Süs (zemin satırına oturur): hive, jar, bush, rock, flowers, reeds, stump, crystal, snowman, comb, lantern_post, paw (buzlu pati izi), fur (beyaz tüy), feather, brokenweb, drop (bal damlası izi) |
| `mastery` | x, w, name | Ustalık Geçidi: arılar ilk girince adı ekranda belirir |
| `choice` | x, y, q, opt | Açık soru çiçeği (yalnız Dünya 1) |

Soru kapıları: n. soru cevaplanınca kalıcı `qn` kanalı açılır (`q1`, `q2` …) → `{ t: 'gate', ..., on: 'q1' }`.

## 5. Ölçülmüş fizik (tasarımda bunlara güven)
- Tek arı: en yüksek **~5 karo** (80 px); yerden yere yatay menzil **~11 karo**; yürüme 5 karo/sn; uçuş yatay 5.25 karo/sn.
- Kanat enerjisi 0.55 sn çırpma; yere/platforma/yerdeki ortağın başına değince ~0.1 sn'de dolar; nektar `n` havada doldurur.
- Bırakınca 165 px/sn düşer; enerjisi bitmiş halde basılı tutunca 62 px/sn süzülür.
- **Omuz omuza** (B, A'nın başına konar; A B'yi taşıyarak uçar; A yorulunca B zıplar): B'nin ayağı **~9.8 karo** yükselir → 6–9 karo duvarlar iş birliği ister.
- **Taşıma** (eylem: ortağı al): taşıyan %72 hızla yükselir ama iki enerji deposunu kullanır (taşıyanınki bitince taşınanınki). Taşı+yukarı fırlat ~7 karo. Çift rüzgârdan yarı etkilenir.
- Zıplama mantarı ~4 karo (kanat basılı ~5). Tek dokunuşla zıplama ~1 karo.
- **Bal ipi**: iki arı arasında yatayda ~23 karo (380 px), dikeyde ~12 karo (205 px) sınır var. İş birliği bulmacalarında arıları 20 karodan fazla ayırma.

## 6. Tasarım kuralları (hepsi zorunlu)
1. Başlangıç sahnesi (`scenes.start`), bölüm sonu sahnesi (`scenes.end`), 3–6 Bal Çiçeği (`C`), 2 soru (`Q`; 18. bölümde 6), 15–35 polen, 1 gizli nadir çiçek (`*`).
2. **En az bir zorunlu iş birliği bulmacası**, en az bir `coop: true` kapı ile (çift plaka + latch, çiçeği açık tut, zamanlı plaka devri, omuz omuza ile ulaşılan plaka, taşıma ile ulaşılan yer, nilüfer dengesi…). `explore --kapilar=kapali` ile çıkış tek arıya **kapalı** olmalı.
3. Tempo: sakin başlangıç → mekanik tanıtımı (tabela ile) → karışım → zirve zorluğu → rahatlama/hikâye. Arka arkaya aynı his olmasın.
4. Zorluk: çoğu yer kolay/orta; dünya başına 1–2 **Ustalık Geçidi** (`mastery` nesnesiyle adlandır). Her zor yerin **hemen önünde** Bal Çiçeği olsun.
5. Soru noktası: kaide `Q` + yanında bekçi NPC; hemen arkasında `on: 'qN'` kapısı (istersen). Soru bölgesi kaideyi ortalayan ~4.5×3.5 karodur; iki arı da girince soru başlar.
6. Eşyalar (polen topu, fener, kalkan) aynı checkpoint bölütünde kullanılsın.
7. Checkpoint'lerin iki yanı düz ve güvenli olsun (arılar çiçeğin 1 karo solunda/sağında doğar).
8. Tek arıyla yerine getirilebilen yükseklikler/mesafeler ≤ 4 karo / ≤ 9 karo (rahat); iş birliği istenen yerler ≥ 6 karo yükseklik ya da tek kanatla aşılamayan mesafe.
9. Kenar boşluğu: ilk/son 2 sütunda oyun alanı olmasın (kamera rahat).
10. Görsellik: dekor (`decor`) ve yükselti farklarıyla bölümü güzelleştir; düz uzun koridorlardan kaçın; üst kısmı boş bırakma (yüzen adalar, raflar, polen izleri).

## 7. Çözüm betiği API'si (r = Run)
- Görevler üreteçtir ve `r.run(görev1, görev2)` ile **paralel** koşar; `r.seq(...)` sırayla.
- `r.walkT(i, sütun)`, `r.flyT(i, sütun, satır)`, `r.landT(i, sütun, satır)` (sütun/satır karosuna in: o karo arının durduğu hücre), `r.flyTo(i, xPx, yPx, {land, tol, tolY, cruise, launch, noWalk})`,
  `r.path(i, [[sütun, satır, {land:true}], ...], {tiles:true})`, `r.act(i)`, `r.holdAction(i, kare)`, `r.holdWhile(i, ()=>koşul)`, `r.pickUp(i)` (ortağı al), `r.drop(i)`,
  `r.wait(kare)`, `r.until(()=>koşul, max)`, `r.gate(on)`, `r.gateOpen(on)`, `r.expectWin()`.
- Açık sorular (yalnız Dünya 1): `r.run(r.pickFlowers(a, b))`. Gizli/kim/tahmin soruları ve sahneler otomatik çözülür.
- Durum: `r.bee(i)` (x, y, vx, vy, energy, onGround, carrying…), `r.cx(i)`, `r.cy(i)`, `r.w` (dünya).
- Bot ipuçları: alçaktan uzağa gitmek için önce yürü/inişli ara noktalar ver; uzun uçuşlarda nektar ya da inişli ara noktalar kullan;
  omuz omuza: B'yi A'nın başına indir (`flyTo(B, r.cx(A), r.bee(A).y - 8)`), enerjisi dolunca A kanat çırpsın, A yorulunca B uçsun (örnek: cozumler/d1.js).
- Hata ayıklama: koşucunun `step`'ini sarıp arı durumlarını yazdır (ör. her 4 karede x/16, y/16, enerji).

## 8. Kabul ölçütleri (her bölüm)
- `node _gelistirme/solve.js N` → TAMAM (0 ölüm), determinizm geçer.
- `node _gelistirme/explore.js N --kapilar=kapali` → `cikis` ULAŞILAMAYAN listesinde.
- `node _gelistirme/explore.js N --kapilar=acik --omuz` → ulaşılamayan: yok.
- Doğrulama hatası/uyarısı yok (World kurulurken `BB.validateLevel` çalışır).
- `bolum_onizleme.js` çıktısı gözle incelendi: üst üste binen nesne yok, tabelalar okunur yerde, bölüm güzel görünüyor.
