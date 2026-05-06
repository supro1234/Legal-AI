import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ResultCard from './ResultCard.jsx'

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
      {/* Tab bar */}
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

      {/* Tab content */}
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
    </div>
  )
}
