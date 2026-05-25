import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './styles/global.scss'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import router from './router'

/**
 * @vibe-intent 初始化 Pinia 状态管理并注册本地持久化缓存插件。
 * @vibe-model Gemini 3 Flash
 * @vibe-ref intents.md#2026-04-28
 */
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.mount('#app')

