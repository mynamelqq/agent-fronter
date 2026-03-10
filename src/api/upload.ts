import { getAccessToken } from '../stores/auth'
import { getAnnoIdForRequest } from './anon'

export interface UploadResult {
  fileUrl: string
  /** 后端确认后返回的附件 id（字符串保留 Long 精度），发送消息时传给 chat 接口 */
  attachmentId?: string
}

/** 确认上传时的上下文：conservation_id=会话 id，chat_id=消息 id（可选，发送前可为空） */
export interface UploadConfirmOptions {
  conservation_id: string
  chat_id?: string
  /** 若调用方在选文件时已读取，可传入以规避异步后 file.size 为 0 的情况 */
  fileSize?: number
  fileName?: string
  fileType?: string
}

function withAuthHeaders(baseHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...baseHeaders }
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  } else {
    const annoId = getAnnoIdForRequest()
    if (annoId && !headers['Anno-Id']) {
      headers['Anno-Id'] = annoId
    }
  }
  return headers
}

/**
 * 上传文件：先请求后端签名，再 PUT 直传 COS；上传成功后调用 /api/upload/confirm 确认
 */
export async function uploadFile(
  file: File,
  options: UploadConfirmOptions
): Promise<UploadResult> {
  // 优先使用调用方在选文件时传入的 fileSize/fileName/fileType（须在清空 input 前读取），避免 file 引用失效后 size 为 0
  const fileSize =
    typeof options.fileSize === 'number'
      ? options.fileSize
      : (typeof file.size === 'number' ? file.size : 0)
  const fileName = options.fileName ?? file.name ?? ''
  const fileType = options.fileType ?? file.type ?? ''

  // 从文件名取后缀，如 .pdf、.png
  const ext = fileName.includes('.') ? fileName.split('.').pop() : ''
  const suffix = ext ? `.${ext}` : ''

  // 1. 请求后端签名，获取上传地址与最终访问地址
  const signRes = await fetch(
    `/api/upload/sign?suffix=${encodeURIComponent(suffix)}`,
    {
      headers: withAuthHeaders()
    }
  )
  if (!signRes.ok) {
    throw new Error('获取上传签名失败')
  }
  const signData = await signRes.json()
  const uploadUrl = signData.uploadUrl ?? signData.data?.uploadUrl
  const fileUrl = signData.fileUrl ?? signData.data?.fileUrl
  if (!uploadUrl || !fileUrl) {
    throw new Error('签名返回缺少 uploadUrl 或 fileUrl')
  }

  // 2. PUT 直传 COS
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file
  })
  if (!putRes.ok) {
    throw new Error(`上传失败: ${putRes.status}`)
  }

  // 3. 上传成功，调用确认接口；后端使用 file_size 字段（字节数）
  const confirmRes = await fetch('/api/upload/confirm', {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      chat_id: options.chat_id ?? '',
      conservation_id: options.conservation_id,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
      file_type: fileType
    })
  })
  // 后端 /confirm 返回 Result<String>，data 即为 id；用字符串保存避免 Long 转 Number 精度丢失
  let attachmentId: string | undefined
  if (confirmRes.ok) {
    try {
      const json = await confirmRes.json()
      const data = json?.data
      const rawId = typeof data === 'string' || typeof data === 'number'
        ? data
        : (data?.id ?? json?.id)
      if (rawId != null && rawId !== '') {
        attachmentId = String(rawId)
      }
    } catch {
      // 忽略解析失败
    }
  } else {
    // 确认接口失败，抛出错误
    throw new Error('后端确认失败')
  }

  return { fileUrl, attachmentId }
}

/** 头像上传结果：仅返回可访问的 URL，无需 confirm */
export interface AvatarUploadResult {
  fileUrl: string
}

const IMAGE_SUFFIXES = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])

/**
 * 上传头像图片：请求 /api/upload/sign/avatar 获取签名，再 PUT 直传 COS，不需要 confirm
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResult> {
  const fileName = file.name ?? ''
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : ''
  const suffix = ext ? `.${ext}` : '.jpg'
  if (!IMAGE_SUFFIXES.has(suffix)) {
    throw new Error('请选择图片文件（jpg、png、gif、webp）')
  }

  const signRes = await fetch(
    `/api/upload/sign/avatar?suffix=${encodeURIComponent(suffix)}`,
    {
      headers: withAuthHeaders()
    }
  )
  if (!signRes.ok) {
    throw new Error('获取头像上传签名失败')
  }
  const signData = await signRes.json()
  const uploadUrl = signData.uploadUrl ?? signData.data?.uploadUrl
  const fileUrl = signData.fileUrl ?? signData.data?.fileUrl
  if (!uploadUrl || !fileUrl) {
    throw new Error('签名返回缺少 uploadUrl 或 fileUrl')
  }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file
  })
  if (!putRes.ok) {
    throw new Error(`头像上传失败: ${putRes.status}`)
  }

  return { fileUrl }
}
