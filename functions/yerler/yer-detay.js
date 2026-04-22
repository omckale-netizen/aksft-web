// Cloudflare Pages Function — /yerler/yer-detay(.html)
// Eski URL: /yerler/yer-detay.html?id=slug -> 301 redirect to /yerler/slug

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return Response.redirect('https://assosukesfet.com/yerler', 301);
  return Response.redirect(`https://assosukesfet.com/yerler/${id}`, 301);
}
