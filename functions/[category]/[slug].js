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

    if (isBot(ua)) {
      const title = (f.title?.stringValue || 'Mekan') + " \u2014 Assos | Assos'u Ke\u015ffet";
      const desc = (f.shortDesc?.stringValue || f.description?.stringValue || 'Assos\'ta mekan detaylar\u0131.').replace(/<[^>]*>/g, '').substring(0, 200);
      const image = f.image?.stringValue || DEFAULT_IMG;

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
</head><body><h1>${esc(title)}</h1><p>${esc(desc)}</p></body></html>`;

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    return serveAsset(request, env);
  } catch (e) {
    return serveAsset(request, env);
  }
}
