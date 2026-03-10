/**
 * 生成浏览器指纹 hash，用于匿名用户识别（/api/anon/identify 的 Fingerprint-Hash）
 * 基于 navigator、screen 等不可敏感信息生成稳定标识
 */
export function generateFingerprint(): string {
  const parts: string[] = []
  try {
    const n = typeof navigator !== 'undefined' ? navigator : ({} as Navigator)
    const s = typeof screen !== 'undefined' ? screen : ({} as Screen)
    parts.push(
      String(n.userAgent ?? ''),
      String(n.language ?? ''),
      String((n as any).languages ? (n as any).languages.join(',') : ''),
      String(n.hardwareConcurrency ?? ''),
      String(n.deviceMemory ?? ''),
      String(s.width ?? '') + 'x' + String(s.height ?? ''),
      String(s.colorDepth ?? ''),
      String(s.pixelDepth ?? ''),
      String((s as any).availWidth ?? '') + 'x' + String((s as any).availHeight ?? ''),
      String(typeof document !== 'undefined' && document.documentElement ? document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight : ''),
      String((n as any).platform ?? ''),
      String((n as any).vendor ?? '')
    )
  } catch {
    parts.push('fp-fallback', String(Date.now()))
  }
  const str = parts.join('|')
  return hashString(str)
}

/** 简单字符串 hash（djb2），保证无 crypto 环境也可用 */
function hashString(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
  }
  const unsigned = h >>> 0
  return unsigned.toString(16)
}
