<template>
  <!--
   * @vibe-intent 左侧图标导航条，提取自 ConsoleLayout.vue，职责单一：Tab 切换与折叠触发。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="sidebar-nav">
    <button class="nav-btn primary" title="新对话" @click="emit('new-chat')">
      <span class="mdi mdi-plus"></span>
    </button>

    <div class="nav-divider"></div>

    <button
      class="nav-btn"
      :class="{ active: activeTab === 'files' }"
      title="文件"
      @click="emit('tab-change', 'files')"
    >
      <span class="mdi mdi-folder-outline"></span>
    </button>
    <button
      class="nav-btn"
      :class="{ active: activeTab === 'history' }"
      title="历史"
      @click="emit('tab-change', 'history')"
    >
      <span class="mdi mdi-history"></span>
    </button>
    <button
      class="nav-btn"
      :class="{ active: activeTab === 'tools' }"
      title="工具"
      @click="emit('tab-change', 'tools')"
    >
      <span class="mdi mdi-hammer-wrench"></span>
    </button>

    <div class="spacer"></div>

    <button class="nav-btn" :title="isCollapsed ? '展开侧栏' : '折叠侧栏'" @click="emit('collapse')">
      <span class="mdi" :class="isCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"></span>
    </button>
    <button class="nav-btn" title="返回首页" @click="emit('go-home')">
      <span class="mdi mdi-home-outline"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: string
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  'tab-change': [tab: string]
  'collapse': []
  'go-home': []
  'new-chat': []
}>()
</script>

<style scoped lang="scss">
.sidebar-nav {
  width: 60px;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  border-right: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-tertiary);
  }

  &.active {
    color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.1);
  }

  &.primary {
    color: var(--color-primary);
    border: 1px dashed var(--color-primary);
  }
}

.nav-divider {
  width: 24px;
  height: 1px;
  background-color: var(--border-color);
  margin: 0.5rem 0 1rem;
}

.spacer {
  flex: 1;
}
</style>
