import MarkdownIt from 'markdown-it'
import mk from 'markdown-it-katex'

const config = {
  html: true,
  xhtmlOut: true,
  breaks: true,
  linkify: false,
}

const markdownIt = new MarkdownIt(config).use(mk)

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
