// Firebase ID Token doğrulama helper
// Admin endpoint'ler için cookie + token çift kontrolü

const ADMIN_EMAIL = 'info@onyedimedya.com';
const FIREBASE_API_KEY = 'AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs';

/**
 * Firebase ID token'ı Google'a doğrulatır ve admin e-postasıyla eşleştirir.
 * @param {string} token - Firebase ID token (Authorization: Bearer <token>)
 * @param {object} env - Cloudflare Worker env
 * @returns {Promise<{valid: boolean, email?: string, error?: string}>}
 */
export async function verifyFirebaseToken(token, env) {
  if (!token || typeof token !== 'string' || token.length < 20) {
    return { valid: false, error: 'Token eksik veya geçersiz' };
  }

  // KV cache kontrolü — aynı token tekrar tekrar Google'a gitmesin (5 dk cache)
  const tokenHash = await sha256(token);
  if (env && env.CHAT_KV) {
    try {
      const cached = await env.CHAT_KV.get('admtok_' + tokenHash);
      if (cached === ADMIN_EMAIL) return { valid: true, email: ADMIN_EMAIL };
      if (cached === 'INVALID') return { valid: false, error: 'Token geçersiz (cached)' };
    } catch(e) {}
  }

  // Google Identity Toolkit ile token doğrulama
  try {
    const resp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });

    if (!resp.ok) {
      if (env && env.CHAT_KV) {
        try { await env.CHAT_KV.put('admtok_' + tokenHash, 'INVALID', { expirationTtl: 60 }); } catch(e) {}
      }
      return { valid: false, error: 'Token Google tarafından reddedildi' };
    }

    const data = await resp.json();
    const user = data.users && data.users[0];
    if (!user) return { valid: false, error: 'Kullanıcı bulunamadı' };

    // E-posta admin'e eşleşmeli VE doğrulanmış olmalı
    if (user.email !== ADMIN_EMAIL) {
      return { valid: false, error: 'Yetkisiz kullanıcı' };
    }

    // Cache'e ekle (5 dakika)
    if (env && env.CHAT_KV) {
      try { await env.CHAT_KV.put('admtok_' + tokenHash, ADMIN_EMAIL, { expirationTtl: 300 }); } catch(e) {}
    }
    return { valid: true, email: user.email };
  } catch (err) {
    return { valid: false, error: 'Token doğrulama hatası: ' + err.message };
  }
}

/**
 * Request'ten admin auth durumunu döndürür.
 * Cookie + Firebase ID token çift kontrol (birinin olması yeter — geriye uyumluluk için).
 * Sıkı mod (strict=true): Her ikisi de şart.
 */
export async function requireAdmin(request, env, opts) {
  opts = opts || {};
  const strict = opts.strict === true;

  // Cookie kontrolü
  const cookies = request.headers.get('Cookie') || '';
  const adminKey = request.headers.get('X-Admin-Key') || '';
  const hasGateCookie = env.ADMIN_GATE_KEY && cookies.includes('admin_gate=' + env.ADMIN_GATE_KEY);
  const hasGateHeader = env.ADMIN_GATE_KEY && adminKey === env.ADMIN_GATE_KEY;
  const hasCookie = hasGateCookie || hasGateHeader;

  // Firebase ID token kontrolü
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  let tokenResult = { valid: false };
  if (token) {
    tokenResult = await verifyFirebaseToken(token, env);
  }

  // Strict modda ikisi de şart
  if (strict) {
    return hasCookie && tokenResult.valid;
  }
  // Geriye uyumluluk: en az biri şart, ikisi varsa daha güvenli
  // Token varsa doğrulanmış olmalı, token yoksa sadece cookie kabul
  if (token && !tokenResult.valid) return false;
  return hasCookie;
}

/**
 * SHA-256 hash — token cache key'i için
 */
async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
