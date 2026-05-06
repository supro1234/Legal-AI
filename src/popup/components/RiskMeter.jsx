import { useEffect, useRef } from 'react'

const RISK_COLORS = {
  Low:    '#00f593',
  Medium: '#fbbf24',
  High:   '#ef4444',
}

export default function RiskMeter({ score, level }) {
  const canvasRef = useRef(null)
  const animRef   = useRef({ current: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = 180
    const H = canvas.height = 120
    const cx = W / 2, cy = H - 20
    const R = 72
    const color = RISK_COLORS[level] || '#4facfe'
    const target = score

    let current = animRef.current.current
    const step = () => {
      if (current < target) {
        current = Math.min(current + 2.5, target)
      } else if (current > target) {
        current = Math.max(current - 2.5, target)
      }
      animRef.current.current = current

      ctx.clearRect(0, 0, W, H)

      // Track arc (grey)
      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI, 0, false)
      ctx.strokeStyle = 'rgba(100,116,139,0.25)'
      ctx.lineWidth   = 10
      ctx.lineCap     = 'round'
      ctx.stroke()

      // Value arc
      const fraction = current / 100
      const endAngle = Math.PI + fraction * Math.PI
      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI, endAngle, false)
      ctx.strokeStyle = color
      ctx.lineWidth   = 10
      ctx.lineCap     = 'round'
      ctx.shadowBlur  = 16
      ctx.shadowColor = color
      ctx.stroke()
      ctx.shadowBlur  = 0

      // Score text
      ctx.textAlign   = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle   = color
      ctx.font        = 'bold 34px Inter, system-ui, sans-serif'
      ctx.fillText(Math.round(current), cx, cy - 6)

      // /100 label — always inside canvas bounds
      ctx.fillStyle = 'rgba(100,116,139,0.85)'
      ctx.font      = 'bold 12px Inter, system-ui, sans-serif'
      ctx.fillText('/ 100', cx, cy + 14)

      if (Math.abs(current - target) > 0.5) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [score, level])

  const color = RISK_COLORS[level] || '#4facfe'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block' }}
      />
      <span
        style={{
          fontSize:     13,
          fontWeight:   700,
          padding:      '4px 16px',
          borderRadius: 99,
          background:   `color-mix(in srgb, ${color} 20%, transparent)`,
          color,
          border:       `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
          letterSpacing: '0.04em',
        }}
      >
        {level?.toUpperCase()} RISK
      </span>
    </div>
  )
}
