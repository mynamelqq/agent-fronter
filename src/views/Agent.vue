<template>
  <div class="agent-container">
    <!-- 头部：参考 Chat.vue chat-header -->
    <div class="chat-header">
      <div class="chat-title-section">
        <button v-if="!showHome" class="back-button" @click="goBack" title="返回">
          ←
        </button>
        <div class="chat-info">
          <div class="chat-title">{{ showHome ? '智能体' : '智能体对话' }}</div>
          <div class="chat-subtitle">{{ showHome ? '选择或创建会话' : `${messages.length} 条消息` }}</div>
        </div>
      </div>
      <div class="chat-actions">
        <NotificationCenter />
      </div>
    </div>

    <!-- 主内容区： -->
    <div class="agent-main">
      <!-- 左侧：首页 或 对话区 -->
      <div class="agent-left">
        <!-- 智能体首页（无 sessionId 时展示） -->
        <div v-if="showHome" class="agent-home-wrap">
            <AgentHome @start="handleStartConversation" />
        </div>
        <!-- 对话区（有 sessionId 时展示） -->
        <template v-else>
          <div class="agent-chat">
        <div class="messages-container" ref="messagesContainer" @scroll="handleMessagesScroll">
          <div v-for="(msg, idx) in messages" :key="idx" class="message-group" :class="msg.role">
            <!-- 用户消息 -->
            <div v-if="msg.role === 'user'" class="message-bubble user">
              <div class="message-content">{{ msg.content }}</div>
            </div>

            <!-- AI 消息 -->
            <div v-else class="message-bubble assistant">
              <!-- 按“推理阶段 step”顺序渲染：推理卡片 -> 工具卡片 -> 推理卡片 -> ... -->
              <template v-for="(step, si) in (msg.steps || [])" :key="'step-' + si">
                <Think
                  v-if="step.reasoning"
                  :thinkchunk="step.reasoning"
                  :thinking="false"
                  :thinking-time="step.thinkingTime"
                  label="Thought"
                />
                <template v-for="(tc, ti) in (step.tools || [])" :key="'tc-' + si + '-' + ti">
                  <div v-if="isFileTool(tc.toolName) && getParsedFiles(tc).length" class="generated-files-block">
                    <GeneratedFileCard
                      v-for="(file, fi) in getParsedFiles(tc)"
                      :key="fi"
                      :fileName="file.fileName"
                      :fileType="file.fileType"
                      :url="file.url"
                      :contentBase64="file.contentBase64"
                      :mimeType="file.mimeType"
                      :size="file.size"
                    />
                  </div>
                  <div v-else-if="isFileTool(tc.toolName) && !tc.result" class="file-tool-loading">
                    <span class="file-tool-loading-icon">⏳</span>
                    <span>正在生成文件…</span>
                  </div>
                  <ToolCallCard v-else v-bind="tc" />
                </template>
              </template>

              <!-- 流式阶段最后一个“正在思考”的 step（还未推入 msg.steps） -->
              <template v-if="msg.role === 'assistant' && isRunning && idx === messages.length - 1">
                <Think
                  v-if="currentStep.reasoning"
                  :thinkchunk="currentStep.reasoning"
                  :thinking="true"
                  :thinking-time="currentStep.thinkingTime"
                  label="Thought"
                />
                <template v-for="(tc, ti) in (currentStep.tools || [])" :key="'stream-tc-' + ti">
                  <div v-if="isFileTool(tc.toolName) && getParsedFiles(tc).length" class="generated-files-block">
                    <GeneratedFileCard
                      v-for="(file, fi) in getParsedFiles(tc)"
                      :key="fi"
                      :fileName="file.fileName"
                      :fileType="file.fileType"
                      :url="file.url"
                      :contentBase64="file.contentBase64"
                      :mimeType="file.mimeType"
                      :size="file.size"
                    />
                  </div>
                  <div v-else-if="isFileTool(tc.toolName) && !tc.result" class="file-tool-loading">
                    <span class="file-tool-loading-icon">⏳</span>
                    <span>正在生成文件…</span>
                  </div>
                  <ToolCallCard v-else v-bind="tc" />
                </template>
              </template>

              <!-- 正文内容（流式时用 markdown 流式渲染） -->
              <div class="message-content assistant-body" v-html="getAssistantMessageHtml(msg, idx)"></div>
              <!-- 消息统计 footer：展示 Token 使用与耗时等信息 -->
              <div
                v-if="msg.role === 'assistant' && (msg.tokens != null || msg.promptTokens != null || msg.completionTokens != null || msg.cachedTokens != null || (msg.cost != null && msg.cost > 0))"
                class="agent-message-footer"
              >
                <span v-if="msg.tokens != null">
                  Token：{{ msg.tokens }}
                </span>
                <span
                  v-else-if="msg.promptTokens != null || msg.completionTokens != null || msg.cachedTokens != null"
                >
                  Token：{{ (msg.promptTokens || 0) + (msg.completionTokens || 0) + (msg.cachedTokens || 0) }}
                </span>
                <span
                  v-if="msg.promptTokens != null || msg.completionTokens != null || msg.cachedTokens != null"
                >
                  （提示 {{ msg.promptTokens ?? 0 }} · 输出 {{ msg.completionTokens ?? 0 }}<span v-if="msg.cachedTokens != null"> · 缓存 {{ msg.cachedTokens }}</span>）
                </span>
                <span v-if="msg.cost != null && msg.cost > 0">
                  · 总耗时：{{ Math.round(msg.cost / 1000) }}s
                </span>
              </div>
            </div>
          </div>

          <!-- 加载历史消息状态 -->
          <div v-if="messagesLoading" class="messages-loading">
            <div class="loading-dots">
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
            </div>
            <span class="messages-loading-text">正在加载会话内容...</span>
          </div>
          <!-- 运行中加载状态：仅在没有收到任何推理/正文时显示 -->
          <div
            v-else-if="isRunning
              && !currentMessage.content
              && !(currentMessage.steps && currentMessage.steps.length)
              && !currentStep.reasoning
              && !(currentStep.tools && currentStep.tools.length)"
            class="loading-dots"
          >
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>

        <!-- 底部输入框，增加附件功能（参考 Chat.vue） -->
        <div class="input-container">
          <!-- 附件展示区：简单卡片列表 -->
          <div v-if="agentAttachments.length > 0" class="attachments-list">
            <div
              v-for="item in agentAttachments"
              :key="item.id"
              class="attach-card"
            >
              <div class="attach-card-icon">
                <template v-if="item.file.type.startsWith('image/') && item.status === 'done' && item.fileUrl">
                  <img :src="item.fileUrl" class="attach-card-img" alt="" />
                </template>
                <template v-else>
                  <span class="attach-card-file-icon" :class="{ 'is-text': isAgentTextLikeFile(item.file.name, item.file.type) }">
                    <svg class="attach-card-file-svg" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M6.75 3A2.75 2.75 0 0 0 4 5.75v12.5A2.75 2.75 0 0 0 6.75 21h10.5A2.75 2.75 0 0 0 20 18.25V9.06a.75.75 0 0 0-.24-.55l-5.5-5.1A.75.75 0 0 0 13.75 3h-7Zm7.75 1.9L18.2 8.33h-2.2A1.5 1.5 0 0 1 14.5 6.8V4.9Z"
                      />
                    </svg>
                    <span class="attach-card-ext-pill">{{ getAgentFileExt(item.file.name) }}</span>
                  </span>
                </template>
                <!-- 简单圆圈进度条 -->
                <svg
                  v-if="item.status !== 'done' || item.error"
                  class="attach-card-progress"
                  viewBox="0 0 36 36"
                  width="36"
                  height="36"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--slate-200)"
                    stroke-width="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    :stroke="item.status === 'error' ? 'var(--red-500)' : 'var(--slate-500)'"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-dasharray="94.25"
                    :stroke-dashoffset="94.25 - (item.progress / 100) * 94.25"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
              <div class="attach-card-body">
                <span class="attach-card-name">{{ item.file.name }}</span>
                <span class="attach-card-type">{{
                  item.status === 'error'
                    ? '上传失败'
                    : item.file.type.startsWith('image/')
                      ? '图片'
                      : '文件'
                }}</span>
              </div>
              <button
                type="button"
                class="attach-card-remove"
                title="删除附件"
                @click="removeAgentAttachment(item.id)"
                aria-label="删除"
              >
                ×
              </button>
            </div>
          </div>

          <div
            class="input-box-container"
            :class="{ 'input-box-has-attachments': agentAttachments.length > 0 }"
            :style="{ '--input-max-height': `${INPUT_MAX_HEIGHT_PX}px` }"
          >
            <textarea
              ref="messageInputRef"
              v-model="userInput"
              class="message-input"
              placeholder="输入你的问题...（也可点击麦克风语音输入）"
              :disabled="isRunning"
              @input="scheduleAutoResizeMessageInput"
              @compositionend="scheduleAutoResizeMessageInput"
              @keydown.enter.exact.prevent="handleSend"
              rows="1"
            ></textarea>
            <!-- 右侧操作区：附件按钮 + 发送/停止 -->
            <div class="input-trailing">
              <button
                class="input-action-btn"
                title="添加附件"
                type="button"
                :disabled="isRunning || agentIsUploading"
                @click="triggerAgentFileSelect"
              >
                <svg v-if="!agentIsUploading" class="attach-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M7.5 12.75 13.8 6.44a3.25 3.25 0 0 1 4.6 4.6l-7.14 7.14a5 5 0 1 1-7.07-7.08l7.15-7.14a.75.75 0 0 1 1.06 1.06L5.25 12.17a3.5 3.5 0 0 0 4.95 4.95l7.14-7.14a1.75 1.75 0 1 0-2.47-2.47l-6.3 6.3a.75.75 0 1 1-1.06-1.06Z"
                  />
                </svg>
                <div v-else class="loading-spinner"></div>
              </button>
              <input
                ref="agentFileInput"
                type="file"
                accept=".mp4,.mkv,.mov,video/mp4,video/x-matroska,video/matroska,video/quicktime,image/*"
                style="display: none"
                @change="handleAgentFileChange"
              />
              <button
                type="button"
                class="input-action-btn mic-btn-trailing"
                :class="{ 'mic-btn-recording': isDictating }"
                :disabled="isRunning"
                :title="isDictating ? '停止录音' : '语音输入'"
                :aria-label="isDictating ? '停止录音' : '语音输入'"
                @click="toggleDictation"
              >
                <svg
                  v-if="!isDictating"
                  xmlns="http://www.w3.org/2000/svg"
                  class="mic-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="mic-icon mic-icon-stop"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </button>
              <button
                v-if="isRunning"
                class="stop-btn-inline"
                type="button"
                @click="handleStop"
              >
                <span class="stop-icon">⏹</span>
              </button>
              <button
                v-else
                class="send-button"
                type="button"
                :disabled="!userInput.trim() || hasUnconfirmedAgentAttachments"
                @click="handleSend"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
        </template>
      </div>
    </div>

    <!-- 录音转写气泡：Teleport 到 body，固定于屏幕底部上方 -->
    <Teleport to="body">
      <Transition name="dictation-bubble">
        <div
          v-if="isDictating || dictationTranscript || dictationError"
          ref="dictationBubbleRef"
          class="dictation-bubble dictation-bubble-fixed"
          role="status"
          aria-live="polite"
        >
          <div class="dictation-bubble-content">
            <div v-if="dictationError" class="dictation-bubble-error">{{ dictationError }}</div>
            <div v-else-if="dictationTranscript" class="dictation-bubble-text">{{ dictationTranscript }}</div>
            <div v-else class="dictation-bubble-placeholder">正在聆听...</div>
          </div>
          <div class="dictation-bubble-actions">
            <button
              type="button"
              class="dictation-bubble-btn dictation-bubble-btn-primary"
              :disabled="!dictationTranscript"
              @click="submitDictationToInput"
            >
              ✅
            </button>
            <button
              type="button"
              class="dictation-bubble-btn"
              @click="cancelDictation"
            >
              ❌
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 警告/错误提示 -->
    <div v-if="errorMessage" class="toast toast-error" @click="errorMessage = ''">
      <span class="toast-icon">⚠️</span>
      <span class="toast-text">{{ errorMessage }}</span>
    </div>
    <div v-if="warnMessage" class="toast toast-warn" @click="warnMessage = ''">
      <span class="toast-icon">⚠️</span>
      <span class="toast-text">{{ warnMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { isLoggedIn, getToken } from '../stores/auth'
import { apiFetch, apiFetchRaw } from '../api/http'
import { uploadFile } from '../api/upload'
import { compressMediaAttachment, isAllowedVideoFormat } from '../utils/attachment-compress'
import Think from '../components/Think.vue'
import ToolCallCard from '../components/ToolCallCard.vue'
import GeneratedFileCard from '../components/GeneratedFileCard.vue'
import AgentHome from '../components/AgentHome.vue'
import NotificationCenter from '../components/NotificationCenter.vue'
import { transformMarkdownForStream } from '../utils/markdown'

const getAsrWsUrl = (): string => {
  const env = (import.meta as any).env
  if (env?.VITE_ASR_WS_URL) return env.VITE_ASR_WS_URL
  const protocol =
    typeof location !== 'undefined' && location.protocol === 'https:'
      ? 'wss:'
      : 'ws:'
  return `${protocol}//localhost:8123/api/ws/asr`
}

/** Float32 转 16kHz 16bit PCM（用于 ASR） */
function floatTo16BitPCM(float32Arr: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Arr.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Arr.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Arr[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

// 工具调用项（与 tool_result 成对展示）
interface ToolCallItem {
  toolCallId?: string
  toolName: string
  args: string
  result: string | null
  /** 单次工具执行耗时（毫秒），由 tool_result.cost 提供 */
  cost?: number
}

/** 解析后的生成文件项（供 GeneratedFileCard 使用） */
interface ParsedFileItem {
  fileName: string
  fileType: string
  url?: string
  contentBase64?: string
  mimeType?: string
  /** 文件大小（字节），可选 */
  size?: number
}

// 单个推理阶段（step）：包含一段推理文本及该阶段内的工具调用
interface MessageStep {
  reasoning?: string          // 该阶段的推理文本
  thinkingTime?: number       // 该阶段推理耗时(ms)
  tools?: ToolCallItem[]      // 该阶段的工具调用列表
}

// 历史消息 payload（后端 AgentMessagePayload）
interface AgentMessagePayload {
  content?: string
  reasoning?: string
  toolCallId?: string
  toolName?: string
  toolArgs?: string
  toolResult?: string
  /** 单次工具执行耗时（毫秒） */
  cost?: number
  thinkingTime?: number
  thinking_time?: number
  promptTokens?: number
  prompt_tokens?: number
  completionTokens?: number
  completion_tokens?: number
  cachedTokens?: number
  cached_tokens?: number
  tokens?: number
  token?: number
  usage?: Record<string, unknown>
  stats?: Record<string, unknown>
  meta?: Record<string, unknown>
}

// 类型定义
interface Message {
  role: 'user' | 'assistant'
  content: string
  /** 本条助手消息的推理阶段(step) 列表 */
  steps?: MessageStep[]
  thinkingExpanded?: boolean
  /** 整体推理耗时（毫秒），用于在推理卡片头部展示 */
  thinkingTime?: number
  /** usage 统计字段：提示/补全/缓存 token */
  promptTokens?: number
  completionTokens?: number
  cachedTokens?: number
  /** usage 统计字段：总耗时（毫秒）与总 token 数 */
  cost?: number
  tokens?: number
}

interface UsageStats {
  thinkingTime?: number
  promptTokens?: number
  completionTokens?: number
  cachedTokens?: number
  cost?: number
  tokens?: number
}

const FILE_TOOL_NAMES = ['writeFile', 'generatePDF', 'generateExcel']
function isFileTool(toolName: string): boolean {
  return FILE_TOOL_NAMES.some((n) => (toolName || '').toLowerCase() === n.toLowerCase())
}
function getExt(pathOrName: string): string {
  if (!pathOrName) return ''
  const lastDot = pathOrName.lastIndexOf('.')
  return lastDot >= 0 ? pathOrName.slice(lastDot + 1).toLowerCase() : ''
}
function getFileNameFromPath(pathStr: string): string {
  if (!pathStr) return ''
  const norm = pathStr.replace(/\\/g, '/')
  return norm.split('/').pop() || pathStr
}
function getDefaultExtByTool(toolName: string): string {
  const n = (toolName || '').toLowerCase()
  if (n === 'generatepdf') return 'pdf'
  if (n === 'generateexcel') return 'xlsx'
  return ''
}
function parseFileToolResult(toolName: string, result: string | null): ParsedFileItem[] {
  if (!result) return []
  let obj: unknown
  try {
    obj = JSON.parse(result)
  } catch {
    return []
  }
  const defaultExt = getDefaultExtByTool(toolName)
  const items: ParsedFileItem[] = []
  const push = (raw: Record<string, unknown>) => {
    const path = String(raw.path ?? raw.filePath ?? '')
    const url = typeof raw.url === 'string' ? raw.url : ''
    const name = String(raw.fileName ?? raw.name ?? raw.filename ?? '')
    const content = raw.content ?? raw.contentBase64 ?? raw.data
    const contentBase64 = typeof content === 'string' ? content : ''
    const rawType = String(raw.fileType ?? raw.type ?? raw.extension ?? '')
    // 兼容 MIME（application/pdf 等）与扩展名
    let typeFromResult = rawType.toLowerCase()
    if (typeFromResult.includes('/')) {
      if (typeFromResult.includes('pdf')) typeFromResult = 'pdf'
      else if (
        typeFromResult.includes('excel') ||
        typeFromResult.includes('spreadsheet') ||
        typeFromResult.includes('sheet') ||
        typeFromResult.includes('xls')
      ) {
        typeFromResult = 'xlsx'
      } else if (typeFromResult.includes('markdown') || typeFromResult.includes('md')) {
        typeFromResult = 'md'
      } else if (typeFromResult.includes('json')) {
        typeFromResult = 'json'
      } else if (typeFromResult.includes('html')) {
        typeFromResult = 'html'
      } else if (typeFromResult.includes('css')) {
        typeFromResult = 'css'
      } else if (typeFromResult.includes('plain')) {
        typeFromResult = 'txt'
      }
    }
    const fileName = name || getFileNameFromPath(path) || (defaultExt ? `file.${defaultExt}` : 'download')
    const fileType = typeFromResult || getExt(fileName) || getExt(path) || defaultExt
    const sizeRaw = raw.size ?? raw.fileSize ?? raw.length ?? raw.bytes
    const size = typeof sizeRaw === 'number' ? sizeRaw : Number(sizeRaw)
    if (!url && !contentBase64) return
    items.push({
      fileName,
      fileType,
      url: url || undefined,
      contentBase64: contentBase64 || undefined,
      mimeType: typeof raw.mimeType === 'string' ? raw.mimeType : undefined,
      size: Number.isFinite(size) && size > 0 ? size : undefined
    })
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (item && typeof item === 'object') push(item as Record<string, unknown>)
    })
  } else if (obj && typeof obj === 'object') {
    const rec = obj as Record<string, unknown>
    if (Array.isArray(rec.files)) {
      rec.files.forEach((item: unknown) => {
        if (item && typeof item === 'object') push(item as Record<string, unknown>)
      })
    } else {
      push(rec)
    }
  }
  return items
}
function getParsedFiles(tc: ToolCallItem): ParsedFileItem[] {
  if (!isFileTool(tc.toolName)) return []
  return parseFileToolResult(tc.toolName, tc.result)
}

// 创建会话 API 返回（与后端 AgentSessionVO 一致；sessionId 用 string 避免精度丢失）
interface AgentSessionVO {
  sessionId: string | number
  title?: string
  lastMessage?: string
  createTime?: string
  updateTime?: string
}

// 路由
const route = useRoute()
const router = useRouter()

function goBack() {
  if (runAbortController) {
    runAbortController.abort()
    runAbortController = null
    isRunning.value = false
  }
  // 返回到智能体首页（AgentHome）
  router.push({ path: '/agent' })
}

// 响应式数据
const messages = ref<Message[]>([])
const currentMessage = reactive<Message>({
  role: 'assistant',
  content: '',
  steps: [],
  thinkingExpanded: false
})
/** 当前流式推理阶段（暂存，step_start/done 时推入当前消息的 steps 中） */
const currentStep = reactive<MessageStep>({
  reasoning: '',
  thinkingTime: undefined,
  tools: []
})
/** 当前 step 的推理开始时间（毫秒） */
let currentStepStartedAt: number | undefined
const userInput = ref('')
const messageInputRef = ref<HTMLTextAreaElement | null>(null)
// 输入框自动增高的最大高度（px）。需要调整最大高度时改这里即可。
const INPUT_MAX_HEIGHT_PX = 150

function autoResizeMessageInput() {
  const el = messageInputRef.value
  if (!el) return

  // 先重置高度，让 scrollHeight 反映真实内容高度（包含换行）
  el.style.height = 'auto'
  const next = Math.min(Math.max(el.scrollHeight, 28), INPUT_MAX_HEIGHT_PX)
  el.style.height = `${next}px`
  el.style.overflowY = el.scrollHeight > INPUT_MAX_HEIGHT_PX ? 'auto' : 'hidden'
}

let resizeRaf = 0
function scheduleAutoResizeMessageInput() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0
    autoResizeMessageInput()
  })
}
// --------- 附件（参考 Chat.vue，简化版） ----------
interface AgentAttachment {
  id: string
  file: File
  status: 'uploading' | 'done' | 'error'
  progress: number
  fileUrl?: string
  attachmentId?: string | number
  error?: string
}
const agentAttachments = ref<AgentAttachment[]>([])
const agentFileInput = ref<HTMLInputElement | null>(null)
const agentIsUploading = ref(false)
const hasUnconfirmedAgentAttachments = computed(() =>
  agentAttachments.value.some((a) => a.status === 'uploading')
)
const isRunning = ref(false)
const errorMessage = ref('')
const warnMessage = ref('')
const messagesLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
// 是否自动滚动到底部（用户上滑则暂时关闭自动滚动，回到底部后重新开启）
const autoScrollToBottom = ref(true)
let runAbortController: AbortController | null = null
let currentSessionId: string | null = null
// 从首页「开始智能体」进入的待创建会话：首条消息发送时再调用 createSession 并加入列表，不在此前插入占位
const pendingNewSessionId = ref<string | null>(null)

// 听写（ASR）状态与逻辑（参考 Chat.vue）
const isDictating = ref(false)
const dictationTranscript = ref('') // 实时识别结果（含中间结果）
const dictationError = ref('')
const dictationBubbleRef = ref<HTMLElement | null>(null)
let dictationWs: WebSocket | null = null
let dictationStream: MediaStream | null = null
let dictationCtx: AudioContext | null = null
let dictationWorkletNode: AudioWorkletNode | null = null
let dictationSource: MediaStreamAudioSourceNode | null = null

async function startDictation() {
  dictationError.value = ''
  dictationTranscript.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    dictationStream = stream
    const ctx = new AudioContext({ sampleRate: 16000 })
    dictationCtx = ctx

    await ctx.audioWorklet.addModule(
      typeof import.meta.env?.BASE_URL === 'string'
        ? `${import.meta.env.BASE_URL}dictation-processor.js`
        : '/dictation-processor.js'
    )
    const workletNode = new AudioWorkletNode(ctx, 'dictation-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    })
    dictationWorkletNode = workletNode

    const source = ctx.createMediaStreamSource(stream)
    dictationSource = source

    const wsUrl = getAsrWsUrl()
    const ws = new WebSocket(wsUrl)
    dictationWs = ws

    workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
      if (dictationWs?.readyState !== WebSocket.OPEN) return
      const pcm = floatTo16BitPCM(e.data)
      dictationWs.send(pcm)
    }

    ws.onopen = () => {
      isDictating.value = true
    }
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as { text?: string; final?: boolean }
        const text = (msg.text ?? '').trim()
        if (!text) return
        if (msg.final) {
          dictationTranscript.value += (dictationTranscript.value.endsWith(' ') ? '' : ' ') + text + ' '
        }
      } catch (_) {}
    }
    ws.onerror = () => {
      dictationError.value = '听写连接异常'
    }
    ws.onclose = () => {
      isDictating.value = false
    }

    source.connect(workletNode)
    workletNode.connect(ctx.destination)
    isDictating.value = true
  } catch (err) {
    dictationError.value = err instanceof Error ? err.message : '无法访问麦克风'
  }
}

function stopDictation() {
  if (dictationWs) {
    dictationWs.close()
    dictationWs = null
  }
  if (dictationWorkletNode && dictationSource && dictationCtx) {
    dictationWorkletNode.disconnect()
    dictationSource.disconnect()
    dictationWorkletNode = null
    dictationSource = null
  }
  if (dictationCtx) {
    dictationCtx.close().catch(() => {})
    dictationCtx = null
  }
  if (dictationStream) {
    dictationStream.getTracks().forEach((t) => t.stop())
    dictationStream = null
  }
  isDictating.value = false
}

function submitDictationToInput() {
  if (isDictating.value) stopDictation()
  const text = dictationTranscript.value.trim()
  if (text) {
    const cur = userInput.value
    userInput.value = cur ? cur + (cur.endsWith(' ') ? '' : ' ') + text : text
  }
  dictationTranscript.value = ''
  dictationError.value = ''
}

function cancelDictation() {
  if (isDictating.value) stopDictation()
  dictationTranscript.value = ''
  dictationError.value = ''
}

/** 一键切换录音：开始 / 停止（ChatGPT 风格） */
function toggleDictation() {
  if (isRunning.value) return
  if (isDictating.value) {
    stopDictation()
  } else {
    startDictation()
  }
}

watch(dictationTranscript, () => {
  nextTick(() => {
    const el = dictationBubbleRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
})

// 从路由获取 sessionId（后端为 Long/bigint，前端用 string 避免精度丢失）
const sessionIdFromRoute = computed(() => {
  const id = route.query.sessionId
  return (id != null && id !== '') ? String(id) : null
})

// 生成 bigint 类型的 SessionId（以字符串形式传递，避免 JS Number 精度问题）
function generateSessionId(): string {
  const t = BigInt(Date.now()) * 1000000n
  const r = BigInt(Math.floor(Math.random() * 1000000))
  return (t + r).toString()
}

// 是否展示首页（无 sessionId 时）
const showHome = computed(() => !sessionIdFromRoute.value)

// 右侧栏会话列表（id 全程用 string，避免 bigint 精度丢失）
const agentSessions = ref<Array<{ id: string; title?: string; lastMessage?: string; updateTime?: number }>>([])
const agentSessionsLoading = ref(false)

function upsertLocalAgentSession(session: {
  id: string
  title?: string
  lastMessage?: string
  updateTime?: number
}) {
  const next = {
    ...session,
    updateTime: session.updateTime ?? Date.now()
  }
  const idx = agentSessions.value.findIndex((s) => s.id === next.id)
  if (idx >= 0) {
    const old = agentSessions.value[idx]
    agentSessions.value.splice(idx, 1)
    agentSessions.value.unshift({
      ...old,
      ...next
    })
  } else {
    agentSessions.value.unshift(next)
  }
  window.dispatchEvent(
    new CustomEvent('agent:new-conversation', {
      detail: {
        id: next.id,
        title: next.title,
        lastMessage: next.lastMessage,
        updateTime: next.updateTime
      }
    })
  )
}

async function loadAgentSessions() {
  agentSessionsLoading.value = true
  try {
    const res = await apiFetch<any[]>('/api/agent/sessions', {
      credentials: 'include' 
    })
    if (!res.ok || !('json' in res)) return
    const json = res.json
    if (json?.code === 200 && Array.isArray(json.data)) {
      agentSessions.value = (json.data as any[]).map((s: any) => ({
        id: String(s.sessionId),
        title: s.title,
        lastMessage: s.lastMessage,
        updateTime: s.updateTime
      }))
    }
  } finally {
    agentSessionsLoading.value = false
  }
}

function openAgentSession(sessionId: string) {
  router.push({ path: '/agent', query: { sessionId } })
}

async function handleStartConversation() {
  // 先本地预插入一个“新任务”占位，保证侧边栏即时可见
  const newId = generateSessionId()
  currentSessionId = newId
  pendingNewSessionId.value = newId
  upsertLocalAgentSession({
    id: newId,
    title: '新任务',
    lastMessage: ''
  })

  router.push({ path: '/agent', query: { sessionId: newId } })
}

// 触发附件选择
function triggerAgentFileSelect() {
  agentFileInput.value?.click()
}

async function addAgentFile(file: File) {
  if (!file) return
  // 未登录禁止上传附件
  if (!isLoggedIn()) {
    warnMessage.value = '请先登录后再上传附件'
    setTimeout(() => (warnMessage.value = ''), 3000)
    return
  }
  if (agentAttachments.value.length >= 2) {
    warnMessage.value = '最多只能上传 2 个附件'
    setTimeout(() => (warnMessage.value = ''), 3000)
    return
  }
  if (!isAllowedVideoFormat(file)) {
    warnMessage.value = '视频仅支持 mp4 / mkv / mov 格式'
    setTimeout(() => (warnMessage.value = ''), 3000)
    return
  }
  const sessionId = currentSessionId ?? sessionIdFromRoute.value
  if (!sessionId) {
    warnMessage.value = '请先开始会话再上传附件'
    setTimeout(() => (warnMessage.value = ''), 3000)
    return
  }
  const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const item: AgentAttachment = {
    id,
    file,
    status: 'uploading',
    progress: 0
  }
  agentAttachments.value.push(item)
  agentIsUploading.value = true
  try {
    const compressed = await compressMediaAttachment(file)
    // 压缩期间用户可能删除了该附件，删除后不再继续上传
    const stillExists = agentAttachments.value.some((a) => a.id === id)
    if (!stillExists) return

    const fileToUpload = compressed.file
    const uploadSize = typeof fileToUpload.size === 'number' ? fileToUpload.size : 0
    const fileName = compressed.fileName ?? file.name ?? ''
    const fileType = compressed.fileType ?? file.type ?? ''
    const { fileUrl, attachmentId } = await uploadFile(fileToUpload, {
      conservation_id: String(sessionId),
      fileSize: uploadSize,
      fileName,
      fileType
    })
    const idx = agentAttachments.value.findIndex((a) => a.id === id)
    if (idx !== -1) {
      agentAttachments.value[idx] = {
        ...agentAttachments.value[idx],
        status: 'done',
        progress: 100,
        fileUrl,
        attachmentId: attachmentId ?? agentAttachments.value[idx].attachmentId
      }
    }
  } catch (e: any) {
    const idx = agentAttachments.value.findIndex((a) => a.id === id)
    if (idx !== -1) {
      agentAttachments.value[idx] = {
        ...agentAttachments.value[idx],
        status: 'error',
        error: String(e?.message || '上传失败'),
        progress: 0
      }
    }
  } finally {
    agentIsUploading.value = false
  }
}

// 处理文件选择
async function handleAgentFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target?.files?.length) return
  for (let i = 0; i < target.files.length && agentAttachments.value.length < 2; i++) {
    await addAgentFile(target.files[i])
  }
  target.value = ''
}

// 删除附件
function removeAgentAttachment(id: string) {
  agentAttachments.value = agentAttachments.value.filter((a) => a.id !== id)
}

function getAgentFileExt(fileName: string): string {
  const name = String(fileName || '')
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot >= name.length - 1) return 'FILE'
  return name.slice(dot + 1).toUpperCase().slice(0, 4)
}

function isAgentTextLikeFile(fileName: string, fileType: string): boolean {
  const type = String(fileType || '').toLowerCase()
  if (type.startsWith('text/')) return true
  const ext = getAgentFileExt(fileName).toLowerCase()
  return ['csv', 'txt', 'md', 'json', 'xml', 'yml', 'yaml', 'log'].includes(ext)
}

// 已废弃的基于 stepIndex / reasoningBlocks 的逻辑移除

// Markdown 渲染（历史消息用 marked；当前条流式时用 transformMarkdownForStream 以支持流式解析与光标）
function getAssistantMessageHtml(msg: Message, index: number): string {
  const text = msg.content || ''
  const isStreamingLast =
    msg.role === 'assistant' &&
    isRunning.value &&
    index === messages.value.length - 1
  if (isStreamingLast) {
    return transformMarkdownForStream(text, { appendCursor: true, allowEmpty: true })
  }
  if (!text) return ''
  return marked(text, { breaks: true }) as string
}

// JSON 格式化
function formatJson(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

// 滚动到底部
function scrollToBottom(force = false) {
  nextTick(() => {
    const el = messagesContainer.value
    if (!el) return
    // 当用户手动上滑时，不再自动滚动；强制滚动时忽略该开关
    if (!force && !autoScrollToBottom.value) return
    el.scrollTop = el.scrollHeight
  })
}

// 监听消息列表滚动，判断用户是否上滑离开底部区域
function handleMessagesScroll() {
  const el = messagesContainer.value
  if (!el) return
  const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
  const THRESHOLD = 60 // 距离底部 60px 内都认为在“底部”
  // 只要离开底部阈值，就认为用户在浏览历史，关闭自动滚动
  autoScrollToBottom.value = distanceToBottom <= THRESHOLD
}

// 生成 UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 创建会话：使用传入的 SessionId；若未传则内部生成一个
async function createSession(message: string, sessionId?: string): Promise<string> {
  const sid = sessionId ?? generateSessionId()
  const response = await apiFetch<AgentSessionVO>('/api/agent/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ message, SessionId: sid }),
    credentials: 'include'
  })

  if (!response.ok || !('json' in response)) {
    throw new Error('创建会话失败')
  }

  const result = response.json as { code: number; message?: string; data?: AgentSessionVO }
  if (result.code !== 200 || result.data?.sessionId == null) {
    throw new Error(result.message || '创建会话失败')
  }

  // 通知右侧会话列表刷新
  window.dispatchEvent(new CustomEvent('agent-sessions:updated'))

  // 返回最终使用的 sessionId（后端可能会回传同一个 Long）
  return String(result.data.sessionId ?? sid)
}

// 安全地将任意值转为有限数字（无效或缺失时返回 undefined）
function toFiniteNumber(v: any): number | undefined {
  if (v == null) return undefined
  if (typeof v === 'string' && v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function parseUsageStats(...candidates: any[]): UsageStats {
  const containers: Record<string, any>[] = []
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue
    const obj = candidate as Record<string, any>
    containers.push(obj)
    if (obj.usage && typeof obj.usage === 'object') containers.push(obj.usage)
    if (obj.stats && typeof obj.stats === 'object') containers.push(obj.stats)
    if (obj.meta && typeof obj.meta === 'object') containers.push(obj.meta)
  }

  const pick = (...keys: string[]) => {
    for (const container of containers) {
      for (const key of keys) {
        const value = toFiniteNumber(container[key])
        if (value != null) return value
      }
    }
    return undefined
  }

  return {
    thinkingTime: pick('thinkingTime', 'thinking_time'),
    promptTokens: pick('promptTokens', 'prompt_tokens'),
    completionTokens: pick('completionTokens', 'completion_tokens'),
    cachedTokens: pick('cachedTokens', 'cached_tokens'),
    cost: pick('cost'),
    tokens: pick('tokens', 'token')
  }
}

function addUsageStats(target: Message, stats: UsageStats) {
  if (stats.thinkingTime != null) target.thinkingTime = (target.thinkingTime ?? 0) + stats.thinkingTime
  if (stats.promptTokens != null) target.promptTokens = (target.promptTokens ?? 0) + stats.promptTokens
  if (stats.completionTokens != null) target.completionTokens = (target.completionTokens ?? 0) + stats.completionTokens
  if (stats.cachedTokens != null) target.cachedTokens = (target.cachedTokens ?? 0) + stats.cachedTokens
  if (stats.cost != null) target.cost = (target.cost ?? 0) + stats.cost
  if (stats.tokens != null) target.tokens = (target.tokens ?? 0) + stats.tokens
}

/** 从 SSE data 中解析出要拼接的文本。兼容 JSON：{"type":"reasoning"|"text","content":"..."}，只返回 content；
 * 若同一段 data 内有多段 JSON 首尾相连，则逐段解析并拼接所有 content */
function parseStreamContent(data: string, expectedType: 'reasoning' | 'text'): string {
  if (!data || typeof data !== 'string') return ''
  const s = data.trim()
  if (!s) return ''
  const parts: string[] = []
  // 尝试按 }\s*{ 拆成多段，兼容后端一次推送多段 JSON 的情况
  const chunks = s.split(/\}\s*\{/)
  for (let i = 0; i < chunks.length; i++) {
    const jsonStr = i === 0
      ? chunks[0] + (chunks.length > 1 ? '}' : '')
      : chunks[i]
    try {
      const parsed = JSON.parse(jsonStr)
      if (parsed && typeof parsed === 'object' && parsed.type === expectedType && 'content' in parsed) {
        parts.push(String(parsed.content ?? ''))
        continue
      }
    } catch {
      // 当前段不是合法 JSON，忽略
    }
    // 若只有一段且无法解析为预期 JSON，整段当作纯文本（兼容非 JSON 流）
    if (chunks.length === 1) return s
  }
  return parts.join('')
}

// 发送消息
async function handleSend() {
  const text = userInput.value.trim()
  if (!text || isRunning.value) return

  // 发送时若正在语音输入，先停掉，避免占用麦克风与 UI 状态冲突
  if (isDictating.value) {
    stopDictation()
    dictationTranscript.value = ''
    dictationError.value = ''
  }

  // 添加用户消息
  messages.value.push({ role: 'user', content: text })
  userInput.value = ''
  await nextTick()
  scheduleAutoResizeMessageInput()
  scrollToBottom()

  // 重置状态
  currentMessage.role = 'assistant'
  currentMessage.content = ''
  currentMessage.thinkingTime = undefined
  currentMessage.thinkingExpanded = false
  currentMessage.steps = []
  currentStep.reasoning = ''
  currentStep.tools = []
  currentStep.thinkingTime = undefined
  currentStepStartedAt = undefined
  errorMessage.value = ''
  warnMessage.value = ''
  isRunning.value = true

  try {
    // 如果还没有会话 ID，则本地先生成一个（不会阻塞首条消息发送）
    if (!currentSessionId) {
      currentSessionId = generateSessionId()
      upsertLocalAgentSession({
        id: currentSessionId,
        title: text,
        lastMessage: text,
        updateTime: Date.now()
      })
      void createSession(text, currentSessionId).catch((e) => {
        console.error('后台创建会话失败:', e)
      })
    } else if (pendingNewSessionId.value) {
      // 从首页「开始智能体」进来的待创建会话：首条消息时创建会话并加入列表
      const sid = currentSessionId
      upsertLocalAgentSession({
        id: sid,
        title: text,
        lastMessage: text,
        updateTime: Date.now()
      })
      void createSession(text, sid).catch((e) => {
        console.error('后台创建会话失败:', e)
      })
      pendingNewSessionId.value = null
    }
    // 在后台并行异步创建会话，不阻塞 /run
    // POST + SSE 流，请求体为 AgentSendReq，已登录时请求头携带 Authorization
    const url = '/api/agent/run'
    const token = getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) headers['Authorization'] = token

    // 收集已完成的附件 id 传给后端
    const doneAttachments = agentAttachments.value.filter(
      (a) => a.status === 'done' && a.attachmentId != null && a.fileUrl
    )
    const attachmentIds = doneAttachments.map((a) => String(a.attachmentId))

    const body: Record<string, unknown> = {
      sessionId: currentSessionId,
      token: token,
      message: text,
      messageId:
        crypto.randomUUID?.() ??
        `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      attachments: attachmentIds
    }
    if (token) body.token = token

    runAbortController = new AbortController()
    const res = await apiFetchRaw(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
      signal: runAbortController.signal
    })
    if (!res.ok || !res.body) {
      errorMessage.value = res.statusText || '请求失败'
      isRunning.value = false
      return
    }
    // 先插入一条当前助手消息，便于流式更新推理和正文（流式渲染）
    messages.value.push({
      role: 'assistant',
      content: '',
      steps: [],
      thinkingExpanded: false,
      thinkingTime: undefined
    })
    // 辅助函数：将当前 step 推入当前消息的 steps 列表（用于 step_start / done）
    const pushCurrentStepIfNeeded = () => {
      const hasReasoning = !!(currentStep.reasoning && currentStep.reasoning.trim())
      const hasTools = !!(currentStep.tools && currentStep.tools.length)
      if (!hasReasoning && !hasTools) {
        currentStepStartedAt = undefined
        return
      }
      const now = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now()
      const stepTime =
        currentStepStartedAt != null
          ? Math.max(0, Math.round(now - currentStepStartedAt))
          : currentStep.thinkingTime
      const step: MessageStep = {
        reasoning: currentStep.reasoning,
        thinkingTime: stepTime,
        tools: currentStep.tools ? [...currentStep.tools] : []
      }
      if (!currentMessage.steps) currentMessage.steps = []
      currentMessage.steps.push(step)
      // 重置临时 step
      currentStep.reasoning = ''
      currentStep.tools = []
      currentStep.thinkingTime = undefined
      currentStepStartedAt = undefined
    }

    const updateLastAssistantFromCurrent = () => {
      const last = messages.value[messages.value.length - 1]
      if (last?.role === 'assistant') {
        messages.value[messages.value.length - 1] = {
          ...last,
          content: currentMessage.content,
          steps: currentMessage.steps ? [...currentMessage.steps] : []
        }
      }
    }

    const dispatch = (event: string, data: string) => {
      switch (event) {
        case 'reasoning': {
          const reasoningChunk = parseStreamContent(data, 'reasoning')
          if (reasoningChunk) {
            // 开始新的推理阶段计时
            if (currentStepStartedAt == null) {
              const now = (typeof performance !== 'undefined' && performance.now)
                ? performance.now()
                : Date.now()
              currentStepStartedAt = now
            }
            currentStep.reasoning = (currentStep.reasoning || '') + reasoningChunk
            // 更新当前 step 的耗时（用于流式“正在思考”展示）
            if (currentStepStartedAt != null) {
              const now = (typeof performance !== 'undefined' && performance.now)
                ? performance.now()
                : Date.now()
              currentStep.thinkingTime = Math.max(0, Math.round(now - currentStepStartedAt))
            }
          }
          updateLastAssistantFromCurrent()
          scrollToBottom()
          break
        }
        case 'text': {
          // 兼容 JSON 格式 {"type":"text","content":"..."}，只拼接 content 文本
          const textChunk = parseStreamContent(data, 'text')
          currentMessage.content += textChunk
          updateLastAssistantFromCurrent()
          scrollToBottom()
          break
        }
        case 'step_start': {
          // 阶段切换：将当前 step 推入 steps，后续 reasoning / 工具归入新的 step
          pushCurrentStepIfNeeded()
          updateLastAssistantFromCurrent()
          scrollToBottom()
          break
        }
        case 'tool_call': {
          try {
            const obj = typeof data === 'string' ? JSON.parse(data) : data
            const toolName = obj?.meta?.toolName ?? obj?.toolName ?? 'unknown'
            const args = typeof obj?.content === 'string' ? obj.content : JSON.stringify(obj?.content ?? '')
            if (!currentStep.tools) currentStep.tools = []
            currentStep.tools.push({ toolName, args, result: null })
            updateLastAssistantFromCurrent()
          } catch (e) {
            console.warn('tool_call parse error', e)
          }
          break
        }
        case 'tool_result': {
          try {
            const obj = typeof data === 'string' ? JSON.parse(data) : data
            const content = typeof obj?.content === 'string' ? obj.content : JSON.stringify(obj?.content ?? '')
            // 优先匹配当前 step 中最后一个工具
            let target: ToolCallItem | undefined
            if (currentStep.tools && currentStep.tools.length) {
              target = currentStep.tools[currentStep.tools.length - 1]
            }
            // 若当前 step 未找到，则从已落盘 steps 中自后向前寻找
            if (!target && currentMessage.steps && currentMessage.steps.length) {
              for (let si = currentMessage.steps.length - 1; si >= 0 && !target; si--) {
                const tools = currentMessage.steps[si].tools || []
                for (let ti = tools.length - 1; ti >= 0; ti--) {
                  if (tools[ti].result == null) {
                    target = tools[ti]
                    break
                  }
                }
              }
            }
            if (target) {
              target.result = content
              // 从 tool_result 的 meta 中提取 cost（耗时，毫秒）
              const meta = obj?.meta ?? {}
              const cost = toFiniteNumber(meta.cost ?? obj.cost)
              if (cost != null) target.cost = cost
              updateLastAssistantFromCurrent()
            }
          } catch (e) {
            console.warn('tool_result parse error', e)
          }
          break
        }
        case 'warn':
          warnMessage.value = data
          setTimeout(() => (warnMessage.value = ''), 5000)
          break
        case 'error':
          errorMessage.value = data || '发生错误'
          closeEventSource()
          // 若当前助手条无内容，移除占位条
          const errLast = messages.value[messages.value.length - 1]
          const errHasSteps = (errLast?.steps?.length ?? 0) > 0
          if (errLast?.role === 'assistant' && !errLast.content && !errHasSteps) {
            messages.value.pop()
          }
          break
        case 'done': {
          // 解析 usage 统计数据（thinkingTime / promptTokens / completionTokens / cachedTokens / cost / tokens）
          let stats: any = null
          if (data) {
            try {
              stats = JSON.parse(data)
            } catch {
              stats = null
            }
          }

          const lastMsg = messages.value[messages.value.length - 1]
          if (lastMsg?.role === 'assistant') {
            if (stats && typeof stats === 'object') {
              const usage = parseUsageStats(stats)
              addUsageStats(lastMsg, usage)
              currentMessage.thinkingTime = lastMsg.thinkingTime
            }

            // 将当前未结束的 step 推入 steps
            pushCurrentStepIfNeeded()
            currentMessage.content = currentMessage.content
            lastMsg.content = currentMessage.content
            lastMsg.steps = currentMessage.steps ? [...currentMessage.steps] : []
          }
          const hasAnySteps = lastMsg?.role === 'assistant' && ((lastMsg.steps?.length ?? 0) > 0)
          if (lastMsg?.role === 'assistant' && !lastMsg.content && !hasAnySteps) {
            messages.value.pop()
          }
          // 本轮结束后重置临时状态，下一轮重新开始
          currentMessage.content = ''
          currentMessage.steps = []
          currentStep.reasoning = ''
          currentStep.tools = []
          currentStep.thinkingTime = undefined
          currentStepStartedAt = undefined
          closeEventSource()
          scrollToBottom()
          window.dispatchEvent(new CustomEvent('agent-sessions:updated'))
          break
        }
      }
    }

    let buf = ''
    let eventType = ''
    let dataLines: string[] = []
    const decoder = new TextDecoder()
    const reader = res.body.getReader()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split(/\n/)
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5))
          } else if (line === '') {
            if (eventType && dataLines.length) {
              const data = dataLines.join('\n').trim()
              dispatch(eventType, data)
            }
            eventType = ''
            dataLines = []
          }
        }
      }
      if (eventType && dataLines.length) {
        dispatch(eventType, dataLines.join('\n').trim())
      }
      if (isRunning.value) {
        closeEventSource()
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError' && isRunning.value) {
        errorMessage.value = '连接中断'
      }
      closeEventSource()
    }

  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '发送失败'
    isRunning.value = false
  }
}

watch(
  userInput,
  () => {
    scheduleAutoResizeMessageInput()
  },
  { flush: 'post' }
)

onMounted(() => {
  scheduleAutoResizeMessageInput()
})

// 停止运行
async function handleStop() {
  if (!currentSessionId) return

  // 先本地停止流式连接，按钮立刻从“停止”恢复为“发送”
  closeEventSource()

  try {
    await apiFetch(`/api/agent/cancel?sessionId=${currentSessionId}`, {
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    console.error('取消失败:', error)
  }
}

// 关闭 SSE 连接（中止 fetch 流）
function closeEventSource() {
  if (runAbortController) {
    runAbortController.abort()
    runAbortController = null
  }
  isRunning.value = false
}

// 加载历史消息（后端 AgentMessageVO: type=user|assistant|tool|tool_result，payload 为 AgentMessagePayload JSON）
// 目标：还原“一整轮助手回复”的结构：step0(reasoning + tools) → step1(reasoning + tools) → ... → 正文
async function loadMessages(sessionId: string) {
  messagesLoading.value = true
  try {
    const response = await apiFetch<any[]>(`/api/agent/messages?sessionId=${sessionId}`, {
      credentials: 'include'
    })

    if (!response.ok || !('json' in response)) {
      messagesLoading.value = false
      return
    }

    const result = response.json
    if (result.code === 200 && Array.isArray(result.data)) {
      const history: Message[] = []

      const parsePayload = (payload: unknown): AgentMessagePayload => {
        if (!payload) return {}
        if (typeof payload === 'string') {
          try {
            return JSON.parse(payload) as AgentMessagePayload
          } catch {
            // 兜底：当作纯文本 content
            return { content: payload }
          }
        }
        return payload as AgentMessagePayload
      }

      // 当前正在还原的一轮助手回复
      let currentAssistant: Message | null = null
      let currentSteps: MessageStep[] = []
      let currentStepForHistory: MessageStep | null = null

      const pushCurrentStepHistory = () => {
        if (!currentStepForHistory) return
        const hasReasoning = !!(currentStepForHistory.reasoning && currentStepForHistory.reasoning.trim())
        const hasTools = !!(currentStepForHistory.tools && currentStepForHistory.tools.length)
        if (!hasReasoning && !hasTools) return
        currentSteps.push({
          reasoning: currentStepForHistory.reasoning,
          thinkingTime: currentStepForHistory.thinkingTime,
          tools: currentStepForHistory.tools ? [...currentStepForHistory.tools] : []
        })
        currentStepForHistory = null
      }

      const finishCurrentAssistant = () => {
        if (!currentAssistant) return
        pushCurrentStepHistory()
        currentAssistant.steps = currentSteps.length ? currentSteps : undefined
        history.push(currentAssistant)
        currentAssistant = null
        currentSteps = []
        currentStepForHistory = null
      }

      for (const raw of result.data as any[]) {
        const type: string = raw.type
        const payload: AgentMessagePayload = parsePayload(raw.payload)

        if (type === 'user') {
          // 一轮助手结束，先收尾
          finishCurrentAssistant()
          history.push({
            role: 'user',
            content: payload.content || '',
            thinkingExpanded: false
          })
          continue
        }

        if (type === 'assistant') {
          const content = payload.content || ''
          const reasoning = payload.reasoning || ''

          // 每遇到一条 assistant，都开启一个新的 step
          if (!currentAssistant) {
            currentAssistant = {
              role: 'assistant',
              content: '',
              thinkingExpanded: false
            }
            currentSteps = []
            currentStepForHistory = null
          } else {
            // 之前的 step 收尾，开启新 step
            pushCurrentStepHistory()
          }

          currentStepForHistory = {
            reasoning: reasoning || undefined,
            tools: []
          }

          // 合并 assistant 的正文内容到当前轮次
          currentAssistant.content += content

          // 绑定统计字段：assistant 轮次累计 + 当前 step 的 thinkingTime
          const usage = parseUsageStats(raw, payload)
          if (usage.thinkingTime != null && currentStepForHistory) {
            currentStepForHistory.thinkingTime = usage.thinkingTime
          }
          addUsageStats(currentAssistant, usage)

          continue
        }

        if (type === 'tool') {
          if (!currentAssistant) {
            // 没有 assistant 容器时跳过，避免结构错乱
            continue
          }
          if (!currentStepForHistory) {
            currentStepForHistory = { tools: [] }
          }
          if (!currentStepForHistory.tools) currentStepForHistory.tools = []
          currentStepForHistory.tools.push({
            toolCallId: payload.toolCallId || undefined,
            toolName: payload.toolName || 'unknown',
            args: payload.toolArgs || '',
            result: null,
            cost: undefined
          })
          continue
        }

        if (type === 'tool_result') {
          if (!currentAssistant || !currentStepForHistory || !currentStepForHistory.tools?.length) continue
          const id = payload.toolCallId
          let target: ToolCallItem | undefined

          if (id) {
            for (let i = currentStepForHistory.tools.length - 1; i >= 0; i--) {
              if (currentStepForHistory.tools[i].toolCallId === id) {
                target = currentStepForHistory.tools[i]
                break
              }
            }
          }

          if (!target && payload.toolName) {
            for (let i = currentStepForHistory.tools.length - 1; i >= 0; i--) {
              if (
                currentStepForHistory.tools[i].toolName === payload.toolName &&
                currentStepForHistory.tools[i].result === null
              ) {
                target = currentStepForHistory.tools[i]
                break
              }
            }
          }

          if (target) {
            target.result = payload.toolResult ?? ''
            const toolCost = toFiniteNumber(payload.cost ?? (raw as any).cost)
            if (toolCost != null) target.cost = toolCost
          }
          continue
        }
      }

      // 文件尾还有一轮助手未收尾
      finishCurrentAssistant()

      messages.value = history
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载历史消息失败:', error)
  } finally {
    messagesLoading.value = false
  }
}

// 监听路由 sessionId：点击侧边栏智能体 session-item 时拉取该会话消息并渲染
watch(
  sessionIdFromRoute,
  (newId) => {
    currentSessionId = newId
    // 切换到其他会话时清除「待创建」标记，避免误走首条消息创建逻辑
    if (newId && newId !== pendingNewSessionId.value) {
      pendingNewSessionId.value = null
    }
    if (newId) {
      loadMessages(newId)
    } else {
      messages.value = []
    }
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  if (route.path === '/agent') loadAgentSessions()
  window.addEventListener('agent-sessions:updated', loadAgentSessions)
})
onBeforeUnmount(() => {
  closeEventSource()
  stopDictation()
  window.removeEventListener('agent-sessions:updated', loadAgentSessions)
})
</script>

<style scoped>
.agent-container {
  --agent-accent: #2563eb;
  --agent-accent-soft: #dbeafe;
  --agent-surface: #ffffff;
  --agent-surface-muted: #f8fafc;
  --agent-surface-soft: #f1f6ff;
  --agent-border: #dbe4f0;
  --agent-text: #0f172a;
  --agent-text-muted: #64748b;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%);
}

.chat-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--agent-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(247, 251, 255, 0.92) 100%);
  backdrop-filter: blur(8px);
}

.chat-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-actions {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.chat-title {
  color: var(--agent-text);
}

.chat-subtitle {
  color: var(--agent-text-muted);
}

.back-button {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--agent-border);
  background: var(--agent-surface);
  color: var(--agent-text-muted);
}

.back-button:hover {
  border-color: #bfdbfe;
  background: var(--agent-surface-soft);
}

/* 主内容区：左 + 右栏 */
.agent-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.agent-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.agent-home-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 对话区：min-height: 0 让 flex 子项可收缩，避免把底部输入框推出视口 */
.agent-chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: none;
  background: transparent;
}

.messages-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  background:
    radial-gradient(1200px 320px at 0% -10%, rgba(191, 219, 254, 0.26), transparent 62%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.6));
}

.message-group {
  display: flex;
  flex-direction: column;
}

.message-group.user {
  align-items: flex-end;
}

.message-group.assistant {
  align-items: flex-start;
  width: 100%;
}

.message-bubble {
  max-width: 70%;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-2xl);
  line-height: 1.6;
  word-wrap: break-word;
  box-shadow: var(--shadow-sm);
}

.message-bubble.user {
  background: #eaf2ff;
  color: #1e3a5f;
  border: 1px solid #d8e6ff;
  border-bottom-right-radius: var(--radius-sm);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
}

.message-bubble.assistant {
  width: 100%;
  max-width: 100%;
  background: transparent;
  box-shadow: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-lg);
}

/* 生成文件卡片区块（独立于 ToolCallCard） */
.generated-files-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 520px;
  margin: 6px 0;
}

.file-tool-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #64748b;
  margin: 6px 0;
}
.file-tool-loading-icon {
  font-size: 16px;
}

/* 正文 Markdown 样式（Agent 助手消息） */
.message-content.assistant-body {
  width: min(94%, 920px);
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--agent-border);
  background: var(--agent-surface);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  box-sizing: border-box;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
}

.message-content.assistant-body :deep(p) {
  margin: 0.75em 0;
}

.message-content.assistant-body :deep(p:first-child) {
  margin-top: 0;
}

.message-content.assistant-body :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content.assistant-body :deep(ul),
.message-content.assistant-body :deep(ol) {
  margin: 0.75em 0;
  padding-left: 1.5em;
}

.message-content.assistant-body :deep(li) {
  margin: 0.25em 0;
}

.message-content.assistant-body :deep(a) {
  color: var(--primary, #2563eb);
  text-decoration: underline;
}

.message-content.assistant-body :deep(a:hover) {
  color: var(--primary-dark, #1d4ed8);
}

.message-content.assistant-body :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.message-content.assistant-body :deep(em) {
  font-style: italic;
}

.message-content.assistant-body :deep(code:not(pre code)) {
  background: var(--bg-code, rgba(0, 0, 0, 0.06));
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--text-code, #334155);
}

.message-content.assistant-body :deep(pre) {
  margin: 1em 0;
  padding: 1em;
  border-radius: var(--radius-md);
  background: var(--bg-code, #f1f5f9);
  overflow-x: auto;
  font-size: 0.875em;
  line-height: 1.5;
}

.message-content.assistant-body :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
}

.message-content.assistant-body :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 3px solid var(--border-medium, #e5e7eb);
  color: var(--text-secondary, #6b7280);
}

.message-content.assistant-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.message-content.assistant-body :deep(th),
.message-content.assistant-body :deep(td) {
  border: 1px solid var(--border-light, #e5e7eb);
  padding: 0.5em 0.75em;
  text-align: left;
}

.message-content.assistant-body :deep(th) {
  background: var(--bg-secondary, #f9fafb);
  font-weight: 600;
}

.message-content.assistant-body :deep(img) {
  max-width: 100%;
  height: auto;
  max-height: 320px;
  border-radius: var(--radius-md);
}

/* 消息 footer：展示 usage 统计信息（Token / 耗时） */
.agent-message-footer {
  margin-top: 2px;
  padding: 0 6px;
  font-size: 12px;
  color: var(--agent-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.message-content.assistant-body :deep(.sse_cursor) {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--primary);
  animation: sse-cursor-blink 1s step-end infinite;
}

@keyframes sse-cursor-blink {
  50% { opacity: 0; }
}

/* Thinking 块 */
.thinking-block {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
  overflow: hidden;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  user-select: none;
  transition: background var(--duration-fast);
}

.thinking-header:hover {
  background: var(--bg-tertiary);
}

.thinking-icon {
  font-size: 1rem;
}

.thinking-title {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.thinking-toggle {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.thinking-content {
  padding: var(--spacing-md);
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  border-top: 1px solid var(--border-light);
}

/* 附件卡片：与 Chat 一致的高级感，但更紧凑 */
.attachments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.attach-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 9px 34px 9px 9px;
  border-radius: 12px;
  border: 1px solid var(--agent-border);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.06);
  max-width: min(300px, 100%);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.attach-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}

.attach-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.attach-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attach-card-file-icon {
  width: 100%;
  height: 100%;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.attach-card-file-icon.is-text {
  color: #2563eb;
}

.attach-card-file-svg {
  width: 18px;
  height: 18px;
}

.attach-card-ext-pill {
  position: absolute;
  bottom: 1px;
  right: 2px;
  border-radius: 999px;
  padding: 1px 4px;
  font-size: 8px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.attach-card-progress {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 34px;
  height: 34px;
  pointer-events: none;
}

.attach-card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.attach-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--agent-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attach-card-type {
  font-size: 11.5px;
  color: var(--agent-text-muted);
}

.attach-card-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.68);
  color: #fff;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.16s ease;
}

.attach-card-remove:hover {
  background: rgba(239, 68, 68, 0.9);
}

/* 输入框（参考 Chat.vue input-box-container，无 input-prefix-btn） */
.input-container {
  padding: var(--spacing-md) var(--spacing-xl);
  background: rgba(255, 255, 255, 0.88);
  border-top: 1px solid var(--agent-border);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.input-box-container {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "primary trailing";
  align-items: end;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--agent-border);
  border-radius: var(--radius-2xl);
  background: var(--agent-surface);
  min-height: 56px;
  --input-max-height: 200px;
  /* 容器最大高度需包含 padding，避免 textarea 到顶后被裁切 */
  max-height: calc(var(--input-max-height) + 24px);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.input-box-container:focus-within {
  border-color: var(--agent-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.input-box-container.input-box-has-attachments {
  border-color: rgba(148, 163, 184, 0.62);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.input-box-container .message-input {
  grid-area: primary;
  flex: unset;
  min-height: 28px;
  max-height: var(--input-max-height);
  padding: 4px 8px;
  border: none;
  background: transparent;
  box-shadow: none;
  outline: none;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-primary);
  resize: none;
  overflow-y: hidden;
  scrollbar-width: thin;
  font-family: inherit;
  box-sizing: border-box;
}

/* 右侧操作区：发送/停止按钮，垂直居中 */
.input-trailing {
  grid-area: trailing;
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-input::placeholder {
  color: var(--text-light);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-button {
  width: 38px;
  height: 38px;
  border: none;
  background: linear-gradient(140deg, #60a5fa, #2563eb);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.32);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  filter: brightness(1.02);
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.38);
}

.input-action-btn {
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--agent-text-muted);
}

.input-action-btn:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.26);
  background: rgba(15, 23, 42, 0.04);
  color: #1e40af;
}

.attach-btn-icon {
  width: 18px;
  height: 18px;
}

.message-bubble.assistant :deep(.think-card) {
  border: 1px solid var(--agent-border);
  background: linear-gradient(180deg, #f7fbff 0%, #f8fafc 100%);
}

.message-bubble.assistant :deep(.think-label) {
  color: var(--agent-text-muted);
}

.message-bubble.assistant :deep(.tool-card) {
  border-color: var(--agent-border);
  background: var(--agent-surface);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.message-bubble.assistant :deep(.tool-card .card-header) {
  background: var(--agent-surface-soft);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 输入框旁的停止按钮（与发送按钮同位置） */
.stop-btn-inline {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--danger);
  color: white;
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 0.75rem;
  font-weight: 500;
  flex-shrink: 0;
  transition: all var(--duration-fast);
}

.stop-btn-inline:hover {
  background: var(--red-600, #dc2626);
  transform: translateY(-1px);
}

.stop-btn-inline .stop-icon {
  font-size: 1rem;
}

/* Toast 提示 */
.toast {
  position: fixed;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  animation: slideIn 0.3s ease;
  z-index: var(--z-toast);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-error {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger);
}

.toast-warn {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid var(--warning);
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* 加载动画 */
.loading-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-md) var(--spacing-lg);
}

.loading-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--text-light);
  animation: loadingPulse 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }
.loading-dot:nth-child(3) { animation-delay: 0s; }

@keyframes loadingPulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.messages-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
}
.messages-loading-text {
  font-size: 0.875rem;
  color: var(--text-light);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 实时语音转文字 / 错误气泡（参考 Chat.vue，Teleport 到 body 仍可应用 scoped 样式） */
.dictation-bubble {
  display: flex;
  align-items: flex-start;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border-light, #e5e7eb);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  color: var(--text-primary);
  max-height: 120px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.dictation-bubble-content {
  flex: 1;
  min-width: 0;
}

.dictation-bubble-fixed {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 100px;
  width: min(90vw, 560px);
  z-index: 9999;
}

.dictation-bubble-error {
  color: var(--danger, #e74c3c);
}
.dictation-bubble-text {
  color: var(--text-primary);
}
.dictation-bubble-placeholder {
  color: var(--text-muted, #6b7280);
  font-style: normal;
}

.dictation-bubble-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 12px;
  flex-shrink: 0;
}

.dictation-bubble-btn {
  border: none;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted, #6b7280);
  transition: background 0.15s ease, color 0.15s ease, transform 0.05s ease;
}

.dictation-bubble-btn:hover {
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-primary);
}

.dictation-bubble-btn:active {
  transform: scale(0.97);
}

.dictation-bubble-btn-primary {
  background: var(--blue-600, #2563eb);
  color: #fff;
}

.dictation-bubble-btn-primary:hover:not(:disabled) {
  background: var(--blue-700, #1d4ed8);
}

.dictation-bubble-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dictation-bubble-enter-active,
.dictation-bubble-leave-active {
  transition: opacity 0.2s ease;
}
.dictation-bubble-enter-from,
.dictation-bubble-leave-to {
  opacity: 0;
}

/* 麦克风按钮（trailing 区，与附件、发送同排） */
.mic-btn-trailing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.mic-btn-trailing.mic-btn-recording {
  color: var(--red-500, #ef4444);
  animation: mic-pulse 1.2s ease-in-out infinite;
}
.mic-btn-trailing.mic-btn-recording:hover:not(:disabled) {
  background: var(--red-50, #fef2f2);
  color: var(--red-600, #dc2626);
}
.mic-icon {
  width: 20px;
  height: 20px;
}
.mic-icon-stop {
  width: 16px;
  height: 16px;
}
@keyframes mic-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

/* 响应式 */
@media (max-width: 768px) {
  .message-bubble {
    max-width: 85%;
  }
}
</style>
