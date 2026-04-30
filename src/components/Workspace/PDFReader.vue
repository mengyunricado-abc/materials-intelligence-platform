<template>
  <div class="pdf-reader">
    <div class="reader-header">
      <div class="file-meta">
        <span class="mdi mdi-file-pdf-box file-icon"></span>
        <h3>{{ fileName }}</h3>
        <span class="paper-badge">学术文献</span>
      </div>
      <div class="ai-toolbar">
        <button class="ai-btn" @click="emit('ai-action', 'summarize')">
          <span class="mdi mdi-text-box-search-outline"></span> 智能精读
        </button>
        <button class="ai-btn" @click="emit('ai-action', 'translate')">
          <span class="mdi mdi-translate"></span> 选区翻译
        </button>
        <button class="ai-btn" @click="emit('ai-action', 'extract')">
          <span class="mdi mdi-flask-outline"></span> 提取图表/公式
        </button>
      </div>
    </div>

    <div class="reader-body">
      <!-- 纯前端最佳实践：利用原生 iframe 加载 PDF，依赖浏览器内置的高效渲染器 -->
      <iframe 
        class="pdf-frame" 
        :src="pdfUrl" 
        title="PDF Viewer"
        frameborder="0"
      ></iframe>
      
      <!-- 如果没有传入真实 PDF 路径，展示一个优雅的占位蒙层 -->
      <div class="placeholder-overlay" v-if="!pdfUrl">
        <span class="mdi mdi-file-pdf-box placeholder-icon"></span>
        <p>浏览器原生 PDF 渲染引擎已就绪</p>
        <span class="sub-text">在正式环境中，这里将直接渲染二进制 PDF 流或对象 URL</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @vibe-intent 纯前端科研文献（PDF）阅读器面板。采用浏览器原生 iframe 引擎保障渲染性能，并前置包裹了 AI 伴读工具链的 UI 骨架。
 * @vibe-model Gemini 3.1 Pro (High)
 * @vibe-ref intents.md#2026-04-30
 */
import { computed } from 'vue'

const props = defineProps({
  fileName: {
    type: String,
    default: '未命名文献.pdf'
  },
  fileUrl: {
    type: String,
    default: ''
  }
})


const emit = defineEmits<{
  'ai-action': [action: string]
}>()

// 为了防止开发环境跨域或 404，如果未提供 url 则使用空
const pdfUrl = computed(() => {
  return props.fileUrl || '' 
})
</script>

<style scoped lang="scss">
.pdf-reader {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  padding: 1.5rem;
  overflow: hidden;
  height: 100%;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-shrink: 0;

  .file-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .file-icon {
      font-size: 1.5rem;
      color: #ef4444; /* PDF 经典红 */
    }

    h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-primary);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .paper-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-radius: 4px;
      font-weight: 500;
    }
  }

  .ai-toolbar {
    display: flex;
    gap: 0.5rem;

    .ai-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.8rem;
      border-radius: 6px;
      background: linear-gradient(145deg, var(--bg-secondary), var(--bg-tertiary));
      border: 1px solid var(--border-color);
      color: var(--color-primary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      .mdi {
        font-size: 1rem;
      }

      &:hover {
        transform: translateY(-1px);
        border-color: var(--color-primary);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }
    }
  }
}

.reader-body {
  flex: 1;
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background-color: #525659; /* 经典 PDF 浏览器背景色 */
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);

  .pdf-frame {
    width: 100%;
    height: 100%;
    display: block;
    background-color: transparent;
  }

  .placeholder-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    color: var(--text-primary);
    text-align: center;
    
    .placeholder-icon {
      font-size: 4rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    p {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .sub-text {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
  }
}
</style>
