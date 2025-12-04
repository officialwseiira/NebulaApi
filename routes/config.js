// routes/config.js
const express = require('express');
const router = express.Router(); 
const db = require('../db');
const { protect, admin } = require('../middleware/auth'); 

// --- /api/config GET: Site ayarlarını çeker ---
router.get('/', async (req, res) => {
    try {
        // Not: Ayarlarınızı tek bir satırda tutan bir 'site_config' tablosu varsayılmıştır.
        const query = `SELECT * FROM site_config LIMIT 1`; 
        const [config] = await db.query(query);

        if (config.length === 0) {
            // Veri yoksa varsayılan bir ayar döndür (Ön yüzün çökmemesi için kritik)
            return res.json({ 
                maintenanceMode: false, 
                announcement: { active: false, message: '', type: 'info' }, 
                allowRegistrations: true 
            });
        }
        
        // Veritabanı sütunları (örn: maintenance_mode, allow_registrations) 
        // ön yüzdeki camelCase (maintenanceMode, allowRegistrations) formatına dönüştürülmelidir.
        // Bu örnekte, yalnızca ilk satırı döndürüyoruz:
        res.json(config[0]);

    } catch (err) {
        console.error("GET /api/config hatası:", err);
        // Hata durumunda bile 500 dönerek ön yüzün catch bloğuna düşmesini sağlayın
        res.status(500).json({ message: 'Site konfigürasyonu çekilemedi.' });
    }
});

// --- /api/config PUT: Site ayarlarını günceller (Sadece Admin) ---
// Not: Admin kontrolünü eklemeyi unutmayın
router.put('/', protect, admin, async (req, res) => {
    // Buraya ayarları güncelleme mantığınızı yazın
    res.status(200).json({ message: "Konfigürasyon güncellendi." });
});


module.exports = router;