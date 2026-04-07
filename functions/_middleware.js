// Cloudflare Pages Middleware
// Sosyal medya botlari icin mekan/rota detay sayfalarinda dinamik OG taglari

const BOT_USER_AGENTS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discord', 'Pinterest',
  'Embedly', 'Iframely', 'vkShare'
];

const DEFAULT_OG_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml({ title, description, url, image }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escHtml(url)}">
  <meta property="og:image" content="${escHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="Assos'u Kesfet">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(description)}">
  <meta name="twitter:image" content="${escHtml(image)}">
</head>
<body><p>${escHtml(title)}</p></body>
</html>`;
}

async function fetchFirestoreDoc(collection, docId) {
  const url = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/${collection}/${docId}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const doc = await resp.json();
  return doc.fields || null;
}

export async function onRequest(context) {
  const { request, next } = context;
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname;

  // Sadece botlar icin calis
  if (!isBot(ua)) return next();

  // Mekan detay sayfasi
  if (path.includes('/mekanlar/mekan-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('venues', id);
      if (!fields) return next();

      const title = (fields.title?.stringValue || 'Mekan') + ' \u2014 Assos\'u Kesfet';
      const desc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 200);
      let image = DEFAULT_OG_IMAGE;
      if (fields.images?.arrayValue?.values?.length > 0) {
        image = fields.images.arrayValue.values[0].stringValue || image;
      }

      return new Response(buildOgHtml({
        title,
        description: desc || 'Assos ve Ayvacik\'ta mekan detayi.',
        url: `https://assosukesfet.com/mekanlar/mekan-detay.html?id=${id}`,
        image
      }), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Rota detay sayfasi
  if (path.includes('/rotalar/rota-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('routes', id);
      if (!fields) return next();

      const title = (fields.title?.stringValue || 'Rota') + ' \u2014 Assos\'u Kesfet';
      const desc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 200);

      return new Response(buildOgHtml({
        title,
        description: desc || 'Assos rota detaylari.',
        url: `https://assosukesfet.com/rotalar/rota-detay.html?id=${id}`,
        image: DEFAULT_OG_IMAGE
      }), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Diger sayfalar — normal devam
  return next();
}
