import { computed, ref } from 'vue'

export type UiLanguageValue = 'auto' | 'zh' | 'en'
export type UiLocale = 'zh' | 'en'

export const UI_LANGUAGE_STORAGE_KEY = 'ui_language'
const UI_LANGUAGE_EVENT = 'ui-language:changed'

const uiLanguageSetting = ref<UiLanguageValue>('auto')
let inited = false

function resolveUiLocale(value: UiLanguageValue): UiLocale {
  if (value === 'zh') return 'zh'
  if (value === 'en') return 'en'
  if (typeof navigator !== 'undefined') {
    return String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  }
  return 'zh'
}

function syncDom(locale: UiLocale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.setAttribute('data-ui-lang', locale)
}

function readStoredUiLanguage(): UiLanguageValue {
  try {
    const raw = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)
    if (raw === 'zh' || raw === 'en' || raw === 'auto') return raw
  } catch {}
  return 'auto'
}

function ensureInit() {
  if (inited) return
  inited = true
  uiLanguageSetting.value = readStoredUiLanguage()
  syncDom(resolveUiLocale(uiLanguageSetting.value))

  if (typeof window !== 'undefined') {
    window.addEventListener(UI_LANGUAGE_EVENT, (e: Event) => {
      const detail = (e as CustomEvent<{ value?: UiLanguageValue }>).detail
      const value = detail?.value
      if (value === 'zh' || value === 'en' || value === 'auto') {
        uiLanguageSetting.value = value
        syncDom(resolveUiLocale(value))
      }
    })
    window.addEventListener('storage', (e) => {
      if (e.key !== UI_LANGUAGE_STORAGE_KEY) return
      uiLanguageSetting.value = readStoredUiLanguage()
      syncDom(resolveUiLocale(uiLanguageSetting.value))
    })
  }
}

export function setUiLanguage(value: UiLanguageValue) {
  ensureInit()
  uiLanguageSetting.value = value
  syncDom(resolveUiLocale(value))
  try {
    localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, value)
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UI_LANGUAGE_EVENT, { detail: { value } }))
  }
}

export function useUiLanguage() {
  ensureInit()
  const uiLocale = computed<UiLocale>(() => resolveUiLocale(uiLanguageSetting.value))
  const t = (zh: string, en: string) => (uiLocale.value === 'en' ? en : zh)
  return {
    uiLanguageSetting,
    uiLocale,
    t
  }
}

