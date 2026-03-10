declare module 'v3-markdown-stream' {
  import type { DefineComponent } from 'vue'
  export const MarkdownRender: DefineComponent<{
    markInfo?: string
    themeColor?: string
    baseFontSize?: string
  }>
}
