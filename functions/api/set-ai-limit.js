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

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Admin doğrulama — cookie veya header
  const cookies = request.headers.get('Cookie') || '';
  const adminKey = request.headers.get('X-Admin-Key') || '';
  const hasGateCookie = env.ADMIN_GATE_KEY && cookies.includes('admin_gate=' + env.ADMIN_GATE_KEY);
  const hasGateHeader = env.ADMIN_GATE_KEY && adminKey === env.ADMIN_GATE_KEY;
  if (!hasGateCookie && !hasGateHeader) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const limit = parseInt(body.limit);
  if (!limit || limit < 1 || limit > 100) {
    return new Response(JSON.stringify({ error: 'Limit 1-100 arasında olmalı' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    if (env.CHAT_KV) {
      await env.CHAT_KV.put('ai_daily_limit', String(limit));
      return new Response(JSON.stringify({ ok: true, limit }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ error: 'KV bağlantısı yok' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch(e) {
    return new Response(JSON.stringify({ error: 'KV güncelleme hatası' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': context.request.headers.get('Origin') || 'https://assosukesfet.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
