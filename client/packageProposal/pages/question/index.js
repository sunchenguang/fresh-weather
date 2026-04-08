const { QUIZ } = require('../../config')

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
    scrollContentMinHeight: 400,
    heartFx: null
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
  },

  onUnload() {
    if (this._correctFeedbackTimer != null) {
      clearTimeout(this._correctFeedbackTimer)
      this._correctFeedbackTimer = null
    }
    this._pickingLocked = false
    this._lastOptTap = null
  },

  onOptTouchStart(e) {
    const t = e.touches && e.touches[0]
    if (t) {
      this._lastOptTap = { x: t.pageX, y: t.pageY }
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
    if (this._pickingLocked || this.data.heartFx) {
      return
    }
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
    this._pickingLocked = true
    const pt =
      this._lastOptTap ||
      (() => {
        const sys = wx.getSystemInfoSync()
        return {
          x: (sys.windowWidth || 375) / 2,
          y: (sys.windowHeight || 667) / 2
        }
      })()
    this._lastOptTap = null
    this.setData({ heartFx: { x: pt.x, y: pt.y } })
    if (this._correctFeedbackTimer != null) {
      clearTimeout(this._correctFeedbackTimer)
    }
    this._correctFeedbackTimer = setTimeout(() => {
      this._correctFeedbackTimer = null
      this._pickingLocked = false
      const next = index + 1
      if (next >= rounds.length) {
        this.setData({ heartFx: null })
        wx.navigateTo({
          url: '/packageProposal/pages/moment/index'
        })
        return
      }
      this.setData(
        Object.assign({ heartFx: null }, this._syncRound(next))
      )
    }, 980)
  }
})
