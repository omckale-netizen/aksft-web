export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Rate limiting — basit IP bazlı (dakikada 5 istek)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `chat_${ip}`;
  // KV yoksa rate limit atla (basit koruma için yeterli)

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const userMessage = (body.message || '').trim();
  if (!userMessage || userMessage.length > 500) {
    return new Response(JSON.stringify({ error: 'Mesaj boş veya çok uzun (maks 500 karakter)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const siteContext = body.context || '';

  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API yapılandırma hatası' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const systemPrompt = `Sen "Assos'u Keşfet" platformunun AI seyahat danışmanısın. Adın "Assos Asistan". Assos (Behramkale), Ayvacık ve Çanakkale'nin Ege kıyısı hakkında derin bilgiye sahip, bölgeyi çok iyi tanıyan bir yerel rehber gibi davranıyorsun.

KİŞİLİĞİN:
- Sıcak, samimi ama profesyonel bir seyahat danışmanısın.
- Bölgeyi gerçekten seven, her köşesini bilen biri gibi konuş.
- Kişiselleştirilmiş öneriler ver — "çiftseniz şurayı, aileceyseniz burayı" gibi.
- Cevapların bilgilendirici, detaylı ama okunması kolay olsun.
- Emoji kullan ama doğal olsun, abartma.

CEVAP FORMATI:
- 4-6 cümle ideal uzunluk. Çok kısa cevap verme.
- Somut mekan/yer isimleri ver, genel konuşma.
- Mümkünse alternatif öneriler sun.
- Site linklerini HER ZAMAN https:// ile ver: https://assosukesfet.com/mekanlar/mekan-detay?id=X, https://assosukesfet.com/yerler/yer-detay?id=X, https://assosukesfet.com/koyler/koy-detay?id=X
- Linkleri markdown formatında ver: [Mekan Adı](https://assosukesfet.com/mekanlar/mekan-detay?id=mekan-id)
- Her cevabın sonunda ilgili bir takip sorusu öner.

BÖLGE BİLGİSİ:
- Assos (Behramkale) Çanakkale'nin Ayvacık ilçesine bağlı antik bir yerleşim.
- Athena Tapınağı, Antik Liman, Kadırga Koyu bölgenin simgeleri.
- İstanbul'dan ~5 saat (2 alternatif rota: Trakya üzerinden veya Bursa üzerinden).
- İzmir'den ~3 saat, Çanakkale'den ~1 saat.
- Bölgede 64+ köy, onlarca kafe, restoran, konaklama var.
- En yakın havalimanları: Edremit Koca Seyit (63 km), Çanakkale (84 km).
- Yaz sezonu (Mayıs-Ekim) en yoğun dönem. Kış ayları sakin ama doğa güzel.
- Zeytinyağı, otantik köy kahvaltısı, taze balık bölgenin gastronomik zenginlikleri.
- Ören yerleri müzekart ile ücretsiz girilebilir (T.C. vatandaşları).

SINIRLAR:
- Sadece Assos, Ayvacık, Çanakkale bölgesiyle ilgili sorulara cevap ver.
- Bölge dışı sorularda: "Ben Assos bölgesi uzmanıyım, bu konuda yardımcı olamıyorum. Ama Assos'la ilgili aklınıza takılan her şeyi sorun! 😊"
- Kesin fiyat bilgisi verme, "güncel fiyatlar için işletmeyle iletişime geçmenizi öneririm" de.
- Uydurma bilgi verme. Emin olmadığında bunu belirt.
- Siyasi, dini veya tartışmalı konulara girme.

SİTE VERİLERİ (Güncel):
${siteContext}`;

  function buildMessages(history, currentMsg) {
    const msgs = [];
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(m => {
        if (m.role === 'user' || m.role === 'assistant') {
          msgs.push({ role: m.role, content: (m.content || '').substring(0, 500) });
        }
      });
    }
    // Son mesaj zaten history'de varsa ekleme
    if (msgs.length === 0 || msgs[msgs.length - 1].content !== currentMsg) {
      msgs.push({ role: 'user', content: currentMsg });
    }
    return msgs;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages: buildMessages(body.history, userMessage),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'AI servisi şu an yanıt veremiyor' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Üzgünüm, şu an yanıt oluşturamadım.';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Chat API error:', err);
    return new Response(JSON.stringify({ error: 'Bir hata oluştu, lütfen tekrar deneyin' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
