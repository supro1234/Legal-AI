const express   = require('express')
const router    = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { getLegalPrompt, buildUserMessage } = require('../prompts/legalPrompt')

router.post('/', async (req, res) => {
  const { contractText, documentType, model, apiKey, jurisdiction = 'India' } = req.body

  if (!contractText || !documentType || !model) {
    return res.status(400).json({ error: true, message: 'Missing contractText, documentType, or model.' })
  }
  if (!['claude', 'gemini'].includes(model)) {
    return res.status(400).json({ error: true, message: 'model must be "claude" or "gemini".' })
  }

  // Use the India-aware prompt with jurisdiction context
  const systemPrompt = getLegalPrompt(documentType, jurisdiction)
  const userMessage  = buildUserMessage(documentType, contractText)

  try {
    let result
    let modelUsed

    if (model === 'claude') {
      const claudeKey = apiKey || process.env.ANTHROPIC_API_KEY
      if (!claudeKey) throw new Error('ANTHROPIC_API_KEY not set in server environment or extension.')

      const claudeModel = 'claude-3-5-sonnet-20241022'
      const client   = new Anthropic({ apiKey: claudeKey })
      const response = await client.messages.create({
        model:      claudeModel,
        max_tokens: 1800,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userMessage }],
      })

      const raw = response.content?.[0]?.text || ''
      result    = JSON.parse(raw)
      modelUsed = claudeModel

    } else {
      // gemini
      const geminiKey = apiKey || process.env.GOOGLE_GEMINI_API_KEY
      if (!geminiKey) throw new Error('GOOGLE_GEMINI_API_KEY not set in server environment or extension.')

      const geminiModel = 'gemini-1.5-flash'
      const genAI  = new GoogleGenerativeAI(geminiKey)
      const gemini = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { responseMimeType: 'application/json' },
      })

      const fullPrompt = `${systemPrompt}\n\n${userMessage}`
      const response   = await gemini.generateContent(fullPrompt)
      const raw        = response.response.text()
      result    = JSON.parse(raw)
      modelUsed = geminiModel
    }

    // Validate shape minimally
    if (typeof result.riskScore !== 'number') throw new Error('Invalid JSON response from AI: missing riskScore')

    // Inject modelUsed so frontend ConfidenceScore component can display it
    return res.json({ ...result, modelUsed })

  } catch (err) {
    console.error('[LexGuard /analyze]', err.message)
    return res.status(500).json({ error: true, message: err.message || 'AI analysis failed.' })
  }
})

module.exports = router
