const BOT_UA = ['facebookexternalhit','Facebot','Twitterbot','LinkedInBot','WhatsApp','TelegramBot','Slackbot','Discord','Pinterest','Embedly','Iframely','vkShare'];
const DEFAULT_IMG = 'https://firebasestorage.googleapis.com/v0/b/assosu-kesfet.firebasestorage.app/o/site%2Fog-image.jpg?alt=media&token=70d62a44-9142-43d8-aee4-de790f5c7dcd';

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export async function onRequest(context) {
  const { request, next } = context;
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id || !BOT_UA.some(b => ua.includes(b))) return next();

  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/assosu-kesfet/databases/(default)/documents/venues/${id}`;
    const resp = await fetch(docUrl);
    if (!resp.ok) return next();
    const doc = await resp.json();
    const f = doc.fields || {};

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
