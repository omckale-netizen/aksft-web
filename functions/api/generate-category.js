// Cloudflare Pages Function — Admin-only kategori icerigi uretme
// Claude Sonnet 4.6 ile yaratici Turkce metinler uretir.
// Admin gate cookie kontrolu + gunluk limit.

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

  // Admin gate kontrolu — sadece admin'e acik
  const GATE_KEY = (env.ADMIN_GATE_KEY || '').trim();
  if (!GATE_KEY) {
    return new Response(JSON.stringify({ error: 'Admin servisi yapilandirma hatasi' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const cookies = request.headers.get('cookie') || '';
  if (!cookies.includes('admin_gate=' + GATE_KEY)) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erisim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Gunluk limit — 20 uretim/gun
  if (!env.CHAT_KV) {
    return new Response(JSON.stringify({ error: 'Servis su an kullanilamiyor' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const DAILY_LIMIT = 20;
  const today = new Date().toISOString().split('T')[0];
  const dailyKey = 'category_gen_daily_' + today;
  try {
    const dailyCount = parseInt(await env.CHAT_KV.get(dailyKey) || '0');
    if (dailyCount >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'Gunluk kategori uretimi limiti doldu (' + DAILY_LIMIT + '). Yarin tekrar deneyin.', limitReached: true }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

  const { id, slug, label, plural, heroPlural, emoji, color } = body || {};
  if (!id || !slug || !label || !plural || !emoji) {
    return new Response(JSON.stringify({ error: 'Eksik alan: id, slug, label, plural, emoji zorunlu' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Anthropic API key yapilandirilmamis' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const systemPrompt = `Sen Assos'u Keşfet platformunun içerik yazarısın. Assos (Behramkale), Ayvacık ve Çanakkale bölgesini yakından tanıyan, Türkçe yazan SEO uzmanısın.

Sana verilen kategori için aşağıdaki alanları JSON formatında üretmen gerek. KESİNLİKLE sadece geçerli JSON döndür, başka hiçbir metin/açıklama yazma.

## Coğrafi Referans Noktaları (kullanabileceğin bölge isimleri):
- Behramkale (Assos köyü merkez, antik Athena Tapınağı, taş surlar)
- Kadırga Koyu (ünlü mavi bayraklı plaj, berrak su)
- Sivrice (geniş kumsal, aile plajı)
- Babakale (Türkiye'nin en batısı, Osmanlı Kalesi, balıkçı iskelesi)
- Adatepe (zeytinlik, Zeytinyağı Müzesi, yayla köyü)
- Ahmetçe (Kadın Kooperatifi, sakin sahil)
- Sokakağzı (gizli koy)
- Ayvacık (ilçe merkezi)
- Antik Liman (2500 yıllık taş rıhtım)

## Stil Kuralları
- Doğal Türkçe, reklam dili değil
- Lokasyon isimlerini doğal şekilde geçir (keyword stuffing YOK)
- Keyword-rich ama aşırı optimize görünmesin
- Her metin kendi tarzında, template gibi değil
- Aksan: sıcak, bilgili, güvenilir

## Ne Üreteceksin (JSON schema):
{
  "eyebrow": "Kısa üst başlık (örn: 'Assos Kafe Rehberi') — max 30 kar",
  "heroSub": "1 cümle tanıtım (max 120 kar) — 'A'dan B'ye — C' formatı iyi çalışır",
  "heroChips": ["6 adet SEO keyword chip — her biri 2-3 kelime, lokasyon+özellik karışık"],
  "title": "SEO title — 55-65 karakter, brand sonda 'Assos'u Keşfet' YAZMA (otomatik eklenecek), max 50 kar mesajda",
  "desc": "Meta description — 140-150 karakter, CTA'lı ve keyword-rich",
  "shortIntro": "~40 kelime kısa tanıtım — kullanıcıya 'stil seçimi' yaptıracak tarz, 'hangi X istersin?' öncüsü",
  "intro": "~80-100 kelime uzun SEO tanıtım — lokasyon adları + keyword'ler doğal geçer, paragraf",
  "experiences": [
    { "emoji": "uygun emoji", "title": "Deneyim stili başlığı (2-3 kelime)", "desc": "~2 cümle açıklama (~20 kelime), lokasyon adı geçebilir ama zorunlu değil" }
  ],
  "faqs": [
    { "q": "SEO odaklı soru (long-tail keyword içeren)", "a": "~100-150 kelime cevap, bölge adları + pratik bilgi (saat, fiyat, ulaşım) natural geçer, MEKAN ADI GEÇİRME" }
  ]
}

KURALLAR:
- experiences: TAM 3 adet
- faqs: TAM 5 adet
- Hiçbir alanda MEKAN ADI (kafe ismi, otel ismi vb.) geçirme — sadece bölge/lokasyon adları
- heroChips 6 adet olacak
- JSON dışında hiçbir metin yazma`;

  const userPrompt = `Kategori bilgileri:
- id: ${id}
- slug: ${slug}
- label: ${label}
- plural: ${plural}
- heroPlural (Türkçe genitive): ${heroPlural || plural}
- emoji: ${emoji}
- color: ${color || '#C4521A'}

Bu kategori için yukarıda belirtilen JSON schema'yı doldur. Sadece geçerli JSON döndür, başka hiçbir metin yazma.`;

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
        max_tokens: 3000,
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

    // JSON parse
    let parsed;
    try {
      // AI bazen kod blogu ile sarar ```json ... ```
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch(e) {
      return new Response(JSON.stringify({ error: 'AI cevabi JSON parse edilemedi', raw: text.substring(0, 500) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validation
    if (!parsed.eyebrow || !parsed.heroSub || !Array.isArray(parsed.heroChips) || !Array.isArray(parsed.experiences) || !Array.isArray(parsed.faqs)) {
      return new Response(JSON.stringify({ error: 'AI cevap eksik alan', parsed }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
