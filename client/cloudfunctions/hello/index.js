const path = require('path')
// 与参考项目 .env 一致：在 hello 目录下放 .env，本地/模拟器自动注入 process.env（勿提交 .env）
require('dotenv').config({ path: path.join(__dirname, '.env') })

const cloud = require('wx-server-sdk')
const https = require('https')
const http = require('http')
const { URL } = require('url')

// 与小程序 wx.cloud.init 使用同一环境 ID
const CLOUD_ENV_ID = 'cloudbase-3gd9ywmgae795440'

cloud.init({
  env: CLOUD_ENV_ID
})

function postJson(urlString, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString)
    const lib = url.protocol === 'https:' ? https : http
    const data = JSON.stringify(body)
    const port = url.port || (url.protocol === 'https:' ? 443 : 80)
    const req = lib.request(
      {
        hostname: url.hostname,
        port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data, 'utf8'),
          ...headers
        }
      },
      (res) => {
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 500)}`))
            return
          }
          try {
            resolve(JSON.parse(raw))
          } catch (e) {
            reject(new Error(`Invalid JSON: ${raw.slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function chatCompletionsUrl() {
  let base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  base = base.replace(/\/+$/, '')
  return `${base}/chat/completions`
}

/**
 * 与 cron-job-tool 中 GET /ai/chat?query= 语义一致：入参用户问题，返回模型文本。
 * 需在云函数环境变量中配置 OPENAI_API_KEY；可选 OPENAI_BASE_URL、MODEL_NAME。
 */
async function runChat(query) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('云函数未配置环境变量 OPENAI_API_KEY')
  }
  const model = process.env.MODEL_NAME || 'gpt-4o-mini'
  const url = chatCompletionsUrl()
  const payload = {
    model,
    messages: [
      {
        role: 'system',
        content:
          process.env.CHAT_SYSTEM_PROMPT ||
          '你是一个简洁、有帮助的中文助手，优先用中文回答。'
      },
      { role: 'user', content: query }
    ],
    temperature: Number(process.env.CHAT_TEMPERATURE) || 0.7
  }
  const json = await postJson(url, { Authorization: `Bearer ${apiKey}` }, payload)
  const choice = json.choices && json.choices[0]
  const msg = choice && choice.message
  let content = ''
  if (msg && typeof msg.content === 'string') {
    content = msg.content
  } else if (Array.isArray(msg && msg.content)) {
    content = (msg.content || [])
      .map((p) => (typeof p === 'object' && p.text ? p.text : ''))
      .join('')
  }
  if (!content) {
    throw new Error('模型返回为空')
  }
  return content
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()

  const query =
    typeof event.query === 'string'
      ? event.query.trim()
      : event.query != null
        ? String(event.query).trim()
        : ''

  if (!query) {
    return {
      ok: true,
      message: '云函数 hello 已连通',
      echo: event,
      openid: wxContext.OPENID || null
    }
  }

  try {
    const answer = await runChat(query)
    return {
      ok: true,
      answer,
      openid: wxContext.OPENID || null
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message || String(err),
      openid: wxContext.OPENID || null
    }
  }
}
