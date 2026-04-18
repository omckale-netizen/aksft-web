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
    // 1) Instagram sayfasini fetch et — gercek browser User-Agent daha iyi meta dondurur
    const IG_HEADERS = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    };
    const igResp = await fetch('https://www.instagram.com/' + match[1] + '/' + shortcode + '/', {
      headers: IG_HEADERS
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

    // 3) Title cekmeyi dene (og:title) — HTML entity'leri decode et + Instagram prefix temizle
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    let title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
    // IG formati: "username | bio, Instagram: '<caption>'" -> sadece caption
    const igPrefixMatch = title.match(/Instagram\s*:\s*["'\u201C\u201D\u2018\u2019]?\s*(.+?)\s*["'\u201C\u201D\u2018\u2019]?\s*$/);
    if (igPrefixMatch && igPrefixMatch[1]) title = igPrefixMatch[1];
    title = title.replace(/^["'\u201C\u201D\u2018\u2019\s]+|["'\u201C\u201D\u2018\u2019\s]+$/g, '');

    // 3a) Embed/captioned HTML — hem video URL'i hem tam caption icin kaynak
    let embedHtml = '';
    try {
      const embedResp = await fetch('https://www.instagram.com/' + match[1] + '/' + shortcode + '/embed/captioned/', {
        headers: IG_HEADERS
      });
      if (embedResp.ok) embedHtml = await embedResp.text();
    } catch(e) { /* embed fallback hatali, sorun degil */ }

    // 3b) Tam caption'i cek — multi-strategy
    // og:title ~80 karakter kesiyor; og:description + JSON full caption'i icerir
    let fullCaption = '';
    // Strateji 0: MAIN page og:description — IG post sayfasinda tam caption genelde burada
    const mainOgDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (mainOgDesc) fullCaption = decodeHtmlEntities(mainOgDesc[1]);
    // Strateji 0b: MAIN page JSON edge_media_to_caption
    if (!fullCaption || fullCaption.length < 100) {
      const mainEdgeCap = html.match(/"edge_media_to_caption"\s*:\s*\{\s*"edges"\s*:\s*\[\s*\{\s*"node"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (mainEdgeCap) {
        const decoded = unescapeJsonString(mainEdgeCap[1]);
        if (decoded.length > fullCaption.length) fullCaption = decoded;
      }
    }
    if (embedHtml && (!fullCaption || fullCaption.length < 100)) {
      // Strateji 1: embed og:description
      const embOgDesc = embedHtml.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
      if (embOgDesc) {
        const decoded = decodeHtmlEntities(embOgDesc[1]);
        if (decoded.length > fullCaption.length) fullCaption = decoded;
      }
      // Strateji 2: edge_media_to_caption JSON
      if (!fullCaption) {
        const edgeCap = embedHtml.match(/"edge_media_to_caption"\s*:\s*\{\s*"edges"\s*:\s*\[\s*\{\s*"node"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (edgeCap) fullCaption = unescapeJsonString(edgeCap[1]);
      }
      // Strateji 3: caption.text JSON
      if (!fullCaption) {
        const capText = embedHtml.match(/"caption"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (capText) fullCaption = unescapeJsonString(capText[1]);
      }
      // Strateji 4: <div class="Caption">...<p><span>CAPTION</span></p></div>
      if (!fullCaption) {
        const capDiv = embedHtml.match(/<div[^>]*class=["'][^"']*Caption[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
        if (capDiv) {
          // Kullanici adi <a> linkini cikar, sonra kalan metni al
          let inner = capDiv[1].replace(/<a[^>]*class=["'][^"']*CaptionUsername[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, '');
          inner = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (inner) fullCaption = decodeHtmlEntities(inner);
        }
      }
    }

    // Instagram metadata prefix'ini temizle:
    // "2,267 likes, 8 comments\n– assosukesfet, February 26, 2026: CAPTION"
    // "@user on Instagram: CAPTION"
    if (fullCaption) {
      // IG og:description formati — "X likes, Y comments..date:" sonrasini al
      const metaPrefix = fullCaption.match(/^\s*[\d,.]+\s*likes?(?:,\s*[\d,.]+\s*comments?)?[\s\S]*?\d{4}\s*:\s*/i);
      if (metaPrefix) fullCaption = fullCaption.substring(metaPrefix[0].length);
      // "username on Instagram:" prefix'i temizle
      const m = fullCaption.match(/Instagram\s*:\s*["'\u201C\u201D\u2018\u2019]?\s*(.+?)\s*["'\u201C\u201D\u2018\u2019]?\s*$/s);
      if (m && m[1]) fullCaption = m[1];
      fullCaption = fullCaption.replace(/^["'\u201C\u201D\u2018\u2019\s]+|["'\u201C\u201D\u2018\u2019\s]+$/g, '');
    }

    // Tam caption og:title'dan uzunsa onu kullan (og:title ~80 karakterde kesiyor)
    if (fullCaption && fullCaption.length > title.length) {
      // Ilk 2 cumle veya 400 karakter (hangisi daha kisa ise)
      title = extractFirstNSentences(fullCaption, 2, 400);
    }

    // 3c) Video URL'ini cekmeyi dene — cok katmanli fallback
    let videoOriginalUrl = '';
    // Strateji 1: og:video / og:video:secure_url meta tag
    const videoMatch = html.match(/<meta\s+property=["']og:video:secure_url["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+property=["']og:video["']\s+content=["']([^"']+)["']/i);
    if (videoMatch) {
      videoOriginalUrl = videoMatch[1].replace(/&amp;/g, '&');
    }
    // Strateji 2: Inline JSON/JS icinde "video_url":"..." veya "video_versions":[{...url}]
    if (!videoOriginalUrl) {
      const jsonVideoMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/i)
        || html.match(/"video_versions"\s*:\s*\[\s*\{[^}]*"url"\s*:\s*"([^"]+)"/i)
        || html.match(/"playable_url"\s*:\s*"([^"]+)"/i);
      if (jsonVideoMatch) {
        videoOriginalUrl = jsonVideoMatch[1]
          .replace(/\\u0026/g, '&')
          .replace(/\\\//g, '/')
          .replace(/\\"/g, '"');
      }
    }
    // Strateji 3: Embed HTML'den (yukarida zaten fetch ettik)
    if (!videoOriginalUrl && embedHtml) {
      const embedVideo = embedHtml.match(/"video_url"\s*:\s*"([^"]+)"/i)
        || embedHtml.match(/<video[^>]+src=["']([^"']+)["']/i)
        || embedHtml.match(/"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/i);
      if (embedVideo) {
        videoOriginalUrl = embedVideo[1]
          .replace(/\\u0026/g, '&')
          .replace(/\\\//g, '/')
          .replace(/\\"/g, '"');
      }
    }

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
      titleLength: title ? title.length : 0,
      fullCaptionLength: fullCaption ? fullCaption.length : 0,
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

// JSON string escape'lerini decode et (\n, \", \u0026, \/ vb.)
function unescapeJsonString(s) {
  if (!s) return '';
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, function(_, hex) { return String.fromCharCode(parseInt(hex, 16)); })
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/')
    .replace(/\\\\/g, '\\');
}

// Bir metinden ilk N cumleyi cikar ve sonuna '…' ekle (son noktanin yerine).
function extractFirstNSentences(text, n, maxChars) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  const regex = /[.!?…]+(\s|$)/g;
  let count = 0;
  let lastEnd = 0;
  let match;
  while ((match = regex.exec(clean)) !== null) {
    lastEnd = match.index + match[0].length;
    count++;
    if (count >= n) break;
  }
  let result = count > 0 ? clean.substring(0, lastEnd).trim() : clean;
  if (maxChars && result.length > maxChars) result = result.substring(0, maxChars).trim();
  // Son noktalama isaretini '…' ile degistir (. ! ? -> …). Zaten … ise aynen kalsin.
  result = result.replace(/[.!?]+$/, '').replace(/…+$/, '') + '…';
  return result;
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
