import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { testOpenRouterKey, OPENROUTER_MODELS, DEFAULT_MODEL } from '../utils/openrouter'
import WelcomeCalligraphy from '../components/WelcomeCalligraphy'

async function fetchLiveFreeModels(apiKey) {
  try {
    const res = await fetch(
      "https://openrouter.ai/api/v1/models?supported_parameters=free",
      { headers: { "Authorization": `Bearer ${apiKey}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data
      .filter(m => m.pricing?.prompt === "0")
      .map(m => ({
        id: m.id,
        name: m.name,
        tag: "FREE",
        speed: m.context_length > 100000 ? "Large ctx" : "Standard"
      }))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export default function Options() {
  const [apiKey,        setApiKey]        = useState('')
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [status,        setStatus]        = useState(null)  // null | 'ok' | 'fail'
  const [statusMsg,     setStatusMsg]     = useState('')
  const [testing,       setTesting]       = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [liveModels,    setLiveModels]    = useState([])

  useEffect(() => {
    if (apiKey) {
      fetchLiveFreeModels(apiKey).then(setLiveModels);
    }
  }, [apiKey]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.session.get('openrouterKey', r => { if (r.openrouterKey) setApiKey(r.openrouterKey) })
      chrome.storage.local.get(['selectedModel', 'orAuthCache'], r => {
        if (r.selectedModel) setSelectedModel(r.selectedModel)
        // Show cached status without hitting API
        const c = r.orAuthCache
        if (c && c.status === 'ok' && Date.now() - c.ts < 600000) {
          setStatus('ok'); setStatusMsg('✅ Verified (cached)')
        }
      })
    }
  }, [])

  const handleTest = async () => {
    if (!apiKey.trim()) return setStatusMsg('⚠️ Enter your key first')
    setTesting(true); setStatusMsg('Checking…')
    try {
      const r = await testOpenRouterKey(apiKey.trim())
      setStatus('ok')
      setStatusMsg(r.fromCache ? '✅ Connected (cached)' : '✅ Connected!')
    } catch (e) {
      setStatus('fail'); setStatusMsg(`❌ ${e.message}`)
    }
    setTesting(false)
  }

  const handleKeyChange = (val) => {
    setApiKey(val); setStatus(null); setStatusMsg('')
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.remove('orAuthCache')
  }

  const handleSave = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.session.set({ openrouterKey: apiKey.trim(), lexguard_onboarded: true })
      chrome.storage.local.set({ selectedModel })
      chrome.storage.local.remove('orAuthCache')
    }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const tagColor = t => t === 'FREE'
    ? { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' }
    : { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)'  }

  return (
    <div style={{ padding: 28, maxWidth: 480, margin: '0 auto', fontFamily: "'Inter', sans-serif", background: '#06060f', color: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{
        textAlign: "center",
        paddingTop: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid var(--color-border-tertiary, #1e293b)",
        marginBottom: "20px"
      }}>
        <WelcomeCalligraphy subtitle="API Configuration" />
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 28px' }}>
        One key controls access to all AI models.
      </p>

      {/* API Key */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>OpenRouter API Key</label>
          {status === 'ok' && <span style={{ fontSize: 11, background: '#14532d', color: '#86efac', padding: '2px 10px', borderRadius: 99 }}>Connected</span>}
          {status === 'fail' && <span style={{ fontSize: 11, background: '#450a0a', color: '#fca5a5', padding: '2px 10px', borderRadius: 99 }}>Failed</span>}
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={e => handleKeyChange(e.target.value)}
          placeholder="sk-or-v1-..."
          style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '1px solid #1e293b', background: '#0d0d1f', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleTest}
            disabled={testing}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
          {statusMsg && <span style={{ fontSize: 13, color: status === 'ok' ? '#10b981' : status === 'fail' ? '#ef4444' : '#94a3b8' }}>{statusMsg}</span>}
        </div>
        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#a78bfa', textDecoration: 'none' }}>
          Get a free key → openrouter.ai/keys
        </a>
      </div>

      {/* Model Selector */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 12 }}>Default AI Model</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(liveModels.length > 0 
            ? [OPENROUTER_MODELS[0], ...liveModels, ...OPENROUTER_MODELS.filter(m => m.tag === 'PAID')]
            : OPENROUTER_MODELS
          ).map(m => {
            const tc = tagColor(m.tag)
            const isSelected = selectedModel === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(124,58,237,0.5)' : '1px solid #1e293b',
                  color: '#f1f5f9', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500 }}>{m.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{m.tag}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{m.speed}</span>
                  {isSelected && <span style={{ fontSize: 14 }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
      >
        {saved ? '✅ Saved!' : '💾 Save Settings'}
      </button>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (rootElement) createRoot(rootElement).render(<Options />)
