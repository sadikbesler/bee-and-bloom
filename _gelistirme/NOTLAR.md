# Geliştirme notları (oyunu oynamak için gerekmez)

Node 22+ yeterli (npm paketi yok). Komutlar proje kökünden çalıştırılır.

## Testler
| Komut | Ne yapar |
|---|---|
| `node _gelistirme/solve.js` | 18 bölümün çözüm betiğini gerçek simülasyonla oynatır, bölüm sonuna ulaşıldığını ve kaydın yeniden oynatılınca aynı karede bittiğini (determinizm) doğrular. Kayıtlar: `cikti/kayit/L*.json` |
| `node _gelistirme/explore.js N --kapilar=kapali` | Tek arı + iş birliği kapıları kapalı: çıkışa ULAŞILAMAMALI (iş birliği zorunlu mu?) |
| `node _gelistirme/explore.js N --kapilar=acik --omuz` | Bütün polen/çiçek/soru/çıkış erişilebilir mi? (`--yol=nadir` ile bir hedefe giden yolu yazar) |
| `node _gelistirme/mekanik_testi.js` | 27 mekanik birim testi |
| `node _gelistirme/stres_testi.js` | Rastgele girdi + ışınlama ile NaN / gömülme / taşıma / yeniden doğma hataları |
| `node _gelistirme/veri_testi.js` | 40 soru, sahneler, tabelalar, yazı tipi kapsamı, Türkçe ekler |
| `node _gelistirme/kayit_testi.js` | Kayıt: 3 slot, kilitli cevaplar, bozuk kayıt, içe/dışa aktarma, localStorage engelli/kota |
| `node _gelistirme/tarayici_oyun_testi.js` | Chrome'da menü + isim girişi + bölümleri kayıtla oynatır, kapat-aç-devam, kare süresi, konsol |
| `node _gelistirme/final_test.js` | Final → Anı Defteri → Anı Kartı PNG → jenerik (Chrome) |
| `node _gelistirme/fizik_olcum.js` | Zıplama/uçuş/menzil ölçümleri |

Tarayıcı araçları bağımlılıksız bir CDP istemcisi (`tarayici.js`) kullanır ve
`/Applications/Google Chrome.app` arar (başka yol için `CHROME=...`).

## Görsel araçlar
- `node _gelistirme/bolum_onizleme.js N` → bölümün tamamı PNG (`cikti/bolum_N.png`)
- `node _gelistirme/onizleme.js sprites|bees|font|themes` → sprite/yazı tipi/tema önizleme
- `node _gelistirme/iz.js N [ilk] [son] [adım]` → çözüm betiği koşarken arıların kare kare durumu
- Tarayıcı adres parametreleri: `?level=N` (`&scene=0` sahnesiz, `&p1=..&p2=..` isimler), `?kum=1` (mekanik kum havuzu),
  `?final=1`, `?defter=1`, `?kart=1`, `?jenerik=1`

## Bölüm eklemek/değiştirmek
Bölümler `_gelistirme/bolumler/dN.js` üreticileriyle yazılır (`node _gelistirme/bolumler/dN.js` → `data/dunyaN.js`).
Ayrıntılı kurallar: `BOLUM-REHBERI.md`, hikâye planı: `HIKAYE.md`. Değişiklikten sonra mutlaka `solve.js` ve `explore.js` çalıştırın.

## İzleme modu (oyunu oynamadan bakmak için)
1. `node _gelistirme/solve.js && node _gelistirme/izle_hazirla.js` (çözüm kayıtlarını `_gelistirme/cikti/kayitlar.js`'e toplar)
2. Tarayıcıda: `index.html?izle=1` → arılar kendiliğinden oynar; diyalogları Enter ile geçin, gizli soruları Q/W/E/R ve U/I/O/P ile kendiniz cevaplayın.
   `?izle=7` → 7. bölümden başlar, `&hiz=2` → 2 kat hız (en fazla 4). Kayıt geçici slota yazılır, gerçek kayıtlar etkilenmez.
   Yalnız yerelde çalışır (cikti/ GitHub'a gönderilmez).
