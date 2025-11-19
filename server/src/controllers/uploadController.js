// src/controllers/uploadController.js
const { PORT } = require('../config/env');

/**
 * Handle file upload
 */
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('アップロードエラー:', error);
    res.status(500).json({ error: 'ファイルのアップロードに失敗しました' });
  }
}

module.exports = {
  uploadImage,
};
