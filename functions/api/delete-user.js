// Kullanıcı tamamen sil — Firebase Auth + Firestore + presence + opsiyonel storage
// - Admin-only
// - Service account ile identitytoolkit accounts:delete ile auth hesabı silinir
// - Firestore: users/{uid}, presence/{uid} silinir
// - Avatar (varsa) silinmez — storage rules kullanıcının kendi klasöründe, temizleme opsiyonel

import { checkAuth } from './_verify.js';

const FIREBASE_API_KEY = 'AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs';
const FIRESTORE_PROJECT = 'assosu-kesfet';

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

  // Admin doğrulaması
  const auth = await checkAuth(request, env, 'admin');
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Yetkisiz', detail: auth.error }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Body parse
  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Geçersiz JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

  const uid = String(body.uid || '').trim();
  if (!uid) {
    return new Response(JSON.stringify({ error: 'UID gerekli' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Admin kendi kendini silemez
  if (uid === auth.uid) {
    return new Response(JSON.stringify({ error: 'Kendi hesabınızı silemezsiniz' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Service account kontrol
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

    // 0) Önce users/{uid} belgesini okuyup email'i al (activity_logs temizliği için)
    let deletedEmail = '';
    try {
      const userGetResp = await fetch('https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT + '/databases/(default)/documents/users/' + uid, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      if (userGetResp.ok) {
        const userData = await userGetResp.json();
        if (userData.fields && userData.fields.email && userData.fields.email.stringValue) {
          deletedEmail = userData.fields.email.stringValue;
        }
      }
    } catch(e) { console.warn('[delete-user] user get:', e); }

    // 1) Firebase Auth hesabını sil
    const authDelResp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key=' + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
      body: JSON.stringify({ localId: uid })
    });
    const authDelData = await authDelResp.json().catch(() => ({}));
    const authDeleted = authDelResp.ok || (authDelData.error && authDelData.error.message === 'USER_NOT_FOUND');
    if (!authDeleted && authDelResp.status !== 404) {
      console.warn('[delete-user] auth delete error:', authDelData);
    }

    // 2) Firestore: users/{uid} belgesini sil
    let firestoreDeleted = false;
    try {
      const fsResp = await fetch('https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT + '/databases/(default)/documents/users/' + uid, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      firestoreDeleted = fsResp.ok || fsResp.status === 404;
    } catch(e) { console.warn('[delete-user] firestore users delete:', e); }

    // 3) Presence belgesini temizle
    try {
      await fetch('https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT + '/databases/(default)/documents/presence/' + uid, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
    } catch(e) {}

    // 4) activity_logs temizliği — bu email'in geçmiş loglarını sil
    //    Aynı email ile yeni kullanıcı oluşturulunca eski logları görmesin
    let logsCleared = 0;
    if (deletedEmail) {
      logsCleared = await deleteDocsWhere(accessToken, 'activity_logs', 'user', deletedEmail);
    }

    // 5) sent_mails temizliği — bu email'in gönderdikleri (admin silindi, onun mailleri de yok)
    let mailsCleared = 0;
    if (deletedEmail) {
      mailsCleared = await deleteDocsWhere(accessToken, 'sent_mails', 'user', deletedEmail);
    }

    // 6) Audit log — admin'in email'iyle yeni kayıt
    try {
      await fetch('https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT + '/databases/(default)/documents/activity_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
        body: JSON.stringify({
          fields: {
            action: { stringValue: 'admin_delete_user' },
            target: { stringValue: uid },
            details: { stringValue: 'Kullanıcı tamamen silindi: ' + (deletedEmail || uid) + ' (logs: ' + logsCleared + ', mails: ' + mailsCleared + ')' },
            user: { stringValue: auth.email || 'unknown' },
            userRole: { stringValue: auth.role || 'admin' },
            timestamp: { stringValue: new Date().toISOString() }
          }
        })
      });
    } catch(e) {}

    return new Response(JSON.stringify({
      ok: true,
      authDeleted,
      firestoreDeleted,
      logsCleared,
      mailsCleared,
      deletedEmail,
      uid
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch(err) {
    console.error('[delete-user] error:', err);
    return new Response(JSON.stringify({ error: 'İşlem hatası: ' + (err.message || '') }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions(context) {
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }});
}

// ═══ Firestore koleksiyonundan field==value eşleşen dokümanları toplu sil ═══
async function deleteDocsWhere(accessToken, collection, field, value) {
  try {
    // 1) Query with runQuery (structuredQuery)
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: { stringValue: value }
          }
        },
        limit: 500
      }
    };
    const queryResp = await fetch('https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT + '/databases/(default)/documents:runQuery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
      body: JSON.stringify(queryBody)
    });
    if (!queryResp.ok) {
      console.warn('[deleteDocsWhere] query fail:', collection, await queryResp.text().catch(() => ''));
      return 0;
    }
    const rows = await queryResp.json();
    const docPaths = (rows || []).filter(r => r.document && r.document.name).map(r => r.document.name);

    // 2) Her dokümanı tek tek sil (paralel)
    let deleted = 0;
    await Promise.all(docPaths.map(async function(path) {
      try {
        // path = 'projects/xxx/databases/(default)/documents/activity_logs/abc123'
        const delResp = await fetch('https://firestore.googleapis.com/v1/' + path, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (delResp.ok) deleted++;
      } catch(e) {}
    }));
    return deleted;
  } catch(e) {
    console.warn('[deleteDocsWhere] error:', e);
    return 0;
  }
}

// ═══ Service Account JWT → Google OAuth Access Token ═══
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
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
    .replace(/\\n/g, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
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
