// Cloudflare Pages Function — /:kategori kategori hub route
// Whitelist-driven: sadece CATEGORIES slug'lari handle edilir.
// Diger root path'ler (/rotalar, /koyler, /yerler, /blog, /ara, vb.)
// whitelist'te olmadigi icin next() ile static asset'e birakilir.
// Yeni kategori eklemek: HUB_CATEGORIES'e 1 satir ekle.

const HUB_CATEGORIES = {
  oteller:     'konaklama',
  kafeler:     'kafe',
  restoranlar: 'restoran',
  kahvalti:    'kahvalti',
  plajlar:     'beach',
  iskeleler:   'iskele'
};

export async function onRequest(context) {
  const { params, request, env, next } = context;
  const category = params.category;

  // Whitelist disindakiler: diger function'lara ve static asset'e birak
  if (!HUB_CATEGORIES[category]) return next();

  // Trailing slash normalize: /kafeler/ -> /kafeler (301)
  const url = new URL(request.url);
  if (url.pathname.endsWith('/') && url.pathname.length > 1) {
    return Response.redirect(url.origin + url.pathname.slice(0, -1) + url.search, 301);
  }

  // Kategori hub sayfasi: mekanlar.html?cat=X content'ini serve et,
  // URL bar'da /kategori-slug kalir (SEO temiz URL)
  const catId = HUB_CATEGORIES[category];
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/mekanlar.html';
  assetUrl.search = '?cat=' + catId;
  return env.ASSETS.fetch(assetUrl);
}
