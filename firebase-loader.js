// firebase-loader.js
(function() {
  // Firebase SDK compat (works without module imports)
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
      console.warn('Firebase: Failed to load SDK script:', src);
      window._firebaseReady = false;
      document.dispatchEvent(new Event('dataReady'));
    };
    document.head.appendChild(s);
  });

  function initFirebase() {
    firebase.initializeApp({
      apiKey: "AIzaSyCXqgczplchzjClAZt-Wl2eqgqmUMhLVJs",
      authDomain: "assosu-kesfet.firebaseapp.com",
      projectId: "assosu-kesfet",
      storageBucket: "assosu-kesfet.firebasestorage.app",
      messagingSenderId: "225032191860",
      appId: "1:225032191860:web:61ac6ba36764b530be3621"
    });

    const db = firebase.firestore();
    window._db = db; // expose for admin panel

    // Fetch all collections
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

      window.DATA = { routes, places, venues, villages };
      window._firebaseReady = true;
      document.dispatchEvent(new Event('dataReady'));
      console.log('Firebase: Data loaded (' + venues.length + ' venues, ' + places.length + ' places, ' + villages.length + ' villages, ' + routes.length + ' routes)');
    }).catch(err => {
      console.warn('Firebase fetch failed, using local data.js fallback:', err);
      window._firebaseReady = false;
      document.dispatchEvent(new Event('dataReady'));
    });
  }
})();
