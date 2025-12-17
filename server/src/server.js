// src/server.js
const http = require('http');
const app = require('./app');
const { PORT } = require('./config/env');
const { initYjsServer } = require('./services/yjs-server');

// Create HTTP server (needed for WebSocket)
const server = http.createServer(app);

// Initialize Y.js WebSocket server on /yjs path
initYjsServer(server, '/yjs');

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 SlideQuick APIサーバーが起動しました`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 API エンドポイント: http://localhost:${PORT}/api/projects`);
  console.log(`🔄 Y.js WebSocket: ws://localhost:${PORT}/yjs\n`);
});
