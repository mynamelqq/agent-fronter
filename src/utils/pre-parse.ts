export type State = 'text' | 'symbolMatchingStart' | 'symbolContent' | 'symbolMatchingEnd'

export interface SplitRule {
  start: string
  end: string
}

export interface SymbolBlock {
  type: 'symbol'
  symbol: string
  content: string
  finished: boolean
}

type MatcherState = false | true | 'matching'

interface MatcherResult {
  state: MatcherState
  matchedCount: number
}

/**
 * 简单字符匹配器，用于增量匹配 start/end 标记
 */
class Matcher {
  public readonly matchstring: string
  private index = 0

  constructor(matchstring: string) {
    this.matchstring = matchstring
  }

  reset() {
    this.index = 0
  }

  match(char: string): MatcherResult {
    const target = this.matchstring
    if (!target) {
      return { state: false, matchedCount: 0 }
    }

    if (char === target[this.index]) {
      this.index++
      if (this.index === target.length) {
        const count = this.index
        this.reset()
        return { state: true, matchedCount: count }
      }
      return { state: 'matching', matchedCount: this.index }
    }

    // 匹配失败，返回已匹配数量并重置
    const count = this.index
    this.reset()
    return { state: false, matchedCount: count }
  }
}

export class PreParse {
  private buffer = ''
  private index = 0
  private state: State = 'text'
  private chunkBlocks: SymbolBlock[] = []
  private currentBlock: SymbolBlock | null = null
  private splitRules: SplitRule[] = []
  private matchers: { start: Matcher; end: Matcher }[] = []
  private activeMatcher: { start: Matcher; end: Matcher } | null = null
  private textStateTryMatchers = new Set<{ start: Matcher; end: Matcher }>()

  constructor() {
    this.splitRules = [
      { start: '<think>', end: '</think>' },
      { start: '<Think>', end: '</Think>' },
      { start: '<ToolCall>', end: '</ToolCall>' },
      { start: '<th>', end: '</th>' },
      { start: '::ToolCall::', end: '::ToolCall::' }
    ]
    this.matchers = this.splitRules.map((i) => ({
      start: new Matcher(i.start),
      end: new Matcher(i.end)
    }))
  }

  /** 追加一段增量文本 */
  appendChunk(chunk: string) {
    if (!chunk) return this.chunkBlocks
    this.buffer += chunk
    return this.processChunk()
  }

  private processChunk() {
    while (this.index < this.buffer.length) {
      const currentChar = this.buffer[this.index]
      switch (this.state) {
        case 'text':
          this.stateText(currentChar)
          break
        case 'symbolMatchingStart':
          this.stateSymbolMatchingStart(currentChar)
          break
        case 'symbolContent':
          this.stateSymbolContent(currentChar)
          break
        case 'symbolMatchingEnd':
          this.stateSymbolMatchingEnd(currentChar)
          break
      }
      this.index++
    }
    return this.chunkBlocks
  }

  private getPendingMatchers() {
    return this.matchers.filter((i) => !this.textStateTryMatchers.has(i))
  }

  private stateText(char: string) {
    for (const matcher of this.getPendingMatchers()) {
      const { start: startMatcher } = matcher
      const { state } = startMatcher.match(char)

      if (state === 'matching') {
        this.activeMatcher = matcher
        this.textStateTryMatchers.add(matcher)
        this.state = 'symbolMatchingStart'
        return
      }
    }
    // ❌ 不再生成 TextBlock，直接丢弃普通文本
  }

  private stateSymbolMatchingStart(char: string) {
    if (!this.activeMatcher) return

    const { state, matchedCount } = this.activeMatcher.start.match(char)

    if (state === false) {
      this.state = 'text'
      this.index = this.index - matchedCount - 1
    } else if (state === true) {
      this.state = 'symbolContent'
      this.textStateTryMatchers.clear()
      this.currentBlock = {
        type: 'symbol',
        symbol: this.activeMatcher.start.matchstring,
        content: '',
        finished: false
      }
      this.chunkBlocks.push(this.currentBlock)
    }
  }

  private stateSymbolContent(char: string) {
    if (!this.activeMatcher || !this.currentBlock) return

    const { state } = this.activeMatcher.end.match(char)

    if (state === false) {
      this.currentBlock.content += char
    } else if (state === 'matching') {
      this.state = 'symbolMatchingEnd'
    }
  }

  private stateSymbolMatchingEnd(char: string) {
    if (!this.activeMatcher || !this.currentBlock) return

    const { state, matchedCount } = this.activeMatcher.end.match(char)

    if (state === false) {
      this.state = 'symbolContent'
      const matchedString = this.buffer.slice(this.index - matchedCount, this.index)
      this.currentBlock.content += matchedString + char
    } else if (state === true) {
      this.state = 'text'
      this.currentBlock.finished = true
      this.currentBlock = null
    }
  }
}

