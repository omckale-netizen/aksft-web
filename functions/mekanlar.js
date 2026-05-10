// Cloudflare Pages Function — /mekanlar hub
// Firestore'dan venues cekip ItemList JSON-LD schema'yi HTMLRewriter ile inject eder

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents';

const CAT_SLUG = { konaklama: 'konaklama', kafe: 'kafeler', restoran: 'restoranlar', kahvalti: 'kahvalti', beach: 'plajlar', iskele: 'iskeleler', dondurmaci: 'dondurmacilar', hediyelik: 'hediyelik-esya' };

function jsonLdSafe(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script').replace(/</g, '\\u003C');
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/mekanlar.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env } = context;
  const response = await serveAsset(request, env);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`${FIRESTORE_BASE}/venues?pageSize=100`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return response;

    const data = await resp.json();
    const docs = data.documents || [];
    const items = docs
      .map(d => {
        const id = d.name.split('/').pop();
        const f = d.fields || {};
        if (!f.title?.stringValue) return null;
        const catSlug = CAT_SLUG[f.category?.stringValue] || 'mekanlar';
        const url = catSlug === 'mekanlar'
          ? `https://assosukesfet.com/mekanlar/mekan-detay.html?id=${id}`
          : `https://assosukesfet.com/${catSlug}/${id}`;
        return { url, name: f.title.stringValue };
      })
      .filter(Boolean)
      .map((it, i) => ({ '@type': 'ListItem', position: i + 1, ...it }));

    if (items.length === 0) return response;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Assos Mekanlar\u0131',
      description: '\u00c7anakkale Ayvac\u0131k Assos b\u00f6lgesindeki oteller, kafeler, restoranlar, kahvalt\u0131 mekanlar\u0131, plajlar ve iskeleler',
      numberOfItems: items.length,
      itemListElement: items
    };
    const schemaJson = jsonLdSafe(schema);

    return new HTMLRewriter()
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="itemlist-venues">${schemaJson}</script>`, { html: true }); } })
      .transform(response);
  } catch (e) {
    return response;
  }
}
