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
    title: "Assos Otelleri — Butik Pansiyon, Taş Ev, Deniz Manzaralı Konaklama | Assos'u Keşfet",
    desc: "Assos'ta konaklama: Behramkale tarihi taş otelleri, Kadırga butik pansiyonlar, Babakale deniz manzaralı oteller. Fiyat, konum, iletişim ve yol tarifiyle Assos otel rehberi.",
    intro: "Assos'ta konaklama arıyorsanız, Behramkale'nin antik surları arasındaki tarihi taş otellerden Kadırga Koyu'na bakan butik pansiyonlara uzanan geniş bir yelpazeye sahipsiniz. Adatepe'nin zeytinlikleri arasındaki yayla evlerinden Babakale'nin deniz manzaralı otellerine, her bütçeye uygun pansiyon, villa ve otel seçenekleri — fiyat, konum, manzara ve misafir yorumlarıyla karşılaştırabileceğiniz Assos otel rehberi. İletişim bilgileri, çalışma saatleri ve yol tarifiyle birlikte Assos konaklama rezervasyonunuzu tek sayfadan planlayın."
  },
  kafeler: {
    id: 'kafe', emoji: '☕', plural: 'Kafeler', heroPlural: 'Kafeleri', color: '#C4521A',
    eyebrow: "Assos Kafe Rehberi",
    heroSub: "Manzaralı oturumlar, ev yapımı tatlılar ve gerçek Ege kahvesi — Assos kafeleri tek sayfada.",
    heroChips: ['Deniz Manzarası', 'Asma Altı', 'Gün Batımı', 'Ev Yapımı Tatlı', 'Behramkale', 'Köy Kahvesi'],
    title: "Assos Kafeleri — Deniz Manzarası, Gün Batımı, Behramkale Kafeler | Assos'u Keşfet",
    desc: "Assos'un en iyi kafeleri: Behramkale asma altı kahveci, Kadırga deniz manzaralı cafe, Adatepe köy kafesi. Çalışma saatleri, konum ve menü bilgileriyle Assos kafe rehberi.",
    intro: "Assos'un en iyi kafeleri, Behramkale'nin taş döşeli sokaklarından Kadırga Koyu'nun deniz kenarına uzanan benzersiz bir coğrafyaya yayılmış. Asma altı avluları, gün batımı teraslı butik kafeleri, Ege kahvesi ve ev yapımı tatlılar sunan köy işletmeleri — her ruh haline uygun bir Assos kafe adresi burada. Çalışma saatleri, konumları ve menü detaylarıyla Behramkale, Adatepe ve çevre köylerdeki kafeleri keşfedin; kahve molanızı Assos'un tarihi dokusuyla birleştirin."
  },
  restoranlar: {
    id: 'restoran', emoji: '🍽', plural: 'Restoranlar', heroPlural: 'Restoranları', color: '#1A6B8A',
    eyebrow: "Assos Restoran Rehberi",
    heroSub: "Taze balık, mezeli akşamlar ve Ege mutfağı — Assos'un en iyi restoranları.",
    heroChips: ['Balık Restoranı', 'Ege Mutfağı', 'Mezeli Akşam', 'Deniz Kenarı', 'Antik Liman', 'Köy Lokantası'],
    title: "Assos Restoranları — Balık, Ege Mutfağı, Antik Liman Restoranlar | Assos'u Keşfet",
    desc: "Assos restoranları: antik liman balık lokantaları, Behramkale mezeli akşam yemeği, Kadırga deniz manzaralı restoranlar. Menü, konum ve iletişim bilgileriyle Assos restoran rehberi.",
    intro: "Assos restoranları, antik liman'ın taş rıhtımındaki balık lokantalarından Behramkale köy evlerinin avlusunda servis edilen mezeli akşam yemeklerine kadar geniş bir Ege mutfağı deneyimi sunuyor. Kadırga Koyu'nun deniz manzaralı restoranları, geleneksel Assos zeytinyağı ile hazırlanan ot yemekleri, taze tutulmuş balık çeşitleri ve yerel üretim şarabı — akşam yemeği planınızı konum, menü ve fiyat bilgileriyle birlikte yapın. Assos'ta en iyi restoranlar, çalışma saatleri ve iletişim bilgileriyle tek sayfada."
  },
  kahvalti: {
    id: 'kahvalti', emoji: '🌞', plural: 'Kahvaltı', heroPlural: 'Kahvaltı Mekanları', color: '#8A5520',
    eyebrow: "Assos Kahvaltı Rehberi",
    heroSub: "Serpme köy kahvaltısı, ev yapımı reçel ve Ayvacık peyniri — Assos'un en iyi kahvaltı adresleri.",
    heroChips: ['Serpme Kahvaltı', 'Köy Kahvaltısı', 'Ev Yapımı Reçel', 'Zeytin & Peynir', 'Manzaralı', 'Ayvacık'],
    title: "Assos Kahvaltı Mekanları — Serpme Köy Kahvaltısı, Ev Yapımı | Assos'u Keşfet",
    desc: "Assos'ta kahvaltı: Behramkale, Ahmetçe, Adatepe serpme köy kahvaltısı; ev yapımı reçel, Ayvacık peyniri, taze fırın ekmeği. En iyi kahvaltı mekanları tek sayfada.",
    intro: "Assos'ta kahvaltı deneyimi, kadın kooperatiflerinin el emeği reçellerinden Ayvacık köylerinin taze peynirlerine kadar Ege'nin gerçek tatlarını sofranıza taşıyor. Behramkale, Ahmetçe ve Adatepe'nin serpme köy kahvaltısı sunan mekanları; taze fırın ekmeği, yöresel zeytin, ev yapımı tereyağı ve 15-20 çeşit sunumla güne başlamanın en doğru yolu. Assos kahvaltı mekanları, çalışma saatleri ve menü detaylarıyla birlikte — sabah kahvaltı planınızı buradan yapın."
  },
  plajlar: {
    id: 'beach', emoji: '🏖', plural: 'Plajlar', heroPlural: 'Plajları', color: '#1A9A8A',
    eyebrow: "Assos Plaj & Koy Rehberi",
    heroSub: "Berrak koylar, ince çakıllı sahiller ve Ege'nin en güzel mavisi — Assos plajları.",
    heroChips: ['Berrak Koy', 'Çakıl Plaj', 'Beach Club', 'Gizli Koy', 'Kadırga', 'Sivrice'],
    title: "Assos Plajları & Koyları — Kadırga, Sivrice, Beach Club Rehberi | Assos'u Keşfet",
    desc: "Assos plajları: Kadırga Koyu berrak sular, Sivrice çakıl plaj, gizli koylar ve beach club'lar. Şemsiye-şezlong, yeme-içme, ulaşım bilgileriyle Assos plaj rehberi.",
    intro: "Assos plajları, Kadırga Koyu'nun ünlü berrak sularından Sivrice Plajı'nın ince çakıllarına, Türkiye'nin en temiz Ege sahillerini barındırıyor. Sokakağzı Koyu'nun sakinliğinden Kaleiçi Beach Club'ın konforuna, gizli koylardan çocuklu aileye uygun sığ plajlara — her tatil zevkine uygun Assos koyu ve plajı. Plaj girişleri, şemsiye-şezlong fiyatları, yeme-içme olanakları ve ulaşım bilgileriyle tatilinizi buradan planlayın. Assos'ta denize girilecek en iyi yerler tek listede."
  },
  iskeleler: {
    id: 'iskele', emoji: '⚓', plural: 'İskeleler', heroPlural: 'İskeleleri', color: '#3A5A8A',
    eyebrow: "Assos Tarihi İskeleler",
    heroSub: "Balıkçı tekneleri, gün batımı turları ve Ege'nin rüzgârı — Assos iskeleleri.",
    heroChips: ['Balıkçı Limanı', 'Tekne Turu', 'Gün Batımı', 'Antik Liman', 'Babakale', 'Ahmetçe'],
    title: "Assos İskeleleri — Antik Liman, Babakale, Ahmetçe Balıkçı Limanı | Assos'u Keşfet",
    desc: "Assos iskeleleri: antik liman, Babakale balıkçı limanı, Ahmetçe sakin koy. Tekne turu, balık mekanları, manzara noktaları ve ulaşımla tarihi Assos iskele rehberi.",
    intro: "Assos iskeleleri, antik çağdan bu yana Ege'nin ticaret ve balıkçılık merkezi olan bu bölgenin denizle olan köklü bağını yaşıyor. Antik liman'ın tarihi taş rıhtımından Babakale balıkçı iskelesine, Ahmetçe'nin sakin limanından gün batımı teknelerine kadar — her iskele Assos'un farklı bir hikayesini anlatıyor. Tekne turları, taze balık mekanları, manzara noktaları ve iskele kafeleri; konum ve ulaşım bilgileriyle birlikte Assos'un deniz kapılarını keşfedin."
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
  const introHtml = `
<section class="mk-hub-intro" style="background:linear-gradient(180deg,#FAF7F2 0%,#F5EDE0 100%);padding:56px 24px;border-bottom:1px solid rgba(26,39,68,.06)">
  <div style="max-width:820px;margin:0 auto;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:20px">
      <span style="width:32px;height:1px;background:${c.color}"></span>
      <span style="font-size:2.2rem">${c.emoji}</span>
      <span style="width:32px;height:1px;background:${c.color}"></span>
    </div>
    <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.02rem;line-height:1.85;color:#4A5568;margin:0;letter-spacing:-.002em">${escapeHtml(c.intro)}</p>
  </div>
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

  // HTMLRewriter ile hero, meta, chips, intro server-side render — FOUC giderilir
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
    // Breadcrumb JSON-LD (ilk script[type=application/ld+json] icindeki breadcrumb'i degistir)
    .on('script[type="application/ld+json"]', {
      element(el) {
        el.setInnerContent(breadcrumbJson);
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
    // Hero section'dan sonra intro section insert et
    .on('.mk-hero', { element(el) { el.after(introHtml, { html: true }); } })
    // Body'e hub flag
    .on('body', { element(el) { el.setAttribute('data-hub-cat', catId); } })
    .transform(response);
}
