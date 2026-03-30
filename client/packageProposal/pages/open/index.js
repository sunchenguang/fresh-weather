const { OPEN } = require('../../config')

Page({
  data: {
    copy: OPEN,
    visible: false,
    stars: []
  },

  onLoad() {
    const stars = []
    for (let i = 0; i < 48; i++) {
      stars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2.5
      })
    }
    this.setData({ stars })
    setTimeout(() => {
      this.setData({ visible: true })
    }, 120)
  },

  onContinue() {
    wx.navigateTo({
      url: '/packageProposal/pages/story/index'
    })
  }
})
