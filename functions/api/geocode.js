export async function onRequestGet(context) {
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = context.request.headers.get('Origin') || '';
  const referer = context.request.headers.get('Referer') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  // Origin veya Referer kontrolü — sadece kendi sitemizden çağrılabilir (SSRF koruması)
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some(o => referer.startsWith(o));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
    });
  }

  // Google Maps host whitelist (SSRF koruması)
  const ALLOWED_MAPS_HOSTS = [
    'maps.google.com',
    'www.google.com',
    'google.com',
    'maps.app.goo.gl',
    'goo.gl',
    'g.co'
  ];
  function isAllowedMapsUrl(u) {
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      const host = parsed.hostname.toLowerCase();
      return ALLOWED_MAPS_HOSTS.some(h => host === h || host.endsWith('.' + h));
    } catch(e) { return false; }
  }

  const url = new URL(context.request.url);
  const q = url.searchParams.get('q');
  const mapsUrl = url.searchParams.get('maps');

  // Google Maps link → koordinat çevirici
  if (mapsUrl) {
    // Whitelist kontrolü — sadece Google Maps domain'leri
    if (!isAllowedMapsUrl(mapsUrl)) {
      return new Response(JSON.stringify({ error: 'Sadece Google Maps linkleri kabul edilir' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
      });
    }
    try {
      // Kısa link (goo.gl) ise redirect takip et — redirect sonrası tekrar whitelist kontrol
      let finalUrl = mapsUrl;
      if (mapsUrl.includes('goo.gl') || mapsUrl.includes('maps.app')) {
        const redirectResp = await fetch(mapsUrl, { redirect: 'follow' });
        finalUrl = redirectResp.url;
        // Redirect sonrası URL de whitelist'te olmalı
        if (!isAllowedMapsUrl(finalUrl)) {
          return new Response(JSON.stringify({ error: 'Redirect güvenli değil' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
          });
        }
      }
      // Koordinatları URL'den çıkar — öncelik sırası önemli
      let lat = null, lng = null;
      // Pattern 1 (en doğru): !3d ve !4d — mekanın gerçek koordinatı
      const m5 = finalUrl.match(/!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)/);
      if (m5) { lat = parseFloat(m5[1]); lng = parseFloat(m5[2]); }
      // Pattern 2: ?q=lat,lng
      if (!lat) { const m2 = finalUrl.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/); if (m2) { lat = parseFloat(m2[1]); lng = parseFloat(m2[2]); } }
      // Pattern 3: /place/lat,lng
      if (!lat) { const m3 = finalUrl.match(/place\/(-?\d+\.?\d+),(-?\d+\.?\d+)/); if (m3) { lat = parseFloat(m3[1]); lng = parseFloat(m3[2]); } }
      // Pattern 4: ll=lat,lng
      if (!lat) { const m4 = finalUrl.match(/ll=(-?\d+\.?\d+),(-?\d+\.?\d+)/); if (m4) { lat = parseFloat(m4[1]); lng = parseFloat(m4[2]); } }
      // Pattern 5 (fallback): @lat,lng — harita merkezi, mekan değil
      if (!lat) { const m1 = finalUrl.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/); if (m1) { lat = parseFloat(m1[1]); lng = parseFloat(m1[2]); } }

      if (lat && lng) {
        // resolvedUrl döndürmüyoruz — open-redirect / veri sızıntı riski
        return new Response(JSON.stringify({ lat, lng }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin }
        });
      }
      return new Response(JSON.stringify({ error: 'Koordinat bulunamadı' }), {
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
