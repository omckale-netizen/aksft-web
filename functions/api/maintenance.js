// Maintenance mode toggle — admin-only
// KV key: site:maintenance = '1' (aktif) veya silinmis (kapali)
import { requireAdmin } from './_verify.js';

const KV_KEY = 'site:maintenance';

export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) return json({ error: 'Yetkisiz' }, 401, corsHeaders);

  if (!env.CHAT_KV) return json({ error: 'KV binding eksik (CHAT_KV)' }, 500, corsHeaders);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Gecersiz istek' }, 400, corsHeaders); }

  const enable = !!body.enable;
  const message = String(body.message || '').slice(0, 300);
  const type = String(body.type || 'general').slice(0, 40);
  const eta = String(body.eta || 'birkaç dakika').slice(0, 80);

  try {
    if (enable) {
      await env.CHAT_KV.put(KV_KEY, JSON.stringify({
        enabled: true,
        type: type,
        eta: eta,
        message: message,
        since: new Date().toISOString(),
      }));
    } else {
      await env.CHAT_KV.delete(KV_KEY);
    }
    return json({ ok: true, enabled: enable }, 200, corsHeaders);
  } catch (err) {
    console.error('[maintenance] error:', err);
    return json({ error: 'Hata: ' + (err.message || 'bilinmeyen') }, 500, corsHeaders);
  }
}

// GET ile durum sorgusu (admin-only degil — UI durumu gorebilsin)
export async function onRequestGet(context) {
  const { env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  if (!env.CHAT_KV) return new Response(JSON.stringify({ enabled: false }), { status: 200, headers: corsHeaders });
  try {
    const raw = await env.CHAT_KV.get(KV_KEY);
    if (!raw) return new Response(JSON.stringify({ enabled: false }), { status: 200, headers: corsHeaders });
    const data = JSON.parse(raw);
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ enabled: false }), { status: 200, headers: corsHeaders });
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
