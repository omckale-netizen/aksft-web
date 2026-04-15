/* ═══════════════════════════════════════════
   ASSOS'U KEŞFET — SHARED JS
   Nav, Footer, Search, Utilities
═══════════════════════════════════════════ */

// Türkçe bulunma eki (-da/-de/-ta/-te) — son ünlüye göre
function bulunmaEki(s) {
  if (!s) return "'da";
  var lower = s.toLowerCase().replace(/\s+/g,'');
  // Son ünlüyü bul
  var kalin = 'aıou';
  var ince = 'eiöü';
  var sert = 'çfhkpstş';
  var lastVowel = '';
  for (var i = lower.length - 1; i >= 0; i--) {
    if (kalin.includes(lower[i]) || ince.includes(lower[i])) { lastVowel = lower[i]; break; }
  }
  var lastChar = lower[lower.length - 1];
  var isKalin = kalin.includes(lastVowel);
  var isSert = sert.includes(lastChar);
  if (isKalin && isSert) return "'ta";
  if (isKalin) return "'da";
  if (isSert) return "'te";
  return "'de";
}

// Türkçe karakter düzeltme (Firebase'de eksik karakterler)
function fixTR(s) {
  if (!s) return s;
  return s
    .replace(/\bPazartesi\b/gi, 'Pazartesi')
    .replace(/\bSali\b/g, 'Salı')
    .replace(/\bCarsamba\b/g, 'Çarşamba')
    .replace(/\bPersembe\b/g, 'Perşembe')
    .replace(/\bCuma\b/gi, 'Cuma')
    .replace(/\bCumartesi\b/gi, 'Cumartesi')
    .replace(/\bPazar\b/gi, 'Pazar')
    .replace(/\bKapali\b/g, 'Kapalı')
    .replace(/\bAcik\b/g, 'Açık')
    .replace(/\bHer gun\b/gi, 'Her gün')
    .replace(/\bher gun\b/gi, 'her gün');
}

/* ── HTML attribute escape (XSS koruması) ── */
function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── Preconnect kaldirildi — HTML'deki yeterli ── */

/* ── Premium Helper ── */
function isPremiumActive(v) {
  if (!v || !v.premium) return false;
  var now = new Date().toISOString().split('T')[0];
  if (v.premiumStart && now < v.premiumStart) return false;
  if (v.premiumEnd && now >= v.premiumEnd) return false;
  return true;
}

/* ── Favicon (cache + Firebase) ── */
(function() {
  var fav32 = localStorage.getItem('site_favicon_url') || '';
  var fav180 = localStorage.getItem('site_favicon_180') || '';
  function setFavicons(url32, url180) {
    if (url32) {
      var existing = document.querySelector('link[rel="icon"]');
      if (existing) existing.href = url32;
      else { var l = document.createElement('link'); l.rel = 'icon'; l.type = 'image/png'; l.sizes = '32x32'; l.href = url32; document.head.appendChild(l); }
    }
    if (url180) {
      var existing2 = document.querySelector('link[rel="apple-touch-icon"]');
      if (existing2) existing2.href = url180;
      else { var l2 = document.createElement('link'); l2.rel = 'apple-touch-icon'; l2.sizes = '180x180'; l2.href = url180; document.head.appendChild(l2); }
    }
  }
  if (fav32) setFavicons(fav32, fav180);
  document.addEventListener('dataReady', function() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    firebase.firestore().collection('settings').doc('site').get().then(function(doc) {
      if (doc.exists) {
        var d = doc.data();
        if (d.faviconUrl) { localStorage.setItem('site_favicon_url', d.faviconUrl); setFavicons(d.faviconUrl, d.faviconUrl180); }
        if (d.faviconUrl180) localStorage.setItem('site_favicon_180', d.faviconUrl180);
        if (d.ogImageUrl) { localStorage.setItem('site_og_image', d.ogImageUrl); _updateOgImage(d.ogImageUrl); }
      }
    }).catch(function() {});
  });
})();

/* ── OG Image (cache + Firebase) ── */
(function() {
  var cached = localStorage.getItem('site_og_image');
  if (cached) _updateOgImage(cached);
})();
function _updateOgImage(url) {
  if (!url) return;
  var tags = [
    document.querySelector('meta[property="og:image"]'),
    document.querySelector('meta[name="twitter:image"]')
  ];
  tags.forEach(function(tag) { if (tag) tag.content = url; });
}

/* ── Site logo (cache + Firebase) ── */
var SITE_LOGO = localStorage.getItem('site_logo_url') || '';
// Cache'deki logo varsa preload et (tarayıcı cache'ine alır, render anında anında görünür)
if (SITE_LOGO) {
  var _preloadLink = document.createElement('link');
  _preloadLink.rel = 'preload';
  _preloadLink.as = 'image';
  _preloadLink.href = SITE_LOGO;
  document.head.appendChild(_preloadLink);
}
function _fetchSiteLogo() {
  if (typeof firebase === 'undefined' || !firebase.firestore) return;
  firebase.firestore().collection('settings').doc('site').get().then(function(doc) {
    if (doc.exists && doc.data().logoUrl) {
      var url = doc.data().logoUrl;
      if (url !== SITE_LOGO) {
        SITE_LOGO = url;
        localStorage.setItem('site_logo_url', url);
      }
      document.querySelectorAll('.site-logo-img').forEach(function(img) {
        if (!img.src || img.src !== url) img.src = url;
        img.onload = function() { img.classList.add('logo-loaded'); };
        if (img.complete && img.naturalWidth > 0) img.classList.add('logo-loaded');
      });
    }
  }).catch(function() {});
}
document.addEventListener('dataReady', _fetchSiteLogo);

/* ── Inject shared CSS ── */
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --navy:#1A2744;--navy-deep:#0D1829;--navy-mid:#243255;
      --cream:#F5EDE0;--cream-light:#FAF7F2;--cream-mid:#EDE3D4;
      --terra:#C4521A;--terra-light:#D96B2E;--terra-muted:#E8A07A;
      --aegean:#1A6B8A;--aegean-light:#2490B8;
      --amber:#D4935A;--sage:#5A7A56;--sand:#E8D5C0;
      --text-dark:#1A2744;--text-mid:#4A5870;--text-soft:#8A9AB5;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:'DM Sans',sans-serif;background:var(--cream-light);color:var(--text-dark);overflow-x:hidden;line-height:1.65;}

    /* NAV */
    #main-nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:background .4s cubic-bezier(.16,1,.3,1),box-shadow .4s cubic-bezier(.16,1,.3,1);}
    #main-nav.scrolled{background:rgba(250,247,242,.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 1px 0 rgba(26,39,68,.08),0 4px 24px rgba(26,39,68,.06);}
    #main-nav.hero-mode{background:transparent;}
    #main-nav.solid{background:rgba(250,247,242,.97);backdrop-filter:blur(20px);box-shadow:0 1px 0 rgba(26,39,68,.08);}
    .nav-inner{max-width:1280px;margin:0 auto;padding:0 28px;height:68px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
    .nav-logo{display:flex;align-items:center;flex-shrink:0;text-decoration:none;min-width:120px;}
    .nav-logo img{height:30px;width:auto;max-width:none;opacity:0;transition:opacity .5s ease;}
    .nav-logo img.logo-loaded{opacity:1;}
    .nav-logo:hover img{opacity:.8;}
    #main-nav.hero-mode .nav-logo img{filter:none;}
    .nav-links{display:flex;align-items:center;gap:4px;}
    .nav-link{color:var(--navy);font-size:.76rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;text-decoration:none;padding:7px 12px;border-radius:10px;transition:color .2s,background .2s,opacity .2s;opacity:.55;}
    .nav-link:hover{opacity:1;color:var(--terra);background:rgba(196,82,26,.06);}
    .nav-link.active{opacity:1;color:var(--terra);}
    #main-nav.hero-mode .nav-link{color:var(--cream);opacity:.6;}
    #main-nav.hero-mode .nav-link:hover{opacity:1;color:var(--cream);background:rgba(245,237,224,.1);}
    #main-nav.hero-mode .nav-link.active{opacity:1;color:var(--cream);background:rgba(245,237,224,.1);}
    .nav-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}
    .nav-divider{width:1px;height:16px;background:rgba(26,39,68,.12);}
    #main-nav.hero-mode .nav-divider{background:rgba(245,237,224,.15);}
    .btn-terra{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:12px;background:var(--terra);color:#fff;font-weight:600;font-size:.8rem;letter-spacing:.02em;border:none;cursor:pointer;text-decoration:none;transition:background .22s,transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s;}
    .btn-terra:hover{background:var(--terra-light);transform:translateY(-2px);box-shadow:0 10px 28px rgba(196,82,26,.28);}
    .btn-terra:active{transform:translateY(0);}
    .nav-hamburger{display:none;background:rgba(245,237,224,.1);border:1.5px solid rgba(245,237,224,.2);border-radius:9px;padding:8px 13px;color:var(--cream);font-size:1rem;cursor:pointer;transition:background .2s;flex-shrink:0;}
    #main-nav.solid .nav-hamburger,.nav-hamburger.dark{background:rgba(26,39,68,.05);border-color:rgba(26,39,68,.1);color:var(--navy);}
    .nav-hamburger:hover{background:rgba(245,237,224,.18);}
    #main-nav.solid .nav-hamburger:hover,.nav-hamburger.dark:hover{background:rgba(26,39,68,.1);}

    /* MOBILE MENU */
    #mobile-menu{position:fixed;inset:0;background:var(--navy-deep);z-index:200;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .5s cubic-bezier(.16,1,.3,1);overflow:hidden;}
    #mobile-menu.open{transform:translateX(0);}
    .mm-header{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid rgba(245,237,224,.06);}
    .mm-header a{min-width:110px;display:inline-block;} .mm-header img{height:28px;width:auto;max-width:none;opacity:0;transition:opacity .5s ease;}
    .mm-header img.logo-loaded{opacity:.7;}
    #close-menu-btn{background:rgba(245,237,224,.08);border:1.5px solid rgba(245,237,224,.14);border-radius:10px;padding:8px 13px;color:var(--cream);font-size:1rem;cursor:pointer;transition:background .2s;line-height:1;}
    #close-menu-btn:hover{background:rgba(245,237,224,.15);}
    .mm-links{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 28px;gap:2px;}
    .mm-link{display:flex;align-items:center;gap:16px;padding:14px 16px;border-radius:14px;text-decoration:none;transition:background .2s,color .2s;color:rgba(245,237,224,.45);}
    .mm-link:hover,.mm-link.active{background:rgba(245,237,224,.06);color:var(--cream);}
    .mm-link .mm-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:.62rem;font-weight:800;letter-spacing:.12em;color:rgba(245,237,224,.2);min-width:28px;}
    .mm-link .mm-label{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:-.025em;line-height:1.1;}
    .mm-link:hover .mm-num,.mm-link.active .mm-num{color:var(--terra);}
    .mm-footer{padding:20px 28px 32px;border-top:1px solid rgba(245,237,224,.06);display:flex;align-items:center;justify-content:center;}
    .mm-footer span{display:none;}
    #mobile-menu .btn-terra{padding:14px 36px;font-size:.85rem;font-weight:700;border-radius:14px;background:linear-gradient(135deg,var(--terra),#D96B2E);box-shadow:0 4px 16px rgba(196,82,26,.3);transition:all .2s;}
    #mobile-menu .btn-terra:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(196,82,26,.35);}

    /* SEARCH OVERLAY */
    .search-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:500;background:rgba(13,20,35,.96);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;overflow-y:auto;max-height:380px;box-shadow:0 16px 48px rgba(0,0,0,.45);display:none;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;}
    .search-dropdown.open{display:block;animation:sdFadeIn .2s ease;}
    @keyframes sdFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
    .search-dropdown::-webkit-scrollbar{width:4px;}
    .search-dropdown::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px;}
    .search-result-item{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;text-decoration:none;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.04);}
    .search-result-item:last-child{border-bottom:none;}
    .search-result-item:hover,.search-result-item:focus{background:rgba(255,255,255,.06);}
    .search-result-emoji{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:1.05rem;flex-shrink:0;}
    .search-result-info{flex:1;min-width:0;}
    .search-result-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.82rem;color:#F5EDE0;line-height:1.3;}
    .search-result-sub{font-size:.68rem;color:rgba(245,237,224,.35);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .search-result-type{font-size:.55rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;flex-shrink:0;}
    .search-no-results{padding:24px 16px;text-align:center;color:rgba(245,237,224,.3);font-size:.82rem;}
    .search-group-label{padding:10px 16px 6px;font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,237,224,.2);}
    @media(max-width:640px){
      .search-dropdown{position:absolute;top:calc(100% + 8px);bottom:auto;left:-8px;right:-8px;max-height:55vh;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.6);}
      .search-dropdown.open{animation:sdFadeIn .2s ease;}
      .search-result-item{padding:14px 18px;gap:12px;}
      .search-result-emoji{width:42px;height:42px;font-size:1.15rem;}
      .search-result-title{font-size:.88rem;}
    }

    /* FOOTER */
    #site-footer{position:relative;overflow:hidden;background:#0D1829;}
    #site-footer .ft-inner{max-width:1100px;margin:0 auto;padding:32px 24px 20px;}
    #site-footer .ft-top{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:20px;border-bottom:1px solid rgba(245,237,224,.06);}
    #site-footer .ft-logo-area{display:flex;align-items:center;gap:12px;flex-shrink:0;}
    #site-footer .ft-logo-area img{height:28px;width:auto;opacity:0;transition:opacity .5s ease;}
    #site-footer .ft-logo-area img.logo-loaded{opacity:1;}
    #site-footer .ft-tagline{font-size:.7rem;color:rgba(245,237,224,.25);white-space:nowrap;}
    #site-footer .ft-links{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;}
    #site-footer .ft-links a{color:rgba(245,237,224,.35);text-decoration:none;font-size:.72rem;font-weight:500;padding:5px 10px;border-radius:8px;transition:all .15s;}
    #site-footer .ft-links a:hover{color:#F5EDE0;background:rgba(245,237,224,.06);}
    #site-footer .ft-bottom{display:flex;align-items:center;justify-content:space-between;padding-top:14px;gap:12px;flex-wrap:wrap;}
    #site-footer .ft-copy{font-size:.72rem;color:rgba(245,237,224,.2);}
    #site-footer .ft-legal{font-size:.62rem;}
    #site-footer .ft-legal a{color:rgba(245,237,224,.2);text-decoration:none;transition:color .15s;}
    #site-footer .ft-legal a:hover{color:rgba(245,237,224,.5);}
    @media(max-width:768px){
      #site-footer .ft-top{flex-direction:row;gap:12px;}
      #site-footer .ft-logo-area{gap:8px;}
      #site-footer .ft-tagline{font-size:.6rem;}
      #site-footer .ft-bottom{flex-direction:column;text-align:center;gap:6px;}
      #site-footer .ft-legal{margin-top:0;}
    }

    /* BUTTONS */
    .btn-navy{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;background:var(--navy);color:var(--cream);font-weight:600;font-size:.85rem;letter-spacing:.02em;border:none;cursor:pointer;text-decoration:none;transition:background .22s,transform .22s;}
    .btn-navy:hover{background:var(--navy-mid);transform:translateY(-2px);}
    .btn-outline-cream{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;border:1.5px solid rgba(245,237,224,.25);color:var(--cream);font-weight:600;font-size:.85rem;text-decoration:none;transition:all .22s;}
    .btn-outline-cream:hover{background:rgba(245,237,224,.08);border-color:rgba(245,237,224,.45);}

    /* SECTION COMMONS */
    .section-label{font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--terra);}
    .section-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:var(--navy);}
    .section-rule{width:40px;height:3px;border-radius:2px;background:linear-gradient(90deg,var(--terra),var(--amber));}

    /* CARDS */
    .route-card{background:var(--navy);border:1px solid rgba(245,237,224,.07);border-radius:20px;overflow:hidden;cursor:pointer;transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s cubic-bezier(.16,1,.3,1);text-decoration:none;display:block;}
    .route-card:hover{transform:translateY(-8px);box-shadow:0 32px 64px rgba(13,24,41,.4),0 8px 16px rgba(196,82,26,.12);}
    .route-card .route-number{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.68rem;letter-spacing:.12em;color:rgba(245,237,224,.3);}
    .route-card .route-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;line-height:1.2;letter-spacing:-.02em;color:var(--cream);margin-bottom:8px;}
    .route-card .route-desc{font-family:'Lora',serif;font-size:.82rem;color:rgba(245,237,224,.5);line-height:1.65;font-style:italic;margin-bottom:18px;}
    .route-card .route-meta{font-size:.74rem;font-weight:500;color:rgba(245,237,224,.4);}
    .route-card .route-meta span{color:rgba(245,237,224,.7);}
    .route-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;background:rgba(245,237,224,.08);border:1.5px solid rgba(245,237,224,.14);color:var(--cream);font-size:.78rem;font-weight:600;cursor:pointer;text-decoration:none;transition:background .22s,transform .22s;}
    .route-btn:hover{background:rgba(245,237,224,.14);transform:translateX(3px);}

    .place-card{background:#fff;border-radius:18px;overflow:hidden;border:1px solid rgba(26,39,68,.06);cursor:pointer;transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s cubic-bezier(.16,1,.3,1);text-decoration:none;display:block;}
    .place-card:hover{transform:translateY(-5px);box-shadow:0 20px 50px rgba(26,39,68,.1);}
    @keyframes imgShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    .place-card .place-img{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;font-size:2.5rem;position:relative;overflow:hidden;background:linear-gradient(90deg,#e8e4de 25%,#f0ece6 50%,#e8e4de 75%);background-size:800px 100%;animation:imgShimmer 1.5s infinite linear;}
    .place-card .place-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s ease;}
    .place-card .place-img img.loaded{opacity:1;}
    .place-save-btn.saved,.venue-save-btn.saved{background:rgba(196,82,26,.85) !important;color:#fff !important;}
    .place-save-btn:hover,.venue-save-btn:hover{transform:scale(1.12);}
    .place-card .place-img .place-emoji-fallback{position:relative;z-index:1;}
    .place-card .place-cat-badge{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:999px;}
    .place-card h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--navy);margin-bottom:6px;}
    .place-card p{font-size:.82rem;color:var(--text-mid);line-height:1.6;}

    .venue-card{background:var(--cream-light);border:1px solid rgba(26,39,68,.07);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s;text-decoration:none;display:block;}
    .venue-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(26,39,68,.09);}
    .venue-card h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--navy);margin-bottom:6px;}
    .venue-card p{font-size:.8rem;color:var(--text-mid);line-height:1.6;}

    .filter-btn{padding:8px 18px;border-radius:999px;border:1.5px solid rgba(26,39,68,.14);background:#fff;color:var(--text-mid);font-size:.8rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .22s cubic-bezier(.16,1,.3,1);}
    .filter-btn:hover{border-color:var(--terra);color:var(--terra);}
    .filter-btn.active{background:var(--navy);border-color:var(--navy);color:var(--cream);}

    /* FADE UP */
    .fade-up{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);}
    .fade-up.visible{opacity:1;transform:translateY(0);}

    /* PAGE HERO (legacy fallback) */
    .page-hero{background:linear-gradient(160deg,#0D1829 0%,#1A2744 50%,#0F1E35 100%);padding:140px 24px 80px;text-align:center;position:relative;overflow:hidden;}
    .page-hero .page-hero-eyebrow{font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--terra-muted);margin-bottom:16px;}
    .page-hero h1{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(2rem,6vw,3.5rem);color:var(--cream);letter-spacing:-.03em;line-height:1.05;margin-bottom:16px;}
    .page-hero .page-hero-sub{font-family:'Lora',serif;font-style:italic;color:rgba(245,237,224,.55);font-size:1rem;max-width:480px;margin:0 auto;line-height:1.7;}

    /* ── PAGE HERO GLASS (new) ── */
    .phg{position:relative;overflow:hidden;padding:148px 24px 80px;text-align:center;background:#0D1829;}
    .phg-bg{position:absolute;inset:0;background:linear-gradient(160deg,#0D1829 0%,#152040 45%,#0F1E35 100%);}
    .phg-noise{position:absolute;inset:0;pointer-events:none;z-index:1;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      background-repeat:repeat;}
    .phg-shapes{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2;}
    .phg-shape-outer{position:absolute;animation:phgShapeIn var(--dur,1.6s) cubic-bezier(.23,.86,.39,.96) var(--delay,0s) both;}
    .phg-shape-inner{animation:phgFloat var(--fdur,12s) ease-in-out var(--fdelay,0s) infinite;}
    .phg-pill{border-radius:999px;
      background:linear-gradient(to right, var(--pc,rgba(255,255,255,.08)), transparent);
      backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);
      border:1.5px solid rgba(255,255,255,.12);
      box-shadow:0 8px 32px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.08);}
    .phg-pill::after{content:'';position:absolute;inset:0;border-radius:999px;
      background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.18),transparent 65%);}
    .phg-bottom-fade{position:absolute;bottom:0;left:0;right:0;height:100px;pointer-events:none;z-index:6;
      background:linear-gradient(to top, var(--phg-next-bg,#FAF7F2) 0%, transparent 100%);}

    /* Content */
    .phg-content{position:relative;z-index:10;max-width:680px;margin:0 auto;}
    .phg-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:999px;
      background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
      backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      margin-bottom:24px;animation:phgFadeUp .9s .15s cubic-bezier(.25,.4,.25,1) both;}
    .phg-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--terra);
      box-shadow:0 0 7px var(--terra);animation:phgPulse 2.4s ease-in-out infinite;flex-shrink:0;}
    .phg-badge span{font-size:.68rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(245,237,224,.45);}
    .phg-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
      font-size:clamp(2rem,6vw,3.4rem);letter-spacing:-.03em;line-height:1.05;margin-bottom:18px;
      background:linear-gradient(180deg,#F5EDE0 40%,rgba(245,237,224,.65) 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      animation:phgFadeUp .9s .3s cubic-bezier(.25,.4,.25,1) both;}
    .phg-sub{font-family:'Lora',serif;font-style:italic;color:rgba(245,237,224,.45);
      font-size:1rem;max-width:480px;margin:0 auto;line-height:1.75;
      animation:phgFadeUp .9s .48s cubic-bezier(.25,.4,.25,1) both;}

    /* Keyframes */
    @keyframes phgShapeIn{
      from{opacity:0;transform:translateY(-110px) rotate(calc(var(--r,0deg) - 15deg));}
      to  {opacity:1;transform:translateY(0)       rotate(var(--r,0deg));}
    }
    @keyframes phgFloat{
      0%,100%{transform:translateY(0);}
      50%    {transform:translateY(14px);}
    }
    @keyframes phgFadeUp{
      from{opacity:0;transform:translateY(22px);}
      to  {opacity:1;transform:translateY(0);}
    }
    @keyframes phgPulse{
      0%,100%{opacity:1;box-shadow:0 0 7px var(--terra);}
      50%    {opacity:.35;box-shadow:0 0 2px var(--terra);}
    }

    /* STOP CARD */
    .stop-card{background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:20px;overflow:hidden;margin-bottom:16px;}
    .stop-number{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.85rem;flex-shrink:0;}
    .tip-box{background:rgba(212,147,90,.08);border:1px solid rgba(212,147,90,.2);border-radius:12px;padding:12px 16px;font-size:.8rem;color:#6A4010;line-height:1.6;}
    .tip-box::before{content:'💡 ';font-size:.85rem;}

    /* SCROLL X */
    .scroll-x{overflow-x:auto;scrollbar-width:none;}
    .scroll-x::-webkit-scrollbar{display:none;}

    /* GRID */
    .card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;}
    .card-grid-sm{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;}

    @media(max-width:900px){
      #site-footer .footer-glass{padding:36px 28px 32px;}
      #site-footer .footer-grid{grid-template-columns:1fr 1fr;}
      .nav-links .nav-link[href="index.html"]{display:none;}
    }
    @media(max-width:760px){
      .nav-links{display:none;}
      .nav-hamburger{display:flex;align-items:center;justify-content:center;}
      .mm-link .mm-label{font-size:1.35rem;}
      .nav-right{gap:6px;}
      .nav-right .btn-terra{padding:6px 10px;font-size:.68rem;}
      .nav-save-btn{padding:6px 8px;}
      .nav-divider{display:none;}
    }
    @media(max-width:640px){
      #site-footer .footer-glass{padding:28px 20px 24px;}
      #site-footer .footer-grid{grid-template-columns:1fr;}
    }
  `;
  document.head.appendChild(style);
})();

/* ── Google Fonts ── */
(function loadFonts() {
  if (document.querySelector('link[data-assos-fonts]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.assosFonts = '1';
  link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';
  document.head.appendChild(link);
  // preconnect HTML'de zaten var
})();

/* ═══════════════════
   NAV
═══════════════════ */
function renderNav(opts = {}) {
  const { heroMode = false, basePath = '' } = opts;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const links = [
    { href: 'index.html',    label: 'Ana Sayfa' },
    { href: 'rotalar.html',  label: 'Rotalar' },
    { href: 'yerler.html',   label: 'Yerler' },
    { href: 'mekanlar.html', label: 'Mekanlar' },
    { href: 'koyler.html',   label: 'Köyler' },
    { href: 'harita.html',   label: 'Harita' },
    { href: 'rehber.html',   label: 'Rehber' },
  ];

  const fullPath = window.location.pathname;
  const pageName = currentPage.replace('.html', '');
  const isActive = (href) => {
    const hrefName = href.replace('.html', '');
    if (hrefName === pageName) return true;
    if ((pageName === '' || pageName === '/') && hrefName === 'index') return true;
    // Alt sayfa eşleştirme
    if (hrefName === 'mekanlar' && (pageName === 'mekan-detay' || fullPath.includes('/mekanlar'))) return true;
    if (hrefName === 'rotalar' && (pageName === 'rota-detay' || pageName === 'rota' || fullPath.includes('/rotalar'))) return true;
    return false;
  };

  const navHTML = `
    <div id="mobile-menu" role="dialog" aria-label="Navigasyon menüsü" aria-hidden="true">
      <div class="mm-header">
        <a href="${basePath}index.html"><img ${SITE_LOGO ? 'class="site-logo-img" src="' + SITE_LOGO + '" onload="var s=this;setTimeout(function(){s.classList.add(\'logo-loaded\')},50)"' : 'class="site-logo-img"'} data-logo="1" alt="Assos'u Keşfet" width="120" height="40" loading="eager" decoding="async"></a>
        <button id="close-menu-btn" aria-label="Kapat">✕</button>
      </div>
      <div class="mm-links">
        ${links.map((l, i) => `
          <a href="${basePath}${l.href}" class="mm-link${isActive(l.href) ? ' active' : ''}">
            <span class="mm-num">0${i+1}</span>
            <span class="mm-label">${l.label}</span>
          </a>`).join('')}
      </div>
      <div class="mm-footer">
        <span></span>
        <a href="${basePath}planla.html" class="btn-terra">Assos'u Planla →</a>
      </div>
    </div>
    <nav id="main-nav" class="${heroMode ? 'hero-mode' : 'solid'}" aria-label="Ana navigasyon">
      <div class="nav-inner">
        <a href="${basePath}index.html" class="nav-logo" aria-label="Ana Sayfa">
          <img ${SITE_LOGO ? 'class="site-logo-img" src="' + SITE_LOGO + '" onload="var s=this;setTimeout(function(){s.classList.add(\'logo-loaded\')},50)"' : 'class="site-logo-img"'} data-logo="1" alt="Assos'u Keşfet" width="120" height="40" loading="eager" decoding="async">
        </a>
        <div class="nav-links">
          ${links.map(l => `<a href="${basePath}${l.href}" class="nav-link${isActive(l.href) ? ' active' : ''}">${l.label}</a>`).join('')}
        </div>
        <div class="nav-right">
          <div class="nav-divider"></div>
          <button id="nav-save-btn" class="nav-save-btn" aria-label="Kaydedilenler">
            <span class="nav-save-icon">♡</span>
            <span id="nav-save-count" class="nav-save-count" style="display:none;">0</span>
          </button>
          <a href="${basePath}planla.html" class="btn-terra" style="padding:7px 16px;font-size:.76rem;">Assos'u Planla</a>
          <button class="nav-hamburger${heroMode ? '' : ' dark'}" id="open-menu-btn" aria-label="Menü">☰</button>
        </div>
      </div>
    </nav>
  `;

  const placeholder = document.getElementById('nav-placeholder');
  if (placeholder) placeholder.outerHTML = navHTML;

  /* ── Save drawer CSS (once) ── */
  if (!document.getElementById('save-drawer-styles')) {
    const s = document.createElement('style');
    s.id = 'save-drawer-styles';
    s.textContent = `
      /* Nav save button */
      .nav-save-btn {
        position:relative; display:flex; align-items:center; gap:5px;
        padding:7px 12px; border-radius:999px; border:1.5px solid rgba(26,39,68,.12);
        background:transparent; cursor:pointer; transition:all .2s;
        font-family:inherit;
      }
      .nav-save-btn:hover { background:rgba(196,82,26,.06); border-color:rgba(196,82,26,.3); }
      .nav-save-btn.has-saves { border-color:rgba(196,82,26,.35); }
      #main-nav.hero-mode .nav-save-btn { border-color:rgba(255,255,255,.25); }
      #main-nav.hero-mode .nav-save-btn:hover { background:rgba(255,255,255,.1); }
      #main-nav.hero-mode .nav-save-icon { color:rgba(255,255,255,.85); }
      #main-nav.hero-mode .nav-save-count { background:rgba(255,255,255,.9); color:#C4521A; }
      .nav-save-icon { font-size:.95rem; color:#4A5568; transition:color .2s; }
      .nav-save-btn.has-saves .nav-save-icon { color:#C4521A; }
      .nav-save-count {
        position:absolute; top:-6px; right:-6px;
        min-width:18px; height:18px; border-radius:999px;
        background:#C4521A; color:#fff;
        font-size:.62rem; font-weight:700; padding:0 5px;
        display:flex; align-items:center; justify-content:center;
        animation:savePop .3s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes savePop { from{transform:scale(0);} to{transform:scale(1);} }

      /* Overlay */
      #save-overlay {
        position:fixed; inset:0; z-index:450;
        background:rgba(10,18,36,.5); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
        opacity:0; pointer-events:none; transition:opacity .35s;
      }
      #save-overlay.open { opacity:1; pointer-events:all; }

      /* Drawer */
      #save-drawer {
        position:fixed; top:0; right:0; z-index:451;
        width:360px; max-width:calc(100vw - 32px); height:100dvh;
        background:#FAF7F2; overflow-y:auto;
        box-shadow:-12px 0 48px rgba(26,39,68,.18);
        transform:translateX(105%); transition:transform .4s cubic-bezier(.4,0,.2,1);
        display:flex; flex-direction:column;
      }
      #save-drawer.open { transform:translateX(0); }
      .sd-head {
        position:sticky; top:0; z-index:1;
        background:#FAF7F2; border-bottom:1px solid rgba(26,39,68,.08);
        padding:20px 22px 16px; display:flex; align-items:center; justify-content:space-between;
      }
      .sd-title { font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1rem; color:#1A2744; display:flex; align-items:center; gap:8px; }
      .sd-title-count { font-size:.7rem; font-weight:600; padding:2px 8px; border-radius:999px; background:rgba(196,82,26,.1); color:#C4521A; }
      .sd-close { width:30px; height:30px; border-radius:50%; background:rgba(26,39,68,.07); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.85rem; color:#4A5568; transition:background .2s; }
      .sd-close:hover { background:rgba(26,39,68,.14); }
      .sd-body { flex:1; padding:14px 14px 24px; }
      .sd-empty { text-align:center; padding:48px 20px; }
      .sd-empty-icon { font-size:2.5rem; margin-bottom:14px; opacity:.35; }
      .sd-empty-text { font-size:.86rem; color:#718096; margin-bottom:16px; line-height:1.6; }
      .sd-empty-link { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:999px; background:#1A2744; color:#fff; font-size:.78rem; font-weight:600; text-decoration:none; transition:background .2s; }
      .sd-empty-link:hover { background:#2A3A5A; }
      .sd-venue {
        display:flex; align-items:center; gap:12px;
        padding:12px; border-radius:16px;
        background:#fff; cursor:pointer;
        transition:all .22s; text-decoration:none;
        box-shadow:0 2px 8px rgba(26,39,68,.06);
        margin-bottom:10px;
      }
      .sd-venue:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(26,39,68,.13); }
      .sd-venue-img { width:52px; height:52px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; filter:drop-shadow(0 2px 6px rgba(0,0,0,.25)); position:relative; overflow:hidden; background:linear-gradient(135deg,#e8e4de,#f0ece6); }
      .sd-venue-img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; transition:opacity .4s ease; }
      .sd-venue-img img.sd-loaded { opacity:1; }
      .sd-venue-info { flex:1; min-width:0; }
      .sd-venue-cat { font-size:.57rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; padding:2px 7px; border-radius:999px; margin-bottom:4px; display:inline-block; }
      .sd-venue-name { font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.86rem; color:#1A2744; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .sd-venue-loc { font-size:.69rem; color:#A0AEC0; }
      .sd-venue-remove { width:26px; height:26px; border-radius:50%; background:rgba(26,39,68,.06); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.7rem; color:#A0AEC0; transition:all .2s; flex-shrink:0; }
      .sd-venue-remove:hover { background:rgba(196,82,26,.1); color:#C4521A; }
      .sd-footer { padding:14px 14px 20px; border-top:1px solid rgba(26,39,68,.07); }
      .sd-sync{background:rgba(26,39,68,.03);border:1px solid rgba(26,39,68,.07);border-radius:12px;padding:14px;}
      .sd-sync-row{display:flex;align-items:center;gap:8px;}
      .sd-sync-label{font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(26,39,68,.4);}
      .sd-sync-code{font-family:'Plus Jakarta Sans',monospace;font-weight:800;font-size:1rem;color:#1A2744;letter-spacing:.15em;cursor:pointer;padding:4px 10px;border-radius:8px;background:rgba(196,82,26,.06);border:1px solid rgba(196,82,26,.12);position:relative;transition:all .15s;}
      .sd-sync-code:hover{background:rgba(196,82,26,.12);}
      .sd-sync-code[data-tip]:not([data-tip=""])::after{content:attr(data-tip);position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#1A2744;color:#fff;padding:3px 10px;border-radius:6px;font-size:.65rem;font-weight:600;white-space:nowrap;letter-spacing:0;}
      .sd-sync-hint{font-size:.68rem;color:rgba(26,39,68,.35);margin-top:6px;}
      .sd-sync-inp{flex:1;padding:8px 12px;border:1.5px solid rgba(26,39,68,.1);border-radius:8px;font-size:16px;font-family:inherit;outline:none;letter-spacing:.1em;text-transform:uppercase;}
      .sd-sync-inp:focus{border-color:#C4521A;}
      .sd-sync-load{padding:8px 14px;border:none;border-radius:8px;background:#1A2744;color:#fff;font-size:.75rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s;}
      .sd-sync-load:hover{background:#2A3A5A;}
      .sd-clear-btn { width:100%; padding:10px; border-radius:12px; border:1.5px solid rgba(26,39,68,.1); background:transparent; color:#718096; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .2s; font-family:inherit; }
      .sd-clear-btn:hover { border-color:rgba(196,82,26,.3); color:#C4521A; background:rgba(196,82,26,.04); }
      .sd-filter-btn{font-size:.65rem;padding:4px 10px;border-radius:999px;border:1px solid rgba(26,39,68,.1);background:transparent;color:#718096;cursor:pointer;font-family:inherit;font-weight:600;transition:all .15s;white-space:nowrap;}
      .sd-filter-btn:hover{border-color:var(--terra);color:var(--terra);}
      .sd-filter-btn.active{background:var(--navy);color:var(--cream);border-color:var(--navy);}
      .sd-go-btn { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:11px; border-radius:12px; background:#1A2744; color:#fff; font-size:.8rem; font-weight:700; text-decoration:none; margin-top:8px; transition:background .2s; }
      .sd-go-btn:hover { background:#2A3A5A; }
    `;
    document.head.appendChild(s);
  }

  /* ── Save drawer HTML (once per session) ── */
  if (!document.getElementById('save-drawer')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="save-overlay"></div>
      <div id="save-drawer" role="dialog" aria-label="Kaydedilen Mekanlar">
        <div class="sd-head">
          <div class="sd-title">
            ♥ Kaydedilenler
            <span class="sd-title-count" id="sd-count">0</span>
          </div>
          <button class="sd-close" onclick="closeSaveDrawer()" aria-label="Kapat">✕</button>
        </div>
        <div class="sd-body" id="sd-body"></div>
        <div class="sd-footer" id="sd-footer" style="display:none;">
          <div class="sd-sync" id="sd-sync">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <span style="font-size:1.1rem;">🔗</span>
              <span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--navy);">Keşif Listenizi Paylaşın</span>
            </div>
            <div class="sd-sync-hint" style="margin-bottom:12px;">Bu kod sizin Assos rotanız! Arkadaşlarınıza gönderin, aynı listeyi görsünler. Başka cihazınıza aktarmak için de kullanabilirsiniz.</div>
            <div class="sd-sync-row" style="margin-bottom:10px;">
              <span class="sd-sync-label">Kodunuz</span>
              <span class="sd-sync-code" id="sd-sync-code" onclick="navigator.clipboard.writeText(this.textContent).then(()=>{this.dataset.tip='Kopyalandı!';setTimeout(()=>this.dataset.tip='',1500)})">—</span>
              <button onclick="navigator.clipboard.writeText(document.getElementById('sd-sync-code').textContent).then(()=>{this.textContent='Kopyalandı!';setTimeout(()=>this.textContent='Kopyala',1500)})" style="padding:5px 10px;border:1px solid rgba(26,39,68,.12);border-radius:6px;background:#fff;font-size:.68rem;font-weight:600;cursor:pointer;color:var(--navy);font-family:inherit;transition:all .15s;">Kopyala</button>
            </div>
            <div style="height:1px;background:rgba(26,39,68,.06);margin:10px 0;"></div>
            <div class="sd-sync-row">
              <input type="text" id="sd-sync-input" class="sd-sync-inp" placeholder="Kodu yapıştırın..." maxlength="8">
              <button class="sd-sync-load" onclick="loadFavCode()">Yükle</button>
              <button onclick="refreshFavCode()" style="padding:5px 10px;border:1px solid rgba(26,39,68,.12);border-radius:6px;background:#fff;font-size:.78rem;cursor:pointer;color:var(--navy);font-family:inherit;transition:all .15s;" title="Listeyi güncelle">🔄</button>
            </div>
            <div id="sd-sync-status" style="font-size:.72rem;margin-top:6px;min-height:16px;"></div>
            <div id="sd-last-code" style="font-size:.65rem;color:rgba(26,39,68,.3);margin-top:4px;"></div>
          </div>
          <div style="margin-top:12px;">
            <button class="sd-clear-btn" onclick="clearAllSaves()">Tümünü Temizle</button>
            <div id="sd-clear-msg" style="font-size:.72rem;text-align:center;margin-top:6px;min-height:16px;"></div>
          </div>
        </div>
      </div>
    `);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSaveDrawer(); });
  }

  /* ── Save drawer global functions ── */
  const SD_KEY  = 'assos_mk_saves';
  const SD_PLACE_KEY = 'assos_pl_saves';
  const SD_VMETA = {
    'behram-kafe':          { g:'linear-gradient(160deg,#3A1A0A,#7A3018)',  cat:'kafe',      catBg:'rgba(196,82,26,.1)',   catC:'#C4521A',  catL:'Kafe' },
    'korfez-balik':         { g:'linear-gradient(160deg,#081828,#0E3052)',   cat:'restoran',  catBg:'rgba(26,107,138,.1)',  catC:'#1A6B8A',  catL:'Restoran' },
    'assos-tas-kahvalti':   { g:'linear-gradient(160deg,#3A2408,#7A4820)',   cat:'kahvalti',  catBg:'rgba(212,147,90,.12)',catC:'#8A5520',  catL:'Kahvaltı' },
    'gun-batimi-kafe':      { g:'linear-gradient(160deg,#280A20,#C45218)',   cat:'kafe',      catBg:'rgba(196,82,26,.1)',   catC:'#C4521A',  catL:'Kafe' },
    'kayalar-koy-evi':      { g:'linear-gradient(160deg,#0A1C08,#1E3818)',   cat:'konaklama', catBg:'rgba(90,122,86,.12)',  catC:'#5A7A56',  catL:'Konaklama' },
    'antik-liman-restoran': { g:'linear-gradient(160deg,#061420,#102840)',   cat:'restoran',  catBg:'rgba(26,107,138,.1)',  catC:'#1A6B8A',  catL:'Restoran' },
    'kadirga-plaj':         { g:'linear-gradient(160deg,#081830,#0E3858)',   cat:'beach',     catBg:'rgba(26,158,138,.1)', catC:'#1A9A8A',  catL:'Beach' },
    'ahmetce-iskele-kafe':  { g:'linear-gradient(160deg,#061018,#0C2030)',   cat:'iskele',    catBg:'rgba(26,39,68,.08)',   catC:'#3A5A8A',  catL:'İskele' },
    'sivrice-beach':        { g:'linear-gradient(160deg,#041420,#0A2C3C)',   cat:'beach',     catBg:'rgba(26,158,138,.1)', catC:'#1A9A8A',  catL:'Beach' },
  };

  function getBasePath() {
    const p = window.location.pathname;
    if (p.includes('/mekanlar/') || p.includes('/rotalar/') || p.includes('/koyler/') || p.includes('/yerler/')) return '../';
    return '';
  }
  function getMekanPath(id) {
    return getBasePath() + 'mekanlar/mekan-detay.html?id=' + id;
  }
  function getMekanListPath() {
    return getBasePath() + 'mekanlar.html';
  }

  window.updateSaveNavCount = function () {
    try {
      const savedV = new Set(JSON.parse(localStorage.getItem(SD_KEY) || '[]'));
      const savedP = new Set(JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]'));
      const total = savedV.size + savedP.size;
      const btn   = document.getElementById('nav-save-btn');
      const badge = document.getElementById('nav-save-count');
      if (!btn || !badge) return;
      if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'flex';
        btn.classList.add('has-saves');
        btn.querySelector('.nav-save-icon').textContent = '♥';
      } else {
        badge.style.display = 'none';
        btn.classList.remove('has-saves');
        btn.querySelector('.nav-save-icon').textContent = '♡';
      }
    } catch {}
  };

  const MAX_PLACE_SAVES = 15;
  const MAX_VILLAGE_SAVES = 15;
  window.togglePlaceSave = function (id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      const saved = new Set(JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]'));
      if (!saved.has(id)) {
        var villageIds = new Set((typeof DATA !== 'undefined' && DATA.villages ? DATA.villages : []).map(function(v){ return v.id; }));
        var isVillage = villageIds.has(id);
        var savedVillageCount = [...saved].filter(function(s){ return villageIds.has(s); }).length;
        var savedPlaceCount = saved.size - savedVillageCount;
        if (isVillage && savedVillageCount >= MAX_VILLAGE_SAVES) { alert('En fazla ' + MAX_VILLAGE_SAVES + ' köy kaydedebilirsiniz.'); return; }
        if (!isVillage && savedPlaceCount >= MAX_PLACE_SAVES) { alert('En fazla ' + MAX_PLACE_SAVES + ' yer kaydedebilirsiniz.'); return; }
      }
      if (saved.has(id)) saved.delete(id); else saved.add(id);
      localStorage.setItem(SD_PLACE_KEY, JSON.stringify([...saved]));
      // Buton güncelle
      document.querySelectorAll('.place-save-btn[data-id="' + id + '"]').forEach(function(btn) {
        btn.classList.toggle('saved', saved.has(id));
        btn.textContent = saved.has(id) ? '♥' : '♡';
      });
    } catch {}
    window.updateSaveNavCount();
    if (window.syncFavToFirebase) setTimeout(window.syncFavToFirebase, 300);
  };

  window.isPlaceSaved = function (id) {
    try { return new Set(JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]')).has(id); } catch { return false; }
  };

  window.isVenueSaved = function (id) {
    try { return new Set(JSON.parse(localStorage.getItem(SD_KEY) || '[]')).has(id); } catch { return false; }
  };

  const MAX_VENUE_SAVES = 15;
  window.toggleVenueSave = function (id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      const saved = new Set(JSON.parse(localStorage.getItem(SD_KEY) || '[]'));
      if (!saved.has(id) && saved.size >= MAX_VENUE_SAVES) { alert('En fazla ' + MAX_VENUE_SAVES + ' mekan kaydedebilirsiniz.'); return; }
      if (saved.has(id)) saved.delete(id); else saved.add(id);
      localStorage.setItem(SD_KEY, JSON.stringify([...saved]));
      document.querySelectorAll('.venue-save-btn[data-id="' + id + '"]').forEach(function(btn) {
        btn.classList.toggle('saved', saved.has(id));
        btn.textContent = saved.has(id) ? '♥' : '♡';
      });
    } catch {}
    window.updateSaveNavCount();
    if (window.syncFavToFirebase) window.syncFavToFirebase();
  };

  var _sdJustOpened = false;
  window.openSaveDrawer = function () {
    try { renderSaveDrawer(); } catch(e) { console.error('Favori render hatası:', e); }
    _sdJustOpened = true;
    document.getElementById('save-drawer').classList.add('open');
    document.getElementById('save-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() { _sdJustOpened = false; }, 400);
  };
  // Overlay click — kapatma (açılış anını atla)
  var saveOverlay = document.getElementById('save-overlay');
  if (saveOverlay) {
    saveOverlay.addEventListener('click', function() { if (!_sdJustOpened) closeSaveDrawer(); });
  }
  // Favori butonuna bağla
  var navSaveBtn = document.getElementById('nav-save-btn');
  if (navSaveBtn) {
    navSaveBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); openSaveDrawer(); });
  }

  window.closeSaveDrawer = function () {
    document.getElementById('save-drawer').classList.remove('open');
    document.getElementById('save-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.removeSave = function (id, e) {
    e.preventDefault(); e.stopPropagation();
    try {
      const saved = new Set(JSON.parse(localStorage.getItem(SD_KEY) || '[]'));
      saved.delete(id);
      localStorage.setItem(SD_KEY, JSON.stringify([...saved]));
    } catch {}
    renderSaveDrawer();
    window.updateSaveNavCount();
    /* Also update any save-btn on the current page */
    document.querySelectorAll(`.save-btn[data-id="${id}"]`).forEach(btn => {
      btn.classList.remove('saved');
      const icon = btn.querySelector('.act-icon, #vp-save-icon');
      const label = btn.querySelector('.act-label, #vp-save-label');
      if (icon)  icon.textContent  = '♡';
      if (label) label.textContent = 'Kaydet';
      if (!icon) btn.textContent = '♡';
    });
  };

  window.sdFilterBy = function(filter) {
    window._sdFilter = filter;
    renderSaveDrawer();
  };

  window.clearAllSaves = function () {
    let hasVenues = false, hasPlaces = false;
    try { hasVenues = JSON.parse(localStorage.getItem(SD_KEY) || '[]').length > 0; } catch {}
    try { hasPlaces = JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]').length > 0; } catch {}
    const msg = document.getElementById('sd-clear-msg');
    if (!hasVenues && !hasPlaces) {
      if (msg) { msg.innerHTML = '<span style="color:#718096">Temizlenecek favori yok.</span>'; setTimeout(function() { msg.innerHTML = ''; }, 2500); }
      return;
    }
    localStorage.removeItem(SD_KEY);
    localStorage.removeItem(SD_PLACE_KEY);
    // Kendi orijinal koduna geri dön (başkasının kodu kaldırılır)
    localStorage.removeItem(FAV_CODE_KEY);
    localStorage.removeItem('assos_last_loaded_code');
    window._sdFilter = 'all';
    renderSaveDrawer();
    window.updateSaveNavCount();
    document.querySelectorAll('.save-btn, .place-save-btn, .venue-save-btn').forEach(btn => {
      btn.classList.remove('saved');
      if (btn.classList.contains('place-save-btn') || btn.classList.contains('venue-save-btn')) { btn.textContent = '♡'; return; }
      const icon = btn.querySelector('.act-icon, #vp-save-icon');
      const label = btn.querySelector('.act-label, #vp-save-label');
      if (icon)  icon.textContent  = '♡';
      if (label) label.textContent = 'Kaydet';
      if (!icon && !btn.querySelector('span')) btn.textContent = '♡';
    });
    if (msg) { msg.innerHTML = '<span style="color:#38A169">✓ Tüm favoriler temizlendi</span>'; setTimeout(function() { msg.innerHTML = ''; }, 3000); }
  };

  function getYerPath(id) {
    return getBasePath() + 'yerler/yer-detay.html?id=' + id;
  }
  function getKoyPath(id) {
    return getBasePath() + 'koyler/koy-detay.html?id=' + id;
  }

  window.removePlaceSave = function (id, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      const saved = new Set(JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]'));
      saved.delete(id);
      localStorage.setItem(SD_PLACE_KEY, JSON.stringify([...saved]));
    } catch {}
    renderSaveDrawer();
    window.updateSaveNavCount();
    document.querySelectorAll('.place-save-btn[data-id="' + id + '"]').forEach(function(btn) {
      btn.classList.remove('saved');
      btn.textContent = '♡';
    });
    if (window.syncFavToFirebase) setTimeout(window.syncFavToFirebase, 300);
  };

  function renderSaveDrawer() {
    let savedVenues, savedPlaces;
    try { savedVenues = new Set(JSON.parse(localStorage.getItem(SD_KEY) || '[]')); } catch { savedVenues = new Set(); }
    try { savedPlaces = new Set(JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]')); } catch { savedPlaces = new Set(); }

    const body   = document.getElementById('sd-body');
    const footer = document.getElementById('sd-footer');
    const count  = document.getElementById('sd-count');
    const goLink = document.getElementById('sd-go-link');
    if (!body) return;

    const totalCount = savedVenues.size + savedPlaces.size;
    count.textContent = totalCount;
    if (goLink) goLink.href = getMekanListPath();

    if (footer) footer.style.display = 'block';

    // Kodu her zaman göster
    const codeEl = document.getElementById('sd-sync-code');
    if (codeEl) codeEl.textContent = getFavCode();
    // Son yüklenen kodu göster
    const lastCode = localStorage.getItem('assos_last_loaded_code');
    const lastCodeEl = document.getElementById('sd-last-code');
    if (lastCodeEl && lastCode && lastCode !== getFavCode()) lastCodeEl.textContent = 'Son yüklenen kod:' + lastCode;
    else if (lastCodeEl) lastCodeEl.textContent = '';

    if (totalCount === 0) {
      body.innerHTML = `
        <div class="sd-empty">
          <div class="sd-empty-icon">♡</div>
          <p class="sd-empty-text">Henüz kaydettiğin mekan veya yer yok.<br>Beğendiğin yerleri ♡ ile işaretle.</p>
          <a class="sd-empty-link" href="${getMekanListPath()}">Mekanları Keşfet →</a>
        </div>`;
      return;
    }

    // Tüm kaydedilenleri hazırla
    const allVenues = (typeof DATA !== 'undefined' ? DATA.venues : []).filter(v => savedVenues.has(v.id));
    // Places + kaydedilen köyler birleştir
    const placesFromData = (typeof DATA !== 'undefined' ? DATA.places : []).filter(p => savedPlaces.has(p.id));
    const villagesAsSaved = (typeof DATA !== 'undefined' ? DATA.villages : []).filter(function(vl) { return savedPlaces.has(vl.id); }).map(function(vl) {
      return { id: vl.id, title: vl.title, emoji: vl.emoji || '🏘', shortDesc: vl.shortDesc || '', image: vl.image || '', location: 'Ayvacık', _isVillage: true };
    });
    const allPlaces = placesFromData.concat(villagesAsSaved);

    // Köyler ve yerler ayır
    const onlyPlaces = allPlaces.filter(function(p) { return !p._isVillage; });
    const onlyVillages = allPlaces.filter(function(p) { return p._isVillage; });

    // Filtre butonları oluştur
    const filterCats = new Set();
    filterCats.add('all');
    if (allVenues.length > 0) filterCats.add('mekanlar');
    if (onlyPlaces.length > 0) filterCats.add('yerler');
    if (onlyVillages.length > 0) filterCats.add('koyler');
    allVenues.forEach(v => {
      filterCats.add('cat_' + (v.category || 'diger'));
    });

    const sdFilter = window._sdFilter || 'all';
    const CAT_LABELS_SD = {};
    allVenues.forEach(v => {
      var cat = v.category || 'diger';
      var ci = getVenueCatInfo(cat);
      if (!CAT_LABELS_SD[cat]) CAT_LABELS_SD[cat] = { label: ci.label, emoji: ci.emoji };
    });

    let html = '<div style="display:flex;flex-wrap:wrap;gap:5px;padding:0 0 12px;border-bottom:1px solid rgba(26,39,68,.06);margin-bottom:8px;">';
    html += '<button class="sd-filter-btn' + (sdFilter === 'all' ? ' active' : '') + '" onclick="sdFilterBy(\'all\')">Tümü</button>';
    if (allVenues.length > 0) html += '<button class="sd-filter-btn' + (sdFilter === 'mekanlar' ? ' active' : '') + '" onclick="sdFilterBy(\'mekanlar\')">🏪 Mekanlar</button>';
    if (onlyPlaces.length > 0) html += '<button class="sd-filter-btn' + (sdFilter === 'yerler' ? ' active' : '') + '" onclick="sdFilterBy(\'yerler\')">📍 Yerler</button>';
    if (onlyVillages.length > 0) html += '<button class="sd-filter-btn' + (sdFilter === 'koyler' ? ' active' : '') + '" onclick="sdFilterBy(\'koyler\')">🏘 Köyler</button>';
    Object.keys(CAT_LABELS_SD).forEach(cat => {
      var info = CAT_LABELS_SD[cat];
      html += '<button class="sd-filter-btn' + (sdFilter === 'cat_' + cat ? ' active' : '') + '" onclick="sdFilterBy(\'cat_' + cat + '\')">' + info.emoji + ' ' + info.label + '</button>';
    });
    html += '</div>';

    // Mekanlar
    const showVenues = sdFilter === 'all' || sdFilter === 'mekanlar' || sdFilter.startsWith('cat_');
    const venueFilter = sdFilter.startsWith('cat_') ? sdFilter.replace('cat_', '') : null;

    if (showVenues && allVenues.length > 0) {
      const venues = venueFilter ? allVenues.filter(v => (v.category || '') === venueFilter) : allVenues;
      if (venues.length > 0) {
        // Premium üstte
        venues.sort(function(a,b) { return (isPremiumActive(b)?1:0) - (isPremiumActive(a)?1:0); });
        const groups = {};
        venues.forEach(v => {
          var catKey = v.category || 'diger';
          var catInfo = CAT_LABELS_SD[catKey] || (typeof getVenueCatInfo === 'function' ? getVenueCatInfo(catKey) : {label:catKey, emoji:'📍'});
          const m = SD_VMETA[v.id] || { g:'linear-gradient(160deg,#1A2744,#2A3A5A)', cat:catKey, catBg:'rgba(26,39,68,.08)', catC:'#4A5568', catL:catInfo.emoji + ' ' + catInfo.label };
          if (!groups[m.cat]) groups[m.cat] = { m, items:[] };
          groups[m.cat].items.push(v);
        });
        const cats = Object.keys(groups).sort((a,b) => groups[b].items.length - groups[a].items.length);
        if (sdFilter !== 'yerler') {
          html += '<div style="display:flex;align-items:center;gap:7px;padding:4px 2px 8px;"><span style="font-size:.7rem;font-weight:800;color:var(--navy);">🏪 Mekanlar</span><span style="font-size:.6rem;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(196,82,26,.1);color:#C4521A;">' + venues.length + '</span><div style="flex:1;height:1px;background:rgba(26,39,68,.08);"></div></div>';
          html += cats.map(cat => {
            const { m, items } = groups[cat];
            const header = '<div style="display:flex;align-items:center;gap:7px;padding:8px 2px 6px;"><span style="font-size:.55rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + m.catC + ';">' + m.catL + '</span><span style="font-size:.55rem;font-weight:700;padding:1px 6px;border-radius:999px;background:' + m.catBg + ';color:' + m.catC + ';">' + items.length + '</span></div>';
            const cards = items.map(v => {
              const hasPhoto = v.images && v.images.length > 0;
              const imgContent = hasPhoto ? '<img src="' + v.images[0] + '" onload="this.classList.add(\'sd-loaded\')">' : v.emoji;
              var premTag = isPremiumActive(v) ? '<span style="font-size:.48rem;font-weight:800;letter-spacing:.06em;margin-left:5px;padding:2px 7px;border-radius:4px;background:linear-gradient(135deg,#C9963A,#E8C46A);color:#5C3D0E;vertical-align:middle;text-transform:uppercase;">Premium</span>' : '';
              var premBorder = isPremiumActive(v) ? 'border:1.5px solid rgba(212,147,90,.25);' : '';
              return '<a class="sd-venue" href="' + getMekanPath(v.id) + '" style="' + premBorder + '"><div class="sd-venue-img" style="background:' + m.g + ';">' + imgContent + '</div><div class="sd-venue-info"><div class="sd-venue-name">' + v.title + premTag + '</div><div class="sd-venue-loc">📍 ' + v.location + '</div></div><button class="sd-venue-remove" onclick="removeSave(\'' + escAttr(v.id) + '\',event)" aria-label="Kaldır">✕</button></a>';
            }).join('');
            return header + cards;
          }).join('');
        }
      }
    }

    // Yerler (köyler hariç)
    const showPlaces = sdFilter === 'all' || sdFilter === 'yerler';
    if (showPlaces && onlyPlaces.length > 0) {
      html += '<div style="display:flex;align-items:center;gap:7px;padding:16px 2px 8px;"><span style="font-size:.7rem;font-weight:800;color:var(--navy);">📍 Yerler</span><span style="font-size:.6rem;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(26,39,68,.08);color:var(--navy);">' + onlyPlaces.length + '</span><div style="flex:1;height:1px;background:rgba(26,39,68,.08);"></div></div>';
      html += onlyPlaces.map(p => {
        const hasPhoto = p.image && p.image.length > 0;
        const imgContent = hasPhoto ? '<img src="' + p.image + '" onload="this.classList.add(\'sd-loaded\')">' : p.emoji;
        return '<a class="sd-venue" href="' + getYerPath(p.id) + '"><div class="sd-venue-img" style="background:linear-gradient(135deg,#2A3F6A,#1A2744);">' + imgContent + '</div><div class="sd-venue-info"><div class="sd-venue-name">' + p.title + '</div><div class="sd-venue-loc">📍 ' + (p.location || '') + '</div></div><button class="sd-venue-remove" onclick="removePlaceSave(\'' + escAttr(p.id) + '\',event)" aria-label="Kaldır">✕</button></a>';
      }).join('');
    }

    // Köyler
    const showVillages = sdFilter === 'all' || sdFilter === 'koyler';
    if (showVillages && onlyVillages.length > 0) {
      html += '<div style="display:flex;align-items:center;gap:7px;padding:16px 2px 8px;"><span style="font-size:.7rem;font-weight:800;color:var(--navy);">🏘 Köyler</span><span style="font-size:.6rem;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(90,122,86,.1);color:#5A7A56;">' + onlyVillages.length + '</span><div style="flex:1;height:1px;background:rgba(26,39,68,.08);"></div></div>';
      html += onlyVillages.map(p => {
        const hasPhoto = p.image && p.image.length > 0;
        const imgContent = hasPhoto ? '<img src="' + p.image + '" onload="this.classList.add(\'sd-loaded\')">' : p.emoji;
        return '<a class="sd-venue" href="' + getKoyPath(p.id) + '"><div class="sd-venue-img" style="background:linear-gradient(135deg,#1A2744,#243255);">' + imgContent + '</div><div class="sd-venue-info"><div class="sd-venue-name">' + p.title + '</div><div class="sd-venue-loc">📍 Ayvacık, Çanakkale</div></div><button class="sd-venue-remove" onclick="removePlaceSave(\'' + escAttr(p.id) + '\',event)" aria-label="Kaldır">✕</button></a>';
      }).join('');
    }

    body.innerHTML = html;

    if (footer) footer.style.display = 'block';
    // Favori kodunu göster ve senkronla
    try {
      const codeEl = document.getElementById('sd-sync-code');
      if (codeEl) codeEl.textContent = getFavCode();
      if (window.syncFavToFirebase) window.syncFavToFirebase();
    } catch(e) {}
  }

  /* ── Favori Senkronizasyon ── */
  const FAV_CODE_KEY = 'assos_fav_code';

  function generateFavCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function getFavCode() {
    let code = localStorage.getItem(FAV_CODE_KEY);
    if (!code) {
      code = generateFavCode();
      localStorage.setItem(FAV_CODE_KEY, code);
    }
    return code;
  }

  // Favorileri Firebase'e kaydet (mekanlar + yerler)
  window.syncFavToFirebase = function() {
    function doSync() {
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        setTimeout(doSync, 1000);
        return;
      }
      const code = getFavCode();
      let venues, places;
      try { venues = JSON.parse(localStorage.getItem(SD_KEY) || '[]'); } catch { venues = []; }
      try { places = JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]'); } catch { places = []; }
      firebase.firestore().collection('favorites').doc(code).set({
        venues: venues,
        places: places,
        updatedAt: new Date().toISOString()
      }, { merge: true }).then(() => {
        var vIds = new Set((typeof DATA !== 'undefined' ? DATA.villages : []).map(function(v){ return v.id; }));
        var pOnlyCount = places.filter(function(id){ return !vIds.has(id); }).length;
        var vOnlyCount = places.length - pOnlyCount;
        console.log('Favoriler senkronlandi:', code, venues.length, 'mekan,', pOnlyCount, 'yer,', vOnlyCount, 'köy');
      }).catch(err => console.warn('Favori sync hatasi:', err));
    }
    doSync();
    const codeEl = document.getElementById('sd-sync-code');
    if (codeEl) codeEl.textContent = getFavCode();
  };

  // Kod ile favorileri yükle (mevcut liste sıfırlanır, kodun listesi gelir)
  window.loadFavCode = async function() {
    const input = document.getElementById('sd-sync-input');
    const statusEl = document.getElementById('sd-sync-status');
    const code = (input?.value || '').trim().toUpperCase();
    if (statusEl) statusEl.innerHTML = '';
    if (!code || code.length < 4) { if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Geçerli bir kod girin.</span>'; return; }
    if (code === getFavCode()) { if (statusEl) statusEl.innerHTML = '<span style="color:#718096">Bu zaten sizin kodunuz.</span>'; return; }
    if (typeof firebase === 'undefined' || !firebase.firestore) { if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Bağlantı hatası.</span>'; return; }
    // Mevcut liste varsa onay iste
    let hasExisting = false;
    try { hasExisting = JSON.parse(localStorage.getItem(SD_KEY) || '[]').length > 0 || JSON.parse(localStorage.getItem(SD_PLACE_KEY) || '[]').length > 0; } catch {}
    if (hasExisting && !confirm('Mevcut favori listeniz silinecek ve yeni liste yüklenecek. Devam etmek istiyor musunuz?')) { if (statusEl) statusEl.innerHTML = ''; return; }
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-muted)">Yükleniyor...</span>';
    try {
      const doc = await firebase.firestore().collection('favorites').doc(code).get();
      if (!doc.exists) { if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Bu kodla eşleşen liste bulunamadı.</span>'; return; }
      const data = doc.data();
      const venueCount = (data.venues && Array.isArray(data.venues)) ? data.venues.length : 0;
      const placeCount = (data.places && Array.isArray(data.places)) ? data.places.length : 0;
      if (venueCount === 0 && placeCount === 0) { if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Bu liste boş.</span>'; return; }
      // Mevcut listeyi sıfırla, kodun listesini yükle
      localStorage.setItem(SD_KEY, JSON.stringify(data.venues || []));
      localStorage.setItem(SD_PLACE_KEY, JSON.stringify(data.places || []));
      localStorage.setItem(FAV_CODE_KEY, code);
      localStorage.setItem('assos_last_loaded_code', code);
      window._sdFilter = 'all';
      renderSaveDrawer();
      window.updateSaveNavCount();
      if (input) input.value = '';
      const codeEl = document.getElementById('sd-sync-code');
      if (codeEl) codeEl.textContent = code;
      // places dizisindeki köy ve yer sayısını ayır
      var loadedPlaceIds = data.places || [];
      var villageIds = new Set((typeof DATA !== 'undefined' ? DATA.villages : []).map(function(v){ return v.id; }));
      var loadedVillageCount = loadedPlaceIds.filter(function(id){ return villageIds.has(id); }).length;
      var loadedPlaceOnlyCount = placeCount - loadedVillageCount;
      let msg = '✓ ';
      var parts = [];
      if (venueCount > 0) parts.push(venueCount + ' mekan');
      if (loadedPlaceOnlyCount > 0) parts.push(loadedPlaceOnlyCount + ' yer');
      if (loadedVillageCount > 0) parts.push(loadedVillageCount + ' köy');
      msg += parts.join(', ');
      msg += ' başarıyla yüklendi!';
      if (statusEl) statusEl.innerHTML = '<span style="color:#38A169">' + msg + '</span>';
    } catch(err) {
      if (statusEl) { statusEl.innerHTML = '<span style="color:#E53E3E">Yükleme hatası:</span>'; statusEl.querySelector('span').appendChild(document.createTextNode(err.message)); }
    }
  };

  // Mevcut kodu Firebase'den yeniden çek
  window.refreshFavCode = async function() {
    const statusEl = document.getElementById('sd-sync-status');
    const code = getFavCode();
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-muted)">Güncelleniyor...</span>';
    try {
      const doc = await firebase.firestore().collection('favorites').doc(code).get();
      if (doc.exists) {
        const data = doc.data();
        localStorage.setItem(SD_KEY, JSON.stringify(data.venues || []));
        localStorage.setItem(SD_PLACE_KEY, JSON.stringify(data.places || []));
        renderSaveDrawer();
        window.updateSaveNavCount();
        const total = (data.venues || []).length + (data.places || []).length;
        if (statusEl) statusEl.innerHTML = '<span style="color:#38A169">✓ Liste güncellendi! ' + total + ' kayıt.</span>';
      } else {
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-muted)">Liste zaten güncel.</span>';
      }
    } catch(err) {
      if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Güncelleme hatası.</span>';
    }
  };

  // removeSave ve clearAllSaves sonrası senkron (güvenli override)
  const _origRemove = window.removeSave;
  if (_origRemove) {
    window.removeSave = function(id, e) {
      try { _origRemove(id, e); } catch(err) { console.warn(err); }
      try { if (window.syncFavToFirebase) setTimeout(window.syncFavToFirebase, 300); } catch(err) {}
    };
  }
  const _origClear = window.clearAllSaves;
  if (_origClear) {
    window.clearAllSaves = function() {
      try { _origClear(); } catch(err) { console.warn(err); }
      try { if (window.syncFavToFirebase) setTimeout(window.syncFavToFirebase, 300); } catch(err) {}
    };
  }

  /* Initialize count */
  window.updateSaveNavCount();

  // Sayfa acilisinda: baskasinin kodunu yuklediyse otomatik guncelle
  (function autoSyncOnLoad() {
    var loadedCode = localStorage.getItem('assos_last_loaded_code');
    if (!loadedCode) return; // Kendi kodu, baskasinin listesi yuklenmemis
    var currentCode = getFavCode();
    if (loadedCode !== currentCode) return; // Kod degismis, skip
    function doAutoSync() {
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        setTimeout(doAutoSync, 1000);
        return;
      }
      firebase.firestore().collection('favorites').doc(currentCode).get().then(function(doc) {
        if (!doc.exists) return;
        var data = doc.data();
        var remoteVenues = JSON.stringify(data.venues || []);
        var remotePlaces = JSON.stringify(data.places || []);
        var localVenues = localStorage.getItem(SD_KEY) || '[]';
        var localPlaces = localStorage.getItem(SD_PLACE_KEY) || '[]';
        // Sadece fark varsa guncelle (gereksiz render onleme)
        if (remoteVenues !== localVenues || remotePlaces !== localPlaces) {
          localStorage.setItem(SD_KEY, remoteVenues);
          localStorage.setItem(SD_PLACE_KEY, remotePlaces);
          if (typeof renderSaveDrawer === 'function') renderSaveDrawer();
          if (window.updateSaveNavCount) window.updateSaveNavCount();
        }
      }).catch(function() {});
    }
    doAutoSync();
  })();

  // Nav scroll behavior
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  if (heroMode) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY > 60;
      nav.classList.toggle('scrolled', scrolled);
      nav.classList.toggle('hero-mode', !scrolled);
      const ham = document.getElementById('open-menu-btn');
      if (ham) ham.classList.toggle('dark', scrolled);
    }, { passive: true });
  }

  // Mobile menu
  const menu = document.getElementById('mobile-menu');
  function openMenu() {
    menu?.classList.add('open');
    menu?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeMenuFn() {
    menu?.classList.remove('open');
    menu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.getElementById('open-menu-btn')?.addEventListener('click', openMenu);
  document.getElementById('close-menu-btn')?.addEventListener('click', closeMenuFn);
  document.querySelectorAll('.mm-link').forEach(a => a.addEventListener('click', closeMenuFn));
  // Close on backdrop click
  menu?.addEventListener('click', e => { if (e.target === menu) closeMenuFn(); });
  // Close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenuFn(); });
}

/* ═══════════════════
   FOOTER
═══════════════════ */
function renderFooter(opts = {}) {
  const { basePath = '' } = opts;
  const footerHTML = `
    <footer id="site-footer" role="contentinfo">
      <div class="ft-inner">
        <!-- Üst: Logo + Linkler + Sosyal -->
        <div class="ft-top">
          <div class="ft-logo-area">
            <img ${SITE_LOGO ? 'class="site-logo-img" src="' + SITE_LOGO + '" onload="var s=this;setTimeout(function(){s.classList.add(\'logo-loaded\')},50)"' : 'class="site-logo-img"'} data-logo="1" alt="Assos'u Keşfet" width="120" height="40" loading="eager" decoding="async">
            <p class="ft-tagline">Assos'un Dijital Keşif Rehberi</p>
          </div>
          <nav class="ft-links">
            <a href="${basePath}blog.html">✍️ Blog</a>
            <a href="${basePath}iletisim.html">✉️ İletişim</a>
          </nav>
        </div>
        <!-- Alt: Copyright -->
        <div class="ft-bottom">
          <span class="ft-copy">© ${new Date().getFullYear()} Assos'u Keşfet · Tüm hakları saklıdır</span>
          <span class="ft-legal"><a href="${basePath}gizlilik.html">Gizlilik Politikası</a> · <a href="${basePath}kullanim-kosullari.html">Kullanım Koşulları</a></span>
        </div>
      </div>
    </footer>
  `;
  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) placeholder.outerHTML = footerHTML;
  initScrollToTop();
}

/* ═══════════════════════════════
   SCROLL TO TOP
═══════════════════════════════ */
function initScrollToTop() {
  if (document.getElementById('scroll-top-btn')) return;

  const style = document.createElement('style');
  style.textContent = `
    #scroll-top-btn {
      position: fixed;
      bottom: 90px;
      right: 28px;
      z-index: 400;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(13,24,41,.92);
      border: 1px solid rgba(245,237,224,.13);
      color: rgba(245,237,224,.65);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,.28);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: opacity .25s cubic-bezier(.16,1,.3,1),
                  transform .25s cubic-bezier(.16,1,.3,1),
                  background .2s, border-color .2s, color .2s;
    }
    #scroll-top-btn.stt-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    #scroll-top-btn:hover {
      background: rgba(26,39,68,.98);
      border-color: rgba(245,237,224,.26);
      color: #F5EDE0;
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Yukarı çık');
  btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('stt-visible', window.scrollY > 320);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══════════════════════════════
   PAGE HERO GLASS
═══════════════════════════════ */
function renderPageHero(opts = {}) {
  const {
    eyebrow  = 'Çanakkale · Ayvacık',
    title    = '',
    subtitle = '',
    targetId = 'page-hero',
    nextBg   = '#FAF7F2',
  } = opts;

  /* Floating pill shapes — outer = entrance anim, inner = infinite float */
  const shapes = [
    { w:560, h:132, r: 12, pc:'rgba(26,107,138,.2)',   delay:.28, dur:1.55, fdur:13, fdelay:.2,  left:'-7%',  top:'22%' },
    { w:440, h:112, r:-14, pc:'rgba(196,82,26,.18)',   delay:.48, dur:1.65, fdur:11, fdelay:.8,  right:'-3%', top:'65%' },
    { w:270, h: 72, r: -8, pc:'rgba(212,147,90,.16)',  delay:.38, dur:1.50, fdur:14, fdelay:.4,  left: '5%',  bottom:'12%' },
    { w:195, h: 54, r: 22, pc:'rgba(90,122,86,.15)',   delay:.58, dur:1.70, fdur:10, fdelay:1.2, right:'16%', top:'13%' },
    { w:145, h: 38, r:-26, pc:'rgba(245,237,224,.07)', delay:.68, dur:1.75, fdur:16, fdelay:.6,  left:'22%',  top: '8%' },
  ];

  const shapeHTML = shapes.map(s => {
    const pos = [
      s.left   != null ? `left:${s.left}`     : '',
      s.right  != null ? `right:${s.right}`   : '',
      s.top    != null ? `top:${s.top}`        : '',
      s.bottom != null ? `bottom:${s.bottom}` : '',
    ].filter(Boolean).join(';');
    return `<div class="phg-shape-outer" style="${pos};--r:${s.r}deg;--delay:${s.delay}s;--dur:${s.dur}s;">
      <div class="phg-shape-inner" style="--fdur:${s.fdur}s;--fdelay:${s.fdelay}s;">
        <div class="phg-pill" style="width:${s.w}px;height:${s.h}px;--pc:${s.pc};position:relative;"></div>
      </div>
    </div>`;
  }).join('');

  const html = `
    <section class="phg" style="--phg-next-bg:${nextBg};">
      <div class="phg-bg"></div>
      <div class="phg-noise"></div>
      <div class="phg-shapes">${shapeHTML}</div>
      <div class="phg-content">
        <div class="phg-badge">
          <div class="phg-badge-dot"></div>
          <span>${eyebrow}</span>
        </div>
        <h1 class="phg-title">${title}</h1>
        <p class="phg-sub">${subtitle}</p>
      </div>
      <div class="phg-bottom-fade"></div>
    </section>`;

  const el = document.getElementById(targetId);
  if (el) el.outerHTML = html;
}

/* ═══════════════════
   SEARCH ENGINE
═══════════════════ */
function initSearch(inputId, opts = {}) {
  const { dropdownParent, onSelect } = opts;
  const input = document.getElementById(inputId);
  if (!input || !window.DATA) return;

  // Create dropdown
  const wrapper = dropdownParent || input.closest('[data-search-wrapper]') || input.parentElement.parentElement;
  wrapper.style.position = 'relative';
  const dropdown = document.createElement('div');
  dropdown.className = 'search-dropdown';
  dropdown.id = 'search-dropdown';
  wrapper.appendChild(dropdown);

  function getTypeLabel(type) {
    const map = { route: { text: 'Rota', bg: 'rgba(196,82,26,.15)', color: '#E8A07A' }, place: { text: 'Yer', bg: 'rgba(26,107,138,.15)', color: '#2490B8' }, venue: { text: 'Mekan', bg: 'rgba(212,147,90,.15)', color: '#D4935A' }, village: { text: 'Köy', bg: 'rgba(90,122,86,.15)', color: '#7FB87B' } };
    return map[type] || { text: type, bg: 'rgba(255,255,255,.1)', color: '#fff' };
  }

  function getUrl(type, id) {
    const base = window.location.pathname.includes('/mekanlar/') || window.location.pathname.includes('/rotalar/') ? '../' : '';
    if (type === 'route')   return `${base}rotalar/rota-detay.html?id=${id}`;
    if (type === 'place')   return `${base}yerler/yer-detay.html?id=${id}`;
    if (type === 'venue')   return `${base}mekanlar/mekan-detay.html?id=${id}`;
    if (type === 'village') return `${base}koyler/koy-detay.html?id=${id}`;
    return '#';
  }

  function searchAll(q) {
    if (!q || q.length < 2) return [];
    const ql = q.toLowerCase();
    const results = [];

    (DATA.routes || []).forEach(r => {
      const score = [r.title, r.shortDesc, r.description, ...(r.keywords || [])].join(' ').toLowerCase();
      if (score.includes(ql)) results.push({ type: 'route', id: r.id, title: r.title, sub: r.shortDesc, emoji: r.emoji });
    });
    (DATA.places || []).forEach(p => {
      const score = [p.title, p.shortDesc, p.description, p.location, ...(p.keywords || [])].join(' ').toLowerCase();
      if (score.includes(ql)) results.push({ type: 'place', id: p.id, title: p.title, sub: p.location, emoji: p.emoji });
    });
    (DATA.venues || []).forEach(v => {
      const score = [v.title, v.shortDesc, v.category, v.location, ...(v.keywords || [])].join(' ').toLowerCase();
      if (score.includes(ql)) results.push({ type: 'venue', id: v.id, title: v.title, sub: v.location, emoji: v.emoji });
    });
    (DATA.villages || []).forEach(v => {
      const score = [v.title, v.shortDesc, v.description, ...(v.keywords || [])].join(' ').toLowerCase();
      if (score.includes(ql)) results.push({ type: 'village', id: v.id, title: v.title, sub: v.shortDesc?.substring(0, 60), emoji: v.emoji });
    });

    return results.slice(0, 8);
  }

  function renderDropdown(q) {
    const results = searchAll(q);
    if (!q || q.length < 2) { dropdown.classList.remove('open'); return; }

    if (results.length === 0) {
      dropdown.innerHTML = '<div class="search-no-results">Sonuç bulunamadı: "<strong style="color:var(--cream)">' + q.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') + '</strong>"</div>';
    } else {
      // Kategoriye göre grupla
      var groups = {};
      var groupOrder = ['venue','route','place','village'];
      var groupNames = {venue:'Mekanlar',route:'Rotalar',place:'Gezilecek Yerler',village:'Köyler'};
      results.forEach(function(r) { if (!groups[r.type]) groups[r.type] = []; groups[r.type].push(r); });
      var html = '';
      groupOrder.forEach(function(type) {
        if (!groups[type]) return;
        html += '<div class="search-group-label">' + (groupNames[type] || type) + '</div>';
        html += groups[type].map(function(r) {
          var lbl = getTypeLabel(r.type);
          var url = getUrl(r.type, r.id);
          return '<a class="search-result-item" href="' + url + '">' +
            '<div class="search-result-emoji">' + r.emoji + '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div class="search-result-title">' + r.title + '</div>' +
              '<div class="search-result-sub">' + (r.sub || '') + '</div>' +
            '</div>' +
            '<span class="search-result-type" style="background:' + lbl.bg + ';color:' + lbl.color + ';">' + lbl.text + '</span>' +
          '</a>';
        }).join('');
      });
      dropdown.innerHTML = html;
    }
    dropdown.classList.add('open');
  }

  let activeIdx = -1;

  function highlightActive() {
    const items = dropdown.querySelectorAll('.search-result-item');
    items.forEach((el, i) => {
      el.style.background = i === activeIdx ? 'rgba(255,255,255,.08)' : '';
    });
  }

  let searchTimer = null;
  input.addEventListener('input', e => {
    activeIdx = -1;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderDropdown(e.target.value.trim()), 150);
  });
  input.addEventListener('focus', () => {
    const q = input.value.trim();
    if (q.length >= 2 && dropdown.innerHTML) dropdown.classList.add('open');
  });
  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.search-result-item');
    if (e.key === 'Escape') { dropdown.classList.remove('open'); activeIdx = -1; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      highlightActive();
      if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      highlightActive();
      if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const items2 = dropdown.querySelectorAll('.search-result-item');
      if (activeIdx >= 0 && items2[activeIdx]) {
        window.location.href = items2[activeIdx].href;
      } else {
        const q = input.value.trim().toLowerCase();
        const results = searchAll(q);
        if (results.length > 0) window.location.href = getUrl(results[0].type, results[0].id);
        else { dropdown.classList.remove('open'); }
      }
    }
  });

  document.addEventListener('click', e => {
    if (!wrapper.contains(e.target)) { dropdown.classList.remove('open'); activeIdx = -1; }
  });
}

/* ═══════════════════
   SCROLL FADE IN
═══════════════════ */
function scrollFadeIn() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseFloat(entry.target.dataset.delay || 0) * 1000;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

/* ═══════════════════
   URL PARAM HELPER
═══════════════════ */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ═══════════════════
   ROUTE CARD RENDERER
═══════════════════ */
function routeCardHTML(r, delay = 0) {
  return `
    <a class="route-card fade-up" href="rotalar/rota-detay.html?id=${r.id}" data-delay="${delay}" aria-label="${r.title}">
      <div style="height:130px;background:${r.headerBg};border-bottom:1px solid rgba(245,237,224,.06);position:relative;overflow:hidden;display:flex;align-items:center;padding:22px 26px;gap:14px;">
        <div style="font-size:3rem;line-height:1;flex-shrink:0;filter:drop-shadow(0 4px 10px ${r.glowColor}66);">${r.emoji}</div>
        <div>
          <span class="route-number" style="display:block;margin-bottom:7px;">ROTA ${String(window.DATA.routes.indexOf(r)+1).padStart(2,'0')}</span>
          <span style="font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 10px;border-radius:999px;background:${r.tagColor};color:${r.tagTextColor};">${r.tag}</span>
        </div>
        <div style="position:absolute;right:-18px;bottom:-18px;font-size:6.5rem;opacity:.04;line-height:1;pointer-events:none;">${r.emoji}</div>
      </div>
      <div style="padding:22px 26px 26px;">
        <div class="route-title">${r.title}</div>
        <p class="route-desc">${r.shortDesc}</p>
        <div class="route-meta" style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:18px;padding:12px 0;border-top:1px solid rgba(245,237,224,.06);border-bottom:1px solid rgba(245,237,224,.06);">
          <div>⏱ <span>${r.sure}</span></div>
          <div>📍 <span>${r.durak} durak</span></div>
          <div>🚶 <span>${r.zorluk}</span></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:.7rem;color:rgba(245,237,224,.28);font-weight:500;">${r.hedefKitle}</span>
          <span class="route-btn">Rotayı İncele →</span>
        </div>
      </div>
    </a>`;
}

/* ═══════════════════
   VENUE CATEGORY HELPER
═══════════════════ */
var VENUE_CAT_FALLBACK = {
  kafe:      { label:'Kafe', emoji:'☕', color:'#C4521A' },
  restoran:  { label:'Restoran', emoji:'🍽', color:'#1A6B8A' },
  kahvalti:  { label:'Kahvaltı', emoji:'🌞', color:'#8A5520' },
  konaklama: { label:'Konaklama', emoji:'🏨', color:'#5A7A56' },
  beach:     { label:'Beach', emoji:'🏖', color:'#1A9A8A' },
  iskele:    { label:'İskele', emoji:'⚓', color:'#3A5A8A' }
};
function getVenueCatInfo(catId) {
  if (window.DATA && DATA.venueCategories) {
    var found = DATA.venueCategories.find(function(c){ return c.id === catId; });
    if (found) return { label: found.label, emoji: found.emoji || '📍', color: found.color || '#C4521A' };
  }
  if (VENUE_CAT_FALLBACK[catId]) return VENUE_CAT_FALLBACK[catId];
  var readableLabel = (catId || 'Mekan').replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  return { label: readableLabel, emoji:'📍', color:'#C4521A' };
}

/* ═══════════════════
   VENUE OPEN/CLOSED HELPER
═══════════════════ */
function _trNormVenue(s) { return (s||'').toLowerCase().replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ı/g,'i'); }
function _checkVenueHours(hm, mins) {
  var op = parseInt(hm[1]) * 60 + parseInt(hm[2]);
  var cl = parseInt(hm[3]) * 60 + parseInt(hm[4]);
  if (cl === 0) cl = 1440;
  if (cl <= op) return mins >= op || mins < cl;
  return mins >= op && mins < cl;
}
function getVenueTodayHours(v) {
  if (!v) return null;
  if (!v.weeklyHours || v.weeklyHours.length === 0) return v.hours || null;
  var dayNames = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  var tName = dayNames[new Date().getDay()];
  var tNorm = _trNormVenue(tName);
  var tHours = null;
  // 1. Tam gün eşleşmesi
  for (var i = 0; i < v.weeklyHours.length; i++) {
    if (_trNormVenue(v.weeklyHours[i].days) === tNorm) { tHours = v.weeklyHours[i].hours; break; }
  }
  // 2. Aralık ve özel eşleşmeler
  if (!tHours) {
    for (var i = 0; i < v.weeklyHours.length; i++) {
      var d = _trNormVenue(v.weeklyHours[i].days);
      if (d.indexOf('24 saat') > -1) return '24 saat';
      if (d.indexOf('her gun') > -1 || d.indexOf('resepsiyon') > -1) { tHours = v.weeklyHours[i].hours; break; }
      if (d.indexOf('pazartesi') > -1 && d.indexOf('cuma') > -1 && ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma'].indexOf(tName) > -1) { tHours = v.weeklyHours[i].hours; break; }
      if (d.indexOf('pazartesi') > -1 && d.indexOf('persembe') > -1 && ['Pazartesi','Salı','Çarşamba','Perşembe'].indexOf(tName) > -1) { tHours = v.weeklyHours[i].hours; break; }
      if (d.indexOf('cuma') > -1 && d.indexOf('pazar') > -1 && ['Cuma','Cumartesi','Pazar'].indexOf(tName) > -1) { tHours = v.weeklyHours[i].hours; break; }
      if (d.indexOf('cumartesi') > -1 && d.indexOf('pazar') > -1 && ['Cumartesi','Pazar'].indexOf(tName) > -1) { tHours = v.weeklyHours[i].hours; break; }
      // Sezon ay aralıkları
      if (d.indexOf('nisan') > -1 && d.indexOf('ekim') > -1) { var mo = new Date().getMonth(); tHours = (mo >= 3 && mo <= 9) ? v.weeklyHours[i].hours : 'Kapalı'; break; }
      if (d.indexOf('kasim') > -1 && d.indexOf('mart') > -1) { var mo = new Date().getMonth(); tHours = (mo <= 2 || mo >= 10) ? v.weeklyHours[i].hours : null; break; }
      if (d.indexOf(tNorm) > -1) { tHours = v.weeklyHours[i].hours; break; }
    }
  }
  if (!tHours && v.weeklyHours[0]) tHours = v.weeklyHours[0].hours;
  return tHours;
}
function isVenueOpen(v) {
  if (!v) return null;
  // Sezon dışı
  if (v.seasonal && v.seasonStart && v.seasonEnd) {
    try {
      var nowS = new Date();
      if (typeof v.seasonStart === 'string' && v.seasonStart.indexOf('-') > -1) {
        var sD = new Date(v.seasonStart); sD.setFullYear(nowS.getFullYear());
        var eD = new Date(v.seasonEnd); eD.setFullYear(nowS.getFullYear());
        if (!isNaN(sD.getTime()) && !isNaN(eD.getTime()) && (nowS < sD || nowS > eD)) return false;
      } else if (typeof v.seasonStart === 'number') {
        var mo = nowS.getMonth() + 1;
        if (mo < v.seasonStart || mo > v.seasonEnd) return false;
      }
    } catch(e) {}
  }
  // Konaklama
  if (v.category === 'konaklama') { var kh = new Date().getHours(); return kh >= 8 && kh < 24; }
  var tHours = getVenueTodayHours(v);
  if (!tHours) return null;
  if (tHours === '24 saat' || tHours.indexOf('24') > -1) return true;
  if (tHours.toLowerCase().indexOf('kapal') > -1) return false;
  var hm = tHours.match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
  if (!hm) return null;
  var mins = new Date().getHours() * 60 + new Date().getMinutes();
  return _checkVenueHours(hm, mins);
}

/* ═══════════════════
   PLACE CATEGORY HELPER
═══════════════════ */
var PLACE_CAT_FALLBACK = {
  tarihi: { label:'Ören Yeri', emoji:'🏛', color:'#1A2744', bg:['#2A3F6A','#1A2744'] },
  koy:    { label:'Koy', emoji:'🌊', color:'#1A6B8A', bg:['#1A5060','#0D3040'] },
  koyu:   { label:'Köy', emoji:'🏘', color:'#C4521A', bg:['#3A2A1A','#5A3C20'] },
  iskele: { label:'İskele', emoji:'⚓', color:'#3A5A8A', bg:['#1A3050','#0D2040'] },
  muze:   { label:'Müze', emoji:'📜', color:'#5A7A56', bg:['#3A4A20','#2A3818'] },
  doga:   { label:'Doğa', emoji:'🌿', color:'#2D8A4E', bg:['#1A4030','#0D3020'] }
};
function getPlaceCatInfo(catId) {
  // Önce DATA'daki dinamik kategorilerden oku
  if (window.DATA && DATA.placeCategories) {
    var found = DATA.placeCategories.find(function(c){ return c.id === catId; });
    if (found) return { label: found.label, emoji: found.emoji || '📍', color: found.color || '#1A2744', bg: [found.color || '#243255', '#1A2744'] };
  }
  if (PLACE_CAT_FALLBACK[catId]) return PLACE_CAT_FALLBACK[catId];
  // Bilinmeyen kategori — ID'yi okunabilir hale çevir (tire→boşluk, baş harfler büyük)
  var readableLabel = (catId || 'Yer').replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  return { label: readableLabel, emoji:'📍', color:'#1A2744', bg:['#243255','#1A2744'] };
}

/* ═══════════════════
   PLACE CARD RENDERER
═══════════════════ */
function placeCardHTML(p, delay = 0) {
  var catInfo = getPlaceCatInfo(p.category);
  const [c1, c2] = catInfo.bg;
  return `
    <a class="place-card fade-up" href="yerler/yer-detay.html?id=${p.id}" data-delay="${delay}" aria-label="${p.title}">
      <div class="place-img" style="background:linear-gradient(135deg,${c1},${c2});">
        ${p.image ? '<img src="' + p.image + '" alt="' + p.title + '" loading="lazy" onload="this.classList.add(\'loaded\')" style="object-position:center ' + (p.imagePos != null ? p.imagePos : 50) + '%">' : '<span class="place-emoji-fallback">' + p.emoji + '</span>'}
      </div>
      <span class="place-cat-badge" style="position:absolute;top:12px;left:12px;background:${catInfo.color}b3;color:#fff;backdrop-filter:blur(8px);">${catInfo.label}</span>
      <div style="padding:18px 20px 20px;">
        <h3>${p.title}</h3>
        <p style="margin-bottom:12px;">${p.shortDesc}</p>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">
          ${(p.tags||[]).map(t=>`<span style="font-size:.62rem;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(26,39,68,.06);color:var(--text-mid);">${t}</span>`).join('')}
        </div>
      </div>
    </a>`;
}

/* ═══════════════════════════════
   ROUTE PAGE RENDERER
   Call from individual route pages
═══════════════════════════════ */
const ROUTE_PAL = {
  'bir-gunde-assos':    { stop:'#C4521A', stopBg:'rgba(196,82,26,.1)',  g1:'rgba(196,82,26,.4)',  g2:'rgba(212,100,40,.2)',  bg:'linear-gradient(160deg,#1A0A04 0%,#2A1510 60%,#1A0D08 100%)' },
  'gun-batimi-rotasi':  { stop:'#D4935A', stopBg:'rgba(212,147,90,.12)',g1:'rgba(212,147,90,.35)',g2:'rgba(180,100,30,.2)',  bg:'linear-gradient(160deg,#1A0F04 0%,#281A08 60%,#1A1004 100%)' },
  'tarih-rotasi':       { stop:'#1A6B8A', stopBg:'rgba(26,107,138,.1)', g1:'rgba(26,107,138,.35)',g2:'rgba(15,60,90,.2)',   bg:'linear-gradient(160deg,#040D18 0%,#081828 60%,#040E1A 100%)' },
  'koy-koy-assos':      { stop:'#5A7A56', stopBg:'rgba(90,122,86,.1)',  g1:'rgba(90,122,86,.35)', g2:'rgba(50,80,46,.2)',   bg:'linear-gradient(160deg,#050E04 0%,#0A160A 60%,#060F05 100%)' },
  'deniz-koy-rotasi':   { stop:'#1A6B8A', stopBg:'rgba(26,107,138,.1)', g1:'rgba(26,107,138,.4)', g2:'rgba(10,50,80,.22)',  bg:'linear-gradient(160deg,#020C18 0%,#061525 60%,#030D1A 100%)' },
  'kahve-molasi-rotasi':{ stop:'#D4935A', stopBg:'rgba(212,147,90,.12)',g1:'rgba(212,147,90,.3)', g2:'rgba(150,90,30,.18)', bg:'linear-gradient(160deg,#180D04 0%,#241508 60%,#180E04 100%)' },
  'fotograf-rotasi':    { stop:'#8A5520', stopBg:'rgba(138,85,32,.1)',  g1:'rgba(138,85,32,.35)', g2:'rgba(196,82,26,.18)', bg:'linear-gradient(160deg,#140A02 0%,#221408 60%,#160B03 100%)' },
  'lezzet-rotasi':      { stop:'#1A6B8A', stopBg:'rgba(26,107,138,.1)', g1:'rgba(26,107,138,.3)', g2:'rgba(90,122,86,.18)', bg:'linear-gradient(160deg,#040E14 0%,#081A22 60%,#050F16 100%)' },
};
const ROUTE_ZORLUK_ICO = {'Kolay':'🟢','Çok Kolay':'🟢','Orta':'🟡','Zor':'🔴'};
const ROUTE_TEMPO_ICO  = {'Sakin':'🌿','Aktif':'⚡','Keşif':'🔍','Dinlendirici':'🛋','Yavaş':'🐢'};

function renderRoutePage(routeId) {
  if (!window.DATA) { console.error('DATA not loaded'); return; }
  const r = DATA.routes.find(x => x.id === routeId);
  if (!r) { console.error('Route not found:', routeId); return; }
  const p = ROUTE_PAL[routeId] || ROUTE_PAL['bir-gunde-assos'];

  document.title = r.title + ' — Assos Gezi Rotası | Assos\'u Keşfet';

  /* ── Inject page styles ── */
  if (!document.getElementById('rp-styles')) {
    const s = document.createElement('style');
    s.id = 'rp-styles';
    s.textContent = `
      /* ── HERO ── */
      .rp-hero{
        position:relative;overflow:hidden;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        padding:90px 24px 0;
      }
      .rp-hero::before{
        content:'';position:absolute;inset:0;pointer-events:none;
        background-image:
          linear-gradient(rgba(245,237,224,.022) 1px,transparent 1px),
          linear-gradient(90deg,rgba(245,237,224,.022) 1px,transparent 1px);
        background-size:56px 56px;
      }
      @keyframes rpOrb{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-18px) scale(1.05);}}
      .rp-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
      .rp-orb-1{animation:rpOrb 17s ease-in-out infinite;}
      .rp-orb-2{animation:rpOrb 14s ease-in-out infinite reverse 1s;}
      /* Back button */
      .rp-hero-topbar{
        display:flex;align-items:center;justify-content:space-between;
        width:100%;max-width:900px;margin:0 auto;
        padding:0 28px;position:relative;z-index:10;margin-bottom:16px;
      }
      .rp-back-btn{
        display:inline-flex;align-items:center;gap:7px;
        font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
        color:rgba(245,237,224,.4);text-decoration:none;
        padding:7px 14px;border-radius:999px;
        border:1px solid rgba(245,237,224,.1);
        background:rgba(255,255,255,.03);
        backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
        transition:color .2s,border-color .2s,background .2s;
      }
      .rp-back-btn:hover{color:rgba(245,237,224,.85);border-color:rgba(245,237,224,.22);background:rgba(255,255,255,.07);}
      /* Share */
      .rp-share-hero{
        display:inline-flex;align-items:center;gap:7px;
        font-size:.72rem;font-weight:600;
        color:rgba(245,237,224,.4);
        padding:7px 14px;border-radius:999px;
        border:1px solid rgba(245,237,224,.1);
        background:rgba(255,255,255,.03);
        backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
        cursor:pointer;transition:all .2s;
      }
      .rp-share-hero:hover{color:rgba(245,237,224,.85);border-color:rgba(245,237,224,.22);background:rgba(255,255,255,.07);}
      /* Two-column layout */
      .rp-hero-inner{
        position:relative;z-index:2;
        max-width:900px;width:100%;
        display:grid;grid-template-columns:1fr auto;
        gap:40px;align-items:center;
        padding:24px 0 80px;
      }
      /* Eyebrow tag */
      .rp-tag{
        display:inline-flex;align-items:center;gap:6px;
        padding:5px 16px;border-radius:999px;
        font-size:.63rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
        border:1px solid rgba(255,255,255,.12);
        backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        margin-bottom:20px;
      }
      /* Title */
      .rp-h1{
        font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
        font-size:clamp(2.4rem,5.5vw,3.8rem);
        letter-spacing:-.03em;line-height:1.0;
        color:#F5EDE0;margin-bottom:16px;
      }
      .rp-h1-emo{font-size:.72em;margin-right:6px;vertical-align:middle;display:inline;}
      /* Divider */
      .rp-divider{
        height:2px;width:52px;
        background:linear-gradient(90deg,var(--rp-ac,#C4521A),transparent);
        margin-bottom:16px;transform-origin:left;
        animation:rpLineGrow .9s .3s cubic-bezier(.16,1,.3,1) both;
      }
      @keyframes rpLineGrow{from{transform:scaleX(0);}to{transform:scaleX(1);}}
      /* Subtitle */
      .rp-subtitle{
        font-size:.95rem;color:rgba(245,237,224,.55);
        line-height:1.75;max-width:440px;margin-bottom:28px;
      }
      /* Chips */
      .rp-chips{display:flex;flex-wrap:wrap;gap:8px;}
      .rp-chip{
        display:flex;align-items:center;gap:6px;
        padding:6px 14px;border-radius:999px;
        background:rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.1);
        backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      }
      .rp-chip-lbl{font-size:.55rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,237,224,.25);line-height:1;margin-bottom:2px;}
      .rp-chip-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.76rem;color:rgba(245,237,224,.75);line-height:1;}
      /* Glass stat card */
      .rp-stat-card{
        background:rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.1);
        border-radius:20px;padding:28px 32px;
        backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        display:flex;flex-direction:column;gap:20px;
        min-width:175px;
      }
      .rp-stat{text-align:center;}
      .rp-stat-num{
        font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
        font-size:1.45rem;color:#F5EDE0;
        letter-spacing:-.03em;line-height:1;margin-bottom:4px;
      }
      .rp-stat-label{font-size:.62rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,237,224,.38);}
      .rp-stat-sep{height:1px;background:rgba(255,255,255,.08);}

      /* Toast */
      #rp-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--navy);color:var(--cream);padding:10px 20px;border-radius:12px;font-size:.82rem;font-weight:600;opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;z-index:600;white-space:nowrap;box-shadow:0 8px 32px rgba(13,24,41,.35);}
      #rp-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

      /* ── BODY CONTENT ── */
      .rp-wrap{max-width:800px;margin:0 auto;padding:56px 24px 100px;}
      .rp-desc-box{background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:22px;padding:34px 38px;margin-bottom:52px;box-shadow:0 4px 20px rgba(26,39,68,.04);}
      .rp-desc-text{font-family:'Lora',serif;font-size:1.02rem;color:var(--text-mid);line-height:1.9;font-style:italic;}
      .rp-sh{margin-bottom:26px;}
      .rp-sh-lbl{font-size:.66rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--terra);margin-bottom:8px;}
      .rp-sh-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.5rem;letter-spacing:-.025em;color:var(--navy);}

      .rp-stops{position:relative;padding-left:46px;margin-bottom:56px;}
      .rp-stops-line{position:absolute;left:17px;top:18px;bottom:18px;width:2px;background:linear-gradient(180deg,var(--rp-sc,#C4521A) 0%,rgba(26,39,68,.06) 100%);border-radius:2px;}
      .rp-stop{position:relative;margin-bottom:20px;}
      .rp-stop-dot{position:absolute;left:-46px;top:18px;width:36px;height:36px;border-radius:50%;background:var(--rp-sc,#C4521A);display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.8rem;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.15),0 0 0 4px var(--cream-light);z-index:1;}
      .rp-stop-card{background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(26,39,68,.04);transition:transform .25s,box-shadow .25s;}
      .rp-stop-card:hover{box-shadow:0 8px 30px rgba(26,39,68,.1);transform:translateX(5px);}
      .rp-stop-head{padding:20px 24px 14px;display:flex;align-items:center;gap:13px;}
      .rp-stop-emo{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;}
      .rp-stop-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.97rem;color:var(--navy);margin-bottom:2px;}
      .rp-stop-dur{font-size:.7rem;font-weight:600;color:var(--text-soft);}
      .rp-stop-body{padding:0 24px 20px;}
      .rp-stop-txt{font-size:.87rem;color:var(--text-mid);line-height:1.75;margin-bottom:12px;}
      .rp-stop-tip{background:rgba(212,147,90,.08);border:1px solid rgba(212,147,90,.16);border-radius:12px;padding:10px 14px;font-size:.78rem;color:#7A4A10;line-height:1.6;}
      .rp-stop-tip::before{content:'💡 ';}

      .rp-tips{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-bottom:56px;}
      .rp-tip{background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:16px;padding:18px 20px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 2px 8px rgba(26,39,68,.03);}
      .rp-tip-num{width:28px;height:28px;border-radius:50%;background:rgba(26,39,68,.06);display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.7rem;color:var(--text-soft);flex-shrink:0;margin-top:1px;}
      .rp-tip-txt{font-size:.83rem;color:var(--text-mid);line-height:1.65;}

      .rp-season{background:linear-gradient(135deg,#0D1829,#1A2744);border-radius:20px;padding:24px 30px;display:flex;align-items:center;gap:18px;margin-bottom:56px;}
      .rp-season-lbl{font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,237,224,.28);margin-bottom:3px;}
      .rp-season-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--cream);}

      .rp-others{background:linear-gradient(135deg,#0D1829,#1A2744);border-radius:22px;padding:32px;}
      .rp-other-link{display:flex;align-items:center;gap:14px;padding:14px 18px;background:rgba(245,237,224,.04);border:1px solid rgba(245,237,224,.07);border-radius:14px;text-decoration:none;transition:background .2s,border-color .2s;margin-bottom:10px;}
      .rp-other-link:last-child{margin-bottom:0;}
      .rp-other-link:hover{background:rgba(245,237,224,.08);border-color:rgba(245,237,224,.14);}

      @keyframes rpFadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      .rp-anim{animation:rpFadeUp .7s cubic-bezier(.25,.4,.25,1) both;}

      @media(max-width:700px){
        .rp-hero-inner{grid-template-columns:1fr;padding:100px 0 64px;}
        .rp-stat-card{flex-direction:row;flex-wrap:wrap;justify-content:center;min-width:unset;padding:20px 24px;gap:16px;}
        .rp-stat-sep{display:none;}
        .rp-hero{padding-top:80px;}
        .rp-hero-topbar{padding:0 16px;}
        .rp-hero-inner{padding:16px 0 60px;}
        .rp-wrap{padding:36px 18px 80px;}
        .rp-desc-box{padding:22px 20px;}
        .rp-stops{padding-left:38px;}
        .rp-stops-line{left:13px;}
        .rp-stop-dot{left:-38px;width:30px;height:30px;font-size:.7rem;}
        .rp-stop-head{padding:16px 18px 10px;}
        .rp-stop-body{padding:0 18px 16px;}
        .rp-tips{grid-template-columns:1fr;}
        .rp-others{padding:24px 20px;}
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Build HTML ── */
  const stopsHTML = (r.stops || []).map((s, idx) => `
    <div class="rp-stop fade-up">
      <div class="rp-stop-dot">${s.no || (idx + 1)}</div>
      <div class="rp-stop-card">
        <div class="rp-stop-head">
          <div class="rp-stop-emo" style="background:${p.stopBg};">${s.emoji || '📍'}</div>
          <div><div class="rp-stop-name">${s.title || ''}</div>${s.duration ? '<div class="rp-stop-dur">⏱ ' + s.duration + '</div>' : ''}</div>
        </div>
        <div class="rp-stop-body">
          <p class="rp-stop-txt">${s.desc || ''}</p>
          ${s.tip ? `<div class="rp-stop-tip">${s.tip}</div>` : ''}
        </div>
      </div>
    </div>`).join('');

  const tipsHTML = (r.tips || []).map((t, i) => `
    <div class="rp-tip fade-up">
      <div class="rp-tip-num">${i+1}</div>
      <div class="rp-tip-txt">${t}</div>
    </div>`).join('');

  /* Detect if inside rotalar/ subfolder */
  const basePath = window.location.pathname.includes('/rotalar/') ? '../' : '';

  const othersHTML = DATA.routes.filter(x => x.id !== routeId).slice(0, 3).map(x => `
    <a class="rp-other-link" href="${basePath}rotalar/rota-detay.html?id=${x.id}">
      <span style="font-size:1.5rem;">${x.emoji}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--cream);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${x.title}</div>
        <div style="font-size:.7rem;color:rgba(245,237,224,.35);">⏱ ${x.sure} · ${x.durak} durak</div>
      </div>
      <span style="color:rgba(245,237,224,.3);">→</span>
    </a>`).join('');

  /* ── Hero ── */
  const heroEl = document.getElementById('route-hero');
  if (heroEl) heroEl.outerHTML = `
    <div class="rp-hero" style="background:${p.bg};">
      <div class="rp-orb rp-orb-1" style="width:480px;height:480px;background:${p.g1};top:-130px;right:-80px;opacity:.55;"></div>
      <div class="rp-orb rp-orb-2" style="width:360px;height:360px;background:${p.g2};bottom:-100px;left:-60px;opacity:.5;"></div>
      <div class="rp-hero-topbar">
        <a href="${basePath}rotalar.html" class="rp-back-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Rotalar
        </a>
        <button class="rp-share-hero" id="rp-share-btn">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Paylaş
        </button>
      </div>
      <div class="rp-hero-inner" style="--rp-ac:${p.stop};">
        <div>
          <div class="rp-tag rp-anim" style="background:${r.tagColor};color:${r.tagTextColor};border-color:${r.tagTextColor}33;animation-delay:.05s;">${r.tag}</div>
          <h1 class="rp-h1 rp-anim" style="animation-delay:.15s;"><span class="rp-h1-emo">${r.emoji}</span>${r.title}</h1>
          <div class="rp-divider"></div>
          <p class="rp-subtitle rp-anim" style="animation-delay:.25s;">${r.shortDesc}</p>
          <div class="rp-chips rp-anim" style="animation-delay:.38s;">
            <div class="rp-chip"><span style="font-size:.9rem;">${ROUTE_TEMPO_ICO[r.tempo]||'🚶'}</span><div><div class="rp-chip-lbl">Tempo</div><div class="rp-chip-val">${r.tempo}</div></div></div>
            <div class="rp-chip"><span style="font-size:.9rem;">${ROUTE_ZORLUK_ICO[r.zorluk]||'⚪'}</span><div><div class="rp-chip-lbl">Zorluk</div><div class="rp-chip-val">${r.zorluk}</div></div></div>
            <div class="rp-chip"><span style="font-size:.9rem;">👥</span><div><div class="rp-chip-lbl">Kime Uygun</div><div class="rp-chip-val">${r.hedefKitle}</div></div></div>
          </div>
        </div>
        <div class="rp-stat-card rp-anim" style="animation-delay:.3s;">
          <div class="rp-stat">
            <div class="rp-stat-num" style="font-size:1.1rem;color:${r.tagTextColor};">${r.sure}</div>
            <div class="rp-stat-label">Toplam Süre</div>
          </div>
          <div class="rp-stat-sep"></div>
          <div class="rp-stat">
            <div class="rp-stat-num">${r.durak}<span style="font-size:.85rem;color:rgba(245,237,224,.35);font-weight:600;"> durak</span></div>
            <div class="rp-stat-label">Güzergah</div>
          </div>
          <div class="rp-stat-sep"></div>
          <div class="rp-stat">
            <div class="rp-stat-num" style="font-size:1.3rem;">${ROUTE_ZORLUK_ICO[r.zorluk]||'⚪'}</div>
            <div class="rp-stat-label">${r.zorluk}</div>
          </div>
        </div>
      </div>
    </div>`;

  /* ── Body ── */
  const bodyEl = document.getElementById('route-body');
  if (bodyEl) bodyEl.outerHTML = `
    <div id="route-body">
      <div id="rp-toast">🔗 Link kopyalandı!</div>
      <div class="rp-wrap">
        <div class="rp-desc-box fade-up"><p class="rp-desc-text">${r.description || r.shortDesc}</p></div>
        <div class="rp-season fade-up">
          <span style="font-size:1.8rem;">🗓</span>
          <div><div class="rp-season-lbl">En İyi Mevsim</div><div class="rp-season-val">${r.season}</div></div>
        </div>
        <div class="rp-sh fade-up"><div class="rp-sh-lbl">Güzergah</div><div class="rp-sh-title">${r.durak} Durak, Sırayla</div></div>
        <div class="rp-stops" style="--rp-sc:${p.stop};">
          <div class="rp-stops-line"></div>
          ${stopsHTML}
        </div>
        <div class="rp-sh fade-up"><div class="rp-sh-lbl">Bilmen Gerekenler</div><div class="rp-sh-title">Pratik İpuçları</div></div>
        <div class="rp-tips">${tipsHTML}</div>
        <div class="rp-others fade-up">
          <p style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1rem;color:var(--cream);margin-bottom:6px;">Başka Rotalara Bak</p>
          <p style="font-size:.82rem;color:rgba(245,237,224,.4);margin-bottom:20px;">Assos'un farklı bir yüzünü keşfet.</p>
          ${othersHTML}
          <div style="text-align:center;padding-top:22px;border-top:1px solid rgba(245,237,224,.07);margin-top:16px;">
            <a href="${basePath}rotalar.html" class="btn-terra">Tüm Rotaları Gör</a>
          </div>
        </div>
      </div>
    </div>`;

  // Paylaş butonu event listener
  const shareBtn = document.getElementById('rp-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      rpShare(routeId, encodeURIComponent(r.title), encodeURIComponent(r.shortDesc));
    });
  }

  scrollFadeIn();

  // Track route page view
  if (window.trackPageView) trackPageView('route_' + routeId);
}

/* ── Share helper (used by renderRoutePage) ── */
function rpShare(id, encodedTitle, encodedDesc) {
  const shareUrl = 'https://assosukesfet.com/rotalar/rota-detay.html?id=' + id;
  const title = decodeURIComponent(encodedTitle) + ' — Assos\'u Keşfet';
  const shareText = title + '\n' + decodeURIComponent(encodedDesc) + '\n\n' + shareUrl;
  if (navigator.share) {
    navigator.share({ text: shareText }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareUrl).then(() => {
      const t = document.getElementById('rp-toast');
      if (t) { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
    }).catch(() => { prompt('Bu linki kopyala:', shareUrl); });
  }
}

/* ═══════════════════
   VENUE CARD RENDERER
═══════════════════ */
const VENUE_ICONS = { kafe: 'rgba(196,82,26,.1)', restoran: 'rgba(26,107,138,.1)', kahvalti: 'rgba(212,147,90,.12)', konaklama: 'rgba(90,122,86,.12)' };
const VENUE_TAG_COLORS = { kafe: 'rgba(196,82,26,.1)', restoran: 'rgba(26,107,138,.1)', kahvalti: 'rgba(212,147,90,.15)', konaklama: 'rgba(90,122,86,.12)' };
const VENUE_TAG_TEXT = { kafe: 'var(--terra)', restoran: 'var(--aegean)', kahvalti: '#8A5520', konaklama: 'var(--sage)' };
const VENUE_LABELS = { kafe: 'Kafe', restoran: 'Restoran', kahvalti: 'Kahvaltı', konaklama: 'Konaklama' };
function venueCardHTML(v, delay = 0) {
  const premBadge = isPremiumActive(v) ? '<span style="display:inline-flex;align-items:center;gap:3px;font-size:.58rem;font-weight:700;padding:2px 8px;border-radius:999px;background:linear-gradient(135deg,#D4935A,#E8A07A);color:#fff;margin-left:6px;vertical-align:middle;">👑 Premium</span>' : '';
  const premBorder = isPremiumActive(v) ? 'border:1.5px solid rgba(212,147,90,.25);box-shadow:0 2px 12px rgba(212,147,90,.08);' : '';
  return `
    <a class="venue-card fade-up" href="mekanlar.html?id=${v.id}" data-delay="${delay}" aria-label="${v.title}" style="display:block;padding:22px;${premBorder}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div style="width:46px;height:46px;border-radius:13px;background:${VENUE_ICONS[v.category]||'rgba(26,39,68,.06)'};display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${v.emoji}</div>
        <span style="font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:${VENUE_TAG_COLORS[v.category]||'rgba(26,39,68,.06)'};color:${VENUE_TAG_TEXT[v.category]||'var(--text-mid)'};">${VENUE_LABELS[v.category]||v.category}</span>
      </div>
      <h3 style="margin-bottom:6px;">${v.title}${premBadge}</h3>
      <p style="margin-bottom:12px;">${v.shortDesc}</p>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">
        ${(v.tags||[]).map(t=>`<span style="font-size:.62rem;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(26,39,68,.06);color:var(--text-mid);">${t}</span>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:5px;font-size:.75rem;color:var(--text-soft);">📍 ${v.location}</div>
    </a>`;
}

/* ═══════════════════════════════════════════════
   VENUE DETAIL PAGE
═══════════════════════════════════════════════ */
function renderVenuePage(venueId) {
  const v = DATA.venues.find(x => x.id === venueId);
  if (!v) {
    document.getElementById('vp-hero').innerHTML = '';
    document.getElementById('vp-body').innerHTML = '<p style="padding:80px 24px;text-align:center;color:#718096;">Mekan bulunamadı.</p>';
    return;
  }

  /* ── Gradient & accent metadata ── */
  const VMETA = {
    'behram-kafe':          { g:'linear-gradient(160deg,#3A1A0A 0%,#7A3018 100%)',          accent:'#C4521A' },
    'korfez-balik':         { g:'linear-gradient(160deg,#081828 0%,#0E3052 100%)',           accent:'#1A6B8A' },
    'assos-tas-kahvalti':   { g:'linear-gradient(160deg,#3A2408 0%,#7A4820 100%)',           accent:'#C4521A' },
    'gun-batimi-kafe':      { g:'linear-gradient(160deg,#280A20 0%,#8A3010 60%,#C45218 100%)', accent:'#C4521A' },
    'kayalar-koy-evi':      { g:'linear-gradient(160deg,#0A1C08 0%,#1E3818 100%)',           accent:'#5A7A56' },
    'antik-liman-restoran': { g:'linear-gradient(160deg,#061420 0%,#102840 100%)',           accent:'#1A6B8A' },
    'kadirga-plaj':         { g:'linear-gradient(160deg,#081830 0%,#0E3858 100%)',           accent:'#1A9A8A' },
    'ahmetce-iskele-kafe':  { g:'linear-gradient(160deg,#061018 0%,#0C2030 100%)',           accent:'#3A5A8A' },
    'sivrice-beach':        { g:'linear-gradient(160deg,#041420 0%,#0A2C3C 100%)',           accent:'#1A9A8A' },
    'sunaba-kasri-otel':   { g:'linear-gradient(160deg,#1A2A10 0%,#3A4A28 100%)',           accent:'#5A7A56' },
  };
  const meta = VMETA[v.id] || { g:'linear-gradient(160deg,#1A2744,#2A3A5A)', accent:'#1A2744' };
  const G = meta.g;
  const G2 = G.replace('160deg','220deg');
  const G3 = G.replace('160deg','40deg');
  const G4 = 'linear-gradient(160deg,#06080e,#0a0e18)';
  const G5 = G.replace('160deg','290deg');

  /* ── Category colours ── */
  const CAT_STYLE = {
    kafe:      { bg:'rgba(196,82,26,.1)',   color:'#C4521A',  label:'Kafe' },
    restoran:  { bg:'rgba(26,107,138,.1)',  color:'#1A6B8A',  label:'Restoran' },
    kahvalti:  { bg:'rgba(212,147,90,.12)', color:'#8A5520',  label:'Kahvaltı' },
    konaklama: { bg:'rgba(90,122,86,.12)',  color:'#5A7A56',  label:'Konaklama' },
    beach:     { bg:'rgba(26,158,138,.1)',  color:'#1A9A8A',  label:'Beach' },
    iskele:    { bg:'rgba(26,39,68,.08)',   color:'#3A5A8A',  label:'İskele' },
  };
  const cs = CAT_STYLE[v.category] || { bg:'rgba(26,39,68,.08)', color:'#4A5568', label:v.category };

  /* ── Highlights per venue ── */
  /* ── Tag → cümle üreteci ── */
  const TAG_SENTENCES = {
    'manzaralı':     ['🌅 Eşsiz manzarası ile nefes kesici bir deneyim sunar','🌅 Manzara eşliğinde unutulmaz anlar yaşarsınız'],
    'manzara':       ['🌅 Gözlerinizi alamayacağınız bir panorama','🌅 Her açıdan kartpostal gibi bir manzara'],
    'deniz kenarı':  ['🌊 Denizin hemen yanı başında huzurlu bir ortam','🌊 Dalgaların sesi eşliğinde keyifli vakit geçirin'],
    'deniz':         ['🌊 Ege\'nin masmavi sularına nazır konumda','🌊 Deniz manzarası eşliğinde ferahlayın'],
    'köy içinde':    ['🏘 Köyün kalbinde, otantik taş sokakların arasında','🏘 Gerçek köy yaşamını yakından hissedin'],
    'köy':           ['🏘 Yerel köy atmosferini doyasıya yaşayın','🏘 Taş döşeli sokaklarda zaman yolculuğu'],
    'gün batımı':    ['🌅 Ege\'ye batan güneşi izlemek için ideal nokta','🌅 Günü muhteşem bir gün batımıyla uğurlayın'],
    'sakin':         ['🤫 Kalabalıktan uzak, huzur dolu bir atmosfer','🤫 Sessizliğin ve dinginliğin tadını çıkarın'],
    'sessiz':        ['🤫 Şehrin gürültüsünden uzakta, tam bir huzur','🤫 Kuş sesleri dışında hiçbir şey duymayın'],
    'huzur':         ['🤫 İç huzurunuzu bulacağınız nadir yerlerden','🤫 Stresten arınmak için biçilmiş kaftan'],
    'iskele':        ['⚓ Ahşap iskele üzerinde denize karşı oturun','⚓ Balıkçı teknelerini seyrederek keyif yapın'],
    'liman':         ['⚓ Tarihi limanın büyüleyici atmosferini yaşayın','⚓ Antik çağlardan kalma rıhtımda vakit geçirin'],
    'taş ev':        ['🪨 Restore edilmiş otantik taş mimaride konaklayın','🪨 Tarihi taş yapının sıcaklığını hissedin'],
    'organik':       ['🌿 Tamamen organik ve doğal ürünlerle hazırlanmış','🌿 Sağlıklı ve doğal lezzetlerin adresi'],
    'doğa':          ['🌿 Doğayla iç içe, yeşillikler arasında huzur bulun','🌿 Doğanın kucağında unutulmaz bir deneyim'],
    'doğal':         ['🌿 Doğallığını korumuş eşsiz bir atmosfer','🌿 Yapay olmayan, gerçek bir Ege deneyimi'],
    'plaj':          ['🏖 Güneş, kum ve denizin tadını çıkarın','🏖 Yaz günlerinin en güzel adresi'],
    'sahil':         ['🏖 Sahil boyunca uzanan muhteşem bir konum','🏖 Kumsalın keyfini doyasıya yaşayın'],
    'fotoğraf':      ['📸 Fotoğraf tutkunları için kaçırılmaz kareler','📸 Her köşesi Instagram\'lık bir mekan'],
    'kahve':         ['☕ Özenle hazırlanan kahvenin tadını çıkarın','☕ Ege esintisinde mükemmel bir kahve molası'],
    'çay':           ['☕ Doğal bitki çaylarıyla ferahlayın','☕ Yerel otlardan demlenen çaylar sizi bekliyor'],
    'kahvaltı':      ['🍳 Sabahın en güzel hali, köy kahvaltısıyla başlar','🍳 Unutulmaz bir Ege kahvaltısı deneyimi'],
    'serpme':        ['🍳 Zengin serpme kahvaltı ile güne enerji dolu başlayın','🍳 Yerel lezzetlerle dolu serpme kahvaltı'],
    'balık':         ['🐟 Günlük taze avlanmış balığın en lezzetli hali','🐟 Denizden sofraya taze balık keyfi'],
    'deniz ürünleri':['🐟 Ege\'nin en taze deniz ürünleri burada','🐟 Balık ve deniz mahsullerinin en iyisi'],
    'taze':          ['🐟 Her gün taze ürünlerle hazırlanan lezzetler','🌿 Tazeliğin ve doğallığın buluşma noktası'],
    'zeytinyağlı':   ['🫒 Ege zeytinyağıyla hazırlanan geleneksel tatlar','🫒 Zeytinyağlı mutfağın en özel adresi'],
    'zeytin':        ['🫒 Yerel zeytinliklerin aromasını hissedin','🫒 Bölgenin meşhur zeytinlerini tadın'],
    'ege mutfağı':   ['🫒 Ege mutfağının en otantik lezzetleri burada','🫒 Yerel malzemelerle hazırlanan Ege yemekleri'],
    'tarihi':        ['🏛 Binlerce yıllık tarihin izlerini keşfedin','🏛 Antik çağların büyüleyici atmosferi'],
    'antik':         ['🏛 Antik kalıntılar arasında zamanda yolculuk yapın','🏛 Tarihe dokunabileceğiniz nadir yerlerden'],
    'havuzlu':       ['🏊 Havuz keyfiyle serinleyin ve rahatlayın','🏊 Yetişkin ve çocuk havuzlarında eğlenceli vakit'],
    'havuz':         ['🏊 Manzaralı havuzda serinlemenin tadını çıkarın','🏊 Sıcak günlerde havuz keyfi sizi bekliyor'],
    'butik':         ['🏨 Butik ve özel bir konaklama deneyimi','🏨 Her detayı düşünülmüş, kişiye özel hizmet'],
    'butik otel':    ['🏨 Taş mimaride butik otel konforunu yaşayın','🏨 Küçük ama özenli, sıcak bir konaklama'],
    'yürüyüş':      ['🥾 Doğa yürüyüşü için mükemmel bir başlangıç noktası','🥾 Patikalar boyunca keşfetmenin keyfini çıkarın'],
    'romantik':      ['💕 Çiftler için romantik ve özel bir atmosfer','💕 Sevdiklerinizle unutulmaz anlar biriktirin'],
    'aile':          ['👨‍👩‍👧‍👦 Ailece keyifli vakit geçireceğiniz bir mekan','👨‍👩‍👧‍👦 Çocuklar ve yetişkinler için ideal ortam'],
    'yerel':         ['🤝 Yerel halkın uğrak noktası, samimi atmosfer','🤝 Gerçek yerel kültürü deneyimleyin'],
    'otantik':       ['🤝 Otantik dokusu korunmuş, gerçek bir Ege mekanı','🤝 Zamanın değiştiremediği otantik bir atmosfer'],
    'teras':         ['☀️ Açık terasında güneşin ve manzaranın tadını çıkarın','☀️ Teras keyfi eşliğinde Ege\'yi seyredin'],
    'bahçe':         ['🌳 Yeşillikler içinde huzurlu bir bahçe ortamı','🌳 Bahçede doğayla iç içe keyifli anlar'],
    'koy':           ['🌊 Berrak sularıyla büyüleyen saklı bir koy','🌊 Ege\'nin en temiz sularında yüzme keyfi'],
    'berrak':        ['💎 Kristal berraklığındaki sularda yüzün','💎 Dipten görebileceğiniz tertemiz deniz'],
    'gizli':         ['🤫 Çoğu kişinin bilmediği saklı bir cennet','🤫 Keşfedilmeyi bekleyen gizli bir hazine'],
    'popüler':       ['⭐ Bölgenin en çok tercih edilen adreslerinden','⭐ Ziyaretçilerin vazgeçilmez favorisi'],
    'canlı müzik':   ['🎵 Canlı müzik eşliğinde keyifli bir akşam','🎵 Müziğin ritmiyle akan hoş bir atmosfer'],
    'bar':           ['🍸 Akşam keyfini özel kokteyller ile taçlandırın','🍸 Günbatımı eşliğinde bir kadeh kaldırın'],
    'peynir':        ['🧀 Yerel çiftlik peynirlerinin eşsiz lezzeti','🧀 Bölgenin en iyi peynirlerini tadın'],
  };
  function generateHighlights(tags, description) {
    const used = new Set();
    const result = [];

    // 1. Önce etiketlerden
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (result.length >= 4) break;
        const lower = tag.toLowerCase().trim();
        let sentences = TAG_SENTENCES[lower];
        if (!sentences) {
          for (const [key, val] of Object.entries(TAG_SENTENCES)) {
            if (lower.includes(key) || key.includes(lower)) { sentences = val; break; }
          }
        }
        if (sentences) {
          const pick = sentences[result.length % sentences.length];
          if (!used.has(pick)) { result.push(pick); used.add(pick); }
        }
      }
    }

    // 2. Etiketlerden 4 çıkmadıysa, hakkında metninden anahtar kelime tara
    if (result.length < 4 && description) {
      const desc = description.toLowerCase();
      for (const [key, val] of Object.entries(TAG_SENTENCES)) {
        if (result.length >= 4) break;
        if (desc.includes(key)) {
          const pick = val[result.length % val.length];
          if (!used.has(pick)) { result.push(pick); used.add(pick); }
        }
      }
    }

    return result;
  }
  const highlights = generateHighlights(v.tags, v.description || v.shortDesc);

  /* ── Related data ── */
  const similar      = DATA.venues.filter(x => x.id !== v.id && x.category === v.category).slice(0,6);
  const relatedRoutes = DATA.routes.filter(r => (r.relatedVenues||[]).includes(v.id));

  /* ── Paths ── */
  const inSub  = window.location.pathname.includes('/mekanlar/');
  const base   = inSub ? '../' : '';
  const mapsUrl = 'https://maps.google.com/?q=' + encodeURIComponent(v.title + ' ' + (v.address || v.location + ' Ayvacık Çanakkale'));

  /* ── Save helpers ── */
  const SAVE_KEY = 'assos_mk_saves';
  const getSaved  = () => { try { return new Set(JSON.parse(localStorage.getItem(SAVE_KEY)||'[]')); } catch { return new Set(); } };
  const isSaved   = getSaved().has(v.id);

  /* ── WhatsApp contact URL ── */
  const waNum = (v.phone || '').replace(/\D/g,'').replace(/^0/,'90');
  const waContactMsg = encodeURIComponent('Merhaba! *Assos\'u Keşfet* (assosukesfet.com) üzerinden ulaşıyorum.\n\n' + v.title + ' hakkında bilgi almak istiyorum.');
  const waContactUrl = `https://wa.me/${waNum}?text=${waContactMsg}`;

  /* ── Sezonluk mekan kontrolü ── */
  const isSeasonClosed = (() => {
    if (!v.seasonal) return false;
    var now = new Date();
    if (v.seasonStart && v.seasonEnd) {
      var s = new Date(v.seasonStart);
      var e = new Date(v.seasonEnd);
      // Yıl düzeltmesi — bu yılın sezon tarihlerini kullan
      s.setFullYear(now.getFullYear());
      e.setFullYear(now.getFullYear());
      return now < s || now > e;
    }
    // Eski format (ay bazlı) fallback
    var sMonth = typeof v.seasonStart === 'number' ? v.seasonStart : 4;
    var eMonth = typeof v.seasonEnd === 'number' ? v.seasonEnd : 10;
    var nowMonth = now.getMonth() + 1;
    if (sMonth <= eMonth) return nowMonth < sMonth || nowMonth > eMonth;
    return nowMonth < sMonth && nowMonth > eMonth;
  })();

  /* ── Today's hours helper ── */
  /* ── Open/closed logic ── */
  const dayNames = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const todayName = dayNames[new Date().getDay()];
  function trNormDay(s) { return (s||'').toLowerCase().replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ı/g,'i'); }
  const todayNorm = trNormDay(todayName);
  const todayHours = (() => {
    if (!v.weeklyHours || v.weeklyHours.length === 0) return v.hours || '—';
    // Önce bugünün adıyla tam eşleşme ara (eski Sali/Carsamba verisiyle de uyumlu)
    for (const entry of v.weeklyHours) {
      if (!entry.days) continue;
      if (trNormDay(entry.days) === todayNorm) return entry.hours;
    }
    // Sonra aralık ve özel eşleşmeler
    for (const entry of v.weeklyHours) {
      if (!entry.days) continue;
      var d = trNormDay(entry.days);
      if (d.includes('her gun') || d.includes('resepsiyon')) return entry.hours;
      if (d.includes('pazartesi') && d.includes('cuma') && ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma'].includes(todayName)) return entry.hours;
      if (d.includes('pazartesi') && d.includes('persembe') && ['Pazartesi','Salı','Çarşamba','Perşembe'].includes(todayName)) return entry.hours;
      if (d.includes('cuma') && d.includes('pazar') && ['Cuma','Cumartesi','Pazar'].includes(todayName)) return entry.hours;
      if (d.includes('cumartesi') && d.includes('pazar') && ['Cumartesi','Pazar'].includes(todayName)) return entry.hours;
      if (d.includes('nisan') && d.includes('ekim')) { const m = new Date().getMonth(); return (m >= 3 && m <= 9) ? entry.hours : null; }
      if (d.includes('kasim') && d.includes('mart')) { const m = new Date().getMonth(); return (m <= 2 || m >= 10) ? entry.hours : null; }
    }
    return v.weeklyHours[0].hours;
  })();
  const isNowOpen = (() => {
    // Konaklama: 08:00-00:00 arası açık (gece 12'den sonra yeni müşteri yok)
    if (v.category === 'konaklama') {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 8 && hour < 24;
    }
    if (!todayHours || todayHours === '—' || todayHours.toLowerCase().indexOf('kapal') > -1) return false;
    const match = todayHours.match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
    if (!match) return null;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = parseInt(match[1]) * 60 + parseInt(match[2]);
    var close = parseInt(match[3]) * 60 + parseInt(match[4]);
    // 00:00 = gece yarısı, 1440 olarak hesapla
    if (close === 0) close = 1440;
    // Gece yarısını geçen saatler (ör: 20:00 - 02:00)
    if (close <= open) return mins >= open || mins < close;
    return mins >= open && mins < close;
  })();
  // Türkçe saat ekleri — TDK kuralı: okunuşa göre
  // Bulunma: -de/-da/-te/-ta | Yönelme: -e/-a/-ye/-ya
  // Son okunan heceye bakılır, sert ünsüz varsa t/s versiyonu kullanılır
  var SAAT_BULUNMA = {0:"'da",1:"'de",2:"'de",3:"'te",4:"'te",5:"'te",6:"'da",7:"'de",8:"'de",9:"'da",10:"'da",11:"'de",12:"'de",13:"'te",14:"'te",15:"'te",16:"'da",17:"'de",18:"'de",19:"'da",20:"'de",21:"'de",22:"'de",23:"'te"};
  var SAAT_YONELME = {0:"'a",1:"'e",2:"'ye",3:"'e",4:"'e",5:"'e",6:"'ya",7:"'ye",8:"'e",9:"'a",10:"'a",11:"'e",12:"'ye",13:"'e",14:"'e",15:"'e",16:"'ya",17:"'ye",18:"'e",19:"'a",20:"'ye",21:"'e",22:"'ye",23:"'e"};
  // Dakika ekleri (son okunan dakika heceye göre)
  var DK_BULUNMA = {0:"'da",5:"'te",10:"'da",15:"'te",20:"'de",25:"'te",30:"'da",35:"'te",40:"'ta",45:"'te",50:"'de",55:"'te"};
  var DK_YONELME = {0:"'a",5:"'e",10:"'a",15:"'e",20:"'ye",25:"'e",30:"'a",35:"'e",40:"'a",45:"'e",50:"'ye",55:"'e"};

  function saatEki(hh, mm, tip) {
    var h = parseInt(hh); var m = parseInt(mm || '0');
    var saat = hh + '.' + (mm || '00');
    if (tip === 'yonelme') {
      if (m > 0) return saat + (DK_YONELME[m] || "'e");
      return saat + (SAAT_YONELME[h] || "'e");
    }
    // Bulunma (varsayılan)
    if (m > 0) return saat + (DK_BULUNMA[m] || "'de");
    return saat + (SAAT_BULUNMA[h] || "'de");
  }

  const openBadge = (() => {
    // Sezon dışı mekan (konaklama dahil)
    if (isSeasonClosed) {
      var openDate;
      if (v.seasonStart && typeof v.seasonStart === 'string' && v.seasonStart.includes('-')) {
        openDate = new Date(v.seasonStart);
        var now2 = new Date();
        openDate.setFullYear(now2.getFullYear());
        if (openDate <= now2) openDate.setFullYear(now2.getFullYear() + 1);
      } else {
        var sM = (typeof v.seasonStart === 'number' ? v.seasonStart : 4) - 1;
        openDate = new Date(new Date().getFullYear(), sM, 1);
        if (openDate <= new Date()) openDate.setFullYear(openDate.getFullYear() + 1);
      }
      var openLabel = openDate.toLocaleDateString('tr-TR', {day:'numeric', month:'long'});
      return '<span class="vp-open-badge vp-closed">Sezon dışı · ' + openLabel + bulunmaEki(openLabel.split(' ').pop()) + ' açılacak</span>';
    }
    // Konaklama sezon içindeyse badge gösterme
    if (v.category === 'konaklama') return '';
    if (isNowOpen === true) {
      const match = (todayHours || '').match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
      const closeText = match ? saatEki(match[3], match[4], 'yonelme') + ' kadar' : '';
      return '<span class="vp-open-badge vp-open">Açık' + (closeText ? ' · ' + closeText : '') + '</span>';
    } else if (isNowOpen === false) {
      if (todayHours && todayHours.toLowerCase().includes('kapal')) {
        const DAY_ORDER = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
        const todayIdx = DAY_ORDER.findIndex(d => d.toLowerCase() === todayName.toLowerCase());
        const DAY_ALIASES = {'pazartesi':0,'salı':1,'sali':1,'çarşamba':2,'carsamba':2,'perşembe':3,'persembe':3,'cuma':4,'cumartesi':5,'pazar':6};
        const entries = (v.weeklyHours || []).filter(e => e.days);
        for (let offset = 1; offset <= 7; offset++) {
          const checkIdx = (todayIdx + offset) % 7;
          const checkDay = DAY_ORDER[checkIdx];
          const dayLabel = offset === 1 ? 'Yarın' : checkDay;
          for (const entry of entries) {
            const d = fixTR(entry.days || '').toLowerCase();
            const h = fixTR(entry.hours || '');
            if (h.toLowerCase().includes('kapal')) continue;
            if (d.includes(checkDay.toLowerCase())) {
              const m = h.match(/(\d{2}):(\d{2})/);
              return '<span class="vp-open-badge vp-closed">Kapalı · ' + dayLabel + ' ' + (m ? saatEki(m[1], m[2]) : '') + ' açılacak</span>';
            }
            const rangeMatch = d.match(/(\S+)\s*[–\-]\s*(\S+)/);
            if (rangeMatch) {
              const s = DAY_ALIASES[rangeMatch[1].toLowerCase()];
              const e = DAY_ALIASES[rangeMatch[2].toLowerCase()];
              if (s !== undefined && e !== undefined && checkIdx >= s && checkIdx <= e) {
                const m = h.match(/(\d{2}):(\d{2})/);
                return '<span class="vp-open-badge vp-closed">Kapalı · ' + dayLabel + ' ' + (m ? saatEki(m[1], m[2]) : '') + ' açılacak</span>';
              }
            }
          }
        }
        return '<span class="vp-open-badge vp-closed">Kapalı</span>';
      } else {
        const match = (todayHours || '').match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
        if (match) {
          const now = new Date();
          const mins = now.getHours() * 60 + now.getMinutes();
          const openMins = parseInt(match[1]) * 60 + parseInt(match[2]);
          if (mins < openMins) {
            return '<span class="vp-open-badge vp-closed">Kapalı · Bugün ' + saatEki(match[1], match[2]) + ' açılacak</span>';
          } else {
            return '<span class="vp-open-badge vp-closed">Kapalı · Yarın ' + saatEki(match[1], match[2]) + ' açılacak</span>';
          }
        }
        return '<span class="vp-open-badge vp-closed">Kapalı</span>';
      }
    }
    return '';
  })();

  /* ── Inject CSS (once) ── */
  if (!document.getElementById('vp-styles')) {
    const s = document.createElement('style');
    s.id = 'vp-styles';
    s.textContent = `
      /* ── VP Hero (compact 2-col) ── */
      .vp-hero{position:relative;min-height:520px;display:flex;align-items:center;padding:0 36px 48px;overflow:hidden;}
      .vp-hero-bg{position:absolute;inset:0;z-index:0;}
      .vp-topo{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.04;background-image:repeating-radial-gradient(circle at 50% 50%,transparent 0,transparent 18px,rgba(245,237,224,.3) 18px,rgba(245,237,224,.3) 19px,transparent 19px,transparent 38px,rgba(245,237,224,.2) 38px,rgba(245,237,224,.2) 39px,transparent 39px,transparent 58px,rgba(245,237,224,.15) 58px,rgba(245,237,224,.15) 59px),linear-gradient(rgba(245,237,224,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(245,237,224,.02) 1px,transparent 1px);background-size:120px 120px,40px 40px,40px 40px;}
      .vp-vignette{position:absolute;inset:0;z-index:2;background:radial-gradient(ellipse at 60% 40%,transparent 45%,rgba(0,0,0,.18) 100%);}
      .vp-text-overlay{position:absolute;inset:0;z-index:3;background:linear-gradient(to bottom,rgba(0,0,0,.14) 0%,transparent 40%,transparent 70%,rgba(0,0,0,.35) 100%);}
      .vp-hero-wrap{position:relative;z-index:10;width:100%;max-width:1100px;margin:0 auto;padding-top:90px;}
      .vp-hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}
      .vp-back-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.76rem;font-weight:600;text-decoration:none;transition:background .2s;font-family:inherit;}
      .vp-back-btn:hover{background:rgba(255,255,255,.26);}
      .vp-hero-acts{display:flex;gap:8px;}
      .vp-act-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;}
      .vp-act-btn:hover{background:rgba(255,255,255,.28);}
      .vp-act-btn.saved{background:rgba(196,82,26,.82);border-color:rgba(196,82,26,.5);}
      /* 2-col layout */
      .vp-hero-2col{display:grid;grid-template-columns:1fr auto;gap:48px;align-items:center;padding-bottom:20px;}
      .vp-hero-left{}
      .vp-hero-cat-pill{display:inline-block;font-size:.6rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 11px;border-radius:999px;margin-bottom:14px;}
      .vp-hero-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(2rem,6vw,3.4rem);color:#fff;line-height:1.1;margin:0 0 10px;text-shadow:0 4px 20px rgba(0,0,0,.35);}
      .vp-hero-loc{font-size:.88rem;color:rgba(255,255,255,.72);font-weight:500;margin-bottom:0;}
      .vp-hero-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px;}
      .vp-hero-chip{display:inline-flex;align-items:center;padding:5px 13px;border-radius:999px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);font-size:.72rem;font-weight:600;color:rgba(255,255,255,.88);}
      .vp-hero-map-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:999px;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);font-size:.72rem;font-weight:700;color:#fff;text-decoration:none;transition:all .22s;}
      .vp-hero-map-btn:hover{background:rgba(255,255,255,.32);transform:translateY(-1px);}
      /* open/closed badge */
      .vp-hero-top-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
      .vp-open-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;font-size:.65rem;font-weight:700;letter-spacing:.04em;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
      .vp-open-badge::before{content:'';width:7px;height:7px;border-radius:50%;flex-shrink:0;}
      .vp-open{background:rgba(34,197,94,.18);border:1px solid rgba(34,197,94,.35);color:#4ADE80;}
      .vp-open::before{background:#4ADE80;box-shadow:0 0 6px rgba(34,197,94,.6);}
      .vp-closed{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#F87171;}
      .vp-closed::before{background:#F87171;box-shadow:0 0 6px rgba(239,68,68,.5);}
      /* glass hours card */
      .vp-hero-card{background:rgba(255,255,255,.07);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1.5px solid rgba(255,255,255,.14);border-radius:20px;min-width:240px;max-width:280px;overflow:hidden;}
      .vp-hero-card-header{display:flex;align-items:center;gap:10px;padding:18px 22px 14px;border-bottom:1px solid rgba(255,255,255,.08);}
      .vp-hc-icon{width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;}
      .vp-hc-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.82rem;color:rgba(255,255,255,.85);letter-spacing:.01em;}
      .vp-hc-subtitle{font-size:.6rem;color:rgba(255,255,255,.4);margin-top:1px;}
      .vp-hero-card-body{padding:6px 0;}
      .vp-hero-card-row{display:flex;justify-content:space-between;align-items:center;padding:9px 22px;gap:12px;transition:background .2s;}
      .vp-hero-card-active{border-left:2px solid var(--vp-status-color,rgba(255,255,255,.4));padding-left:20px;}
      .vp-hero-card-active.vp-hca-open{--vp-status-color:rgba(74,222,128,.8);background:rgba(74,222,128,.06);}
      .vp-hero-card-active.vp-hca-closed{--vp-status-color:rgba(248,113,113,.8);background:rgba(248,113,113,.06);}
      .vp-hero-card-label{font-size:.73rem;font-weight:500;color:rgba(255,255,255,.45);}
      .vp-hero-card-active .vp-hero-card-label{color:rgba(255,255,255,.9);font-weight:700;}
      .vp-hero-card-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:.78rem;font-weight:700;color:rgba(255,255,255,.85);text-align:right;letter-spacing:.02em;}
      .vp-hero-card-active .vp-hero-card-val{color:#fff;}
      .vp-hcv-closed{color:rgba(248,113,113,.7) !important;font-weight:600 !important;}
      .vp-hero-card-dot{display:inline-block;width:5px;height:5px;border-radius:50%;margin-right:6px;vertical-align:middle;}
      .vp-hca-open .vp-hero-card-dot{background:rgba(74,222,128,.9);box-shadow:0 0 5px rgba(74,222,128,.5);}
      .vp-hca-closed .vp-hero-card-dot{background:rgba(248,113,113,.9);box-shadow:0 0 5px rgba(248,113,113,.5);}
      .vp-hero-card-footer{padding:10px 22px 14px;border-top:1px solid rgba(255,255,255,.08);text-align:center;}
      .vp-hero-card-footer span{font-size:.6rem;color:rgba(255,255,255,.3);font-style:italic;}
      @media(max-width:700px){
        .vp-hero{padding:0 20px;}
        .vp-hero-wrap{padding-top:76px;}
        .vp-hero-top{margin-bottom:18px;}
        .vp-hero-2col{grid-template-columns:1fr;gap:24px;}
        .vp-hero-card{max-width:100%;min-width:0;}
      }

      /* ── Info Bar ── */
      .vp-info-bar{background:#fff;box-shadow:0 2px 14px rgba(26,39,68,.08);position:relative;z-index:5;}
      .vp-info-inner{max-width:1100px;margin:0 auto;padding:20px 28px;display:flex;flex-wrap:wrap;gap:16px 0;}
      .vp-info-item{display:flex;align-items:center;gap:10px;padding-right:28px;margin-right:28px;border-right:1px solid rgba(26,39,68,.08);}
      .vp-info-item:last-child{border-right:none;padding-right:0;margin-right:0;}
      @media(max-width:640px){
        .vp-info-inner{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px 20px;}
        .vp-info-item{border-right:none;padding-right:0;margin-right:0;}
      }
      .vp-info-icon{font-size:1.1rem;flex-shrink:0;}
      .vp-info-label{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#A0AEC0;display:block;margin-bottom:2px;}
      .vp-info-text{font-size:.81rem;color:#4A5568;font-weight:500;}

      /* ── Body wrapper ── */
      .vp-body-wrap{background:#FAF7F2;}
      .vp-body-inner{max-width:1100px;margin:0 auto;padding:0 28px 40px;}
      .vp-section{padding:36px 0;border-bottom:1px solid rgba(26,39,68,.07);}
      .vp-section:last-child{border-bottom:none;padding-bottom:20px;}
      @media(max-width:768px){.vp-section{padding:28px 0;}.vp-body-inner{padding:0 20px 24px;}}
      .vp-section:last-child{border-bottom:none;}
      .vp-eyebrow{font-size:.62rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#C4521A;margin-bottom:8px;}
      .vp-stitle{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.35rem;color:#1A2744;margin:0 0 22px;}

      /* ── Description ── */
      .vp-desc{font-size:.94rem;line-height:1.9;color:#4A5568;}
      .vp-desc p+p{margin-top:14px;}

      /* ── Highlights ── */
      .vp-hl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
      @media(max-width:540px){.vp-hl-grid{grid-template-columns:1fr;}}
      .vp-hl-item{background:#fff;border-radius:15px;padding:16px 18px;display:flex;align-items:flex-start;gap:11px;box-shadow:0 2px 8px rgba(26,39,68,.06);}
      .vp-hl-icon{font-size:1.2rem;line-height:1;margin-top:1px;flex-shrink:0;}
      .vp-hl-text{font-size:.84rem;color:#1A2744;font-weight:500;line-height:1.5;}

      /* ── Hours table ── */
      .vp-hours-table{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(26,39,68,.06);}
      .vp-hours-row{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(26,39,68,.06);}
      .vp-hours-row:last-child{border-bottom:none;}
      .vp-hours-day{font-size:.85rem;color:#4A5568;font-weight:500;}
      .vp-hours-val{font-size:.85rem;font-weight:700;color:#1A2744;}
      .vp-hours-closed{color:#A0AEC0 !important;}

      /* ── Contact grid ── */
      .vp-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
      .vp-contact-grid-1col{grid-template-columns:1fr;}
      @media(max-width:600px){.vp-contact-grid{grid-template-columns:1fr;}}
      .vp-rezv-header{display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid rgba(26,39,68,.08);}
      .vp-rezv-header-icon{font-size:1.5rem;flex-shrink:0;}
      .vp-rezv-header-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:#1A2744;margin:0 0 3px;}
      .vp-rezv-header-sub{font-size:.78rem;color:#718096;margin:0;line-height:1.5;}
      .vp-contact-card{background:#fff;border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 2px 10px rgba(26,39,68,.06);}
      .vp-contact-icon{font-size:1.5rem;flex-shrink:0;}
      .vp-contact-label{font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#A0AEC0;margin-bottom:3px;}
      .vp-contact-val{font-size:.88rem;font-weight:600;color:#1A2744;}
      .vp-contact-btn-outline{margin-left:auto;display:inline-flex;align-items:center;padding:8px 16px;border-radius:10px;border:1.5px solid rgba(26,39,68,.15);font-size:.78rem;font-weight:700;color:#1A2744;text-decoration:none;white-space:nowrap;transition:all .2s;flex-shrink:0;}
      .vp-contact-btn-outline:hover{background:#1A2744;color:#fff;}
      .vp-wa-btn{margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:#25D366;color:#fff;font-size:.78rem;font-weight:700;text-decoration:none;white-space:nowrap;transition:all .2s;flex-shrink:0;}
      .vp-wa-btn:hover{background:#1CB85A;transform:translateY(-1px);}

      /* ── Gallery ── */
      .vp-gallery{display:grid;gap:8px;border-radius:18px;overflow:hidden;}
      .vp-gallery[data-count="1"]{grid-template-columns:1fr;grid-template-rows:320px;}
      .vp-gallery[data-count="2"]{grid-template-columns:1fr 1fr;grid-template-rows:280px;}
      .vp-gallery[data-count="3"]{grid-template-columns:2fr 1fr;grid-template-rows:200px 200px;}
      .vp-gallery[data-count="3"] .vp-gimg:first-child{grid-row:1/3;}
      .vp-gallery[data-count="4"]{grid-template-columns:1fr 1fr;grid-template-rows:200px 200px;}
      .vp-gallery[data-count="5"]{grid-template-columns:2fr 1fr 1fr;grid-template-rows:200px 160px;}
      .vp-gallery[data-count="5"] .vp-gimg:first-child{grid-row:1/3;}
      .vp-gallery[data-count="6"]{grid-template-columns:1fr 1fr 1fr;grid-template-rows:200px 200px;}
      .vp-gimg{position:relative;overflow:hidden;border-radius:4px;background:#1A2744;}
      .vp-gimg img{width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity .4s ease,transform .4s cubic-bezier(.16,1,.3,1);}
      .vp-gimg img.loaded{opacity:1;}
      .vp-gimg:hover img{transform:scale(1.05);}
      .vp-gimg-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.3) 0%,transparent 50%);pointer-events:none;}
      .vp-gimg-empty{display:flex;align-items:center;justify-content:center;font-size:2.5rem;opacity:.25;}
      @media(max-width:640px){
        .vp-gallery[data-count="2"]{grid-template-rows:200px;}
        .vp-gallery[data-count="3"]{grid-template-columns:1fr;grid-template-rows:220px 160px 160px;}
        .vp-gallery[data-count="3"] .vp-gimg:first-child{grid-row:auto;}
        .vp-gallery[data-count="4"]{grid-template-rows:180px 180px;}
        .vp-gallery[data-count="5"]{grid-template-columns:1fr 1fr;grid-template-rows:200px 160px 160px;}
        .vp-gallery[data-count="5"] .vp-gimg:first-child{grid-row:auto;grid-column:1/3;}
        .vp-gallery[data-count="6"]{grid-template-columns:1fr 1fr;grid-template-rows:180px 180px 180px;}
      }

      /* ── Tags ── */
      .vp-tags{display:flex;flex-wrap:wrap;gap:8px;}
      .vp-tag{font-size:.76rem;font-weight:600;padding:7px 16px;border-radius:999px;background:rgba(26,39,68,.06);color:#4A5568;cursor:pointer;transition:all .2s;}
      .vp-tag:hover{background:rgba(196,82,26,.1);color:#C4521A;transform:translateY(-1px);}

      /* ── Location ── */
      .vp-location-box{background:#fff;border-radius:20px;padding:24px 28px;box-shadow:0 2px 12px rgba(26,39,68,.07);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
      .vp-location-info{display:flex;align-items:center;gap:14px;}
      .vp-location-icon{width:46px;height:46px;border-radius:13px;background:rgba(26,39,68,.06);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;}
      .vp-location-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:#1A2744;margin-bottom:3px;}
      .vp-location-addr{font-size:.78rem;color:#A0AEC0;}
      .vp-map-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:13px;background:#1A2744;color:#fff;font-size:.82rem;font-weight:700;text-decoration:none;transition:background .22s;white-space:nowrap;font-family:inherit;}
      .vp-map-btn:hover{background:#2A3A5A;}

      /* ── Lightbox ── */
      .vp-lightbox{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all .3s ease;cursor:zoom-out;}
      .vp-lightbox.open{opacity:1;visibility:visible;}
      .vp-lightbox img{max-width:92vw;max-height:88vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);transform:scale(.92);transition:transform .3s ease;}
      .vp-lightbox.open img{transform:scale(1);}
      .vp-lb-close{position:absolute;top:20px;right:24px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.12);border:none;color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;backdrop-filter:blur(10px);}
      .vp-lb-close:hover{background:rgba(255,255,255,.25);}
      .vp-lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;backdrop-filter:blur(10px);}
      .vp-lb-nav:hover{background:rgba(255,255,255,.22);}
      .vp-lb-prev{left:16px;}
      .vp-lb-next{right:16px;}
      .vp-lb-counter{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.5);font-size:.78rem;font-weight:600;}

      /* ── Sticky Action Bar ── */
      .vp-sticky{position:fixed;bottom:-80px;left:0;right:0;z-index:100;transition:bottom .4s cubic-bezier(.16,1,.3,1);}
      .vp-sticky.show{bottom:0;}
      .vp-sticky-glass{margin:0 12px 12px;padding:12px 16px;background:rgba(13,24,41,.55);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:16px;border:1px solid rgba(245,237,224,.12);box-shadow:0 8px 32px rgba(0,0,0,.2);}
      .vp-sticky-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;}
      .vp-sticky-info{display:flex;align-items:center;gap:9px;min-width:0;}
      .vp-sticky-emoji{font-size:1.1rem;flex-shrink:0;}
      .vp-sticky-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.82rem;color:rgba(245,237,224,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .vp-sticky-acts{display:flex;gap:6px;flex-shrink:0;}
      .vp-sticky-btn{display:inline-flex;align-items:center;gap:5px;padding:9px 14px;border-radius:10px;font-size:.75rem;font-weight:700;text-decoration:none;white-space:nowrap;transition:all .15s;border:none;cursor:pointer;font-family:inherit;}
      .vp-sticky-btn:hover{transform:translateY(-1px);}
      .vp-sticky-call{background:rgba(245,237,224,.12);color:rgba(245,237,224,.9);border:1px solid rgba(245,237,224,.15);}
      .vp-sticky-call:hover{background:rgba(245,237,224,.18);}
      .vp-sticky-wa{background:#25D366;color:#fff;box-shadow:0 2px 10px rgba(37,211,102,.25);}
      .vp-sticky-wa:hover{background:#1CB85A;}
      .vp-sticky-map{background:rgba(245,237,224,.1);color:rgba(245,237,224,.85);border:1px solid rgba(245,237,224,.12);}
      .vp-sticky-map:hover{background:rgba(245,237,224,.16);}
      @media(max-width:640px){
        .vp-sticky-glass{margin:0 8px 8px;padding:10px 12px;}
        .vp-sticky-btn{padding:8px 10px;font-size:.7rem;}
        .vp-sticky-name{font-size:.76rem;max-width:90px;}
      }
      @media(max-width:480px){.vp-sticky-name{max-width:120px;}.vp-sticky-btn{padding:8px 12px;font-size:.72rem;}}

      /* ── Instagram card ── */
      .vp-ig-card{background:linear-gradient(135deg,#fafafa,#fff);border-radius:18px;padding:22px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 2px 12px rgba(26,39,68,.06);border:1px solid rgba(26,39,68,.06);}
      .vp-ig-left{display:flex;align-items:center;gap:14px;}
      .vp-ig-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FFDC80,#F56040,#833AB4);display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:10px;}
      .vp-ig-icon svg{width:28px;height:28px;}
      .vp-ig-handle{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;color:#1A2744;}
      .vp-ig-sub{font-size:.72rem;color:#A0AEC0;margin-top:2px;}
      .vp-ig-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:12px;background:linear-gradient(135deg,#F56040,#833AB4);color:#fff;font-size:.82rem;font-weight:700;text-decoration:none;white-space:nowrap;transition:all .2s;flex-shrink:0;font-family:inherit;}
      .vp-ig-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(131,58,180,.25);}
      @media(max-width:480px){.vp-ig-card{flex-direction:column;align-items:flex-start;gap:14px;}.vp-ig-btn{width:100%;justify-content:center;}}

      /* ── Gallery cursor ── */
      .vp-gimg{cursor:pointer;}

      /* ── Reservation form ── */
      .vp-rezv-box{background:#fff;border-radius:20px;padding:28px 32px;box-shadow:0 4px 20px rgba(26,39,68,.06);}
      .vp-rezv-form{display:flex;flex-direction:column;gap:16px;}
      .vp-rezv-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
      @media(max-width:540px){.vp-rezv-row{grid-template-columns:1fr;}.vp-rezv-box{padding:22px 20px;}}
      .vp-rezv-field{display:flex;flex-direction:column;gap:6px;}
      .vp-rezv-label{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#718096;}
      .vp-rezv-input{border:1.5px solid rgba(26,39,68,.12);border-radius:10px;padding:10px 14px;font-size:16px;color:#1A2744;background:#FAFAFA;outline:none;transition:border-color .2s;font-family:inherit;}
      .vp-rezv-input:focus{border-color:#C4521A;background:#fff;}
      .vp-rezv-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:#25D366;color:#fff;border:none;border-radius:13px;padding:14px 28px;font-size:.92rem;font-weight:700;cursor:pointer;transition:all .22s;font-family:inherit;}
      .vp-rezv-btn:hover{background:#1CB85A;transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,211,102,.3);}
      .vp-rezv-note{font-size:.73rem;color:#A0AEC0;text-align:center;line-height:1.5;}

      /* ── Similar venues ── */
      .vp-sim-track{display:flex;gap:15px;overflow-x:auto;padding:4px 2px 14px;scrollbar-width:thin;scrollbar-color:rgba(26,39,68,.15) transparent;}
      .vp-sim-track::-webkit-scrollbar{height:3px;}
      .vp-sim-track::-webkit-scrollbar-thumb{background:rgba(26,39,68,.15);border-radius:4px;}
      .vp-sim-card{flex:0 0 216px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 2px 10px rgba(26,39,68,.08);cursor:pointer;transition:transform .28s cubic-bezier(.34,1.2,.64,1),box-shadow .28s;text-decoration:none;}
      .vp-sim-card:hover{transform:translateY(-5px);box-shadow:0 16px 42px rgba(26,39,68,.15);}
      .vp-sim-img{height:112px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
      .vp-sim-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.25) 100%);}
      .vp-sim-emoji{font-size:2.1rem;filter:drop-shadow(0 3px 8px rgba(0,0,0,.32));position:relative;z-index:1;}
      .vp-sim-body{padding:12px 14px 14px;}
      .vp-sim-cat{font-size:.54rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:2px 7px;border-radius:999px;margin-bottom:5px;display:inline-block;}
      .vp-sim-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:#1A2744;margin:0 0 3px;line-height:1.3;}
      .vp-sim-loc{font-size:.69rem;color:#A0AEC0;}

      /* ── Related routes ── */
      .vp-route-list{display:flex;flex-direction:column;gap:11px;}
      .vp-route-item{background:#fff;border-radius:16px;padding:17px 20px;display:flex;align-items:center;gap:15px;cursor:pointer;transition:all .22s;box-shadow:0 2px 8px rgba(26,39,68,.06);text-decoration:none;}
      .vp-route-item:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(26,39,68,.12);}
      .vp-route-badge{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;}
      .vp-route-info{flex:1;min-width:0;}
      .vp-route-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.9rem;color:#1A2744;margin-bottom:3px;}
      .vp-route-desc{font-size:.74rem;color:#718096;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .vp-route-arrow{color:#C4521A;font-size:1rem;flex-shrink:0;}

      /* ── Visit note ── */
      .vp-note{background:rgba(196,82,26,.05);border:1.5px solid rgba(196,82,26,.12);border-radius:16px;padding:18px 22px;display:flex;align-items:flex-start;gap:14px;}
      .vp-note-icon{font-size:1.3rem;flex-shrink:0;margin-top:1px;}
      .vp-note-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.84rem;color:#1A2744;margin-bottom:5px;}
      .vp-note-text{font-size:.8rem;color:#4A5568;line-height:1.65;}

      /* ── Share Button ── */
      .vp-share-wrap{position:relative;display:inline-block;}
      .vp-share-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;white-space:nowrap;}
      .vp-share-btn:hover{background:rgba(255,255,255,.28);}
      .vp-share-dd{position:absolute;top:calc(100% + 8px);right:0;min-width:180px;background:rgba(255,255,255,.12);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:6px;opacity:0;visibility:hidden;transform:translateY(-4px);transition:all .2s;z-index:20;}
      .vp-share-dd.open{opacity:1;visibility:visible;transform:translateY(0);}
      .vp-share-opt{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;border:none;background:none;cursor:pointer;transition:background .15s;text-decoration:none;font-family:inherit;font-size:.78rem;font-weight:600;color:#fff;width:100%;text-align:left;white-space:nowrap;}
      .vp-share-opt:hover{background:rgba(255,255,255,.12);}
      .vp-share-opt-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
      .vp-rooms-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
      .vp-room-card{background:#fff;border:1px solid rgba(26,39,68,.06);border-radius:16px;overflow:hidden;transition:all .3s cubic-bezier(.16,1,.3,1);}
      .vp-room-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(26,39,68,.1);}
      .vp-room-img{aspect-ratio:3/2;overflow:hidden;background:linear-gradient(160deg,#1A2744,#2A3A5A);position:relative;}
      .vp-room-img img{width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease;}
      .vp-room-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.2rem;}
      .vp-room-info{padding:14px 16px 16px;}
      .vp-room-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;color:#1A2744;margin-bottom:4px;}
      .vp-room-view{font-size:.68rem;font-weight:600;color:#1A6B8A;margin-bottom:6px;}
      .vp-room-details{font-size:.72rem;color:#718096;font-weight:500;}
      @media(min-width:900px){.vp-rooms-grid{grid-template-columns:repeat(3,1fr);}}
      @media(max-width:480px){.vp-rooms-grid{gap:10px;}.vp-room-info{padding:10px 12px 12px;}.vp-room-name{font-size:.82rem;}.vp-room-view{font-size:.62rem;margin-bottom:4px;}.vp-room-details{font-size:.65rem;}}
    `;
    document.head.appendChild(s);
  }

  /* ── Hero ── */
  document.getElementById('vp-hero').innerHTML = `
    <div class="vp-hero">
      <div class="vp-hero-bg" style="background:${G};"></div>
      ${v.images && v.images.length > 0 ? '<img src="' + v.images[0] + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:0;transition:opacity .7s ease;" onload="this.style.opacity=\'0.25\'">' : ''}
      <div class="vp-topo"></div>
      <div class="vp-vignette"></div>
      <div class="vp-text-overlay"></div>

      <div class="vp-hero-wrap">
      <div class="vp-hero-top">
        <a href="${base}mekanlar.html" class="vp-back-btn">← Mekanlar</a>
        <div class="vp-hero-acts">
          <button id="vp-save-btn" class="vp-act-btn${isSaved?' saved':''}" onclick="vpToggleSave()">
            <span id="vp-save-icon">${isSaved?'♥':'♡'}</span>
            <span id="vp-save-label">${isSaved?'Kaydedildi':'Kaydet'}</span>
          </button>
          <div class="vp-share-wrap" id="vp-share-wrap">
            <button class="vp-share-btn" onclick="vpToggleShare()">↑ Paylaş</button>
            <div class="vp-share-dd" id="vp-share-dd"></div>
          </div>
        </div>
      </div>

      <div class="vp-hero-2col">
        <div class="vp-hero-left">
          <span class="vp-hero-cat-pill" style="background:${cs.bg};color:${cs.color};">${cs.label}</span>
          <h1 class="vp-hero-title">${v.title}${isPremiumActive(v) ? ' <span style="font-size:.3em;font-weight:800;letter-spacing:.06em;margin-left:6px;padding:3px 8px;border-radius:3px;background:linear-gradient(135deg,#C9963A,#E8C46A);color:#5C3D0E;vertical-align:middle;text-transform:uppercase;">Premium İşletme</span>' : ''}</h1>
          <div class="vp-hero-loc" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span>📍</span>
            <span style="font-size:.68rem;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(245,237,224,.1);color:rgba(245,237,224,.65);border:1px solid rgba(245,237,224,.12);">${(function(){var vl=(DATA.villages||[]).find(function(x){return x.title===v.location;});if(vl&&vl.type==='mahalle'){var pn=vl.parent==='kucukkuyu'?'Küçükkuyu':'Ayvacık';var tl=vl.title.toLowerCase();return tl.includes('mahalle')?pn+' '+vl.title:pn+' '+vl.title+' Mahallesi';}return v.location;})()}</span>
            ${v.address ? '<span style="font-size:.82rem;color:rgba(255,255,255,.55);">' + v.address + '</span>' : ''}
          </div>
          <div class="vp-hero-chips">
            ${openBadge}
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="vp-hero-map-btn">🗺 Yol Tarifi Al</a>
            ${v.website ? '<a href="' + v.website + '" target="_blank" rel="noopener noreferrer" class="vp-hero-map-btn">🌐 Web Sitesi</a>' : ''}
          </div>
        </div>
        <div class="vp-hero-right">
          <div class="vp-hero-card" ${isSeasonClosed ? 'style="background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;border-color:rgba(255,255,255,.06);"' : ''}>
            ${isSeasonClosed ? '' : '<div class="vp-hero-card-header"><div class="vp-hc-icon">' + (v.category === 'konaklama' ? '🏨' : '🕐') + '</div><div><div class="vp-hc-title">' + (v.category === 'konaklama' ? 'Giriş / Çıkış' : 'Çalışma Saatleri') + '</div><div class="vp-hc-subtitle">' + (v.category === 'konaklama' ? 'Resepsiyon 24 saat' : 'Bugün: ' + todayName + ' · Saat: ' + new Date().getHours().toString().padStart(2,'0') + ':' + new Date().getMinutes().toString().padStart(2,'0')) + '</div></div></div>'}
            <div class="${isSeasonClosed ? '' : 'vp-hero-card-body'}">
            ${isSeasonClosed ? (() => {
              var now = new Date();
              var openDate;
              if (v.seasonStart && typeof v.seasonStart === 'string') {
                openDate = new Date(v.seasonStart);
                openDate.setFullYear(now.getFullYear());
                if (openDate <= now) openDate.setFullYear(now.getFullYear() + 1);
              } else {
                var sMonth = (typeof v.seasonStart === 'number' ? v.seasonStart : 4) - 1;
                openDate = new Date(now.getFullYear(), sMonth, 1);
                if (openDate <= now) openDate = new Date(now.getFullYear() + 1, sMonth, 1);
              }
              var diff = openDate - now;
              var totalDays = Math.max(1, Math.ceil(diff / 86400000));
              var months = Math.floor(totalDays / 30);
              var remDays = totalDays % 30;
              if (months === 0 && remDays === 0) remDays = 1;
              var openStr = openDate.toLocaleDateString('tr-TR', {day:'numeric', month:'long'});
              return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 16px;text-align:center;">' +
                '<div style="font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,237,224,.2);margin-bottom:16px;">Sezon açılışına</div>' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  (months > 0 ? '<div style="position:relative;overflow:hidden;border-radius:14px;min-width:68px;"><div style="background:rgba(232,160,122,.15);padding:6px;text-align:center;"><span style="font-size:.5rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,160,122,.8);">Ay</span></div><div style="background:rgba(255,255,255,.04);padding:10px 14px;text-align:center;"><span style="font-size:2rem;font-weight:800;color:#E8A07A;line-height:1;">' + months + '</span></div></div>' : '') +
                  '<div style="position:relative;overflow:hidden;border-radius:14px;min-width:68px;"><div style="background:rgba(232,160,122,.15);padding:6px;text-align:center;"><span style="font-size:.5rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,160,122,.8);">Gün</span></div><div style="background:rgba(255,255,255,.04);padding:10px 14px;text-align:center;"><span style="font-size:2rem;font-weight:800;color:#E8A07A;line-height:1;">' + (months > 0 ? remDays : totalDays) + '</span></div></div>' +
                '</div>' +
                '<div style="font-size:.65rem;color:rgba(245,237,224,.25);margin-top:16px;">' + openStr + ' tarihinde açılacak</div>' +
              '</div>';
            })()
            : v.category === 'konaklama' ?
              '<div class="vp-hero-card-row"><span class="vp-hero-card-label">🔑 Check-in</span><span class="vp-hero-card-val">' + (v.checkin || '14:00') + '</span></div>' +
              '<div class="vp-hero-card-row"><span class="vp-hero-card-label">🚪 Check-out</span><span class="vp-hero-card-val">' + (v.checkout || '11:00') + '</span></div>'
            :
            (() => {
              const DAY_ORDER = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
              const DAY_ALIASES = {'pazartesi':0,'sali':1,'salı':1,'carsamba':2,'çarşamba':2,'persembe':3,'perşembe':3,'cuma':4,'cumartesi':5,'pazar':6};
              const entries = (v.weeklyHours || []).filter(e => e.days);
              var dayMap = {};
              entries.forEach(entry => {
                var d = fixTR(entry.days || '').toLowerCase();
                var h = fixTR(entry.hours || '');
                if (d.includes('her gün')) { for(var i=0;i<7;i++) if(!dayMap[i]) dayMap[i]=h; return; }
                var rangeMatch = d.match(/(\S+)\s*[–\-]\s*(\S+)/);
                if (rangeMatch) {
                  var s = DAY_ALIASES[rangeMatch[1].toLowerCase()];
                  var e = DAY_ALIASES[rangeMatch[2].toLowerCase()];
                  if (s !== undefined && e !== undefined) {
                    if (s <= e) { for(var i=s;i<=e;i++) if(!dayMap[i]) dayMap[i]=h; }
                    else { for(var i=s;i<7;i++) if(!dayMap[i]) dayMap[i]=h; for(var i=0;i<=e;i++) if(!dayMap[i]) dayMap[i]=h; }
                    return;
                  }
                }
                Object.keys(DAY_ALIASES).forEach(alias => {
                  if (d.includes(alias)) { var idx = DAY_ALIASES[alias]; if(!dayMap[idx]) dayMap[idx]=h; }
                });
              });
              var groups = [];
              var i = 0;
              while (i < 7) {
                if (dayMap[i] === undefined) { i++; continue; }
                var start = i;
                var hours = dayMap[i];
                while (i < 7 && dayMap[i] === hours) i++;
                var end = i - 1;
                var label = start === end ? DAY_ORDER[start] : DAY_ORDER[start] + ' – ' + DAY_ORDER[end];
                groups.push({ label: label, hours: hours, startIdx: start, endIdx: end });
              }
              var todayDayIdx = DAY_ORDER.findIndex(x => x.toLowerCase() === todayName.toLowerCase());
              return groups.map(g => {
                var isClosed = g.hours.toLowerCase().includes('kapal');
                var isToday = todayDayIdx >= g.startIdx && todayDayIdx <= g.endIdx;
                var statusCls = isToday ? (isClosed ? ' vp-hca-closed' : (isNowOpen ? ' vp-hca-open' : ' vp-hca-closed')) : '';
                return '<div class="vp-hero-card-row' + (isToday ? ' vp-hero-card-active' + statusCls : '') + '">' +
                    '<span class="vp-hero-card-label">' + (isToday ? '<span class="vp-hero-card-dot"></span>' : '') + g.label + '</span>' +
                    '<span class="vp-hero-card-val' + (isClosed ? ' vp-hcv-closed' : '') + '">' + g.hours + '</span>' +
                  '</div>';
              }).join('');
            })()}
            </div>
            ${isSeasonClosed ? '' : '<div class="vp-hero-card-footer"><span>' + (v.category === 'konaklama' ? 'Erken giriş/geç çıkış için iletişime geçin' : 'Saatler mevsime göre değişebilir') + '</span></div>'}
          </div>
        </div>
      </div>
      </div>
    </div>
  `;

  /* ── Body ── */
  const galleryTile = (bg, overlay, content) =>
    `<div class="vp-tile" style="background:${bg};">
      <div class="vp-tile-overlay" style="background:${overlay};"></div>
      ${content}
    </div>`;

  /* ── Weekly hours rows ── */
  const hoursRows = (() => {
    const rows = v.weeklyHours || [];
    if (rows.length === 0) {
      return v.hours ? `<div class="vp-hours-row"><span class="vp-hours-day">Her Gün</span><span class="vp-hours-val">${v.hours}</span></div>` : '';
    }
    return rows.filter(entry => entry.days).map(entry =>
      `<div class="vp-hours-row">
        <span class="vp-hours-day">${fixTR(entry.days)}</span>
        <span class="vp-hours-val ${(entry.hours || '').toLowerCase().includes('kapal') ? 'vp-hours-closed' : ''}">${fixTR(entry.hours) || ''}</span>
      </div>`
    ).join('');
  })();

  // Track venue page view
  if (window.trackPageView) trackPageView('venue_' + v.id);

  document.getElementById('vp-body').innerHTML = `
    <!-- Content -->
    <div class="vp-body-wrap">
      <div class="vp-body-inner">

        <!-- Description + Tags -->
        <div class="vp-section fade-up">
          <div class="vp-eyebrow">Hakkında</div>
          <div class="vp-desc"><p>${(v.description || v.shortDesc).replace(/\. ([A-ZÇŞĞÜÖİ])/g, '.</p><p>$1')}</p></div>
          ${(v.tags||[]).length > 0 ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:16px">' + v.tags.map(t => '<span style="font-size:.72rem;font-weight:600;padding:4px 12px;border-radius:999px;background:rgba(26,39,68,.05);color:#4A5870;">' + t + '</span>').join('') + '</div>' : ''}
        </div>

        <!-- Highlights -->
        <div class="vp-section fade-up">
          <div class="vp-eyebrow">Öne Çıkanlar</div>
          <h2 class="vp-stitle">Neden Buraya Gitmelisin?</h2>
          <div class="vp-hl-grid">
            ${highlights.map(h => {
              const parts = h.split(' ');
              const icon  = parts[0];
              const text  = parts.slice(1).join(' ');
              return `<div class="vp-hl-item"><span class="vp-hl-icon">${icon}</span><span class="vp-hl-text">${text}</span></div>`;
            }).join('')}
          </div>
        </div>

        ${isPremiumActive(v) && v.rooms && v.rooms.length > 0 ? '<div class="vp-section fade-up"><div class="vp-eyebrow">Konaklama</div><h2 class="vp-stitle">Oda Tipleri</h2>' + '<div class="vp-rooms-grid">' + v.rooms.map(function(r) { var viewIcons = {"Deniz Manzaralı":"🌊","Kara Manzaralı":"🏔","Bahçe Manzaralı":"🌿","Havuz Manzaralı":"🏊","Deniz & Kara Manzaralı":"🌊🏔","Deniz Manzarası":"🌊","Kara Manzarası":"🏔","Bahçe Manzarası":"🌿","Havuz Manzarası":"🏊","Deniz & Kara Manzarası":"🌊🏔"}; function fixViewText(t) { return t ? t.split('Manzarası').join('Manzaralı') : ''; } var details = [r.capacity ? r.capacity + ' Kişi' : '', r.bed || '', r.size ? r.size + ' m²' : ''].filter(Boolean).join(' · '); var viewText = r.view ? fixViewText(r.view) : ''; return '<div class="vp-room-card">' + '<div class="vp-room-img">' + (r.image ? '<img src="' + r.image + '" alt="' + r.name + '" loading="lazy" onload="this.style.opacity=1">' : '<span class="vp-room-emoji">🛏</span>') + '</div>' + '<div class="vp-room-info">' + (viewText ? '<div class="vp-room-view">' + (viewIcons[r.view] || '🏞') + ' ' + viewText + '</div>' : '') + '<div class="vp-room-name">' + r.name + '</div>' + '<div class="vp-room-details">' + details + '</div>' + '</div></div>'; }).join('') + '</div></div>' : ''}

        ${isPremiumActive(v) && v.facilities && v.facilities.length > 0 ? '<div class="vp-section fade-up"><div class="vp-eyebrow">Olanaklar</div><h2 class="vp-stitle">Tesis Olanakları</h2><div style="display:flex;flex-wrap:wrap;gap:8px;">' + v.facilities.map(function(f) { var icons = {"Havuz":"🏊","Otopark":"🅿️","WiFi":"📶","Kahvaltı Dahil":"☕","Restoran":"🍽","Spa":"💆","Klima":"❄️","Deniz Manzarası":"🌊","Bahçe":"🌿","Barbekü":"🔥","Bisiklet":"🚲","Evcil Hayvan":"🐾"}; return '<span style="display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:10px;background:rgba(26,39,68,.04);font-size:.78rem;font-weight:600;color:#4A5870;">' + (icons[f] || '✓') + ' ' + f + '</span>'; }).join('') + '</div></div>' : ''}

        <!-- İletişim -->
        <div class="vp-section fade-up">
          <div class="vp-eyebrow">İletişim</div>
          <h2 class="vp-stitle">Ulaşın</h2>
          <div class="vp-contact-grid${v.category === 'konaklama' ? ' vp-contact-grid-1col' : ''}">
            <div class="vp-contact-card">
              <div class="vp-contact-icon">📞</div>
              <div>
                <div class="vp-contact-label">Telefon</div>
                <div class="vp-contact-val">${v.phone || '—'}</div>
              </div>
              ${v.phone ? `<a href="tel:${v.phone.replace(/\s/g,'')}" class="vp-contact-btn-outline" onclick="event.preventDefault();if(window.trackAction)trackAction('${escAttr(v.id)}','call');setTimeout(()=>{window.location.href=this.href},300)">Ara</a>` : ''}
            </div>
            ${v.category !== 'konaklama' ? `
            <div class="vp-contact-card vp-contact-wa">
              <div class="vp-contact-icon">💬</div>
              <div>
                <div class="vp-contact-label">WhatsApp</div>
                <div class="vp-contact-val">Mesaj Gönder</div>
              </div>
              <a href="${waContactUrl}" target="_blank" rel="noopener" class="vp-wa-btn" onclick="if(window.trackAction)trackAction('${escAttr(v.id)}','whatsapp');">WhatsApp ile Yaz</a>
            </div>` : ''}
          </div>
          ${v.category === 'konaklama' ? `
          <div class="vp-rezv-box" style="margin-top:20px;">
            <div class="vp-rezv-header">
              <span class="vp-rezv-header-icon">📋</span>
              <div>
                <h3 class="vp-rezv-header-title">Müsaitlik Durumu Sorgula</h3>
                <p class="vp-rezv-header-sub">Bilgileri doldurun, WhatsApp üzerinden anında öğrenin.</p>
              </div>
            </div>
            <div class="vp-rezv-form">
              <div class="vp-rezv-field">
                <label class="vp-rezv-label">Ad Soyad</label>
                <input type="text" id="rezv-name" class="vp-rezv-input" placeholder="Adınız ve soyadınız">
              </div>
              <div class="vp-rezv-row">
                <div class="vp-rezv-field">
                  <label class="vp-rezv-label">Giriş Tarihi</label>
                  <input type="date" id="rezv-checkin" class="vp-rezv-input" onchange="vpUpdateCheckoutMin()">
                </div>
                <div class="vp-rezv-field">
                  <label class="vp-rezv-label">Çıkış Tarihi</label>
                  <input type="date" id="rezv-checkout" class="vp-rezv-input" onchange="vpValidateCheckout()">
                </div>
              </div>
              <div id="rezv-date-error" style="font-size:.75rem;color:#E53E3E;min-height:18px;margin-top:-4px"></div>
              <div id="rezv-summary" style="display:none;justify-content:center;align-items:center;gap:6px;margin-bottom:10px;font-size:.78rem;color:var(--text-mid,#4A5870)">
                <span style="font-weight:600">Toplam:</span>
                <span id="rezv-summary-nights" style="display:inline-flex;align-items:center;gap:3px;font-weight:700;color:#1A2744">🌙 <span id="rezv-n"></span></span>
                <span style="color:rgba(0,0,0,.2)">|</span>
                <span id="rezv-summary-days" style="display:inline-flex;align-items:center;gap:3px;font-weight:700;color:#C4521A">☀️ <span id="rezv-d"></span></span>
              </div>
              <div class="vp-rezv-field">
                <label class="vp-rezv-label">Kişi Sayısı</label>
                <select id="rezv-guests" class="vp-rezv-input">
                  ${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}">${n} kişi</option>`).join('')}
                </select>
              </div>
              <button onclick="vpSendRezervasyon()" class="vp-rezv-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.855L0 24l6.335-1.52C8.034 23.46 9.98 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.584-.479-5.104-1.32l-.369-.21-3.76.902.948-3.668-.223-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                WhatsApp ile Müsaitlik Sorgula
              </button>
              <p class="vp-rezv-note">Assos'u Keşfet üzerinden gönderilen talebiniz WhatsApp mesajı olarak iletilecektir.</p>
            </div>
          </div>` : ''}
        </div>

        <!-- Gallery -->
        ${(() => {
          const imgs = v.images || [];
          if (imgs.length === 0) return '';
          const count = Math.min(imgs.length, 6);
          const tiles = imgs.slice(0, count).map(src =>
            '<div class="vp-gimg"><img src="' + (src.startsWith('http') ? src : base + src) + '" alt="' + v.title + '" loading="lazy" onload="this.classList.add(\'loaded\')"><div class="vp-gimg-overlay"></div></div>'
          ).join('');
          return '<div class="vp-section fade-up">' +
            '<div class="vp-eyebrow">Atmosfer</div>' +
            '<h2 class="vp-stitle">Mekandan Kareler</h2>' +
            '<div class="vp-gallery" data-count="' + count + '">' + tiles + '</div>' +
          '</div>';
        })()}

        <!-- Instagram -->
        ${(() => {
          if (!v.instagram) return '';
          const igHandle = v.instagram.replace(/^@/,'').replace(/^https?:\/\/(www\.)?instagram\.com\//,'').replace(/\/$/,'');
          const igUrl = 'https://www.instagram.com/' + igHandle + '/';
          return '<div class="vp-section fade-up">' +
            '<div class="vp-eyebrow">Sosyal Medya</div>' +
            '<div class="vp-ig-card">' +
              '<div class="vp-ig-left">' +
                '<div class="vp-ig-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></div>' +
                '<div>' +
                  '<div class="vp-ig-handle">@' + igHandle + '</div>' +
                  '<div class="vp-ig-sub">Instagram\'da takip edin</div>' +
                '</div>' +
              '</div>' +
              '<a href="' + igUrl + '" target="_blank" rel="noopener" class="vp-ig-btn">Takip Et</a>' +
            '</div>' +
          '</div>';
        })()}

        <!-- Komşu Mekanlar (aynı konum) -->
        ${(() => {
          const neighbors = DATA.venues.filter(x => x.id !== v.id && x.location && v.location && x.location.toLowerCase() === v.location.toLowerCase()).slice(0, 4);
          if (neighbors.length === 0) return '';
          return '<div class="vp-section fade-up">' +
            '<div class="vp-eyebrow">Komşu Mekanlar</div>' +
            '<h2 class="vp-stitle">' + v.location + bulunmaEki(v.location) + ' Ayrıca</h2>' +
            '<div class="vp-sim-track">' +
            neighbors.map(s => {
              const sm = VMETA[s.id] || { g:'linear-gradient(160deg,#1A2744,#2A3A5A)' };
              const scs = CAT_STYLE[s.category] || { bg:'rgba(26,39,68,.08)', color:'#4A5568', label:s.category };
              const nHasImg = s.images && s.images.length > 0;
              return '<a class="vp-sim-card" href="' + base + 'mekanlar/mekan-detay.html?id=' + s.id + '">' +
                '<div class="vp-sim-img" style="background:' + sm.g + ';">' +
                  (nHasImg ? '<img src="' + s.images[0] + '" alt="' + s.title + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s;" onload="this.style.opacity=\'1\'">' : '<span class="vp-sim-emoji">' + s.emoji + '</span>') +
                '</div>' +
                '<div class="vp-sim-body">' +
                  '<span class="vp-sim-cat" style="background:' + scs.bg + ';color:' + scs.color + ';">' + scs.label + '</span>' +
                  '<div class="vp-sim-name">' + s.title + '</div>' +
                  '<div class="vp-sim-loc">📍 ' + s.location + '</div>' +
                '</div></a>';
            }).join('') +
            '</div></div>';
        })()}

        <!-- Similar venues (aynı kategori) -->
        ${similar.length > 0 ? `
        <div class="vp-section fade-up">
          <div class="vp-eyebrow">Benzer Mekanlar</div>
          <h2 class="vp-stitle">Bunları da Sevebilirsin</h2>
          <div class="vp-sim-track">
            ${similar.map(s => {
              const sm  = VMETA[s.id] || { g:'linear-gradient(160deg,#1A2744,#2A3A5A)' };
              const scs = CAT_STYLE[s.category] || { bg:'rgba(26,39,68,.08)', color:'#4A5568', label:s.category };
              const simHasImg = s.images && s.images.length > 0;
              return `<a class="vp-sim-card" href="${base}mekanlar/mekan-detay.html?id=${s.id}">
                <div class="vp-sim-img" style="background:${sm.g};">
                  ${simHasImg ? '<img src="' + s.images[0] + '" alt="' + s.title + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s;" onload="this.style.opacity=\'1\'">' : '<span class="vp-sim-emoji">' + s.emoji + '</span>'}
                </div>
                <div class="vp-sim-body">
                  <span class="vp-sim-cat" style="background:${scs.bg};color:${scs.color};">${scs.label}</span>
                  <div class="vp-sim-name">${s.title}</div>
                  <div class="vp-sim-loc">📍 ${s.location}</div>
                </div>
              </a>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- Related routes -->
        ${relatedRoutes.length > 0 ? `
        <div class="vp-section fade-up">
          <div class="vp-eyebrow">Rotalar</div>
          <h2 class="vp-stitle">Bu Mekan Şu Rotalarda Yer Alıyor</h2>
          <div class="vp-route-list">
            ${relatedRoutes.map(r=>`
              <a class="vp-route-item" href="${base}rotalar/rota-detay.html?id=${r.id}">
                <div class="vp-route-badge" style="background:${r.headerBg||'rgba(26,39,68,.06)'};">${r.emoji}</div>
                <div class="vp-route-info">
                  <div class="vp-route-name">${r.title}</div>
                  <div class="vp-route-desc">${r.shortDesc}</div>
                </div>
                <span class="vp-route-arrow">→</span>
              </a>`).join('')}
          </div>
        </div>` : ''}

        <!-- Visit note -->
        <div class="vp-section fade-up">
          <div class="vp-note">
            <span class="vp-note-icon">💡</span>
            <div>
              <div class="vp-note-title">Gitmeden önce bilin</div>
              <div class="vp-note-text">${v.category === 'konaklama' ? 'Rezervasyon için önceden iletişime geçmeniz önerilir. Check-in/check-out saatleri değişiklik gösterebilir. Erken giriş veya geç çıkış için mekana danışın. Ödeme yöntemlerini önceden sorun.' : v.category === 'restoran' || v.category === 'kahvalti' ? 'Çalışma saatleri mevsime göre değişebilir. Yoğun dönemlerde — özellikle Temmuz ve Ağustos — rezervasyon öneririz. Bazı mekanlarda kart geçmeyebilir, nakit bulundurun.' : v.category === 'beach' ? 'Deniz koşulları günden güne değişebilir. Şezlong ve şemsiye durumu için önceden arayın. Güneş kremi ve su getirmeniz önerilir. Koylar genellikle gölgesizdir.' : v.category === 'kafe' ? 'Çalışma saatleri mevsime göre değişebilir. Bazı mekanlarda kart geçmeyebilir. Yoğun saatlerde yer bulmak zorlaşabilir — erken gidin.' : 'Çalışma saatleri mevsime ve hava durumuna göre değişebilir. Her ziyaret öncesi sosyal medya hesaplarından güncel bilgiyi kontrol etmek iyi fikir.'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Lightbox -->
    <div class="vp-lightbox" id="vp-lightbox" onclick="vpCloseLightbox()">
      <button class="vp-lb-close" onclick="vpCloseLightbox()">✕</button>
      <button class="vp-lb-nav vp-lb-prev" onclick="event.stopPropagation();vpLbNav(-1)">‹</button>
      <img id="vp-lb-img" src="" alt="" onclick="event.stopPropagation()">
      <button class="vp-lb-nav vp-lb-next" onclick="event.stopPropagation();vpLbNav(1)">›</button>
      <div class="vp-lb-counter" id="vp-lb-counter"></div>
    </div>

    <!-- Sticky action bar -->
    <div class="vp-sticky" id="vp-sticky">
      <div class="vp-sticky-glass">
        <div class="vp-sticky-inner">
          <div class="vp-sticky-info">
            <span class="vp-sticky-emoji">${v.emoji}</span>
            <span class="vp-sticky-name">${v.title}</span>
          </div>
          <div class="vp-sticky-acts">
            ${v.phone ? '<a href="tel:' + v.phone.replace(/\\s/g,'') + '" class="vp-sticky-btn vp-sticky-call" onclick="event.preventDefault();if(window.trackAction)trackAction(\'' + escAttr(v.id) + '\',\'call\');setTimeout(()=>{window.location.href=this.href},300)">📞 Ara</a>' : ''}
            ${v.phone && v.category !== 'konaklama' ? '<a href="' + waContactUrl + '" target="_blank" rel="noopener" class="vp-sticky-btn vp-sticky-wa" onclick="if(window.trackAction)trackAction(\'' + escAttr(v.id) + '\',\'whatsapp\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" style="vertical-align:middle;margin-right:3px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.855L0 24l6.335-1.52C8.034 23.46 9.98 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.584-.479-5.104-1.32l-.369-.21-3.76.902.948-3.668-.223-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>WhatsApp</a>' : ''}
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="vp-sticky-btn vp-sticky-map" onclick="if(window.trackAction)trackAction('${escAttr(v.id)}','directions')">🗺 Yol Tarifi Al</a>
          </div>
        </div>
      </div>
    </div>

  `;

  /* ── Global event handlers ── */
  /* ── Lightbox ── */
  const lbImgs = (v.images || []).map(src => src.startsWith('http') ? src : base + src);
  let lbIdx = 0;
  window.vpOpenLightbox = function(idx) {
    lbIdx = idx;
    const lb = document.getElementById('vp-lightbox');
    document.getElementById('vp-lb-img').src = lbImgs[lbIdx];
    document.getElementById('vp-lb-counter').textContent = (lbIdx + 1) + ' / ' + lbImgs.length;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.vpCloseLightbox = function() {
    document.getElementById('vp-lightbox').classList.remove('open');
    document.body.style.overflow = '';
  };
  window.vpLbNav = function(dir) {
    lbIdx = (lbIdx + dir + lbImgs.length) % lbImgs.length;
    document.getElementById('vp-lb-img').src = lbImgs[lbIdx];
    document.getElementById('vp-lb-counter').textContent = (lbIdx + 1) + ' / ' + lbImgs.length;
  };
  // Galeri görsellerine tıklama
  document.querySelectorAll('.vp-gimg').forEach(function(el, i) {
    el.addEventListener('click', function() { vpOpenLightbox(i); });
  });
  // ESC ile kapat
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') vpCloseLightbox();
    if (e.key === 'ArrowRight') vpLbNav(1);
    if (e.key === 'ArrowLeft') vpLbNav(-1);
  });

  /* ── Sticky bar ── */
  (function() {
    const sticky = document.getElementById('vp-sticky');
    window.addEventListener('scroll', function() {
      if (window.scrollY > 500) sticky.classList.add('show');
      else sticky.classList.remove('show');
    }, { passive: true });
  })();

  window.vpToggleSave = function () {
    const saved = getSaved();
    if (!saved.has(v.id) && saved.size >= 20) { alert('En fazla 20 mekan kaydedebilirsiniz.'); return; }
    if (saved.has(v.id)) saved.delete(v.id); else saved.add(v.id);
    localStorage.setItem(SAVE_KEY, JSON.stringify([...saved]));
    const isSavedNow = saved.has(v.id);
    const btn = document.getElementById('vp-save-btn');
    if (btn) {
      document.getElementById('vp-save-icon').textContent  = isSavedNow ? '♥' : '♡';
      document.getElementById('vp-save-label').textContent = isSavedNow ? 'Kaydedildi' : 'Kaydet';
      btn.classList.toggle('saved', isSavedNow);
    }
    if (window.updateSaveNavCount) window.updateSaveNavCount();
    if (window.syncFavToFirebase) window.syncFavToFirebase();
  };

  /* ── Share dropdown ── */
  (function() {
    const url = window.location.origin + '/mekanlar/mekan-detay.html?id=' + v.id;
    const text = v.title + ' - Assos\'u Keşfet';
    const waText = v.title + ' - Assos\'u Keşfet\n' + v.location + '\n\n' + url;
    const dd = document.getElementById('vp-share-dd');
    if (!dd) return;
    dd.innerHTML =
      '<a href="https://wa.me/?text=' + encodeURIComponent(waText) + '" target="_blank" rel="noopener" class="vp-share-opt">' +
        '<span class="vp-share-opt-icon" style="background:#25D366"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.855L0 24l6.335-1.52C8.034 23.46 9.98 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.584-.479-5.104-1.32l-.369-.21-3.76.902.948-3.668-.223-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg></span>' +
        '<span>WhatsApp</span></a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '" target="_blank" rel="noopener" class="vp-share-opt">' +
        '<span class="vp-share-opt-icon" style="background:#1877F2"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></span>' +
        '<span>Facebook</span></a>' +
      '<a href="https://www.instagram.com/" target="_blank" rel="noopener" class="vp-share-opt">' +
        '<span class="vp-share-opt-icon" style="background:linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></span>' +
        '<span>Instagram</span></a>' +
      '<a href="https://x.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url) + '" target="_blank" rel="noopener" class="vp-share-opt">' +
        '<span class="vp-share-opt-icon" style="background:#000"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>' +
        '<span>X</span></a>' +
      '<button class="vp-share-opt" onclick="navigator.clipboard.writeText(\'' + url.replace(/'/g, "\\'") + '\').then(()=>{this.querySelector(\'span:last-child\').textContent=\'Kopyalandı!\';setTimeout(()=>this.querySelector(\'span:last-child\').textContent=\'Kopyala\',1500)})">' +
        '<span class="vp-share-opt-icon" style="background:rgba(255,255,255,.15)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></span>' +
        '<span>Kopyala</span></button>';
  })();

  window.vpToggleShare = function() {
    const dd = document.getElementById('vp-share-dd');
    dd.classList.toggle('open');
  };
  document.addEventListener('click', function(e) {
    const wrap = document.getElementById('vp-share-wrap');
    const dd = document.getElementById('vp-share-dd');
    if (wrap && dd && !wrap.contains(e.target)) dd.classList.remove('open');
  });

  // Konaklama özeti güncelle
  function vpUpdateSummary() {
    var ci = document.getElementById('rezv-checkin');
    var co = document.getElementById('rezv-checkout');
    var sumEl = document.getElementById('rezv-summary');
    var nEl = document.getElementById('rezv-n');
    var dEl = document.getElementById('rezv-d');
    if (!ci || !co || !sumEl || !nEl || !dEl) return;
    if (ci.value && co.value && co.value > ci.value) {
      var d1 = new Date(ci.value);
      var d2 = new Date(co.value);
      var nights = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      var days = nights + 1;
      nEl.textContent = nights + ' gece';
      dEl.textContent = days + ' gün';
      sumEl.style.display = 'flex';
    } else {
      sumEl.style.display = 'none';
    }
  }

  // Tarihleri şu anki zamana göre set et (her sayfa yüklemesinde güncel)
  (function setRezvDates() {
    var ci = document.getElementById('rezv-checkin');
    var co = document.getElementById('rezv-checkout');
    if (!ci || !co) return;
    var now = new Date();
    var today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    var tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tmrw = tomorrow.getFullYear() + '-' + String(tomorrow.getMonth()+1).padStart(2,'0') + '-' + String(tomorrow.getDate()).padStart(2,'0');
    ci.value = today;
    ci.min = today;
    co.value = tmrw;
    co.min = tmrw;
  })();

  // Giriş tarihi seçilince çıkış min tarihini güncelle
  window.vpUpdateCheckoutMin = function() {
    var ci = document.getElementById('rezv-checkin');
    var co = document.getElementById('rezv-checkout');
    var errEl = document.getElementById('rezv-date-error');
    if (!ci || !co) return;
    if (errEl) errEl.textContent = '';
    if (ci.value) {
      var nextDay = new Date(ci.value);
      nextDay.setDate(nextDay.getDate() + 1);
      co.min = nextDay.toISOString().split('T')[0];
      if (co.value && co.value <= ci.value) {
        co.value = '';
        if (errEl) errEl.textContent = 'Çıkış tarihi giriş tarihinden en az 1 gün sonra olmalıdır.';
      }
    }
    vpUpdateSummary();
  };

  // Çıkış tarihi seçilince kontrol et
  window.vpValidateCheckout = function() {
    var ci = document.getElementById('rezv-checkin');
    var co = document.getElementById('rezv-checkout');
    var errEl = document.getElementById('rezv-date-error');
    if (!ci || !co || !errEl) return;
    if (!ci.value) {
      errEl.textContent = 'Önce giriş tarihini seçiniz.';
      co.value = '';
      vpUpdateSummary();
      return;
    }
    if (co.value && co.value <= ci.value) {
      errEl.textContent = 'Çıkış tarihi giriş tarihinden en az 1 gün sonra olmalıdır.';
      co.value = '';
      vpUpdateSummary();
      return;
    }
    errEl.textContent = '';
    vpUpdateSummary();
  };

  window.vpSendRezervasyon = function () {
    const name     = (document.getElementById('rezv-name')?.value || '').trim();
    const checkin  = document.getElementById('rezv-checkin')?.value  || '';
    const checkout = document.getElementById('rezv-checkout')?.value || '';
    const guests   = document.getElementById('rezv-guests')?.value   || '1';
    const errEl    = document.getElementById('rezv-date-error');
    if (!name)     { alert('Lütfen ad soyad giriniz.'); return; }
    if (!checkin)  { alert('Lütfen giriş tarihini seçiniz.'); return; }
    if (!checkout) { alert('Lütfen çıkış tarihini seçiniz.'); return; }

    // Tarih validasyonları
    var today = new Date().toISOString().split('T')[0];
    if (checkin < today) {
      if (errEl) errEl.textContent = 'Giriş tarihi bugünden önce olamaz.';
      return;
    }
    if (checkout <= checkin) {
      if (errEl) errEl.textContent = 'Çıkış tarihi giriş tarihinden sonra olmalıdır.';
      return;
    }
    if (errEl) errEl.textContent = '';
    if (window.trackAction) trackAction(v.id, 'reservation');
    const fmt = d => { if (!d) return '—'; const [y,m,day]=d.split('-'); return `${day}.${m}.${y}`; };
    const lines = [
      '━━━━━━━━━━━━━━━━━━━━',
      '*REZERVASYON TALEBİ*',
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      '*Mekan:* ' + v.title,
      '',
      '┌─────────────────────',
      '│ *Ad Soyad:* ' + name,
      '│ *Giriş:* ' + fmt(checkin),
      '│ *Çıkış:* ' + fmt(checkout),
      '│ *Kişi Sayısı:* ' + guests + ' kişi',
      '└─────────────────────',
      '',
      'Müsaitlik durumu hakkında bilgi almak istiyorum.',
      '',
      '_Assos\'u Keşfet (assosukesfet.com) üzerinden gönderilmiştir._'
    ];
    const msg = encodeURIComponent(lines.join('\n'));
    const rezWaNum = (v.phone || '').replace(/\D/g,'').replace(/^0/,'90');
    window.open(`https://wa.me/${rezWaNum}?text=${msg}`, '_blank');
  };

  scrollFadeIn();
}

/* ═══════════════════
   ANALYTICS TRACKER
═══════════════════ */
(function() {
  // Wait for Firebase to be ready
  function initAnalytics() {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      setTimeout(initAnalytics, 500);
      return;
    }
    const adb = firebase.firestore();

    // Hava durumu cache
    let _weatherCache = null;
    function getWeather() {
      if (_weatherCache) return Promise.resolve(_weatherCache);
      return fetch('https://api.open-meteo.com/v1/forecast?latitude=39.49&longitude=26.34&current=temperature_2m,weather_code')
        .then(r => r.json())
        .then(d => {
          if (!d.current) return null;
          const wmo = {0:'acik',1:'az_bulutlu',2:'parcali_bulutlu',3:'bulutlu',45:'sisli',48:'sisli',51:'hafif_yagmur',53:'yagmurlu',55:'yogun_yagmur',61:'yagmurlu',63:'yagmurlu',65:'siddetli_yagmur',71:'kar',80:'saganak',81:'saganak',95:'firtina'};
          _weatherCache = { temp: Math.round(d.current.temperature_2m), code: d.current.weather_code, label: wmo[d.current.weather_code] || 'bilinmiyor' };
          return _weatherCache;
        }).catch(() => null);
    }

    // Log event with timestamp + weather (non-blocking)
    function logEvent(type, target, action) {
      const run = function() {
        const now = new Date();
        const ev = {
          type: type,
          target: target,
          action: action || 'view',
          timestamp: now.toISOString(),
          date: now.toISOString().split('T')[0],
          hour: now.getHours()
        };
        getWeather().then(w => {
          if (w) { ev.weather = w.label; ev.temp = w.temp; }
          adb.collection('analytics_events').add(ev).catch(() => {});
        });
      };
      if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 3000 });
      else setTimeout(run, 100);
    }

    // Track page view (counter + event log, non-blocking)
    window.trackPageView = function(pageId) {
      if (!pageId) return;
      const run = function() {
        adb.collection('analytics').doc(pageId).set({
          views: firebase.firestore.FieldValue.increment(1),
          lastViewed: new Date().toISOString(),
          id: pageId
        }, { merge: true }).catch(() => {});
        logEvent('pageview', pageId);
      };
      if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 3000 });
      else setTimeout(run, 100);
    };

    // Track action (counter + event log)
    window.trackAction = function(venueId, action) {
      if (!venueId || !action) return;
      const docRef = adb.collection('analytics').doc('venue_' + venueId);
      const field = action + '_count';
      const update = { [field]: firebase.firestore.FieldValue.increment(1) };
      update[action + '_last'] = new Date().toISOString();
      update.id = venueId;
      docRef.set(update, { merge: true }).catch(() => {});
      logEvent('action', venueId, action);
    };

    // Auto-track current page
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const page = path.split('/').pop().replace('.html', '') || 'index';
    if (window.trackPageView) trackPageView('page_' + page);
  }
  initAnalytics();
})();

/* ═══════════════════════════════════════════════
   renderVillagePage — Köy detay sayfası
   ═══════════════════════════════════════════════ */
function renderVillagePage(villageId) {
  var v = (DATA.villages || []).find(function(x) { return x.id === villageId; });
  if (!v) {
    document.getElementById('village-hero').innerHTML = '';
    document.getElementById('village-body').innerHTML = '<p style="padding:80px 24px;text-align:center;color:#718096;">Köy bulunamadı.</p>';
    return;
  }

  // Mekan detay CSS'lerini inject et (kaydet/paylaş butonları için)
  if (!document.getElementById('vp-styles')) {
    // renderVenuePage henüz çağrılmadıysa gerekli CSS'leri ekle
    var vpS = document.createElement('style');
    vpS.id = 'vp-styles';
    vpS.textContent = '.vp-hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}.vp-back-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.76rem;font-weight:600;text-decoration:none;transition:background .2s;font-family:inherit;}.vp-back-btn:hover{background:rgba(255,255,255,.26);}.vp-hero-acts{display:flex;gap:8px;}.vp-act-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;}.vp-act-btn:hover{background:rgba(255,255,255,.28);}.vp-act-btn.saved{background:rgba(196,82,26,.82);border-color:rgba(196,82,26,.5);}.vp-share-wrap{position:relative;display:inline-block;}.vp-share-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;white-space:nowrap;}.vp-share-btn:hover{background:rgba(255,255,255,.28);}.vp-share-dd{position:absolute;top:calc(100% + 8px);right:0;min-width:180px;background:rgba(255,255,255,.12);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:6px;opacity:0;visibility:hidden;transform:translateY(-4px);transition:all .2s;z-index:20;}.vp-share-dd.open{opacity:1;visibility:visible;transform:translateY(0);}.vp-share-opt{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;border:none;background:none;cursor:pointer;transition:background .15s;text-decoration:none;font-family:inherit;font-size:.78rem;font-weight:600;color:#fff;width:100%;text-align:left;white-space:nowrap;}.vp-share-opt:hover{background:rgba(255,255,255,.12);}.vp-share-opt-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}';
    document.head.appendChild(vpS);
  }

  var gradient = v.bg || 'linear-gradient(160deg,#1A2744,#243255)';
  var hasImage = !!(v.image);

  /* ── HERO ── */
  var heroHtml = '<div style="position:relative;overflow:hidden;background:' + gradient + ';padding:0 24px;min-height:380px;">';

  // Arka plan görsel (varsa)
  if (hasImage) {
    heroHtml += '<div style="position:absolute;inset:0;"><img src="' + v.image + '" alt="' + (v.title || '') + ' Köyü Assos Ayvacık" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .8s ease;" loading="eager" onload="this.style.opacity=0.45"></div>';
    heroHtml += '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,16,30,.4) 0%,rgba(6,16,30,.88) 100%);pointer-events:none;"></div>';
  } else {
    heroHtml += '<div style="position:absolute;inset:0;background-image:url(\'data:image/svg+xml;utf8,<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" width=\\\"200\\\" height=\\\"200\\\"><path d=\\\"M0 80c30-10 60 15 100 0s70-20 100-5\\\" fill=\\\"none\\\" stroke=\\\"rgba(245,237,224,.04)\\\" stroke-width=\\\"1\\\"/><path d=\\\"M0 120c40 10 60-10 100 5s60 15 100-5\\\" fill=\\\"none\\\" stroke=\\\"rgba(245,237,224,.03)\\\" stroke-width=\\\"1\\\"/><path d=\\\"M0 160c30-15 70 10 100-5s70 10 100 0\\\" fill=\\\"none\\\" stroke=\\\"rgba(245,237,224,.025)\\\" stroke-width=\\\"1\\\"/></svg>\');pointer-events:none;opacity:.6;"></div>';
  }
  // Decorative orbs
  heroHtml += '<div style="position:absolute;width:300px;height:300px;border-radius:50%;background:rgba(196,82,26,.08);filter:blur(80px);top:-80px;right:-60px;pointer-events:none;"></div>';
  heroHtml += '<div style="position:absolute;width:200px;height:200px;border-radius:50%;background:rgba(26,107,138,.06);filter:blur(60px);bottom:-40px;left:-40px;pointer-events:none;"></div>';

  heroHtml += '<div style="position:relative;z-index:2;max-width:900px;margin:0 auto;padding:110px 0 56px;">';

  // Top bar — back + actions (mekan detaydaki ile birebir aynı)
  heroHtml += '<div class="vp-hero-top">';
  heroHtml += '<a href="../koyler.html" class="vp-back-btn">← Köyler</a>';
  heroHtml += '<div class="vp-hero-acts">';
  heroHtml += '<button id="vg-save-btn" class="vp-act-btn" onclick="vgToggleSave()"><span id="vg-save-icon">♡</span> <span id="vg-save-label">Kaydet</span></button>';
  heroHtml += '<div class="vp-share-wrap" id="vg-share-wrap"><button class="vp-share-btn" onclick="vgToggleShare()">↑ Paylaş</button><div class="vp-share-dd" id="vg-share-dd"></div></div>';
  heroHtml += '</div>';
  heroHtml += '</div>';

  // Emoji
  heroHtml += '<div style="margin-bottom:18px;">';
  heroHtml += '<span style="font-size:2.2rem;">' + (v.emoji || '📍') + '</span>';
  heroHtml += '</div>';

  // Title — türe göre ek
  var titleLower = (v.title || '').toLowerCase();
  var vType = v.type || 'koy';
  var heroTitle = v.title || '';
  if (vType === 'belde') {
    if (!titleLower.includes('belde')) heroTitle += ' Beldesi';
  } else if (vType === 'mahalle') {
    var parentLabel = v.parent === 'kucukkuyu' ? 'Küçükkuyu' : 'Ayvacık';
    if (!titleLower.includes('mahalle')) heroTitle = parentLabel + ' ' + heroTitle + ' Mahallesi';
    else heroTitle = parentLabel + ' ' + heroTitle;
  } else {
    if (!titleLower.includes('köy') && !titleLower.includes('koy')) heroTitle += ' Köyü';
  }
  heroHtml += '<h1 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:clamp(2rem,5vw,3.2rem);color:#F5EDE0;letter-spacing:-.03em;line-height:1.05;margin-bottom:8px;">' + heroTitle + '</h1>';

  // Location
  heroHtml += '<p style="font-size:.82rem;color:rgba(245,237,224,.4);margin-bottom:16px;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,224,.4)" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>Ayvacık, Çanakkale</p>';

  // Short description
  if (v.shortDesc) {
    heroHtml += '<p style="font-size:.88rem;color:rgba(245,237,224,.55);line-height:1.7;max-width:560px;margin-bottom:22px;">' + v.shortDesc + '</p>';
  }

  // Tags
  if (v.tags && v.tags.length) {
    heroHtml += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:22px;">';
    v.tags.forEach(function(tag) {
      heroHtml += '<span style="padding:4px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:999px;font-size:.65rem;font-weight:600;color:rgba(245,237,224,.5);">' + tag + '</span>';
    });
    heroHtml += '</div>';
  }

  // Yol tarifi butonları
  if (v.lat && v.lng) {
    heroHtml += '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
    heroHtml += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + v.lat + ',' + v.lng + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:rgba(66,133,244,.15);border:1px solid rgba(66,133,244,.3);border-radius:12px;padding:10px 20px;font-size:.78rem;font-weight:600;color:#F5EDE0;text-decoration:none;transition:all .25s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" onmouseover="this.style.background=\'rgba(66,133,244,.25)\';this.style.borderColor=\'rgba(66,133,244,.5)\'" onmouseout="this.style.background=\'rgba(66,133,244,.15)\';this.style.borderColor=\'rgba(66,133,244,.3)\'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4285F4"/></svg>Google Maps ile Yol Tarifi</a>';
    heroHtml += '<a href="https://maps.apple.com/?daddr=' + v.lat + ',' + v.lng + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:rgba(52,199,89,.1);border:1px solid rgba(52,199,89,.25);border-radius:12px;padding:10px 20px;font-size:.78rem;font-weight:600;color:#F5EDE0;text-decoration:none;transition:all .25s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" onmouseover="this.style.background=\'rgba(52,199,89,.2)\';this.style.borderColor=\'rgba(52,199,89,.45)\'" onmouseout="this.style.background=\'rgba(52,199,89,.1)\';this.style.borderColor=\'rgba(52,199,89,.25)\'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#34C759"/></svg>Apple Haritalar ile Yol Tarifi</a>';
    heroHtml += '</div>';

    // Ayvacık merkeze mesafe + süre hesapla (FAQ schema'da da kullanılacak)
    var ayvLat = 39.6128, ayvLng = 26.3997;
    var dLat = (v.lat - ayvLat) * Math.PI / 180;
    var dLon = (v.lng - ayvLng) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(ayvLat * Math.PI / 180) * Math.cos(v.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    var crowKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    window._vpRoadKm = Math.round(crowKm * 1.4);
    window._vpDriveMin = Math.max(5, Math.round(window._vpRoadKm * 1.07));
    var roadKm = window._vpRoadKm;
    var driveMin = window._vpDriveMin;
    if (roadKm >= 1) {
      heroHtml += '<div style="display:flex;align-items:center;gap:16px;margin-top:16px;">';
      heroHtml += '<span style="display:flex;align-items:center;gap:6px;font-size:.78rem;font-weight:700;color:rgba(245,237,224,.7);">📍 Ayvacık\u2019a ' + roadKm + ' km</span>';
      heroHtml += '<span style="font-size:.78rem;color:rgba(245,237,224,.2);">·</span>';
      heroHtml += '<span style="display:flex;align-items:center;gap:6px;font-size:.78rem;font-weight:700;color:rgba(245,237,224,.7);">🚗 ~' + driveMin + ' dk</span>';
      heroHtml += '</div>';
    }
  }

  heroHtml += '</div>'; // inner
  heroHtml += '</div>'; // hero

  document.getElementById('village-hero').innerHTML = heroHtml;

  /* ── BODY ── */
  var bodyHtml = '<div style="max-width:900px;margin:0 auto;padding:48px 24px 80px;">';

  // Highlights
  if (v.highlights && v.highlights.length) {
    bodyHtml += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:40px;">';
    v.highlights.forEach(function(h) {
      bodyHtml += '<span style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(196,82,26,.06);border:1px solid rgba(196,82,26,.1);border-radius:12px;font-size:.8rem;font-weight:600;color:#C4521A;">✦ ' + h + '</span>';
    });
    bodyHtml += '</div>';
  }

  // Description
  if (v.description) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:14px;">' + (v.title || '') + ' Hakkında</h2>';
    var vDescRaw = v.description;
    var vDescHtml = vDescRaw.indexOf('<') > -1 ? vDescRaw : '<p>' + vDescRaw.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
    bodyHtml += '<div style="font-size:.9rem;color:var(--text-mid);line-height:1.85;">' + vDescHtml + '</div>';
    bodyHtml += '</div>';
  }

  // Tags
  if (v.tags && v.tags.length) {
    bodyHtml += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:40px;">';
    v.tags.forEach(function(tag) {
      bodyHtml += '<span style="padding:5px 12px;background:rgba(26,39,68,.04);border:1px solid rgba(26,39,68,.08);border-radius:999px;font-size:.72rem;font-weight:600;color:var(--text-mid);">' + tag + '</span>';
    });
    bodyHtml += '</div>';
  }

  // Bu köydeki işletmeler
  var villageVenues = (DATA.venues || []).filter(function(venue) {
    // villageId eşleşmesi (admin panelden bağlanan mekanlar - places üzerinden değil venues için de)
    if (venue.villageId && venue.villageId === v.id) return true;
    // location text eşleşmesi
    if (!venue.location || !v.title) return false;
    return venue.location.toLowerCase().includes(v.title.toLowerCase()) ||
           v.title.toLowerCase().includes(venue.location.toLowerCase().split(',')[0].trim());
  });

  if (villageVenues.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    var ek = bulunmaEki(v.title);
    var ekSuffix = ek.substring(1);
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">📍 ' + v.title + '\u2019' + ekSuffix + 'ki İşletmeler</h2>';
    bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">';
    villageVenues.forEach(function(venue) {
      var vci = getVenueCatInfo(venue.category);
      var cs = { bg: vci.color + '14', color: vci.color, label: vci.label, emoji: vci.emoji };
      var isOpen = typeof isVenueOpen === 'function' ? isVenueOpen(venue) : null;
      var statusDot = '', statusText = '';
      if (isOpen === true) { statusDot = '#22C55E'; statusText = 'Açık'; }
      else if (isOpen === false) { statusDot = '#EF4444'; statusText = 'Kapalı'; }
      var shortDesc = (venue.shortDesc || '').substring(0, 70);
      if (shortDesc.length >= 70) shortDesc += '…';

      bodyHtml += '<a href="../mekanlar/mekan-detay.html?id=' + venue.id + '" style="display:block;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:18px;overflow:hidden;text-decoration:none;transition:all .3s cubic-bezier(.16,1,.3,1);" onmouseover="this.style.boxShadow=\'0 12px 36px rgba(26,39,68,.1)\';this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';

      // Görsel
      if (venue.images && venue.images[0]) {
        bodyHtml += '<div style="position:relative;height:140px;overflow:hidden;background:rgba(26,39,68,.05);">';
        bodyHtml += '<img src="' + venue.images[0] + '" alt="' + venue.title + '" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease;" loading="lazy" onload="this.style.opacity=1">';
        // Kategori badge üstte
        bodyHtml += '<span style="position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-size:.62rem;font-weight:700;color:#fff;">' + cs.emoji + ' ' + cs.label + '</span>';
        // Açık/kapalı badge
        if (statusDot) {
          bodyHtml += '<span style="position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-size:.62rem;font-weight:700;color:' + statusDot + ';"><span style="width:5px;height:5px;border-radius:50%;background:' + statusDot + ';"></span>' + statusText + '</span>';
        }
        bodyHtml += '</div>';
      } else {
        // Görselsiz — emoji ile
        bodyHtml += '<div style="height:100px;background:' + cs.bg + ';display:flex;align-items:center;justify-content:center;font-size:2.5rem;">' + cs.emoji + '</div>';
      }

      // İçerik
      bodyHtml += '<div style="padding:14px 16px 16px;">';
      bodyHtml += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
      bodyHtml += '<h4 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.88rem;color:var(--navy);margin:0;">' + venue.title + '</h4>';
      if (!venue.images || !venue.images[0]) {
        if (statusDot) bodyHtml += '<span style="display:inline-flex;align-items:center;gap:4px;font-size:.62rem;font-weight:700;color:' + statusDot + ';"><span style="width:5px;height:5px;border-radius:50%;background:' + statusDot + ';"></span>' + statusText + '</span>';
      }
      bodyHtml += '</div>';
      if (shortDesc) bodyHtml += '<p style="font-size:.75rem;color:var(--text-mid);line-height:1.55;margin:0;">' + shortDesc + '</p>';
      bodyHtml += '</div></a>';
    });
    bodyHtml += '</div></div>';
  }

  // Bu köydeki gezilecek yerler
  var villagePlaces = (DATA.places || []).filter(function(place) {
    if (place.villageId && place.villageId === v.id) return true;
    if (!place.location || !v.title) return false;
    return place.location.toLowerCase().includes(v.title.toLowerCase());
  });

  if (villagePlaces.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    var ekPlace = bulunmaEki(v.title);
    var ekPlaceSuffix = ekPlace.substring(1);
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">🏛 ' + v.title + '\u2019' + ekPlaceSuffix + ' Gezilecek Yerler</h2>';
    bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">';
    villagePlaces.forEach(function(place) {
      bodyHtml += '<a href="../yerler/yer-detay.html?id=' + place.id + '" style="display:block;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:18px;overflow:hidden;text-decoration:none;transition:all .3s cubic-bezier(.16,1,.3,1);" onmouseover="this.style.boxShadow=\'0 12px 36px rgba(26,39,68,.1)\';this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
      if (place.image) {
        bodyHtml += '<div style="height:120px;overflow:hidden;background:rgba(26,39,68,.05);"><img src="' + place.image + '" alt="' + (place.title || '') + ' Assos" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease;" loading="lazy" onload="this.style.opacity=1"></div>';
      } else {
        bodyHtml += '<div style="height:80px;background:linear-gradient(135deg,rgba(26,39,68,.06),rgba(26,39,68,.02));display:flex;align-items:center;justify-content:center;font-size:2rem;">' + (place.emoji || '🏛') + '</div>';
      }
      bodyHtml += '<div style="padding:14px 16px;">';
      bodyHtml += '<h4 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.85rem;color:var(--navy);margin:0 0 4px;">' + (place.title || '') + '</h4>';
      if (place.shortDesc) bodyHtml += '<p style="font-size:.72rem;color:var(--text-mid);line-height:1.5;margin:0;">' + place.shortDesc.substring(0, 80) + (place.shortDesc.length > 80 ? '…' : '') + '</p>';
      bodyHtml += '</div></a>';
    });
    bodyHtml += '</div></div>';
  }

  // Bu köyden geçen rotalar
  var villageRoutes = (DATA.routes || []).filter(function(route) {
    if (!route.stops || !route.stops.length) return false;
    return route.stops.some(function(stop) {
      var stopName = (typeof stop === 'string' ? stop : stop.title || '').toLowerCase();
      return stopName.includes(v.title.toLowerCase());
    });
  });

  if (villageRoutes.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">🗺 Bu Köyden Geçen Rotalar</h2>';
    villageRoutes.forEach(function(route) {
      bodyHtml += '<a href="../rotalar/rota-detay.html?id=' + route.id + '" style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:14px;text-decoration:none;margin-bottom:10px;transition:all .25s;" onmouseover="this.style.boxShadow=\'0 8px 28px rgba(26,39,68,.08)\'" onmouseout="this.style.boxShadow=\'none\'">';
      bodyHtml += '<span style="font-size:1.5rem;">' + (route.emoji || '🗺') + '</span>';
      bodyHtml += '<div><div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.85rem;color:var(--navy);margin-bottom:2px;">' + route.title + '</div>';
      bodyHtml += '<span style="font-size:.7rem;color:var(--text-mid);">' + (route.sure || '') + (route.stops ? ' · ' + route.stops.length + ' durak' : '') + '</span>';
      bodyHtml += '</div></a>';
    });
    bodyHtml += '</div>';
  }

  // Bağlı mahalleler (belde veya merkez için)
  var bagliMahalleler = (DATA.villages || []).filter(function(vl) {
    return vl.type === 'mahalle' && vl.parent === v.id;
  }).sort(function(a, b) { return (a.title || '').localeCompare(b.title || '', 'tr'); });

  if (bagliMahalleler.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">📍 Bağlı Mahalleler</h2>';
    bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">';
    bagliMahalleler.forEach(function(vl) {
      bodyHtml += '<a href="koy-detay.html?id=' + vl.id + '" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:14px;text-decoration:none;transition:all .25s;" onmouseover="this.style.boxShadow=\'0 6px 20px rgba(26,39,68,.07)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
      bodyHtml += '<span style="font-size:1.4rem;">' + (vl.emoji || '📍') + '</span>';
      bodyHtml += '<div style="flex:1;min-width:0;"><div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.82rem;color:var(--navy);">' + vl.title + '</div>';
      if (vl.shortDesc) bodyHtml += '<div style="font-size:.68rem;color:var(--text-mid);margin-top:2px;">' + vl.shortDesc.substring(0, 50) + '</div>';
      bodyHtml += '</div></a>';
    });
    bodyHtml += '</div></div>';
  }

  // Yakındaki köyler (koordinat bazlı mesafe)
  var nearbyVillages = [];
  if (v.lat && v.lng) {
    var R = 6371;
    nearbyVillages = (DATA.villages || []).filter(function(vl) {
      if (vl.id === v.id || !vl.lat || !vl.lng) return false;
      if (vl.type === 'mahalle' || vl.type === 'belde') return false;
      return true;
    }).map(function(vl) {
      var dLat = (vl.lat - v.lat) * Math.PI / 180;
      var dLon = (vl.lng - v.lng) * Math.PI / 180;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(v.lat * Math.PI / 180) * Math.cos(vl.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      vl._dist = R * c;
      return vl;
    }).sort(function(a, b) { return a._dist - b._dist; }).slice(0, 6);
  } else {
    nearbyVillages = (DATA.villages || []).filter(function(vl) {
      return vl.id !== v.id && vl.description;
    }).slice(0, 6);
  }

  if (nearbyVillages.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">🏘 Yakındaki Köyler</h2>';
    bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">';
    nearbyVillages.forEach(function(vl) {
      var distText = '';
      if (vl._dist != null) {
        var distM = Math.round(vl._dist * 1000);
        if (distM < 200) distM = 200;
        distText = vl._dist < 1 ? distM + ' m' : vl._dist.toFixed(1) + ' km';
      }
      bodyHtml += '<a href="koy-detay.html?id=' + vl.id + '" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:14px;text-decoration:none;transition:all .25s;" onmouseover="this.style.boxShadow=\'0 6px 20px rgba(26,39,68,.07)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
      bodyHtml += '<span style="font-size:1.4rem;">' + (vl.emoji || '📍') + '</span>';
      bodyHtml += '<div style="flex:1;min-width:0;"><div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.82rem;color:var(--navy);">' + vl.title + '</div>';
      if (vl.shortDesc) bodyHtml += '<div style="font-size:.68rem;color:var(--text-mid);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + vl.shortDesc.substring(0, 50) + '</div>';
      bodyHtml += '</div>';
      if (distText) bodyHtml += '<span style="font-size:.65rem;font-weight:600;color:var(--terra);white-space:nowrap;">' + distText + '</span>';
      bodyHtml += '</a>';
    });
    bodyHtml += '</div></div>';
  }

  // Diğer mahalleler (mahalle detayındaysa)
  if (vType === 'mahalle' && v.parent) {
    var PARENT_NAMES = { ayvacik: 'Ayvacık', kucukkuyu: 'Küçükkuyu' };
    var parentName = PARENT_NAMES[v.parent] || v.parent;
    var digerMahalleler = (DATA.villages || []).filter(function(vl) {
      return vl.id !== v.id && vl.type === 'mahalle' && vl.parent === v.parent;
    }).sort(function(a, b) { return (a.title || '').localeCompare(b.title || '', 'tr'); });

    if (digerMahalleler.length > 0) {
      bodyHtml += '<div style="margin-bottom:40px;">';
      bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">📍 ' + parentName + '\'ın Diğer Mahalleleri</h2>';
      bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">';
      digerMahalleler.forEach(function(vl) {
        bodyHtml += '<a href="koy-detay.html?id=' + vl.id + '" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:14px;text-decoration:none;transition:all .25s;" onmouseover="this.style.boxShadow=\'0 6px 20px rgba(26,39,68,.07)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
        bodyHtml += '<span style="font-size:1.4rem;">' + (vl.emoji || '📍') + '</span>';
        bodyHtml += '<div><div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.82rem;color:var(--navy);">' + vl.title + '</div></div></a>';
      });
      bodyHtml += '</div></div>';
    }
  }

  bodyHtml += '</div>'; // container

  document.getElementById('village-body').innerHTML = bodyHtml;

  // FAQ Schema (SEO — sayfada görsel yok, sadece head'e eklenir)
  var faqItems = [];
  var vName = heroTitle;

  // 1. Nasıl gidilir?
  if (window._vpRoadKm && window._vpRoadKm >= 1) {
    faqItems.push({
      q: vName + '\'e nasıl gidilir?',
      a: vName + ', Çanakkale\'nin Ayvacık ilçesine bağlıdır. Ayvacık merkeze yaklaşık ' + window._vpRoadKm + ' km uzaklıkta olup, araçla ortalama ' + window._vpDriveMin + ' dakikada ulaşılabilir. Google Maps veya Apple Haritalar üzerinden yol tarifi alabilirsiniz.'
    });
  }

  // 2. Ne yapılır?
  if ((v.tags && v.tags.length) || (v.highlights && v.highlights.length)) {
    var yapilacaklar = [];
    if (v.highlights) yapilacaklar = yapilacaklar.concat(v.highlights);
    if (v.tags) yapilacaklar = yapilacaklar.concat(v.tags);
    var uniqueYap = yapilacaklar.filter(function(item, idx) { return yapilacaklar.indexOf(item) === idx; });
    faqItems.push({
      q: vName + '\'de ne yapılır?',
      a: vName + ' ziyaretçilerine birçok deneyim sunmaktadır: ' + uniqueYap.join(', ') + '.'
    });
  }

  // 3. Konaklama var mı? (sadece varsa)
  var konaklamaVenues = villageVenues.filter(function(vn) { return vn.category === 'konaklama'; });
  if (konaklamaVenues.length > 0) {
    faqItems.push({
      q: vName + '\'de konaklama var mı?',
      a: 'Evet, ' + vName + '\'de ' + konaklamaVenues.length + ' adet konaklama seçeneği bulunmaktadır: ' + konaklamaVenues.map(function(k) { return k.title; }).join(', ') + '.'
    });
  }

  // 4. Yeme-içme (sadece varsa)
  var yemeIcmeVenues = villageVenues.filter(function(vn) { return vn.category === 'restoran' || vn.category === 'kafe' || vn.category === 'kahvalti'; });
  if (yemeIcmeVenues.length > 0) {
    faqItems.push({
      q: vName + '\'de yeme içme seçenekleri neler?',
      a: vName + '\'de ' + yemeIcmeVenues.length + ' adet yeme-içme mekanı bulunmaktadır: ' + yemeIcmeVenues.map(function(k) { return k.title; }).join(', ') + '.'
    });
  }

  // 5. Gezilecek yerler (sadece varsa)
  if (villagePlaces.length > 0) {
    faqItems.push({
      q: vName + '\'de gezilecek yerler nereler?',
      a: vName + ' ve çevresinde gezebileceğiniz ' + villagePlaces.length + ' önemli nokta bulunmaktadır: ' + villagePlaces.map(function(p) { return p.title; }).join(', ') + '.'
    });
  }

  // 6. Yakındaki köyler
  if (nearbyVillages.length > 0) {
    var yakinIsimler = nearbyVillages.slice(0, 4).map(function(vl) {
      var d = vl._dist ? ' (' + vl._dist.toFixed(1) + ' km)' : '';
      return vl.title + d;
    });
    faqItems.push({
      q: vName + ' yakınında hangi köyler var?',
      a: vName + ' yakınındaki köyler: ' + yakinIsimler.join(', ') + '. Bu köylere de kısa bir yolculukla ulaşabilirsiniz.'
    });
  }

  // Schema'yı head'e ekle
  if (faqItems.length > 0) {
    var faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqItems.map(function(item) {
        return {
          '@type': 'Question',
          'name': item.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.a
          }
        };
      })
    };
    var faqEl = document.createElement('script');
    faqEl.type = 'application/ld+json';
    faqEl.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(faqEl);
  }

  // Favori — mekan detaydaki ile aynı class yapısı (vp-act-btn.saved)
  var vgIsSaved = window.isPlaceSaved && isPlaceSaved(v.id);
  if (vgIsSaved) {
    var sb = document.getElementById('vg-save-btn');
    if (sb) { sb.classList.add('saved'); document.getElementById('vg-save-icon').textContent = '♥'; document.getElementById('vg-save-label').textContent = 'Kaydedildi'; }
  }
  window.vgToggleSave = function() {
    if (window.togglePlaceSave) togglePlaceSave(v.id);
    var now = window.isPlaceSaved && isPlaceSaved(v.id);
    var sb = document.getElementById('vg-save-btn');
    if (sb) {
      sb.classList.toggle('saved', now);
      document.getElementById('vg-save-icon').textContent = now ? '♥' : '♡';
      document.getElementById('vg-save-label').textContent = now ? 'Kaydedildi' : 'Kaydet';
    }
  };

  // Paylaş — mekan detaydaki ile aynı class yapısı (vp-share-opt)
  var vgUrl = window.location.origin + '/koyler/koy-detay.html?id=' + v.id;
  var vgText = heroTitle + ' - Assos\'u Keşfet';
  var vgWaText = heroTitle + '\nAyvacık, Çanakkale\n\n' + vgUrl;
  var dd = document.getElementById('vg-share-dd');
  if (dd) {
    dd.innerHTML =
      '<a href="https://wa.me/?text=' + encodeURIComponent(vgWaText) + '" target="_blank" rel="noopener" class="vp-share-opt">' +
        '<span class="vp-share-opt-icon" style="background:#25D366"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.855L0 24l6.335-1.52C8.034 23.46 9.98 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.584-.479-5.104-1.32l-.369-.21-3.76.902.948-3.668-.223-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg></span>' +
        '<span>WhatsApp</span></a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(vgUrl) + '" target="_blank" rel="noopener" class="vp-share-opt">' +
        '<span class="vp-share-opt-icon" style="background:#1877F2"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></span>' +
        '<span>Facebook</span></a>' +
      '<a href="https://x.com/intent/tweet?text=' + encodeURIComponent(vgText) + '&url=' + encodeURIComponent(vgUrl) + '" target="_blank" rel="noopener" class="vp-share-opt">' +
        '<span class="vp-share-opt-icon" style="background:#000"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>' +
        '<span>X</span></a>' +
      '<button class="vp-share-opt" onclick="navigator.clipboard.writeText(\'' + vgUrl.replace(/'/g, "\\'") + '\').then(function(){var el=document.getElementById(\'vg-copy-lbl\');el.textContent=\'Kopyalandı!\';setTimeout(function(){el.textContent=\'Kopyala\'},1500)})">' +
        '<span class="vp-share-opt-icon" style="background:rgba(255,255,255,.15)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></span>' +
        '<span id="vg-copy-lbl">Kopyala</span></button>';
  }
  window.vgToggleShare = function() {
    var d = document.getElementById('vg-share-dd');
    d.classList.toggle('open');
  };
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('vg-share-wrap');
    var d = document.getElementById('vg-share-dd');
    if (wrap && d && !wrap.contains(e.target)) d.classList.remove('open');
  });

  // Analytics
  if (typeof trackPageView === 'function') trackPageView('village_' + villageId);
}

/* ═══════════════════
   renderPlacePage — Gezilecek yer detay sayfası
═══════════════════ */
function renderPlacePage(placeId) {
  var p = (DATA.places || []).find(function(x) { return x.id === placeId; });
  if (!p) {
    document.getElementById('place-hero').innerHTML = '';
    document.getElementById('place-body').innerHTML = '<p style="padding:80px 24px;text-align:center;color:#718096;">Yer bulunamadı.</p>';
    return;
  }

  // CSS inject
  if (!document.getElementById('vp-styles')) {
    var vpS = document.createElement('style');
    vpS.id = 'vp-styles';
    vpS.textContent = '.vp-hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}.vp-back-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.76rem;font-weight:600;text-decoration:none;transition:background .2s;font-family:inherit;}.vp-back-btn:hover{background:rgba(255,255,255,.26);}.vp-hero-acts{display:flex;gap:8px;}.vp-act-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;}.vp-act-btn:hover{background:rgba(255,255,255,.28);}.vp-act-btn.saved{background:rgba(196,82,26,.82);border-color:rgba(196,82,26,.5);}.vp-share-wrap{position:relative;display:inline-block;}.vp-share-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9);font-size:.74rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;white-space:nowrap;}.vp-share-btn:hover{background:rgba(255,255,255,.28);}.vp-share-dd{position:absolute;top:calc(100% + 8px);right:0;min-width:180px;background:rgba(255,255,255,.12);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:6px;opacity:0;visibility:hidden;transform:translateY(-4px);transition:all .2s;z-index:20;}.vp-share-dd.open{opacity:1;visibility:visible;transform:translateY(0);}.vp-share-opt{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;border:none;background:none;cursor:pointer;transition:background .15s;text-decoration:none;font-family:inherit;font-size:.78rem;font-weight:600;color:#fff;width:100%;text-align:left;white-space:nowrap;}.vp-share-opt:hover{background:rgba(255,255,255,.12);}.vp-share-opt-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}';
    document.head.appendChild(vpS);
  }

  var gradient = 'linear-gradient(160deg,#1A2744,#243255)';
  var hasImage = !!(p.image);

  /* ── HERO ── */
  var heroHtml = '<div style="position:relative;overflow:hidden;background:' + gradient + ';padding:0 24px;min-height:380px;">';
  if (hasImage) {
    heroHtml += '<div style="position:absolute;inset:0;"><img src="' + p.image + '" alt="' + (p.title || '') + ' Assos Ayvacık" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .8s ease;" loading="eager" onload="this.style.opacity=0.45"></div>';
    heroHtml += '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,16,30,.4) 0%,rgba(6,16,30,.88) 100%);pointer-events:none;"></div>';
  } else {
    heroHtml += '<div style="position:absolute;inset:0;background-image:url(\'data:image/svg+xml;utf8,<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" width=\\\"200\\\" height=\\\"200\\\"><path d=\\\"M0 80c30-10 60 15 100 0s70-20 100-5\\\" fill=\\\"none\\\" stroke=\\\"rgba(245,237,224,.04)\\\" stroke-width=\\\"1\\\"/></svg>\');pointer-events:none;opacity:.6;"></div>';
  }
  heroHtml += '<div style="position:absolute;width:300px;height:300px;border-radius:50%;background:rgba(196,82,26,.08);filter:blur(80px);top:-80px;right:-60px;pointer-events:none;"></div>';

  heroHtml += '<div style="position:relative;z-index:2;max-width:900px;margin:0 auto;padding:110px 0 56px;">';

  // Top bar
  heroHtml += '<div class="vp-hero-top">';
  heroHtml += '<a href="../yerler.html" class="vp-back-btn">← Gezilecek Yerler</a>';
  heroHtml += '<div class="vp-hero-acts">';
  heroHtml += '<button id="pl-save-btn" class="vp-act-btn" onclick="plToggleSave()"><span id="pl-save-icon">♡</span> <span id="pl-save-label">Kaydet</span></button>';
  heroHtml += '<div class="vp-share-wrap" id="pl-share-wrap"><button class="vp-share-btn" onclick="plToggleShare()">↑ Paylaş</button><div class="vp-share-dd" id="pl-share-dd"></div></div>';
  heroHtml += '</div></div>';

  // Emoji
  heroHtml += '<div style="margin-bottom:18px;"><span style="font-size:2.2rem;">' + (p.emoji || '🏛') + '</span></div>';

  // Title
  heroHtml += '<h1 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:clamp(2rem,5vw,3.2rem);color:#F5EDE0;letter-spacing:-.03em;line-height:1.05;margin-bottom:8px;">' + (p.title || '') + '</h1>';

  // Location
  if (p.location) {
    heroHtml += '<p style="font-size:.82rem;color:rgba(245,237,224,.4);margin-bottom:16px;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,224,.4)" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>' + p.location + '</p>';
  }

  // Short description
  if (p.shortDesc) {
    heroHtml += '<p style="font-size:.88rem;color:rgba(245,237,224,.55);line-height:1.7;max-width:560px;margin-bottom:22px;">' + p.shortDesc + '</p>';
  }

  // Tags
  if (p.tags && p.tags.length) {
    heroHtml += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:22px;">';
    p.tags.forEach(function(tag) {
      heroHtml += '<span style="padding:4px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:999px;font-size:.65rem;font-weight:600;color:rgba(245,237,224,.5);">' + tag + '</span>';
    });
    heroHtml += '</div>';
  }

  // Yol tarifi butonları
  if (p.lat && p.lng) {
    heroHtml += '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
    heroHtml += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:rgba(66,133,244,.15);border:1px solid rgba(66,133,244,.3);border-radius:12px;padding:10px 20px;font-size:.78rem;font-weight:600;color:#F5EDE0;text-decoration:none;transition:all .25s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" onmouseover="this.style.background=\'rgba(66,133,244,.25)\'" onmouseout="this.style.background=\'rgba(66,133,244,.15)\'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4285F4"/></svg>Google Maps</a>';
    heroHtml += '<a href="https://maps.apple.com/?daddr=' + p.lat + ',' + p.lng + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:rgba(52,199,89,.1);border:1px solid rgba(52,199,89,.25);border-radius:12px;padding:10px 20px;font-size:.78rem;font-weight:600;color:#F5EDE0;text-decoration:none;transition:all .25s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" onmouseover="this.style.background=\'rgba(52,199,89,.2)\'" onmouseout="this.style.background=\'rgba(52,199,89,.1)\'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#34C759"/></svg>Apple Haritalar</a>';
    heroHtml += '</div>';
  }

  heroHtml += '</div></div>';
  document.getElementById('place-hero').innerHTML = heroHtml;

  /* ── BODY ── */
  var bodyHtml = '<div style="max-width:900px;margin:0 auto;padding:48px 24px 80px;">';

  // Ören Yeri Ziyaret Saatleri
  if ((p.category === 'tarihi' || p.category === 'orenyeri') && p.orenYeri) {
    var oy = p.orenYeri;
    var now = new Date();
    var trNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    var month = trNow.getMonth() + 1; // 1-12
    var isYaz = month >= 5 && month < 10; // Mayıs-Eylül arası yaz
    var currentHour = trNow.getHours();
    var currentMin = trNow.getMinutes();
    var currentTime = currentHour * 60 + currentMin;
    var acilis = isYaz ? (oy.yazAcilis || '08:30') : (oy.kisAcilis || '08:30');
    var kapanis = isYaz ? (oy.yazKapanis || '20:00') : (oy.kisKapanis || '17:30');
    var acilisParts = acilis.split(':'); var acilisMin = parseInt(acilisParts[0]) * 60 + parseInt(acilisParts[1] || 0);
    var kapanisParts = kapanis.split(':'); var kapanisMin = parseInt(kapanisParts[0]) * 60 + parseInt(kapanisParts[1] || 0);
    var isOpen = currentTime >= acilisMin && currentTime < kapanisMin;
    var giseKapanis = isYaz ? '19:30' : '17:00';

    bodyHtml += '<div style="margin-bottom:40px;background:linear-gradient(135deg,rgba(26,39,68,.04),rgba(196,82,26,.03));border:1px solid rgba(26,39,68,.08);border-radius:18px;overflow:hidden;">';
    // Başlık + Durum
    bodyHtml += '<div style="padding:20px 24px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1rem;color:var(--navy);margin:0;">🏛 Ziyaret Bilgileri</h2>';
    bodyHtml += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
    bodyHtml += '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;font-size:.72rem;font-weight:700;background:' + (isOpen ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)') + ';color:' + (isOpen ? '#16A34A' : '#DC2626') + ';"><span style="width:7px;height:7px;border-radius:50%;background:' + (isOpen ? '#22C55E' : '#EF4444') + ';"></span>' + (isOpen ? 'Şu An Açık' : 'Şu An Kapalı') + '</span>';
    bodyHtml += '<span style="font-size:.68rem;color:var(--text-muted);font-weight:500;">📅 Haftanın her günü açık</span>';
    bodyHtml += '</div>';
    bodyHtml += '</div>';

    // Sezon kartları
    bodyHtml += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 24px 20px;">';
    // Yaz
    bodyHtml += '<div style="padding:16px;border-radius:14px;background:' + (isYaz ? 'rgba(196,82,26,.06)' : 'rgba(0,0,0,.02)') + ';border:1.5px solid ' + (isYaz ? 'rgba(196,82,26,.2)' : 'rgba(0,0,0,.05)') + ';position:relative;">';
    if (isYaz) bodyHtml += '<span style="position:absolute;top:10px;right:10px;font-size:.55rem;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--terra);color:#fff;letter-spacing:.05em;">AKTİF</span>';
    bodyHtml += '<div style="font-size:.72rem;font-weight:700;color:' + (isYaz ? 'var(--terra)' : 'var(--text-muted)') + ';margin-bottom:8px;">☀️ Yaz Sezonu</div>';
    bodyHtml += '<div style="font-size:.65rem;color:var(--text-muted);margin-bottom:6px;">1 Mayıs – 1 Ekim</div>';
    bodyHtml += '<div style="font-size:1rem;font-weight:800;color:var(--navy);">' + (oy.yazAcilis || '08:30') + ' – ' + (oy.yazKapanis || '20:00') + '</div>';
    bodyHtml += '<div style="font-size:.65rem;color:var(--text-muted);margin-top:4px;">Gişe Kapanışı: 19:30</div>';
    bodyHtml += '</div>';
    // Kış
    bodyHtml += '<div style="padding:16px;border-radius:14px;background:' + (!isYaz ? 'rgba(26,107,138,.06)' : 'rgba(0,0,0,.02)') + ';border:1.5px solid ' + (!isYaz ? 'rgba(26,107,138,.2)' : 'rgba(0,0,0,.05)') + ';position:relative;">';
    if (!isYaz) bodyHtml += '<span style="position:absolute;top:10px;right:10px;font-size:.55rem;font-weight:800;padding:2px 8px;border-radius:999px;background:#1A6B8A;color:#fff;letter-spacing:.05em;">AKTİF</span>';
    bodyHtml += '<div style="font-size:.72rem;font-weight:700;color:' + (!isYaz ? '#1A6B8A' : 'var(--text-muted)') + ';margin-bottom:8px;">❄️ Kış Sezonu</div>';
    bodyHtml += '<div style="font-size:.65rem;color:var(--text-muted);margin-bottom:6px;">Ekim – Mayıs</div>';
    bodyHtml += '<div style="font-size:1rem;font-weight:800;color:var(--navy);">' + (oy.kisAcilis || '08:30') + ' – ' + (oy.kisKapanis || '17:30') + '</div>';
    bodyHtml += '<div style="font-size:.65rem;color:var(--text-muted);margin-top:4px;">Gişe Kapanışı: 17:00</div>';
    bodyHtml += '</div>';
    bodyHtml += '</div>';

    // Telefon + Alt bilgiler
    if (oy.tel1 || oy.tel2) {
      bodyHtml += '<div style="padding:0 24px 16px;display:flex;flex-wrap:wrap;gap:8px;">';
      if (oy.tel1) {
        var tel1Clean = oy.tel1.replace(/[^0-9+]/g, '');
        bodyHtml += '<a href="tel:' + tel1Clean + '" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;background:rgba(26,107,138,.08);border:1px solid rgba(26,107,138,.15);font-size:.78rem;font-weight:600;color:#1A6B8A;text-decoration:none;transition:all .2s;" onmouseover="this.style.background=\'rgba(26,107,138,.15)\'" onmouseout="this.style.background=\'rgba(26,107,138,.08)\'">📞 ' + oy.tel1 + '</a>';
      }
      if (oy.tel2) {
        var tel2Clean = oy.tel2.replace(/[^0-9+]/g, '');
        bodyHtml += '<a href="tel:' + tel2Clean + '" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;background:rgba(26,107,138,.08);border:1px solid rgba(26,107,138,.15);font-size:.78rem;font-weight:600;color:#1A6B8A;text-decoration:none;transition:all .2s;" onmouseover="this.style.background=\'rgba(26,107,138,.15)\'" onmouseout="this.style.background=\'rgba(26,107,138,.08)\'">📞 ' + oy.tel2 + '</a>';
      }
      bodyHtml += '</div>';
    }

    bodyHtml += '<div style="padding:0 24px 20px;display:flex;flex-wrap:wrap;gap:10px;">';
    if (oy.ucret) {
      bodyHtml += '<span style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:10px;background:rgba(26,39,68,.05);font-size:.72rem;font-weight:600;color:var(--navy);">🎟 ' + oy.ucret + '</span>';
    }
    if (oy.muzekart !== false) {
      bodyHtml += '<span style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:10px;background:rgba(56,161,105,.08);font-size:.72rem;font-weight:600;color:#276749;">✅ T.C. Vatandaşları İçin Müzekart Geçerlidir</span>';
      bodyHtml += '<a href="https://muze.gov.tr/MuseumPass" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:10px;background:rgba(196,82,26,.08);border:1px solid rgba(196,82,26,.15);font-size:.72rem;font-weight:700;color:#C4521A;text-decoration:none;transition:all .2s;" onmouseover="this.style.background=\'rgba(196,82,26,.15)\'" onmouseout="this.style.background=\'rgba(196,82,26,.08)\'">🎫 Müze Kartı Satın Al →</a>';
    }
    bodyHtml += '</div>';

    // Uyarı
    bodyHtml += '<div style="padding:12px 24px 16px;border-top:1px solid rgba(26,39,68,.06);font-size:.68rem;color:var(--text-muted);line-height:1.6;">';
    bodyHtml += '⚠️ Yaz sezonunda yoğun talep durumunda Valilik kararıyla kapanış saati 21:30\'a uzatılabilir. Gişe, kapanıştan 30 dk önce bilet satışını durdurur. Çıkış saatine uyulması rica olunur.';
    bodyHtml += '</div>';
    bodyHtml += '</div>';
  }

  // Müze / Özel mekan saatleri (ören yeri olmayanlar için)
  if (p.museHours && !(p.category === 'tarihi' || p.category === 'orenyeri')) {
    var mh = p.museHours;
    var mNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    var mTime = mNow.getHours() * 60 + mNow.getMinutes();
    var mAcParts = (mh.acilis || '09:00').split(':'); var mAcMin = parseInt(mAcParts[0]) * 60 + parseInt(mAcParts[1] || 0);
    var mKpParts = (mh.kapanis || '17:00').split(':'); var mKpMin = parseInt(mKpParts[0]) * 60 + parseInt(mKpParts[1] || 0);
    var mIsOpen = mTime >= mAcMin && mTime < mKpMin;

    bodyHtml += '<div style="margin-bottom:40px;background:rgba(26,39,68,.03);border:1px solid rgba(26,39,68,.08);border-radius:16px;padding:20px 24px;">';
    bodyHtml += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1rem;color:var(--navy);margin:0;">🕐 Ziyaret Bilgileri</h2>';
    bodyHtml += '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;font-size:.72rem;font-weight:700;background:' + (mIsOpen ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)') + ';color:' + (mIsOpen ? '#16A34A' : '#DC2626') + ';"><span style="width:7px;height:7px;border-radius:50%;background:' + (mIsOpen ? '#22C55E' : '#EF4444') + ';"></span>' + (mIsOpen ? 'Şu An Açık' : 'Şu An Kapalı') + '</span>';
    bodyHtml += '</div>';
    bodyHtml += '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
    bodyHtml += '<span style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:10px;background:rgba(26,39,68,.05);font-size:.78rem;font-weight:700;color:var(--navy);">🕐 ' + (mh.acilis || '09:00') + ' – ' + (mh.kapanis || '17:00') + '</span>';
    if (mh.gunler) bodyHtml += '<span style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:10px;background:rgba(26,39,68,.05);font-size:.72rem;font-weight:600;color:var(--text-muted);">📅 ' + mh.gunler + '</span>';
    if (mh.ucret) bodyHtml += '<span style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:10px;background:rgba(56,161,105,.08);font-size:.72rem;font-weight:600;color:#276749;">🎟 ' + mh.ucret + '</span>';
    bodyHtml += '</div></div>';
  }

  // Description
  if (p.description) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:14px;">' + (p.title || '') + ' Hakkında</h2>';
    var descRaw = p.description;
    var descHtml = descRaw.indexOf('<') > -1 ? descRaw : '<p>' + descRaw.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
    bodyHtml += '<div style="font-size:.9rem;color:var(--text-mid);line-height:1.85;">' + descHtml + '</div>';
    bodyHtml += '</div>';
  }

  // Bağlı köy
  if (p.villageId) {
    var village = (DATA.villages || []).find(function(v) { return v.id === p.villageId; });
    if (village) {
      bodyHtml += '<div style="margin-bottom:40px;">';
      bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:14px;">📍 Bağlı Olduğu Yerleşim</h2>';
      bodyHtml += '<a href="../koyler/koy-detay.html?id=' + village.id + '" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:14px;text-decoration:none;transition:all .25s;" onmouseover="this.style.boxShadow=\'0 6px 20px rgba(26,39,68,.07)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
      bodyHtml += '<span style="font-size:1.4rem;">' + (village.emoji || '🏘') + '</span>';
      bodyHtml += '<div><div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.85rem;color:var(--navy);">' + village.title + '</div>';
      if (village.shortDesc) bodyHtml += '<div style="font-size:.68rem;color:var(--text-mid);margin-top:2px;">' + village.shortDesc + '</div>';
      bodyHtml += '</div></a></div>';
    }
  }

  // Bu yerdeki işletmeler (placeId eşleşmesi)
  var placeVenues = (DATA.venues || []).filter(function(v) {
    return v.placeId && v.placeId === p.id;
  });

  // Yakındaki mekanlar (location veya villageId eşleşmesi, placeId olanları hariç tut)
  var nearbyVenues = [];
  if (p.location) {
    nearbyVenues = (DATA.venues || []).filter(function(v) {
      if (v.placeId === p.id) return false;
      return v.location && v.location.toLowerCase().includes(p.location.toLowerCase().split(',')[0].trim().toLowerCase());
    }).slice(0, 6);
  }
  if (p.villageId && nearbyVenues.length === 0) {
    nearbyVenues = (DATA.venues || []).filter(function(v) {
      if (v.placeId === p.id) return false;
      return v.villageId && v.villageId === p.villageId;
    }).slice(0, 6);
  }

  // Bu yerdeki işletmeler
  if (placeVenues.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    var plEk = typeof bulunmaEki === 'function' ? bulunmaEki(p.title) : '\'daki';
    var plEkSuffix = plEk.substring(1);
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">' + (p.emoji || '📍') + ' ' + p.title + '\u2019' + plEkSuffix + ' Keşfedilecek Mekanlar</h2>';
    bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">';
    placeVenues.forEach(function(venue) {
      var vci = getVenueCatInfo(venue.category); var cs = { bg: vci.color + '14', color: vci.color, label: vci.label, emoji: vci.emoji };
      bodyHtml += '<a href="../mekanlar/mekan-detay.html?id=' + venue.id + '" style="display:block;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:18px;overflow:hidden;text-decoration:none;transition:all .3s cubic-bezier(.16,1,.3,1);" onmouseover="this.style.boxShadow=\'0 12px 36px rgba(26,39,68,.1)\';this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
      if (venue.images && venue.images[0]) {
        bodyHtml += '<div style="position:relative;height:140px;overflow:hidden;background:rgba(26,39,68,.05);"><img src="' + venue.images[0] + '" alt="' + venue.title + '" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease;" loading="lazy" onload="this.style.opacity=1">';
        bodyHtml += '<span style="position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);font-size:.62rem;font-weight:700;color:#fff;">' + cs.emoji + ' ' + cs.label + '</span></div>';
      } else {
        bodyHtml += '<div style="height:100px;background:' + cs.bg + ';display:flex;align-items:center;justify-content:center;font-size:2.5rem;">' + cs.emoji + '</div>';
      }
      bodyHtml += '<div style="padding:14px 16px 16px;"><h4 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.88rem;color:var(--navy);margin:0;">' + venue.title + '</h4></div></a>';
    });
    bodyHtml += '</div></div>';
  }

  if (nearbyVenues.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">🏪 Yakındaki İşletmeler</h2>';
    bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">';
    nearbyVenues.forEach(function(venue) {
      var vci = getVenueCatInfo(venue.category); var cs = { bg: vci.color + '14', color: vci.color, label: vci.label, emoji: vci.emoji };
      bodyHtml += '<a href="../mekanlar/mekan-detay.html?id=' + venue.id + '" style="display:block;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:18px;overflow:hidden;text-decoration:none;transition:all .3s cubic-bezier(.16,1,.3,1);" onmouseover="this.style.boxShadow=\'0 12px 36px rgba(26,39,68,.1)\';this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
      if (venue.images && venue.images[0]) {
        bodyHtml += '<div style="position:relative;height:140px;overflow:hidden;background:rgba(26,39,68,.05);"><img src="' + venue.images[0] + '" alt="' + venue.title + '" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease;" loading="lazy" onload="this.style.opacity=1">';
        bodyHtml += '<span style="position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);font-size:.62rem;font-weight:700;color:#fff;">' + cs.emoji + ' ' + cs.label + '</span></div>';
      } else {
        bodyHtml += '<div style="height:100px;background:' + cs.bg + ';display:flex;align-items:center;justify-content:center;font-size:2.5rem;">' + cs.emoji + '</div>';
      }
      bodyHtml += '<div style="padding:14px 16px 16px;"><h4 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.88rem;color:var(--navy);margin:0;">' + venue.title + '</h4></div></a>';
    });
    bodyHtml += '</div></div>';
  }

  // Bu konumdaki diğer yerler
  var otherPlaces = (DATA.places || []).filter(function(op) {
    if (op.id === p.id) return false;
    if (p.location && op.location && op.location.toLowerCase().includes(p.location.toLowerCase().split(',')[0].trim().toLowerCase())) return true;
    if (p.villageId && op.villageId && op.villageId === p.villageId) return true;
    return false;
  }).slice(0, 6);

  if (otherPlaces.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">🏛 Yakındaki Diğer Yerler</h2>';
    bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">';
    otherPlaces.forEach(function(op) {
      bodyHtml += '<a href="yer-detay.html?id=' + op.id + '" style="display:block;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:18px;overflow:hidden;text-decoration:none;transition:all .3s cubic-bezier(.16,1,.3,1);" onmouseover="this.style.boxShadow=\'0 12px 36px rgba(26,39,68,.1)\';this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
      if (op.image) {
        bodyHtml += '<div style="height:120px;overflow:hidden;background:rgba(26,39,68,.05);"><img src="' + op.image + '" alt="' + (op.title || '') + '" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease;" loading="lazy" onload="this.style.opacity=1"></div>';
      } else {
        bodyHtml += '<div style="height:80px;background:linear-gradient(135deg,rgba(26,39,68,.06),rgba(26,39,68,.02));display:flex;align-items:center;justify-content:center;font-size:2rem;">' + (op.emoji || '🏛') + '</div>';
      }
      bodyHtml += '<div style="padding:14px 16px;"><h4 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.85rem;color:var(--navy);margin:0 0 4px;">' + (op.title || '') + '</h4>';
      if (op.shortDesc) bodyHtml += '<p style="font-size:.72rem;color:var(--text-mid);line-height:1.5;margin:0;">' + op.shortDesc.substring(0, 80) + (op.shortDesc.length > 80 ? '…' : '') + '</p>';
      bodyHtml += '</div></a>';
    });
    bodyHtml += '</div></div>';
  }

  // Bu yerden geçen rotalar
  var placeRoutes = (DATA.routes || []).filter(function(route) {
    if (!route.stops || !route.stops.length) return false;
    return route.stops.some(function(stop) {
      var stopName = (typeof stop === 'string' ? stop : stop.title || '').toLowerCase();
      return stopName.includes(p.title.toLowerCase());
    });
  });

  if (placeRoutes.length > 0) {
    bodyHtml += '<div style="margin-bottom:40px;">';
    bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">🗺 Bu Yerin Dahil Olduğu Rotalar</h2>';
    placeRoutes.forEach(function(route) {
      bodyHtml += '<a href="../rotalar/rota-detay.html?id=' + route.id + '" style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:14px;text-decoration:none;margin-bottom:10px;transition:all .25s;" onmouseover="this.style.boxShadow=\'0 8px 28px rgba(26,39,68,.08)\'" onmouseout="this.style.boxShadow=\'none\'">';
      bodyHtml += '<span style="font-size:1.5rem;">' + (route.emoji || '🗺') + '</span>';
      bodyHtml += '<div><div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.85rem;color:var(--navy);margin-bottom:2px;">' + route.title + '</div>';
      bodyHtml += '<span style="font-size:.7rem;color:var(--text-mid);">' + (route.sure || '') + (route.stops ? ' · ' + route.stops.length + ' durak' : '') + '</span>';
      bodyHtml += '</div></a>';
    });
    bodyHtml += '</div>';
  }

  // Diğer ören yerleri (aynı kategoridekiler + mesafe)
  if (p.category === 'tarihi' || p.category === 'orenyeri') {
    var otherOrenYeri = (DATA.places || []).filter(function(op) {
      return op.id !== p.id && (op.category === 'tarihi' || op.category === 'orenyeri');
    });
    // Mesafe hesapla
    if (p.lat && p.lng) {
      otherOrenYeri.forEach(function(op) {
        if (op.lat && op.lng) {
          var dLat = (op.lat - p.lat) * Math.PI / 180;
          var dLon = (op.lng - p.lng) * Math.PI / 180;
          var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(p.lat*Math.PI/180)*Math.cos(op.lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
          op._dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          op._roadKm = Math.round(op._dist * 1.4);
        }
      });
      otherOrenYeri.sort(function(a, b) { return (a._dist || 999) - (b._dist || 999); });
    }
    if (otherOrenYeri.length > 0) {
      var oyBaslik = otherOrenYeri.length === 1 ? '🏛 Diğer Ören Yeri' : '🏛 Diğer Ören Yerleri';
      bodyHtml += '<div style="margin-bottom:40px;">';
      bodyHtml += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:var(--navy);margin-bottom:18px;">' + oyBaslik + '</h2>';
      bodyHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">';
      otherOrenYeri.forEach(function(op) {
        var distBadge = op._roadKm ? '<span style="position:absolute;bottom:10px;right:10px;font-size:.62rem;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);color:#fff;z-index:1;">~' + op._roadKm + ' km</span>' : '';
        bodyHtml += '<a href="yer-detay.html?id=' + op.id + '" style="display:block;background:#fff;border:1px solid rgba(26,39,68,.07);border-radius:18px;overflow:hidden;text-decoration:none;transition:all .3s cubic-bezier(.16,1,.3,1);" onmouseover="this.style.boxShadow=\'0 12px 36px rgba(26,39,68,.1)\';this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'\'">';
        if (op.image) {
          bodyHtml += '<div style="position:relative;height:120px;overflow:hidden;background:rgba(26,39,68,.05);"><img src="' + op.image + '" alt="' + (op.title || '') + '" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s ease;" loading="lazy" onload="this.style.opacity=1">' + distBadge + '</div>';
        } else {
          bodyHtml += '<div style="position:relative;height:80px;background:linear-gradient(135deg,rgba(26,39,68,.06),rgba(26,39,68,.02));display:flex;align-items:center;justify-content:center;font-size:2rem;">' + (op.emoji || '🏛') + distBadge + '</div>';
        }
        bodyHtml += '<div style="padding:14px 16px;"><h4 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:.85rem;color:var(--navy);margin:0 0 4px;">' + (op.title || '') + '</h4>';
        if (op.shortDesc) bodyHtml += '<p style="font-size:.72rem;color:var(--text-mid);line-height:1.5;margin:0;">' + op.shortDesc.substring(0, 80) + (op.shortDesc.length > 80 ? '…' : '') + '</p>';
        bodyHtml += '</div></a>';
      });
      bodyHtml += '</div></div>';
    }
  }

  bodyHtml += '</div>';
  document.getElementById('place-body').innerHTML = bodyHtml;

  // Favori
  var plIsSaved = window.isPlaceSaved && isPlaceSaved(p.id);
  if (plIsSaved) {
    var sb = document.getElementById('pl-save-btn');
    if (sb) { sb.classList.add('saved'); document.getElementById('pl-save-icon').textContent = '♥'; document.getElementById('pl-save-label').textContent = 'Kaydedildi'; }
  }
  window.plToggleSave = function() {
    if (window.togglePlaceSave) togglePlaceSave(p.id);
    var now = window.isPlaceSaved && isPlaceSaved(p.id);
    var sb = document.getElementById('pl-save-btn');
    if (sb) {
      sb.classList.toggle('saved', now);
      document.getElementById('pl-save-icon').textContent = now ? '♥' : '♡';
      document.getElementById('pl-save-label').textContent = now ? 'Kaydedildi' : 'Kaydet';
    }
  };

  // Paylaş
  var plUrl = window.location.origin + '/yerler/yer-detay.html?id=' + p.id;
  var plText = p.title + ' - Assos\'u Keşfet';
  var plWaText = p.title + '\n' + (p.location || 'Assos Bölgesi') + '\n\n' + plUrl;
  var dd = document.getElementById('pl-share-dd');
  if (dd) {
    dd.innerHTML =
      '<a href="https://wa.me/?text=' + encodeURIComponent(plWaText) + '" target="_blank" rel="noopener" class="vp-share-opt"><span class="vp-share-opt-icon" style="background:#25D366"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.855L0 24l6.335-1.52C8.034 23.46 9.98 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.584-.479-5.104-1.32l-.369-.21-3.76.902.948-3.668-.223-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg></span><span>WhatsApp</span></a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(plUrl) + '" target="_blank" rel="noopener" class="vp-share-opt"><span class="vp-share-opt-icon" style="background:#1877F2"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></span><span>Facebook</span></a>' +
      '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(plText) + '&url=' + encodeURIComponent(plUrl) + '" target="_blank" rel="noopener" class="vp-share-opt"><span class="vp-share-opt-icon" style="background:#000"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span><span>X (Twitter)</span></a>' +
      '<button class="vp-share-opt" onclick="navigator.clipboard.writeText(\'' + plUrl + '\');this.querySelector(\'#pl-copy-lbl\').textContent=\'Kopyalandı!\';setTimeout(function(){document.getElementById(\'pl-copy-lbl\').textContent=\'Kopyala\'},2000)"><span class="vp-share-opt-icon" style="background:rgba(255,255,255,.15)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></span><span id="pl-copy-lbl">Kopyala</span></button>';
  }
  window.plToggleShare = function() {
    var d = document.getElementById('pl-share-dd');
    d.classList.toggle('open');
  };
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('pl-share-wrap');
    var d = document.getElementById('pl-share-dd');
    if (wrap && d && !wrap.contains(e.target)) d.classList.remove('open');
  });

  // FAQ Schema
  var faqItems = [];
  if (p.location) {
    faqItems.push({ q: p.title + ' nerede?', a: p.title + ', ' + p.location + ' bölgesinde, Çanakkale\'nin Ayvacık ilçesine bağlı Assos bölgesinde yer almaktadır.' });
  }
  if (p.description || p.shortDesc) {
    faqItems.push({ q: p.title + ' nedir?', a: p.description || p.shortDesc });
  }
  if (p.lat && p.lng) {
    faqItems.push({ q: p.title + '\'e nasıl gidilir?', a: p.title + '\'e Google Maps veya Apple Haritalar üzerinden yol tarifi alabilirsiniz. Koordinatlar: ' + p.lat + ', ' + p.lng });
  }
  if (nearbyVenues.length > 0) {
    faqItems.push({ q: p.title + ' yakınında yeme içme var mı?', a: p.title + ' yakınında ' + nearbyVenues.length + ' işletme bulunmaktadır: ' + nearbyVenues.slice(0,4).map(function(v){ return v.title; }).join(', ') + '.' });
  }
  if (faqItems.length > 0) {
    var faqSchema = { '@context':'https://schema.org', '@type':'FAQPage', 'mainEntity': faqItems.map(function(item) { return { '@type':'Question', 'name':item.q, 'acceptedAnswer':{ '@type':'Answer', 'text':item.a } }; }) };
    var faqEl = document.createElement('script');
    faqEl.type = 'application/ld+json';
    faqEl.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(faqEl);
  }

  if (typeof trackPageView === 'function') trackPageView('place_' + placeId);
}

/* ═══════════════════
   AI CHAT WIDGET
═══════════════════ */
(function() {
  // Admin panelinde gösterme
  if (window.location.pathname.includes('/admin')) return;

  // CSS
  var chatCSS = document.createElement('style');
  chatCSS.textContent = `
    .ai-chat-fab{position:fixed;bottom:24px;right:24px;z-index:400;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#1A2744,#2A3A5A);color:#fff;border:2px solid rgba(212,147,90,.3);cursor:pointer;box-shadow:0 4px 24px rgba(26,39,68,.3),0 0 0 0 rgba(212,147,90,.2);display:flex;align-items:center;justify-content:center;font-size:1.3rem;transition:all .3s cubic-bezier(.16,1,.3,1);animation:aiFabPulse 3s ease-in-out infinite;}
    @keyframes aiFabPulse{0%,100%{box-shadow:0 4px 24px rgba(26,39,68,.3),0 0 0 0 rgba(212,147,90,.2)}50%{box-shadow:0 4px 24px rgba(26,39,68,.3),0 0 0 8px rgba(212,147,90,0)}}
    .ai-chat-fab:hover{transform:scale(1.1);border-color:rgba(212,147,90,.5);box-shadow:0 6px 32px rgba(26,39,68,.4);}
    .ai-chat-fab.open{animation:none;transform:rotate(0) scale(1);background:linear-gradient(135deg,#1A2744,#2A3A5A);font-size:1.1rem;}
    .ai-chat-panel{position:fixed;bottom:96px;right:24px;z-index:399;width:380px;max-width:calc(100vw - 32px);max-height:520px;background:var(--cream-light,#FAF7F2);border:1px solid rgba(26,39,68,.1);border-radius:24px;box-shadow:0 20px 64px rgba(26,39,68,.2);display:none;flex-direction:column;overflow:hidden;}
    .ai-chat-panel.open{display:flex;animation:aiChatIn .35s cubic-bezier(.16,1,.3,1);}
    @keyframes aiChatIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
    .ai-chat-head{padding:20px 22px 16px;background:linear-gradient(135deg,#1A2744,#243255);color:#F5EDE0;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden;}
    .ai-chat-head::before{content:'';position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(212,147,90,.08);top:-40px;right:-20px;pointer-events:none;}
    .ai-chat-avatar{width:40px;height:40px;border-radius:14px;background:linear-gradient(135deg,rgba(212,147,90,.2),rgba(196,82,26,.15));border:1.5px solid rgba(212,147,90,.3);display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex-shrink:0;}
    .ai-chat-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.92rem;letter-spacing:-.01em;}
    .ai-chat-sub{font-size:.64rem;color:rgba(245,237,224,.4);margin-top:2px;font-weight:500;}
    .ai-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;max-height:320px;}
    .ai-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:.82rem;line-height:1.6;animation:aiMsgIn .3s ease;}
    @keyframes aiMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .ai-msg.bot{background:#fff;color:#1A2744;border:1px solid rgba(26,39,68,.06);align-self:flex-start;border-bottom-left-radius:4px;}
    .ai-msg.user{background:var(--navy,#1A2744);color:#F5EDE0;align-self:flex-end;border-bottom-right-radius:4px;}
    .ai-msg.typing{background:#fff;border:1px solid rgba(26,39,68,.06);align-self:flex-start;padding:12px 18px;}
    .ai-typing-dots{display:flex;gap:4px;align-items:center;}
    .ai-typing-dots span{width:6px;height:6px;border-radius:50%;background:rgba(26,39,68,.25);animation:aiDot 1.2s infinite;}
    .ai-typing-dots span:nth-child(2){animation-delay:.2s}
    .ai-typing-dots span:nth-child(3){animation-delay:.4s}
    @keyframes aiDot{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
    .ai-chat-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid rgba(26,39,68,.06);background:var(--cream-light,#FAF7F2);}
    .ai-chat-input input{flex:1;padding:10px 14px;border:1.5px solid rgba(26,39,68,.1);border-radius:12px;font-size:16px;font-family:inherit;outline:none;background:#fff;transition:border-color .2s;}
    .ai-chat-input input:focus{border-color:var(--terra);}
    .ai-chat-input button{width:38px;height:38px;border-radius:12px;background:var(--terra,#C4521A);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;transition:background .2s;flex-shrink:0;}
    .ai-chat-input button:hover{background:#D96B2E;}
    .ai-chat-input button:disabled{opacity:.4;cursor:default;}
    .ai-chat-limit{text-align:center;font-size:.65rem;color:rgba(26,39,68,.3);padding:4px 16px 8px;}
    .ai-chat-suggestions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
    .ai-chat-sug{padding:7px 12px;border-radius:10px;border:1px solid rgba(26,39,68,.1);background:rgba(26,39,68,.03);font-size:.72rem;font-weight:600;color:var(--navy,#1A2744);cursor:pointer;transition:all .2s;font-family:inherit;}
    .ai-chat-sug:hover{background:var(--terra,#C4521A);color:#fff;border-color:var(--terra);}
    .ai-msg.bot{position:relative;cursor:pointer;}
    .ai-msg.bot:hover::after{content:'📋';position:absolute;top:6px;right:8px;font-size:.6rem;opacity:.4;}
    .ai-msg-copied{position:absolute;top:6px;right:6px;font-size:.58rem;font-weight:700;color:var(--terra,#C4521A);opacity:0;transition:opacity .3s;pointer-events:none;}
    .ai-msg-copied.show{opacity:1;}
    .ai-chat-close{display:none;width:32px;height:32px;border-radius:50%;background:rgba(245,237,224,.12);border:none;color:rgba(245,237,224,.7);font-size:.9rem;cursor:pointer;align-items:center;justify-content:center;margin-left:auto;flex-shrink:0;transition:background .2s;}
    .ai-chat-close:hover{background:rgba(245,237,224,.2);}
    @media(max-width:480px){.ai-chat-panel{bottom:0;right:0;left:0;width:100%;max-width:100%;max-height:75vh;border-radius:20px 20px 0 0;}.ai-chat-fab{bottom:16px;right:16px;width:50px;height:50px;font-size:1.2rem;}.ai-chat-fab.open{display:none;}.ai-chat-close{display:flex;}}
  `;
  document.head.appendChild(chatCSS);

  // HTML
  var chatHTML = `
    <button class="ai-chat-fab" id="ai-chat-fab" onclick="aiChatToggle()" aria-label="Assos Asistan">🧭</button>
    <div class="ai-chat-panel" id="ai-chat-panel">
      <div class="ai-chat-head">
        <div class="ai-chat-avatar">🧭</div>
        <div>
          <div class="ai-chat-title">Assos Rehberiniz</div>
          <div class="ai-chat-sub">Yapay zeka destekli seyahat asistanı</div>
        </div>
        <button class="ai-chat-close" onclick="aiChatToggle()">✕</button>
      </div>
      <div class="ai-chat-body" id="ai-chat-body">
        <div class="ai-msg bot">Merhaba! 🌊 Ben Assos bölgesinin dijital rehberiyim. Aklınıza takılan her şeyi sorun, size özel öneriler sunayım!</div>
        <div class="ai-chat-suggestions" id="ai-suggestions">
          <button class="ai-chat-sug" onclick="aiAskSuggestion(this)">🏨 Nerede kalmalıyım?</button>
          <button class="ai-chat-sug" onclick="aiAskSuggestion(this)">🌊 En güzel koy hangisi?</button>
          <button class="ai-chat-sug" onclick="aiAskSuggestion(this)">🚗 Nasıl gidilir?</button>
          <button class="ai-chat-sug" onclick="aiAskSuggestion(this)">🍽 Nerede yemeli?</button>
          <button class="ai-chat-sug" onclick="aiAskSuggestion(this)">🏛 Ne görmeliyim?</button>
        </div>
      </div>
      <div class="ai-chat-limit" id="ai-chat-limit"></div>
      <div class="ai-chat-input">
        <input type="text" id="ai-chat-input" placeholder="Sorunuzu yazın..." maxlength="500" autocomplete="off">
        <button id="ai-chat-send" onclick="aiChatSend()">➤</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatHTML);

  // Enter tuşu
  document.getElementById('ai-chat-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); aiChatSend(); }
  });

  // Hazır soru tıklama
  window.aiAskSuggestion = function(btn) {
    var q = btn.textContent.trim();
    document.getElementById('ai-chat-input').value = q;
    // Önerileri gizle
    var sug = document.getElementById('ai-suggestions');
    if (sug) sug.style.display = 'none';
    aiChatSend();
  };

  // State
  var AI_DAILY_LIMIT = 10;
  var AI_STORAGE_KEY = 'assos_ai_chat';
  var AI_HISTORY_KEY = 'assos_ai_history';

  function getAiState() {
    try {
      var s = JSON.parse(localStorage.getItem(AI_STORAGE_KEY) || '{}');
      var today = new Date().toISOString().split('T')[0];
      if (s.date !== today) return { date: today, count: 0 };
      return s;
    } catch { return { date: new Date().toISOString().split('T')[0], count: 0 }; }
  }
  function saveAiState(state) { try { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(state)); } catch {} }
  function saveHistory(msg, type) {
    try {
      var hist = JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || '[]');
      hist.push({ text: msg, type: type, ts: Date.now() });
      if (hist.length > 30) hist = hist.slice(-30); // Son 30 mesaj
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(hist));
    } catch {}
  }
  function loadHistory() {
    try {
      var hist = JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || '[]');
      if (hist.length === 0) return;
      // Önerileri gizle
      var sug = document.getElementById('ai-suggestions');
      if (sug) sug.style.display = 'none';
      // Geçmişi render et
      hist.forEach(function(m) { addMsg(m.text, m.type, true); });
    } catch {}
  }
  loadHistory();
  function updateLimit() {
    var s = getAiState();
    var el = document.getElementById('ai-chat-limit');
    if (el) el.textContent = (AI_DAILY_LIMIT - s.count) + '/' + AI_DAILY_LIMIT + ' soru kaldı';
  }
  updateLimit();

  // Site context oluştur
  function buildContext() {
    if (!window.DATA) return '';
    var ctx = '';
    var venues = (DATA.venues || []).slice(0, 40);
    if (venues.length) ctx += 'MEKANLAR (id | ad | kategori | konum | açıklama):\n' + venues.map(function(v) {
      return '- ' + v.id + ' | ' + v.title + ' | ' + (v.category||'') + ' | ' + (v.location||'') + ' | ' + (v.shortDesc||'') + (v.phone ? ' | Tel: ' + v.phone : '');
    }).join('\n') + '\n\n';
    var places = (DATA.places || []).slice(0, 20);
    if (places.length) ctx += 'GEZİLECEK YERLER (id | ad | kategori | konum | açıklama):\n' + places.map(function(p) {
      return '- ' + p.id + ' | ' + p.title + ' | ' + (p.category||'') + ' | ' + (p.location||'') + ' | ' + (p.shortDesc||'');
    }).join('\n') + '\n\n';
    var villages = (DATA.villages || []).slice(0, 20);
    if (villages.length) ctx += 'KÖYLER (id | ad | tür | açıklama):\n' + villages.map(function(v) {
      return '- ' + v.id + ' | ' + v.title + ' | ' + (v.type||'koy') + ' | ' + (v.shortDesc||'');
    }).join('\n') + '\n\n';
    var routes = (DATA.routes || []).slice(0, 10);
    if (routes.length) ctx += 'ROTALAR (id | ad | süre | açıklama):\n' + routes.map(function(r) {
      return '- ' + r.id + ' | ' + r.title + ' | ' + (r.sure||'') + ' | ' + (r.shortDesc||'');
    }).join('\n');
    return ctx;
  }

  // Toggle
  window.aiChatToggle = function() {
    var panel = document.getElementById('ai-chat-panel');
    var fab = document.getElementById('ai-chat-fab');
    panel.classList.toggle('open');
    fab.classList.toggle('open');
    fab.textContent = panel.classList.contains('open') ? '✕' : '🧭';
    var sttBtn = document.getElementById('scroll-top-btn');
    if (sttBtn) sttBtn.style.display = panel.classList.contains('open') ? 'none' : '';
    if (panel.classList.contains('open') && window.innerWidth > 768) document.getElementById('ai-chat-input').focus();
  };

  // Send
  window.aiChatSend = async function() {
    var input = document.getElementById('ai-chat-input');
    var msg = (input.value || '').trim();
    if (!msg) return;

    var state = getAiState();
    if (state.count >= AI_DAILY_LIMIT) {
      addMsg('Günlük soru limitinize ulaştınız. Yarın tekrar sorabilirsiniz 🙏', 'bot');
      return;
    }

    input.value = '';
    addMsg(msg, 'user');

    // Typing indicator
    var body = document.getElementById('ai-chat-body');
    var typing = document.createElement('div');
    typing.className = 'ai-msg typing';
    typing.innerHTML = '<div class="ai-typing-dots"><span></span><span></span><span></span></div>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    var sendBtn = document.getElementById('ai-chat-send');
    sendBtn.disabled = true;

    try {
      var resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: buildContext() })
      });
      var data = await resp.json();
      typing.remove();
      if (data.reply) {
        addMsg(data.reply, 'bot');
        state.count++;
        saveAiState(state);
        updateLimit();
      } else {
        addMsg(data.error || 'Bir hata oluştu, tekrar deneyin.', 'bot');
      }
    } catch(err) {
      typing.remove();
      addMsg('Bağlantı hatası. Lütfen tekrar deneyin.', 'bot');
    }
    sendBtn.disabled = false;
  };

  function mdToHtml(text) {
    var linkStyle = 'color:var(--terra);font-weight:600;text-decoration:underline;';
    // 1. Markdown linkleri [text](url) — https:// olsun olmasın
    var result = text.replace(/\[([^\]]+)\]\((https?:\/\/)?assosukesfet\.com\/([^)]+)\)/g, '<a href="https://assosukesfet.com/$3" target="_blank" rel="noopener" style="' + linkStyle + '">$1</a>');
    // 2. Düz URL'leri tıklanabilir yap (https:// olsun olmasın)
    result = result.replace(/(?<!["=\/])((?:https?:\/\/)?assosukesfet\.com\/[^\s<,)"]+)/g, function(url) {
      if (result.indexOf('href="' + url) > -1 || result.indexOf('href="https://' + url) > -1) return url;
      // Sondaki noktalama temizle
      var clean = url.replace(/[.)]+$/, '');
      if (clean.indexOf('https://') !== 0) clean = 'https://' + clean;
      var name = 'Detayı Gör →';
      if (clean.indexOf('mekan-detay') > -1) name = '🏪 Mekana Git →';
      else if (clean.indexOf('yer-detay') > -1) name = '📍 Yeri Gör →';
      else if (clean.indexOf('koy-detay') > -1) name = '🏘 Köyü Gör →';
      else if (clean.indexOf('rota-detay') > -1) name = '🗺 Rotayı Gör →';
      return '<a href="' + clean + '" target="_blank" rel="noopener" style="' + linkStyle + '">' + name + '</a>';
    });
    // 3. Markdown formatları
    result = result
      .replace(/^### (.+)$/gm, '<strong style="font-size:.85rem">$1</strong>')
      .replace(/^## (.+)$/gm, '<strong style="font-size:.9rem">$1</strong>')
      .replace(/^# (.+)$/gm, '<strong style="font-size:.95rem">$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/- (.+?)(?=<br>|$)/g, '• $1');
    return result;
  }
  function addMsg(text, type, skipSave) {
    var body = document.getElementById('ai-chat-body');
    var div = document.createElement('div');
    div.className = 'ai-msg ' + type;
    if (type === 'bot') {
      div.innerHTML = mdToHtml(text);
      // Kopyalama
      div.addEventListener('click', function() {
        var plain = text.replace(/\*\*/g,'').replace(/\*/g,'').replace(/#{1,3}\s/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
        navigator.clipboard.writeText(plain).then(function() {
          var badge = div.querySelector('.ai-msg-copied');
          if (!badge) { badge = document.createElement('span'); badge.className = 'ai-msg-copied'; badge.textContent = 'Kopyalandı!'; div.appendChild(badge); }
          badge.classList.add('show');
          setTimeout(function() { badge.classList.remove('show'); }, 1500);
        }).catch(function() {});
      });
    } else {
      div.textContent = text;
    }
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    // Geçmişe kaydet
    if (!skipSave) saveHistory(text, type);
    // Önerileri gizle
    var sug = document.getElementById('ai-suggestions');
    if (sug && !skipSave) sug.style.display = 'none';
  }
})();
