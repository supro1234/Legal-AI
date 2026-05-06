const express = require('express')
const router  = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { GoogleGenerativeAI } = require('@google/generative-ai')

/**
 * POST /test-connection
 * Body: { model: "claude" | "gemini", apiKey: string }
 * Tests the API key with a minimal request and returns success or a specific error.
 */
router.post('/', async (req, res) => {
  const { model, apiKey } = req.body

  if (!model || !apiKey) {
    return res.status(400).json({ ok: false, error: 'MISSING_PARAMS', message: 'model and apiKey are required.' })
  }
  if (!['claude', 'gemini'].includes(model)) {
    return res.status(400).json({ ok: false, error: 'INVALID_MODEL', message: 'model must be "claude" or "gemini".' })
  }
  if (apiKey.trim().length < 10) {
    return res.status(400).json({ ok: false, error: 'INVALID_KEY_FORMAT', message: 'API key is too short.' })
  }

  try {
    if (model === 'claude') {
      const client = new Anthropic({ apiKey: apiKey.trim() })
      await client.messages.create({
        model:      'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages:   [{ role: 'user', content: 'Reply with: OK' }],
      })

    } else {
      // gemini
      const genAI  = new GoogleGenerativeAI(apiKey.trim())
      const gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      await gemini.generateContent('Reply with: OK')
    }

    return res.json({ ok: true, message: 'Connection successful!' })

  } catch (err) {
    const msg = err.message || ''
    console.error('[test-connection]', model, msg)

    // Classify the error for the frontend
    let code = 'UNKNOWN'
    let friendly = `Connection failed: ${msg.slice(0, 100)}` // Expose raw message to UI

    if (/invalid.*key|authentication|unauthorized|api_key/i.test(msg) || err.status === 401) {
      code = 'INVALID_KEY'
      friendly = 'Invalid API key. Please double-check your key from the provider console.'
    } else if (/rate.limit|quota|too.many|429/i.test(msg) || err.status === 429) {
      code = 'RATE_LIMIT'
      friendly = 'Rate limit hit. Your key is valid but has reached its quota. Wait a moment or upgrade your plan.'
    } else if (/permission|forbidden|403/i.test(msg) || err.status === 403) {
      code = 'NO_PERMISSION'
      friendly = 'Permission denied. Your key may not have access to this model.'
    } else if (/network|ECONNREFUSED|ENOTFOUND|timeout/i.test(msg)) {
      code = 'NETWORK_ERROR'
      friendly = 'Network error. Check your internet connection and that the server is running.'
    }

    return res.status(400).json({ ok: false, error: code, message: friendly, raw: msg })
  }
})

module.exports = router
