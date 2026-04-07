// firebase-loader.js — Firebase-first data loader
// Firebase'den veri çekilene kadar sayfa bekler, skeleton gösterilir
(function() {
  // Loading göstergesi ekle
  var loader = document.createElement('div');
  loader.id = 'fb-loader';
  loader.innerHTML = '<div style="position:fixed;inset:0;z-index:9990;background:var(--cream-light,#FAF7F2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;transition:opacity .3s;"><div style="width:28px;height:28px;border:3px solid rgba(26,39,68,.1);border-top-color:#C4521A;border-radius:50%;animation:fbspin .6s linear infinite"></div><span style="font-size:.78rem;color:#718096;">Yukleniyor...</span></div>';
  var style = document.createElement('style');
  style.textContent = '@keyframes fbspin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  document.body.appendChild(loader);

  function hideLoader() {
    var el = document.getElementById('fb-loader');
    if (el) { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }
  }

  // Firebase SDK yükle
  var s1 = document.createElement('script');
  s1.src = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js';
  s1.onload = function() {
    var s2 = document.createElement('script');
    s2.src = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore-compat.js';
    s2.onload = initFirebase;
    s2.onerror = fallback;
    document.head.appendChild(s2);
  };
  s1.onerror = fallback;
  document.head.appendChild(s1);

  // Timeout — 6 saniyede Firebase gelmezse data.js fallback
  var timeout = setTimeout(function() {
    if (!window._firebaseReady) {
      console.warn('Firebase: Timeout, data.js fallback');
      fallback();
    }
  }, 6000);

  function fallback() {
    clearTimeout(timeout);
    if (window._firebaseReady) return;
    // data.js zaten yüklendiyse window.DATA var
    if (window.DATA) {
      window._firebaseReady = false;
      hideLoader();
      document.dispatchEvent(new Event('dataReady'));
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

      var db = firebase.firestore();
      window._db = db;

      Promise.allSettled([
        db.collection('venues').get(),
        db.collection('places').get(),
        db.collection('villages').get(),
        db.collection('routes').get()
      ]).then(function(results) {
        clearTimeout(timeout);

        var venues = results[0].status === 'fulfilled' ? results[0].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var places = results[1].status === 'fulfilled' ? results[1].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var villages = results[2].status === 'fulfilled' ? results[2].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var routes = results[3].status === 'fulfilled' ? results[3].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];

        var failed = results.filter(function(r) { return r.status === 'rejected'; });
        if (failed.length > 0) console.warn('Firebase: ' + failed.length + ' koleksiyon yuklenemedi');

        window.DATA = { routes: routes, places: places, venues: venues, villages: villages };
        window._firebaseReady = true;

        console.log('Firebase: Data loaded (' + venues.length + ' venues, ' + places.length + ' places, ' + villages.length + ' villages, ' + routes.length + ' routes)');

        hideLoader();
        document.dispatchEvent(new Event('dataReady'));
      });
    } catch(err) {
      console.warn('Firebase: Init failed:', err);
      fallback();
    }
  }
})();
