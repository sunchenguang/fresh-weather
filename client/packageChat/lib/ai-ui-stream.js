/**
 * Incremental parser for Vercel AI SDK **data stream** (UIMessage SSE).
 * @see https://github.com/vercel/ai/blob/main/content/docs/04-ai-sdk-ui/50-stream-protocol.mdx
 *
 * 副本：与 client/lib/ai-ui-stream.js 保持一致（分包内无法稳定 require 主包 lib）。
 */

function decodeArrayBuffer(buf) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(buf)
  }
  const bytes = new Uint8Array(buf)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i])
  }
  try {
    return decodeURIComponent(escape(out))
  } catch (e) {
    return out
  }
}

function toolLabel(name) {
  const n = String(name || '')
  if (n === 'web_search') return '联网搜索'
  if (n === 'send_mail') return '发送邮件'
  return n || '工具'
}

function formatJsonValue(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 2)
  } catch (e) {
    return String(v)
  }
}

function formatToolInputPreview(toolName, input) {
  if (input != null && typeof input === 'object' && !Array.isArray(input)) {
    const q = input.query
    if (toolName === 'web_search' && typeof q === 'string' && q) {
      return '「' + q + '」'
    }
  }
  return formatJsonValue(input)
}

function normalizeToolOutput(output) {
  if (typeof output === 'string') return output
  try {
    return JSON.stringify(output, null, 2)
  } catch (e) {
    return String(output)
  }
}

/** @param {string} text */
function parseWebSearchItems(text) {
  const blocks = String(text)
    .split(/\n\n+/)
    .map(function (b) {
      return b.trim()
    })
    .filter(Boolean)
  const items = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const refM = block.match(/^引用:\s*(\d+)/m)
    const ref = refM ? refM[1] : ''
    const titleM = block.match(/标题:\s*(.+)/)
    const title = titleM ? String(titleM[1] || '').trim() : ''
    const urlM = block.match(/URL:\s*(\S+)/)
    const url = urlM ? String(urlM[1] || '').trim() : ''
    const sumM = block.match(/摘要:\s*([\s\S]*?)(?=\n\s*网站名称:|$)/)
    const summary = sumM ? String(sumM[1] || '').trim() : ''
    const siteM = block.match(/网站名称:\s*(.+)/)
    const siteName = siteM ? String(siteM[1] || '').trim() : ''
    const timeM = block.match(/发布时间:\s*(\S+)/)
    const publishedAt = timeM ? String(timeM[1] || '').trim() : ''
    if (title || url || summary || ref) {
      items.push({ ref, title, url, summary, siteName, publishedAt })
    }
  }
  return items
}

function syncToolStatus(state) {
  for (let i = state.parts.length - 1; i >= 0; i--) {
    const p = state.parts[i]
    if (p.type !== 'tool') continue
    if (p.phase === 'input_streaming') {
      state.toolStatus = toolLabel(p.toolName) + '：准备参数…'
      return
    }
    if (p.phase === 'running') {
      state.toolStatus = toolLabel(p.toolName) + '：执行中…'
      return
    }
  }
  state.toolStatus = ''
}

/** @param {ReturnType<typeof createBlockState>} state */
function ensureTextPart(state, id) {
  const sid = String(id)
  let idx = state.textPartIndexById[sid]
  if (idx != null) return state.parts[idx]
  const part = { type: 'text', id: sid, text: '' }
  idx = state.parts.length
  state.parts.push(part)
  state.textPartIndexById[sid] = idx
  return part
}

/** @param {ReturnType<typeof createBlockState>} state */
function ensureReasoningPart(state, id) {
  const sid = String(id)
  let idx = state.reasoningPartIndexById[sid]
  if (idx != null) return state.parts[idx]
  const part = { type: 'reasoning', id: sid, text: '' }
  idx = state.parts.length
  state.parts.push(part)
  state.reasoningPartIndexById[sid] = idx
  return part
}

/** @param {ReturnType<typeof createBlockState>} state */
function ensureToolPart(state, toolCallId, toolName) {
  const cid = String(toolCallId || '_noid')
  let idx = state.toolPartIndexById[cid]
  if (idx != null) {
    const p = state.parts[idx]
    if (toolName) {
      p.toolName = String(toolName)
    }
    return p
  }
  const part = {
    type: 'tool',
    toolCallId: cid,
    toolName: String(toolName || 'tool'),
    phase: 'input_streaming',
    inputRaw: '',
    inputPreview: '',
    outputText: '',
    errorText: '',
    webItems: null
  }
  idx = state.parts.length
  state.parts.push(part)
  state.toolPartIndexById[cid] = idx
  return part
}

function createBlockState() {
  return {
    lineCarry: '',
    parts: [],
    textPartIndexById: {},
    reasoningPartIndexById: {},
    toolPartIndexById: {},
    toolStatus: '',
    errorText: '',
    finished: false
  }
}

/**
 * Apply one SSE `data:` payload string (after the `data: ` prefix).
 * @param {ReturnType<typeof createBlockState>} state
 * @param {string} payload
 */
function applyDataPayload(state, payload) {
  if (!payload || payload === '[DONE]') {
    if (payload === '[DONE]') {
      state.finished = true
    }
    return
  }

  let evt
  try {
    evt = JSON.parse(payload)
  } catch (e) {
    return
  }

  if (!evt || typeof evt !== 'object') {
    return
  }

  const t = evt.type
  if (t === 'error' && evt.errorText) {
    state.errorText = String(evt.errorText)
    return
  }

  if (t === 'text-start' && evt.id) {
    ensureTextPart(state, evt.id)
    syncToolStatus(state)
    return
  }

  if (t === 'text-delta') {
    const id = evt.id != null ? String(evt.id) : '_legacy'
    const delta =
      evt.delta != null ? String(evt.delta) : evt.textDelta != null ? String(evt.textDelta) : ''
    const part = ensureTextPart(state, id)
    part.text += delta
    syncToolStatus(state)
    return
  }

  if (t === 'text-end') {
    return
  }

  if (t === 'reasoning-start' && evt.id) {
    ensureReasoningPart(state, evt.id)
    return
  }

  if (t === 'reasoning-delta' && evt.id) {
    const delta = evt.delta != null ? String(evt.delta) : ''
    const part = ensureReasoningPart(state, evt.id)
    part.text += delta
    return
  }

  if (t === 'reasoning-end') {
    return
  }

  if (t === 'tool-input-start') {
    const name = evt.toolName != null ? String(evt.toolName) : 'tool'
    const part = ensureToolPart(state, evt.toolCallId, name)
    part.phase = 'input_streaming'
    part.inputRaw = ''
    part.inputPreview = ''
    part.outputText = ''
    part.errorText = ''
    part.webItems = null
    syncToolStatus(state)
    return
  }

  if (t === 'tool-input-delta') {
    const part = ensureToolPart(state, evt.toolCallId, evt.toolName)
    const delta = evt.inputTextDelta != null ? String(evt.inputTextDelta) : ''
    part.inputRaw += delta
    part.phase = 'input_streaming'
    syncToolStatus(state)
    return
  }

  if (t === 'tool-input-available') {
    const name = evt.toolName != null ? String(evt.toolName) : 'tool'
    const part = ensureToolPart(state, evt.toolCallId, name)
    part.phase = 'running'
    part.inputPreview = formatToolInputPreview(name, evt.input)
    syncToolStatus(state)
    return
  }

  if (t === 'tool-output-available') {
    const part = ensureToolPart(state, evt.toolCallId, evt.toolName)
    part.phase = 'done'
    const out = evt.output
    const asText = normalizeToolOutput(out)
    part.outputText = asText
    part.errorText = ''
    if (part.toolName === 'web_search' && typeof out === 'string') {
      const items = parseWebSearchItems(out)
      part.webItems = items.length > 0 ? items : null
    } else {
      part.webItems = null
    }
    syncToolStatus(state)
    return
  }

  if (t === 'tool-output-error') {
    const part = ensureToolPart(state, evt.toolCallId, evt.toolName)
    part.phase = 'error'
    part.errorText =
      evt.errorText != null
        ? String(evt.errorText)
        : evt.errorMessage != null
          ? String(evt.errorMessage)
          : '工具执行失败'
    syncToolStatus(state)
    return
  }

  if (t === 'finish') {
    state.finished = true
    state.toolStatus = ''
    return
  }

  if (t === 'abort' && evt.reason) {
    state.errorText = String(evt.reason)
    state.finished = true
    return
  }
}

/**
 * Append decoded HTTP chunk text and extract complete SSE `data:` lines.
 * @param {ReturnType<typeof createBlockState>} state
 * @param {string} chunkText
 * @returns {void}
 */
function feedTextChunk(state, chunkText) {
  const text = state.lineCarry + chunkText
  const lines = text.split('\n')
  state.lineCarry = lines.pop() || ''

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith(':')) {
      continue
    }
    if (trimmed.indexOf('data:') !== 0) {
      continue
    }
    const payload = trimmed.slice('data:'.length).replace(/^\s/, '')
    applyDataPayload(state, payload)
  }
}

function getAssistantDisplayText(state) {
  let out = ''
  for (let i = 0; i < state.parts.length; i++) {
    const p = state.parts[i]
    if (p.type === 'text' && p.text) {
      out += p.text
    }
  }
  return out
}

/** Plain objects for小程序 setData */
function getAssistantParts(state) {
  const res = []
  for (let i = 0; i < state.parts.length; i++) {
    const p = state.parts[i]
    if (p.type === 'text') {
      res.push({ key: 'text-' + p.id, type: 'text', id: p.id, text: p.text })
      continue
    }
    if (p.type === 'reasoning') {
      res.push({ key: 'reasoning-' + p.id, type: 'reasoning', id: p.id, text: p.text })
      continue
    }
    if (p.type === 'tool') {
      const o = {
        key: 'tool-' + p.toolCallId,
        type: 'tool',
        toolCallId: p.toolCallId,
        toolName: p.toolName,
        toolLabel: toolLabel(p.toolName),
        phase: p.phase,
        inputPreview: p.inputPreview || '',
        outputText: p.outputText || '',
        errorText: p.errorText || '',
        webItems: p.webItems || null
      }
      res.push(o)
    }
  }
  return res
}

module.exports = {
  decodeArrayBuffer,
  createBlockState,
  feedTextChunk,
  getAssistantDisplayText,
  getAssistantParts,
  applyDataPayload
}
