import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'lexguard_theme'

function applyTheme(t) {
  // Apply class to <html> so CSS vars cascade everywhere
  document.documentElement.classList.toggle('light', t === 'light')
  document.documentElement.classList.toggle('dark',  t !== 'light')
  // Update meta theme-color for browser chrome
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', t === 'light' ? '#f7f8fc' : '#06070a')
}

function saveTheme(t) {
  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.sync) {
      chrome.storage.sync.set({ [STORAGE_KEY]: t })
    } else {
      localStorage.setItem(STORAGE_KEY, t)
    }
  } catch { /* noop */ }
}

async function loadTheme() {
  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.sync) {
      return new Promise(resolve => {
        chrome.storage.sync.get(STORAGE_KEY, result => {
          resolve(result[STORAGE_KEY] || 'dark')
        })
      })
    } else {
      return localStorage.getItem(STORAGE_KEY) || 'dark'
    }
  } catch {
    return 'dark'
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState('dark')
  const flashRef = useRef(null)

  useEffect(() => {
    loadTheme().then(saved => {
      setThemeState(saved)
      applyTheme(saved)
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'

      // 1. Inject flash overlay for a silky crossfade
      if (!flashRef.current) {
        const el = document.createElement('div')
        el.className = 'theme-flash-overlay'
        document.body.appendChild(el)
        flashRef.current = el
        el.addEventListener('animationend', () => {
          el.remove()
          flashRef.current = null
        })
      }

      // 2. Apply theme after a tiny delay so overlay is painted first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyTheme(next)
        })
      })

      saveTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
