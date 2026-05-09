import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Key, CheckCircle, AlertTriangle, Loader2,
  ArrowRight, ExternalLink, LogOut,
} from 'lucide-react'
import { testOpenRouterKey, OPENROUTER_MODELS, DEFAULT_MODEL } from '../../utils/openrouter.js'
import WelcomeCalligraphy from '../../components/WelcomeCalligraphy.jsx'

/* ── Storage helpers ────────────────────────────────────────── */
function saveSession(apiKey) {
  if (typeof chrome !== 'undefined' && chrome?.storage?.session) {
    // Extension: chrome.storage.session — auto-cleared when browser closes
    chrome.storage.session.set({ openrouterKey: apiKey, lexguard_onboarded: true })
    chrome.storage.local.get('selectedModel', r => {
      if (!r.selectedModel) chrome.storage.local.set({ selectedModel: DEFAULT_MODEL })
    })
  } else {
    // Web: sessionStorage — auto-cleared when tab/browser closes ✓
    sessionStorage.setItem('openrouterKey', apiKey)
    sessionStorage.setItem('lexguard_onboarded', 'true')
  }
}

export function clearSession() {
  if (typeof chrome !== 'undefined' && chrome?.storage?.session) {
    chrome.storage.session.remove(['openrouterKey', 'lexguard_onboarded'])
  } else {
    sessionStorage.removeItem('openrouterKey')
    sessionStorage.removeItem('lexguard_onboarded')
  }
}

/* ── Component ──────────────────────────────────────────────── */
export default function Onboarding({ onComplete }) {
  const [apiKey,   setApiKey]   = useState('')
  const [status,   setStatus]   = useState('idle') // idle | testing | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setErrorMsg('Please enter your OpenRouter API key.')
      setStatus('error')
      return
    }
    setStatus('testing')
    setErrorMsg('')
    try {
      await testOpenRouterKey(apiKey.trim())
      setStatus('success')
      saveSession(apiKey.trim())
      setTimeout(() => onComplete({ apiKey: apiKey.trim() }), 1400)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e.message || 'Connection failed. Check your key and try again.')
    }
  }

  return (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
      transition={{ duration: 0.45, type: 'spring', damping: 26, stiffness: 200 }}
      style={{
        display: 'flex', flexDirection: 'column', minHeight: 580,
        justifyContent: 'center', padding: '0 24px', gap: 16,
        position: 'relative', zIndex: 20,
      }}
    >
      {/* ── Logo + title ── */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <motion.div
          animate={
            status === 'success'
              ? { scale: [1, 1.25, 1], rotate: [0, 180, 360] }
              : { y: [0, -6, 0] }
          }
          transition={
            status === 'success'
              ? { duration: 0.7 }
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{ display: 'inline-block', marginBottom: 14 }}
        >
          <Shield
            size={56}
            color={status === 'success' ? 'var(--success)' : 'var(--accent)'}
            strokeWidth={2}
          />
        </motion.div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "24px",
          paddingBottom: "16px"
        }}>
          <WelcomeCalligraphy subtitle="to LexGuard AI" />
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, maxWidth: 320, marginInline: 'auto' }}>
          Connect one OpenRouter key to access all AI models — free &amp; paid.
          Your key is stored only for this session and cleared when you close the browser.
        </p>
      </div>

      {/* ── Session notice ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8,
        background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.2)',
        fontSize: 11, color: 'var(--accent)', fontWeight: 600,
      }}>
        <span style={{ fontSize: 14 }}>🔐</span>
        Session-only storage — key is wiped when browser closes. No data saved to disk.
      </div>

      {/* ── Free models preview ── */}
      <div className="glass" style={{ borderRadius: 14, padding: '12px 14px' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
        }}>
          Available Free Models
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {OPENROUTER_MODELS.filter(m => m.tag === 'FREE').map(m => (
            <span key={m.id} style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
              background: 'rgba(62,207,142,0.12)', color: 'var(--success)',
              border: '1px solid rgba(62,207,142,0.25)',
            }}>
              {m.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── API Key input ── */}
      <div className="glass" style={{ borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Key size={14} color="var(--accent)" />
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            OpenRouter API Key
          </span>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={e => {
            setApiKey(e.target.value)
            setErrorMsg('')
            if (status === 'error') setStatus('idle')
          }}
          onKeyDown={e => e.key === 'Enter' && handleConnect()}
          placeholder="sk-or-v1-..."
          autoFocus
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 10,
            border: `1px solid ${status === 'error' ? 'var(--danger)' : 'var(--border)'}`,
            background: 'var(--surface)', color: 'var(--text)',
            outline: 'none', fontFamily: 'inherit', fontSize: 13,
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
        />
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 8, fontSize: 11, color: 'var(--accent)', textDecoration: 'none',
            opacity: 0.85,
          }}
        >
          <ExternalLink size={11} /> Get a free key at openrouter.ai/keys
        </a>
      </div>

      {/* ── Error message ── */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '10px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, color: 'var(--danger)',
              fontSize: 12, lineHeight: 1.5,
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMsg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Connect button ── */}
      <motion.button
        onClick={handleConnect}
        disabled={status === 'testing' || status === 'success'}
        whileHover={status === 'idle' || status === 'error' ? { scale: 1.02, y: -1 } : {}}
        whileTap={status === 'idle'   || status === 'error' ? { scale: 0.98 } : {}}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: status === 'success'
            ? 'var(--success)'
            : 'linear-gradient(135deg, #1ea870, var(--accent), #5eead4)',
          backgroundSize: '200% 200%',
          animation: status === 'idle' ? 'gradientShift 5s ease infinite' : 'none',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit',
          boxShadow: status === 'success' ? '0 4px 24px rgba(16,185,129,0.4)' : '0 4px 24px var(--accent-glow)',
        }}
      >
        {status === 'testing' ? (
          <><Loader2 size={16} className="animate-spin" /> Verifying Key…</>
        ) : status === 'success' ? (
          <><CheckCircle size={16} /> Connected! Entering LexGuard…</>
        ) : (
          <>Connect &amp; Continue <ArrowRight size={16} /></>
        )}
      </motion.button>
    </motion.div>
  )
}
