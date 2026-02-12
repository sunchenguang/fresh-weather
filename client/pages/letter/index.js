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

    // 初始化粒子背景
    this.initParticles()
    
    // 初始化音乐播放器
    this.initMusic()
    
    // 初始化滚动监听
    this.initScrollObserver()
  },

  onUnload() {
    // 清理资源
    if (this.particlesAnimationId) {
      clearTimeout(this.particlesAnimationId)
    }
    if (this.fireworksAnimationId) {
      clearTimeout(this.fireworksAnimationId)
    }
    if (this.audioContext) {
      this.audioContext.destroy()
    }
  },

  // 初始化音乐播放器
  initMusic() {
    this.audioContext = wx.createInnerAudioContext()
    // 小程序中资源路径：如果小程序根目录是 client，使用 /assets/music/bgm.mp3
    // 如果使用相对路径，从 pages/letter 到 assets/music 是 ../../assets/music/bgm.mp3
    // 先尝试绝对路径（小程序根目录下的路径）
    this.audioContext.src = '/assets/music/bgm.mp3'
    this.audioContext.loop = true
    this.audioContext.onPlay(() => {
      this.setData({ isPlaying: true })
    })
    this.audioContext.onPause(() => {
      this.setData({ isPlaying: false })
    })
    this.audioContext.onError((err) => {
      console.error('音频播放失败:', err)
      // 如果绝对路径失败，尝试相对路径
      if (err.errMsg && err.errMsg.indexOf('no such file') > -1) {
        console.log('尝试使用相对路径...')
        this.audioContext.src = '../../assets/music/bgm.mp3'
      }
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

  // 初始化粒子背景
  initParticles() {
    const systemInfo = wx.getSystemInfoSync()
    const dpr = systemInfo.pixelRatio || 1
    
    this.particlesCtx = wx.createCanvasContext('particles-canvas', this)
    this.particlesCanvasWidth = systemInfo.windowWidth
    this.particlesCanvasHeight = systemInfo.windowHeight
    this.particles = []
    this.particleCount = 50

    // 创建粒子
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle())
    }

    this.animateParticles()
  },

  // 创建粒子
  createParticle() {
    return {
      x: Math.random() * this.particlesCanvasWidth,
      y: Math.random() * this.particlesCanvasHeight,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2
    }
  },

  // 动画粒子
  animateParticles() {
    if (!this.particlesCtx) return

    this.particlesCtx.clearRect(0, 0, this.particlesCanvasWidth, this.particlesCanvasHeight)

    this.particles.forEach(particle => {
      particle.x += particle.speedX
      particle.y += particle.speedY

      if (particle.x > this.particlesCanvasWidth || particle.x < 0) particle.speedX *= -1
      if (particle.y > this.particlesCanvasHeight || particle.y < 0) particle.speedY *= -1

      this.particlesCtx.setFillStyle(`rgba(255, 107, 157, ${particle.opacity})`)
      this.particlesCtx.beginPath()
      this.particlesCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.particlesCtx.fill()
    })

    // 连接附近的粒子
    this.particles.forEach((particle, i) => {
      this.particles.slice(i + 1).forEach(otherParticle => {
        const dx = particle.x - otherParticle.x
        const dy = particle.y - otherParticle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 150) {
          this.particlesCtx.setStrokeStyle(`rgba(255, 107, 157, ${0.2 * (1 - distance / 150)})`)
          this.particlesCtx.setLineWidth(0.5)
          this.particlesCtx.beginPath()
          this.particlesCtx.moveTo(particle.x, particle.y)
          this.particlesCtx.lineTo(otherParticle.x, otherParticle.y)
          this.particlesCtx.stroke()
        }
      })
    })

    this.particlesCtx.draw()
    this.particlesAnimationId = setTimeout(() => this.animateParticles(), 16)
  },

  // 初始化滚动监听
  initScrollObserver() {
    // 小程序中需要使用scroll事件来检测滚动
    // 在onScroll中处理可见性
  },

  // 滚动事件处理
  onScroll(e) {
    const scrollTop = e.detail.scrollTop
    const sectionHeight = 400 // 每个section大约的高度（px）
    const visibleIndex = Math.floor(scrollTop / sectionHeight)

    const visibleSections = []
    for (let i = 0; i <= visibleIndex && i < 9; i++) {
      visibleSections[i] = true
    }

    this.setData({ visibleSections })

    // 检测是否滚动到最后
    if (visibleIndex >= 7 && !this.hasTriggeredFireworks) {
      this.hasTriggeredFireworks = true
      setTimeout(() => {
        this.startFireworks()
      }, 1000)
    }
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

  // 初始化烟花
  initFireworks() {
    const systemInfo = wx.getSystemInfoSync()
    this.fireworksCtx = wx.createCanvasContext('fireworks-canvas', this)
    this.fireworksCanvasWidth = systemInfo.windowWidth
    this.fireworksCanvasHeight = systemInfo.windowHeight
    this.fireworks = []
  },

  // 开始烟花效果
  startFireworks() {
    if (!this.fireworksCtx) {
      this.initFireworks()
      setTimeout(() => this.startFireworks(), 100)
      return
    }

    this.isFireworksActive = true
    this.fireworks = []

    const positions = [
      { x: this.fireworksCanvasWidth * 0.2, y: this.fireworksCanvasHeight * 0.3 },
      { x: this.fireworksCanvasWidth * 0.5, y: this.fireworksCanvasHeight * 0.4 },
      { x: this.fireworksCanvasWidth * 0.8, y: this.fireworksCanvasHeight * 0.3 },
      { x: this.fireworksCanvasWidth * 0.3, y: this.fireworksCanvasHeight * 0.5 },
      { x: this.fireworksCanvasWidth * 0.7, y: this.fireworksCanvasHeight * 0.5 },
      { x: this.fireworksCanvasWidth * 0.4, y: this.fireworksCanvasHeight * 0.6 },
      { x: this.fireworksCanvasWidth * 0.6, y: this.fireworksCanvasHeight * 0.6 },
    ]

    positions.forEach((pos, index) => {
      setTimeout(() => {
        this.createFirework(pos.x, pos.y)
      }, index * 300)
    })

    setTimeout(() => {
      const secondRound = [
        { x: this.fireworksCanvasWidth * 0.25, y: this.fireworksCanvasHeight * 0.35 },
        { x: this.fireworksCanvasWidth * 0.75, y: this.fireworksCanvasHeight * 0.35 },
        { x: this.fireworksCanvasWidth * 0.5, y: this.fireworksCanvasHeight * 0.45 },
      ]
      secondRound.forEach((pos, index) => {
        setTimeout(() => {
          this.createFirework(pos.x, pos.y)
        }, index * 400)
      })
    }, 3000)

    setTimeout(() => {
      const thirdRound = [
        { x: this.fireworksCanvasWidth * 0.15, y: this.fireworksCanvasHeight * 0.4 },
        { x: this.fireworksCanvasWidth * 0.85, y: this.fireworksCanvasHeight * 0.4 },
        { x: this.fireworksCanvasWidth * 0.5, y: this.fireworksCanvasHeight * 0.35 },
      ]
      thirdRound.forEach((pos, index) => {
        setTimeout(() => {
          this.createFirework(pos.x, pos.y)
        }, index * 350)
      })
    }, 6000)

    if (!this.fireworksAnimationId) {
      this.animateFireworks()
    }
  },

  // 创建烟花
  createFirework(x, y) {
    const colors = [
      '#ff6b9d', '#ff9ff3', '#ffb3d9', '#ff6b9d',
      '#ffd700', '#ff8c00', '#ff69b4', '#ff1493',
      '#ff6347', '#ffa500', '#ff69b4', '#ff1493'
    ]

    const particles = []
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = Math.random() * 5 + 2
      const color = colors[Math.floor(Math.random() * colors.length)]

      particles.push({
        x,
        y,
        color,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.1,
        friction: 0.98,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.01,
        size: Math.random() * 3 + 1
      })
    }

    this.fireworks.push({ particles })
  },

  // 动画烟花
  animateFireworks() {
    if (!this.fireworksCtx) return

    this.fireworksCtx.clearRect(0, 0, this.fireworksCanvasWidth, this.fireworksCanvasHeight)

    this.fireworks = this.fireworks.filter(firework => {
      firework.particles = firework.particles.filter(particle => {
        particle.vy += particle.gravity
        particle.vx *= particle.friction
        particle.vy *= particle.friction
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= particle.decay

        if (particle.life > 0) {
          const alpha = particle.life
          this.fireworksCtx.setGlobalAlpha(alpha)
          this.fireworksCtx.setFillStyle(particle.color)
          this.fireworksCtx.beginPath()
          this.fireworksCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          this.fireworksCtx.fill()

          // 简化光晕效果
          this.fireworksCtx.setFillStyle(particle.color)
          this.fireworksCtx.setGlobalAlpha(alpha * 0.3)
          this.fireworksCtx.beginPath()
          this.fireworksCtx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
          this.fireworksCtx.fill()
          this.fireworksCtx.setGlobalAlpha(1)
        }

        return particle.life > 0
      })
      return firework.particles.length > 0
    })

    this.fireworksCtx.draw()

    if (this.fireworks.length > 0 || this.isFireworksActive) {
      this.fireworksAnimationId = setTimeout(() => this.animateFireworks(), 16)
    } else {
      this.isFireworksActive = false
    }
  }
})
