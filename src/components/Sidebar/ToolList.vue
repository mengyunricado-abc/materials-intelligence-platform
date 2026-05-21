<template>
  <!--
   * @vibe-intent 工具箱侧边栏面板，仅展示 subscribed=true 的已订阅工具，
   * 底部固定"查看全部工具"入口跳转至工具大厅页。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="tool-list-container">
    <div class="list-header">
      <h3>已订阅工具</h3>
      <span class="badge">{{ subscribedTools.length }}</span>
    </div>

    <!-- 已订阅工具列表 -->
    <div class="tools-grid" v-if="subscribedTools.length > 0">
      <div
        v-for="tool in subscribedTools"
        :key="tool.id"
        class="tool-card"
        @click="openToolTab(tool.id)"
      >
        <div class="tool-icon-wrap">
          <span class="mdi" :class="tool.icon"></span>
        </div>
        <div class="tool-info">
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.description }}</div>
        </div>
      </div>
    </div>

    <!-- 空状态：无订阅 -->
    <div class="empty-hint" v-else>
      <span class="mdi mdi-toolbox-outline"></span>
      <p>暂未订阅任何工具</p>
    </div>

    <!-- 底部固定：查看全部工具 -->
    <div class="view-all-entry" @click="goToGallery">
      <span class="mdi mdi-view-grid-outline"></span>
      <span>查看全部工具</span>
      <span class="mdi mdi-chevron-right"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { toolRegistry } from '@/utils/toolsRegistry'
import { useTabs } from '@/composables/useTabs'

const router = useRouter()
const { openToolTab } = useTabs()

/** 仅展示已订阅工具 */
const subscribedTools = computed(() => toolRegistry.filter(t => t.subscribed))

const goToGallery = () => {
  router.push('/tools')
}
</script>

<style scoped lang="scss">
.tool-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.list-header {
  padding: 0.75rem 1rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .badge {
    background: rgba(59, 130, 246, 0.1);
    color: var(--color-primary);
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.5rem;
    border-radius: 10px;
  }
}

/* ---- 工具卡片列表 ---- */
.tools-grid {
  flex: 1;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    background-color: var(--card-bg-hover);
    border-color: var(--border-focus);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .tool-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    font-size: 1.2rem;
    flex-shrink: 0;
    color: var(--color-primary);
  }

  .tool-info {
    flex: 1;
    min-width: 0;

    .tool-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.15rem;
    }

    .tool-desc {
      font-size: 0.72rem;
      color: var(--text-secondary);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

/* ---- 空状态 ---- */
.empty-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  opacity: 0.6;
  padding: 2rem;

  .mdi { font-size: 2.5rem; }
  p { margin: 0; }
}

/* ---- 底部固定：查看全部工具 ---- */
.view-all-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  margin: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.06);
  border: 1px dashed rgba(59, 130, 246, 0.3);
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .mdi:last-child {
    margin-left: auto;
  }
}
</style>
