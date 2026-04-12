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
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="Assos'u Keşfet">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(description)}">
  <meta name="twitter:image" content="${image}">
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

  // Dinamik Sitemap
  if (path === '/sitemap.xml') {
    try {
      return await generateDynamicSitemap();
    } catch(e) { return next(); }
  }

  // Sadece botlar icin calis
  if (!isBot(ua)) return next();

  // Mekan detay sayfasi
  if (path.includes('/mekanlar/mekan-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('venues', id);
      if (!fields) return next();

      const catLabels = {kafe:'Assos Kafeler',restoran:'Assos Restoranlar',kahvalti:'Assos Kahvaltı Mekanları',konaklama:'Assos Otelleri',beach:'Assos Beach Club',iskele:'Assos İskeleler'};
      const catSingular = {kafe:'kafe',restoran:'restoran',kahvalti:'kahvaltı mekanı',konaklama:'otel',beach:'beach club',iskele:'iskele'};
      const cat = fields.category?.stringValue || '';
      const catLabel = catLabels[cat] || 'Assos Mekanlar';
      const catSing = catSingular[cat] || 'mekan';
      const venueName = fields.title?.stringValue || 'Mekan';
      const loc = fields.location?.stringValue || 'Assos';
      const title = venueName + ' \u2014 ' + catLabel + ' | Assos\'u Keşfet';
      const shortDesc = (fields.shortDesc?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 120);
      const desc = venueName + '. ' + loc + ' bölgesinde ' + catSing + '. ' + shortDesc;
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
        description: desc || 'Assos ve Ayvacık\'ta mekan detayı.',
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

      const title = (fields.title?.stringValue || 'Rota') + ' \u2014 Assos\'u Keşfet';
      const desc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 200);

      return new Response(buildOgHtml({
        title,
        description: desc || 'Assos rota detayları.',
        url: `https://assosukesfet.com/rotalar/rota-detay.html?id=${id}`,
        image: DEFAULT_OG_IMAGE
      }), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Blog detay sayfasi (?yazi=slug)
  if ((path === '/blog' || path === '/blog.html') && url.searchParams.get('yazi')) {
    const slug = url.searchParams.get('yazi');
    if (!slug) return next();

    try {
      const fields = await fetchFirestoreDoc('blog_posts', slug);
      if (!fields) return next();

      const title = (fields.title?.stringValue || 'Blog') + ' \u2014 Assos\'u Keşfet';
      const desc = (fields.excerpt?.stringValue || '').substring(0, 200);
      const image = fields.coverImage?.stringValue || fields.image?.stringValue || DEFAULT_OG_IMAGE;

      return new Response(buildOgHtml({
        title,
        description: desc || 'Assos hakkında blog yazısı.',
        url: `https://assosukesfet.com/blog?yazi=${slug}`,
        image
      }), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Diger sayfalar — normal devam
  return next();
}

// ══════════════════════════════════════════════════
// DINAMIK SITEMAP + GORSEL SITEMAP
// ══════════════════════════════════════════════════
async function generateDynamicSitemap() {
  const BASE = 'https://assosukesfet.com';
  const today = new Date().toISOString().split('T')[0];

  // Statik sayfalar
  const staticPages = [
    { loc: '/', priority: '1.0', freq: 'weekly' },
    { loc: '/mekanlar', priority: '0.9', freq: 'weekly' },
    { loc: '/rotalar', priority: '0.9', freq: 'weekly' },
    { loc: '/yerler', priority: '0.9', freq: 'weekly' },
    { loc: '/koyler', priority: '0.9', freq: 'weekly' },
    { loc: '/harita', priority: '0.8', freq: 'weekly' },
    { loc: '/rehber', priority: '0.8', freq: 'monthly' },
    { loc: '/blog', priority: '0.8', freq: 'weekly' },
    { loc: '/planla', priority: '0.7', freq: 'monthly' },
    { loc: '/hakkimizda', priority: '0.4', freq: 'monthly' },
    { loc: '/iletisim', priority: '0.4', freq: 'monthly' },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // Statik sayfalar
  for (const p of staticPages) {
    xml += `  <url><loc>${BASE}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>\n`;
  }

  // Mekanlar — Firebase'den cek
  try {
    const venuesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/venues?pageSize=500';
    const vResp = await fetch(venuesUrl);
    if (vResp.ok) {
      const vData = await vResp.json();
      const docs = vData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        const active = f.active?.booleanValue !== false;
        const status = f.status?.stringValue || 'published';
        if (!active || status === 'hidden' || status === 'draft') continue;

        xml += `  <url>\n    <loc>${BASE}/mekanlar/mekan-detay?id=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n`;
        // Gorseller
        const images = f.images?.arrayValue?.values || [];
        for (const img of images) {
          const imgUrl = img.stringValue;
          if (imgUrl) {
            const title = f.title?.stringValue || id;
            xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)} - Assos</image:title></image:image>\n`;
          }
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  // Rotalar — Firebase'den cek
  try {
    const routesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/routes?pageSize=500';
    const rResp = await fetch(routesUrl);
    if (rResp.ok) {
      const rData = await rResp.json();
      const docs = rData.documents || [];
      for (const doc of docs) {
        const id = doc.name.split('/').pop();
        xml += `  <url><loc>${BASE}/rotalar/rota-detay?id=${id}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
      }
    }
  } catch(e) {}

  // Yerler — Firebase'den cek
  try {
    const placesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/places?pageSize=500';
    const pResp = await fetch(placesUrl);
    if (pResp.ok) {
      const pData = await pResp.json();
      const docs = pData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        xml += `  <url>\n    <loc>${BASE}/yerler#${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n`;
        const imgUrl = f.image?.stringValue;
        if (imgUrl) {
          const title = f.title?.stringValue || id;
          xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)} - Assos</image:title></image:image>\n`;
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  // Blog yazilari — Firebase'den cek
  try {
    const blogUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/blog_posts?pageSize=500';
    const bResp = await fetch(blogUrl);
    if (bResp.ok) {
      const bData = await bResp.json();
      const docs = bData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        const status = f.status?.stringValue;
        if (status !== 'published') continue;

        xml += `  <url>\n    <loc>${BASE}/blog?yazi=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n`;
        const imgUrl = f.image?.stringValue;
        if (imgUrl) {
          const title = f.title?.stringValue || id;
          xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)}</image:title></image:image>\n`;
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  xml += '</urlset>';

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
