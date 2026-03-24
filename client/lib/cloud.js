/**
 * 调用云函数 hello。
 * - 不传 query：连通性测试（与部署校验）。
 * - 传 { query: '...' }：走 AI 对话，返回 result.answer（需在云函数环境变量配置 OPENAI_API_KEY）。
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
