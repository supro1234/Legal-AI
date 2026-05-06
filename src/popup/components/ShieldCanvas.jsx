import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ── Particle colour per app-state ────────────────────────────────────────────
const STATE_COLORS = {
  idle:       { r: 0.290, g: 0.871, b: 0.502 }, // bright green  (dark mode)
  light_idle: { r: 0.118, g: 0.431, b: 0.314 }, // deep green    (light mode)
  scanning:   { r: 0.600, g: 0.300, b: 0.900 }, // purple
  low:        { r: 0.062, g: 0.725, b: 0.505 }, // teal-green
  medium:     { r: 0.960, g: 0.620, b: 0.043 }, // amber
  high:       { r: 0.937, g: 0.266, b: 0.266 }, // red
}

// Soft radial-gradient sprite so particles look like glowing orbs
function createCircleTexture() {
  const size = 64
  const c    = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const g   = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
  g.addColorStop(0,   'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.8)')
  g.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

export default function ShieldCanvas({ appState, theme }) {
  const mountRef = useRef(null)
  const stateRef = useRef({ appState, theme })

  // Keep stateRef in sync without restarting the WebGL loop
  useEffect(() => {
    stateRef.current = { appState, theme }
  }, [appState, theme])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // ── Renderer ─────────────────────────────────────────────────────────────
    const W = () => container.offsetWidth  || window.innerWidth
    const H = () => container.offsetHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(W(), H())
    container.appendChild(renderer.domElement)

    // ── Scene & Camera ───────────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 1000)
    camera.position.z = 8

    // Resize handler — works for both popup and fullscreen
    const onResize = () => {
      const w = W(), h = H()
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)
    // Also observe container size changes (important for fullscreen toggle)
    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize)
      ro.observe(container)
    }

    // ── Particle System ──────────────────────────────────────────────────────
    const COUNT  = 180
    const bounds = { x: 14, y: 9, z: 4 }

    const positions  = new Float32Array(COUNT * 3)
    const colors     = new Float32Array(COUNT * 3)
    const velocities = []

    const initColor = STATE_COLORS.idle
    for (let i = 0; i < COUNT; i++) {
      positions[i*3]   = (Math.random() - 0.5) * bounds.x * 2
      positions[i*3+1] = (Math.random() - 0.5) * bounds.y * 2
      positions[i*3+2] = (Math.random() - 0.5) * bounds.z * 2
      velocities.push({
        x: (Math.random() - 0.5) * 0.018,
        y: (Math.random() - 0.5) * 0.018,
        z: (Math.random() - 0.5) * 0.018,
      })
      colors[i*3]   = initColor.r
      colors[i*3+1] = initColor.g
      colors[i*3+2] = initColor.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))

    const mat = new THREE.PointsMaterial({
      size:         0.12,
      vertexColors: true,
      map:          createCircleTexture(),
      transparent:  true,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geo, mat)
    scene.add(points)

    // ── Connection Lines ─────────────────────────────────────────────────────
    const maxLines     = COUNT * 10
    const linePos      = new Float32Array(maxLines * 6)
    const lineCol      = new Float32Array(maxLines * 6)
    const lineGeo      = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
    lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineCol, 3))

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent:  true,
      opacity:      0.4,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    })
    const linesMesh = new THREE.LineSegments(lineGeo, lineMat)
    scene.add(linesMesh)

    // ── Scan Beam ────────────────────────────────────────────────────────────
    const beamGeo = new THREE.PlaneGeometry(30, 0.12)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf093fb, transparent: true, opacity: 0,
      depthWrite: false, side: THREE.DoubleSide,
    })
    const beam = new THREE.Mesh(beamGeo, beamMat)
    beam.position.z = 0.1
    scene.add(beam)

    // ── Animation State ──────────────────────────────────────────────────────
    let prevState    = 'idle'
    let tweenProg    = 0
    let beamDir      = -1
    let beamY        = 4
    let pulseT       = 0
    let burstT       = 0
    let isBursting   = false
    let lastTheme    = null   // track theme changes to only update blending when needed

    const lerp = (a, b, t) => a + (b - a) * t

    function tweenColors(targetState, progress) {
      const from = STATE_COLORS[prevState] || STATE_COLORS.idle
      const to   = STATE_COLORS[targetState] || STATE_COLORS.idle
      const col  = geo.attributes.color
      const t    = Math.min(progress, 1)
      for (let i = 0; i < COUNT; i++) {
        col.array[i*3]   = lerp(from.r, to.r, t)
        col.array[i*3+1] = lerp(from.g, to.g, t)
        col.array[i*3+2] = lerp(from.b, to.b, t)
      }
      col.needsUpdate = true
    }

    const rafRef = { id: null }

    function animate() {
      rafRef.id = requestAnimationFrame(animate)

      const { appState: curState, theme: curTheme } = stateRef.current
      const isLight      = curTheme === 'light'
      const effectiveIdle = isLight ? 'light_idle' : 'idle'
      const targetState  = curState === 'idle' ? effectiveIdle : curState

      // ── Switch blending only when theme actually changes ──────────────────
      if (curTheme !== lastTheme) {
        lastTheme = curTheme
        const blend = isLight ? THREE.NormalBlending : THREE.AdditiveBlending
        mat.blending     = blend
        lineMat.blending = blend
        beamMat.blending = blend
        mat.needsUpdate     = true
        lineMat.needsUpdate = true
        // Also push a theme-switch to start colour tween to idle of new theme
        if (prevState === 'idle' || prevState === 'light_idle') {
          prevState    = isLight ? 'idle' : 'light_idle'
          tweenProg    = 0
        }
      }

      // ── Background clear colour matches the CSS theme exactly ─────────────
      renderer.setClearColor(isLight ? 0xfafbfa : 0x0a110d, 1)

      // ── Colour tween on state change ──────────────────────────────────────
      if (targetState !== prevState) {
        tweenProg += 0.025
        tweenColors(targetState, tweenProg)
        if (tweenProg >= 1) { prevState = targetState; tweenProg = 0 }
      }

      // ── Move particles ────────────────────────────────────────────────────
      const posAttr   = geo.attributes.position
      const colorAttr = geo.attributes.color
      for (let i = 0; i < COUNT; i++) {
        posAttr.array[i*3]   += velocities[i].x
        posAttr.array[i*3+1] += velocities[i].y
        posAttr.array[i*3+2] += velocities[i].z
        if (Math.abs(posAttr.array[i*3])   > bounds.x) velocities[i].x *= -1
        if (Math.abs(posAttr.array[i*3+1]) > bounds.y) velocities[i].y *= -1
        if (Math.abs(posAttr.array[i*3+2]) > bounds.z) velocities[i].z *= -1
      }
      posAttr.needsUpdate = true

      // ── Update connection lines ───────────────────────────────────────────
      let lineIdx = 0
      const connectDistSq = 3.5
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = posAttr.array[i*3]   - posAttr.array[j*3]
          const dy = posAttr.array[i*3+1] - posAttr.array[j*3+1]
          const dz = posAttr.array[i*3+2] - posAttr.array[j*3+2]
          const dSq = dx*dx + dy*dy + dz*dz
          if (dSq < connectDistSq && lineIdx < maxLines) {
            const alpha = 1.0 - (dSq / connectDistSq)
            const r1 = colorAttr.array[i*3],   g1 = colorAttr.array[i*3+1], b1 = colorAttr.array[i*3+2]
            const r2 = colorAttr.array[j*3],   g2 = colorAttr.array[j*3+1], b2 = colorAttr.array[j*3+2]
            linePos[lineIdx*6]   = posAttr.array[i*3]
            linePos[lineIdx*6+1] = posAttr.array[i*3+1]
            linePos[lineIdx*6+2] = posAttr.array[i*3+2]
            linePos[lineIdx*6+3] = posAttr.array[j*3]
            linePos[lineIdx*6+4] = posAttr.array[j*3+1]
            linePos[lineIdx*6+5] = posAttr.array[j*3+2]
            lineCol[lineIdx*6]   = r1 * alpha
            lineCol[lineIdx*6+1] = g1 * alpha
            lineCol[lineIdx*6+2] = b1 * alpha
            lineCol[lineIdx*6+3] = r2 * alpha
            lineCol[lineIdx*6+4] = g2 * alpha
            lineCol[lineIdx*6+5] = b2 * alpha
            lineIdx++
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2)
      lineGeo.attributes.position.needsUpdate = true
      lineGeo.attributes.color.needsUpdate    = true

      // ── Slow rotation ─────────────────────────────────────────────────────
      points.rotation.y    += 0.0005
      linesMesh.rotation.y += 0.0005

      // ── Scan beam ─────────────────────────────────────────────────────────
      if (curState === 'scanning') {
        beamMat.opacity = 0.45
        beamY += beamDir * 0.06
        if (beamY < -4 || beamY > 4) beamDir *= -1
        beam.position.y = beamY
      } else {
        beamMat.opacity = 0
      }

      // ── Pulse on low/medium risk ──────────────────────────────────────────
      if (curState === 'low' || curState === 'medium') {
        pulseT += 0.04
        const s = 1 + Math.sin(pulseT) * 0.04
        points.scale.setScalar(s); linesMesh.scale.setScalar(s)
      } else {
        points.scale.setScalar(1); linesMesh.scale.setScalar(1)
      }

      // ── Burst on high risk ────────────────────────────────────────────────
      if (curState === 'high' && !isBursting) { isBursting = true; burstT = 0 }
      if (isBursting) {
        burstT += 0.04
        const b = 1 + Math.sin(burstT * Math.PI) * 0.12
        points.scale.setScalar(b); linesMesh.scale.setScalar(b)
        if (burstT >= 1) { isBursting = false; burstT = 0 }
      }

      renderer.render(scene, camera)
    }

    animate()

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.id)
      window.removeEventListener('resize', onResize)
      if (ro) ro.disconnect()
      renderer.dispose(); geo.dispose(); mat.dispose()
      beamGeo.dispose(); beamMat.dispose()
      lineGeo.dispose(); lineMat.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, []) // ← runs once; theme/state react via stateRef

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',   // ← NOT fixed — contained inside parent
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  )
}
