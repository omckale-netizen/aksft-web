export async function onRequestPost(context) {
  const request = context.request;
  const env = context.env || {};

  // Origin kontrolu — sadece kendi sitemizden gelen istekler
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const isAllowed = allowedOrigins.some(o => origin.startsWith(o) || referer.startsWith(o));

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

  // Honeypot kontrolü — bot tuzağı (iletişim formu)
  if (type === 'message' && data._hp) {
    // Honeypot alanı doldurulmuş — bot
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Server-side rate limit (iletişim formu)
  if (type === 'message') {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    try {
      if (env.CHAT_KV) {
        // Dakikada 2 mesaj
        var minKey = 'contact_min_' + ip + '_' + Math.floor(Date.now() / 60000);
        var minCount = parseInt(await env.CHAT_KV.get(minKey) || '0');
        if (minCount >= 2) {
          return new Response(JSON.stringify({ error: 'Çok hızlı mesaj gönderiyorsunuz. Lütfen biraz bekleyin.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
        }
        await env.CHAT_KV.put(minKey, String(minCount + 1), { expirationTtl: 60 });

        // Günde 5 mesaj
        var today = new Date().toISOString().split('T')[0];
        var dayKey = 'contact_day_' + ip + '_' + today;
        var dayCount = parseInt(await env.CHAT_KV.get(dayKey) || '0');
        if (dayCount >= 5) {
          return new Response(JSON.stringify({ error: 'Günlük mesaj limitinize ulaştınız. Yarın tekrar deneyebilirsiniz.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
        }
        await env.CHAT_KV.put(dayKey, String(dayCount + 1), { expirationTtl: 86400 });
      }
    } catch(e) {}
  }

  const allowedTypes = ['login', 'login_blocked', 'message', 'backup', 'premium', 'security', 'password'];
  if (!allowedTypes.includes(type)) {
    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const TOKEN = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const CHAT_ID = String(env.TELEGRAM_CHAT_ID || '564543310').trim();

  if (!TOKEN) {
    return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  function sanitize(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>&"']/g, '').substring(0, maxLen || 200);
  }

  let text = '';

  if (type === 'login') {
    text = '━━━━━━━━━━━━━━━━━━━━\n';
    text += '\u{1F510} ADMIN GIRISI\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += '\u{1F4C5} ' + sanitize(data.date, 50) + '\n';
    text += '\u{1F464} ' + sanitize(data.email, 100) + '\n';
    if (data.ip) text += '\u{1F310} IP: ' + sanitize(data.ip, 45) + '\n';
    if (data.device) text += '\u{1F4F1} ' + sanitize(data.device, 100);

  } else if (type === 'login_blocked') {
    text = '━━━━━━━━━━━━━━━━━━━━\n';
    text += '\u{1F6A8} BASARISIZ GIRIS UYARISI\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += '\u{1F464} ' + sanitize(data.email, 100) + '\n';
    text += '\u{1F6AB} ' + sanitize(String(data.attempts || '?'), 5) + ' basarisiz deneme\n';
    text += '\u{1F512} Hesap kitlendi\n';
    if (data.ip) text += '\u{1F310} IP: ' + sanitize(data.ip, 45) + '\n';
    if (data.device) text += '\u{1F4F1} ' + sanitize(data.device, 100);

  } else if (type === 'message') {
    text = '━━━━━━━━━━━━━━━━━━━━\n';
    text += '\u{1F4E9} YENI ILETISIM MESAJI\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += '\u{1F464} ' + sanitize(data.name, 100) + '\n';
    text += '\u{1F4E7} ' + sanitize(data.email, 100) + '\n';
    if (data.phone) text += '\u{1F4DE} ' + sanitize(data.phone, 30) + '\n';
    text += '\u{1F4CB} Konu: ' + sanitize(data.subject || 'Genel', 50) + '\n\n';
    text += '\u{1F4AC} ' + sanitize(data.message, 500);

  } else if (type === 'backup') {
    text = '━━━━━━━━━━━━━━━━━━━━\n';
    text += '\u{1F4BE} YEDEKLEME ' + (sanitize(data.backupType, 20) === 'auto' ? '(OTOMATIK)' : '(MANUEL)') + '\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += '\u{2705} Yedekleme tamamlandi\n';
    text += '\u{1F4C1} ' + sanitize(data.fileName, 100) + '\n';
    text += '\u{1F4BE} ' + sanitize(data.size, 20) + '\n';
    text += '\u{1F4C5} ' + sanitize(data.date, 50);

  } else if (type === 'premium') {
    text = '━━━━━━━━━━━━━━━━━━━━\n';
    text += '\u{1F451} PREMIUM BILDIRIM\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += sanitize(data.message, 500);

  } else if (type === 'security') {
    text = '━━━━━━━━━━━━━━━━━━━━\n';
    text += '\u{1F6E1} GUVENLIK UYARISI\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += sanitize(data.message, 500);

  } else if (type === 'password') {
    text = '━━━━━━━━━━━━━━━━━━━━\n';
    text += '\u{1F511} SIFRE DEGISTIRILDI\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';
    text += '\u{1F464} ' + sanitize(data.email, 100) + '\n';
    text += '\u{1F4C5} ' + sanitize(data.date, 50) + '\n';
    if (data.ip) text += '\u{1F310} IP: ' + sanitize(data.ip, 45) + '\n';
    if (data.device) text += '\u{1F4F1} ' + sanitize(data.device, 100);
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
