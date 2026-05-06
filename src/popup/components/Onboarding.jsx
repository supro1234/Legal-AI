import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Key, CheckCircle, AlertTriangle, Loader2, ArrowRight, ExternalLink } from 'lucide-react'
import { testOpenRouterKey, OPENROUTER_MODELS, DEFAULT_MODEL } from '../../utils/openrouter.js'

export default function Onboarding({ onComplete }) {
  const [apiKey,    setApiKey]    = useState('')
  const [status,    setStatus]    = useState('idle') // idle | testing | success | error
  const [errorMsg,  setErrorMsg]  = useState('')

  const handleConnect = async () => {
    if (!apiKey.trim()) { setErrorMsg('Please enter your OpenRouter API key.'); setStatus('error'); return }
    setStatus('testing')
    setErrorMsg('')
    try {
      await testOpenRouterKey(apiKey.trim())
      setStatus('success')

      // Save key + onboarded flag + default model to session
      const save = {
        openrouterKey:  apiKey.trim(),
        lexguard_onboarded: true,
      }
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.session.set(save)
        // Save default model to local (not sensitive, survives browser close)
        chrome.storage.local.get('selectedModel', r => {
          if (!r.selectedModel) chrome.storage.local.set({ selectedModel: DEFAULT_MODEL })
        })
      } else {
        localStorage.setItem('openrouterKey', apiKey.trim())
        localStorage.setItem('lexguard_onboarded', 'true')
      }

      setTimeout(() => onComplete({ apiKey: apiKey.trim() }), 1600)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e.message || 'Connection failed.')
    }
  }

  return (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
      transition={{ duration: 0.5, type: 'spring', damping: 26, stiffness: 200 }}
      style={{
        display: 'flex', flexDirection: 'column', minHeight: 580,
        justifyContent: 'center', padding: '0 24px', gap: 16,
        position: 'relative', zIndex: 20,
      }}
    >
      {/* Logo + title */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <motion.div
          animate={status === 'success' ? { scale: [1, 1.2, 1], rotate: [0, 180, 360] } : { y: [0, -6, 0] }}
          transition={status === 'success' ? { duration: 0.8 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-block', marginBottom: 14 }}
        >
          <Shield size={56} color={status === 'success' ? 'var(--success)' : 'var(--accent)'} strokeWidth={2} />
        </motion.div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Welcome to LexGuard
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
          Connect one OpenRouter key to access all AI models — free &amp; paid.
        </p>
      </div>

      {/* FREE models preview */}
      <div className="glass" style={{ borderRadius: 14, padding: '12px 14px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
          Available Free Models
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {OPENROUTER_MODELS.filter(m => m.tag === 'FREE').map(m => (
            <span key={m.id} style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
              background: 'rgba(16,185,129,0.12)', color: 'var(--success)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}>{m.name}</span>
          ))}
        </div>
      </div>

      {/* API Key input */}
      <div className="glass" style={{ borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Key size={14} color="var(--accent2)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            OpenRouter API Key
          </span>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={e => { setApiKey(e.target.value); setErrorMsg(''); if (status === 'error') setStatus('idle') }}
          onKeyDown={e => e.key === 'Enter' && handleConnect()}
          placeholder="sk-or-v1-..."
          autoFocus
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 10,
            border: `1px solid ${status === 'error' ? 'var(--danger)' : 'var(--border)'}`,
            background: 'var(--surface)', color: 'var(--text)',
            outline: 'none', fontFamily: 'inherit', fontSize: 13,
            transition: 'border-color 0.2s',
          }}
        />
        <a
          href="https://openrouter.ai/keys"
          target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: 'var(--accent2)', textDecoration: 'none' }}
        >
          <ExternalLink size={11} /> Get a free key at openrouter.ai/keys
        </a>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, color: 'var(--danger)', fontSize: 12, lineHeight: 1.5,
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMsg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect button */}
      <motion.button
        onClick={handleConnect}
        disabled={status === 'testing' || status === 'success'}
        whileHover={status === 'idle' || status === 'error' ? { scale: 1.02 } : {}}
        whileTap={status === 'idle' || status === 'error' ? { scale: 0.98 } : {}}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: status === 'success'
            ? 'var(--success)'
            : 'linear-gradient(135deg, var(--accent), #9333ea, #6366f1)',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit',
        }}
      >
        {status === 'testing' ? (
          <><Loader2 size={16} className="animate-spin" /> Verifying Key…</>
        ) : status === 'success' ? (
          <><CheckCircle size={16} /> Connected! Entering app…</>
        ) : (
          <>Connect & Continue <ArrowRight size={16} /></>
        )}
      </motion.button>

      <style>{`
        .animate-spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  )
}
