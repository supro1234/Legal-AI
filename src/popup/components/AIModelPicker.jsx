import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
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

  const model = OPENROUTER_MODELS.find(m => m.id === selectedModel) ||
    OPENROUTER_MODELS.find(m => m.id === DEFAULT_MODEL)

  if (!model) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>AI Model:</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{model.name}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
          background: model.tag === 'FREE' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          color:      model.tag === 'FREE' ? 'var(--success)'         : 'var(--warning)',
          border:     model.tag === 'FREE' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
        }}>
          {model.tag}
        </span>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{model.speed}</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { if (typeof chrome !== 'undefined' && chrome.runtime) chrome.runtime.openOptionsPage() }}
        title="Change model in Settings"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: 'var(--accent2)', fontWeight: 600,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit',
        }}
      >
        <Settings size={12} /> Change
      </motion.button>
    </motion.div>
  )
}
