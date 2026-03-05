Page({
  data: {
    windowWidth: 375,
    windowHeight: 667,
    displayedText: '',
    fullText: '遇见你之前，我从没想过未来是什么样子。\n\n遇见你之后，我只想和你过\n一辈子。\n\n不是一时兴起，是深思熟虑。',
    showContinueBtn: false,
    typingComplete: false
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight
    })

    // 延迟开始打字机效果
    setTimeout(() => {
      this.startTyping()
    }, 500)
  },

  // 打字机效果
  startTyping() {
    const fullText = this.data.fullText
    let index = 0
    const typingSpeed = 80 // 每个字符的延迟时间（毫秒）

    const typeChar = () => {
      if (index < fullText.length) {
        // 处理换行符
        if (fullText[index] === '\n') {
          this.setData({
            displayedText: this.data.displayedText + '\n'
          })
        } else {
          this.setData({
            displayedText: this.data.displayedText + fullText[index]
          })
        }
        index++
        setTimeout(typeChar, typingSpeed)
      } else {
        // 打字完成
        this.setData({
          typingComplete: true
        })
        // 延迟显示继续按钮
        setTimeout(() => {
          this.setData({
            showContinueBtn: true
          })
        }, 800)
      }
    }

    typeChar()
  },

  // 跳转到求婚页
  goToProposal() {
    wx.navigateTo({
      url: '/packageA/pages/proposal/index'
    })
  }
})
