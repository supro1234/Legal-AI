import { motion } from 'framer-motion'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        width:        36,
        height:       36,
        borderRadius: '50%',
        border:       '1px solid var(--border)',
        background:   'var(--glass-bg)',
        backdropFilter: 'blur(8px)',
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     18,
        transition:   'all 300ms ease',
        flexShrink:   0,
      }}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        style={{ display: 'block' }}
      >
        {isDark ? '🌙' : '☀️'}
      </motion.span>
    </motion.button>
  )
}
