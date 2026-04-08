export async function onRequestPost(context) {
  const request = context.request;
  const env = context.env || {};

  // Origin kontrolu — sadece kendi sitemizden gelen istekler
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const isAllowed = allowedOrigins.some(o => origin.startsWith(o) || referer.startsWith(o))
    || origin.includes('.pages.dev') || referer.includes('.pages.dev');

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { type, data } = body || {};
  if (!type || !data) {
    return new Response(JSON.stringify({ error: 'Missing type or data' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Bilinen type kontrolu
  const allowedTypes = ['login', 'login_blocked', 'message'];
  if (!allowedTypes.includes(type)) {
    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const TOKEN = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const CHAT_ID = String(env.TELEGRAM_CHAT_ID || '564543310').trim();

  if (!TOKEN) {
    return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Input sanitizasyon — HTML/script injection onleme
  function sanitize(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>&"']/g, '').substring(0, maxLen || 200);
  }

  let text = '';
  if (type === 'login') {
    text = '\u{1F510} Admin panele giris yapildi\n\u{1F4C5} ' + sanitize(data.date, 50) + '\n\u{1F464} ' + sanitize(data.email, 100);
    if (data.ip) text += '\n\u{1F310} IP: ' + sanitize(data.ip, 45);
    if (data.device) text += '\n\u{1F4F1} Cihaz: ' + sanitize(data.device, 100);
  } else if (type === 'login_blocked') {
    text = '\u{1F6A8} UYARI: Basarisiz giris denemeleri!\n\u{1F4C5} ' + sanitize(data.date, 50) + '\n\u{1F464} ' + sanitize(data.email, 100) + '\n\u{1F6AB} ' + sanitize(String(data.attempts || '?'), 5) + ' basarisiz deneme — hesap kitlendi';
    if (data.ip) text += '\n\u{1F310} IP: ' + sanitize(data.ip, 45);
    if (data.device) text += '\n\u{1F4F1} Cihaz: ' + sanitize(data.device, 100);
  } else if (type === 'message') {
    text = '\u{1F4E9} Yeni iletisim mesaji!\n\u{1F464} ' + sanitize(data.name, 100) + '\n\u{1F4E7} ' + sanitize(data.email, 100);
    if (data.phone) text += '\n\u{1F4DE} ' + sanitize(data.phone, 20);
    text += '\n\u{1F4CB} ' + sanitize(data.subject || 'Genel', 50) + '\n\u{1F4AC} ' + sanitize(data.message, 500);
  }

  try {
    await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text })
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Send failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
