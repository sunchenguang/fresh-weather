// 须与云开发控制台当前环境 ID 一致
const CLOUD_ENV_ID = 'cloudbase-3gd9ywmgae795440'

App({
  globalData: {
    nickname: null,
    avatarUrl: null
  },
  onLaunch() {
    if (!wx.cloud) {
      console.warn('[云开发] 当前基础库不支持 wx.cloud，请使用 2.2.3 及以上')
      return
    }
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      traceUser: true
    })
  }
})
