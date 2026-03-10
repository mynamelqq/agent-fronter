export interface CompressedAttachment {
  file: File
  fileName: string
  fileType: string
}

const ALLOWED_VIDEO_EXT = new Set(['mp4', 'mkv', 'mov'])
const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/x-matroska',
  'video/matroska',
  'video/quicktime'
])
const KNOWN_VIDEO_EXT = new Set([
  'mp4', 'm4v', 'mov', 'mkv', 'webm', 'avi', 'flv', 'wmv', '3gp', 'mpeg', 'mpg', 'ts', 'm2ts'
])

const IMAGE_MAX_DIM = 1920
const IMAGE_QUALITY = 0.85
const IMAGE_MIN_COMPRESS_SIZE = 512 * 1024

const VIDEO_MAX_DIM = 1280
const VIDEO_MAX_DURATION_SEC = 120
const VIDEO_MIN_COMPRESS_SIZE = 2 * 1024 * 1024
const VIDEO_TARGET_FPS = 24

function replaceFileExt(fileName: string, extWithDot: string): string {
  const base = (fileName || 'upload').replace(/\.[^.]+$/, '')
  return `${base}${extWithDot}`
}

function getFileExt(fileName: string): string {
  const name = (fileName || '').toLowerCase()
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot >= name.length - 1) return ''
  return name.slice(dot + 1)
}

function shouldTreatAsVideo(file: File): boolean {
  if ((file.type || '').toLowerCase().startsWith('video/')) return true
  const ext = getFileExt(file.name || '')
  return KNOWN_VIDEO_EXT.has(ext)
}

function isMovFile(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (type === 'video/quicktime') return true
  const name = (file.name || '').toLowerCase()
  return name.endsWith('.mov')
}

export function isAllowedVideoFormat(file: File): boolean {
  if (!shouldTreatAsVideo(file)) return true
  const type = (file.type || '').toLowerCase()
  const ext = getFileExt(file.name || '')
  if (ALLOWED_VIDEO_EXT.has(ext)) return true
  if (ALLOWED_VIDEO_MIME.has(type)) return true
  return false
}

function getTargetVideoBitsPerSecond(file: File, durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return 1_200_000
  }
  const originalBps = (file.size * 8) / durationSec
  const target = Math.floor(originalBps * 0.6)
  return Math.min(2_000_000, Math.max(500_000, target))
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size < IMAGE_MIN_COMPRESS_SIZE) return file

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    const done = (result: File) => {
      URL.revokeObjectURL(url)
      resolve(result)
    }

    img.onerror = () => done(file)
    img.onload = () => {
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      if (!w || !h) {
        done(file)
        return
      }

      let targetW = w
      let targetH = h
      if (w > IMAGE_MAX_DIM || h > IMAGE_MAX_DIM) {
        if (w >= h) {
          targetW = IMAGE_MAX_DIM
          targetH = Math.round((h * IMAGE_MAX_DIM) / w)
        } else {
          targetH = IMAGE_MAX_DIM
          targetW = Math.round((w * IMAGE_MAX_DIM) / h)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        done(file)
        return
      }
      ctx.drawImage(img, 0, 0, targetW, targetH)

      const mime = file.type || 'image/jpeg'
      const quality = mime === 'image/jpeg' || mime === 'image/webp' ? IMAGE_QUALITY : undefined
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size * 0.95) {
            done(file)
            return
          }
          done(new File([blob], file.name, { type: blob.type, lastModified: Date.now() }))
        },
        mime,
        quality
      )
    }

    img.src = url
  })
}

async function compressVideo(file: File): Promise<CompressedAttachment> {
  if (!file.type.startsWith('video/')) {
    return { file, fileName: file.name, fileType: file.type }
  }
  // 浏览器侧难以稳定输出 MOV，原本就是 MOV 时直接保留格式上传。
  if (isMovFile(file)) {
    return { file, fileName: file.name, fileType: file.type || 'video/quicktime' }
  }
  if (file.size < VIDEO_MIN_COMPRESS_SIZE) {
    return { file, fileName: file.name, fileType: file.type }
  }
  if (typeof MediaRecorder === 'undefined') {
    return { file, fileName: file.name, fileType: file.type }
  }

  const candidateTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]
  const mimeType = candidateTypes.find((t) => MediaRecorder.isTypeSupported(t))
  if (!mimeType) {
    return { file, fileName: file.name, fileType: file.type }
  }

  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup()
        resolve()
      }
      const onErr = () => {
        cleanup()
        reject(new Error('视频解码失败'))
      }
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded)
        video.removeEventListener('error', onErr)
      }
      video.addEventListener('loadedmetadata', onLoaded)
      video.addEventListener('error', onErr)
    })

    const duration = Number(video.duration || 0)
    if (!Number.isFinite(duration) || duration <= 0 || duration > VIDEO_MAX_DURATION_SEC) {
      return { file, fileName: file.name, fileType: file.type }
    }

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) {
      return { file, fileName: file.name, fileType: file.type }
    }

    let targetW = vw
    let targetH = vh
    if (vw > VIDEO_MAX_DIM || vh > VIDEO_MAX_DIM) {
      if (vw >= vh) {
        targetW = VIDEO_MAX_DIM
        targetH = Math.round((vh * VIDEO_MAX_DIM) / vw)
      } else {
        targetH = VIDEO_MAX_DIM
        targetW = Math.round((vw * VIDEO_MAX_DIM) / vh)
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { file, fileName: file.name, fileType: file.type }
    }

    const stream = canvas.captureStream(VIDEO_TARGET_FPS)
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: getTargetVideoBitsPerSecond(file, duration)
    })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }

    let rafId = 0
    const drawFrame = () => {
      if (video.paused || video.ended) return
      ctx.drawImage(video, 0, 0, targetW, targetH)
      rafId = requestAnimationFrame(drawFrame)
    }

    const stopPromise = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })

    recorder.start(200)
    video.currentTime = 0
    await video.play()
    drawFrame()
    await new Promise<void>((resolve) => {
      video.onended = () => resolve()
    })
    cancelAnimationFrame(rafId)
    if (recorder.state !== 'inactive') recorder.stop()
    await stopPromise

    const blob = new Blob(chunks, { type: 'video/webm' })
    if (!blob.size || blob.size >= file.size * 0.95) {
      return { file, fileName: file.name, fileType: file.type }
    }

    const compressedFileName = replaceFileExt(file.name, '.webm')
    const compressed = new File([blob], compressedFileName, {
      type: 'video/webm',
      lastModified: Date.now()
    })
    return { file: compressed, fileName: compressed.name, fileType: compressed.type }
  } catch {
    return { file, fileName: file.name, fileType: file.type }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressMediaAttachment(file: File): Promise<CompressedAttachment> {
  if (file.type.startsWith('image/')) {
    const compressed = await compressImage(file)
    return {
      file: compressed,
      fileName: compressed.name,
      fileType: compressed.type || file.type
    }
  }
  if (file.type.startsWith('video/')) {
    return compressVideo(file)
  }
  return { file, fileName: file.name, fileType: file.type }
}
