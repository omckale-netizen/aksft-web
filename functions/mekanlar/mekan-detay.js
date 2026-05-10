// Cloudflare Pages Function — /mekanlar/mekan-detay(.html)?id=X
// Eski URL. Yeni format: /:kategori/:slug (oteller, kafeler, vb.)
// Firestore'dan mekanin kategorisini cekip dogru yeni URL'e 301 redirect.

const CATEGORY_SLUG = {
  konaklama: 'konaklama',
  kafe: 'kafeler',
  restoran: 'restoranlar',
  kahvalti: 'kahvalti',
  beach: 'plajlar',
  iskele: 'iskeleler',
  dondurmaci: 'dondurmacilar',
  hediyelik: 'hediyelik-esya'
};

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return Response.redirect('https://assosukesfet.com/mekanlar', 301);

  // Firestore'dan mekan kategorisini cek
  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/venues/${encodeURIComponent(id)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) return Response.redirect(`https://assosukesfet.com/mekanlar/mekan-detay.html?id=${encodeURIComponent(id)}&_stub=1`, 302);

    const doc = await resp.json();
    const cat = doc.fields?.category?.stringValue;
    const catSlug = CATEGORY_SLUG[cat];
    if (!catSlug) {
      // Kategori tanimli degil: mekanlar listesine redirect
      return Response.redirect('https://assosukesfet.com/mekanlar', 301);
    }
    return Response.redirect(`https://assosukesfet.com/${catSlug}/${encodeURIComponent(id)}`, 301);
  } catch (e) {
    return Response.redirect('https://assosukesfet.com/mekanlar', 302);
  }
}
