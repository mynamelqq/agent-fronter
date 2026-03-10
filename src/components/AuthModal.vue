<template>
  <div class="modal-backdrop" @click="emit('close')">
    <div class="modal auth-modal" @click.stop>
      <div class="modal-head">
        <div class="modal-title">{{ mode === 'login' ? t('登录获得更多功能', 'Sign in for more features') : t('注册', 'Register') }}</div>
        <button class="icon-btn" @click="emit('close')" :aria-label="t('关闭', 'Close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 登录：头像(顶部居中) + 用户名(邮箱) + 密码 -->
        <template v-if="mode === 'login'">
          <div class="edit-profile-avatar-section">
            <div class="edit-profile-avatar-wrap">
              <button
                type="button"
                class="edit-profile-avatar-btn"
                :aria-label="t('更新个人资料照片', 'Update profile photo')"
                :aria-busy="avatarUploading"
                @click="triggerAvatarInput"
              >
                <img
                  v-if="avatarUrl"
                  class="edit-profile-avatar-img"
                  :src="avatarUrl"
                  :alt="username || t('头像', 'Avatar')"
                />
                <span v-else-if="avatarUploading" class="edit-profile-avatar-loading">{{ t('上传中...', 'Uploading...') }}</span>
                <span v-else class="edit-profile-avatar-initials">{{ avatarInitials }}</span>
                <div class="edit-profile-avatar-camera">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </button>
            </div>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              class="sr-only"
              aria-hidden="true"
              @change="onAvatarFileChange"
            />
          </div>
          <label class="field">
            <div class="label">{{ t('邮箱 / 用户名', 'Email / Username') }}</div>
            <input
              v-model="username"
              type="text"
              :placeholder="t('请输入邮箱或用户名', 'Enter email or username')"
              autocomplete="username"
            />
          </label>
          <label class="field">
            <div class="label">{{ t('密码', 'Password') }}</div>
            <input
              v-model="password"
              type="password"
              :placeholder="t('请输入密码', 'Enter password')"
              autocomplete="current-password"
            />
          </label>
        </template>

        <!-- 注册：头像(顶部居中) + 邮箱 + 昵称 + 密码 -->
        <template v-else>
          <div class="edit-profile-avatar-section">
            <div class="edit-profile-avatar-wrap">
              <button
                type="button"
                class="edit-profile-avatar-btn"
                :aria-label="t('更新个人资料照片', 'Update profile photo')"
                :aria-busy="avatarUploading"
                @click="triggerAvatarInput"
              >
                <img
                  v-if="avatarUrl"
                  class="edit-profile-avatar-img"
                  :src="avatarUrl"
                  :alt="nickName || t('头像', 'Avatar')"
                />
                <span v-else-if="avatarUploading" class="edit-profile-avatar-loading">{{ t('上传中...', 'Uploading...') }}</span>
                <span v-else class="edit-profile-avatar-initials">{{ avatarInitials }}</span>
                <div class="edit-profile-avatar-camera">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </button>
            </div>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              class="sr-only"
              aria-hidden="true"
              @change="onAvatarFileChange"
            />
          </div>
          <label class="field">
            <div class="label">{{ t('邮箱', 'Email') }} <span class="required">*</span></div>
            <input
              v-model="email"
              type="email"
              :placeholder="t('用于登录，如 example@mail.com', 'Used for login, e.g. example@mail.com')"
              autocomplete="email"
            />
          </label>
          <label class="field">
            <div class="label">{{ t('昵称', 'Nickname') }} <span class="required">*</span></div>
            <input
              v-model="nickName"
              type="text"
              :placeholder="t('显示名称', 'Display name')"
              autocomplete="nickname"
              maxlength="32"
            />
          </label>
          <label class="field">
            <div class="label">{{ t('密码', 'Password') }} <span class="required">*</span></div>
            <input
              v-model="password"
              type="password"
              :placeholder="t('请设置密码（至少 6 位）', 'Set a password (at least 6 chars)')"
              autocomplete="new-password"
            />
            <div v-if="mode === 'register' && password" class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" :class="passwordStrengthInfo.class" :style="{ width: passwordStrengthInfo.percent + '%' }"></div>
              </div>
              <span class="strength-label" :class="passwordStrengthInfo.class">{{ passwordStrengthInfo.label }}</span>
            </div>
          </label>
          <label class="field">
            <div class="label">{{ t('确认密码', 'Confirm Password') }} <span class="required">*</span></div>
            <input
              v-model="confirmPassword"
              type="password"
              :placeholder="t('请再次输入密码', 'Enter password again')"
              autocomplete="new-password"
            />
            <div v-if="confirmPassword && password !== confirmPassword" class="confirm-mismatch">{{ t('两次输入的密码不一致', 'Passwords do not match') }}</div>
          </label>
        </template>

        <div v-if="successTip" class="success-tip">{{ successTip }}</div>
        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div class="modal-foot">
        <button class="ghost" @click="toggleMode">
          {{ mode === 'login' ? t('没有账号？去注册', "Don't have an account? Register") : t('已有账号？去登录', 'Already have an account? Sign in') }}
        </button>
        <button class="primary" :disabled="loading" @click="submit">
          {{ loading ? t('处理中...', 'Processing...') : (mode === 'login' ? t('登录', 'Sign in') : t('注册', 'Register')) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiFetch } from '../api/http'
import { uploadAvatar } from '../api/upload'
import { setUser, setTokens, type UserVO } from '../stores/auth'
import router from '../router';
import { useUiLanguage } from '../composables/useUiLanguage'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const mode = ref<'login' | 'register'>('login')
const username = ref('')
const email = ref('')
const nickName = ref('')
const password = ref('')
const confirmPassword = ref('')
const avatarUrl = ref('')
const avatarUploading = ref(false)
const avatarInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref('')
const successTip = ref('')
const { t } = useUiLanguage()

const EMAIL_REG = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 密码强度：0 空/过短，1 弱，2 中，3 强 */
function getPasswordStrength(p: string): { level: number; label: string; class: string; percent: number } {
  const len = (p || '').length
  const hasLower = /[a-z]/.test(p)
  const hasUpper = /[A-Z]/.test(p)
  const hasNumber = /\d/.test(p)
  const hasSpecial = /[^a-zA-Z0-9]/.test(p)
  const types = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (len < 6) {
    return {
      level: 0,
      label: t('至少 6 位', 'At least 6 chars'),
      class: 'strength-weak',
      percent: Math.min(100, (len / 6) * 25)
    }
  }
  if (types >= 3 && len >= 8) {
    return { level: 3, label: t('强', 'Strong'), class: 'strength-strong', percent: 100 }
  }
  if (types >= 2 || len >= 8) {
    return { level: 2, label: t('中', 'Medium'), class: 'strength-medium', percent: 66 }
  }
  return { level: 1, label: t('弱', 'Weak'), class: 'strength-weak', percent: 33 }
}

const passwordStrengthInfo = computed(() => getPasswordStrength(password.value))

// 头像首字母显示
const avatarInitials = computed(() => {
  if (mode.value === 'login') {
    const name = username.value?.trim() || ''
    return name ? name.charAt(0).toUpperCase() : 'U'
  } else {
    const name = nickName.value?.trim() || email.value?.trim() || ''
    return name ? name.charAt(0).toUpperCase() : 'U'
  }
})

function toggleMode() {
  error.value = ''
  successTip.value = ''
  if (mode.value === 'register') {
    username.value = email.value.trim() || username.value
  } else {
    email.value = ''
    nickName.value = ''
    avatarUrl.value = ''
    confirmPassword.value = ''
  }
  mode.value = mode.value === 'login' ? 'register' : 'login'
}

function getBackendMessage(json: { message?: string; msg?: string } | undefined): string {
  if (!json) return t('操作失败', 'Operation failed')
  const msg = json.message ?? json.msg
  if (typeof msg === 'string') return msg
  return t('操作失败', 'Operation failed')
}

function triggerAvatarInput() {
  if (avatarUploading.value) return
  avatarInputRef.value?.click()
}

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  if (!file.type.startsWith('image/')) {
    error.value = t('请选择图片文件（jpg、png、gif、webp）', 'Please select an image file (jpg, png, gif, webp)')
    return
  }
  error.value = ''
  avatarUploading.value = true
  try {
    const { fileUrl } = await uploadAvatar(file)
    avatarUrl.value = fileUrl
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('头像上传失败', 'Avatar upload failed')
  } finally {
    avatarUploading.value = false
  }
}

async function submit() {
  error.value = ''
  successTip.value = ''

  if (mode.value === 'login') {
    const u = username.value.trim()
    const p = password.value.trim()
    if (!u || !p) {
      error.value = t('请输入用户名和密码', 'Enter username and password')
      return
    }
    loading.value = true
    try {
      const { ok, json } = await apiFetch<{
        accessToken: string
        refreshToken: string
        username: string
        id: string | number | bigint
      }>('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      })
      const data = json?.data as any
      if (!ok || !data?.accessToken || !data?.refreshToken) {
        error.value = getBackendMessage(json as any)
        return
      }
      // 写入 token
      setTokens(data.accessToken, data.refreshToken)
      // 写入用户基础信息
      const user: UserVO = {
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        nickname: data.nickname
      }
      setUser(user)
      router.push('/')
      emit('success')
      emit('close')
    } catch {
      error.value = t('网络错误', 'Network error')
    } finally {
      loading.value = false
    }
    return
  }

  // 注册
  const em = email.value.trim()
  const nick = nickName.value.trim()
  const p = password.value.trim()
  const avatar = avatarUrl.value.trim()

  if (!em) {
    error.value = t('请输入邮箱', 'Enter email')
    return
  }
  if (!EMAIL_REG.test(em)) {
    error.value = t('请输入有效的邮箱地址', 'Enter a valid email address')
    return
  }
  if (!nick) {
    error.value = t('请输入昵称', 'Enter nickname')
    return
  }
  if (!p) {
    error.value = t('请设置密码', 'Set password')
    return
  }
  if (p.length < 6) {
    error.value = t('密码至少 6 位', 'Password must be at least 6 chars')
    return
  }
  const confirm = confirmPassword.value.trim()
  if (p !== confirm) {
    error.value = t('两次输入的密码不一致', 'Passwords do not match')
    return
  }

  loading.value = true
  try {
    const { ok, json } = await apiFetch<{ data?: unknown }>('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: em,
        password: p,
        nick_name: nick,
        avatar_url: avatar || ''
      })
    })
    if (!ok) {
      error.value = getBackendMessage(json)
      return
    }
    successTip.value = t('注册成功，请登录', 'Registered successfully, please sign in')
    username.value = em
    email.value = ''
    nickName.value = ''
    password.value = ''
    confirmPassword.value = ''
    avatarUrl.value = ''
    mode.value = 'login'
  } catch {
    error.value = t('网络错误', 'Network error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-modal .modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.auth-modal .field-optional .label {
  font-weight: normal;
  color: var(--text-secondary, #666);
}
.edit-profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0;
}
.edit-profile-avatar-wrap {
  margin-bottom: 0.25rem;
}
.edit-profile-avatar-btn {
  position: relative;
  display: block;
  margin: -0.25rem;
  padding: 0.25rem;
  border: none;
  border-radius: 9999px;
  background: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.edit-profile-avatar-btn:hover {
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.06));
}
.edit-profile-avatar-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.edit-profile-avatar-img,
.edit-profile-avatar-initials,
.edit-profile-avatar-loading {
  display: block;
  width: 8rem;
  height: 8rem;
  border-radius: 9999px;
  object-fit: cover;
}
.edit-profile-avatar-img {
  width: 8rem;
  height: 8rem;
}
.edit-profile-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark, #2563eb));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.edit-profile-avatar-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}
.edit-profile-avatar-camera {
  position: absolute;
  right: 0;
  bottom: 0;
  transform: translate(33%, 33%);
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.08));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.edit-profile-avatar-camera svg {
  width: 1rem;
  height: 1rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
/* 完全移出视口，避免任何浏览器显示“选择文件”框 */
.required {
  color: var(--danger, #e74c3c);
}
.password-strength {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
}
.strength-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-secondary, #eee);
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s, background 0.2s;
}
.strength-fill.strength-weak {
  background: var(--danger, #e74c3c);
}
.strength-fill.strength-medium {
  background: var(--warning, #f39c12);
}
.strength-fill.strength-strong {
  background: var(--success-text, #27ae60);
}
.strength-label {
  font-size: 0.75rem;
  min-width: 3em;
}
.strength-label.strength-weak {
  color: var(--danger, #e74c3c);
}
.strength-label.strength-medium {
  color: var(--warning, #f39c12);
}
.strength-label.strength-strong {
  color: var(--success-text, #27ae60);
}
.confirm-mismatch {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--danger, #e74c3c);
}
.success-tip {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: var(--success-bg, #d4edda);
  color: var(--success-text, #155724);
  font-size: 0.9rem;
}
.dark .success-tip {
  background: rgba(34, 139, 34, 0.2);
  color: #7dce82;
}
</style>
