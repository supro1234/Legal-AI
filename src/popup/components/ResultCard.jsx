import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react'

// ── Emoji sanitiser (Bug #2) ──────────────────────────────────────────────────
// Strips all Unicode emoji and variation selectors from AI-generated strings
// so no emoji leaks through from the model response.
function removeEmojis(str) {
  if (!str) return ''
  return str.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1FFFF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|\u{200D}|\u{FE0F}/gu,
    ''
  ).trim()
}

const SEVERITY_STYLES = {
  low:    { bg: '#1e3a2f', border: '#16a34a', text: '#4ade80', label: 'LOW' },
  medium: { bg: '#3a2a1e', border: '#d97706', text: '#fbbf24', label: 'MEDIUM' },
  high:   { bg: '#3a1e1e', border: '#dc2626', text: '#f87171', label: 'HIGH' },
}

// Lucide icon + colour per result type
const TYPE_ICON = {
  pros:            { Icon: CheckCircle,   color: '#22c55e' },
  cons:            { Icon: XCircle,       color: '#ef4444' },
  redFlags:        { Icon: AlertTriangle, color: '#f59e0b' },
  negotiationTips: { Icon: MessageSquare, color: '#3b82f6' },
}

export default function ResultCard({ item, type, index }) {
  const isRedFlag   = type === 'redFlags'
  const isNegotiate = type === 'negotiationTips'

  const bgColor = type === 'pros'        ? 'rgba(0,245,147,0.07)'
                : type === 'cons'        ? 'rgba(239,68,68,0.07)'
                : type === 'redFlags'    ? 'rgba(251,191,36,0.06)'
                : 'rgba(79,172,254,0.07)'

  const borderColor = type === 'pros'     ? 'rgba(0,245,147,0.2)'
                    : type === 'cons'     ? 'rgba(239,68,68,0.2)'
                    : type === 'redFlags' ? 'rgba(251,191,36,0.2)'
                    : 'rgba(79,172,254,0.2)'

  const { Icon, color: iconColor } = TYPE_ICON[type] || TYPE_ICON.negotiationTips
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
      {/* Clean SVG icon — no emoji */}
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        <Icon size={15} color={iconColor} strokeWidth={2} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isRedFlag && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)' }}>
              {removeEmojis(item.clause)}
            </span>
          </div>
        )}
        {isNegotiate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--accent)' }}>Original:</strong>{' '}
              {removeEmojis(item.clause || item)}
            </p>
            {item.counterProposal && (
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--success)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--success)' }}>Counter:</strong>{' '}
                {removeEmojis(item.counterProposal)}
              </p>
            )}
            {item.stateSpecificVariations && (
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.45, fontStyle: 'italic' }}>
                {removeEmojis(item.stateSpecificVariations)}
              </p>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55 }}>
            {isRedFlag
              ? removeEmojis(item.explanation)
              : removeEmojis(typeof item === 'string' ? item : JSON.stringify(item))
            }
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
