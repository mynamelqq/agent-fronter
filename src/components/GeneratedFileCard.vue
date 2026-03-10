<template>
  <div class="generated-file-card" @click="handlePreview">
    <div class="file-icon" :class="iconClass">
      <el-icon class="icon-svg" :size="22">
        <component :is="iconComponent" />
      </el-icon>
    </div>
    <div class="file-info">
      <span class="file-name">{{ fileName }}</span>
      <span class="file-meta">{{ metaLabel }}</span>
    </div>
    <div class="file-actions" @click.stop>
      <button
        type="button"
        class="file-btn file-btn-download"
        title="下载"
        :disabled="!downloadUrl"
        @click="handleDownload"
      >
        <el-icon><Download /></el-icon>
        <span>下载</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { Document, Download } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    /** 文件名 */
    fileName: string
    /** 扩展名或 MIME 类型，如 pdf, xlsx, md，或 application/pdf 等 */
    fileType?: string
    /** 文件下载/预览 URL（优先使用） */
    url?: string
    /** Base64 内容（无 url 时使用，用于生成 Blob） */
    contentBase64?: string
    /** 明确 MIME，用于 base64 转 Blob */
    mimeType?: string
    /** 文件大小（字节），用于展示大小信息 */
    size?: number
  }>(),
  { fileType: '', url: '', contentBase64: '', mimeType: '', size: 0 }
)

/** 从 fileType(MIME/扩展名) + fileName 推断扩展名 */
function inferExt(fileType: string | undefined, fileName: string): string {
  const t = (fileType || '').toLowerCase().trim()
  if (t) {
    // 形如 application/pdf 这种 MIME
    if (t.includes('/')) {
      if (t.includes('pdf')) return 'pdf'
      if (t.includes('excel') || t.includes('spreadsheet') || t.includes('sheet') || t.includes('xls')) return 'xlsx'
      if (t.includes('word') || t.includes('msword')) return 'docx'
      if (t.includes('markdown') || t.includes('md')) return 'md'
      if (t.includes('json')) return 'json'
      if (t.includes('html')) return 'html'
      if (t.includes('css')) return 'css'
      if (t.includes('plain')) return 'txt'
    }
    // 已经是扩展名或带点的字符串
    const simple = t.split('.').pop() || t
    return simple
  }
  const name = fileName || ''
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

const ext = computed(() => inferExt(props.fileType, props.fileName))

/** 根据扩展名返回展示用的类型标签 */
const typeLabel = computed(() => {
  const e = ext.value
  if (e === 'pdf') return 'Document · PDF'
  if (['xlsx', 'xls'].includes(e)) return 'Spreadsheet · ' + e.toUpperCase()
  if (e === 'md' || e === 'markdown') return 'Document · MD'
  if (['html', 'css', 'js', 'ts', 'json'].includes(e)) return 'Code · ' + e.toUpperCase()
  if (e) return 'File · ' + e.toUpperCase()
  return '文件'
})

function formatSize(size?: number): string {
  if (!size || size <= 0) return ''
  const kb = size / 1024
  if (kb < 1024) return `${kb.toFixed(1).replace(/\\.0$/, '')} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1).replace(/\\.0$/, '')} MB`
}

const sizeLabel = computed(() => formatSize(props.size))

const metaLabel = computed(() => {
  const size = sizeLabel.value
  return size ? `${typeLabel.value} · ${size}` : typeLabel.value
})

const iconComponent = Document

const iconClass = computed(() => {
  const e = ext.value
  if (['pdf'].includes(e)) return 'icon-pdf'
  if (['xlsx', 'xls', 'csv'].includes(e)) return 'icon-excel'
  if (['doc', 'docx', 'txt', 'md'].includes(e)) return 'icon-doc'
  if (['html', 'css', 'js', 'ts', 'json'].includes(e)) return 'icon-code'
  return 'icon-default'
})

/** 用于下载/预览的 URL：优先 props.url，否则由 base64 生成 Blob URL */
const downloadUrl = computed(() => props.url || blobUrl.value)
const blobUrl = ref('')

function buildBlobUrl(): string {
  if (!props.contentBase64) return ''
  try {
    const binary = atob(props.contentBase64.replace(/^data:[^;]+;base64,/, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const mime = props.mimeType || getMimeFromExt(ext.value) || 'application/octet-stream'
    const blob = new Blob([bytes], { type: mime })
    return URL.createObjectURL(blob)
  } catch {
    return ''
  }
}

function getMimeFromExt(ext: string): string {
  const e = (ext || '').toLowerCase()
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    md: 'text/markdown',
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
  }
  return map[e] || 'application/octet-stream'
}

watch(
  () => [props.contentBase64, props.fileType, props.mimeType],
  () => {
    if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = props.url ? '' : buildBlobUrl()
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})

function handleDownload() {
  if (!downloadUrl.value) return
  const link = document.createElement('a')
  link.href = downloadUrl.value
  link.download = props.fileName || 'download'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handlePreview() {
  if (!downloadUrl.value) return
  window.open(downloadUrl.value, '_blank')
}
</script>

<style scoped>
.generated-file-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.generated-file-card:hover {
  background: #fafafa;
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.file-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.file-icon .icon-svg {
  color: inherit;
}
.file-icon.icon-pdf {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
}
.file-icon.icon-excel {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #16a34a;
}
.file-icon.icon-doc {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
}
.file-icon.icon-code {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  color: #7c3aed;
}
.file-icon.icon-default {
  background: #f8fafc;
  color: #64748b;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-meta {
  font-size: 12px;
  color: #6b7280;
}

.file-actions {
  flex-shrink: 0;
}
.file-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}
.file-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}
.file-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
