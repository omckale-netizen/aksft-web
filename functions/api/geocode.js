export async function onRequestGet(context) {
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = context.request.headers.get('Origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const url = new URL(context.request.url);
  const q = url.searchParams.get('q');
  const mapsUrl = url.searchParams.get('maps');

  // Google Maps link → koordinat çevirici
  if (mapsUrl) {
    try {
      // Kısa link (goo.gl) ise redirect takip et
      let finalUrl = mapsUrl;
      if (mapsUrl.includes('goo.gl') || mapsUrl.includes('maps.app')) {
        const redirectResp = await fetch(mapsUrl, { redirect: 'follow' });
        finalUrl = redirectResp.url;
      }
      // Koordinatları URL'den çıkar
      let lat = null, lng = null;
      // Pattern 1: @lat,lng
      const m1 = finalUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (m1) { lat = parseFloat(m1[1]); lng = parseFloat(m1[2]); }
      // Pattern 2: ?q=lat,lng
      if (!lat) { const m2 = finalUrl.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/); if (m2) { lat = parseFloat(m2[1]); lng = parseFloat(m2[2]); } }
      // Pattern 3: /place/lat,lng
      if (!lat) { const m3 = finalUrl.match(/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/); if (m3) { lat = parseFloat(m3[1]); lng = parseFloat(m3[2]); } }
      // Pattern 4: ll=lat,lng
      if (!lat) { const m4 = finalUrl.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/); if (m4) { lat = parseFloat(m4[1]); lng = parseFloat(m4[2]); } }

      if (lat && lng) {
        return new Response(JSON.stringify({ lat, lng, resolvedUrl: finalUrl }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
        });
      }
      return new Response(JSON.stringify({ error: 'Koordinat bulunamadı', resolvedUrl: finalUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Maps link çözümlenemedi: ' + err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
      });
    }
  }

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing q parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
    });
  }

  try {
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=1&countrycodes=tr';
    const resp = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'AssosuKesfet/1.0 (assosukesfet.com)' }
    });
    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
    });
  }
}
