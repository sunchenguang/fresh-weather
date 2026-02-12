Page({
  data: {
    isPlaying: false,
    visibleSections: [],
    hearts: [],
    windowWidth: 375,
    windowHeight: 667,
    scrollTop: 0,
    statusBarHeight: 0,
    showBackButton: true
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      statusBarHeight: systemInfo.statusBarHeight || 0
    })

    // 初始化音乐播放器
    this.initMusic()
    
    // 初始化滚动监听
    this.initScrollObserver()
  },

  onUnload() {
    // 清理资源
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
  },

  // 初始化音乐播放器
  initMusic() {
    this.audioContext = wx.createInnerAudioContext()
    // 使用远程URL加载音频
    this.audioContext.src = 'https://near-orange-bs3erzbjsd.edgeone.app/bgm.mp3'
    this.audioContext.loop = true
    this.audioContext.onPlay(() => {
      this.setData({ isPlaying: true })
    })
    this.audioContext.onPause(() => {
      this.setData({ isPlaying: false })
    })
    this.audioContext.onError((err) => {
      console.error('音频播放失败:', err)
    })
  },

  // 切换音乐播放状态
  toggleMusic() {
    if (this.data.isPlaying) {
      this.audioContext.pause()
    } else {
      this.audioContext.play()
    }
  },

  // 初始化滚动监听
  initScrollObserver() {
    // 小程序中需要使用scroll事件来检测滚动
    // 在onScroll中处理可见性
  },

  // 滚动事件处理
  onScroll(e) {
    const scrollTop = e.detail.scrollTop
    // 同步scrollTop值
    this.setData({ scrollTop })
    
    // 当滚动超过200px时隐藏返回按钮
    const hideThreshold = 200
    const shouldShowBackButton = scrollTop < hideThreshold
    if (this.data.showBackButton !== shouldShowBackButton) {
      this.setData({ showBackButton: shouldShowBackButton })
    }
    
    const sectionHeight = 400 // 每个section大约的高度（px）
    const visibleIndex = Math.floor(scrollTop / sectionHeight)

    const visibleSections = []
    for (let i = 0; i <= visibleIndex && i < 9; i++) {
      visibleSections[i] = true
    }

    this.setData({ visibleSections })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 向下滚动
  scrollDown() {
    // 获取当前滚动位置，向下滚动一个屏幕高度
    const systemInfo = wx.getSystemInfoSync()
    const scrollDistance = systemInfo.windowHeight * 0.8 // 滚动80%的屏幕高度
    const newScrollTop = this.data.scrollTop + scrollDistance
    
    // 先设置为0，再设置为目标值，确保scroll-view能响应变化
    this.setData({
      scrollTop: 0
    }, () => {
      setTimeout(() => {
        this.setData({
          scrollTop: newScrollTop
        })
      }, 50)
    })
  },

  // 创建爱心
  createHeart(e) {
    const heartEmojis = ['💖', '❤️', '💕', '💗', '💓', '💝', '💞', '🧡']
    const touch = e.touches && e.touches[0] || e.detail || {}
    const x = touch.x || Math.random() * this.data.windowWidth
    const y = touch.y || Math.random() * this.data.windowHeight

    // 创建多个爱心
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const heart = {
          emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 40,
          delay: i * 0.1,
          id: Date.now() + i
        }
        const currentHearts = [...this.data.hearts, heart]
        this.setData({ hearts: currentHearts })

        // 3秒后移除
        setTimeout(() => {
          const updatedHearts = this.data.hearts.filter(h => h.id !== heart.id)
          this.setData({ hearts: updatedHearts })
        }, 3000)
      }, i * 100)
    }
  },

})
