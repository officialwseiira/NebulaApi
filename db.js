// db.js (veya TypeScript kullanıyorsanız db.ts)
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: "87.248.157.101:3306",
    user: "wSeiira",
    password: "1C^j1le#SbJ7ozlw",
    database: nebula_forum,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL veritabanına başarıyla bağlanıldı.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL bağlantı hatası:', err.message);
        console.error('Lütfen .env dosyasındaki bilgileri kontrol edin ve MySQL sunucunuzun çalıştığından emin olun.');
    });


module.exports = pool;
