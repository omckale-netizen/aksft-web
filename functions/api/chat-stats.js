import { requireAdmin } from './_verify.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Admin doğrulama — cookie + Firebase ID token (çift kontrol)
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    if (!env.CHAT_KV) {
      return new Response(JSON.stringify({ error: 'KV yok' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const dailyKey = 'chat_daily_' + today;
    const serverUsed = parseInt(await env.CHAT_KV.get(dailyKey) || '0');
    const dailyLimit = parseInt(await env.CHAT_KV.get('ai_daily_limit') || '25');

    // Toplam kullanım — son 30 günün toplamını hesapla
    let total = 0;
    const promises = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = 'chat_daily_' + d.toISOString().split('T')[0];
      promises.push(env.CHAT_KV.get(key));
    }
    const results = await Promise.all(promises);
    results.forEach(v => { total += parseInt(v || '0'); });

    return new Response(JSON.stringify({
      today: serverUsed,
      total: total,
      dailyLimit: dailyLimit,
      serverUsed: serverUsed,
      serverLimit: 500
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': context.request.headers.get('Origin') || 'https://assosukesfet.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
