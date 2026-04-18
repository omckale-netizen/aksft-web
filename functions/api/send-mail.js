import { checkAuth } from './_verify.js';

// Email HTML sanitizer — XSS/phishing vektorlerini strip eder.
// Whitelist yerine blacklist yaklasimi: tehlikeli tag/attr/URI scheme'lerini kaldirir,
// kalan HTML'yi template'ler icin kullanilabilir birakir.
function sanitizeEmailHtml(html) {
  if (typeof html !== 'string') return '';
  if (html.length > 100000) html = html.substring(0, 100000);

  // 1) Cok tehlikeli tag'leri icerikleriyle birlikte kaldir (script/style/iframe/object/embed)
  html = html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object\s*>/gi, '')
    .replace(/<embed\b[\s\S]*?<\/embed\s*>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, '');

  // 2) Void/standalone tehlikeli tag'ler (content'i yok ama tag'i sil)
  html = html
    .replace(/<\s*(link|meta|base|form|input|button|textarea|select|option)\b[^>]*>/gi, '')
    .replace(/<\s*\/\s*(form|input|button|textarea|select|option)\s*>/gi, '');

  // 3) Tum event handler attribute'larini kaldir (onclick, onerror, onload, onmouseover, ...)
  // Hem quoted hem unquoted formlari yakala.
  html = html
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '');

  // 4) Tehlikeli URI scheme'leri (javascript:, vbscript:, data:text/html)
  // href/src/action/formaction/background/poster/srcset attribute'larinda
  html = html
    .replace(/(\s(?:href|src|action|formaction|background|poster|srcset|xlink:href)\s*=\s*)(["'])\s*(?:javascript|vbscript|livescript|mocha)\s*:[^"']*\2/gi, '$1$2#blocked$2')
    .replace(/(\s(?:href|src|action|formaction|background|poster|srcset|xlink:href)\s*=\s*)(["'])\s*data\s*:(?!image\/(png|jpe?g|gif|webp|svg\+xml);)[^"']*\2/gi, '$1$2#blocked$2');

  // 5) HTML comment icindeki conditional IE yorumlarini temizle (<!--[if IE]>...<![endif]-->)
  html = html.replace(/<!--\[if[\s\S]*?endif\]-->/gi, '');

  // 6) srcdoc attribute (iframe srcdoc XSS)
  html = html.replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  return html;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Editor veya admin doğrulama — cookie + Firebase ID token + Firestore rol + permission
  const auth = await checkAuth(request, env, 'editor');
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Yetkisiz', detail: auth.error }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  // Admin her zaman gönderebilir; editörün canSendMail yetkisi olmalı
  if (auth.role !== 'admin') {
    var perms = auth.permissions || {};
    if (perms.canSendMail === false) {
      return new Response(JSON.stringify({ error: 'Mail gönderme yetkiniz yok. Yönetici ile iletişime geçin.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
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

  // HTML sanitization — script/event handler/javascript: strip (editor hesabi compromise case'i)
  const cleanHtml = sanitizeEmailHtml(html);
  const cleanSubject = String(subject || '').replace(/[\r\n]/g, '').substring(0, 200); // CRLF injection onleme

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
          subject: cleanSubject,
          html: cleanHtml,
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
