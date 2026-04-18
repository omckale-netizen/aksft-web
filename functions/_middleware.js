// Cloudflare Pages Middleware
// Sosyal medya botlari icin mekan/rota detay sayfalarinda dinamik OG taglari

const BOT_USER_AGENTS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discord', 'Pinterest',
  'Embedly', 'Iframely', 'vkShare'
];

const DEFAULT_OG_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml({ title, description, url, image }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escHtml(url)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="Assos'u Keşfet">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(description)}">
  <meta name="twitter:image" content="${image}">
</head>
<body><p>${escHtml(title)}</p></body>
</html>`;
}

async function fetchFirestoreDoc(collection, docId) {
  const url = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/${collection}/${docId}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const doc = await resp.json();
  return doc.fields || null;
}

// Güvenlik header'larını response'a ekle
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms https://cdn.jsdelivr.net https://api.anthropic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https:;"
};

function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) newHeaders.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname;

  // ═══ Admin Gate Koruması ═══
  const adminPaths = ['/admin', '/admin.html', '/admin-login', '/admin-login.html'];
  if (adminPaths.includes(path)) {
    const GATE_KEY = (env.ADMIN_GATE_KEY || '').trim();
    // Fail-secure: env yoksa admin paneli kilitle (404'e yonlendir).
    // Misconfiguration durumunda admin URL'sinin disclosure edilmesini onler.
    if (!GATE_KEY) return Response.redirect(url.origin + '/404.html', 302);

    const gateParam = url.searchParams.get('gate');
    const cookies = request.headers.get('cookie') || '';
    const hasGateCookie = cookies.includes('admin_gate=' + GATE_KEY);

    if (gateParam === GATE_KEY) {
      // Dogru anahtar — cookie set et ve parametresiz URL'ye yonlendir
      const cleanUrl = url.origin + path;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': cleanUrl,
          'Set-Cookie': `admin_gate=${GATE_KEY}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
        }
      });
    }

    if (!hasGateCookie) {
      // Cookie yok — 404 sayfasina yonlendir
      return Response.redirect(url.origin + '/404.html', 302);
    }

    // Server-side brute force koruması — login sayfası için IP bazlı rate limit
    if ((path === '/admin-login' || path === '/admin-login.html') && env.CHAT_KV) {
      try {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const loginKey = 'login_attempt_' + ip + '_' + Math.floor(Date.now() / 300000); // 5 dakikalık pencere
        const attempts = parseInt(await env.CHAT_KV.get(loginKey) || '0');
        if (attempts >= 15) {
          return new Response(
            '<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#06101E;color:#F5EDE0;font-family:sans-serif;text-align:center"><div><h1>⛔</h1><h2>Çok fazla giriş denemesi</h2><p style="color:rgba(245,237,224,.5)">5 dakika sonra tekrar deneyin.</p></div></body></html>',
            { status: 429, headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Retry-After': '300' } }
          );
        }
        await env.CHAT_KV.put(loginKey, String(attempts + 1), { expirationTtl: 300 });
      } catch(e) {}
    }
    // Cookie var — devam et
  }

  // ═══ Bakim Modu Kontrolu ═══
  // Admin path'leri + API + static asset'ler dahil DEGIL (admin erisimi korunur)
  const skipMaintenance = path.startsWith('/admin') ||
    path.startsWith('/api/') ||
    path.startsWith('/yandex_') ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|map|txt|xml|json)$/i.test(path);
  if (!skipMaintenance && env.CHAT_KV) {
    try {
      const mRaw = await env.CHAT_KV.get('site:maintenance');
      if (mRaw) {
        const m = JSON.parse(mRaw);
        if (m && m.enabled) {
          const msg = (m.message || 'Kısa süre içinde geri döneceğiz.').replace(/[<>"']/g, '');
          const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Bakımda • Assos'u Keşfet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&family=Lora:ital,wght@0,400;1,500&display=swap">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;background:#06101E;color:#F5EDE0;position:relative}

/* Yildizli Ege gecesi arka plan */
.stars{position:absolute;inset:0;background:
  radial-gradient(ellipse 1200px 600px at 70% -10%, rgba(196,82,26,.18), transparent 60%),
  radial-gradient(ellipse 800px 500px at 20% 110%, rgba(26,107,138,.22), transparent 60%),
  linear-gradient(180deg,#06101E 0%,#0D1829 40%,#0F1E35 100%);
  overflow:hidden}
.star{position:absolute;background:#F5EDE0;border-radius:50%;opacity:0;animation:twinkle 4s infinite ease-in-out}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:.85;transform:scale(1)}}

/* Dalga deseni altta */
.wave{position:absolute;bottom:0;left:0;right:0;height:120px;opacity:.35}
.wave svg{width:100%;height:100%;display:block}

/* Merkez icerik */
.wrap{position:relative;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;z-index:2}
.art{margin-bottom:40px;position:relative}
.art svg{filter:drop-shadow(0 20px 50px rgba(196,82,26,.25))}

/* Eyebrow (terra) */
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:.68rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#D4935A;margin-bottom:22px;padding:8px 18px;border:1px solid rgba(212,147,90,.3);border-radius:999px;background:rgba(212,147,90,.06);backdrop-filter:blur(10px)}
.eyebrow .dot{width:6px;height:6px;background:#D4935A;border-radius:50%;animation:pulse 1.8s infinite}
@keyframes pulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}

/* Baslik — Lora italic (sanatsal) */
.title{font-family:'Lora',serif;font-style:italic;font-weight:500;font-size:clamp(2.4rem,6vw,4rem);line-height:1.05;letter-spacing:-.02em;color:#fff;margin-bottom:18px;max-width:700px}
.title .accent{background:linear-gradient(90deg,#D4935A,#E8A07A,#C4521A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* Alt metin */
.subtitle{font-size:1.05rem;font-weight:400;color:rgba(245,237,224,.72);line-height:1.7;max-width:520px;margin-bottom:36px}
.subtitle .hl{color:#F5EDE0;font-weight:600}

/* Alt kisim — sosyal + tahmini */
.footer-row{display:flex;gap:28px;align-items:center;flex-wrap:wrap;justify-content:center;padding:18px 28px;background:rgba(245,237,224,.04);border:1px solid rgba(245,237,224,.08);border-radius:999px;backdrop-filter:blur(12px)}
.foot-item{display:flex;align-items:center;gap:8px;font-size:.78rem;color:rgba(245,237,224,.65)}
.foot-item strong{color:#F5EDE0;font-weight:700}
.foot-item svg{opacity:.7}
.foot-sep{width:1px;height:16px;background:rgba(245,237,224,.15)}
.foot-link{color:#D4935A;text-decoration:none;font-weight:600;transition:color .2s}
.foot-link:hover{color:#F5EDE0}

/* Mobile */
@media(max-width:640px){
  .art svg{width:140px;height:auto}
  .wave{height:80px}
  .footer-row{flex-direction:column;gap:12px;border-radius:20px;padding:14px 20px}
  .foot-sep{display:none}
}
</style></head>
<body>
<div class="stars">
  <div class="star" style="width:2px;height:2px;top:12%;left:8%;animation-delay:0s"></div>
  <div class="star" style="width:1px;height:1px;top:18%;left:22%;animation-delay:1.2s"></div>
  <div class="star" style="width:2px;height:2px;top:8%;left:38%;animation-delay:.5s"></div>
  <div class="star" style="width:1px;height:1px;top:22%;left:55%;animation-delay:2s"></div>
  <div class="star" style="width:3px;height:3px;top:14%;left:72%;animation-delay:.8s"></div>
  <div class="star" style="width:1px;height:1px;top:28%;left:85%;animation-delay:1.5s"></div>
  <div class="star" style="width:2px;height:2px;top:35%;left:15%;animation-delay:2.5s"></div>
  <div class="star" style="width:1px;height:1px;top:42%;left:48%;animation-delay:.3s"></div>
  <div class="star" style="width:2px;height:2px;top:48%;left:78%;animation-delay:1.8s"></div>
  <div class="star" style="width:1px;height:1px;top:55%;left:32%;animation-delay:3s"></div>
  <div class="star" style="width:3px;height:3px;top:62%;left:68%;animation-delay:1s"></div>
  <div class="star" style="width:1px;height:1px;top:30%;left:5%;animation-delay:2.2s"></div>
</div>

<div class="wrap">
  <div class="art">
    <!-- Antik Ionic kolonlari (Athena Tapinagi'na gonderme) -->
    <svg width="180" height="200" viewBox="0 0 180 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Sol kolon -->
      <g opacity=".95">
        <ellipse cx="40" cy="175" rx="28" ry="4" fill="rgba(0,0,0,.3)" filter="blur(2px)"/>
        <!-- Basamak -->
        <rect x="15" y="165" width="50" height="8" fill="#E8D5C0" opacity=".9"/>
        <rect x="20" y="158" width="40" height="8" fill="#F5EDE0" opacity=".85"/>
        <!-- Govde -->
        <rect x="32" y="62" width="16" height="96" fill="#F5EDE0" opacity=".9"/>
        <!-- Oluklar -->
        <line x1="35" y1="62" x2="35" y2="158" stroke="#E8D5C0" stroke-width=".6" opacity=".7"/>
        <line x1="40" y1="62" x2="40" y2="158" stroke="#E8D5C0" stroke-width=".6" opacity=".7"/>
        <line x1="45" y1="62" x2="45" y2="158" stroke="#E8D5C0" stroke-width=".6" opacity=".7"/>
        <!-- Iyonyen basligi volüt -->
        <path d="M22 62 Q26 54 32 54 L48 54 Q54 54 58 62 L58 56 Q54 48 48 48 L32 48 Q26 48 22 56 Z" fill="#F5EDE0" opacity=".95"/>
        <circle cx="28" cy="55" r="2.5" fill="none" stroke="#E8D5C0" stroke-width=".8" opacity=".6"/>
        <circle cx="52" cy="55" r="2.5" fill="none" stroke="#E8D5C0" stroke-width=".8" opacity=".6"/>
      </g>

      <!-- Sag kolon (kirili — bakimda gibi) -->
      <g opacity=".85">
        <ellipse cx="135" cy="175" rx="28" ry="4" fill="rgba(0,0,0,.3)" filter="blur(2px)"/>
        <!-- Basamak -->
        <rect x="110" y="165" width="50" height="8" fill="#E8D5C0" opacity=".85"/>
        <rect x="115" y="158" width="40" height="8" fill="#F5EDE0" opacity=".8"/>
        <!-- Govde (üst kismi kirili) -->
        <rect x="127" y="95" width="16" height="63" fill="#F5EDE0" opacity=".85"/>
        <path d="M127 95 L143 95 L141 88 L136 92 L130 85 L127 95 Z" fill="#F5EDE0" opacity=".85"/>
        <line x1="130" y1="95" x2="130" y2="158" stroke="#E8D5C0" stroke-width=".6" opacity=".6"/>
        <line x1="135" y1="95" x2="135" y2="158" stroke="#E8D5C0" stroke-width=".6" opacity=".6"/>
        <line x1="140" y1="95" x2="140" y2="158" stroke="#E8D5C0" stroke-width=".6" opacity=".6"/>
      </g>

      <!-- Yukselen Gunes/Ay halesi (arkada) -->
      <circle cx="90" cy="55" r="32" fill="rgba(212,147,90,.08)" opacity=".6">
        <animate attributeName="r" values="32;36;32" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="90" cy="55" r="20" fill="none" stroke="rgba(212,147,90,.35)" stroke-width=".5" opacity=".5"/>

      <!-- Ucusan yaprak / rüzgar çizgileri -->
      <path d="M70 110 Q80 105 90 115 T110 120" stroke="rgba(212,147,90,.35)" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6">
        <animate attributeName="opacity" values=".3;.7;.3" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M60 135 Q75 125 85 135 T105 138" stroke="rgba(212,147,90,.25)" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".4">
        <animate attributeName="opacity" values=".2;.5;.2" dur="3.5s" repeatCount="indefinite"/>
      </path>
    </svg>
  </div>

  <div class="eyebrow"><span class="dot"></span>Geçici Kesinti</div>

  <h1 class="title">Antik kente <span class="accent">küçük bir dokunuş</span> yapıyoruz</h1>

  <p class="subtitle">${msg} <span class="hl">Sayfaya birazdan tekrar uğrayın — yeni halini görmeniz için sabırsızlanıyoruz.</span></p>

  <div class="footer-row">
    <div class="foot-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>Tahmini dönüş: <strong>birkaç dakika</strong></span>
    </div>
    <div class="foot-sep"></div>
    <div class="foot-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      <span>Acil: <a href="mailto:info@assosukesfet.com" class="foot-link">info@assosukesfet.com</a></span>
    </div>
    <div class="foot-sep"></div>
    <div class="foot-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
      <a href="https://instagram.com/assosukesfet" target="_blank" rel="noopener" class="foot-link">@assosukesfet</a>
    </div>
  </div>
</div>

<!-- Dalga deseni (Ege denizi) -->
<div class="wave">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,40 C150,100 350,0 600,50 C850,100 1050,10 1200,60 L1200,120 L0,120 Z" fill="rgba(26,107,138,.3)"/>
    <path d="M0,60 C200,110 400,20 600,70 C800,120 1000,30 1200,80 L1200,120 L0,120 Z" fill="rgba(26,107,138,.2)"/>
    <path d="M0,80 C250,120 450,40 700,85 C900,120 1050,50 1200,95 L1200,120 L0,120 Z" fill="rgba(13,24,41,.6)"/>
  </svg>
</div>
</body></html>`;
          return new Response(html, {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=UTF-8',
              'Retry-After': '600',
              'Cache-Control': 'no-store',
              'X-Robots-Tag': 'noindex, nofollow'
            }
          });
        }
      }
    } catch(e) { /* KV okunmazsa normal devam et */ }
  }

  // Dinamik Sitemap
  if (path === '/sitemap.xml') {
    try {
      return await generateDynamicSitemap();
    } catch(e) { return next(); }
  }

  // Sadece botlar icin calis
  if (!isBot(ua)) return next();

  // Mekan detay sayfasi
  if (path.includes('/mekanlar/mekan-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('venues', id);
      if (!fields) return next();

      // Kategori bilgisini Firebase'den çekmeye çalış, yoksa fallback
      let catLabel = 'Assos Mekanlar';
      let catSing = 'mekan';
      const cat = fields.category?.stringValue || '';
      try {
        const catDoc = await fetch('https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/settings/venue_categories');
        if (catDoc.ok) {
          const catData = await catDoc.json();
          const list = catData.fields?.list?.arrayValue?.values || [];
          const found = list.find(c => c.mapValue?.fields?.id?.stringValue === cat);
          if (found) {
            const fLabel = found.mapValue.fields.label?.stringValue || cat;
            catLabel = 'Assos ' + fLabel;
            catSing = fLabel.toLowerCase();
          }
        }
      } catch(e) {}
      if (catLabel === 'Assos Mekanlar') {
        const fallbackLabels = {kafe:'Assos Kafeler',restoran:'Assos Restoranlar',kahvalti:'Assos Kahvaltı Mekanları',konaklama:'Assos Otelleri',beach:'Assos Beach Club',iskele:'Assos İskeleler'};
        const fallbackSing = {kafe:'kafe',restoran:'restoran',kahvalti:'kahvaltı mekanı',konaklama:'otel',beach:'beach club',iskele:'iskele'};
        catLabel = fallbackLabels[cat] || 'Assos Mekanlar';
        catSing = fallbackSing[cat] || 'mekan';
      }
      const venueName = fields.title?.stringValue || 'Mekan';
      const loc = fields.location?.stringValue || 'Assos';
      const title = venueName + ' \u2014 ' + catLabel + ' | Assos\'u Keşfet';
      const shortDesc = (fields.shortDesc?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 120);
      const desc = venueName + '. ' + loc + ' bölgesinde ' + catSing + '. ' + shortDesc;
      let image = DEFAULT_OG_IMAGE;
      if (fields.images?.arrayValue?.values?.length > 0) {
        image = fields.images.arrayValue.values[0].stringValue || image;
      }

      const schemaTypes = {kafe:'CafeOrCoffeeShop',restoran:'Restaurant',kahvalti:'Restaurant',konaklama:'Hotel',beach:'BarOrPub',iskele:'FoodEstablishment'};
      const phone = fields.phone?.stringValue || '';
      const schema = JSON.stringify({
        '@context':'https://schema.org','@type':schemaTypes[cat]||'LocalBusiness',
        'name':venueName,'description':shortDesc,
        'address':{'@type':'PostalAddress','addressLocality':loc,'addressRegion':'Canakkale','addressCountry':'TR'},
        'telephone':phone,'image':image
      });

      const html = buildOgHtml({
        title,
        description: desc || 'Assos ve Ayvacık\'ta mekan detayı.',
        url: `https://assosukesfet.com/mekanlar/mekan-detay.html?id=${id}`,
        image
      }).replace('</head>', '<script type="application/ld+json">' + schema + '</script></head>');

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Rota detay sayfasi
  if (path.includes('/rotalar/rota-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('routes', id);
      if (!fields) return next();

      const title = (fields.title?.stringValue || 'Rota') + ' \u2014 Assos\'u Keşfet';
      const desc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 200);

      return new Response(buildOgHtml({
        title,
        description: desc || 'Assos rota detayları.',
        url: `https://assosukesfet.com/rotalar/rota-detay.html?id=${id}`,
        image: DEFAULT_OG_IMAGE
      }), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Koy detay sayfasi
  if (path.includes('/koyler/koy-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('villages', id);
      if (!fields) return next();

      const villageName = fields.title?.stringValue || 'Köy';
      const title = villageName + ' Köyü \u2014 Assos Köyleri | Assos\'u Keşfet';
      const shortDesc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 160);
      const desc = villageName + ', Ayvacık bölgesinde. ' + shortDesc;
      const image = fields.image?.stringValue || DEFAULT_OG_IMAGE;

      const schema = JSON.stringify({
        '@context':'https://schema.org','@type':'Place',
        'name':villageName,'description':shortDesc,
        'address':{'@type':'PostalAddress','addressLocality':villageName,'addressRegion':'Ayvacık, Çanakkale','addressCountry':'TR'},
        'image':image
      });

      const html = buildOgHtml({
        title,
        description: desc || 'Assos ve Ayvacık bölgesinde köy detayı.',
        url: `https://assosukesfet.com/koyler/koy-detay?id=${id}`,
        image
      }).replace('</head>', '<script type="application/ld+json">' + schema + '</script></head>');

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Yer detay sayfasi
  if (path.includes('/yerler/yer-detay')) {
    const id = url.searchParams.get('id');
    if (!id) return next();

    try {
      const fields = await fetchFirestoreDoc('places', id);
      if (!fields) return next();

      const placeName = fields.title?.stringValue || 'Gezilecek Yer';
      const title = placeName + ' \u2014 Assos Bölgesi | Assos\'u Keşfet';
      const shortDesc = (fields.shortDesc?.stringValue || fields.description?.stringValue || '').replace(/<[^>]*>/g, '').substring(0, 160);
      const location = fields.location?.stringValue || 'Ayvacık';
      const desc = placeName + ', ' + location + '. ' + shortDesc;
      const image = fields.image?.stringValue || DEFAULT_OG_IMAGE;

      const schema = JSON.stringify({
        '@context':'https://schema.org','@type':'Place',
        'name':placeName,'description':shortDesc,
        'address':{'@type':'PostalAddress','addressLocality':location,'addressRegion':'Ayvacık, Çanakkale','addressCountry':'TR'},
        'image':image
      });

      const html = buildOgHtml({
        title,
        description: desc || 'Assos ve Ayvacık bölgesinde gezilecek yer detayı.',
        url: `https://assosukesfet.com/yerler/yer-detay?id=${id}`,
        image
      }).replace('</head>', '<script type="application/ld+json">' + schema + '</script></head>');

      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Blog detay sayfasi (?yazi=slug)
  if ((path === '/blog' || path === '/blog.html') && url.searchParams.get('yazi')) {
    const slug = url.searchParams.get('yazi');
    if (!slug) return next();

    try {
      const fields = await fetchFirestoreDoc('blog_posts', slug);
      if (!fields) return next();

      const title = (fields.title?.stringValue || 'Blog') + ' \u2014 Assos\'u Keşfet';
      const desc = (fields.excerpt?.stringValue || '').substring(0, 200);
      const image = fields.coverImage?.stringValue || fields.image?.stringValue || DEFAULT_OG_IMAGE;

      return new Response(buildOgHtml({
        title,
        description: desc || 'Assos hakkında blog yazısı.',
        url: `https://assosukesfet.com/blog?yazi=${slug}`,
        image
      }), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } catch (e) { return next(); }
  }

  // Diger sayfalar — normal devam + güvenlik header'ları
  const response = await next();
  return addSecurityHeaders(response);
}

// ══════════════════════════════════════════════════
// DINAMIK SITEMAP + GORSEL SITEMAP
// ══════════════════════════════════════════════════
async function generateDynamicSitemap() {
  const BASE = 'https://assosukesfet.com';
  const today = new Date().toISOString().split('T')[0];

  // Statik sayfalar
  const staticPages = [
    { loc: '/', priority: '1.0', freq: 'weekly' },
    { loc: '/mekanlar', priority: '0.9', freq: 'weekly' },
    { loc: '/rotalar', priority: '0.9', freq: 'weekly' },
    { loc: '/yerler', priority: '0.9', freq: 'weekly' },
    { loc: '/koyler', priority: '0.9', freq: 'weekly' },
    { loc: '/harita', priority: '0.8', freq: 'weekly' },
    { loc: '/rehber', priority: '0.9', freq: 'weekly' },
    { loc: '/blog', priority: '0.8', freq: 'weekly' },
    { loc: '/planla', priority: '0.7', freq: 'monthly' },
    { loc: '/hakkimizda', priority: '0.4', freq: 'monthly' },
    { loc: '/iletisim', priority: '0.4', freq: 'monthly' },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // Statik sayfalar
  for (const p of staticPages) {
    xml += `  <url><loc>${BASE}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>\n`;
  }

  // Mekanlar — Firebase'den cek
  try {
    const venuesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/venues?pageSize=500';
    const vResp = await fetch(venuesUrl);
    if (vResp.ok) {
      const vData = await vResp.json();
      const docs = vData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        const active = f.active?.booleanValue !== false;
        const status = f.status?.stringValue || 'published';
        if (!active || status === 'hidden' || status === 'draft') continue;

        xml += `  <url>\n    <loc>${BASE}/mekanlar/mekan-detay?id=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n`;
        // Gorseller
        const images = f.images?.arrayValue?.values || [];
        for (const img of images) {
          const imgUrl = img.stringValue;
          if (imgUrl) {
            const title = f.title?.stringValue || id;
            xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)} - Assos</image:title></image:image>\n`;
          }
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  // Rotalar — Firebase'den cek
  try {
    const routesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/routes?pageSize=500';
    const rResp = await fetch(routesUrl);
    if (rResp.ok) {
      const rData = await rResp.json();
      const docs = rData.documents || [];
      for (const doc of docs) {
        const id = doc.name.split('/').pop();
        xml += `  <url><loc>${BASE}/rotalar/rota-detay?id=${id}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
      }
    }
  } catch(e) {}

  // Yerler — Firebase'den cek
  try {
    const placesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/places?pageSize=500';
    const pResp = await fetch(placesUrl);
    if (pResp.ok) {
      const pData = await pResp.json();
      const docs = pData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        xml += `  <url>\n    <loc>${BASE}/yerler/yer-detay?id=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n`;
        const imgUrl = f.image?.stringValue;
        if (imgUrl) {
          const title = f.title?.stringValue || id;
          xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)} - Assos</image:title></image:image>\n`;
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  // Koyler — Firebase'den cek
  try {
    const villagesUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/villages?pageSize=500';
    const vResp = await fetch(villagesUrl);
    if (vResp.ok) {
      const vData = await vResp.json();
      const docs = vData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        xml += `  <url>\n    <loc>${BASE}/koyler/koy-detay?id=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n`;
        const imgUrl = f.image?.stringValue;
        if (imgUrl) {
          const title = f.title?.stringValue || id;
          xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)} Köyü - Assos</image:title></image:image>\n`;
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  // Blog yazilari — Firebase'den cek
  try {
    const blogUrl = 'https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/blog_posts?pageSize=500';
    const bResp = await fetch(blogUrl);
    if (bResp.ok) {
      const bData = await bResp.json();
      const docs = bData.documents || [];
      for (const doc of docs) {
        const f = doc.fields || {};
        const id = doc.name.split('/').pop();
        const status = f.status?.stringValue;
        if (status !== 'published') continue;

        xml += `  <url>\n    <loc>${BASE}/blog?yazi=${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n`;
        const imgUrl = f.image?.stringValue;
        if (imgUrl) {
          const title = f.title?.stringValue || id;
          xml += `    <image:image><image:loc>${escHtml(imgUrl)}</image:loc><image:title>${escHtml(title)}</image:title></image:image>\n`;
        }
        xml += '  </url>\n';
      }
    }
  } catch(e) {}

  xml += '</urlset>';

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
