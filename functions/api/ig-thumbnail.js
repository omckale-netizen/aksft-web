// Instagram Reel/Post thumbnail proxy + Firebase Storage cache
// Admin panel'den tek seferlik cagri — og:image cek, Firebase Storage'a kaydet,
// kalici URL don. Instagram CDN URL'leri expire olabilir, bu cache koruma saglar.
import { requireAdmin } from './_verify.js';

const BUCKET = 'assosu-kesfet.firebasestorage.app';

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

  // Admin yetki — spam/abuse onleme
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) {
    return json({ error: 'Yetkisiz' }, 401, corsHeaders);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Gecersiz istek' }, 400, corsHeaders); }

  const igUrl = String(body.url || '').trim();
  if (!igUrl || !/^https?:\/\/(www\.)?instagram\.com\//i.test(igUrl)) {
    return json({ error: 'Gecerli bir Instagram URL girin' }, 400, corsHeaders);
  }

  // Shortcode parse — /p/XXX veya /reel/XXX
  const match = igUrl.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
  if (!match) return json({ error: 'URL\'den shortcode cikarilamadi' }, 400, corsHeaders);
  const shortcode = match[2];

  try {
    // 1) Instagram sayfasini fetch et
    const igResp = await fetch('https://www.instagram.com/' + match[1] + '/' + shortcode + '/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      }
    });
    if (!igResp.ok) {
      return json({ error: 'Instagram sayfasi yuklenemedi (HTTP ' + igResp.status + ')' }, 502, corsHeaders);
    }
    const html = await igResp.text();

    // 2) og:image parse (HTML'de <meta property="og:image" content="...">)
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (!ogMatch) {
      return json({ error: 'Thumbnail bulunamadi (og:image yok — Instagram login wall olabilir)' }, 404, corsHeaders);
    }
    const thumbnailUrl = ogMatch[1].replace(/&amp;/g, '&');

    // 3) Title cekmeyi dene (og:title) — HTML entity'leri decode et
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';

    // 4) Gorseli indir
    const imgResp = await fetch(thumbnailUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssosuKesfet/1.0)' }
    });
    if (!imgResp.ok) {
      return json({ error: 'Gorsel indirilemedi (IG CDN)' }, 502, corsHeaders);
    }
    const imgBytes = await imgResp.arrayBuffer();
    const contentType = imgResp.headers.get('Content-Type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';

    // 5) Service account token al
    const hasSplit = !!(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
    if (!hasSplit) {
      return json({ error: 'Firebase service account env yok — cache yapilamadi', thumbnailUrlDirect: thumbnailUrl }, 500, corsHeaders);
    }
    const sa = {
      client_email: String(env.FIREBASE_CLIENT_EMAIL).trim(),
      private_key: String(env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    };
    const accessToken = await getAccessToken(sa);

    // 6) Firebase Storage'a yukle — reels/{shortcode}.{ext}
    const storagePath = 'reels/' + shortcode + '.' + ext;
    const uploadUrl = 'https://firebasestorage.googleapis.com/v0/b/' + BUCKET
      + '/o?uploadType=media&name=' + encodeURIComponent(storagePath);
    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
      },
      body: imgBytes,
    });
    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      console.error('[ig-thumbnail] storage upload failed:', uploadResp.status, errText);
      // Upload hata olursa IG CDN URL'ini fallback kullan (CSP'de izinli).
      // Dikkat: IG CDN URL'leri ~30 gunde expire olur, manuel upload daha kalici.
      return json({
        ok: true,
        shortcode,
        title,
        thumbnailUrl,
        cached: false,
        warning: 'Firebase cache basarisiz (HTTP ' + uploadResp.status + ') — IG CDN URL kullaniliyor (~30 gun sonra expire olabilir, manuel upload onerilir).',
        uploadError: errText.substring(0, 200)
      }, 200, corsHeaders);
    }
    const uploadData = await uploadResp.json();
    const token = uploadData.downloadTokens;
    const cachedUrl = 'https://firebasestorage.googleapis.com/v0/b/' + BUCKET
      + '/o/' + encodeURIComponent(storagePath) + '?alt=media&token=' + token;

    return json({ ok: true, shortcode, title, thumbnailUrl: cachedUrl, cached: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[ig-thumbnail] error:', err);
    return json({ error: 'Thumbnail cekme hatasi: ' + (err.message || 'bilinmeyen') }, 500, corsHeaders);
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// HTML entity decode — &#x2019; -> ’ , &amp; -> & , &#39; -> ' vb.
function decodeHtmlEntities(s) {
  if (!s) return '';
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, function(_, hex) { return String.fromCodePoint(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function(_, dec) { return String.fromCodePoint(parseInt(dec, 10)); })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Service Account JWT -> Google OAuth access token (Firebase Storage write scope)
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/devstorage.read_write',
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
  if (!resp.ok) throw new Error('OAuth token alinamadi (' + resp.status + ')');
  const data = await resp.json();
  return data.access_token;
}

async function signJWT(payload, privateKeyPem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = headerB64 + '.' + payloadB64;
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
  return data + '.' + base64UrlEncodeBytes(new Uint8Array(signature));
}

function base64UrlEncode(str) {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function base64UrlEncodeBytes(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
