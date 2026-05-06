const express   = require('express')
const router    = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { buildSystemPrompt, buildUserMessage } = require('../prompts/legalPrompt')

router.post('/', async (req, res) => {
  const { contractText, documentType, model, apiKey } = req.body

  if (!contractText || !documentType || !model) {
    return res.status(400).json({ error: true, message: 'Missing contractText, documentType, or model.' })
  }
  if (!['claude', 'gemini'].includes(model)) {
    return res.status(400).json({ error: true, message: 'model must be "claude" or "gemini".' })
  }

  const systemPrompt = buildSystemPrompt(documentType)
  const userMessage  = buildUserMessage(documentType, contractText)

  try {
    let result

    if (model === 'claude') {
      const claudeKey = apiKey || process.env.ANTHROPIC_API_KEY
      if (!claudeKey) throw new Error('ANTHROPIC_API_KEY not set in server environment or extension.')

      const client   = new Anthropic({ apiKey: claudeKey })
      const response = await client.messages.create({
        model:      'claude-3-5-sonnet-20241022',
        max_tokens: 1800,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userMessage }],
      })

      const raw = response.content?.[0]?.text || ''
      result = JSON.parse(raw)

    } else {
      // gemini
      const geminiKey = apiKey || process.env.GOOGLE_GEMINI_API_KEY
      if (!geminiKey) throw new Error('GOOGLE_GEMINI_API_KEY not set in server environment or extension.')

      const genAI  = new GoogleGenerativeAI(geminiKey)
      const gemini = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      })

      const fullPrompt = `${systemPrompt}\n\n${userMessage}`
      const response   = await gemini.generateContent(fullPrompt)
      const raw        = response.response.text()
      result = JSON.parse(raw)
    }

    // Validate shape minimally
    if (typeof result.riskScore !== 'number') throw new Error('Invalid JSON response from AI: missing riskScore')

    return res.json(result)

  } catch (err) {
    console.error('[LexGuard /analyze]', err.message)
    return res.status(500).json({ error: true, message: err.message || 'AI analysis failed.' })
  }
})

module.exports = router
