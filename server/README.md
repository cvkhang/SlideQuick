# SlideQuick Backend - Refactored Architecture

## 🎯 Overview

The backend has been refactored following **MVC (Model-View-Controller)** pattern with clear separation of concerns:

- **Config**: Configuration files (database, environment)
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and database operations
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, file upload, validation
- **Utils**: Helper functions (crypto, etc.)

## 📁 New Structure

```
server/
├── src/
│   ├── config/              # Configuration
│   │   ├── database.js      # Database connection & initialization
│   │   └── env.js           # Environment variables
│   │
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── uploadController.js
│   │
│   ├── services/            # Business logic
│   │   ├── projectService.js
│   │   └── userService.js
│   │
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── index.js         # Route aggregator
│   │
│   ├── middleware/          # Middleware
│   │   ├── auth.js          # JWT authentication
│   │   └── upload.js        # File upload (multer)
│   │
│   ├── utils/               # Utilities
│   │   └── crypto.js        # Password hashing
│   │
│   ├── app.js               # Express app setup
│   └── server.js            # Entry point
│
├── uploads/                 # Uploaded files
├── slidequick.db            # SQLite database
├── .env.example             # Environment template
├── package.json
│
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup Environment Variables

```bash
# Copy the example file
copy .env.example .env

# Edit .env and set your values
# Especially change JWT_SECRET in production!
```

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## 🔄 Migration from Old Structure

The refactored code maintains **100% API compatibility** with the old structure. No frontend changes are needed!

### Key Changes:

1. **Modular Architecture**: Code is now organized by responsibility
2. **Better Error Handling**: Centralized error handling in app.js
3. **Environment Variables**: Using dotenv for configuration
4. **File Upload Validation**: Added file type and size validation
5. **Cleaner Code**: Separated concerns for easier maintenance

### What Stayed the Same:

- ✅ All API endpoints work exactly the same
- ✅ Database schema unchanged
- ✅ Authentication flow unchanged
- ✅ Frontend compatibility maintained

## 📚 Code Organization

### Controllers
Handle HTTP requests and responses. Keep them thin - delegate to services.

```javascript
// Example: projectController.js
async function getAllProjects(req, res) {
  try {
    const userId = req.user && req.user.id;
    const projects = projectService.getAllProjects(userId);
    res.json(projects);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
}
```

### Services
Contain business logic and database operations.

```javascript
// Example: projectService.js
function getAllProjects(ownerId) {
  // Database queries and business logic here
  const projects = db.prepare('SELECT ...').all(ownerId);
  return projects.map(formatProject);
}
```

### Routes
Define API endpoints and attach middleware.

```javascript
// Example: projectRoutes.js
router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);
```

### Middleware
Reusable functions that process requests.

```javascript
// Example: auth.js
function requireAuth(req, res, next) {
  // Verify JWT token
  const token = extractToken(req);
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
}
```

## 🔒 Security Improvements

1. **Environment Variables**: Secrets stored in .env (not committed to git)
2. **File Upload Limits**: Max 5MB per file
3. **File Type Validation**: Only images allowed
4. **Error Messages**: Don't leak sensitive information
5. **Password Hashing**: Using scrypt with salt

## 🧪 Testing

```bash
# Test the API is running
curl http://localhost:3001/

# Test projects endpoint (requires auth)
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📖 API Documentation

### Authentication

**Register:**
```http
POST /api/register
Content-Type: application/json

{
  "username": "user1",
  "password": "password123",
  "email": "user@example.com"
}
```

**Login:**
```http
POST /api/login
Content-Type: application/json

{
  "username": "user1",
  "password": "password123"
}
```

### Projects (Protected - requires JWT)

**Get all projects:**
```http
GET /api/projects
Authorization: Bearer {token}
```

**Get project by ID:**
```http
GET /api/projects/:id
Authorization: Bearer {token}
```

**Create project:**
```http
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "uuid",
  "name": "My Project",
  "createdAt": "2025-12-10T00:00:00.000Z",
  "updatedAt": "2025-12-10T00:00:00.000Z",
  "slides": [...]
}
```

**Update project:**
```http
PUT /api/projects/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**Delete project:**
```http
DELETE /api/projects/:id
Authorization: Bearer {token}
```

### Upload

**Upload image:**
```http
POST /api/upload
Content-Type: multipart/form-data

Form field: image (file)
```

## 🐛 Troubleshooting

### Port already in use
```bash
netstat -ano | findstr :3001
taskkill /PID <process_id> /F
```

### Module not found errors
```bash
cd server
rm -rf node_modules
npm install
```

### Database errors
```bash
# Backup current database
copy slidequick.db slidequick-backup.db

# Delete and recreate
del slidequick.db
npm start
```

## 🚧 Future Enhancements

- [ ] Add input validation middleware (using Joi or Yup)
- [ ] Add request logging middleware (Morgan)
- [ ] Add API rate limiting
- [ ] Add unit tests (Jest)
- [ ] Add integration tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add database migrations tool
- [ ] Add Docker support

## 📝 Development Guidelines

1. **Keep controllers thin**: Move logic to services
2. **Use services for database**: No db queries in controllers
3. **Add JSDoc comments**: Document functions properly
4. **Handle errors**: Always use try-catch in controllers
5. **Validate input**: Check required fields
6. **Use middleware**: For cross-cutting concerns
7. **Follow naming conventions**: camelCase for functions, PascalCase for classes

## 🎓 Learning Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [SQLite Best Practices](https://www.sqlite.org/bestpractice.html)

---

**Need help?** Check the main project ONBOARDING.md or ask the team!
