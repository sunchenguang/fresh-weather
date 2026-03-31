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
    statusBarPx: 24
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData(
      Object.assign({ statusBarPx: sys.statusBarHeight || 24 }, this._syncRound(0))
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
