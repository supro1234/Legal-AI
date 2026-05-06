/**
 * SamplesView.jsx — Dedicated "Try a Sample" tab screen
 * Shows pre-loaded contracts as interactive cards with preview.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronRight, CheckCircle, Zap } from 'lucide-react'
import { SAMPLES } from '../../utils/sampleContracts.js'

const RISK_COLORS = {
  rent_lease:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'MEDIUM RISK', icon: '🏠' },
  employment:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'HIGH RISK',   icon: '📑' },
  privacy:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'HIGH RISK',   icon: '🔒' },
}

const SAMPLE_META = {
  rent_lease: {
    headline: 'One-sided rental lease with hidden deposit traps',
    tags: ['Security Deposit', 'Lock-In', 'Termination'],
    preview: 'Deposit forfeiture at landlord\'s "sole discretion". No mutual termination notice. Arbitration only in Mumbai.',
  },
  employment: {
    headline: 'Aggressive NDA with global non-compete clause',
    tags: ['Non-Compete', 'IP Rights', 'Notice Period'],
    preview: '2-year global non-compete. All personal projects become company IP. 90 days notice from employee only.',
  },
  privacy: {
    headline: 'Loan app collecting contacts, SMS & always-on location',
    tags: ['DPDP Act', 'Data Sharing', 'Aadhaar'],
    preview: 'Contacts list + SMS access. 24/7 location tracking. Data shared with 500+ partners without consent.',
  },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

export default function SamplesView({ onSampleSelect }) {
  const [loadedId, setLoadedId] = useState(null)

  const handleLoad = (sample) => {
    setLoadedId(sample.id)
    setTimeout(() => {
      onSampleSelect(sample)
      setLoadedId(null)
    }, 500)
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 20 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-dim)', border: '1px solid var(--border-hi)',
          borderRadius: 99, padding: '5px 14px', marginBottom: 10,
        }}>
          <Zap size={12} color="var(--accent)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Real-World Contracts
          </span>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Try a Sample Contract
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          Load a real contract and see LexGuard in action — no paste needed.
        </p>
      </motion.div>

      {/* ── Sample Cards ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {SAMPLES.map(sample => {
          const meta = SAMPLE_META[sample.docType] || {}
          const risk = RISK_COLORS[sample.docType] || { color: 'var(--accent)', bg: 'var(--accent-dim)', label: 'REVIEW', icon: '📄' }
          const isLoaded = loadedId === sample.id

          return (
            <motion.div
              key={sample.id}
              variants={cardVariants}
              className="sample-card"
              onClick={() => handleLoad(sample)}
              whileHover={{ scale: 1.02, translateY: -3 }}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: 'pointer' }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: risk.bg, border: `1px solid ${risk.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {risk.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.3 }}>
                      {sample.label.replace(/^[^\s]+ /, '')}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                      {meta.headline}
                    </p>
                  </div>
                </div>

                {/* Risk badge + arrow */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                    background: risk.bg, color: risk.color, letterSpacing: '0.06em',
                    border: `1px solid ${risk.color}30`,
                  }}>
                    {risk.label}
                  </span>
                  {isLoaded
                    ? <CheckCircle size={16} color="var(--accent)" />
                    : <ChevronRight size={16} color="var(--muted)" />
                  }
                </div>
              </div>

              {/* Preview text */}
              <p style={{
                margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.45,
                padding: '8px 10px', borderRadius: 8,
                background: 'var(--surface2)',
                borderLeft: `2px solid ${risk.color}`,
              }}>
                {meta.preview}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(meta.tags || []).map(tag => (
                  <span key={tag} style={{
                    fontSize: 9, padding: '2px 7px', borderRadius: 99,
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--border-hi)',
                    color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.04em',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Load indicator */}
              <AnimatePresence>
                {isLoaded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                    }}
                  >
                    <CheckCircle size={13} />
                    Loaded — switching to Analyze tab…
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Footer note */}
      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', marginTop: 16, opacity: 0.7 }}>
        These samples are fictional contracts for demonstration purposes only.
      </p>
    </div>
  )
}
