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

    // 3b) Video URL'ini cekmeyi dene (og:video veya og:video:secure_url)
    const videoMatch = html.match(/<meta\s+property=["']og:video:secure_url["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+property=["']og:video["']\s+content=["']([^"']+)["']/i);
    const videoOriginalUrl = videoMatch ? videoMatch[1].replace(/&amp;/g, '&') : '';

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

    // 6) GCS JSON API ile multipart upload — Firebase Storage download token'i ile
    // (Firebase Storage REST endpoint'i 403 donerse GCS direkt calisir — Storage Admin yetkisi var)
    const storagePath = 'reels/' + shortcode + '.' + ext;
    const downloadToken = crypto.randomUUID();
    const boundary = '----AssosuKesfetBoundary' + Date.now();
    const metadata = {
      name: storagePath,
      contentType: contentType,
      metadata: { firebaseStorageDownloadTokens: downloadToken }
    };
    const encoder = new TextEncoder();
    const metadataPart = encoder.encode(
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: ' + contentType + '\r\n\r\n'
    );
    const closingPart = encoder.encode('\r\n--' + boundary + '--\r\n');
    // Multipart body'yi birlestir
    const bodyParts = new Uint8Array(metadataPart.length + imgBytes.byteLength + closingPart.length);
    bodyParts.set(metadataPart, 0);
    bodyParts.set(new Uint8Array(imgBytes), metadataPart.length);
    bodyParts.set(closingPart, metadataPart.length + imgBytes.byteLength);

    const uploadUrl = 'https://storage.googleapis.com/upload/storage/v1/b/' + BUCKET
      + '/o?uploadType=multipart';
    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: bodyParts,
    });
    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      console.error('[ig-thumbnail] GCS upload failed:', uploadResp.status, errText);
      return json({
        ok: true,
        shortcode,
        title,
        thumbnailUrl,
        cached: false,
        warning: 'Firebase cache basarisiz (HTTP ' + uploadResp.status + ') — IG CDN URL fallback (~30 gun expire).',
        uploadError: errText.substring(0, 200)
      }, 200, corsHeaders);
    }
    // Firebase Storage download URL (our download token)
    const cachedUrl = 'https://firebasestorage.googleapis.com/v0/b/' + BUCKET
      + '/o/' + encodeURIComponent(storagePath) + '?alt=media&token=' + downloadToken;

    // 7) Video varsa indir ve cache'le (native player icin)
    let videoUrl = '';
    let videoWarning = '';
    if (videoOriginalUrl) {
      try {
        const vidResp = await fetch(videoOriginalUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AssosuKesfet/1.0)' }
        });
        if (!vidResp.ok) {
          videoWarning = 'Video indirilemedi (IG CDN ' + vidResp.status + ')';
        } else {
          const vidBytes = await vidResp.arrayBuffer();
          // Video boyut limiti — CF Worker bellek kontrolu (50MB max)
          if (vidBytes.byteLength > 50 * 1024 * 1024) {
            videoWarning = 'Video cok buyuk (50MB+), cache atlandi';
          } else {
            const vidContentType = vidResp.headers.get('Content-Type') || 'video/mp4';
            const vidExt = vidContentType.includes('quicktime') ? 'mov' : 'mp4';
            const vidStoragePath = 'reels/videos/' + shortcode + '.' + vidExt;
            const vidDownloadToken = crypto.randomUUID();
            const vidBoundary = '----AssosuKesfetVideoBoundary' + Date.now();
            const vidMetadata = {
              name: vidStoragePath,
              contentType: vidContentType,
              metadata: { firebaseStorageDownloadTokens: vidDownloadToken }
            };
            const vidMetadataPart = encoder.encode(
              '--' + vidBoundary + '\r\n' +
              'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
              JSON.stringify(vidMetadata) + '\r\n' +
              '--' + vidBoundary + '\r\n' +
              'Content-Type: ' + vidContentType + '\r\n\r\n'
            );
            const vidClosingPart = encoder.encode('\r\n--' + vidBoundary + '--\r\n');
            const vidBodyParts = new Uint8Array(vidMetadataPart.length + vidBytes.byteLength + vidClosingPart.length);
            vidBodyParts.set(vidMetadataPart, 0);
            vidBodyParts.set(new Uint8Array(vidBytes), vidMetadataPart.length);
            vidBodyParts.set(vidClosingPart, vidMetadataPart.length + vidBytes.byteLength);

            const vidUploadUrl = 'https://storage.googleapis.com/upload/storage/v1/b/' + BUCKET
              + '/o?uploadType=multipart';
            const vidUploadResp = await fetch(vidUploadUrl, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'multipart/related; boundary=' + vidBoundary,
              },
              body: vidBodyParts,
            });
            if (vidUploadResp.ok) {
              videoUrl = 'https://firebasestorage.googleapis.com/v0/b/' + BUCKET
                + '/o/' + encodeURIComponent(vidStoragePath) + '?alt=media&token=' + vidDownloadToken;
            } else {
              const vidErrText = await vidUploadResp.text();
              console.error('[ig-thumbnail] video upload failed:', vidUploadResp.status, vidErrText);
              videoWarning = 'Video cache basarisiz (HTTP ' + vidUploadResp.status + ')';
            }
          }
        }
      } catch (vidErr) {
        console.error('[ig-thumbnail] video fetch/cache error:', vidErr);
        videoWarning = 'Video fetch hatasi: ' + (vidErr.message || 'bilinmeyen');
      }
    } else {
      videoWarning = 'Video URL bulunamadi (reel olmayabilir veya IG login wall)';
    }

    return json({
      ok: true,
      shortcode,
      title,
      thumbnailUrl: cachedUrl,
      videoUrl: videoUrl,
      cached: true,
      videoWarning: videoWarning || undefined
    }, 200, corsHeaders);
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
