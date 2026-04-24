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
- /oteller — Assos Otelleri
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
3. **Doğal Türkçe**: Reklam dili değil, kılavuz/rehber üslubu.
4. **Keyword-rich ama doğal**: Primary keyword başlık + H1 + ilk paragraf + 3-5 kez doğal geçer. Keyword stuffing YOK.
5. **Yapısal içerik**: 5-8 H2 başlığı, en az 1 tablo veya liste, kalın/italik vurgular.
6. **İç linkler**: 3-5 internal link (yukarıdaki paternlerden uygun olanları).
7. **E-E-A-T sinyali**: Spesifik sayı/tarih/mesafe ver (genel "çok güzel" demek yerine "2.500 yıllık", "86 km uzaklıkta").
8. **Uzunluk**: 700-1000 kelime — ne çok kısa (thin) ne çok uzun (dağınık).
9. **Mekan isimleri serbest**: Bu blog yazısında gerçek mekan/otel isimleri geçebilir (kategori hub'larından farklı olarak).
10. **Action items**: Sonuç bölümünde kullanıcıya somut "şimdi ne yap" önerileri.

## HTML Format Kuralları
- <h1>...</h1> (tek, başlıkla uyumlu)
- <h2>, <h3> (yapısal bölümler)
- <p>, <ul>, <ol>, <li>
- <strong>, <em>
- <a href="/...">internal link</a>
- <table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table>
- Tüm HTML inline, class/style YOK

## Çıktı Şeması (JSON)
{
  "title": "SEO başlık (55-70 kar, primary keyword içerir)",
  "slug": "url-friendly-slug-kebab-case (sadece a-z 0-9 ve -)",
  "excerpt": "Meta description — 140-160 karakter, keyword-rich, CTA'lı",
  "category": "Kategori adı (örn: 'Gezi Rehberi', 'Yeme İçme', 'Konaklama', 'Tarih & Kültür', 'Mevsim Rehberi')",
  "tags": ["5-7 tag, her biri 1-2 kelime, mixed: Assos, Ayvacık, konu-specific"],
  "emoji": "Uygun tek emoji",
  "content": "Tam HTML içerik. H1 ile başlar, ~700-1000 kelime, 5-8 H2, tablolar, iç linkler."
}

KURALLAR (tekrar):
- JSON dışında hiçbir metin döndürme — ne açıklama ne kod bloku sarması
- content HTML doğru parse edilebilir olmalı (kaçış karakterleri dikkat)
- title'a "Assos'u Keşfet" EKLEME (otomatik eklenecek)
- excerpt 140-160 karakter olmalı, daha az/çok değil
- İlk paragraf featured snippet için 40-60 kelime, direkt cevap`;

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
        max_tokens: 6000,
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
