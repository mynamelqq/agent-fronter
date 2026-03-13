import { apiFetchRaw } from './http'

/**
 * 请求朗读：后端向该 sessionId 的 WebSocket 推送 TTS 音频
 */
export async function readText(text: string, sessionId: string): Promise<void> {
  const res = await apiFetchRaw('/api/ai/read', {
    method: 'POST',
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
  const res = await apiFetchRaw('/api/ai/stop', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  })
  if (!res.ok) {
    throw new Error(`TTS stop 请求失败: ${res.status} ${res.statusText}`)
  }
}
