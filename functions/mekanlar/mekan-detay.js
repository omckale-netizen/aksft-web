const BOT_UA = ['facebookexternalhit','Facebot','Twitterbot','LinkedInBot','WhatsApp','TelegramBot','Slackbot','Discord','Pinterest','Embedly','Iframely','vkShare'];
const DEFAULT_IMG = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export async function onRequest(context) {
  const { request, next } = context;
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const isBot = BOT_UA.some(b => ua.includes(b));

  if (!id) return next();
  if (request.method !== 'GET') return next();

  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/venues/${encodeURIComponent(id)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeout);

    // Firestore 404 veya mekan yayında değil → HTTP 410 Gone
    if (resp.status === 404) return gone410();
    if (!resp.ok) return next();

    const doc = await resp.json();
    const f = doc.fields || {};
    const status = f.status?.stringValue;
    const active = f.active?.booleanValue;
    const effectiveStatus = status || (active === false ? 'hidden' : 'published');
    if (effectiveStatus !== 'published') return gone410();

    // Yayındaysa: bot için SSR HTML, normal kullanıcı için statik HTML
    if (!isBot) return next();

    const catLabels = {kafe:'Assos Kafeler',restoran:'Assos Restoranlar',kahvalti:'Assos Kahvaltı Mekanları',konaklama:'Assos Otelleri',beach:'Assos Beach Club',iskele:'Assos İskeleler'};
    const cat = f.category?.stringValue || '';
    const name = f.title?.stringValue || 'Mekan';
    const loc = f.location?.stringValue || 'Assos';
    const title = name + ' — ' + (catLabels[cat] || 'Assos Mekanlar') + ' | Assos\'u Keşfet';
    const shortDesc = (f.shortDesc?.stringValue || f.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 160);
    const desc = name + '. ' + loc + '. ' + shortDesc;
    let image = DEFAULT_IMG;
    if (f.images?.arrayValue?.values?.length > 0) {
      image = f.images.arrayValue.values[0].stringValue || image;
    }
    const pageUrl = `https://assosukesfet.com/mekanlar/mekan-detay?id=${id}`;

    const html = `<!DOCTYPE html><html lang="tr"><head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="tr_TR">
<meta property="og:site_name" content="Assos'u Keşfet">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${image}">
</head><body><p>${esc(title)}</p></body></html>`;

    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } catch(e) { return next(); }
}

function gone410() {
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Mekan Bulunamadı — Assos'u Keşfet</title>
  <link rel="icon" href="/icon.png" type="image/png">
  <style>
    body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,#FAFAF8 0%,#FFF5EE 50%,#FFECD2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;color:#1A2744}
    .box{text-align:center;max-width:500px}
    .icon{width:140px;height:140px;margin:0 auto 32px;border-radius:50%;background:linear-gradient(135deg,#fff,#FFF5EE);box-shadow:0 8px 32px rgba(196,82,26,.12);display:flex;align-items:center;justify-content:center;font-size:3rem}
    h1{font-size:1.75rem;margin:0 0 12px;font-weight:800;letter-spacing:-.02em}
    p{color:#718096;font-size:1rem;line-height:1.7;margin:0 0 40px}
    a{display:inline-block;background:linear-gradient(135deg,#C4521A,#A3431A);color:#fff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;box-shadow:0 4px 16px rgba(196,82,26,.3)}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">🔍</div>
    <h1>Mekan Bulunamadı</h1>
    <p>Aradığınız mekan kaldırılmış veya artık erişime kapalı.</p>
    <a href="/mekanlar.html">Tüm Mekanları Keşfet →</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
