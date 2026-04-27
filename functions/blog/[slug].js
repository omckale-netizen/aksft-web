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

  // Yazi yoksa:
  //   Bot -> 410 Gone (silinen yazi dizinden dussun, soft 404 olmasin)
  //   User -> blog.html (client-side "Bulunamadi" UI)
  if (!fields) {
    if (bot) return gone410Blog();
    return fetchAsset(request, env);
  }

  const blogTitle = fields.title?.stringValue || 'Blog';
  const blogCat = fields.category?.stringValue || '';
  const title = blogTitle + " \u2014 Assos'u Ke\u015ffet Blog";
  // Dinamik fallback ~155 char: cografi hiyerarsi + SEO ideal
  const blogFallbackDesc = `\u00c7anakkale Ayvac\u0131k Assos gezi rehberi blog${blogCat ? ' \u00b7 ' + blogCat : ''}: ${blogTitle}. Pratik \u00f6neriler, gezilecek yer listeleri, sezon tavsiyeleri ve yerel bilgilerle detayl\u0131 yaz\u0131.`;
  // Kisa excerpt'i fallback ile zenginlestir — Google generic uretmesin
  const _baseDesc = (fields.excerpt?.stringValue || '').replace(/<[^>]*>/g, '').trim();
  const _enrichedDesc = _baseDesc.length >= 120
    ? _baseDesc
    : (_baseDesc ? `${_baseDesc} ${blogFallbackDesc}` : blogFallbackDesc);
  const desc = _enrichedDesc.substring(0, 200);
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
</head><body><h1>${esc(blogTitle)}</h1><p>${esc(desc)}</p></body></html>`;

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
    .on('[data-hub-only]', { element(el) { el.remove(); } })
    .transform(response);
}

// 410 Gone — silinen blog yazilari icin bot response (SEO: dizinden dussun)
function gone410Blog() {
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Blog Yaz\u0131s\u0131 Bulunamad\u0131 \u2014 Assos'u Ke\u015ffet</title>
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
    <div class="icon">\u{1F4DD}</div>
    <h1>Blog Yaz\u0131s\u0131 Bulunamad\u0131</h1>
    <p>Arad\u0131\u011f\u0131n\u0131z yaz\u0131 kald\u0131r\u0131lm\u0131\u015f veya art\u0131k yay\u0131nda de\u011fil.</p>
    <a href="/blog">T\u00fcm Blog Yaz\u0131lar\u0131 \u2192</a>
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
