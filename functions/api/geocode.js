export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get('q');
  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing q parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
