/**
 * EventGeniePlan AI - Production Server Entrypoint
 * Full-Stack GenAI Event Planning Assistant
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler } = require('./server/middleware/errorHandler');
const { prototypePollutionGuard } = require('./server/middleware/validation');

// Route modules
const chatRoutes = require('./server/routes/chatRoutes');
const budgetRoutes = require('./server/routes/budgetRoutes');
const contractRoutes = require('./server/routes/contractRoutes');
const seatingRoutes = require('./server/routes/seatingRoutes');
const checklistRoutes = require('./server/routes/checklistRoutes');
const eventRoutes = require('./server/routes/eventRoutes');
const healthRoutes = require('./server/routes/healthRoutes');
const ecoRoutes = require('./server/routes/ecoRoutes');
const vendorRoutes = require('./server/routes/vendorRoutes');
const spatialRoutes = require('./server/routes/spatialRoutes');
const rsvpRoutes = require('./server/routes/rsvpRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Security Headers with Enhanced Helmet Protection
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        workerSrc: ["'self'", 'blob:', 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
        connectSrc: ["'self'", 'https://generativelanguage.googleapis.com', 'https://cdnjs.cloudflare.com']
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' }
  })
);

// High-Performance Observability Middleware (Server-Timing Header)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    res.setHeader('Server-Timing', `total;dur=${elapsedMs.toFixed(2)}`);
  });
  next();
});

// Compression & Body Parsing with Prototype Pollution Defense
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(prototypePollutionGuard);

// Rate Limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests received. Please wait a few moments before trying again.'
    }
  }
});

app.use('/api/', apiLimiter);

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/seating', seatingRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/eco', ecoRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/spatial', spatialRoutes);
app.use('/api/rsvp', rsvpRoutes);

// Fallback to index.html for Single Page Application navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} does not exist.`
      }
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling
app.use(errorHandler);

// Conditional listen for testability
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🧞 EventGeniePlan AI Server Running on Port ${PORT}`);
    console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
    console.log(`⚡ Environment:   ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI Engine:     ${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n[Process] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Process] HTTP server closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
