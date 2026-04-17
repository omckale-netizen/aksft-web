// Google Maps kısa URL genişletici — redirect'i takip edip tam URL döner
// maps.app.goo.gl/xxx → https://www.google.com/maps/@40.123,26.456,15z
// Client CORS yüzünden yapamadığı için Worker üzerinden

export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some(o => referer.startsWith(o));
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

  const url = String(body.url || '').trim();
  if (!url) {
    return new Response(JSON.stringify({ error: 'URL gerekli' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Yalnızca tanıdığımız Google kısaltma domainlerini kabul et (SSRF koruması)
  const allowedHosts = ['maps.app.goo.gl', 'goo.gl', 'g.co', 'maps.google.com', 'www.google.com', 'google.com'];
  let parsed;
  try { parsed = new URL(url); } catch { return new Response(JSON.stringify({ error: 'Geçersiz URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
  if (!allowedHosts.includes(parsed.hostname)) {
    return new Response(JSON.stringify({ error: 'Yalnızca Google Maps URL\'leri destekleniyor' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // IP bazlı basit rate limit — 1 dakikada max 20
  if (env.CHAT_KV) {
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const key = 'mapex_' + ip + '_' + Math.floor(Date.now() / 60000);
      const count = parseInt(await env.CHAT_KV.get(key) || '0');
      if (count >= 20) {
        return new Response(JSON.stringify({ error: 'Çok fazla istek. Biraz bekleyin.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await env.CHAT_KV.put(key, String(count + 1), { expirationTtl: 60 });
    } catch(e) {}
  }

  try {
    // Cloudflare Workers fetch: default redirect='follow' → response.url final URL olur
    // Android/iOS Chrome UA vererek tam desktop URL almaya çalışıyoruz
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
      },
      cf: { cacheTtl: 300 }
    });

    let finalUrl = resp.url || url;

    // Eğer hala kısa URL ise (bazı durumlarda redirect body'de script ile yapılır)
    // HTML body'sinden canonical link veya meta refresh'i çıkarmaya çalış
    if (finalUrl.includes('goo.gl')) {
      try {
        const html = await resp.text();
        // meta http-equiv="refresh" content="0; url=..."
        const metaMatch = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+url=([^"'>\s]+)/i);
        if (metaMatch) finalUrl = metaMatch[1];
        // canonical
        if (finalUrl.includes('goo.gl')) {
          const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
          if (canonMatch) finalUrl = canonMatch[1];
        }
        // Genelde HTML'de "maps.google.com/..." linki vardır
        if (finalUrl.includes('goo.gl')) {
          const gmapsMatch = html.match(/(https?:\/\/(?:www\.)?(?:maps\.)?google\.com\/maps[^"'\s<>]*)/i);
          if (gmapsMatch) finalUrl = gmapsMatch[1].replace(/&amp;/g, '&');
        }
        // Koordinat match — ÖNCELİK: pin konumu (!3d!4d), sonra kamera (@)
        if (!finalUrl.match(/!3d-?\d+\.\d+/)) {
          const pinMatch = html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          if (pinMatch) {
            // Place URL formatında ekle
            finalUrl = 'https://www.google.com/maps/place/?q=place&data=!3d' + pinMatch[1] + '!4d' + pinMatch[2];
          } else if (!finalUrl.match(/@-?\d+\.\d+/)) {
            const camMatch = html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (camMatch) {
              finalUrl = 'https://www.google.com/maps/@' + camMatch[1] + ',' + camMatch[2] + ',15z';
            }
          }
        }
      } catch(e) {}
    }

    return new Response(JSON.stringify({ ok: true, expandedUrl: finalUrl, originalUrl: url }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch(err) {
    console.error('[expand-maps-url] error:', err);
    return new Response(JSON.stringify({ error: 'URL genişletilemedi: ' + (err.message || 'bilinmeyen') }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions(context) {
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }});
}
