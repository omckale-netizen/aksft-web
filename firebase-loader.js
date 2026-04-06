// firebase-loader.js
// data.js'den önce yüklenir — sayfa init'i dataReady event'ini bekler
(function() {
  // data.js'den gelen veriyi engelle — Firebase'den gelecek
  window._waitForFirebase = true;

  // Orijinal DATA'yı yedekle (data.js fallback)
  Object.defineProperty(window, 'DATA', {
    set: function(val) { window._DATA_FALLBACK = val; },
    get: function() { return window._DATA_LIVE; },
    configurable: true
  });

  const scripts = [
    'https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore-compat.js'
  ];

  let loaded = 0;
  scripts.forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => {
      loaded++;
      if (loaded === scripts.length) initFirebase();
    };
    s.onerror = () => {
      console.warn('Firebase: SDK yuklenemedi, data.js fallback kullaniliyor');
      useFallback();
    };
    document.head.appendChild(s);
  });

  // 5 saniye timeout — Firebase yavaşsa fallback'e düş
  setTimeout(() => {
    if (!window._firebaseReady && !window._DATA_LIVE) {
      console.warn('Firebase: Timeout, data.js fallback kullaniliyor');
      useFallback();
    }
  }, 5000);

  function useFallback() {
    if (window._DATA_LIVE) return; // zaten yüklendi
    delete window.DATA;
    window.DATA = window._DATA_FALLBACK || {};
    window._firebaseReady = false;
    document.dispatchEvent(new Event('dataReady'));
  }

  function initFirebase() {
    try {
      firebase.initializeApp({
        apiKey: "AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs",
        authDomain: "assosu-kesfet.firebaseapp.com",
        projectId: "assosu-kesfet",
        storageBucket: "assosu-kesfet.firebasestorage.app",
        messagingSenderId: "225032191860",
        appId: "1:225032191860:web:61ac6ba36764b530be3621"
      });

      const db = firebase.firestore();
      window._db = db;

      Promise.all([
        db.collection('venues').get(),
        db.collection('places').get(),
        db.collection('villages').get(),
        db.collection('routes').get()
      ]).then(([venuesSnap, placesSnap, villagesSnap, routesSnap]) => {
        const venues = venuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const places = placesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const villages = villagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const routes = routesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        delete window.DATA;
        window._DATA_LIVE = { routes, places, venues, villages };
        window.DATA = window._DATA_LIVE;
        window._firebaseReady = true;
        document.dispatchEvent(new Event('dataReady'));
        console.log('Firebase: Data loaded (' + venues.length + ' venues, ' + places.length + ' places, ' + villages.length + ' villages, ' + routes.length + ' routes)');
      }).catch(err => {
        console.warn('Firebase: Firestore hatasi, data.js fallback:', err);
        useFallback();
      });
    } catch(err) {
      console.warn('Firebase: Init hatasi, data.js fallback:', err);
      useFallback();
    }
  }
})();
