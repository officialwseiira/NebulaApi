// routes/users.js
const express = require('express');
const router = express.Router(); 
const { protect, admin } = require('../middleware/auth'); // protect artık tanımlı
const db = require('../db');

// --- TAVSİYE: VERİTABANINDA EKSİK OLAN SÜTUNLARI EKLEYİN ---
// Eğer bu sütunları eklemediyseniz, 500 hatası almaya devam edebilirsiniz.
// ALTER TABLE users ADD COLUMN replies_count INT DEFAULT 0;
// ALTER TABLE users ADD COLUMN is_banned TINYINT(1) DEFAULT 0;


// /api/users GET rotası (Tüm kullanıcıları getir)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT user_id, username, email, avatar, role, level, xp, created_at, updated_at
            FROM users
        `;
        const [users] = await db.query(query);
        res.json(users);
    } catch (err) {
        console.error("GET /api/users hatası:", err);
        res.status(500).json({ message: 'Kullanıcılar çekilemedi.' });
    }
});

// /api/users/:id GET rotası (Tek bir kullanıcıyı ID'sine göre getir)
// Bu rota, 'createThread' sonrası güncel kullanıcı verisini çekmek için kullanılır.
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    
    try {
        // user_id'ye göre tüm kullanıcı verilerini çekin (parolayı hariç tutarak)
        const [users] = await db.query(
            // Sütunlar, Frontend'deki User type'ına ve /api/users rotasına uygun olarak CamelCase'e çevrildi.
            `SELECT 
                user_id AS id, 
                username, 
                email, 
                role, 
                avatar, 
                level,
                xp, 
                threads_count,   
                replies_count, 
                is_banned AS isBanned,
                created_at AS createdAt,
                updated_at AS updatedAt 
             FROM users 
             WHERE user_id = ?`, 
            [id]
        );

        if (users.length === 0) {
            // Kullanıcı bulunamazsa 404 yanıtı döndür
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Başarılı yanıtı döndür
        res.json(users[0]);

    } catch (err) {
        console.error("GET /api/users/:id hatası:", err);
        // Hatanın SQL'den kaynaklandığı bilgisini yakalamak için daha fazla loglama yapılabilir.
        res.status(500).json({ message: 'Kullanıcı verisi çekilirken bir sunucu hatası oluştu.' });
    }
});


module.exports = router;