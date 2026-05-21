<template>
  <!--
   * @vibe-intent Word 文档查看器，基于 mammoth.js 将 .docx 转换为 HTML 并渲染，
   * 支持拖拽上传真实 Word 文件，初始化时展示文件名占位界面。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="word-viewer">
    <!-- 未加载文件时：拖拽上传区 -->
    <div
      v-if="!htmlContent && !isLoading"
      class="drop-zone"
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input ref="fileInputRef" type="file" accept=".docx,.doc" class="hidden-input" @change="handleFileChange" />
      <div class="drop-icon">
        <span class="mdi mdi-file-word"></span>
      </div>
      <p class="drop-title">{{ fileName || '打开 Word 文档' }}</p>
      <p class="drop-hint">点击或拖拽 .docx / .doc 文件到此处</p>
      <button class="upload-btn" @click.stop="triggerFileInput">
        <span class="mdi mdi-upload"></span>
        选择文件
      </button>
    </div>

    <!-- 加载动画 -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>正在解析文档...</p>
    </div>

    <!-- 渲染结果 -->
    <div v-if="htmlContent && !isLoading" class="doc-container">
      <div class="doc-toolbar">
        <div class="doc-meta">
          <span class="mdi mdi-file-word doc-icon"></span>
          <span class="doc-name">{{ loadedFileName }}</span>
        </div>
        <button class="toolbar-btn" @click="resetViewer" title="重新加载文件">
          <span class="mdi mdi-file-replace-outline"></span>
          更换文件
        </button>
      </div>
      <div class="doc-content-wrapper">
        <div class="doc-paper" v-html="htmlContent"></div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="error-toast">
      <span class="mdi mdi-alert-circle-outline"></span>
      {{ errorMsg }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import mammoth from 'mammoth'

const props = defineProps<{
  fileName?: string
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const htmlContent = ref('')
const isLoading = ref(false)
const isDragging = ref(false)
const errorMsg = ref('')
const loadedFileName = ref('')

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const processFile = async (file: File) => {
  if (!file.name.match(/\.(docx|doc)$/i)) {
    errorMsg.value = '仅支持 .docx 或 .doc 格式的 Word 文件'
    setTimeout(() => (errorMsg.value = ''), 3000)
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    htmlContent.value = result.value
    loadedFileName.value = file.name
  } catch (e) {
    errorMsg.value = '文档解析失败，请确认文件未损坏'
    console.error('mammoth error:', e)
  } finally {
    isLoading.value = false
    isDragging.value = false
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

const resetViewer = () => {
  htmlContent.value = ''
  loadedFileName.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<style scoped lang="scss">
.word-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* ---- 拖拽上传区 ---- */
.drop-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  margin: 2rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  background-color: var(--bg-primary);

  &.dragging {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.05);
    transform: scale(1.01);
  }

  &:hover {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.03);
  }
}

.hidden-input {
  display: none;
}

.drop-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb22, #2563eb44);
  border: 1px solid rgba(37, 99, 235, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;

  .mdi {
    font-size: 2.5rem;
    color: var(--color-primary);
  }
}

.drop-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.drop-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.5rem;
  transition: background-color 0.2s;

  &:hover { background-color: var(--color-primary-hover); }
}

/* ---- 加载动画 ---- */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ---- 文档内容区 ---- */
.doc-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.doc-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  background-color: var(--bg-primary);

  .doc-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .doc-icon {
      font-size: 1.2rem;
      color: #2563eb;
    }

    .doc-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }
}

.doc-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background-color: var(--bg-secondary);
}

.doc-paper {
  max-width: 860px;
  margin: 0 auto;
  padding: 3rem 4rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  line-height: 1.8;
  color: #1a1a2e;
  font-family: 'Times New Roman', serif;

  /* mammoth 生成的 HTML 样式 */
  :deep(h1) { font-size: 1.8rem; font-weight: 700; margin: 1.5rem 0 1rem; }
  :deep(h2) { font-size: 1.4rem; font-weight: 600; margin: 1.2rem 0 0.75rem; }
  :deep(h3) { font-size: 1.15rem; font-weight: 600; margin: 1rem 0 0.5rem; }
  :deep(p) { margin: 0.6rem 0; }
  :deep(table) { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  :deep(td, th) { border: 1px solid #ccc; padding: 0.5rem 0.75rem; }
  :deep(th) { background-color: #f5f5f5; font-weight: 600; }
  :deep(ul, ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
  :deep(strong) { font-weight: 700; }
  :deep(em) { font-style: italic; }
}

/* ---- 错误提示 ---- */
.error-toast {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  font-size: 0.85rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
