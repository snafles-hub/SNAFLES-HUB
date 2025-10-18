const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const connectDB = require('./config/database');
const csrf = require('./middleware/csrf');
require('dotenv').config();
require('./worker/repayment');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';


// Security middleware
const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in production. Refusing to start.');
  process.exit(1);
}
if (isProd) {
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https:', 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https:'],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  }));
  // HSTS in production
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
} else {
  app.use(helmet({ crossOriginEmbedderPolicy: false }));
}
app.use(compression());

// Trust proxy (for correct IP when behind proxies / dev proxy)
app.set('trust proxy', 1);

// Rate limiting
if (isProd) {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10);
  const maxReq = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
  const baseLimiter = rateLimit({
    windowMs,
    max: maxReq,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again later.' },
    skip: (req) => req.method === 'OPTIONS' || req.path === '/api/health'
  });
  // Apply general limiter to most APIs
  app.use(baseLimiter);

  // Tighter limiter for auth endpoints (optional override via env)
  const authLimiter = rateLimit({
    windowMs,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many auth attempts. Please try again later.' },
  });
  app.use('/api/auth', authLimiter);
} else {
  console.log('🔓 Rate limiter disabled in development');
}

// CORS configuration - configure via env, fallback to local dev
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
const allowedOrigins = envOrigins.length > 0 ? envOrigins : [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5190',
  'http://127.0.0.1:5190',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic request sanitization to reduce NoSQL injection risk
app.use(require('./middleware/sanitize'));

// CSRF protection (double-submit cookie strategy)
app.use(csrf());

// Logging
app.use(morgan('combined'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/secondhand', require('./routes/secondhand'));
app.use('/api/cart', require('./routes/cart'));
// Chat/Negotiations removed for Phase-1 simple core
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/repayment', require('./routes/repayment'));
app.use('/api/helper-points', require('./routes/helperPoints'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/vendor/analytics', require('./routes/vendorAnalytics'));
app.use('/api/shipping', require('./routes/shipping'));
// Web auth redirect examples (form-POST friendly)
app.use('/', require('./routes/authRedirect'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket server ready`);
});

module.exports = { app, server };
