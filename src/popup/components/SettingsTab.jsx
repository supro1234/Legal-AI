import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Key } from 'lucide-react'
import { OPENROUTER_MODELS, testOpenRouterKey } from '../../utils/openrouter.js'

export default function SettingsTab({ apiKey, onApiKeyChange, selectedModel, onModelChange, onSave }) {
  const [localKey, setLocalKey] = useState(apiKey)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (localKey !== apiKey) {
      setTesting(true)
      setError('')
      try {
        await testOpenRouterKey(localKey)
        onApiKeyChange(localKey)
        onSave()
      } catch (e) {
        setError(e.message)
      } finally {
        setTesting(false)
      }
    } else {
      onSave()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={18} color="var(--accent)" /> LexGuard Settings
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8, color: 'var(--muted)' }}>
            OpenRouter API Key
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={14} color="var(--accent)" />
            <input
              type="password"
              value={localKey}
              onChange={e => {
                setLocalKey(e.target.value)
                setError('')
              }}
              placeholder="sk-or-v1-..."
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', outline: 'none', fontFamily: 'inherit', fontSize: 13
              }}
            />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8, color: 'var(--muted)' }}>
            Default AI Model
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OPENROUTER_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => onModelChange(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: selectedModel === m.id ? 'var(--accent-dim)' : 'var(--surface)',
                  border: selectedModel === m.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                  color: 'var(--text)', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: selectedModel === m.id ? 700 : 500 }}>{m.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: m.tag === 'FREE' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: m.tag === 'FREE' ? 'var(--success)' : 'var(--warning)',
                  }}>{m.tag}</span>
                  {selectedModel === m.id && <span style={{ fontSize: 14, color: 'var(--accent)' }}>✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <motion.button
          onClick={handleSave}
          disabled={testing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%', padding: 12, borderRadius: 10, border: 'none',
            background: testing ? 'var(--muted)' : 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer',
            fontSize: 14, fontFamily: 'inherit'
          }}
        >
          {testing ? 'Verifying...' : 'Save & Return'}
        </motion.button>
      </div>
    </motion.div>
  )
}
