// 5 yeni blog yazısı — admin panelde Console'a yapıştırın

(async function() {
  const db = firebase.firestore();
  const now = new Date().toISOString();
  const posts = [
    {
      id: 'assos-antik-kenti-gezi-rehberi',
      title: "Assos Antik Kenti: Tarih, Gezilecek Yapılar ve Ziyaret Rehberi",
      category: 'Tarih & Kültür',
      emoji: '🏛',
      status: 'published',
      excerpt: "MÖ 6. yüzyıldan bugüne Assos Antik Kenti — Athena Tapınağı, amfitiyatro, nekropol, surlar ve agora hakkında bilmeniz gereken her şey.",
      tags: ['assos antik kenti', 'athena tapınağı', 'behramkale tarihi', 'antik kent', 'arkeoloji', 'çanakkale gezilecek yerler'],
      content: `
<h2>Assos Antik Kenti Hakkında</h2>
<p>Assos, MÖ 6. yüzyılda sönmüş bir volkanik tepede, denizden 236 metre yükseklikte kurulmuş antik bir kenttir. Büyük filozof Aristoteles MÖ 347-345 yılları arasında burada yaşamış ve felsefe okulu kurmuştur. Bugün <a href="yerler.html">Behramkale köyünün tepesinde</a> yer alan kalıntılar, binlerce yıllık tarihi gözler önüne serer.</p>

<h2>Athena Tapınağı</h2>
<p>Antik kentin en yüksek noktasında, Ege Denizi'ne hâkim konumda yükselen Athena Tapınağı, Assos'un sembolüdür. <strong>Anadolu'da inşa edilen ilk ve tek Dor düzenindeki tapınak</strong> olma özelliğini taşır. MÖ 530 yılında yapılmıştır.</p>
<p>Tapınağın orijinal frizleri bugün Boston Güzel Sanatlar Müzesi, Paris Louvre Müzesi ve İstanbul Arkeoloji Müzesi'nde sergilenmektedir. Sağlam kalan sütunlardan kalıplar çıkarılarak yenileri dökülmüş ve restore edilmiştir.</p>
<blockquote>İpucu: Gün batımında tapınaktan Midilli Adası manzarası eşsizdir. <a href="blog?yazi=assosta-gezilecek-10-yer">En iyi 10 yer listemizde</a> birinci sırada yer alır.</blockquote>

<h2>Amfitiyatro</h2>
<p>Güney yamacında, Midilli Adası'na bakacak şekilde inşa edilmiş Roma dönemi tiyatrosu. Depremlerle yıkılmış, restorasyondan sonra 1500 kişilik kapasitesiyle yeniden etkinliklere ev sahipliği yapmaktadır. Yaz aylarında konserler ve tiyatro gösterileri düzenlenir.</p>

<h2>Nekropol (Mezarlık Alanı)</h2>
<p>9 yüzyıl boyunca kesintisiz kullanılmış antik mezarlık. Dönemler boyunca gömme gelenekleri değişmiştir — önce ölü külleri küplere konmuş, sonraki dönemlerde lahitler kullanılmıştır. Batı kapısından limana inen yol üzerinde kalıntıları görebilirsiniz.</p>

<h2>Surlar</h2>
<p>MÖ 4. yüzyılda inşa edilen surlar, 3.200 metre uzunluğunda ve 20 metre yüksekliğindedir. Doğu ve batı olmak üzere iki ana kapısı vardır. Özellikle batı kapısı iyi korunmuş durumdadır ve buradan <a href="yerler.html">antik limana</a> yürüyerek inebilirsiniz.</p>

<h2>Agora ve Stoa</h2>
<p>Kentin kalbi olan agora, insanların bir araya geldiği merkezi alandır. Kapalı stoa yapıları, gymnasion (spor okulu), bouleuterion (meclis binası) ve geç dönemde inşa edilmiş Bizans Kilisesi kalıntılarını bir arada görebilirsiniz.</p>

<h2>Ziyaret Bilgileri</h2>
<h3>Açılış Saatleri</h3>
<ul>
<li><strong>Yaz (1 Nisan – 31 Ekim):</strong> 08:30 – 20:00</li>
<li><strong>Kış (1 Kasım – 31 Mart):</strong> 08:30 – 17:30</li>
</ul>

<h3>Giriş Kapıları</h3>
<p>İki giriş noktası vardır:</p>
<ul>
<li><strong>Kuzey girişi:</strong> <a href="koyler.html">Behramkale köyü</a> içinden geçerek Athena Tapınağı'na ulaşırsınız</li>
<li><strong>Batı girişi:</strong> Liman yakınından girerek nekropol, gymnasion ve agoraya ulaşırsınız</li>
</ul>

<h2>Nasıl Gidilir?</h2>
<p>Assos Antik Kenti'ne ulaşım hakkında detaylı bilgi için <a href="blog?yazi=assosa-nasil-gidilir-ulasim-rehberi">ulaşım rehberimizi</a> okuyun. Konumu <a href="harita.html">interaktif haritamızda</a> görebilirsiniz.</p>
      `
    },
    {
      id: 'assos-nerede-kalinir-konaklama',
      title: "Assos'ta Nerede Kalınır? Bölge Bölge Konaklama Rehberi",
      category: 'Gezi Rehberi',
      emoji: '🏨',
      status: 'published',
      excerpt: "Behramkale, Kadırga, Sivrice ve Sokakağzı'nda otel, pansiyon, köy evi ve kamp seçenekleri — bütçeye göre konaklama önerileri.",
      tags: ['assos otel', 'assos konaklama', 'behramkale otel', 'kadırga koyu otel', 'nerede kalınır', 'pansiyon'],
      content: `
<h2>Assos'ta Konaklama Bölgeleri</h2>
<p>Assos bölgesinde konaklama seçenekleri dört ana bölgede yoğunlaşır. Her bölgenin kendine özgü avantajları vardır. <a href="mekanlar.html">Tüm konaklama mekanlarımızı</a> inceleyin.</p>

<h2>1. Behramkale Köyü</h2>
<p><a href="koyler.html">Behramkale</a>, Assos'un kalbidir. Taş evlerin restore edilerek butik otellere dönüştürüldüğü köyde, tarihin içinde uyumak mümkündür.</p>
<ul>
<li><strong>Avantajı:</strong> Antik kent, tapınak ve limana yürüme mesafesi</li>
<li><strong>Kime uygun:</strong> Tarih ve kültür meraklıları, romantik tatil arayanlar</li>
<li><strong>Tarz:</strong> Butik oteller, taş evler, pansiyonlar</li>
</ul>

<h2>2. Kadırga Koyu</h2>
<p>Assos'un en popüler plajı olan <a href="blog?yazi=assos-koy-plaj-rehberi">Kadırga Koyu</a> çevresinde çeşitli konaklama seçenekleri bulunur.</p>
<ul>
<li><strong>Avantajı:</strong> Denize sıfır, plaj erişimi</li>
<li><strong>Kime uygun:</strong> Aileler, deniz tatili isteyenler</li>
<li><strong>Tarz:</strong> Moteller, pansiyonlar, kamp alanları</li>
</ul>

<h2>3. Sivrice – Sokakağzı Bölgesi</h2>
<p>Babakale yönünde, daha sakin ve doğal koyların bulunduğu bölge. Son yıllarda butik turizm gelişmektedir.</p>
<ul>
<li><strong>Avantajı:</strong> Sakinlik, doğal koylar, kalabalıktan uzak</li>
<li><strong>Kime uygun:</strong> Huzur arayanlar, doğa severler</li>
<li><strong>Tarz:</strong> Küçük pansiyonlar, kamp, glamping</li>
</ul>

<h2>4. Küçükkuyu – Altınoluk Yönü</h2>
<p>Assos'un doğusunda, daha gelişmiş turizm altyapısına sahip bölge. Zeytin ağaçları ve sahil arasında konumlanmıştır.</p>
<ul>
<li><strong>Avantajı:</strong> Daha fazla seçenek, market ve restoran çeşitliliği</li>
<li><strong>Kime uygun:</strong> Konfor arayanlar, uzun tatil planlayanlar</li>
<li><strong>Tarz:</strong> Apart oteller, villalar, büyük oteller</li>
</ul>

<h2>Konaklama Seçerken Dikkat Edilecekler</h2>
<ul>
<li><strong>Sezon:</strong> Temmuz-Ağustos en yoğun dönem — erken rezervasyon şart</li>
<li><strong>Ulaşım:</strong> Araçsız geliyorsanız Behramkale veya Kadırga tercih edin</li>
<li><strong>Bütçe:</strong> Kamp ve pansiyon seçenekleri uygun fiyatlı alternatifler sunar</li>
</ul>

<blockquote>İpucu: En ideal konaklama dönemi Mayıs-Haziran ve Eylül-Ekim'dir. Hem fiyatlar uygun hem yerler daha sakindir.</blockquote>

<p>Assos'a nasıl ulaşacağınızı <a href="blog?yazi=assosa-nasil-gidilir-ulasim-rehberi">ulaşım rehberimizden</a> öğrenin. Geldiğinizde <a href="blog?yazi=assos-en-iyi-kahvalti-mekanlari">kahvaltı mekanlarımızla</a> güne başlayın!</p>
      `
    },
    {
      id: 'assos-gun-batimi-en-iyi-noktalar',
      title: "Assos'ta Gün Batımı İzlenecek En İyi 5 Nokta",
      category: 'Doğa',
      emoji: '🌅',
      status: 'published',
      excerpt: "Athena Tapınağı'ndan Babakale'ye — Assos bölgesinde unutulmaz gün batımı izleyebileceğiniz en güzel noktalar.",
      tags: ['assos gün batımı', 'behramkale manzara', 'babakale', 'fotoğraf noktaları', 'doğa', 'manzara'],
      content: `
<h2>Assos'ta Gün Batımı Neden Özel?</h2>
<p>Assos, Türkiye'nin batıya bakan en güzel kıyılarından birine sahiptir. Ege Denizi'nin ufuk çizgisinde batan güneş, Midilli Adası'nın silueti ve antik kalıntıların oluşturduğu manzara dünyada eşi benzeri olmayan bir deneyim sunar.</p>

<h2>1. Athena Tapınağı Tepesi</h2>
<p><a href="yerler.html">Assos'un en yüksek noktası</a> olan tapınak tepesi, gün batımı için en ikonik lokasyondur. 2500 yıllık sütunların arasından batan güneşi izlemek, zamanın durduğu hissini yaşatır.</p>
<ul>
<li><strong>Yükseklik:</strong> Denizden 236 metre</li>
<li><strong>Manzara:</strong> 180° Ege panoraması + Midilli Adası</li>
<li><strong>En iyi saat:</strong> Gün batımından 1 saat önce çıkın</li>
</ul>
<blockquote>İpucu: Yaz aylarında tapınak 20:00'ye kadar açık — gün batımını içeride izleyebilirsiniz.</blockquote>

<h2>2. Babakale Kalesi</h2>
<p><a href="koyler.html">Anadolu'nun en batı noktası</a> olan Babakale'de güneşin Ege'ye batışını izlemek, "Türkiye'nin son gün batımı" anlamına gelir. Osmanlı kalesinin surlarından muhteşem bir panorama açılır.</p>

<h2>3. Adatepe Köyü</h2>
<p>Kaz Dağları eteklerindeki <a href="blog?yazi=assos-koylari-rehberi">Adatepe</a>, yüksek konumuyla geniş bir manzara sunar. Köy kahvesinde çay içerken batımı izlemek ayrı bir keyiftir.</p>

<h2>4. Antik Liman Rıhtımı</h2>
<p>Deniz seviyesinden, kayalık rıhtımda oturarak izlenen gün batımı farklı bir atmosfer yaratır. Arkada tapınağın silueti, önde denize yansıyan turuncu ışıklar — fotoğraf için mükemmeldir.</p>

<h2>5. Kadırga Koyu</h2>
<p><a href="blog?yazi=assos-koy-plaj-rehberi">Kadırga'nın güney ucundaki</a> kayalıklardan izlenen batım, denizle güneşin buluştuğu anı yakından görmenizi sağlar.</p>

<h2>Fotoğraf İpuçları</h2>
<ul>
<li>Altın saat (golden hour) batımdan 30 dakika önce başlar</li>
<li>Tapınakta sütunları çerçeve olarak kullanın</li>
<li>Siluet fotoğraflar için karanlık objeleri ön plana alın</li>
<li>Geniş açı lens ile panoramik çekimler yapın</li>
</ul>

<p>Tüm bu noktaları <a href="harita.html">interaktif haritamızda</a> görebilirsiniz. Gün batımı öncesi <a href="mekanlar.html">bir kafede</a> mola verin!</p>
      `
    },
    {
      id: 'assos-1-gunluk-gezi-plani',
      title: "Assos'ta 1 Günlük Gezi Planı — Sabahtan Akşama Adım Adım",
      category: 'Rota İpucu',
      emoji: '🗓',
      status: 'published',
      excerpt: "Assos'ta sadece 1 gününüz mü var? Sabah kahvaltısından akşam gün batımına kadar dakika dakika gezi programı.",
      tags: ['assos gezi planı', '1 günlük assos', 'assos programı', 'gezi rotası', 'günübirlik assos'],
      content: `
<h2>Assos'ta 1 Gün Yeterli mi?</h2>
<p>Assos'u tam anlamıyla keşfetmek için en az 2-3 gün ideal olsa da, 1 günde de unutulmaz bir deneyim yaşayabilirsiniz. İşte dakika dakika plan — <a href="rotalar.html">hazır rotalarımızdan</a> "1 Günde Assos" rotasını da inceleyebilirsiniz:</p>

<h2>08:30 – Kahvaltı</h2>
<p><a href="koyler.html">Behramkale köyünde</a> zeytin ağaçları altında serpme kahvaltıyla güne başlayın. Ezine peyniri, köy tereyağı, kekik balı ve taze simit — Ege'nin en otantik kahvaltısı. <a href="blog?yazi=assos-en-iyi-kahvalti-mekanlari">En iyi kahvaltı mekanlarımıza göz atın →</a></p>

<h2>10:00 – Athena Tapınağı ve Antik Kent</h2>
<p>Kahvaltıdan sonra köyün tepesine çıkarak <a href="yerler.html">Athena Tapınağı'nı</a> ziyaret edin. Tapınak, amfitiyatro ve agora kalıntılarını gezin. <a href="blog?yazi=assos-antik-kenti-gezi-rehberi">Antik kent rehberimiz</a> size tüm detayları anlatacak.</p>
<blockquote>İpucu: Rahat ayakkabı giyin — taşlı yollar ve engebeli arazi var.</blockquote>

<h2>12:00 – Antik Liman</h2>
<p>Tepeden limanın taş yolundan inerek antik limana ulaşın (yaklaşık 15 dakika yürüyüş). Limandaki <a href="mekanlar.html">restoranlarda</a> deniz manzarası eşliğinde balık öğle yemeği yiyin.</p>

<h2>13:30 – Kadırga Koyu</h2>
<p>Öğle yemeğinden sonra arabayla 10 dakika uzaklıktaki <a href="blog?yazi=assos-koy-plaj-rehberi">Kadırga Koyu'na</a> gidin. Berrak turkuaz suda serinleyin, şezlongda dinlenin.</p>

<h2>16:00 – Adatepe Köyü</h2>
<p>İkindi sıcağından kaçarak <a href="blog?yazi=assos-koylari-rehberi">Adatepe'ye</a> çıkın. Taş sokakları gezin, Zeytinyağı Müzesi'ni ziyaret edin, köy kafesinde Türk kahvesi için.</p>

<h2>18:30 – Gün Batımı</h2>
<p>Akşam için iki seçenek:</p>
<ul>
<li><strong>Athena Tapınağı:</strong> Geri dönüp tapınaktan <a href="blog?yazi=assos-gun-batimi-en-iyi-noktalar">muhteşem gün batımını</a> izleyin</li>
<li><strong>Babakale:</strong> Anadolu'nun en batı ucunda "son gün batımı"nı yakalayın (30 dk sürüş)</li>
</ul>

<h2>20:00 – Akşam Yemeği</h2>
<p>Behramkale köyüne veya <a href="mekanlar.html">antik liman restoranlarına</a> dönüp mevsim balığı ve zeytinyağlılarla günü noktalayın.</p>

<h2>Pratik Bilgiler</h2>
<ul>
<li><strong>Araç:</strong> 1 günlük gezi için araç şart — toplu taşıma yetersiz</li>
<li><strong>Su:</strong> Bol su taşıyın, özellikle yaz aylarında</li>
<li><strong>Nakit:</strong> Küçük köy mekanları nakit tercih edebilir</li>
</ul>

<p><a href="planla.html">Gezinizi detaylıca planlayın →</a> veya tüm durakları <a href="harita.html">haritada görün →</a></p>
      `
    },
    {
      id: 'assos-yerel-lezzetler-ne-yenir',
      title: "Assos'ta Ne Yenir? Yerel Lezzetler ve Mutfak Rehberi",
      category: 'Yeme İçme',
      emoji: '🍽',
      status: 'published',
      excerpt: "Ege mutfağının en otantik tatları — Assos ve Ayvacık bölgesinde denemeniz gereken yemekler, yerel ürünler ve restoran önerileri.",
      tags: ['assos yemek', 'assos restoran', 'ege mutfağı', 'ne yenir', 'yerel lezzetler', 'zeytinyağlı'],
      content: `
<h2>Assos Mutfağı</h2>
<p>Assos bölgesi, Ege mutfağının en saf halini sunar. Zeytinyağı, otlar, deniz ürünleri ve mevsim sebzeleri — her şey taze ve yereldir. Bölgenin <a href="mekanlar.html">restoranları ve kafeleri</a>, bu lezzetleri modern ve geleneksel yorumlarla sofranıza getirir.</p>

<h2>Mutlaka Denemeniz Gereken Lezzetler</h2>

<h3>Zeytinyağlılar</h3>
<p>Assos'un kalbi zeytinyağıdır. Adatepe zeytinyağı dünyaca ünlüdür. Soğuk sıkım, organik ve taş baskı yöntemleriyle üretilir.</p>
<ul>
<li><strong>Enginar zeytinyağlı:</strong> Mevsiminde mutlaka deneyin</li>
<li><strong>Ot kavurma:</strong> Bölgeye özgü yabani otlarla yapılır</li>
<li><strong>Kabak çiçeği dolma:</strong> Yaz aylarının vazgeçilmezi</li>
<li><strong>Börülce salatası:</strong> Zeytinyağı, limon ve soğanla</li>
</ul>

<h3>Deniz Ürünleri</h3>
<p>Antik limandaki restoranlar, o gün tutulan balıkları servis eder. Kuzey Ege'nin soğuk suları balıklara ayrı bir lezzet katar.</p>
<ul>
<li><strong>Levrek ve çipura:</strong> Izgara veya buğulama</li>
<li><strong>Ahtapot:</strong> Mangalda, salatada veya güveçte</li>
<li><strong>Karides:</strong> Tereyağlı veya güveçte</li>
<li><strong>Midye tava:</strong> Aperatif olarak</li>
</ul>

<h3>Peynirler</h3>
<p>Bölge, Ezine peyniri ile ünlüdür. Keçi, koyun ve inek sütünden yapılan çeşitleri mevcuttur.</p>
<ul>
<li><strong>Ezine beyaz peynir:</strong> Tam yağlı, tuzlu</li>
<li><strong>Tulum peyniri:</strong> Olgunlaştırılmış, sert</li>
<li><strong>Lor peyniri:</strong> Taze, hafif</li>
</ul>

<h3>Tatlılar</h3>
<ul>
<li><strong>Peynir helvası:</strong> Bölgeye özgü geleneksel tatlı</li>
<li><strong>İncir tatlısı:</strong> Cevizli ve kaymakla</li>
<li><strong>Badem kurabiyesi:</strong> Yerel bademlerde yapılır</li>
</ul>

<h2>Yerel Ürünler — Ne Alınır?</h2>
<ul>
<li><strong>Adatepe zeytinyağı:</strong> Soğuk sıkım, organik</li>
<li><strong>Kekik balı:</strong> Bölgenin en değerli ürünlerinden</li>
<li><strong>Kurutulmuş otlar:</strong> Kekik, adaçayı, lavanta</li>
<li><strong>El yapımı sabunlar:</strong> Zeytinyağlı, lavantalı</li>
</ul>

<h2>Nerede Yenir?</h2>
<p>Bölgedeki <a href="mekanlar.html">restoran ve kafelerimizi</a> inceleyin. Her mekanın çalışma saatleri, telefon numarası ve konum bilgisine ulaşabilirsiniz.</p>

<h3>Liman Restoranları</h3>
<p>Antik limandaki restoranlar deniz ürünleri konusunda uzmanlaşmıştır. Deniz kenarında, tarihi dokuyla iç içe yemek yiyebilirsiniz.</p>

<h3>Köy Mekanları</h3>
<p><a href="koyler.html">Behramkale ve çevre köylerde</a> ev yemekleri sunan küçük mekanlar bulunur. Otantik Ege mutfağını en saf haliyle buralarda tadabilirsiniz.</p>

<blockquote>İpucu: Güne <a href="blog?yazi=assos-en-iyi-kahvalti-mekanlari">serpme kahvaltı</a> ile başlayın, öğleni limanda balıkla geçirin, akşamı köy mekanında zeytinyağlılarla bitirin.</blockquote>

<p>Assos'ta bir gününüzü planlamak için <a href="blog?yazi=assos-1-gunluk-gezi-plani">1 günlük gezi planımıza</a> göz atın. Tüm mekanların konumlarını <a href="harita.html">haritada görün →</a></p>
      `
    }
  ];

  for (const post of posts) {
    const id = post.id;
    delete post.id;
    post.publishedAt = now;
    post.createdAt = now;
    post.updatedAt = now;

    try {
      await db.collection('blog_posts').doc(id).set(post);
      console.log('✅ Eklendi: ' + post.title);
    } catch(err) {
      console.error('❌ Hata (' + id + '): ' + err.message);
    }
  }
  console.log('🎉 5 yeni yazı eklendi!');
})();
