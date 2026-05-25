<template>
  <!--
   * @vibe-intent 手风琴式历史对话列表，嵌入全局侧边栏。
   * 超过 max-height 时底部显示"查看全部"跳转入口，避免导航栏无限滚动。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="history-accordion">
    <div class="accordion-header" @click="emit('toggle')">
      <div class="header-left">
        <span class="mdi mdi-history nav-icon"></span>
        <span class="header-label" v-show="!isCollapsed">历史对话</span>
      </div>
      <span
        v-show="!isCollapsed"
        class="mdi chevron"
        :class="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
      ></span>
    </div>

    <transition name="accordion">
      <div class="accordion-body" v-show="isOpen && !isCollapsed">
        <div class="session-list" ref="listRef">
          <div
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === activeSessionId }"
            @click="handleSelect(session.id)"
          >
            <span class="mdi mdi-chat-outline session-icon"></span>
            <div class="session-info">
              <div class="session-title">{{ session.title || '新对话' }}</div>
              <div class="session-preview">{{ session.preview }}</div>
            </div>
            <button
              class="del-btn"
              @click.stop="workspaceStore.deleteSession(session.id)"
              title="删除"
            >
              <span class="mdi mdi-close"></span>
            </button>
          </div>
        </div>

        <!-- 溢出时的跳转提示 -->
        <div class="view-all-btn" @click="goToHistory">
          <span class="mdi mdi-clock-outline"></span>
          <span>查看全部历史对话</span>
          <span class="mdi mdi-chevron-right"></span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../../stores/workspace'

defineProps<{
  isOpen: boolean
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  'toggle': []
  'select': [id: string]
}>()

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const { sessions, activeSessionId } = storeToRefs(workspaceStore)
const handleSelect = (id: string) => {
  workspaceStore.switchSession(id)
  emit('select', id)
}

const goToHistory = () => {
  router.push('/history')
}
</script>

<style scoped lang="scss">
.history-accordion {
  border-bottom: 1px solid var(--border-color);
}

/* --- 手风琴触发头部 --- */
.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  margin: 0.25rem 0.5rem;
  transition: background-color 0.2s;
  user-select: none;

  &:hover {
    background-color: var(--bg-secondary);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .nav-icon {
    font-size: 1.1rem;
    color: var(--text-secondary);
    width: 20px;
    text-align: center;
  }

  .header-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chevron {
    font-size: 0.9rem;
    color: var(--text-secondary);
    transition: transform 0.25s;
  }
}

/* --- 手风琴展开内容 --- */
.accordion-body {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 过渡动画 */
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
  max-height: 320px;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 列表容器：设置最大高度触发溢出 */
.session-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 0.25rem 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background-color: var(--border-color); border-radius: 2px; }
}

.session-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-secondary);

    .del-btn { opacity: 1; }
  }

  &.active {
    background-color: rgba(59, 130, 246, 0.1);

    .session-title { color: var(--color-primary); }
    .session-icon { color: var(--color-primary); }
  }
}

.session-icon {
  font-size: 0.9rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.session-preview {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.del-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.15rem 0.25rem;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &:hover { color: #ef4444; }
}

/* --- 查看全部按钮 --- */
.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  margin: 0.25rem 0.5rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.06);
  border: 1px dashed rgba(59, 130, 246, 0.25);
  transition: all 0.2s;

  &:hover {
    background-color: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .mdi:last-child {
    margin-left: auto;
    font-size: 0.9rem;
  }
}
</style>
