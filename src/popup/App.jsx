import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Shield, Clock, RotateCcw, Maximize, Minimize, Sparkles } from 'lucide-react'
import { useTheme }   from './hooks/useTheme.js'
import { useAnalyze } from './hooks/useAnalyze.js'
import { DEFAULT_MODEL, OPENROUTER_MODELS } from '../utils/openrouter.js'
import ShieldCanvas    from './components/ShieldCanvas.jsx'
import DocTypeSelector from './components/DocTypeSelector.jsx'
import AIModelPicker   from './components/AIModelPicker.jsx'
import ContractInput   from './components/ContractInput.jsx'
import AnalyzeButton   from './components/AnalyzeButton.jsx'
import RiskMeter       from './components/RiskMeter.jsx'
import ResultTabs      from './components/ResultTabs.jsx'
import ThemeToggle     from './components/ThemeToggle.jsx'
import ScanHistory     from './components/ScanHistory.jsx'
import ExportButton    from './components/ExportButton.jsx'
import Onboarding      from './components/Onboarding.jsx'
import UpcomingFeatures from './components/UpcomingFeatures.jsx'

function deriveShieldState(analyzeStatus, result, onboarded) {
  if (!onboarded) return 'idle'
  if (analyzeStatus === 'scanning') return 'scanning'
  if (analyzeStatus === 'done' && result) {
    const l = result.riskLevel
    if (l === 'Low')    return 'low'
    if (l === 'Medium') return 'medium'
    if (l === 'High')   return 'high'
  }
  return 'idle'
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { status, result, error, modelUsed, fromCache, analyze, reset } = useAnalyze()

  const [onboarded,     setOnboarded]     = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [apiKey,        setApiKey]        = useState('')
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [docType,       setDocType]       = useState(null)
  const [contractTx,    setContractTx]    = useState('')
  const [showHistory,   setShowHistory]   = useState(false)
  const [showFeatures,  setShowFeatures]  = useState(false)

  const isFullTab = window.innerWidth > 600

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  const [isFullscreenMode, setIsFullscreenMode] = useState(false)

  useEffect(() => {
    const handleFsChange = () => setIsFullscreenMode(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullScreen = () => {
    if (isExtension) {
      if (isFullTab) {
        window.close()
      } else {
        chrome.tabs.create({ url: window.location.href })
      }
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.error('Fullscreen error:', e))
      } else {
        if (document.exitFullscreen) document.exitFullscreen()
      }
    }
  }

  // Load OpenRouter key + model preference on startup
  useEffect(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.session.get(['openrouterKey', 'lexguard_onboarded'], sr => {
          if (!sr.lexguard_onboarded) { setOnboarded(false); setIsInitializing(false); return }
          if (sr.openrouterKey) setApiKey(sr.openrouterKey)
          // Load model preference from local storage (non-sensitive, survives browser close)
          chrome.storage.local.get('selectedModel', lr => {
            setSelectedModel(lr.selectedModel || DEFAULT_MODEL)
            setIsInitializing(false)
          })
        })
      } else {
        if (!localStorage.getItem('lexguard_onboarded')) setOnboarded(false)
        setApiKey(localStorage.getItem('openrouterKey') || '')
        setSelectedModel(localStorage.getItem('selectedModel') || DEFAULT_MODEL)
        setIsInitializing(false)
      }
    } catch {
      setOnboarded(false)
      setIsInitializing(false)
    }
  }, [])

  const shieldState = deriveShieldState(status, result, onboarded)
  const canAnalyze  = !!docType && contractTx.trim().length > 30 && status !== 'scanning'

  const handleAnalyze = () => {
    if (!canAnalyze) return
    analyze({ contractText: contractTx, documentType: docType, apiKey, model: selectedModel })
  }

  const handleReset = () => { reset(); setContractTx(''); setDocType(null) }

  // Helper: pretty model name for badge
  const modelMeta   = OPENROUTER_MODELS.find(m => m.id === (modelUsed || selectedModel))
  const badgeLabel  = fromCache
    ? '⚡ Cached'
    : modelMeta
      ? `${modelMeta.name}`
      : (modelUsed || 'AI')

  if (isInitializing) return null

  return (
    <div style={{ width: isFullTab ? '100vw' : '100%', minWidth: isFullTab ? '100vw' : 400, height: isFullTab ? '100vh' : 'auto', minHeight: 580, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <ShieldCanvas appState={shieldState} theme={theme} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: 580, width: '100%', maxWidth: isFullTab ? 800 : 400 }}>
        <AnimatePresence mode="wait">
          {!onboarded ? (
            <Onboarding
              onComplete={({ apiKey: key }) => {
                setApiKey(key)
                setOnboarded(true)
              }}
            />
          ) : (
            <motion.div
              key="main-app"
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              {/* ── HEADER ── */}
              <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px 10px',
                background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--border)', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={22} color="var(--accent)" strokeWidth={2.5} />
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    LexGuard
                  </span>
                </div>

                {/* Model badge */}
                <motion.span
                  key={badgeLabel}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    background: fromCache
                      ? 'rgba(16,185,129,0.15)'
                      : 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(124,58,237,0.15))',
                    color:    fromCache ? 'var(--success)' : '#a78bfa',
                    border:   fromCache ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(167,139,250,0.3)',
                    letterSpacing: '0.03em', maxWidth: 130,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                  title={modelUsed || selectedModel}
                >
                  {badgeLabel}
                </motion.span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ThemeToggle theme={theme} onToggle={toggleTheme} />
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFeatures(v => !v)}
                    title="Upcoming Features"
                    style={{
                      width: 34, height: 34, borderRadius: '50%',
                      border: '1px solid var(--border)', background: 'var(--glass-bg)',
                      backdropFilter: 'blur(12px)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={15} color="var(--muted)" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowHistory(v => !v)}
                    title="Scan history"
                    style={{
                      width: 34, height: 34, borderRadius: '50%',
                      border: '1px solid var(--border)', background: 'var(--glass-bg)',
                      backdropFilter: 'blur(12px)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Clock size={15} color="var(--muted)" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={toggleFullScreen}
                    title={isExtension ? (isFullTab ? "Shrink" : "Expand to full screen") : (isFullscreenMode ? "Exit Full Screen" : "Enter Full Screen")}
                    style={{
                      width: 34, height: 34, borderRadius: '50%',
                      border: '1px solid var(--border)', background: 'var(--glass-bg)',
                      backdropFilter: 'blur(12px)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isExtension ? (isFullTab ? <Minimize size={15} color="var(--muted)" /> : <Maximize size={15} color="var(--muted)" />) : (isFullscreenMode ? <Minimize size={15} color="var(--muted)" /> : <Maximize size={15} color="var(--muted)" />)}
                  </motion.button>
                </div>
              </header>

              {/* ── MAIN SCROLL AREA ── */}
              <main style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 80px' }}>
                <AnimatePresence mode="wait" initial={false}>

                  {/* RESULTS VIEW */}
                  {status === 'done' && result ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                      <div className="glass" style={{ borderRadius: 14, padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <RiskMeter score={result.riskScore} level={result.riskLevel} />
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.55, maxWidth: 300 }}>
                          {result.summary}
                        </p>
                        {modelMeta && (
                          <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.7 }}>
                            Analyzed by {modelMeta.name} {fromCache ? '(cached)' : ''}
                          </span>
                        )}
                      </div>

                      <div className="glass" style={{ borderRadius: 14, padding: '12px 12px' }}>
                        <ResultTabs result={result} />
                      </div>

                      <ExportButton result={result} docType={docType} model={selectedModel} />
                      <motion.button
                        onClick={handleReset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{
                          width: '100%', padding: '10px', borderRadius: 10,
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--muted)', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          fontFamily: 'inherit',
                        }}
                      >
                        <RotateCcw size={14} /> New Analysis
                      </motion.button>
                    </motion.div>

                  ) : status === 'error' ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 20, textAlign: 'center' }}
                    >
                      <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
                      <p style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>Analysis Failed</p>
                      <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>{error}</p>
                      <motion.button
                        onClick={handleReset} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--danger)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Try Again
                      </motion.button>
                    </motion.div>

                  ) : (
                    /* INPUT VIEW */
                    <motion.div
                      key="input"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '10px 0 2px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                          padding: '4px 14px', borderRadius: 99,
                          border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                        }}>
                          Nobody reads contracts. We do.
                        </span>
                      </motion.div>

                      <div className="glass" style={{ borderRadius: 14, padding: 14 }}>
                        <DocTypeSelector selected={docType} onSelect={setDocType} />
                      </div>

                      {/* Model picker removed as per user request */}

                      <motion.div
                        className="glass"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ borderRadius: 14, padding: 14 }}
                      >
                        <ContractInput value={contractTx} onChange={setContractTx} />
                      </motion.div>

                      <AnalyzeButton
                        loading={status === 'scanning'}
                        selectedModel={selectedModel}
                        onAnalyze={handleAnalyze}
                        disabled={!canAnalyze}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drawers — rendered at root level so fixed positioning covers full viewport */}
      <AnimatePresence>
        {showHistory  && <ScanHistory     onClose={() => setShowHistory(false)} />}
        {showFeatures && <UpcomingFeatures onClose={() => setShowFeatures(false)} />}
      </AnimatePresence>
    </div>
  )
}
