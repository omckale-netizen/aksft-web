// Email bazlı brute force koruması — dağıtık saldırılarda IP bazlı koruma yetmez
// Aynı e-postaya 100 farklı IP'den denense bile bu sayaç yakalar

export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some(o => referer.startsWith(o));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.CHAT_KV) {
    return new Response(JSON.stringify({ locked: false, attempts: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const email = String(body.email || '').trim().toLowerCase();
  const action = String(body.action || 'check'); // 'check' | 'fail' | 'success'

  if (!email || email.length > 100) {
    return new Response(JSON.stringify({ error: 'Geçersiz email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // E-posta hash'le — KV key'de cleartext tutmamak için
  const emailHash = await sha256(email);
  const LOCK_WINDOW_SEC = 900; // 15 dakika
  const MAX_ATTEMPTS = 10; // 15 dk içinde 10 başarısız
  const countKey = 'login_email_' + emailHash;
  const lockKey = 'login_email_lock_' + emailHash;

  // Lock durumu kontrolü
  const lockedUntil = await env.CHAT_KV.get(lockKey);
  if (lockedUntil) {
    const remaining = parseInt(lockedUntil) - Math.floor(Date.now() / 1000);
    if (remaining > 0) {
      return new Response(JSON.stringify({ locked: true, remaining, reason: 'email_lockout' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (action === 'check') {
    const attempts = parseInt(await env.CHAT_KV.get(countKey) || '0');
    return new Response(JSON.stringify({ locked: false, attempts }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'success') {
    // Başarılı giriş — sayaçları sıfırla
    try { await env.CHAT_KV.delete(countKey); } catch(e) {}
    try { await env.CHAT_KV.delete(lockKey); } catch(e) {}
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'fail') {
    const attempts = parseInt(await env.CHAT_KV.get(countKey) || '0') + 1;
    await env.CHAT_KV.put(countKey, String(attempts), { expirationTtl: LOCK_WINDOW_SEC });

    if (attempts >= MAX_ATTEMPTS) {
      // 15 dakika kilitle
      const until = Math.floor(Date.now() / 1000) + LOCK_WINDOW_SEC;
      await env.CHAT_KV.put(lockKey, String(until), { expirationTtl: LOCK_WINDOW_SEC });
      return new Response(JSON.stringify({ locked: true, remaining: LOCK_WINDOW_SEC, reason: 'email_lockout_triggered' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ locked: false, attempts, remaining: MAX_ATTEMPTS - attempts }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Bilinmeyen işlem' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
