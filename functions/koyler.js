// Cloudflare Pages Function — /koyler hub
// Firestore'dan villages cekip ItemList JSON-LD schema'yi HTMLRewriter ile inject eder

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents';

function jsonLdSafe(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script').replace(/</g, '\\u003C');
}

async function serveAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/koyler.html';
  return env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const { request, env } = context;
  const response = await serveAsset(request, env);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`${FIRESTORE_BASE}/villages?pageSize=100`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return response;

    const data = await resp.json();
    const docs = data.documents || [];
    const items = docs
      .map(d => {
        const id = d.name.split('/').pop();
        const f = d.fields || {};
        if (!f.title?.stringValue) return null;
        const vType = f.type?.stringValue || 'koy';
        const tl = f.title.stringValue.toLowerCase();
        let seoName;
        if (vType === 'belde') seoName = tl.includes('belde') ? f.title.stringValue : f.title.stringValue + ' Beldesi';
        else if (vType === 'mahalle') seoName = f.title.stringValue + ' Mahallesi';
        else seoName = (tl.includes('k\u00f6y') || tl.includes('koy')) ? f.title.stringValue : f.title.stringValue + ' K\u00f6y\u00fc';
        return {
          url: `https://assosukesfet.com/koyler/${id}`,
          name: seoName
        };
      })
      .filter(Boolean)
      .map((it, i) => ({ '@type': 'ListItem', position: i + 1, ...it }));

    if (items.length === 0) return response;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Assos ve Ayvac\u0131k K\u00f6yleri',
      description: '\u00c7anakkale Ayvac\u0131k Assos b\u00f6lgesinin tarihi ta\u015f k\u00f6yleri ve beldeleri',
      numberOfItems: items.length,
      itemListElement: items
    };
    const schemaJson = jsonLdSafe(schema);

    return new HTMLRewriter()
      .on('head', { element(el) { el.append(`<script type="application/ld+json" data-ssr="itemlist-villages">${schemaJson}</script>`, { html: true }); } })
      .transform(response);
  } catch (e) {
    return response;
  }
}
