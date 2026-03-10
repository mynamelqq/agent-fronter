export type Message = { role: 'user' | 'assistant'; text: string; time?: number }
export type Session = { 
  id: string; 
  title?: string; 
  messages: Message[]; 
  createdAt: number;
  pinned?: boolean;
  archived?: boolean;
}

const STORAGE_KEY = 'chatui_sessions_v1'

function readStorage(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Session[]
  } catch {
    return []
  }
}

function writeStorage(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  // 通知其他页面/组件 sessions 已更新
  try {
    window.dispatchEvent(new CustomEvent('sessions:updated'))
  } catch {}
}

function genId() {
  // simple UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getSessions(): { id: string; title?: string }[] {
  return readStorage().map(s => ({ id: s.id, title: s.title }))
}

export type SessionListItem = {
  id: string
  title?: string
  /** 最近一次消息时间（或 createdAt 兜底） */
  updatedAt: number
  createdAt: number
  pinned?: boolean
  archived?: boolean
  /** 最近一条消息内容（可用于预览兜底） */
  lastMessageText?: string
}

function getSessionUpdatedAt(s: Session): number {
  const last = s.messages && s.messages.length ? s.messages[s.messages.length - 1] : undefined
  const lastTime = last?.time
  if (typeof lastTime === 'number' && Number.isFinite(lastTime) && lastTime > 0) return lastTime
  if (typeof s.createdAt === 'number' && Number.isFinite(s.createdAt) && s.createdAt > 0) return s.createdAt
  return Date.now()
}

/** 供侧边栏会话列表使用：包含 updatedAt 等元信息 */
export function listSessions(): SessionListItem[] {
  const sessions = readStorage()
  return sessions.map((s) => {
    const last = s.messages && s.messages.length ? s.messages[s.messages.length - 1] : undefined
    return {
      id: s.id,
      title: s.title,
      updatedAt: getSessionUpdatedAt(s),
      createdAt: s.createdAt,
      pinned: s.pinned,
      archived: s.archived,
      lastMessageText: last?.text ? String(last.text) : undefined
    }
  })
}

export function createSession(title?: string): string {
  const sessions = readStorage()
  const id = genId()
  sessions.unshift({ id, title, messages: [], createdAt: Date.now() })
  writeStorage(sessions)
  return id
}

export function appendMessage(sessionId: string, msg: Message) {
  const sessions = readStorage()
  const s = sessions.find(x => x.id === sessionId)
  if (s) {
    s.messages.push({ ...msg, time: Date.now() })
  } else {
    sessions.unshift({ id: sessionId, title: undefined, messages: [{ ...msg, time: Date.now() }], createdAt: Date.now() })
  }
  writeStorage(sessions)
}

/** 合并连续的 assistant 消息为一条（修复旧数据里因流式写入产生的碎片） */
function mergeAssistantFragments(messages: Message[]): Message[] {
  const out: Message[] = []
  for (const m of messages) {
    if (m.role === 'assistant' && out.length > 0 && out[out.length - 1].role === 'assistant') {
      out[out.length - 1].text += (m.text || '')
    } else {
      out.push({ ...m })
    }
  }
  return out
}

export function getSessionMessages(sessionId: string): Message[] {
  const sessions = readStorage()
  const s = sessions.find(x => x.id === sessionId)
  const raw = s ? s.messages : []
  return mergeAssistantFragments(raw)
}

export function updateSessionTitle(sessionId: string, title?: string) {
  const sessions = readStorage()
  const s = sessions.find(x => x.id === sessionId)
  if (s) {
    s.title = title
    writeStorage(sessions)
  }
}

export function updateSession(sessionId: string, updates: Partial<Omit<Session, 'id'>>) {
  const sessions = readStorage()
  const s = sessions.find(x => x.id === sessionId)
  if (s) {
    Object.assign(s, updates)
    writeStorage(sessions)
  }
}

export function deleteSession(sessionId: string) {
  const sessions = readStorage().filter(s => s.id !== sessionId)
  writeStorage(sessions)
}

/** 更新当前会话最后一条 assistant 消息的文本（用于流式输出：只更新同一条，不追加新消息） */
export function updateLastAssistantContent(sessionId: string, text: string) {
  const sessions = readStorage()
  const s = sessions.find(x => x.id === sessionId)
  if (!s || !s.messages.length) return
  const last = s.messages[s.messages.length - 1]
  if (last.role === 'assistant') {
    last.text = text
    writeStorage(sessions)
  }
}

