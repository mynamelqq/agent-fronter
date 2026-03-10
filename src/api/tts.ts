import { getToken } from '../stores/auth'

/**
 * 请求朗读：后端向该 sessionId 的 WebSocket 推送 TTS 音频
 */
export async function readText(text: string, sessionId: string): Promise<void> {
  const token = getToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) (headers as Record<string, string>)['Authorization'] = token
  const res = await fetch('/api/ai/read', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, sessionId })
  })
  if (!res.ok) {
    throw new Error(`TTS read 请求失败: ${res.status} ${res.statusText}`)
  }
}

/**
 * 停止朗读
 */
export async function stopTts(sessionId: string): Promise<void> {
  const token = getToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) (headers as Record<string, string>)['Authorization'] = token
  const res = await fetch('/api/ai/stop', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId })
  })
  if (!res.ok) {
    throw new Error(`TTS stop 请求失败: ${res.status} ${res.statusText}`)
  }
}
