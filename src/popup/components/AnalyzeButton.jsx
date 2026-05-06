import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Loader2 } from 'lucide-react'

export default function AnalyzeButton({ loading, selectedModel, onAnalyze, disabled }) {
  return (
    <motion.button
      onClick={onAnalyze}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      style={{
        width:        '100%',
        padding:      '14px 20px',
        borderRadius: 12,
        border:       'none',
        cursor:       disabled || loading ? 'not-allowed' : 'pointer',
        fontSize:     15,
        fontWeight:   700,
        color:        '#fff',
        background:   disabled
          ? 'color-mix(in srgb, var(--muted) 40%, transparent)'
          : 'var(--accent)',
        boxShadow:    disabled
          ? 'none'
          : loading
          ? '0 0 24px rgba(46,110,80,0.5)'
          : '0 0 24px rgba(46,110,80,0.3)',
        transition:   'all 300ms ease',
        letterSpacing: '0.03em',
        position:     'relative',
        overflow:     'hidden',
        fontFamily:   'inherit',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Reading fine print…
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <Shield size={18} />
            {disabled
              ? 'Select document type & paste text'
              : 'Analyze'}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Shimmer overlay */}
      {loading && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.button>
  )
}
