# Bee & Bloom — GitHub Pages'te yayınlama

Oyun saf statik dosyalardan oluşur (sunucu gerekmez). GitHub Pages'e koyunca bir
bağlantıyla herkes tarayıcıda oynayabilir.

> **Önemli:** İlerleme (kayıt) her oyuncunun **kendi tarayıcısında** saklanır.
> Aynı bağlantıyı başka bir bilgisayarda açan, kendi kaydıyla başlar. Kaydı taşımak
> için oyunda: Ana menü → Yedek → Enter (indir) / I (yükle).

## A) Komut satırıyla (gh aracı varsa)
```bash
cd bee-and-bloom
git init -b main
git add .
git commit -m "Bee & Bloom ilk sürüm"
gh repo create bee-and-bloom --public --source=. --remote=origin --push
gh api -X POST repos/KULLANICI/bee-and-bloom/pages -f "source[branch]=main" -f "source[path]=/"
```
1–3 dakika sonra oyun şu adreste açılır: `https://KULLANICI.github.io/bee-and-bloom/`

## B) Web sitesinden (tıklayarak)
1. github.com → sağ üstte **+** → **New repository** → ad: `bee-and-bloom` → **Public** → **Create repository**.
2. Açılan sayfada **uploading an existing file** bağlantısına tıklayın.
3. `bee-and-bloom` klasörünün **içindekileri** (klasörün kendisini değil) sürükleyip bırakın:
   `index.html`, `js/`, `data/`, `.nojekyll`, `OKU-BENI.txt`, `LISANSLAR.txt`, `GITHUB-YAYIN.md`
   (macOS Finder'da `.nojekyll` gizlidir: sürüklemeden önce **Cmd+Shift+.** ile gizli dosyaları gösterin.)
   (`_gelistirme/` isteğe bağlı; oyun için gerekmez). → **Commit changes**.
4. **Settings → Pages** → *Build and deployment* → Source: **Deploy from a branch** →
   Branch: **main**, klasör: **/ (root)** → **Save**.
5. 1–3 dakika bekleyin; sayfanın üstünde bağlantı görünür:
   `https://KULLANICI.github.io/bee-and-bloom/` → bu bağlantıyı paylaşın.

## Güncelleme
Dosyaları değiştirdikten sonra:
```bash
cd bee-and-bloom
git add -A
git commit -m "Güncelleme"
git push
```
GitHub Pages birkaç dakika içinde yeni sürümü yayınlar. (Web sitesinden yüklediyseniz
aynı adımlarla dosyaları yeniden sürükleyip bırakmanız yeterli.) Tarayıcı eski sürümü
gösteriyorsa sayfayı Cmd+Shift+R ile yenileyin.

## Notlar
- `.nojekyll` dosyası, GitHub'ın `_gelistirme` gibi alt çizgiyle başlayan klasörleri
  gizlememesi ve dosyaları olduğu gibi sunması içindir; silmeyin.
- Bütün yollar görelidir; oyun bir alt klasörde (`/bee-and-bloom/`) sorunsuz çalışır.
