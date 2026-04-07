// firebase-loader.js — Non-blocking Firebase loader
// data.js renders page immediately, Firebase updates in background
(function() {
  // Load Firebase SDK asynchronously
  var s1 = document.createElement('script');
  s1.src = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js';
  s1.async = true;
  s1.onload = function() {
    var s2 = document.createElement('script');
    s2.src = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore-compat.js';
    s2.async = true;
    s2.onload = initFirebase;
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);

  function initFirebase() {
    try {
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
      window._firebaseReady = true;

      // Fetch data in background
      Promise.allSettled([
        db.collection('venues').get(),
        db.collection('places').get(),
        db.collection('villages').get(),
        db.collection('routes').get()
      ]).then(function(results) {
        var venues = results[0].status === 'fulfilled' ? results[0].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var places = results[1].status === 'fulfilled' ? results[1].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var villages = results[2].status === 'fulfilled' ? results[2].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];
        var routes = results[3].status === 'fulfilled' ? results[3].value.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) : [];

        var failed = results.filter(function(r) { return r.status === 'rejected'; });
        if (failed.length > 0) console.warn('Firebase: ' + failed.length + ' koleksiyon yuklenemedi');

        window.DATA = { routes: routes, places: places, venues: venues, villages: villages };
        console.log('Firebase: Data updated (' + venues.length + ' venues)');
        // Dispatch event for any components that want to re-render
        document.dispatchEvent(new Event('firebaseDataUpdated'));
      });
    } catch(err) {
      console.warn('Firebase: Init failed:', err);
    }
  }
})();
