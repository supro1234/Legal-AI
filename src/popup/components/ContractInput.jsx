import { useState } from 'react'
import { Clipboard } from 'lucide-react'

const MAX_CHARS = 8000

export default function ContractInput({ value, onChange }) {
  const [pasteAnim, setPasteAnim] = useState(false)

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text.slice(0, MAX_CHARS))
      setPasteAnim(true)
      setTimeout(() => setPasteAnim(false), 700)
    } catch {
      /* clipboard permission denied — user can paste manually */
    }
  }

  const count = value.length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Step 3 — Paste Contract
        </p>
        <button
          onClick={handlePaste}
          title="Paste from clipboard"
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        4,
            padding:    '4px 10px',
            borderRadius: 8,
            border:     '1px solid var(--border)',
            background: pasteAnim ? 'var(--accent)' : 'var(--surface)',
            color:      pasteAnim ? '#fff' : 'var(--muted)',
            fontSize:   11,
            fontWeight: 600,
            cursor:     'pointer',
            transition: 'all 200ms ease',
          }}
        >
          <Clipboard size={12} />
          Paste
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Paste your full contract, agreement, lease deed, privacy policy, or terms of service text here…"
          style={{
            width:        '100%',
            minHeight:    'max(130px, 30vh)',
            resize:       'vertical',
            background:   'var(--surface)',
            border:       '1px solid var(--border)',
            borderRadius: 10,
            color:        'var(--text)',
            fontSize:     13,
            padding:      '12px 14px',
            paddingBottom: 28,
            fontFamily:   'inherit',
            lineHeight:   1.6,
            outline:      'none',
            transition:   'border-color 200ms ease',
            boxSizing:    'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
        />
        <span
          style={{
            position:  'absolute',
            bottom:    10,
            right:     12,
            fontSize:  11,
            color:     count > MAX_CHARS * 0.9 ? 'var(--warning)' : 'var(--muted)',
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          {count.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
