import { motion } from 'framer-motion'
import { Sparkles, Zap, Target, Lock, Globe, BarChart3, FileCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'Batch Auditing',
    desc: 'Scan up to 50 contracts at once — perfect for HR teams, law firms, and landlords.',
    tag: 'Coming Q3',
    color: '#f59e0b',
  },
  {
    icon: Target,
    title: 'Clause-by-Clause Negotiation',
    desc: 'AI suggests specific, legally sound counter-clauses tailored for all Indian states.',
    tag: 'Coming Q3',
    color: '#3ecf8e',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    desc: 'Analyze contracts in Hindi, Bengali, Tamil, and 10+ regional Indian languages.',
    tag: 'Coming Q4',
    color: '#818cf8',
  },
  {
    icon: BarChart3,
    title: 'Risk Dashboard',
    desc: 'Track all your contracts over time — spot patterns and recurring red flags.',
    tag: 'Coming Q4',
    color: '#fb7185',
  },
  {
    icon: Lock,
    title: 'Offline Mode',
    desc: 'Run lightweight on-device models for air-gapped or privacy-sensitive contracts.',
    tag: '2027',
    color: '#60a5fa',
  },
  {
    icon: FileCheck,
    title: 'Lawyer Connect',
    desc: 'One-click to share your analysis with verified lawyers for professional review.',
    tag: '2027',
    color: '#34d399',
  },
]

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: i => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 280, damping: 24 },
  }),
}

export default function UpcomingFeatures({ onClose, inline = false }) {
  const content = (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-dim)', border: '1px solid var(--border-hi)',
          borderRadius: 99, padding: '5px 14px', marginBottom: 10,
        }}>
          <Sparkles size={12} color="var(--accent)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Roadmap
          </span>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          What's Coming Next
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          LexGuard is evolving. Here's what's on the roadmap.
        </p>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `${f.color}18`,
              border: `1px solid ${f.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <f.icon size={17} color={f.color} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{f.title}</span>
                <span style={{
                  fontSize: 9, padding: '1px 6px', borderRadius: 99,
                  background: `${f.color}18`, color: f.color,
                  border: `1px solid ${f.color}30`, fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>
                  {f.tag}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.45 }}>{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', marginTop: 16, opacity: 0.7 }}>
        LexGuard AI · Built for India, used globally
      </p>
    </div>
  )

  if (inline) return content

  // Legacy drawer mode
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%',
        background: 'var(--surface)', zIndex: 100,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
        overflowY: 'auto', padding: 20,
      }}
    >
      {content}
    </motion.div>
  )
}
