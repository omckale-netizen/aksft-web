// Cloudflare Pages Function — /rotalar/rota-detay(.html)
// Eski URL formati: /rotalar/rota-detay.html?id=slug
// Yeni URL formati: /rotalar/slug
// Bu handler eski URL'leri 301 ile yeniye yonlendirir (SEO + temiz URL).
// Bot istekleri de 301 takip eder (Twitter/FB crawler'lar redirect'i izler).

const BOT_UA = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discord', 'Pinterest',
  'Embedly', 'Iframely', 'vkShare',
  'Googlebot', 'Bingbot', 'YandexBot', 'Yandex', 'DuckDuckBot',
  'Baiduspider', 'Applebot', 'Slurp'
];

const DEFAULT_IMG = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function isBot(ua) { return ua && BOT_UA.some(b => ua.includes(b)); }

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const ua = request.headers.get('user-agent') || '';

  // Query yoksa: /rotalar/rota-detay pratik olarak /rotalar ile ayni olsun
  if (!id) return Response.redirect('https://assosukesfet.com/rotalar', 301);

  const newUrl = `https://assosukesfet.com/rotalar/${id}`;

  // Kullanici: 301 yeni URL'e
  if (!isBot(ua)) {
    return Response.redirect(newUrl, 301);
  }

  // Bot: canonical'i yeni URL'e isaret eden OG HTML (bot 301'i izlemek yerine
  // bazen ilk response'u parse eder; canonical yeniye bakarsa iki URL birlesir)
  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/routes/${encodeURIComponent(id)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) return Response.redirect(newUrl, 301);

    const doc = await resp.json();
    const f = doc.fields || {};
    const title = (f.title?.stringValue || 'Rota') + " \u2014 Assos Gezi Rotas\u0131 | Assos'u Ke\u015ffet";
    const desc = (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 200) || 'Assos gezi rotas\u0131 detaylar\u0131.';
    const image = f.image?.stringValue || DEFAULT_IMG;

    const html = `<!DOCTYPE html><html lang="tr"><head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(newUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(newUrl)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="tr_TR">
<meta property="og:site_name" content="Assos'u Ke\u015ffet">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body><p>${esc(title)}</p></body></html>`;

    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } catch (e) {
    return Response.redirect(newUrl, 301);
  }
}
