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

    // İletişim formu — gönderene otomatik cevap maili
    if (type === 'message' && data.email && env.RESEND_API_KEY) {
      try {
        const userName = sanitize(data.name, 50) || 'Ziyaretçi';
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: "Assos'u Keşfet <info@assosukesfet.com>",
            to: [data.email],
            subject: 'Mesajınız Alındı — Assos\'u Keşfet',
            reply_to: 'info@assosukesfet.com',
            html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F0EDE8;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1A2744 0%,#2D3E5F 100%);border-radius:16px 16px 0 0;padding:28px 28px;text-align:center;">
    <img src="https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Flogo.png?alt=media" alt="Assos'u Kesfet" style="height:48px;margin-bottom:10px;" />
    <p style="margin:0;font-size:.82rem;color:rgba(255,255,255,.6);">Assos'un Dijital Keşif Rehberi</p>
  </div>

  <!-- Body -->
  <div style="background:#ffffff;padding:32px 28px;border-left:1px solid #E8E4DE;border-right:1px solid #E8E4DE;">

    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:52px;height:52px;border-radius:50%;background:rgba(56,161,105,.1);line-height:52px;font-size:1.5rem;">&#x2705;</div>
    </div>

    <h2 style="text-align:center;margin:0 0 8px;font-size:1.15rem;color:#1A2744;">Mesajınız Bize Ulaştı!</h2>
    <p style="text-align:center;margin:0 0 28px;font-size:.88rem;color:#718096;">En kısa sürede size dönüş yapacağız.</p>

    <p style="font-size:.95rem;line-height:1.7;color:#1A2744;">Merhaba <strong>${userName}</strong>,</p>
    <p style="font-size:.9rem;line-height:1.7;color:#4A5568;">Mesajınızı aldık ve ekibimiz incelemeye başladı. Genellikle <strong>24 saat içinde</strong> dönüş sağlıyoruz.</p>

    <!-- Mesaj Kutusu -->
    <div style="background:#FAF7F2;border-radius:12px;padding:20px 22px;margin:24px 0;border-left:4px solid #C4521A;">
      <table style="width:100%;border-collapse:collapse;">
        ${data.subject ? '<tr><td style="font-size:.72rem;color:#A0AEC0;padding:0 0 4px;font-weight:600;width:60px;vertical-align:top;">Konu</td><td style="font-size:.85rem;color:#1A2744;padding:0 0 4px;font-weight:600;">' + sanitize(data.subject, 100) + '</td></tr>' : ''}
        <tr><td style="font-size:.72rem;color:#A0AEC0;padding:4px 0;font-weight:600;width:60px;vertical-align:top;">Mesaj</td><td style="font-size:.85rem;color:#1A2744;padding:4px 0;line-height:1.6;">${sanitize(data.message, 500)}</td></tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="https://assosukesfet.com" style="display:inline-block;padding:12px 28px;background:#C4521A;color:#fff;border-radius:10px;font-size:.88rem;font-weight:700;text-decoration:none;">Assos'u Keşfetmeye Devam Et</a>
    </div>

    <!-- İmza -->
    <hr style="border:none;border-top:1px solid #E8E4DE;margin:24px 0 20px;">
    <table style="width:100%"><tr>
      <td style="vertical-align:middle;width:44px;padding-right:14px;"><img src="https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Flogo.png?alt=media" alt="" style="width:40px;height:40px;border-radius:10px;object-fit:contain;" /></td>
      <td style="vertical-align:middle;">
        <p style="margin:0 0 2px;font-size:.88rem;font-weight:700;color:#1A2744;">Assos'u Keşfet</p>
        <table style="border-collapse:collapse;">
          <tr><td style="font-size:.72rem;color:#A0AEC0;padding:1px 6px 1px 0;">&#x2709;</td><td style="font-size:.72rem;"><a href="mailto:info@assosukesfet.com" style="color:#C4521A;text-decoration:none;">info@assosukesfet.com</a></td></tr>
          <tr><td style="font-size:.72rem;color:#A0AEC0;padding:1px 6px 1px 0;">&#x1F310;</td><td style="font-size:.72rem;"><a href="https://assosukesfet.com" style="color:#C4521A;text-decoration:none;">assosukesfet.com</a></td></tr>
          <tr><td style="font-size:.72rem;color:#A0AEC0;padding:1px 6px 1px 0;">&#x1F4F8;</td><td style="font-size:.72rem;"><a href="https://instagram.com/assosukesfet" style="color:#C4521A;text-decoration:none;">@assosukesfet</a></td></tr>
        </table>
      </td>
    </tr></table>
  </div>

  <!-- Footer -->
  <div style="background:#1A2744;border-radius:0 0 16px 16px;padding:24px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:.72rem;color:rgba(255,255,255,.5);">Bu mail otomatik olarak gönderilmiştir.</p>
    <p style="margin:0;font-size:.72rem;color:rgba(255,255,255,.5);">Yanıtlamak için doğrudan bu maile cevap yazabilirsiniz.</p>
    <p style="margin:12px 0 0;font-size:.65rem;color:rgba(255,255,255,.3);">&copy; ${new Date().getFullYear()} Assos'u Keşfet &bull; assosukesfet.com</p>
  </div>

</div>
</body></html>`
          })
        });
      } catch(mailErr) { /* mail hatası telegram'ı engellemesin */ }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Send failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
