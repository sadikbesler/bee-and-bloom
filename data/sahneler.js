/* Bee & Bloom — hikâye sahneleri.
   Adımlar: say (konuşan, face, text) · react (both|p1|p2, e: duygu baloncuğu, face: yüz) · cam (NPC kimliği, işaret adı ya da [sütun, satır]; null = arılar)
   npc (kimlik, to, face, hide/show) · shadow ({from, to, t}) · wait · title · sfx · music · shake · flash · fx (dünya etkisi: flag/hide/show…)
   Yer tutucular: {p1} {p2} (oyuncu isimleri), {disi} {erkek}. Arılar konuşmaz; tepki verir. */
(function (root) {
  'use strict';
  const BB = root.BB;
  const S = BB.SCENES = BB.SCENES || {};

  // ================================================================ DÜNYA 1 — Çiçek Çayırı
  S.L1_start = [
    { cam: 'kralice' },
    { say: 'anlatici', text: 'Çiçek Vadisi\'nde bir bahar sabahı. Kovanın kapısında tatlı bir telaş var…' },
    { say: 'kralice', face: 'talk', text: 'Günaydın, küçüklerim. {p1}… {p2}… Biraz yaklaşın.' },
    { react: 'both', e: 'q' },
    { say: 'kralice', face: 'sad', text: 'Şu kavanoza bakın. Kraliçe Balı… Eskiden güneş gibi parlardı. Şimdi her sabah biraz daha sönüyor.' },
    { say: 'kralice', face: 'talk', text: 'Bal sönerse mevsimler durur. Vadi soğur, çiçekler uykuya dalar.' },
    { react: 'both', e: 'sweat', face: 'surprised' },
    { say: 'kralice', face: 'talk', text: 'Bu bal, birbirini gerçekten tanıyan iki kalpten yapılır. Dört mevsimi geçin, bekçilerin sorularını yanıtlayın. Bal sizi tanıyacaktır.' },
    { say: 'anlatici', text: '{p1} ile {p2} birbirine baktı. Demek balın ışığı bir yerlerde kaybolmuştu… ve onu bulup getirecek olan onlardı.' },
    { say: 'kralice', face: 'happy', text: 'Ama önce benim de küçük bir sorum var. Isınmak için. Haydi, çiçeklere bakın.' },
    { cam: null },
  ];
  S.L1_puntur = [
    { cam: 'puntur' }, { sfx: 'call' },
    { say: 'puntur', face: 'surprised', text: 'Aaa! Hay aksi! Az kalsın çarpışıyorduk! Merhaba! Ben Püntür! Uğur böceği! Çiçek Çayırı\'nın bekçisi… yani bekçi yardımcısı… yani bekçi!' },
    { react: 'both', e: 'q' },
    { say: 'puntur', face: 'talk', text: 'Kraliçe sizi gönderdi, biliyorum. Kulağım her şeyi duyar! Bir de şeyi… dur, unuttum.' },
    { say: 'puntur', face: 'happy', text: 'Haa! Buradan geçmek için soruma cevap vereceksiniz! Kolay, kolay! Çiçeklere uçun, çiçeklere!' },
    { cam: null },
  ];
  S.L1_end = [
    { npc: 'puntur', to: [134, 14], t: 1.2 },
    { say: 'puntur', face: 'talk', text: 'Buradan sonrası Polen Yolu! Polenler, saksılar, kapılar… Bayılacaksınız!' },
    { say: 'puntur', face: 'surprised', text: 'Ha, bir de… Son günlerde çayırda bir gölge görüyorum. Hızlı, sessiz… Bal damlalarının etrafında dolanıyor. Hay aksi, korkuttum mu?' },
    { react: 'both', e: 'sweat' },
    { say: 'anlatici', text: 'Kovanın sönük ışığı arkalarında kaldı. Önlerinde uzun bir yol vardı… ve birbirlerini tanımak için bolca zaman.' },
  ];

  S.L2_start = [
    { say: 'anlatici', text: 'Polen Yolu: çayırın en tatlı kokan patikası. Burada her saksı bir polen topu bekler.' },
    { react: 'p1', e: 'note', face: 'happy' },
    { react: 'p2', e: 'heart', face: 'happy' },
    { say: 'anlatici', text: 'Polen topları ağırdır. {p1} ile {p2} bunu birazdan öğrenecekti.' },
  ];
  S.L2_golge = [
    { cam: 'damla' },
    { say: 'anlatici', text: 'Kayanın üstünde bir bal damlası parlıyordu. Kraliçe Balı\'nın rengi! Tam yanına varmışlardı ki…' },
    { shake: 0.3 },
    { shadow: { from: 'golgeA', to: 'golgeB', t: 1.2, wait: false } },
    { wait: 0.45 },
    { fx: 'hide', id: 'damla' }, { sfx: 'pick' },
    { wait: 1 },
    { round: 1, react: 'both', e: 'call', face: 'surprised' },
    { round: 1, say: 'anlatici', text: 'Beyaz bir esinti, bir gölge… ve damla yok oldu. Geriye yalnızca bir koku kaldı. Baharın ortasında, kar kokusu.' },
    { round: 1, react: 'both', e: 'angry', face: 'angry' },
    { round: 1, say: 'anlatici', text: '{p1} ile {p2} aynı şeyi düşündü: Balı biri çalıyordu.' },
    { round: 2, react: 'both', e: 'heart', face: 'happy' },
    { round: 2, say: 'anlatici', text: 'Bu sefer biliyorsunuz: o beyaz esinti Bora\'ydı. Damlayı yolunuza düşmesin diye alıyor. Uzaktan kuyruğunu sallıyor.' },
    { cam: null },
  ];
  S.L2_end = [
    { say: 'puntur', face: 'surprised', text: 'Gölge mi? Bal damlasını mı aldı? Aaa! Hay aksi! Onu yakalayın! Yani… dikkatli olun. Yani yakalayın. Dikkatlice!' },
    { react: 'both', e: 'call' },
    { say: 'puntur', face: 'talk', text: 'Kapımda buluşalım! Ama Çayır Kapısı\'nın yolu ağlarla dolu. Örümcekler… brr!' },
  ];

  S.L3_start = [
    { say: 'anlatici', text: 'Çayırın sonunda, iki dev papatyanın arasında Püntür\'ün kapısı durur. Önce ağlarla dolu bir koridordan geçmek gerekir.' },
    { say: 'anlatici', text: 'Ağa yapışan arıyı ortağı eylem tuşuyla kurtarabilir. Yalnız kalan arı, kanat çırpa çırpa kendini kurtarır.' },
  ];
  S.L3_kapi = [
    { cam: 'puntur' },
    { say: 'puntur', face: 'happy', text: 'Geldiniz! Geldiniz! Ağ Koridoru\'nu geçtiniz! Ben olsam üç kere yapışırdım. Dört.' },
    { say: 'puntur', face: 'talk', text: 'Bir şey diyeceğim: koridordaki ağların bazıları yırtılmıştı. Ben yırtmadım. Örümcekler de yırtmaz. Kim yırttı?' },
    { react: 'both', e: 'q' },
    { say: 'puntur', face: 'talk', text: 'Neyse! Bekçi sorusu zamanı! Bu sefer gizli: biriniz seçerken öbürü bakmayacak. Söz mü? Söz!' },
    { cam: null },
  ];
  S.L3_end = [
    { say: 'puntur', face: 'happy', text: 'Kapım açıldı, sizin kalbiniz açık! Çiçek Çayırı\'ndan geçtiniz!' },
    { say: 'puntur', face: 'talk', text: 'Göl tarafında Kral Zıpzıp var. Kendini kral sanar… Yani kral zaten. Ama biraz fazla kral.' },
    { say: 'puntur', face: 'happy', text: 'Hoşça kalın! Gölge\'yi görürseniz bana anlatmayın! Yani anlatın. Ama yavaşça!' },
    { react: 'both', e: 'heart', face: 'happy' },
  ];

  // ================================================================ DÜNYA 2 — Yaz Gölü
  S.L4_start = [
    { cam: 'zipzip' },
    { say: 'anlatici', text: 'Yaz Gölü pırıl pırıl. Nilüferlerin arasında, bir kütüğün tepesinde, pelerinli bir kurbağa poz veriyor.' },
    { say: 'zipzip', face: 'talk', text: 'Durun! Kim gelir Kral Zıpzıp\'ın gölüne? İki arı mı? İki minicik, tatlı, vızıldayan arı mı?' },
    { react: 'both', e: 'q' },
    { say: 'zipzip', face: 'happy', text: 'Zıpzıp sizi bekliyordu! Zıpzıp herkesi bekler. Kimse gelmez ama Zıpzıp bekler.' },
    { say: 'zipzip', face: 'talk', text: 'Kraliçe\'nin balı mı? Biliyorum, biliyorum. Zıpzıp\'ın sorularını yanıtlayın, gölü geçin. Ama dikkat: nilüferler naziktir. Biri tek arıyı taşır, biri ancak ikinizi birden!' },
    { cam: null },
  ];
  S.L4_golge = [
    { cam: 'golgeA' },
    { shadow: { from: 'golgeA', to: 'golgeB', t: 1.4, hop: 3 } },
    { round: 2, say: 'anlatici', text: 'Nilüferden nilüfere seken tanıdık bir beyaz kuyruk… Bora! Size göz kırptı.' },
    { round: 2, cam: null },
    { react: 'both', e: 'call', face: 'surprised' },
    { say: 'zipzip', face: 'surprised', text: 'Gördünüz mü? GÖRDÜNÜZ MÜ? Nilüferden nilüfere sekti! Zıpzıp bile öyle sekemez. Belki biraz sekebilir.' },
    { say: 'zipzip', face: 'talk', text: 'O gölge her gece buradan geçer. Ardında bal kokusu bırakır… bir de buz gibi bir esinti.' },
    { cam: null },
  ];
  S.L4_end = [
    { say: 'zipzip', face: 'happy', text: 'Bravo! Zıpzıp alkışlıyor! Plap plap! Perdeli ellerle alkış zordur ama Zıpzıp başarır.' },
    { say: 'zipzip', face: 'talk', text: 'Kamış Tüneli\'nde Kral Yarışı var! Zıpzıp hiç kaybetmedi. Çünkü kimse yarışmadı. Bu sefer siz yarışacaksınız!' },
    { react: 'both', e: 'star', face: 'happy' },
  ];

  S.L5_start = [
    { say: 'anlatici', text: 'Kamış Tüneli: yeşil, serin ve uğultulu. Kamışların arasından güneş süzülüyor.' },
    { say: 'zipzip', face: 'talk', text: 'Kral Yarışı\'na hoş geldiniz! Başlangıç çizgisinde buluşalım. Zıpzıp ısınıyor. Hop. Hop. Zıpzıp hazır.' },
  ];
  S.L5_yaris = [
    { say: 'zipzip', face: 'talk', text: 'Kurallar basit! İkiniz de bitiş çizgisini Zıpzıp\'tan önce geçerseniz kazanırsınız. Biriniz geride kalırsa… Zıpzıp kazanır!' },
    { say: 'zipzip', face: 'happy', text: 'Üç deyince başlıyoruz. Ya da iki. Zıpzıp sayarken heyecanlanır.' },
  ];
  S.L5_yaris_kazan = [
    { say: 'zipzip', face: 'surprised', text: 'Ne? NE? Zıpzıp… ikinci mi oldu? Bu bir ilk! Tarihî bir an!' },
    { say: 'zipzip', face: 'happy', text: 'Zıpzıp yine de mutlu. Birlikte koşan iki arıya kaybetmek, kazanmak sayılır. Bunu Zıpzıp şimdi uydurdu ama çok güzel oldu.' },
    { react: 'both', e: 'star', face: 'happy' },
  ];
  S.L5_yaris_kaybet = [
    { say: 'zipzip', face: 'happy', text: 'Zıpzıp kazandı! Yine! Ama Zıpzıp adildir: bir daha deneyin. Bu sefer birlikte koşun, birbirinizi bekleyin!' },
  ];
  S.L5_kopru = [
    { cam: 'kopru' },
    { say: 'anlatici', text: 'Yıkık köprünün dalları yeniden bağlanmıştı. Düğümlerin arasında beyaz, yumuşacık tüyler vardı.' },
    { react: 'both', e: 'q', face: 'surprised' },
    { say: 'anlatici', text: 'Gölge mi onarmıştı bunu? Balı çalan biri neden köprü onarsın ki?' },
    { cam: null },
  ];
  S.L5_end = [
    { say: 'zipzip', face: 'talk', text: 'Şelale Tepesi\'ne giden yol buradan. Zıpzıp sizi tepede bekleyecek. Gün batımını orada izlemek… ah, Zıpzıp romantiktir.' },
  ];

  S.L6_start = [
    { say: 'anlatici', text: 'Şelale Tepesi. Su, gökten dökülen beyaz bir perde gibi. Akıntı, uçan her şeyi aşağı çekiyor.' },
    { say: 'zipzip', face: 'talk', text: 'Tepeye tırmanın! Şelalenin içinden kanat çırpamazsınız, akıntı sizi düşürür. Ama iki arı… iki arı bir yolunu bulur!' },
  ];
  S.L6_end = [
    { say: 'anlatici', text: 'Tepeye vardıklarında güneş gölün üstüne eğiliyordu. Su turuncuya, gökyüzü pembeye döndü.' },
    { say: 'zipzip', face: 'happy', text: 'Zıpzıp\'ın gölünü geçtiniz. Zıpzıp gururlu. Zıpzıp biraz da duygusal. Bu göl suyu, gözyaşı değil.' },
    { say: 'zipzip', face: 'talk', text: 'Ormanda Profesör Hu var. Çok bilmiş bir baykuş. Zıpzıp\'tan biraz daha bilmiş. Azıcık.' },
    { react: 'both', e: 'heart', face: 'happy' },
  ];

  // ================================================================ DÜNYA 3 — Kehribar Orman
  S.L7_start = [
    { say: 'anlatici', text: 'Kehribar Orman\'a ilk damla düştü. Sonra bir tane daha. Yaprakların altında herkes saklanacak bir yer arıyor.' },
    { say: 'hu', face: 'talk', text: 'Hu-hu. Hoş geldiniz. Ben Hu. Profesör derler. Ben demem.' },
    { say: 'hu', face: 'talk', text: 'Damlaların altından geçmeyin; yaprak çatıların altında yürüyün. Yağmur sabırlıdır. Siz de olun.' },
  ];
  S.L7_golge = [
    { cam: 'golgeA' },
    { say: 'anlatici', text: 'Yağmurun içinde bir şey kımıldadı. Bir örümcek ağını dişleriyle yırtıyordu…' },
    { shadow: { from: 'golgeA', to: 'golgeB', t: 1.3 } },
    { react: 'both', e: 'call', face: 'surprised' },
    { say: 'anlatici', text: 'Gölge yine kaçtı. Ama ardında bir tuzak değil, temizlenmiş bir yol bıraktı.' },
    { cam: null },
  ];
  S.L7_end = [
    { say: 'hu', face: 'think', text: 'Gölge mi? Hu. Gölgeyi gördüğünüzü sanırsınız. Bazen gölge sizi görür.' },
    { say: 'hu', face: 'talk', text: 'Yarın rüzgâr çıkacak. Rüzgâra karşı uçulmaz. Rüzgârın arkasında durulur.' },
  ];

  S.L8_start = [
    { say: 'anlatici', text: 'Yaprak Rüzgârı başladı. Turuncu yapraklar havada dans ediyor; uçmaya çalışan her şeyi de beraberinde sürüklüyor.' },
    { say: 'hu', face: 'talk', text: 'Şu geniş yaprağı görüyor musunuz? Biriniz onu kalkan gibi tutsun, öbürü gölgesinde uçsun. Rüzgâr, kalkanın arkasını unutur.' },
  ];
  S.L8_end = [
    { say: 'hu', face: 'happy', text: 'Güzel uçtunuz. Biri kalkan oldu, öbürü kanat. Hu. Bunu ormanın bütün kuşları görmeli.' },
    { say: 'hu', face: 'talk', text: 'Bilge Ağaç\'ta görüşürüz. Bilmecelerimi severseniz… sevmezseniz de çözersiniz.' },
  ];

  S.L9_start = [
    { say: 'anlatici', text: 'Bilge Ağaç, ormanın en yaşlısıdır. Gövdesinde dört taş, taşların üstünde dört işaret var.' },
    { say: 'hu', face: 'think', text: 'Bilmece: Önce gökten düşen. Sonra onu taşıyan. Sonra yere düşen. En son, hepsini kurutan.' },
    { say: 'hu', face: 'talk', text: 'Taşlara bu sırayla dokunun. Yanlış yaparsanız taşlar kızmaz. Ben de kızmam. Biraz hu-hu yaparım, o kadar.' },
  ];
  S.L9_tuy = [
    { cam: 'hu' },
    { say: 'anlatici', text: 'Dalın üstünde bir tutam beyaz tüy. Yumuşacık, soğuk… ve kar gibi kokuyor.' },
    { react: 'both', e: 'q' },
    { say: 'hu', face: 'think', text: 'Hu. Bu tüy bir kuşa ait değil. Bir arıya da. Kıştan gelen birine ait.' },
    { say: 'hu', face: 'talk', text: 'Size bir şey söyleyeyim: Gölge\'yi kovalamayın. İzleyin. Kovalanan kaçar. İzlenen, yolunu gösterir.' },
    { cam: null },
  ];
  S.L9_end = [
    { say: 'hu', face: 'talk', text: 'Mağaraya gidiyorsunuz. Orada Işıl yaşar. Işığı küçüktür ama kalbi büyüktür. Gölge\'yi benden iyi tanır.' },
    { say: 'hu', face: 'happy', text: 'Bir de… birbirinizi kaybetmeyin. Karanlıkta en parlak ışık, yanınızdakidir. Hu-hu.' },
    { react: 'both', e: 'heart', face: 'shy' },
  ];

  // ================================================================ DÜNYA 4 — Mantar Mağarası
  S.L10_start = [
    { say: 'anlatici', text: 'Mantar Mağarası\'nın ağzı, gecenin kendisi kadar karanlık. İçeriden minicik bir ışık yaklaşıyor.' },
    { cam: 'isil' },
    { say: 'isil', face: 'talk', text: 'Korkmayın… Ben Işıl. Burada ışık az ama yetiyor. Yeter ki paylaşılsın.' },
    { say: 'isil', face: 'talk', text: 'Şu feneri alın. Biriniz taşısın, öbürü yolu bulsun. Bazı köprüler yalnızca ışıkta görünür… tıpkı bazı dostlar gibi.' },
    { cam: null },
  ];
  S.L10_end = [
    { say: 'isil', face: 'sad', text: 'O pati izlerini gördünüz mü? Buzdan yapılmış gibiydiler… Biri buradan geçti. Çok yorgundu.' },
    { say: 'isil', face: 'talk', text: 'Mantarların fısıldadığı yere gidin. Ritmi dinleyin. Her şey bir şarkıdır.' },
  ];
  S.L11_start = [
    { say: 'anlatici', text: 'Fısıldayan Mantarlar: her biri ayrı bir notada parlıyor. Mağara bir şarkı söylüyor.' },
    { say: 'isil', face: 'talk', text: 'Ritmi yakalayın… Parlayan yer, basabileceğiniz yerdir. Sönmeden önce bir kez göz kırpar.' },
  ];
  S.L11_end = [
    { say: 'isil', face: 'happy', text: 'Şarkıyı birlikte söylediniz. Hiç detone olmadınız. Belki biraz.' },
    { say: 'isil', face: 'sad', text: 'Size bir hatıramı anlatacağım. Uzun zamandır kimseye anlatmadım…' },
  ];
  S.L12_start = [
    { say: 'anlatici', text: 'Mağaranın en derin odası. Burası, Işıl\'ın hatıralarını sakladığı yer.' },
    { say: 'isil', face: 'talk', text: 'Gelin… Burası sessiz. Sorumu burada sorayım.' },
  ];
  S.L12_hatira = [
    { cam: 'isil' }, { music: 'kamp' },
    { say: 'isil', face: 'sad', text: 'Gölge\'yi soruyorsunuz… Onu tanırım. Bir zamanlar kovanın kapısında dururdu. Kovanın eski nöbetçisiydi.' },
    { react: 'both', e: 'q', face: 'surprised' },
    { say: 'isil', face: 'sad', text: 'Balın ışığı sönmeye başladığında o…' },
    { wait: 1.2 },
    { say: 'isil', face: 'sad', text: '…Hayır. Bunu ben anlatamam. Bu, onun hikâyesi.' },
    { shake: 0.25 }, { sfx: 'crumble' },
    { say: 'isil', face: 'talk', text: 'Bir soru daha soracağım. Sonra… acele etmeniz gerekecek. Mağara, sırların dökülmesini sevmez.' },
    { cam: null },
  ];
  S.L12_cokus = [
    { shake: 0.8 }, { sfx: 'collapse' }, { music: 'kacis' },
    { say: 'isil', face: 'talk', text: 'Mağara çöküyor! Durmayın! Birbirinizi bekleyin ama durmayın!' },
  ];
  S.L12_end = [
    { music: 'magara' },
    { say: 'anlatici', text: 'Mağaranın ağzından içeri soğuk bir hava doldu. Dışarıda… kar yağıyordu.' },
    { say: 'isil', face: 'talk', text: 'Kurtuldunuz… ikiniz de. Biliyor musunuz, ışığım hiç bu kadar parlak olmamıştı.' },
    { say: 'isil', face: 'sad', text: 'Kar Zirvesi\'nin eteğine kadar sizinle geleceğim. Sonra soğuk benim ışığımı söndürür. Oradan sonrasını siz yürüyeceksiniz.' },
  ];

  // ================================================================ DÜNYA 5 — Kar Zirvesi
  S.L13_start = [
    { say: 'anlatici', text: 'İlk kar. Her şey beyaz, her şey sessiz. Nefesleri buhar olup havada asılı kalıyor.' },
    { cam: 'isil' },
    { say: 'isil', face: 'talk', text: 'Soğukta tek başınıza kalmayın. Yan yana durunca ısınırsınız. Bal ateşlerini görürseniz, yanlarında soluklanın.' },
    { say: 'isil', face: 'sad', text: 'Işığım titriyor… Size son bir soru sorayım, sonra dönmeliyim.' },
    { cam: null },
  ];
  S.L13_golge = [
    { cam: 'golgeA' },
    { say: 'anlatici', text: 'Uzaktaki sırtta bir siluet. Beyaz karın üstünde koyu bir leke… Gölge!' },
    { shadow: { from: 'golgeA', to: 'golgeB', t: 1.8 } },
    { react: 'both', e: 'call' },
    { say: 'anlatici', text: 'Bu sefer kaçmıyor gibiydi. Yavaştı. Topallıyordu.' },
    { cam: null },
  ];
  S.L13_end = [
    { say: 'anlatici', text: 'Bal ateşinin çıtırtısında, çok uzaklardan tanıdık bir ses duyuldu. Kraliçe\'nin sesi…' },
    { say: 'kralice', face: 'talk', text: 'Küçüklerim… Soğuk ama yalnız değilsiniz. Birbirinize sokulun. Yukarıda, buz köprüsünde, biri sizi bekliyor.' },
  ];

  S.L14_start = [
    { say: 'anlatici', text: 'Buz Köprüsü. Kayan buzlar, çatlayan zeminler… ve rüzgârın uğultusunda bir hırıltı.' },
  ];
  S.L14_bora = [
    { cam: 'bora' },
    { say: 'bora', face: 'normal', text: 'Dur. Daha fazla yaklaşmayın.' },
    { react: 'both', e: 'q', face: 'surprised' },
    { say: 'bora', face: 'talk', text: 'Bu geçit benim. Buradan kimse geçmez. Özellikle de iki küçük arı.' },
    { say: 'anlatici', text: 'Bembeyaz bir tilki. Mavi bir atkı. Ve tüyleri… Hu\'nun bulduğu tüyün aynısı.' },
    { react: 'both', e: 'angry', face: 'angry' },
    { say: 'bora', face: 'talk', text: 'Bana öyle bakmayın. Sorularımı yanıtlarsınız, sonra yolunuza dönersiniz. Bu kapı açılmayacak.' },
    { cam: null },
  ];
  S.L14_end = [
    { say: 'bora', face: 'sad', text: '…Köprüyü geçtiniz. İnatçısınız. İkiniz de.' },
    { say: 'bora', face: 'talk', text: 'Gidin. Fırtına geliyor. Bu gece kimse dışarıda kalmamalı.' },
    { say: 'anlatici', text: 'Bora arkasını döndü. Kuyruğunun ucunda, karın içinde, bal rengi bir ışık bir an parlayıp söndü.' },
    { react: 'both', e: 'q', face: 'surprised' },
  ];

  S.L15_start = [
    { music: 'firtina' },
    { say: 'anlatici', text: 'Fırtına Gecesi. Kar yatay yağıyor. Rüzgâr her şeyi geri itiyor.' },
    { say: 'anlatici', text: '{p1} ile {p2} yan yana kaldı. Soğuk, aralarındaki her boşluğu hemen buluyordu.' },
  ];
  S.L15_bulus = [
    { say: 'anlatici', text: 'Karın içinde kıvrılmış beyaz bir şekil. Hareketsiz. Atkısı rüzgârda çırpınıyor…' },
    { react: 'both', e: 'call', face: 'surprised' },
    { say: 'anlatici', text: 'Bora! Donmak üzere. İkiniz birden yanına sokulun; sıcaklığınız onu ısıtsın.' },
  ];
  S.L15_kurtarma = [
    { music: 'kamp' },
    { say: 'anlatici', text: 'Bora\'nın tüylerindeki buzlar damla damla eridi. Gözlerini açtı.' },
    { say: 'bora', face: 'frozen', text: '…Neden… geri döndünüz?' },
    { react: 'both', e: 'heart' },
    { say: 'bora', face: 'sad', text: 'Ben Bora. Kovanın son nöbetçisi. Gölge dediğiniz… benim.' },
    { say: 'bora', face: 'sad', text: 'Bal sönmeye başlayınca son ışığını aldım. Kuyruğuma sardım, sıcak tutmaya çalıştım. Çalmadım. Sakladım. Kış onu öldürmesin diye.' },
    { say: 'bora', face: 'sad', text: 'Yolda gördüğünüz damlaları… kaybolmasınlar diye topladım. Ağları yırttım, köprüyü bağladım. Siz gelecektiniz. Biliyordum.' },
    { say: 'anlatici', text: '{p1} ile {p2} sustu. Haksızlık ettikleri birinin yanındaydılar… ve o, hâlâ onlar için titriyordu.' },
    { react: 'both', e: 'sweat', face: 'sad' },
    { say: 'bora', face: 'soft', text: 'Bana kızmanız normaldi. Ama ısıttınız beni. İkiniz birden. Bunu… unutmam.' },
    { react: 'both', e: 'heart', face: 'happy' },
  ];
  S.L15_end = [
    { say: 'bora', face: 'soft', text: 'Fırtına diniyor. Kovana gidelim. Işığı Kraliçe\'ye ben götüreceğim… ama yanımda siz olun.' },
    { say: 'anlatici', text: 'Üçü birlikte yürüdü. Kar, ilk kez soğuk gelmiyordu.' },
  ];

  // ================================================================ DÜNYA 6 — Kovan'ın Kalbi
  S.L16_start = [
    { say: 'anlatici', text: 'Kovan Yolu. Bütün mevsimler aynı yolda: çiçekler, göl, yapraklar, mantarlar ve kar.' },
    { say: 'bora', face: 'talk', text: 'Bu yol kovanın kalbine gider. Sizi tanıyan herkes burada. Bakın…' },
  ];
  S.L16_puntur = [
    { cam: 'puntur' },
    { say: 'puntur', face: 'surprised', text: 'Aaa! Geldiniz! Bora da mı sizinle? Hay aksi, ben ona gölge diyordum! Özür dilerim, Bora!' },
    { say: 'puntur', face: 'happy', text: 'Bu ağları sizin için yırttım. İlk kez bir şeyi yırttım ve gurur duydum!' },
    { cam: null },
  ];
  S.L16_zipzip = [
    { cam: 'zipzip' },
    { say: 'zipzip', face: 'happy', text: 'Zıpzıp burada! Zıpzıp her yerde! Kraliyet yardımı geldi: nilüferleri sizin için dizdik!' },
    { cam: null },
  ];
  S.L16_hu = [
    { cam: 'hu' },
    { say: 'hu', face: 'happy', text: 'İzlediniz, kovalamadınız. Ve bakın: Gölge size yolu gösterdi. Hu-hu.' },
    { cam: null },
  ];
  S.L16_isil = [
    { cam: 'isil' },
    { say: 'isil', face: 'happy', text: 'Işığım geri geldi… çünkü burası artık soğuk değil. Bu yolu ben aydınlatırım. Siz geçin.' },
    { cam: null },
  ];
  S.L16_end = [
    { say: 'bora', face: 'talk', text: 'Balın Kapısı\'na geldik. Kovanın en zor yolu. Eskiden burayı ben beklerdim.' },
    { say: 'bora', face: 'soft', text: 'Zor olacak. Ama siz zoru seviyorsunuz. Gördüm.' },
  ];
  S.L17_start = [
    { say: 'anlatici', text: 'Balın Kapısı. Petek duvarlar, altın rengi koridorlar… ve kovanın bütün sınavları tek bir yolda.' },
    { say: 'bora', face: 'talk', text: 'Her kapı bir öncekini hatırlatır. Her şeyi birlikte yaptınız. Şimdi de öyle.' },
  ];
  S.L17_end = [
    { say: 'anlatici', text: 'Son kapı da açıldı. İçeriden ılık, tatlı bir koku geldi. Bal kokusu… ama hâlâ sönük.' },
    { say: 'bora', face: 'soft', text: 'Kraliçe içeride. Hazır mısınız?' },
    { react: 'both', e: 'heart', face: 'happy' },
  ];

  S.L18_start = [
    { cam: 'kralice' },
    { say: 'anlatici', text: 'Kovanın kalbi. Ortada, eski bir kavanozun içinde, Kraliçe Balı soluk soluk parlıyor.' },
    { say: 'kralice', face: 'happy', text: 'Geldiniz, küçüklerim. Dört mevsimi geçtiniz. Ve yanınızda… eski dostum Bora.' },
    { say: 'bora', face: 'sad', text: 'Kraliçem. Işığı getirdim. Elimden geldiğince sıcak tuttum.' },
    { say: 'kralice', face: 'talk', text: 'Biliyorum, Bora. Hep biliyordum.' },
    { say: 'kralice', face: 'talk', text: 'Şimdi son sorularım var. Altı tane. Kovanın kalbine kadar yürüyün; her birine kalbinizle cevap verin.' },
    { cam: null },
  ];
  S.L18_end = [
    { say: 'kralice', face: 'talk', text: 'Kırk soru. Kırk cevap. Hepsini hatırlıyor musunuz?' },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
