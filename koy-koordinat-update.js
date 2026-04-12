// Admin paneli konsolundan çalıştırın (F12 → Console)
// Tüm köylerin koordinatlarını otomatik bulur ve Firestore'a kaydeder

(async function() {
  var villages = [];
  var snapshot = await firebase.firestore().collection('villages').get();
  snapshot.forEach(function(doc) {
    var d = doc.data();
    villages.push({ id: doc.id, title: d.title || doc.id, lat: d.lat, lng: d.lng });
  });

  var noCoords = villages.filter(function(v) { return !v.lat || !v.lng; });
  console.log('Toplam köy:', villages.length);
  console.log('Koordinatı olmayan:', noCoords.length);

  if (noCoords.length === 0) {
    console.log('✅ Tüm köylerin koordinatı zaten var.');
    return;
  }

  var updated = 0;
  var failed = [];

  for (var i = 0; i < noCoords.length; i++) {
    var v = noCoords[i];
    var cleanTitle = v.title.replace(/\s*\(.*?\)\s*/g, '').trim();
    var query = cleanTitle + ', Ayvacık, Çanakkale, Turkey';
    var url = '/api/geocode?q=' + encodeURIComponent(query);

    try {
      var resp = await fetch(url);
      var data = await resp.json();

      if (data && data.length > 0) {
        var lat = parseFloat(data[0].lat);
        var lng = parseFloat(data[0].lon);

        await firebase.firestore().collection('villages').doc(v.id).update({
          lat: lat,
          lng: lng
        });

        updated++;
        console.log('✅ [' + (i + 1) + '/' + noCoords.length + '] ' + v.title + ' → ' + lat.toFixed(5) + ', ' + lng.toFixed(5));
      } else {
        failed.push(v.title);
        console.warn('❌ [' + (i + 1) + '/' + noCoords.length + '] ' + v.title + ' — bulunamadı');
      }
    } catch (err) {
      failed.push(v.title);
      console.error('❌ [' + (i + 1) + '/' + noCoords.length + '] ' + v.title + ' — hata:', err.message);
    }

    // Rate limit: 1 istek/saniye
    if (i < noCoords.length - 1) {
      await new Promise(function(r) { setTimeout(r, 1100); });
    }
  }

  console.log('\n══════════════════════════');
  console.log('Güncellenen: ' + updated);
  console.log('Bulunamayan: ' + failed.length);
  if (failed.length > 0) console.log('Bulunamayanlar:', failed.join(', '));
  console.log('══════════════════════════');
})();
