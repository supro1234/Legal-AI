import { motion } from 'framer-motion'

const DOC_TYPES = [
  { id: 'rent_lease',    emoji: '🏠', label: 'Rent / House Lease' },
  { id: 'pg_hostel',     emoji: '🏢', label: 'PG / Hostel Agreement' },
  { id: 'business',      emoji: '🏗️',  label: 'Enterprise / Business Contract' },
  { id: 'privacy',       emoji: '🔒', label: 'Online Privacy Policy' },
  { id: 'terms',         emoji: '📄', label: 'Terms of Service' },
  { id: 'employment',    emoji: '📑', label: 'Employment / HR Agreement' },
]

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
}

export default function DocTypeSelector({ selected, onSelect }) {
  return (
    <div>
      <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Step 1 — Select Document Type
      </p>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}
      >
        {DOC_TYPES.map((dt) => {
          const isSelected = selected === dt.id
          return (
            <motion.button
              key={dt.id}
              variants={cardVariants}
              onClick={() => onSelect(dt.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background:   isSelected ? 'color-mix(in srgb, var(--accent) 15%, var(--surface))' : 'var(--surface)',
                border:       isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 10,
                padding:      '10px 8px',
                cursor:       'pointer',
                textAlign:    'left',
                display:      'flex',
                flexDirection:'column',
                gap:          4,
                boxShadow:    isSelected ? '0 0 12px color-mix(in srgb, var(--accent) 35%, transparent)' : 'none',
                transition:   'all 200ms ease',
              }}
            >
              <span style={{ fontSize: 22 }}>{dt.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text)', lineHeight: 1.3 }}>
                {dt.label}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

export { DOC_TYPES }
