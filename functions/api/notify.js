export async function onRequestPost(context) {
  const request = context.request;
  const env = context.env || {};

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

  const TOKEN = env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ error: 'Telegram config missing', debug: Object.keys(env).join(',') || 'empty' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let text = '';
  if (type === 'login') {
    text = '\u{1F510} Admin panele giris yapildi\n\u{1F4C5} ' + (data.date || '') + '\n\u{1F464} ' + (data.email || '');
  } else if (type === 'message') {
    text = '\u{1F4E9} Yeni iletisim mesaji!\n\u{1F464} ' + (data.name || '') + '\n\u{1F4E7} ' + (data.email || '');
    if (data.phone) text += '\n\u{1F4DE} ' + data.phone;
    text += '\n\u{1F4CB} ' + (data.subject || 'Genel') + '\n\u{1F4AC} ' + (data.message || '').substring(0, 200);
  } else {
    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text })
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Telegram send failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
