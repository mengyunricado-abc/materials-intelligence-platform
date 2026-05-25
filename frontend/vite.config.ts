/**
 * @vibe-intent 为前端开发服务器配置 /api 反向代理，直连真实 FastAPI 反馈网关，解决跨域与 404 问题。
 * @vibe-model Gemini 3.5 Flash (High)
 * @vibe-ref intents.md#2026-05-25
 */
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  server: {
    fs: {
      allow: ['.', '..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
