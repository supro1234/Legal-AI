import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { OPENROUTER_MODELS, DEFAULT_MODEL } from '../../utils/openrouter.js'

export default function AIModelPicker() {
  const [selectedModel, setSelectedModel] = useState(null)

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('selectedModel', r => {
        setSelectedModel(r.selectedModel || DEFAULT_MODEL)
      })
    } else {
      setSelectedModel(localStorage.getItem('selectedModel') || DEFAULT_MODEL)
    }
  }, [])

  const handleChange = (e) => {
    const newModel = e.target.value
    setSelectedModel(newModel)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ selectedModel: newModel })
    } else {
      localStorage.setItem('selectedModel', newModel)
    }
  }

  const model = OPENROUTER_MODELS.find(m => m.id === selectedModel) || OPENROUTER_MODELS.find(m => m.id === DEFAULT_MODEL)

  if (!model) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>AI Model:</span>
        <select
          value={selectedModel || DEFAULT_MODEL}
          onChange={handleChange}
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'var(--card-bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {OPENROUTER_MODELS.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.tag})
            </option>
          ))}
        </select>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
          background: model.tag === 'FREE' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          color:      model.tag === 'FREE' ? 'var(--success)'         : 'var(--warning)',
          border:     model.tag === 'FREE' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
          whiteSpace: 'nowrap'
        }}>
          {model.tag}
        </span>
      </div>
    </motion.div>
  )
}
