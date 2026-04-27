<template>
  <!--
   * @vibe-intent 顶部"已引用"上下文状态条，展示当前 AI 的注意力范围，支持点击移除单个引用。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="context-bar" v-if="references.length > 0">
    <span class="context-label">
      <span class="mdi mdi-brain"></span>
      已引用:
    </span>
    <div class="chips">
      <span
        v-for="ref in references"
        :key="ref.id"
        class="context-chip"
      >
        <span class="mdi" :class="[ref.icon, ref.iconClass]"></span>
        <span class="chip-name">{{ ref.name }}</span>
        <button class="remove-btn" title="移除引用" @click="emit('remove-ref', ref.id)">
          <span class="mdi mdi-close"></span>
        </button>
      </span>
    </div>
  </div>
  <div class="context-bar empty" v-else>
    <span class="mdi mdi-information-outline"></span>
    <span>在对话框中输入 @ 以引用文件</span>
  </div>
</template>

<script setup lang="ts">
import type { FileItem } from '../../types/index'

defineProps<{
  references: FileItem[]
}>()

const emit = defineEmits<{
  'remove-ref': [id: string]
}>()
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

  .mdi.text-danger { color: var(--color-danger); }
  .mdi.text-success { color: var(--color-success); }
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
  color: var(--color-primary);
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
