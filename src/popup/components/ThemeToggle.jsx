import { motion } from 'framer-motion'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileTap={{ scale: 0.88 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        /* pill track */
        width:           52,
        height:          28,
        borderRadius:    99,
        border:          '1px solid var(--border-hi)',
        background:      isDark
          ? 'linear-gradient(135deg, #0a1628, #0d1f14)'
          : 'linear-gradient(135deg, #e0f0e8, #fff7e6)',
        cursor:          'pointer',
        position:        'relative',
        overflow:        'hidden',
        padding:         0,
        flexShrink:      0,
        boxShadow:       isDark
          ? '0 0 12px rgba(62, 207, 142, 0.2), inset 0 1px 2px rgba(0,0,0,0.5)'
          : '0 0 12px rgba(251,191,36,0.25), inset 0 1px 2px rgba(0,0,0,0.08)',
      }}
    >
      {/* Stars (dark) / Rays (light) */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: isDark ? 0.6 : 0,
        transition: 'opacity 380ms ease',
        pointerEvents: 'none',
        fontSize: 5,
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '3px 6px', gap: 3, color: '#fff',
      }}>
        {'✦✦✦✦✦'.split('').map((s, i) => (
          <span key={i} style={{ opacity: 0.7 + i * 0.06 }}>{s}</span>
        ))}
      </div>

      {/* Thumb */}
      <motion.div
        layout
        animate={{
          x: isDark ? 3 : 25,
          background: isDark
            ? 'linear-gradient(135deg, #c8e6ff, #f0f8ff)'
            : 'linear-gradient(135deg, #fbbf24, #f97316)',
          boxShadow: isDark
            ? '0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(200,230,255,0.3)'
            : '0 1px 4px rgba(0,0,0,0.2), 0 0 12px rgba(251,191,36,0.6)',
        }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        style={{
          position:     'absolute',
          top:          '50%',
          marginTop:    -11,
          width:        22,
          height:       22,
          borderRadius: '50%',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     11,
        }}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0,   scale: 1,   opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'backOut' }}
        >
          {isDark ? '🌙' : '☀️'}
        </motion.span>
      </motion.div>
    </motion.button>
  )
}
