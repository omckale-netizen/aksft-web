// Vanity redirect helper — shared logic for all short links (/ig, /fb, /yt, etc.)
// _ prefix: Cloudflare Pages bu dosyayı route'lamaz (sadece helper)
//
// Davranış:
// - Sosyal medya crawler'ları (WhatsApp, Facebook, Twitter vb.): OG tag'li HTML döner → link önizlemesi çalışır
// - Gerçek kullanıcılar: meta refresh + JS redirect → UTM'li hedef sayfaya yönlendirilir (anlık)
const OG_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';
const SITE_TITLE = "Assos'u Keşfet — Gezi Rehberi | Mekanlar, Rotalar, Köyler";
const SITE_DESC = "Assos gezilecek yerler, oteller, kafeler, restoranlar, koylar ve gezi rotaları. Harita ve mekan önerileri.";

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function vanityRedirect(context, utm) {
  const request = context.request || context;
  const waitUntil = (context && typeof context.waitUntil === 'function')
    ? (p) => context.waitUntil(p)
    : (p) => { try { p.catch(() => {}); } catch(e) {} };

  const url = new URL(request.url);
  // Query param override — kampanya-spesifik linkler icin (?m=dm&c=osmanbey&ct=qr)
  // Source genelde sabit (endpoint'in kendisi), ama m/c/ct istege bagli override
  const q = url.searchParams;
  const mediumOverride = (q.get('m') || '').trim().slice(0, 60);
  const campaignOverride = (q.get('c') || '').trim().slice(0, 100);
  const contentOverride = (q.get('ct') || '').trim().slice(0, 100);

  const params = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: mediumOverride || utm.medium
  });
  const finalCampaign = campaignOverride || utm.campaign;
  const finalContent = contentOverride || utm.content;
  if (finalCampaign) params.set('utm_campaign', finalCampaign);
  if (finalContent) params.set('utm_content', finalContent);
  const target = url.origin + '/?' + params.toString();

  // Tıklama sayacı — Firestore'a "vanity_click" eventi (dropout ölçümü için)
  try {
    const now = new Date();
    const cf = request.cf || {};
    const ua = (request.headers && request.headers.get) ? (request.headers.get('user-agent') || '') : '';
    const ref = (request.headers && request.headers.get) ? (request.headers.get('referer') || '') : '';
    const clickEvent = {
      fields: {
        type: { stringValue: 'vanity_click' },
        source: { stringValue: String(utm.source).slice(0, 60) },
        medium: { stringValue: String(mediumOverride || utm.medium || 'bio').slice(0, 60) },
        path: { stringValue: String(url.pathname).slice(0, 200) },
        timestamp: { stringValue: now.toISOString() },
        date: { stringValue: now.toISOString().split('T')[0] },
        hour: { integerValue: String(now.getHours()) }
      }
    };
    if (finalCampaign) clickEvent.fields.campaign = { stringValue: String(finalCampaign).slice(0, 100) };
    if (finalContent) clickEvent.fields.content = { stringValue: String(finalContent).slice(0, 100) };
    if (ua) clickEvent.fields.userAgent = { stringValue: ua.slice(0, 300) };
    if (ref) clickEvent.fields.referrer = { stringValue: ref.slice(0, 200) };
    if (cf.country) clickEvent.fields.country = { stringValue: String(cf.country).slice(0, 10) };

    const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/analytics_events';
    const writePromise = fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clickEvent)
    }).catch(() => {});
    waitUntil(writePromise);
  } catch(e) { /* sessizce geç */ }

  // OG tag'li HTML döndür — WhatsApp/FB/Twitter vb. link önizlemesi için şart
  // Gerçek kullanıcı meta refresh + JS ile anlık yönlendirilir (~100ms)
  const targetEsc = escHtml(target);
  const vanityUrl = url.origin + url.pathname;
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${targetEsc}">
<title>${escHtml(SITE_TITLE)}</title>
<meta name="description" content="${escHtml(SITE_DESC)}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${escHtml(url.origin + '/')}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escHtml(SITE_TITLE)}">
<meta property="og:description" content="${escHtml(SITE_DESC)}">
<meta property="og:url" content="${escHtml(vanityUrl)}">
<meta property="og:image" content="${escHtml(OG_IMAGE)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="tr_TR">
<meta property="og:site_name" content="Assos'u Keşfet">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(SITE_TITLE)}">
<meta name="twitter:description" content="${escHtml(SITE_DESC)}">
<meta name="twitter:image" content="${escHtml(OG_IMAGE)}">
<style>html,body{margin:0;padding:0;background:#06101E;color:#F5EDE0;font-family:system-ui,-apple-system,sans-serif;height:100%;}.wrap{display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;}a{color:#D4935A;text-decoration:underline;font-weight:600;}</style>
</head>
<body>
<div class="wrap">
  <div>
    <div style="font-size:2rem;margin-bottom:12px;">✨</div>
    <div style="font-size:.9rem;opacity:.7;margin-bottom:8px;">Yönlendiriliyorsunuz…</div>
    <a href="${targetEsc}">Buraya tıklayın</a>
  </div>
</div>
<script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'public, max-age=300',
      'Referrer-Policy': 'no-referrer-when-downgrade'
    }
  });
}
