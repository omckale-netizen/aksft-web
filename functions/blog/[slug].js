// Cloudflare Pages Function — /blog/:slug dinamik route
// Bot ise Firestore'dan yaziyi cekip OG meta tag'li HTML doner (social preview + SEO)
// Kullanici ise blog.html'i serve eder + HTMLRewriter ile title/meta SSR inject (flicker fix)

const BOT_USER_AGENTS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discord', 'Pinterest',
  'Embedly', 'Iframely', 'vkShare',
  'Googlebot', 'Bingbot', 'YandexBot', 'Yandex', 'DuckDuckBot',
  'Baiduspider', 'Applebot', 'Slurp'
];

const DEFAULT_OG_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function isBot(ua) {
  if (!ua) return false;
  return BOT_USER_AGENTS.some(b => ua.includes(b));
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/blog.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;
  const ua = request.headers.get('user-agent') || '';
  const pageUrl = `https://assosukesfet.com/blog/${slug}`;
  const bot = isBot(ua);

  // Firestore'dan yaziyi cek (hem bot hem user icin)
  let fields = null;
  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/blog_posts/${slug}`;
    const resp = await fetch(docUrl);
    if (resp.ok) {
      const doc = await resp.json();
      fields = doc.fields || null;
    }
  } catch (e) { /* Firestore hatasi: fields null kalir, client-side fallback */ }

  // Yazi yoksa: bot icin next(), user icin blog.html (client empty state gosterir)
  if (!fields) return fetchAsset(request, env);

  const title = (fields.title?.stringValue || 'Blog') + " \u2014 Assos'u Ke\u015ffet Blog";
  const desc = (fields.excerpt?.stringValue || fields.title?.stringValue || 'Assos hakk\u0131nda blog yaz\u0131s\u0131.').substring(0, 200);
  const image = fields.coverImage?.stringValue || fields.image?.stringValue || DEFAULT_OG_IMAGE;

  // Bot: minimal OG HTML (meta tag'ler, social preview icin yeterli)
  if (bot) {
    const html = `<!DOCTYPE html><html lang="tr"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
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

  // User: blog.html asset'i al + HTMLRewriter ile title/meta SSR inject (flicker fix)
  const response = await fetchAsset(request, env);
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
    .transform(response);
}
