// firebase-loader.js — Firebase-first data loader
// Firebase'den veri çekilene kadar sayfa bekler, skeleton gösterilir
(function() {
  // Loading göstergesi ekle
  var loader = document.createElement('div');
  loader.id = 'fb-loader';
  loader.innerHTML = '<div style="position:fixed;inset:0;z-index:9990;background:var(--cream-light,#FAF7F2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;transition:opacity .3s;"><div style="width:28px;height:28px;border:3px solid rgba(26,39,68,.1);border-top-color:#C4521A;border-radius:50%;animation:fbspin .6s linear infinite"></div><span style="font-size:.78rem;color:#718096;">Yükleniyor...</span></div>';
  var style = document.createElement('style');
  style.textContent = '@keyframes fbspin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  document.body.appendChild(loader);

  function hideLoader() {
    var el = document.getElementById('fb-loader');
    if (el) { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }
  }

  // Firebase SDK yükle — app önce, sonra firestore + app-check paralel
  var s1 = document.createElement('script');
  s1.src = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js';
  s1.crossOrigin = 'anonymous';
  s1.integrity = 'sha384-4DnN3LMk363cZnO0ZZ+46dvN6+1On5ODUbq/68J4ZeSDAghncVXodw2jecSmTyAe';
  s1.onload = function() {
    // Firestore ve App Check paralel yükle
    var loaded = 0;
    function onSubLoad() { loaded++; if (loaded >= 2) initFirebase(); }

    var s2 = document.createElement('script');
    s2.src = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore-compat.js';
    s2.crossOrigin = 'anonymous';
    s2.integrity = 'sha384-OWv+RYFfLxKnRm2S6RYMcxn1Un3vxC0dbSWy7XC9DKsJGGHMWBCbDV27k62l/2XK';
    s2.onload = onSubLoad;
    s2.onerror = fallback;

    var s3 = document.createElement('script');
    s3.src = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app-check-compat.js';
    s3.crossOrigin = 'anonymous';
    s3.integrity = 'sha384-eV3PO0BITEvFTiTj+Lx8nlBz6wF9b6ARxrCuTiZSo6giPhCoWzr1tNN6KKHdPHfa';
    s3.onload = onSubLoad;
    s3.onerror = onSubLoad; // App Check yuklenemezse de devam et

    document.head.appendChild(s2);
    document.head.appendChild(s3);
  };
  s1.onerror = fallback;
  document.head.appendChild(s1);

  // Timeout — 4 saniyede Firebase gelmezse data.js fallback
  var timeout = setTimeout(function() {
    if (!window._firebaseReady) {
      fallback();
    }
  }, 4000);

  // LocalStorage cache — aninda yukleme (TTL'li)
  // Cache 24 saatten eski ise kullanma (admin degisiklikleri yansimaya baslar)
  var DATA_CACHE_KEY = 'assos_data_cache';
  var CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat
  var cached = null;
  try {
    var raw = JSON.parse(localStorage.getItem(DATA_CACHE_KEY));
    // Eski format (saf veri) veya yeni format ({data, savedAt})
    if (raw && raw.data && raw.savedAt) {
      var age = Date.now() - raw.savedAt;
      if (age < CACHE_TTL_MS) cached = raw.data;
      else try { localStorage.removeItem(DATA_CACHE_KEY); } catch(e) {}
    } else if (raw && raw.venues) {
      // Backward compat: eski format - hemen kullan ama yeni formata migrate edilecek
      cached = raw;
    }
  } catch(e) {}
  if (cached && cached.venues && cached.venues.length > 0 && cached.placeCategories && cached.venueCategories) {
    window.DATA = cached;
    hideLoader();
    // dataReady ilk seferinde (cache veya Firebase'den birisi) tek kez dispatch olur.
    // Cache kullanildiysa, Firebase sonrasi 'dataRefresh' ayri event ile bilgi verilir.
    document.dispatchEvent(new CustomEvent('dataReady', { detail: { source: 'cache' } }));
    window._cacheUsed = true;
    window._dataReadyFired = true;
  }

  function fallback() {
    clearTimeout(timeout);
    if (window._firebaseReady) return;
    if (window.DATA) {
      if (!window.DATA.placeCategories) window.DATA.placeCategories = [];
      if (!window.DATA.venueCategories) window.DATA.venueCategories = [];
      window._firebaseReady = false;
      if (!window._dataReadyFired) {
        hideLoader();
        document.dispatchEvent(new CustomEvent('dataReady', { detail: { source: 'fallback' } }));
        window._dataReadyFired = true;
      }
    } else {
      // data.js henüz yüklenmemişse dinamik yükle
      var ds = document.createElement('script');
      var bp = (window.location.pathname.indexOf('/mekanlar/') > -1 || window.location.pathname.indexOf('/rotalar/') > -1 || window.location.pathname.indexOf('/koyler/') > -1 || window.location.pathname.indexOf('/yerler/') > -1) ? '../' : '';
      ds.src = bp + 'data.js?v=2';
      ds.onload = function() {
        if (window.DATA) {
          if (!window.DATA.placeCategories) window.DATA.placeCategories = [];
          if (!window.DATA.venueCategories) window.DATA.venueCategories = [];
          hideLoader();
          if (!window._dataReadyFired) {
            document.dispatchEvent(new CustomEvent('dataReady', { detail: { source: 'fallback' } }));
            window._dataReadyFired = true;
          }
        }
      };
      document.head.appendChild(ds);
    }
  }

  function initFirebase() {
    try {
      if (typeof firebase === 'undefined') { fallback(); return; }
      if (firebase.apps.length === 0) {
        firebase.initializeApp({
          apiKey: "AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs",
          authDomain: "assosu-kesfet.firebaseapp.com",
          projectId: "assosu-kesfet",
          storageBucket: "assosu-kesfet.firebasestorage.app",
          messagingSenderId: "225032191860",
          appId: "1:225032191860:web:61ac6ba36764b530be3621"
        });
      }

      // App Check aktif et
      try {
        var appCheck = firebase.appCheck();
        appCheck.activate('6LdfCqwsAAAAAGECNBwhjW0fCC3lIsvCwZZxrurI', true);
      } catch(e) { }

      var db = firebase.firestore();
      window._db = db;

      Promise.allSettled([
        db.collection('venues').get(),
        db.collection('places').get(),
        db.collection('villages').get(),
        db.collection('routes').get(),
        db.collection('settings').doc('place_categories').get(),
        db.collection('settings').doc('venue_categories').get(),
        db.collection('settings').doc('site').get()
      ]).then(function(results) {
        clearTimeout(timeout);

        // XSS koruması — düz metin alanlarını sanitize et
        function sanitizeText(s) { return s ? String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;') : s; }
        function sanitizeItem(item) {
          if (item.title) item.title = sanitizeText(item.title);
          if (item.shortDesc) item.shortDesc = sanitizeText(item.shortDesc);
          if (item.location) item.location = sanitizeText(item.location);
          if (item.address) item.address = sanitizeText(item.address);
          if (item.phone) item.phone = sanitizeText(item.phone);
          if (item.tags && Array.isArray(item.tags)) item.tags = item.tags.map(sanitizeText);
          if (item.keywords && Array.isArray(item.keywords)) item.keywords = item.keywords.map(sanitizeText);
          // description alanı HTML içerebilir (zengin metin editörü) — dokunma
          return item;
        }
        var venues = results[0].status === 'fulfilled' ? results[0].value.docs.map(function(d) { return sanitizeItem(Object.assign({ id: d.id }, d.data())); }).filter(function(v) { var st = v.status || (v.active === false ? 'hidden' : 'published'); return st === 'published'; }) : [];
        var places = results[1].status === 'fulfilled' ? results[1].value.docs.map(function(d) { return sanitizeItem(Object.assign({ id: d.id }, d.data())); }) : [];
        var villages = results[2].status === 'fulfilled' ? results[2].value.docs.map(function(d) { return sanitizeItem(Object.assign({ id: d.id }, d.data())); }) : [];
        var routes = results[3].status === 'fulfilled' ? results[3].value.docs.map(function(d) { return sanitizeItem(Object.assign({ id: d.id }, d.data())); }) : [];
        var placeCats = (results[4].status === 'fulfilled' && results[4].value.exists && results[4].value.data().list) ? results[4].value.data().list : [];
        var venueCats = (results[5].status === 'fulfilled' && results[5].value.exists && results[5].value.data().list) ? results[5].value.data().list : [];
        var siteSettings = (results[6].status === 'fulfilled' && results[6].value.exists) ? results[6].value.data() : {};

        var failed = results.filter(function(r) { return r.status === 'rejected'; });

        // Premium mekanlar üstte, kendi aralarında saatlik rotasyon
        var now = new Date().toISOString().split('T')[0];
        function isPrem(v) { return v.premium && (!v.premiumStart || now >= v.premiumStart) && (!v.premiumEnd || now < v.premiumEnd); }
        var hourSeed = Math.floor(Date.now() / 3600000); // her saat degisir
        venues.sort(function(a, b) {
          var pa = isPrem(a) ? 0 : 1;
          var pb = isPrem(b) ? 0 : 1;
          if (pa !== pb) return pa - pb;
          // Premium'lar kendi aralarinda saatlik rotasyon
          if (pa === 0 && pb === 0) {
            var ha = ((a.id || '').charCodeAt(0) + hourSeed) % 100;
            var hb = ((b.id || '').charCodeAt(0) + hourSeed) % 100;
            return ha - hb;
          }
          return (a.sortOrder || 999) - (b.sortOrder || 999);
        });
        places.sort(function(a, b) { return (a.sortOrder || 999) - (b.sortOrder || 999); });
        window.DATA = { routes: routes, places: places, venues: venues, villages: villages, placeCategories: placeCats, venueCategories: venueCats, siteSettings: siteSettings };
        window._firebaseReady = true;

        // Cache guncelle — yeni format: {data, savedAt}
        try {
          localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
            data: window.DATA,
            savedAt: Date.now()
          }));
        } catch(e) {}

        hideLoader();
        if (window._dataReadyFired) {
          // Cache'den ilk render edildi, simdi Firebase'den guncel veri geldi.
          // 'dataReady' tekrar dispatch ETME (pageInit 2x calismasin + listener sizintisi).
          // Bunun yerine ayri 'dataRefresh' event'i — isteyen sayfa dinler.
          document.dispatchEvent(new CustomEvent('dataRefresh', { detail: { source: 'firebase' } }));
        } else {
          // Cache yoktu, Firebase ilk kez geldi
          document.dispatchEvent(new CustomEvent('dataReady', { detail: { source: 'firebase' } }));
          window._dataReadyFired = true;
        }
      });
    } catch(err) {
      fallback();
    }
  }
})();
