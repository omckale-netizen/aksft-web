// Cloudflare Pages Function — /:kategori kategori hub route
// HTMLRewriter ile server-side hero content (FOUC giderildi — ilk byte'ta dogru HTML)
// Whitelist-driven: sadece CATEGORIES slug'lari handle edilir.
// Diger root path'ler (/rotalar, /koyler, /yerler, /blog, /ara, vb.)
// whitelist'te olmadigi icin next() ile static asset'e birakilir.

const CATEGORIES = {
  oteller: {
    id: 'konaklama', emoji: '🏨', plural: 'Oteller', heroPlural: 'Otelleri', color: '#5A7A56',
    eyebrow: "Assos Konaklama Rehberi",
    heroSub: "Behramkale taş evlerinden Kadırga butik otellerine — Assos'un en iyi konaklama adresleri.",
    heroChips: ['Butik Otel', 'Taş Ev Pansiyon', 'Deniz Manzaralı', 'Behramkale', 'Kadırga Koyu', 'Ekonomik'],
    title: "Assos Otelleri — Konaklama & Pansiyon Rehberi | Assos'u Keşfet",
    desc: "Assos otelleri ve pansiyonları: Behramkale taş evleri, Kadırga butik oteller, Babakale deniz manzaralı konaklama. Fiyat, konum ve iletişim bilgisiyle rehber.",
    shortIntro: "Assos'ta konaklama seçimi sadece yer değil, atmosfer seçimi. Tarihi doku, deniz kenarı ya da doğa içinde — hangi tarzda bir tatil istediğinize göre konaklama stilinizi seçin.",
    experiences: [
      { emoji: '🏛', title: 'Tarihi Doku', desc: '200-300 yıllık taş ev pansiyonlarda antik köy atmosferi. Dar sokaklar, avlulu odalar, Ege mimarisi.' },
      { emoji: '🌊', title: 'Denize Sıfır', desc: 'Sahil koylarında butik oteller ve pansiyonlar. Oda kapısından plaja, berrak sularda güne başlayın.' },
      { emoji: '🫒', title: 'Doğa İçinde', desc: 'Zeytinlikler ve yayla evleri arasında sakinlik. Doğayla iç içe, organik sofralar ve kuş sesleri.' }
    ],
    intro: "Assos'ta konaklama arıyorsanız, Behramkale'nin antik surları arasındaki tarihi taş otellerden Kadırga Koyu'na bakan butik pansiyonlara uzanan geniş bir yelpazeye sahipsiniz. Adatepe'nin zeytinlikleri arasındaki yayla evlerinden Babakale'nin deniz manzaralı otellerine, her bütçeye uygun pansiyon, villa ve otel seçenekleri — fiyat, konum, manzara ve misafir yorumlarıyla karşılaştırabileceğiniz Assos otel rehberi. İletişim bilgileri, çalışma saatleri ve yol tarifiyle birlikte Assos konaklama rezervasyonunuzu tek sayfadan planlayın.",
    faqs: [
      { q: "Assos'ta konaklama nasıl, nerelerde kalınır?", a: "Assos'ta konaklama bölgeye göre oldukça çeşitlidir. Behramkale köy merkezinde 200-300 yıllık taş ev pansiyonları tarihi deneyim sunar; dar sokaklar ve avlulu odalarıyla Ege mimarisini yaşarsınız. Kadırga Koyu ve Sivrice bölgesinde butik oteller ve sahil pansiyonları deniz kenarında konforlu konaklama için idealdir. Adatepe'nin zeytinlikler arasındaki yayla evleri sakin ve doğayla iç içe bir tatil deneyimi sunar. Babakale'deki deniz manzaralı pansiyonlar ise Türkiye'nin en batı ucundan Ege günbatımını izleme keyfini yaşatır. Her bütçe ve tarzda pansiyon, villa, butik otel veya lüks otel seçeneği bulunur." },
      { q: "Assos'a nasıl gidilir, yol tarifi?", a: "Assos'a İstanbul'dan otoyol üzerinden yaklaşık 5-6 saat, Ankara'dan 7-8 saat araba yolculuğu sürer. En yakın büyük şehir Çanakkale'dir, oradan E87 kara yoluyla yaklaşık 1.5 saat (90 km) mesafededir. Otobüsle ulaşım için Ayvacık, Küçükkuyu veya Ezine otogarına inip minibüs/dolmuşla Behramkale'ye devam edilebilir. Uçakla gelenler için Çanakkale Havalimanı veya Balıkesir Koca Seyit Havalimanı (Edremit) seçenekleri var; her iki havalimanından da transfer yaklaşık 1-1.5 saattir. Yaz aylarında İstanbul-Ayvacık direkt otobüs seferleri de mevcuttur." },
      { q: "Assos otel fiyatları ne kadar, hangi sezonda değişir?", a: "Assos otel fiyatları sezona, konuma ve otel tipine göre büyük farklılık gösterir. Düşük sezonda (Kasım-Mart) ekonomik pansiyonlar gecelik 1.000-2.000 TL aralığında başlar. Orta sezonda (Nisan-Mayıs, Ekim) fiyatlar 1.500-3.500 TL'ye çıkar. Yüksek sezonda (Haziran-Eylül, özellikle Temmuz-Ağustos) butik oteller 3.500-7.000 TL, deniz manzaralı lüks oteller 7.000-15.000 TL aralığında seyreder. Hafta sonu fiyatları hafta içine göre %20-40 daha yüksek olabilir; 2-3 gece minimum konaklama şartı konabilir. Erken rezervasyon indirimleri %10-20 avantaj sağlar." },
      { q: "Assos'ta deniz manzaralı otel ve butik pansiyon var mı?", a: "Evet, Assos'ta pek çok seçenek var. Kadırga Koyu bölgesindeki oteller doğrudan sahile sıfır konumda ve berrak deniz manzaralıdır. Sivrice'de çakıl plaja yürüme mesafesinde butik pansiyonlar ve aile oteller bulunur. Babakale bölgesi panoramik Ege manzarası için mükemmeldir; özellikle günbatımı odalarıyla bilinir. Behramkale tepesindeki butik oteller, antik Athena Tapınağı ve Ege körfezi manzarasını odadan izleme imkanı sunar. Sokakağzı ve Yıldız Koyu gibi sakin bölgelerdeki pansiyonlar da gizli cennet deneyimi arayanlar için ideal; buralarda gecelik fiyatlar merkeze göre biraz daha uygun olabilir." },
      { q: "Assos'ta hangi mevsimde konaklamak daha uygun?", a: "Assos her mevsim farklı bir deneyim sunar ama en ideal aylar Mayıs-Haziran ve Eylül-Ekim'dir. Bu dönemde hava 20-28°C arasında, deniz sıcaklığı yüzme için uygun, turist yoğunluğu ise düşüktür. Temmuz-Ağustos yoğun sezondur; hava 30°C+ olur, plajlar ve oteller doludur, fiyatlar en yüksek seviyededir. Rezervasyonun en az 3-4 hafta önce yapılması önerilir. Kış ayları (Aralık-Mart) özellikle Kasım-Şubat arası sakinlik ve doğa fotoğrafçılığı için idealdir; bazı mevsimsel pansiyonlar kapalı olabilir ama Behramkale köy içindeki taş evler yıl boyunca açıktır. Şubat sonu-Mart bahar çiçeklerini görme dönemidir." }
    ]
  },
  kafeler: {
    id: 'kafe', emoji: '☕', plural: 'Kafeler', heroPlural: 'Kafeleri', color: '#C4521A',
    eyebrow: "Assos Kafe Rehberi",
    heroSub: "Manzaralı oturumlar, ev yapımı tatlılar ve gerçek Ege kahvesi — Assos kafeleri tek sayfada.",
    heroChips: ['Deniz Manzarası', 'Asma Altı', 'Gün Batımı', 'Ev Yapımı Tatlı', 'Behramkale', 'Köy Kahvesi'],
    title: "Assos Kafeleri — Deniz Manzarası & Kahve Molası Rehberi | Assos'u Keşfet",
    desc: "Assos kafeleri: Behramkale asma altı kahveci, Kadırga deniz manzaralı cafe, Adatepe köy kafeleri. Çalışma saatleri, konum ve menüyle Assos kafe rehberi.",
    shortIntro: "Assos'ta kahve molası her ruh haline göre şekil alır. Denize karşı, antik sokaklarda ya da gün batımında — hangi atmosferde mola vermek istediğinize göre kahve deneyiminizi seçin.",
    experiences: [
      { emoji: '🌊', title: 'Deniz Manzaralı', desc: 'Sahil koylarında ve teraslarda mavi sulara bakarak kahve. Rüzgarın tuzlu tadı, gün boyu martı sesleri.' },
      { emoji: '☕', title: 'Asma Altı', desc: 'Taş sokaklarda avlulu, geleneksel köy kahvecisi havası. Yöresel ikramlar ve samimi sohbetler.' },
      { emoji: '🌅', title: 'Gün Batımı', desc: 'Panoramik tepe teraslarında altın saatin keyfi. Ege\'nin rengini izleyerek özel molalar.' }
    ],
    intro: "Assos'un en iyi kafeleri, Behramkale'nin taş döşeli sokaklarından Kadırga Koyu'nun deniz kenarına uzanan benzersiz bir coğrafyaya yayılmış. Asma altı avluları, gün batımı teraslı butik kafeleri, Ege kahvesi ve ev yapımı tatlılar sunan köy işletmeleri — her ruh haline uygun bir Assos kafe adresi burada. Çalışma saatleri, konumları ve menü detaylarıyla Behramkale, Adatepe ve çevre köylerdeki kafeleri keşfedin; kahve molanızı Assos'un tarihi dokusuyla birleştirin.",
    faqs: [
      { q: "Assos kafeleri kaç arası açık, çalışma saatleri nedir?", a: "Assos kafelerinin çalışma saatleri mevsime ve konuma göre farklılık gösterir. Yaz sezonunda (Haziran-Eylül) genelde 08:00-24:00 arası açıktır; Behramkale köy meydanındaki kahveci ve taş ev kafeleri sabah erken saatte hizmete başlar. Kış aylarında (Kasım-Mart) çalışma saatleri 09:00-22:00 arasına çekilir, bazı manzara kafeleri Pazartesi-Salı günleri kapalı olabilir. Hafta sonları ve resmi tatil günlerinde saatler uzar; özellikle gün batımı saatinde (yaz 19:30-21:00) popüler kafeler çok yoğunlaşır. Rezervasyon almayan kafeler için erken gitmek önerilir; Adatepe ve köy kafeleri geleneksel saatleriyle (10:00-21:00) çalışır." },
      { q: "Assos'ta deniz manzaralı kafe var mı, nerede bulunur?", a: "Evet, Assos'un deniz manzaralı kafe seçenekleri oldukça zengindir. Kadırga Koyu sahilinde doğrudan deniz kenarında konumlu kafeler, masa başında Ege'nin berrak sularını izleme imkanı sunar. Sivrice bölgesindeki kafeler çakıl plaja bakan teraslarıyla rahat atmosfer sağlar. Behramkale tepesinden ise panoramik körfez manzarası izlenir; özellikle antik Athena Tapınağı yakınlarındaki kafeler Ege'nin tüm güzelliğini görmek için idealdir. Sokakağzı ve Babakale bölgelerindeki butik kafeler sakinlik arayanlar için tercih edilir. Gün batımı saatleri (yaz 19:30-20:30, kış 17:00-18:00) tüm bu kafelerin en popüler dönemidir — önceden masa ayırtmak önerilir." },
      { q: "Behramkale'de kafe nerelerde bulunur, nasıl gidilir?", a: "Behramkale köyünde kafeler üç ana noktada yoğunlaşır. İlki köy meydanı ve çevresi; geleneksel taş ev kafeleri, Türk kahvesi ve limonata servisi yapan aile işletmeleri burada toplanır. İkinci nokta Athena Tapınağı yoluna giden cadde; antik dokuyla iç içe manzara kafeleri ve butik mekanlar bu bölgede. Üçüncü bölge ise köyün alt kısmında, Assos antik limanına inen taş yolun başlangıcındaki küçük avlu kafeleri. Behramkale'ye araçla giderken köy içinde park yeri sınırlıdır; köy girişindeki otoparkı kullanıp dar taş sokaklarda yürüyerek gezmek önerilir. Her üç bölgeye de yürüyerek 10-15 dakikada ulaşabilirsiniz." },
      { q: "Assos kafelerinde kahvaltı yapılır mı, ne kadar?", a: "Evet, Assos kafelerinin pek çoğu kahvaltı servisi sunar ve bu kahvaltı çeşitleri yoğun talep görür. Özellikle Behramkale köy merkezindeki kafeler ve Adatepe'deki köy işletmeleri serpme köy kahvaltısı hazırlar; ev yapımı reçel, köy peyniri, kaymak, zeytin, taze fırın ekmeği ve omleti ile 15-20 çeşit sunum yaygındır. Kahvaltı servisi genelde 09:00-13:00 arası verilir, bazı mekanlar 14:00'e kadar uzatır. Fiyatlar 2 kişilik serpme kahvaltı için 500-900 TL aralığındadır; tekli menüler 250-400 TL. Hafta sonları ve özellikle tatil günlerinde rezervasyon önerilir, sabah 10:00 sonrası kafeler hızla dolar." },
      { q: "Assos'ta gün batımı izlenebilecek en güzel kafe nerede?", a: "Assos'un coğrafi konumu Ege'nin batısına baktığı için gün batımı izleme noktaları çok değerlidir. Behramkale tepesindeki antik Athena Tapınağı yakın kafeleri panoramik manzarasıyla başlıca tercihtir; körfezi ve Midilli Adası'nı görebilirsiniz. Kadırga Koyu'na bakan teraslı kafeler deniz seviyesinden günbatımını çok özel kılan ufuk çizgisi sunar. Sokakağzı ve Sivrice'deki sahil kafeleri ise ince çakıllı plajdan izlenen günbatımı deneyimi için idealdir. Babakale bölgesi Türkiye'nin en batı noktası olduğu için günbatımını en son burada görürsünüz — yaz aylarında saat 19:30-20:30, kış 17:00-18:00 arası altın saattir. Hafta sonları ve yaz aylarında en az 30 dakika önce gidip masa kapmak önerilir." }
    ]
  },
  restoranlar: {
    id: 'restoran', emoji: '🍽', plural: 'Restoranlar', heroPlural: 'Restoranları', color: '#1A6B8A',
    eyebrow: "Assos Restoran Rehberi",
    heroSub: "Taze balık, mezeli akşamlar ve Ege mutfağı — Assos'un en iyi restoranları.",
    heroChips: ['Balık Restoranı', 'Ege Mutfağı', 'Mezeli Akşam', 'Deniz Kenarı', 'Antik Liman', 'Köy Lokantası'],
    title: "Assos Restoranları — Balık & Ege Mutfağı Rehberi | Assos'u Keşfet",
    desc: "Assos restoranları: antik liman balık lokantaları, Behramkale mezeli akşam yemeği, Kadırga deniz manzaralı restoranlar. Menü ve iletişimle restoran rehberi.",
    shortIntro: "Assos restoranları yemek tarzına göre farklı deneyimler sunar. Taze balıktan ev yemeklerine, mezeden zeytinyağlılara — hangi akşamı istediğinize göre sofranızı seçin.",
    experiences: [
      { emoji: '🐟', title: 'Balık Keyfi', desc: 'Günlük tutulmuş Ege balıklarıyla deniz manzaralı sofralar. Taze mezeler, yerel şarap, rıhtımda uzun akşamlar.' },
      { emoji: '🫒', title: 'Ege Mutfağı', desc: 'Zeytinyağlı ot yemekleri, yöresel mezeler ve geleneksel Ege tatları. Sağlıklı ve yerel üretim.' },
      { emoji: '🏡', title: 'Köy Lokantası', desc: 'Avluya kurulmuş sofralarda ev yemekleri. Keşkek, kuzu tandır, ev baklavası — otantik köy ruhu.' }
    ],
    intro: "Assos restoranları, antik liman'ın taş rıhtımındaki balık lokantalarından Behramkale köy evlerinin avlusunda servis edilen mezeli akşam yemeklerine kadar geniş bir Ege mutfağı deneyimi sunuyor. Kadırga Koyu'nun deniz manzaralı restoranları, geleneksel Assos zeytinyağı ile hazırlanan ot yemekleri, taze tutulmuş balık çeşitleri ve yerel üretim şarabı — akşam yemeği planınızı konum, menü ve fiyat bilgileriyle birlikte yapın. Assos'ta en iyi restoranlar, çalışma saatleri ve iletişim bilgileriyle tek sayfada.",
    faqs: [
      { q: "Assos'ta hangi yemekler meşhurdur, ne yenir?", a: "Assos ve Ayvacık bölgesi Ege mutfağının en zengin merkezlerinden biridir. Taze Ege balıkları (karagöz, mezgit, sardalya, levrek, çipura) bölgenin başlıca lezzetleridir; antik liman ve Kadırga bölgesindeki restoranlarda günlük tutulmuş balık servis edilir. Zeytinyağlı ot yemekleri de bölgenin imzasıdır: kuzukulağı, şevketi bostan, deniz börülcesi, türlü ot kavurması ve enginar Assos zeytinyağıyla pişirilir. Meze çeşitleri zengindir — köpoğlu, çerkez tavuğu, sakız, barbunya ve haydari sıkça bulunur. Köy lokantalarında keşkek, kuzu tandır, etli dolma gibi ev yemekleri sunulur. Yanında yerel üretim şarap, rakı ve ayran tercih edilir. Tatlılarda sütlü tatlılar ve mevsim meyveleriyle yapılan kompostolar öne çıkar." },
      { q: "Assos restoranlarında rezervasyon gerekli mi?", a: "Hafta sonu ve yaz sezonunda (Haziran-Eylül, özellikle Temmuz-Ağustos) rezervasyon şiddetle tavsiye edilir. Antik liman restoranları akşam 19:00-22:00 arası çok yoğundur; popüler balık lokantaları sezon boyunca haftalar önceden doludur. Kadırga Koyu'ndaki deniz manzaralı restoranlar da rezervasyon gerektirir, özellikle günbatımı saatleri için. Behramkale köy lokantaları öğle vakti (13:00-15:00) doldurabilir. Hafta içi akşam yemekleri nispeten daha esneklik sağlar ama güvenlik için 1-2 gün önceden telefon ederek yer ayırtmak önerilir. Çoğu restoran sosyal medya veya doğrudan telefonla rezervasyon alır; online rezervasyon sistemleri henüz yaygın değildir." },
      { q: "Antik liman ve Kadırga'da yemek fiyatları ne kadar?", a: "Assos antik limanı ve Kadırga Koyu gibi premium konumlardaki restoranlarda fiyatlar mekan ve menüye göre değişir. Balık keyfi için kişi başı ortalama 800-1500 TL hesaplamak gerekir; bu meze tabağı, salata, ızgara balık ve içecekle bütçedir. Sadece meze-rakı akşamı 500-800 TL arasıdır. Öğle menüleri (balık tava, pilav, meze) daha uygun fiyatlıdır — 400-700 TL. Günün balığı her zaman kilo bazında fiyatlanır, ortalama 800-1500 TL/kg aralığında. Köy lokantalarında ev yemeği menüleri 200-400 TL arasındadır. Hafta sonu ve yaz aylarında fiyatlar %10-20 artabilir. Fatura alırken servis bedeli ve içecek ayrı kalem olabilir." },
      { q: "Assos'ta vejetaryen/vegan menü bulunur mu?", a: "Ege mutfağı doğası gereği zeytinyağlı sebze yemekleri ve mezelerle zengindir, bu nedenle Assos restoranlarında vejetaryen seçenekler bol bulunur. Zeytinyağlı enginar, kuzukulağı, şevketi bostan, sarımsaklı yoğurt, cacık, humus, patlıcan kavurma gibi zeytinyağlı soğuk mezeler menülerin ana bölümünü oluşturur. Köy lokantalarında bakla, barbunya, türlü ve pırasa gibi sıcak vejetaryen yemekler mevcuttur. Vegan menü konusunda Behramkale ve Adatepe'deki bazı butik mekanlar özel olarak vegan seçenekler sunar; Kadırga Koyu'nda da organik ve vegan dostu restoranlar vardır. Glütensiz ve özel diyet talepleri için rezervasyon sırasında bilgi vermek önerilir; çoğu restoran bu tür taleplere uyum sağlar." },
      { q: "Assos restoranları kaç arası açık, servis saatleri?", a: "Assos restoranlarının servis saatleri mekan türüne göre değişir. Balık lokantaları ve akşam odaklı restoranlar genelde öğle 12:00-15:00, akşam 18:00-23:00 arasında servis yapar; yaz aylarında kapanış 24:00'ü bulabilir. Antik liman restoranları kesintisiz servis (12:00-23:00) sunabilir, özellikle turist yoğun dönemde. Köy lokantaları daha erken kapanır: 11:00-16:00 öğle odaklı, akşam servisi sınırlı. Meze-rakı mekanları genelde 17:00-01:00 arası açıktır. Kış aylarında (Kasım-Mart) saatler kısalır, bazı mekanlar Pazartesi-Salı günleri kapalı olabilir. Ramazan ayında iftar saatlerine göre servis saatleri ayarlanır. Her zaman güncel çalışma saatleri için telefon veya sosyal medya kontrolü önerilir." }
    ]
  },
  kahvalti: {
    id: 'kahvalti', emoji: '🌞', plural: 'Kahvaltı', heroPlural: 'Kahvaltı Mekanları', color: '#8A5520',
    eyebrow: "Assos Kahvaltı Rehberi",
    heroSub: "Serpme köy kahvaltısı, ev yapımı reçel ve Ayvacık peyniri — Assos'un en iyi kahvaltı adresleri.",
    heroChips: ['Serpme Kahvaltı', 'Köy Kahvaltısı', 'Ev Yapımı Reçel', 'Zeytin & Peynir', 'Manzaralı', 'Ayvacık'],
    title: "Assos Kahvaltı Mekanları — Serpme Köy Kahvaltısı Rehberi | Assos'u Keşfet",
    desc: "Assos kahvaltı: Behramkale, Ahmetçe, Adatepe serpme köy kahvaltısı. Ev yapımı reçel, Ayvacık peyniri, taze fırın ekmeği. En iyi kahvaltı mekanları tek sayfada.",
    shortIntro: "Assos'ta kahvaltı sadece yemek değil, bir ritüel. 15-25 çeşit serpme menü, ev yapımı ürünler ve bölgenin özgün lezzetleri — hangi sabahı istediğinize göre sofranızı seçin.",
    experiences: [
      { emoji: '🌾', title: 'Serpme Köy Kahvaltısı', desc: '15-25 çeşit ev yapımı menü. El emeği reçeller, köy peyniri, taze fırın ekmeği ve organik ürünler.' },
      { emoji: '👩‍🌾', title: 'Kadın Kooperatifi', desc: 'Yerel kadınların hazırladığı sosyal dayanışma sofrası. Organik, el emeği, hikayesi olan sofralar.' },
      { emoji: '🌅', title: 'Manzaralı Başlangıç', desc: 'Denize veya zeytinliklere bakarak güne başlayın. Ege\'nin ışığında sakin ve uzun kahvaltılar.' }
    ],
    intro: "Assos'ta kahvaltı deneyimi, kadın kooperatiflerinin el emeği reçellerinden Ayvacık köylerinin taze peynirlerine kadar Ege'nin gerçek tatlarını sofranıza taşıyor. Behramkale, Ahmetçe ve Adatepe'nin serpme köy kahvaltısı sunan mekanları; taze fırın ekmeği, yöresel zeytin, ev yapımı tereyağı ve 15-20 çeşit sunumla güne başlamanın en doğru yolu. Assos kahvaltı mekanları, çalışma saatleri ve menü detaylarıyla birlikte — sabah kahvaltı planınızı buradan yapın.",
    faqs: [
      { q: "Assos'ta serpme köy kahvaltısı nerede yapılır?", a: "Assos ve Ayvacık köyleri serpme köy kahvaltısının Türkiye'deki en özgün merkezlerinden biridir. Behramkale köy merkezindeki taş ev kafeleri ve aile işletmeleri; Ahmetçe köyündeki kadın kooperatifleri; Adatepe'nin zeytinlikler arasındaki avlulu mekanları ve Babakale sahilindeki köy evleri 15-25 çeşitlik serpme kahvaltı sunar. Menüde ev yapımı reçel (gül, kayısı, ceviz, taze incir), yöresel peynirler (beyaz, tulum, lor), günlük tereyağı, ekşi maya ekmeği, zeytin, sucuklu yumurta, omlet, börek, salata, bal-kaymak, mevsim meyveleri yer alır. Köy kahvaltısı kültürü Behramkale civarında özellikle gelişmiştir; yerel ürünlerle hazırlanır ve aileler tarafından servis edilir. Adatepe'de zeytinyağı müzesi yakınındaki kahvaltı mekanları da ünlüdür." },
      { q: "Assos kahvaltı fiyatları ne kadar, kişi başı ortalama?", a: "Assos'ta serpme köy kahvaltısı fiyatları mekana ve sezona göre değişir. Kişi başı ortalama 400-800 TL aralığındadır; 2 kişilik serpme kahvaltı 800-1600 TL arasında seyreder. Lüks mekanlar veya deniz manzaralı işletmeler 1000 TL/kişi üzerine çıkabilir. Köy lokantalarında ve basit aile mekanlarında 300-500 TL/kişiden de kahvaltı bulunabilir. Hafta sonu ve yaz sezonu (Temmuz-Ağustos) fiyatları hafta içine göre %15-25 daha yüksektir. İçecekler (çay sınırsız, kahve, taze sıkılmış meyve suyu) bazı yerlerde fiyata dahildir, bazılarında ekstra. Organik ürünlü, tamamen ev yapımı menüler daha pahalıdır. Tatil günlerinde menü içeriği de zenginleşebilir." },
      { q: "Assos'ta kahvaltı için rezervasyon gerekli mi?", a: "Hafta sonları ve tatil günlerinde kahvaltı için rezervasyon şiddetle tavsiye edilir. Assos'un popüler kahvaltı mekanları 10:00-11:00 arası hızla dolar; özellikle Ahmetçe kadın kooperatifi gibi meşhur yerler hafta sonları bir hafta öncesinden dolu olabilir. Sabah 08:00-09:00 arası rezervasyonsuz yer bulmak nispeten kolaydır ama bahar ve yaz aylarında bu saat bile yoğun olabilir. Hafta içi günler (Pazartesi-Cuma) daha esneklik sağlar. Büyük grup (6+ kişi) için kesinlikle önceden bilgilendirme gerekir; mutfak hazırlık süresi önemlidir. Rezervasyon genelde telefon veya WhatsApp üzerinden yapılır; online sistem kullanan mekan sayısı sınırlıdır. Rezervasyonla birlikte tercih edilen menü çeşitleri de bildirilebilir." },
      { q: "Assos kahvaltı saatleri nedir, kaça kadar açık?", a: "Assos'ta kahvaltı servis saatleri genelde 07:30-13:00 arasındadır. Köy kahvaltısı sunan mekanlar sabah erken başlar — bazıları 07:00'da hizmete girer. En popüler saatler 09:00-12:00 arasıdır, bu dönem mekanlar en yoğun halindedir. Bazı kahvaltı mekanları 14:00'e kadar servis yapar, özellikle brunch konseptli yerler 15:00'e kadar uzatabilir. Öğle 13:00 sonrası kahvaltı bulmak zordur; öğle yemeğine geçişi olur. Hafta sonları ve tatil günlerinde bazı mekanlar kahvaltı servisini 14:00-14:30'a kadar uzatır. Gün içinde sabah erken gidip 11:00 civarı masa kalkmadan yer almak ideal; hava güneşlendikçe günün en güzel saatlerini kahvaltı masasında geçirebilirsiniz." },
      { q: "Assos kadın kooperatifi kahvaltısı nedir, neden özel?", a: "Ayvacık köylerinde kadın kooperatifleri sadece bir işletme değil, sosyal dayanışma ve yerel üretim hareketinin de yüzüdür. Ahmetçe Kadın Kooperatifi bu alanda en bilinen örnektir; köy kadınlarının el emeği reçel, turşu, tarhana, salça ve zeytinyağı gibi organik ürünleri sofraya taşır. Kooperatif kahvaltısı tamamen yerel üretimden oluşur: köy kendi bahçesinden sebze-meyve, kendi ineklerinden süt ürünleri, kendi değirmeninden un, kendi tezgahından ekmek. Sofraya 20+ çeşit konur — mevsime göre değişkenlik gösterir. Fiyat-performans olarak da değerli bir deneyimdir. Aynı zamanda köy kadınlarının ekonomik bağımsızlığını destekler, bu nedenle sorumlu turizm tercih edenler için özellikle anlamlıdır. Rezervasyon için mutlaka önceden arayın; hafta sonları çok dolar." }
    ]
  },
  plajlar: {
    id: 'beach', emoji: '🏖', plural: 'Plajlar', heroPlural: 'Plajları', color: '#1A9A8A',
    eyebrow: "Assos Plaj & Koy Rehberi",
    heroSub: "Berrak koylar, ince çakıllı sahiller ve Ege'nin en güzel mavisi — Assos plajları.",
    heroChips: ['Berrak Koy', 'Çakıl Plaj', 'Beach Club', 'Gizli Koy', 'Kadırga', 'Sivrice'],
    title: "Assos Plajları — Kadırga, Sivrice & Beach Club Rehberi | Assos'u Keşfet",
    desc: "Assos plajları: Kadırga Koyu berrak sular, Sivrice çakıl plaj, gizli koylar ve beach club'lar. Şemsiye, yeme-içme ve ulaşım bilgileriyle plaj rehberi.",
    shortIntro: "Assos'un denizle buluşmasının birden fazla yolu var. Ünlü koylar, gizli sahiller, beach club'lar — plaj tarzınıza göre Ege'nin en berrak sularını deneyimleyin.",
    experiences: [
      { emoji: '🌊', title: 'Ünlü Koylar', desc: 'Berrak sular, ince çakıl, mavi bayrak. Fotoğraflık ikonik plajlar; kalabalık ama kaliteli.' },
      { emoji: '🏝', title: 'Gizli Sahiller', desc: 'Doğal ve bakir koylar. Sessizlik, yalnız olmanın keyfi, kendi cennetinizi bulma şansı.' },
      { emoji: '🛋', title: 'Beach Club', desc: 'Konforlu şezlong, bar servisi, yemek ve müzik. Gün boyu tatil rahatlığı arayanlara.' }
    ],
    intro: "Assos plajları, Kadırga Koyu'nun ünlü berrak sularından Sivrice Plajı'nın ince çakıllarına, Türkiye'nin en temiz Ege sahillerini barındırıyor. Sokakağzı Koyu'nun sakinliğinden Kaleiçi Beach Club'ın konforuna, gizli koylardan çocuklu aileye uygun sığ plajlara — her tatil zevkine uygun Assos koyu ve plajı. Plaj girişleri, şemsiye-şezlong fiyatları, yeme-içme olanakları ve ulaşım bilgileriyle tatilinizi buradan planlayın. Assos'ta denize girilecek en iyi yerler tek listede.",
    faqs: [
      { q: "Assos'ta en iyi plaj ve koy hangisi?", a: "Assos bölgesinde her zevke uygun plaj ve koy bulunur. Kadırga Koyu berrak suları, ince çakıllı sahili ve tarihi Behramkale manzarasıyla en popüler plajdır — Temmuz-Ağustos ayları çok yoğun olur. Sivrice Plajı geniş kumsalı ve sığ suyu ile özellikle çocuklu aileler için idealdir, mavi bayraklıdır ve birkaç beach club bulunur. Sokakağzı Koyu küçük, sakin ve doğal güzelliğiyle gizli cennet arayanlar için mükemmeldir; arabayla zor ulaşım ama değer. Kaleiçi bölgesi butik beach club konsepti ile konfor isteyenlere uygun. Babakale yakınlarındaki koylar yerli ailelerin tercihi; daha sakin ve otantiktir. Yıldız Koyu ve Assos antik liman yakını plajlar ise tarih ve doğayı birleştirir. Her plajın kendine özgü karakteri vardır." },
      { q: "Assos plajlarına nasıl gidilir, ulaşım?", a: "Assos plajlarına ulaşım genelde araçla olur. Kadırga Koyu Behramkale köyünden 5 km (10 dakika), Sivrice 8 km (15 dakika), Sokakağzı 12 km (20 dakika) mesafededir. Sahil yolu (D550) iyi durumdadır, yaz aylarında araç trafiği yoğun olur. Yaz sezonunda (Haziran-Eylül) Ayvacık-Behramkale hattında dolmuş seferleri vardır, saatte bir kalkar ama son seferler genelde 19:00-20:00'dir. Taksi ile de ulaşım mümkün, Ayvacık merkezden Kadırga'ya ortalama 250-400 TL. Park yeri çoğu plajda sınırlıdır — ücretsiz yol kenarı park veya beach club'ların ücretli otoparkları (50-100 TL/gün) bulunur. Özellikle hafta sonları sabah 10:00 öncesi gitmek park yeri için kritiktir. Tatil aylarında bazı plajlara dolmuş sıkışıklığından dolayı 1.5-2 saat sürebilir." },
      { q: "Assos'ta ücretsiz girilebilen plaj var mı?", a: "Evet, Assos'ta halka açık ve ücretsiz plaj alanları bulunur. Kadırga Koyu'nun önemli bir kısmı ücretsizdir; sadece beach club bölümleri ücretli şezlong-şemsiye servisi sunar. Sivrice'nin halk plajı bölümü tamamen ücretsizdir; yanında duş, tuvalet, soyunma kabini gibi temel olanaklar da vardır. Sokakağzı Koyu ulaşımı zor ama tamamen ücretsiz ve kalabalıksızdır; havluyla uzanılır. Babakale ve çevresindeki koylar doğal plajlardır, ücret alınmaz. Beach club'larda genelde içeriye giriş ücretsiz ama şezlong-şemsiye kullanımı ücretlidir (300-800 TL); yiyecek-içecek tüketimi karşılığında ücretsiz şemsiye sunan mekanlar da vardır. Ücretsiz plajlarda kendi şemsiye ve minderinizi götürmeniz önerilir." },
      { q: "Assos beach club fiyatları ne kadar, ne sunar?", a: "Assos beach club fiyatları konum, konfor seviyesi ve sezona göre değişir. Standart şezlong-şemsiye paketi kişi başı 300-600 TL aralığındadır; premium (VIP loca, minder, servis) paketler 800-1500 TL'ye kadar çıkabilir. Bazı beach club'larda giriş ücretsiz ama minimum harcama (yiyecek-içecek) şartı vardır: 500-1000 TL/kişi civarında. Hafta sonu ve yaz sezonu fiyatları hafta içine göre %20-40 daha yüksektir. Beach club'lar genellikle şemsiye-şezlong dışında duş-tuvalet, soyunma kabini, güneş kremi, havlu servisi, plaj yatağı ve çevrimiçi rezervasyon sunar. Restoran-bar servisi (kokteyl, meze, ızgara balık), canlı müzik ve bazılarında DJ partileri de vardır. Yemek menüsü fiyatları ortalama restoran seviyesindedir. Hafta sonları önceden rezervasyon yapmak gerekir." },
      { q: "Çocuklu aileye uygun plaj nerede, güvenli mi?", a: "Çocuklu aileler için Assos'ta güvenli ve sığ plajlar öncelik olmalı. Sivrice Plajı çocuklu ailelerin ilk tercihidir; geniş kumsal, sığ su, yumuşak zemin (ince kum-çakıl) çocuklar için idealdir. Dalga az, akıntı yoktur; cankurtaran hizmeti mavi bayrak standardında sunulur. Sokakağzı'nın bazı bölümleri de sığ ve sakindir ama ulaşım zor olabilir. Beach club'larda aile konseptli bölümler; çocuk havuzu, oyun parkı, animasyon (Temmuz-Ağustos), güvenli yüzme alanı bulunur. Kadırga Koyu'nun bazı kısımları biraz derin ve taşlıdır, 4-5 yaş altı için dikkatli olunmalı. Babakale plajları sakin ama bazıları doğal kayalıklı, yüzme için sığlık kontrol edilmeli. Her yaşa uygun çocuk şemsiyesi, şamandıra ve plastik ayakkabı götürmeniz önerilir. Ayrıca saatler 10:00-13:00 arası güneş en sert — çocuklarda mutlaka koruyucu kullanılmalı." }
    ]
  },
  iskeleler: {
    id: 'iskele', emoji: '⚓', plural: 'İskeleler', heroPlural: 'İskeleleri', color: '#3A5A8A',
    eyebrow: "Assos Tarihi İskeleler",
    heroSub: "Balıkçı tekneleri, gün batımı turları ve Ege'nin rüzgârı — Assos iskeleleri.",
    heroChips: ['Balıkçı Limanı', 'Tekne Turu', 'Gün Batımı', 'Antik Liman', 'Babakale', 'Ahmetçe'],
    title: "Assos İskeleleri — Antik Liman & Balıkçı Limanı Rehberi | Assos'u Keşfet",
    desc: "Assos iskeleleri: antik liman, Babakale balıkçı iskelesi, Ahmetçe sakin koy. Tekne turu, balık mekanları ve tarihi rıhtım ulaşımıyla iskele rehberi.",
    shortIntro: "Assos'un iskeleleri sadece denize açılan kapı değil, deneyim kapısı. Tarihle, balıkla ya da tekneyle — hangi hikayede yer almak istediğinize göre limanınızı seçin.",
    experiences: [
      { emoji: '🏛', title: 'Tarihi Limanlar', desc: '2500 yıllık taş rıhtımda yürüyüş. Antik çağdan Osmanlı\'ya Ege ticaretinin izleri ve etkileyici fotoğraf anları.' },
      { emoji: '🎣', title: 'Balıkçı Limanı', desc: 'Sabah erken taze balık tezgahları, köy halkıyla sohbet, basit ama gerçek Ege sofraları.' },
      { emoji: '⛵', title: 'Tekne & Gün Batımı', desc: 'Koy turları, günbatımı tekneleri, balık tutma aktiviteleri. Denizi yaşamak için en özel yol.' }
    ],
    intro: "Assos iskeleleri, antik çağdan bu yana Ege'nin ticaret ve balıkçılık merkezi olan bu bölgenin denizle olan köklü bağını yaşıyor. Antik liman'ın tarihi taş rıhtımından Babakale balıkçı iskelesine, Ahmetçe'nin sakin limanından gün batımı teknelerine kadar — her iskele Assos'un farklı bir hikayesini anlatıyor. Tekne turları, taze balık mekanları, manzara noktaları ve iskele kafeleri; konum ve ulaşım bilgileriyle birlikte Assos'un deniz kapılarını keşfedin.",
    faqs: [
      { q: "Assos antik limanı nerede, nasıl ulaşılır?", a: "Assos antik limanı Behramkale köyünün hemen altında, 2500 yıllık surların dibindedir. Köyden deniz seviyesine inen taş döşeli yoldan yürüyerek 15 dakikada (zorlu, eğimli) veya araçla 10 dakikada ulaşılır. Araçla dönüşte yol oldukça dik olduğu için düşük vites önerilir; yürüyüşte rahat ayakkabı gerekir. Liman kısmında park alanı sınırlıdır, yaz aylarında (Haziran-Eylül) erken saatlerde gitmek önerilir. Antik liman hem tarihi bir mekân hem yeme-içme noktasıdır: taş rıhtımın iki yanında 10-15 balık lokantası bulunur. Lokantaların her biri kendine özgü atmosfer sunar; günbatımı saatleri en popüler dönemdir. Giriş ücretsizdir, plaj kısmı yüzmeye uygun değil ama deniz fotoğraf için mükemmeldir." },
      { q: "Assos iskelelerinden tekne turu var mı, fiyatları?", a: "Evet, Assos iskelelerinden yaz aylarında çeşitli tekne turları düzenlenir. Antik liman'dan kalkan turlar en yaygınıdır: 3-4 saatlik gündüz koy turu (Kadırga, Sivrice, Sokakağzı koylarına yüzme molasıyla) kişi başı 800-1500 TL aralığındadır. Günbatımı turu 1.5-2 saat, akşam 18:00-20:00 arası, kişi başı 500-800 TL. Babakale iskelesinden balık tutma turu (ekipman dahil, 4-5 saat) 1000-1500 TL/kişi. Özel tekne kiralama 5000-10000 TL/gün aralığında değişir (8-12 kişi için). Yemekli özel turlar da organize edilir. Hafta sonu ve yoğun sezon (Temmuz-Ağustos) fiyatları biraz yüksek olabilir. Rezervasyon sabah erken yapılmalı; iskele önündeki taksi ofislerinde veya online turizm ajansları üzerinden ayarlanır. Can yeleği ve güneş koruyucu sağlanır ama havlu götürmeniz önerilir." },
      { q: "Babakale iskelesi görülmeye değer mi, ne var?", a: "Evet, Babakale Türkiye'nin Asya kıtasındaki en batı ucundaki yerleşimdir ve tarihi olarak son derece özeldir. 1723'te III. Ahmet tarafından yaptırılan Osmanlı Kalesi (Babakale Kalesi) köyün sembolü ve denize bakan zarif bir yapıdır. Tarihi balıkçı iskelesi hâlâ aktif olarak kullanılır; sabah erken saatlerde balıkçıların tezgahlarını kurduğunu görebilirsiniz — günlük taze balık almak için ideal. Köy içinde geleneksel boynuz saplı bıçak ustaları ve zeytinyağı üreticileri bulunur; hediyelik için mükemmeldir. İskelede 4-5 balık restoranı yaz akşamları dolu olur; özellikle Ege manzaralı terasları ünlüdür. Köyün atmosferi Behramkale'den daha sakindir, fotoğraf tutkunları için günbatımı ve mavi saat fotoğrafı için ideal. Behramkale'den araçla 35 dakika (25 km) mesafededir." },
      { q: "Gün batımı için hangi iskele en güzel?", a: "Assos bölgesinde günbatımı için en iyi iskele seçimi zevke göre değişir. Behramkale antik limanı klasik bir tercihtir; taş rıhtımdan izlenen günbatımı, surlar ve Athena Tapınağı siluetiyle birleşir — en çok fotoğraflanan noktalardan biridir. Babakale iskelesi Türkiye'nin en batı noktası olduğu için günbatımını en son burada görürsünüz; 10-15 dakika daha uzun süre izleme şansı verir. Ahmetçe iskelesi sakinlik ve minimum turist ile birebirdir, günbatımı sırasında genelde yerli halkla paylaşırsınız. Sokakağzı Koyu'nun küçük iskelesi ise gizli cennet deneyimidir. Yaz aylarında (Haziran-Ağustos) günbatımı saat 19:30-20:30, ilkbahar ve sonbaharda 18:00-19:00 arasıdır. Altın saat (günbatımından 30 dk önce) ve mavi saat (sonrası) fotoğraf için en güzel zamanlardır. Günbatımı sonrası akşam yemeği için iskele restoranlarında rezervasyon önerilir." },
      { q: "Ahmetçe iskelesi ziyaret edilebilir mi, nasıl bir yer?", a: "Ahmetçe, Assos bölgesinin en sakin ve otantik sahil köylerinden biridir, iskelesi ziyarete açıktır ve günübirlik gezi için ideal. Köy meydanında küçük bir balıkçı barınağı, birkaç kafe-restoran ve geleneksel köy evleri bulunur. İskelede yerel balıkçılarla sohbet etmek, taze balık almak veya basit balık sandviçi yemek mümkündür. Köyde ünlü Ahmetçe Kadın Kooperatifi bulunur; organik ürünler, el emeği reçel ve serpme köy kahvaltısıyla ünlüdür (mutlaka rezervasyon alın). Küçük ama şirin bir sahili vardır, yüzmek mümkündür ama plaj beach club konseptinde değil doğaldır. Turist yoğunluğu çok düşüktür, özellikle hafta içi gelirseniz kalabalıkla karşılaşmazsınız. Behramkale'den araçla 20 dakika (18 km) mesafededir; sahil yolundan ulaşılır. Fotoğraf, sakin öğle yemeği ve organik alışveriş için mükemmel bir durak." }
    ]
  }
};

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function onRequest(context) {
  const { params, request, env, next } = context;
  const category = params.category;

  // Whitelist disindakiler: diger function'lara ve static asset'e birak
  if (!CATEGORIES[category]) return next();

  // Trailing slash normalize: /kafeler/ -> /kafeler (301)
  const url = new URL(request.url);
  if (url.pathname.endsWith('/') && url.pathname.length > 1) {
    return Response.redirect(url.origin + url.pathname.slice(0, -1) + url.search, 301);
  }

  const c = CATEGORIES[category];
  const catId = c.id;
  const hubUrl = `https://assosukesfet.com/${category}`;

  // mekanlar.html asset'ini al, HTMLRewriter ile kategori-ozel ice yazim yap
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/mekanlar.html';
  assetUrl.search = '?cat=' + catId;
  const response = await env.ASSETS.fetch(assetUrl);

  // Hero chip'leri server-side render
  const chipsHtml = c.heroChips.map(ch =>
    `<span class="mk-hero-chip">${escapeHtml(ch)}</span>`
  ).join('');

  // Experiences section — deneyim/stil odakli 3 kart. Lokasyon bagimsiz, yaratici
  // Tasarim: sol-buyuk numara + emoji + baslik + desc, hover'da kategori rengi accent
  const experiencesHtml = `
<section class="mk-hub-experiences" style="background:linear-gradient(180deg,#FAF7F2 0%,#F5EDE0 100%);padding:88px 24px 80px;position:relative;overflow:hidden">
  <div style="position:absolute;top:-80px;right:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,${c.color}1a 0%,transparent 70%);pointer-events:none"></div>
  <div style="position:absolute;bottom:-50px;left:-50px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,${c.color}14 0%,transparent 70%);pointer-events:none"></div>
  <div style="max-width:1100px;margin:0 auto;position:relative;z-index:1">
    <div style="text-align:center;margin-bottom:52px;max-width:640px;margin-left:auto;margin-right:auto">
      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="width:28px;height:1.5px;background:${c.color}"></span>
        <span style="font-size:.68rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${c.color}">Stil Keşfi</span>
        <span style="width:28px;height:1.5px;background:${c.color}"></span>
      </div>
      <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(1.7rem,4vw,2.4rem);color:#1A2744;margin:0 0 14px;letter-spacing:-.025em;line-height:1.12">Sana hangi <span style="font-family:'Lora',serif;font-style:italic;font-weight:500;color:${c.color}">${escapeHtml(c.plural.toLowerCase())}</span> uygun?</h2>
      <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:.94rem;color:#4A5568;line-height:1.75;margin:0">${escapeHtml(c.shortIntro)}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px">
      ${c.experiences.map((e, i) => {
        const num = String(i + 1).padStart(2, '0');
        return `
        <article class="mk-exp-card" style="background:#fff;border:1px solid rgba(26,39,68,.06);border-radius:22px;padding:32px 28px;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s,border-color .3s;cursor:default" onmouseover="this.style.transform='translateY(-6px)';this.style.boxShadow='0 24px 60px rgba(26,39,68,.1)';this.style.borderColor='${c.color}33';this.querySelector('.mk-exp-num').style.color='${c.color}';this.querySelector('.mk-exp-line').style.width='48px'" onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='rgba(26,39,68,.06)';this.querySelector('.mk-exp-num').style.color='rgba(26,39,68,.08)';this.querySelector('.mk-exp-line').style.width='24px'">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
            <div style="font-size:3rem;line-height:1;filter:drop-shadow(0 3px 8px ${c.color}22)" role="img" aria-label="${escapeHtml(e.title)}">${e.emoji}</div>
            <span class="mk-exp-num" style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2.4rem;color:rgba(26,39,68,.08);line-height:1;letter-spacing:-.04em;transition:color .3s">${num}</span>
          </div>
          <div class="mk-exp-line" style="width:24px;height:2px;background:${c.color};margin-bottom:14px;transition:width .3s"></div>
          <h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.15rem;color:#1A2744;margin:0 0 8px;letter-spacing:-.015em">${escapeHtml(e.title)}</h3>
          <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;color:#4A5568;line-height:1.7;margin:0">${escapeHtml(e.desc)}</p>
        </article>`;
      }).join('')}
    </div>
  </div>
</section>`;

  // FAQ section HTML (SSS — SEO long-tail keyword'ler + rich snippet besler)
  const faqHtml = `
<section class="mk-hub-faq" style="background:#fff;padding:64px 24px;border-bottom:1px solid rgba(26,39,68,.06)">
  <div style="max-width:760px;margin:0 auto">
    <div style="text-align:center;margin-bottom:36px">
      <div style="font-size:.65rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${c.color};margin-bottom:8px">Sıkça Sorulan Sorular</div>
      <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.6rem;color:#1A2744;margin:0;letter-spacing:-.02em">Assos ${escapeHtml(c.plural)} Hakkında</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${c.faqs.map((f, i) => `
        <details name="mk-hub-faq-${category}" style="background:#FAF7F2;border:1px solid rgba(26,39,68,.06);border-radius:14px;padding:0;overflow:hidden;transition:all .2s">
          <summary style="cursor:pointer;padding:18px 22px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:#1A2744;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:16px">
            <span>${escapeHtml(f.q)}</span>
            <span style="color:${c.color};font-size:1.2rem;transition:transform .2s;flex-shrink:0">+</span>
          </summary>
          <div style="padding:0 22px 22px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.92rem;line-height:1.75;color:#4A5568">${escapeHtml(f.a)}</div>
        </details>
      `).join('')}
    </div>
  </div>
  <style>.mk-hub-faq details[open] summary span:last-child{transform:rotate(45deg)}.mk-hub-faq summary::-webkit-details-marker{display:none}</style>
  <script>
  // Fallback: eski browser'lar details[name] desteklemezse (Chrome <120, Safari <17.2, Firefox <119)
  // Ayni grup icindeki bir details acildiginda digerlerini kapat.
  (function(){
    var group = document.querySelectorAll('.mk-hub-faq details[name="mk-hub-faq-${category}"]');
    if (!group.length) return;
    // Native destek testi
    if ('name' in group[0] && group[0].name) return; // modern destek var, JS gereksiz
    group.forEach(function(d){
      d.addEventListener('toggle', function(){
        if (d.open) group.forEach(function(o){ if (o !== d) o.open = false; });
      });
    });
  })();
  </script>
</section>`;

  // Breadcrumb JSON-LD (hub 3 seviye)
  const breadcrumbJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Anasayfa', 'item': 'https://assosukesfet.com' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Mekanlar', 'item': 'https://assosukesfet.com/mekanlar' },
      { '@type': 'ListItem', 'position': 3, 'name': c.plural, 'item': hubUrl }
    ]
  });

  // CollectionPage + ItemList schema (hub sayfasi bir kategori sayfasi)
  const collectionJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': c.title,
    'description': c.desc,
    'url': hubUrl,
    'inLanguage': 'tr-TR',
    'isPartOf': {
      '@type': 'WebSite',
      'name': "Assos'u Keşfet",
      'url': 'https://assosukesfet.com'
    },
    'about': {
      '@type': 'Thing',
      'name': `Assos ${c.plural}`,
      'description': c.heroSub
    }
  });

  // FAQPage schema (5 SSS, mekan adi yok — generic SEO long-tail)
  const faqJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': c.faqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
    }))
  });

  // HTMLRewriter ile hero, meta, chips, intro, FAQ, schemas server-side render
  let breadcrumbDone = false;
  return new HTMLRewriter()
    // Title
    .on('title', { element(el) { el.setInnerContent(c.title); } })
    // Meta description
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', c.desc); } })
    // Canonical URL
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', hubUrl); } })
    // Open Graph
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', c.title); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', c.heroSub); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', hubUrl); } })
    // Twitter
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute('content', c.title); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute('content', c.heroSub); } })
    // Breadcrumb JSON-LD - ilkini guncelle (sayfadaki mevcut BreadcrumbList schema)
    .on('script[type="application/ld+json"]', {
      element(el) {
        if (!breadcrumbDone) {
          el.setInnerContent(breadcrumbJson);
          breadcrumbDone = true;
        }
      }
    })
    // Head kapanisindan once ek schemalar (CollectionPage + FAQPage)
    .on('head', {
      element(el) {
        el.append(
          `<script type="application/ld+json">${collectionJson}</script>` +
          `<script type="application/ld+json">${faqJson}</script>`,
          { html: true }
        );
      }
    })
    // Hero eyebrow (2. span, dot olmayan)
    .on('.mk-hero-eyebrow span:nth-of-type(2)', { element(el) { el.setInnerContent(c.eyebrow); } })
    // Hero H1
    .on('.mk-hero-h1', { element(el) { el.setInnerContent(`Assos<br><em>${c.heroPlural}</em>`, { html: true }); } })
    // Hero alt metin (kisa etkileyici cümle)
    .on('.mk-hero-sub', { element(el) { el.setInnerContent(c.heroSub); } })
    // Hero-intro element'ini bos birak (artik kullanilmiyor, regions section'a tasindi)
    .on('#mk-hero-intro', { element(el) { el.setInnerContent(''); } })
    // Hero chip'leri
    .on('#mk-hero-cats', { element(el) { el.setInnerContent(chipsHtml, { html: true }); } })
    // Istatistik karti gizle (sadece /mekanlar'da gorunsun)
    .on('.mk-hero-card', { element(el) { el.setAttribute('style', 'display:none'); } })
    // Hero'dan sonra deneyim/stil kartlari (3 kart, lokasyon bagimsiz)
    .on('.mk-hero', { element(el) { el.after(experiencesHtml, { html: true }); } })
    // Mekanlar hub'a ozel elementleri kaldir (FAQ section + CollectionPage/FAQPage
    // JSON-LD schemas). Kategori sayfasinda kategoriye ozel FAQ + schema kullanilir.
    .on('[data-mekanlar-only]', { element(el) { el.remove(); } })
    // FAQ section'u footer'dan hemen once (tum mekanlar listesinden sonra)
    .on('#footer-placeholder', { element(el) { el.before(faqHtml, { html: true }); } })
    // Body'e hub flag
    .on('body', { element(el) { el.setAttribute('data-hub-cat', catId); } })
    .transform(response);
}
