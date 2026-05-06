import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'lexguard_theme'

export function useTheme() {
  const [theme, setThemeState] = useState('dark')

  useEffect(() => {
    // Try chrome.storage first, fallback to localStorage
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(STORAGE_KEY, (result) => {
          const saved = result[STORAGE_KEY] || 'dark'
          setThemeState(saved)
          applyTheme(saved)
        })
      } else {
        const saved = localStorage.getItem(STORAGE_KEY) || 'dark'
        setThemeState(saved)
        applyTheme(saved)
      }
    } catch {
      const saved = localStorage.getItem(STORAGE_KEY) || 'dark'
      setThemeState(saved)
      applyTheme(saved)
    }
  }, [])

  const applyTheme = (t) => {
    document.documentElement.classList.toggle('light', t === 'light')
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.set({ [STORAGE_KEY]: next })
        } else {
          localStorage.setItem(STORAGE_KEY, next)
        }
      } catch { /* noop */ }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
