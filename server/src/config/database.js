// src/config/database.js
const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '../../slidequick.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database tables
 */
function initializeDatabase() {
  try {
    // Create projects table
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        owner_id TEXT NOT NULL
      )
    `);

    // Add owner_id column if it doesn't exist (migration)
    const projectCols = db.prepare("PRAGMA table_info('projects')").all();
    const hasOwner = projectCols.some((c) => c.name === 'owner_id');
    if (!hasOwner) {
      db.exec('ALTER TABLE projects ADD COLUMN owner_id TEXT');
    }

    // Create slides table
    db.exec(`
      CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        template TEXT NOT NULL,
        background_color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        slide_order INTEGER NOT NULL,
        image_url TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Add image_url column if it doesn't exist (migration)
    const slideCols = db.prepare("PRAGMA table_info('slides')").all();
    const hasImageUrl = slideCols.some((c) => c.name === 'image_url');
    if (!hasImageUrl) {
      db.exec('ALTER TABLE slides ADD COLUMN image_url TEXT');
    }

    // Add elements column if it doesn't exist (migration)
    const hasElements = slideCols.some((c) => c.name === 'elements');
    if (!hasElements) {
      db.exec('ALTER TABLE slides ADD COLUMN elements TEXT');
    }

    // Add saved_content column if it doesn't exist (migration for layout memory)
    const hasSavedContent = slideCols.some((c) => c.name === 'saved_content');
    if (!hasSavedContent) {
      db.exec("ALTER TABLE slides ADD COLUMN saved_content TEXT DEFAULT '{}'");
    }

    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // 2. Soft Delete / Trash & 4. Sharing (Projects)
    const projectColumns = db.prepare("PRAGMA table_info('projects')").all();

    // Add is_deleted
    if (!projectColumns.some(c => c.name === 'is_deleted')) {
      db.exec('ALTER TABLE projects ADD COLUMN is_deleted INTEGER DEFAULT 0');
    }
    // Add deleted_at
    if (!projectColumns.some(c => c.name === 'deleted_at')) {
      db.exec('ALTER TABLE projects ADD COLUMN deleted_at TEXT');
    }
    // Add view_token
    if (!projectColumns.some(c => c.name === 'view_token')) {
      db.exec('ALTER TABLE projects ADD COLUMN view_token TEXT');
    }
    // Add edit_token
    if (!projectColumns.some(c => c.name === 'edit_token')) {
      db.exec('ALTER TABLE projects ADD COLUMN edit_token TEXT');
    }
    // Add share_mode: 'private' | 'view' | 'edit' (default: private)
    if (!projectColumns.some(c => c.name === 'share_mode')) {
      db.exec("ALTER TABLE projects ADD COLUMN share_mode TEXT DEFAULT 'private'");
    }

    // 2.5 New Metadata Fields (Description, Lesson Name, Basic Info)
    if (!projectColumns.some(c => c.name === 'description')) {
      db.exec("ALTER TABLE projects ADD COLUMN description TEXT DEFAULT ''");
    }
    if (!projectColumns.some(c => c.name === 'lesson_name')) {
      db.exec("ALTER TABLE projects ADD COLUMN lesson_name TEXT DEFAULT ''");
    }
    if (!projectColumns.some(c => c.name === 'basic_info')) {
      db.exec("ALTER TABLE projects ADD COLUMN basic_info TEXT DEFAULT ''");
    }

    // 3. Chat & Comments System
    // Create Chat Messages Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Slide Comments Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS slide_comments (
        id TEXT PRIMARY KEY,
        slide_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'open', -- 'open', 'resolved'
        parent_id TEXT, -- For threaded replies
        created_at TEXT NOT NULL,
        FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Share Sessions Table (for persistent collaboration like Canva/Google Slides)
    db.exec(`
      CREATE TABLE IF NOT EXISTS share_sessions (
        room_id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        owner_id TEXT,
        role TEXT DEFAULT 'edit', -- 'edit' or 'view'
        yjs_state BLOB, -- Serialized Y.js document state
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        expires_at TEXT, -- Optional expiration
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 4. Template System
    // Create Templates Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        thumbnail_url TEXT,
        colors TEXT NOT NULL, -- JSON array of colors
        font_family TEXT NOT NULL,
        tags TEXT, -- Comma separated tags
        is_standard INTEGER DEFAULT 0, -- 1 for system templates
        style TEXT NOT NULL, -- JSON object for full style definition
        created_at TEXT NOT NULL
      )
    `);

    // Create Template Favorites Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS template_favorites (
        user_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (user_id, template_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
      )
    `);

    // Create Template History Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS template_history (
        user_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        last_used_at TEXT NOT NULL,
        PRIMARY KEY (user_id, template_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
      )
    `);

    // Add default_template_id to users if not exists
    const userColumns = db.prepare("PRAGMA table_info('users')").all();
    if (!userColumns.some(c => c.name === 'default_template_id')) {
      db.exec('ALTER TABLE users ADD COLUMN default_template_id TEXT');
    }

    // Seed Standard Templates
    const existingTemplates = db.prepare('SELECT count(*) as count FROM templates WHERE is_standard = 1').get();
    if (existingTemplates.count === 0) {
      console.log('🌱 Seeding standard templates...');
      const seedTemplates = [
        {
          id: 'tpl_modern_dark',
          name: 'Modern Dark',
          thumbnail_url: '', // TODO: Add a placeholder URL or generate on frontend
          colors: JSON.stringify(['#1e293b', '#f8fafc', '#3b82f6']),
          font_family: 'Inter, sans-serif',
          tags: 'modern,dark,business',
          is_standard: 1,
          style: JSON.stringify({
            backgroundColor: '#1e293b',
            textColor: '#f8fafc',
            accentColor: '#3b82f6',
            fontFamily: 'Inter, sans-serif'
          }),
          created_at: new Date().toISOString()
        },
        {
          id: 'tpl_vibrant_blue',
          name: 'Vibrant Blue',
          thumbnail_url: '',
          colors: JSON.stringify(['#eff6ff', '#1e3a8a', '#2563eb']),
          font_family: 'Roboto, sans-serif',
          tags: 'vibrant,blue,playful',
          is_standard: 1,
          style: JSON.stringify({
            backgroundColor: '#eff6ff',
            textColor: '#1e3a8a',
            accentColor: '#2563eb',
            fontFamily: 'Roboto, sans-serif'
          }),
          created_at: new Date().toISOString()
        },
        {
          id: 'tpl_elegant_serif',
          name: 'Elegant Serif',
          thumbnail_url: '',
          colors: JSON.stringify(['#fdfbf7', '#27272a', '#d97706']),
          font_family: 'Merriweather, serif',
          tags: 'elegant,serif,classic',
          is_standard: 1,
          style: JSON.stringify({
            backgroundColor: '#fdfbf7',
            textColor: '#27272a',
            accentColor: '#d97706',
            fontFamily: 'Merriweather, serif'
          }),
          created_at: new Date().toISOString()
        },
        {
          id: 'tpl_soft_gradient',
          name: 'Soft Gradient',
          thumbnail_url: '',
          colors: JSON.stringify(['linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', '#2d3748', '#6b46c1']),
          font_family: 'Outfit, sans-serif',
          tags: 'gradient,soft,creative',
          is_standard: 1,
          style: JSON.stringify({
            backgroundColor: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
            textColor: '#2d3748',
            accentColor: '#6b46c1',
            fontFamily: 'Outfit, sans-serif'
          }),
          created_at: new Date().toISOString()
        }
      ];

      const insertStmt = db.prepare(`
        INSERT INTO templates (id, name, thumbnail_url, colors, font_family, tags, is_standard, style, created_at)
        VALUES (@id, @name, @thumbnail_url, @colors, @font_family, @tags, @is_standard, @style, @created_at)
      `);

      const insertMany = db.transaction((templates) => {
        for (const tpl of templates) insertStmt.run(tpl);
      });

      insertMany(seedTemplates);
      console.log('✅ Standard templates seeded.');
    }

    console.log('✅ データベースが初期化されました');
  } catch (error) {
    console.error('❌ データベース初期化エラー:', error);
    throw error;
  }
}

module.exports = {
  db,
  initializeDatabase,
};
