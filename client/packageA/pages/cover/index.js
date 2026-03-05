Page({
  data: {
    windowWidth: 375,
    windowHeight: 667,
    fadeIn: false
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight
    })

    // 页面加载后触发淡入动画
    setTimeout(() => {
      this.setData({ fadeIn: true })
    }, 100)
  },

  // 点击任意位置跳转到告白页
  onTapPage() {
    wx.navigateTo({
      url: '/packageA/pages/confession/index'
    })
  }
})
