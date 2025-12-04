// middleware/auth.js
const jwt = require('jsonwebtoken');

// Gerekli: JWT'yi doğrula ve kullanıcı bilgilerini req.user'a ekle
const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Token'ı al: "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Token'ı doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Kullanıcı bilgilerini req nesnesine ekle
            req.user = decoded; // { id, role } içerir

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Yetkilendirme başarısız, token geçersiz.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Yetkilendirme başarısız, token yok.' });
    }
};

// Gerekli Rol Kontrolü: Admin yetkisi ister
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Bu işlem için yetkiniz yok. (Admin gereklidir)' });
    }
};

module.exports = { protect, admin };