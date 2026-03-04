Page({
  data: {
    isPlaying: false,
    visibleSections: [],
    hearts: [],
    windowWidth: 375,
    windowHeight: 667
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight
    })

    // 初始化音乐播放器
    this.initMusic()
    
    // 初始化滚动监听
    this.initScrollObserver()
    
    // 初始化节流相关变量
    this.scrollTimer = null
    this.lastScrollTop = 0
    this.lastVisibleIndex = -1
  },

  onUnload() {
    // 清理资源
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
    
    // 清理定时器
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
      this.scrollTimer = null
    }
  },

  // 初始化音乐播放器
  initMusic() {
    this.audioContext = wx.createInnerAudioContext()
    // 使用远程URL加载音频
    this.audioContext.src = 'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/audio/202603/154946083565363200.mp3'
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
    // 使用 page 的原生滚动，通过 onPageScroll 监听
  },

  // 页面滚动事件处理（使用节流优化性能）
  onPageScroll(e) {
    const scrollTop = e.scrollTop || 0
    
    // 清除之前的定时器
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
    }
    
    // 保存滚动位置
    this.lastScrollTop = scrollTop
    
    // 使用节流，每 150ms 执行一次更新逻辑
    this.scrollTimer = setTimeout(() => {
      this.updateScrollState(scrollTop)
    }, 150)
  },
  
  // 更新滚动状态（节流后的逻辑）
  updateScrollState(scrollTop) {
    // 计算可见的 section（增加阈值，减少更新频率）
    const sectionHeight = 400 // 每个section大约的高度（px）
    const visibleIndex = Math.floor(scrollTop / sectionHeight)
    
    // 只在可见索引改变时更新（增加阈值判断）
    if (visibleIndex !== this.lastVisibleIndex && visibleIndex >= 0 && Math.abs(visibleIndex - this.lastVisibleIndex) >= 1) {
      // 只更新变化的部分，减少 setData 的数据量
      const updateData = {}
      let hasChange = false
      
      // 只更新当前可见的 section，避免一次性更新太多
      const maxIndex = Math.min(visibleIndex + 1, 9) // 预加载下一个
      
      for (let i = 0; i < maxIndex; i++) {
        const shouldVisible = i <= visibleIndex
        const currentVisible = this.data.visibleSections[i] || false
        
        if (shouldVisible !== currentVisible) {
          updateData[`visibleSections[${i}]`] = shouldVisible
          hasChange = true
        }
      }
      
      if (hasChange) {
        this.setData(updateData)
      }
      
      this.lastVisibleIndex = visibleIndex
    }
  },

  // 向下滚动
  scrollDown() {
    // 获取当前滚动位置，向下滚动一个屏幕高度
    const systemInfo = wx.getSystemInfoSync()
    const scrollDistance = systemInfo.windowHeight * 0.8 // 滚动80%的屏幕高度
    const currentScrollTop = this.lastScrollTop || 0
    const newScrollTop = currentScrollTop + scrollDistance
    
    // 使用 wx.pageScrollTo 进行滚动
    wx.pageScrollTo({
      scrollTop: newScrollTop,
      duration: 300
    })
    
    this.lastScrollTop = newScrollTop
    
    // 更新滚动状态
    setTimeout(() => {
      this.updateScrollState(newScrollTop)
    }, 350)
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
