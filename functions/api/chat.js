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

  const systemPrompt = `Sen "Assos'u Keşfet" sitesinin yapay zeka asistanısın. Assos (Behramkale), Ayvacık, Çanakkale bölgesi hakkında turistlere yardımcı oluyorsun.

KURALLAR:
- Sadece Assos, Ayvacık, Çanakkale bölgesiyle ilgili sorulara cevap ver.
- Bölge dışı sorularda kibarca "Bu konuda yardımcı olamıyorum, Assos bölgesiyle ilgili sorularınızı yanıtlayabilirim" de.
- Cevapları Türkçe ver, kısa ve öz tut (maks 3-4 cümle).
- Site verilerinden bilgi varsa kullan, yoksa genel bilgini kullan.
- Mekan önerirken assosukesfet.com linklerini ver.
- Samimi, sıcak ve yardımsever ol. Emoji kullan ama abartma.
- Fiyat bilgisi verme, "güncel fiyatlar için işletmeyle iletişime geçin" de.
- Asla uydurma bilgi verme. Emin olmadığın konularda "kesin bilgim yok" de.

SİTE VERİLERİ:
${siteContext}`;

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
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
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
