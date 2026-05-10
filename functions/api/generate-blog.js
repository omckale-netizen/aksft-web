// Cloudflare Pages Function — Admin-only AI blog yazi uretme
// Claude Sonnet 4.6 ile SEO-odakli, featured-snippet-optimize blog yazilari uretir.
// Admin gate cookie kontrolu + gunluk limit (10/gun).

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS — sadece kendi sitemizden
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  const referer = request.headers.get('Referer') || '';
  const hasValidReferer = allowedOrigins.some(o => referer.startsWith(o));
  if (!isAllowed && !hasValidReferer) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Admin gate kontrolu
  const GATE_KEY = (env.ADMIN_GATE_KEY || '').trim();
  if (!GATE_KEY) {
    return new Response(JSON.stringify({ error: 'Admin servisi yapilandirma hatasi' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const cookies = request.headers.get('cookie') || '';
  if (!cookies.includes('admin_gate=' + GATE_KEY)) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erisim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Gunluk limit — 10 yazi/gun (blog icin daha az, her biri maliyetli)
  if (!env.CHAT_KV) {
    return new Response(JSON.stringify({ error: 'Servis su an kullanilamiyor' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const DAILY_LIMIT = 10;
  const today = new Date().toISOString().split('T')[0];
  const dailyKey = 'blog_gen_daily_' + today;
  try {
    const dailyCount = parseInt(await env.CHAT_KV.get(dailyKey) || '0');
    if (dailyCount >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'Gunluk blog uretimi limiti doldu (' + DAILY_LIMIT + '). Yarin tekrar deneyin.', limitReached: true }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch(e) {
    return new Response(JSON.stringify({ error: 'KV hatasi' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Gecersiz istek' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { topic, primaryKeyword, secondaryKeywords, contentAngle } = body || {};
  if (!topic || !primaryKeyword) {
    return new Response(JSON.stringify({ error: 'Eksik alan: topic ve primaryKeyword zorunlu' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Anthropic API key yapilandirilmamis' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const systemPrompt = `Sen Assos'u Keşfet platformunun kıdemli içerik yazarısın. Assos (Behramkale), Ayvacık ve Çanakkale bölgesini yakından tanıyan, SEO ve Google featured snippet uzmanı bir Türkçe yazarsın.

GÖREVIN: Verilen konu için detaylı, SEO-odaklı, Google featured snippet'e aday bir blog yazısı üretmek.

## Coğrafi Referans Noktaları (kullanabileceğin bölge isimleri):
- Behramkale (Assos köyü merkez, antik Athena Tapınağı, taş surlar)
- Kadırga Koyu (ünlü mavi bayraklı plaj, berrak su)
- Sivrice (ince çakıl plaj, aile plajı)
- Babakale (Türkiye'nin en batısı, Osmanlı Kalesi, balıkçı iskelesi)
- Adatepe (Kaz Dağları eteklerinde zeytinyağı müzesi, taş ev köy)
- Ahmetçe (Kadın Kooperatifi kahvaltısıyla ünlü, sakin sahil)
- Sokakağzı (gizli koy, kalabalıktan uzak)
- Ayvacık (ilçe merkezi, Çanakkale'ye 70km)
- Antik Liman (2500 yıllık taş rıhtım)
- Athena Tapınağı (MÖ 530, Anadolu'nun tek Dor tapınağı)
- Kaz Dağları / İda Dağı (mitolojik dağ, kuzeyde)
- Midilli Adası (Yunanistan, Ege'de karşıda görünür)

## Coğrafi Hiyerarşi (ÇOK ÖNEMLİ)
Her yazıda "Çanakkale Ayvacık Assos" hiyerarşisini doğal şekilde geçir. Bu, tek metinde 4 arama kademesini yakalar: Çanakkale, Ayvacık, Assos, Behramkale.

## Site İç Link Paternleri (content içinde kullanacaksın)
- /rotalar — Hazır Gezi Rotaları
- /yerler — Gezilecek Yerler
- /mekanlar — Tüm Mekanlar
- /konaklama — Assos Konaklama (otel, pansiyon, kamping, taş ev)
- /kafeler — Assos Kafeleri
- /restoranlar — Assos Restoranları
- /kahvalti — Assos Kahvaltı Mekanları
- /plajlar — Assos Plajları
- /iskeleler — Assos İskeleleri
- /koyler — Assos Köyleri
- /blog — Blog Ana Sayfa
- /rehber — Detaylı Assos Rehberi
- Mevcut blog yazıları (her birini referans edebilirsin):
  * /blog/assos-1-gunluk-gezi-plani — 1 Günlük Gezi Planı
  * /blog/assosa-nasil-gidilir-ulasim-rehberi — Ulaşım Rehberi
  * /blog/assos-en-iyi-kahvalti-mekanlari — Kahvaltı Mekanları
  * /blog/assos-gun-batimi-en-iyi-noktalar — Gün Batımı Noktaları
  * /blog/assos-koy-plaj-rehberi — Koy ve Plaj Rehberi
  * /blog/assos-koylari-rehberi — Köyler Rehberi
  * /blog/assos-antik-kenti-gezi-rehberi — Antik Kent Rehberi
  * /blog/assos-yerel-lezzetler-ne-yenir — Yerel Lezzetler
  * /blog/assosta-gezilecek-10-yer — Gezilecek 10 Yer
  * /blog/assos-nerede-kalinir-konaklama — Nerede Kalınır
  * /blog/assosta-denize-girilir-mi — Denize Girilir mi

## Stil Kuralları — KRİTİK
1. **Featured snippet hedefli ilk paragraf**: H1'den hemen sonra gelen ilk paragraf, sorulan sorunun kısa ve net cevabını verir (40-60 kelime). Google SERP'te 0. sırada gösterilebilir.
2. **Coğrafi hiyerarşi**: İlk paragrafta "Çanakkale Ayvacık Assos" geçer.
3. **Doğal Türkçe**: Reklam dili değil, kılavuz/rehber üslubu. YAZIM HATALARINA DİKKAT (özellikle Türkçe diakritikler: sisli, sıcak, ılık — sislí, sicak, ilik değil).
4. **Keyword-rich ama doğal**: Primary keyword başlık + H1 + ilk paragraf + 3-5 kez doğal geçer. Keyword stuffing YOK.
5. **Yapısal içerik**: 5-8 H2 başlığı, en az 1 tablo veya liste, kalın/italik vurgular.
6. **İç linkler (ZORUNLU, MİNİMUM 6 TANE)**: Metinde bir yer/mekan/blog adı geçtiğinde MUTLAKA <a href="/..."> ile sarmalayacaksın. Örnekler:
   - "Behramkale" → <a href="/koyler/behramkale">Behramkale</a>
   - "Kadırga Koyu" → <a href="/yerler/kadirga-koyu">Kadırga Koyu</a>
   - "Adatepe" → <a href="/koyler/adatepe">Adatepe</a>
   - "Babakale" → <a href="/koyler/babakale">Babakale</a>
   - "Athena Tapınağı" → <a href="/yerler/athena-tapinagi">Athena Tapınağı</a>
   - "Sivrice" → <a href="/yerler/sivrice">Sivrice</a>
   - "Assos konaklama" veya "konaklama" → <a href="/konaklama">Assos konaklama</a>
   - "kahvaltı mekanları" → <a href="/kahvalti">Assos kahvaltı mekanları</a>
   - "gezi rotaları" → <a href="/rotalar">Assos gezi rotaları</a>
   - "1 Günlük Gezi Planı" → <a href="/blog/assos-1-gunluk-gezi-plani">1 Günlük Gezi Planı</a>
   - "kış tatili" → <a href="/blog/assosa-kisin-gitmek">kışın Assos rehberi</a>
   - İlk geçişte link ver, tekrarlarda zorunlu değil.
7. **E-E-A-T sinyali**: Spesifik sayı/tarih/mesafe ver ("2.500 yıllık", "86 km uzaklıkta", "MÖ 530'da", "25-30°C"). Yağış mm, güneş saati, nem %, sıcaklık min-max gibi rakamsal veriler ZENGİN EKLE.
8. **Uzunluk**: 800-1100 kelime — ne çok kısa (thin) ne çok uzun (dağınık).
9. **Mekan isimleri serbest**: Bu blog yazısında gerçek mekan/otel isimleri geçebilir (kategori hub'larından farklı olarak).
10. **Action items**: Sonuç bölümünde kullanıcıya somut "şimdi ne yap" önerileri — her öneride en az 1 internal link.

## ZORUNLU BÖLÜM: Sıkça Sorulan Sorular (FAQ)

İçeriğin SONUÇ bölümünden HEMEN ÖNCE şu yapıda bir FAQ bölümü ekle:

Tum <details> etiketlerinde name="post-faq-group" attribute'u KULLAN (exclusive accordion icin, birine tiklayinca digeri kapanir):

<h2>Sıkça Sorulan Sorular</h2>
<details name="post-faq-group">
  <summary>Soru 1 metni (long-tail keyword içeren)</summary>
  <p>Cevap — 50-80 kelime, spesifik, yararlı, keyword doğal geçer.</p>
</details>
<details name="post-faq-group">
  <summary>Soru 2</summary>
  <p>Cevap...</p>
</details>
(4-6 soru-cevap, HEPSI name="post-faq-group")

Sorular MUTLAKA yazının ana konusuna ait uzun-kuyruk (long-tail) Google aramalarını hedeflemeli. Örn konu "Assos hava durumu" ise:
- "Assos'ta yaz ayları ne kadar sıcak olur?"
- "Assos deniz suyu hangi aylarda yüzmeye uygun?"
- "Assos'u kışın ziyaret etmeye değer mi?"
- "Assos'a gitmek için en iyi ay hangisi?"
- "Assos yağışlı mı, hangi aylar yağışlı?"

## HTML Format Kuralları
- <h1>...</h1> (tek, başlıkla uyumlu)
- <h2>, <h3> (yapısal bölümler)
- <p>, <ul>, <ol>, <li>
- <strong>, <em>
- <a href="/...">internal link</a> — MİNİMUM 6 TANE
- <table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table>
- <details><summary>...</summary><p>...</p></details> — FAQ için
- Tüm HTML inline, class/style YOK
- Script tag KOYMA, sadece HTML

## GÖRSEL PROMPT'LARI (ZORUNLU)

Üretilen blog yazısının ANA KONUSUNA UYGUN, **İNGİLİZCE**, **FOTOĞRAFİK / GERÇEKÇİ** bir görsel prompt'u hazırla. Amaç: Google Gemini (Imagen 3), Midjourney veya DALL-E 3 gibi araçlara yapıştırılacak.

### imagePrompt kuralları (İngilizce, 60-100 kelime)
1. **Photorealistic** — fotoğrafik stil. "Editorial photograph", "National Geographic style", "cinematic travel photography" gibi terimler kullan. İllüstrasyon/resim/painting/cartoon/3D render DEĞİL.
2. **16:9 aspect ratio** — prompt'un sonunda "--ar 16:9" veya "16:9 aspect ratio, cinematic widescreen" yaz.
3. **Blog konusuna uygun sahne** — hava durumu yazısı ise bölgenin atmosferi, rota yazısı ise panoramik yol/manzara, yemek yazısı ise rustik Ege sofrası vb.
4. **Coğrafi doğruluk** — Çanakkale Ayvacık Assos (Ege kıyısı, Kaz Dağları, taş köyler, mavi deniz, zeytinlikler) referans al. Yunan adası DEĞİL — "Turkish Aegean coast, Mount Ida in background, olive groves".
5. **Işık + kompozisyon** — "golden hour lighting", "soft morning light", "dramatic sky", "wide panoramic composition", "shallow depth of field" gibi spesifik detaylar.
6. **No people veya minimal people** — insanları genelde kaçın (model fotoğrafı olmasın).
7. **Lens/kamera detayları** — "shot on 35mm film", "DSLR", "Canon EOS R5" gibi gerçekçilik artırıcı detaylar.
8. **ÖZEL YERLER YERINE ATMOSFER** — Athena Tapınağı yazma (AI hatalı render eder), "ancient Greek temple ruins on rocky cliffs" yaz. Kadırga Koyu yazma, "hidden Aegean cove with turquoise water" yaz. Genel atmosfer, spesifik yer yok.

### unsplashKeywords kuralları (İngilizce, 3-5 kelime öbeği)
- Gerçek fotoğraf arama için Unsplash'te yazılacak kelimeler
- Her biri 1-3 kelime, spesifik
- Örnek: ["aegean turkey coast", "greek ruins sunset", "turkish stone village", "olive grove sunset", "mediterranean beach"]
- Konuya uygun, İngilizce

## Çıktı Şeması (JSON)
{
  "title": "SEO başlık (55-70 kar, primary keyword içerir)",
  "slug": "url-friendly-slug-kebab-case",
  "excerpt": "Meta description — 140-160 karakter, keyword-rich, CTA'lı",
  "category": "Kategori adı (örn: 'Gezi Rehberi', 'Yeme İçme', 'Mevsim Rehberi')",
  "tags": ["5-7 tag"],
  "emoji": "Uygun tek emoji",
  "content": "Tam HTML içerik. 800-1100 kelime, MIN 6 internal link, ZORUNLU FAQ bölümü.",
  "faqs": [ { "q": "...", "a": "..." } ],
  "imagePrompt": "English photorealistic prompt, 60-100 words, 16:9, National Geographic editorial style, specific to blog topic. NO illustration/painting/cartoon. End with '16:9 aspect ratio, cinematic widescreen'.",
  "unsplashKeywords": ["3-5 English search phrases"]
}

KURALLAR (tekrar):
- JSON dışında hiçbir metin döndürme
- content HTML doğru parse edilebilir
- title'a "Assos'u Keşfet" EKLEME
- excerpt 140-160 karakter
- content içinde MIN 6 <a href="/..."> + ZORUNLU FAQ bölümü
- Türkçe yazım hatası YOK (ılık, sisli, sıcak)
- faqs array'i content'teki FAQ ile birebir uyumlu
- imagePrompt İNGİLİZCE + PHOTOREALISTIC + 16:9
- unsplashKeywords İNGİLİZCE + 3-5 adet`;

  const secondaryKwStr = Array.isArray(secondaryKeywords) && secondaryKeywords.length > 0
    ? secondaryKeywords.join(', ')
    : '(yok)';

  const userPrompt = `Blog konusu: ${topic}

Primary keyword (başlık + H1 + ilk paragrafta olmalı): ${primaryKeyword}
Secondary keywords (içerikte doğal geçmeli): ${secondaryKwStr}

İçerik yönlendirmesi: ${contentAngle || '(özel yönlendirme yok — kendi uzmanlığını kullan)'}

Yukarıdaki JSON şemasına göre blog yazısını üret. Sadece geçerli JSON döndür, başka hiçbir metin yazma.`;

  try {
    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      return new Response(JSON.stringify({ error: 'AI servisi hatasi', detail: errText.substring(0, 200) }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiResp.json();
    const text = aiData.content?.[0]?.text || '';

    let parsed;
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch(e) {
      return new Response(JSON.stringify({ error: 'AI cevabi JSON parse edilemedi', raw: text.substring(0, 500) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validation
    const required = ['title', 'slug', 'excerpt', 'category', 'tags', 'emoji', 'content'];
    const missing = required.filter(k => !parsed[k]);
    if (missing.length > 0) {
      return new Response(JSON.stringify({ error: 'AI cevap eksik alan: ' + missing.join(', '), parsed }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!Array.isArray(parsed.tags)) {
      parsed.tags = String(parsed.tags).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(parsed.unsplashKeywords)) {
      parsed.unsplashKeywords = parsed.unsplashKeywords ? String(parsed.unsplashKeywords).split(',').map(s => s.trim()).filter(Boolean) : [];
    }
    if (!parsed.imagePrompt) parsed.imagePrompt = '';
    if (!Array.isArray(parsed.faqs)) parsed.faqs = [];

    // Limit guncelle
    try {
      const current = parseInt(await env.CHAT_KV.get(dailyKey) || '0');
      await env.CHAT_KV.put(dailyKey, String(current + 1), { expirationTtl: 86400 });
    } catch(e) { /* limit guncellenmezse sorun degil */ }

    return new Response(JSON.stringify({ success: true, data: parsed }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch(err) {
    return new Response(JSON.stringify({ error: 'Sunucu hatasi', detail: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions(context) {
  const { request } = context;
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const isAllowed = allowedOrigins.includes(origin);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
