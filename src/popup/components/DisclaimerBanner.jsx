/**
 * DisclaimerBanner.jsx — Legal disclaimer + AI confidence score
 * Drop both components into ResultTabs or the results area.
 */
import { useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'

/* ── DisclaimerBanner ───────────────────────────────────────────────────── */
export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      role="alert"
      aria-label="Legal disclaimer"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 10,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
        position: 'relative',
      }}
    >
      <AlertTriangle
        size={15}
        color="#f59e0b"
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <p style={{
        margin: 0, fontSize: 11, color: 'var(--text)',
        lineHeight: 1.5, flex: 1, opacity: 0.85,
      }}>
        <strong style={{ color: '#f59e0b' }}>AI Analysis — Not Legal Advice.</strong>{' '}
        LexGuard highlights potential risks using AI. Results may be incomplete or incorrect.
        Always consult a qualified lawyer before signing any legal document.
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss disclaimer"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 2, color: 'var(--muted)', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

/* ── ConfidenceScore ────────────────────────────────────────────────────── */
const CONFIDENCE_LEVELS = [
  { max: 30,  label: 'Low Confidence',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   tip: 'Contract text may be too short or ambiguous for reliable analysis.' },
  { max: 60,  label: 'Moderate Confidence', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', tip: 'Analysis is likely accurate but verify critical clauses manually.' },
  { max: 80,  label: 'Good Confidence',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  tip: 'Analysis is reliable. Cross-check high-severity flags with a lawyer.' },
  { max: 101, label: 'High Confidence',   color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)', tip: 'Detailed contract. Analysis quality is high.' },
]

function getConfidenceLevel(riskScore) {
  // decisiveness: 0 when score=50 (ambiguous), 1 when score=0 or 100 (decisive)
  // score 98 → decisiveness = (98-50)/50 = 0.96 → confidence = 70 + 24 = 94% ✓
  // score 50 → decisiveness = 0             → confidence = 70%  (honest uncertainty) ✓
  // score 20 → decisiveness = (50-20)/50 = 0.6 → confidence = 85% ✓
  const decisiveness = Math.abs(riskScore - 50) / 50
  const confidence   = Math.round(70 + decisiveness * 25)
  return Math.min(100, confidence)
}

export function ConfidenceScore({ riskScore, modelUsed }) {
  const confidence = getConfidenceLevel(riskScore ?? 50)
  const level = CONFIDENCE_LEVELS.find(l => confidence < l.max) || CONFIDENCE_LEVELS[3]

  const [showTip, setShowTip] = useState(false)

  return (
    <div
      style={{
        background: level.bg,
        border: `1px solid ${level.border}`,
        borderRadius: 10,
        padding: '9px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
        position: 'relative',
      }}
    >
      {/* Bar */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: level.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {level.label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: level.color }}>
            {confidence}%
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${confidence}%`,
            background: `linear-gradient(90deg, ${level.color}88, ${level.color})`,
            borderRadius: 99,
            transition: 'width 600ms ease',
          }} />
        </div>
        {modelUsed && (
          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--muted)', opacity: 0.7 }}>
            Model: <code style={{ fontFamily: 'monospace' }}>{modelUsed}</code>
          </p>
        )}
      </div>

      {/* Info tooltip */}
      <button
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        aria-label="Confidence info"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', padding: 2, flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <Info size={13} />
      </button>

      {showTip && (
        <div style={{
          position: 'absolute', right: 8, top: '110%', zIndex: 20,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 10px', maxWidth: 220,
          fontSize: 11, color: 'var(--muted)', lineHeight: 1.45,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {level.tip}
        </div>
      )}
    </div>
  )
}

export default DisclaimerBanner
