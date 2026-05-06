import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ResultCard from './ResultCard.jsx'
import { DisclaimerBanner, ConfidenceScore } from './DisclaimerBanner.jsx'

const TABS = [
  { key: 'pros',            label: 'Pros ✅' },
  { key: 'cons',            label: 'Cons ❌' },
  { key: 'redFlags',        label: 'Red Flags 🚨' },
  { key: 'negotiationTips', label: 'Negotiate 💬' },
]

export default function ResultTabs({ result }) {
  const [activeTab, setActiveTab] = useState('pros')

  const items = result[activeTab] || []

  return (
    <div>
      {/* ── Disclaimer + Confidence Score ── */}
      <DisclaimerBanner />
      <ConfidenceScore
        riskScore={result.riskScore}
        modelUsed={result.modelUsed}
      />

      {/* ── Tab bar ── */}
      <div className="tab-bar" style={{ marginBottom: 10 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ fontSize: 11 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {items.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No items in this category.
            </p>
          ) : (
            items.map((item, i) => (
              <ResultCard
                key={i}
                item={item}
                type={activeTab}
                index={i}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Applicable Laws (if present) ── */}
      {result.applicableLaws?.length > 0 && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📚 Applicable Laws
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.applicableLaws.map((law, i) => (
              <span key={i} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 99,
                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                color: 'var(--accent)', fontWeight: 600,
              }}>
                {law}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
