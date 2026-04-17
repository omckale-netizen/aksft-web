// Vanity redirect helper — shared logic for all short links (/ig, /fb, /yt, etc.)
// _ prefix: Cloudflare Pages bu dosyayı route'lamaz (sadece helper)
export function vanityRedirect(context, utm) {
  const request = context.request || context;
  const waitUntil = (context && typeof context.waitUntil === 'function')
    ? (p) => context.waitUntil(p)
    : (p) => { try { p.catch(() => {}); } catch(e) {} };

  const url = new URL(request.url);
  const params = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium
  });
  if (utm.campaign) params.set('utm_campaign', utm.campaign);
  if (utm.content) params.set('utm_content', utm.content);
  const target = url.origin + '/?' + params.toString();

  // Tıklama sayacı — yönlendirmeden önce Firestore'a "vanity_click" eventi yaz
  // (biyografi linkine tıklama vs. siteye gerçek giriş — dropout ölçümü için)
  try {
    const now = new Date();
    const cf = request.cf || {};
    const ua = (request.headers && request.headers.get) ? (request.headers.get('user-agent') || '') : '';
    const ref = (request.headers && request.headers.get) ? (request.headers.get('referer') || '') : '';
    const clickEvent = {
      fields: {
        type: { stringValue: 'vanity_click' },
        source: { stringValue: String(utm.source).slice(0, 60) },
        medium: { stringValue: String(utm.medium || 'bio').slice(0, 60) },
        path: { stringValue: String(url.pathname).slice(0, 200) },
        timestamp: { stringValue: now.toISOString() },
        date: { stringValue: now.toISOString().split('T')[0] },
        hour: { integerValue: String(now.getHours()) }
      }
    };
    if (utm.campaign) clickEvent.fields.campaign = { stringValue: String(utm.campaign).slice(0, 100) };
    if (utm.content) clickEvent.fields.content = { stringValue: String(utm.content).slice(0, 100) };
    if (ua) clickEvent.fields.userAgent = { stringValue: ua.slice(0, 300) };
    if (ref) clickEvent.fields.referrer = { stringValue: ref.slice(0, 200) };
    if (cf.country) clickEvent.fields.country = { stringValue: String(cf.country).slice(0, 10) };

    const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/analytics_events';
    const writePromise = fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clickEvent)
    }).catch(() => {});
    waitUntil(writePromise);
  } catch(e) { /* sessizce geç — log yazımı redirect'i bloklamamalı */ }

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
