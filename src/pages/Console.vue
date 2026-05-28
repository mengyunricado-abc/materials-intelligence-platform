<template>
  <div class="console-workspace">
    <div class="editor-container">
      <!-- 编辑锁遮罩层 (方案 B：视觉拦截) -->
      <div class="editor-lock-mask" v-if="workspaceStore.isEditorLocked && !isDiffMode">
        <div class="lock-content">
          <span class="mdi mdi-lock-outline lock-icon"></span>
          <p>AI 正在起草修改建议，文档暂时锁定...</p>
        </div>
      </div>
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
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../stores/workspace'
import CodeEditor from '../components/Editor/CodeEditor.vue'

/**
 * @vibe-intent 控制台中间文档编辑区，已重构为接入 Pinia 状态管理，支持所见即所得修改及 Diff 预览。
 * @vibe-model Gemini 3 Flash
 * @vibe-ref intents.md#2026-04-28
 */
/**
 * @vibe-intent 中间文档编辑容器，去除了冗余的 AI 润色测试按钮，转为完全由右侧 Copilot 卡片触发 Diff 演示
 * @vibe-model Antigravity
 * @vibe-ref intents.md#2026-05-28
 */
const workspaceStore = useWorkspaceStore()
const { 
  activeDocument: documentContent, 
  isDiffMode, 
  originalContent: originalDocumentSnapshot 
} = storeToRefs(workspaceStore)

const onAcceptDiff = () => {
  workspaceStore.applyDiff(true)
}

const onRejectDiff = () => {
  workspaceStore.applyDiff(false)
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
  position: relative;
}

.editor-lock-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  animation: fadeIn 0.25s ease-out;

  .lock-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--text-primary);

    .lock-icon {
      font-size: 2.5rem;
      color: var(--color-primary);
      animation: pulse 2s infinite;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 500;
      opacity: 0.9;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

</style>

