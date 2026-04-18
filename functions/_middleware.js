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

// Güvenlik header'larını response'a ekle
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms https://cdn.jsdelivr.net https://api.anthropic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https:;"
};

function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) newHeaders.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname;

  // ═══ Admin Gate Koruması ═══
  const adminPaths = ['/admin', '/admin.html', '/admin-login', '/admin-login.html'];
  if (adminPaths.includes(path)) {
    const GATE_KEY = (env.ADMIN_GATE_KEY || '').trim();
    // Fail-secure: env yoksa admin paneli kilitle (404'e yonlendir).
    // Misconfiguration durumunda admin URL'sinin disclosure edilmesini onler.
    if (!GATE_KEY) return Response.redirect(url.origin + '/404.html', 302);

    const gateParam = url.searchParams.get('gate');
    const cookies = request.headers.get('cookie') || '';
    const hasGateCookie = cookies.includes('admin_gate=' + GATE_KEY);

    if (gateParam === GATE_KEY) {
      // Dogru anahtar — cookie set et ve parametresiz URL'ye yonlendir
      const cleanUrl = url.origin + path;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': cleanUrl,
          'Set-Cookie': `admin_gate=${GATE_KEY}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
        }
      });
    }

    if (!hasGateCookie) {
      // Cookie yok — 404 sayfasina yonlendir
      return Response.redirect(url.origin + '/404.html', 302);
    }

    // Server-side brute force koruması — login sayfası için IP bazlı rate limit
    if ((path === '/admin-login' || path === '/admin-login.html') && env.CHAT_KV) {
      try {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const loginKey = 'login_attempt_' + ip + '_' + Math.floor(Date.now() / 300000); // 5 dakikalık pencere
        const attempts = parseInt(await env.CHAT_KV.get(loginKey) || '0');
        if (attempts >= 15) {
          return new Response(
            '<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#06101E;color:#F5EDE0;font-family:sans-serif;text-align:center"><div><h1>⛔</h1><h2>Çok fazla giriş denemesi</h2><p style="color:rgba(245,237,224,.5)">5 dakika sonra tekrar deneyin.</p></div></body></html>',
            { status: 429, headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Retry-After': '300' } }
          );
        }
        await env.CHAT_KV.put(loginKey, String(attempts + 1), { expirationTtl: 300 });
      } catch(e) {}
    }
    // Cookie var — devam et
  }

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

      // Kategori bilgisini Firebase'den çekmeye çalış, yoksa fallback
      let catLabel = 'Assos Mekanlar';
      let catSing = 'mekan';
      const cat = fields.category?.stringValue || '';
      try {
        const catDoc = await fetch('https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/settings/venue_categories');
        if (catDoc.ok) {
          const catData = await catDoc.json();
          const list = catData.fields?.list?.arrayValue?.values || [];
          const found = list.find(c => c.mapValue?.fields?.id?.stringValue === cat);
          if (found) {
            const fLabel = found.mapValue.fields.label?.stringValue || cat;
            catLabel = 'Assos ' + fLabel;
            catSing = fLabel.toLowerCase();
          }
        }
      } catch(e) {}
      if (catLabel === 'Assos Mekanlar') {
        const fallbackLabels = {kafe:'Assos Kafeler',restoran:'Assos Restoranlar',kahvalti:'Assos Kahvaltı Mekanları',konaklama:'Assos Otelleri',beach:'Assos Beach Club',iskele:'Assos İskeleler'};
        const fallbackSing = {kafe:'kafe',restoran:'restoran',kahvalti:'kahvaltı mekanı',konaklama:'otel',beach:'beach club',iskele:'iskele'};
        catLabel = fallbackLabels[cat] || 'Assos Mekanlar';
        catSing = fallbackSing[cat] || 'mekan';
      }
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

  // Koy detay sayfasi
  if (path.includes('/koyler/koy-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('villages', id);
      if (!fields) return next();

      const villageName = fields.title?.stringValue || 'Köy';
      const title = villageName + ' Köyü \u2014 Assos Köyleri | Assos\'u Keşfet';
      const shortDesc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 160);
      const desc = villageName + ', Ayvacık bölgesinde. ' + shortDesc;
      const image = fields.image?.stringValue || DEFAULT_OG_IMAGE;

      const schema = JSON.stringify({
        '@context':'https://schema.org','@type':'Place',
        'name':villageName,'description':shortDesc,
        'address':{'@type':'PostalAddress','addressLocality':villageName,'addressRegion':'Ayvacık, Çanakkale','addressCountry':'TR'},
        'image':image
      });

      const html = buildOgHtml({
        title,
        description: desc || 'Assos ve Ayvacık bölgesinde köy detayı.',
        url: `https://assosukesfet.com/koyler/koy-detay?id=${id}`,
        image
      }).replace('</head>', '<script type="application/ld+json">' + schema + '</script></head>');

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Yer detay sayfasi
  if (path.includes('/yerler/yer-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('places', id);
      if (!fields) return next();

      const placeName = fields.title?.stringValue || 'Gezilecek Yer';
      const title = placeName + ' \u2014 Assos Bölgesi | Assos\'u Keşfet';
      const shortDesc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 160);
      const location = fields.location?.stringValue || 'Ayvacık';
      const desc = placeName + ', ' + location + '. ' + shortDesc;
      const image = fields.image?.stringValue || DEFAULT_OG_IMAGE;

      const schema = JSON.stringify({
        '@context':'https://schema.org','@type':'Place',
        'name':placeName,'description':shortDesc,
        'address':{'@type':'PostalAddress','addressLocality':location,'addressRegion':'Ayvacık, Çanakkale','addressCountry':'TR'},
        'image':image
      });

      const html = buildOgHtml({
        title,
        description: desc || 'Assos ve Ayvacık bölgesinde gezilecek yer detayı.',
        url: `https://assosukesfet.com/yerler/yer-detay?id=${id}`,
        image
      }).replace('</head>', '<script type="application/ld+json">' + schema + '</script></head>');

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
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

  // Diger sayfalar — normal devam + güvenlik header'ları
  const response = await next();
  return addSecurityHeaders(response);
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
    { loc: '/rehber', priority: '0.9', freq: 'weekly' },
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
        xml += `  <url>\n    <loc>${BASE}/yerler/yer-detay?id=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n`;
        const imgUrl = f.image?.stringValue;
        if (imgUrl) {
          const title = f.title?.stringValue || id;
          xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)} - Assos</image:title></image:image>\n`;
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  // Koyler — Firebase'den cek
  try {
    const villagesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/villages?pageSize=500';
    const vResp = await fetch(villagesUrl);
    if (vResp.ok) {
      const vData = await vResp.json();
      const docs = vData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        xml += `  <url>\n    <loc>${BASE}/koyler/koy-detay?id=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n`;
        const imgUrl = f.image?.stringValue;
        if (imgUrl) {
          const title = f.title?.stringValue || id;
          xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)} Köyü - Assos</image:title></image:image>\n`;
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
