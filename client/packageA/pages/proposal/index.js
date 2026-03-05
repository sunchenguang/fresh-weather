Page({
  data: {
    windowWidth: 375,
    windowHeight: 667,
    hearts: [],
    fireworks: [],
    showSuccessModal: false,
    noBtnPosition: {
      left: '50%',
      top: '75%'
    },
    noBtnMoving: false,
    showNoBtn: true
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      noBtnPosition: {
        left: '50%',
        top: '75%'
      }
    })

    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = 'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/audio/202603/155311901063012352.mp3'
    this.audioContext.loop = false // 不循环播放

    // 启动爱心飘落效果
    this.startHeartsAnimation()
  },

  onUnload() {
    // 清理定时器
    if (this.heartTimer) {
      clearInterval(this.heartTimer)
      this.heartTimer = null
    }
    if (this.fireworkTimer) {
      clearInterval(this.fireworkTimer)
      this.fireworkTimer = null
    }
    // 销毁音频上下文
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
  },

  // 启动爱心飘落动画
  startHeartsAnimation() {
    // 持续创建爱心
    this.heartTimer = setInterval(() => {
      this.createHeart()
    }, 1000) // 每1秒创建一个爱心

    // 初始创建一些爱心
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.createHeart()
      }, i * 300)
    }
  },

  // 创建单个爱心
  createHeart() {
    const heartEmojis = ['💖', '❤️', '💕', '💗', '💓', '💝', '💞']
    const heart = {
      emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
      x: Math.random() * this.data.windowWidth,
      y: -50,
      rotation: Math.random() * 360,
      delay: Math.random() * 2,
      id: Date.now() + Math.random()
    }
    
    const currentHearts = [...this.data.hearts, heart]
    this.setData({ hearts: currentHearts })

    // 8秒后移除爱心
    setTimeout(() => {
      const updatedHearts = this.data.hearts.filter(h => h.id !== heart.id)
      this.setData({ hearts: updatedHearts })
    }, 8000)
  },

  // 愿意按钮点击
  onYesClick() {
    // 播放音乐
    if (this.audioContext) {
      this.audioContext.stop() // 先停止之前的播放
      this.audioContext.play()
    }
    
    // 隐藏不愿意按钮
    this.setData({ showNoBtn: false })
    
    // 创建大量烟花和爱心
    this.createFireworks()
    
    // 显示成功弹窗
    setTimeout(() => {
      this.setData({ showSuccessModal: true })
    }, 500)
  },

  // 创建烟花效果
  createFireworks() {
    // 创建多个烟花
    // 创建大量爱心
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        this.createHeart()
      }, i * 50)
    }

    // 持续创建烟花爱心
    this.fireworkTimer = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.createHeart()
        }, i * 100)
      }
    }, 200)

    // 10秒后停止烟花
    setTimeout(() => {
      if (this.fireworkTimer) {
        clearInterval(this.fireworkTimer)
        this.fireworkTimer = null
      }
    }, 10000)
  },

  // 不愿意按钮点击 - 逃跑效果
  onNoClick(e) {
    if (this.data.noBtnMoving) return
    
    this.setData({ noBtnMoving: true })
    
    // 随机生成新位置（避开屏幕边缘，按钮宽度约300rpx=150px，高度约80rpx=40px）
    // 使用rpx转px：1rpx = windowWidth/750
    const rpxToPx = this.data.windowWidth / 750
    const btnWidth = 300 * rpxToPx
    const btnHeight = 80 * rpxToPx
    const padding = 50 * rpxToPx // 边距
    
    const maxLeft = this.data.windowWidth - btnWidth - padding
    const maxTop = this.data.windowHeight - btnHeight - padding
    
    const newLeft = Math.random() * (maxLeft - padding) + padding
    const newTop = Math.random() * (maxTop - padding) + padding
    
    // 转换为百分比
    const leftPercent = (newLeft / this.data.windowWidth) * 100
    const topPercent = (newTop / this.data.windowHeight) * 100
    
    this.setData({
      noBtnPosition: {
        left: leftPercent + '%',
        top: topPercent + '%'
      }
    })
    
    // 300ms后可以再次移动
    setTimeout(() => {
      this.setData({ noBtnMoving: false })
    }, 300)
  },

  // 关闭成功弹窗
  closeModal() {
    this.setData({ showSuccessModal: false })
  }
})
