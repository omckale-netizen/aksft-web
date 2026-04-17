// Güvenli şifre sıfırlama endpoint'i
// - IP bazlı rate limit (5 dakikada max 3 istek)
// - Sadece users koleksiyonunda kayıtlı e-postalara mail gönderir
// - User enumeration önleme: kayıtlı olsun olmasın başarılı yanıt döner

const FIREBASE_API_KEY = 'AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs';

export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some(o => referer.startsWith(o));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 100) {
    return new Response(JSON.stringify({ error: 'Geçerli bir e-posta girin' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // IP bazlı rate limit — 5 dk'da max 3 istek
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.CHAT_KV) {
    try {
      const winKey = 'forgot_ip_' + ip + '_' + Math.floor(Date.now() / 300000); // 5 dk pencere
      const count = parseInt(await env.CHAT_KV.get(winKey) || '0');
      if (count >= 3) {
        return new Response(JSON.stringify({ error: 'Çok fazla istek. Lütfen 5 dakika sonra tekrar deneyin.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      await env.CHAT_KV.put(winKey, String(count + 1), { expirationTtl: 300 });

      // E-posta bazlı rate limit — aynı e-postaya günlük max 3
      const emailHash = await sha256(email);
      const dayKey = 'forgot_email_' + emailHash + '_' + new Date().toISOString().split('T')[0];
      const emailCount = parseInt(await env.CHAT_KV.get(dayKey) || '0');
      if (emailCount >= 3) {
        // Sessizce başarılı yanıt dön — saldırgan rate limit var anlayamasın
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      await env.CHAT_KV.put(dayKey, String(emailCount + 1), { expirationTtl: 86400 });
    } catch(e) {}
  }

  // Firebase Auth'ta bu e-posta kayıtlı mı? (createAuthUri endpoint)
  let isRegistered = false;
  try {
    const checkResp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=' + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, continueUri: 'https://assosukesfet.com/admin-login' })
    });
    if (checkResp.ok) {
      const checkData = await checkResp.json();
      isRegistered = checkData.registered === true;
    }
  } catch(e) { /* sessizce geç */ }

  // Super admin e-postasına her zaman izin ver (kurtarma)
  if (!isRegistered && email === 'info@onyedimedya.com') isRegistered = true;

  // Kayıtlı DEĞİLSE — sessizce başarılı dön (user enumeration önleme)
  if (!isRegistered) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Firebase Identity Toolkit REST API ile şifre sıfırlama maili gönder
  try {
    const resp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: email
      })
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      console.error('sendOobCode error:', errData);
      // EMAIL_NOT_FOUND gelirse bile sessizce başarılı dön
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch(e) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
