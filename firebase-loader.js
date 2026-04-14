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

  // LocalStorage cache — aninda yukleme
  var DATA_CACHE_KEY = 'assos_data_cache';
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(DATA_CACHE_KEY)); } catch(e) {}
  if (cached && cached.venues && cached.venues.length > 0) {
    window.DATA = cached;
    hideLoader();
    document.dispatchEvent(new Event('dataReady'));
    window._cacheUsed = true;
  }

  function fallback() {
    clearTimeout(timeout);
    if (window._firebaseReady) return;
    if (window.DATA) {
      window._firebaseReady = false;
      if (!window._cacheUsed) { hideLoader(); document.dispatchEvent(new Event('dataReady')); }
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
        db.collection('settings').doc('place_categories').get()
      ]).then(function(results) {
        clearTimeout(timeout);

        var venues = results[0].status === 'fulfilled' ? results[0].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var places = results[1].status === 'fulfilled' ? results[1].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var villages = results[2].status === 'fulfilled' ? results[2].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var routes = results[3].status === 'fulfilled' ? results[3].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var placeCats = (results[4].status === 'fulfilled' && results[4].value.exists && results[4].value.data().list) ? results[4].value.data().list : [];

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
        window.DATA = { routes: routes, places: places, venues: venues, villages: villages, placeCategories: placeCats };
        window._firebaseReady = true;

        // Cache guncelle
        try { localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(window.DATA)); } catch(e) {}


        hideLoader();
        if (window._cacheUsed) {
          // Cache'den yuklendi, Firebase'den guncelle
          document.dispatchEvent(new Event('dataReady'));
        } else {
          document.dispatchEvent(new Event('dataReady'));
        }
      });
    } catch(err) {
      fallback();
    }
  }
})();
