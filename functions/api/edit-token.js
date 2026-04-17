// HMAC imzalı edit token üretici/doğrulayıcı
// Admin revizyon istediğinde: GET /api/edit-token?id=DOC_ID → {token, expires}
// Mekan-ekle edit modu: GET /api/edit-token?id=DOC_ID&token=XXX → {valid: true/false}

import { requireAdmin } from './_verify.js';

// Token üretim (admin için - imzalı)
export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Sadece admin token üretebilir
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

  const docId = String(body.id || '').trim();
  if (!docId || docId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(docId)) {
    return new Response(JSON.stringify({ error: 'Geçersiz ID' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // 30 günlük geçerli imzalı token
  const exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  const token = await signToken(docId, exp, env);

  return new Response(JSON.stringify({ token, exp }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Token doğrulama (public — mekan-ekle edit modu)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const docId = url.searchParams.get('id') || '';
  const token = url.searchParams.get('token') || '';

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some(o => referer.startsWith(o));
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!isAllowed) {
    return new Response(JSON.stringify({ valid: false, error: 'Yetkisiz erişim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (!docId || !token) {
    return new Response(JSON.stringify({ valid: false, error: 'ID veya token eksik' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const valid = await verifyToken(docId, token, env);
  return new Response(JSON.stringify({ valid }), {
    status: valid ? 200 : 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function onRequestOptions(context) {
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// HMAC-SHA256 imzalama
async function signToken(docId, exp, env) {
  const secret = env.EDIT_TOKEN_SECRET || env.ADMIN_GATE_KEY || 'fallback-secret-change-me';
  const payload = docId + '.' + exp;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  // Token formatı: exp.sig (base64 yerine hex kullanıyoruz URL-safe olması için)
  return exp + '.' + sigHex;
}

// Doğrulama — constant-time karşılaştırma ile
async function verifyToken(docId, token, env) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 2) return false;
    const exp = parseInt(parts[0]);
    const providedSig = parts[1];
    if (!exp || !providedSig) return false;

    // Süre kontrolü
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) return false;

    // Yeniden imzala ve karşılaştır
    const expected = await signToken(docId, exp, env);
    const expectedSig = expected.split('.')[1];

    // Constant-time karşılaştırma
    if (expectedSig.length !== providedSig.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
    }
    return diff === 0;
  } catch(e) {
    return false;
  }
}
