import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Shield, RotateCcw, Maximize, Minimize, LogOut, ArrowLeft } from 'lucide-react'
import { useTheme }    from './hooks/useTheme.js'
import { useAnalyze }  from './hooks/useAnalyze.js'
import { DEFAULT_MODEL, OPENROUTER_MODELS } from '../utils/openrouter.js'

import ShieldCanvas     from './components/ShieldCanvas.jsx'
import NavBar           from './components/NavBar.jsx'
import DocTypeSelector  from './components/DocTypeSelector.jsx'
import ContractInput    from './components/ContractInput.jsx'
import AnalyzeButton    from './components/AnalyzeButton.jsx'
import RiskMeter        from './components/RiskMeter.jsx'
import ResultTabs       from './components/ResultTabs.jsx'
import ThemeToggle      from './components/ThemeToggle.jsx'
import ScanHistory      from './components/ScanHistory.jsx'
import ExportButton     from './components/ExportButton.jsx'
import Onboarding, { clearSession } from './components/Onboarding.jsx'
import UpcomingFeatures from './components/UpcomingFeatures.jsx'
import SamplesView      from './components/SamplesView.jsx'

/* ── Shield state helper ────────────────────────────────────── */
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

/* ── Page fade animation ────────────────────────────────────── */
const pageVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.16 } },
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { status, result, error, modelUsed, fromCache, analyze, reset } = useAnalyze()

  /* ── Layout ─────────────────────────────────────────────── */
  const isFullTab   = window.innerWidth > 600
  const isExtension = typeof chrome !== 'undefined' && chrome?.runtime?.id

  /* ── State ─────────────────────────────────────────────── */
  const [onboarded,      setOnboarded]      = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [apiKey,         setApiKey]         = useState('')
  const [selectedModel,  setSelectedModel]  = useState(DEFAULT_MODEL)
  const [docType,        setDocType]        = useState(null)
  const [contractTx,     setContractTx]     = useState('')
  const [jurisdiction,   setJurisdiction]   = useState('India')
  const [activeTab,      setActiveTab]      = useState('analyze')   // analyze | samples | history | features
  const [isFullscreenMode, setIsFullscreenMode] = useState(false)

  /* ── Fullscreen listener ────────────────────────────────── */
  useEffect(() => {
    const handler = () => setIsFullscreenMode(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullScreen = useCallback(() => {
    if (isExtension) {
      isFullTab ? window.close() : chrome.tabs.create({ url: window.location.href })
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.error)
      } else {
        document.exitFullscreen?.()
      }
    }
  }, [isExtension, isFullTab])

  /* ── Persist settings — session-only (cleared on browser close) ── */
  useEffect(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Extension: chrome.storage.session is already session-scoped ✓
        chrome.storage.session.get(['openrouterKey', 'lexguard_onboarded'], sr => {
          if (!sr.lexguard_onboarded) { setOnboarded(false); setIsInitializing(false); return }
          if (sr.openrouterKey) setApiKey(sr.openrouterKey)
          chrome.storage.local.get('selectedModel', lr => {
            setSelectedModel(lr.selectedModel || DEFAULT_MODEL)
            setIsInitializing(false)
          })
        })
      } else {
        // Web: sessionStorage — clears when tab/browser closes ✓ (NOT localStorage)
        const onboarded = sessionStorage.getItem('lexguard_onboarded')
        const key       = sessionStorage.getItem('openrouterKey')
        if (!onboarded) { setOnboarded(false) }
        if (key) setApiKey(key)
        setSelectedModel(localStorage.getItem('selectedModel') || DEFAULT_MODEL) // model pref is non-sensitive, ok to persist
        setIsInitializing(false)
      }
    } catch {
      setOnboarded(false)
      setIsInitializing(false)
    }
  }, [])

  /* ── Navigation: auto-switch to Analyze after result ────── */
  useEffect(() => {
    if (status === 'done' || status === 'scanning') {
      setActiveTab('analyze')
    }
  }, [status])

  /* ── Derived ─────────────────────────────────────────────── */
  const shieldState = deriveShieldState(status, result, onboarded)
  const canAnalyze  = !!docType && contractTx.trim().length > 30 && status !== 'scanning'

  const modelMeta  = OPENROUTER_MODELS.find(m => m.id === (modelUsed || selectedModel))
  const badgeLabel = fromCache
    ? '⚡ Cached'
    : modelMeta
      ? modelMeta.name
      : (modelUsed || 'AI')

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleAnalyze = useCallback(() => {
    if (!canAnalyze) return
    analyze({ contractText: contractTx, documentType: docType, apiKey, model: selectedModel, jurisdiction })
  }, [canAnalyze, contractTx, docType, apiKey, selectedModel, jurisdiction, analyze])

  const handleReset = useCallback(() => {
    reset()
    setContractTx('')
    setDocType(null)
    setJurisdiction('India')
    setActiveTab('analyze')
  }, [reset])

  const handleLogout = useCallback(() => {
    // Clear session storage (API key wiped) and return to onboarding
    clearSession()
    reset()
    setApiKey('')
    setContractTx('')
    setDocType(null)
    setJurisdiction('India')
    setActiveTab('analyze')
    setOnboarded(false)
  }, [reset])

  const handleSampleSelect = useCallback((sample) => {
    setContractTx(sample.text)
    setDocType(sample.docType)
    setActiveTab('analyze')  // Switch to analyze after loading sample
  }, [])

  const handleNavChange = useCallback((tab) => {
    // If results are showing and user taps analyze, go to input view
    if (tab === 'analyze' && status === 'done') {
      // stay on analyze showing results — good UX
    }
    setActiveTab(tab)
  }, [status])

  /* ── Loading splash ────────────────────────────────────── */
  if (isInitializing) return null

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      width:     isFullTab ? '100vw' : '100%',
      minWidth:  isFullTab ? '100vw' : 400,
      height:    isFullTab ? '100vh' : 'auto',
      minHeight: 580,
      position:  'relative',
      overflow:  'hidden',
      display:   'flex',
      justifyContent: 'center',
    }}>
      <ShieldCanvas appState={shieldState} theme={theme} />

      <div style={{
        position:        'relative',
        zIndex:          10,
        display:         'flex',
        flexDirection:   'column',
        minHeight:       580,
        width:           '100%',
        maxWidth:        isFullTab ? 820 : 420,
        height:          isFullTab ? '100vh' : 'auto',
      }}>
        <AnimatePresence mode="wait">
          {!onboarded ? (
            <Onboarding
              key="onboarding"
              onComplete={({ apiKey: key }) => {
                setApiKey(key)
                setOnboarded(true)
              }}
            />
          ) : (
            <motion.div
              key="main-app"
              style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}
            >
              {/* ════════════════ HEADER ════════════════ */}
              <header className="app-header">
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'var(--accent-dim)', border: '1px solid var(--border-hi)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={18} color="var(--accent)" strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="header-logo-text">
                      Lex<span>Guard</span>
                    </span>
                    <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: -1 }}>
                      AI CONTRACT ANALYSER
                    </div>
                  </div>
                </div>

                {/* Centre: model badge */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={badgeLabel}
                    initial={{ scale: 0.8, opacity: 0, y: -4 }}
                    animate={{ scale: 1,   opacity: 1, y: 0 }}
                    exit={{    scale: 0.8, opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      background: fromCache
                        ? 'rgba(16,185,129,0.15)'
                        : 'var(--accent-dim)',
                      color:  fromCache ? 'var(--success)' : 'var(--accent)',
                      border: fromCache
                        ? '1px solid rgba(16,185,129,0.3)'
                        : '1px solid var(--border-hi)',
                      letterSpacing: '0.04em',
                      maxWidth: 140, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                    title={modelUsed || selectedModel}
                  >
                    {fromCache ? '⚡ ' : '✦ '}{badgeLabel}
                  </motion.span>
                </AnimatePresence>

                {/* Right: theme toggle + logout + fullscreen */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ThemeToggle theme={theme} onToggle={toggleTheme} />

                  {/* Logout button */}
                  <motion.button
                    whileHover={{ scale: 1.08, backgroundColor: 'rgba(239,68,68,0.15)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLogout}
                    className="header-icon-btn"
                    title="Log out — clears API key"
                    aria-label="Log out"
                    style={{ color: 'var(--muted)' }}
                  >
                    <LogOut size={14} />
                  </motion.button>

                  {/* Fullscreen */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleFullScreen}
                    className="header-icon-btn"
                    title={isExtension
                      ? (isFullTab ? 'Shrink' : 'Open full screen')
                      : (isFullscreenMode ? 'Exit full screen' : 'Enter full screen')}
                  >
                    {(isExtension ? isFullTab : isFullscreenMode)
                      ? <Minimize size={14} />
                      : <Maximize size={14} />}
                  </motion.button>
                </div>
              </header>

              {/* ════════════════ MAIN CONTENT ════════════════ */}
              <main style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 10px' }}>
                <AnimatePresence mode="wait">

                  {/* ── RESULTS STATE ── */}
                  {activeTab === 'analyze' && status === 'done' && result ? (
                    <motion.div
                      key="results"
                      variants={pageVariants}
                      initial="hidden" animate="visible" exit="exit"
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                      {/* Risk summary card */}
                      <div className="glass" style={{ borderRadius: 16, padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <RiskMeter score={result.riskScore} level={result.riskLevel} />
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6, maxWidth: 320 }}>
                          {result.summary}
                        </p>
                        {modelMeta && (
                          <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.65 }}>
                            Analyzed by {modelMeta.name}{fromCache ? ' (cached)' : ''}
                          </span>
                        )}
                      </div>

                      {/* Result tabs */}
                      <div className="glass" style={{ borderRadius: 16, padding: '14px 12px' }}>
                        <ResultTabs result={result} />
                      </div>

                      {/* Actions */}
                      <ExportButton result={result} docType={docType} model={selectedModel} />
                      
                      <div style={{ display: 'flex', gap: 8 }}>
                        <motion.button
                          onClick={() => reset()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            flex: 1, padding: '11px', borderRadius: 12,
                            border: '1px solid var(--border)', background: 'var(--surface)',
                            color: 'var(--text)', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 6, fontFamily: 'inherit',
                          }}
                        >
                          <ArrowLeft size={14} /> Back to Edit
                        </motion.button>
                        <motion.button
                          onClick={handleReset}
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(239,68,68,0.05)' }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            flex: 1, padding: '11px', borderRadius: 12,
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--danger)', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 6, fontFamily: 'inherit',
                          }}
                        >
                          <RotateCcw size={14} /> Start Fresh
                        </motion.button>
                      </div>
                    </motion.div>

                  ) : activeTab === 'analyze' && status === 'error' ? (
                    <motion.div
                      key="error"
                      variants={pageVariants}
                      initial="hidden" animate="visible" exit="exit"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 16, padding: 28, textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 42, marginBottom: 12 }}>⚠️</div>
                      <p style={{ fontWeight: 800, color: 'var(--danger)', marginBottom: 8, fontSize: 16 }}>Analysis Failed</p>
                      <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>{error}</p>
                      <motion.button
                        onClick={handleReset}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{
                          padding: '10px 28px', borderRadius: 10,
                          background: 'var(--danger)', border: 'none',
                          color: '#fff', fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit', fontSize: 13,
                        }}
                      >
                        Try Again
                      </motion.button>
                    </motion.div>

                  ) : activeTab === 'analyze' ? (
                    /* ── INPUT VIEW ── */
                    <motion.div
                      key="input"
                      variants={pageVariants}
                      initial="hidden" animate="visible" exit="exit"
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                      {/* Hero tagline */}
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        style={{ textAlign: 'center', padding: '6px 0 0' }}
                      >
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                          background: 'var(--accent-dim)', padding: '5px 16px',
                          borderRadius: 99, border: '1px solid var(--border-hi)',
                          letterSpacing: '0.04em',
                        }}>
                          ✦ Nobody reads contracts. We do.
                        </span>
                      </motion.div>

                      {/* Doc type + jurisdiction */}
                      <div className="glass" style={{ borderRadius: 16, padding: 16 }}>
                        <DocTypeSelector
                          selected={docType}
                          onSelect={setDocType}
                          jurisdiction={jurisdiction}
                          onJurisdictionChange={setJurisdiction}
                        />
                      </div>

                      {/* Contract input */}
                      <div className="glass" style={{ borderRadius: 16, padding: 16 }}>
                        <ContractInput
                          value={contractTx}
                          onChange={setContractTx}
                          disabled={status === 'scanning'}
                        />
                      </div>

                      {/* Analyze button */}
                      <AnalyzeButton
                        loading={status === 'scanning'}
                        selectedModel={selectedModel}
                        onAnalyze={handleAnalyze}
                        disabled={!canAnalyze}
                      />
                    </motion.div>

                  ) : activeTab === 'samples' ? (
                    /* ── SAMPLES TAB ── */
                    <motion.div
                      key="samples"
                      variants={pageVariants}
                      initial="hidden" animate="visible" exit="exit"
                    >
                      <SamplesView onSampleSelect={handleSampleSelect} />
                    </motion.div>

                  ) : activeTab === 'history' ? (
                    /* ── HISTORY TAB (inline, no drawer) ── */
                    <motion.div
                      key="history"
                      variants={pageVariants}
                      initial="hidden" animate="visible" exit="exit"
                    >
                      <ScanHistory onClose={() => setActiveTab('analyze')} inline />
                    </motion.div>

                  ) : activeTab === 'features' ? (
                    /* ── FEATURES TAB (inline) ── */
                    <motion.div
                      key="features"
                      variants={pageVariants}
                      initial="hidden" animate="visible" exit="exit"
                    >
                      <UpcomingFeatures onClose={() => setActiveTab('analyze')} inline />
                    </motion.div>

                  ) : null}
                </AnimatePresence>
              </main>

              {/* ════════════════ BOTTOM NAV ════════════════ */}
              <NavBar activeTab={activeTab} onTabChange={handleNavChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
