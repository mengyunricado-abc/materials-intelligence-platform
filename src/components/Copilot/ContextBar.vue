<template>
  <!--
   * @vibe-intent 顶部"已引用"上下文状态条，升级支持 ContextRef 接口（可显示项目级引用）。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="context-bar" v-if="contextRefs.length > 0">
    <span class="context-label">
      <span class="mdi mdi-brain"></span>
      已挂载:
    </span>
    <div class="chips">
      <span
        v-for="ref in contextRefs"
        :key="ref.id + ref.type"
        class="context-chip"
        :class="{ 'is-project': ref.type === 'project' }"
      >
        <span class="mdi" :class="ref.icon"></span>
        <span class="chip-name">{{ ref.name }}</span>
        <button class="remove-btn" title="移除引用" @click="workspaceStore.removeContextRef(ref.id)">
          <span class="mdi mdi-close"></span>
        </button>
      </span>
    </div>
  </div>
  <div class="context-bar empty" v-else>
    <span class="mdi mdi-information-outline"></span>
    <span>在对话框中输入 @ 引用文件，或在文件树中勾选项目</span>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../../stores/workspace'

const workspaceStore = useWorkspaceStore()
const { contextRefs } = storeToRefs(workspaceStore)
</script>

<style scoped lang="scss">
.context-bar {
  padding: 0.5rem 1rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  flex-shrink: 0;
  flex-wrap: wrap;
  min-height: 40px;

  &.empty {
    color: var(--text-secondary);
    opacity: 0.6;
    gap: 0.4rem;
    .mdi { font-size: 0.9rem; }
  }
}

.context-label {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  flex-shrink: 0;
  .mdi { font-size: 0.9rem; }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.context-chip {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 0.15rem 0.3rem 0.15rem 0.5rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-primary);
  font-size: 0.75rem;

  /* 项目级引用：金色 */
  &.is-project {
    background-color: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
    color: #d97706;
    .mdi { color: #f59e0b; }
  }
}

.chip-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.15s;
  .mdi { font-size: 0.75rem; }
  &:hover { opacity: 1; }
}
</style>
