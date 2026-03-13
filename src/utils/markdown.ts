import MarkdownIt from 'markdown-it'
import katex from 'katex'

const config = {
  html: true,
  xhtmlOut: true,
  breaks: true,
  linkify: false,
}

function isValidInlineDelim(state: any, pos: number): boolean {
  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const nextChar = pos + 1 < state.posMax ? state.src.charCodeAt(pos + 1) : -1
  if (prevChar === 0x5c) return false
  if (nextChar === 0x20 || nextChar === 0x09) return false
  return true
}

function mathInline(state: any, silent: boolean): boolean {
  if (state.src[state.pos] !== '$') return false
  if (!isValidInlineDelim(state, state.pos)) return false

  let start = state.pos + 1
  let match = start

  while ((match = state.src.indexOf('$', match)) !== -1) {
    let backslashes = 0
    let pos = match - 1
    while (pos >= 0 && state.src[pos] === '\\') {
      backslashes++
      pos--
    }
    if (backslashes % 2 === 0) break
    match += 1
  }

  if (match === -1) return false
  if (match === start) return false
  if (state.src[match - 1] === ' ' || state.src[match - 1] === '\t') return false

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }

  state.pos = match + 1
  return true
}

function mathBlock(state: any, startLine: number, endLine: number, silent: boolean): boolean {
  let pos = state.bMarks[startLine] + state.tShift[startLine]
  let max = state.eMarks[startLine]

  if (pos + 2 > max) return false
  if (state.src.slice(pos, pos + 2) !== '$$') return false

  pos += 2
  let firstLine = state.src.slice(pos, max)
  let found = false
  let nextLine = startLine
  let lastLine = ''

  if (firstLine.trim().endsWith('$$')) {
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }

  while (!found) {
    nextLine++
    if (nextLine >= endLine) return false

    pos = state.bMarks[nextLine] + state.tShift[nextLine]
    max = state.eMarks[nextLine]
    const lineText = state.src.slice(pos, max)

    if (lineText.trim().endsWith('$$')) {
      lastLine = lineText.trim().slice(0, -2)
      found = true
    } else {
      lastLine += (lastLine ? '\n' : '') + lineText
    }
  }

  if (silent) return true

  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content = (firstLine && lastLine)
    ? `${firstLine}\n${lastLine}`
    : (firstLine || lastLine)
  token.map = [startLine, nextLine + 1]
  token.markup = '$$'
  state.line = nextLine + 1
  return true
}

function mathPlugin(md: MarkdownIt): void {
  md.inline.ruler.after('escape', 'math_inline', mathInline)
  md.block.ruler.after('blockquote', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.renderer.rules.math_inline = (tokens, idx) =>
    katex.renderToString(tokens[idx].content, {
      throwOnError: false,
      displayMode: false,
      output: 'htmlAndMathml',
      strict: 'ignore',
    })

  md.renderer.rules.math_block = (tokens, idx) =>
    `${katex.renderToString(tokens[idx].content, {
      throwOnError: false,
      displayMode: true,
      output: 'htmlAndMathml',
      strict: 'ignore',
    })}\n`
}

const markdownIt = new MarkdownIt(config).use(mathPlugin)

/**
 * 流式渲染时的 bad case：末尾 "\n- " 在后续内容到达前会被误解析为标题等，导致闪动
 * 见 markdown-it-sse-template：末尾为 \n- 时先替换为换行
 */
function handleMdRenderBadCase(text: string): string {
  if (!text) return text
  return text.replace(/\n\s*-\s*$/g, '\n')
}

/**
 * 找到最后一个适合插入光标的子节点（用于 SSE 流式输出时在尾部显示光标）
 * 见 markdown-it-sse-template findDeepestLastChild
 */
function findDeepestLastChild(element: Element): Element | null {
  const childNodes = element.childNodes
  if (!childNodes.length) return element
  for (let i = childNodes.length - 1; i >= 0; i--) {
    const node = childNodes[i]
    if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim()) {
      return node.parentNode as Element
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const found = findDeepestLastChild(node as Element)
      if (found) return found
    }
  }
  return null
}

const SSE_CURSOR_HTML = '<span class="sse_cursor" aria-hidden="true"></span>'

export interface TransformMarkdownForStreamOptions {
  /** 是否在末尾追加光标（流式输出中为 true） */
  appendCursor?: boolean
  /** 是否允许空内容仍返回可渲染结果（避免 key 不变导致不更新） */
  allowEmpty?: boolean
}

/**
 * 基于 markdown-it 将文本转为 HTML，支持流式输出时在尾部追加光标
 * 参考 https://github.com/maiguoheng/markdown-it-sse-template
 */
export function transformMarkdownForStream(
  text: string,
  options: TransformMarkdownForStreamOptions = {}
): string {
  const { appendCursor = false, allowEmpty = false } = options
  if (!text && !allowEmpty) return ''
  const normalized = handleMdRenderBadCase(text)
  let result = markdownIt.render(normalized)
  if (appendCursor) {
    const div = document.createElement('div')
    div.innerHTML = result
    const lastEl = findDeepestLastChild(div)
    if (lastEl) {
      lastEl.innerHTML += ' ' + SSE_CURSOR_HTML
      result = div.innerHTML
    } else {
      result += ' ' + SSE_CURSOR_HTML
    }
  }
  return result
}

export default markdownIt
