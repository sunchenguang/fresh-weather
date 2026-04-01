const { QUIZ, STORY_BGM } = require('../../config')

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

Page({
  data: {
    rounds: QUIZ,
    index: 0,
    current: null,
    total: QUIZ.length,
    progressPercent: 0,
    indexDisplay: '01 / 01',
    statusBarPx: 24,
    stars: [],
    scrollViewHeight: 400,
    scrollContentMinHeight: 400
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const winH = sys.windowHeight
    const winW = sys.windowWidth
    const rpxPx = winW / 750
    const statusBar = sys.statusBarHeight || 24
    const safeBottom = sys.safeArea
      ? Math.max(0, winH - sys.safeArea.bottom)
      : 0
    /* 顶栏 + 标题区大约占用的 rpx；scroll-view 在真机必须有明确高度，不能仅靠 flex:1 + height:0 */
    const mastheadRpx = 332
    const mastheadPx = mastheadRpx * rpxPx
    const scrollViewHeight = Math.max(
      Math.round(winH - statusBar - mastheadPx - safeBottom),
      240
    )
    const scrollContentMinHeight = scrollViewHeight
    const twVariants = ['a', 'b', 'c']
    const stars = []
    for (let i = 0; i < 68; i++) {
      stars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 1.8 + Math.random() * 3.4,
        tw: twVariants[Math.floor(Math.random() * 3)],
        tone: Math.random() > 0.62 ? 'cool' : 'warm',
        size: Math.random() > 0.74 ? 'lg' : 'sm'
      })
    }
    this.setData(
      Object.assign(
        {
          statusBarPx: statusBar,
          stars,
          scrollViewHeight,
          scrollContentMinHeight
        },
        this._syncRound(0)
      )
    )

    this.audio = wx.createInnerAudioContext()
    this.audio.src = STORY_BGM
    this.audio.loop = true
    this.audio.volume = 0.55
    this.audio.play()
  },

  onUnload() {
    if (this.audio) {
      this.audio.stop()
      this.audio.destroy()
      this.audio = null
    }
  },

  onHide() {
    if (this.audio) {
      this.audio.pause()
    }
  },

  onShow() {
    if (this.audio) {
      this.audio.play()
    }
  },

  _syncRound(i) {
    const total = QUIZ.length
    const current = QUIZ[i]
    return {
      index: i,
      current,
      total,
      progressPercent: Math.round(((i + 1) / total) * 100),
      indexDisplay: `${pad2(i + 1)} / ${pad2(total)}`
    }
  },

  onPick(e) {
    const id = e.currentTarget.dataset.id
    const { current, index, rounds } = this.data
    const { correctId, hints, defaultHint } = current
    if (id !== correctId) {
      const hint = (hints && hints[id]) || defaultHint
      wx.showToast({
        title: hint,
        icon: 'none',
        duration: 2200
      })
      return
    }
    const next = index + 1
    if (next >= rounds.length) {
      wx.navigateTo({
        url: '/packageProposal/pages/moment/index'
      })
      return
    }
    this.setData(this._syncRound(next))
  }
})
