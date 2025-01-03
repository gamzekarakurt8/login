const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3002;

// JWT Gizli Anahtarı 
const JWT_SECRET = 'supersecretkey';

// CORS Ayarı
app.use(cors({ origin: '*' }));

// MySQL bağlantı ayarları
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'loginDB'
});

// MySQL bağlantısını kontrol et
db.connect((err) => {
    if (err) {
        console.error('MySQL bağlantı hatası:', err);
        process.exit(1);
    }
    console.log('MySQL veritabanına bağlanıldı!');
});

// Middleware'ler
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Login API Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gereklidir.' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            return res.status(500).json({ success: false, message: 'Bir hata oluştu.' });
        }

        if (results.length > 0) {
            const user = results[0];

            // JWT Token oluştur
            const token = jwt.sign(
                { id: user.id, username: user.username }, // Token içine gömülecek bilgiler
                JWT_SECRET, // Gizli anahtar
                { expiresIn: '1h' } // Token süresi (1 saat)
            );

            res.json({ 
                success: true, 
                message: 'Giriş başarılı', 
                token 
            });
        } else {
            res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre.' });
        }
    });
});

// Doğrulama Middleware'i (Korunan rotalarda kullanılacak)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token> formatında beklenir

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token sağlanmadı.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' });
        }
        req.user = user; // Kullanıcı bilgilerini isteğe ekle
        next();
    });
}



// Sunucu Çalıştır
app.listen(port, () => {
    console.log(`API Sunucusu http://localhost:${port} adresinde çalışıyor.`);
});
