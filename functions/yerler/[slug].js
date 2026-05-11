// Cloudflare Pages Function — /yerler/:slug dinamik route
// Bot ise Firestore'dan yeri cekip OG meta tag'li HTML doner
// Kullanici ise yerler/yer-detay.html'i serve eder

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

function buildTouristAttractionSchema(f, pageUrl, image, defaultImg) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: f.title?.stringValue || 'Gezilecek Yer',
    description: (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 300),
    url: pageUrl,
    touristType: ['Cultural tourism', 'Historical tourism'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: f.location?.stringValue || 'Assos',
      addressRegion: '\u00c7anakkale',
      addressCountry: 'TR'
    },
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: 'Ayvac\u0131k, \u00c7anakkale, T\u00fcrkiye'
    }
  };
  if (image && image !== defaultImg) schema.image = image;
  const lat = f.lat?.doubleValue ?? f.lat?.integerValue;
  const lng = f.lng?.doubleValue ?? f.lng?.integerValue;
  if (lat != null && lng != null) {
    schema.geo = { '@type': 'GeoCoordinates', latitude: Number(lat), longitude: Number(lng) };
  }
  // Freshness sinyali
  const created = f.createdAt?.stringValue;
  const updated = f.updatedAt?.stringValue || f.editedAt?.stringValue || created;
  if (created) schema.datePublished = created;
  if (updated) schema.dateModified = updated;
  return schema;
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/yerler/yer-detay.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env, params, next } = context;
  const slug = params.slug;
  const ua = request.headers.get('user-agent') || '';
  const pageUrl = `https://assosukesfet.com/yerler/${slug}`;

  if (slug === 'yer-detay' || slug === 'yer-detay.html') return next();

  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/places/${encodeURIComponent(slug)}`;
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

    const yerTitle = f.title?.stringValue || 'Gezilecek Yer';
    const rawLoc = f.location?.stringValue || '';
    const yerCat = f.category?.stringValue || '';
    // Location sanitize: "Behramkale (Assos)" -> "Behramkale"
    const cleanLoc = rawLoc.replace(/\s*\(Assos\)\s*/gi, '').trim();
    // Location, title ile ayni kelimeyle basliyorsa omit et (Babakale Kalesi, Babakale -> skip)
    const titleFirstWord = yerTitle.toLowerCase().split(' ')[0];
    const locFirstWord = cleanLoc.toLowerCase().split(' ')[0];
    const effectiveLoc = (cleanLoc && locFirstWord === titleFirstWord) ? '' : cleanLoc;
    // Kategori -> keyword label
    const YER_CAT_LABEL = { muze: 'M\u00fcze', doga: 'Do\u011fal Alan', tarihi: '\u00d6ren Yeri', 'tarihi-yer': 'Tarihi Yer', orenyeri: '\u00d6ren Yeri', iskele: '\u0130skele', koy: 'Plaj & Koy', plaj: 'Plaj' };
    const catLabel = YER_CAT_LABEL[yerCat] || 'Gezilecek Yer';
    const titleHasAssos = /assos/i.test(yerTitle);
    const assosPrefix = titleHasAssos ? '' : 'Assos ';
    // SEO title: "{title}[, {loc}] — [Assos ]{catLabel} | Assos'u Kesfet"
    const titleBuilt = effectiveLoc
      ? `${yerTitle}, ${effectiveLoc} \u2014 ${assosPrefix}${catLabel} | Assos'u Ke\u015ffet`
      : `${yerTitle} \u2014 ${assosPrefix}${catLabel} | Assos'u Ke\u015ffet`;

    // Dinamik fallback ~155 char: cografi hiyerarsi + kategori
    const yerFallbackDesc = effectiveLoc
      ? `\u00c7anakkale Ayvac\u0131k Assos'ta, ${effectiveLoc} b\u00f6lgesindeki ${catLabel.toLowerCase()}: ${yerTitle}. Konum, ula\u015f\u0131m, foto\u011fraflar, ziyaret saatleri ve \u00e7evredeki mekanlarla detayl\u0131 gezi rehberi.`
      : `\u00c7anakkale Ayvac\u0131k Assos'ta ${catLabel.toLowerCase()}: ${yerTitle}. Konum, ula\u015f\u0131m, foto\u011fraflar, ziyaret saatleri ve \u00e7evredeki mekanlarla gezi rehberi.`;

    const image = f.image?.stringValue || DEFAULT_IMG;
    const taSchema = buildTouristAttractionSchema(f, pageUrl, image, DEFAULT_IMG);
    const taSchemaJson = jsonLdSafe(taSchema);

    // Kisa shortDesc'i fallback ile zenginlestir — Google generic uretmesin
    const _baseDesc = (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').trim();
    const _enrichedDesc = _baseDesc.length >= 120
      ? _baseDesc
      : (_baseDesc ? `${_baseDesc} ${yerFallbackDesc}` : yerFallbackDesc);

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
<script type="application/ld+json">${taSchemaJson}</script>
</head><body><h1>${esc(yerTitle)}</h1><p>${esc(desc)}</p></body></html>`;

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // Kullanici: yer-detay.html + HTMLRewriter title/meta inject + SSR JSON-LD
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
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="touristattraction">${taSchemaJson}</script>`, { html: true }); } })
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
  <title>Yer Bulunamad\u0131 \u2014 Assos'u Ke\u015ffet</title>
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
    <div class="icon">\u{1F4CD}</div>
    <h1>Yer Bulunamad\u0131</h1>
    <p>Arad\u0131\u011f\u0131n\u0131z yer kald\u0131r\u0131lm\u0131\u015f veya art\u0131k eri\u015fime kapal\u0131.</p>
    <a href="/yerler">T\u00fcm Yerleri Ke\u015ffet \u2192</a>
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
