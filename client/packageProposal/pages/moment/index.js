const { MOMENT, CLIMAX_BGM } = require('../../config')

Page({
  data: {
    copy: MOMENT,
    sparks: [],
    showModal: false,
    pulsing: true,
    committed: false
  },

  onLoad() {
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
    this.setData({ committed: true })
    const sparks = []
    for (let i = 0; i < 56; i++) {
      sparks.push({
        id: `s-${Date.now()}-${i}`,
        x: 28 + Math.random() * 44,
        y: 36 + Math.random() * 22,
        delay: Math.random() * 0.2
      })
    }
    this.setData({
      sparks,
      pulsing: false,
      showModal: true
    })
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.play()
    }
  },

  onCloseModal() {
    this.setData({ showModal: false })
  },

  noop() {}
})
