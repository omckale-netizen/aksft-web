// Cloudflare Pages Function — /yerler hub
// Firestore'dan places cekip ItemList JSON-LD schema'yi HTMLRewriter ile inject eder

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents';

function jsonLdSafe(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script').replace(/</g, '\\u003C');
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/yerler.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env } = context;
  const response = await serveAsset(request, env);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`${FIRESTORE_BASE}/places?pageSize=100`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return response;

    const data = await resp.json();
    const docs = data.documents || [];
    const items = docs
      .map(d => {
        const id = d.name.split('/').pop();
        const f = d.fields || {};
        if (!f.title?.stringValue) return null;
        return {
          url: `https://assosukesfet.com/yerler/${id}`,
          name: f.title.stringValue
        };
      })
      .filter(Boolean)
      .map((it, i) => ({ '@type': 'ListItem', position: i + 1, ...it }));

    if (items.length === 0) return response;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Assos Gezilecek Yerler',
      description: '\u00c7anakkale Ayvac\u0131k Assos b\u00f6lgesinde g\u00f6r\u00fclecek tarihi ve do\u011fal yerler',
      numberOfItems: items.length,
      itemListElement: items
    };
    const schemaJson = jsonLdSafe(schema);

    return new HTMLRewriter()
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="itemlist-places">${schemaJson}</script>`, { html: true }); } })
      .transform(response);
  } catch (e) {
    return response;
  }
}
