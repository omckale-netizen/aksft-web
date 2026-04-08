// 5 yeni blog yazısı — admin panelde Console'a yapıştırın

(async function() {
  const db = firebase.firestore();
  const now = new Date().toISOString();
  const posts = [
    {
      id: 'adatepe-gezi-rehberi',
      title: "Adatepe Köyü Gezi Rehberi — Zeytinyağı Müzesi, Taş Evler ve Manzara",
      category: 'Gezi Rehberi',
      emoji: '🌿',
      status: 'published',
      excerpt: "Kaz Dağları eteklerinde, Ege'ye tepeden bakan Adatepe köyü — zeytinyağı müzesi, taş evler, butik kafeler ve fotoğraf noktaları.",
      tags: ['adatepe', 'adatepe köyü', 'adatepe gezilecek yerler', 'zeytinyağı müzesi', 'kaz dağları', 'assos köyleri', 'ayvacık'],
      content: `
<h2>Adatepe Nerede?</h2>
<p>Adatepe, Çanakkale'nin Ayvacık ilçesine bağlı, Kaz Dağları'nın (İda Dağı) eteklerinde deniz manzaralı bir tepe köyüdür. <a href="harita.html">Assos'a (Behramkale) yaklaşık 15 km</a> mesafededir. Denizden yaklaşık 300 metre yükseklikte konumlanan köy, Edremit Körfezi'ne muhteşem bir panorama sunar.</p>

<h2>Neden Adatepe'ye Gitmeli?</h2>
<p>Adatepe, Assos bölgesinin en fotojenik köyüdür. Restore edilmiş Rum taş evleri, dar taş sokakları, zeytinlikleri ve panoramik manzarasıyla hem fotoğrafçıların hem huzur arayanların gözdesidir. <a href="blog?yazi=assos-koylari-rehberi">Tüm Assos köyleri rehberimizi</a> de inceleyebilirsiniz.</p>

<h2>Gezilecek Yerler</h2>

<h3>Adatepe Zeytinyağı Müzesi</h3>
<p>Bölgenin en ünlü zeytinyağı üretim merkezlerinden biri. Eski taş değirmenin restore edilmesiyle oluşturulan müzede, geleneksel soğuk sıkım yöntemini görebilir ve taze zeytinyağı tadabilirsiniz. Müze çıkışında organik zeytinyağı, sabun ve kozmetik ürünler satın alabilirsiniz.</p>

<h3>Zeus Altarı (Gargaros Tepesi)</h3>
<p>Köyün hemen üstünde, Zeus'un Truva Savaşı'nı izlediği rivayet edilen tepe. Yürüyüş patikasıyla ulaşılır ve tepeden 360° manzara sunar — bir tarafta Ege, diğer tarafta Kaz Dağları.</p>

<h3>Taş Evler ve Sokaklar</h3>
<p>19. yüzyıl Rum mimarisini yansıtan taş evler, özenle restore edilerek butik otellere, kafelere ve atölyelere dönüştürülmüştür. Çiçekli avlular, taş döşeli dar sokaklar ve ahşap balkonlar fotoğraf için mükemmeldir.</p>

<h2>Ne Yenir, Nerede İçilir?</h2>
<p>Köyde birkaç butik kafe ve ev restoranı bulunur. Zeytinyağlı kahvaltı, gözleme ve otlu börek öne çıkan lezzetlerdir. <a href="blog?yazi=assos-en-iyi-kahvalti-mekanlari">Assos kahvaltı mekanları rehberimize</a> göz atın.</p>
<blockquote>İpucu: Köy kahvesinde Türk kahvesi içerken Edremit Körfezi manzarasını izleyin — Assos'un en güzel ikindi keyfi.</blockquote>

<h2>Gün Batımı</h2>
<p>Adatepe'nin yüksek konumu sayesinde, <a href="blog?yazi=assos-gun-batimi-en-iyi-noktalar">gün batımı Athena Tapınağı ile yarışır güzellikte</a>. Zeytinlikler arasından batan güneş eşsiz bir renk paleti oluşturur.</p>

<h2>Nasıl Gidilir?</h2>
<p>Adatepe'ye <a href="blog?yazi=assosa-nasil-gidilir-ulasim-rehberi">Ayvacık üzerinden</a> ulaşılır. Küçükkuyu-Ayvacık yolu üzerinde Adatepe sapağından 3 km'lik bir yol ile köye varırsınız. Araç önerilir — toplu taşıma sınırlıdır.</p>

<h2>Ne Kadar Süre Ayrılmalı?</h2>
<p>Köyü gezmek için 2-3 saat yeterlidir. Müze ziyareti, köy turu ve kafede mola dahil. <a href="blog?yazi=assos-1-gunluk-gezi-plani">1 günlük Assos planınıza</a> öğleden sonra durağı olarak ekleyin.</p>

<p><a href="koyler.html">Tüm köyleri keşfedin →</a> | <a href="harita.html">Haritada konumunu görün →</a></p>
      `
    },
    {
      id: 'babakale-gezi-rehberi',
      title: "Babakale Gezi Rehberi — Anadolu'nun En Batı Noktası",
      category: 'Gezi Rehberi',
      emoji: '⚓',
      status: 'published',
      excerpt: "Türkiye'de güneşin en son battığı yer Babakale — Osmanlı kalesi, balıkçı limanı, el yapımı bıçaklar ve muhteşem gün batımı.",
      tags: ['babakale', 'babakale gezi', 'anadolu en batı', 'babakale kale', 'gün batımı', 'assos babakale', 'çanakkale'],
      content: `
<h2>Babakale Nerede?</h2>
<p>Babakale, Çanakkale'nin Ayvacık ilçesine bağlı, <strong>Anadolu'nun (Asya kıtasının) en batı noktasında</strong> yer alan küçük bir balıkçı köyüdür. <a href="harita.html">Assos'a (Behramkale) yaklaşık 45 km</a> mesafededir. "Türkiye'de güneşin en son battığı yer" unvanını taşır.</p>

<h2>Babakale Kalesi</h2>
<p>1723-1725 yılları arasında III. Ahmed döneminde Venediklilere karşı inşa edilen Osmanlı kalesi, köyün simgesidir. Denize hâkim konumda yükselen kale, iyi korunmuş surları ve toplarıyla ziyaretçileri karşılar. Kale içinden Ege'ye açılan panoramik manzara nefes kesicidir.</p>

<h2>Gezilecek Yerler</h2>

<h3>Balıkçı Limanı</h3>
<p>Rengarenk balıkçı teknelerinin dizildiği küçük liman, köyün en pittoresk noktasıdır. Limandaki balık restoranlarında günün taze avından uygun fiyata yemek yiyebilirsiniz.</p>

<h3>El Yapımı Bıçaklar</h3>
<p>Babakale, geleneksel el yapımı bıçaklarıyla da tanınır. Köydeki zanaatkârlardan orijinal Babakale bıçağı satın alabilirsiniz — hem hediye hem koleksiyon değeri taşır.</p>

<h3>Apollon Smintheion Tapınağı</h3>
<p>Babakale yolu üzerinde Gülpınar'da bulunan <a href="yerler.html">Apollon tapınağı</a>, iyi korunmuş sütunları ve açık hava müzesiyle görülmeye değerdir. Babakale'ye giderken mutlaka uğrayın.</p>

<h2>Gün Batımı</h2>
<p>Babakale'de gün batımı izlemek, <strong>"Türkiye'nin son gün batımı"</strong> demektir. Kalenin surlarından veya limanın kayalıklarından izlenen batım, unutulmaz bir deneyimdir. <a href="blog?yazi=assos-gun-batimi-en-iyi-noktalar">En iyi gün batımı noktaları rehberimize</a> göz atın.</p>
<blockquote>İpucu: Gün batımını kaleden izledikten sonra limana inin — akşam yemeğinde taze balık yiyin.</blockquote>

<h2>Nasıl Gidilir?</h2>
<p>Assos'tan Babakale'ye arabayla yaklaşık 45 dakika sürer. Yol boyunca zeytinlikler, küçük koylar ve <a href="blog?yazi=assos-koy-plaj-rehberi">Sivrice-Sokakağzı koyları</a> mola noktaları olabilir. <a href="blog?yazi=assosa-nasil-gidilir-ulasim-rehberi">Detaylı ulaşım rehberimizi</a> okuyun.</p>

<h2>Babakale'den Bozcaada'ya</h2>
<p>Babakale'den devam ederek yaklaşık 65 km'lik sahil yolu ile Bozcaada feribotuna ulaşabilirsiniz. Yol üzerinde Kestanbolu Kaplıcaları, Alexandra Troas antik kenti ve Dalyan köyü de görülebilir.</p>

<p><a href="blog?yazi=assos-koylari-rehberi">Köy köy Assos rotası →</a> | <a href="harita.html">Haritada görün →</a></p>
      `
    },
    {
      id: 'assosta-denize-girilir-mi',
      title: "Assos'ta Denize Girilir mi? Su Sıcaklığı, Koylar ve Plaj Rehberi",
      category: 'Doğa',
      emoji: '🏊',
      status: 'published',
      excerpt: "Assos'ta deniz nasıl? Hangi koylar yüzmeye uygun, su sıcaklığı kaç derece, deniz sezonu ne zaman başlar — tüm cevaplar.",
      tags: ['assos deniz', 'assos denize girilir mi', 'assos su sıcaklığı', 'assos plaj', 'kadırga koyu deniz', 'ege denizi'],
      content: `
<h2>Assos'ta Denize Girilir mi?</h2>
<p><strong>Evet, kesinlikle!</strong> Assos bölgesi Kuzey Ege'nin en berrak sularına sahiptir. Kristal turkuaz koyları, çakıl plajları ve bakir sahilleriyle yüzme tutkunları için cennet gibidir.</p>

<h2>Deniz Sezonu Ne Zaman?</h2>
<ul>
<li><strong>Haziran–Eylül:</strong> Tam sezon, su sıcaklığı 22-25°C</li>
<li><strong>Mayıs ve Ekim:</strong> Su biraz serin (18-21°C) ama güneşli günlerde denize girilebilir</li>
<li><strong>Kasım–Nisan:</strong> Deniz sezonu dışı, su soğuk</li>
</ul>
<blockquote>Not: Kuzey Ege suları, Güney Ege ve Akdeniz'e göre birkaç derece daha serindir. Bu sayede yaz sıcağında bile ferahlatıcıdır.</blockquote>

<h2>En İyi Yüzme Noktaları</h2>

<h3>Kadırga Koyu ⭐ En Popüler</h3>
<p>Assos'un en erişilebilir ve en çok tercih edilen plajı. İnce çakıl, berrak turkuaz su, şezlong ve restoran imkânı. Aileler için ideal. <a href="blog?yazi=assos-koy-plaj-rehberi">Detaylı koy rehberimizi okuyun →</a></p>

<h3>Sivrice Koyu 🤫 Sakin</h3>
<p>Doğal yapısını büyük ölçüde korumuş, az kalabalık bir koy. Dalış için de uygundur.</p>

<h3>Sokakağzı Koyu 🏕 Kamp</h3>
<p>Kamp yapabilme imkânı olan, doğal güzelliği korunmuş bir koy.</p>

<h3>Yeşil Liman 🌲 Gizli Cennet</h3>
<p>Çam ve zeytin ağaçlarıyla çevrili, neredeyse hiç kalabalık olmayan saklı koy.</p>

<h3>Assos Antik Liman 🏛 Tarihi</h3>
<p>Tarihi limandaki kayalıklardan denize girebilirsiniz. Antik atmosferde yüzme deneyimi.</p>

<h2>Dikkat Edilmesi Gerekenler</h2>
<ul>
<li><strong>Deniz ayakkabısı:</strong> Zemin genellikle çakıl ve kayalıktır — şart!</li>
<li><strong>Güneş koruması:</strong> Koylar gölgesiz olabilir, krem ve şapka unutmayın</li>
<li><strong>Akıntılar:</strong> Açık denizde akıntı olabilir, kıyıya yakın yüzün</li>
<li><strong>Erken gidin:</strong> Yaz aylarında koylar öğleden sonra kalabalıklaşır, sabah 8-9 en ideal</li>
</ul>

<h2>Hangi Koy Size Uygun?</h2>
<ul>
<li><strong>Aile tatili:</strong> Kadırga Koyu</li>
<li><strong>Huzur:</strong> Sivrice veya Yeşil Liman</li>
<li><strong>Macera:</strong> Sokakağzı veya tekne turu</li>
<li><strong>Tarih + deniz:</strong> Antik Liman</li>
</ul>

<p>Tüm koyların konumlarını <a href="harita.html">interaktif haritamızda</a> görebilirsiniz. <a href="mekanlar.html">Plaj yakını mekanlarımıza</a> göz atın.</p>
      `
    },
    {
      id: 'assosa-kisin-gitmek',
      title: "Assos'a Kışın Gitmek — Kış Aylarında Assos Rehberi",
      category: 'Gezi Rehberi',
      emoji: '❄️',
      status: 'published',
      excerpt: "Assos sadece yaz destinasyonu değil! Kış aylarında Assos'ta neler yapılır, hangi mekanlar açık, hava nasıl — sakin sezon rehberi.",
      tags: ['assos kış', 'kışın assos', 'assos kış ayları', 'assos sakin sezon', 'behramkale kış', 'off season assos'],
      content: `
<h2>Kışın Assos'a Gidilir mi?</h2>
<p><strong>Evet!</strong> Assos, kalabalıksız ve otantik halini kış aylarında gösterir. Turistik koşuşturma yerine sakin sokaklar, sıcak bir çay ve antik kalıntılar arasında huzurlu yürüyüşler — kışın Assos başka güzeldir.</p>

<h2>Hava Durumu</h2>
<p>Assos bölgesi Akdeniz ikliminin etkisindedir. Kış ayları ılıman geçer:</p>
<ul>
<li><strong>Aralık–Şubat:</strong> Ortalama 8-12°C, yağmurlu günler olabilir</li>
<li><strong>Mart–Nisan:</strong> 14-18°C, bahar başlar, çiçekler açar</li>
<li><strong>Kar:</strong> Nadiren yağar, genellikle sadece Kaz Dağları zirvelerinde</li>
</ul>
<blockquote>İpucu: Rüzgârlı olabilir — özellikle tapınak tepesi ve koylar. Rüzgârlık ve kat kat giyinin.</blockquote>

<h2>Kışın Neler Yapılır?</h2>

<h3>Antik Kent Gezisi</h3>
<p><a href="blog?yazi=assos-antik-kenti-gezi-rehberi">Athena Tapınağı ve antik kent</a> kışın çok daha sakin ve atmosferiktir. Kimse olmadan tapınağı gezebilir, sisler arasında Midilli Adası'nı görebilirsiniz. Fotoğraf için en iyi dönem.</p>

<h3>Köy Turları</h3>
<p><a href="blog?yazi=assos-koylari-rehberi">Behramkale, Adatepe, Kayalar</a> — kış aylarında köy mekanlarında şömine başında kahvaltı ve sohbet. Yerel halkla tanışmak için en iyi zaman.</p>

<h3>Termal Kaplıca</h3>
<p>Babakale yolu üzerinde Kestanbolu Kaplıcaları, Osmanlı döneminden beri işletilen tarihi bir hamam. Kış aylarında sıcak suya girmek ayrı bir keyif.</p>

<h3>Zeytinyağı Hasadı</h3>
<p>Kasım–Ocak arası zeytin hasat dönemidir. Adatepe'de zeytinyağı üretim sürecini yakından görebilir, taze sıkım yağ tadabilirsiniz.</p>

<h3>Yürüyüş Rotaları</h3>
<p>Yaz sıcağı olmadan <a href="rotalar.html">doğa yürüyüşleri</a> çok daha keyiflidir. Zeytinlikler arası patikalar, köy yolları ve sahil rotaları.</p>

<h2>Hangi Mekanlar Açık?</h2>
<p>Yaz sezonuna göre mekan seçenekleri azalır ama köy merkezindeki kafeler, pansiyonlar ve bazı restoranlar yıl boyu açıktır. <a href="mekanlar.html">Mekanlarımızı kontrol edin</a> — çalışma saatleri günceldir.</p>

<h2>Konaklama</h2>
<p>Kışın fiyatlar yaz aylarına göre <strong>%40-60 daha uygun</strong>dur. Taş ev pansiyonlar ve butik oteller şömineli odalarıyla kış atmosferi sunar. <a href="blog?yazi=assos-nerede-kalinir-konaklama">Konaklama rehberimizi</a> inceleyin.</p>

<h2>En İdeal Kış Dönemi</h2>
<p><strong>Mart sonu – Nisan başı</strong> en iyi kış-bahar geçiş dönemidir. Hava ılır, çiçekler açar, kalabalık yok, fiyatlar uygun. Assos'u en otantik haliyle görmek isteyenler için biçilmiş kaftan.</p>

<p><a href="blog?yazi=assos-1-gunluk-gezi-plani">1 günlük gezi planınızı yapın →</a> | <a href="blog?yazi=assosa-nasil-gidilir-ulasim-rehberi">Ulaşım rehberi →</a></p>
      `
    },
    {
      id: 'assos-mu-bozcaada-mi',
      title: "Assos mu Bozcaada mı? İki Destinasyonun Karşılaştırması",
      category: 'Genel',
      emoji: '⚖️',
      status: 'published',
      excerpt: "Tatil planı yaparken Assos mu Bozcaada mı diye düşünenler için detaylı karşılaştırma — ulaşım, konaklama, plajlar, fiyatlar ve atmosfer.",
      tags: ['assos bozcaada', 'assos mu bozcaada mı', 'assos bozcaada karşılaştırma', 'ege tatili', 'tatil önerisi', 'kuzey ege'],
      content: `
<h2>Assos mu Bozcaada mı?</h2>
<p>Kuzey Ege'nin iki incisi: biri antik tarihiyle, diğeri ada atmosferiyle büyüler. Hangisi size uygun? İşte detaylı karşılaştırma:</p>

<h2>Genel Karakter</h2>
<ul>
<li><strong>Assos:</strong> 2.500 yıllık antik kent, taş köyler, saklı koylar, zeytinlikler. Doğa ve tarih iç içe.</li>
<li><strong>Bozcaada:</strong> Şarap bağları, rüzgâr, uzun kumsal plajlar, ada yaşamı. Adanın kendine özgü ritmi.</li>
</ul>

<h2>Ulaşım</h2>
<ul>
<li><strong>Assos:</strong> Arabayla doğrudan ulaşılır. <a href="blog?yazi=assosa-nasil-gidilir-ulasim-rehberi">İstanbul'dan 5-6 saat</a>. Feribot gerektirmez (Çanakkale geçişi hariç).</li>
<li><strong>Bozcaada:</strong> Geyikli'den feribot zorunlu (30 dk). Yaz aylarında kuyruk olabilir.</li>
<li><strong>İkisi birden:</strong> Assos'tan Bozcaada'ya sahil yoluyla 65 km — aynı tatilde ikisini de görebilirsiniz!</li>
</ul>

<h2>Deniz ve Plajlar</h2>
<ul>
<li><strong>Assos:</strong> Çakıl koylar — Kadırga, Sivrice, Sokakağzı. Berrak ama serin su. <a href="blog?yazi=assos-koy-plaj-rehberi">Koy rehberimiz →</a></li>
<li><strong>Bozcaada:</strong> Kumsal plajlar — Ayazma, Habbele. Rüzgârlı ama geniş sahiller.</li>
</ul>

<h2>Konaklama</h2>
<ul>
<li><strong>Assos:</strong> Taş köy evleri, butik pansiyonlar, kamp. Daha uygun fiyatlı. <a href="blog?yazi=assos-nerede-kalinir-konaklama">Konaklama rehberi →</a></li>
<li><strong>Bozcaada:</strong> Butik oteller, bağ evleri. Genellikle daha pahalı, özellikle yaz aylarında.</li>
</ul>

<h2>Yeme İçme</h2>
<ul>
<li><strong>Assos:</strong> Taze balık, zeytinyağlı Ege mutfağı, köy kahvaltısı. <a href="blog?yazi=assos-yerel-lezzetler-ne-yenir">Lezzet rehberimiz →</a></li>
<li><strong>Bozcaada:</strong> Şarap kültürü, deniz ürünleri, ada meyhaneleri. Şarap tadımı ön planda.</li>
</ul>

<h2>Kültür ve Tarih</h2>
<ul>
<li><strong>Assos:</strong> ⭐ Burada açık ara önde. MÖ 6. yüzyıl Athena Tapınağı, antik tiyatro, nekropol, 3.200 metre sur. Aristoteles'in yaşadığı yer. <a href="blog?yazi=assos-antik-kenti-gezi-rehberi">Antik kent rehberi →</a></li>
<li><strong>Bozcaada:</strong> Bozcaada Kalesi (Venedik/Osmanlı), Rum mahallesi, şarap müzeleri.</li>
</ul>

<h2>Fiyat Karşılaştırması</h2>
<ul>
<li><strong>Konaklama:</strong> Assos %20-30 daha uygun</li>
<li><strong>Yemek:</strong> Benzer fiyatlar, Assos'ta köy mekanları daha uygun</li>
<li><strong>Ulaşım:</strong> Assos daha ekonomik (feribot masrafı yok)</li>
</ul>

<h2>Kime Hangisi Uygun?</h2>
<ul>
<li><strong>Tarih meraklıları:</strong> Assos</li>
<li><strong>Şarap severler:</strong> Bozcaada</li>
<li><strong>Doğa ve huzur:</strong> Assos</li>
<li><strong>Ada atmosferi:</strong> Bozcaada</li>
<li><strong>Bütçe dostu:</strong> Assos</li>
<li><strong>Aileler:</strong> İkisi de uygun</li>
<li><strong>Fotoğrafçılar:</strong> Assos (antik yapılar + koylar)</li>
</ul>

<h2>En İyi Tavsiye: İkisini Birleştirin!</h2>
<p>Assos ve Bozcaada birbirine çok yakın. 4-5 günlük bir tatilde 2-3 gün Assos, 1-2 gün Bozcaada planlayarak ikisinin de tadını çıkarabilirsiniz. Assos'tan Babakale üzerinden sahil yolunu takip ederek Bozcaada feribotuna ulaşmak başlı başına bir gezi rotasıdır.</p>

<p><a href="planla.html">Gezinizi planlayın →</a> | <a href="blog?yazi=assosta-gezilecek-10-yer">Assos'ta 10 yer →</a></p>
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
  console.log('🎉 5 yeni yazı eklendi! Toplam 15 blog yazısı.');
})();
