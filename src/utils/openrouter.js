/**
 * OpenRouter API integration for LexGuard AI.
 * Single key → access to all AI models (free & paid).
 * https://openrouter.ai
 */

import { log } from './debug.js'

const OPENROUTER_URL  = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_SITE = 'chrome-extension://lexguard'
const OPENROUTER_NAME = 'LexGuard AI'

export const DEFAULT_MODEL = "meta-llama/llama-4-scout:free";

// Real free models available on OpenRouter (verified May 2025)
// Ordered fastest → most capable
export const OPENROUTER_MODELS = [
  {
    id: "meta-llama/llama-4-scout:free",
    name: "Llama 4 Scout",
    tag: "FREE",
    speed: "Fastest",
    description: "Meta's fastest free model — recommended for quick scans"
  },
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick",
    tag: "FREE",
    speed: "Fast",
    description: "Higher quality analysis, slightly slower"
  },
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B",
    tag: "FREE",
    speed: "Fast",
    description: "Google's reliable free model"
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    tag: "FREE",
    speed: "Moderate",
    description: "Strong reasoning, good for complex contracts"
  },

  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    tag: "PAID",
    speed: "Fast",
    description: "Best accuracy — requires paid API credits"
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    tag: "PAID",
    speed: "Fast",
    description: "OpenAI's cost-efficient model — requires paid API credits"
  }
];

// All free model IDs in fallback order — used when a model returns 404/429
const FREE_FALLBACK_CHAIN = [
  "meta-llama/llama-4-scout:free",
  "meta-llama/llama-4-maverick:free",
  "google/gemma-3-27b-it:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen3-8b:free",
];

// ─── CONTRACT COMPRESSION ─────────────────────────────────────────────────────
// IMPORTANT: Preserve original document order.
// Re-ordering sentences (e.g. putting "risky" keywords first) caused the model
// to see only the scary-sounding clauses and score everything High.
// Strategy: clean whitespace, deduplicate, keep original order, trim at boundary.
function compressContract(text, maxChars = 4000) {
  // 1. Normalise whitespace
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // 2. Short enough — return as-is
  if (cleaned.length <= maxChars) return cleaned

  // 3. Split into sentences, deduplicate, PRESERVE ORIGINAL ORDER
  const sentences = cleaned.match(/[^.!?\n]+[.!?\n]+/g) || [cleaned]
  const seen = new Set()
  const deduped = []

  for (const s of sentences) {
    const t = s.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    deduped.push(t)
  }

  // 4. Fill up to maxChars in original order
  let result = ''
  for (const s of deduped) {
    if ((result + s).length > maxChars) break
    result += s + ' '
  }
  return result.trim() || cleaned.slice(0, maxChars)
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
// Per doc-type: focus areas AND concrete severity anchors.
// Severity anchors tell the model exactly what HIGH vs MEDIUM vs LOW means
// for THAT doc type — crucial so PG/Hostel flags are not marked "low" when they
// are actually the most harmful clauses in that context.
const DOC_FOCUS_MAP = {
  'PG / Hostel Agreement': {
    focus: `Focus on: security deposit refund conditions, eviction notice period, electricity overcharging, lock-in penalties, maintenance responsibilities, visitor restrictions, arbitrary rules.`,
    severity: `SEVERITY ANCHORS for PG / Hostel Agreement:
  HIGH: Deposit non-refundable or forfeited at owner\'s sole discretion | Eviction with less than 7 days notice | Electricity billed at above-market rate with no cap | Lock-in penalty that forfeits entire deposit | No recourse for tenant if owner violates terms
  MEDIUM: Deposit refundable but timeline unclear | 7-15 day eviction notice | Visitor restrictions that are somewhat restrictive | Lock-in period with partial penalty
  LOW: Standard house rules (no smoking, no loud music) | Reasonable visitor timing restrictions | Minor maintenance responsibilities on tenant`,
  },
  'Online Privacy Policy': {
    focus: `Focus on: data sale to third parties, data collection scope (contacts/SMS/location), retention periods, user rights under DPDP Act 2023, opt-out mechanisms, biometric/Aadhaar data, breach notification, children\'s data.`,
    severity: `SEVERITY ANCHORS for Online Privacy Policy:
  HIGH: Data sold or shared with advertisers/500+ partners | Always-on location collection | Contacts or SMS data harvested | Aadhaar/biometric data collected without UIDAI compliance | No breach notification | Data retained indefinitely | No opt-out available | Children\'s data without parental consent
  MEDIUM: Data shared within company group | Cookie tracking without granular opt-out | Retention period over 3 years | Vague "legitimate business purposes" exception
  LOW: Analytics tracking with opt-out available | Standard retention of 12-24 months | Data shared with regulated payment processors only`,
  },
  'Rent / House Lease': {
    focus: `Focus on: rent escalation clauses, security deposit conditions, maintenance split, termination rights, lock-in period, subletting restrictions, jurisdiction clause.`,
    severity: `SEVERITY ANCHORS for Rent / House Lease:
  HIGH: Landlord can terminate without any notice | Rent can increase at any time without cap | Deposit forfeiture at landlord\'s sole discretion with no timeline | Arbitration only in a distant city at tenant\'s expense | Entire deposit lost for minor violations
  MEDIUM: Deposit refundable but deductions not itemised | One-sided notice period (60 days tenant, none for landlord) | Rent increase clause with less than 30 days notice | No subletting under any circumstances
  LOW: Standard 11-month agreement | Reasonable maintenance responsibilities | Reasonable lock-in with proportional penalty`,
  },
  'Terms of Service': {
    focus: `Focus on: auto-renewal traps, account termination without notice, content ownership transfer, arbitration clauses, class action waivers, data usage rights, limitation of liability, unilateral policy changes.`,
    severity: `SEVERITY ANCHORS for Terms of Service:
  HIGH: Class action waiver | Mandatory arbitration with high fees | Company owns all user-generated content | Account terminated without notice and no appeal | No liability for company even in case of gross negligence | Unilateral policy changes without user consent
  MEDIUM: Auto-renewal without prominent notice | Limited liability for service failures | Broad content license to company | Dispute resolution in a different jurisdiction
  LOW: Standard acceptable use policy | Account suspension with appeal process | Data used for service improvement with opt-out`,
  },
  'Enterprise / Business Contract': {
    focus: `Focus on: payment terms, IP ownership, non-compete clauses, indemnity, liability caps, termination for convenience, SLA penalties, data handling.`,
    severity: `SEVERITY ANCHORS for Enterprise / Business Contract:
  HIGH: Unlimited indemnity with no cap | All IP assigned to client including pre-existing | Non-compete over 2 years across all industries | Unilateral termination for convenience without payment | No liability cap for vendor | Payment terms over 90 days
  MEDIUM: Broad IP assignment clause | Non-compete 1-2 years in same sector | 60-90 day payment terms | Liability cap below contract value | Termination for convenience with 30-day notice
  LOW: Standard 30-day payment terms | Reasonable IP ownership for deliverables | Mutual non-disparagement | Reasonable liability caps at 2x contract value`,
  },
  'Employment / HR Agreement': {
    focus: `Focus on: notice period, non-compete duration and scope, IP assignment, moonlighting clause, bonus clawback, arbitration, termination grounds.`,
    severity: `SEVERITY ANCHORS for Employment / HR Agreement:
  HIGH: Global non-compete over 1 year | All personal projects assigned to employer | No overtime compensation (violates Indian labour law) | Immediate termination without any cause or notice in first year | Employer can change terms unilaterally | Foreign jurisdiction for disputes
  MEDIUM: Non-compete 6-12 months in same city/sector | Perpetual confidentiality (no time limit) | 90-day notice from employee only | Bonus clawback without clear conditions
  LOW: Standard 30-day notice on both sides | Non-solicitation of clients for 6 months | PF deduction as per law | Standard probation period`,
  },
}

function buildSystemPrompt(docType) {
  const docConfig = DOC_FOCUS_MAP[docType]
  const specificFocus = docConfig
    ? docConfig.focus
    : 'Focus on unfair clauses, hidden fees, rights waivers, and one-sided terms.'
  const severityAnchors = docConfig
    ? docConfig.severity
    : `SEVERITY: HIGH = completely unfair/illegal | MEDIUM = somewhat unfair | LOW = mildly restrictive but standard`

  return `You are LexGuard, an expert legal risk analyst for ${docType} documents under Indian law.
Your task: identify actual problems in the document and classify their severity ACCURATELY.

${specificFocus}

${severityAnchors}

SEVERITY CLASSIFICATION RULES (apply strictly using the anchors above):
- "high" severity = signer loses rights entirely, no recourse, illegal clause, extreme financial harm
- "medium" severity = unfair but signer retains some protection, can be contested, imbalanced
- "low" severity = mildly restrictive but common/standard in this doc type

DO NOT downgrade severity to avoid seeming alarmist. If a clause matches a HIGH anchor above, mark it HIGH.
DO NOT upgrade severity for standard clauses that are common in this doc type.
Never include emojis in any JSON field values.

IMPORTANT: Respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. No <think> tags. Start your response with { and end with }.

The JSON must have exactly these fields:
- riskScore: integer 0-100 (your honest assessment of overall risk)
- riskLevel: exactly one of "Low" or "Medium" or "High"
- summary: 2 sentences, factual assessment of this specific document
- pros: array of exactly 4 strings (genuine protections found in THIS document)
- cons: array of 3-4 strings (actual problems found, not invented)
- redFlags: array of objects with keys: clause (string), explanation (string — plain English), severity ("low", "medium", or "high" — use the anchors above)
- negotiationTips: array of exactly 3 strings (specific to THIS document)

If document text is too short or unclear, return:
{ "riskScore": 0, "riskLevel": "Low", "error": "insufficient_text", "summary": "Not enough contract text to analyze accurately." }

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

// ─── TEXT-BASED RISK HEURISTIC ───────────────────────────────────────────────────
// Runs LOCALLY on raw contract text — no AI involved.
// Looks for concrete dangerous/safe phrases and returns a score adjustment.
// This is the ground-truth layer that corrects AI severity hallucinations.
// Adjustment range: −30 (clearly safe) to +40 (clearly dangerous).
function quickRiskHints(text) {
  const t = text.toLowerCase()
  let adj = 0

  // ── HIGH-RISK PHRASES (add points) ──────────────────────────────────
  // Deposit / Money traps
  if (/sole\s+discretion/i.test(t))                     adj += 14
  if (/forfeit|forfeiture/i.test(t))                    adj += 12
  if (/non.?refundable\s+(security\s+)?deposit/i.test(t)) adj += 16
  if (/deposit.*without\s+(any\s+)?reason/i.test(t))    adj += 14
  if (/no\s+interest.*deposit|deposit.*no\s+interest/i.test(t)) adj += 6

  // Termination without notice
  if (/terminat.*without\s+(any\s+)?notice/i.test(t))  adj += 14
  if (/evict.*without\s+notice/i.test(t))               adj += 16
  if (/immediate.*evict/i.test(t))                      adj += 14
  if (/landlord.*terminat.*any\s+time/i.test(t))        adj += 12
  if (/owner.*terminat.*any\s+time/i.test(t))           adj += 12

  // Data / Privacy violations
  if (/sell.*your\s+data|data.*sold/i.test(t))          adj += 18
  if (/500\s*\+?\s*(lending\s+)?partner/i.test(t))      adj += 18
  if (/contacts\s+(list|access)/i.test(t))              adj += 14
  if (/sms\s+message/i.test(t))                         adj += 14
  if (/always.?on\s+location|24\/7.*location/i.test(t)) adj += 16
  if (/aadhaar/i.test(t))                               adj += 10
  if (/retain.*indefinitely|indefinitely.*retain/i.test(t)) adj += 10
  if (/retained.*forever|forever.*retain/i.test(t))     adj += 10

  // Employment abuse
  if (/global.*non.?compete/i.test(t))                  adj += 16
  if (/personal.*project.*property|personal.*project.*company/i.test(t)) adj += 14
  if (/no\s+overtime\s+compensation/i.test(t))          adj += 14
  if (/as\s+many\s+hours\s+as\s+necessary/i.test(t))    adj += 12
  if (/new\s+york.*jurisdiction|courts.*new\s+york/i.test(t)) adj += 12

  // Rent / Lease traps
  if (/rent.*increase.*any\s+time/i.test(t))            adj += 12
  if (/rent.*sole\s+discretion/i.test(t))               adj += 12
  if (/arbitration.*expense.*tenant/i.test(t))          adj += 10
  if (/arbitration.*mumbai|mumbai.*arbitration/i.test(t)) adj += 8

  // ── LOW-RISK PHRASES (subtract points) ───────────────────────────
  if (/refundable\s+within\s+\d+\s+day/i.test(t))        adj -= 12
  if (/mutual.*notice|notice.*both\s+parties/i.test(t)) adj -= 10
  if (/itemis(ed|ed)\s+deduction/i.test(t))             adj -= 8
  if (/opt.?out/i.test(t))                              adj -= 8
  if (/right\s+to\s+delet/i.test(t))                   adj -= 8
  if (/your\s+data\s+is\s+not\s+sold/i.test(t))        adj -= 12
  if (/we\s+do\s+not\s+sell/i.test(t))                 adj -= 12
  if (/both\s+parties.*equal/i.test(t))                adj -= 8
  if (/\d+\s+day.*notice.*both/i.test(t))              adj -= 8

  // Cap adjustment
  return Math.max(-30, Math.min(40, adj))
}

// ─── FLAG-BASED RISK SCORER ────────────────────────────────────────────────────
// Converts AI\'s redFlags array into a score.
// INTENTIONALLY lower weights so AI severity labels can\'t force High alone.
// quickRiskHints() text analysis provides the corrective adjustment.
//
//   High flag:   +12 pts   Medium flag:  +7 pts   Low flag: +2 pts
//   Each con:   + 2 pts
//   0 red flags: hard cap at 20 (Low)
//
// Examples (before text adjustment):
//   3 high AI flags + 4 cons  = 36+8  = 44 → Medium
//   5 high AI flags + 4 cons  = 60+8  = 68 → High (needs many flags)
//   2 medium + 2 low + 3 cons = 14+4+6= 24 → Low
function computeRiskScore(redFlags, cons) {
  const flags = Array.isArray(redFlags) ? redFlags : []
  const consCount = Array.isArray(cons) ? Math.min(cons.length, 5) : 0

  if (flags.length === 0) return Math.min(20, consCount * 3)

  let flagScore = 0
  for (const f of flags) {
    const sev = (f.severity || '').toLowerCase()
    if (sev === 'high')        flagScore += 12
    else if (sev === 'medium') flagScore += 7
    else                       flagScore += 2
  }
  return Math.min(95, flagScore + consCount * 2)
}

// ─── RESULT VALIDATOR & NORMALISER ───────────────────────────────────────────
// Parses AI output, normalises types, then OVERRIDES the AI's riskScore with
// a deterministic score computed from the actual red flags + cons found.
function validateAndNormalize(obj) {
  if (!obj || typeof obj !== 'object') return null

  // Parse AI's raw riskScore as a soft signal only (null = ignore)
  let aiScore = obj.riskScore
  if (typeof aiScore === 'string') aiScore = parseInt(aiScore, 10)
  if (typeof aiScore !== 'number' || isNaN(aiScore)) aiScore = null

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

  // ── DETERMINISTIC SCORING ─────────────────────────────────────────────────
  // Compute from what the model actually FOUND (flags + severity + cons count).
  // The AI's riskScore is only a 20% soft signal — see computeRiskScore().
  const score = computeRiskScore(redFlags, cons, aiScore)
  const level = score < 34 ? 'Low' : score < 67 ? 'Medium' : 'High'

  return { riskScore: score, riskLevel: level, summary, pros, cons, redFlags, negotiationTips }
}



// ─── CACHE HELPER ─────────────────────────────────────────────────────────────
// Key includes text + docType so different doc types on the same text
// never return a stale cross-type cached result.
// CACHE_VERSION: bump this whenever the system prompt changes significantly
// so old biased cached results are automatically invalidated.
const CACHE_VERSION = 'v4'

function cacheKey(text, model) {
  let h = 5381
  const s = (text + model).replace(/\s+/, ' ').slice(0, 600)
  for (let i = 0; i < s.length; i++) { h = ((h << 5) + h) ^ s.charCodeAt(i); h |= 0 }
  return `or_${CACHE_VERSION}_` + Math.abs(h).toString(36)
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

  log.analyze('Starting analysis', { docType, model, textLength: contractText.length });

  // 1. Cache hit — zero API call
  const cached = await getCache(ck);
  if (cached) {
    log.cache('Cache hit', ck);
    return { result: cached, modelUsed: model, fromCache: true };
  }

  // 2. Compress + build prompt
  const compressed   = compressContract(contractText);
  const systemPrompt = buildSystemPrompt(docType);
  log.prompt('System prompt', systemPrompt);
  log.analyze('Compressed text length', compressed.length);

  // 3. Fallback chain — tries multiple free models in order until one works
  // If user picked a specific model, try it first, then fall back to the chain.
  const isFreeDefault = FREE_FALLBACK_CHAIN.includes(model) || model === DEFAULT_MODEL
  const modelsToTry = isFreeDefault
    ? FREE_FALLBACK_CHAIN
    : [model, ...FREE_FALLBACK_CHAIN]

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
          model:             m,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: `Document Type: ${docType}\n\nContract Text:\n${compressed}` },
          ],
          max_tokens:        1200,
          temperature:       0.2,    // slightly above deterministic — reduces systematic bias
          top_p:             0.9,
          frequency_penalty: 0.3,    // discourages repetitive high-risk phrasing
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

      // ── TEXT-BASED CORRECTION ─────────────────────────────────────
      // Apply the locally-computed text heuristic on top of the AI\'s
      // flag-based score. This corrects systematic AI severity bias.
      const textAdj = quickRiskHints(contractText)
      const correctedScore = Math.max(5, Math.min(100, result.riskScore + textAdj))
      result.riskScore = correctedScore
      result.riskLevel = correctedScore < 34 ? 'Low' : correctedScore < 67 ? 'Medium' : 'High'
      // ────────────────────────────────────────────────────────

      log.analyze('Scores', { flagScore: result.riskScore - textAdj, textAdj, finalScore: correctedScore, level: result.riskLevel });

      // Cache for 1h on web, 24h on extension
      log.cache('Saving to cache', ck);
      await setCache(ck, result);
      return { result, modelUsed: m, fromCache: false };

    } catch (e) {
      lastError = e;
      // Only continue loop for recoverable errors; rethrow auth/network failures
      if (e.message?.includes('API key') || e.name === 'TypeError') throw e;
      continue;
    }
  }

  throw new Error(
    lastError?.message ||
    "All models failed. Check your API key in Settings, or try again in a moment."
  );
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
