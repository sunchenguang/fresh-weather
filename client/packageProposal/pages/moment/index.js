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

/** 升空 → 顶点炸开，tierClass 对应 wxss 里五档高度与时间轴 */
function buildFireworks() {
  const list = []
  const num = 7
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
    list.push({
      id: `fw-${b}-${Date.now()}-${tier}`,
      x: 6 + Math.random() * 88,
      cycle: Number((2.85 + Math.random() * 1.25).toFixed(2)),
      /* 按序号拉开放飞间隔，避免几束挤在同一时段；少量扰动更自然 */
      delay: Number((b * 2.45 + Math.random() * 0.95).toFixed(2)),
      tierClass: `fw-tier-${tier}`,
      rays
    })
  }
  return list
}

function buildBurstHearts() {
  const hearts = []
  const colors = ['#ffb6c1', '#ff8fab', '#ffd1dc', '#ffe4ec', '#ffc0cb']
  for (let i = 0; i < 26; i++) {
    hearts.push({
      id: `h-${i}-${Date.now()}`,
      left: 4 + Math.random() * 92,
      delay: Math.random() * 1.1,
      dur: 3.5 + Math.random() * 2.2,
      size: 28 + Math.floor(Math.random() * 36),
      color: colors[i % colors.length]
    })
  }
  return hearts
}

Page({
  data: {
    copy: MOMENT,
    stars: [],
    pulsing: true,
    committed: false,
    celebrating: false,
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
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.destroy()
      this.bgm = null
    }
  },

  onYes() {
    if (this.data.committed) {
      return
    }
    this.setData({
      committed: true,
      pulsing: false,
      celebrating: true,
      fireworks: buildFireworks(),
      burstHearts: buildBurstHearts()
    })
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.play()
    }
  }
})
