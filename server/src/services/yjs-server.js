// src/services/yjs-server.js
// Y.js WebSocket server with database persistence (like Canva/Google Slides)

const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const shareSessionService = require('./shareSessionService');

// Message types matching y-websocket client
const messageSync = 0;
const messageAwareness = 1;

// In-memory document storage
const docs = new Map();

// Debounce timers for auto-save
const saveTimers = new Map();
const SAVE_DEBOUNCE_MS = 2000; // Save 2 seconds after last change

/**
 * Get or create a Y.js document for a room
 * Loads from database if exists
 */
function getYDoc(docName) {
  if (!docs.has(docName)) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    // Try to load from database
    const session = shareSessionService.getSession(docName);
    if (session && session.yjs_state) {
      try {
        Y.applyUpdate(doc, session.yjs_state);
        console.log(`📂 Loaded Y.js document from database: ${docName}`);
      } catch (err) {
        console.error(`Failed to load Y.js state for ${docName}:`, err);
      }
    }

    docs.set(docName, {
      doc,
      awareness,
      connections: new Set(),
    });

    if (!session) {
      console.log(`📄 Created new Y.js document: ${docName}`);
    }
  }
  return docs.get(docName);
}

/**
 * Save Y.js document state to database (debounced)
 */
function scheduleSave(docName) {
  // Clear existing timer
  if (saveTimers.has(docName)) {
    clearTimeout(saveTimers.get(docName));
  }

  // Set new timer
  saveTimers.set(docName, setTimeout(() => {
    saveDocToDatabase(docName);
    saveTimers.delete(docName);
  }, SAVE_DEBOUNCE_MS));
}

/**
 * Extract project data from Y.js document
 * Must match the structure used in frontend yjs-collab.ts
 */
function extractProjectFromYDoc(doc) {
  try {
    const yProject = doc.getMap('project');
    if (!yProject || yProject.size === 0) return null;

    // Extract basic project info
    const project = {
      id: yProject.get('id'),
      name: yProject.get('name'),
      slides: [],
    };

    if (!project.id || !project.name) return null;

    // Extract slides
    const ySlides = yProject.get('slides');
    if (ySlides && typeof ySlides.forEach === 'function') {
      ySlides.forEach((ySlide) => {
        if (!ySlide) return;

        const slide = {
          id: ySlide.get ? ySlide.get('id') : ySlide.id,
          title: ySlide.get ? ySlide.get('title') : ySlide.title || '',
          content: ySlide.get ? ySlide.get('content') : ySlide.content || '',
          template: ySlide.get ? ySlide.get('template') : ySlide.template || 'blank',
          backgroundColor: ySlide.get ? ySlide.get('backgroundColor') : ySlide.backgroundColor || '#ffffff',
          textColor: ySlide.get ? ySlide.get('textColor') : ySlide.textColor || '#000000',
          imageUrl: ySlide.get ? ySlide.get('imageUrl') : ySlide.imageUrl || null,
          elements: [],
        };

        // Extract elements
        const yElements = ySlide.get ? ySlide.get('elements') : ySlide.elements;
        if (yElements && typeof yElements.forEach === 'function') {
          yElements.forEach((yElement) => {
            if (!yElement) return;

            // Get style - it may be stored as JSON string
            let style = yElement.get ? yElement.get('style') : yElement.style;
            if (typeof style === 'string') {
              try {
                style = JSON.parse(style);
              } catch (e) {
                style = {};
              }
            }

            const element = {
              id: yElement.get ? yElement.get('id') : yElement.id,
              type: yElement.get ? yElement.get('type') : yElement.type,
              content: yElement.get ? yElement.get('content') : yElement.content || '',
              x: yElement.get ? yElement.get('x') : yElement.x || 0,
              y: yElement.get ? yElement.get('y') : yElement.y || 0,
              width: yElement.get ? yElement.get('width') : yElement.width || 100,
              height: yElement.get ? yElement.get('height') : yElement.height || 100,
              role: yElement.get ? yElement.get('role') : yElement.role,
              style: style || {},
            };

            if (element.id && element.type) {
              slide.elements.push(element);
            }
          });
        }

        if (slide.id) {
          project.slides.push(slide);
        }
      });
    }

    return project;
  } catch (err) {
    console.error('Error extracting project from Y.Doc:', err);
    return null;
  }
}

/**
 * Immediately save Y.js document to database
 */
function saveDocToDatabase(docName) {
  const room = docs.get(docName);
  if (!room) return;

  try {
    // 1. Save Y.js state to share_sessions table
    const state = Y.encodeStateAsUpdate(room.doc);
    const updated = shareSessionService.updateYjsState(docName, Buffer.from(state));

    if (updated) {
      console.log(`💾 Saved Y.js state to share_sessions: ${docName}`);
    }

    // 2. Also sync project data to main projects table
    const project = extractProjectFromYDoc(room.doc);
    if (project && project.id && project.slides && project.slides.length > 0) {
      const projectService = require('./projectService');
      projectService.updateProjectFromCollab(project);
    }

    // 3. Sync Chat activity for notifications
    const yChat = room.doc.getArray('chat');
    if (yChat && yChat.length > 0) {
      // Get the last message
      const lastMessage = yChat.get(yChat.length - 1);
      // yChat content can be Y.Map or plain object depending on how it was inserted, 
      // but in our client code it's inserted as Y.Map
      let timestamp;

      if (lastMessage instanceof Y.Map) {
        timestamp = lastMessage.get('timestamp');
      } else if (lastMessage && lastMessage.timestamp) {
        timestamp = lastMessage.timestamp;
      }

      // Check if project.id is available (it should be in extractProjectFromYDoc or we can get it from session)
      // We can try to get projectId from the doc 'project' map
      const yProject = room.doc.getMap('project');
      const projectId = yProject.get('id');

      if (projectId && timestamp) {
        shareSessionService.updateLastMessageAt(projectId, timestamp);
      }
    }
  } catch (err) {
    console.error(`Failed to save Y.js state for ${docName}:`, err);
  }
}


/**
 * Send a message to a WebSocket connection
 */
function send(conn, message) {
  if (conn.readyState === WebSocket.OPEN) {
    try {
      conn.send(message, (err) => {
        // Silently ignore ECONNABORTED - client disconnected (expected behavior)
        if (err && err.code !== 'ECONNABORTED') {
          console.error('Error sending message:', err.message);
        }
      });
    } catch (err) {
      // Connection already closed, ignore
    }
  }
}

/**
 * Handle incoming message from client
 */
function handleMessage(conn, room, docName, message) {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync: {
        encoding.writeVarUint(encoder, messageSync);
        const syncMessageType = syncProtocol.readSyncMessage(
          decoder,
          encoder,
          room.doc,
          conn // origin
        );

        // If encoder has data, send response
        if (encoding.length(encoder) > 1) {
          send(conn, encoding.toUint8Array(encoder));
        }

        // Broadcast updates to other clients (when we receive sync step 2 = update)
        if (syncMessageType === syncProtocol.messageYjsUpdate) {
          // Schedule save to database
          scheduleSave(docName);

          // The update was already applied to doc by readSyncMessage
          // The doc's 'update' event handler will broadcast to other clients
          // So we don't need to do anything else here
        }
        break;
      }
      case messageAwareness: {
        const update = decoding.readVarUint8Array(decoder);

        awarenessProtocol.applyAwarenessUpdate(
          room.awareness,
          update,
          conn
        );

        // Broadcast awareness to all other clients
        room.connections.forEach((otherConn) => {
          if (otherConn !== conn) {
            send(otherConn, message);
          }
        });
        break;
      }
    }
  } catch (err) {
    console.error('Error handling Y.js message:', err);
  }
}

/**
 * Set up a WebSocket connection for Y.js
 */
function setupConnection(conn, docName) {
  const room = getYDoc(docName);
  room.connections.add(conn);

  // Listen for document updates and broadcast to this connection
  const updateHandler = (update, origin) => {
    if (origin !== conn) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      send(conn, encoding.toUint8Array(encoder));
    }
  };
  room.doc.on('update', updateHandler);

  // Listen for awareness updates
  const awarenessHandler = ({ added, updated, removed }, origin) => {
    const changedClients = added.concat(updated).concat(removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients)
    );
    send(conn, encoding.toUint8Array(encoder));
  };
  room.awareness.on('update', awarenessHandler);

  // Send sync step 1 to client
  const encoderSync = encoding.createEncoder();
  encoding.writeVarUint(encoderSync, messageSync);
  syncProtocol.writeSyncStep1(encoderSync, room.doc);
  send(conn, encoding.toUint8Array(encoderSync));

  // Send current awareness state
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const encoderAwareness = encoding.createEncoder();
    encoding.writeVarUint(encoderAwareness, messageAwareness);
    encoding.writeVarUint8Array(
      encoderAwareness,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(conn, encoding.toUint8Array(encoderAwareness));
  }

  // Handle incoming messages
  conn.on('message', (message) => {
    handleMessage(conn, room, docName, message);
  });

  // Handle close
  conn.on('close', () => {
    room.connections.delete(conn);
    room.doc.off('update', updateHandler);
    room.awareness.off('update', awarenessHandler);

    // Remove client from awareness
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [room.doc.clientID],
      null
    );

    // Save immediately when last client disconnects
    if (room.connections.size === 0) {
      // Clear any pending save timer
      if (saveTimers.has(docName)) {
        clearTimeout(saveTimers.get(docName));
        saveTimers.delete(docName);
      }

      // Save now
      saveDocToDatabase(docName);

      // Cleanup from memory after delay (keep in DB)
      setTimeout(() => {
        const r = docs.get(docName);
        if (r && r.connections.size === 0) {
          r.awareness.destroy();
          r.doc.destroy();
          docs.delete(docName);
          console.log(`🗑️ Cleaned up in-memory room (persisted to DB): ${docName}`);
        }
      }, 30000);
    }
  });

  conn.on('error', (err) => {
    console.error(`❌ Y.js WebSocket error:`, err);
  });
}

/**
 * Initialize Y-WebSocket server
 */
function initYjsServer(server, basePath = '/yjs') {
  const wss = new WebSocket.Server({ noServer: true });

  // Handle upgrade manually to allow /yjs/{roomName} paths
  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;

    // Check if path starts with basePath
    if (pathname && pathname.startsWith(basePath)) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Not a Y.js request, destroy socket
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    // Extract room name from URL: /yjs/roomName -> roomName
    const pathname = req.url || '';
    const pathParts = pathname.split('/').filter(Boolean);
    const roomName = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'default';

    console.log(`🔗 Y.js client connected to room: ${roomName}`);

    setupConnection(ws, roomName);

    ws.on('close', () => {
      console.log(`🔌 Y.js client disconnected from room: ${roomName}`);
    });
  });

  console.log(`📡 Y.js WebSocket server initialized at path: ${basePath}/*`);

  return wss;
}

/**
 * Get document for external use
 */
function getDocument(roomName) {
  const room = docs.get(roomName);
  return room ? room.doc : null;
}

/**
 * Create a share session in database
 */
function createShareSession(roomId, projectId, ownerId, role = 'edit') {
  // Check if session already exists
  if (shareSessionService.sessionExists(roomId)) {
    return shareSessionService.getSession(roomId);
  }

  return shareSessionService.createSession({
    roomId,
    projectId,
    ownerId,
    role,
  });
}

/**
 * Get share session info
 */
function getShareSession(roomId) {
  return shareSessionService.getSession(roomId);
}

module.exports = {
  initYjsServer,
  getDocument,
  getYDoc,
  createShareSession,
  getShareSession,
};
