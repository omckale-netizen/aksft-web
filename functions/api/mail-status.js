export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const RESEND_API_KEY = env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key yok' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { emailIds } = body;
  if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
    return new Response(JSON.stringify({ error: 'emailIds dizisi gerekli' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Max 20 sorgu
  const ids = emailIds.slice(0, 20);
  const results = [];

  for (const id of ids) {
    try {
      const res = await fetch('https://api.resend.com/emails/' + id, {
        headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        results.push({
          id: id,
          to: data.to,
          subject: data.subject,
          status: data.last_event || 'sent',
          created: data.created_at
        });
      } else {
        results.push({ id: id, status: 'unknown' });
      }
    } catch(e) {
      results.push({ id: id, status: 'error' });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
