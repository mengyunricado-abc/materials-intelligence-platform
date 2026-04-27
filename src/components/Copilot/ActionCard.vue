<template>
  <!--
   * @vibe-intent AI 生成修改建议后展示的可操作卡片，用户点击后触发 Diff 预览流程。
   * 设计上与普通气泡区分，强调"可操作"语义（边框+图标+按钮）。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="action-card">
    <div class="card-icon">
      <span class="mdi mdi-file-compare"></span>
    </div>
    <div class="card-body">
      <div class="card-title">{{ title }}</div>
      <div class="card-desc" v-if="description">{{ description }}</div>
    </div>
    <button class="preview-btn" @click="emit('preview-diff')">
      <span class="mdi mdi-eye-outline"></span>
      预览修改
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()

const emit = defineEmits<{
  'preview-diff': []
}>()
</script>

<style scoped lang="scss">
.action-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-primary);
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 10px;
  margin-left: 44px; // 对齐 AI 气泡的内容起点（头像宽度 + gap）
  transition: background 0.2s;

  &:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }
}

.card-icon {
  color: var(--color-primary);
  font-size: 1.25rem;
  flex-shrink: 0;
  display: flex;
}

.card-body {
  flex: 1;
  overflow: hidden;
}

.card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.preview-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--color-primary);
  background-color: transparent;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: var(--color-primary);
    color: white;
  }
}
</style>
