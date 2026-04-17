// Tüm cihazlardan çıkış (revoke refresh tokens)
// - Admin herhangi bir kullanıcının oturumlarını kapatır (uid body'de verilir)
// - Her kullanıcı KENDİ oturumlarını kapatabilir (uid verilmezse auth.uid kullanılır)
// - Service account ile identitytoolkit accounts:update → validSince set edilir
//   validSince'ten önce issue edilen ID token'lar geçersiz olur
//
// Body: { uid?: string }  // admin için gerekli, self-logout için opsiyonel
// Return: { ok: true } veya { error: ... }

import { checkAuth } from './_verify.js';

const FIREBASE_API_KEY = 'AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs';

export async function onRequestPost(context) {
  const { request, env } = context;

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

  // Self-logout için editor+ yeterli; başka kullanıcıyı kickletme admin
  const auth = await checkAuth(request, env, 'editor');
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Yetkisiz', detail: auth.error }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const targetUid = String(body.uid || '').trim() || auth.uid;

  // Başkasının session'ını kapatma → admin şart
  if (targetUid !== auth.uid && auth.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Başka kullanıcının oturumunu kapatmak için admin yetkisi gerekli' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Service account — CLIENT_EMAIL + PRIVATE_KEY (veya JSON)
  const hasSplit = !!(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
  if (!hasSplit && !env.FIREBASE_SERVICE_ACCOUNT) {
    return new Response(JSON.stringify({ error: 'Service account tanımlı değil' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const sa = hasSplit ? {
      client_email: String(env.FIREBASE_CLIENT_EMAIL).trim(),
      private_key: String(env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n')
    } : JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);

    const accessToken = await getAccessToken(sa);

    // accounts:update → validSince = now (saniye)
    // validSince'ten önce issue edilmiş tüm ID token'lar geçersiz olur
    const nowSec = Math.floor(Date.now() / 1000);
    const resp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
      body: JSON.stringify({ localId: targetUid, validSince: String(nowSec) })
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      const msg = (errData.error && errData.error.message) || 'Oturum iptal hatası';
      return new Response(JSON.stringify({ error: msg }), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Audit log — Firestore'a service account ile yaz
    try {
      const PROJECT = 'assosu-kesfet';
      await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/activity_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
        body: JSON.stringify({
          fields: {
            action: { stringValue: targetUid === auth.uid ? 'self_logout_all' : 'admin_revoke_sessions' },
            target: { stringValue: targetUid },
            details: { stringValue: 'Tüm oturumlar kapatıldı (validSince=' + nowSec + ')' },
            user: { stringValue: auth.email || 'unknown' },
            userRole: { stringValue: auth.role || 'editor' },
            timestamp: { stringValue: new Date().toISOString() }
          }
        })
      }).catch(() => {});
    } catch(e) {}

    return new Response(JSON.stringify({ ok: true, targetUid, validSince: nowSec }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch(err) {
    console.error('[revoke-sessions] error:', err);
    return new Response(JSON.stringify({ error: 'İşlem hatası: ' + (err.message || 'bilinmeyen') }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions(context) {
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// ═══ Service Account JWT → Google OAuth Access Token ═══
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const jwt = await signJWT(payload, sa.private_key);
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(jwt),
  });
  if (!resp.ok) throw new Error('OAuth token alınamadı');
  const data = await resp.json();
  return data.access_token;
}

async function signJWT(payload, privateKeyPem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(data));
  const sigB64 = base64UrlEncodeBytes(new Uint8Array(signature));
  return `${data}.${sigB64}`;
}

function base64UrlEncode(str) {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function base64UrlEncodeBytes(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
