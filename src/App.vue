<template>
  <div class="app-container">
    <!-- 🎯 现代化侧边栏 -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <!-- 📊 应用头部 -->
      <div class="sidebar-header">
        <div class="app-logo" @click="goHome">
          <div class="logo-icon">AI</div>
          <span>ChatUI Pro</span>
        </div>
        
      </div>

      <!-- 🎯 快捷操作菜单 -->
      <aside class="sidebar-actions">
        <a
          tabindex="0"
          class="sidebar-menu-item"
          data-testid="create-new-chat-button"
          href="/"
          @click.prevent="createNew"
        >
          <span class="sidebar-item-icon">✏️</span>
          <span class="sidebar-item-label">{{ t('新聊天', 'New Chat') }}</span>
        </a>
        <div
          tabindex="0"
          class="sidebar-menu-item"
          @click="openSearchModal"
          @keydown.enter="openSearchModal"
          @keydown.space.prevent="openSearchModal"
        >
          <span class="sidebar-item-icon">🔍</span>
          <span class="sidebar-item-label">{{ t('搜索聊天', 'Search Chats') }}</span>
        </div>
        <router-link
          tabindex="0"
          class="sidebar-menu-item"
          data-testid="sidebar-item-agents"
          to="/agent"
          @click="closeSidebar"
        >
          <span class="sidebar-item-icon">🤖</span>
          <span class="sidebar-item-label">{{ t('智能体', 'Agent') }}</span>
        </router-link>
        <router-link
          tabindex="0"
          class="sidebar-menu-item"
          data-testid="sidebar-item-library"
          to="/images"
          @click="closeSidebar"
        >
          <span class="sidebar-item-icon">🖼️</span>
          <span class="sidebar-item-label">{{ t('图片', 'Images') }}</span>
        </router-link>
      </aside>

      <!-- 📋 会话管理（整块可滚动，避免滚轮不动） -->
      <div class="sessions-container">
        <div class="sessions-scroll">
          <!-- 智能体会话：ChatGPT/Claude 风格，仅标题 + 时间，hover 显示更多 -->
          <div v-if="route.path === '/agent'" class="sessions-section">
            <div class="sessions-header">
              <span class="sessions-title">🤖 {{ t('智能体', 'Agent') }}</span>
            </div>
            <div class="sessions-list sessions-list-agent">
              <div
                v-for="session in agentSessions"
                :key="'agent-' + session.id"
                class="session-item agent-session"
                :class="{ active: activeAgentId === session.id }"
                :data-session-id="session.id"
                :title="agentSessionTooltip(session)"
              >
                <div
                  class="session-item-main"
                  @click="openAgentSession(session.id)"
                >
                  <div class="session-content session-content-agent">
                    <span class="session-title-text">
                      {{ session.title || t('智能体对话', 'Agent Chat') }}
                    </span>
                    <span class="session-time-inline">
                      {{ formatTimeAgent(session.updateTime) }}
                    </span>
                  </div>
                </div>
                <div
                  class="session-menu-wrap"
                  role="button"
                  tabindex="0"
                  :aria-expanded="menuAgentSessionId === session.id"
                  :title="`${t('管理对话：', 'Manage chat: ')}${session.title || t('智能体对话', 'Agent Chat')}`"
                  @click.stop.prevent="toggleAgentMenu(session.id, $event)"
                  @keydown.enter.prevent="toggleAgentMenu(session.id, $event)"
                  @keydown.space.prevent="toggleAgentMenu(session.id, $event)"
                >
                  <span class="session-menu" aria-hidden="true">⋯</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 普通对话：仅在非智能体页面显示 -->
          <div v-if="route.path !== '/agent'" class="sessions-section">
            <div class="sessions-header">
              <span class="sessions-title">💬 {{ t('对话', 'Chats') }}</span>
            </div>

            <div class="sessions-list">
          <div
            v-for="session in filteredSessions"
            :key="session.id"
            class="session-item"
            :class="{ active: activeId === session.id, pinned: session.pinned }"
            :data-session-id="session.id"
          >
            <div 
              class="session-item-main"
              @click="openSession(session.id)"
            >
              <div class="session-content">
                <div class="session-title">
                  <span
                    v-if="session.pinned"
                    class="session-pin-badge"
                    :title="t('已置顶对话', 'Pinned')"
                  >
                    📌
                  </span>
                  <span class="session-title-text">
                    {{ session.title || t('新对话', 'New Chat') }}
                  </span>
                </div>
              </div>
            </div>
            <div
              class="session-menu-wrap"
              role="button"
              tabindex="0"
              :aria-expanded="menuSessionId === session.id"
              :title="`${t('管理对话：', 'Manage chat: ')}${session.title || t('未命名对话', 'Untitled')}`"
              @click.stop.prevent="toggleMenu(session.id, $event)"
              @keydown.enter.prevent="toggleMenu(session.id, $event)"
              @keydown.space.prevent="toggleMenu(session.id, $event)"
            >
              <span class="session-menu" aria-hidden="true">⋯</span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredSessions.length === 0" class="empty-state">
            <div class="empty-state-icon">💬</div>
            <div class="empty-state-title">{{ t('暂无对话', 'No chats yet') }}</div>
            <div class="empty-state-description">
              {{ t('点击右上角 + 按钮开始你的第一条对话', 'Click the + button to start your first chat') }}
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 👤 用户资料（Element Plus 下拉，登录后点击可展开） -->
      <div class="user-profile">
        <!-- 未登录：整卡点击打开登录/注册 -->
        <div
          v-if="!loggedIn"
          class="user-card"
          role="button"
          tabindex="0"
          :title="t('点击登录 / 注册', 'Click to sign in / register')"
          @click="openAuth"
          @keydown.enter.prevent="openAuth"
          @keydown.space.prevent="openAuth"
        >
          <div class="user-avatar-wrap" :title="avatarTooltip">
            <img v-if="avatarUrl" class="user-avatar user-avatar-img" :src="avatarUrl" alt="" />
            <span v-else class="user-avatar" aria-hidden="true">{{ avatarText }}</span>
          </div>
          <div class="user-card-main" :title="userTooltip">
            <div class="user-info">
              <div class="user-name">{{ displayName }}</div>
              <div class="user-status">{{ userStatus }}</div>
            </div>
            <span class="profile-indicator">▾</span>
          </div>
        </div>
        <!-- 已登录：el-dropdown 点击展开菜单，避免自定义定位/document 监听导致无响应 -->
        <el-dropdown
          v-else
          trigger="click"
          placement="top-start"
          popper-class="user-menu-popper"
          @command="handleUserMenuCommand"
        >
          <div
            class="user-card user-card-dropdown-trigger"
            role="button"
            tabindex="0"
            :title="t('点击打开用户菜单', 'Click to open user menu')"
          >
            <div class="user-avatar-wrap" :title="avatarTooltip">
              <img v-if="avatarUrl" class="user-avatar user-avatar-img" :src="avatarUrl" alt="" />
              <span v-else class="user-avatar" aria-hidden="true">{{ avatarText }}</span>
            </div>
            <div class="user-card-main" :title="userTooltip">
              <div class="user-info">
                <div class="user-name">{{ displayName }}</div>
                <div class="user-status">{{ userStatus }}</div>
              </div>
              <span class="profile-indicator">▾</span>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <!-- 用户信息：点击可修改 -->
              <el-dropdown-item command="edit-profile" class="user-info-dropdown-item">
                <div class="user-info-menu-inner">
                  <div class="user-info-menu-icon">
                    <div class="user-info-avatar-wrap">
                      <img
                        v-if="avatarUrl"
                        class="user-info-avatar-img"
                        :src="avatarUrl"
                        :alt="t('个人资料图片', 'Profile image')"
                        referrerpolicy="no-referrer"
                      />
                      <span v-else class="user-info-avatar-placeholder">{{ avatarText }}</span>
                    </div>
                  </div>
                  <div class="user-info-menu-text min-w-0">
                    <div class="user-info-menu-name">{{ displayName }}</div>
                    <div class="user-info-menu-username">@{{ currentUser?.username ?? '' }}</div>
                  </div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="settings" divided>⚙️ {{ t('设置', 'Settings') }}</el-dropdown-item>
              <el-dropdown-item command="settings-personalization">
                🎨 {{ t('个性化', 'Personalization') }}
              </el-dropdown-item>
              <el-dropdown-item command="usage-panel">
                📊 {{ t('调用统计', 'Usage Stats') }}
              </el-dropdown-item>
              <el-dropdown-item command="usage-records">
                📜 {{ t('调用记录', 'Usage Records') }}
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                🚪 {{ t('注销', 'Log out') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>

    <!-- 💬 主内容区域 -->
    <main class="main-content">
      <div class="mobile-topbar">
        <button
          type="button"
          class="mobile-sidebar-toggle"
          :aria-expanded="sidebarOpen ? 'true' : 'false'"
          :aria-label="t('打开侧栏导航', 'Open sidebar navigation')"
          @click="toggleSidebar"
        >
          <span class="mobile-sidebar-toggle-icon" aria-hidden="true">☰</span>
        </button>
        <button type="button" class="mobile-topbar-brand" @click="goHome">
          <span class="mobile-topbar-brand-mark">AI</span>
          <span class="mobile-topbar-brand-text">ChatUI Pro</span>
        </button>
      </div>
      <router-view />
    </main>

    <!-- 📱 移动端遮罩 -->
    <div 
      v-if="sidebarOpen" 
      class="mobile-overlay"
      @click="closeSidebar"
    ></div>

    <!-- 🎭 模态框 -->
    <AuthModal v-if="showAuth" @close="closeAuth" @success="onAuthSuccess" />

    <!-- 设置面板（点击下拉“设置”或“个性化”打开） -->
    <SettingsPanel
      v-if="showSettings"
      :initial-tab="settingsInitialTab"
      @close="closeSettings"
    />

    <!-- 🔍 搜索模态框 -->
    <div v-if="showSearchModal" class="search-modal-backdrop" @click="closeSearchModal">
      <div class="search-modal" @click.stop>
        <div class="search-modal-header">
          <h3>{{ t('搜索聊天', 'Search Chats') }}</h3>
          <button class="search-modal-close" @click="closeSearchModal" :aria-label="t('关闭', 'Close')">×</button>
        </div>
        <div class="search-modal-body">
          <div class="search-modal-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="search-modal-icon" aria-hidden="true">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input 
              type="text" 
              class="search-modal-input" 
              :placeholder="t('搜索对话...', 'Search chats...')" 
              v-model="searchQuery"
              @input="handleSearch"
              @keydown.escape="closeSearchModal"
            />
          </div>
          <div class="search-results">
            <div v-if="filteredSessions.length === 0" class="search-empty">
              <div class="search-empty-icon">🔍</div>
              <div class="search-empty-text">{{ t('未找到匹配的对话', 'No matching chats found') }}</div>
            </div>
            <div v-else class="search-results-list">
              <div
                v-for="session in filteredSessions" 
                :key="session.id"
                class="search-result-item"
                @click="openSession(session.id); closeSearchModal()"
              >
                <div class="search-result-title">{{ session.title || t('新对话', 'New Chat') }}</div>
                <div class="search-result-preview">{{ getSessionPreview(session) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑资料弹窗（参考设计：标题 + 头像 + 显示名称/用户名 + 说明 + 取消/保存） -->
    <div v-if="showEditProfile" class="modal-backdrop" @click="closeEditProfile">
      <div
        role="dialog"
        aria-labelledby="edit-profile-title"
        class="modal edit-profile-modal"
        tabindex="-1"
        @click.stop
      >
        <header class="edit-profile-header">
          <div class="edit-profile-header-inner">
            <h2 id="edit-profile-title" class="edit-profile-title">{{ t('编辑个人资料', 'Edit Profile') }}</h2>
          </div>
        </header>
        <div class="edit-profile-body">
          <form class="edit-profile-form" @submit.prevent="submitEditProfile">
            <div class="edit-profile-avatar-section">
              <div class="edit-profile-avatar-wrap">
                <button
                  type="button"
                  class="edit-profile-avatar-btn"
                  :aria-label="t('更新个人资料照片', 'Update profile photo')"
                  :aria-busy="editAvatarUploading"
                  @click="triggerEditAvatarInput"
                >
                  <img
                    v-if="editAvatarUrl"
                    class="edit-profile-avatar-img"
                    :src="editAvatarUrl"
                    :alt="editDisplayName || t('头像', 'Avatar')"
                  />
                  <span v-else-if="editAvatarUploading" class="edit-profile-avatar-loading">{{ t('上传中...', 'Uploading...') }}</span>
                  <span v-else class="edit-profile-avatar-initials">{{ editProfileInitials }}</span>
                  <div class="edit-profile-avatar-camera">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </button>
              </div>
              <input
                ref="editAvatarInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                class="sr-only"
                aria-hidden="true"
                @change="onEditAvatarFileChange"
              />
            </div>
            <div class="edit-profile-field">
              <label for="edit-display-name" class="edit-profile-label">{{ t('显示名称', 'Display name') }}</label>
              <div class="edit-profile-input-wrap">
                <input
                  id="edit-display-name"
                  v-model="editDisplayName"
                  type="text"
                  class="edit-profile-input"
                  :placeholder="t('显示名称', 'Display name')"
                  autocomplete="off"
                  name="display-name"
                />
              </div>
            </div>
            <div class="edit-profile-field">
              <label for="edit-username" class="edit-profile-label">{{ t('用户名', 'Username') }}</label>
              <div class="edit-profile-input-wrap">
                <input
                  id="edit-username"
                  v-model="editUsername"
                  type="text"
                  class="edit-profile-input"
                  :placeholder="t('用户名', 'Username')"
                  autocomplete="off"
                  name="username"
                />
              </div>
            </div>
            <p class="edit-profile-desc">
              {{ t('个人资料有助于他人识别你的身份。你的姓名和用户名也将用于本应用。', 'Your profile helps others identify you. Your display name and username will be used in this app.') }}
            </p>
            <div v-if="editProfileError" class="edit-profile-error">{{ editProfileError }}</div>
          </form>
          <div class="edit-profile-actions">
            <button type="button" class="btn-secondary" @click="closeEditProfile">{{ t('取消', 'Cancel') }}</button>
            <button
              type="button"
              class="btn-primary"
              :disabled="editProfileLoading"
              @click="submitEditProfile"
            >
              {{ editProfileLoading ? t('保存中...', 'Saving...') : t('保存', 'Save') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 调用统计面板 -->
    <div v-if="showUsagePanel" class="modal-backdrop usage-panel-backdrop" @click="closeUsagePanel">
      <div
        role="dialog"
        aria-labelledby="usage-panel-title"
        class="modal usage-panel-modal"
        tabindex="-1"
        @click.stop
      >
        <header class="usage-panel-header">
          <div class="usage-panel-title-wrap">
            <h2 id="usage-panel-title" class="usage-panel-title">{{ t('调用统计', 'Usage Stats') }}</h2>
            <p class="usage-panel-subtitle">{{ t('查看你的接口调用和 Token 消耗趋势', 'Track your API calls and token consumption trends') }}</p>
          </div>
          <button class="search-modal-close usage-panel-close" @click="closeUsagePanel" :aria-label="t('关闭', 'Close')">×</button>
        </header>

        <div v-if="usageLoading" class="usage-panel-loading">{{ t('加载中...', 'Loading...') }}</div>
        <div v-else-if="usageError" class="usage-panel-error">{{ usageError }}</div>
        <div v-else class="usage-panel-body">
          <section class="usage-kpi-grid">
            <div v-for="card in usageMetricCards" :key="card.key" class="usage-kpi-card">
              <div class="usage-kpi-label">{{ card.label }}</div>
              <div class="usage-kpi-value">{{ card.value }}</div>
            </div>
          </section>

          <div class="usage-chart-toggle" role="group" :aria-label="t('图表统计维度切换', 'Chart metric switch')">
            <button
              type="button"
              class="usage-chart-toggle-btn"
              :class="{ active: usageChartMetric === 'token' }"
              @click="usageChartMetric = 'token'"
            >
              {{ t('Token 使用量', 'Token Usage') }}
            </button>
            <button
              type="button"
              class="usage-chart-toggle-btn"
              :class="{ active: usageChartMetric === 'count' }"
              @click="usageChartMetric = 'count'"
            >
              {{ t('调用次数', 'Call Count') }}
            </button>
          </div>

          <section class="usage-chart-section">
            <h3 class="usage-chart-title">{{ hourChartTitle }}</h3>
            <EchartsRenderer class="usage-panel-chart" :option="hourChartOption" />
          </section>

          <section class="usage-chart-section">
            <h3 class="usage-chart-title">{{ monthChartTitle }}</h3>
            <EchartsRenderer class="usage-panel-chart" :option="monthChartOption" />
          </section>

          <section class="usage-chart-section">
            <h3 class="usage-chart-title">{{ yearChartTitle }}</h3>
            <EchartsRenderer class="usage-panel-chart" :option="yearChartOption" />
          </section>

          <section class="usage-pie-grid">
            <div class="usage-chart-section">
              <h3 class="usage-chart-title">{{ t('模型占比（按 Token）', 'Model Share (by Tokens)') }}</h3>
              <EchartsRenderer class="usage-panel-pie-chart" :option="modelPieChartOption" />
            </div>
            <div class="usage-chart-section">
              <h3 class="usage-chart-title">{{ t('输入/输出 Token 对比', 'Prompt vs Completion Tokens') }}</h3>
              <EchartsRenderer class="usage-panel-pie-chart" :option="promptCompletionPieChartOption" />
            </div>
          </section>

          <section class="usage-chart-section usage-top-models-section">
            <h3 class="usage-chart-title">{{ t('模型调用 Top 10', 'Top 10 Models by Calls') }}</h3>
            <div v-if="!topModelRows.length" class="usage-top-models-empty">
              {{ t('暂无排行数据', 'No ranking data') }}
            </div>
            <div v-else class="usage-top-models-list">
              <div v-for="item in topModelRows" :key="`${item.rank}-${item.model}`" class="usage-top-model-row">
                <span class="usage-top-model-rank">#{{ item.rank }}</span>
                <span class="usage-top-model-main">
                  <span class="usage-top-model-brand-icon" :class="modelBrandClass(item.model)">
                    {{ modelBrandIcon(item.model) }}
                  </span>
                  <span class="usage-top-model-text-group">
                    <span class="usage-top-model-name" :title="item.model">{{ item.model }}</span>
                    <span class="usage-top-model-brand-chip">{{ modelBrandName(item.model) }}</span>
                  </span>
                </span>
                <span class="usage-top-model-calls">{{ formatInteger(item.calls) }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- 📋 会话菜单（Teleport 到 body，避免被侧边栏 overflow 裁切） -->
    <Teleport to="body">
      <div
        v-if="menuSessionId && dropdownPosition && currentMenuSession"
        class="session-dropdown session-dropdown-teleport"
        :style="{ top: dropdownPosition.top + 'px', left: dropdownPosition.left + 'px' }"
        @click.stop
      >
        <button @click="editSession(currentMenuSession.id)" :title="loggedIn ? t('重命名对话', 'Rename chat') : t('重命名本地对话', 'Rename local chat')">
          ✏️ {{ t('重命名', 'Rename') }}
        </button>
        <button @click="pinSession(currentMenuSession.id)" :title="loggedIn ? t('置顶对话', 'Pin chat') : t('置顶本地对话', 'Pin local chat')">
          📌 {{ currentMenuSession.pinned ? t('取消置顶', 'Unpin') : t('置顶', 'Pin') }}
        </button>
        <button 
          v-if="loggedIn" 
          @click="archiveSession(currentMenuSession.id)" 
          :title="t('归档对话（仅登录用户）', 'Archive chat (signed-in only)')"
        >
          📦 {{ currentMenuSession.archived ? t('取消存档', 'Unarchive') : t('存档', 'Archive') }}
        </button>
        <hr />
        <button 
          @click="confirmDelete(currentMenuSession.id)" 
          class="danger"
          :title="loggedIn ? t('删除云端对话', 'Delete cloud chat') : t('删除本地对话', 'Delete local chat')"
        >
          🗑️ {{ t('删除', 'Delete') }}
        </button>
      </div>

      <!-- 智能体会话更多菜单（仅删除） -->
      <div
        v-if="menuAgentSessionId !== null && agentDropdownPosition && currentMenuAgentSession"
        class="session-dropdown session-dropdown-teleport"
        :style="{ top: agentDropdownPosition.top + 'px', left: agentDropdownPosition.left + 'px' }"
        @click.stop
      >
        <button
          type="button"
          @click="confirmDeleteAgent(currentMenuAgentSession.id)"
          class="danger"
          :title="t('删除智能体对话', 'Delete agent chat')"
        >
          🗑️ {{ t('删除', 'Delete') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, reactive, toRefs, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { listSessions } from './stores/sessions'
import { clearToken, isLoggedIn, currentUser, setUser } from './stores/auth'
import { apiFetch } from './api/http'
import { get } from './api/request'
import { uploadAvatar } from './api/upload'
import { ensureAnonIdentified } from './api/anon'
import AuthModal from './components/AuthModal.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import EchartsRenderer from './components/EchartsRenderer.vue'
import { useUiLanguage } from './composables/useUiLanguage'

// 路由与状态
const router = useRouter()
const route = useRoute()
const { t, uiLocale } = useUiLanguage()

// 响应式数据
const state = reactive({
  sessions: [] as Array<{
    id: string
    title?: string
    preview?: string
    updatedAt?: Date
    pinned?: boolean
    archived?: boolean
  }>,
  // 智能体会话列表：id 全程使用 string，避免 bigint 精度丢失
  agentSessions: [] as Array<{
    id: string
    title?: string
    lastMessage?: string
    updateTime?: Date
  }>,
  searchQuery: '',
  menuSessionId: null as string | null,
  menuAgentSessionId: null as string | null,
  showAuth: false,
  sidebarOpen: false,
  darkMode: false,
  loggedIn: isLoggedIn()
})

// 编辑资料弹窗
const showEditProfile = ref(false)
const editDisplayName = ref('')
const editUsername = ref('')
const editAvatarUrl = ref('')
const editAvatarUploading = ref(false)
const editProfileError = ref('')
const editProfileLoading = ref(false)
const editAvatarInputRef = ref<HTMLInputElement | null>(null)
const editProfileInitials = computed(() => {
  const name = editDisplayName.value?.trim() || editUsername.value?.trim() || ''
  return name ? name.charAt(0).toUpperCase() : 'U'
})

const showSettings = ref(false)
const settingsInitialTab = ref('general')
const showSearchModal = ref(false)
const showUsagePanel = ref(false)
const usageLoading = ref(false)
const usageError = ref('')

type UsageSummary = {
  total: number
  todayCalls: number
  totalToken: number
}

type UsagePoint = {
  label: string
  tokenValue: number
  countValue: number
}

type PiePoint = {
  name: string
  value: number
}

type TopModelPoint = {
  model: string
  calls: number
}

const usageSummary = ref<UsageSummary>({
  total: 0,
  todayCalls: 0,
  totalToken: 0
})
const usageRawData = ref<Record<string, unknown>>({})
const hourSeries = ref<UsagePoint[]>([])
const monthSeries = ref<UsagePoint[]>([])
const yearSeries = ref<UsagePoint[]>([])
const modelPieSeries = ref<PiePoint[]>([])
const promptCompletionPieSeries = ref<PiePoint[]>([])
const topModelSeries = ref<TopModelPoint[]>([])
const usageChartMetric = ref<'token' | 'count'>('token')

const chartTextColor = computed(() => (state.darkMode ? '#e2e8f0' : '#0f172a'))
const chartLineColor = computed(() => (state.darkMode ? '#334155' : '#dbe3ee'))
const chartAreaColor = computed(() => (state.darkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 165, 233, 0.14)'))
const chartPrimaryColor = computed(() => (state.darkMode ? '#38bdf8' : '#0284c7'))
const pieColorPalette = computed(() =>
  state.darkMode
    ? ['#7dd3fc', '#86efac', '#c4b5fd', '#fcd34d', '#67e8f9', '#f9a8d4', '#93c5fd']
    : ['#5b8ff9', '#5ad8a6', '#5d7092', '#6dc8ec', '#9270ca', '#9bdc8c', '#7b9fff']
)

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function pad2(v: number): string {
  return String(v).padStart(2, '0')
}

function formatDateYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function normalizeUsageSeries(raw: unknown): UsagePoint[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>
    const label = String(
      row.hour ??
        row.month ??
        row.year ??
        row.date ??
        row.label ??
        row.time ??
        index + 1
    )
    const tokenValue = toNumber(
      row.totalTokens ??
        row.total_tokens ??
        row.tokens ??
        row.token ??
        row.tokenCount ??
        row.value
    )
    const countValue = toNumber(
      row.totalCount ??
        row.total_count ??
        row.count ??
        row.calls ??
        row.num ??
        row.total ??
        row.value
    )
    return { label, tokenValue, countValue }
  })
}

function formatChartXAxisLabel(label: string): string {
  const text = String(label ?? '').trim()
  const dateTimeMatch = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/)
  if (dateTimeMatch) return dateTimeMatch[2]
  const hourMatch = text.match(/^(\d{1,2})(:\d{2})?$/)
  if (hourMatch) return `${hourMatch[1].padStart(2, '0')}:00`
  return text
}

function formatCompactNumber(v: number): string {
  const n = toNumber(v)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.floor(n))
}

function createLineOption(series: UsagePoint[], title: string) {
  const labels = series.map((x) => x.label)
  const values = series.map((x) => (usageChartMetric.value === 'token' ? x.tokenValue : x.countValue))
  const metricLabel = usageChartMetric.value === 'token' ? t('Token 使用量', 'Token Usage') : t('调用次数', 'Call Count')
  return {
    title: {
      text: title,
      left: 8,
      top: 6,
      textStyle: { fontSize: 13, fontWeight: 600, color: chartTextColor.value }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: state.darkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.97)',
      borderColor: state.darkMode ? '#334155' : '#dbe3ee',
      borderWidth: 1,
      textStyle: { color: chartTextColor.value },
      formatter: (params: any) => {
        const first = Array.isArray(params) ? params[0] : params
        if (!first) return ''
        const val = toNumber(first.value)
        const marker = first.marker ?? ''
        return `${first.axisValueLabel}<br/>${marker}${metricLabel}: ${formatInteger(val)}`
      }
    },
    grid: { left: 48, right: 20, top: 44, bottom: 34 },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisTick: { show: false },
      axisLabel: {
        color: chartTextColor.value,
        fontSize: 11,
        hideOverlap: true,
        formatter: (value: string) => formatChartXAxisLabel(value)
      },
      axisLine: { lineStyle: { color: chartLineColor.value } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: {
        color: chartTextColor.value,
        fontSize: 11,
        formatter: (value: number) => formatCompactNumber(value)
      },
      splitLine: { lineStyle: { color: chartLineColor.value } }
    },
    graphic:
      values.length === 0
        ? [
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: t('暂无图表数据', 'No chart data'),
                fill: chartTextColor.value,
                opacity: 0.55,
                fontSize: 13
              }
            }
          ]
        : undefined,
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        connectNulls: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: chartPrimaryColor.value },
        areaStyle: { color: chartAreaColor.value },
        emphasis: { focus: 'series' }
      }
    ]
  }
}

function createPieOption(series: PiePoint[]) {
  return {
    color: pieColorPalette.value,
    tooltip: {
      trigger: 'item',
      backgroundColor: state.darkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.97)',
      borderColor: state.darkMode ? '#334155' : '#dbe3ee',
      borderWidth: 1,
      textStyle: { color: chartTextColor.value },
      formatter: (params: any) => {
        const name = String(params?.name ?? '')
        const value = toNumber(params?.value)
        const percent = toNumber(params?.percent)
        return `${name}<br/>${formatInteger(value)} (${percent.toFixed(1)}%)`
      }
    },
    legend: {
      type: 'scroll',
      bottom: 2,
      left: 'center',
      icon: 'circle',
      textStyle: { color: chartTextColor.value, fontSize: 11 }
    },
    graphic:
      series.length === 0
        ? [
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: t('暂无图表数据', 'No chart data'),
                fill: chartTextColor.value,
                opacity: 0.55,
                fontSize: 13
              }
            }
          ]
        : undefined,
    series: [
      {
        type: 'pie',
        radius: ['44%', '70%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        minAngle: 4,
        padAngle: 1,
        stillShowZeroSum: false,
        itemStyle: { borderColor: state.darkMode ? '#0f172a' : '#f7fafc', borderWidth: 2 },
        label: {
          show: true,
          color: chartTextColor.value,
          formatter: '{d}%',
          rich: {
            b: { fontSize: 11, fontWeight: 500, color: chartTextColor.value }
          }
        },
        labelLayout: { hideOverlap: true },
        labelLine: { length: 10, length2: 8 },
        data: series
      }
    ]
  }
}

function normalizeModelPieSeries(raw: unknown): PiePoint[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>
      const name = String(row.model ?? row.modelName ?? row.name ?? row.type ?? `Model ${index + 1}`)
      const value = toNumber(
        row.totalTokens ??
          row.total_tokens ??
          row.tokens ??
          row.token ??
          row.count ??
          row.totalCount ??
          row.total_count ??
          row.total ??
          row.value
      )
      return { name, value }
    })
    .filter((x) => x.value > 0)
}

function normalizePromptCompletionPieSeries(raw: unknown): PiePoint[] {
  const row = (raw ?? {}) as Record<string, unknown>
  const promptValue = toNumber(
    row.promptTokens ?? row.prompt_tokens ?? row.inputTokens ?? row.input_tokens ?? row.prompt ?? row.input
  )
  const completionValue = toNumber(
    row.completionTokens ??
      row.completion_tokens ??
      row.outputTokens ??
      row.output_tokens ??
      row.completion ??
      row.output
  )
  const list: PiePoint[] = [
    { name: t('输入 Token', 'Prompt Tokens'), value: promptValue },
    { name: t('输出 Token', 'Completion Tokens'), value: completionValue }
  ]
  return list.filter((x) => x.value > 0)
}

function normalizeTopModelSeries(raw: unknown): TopModelPoint[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>
      const model = String(
        row.model ??
          row.chatModel ??
          row.chat_model ??
          row.modelName ??
          row.model_name ??
          row.name ??
          `Model ${index + 1}`
      )
      const calls = toNumber(
        row.calls ??
          row.callCount ??
          row.call_count ??
          row.totalCount ??
          row.total_count ??
          row.count ??
          row.total ??
          row.value
      )
      return { model, calls }
    })
    .filter((x) => x.calls > 0)
    .slice(0, 10)
}

const topModelRows = computed(() =>
  topModelSeries.value.map((item, index) => ({
    rank: index + 1,
    model: item.model,
    calls: item.calls
  }))
)

function modelBrandClass(v: unknown): string {
  const text = String(v ?? '').trim().toLowerCase()
  if (!text) return 'brand-openai'
  if (text.includes('gpt') || text.includes('o1') || text.includes('o3') || text.includes('openai')) return 'brand-openai'
  if (text.includes('claude') || text.includes('anthropic')) return 'brand-anthropic'
  if (text.includes('grok') || text.includes('xai')) return 'brand-xai'
  if (text.includes('gemini') || text.includes('google')) return 'brand-google'
  if (text.includes('deepseek')) return 'brand-deepseek'
  if (text.includes('qwen') || text.includes('tongyi')) return 'brand-qwen'
  if (text.includes('llama') || text.includes('meta')) return 'brand-meta'
  if (text.includes('kimi') || text.includes('moonshot')) return 'brand-moonshot'
  if (text.includes('glm') || text.includes('zai')) return 'brand-zai'
  return 'brand-openai'
}

function modelBrandIcon(v: unknown): string {
  const text = String(v ?? '').trim().toLowerCase()
  if (!text) return 'O'
  if (text.includes('gpt') || text.includes('o1') || text.includes('o3') || text.includes('openai')) return 'O'
  if (text.includes('claude') || text.includes('anthropic')) return 'A'
  if (text.includes('grok') || text.includes('xai')) return 'x'
  if (text.includes('gemini') || text.includes('google')) return 'G'
  if (text.includes('deepseek')) return 'D'
  if (text.includes('qwen') || text.includes('tongyi')) return 'Q'
  if (text.includes('llama') || text.includes('meta')) return 'M'
  if (text.includes('kimi') || text.includes('moonshot')) return 'K'
  if (text.includes('glm') || text.includes('zai')) return 'Z'
  return 'O'
}

function modelBrandName(v: unknown): string {
  const cls = modelBrandClass(v)
  if (cls === 'brand-openai') return 'OpenAI'
  if (cls === 'brand-anthropic') return 'Anthropic'
  if (cls === 'brand-xai') return 'xAI'
  if (cls === 'brand-google') return 'Google'
  if (cls === 'brand-deepseek') return 'DeepSeek'
  if (cls === 'brand-qwen') return 'Qwen'
  if (cls === 'brand-meta') return 'Meta'
  if (cls === 'brand-moonshot') return 'Moonshot'
  if (cls === 'brand-zai') return 'Z.ai'
  return 'OpenAI'
}

const hourChartTitle = computed(() =>
  usageChartMetric.value === 'token'
    ? t('今日每小时 Token 使用', 'Hourly Token Usage (Today)')
    : t('今日每小时调用', 'Hourly Calls (Today)')
)
const monthChartTitle = computed(() =>
  usageChartMetric.value === 'token'
    ? t('近 12 个月 Token 趋势', 'Monthly Token Trend (Last 12 Months)')
    : t('近 12 个月调用趋势', 'Monthly Calls (Last 12 Months)')
)
const yearChartTitle = computed(() =>
  usageChartMetric.value === 'token'
    ? t('按年 Token 趋势', 'Yearly Token Trend')
    : t('按年调用趋势', 'Yearly Calls')
)
const hourChartOption = computed(() => createLineOption(hourSeries.value, hourChartTitle.value))
const monthChartOption = computed(() => createLineOption(monthSeries.value, monthChartTitle.value))
const yearChartOption = computed(() => createLineOption(yearSeries.value, yearChartTitle.value))
const modelPieChartOption = computed(() => createPieOption(modelPieSeries.value))
const promptCompletionPieChartOption = computed(() => createPieOption(promptCompletionPieSeries.value))

function formatInteger(v: unknown): string {
  const n = Math.max(0, Math.floor(toNumber(v)))
  return n.toLocaleString(uiLocale.value === 'en' ? 'en-US' : 'zh-CN')
}

function formatMetricValue(v: unknown): string {
  if (typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()))) {
    return formatInteger(v)
  }
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

const usageMetricCards = computed(() => {
  const raw = usageRawData.value || {}
  const labelMap: Record<string, string> = {
    total: t('累计调用', 'Total Calls'),
    today_calls: t('今日调用', 'Today Calls'),
    total_token: t('累计 Token', 'Total Tokens'),
    today_token: t('今日 Token', 'Today Tokens'),
    today_token_quota: t('今日 Token 限额', 'Today Token Quota'),
    type: t('用户类型', 'User Type')
  }
  const preferred = ['total', 'today_calls', 'total_token', 'today_token', 'today_token_quota', 'type']
  const keys = [...preferred.filter((k) => k in raw), ...Object.keys(raw).filter((k) => !preferred.includes(k))]
  const list = keys.slice(0, 6).map((key) => ({
    key,
    label: labelMap[key] ?? key,
    value: formatMetricValue(raw[key])
  }))

  if (!list.length) {
    return [
      { key: 'total', label: labelMap.total, value: formatInteger(usageSummary.value.total) },
      { key: 'today_calls', label: labelMap.today_calls, value: formatInteger(usageSummary.value.todayCalls) },
      { key: 'total_token', label: labelMap.total_token, value: formatInteger(usageSummary.value.totalToken) }
    ]
  }
  return list
})

// 记录 body 原始滚动样式，防止外层滚动条滚动
let originalBodyOverflow = ''

// 计算属性
const activeId = computed(() => (route.query.id as string) || '')
const activeAgentId = computed(() => {
  if (route.path === '/agent' && route.query.sessionId) {
    return String(route.query.sessionId)
  }
  return null
})
const displayName = computed(() => {
  if (!state.loggedIn) return 'Tourist'
  const u = currentUser.value
  return (u?.nickname || u?.username || t('已登录用户', 'Signed-in User')) as string
})
const userStatus = computed(() => (state.loggedIn ? t('在线', 'Online') : t('游客模式', 'Guest Mode')))
const avatarUrl = computed(() => currentUser.value?.avatar_url || '')
const avatarText = computed(() => {
  if (!state.loggedIn) return 'T'
  const u = currentUser.value
  const name = u?.nickname || u?.username || ''
  return name ? name.charAt(0).toUpperCase() : 'U'
})
const userTooltip = computed(() =>
  state.loggedIn
    ? `${displayName.value} - ${t('点击查看选项', 'Click to view options')}`
    : t('游客用户 - 点击查看选项', 'Guest user - Click to view options')
)
const avatarTooltip = computed(() =>
  state.loggedIn ? t('点击头像打开设置', 'Click avatar to open settings') : t('点击头像立即登录', 'Click avatar to sign in')
)

// 🔍 搜索过滤
const filteredSessions = computed(() => {
  console.log('当前sessions数量:', state.sessions.length, 'menuSessionId:', state.menuSessionId)
  if (!state.searchQuery.trim()) return state.sessions
  
  const query = state.searchQuery.toLowerCase()
  return state.sessions.filter(session => 
    session.title?.toLowerCase().includes(query) ||
    session.preview?.toLowerCase().includes(query)
  )
})

// 响应式解构
const {
  sessions,
  agentSessions,
  searchQuery,
  menuSessionId,
  menuAgentSessionId,
  showAuth,
  sidebarOpen,
  darkMode,
  loggedIn
} = toRefs(state)

// 📋 下拉菜单定位（Teleport 用）
const menuAnchorRef = ref<HTMLElement | null>(null)
const dropdownPosition = ref<{ top: number; left: number } | null>(null)
const currentMenuSession = computed(() =>
  state.menuSessionId ? state.sessions.find(s => s.id === state.menuSessionId) : null
)

// 智能体会话更多菜单定位
const agentMenuAnchorRef = ref<HTMLElement | null>(null)
const agentDropdownPosition = ref<{ top: number; left: number } | null>(null)
const currentMenuAgentSession = computed(() =>
  state.menuAgentSessionId != null
    ? state.agentSessions.find(s => s.id === state.menuAgentSessionId)
    : null
)

watch(menuSessionId, async (id) => {
  if (!id) {
    dropdownPosition.value = null
    return
  }
  await nextTick()
  const el = menuAnchorRef.value
  if (el) {
    const r = el.getBoundingClientRect()
    const minWidth = 160
    dropdownPosition.value = {
      top: r.bottom + 4,
      left: Math.max(4, r.right - minWidth)
    }
  } else {
    dropdownPosition.value = null
  }
})

watch(menuAgentSessionId, async (id) => {
  if (id == null) {
    agentDropdownPosition.value = null
    return
  }
  await nextTick()
  const el = agentMenuAnchorRef.value
  if (el) {
    const r = el.getBoundingClientRect()
    const minWidth = 120
    agentDropdownPosition.value = {
      top: r.bottom + 4,
      left: Math.max(4, r.right - minWidth)
    }
  } else {
    agentDropdownPosition.value = null
  }
})

// 🔄 数据加载
function parseBackendDate(raw: unknown): Date | undefined {
  if (raw == null || raw === '') return undefined

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? undefined : raw
  }

  // "yyyy-MM-dd HH:mm:ss" from backend (LocalDateTime + @JsonFormat, timezone=GMT+8)
  // Use manual parsing to avoid cross-browser Date parsing issues.
  if (typeof raw === 'string') {
    const s = raw.trim()
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(s)
    if (m) {
      const y = Number(m[1])
      const mon = Number(m[2])
      const d = Number(m[3])
      const hh = Number(m[4])
      const mm = Number(m[5])
      const ss = Number(m[6])
      if ([y, mon, d, hh, mm, ss].every((x) => Number.isFinite(x))) {
        // Backend declares timezone GMT+8, convert to UTC milliseconds.
        const utcMs = Date.UTC(y, mon - 1, d, hh - 8, mm, ss)
        const out = new Date(utcMs)
        return Number.isNaN(out.getTime()) ? undefined : out
      }
    }
  }

  // number / numeric string: timestamp (seconds or ms)
  if (typeof raw === 'number' || (typeof raw === 'string' && /^\d+(\.\d+)?$/.test(raw.trim()))) {
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n)) return undefined
    const ms = n < 1e12 ? Math.round(n * 1000) : Math.round(n) // < 1e12 treat as seconds
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? undefined : d
  }

  if (typeof raw === 'string') {
    const s = raw.trim()
    // ISO / RFC3339, or other formats parsable by Date
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) return d
  }

  return undefined
}

async function loadSessions() {
  try {
    // 使用带有 401 自动刷新逻辑的 axios 封装
    const resp = await get<any[]>('/list/chat')
    const data = (resp as any)?.data?.data ?? (resp as any)?.data
    if (!Array.isArray(data)) return

    state.sessions = (data as any[])
      .map((c) => ({
        id: String(c.id || ''),
        title: c.title ? String(c.title) : t('新对话', 'New Chat'),
        // 后端 Conversation 目前没有 lastMessage，这里临时使用占位文案
        preview: t('暂无消息', 'No messages yet'),
        // 会话更新时间：兼容多种字段名；缺失时不再用“当前时间”兜底，避免全部项看起来一样新
        updatedAt: (() => {
          const updatedRaw =
            c.updatedAt ??
            null
          const createdRaw = c.created_at ?? c.createdAt ?? c.create_time ?? c.createTime ?? null
          return parseBackendDate(updatedRaw) ?? parseBackendDate(createdRaw)
        })(),
        pinned: c.pinned ?? false,
        archived: c.archived || false
      }))
      .filter(s => s.id)
      .sort((a, b) => {
        // 置顶优先，然后按时间排序
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
      })
  } catch {
    // 接口失败时，未登录用户回退到本地 session；已登录则保持现有列表
    if (!state.loggedIn) {
      state.sessions = listSessions().map((s) => ({
        id: s.id,
        title: s.title,
        preview: s.lastMessageText || t('点击开始对话...', 'Click to start chatting...'),
        updatedAt: new Date(s.updatedAt),
        pinned: s.pinned ?? false,
        archived: s.archived ?? false
      }))
    }
  }
}

// 加载智能体会话列表
async function loadAgentSessions() {
  try {
    const { ok, json } = await apiFetch<any>('/api/agent/sessions', { method: 'GET' })
    if (!ok || !Array.isArray(json?.data)) return

    state.agentSessions = (json!.data as any[])
      .map((s) => ({
        // 后端可能返回 Long/number，这里统一转成 string，避免超出 JS 安全整数范围
        id: String(s.sessionId),
        title: s.title || t('智能体对话', 'Agent Chat'),
        lastMessage: s.lastMessage || '',
        updateTime: parseBackendDate(s.updateTime)
      }))
      .filter(s => s.id)
      .sort((a, b) => (b.updateTime?.getTime() || 0) - (a.updateTime?.getTime() || 0))
  } catch (error) {
    console.error('加载智能体会话失败:', error)
  }
}

// 🎯 会话操作
function goHome() {
  closeSidebar()
  router.push({ path: '/' })
}

function createNew() {
  closeSidebar()
  router.push({ path: '/' })
}

function openSearchModal() {
  closeSidebar()
  showSearchModal.value = true
  // 聚焦搜索输入框
  nextTick(() => {
    const searchInput = document.querySelector('.search-modal-input') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  })
}

function closeSearchModal() {
  showSearchModal.value = false
}

function openSession(id: string) {
  closeSidebar()
  router.push({ path: '/', query: { id } })
}

function openAgentSession(id: string) {
  closeSidebar()
  router.push({ path: '/agent', query: { sessionId: id } })
}

function toggleAgentMenu(id: string, e?: Event) {
  const wasOpen = state.menuAgentSessionId === id
  state.menuAgentSessionId = wasOpen ? null : id
  state.menuSessionId = null

  if (state.menuAgentSessionId !== null && e?.currentTarget) {
    const anchor = (e.currentTarget as HTMLElement).closest('.session-item')
    if (anchor) agentMenuAnchorRef.value = anchor as HTMLElement
  } else {
    agentMenuAnchorRef.value = null
  }

  if (state.menuAgentSessionId !== null) {
    const closeMenu = () => {
      state.menuAgentSessionId = null
      document.removeEventListener('click', closeMenu)
    }
    setTimeout(() => document.addEventListener('click', closeMenu), 50)
  }
}

function toggleMenu(id: string, e?: Event) {
  const wasOpen = state.menuSessionId === id
  state.menuSessionId = wasOpen ? null : id
  state.menuAgentSessionId = null

  if (state.menuSessionId && e?.currentTarget) {
    const anchor = (e.currentTarget as HTMLElement).closest('.session-item')
    if (anchor) menuAnchorRef.value = anchor as HTMLElement
  } else {
    menuAnchorRef.value = null
  }

  if (state.menuSessionId) {
    const closeMenu = () => {
      state.menuSessionId = null
      document.removeEventListener('click', closeMenu)
    }
    setTimeout(() => document.addEventListener('click', closeMenu), 50)
  }
}

function getSessionPreview(session: any): string {
  return session.preview || session.lastMessage || t('点击开始对话...', 'Click to start chatting...')
}

/** 智能体列表时间格式：今天 17:43 / 昨天 / 前天 / X天前 */
function formatTimeAgent(date?: Date): string {
  if (!date) return '--'
  const now = new Date()
  const d = date
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.floor((today - dayStart) / 86400000)
  const locale = uiLocale.value === 'en' ? 'en-US' : 'zh-CN'
  const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
  if (diffDays === 0) return uiLocale.value === 'en' ? `Today ${timeStr}` : `今天 ${timeStr}`
  if (diffDays === 1) return t('昨天', 'Yesterday')
  if (diffDays === 2) return t('前天', '2 days ago')
  if (diffDays < 7) return uiLocale.value === 'en' ? `${diffDays} days ago` : `${diffDays}天前`
  return d.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })
}

function agentSessionTooltip(session: { title?: string; lastMessage?: string }): string {
  const title = session.title || t('智能体对话', 'Agent Chat')
  const detail = session.lastMessage?.trim()
  return detail ? `${title}\n${detail}` : title
}

// 🔍 搜索处理
async function handleSearch() {
  const keyword = state.searchQuery.trim()

  // 搜索框清空时恢复完整会话列表
  if (!keyword) {
    await loadSessions()
    return
  }

  try {
    // 约定后端接口：/api/chat/search/message?keyword=xxx
    const params = new URLSearchParams({ keyword })
    const { ok, json } = await apiFetch<any>(`/search/message?${params.toString()}`, {
      method: 'GET'
    })

    if (!ok || !Array.isArray(json?.data)) {
      return
    }

    // 后端返回 Result<List<Conversation>>，字段：id/title/pinned/createdAt/updatedAt
    state.sessions = (json!.data as any[])
      .map((c) => ({
        id: String(c.id || ''),
        title: c.title ? String(c.title) : t('新对话', 'New Chat'),
        preview: t('暂无消息', 'No messages yet'),
        updatedAt: (() => {
          const updatedRaw = c.updatedAt ?? null
          const createdRaw = c.created_at ?? c.createdAt ?? c.create_time ?? c.createTime ?? null
          return parseBackendDate(updatedRaw) ?? parseBackendDate(createdRaw)
        })(),
        pinned: c.pinned ?? false,
        archived: c.archived || false
      }))
      .filter((s) => s.id)
      .sort((a, b) => {
        // 置顶优先，然后按时间排序
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
      })
  } catch (e) {
    // 搜索失败时静默失败，保留现有列表
    console.error('搜索会话失败:', e)
  }
}

// 🗂️ 会话管理
async function editSession(id: string) {
  const session = state.sessions.find(s => s.id === id)
  const currentTitle = session?.title || t('未命名对话', 'Untitled')
  const newTitle = prompt(t('请输入新的对话标题', 'Enter a new chat title'), currentTitle)
  
  if (newTitle !== null && newTitle.trim() !== '') {
    const trimmedTitle = newTitle.trim()
    try {
      const params = new URLSearchParams({ ChatId: id, title: trimmedTitle })
      const response = await apiFetch(`/api/chat/rename?${params.toString()}`, {
        method: 'POST'
      })

      if (response.ok) {
        // 成功更新后更新本地状态
        if (session) {
          session.title = trimmedTitle
        }
        console.log(`已重命名会话: ${id} -> ${trimmedTitle}`)
      } else {
        alert(t('更新标题失败，请稍后重试', 'Failed to update title, please try again later'))
      }
    } catch (error) {
      console.error('重命名会话时发生错误:', error)
      alert(t('重命名会话时网络异常，请稍后重试', 'Network error while renaming chat, please try again later'))
    }
  }
  
  state.menuSessionId = null
}

async function pinSession(id: string) {
  const session = state.sessions.find(s => s.id === id)
  if (!session) {
    state.menuSessionId = null
    return
  }
  
  const newPinnedStatus = !session.pinned
  
  try {
    const prevPinned = !!session.pinned

    // 先更新本地状态以提供即时反馈（失败会回滚）
    session.pinned = newPinnedStatus
    
    // 重新排序
    state.sessions.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
    })
    
    const endpoint = newPinnedStatus ? '/api/pinned' : '/api/unpinned'
    const { ok, json } = await apiFetch(`${endpoint}?conservationId=${encodeURIComponent(id)}`, { method: 'GET' })

    if (!ok) {
      const msg =
        (json as any)?.message ||
        (newPinnedStatus ? t('置顶失败', 'Pin failed') : t('取消置顶失败', 'Unpin failed'))
      throw new Error(String(msg))
    }

    console.log(`${newPinnedStatus ? '置顶' : '取消置顶'}会话: ${id}`)
  } catch (error) {
    console.error('置顶会话时发生错误:', error)
    // 如果失败，回滚状态 + 重新排序
    session.pinned = !newPinnedStatus
    state.sessions.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
    })

    // 取消置顶接口若未提供，给出更明确的提示
    if (!newPinnedStatus) {
      alert(t('取消置顶失败：后端可能尚未提供 /api/unpinned 接口', 'Unpin failed: backend may not provide /api/unpinned yet'))
    } else {
      alert(t('置顶失败，请稍后重试', 'Pin failed, please try again later'))
    }
  }
  
  state.menuSessionId = null
}

async function archiveSession(id: string) {
  const session = state.sessions.find(s => s.id === id)
  if (!session || !state.loggedIn) {
    state.menuSessionId = null
    return
  }
  
  const newArchivedStatus = !session.archived
  
  try {
    // 先更新本地状态以提供即时反馈
    session.archived = newArchivedStatus
    
    console.log(`已${newArchivedStatus ? '存档' : '取消存档'}会话: ${id}`)
    
    // TODO: 调用后端API存档/取消存档
    // const response = await apiFetch('/api/ai/chat/archive', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ChatId: id, archived: newArchivedStatus })
    // })
    
  } catch (error) {
    console.error('存档会话时发生错误:', error)
    // 如果失败，回滚状态
    session.archived = !newArchivedStatus
    alert(t('存档操作失败，请稍后重试', 'Archive operation failed, please try again later'))
  }
  
  state.menuSessionId = null
}

async function confirmDeleteAgent(sessionId: string) {
  state.menuAgentSessionId = null
  const session = state.agentSessions.find(s => s.id === sessionId)
  const title = session?.title || t('智能体对话', 'Agent Chat')
  if (
    !window.confirm(
      uiLocale.value === 'en'
        ? `Are you sure you want to delete "${title}"? This cannot be undone.`
        : `确定要删除对话「${title}」吗？删除后无法恢复。`
    )
  )
    return

  try {
    const response = await apiFetch(`/api/agent/delete?sessionId=${encodeURIComponent(sessionId)}`, { method: 'POST' })
    if (response.ok) {
      state.agentSessions = state.agentSessions.filter(s => s.id !== sessionId)
      if (activeAgentId.value === sessionId) {
        router.push({ path: '/agent' })
      }
      window.dispatchEvent(new CustomEvent('agent-sessions:updated'))
    } else {
      const err = response.json?.message || t('删除失败', 'Delete failed')
      alert(`${t('删除智能体对话失败：', 'Failed to delete agent chat: ')}${err}`)
    }
  } catch (error) {
    console.error('删除智能体会话时发生错误:', error)
    alert(t('删除智能体对话时网络异常，请稍后重试', 'Network error while deleting agent chat, please try again later'))
  }
}

async function confirmDelete(id: string) {
  console.log('confirmDelete 被调用，会话ID:', id, '登录状态:', state.loggedIn)
  state.menuSessionId = null
  
  // 找到要删除的会话标题
  const sessionToDelete = state.sessions.find(s => s.id === id)
  const sessionTitle = sessionToDelete?.title || t('未命名对话', 'Untitled')
  
  if (
    !window.confirm(
      uiLocale.value === 'en'
        ? `Are you sure you want to delete "${sessionTitle}"? This cannot be undone.`
        : `确定要删除对话“${sessionTitle}”吗？删除后无法恢复。`
    )
  )
    return
  
  // 统一调用后端 /chat/delete 删除接口（POST 方式），未登录时用 Anno-Id 标识匿名用户
  try {
    const response = await apiFetch(`/api/chat/delete?ChatId=${encodeURIComponent(id)}`, { method: 'POST' })
    
    if (response.ok) {
      // 成功删除后从本地状态中移除
      state.sessions = state.sessions.filter(s => s.id !== id)
      
      // 如果当前查看的就是被删除的会话，跳转到首页
      if (activeId.value === id) {
        router.push({ path: '/' })
      }
      
      // 发送删除事件，通知其他组件
      window.dispatchEvent(new CustomEvent('sessions:updated'))
    } else {
      // 删除失败，显示错误信息
      const error = response.json?.message || t('删除失败', 'Delete failed')
      alert(`${t('删除会话失败：', 'Failed to delete chat: ')}${error}`)
    }
  } catch (error) {
    console.error('删除会话时发生错误:', error)
    alert(t('删除会话时网络异常，请稍后重试', 'Network error while deleting chat, please try again later'))
  }
}

async function loadUsagePanelData() {
  usageLoading.value = true
  usageError.value = ''
  try {
    const today = new Date()
    const todayStr = formatDateYmd(today)
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 11, 1)
    const yearStart = new Date(today.getFullYear() - 4, 0, 1)

    const fetchStatWithFallback = async (primaryPath: string, fallbackPath?: string) => {
      const primary = await apiFetch<any>(primaryPath, { method: 'GET' })
      if (primary.ok || !fallbackPath) return primary
      return apiFetch<any>(fallbackPath, { method: 'GET' })
    }

    const [usageResp, hourResp, monthResp, yearResp, modelResp, promptCompletionResp, topModelResp] = await Promise.all([
      apiFetch<any>('/api/get/usage', { method: 'GET' }),
      fetchStatWithFallback(`/api/stat/hour?date=${encodeURIComponent(todayStr)}`),
      fetchStatWithFallback(
        `/api/stat/month?start=${encodeURIComponent(formatDateYmd(monthStart))}&end=${encodeURIComponent(todayStr)}`,
        `/api//stat/month?start=${encodeURIComponent(formatDateYmd(monthStart))}&end=${encodeURIComponent(todayStr)}`
      ),
      fetchStatWithFallback(
        `/api/stat/year?start=${encodeURIComponent(formatDateYmd(yearStart))}&end=${encodeURIComponent(todayStr)}`,
        `/api//stat/year?start=${encodeURIComponent(formatDateYmd(yearStart))}&end=${encodeURIComponent(todayStr)}`
      ),
      apiFetch<any>('/api/stat/model', { method: 'GET' }),
      apiFetch<any>('/api/stat/promptCompletion', { method: 'GET' }),
      apiFetch<any>('/api/stat/top/model', { method: 'GET' })
    ])

    if (
      !usageResp.ok &&
      !hourResp.ok &&
      !monthResp.ok &&
      !yearResp.ok &&
      !modelResp.ok &&
      !promptCompletionResp.ok &&
      !topModelResp.ok
    ) {
      throw new Error('all usage endpoints failed')
    }

    const usageData = (usageResp.json?.data ?? {}) as Record<string, unknown>
    usageRawData.value = usageData
    usageSummary.value = {
      total: toNumber(usageData.total),
      todayCalls: toNumber(usageData.today_calls ?? usageData.todayCalls),
      totalToken: toNumber(usageData.total_token ?? usageData.totalToken ?? usageData.tokens)
    }

    hourSeries.value = normalizeUsageSeries(hourResp.json?.data)
    monthSeries.value = normalizeUsageSeries(monthResp.json?.data)
    yearSeries.value = normalizeUsageSeries(yearResp.json?.data)
    modelPieSeries.value = normalizeModelPieSeries(modelResp.json?.data)
    promptCompletionPieSeries.value = normalizePromptCompletionPieSeries(promptCompletionResp.json?.data)
    topModelSeries.value = normalizeTopModelSeries(topModelResp.json?.data ?? topModelResp.json)
  } catch {
    usageError.value = t('加载调用统计失败，请稍后重试', 'Failed to load usage stats, please try again later')
  } finally {
    usageLoading.value = false
  }
}

async function openUsagePanel() {
  showUsagePanel.value = true
  await loadUsagePanelData()
}

function closeUsagePanel() {
  showUsagePanel.value = false
}

// 用户菜单命令（Element Plus dropdown @command）
function handleUserMenuCommand(command: string) {
  if (command === 'edit-profile') openEditProfile()
  else if (command === 'settings') openSettings()
  else if (command === 'settings-personalization') openSettings('personalization')
  else if (command === 'usage-panel') openUsagePanel()
  else if (command === 'usage-records') router.push({ path: '/usage-records' })
  else if (command === 'logout') logout()
}

function openEditProfile() {
  const u = currentUser.value
  if (!u) return
  editDisplayName.value = u.nickname ?? u.username ?? ''
  editUsername.value = u.username ?? ''
  editAvatarUrl.value = u.avatar_url ?? ''
  editProfileError.value = ''
  showEditProfile.value = true
}

function closeEditProfile() {
  showEditProfile.value = false
}

function triggerEditAvatarInput() {
  if (editAvatarUploading.value) return
  editAvatarInputRef.value?.click()
}

async function onEditAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  if (!file.type.startsWith('image/')) {
    editProfileError.value = t('请选择图片文件（jpg、png、gif、webp）', 'Please select an image file (jpg, png, gif, webp)')
    return
  }
  editProfileError.value = ''
  editAvatarUploading.value = true
  try {
    const { fileUrl } = await uploadAvatar(file)
    editAvatarUrl.value = fileUrl
  } catch (err) {
    editProfileError.value = err instanceof Error ? err.message : t('头像上传失败', 'Avatar upload failed')
  } finally {
    editAvatarUploading.value = false
  }
}

async function submitEditProfile() {
  const u = currentUser.value
  if (!u) return
  const username = editUsername.value.trim()
  if (!username) {
    editProfileError.value = t('请输入用户名', 'Please enter username')
    return
  }
  const nickname = editDisplayName.value.trim() || undefined
  editProfileError.value = ''
  editProfileLoading.value = true
  try {
    const { ok, json } = await apiFetch<{ message?: string }>('/api/user/update', {
      method: 'POST',
      body: JSON.stringify({
        id: String(u.id),
        username,
        nickname,
        avatar_url: editAvatarUrl.value.trim() || undefined
      })
    })
    if (!ok) {
      editProfileError.value = (json as any)?.message ?? t('更新失败', 'Update failed')
      return
    }
    setUser({
      ...u,
      username,
      nickname: nickname ?? u.nickname,
      avatar_url: editAvatarUrl.value.trim() || u.avatar_url
    })
    closeEditProfile()
  } catch {
    editProfileError.value = t('网络错误', 'Network error')
  } finally {
    editProfileLoading.value = false
  }
}

function toggleTheme() {
  state.darkMode = !state.darkMode
  document.documentElement.classList.toggle('dark', state.darkMode)
  localStorage.setItem('darkMode', String(state.darkMode))
}

function openSettings(tab?: string) {
  settingsInitialTab.value = tab || 'general'
  showSettings.value = true
}

function closeSettings() {
  showSettings.value = false
}

function openAuth() {
  console.log('openAuth 被调用，设置 showAuth 为 true')
  state.showAuth = true
  console.log('当前 showAuth 状态:', state.showAuth)
}

function closeAuth() {
  state.showAuth = false
}

function closeSidebar() {
  state.sidebarOpen = false
}

function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen
}

// 🔐 认证操作
function onAuthSuccess() {
  state.loggedIn = isLoggedIn()
  state.showAuth = false
  loadSessions()
}

async function logout() {
  try {
    await apiFetch('/api/user/logout', { method: 'POST' })
  } catch {}

  clearToken()
  router.push({ path: '/' })
  state.loggedIn = false
  showUsagePanel.value = false
  loadSessions()
  state.agentSessions = []
}

// 快捷键处理
function handleKeyDown(e: KeyboardEvent) {
  // Ctrl+Shift+O: 新建对话
  if (e.ctrlKey && e.shiftKey && e.key === 'O') {
    e.preventDefault()
    createNew()
    return
  }
  
  // Ctrl+K: 打开搜索
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault()
    openSearchModal()
    return
  }
  
  // ESC: 关闭搜索模态框
  if (e.key === 'Escape' && showSearchModal.value) {
    e.preventDefault()
    closeSearchModal()
    return
  }

  if (e.key === 'Escape' && showUsagePanel.value) {
    e.preventDefault()
    closeUsagePanel()
    return
  }
}

// 进入智能体页面时再拉取智能体会话列表
watch(() => route.path, (path) => {
  if (path === '/agent') loadAgentSessions()
})

// 🎯 生命周期
onMounted(() => {
  // 未登录用户首次进入：调用匿名识别接口，获取 anonId 并缓存在本地，请求通过 Header(Anno-Id) 携带
  if (!state.loggedIn) {
    ensureAnonIdentified().catch(() => {})
  }

  loadSessions()
  if (route.path === '/agent') loadAgentSessions()

  // 锁定页面外层滚动，只允许应用内部滚动
  originalBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  // 初始化主题
  const savedTheme = localStorage.getItem('darkMode')
  if (savedTheme) {
    state.darkMode = savedTheme === 'true'
    document.documentElement.classList.toggle('dark', state.darkMode)
  }

  // 监听系统事件
  window.addEventListener('sessions:updated', loadSessions)
  window.addEventListener('agent-sessions:updated', loadAgentSessions)
  window.addEventListener('auth:updated', () => {
    state.loggedIn = isLoggedIn()
    loadSessions()
  })

  // 添加快捷键监听
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  // 恢复页面外层滚动
  document.body.style.overflow = originalBodyOverflow

  window.removeEventListener('sessions:updated', loadSessions)
  window.removeEventListener('agent-sessions:updated', loadAgentSessions)
  window.removeEventListener('auth:updated', () => {
    state.loggedIn = isLoggedIn()
    loadSessions()
  })

  // 移除快捷键监听
  window.removeEventListener('keydown', handleKeyDown)
})

// 🎊 事件监听
window.addEventListener('chat:new-conversation', (e: Event) => {
  const detail = (e as CustomEvent<{ id: string; title?: string }>).detail
  if (!detail?.id) return
  
  if (!state.sessions.some(s => s.id === detail.id)) {
    state.sessions.unshift({
      id: detail.id,
      title: detail.title || t('新对话', 'New Chat'),
      preview: t('开始新对话...', 'Start a new chat...'),
      updatedAt: new Date()
    })
  }
})

window.addEventListener('chat:update-conversation-title', (e: Event) => {
  const detail = (e as CustomEvent<{ id: string; title?: string }>).detail
  if (!detail?.id || !detail.title) return
  
  const session = state.sessions.find(x => x.id === detail.id)
  if (session) {
    session.title = detail.title
  }
})

window.addEventListener('agent:new-conversation', (e: Event) => {
  const detail = (e as CustomEvent<{
    id: string
    title?: string
    lastMessage?: string
    updateTime?: number
  }>).detail
  if (!detail?.id) return

  const idx = state.agentSessions.findIndex((s) => s.id === detail.id)
  const next = {
    id: detail.id,
    title: detail.title || t('新任务', 'New Task'),
    lastMessage: detail.lastMessage || '',
    updateTime: new Date(detail.updateTime || Date.now())
  }
  if (idx >= 0) {
    state.agentSessions.splice(idx, 1)
  }
  state.agentSessions.unshift(next)
})
</script>

<!-- 全局样式放在 styles.css -->


