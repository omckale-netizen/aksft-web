// Cloudflare Pages Function — /rotalar hub
// Firestore'dan routes cekip ItemList JSON-LD schema'yi HTMLRewriter ile inject eder
// SEO: Google "Assos gezi rotalari" aramasinda carousel/rich result gosterebilir

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents';

function jsonLdSafe(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script').replace(/</g, '\\u003C');
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/rotalar.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env } = context;
  const response = await serveAsset(request, env);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`${FIRESTORE_BASE}/routes?pageSize=50`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return response;

    const data = await resp.json();
    const docs = data.documents || [];
    const items = docs
      .map((d, i) => {
        const id = d.name.split('/').pop();
        const f = d.fields || {};
        if (f.status?.stringValue === 'draft' || !f.title?.stringValue) return null;
        return {
          '@type': 'ListItem',
          position: i + 1,
          url: `https://assosukesfet.com/rotalar/${id}`,
          name: f.title.stringValue
        };
      })
      .filter(Boolean)
      .map((it, i) => ({ ...it, position: i + 1 }));

    if (items.length === 0) return response;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Assos Gezi Rotalar\u0131',
      description: '\u00c7anakkale Ayvac\u0131k Assos b\u00f6lgesi i\u00e7in haz\u0131rlanm\u0131\u015f gezi rotalar\u0131',
      numberOfItems: items.length,
      itemListElement: items
    };
    const schemaJson = jsonLdSafe(schema);

    return new HTMLRewriter()
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="itemlist-routes">${schemaJson}</script>`, { html: true }); } })
      .transform(response);
  } catch (e) {
    return response;
  }
}
