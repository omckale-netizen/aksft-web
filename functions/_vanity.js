// Vanity redirect helper — shared logic for all short links (/ig, /fb, /yt, etc.)
// _ prefix: Cloudflare Pages bu dosyayı route'lamaz (sadece helper)
export function vanityRedirect(request, utm) {
  const url = new URL(request.url);
  const params = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium
  });
  if (utm.campaign) params.set('utm_campaign', utm.campaign);
  const target = url.origin + '/?' + params.toString();
  return new Response(null, {
    status: 302,
    headers: {
      'Location': target,
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer-when-downgrade'
    }
  });
}
