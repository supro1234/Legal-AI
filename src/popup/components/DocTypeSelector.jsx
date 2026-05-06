import { motion } from 'framer-motion'

const DOC_TYPES = [
  { id: 'rent_lease',    emoji: '🏠', label: 'Rent / House Lease' },
  { id: 'pg_hostel',     emoji: '🏢', label: 'PG / Hostel Agreement' },
  { id: 'business',      emoji: '🏗️',  label: 'Enterprise / Business Contract' },
  { id: 'privacy',       emoji: '🔒', label: 'Online Privacy Policy' },
  { id: 'terms',         emoji: '📄', label: 'Terms of Service' },
  { id: 'employment',    emoji: '📑', label: 'Employment / HR Agreement' },
]

const JURISDICTIONS = [
  { value: 'India',               label: '🇮🇳 India' },
  { value: 'India - West Bengal', label: '🇮🇳 India (West Bengal)' },
  { value: 'India - Maharashtra', label: '🇮🇳 India (Maharashtra)' },
  { value: 'India - Karnataka',   label: '🇮🇳 India (Karnataka)' },
  { value: 'India - Delhi',       label: '🇮🇳 India (Delhi)' },
  { value: 'India - Tamil Nadu',  label: '🇮🇳 India (Tamil Nadu)' },
  { value: 'US',                  label: '🇺🇸 United States' },
  { value: 'UK',                  label: '🇬🇧 United Kingdom' },
  { value: 'EU',                  label: '🇪🇺 European Union' },
]

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
}

export default function DocTypeSelector({ selected, onSelect, jurisdiction, onJurisdictionChange }) {
  return (
    <div>
      {/* ── Step label ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Step 1 — Document Type
        </p>

        {/* ── Jurisdiction dropdown ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.04em' }}>
            Jurisdiction:
          </span>
          <select
            value={jurisdiction || 'India'}
            onChange={e => onJurisdictionChange?.(e.target.value)}
            aria-label="Select jurisdiction"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 8px',
              paddingRight: 24,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
              minWidth: 140,
            }}
          >
            {JURISDICTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Document type cards ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}
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

export { DOC_TYPES, JURISDICTIONS }
