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
    intro: "Assos'ta konaklama arıyorsanız, Behramkale'nin antik surları arasındaki tarihi taş otellerden Kadırga Koyu'na bakan butik pansiyonlara uzanan geniş bir yelpazeye sahipsiniz. Adatepe'nin zeytinlikleri arasındaki yayla evlerinden Babakale'nin deniz manzaralı otellerine, her bütçeye uygun pansiyon, villa ve otel seçenekleri — fiyat, konum, manzara ve misafir yorumlarıyla karşılaştırabileceğiniz Assos otel rehberi. İletişim bilgileri, çalışma saatleri ve yol tarifiyle birlikte Assos konaklama rezervasyonunuzu tek sayfadan planlayın.",
    faqs: [
      { q: "Assos'ta konaklama nasıl, nerelerde kalınır?", a: "Assos'ta konaklama Behramkale taş ev pansiyonları, Kadırga Koyu butik otelleri, Babakale deniz manzaralı pansiyonlar ve Adatepe yayla evleri gibi farklı bölgelere yayılmıştır. Her bütçe ve tarzda konaklama seçeneği bulunur." },
      { q: "Assos'a nasıl gidilir?", a: "Assos'a İstanbul'dan yaklaşık 5 saat, Ankara'dan 7 saat sürer. Çanakkale'den kara yoluyla 1.5 saat mesafededir. Küçükkuyu veya Ezine üzerinden otobüsle de ulaşım mümkündür." },
      { q: "Assos otel fiyatları ne kadar?", a: "Sezona ve otel tipine göre değişir. Ekonomik pansiyonlar 1500-3000 TL, butik oteller 3500-7000 TL, lüks konaklama 7000 TL üstü aralığındadır. Hafta sonu ve yaz aylarında fiyatlar yükselir." },
      { q: "Assos'ta deniz manzaralı otel var mı?", a: "Evet. Kadırga Koyu, Sivrice ve Babakale bölgesindeki oteller doğrudan Ege manzaralıdır. Behramkale tepesinden de antik liman ve deniz görünür; tepe otellerinde panoramik manzara keyfi vardır." },
      { q: "Assos'ta hangi mevsimde konaklamak daha uygun?", a: "Mayıs-Haziran ve Eylül-Ekim en ideal aylardır — hava ılıman, kalabalık azdır. Temmuz-Ağustos yoğun sezondur, rezervasyon en az 2-3 hafta önce yapılmalıdır." }
    ]
  },
  kafeler: {
    id: 'kafe', emoji: '☕', plural: 'Kafeler', heroPlural: 'Kafeleri', color: '#C4521A',
    eyebrow: "Assos Kafe Rehberi",
    heroSub: "Manzaralı oturumlar, ev yapımı tatlılar ve gerçek Ege kahvesi — Assos kafeleri tek sayfada.",
    heroChips: ['Deniz Manzarası', 'Asma Altı', 'Gün Batımı', 'Ev Yapımı Tatlı', 'Behramkale', 'Köy Kahvesi'],
    title: "Assos Kafeleri — Deniz Manzarası & Kahve Molası Rehberi | Assos'u Keşfet",
    desc: "Assos kafeleri: Behramkale asma altı kahveci, Kadırga deniz manzaralı cafe, Adatepe köy kafeleri. Çalışma saatleri, konum ve menüyle Assos kafe rehberi.",
    intro: "Assos'un en iyi kafeleri, Behramkale'nin taş döşeli sokaklarından Kadırga Koyu'nun deniz kenarına uzanan benzersiz bir coğrafyaya yayılmış. Asma altı avluları, gün batımı teraslı butik kafeleri, Ege kahvesi ve ev yapımı tatlılar sunan köy işletmeleri — her ruh haline uygun bir Assos kafe adresi burada. Çalışma saatleri, konumları ve menü detaylarıyla Behramkale, Adatepe ve çevre köylerdeki kafeleri keşfedin; kahve molanızı Assos'un tarihi dokusuyla birleştirin.",
    faqs: [
      { q: "Assos kafeleri kaç arası açık?", a: "Sezonda genelde 08:00-24:00 arası açıktır. Kış aylarında bazı kafeler 20:00-22:00 civarı kapanır. Tatil günleri ve hafta sonları açık saatler uzayabilir." },
      { q: "Assos'ta deniz manzaralı kafe var mı?", a: "Evet. Kadırga Koyu, Sivrice ve Behramkale tepesi bölgesindeki kafeler Ege manzarasına sahiptir. Özellikle gün batımı saatlerinde büyük ilgi görürler." },
      { q: "Behramkale'de kafe nerelerde bulunur?", a: "Behramkale köy meydanında geleneksel taş ev kafeleri, Athena Tapınağı yolundaki manzara kafeleri ve asma altı avlu kafeleri yoğunlaşır. Taş sokaklarda gezerken kolayca görülür." },
      { q: "Assos kafelerinde kahvaltı yapılır mı?", a: "Bazı kafeler serpme köy kahvaltısı sunar — özellikle Behramkale ve Adatepe'deki köy kafeleri. Genelde 09:00-13:00 arası kahvaltı servisi yapılır." },
      { q: "Assos'ta gün batımı izlenebilecek kafe var mı?", a: "Evet. Behramkale tepesindeki kafeler ve Kadırga Koyu'na bakan teraslı mekanlar gün batımı için idealdir. Yaz aylarında saat 19:30-20:30 arası popülerdir, erken masa ayırtmak önerilir." }
    ]
  },
  restoranlar: {
    id: 'restoran', emoji: '🍽', plural: 'Restoranlar', heroPlural: 'Restoranları', color: '#1A6B8A',
    eyebrow: "Assos Restoran Rehberi",
    heroSub: "Taze balık, mezeli akşamlar ve Ege mutfağı — Assos'un en iyi restoranları.",
    heroChips: ['Balık Restoranı', 'Ege Mutfağı', 'Mezeli Akşam', 'Deniz Kenarı', 'Antik Liman', 'Köy Lokantası'],
    title: "Assos Restoranları — Balık & Ege Mutfağı Rehberi | Assos'u Keşfet",
    desc: "Assos restoranları: antik liman balık lokantaları, Behramkale mezeli akşam yemeği, Kadırga deniz manzaralı restoranlar. Menü ve iletişimle restoran rehberi.",
    intro: "Assos restoranları, antik liman'ın taş rıhtımındaki balık lokantalarından Behramkale köy evlerinin avlusunda servis edilen mezeli akşam yemeklerine kadar geniş bir Ege mutfağı deneyimi sunuyor. Kadırga Koyu'nun deniz manzaralı restoranları, geleneksel Assos zeytinyağı ile hazırlanan ot yemekleri, taze tutulmuş balık çeşitleri ve yerel üretim şarabı — akşam yemeği planınızı konum, menü ve fiyat bilgileriyle birlikte yapın. Assos'ta en iyi restoranlar, çalışma saatleri ve iletişim bilgileriyle tek sayfada.",
    faqs: [
      { q: "Assos'ta hangi yemekler meşhurdur?", a: "Ege mutfağının sevilen lezzetleri: taze balık (karagöz, mezgit, sardalya), zeytinyağlı ot yemekleri (kuzukulağı, şevketi bostan, deniz börülcesi), köy yoğurdu, Ege mezeleri ve Assos'a özgü zeytinyağı." },
      { q: "Assos restoranlarında rezervasyon gerekli mi?", a: "Hafta sonu ve yaz aylarında (özellikle Temmuz-Ağustos) rezervasyon şiddetle tavsiye edilir. Antik liman ve Kadırga bölgesindeki popüler restoranlar erken saatlerde dolabilir." },
      { q: "Antik liman'da yemek fiyatları ne kadar?", a: "Antik liman restoranlarında taze balık keyfi ortalama kişi başı 600-1200 TL aralığındadır. Meze tabakları, deniz ürünleri ve ana yemekle birlikte değişen tatlı menüleri de bulunur." },
      { q: "Assos'ta vejetaryen menü var mı?", a: "Ege mutfağı doğal olarak zeytinyağlı ot yemekleri ve mezelerle zengindir. Çoğu restoranda vejetaryen seçenekler bulunur; bazı köy lokantaları tamamen vegan menü de sunar." },
      { q: "Assos restoranları kaç arası açık?", a: "Öğle servisi 12:00-15:00, akşam servisi 18:00-23:00 arasıdır. Yaz aylarında kapanış 24:00'ü bulabilir. Bazı köy lokantaları öğle odaklı çalışır, akşam kapalıdır." }
    ]
  },
  kahvalti: {
    id: 'kahvalti', emoji: '🌞', plural: 'Kahvaltı', heroPlural: 'Kahvaltı Mekanları', color: '#8A5520',
    eyebrow: "Assos Kahvaltı Rehberi",
    heroSub: "Serpme köy kahvaltısı, ev yapımı reçel ve Ayvacık peyniri — Assos'un en iyi kahvaltı adresleri.",
    heroChips: ['Serpme Kahvaltı', 'Köy Kahvaltısı', 'Ev Yapımı Reçel', 'Zeytin & Peynir', 'Manzaralı', 'Ayvacık'],
    title: "Assos Kahvaltı Mekanları — Serpme Köy Kahvaltısı Rehberi | Assos'u Keşfet",
    desc: "Assos kahvaltı: Behramkale, Ahmetçe, Adatepe serpme köy kahvaltısı. Ev yapımı reçel, Ayvacık peyniri, taze fırın ekmeği. En iyi kahvaltı mekanları tek sayfada.",
    intro: "Assos'ta kahvaltı deneyimi, kadın kooperatiflerinin el emeği reçellerinden Ayvacık köylerinin taze peynirlerine kadar Ege'nin gerçek tatlarını sofranıza taşıyor. Behramkale, Ahmetçe ve Adatepe'nin serpme köy kahvaltısı sunan mekanları; taze fırın ekmeği, yöresel zeytin, ev yapımı tereyağı ve 15-20 çeşit sunumla güne başlamanın en doğru yolu. Assos kahvaltı mekanları, çalışma saatleri ve menü detaylarıyla birlikte — sabah kahvaltı planınızı buradan yapın.",
    faqs: [
      { q: "Assos'ta serpme köy kahvaltısı nerede yapılır?", a: "Behramkale, Ahmetçe, Adatepe ve Babakale köylerinde kadın kooperatifleri ve köy evlerinde serpme köy kahvaltısı servis edilir. 15-25 çeşit sunum ve ev yapımı ürünler yaygındır." },
      { q: "Assos kahvaltı fiyatları ne kadar?", a: "Serpme köy kahvaltısı kişi başı 400-800 TL aralığındadır. Mekana, menü çeşitliliğine ve bölgeye göre değişir. Hafta sonu ve sezon fiyatları daha yüksek olabilir." },
      { q: "Assos'ta kahvaltı için rezervasyon gerekli mi?", a: "Özellikle hafta sonları ve tatil günlerinde rezervasyon önerilir. Sabah 08:00-09:00 arası yer bulmak kolay; 10:00 sonrası popüler mekanlar dolar." },
      { q: "Assos kahvaltı saatleri nedir?", a: "Kahvaltı servisi genelde 07:30-13:00 arası verilir. Bazı mekanlar 14:00'e kadar servis yapar. Öğle sonrası kahvaltı bulmak zor, brunch'a kayan menüler olabilir." },
      { q: "Kadın kooperatifi kahvaltısı nedir, nerede yapılır?", a: "Ayvacık köylerindeki kadın kooperatifleri; yerel kadınların el emeği reçeli, köy peyniri, organik zeytini ve ev yapımı ürünleriyle hazırladığı kahvaltıları sunar. Hem sosyal dayanışma hem Ege lezzetleri bir arada." }
    ]
  },
  plajlar: {
    id: 'beach', emoji: '🏖', plural: 'Plajlar', heroPlural: 'Plajları', color: '#1A9A8A',
    eyebrow: "Assos Plaj & Koy Rehberi",
    heroSub: "Berrak koylar, ince çakıllı sahiller ve Ege'nin en güzel mavisi — Assos plajları.",
    heroChips: ['Berrak Koy', 'Çakıl Plaj', 'Beach Club', 'Gizli Koy', 'Kadırga', 'Sivrice'],
    title: "Assos Plajları — Kadırga, Sivrice & Beach Club Rehberi | Assos'u Keşfet",
    desc: "Assos plajları: Kadırga Koyu berrak sular, Sivrice çakıl plaj, gizli koylar ve beach club'lar. Şemsiye, yeme-içme ve ulaşım bilgileriyle plaj rehberi.",
    intro: "Assos plajları, Kadırga Koyu'nun ünlü berrak sularından Sivrice Plajı'nın ince çakıllarına, Türkiye'nin en temiz Ege sahillerini barındırıyor. Sokakağzı Koyu'nun sakinliğinden Kaleiçi Beach Club'ın konforuna, gizli koylardan çocuklu aileye uygun sığ plajlara — her tatil zevkine uygun Assos koyu ve plajı. Plaj girişleri, şemsiye-şezlong fiyatları, yeme-içme olanakları ve ulaşım bilgileriyle tatilinizi buradan planlayın. Assos'ta denize girilecek en iyi yerler tek listede.",
    faqs: [
      { q: "Assos'ta en iyi plaj hangisi?", a: "Kadırga Koyu berrak suları ve ince çakıllarıyla en popüler plajdır. Sivrice kumsalı aileler için uygundur. Sokakağzı ve gizli koylar sakinlik arayanlar için idealdir." },
      { q: "Assos plajlarına nasıl gidilir?", a: "Kadırga Koyu Behramkale'den 5 km, Sivrice 8 km mesafededir. Sahil yolundan araçla kolayca ulaşılır; yaz aylarında dolmuş seferleri de bulunur. Park yeri genelde sınırlıdır." },
      { q: "Assos'ta ücretsiz plaj var mı?", a: "Evet. Kadırga Koyu'nun bir kısmı, Sivrice halk plajı ve ulaşılabilen gizli koylar ücretsizdir. Beach club'lar ücretli olup şemsiye-şezlong ve servis sunar." },
      { q: "Assos beach club fiyatları ne kadar?", a: "Şezlong-şemsiye paketi kişi başı 300-800 TL aralığındadır. Bazı beach club'larda yiyecek-içecek zorunluluğu veya minimum harcama uygulaması olabilir; fiyatlar sezona göre değişir." },
      { q: "Çocuklu aileye uygun plaj nerede?", a: "Sivrice ve Kadırga'nın sığ kısımları çocuklu ailelere uygundur. Beach club'larda çocuk havuzu, oyun alanı ve aile konseptli bölümler bulunabilir; dalga az olduğundan güvenli yüzme imkanı sunarlar." }
    ]
  },
  iskeleler: {
    id: 'iskele', emoji: '⚓', plural: 'İskeleler', heroPlural: 'İskeleleri', color: '#3A5A8A',
    eyebrow: "Assos Tarihi İskeleler",
    heroSub: "Balıkçı tekneleri, gün batımı turları ve Ege'nin rüzgârı — Assos iskeleleri.",
    heroChips: ['Balıkçı Limanı', 'Tekne Turu', 'Gün Batımı', 'Antik Liman', 'Babakale', 'Ahmetçe'],
    title: "Assos İskeleleri — Antik Liman & Balıkçı Limanı Rehberi | Assos'u Keşfet",
    desc: "Assos iskeleleri: antik liman, Babakale balıkçı iskelesi, Ahmetçe sakin koy. Tekne turu, balık mekanları ve tarihi rıhtım ulaşımıyla iskele rehberi.",
    intro: "Assos iskeleleri, antik çağdan bu yana Ege'nin ticaret ve balıkçılık merkezi olan bu bölgenin denizle olan köklü bağını yaşıyor. Antik liman'ın tarihi taş rıhtımından Babakale balıkçı iskelesine, Ahmetçe'nin sakin limanından gün batımı teknelerine kadar — her iskele Assos'un farklı bir hikayesini anlatıyor. Tekne turları, taze balık mekanları, manzara noktaları ve iskele kafeleri; konum ve ulaşım bilgileriyle birlikte Assos'un deniz kapılarını keşfedin.",
    faqs: [
      { q: "Assos antik limanı nerede, nasıl ulaşılır?", a: "Antik liman Behramkale köyünün altında, tarihi surların dibindedir. Köyden aşağı inen taş yoldan yürüyerek 15 dakikada veya araçla 10 dakikada ulaşılır. Yol eğimlidir." },
      { q: "Assos iskelelerinden tekne turu var mı?", a: "Antik liman ve Babakale iskelelerinden tekne turları düzenlenir. Gün batımı turları, koy turları ve balık tutma aktiviteleri yaz aylarında yaygındır; rezervasyon önerilir." },
      { q: "Babakale iskelesi görülmeye değer mi?", a: "Evet. Babakale Türkiye'nin en batısındaki yerleşim olarak tarihi Osmanlı kalesi ve sakin balıkçı iskelesine sahiptir. Taze balık, otantik köy dokusu ve deniz manzarası sunar." },
      { q: "Gün batımı için hangi iskele en güzel?", a: "Behramkale antik limanı ve Babakale iskelesi gün batımı manzarası için ideal noktalardır. İlkbahar ve sonbahar ayları fotoğraf için mükemmel ışık sunar; saat 19:00-20:30 arası altın saat." },
      { q: "Ahmetçe iskelesi açık mı, ziyaret edilebilir mi?", a: "Ahmetçe küçük bir sahil köyüdür ve sakin iskelesi ziyarete açıktır. Yerel balıkçılarla sohbet, taze balık almak ve sessiz bir günbatımı için ideal; kalabalığa uzak bir alternatif." }
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

  // Intro section HTML (hero'dan sonra insert edilecek)
  // Emoji aria-label ile accessibility uyumlu
  const introHtml = `
<section class="mk-hub-intro" style="background:linear-gradient(180deg,#FAF7F2 0%,#F5EDE0 100%);padding:56px 24px;border-bottom:1px solid rgba(26,39,68,.06)">
  <div style="max-width:820px;margin:0 auto;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:20px">
      <span style="width:32px;height:1px;background:${c.color}"></span>
      <span style="font-size:2.2rem" role="img" aria-label="${escapeHtml(c.plural)}">${c.emoji}</span>
      <span style="width:32px;height:1px;background:${c.color}"></span>
    </div>
    <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.02rem;line-height:1.85;color:#4A5568;margin:0;letter-spacing:-.002em">${escapeHtml(c.intro)}</p>
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
        <details style="background:#FAF7F2;border:1px solid rgba(26,39,68,.06);border-radius:14px;padding:0;overflow:hidden;transition:all .2s"${i === 0 ? ' open' : ''}>
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
    // Hero alt metin
    .on('.mk-hero-sub', { element(el) { el.setInnerContent(c.heroSub); } })
    // Hero chip'leri
    .on('#mk-hero-cats', { element(el) { el.setInnerContent(chipsHtml, { html: true }); } })
    // Istatistik karti gizle (sadece /mekanlar'da gorunsun)
    .on('.mk-hero-card', { element(el) { el.setAttribute('style', 'display:none'); } })
    // Hero section'dan sonra intro + FAQ section insert et
    .on('.mk-hero', { element(el) { el.after(introHtml + faqHtml, { html: true }); } })
    // Body'e hub flag
    .on('body', { element(el) { el.setAttribute('data-hub-cat', catId); } })
    .transform(response);
}
