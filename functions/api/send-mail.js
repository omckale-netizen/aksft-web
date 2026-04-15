export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS
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

  // Rate limit — günde max 50 mail
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.CHAT_KV) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const mailDayKey = 'mail_day_' + ip + '_' + today;
      const mailCount = parseInt(await env.CHAT_KV.get(mailDayKey) || '0');
      if (mailCount >= 100) {
        return new Response(JSON.stringify({ error: 'Günlük mail limiti doldu' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await env.CHAT_KV.put(mailDayKey, String(mailCount + 1), { expirationTtl: 86400 });
    } catch(e) {}
  }

  const RESEND_API_KEY = env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'Mail servisi yapılandırılmamış' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { to, subject, html, replyTo, type } = body;

  if (!to || !subject || !html) {
    return new Response(JSON.stringify({ error: 'to, subject ve html alanları zorunlu' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Her alıcıya ayrı mail gönder (birbirlerini görmesinler)
  try {
    const recipients = Array.isArray(to) ? to : [to];
    const results = [];
    for (const recipient of recipients) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Assos\'u Keşfet <info@assosukesfet.com>',
          to: [recipient],
          subject: subject,
          html: html,
          reply_to: replyTo || 'info@assosukesfet.com',
        }),
      });
      const data = await res.json();
      results.push({ to: recipient, ok: res.ok, id: data.id, error: data.message });
    }

    const failed = results.filter(r => !r.ok);
    if (failed.length > 0 && failed.length === recipients.length) {
      return new Response(JSON.stringify({ error: 'Mail gönderilemedi', details: failed[0].error || '' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const successResults = results.filter(r => r.ok);
    return new Response(JSON.stringify({ ok: true, sent: successResults.length, total: recipients.length, emailIds: successResults.map(r => ({ to: r.to, id: r.id })) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch(e) {
    console.error('Mail send error:', e);
    return new Response(JSON.stringify({ error: 'Mail gönderme hatası' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
