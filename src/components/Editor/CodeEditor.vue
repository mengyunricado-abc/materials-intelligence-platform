<template>
  <!--
   * @vibe-intent 基于 Monaco Editor 封装的极简科学文本编辑器，包含差异比对（Diff）审批模式。
   * @vibe-model Gemini 3.1 Pro (High)
   * @vibe-ref intents.md#2026-04-15
  -->
  <div class="editor-wrapper">
    <div v-if="isDiffMode" class="diff-editor-container">
      <vue-monaco-diff-editor
        :original="originalContent"
        :modified="modifiedContent"
        :language="language"
        :theme="isDark ? 'vs-dark' : 'vs'"
        :options="diffOptions"
        @mount="handleDiffMount"
      />
    </div>
    <div v-else class="standard-editor-container">
      <vue-monaco-editor
        v-model:value="computedContent"
        :language="language"
        :theme="isDark ? 'vs-dark' : 'vs'"
        :options="editorOptions"
        @mount="handleMount"
      />
    </div>
    
    <!-- Action overlay for Diff Mode -->
    <div v-if="isDiffMode" class="diff-actions">
      <button class="diff-btn bg-success" @click="acceptDiff">
        <span class="mdi mdi-check"></span> 接受修改
      </button>
      <button class="diff-btn bg-danger" @click="rejectDiff">
        <span class="mdi mdi-close"></span> 拒绝修改
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watch, onMounted } from 'vue'
import { VueMonacoEditor, VueMonacoDiffEditor } from '@guolao/vue-monaco-editor'

const props = defineProps({
  modelValue: { type: String, default: '' },
  isDiffMode: { type: Boolean, default: false },
  originalContent: { type: String, default: '' },
  language: { type: String, default: 'markdown' }
})

const emit = defineEmits(['update:modelValue', 'accept-diff', 'reject-diff'])

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')

// Handle theme changes
onMounted(() => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
      }
    })
  })
  observer.observe(document.documentElement, { attributes: true })
})

const computedContent = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const modifiedContent = computed(() => props.modelValue)

const editorRef = shallowRef()
const diffEditorRef = shallowRef()

const editorOptions = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  wordWrap: 'on',
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 3,
  padding: { top: 16, bottom: 16 }
}

const diffOptions = {
  ...editorOptions,
  readOnly: true, // Typically, diff views are read-only until accepted/rejected
  renderSideBySide: true,
  enableSplitViewResizing: true
}

const handleMount = (editor: any) => {
  editorRef.value = editor
}

const handleDiffMount = (diffEditor: any) => {
  diffEditorRef.value = diffEditor
}

const acceptDiff = () => {
  emit('accept-diff')
}

const rejectDiff = () => {
  emit('reject-diff')
}
</script>

<style scoped lang="scss">
.editor-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.standard-editor-container, .diff-editor-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

.diff-actions {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 10;
  background-color: var(--bg-tertiary);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  
  .diff-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    border: none;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &.bg-success {
      background-color: var(--color-success);
    }
    
    &.bg-danger {
      background-color: var(--color-danger);
    }
  }
}
</style>
