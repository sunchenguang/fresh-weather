const { MOMENT, CLIMAX_BGM } = require('../../config')
const { MomentFireworks, buildLaunchPlan } = require('./fireworks-canvas')

function buildStars() {
  const stars = []
  for (let i = 0; i < 48; i++) {
    stars.push({
      id: `st-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: 3 + Math.floor(Math.random() * 5),
      delay: Math.random() * 3.5
    })
  }
  return stars
}

/** 阶段切换末尾少量缓冲 */
const PHASE_END_BUFFER_MS = 80
/**
 * 切烟花时点：按动画进度比例（与 index.wxss heartRise 主峰约在 88% 前完成升空）
 * 只用淡出尾段，避免计时仍等满 duration 造成空档
 */
const HEART_PHASE_AT_PROGRESS = 0.9
/** 在进度点后额外略提前一点接上烟花（秒） */
const HEART_PHASE_TRIM_BEFORE_FIREWORKS_SEC = 0.28

/** LOVE 字母最晚一粒弹完：最后一字 delay + 动画时长（与 index.wxss .love-ch 一致） */
const LOVE_LETTER_PHASE_SEC = 0.14 * 3 + 0.35 + 1.85

function buildBurstHearts() {
  const hearts = []
  const colors = ['#ffb6c1', '#ff8fab', '#ffd1dc', '#ffe4ec', '#ffc0cb']
  let maxPhaseSec = 0
  for (let i = 0; i < 26; i++) {
    const delay = Math.random() * 0.45
    const dur = 7.4 + Math.random() * 2.4
    maxPhaseSec = Math.max(maxPhaseSec, delay + dur * HEART_PHASE_AT_PROGRESS)
    hearts.push({
      id: `h-${i}-${Date.now()}`,
      left: 4 + Math.random() * 92,
      delay,
      dur,
      size: 28 + Math.floor(Math.random() * 36),
      color: colors[i % colors.length]
    })
  }
  const heartWaveSec = Math.max(0, maxPhaseSec - HEART_PHASE_TRIM_BEFORE_FIREWORKS_SEC)
  const phaseSec = Math.max(heartWaveSec, LOVE_LETTER_PHASE_SEC)
  return {
    burstHearts: hearts,
    phaseMs: Math.ceil(phaseSec * 1000) + PHASE_END_BUFFER_MS
  }
}

Page({
  data: {
    copy: MOMENT,
    stars: [],
    pulsing: true,
    committed: false,
    celebrating: false,
    /** hearts | fireworks — 与 celebrating 同时为 true 时有效 */
    celebrationPhase: 'hearts',
    burstHearts: [],
    loveLetters: ['L', 'O', 'V', 'E']
  },

  onLoad() {
    this.setData({ stars: buildStars() })
    this.bgm = wx.createInnerAudioContext()
    this.bgm.src = CLIMAX_BGM
    this.bgm.loop = false
    this.bgm.volume = 0.9
    this._fwRuntime = null
  },

  onUnload() {
    this._clearCelebrationPhaseTimer()
    this._clearFwBindRetry()
    this._stopFireworksRuntime()
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.destroy()
      this.bgm = null
    }
  },

  _stopFireworksRuntime() {
    if (this._fwRuntime) {
      this._fwRuntime.stopLoop()
      this._fwRuntime.reset()
    }
  },

  _clearFwBindRetry() {
    if (this._fwBindRetryTimer != null) {
      clearTimeout(this._fwBindRetryTimer)
      this._fwBindRetryTimer = null
    }
  },

  _bindFireworksCanvas(cb) {
    this._clearFwBindRetry()
    let attempts = 0
    const maxAttempts = 48
    const retryDelayMs = 80
    const run = () => {
      this._fwBindRetryTimer = null
      if (!this.data.celebrating || this.data.celebrationPhase !== 'fireworks') {
        return
      }
      attempts += 1
      if (attempts > maxAttempts) {
        return
      }
      const query =
        typeof this.createSelectorQuery === 'function' ? this.createSelectorQuery() : wx.createSelectorQuery()
      query
        .select('#fireworksCanvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (!this.data.celebrating || this.data.celebrationPhase !== 'fireworks') {
            return
          }
          if (!res || !res[0] || !res[0].node) {
            this._fwBindRetryTimer = setTimeout(run, retryDelayMs)
            return
          }
          const cssW = res[0].width
          const cssH = res[0].height
          if (cssW <= 0 || cssH <= 0) {
            this._fwBindRetryTimer = setTimeout(run, retryDelayMs)
            return
          }
          const info = wx.getSystemInfoSync()
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = info.pixelRatio || 1
          canvas.width = cssW * dpr
          canvas.height = cssH * dpr
          ctx.scale(dpr, dpr)
          if (!this._fwRuntime) {
            this._fwRuntime = new MomentFireworks()
          }
          this._fwRuntime.attach(canvas, ctx, cssW, cssH, dpr)
          if (typeof cb === 'function') {
            cb()
          }
        })
    }
    run()
  },

  _startFireworksRuntime(plan) {
    this._clearFwBindRetry()
    this._stopFireworksRuntime()
    this._bindFireworksCanvas(() => {
      if (!this.data.celebrating || this.data.celebrationPhase !== 'fireworks') {
        return
      }
      this._fwRuntime.reset()
      this._fwRuntime.schedule(plan.launches)
      this._fwRuntime.startLoop()
    })
  },

  _clearCelebrationPhaseTimer() {
    if (this._celebrationPhaseTimer) {
      clearTimeout(this._celebrationPhaseTimer)
      this._celebrationPhaseTimer = null
    }
  },

  _scheduleCelebrationPhaseFlip() {
    if (!this.data.celebrating) {
      return
    }
    const delayMs = Math.max(this._celebrationPhaseStayMs || 3000, 1)
    this._celebrationPhaseTimer = setTimeout(() => {
      if (!this.data.celebrating) {
        return
      }
      if (this.data.celebrationPhase === 'hearts') {
        const plan = buildLaunchPlan()
        this._celebrationPhaseStayMs = Math.ceil(plan.totalSec * 1000) + PHASE_END_BUFFER_MS
        this.setData(
          {
            celebrationPhase: 'fireworks',
            burstHearts: []
          },
          () => {
            wx.nextTick(() => {
              this._startFireworksRuntime(plan)
            })
          }
        )
      } else {
        this._stopFireworksRuntime()
        const pack = buildBurstHearts()
        this._celebrationPhaseStayMs = pack.phaseMs
        this.setData({
          celebrationPhase: 'hearts',
          burstHearts: pack.burstHearts
        })
      }
      this._scheduleCelebrationPhaseFlip()
    }, delayMs)
  },

  onYes() {
    if (this.data.committed) {
      return
    }
    this._clearCelebrationPhaseTimer()
    this._clearFwBindRetry()
    this._stopFireworksRuntime()
    const heartPack = buildBurstHearts()
    this._celebrationPhaseStayMs = heartPack.phaseMs
    this.setData({
      committed: true,
      pulsing: false,
      celebrating: true,
      celebrationPhase: 'hearts',
      burstHearts: heartPack.burstHearts
    })
    this._scheduleCelebrationPhaseFlip()
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.play()
    }
  }
})
