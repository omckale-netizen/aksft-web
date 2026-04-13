// Admin paneli konsolundan çalıştırın (F12 → Console)
// Küçükkuyu beldesi + Ayvacık ve Küçükkuyu mahalleleri eklenir

(async function() {
  var db = firebase.firestore();

  var yeniYerlesimler = [
    // Belde
    { id: 'kucukkuyu', title: 'Küçükkuyu', emoji: '🏙', type: 'belde', parent: '', shortDesc: 'Ayvacık ilçesine bağlı, Ege kıyısında turizm beldesi.', tags: ['Sahil', 'Turizm', 'Belde'] },

    // Ayvacık Merkez Mahalleleri
    { id: 'fatih-mahallesi', title: 'Fatih', emoji: '📍', type: 'mahalle', parent: 'ayvacik', shortDesc: 'Ayvacık merkeze bağlı mahalle.', tags: ['Merkez', 'Mahalle'] },
    { id: 'hamdibey-mahallesi', title: 'Hamdibey', emoji: '📍', type: 'mahalle', parent: 'ayvacik', shortDesc: 'Ayvacık merkeze bağlı mahalle.', tags: ['Merkez', 'Mahalle'] },
    { id: 'ummuhan-mahallesi', title: 'Ümmühan', emoji: '📍', type: 'mahalle', parent: 'ayvacik', shortDesc: 'Ayvacık merkeze bağlı mahalle.', tags: ['Merkez', 'Mahalle'] },

    // Küçükkuyu Mahalleleri
    { id: 'mihli-mahallesi', title: 'Mıhlı', emoji: '📍', type: 'mahalle', parent: 'kucukkuyu', shortDesc: 'Küçükkuyu beldesine bağlı mahalle.', tags: ['Küçükkuyu', 'Mahalle'] },
    { id: 'sahil-mahallesi', title: 'Sahil Mahallesi', emoji: '🌊', type: 'mahalle', parent: 'kucukkuyu', shortDesc: 'Küçükkuyu beldesine bağlı sahil mahallesi.', tags: ['Küçükkuyu', 'Sahil', 'Mahalle'] },
    { id: 'gokcepte-mahallesi', title: 'Gökçetepe', emoji: '📍', type: 'mahalle', parent: 'kucukkuyu', shortDesc: 'Küçükkuyu beldesine bağlı mahalle.', tags: ['Küçükkuyu', 'Mahalle'] },
  ];

  // Önce ekle
  for (var i = 0; i < yeniYerlesimler.length; i++) {
    var y = yeniYerlesimler[i];
    var doc = {
      id: y.id,
      title: y.title,
      emoji: y.emoji,
      type: y.type,
      parent: y.parent,
      shortDesc: y.shortDesc,
      description: '',
      tags: y.tags,
      keywords: y.title.toLowerCase().split(/\s+/).concat(y.tags.map(function(t) { return t.toLowerCase(); })),
      image: '',
      bg: 'linear-gradient(160deg,#1A2744,#243255)',
      showInPlaces: false,
      highlights: [],
      lat: null,
      lng: null
    };

    try {
      await db.collection('villages').doc(y.id).set(doc, { merge: true });
      console.log('✅ Eklendi: ' + y.title + ' (' + y.type + ')');
    } catch (err) {
      console.error('❌ Hata: ' + y.title, err.message);
    }
  }

  // Koordinatları bul
  console.log('\n📍 Koordinatlar aranıyor...');
  for (var j = 0; j < yeniYerlesimler.length; j++) {
    var y2 = yeniYerlesimler[j];
    var searchName = y2.title;
    if (y2.type === 'mahalle') {
      searchName = (y2.parent === 'kucukkuyu' ? 'Küçükkuyu ' : 'Ayvacık ') + y2.title;
    }
    var query = searchName + ', Ayvacık, Çanakkale, Turkey';

    try {
      var resp = await fetch('/api/geocode?q=' + encodeURIComponent(query));
      var data = await resp.json();
      if (data && data.length > 0) {
        var lat = parseFloat(data[0].lat);
        var lng = parseFloat(data[0].lon);
        await db.collection('villages').doc(y2.id).update({ lat: lat, lng: lng });
        console.log('📍 ' + y2.title + ' → ' + lat.toFixed(5) + ', ' + lng.toFixed(5));
      } else {
        console.warn('❌ Koordinat bulunamadı: ' + y2.title);
      }
    } catch (err) {
      console.warn('❌ Geocode hatası: ' + y2.title, err.message);
    }

    // Rate limit
    await new Promise(function(r) { setTimeout(r, 1100); });
  }

  console.log('\n✅ Tamamlandı! Sayfayı yenileyerek kontrol edin.');
})();
