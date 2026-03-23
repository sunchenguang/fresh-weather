const cloud = require('wx-server-sdk')

// 与小程序 wx.cloud.init 使用同一环境 ID
const CLOUD_ENV_ID = 'cloudbase-3gd9ywmgae795440'

cloud.init({
  env: CLOUD_ENV_ID
})

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  return {
    ok: true,
    message: '云函数 hello 已连通',
    echo: event,
    openid: wxContext.OPENID || null
  }
}
