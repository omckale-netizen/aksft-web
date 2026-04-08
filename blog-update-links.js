// Blog yazılarına internal link eklemek için admin panelde Console'a yapıştırın
// Admin panele giriş yaptıktan sonra F12 → Console → bu kodu yapıştırıp Enter

(async function() {
  const db = firebase.firestore();
  const updates = {
    'assosta-gezilecek-10-yer': {
      content: `
<h2>1. Athena Tapınağı</h2>
<p><a href="yerler.html">Behramkale'nin tepesinde</a>, Ege Denizi'ne hâkim konumda yükselen Athena Tapınağı, MÖ 530 yılında inşa edilmiştir. Anadolu'da yapılan ilk ve tek Dor düzenindeki tapınak olma özelliğini taşır. Gün batımında burada olmak, Assos deneyiminin zirvesidir — Midilli Adası'nın silueti eşliğinde gökyüzünün turuncu ve mora boyanışını izleyebilirsiniz.</p>
<blockquote>İpucu: Gün batımından 1 saat önce çıkın. Hem tapınağı rahat gezin hem de en iyi manzara noktasını kapmış olun.</blockquote>

<h2>2. Assos Antik Limanı</h2>
<p>Binlerce yıllık tarihe sahip antik liman, bugün hâlâ balıkçı teknelerine ev sahipliği yapıyor. Taş rıhtımda yürürken bir yanda tarihi yapılar, diğer yanda berrak Ege suları sizi karşılar. Limandaki küçük <a href="mekanlar.html">kafeler ve restoranlar</a>, deniz ürünleri ile ünlüdür.</p>

<h2>3. Kadırga Koyu</h2>
<p>Assos'un en sevilen plajı olan Kadırga Koyu, kristal berraklığında turkuaz suyu ve zeytinliklerle çevrili doğal güzelliğiyle büyüler. Yaz aylarında kalabalık olabilir; sabah erken saatlerde gitmek en huzurlu deneyimi sunar. <a href="blog?yazi=assos-koy-plaj-rehberi">Tüm koylar hakkında detaylı rehberimizi okuyun →</a></p>

<h2>4. Behramkale Köyü</h2>
<p>Osmanlı döneminden kalma taş evleri, dar sokakları ve otantik dokusuyla Behramkale, zamanın durduğu bir köydür. Köy meydanındaki çınar ağacının altında bir çay molası vermeyi unutmayın. <a href="blog?yazi=assos-koylari-rehberi">Köy köy Assos rehberimize göz atın →</a></p>

<h2>5. Adatepe Köyü</h2>
<p>Kaz Dağları eteklerinde, deniz manzaralı bir tepe köyü. Taş evleri restore edilerek butik otellere ve <a href="mekanlar.html">kafelere</a> dönüştürülmüştür. Adatepe Zeytinyağı Müzesi de burada bulunur — bölgenin en kaliteli zeytinyağı üretimini yakından görebilirsiniz.</p>

<h2>6. Sivrice Koyu</h2>
<p>Assos'un batısında, doğal güzelliğini koruyan sakin bir koy. Berrak suyu ve az kalabalık yapısıyla huzur arayanların favorisidir. Küçük bir restoran ve birkaç çadır alanı dışında yapılaşma yoktur.</p>

<h2>7. Apollon Smintheion</h2>
<p>Gülpınar'da bulunan bu antik tapınak, farelerle ilişkilendirilen Apollon'a adanmıştır. İyi korunmuş sütunları ve açık hava müzesi ile Assos çevresinin önemli <a href="yerler.html">arkeolojik alanlarından</a> biridir.</p>

<h2>8. Babakale</h2>
<p>Anadolu'nun en batı noktası! 18. yüzyıldan kalma Osmanlı kalesi ve küçük limanıyla pittoresk bir <a href="koyler.html">köy</a>. Gün batımını burada izlemek, tam anlamıyla "Türkiye'nin son gün batımı" demektir.</p>

<h2>9. Sokakağzı Koyu</h2>
<p>Babakale yolu üzerinde, adını köyden alan bu koy son yıllarda popülerlik kazandı. Doğal yapısı büyük ölçüde korunmuş olup, denizi hem yüzmek hem dalış yapmak için idealdir.</p>

<h2>10. Yeşil Liman</h2>
<p>Adından da anlaşılacağı gibi çam ve zeytin ağaçlarıyla çevrili yeşil bir koy. Tekne ile ulaşım da mümkündür. Sakinliğiyle Assos'un en gizli cennetlerinden biridir.</p>

<h2>Sonuç</h2>
<p>Assos, sadece bir antik kent değil — koyları, köyleri, doğası ve mutfağıyla başlı başına bir keşif bölgesidir. İster 1 günlük ister 1 haftalık bir gezi planlayın, bu 10 yer listenizin başında olsun. <a href="planla.html">Gezinizi hemen planlayın →</a></p>
<p>Tüm bu noktaları <a href="harita.html">interaktif haritamızda</a> görebilir ve yol tarifi alabilirsiniz.</p>
      `
    },
    'assosa-nasil-gidilir-ulasim-rehberi': {
      content: `
<h2>Assos Nerede?</h2>
<p>Assos (Behramkale), Çanakkale'nin Ayvacık ilçesine bağlı tarihi bir köydür. Ege Denizi kıyısında, Midilli Adası'nın tam karşısında yer alır. Ayvacık'a 17 km, Çanakkale'ye 84 km mesafededir. <a href="harita.html">Haritada konumunu görün →</a></p>

<h2>Arabayla Gitmek</h2>
<p>İstanbul'dan Assos'a arabayla gitmek için Çanakkale Boğazı'nı feribot ile geçmeniz gerekir. Üç feribot hattı mevcuttur:</p>
<ul>
<li><strong>Gelibolu – Lapseki:</strong> 20 dakika</li>
<li><strong>Eceabat – Çanakkale:</strong> 15 dakika</li>
<li><strong>Kilitbahir – Çanakkale:</strong> 7 dakika</li>
</ul>
<p>Boğazı geçtikten sonra Ezine – Ayvacık üzerinden yaklaşık 1 saatte Assos'a ulaşırsınız.</p>
<blockquote>İpucu: Yaz aylarında feribot kuyrukları uzun olabiliyor. Sabah erken veya akşam geç saatlerde geçiş yapmanızı öneriyoruz.</blockquote>

<h3>Mesafeler</h3>
<ul>
<li>İstanbul – Assos: 427 km (6-7 saat)</li>
<li>İzmir – Assos: 290 km (3-4 saat)</li>
<li>Ankara – Assos: 650 km (7-8 saat)</li>
<li>Çanakkale – Assos: 84 km (1 saat)</li>
</ul>

<h2>Otobüsle Gitmek</h2>
<p>Büyük şehirlerden Assos'a direkt otobüs seferi yoktur. Truva Turizm, Kamil Koç veya Metro ile Ayvacık, Küçükkuyu veya Altınoluk'a gelin. Buradan saatte bir kalkan minibüslerle veya taksiyle Assos'a ulaşabilirsiniz.</p>

<h2>Uçakla Gitmek</h2>
<p>En yakın iki havalimanı:</p>
<ul>
<li><strong>Çanakkale Havalimanı:</strong> 84 km (İstanbul'dan günlük seferler)</li>
<li><strong>Edremit/Koca Seyit Havalimanı:</strong> 63 km (İstanbul ve Ankara'dan seferler)</li>
</ul>
<p>Havalimanından minibüs veya kiralık araç ile Assos'a ulaşabilirsiniz.</p>

<h2>En İyi Zaman</h2>
<p>Assos'u ziyaret etmek için en ideal dönem <strong>Mayıs-Haziran</strong> ve <strong>Eylül-Ekim</strong> aylarıdır. Hava güzel, deniz yüzmeye uygun ve kalabalık yaz aylarına göre çok daha sakin olur.</p>

<h2>Varınca Ne Yapmalı?</h2>
<p>Assos'a vardığınızda ilk olarak <a href="blog?yazi=assosta-gezilecek-10-yer">mutlaka görmeniz gereken 10 yeri</a> keşfedin. <a href="blog?yazi=assos-en-iyi-kahvalti-mekanlari">Kahvaltı mekanlarımıza</a> göz atın ve <a href="rotalar.html">hazır rotalarımızdan</a> birini seçerek gezinize başlayın.</p>
      `
    },
    'assos-en-iyi-kahvalti-mekanlari': {
      content: `
<h2>Assos'ta Kahvaltı Kültürü</h2>
<p>Assos bölgesi, Ege mutfağının en otantik tatlarını sunar. Taze zeytinyağı, köy peyniri, otlar, bal ve ev yapımı reçeller — kahvaltı masaları adeta bir şölen. Deniz manzarası eşliğinde yapılan kahvaltı ise ayrı bir deneyimdir.</p>

<h2>Neden Assos'ta Kahvaltı Özel?</h2>
<ul>
<li><strong>Yerel ürünler:</strong> Adatepe zeytinyağı, Ezine peyniri, kekik balı</li>
<li><strong>Manzara:</strong> Ege'ye bakan teraslar, antik liman manzarası</li>
<li><strong>Otantik ortam:</strong> Taş evlerde, bahçelerde, zeytinliklerde kahvaltı</li>
</ul>

<h2>Kahvaltı İçin En İyi Mekanlar</h2>

<h3>Behramkale Köyü</h3>
<p><a href="koyler.html">Köyün tepesinde</a>, Athena Tapınağı'na yürüme mesafesinde birçok kahvaltı mekanı bulunur. Taş evlerin bahçelerinde, zeytin ağaçları altında serpme kahvaltı keyfi yaşayabilirsiniz. <a href="mekanlar.html">Tüm mekanlarımızı inceleyin →</a></p>

<h3>Antik Liman Çevresi</h3>
<p>Limanın hemen üstündeki mekanlar, deniz manzarası eşliğinde kahvaltı sunar. Balık tutarak sabahı geçiren balıkçıları izlerken kahvaltınızı yapabilirsiniz.</p>

<h3>Kadırga Koyu</h3>
<p>Koydaki küçük tesisler, denizin hemen yanında kahvaltı imkânı sunar. <a href="blog?yazi=assos-koy-plaj-rehberi">Kadırga ve diğer koylar hakkında rehberimizi okuyun →</a></p>

<h2>Assos Kahvaltısında Olmazsa Olmazlar</h2>
<ul>
<li>Soğuk sıkım Adatepe zeytinyağı</li>
<li>Ezine tulum peyniri</li>
<li>Kekik ve çam balı</li>
<li>Yerel otlar (kekik, nane, dereotu)</li>
<li>Ev yapımı domates-biber salçası</li>
<li>Taze simit veya köy ekmeği</li>
</ul>

<blockquote>İpucu: Hafta sonları mekanlar dolabiliyor. Özellikle yaz aylarında 09:00 öncesi gitmenizi öneriyoruz.</blockquote>

<p>Kahvaltıdan sonra günün geri kalanını <a href="blog?yazi=assosta-gezilecek-10-yer">en güzel 10 yeri keşfederek</a> geçirebilir veya <a href="blog?yazi=assos-koylari-rehberi">köy köy Assos turuna</a> çıkabilirsiniz.</p>
      `
    },
    'assos-koylari-rehberi': {
      content: `
<h2>Assos'un Taş Köyleri</h2>
<p>Ayvacık ilçesine bağlı köyler, Osmanlı ve Rum mimarisinin izlerini taşıyan taş yapılarıyla ünlüdür. Dar sokakları, taş duvarları ve çiçekli avluları ile zaman yolculuğuna çıkarsınız. İşte keşfetmeniz gereken 5 köy — hepsini <a href="koyler.html">köyler sayfamızda</a> detaylıca inceleyebilirsiniz:</p>

<h2>1. Behramkale (Assos)</h2>
<p>Antik kentin kurulduğu köy, Assos'un kalbidir. Tepedeki <a href="yerler.html">Athena Tapınağı</a>, alttaki antik liman ve aradaki taş sokaklar — köyün kendisi açık hava müzesi gibidir. Osmanlı dönemi camileri ve Rum taş evleri bir arada yaşar.</p>

<h2>2. Adatepe</h2>
<p>Kaz Dağları eteklerinde, denize tepeden bakan Adatepe, köy turizmi için mükemmeldir. Restore edilmiş taş evlerde butik oteller ve <a href="mekanlar.html">kafeler</a> bulunur. Adatepe Zeytinyağı Müzesi, bölgenin en kaliteli zeytinyağı üretimini anlatır.</p>
<blockquote>İpucu: Adatepe'de gün batımı, Assos tepesiyle yarışır güzellikte.</blockquote>

<h2>3. Kayalar</h2>
<p>Küçük ve sakin bir köy olan Kayalar, taş evleri ve doğal dokusuyla dikkat çeker. Köyde birkaç butik pansiyon ve ev restoranı bulunur. Sessizlik arayanlar için ideal bir kaçış noktasıdır.</p>

<h2>4. Babakale</h2>
<p>Anadolu'nun en batı ucundaki köy! 18. yüzyıldan kalma Osmanlı kalesi, küçük limanı ve rengarenk balıkçı tekneleri ile pittoresk bir atmosfer sunar. "Türkiye'de güneşin en son battığı yer" unvanını taşır.</p>

<h2>5. Büyükhusun</h2>
<p>Daha az bilinen ama keşfedilmeyi bekleyen bir köy. Taş evleri, zeytinlikleri ve sakin atmosferiyle butik turizm açısından parlayan bir destinasyondur.</p>

<h2>Köy Rotası Önerisi</h2>
<p>Bir günde tüm köyleri gezmek mümkündür. <a href="rotalar.html">Hazır rotalarımızdan</a> "Köy Köy Assos" rotasını seçebilirsiniz:</p>
<ul>
<li>Sabah: Behramkale (tapınak + <a href="blog?yazi=assos-en-iyi-kahvalti-mekanlari">kahvaltı</a>)</li>
<li>Öğle: Adatepe (müze + öğle yemeği)</li>
<li>Öğleden sonra: Kayalar + Büyükhusun</li>
<li>Akşam: Babakale (gün batımı)</li>
</ul>
<p>Toplam mesafe yaklaşık 60 km — arabayla 1.5 saat sürer, ancak her durakta vakit geçirmek için tam bir gün ayırmanızı öneriyoruz.</p>
<p>Tüm köyleri ve durakları <a href="harita.html">interaktif haritamızda</a> görün ve yol tarifi alın.</p>
      `
    },
    'assos-koy-plaj-rehberi': {
      content: `
<h2>Assos'ta Deniz Keyfi</h2>
<p>Kuzey Ege'nin en berrak sularına sahip Assos bölgesi, irili ufaklı koyları ve doğal plajlarıyla yüzme tutkunları için cennet gibidir. Behramkale'den Babakale'ye uzanan kıyı şeridinde keşfedilecek birçok koy bulunur. Tüm koyları <a href="yerler.html">yerler sayfamızda</a> detaylıca inceleyebilirsiniz.</p>

<h2>Kadırga Koyu</h2>
<p>Assos'un en popüler ve en erişilebilir koyu. Kristal berraklığında mavi-yeşil suyu, ince çakıl sahili ve arka planda uzanan zeytinlikleriyle gerçek bir Ege güzelliği sunar. Araçla kolayca ulaşılabilir ve çeşitli <a href="mekanlar.html">konaklama ve kafe seçenekleri</a> mevcuttur.</p>
<ul>
<li><strong>Su:</strong> Berrak, turkuaz</li>
<li><strong>Zemin:</strong> İnce çakıl</li>
<li><strong>Tesis:</strong> Şezlong, restoran, duş</li>
<li><strong>Uygun:</strong> Aileler, çiftler</li>
</ul>

<h2>Sivrice Koyu</h2>
<p>Babakale yönünde, doğal yapısını büyük ölçüde korumuş sakin bir koy. Son yıllarda popülerleşse de hâlâ görece sakin ve bakir. Berrak suyu ve kayalık yapısı dalış için de uygundur.</p>

<h2>Sokakağzı Koyu</h2>
<p>Babakale yolu üzerinde, küçük bir <a href="koyler.html">köyün</a> altında yer alan koy. Doğal güzelliği korunmuş, yapılaşma minimumdur. Kamp yapmak isteyenler için de uygun alanlar mevcuttur.</p>

<h2>Yeşil Liman</h2>
<p>Adını çevreleyen çam ve zeytin ağaçlarından alan bu koy, Assos'un en gizli cennetlerinden biridir. Tekne ile de ulaşılabilir. Neredeyse hiç kalabalık olmayan, doğayla başbaşa kalabileceğiniz bir nokta.</p>

<h2>Assos Antik Liman</h2>
<p>Tarihi limanın kayalık kıyısında da yüzmek mümkündür. Ancak 2021'den itibaren bazı kısımlara erişim kısıtlanmıştır. Yine de küçük platformlardan denize girebilirsiniz.</p>

<h2>Hangi Koy Size Uygun?</h2>
<ul>
<li><strong>Aile tatili:</strong> Kadırga Koyu (tesis var, erişim kolay)</li>
<li><strong>Huzur arayanlar:</strong> Sivrice veya Yeşil Liman</li>
<li><strong>Macera severler:</strong> Sokakağzı veya tekne ile koylar</li>
<li><strong>Tarih + deniz:</strong> Antik Liman</li>
</ul>

<blockquote>İpucu: Tüm koylarda deniz ayakkabısı bulundurmanızı öneriyoruz — zemin genellikle çakıl ve kayalıktır.</blockquote>

<p>Koyların konumlarını <a href="harita.html">interaktif haritamızda</a> görebilir ve yol tarifi alabilirsiniz. Assos'ta neler yapılabileceğini merak ediyorsanız <a href="blog?yazi=assosta-gezilecek-10-yer">en iyi 10 yer rehberimize</a> göz atın.</p>
<p><a href="blog?yazi=assosa-nasil-gidilir-ulasim-rehberi">Assos'a nasıl gidilir?</a> rehberimizle yolculuğunuzu planlayın.</p>
      `
    }
  };

  for (const [id, data] of Object.entries(updates)) {
    try {
      await db.collection('blog_posts').doc(id).update(data);
      console.log('✅ Güncellendi: ' + id);
    } catch(err) {
      console.error('❌ Hata (' + id + '): ' + err.message);
    }
  }
  console.log('🎉 Tüm yazılar internal linklerle güncellendi!');
})();
