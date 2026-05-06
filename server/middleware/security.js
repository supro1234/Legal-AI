"use strict";
/**
 * server/middleware/security.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hardened security middleware for LexGuard AI backend.
 * Import in server/index.js with:
 *
 *   const {
 *     cspMiddleware, globalLimiter, analyzeLimiter, burstLimiter,
 *     sanitizeInput, requestAudit, hardenResponse, getCorsOptions,
 *   } = require('./middleware/security')
 *
 * Then replace existing helmet/rate-limit/cors setup:
 *   app.use(hardenResponse)
 *   app.use(cspMiddleware)
 *   app.use(globalLimiter)
 *   app.use(cors(getCorsOptions()))
 *   app.use('/analyze', burstLimiter, analyzeLimiter, sanitizeInput, ...)
 */

const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto    = require("crypto");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CONTENT SECURITY POLICY
//    Locks down what scripts / styles / connections the browser allows.
// ═══════════════════════════════════════════════════════════════════════════════
const cspMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      styleSrc:    ["'self'", "'unsafe-inline'"],        // needed for Vite inline styles
      connectSrc:  ["'self'", "https://openrouter.ai"],  // ONLY openrouter — blocks data exfil
      imgSrc:      ["'self'", "data:"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      objectSrc:   ["'none'"],          // blocks Flash / plugins
      frameSrc:    ["'none'"],          // blocks iframe embedding
      workerSrc:   ["'self'", "blob:"], // PDF.js web worker
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  // ── Additional Helmet headers ──────────────────────────────────────────────
  hsts:                      { maxAge: 31_536_000, includeSubDomains: true, preload: true },
  noSniff:                   true,
  xssFilter:                 true,
  referrerPolicy:            { policy: "strict-origin-when-cross-origin" },
  frameguard:                { action: "deny" },
  permittedCrossDomainPolicies: false,
  crossOriginEmbedderPolicy:    false,  // keep false — breaks CDN fonts otherwise
  crossOriginResourcePolicy:    { policy: "same-origin" },
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. RATE LIMITERS — tiered: global → analyze endpoint → burst
// ═══════════════════════════════════════════════════════════════════════════════

/** 60 req/min across all routes — baseline DoS protection */
const globalLimiter = rateLimit({
  windowMs:        60 * 1_000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "Too many requests. Please wait a moment." },
  skip:            (req) => req.path === "/health", // health checks exempt
});

/** 8 analyses/min per IP — stricter than the old 10/min */
const analyzeLimiter = rateLimit({
  windowMs:        60 * 1_000,
  max:             8,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "Analysis rate limit reached. Please wait 60 seconds." },
  // Key by IP + partial user-agent to catch trivial spoofs
  keyGenerator: (req) => {
    const ua = req.headers["user-agent"] || "";
    return req.ip + ua.slice(0, 20);
  },
});

/** 3 req / 5 seconds — catches aggressive bots / double-click spam */
const burstLimiter = rateLimit({
  windowMs: 5 * 1_000,
  max:      3,
  message:  { error: "Sending too fast. Slow down." },
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. INPUT SANITISER
//    Strips dangerous characters + prompt-injection patterns BEFORE they reach
//    the AI model. Does NOT block — sanitises in-place and calls next().
// ═══════════════════════════════════════════════════════════════════════════════
const ALLOWED_DOC_TYPES   = ["rental", "employment", "terms", "privacy", "loan", "nda", "general",
                              "rent_lease", "pg_hostel", "enterprise_business", "online_privacy",
                              "terms_of_service", "employment_hr"];
const ALLOWED_JURISDICTIONS = ["India", "India - West Bengal", "India - Maharashtra",
                                "India - Karnataka", "India - Delhi", "US", "UK", "EU", "Singapore"];

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now/gi,
  /forget\s+(everything|all)/gi,
  /act\s+as\s+(a|an|the)/gi,
  /jailbreak/gi,
  /\[INST\]/gi,
  /<\|system\|>/gi,
  /\bDAN\b/g,          // "Do Anything Now" jailbreak
  /\bDeveloper Mode\b/gi,
];

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body.contractText === "string") {
    let text = req.body.contractText;

    // Hard length limit (belt-and-suspenders — body parser already limits to 50 kb)
    if (text.length > 40_000) {
      return res.status(400).json({ error: "Contract text too long. Max 40,000 characters." });
    }

    // Strip null bytes, control chars (except \n \r \t), zero-width chars, RTL override
    text = text
      .replace(/\0/g, "")
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
      .replace(/\u202E/g, "")     // RTL override — used in filename-spoofing attacks
      .trim();

    // Neutralise prompt-injection attempts (don't reject, just redact)
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        text = text.replace(pattern, "[REDACTED]");
      }
    }

    req.body.contractText = text;
  }

  // Whitelist docType
  if (req.body?.documentType) {
    const dt = (req.body.documentType || "").toLowerCase().replace(/ /g, "_");
    req.body.documentType = ALLOWED_DOC_TYPES.includes(dt) ? dt : "general";
  }

  // Whitelist jurisdiction
  if (req.body?.jurisdiction) {
    req.body.jurisdiction = ALLOWED_JURISDICTIONS.includes(req.body.jurisdiction)
      ? req.body.jurisdiction
      : "India";
  }

  next();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. REQUEST AUDIT
//    Flags suspicious requests to stdout — does NOT block, just logs.
// ═══════════════════════════════════════════════════════════════════════════════
function requestAudit(req, _res, next) {
  const suspicious = [
    // Multiple proxies in chain (VPN stacking)
    req.headers["x-forwarded-for"] && req.headers["x-forwarded-for"].split(",").length > 3,
    // Missing or suspiciously short UA
    !req.headers["user-agent"],
    req.headers["user-agent"] && req.headers["user-agent"].length < 10,
    // SQL injection fragments
    req.body?.contractText?.includes("SELECT ") && req.body?.contractText?.includes("FROM "),
    // XSS attempt
    req.body?.contractText?.includes("<script"),
  ].some(Boolean);

  if (suspicious && process.env.NODE_ENV === "production") {
    console.warn(
      `[SECURITY] Suspicious request — IP: ${req.ip} ` +
      `Path: ${req.path} ` +
      `UA: ${(req.headers["user-agent"] || "").slice(0, 60)}`
    );
  }

  next();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. RESPONSE HARDENING
//    Strips headers that leak server info; adds traceability + cache headers.
//    Apply FIRST (before Helmet) so Helmet can still override as needed.
// ═══════════════════════════════════════════════════════════════════════════════
function hardenResponse(_req, res, next) {
  res.removeHeader("X-Powered-By");    // hides "Express"
  res.removeHeader("Server");          // hides server software
  res.setHeader("X-Request-ID", crypto.randomUUID());   // traceability without info leak
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  next();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CORS OPTIONS (hardened)
//    Call as: app.use(cors(getCorsOptions()))
// ═══════════════════════════════════════════════════════════════════════════════
function getCorsOptions() {
  const allowedOrigins = [
    /^chrome-extension:\/\//,    // Chrome / Edge extension
    /^moz-extension:\/\//,       // Firefox extension
    "http://localhost:5173",      // Vite dev
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.ALLOWED_ORIGIN,  // Render deploy URL (set in env)
  ].filter(Boolean);

  return {
    origin: (origin, callback) => {
      // Allow same-origin requests (no Origin header)
      if (!origin) {
        return process.env.NODE_ENV === "production"
          ? callback(new Error("Origin required in production"))
          : callback(null, true);
      }
      const allowed = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin
      );
      if (allowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods:        ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials:    false,
    maxAge:         600,  // preflight cache: 10 minutes
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
module.exports = {
  cspMiddleware,
  globalLimiter,
  analyzeLimiter,
  burstLimiter,
  sanitizeInput,
  requestAudit,
  hardenResponse,
  getCorsOptions,
};
