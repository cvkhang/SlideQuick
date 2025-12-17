// src/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase } = require('./config/database');
const { uploadDir } = require('./middleware/upload');
const routes = require('./routes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadDir));

// Initialize database
initializeDatabase();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'SlideQuick API サーバーが動作中です 🚀' });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('サーバーエラー:', err);

  // Multer errors
  if (err.message === '画像ファイルのみアップロード可能です') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'ファイルサイズが大きすぎます (最大: 5MB)' });
  }

  res.status(500).json({ error: 'サーバー内部エラー' });
});

module.exports = app;
