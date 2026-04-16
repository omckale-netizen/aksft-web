// /yerler/yer-detay — Firebase'de yer yoksa HTTP 410 Gone döner

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return next();
  if (request.method !== 'GET') return next();

  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/places/${encodeURIComponent(id)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.status === 404) return gone410();
    if (!resp.ok) return next();

    return next();
  } catch(e) { return next(); }
}

function gone410() {
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Yer Bulunamadı — Assos'u Keşfet</title>
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
    <div class="icon">📍</div>
    <h1>Yer Bulunamadı</h1>
    <p>Aradığınız yer kaldırılmış veya artık erişime kapalı.</p>
    <a href="/yerler.html">Tüm Yerleri Keşfet →</a>
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
