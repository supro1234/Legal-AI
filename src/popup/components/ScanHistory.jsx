import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { loadHistory } from '../hooks/useAnalyze.js'

const RISK_COLORS = { Low: '#4ade80', Medium: '#fbbf24', High: '#ef4444' }

export default function ScanHistory({ onClose }) {
  const [history,  setHistory]  = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading,  setLoading]  = useState(true)

  // Load async on mount — works for both chrome.storage and sessionStorage
  useEffect(() => {
    loadHistory().then(h => {
      setHistory(h)
      setLoading(false)
    })
  }, [])

  return (
    <>
      {/* Backdrop — covers full viewport */}
      <motion.div
        key="backdrop-history"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 90,
        }}
      />

      {/* Drawer — slides up from bottom, contained by fixed positioning */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        style={{
          position:      'fixed',
          bottom:        0,
          left:          0,
          right:         0,
          maxHeight:     '75vh',
          background:    'var(--surface)',
          borderTop:     '1px solid var(--border)',
          borderRadius:  '18px 18px 0 0',
          zIndex:        100,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          boxShadow:     '0 -8px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 18px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Scan History</span>
            <span style={{
              fontSize: 11, color: 'var(--muted)',
              background: 'var(--surface2)', padding: '1px 8px', borderRadius: 99,
              border: '1px solid var(--border)',
            }}>
              {history.length} / 10
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--muted)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 14px 20px' }}>
          {loading ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
              Loading…
            </p>
          ) : history.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
              No scans yet. Analyse your first contract!
            </p>
          ) : (
            history.map((h, i) => {
              const color  = RISK_COLORS[h.riskLevel] || 'var(--accent)'
              const isOpen = expanded === i
              const label  = (h.documentType || h.docType || '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
              return (
                <div
                  key={h.id || i}
                  style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--border)',
                    borderRadius: 12, marginBottom: 8, overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      padding: '12px 14px', display: 'flex', alignItems: 'center',
                      gap: 12, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {/* Score badge */}
                    <span style={{
                      fontSize: 20, fontWeight: 800, color,
                      minWidth: 38, textAlign: 'center',
                    }}>
                      {h.riskScore}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {label || 'Unknown Document'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(h.date).toLocaleString()} · {h.model || 'AI'}
                      </div>
                    </div>

                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 8px',
                      borderRadius: 99,
                      background: `color-mix(in srgb, ${color} 18%, transparent)`,
                      color, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                      letterSpacing: '0.05em', flexShrink: 0,
                    }}>
                      {(h.riskLevel || '').toUpperCase()}
                    </span>
                    {isOpen
                      ? <ChevronUp  size={14} color="var(--muted)" />
                      : <ChevronDown size={14} color="var(--muted)" />
                    }
                  </button>

                  <AnimatePresence>
                    {isOpen && h.summary && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{
                          margin: 0, padding: '0 14px 14px',
                          fontSize: 12, color: 'var(--muted)', lineHeight: 1.6,
                        }}>
                          {h.summary}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </>
  )
}
