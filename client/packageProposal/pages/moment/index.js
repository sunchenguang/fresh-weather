const { MOMENT, CLIMAX_BGM } = require('../../config')

const FW_COLORS = [
  '#fff4d6',
  '#ffe566',
  '#ff9ec7',
  '#ffb6d9',
  '#a8d8ff',
  '#ffd700',
  '#ff6b9d',
  '#fffef0',
  '#ffc46b',
  '#e8f0ff'
]

function sparkBackground(hex, hot) {
  if (hot) {
    return `radial-gradient(circle at 38% 38%, #ffffff 0%, #fff8e8 35%, #ffd98a 72%, rgba(255,160,70,0.92) 100%)`
  }
  return `radial-gradient(circle at 40% 40%, #fffffe 0%, ${hex} 52%, rgba(255,255,255,0.15) 100%)`
}

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

/** 阶段切换多等一会儿，避免末尾Keyframes未完全利落 */
const PHASE_END_BUFFER_MS = 480

/** LOVE 字母最晚一粒弹完大致：最后一字 delay + 动画时长（与 wxml 中一致） */
const LOVE_LETTER_PHASE_SEC = 0.14 * 3 + 0.35 + 2.4

/** 升空 → 顶点炸开，tierClass 对应 wxss 里五档高度与时间轴 */
function buildFireworks() {
  const list = []
  const num = 7
  let maxEndSec = 0
  for (let b = 0; b < num; b++) {
    const tier = Math.floor(Math.random() * 5)
    const n = 52 + Math.floor(Math.random() * 22)
    const rays = []
    for (let i = 0; i < n; i++) {
      const base = (360 / n) * i
      const color = FW_COLORS[i % FW_COLORS.length]
      const hot = Math.random() < 0.2
      rays.push({
        rid: `r-${b}-${i}`,
        deg: base + (Math.random() - 0.5) * 18,
        color,
        bg: sparkBackground(color, hot),
        w: 4 + Math.floor(Math.random() * 6),
        reach: Number((0.72 + Math.random() * 0.38).toFixed(2))
      })
    }
    const cycle = Number((2.85 + Math.random() * 1.25).toFixed(2))
    /* 按序号拉开放飞间隔，避免几束挤在同一时段；少量扰动更自然 */
    const delay = Number((b * 2.45 + Math.random() * 0.95).toFixed(2))
    maxEndSec = Math.max(maxEndSec, delay + cycle)
    list.push({
      id: `fw-${b}-${Date.now()}-${tier}`,
      x: 6 + Math.random() * 88,
      cycle,
      delay,
      tierClass: `fw-tier-${tier}`,
      rays
    })
  }
  return {
    fireworks: list,
    phaseMs: Math.ceil(maxEndSec * 1000) + PHASE_END_BUFFER_MS
  }
}

function buildBurstHearts() {
  const hearts = []
  const colors = ['#ffb6c1', '#ff8fab', '#ffd1dc', '#ffe4ec', '#ffc0cb']
  let maxEndSec = 0
  for (let i = 0; i < 26; i++) {
    const delay = Math.random() * 1.1
    const dur = 3.5 + Math.random() * 2.2
    maxEndSec = Math.max(maxEndSec, delay + dur)
    hearts.push({
      id: `h-${i}-${Date.now()}`,
      left: 4 + Math.random() * 92,
      delay,
      dur,
      size: 28 + Math.floor(Math.random() * 36),
      color: colors[i % colors.length]
    })
  }
  const heartWaveSec = maxEndSec
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
    fireworks: [],
    burstHearts: [],
    loveLetters: ['L', 'O', 'V', 'E']
  },

  onLoad() {
    this.setData({ stars: buildStars() })
    this.bgm = wx.createInnerAudioContext()
    this.bgm.src = CLIMAX_BGM
    this.bgm.loop = false
    this.bgm.volume = 0.9
  },

  onUnload() {
    this._clearCelebrationPhaseTimer()
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.destroy()
      this.bgm = null
    }
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
        const pack = buildFireworks()
        this._celebrationPhaseStayMs = pack.phaseMs
        this.setData({
          celebrationPhase: 'fireworks',
          fireworks: pack.fireworks,
          burstHearts: []
        })
      } else {
        const pack = buildBurstHearts()
        this._celebrationPhaseStayMs = pack.phaseMs
        this.setData({
          celebrationPhase: 'hearts',
          burstHearts: pack.burstHearts,
          fireworks: []
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
    const heartPack = buildBurstHearts()
    this._celebrationPhaseStayMs = heartPack.phaseMs
    this.setData({
      committed: true,
      pulsing: false,
      celebrating: true,
      celebrationPhase: 'hearts',
      burstHearts: heartPack.burstHearts,
      fireworks: []
    })
    this._scheduleCelebrationPhaseFlip()
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.play()
    }
  }
})
