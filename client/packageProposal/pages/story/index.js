const { STORY_PHOTOS, STORY_BGM } = require('../../config')

Page({
  data: {
    photos: STORY_PHOTOS,
    current: 0,
    indexHuman: 1,
    totalHuman: STORY_PHOTOS.length
  },

  onLoad() {
    this.audio = wx.createInnerAudioContext()
    this.audio.src = STORY_BGM
    this.audio.loop = true
    this.audio.volume = 0.75
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

  onSwipeChange(e) {
    const current = e.detail.current
    this.setData({
      current,
      indexHuman: current + 1
    })
  },

  onNext() {
    wx.navigateTo({
      url: '/packageProposal/pages/question/index'
    })
  }
})
