export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body || {};
  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Telegram config missing' });
  }

  let text = '';
  if (type === 'login') {
    text = '\u{1F510} Admin panele giris yapildi\n\u{1F4C5} ' + (data.date || '') + '\n\u{1F464} ' + (data.email || '');
  } else if (type === 'message') {
    text = '\u{1F4E9} Yeni iletisim mesaji!\n\u{1F464} ' + (data.name || '') + '\n\u{1F4E7} ' + (data.email || '');
    if (data.phone) text += '\n\u{1F4DE} ' + data.phone;
    text += '\n\u{1F4CB} ' + (data.subject || 'Genel') + '\n\u{1F4AC} ' + (data.message || '').substring(0, 200);
  } else {
    return res.status(400).json({ error: 'Unknown type' });
  }

  try {
    await fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text })
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Telegram send failed' });
  }
}
