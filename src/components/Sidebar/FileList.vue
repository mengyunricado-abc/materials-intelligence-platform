<template>
  <!--
   * @vibe-intent 文件树组件，支持多选复选框（上下文引用）与单击选中（打开文件）。
   * 多选状态通过 refs-change emit 向上传递，为阶段四的 @ 引用多文件做好接口准备。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="file-list">
    <div class="panel-header">
      <h3>项目文件</h3>
      <button class="icon-btn" title="上传文件" @click="emit('file-upload')">
        <span class="mdi mdi-cloud-upload-outline"></span>
      </button>
    </div>

    <div class="file-tree">
      <div
        v-for="file in files"
        :key="file.id"
        class="file-item"
        :class="{ selected: selectedIds.includes(file.id) }"
        @click="handleFileClick(file)"
      >
        <!-- 复选框：勾选表示加入 AI 上下文引用，与"打开文件"解耦 -->
        <input
          type="checkbox"
          class="file-checkbox"
          :checked="selectedIds.includes(file.id)"
          @change.stop="toggleSelect(file)"
          @click.stop
        />
        <span class="mdi file-icon" :class="[file.icon, file.iconClass]"></span>
        <span class="file-name">{{ file.name }}</span>
      </div>

      <div class="upload-hint" v-if="files.length === 0">
        <span class="mdi mdi-inbox-outline"></span>
        <span>暂无文件，点击上方上传</span>
      </div>
    </div>

    <div class="file-footer" v-if="selectedIds.length > 0">
      <span class="mdi mdi-check-circle-outline"></span>
      已选 {{ selectedIds.length }} 个文件加入 AI 上下文
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../../stores/workspace'
import type { FileItem } from '../../types/index'

/**
 * @vibe-intent 文件树组件，已接入 Pinia store，打通勾选多文件加入 AI 上下文的全局联动逻辑。
 * @vibe-model Gemini 3 Flash
 * @vibe-ref intents.md#2026-04-28
 */
const emit = defineEmits<{
  'file-select': [file: FileItem]
  'file-upload': []
}>()

const workspaceStore = useWorkspaceStore()
const { files, selectedFileIds: selectedIds } = storeToRefs(workspaceStore)

const toggleSelect = (file: FileItem) => {
  workspaceStore.toggleFileSelection(file.id)
}

const handleFileClick = (file: FileItem) => {
  emit('file-select', file)
}
</script>


<style scoped lang="scss">
.file-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 1rem;
  display: flex;
  align-items: center;

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
}

.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: background 0.2s;
  user-select: none;

  &:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);

    .file-checkbox {
      opacity: 1;
    }
  }

  &.selected {
    background-color: rgba(59, 130, 246, 0.08);
    color: var(--text-primary);

    .file-checkbox {
      opacity: 1;
    }
  }
}

.file-checkbox {
  opacity: 0;
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
  transition: opacity 0.15s;

  &:checked {
    opacity: 1;
  }
}

.file-icon {
  font-size: 1rem;
  flex-shrink: 0;

  &.text-danger { color: var(--color-danger); }
  &.text-success { color: var(--color-success); }
  &.text-warning { color: var(--color-warning, #f59e0b); }
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  opacity: 0.6;

  .mdi { font-size: 2rem; }
}

.file-footer {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--color-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
