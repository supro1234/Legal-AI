import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const SEVERITY_STYLES = {
  low:    { bg: '#1e3a2f', border: '#16a34a', text: '#4ade80', label: 'LOW' },
  medium: { bg: '#3a2a1e', border: '#d97706', text: '#fbbf24', label: 'MEDIUM' },
  high:   { bg: '#3a1e1e', border: '#dc2626', text: '#f87171', label: 'HIGH' },
}

export default function ResultCard({ item, type, index }) {
  const isRedFlag = type === 'redFlags'
  const isNegotiate = type === 'negotiationTips'

  const bgColor   = type === 'pros'        ? 'rgba(0,245,147,0.07)'
                  : type === 'cons'        ? 'rgba(239,68,68,0.07)'
                  : type === 'redFlags'    ? 'rgba(251,191,36,0.06)'
                  : 'rgba(79,172,254,0.07)'

  const borderColor = type === 'pros'      ? 'rgba(0,245,147,0.2)'
                    : type === 'cons'      ? 'rgba(239,68,68,0.2)'
                    : type === 'redFlags'  ? 'rgba(251,191,36,0.2)'
                    : 'rgba(79,172,254,0.2)'

  const iconColor = type === 'pros'        ? 'var(--success)'
                  : type === 'cons'        ? 'var(--danger)'
                  : type === 'redFlags'    ? 'var(--warning)'
                  : 'var(--accent)'

  const icon = type === 'pros' ? '✅' : type === 'cons' ? '❌' : type === 'redFlags' ? '🚨' : '💬'

  const sev = isRedFlag && item.severity ? SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.medium : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        background:   bgColor,
        border:       `1px solid ${borderColor}`,
        borderRadius: 10,
        padding:      '12px 14px',
        display:      'flex',
        gap:          10,
        position:     'relative',
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1.4 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isRedFlag && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)' }}>
              {item.clause}
            </span>
          </div>
        )}
        {isNegotiate ? (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--accent)' }}>#{index + 1}</strong> {item}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55 }}>
            {isRedFlag ? item.explanation : item}
          </p>
        )}
      </div>
      {sev && (
        <span
          style={{
            position:    'absolute',
            top:         8,
            right:       10,
            fontSize:    9,
            fontWeight:  800,
            padding:     '2px 7px',
            borderRadius: 99,
            background:  sev.bg,
            color:       sev.text,
            border:      `1px solid ${sev.border}`,
            letterSpacing: '0.06em',
            flexShrink:  0,
          }}
        >
          {sev.label}
        </span>
      )}
    </motion.div>
  )
}
