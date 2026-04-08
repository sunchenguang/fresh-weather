/**
 * Canvas2D 烟花：弹道上升 + 球壳碎裂 + 重力/空气阻力 + 尾迹与爆闪
 * 坐标：y 向下为正
 */

const G = 420
const DRAG_PER_SEC = 0.88
/** 初速按无阻力公式算，升空段同样施加阻力，需略加大初速才能让顶点接近 burstY */
const V0_DRAG_COMPENSATION = 1.14

const PALETTES = [
  ['#fff4d6', '#ffd666', '#ff9ec7', '#ffb89a', '#ffe566'],
  ['#fffef0', '#fbbf77', '#fb7185', '#fda4af', '#fcd34d'],
  ['#e0f2fe', '#93c5fd', '#fbcfe8', '#fef3c7', '#fde68a'],
  ['#fef9c3', '#facc15', '#fb923c', '#f472b6', '#ffffff']
]

function pickPalette() {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)]
}

function dragFactor(dt) {
  return Math.pow(DRAG_PER_SEC, dt)
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** 尾迹点 */
function makeTrail(maxLen) {
  return { pts: [], maxLen }
}

function trailPush(tr, x, y) {
  tr.pts.push({ x, y })
  if (tr.pts.length > tr.maxLen) {
    tr.pts.shift()
  }
}

function drawTrail(ctx, tr, colorRgb, alphaBase) {
  const { pts } = tr
  const n = pts.length
  if (n < 2) {
    return
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let i = 1; i < n; i++) {
    const t = i / (n - 1)
    const a = alphaBase * t * t
    ctx.strokeStyle = `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},${a})`
    ctx.lineWidth = 1 + 2.2 * t
    ctx.beginPath()
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
    ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  }
}

class MomentFireworks {
  constructor() {
    this._canvas = null
    this._ctx = null
    this._w = 0
    this._h = 0
    this._dpr = 1
    this._running = false
    this._rafId = null
    this._lastT = 0
    this.rockets = []
    this.particles = []
    this.flashes = []
    this.launchQueue = []
    this.elapsed = 0
  }

  attach(canvas, ctx, cssW, cssH, dpr) {
    this._canvas = canvas
    this._ctx = ctx
    this._w = cssW
    this._h = cssH
    this._dpr = dpr
  }

  reset() {
    this.rockets = []
    this.particles = []
    this.flashes = []
    this.launchQueue = []
    this.elapsed = 0
    this._lastT = 0
  }

  /**
   * @param {Array<{ t: number, x0: number, burstY: number }>} plan - t=秒, x0=0~1 发射横坐标, burstY=从顶部算起的爆炸高度比
   */
  schedule(plan) {
    this.launchQueue = plan.slice().sort((a, b) => a.t - b.t)
  }

  startLoop() {
    if (this._running || !this._ctx) {
      return
    }
    this._running = true
    this._lastT = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
    const tick = () => {
      if (!this._running) {
        return
      }
      const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
      let dt = (now - this._lastT) / 1000
      this._lastT = now
      if (dt > 0.1) {
        dt = 0.1
      }
      this.step(dt)
      this.draw()
      const raf = this._canvas && this._canvas.requestAnimationFrame
      if (raf) {
        this._rafId = raf.call(this._canvas, tick)
      } else {
        this._rafId = setTimeout(tick, 16)
      }
    }
    tick()
  }

  stopLoop() {
    this._running = false
    if (this._canvas && this._canvas.cancelAnimationFrame && this._rafId) {
      this._canvas.cancelAnimationFrame(this._rafId)
    } else if (this._rafId) {
      clearTimeout(this._rafId)
    }
    this._rafId = null
    if (this._ctx && this._w > 0 && this._h > 0) {
      this._ctx.clearRect(0, 0, this._w, this._h)
    }
  }

  _spawnRocket(x0, burstY) {
    const x = x0 * this._w
    const targetY = burstY * this._h
    const y0 = this._h - 24
    const dist = y0 - targetY
    const v0 =
      -Math.sqrt(Math.max(0, 2 * G * dist)) * (0.94 + Math.random() * 0.06) * V0_DRAG_COMPENSATION
    const rgb = hexToRgb('#ffdca8')
    this.rockets.push({
      x,
      y: y0,
      vx: (Math.random() - 0.5) * 28,
      vy: v0,
      targetY,
      trail: makeTrail(14),
      rgb,
      dead: false
    })
  }

  _explode(cx, cy, palette) {
    const nMain = 72 + Math.floor(Math.random() * 48)
    const nSpark = 28 + Math.floor(Math.random() * 22)

    this.flashes.push({
      x: cx,
      y: cy,
      r: 0,
      life: 0.22,
      max: 0.22
    })

    for (let i = 0; i < nMain; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const speed = 220 + Math.random() * 320
      const sx = Math.sin(phi) * Math.cos(theta)
      const sy = Math.sin(phi) * Math.sin(theta) * 0.82
      const color = palette[Math.floor(Math.random() * palette.length)]
      const rgb = hexToRgb(color)
      const vmag = speed * (0.78 + Math.random() * 0.44)
      this.particles.push({
        x: cx,
        y: cy,
        vx: sx * vmag,
        vy: sy * vmag,
        life: 1.35 + Math.random() * 0.85,
        maxLife: 1.35 + Math.random() * 0.85,
        rgb,
        r: 1.1 + Math.random() * 1.6,
        kind: 'ember'
      })
    }

    for (let j = 0; j < nSpark; j++) {
      const theta = Math.random() * Math.PI * 2
      const speed = 380 + Math.random() * 420
      const color = palette[Math.floor(Math.random() * palette.length)]
      const rgb = hexToRgb(color)
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(theta) * speed * 0.35,
        vy: Math.sin(theta) * speed * 0.35,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.45 + Math.random() * 0.35,
        rgb,
        r: 0.65 + Math.random() * 0.55,
        kind: 'spark'
      })
    }
  }

  step(dt) {
    this.elapsed += dt

    while (this.launchQueue.length && this.launchQueue[0].t <= this.elapsed) {
      const job = this.launchQueue.shift()
      this._spawnRocket(job.x0, job.burstY)
    }

    const df = dragFactor(dt)

    for (const r of this.rockets) {
      if (r.dead) {
        continue
      }
      trailPush(r.trail, r.x, r.y)
      r.vy += G * dt
      r.vx *= df
      r.vy *= df
      r.x += r.vx * dt
      r.y += r.vy * dt
      if (r.vy >= 0 || r.y <= r.targetY) {
        r.dead = true
        /* 必须与弹头当前位置一致：有空气阻力时顶点 y 常大于 targetY，用 min 会把爆心挪到更高处 */
        this._explode(r.x, r.y, pickPalette())
      }
    }
    this.rockets = this.rockets.filter(r => !r.dead)

    for (const p of this.particles) {
      p.vy += G * dt
      p.vx *= df
      p.vy *= df
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      if (p.kind === 'spark' && Math.random() < 0.08) {
        p.rgb = { r: 255, g: 250, b: 235 }
      }
    }
    this.particles = this.particles.filter(p => p.life > 0)

    for (const f of this.flashes) {
      f.life -= dt
      f.r += dt * 520
    }
    this.flashes = this.flashes.filter(f => f.life > 0)
  }

  draw() {
    const ctx = this._ctx
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, this._w, this._h)

    for (const r of this.rockets) {
      drawTrail(ctx, r.trail, r.rgb, 0.55)
      const glow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 9)
      glow.addColorStop(0, 'rgba(255,250,235,0.95)')
      glow.addColorStop(0.45, 'rgba(255,200,120,0.35)')
      glow.addColorStop(1, 'rgba(255,120,40,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(r.x, r.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,248,0.9)'
      ctx.beginPath()
      ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const f of this.flashes) {
      const a = (f.life / f.max) * 0.38
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r)
      grad.addColorStop(0, `rgba(255,252,240,${a})`)
      grad.addColorStop(0.35, `rgba(255,230,180,${a * 0.45})`)
      grad.addColorStop(1, 'rgba(255,200,120,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const p of this.particles) {
      const t = Math.max(0, p.life / p.maxLife)
      const a = t * (p.kind === 'spark' ? 0.95 : 0.78)
      const rad = p.r * (0.55 + 0.45 * Math.sqrt(t))
      const { rgb } = p
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 2.2)
      grad.addColorStop(0, `rgba(255,255,252,${a * 0.9})`)
      grad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},${a * 0.85})`)
      grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(p.x, p.y, rad * 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function buildLaunchPlan() {
  const launches = []
  let t = 0.15
  const count = 6 + Math.floor(Math.random() * 2)
  for (let i = 0; i < count; i++) {
    launches.push({
      t,
      x0: 0.1 + Math.random() * 0.8,
      burstY: 0.14 + Math.random() * 0.32
    })
    t += 0.88 + Math.random() * 0.62
  }
  const totalSec = t + 2.45
  return { launches, totalSec }
}

module.exports = { MomentFireworks, buildLaunchPlan }
