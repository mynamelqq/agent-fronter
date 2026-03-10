import { getToken } from '../stores/auth'

/**
 * 调用 OCR 接口：上传图片，返回识别文本
 * POST /api/ai/ocr，MultipartFile，返回 Result<String>
 */
export async function getOcr(file: File): Promise<string> {
  const token = getToken()
  const form = new FormData()
  form.append('multipartFile', file)

  const headers = new Headers()
  if (token) headers.set('Authorization', token)
  // 不设置 Content-Type，让浏览器自动带 boundary

  const res = await fetch('/api/ai/ocr', {
    method: 'POST',
    headers,
    body: form
  })

  const contentType = res.headers.get('content-type') || ''
  const raw = await res.text()

  // 后端直接返回纯文本时，整段即为 OCR 结果
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new Error(raw || 'OCR 识别失败')
    return raw
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    if (!res.ok) throw new Error('OCR 识别失败')
    return raw
  }

  const obj = json as Record<string, unknown>
  if (!res.ok) {
    const msg = (obj.message ?? obj.msg) as string | undefined
    throw new Error(msg || 'OCR 识别失败')
  }

  const code = obj.code as number | undefined
  if (code !== undefined && code !== 0 && code !== 200) {
    const msg = (obj.message ?? obj.msg) as string | undefined
    throw new Error(msg || 'OCR 识别失败')
  }

  // 兼容多种 Result 结构：data / result / message
  const data = obj.data as string | undefined
  const result = obj.result as string | undefined
  const messageStr = typeof obj.message === 'string' ? obj.message : undefined
  const text = data ?? result ?? messageStr
  if (typeof text === 'string') return text
  return ''
}
