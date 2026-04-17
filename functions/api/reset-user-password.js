// Admin tarafından kullanıcı şifresi sıfırlama
// Firebase Admin REST API + Service Account JWT ile çalışır
//
// Gereken env variables (Cloudflare Pages → Settings → Environment variables):
// - FIREBASE_SERVICE_ACCOUNT: Service account JSON'u (tüm string olarak)
//   Firebase Console → Project Settings → Service Accounts → Generate new private key
// - ADMIN_GATE_KEY: Mevcut admin gate key (değişmiyor)
//
// Endpoint: POST /api/reset-user-password
// Body: { uid: "USER_UID", newPassword: "yeniŞifre" }
// Auth: Admin gate cookie + Firebase ID token (sadece admin rolündeki kullanıcı çağırabilir)

import { requireAdmin } from './_verify.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Admin doğrulama — cookie + Firebase ID token
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Service account kontrol
  if (!env.FIREBASE_SERVICE_ACCOUNT) {
    return new Response(JSON.stringify({ error: 'Firebase service account tanımlı değil. Cloudflare env\'e FIREBASE_SERVICE_ACCOUNT ekleyin.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Body parse
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const uid = String(body.uid || '').trim();
  const newPassword = String(body.newPassword || '');

  if (!uid) {
    return new Response(JSON.stringify({ error: 'UID gerekli' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  if (!newPassword || newPassword.length < 8) {
    return new Response(JSON.stringify({ error: 'Şifre en az 8 karakter olmalı' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Service account JSON'u parse et — birden fazla formatı destekle
    let sa;
    try {
      sa = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
    } catch(e) {
      return new Response(JSON.stringify({ error: 'Service account JSON geçersiz: ' + (e.message || 'parse hatası') + '. Cloudflare env\'e JSON\'u tek satır halinde yapıştırın veya base64 encode edip ekleyin.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Google OAuth access token al (service account JWT ile)
    const accessToken = await getAccessToken(sa);

    // Firebase Admin API ile şifreyi değiştir
    const resp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + (env.FIREBASE_API_KEY || 'AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken,
      },
      body: JSON.stringify({
        localId: uid,
        password: newPassword,
        returnSecureToken: false,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      const msg = (errData.error && errData.error.message) || 'Firebase güncelleme hatası';
      return new Response(JSON.stringify({ error: msg }), {
        status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, message: 'Şifre başarıyla değiştirildi' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch(err) {
    console.error('Password reset error:', err);
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

// ═══ Service Account JSON Parser (çoklu format desteği) ═══
// Cloudflare env'e yapıştırırken JSON bozulabiliyor — farklı formatları dene
function parseServiceAccount(raw) {
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT tanımlı değil');
  if (typeof raw === 'object') return raw;
  const str = String(raw).trim();

  // 1) Doğrudan JSON parse
  try {
    return JSON.parse(str);
  } catch(e1) {
    // 2) Base64 encoded olabilir mi?
    try {
      const decoded = atob(str);
      return JSON.parse(decoded);
    } catch(e2) { /* devam */ }

    // 3) private_key içinde gerçek newline varsa kaçır (en sık hata)
    try {
      // private_key'in değerindeki gerçek \n karakterlerini \\n'e çevir
      const repaired = str.replace(/("private_key"\s*:\s*")([\s\S]*?)(",)/, (m, a, body, c) => {
        return a + body.replace(/\r?\n/g, '\\n') + c;
      });
      return JSON.parse(repaired);
    } catch(e3) { /* devam */ }

    throw new Error(e1.message);
  }
}

// ═══ Service Account JWT → Google OAuth Access Token ═══
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/identitytoolkit',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const jwt = await signJWT(payload, serviceAccount.private_key);

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(jwt),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error('OAuth token alınamadı: ' + txt);
  }
  const data = await resp.json();
  return data.access_token;
}

// RS256 ile JWT imzala
async function signJWT(payload, privateKeyPem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  // PEM → ArrayBuffer
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(data)
  );

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
