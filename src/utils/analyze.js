/**
 * Core analysis engine.
 * - Compressed prompts (~120 tokens vs old ~400)
 * - Model fallback chain (never fail silently)
 * - Max 800 output tokens (vs old 1500-1800)
 */

import { compressContract } from './compress.js'

// ─── COMPACT PROMPT (saves ~500 tokens per call) ─────────────────────────────
function buildPrompt(docType) {
  return `You are a legal risk analyst reviewing a ${docType} document.
Return ONLY valid JSON — no markdown, no explanation, nothing else:
{
  "riskScore": <0-100, 100=most dangerous>,
  "riskLevel": "<Low|Medium|High>",
  "summary": "<2 sentences: overall verdict>",
  "pros": ["<up to 4 favorable clauses>"],
  "cons": ["<up to 4 unfavorable clauses>"],
  "redFlags": [{"clause":"<exact quote>","explanation":"<why risky>","severity":"<low|medium|high>"}],
  "negotiationTips": ["<up to 3 actionable tips>"]
}
Focus on: deposit traps, termination rights, hidden fees, data sharing, indemnity, lock-in periods, liability caps.`
}

// ─── GEMINI FALLBACK CHAIN ────────────────────────────────────────────────────
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',   // highest free limits, try first
  'gemini-2.0-flash',        // main free model
  'gemini-1.5-flash',        // older but stable fallback
]

export async function analyzeWithGemini(apiKey, docType, contractText) {
  const compressed = compressContract(contractText)
  const prompt = buildPrompt(docType)
  const fullMsg = `${prompt}\n\nDocument type: ${docType}\n\nContract text:\n${compressed}`

  let lastError = null

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullMsg }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      })

      // Rate limited — silently try next model
      if (res.status === 429) {
        console.warn(`[LexGuard] ${model} rate limited, trying next…`)
        lastError = new Error(`${model} rate limited`)
        continue
      }

      if (!res.ok) {
        const err = await res.json()
        const msg = err.error?.message || 'Gemini failed'
        // Quota exhausted — try next
        if (msg.toLowerCase().includes('quota') || msg.includes('limit')) {
          console.warn(`[LexGuard] ${model} quota hit: ${msg}`)
          lastError = new Error(msg)
          continue
        }
        throw new Error(msg)
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response from Gemini')

      const result = JSON.parse(text)
      return { result, modelUsed: model }

    } catch (e) {
      // Re-throw non-rate-limit errors immediately
      if (!e.message?.match(/rate.limit|quota|429|limit/i)) throw e
      lastError = e
      console.warn(`[LexGuard] ${model} failed:`, e.message)
    }
  }

  throw new Error(
    lastError?.message?.includes('quota')
      ? 'Gemini free quota exhausted. Create a new API key at aistudio.google.com/apikey or wait for quota reset.'
      : 'All Gemini models rate limited. Wait 1 minute and retry.'
  )
}

// ─── CLAUDE FALLBACK CHAIN ────────────────────────────────────────────────────
const CLAUDE_MODELS = [
  'claude-haiku-4-5',          // cheapest, highest rate limits — use first
  'claude-3-5-haiku-20241022', // stable haiku fallback
  'claude-3-5-sonnet-20241022' // sonnet last resort (more expensive)
]

export async function analyzeWithClaude(apiKey, docType, contractText) {
  const compressed = compressContract(contractText)
  const prompt = buildPrompt(docType)
  const userMsg = `Document type: ${docType}\n\nContract text:\n${compressed}`

  let lastError = null

  for (const model of CLAUDE_MODELS) {
    let res
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 800,
          system: prompt,
          messages: [{ role: 'user', content: userMsg }],
        }),
      })

      if (res.status === 429 || res.status === 529) {
        console.warn(`[LexGuard] ${model} overloaded/rate-limited, trying next…`)
        lastError = new Error(`${model} rate limited`)
        continue
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Claude API failed')
      }

      const data = await res.json()
      const text = data.content?.[0]?.text
      if (!text) throw new Error('Empty response from Claude')

      const result = JSON.parse(text)
      return { result, modelUsed: model }

    } catch (e) {
      if (e.message?.match(/overloaded|rate.limit|429|529/i)) {
        lastError = e
        continue
      }
      throw e
    }
  }

  throw new Error('Claude is currently unavailable. Try again in a moment.')
}
