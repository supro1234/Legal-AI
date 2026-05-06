import { useState, useCallback } from 'react'
import { analyzeWithOpenRouter } from '../../utils/openrouter.js'

// ── Storage helpers (extension + web) ────────────────────────────────────────
const HISTORY_KEY = 'lexguard_history'
const MAX_HISTORY = 10

function isExtension() {
  return typeof chrome !== 'undefined' && chrome?.storage?.session
}

async function saveHistory(scan) {
  try {
    if (isExtension()) {
      await new Promise((res, rej) => {
        chrome.storage.session.get([HISTORY_KEY], r => {
          if (chrome.runtime.lastError) return rej(chrome.runtime.lastError)
          const hist = r[HISTORY_KEY] || []
          chrome.storage.session.set({ [HISTORY_KEY]: [scan, ...hist].slice(0, MAX_HISTORY) }, res)
        })
      })
    } else {
      // Web: use sessionStorage so history is per-tab and not persisted
      const raw  = sessionStorage.getItem(HISTORY_KEY)
      const hist = raw ? JSON.parse(raw) : []
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify([scan, ...hist].slice(0, MAX_HISTORY)))
    }
  } catch { /* non-critical */ }
}

export async function loadHistory() {
  try {
    if (isExtension()) {
      return new Promise((resolve, reject) => {
        chrome.storage.session.get([HISTORY_KEY], r => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
          resolve(r[HISTORY_KEY] || [])
        })
      })
    } else {
      const raw = sessionStorage.getItem(HISTORY_KEY)
      return raw ? JSON.parse(raw) : []
    }
  } catch {
    return []
  }
}

export function useAnalyze() {
  const [status,    setStatus]    = useState('idle')   // idle | scanning | done | error
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState(null)
  const [modelUsed, setModelUsed] = useState(null)
  const [fromCache, setFromCache] = useState(false)

  const analyze = useCallback(async ({ contractText, documentType, apiKey, model }) => {
    setStatus('scanning')
    setResult(null)
    setError(null)
    setModelUsed(null)
    setFromCache(false)

    try {
      if (!apiKey) throw new Error('No OpenRouter API key found. Please complete setup in the onboarding screen.')

      // Basic input sanitisation — strip null bytes and control chars before sending to AI
      const safeText = contractText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 8000)
      if (safeText.trim().length < 30) throw new Error('Contract text is too short to analyse.')

      const response = await analyzeWithOpenRouter(apiKey, documentType, safeText, model)

      const scan = {
        id:           Date.now().toString(),
        date:         new Date().toISOString(),
        documentType: documentType,
        model:        response.modelUsed,
        riskScore:    response.result.riskScore,
        riskLevel:    response.result.riskLevel,
        summary:      response.result.summary,
      }
      await saveHistory(scan)

      setResult(response.result)
      setModelUsed(response.modelUsed)
      setFromCache(response.fromCache)
      setStatus('done')

    } catch (err) {
      console.error('[LexGuard]', err.message)
      setError(err.message || 'Analysis failed. Please try again.')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
    setModelUsed(null)
    setFromCache(false)
  }, [])

  return { status, result, error, modelUsed, fromCache, analyze, reset }
}
