// Güvenli şifre sıfırlama endpoint'i
// - IP bazlı rate limit (5 dakikada max 3 istek)
// - Sadece users koleksiyonunda kayıtlı e-postalara mail gönderir
// - User enumeration önleme: kayıtlı olsun olmasın başarılı yanıt döner

const FIREBASE_API_KEY = 'AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs';

export async function onRequestPost(context) {
  const { request, env } = context;

  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some(o => referer.startsWith(o));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Geçersiz istek' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email) || email.length > 100) {
    return new Response(JSON.stringify({ error: 'Geçerli bir e-posta girin' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Debug modu: ?debug=1 query parametresi varsa detaylı hata döner
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  const steps = [];

  // IP bazlı rate limit — 5 dk'da max 3 istek
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.CHAT_KV) {
    try {
      const winKey = 'forgot_ip_' + ip + '_' + Math.floor(Date.now() / 300000); // 5 dk pencere
      const count = parseInt(await env.CHAT_KV.get(winKey) || '0');
      if (count >= 3) {
        return new Response(JSON.stringify({ error: 'Çok fazla istek. Lütfen 5 dakika sonra tekrar deneyin.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      await env.CHAT_KV.put(winKey, String(count + 1), { expirationTtl: 300 });

      // E-posta bazlı rate limit — aynı e-postaya günlük max 3
      const emailHash = await sha256(email);
      const dayKey = 'forgot_email_' + emailHash + '_' + new Date().toISOString().split('T')[0];
      const emailCount = parseInt(await env.CHAT_KV.get(dayKey) || '0');
      if (emailCount >= 3) {
        if (debug) {
          return new Response(JSON.stringify({ error: 'Email rate limit (günlük 3)', emailCount, dayKey }), { status: 429, headers: { 'Content-Type': 'application/json' } });
        }
        // Sessizce başarılı yanıt dön — saldırgan rate limit var anlayamasın
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      await env.CHAT_KV.put(dayKey, String(emailCount + 1), { expirationTtl: 86400 });
      steps.push({ step: 'rateLimit', ipCount: count + 1, emailCount: emailCount + 1 });
    } catch(e) { steps.push({ step: 'rateLimit', error: e.message }); }
  }

  try {
    const hasSplit = !!(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
    const hasSA = !!env.FIREBASE_SERVICE_ACCOUNT || hasSplit;
    const hasResend = !!env.RESEND_API_KEY;
    steps.push({ step: 'config', hasSplit, hasSA, hasResend });

    if (hasSA) {
      // 1) Service account JWT → OAuth access token
      let sa, accessToken;
      try {
        if (hasSplit) {
          sa = {
            client_email: String(env.FIREBASE_CLIENT_EMAIL).trim(),
            private_key: String(env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n')
          };
        } else {
          sa = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
        }
        accessToken = await getAccessToken(sa);
        steps.push({ step: 'accessToken', ok: !!accessToken });
      } catch(e) {
        console.error('[forgot-password] SA error:', e);
        steps.push({ step: 'accessToken', error: e.message });
        if (debug) return jsonResp({ error: 'SA error: ' + e.message, steps }, 500);
        return jsonResp({ error: 'Sunucu yapılandırma hatası.' }, 500);
      }

      // 2) E-posta kayıtlı mı?
      const lookupResp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
        body: JSON.stringify({ email: [email] })
      });
      const lookupData = await lookupResp.json().catch(() => ({}));
      const users = (lookupData && lookupData.users) || [];
      steps.push({ step: 'lookup', status: lookupResp.status, userCount: users.length });
      if (users.length === 0) {
        if (debug) return jsonResp({ error: 'Email kayıtlı değil', steps, lookupData }, 404);
        return jsonResp({ ok: false, registered: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.' }, 404);
      }

      // 3) Reset link al (returnOobLink: true → Firebase mail göndermesin)
      const oobResp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email, returnOobLink: true })
      });
      const oobData = await oobResp.json().catch(() => ({}));
      const resetLink = oobData.oobLink;
      steps.push({ step: 'oobLink', status: oobResp.status, hasLink: !!resetLink, err: oobData.error });

      if (!oobResp.ok || !resetLink) {
        console.error('[forgot-password] OOB link failed:', oobData);
        if (debug) return jsonResp({ error: 'OOB link alınamadı', steps, oobData }, 500);
        // Son çare: Firebase default mail
        await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email })
        });
        return jsonResp({ ok: true, fallback: 'firebase-default' }, 200);
      }

      // 4) Resend ile özel mail
      if (hasResend) {
        const html = buildResetMailHtml(resetLink, email);
        const text = `Merhaba,\n\nAssos'u Keşfet yönetim paneli için şifre sıfırlama talebi aldık.\n\nYeni şifre belirlemek için aşağıdaki linke tıklayın (1 saat geçerli):\n\n${resetLink}\n\nBu talebi siz yapmadıysanız bu maili görmezden gelebilirsiniz.\n\nAssos'u Keşfet Ekibi\ninfo@assosukesfet.com`;
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Assos\'u Keşfet <info@assosukesfet.com>',
            to: [email],
            subject: '🔑 Şifre Sıfırlama — Assos\'u Keşfet',
            html: html, text: text,
            reply_to: 'info@assosukesfet.com'
          })
        });
        const resendData = await resendResp.json().catch(() => ({}));
        steps.push({ step: 'resend', status: resendResp.status, id: resendData.id, err: resendData });
        if (!resendResp.ok) {
          console.error('[forgot-password] Resend failed:', resendData);
          if (debug) return jsonResp({ error: 'Resend failed', steps, resendData }, 500);
          // Resend başarısız → Firebase default mail gönder
          await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email })
          });
          return jsonResp({ ok: true, fallback: 'firebase-default', resendError: resendData.message || 'unknown' }, 200);
        }
        return jsonResp(debug ? { ok: true, steps, resendId: resendData.id } : { ok: true, sent: 'resend' }, 200);
      } else {
        // Resend yok → Firebase default
        await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email })
        });
        return jsonResp({ ok: true, sent: 'firebase-default', reason: 'no-resend-key' }, 200);
      }
    }

    // Service account yoksa: Firebase default mail
    const fallbackResp = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email })
    });
    if (!fallbackResp.ok) {
      const errData = await fallbackResp.json().catch(() => ({}));
      const msg = (errData.error && errData.error.message) || '';
      if (msg === 'EMAIL_NOT_FOUND') {
        return jsonResp({ ok: false, registered: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.' }, 404);
      }
    }
    return jsonResp({ ok: true, sent: 'firebase-default', reason: 'no-service-account' }, 200);
  } catch(e) {
    console.error('[forgot-password] unexpected:', e);
    if (debug) return jsonResp({ error: e.message, stack: e.stack, steps }, 500);
    return jsonResp({ ok: true }, 200);
  }
}

function jsonResp(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// ═══ HTML Mail Template ═══
function buildResetMailHtml(resetLink, email) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Şifre Sıfırlama</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;color:#1A2744">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F2;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#06101E 0%,#0C1A30 50%,#091420 100%);padding:36px 40px;text-align:center">
          <div style="font-family:Georgia,serif;font-size:1.6rem;font-weight:800;color:#F5EDE0;letter-spacing:-.02em">Assos'u Keşfet</div>
          <div style="font-size:.78rem;color:rgba(245,237,224,.5);margin-top:6px">Yönetim Paneli</div>
        </td></tr>
        <!-- İçerik -->
        <tr><td style="padding:36px 40px">
          <div style="font-size:1.3rem;font-weight:800;color:#1A2744;margin-bottom:14px">🔑 Şifre Sıfırlama Talebi</div>
          <p style="font-size:.95rem;line-height:1.7;color:#2D3748;margin:0 0 16px">Merhaba,</p>
          <p style="font-size:.95rem;line-height:1.7;color:#2D3748;margin:0 0 16px">
            Yönetim paneliniz için şifre sıfırlama talebi aldık. Yeni bir şifre belirlemek için aşağıdaki butona tıklayabilirsiniz.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#C4521A,#A3431A);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:.95rem;box-shadow:0 4px 14px rgba(196,82,26,.3)">🔑 Şifremi Sıfırla</a>
          </div>
          <p style="font-size:.82rem;line-height:1.6;color:#718096;margin:0 0 12px">
            Buton çalışmazsa, aşağıdaki bağlantıyı tarayıcınıza kopyalayıp yapıştırabilirsiniz:
          </p>
          <div style="background:#FAF7F2;padding:12px 14px;border-radius:8px;font-family:'Courier New',monospace;font-size:.72rem;color:#4A5568;word-break:break-all;margin-bottom:24px">${resetLink}</div>
          <div style="background:rgba(212,147,90,.08);border-left:3px solid #D4935A;padding:12px 14px;border-radius:6px;margin:20px 0">
            <div style="font-size:.78rem;color:#9C4221;line-height:1.6">
              <strong>⏰ Önemli:</strong> Bu link <strong>1 saat</strong> geçerlidir. Süre dolduktan sonra yeni bir sıfırlama talebi göndermeniz gerekir.
            </div>
          </div>
          <div style="background:rgba(229,62,62,.05);border-left:3px solid #E53E3E;padding:12px 14px;border-radius:6px;margin:16px 0">
            <div style="font-size:.78rem;color:#742A2A;line-height:1.6">
              <strong>🔒 Güvenlik:</strong> Bu talebi siz yapmadıysanız bu maili görmezden gelebilirsiniz, hesabınız güvende. Şifreniz değişmeyecektir.
            </div>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#FAF7F2;padding:24px 40px;text-align:center;border-top:1px solid rgba(0,0,0,.04)">
          <div style="font-size:.78rem;color:#1A2744;font-weight:700;margin-bottom:6px">Assos'u Keşfet</div>
          <div style="font-size:.72rem;color:#718096;margin-bottom:10px">Assos'un dijital keşif rehberi</div>
          <div style="font-size:.7rem;color:#A0AEC0">
            <a href="mailto:info@assosukesfet.com" style="color:#C4521A;text-decoration:none">info@assosukesfet.com</a>
            &middot;
            <a href="https://assosukesfet.com" style="color:#C4521A;text-decoration:none">assosukesfet.com</a>
          </div>
          <div style="font-size:.65rem;color:#A0AEC0;margin-top:12px">
            Bu otomatik bir maildir, lütfen yanıtlamayın. Sorularınız için <a href="mailto:info@assosukesfet.com" style="color:#A0AEC0">info@assosukesfet.com</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ═══ Service Account JSON Parser (çoklu format desteği) ═══
function parseServiceAccount(raw) {
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT tanımlı değil');
  if (typeof raw === 'object') return raw;
  const str = String(raw).trim();
  const repairNewlines = (s) => s.replace(/("private_key"\s*:\s*")([\s\S]*?)(",)/, (m, a, body, c) => a + body.replace(/\r?\n/g, '\\n') + c);
  const tryVariants = (s) => {
    const variants = [
      s, repairNewlines(s),
      s.startsWith('{') ? null : '{' + s + '}',
      s.startsWith('{') ? null : repairNewlines('{' + s + '}'),
      (() => { const f = s.indexOf('{'), l = s.lastIndexOf('}'); return (f >= 0 && l > f) ? s.slice(f, l + 1) : null; })(),
      (() => { const f = s.indexOf('{'), l = s.lastIndexOf('}'); return (f >= 0 && l > f) ? repairNewlines(s.slice(f, l + 1)) : null; })(),
    ].filter(Boolean);
    for (const v of variants) { try { return JSON.parse(v); } catch(e) {} }
    return null;
  };
  const parsed = tryVariants(str);
  if (parsed) return parsed;
  try {
    const decoded = atob(str.replace(/\s/g, ''));
    const parsedB64 = tryVariants(decoded);
    if (parsedB64) return parsedB64;
  } catch(e) {}
  throw new Error(`parse edilemedi. İlk 40 karakter: "${str.slice(0, 40).replace(/\n/g, '\\n')}..."`);
}

// ═══ Service Account JWT → Google OAuth Access Token ═══
async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/identitytoolkit',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const jwt = await signJWT(payload, serviceAccount.private_key);
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(jwt),
  });
  if (!resp.ok) throw new Error('OAuth token alınamadı');
  const data = await resp.json();
  return data.access_token;
}

async function signJWT(payload, privateKeyPem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(data));
  const sigB64 = base64UrlEncodeBytes(new Uint8Array(signature));
  return `${data}.${sigB64}`;
}

function base64UrlEncode(str) {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function base64UrlEncodeBytes(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
