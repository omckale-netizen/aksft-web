// Cloudflare cache purge — admin-only
// Env vars gerekli: CF_ZONE_ID, CF_API_TOKEN (Zone.Cache Purge permission)
import { requireAdmin } from './_verify.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) return json({ error: 'Yetkisiz' }, 401, corsHeaders);

  const zoneId = (env.CF_ZONE_ID || '').trim();
  const apiToken = (env.CF_API_TOKEN || '').trim();
  if (!zoneId || !apiToken) {
    return json({ error: 'CF_ZONE_ID veya CF_API_TOKEN env var eksik' }, 500, corsHeaders);
  }

  try {
    const resp = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return json({
        error: 'Cloudflare API hatasi',
        details: (data.errors || []).map(e => e.message).join(', ') || 'bilinmeyen',
        status: resp.status
      }, 502, corsHeaders);
    }
    return json({ ok: true, purged: true, timestamp: new Date().toISOString() }, 200, corsHeaders);
  } catch (err) {
    console.error('[purge-cache] error:', err);
    return json({ error: 'Purge hatasi: ' + (err.message || 'bilinmeyen') }, 500, corsHeaders);
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
