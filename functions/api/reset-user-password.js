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

import { checkAuth } from './_verify.js';

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

  // Admin doğrulama + caller bilgisi (audit için)
  const auth = await checkAuth(request, env, 'admin');
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Yetkisiz', detail: auth.error }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Service account kontrol — JSON veya (client_email + private_key) ikilisi
  var hasJson = !!env.FIREBASE_SERVICE_ACCOUNT;
  var hasSplit = !!(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
  if (!hasJson && !hasSplit) {
    return new Response(JSON.stringify({ error: 'Firebase service account tanımlı değil. Cloudflare env\'e FIREBASE_SERVICE_ACCOUNT (tam JSON) veya FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (ayrı ayrı) ekleyin.' }), {
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

  // Rate limit — aynı hedef kullanıcı için saatte max 3 reset, aynı admin için dakikada max 5 reset
  if (env.CHAT_KV) {
    try {
      const hour = Math.floor(Date.now() / 3600000);
      const minute = Math.floor(Date.now() / 60000);
      const targetKey = 'reset_target_' + uid + '_' + hour;
      const adminKey = 'reset_admin_' + (auth.uid || 'unknown') + '_' + minute;
      const [tCount, aCount] = await Promise.all([
        env.CHAT_KV.get(targetKey).then(v => parseInt(v || '0')),
        env.CHAT_KV.get(adminKey).then(v => parseInt(v || '0')),
      ]);
      if (tCount >= 3) {
        return new Response(JSON.stringify({ error: 'Bu kullanıcı için saatte max 3 şifre sıfırlama yapılabilir. Lütfen bekleyin.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aCount >= 5) {
        return new Response(JSON.stringify({ error: 'Dakikada max 5 şifre sıfırlama yapabilirsiniz. Lütfen yavaşlayın.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      await Promise.all([
        env.CHAT_KV.put(targetKey, String(tCount + 1), { expirationTtl: 3600 }),
        env.CHAT_KV.put(adminKey, String(aCount + 1), { expirationTtl: 60 }),
      ]);
    } catch(e) { console.warn('Rate limit KV error:', e); }
  }

  try {
    // Service account — önce split env (CLIENT_EMAIL + PRIVATE_KEY), yoksa JSON parse
    let sa;
    if (hasSplit) {
      sa = {
        client_email: String(env.FIREBASE_CLIENT_EMAIL).trim(),
        private_key: String(env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n')
      };
    } else {
      try {
        sa = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
      } catch(e) {
        return new Response(JSON.stringify({ error: 'Service account JSON geçersiz: ' + (e.message || 'parse hatası') + '. Çözüm: JSON yerine FIREBASE_CLIENT_EMAIL ve FIREBASE_PRIVATE_KEY env var\'larını ayrı ekleyin.' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
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

    // AUDIT LOG — Firestore'a service account ile yaz (admin işlemini iz bırakır)
    try {
      const PROJECT = 'assosu-kesfet';
      const logBody = {
        fields: {
          action: { stringValue: 'admin_reset_password' },
          target: { stringValue: uid },
          details: { stringValue: 'Admin kullanıcı şifresini sıfırladı (hedef UID: ' + uid + ')' },
          user: { stringValue: auth.email || 'unknown' },
          userRole: { stringValue: auth.role || 'admin' },
          timestamp: { stringValue: new Date().toISOString() },
          ipHash: { stringValue: (request.headers.get('CF-Connecting-IP') || '').substring(0, 16) }
        }
      };
      await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/activity_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
        body: JSON.stringify(logBody)
      }).catch(e => console.warn('Audit log yazılamadı:', e));
    } catch(e) { console.warn('Audit log exception:', e); }

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

  const repairNewlines = (s) => s.replace(/("private_key"\s*:\s*")([\s\S]*?)(",)/, (m, a, body, c) => a + body.replace(/\r?\n/g, '\\n') + c);

  const tryVariants = (s) => {
    const variants = [
      s,
      repairNewlines(s),
      // Outer { } eksikse ekle
      s.startsWith('{') ? null : '{' + s + '}',
      s.startsWith('{') ? null : repairNewlines('{' + s + '}'),
      // İlk { ile son } arasını çıkar
      (() => {
        const first = s.indexOf('{');
        const last = s.lastIndexOf('}');
        return (first >= 0 && last > first) ? s.slice(first, last + 1) : null;
      })(),
      (() => {
        const first = s.indexOf('{');
        const last = s.lastIndexOf('}');
        return (first >= 0 && last > first) ? repairNewlines(s.slice(first, last + 1)) : null;
      })(),
    ].filter(Boolean);
    for (const v of variants) {
      try { return JSON.parse(v); } catch(e) {}
    }
    return null;
  };

  // 1) Çeşitli varyasyonları dene
  const parsed = tryVariants(str);
  if (parsed) return parsed;

  // 2) Base64 decode edip aynı varyasyonları dene
  try {
    const decoded = atob(str.replace(/\s/g, ''));
    const parsedB64 = tryVariants(decoded);
    if (parsedB64) return parsedB64;
  } catch(e) { /* base64 değil */ }

  // Hata mesajı — ilk 40 karakteri göster (debug için)
  const preview = str.slice(0, 40).replace(/\n/g, '\\n');
  throw new Error(`parse edilemedi. İlk 40 karakter: "${preview}..."`);
}

// ═══ Service Account JWT → Google OAuth Access Token ═══
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore',
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
