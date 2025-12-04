// routes/threads.js

// 1. Gerekli kütüphaneleri ve router'ı tanımla (Hatanın kaynağı burasıydı)
const express = require('express');
const router = express.Router(); // ✅ HATA DÜZELTİLDİ: Router tanımlandı
const db = require('../db');
const { protect, admin } = require('../middleware/auth'); 
const { v4: uuidv4 } = require('uuid'); 

const THREAD_QUERY_BASE = `
  SELECT 
    t.thread_id AS id, 
    t.author_id AS authorId, 
    t.title, 
    t.content,
    t.category,
    t.sub_category AS subCategory, 
    t.tags,
    t.is_locked AS isLocked,
    t.is_pinned AS isPinned,
    t.views,
    t.created_at AS createdAt,
    t.updated_at AS updatedAt,
    u.username AS authorName, 
    u.avatar AS authorAvatar,   
    COUNT(DISTINCT r.reply_id) AS replyCount, 
    COUNT(DISTINCT l.user_id) AS likeCount   
  FROM threads t
  LEFT JOIN users u ON t.author_id = u.user_id
 LEFT JOIN replies r ON t.thread_id = r.thread_id
  LEFT JOIN thread_likes l ON t.thread_id = l.thread_id
`;

router.get('/', async (req, res) => {
    try {
        // camelCase formatında çekiyoruz
        const query = `${THREAD_QUERY_BASE} GROUP BY t.thread_id ORDER BY t.created_at DESC`;
        const [threads] = await db.query(query);
        res.json(threads);
    } catch (err) {
        console.error("GET /api/threads hatası:", err);
        res.status(500).json({ message: 'Konular çekilemedi.' });
    }
});

// --- 2. YENİ KONU OLUŞTURMA (CREATE) ---
// /api/threads POST
router.post('/', protect, async (req, res) => {
    const { title, content, category, subCategory, tags } = req.body;
    const threadId = uuidv4(); 
    const userId = req.user.id; 
    let connection; // Transaction için bağlantıyı dışarıda tanımlayın

    try {
        // 1. Transaction Başlat
        connection = await db.getConnection(); // db'den bir bağlantı al
        await connection.beginTransaction();

        // 2. Yeni Konuyu Ekle
        await connection.query(
            `INSERT INTO threads (thread_id, author_id, title, content, category, sub_category, tags, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [threadId, userId, title, content, category, subCategory, tags.join(',')]
        );
        
        // 3. Kullanıcı İstatistiklerini Güncelle
        await connection.query(
            `UPDATE users SET 
             threads_count = threads_count + 1, 
             xp = xp + 5, 
             updated_at = NOW()
             WHERE user_id = ?`,
            [userId]
        );
        
        // 4. Eğer her şey başarılıysa, işlemleri kalıcı hale getir
        await connection.commit();
        
        // 5. Yeni Konuyu JSON formatında geri çek (Bu sorgu transaction içinde olmak zorunda değil)
        const [newThreadResult] = await db.query(
            `${THREAD_QUERY_BASE} WHERE t.thread_id = ? GROUP BY t.thread_id`, 
            [threadId]
        );

        // 6. Başarılı Yanıtı Gönder
        return res.status(201).json(newThreadResult[0]); 

    } catch (err) {
        console.error("POST /api/threads hatası:", err);
        
        // Hata oluşursa, işlemleri geri al
        if (connection) {
            await connection.rollback();
        }
        
        return res.status(500).json({ message: 'Konu oluşturulurken bir hata oluştu ve işlemler geri alındı.' }); 
        
    } finally {
        // Bağlantıyı serbest bırak
        if (connection) {
            connection.release();
        }
    }
});
        
    
// --- 3. KONU SİLME (DELETE) ---
// /api/threads/:id DELETE
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('DELETE FROM threads WHERE thread_id = ?', [id]);
        res.status(200).json({ message: 'Konu başarıyla silindi.' });
    } catch (err) {
        console.error("DELETE /api/threads/:id hatası:", err);
        res.status(500).json({ message: 'Konu silinirken hata oluştu.' });
    }
});





router.post('/', protect, async (req, res) => {
    const { title, content, category, subCategory, tags } = req.body;
    const threadId = uuidv4(); 
    const userId = req.user.id; 

    try {
        // 1. Yeni Konuyu Ekle
        await db.query(
            // ... INSERT sorgusu
        );
        
        // 2. Kullanıcı İstatistiklerini Güncelle (Kontrol edin!)
        await db.query(
             `UPDATE users SET 
                 threads_count = threads_count + 1, 
                 xp = xp + 5, -- SQL yorumu
                 updated_at = NOW()
              WHERE user_id = ?`,
             [userId]
        );
        
        // 3. Yeni Konuyu JSON formatında geri çek
        const [newThreadResult] = await db.query(
            `${THREAD_QUERY_BASE} WHERE t.thread_id = ? GROUP BY t.thread_id`, 
            [threadId]
        );

        // 🟢 ÖNEMLİ KONTROL: Sonuç var mı?
        if (!newThreadResult || newThreadResult.length === 0) {
            console.error("Yeni oluşturulan konu veritabanından geri çekilemedi.");
            return res.status(500).json({ message: 'Konu oluşturuldu ancak geri dönüş verisi bulunamadı.' });
        }

        // 4. Başarılı Yanıtı Gönder
        return res.status(201).json(newThreadResult[0]); // ✅ Kesin 'return' kullanın

    } catch (err) {
        console.error("POST /api/threads hatası:", err);
        // Bu, Frontend'deki "Konu oluşturulamadı." mesajına dönüşür
        return res.status(500).json({ message: 'Konu oluşturulurken sunucuda beklenmedik bir hata oluştu.' }); 
    }
});







// routes/threads.js dosyasında EKLENMELİDİR
router.post('/:threadId/view', async (req, res) => {
    const { threadId } = req.params;

    try {
        // views = views + 1 işlemini yapın
        await db.query(
            `UPDATE threads SET views = views + 1 WHERE thread_id = ?`,
            [threadId]
        );
        // 204 No Content (Başarılı, yanıt gövdesi yok) döndürün
        return res.status(204).send(); 
    } catch (err) {
        console.error("View artırma hatası:", err);
        return res.status(500).json({ message: 'Görüntüleme sayısı artırılamadı.' });
    }
});











module.exports = router; // ✅ HATA DÜZELTİLDİ: Router dışa aktarıldı