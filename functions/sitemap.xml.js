// Dinamik sitemap.xml — Firebase'den tüm venue, place, village, route verilerini çekip sitemap oluşturur
const FIREBASE_PROJECT = 'assosu-kesfet';
const BASE_URL = 'https://assosukesfet.com';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

async function fetchCollection(name) {
  const docs = [];
  let pageToken = '';
  // Firestore REST API ile tüm dokümanları çek (sayfalama destekli)
  do {
    const url = `${FIRESTORE_BASE}/${name}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (data.documents) {
      for (const doc of data.documents) {
        const id = doc.name.split('/').pop();
        const fields = doc.fields || {};
        docs.push({ id, fields });
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return docs;
}

function getField(fields, key) {
  const f = fields[key];
  if (!f) return null;
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  if (f.integerValue !== undefined) return Number(f.integerValue);
  if (f.timestampValue !== undefined) return f.timestampValue;
  return null;
}

export async function onRequest(context) {
  const today = new Date().toISOString().split('T')[0];

  // Statik sayfalar
  const staticPages = [
    { loc: '/',                      changefreq: 'weekly',  priority: '1.0' },
    { loc: '/mekanlar.html',         changefreq: 'weekly',  priority: '0.9' },
    { loc: '/yerler.html',           changefreq: 'weekly',  priority: '0.9' },
    { loc: '/koyler.html',           changefreq: 'weekly',  priority: '0.9' },
    { loc: '/rotalar.html',          changefreq: 'weekly',  priority: '0.8' },
    { loc: '/rehber.html',           changefreq: 'monthly', priority: '0.8' },
    { loc: '/harita.html',           changefreq: 'weekly',  priority: '0.8' },
    { loc: '/planla.html',           changefreq: 'monthly', priority: '0.7' },
    { loc: '/blog.html',             changefreq: 'weekly',  priority: '0.7' },
    { loc: '/hakkimizda.html',       changefreq: 'monthly', priority: '0.5' },
    { loc: '/iletisim.html',         changefreq: 'monthly', priority: '0.5' },
    { loc: '/gizlilik.html',         changefreq: 'yearly',  priority: '0.3' },
    { loc: '/kullanim-kosullari.html',changefreq: 'yearly', priority: '0.3' },
  ];

  try {
    // Firebase'den paralel veri çek
    const [venues, places, villages, routes] = await Promise.all([
      fetchCollection('venues'),
      fetchCollection('places'),
      fetchCollection('villages'),
      fetchCollection('routes'),
    ]);

    // Dinamik sayfalar
    const dynamicPages = [];

    // Mekanlar — sadece yayında olanlar (yeni URL formati: /kategori/slug)
    const CATEGORY_SLUG = { konaklama:'oteller', kafe:'kafeler', restoran:'restoranlar', kahvalti:'kahvalti', beach:'plajlar', iskele:'iskeleler' };
    for (const v of venues) {
      const status = getField(v.fields, 'status') || (getField(v.fields, 'active') === false ? 'hidden' : 'published');
      if (status !== 'published') continue;
      const cat = getField(v.fields, 'category');
      const catSlug = CATEGORY_SLUG[cat] || 'mekanlar';
      dynamicPages.push({
        loc: `/${catSlug}/${v.id}`,
        changefreq: 'weekly',
        priority: '0.7',
      });
    }
    // Kategori hub sayfalari
    const activeCats = new Set(venues.map(v => getField(v.fields, 'category')).filter(Boolean));
    activeCats.forEach(cat => {
      const slug = CATEGORY_SLUG[cat];
      if (slug) dynamicPages.push({ loc: '/' + slug, changefreq: 'weekly', priority: '0.8' });
    });

    // Yerler
    for (const p of places) {
      dynamicPages.push({
        loc: `/yerler/${p.id}`,
        changefreq: 'monthly',
        priority: '0.7',
      });
    }

    // Köyler
    for (const k of villages) {
      dynamicPages.push({
        loc: `/koyler/${k.id}`,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }

    // Rotalar
    for (const r of routes) {
      dynamicPages.push({
        loc: `/rotalar/${r.id}`,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }

    // XML oluştur
    const allPages = [...staticPages, ...dynamicPages];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    // Hata durumunda statik sitemap döndür
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
