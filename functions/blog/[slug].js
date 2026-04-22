// Cloudflare Pages Function — /blog/:slug dinamik route
// Bot ise Firestore'dan yaziyi cekip OG meta tag'li HTML doner (social preview + SEO)
// Kullanici ise blog.html'i serve eder (client-side JS path'ten slug okur)

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

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;
  const ua = request.headers.get('user-agent') || '';
  const pageUrl = `https://assosukesfet.com/blog/${slug}`;

  // Bot: Firestore'dan dokuman cek, OG HTML uret
  if (isBot(ua)) {
    try {
      const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/blog_posts/${slug}`;
      const resp = await fetch(docUrl);
      if (resp.ok) {
        const doc = await resp.json();
        const f = doc.fields || {};
        const title = (f.title?.stringValue || 'Blog') + " \u2014 Assos'u Ke\u015ffet";
        const desc = (f.excerpt?.stringValue || f.title?.stringValue || 'Assos hakk\u0131nda blog yaz\u0131s\u0131.').substring(0, 200);
        const image = f.coverImage?.stringValue || f.image?.stringValue || DEFAULT_OG_IMAGE;

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
    } catch (e) { /* Firestore hatasi: blog.html'e dus */ }
  }

  // Kullanici (veya bot Firestore'dan yaziyi bulamadi): blog.html'i serve et
  // URL bar'da /blog/slug kalir; client-side JS path'ten slug'i okur
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/blog.html';
  return env.ASSETS.fetch(assetUrl);
}
