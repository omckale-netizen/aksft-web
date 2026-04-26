// Cloudflare Pages Function — /rotalar/:slug dinamik route
// Bot ise Firestore'dan rotayi cekip OG meta tag'li HTML doner
// Kullanici ise rotalar/rota-detay.html'i serve eder (client-side JS path'ten slug okur)
// Firestore'da yoksa 410 Gone sayfasi (tasinmis/silinmis rota icin)

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

function buildTouristTripSchema(f, pageUrl, image, defaultImg) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: f.title?.stringValue || 'Rota',
    description: (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 300),
    url: pageUrl,
    touristType: ['Cultural tourism', 'Nature tourism', 'Sightseeing']
  };
  if (image && image !== defaultImg) schema.image = image;
  if (f.sure?.stringValue) schema.duration = f.sure.stringValue;

  // Itinerary: stops -> ItemList
  const stops = f.stops?.arrayValue?.values || [];
  if (stops.length > 0) {
    schema.itinerary = {
      '@type': 'ItemList',
      numberOfItems: stops.length,
      itemListElement: stops.map((s, i) => {
        const stopName = s.stringValue || s.mapValue?.fields?.title?.stringValue || `Durak ${i + 1}`;
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'TouristAttraction',
            name: stopName
          }
        };
      })
    };
  }

  // Location context
  schema.partOfTrip = {
    '@type': 'Place',
    name: 'Assos, Ayvac\u0131k, \u00c7anakkale',
    address: { '@type': 'PostalAddress', addressLocality: 'Ayvac\u0131k', addressRegion: '\u00c7anakkale', addressCountry: 'TR' }
  };

  return schema;
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/rotalar/rota-detay.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env, params, next } = context;
  const slug = params.slug;
  const ua = request.headers.get('user-agent') || '';
  const pageUrl = `https://assosukesfet.com/rotalar/${slug}`;

  // Specific function'a birak (rota-detay.js eski URL redirect icin)
  if (slug === 'rota-detay' || slug === 'rota-detay.html') return next();

  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/routes/${encodeURIComponent(slug)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeout);

    // Firestore'da yok:
    //   Bot -> 410 Gone (SEO sinyali: Google URL'i index'ten kaldirsin)
    //   Kullanici -> rota-detay.html serve (client-side "Rota Bulunamadi" state)
    if (resp.status === 404) {
      if (isBot(ua)) return gone410();
      return serveAsset(request, env);
    }
    // Firestore hatasi -> kullanici icin asset'i serve et (client-side arayabilir)
    if (!resp.ok) return serveAsset(request, env);

    const doc = await resp.json();
    const f = doc.fields || {};

    const rotaTitle = f.title?.stringValue || 'Rota';
    const rotaSure = f.sure?.stringValue || '';
    const rotaStops = f.stops?.arrayValue?.values?.length || 0;
    // SEO title: sure + "Assos Gezisi/Gezi Rotasi" (title zaten "Rota" iceriyorsa duplikasyon olmasin)
    const titleHasRota = /rota/i.test(rotaTitle);
    const keywordTail = titleHasRota ? 'Assos Gezisi' : 'Assos Gezi Rotas\u0131';
    const sureTail = rotaSure ? rotaSure + ' ' : '';
    const titleBuilt = `${rotaTitle} \u2014 ${sureTail}${keywordTail} | Assos'u Ke\u015ffet`;

    // Dinamik fallback ~150 char: cografi hiyerarsi + SEO (durak sayisi yok, arama terimi degil)
    const rotaFallbackDesc = `\u00c7anakkale Ayvac\u0131k Assos gezi rotas\u0131: ${rotaTitle}${rotaSure ? ' \u00b7 ' + rotaSure : ''}. Ad\u0131m ad\u0131m rehber, harita, yol tarifi ve \u00f6nerilen mola noktalar\u0131yla g\u00fcn\u00fcbirlik Assos ke\u015ffini planlay\u0131n.`;

    const image = f.image?.stringValue || DEFAULT_IMG;
    const ttSchema = buildTouristTripSchema(f, pageUrl, image, DEFAULT_IMG);
    const ttSchemaJson = jsonLdSafe(ttSchema);

    // Kisa shortDesc'i fallback ile zenginlestir — Google generic description uretmesin
    const _baseDesc = (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').trim();
    const _enrichedDesc = _baseDesc.length >= 120
      ? _baseDesc
      : (_baseDesc ? `${_baseDesc} ${rotaFallbackDesc}` : rotaFallbackDesc);

    // Bot: OG meta tag'li HTML
    if (isBot(ua)) {
      const title = titleBuilt;
      const desc = _enrichedDesc.substring(0, 200);

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
<script type="application/ld+json">${ttSchemaJson}</script>
</head><body><h1>${esc(rotaTitle)}</h1><p>${esc(desc)}</p></body></html>`;

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // Kullanici: rota-detay.html + HTMLRewriter ile title/meta SSR inject + SSR JSON-LD
    const title = titleBuilt;
    const desc = _enrichedDesc.substring(0, 200);
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
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="touristtrip">${ttSchemaJson}</script>`, { html: true }); } })
      .transform(response);
  } catch (e) {
    // Hata durumunda asset'e dus (client-side render devam edebilir)
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
  <title>Rota Bulunamad\u0131 \u2014 Assos'u Ke\u015ffet</title>
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
    <div class="icon">\u{1F5FA}\u{FE0F}</div>
    <h1>Rota Bulunamad\u0131</h1>
    <p>Arad\u0131\u011f\u0131n\u0131z rota kald\u0131r\u0131lm\u0131\u015f veya art\u0131k eri\u015fime kapal\u0131.</p>
    <a href="/rotalar">T\u00fcm Rotalar\u0131 Ke\u015ffet \u2192</a>
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
