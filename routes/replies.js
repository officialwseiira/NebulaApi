// routes/replies.js

const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { protect } = require('../middleware/auth'); 
const { v4: uuidv4 } = require('uuid'); 

// --- YANIT OLUŞTURMA (POST /api/replies) ---
router.post('/', protect, async (req, res) => {
    const userId = req.user.id; 
    const { threadId, content } = req.body;
    const replyId = uuidv4(); 
    let connection; 

    if (!threadId || !content) {
        return res.status(400).json({ message: 'Konu ID\'si ve içerik gereklidir.' });
    }

    try {
        // 1. Transaction Başlat
        connection = await db.getConnection(); 
        await connection.beginTransaction();

        // 2. Yeni Yanıtı Ekle (replies tablosu için updated_at eklendi)
        await connection.query(
            `INSERT INTO replies (reply_id, thread_id, author_id, content, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [replyId, threadId, userId, content]
        );
        
        // 3. Konu İstatistiklerini Güncelle (thread_count hatası çözüldü)
        // thread tablosuna reply_count sütunu eklenmiş varsayılır!
        await connection.query(
            `UPDATE threads SET reply_count = reply_count + 1, updated_at = NOW() WHERE thread_id = ?`,
            [threadId]
        );
        
        // 4. Kullanıcı İstatistiklerini Güncelle (XP ve Reply sayısını artırın)
        // **NOT:** Bu sorgu, users tablonuzda "replies_count" ve "xp" sütunlarının olduğunu varsayar.
        await connection.query(
            `UPDATE users SET xp = xp + 2, replies_count = replies_count + 1 WHERE user_id = ?`,
            [userId]
        );
        
        // 5. İşlemi Kalıcı Hale Getir
        await connection.commit();
        
        // 6. Başarılı Yanıtı Gönder
        res.status(201).json({ 
            replyId: replyId, 
            threadId: threadId, 
            content: content, 
            authorId: userId,
            createdAt: new Date().toISOString()
        }); 

    } catch (err) {
        console.error("POST /api/replies hatası (500 Internal Error):", err);
        
        if (connection) {
            await connection.rollback();
        }
        
        // Eğer users tablosunda da hata varsa, loglar bunu gösterir.
        res.status(500).json({ message: 'Yanıt oluşturulurken sunucuda bir hata oluştu. Lütfen logları kontrol edin.' });
        
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;