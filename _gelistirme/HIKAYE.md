# Bee & Bloom — Hikâye Kılavuzu (bölüm tasarımcıları için)

Diyalog metinleri `data/sahneler.js` içinde ayrıca yazılır. Bölüm tasarımcısı **metin yazmaz**; aşağıdaki sahne
kimliklerine tetikleyici/başlangıç/bitiş bağlar, NPC'leri ve işaretleri (marks) belirtilen yerlere koyar.
Sahne henüz yazılmadıysa doğrulama hatası vermemesi için kendi data dosyanın sonuna yer tutucu ekle
(üretici `yaz.js` bunu otomatik yapmaz; dN.js üreticine `placeholders` listesi ver — bkz. d2+ örnekleri ya da şöyle):
```js
BB.SCENES['L4_start'] = BB.SCENES['L4_start'] || [{ say: 'anlatici', text: '(L4_start)' }];
```

## Öncül
Çiçek Vadisi'nin mevsimleri kovandaki Kraliçe Balı sayesinde döner. Bal sönüyor. Kraliçe iki genç arıyı (oyuncular)
yollar: "Bu bal, birbirini gerçekten tanıyan iki kalpten yapılır. Dört mevsimi geçin, bekçilerin sorularını yanıtlayın.
Bal sizi tanıyacaktır." Arılar balı bulup geri getireceklerini sanır. Yolda sürekli bir **Gölge** görürler: tuzakları
bozar, bal damlalarını toplayıp kaçar. Gölge aslında **Kutup Tilkisi Bora**'dır: kovanın eski nöbetçisi; balın son
ışığını kendi bedeninde (kuyruğunda) taşıyıp sıcak tutmuş, yolları arılar için temizlemiş, donmak üzeredir.
Final: Bal hiç çalınmadı; cevaplar bal damlasıydı; balı arılar yaptı.

## Gölge kuralları (Dünya 1–4)
Gölge yalnız **silüet** (npc_golge) ya da izlerle görünür: `decor` fur (beyaz tüy), paw (buzlu pati izi), brokenweb
(temizlenmiş ağ), drop (bal damlası izi). Asla konuşmaz. Kaçış sahneleri `shadow: {from: 'golgeA', to: 'golgeB'}`
adımıyla oynatılır → bölümde `marks: { golgeA: [sütun, satır], golgeB: [...] }` tanımla (satır = ayağının bastığı karo
satırı, yani zeminin bir üstü). Gölge koşarken kısa boyunca görünür olmalı (ekran içinde ~10–16 karo).

## Karakter kimlikleri (npc who)
kralice · puntur (uğur böceği) · zipzip (kurbağa kral) · hu (baykuş) · isil (ateş böceği) · bora (kutup tilkisi) · golge (silüet)
NPC'yi soru kaidesinin 2–3 karo yanına koy (face: arılara dönük: arılar soldan geliyorsa face: -1).

## Bölüm bölüm plan
Soruların hangi bölümde olduğu `data/sorular.js` içindeki `level` alanındadır (sırası soldan sağa).

### Dünya 1 — Çiçek Çayırı (bahar) · bekçi Püntür — (tamamlandı / ana tasarımcı)
- **L1 Kovanda Sabah**: L1_start, L1_puntur (tetik), L1_end.
- **L2 Polen Yolu**: L2_start, L2_golge (tetik: ilk Gölge silüeti bir bal damlasını kapıp kaçar; marks golgeA/golgeB; yanına decor drop), L2_end.
- **L3 Çayır Kapısı**: L3_start, L3_kapi (Püntür'ün kapısı; soru öncesi), L3_end (Püntür'e veda). Ustalık Geçidi: "Ağ Koridoru".

### Dünya 2 — Yaz Gölü (yaz) · bekçi Kral Zıpzıp
Mekanik: su, nilüfer (cap1/pair), taşıma (uzun uçuş ve rüzgâr), akıntı/şelale (aşağı esen rüzgâr vy>0), yusufçuk platformları (platform loop).
- **L4 Nilüfer Basamakları** (sorular S21, S27 — Zıpzıp): `L4_start` (göl kıyısı, Zıpzıp tahtında; npc zipzip başlangıca yakın, id 'zipzip'),
  `L4_golge` (tetik, bölüm ortası: Gölge bir nilüferin üstünden sıçrayıp kaçar, marks golgeA/golgeB), `L4_end`.
  Öğret: cap1 (tek tek geçin), pair (birlikte durun), bir yerde taşıma (tek kanadın yetmediği uzun su üstü).
- **L5 Kamış Tüneli** (S28, A7 — Zıpzıp): `L5_start`; **Kral Yarışı** (race nesnesi, scenes: {start:'L5_yaris', win:'L5_yaris_kazan', lose:'L5_yaris_kaybet'}, kolay–orta);
  `L5_kopru` (tetik: Gölge'nin onardığı köprü fark edilir — yıkık köprü üstünde beyaz tüyle bağlanmış dallar; decor fur + yakında bir köprü/raf; mark 'kopru'), `L5_end`. Soru A7 yarıştan sonra olmalı.
- **L6 Şelale Tepesi** (A8, F12 — Zıpzıp): `L6_start`, Ustalık Geçidi **"Şelale Tırmanışı"** (dikey tırmanış; aşağı esen şelale rüzgârı; omuz omuza/taşıma), `L6_end` (gün batımı, Zıpzıp'a veda). F12 soru noktası şelalenin tepesinde.

### Dünya 3 — Kehribar Orman (sonbahar) · bekçi Profesör Hu
Mekanik: damla (drip) + yaprak çatılar (`=`), su birikintisi (`~`), rüzgâr akımları (yatay ve yukarı), rüzgâr kalkanı (item shield), Hu'nun sembol bulmacası.
- **L7 Yağmurun İlk Damlası** (S33, A6 — Hu): `L7_start`, `L7_golge` (tetik: Gölge yağmurda bir ağ tuzağını temizlerken görülür ve kaçar; decor brokenweb; marks golgeA/golgeB), `L7_end`.
- **L8 Yaprak Rüzgârı** (S29, A9 — Hu): `L8_start`, rüzgâr kalkanı bulmacaları (biri kalkanla rüzgârı keser, öbürü gölgesinde uçar), yukarı esen akımlar, `L8_end`. Ustalık Geçidi önerisi: "Fırtına Dalı".
- **L9 Bilge Ağaç** (S23, A4 — Hu): `L9_start`, Hu'nun **sembol bulmacası** (rune + sequence; sıra: `['yagmur', 'ruzgar', 'yaprak', 'gunes']`, sequence id 'hu';
  Hu'nun bilmecesi bu sırayı anlatır: "Önce gökten düşen, sonra onu taşıyan, sonra yere düşen, en son hepsini kurutan"), `L9_tuy` (tetik: beyaz tüy bulunur; decor fur; npc hu yakında),
  `L9_end` (Hu: "Gölge'yi kovalamayın, izleyin"). Dikey bir dev ağaç bölümü olabilir.

### Dünya 4 — Mantar Mağarası (magara, dark:true) · bekçi Işıl
Mekanik: karanlık + fener (item lantern) + ışık köprüleri (bridge), sabit ışıklar (glow), zıplama mantarları (M), ritim platformları (pulse), çöküş kaçışı (collapse).
- **L10 Karanlığa Giriş** (F13, S31 — Işıl): `L10_start` (mağara ağzı, Işıl karşılar; npc isil), fener öğretisi (biri feneri taşır, köprüler ışıkta belirir), buzlu pati izleri (decor paw) — Gölge buradan geçmiş, `L10_end`.
- **L11 Fısıldayan Mantarlar** (S26, A10 — Işıl): `L11_start`, mantarla zıplama + ritimli geçişler, Ustalık Geçidi **"Ritim Köprüsü"**, `L11_end`.
- **L12 Işıl'ın Hatırası** (F18, A5 — Işıl): `L12_start`, F18 sessiz bir odada; `L12_hatira` (tetik: Işıl, Gölge'nin kovanın **eski nöbetçisi** olduğunu söyler, sonrasını anlatamadan susar), A5 bundan hemen sonra;
  ardından **çöküş kaçışı** (collapse; scene 'L12_cokus'; music 'kacis' önerilir; içinde 1–2 Bal Çiçeği), Ustalık Geçidi **"Çöküş Kaçışı"**, `L12_end` (çıkışta nefes nefese).

### Dünya 5 — Kar Zirvesi (kis, cold:true) · bekçi Bora (ve Gölge)
Mekanik: ısı (yan yana dur, bal-ateşi `F`), buz `I`, kırılan buz (crumble), buz sarkıtı, soğuk rüzgâr (wind cold:true), esintiler (gust).
- **L13 İlk Kar** (S22 — Işıl, S37 — Kraliçe'nin sesi ateşten): `L13_start` (Işıl karın kıyısına kadar uğurlar; npc isil başlangıçta, id 'isil'),
  ısı öğretisi (bal-ateşleri yol boyunca), `L13_golge` (tetik: Gölge uzak bir sırtta görünür, kar fırtınasında kaybolur; marks golgeA/golgeB), `L13_end`. S37 bir bal-ateşinin (F) yanında.
- **L14 Buz Köprüsü** (F15, F11 — Bora): `L14_start`, kayan buz ve kırılan buz köprüsü, Ustalık Geçidi **"Kırık Buz Köprüsü"**; `L14_bora` (tetik: Bora ile ilk yüzleşme;
  npc bora 'bora' — sert konuşur; soruları o sorar ama **kendi kapısını açmaz**: soru kapıları başka bir yolu açar, ana kapı (bora kapısı) kapalı kalır, arılar buz köprüsünden dolaşır), `L14_end`.
- **L15 Fırtına Gecesi** (F16, F19 — Bora): `L15_start`, fırtına (weather 'storm', soğuk esintiler, music 'firtina'), Ustalık Geçidi **"Fırtına Sırtı"**;
  sonunda donmuş Bora (nesne `bora`, flag 'boraWarm', scene 'L15_kurtarma'); ısınınca kapı açılır (`on: 'boraWarm'`), sorular (F16, F19) kurtarmadan **sonra**; `L15_end` duygusal.

### Dünya 6 — Kovan'ın Kalbi (kovan) · bütün mekanikler
- **L16 Kovan Yolu** (S39 — Püntür, S32 — Zıpzıp): önceki dünyaların mini tekrarı; her bölütte bir dost yardım eder (kısa cameo, tetik sahneleri):
  `L16_start`, `L16_puntur` (ağ kapısını açar), `L16_zipzip`, `L16_hu`, `L16_isil` (karanlık bölümü aydınlatır), `L16_end`. Bora arılara eşlik ediyor olabilir (npc bora).
- **L17 Balın Kapısı** (A1, F14 — Bora): en zor bölüm, bütün mekanikler, **2 Ustalık Geçidi** ("Balın Kapısı I", "Balın Kapısı II"), `L17_start`, `L17_end`.
- **L18 Kraliçe Balı** (son 6 soru — Kraliçe): ana tasarımcı yapar (final sahnesiyle birlikte).

## Ton
Tatlı, hafif, komik ve duygusal; orta flört; kaba/argo yok. Bekçiler kendi seslerinde konuşur (sahneler.js).
