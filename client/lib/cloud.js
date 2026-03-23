/**
 * 调用云函数 hello，用于验证云开发是否配置成功。
 * 需在开发者工具中创建云环境、上传并部署该云函数。
 */
export function callHello(data = {}) {
  if (!wx.cloud) {
    return Promise.reject(new Error('当前基础库不支持云能力，请使用 2.2.3+'))
  }
  return wx.cloud.callFunction({
    name: 'hello',
    data
  })
}
