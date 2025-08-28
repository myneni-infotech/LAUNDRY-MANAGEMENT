# laundry-management

A modern API built with Bun, Express.js, and MongoDB.

## ⚠️ Development Disclaimer

**This project was generated using Koti CLI v2.0.0**

This is an initial development release and may contain errors, bugs, or security vulnerabilities. Please:
- Review all generated code before using in production
- Test thoroughly in development environments
- Update dependencies to latest versions
- Implement proper security measures for production use
- Use at your own discretion and risk

Generated code is provided "as-is" without warranty of any kind.

## 🚀 Features

- **Bun Runtime**: Lightning-fast JavaScript runtime
- **Express.js**: Minimal and flexible web framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Authentication**: JWT-based authentication system
- **Security**: Helmet, CORS, rate limiting
- **Error Handling**: Centralized error handling
- **Validation**: Request validation and sanitization
- **Environment Config**: Environment-based configuration

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed
- [MongoDB](https://www.mongodb.com/) installed and running
- Node.js 16+ (for development tools)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd laundry-management
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/laundry-management
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

## 🏗️BUN Project Structure

```
laundry-management/
├── src/
│   ├── config/
│   │   ├── database.ts         # MongoDB connection setup
│   │   ├── email.ts            # Email configuration (nodemailer)
│   │   ├── logger.ts           # Logger configuration
│   │   ├── passport.ts         # Google OAuth Passport.js setup
│   │   ├── s3.ts               # AWS S3 configuration
│   │   └── swagger.ts          # Swagger/OpenAPI 3.0 setup
│   ├── controllers/
│   │   ├── auditController.ts  # Audit logging controller
│   │   ├── authController.ts   # Authentication controllers
│   │   ├── documentController.ts # Document management controller
│   │   ├── tinyUrlController.ts # URL shortening controller
│   │   └── index.ts           # Controller exports
│   ├── middleware/
│   │   ├── auditMiddleware.ts  # Audit trail middleware
│   │   ├── auth.ts            # JWT authentication middleware
│   │   ├── errorHandler.ts    # Error handling middleware
│   │   ├── validation.ts      # Joi validation middleware
│   │   └── index.ts           # Middleware exports
│   ├── models/
│   │   ├── AuditLog.ts        # Audit logging model
│   │   ├── Document.ts        # Document management model
│   │   ├── TinyUrl.ts         # URL shortening model
│   │   ├── User.ts            # User model with Mongoose
│   │   └── index.ts           # Model exports
│   ├── routes/
│   │   ├── audit.ts           # Audit logging routes
│   │   ├── auth.ts            # Authentication routes
│   │   ├── document.ts        # Document management routes
│   │   ├── tinyUrl.ts         # URL shortening routes
│   │   └── index.ts           # General API routes
│   ├── services/
│   │   ├── auditService.ts    # Audit logging service
│   │   ├── authService.ts     # Authentication service
│   │   ├── documentService.ts # Document management service
│   │   ├── tinyUrlService.ts  # URL shortening service
│   │   └── index.ts           # Service exports
│   ├── types/
│   │   └── api.ts             # TypeScript type definitions
│   ├── utils/
│   │   ├── AppError.ts        # Custom error class
│   │   ├── logger.ts          # Logging utility
│   │   ├── responseHelper.ts  # Response helpers
│   │   ├── tokenUtils.ts      # JWT utilities
│   │   └── index.ts           # Utility exports
│   └── server.ts              # Main server file
├── dist/                      # Compiled JavaScript
├── uploads/                   # File upload storage
├── .env                       # Environment variables
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── bun.lockb                 # Bun lock file
└── README.md                 # Project documentation
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### General API
- `GET /api/` - API welcome message
- `GET /api/status` - Detailed API status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile (protected)
- `POST /api/auth/refresh-token` - Refresh access token
- `PUT /api/auth/profile` - Update user profile (protected)
- `POST /api/auth/logout` - User logout (protected)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/google` - Google OAuth login (if enabled)

### Document Management
- `POST /api/documents` - Upload document (protected)
- `GET /api/documents` - Get user documents (protected)
- `GET /api/documents/:id` - Get specific document (protected)
- `DELETE /api/documents/:id` - Delete document (protected)
- `POST /api/documents/profile-image` - Upload profile image (protected)

### URL Shortening
- `POST /api/tinyurl` - Create short URL
- `GET /api/tinyurl/:shortCode` - Redirect to original URL
- `GET /api/tinyurl` - Get user's URLs (protected)
- `DELETE /api/tinyurl/:id` - Delete short URL (protected)

### Audit Logging
- `GET /api/audit` - Get audit logs (admin only)
- `GET /api/audit/:entityId` - Get entity audit history (admin only)
- `GET /api/audit/users/:userId` - Get user audit history (admin only)

### Documentation
- `GET /api-docs` - Interactive Swagger UI documentation




## 🔧 Development

### Adding New Features

Use the Koti CLI to generate new components:

```bash
# Create new model
koti model Product

# Edit existing model
koti model:edit Product

# Create new controller
koti controller Product

# Create new service
koti service Email

# Create new middleware
koti middleware Logger

# Create new enum
koti enum Status
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, please open an issue in the repository or contact the maintainer.

---

Generated with ❤️ by [Koti CLI](https://www.npmjs.com/package/koti)