// Ziyaretçi coğrafyası — Cloudflare cf headers'dan
// Frontend bunu sayfa yüklenince bir kez çağırır ve localStorage'a cache'ler
export function onRequest(context) {
  const { request } = context;
  const cf = request.cf || {};
  // Cloudflare her request'e cf nesnesi ekler (ücretsiz)
  return new Response(JSON.stringify({
    country: cf.country || 'XX',
    city: cf.city || null,
    region: cf.region || null,
    continent: cf.continent || null,
    timezone: cf.timezone || null
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
