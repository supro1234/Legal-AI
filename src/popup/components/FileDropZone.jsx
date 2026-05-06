/**
 * FileDropZone.jsx — PDF / DOCX drag-and-drop text extractor
 * Supports: PDF (via pdf.js), DOCX (via mammoth.js), plain TXT
 * Falls back gracefully if libraries fail to load.
 */
import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

const MAX_CHARS = 8000
const ACCEPT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const ACCEPT_EXT = ['.pdf', '.docx', '.txt']

/* ── PDF text extraction via CDN pdf.js ─────────────────────────────────── */
async function extractPDF(file) {
  // Dynamically load pdf.js from CDN if not already loaded
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = resolve
      script.onerror = () => reject(new Error('Failed to load PDF.js'))
      document.head.appendChild(script)
    })
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map(item => item.str).join(' ') + '\n'
  }
  return fullText.trim()
}

/* ── DOCX text extraction via CDN mammoth.js ────────────────────────────── */
async function extractDOCX(file) {
  if (!window.mammoth) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
      script.onload = resolve
      script.onerror = () => reject(new Error('Failed to load Mammoth.js'))
      document.head.appendChild(script)
    })
  }
  const arrayBuffer = await file.arrayBuffer()
  const result = await window.mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

/* ── Plain text extraction ──────────────────────────────────────────────── */
async function extractTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result || '')
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'UTF-8')
  })
}

/* ── Main extraction dispatcher ─────────────────────────────────────────── */
async function extractText(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return extractPDF(file)
  if (name.endsWith('.docx')) return extractDOCX(file)
  return extractTXT(file)
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function FileDropZone({ onTextExtracted, disabled }) {
  const [isDragging,  setIsDragging]  = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const [fileName,    setFileName]    = useState(null)
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback(async (file) => {
    if (!file) return
    const name = file.name.toLowerCase()
    const validExt = ACCEPT_EXT.some(ext => name.endsWith(ext))
    const validType = ACCEPT_TYPES.includes(file.type)
    if (!validExt && !validType) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large (max 10 MB). Please compress or paste the text manually.')
      return
    }

    setError(null)
    setSuccess(false)
    setIsLoading(true)
    setFileName(file.name)

    try {
      let text = await extractText(file)
      text = text.slice(0, MAX_CHARS)
      if (text.trim().length < 20) throw new Error('Could not extract readable text from this file.')
      onTextExtracted(text, file.name)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to extract text from file.')
      setFileName(null)
    } finally {
      setIsLoading(false)
    }
  }, [onTextExtracted])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isLoading) return
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [disabled, isLoading, processFile])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onFileChange = useCallback((e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
    e.target.value = '' // reset so same file can be re-selected
  }, [processFile])

  /* ── Style helpers ─────────────────────────────────────────────────────── */
  const borderColor = error
    ? 'rgba(239,68,68,0.5)'
    : success
      ? 'rgba(16,185,129,0.5)'
      : isDragging
        ? 'var(--accent)'
        : 'var(--border)'

  const bgColor = isDragging
    ? 'color-mix(in srgb, var(--accent) 8%, var(--surface))'
    : 'var(--surface)'

  return (
    <div>
      <p style={{
        color: 'var(--muted)', fontSize: 11, marginBottom: 6,
        fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        📎 Upload Contract File — PDF / DOCX / TXT
      </p>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && !isLoading && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        aria-label="Upload contract file by clicking or dragging"
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 12,
          padding: '14px 16px',
          background: bgColor,
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: disabled ? 0.5 : 1,
          boxShadow: isDragging ? `0 0 20px color-mix(in srgb, var(--accent) 25%, transparent)` : 'none',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_EXT.join(',')}
          style={{ display: 'none' }}
          onChange={onFileChange}
          disabled={disabled || isLoading}
        />

        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: success
            ? 'rgba(16,185,129,0.15)'
            : error
              ? 'rgba(239,68,68,0.12)'
              : 'color-mix(in srgb, var(--accent) 12%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${success ? 'rgba(16,185,129,0.3)' : error ? 'rgba(239,68,68,0.25)' : 'color-mix(in srgb, var(--accent) 25%, transparent)'}`,
          transition: 'all 300ms ease',
        }}>
          {isLoading ? (
            <div style={{
              width: 18, height: 18, border: '2px solid var(--accent)',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
          ) : success ? (
            <CheckCircle size={18} color="#10b981" />
          ) : error ? (
            <AlertCircle size={18} color="#ef4444" />
          ) : isDragging ? (
            <Upload size={18} color="var(--accent)" />
          ) : (
            <FileText size={18} color="var(--accent)" />
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLoading ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              Extracting text from <em>{fileName}</em>…
            </p>
          ) : success ? (
            <p style={{ margin: 0, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              ✓ Text extracted from <em style={{ fontStyle: 'normal' }}>{fileName}</em>
            </p>
          ) : error ? (
            <p style={{ margin: 0, fontSize: 12, color: '#ef4444', fontWeight: 600, lineHeight: 1.4 }}>
              {error}
            </p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                {isDragging ? 'Drop to extract text' : 'Drop file here, or click to browse'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                PDF · DOCX · TXT — max 10 MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Inline CSS animation for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
