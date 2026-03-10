import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles.css'
import './styles-streaming.css'
// 引入 highlight.js 样式 - 使用 GitHub 主题
import 'highlight.js/styles/github.css'
// 引入 KaTeX 样式 - 数学公式渲染
import 'katex/dist/katex.min.css'

createApp(App).use(router).use(ElementPlus).mount('#app')

