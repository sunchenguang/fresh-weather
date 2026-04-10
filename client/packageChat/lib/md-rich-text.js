/**
 * 轻量 Markdown → 微信小程序 rich-text nodes（array）。
 * 流式场景下 streaming=true：未闭合的 ** / ` 按纯文本展示，避免半段加粗乱跳。
 */

function mergeAdjacentText(nodes) {
  const out = []
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (n.type === 'text' && out.length && out[out.length - 1].type === 'text') {
      out[out.length - 1].text += n.text
    } else {
      out.push(n)
    }
  }
  return out
}

var _inlineDepth = 0
var MAX_INLINE_DEPTH = 24

function parseInline(s, streaming) {
  if (!s) {
    return []
  }
  if (_inlineDepth >= MAX_INLINE_DEPTH) {
    return [{ type: 'text', text: s }]
  }
  _inlineDepth++
  const parts = []
  var i = 0
  var len = s.length
  try {
    while (i < len) {
      var tick = s.indexOf('`', i)
      var bold = s.indexOf('**', i)
      var takeCode = tick !== -1 && (bold === -1 || tick < bold)
      if (takeCode) {
        if (tick > i) {
          parts.push({ type: 'text', text: s.slice(i, tick) })
        }
        var endTick = s.indexOf('`', tick + 1)
        if (endTick === -1) {
          parts.push({ type: 'text', text: s.slice(tick) })
          break
        }
        var codeInner = s.slice(tick + 1, endTick)
        parts.push({
          name: 'span',
          attrs: {
            style:
              'font-family:monospace;background:#f3f4f6;padding:2rpx 6rpx;border-radius:4rpx;font-size:26rpx;color:#1f2937;'
          },
          children: [{ type: 'text', text: codeInner }]
        })
        i = endTick + 1
        continue
      }
      if (bold !== -1) {
        if (bold > i) {
          parts.push({ type: 'text', text: s.slice(i, bold) })
        }
        var endBold = s.indexOf('**', bold + 2)
        if (endBold === -1) {
          parts.push({ type: 'text', text: s.slice(bold) })
          break
        }
        var inner = s.slice(bold + 2, endBold)
        var innerNodes = parseInline(inner, streaming)
        parts.push({
          name: 'strong',
          attrs: { style: 'font-weight:700;' },
          children: innerNodes.length ? innerNodes : [{ type: 'text', text: '' }]
        })
        i = endBold + 2
        continue
      }
      parts.push({ type: 'text', text: s.slice(i) })
      break
    }
    return mergeAdjacentText(parts)
  } finally {
    _inlineDepth--
  }
}

function flushList(buffer, root, streamingFlag) {
  if (!buffer || !buffer.length) {
    return
  }
  var listChildren = []
  for (var j = 0; j < buffer.length; j++) {
    listChildren.push({
      name: 'div',
      attrs: { style: 'margin:4rpx 0;padding-left:24rpx;position:relative;font-size:30rpx;line-height:1.55;color:#111;' },
      children: [{ type: 'text', text: '• ' }].concat(parseInline(buffer[j], streamingFlag))
    })
  }
  root.push({
    name: 'div',
    attrs: { style: 'margin:8rpx 0;' },
    children: listChildren
  })
  buffer.length = 0
}

/**
 * @param {string} md
 * @param {boolean} streaming
 * @returns {object[]|null} rich-text nodes 或 null 表示用纯 text 兜底
 */
function markdownToRichTextNodes(md, streaming) {
  if (md == null || md === '') {
    return null
  }
  if (md.length > 120000) {
    return null
  }
  _inlineDepth = 0
  var text = String(md).replace(/\r\n/g, '\n')
  var lines = text.split('\n')
  var root = []
  var i = 0
  var listBuf = []
  var streamingFlag = !!streaming

  while (i < lines.length) {
    var line = lines[i]
    var trimmed = line.trim()

    if (!trimmed) {
      flushList(listBuf, root, streamingFlag)
      i++
      continue
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      flushList(listBuf, root, streamingFlag)
      var m = /^#+/.exec(trimmed)
      var level = m ? m[0].length : 1
      var content = trimmed.replace(/^#{1,6}\s*/, '')
      var fs = Math.max(26, 44 - level * 4)
      root.push({
        name: 'div',
        attrs: {
          style:
            'font-weight:700;font-size:' +
            fs +
            'rpx;line-height:1.4;margin:14rpx 0 8rpx;color:#111;'
        },
        children: parseInline(content, streamingFlag)
      })
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
      flushList(listBuf, root, streamingFlag)
      root.push({
        name: 'div',
        attrs: { style: 'height:2rpx;background:#e5e7eb;margin:16rpx 0;width:100%;' },
        children: [{ type: 'text', text: ' ' }]
      })
      i++
      continue
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      listBuf.push(trimmed.replace(/^[-*+]\s+/, ''))
      i++
      continue
    }

    flushList(listBuf, root, streamingFlag)
    var para = trimmed
    i++
    while (i < lines.length) {
      var t2 = lines[i].trim()
      if (!t2) {
        break
      }
      if (
        /^#{1,6}\s/.test(t2) ||
        /^[-*+]\s+/.test(t2) ||
        /^(-{3,}|\*{3,}|_{3,})\s*$/.test(t2)
      ) {
        break
      }
      para += ' ' + t2
      i++
    }
    root.push({
      name: 'div',
      attrs: { style: 'font-size:30rpx;line-height:1.55;margin:6rpx 0;color:#111;' },
      children: parseInline(para, streamingFlag)
    })
  }
  flushList(listBuf, root, streamingFlag)

  if (!root.length) {
    return null
  }
  return [
    {
      name: 'div',
      attrs: { style: 'overflow:hidden;' },
      children: root
    }
  ]
}

module.exports = {
  markdownToRichTextNodes
}
