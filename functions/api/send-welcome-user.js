// Yeni kullanıcı 'hoş geldin' maili — admin_gate link'i + geçici şifre + rol rehberi
// - Admin-only endpoint
// - ADMIN_GATE_KEY'i env'den okur, login URL'ine ekler
// - Resend API ile özel HTML maili gönderir

import { checkAuth } from './_verify.js';

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
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Admin doğrulaması
  const auth = await checkAuth(request, env, 'admin');
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Yetkisiz', detail: auth.error }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Env kontrolü
  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'Resend API key tanımlı değil' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Body parse
  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Geçersiz JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

  const toEmail = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const role = String(body.role || 'editor').trim();
  const tempPassword = String(body.tempPassword || '').trim();

  if (!toEmail || !/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(toEmail)) {
    return new Response(JSON.stringify({ error: 'Geçerli email gerekli' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (!name) {
    return new Response(JSON.stringify({ error: 'İsim gerekli' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (!tempPassword || tempPassword.length < 6) {
    return new Response(JSON.stringify({ error: 'Geçici şifre gerekli (min 6 karakter)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Gate key ile login URL'i
  const gateKey = (env.ADMIN_GATE_KEY || '').trim();
  const loginUrl = gateKey
    ? 'https://assosukesfet.com/admin-login?gate=' + encodeURIComponent(gateKey)
    : 'https://assosukesfet.com/admin-login';

  const roleLabel = role === 'admin' ? 'Yönetici (Admin)'
    : role === 'editor' ? 'Editör'
    : 'İzleyici (Viewer)';
  const roleDesc = role === 'admin'
    ? 'Tüm panel alanlarına tam erişiminiz var. Kullanıcı yönetimi, mekan/blog CRUD, yedekleme, güvenlik ayarları dahil her şeyi yapabilirsiniz.'
    : role === 'editor'
    ? 'Size verilen sayfalarda içerik (mekan, blog, mesaj vb.) düzenleyebilirsiniz. Silme ve yönetici işleri admin tarafından açılmadıkça kapalıdır.'
    : 'Sadece okuma yetkiniz var. İçerikleri ve istatistikleri görüntüleyebilirsiniz — düzenleme yapamazsınız.';

  const html = buildWelcomeMailHtml({
    name, email: toEmail, role, roleLabel, roleDesc,
    tempPassword, loginUrl, invitedBy: auth.email || 'Yönetici'
  });
  const text = buildWelcomeMailText({
    name, email: toEmail, roleLabel, tempPassword, loginUrl, invitedBy: auth.email || 'Yönetici'
  });

  try {
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Assos\'u Keşfet <info@assosukesfet.com>',
        to: [toEmail],
        subject: '🔑 Assos\'u Keşfet Yönetim Paneline Davet Edildiniz',
        html, text,
        reply_to: 'info@assosukesfet.com'
      })
    });
    const resendData = await resendResp.json().catch(() => ({}));
    if (!resendResp.ok) {
      return new Response(JSON.stringify({ error: 'Mail gönderilemedi', detail: resendData }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true, id: resendData.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch(e) {
    console.error('[send-welcome-user] error:', e);
    return new Response(JSON.stringify({ error: 'İşlem hatası: ' + (e.message || '') }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions(context) {
  const allowedOrigins = ['https://assosukesfet.com', 'https://www.assosukesfet.com'];
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }});
}

// ═══ HTML MAIL TEMPLATE ═══
function buildWelcomeMailHtml({ name, email, role, roleLabel, roleDesc, tempPassword, loginUrl, invitedBy }) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><title>Yönetim Paneli Daveti</title></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;color:#1A2744">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F2;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#06101E 0%,#0C1A30 50%,#091420 100%);padding:36px 40px;text-align:center">
    <div style="font-family:Georgia,serif;font-size:1.6rem;font-weight:800;color:#F5EDE0;letter-spacing:-.02em">Assos'u Keşfet</div>
    <div style="font-size:.78rem;color:rgba(245,237,224,.5);margin-top:6px">Yönetim Paneli</div>
  </td></tr>

  <!-- Hoş geldin -->
  <tr><td style="padding:32px 40px 8px">
    <div style="font-size:1.3rem;font-weight:800;color:#1A2744;margin-bottom:8px">🔑 Yönetim Paneline Davet Edildiniz</div>
    <p style="font-size:.95rem;line-height:1.7;color:#2D3748;margin:0">Merhaba <strong>${esc(name)}</strong>,</p>
    <p style="font-size:.95rem;line-height:1.7;color:#2D3748;margin:12px 0 0">
      <strong>${esc(invitedBy)}</strong> sizi Assos'u Keşfet yönetim paneline <strong>${esc(roleLabel)}</strong> olarak ekledi.
      Aşağıdaki bilgilerle ilk girişinizi yapabilirsiniz.
    </p>
  </td></tr>

  <!-- Rol açıklaması -->
  <tr><td style="padding:0 40px 20px">
    <div style="background:rgba(26,107,138,.05);border-left:3px solid #1A6B8A;padding:12px 16px;border-radius:8px;margin-top:16px">
      <div style="font-size:.78rem;font-weight:700;color:#1A6B8A;margin-bottom:4px">🎭 Rolünüz: ${esc(roleLabel)}</div>
      <div style="font-size:.82rem;color:#2D3748;line-height:1.6">${esc(roleDesc)}</div>
    </div>
  </td></tr>

  <!-- Giriş bilgileri -->
  <tr><td style="padding:0 40px 10px">
    <div style="font-size:.9rem;font-weight:700;color:#1A2744;margin-bottom:10px;margin-top:10px">📋 Giriş Bilgileriniz</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F2;border-radius:10px;overflow:hidden">
      <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(0,0,0,.05)">
        <div style="font-size:.7rem;color:#718096;margin-bottom:2px">E-POSTA</div>
        <div style="font-size:.95rem;font-weight:600;color:#1A2744">${esc(email)}</div>
      </td></tr>
      <tr><td style="padding:14px 18px">
        <div style="font-size:.7rem;color:#718096;margin-bottom:2px">GEÇİCİ ŞİFRE</div>
        <div style="font-size:1rem;font-weight:700;color:#C4521A;font-family:'SF Mono',Consolas,monospace;letter-spacing:.5px">${esc(tempPassword)}</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:20px 40px;text-align:center">
    <a href="${esc(loginUrl)}" style="display:inline-block;background:linear-gradient(135deg,#C4521A,#A3431A);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:.95rem;box-shadow:0 4px 14px rgba(196,82,26,.3)">🔐 Panele Giriş Yap</a>
    <div style="font-size:.7rem;color:#718096;margin-top:10px">Butonu tıklayınca özel giriş linkiyle yönlendirilirsiniz</div>
  </td></tr>

  <!-- Güvenlik uyarıları -->
  <tr><td style="padding:8px 40px 20px">
    <div style="background:rgba(221,107,32,.07);border-left:3px solid #DD6B20;padding:12px 16px;border-radius:8px;margin-bottom:10px">
      <div style="font-size:.78rem;color:#9C4221;line-height:1.6">
        <strong>🔐 İlk girişte şifrenizi değiştirmeniz zorunludur.</strong><br>
        Güvenliğiniz için sistem sizi otomatik olarak şifre değiştirme ekranına yönlendirecek. Şifreniz min 8 karakter olmalı, başkasıyla paylaşmayın.
      </div>
    </div>
    <div style="background:rgba(59,130,246,.05);border-left:3px solid #3B82F6;padding:12px 16px;border-radius:8px">
      <div style="font-size:.78rem;color:#1E40AF;line-height:1.6">
        <strong>💡 Özel giriş linki:</strong> Yukarıdaki butonun içinde gizli bir güvenlik anahtarı var. Bu linki <strong>başkasıyla paylaşmayın</strong>. Linki bir kez tıkladığınızda tarayıcınıza kaydedilir; sonraki girişlerde direkt <a href="https://assosukesfet.com/admin-login" style="color:#3B82F6">assosukesfet.com/admin-login</a> adresine gidebilirsiniz.
      </div>
    </div>
  </td></tr>

  <!-- Başlangıç rehberi -->
  <tr><td style="padding:0 40px 24px">
    <div style="font-size:.9rem;font-weight:700;color:#1A2744;margin-bottom:12px;margin-top:10px">🚀 Hızlı Başlangıç</div>
    <div style="font-size:.82rem;color:#2D3748;line-height:1.7">
      <p style="margin:0 0 8px"><strong>1.</strong> Yukarıdaki "Panele Giriş Yap" butonuna tıklayın.</p>
      <p style="margin:0 0 8px"><strong>2.</strong> E-posta ve geçici şifreyle giriş yapın.</p>
      <p style="margin:0 0 8px"><strong>3.</strong> Açılan modal'da şifrenizi yenileriyle değiştirin.</p>
      <p style="margin:0 0 8px"><strong>4.</strong> Sidebar'dan erişiminiz olan sayfaları keşfedin. Üst kısımda <strong>⌘K / Ctrl+K</strong> ile hızlı arama yapabilirsiniz.</p>
      <p style="margin:0 0 8px"><strong>5.</strong> <strong>Ayarlar</strong> sayfasından profil fotoğrafınızı ekleyebilir, şifrenizi değiştirebilirsiniz.</p>
      <p style="margin:8px 0 0;font-size:.75rem;color:#718096">Soru veya sorunlarda yöneticiye danışabilir ya da <a href="mailto:info@assosukesfet.com" style="color:#C4521A;text-decoration:none">info@assosukesfet.com</a> adresine yazabilirsiniz.</p>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#FAF7F2;padding:24px 40px;text-align:center;border-top:1px solid rgba(0,0,0,.04)">
    <div style="font-size:.78rem;color:#1A2744;font-weight:700;margin-bottom:6px">Assos'u Keşfet</div>
    <div style="font-size:.72rem;color:#718096;margin-bottom:10px">Assos'un dijital keşif rehberi · Yönetim Paneli</div>
    <div style="font-size:.7rem;color:#A0AEC0">
      <a href="mailto:info@assosukesfet.com" style="color:#C4521A;text-decoration:none">info@assosukesfet.com</a>
      &middot;
      <a href="https://assosukesfet.com" style="color:#C4521A;text-decoration:none">assosukesfet.com</a>
    </div>
    <div style="font-size:.65rem;color:#A0AEC0;margin-top:12px">
      Bu davet mailini yetkili bir yönetici gönderdi. Siz bu hesabı beklemiyorsanız ${esc(invitedBy)} ile iletişime geçin.
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildWelcomeMailText({ name, email, roleLabel, tempPassword, loginUrl, invitedBy }) {
  return `Merhaba ${name},

${invitedBy} sizi Assos'u Keşfet yönetim paneline ${roleLabel} olarak ekledi.

Giriş bilgileriniz:
- E-posta: ${email}
- Geçici şifre: ${tempPassword}

Özel giriş linkiniz:
${loginUrl}

ÖNEMLİ: İlk girişte şifrenizi değiştirmeniz zorunludur. Sistem sizi otomatik olarak şifre değiştirme ekranına yönlendirecek.

Hızlı Başlangıç:
1. Yukarıdaki linke tıklayın
2. E-posta ve geçici şifreyle giriş yapın
3. Açılan ekrandan yeni şifrenizi belirleyin
4. Sidebar'dan erişiminiz olan sayfaları keşfedin (⌘K/Ctrl+K ile hızlı arama)
5. Ayarlar'dan profil fotoğrafı ve şifre ayarları

Sorunlar için: info@assosukesfet.com

Assos'u Keşfet — Yönetim Paneli`;
}
