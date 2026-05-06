/**
 * OpenRouter API integration for LexGuard AI.
 * Single key → access to all AI models (free & paid).
 * https://openrouter.ai
 */

const OPENROUTER_URL  = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_SITE = 'chrome-extension://lexguard'
const OPENROUTER_NAME = 'LexGuard AI'

export const DEFAULT_MODEL = "openrouter/free";

export const OPENROUTER_MODELS = [
  {
    id: "openrouter/free",
    name: "Auto (Best Free Available)",
    tag: "FREE",
    speed: "Auto",
    description: "Automatically picks the best working free model"
  },
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick",
    tag: "FREE",
    speed: "Fast"
  },
  {
    id: "meta-llama/llama-4-scout:free",
    name: "Llama 4 Scout",
    tag: "FREE",
    speed: "Fastest"
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3",
    tag: "FREE",
    speed: "Fast"
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    name: "Mistral Small 3.1",
    tag: "FREE",
    speed: "Fast"
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    tag: "PAID",
    speed: "Fast"
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    tag: "PAID",
    speed: "Fast"
  }
];

// ─── CONTRACT COMPRESSION ─────────────────────────────────────────────────────
const HIGH_PRIORITY = [
  'deposit','refund','terminat','evict','penalty','notice',
  'liable','liability','indemnity','waive','forfeit','arbitration','court',
  'electricity','maintenance','lock-in','data','share','third party',
  'increase','revision','non-refundable','immediately','forfeiture',
  'intellectual property','confidential','non-compete','at will','damages'
]

function compressContract(text, maxChars = 3000) {
  let cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (cleaned.length <= maxChars) return cleaned

  const sentences = cleaned.match(/[^.!?\n]+[.!?\n]+/g) || [cleaned]
  const seen = new Set()
  const important = [], rest = []

  for (const s of sentences) {
    const t = s.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    HIGH_PRIORITY.some(kw => t.toLowerCase().includes(kw)) ? important.push(t) : rest.push(t)
  }

  let result = ''
  for (const s of [...important, ...rest]) {
    if ((result + s).length > maxChars) break
    result += s + ' '
  }
  return result.trim() || cleaned.slice(0, maxChars)
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
// CRITICAL: This prompt is engineered to defeat the "invalid format" bug.
// - Explicit JSON-only instruction at start AND end
// - No angle-brackets (some models escape them and break JSON)
// - <think> tag instruction for models like DeepSeek R1
// - Numeric types stated explicitly
function buildSystemPrompt(docType) {
  return `You are LexGuard, a legal risk analyst. Analyze the ${docType} document.

IMPORTANT: Respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. No <think> tags. Start your response with { and end with }.

The JSON must have exactly these fields:
- riskScore: a number from 0 to 100 (integer, higher means more risk)
- riskLevel: exactly one of "Low" or "Medium" or "High"
- summary: a string with 2 sentences about the overall risk for the signer
- pros: an array of exactly 4 strings (benefits for the signer)
- cons: an array of exactly 4 strings (drawbacks or risks for the signer)
- redFlags: an array of objects, each with keys: clause (string), explanation (string), severity (one of "low", "medium", "high")
- negotiationTips: an array of exactly 3 strings (actionable advice)

Focus on: deposit traps, termination rights, hidden fees, data sharing, indemnity, lock-in periods, liability.

Output only the JSON. Nothing before or after it.`
}

// ─── RAW RESPONSE CLEANER ─────────────────────────────────────────────────────
// Handles all known pollution patterns from free LLMs:
// - DeepSeek R1 <think>...</think> chains
// - Markdown fences ```json ... ```
// - Trailing text after closing brace
// - HTML entities and escaped characters
function cleanRawResponse(raw) {
  let text = raw

  // Strip <think>...</think> blocks (DeepSeek R1 reasoning traces)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')

  // Strip markdown fences
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

  // Strip common preambles like "Here is the JSON:" or "Sure! "
  text = text.replace(/^[\s\S]*?(?=\{)/, '')

  // Find the outermost JSON object
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null

  return text.slice(start, end + 1).trim()
}

// ─── RESULT VALIDATOR & NORMALISER ───────────────────────────────────────────
// Coerces common type mistakes (string score, wrong case level) and validates
function validateAndNormalize(obj) {
  if (!obj || typeof obj !== 'object') return null

  // riskScore: must be number 0-100
  let score = obj.riskScore
  if (typeof score === 'string') score = parseInt(score, 10)
  if (typeof score !== 'number' || isNaN(score)) return null
  score = Math.max(0, Math.min(100, Math.round(score)))

  // riskLevel: must be Low/Medium/High
  let level = obj.riskLevel
  if (typeof level !== 'string') return null
  // Normalise casing
  level = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
  // Derive from score if level is wrong
  if (!['Low','Medium','High'].includes(level)) {
    level = score < 34 ? 'Low' : score < 67 ? 'Medium' : 'High'
  }

  // summary: must be non-empty string
  const summary = typeof obj.summary === 'string' && obj.summary.trim()
    ? obj.summary.trim()
    : 'Analysis complete. Review the sections below for details.'

  // pros/cons/negotiationTips: must be arrays of strings
  const toStrArr = (v, fallback) =>
    Array.isArray(v) && v.length > 0
      ? v.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).slice(0, 6)
      : fallback

  const pros = toStrArr(obj.pros, ['Standard agreement terms apply.'])
  const cons = toStrArr(obj.cons, ['Review all clauses carefully before signing.'])
  const negotiationTips = toStrArr(obj.negotiationTips, ['Seek independent legal advice before signing.'])

  // redFlags: array of {clause, explanation, severity}
  let redFlags = []
  if (Array.isArray(obj.redFlags)) {
    redFlags = obj.redFlags
      .filter(f => f && typeof f.clause === 'string')
      .map(f => ({
        clause:      f.clause || 'Unknown Clause',
        explanation: typeof f.explanation === 'string' ? f.explanation : 'Requires review.',
        severity:    ['low','medium','high'].includes((f.severity||'').toLowerCase())
          ? f.severity.toLowerCase()
          : 'medium',
      }))
      .slice(0, 8)
  }

  return { riskScore: score, riskLevel: level, summary, pros, cons, redFlags, negotiationTips }
}

// ─── CACHE HELPER ─────────────────────────────────────────────────────────────
function cacheKey(text, model) {
  let h = 5381
  const s = (text + model).replace(/\s+/, ' ').slice(0, 600)
  for (let i = 0; i < s.length; i++) { h = ((h << 5) + h) ^ s.charCodeAt(i); h |= 0 }
  return 'or_' + Math.abs(h).toString(36)
}

async function getCache(key) {
  // Extension cache (chrome.storage)
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return new Promise(resolve => {
      chrome.storage.local.get(key, d => {
        const e = d[key]
        if (!e || Date.now() - e.ts > 86400000) { chrome.storage.local.remove(key); resolve(null) }
        else resolve(e.result)
      })
    })
  }
  // Web cache (sessionStorage — per tab, auto-cleared)
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const e = JSON.parse(raw)
    if (Date.now() - e.ts > 3600000) { sessionStorage.removeItem(key); return null }
    return e.result
  } catch { return null }
}

async function setCache(key, result) {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return new Promise(r => chrome.storage.local.set({ [key]: { result, ts: Date.now() } }, r))
  }
  try {
    sessionStorage.setItem(key, JSON.stringify({ result, ts: Date.now() }))
  } catch { /* sessionStorage full or unavailable */ }
}

// ─── MAIN ANALYZE FUNCTION ────────────────────────────────────────────────────
export async function analyzeWithOpenRouter(apiKey, docType, contractText, modelId) {
  const model = modelId || DEFAULT_MODEL;
  const ck = cacheKey(contractText + docType, model);

  // 1. Cache hit — zero API call
  const cached = await getCache(ck);
  if (cached) return { result: cached, modelUsed: model, fromCache: true };

  // 2. Compress + build prompt
  const compressed   = compressContract(contractText);
  const systemPrompt = buildSystemPrompt(docType);

  // 3. Fallback chain — use different specific models if default fails
  const modelsToTry = model === "openrouter/free"
    ? [
        "openrouter/free",
        "meta-llama/llama-4-maverick:free",
        "deepseek/deepseek-chat-v3-0324:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
      ]
    : [model, "openrouter/free", "meta-llama/llama-4-maverick:free"];

  let lastError = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const m = modelsToTry[i];
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization':  `Bearer ${apiKey}`,
          'HTTP-Referer':   OPENROUTER_SITE,
          'X-Title':        OPENROUTER_NAME,
          'Content-Type':   'application/json',
        },
        body: JSON.stringify({
          model:       m,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: `Document Type: ${docType}\n\nContract Text:\n${compressed}` },
          ],
          max_tokens:  1200,
          temperature: 0.05,   // as deterministic as possible for JSON output
        }),
      });

      if (res.status === 404) { lastError = new Error(`Model ${m} not found`); continue; }
      if (res.status === 429) { lastError = new Error("Rate limited. Try again in a minute."); continue; }
      if (res.status === 401) throw new Error("Invalid OpenRouter API key. Please re-enter it on the setup screen.");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        lastError = new Error(err.error?.message || `Request failed (${res.status})`);
        continue;
      }

      const data = await res.json();
      const raw  = data.choices?.[0]?.message?.content;
      if (!raw?.trim()) { lastError = new Error("Empty response from model."); continue; }

      // Clean and extract JSON
      const jsonStr = cleanRawResponse(raw);
      if (!jsonStr) { lastError = new Error("No JSON found in response."); continue; }

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // One more attempt: try to fix common JSON issues (trailing commas, unquoted strings)
        try {
          const fixed = jsonStr
            .replace(/,\s*([}\]])/g, '$1')   // trailing commas
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // unquoted keys
          parsed = JSON.parse(fixed)
        } catch {
          lastError = new Error(`JSON parse failed for model ${m}.`);
          continue;
        }
      }

      // Validate and normalise field types
      const result = validateAndNormalize(parsed);
      if (!result) {
        lastError = new Error(`Model ${m} returned an unexpected structure.`);
        continue;
      }

      // Cache for 1h on web, 24h on extension
      await setCache(ck, result);
      return { result, modelUsed: m, fromCache: false };

    } catch (e) {
      lastError = e;
      // Only continue loop for recoverable errors; rethrow auth/network failures
      if (e.message?.includes('API key') || e.name === 'TypeError') throw e;
      continue;
    }
  }

  throw new Error(lastError?.message || "All models failed. Please try again.");
}

// ─── KEY TEST (zero token cost) ───────────────────────────────────────────────
export async function testOpenRouterKey(apiKey) {
  // Check cache — don't re-test within 10 min
  const cacheVal = await getCache('orAuthCache')
  if (cacheVal?.key === apiKey && cacheVal?.status === 'ok') {
    return { ok: true, fromCache: true }
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Invalid API key')
  }

  await setCache('orAuthCache', { key: apiKey, status: 'ok' })
  return { ok: true, fromCache: false }
}
