import { motion } from 'framer-motion'
import { Sparkles, X, Zap, Target, Lock } from 'lucide-react'

export default function UpcomingFeatures({ onClose }) {
  const features = [
    { icon: Zap, title: "Batch Auditing", desc: "Scan up to 50 contracts at once." },
    { icon: Target, title: "Bias Mitigation", desc: "Auto-rewrite clauses to be fair." },
    { icon: Lock, title: "Offline Mode", desc: "Run lightweight models locally." }
  ]

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
        boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
          <Sparkles size={20} />
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Upcoming Features</h2>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {features.map((f, i) => (
          <div key={i} className="glass" style={{ padding: 16, borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ padding: 10, background: 'rgba(46,110,80,0.1)', borderRadius: 10, color: 'var(--accent)' }}>
              <f.icon size={20} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          </div>
        ))}
        
        <div style={{ marginTop: 'auto', textAlign: 'center', padding: '20px 0 10px' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>LexGuard AI • Evolving Constantly</p>
        </div>
      </div>
    </motion.div>
  )
}
