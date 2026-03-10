<template>
  <!-- 首页仅占 messages-container 区域：单区域滚动，与对话区统一 -->
  <div class="agent-home messages-container">
    <div class="agent-home-inner">
      <!-- 顶部：标题 + 开始使用 -->
      <header class="agent-home-header">
        <h1 class="agent-home-title">{{ t('能思考、会行动的 AI 智能体', 'An AI Agent That Thinks and Acts') }}</h1>
        <p class="agent-home-desc">
          {{ t('理解你的目标，自主规划步骤，调用文件、搜索、终端等工具，一步步完成任务并实时反馈。', 'Understands your goals, plans steps autonomously, and calls tools like files, search, and terminal to complete tasks with real-time feedback.') }}
        </p>
        <button
          type="button"
          class="agent-home-cta"
          @click="$emit('start')"
        >
          {{ t('开始使用智能体', 'Start With Agent') }}
        </button>
      </header>

      <!-- 内置工具 -->
      <section class="agent-home-section">
        <h2 class="section-title">{{ t('内置 9 大核心工具', '9 Built-in Core Tools') }}</h2>
        <div class="tools-grid">
          <div
            v-for="(tool, i) in tools"
            :key="tool.name"
            class="tool-card"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
            <h3 class="tool-name">{{ tool.displayName }}</h3>
            <p class="tool-desc">{{ tool.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 三步流程 -->
      <section class="agent-home-section">
        <h2 class="section-title">{{ t('三步完成复杂任务', 'Complete Complex Tasks in 3 Steps') }}</h2>
        <div class="steps-row">
          <div class="step-card">
            <span class="step-num">1</span>
            <h3>{{ t('输入任务', 'Describe Task') }}</h3>
            <p>{{ t('用自然语言描述你的目标', 'Describe your goal in natural language') }}</p>
          </div>
          <span class="step-arrow">→</span>
          <div class="step-card">
            <span class="step-num">2</span>
            <h3>{{ t('智能体思考规划', 'Plan With Agent') }}</h3>
            <p>{{ t('分解步骤并调用工具执行', 'Break down steps and execute with tools') }}</p>
          </div>
          <span class="step-arrow">→</span>
          <div class="step-card">
            <span class="step-num">3</span>
            <h3>{{ t('返回结果', 'Deliver Result') }}</h3>
            <p>{{ t('实时流式输出与推理过程', 'Stream outputs and reasoning in real time') }}</p>
          </div>
        </div>
      </section>

      <!-- 能力亮点 -->
      <section class="agent-home-section">
        <h2 class="section-title">{{ t('能力亮点', 'Highlights') }}</h2>
        <div class="highlights-grid">
          <div class="highlight-card">
            <span class="highlight-icon">🧠</span>
            <h3>{{ t('自主规划', 'Autonomous Planning') }}</h3>
            <p>{{ t('根据目标自动拆解步骤，无需手写脚本', 'Auto-breaks down tasks by goal, no manual scripts required') }}</p>
          </div>
          <div class="highlight-card">
            <span class="highlight-icon">🔗</span>
            <h3>{{ t('多工具协作', 'Multi-tool Collaboration') }}</h3>
            <p>{{ t('文件、搜索、终端等工具链式配合', 'File, search, and terminal tools chained together') }}</p>
          </div>
          <div class="highlight-card">
            <span class="highlight-icon">⚡</span>
            <h3>{{ t('实时反馈', 'Real-time Feedback') }}</h3>
            <p>{{ t('推理与输出流式呈现，过程透明可追溯', 'Reasoning and output are streamed with transparent, traceable process') }}</p>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiLanguage } from '../composables/useUiLanguage'

defineEmits<{ (e: 'start'): void }>()
const { t } = useUiLanguage()

const tools = computed(() => [
  { name: 'DownloadResourceTool', displayName: t('资源下载', 'Resource Download'), desc: t('自动下载网络资源到本地', 'Download online resources to local automatically'), icon: '⬇' },
  { name: 'FileOperationTool', displayName: t('文件操作', 'File Operations'), desc: t('读写、创建、删除、重命名文件', 'Read, write, create, delete, and rename files'), icon: '📁' },
  { name: 'ImageGenerateTool', displayName: t('图像生成', 'Image Generation'), desc: t('根据描述生成 AI 图像', 'Generate AI images from prompts'), icon: '🖼' },
  { name: 'SpecialFileGenerationTool', displayName: t('文档生成', 'Document Generation'), desc: t('生成 Word、Excel、PPT 等文档', 'Generate Word, Excel, PPT, and more'), icon: '📄' },
  { name: 'TerminalOpTool', displayName: t('终端执行', 'Terminal Execution'), desc: t('执行系统命令和脚本', 'Run system commands and scripts'), icon: '⌨' },
  { name: 'TerminateTool', displayName: t('任务终止', 'Task Termination'), desc: t('智能判断任务完成并结束', 'Intelligently detect completion and stop task'), icon: '⏹' },
  { name: 'TimeTool', displayName: t('时间感知', 'Time Awareness'), desc: t('获取当前时间和日期', 'Get current time and date'), icon: '🕐' },
  { name: 'WebScrapingTool', displayName: t('网页抓取', 'Web Scraping'), desc: t('抓取和解析网页内容', 'Fetch and parse webpage content'), icon: '🔗' },
  { name: 'WebSearchTool', displayName: t('联网搜索', 'Web Search'), desc: t('实时搜索最新信息', 'Search the latest info in real time'), icon: '🔍' }
])
</script>

<style scoped>
.agent-home {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.agent-home-inner {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

.agent-home-header {
  text-align: center;
  padding: var(--spacing-lg) 0;
}

.agent-home-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
  line-height: 1.3;
}

.agent-home-desc {
  font-size: 0.9375rem;
  color: var(--text-muted);
  margin: 0 0 1.25rem;
  line-height: 1.5;
}

.agent-home-cta {
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.agent-home-cta:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.agent-home-section {
  padding: var(--spacing-lg) 0;
  border-top: 1px solid var(--border-light);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.tool-card {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  transition: border-color var(--duration-fast), background var(--duration-fast);
}

.tool-card:hover {
  border-color: var(--primary-alpha);
  background: var(--bg-tertiary);
}

.tool-icon {
  font-size: 1.25rem;
  display: block;
  margin-bottom: 0.25rem;
}

.tool-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}

.tool-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.steps-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.75rem;
  justify-content: space-between;
}

.step-card {
  flex: 1;
  min-width: 140px;
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  text-align: center;
}

.step-num {
  display: inline-flex;
  width: 1.75rem;
  height: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--primary-bg);
  color: var(--primary);
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.step-card h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}

.step-card p {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

.step-arrow {
  display: none;
  color: var(--text-muted);
  align-self: center;
}

@media (min-width: 640px) {
  .step-arrow {
    display: block;
  }
}

.highlights-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .highlights-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.highlight-card {
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
}

.highlight-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.highlight-card h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}

.highlight-card p {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.agent-home-footer {
  text-align: center;
  padding: var(--spacing-lg) 0;
}
</style>
