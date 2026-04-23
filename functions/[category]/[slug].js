// Cloudflare Pages Function — /:kategori/:slug dinamik mekan detay route
// Whitelist kontrolu: sadece CATEGORIES'de tanimli slug'lar ise handle et.
// Diger path'ler (/blog/slug, /rotalar/slug, /koyler/slug, /yerler/slug)
// specific function'lar tarafindan yakalanir; bu catch-all onlara ulasmaz.
//
// Bot -> Firestore venues + OG SSR
// User -> mekanlar/mekan-detay.html asset serve (client-side parse)

const CATEGORIES = {
  oteller:     'konaklama',
  kafeler:     'kafe',
  restoranlar: 'restoran',
  kahvalti:    'kahvalti',
  plajlar:     'beach',
  iskeleler:   'iskele'
};

const BOT_UA = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discord', 'Pinterest',
  'Embedly', 'Iframely', 'vkShare',
  'Googlebot', 'Bingbot', 'YandexBot', 'Yandex', 'DuckDuckBot',
  'Baiduspider', 'Applebot', 'Slurp'
];

const DEFAULT_IMG = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function isBot(ua) { return ua && BOT_UA.some(b => ua.includes(b)); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// JSON-LD icerigini <script> icine embed ederken </script> kacislari
function jsonLdSafe(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script').replace(/</g, '\\u003C');
}

const SCHEMA_TYPES = { kafe: 'CafeOrCoffeeShop', restoran: 'Restaurant', kahvalti: 'Restaurant', konaklama: 'Hotel', beach: 'BarOrPub', iskele: 'FoodEstablishment' };

function buildLocalBusinessSchema(f, pageUrl, image, defaultImg) {
  const cat = f.category?.stringValue;
  const schema = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPES[cat] || 'LocalBusiness',
    name: f.title?.stringValue || 'Mekan',
    description: (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 300),
    url: pageUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: f.location?.stringValue || 'Assos',
      addressRegion: '\u00c7anakkale',
      addressCountry: 'TR'
    }
  };
  if (f.phone?.stringValue) schema.telephone = f.phone.stringValue;
  if (f.address?.stringValue) schema.address.streetAddress = f.address.stringValue;
  if (image && image !== defaultImg) schema.image = image;
  if (f.website?.stringValue) schema.sameAs = [f.website.stringValue];
  if (f.hours?.stringValue) schema.openingHours = f.hours.stringValue;
  if (f.weeklyHours?.arrayValue?.values?.length) {
    schema.openingHoursSpecification = f.weeklyHours.arrayValue.values.map(v => {
      const wh = v.mapValue?.fields || {};
      const days = wh.days?.arrayValue?.values?.map(d => d.stringValue).filter(Boolean) || [];
      const hrs = wh.hours?.stringValue || '';
      const parts = hrs.split(' - ');
      return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: parts[0] || '', closes: parts[1] || '' };
    });
  }
  const lat = f.lat?.doubleValue ?? f.lat?.integerValue;
  const lng = f.lng?.doubleValue ?? f.lng?.integerValue;
  if (lat != null && lng != null) {
    schema.geo = { '@type': 'GeoCoordinates', latitude: Number(lat), longitude: Number(lng) };
  }
  return schema;
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/mekanlar/mekan-detay.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env, params, next } = context;
  const category = params.category;
  const slug = params.slug;

  // Whitelist kontrol: bu catch-all sadece mekan kategorilerini handle eder.
  // Diger iki-seviye path'ler (rotalar/X, koyler/X, yerler/X, blog/X) specific
  // function'larda yakalanir (daha oncelikli). Ama emniyet icin fallback.
  if (!CATEGORIES[category]) return next();

  // Trailing slash normalize: /kafeler/mucs-coffee/ -> /kafeler/mucs-coffee
  const url = new URL(request.url);
  if (url.pathname.endsWith('/') && url.pathname.length > 1) {
    return Response.redirect(url.origin + url.pathname.slice(0, -1) + url.search, 301);
  }

  const expectedCat = CATEGORIES[category]; // 'konaklama', 'kafe' vb.
  const ua = request.headers.get('user-agent') || '';
  const pageUrl = `https://assosukesfet.com/${category}/${slug}`;

  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/venues/${encodeURIComponent(slug)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.status === 404) return serveAsset(request, env); // client-side empty state
    if (!resp.ok) return serveAsset(request, env);

    const doc = await resp.json();
    const f = doc.fields || {};
    const actualCat = f.category?.stringValue;

    // Kategori uyusmazligi: mekan var ama farkli kategoride -> dogru URL'e 301
    if (actualCat && actualCat !== expectedCat) {
      // Dogru kategori slug'ini bul
      for (const [catSlug, catId] of Object.entries(CATEGORIES)) {
        if (catId === actualCat) {
          return Response.redirect(`https://assosukesfet.com/${catSlug}/${slug}`, 301);
        }
      }
    }

    // Kategori etiketi (title icin): konaklama -> Otelleri, kafe -> Kafeleri vb.
    const CAT_LABELS = { konaklama: 'Otelleri', kafe: 'Kafeleri', restoran: 'Restoranlar\u0131', kahvalti: 'Kahvalt\u0131 Mekanlar\u0131', beach: 'Plajlar\u0131', iskele: '\u0130skeleleri' };
    const CAT_PLURAL = { konaklama: 'oteller', kafe: 'kafeler', restoran: 'restoranlar', kahvalti: 'kahvalt\u0131 mekanlar\u0131', beach: 'plajlar', iskele: 'iskeleler' };
    const CAT_SINGULAR = { konaklama: 'otel', kafe: 'kafe', restoran: 'restoran', kahvalti: 'kahvalt\u0131 mekan\u0131', beach: 'plaj', iskele: 'iskele' };
    const catLabel = CAT_LABELS[expectedCat] || 'Mekanlar\u0131';
    const catPlural = CAT_PLURAL[expectedCat] || 'mekanlar';
    const catSingular = CAT_SINGULAR[expectedCat] || 'mekan';
    const rawDesc = f.shortDesc?.stringValue || f.description?.stringValue || '';
    const venueTitle = f.title?.stringValue || 'Mekan';
    const venueLoc = f.location?.stringValue || '';
    // SEO title: "{title}, {location} — Assos {catLabel} | Assos'u Keşfet"
    // Location varsa ekle (long-tail "Buyukhusun otel" gibi aramalari yakalar)
    const title = venueLoc
      ? `${venueTitle}, ${venueLoc} \u2014 Assos ${catLabel} | Assos'u Ke\u015ffet`
      : `${venueTitle} \u2014 Assos ${catLabel} | Assos'u Ke\u015ffet`;
    // Dinamik fallback ~155 char: cografi hiyerarsi (il/ilce/bolge/mekan) + SEO ideal
    const fallbackDesc = venueLoc
      ? `\u00c7anakkale Ayvac\u0131k Assos'ta, ${venueLoc} b\u00f6lgesinde yer alan ${catSingular} ${venueTitle}. \u00c7al\u0131\u015fma saatleri, ileti\u015fim, men\u00fc, konum ve foto\u011fraflarla detayl\u0131 Assos ${catPlural} rehberi.`
      : `\u00c7anakkale Ayvac\u0131k Assos'ta bir ${catSingular}: ${venueTitle}. \u00c7al\u0131\u015fma saatleri, ileti\u015fim, men\u00fc, konum ve foto\u011fraflarla detayl\u0131 Assos ${catPlural} rehberi.`;
    const desc = (rawDesc || fallbackDesc).replace(/<[^>]*>/g, '').substring(0, 200);
    // Images field (array)
    let image = DEFAULT_IMG;
    if (f.images?.arrayValue?.values?.length > 0) {
      image = f.images.arrayValue.values[0].stringValue || image;
    } else if (f.image?.stringValue) {
      image = f.image.stringValue;
    }

    // LocalBusiness JSON-LD schema
    const lbSchema = buildLocalBusinessSchema(f, pageUrl, image, DEFAULT_IMG);
    const lbSchemaJson = jsonLdSafe(lbSchema);

    if (isBot(ua)) {
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
<script type="application/ld+json">${lbSchemaJson}</script>
</head><body><h1>${esc(title)}</h1><p>${esc(desc)}</p></body></html>`;

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // Kullanici: mekan-detay.html + HTMLRewriter title/meta inject + SSR JSON-LD
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
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="localbusiness">${lbSchemaJson}</script>`, { html: true }); } })
      .transform(response);
  } catch (e) {
    return serveAsset(request, env);
  }
}
