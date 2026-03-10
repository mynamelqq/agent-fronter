<template>
  <div class="images-page">
    <div class="images-header">
      <h1>{{ t('我的图片', 'My Images') }}</h1>

    </div>

    <section class="image-generate-panel">
      <div class="image-generate-form">
        <input
          v-model="generateDescription"
          class="image-generate-input"
          type="text"
          :placeholder="t('输入图片描述，例如：一只在雨夜街头的赛博猫', 'Describe the image, e.g. a cyber cat in a rainy night street')"
          @keyup.enter="generateImage"
        />
        <button class="image-generate-btn" :disabled="generating" @click="generateImage">
          {{ generating ? t('生成中...', 'Generating...') : t('生成图片', 'Generate') }}
        </button>
      </div>

      <div class="image-generate-result">
        <div v-if="generating" class="generate-skeleton">
          <div class="skeleton-image"></div>
          <div class="skeleton-line"></div>
        </div>
        <div v-else-if="generatedImageUrl" class="generated-image-wrap">
          <img class="generated-image" :src="generatedImageUrl" :alt="t('生成图片', 'Generated image')" />
        </div>
        <div v-else class="generate-empty">
          {{ t('输入提示词后点击生成图片', 'Enter a prompt and generate an image') }}
        </div>
        <div v-if="generateError" class="generate-error">{{ generateError }}</div>
      </div>
    </section>

    <div v-if="loading && !images.length" class="images-state">{{ t('正在加载图片...', 'Loading images...') }}</div>
    <div v-else-if="error" class="images-state images-error">{{ error }}</div>
    <div v-else-if="!images.length" class="images-state">{{ t('暂无图片', 'No images yet') }}</div>
    <div v-else class="images-strip-wrap">
      <div class="images-strip">
        <article v-for="item in images" :key="item.id" class="image-card">
          <img class="image-card-img" :src="item.link" :alt="`image-${item.id}`" loading="lazy" />
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../api/http'
import { useUiLanguage } from '../composables/useUiLanguage'

type ImageItem = {
  id: number | string
  userId?: string
  link: string
  createdAt?: string
  conservationId?: string
}

const { t } = useUiLanguage()
const route = useRoute()
const images = ref<ImageItem[]>([])
const loading = ref(false)
const error = ref('')
const generating = ref(false)
const generateDescription = ref('')
const generatedImageUrl = ref('')
const generateError = ref('')

function normalizeImage(raw: unknown): ImageItem | null {
  const row = (raw ?? {}) as Record<string, unknown>
  const id = row.id ?? ''
  const link = String(row.link ?? '').trim()
  if (!id || !link) return null

  return {
    id,
    userId: String(row.userId ?? ''),
    link,
    createdAt: String(row.createdAt ?? ''),
    conservationId: String(row.conservationId ?? '')
  }
}

async function loadImages() {
  loading.value = true
  error.value = ''
  try {
    const endpointCandidates = ['/api/image/list']
    let loaded = false

    for (const endpoint of endpointCandidates) {
      const { ok, json } = await apiFetch<ImageItem[]>(endpoint, { method: 'GET' })
      if (!ok || !Array.isArray(json?.data)) continue

      images.value = json.data
        .map(normalizeImage)
        .filter((item): item is ImageItem => item !== null)
      loaded = true
      break
    }

    if (!loaded) {
      throw new Error(t('获取图片列表失败', 'Failed to load image list'))
    }
  } catch (e) {
    images.value = []
    error.value = e instanceof Error ? e.message : t('获取图片列表失败', 'Failed to load image list')
  } finally {
    loading.value = false
  }
}

function parseImageMarkdownUrl(input: string): string {
  const text = String(input || '').trim()
  if (!text) return ''
  const mdMatch = text.match(/!\[[^\]]*]\((\S+?)(?:\s+"[^"]*")?\)/)
  if (mdMatch?.[1]) return mdMatch[1]
  if (/^https?:\/\//i.test(text)) return text
  return ''
}

async function generateImage() {
  const description = generateDescription.value.trim()
  if (!description) {
    generateError.value = t('请输入图片描述', 'Please enter image description')
    return
  }
  generating.value = true
  generateError.value = ''
  generatedImageUrl.value = ''

  try {
    const form = new URLSearchParams()
    form.set('description', description)
    const { ok, json, text } = await apiFetch<string>('/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: form.toString()
    })

    if (!ok) {
      throw new Error(json?.message || json?.msg || text || t('图片生成失败', 'Image generation failed'))
    }

    const resultRaw = String(json?.data ?? '').trim()
    const imageUrl = parseImageMarkdownUrl(resultRaw)
    if (!imageUrl) {
      throw new Error(t('生成结果格式不正确', 'Invalid generation result format'))
    }
    generatedImageUrl.value = imageUrl
  } catch (e) {
    generateError.value = e instanceof Error ? e.message : t('图片生成失败', 'Image generation failed')
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  loadImages()
})
</script>

<style scoped>
.images-page {
  min-height: 100%;
  padding: 20px 24px 24px;
  background: #f5f6f8;
}

.images-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 16px;
}

.images-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: #111827;
  user-select: none;
}

.images-refresh-btn {
  position: absolute;
  right: 0;
  border: none;
  background: #ffffff;
  color: #374151;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.08);
  transition: all 0.2s ease;
}

.images-refresh-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.1);
}

.images-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.images-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #4b5563;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.images-error {
  color: #dc2626;
}

.image-generate-panel {
  margin-bottom: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.image-generate-form {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.image-generate-input {
  flex: 1;
  min-width: 0;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: #f3f5f9;
  color: #111827;
  padding: 0 14px;
  outline: none;
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.image-generate-input:focus {
  background: #eef2ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.image-generate-btn {
  height: 44px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border-radius: 12px;
  padding: 0 18px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
}

.image-generate-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.image-generate-result {
  background: #f8fafc;
  border-radius: 14px;
  padding: 12px;
  min-height: 240px;
}

.generate-empty {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.generated-image-wrap {
  display: flex;
  justify-content: center;
}

.generated-image {
  max-width: 100%;
  max-height: 460px;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
}

.generate-error {
  margin-top: 8px;
  color: #dc2626;
}

.generate-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-image,
.skeleton-line {
  background: linear-gradient(90deg, #eef2f7 25%, #dbe3ef 37%, #eef2f7 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  border-radius: 10px;
}

.skeleton-line {
  width: 48%;
  height: 14px;
  border-radius: 8px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.images-strip-wrap {
  overflow-x: auto;
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.images-strip {
  display: flex;
  align-items: stretch;
  gap: 4px;
  min-width: max-content;
}

.image-card {
  width: 300px;
  height: 300px;
  overflow: hidden;
  background: #f9fafb;
}

.image-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 768px) {
  .images-page {
    padding: 14px;
  }

  .images-header {
    justify-content: space-between;
  }

  .images-header h1 {
    font-size: 1.35rem;
  }

  .images-refresh-btn {
    position: static;
  }

  .image-generate-form {
    flex-direction: column;
    align-items: stretch;
  }

  .image-card {
    width: 230px;
    height: 230px;
  }
}
</style>
