// Cloudflare Pages Function — /koyler/koy-detay(.html)
// Eski URL: /koyler/koy-detay.html?id=slug -> 301 redirect to /koyler/slug

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return Response.redirect('https://assosukesfet.com/koyler', 301);
  return Response.redirect(`https://assosukesfet.com/koyler/${id}`, 301);
}
