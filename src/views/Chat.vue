<template>
  <div class="chat-container">
    <!-- 无会话 id：首页（Agent + Tools + Execution） -->
    <template v-if="!hasChatId">
      <div class="home-container">
        <div class="home-layout">
          <!-- 左列：价值主张 + CTA + 能力标签 -->
          <div class="home-left">
            <div class="home-badge-row">
              <span class="home-badge-primary">{{ t('AI 开发平台 · 自动化工作台', 'AI Development Platform · Automation Workspace') }}</span>
              <span class="home-badge-sub">Agent · Tools · Execution</span>
            </div>
            <h1 class="home-title">
              {{ t('AI 不止会聊天，', 'AI does more than chat,') }}<br />
              {{ t('还能自动执行复杂任务', 'it can execute complex tasks automatically') }}
            </h1>
            <p class="home-subtitle">
              {{ t('多模型、工具调用和 Manus 智能体循环，将你的自然语言指令，变成可以落地的文件、图表、代码与报告。', 'Multi-models, tool calling, and Manus agent loops turn your natural language instructions into practical files, charts, code, and reports.') }}
            </p>
            <div class="home-cta-row">
              <button
                type="button"
                class="home-cta-primary"
                :disabled="isStreaming"
                @click="useSuggestion('帮我规划一个包含前端、后端和部署的 AI 应用开发方案，并拆分为可执行任务清单',10)"
              >
                {{ t('开始一个任务', 'Start a task') }}
              </button>
              <button
                type="button"
                class="home-cta-secondary"
                :disabled="isStreaming"
                @click="useSuggestion('展示一下你能生成哪些文件、图表、代码和自动化报告，并说明你会用到哪些工具',11)"
              >
                {{ t('View capability examples', 'View capability examples') }}
              </button>
            </div>
            <div class="home-feature-tags" :class="{ 'is-collapsed': !homeDetailsExpanded }">
              <div class="home-feature-group">
                <div class="home-feature-group-title">🎯 {{ t('输入能力', 'Input') }}</div>
                <span class="home-tag">{{ t('多模型选择 · 上下文窗口 · 语音风格', 'Model selection · Context window · Voice style') }}</span>
                <span class="home-tag">{{ t('文件 / 图片 / 多模态上传 · Embedding + RAG', 'File / image / multimodal upload · Embedding + RAG') }}</span>
                <span class="home-tag">{{ t('语音输入 · OCR 识别', 'Voice input · OCR') }}</span>
              </div>
              <div class="home-feature-group">
                <div class="home-feature-group-title">⚙️ {{ t('处理能力', 'Processing') }}</div>
                <span class="home-tag">{{ t('流式 Markdown 解析 · 代码块高亮', 'Streaming Markdown parsing · Code highlighting') }}</span>
                <span class="home-tag">{{ t('工具调用：文件生成 · 图片生成 · ECharts 图表', 'Tool calling: file generation · image generation · ECharts') }}</span>
                <span class="home-tag">{{ t('工具调用：网页抓取 · 下载 · 搜索 · 终端', 'Tool calling: web scraping · download · search · terminal') }}</span>
                <span class="home-tag">{{ t('MCP（高德）：路径规划 · 地理位置 · 天气 · IP 定位', 'MCP (Amap): route planning · geolocation · weather · IP location') }}</span>
              </div>
              <div class="home-feature-group">
                <div class="home-feature-group-title">📤 {{ t('输出能力', 'Output') }}</div>
                <span class="home-tag">{{ t('会话记忆：滑动窗口 · 摘要记忆 · 向量检索', 'Session memory: sliding window · summary memory · vector retrieval') }}</span>
                <span class="home-tag">{{ t('文本朗读 · PDF / Excel 导出', 'TTS reading · PDF / Excel export') }}</span>
              </div>
            </div>
            <button
              type="button"
              class="home-collapse-toggle"
              :disabled="isStreaming"
              @click="homeDetailsExpanded = !homeDetailsExpanded"
            >
              {{ homeDetailsExpanded ? t('收起能力说明', 'Collapse capabilities') : t('展开能力说明', 'Expand capabilities') }}
            </button>
          </div>

          <!-- 右列：Agent 执行流程 + 工具能力示意 -->
          <div class="home-right">
            <div class="home-agent-card">
              <div class="home-agent-card-header">
                <span class="home-agent-badge">Manus Agent</span>
                <span class="home-agent-status">
                  <span class="home-agent-dot"></span>
                  {{ t('准备执行', 'Ready') }}
                </span>
              </div>
              <div class="home-agent-flow" :class="{ 'is-collapsed': !homeDetailsExpanded }">
                <div class="home-flow-step">
                  <div class="home-flow-index">1</div>
                  <div class="home-flow-body">
                    <div class="home-flow-title">{{ t('理解你的目标', 'Understand your goal') }}</div>
                    <div class="home-flow-desc">{{ t('「生成一份本周运营数据分析报告，并输出可视化图表」', '"Generate an operations analysis report for this week and output visual charts"') }}</div>
                  </div>
                </div>
                <div class="home-flow-step">
                  <div class="home-flow-index">2</div>
                  <div class="home-flow-body">
                    <div class="home-flow-title">{{ t('规划 Agent 循环', 'Plan agent loop') }}</div>
                    <div class="home-flow-chips">
                      <span class="home-flow-chip">{{ t('模型 & 上下文选择', 'Model & context selection') }}</span>
                      <span class="home-flow-chip">{{ t('会话记忆检索', 'Session memory retrieval') }}</span>
                      <span class="home-flow-chip">{{ t('任务拆解', 'Task decomposition') }}</span>
                    </div>
                  </div>
                </div>
                <div class="home-flow-step">
                  <div class="home-flow-index">3</div>
                  <div class="home-flow-body">
                    <div class="home-flow-title">{{ t('调用工具执行', 'Execute with tools') }}</div>
                    <div class="home-flow-chips">
                      <span class="home-flow-chip">{{ t('读取 / 解析文件', 'Read / parse files') }}</span>
                      <span class="home-flow-chip">{{ t('生成 ECharts 图表', 'Generate ECharts charts') }}</span>
                      <span class="home-flow-chip">{{ t('终端执行脚本', 'Run terminal scripts') }}</span>
                      <span class="home-flow-chip">{{ t('高德 MCP 路线 / 天气', 'Amap MCP route / weather') }}</span>
                    </div>
                  </div>
                </div>
                <div class="home-flow-step">
                  <div class="home-flow-index">4</div>
                  <div class="home-flow-body">
                    <div class="home-flow-title">{{ t('交付可用成果', 'Deliver outcomes') }}</div>
                    <div class="home-flow-desc">
                      {{ t('自动生成结构化报告 / 代码片段 / 多格式文件，一键导出 PDF / Excel 或继续迭代。', 'Automatically generate structured reports / code snippets / multi-format files, export to PDF / Excel in one click, or keep iterating.') }}
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="home-collapse-toggle home-collapse-toggle--flow"
                :disabled="isStreaming"
                @click="homeDetailsExpanded = !homeDetailsExpanded"
              >
                {{ homeDetailsExpanded ? t('收起执行流程', 'Collapse workflow') : t('展开执行流程', 'Expand workflow') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 快速示例入口：使用已有 suggestions 数据 -->
        <div class="home-suggestions">
          <div class="home-suggestions-header">
            <span class="home-suggestions-icon">✨</span>
            <span class="home-suggestions-title">{{ t('快速开始', 'Quick Start') }}</span>
          </div>
          <div class="suggestions-grid">
            <button
              v-for="s in pagedSuggestions"
              :key="s.id"
              class="suggestion-chip"
              @click="useSuggestion(s.description?s.description:s.text,s.id)"
              :disabled="isStreaming"
            >
              <span class="suggestion-icon">{{ s.icon }}</span>
              <span class="suggestion-text">{{ s.text }}</span>
            </button>
          </div>
          <div v-if="totalSuggestionPages > 1" class="home-suggestions-pager">
            <button
              type="button"
              class="home-pager-btn"
              :disabled="isStreaming || homeSuggestionPage <= 1"
              @click="prevSuggestionPage"
            >
              {{ t('上一页', 'Prev') }}
            </button>
            <span class="home-pager-text">{{ homeSuggestionPage }} / {{ totalSuggestionPages }}</span>
            <button
              type="button"
              class="home-pager-btn"
              :disabled="isStreaming || homeSuggestionPage >= totalSuggestionPages"
              @click="nextSuggestionPage"
            >
              {{ t('下一页', 'Next') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 有会话 id：聊天头部 + 消息列表 -->
    <template v-else>
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-title-section">
        <button class="back-button" @click="goHome" :title="t('返回', 'Back')">
          ←
        </button>
        <div class="chat-info">
          <div class="chat-title">{{ t('对话', 'Chat') }}</div>
          <div class="chat-subtitle">{{ isLoggedIn()?messageTotol:messages.length
           }} {{ t('条消息', 'messages') }}</div>
        </div>
      </div>
      
      <div class="chat-actions">
        <NotificationCenter />
        <button class="chat-action-btn" :title="t('导出对话', 'Export chat')" @click="exportChat">
          📤
        </button>
        <button class="chat-action-btn" :title="t('更多选项', 'More options')">
          ⋯
        </button>
      </div>
    </div>

    <!-- 消息区域 -->
    <div class="messages-container" ref="messagesContainer" @scroll="handleMessagesScroll">
      <div v-if="messagesLoading" class="empty-state">
        <div class="loading-dots">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        <div class="empty-state-title">{{ t('正在加载会话内容...', 'Loading chat...') }}</div>
      </div>
      <div v-else-if="messages.length === 0" class="empty-state">
        <div class="empty-state-icon">💬</div>
        <div class="empty-state-title">{{ t('开始对话', 'Start Chat') }}</div>
        <div class="empty-state-description">
          {{ t('输入您的第一条消息开始与AI助手对话', 'Enter your first message to chat with AI assistant') }}
        </div>
      </div>

      <div
        v-for="(message, index) in visibleMessages"
        :key="`msg-${index}`"
        class="message-group"
        :class="message.role"
      >
       <!-- 用户消息附件：展示在该条用户消息上方，简约卡片 -->
       <div v-if="message.role === 'user' && message.aiAttachments?.length" class="message-attachments">
         <template
           v-for="att in message.aiAttachments"
           :key="att.id"
         >
           <button
             v-if="isImageAttachment(att.file_type)"
             type="button"
             class="message-attach-card is-image"
             @click="openImagePreview(att.file_url, att.file_name)"
           >
             <span class="message-attach-icon">
               <img :src="att.file_url" class="message-attach-thumb" :alt="att.file_name" />
             </span>
             <span class="message-attach-name">{{ att.file_name }}</span>
             <span class="message-attach-meta">{{ formatFileSize(att.file_size) }} · {{ formatFileType(att.file_type) }}</span>
           </button>
           <a
             v-else
             :href="att.file_url"
             target="_blank"
             rel="noopener"
             class="message-attach-card"
           >
             <span class="message-attach-icon">
               <span class="message-attach-file-icon">📎</span>
             </span>
             <span class="message-attach-name">{{ att.file_name }}</span>
             <span class="message-attach-meta">{{ formatFileSize(att.file_size) }} · {{ formatFileType(att.file_type) }}</span>
           </a>
         </template>
       </div>

       <!-- 用户消息: 纯文本，有气泡 -->
    <div v-if="message.role === 'user'" class="message-bubble user">
      <div class="message-content user-text">{{ normalizeMessageText(message.text) }}</div>
    </div>

    <div v-else class="message-wrapper assistant-wrapper">
      <!-- Assistant 消息附件（如果有）：展示在消息上方 -->
      <div v-if="message.aiAttachments?.length" class="message-attachments">
        <template
          v-for="att in message.aiAttachments"
          :key="att.id"
        >
          <button
            v-if="isImageAttachment(att.file_type)"
            type="button"
            class="message-attach-card is-image"
            @click="openImagePreview(att.file_url, att.file_name)"
          >
            <span class="message-attach-icon">
              <img :src="att.file_url" class="message-attach-thumb" :alt="att.file_name" />
            </span>
            <span class="message-attach-name">{{ att.file_name }}</span>
            <span class="message-attach-meta">{{ formatFileSize(att.file_size) }} · {{ formatFileType(att.file_type) }}</span>
          </button>
          <a
            v-else
            :href="att.file_url"
            target="_blank"
            rel="noopener"
            class="message-attach-card"
          >
            <span class="message-attach-icon">
              <span class="message-attach-file-icon">📎</span>
            </span>
            <span class="message-attach-name">{{ att.file_name }}</span>
            <span class="message-attach-meta">{{ formatFileSize(att.file_size) }} · {{ formatFileType(att.file_type) }}</span>
          </a>
        </template>
      </div>
      <div class="message-bubble assistant">
        <div class="message-content assistant-content">
          <!-- 推理模式展示 -->
          <Think
            v-if="getThinkContent(message as AssistantMessage)"
            :thinkchunk="getThinkContent(message as AssistantMessage)"
            :thinking="(message as AssistantMessage).isThinkingPhase"
            :thinking-time="(message as AssistantMessage).thinkingTime"
            style="margin-bottom: 25px;"
          />
          <!-- ECharts 块：流式未完成时先用骨架占位，完成后渲染图表 -->
          <div v-if="getEchartsState(message as AssistantMessage).loading" class="echarts-skeleton">
            <div class="skeleton-rect"></div>
          </div>
          <EchartsRenderer
            v-else-if="getEchartsState(message as AssistantMessage).option"
            :option="getEchartsState(message as AssistantMessage).option!"
            class="echarts-block"
          />
          <!-- 协议 <<<ATTACHMENT_LOADING>>>：正在读取附件骨架 -->
          <div
            v-if="(message as AssistantMessage).attachmentLoading"
            class="attachment-loading"
          >
            <span class="attachment-loading-text">{{ t('正在加载附件', 'Loading attachment') }}</span>
            <span class="attachment-loading-wave" aria-hidden="true"></span>
          </div>
          <div
            v-if="shouldShowAssistantLoading(message as AssistantMessage)"
            class="assistant-loading"
            aria-live="polite"
          >
            <span class="assistant-loading-text">{{ t('正在思考', 'Thinking') }}</span>
            <span class="assistant-loading-dots" aria-hidden="true">
              <span class="assistant-loading-dot"></span>
              <span class="assistant-loading-dot"></span>
              <span class="assistant-loading-dot"></span>
            </span>
          </div>
          <div
            v-if="(message as AssistantMessage).text || (message as AssistantMessage).isStreaming"
            :key="`msg-${index}`"
            class="vue-markdown-wrapper markdown-sse-content"
            :class="{
              'is-streaming': (message as AssistantMessage).isStreaming,
              'no-fade': (message as AssistantMessage).isStreaming || (message as AssistantMessage).renderedByStream
            }"
            v-html="getAssistantMessageHtml(message as AssistantMessage)"
            v-code-block-header
          />
          <!-- 生成文件模式：显示提取的文件卡片（整卡可点击下载） -->
          <div
            v-if="(message as AssistantMessage).generatedFiles && (message as AssistantMessage).generatedFiles!.length > 0"
            class="generated-files-container"
          >
            <div
              v-for="(file, fileIndex) in (message as AssistantMessage).generatedFiles"
              :key="`file-${index}-${fileIndex}`"
              class="generated-file-card"
              @click="downloadFile(file.url, file.fileName)"
              :title="t('点击下载文件', 'Click to download file')"
            >
              <div
                class="generated-file-icon"
                :class="`generated-file-icon--${getFileIconColor(file.fileType)}`"
              >
                {{ getFileIcon(file.fileType) }}
              </div>
              <div class="generated-file-info">
                <span class="generated-file-name">{{ file.fileName }}</span>
                <span class="generated-file-meta">
                  {{ t('AI生成', 'AI Generated') }} · {{ file.fileType ? file.fileType.toUpperCase() : t('文件', 'File') }} · {{ formatGeneratedTime(message.timestamp) }}
                </span>
              </div>
              <div class="generated-file-actions" @click.stop>
                <button
                  type="button"
                  class="generated-file-btn generated-file-btn-download"
                  :title="t('下载', 'Download')"
                  @click="downloadFile(file.url, file.fileName)"
                >
                  <el-icon><Download /></el-icon>
                </button>
                <el-dropdown trigger="click" @command="(cmd: string) => handleGeneratedFileMore(cmd, file)" placement="bottom-end">
                  <button type="button" class="generated-file-btn generated-file-btn-more" :title="t('更多', 'More')">
                    <el-icon><MoreFilled /></el-icon>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="open">{{ t('在新窗口打开', 'Open in new window') }}</el-dropdown-item>
                      <el-dropdown-item command="copy">{{ t('复制链接', 'Copy link') }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
          <!-- 图片生成模式骨架：仅在选择图片生成且图片 markdown 尚未收到时显示在文字下方 -->
          <div
            v-if="(message as AssistantMessage).isImageLoading"
            class="image-skeleton-block"
          ></div>
          <span
            v-if="!(message as AssistantMessage).text && !(message as AssistantMessage).isStreaming && !(message as AssistantMessage).isImageLoading && !(message as AssistantMessage).attachmentLoading"
            class="text-slate-400 text-sm"
          >
            {{ t('（无内容）', '(No content)') }}
          </span>
        </div>
      </div>
    </div>
        
        <div class="message-meta">
          <span class="message-time">
            {{ formatTime(message.timestamp || new Date()) }}
            <template
              v-if="
                message.role === 'assistant' &&
                (message as AssistantMessage).cost &&
                (message as AssistantMessage).cost! > 0
              "
            >
              · {{ Math.round((message as AssistantMessage).cost! / 1000) }}s
            </template>
          </span>
          <div class="message-actions">
            <button 
              class="message-action" 
              title="复制" 
              @click="copyMessage(message)"
            >
              <el-icon><CopyDocument /></el-icon>
            </button>
            <button 
              class="message-action" 
              title="重新生成" 
              @click="regenerateMessage(index)"
              v-if="message.role === 'assistant'"
            >
              <el-icon><RefreshRight /></el-icon>
            </button>
            <button
              v-if="message.role === 'assistant'"
              :class="['message-action', { 'message-action-active': (message as AssistantMessage).isFavor }]"
              :title="(message as AssistantMessage).isFavor ? '取消点赞' : '点赞'"
              :disabled="!(message as AssistantMessage).messageId || (message as AssistantMessage).favorLoading"
              @click="toggleMessageFavor(message as AssistantMessage)"
            >
              <el-icon><Pointer /></el-icon>
            </button>
            <button
              v-if="message.role === 'assistant'"
              :class="['message-action', { 'message-action-tts-active': ttsPlaying }]"
              :title="ttsPlaying ? '暂停' : '朗读'"
              @click="ttsPlaying ? stopReadAloud() : readMessageAloud(message)"
            >
              <el-icon>
                <Headset v-if="!ttsPlaying" />
                <VideoPause v-else />
              </el-icon>
            </button>
            <div
              v-if="message.role === 'assistant'"
              class="message-more-wrap"
            >
              <button
                class="message-action"
                title="更多操作"
                @click.stop="toggleMessageMoreMenu(index)"
              >
                <el-icon>
                  <MoreFilled />
                </el-icon>
              </button>
              <div
                v-if="messageMoreMenuIndex === index"
                class="message-more-menu"
                @click.stop
              >
                <div class="message-more-header">
                  <div class="message-more-time">
                    {{ formatMessageMenuTime(message.timestamp || new Date()) }}
                  </div>
                  <div
                    v-if="message.role === 'assistant'"
                    class="message-more-meta"
                  >
                    <span
                      v-if="(message as AssistantMessage).token != null"
                      class="message-more-token"
                    >
                      Token：{{ (message as AssistantMessage).token }}
                    </span>
                    <span
                      v-if="
                        (message as AssistantMessage).cost &&
                        (message as AssistantMessage).cost! > 0
                      "
                      class="message-more-cost"
                    >
                      <template v-if="(message as AssistantMessage).token != null">
                        ·
                      </template>
                      耗时：{{ Math.round((message as AssistantMessage).cost! / 1000) }}s
                    </span>
                  </div>
                </div>
                <div class="message-more-divider"></div>
                <button
                  type="button"
                  class="message-more-item"
                  @click="exportSingleMessage(message, 'txt'); closeMessageMoreMenu()"
                >
                  导出为 TXT
                </button>
                <button
                  type="button"
                  class="message-more-item"
                  @click="exportSingleMessage(message, 'md'); closeMessageMoreMenu()"
                >
                  导出为 Markdown
                </button>
                <button
                  type="button"
                  class="message-more-item"
                  @click="exportSingleMessage(message, 'pdf'); closeMessageMoreMenu()"
                >
                  导出为 PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- 输入区域（首页与对话页共用） -->
    <div :class="{ 'conversation-starter': !hasChatId }">
    <div class="input-container">
      <!-- 附件展示区：卡片式，左侧图标+进度圈，文件名+类型，右上角删除 -->
      <div v-if="attachments.length > 0" class="attachments-list">
        <div v-for="item in attachments" :key="item.id" class="attach-card">
          <button
            v-if="item.file.type.startsWith('image/') && item.status === 'done' && item.fileUrl"
            type="button"
            class="attach-card-icon attach-card-preview-btn"
            @click="openImagePreview(item.fileUrl, item.file.name)"
          >
            <img :src="item.fileUrl" class="attach-card-img" :alt="item.file.name" />
          </button>
          <div v-else class="attach-card-icon">
            <template v-if="item.file.type.startsWith('image/') && item.status === 'done' && item.fileUrl">
              <img :src="item.fileUrl" class="attach-card-img" :alt="item.file.name" />
            </template>
            <template v-else>
              <span class="attach-card-file-icon" :class="{ 'is-text': isTextLikeFile(item.file.name, item.file.type) }">
                <svg class="attach-card-file-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M9.25 3A2.25 2.25 0 0 0 7 5.25v13.5A2.25 2.25 0 0 0 9.25 21h8.5A2.25 2.25 0 0 0 20 18.75v-9a.75.75 0 0 0-.22-.53l-6-6A.75.75 0 0 0 13.25 3h-4Zm4.5 1.81L18.19 9h-2.94a1.5 1.5 0 0 1-1.5-1.5V4.81Z"
                  />
                </svg>
                <span class="attach-card-ext">{{ getFileExt(item.file.name) }}</span>
              </span>
            </template>
            <!-- 圆圈进度条（上传中或失败时显示） -->
            <svg v-if="item.status !== 'done' || item.error" class="attach-card-progress" viewBox="0 0 36 36" width="36" height="36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--slate-200)" stroke-width="3" />
              <circle
                cx="18" cy="18" r="15"
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
            <span class="attach-card-type">{{ item.status === 'error' ? t('上传失败', 'Upload failed') : (item.file.type.startsWith('image/') ? t('图片', 'Image') : t('文件', 'File')) }}</span>
          </div>
          <button type="button" class="attach-card-remove" title="删除附件" @click="removeAttachment(item.id)" aria-label="删除">×</button>
        </div>
      </div>

      <div class="input-wrapper">
        <!-- 输入框容器，支持拖拽/粘贴文件 -->
        <div
          class="input-box-container"
          :class="{ 'input-box-dragover': isDragOverInput, 'input-box-has-attachments': attachments.length > 0 }"
          @dragover="onInputDragOver"
          @dragleave="onInputDragLeave"
          @drop="onInputDrop"
        >
          <!-- 左侧功能区 -->
          <div class="input-leading">
            <!-- + 按钮 -->
            <el-popover
              :visible="showInputMenu"
              placement="top-start"
              :width="200"
              trigger="click"
              popper-class="input-menu-popover"
            >
              <template #reference>
                <button
                  ref="inputMenuTriggerRef"
                  type="button"
                  class="input-prefix-btn"
                  :disabled="isStreaming"
                  @click="toggleInputMenu"
                  title="更多功能"
                >
                  +
                </button>
              </template>

              <!-- 功能选项卡片容器 -->
              <div class="input-menu-card">
                <button
                  type="button"
                  class="input-menu-card-item"
                  :class="{ 'active': isThinkingMode }"
                  @click="toggleThinkingMode"
                >
                  <span class="menu-item-icon">💡</span>
                  <span class="menu-item-text">{{ isThinkingMode ? t('关闭推理模式', 'Disable reasoning') : t('思考', 'Reason') }}</span>
                </button>
                <button
                  type="button"
                  class="input-menu-card-item"
                  :class="{ 'active': isGenerateFileMode }"
                  @click="toggleGenerateFileMode"
                >
                  <span class="menu-item-icon">📄</span>
                  <span class="menu-item-text">{{ t('生成文件', 'Generate file') }}</span>
                </button>
                <button
                  type="button"
                  class="input-menu-card-item"
                  :class="{ 'active': isImageGenMode }"
                  @click="toggleImageGenMode"
                >
                  <span class="menu-item-icon">🖼️</span>
                  <span class="menu-item-text">{{ isImageGenMode ? t('图片模式', 'Image mode') : t('创建图片', 'Create image') }}</span>
                </button>
                <button
                  type="button"
                  class="input-menu-card-item"
                  :class="{ 'active': isSearchMode }"
                  @click="toggleSearchMode"
                >
                  <span class="menu-item-icon">🔍</span>
                  <span class="menu-item-text">{{ isSearchMode ? '深度研究' : '深度研究' }}</span>
                </button>

                <el-popover
                  placement="right-start"
                  :width="220"
                  trigger="hover"
                  popper-class="more-menu-popover"
                  :offset="8"
                >
                  <template #reference>
                    <button
                      type="button"
                      class="input-menu-card-item input-card-menu-item"
                      @click="showInputMenu = false"
                    >
                      <span class="menu-item-text">更多</span>
                      <span class="menu-item-arrow">›</span>
                    </button>
                  </template>
                  
                  <!-- 更多菜单内容 -->
                  <div class="more-menu-content">
                    <div role="group" class="more-menu-group">
                      <button
                        role="menuitemradio"
                        class="more-menu-item"
                        :class="{ 'more-menu-item-active': isEchartsMode }"
                        tabindex="0"
                        type="button"
                        @click="toggleEchartsMode"
                      >
                        <div class="more-menu-item-content">
                          <div class="more-menu-icon">📊</div>
                          <div class="more-menu-text">{{ isEchartsMode ? '图表（已开启）' : '画布（图表）' }}</div>
                        </div>
                      </button>
                      <button role="menuitemradio" class="more-menu-item" tabindex="0" type="button">
                        <div class="more-menu-item-content">
                          <div class="more-menu-icon">📝</div>
                          <div class="more-menu-text">测验</div>
                        </div>
                      </button>
                    </div>
                    <div role="group" class="more-menu-group">
                      <button role="menuitemradio" class="more-menu-item" tabindex="0" type="button" @click="openOcrDialog">
                        <div class="more-menu-item-content">
                          <div class="more-menu-icon">🔤</div>
                          <div class="more-menu-text">图片文字识别 (OCR)</div>
                        </div>
                      </button>
                      <a href="/apps" target="_blank" rel="noreferrer" class="more-menu-item more-menu-link" tabindex="0">
                        <div class="more-menu-item-content">
                          <div class="more-menu-icon">⭐</div>
                          <div class="more-menu-text">探索应用</div>
                        </div>
                      </a>
                    </div>
                  </div>
                </el-popover>
              </div>
            </el-popover>
          </div>

          <!-- 输入框主区域（支持粘贴文件） -->
          <div class="input-primary-wrap">
            <textarea
              ref="messageInput"
              v-model="currentMessage"
              @keydown="handleKeydown"
              @input="adjustInputHeight"
              @paste="onInputPaste"
              :placeholder="hasChatId ? '输入消息、拖拽/粘贴文件或点击麦克风...' : '输入您的问题、拖拽/粘贴文件或点击麦克风，开始对话...'"
              class="message-input"
              rows="1"
            ></textarea>
          </div>

          <!-- 右侧操作区：附件 | 麦克风/录音 | 发送（与 ChatGPT trailing 一致） -->
          <div class="input-trailing">
            <button
              class="input-action-btn"
              title="添加附件"
              :disabled="isStreaming || isUploading"
              @click="triggerFileSelect"
            >
              <svg v-if="!isUploading" class="attach-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M16.5 6.75a3.75 3.75 0 0 0-5.303 0l-5.25 5.25a5.25 5.25 0 0 0 7.425 7.425l6.75-6.75a3 3 0 1 0-4.243-4.243l-6.053 6.053a.75.75 0 1 0 1.06 1.06l6.053-6.052a1.5 1.5 0 1 1 2.121 2.121l-6.75 6.75a3.75 3.75 0 0 1-5.303-5.303l5.25-5.25a2.25 2.25 0 0 1 3.182 3.182l-5.25 5.25a.75.75 0 0 0 1.06 1.061l5.25-5.25a3.75 3.75 0 0 0 0-5.303Z"
                />
              </svg>
              <div v-else class="loading-spinner"></div>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".mp4,.mkv,.mov,video/mp4,video/x-matroska,video/matroska,video/quicktime,image/*"
              style="display: none"
              @change="handleFileChange"
            />
            <button
              type="button"
              class="input-action-btn mic-btn-trailing"
              :class="{ 'mic-btn-recording': isDictating }"
              :disabled="isStreaming"
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
              class="send-button"
              @click="isStreaming ? stopStreaming() : (hasChatId ? handleSend() : startNewConversation())"
              :disabled="(!currentMessage.trim() && !isStreaming) || hasUnconfirmedAttachments"
              :title="isStreaming ? '停止生成' : (hasChatId ? '发送消息 (Enter)' : '开始对话')"
            >
              <span v-if="!isStreaming">🚀</span>
              <span v-else>⏹</span>
            </button>
          </div>

          <!-- 模式标签区域（思考模式 / 图片生成模式 / 深度搜索模式 / 生成文件模式） - 显示在底部 -->
          <div
            v-if="isThinkingMode || isImageGenMode || isSearchMode || isGenerateFileMode || isEchartsMode"
            class="mode-tags"
          >
            <div v-if="isThinkingMode" class="thinking-tag">
              <span class="thinking-icon">💡</span>
              <span class="thinking-text">思考</span>
              <button
                type="button"
                class="thinking-close-btn"
                @click="toggleThinkingMode"
                :title="t('关闭思考模式', 'Close reasoning mode')"
              >
                ×
              </button>
            </div>
            <div v-if="isEchartsMode" class="thinking-tag">
              <span class="thinking-icon">📊</span>
              <span class="thinking-text">图表</span>
              <button
                type="button"
                class="thinking-close-btn"
                @click="toggleEchartsMode"
                :title="t('关闭图表模式', 'Close chart mode')"
              >
                ×
              </button>
            </div>
            <div v-if="isImageGenMode" class="image-tag">
              <span class="image-icon">🖼️</span>
              <span class="image-text">图片生成</span>
              <button
                type="button"
                class="thinking-close-btn"
                @click="toggleImageGenMode"
                :title="t('关闭图片模式', 'Close image mode')"
              >
                ×
              </button>
            </div>
            <div v-if="isSearchMode" class="thinking-tag">
              <span class="thinking-icon">🔍</span>
              <span class="thinking-text">深度研究</span>
              <button
                type="button"
                class="thinking-close-btn"
                @click="toggleSearchMode"
                :title="t('关闭深度研究模式', 'Close deep research mode')"
              >
                ×
              </button>
            </div>
            <div v-if="isGenerateFileMode" class="thinking-tag">
              <span class="thinking-icon">📄</span>
              <span class="thinking-text">生成文件</span>
              <button
                type="button"
                class="thinking-close-btn"
                @click="toggleGenerateFileMode"
                :title="t('关闭生成文件模式', 'Close file-generation mode')"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 录音转写气泡：Teleport 到 body，固定于屏幕底部上方，首页/对话页都不会被挡 -->
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

      <!-- OCR 图片文字识别对话框（挂载到 body，避免被输入区域遮挡） -->
      <el-dialog
        v-model="ocrDialogVisible"
        title="图片文字识别 (OCR)"
        width="480"
        class="ocr-dialog"
        append-to-body
        :close-on-click-modal="true"
        @closed="onOcrDialogClosed"
      >
        <div class="ocr-dialog-body">
          <div class="ocr-upload-area" @click="ocrFileInput?.click()" @dragover.prevent="ocrDragOver = true" @dragleave="ocrDragOver = false" @drop.prevent="onOcrDrop">
            <input
              ref="ocrFileInput"
              type="file"
              accept="image/*"
              class="ocr-file-input"
              @change="onOcrFileChange"
            />
            <template v-if="ocrImagePreview">
              <img :src="ocrImagePreview" class="ocr-preview-img" alt="预览" />
              <p class="ocr-preview-name">{{ ocrImageFile?.name }}</p>
            </template>
            <template v-else>
              <span class="ocr-upload-icon">🖼️</span>
              <p class="ocr-upload-text">{{ ocrDragOver ? '松开上传' : '点击或拖拽图片到此处' }}</p>
              <p class="ocr-upload-hint">仅支持图片格式</p>
            </template>
          </div>
          <div v-if="ocrResult !== null" class="ocr-result-wrap">
            <label class="ocr-result-label">{{ t('识别结果', 'OCR Result') }}</label>
            <div class="ocr-result-content">{{ ocrResult === '' ? '（未识别到文字）' : ocrResult }}</div>
            <button type="button" class="ocr-copy-btn" :class="{ 'ocr-copy-done': ocrCopyDone }" @click="copyOcrResult">
              {{ ocrCopyDone ? t('已复制', 'Copied') : t('复制结果', 'Copy result') }}
            </button>
          </div>
        </div>
        <template #footer>
          <div class="ocr-dialog-footer">
            <button type="button" class="ocr-btn ocr-btn-cancel" @click="ocrDialogVisible = false">{{ t('关闭', 'Close') }}</button>
            <button type="button" class="ocr-btn ocr-btn-primary" :disabled="!ocrImageFile || ocrLoading" @click="submitOcr">
              {{ ocrLoading ? t('识别中...', 'Recognizing...') : t('开始识别', 'Start OCR') }}
            </button>
          </div>
        </template>
      </el-dialog>
      <Teleport to="body">
        <div v-if="imagePreview.visible" class="image-preview-backdrop" @click="closeImagePreview">
          <div class="image-preview-dialog" @click.stop>
            <button type="button" class="image-preview-close" @click="closeImagePreview" aria-label="关闭">✕</button>
            <img :src="imagePreview.src" :alt="imagePreview.name" class="image-preview-img" />
            <div v-if="imagePreview.name" class="image-preview-name">{{ imagePreview.name }}</div>
          </div>
        </div>
      </Teleport>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { MoreFilled, CopyDocument, RefreshRight, Headset, VideoPause, Pointer, Download } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { createSession, getSessions, updateLastAssistantContent, updateSessionTitle } from '../stores/sessions'
import { isLoggedIn, getToken } from '../stores/auth'
import { apiFetch } from '../api/http'

import { uploadFile } from '../api/upload'
import { compressMediaAttachment, isAllowedVideoFormat } from '../utils/attachment-compress'
import { streamChat, streamRegenerate, StreamChatError, StreamChatErrorCode, cancelChat, favorChatMessage } from '../api/chat'
import { ensureAnonIdentified } from '../api/anon'
import { getOcr } from '../api/ocr'
import { readText as ttsReadText, stopTts } from '../api/tts'
import { transformMarkdownForStream } from '../utils/markdown'
import { enhanceCodeBlocks } from '../utils/code-block'
import Think from '../components/Think.vue'
import EchartsRenderer from '../components/EchartsRenderer.vue'
import NotificationCenter from '../components/NotificationCenter.vue'
import { PreParse, type SymbolBlock } from '../utils/pre-parse'
import { ElPopover, ElMessage } from 'element-plus'
import { useUiLanguage } from '../composables/useUiLanguage'


const { t, uiLocale } = useUiLanguage()

const getAsrWsUrl = (): string => {
  const env = (import.meta as any).env
  if (env?.VITE_ASR_WS_URL) return env.VITE_ASR_WS_URL
  const protocol =
    typeof location !== 'undefined' && location.protocol === 'https:'
      ? 'wss:'
      : 'ws:'
  return `${protocol}//localhost:8123/api/ws/asr`
}

const getTtsWsUrl = (sessionId: string): string => {
  const env = (import.meta as any).env
  if (env?.VITE_TTS_WS_URL) {
    const base = env.VITE_TTS_WS_URL
    return base.includes('?') ? `${base}&sessionId=${encodeURIComponent(sessionId)}` : `${base}?sessionId=${encodeURIComponent(sessionId)}`
  }
  const protocol = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//localhost:8123/api/ws/tts?sessionId=${encodeURIComponent(sessionId)}`
}

/** Float32 转 16kHz 16bit PCM（用于百炼 ASR） */
function floatTo16BitPCM(float32Arr: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Arr.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Arr.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Arr[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

/** 为助手消息中的链接统一设置为新标签页打开 */
function enhanceAssistantLinks(rootEl: HTMLElement) {
  const links = rootEl.querySelectorAll<HTMLAnchorElement>('a[href]')
  links.forEach((a) => {
    const href = a.getAttribute('href') || ''
    if (!href) return
    // 仅处理 http/https 外链，避免影响站内路由
    if (/^https?:\/\//i.test(href)) {
      a.target = '_blank'
      // 保持安全性：新标签页不共享 window.opener
      const rel = a.rel ? a.rel.split(/\s+/) : []
      if (!rel.includes('noopener')) rel.push('noopener')
      if (!rel.includes('noreferrer')) rel.push('noreferrer')
      a.rel = rel.join(' ').trim()
    }
  })
}

/** 代码块头部指令：在 v-html 更新后执行（代码高亮 + 外链新标签页） */
const vCodeBlockHeader = {
  mounted(el: HTMLElement) {
    nextTick(() => {
      enhanceCodeBlocks(el)
      enhanceAssistantLinks(el)
    })
  },
  updated(el: HTMLElement) {
    nextTick(() => {
      enhanceCodeBlocks(el)
      enhanceAssistantLinks(el)
    })
  }
}

// 路由
const route = useRoute()
const router = useRouter()
const messageTotol = ref(0)

// 是否有会话 id：无 id 时显示首页（欢迎+建议），有 id 时显示对话
const hasChatId = computed(() => !!(route.query.id as string))

// 首页建议话题与会话数
const sessionCount = computed(() => getSessions().length)
const suggestions = computed(() => [
  { id: 1, icon: '🤔', text: t('用Python实现快速排序并解释代码', 'Implement quick sort in Python and explain the code') },
  {
    id: 2,
    icon: '💡',
    text: t('推理功能：写一个文件上传接口代码', 'Reasoning: write a file upload API'),
    description: t('用Spring Boot写一个文件上传接口', 'Write a file upload API with Spring Boot')
  },
  {
    id: 3,
    icon: '📚',
    text: t('生成一个带柱状图ECharts', 'Generate an ECharts bar chart'),
    description: t(
      '我有以下销售数据：Q1: 120万, Q2: 150万, Q3: 170万, Q4: 210万请生成一个带数据标签的柱状图ECharts代码，标题为‘2024 季度销售额’，',
      'Given sales data Q1:1.2M, Q2:1.5M, Q3:1.7M, Q4:2.1M, generate ECharts bar chart code with data labels, title: 2024 Quarterly Sales.'
    )
  },
  { id: 4, icon: '🔧', text: t('帮我搜索最新的发布的大模型有哪些', 'Search for the latest released large models') },
  { id: 5, icon: '✍️', text: t('生成一个Excel表格文件', ''),description:"请生成一个Excel表格文件，包含以下内容： - 列名：员工ID、姓名、部门、职位、入职日期、薪资 - 生成3行示例数据 - 格式要求：日期格式为YYYY-MM-DD，薪资保留两位小数" },
  { id: 6, icon: '🎨', text: t('画一只 宇航员猫在月球上钓鱼', 'Draw an astronaut cat fishing on the moon') },
  {
    id: 7,
    icon: '🧩',
    text: t('MCP: 帮我查询天气', 'MCP: Check weather'),
    description: t(
      '明天杭州市的天气怎么样？需要：最高/最低气温降水概率风力大小建议携带的物品或注意事项',
      'How is Hangzhou weather tomorrow? Include high/low temp, precipitation probability, wind, and what to carry.'
    )
  },
  {
    id: 8,
    icon: '🧩',
    text: t('MCP: 查询地理位置', 'MCP: Query location'),
    description: t(
      '请告诉我上海东方明珠的详细地址、经纬度坐标，以及周边 500 米内的主要地标',
      "Tell me Oriental Pearl Tower's full address, coordinates, and key landmarks within 500m."
    )
  },
  {
    id: 9,
    icon: '🧩',
    text: t('MCP: 查询路线规划', 'MCP: Route planning'),
    description: t(
      '“请规划从北京南站到颐和园的最佳公交/地铁路线，要求：时间最短换乘次数最少列出每个换乘点和预计时间',
      'Plan the best bus/subway route from Beijing South Railway Station to Summer Palace with shortest time and fewest transfers.'
    )
  },
  {
    id: 12,
    icon: '⚡',
    text: t('什么是麦克斯韦方程组？', 'What are Maxwell equations?')
  },
  {
    id: 13,
    icon: '🖼️',
    text: t('这张图片是什么内容？', 'What is in this image?'),
    description: t('这张图片是什么内容？', 'What is in this image?')
  },
  {
    id: 14,
    icon: '🌐',
    text: t('https://jiekou.ai抓取这个网页，告诉我有哪些可用模型？', 'Scrape https://jiekou.ai and tell me available models.')
  }
])

const homeDetailsExpanded = ref(false)
const HOME_SUGGESTIONS_PAGE_SIZE = 6
const homeSuggestionPage = ref(1)
const totalSuggestionPages = computed(() =>
  Math.max(1, Math.ceil(suggestions.value.length / HOME_SUGGESTIONS_PAGE_SIZE))
)
const pagedSuggestions = computed(() => {
  const start = (homeSuggestionPage.value - 1) * HOME_SUGGESTIONS_PAGE_SIZE
  return suggestions.value.slice(start, start + HOME_SUGGESTIONS_PAGE_SIZE)
})

function prevSuggestionPage() {
  homeSuggestionPage.value = Math.max(1, homeSuggestionPage.value - 1)
}

function nextSuggestionPage() {
  homeSuggestionPage.value = Math.min(totalSuggestionPages.value, homeSuggestionPage.value + 1)
}

async function uploadSuggestionImageFromPublic(imagePath: string): Promise<void> {
  try {
    const res = await fetch(imagePath)
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status}`)
    }
    const blob = await res.blob()
    const fileName = imagePath.split('/').pop() || 'fig1.png'
    const fileType = blob.type || 'image/png'
    const imageFile = new File([blob], fileName, { type: fileType })
    await addFile(imageFile)
  } catch (e) {
    console.error('自动上传建议图片失败:', e)
    ElMessage.warning(t('自动上传示例图片失败，请稍后重试', 'Failed to auto-upload sample image, please try again'))
  }
}

async function useSuggestion(text: string,id:number) {
  isEchartsMode.value=false,isSearchMode.value=false,isGenerateFileMode.value=false,isImageGenMode.value=false;
  isThinkingMode.value=false;
  if(id){
    if(id==2)isThinkingMode.value=true
    if(id==3)isEchartsMode.value=true
    if(id==4)isSearchMode.value=true
    if(id==5)isGenerateFileMode.value=true
    if(id==6)isImageGenMode.value=true
    if(id==7)isSearchMode.value=false
    if(id==8)isSearchMode.value=false
    if(id==9)isSearchMode.value=false
  }
  if (id === 13) {
    await uploadSuggestionImageFromPublic('/fig1.png')
  }
  currentMessage.value = text
  nextTick(() => {
    messageInput.value?.focus()
    adjustInputHeight()
  })
}

// 生成会话 ID（首页发起新对话用）
function genId(prefix: string): string {
  const s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
  return `${prefix}-${s}`
}

// 首页发送：创建会话并跳转到带 id、q 的同一页，由 ensureFirstMessageStream 发起流式对话
async function startNewConversation() {
  const text = currentMessage.value.trim()
  if (!text || isStreaming.value || hasUnconfirmedAttachments.value) return
  const loggedIn = isLoggedIn()
  const chatId = loggedIn ? genId('chat') : genId('tourist')
  // 登录/游客都先在侧边栏预插入会话项，保证发送后有即时反馈
  window.dispatchEvent(new CustomEvent('chat:new-conversation', { detail: { id: chatId, title: '新对话' } }))
  // 未登录不在此处 appendMessage，由 ensureFirstMessageStream 根据 query.q 统一创建会话并发送首条消息，避免只建会话不发消息
  currentMessage.value = ''
  attachments.value = []
  adjustInputHeight()
  const query: Record<string, string> = { id: chatId, q: text }
  await new Promise((r) => setTimeout(r, 100))
  router.push({ path: '/', query })
  void requestConversationTitle(chatId, text)
}

const requestedTitleChatIds = new Set<string>()

function applyConversationTitle(chatId: string, rawTitle: unknown) {
  const title = String(rawTitle ?? '').trim()
  if (!chatId || !title) return
  updateSessionTitle(chatId, title)
  window.dispatchEvent(new CustomEvent('chat:update-conversation-title', { detail: { id: chatId, title } }))
}

async function requestConversationTitle(chatId: string, message: string) {
  const normalizedChatId = String(chatId || '').trim()
  const normalizedMessage = String(message || '').trim()
  if (!normalizedChatId || !normalizedMessage) return
  if (requestedTitleChatIds.has(normalizedChatId)) return
  requestedTitleChatIds.add(normalizedChatId)
  const url =
    '/api/ai/chat/title?message=' +
    encodeURIComponent(normalizedMessage) +
    '&ChatId=' +
    encodeURIComponent(normalizedChatId)
  try {
    const res = await apiFetch<{ title?: string }>(url)
    if (!res.ok) return
    applyConversationTitle(normalizedChatId, res.json?.data?.title)
  } catch {
    // 忽略标题生成错误
  }
}

// 消息附件（与后端 AttachmentVO 一致，用于绑定到用户消息；id 可为 string 以保留 Long 精度）
interface AttachmentVO {
  id: number | string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
}

// 响应式数据
type Role = 'user' | 'assistant'
interface BaseMessage {
  role: Role
  /** 统一的消息内容字段（用户/助手共用） */
  text: string
  timestamp?: Date
  aiAttachments?: AttachmentVO[]
  /** 后端消息主键 ID（来自 /list/message），用于导出等操作 */
  messageId?: string
}
interface UserMessage extends BaseMessage {
  role: 'user'
}
interface GeneratedFile {
  url: string
  fileName: string
  fileType: string
}

interface AssistantMessage extends BaseMessage {
  role: 'assistant'
  isStreaming: boolean
  isFinished: boolean
  isFavor?: boolean
  favorLoading?: boolean
  /** 本条由 markdown-it 流式/历史渲染（含尾部光标） */
  renderedByStream?: boolean
  /** 推理内容（<think> 块解析后合并） */
  reasoningText?: string
  thinkBlocks?: SymbolBlock[]
  /** 图片生成模式下：是否显示图片骨架，占位在文字下方，收到 markdown 图后关闭 */
  isImageLoading?: boolean
  /** 该消息是否由图片生成模式产生，用于控制流式光标等效果 */
  isImageGen?: boolean
  /** 生成文件模式下：从AI回复中提取的文件列表 */
  generatedFiles?: GeneratedFile[]
  /** 流式中收到 <<<ATTACHMENT_LOADING>>> 时显示「正在读取附件...」骨架，收到真实内容后关闭 */
  attachmentLoading?: boolean
  /** 本条对话耗时（毫秒），仅从 /list/message 读取，0 或缺失时不展示 */
  cost?: number
  /** 推理耗时（毫秒），仅在存在推理内容时展示，优先使用后端字段 */
  thinkingTime?: number
  /** 内部状态：推理阶段开始时间（毫秒，performance.now 优先） */
  thinkingStartedAt?: number
  /** 内部状态：当前是否处于“仅推理未出正文”的阶段 */
  isThinkingPhase?: boolean
  /** 本条对话 token 数（仅从 /list/message 读取），缺失时不展示 */
  token?: number
}
type ChatMessage = UserMessage | AssistantMessage

type EchartsParseState = {
  hasBlock: boolean
  loading: boolean
  option: Record<string, any> | null
  cleanedText: string
}

/** 协议：流式内容中出现此字符串时显示附件读取骨架，不参与正文渲染 */
const ATTACHMENT_LOADING_TOKEN = '<<<ATTACHMENT_LOADING>>>'

function stripAttachmentLoadingToken(str: string): { cleaned: string; hadToken: boolean } {
  const s = String(str ?? '')
  if (!s.includes(ATTACHMENT_LOADING_TOKEN)) return { cleaned: s, hadToken: false }
  const cleaned = s.replaceAll(ATTACHMENT_LOADING_TOKEN, '').trim()
  return { cleaned, hadToken: true }
}

// 对象数组用 reactive，可直接更新对象属性（如 message.text += chunk）
const messages = reactive<ChatMessage[]>([])

// 可见消息列表（用于分页显示）
const visibleMessages = computed(() => messages)

function isAssistantMessage(m: ChatMessage): m is AssistantMessage {
  return m.role === 'assistant'
}

function getMessageCopyText(m: ChatMessage): string {
  return (m.text || '').toString()
}

const currentMessage = ref('')
const messageInput = ref<HTMLTextAreaElement>()
const messagesContainer = ref<HTMLElement>()
const isStreaming = ref(false)
const messagesLoading = ref(false) // 点击会话项后拉取 /api/list/message 时的加载状态
// 是否自动滚动到底部：用户手动上滚后会被关闭，下一次交互再打开
const shouldAutoScroll = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

// 附件数组，最多 2 个
interface Attachment {
  id: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  fileUrl?: string;
  /** 来自 /confirm 接口的附件 id（字符串保留 Long 精度），发送消息时与消息一起传给后端 */
  attachmentId?: string | number;
  error?: string;
}
const attachments = ref<Attachment[]>([])
const imagePreview = reactive({
  visible: false,
  src: '',
  name: ''
})
// 附件处于上传/压缩处理中（status=uploading）时禁用发送；已完成(done)或失败(error)后可发送
const hasUnconfirmedAttachments = computed(() =>
  attachments.value.some((a) => a.status === 'uploading')
)

function isImageAttachment(fileType: string) {
  return String(fileType || '').startsWith('image/')
}

function openImagePreview(src: string, name = '') {
  if (!src) return
  imagePreview.visible = true
  imagePreview.src = src
  imagePreview.name = name
}

function closeImagePreview() {
  imagePreview.visible = false
  imagePreview.src = ''
  imagePreview.name = ''
}

// 助手消息更多操作菜单（导出）
const messageMoreMenuIndex = ref<number | null>(null)

// 点击页面空白处关闭「更多操作」菜单
function handleGlobalClickForMessageMoreMenu(e: MouseEvent) {
  if (messageMoreMenuIndex.value === null) return
  const target = e.target as HTMLElement | null
  if (!target) return
  const wraps = document.querySelectorAll('.message-more-wrap')
  for (const wrap of Array.from(wraps)) {
    if ((wrap as HTMLElement).contains(target)) {
      return
    }
  }
  closeMessageMoreMenu()
}

// 当前消息的 messageId，在用户开始输入或上传附件时生成，发送后清空
const currentMessageId = ref<string>('')

// 推理模式：由输入框左侧 + 号菜单控制
const isThinkingMode = ref(false)
// 图片生成模式：由输入框左侧 + 号菜单控制（对应后端 ChatSendReq.isImageGen）
const isImageGenMode = ref(false)
// 深度搜索模式：由输入框左侧 + 号菜单控制（对应后端 ChatSendReq.isSearch）
const isSearchMode = ref(false)
// 生成文件模式：由输入框左侧 + 号菜单控制（对应后端 ChatSendReq.isGenerateFile）
const isGenerateFileMode = ref(false)
// 图表模式：由更多菜单（画布）控制（对应后端 ChatSendReq.isEcharts）
const isEchartsMode = ref(false)
const showInputMenu = ref(false)
const inputMenuTriggerRef = ref<HTMLButtonElement | null>(null)
let inputMenuCloseCleanup: (() => void) | null = null

// OCR 对话框
const ocrDialogVisible = ref(false)
const ocrImageFile = ref<File | null>(null)
const ocrImagePreview = ref('')
const ocrResult = ref<string | null>(null)
const ocrLoading = ref(false)
const ocrFileInput = ref<HTMLInputElement | null>(null)
const ocrDragOver = ref(false)
const ocrCopyDone = ref(false)
let ocrCopyDoneTimer = 0

function openOcrDialog() {
  // 未登录禁止使用 OCR 图片上传
  if (!isLoggedIn()) {
    window.alert('请先登录后再使用图片识别')
    return
  }
  showInputMenu.value = false
  ocrDialogVisible.value = true
}

function onOcrDialogClosed() {
  ocrImageFile.value = null
  if (ocrImagePreview.value) {
    URL.revokeObjectURL(ocrImagePreview.value)
  }
  ocrImagePreview.value = ''
  ocrResult.value = null
  ocrLoading.value = false
  ocrDragOver.value = false
  ocrCopyDone.value = false
  if (ocrCopyDoneTimer) {
    window.clearTimeout(ocrCopyDoneTimer)
    ocrCopyDoneTimer = 0
  }
  if (ocrFileInput.value) ocrFileInput.value.value = ''
}

function onOcrFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  setOcrFile(file)
}

function onOcrDrop(e: DragEvent) {
  ocrDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  setOcrFile(file)
  ocrFileInput.value && (ocrFileInput.value.value = '')
}

function setOcrFile(file: File) {
  if (ocrImagePreview.value) URL.revokeObjectURL(ocrImagePreview.value)
  ocrImageFile.value = file
  ocrImagePreview.value = URL.createObjectURL(file)
  ocrResult.value = null
}

async function submitOcr() {
  if (!ocrImageFile.value || ocrLoading.value) return
  ocrLoading.value = true
  ocrResult.value = null
  try {
    
    ocrResult.value = await getOcr(ocrImageFile.value)
  } catch (err: any) {
    ocrResult.value = ''
  } finally {
    ocrLoading.value = false
  }
}

function copyOcrResult() {
  if (ocrResult.value == null) return
  navigator.clipboard.writeText(ocrResult.value).then(() => {
    if (ocrCopyDoneTimer) window.clearTimeout(ocrCopyDoneTimer)
    ocrCopyDone.value = true
    ocrCopyDoneTimer = window.setTimeout(() => {
      ocrCopyDone.value = false
      ocrCopyDoneTimer = 0
    }, 1500)
  }).catch(() => {
    window.alert('复制失败')
  })
}

function toggleInputMenu() {
  showInputMenu.value = !showInputMenu.value
}

/** 弹层打开后：下一帧再监听“点击外部”，避免本次点击被当成外部点击 */
function scheduleInputMenuCloseOnClickOutside() {
  const cleanup = () => {
    if (inputMenuCloseCleanup) {
      document.removeEventListener('mousedown', onDocMousedown)
      inputMenuCloseCleanup = null
    }
  }
  const onDocMousedown = (e: MouseEvent) => {
    const target = e.target as Node
    const triggerEl = inputMenuTriggerRef.value
    const popperEl = document.querySelector('.input-menu-popover')
    if (triggerEl?.contains(target) || popperEl?.contains(target)) return
    showInputMenu.value = false
    cleanup()
  }
  inputMenuCloseCleanup = () => {
    document.removeEventListener('mousedown', onDocMousedown)
    inputMenuCloseCleanup = null
  }
  requestAnimationFrame(() => {
    document.addEventListener('mousedown', onDocMousedown)
  })
}

watch(showInputMenu, (open) => {
  if (inputMenuCloseCleanup) {
    inputMenuCloseCleanup()
    inputMenuCloseCleanup = null
  }
  if (open) scheduleInputMenuCloseOnClickOutside()
})

// 听写（ASR）状态与逻辑
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
        const prev = dictationTranscript.value
        if (msg.final) {
          dictationTranscript.value += (dictationTranscript.value.endsWith(' ') ? '' : ' ') + text + ' '
        } else {
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
  // 如果还在录音中，先停止录音（保留当前识别结果）
  if (isDictating.value) {
    stopDictation()
  }
  const text = dictationTranscript.value.trim()
  if (text) {
    const cur = currentMessage.value
    currentMessage.value = cur ? cur + (cur.endsWith(' ') ? '' : ' ') + text : text
    adjustInputHeight()
  }
  dictationTranscript.value = ''
  dictationError.value = ''
}

function cancelDictation() {
  // 中途或结束后取消：先停止录音，再清空当前识别结果
  if (isDictating.value) {
    stopDictation()
  }
  dictationTranscript.value = ''
  dictationError.value = ''
}

/** 一键切换录音：开始 / 停止（ChatGPT 风格） */
function toggleDictation() {
  if (isDictating.value) {
    stopDictation()
  } else {
    startDictation()
  }
}

// 实时识别结果更新时，气泡自动滚动到底部显示最新内容
watch(dictationTranscript, () => {
  nextTick(() => {
    const el = dictationBubbleRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
})

function toggleThinkingMode() {
  const next = !isThinkingMode.value
  isThinkingMode.value = next
  if (next) {
    isImageGenMode.value = false
    isSearchMode.value = false
    isGenerateFileMode.value = false
    isEchartsMode.value = false
  }
  showInputMenu.value = false
}

function toggleImageGenMode() {
  const next = !isImageGenMode.value
  isImageGenMode.value = next
  if (next) {
    isThinkingMode.value = false
    isSearchMode.value = false
    isGenerateFileMode.value = false
    isEchartsMode.value = false
  }
  showInputMenu.value = false
}

function toggleSearchMode() {
  const next = !isSearchMode.value
  isSearchMode.value = next
  // 深度搜索模式与思考/图片生成/生成文件/图表模式互斥
  if (next) {
    isThinkingMode.value = false
    isImageGenMode.value = false
    isGenerateFileMode.value = false
    isEchartsMode.value = false
  }
  showInputMenu.value = false
}

function toggleGenerateFileMode() {
  const next = !isGenerateFileMode.value
  isGenerateFileMode.value = next
  // 生成文件模式与思考/图片生成/深度搜索/图表模式互斥
  if (next) {
    isThinkingMode.value = false
    isImageGenMode.value = false
    isSearchMode.value = false
    isEchartsMode.value = false
  }
  showInputMenu.value = false
}

function toggleEchartsMode() {
  const next = !isEchartsMode.value
  isEchartsMode.value = next
  // 图表模式与思考/图片生成/深度搜索/生成文件模式互斥
  if (next) {
    isThinkingMode.value = false
    isImageGenMode.value = false
    isSearchMode.value = false
    isGenerateFileMode.value = false
  }
  showInputMenu.value = false
}

// 生成消息 ID 的辅助函数
function generate(length: number = 10): number {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 确保当前消息有 messageId
function ensureMessageId(): string {
  if (!currentMessageId.value) {
    currentMessageId.value = generate().toString()
  }
  return currentMessageId.value
}

function normalizeMessageText(text: unknown): string {
  const s = text == null ? '' : String(text)
  const trimmed = s.trim()
  if (!trimmed) return ''
  return s
}

// 助手消息展示前的统一清洗：
// - 去掉包裹在最外层的一对引号（图片生成接口常返回 `"![](...)"`）
function normalizeAssistantDisplayText(text: unknown): string {
  let s = text == null ? '' : String(text)
  let trimmed = s.trim()

  // 连续去掉最外层成对引号，兼容 `"\"markdown\""` 这类情况
  while (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
      trimmed = trimmed.slice(1, -1).trim()
    } else {
      break
    }
  }

  // 还原转义引号
  trimmed = trimmed.replace(/\\"/g, '"').replace(/\\'/g, '\'')

  // 针对单独一行被引号包裹的图片 markdown：
  // "![图片](...)" -> ![图片](...)
  const lines = trimmed.split(/\r?\n/)
  const fixedLines = lines
    .map((line) => {
      const lt = line.trim()
      // 单独一行只有引号（可能是图片 markdown 外层引号残留），直接丢弃
      if (lt === '"' || lt === '\'' || lt === '\"\"' || lt === '\'\'') {
        return ''
      }
      if (lt.length >= 2) {
        const first = lt[0]
        const last = lt[lt.length - 1]
        if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
          const inner = lt.slice(1, -1).trim()
          if (inner.startsWith('![')) {
            return inner
          }
        }
      }
      return line
    })
    .filter((line) => line.trim() !== '')

  trimmed = fixedLines.join('\n')
  return trimmed
}

/** cos 文件链接 URL 的正则（与 extractFileUrls 一致）。
 * 排除 Markdown/标点边界字符，避免把 `](https://...)` 等后续文本吃进 URL。 */
const COS_FILE_URL_REGEX = /https?:\/\/[^/\s]+\.cos\.[^/\s]+\.myqcloud\.com\/[^\s<>"')\]\[（），。]+/gi

/** 从展示文本中移除 cos 文件链接，用户只通过文件卡片下载，不看到原始链接。
 * 支持两种返回格式：1) Markdown 图片 ![](url)（含末尾括号）  2) 纯下载地址 url */
function stripFileUrlsFromDisplay(text: string): string {
  // 先移除 Markdown 格式的整段 ![](cos url)（含末尾的 )），避免残留 ![]() 或孤立的 )
  const markdownImageWithCos = /!\[[^\]]*\]\s*\((https?:\/\/[^/]+\.cos\.[^/]+\.myqcloud\.com\/[^\s<>"')]+)\)/gi
  let out = text.replace(markdownImageWithCos, '')
  // 再移除单纯的 cos 下载地址
  out = out.replace(COS_FILE_URL_REGEX, '')
  return out.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/gm, '').trim()
}

function getAssistantDisplayRaw(msg: AssistantMessage): string {
  let raw = normalizeAssistantDisplayText(msg.text || '')
  // 有生成文件或可能存在 cos 链接时，从正文中移除所有文件链接，避免用户看到原始下载地址
  if (msg.generatedFiles?.length || /\.cos\.[^/]+\.myqcloud\.com/i.test(raw)) {
    raw = stripFileUrlsFromDisplay(raw)
  }
  return raw
}

function stripJsonCommentsAndTrailingCommas(s: string): string {
  // 移除 // 与 /* */ 注释
  const noBlockComments = s.replace(/\/\*[\s\S]*?\*\//g, '')
  const noLineComments = noBlockComments.replace(/(^|\s)\/\/.*$/gm, '$1')
  // 移除结尾逗号：{ "a": 1, } / [1,2,]
  return noLineComments.replace(/,\s*([}\]])/g, '$1')
}

function tryParseJsonLike(input: string): Record<string, any> | null {
  const raw = String(input ?? '').trim()
  if (!raw) return null
  // 优先取第一段 {...}，避免模型在 JSON 后面夹杂解释文字
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  const candidate = start >= 0 && end > start ? raw.slice(start, end + 1) : raw
  const cleaned = stripJsonCommentsAndTrailingCommas(candidate).trim()
  try {
    return JSON.parse(cleaned)
  } catch (_) {
    return null
  }
}

function parseEchartsBlock(text: string): EchartsParseState {
  const s = String(text ?? '')
  const start = s.search(/```echarts\b/i)
  if (start === -1) {
    return { hasBlock: false, loading: false, option: null, cleanedText: s }
  }
  const afterStart = s.slice(start)
  const openMatch = afterStart.match(/```echarts\b[^\n]*\n?/i)
  const openLen = openMatch?.[0]?.length ?? 0
  const contentStart = start + openLen
  const closeIndex = s.indexOf('```', contentStart)
  if (closeIndex === -1) {
    // 流式未闭合：先占位，正文暂时移除起始 fence 后的所有内容，避免 markdown 抖动
    const cleanedText = s.slice(0, start).trim()
    return { hasBlock: true, loading: true, option: null, cleanedText }
  }
  const blockContent = s.slice(contentStart, closeIndex).trim()
  const option = tryParseJsonLike(blockContent)
  const cleanedText = (s.slice(0, start) + '\n' + s.slice(closeIndex + 3)).replace(/\n{3,}/g, '\n\n').trim()
  return { hasBlock: true, loading: false, option, cleanedText }
}

const echartsStateCache = new WeakMap<
  AssistantMessage,
  { raw: string; streaming: boolean; state: EchartsParseState }
>()

function getEchartsState(msg: AssistantMessage): EchartsParseState {
  const raw = getAssistantDisplayRaw(msg)
  const cached = echartsStateCache.get(msg)
  if (cached && cached.raw === raw && cached.streaming === !!msg.isStreaming) return cached.state
  const state = parseEchartsBlock(raw)
  echartsStateCache.set(msg, { raw, streaming: !!msg.isStreaming, state })
  return state
}

/** 基于 markdown-it 的流式渲染，带尾部光标（参考 markdown-it-sse-template） */
function getAssistantMessageHtml(msg: AssistantMessage): string {
  const raw = getAssistantDisplayRaw(msg)
  const echarts = getEchartsState(msg)
  return transformMarkdownForStream(echarts.cleanedText, {
    // 图片生成模式下不显示流式光标
    appendCursor: msg.isStreaming && !msg.isImageGen,
    allowEmpty: true
  })
}

// 为每条助手消息维护一个 PreParse 实例，用于解析 <think> 块
const thinkParsers = new WeakMap<AssistantMessage, PreParse>()

function getThinkContent(msg: AssistantMessage): string {
  return msg.reasoningText || ''
}

function shouldShowAssistantLoading(msg: AssistantMessage): boolean {
  if (!msg.isStreaming) return false
  if (msg.attachmentLoading || msg.isImageLoading) return false
  if ((msg.text || '').trim()) return false
  if (getThinkContent(msg).trim()) return false
  if (msg.generatedFiles?.length) return false
  const echartsState = getEchartsState(msg)
  return !echartsState.loading && !echartsState.option
}

/** 从文本中提取文件URL（匹配 https://*.cos.*.myqcloud.com/...）。
 * 支持两种返回格式：1) Markdown 图片 ![](url)  2) 纯下载地址 url */
function extractFileUrls(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const matches = text.match(COS_FILE_URL_REGEX)
  
  if (!matches) return files
  
  const seenUrls = new Set<string>()
  
  for (const url of matches) {
    const normalizedUrl = url.replace(/[)\],，。]+$/g, '')
    if (!normalizedUrl) continue

    // 去重
    if (seenUrls.has(normalizedUrl)) continue
    seenUrls.add(normalizedUrl)
    
    // 提取文件名：从最后一个 / 开始，到 ? 或结尾
    const urlObj = new URL(normalizedUrl)
    const pathname = urlObj.pathname
    const lastSlashIndex = pathname.lastIndexOf('/')
    let fileName = pathname.slice(lastSlashIndex + 1)
    try {
      fileName = decodeURIComponent(fileName)
    } catch {
      // 保底：若文件名包含非法转义，保持原始值，避免抛错中断渲染
    }
    
    // 如果没有文件名，跳过
    if (!fileName) continue
    
    // 提取文件类型：根据文件扩展名
    const dotIndex = fileName.lastIndexOf('.')
    const fileType = dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
    
    files.push({
      url: normalizedUrl,
      fileName,
      fileType
    })
  }
  
  return files
}

/** 图片生成失败文案识别：命中时应立即关闭图片占位骨架 */
function containsImageGenFailure(text: string): boolean {
  const normalized = String(text || '').toLowerCase()
  return normalized.includes('生成图片工具调用失败') ||
    normalized.includes('image generation tool call failed')
}

/** 根据文件类型获取图标 */
function getFileIcon(fileType: string): string {
  const typeMap: Record<string, string> = {
    // 文档
    'txt': '📄',
    'doc': '📝',
    'docx': '📝',
    'pdf': '📕',
    'xls': '📊',
    'xlsx': '📊',
    'ppt': '📽️',
    'pptx': '📽️',
    // 代码
    'java': '☕',
    'js': '📜',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',
    'py': '🐍',
    'cpp': '⚙️',
    'c': '⚙️',
    'cs': '🔷',
    'go': '🐹',
    'rs': '🦀',
    'php': '🐘',
    'rb': '💎',
    'swift': '🦉',
    'kt': '🔷',
    'html': '🌐',
    'css': '🎨',
    'json': '📋',
    'xml': '📄',
    'yaml': '📄',
    'yml': '📄',
    // 图片
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'svg': '🖼️',
    'webp': '🖼️',
    // 压缩
    'zip': '📦',
    'rar': '📦',
    '7z': '📦',
    'tar': '📦',
    'gz': '📦',
  }
  
  return typeMap[fileType] || '📎'
}

/** 根据文件类型返回图标颜色类名（Excel 绿、PDF 红、Word 蓝、图片 紫） */
function getFileIconColor(fileType: string): string {
  const t = (fileType || '').toLowerCase()
  if (['xls', 'xlsx', 'csv'].includes(t)) return 'excel'
  if (['pdf'].includes(t)) return 'pdf'
  if (['doc', 'docx', 'txt'].includes(t)) return 'word'
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(t)) return 'image'
  return 'default'
}

/** 生成时间展示：刚刚 / x 分钟前 / 具体时间 */
function formatGeneratedTime(timestamp?: number | Date): string {
  if (!timestamp) return t('刚刚生成', 'Just now')
  const timestampMs = typeof timestamp === 'number' ? timestamp : timestamp.getTime()
  const now = Date.now()
  const diff = now - timestampMs
  if (diff < 60 * 1000) return t('刚刚生成', 'Just now')
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / 60000)
    return uiLocale.value === 'en' ? `${mins} min ago` : `${mins} 分钟前`
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / 3600000)
    return uiLocale.value === 'en' ? `${hours} hr ago` : `${hours} 小时前`
  }
  return formatTime(new Date(timestamp))
}

/** 生成文件卡片「更多」菜单：在新窗口打开 / 复制链接 */
function handleGeneratedFileMore(command: string, file: GeneratedFile) {
  if (command === 'open') {
    window.open(file.url, '_blank')
  } else if (command === 'copy') {
    navigator.clipboard?.writeText(file.url).then(() => {
      ElMessage.success(t('链接已复制', 'Link copied'))
    })
  }
}

/** 下载文件 */
function downloadFile(url: string, fileName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** 从 /list/message 的 payload 中解析出推理块和对话文本，供 Think 组件展示 */
function parsePayloadWithThink(payload: string): { reasoningText: string; text: string } {
  const s = String(payload ?? '').trim()
  if (!s) return { reasoningText: '', text: '' }
  const thinkParts: string[] = []
  const thinkRe = /<Think>([\s\S]*?)<\/Think>|<think>([\s\S]*?)<\/think>/gi
  let m: RegExpExecArray | null
  while ((m = thinkRe.exec(s)) !== null) {
    thinkParts.push((m[1] ?? m[2] ?? '').trim())
  }
  const reasoningText = thinkParts.filter(Boolean).join('\n\n')
  const textRaw = s
    .replace(/<Think>[\s\S]*?<\/Think>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
  const text = normalizeAssistantDisplayText(textRaw)
  return { reasoningText, text }
}

/** 将 SSE 返回的 JSON 统一为 { textChunk, reasoningChunk }，兼容两种格式：
 * - 旧格式：{ text?, reasoning? }
 * - 新格式：{ type: "text" | "reasoning", content: string } */
function normalizeStreamChunk(parsed: any): { textChunk: string; reasoningChunk: string } {
  if (!parsed || typeof parsed !== 'object') return { textChunk: '', reasoningChunk: '' }
  if ('type' in parsed && 'content' in parsed) {
    const content = String(parsed.content ?? '')
    if (parsed.type === 'reasoning') return { textChunk: '', reasoningChunk: content }
    if (parsed.type === 'text') return { textChunk: content, reasoningChunk: '' }
    return { textChunk: '', reasoningChunk: '' }
  }
  return {
    textChunk: String(parsed.text ?? ''),
    reasoningChunk: String(parsed.reasoning ?? '')
  }
}

// 分页相关状态（仅登录用户，从后端加载）
const currentPage = ref(1)          // 当前已加载的最大页码
const hasMore = ref(true)           // 是否还有更早的消息
const isLoadingMore = ref(false)    // 是否正在加载上一页（更旧消息）

// 当前流式请求的 AbortController，用于取消
let streamAbortController: AbortController | null = null
type ActiveStreamState = {
  assistantIndex: number
  destroyed: boolean
  /** 本次助手回复计时起点（毫秒，performance.now 优先） */
  startedAt: number
}
let activeStreamState: ActiveStreamState | null = null

// 从后端按页加载会话消息（page 从 1 开始；page=1 为最新一页，向上滚动加载 page=2、3... 更旧消息）
function fetchMessages(page: number, appendToTop = false): Promise<void> {
  const id = (route.query.id as string) || ''
  if (!id) {
    return Promise.resolve()
  }

  // 初次加载使用 messagesLoading，其余分页使用 isLoadingMore
  if (page === 1 && !appendToTop) {
    messagesLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  // 记录滚动位置，用于向列表顶部追加旧消息后保持视觉位置
  const el = messagesContainer.value
  const prevScrollHeight = el?.scrollHeight ?? 0
  const prevScrollTop = el?.scrollTop ?? 0

  return apiFetch<any>('/api/list/message/' + page + '?ChatId=' + encodeURIComponent(id), {
    method: 'GET'
  })
    .then(({ ok, json }) => {
      if (!ok) {
        if (!appendToTop) {
          messages.splice(0, messages.length, {
            role: 'assistant',
            text: '❌ 加载对话失败（服务器错误）',
            isStreaming: false,
            isFinished: true,
            timestamp: new Date()
          } as AssistantMessage)
        }
        return
      }

      // 后端返回 Result<Page<ChatMessageVO>>，data 为分页对象
      const pageData = json?.data || {}
      const list: any[] = pageData.records ?? pageData.content ?? []
      messageTotol.value=pageData.total
      const rawAttachments = (a: any): AttachmentVO[] => {
        if (!Array.isArray(a)) return []
        return a.map((x: any) => ({
          id: x.id != null && x.id !== '' ? String(x.id) : 0,
          file_name: String(x.file_name ?? x.fileName ?? ''),
          file_url: String(x.file_url ?? x.fileUrl ?? ''),
          file_size: Number(x.file_size ?? x.fileSize ?? 0),
          file_type: String(x.file_type ?? x.fileType ?? '')
        }))
      }

      const toFiniteNumber = (v: any): number | undefined => {
        if (v == null) return undefined
        if (typeof v === 'string' && v.trim() === '') return undefined
        const n = Number(v)
        return Number.isFinite(n) ? n : undefined
      }

      const parseTokenFromListMessage = (m: any): number | undefined => {
        // 兼容不同后端字段命名
        const direct =
          toFiniteNumber(m?.token)
        if (direct != null) return direct
        // 兼容 usage 拆分字段（prompt + completion）
        const prompt = toFiniteNumber(m?.usage?.promptTokens ?? m?.usage?.prompt_tokens)
        const completion = toFiniteNumber(m?.usage?.completionTokens ?? m?.usage?.completion_tokens)
        if (prompt == null && completion == null) return undefined
        return (prompt ?? 0) + (completion ?? 0)
      }

      const mapped = list.map((m) => {
        let textValue: any = m.payload ?? m.content ?? ''
        // 如果是对象，优先取常见字段，再兜底为 JSON 字符串
        if (textValue && typeof textValue === 'object') {
          const candidate =
            (textValue.content as unknown) ??
            (textValue.text as unknown) ??
            (textValue.message as unknown) ??
            ''

          if (typeof candidate === 'string' && candidate.trim()) {
            textValue = candidate
          } else {
            try {
              textValue = JSON.stringify(textValue)
            } catch {
              textValue = ''
            }
          }
        }

        let textStr = String(textValue ?? '')

        const role: Role =
          String(m.messageType || '').toLowerCase() === 'user' ? 'user' : 'assistant'

        if (role === 'user') {
          const msg: UserMessage = {
            role: 'user',
            text: textStr,
            timestamp: new Date(m.createdAt ?? m.createTime ?? Date.now()),
            aiAttachments: rawAttachments(m.aiAttachments ?? m.ai_attachments),
            messageId: m.id != null && m.id !== '' ? String(m.id) : undefined
          }
          return msg
        }

        const { reasoningText, text } = parsePayloadWithThink(textStr)
        // 从历史消息中提取文件URL（如果存在）
        const extractedFiles = extractFileUrls(text)
        const msg: AssistantMessage = {
          role: 'assistant',
          text,
          reasoningText: reasoningText || undefined,
          isStreaming: false,
          isFinished: true,
          isFavor: Boolean(m.isFavor ?? m.is_favor),
          timestamp: new Date(m.createdAt ?? m.createTime ?? Date.now()),
          aiAttachments: rawAttachments(m.aiAttachments ?? m.ai_attachments),
          isImageLoading: false,
          isImageGen: false,
          generatedFiles: extractedFiles.length > 0 ? extractedFiles : undefined,
          messageId: m.id != null && m.id !== '' ? String(m.id) : undefined,
          token: parseTokenFromListMessage(m),
          cost: typeof m.cost === 'number' ? m.cost : Number(m.cost ?? 0) || undefined,
          thinkingTime:
            typeof (m as any).thinkingTime === 'number'
              ? (m as any).thinkingTime
              : Number((m as any).thinkingTime ?? 0) || undefined
        }
        return msg
      })

      if (appendToTop) {
        // 向上翻页：在顶部追加更旧消息
        const prev = [...messages]
        messages.splice(0, messages.length, ...mapped, ...prev)
        nextTick(() => {
          if (!el) return
          const newScrollHeight = el.scrollHeight
          // 维持用户当前看到的内容不跳动
          el.scrollTop = newScrollHeight - (prevScrollHeight - prevScrollTop)
        })
      } else {
        // 首次加载：只用当前页数据，然后滚动到底部
        messages.splice(0, messages.length, ...mapped)
        currentPage.value = pageData.current ?? page
        hasMore.value = pageData.current*6<messageTotol.value
        nextTick(() => scrollToBottom())
      }

      // 更新分页信息
      currentPage.value = pageData.current ?? page
      hasMore.value = pageData.current*6<messageTotol.value
    })
    .catch(() => {
      if (!appendToTop) {
        messages.splice(0, messages.length, {
          role: 'assistant',
          text: '🔗 加载对话时网络异常',
          isStreaming: false,
          isFinished: true,
          timestamp: new Date()
        } as AssistantMessage)
      }
    })
    .finally(() => {
      messagesLoading.value = false
      isLoadingMore.value = false
    })
}

// 首次进入会话时加载第一页
function loadSession() {
  const id = (route.query.id as string) || ''
  if (!id) return
  currentPage.value = 1
  hasMore.value = true
  fetchMessages(1, false)
}





// 发送消息
function handleSend() {
  const text = currentMessage.value.trim()
  if (!text || isStreaming.value || hasUnconfirmedAttachments.value) return

  const id = (route.query.id as string) || ''
  if (!id) return

  const messageId = ensureMessageId()

  // 收集已完成的附件
  const doneAttachments = attachments.value.filter((a) => a.status === 'done' && a.attachmentId != null && a.fileUrl)
  const attachmentIds = doneAttachments.map((a) => String(a.attachmentId))

  // 创建用户消息
  const userMessage: UserMessage = {
    role: 'user',
    text: normalizeMessageText(text),
    timestamp: new Date(), 
    aiAttachments: doneAttachments.map((a) => ({
      id: a.attachmentId!, 
      file_name: a.file.name,
      file_url: a.fileUrl!,
      file_size: a.file.size,
      file_type: a.file.type
    }))
  }
  if (userMessage.aiAttachments?.length === 0) delete userMessage.aiAttachments

    // 创建助手消息
    const assistantMessage: AssistantMessage = {
      role: 'assistant', 
      text: '',
      isStreaming: true,
      isFinished: false,
      timestamp: new Date(),
      isImageLoading: isImageGenMode.value || undefined,
      isImageGen: isImageGenMode.value || undefined,
      generatedFiles: isGenerateFileMode.value ? [] : undefined
    }

  messages.push(userMessage, assistantMessage)
  const shouldGenerateTitle = messages.filter((m) => m.role === 'user').length === 1
  shouldAutoScroll.value = true

  // 清空输入
  currentMessage.value = ''
  attachments.value = []
  adjustInputHeight()

  nextTick(() => scrollToBottom())

  // 发起流式请求
  if (shouldGenerateTitle) {
    void requestConversationTitle(id, text)
  }
  connectAndStream(id, text, messageId, attachmentIds, messages.length - 1)
  currentMessageId.value = ''
}

// 输入框处理
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    if (event.shiftKey) return
    event.preventDefault()

    // 流式生成中：先停止，不发送
    if (isStreaming.value) {
      stopStreaming()
      return
    }

    // 非流式时按回车才发送 / 开始新会话
    if (hasChatId.value) handleSend()
    else startNewConversation()
  }
}

async function toggleMessageFavor(message: AssistantMessage) {
  if (!message.messageId || message.favorLoading) return

  const nextFavor = !message.isFavor
  const prevFavor = Boolean(message.isFavor)
  message.isFavor = nextFavor
  message.favorLoading = true

  try {
    await favorChatMessage(message.messageId, nextFavor)
    ElMessage.success(nextFavor ? t('已点赞', 'Liked') : t('已取消点赞', 'Like removed'))
  } catch (err: any) {
    message.isFavor = prevFavor
    ElMessage.error(err?.message || t('点赞操作失败', 'Failed to update like'))
  } finally {
    message.favorLoading = false
  }
}

function adjustInputHeight() {
  nextTick(() => {
    const textarea = messageInput.value
    if (!textarea) return

    textarea.style.height = 'auto'
    const maxHeight = 200
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = newHeight + 'px'
  })
}

// 触发选择文件
function triggerFileSelect() {
  if (isStreaming.value || isUploading.value) return
  fileInput.value?.click()
}

// 确保有会话 id（无会话时创建并跳转），返回 sessionId
async function ensureSessionForAttachment(): Promise<string> {
  let sessionId = (route.query.id as string) || ''
  if (!sessionId) {
    const loggedIn = isLoggedIn()
    sessionId = loggedIn ? genId('chat') : genId('tourist')
    if (!loggedIn) {
      createSession(undefined)
    } else {
      window.dispatchEvent(new CustomEvent('chat:new-conversation', { detail: { id: sessionId, title: '新对话' } }))
    }
    await router.push({ path: '/', query: { id: sessionId } })
  }
  return sessionId
}

const maxAttachmentSize = 10 * 1024 * 1024 // 10MB

// 添加并上传单个文件（供点击选择、拖拽、粘贴共用）
async function addFile(file: File): Promise<void> {
  // 未登录禁止上传附件
  if (!isLoggedIn()) {
    ElMessage.warning(t('请先登录后再上传附件', 'Please sign in before uploading attachments'))
    return
  }
  if (isStreaming.value || isUploading.value) return
  if (attachments.value.length >= 2) {
    ElMessage.warning(t('最多只能上传 2 个附件', 'You can upload up to 2 attachments'))
    return
  }
  if (!isAllowedVideoFormat(file)) {
    ElMessage.warning(t('视频仅支持 mp4 / mkv / mov 格式', 'Only mp4 / mkv / mov video formats are supported'))
    return
  }
  const attachId = 'att-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
  const item: Attachment = {
    id: attachId,
    file,
    status: 'uploading',
    progress: 0
  }
  attachments.value.push(item)
  try {
    const compressed = await compressMediaAttachment(file)
    // 压缩期间用户可能删除了该附件，删除后不再继续上传
    const stillExists = attachments.value.some((a) => a.id === attachId)
    if (!stillExists) return

    const fileToUpload = compressed.file
    const uploadSize = fileToUpload.size
    const fileName = compressed.fileName || file.name
    const uploadType = compressed.fileType || file.type
    if (uploadSize > maxAttachmentSize) {
      attachments.value = attachments.value.filter((a) => a.id !== attachId)
      ElMessage.warning(t('文件大小不能超过 10MB', 'File size cannot exceed 10MB'))
      return
    }

    const sessionId = await ensureSessionForAttachment()
    const messageId = ensureMessageId()
    const { fileUrl, attachmentId } = await uploadFile(fileToUpload, {
      conservation_id: sessionId,
      chat_id: messageId,
      fileSize: uploadSize,
      fileName,
      fileType: uploadType
    })
    const idx = attachments.value.findIndex((a) => a.id === attachId)
    if (idx !== -1) {
      attachments.value[idx] = {
        ...attachments.value[idx],
        status: 'done',
        progress: 100,
        fileUrl,
        attachmentId: attachmentId ?? attachments.value[idx].attachmentId
      }
    }
  } catch (e: any) {
    const errIdx = attachments.value.findIndex((a) => a.id === attachId)
    if (errIdx !== -1) {
      attachments.value[errIdx] = {
        ...attachments.value[errIdx],
        status: 'error',
        error: String(e?.message || '上传失败'),
        progress: 0
      }
    }
  }
}

// 处理文件选择（点击附件按钮）
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target?.files?.length) return
  for (let i = 0; i < target.files.length && attachments.value.length < 2; i++) {
    await addFile(target.files[i])
  }
  target.value = ''
}

// 拖拽/粘贴上传：拖拽悬停状态
const isDragOverInput = ref(false)
let dragLeaveTimer = 0

function onInputDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer?.types?.includes('Files')) {
    clearTimeout(dragLeaveTimer)
    isDragOverInput.value = true
  }
}

function onInputDragLeave(e: DragEvent) {
  e.preventDefault()
  dragLeaveTimer = window.setTimeout(() => {
    isDragOverInput.value = false
  }, 50)
}

async function onInputDrop(e: DragEvent) {
  e.preventDefault()
  clearTimeout(dragLeaveTimer)
  isDragOverInput.value = false
  const files = e.dataTransfer?.files
  if (!files?.length) return
  for (let i = 0; i < files.length && attachments.value.length < 2; i++) {
    await addFile(files[i])
  }
}

async function onInputPaste(e: ClipboardEvent) {
  const files = e.clipboardData?.files
  if (!files?.length) return
  e.preventDefault()
  for (let i = 0; i < files.length && attachments.value.length < 2; i++) {
    await addFile(files[i])
  }
}

// 删除附件
function removeAttachment(id: string) {
  attachments.value = attachments.value.filter(att => att.id !== id)
}


// 滚动到底部
function scrollToBottom() {
  if (!shouldAutoScroll.value) return

  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

let pendingScrollRaf = 0
function scheduleAutoScroll() {
  if (!shouldAutoScroll.value) return
  if (pendingScrollRaf) return
  pendingScrollRaf = window.requestAnimationFrame(() => {
    pendingScrollRaf = 0
    nextTick(() => {
      const el = messagesContainer.value
      if (!el) return
      el.scrollTop = el.scrollHeight
    })
  })
}

// 监听消息区域滚动，当用户手动上滚时，关闭自动置底
function handleMessagesScroll() {
  const el = messagesContainer.value
  if (!el) return

  const thresholdBottom = 40 // 距底部 40px 以内视为“在底部”
  const thresholdTop = 40    // 距顶部 40px 以内视为“接近顶部”，触发加载上一页
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight

  // 接近底部：恢复自动滚动
  if (distanceToBottom <= thresholdBottom) {
    // 回到底部时恢复自动滚动
    shouldAutoScroll.value = true
  } else {
    // 用户上滚查看历史，关闭自动滚动
    shouldAutoScroll.value = false
  }

  // 接近顶部：如果还有更多历史消息且当前没有在加载，则请求下一页
  if (el.scrollTop <= thresholdTop && hasMore.value && !isLoadingMore.value && !messagesLoading.value) {
    fetchMessages(currentPage.value + 1, true)
  }
}

// 时间格式化
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function formatMessageMenuTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const locale = uiLocale.value === 'en' ? 'en-US' : 'zh-CN'
  const label = sameDay ? t('今天', 'Today') : d.toLocaleDateString(locale)
  const time = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${label}, ${time}`
}

// 附件展示：文件大小、类型
function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
function formatFileType(fileType: string): string {
  if (!fileType) return t('文件', 'File')
  if (fileType.startsWith('image/')) return t('图片', 'Image')
  if (fileType.startsWith('video/')) return t('视频', 'Video')
  if (fileType.startsWith('audio/')) return t('音频', 'Audio')
  return t('文件', 'File')
}

function getFileExt(fileName: string): string {
  const name = String(fileName || '')
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot >= name.length - 1) return 'FILE'
  return name.slice(dot + 1).toUpperCase().slice(0, 4)
}

function isTextLikeFile(fileName: string, fileType: string): boolean {
  const type = String(fileType || '').toLowerCase()
  if (type.startsWith('text/')) return true
  const ext = getFileExt(fileName).toLowerCase()
  return ['csv', 'txt', 'md', 'json', 'xml', 'yml', 'yaml', 'log'].includes(ext)
}

// 工具函数
function copyMessage(message: ChatMessage) {
  const text = getMessageCopyText(message)
  navigator.clipboard?.writeText(text)
    .then(() => console.log('已复制到剪贴板'))
    .catch(() => console.log('复制失败'))
}

function toggleMessageMoreMenu(index: number) {
  messageMoreMenuIndex.value = messageMoreMenuIndex.value === index ? null : index
}

function closeMessageMoreMenu() {
  messageMoreMenuIndex.value = null
}

async function exportSingleMessage(message: ChatMessage, format: 'txt' | 'md' | 'pdf') {
  let id = (message as BaseMessage).messageId ?? (message as any).messageId
  if (id == null || id === '') {
    id = await resolveBackendMessageId(message)
  }
  if (id == null || id === '') {
    window.alert('当前消息暂未支持导出，请稍后重试或刷新对话。')
    return
  }

  const fmt = format || 'txt'
  try {
    const res = await fetch(
      `/api/export/${encodeURIComponent(String(id))}?format=${encodeURIComponent(fmt)}`,
      { method: 'GET' }
    )
    if (!res.ok) {
      window.alert(t('导出失败，请稍后重试。', 'Export failed, please try again later.'))
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `message_${id}.${fmt}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出消息失败:', e)
    window.alert(t('导出失败，请检查网络后重试。', 'Export failed, please check network and try again.'))
  }
}

function normalizeTextForMatch(text: unknown): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractListMessageText(rawMessage: any, role: Role): string {
  let textValue: any = rawMessage?.payload ?? rawMessage?.content ?? ''
  if (textValue && typeof textValue === 'object') {
    const candidate =
      (textValue.content as unknown) ??
      (textValue.text as unknown) ??
      (textValue.message as unknown) ??
      ''
    if (typeof candidate === 'string' && candidate.trim()) {
      textValue = candidate
    } else {
      try {
        textValue = JSON.stringify(textValue)
      } catch {
        textValue = ''
      }
    }
  }
  const raw = String(textValue ?? '')
  if (role === 'assistant') {
    const parsed = parsePayloadWithThink(raw)
    return parsed.text
  }
  return raw
}

async function resolveBackendMessageId(message: ChatMessage): Promise<string | undefined> {
  const chatId = (route.query.id as string) || ''
  if (!chatId) return undefined

  try {
    const { ok, json } = await apiFetch<any>(
      '/api/list/message/1?ChatId=' + encodeURIComponent(chatId),
      { method: 'GET' }
    )
    if (!ok) return undefined

    const list: any[] = json?.data?.records ?? json?.data?.content ?? []
    if (!Array.isArray(list) || list.length === 0) return undefined

    const targetRole: Role = message.role
    const targetText = normalizeTextForMatch((message as BaseMessage).text)
    const targetTime = new Date((message as BaseMessage).timestamp ?? Date.now()).getTime()

    let bestId: string | undefined
    let bestScore = Number.NEGATIVE_INFINITY

    for (const item of list) {
      const role: Role = String(item?.messageType || '').toLowerCase() === 'user' ? 'user' : 'assistant'
      if (role !== targetRole) continue
      if (item?.id == null || item.id === '') continue

      const candidateText = normalizeTextForMatch(extractListMessageText(item, role))
      const candidateTime = new Date(item?.createdAt ?? item?.createTime ?? Date.now()).getTime()
      const timeDiffSeconds = Math.abs(candidateTime - targetTime) / 1000

      let score = -Math.min(timeDiffSeconds, 3600)
      if (targetText && candidateText) {
        if (candidateText === targetText) score += 5000
        else if (candidateText.includes(targetText) || targetText.includes(candidateText)) score += 2000
      }

      if (score > bestScore) {
        bestScore = score
        bestId = String(item.id)
      }
    }

    if (bestId) {
      const target = message as BaseMessage
      target.messageId = bestId
    }
    return bestId
  } catch {
    return undefined
  }
}

// TTS 朗读：WebSocket 收音频 + 播放
const ttsSessionId = ref('')
let ttsWs: WebSocket | null = null
let ttsAudioCtx: AudioContext | null = null
const ttsPlaying = ref(false)
let ttsConnectionPromise: Promise<void> | null = null
/** 下一段音频在 AudioContext 时间轴上的开始时间，用于连续播放、避免断音 */
let ttsNextStartTime = 0

function ensureTtsSessionId() {
  if (!ttsSessionId.value) {
    ttsSessionId.value = 'tts-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
  }
}

function ensureTtsConnection(): Promise<void> {
  ensureTtsSessionId()
  if (ttsWs?.readyState === WebSocket.OPEN) {
    return Promise.resolve()
  }
  if (ttsConnectionPromise) {
    return ttsConnectionPromise
  }
  const wsUrl = getTtsWsUrl(ttsSessionId.value)
  ttsConnectionPromise = new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => {
      ttsWs = ws
      ttsConnectionPromise = null
      resolve()
    }
    ws.onerror = (err) => {
      ttsConnectionPromise = null
      reject(new Error('TTS 连接失败'))
    }
    ws.onclose = (event) => {
      ttsWs = null
      ttsPlaying.value = false
      ttsConnectionPromise = null
    }
    // 与后端协议一致：onEvent 时 BinaryMessage(result.getAudioFrame())，onComplete 时 TextMessage("TTS_END")
    ws.onmessage = async (event: MessageEvent) => {
      if (event.data === 'TTS_END') {
        ttsNextStartTime = 0
        ttsPlaying.value = false
        return
      }
      if (!ttsPlaying.value) return
      try {
        const audioData = event.data instanceof ArrayBuffer
          ? event.data
          : await (event.data as Blob).arrayBuffer()
        if (!ttsAudioCtx) {
          ttsAudioCtx = new AudioContext()
        }
        const audioBuffer = await ttsAudioCtx.decodeAudioData(audioData)
        const ctx = ttsAudioCtx
        const now = ctx.currentTime
        // 首帧或间隔过久：从当前时刻开始，避免断音
        if (ttsNextStartTime < now) {
          ttsNextStartTime = now
        }
        const src = ctx.createBufferSource()
        src.buffer = audioBuffer
        src.connect(ctx.destination)
        src.start(ttsNextStartTime)
        ttsNextStartTime += audioBuffer.duration
      } catch (e) {
      }
    }
  })
  return ttsConnectionPromise
}

async function readMessageAloud(message: ChatMessage) {
  if (!isAssistantMessage(message)) {
    return
  }
  const text = (message.text || '').toString().trim()
  if (!text) {
    return
  }
  if (ttsPlaying.value) {
    await stopTts(ttsSessionId.value)
    ttsPlaying.value = false
    return
  }
  try {
    await ensureTtsConnection()
    ttsNextStartTime = 0
    ttsPlaying.value = true
    await ttsReadText(text, ttsSessionId.value)
  } catch (e) {
    ttsPlaying.value = false
    window.alert(`${t('朗读失败', 'Read aloud failed')}: ${e instanceof Error ? e.message : t('未知错误', 'Unknown error')}`)
  }
}

async function stopReadAloud() {
  if (!ttsSessionId.value) return
  ttsPlaying.value = false
  try {
    await stopTts(ttsSessionId.value)
  } finally {
    if (ttsWs) {
      ttsWs.close()
      ttsWs = null
    }
    if (ttsAudioCtx) {
      ttsAudioCtx.close().catch(() => {})
      ttsAudioCtx = null
    }
    ttsNextStartTime = 0
  }
}

function regenerateMessage(index: number) {
  if (index > 0 && messages[index - 1]?.role === 'user') {
    const userMsg = messages[index - 1] as UserMessage
    const assistantMsg = messages[index] as AssistantMessage
    const id = (route.query.id as string) || ''

    // 检查是否有必要的消息ID
    // userMessageId: 助手消息上面那条用户消息的id
    // assistantMessageId: 用户点击重新生成的助手消息id
    const userMessageId = userMsg.messageId
    const assistantMessageId = assistantMsg.messageId

    // 更严格的检查：确保ID存在且不为空字符串
    if (!userMessageId || String(userMessageId).trim() === '' || !assistantMessageId || String(assistantMessageId).trim() === '') {
      console.error('重新生成失败：缺少消息ID', {
        chatId: id,
        userMessageId,
        assistantMessageId,
        userMsg: { ...userMsg, text: userMsg.text?.substring(0, 50) },
        assistantMsg: { ...assistantMsg, text: assistantMsg.text?.substring(0, 50) }
      })
      ElMessage.warning('无法重新生成：缺少消息ID，请刷新页面后重试')
      ElMessage.warning(t('无法重新生成：缺少消息ID，请刷新页面后重试', 'Cannot regenerate: missing message ID, refresh and try again'))
      return
    }

    if (!id || String(id).trim() === '') {
      console.error('重新生成失败：缺少chatId')
      ElMessage.warning(t('无法重新生成：缺少会话ID', 'Cannot regenerate: missing session ID'))
      return
    }

    console.log('准备重新生成:', {
      chatId: id,
      userMessageId: String(userMessageId),
      assistantMessageId: String(assistantMessageId),
      hasToken: !!getToken()
    })

    // 清空助手消息
    if (assistantMsg && assistantMsg.role === 'assistant') {
      assistantMsg.text = ''
      assistantMsg.isStreaming = true
      assistantMsg.isFinished = false
      assistantMsg.reasoningText = ''
      assistantMsg.thinkBlocks = []
      assistantMsg.attachmentLoading = false
      assistantMsg.generatedFiles = undefined
      assistantMsg.isImageLoading = false
      // 清理推理解析器
      thinkParsers.delete(assistantMsg)
    }
    // 重新生成视为新的交互，恢复自动滚动
    shouldAutoScroll.value = true

    // 使用重新生成接口
    connectAndRegenerate(id, userMessageId, assistantMessageId, index)
  }
}



function exportChat() {
  const chatText = messages
    .map(m => {
      const raw = getMessageCopyText(m)
      const safe = m.role === 'assistant' ? raw.toString() : normalizeMessageText(raw)
      return `${m.role === 'user' ? t('用户', 'User') : 'AI'}: ${safe}`
    })
    .join('\n\n')
  
  const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${t('对话记录', 'chat_record')}_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function goHome() {
  if (streamAbortController) {
    streamAbortController.abort()
    streamAbortController = null
    isStreaming.value = false
  }
  // 清理输入区与附件状态，避免从对话页返回首页后仍沿用上一会话的附件/消息
  currentMessage.value = ''
  attachments.value = []
  currentMessageId.value = ''
  adjustInputHeight()
  router.push({ path: '/' })
}

// 停止流式输出
async function stopStreaming() {
  if (streamAbortController) {
    streamAbortController.abort()
    streamAbortController = null
  }
  
  // 向后端发送取消请求
  const chatId = route.query.id as string
  if (chatId) {
    try {
      await cancelChat(chatId)
    } catch (error) {
      console.warn('取消对话请求失败:', error)
      // 即使后端取消失败，也继续执行前端的停止逻辑
    }
  }

  if (activeStreamState && !activeStreamState.destroyed) {
    const currentMsg = messages[activeStreamState.assistantIndex]
    
    if (currentMsg && isAssistantMessage(currentMsg)) {

      currentMsg.isStreaming = false
      currentMsg.isFinished = true
      currentMsg.renderedByStream = true
      currentMsg.isImageLoading = false
      if (currentMsg.isThinkingPhase && currentMsg.thinkingStartedAt && 
      (!currentMsg.thinkingTime || currentMsg.thinkingTime <= 0)) {
          const end = (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now()
          const ms = Math.max(0, Math.round(end - currentMsg.thinkingStartedAt))
          if (ms > 0) {
            currentMsg.thinkingTime = ms
          }
        }
      currentMsg.isThinkingPhase = false
    }
    activeStreamState.destroyed = true
    activeStreamState = null
  }
  isStreaming.value = false
}

// 连接并开始流式对话
async function connectAndStream(
  chatId: string,
  message: string,
  messageId: string,
  attachmentIds: string[],
  assistantIndex: number
) {
  // 游客：先确保已调用 /api/anon/identify，拿到 anonId（本地缓存 + Header 传递）
  if (!isLoggedIn()) {
    try {
      await ensureAnonIdentified()
    } catch (e) {
      console.warn('匿名识别失败，继续发送请求:', e)
    }
  }

  // 如果已有活跃流，先停止
  if (streamAbortController) {
    streamAbortController.abort()
  }

  // 设置流式状态
  isStreaming.value = true

  activeStreamState = {
    assistantIndex,
    destroyed: false,
    startedAt: (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now()
  }
  const token = getToken()

  nextTick(() => {
    if (!activeStreamState || activeStreamState.destroyed) return
    streamAbortController = streamChat(
      {
        chatId,
        message,
        messageId,
        attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
        mode: 'chat',
        token,
        isThinking: isThinkingMode.value,
        isImageGen: isImageGenMode.value,
        isSearch: isSearchMode.value,
        isGenerateFile: isGenerateFileMode.value,
        isEcharts: isEchartsMode.value
      },
      {
        onChunk: (content: string) => {
          if (!activeStreamState || activeStreamState.destroyed) return
          const currentMsg = messages[activeStreamState.assistantIndex]
          if (!currentMsg || !isAssistantMessage(currentMsg)) return

          // 新后端：SSE data 为 JSON，支持 { text?, reasoning? } 或 { type: "text"|"reasoning", content }（reasoning 复用 Think；text 流式解析为 markdown）
          let parsed: any = null
          try {
            parsed = JSON.parse(content)
          } catch {
            parsed = null
          }

          const hasStructuredChunk =
            parsed &&
            typeof parsed === 'object' &&
            (('text' in parsed || 'reasoning' in parsed) || ('type' in parsed && 'content' in parsed))

          if (hasStructuredChunk) {
            let { textChunk, reasoningChunk } = normalizeStreamChunk(parsed)

            const textStripped = stripAttachmentLoadingToken(String(textChunk))
            const reasoningStripped = stripAttachmentLoadingToken(String(reasoningChunk))
            if (textStripped.hadToken || reasoningStripped.hadToken) currentMsg.attachmentLoading = true
            textChunk = textStripped.cleaned
            reasoningChunk = reasoningStripped.cleaned

            if (reasoningChunk) {
              let parser = thinkParsers.get(currentMsg)
              if (!parser) {
                parser = new PreParse()
                thinkParsers.set(currentMsg, parser)
                currentMsg.reasoningText = ''
                currentMsg.thinkBlocks = []
                // 添加 <think> 开始标签
                const startTag = '<think>'
                parser.appendChunk(startTag)
              }
              const blocks = parser.appendChunk(String(reasoningChunk))
              currentMsg.reasoningText += String(reasoningChunk)
              currentMsg.thinkBlocks = blocks

              // 推理片段首次到达时开始计时
              if (!currentMsg.thinkingStartedAt) {
                const now = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                currentMsg.thinkingStartedAt = now
                currentMsg.isThinkingPhase = true
              }
            }

            if (textChunk) {
              currentMsg.attachmentLoading = false
              const textStr = String(textChunk)
              currentMsg.text += textStr
              if (textStr.includes('![')) {
                currentMsg.isImageLoading = false
              }
              if (containsImageGenFailure(textStr)) {
                currentMsg.isImageLoading = false
              }
              // 生成文件可能是 Markdown ![](url) 或纯下载地址，都提取并展示文件卡片
              const extractedFiles = extractFileUrls(currentMsg.text)
              if (extractedFiles.length > 0) {
                currentMsg.generatedFiles = extractedFiles
              }

              // 首次收到正文内容时结束推理计时（若后端未给 thinkingTime）
              if (currentMsg.isThinkingPhase && currentMsg.thinkingStartedAt && (!currentMsg.thinkingTime || currentMsg.thinkingTime <= 0)) {
                const end = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                const ms = Math.max(0, Math.round(end - currentMsg.thinkingStartedAt))
                if (ms > 0) {
                  currentMsg.thinkingTime = ms
                }
              }
              currentMsg.isThinkingPhase = false
            }
            if (reasoningChunk) {
              currentMsg.attachmentLoading = false
            }
          } else {
            // 兼容旧格式或纯文本：直接增量文本
            const rawStr = String(content)
            const { cleaned: rawCleaned, hadToken: rawHadToken } = stripAttachmentLoadingToken(rawStr)
            if (rawHadToken) currentMsg.attachmentLoading = true
            if (rawCleaned) {
              currentMsg.attachmentLoading = false
              if (rawCleaned.startsWith(currentMsg.text)) {
                const delta = rawCleaned.slice(currentMsg.text.length)
                currentMsg.text += delta
              } else {
                currentMsg.text += rawCleaned
              }
            }
            if (rawStr.includes('![')) {
              currentMsg.isImageLoading = false
            }
            if (containsImageGenFailure(rawStr)) {
              currentMsg.isImageLoading = false
            }
            const extractedFiles = extractFileUrls(currentMsg.text)
            if (extractedFiles.length > 0) {
              currentMsg.generatedFiles = extractedFiles
            }
          }

          scheduleAutoScroll()
        },
        onDone: () => {
          if (activeStreamState && !activeStreamState.destroyed) {
            const currentMsg = messages[activeStreamState.assistantIndex]
            if (currentMsg && isAssistantMessage(currentMsg)) {
              currentMsg.attachmentLoading = false
              currentMsg.isImageLoading = false
              // 最终再提取一次文件 URL（支持 Markdown ![](url) 或纯地址）
              if (currentMsg.text) {
                const extractedFiles = extractFileUrls(currentMsg.text)
                if (extractedFiles.length > 0) {
                  currentMsg.generatedFiles = extractedFiles
                }
              }
              // 如果推理模式且有推理内容，添加结束标签
              if (currentMsg.reasoningText && currentMsg.thinkBlocks) {
                const parser = thinkParsers.get(currentMsg)
                if (parser) {
                  // 检查是否有未完成的 think block
                  const hasUnfinishedBlock = currentMsg.thinkBlocks.some(
                    (b) => b.symbol.toLowerCase() === '<think>' && !b.finished
                  )
                  if (hasUnfinishedBlock) {
                    // 添加 </think> 结束标签
                    const endTag = '</think>'
                    const blocks = parser.appendChunk(endTag)
                    currentMsg.thinkBlocks = blocks
                  }
                }
              }
              // 若后端未提供 cost，则前端按流式时间估算一次（毫秒）
              if (!currentMsg.cost || currentMsg.cost <= 0) {
                const end = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                const ms = Math.max(0, Math.round(end - activeStreamState.startedAt))
                if (ms > 0) currentMsg.cost = ms
              }
              // 流式结束后重置推理阶段标记
              currentMsg.isThinkingPhase = false
              currentMsg.thinkingStartedAt = undefined
              
              currentMsg.isStreaming = false
              currentMsg.isFinished = true
              currentMsg.renderedByStream = true
              if (!isLoggedIn()) {
                const id = (route.query.id as string) || ''
                if (id) updateLastAssistantContent(id, currentMsg.text)
              }
            }
            activeStreamState.destroyed = true
            activeStreamState = null
          }
          isStreaming.value = false
          streamAbortController = null
          scheduleAutoScroll()
        },
        onError: (err: Error | StreamChatError) => {
          console.error('流式对话错误:', err)
          const isTokenLimitExceeded =
            err instanceof StreamChatError && err.code === StreamChatErrorCode.TOKEN_LIMIT_EXCEEDED
          if (isTokenLimitExceeded) {
            ElMessage.warning({
              message: '今日对话额度已用尽，请明日再试或登录账号获取更多额度',
              duration: 5000,
              showClose: true
            })
          }
          if (activeStreamState && !activeStreamState.destroyed) {
            const currentMsg = messages[activeStreamState.assistantIndex]
            if (currentMsg && isAssistantMessage(currentMsg)) {
              if (isTokenLimitExceeded) {
                currentMsg.text =
                  '今日对话额度已用尽。请明日再试，或登录账号获取更多额度。'
              } else {
                currentMsg.text = currentMsg.text || '❌ 对话过程中发生错误，请重试'
              }
              currentMsg.isImageLoading = false
              // 错误时也记录已用时（如果此前没有 cost）
              if (!currentMsg.cost || currentMsg.cost <= 0) {
                const end = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                const ms = Math.max(0, Math.round(end - activeStreamState.startedAt))
                if (ms > 0) currentMsg.cost = ms
              }
              currentMsg.isStreaming = false
              currentMsg.isFinished = true
            }
            activeStreamState.destroyed = true
            activeStreamState = null
          }
          isStreaming.value = false
          streamAbortController = null
        }
      }
    )
  })
}

// 连接并开始重新生成回复
async function connectAndRegenerate(
  chatId: string,
  userMessageId: string,
  assistantMessageId: string,
  assistantIndex: number
) {
  // 游客：先确保已调用 /api/anon/identify，拿到 anonId（本地缓存 + Header 传递）
  if (!isLoggedIn()) {
    try {
      await ensureAnonIdentified()
    } catch (e) {
      console.warn('匿名识别失败，继续发送请求:', e)
    }
  }

  // 如果已有活跃流，先停止
  if (streamAbortController) {
    streamAbortController.abort()
  }

  // 设置流式状态
  isStreaming.value = true

  activeStreamState = {
    assistantIndex,
    destroyed: false,
    startedAt: (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now()
  }
  const token = getToken()

  nextTick(() => {
    if (!activeStreamState || activeStreamState.destroyed) return
    streamAbortController = streamRegenerate(
      {
        chatId,
        userMessageId,
        assistantMessageId,
        token
      },
      {
        onChunk: (content: string) => {
          if (!activeStreamState || activeStreamState.destroyed) return
          const currentMsg = messages[activeStreamState.assistantIndex]
          if (!currentMsg || !isAssistantMessage(currentMsg)) return

          // 新后端：SSE data 为 JSON，支持 { text?, reasoning? } 或 { type: "text"|"reasoning", content }（reasoning 复用 Think；text 流式解析为 markdown）
          let parsed: any = null
          try {
            parsed = JSON.parse(content)
          } catch {
            parsed = null
          }

          const hasStructuredChunk =
            parsed &&
            typeof parsed === 'object' &&
            (('text' in parsed || 'reasoning' in parsed) || ('type' in parsed && 'content' in parsed))

          if (hasStructuredChunk) {
            let { textChunk, reasoningChunk } = normalizeStreamChunk(parsed)

            const textStripped = stripAttachmentLoadingToken(String(textChunk))
            const reasoningStripped = stripAttachmentLoadingToken(String(reasoningChunk))
            if (textStripped.hadToken || reasoningStripped.hadToken) currentMsg.attachmentLoading = true
            textChunk = textStripped.cleaned
            reasoningChunk = reasoningStripped.cleaned

            if (reasoningChunk) {
              let parser = thinkParsers.get(currentMsg)
              if (!parser) {
                parser = new PreParse()
                thinkParsers.set(currentMsg, parser)
                currentMsg.reasoningText = ''
                currentMsg.thinkBlocks = []
                // 添加 <think> 开始标签
                const startTag = '<think>'
                parser.appendChunk(startTag)
              }
              const blocks = parser.appendChunk(String(reasoningChunk))
              currentMsg.reasoningText += String(reasoningChunk)
              currentMsg.thinkBlocks = blocks

              // 推理片段首次到达时开始计时
              if (!currentMsg.thinkingStartedAt) {
                const now = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                currentMsg.thinkingStartedAt = now
                currentMsg.isThinkingPhase = true
              }
            }

            if (textChunk) {
              currentMsg.attachmentLoading = false
              const textStr = String(textChunk)
              currentMsg.text += textStr
              if (textStr.includes('![')) {
                currentMsg.isImageLoading = false
              }
              if (containsImageGenFailure(textStr)) {
                currentMsg.isImageLoading = false
              }
              // 生成文件可能是 Markdown ![](url) 或纯下载地址，都提取并展示文件卡片
              const extractedFiles = extractFileUrls(currentMsg.text)
              if (extractedFiles.length > 0) {
                currentMsg.generatedFiles = extractedFiles
              }

              // 首次收到正文内容时结束推理计时（若后端未给 thinkingTime）
              if (currentMsg.isThinkingPhase && currentMsg.thinkingStartedAt && (!currentMsg.thinkingTime || currentMsg.thinkingTime <= 0)) {
                const end = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                const ms = Math.max(0, Math.round(end - currentMsg.thinkingStartedAt))
                if (ms > 0) {
                  currentMsg.thinkingTime = ms
                }
              }
              currentMsg.isThinkingPhase = false
            }
            if (reasoningChunk) {
              currentMsg.attachmentLoading = false
            }
          } else {
            // 兼容旧格式或纯文本：直接增量文本
            const rawStr = String(content)
            const { cleaned: rawCleaned, hadToken: rawHadToken } = stripAttachmentLoadingToken(rawStr)
            if (rawHadToken) currentMsg.attachmentLoading = true
            if (rawCleaned) {
              currentMsg.attachmentLoading = false
              if (rawCleaned.startsWith(currentMsg.text)) {
                const delta = rawCleaned.slice(currentMsg.text.length)
                currentMsg.text += delta
              } else {
                currentMsg.text += rawCleaned
              }
            }
            if (rawStr.includes('![')) {
              currentMsg.isImageLoading = false
            }
            if (containsImageGenFailure(rawStr)) {
              currentMsg.isImageLoading = false
            }
            const extractedFiles = extractFileUrls(currentMsg.text)
            if (extractedFiles.length > 0) {
              currentMsg.generatedFiles = extractedFiles
            }
          }

          scheduleAutoScroll()
        },
        onDone: () => {
          if (activeStreamState && !activeStreamState.destroyed) {
            const currentMsg = messages[activeStreamState.assistantIndex]
            if (currentMsg && isAssistantMessage(currentMsg)) {
              currentMsg.attachmentLoading = false
              currentMsg.isImageLoading = false
              // 最终再提取一次文件 URL（支持 Markdown ![](url) 或纯地址）
              if (currentMsg.text) {
                const extractedFiles = extractFileUrls(currentMsg.text)
                if (extractedFiles.length > 0) {
                  currentMsg.generatedFiles = extractedFiles
                }
              }
              // 如果推理模式且有推理内容，添加结束标签
              if (currentMsg.reasoningText && currentMsg.thinkBlocks) {
                const parser = thinkParsers.get(currentMsg)
                if (parser) {
                  // 检查是否有未完成的 think block
                  const hasUnfinishedBlock = currentMsg.thinkBlocks.some(
                    (b) => b.symbol.toLowerCase() === '<think>' && !b.finished
                  )
                  if (hasUnfinishedBlock) {
                    // 添加 </think> 结束标签
                    const endTag = '</think>'
                    const blocks = parser.appendChunk(endTag)
                    currentMsg.thinkBlocks = blocks
                  }
                }
              }
              // 若后端未提供 cost，则前端按流式时间估算一次（毫秒）
              if (!currentMsg.cost || currentMsg.cost <= 0) {
                const end = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                const ms = Math.max(0, Math.round(end - activeStreamState.startedAt))
                if (ms > 0) currentMsg.cost = ms
              }
              // 流式结束后重置推理阶段标记
              currentMsg.isThinkingPhase = false
              currentMsg.thinkingStartedAt = undefined
              
              currentMsg.isStreaming = false
              currentMsg.isFinished = true
              currentMsg.renderedByStream = true
              if (!isLoggedIn()) {
                const id = (route.query.id as string) || ''
                if (id) updateLastAssistantContent(id, currentMsg.text)
              }
            }
            activeStreamState.destroyed = true
            activeStreamState = null
          }
          isStreaming.value = false
          streamAbortController = null
          scheduleAutoScroll()
        },
        onError: (err: Error | StreamChatError) => {
          console.error('重新生成回复错误:', err)
          const isTokenLimitExceeded =
            err instanceof StreamChatError && err.code === StreamChatErrorCode.TOKEN_LIMIT_EXCEEDED
          if (isTokenLimitExceeded) {
            ElMessage.warning({
              message: '今日对话额度已用尽，请明日再试或登录账号获取更多额度',
              duration: 5000,
              showClose: true
            })
          }
          if (activeStreamState && !activeStreamState.destroyed) {
            const currentMsg = messages[activeStreamState.assistantIndex]
            if (currentMsg && isAssistantMessage(currentMsg)) {
              if (isTokenLimitExceeded) {
                currentMsg.text =
                  '今日对话额度已用尽。请明日再试，或登录账号获取更多额度。'
              } else {
                currentMsg.text = currentMsg.text || '❌ 重新生成过程中发生错误，请重试'
              }
              currentMsg.isImageLoading = false
              // 错误时也记录已用时（如果此前没有 cost）
              if (!currentMsg.cost || currentMsg.cost <= 0) {
                const end = (typeof performance !== 'undefined' && performance.now)
                  ? performance.now()
                  : Date.now()
                const ms = Math.max(0, Math.round(end - activeStreamState.startedAt))
                if (ms > 0) currentMsg.cost = ms
              }
              currentMsg.isStreaming = false
              currentMsg.isFinished = true
            }
            activeStreamState.destroyed = true
            activeStreamState = null
          }
          isStreaming.value = false
          streamAbortController = null
        }
      }
    )
  })
}

// 防止重复调用 ensureFirstMessageStream 的标志（基于 chatId）
const ensuringFirstMessageChatId = ref<string | null>(null)

// 确保首条消息流式输出（从首页跳转时）
function ensureFirstMessageStream() {
  const id = (route.query.id as string) || ''
  if (!id) {
    // 没有会话 ID，加载本地会话
    loadSession()
    return
  }
  
  // 防止重复调用：如果当前 chatId 已经在处理中，直接返回
  if (ensuringFirstMessageChatId.value === id) {
    return
  }
  
  // 检查是否有从首页传递的首条消息（已登录用户通过 query.q 传递）
  const firstMessage = route.query.q as string | undefined
  if (firstMessage && firstMessage.trim()) {
    // 防止重复调用：标记当前 chatId 正在处理
    ensuringFirstMessageChatId.value = id
    
    // 有首条消息，需要自动发起流式对话
    const messageId = generate().toString()
    
    // 创建用户消息
    const userMessage: UserMessage = {
      role: 'user', 
      text: normalizeMessageText(firstMessage),
      timestamp: new Date()
    }
    
    // 创建助手消息
    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      text: '', 
      isStreaming: true,
      isFinished: false,
      timestamp: new Date(),
      isImageLoading: isImageGenMode.value || undefined,
      isImageGen: isImageGenMode.value || undefined
    }

    shouldAutoScroll.value = true

    // 加载会话历史（如果有），无论是否登录都统一走后端接口
    currentPage.value = 1
    hasMore.value = true
    // 先加载历史消息，然后追加首条消息并发起流式对话
    fetchMessages(1, false)
      .then(() => {
        // 历史消息加载完成后，追加首条消息和助手回复
        messages.push(userMessage, assistantMessage)
        nextTick(() => {
          scrollToBottom()
          // 发起流式请求
          connectAndStream(id, firstMessage, messageId, [], messages.length - 1)
          // 重置标志（延迟重置，确保请求已发起）
          setTimeout(() => {
            if (ensuringFirstMessageChatId.value === id) {
              ensuringFirstMessageChatId.value = null
            }
          }, 1000)
        })
      })
      .catch(() => {
        // 加载失败时仍然发起流式对话
        messages.splice(0, messages.length, userMessage, assistantMessage)
        nextTick(() => {
          scrollToBottom()
          connectAndStream(id, firstMessage, messageId, [], messages.length - 1)
          // 重置标志（延迟重置，确保请求已发起）
          setTimeout(() => {
            if (ensuringFirstMessageChatId.value === id) {
              ensuringFirstMessageChatId.value = null
            }
          }, 1000)
        })
      })
  } else {
    // 没有首条消息，正常加载会话
    loadSession()
  }
}

// 标记是否是首次加载
const isFirstMount = ref(true)

// 生命周期
onMounted(() => {
  ensureFirstMessageStream()
  // 标记首次加载完成
  nextTick(() => {
    isFirstMount.value = false
  })
  // 注册全局点击事件，用于点击空白处关闭「更多操作」菜单
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleGlobalClickForMessageMoreMenu)
  }
})

// 从首页进入会话（无 id → 有 id）：清空并触发首条消息流
watch(
  () => route.query.id,
  (newId, oldId) => {
    if (newId && !oldId && !isFirstMount.value) {
      messages.splice(0, messages.length)
      ensuringFirstMessageChatId.value = null
      ensureFirstMessageStream()
      return
    }
  }
)

// 监听路由变化（只在会话切换时触发，不在首次加载时触发）
watch(
  () => route.query.id,
  (newId, oldId) => {
    if (isFirstMount.value) return
    if (newId && newId !== oldId && oldId) {
      // 如果新 ID 已经在处理首条消息，说明是路由更新（如后端返回新 chatId），不需要重新加载
      const newIdStr = typeof newId === 'string' ? newId : (Array.isArray(newId) ? newId[0] : '')
      const oldIdStr = typeof oldId === 'string' ? oldId : (Array.isArray(oldId) ? oldId[0] : '')
      if (ensuringFirstMessageChatId.value === newIdStr || ensuringFirstMessageChatId.value === oldIdStr) {
        // 只更新标志，不重新加载
        ensuringFirstMessageChatId.value = newIdStr
        return
      }
      
      // 停止当前的流式输出
      if (streamAbortController) {
        streamAbortController.abort()
        streamAbortController = null
      }
      
      // 清理流状态
      activeStreamState = null
      
      // 重置状态
      isStreaming.value = false
      messages.splice(0, messages.length)
      currentMessage.value = ''
      attachments.value = []
      currentMessageId.value = ''
      shouldAutoScroll.value = true
      
      // 重置分页状态
      currentPage.value = 1
      hasMore.value = true
      isLoadingMore.value = false
      messagesLoading.value = false
      
      // 重置确保首条消息的标志
      ensuringFirstMessageChatId.value = null
      
      // 重新加载会话（这会触发 /api/list/message/{page} 请求）
      ensureFirstMessageStream()
    }
  }
)

onBeforeUnmount(() => {
  stopDictation()
  if (inputMenuCloseCleanup) {
    inputMenuCloseCleanup()
    inputMenuCloseCleanup = null
  }
  if (streamAbortController) {
    streamAbortController.abort()
    streamAbortController = null
  }

  // 清理流状态
  if (activeStreamState) {
    activeStreamState.destroyed = true
    activeStreamState = null
  }

  // 移除全局点击事件监听
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleGlobalClickForMessageMoreMenu)
  }
})
</script>

<style scoped>
/* 首页：无会话时的 Agent + Tools + Execution 布局 */
.home-container {
  display: flex;
  overflow-y:scroll;
  flex-direction: column;
  gap: 24px;
  padding: 24px 28px 12px;
  background: var(--bg-main, #f9fafb);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.home-layout {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.home-left,
.home-right {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.home-left {
  flex: 1.4;
}

.home-right {
  flex: 1.1;
}

.home-badge-row {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.home-badge-primary {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #f9fafb;
  letter-spacing: 0.04em;
}

.home-badge-sub {
  font-size: 11px;
  color: #475569;
  padding: 0 4px;
}

.home-title {
  margin: 12px 0 10px;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: #0f172a;
}

.home-subtitle {
  margin: 0 0 16px;
  font-size: 15px;
  line-height: 1.65;
  color: #475569;
}

.home-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.home-cta-primary,
.home-cta-secondary {
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.home-cta-primary {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #f9fafb;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
}

.home-cta-primary:hover:not(:disabled) {
  filter: brightness(1.03);
  transform: translateY(-0.5px);
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.3);
}

.home-cta-secondary {
  background: transparent;
  color: #475569;
  border-color: rgba(148, 163, 184, 0.4);
}

.home-cta-secondary:hover:not(:disabled) {
  background: rgba(248, 250, 252, 0.6);
  border-color: rgba(148, 163, 184, 0.6);
}

.home-cta-primary:disabled,
.home-cta-secondary:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.home-feature-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.home-feature-tags.is-collapsed {
  position: relative;
  max-height: 136px;
  overflow: hidden;
}

.home-feature-tags.is-collapsed::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 36px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(249, 250, 251, 0), rgba(249, 250, 251, 0.95));
}

.dark .home-feature-tags.is-collapsed::after {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.92));
}

.home-feature-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home-feature-group-title {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 2px;
  letter-spacing: 0.02em;
}

.home-tag {
  font-size: 11px;
  color: #475569;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.home-tag:hover {
  border-color: rgba(148, 163, 184, 0.9);
  background: rgba(255, 255, 255, 1);
  transform: translateX(2px);
}

.home-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.home-metric {
  min-width: 110px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.home-metric-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.home-metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.home-agent-card {
  border-radius: 18px;
  padding: 14px 16px;
  background: radial-gradient(circle at 0% 0%, #eef2ff 0%, #f9fafb 45%, #fef3c7 100%);
  border: 1px solid rgba(191, 219, 254, 0.9);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
}

.home-agent-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.home-agent-badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: rgba(219, 234, 254, 0.75);
}

.home-agent-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #0f172a;
}

.home-agent-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.2);
}

.home-agent-flow {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.home-agent-flow.is-collapsed {
  max-height: 155px;
  overflow: hidden;
}

/* 添加连接线 */
.home-agent-flow::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 28px;
  bottom: 28px;
  width: 2px;
  background: linear-gradient(180deg,
    rgba(59, 130, 246, 0.3) 0%,
    rgba(59, 130, 246, 0.5) 50%,
    rgba(59, 130, 246, 0.3) 100%);
  border-radius: 2px;
}

.home-flow-step {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  position: relative;
  animation: fadeInUp 0.5s ease-out backwards;
}

.home-flow-step:nth-child(1) { animation-delay: 0.1s; }
.home-flow-step:nth-child(2) { animation-delay: 0.2s; }
.home-flow-step:nth-child(3) { animation-delay: 0.3s; }
.home-flow-step:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.home-flow-index {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.home-flow-step:hover .home-flow-index {
  border-color: rgba(59, 130, 246, 0.9);
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.15);
  transform: scale(1.1);
}

.home-flow-body {
  flex: 1;
  min-width: 0;
}

.home-flow-title {
  font-size: 13px;
  font-weight: 550;
  color: #0f172a;
  margin-bottom: 2px;
}

.home-flow-desc {
  font-size: 12px;
  color: #4b5563;
}

.home-flow-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.home-flow-chip {
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(191, 219, 254, 0.9);
  color: #1e293b;
}

.home-collapse-toggle {
  align-self: flex-start;
  margin-top: 2px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  padding: 6px 2px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.75);
  transition: color 0.2s ease, border-color 0.2s ease;
}

.home-collapse-toggle:hover:not(:disabled) {
  color: #0f172a;
  border-color: rgba(100, 116, 139, 0.9);
}

.home-collapse-toggle:disabled {
  opacity: 0.5;
  cursor: default;
}

.home-collapse-toggle--flow {
  margin-top: 8px;
}

.dark .home-collapse-toggle {
  color: #cbd5e1;
  border-bottom-color: rgba(148, 163, 184, 0.4);
}

.dark .home-collapse-toggle:hover:not(:disabled) {
  color: #f8fafc;
  border-bottom-color: rgba(148, 163, 184, 0.65);
}

.home-tools-strip {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.9);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-tools-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.home-tools-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.home-tools-pill {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(203, 213, 225, 0.8);
  color: #475569;
  transition: all 0.2s ease;
}

.home-tools-pill:hover {
  border-color: rgba(148, 163, 184, 0.9);
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.home-suggestions {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-suggestions-header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
}

.home-suggestions-icon {
  font-size: 16px;
  filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
}

.home-suggestions-title {
  font-weight: 500;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.home-suggestions-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.home-pager-btn {
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: #fff;
  color: #475569;
  font-size: 12px;
  padding: 0 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.home-pager-btn:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.9);
  color: #1f2937;
}

.home-pager-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.home-pager-text {
  font-size: 12px;
  color: #64748b;
  min-width: 42px;
  text-align: center;
}

.dark .home-pager-btn {
  background: rgba(30, 41, 59, 0.9);
  color: #cbd5e1;
  border-color: rgba(100, 116, 139, 0.7);
}

.dark .home-pager-btn:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.85);
  color: #f8fafc;
}

.dark .home-pager-text {
  color: #94a3b8;
}

@media (max-width: 1024px) {
  .suggestions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
}

.suggestion-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.98);
  cursor: pointer;
  font-size: 12px;
  color: #1f2937;
  transition: all 0.2s ease;
  text-align: left;
}

.suggestion-chip:hover:not(:disabled) {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 1);
}

.suggestion-chip:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.suggestion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.home-status-bar {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px dashed rgba(203, 213, 225, 0.9);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: #6b7280;
}

.home-status-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.home-status-label {
  color: #9ca3af;
}

.home-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(220, 252, 231, 0.8);
  color: #15803d;
}

.home-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
}

.home-status-value {
  font-weight: 500;
  color: #0f172a;
}

@media (max-width: 900px) {
  .home-container {
    padding: 18px 16px 10px;
  }

  .home-layout {
    flex-direction: column;
  }

  .home-left,
  .home-right {
    width: 100%;
  }

  .home-agent-card {
    order: -1;
  }

  .home-suggestions-pager {
    justify-content: center;
  }
}

/* 用户消息上方的附件卡片：简约清爽 */
.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  max-width: 100%;
}

.message-attach-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--slate-100, #f1f5f9);
  color: var(--slate-700, #334155);
  text-decoration: none;
  font-size: 13px;
  max-width: 220px;
  transition: background 0.15s;
}

.message-attach-card.is-image {
  border: none;
  cursor: zoom-in;
}

.message-attach-card:hover {
  background: var(--slate-200, #e2e8f0);
}

.message-attach-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  overflow: hidden;
  background: var(--slate-200, #e2e8f0);
}

.message-attach-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attach-card-preview-btn {
  border: none;
  padding: 0;
  cursor: zoom-in;
}

.image-preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(4px);
}

.image-preview-dialog {
  position: relative;
  max-width: min(92vw, 1080px);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.image-preview-close {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  cursor: pointer;
}

.image-preview-img {
  display: block;
  max-width: 100%;
  max-height: calc(92vh - 48px);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
  object-fit: contain;
}

.image-preview-name {
  max-width: min(92vw, 1080px);
  color: #e2e8f0;
  font-size: 13px;
  text-align: center;
  word-break: break-word;
}

.message-attach-file-icon {
  font-size: 14px;
}

.message-attach-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-attach-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--slate-500, #64748b);
}

/* Assistant 消息容器 */
.message-wrapper.assistant-wrapper {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-content.assistant-content {
  width: 100%;
  box-sizing: border-box;
  font-size: 15px;
  line-height: 1.6;
  color: #1f2937;
}

/* 基础 Markdown 样式（仅作用于主消息 .vue-markdown-wrapper，不覆盖 Think 组件） */
.message-content.assistant-content > .vue-markdown-wrapper :deep(p) {
  margin: 0.75em 0;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(p:first-child) {
  margin-top: 0;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(ul),
.message-content.assistant-content > .vue-markdown-wrapper :deep(ol) {
  margin: 0.75em 0;
  padding-left: 1.5em;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(li) {
  margin: 0.25em 0;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(a:hover) {
  color: #1d4ed8;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(em) {
  font-style: italic;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(code:not(pre code)) {
  background: var(--bg-code, rgba(0, 0, 0, 0.06));
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--text-code, #334155);
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 3px solid #e5e7eb;
  color: #6b7280;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(th),
.message-content.assistant-content > .vue-markdown-wrapper :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5em 0.75em;
  text-align: left;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(th) {
  background: #f9fafb;
  font-weight: 600;
}

.message-content.assistant-content > .vue-markdown-wrapper :deep(img) {
  max-width: 100%;
  height: auto;
  max-height: 320px;
  border-radius: 8px;
  margin: 1em 0;
}

@keyframes image-skeleton-loading {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

/* 协议 <<<ATTACHMENT_LOADING>>>：正在读取附件骨架 */
.attachment-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 2px;
  margin-bottom: 8px;
}

.attachment-loading-text {
  color: var(--slate-600, #64748b);
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.attachment-loading-wave {
  position: relative;
  width: 22px;
  height: 14px;
  color: var(--slate-500, #94a3b8);
  overflow: hidden;
}

.attachment-loading-wave::before {
  content: "";
  position: absolute;
  inset: 4px 4px 4px 0;
  background:
    linear-gradient(135deg, transparent 44%, currentColor 44% 56%, transparent 56%) 0 50% / 8px 8px repeat-x,
    linear-gradient(225deg, transparent 44%, currentColor 44% 56%, transparent 56%) 4px 50% / 8px 8px repeat-x;
  opacity: 0.9;
  animation: attachment-loading-wave 0.9s linear infinite;
}

.attachment-loading-wave::after {
  content: "";
  position: absolute;
  top: 1px;
  right: 0;
  width: 2px;
  height: 12px;
  border-radius: 2px;
  background: currentColor;
  animation: attachment-loading-caret 1s steps(1, end) infinite;
}

@keyframes attachment-loading-wave {
  from { transform: translateX(0); }
  to { transform: translateX(-8px); }
}

@keyframes attachment-loading-caret {
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0.25; }
}

.dark .attachment-loading {
  color: var(--slate-300, #cbd5e1);
}

.dark .attachment-loading-text {
  color: var(--slate-400, #94a3b8);
}

.dark .attachment-loading-wave {
  color: var(--slate-400, #94a3b8);
}

/* 助手首包前加载态（发送后立即反馈） */
.assistant-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 2px;
  margin-bottom: 8px;
}

.assistant-loading-text {
  color: var(--slate-600, #64748b);
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.assistant-loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.assistant-loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--slate-400, #94a3b8);
  animation: assistant-loading-bounce 1.1s ease-in-out infinite;
}

.assistant-loading-dot:nth-child(2) {
  animation-delay: 0.18s;
}

.assistant-loading-dot:nth-child(3) {
  animation-delay: 0.36s;
}

@keyframes assistant-loading-bounce {
  0%, 80%, 100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.dark .assistant-loading-text {
  color: var(--slate-400, #94a3b8);
}

.dark .assistant-loading-dot {
  background: var(--slate-500, #64748b);
}

/* 图片生成模式的骨架块：显示在说明文字下方，图片 markdown 收到后由图片取代视觉位置 */
.image-skeleton-block {
  width: 100%;
  max-width: 320px;
  height: 320px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: image-skeleton-loading 1.5s infinite;
  margin: 0.75rem 0;
}

.dark .image-skeleton-block {
  background: linear-gradient(90deg, #1f2933 25%, #273444 50%, #1f2933 75%);
  background-size: 200% 100%;
}

/* 生成文件卡片容器 */
.generated-files-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  max-width: 100%;
}

.generated-file-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 50%;
}

.generated-file-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #e0e0e0;
  transform: translateY(-1px);
}

/* 左侧大图标 40–48px，按类型着色 */
.generated-file-icon {
  flex-shrink: 0;
  font-size: 26px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  line-height: 1;
}

.generated-file-icon--excel {
  background: rgba(33, 150, 83, 0.12);
  color: #219653;
}

.generated-file-icon--pdf {
  background: rgba(219, 58, 52, 0.12);
  color: #db3a34;
}

.generated-file-icon--word {
  background: rgba(41, 98, 255, 0.12);
  color: #2962ff;
}

.generated-file-icon--image {
  background: rgba(142, 68, 173, 0.12);
  color: #8e44ad;
}

.generated-file-icon--default {
  background: var(--slate-100, #f1f5f9);
  color: var(--slate-600, #475569);
}

.generated-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.generated-file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--slate-900, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.generated-file-meta {
  font-size: 12px;
  color: var(--slate-500, #64748b);
}

/* 右侧操作：下载 + 更多，点击不触发整卡下载 */
.generated-file-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.generated-file-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--slate-500, #64748b);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.generated-file-btn:hover {
  background: var(--slate-100, #f1f5f9);
  color: var(--slate-700, #334155);
}

.generated-file-btn .el-icon {
  font-size: 18px;
}

.dark .generated-file-card {
  background: var(--slate-800, #1e293b);
  border-color: var(--slate-700, #334155);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark .generated-file-card:hover {
  background: var(--slate-750, #273044);
  border-color: var(--slate-600, #475569);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.dark .generated-file-icon--default {
  background: var(--slate-700, #334155);
  color: var(--slate-300, #cbd5e1);
}

.dark .generated-file-name {
  color: var(--slate-100, #f1f5f9);
}

.dark .generated-file-meta {
  color: var(--slate-400, #94a3b8);
}

.dark .generated-file-btn {
  color: var(--slate-400, #94a3b8);
}

.dark .generated-file-btn:hover {
  background: var(--slate-700, #334155);
  color: var(--slate-200, #e2e8f0);
}

/* symbol 节点未完成时的样式 */
.symbol-pending {
  display: inline-block;
  color: var(--slate-500, #64748b);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
  white-space: pre-wrap;
  word-break: break-word;
}

.vue-markdown-wrapper:not(.no-fade) > *,
.vue-markdown-wrapper:not(.no-fade) .text-segmenter,
.vue-markdown-wrapper:not(.no-fade) .shiki-stream span {
  animation: fade-in 0.5s ease-in-out;
}

.markdown-sse-content :deep(.sse_cursor) {
  display: none !important;
}

/* 输入区附件卡片：简约、高级、轻量 */
.attachments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.attach-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 10px 38px 10px 10px;
  border-radius: 14px;
  border: 1px solid var(--border-light, #e2e8f0);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(8px);
  max-width: min(340px, 100%);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.attach-card:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.24);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
}

.attach-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: rgba(226, 232, 240, 0.75);
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--slate-500, #64748b);
  position: relative;
}

.attach-card-file-icon.is-text {
  color: var(--blue-500, #3b82f6);
}

.attach-card-file-svg {
  width: 18px;
  height: 18px;
  opacity: 0.88;
}

.attach-card-ext {
  position: absolute;
  bottom: 2px;
  right: 3px;
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: currentColor;
  opacity: 0.92;
}

.attach-card-progress {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 36px;
  height: 36px;
  pointer-events: none;
}

.attach-card-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.attach-card-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attach-card-type {
  font-size: 12px;
  color: var(--text-muted, #64748b);
}

.attach-card-remove {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: background 0.18s ease, opacity 0.18s ease;
}

.attach-card-remove:hover {
  background: rgba(239, 68, 68, 0.92);
  opacity: 1;
}

/* 输入框容器 - 类似 ChatGPT 的布局 */
.input-box-container {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    "leading primary trailing"
    ". footer .";
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-2xl);
  background: var(--bg-primary);
  min-height: 56px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  overflow: visible; /* 录音转写气泡在上方，不能裁掉 */
}

.input-box-container.input-box-has-attachments {
  border-color: rgba(148, 163, 184, 0.55);
  background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(248, 250, 252, 0.94));
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}

/* 拖拽文件悬停时高亮 */
.input-box-container.input-box-dragover {
  border-color: var(--blue-400, #60a5fa);
  background: var(--blue-50, rgba(239, 246, 255, 0.8));
}

.dark .input-box-container.input-box-dragover {
  border-color: var(--blue-500);
  background: rgba(59, 130, 246, 0.12);
}

/* 左侧功能区 */
.input-leading {
  grid-area: leading;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* + 按钮样式 */
.input-prefix-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.input-prefix-btn:hover {
  background: var(--slate-100);
  color: var(--text-primary);
}

.input-prefix-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 输入框下方模式标签容器（思考 / 图片生成） */
.mode-tags {
  grid-area: footer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -4px;
}

/* 思考模式标签 - 显示在底部 */
.thinking-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--blue-50);
  border-radius: 16px;
  font-size: 13px;
  color: var(--blue-600);
  white-space: nowrap;
  width: fit-content;
}

.thinking-icon {
  font-size: 14px;
}

.thinking-text {
  font-weight: 500;
}

.thinking-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  margin-left: 4px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--blue-600);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.thinking-close-btn:hover {
  opacity: 1;
  background: rgba(59, 130, 246, 0.15);
  transform: scale(1.1);
}

.thinking-close-btn:active {
  transform: scale(0.95);
}

/* 图片生成模式标签（样式与思考模式类似，颜色稍作区分） */
.image-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--slate-100);
  border-radius: 16px;
  font-size: 13px;
  color: var(--slate-700);
  white-space: nowrap;
  width: fit-content;
}

.image-icon {
  font-size: 14px;
}

.image-text {
  font-weight: 500;
}

/* 输入框主区域：输入框 + 语音转写气泡 */
.input-primary-wrap {
  grid-area: primary;
  position: relative;
  min-height: 28px;
  display: flex;
  flex-direction: column;
  overflow: visible; /* 气泡在上方，不能裁掉 */
}

/* 实时语音转文字 / 错误气泡（基础样式） */
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

/* Teleport 到 body 时：固定于屏幕底部上方，首页/对话页都可见 */
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

/* 麦克风按钮（trailing 区，与附件、发送同排，ChatGPT 风格） */
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

/* 文本输入框 */
.message-input {
  border: none;
  background: transparent;
  outline: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-primary);
  padding: 4px 8px;
  min-height: 28px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.message-input::placeholder {
  color: var(--text-muted);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 右侧操作区 */
.input-trailing {
  grid-area: trailing;
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-action-btn {
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.input-action-btn:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(148, 163, 184, 0.22);
  color: var(--text-primary, #0f172a);
}

.input-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.attach-btn-icon {
  width: 18px;
  height: 18px;
}

.send-button {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.34);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.02);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.4);
}

.send-button:disabled {
  opacity: 0.56;
  cursor: not-allowed;
  box-shadow: none;
}

.dark .attach-card {
  border-color: rgba(71, 85, 105, 0.7);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.88), rgba(15, 23, 42, 0.86));
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
}

.dark .attach-card-icon {
  background: rgba(51, 65, 85, 0.9);
}

.dark .attach-card-file-icon {
  color: var(--slate-300, #cbd5e1);
}

.dark .attach-card-file-icon.is-text {
  color: var(--blue-300, #93c5fd);
}

.dark .attach-card-name {
  color: var(--slate-100, #f1f5f9);
}

.dark .attach-card-type {
  color: var(--slate-400, #94a3b8);
}

.dark .input-box-container.input-box-has-attachments {
  border-color: rgba(71, 85, 105, 0.88);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.9));
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
}

.dark .input-action-btn {
  color: var(--slate-300, #cbd5e1);
}

.dark .input-action-btn:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.18);
  color: var(--slate-100, #f8fafc);
}

.input-menu-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
}

.input-menu-card-item {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  text-align: left;
  font-size: 13.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary, #374151);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-weight: 500;
}

.input-menu-card-item:hover {
  background: var(--slate-50, rgba(248, 250, 252, 1));
  color: var(--text-primary, #111827);
  transform: translateX(2px);
}

.dark .input-menu-card-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.input-menu-card-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.08));
  color: var(--blue-600, #2563eb);
  font-weight: 600;
}

.dark .input-menu-card-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1));
  color: var(--blue-400, #60a5fa);
}

.input-menu-card-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 50%;
  background: linear-gradient(180deg, var(--blue-500, #3b82f6), var(--blue-600, #2563eb));
  border-radius: 0 3px 3px 0;
  opacity: 0.9;
}

.menu-item-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: transform 0.2s ease;
}

.input-menu-card-item:hover .menu-item-icon {
  transform: scale(1.1);
  opacity: 1;
}

.input-menu-card-item.active .menu-item-icon {
  opacity: 1;
}

.menu-item-text {
  flex: 1;
  font-weight: inherit;
  letter-spacing: -0.01em;
}

.menu-item-arrow {
  font-size: 18px;
  color: var(--text-muted, #9ca3af);
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.input-menu-card-item:hover .menu-item-arrow {
  opacity: 1;
  transform: translateX(2px);
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* Element Plus Popover 自定义样式 */
.input-menu-popover {
  padding: 6px !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
  border: none !important;
  backdrop-filter: blur(8px);
}

.dark .input-menu-popover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
}

/* 更多菜单 Popover 样式 */
.more-menu-popover {
  padding: 6px !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
  background: var(--bg-primary, #ffffff) !important;
  border: none !important;
  backdrop-filter: blur(8px);
}

.dark .more-menu-popover {
  background: rgba(30, 30, 30, 0.95) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
}

.more-menu-content {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  max-width: 300px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 4px;
  gap: 4px;
}

.more-menu-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.more-menu-group:not(:first-child)::before {
  content: '';
  display: block;
  height: 1px;
  background: var(--border-light, rgba(0, 0, 0, 0.06));
  margin: 4px 8px;
  opacity: 0.5;
}

.dark .more-menu-group:not(:first-child)::before {
  background: rgba(255, 255, 255, 0.08);
}

.more-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  color: var(--text-primary, #374151);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  position: relative;
}

.more-menu-item:hover {
  background: var(--slate-50, rgba(248, 250, 252, 1));
  color: var(--text-primary, #111827);
  transform: translateX(2px);
}

.dark .more-menu-item {
  color: var(--text-primary, #e5e7eb);
}

.dark .more-menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary, #f3f4f6);
}

.more-menu-item.more-menu-item-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.08));
  color: var(--blue-600, #2563eb);
  font-weight: 600;
}

.more-menu-item.more-menu-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 50%;
  background: linear-gradient(180deg, var(--blue-500, #3b82f6), var(--blue-600, #2563eb));
  border-radius: 0 3px 3px 0;
  opacity: 0.9;
}

.more-menu-item.more-menu-item-active:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.1));
}

.dark .more-menu-item.more-menu-item-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1));
  color: var(--blue-400, #60a5fa);
}

.dark .more-menu-item.more-menu-item-active:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(59, 130, 246, 0.13));
}

.more-menu-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.more-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  font-size: 16px;
  line-height: 1;
  opacity: 0.9;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.more-menu-item:hover .more-menu-icon {
  transform: scale(1.1);
  opacity: 1;
}

.more-menu-item.more-menu-item-active .more-menu-icon {
  opacity: 1;
}

.more-menu-text {
  flex: 1;
  font-size: 13.5px;
  font-weight: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.more-menu-link {
  display: block;
}

/* 助手消息「更多操作」菜单样式（气泡式，下拉弹层） */
.message-more-wrap {
  position: relative;
  display: inline-flex;
}

.message-more-menu {
  position: absolute;
  bottom: 110%;
  left: 20px;
  z-index: 30;
  padding: 8px 10px;
  border-radius: 14px;
  background: var(--bg-primary, #ffffff);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
  min-width: 180px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-sizing: border-box;
}

.dark .message-more-menu {
  background: #353535;
}

.message-more-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0 4px;
}

.message-more-time {
  font-size: 12px;
  color: var(--text-tertiary, #9ca3af);
}

.message-more-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary, #9ca3af);
}

.message-more-token,
.message-more-cost {
  white-space: nowrap;
}

.message-more-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--border-default, #e5e7eb);
}

.dark .message-more-divider {
  background: var(--border-default, #4b5563);
}

.message-more-item {
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 6px 8px;
  text-align: left;
  font-size: 13px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.message-more-item:hover {
  background: rgba(59, 130, 246, 0.08);
  color: var(--blue-600, #2563eb);
}

.dark .message-more-item {
  color: var(--text-primary, #f3f4f6);
}

.dark .message-more-item:hover {
  background: rgba(59, 130, 246, 0.18);
}

/* ECharts 块骨架与容器 */
.echarts-block {
  margin-bottom: 12px;
}

.echarts-skeleton {
  margin-bottom: 12px;
}

.skeleton-rect {
  width: 610px;
  height: 500px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: echarts-loading 1.5s infinite;
  border-radius: 12px;
}

.dark .skeleton-rect {
  background: linear-gradient(90deg, #2c2c2c 25%, #3c3c3c 50%, #2c2c2c 75%);
  background-size: 200% 100%;
  animation: echarts-loading 1.5s infinite;
}

@keyframes echarts-loading {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* OCR 对话框 */
.ocr-dialog .el-dialog__body {
  padding: 16px 20px;
}

.ocr-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ocr-upload-area {
  border: 2px dashed var(--border-medium, #e5e7eb);
  border-radius: 12px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  position: relative;
  overflow: hidden;
}

.ocr-upload-area:hover {
  border-color: var(--blue-400, #60a5fa);
  background: var(--blue-50, rgba(239, 246, 255, 0.5));
}

.ocr-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.ocr-upload-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.ocr-upload-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
}

.ocr-upload-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-tertiary, #9ca3af);
}

.ocr-preview-img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
}

.ocr-preview-name {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocr-result-wrap {
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 12px;
  background: var(--bg-secondary, #f9fafb);
}

.ocr-result-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.ocr-result-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.ocr-copy-btn {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.ocr-copy-btn:hover {
  background: var(--slate-100);
  color: var(--text-primary);
}

.ocr-copy-btn.ocr-copy-done {
  color: var(--green-600, #16a34a);
  border-color: var(--green-500, #22c55e);
}

.ocr-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ocr-btn {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.ocr-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ocr-btn-cancel {
  background: var(--slate-100);
  color: var(--text-secondary);
}

.ocr-btn-cancel:hover:not(:disabled) {
  background: var(--slate-200);
}

.ocr-btn-primary {
  background: var(--blue-500, #3b82f6);
  color: #fff;
}

.ocr-btn-primary:hover:not(:disabled) {
  background: var(--blue-600, #2563eb);
}

.dark .ocr-upload-area {
  border-color: var(--border-medium);
}

.dark .ocr-upload-area:hover {
  border-color: var(--blue-500);
  background: rgba(59, 130, 246, 0.12);
}

.dark .ocr-result-wrap {
  background: var(--bg-secondary);
}

</style>
