const config = require('../../config.js')
const {
  decodeArrayBuffer,
  createBlockState,
  feedTextChunk,
  getAssistantDisplayText
} = require('../../lib/ai-ui-stream.js')

function genId() {
  return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9)
}

function toUiMessages(rows) {
  return rows.map(function (m) {
    return {
      id: m.id,
      role: m.role === 'user' ? 'user' : 'assistant',
      parts: [{ type: 'text', text: m.text || '' }]
    }
  })
}

Page({
  data: {
    statusBarPx: 24,
    safeBottomPx: 0,
    scrollHeightPx: 400,
    scrollIntoView: '',
    messages: [],
    inputValue: '',
    canSend: false,
    streaming: false
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const winH = sys.windowHeight || 667
    const statusBar = sys.statusBarHeight || 24
    const safeBottom = sys.safeArea ? Math.max(0, winH - sys.safeArea.bottom) : 0
    const navPx = Math.round((88 * (sys.windowWidth || 375)) / 750)
    const composerPx = Math.round((16 * 2 + 72) * ((sys.windowWidth || 375) / 750)) + safeBottom
    const scrollHeightPx = Math.max(200, Math.round(winH - statusBar - navPx - composerPx))
    this.setData({
      statusBarPx: statusBar,
      safeBottomPx: safeBottom,
      scrollHeightPx
    })
    this._flushTimer = null
    this._requestTask = null
    this._streamState = null
    this._streamAssistantIndex = -1
  },

  onUnload() {
    this._abortActiveRequest()
    if (this._flushTimer != null) {
      clearTimeout(this._flushTimer)
      this._flushTimer = null
    }
  },

  _abortActiveRequest() {
    if (this._requestTask && typeof this._requestTask.abort === 'function') {
      try {
        this._requestTask.abort()
      } catch (e) {}
    }
    this._requestTask = null
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/weather/index' })
    }
  },

  onInput(e) {
    const v = e.detail.value || ''
    const canSend = v.replace(/^\s+|\s+$/g, '').length > 0
    this.setData({
      inputValue: v,
      canSend
    })
  },

  onSend() {
    if (this.data.streaming) {
      return
    }
    if (!wx.canIUse('request.enableChunked')) {
      wx.showModal({
        title: '不支持流式请求',
        content: '请升级微信客户端或提高调试基础库版本（需支持 request.enableChunked / onChunkReceived）。',
        showCancel: false
      })
      return
    }
    const base = (config.AI_CHAT_BASE_URL || '').replace(/\/+$/, '')
    if (!base) {
      wx.showModal({
        title: '未配置接口',
        content: '请在 client/config.js 中填写 AI_CHAT_BASE_URL（agui-backend 的 HTTPS 根地址），并在微信公众平台配置 request 合法域名。',
        showCancel: false
      })
      return
    }
    const text = (this.data.inputValue || '').replace(/^\s+|\s+$/g, '')
    if (!text) {
      return
    }

    const userMsg = {
      id: genId(),
      role: 'user',
      text,
      toolStatus: '',
      streaming: false
    }
    const asstMsg = {
      id: genId(),
      role: 'assistant',
      text: '',
      toolStatus: '',
      streaming: true
    }
    const history = this.data.messages.filter(function (m) {
      return !m.streaming
    })
    const forApi = history.concat([userMsg])
    const nextList = history.concat([userMsg, asstMsg])
    const assistantIndex = nextList.length - 1

    this._abortActiveRequest()
    this._streamState = createBlockState()
    this._streamAssistantIndex = assistantIndex
    this.setData({
      messages: nextList,
      inputValue: '',
      canSend: false,
      streaming: true,
      scrollIntoView: 'anchor-' + asstMsg.id
    })

    const url = base + '/ai/chat'
    const payload = { messages: toUiMessages(forApi) }
    const page = this

    const task = wx.request({
      url,
      method: 'POST',
      enableChunked: true,
      timeout: 120000,
      header: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      data: payload,
      success: function (res) {
        page._onStreamHttpDone(res)
      },
      fail: function () {
        page._onStreamFailure('网络请求失败')
      }
    })

    this._requestTask = task

    if (!task || typeof task.onChunkReceived !== 'function') {
      this._onStreamFailure('不支持 onChunkReceived')
      if (task && typeof task.abort === 'function') {
        task.abort()
      }
      return
    }

    task.onChunkReceived(function (recv) {
      const chunk = recv.data
      if (!chunk) {
        return
      }
      const textChunk = decodeArrayBuffer(chunk)
      feedTextChunk(page._streamState, textChunk)
      page._scheduleStreamFlush()
    })
  },

  _scheduleStreamFlush() {
    const self = this
    if (self._flushTimer != null) {
      return
    }
    self._flushTimer = setTimeout(function () {
      self._flushTimer = null
      self._flushStreamToUi(false)
    }, 72)
  },

  _flushStreamToUi(isFinal) {
    const state = this._streamState
    const idx = this._streamAssistantIndex
    if (!state || idx < 0 || !this.data.messages[idx]) {
      return
    }
    const msg = this.data.messages[idx]
    const text = getAssistantDisplayText(state)
    const toolStatus = state.toolStatus || ''
    const anchor = 'anchor-' + msg.id
    const patch = {}
    patch['messages[' + idx + '].text'] = text
    patch['messages[' + idx + '].toolStatus'] = toolStatus
    if (!isFinal) {
      patch.scrollIntoView = anchor
    }
    this.setData(patch)
  },

  _onStreamHttpDone(res) {
    var self = this
    if (self._streamState) {
      feedTextChunk(self._streamState, '\n')
      if (self._streamState.errorText) {
        wx.showToast({
          title: self._streamState.errorText.slice(0, 18),
          icon: 'none',
          duration: 2600
        })
      }
      self._flushStreamToUi(true)
      self._streamState.finished = true
    }
    const idx = self._streamAssistantIndex
    if (idx >= 0 && self.data.messages[idx]) {
      const patch = {}
      patch['messages[' + idx + '].streaming'] = false
      patch['messages[' + idx + '].toolStatus'] = ''
      patch.streaming = false
      self.setData(patch)
    } else {
      self.setData({ streaming: false })
    }
    self._requestTask = null
    self._streamState = null
    self._streamAssistantIndex = -1

    if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
      wx.showToast({
        title: '服务错误 ' + res.statusCode,
        icon: 'none'
      })
    }
  },

  _onStreamFailure(hint) {
    var self = this
    var idx = self._streamAssistantIndex
    if (idx >= 0 && self.data.messages[idx]) {
      var patch = {}
      var cur = self.data.messages[idx].text || ''
      if (!cur && hint) {
        patch['messages[' + idx + '].text'] = '（' + hint + '）'
      }
      patch['messages[' + idx + '].streaming'] = false
      patch['messages[' + idx + '].toolStatus'] = ''
      patch.streaming = false
      self.setData(patch)
    } else {
      self.setData({ streaming: false })
    }
    self._requestTask = null
    self._streamState = null
    self._streamAssistantIndex = -1
    if (hint) {
      wx.showToast({ title: hint, icon: 'none' })
    }
  }
})
