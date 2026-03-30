const { QUIZ, STORY_BGM } = require('../../config')

Page({
  data: {
    quiz: QUIZ
  },

  onLoad() {
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

  onPick(e) {
    const id = e.currentTarget.dataset.id
    const { correctId, hints, defaultHint } = QUIZ
    if (id === correctId) {
      wx.navigateTo({
        url: '/packageProposal/pages/moment/index'
      })
      return
    }
    const hint = (hints && hints[id]) || defaultHint
    wx.showToast({
      title: hint,
      icon: 'none',
      duration: 2200
    })
  }
})
