const { OPEN } = require('../../config')

Page({
  data: {
    copy: OPEN,
    visible: false,
    stars: []
  },

  onLoad() {
    const twVariants = ['a', 'b', 'c']
    const stars = []
    for (let i = 0; i < 80; i++) {
      stars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 1.8 + Math.random() * 3.4,
        tw: twVariants[Math.floor(Math.random() * 3)],
        tone: Math.random() > 0.68 ? 'cool' : 'warm',
        size: Math.random() > 0.76 ? 'lg' : 'sm'
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
