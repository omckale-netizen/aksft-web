// Firebase ID Token doğrulama helper
// Admin endpoint'ler için cookie + token çift kontrolü
// Rol tabanlı yetki: super admin, users koleksiyonu rol alanı (admin/editor)

const SUPER_ADMIN_EMAIL = 'info@onyedimedya.com';
const FIREBASE_API_KEY = 'AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs';
const FIRESTORE_PROJECT = 'assosu-kesfet';

/**
 * Firebase ID token'ı Google'a doğrulatır.
 * @returns {Promise<{valid: boolean, email?: string, uid?: string, error?: string}>}
 */
export async function verifyFirebaseToken(token, env) {
  if (!token || typeof token !== 'string' || token.length < 20) {
    return { valid: false, error: 'Token eksik veya geçersiz' };
  }

  // KV cache — aynı token tekrar tekrar Google'a gitmesin (5 dk)
  const tokenHash = await sha256(token);
  if (env && env.CHAT_KV) {
    try {
      const cached = await env.CHAT_KV.get('tok_' + tokenHash);
      if (cached) {
        const [e, u] = cached.split('|');
        if (e && u && e !== 'INVALID') return { valid: true, email: e, uid: u };
        if (cached === 'INVALID') return { valid: false, error: 'Token geçersiz (cached)' };
      }
    } catch(e) {}
  }

  try {
    const resp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });

    if (!resp.ok) {
      if (env && env.CHAT_KV) {
        try { await env.CHAT_KV.put('tok_' + tokenHash, 'INVALID', { expirationTtl: 60 }); } catch(e) {}
      }
      return { valid: false, error: 'Token Google tarafından reddedildi' };
    }

    const data = await resp.json();
    const user = data.users && data.users[0];
    if (!user) return { valid: false, error: 'Kullanıcı bulunamadı' };

    if (env && env.CHAT_KV) {
      try { await env.CHAT_KV.put('tok_' + tokenHash, user.email + '|' + user.localId, { expirationTtl: 300 }); } catch(e) {}
    }
    return { valid: true, email: user.email, uid: user.localId };
  } catch (err) {
    return { valid: false, error: 'Token doğrulama hatası: ' + err.message };
  }
}

/**
 * Kullanıcının rolünü Firestore users/{uid} dokümanından okur.
 * Super admin (SUPER_ADMIN_EMAIL) her zaman 'admin' döner.
 * Firebase ID token ile authenticated istek atar — kullanıcı kendi dokümanını okuyabilir (firestore rules).
 */
export async function getUserRole(uid, email, idToken) {
  if (email === SUPER_ADMIN_EMAIL) return { role: 'admin', active: true };
  if (!uid || !idToken) return { role: null, active: false };
  try {
    const resp = await fetch(`https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/users/${uid}`, {
      headers: { 'Authorization': 'Bearer ' + idToken }
    });
    if (!resp.ok) return { role: null, active: false };
    const data = await resp.json();
    const fields = data.fields || {};
    const role = fields.role && fields.role.stringValue;
    const active = fields.active && fields.active.booleanValue;
    return { role: role || null, active: active !== false };
  } catch (e) {
    return { role: null, active: false };
  }
}

/**
 * Request'ten admin/editor auth durumunu döndürür.
 * - minRole: 'admin' (default) veya 'editor'
 * - Cookie + Firebase ID token + Firestore rol kontrolü
 */
export async function requireRole(request, env, minRole) {
  minRole = minRole || 'admin';
  // Cookie kontrolü
  const cookies = request.headers.get('Cookie') || '';
  const adminKey = request.headers.get('X-Admin-Key') || '';
  const hasGateCookie = env.ADMIN_GATE_KEY && cookies.includes('admin_gate=' + env.ADMIN_GATE_KEY);
  const hasGateHeader = env.ADMIN_GATE_KEY && adminKey === env.ADMIN_GATE_KEY;
  const hasCookie = hasGateCookie || hasGateHeader;
  if (!hasCookie) return { ok: false, error: 'Gate cookie eksik' };

  // Firebase ID token
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false, error: 'Token yok' };
  const tokenResult = await verifyFirebaseToken(token, env);
  if (!tokenResult.valid) return { ok: false, error: tokenResult.error || 'Token geçersiz' };

  // Rol kontrolü
  const { role, active } = await getUserRole(tokenResult.uid, tokenResult.email, token);
  if (!active) return { ok: false, error: 'Hesap pasif' };

  const roleRank = { admin: 3, editor: 2, viewer: 1 };
  const need = roleRank[minRole] || 3;
  const have = roleRank[role] || 0;
  if (have < need) return { ok: false, error: 'Yetki yetersiz (minRole=' + minRole + ', role=' + role + ')' };

  return { ok: true, email: tokenResult.email, uid: tokenResult.uid, role };
}

/**
 * Geriye dönük uyumluluk — admin mi kontrolü.
 * Artık SUPER_ADMIN_EMAIL dışında users.role='admin' olanları da kabul ediyor.
 */
export async function requireAdmin(request, env, opts) {
  const res = await requireRole(request, env, 'admin');
  return res.ok;
}

/**
 * Editor veya üstü (admin dahil)
 */
export async function requireEditor(request, env) {
  const res = await requireRole(request, env, 'editor');
  return res.ok;
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
