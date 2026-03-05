Page({
  data: {
    windowWidth: 375,
    windowHeight: 667,
    // 照片列表（示例，你可以替换为实际的照片URL）
    photos: [
      'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155298871822540800.jpg',
      'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155298985345572864.jpg',
      'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155299003733401600.jpg',
      'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155299018153418752.jpg',
    ],
    currentIndex: 0,
    // 走马灯动画相关
    carouselOffset: 0,
    isPlaying: false,
    // 音频上下文
    audioContext: null
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight
    })

    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext()
    // 使用和 proposal 页面相同的音乐，或者你可以替换为其他音乐URL
    this.audioContext.src = 'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/audio/202603/155318786080137216.mp3'
    this.audioContext.loop = true // 循环播放
    this.audioContext.volume = 0.8

    // 启动走马灯动画
    this.startCarousel()
  },

  onUnload() {
    // 停止走马灯动画
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer)
      this.carouselTimer = null
    }
    // 销毁音频上下文
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
    }
  },

  // 启动走马灯动画
  startCarousel() {
    const photoCount = this.data.photos.length
    const itemWidth = this.data.windowWidth * 0.8 // 每张照片宽度为屏幕80%
    const gap = this.data.windowWidth * 0.1 // 照片之间的间距
    const singleSetWidth = (itemWidth + gap) * photoCount // 一组照片的总宽度

    let offset = 0
    const speed = 0.5 // 每次移动的像素数（降低速度使效果更优雅）

    this.carouselTimer = setInterval(() => {
      offset += speed
      // 当移动完一组照片的宽度时，重置到开始位置（因为有两组相同的照片，所以无缝循环）
      if (offset >= singleSetWidth) {
        offset = 0
      }
      this.setData({
        carouselOffset: -offset
      })
    }, 16) // 约60fps
  },

  // 点击照片
  onPhotoTap(e) {
    // 播放或暂停音乐
    if (!this.data.isPlaying) {
      if (this.audioContext) {
        this.audioContext.play()
        this.setData({ isPlaying: true })
      }
    }
  },

  // 跳转到求婚页
  goToProposal() {
    // 停止音乐播放
    if (this.audioContext && this.data.isPlaying) {
      this.audioContext.stop()
      this.setData({ isPlaying: false })
    }
    
    wx.navigateTo({
      url: '/packageA/pages/proposal/index'
    })
  }
})
