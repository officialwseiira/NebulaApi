// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db'); // DB bağlantısını test etmek için ekledik (önerilir)

dotenv.config();
const app = express();
// PORT'unuzun .env'de 4000 olarak ayarlandığından emin olun
const PORT = process.env.PORT || 3000; 

// Middleware'ler
// 🔑 GÜNCELLEME: Tüm methodlara ve başlıklara izin veren daha esnek CORS ayarı
app.use(cors({ 
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Frontend'in olası portları
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] // JWT için zorunlu
})); 
app.use(express.json()); 

// Rotaları İçeri Aktarma
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/threads');
const userRoutes = require('./routes/users');
// Ana Uygulama Dosyası
const replyRoutes = require('./routes/replies');
app.use('/api/replies', replyRoutes);
// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/users', userRoutes);

// Ana rotanın testi
app.get('/', (req, res) => {
    res.send('Nebula Forum API Çalışıyor!');
});

// Sunucuyu başlatma
app.listen(PORT, () => {
    console.log(`🚀 API Sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});

// server.js (veya ana uygulama dosyanız)
// ...
// ...
app.use('/api/users', userRoutes); // Rota tanımını ekleyin
// ...



const configRoutes = require('./routes/config'); // <-- Yeni rotayı içe aktar

// ...

// Rota tanımlamalarının olduğu yerde
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes); // <-- Yeni rotayı tanımla




module.exports = app;