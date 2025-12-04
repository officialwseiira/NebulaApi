// controllers/replyController.js
exports.createReply = async (req, res) => {
    try {
        const { threadId, content } = req.body;
        // Burada yanıtı veritabanına kaydetme mantığı yer alır.
        
        // Başarılı yanıt gönderin
        res.status(201).json({ message: 'Yanıt başarıyla oluşturuldu.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Yanıt oluşturulurken bir hata oluştu.' });
    }
};