require('dotenv').config()

const express      = require('express')
const cors         = require('cors')
const helmet       = require('helmet')
const rateLimit    = require('express-rate-limit')
const path         = require('path')
const analyzeRoute  = require('./routes/analyze')
const testConnRoute = require('./routes/testConnection')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Trusted origins ──────────────────────────────────────────────────────────
// Add your Render domain here once deployed, e.g. 'https://lexguard-ai.onrender.com'
const ALLOWED_ORIGINS = [
  /^chrome-extension:\/\/.+/,            // any Chrome/Edge extension
  'http://localhost:5173',               // Vite dev server
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : []),
]

// ── Security headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],  // needed for inline styles in React
      imgSrc:      ["'self'", 'data:'],
      connectSrc:  ["'self'", 'https://openrouter.ai'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,      // allow extension iframes
}))

// ── Body parsing — strict limit prevents DoS via huge payloads ───────────────
app.use(express.json({ limit: '50kb' }))

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (curl/Postman in dev) only when not in production
    if (!origin) {
      return process.env.NODE_ENV === 'production'
        ? cb(new Error('Origin required in production'))
        : cb(null, true)
    }
    const allowed = ALLOWED_ORIGINS.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    )
    cb(allowed ? null : new Error(`CORS blocked: ${origin}`), allowed)
  },
  methods:      ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials:  false,
}))

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global: 60 req/min per IP
app.use(rateLimit({
  windowMs:       60 * 1000,
  max:            60,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { error: true, message: 'Too many requests. Please wait.' },
}))

// Stricter on the heavy /analyze endpoint: 10 req/min per IP
const analyzeLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { error: true, message: 'Too many analysis requests. Please wait a minute.' },
})

// ── Input validation middleware for /analyze ─────────────────────────────────
function validateAnalyzeBody(req, res, next) {
  const { contractText, documentType } = req.body || {}

  if (typeof contractText !== 'string' || contractText.trim().length < 30) {
    return res.status(400).json({ error: true, message: 'contractText must be at least 30 characters.' })
  }
  if (contractText.length > 40_000) {
    return res.status(400).json({ error: true, message: 'contractText exceeds maximum length.' })
  }
  if (typeof documentType !== 'string' || !documentType.match(/^[a-z_]{2,40}$/)) {
    return res.status(400).json({ error: true, message: 'Invalid documentType.' })
  }

  // Strip null bytes / control characters before forwarding to AI
  req.body.contractText = contractText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  next()
}

// ── Serve Static Web App ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../dist'), {
  // Prevent sniffing attacks
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  },
}))

// ── API Routes ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'LexGuard AI' }))
app.use('/analyze', analyzeLimiter, validateAnalyzeBody, analyzeRoute)
app.use('/test-connection', testConnRoute)

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/analyze') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/test-connection')
  ) return next()
  res.sendFile(path.join(__dirname, '../dist/src/popup/index.html'))
})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Do NOT expose internal errors to the client in production
  const isProd = process.env.NODE_ENV === 'production'
  console.error('[Server Error]', err.message)
  res.status(err.status || 500).json({
    error:   true,
    message: isProd ? 'Internal server error.' : err.message,
  })
})

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🛡️  LexGuard AI running on http://localhost:${PORT}`)
  })
}

module.exports = app
