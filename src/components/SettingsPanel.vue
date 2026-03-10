<template>
  <div class="settings-backdrop" @click="emit('close')">
    <div class="settings-panel" dir="ltr" @click.stop>
      <!-- 左侧 Tab 列表 -->
      <div
        class="settings-tablist"
        role="tablist"
        aria-orientation="vertical"
      >
        <div class="settings-tablist-head">
          <button
            type="button"
            class="settings-close-btn"
            :aria-label="t('close')"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :class="['settings-tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="settings-tab-icon" aria-hidden="true">{{ tab.icon }}</span>
          <span class="settings-tab-label truncate">{{ tab.label }}</span>
        </button>
      </div>

      <!-- 右侧内容区 -->
      <div class="settings-content">
        <!-- 常规 -->
        <div
          v-show="activeTab === 'general'"
          role="tabpanel"
          class="settings-tabpanel"
        >
          <section class="settings-section">
            <h3 class="settings-section-title">{{ t('general') }}</h3>

            <div class="settings-row">
              <div class="settings-row-inner">
                <span class="settings-row-label">{{ t('appearance') }}</span>
                <div class="settings-select-dropdown">
                  <button
                    type="button"
                    class="settings-select"
                    @click="isAppearanceOpen = !isAppearanceOpen"
                  >
                    <span>{{ currentAppearanceLabel }}</span>
                    <span class="settings-select-arrow">▼</span>
                  </button>
                  <div v-if="isAppearanceOpen" class="settings-dropdown-menu">
                    <button
                      v-for="item in appearanceOptions"
                      :key="item.value"
                      type="button"
                      class="settings-dropdown-item"
                      :class="{ 'is-active': appearance === item.value }"
                      @click="selectAppearance(item.value)"
                    >
                      <span class="settings-dropdown-label">{{ item.label }}</span>
                      <span
                        v-if="appearance === item.value"
                        class="settings-dropdown-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-inner">
                <span class="settings-row-label">{{ t('accent') }}</span>
                <div class="settings-select-dropdown">
                  <button
                    type="button"
                    class="settings-select"
                    @click="isAccentOpen = !isAccentOpen"
                  >
                    <span
                      class="settings-theme-dot"
                      :class="currentAccentOption?.dotClass"
                    ></span>
                    <span>{{ currentAccentOption?.label }}</span>
                    <span class="settings-select-arrow">▼</span>
                  </button>
                  <div v-if="isAccentOpen" class="settings-dropdown-menu">
                    <button
                      v-for="item in accentOptions"
                      :key="item.value"
                      type="button"
                      class="settings-dropdown-item"
                      :class="{ 'is-active': setting.colorPoint === item.value }"
                      @click="selectAccent(item.value)"
                    >
                      <div class="settings-dropdown-left">
                        <span
                          class="settings-theme-dot"
                          :class="item.dotClass"
                        ></span>
                        <span class="settings-dropdown-label">{{ item.label }}</span>
                      </div>
                      <span
                        v-if="setting.colorPoint === item.value"
                        class="settings-dropdown-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-inner">
                <span class="settings-row-label">{{ t('language') }}</span>
                <div class="settings-select-dropdown">
                  <button
                    type="button"
                    class="settings-select"
                    @click="isLanguageOpen = !isLanguageOpen"
                  >
                    <span>{{ currentLanguageLabel }}</span>
                    <span class="settings-select-arrow">▼</span>
                  </button>
                  <div v-if="isLanguageOpen" class="settings-dropdown-menu">
                    <button
                      v-for="item in languageOptions"
                      :key="item.value"
                      type="button"
                      class="settings-dropdown-item"
                      :class="{ 'is-active': language === item.value }"
                      @click="selectLanguage(item.value)"
                    >
                      <span class="settings-dropdown-label">{{ item.label }}</span>
                      <span
                        v-if="language === item.value"
                        class="settings-dropdown-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>


            <div class="settings-row">
              <div class="settings-row-inner settings-row-sound">
                <span class="settings-row-label">{{ t('voice') }}</span>
                <div class="settings-sound-actions">
                  <button type="button" class="settings-btn-secondary">▶ {{ t('play') }}</button>
                  <span class="settings-sound-divider"></span>
                  <div class="settings-select-dropdown">
                    <button
                      type="button"
                      class="settings-select"
                      @click="isVoiceOpen = !isVoiceOpen"
                    >
                      <span>{{ currentVoiceLabel }}</span>
                      <span class="settings-select-arrow">▼</span>
                    </button>
                    <div v-if="isVoiceOpen" class="settings-dropdown-menu">
                      <button
                        v-for="item in voiceOptions"
                        :key="item.value"
                        type="button"
                        class="settings-dropdown-item"
                        :class="{ 'is-active': voice === item.value }"
                        @click="selectVoice(item.value)"
                      >
                        <span class="settings-dropdown-label">{{ item.label }}</span>
                        <span
                          v-if="voice === item.value"
                          class="settings-dropdown-check"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </div>

        <!-- 个性化 -->
        <div
          v-show="activeTab === 'personalization'"
          role="tabpanel"
          class="settings-tabpanel"
        >
          <section class="settings-section">
            <h3 class="settings-section-title">个性化</h3>

            <div class="settings-subsection">
              <h4 class="settings-subsection-title">基本风格和语调</h4>

              <div class="settings-row">
                <div class="settings-row-inner">
                  <span class="settings-row-label">聊天模型</span>
                  <div class="settings-select-dropdown">
                    <button
                      type="button"
                      class="settings-select"
                      @click="isChatModelOpen = !isChatModelOpen"
                    >
                      <span class="model-inline">
                        <span
                          class="model-brand-icon"
                          :class="`brand-${selectedChatModelOption.brand}`"
                          aria-hidden="true"
                        >
                          {{ selectedChatModelOption.brandIcon }}
                        </span>
                        <span>{{ currentChatModelLabel }}</span>
                      </span>
                      <span class="settings-select-arrow">▼</span>
                    </button>
                    <div v-if="isChatModelOpen" class="settings-dropdown-menu">
                      <button
                        v-for="item in chatModelOptions"
                        :key="item.value"
                        type="button"
                        class="settings-dropdown-item"
                        :class="{ 'is-active': setting.chatModel === item.value }"
                        @click="selectChatModel(item.value)"
                      >
                        <span class="model-option-main">
                          <span
                            class="model-brand-icon"
                            :class="`brand-${item.brand}`"
                            aria-hidden="true"
                          >
                            {{ item.brandIcon }}
                          </span>
                          <span class="model-option-texts">
                            <span class="settings-dropdown-label">{{ item.label }}</span>
                            <span class="model-option-id">{{ item.value }}</span>
                          </span>
                        </span>
                        <span
                          v-if="setting.chatModel === item.value"
                          class="settings-dropdown-check"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="settings-model-card">
                  <div class="settings-model-card-head">
                    <span
                      class="model-brand-icon is-card"
                      :class="`brand-${selectedChatModelOption.brand}`"
                      aria-hidden="true"
                    >
                      {{ selectedChatModelOption.brandIcon }}
                    </span>
                    <div>
                      <div class="settings-model-name">{{ selectedChatModelOption.label }}</div>
                      <div class="settings-model-company">{{ selectedChatModelOption.company }}</div>
                    </div>
                  </div>
                  <div class="settings-model-feature">{{ selectedChatModelOption.feature }}</div>
                  <div class="settings-model-meta">
                    <span class="settings-model-tag">
                      工具调用：{{ selectedChatModelOption.toolCallingLabel }}
                    </span>
                    <span class="settings-model-tag">
                      多模态：{{ selectedChatModelOption.multimodalLabel }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner">
                  <span class="settings-row-label">语调</span>
                  <div class="settings-select-dropdown">
                    <button
                      type="button"
                      class="settings-select"
                      @click="isToneOpen = !isToneOpen"
                    >
                      <span>{{ currentToneLabel }}</span>
                      <span class="settings-select-arrow">▼</span>
                    </button>
                    <div v-if="isToneOpen" class="settings-dropdown-menu">
                      <button
                        v-for="item in toneOptions"
                        :key="item.value"
                        type="button"
                        class="settings-dropdown-item"
                        :class="{ 'is-active': setting.tone === item.value }"
                        @click="selectTone(item.value)"
                      >
                        <span class="settings-dropdown-label">{{ item.label }}</span>
                        <span
                          v-if="setting.tone === item.value"
                          class="settings-dropdown-check"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <p class="settings-row-desc">
                  语调会影响回答风格与表达方式（更专业 / 更简洁 / 更详细 / 更教学）。
                </p>
              </div>
            </div>

            <div class="settings-subsection">
              <h4 class="settings-subsection-title">采样与上下文</h4>

            <div class="settings-row">
              <div class="settings-row-inner">
                <span class="settings-row-label">推理强度（已弃用）</span>
                <div class="settings-select-dropdown">
                  <button
                    type="button"
                    class="settings-select"
                    @click="isReasoningEffortOpen = !isReasoningEffortOpen"
                  >
                    <span>{{ currentReasoningEffortLabel }}</span>
                    <span class="settings-select-arrow">▼</span>
                  </button>
                  <div v-if="isReasoningEffortOpen" class="settings-dropdown-menu">
                    <button
                      v-for="item in reasoningEffortOptions"
                      :key="item.value"
                      type="button"
                      class="settings-dropdown-item"
                      :class="{ 'is-active': setting.reasoningEffort === item.value }"
                      @click="selectReasoningEffort(item.value)"
                    >
                      <span class="settings-dropdown-label">{{ item.label }}</span>
                      <span
                        v-if="setting.reasoningEffort === item.value"
                        class="settings-dropdown-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <p class="settings-row-desc">
                控制模型推理深度和耗时，low 更快更省，high 更适合复杂推理场景。
              </p>
            </div>

              <div class="settings-row">
                <div class="settings-row-inner settings-row-slider">
                  <div class="settings-row-label-group">
                    <span class="settings-row-label">temperature</span>
                    <span class="settings-row-value">{{ formatTemperature(setting.temperature) }}</span>
                  </div>
                  <input
                    v-model.number="setting.temperature"
                    class="settings-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    :aria-label="`temperature ${formatTemperature(setting.temperature)}`"
                  />
                </div>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner settings-row-slider">
                  <div class="settings-row-label-group">
                    <span class="settings-row-label">topk</span>
                    <span class="settings-row-value">{{ Math.round(setting.topk) }}</span>
                  </div>
                  <input
                    v-model.number="setting.topk"
                    class="settings-slider"
                    type="range"
                    min="10"
                    max="80"
                    step="1"
                    :aria-label="`topk ${Math.round(setting.topk)}`"
                  />
                </div>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner settings-row-slider">
                  <div class="settings-row-label-group">
                    <span class="settings-row-label">contextWindow</span>
                    <span class="settings-row-value">{{ Math.round(setting.contextWindow) }}</span>
                  </div>
                  <input
                    v-model.number="setting.contextWindow"
                    class="settings-slider"
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    :aria-label="`contextWindow ${Math.round(setting.contextWindow)}`"
                  />
                </div>
                <p class="settings-row-desc">
                  控制对话回溯范围（0-10）。数值越大，越倾向引用更多历史上下文。
                </p>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner settings-row-slider">
                  <div class="settings-row-label-group">
                    <span class="settings-row-label">frequencyPenalty</span>
                    <span class="settings-row-value">{{ setting.frequencyPenalty.toFixed(2) }}</span>
                  </div>
                  <input
                    v-model.number="setting.frequencyPenalty"
                    class="settings-slider"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    :aria-label="`frequencyPenalty ${setting.frequencyPenalty.toFixed(2)}`"
                  />
                </div>
                <p class="settings-row-desc">
                  控制对重复内容的惩罚程度，数值越大越不易重复，负值会鼓励重复。
                </p>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner settings-row-slider">
                  <div class="settings-row-label-group">
                    <span class="settings-row-label">maxTokens</span>
                    <span class="settings-row-value">{{ Math.round(setting.maxTokens) }}</span>
                  </div>
                  <input
                    v-model.number="setting.maxTokens"
                    class="settings-slider"
                    type="range"
                    min="1000"
                    max="16000"
                    step="500"
                    :aria-label="`maxTokens ${Math.round(setting.maxTokens)}`"
                  />
                </div>
                <p class="settings-row-desc">
                  控制单次回复可输出的最大 tokens 数量，推荐 1000-16000。
                </p>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner">
                  <span class="settings-row-label">工具模式</span>
                  <div class="settings-select-dropdown">
                    <button
                      type="button"
                      class="settings-select"
                      @click="isToolModeOpen = !isToolModeOpen"
                    >
                      <span>{{ currentToolModeLabel }}</span>
                      <span class="settings-select-arrow">▼</span>
                    </button>
                    <div v-if="isToolModeOpen" class="settings-dropdown-menu">
                      <button
                        v-for="item in toolModeOptions"
                        :key="item.value"
                        type="button"
                        class="settings-dropdown-item"
                        :class="{ 'is-active': setting.toolMode === item.value }"
                        @click="selectToolMode(item.value)"
                      >
                        <span class="settings-dropdown-label">{{ item.label }}</span>
                        <span
                          v-if="setting.toolMode === item.value"
                          class="settings-dropdown-check"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <p class="settings-row-desc">
                  auto 为自动调用工具（检索、执行等），off 则完全关闭工具模式。
                </p>
              </div>
            </div>

            <div class="settings-subsection">
              <h4 class="settings-subsection-title">默认设置</h4>

              <div class="settings-row">
                <div class="settings-row-inner">
                  <span class="settings-row-label">折叠思考</span>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="setting.foldingThinking"
                    :class="['settings-switch', { on: setting.foldingThinking }]"
                    @click="setting.foldingThinking = !setting.foldingThinking"
                  >
                    <span class="settings-switch-thumb"></span>
                  </button>
                </div>
                <p class="settings-row-desc">
                 选中后系统将自动折叠思考内容。
                </p>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner">
                  <span class="settings-row-label">自动总结摘要</span>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="setting.isSummary"
                    :class="['settings-switch', { on: setting.isSummary }]"
                    @click="setting.isSummary = !setting.isSummary"
                  >
                    <span class="settings-switch-thumb"></span>
                  </button>
                </div>
                <p class="settings-row-desc">
                  选中后系统将自动总结往期对话摘要，作为长期记忆。
                </p>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner">
                  <span class="settings-row-label">参考持久化对话记忆</span>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="setting.chatMemory"
                    :class="['settings-switch', { on: setting.chatMemory }]"
                    @click="setting.chatMemory = !setting.chatMemory"
                  >
                    <span class="settings-switch-thumb"></span>
                  </button>
                </div>
                <p class="settings-row-desc">
                  开启后程序将自动向量化存储和参考用户有价值的对话。
                </p>
              </div>

              <div class="settings-row">
                <div class="settings-row-inner">
                  <span class="settings-row-label">扩展模式</span>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="setting.isExtend"
                    :class="['settings-switch', { on: setting.isExtend }]"
                    @click="setting.isExtend = !setting.isExtend"
                  >
                    <span class="settings-switch-thumb"></span>
                  </button>
                </div>
                
              </div>

              <div class="settings-row">
                <div class="settings-row-inner settings-row-actions">
                  <button type="button" class="settings-btn-secondary" @click="resetToDefault">
                    恢复默认
                  </button>
                  <span
                    class="settings-save-status"
                    :class="{
                      saving: saveStatus === 'saving',
                      error: saveStatus === 'error'
                    }"
                  >
                    <template v-if="saveStatus === 'saving'">保存中…</template>
                    <template v-else-if="saveStatus === 'saved'">已保存</template>
                    <template v-else-if="saveStatus === 'error'">保存失败：{{ saveError || '请稍后重试' }}</template>
                    <template v-else> </template>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- MCP -->
        <div
          v-show="activeTab === 'mcp'"
          role="tabpanel"
          class="settings-tabpanel"
        >
          <section class="settings-section">
            <h3 class="settings-section-title">MCP</h3>

            <div class="settings-row">
              <div class="settings-row-inner">
                <span class="settings-row-label">启用 MCP</span>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="setting.useMcp"
                  :class="['settings-switch', { on: setting.useMcp }]"
                  @click="setting.useMcp = !setting.useMcp"
                >
                  <span class="settings-switch-thumb"></span>
                </button>
              </div>
              <p class="settings-row-desc">
                MCP（Model Context Protocol）用于将模型安全地连接到外部工具和服务。
                本项目接入了高德地图 MCP 服务
                <a
                  href="https://mcp.so/server/amap-maps/amap"
                  target="_blank"
                  rel="noreferrer"
                >amap-maps/amap</a>
                ，用于地点搜索、路径规划、地理编码等地图相关能力。
              </p>
            </div>
          </section>
        </div>

        <!-- 其他 Tab 占位 -->
        <div
          v-for="tab in tabs.filter(t => t.id !== 'general' && t.id !== 'personalization' && t.id !== 'mcp')"
          :key="tab.id"
          v-show="activeTab === tab.id"
          role="tabpanel"
          class="settings-tabpanel"
        >
          <section class="settings-section">
            <h3 class="settings-section-title">{{ tab.label }}</h3>
            <p class="settings-placeholder">敬请期待</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { apiFetch } from '../api/http'
import { getUser, isLoggedIn } from '../stores/auth'
import { UI_LANGUAGE_STORAGE_KEY, setUiLanguage } from '../composables/useUiLanguage'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type UserSetting = {
  userId: string
  tone: string
  reasoningEffort: string
  chatModel: string
  temperature: number
  topk: number
  frequencyPenalty: number
  toolMode: string
  maxTokens: number
  useMcp: boolean
  foldingThinking: boolean
  contextWindow: number
  colorPoint: AccentValue
  isSummary: boolean
  chatMemory: boolean
  isExtend: boolean
  [k: string]: unknown
}

const props = defineProps<{ initialTab?: string }>()

const emit = defineEmits<{ close: [] }>()

type UiLocale = 'zh' | 'en'

const i18nText = {
  zh: {
    close: '关闭',
    general: '常规',
    appearance: '外观',
    accent: '重点色',
    language: '语言',
    voice: '声音',
    play: '播放',
    system: '系统',
    dark: '深色',
    light: '浅色',
    defaultAccent: '默认',
    blue: '蓝色',
    green: '绿色',
    yellow: '黄色',
    pink: '粉色',
    orange: '橙色',
    autoDetect: '自动检测',
    chinese: '中文',
    english: '英文'
  },
  en: {
    close: 'Close',
    general: 'General',
    appearance: 'Appearance',
    accent: 'Accent Color',
    language: 'Language',
    voice: 'Voice',
    play: 'Play',
    system: 'System',
    dark: 'Dark',
    light: 'Light',
    defaultAccent: 'Default',
    blue: 'Blue',
    green: 'Green',
    yellow: 'Yellow',
    pink: 'Pink',
    orange: 'Orange',
    autoDetect: 'Auto Detect',
    chinese: 'Chinese',
    english: 'English'
  }
} as const

const activeTab = ref(props.initialTab || 'general')
const standaloneVoice = ref(false)

type AppearanceValue = 'system' | 'dark' | 'light'
type AccentValue = 'blue' | 'green' | 'yellow' | 'pink' | 'orange'
type LanguageValue = 'auto' | 'zh' | 'en'
type VoiceValue = 'cove' | 'lake' | 'wave'
type ChatModelValue =
  | 'claude-3-haiku-20240307'
  | 'claude-3-5-haiku-20241022'
  | 'grok-4-1-fast-non-reasoning'
  | 'grok-4-1-fast-reasoning'
  | 'grok-code-fast-1'
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-2.5-flash'
  | 'openai/gpt-oss-120b'
  | 'gpt-4o-mini'
  | 'gpt-5-mini'
  | 'gpt-5.1-codex'
  | 'gpt-5'
  | 'moonshotai/kimi-k2.5'
  | 'zai-org/glm-4.7-flash'
  | 'deepseek/deepseek-v3.1'
  | 'qwen/qwen3-coder-480b-a35b-instruct'
  | 'qwen/qwen3-235b-a22b-thinking-2507'
type ReasoningEffortValue = 'low' | 'medium' | 'high'
type ToolModeValue = 'auto' | 'off'
type ModelBrand = 'anthropic' | 'xai' | 'google' | 'openai' | 'moonshot' | 'meta' | 'zai' | 'deepseek' | 'qwen'
type ToneValue =
  | 'professional'
  | 'concise'
  | 'detailed'
  | 'teaching'
  | 'friendly'
  | 'funny'
  | 'neutral'
  | 'sharp'
  | 'critical'
  | 'poisonous'

const appearance = ref<AppearanceValue>('system')
const isAppearanceOpen = ref(false)

const isAccentOpen = ref(false)

const language = ref<LanguageValue>('auto')
const isLanguageOpen = ref(false)

const spokenLanguage = ref<LanguageValue>('auto')
const isSpokenLanguageOpen = ref(false)

const voice = ref<VoiceValue>('cove')
const isVoiceOpen = ref(false)

const isChatModelOpen = ref(false)
const isToneOpen = ref(false)
const isReasoningEffortOpen = ref(false)
const isToolModeOpen = ref(false)

const uiLocale = computed<UiLocale>(() => {
  if (language.value === 'zh') return 'zh'
  if (language.value === 'en') return 'en'
  if (typeof navigator !== 'undefined') {
    return String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  }
  return 'zh'
})

const t = (key: keyof typeof i18nText.zh) => i18nText[uiLocale.value][key]

const appearanceOptions = computed<{ value: AppearanceValue; label: string }[]>(() => [
  { value: 'system', label: t('system') },
  { value: 'dark', label: t('dark') },
  { value: 'light', label: t('light') }
])

const accentOptions = computed<{ value: AccentValue; label: string; dotClass: string }[]>(() => [
  { value: 'blue', label: t('blue'), dotClass: 'is-blue' },
  { value: 'green', label: t('green'), dotClass: 'is-green' },
  { value: 'yellow', label: t('yellow'), dotClass: 'is-yellow' },
  { value: 'pink', label: t('pink'), dotClass: 'is-pink' },
  { value: 'orange', label: t('orange'), dotClass: 'is-orange' }
])

const languageOptions = computed<{ value: LanguageValue; label: string }[]>(() => [
  { value: 'auto', label: t('autoDetect') },
  { value: 'zh', label: t('chinese') },
  { value: 'en', label: t('english') }
])

const spokenLanguageOptions = computed<{ value: LanguageValue; label: string }[]>(() => [
  { value: 'auto', label: t('autoDetect') },
  { value: 'zh', label: t('chinese') },
  { value: 'en', label: t('english') }
])

const voiceOptions: { value: VoiceValue; label: string }[] = [
  { value: 'cove', label: 'Cove' },
  { value: 'lake', label: 'Lake' },
  { value: 'wave', label: 'Wave' }
]

type ChatModelOption = {
  value: ChatModelValue
  label: string
  brand: ModelBrand
  brandIcon: string
  company: string
  feature: string
  toolCallingLabel: '支持' | '部分' | '未知'|'不支持'
  multimodalLabel: '支持' | '部分' | '未知'
}

const chatModelOptions: ChatModelOption[] = [
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', brand: 'anthropic', brandIcon: 'A', company: 'Anthropic', feature: '轻量、低延迟，适合日常问答与快速总结。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', brand: 'anthropic', brandIcon: 'A', company: 'Anthropic', feature: 'Haiku 新版，代码与推理质量更稳。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'grok-4-1-fast-non-reasoning', label: 'Grok 4.1 Fast', brand: 'xai', brandIcon: 'x', company: 'xAI', feature: '快速响应版本，偏执行效率。', toolCallingLabel: '部分', multimodalLabel: '部分' },
  { value: 'grok-4-1-fast-reasoning', label: 'Grok 4.1 Reasoning', brand: 'xai', brandIcon: 'x', company: 'xAI', feature: '强化推理版本，适合复杂任务。', toolCallingLabel: '部分', multimodalLabel: '部分' },
  { value: 'grok-code-fast-1', label: 'Grok Code Fast', brand: 'xai', brandIcon: 'x', company: 'xAI', feature: '偏代码生成与修复，速度优先。', toolCallingLabel: '支持', multimodalLabel: '未知' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite', brand: 'google', brandIcon: 'G', company: 'Google', feature: '低成本轻量预览版，适合高并发。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', brand: 'google', brandIcon: 'G', company: 'Google', feature: '通用高性价比，速度与效果均衡。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', brand: 'openai', brandIcon: 'O', company: 'OpenAI', feature: '开源大参数模型，适合私有化推理。', toolCallingLabel: '支持', multimodalLabel: '未知' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', brand: 'openai', brandIcon: 'O', company: 'OpenAI', feature: '小型多模态模型，速度快且稳定。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini', brand: 'openai', brandIcon: 'O', company: 'OpenAI', feature: '新一代轻量模型，日常场景表现均衡。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'gpt-5.1-codex', label: 'GPT-5.1 Codex', brand: 'openai', brandIcon: 'O', company: 'OpenAI', feature: '面向编程任务优化，代码质量更强。', toolCallingLabel: '支持', multimodalLabel: '部分' },
  { value: 'gpt-5', label: 'GPT-5', brand: 'openai', brandIcon: 'O', company: 'OpenAI', feature: '旗舰通用模型，综合能力最强。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'moonshotai/kimi-k2.5', label: 'Kimi K2.5', brand: 'moonshot', brandIcon: 'K', company: 'Moonshot AI', feature: '长文本与中文任务表现稳定。', toolCallingLabel: '支持', multimodalLabel: '部分' },
  { value: 'zai-org/glm-4.7-flash', label: 'GLM-4.7 Flash', brand: 'zai', brandIcon: 'Z', company: 'Z.ai', feature: '中文友好，低延迟响应。', toolCallingLabel: '支持', multimodalLabel: '支持' },
  { value: 'deepseek/deepseek-v3.1', label: 'DeepSeek V3.1', brand: 'deepseek', brandIcon: 'D', company: 'DeepSeek', feature: '文本与代码综合能力较强。', toolCallingLabel: '支持', multimodalLabel: '未知' },
  { value: 'qwen/qwen3-coder-480b-a35b-instruct', label: 'Qwen3 Coder 480B', brand: 'qwen', brandIcon: 'Q', company: 'Qwen', feature: '超大规模代码模型，复杂工程场景更稳。', toolCallingLabel: '支持', multimodalLabel: '未知' },
  { value: 'qwen/qwen3-235b-a22b-thinking-2507', label: 'Qwen3 235B Thinking', brand: 'qwen', brandIcon: 'Q', company: 'Qwen', feature: '偏深度思考与复杂推理任务。', toolCallingLabel: '支持', multimodalLabel: '未知' }
]

const toneOptions: { value: ToneValue; label: string }[] = [
  { value: 'professional', label: '专业' },
  { value: 'concise', label: '简要' },
  { value: 'detailed', label: '详细' },
  { value: 'teaching', label: '教学' },
  { value: 'friendly', label: '友好' },
  { value: 'funny', label: '幽默' },
  { value: 'neutral', label: '中立' },
  { value: 'sharp', label: '尖锐' },
  { value: 'critical', label: '讽刺' },
  { value: 'poisonous', label: '毒舌' }
]

const reasoningEffortOptions: { value: ReasoningEffortValue; label: string }[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' }
]

const toolModeOptions: { value: ToolModeValue; label: string }[] = [
  { value: 'auto', label: '自动（推荐）' },
  { value: 'off', label: '关闭工具调用' }
]

const currentAppearanceLabel = computed(
  () => appearanceOptions.value.find(i => i.value === appearance.value)?.label ?? t('system')
)

const currentAccentOption = computed(
  () => accentOptions.value.find(i => i.value === setting.colorPoint) ?? accentOptions.value[0]
)

const currentLanguageLabel = computed(
  () => languageOptions.value.find(i => i.value === language.value)?.label ?? t('autoDetect')
)

const currentSpokenLanguageLabel = computed(
  () => spokenLanguageOptions.value.find(i => i.value === spokenLanguage.value)?.label ?? t('autoDetect')
)

const currentVoiceLabel = computed(
  () => voiceOptions.find(i => i.value === voice.value)?.label ?? 'Cove'
)

const selectedChatModelOption = computed(
  () => chatModelOptions.find(i => i.value === (setting.chatModel as ChatModelValue)) ?? chatModelOptions[0]
)

const currentChatModelLabel = computed(
  () => selectedChatModelOption.value.label
)

const currentToneLabel = computed(
  () => toneOptions.find(i => i.value === (setting.tone as ToneValue))?.label ?? toneOptions[0].label
)

const currentReasoningEffortLabel = computed(
  () =>
    reasoningEffortOptions.find(i => i.value === (setting.reasoningEffort as ReasoningEffortValue))?.label ??
    reasoningEffortOptions[0].label
)

const currentToolModeLabel = computed(
  () =>
    toolModeOptions.find(i => i.value === (setting.toolMode as ToolModeValue))?.label ?? toolModeOptions[0].label
)

function selectAppearance(value: AppearanceValue) {
  appearance.value = value
  isAppearanceOpen.value = false

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    let isDark = false

    if (value === 'dark') {
      isDark = true
    } else if (value === 'light') {
      isDark = false
    } else {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
      isDark = !!mql?.matches
    }

    document.documentElement.classList.toggle('dark', isDark)

    try {
      localStorage.setItem('appearance', value)
      localStorage.setItem('darkMode', String(isDark))
    } catch {}
  }
}

function applyColorPoint(value: AccentValue) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const palette: Record<AccentValue, { primary: string; light: string; dark: string; bg: string; alpha: string }> = {
    // 默认蓝色，风格接近 ChatGPT 当前 UI 的清爽强调色体系
    blue: { primary: '#2f6feb', light: '#4f83f1', dark: '#1f5bd9', bg: '#eaf2ff', alpha: 'rgba(47, 111, 235, 0.20)' },
    green: { primary: '#10a37f', light: '#32b592', dark: '#0d8a6b', bg: '#e7f7f2', alpha: 'rgba(16, 163, 127, 0.20)' },
    yellow: { primary: '#d4a106', light: '#e0b731', dark: '#b78400', bg: '#fff7df', alpha: 'rgba(212, 161, 6, 0.20)' },
    pink: { primary: '#db4a92', light: '#e86fa8', dark: '#bf2f77', bg: '#ffeaf4', alpha: 'rgba(219, 74, 146, 0.20)' },
    orange: { primary: '#ea6a2a', light: '#f08a57', dark: '#cf5418', bg: '#fff0e8', alpha: 'rgba(234, 106, 42, 0.20)' }
  }
  const c = palette[value]
  root.style.setProperty('--primary', c.primary)
  root.style.setProperty('--primary-light', c.light)
  root.style.setProperty('--primary-dark', c.dark)
  root.style.setProperty('--primary-bg', c.bg)
  root.style.setProperty('--primary-alpha', c.alpha)
}

function selectAccent(value: AccentValue) {
  setting.colorPoint = value
  applyColorPoint(value)
  isAccentOpen.value = false
}

function applyUiLanguage(value: LanguageValue) {
  const locale: UiLocale =
    value === 'zh'
      ? 'zh'
      : value === 'en'
        ? 'en'
        : typeof navigator !== 'undefined' &&
            String(navigator.language || '').toLowerCase().startsWith('zh')
          ? 'zh'
          : 'en'

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    document.documentElement.setAttribute('data-ui-lang', locale)
  }
  setUiLanguage(value)
}

function selectLanguage(value: LanguageValue) {
  language.value = value
  isLanguageOpen.value = false
  applyUiLanguage(value)
}

function selectSpokenLanguage(value: LanguageValue) {
  spokenLanguage.value = value
  isSpokenLanguageOpen.value = false
}

function selectVoice(value: VoiceValue) {
  voice.value = value
  isVoiceOpen.value = false
}

function selectChatModel(value: ChatModelValue) {
  setting.chatModel = value
  isChatModelOpen.value = false
}

function selectTone(value: ToneValue) {
  setting.tone = value
  isToneOpen.value = false
}

function selectReasoningEffort(value: ReasoningEffortValue) {
  setting.reasoningEffort = value
  isReasoningEffortOpen.value = false
}

function selectToolMode(value: ToolModeValue) {
  setting.toolMode = value
  isToolModeOpen.value = false
}

const tabs = computed(() => [
  { id: 'general', label: t('general'), icon: '⚙️' },
  { id: 'personalization', label: uiLocale.value === 'en' ? 'Personalization' : '个性化', icon: '🎨' },
  { id: 'mcp', label: 'MCP', icon: '🧩' },
  { id: 'security', label: uiLocale.value === 'en' ? 'Security' : '安全', icon: '🔒' },
  { id: 'account', label: uiLocale.value === 'en' ? 'Account' : '帐户', icon: '👤' }
])

const SETTINGS_STORAGE_KEY = 'chatui_user_setting_v1'

function getDefaultSetting(userId: string): UserSetting {
  return {
    userId,
    tone: 'concise',
    reasoningEffort: 'low',
    frequencyPenalty: 0.0,
    toolMode: 'auto',
    // 后端总体有 10 万 tokens 限制，这里控制单次输出的上限
    maxTokens: 100000,
    chatModel: 'gpt-4o-mini',
    temperature: 0.9,
    topk: 50,
    colorPoint: 'blue',
    useMcp: false,
    foldingThinking: true,
    // 后端默认 AiCientConstans.MESSAGE_PAGE_SIZE，这里用 10 作为可视化默认值
    contextWindow: 10,
    isSummary: false,
    chatMemory: false,
    isExtend: false
  }
}

function clampNumber(n: unknown, min: number, max: number) {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, v))
}

function normalizeSetting(raw: Partial<UserSetting> | null | undefined, userId: string): UserSetting {
  const base = getDefaultSetting(userId)
  const s = { ...base, ...(raw || {}) }
  s.userId = userId
  s.temperature = clampNumber(s.temperature, 0, 1)
  s.topk = Math.round(clampNumber(s.topk, 10, 80))
  s.contextWindow = Math.round(clampNumber(s.contextWindow, 0, 10))
  s.chatModel = typeof s.chatModel === 'string' ? s.chatModel : base.chatModel
  s.tone = typeof s.tone === 'string' ? s.tone : base.tone
  s.reasoningEffort = typeof s.reasoningEffort === 'string' ? s.reasoningEffort : base.reasoningEffort
  s.frequencyPenalty = clampNumber(s.frequencyPenalty, 0, 2)
  s.maxTokens = Math.round(clampNumber(s.maxTokens, 1000, 16000))
  const legacyAccent = (raw as { accent?: unknown } | null | undefined)?.accent
  const colorPoint =
    typeof s.colorPoint === 'string'
      ? s.colorPoint
      : typeof legacyAccent === 'string'
        ? legacyAccent
        : base.colorPoint
  s.colorPoint =
    colorPoint === 'blue' || colorPoint === 'green' || colorPoint === 'yellow' || colorPoint === 'pink' || colorPoint === 'orange'
      ? colorPoint
      : base.colorPoint
  s.toolMode =
    typeof s.toolMode === 'string' && (s.toolMode === 'auto' || s.toolMode === 'off') ? s.toolMode : base.toolMode
  s.useMcp = !!s.useMcp
  s.foldingThinking = !!s.foldingThinking
  s.isSummary = !!s.isSummary
  s.chatMemory = !!s.chatMemory
  s.isExtend = !!s.isExtend
  return s
}

function storageKeyForUser(userId: string) {
  return `${SETTINGS_STORAGE_KEY}:${userId || 'anon'}`
}

function readLocalSetting(userId: string): Partial<UserSetting> | null {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId))
    if (!raw) return null
    return JSON.parse(raw) as Partial<UserSetting>
  } catch {
    return null
  }
}

function writeLocalSetting(userId: string, s: UserSetting) {
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(s))
  } catch {}
}

const userId = ref('')
const setting = reactive<UserSetting>(getDefaultSetting(''))

const saveStatus = ref<SaveStatus>('idle')
const saveError = ref('')
let hydrating = false
let saveTimer: number | null = null

function formatTemperature(v: number) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

watch(
  () => props.initialTab,
  (val) => {
    if (val) {
      activeTab.value = val
    }
  }
)

function resetToDefault() {
  const s = getDefaultSetting(userId.value)
  hydrating = true
  Object.assign(setting, s)
  hydrating = false
  scheduleSave()
}

async function fetchRemoteSetting() {
  if (!userId.value) return
  const { ok, json } = await apiFetch<UserSetting>(`/api/user/setting/${encodeURIComponent(userId.value)}`, {
    method: 'GET'
  })
  if (!ok) return
  const data = (json as any)?.data as Partial<UserSetting> | undefined
  if (!data) return
  const merged = normalizeSetting(data, userId.value)
  hydrating = true
  Object.assign(setting, merged)
  hydrating = false
  writeLocalSetting(userId.value, merged)
}

async function persistSetting() {
  if (!userId.value) return

  const payload = normalizeSetting(setting, userId.value)
  writeLocalSetting(userId.value, payload)
  try {
    window.dispatchEvent(new CustomEvent('userSetting:updated', { detail: payload }))
  } catch {}

  if (!isLoggedIn()) {
    saveStatus.value = 'saved'
    return
  }

  saveStatus.value = 'saving'
  saveError.value = ''
  try {
    const { ok, json } = await apiFetch(`/api/user/setting/update`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    if (!ok) {
      const msg = (json as any)?.message ?? (json as any)?.msg ?? ''
      throw new Error(msg || '请求失败')
    }
    saveStatus.value = 'saved'
  } catch (e) {
    saveStatus.value = 'error'
    saveError.value = e instanceof Error ? e.message : String(e)
  }
}

function scheduleSave() {
  if (hydrating) return
  if (!userId.value) return
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = null
    void persistSetting()
  }, 350)
}

watch(
  setting,
  () => {
    // 轻量规范化，避免拖动后出现小数/越界
    setting.temperature = clampNumber(setting.temperature, 0, 1)
    setting.topk = Math.round(clampNumber(setting.topk, 10, 80))
    setting.contextWindow = Math.round(clampNumber(setting.contextWindow, 0, 10))
     setting.frequencyPenalty = clampNumber(setting.frequencyPenalty, 0, 2)
     setting.maxTokens = Math.round(clampNumber(setting.maxTokens, 1000, 16000))
    scheduleSave()
  },
  { deep: true }
)

watch(
  () => setting.colorPoint,
  (val) => {
    applyColorPoint(val)
  }
)

onMounted(async () => {
  const u = getUser()
  userId.value = u?.id ? String(u.id) : ''
  if (!userId.value) {
    // 游客：使用 anon key
    userId.value = 'anon'
  }

  // 初始化外观设置，兼容旧的 darkMode 存储
  try {
    const savedAppearance = localStorage.getItem('appearance') as AppearanceValue | null
    if (savedAppearance && appearanceOptions.value.some(i => i.value === savedAppearance)) {
      appearance.value = savedAppearance
    } else {
      const legacyDark = localStorage.getItem('darkMode')
      if (legacyDark === 'true') {
        appearance.value = 'dark'
      } else if (legacyDark === 'false') {
        appearance.value = 'light'
      } else {
        appearance.value = 'system'
      }
    }
  } catch {
    appearance.value = 'system'
  }

  try {
    const savedLanguage = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY) as LanguageValue | null
    if (savedLanguage === 'auto' || savedLanguage === 'zh' || savedLanguage === 'en') {
      language.value = savedLanguage
    } else {
      language.value = 'auto'
    }
  } catch {
    language.value = 'auto'
  }
  applyUiLanguage(language.value)

  const local = readLocalSetting(userId.value)
  const init = normalizeSetting(local, userId.value)
  hydrating = true
  Object.assign(setting, init)
  hydrating = false
  applyColorPoint(setting.colorPoint)

  // 登录态：再用后端覆盖（若存在）
  if (isLoggedIn() && userId.value && userId.value !== 'anon') {
    try {
      await fetchRemoteSetting()
      applyColorPoint(setting.colorPoint)
    } catch {
      // ignore
    }
  }
})
</script>

<style scoped>
.settings-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  box-sizing: border-box;
  animation: settingsFadeIn 0.2s ease;
}

@keyframes settingsFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 720px;
  height: 100%;
  max-height: 85vh;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  animation: settingsSlideIn 0.25s ease;
}

@keyframes settingsSlideIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (min-width: 768px) {
  .settings-panel {
    flex-direction: row;
    max-width: 680px;
    min-height: 420px;
  }
}

.settings-tablist {
  flex-shrink: 0;
  user-select: none;
  display: flex;
  flex-direction: row;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  min-height: 48px;
  overflow-x: auto;
}

@media (min-width: 768px) {
  .settings-tablist {
    flex-direction: column;
    width: 200px;
    min-width: 180px;
    max-width: 210px;
    border-bottom: none;
    border-right: 1px solid var(--border-light);
    overflow-x: visible;
  }
}

.settings-tablist-head {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
}

.settings-close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.125rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background 0.2s, color 0.2s;
}

.settings-close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.settings-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem 0.625rem;
  padding: 0.625rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
  border-radius: var(--radius-md);
  margin: 0 2px;
}

@media (min-width: 768px) {
  .settings-tab {
    margin: 0;
    width: 100%;
    justify-content: flex-start;
  }
}

.settings-tab:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.settings-tab.active {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-weight: 500;
}

.settings-tab-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.settings-tab-label {
  min-width: 0;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-content {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-lg);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.settings-tabpanel {
  outline: none;
}

.settings-section-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
  padding: var(--spacing-md) 0;
  margin: 0 0 var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
}

.settings-subsection {
  padding: 0.25rem 0 0.75rem;
}

.settings-subsection-title {
  margin: 0.75rem 0 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.settings-row {
  user-select: none;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.settings-row:last-of-type {
  border-bottom: none;
}

.settings-row-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  min-height: 2.25rem;
}

.settings-row-label {
  color: var(--text-primary);
}

.settings-row-desc {
  margin: 0.25rem 0 0;
  padding-right: 3rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.settings-select {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 36px;
  padding: 0 0.75rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.settings-select:hover {
  background: var(--bg-secondary);
}

.dark .settings-select {
  background: transparent;
}

.dark .settings-select:hover {
  background: var(--bg-tertiary);
}

.settings-select-arrow {
  font-size: 0.625rem;
  opacity: 0.7;
}

.settings-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.settings-select-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.settings-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  padding: 4px;
  border-radius: 12px;
  background: var(--bg-primary);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border-light);
  z-index: 10;
}

.settings-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 6px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.settings-dropdown-item:hover {
  background: var(--bg-secondary);
}

.settings-dropdown-item.is-active {
  background: var(--bg-secondary);
  font-weight: 500;
}

.settings-dropdown-left {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-dropdown-label {
  white-space: nowrap;
}

.model-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.model-option-main {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.model-option-texts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  line-height: 1.2;
}

.model-option-id {
  font-size: 0.6875rem;
  color: var(--text-muted);
  max-width: 340px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-brand-icon {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.model-brand-icon.is-card {
  width: 1.35rem;
  height: 1.35rem;
}

.brand-anthropic { background: #d97706; }
.brand-xai { background: #111827; }
.brand-google { background: #2563eb; }
.brand-openai { background: #0f766e; }
.brand-moonshot { background: #7c3aed; }
.brand-meta { background: #0284c7; }
.brand-zai { background: #c2410c; }
.brand-deepseek { background: #1d4ed8; }
.brand-qwen { background: #4f46e5; }

.settings-model-card {
  margin-top: 0.5rem;
  width: 100%;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  padding: 0.625rem 0.75rem;
  background: var(--bg-secondary);
}

.settings-model-card-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-model-name {
  font-size: 0.8125rem;
  color: var(--text-primary);
  font-weight: 600;
}

.settings-model-company {
  margin-top: 0.1rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.settings-model-feature {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.settings-model-meta {
  margin-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.settings-model-tag {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 999px;
  padding: 0.15rem 0.45rem;
}

.settings-dropdown-check {
  font-size: 0.75rem;
  color: var(--primary);
}

.settings-native-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  height: 36px;
  padding: 0 2rem 0 0.75rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.settings-native-select:hover {
  background: var(--bg-secondary);
}

.dark .settings-native-select {
  background: transparent;
}

.dark .settings-native-select:hover {
  background: var(--bg-tertiary);
}

.settings-native-select-arrow {
  position: absolute;
  right: 0.65rem;
  pointer-events: none;
}

.settings-row-slider {
  gap: 0.75rem;
  align-items: center;
}

.settings-row-label-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 180px;
}

.settings-row-value {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
}

.settings-slider {
  width: 260px;
  max-width: 52vw;
  accent-color: var(--primary);
}

.settings-row-actions {
  justify-content: flex-start;
  gap: 0.75rem;
}

.settings-save-status {
  font-size: 0.75rem;
  color: var(--text-muted);
  min-height: 1rem;
}

.settings-save-status.saving {
  color: var(--text-secondary);
}

.settings-save-status.error {
  color: #d14343;
}

.settings-theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}

.settings-theme-dot.is-default {
  background: var(--text-muted);
}

.settings-theme-dot.is-blue {
  background: #1f7cff;
}

.settings-theme-dot.is-green {
  background: #1fa973;
}

.settings-theme-dot.is-yellow {
  background: #f5b400;
}

.settings-theme-dot.is-pink {
  background: #ff4fa3;
}

.settings-theme-dot.is-orange {
  background: #ff7a2f;
}

.settings-row-sound {
  flex-wrap: wrap;
}

.settings-sound-actions {
  display: flex;
  align-items: center;
  gap: 0;
}

.settings-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 36px;
  padding: 0 0.75rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.settings-btn-secondary:hover {
  background: var(--bg-tertiary);
}

.settings-sound-divider {
  width: 1px;
  height: 1.25rem;
  background: var(--border-medium);
  margin: 0 0.25rem;
}

.settings-switch {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  border: none;
  border-radius: 9999px;
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: background 0.2s;
}

.settings-switch:hover {
  background: var(--border-medium);
}

.settings-switch.on {
  background: var(--primary);
}

.settings-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}

.settings-switch.on .settings-switch-thumb {
  transform: translateX(20px);
}

.settings-placeholder {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: var(--spacing-md) 0 0;
}
</style>
