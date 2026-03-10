import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import shell from 'highlight.js/lib/languages/shell'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import go from 'highlight.js/lib/languages/go'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import rLang from 'highlight.js/lib/languages/r'
import rust from 'highlight.js/lib/languages/rust'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', shell)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('sh', shell)
hljs.registerLanguage('json', json)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('go', go)
hljs.registerLanguage('golang', go)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('kt', kotlin)
hljs.registerLanguage('r', rLang)
hljs.registerLanguage('rust', rust)

hljs.configure({ ignoreUnescapedHTML: true })

const ROOT_PROTECT_CLASS = 'article-content'
const ROOT_PROTECT_ID = 'article-content'

/**
 * 高亮代码块
 * @param element 包含 pre code 代码块的元素
 */
export function highlightCode(element: Element): void {
  const codeEls = element.querySelectorAll('pre code')
  codeEls.forEach((el) => {
    if (!(el instanceof HTMLElement)) return
    delete (el as HTMLElement).dataset.highlighted
    hljs.highlightElement(el)
  })
}

/**
 * 给代码块添加复制按钮（使用 navigator.clipboard）
 * @param element 包含 pre code 代码块的元素
 */
export function buildCopyButton(element: Element): void {
  const pres = element.querySelectorAll('pre')
  if (!pres.length) return

  pres.forEach((pre) => {
    if (pre.querySelector('.copy')) return
    const code = pre.querySelector('code')
    const text = code?.textContent ?? ''
    if (!text) return

    const btn = document.createElement('span')
    btn.className = 'copy'
    btn.textContent = '复制'
    btn.setAttribute('data-clipboard-text', text)
    pre.style.position = 'relative'
    pre.insertBefore(btn, pre.firstChild)

    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(text).then(
        () => {
          btn.classList.add('copyed')
          btn.textContent = '复制成功'
          setTimeout(() => {
            btn.textContent = '复制'
            btn.classList.remove('copyed')
          }, 1000)
        },
        () => {
          btn.textContent = '复制失败'
        }
      )
    })
  })
}

/**
 * 对比两个节点的内容，动态更新 div1 以匹配 div2（不整体替换 innerHTML）
 * 对 root 节点做保护，不替换其 id/className。
 */
export function deepCloneAndUpdate(div1: Element, div2: Element): void {
  function compareAndUpdate(node1: Node | null, node2: Node): void {
    if (
      node1 &&
      node1.nodeType === Node.TEXT_NODE &&
      node2.nodeType === Node.TEXT_NODE
    ) {
      if (node1.nodeValue !== node2.nodeValue) {
        node1.nodeValue = node2.nodeValue
      }
      return
    }

    if (!node1 || (node1 as Element).tagName !== (node2 as Element).tagName) {
      const newNode = node2.cloneNode(true)
      if (node1) {
        node1.parentNode!.replaceChild(newNode, node1)
      } else {
        ;(node2.parentNode as Element).appendChild(newNode)
      }
      return
    }

    const el1 = node1 as HTMLElement
    const el2 = node2 as HTMLElement

    const isRoot =
      typeof el1.className === 'string' &&
      el1.className.includes(ROOT_PROTECT_CLASS)
    if (!isRoot && el1.className !== el2.className) {
      el1.className = el2.className
    }
    if (el1.id !== ROOT_PROTECT_ID && el1.id !== el2.id) {
      el1.id = el2.id
    }
    if (el1.style.cssText !== el2.style.cssText) {
      el1.style.cssText = el2.style.cssText
    }

    const children1 = Array.from(node1.childNodes)
    const children2 = Array.from(node2.childNodes)

    children2.forEach((child2, index) => {
      const child1 = children1[index]
      if (!child1) {
        const newChild = child2.cloneNode(true)
        node1.appendChild(newChild)
      } else {
        compareAndUpdate(child1, child2)
      }
    })

    if (children1.length > children2.length) {
      for (let i = children2.length; i < children1.length; i++) {
        node1.removeChild(children1[i])
      }
    }
  }

  compareAndUpdate(div1, div2)
}

/**
 * 对放入 markdown 内容的容器做代码高亮与复制按钮处理
 */
export function buildCodeBlock(element: Element): void {
  highlightCode(element)
  buildCopyButton(element)
}

const LANG_LABELS: Record<string, string> = {
  plaintext: 'Text',
  text: 'Text',
  python: 'Python',
  py: 'Python',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
  shell: 'Shell',
  sql: 'SQL',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  golang: 'Go',
  php: 'PHP',
  ruby: 'Ruby',
  rb: 'Ruby',
  swift: 'Swift',
  kotlin: 'Kotlin',
  kt: 'Kotlin',
  r: 'R',
  rust: 'Rust'
}

function getLangLabel(lang: string): string {
  const lower = lang.toLowerCase()
  return LANG_LABELS[lower] || lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()
}

/**
 * 为代码块增加头部：左侧语言种类，右侧复制按钮
 */
export function enhanceCodeBlocks(container: Element): void {
  const pres = container.querySelectorAll('pre')
  pres.forEach((pre) => {
    if (pre.parentElement?.classList?.contains('code-block-wrapper')) return
    const code = pre.querySelector('code')
    const langMatch = code?.className?.match(/language-(\w+)/)
    const langKey = langMatch ? langMatch[1] : 'plaintext'
    const langLabel = getLangLabel(langKey)

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'

    const header = document.createElement('div')
    header.className = 'code-block-header'

    const langSpan = document.createElement('span')
    langSpan.className = 'code-block-lang'
    langSpan.textContent = langLabel

    const copyBtn = document.createElement('button')
    copyBtn.type = 'button'
    copyBtn.className = 'code-block-copy'
    copyBtn.textContent = '复制'
    copyBtn.addEventListener('click', () => {
      const text = code?.textContent ?? ''
      navigator.clipboard?.writeText(text).then(
        () => {
          copyBtn.textContent = '已复制'
          setTimeout(() => { copyBtn.textContent = '复制' }, 1500)
        },
        () => { copyBtn.textContent = '复制失败' }
      )
    })

    header.appendChild(langSpan)
    header.appendChild(copyBtn)
    wrapper.appendChild(header)

    const parent = pre.parentNode
    if (!parent) return
    parent.replaceChild(wrapper, pre)
    wrapper.appendChild(pre)
  })

  // 包装完成后统一触发 highlight.js 高亮
  // 每次流式增量更新时都会重新调用，前面已清除 dataset.highlighted，允许重复高亮
  highlightCode(container)
}
