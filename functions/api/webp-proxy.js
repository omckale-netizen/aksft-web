// WebP Migration proxy — Firebase Storage'tan gorsel fetch eder (CORS bypass)
// Sadece admin, sadece firebasestorage.googleapis.com URL'leri.
import { requireAdmin } from './_verify.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  // CORS
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Admin yetki
  const isAdmin = await requireAdmin(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Yetkisiz' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response(JSON.stringify({ error: 'url parametresi eksik' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Whitelist — sadece Firebase Storage
  const okHost = /^https:\/\/firebasestorage\.(googleapis\.com|app)\//i.test(target)
    || /^https:\/\/[a-z0-9-]+\.firebasestorage\.app\//i.test(target);
  if (!okHost) {
    return new Response(JSON.stringify({ error: 'Sadece Firebase Storage URL\'leri' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const resp = await fetch(target);
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Kaynak hatasi: HTTP ' + resp.status }), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const ct = resp.headers.get('Content-Type') || 'application/octet-stream';
    const buf = await resp.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fetch hatasi: ' + String(err.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://assosukesfet.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
