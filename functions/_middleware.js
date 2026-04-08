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

      const catLabels = {kafe:'Assos Kafeler',restoran:'Assos Restoranlar',kahvalti:'Assos Kahvalti Mekanlari',konaklama:'Assos Otelleri',beach:'Assos Beach Club',iskele:'Assos Iskeleler'};
      const catSingular = {kafe:'kafe',restoran:'restoran',kahvalti:'kahvalti mekani',konaklama:'otel',beach:'beach club',iskele:'iskele'};
      const cat = fields.category?.stringValue || '';
      const catLabel = catLabels[cat] || 'Assos Mekanlar';
      const catSing = catSingular[cat] || 'mekan';
      const venueName = fields.title?.stringValue || 'Mekan';
      const loc = fields.location?.stringValue || 'Assos';
      const title = venueName + ' \u2014 ' + catLabel + ' | Assos\'u Kesfet';
      const shortDesc = (fields.shortDesc?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 120);
      const desc = venueName + '. ' + loc + ' bolgesinde ' + catSing + '. ' + shortDesc;
      let image = DEFAULT_OG_IMAGE;
      if (fields.images?.arrayValue?.values?.length > 0) {
        image = fields.images.arrayValue.values[0].stringValue || image;
      }

      const schemaTypes = {kafe:'CafeOrCoffeeShop',restoran:'Restaurant',kahvalti:'Restaurant',konaklama:'Hotel',beach:'BarOrPub',iskele:'FoodEstablishment'};
      const phone = fields.phone?.stringValue || '';
      const schema = JSON.stringify({
        '@context':'https://schema.org','@type':schemaTypes[cat]||'LocalBusiness',
        'name':venueName,'description':shortDesc,
        'address':{'@type':'PostalAddress','addressLocality':loc,'addressRegion':'Canakkale','addressCountry':'TR'},
        'telephone':phone,'image':image
      });

      const html = buildOgHtml({
        title,
        description: desc || 'Assos ve Ayvacik\'ta mekan detayi.',
        url: `https://assosukesfet.com/mekanlar/mekan-detay.html?id=${id}`,
        image
      }).replace('</head>', '<script type="application/ld+json">' + schema + '</script></head>');

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
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

  // Blog detay sayfasi
  if (path.includes('/blog/') && path !== '/blog/' && path !== '/blog') {
    const slug = path.split('/').pop();
    if (!slug) return next();

    try {
      const fields = await fetchFirestoreDoc('blog_posts', slug);
      if (!fields) return next();

      const title = (fields.title?.stringValue || 'Blog') + ' \u2014 Assos\'u Kesfet';
      const desc = (fields.excerpt?.stringValue || '').substring(0, 200);
      const image = fields.image?.stringValue || DEFAULT_OG_IMAGE;

      return new Response(buildOgHtml({
        title,
        description: desc || 'Assos hakkinda blog yazisi.',
        url: `https://assosukesfet.com/blog/${slug}`,
        image
      }), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Diger sayfalar — normal devam
  return next();
}
