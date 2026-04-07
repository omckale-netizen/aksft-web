/* ═══════════════════════════════════════════
   ASSOS'U KEŞFET — SHARED JS
   Nav, Footer, Search, Utilities
═══════════════════════════════════════════ */

/* ── HTML attribute escape (XSS koruması) ── */
function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── Preconnect (erken baglanti) ── */
(function() {
  var hosts = ['https://firestore.googleapis.com','https://www.gstatic.com','https://fonts.googleapis.com','https://fonts.gstatic.com','https://firebasestorage.googleapis.com'];
  hosts.forEach(function(h) {
    var l = document.createElement('link');
    l.rel = 'preconnect';
    l.href = h;
    l.crossOrigin = '';
    document.head.insertBefore(l, document.head.firstChild);
  });
})();

/* ── Site logo (cache + Firebase) ── */
var SITE_LOGO = localStorage.getItem('site_logo_url') || '';
function _fetchSiteLogo() {
  if (typeof firebase === 'undefined' || !firebase.firestore) return;
  firebase.firestore().collection('settings').doc('site').get().then(function(doc) {
    if (doc.exists && doc.data().logoUrl) {
      var url = doc.data().logoUrl;
      if (url !== SITE_LOGO) {
        SITE_LOGO = url;
        localStorage.setItem('site_logo_url', url);
        document.querySelectorAll('.site-logo-img').forEach(function(img) { img.src = SITE_LOGO; });
      }
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
    .nav-logo{display:flex;align-items:center;flex-shrink:0;text-decoration:none;}
    .nav-logo img{height:30px;min-width:120px;width:auto;transition:opacity .2s;}
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
    .mm-header img{height:28px;min-width:110px;width:auto;opacity:.7;}
    #close-menu-btn{background:rgba(245,237,224,.08);border:1.5px solid rgba(245,237,224,.14);border-radius:10px;padding:8px 13px;color:var(--cream);font-size:1rem;cursor:pointer;transition:background .2s;line-height:1;}
    #close-menu-btn:hover{background:rgba(245,237,224,.15);}
    .mm-links{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 28px;gap:2px;}
    .mm-link{display:flex;align-items:center;gap:16px;padding:14px 16px;border-radius:14px;text-decoration:none;transition:background .2s,color .2s;color:rgba(245,237,224,.45);}
    .mm-link:hover,.mm-link.active{background:rgba(245,237,224,.06);color:var(--cream);}
    .mm-link .mm-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:.62rem;font-weight:800;letter-spacing:.12em;color:rgba(245,237,224,.2);min-width:28px;}
    .mm-link .mm-label{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:-.025em;line-height:1.1;}
    .mm-link:hover .mm-num,.mm-link.active .mm-num{color:var(--terra);}
    .mm-footer{padding:20px 28px 32px;border-top:1px solid rgba(245,237,224,.06);display:flex;align-items:center;justify-content:space-between;}
    .mm-footer span{font-size:.72rem;color:rgba(245,237,224,.2);letter-spacing:.08em;text-transform:uppercase;}
    #mobile-menu .btn-terra{padding:9px 20px;font-size:.78rem;}

    /* SEARCH OVERLAY */
    .search-dropdown{position:absolute;top:calc(100% + 10px);left:0;right:0;z-index:500;background:rgba(15,24,41,.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;overflow-y:auto;max-height:420px;box-shadow:0 24px 64px rgba(0,0,0,.5);display:none;}
    .search-dropdown.open{display:block;}
    .search-result-item{display:flex;align-items:center;gap:14px;padding:14px 18px;cursor:pointer;text-decoration:none;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.04);}
    .search-result-item:last-child{border-bottom:none;}
    .search-result-item:hover{background:rgba(255,255,255,.06);}
    .search-result-emoji{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex-shrink:0;}
    .search-result-info{flex:1;min-width:0;}
    .search-result-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:#F5EDE0;line-height:1.3;}
    .search-result-sub{font-size:.72rem;color:rgba(245,237,224,.4);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .search-result-type{font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:999px;flex-shrink:0;}
    .search-no-results{padding:28px;text-align:center;color:rgba(245,237,224,.35);font-size:.85rem;}
    .search-group-label{padding:10px 18px 6px;font-size:.65rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,237,224,.25);}
    @media(max-width:640px){
      .search-dropdown{position:fixed;top:auto;bottom:0;left:0;right:0;border-radius:20px 20px 0 0;max-height:60vh;box-shadow:0 -12px 48px rgba(0,0,0,.5);}
    }

    /* FOOTER */
    #site-footer{position:relative;overflow:hidden;background:linear-gradient(170deg,#0C1730 0%,#0A1220 60%,#0E1A2E 100%);padding:0 24px 0;border-top:1px solid rgba(245,237,224,.07);}
    #site-footer::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 15% 20%,rgba(26,107,138,.08) 0%,transparent 60%),radial-gradient(ellipse 50% 60% at 85% 80%,rgba(196,82,26,.06) 0%,transparent 60%);pointer-events:none;}
    #site-footer .footer-inner{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:64px 0 0;}
    #site-footer .footer-glass{background:rgba(255,255,255,.03);border:1px solid rgba(245,237,224,.07);border-radius:24px;padding:48px 48px 40px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);margin-bottom:32px;}
    #site-footer .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;}
    #site-footer .footer-brand-desc{font-size:.82rem;color:rgba(245,237,224,.42);line-height:1.78;max-width:260px;margin-top:14px;}
    #site-footer .footer-col-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.7rem;letter-spacing:.13em;text-transform:uppercase;color:rgba(245,237,224,.25);margin-bottom:14px;}
    #site-footer a{color:rgba(245,237,224,.48);text-decoration:none;font-size:.82rem;transition:color .2s;display:block;margin-bottom:9px;}
    #site-footer a:hover{color:var(--cream);}
    #site-footer .footer-divider{border:none;border-top:1px solid rgba(245,237,224,.07);margin:0 0 24px;}
    #site-footer .footer-bottom{padding-bottom:32px;text-align:center;}
    #site-footer .footer-bottom span{font-size:.72rem;color:rgba(245,237,224,.2);}

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
    .place-card .place-img{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;font-size:2.5rem;position:relative;overflow:hidden;}
    .place-card .place-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
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
  const preconn = document.createElement('link');
  preconn.rel = 'preconnect';
  preconn.href = 'https://fonts.gstatic.com';
  preconn.crossOrigin = '';
  document.head.insertBefore(preconn, link);
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
    { href: 'rehber.html',   label: 'Rehber' },
  ];

  const isActive = (href) => href === currentPage || (currentPage === '' && href === 'index.html');

  const navHTML = `
    <div id="mobile-menu" role="dialog" aria-label="Navigasyon menüsü" aria-hidden="true">
      <div class="mm-header">
        <a href="${basePath}index.html"><img class="site-logo-img" ${SITE_LOGO ? 'src="' + SITE_LOGO + '"' : ''} data-logo="1" alt="Assos'u Keşfet"></a>
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
          <img class="site-logo-img" ${SITE_LOGO ? 'src="' + SITE_LOGO + '"' : ''} data-logo="1" alt="Assos'u Keşfet">
        </a>
        <div class="nav-links">
          ${links.map(l => `<a href="${basePath}${l.href}" class="nav-link${isActive(l.href) ? ' active' : ''}">${l.label}</a>`).join('')}
        </div>
        <div class="nav-right">
          <div class="nav-divider"></div>
          <button id="nav-save-btn" class="nav-save-btn" onclick="openSaveDrawer()" aria-label="Kaydedilenler">
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
      .sd-venue-img { width:52px; height:52px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; filter:drop-shadow(0 2px 6px rgba(0,0,0,.25)); }
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
      .sd-sync-inp{flex:1;padding:8px 12px;border:1.5px solid rgba(26,39,68,.1);border-radius:8px;font-size:.82rem;font-family:inherit;outline:none;letter-spacing:.1em;text-transform:uppercase;}
      .sd-sync-inp:focus{border-color:#C4521A;}
      .sd-sync-load{padding:8px 14px;border:none;border-radius:8px;background:#1A2744;color:#fff;font-size:.75rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s;}
      .sd-sync-load:hover{background:#2A3A5A;}
      .sd-clear-btn { width:100%; padding:10px; border-radius:12px; border:1.5px solid rgba(26,39,68,.1); background:transparent; color:#718096; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .2s; font-family:inherit; }
      .sd-clear-btn:hover { border-color:rgba(196,82,26,.3); color:#C4521A; background:rgba(196,82,26,.04); }
      .sd-go-btn { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:11px; border-radius:12px; background:#1A2744; color:#fff; font-size:.8rem; font-weight:700; text-decoration:none; margin-top:8px; transition:background .2s; }
      .sd-go-btn:hover { background:#2A3A5A; }
    `;
    document.head.appendChild(s);
  }

  /* ── Save drawer HTML (once per session) ── */
  if (!document.getElementById('save-drawer')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="save-overlay" onclick="closeSaveDrawer()"></div>
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
              <span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--navy);">Kesif Listenizi Paylasin</span>
            </div>
            <div class="sd-sync-hint" style="margin-bottom:12px;">Bu kod sizin Assos rotaniz! Arkadaslariniza gonderin, ayni listeyi gorsunler. Baska cihaziniza aktarmak icin de kullanabilirsiniz.</div>
            <div class="sd-sync-row" style="margin-bottom:10px;">
              <span class="sd-sync-label">Kodunuz</span>
              <span class="sd-sync-code" id="sd-sync-code" onclick="navigator.clipboard.writeText(this.textContent).then(()=>{this.dataset.tip='Kopyalandi!';setTimeout(()=>this.dataset.tip='',1500)})">—</span>
              <button onclick="navigator.clipboard.writeText(document.getElementById('sd-sync-code').textContent).then(()=>{this.textContent='Kopyalandi!';setTimeout(()=>this.textContent='Kopyala',1500)})" style="padding:5px 10px;border:1px solid rgba(26,39,68,.12);border-radius:6px;background:#fff;font-size:.68rem;font-weight:600;cursor:pointer;color:var(--navy);font-family:inherit;transition:all .15s;">Kopyala</button>
            </div>
            <div style="height:1px;background:rgba(26,39,68,.06);margin:10px 0;"></div>
            <div class="sd-sync-row">
              <input type="text" id="sd-sync-input" class="sd-sync-inp" placeholder="Kodu yapistirin..." maxlength="8">
              <button class="sd-sync-load" onclick="loadFavCode()">Yukle</button>
              <button onclick="refreshFavCode()" style="padding:5px 10px;border:1px solid rgba(26,39,68,.12);border-radius:6px;background:#fff;font-size:.78rem;cursor:pointer;color:var(--navy);font-family:inherit;transition:all .15s;" title="Listeyi guncelle">🔄</button>
            </div>
            <div id="sd-sync-status" style="font-size:.72rem;margin-top:6px;min-height:16px;"></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="sd-clear-btn" onclick="clearAllSaves()" style="flex:1">Tumunu Temizle</button>
            <a class="sd-go-btn" id="sd-go-link" href="mekanlar.html" style="flex:1;text-align:center">Mekanlar →</a>
          </div>
        </div>
      </div>
    `);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSaveDrawer(); });
  }

  /* ── Save drawer global functions ── */
  const SD_KEY  = 'assos_mk_saves';
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

  function getMekanPath(id) {
    const p = window.location.pathname;
    if (p.includes('/mekanlar/')) return 'detay.html?id=' + id;
    if (p.includes('/rotalar/'))  return '../mekanlar/mekan-detay.html?id=' + id;
    return 'mekanlar/mekan-detay.html?id=' + id;
  }
  function getMekanListPath() {
    const p = window.location.pathname;
    if (p.includes('/mekanlar/')) return '../mekanlar.html';
    if (p.includes('/rotalar/'))  return '../mekanlar.html';
    return 'mekanlar.html';
  }

  window.updateSaveNavCount = function () {
    try {
      const saved = new Set(JSON.parse(localStorage.getItem(SD_KEY) || '[]'));
      const btn   = document.getElementById('nav-save-btn');
      const badge = document.getElementById('nav-save-count');
      if (!btn || !badge) return;
      if (saved.size > 0) {
        badge.textContent = saved.size;
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

  window.openSaveDrawer = function () {
    renderSaveDrawer();
    document.getElementById('save-drawer').classList.add('open');
    document.getElementById('save-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

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

  window.clearAllSaves = function () {
    localStorage.removeItem(SD_KEY);
    renderSaveDrawer();
    window.updateSaveNavCount();
    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.classList.remove('saved');
      const icon = btn.querySelector('.act-icon, #vp-save-icon');
      const label = btn.querySelector('.act-label, #vp-save-label');
      if (icon)  icon.textContent  = '♡';
      if (label) label.textContent = 'Kaydet';
      if (!icon && !btn.querySelector('span')) btn.textContent = '♡';
    });
  };

  function renderSaveDrawer() {
    let saved;
    try { saved = new Set(JSON.parse(localStorage.getItem(SD_KEY) || '[]')); }
    catch { saved = new Set(); }

    const body   = document.getElementById('sd-body');
    const footer = document.getElementById('sd-footer');
    const count  = document.getElementById('sd-count');
    const goLink = document.getElementById('sd-go-link');
    if (!body) return;

    count.textContent = saved.size;
    if (goLink) goLink.href = getMekanListPath();

    if (saved.size === 0) {
      body.innerHTML = `
        <div class="sd-empty">
          <div class="sd-empty-icon">♡</div>
          <p class="sd-empty-text">Henüz kaydettiğin mekan yok.<br>Beğendiğin yerleri ♡ ile işaretle.</p>
          <a class="sd-empty-link" href="${getMekanListPath()}">Mekanları Keşfet →</a>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    const venues = (typeof DATA !== 'undefined' ? DATA.venues : []).filter(v => saved.has(v.id));

    /* Kategoriye göre grupla */
    const groups = {};
    venues.forEach(v => {
      const m = SD_VMETA[v.id] || { g:'linear-gradient(160deg,#1A2744,#2A3A5A)', cat:v.category||'diger', catBg:'rgba(26,39,68,.08)', catC:'#4A5568', catL:v.tagText||v.category||'Diğer' };
      if (!groups[m.cat]) groups[m.cat] = { m, items:[] };
      groups[m.cat].items.push(v);
    });
    const cats = Object.keys(groups).sort((a,b) => groups[b].items.length - groups[a].items.length);

    body.innerHTML = cats.map((cat, ci) => {
      const { m, items } = groups[cat];
      const header = `
        <div style="display:flex;align-items:center;gap:7px;padding:${ci===0?'4':'16'}px 2px 8px;">
          <span style="font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${m.catC};">${m.catL}</span>
          <span style="font-size:.6rem;font-weight:700;padding:1px 7px;border-radius:999px;background:${m.catBg};color:${m.catC};">${items.length}</span>
          <div style="flex:1;height:1px;background:rgba(26,39,68,.08);"></div>
        </div>`;
      const cards = items.map(v => `
        <a class="sd-venue" href="${getMekanPath(v.id)}">
          <div class="sd-venue-img" style="background:${m.g};">${v.emoji}</div>
          <div class="sd-venue-info">
            <div class="sd-venue-name">${v.title}</div>
            <div class="sd-venue-loc">📍 ${v.location}</div>
          </div>
          <button class="sd-venue-remove" onclick="removeSave('${escAttr(v.id)}',event)" aria-label="Kaldır">✕</button>
        </a>`).join('');
      return header + cards;
    }).join('');

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

  // Favorileri Firebase'e kaydet
  window.syncFavToFirebase = function() {
    function doSync() {
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        setTimeout(doSync, 1000);
        return;
      }
      const code = getFavCode();
      let saved;
      try { saved = JSON.parse(localStorage.getItem(SD_KEY) || '[]'); } catch { saved = []; }
      firebase.firestore().collection('favorites').doc(code).set({
        venues: saved,
        updatedAt: new Date().toISOString()
      }, { merge: true }).then(() => {
        console.log('Favoriler senkronlandi:', code, saved.length, 'mekan');
      }).catch(err => console.warn('Favori sync hatasi:', err));
    }
    doSync();
    // Kodu göster
    const codeEl = document.getElementById('sd-sync-code');
    if (codeEl) codeEl.textContent = code;
  };

  // Kod ile favorileri yükle
  window.loadFavCode = async function() {
    const input = document.getElementById('sd-sync-input');
    const statusEl = document.getElementById('sd-sync-status');
    const code = (input?.value || '').trim().toUpperCase();
    if (statusEl) statusEl.innerHTML = '';
    if (!code || code.length < 4) { if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Gecerli bir kod girin.</span>'; return; }
    if (typeof firebase === 'undefined' || !firebase.firestore) { if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Baglanti hatasi.</span>'; return; }
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-muted)">Yukleniyor...</span>';
    try {
      const doc = await firebase.firestore().collection('favorites').doc(code).get();
      if (!doc.exists) { if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Bu kodla eslesen liste bulunamadi.</span>'; return; }
      const data = doc.data();
      if (data.venues && Array.isArray(data.venues)) {
        localStorage.setItem(SD_KEY, JSON.stringify(data.venues));
        localStorage.setItem(FAV_CODE_KEY, code);
        renderSaveDrawer();
        window.updateSaveNavCount();
        if (input) input.value = '';
        const codeEl = document.getElementById('sd-sync-code');
        if (codeEl) codeEl.textContent = code;
        if (statusEl) statusEl.innerHTML = '<span style="color:#38A169">✓ ' + data.venues.length + ' mekan basariyla yuklendi!</span>';
      }
    } catch(err) {
      if (statusEl) { statusEl.innerHTML = '<span style="color:#E53E3E">Yukleme hatasi: </span>'; statusEl.querySelector('span').appendChild(document.createTextNode(err.message)); }
    }
  };

  // Mevcut kodu Firebase'den yeniden çek
  window.refreshFavCode = async function() {
    const statusEl = document.getElementById('sd-sync-status');
    const code = getFavCode();
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-muted)">Guncelleniyor...</span>';
    try {
      const doc = await firebase.firestore().collection('favorites').doc(code).get();
      if (doc.exists && doc.data().venues) {
        localStorage.setItem(SD_KEY, JSON.stringify(doc.data().venues));
        renderSaveDrawer();
        window.updateSaveNavCount();
        if (statusEl) statusEl.innerHTML = '<span style="color:#38A169">✓ Liste guncellendi! ' + doc.data().venues.length + ' mekan.</span>';
      } else {
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-muted)">Liste zaten guncel.</span>';
      }
    } catch(err) {
      if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E">Guncelleme hatasi.</span>';
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
      <div class="footer-inner">
        <div class="footer-glass">
          <div class="footer-grid">
            <div class="footer-brand">
              <img class="site-logo-img" ${SITE_LOGO ? 'src="' + SITE_LOGO + '"' : ''} data-logo="1" alt="Assos'u Keşfet" style="height:44px;width:auto;">
              <p class="footer-brand-desc">Assos bölgesinde gezilecek yerler, köyler, mekanlar ve tarihi duraklar için kapsamlı bir dijital keşif platformu.</p>
            </div>
            <div>
              <p class="footer-col-title">Keşfet</p>
              <a href="${basePath}rotalar.html">Rotalar</a>
              <a href="${basePath}yerler.html">Gezilecek Yerler</a>
              <a href="${basePath}mekanlar.html">Mekanlar</a>
              <a href="${basePath}koyler.html">Köyler</a>
            </div>
            <div>
              <p class="footer-col-title">Bölgeler</p>
              <a href="${basePath}koyler.html">Behramkale</a>
              <a href="${basePath}koyler.html">Adatepe</a>
              <a href="${basePath}koyler.html">Babakale</a>
              <a href="${basePath}yerler.html">Kadırga Koyu</a>
            </div>
            <div>
              <p class="footer-col-title">Rehber</p>
              <a href="${basePath}rehber.html">Assos Rehberi</a>
              <a href="${basePath}rehber.html">Mevsimler</a>
              <a href="${basePath}hakkimizda.html">Hakkımızda</a>
              <a href="${basePath}iletisim.html">İletişim</a>
            </div>
          </div>
        </div>
        <hr class="footer-divider">
        <div class="footer-bottom">
          <span>© 2026 Assos'u Keşfet. Tüm hakları saklıdır.</span>
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
      bottom: 28px;
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
    if (type === 'place')   return `${base}yerler.html#${id}`;
    if (type === 'venue')   return `${base}mekanlar/mekan-detay.html?id=${id}`;
    if (type === 'village') return `${base}koyler.html#${id}`;
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
      dropdown.innerHTML = '<div class="search-no-results">Sonuc bulunamadi: "<strong style="color:var(--cream)">' + q.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') + '</strong>"</div>';
    } else {
      dropdown.innerHTML = results.map(r => {
        const lbl = getTypeLabel(r.type);
        const url = getUrl(r.type, r.id);
        return `<a class="search-result-item" href="${url}">
          <div class="search-result-emoji">${r.emoji}</div>
          <div style="flex:1;min-width:0;">
            <div class="search-result-title">${r.title}</div>
            <div class="search-result-sub">${r.sub || ''}</div>
          </div>
          <span class="search-result-type" style="background:${lbl.bg};color:${lbl.color};">${lbl.text}</span>
        </a>`;
      }).join('');
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
   PLACE CARD RENDERER
═══════════════════ */
const PLACE_COLORS = { tarihi: ['#2A3F6A','#1A2744'], koy: ['#1A5060','#0D3040'], koyu: ['#3A2A1A','#5A3C20'], iskele: ['#1A3050','#0D2040'] };
function placeCardHTML(p, delay = 0) {
  const [c1, c2] = PLACE_COLORS[p.category] || ['#243255','#1A2744'];
  const catLabels = { tarihi: 'Antik Alan', koy: 'Koy', koyu: 'Köy', iskele: 'İskele' };
  const catColors = { tarihi: 'rgba(26,39,68,.7)', koy: 'rgba(26,107,138,.75)', koyu: 'rgba(196,82,26,.75)', iskele: 'rgba(26,39,68,.75)' };
  return `
    <a class="place-card fade-up" href="yerler.html?id=${p.id}" data-delay="${delay}" aria-label="${p.title}">
      <div class="place-img" style="background:linear-gradient(135deg,${c1},${c2});">
        ${p.image ? '<img src="' + p.image + '" alt="' + p.title + '" loading="lazy" style="object-position:center ' + (p.imagePos != null ? p.imagePos : 50) + '%">' : '<span class="place-emoji-fallback">' + p.emoji + '</span>'}
      </div>
      <span class="place-cat-badge" style="position:absolute;top:12px;left:12px;background:${catColors[p.category] || catColors.tarihi};color:#fff;backdrop-filter:blur(8px);">${catLabels[p.category] || p.category}</span>
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
};
const ROUTE_ZORLUK_ICO = {'Kolay':'🟢','Çok Kolay':'🟢','Orta':'🟡','Zor':'🔴'};
const ROUTE_TEMPO_ICO  = {'Sakin':'🌿','Aktif':'⚡','Keşif':'🔍','Dinlendirici':'🛋','Yavaş':'🐢'};

function renderRoutePage(routeId) {
  if (!window.DATA) { console.error('DATA not loaded'); return; }
  const r = DATA.routes.find(x => x.id === routeId);
  if (!r) { console.error('Route not found:', routeId); return; }
  const p = ROUTE_PAL[routeId] || ROUTE_PAL['bir-gunde-assos'];

  document.title = r.title + ' — Assos\'u Keşfet';

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
  const stopsHTML = r.stops.map(s => `
    <div class="rp-stop fade-up">
      <div class="rp-stop-dot">${s.no}</div>
      <div class="rp-stop-card">
        <div class="rp-stop-head">
          <div class="rp-stop-emo" style="background:${p.stopBg};">${s.emoji}</div>
          <div><div class="rp-stop-name">${s.title}</div><div class="rp-stop-dur">⏱ ${s.duration}</div></div>
        </div>
        <div class="rp-stop-body">
          <p class="rp-stop-txt">${s.desc}</p>
          ${s.tip ? `<div class="rp-stop-tip">${s.tip}</div>` : ''}
        </div>
      </div>
    </div>`).join('');

  const tipsHTML = r.tips.map((t, i) => `
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
  const url = window.location.href.split('?')[0].split('#')[0];
  const title = decodeURIComponent(encodedTitle) + ' — Assos\'u Keşfet';
  const text  = decodeURIComponent(encodedDesc);
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const t = document.getElementById('rp-toast');
      if (t) { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
    }).catch(() => { prompt('Bu linki kopyala:', url); });
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
  return `
    <a class="venue-card fade-up" href="mekanlar.html?id=${v.id}" data-delay="${delay}" aria-label="${v.title}" style="display:block;padding:22px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div style="width:46px;height:46px;border-radius:13px;background:${VENUE_ICONS[v.category]||'rgba(26,39,68,.06)'};display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${v.emoji}</div>
        <span style="font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:${VENUE_TAG_COLORS[v.category]||'rgba(26,39,68,.06)'};color:${VENUE_TAG_TEXT[v.category]||'var(--text-mid)'};">${VENUE_LABELS[v.category]||v.category}</span>
      </div>
      <h3 style="margin-bottom:6px;">${v.title}</h3>
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
  function generateHighlights(tags) {
    if (!tags || tags.length === 0) return [];
    const used = new Set();
    const result = [];
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
      } else {
        result.push('✦ ' + tag.charAt(0).toUpperCase() + tag.slice(1));
      }
    }
    return result;
  }
  const highlights = generateHighlights(v.tags);

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
  const waContactMsg = encodeURIComponent('Merhaba! *Assos\'u Kesfet* (assosukesfet.com) uzerinden ulasiyorum.\n\n' + v.title + ' hakkinda bilgi almak istiyorum.');
  const waContactUrl = `https://wa.me/${waNum}?text=${waContactMsg}`;

  /* ── Today's hours helper ── */
  /* ── Open/closed logic ── */
  const dayNames = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const todayName = dayNames[new Date().getDay()];
  const todayHours = (() => {
    if (!v.weeklyHours || v.weeklyHours.length === 0) return v.hours || '—';
    for (const entry of v.weeklyHours) {
      if (!entry.days) continue;
      const d = entry.days.toLowerCase();
      if (d.includes('her gün') || d.includes('resepsiyon')) return entry.hours;
      if (d.includes('pazartesi') && d.includes('perşembe') && ['Pazartesi','Salı','Çarşamba','Perşembe'].includes(todayName)) return entry.hours;
      if (d.includes('cuma') && d.includes('pazar') && ['Cuma','Cumartesi','Pazar'].includes(todayName)) return entry.hours;
      if (d.includes('nisan') && d.includes('ekim')) { const m = new Date().getMonth(); return (m >= 3 && m <= 9) ? entry.hours : null; }
      if (d.includes('kasım') && d.includes('mart')) { const m = new Date().getMonth(); return (m <= 2 || m >= 10) ? entry.hours : null; }
    }
    return v.weeklyHours[0].hours;
  })();
  const isNowOpen = (() => {
    if (!todayHours || todayHours === '—' || todayHours.toLowerCase() === 'kapalı') return false;
    const match = todayHours.match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
    if (!match) return null;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = parseInt(match[1]) * 60 + parseInt(match[2]);
    const close = parseInt(match[3]) * 60 + parseInt(match[4]);
    return mins >= open && mins < close;
  })();
  const openBadge = isNowOpen === true
    ? '<span class="vp-open-badge vp-open">Açık</span>'
    : isNowOpen === false
    ? '<span class="vp-open-badge vp-closed">Kapalı</span>'
    : '';

  /* ── Inject CSS (once) ── */
  if (!document.getElementById('vp-styles')) {
    const s = document.createElement('style');
    s.id = 'vp-styles';
    s.textContent = `
      /* ── VP Hero (compact 2-col) ── */
      .vp-hero{position:relative;min-height:520px;display:flex;align-items:center;padding:0 36px 48px;overflow:hidden;}
      .vp-hero-bg{position:absolute;inset:0;z-index:0;}
      .vp-hblob{position:absolute;border-radius:50%;filter:blur(100px);will-change:transform;}
      .vp-hblob-1{animation:vpBlob1 16s ease-in-out infinite alternate;}
      .vp-hblob-2{animation:vpBlob2 13s ease-in-out infinite alternate;}
      .vp-hblob-3{animation:vpBlob3 19s ease-in-out infinite alternate;}
      @keyframes vpBlob1{0%{transform:translate(0,0) scale(1);}100%{transform:translate(60px,-50px) scale(1.18);}}
      @keyframes vpBlob2{0%{transform:translate(0,0) scale(1);}100%{transform:translate(-50px,40px) scale(1.22);}}
      @keyframes vpBlob3{0%{transform:translate(0,0) scale(1);}100%{transform:translate(30px,60px) scale(0.88);}}
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
      .vp-body-inner{max-width:1100px;margin:0 auto;padding:0 28px 100px;}
      .vp-section{padding:52px 0;border-bottom:1px solid rgba(26,39,68,.07);}
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
      .vp-gimg img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s cubic-bezier(.16,1,.3,1);}
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

      /* ── Reservation form ── */
      .vp-rezv-box{background:#fff;border-radius:20px;padding:28px 32px;box-shadow:0 4px 20px rgba(26,39,68,.06);}
      .vp-rezv-form{display:flex;flex-direction:column;gap:16px;}
      .vp-rezv-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
      @media(max-width:540px){.vp-rezv-row{grid-template-columns:1fr;}.vp-rezv-box{padding:22px 20px;}}
      .vp-rezv-field{display:flex;flex-direction:column;gap:6px;}
      .vp-rezv-label{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#718096;}
      .vp-rezv-input{border:1.5px solid rgba(26,39,68,.12);border-radius:10px;padding:10px 14px;font-size:.88rem;color:#1A2744;background:#FAFAFA;outline:none;transition:border-color .2s;font-family:inherit;}
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
    `;
    document.head.appendChild(s);
  }

  /* ── Hero ── */
  document.getElementById('vp-hero').innerHTML = `
    <div class="vp-hero">
      <div class="vp-hero-bg" style="background:${G};"></div>
      <div class="vp-hblob vp-hblob-1" style="width:480px;height:480px;background:${meta.accent};opacity:.22;top:-15%;left:8%;"></div>
      <div class="vp-hblob vp-hblob-2" style="width:360px;height:360px;background:${meta.accent};opacity:.16;bottom:8%;right:-4%;"></div>
      <div class="vp-hblob vp-hblob-3" style="width:280px;height:280px;background:${meta.accent};opacity:.12;top:40%;left:55%;"></div>
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
          <h1 class="vp-hero-title">${v.title}</h1>
          <div class="vp-hero-loc">📍 ${v.address || v.location + ', Ayvacık, Çanakkale'}</div>
          <div class="vp-hero-chips">
            ${openBadge}
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="vp-hero-map-btn">🗺 Yol Tarifi Al</a>
            ${v.website ? '<a href="' + v.website + '" target="_blank" rel="noopener noreferrer" class="vp-hero-map-btn">🌐 Web Sitesi</a>' : ''}
          </div>
        </div>
        <div class="vp-hero-right">
          <div class="vp-hero-card">
            <div class="vp-hero-card-header">
              <div class="vp-hc-icon">🕐</div>
              <div>
                <div class="vp-hc-title">Çalışma Saatleri</div>
                <div class="vp-hc-subtitle">Bugün: ${todayName} · Saat: ${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}</div>
              </div>
            </div>
            <div class="vp-hero-card-body">
            ${(v.weeklyHours || []).filter(entry => entry.days).map(entry => {
              const isClosed = (entry.hours || '').toLowerCase() === 'kapalı';
              const isActive = entry.days.toLowerCase().includes(todayName.toLowerCase())
                || entry.days.toLowerCase().includes('her gün')
                || entry.days.toLowerCase().includes('resepsiyon')
                || (entry.days.toLowerCase().includes('pazartesi') && entry.days.toLowerCase().includes('perşembe') && ['Pazartesi','Salı','Çarşamba','Perşembe'].includes(todayName))
                || (entry.days.toLowerCase().includes('cuma') && entry.days.toLowerCase().includes('pazar') && ['Cuma','Cumartesi','Pazar'].includes(todayName));
              const statusCls = isActive ? (isNowOpen ? ' vp-hca-open' : ' vp-hca-closed') : '';
              return '<div class="vp-hero-card-row' + (isActive ? ' vp-hero-card-active' + statusCls : '') + '">' +
                  '<span class="vp-hero-card-label">' + (isActive ? '<span class="vp-hero-card-dot"></span>' : '') + entry.days + '</span>' +
                  '<span class="vp-hero-card-val' + (isClosed ? ' vp-hcv-closed' : '') + '">' + entry.hours + '</span>' +
                '</div>';
            }).join('')}
            </div>
            <div class="vp-hero-card-footer"><span>Saatler mevsime göre değişebilir</span></div>
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
        <span class="vp-hours-day">${entry.days}</span>
        <span class="vp-hours-val ${(entry.hours || '') === 'Kapalı' ? 'vp-hours-closed' : ''}">${entry.hours || ''}</span>
      </div>`
    ).join('');
  })();

  // Track venue page view
  if (window.trackPageView) trackPageView('venue_' + v.id);

  document.getElementById('vp-body').innerHTML = `
    <!-- Info bar -->
    <div class="vp-info-bar">
      <div class="vp-info-inner">
        <div class="vp-info-item">
          <span class="vp-info-icon">📍</span>
          <div><span class="vp-info-label">Konum</span><span class="vp-info-text">${v.location}</span></div>
        </div>
        <div class="vp-info-item">
          <span class="vp-info-icon">${v.emoji}</span>
          <div><span class="vp-info-label">Tür</span><span class="vp-info-text">${cs.label}</span></div>
        </div>
        ${(v.tags||[]).length > 0 ? `<div class="vp-info-item">
          <span class="vp-info-icon">🌿</span>
          <div><span class="vp-info-label">Atmosfer</span><span class="vp-info-text">${v.tags.join(', ')}</span></div>
        </div>` : ''}
        ${v.phone ? `<div class="vp-info-item">
          <span class="vp-info-icon">📞</span>
          <div><span class="vp-info-label">Telefon</span><span class="vp-info-text">${v.phone}</span></div>
        </div>` : ''}
      </div>
    </div>

    <!-- Content -->
    <div class="vp-body-wrap">
      <div class="vp-body-inner">

        <!-- Description -->
        <div class="vp-section fade-up">
          <div class="vp-eyebrow">Hakkında</div>
          <div class="vp-desc"><p>${(v.description || v.shortDesc).replace(/\. ([A-ZÇŞĞÜÖİ])/g, '.</p><p>$1')}</p></div>
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
                  <input type="date" id="rezv-checkin" class="vp-rezv-input">
                </div>
                <div class="vp-rezv-field">
                  <label class="vp-rezv-label">Çıkış Tarihi</label>
                  <input type="date" id="rezv-checkout" class="vp-rezv-input">
                </div>
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
            '<div class="vp-gimg"><img src="' + (src.startsWith('http') ? src : base + src) + '" alt="' + v.title + '" loading="lazy"><div class="vp-gimg-overlay"></div></div>'
          ).join('');
          return '<div class="vp-section fade-up">' +
            '<div class="vp-eyebrow">Atmosfer</div>' +
            '<h2 class="vp-stitle">Mekandan Kareler</h2>' +
            '<div class="vp-gallery" data-count="' + count + '">' + tiles + '</div>' +
          '</div>';
        })()}

        <!-- Similar venues -->
        ${similar.length > 0 ? `
        <div class="vp-section fade-up">
          <div class="vp-eyebrow">Benzer Mekanlar</div>
          <h2 class="vp-stitle">Bunları da Sevebilirsin</h2>
          <div class="vp-sim-track">
            ${similar.map(s => {
              const sm  = VMETA[s.id] || { g:'linear-gradient(160deg,#1A2744,#2A3A5A)' };
              const scs = CAT_STYLE[s.category] || { bg:'rgba(26,39,68,.08)', color:'#4A5568', label:s.category };
              return `<a class="vp-sim-card" href="${base}mekanlar/mekan-detay.html?id=${s.id}">
                <div class="vp-sim-img" style="background:${sm.g};">
                  <span class="vp-sim-emoji">${s.emoji}</span>
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
              <div class="vp-note-text">Çalışma saatleri mevsime ve hava durumuna göre değişebilir. Yoğun dönemlerde — özellikle Temmuz ve Ağustos — rezervasyon öneririz. Küçük mekânlar nakit ödeme talep edebilir. Her ziyaret öncesi sosyal medya hesaplarından güncel bilgiyi kontrol etmek iyi fikir.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ── Global event handlers ── */
  window.vpToggleSave = function () {
    const saved = getSaved();
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
    const url = window.location.href;
    const text = v.title + ' - Assos\'u Kesfet';
    const waText = v.title + ' - Assos\'u Kesfet\n' + v.location + '\n\n' + url;
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
      '<button class="vp-share-opt" onclick="navigator.clipboard.writeText(window.location.href).then(()=>{this.querySelector(\'span:last-child\').textContent=\'Kopyalandi!\';setTimeout(()=>this.querySelector(\'span:last-child\').textContent=\'Kopyala\',1500)})">' +
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

  window.vpSendRezervasyon = function () {
    const name     = (document.getElementById('rezv-name')?.value || '').trim();
    const checkin  = document.getElementById('rezv-checkin')?.value  || '';
    const checkout = document.getElementById('rezv-checkout')?.value || '';
    const guests   = document.getElementById('rezv-guests')?.value   || '1';
    if (!name)     { alert('Lütfen ad soyad giriniz.'); return; }
    if (!checkin)  { alert('Lütfen giriş tarihini seçiniz.'); return; }
    if (!checkout) { alert('Lütfen çıkış tarihini seçiniz.'); return; }
    if (window.trackAction) trackAction(v.id, 'reservation');
    const fmt = d => { if (!d) return '—'; const [y,m,day]=d.split('-'); return `${day}.${m}.${y}`; };
    const lines = [
      '━━━━━━━━━━━━━━━━━━━━',
      '*REZERVASYON TALEBI*',
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      '*Mekan:* ' + v.title,
      '',
      '┌─────────────────────',
      '│ *Ad Soyad:* ' + name,
      '│ *Giris:* ' + fmt(checkin),
      '│ *Cikis:* ' + fmt(checkout),
      '│ *Kisi Sayisi:* ' + guests + ' kisi',
      '└─────────────────────',
      '',
      'Musaitlik durumu hakkinda bilgi almak istiyorum.',
      '',
      '_Assos\'u Kesfet (assosukesfet.com) uzerinden gonderilmistir._'
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
