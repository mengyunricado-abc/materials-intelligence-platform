<template>
  <div class="console-workspace">
    <div class="editor-actions" v-if="!isDiffMode">
      <button class="action-btn" @click="simulateAiEdit">
        <span class="mdi mdi-auto-fix"></span> AI 润色模拟
      </button>
    </div>
    
    <div class="editor-container">
      <CodeEditor 
        v-model="documentContent"
        :isDiffMode="isDiffMode"
        :originalContent="originalDocumentSnapshot"
        language="markdown"
        @accept-diff="onAcceptDiff"
        @reject-diff="onRejectDiff"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CodeEditor from '../components/Editor/CodeEditor.vue'
import { eventBus } from '../utils/eventBus'

// Base document content
const documentContent = ref(`# 材料智慧平台测试文档

这是在材料智慧平台中创建的测试段落。此平台集成了 AI 辅助能力，旨在提供一种无缝且沉浸式的科研和文档编辑体验。

## 待优化的段落
由于时间仓促，本段内容显得比较口语化，不够专业。我们需要一种机制，将口语化的文字转化为学术标准的文本描述。平台未来也许可以自动识别这里的文本特征。
`)

const isDiffMode = ref(false)
const originalDocumentSnapshot = ref('')

const handleDiffTrigger = (data: any) => {
  originalDocumentSnapshot.value = documentContent.value
  documentContent.value = data.modified
  isDiffMode.value = true
}

onMounted(() => {
  eventBus.on('TRIGGER_DIFF_MODE', handleDiffTrigger)
})

onUnmounted(() => {
  eventBus.off('TRIGGER_DIFF_MODE', handleDiffTrigger)
})

const simulateAiEdit = () => {
  // Save snapshot for old version
  originalDocumentSnapshot.value = documentContent.value
  
  // Create simulated new version
  documentContent.value = `# 材料智慧平台初步需求文档

本文档概述了材料智慧平台的核心架构与设计理念。本系统在设计层面深度解耦了 AI 辅助模块与传统文档编辑工作流，旨在构建流畅、安全的次世代科研终端。

## 待优化的段落
受限于早期原型的开发周期，本节的文本表达尚未达到正式学术出版的标准。本阶段的研发重点在于建立一套可扩展的模型驱动机制，确保用户口语化指令能够转化为标准化的学术文案输出。
`
  
  // Enter diff mode
  isDiffMode.value = true
}

const onAcceptDiff = () => {
  // Keep the new content, exit diff mode
  isDiffMode.value = false
}

const onRejectDiff = () => {
  // Restore the old content, exit diff mode
  documentContent.value = originalDocumentSnapshot.value
  isDiffMode.value = false
}
</script>

<style scoped lang="scss">
.console-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  height: 100%;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--color-primary);
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--color-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--color-primary);
      color: white;
    }
  }
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

