/**
 * Incremental parser for Vercel AI SDK **data stream** (UIMessage SSE).
 * @see https://github.com/vercel/ai/blob/main/content/docs/04-ai-sdk-ui/50-stream-protocol.mdx
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

function createBlockState() {
  return {
    lineCarry: '',
    blockOrder: [],
    blocks: {},
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
    const id = String(evt.id)
    if (!state.blocks[id]) {
      state.blocks[id] = ''
      state.blockOrder.push(id)
    }
    return
  }

  if (t === 'text-delta') {
    const id = evt.id != null ? String(evt.id) : '_legacy'
    const delta = evt.delta != null ? String(evt.delta) : evt.textDelta != null ? String(evt.textDelta) : ''
    if (!state.blocks[id]) {
      state.blocks[id] = ''
      state.blockOrder.push(id)
    }
    state.blocks[id] += delta
    return
  }

  if (t === 'text-end') {
    return
  }

  if (t === 'tool-input-start' && evt.toolName) {
    state.toolStatus = '调用：' + String(evt.toolName) + '…'
    return
  }

  if (t === 'tool-input-available' && evt.toolName) {
    state.toolStatus = '执行：' + String(evt.toolName) + '…'
    return
  }

  if (t === 'tool-output-available') {
    state.toolStatus = ''
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
  const parts = []
  for (let i = 0; i < state.blockOrder.length; i++) {
    const id = state.blockOrder[i]
    const s = state.blocks[id]
    if (s) {
      parts.push(s)
    }
  }
  return parts.join('')
}

module.exports = {
  decodeArrayBuffer,
  createBlockState,
  feedTextChunk,
  getAssistantDisplayText,
  applyDataPayload
}
