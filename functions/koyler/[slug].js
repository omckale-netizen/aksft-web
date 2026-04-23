// Cloudflare Pages Function — /koyler/:slug dinamik route
// Bot ise Firestore'dan koyu cekip OG meta tag'li HTML doner
// Kullanici ise koyler/koy-detay.html'i serve eder

const BOT_UA = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discord', 'Pinterest',
  'Embedly', 'Iframely', 'vkShare',
  'Googlebot', 'Bingbot', 'YandexBot', 'Yandex', 'DuckDuckBot',
  'Baiduspider', 'Applebot', 'Slurp'
];

const DEFAULT_IMG = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function isBot(ua) {
  if (!ua) return false;
  return BOT_UA.some(b => ua.includes(b));
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function jsonLdSafe(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script').replace(/</g, '\\u003C');
}

function buildTouristDestinationSchema(f, pageUrl, image, defaultImg, seoName, parentLabel) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: seoName,
    description: (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 300),
    url: pageUrl,
    touristType: ['Cultural tourism', 'Nature tourism'],
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: parentLabel + ', \u00c7anakkale, T\u00fcrkiye'
    }
  };
  if (image && image !== defaultImg) schema.image = image;
  const lat = f.lat?.doubleValue ?? f.lat?.integerValue;
  const lng = f.lng?.doubleValue ?? f.lng?.integerValue;
  if (lat != null && lng != null) {
    schema.geo = { '@type': 'GeoCoordinates', latitude: Number(lat), longitude: Number(lng) };
  }
  return schema;
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/koyler/koy-detay.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env, params, next } = context;
  const slug = params.slug;
  const ua = request.headers.get('user-agent') || '';
  const pageUrl = `https://assosukesfet.com/koyler/${slug}`;

  if (slug === 'koy-detay' || slug === 'koy-detay.html') return next();

  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/villages/${encodeURIComponent(slug)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.status === 404) {
      if (isBot(ua)) return gone410();
      return serveAsset(request, env);
    }
    if (!resp.ok) return serveAsset(request, env);

    const doc = await resp.json();
    const f = doc.fields || {};

    // SEO title builder: "Ahmetce Koyu | Ayvacik Koyleri | Assos'u Kesfet"
    const rawTitle = f.title?.stringValue || 'K\u00f6y';
    const vType = f.type?.stringValue || 'koy';
    const vParent = f.parent?.stringValue || '';
    const parentLabel = vParent === 'kucukkuyu' ? 'K\u00fc\u00e7\u00fckkuyu' : 'Ayvac\u0131k';
    const tl = rawTitle.toLowerCase();
    let seoName, categoryLabel;
    if (vType === 'belde') {
      seoName = tl.includes('belde') ? rawTitle : rawTitle + ' Beldesi';
      categoryLabel = parentLabel + ' Beldeleri';
    } else if (vType === 'mahalle') {
      seoName = parentLabel + ' ' + (tl.includes('mahalle') ? rawTitle : rawTitle + ' Mahallesi');
      categoryLabel = parentLabel + ' Mahalleleri';
    } else {
      seoName = (tl.includes('k\u00f6y') || tl.includes('koy')) ? rawTitle : rawTitle + ' K\u00f6y\u00fc';
      categoryLabel = parentLabel + ' K\u00f6yleri';
    }
    const titleBuilt = seoName + ' | ' + categoryLabel + " | Assos'u Ke\u015ffet";

    // Dinamik fallback ~150 char: cografi hiyerarsi + SEO ideal uzunluk
    const koyFallbackDesc = `\u00c7anakkale ${parentLabel}'a ba\u011fl\u0131 ${seoName}. Tarih\u00e7e, foto\u011fraflar, ula\u015f\u0131m, konaklama, yeme-i\u00e7me mekanlar\u0131 ve gezi ipu\u00e7lar\u0131yla detayl\u0131 Assos k\u00f6y rehberi.`;

    const image = f.image?.stringValue || DEFAULT_IMG;
    const tdSchema = buildTouristDestinationSchema(f, pageUrl, image, DEFAULT_IMG, seoName, parentLabel);
    const tdSchemaJson = jsonLdSafe(tdSchema);

    if (isBot(ua)) {
      const title = titleBuilt;
      const desc = (f.shortDesc?.stringValue || f.description?.stringValue || koyFallbackDesc).replace(/<[^>]*>/g, '').substring(0, 200);

      const html = `<!DOCTYPE html><html lang="tr"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="tr_TR">
<meta property="og:site_name" content="Assos'u Ke\u015ffet">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<script type="application/ld+json">${tdSchemaJson}</script>
</head><body><h1>${esc(title)}</h1><p>${esc(desc)}</p></body></html>`;

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // Kullanici: koy-detay.html + HTMLRewriter title/meta inject + SSR JSON-LD
    const title = titleBuilt;
    const desc = (f.shortDesc?.stringValue || f.description?.stringValue || koyFallbackDesc).replace(/<[^>]*>/g, '').substring(0, 200);
    const response = await serveAsset(request, env);
    return new HTMLRewriter()
      .on('title', { element(el) { el.setInnerContent(title); } })
      .on('meta[name="description"]', { element(el) { el.setAttribute('content', desc); } })
      .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', pageUrl); } })
      .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', title); } })
      .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', desc); } })
      .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', pageUrl); } })
      .on('meta[property="og:image"]', { element(el) { el.setAttribute('content', image); } })
      .on('meta[name="twitter:title"]', { element(el) { el.setAttribute('content', title); } })
      .on('meta[name="twitter:description"]', { element(el) { el.setAttribute('content', desc); } })
      .on('meta[name="twitter:image"]', { element(el) { el.setAttribute('content', image); } })
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="touristdestination">${tdSchemaJson}</script>`, { html: true }); } })
      .transform(response);
  } catch (e) {
    return serveAsset(request, env);
  }
}

function gone410() {
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>K\u00f6y Bulunamad\u0131 \u2014 Assos'u Ke\u015ffet</title>
  <link rel="icon" href="/icon.png" type="image/png">
  <style>
    body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,#FAFAF8 0%,#FFF5EE 50%,#FFECD2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;color:#1A2744}
    .box{text-align:center;max-width:500px}
    .icon{width:140px;height:140px;margin:0 auto 32px;border-radius:50%;background:linear-gradient(135deg,#fff,#FFF5EE);box-shadow:0 8px 32px rgba(196,82,26,.12);display:flex;align-items:center;justify-content:center;font-size:3rem}
    h1{font-size:1.75rem;margin:0 0 12px;font-weight:800;letter-spacing:-.02em}
    p{color:#718096;font-size:1rem;line-height:1.7;margin:0 0 40px}
    a{display:inline-block;background:linear-gradient(135deg,#C4521A,#A3431A);color:#fff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;box-shadow:0 4px 16px rgba(196,82,26,.3)}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">\u{1F3D8}\u{FE0F}</div>
    <h1>K\u00f6y Bulunamad\u0131</h1>
    <p>Arad\u0131\u011f\u0131n\u0131z k\u00f6y kald\u0131r\u0131lm\u0131\u015f veya art\u0131k eri\u015fime kapal\u0131.</p>
    <a href="/koyler">T\u00fcm K\u00f6yleri Ke\u015ffet \u2192</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
