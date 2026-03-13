/**
 * 对话流式接口：与 Chat.vue / Home 跳转后的首条消息共用
 * POST /api/ai/chat/async/，消费 SSE，onChunk 回调每段内容
 * 基于可读流缓冲机制与递归读取
 */

import { getToken } from '../stores/auth'
import { getStoredAnnoId } from './anon'
import { apiFetch, apiFetchRaw } from './http'

/** 与后端 ResultCodeEnum 对应，供前端区分业务错误 */
export const StreamChatErrorCode = {
  TOKEN_LIMIT_EXCEEDED: 1010
} as const

/** 流式对话业务错误，携带后端返回的 code 与 message */
export class StreamChatError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly serverMessage?: string
  ) {
    super(message)
    this.name = 'StreamChatError'
    Object.setPrototypeOf(this, StreamChatError.prototype)
  }
}

export interface StreamChatParams {
  chatId: string
  message: string
  messageId: string
  attachments?: (string | number)[]
  agentId?: string
  mode?: string
  token?: string
  isThinking?: boolean
  /** 推理耗时（毫秒），可选，由前端或后端传入 */
  thinkingTime?: number
  /** 是否为图片生成请求（后端 ChatSendReq.isImageGen） */
  isImageGen?: boolean
  /** 是否为深度搜索请求（后端 ChatSendReq.isSearch） */
  isSearch?: boolean
  /** 是否为生成文件请求（后端 ChatSendReq.isGenerateFile） */
  isGenerateFile?: boolean
  /** 是否为图表渲染请求（后端 ChatSendReq.isEcharts） */
  isEcharts?: boolean
}

export interface StreamChatCallbacks {
  onChunk: (text: string) => void
  /** err 可能为 StreamChatError，可据此区分 Token 超限等业务错误 */
  onError?: (err: Error | StreamChatError) => void
  onDone?: () => void
}

const CHAT_ASYNC_URL = '/api/ai/chat/async/'

/** 解析非 2xx 响应为 StreamChatError，便于前端区分 Token 超限等 */
async function parseStreamChatError(response: Response): Promise<StreamChatError> {
  const ct = response.headers.get('content-type') || ''
  let code = response.status
  let serverMessage = response.statusText
  if (ct.includes('application/json')) {
    try {
      const json = (await response.json()) as { code?: number; message?: string; msg?: string }
      code = typeof json.code === 'number' ? json.code : code
      serverMessage = json.message ?? json.msg ?? serverMessage
    } catch {
      // ignore
    }
  }
  const message =
    code === StreamChatErrorCode.TOKEN_LIMIT_EXCEEDED
      ? 'Token数量超限'
      : serverMessage || `请求失败 (${response.status})`
  return new StreamChatError(message, code, serverMessage)
}

/**
 * 流式对话 API：使用 ReadableStream 缓冲机制，按 \n\n 分割并解析 data: 事件
 * @returns AbortController 用于取消请求；abort 时 fetch 中断，reader.read() 会 reject
 */
export function streamChat(
  params: StreamChatParams,
  callbacks: StreamChatCallbacks
): AbortController {
  const controller = new AbortController()
  const token = params.token || getToken()

  const requestBody = {
    chatId: params.chatId,
    message: params.message,
    messageId: params.messageId,
    attachments: params.attachments || [],
    agentId: params.agentId || '',
    mode: params.mode || 'chat',
    token: token || '',
    isThinking: params.isThinking ?? false,
    thinkingTime: typeof params.thinkingTime === 'number' ? params.thinkingTime : undefined,
    isImageGen: params.isImageGen ?? false,
    isSearch: params.isSearch ?? false,
    isGenerateFile: params.isGenerateFile ?? false,
    isEcharts: params.isEcharts ?? false
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = String(token)
  } else {
    // 未登录：如果已有本地缓存的 annoId，则携带到请求头
    const annoId = getStoredAnnoId()
    if (annoId) {
      headers['Anno-Id'] = annoId
    }
  }

  apiFetchRaw(CHAT_ASYNC_URL, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(requestBody),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await parseStreamChatError(response)
        throw err
      }
      if (!response.body) throw new Error('Response body is null')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      try {
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()   
          if (done) { 
            callbacks.onDone?.()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          
          let eventEnd
          while ((eventEnd = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, eventEnd)
            buffer = buffer.slice(eventEnd + 2)
          
            const lines = rawEvent.split('\n')
            const dataLines: string[] = []
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                let content = line.slice(5).trim()
                if (content === '[DONE]') {
                  callbacks.onDone?.()
                  return
                }
                if (content) {
                  dataLines.push(content)
                }
              }
            }
            
            if (dataLines.length > 0) {
              let data = dataLines.join('\n')
              callbacks.onChunk(data)
            }
          }
        }
      } 
      catch (e) {
          if (e instanceof Error && e.name === 'AbortError') return
          callbacks.onError?.(e instanceof Error ? e : new Error(String(e)))
          if (reader && typeof reader.cancel === 'function') {
            reader.cancel()
          }
        }
      })
    .catch((error) => {
      if (error instanceof Error && error.name === 'AbortError') return
      const err =
        error instanceof StreamChatError
          ? error
          : error instanceof Error
            ? error
            : new Error(String(error))
      callbacks.onError?.(err)
    })

  return controller
}

/**
 * 取消对话 API：向后端发送取消请求
 * @param chatId 对话ID
 */
export async function cancelChat(chatId: string): Promise<void> {
  const token = getToken()
  const url = `/api/ai/chat/cancel?chatId=${encodeURIComponent(chatId)}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = String(token)
  } else {
    const annoId = getStoredAnnoId()
    if (annoId) {
      headers['Anno-Id'] = annoId
    }
  }

  const response = await apiFetchRaw(url, {
    method: 'POST',
    credentials: 'include',
    headers
  })
  
  if (!response.ok) {
    throw new Error(`取消对话失败: ${response.status}`)
  }
}

export interface StreamRegenerateParams {
  /** 当前会话session的id */
  chatId: string
  /** 用户点击重新生成的助手消息id */
  assistantMessageId: string
  /** 助手消息上面那条需要重新输入的用户消息id */
  userMessageId: string
  /** 已登录用户的token */
  token?: string
}

/**
 * 重新生成回复 API：使用 ReadableStream 缓冲机制，按 \n\n 分割并解析 data: 事件
 * @returns AbortController 用于取消请求；abort 时 fetch 中断，reader.read() 会 reject
 */
export function streamRegenerate(
  params: StreamRegenerateParams,
  callbacks: StreamChatCallbacks
): AbortController {
  const controller = new AbortController()
  const token = params.token || getToken()

  // 确保所有必需的参数都存在
  if (!params.chatId || !params.assistantMessageId || !params.userMessageId) {
    const error = new Error('重新生成参数不完整')
    console.error('streamRegenerate参数错误:', {
      chatId: params.chatId,
      assistantMessageId: params.assistantMessageId,
      userMessageId: params.userMessageId,
      token: token ? '***' : undefined
    })
    callbacks.onError?.(error)
    return controller
  }

  const requestBody = {
    chatId: String(params.chatId).trim(),
    assistantMessageId: String(params.assistantMessageId).trim(),
    userMessageId: String(params.userMessageId).trim(),
    token: token ? String(token).trim() : ''
  }

  // 验证请求体
  const requestBodyStr = JSON.stringify(requestBody)
  console.log('发送重新生成请求:', {
    url: '/api/ai/chat/regenerate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: '***' } : {})
    },
    body: requestBody,
    bodyString: requestBodyStr
  })

  const REGENERATE_URL = '/api/ai/chat/regenerate'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = String(token)
  } else {
    const annoId = getStoredAnnoId()
    if (annoId) {
      headers['Anno-Id'] = annoId
    }
  }

  apiFetchRaw(REGENERATE_URL, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: requestBodyStr,
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await parseStreamChatError(response)
        throw err
      }
      if (!response.body) throw new Error('Response body is null')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      try {
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()   
          if (done) { 
            callbacks.onDone?.()
            return
          }
          buffer += decoder.decode(value, { stream: true })
          
          let eventEnd
          while ((eventEnd = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, eventEnd)
            buffer = buffer.slice(eventEnd + 2)
          
            const lines = rawEvent.split('\n')
            const dataLines: string[] = []
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                let content = line.slice(5).trim()
                if (content === '[DONE]') {
                  callbacks.onDone?.()
                  return
                }
                if (content) {
                  dataLines.push(content)
                }
              }
            }
            
            if (dataLines.length > 0) {
              let data = dataLines.join('\n')
              callbacks.onChunk(data)
            }
          }
        }
      } 
      catch (e) {
          if (e instanceof Error && e.name === 'AbortError') return
          callbacks.onError?.(e instanceof Error ? e : new Error(String(e)))
          if (reader && typeof reader.cancel === 'function') {
            reader.cancel()
          }
        }
      })
    .catch((error) => {
      if (error instanceof Error && error.name === 'AbortError') return
      const err =
        error instanceof StreamChatError
          ? error
          : error instanceof Error
            ? error
            : new Error(String(error))
      callbacks.onError?.(err)
    })

  return controller
}

export async function favorChatMessage(messageId: string | number, isFavor: boolean): Promise<void> {
  const query =
    '/api/chat/message/favor?messageId=' +
    encodeURIComponent(String(messageId)) +
    '&isFavor=' +
    encodeURIComponent(String(isFavor))

  const { ok, json } = await apiFetch<null>(query, { method: 'POST' })
  const code = json?.code
  if (!ok || (code !== undefined && code !== 0 && code !== 200)) {
    throw new Error(json?.message || json?.msg || '点赞操作失败')
  }
}
