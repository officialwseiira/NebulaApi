// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// UUID'yi npm paketinden çekmelisiniz: npm install uuid
const { v4: generateUUID } = require('uuid'); 

// --- 1. KAYIT OL (Register) ---
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = generateUUID(); 

        await db.query(
        `INSERT INTO users 
            (user_id, username, email, password_hash, role, level, xp, created_at, threads_count, replies_count, is_banned) 
         VALUES 
            (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0, 0)`, 
        [userId, username, email, hashedPassword, 'user', 1, 0]
        );
        
        // JWT Oluşturma
        const token = jwt.sign(
            { id: userId, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Kullanıcı Nesnesini Hazırlama
        const newUser = { 
            id: userId, 
            username, 
            email, 
            role: 'user', 
            level: 1,
            xp: 0,
            threads_count: 0,
            replies_count: 0,
            isBanned: 0
        };
        
        // Token ve Kullanıcı verisini döndürme
        res.status(201).json({ user: newUser, token }); 

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
        }
        console.error("Kayıt hatası:", err);
        res.status(500).json({ message: 'Kayıt sırasında sunucu hatası.' });
    }
});

// --- 2. GİRİŞ YAP (Login) ---
router.post('/login', async (req, res) => {
    const { identity, password } = req.body;

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [identity, identity]
        );
        
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Hatalı şifre.' });
        }
        
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const userData = {
             id: user.user_id,
             username: user.username,
             email: user.email,
             role: user.role,
             // Tüm alanları döndürmek için:
             avatar: user.avatar,
             level: user.level,
             xp: user.xp,
             threads_count: user.threads_count,
             replies_count: user.replies_count,
             isBanned: user.is_banned 
        };
        
        await db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
        
        res.status(200).json({ user: userData, token }); 

    } catch (err) {
        console.error("Giriş hatası:", err);
        res.status(500).json({ message: 'Giriş sırasında sunucu hatası.' });
    }
});

module.exports = router;