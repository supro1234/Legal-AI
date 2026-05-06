/**
 * NavBar.jsx — Bottom navigation bar for LexGuard
 * Tabs: Analyze | Samples | History | Features
 * Works in both extension popup and full-screen web mode.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { FileSearch, BookOpen, Clock, Sparkles } from 'lucide-react'

const TABS = [
  { id: 'analyze',  label: 'Analyze',  Icon: FileSearch },
  { id: 'samples',  label: 'Samples',  Icon: BookOpen   },
  { id: 'history',  label: 'History',  Icon: Clock      },
  { id: 'features', label: 'Features', Icon: Sparkles   },
]

export default function NavBar({ activeTab, onTabChange }) {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        return (
          <motion.button
            key={id}
            className={`nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(id)}
            whileTap={{ scale: 0.92 }}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon with animated scale */}
            <motion.span
              animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                color={isActive ? 'var(--accent)' : 'var(--muted)'}
              />
            </motion.span>

            {/* Label */}
            <span style={{
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              transition: 'color 180ms ease',
            }}>
              {label}
            </span>

            {/* Active indicator pill */}
            <span className="nav-dot" />
          </motion.button>
        )
      })}
    </nav>
  )
}
