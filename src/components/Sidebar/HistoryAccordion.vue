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
            v-for="session in displaySessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === activeSessionId }"
            @click="handleSelect(session)"
          >
            <!-- @vibe-intent 零视觉噪音：彻底移除对话气泡图标与预览副文本，纯字排版对齐 -->
            <div class="session-title">{{ session.title || '新对话' }}</div>
            <button
              class="del-btn"
              @click.stop="workspaceStore.hideSessionFromRecent(session.id)"
              title="隐藏"
            >
              <span class="mdi mdi-close"></span>
            </button>
          </div>
        </div>

        <!-- 溢出时的跳转提示 (Bohrium 无框极简平铺化子项式，左端完美对齐) -->
        <div class="view-all-item" @click="goToHistory">
          <span>查看全部</span>
          <span class="mdi mdi-open-in-new view-all-icon"></span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import { useTabs } from '../../composables/useTabs'

const { openFileTab } = useTabs()
const workspaceStore = useWorkspaceStore()
const { sessions, activeSessionId } = storeToRefs(workspaceStore)

// @vibe-intent 固定展示前 5 项，其余项通过“查看全部”跳转管理，从而彻底不使用局部滚动条
const displaySessions = computed(() => sessions.value.filter(s => !s.hiddenInRecent).slice(0, 5))

const handleSelect = (session: any) => {
  workspaceStore.switchSession(session.id)
  if (session.type === 'doc-edit' && session.fileId) {
    const file = workspaceStore.allFiles.find(f => f.id === session.fileId)
    if (file) {
      openFileTab(file)
    }
    router.push('/console')
  } else if (session.type === 'tool-edit' && session.fileId) {
    router.push(`/tools/run?toolId=${session.fileId}`)
  } else if (session.type === 'knowledge') {
    router.push(`/knowledge?sessionId=${session.id}&openChat=true`)
  } else {
    router.push('/chat')
  }
  emit('select', session.id)
}

const goToHistory = () => {
  router.push('/history')
}
</script>

<style scoped lang="scss">
.history-accordion {
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  :root[data-theme='dark'] & {
    border-bottom-color: rgba(255, 255, 255, 0.04);
  }
}

/* --- 手风琴触发头部 --- */
.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  margin: 0.25rem 0; // 去除 0.5rem 的 margin，使之与普通 nav-item 完美对齐
  transition: background-color 0.2s;
  user-select: none;

  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
    :root[data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .nav-icon {
    font-size: 1.1rem;
    color: #64748b;
    width: 20px;
    text-align: center;
    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .header-label {
    font-size: 0.88rem;   
    font-weight: 500;      /* 字重调为 500 */
    color: #475569;
    letter-spacing: 0.02em;

    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.65);
    }
  }

  .chevron {
    font-size: 0.9rem;
    color: #64748b;
    transition: transform 0.25s;
    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.5);
    }
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

/* 列表容器：去除大高度与内部滚动条，前 5 项平铺展示 + 垂直连接引导线 */
.session-list {
  position: relative;
  overflow: hidden; // 完全消除多余滚动条，随父级手风琴直接完全平铺展示
  padding: 0.25rem 0.5rem 0.25rem 0; // 去掉左侧 padding，方便子列表项左侧绝对对齐
  
  /**
   * @vibe-intent 引导线定位在 1.25rem 处，在 1.5rem 的子项缩进左侧构成树状连接线
   * @vibe-model Gemini 3.5 Flash
   * @vibe-ref intents.md#2026-05-28
   */
  &::before {
    content: '';
    position: absolute;
    left: 1.25rem; 
    top: 0.5rem;
    bottom: 0.5rem;
    width: 1px;
    background-color: rgba(15, 23, 42, 0.08);

    :root[data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.06);
    }
  }
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 0.5rem 0 1.5rem; // 左端对齐：相对于父项 0.75rem 提供完美的 1.5rem 阶梯缩进
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 0.15rem;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.45);
    :root[data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.04);
    }
    .del-btn { opacity: 1; }
  }

  &.active {
    background-color: rgba(59, 89, 152, 0.06);
    :root[data-theme='dark'] & {
      background-color: rgba(96, 165, 250, 0.06);
    }

    .session-title { 
      color: #3b5998; 
      font-weight: 500;
      :root[data-theme='dark'] & {
        color: #60a5fa;
      }
    }
  }
}

.session-title {
  font-size: 0.88rem;    /* 字号放大至 0.88rem，与父列表大小绝对一致 */
  font-weight: 400;       
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;

  :root[data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.7);
  }
}

.del-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.15rem;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &:hover { color: #ef4444; }
}

/* --- 查看全部按钮 (Bohrium 同款极简子项平铺式，左侧与列表文字完美对齐) --- */
.view-all-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: 32px;
  padding: 0 0.5rem 0 1.5rem; // 左端对齐：与上方列表项的 1.5rem 完美对齐
  margin-bottom: 0.25rem;
  cursor: pointer;
  font-size: 0.78rem;          /* 查看全部字号 0.78rem，比子列表项的 0.88rem 略小 */
  color: #64748b;
  transition: color 0.15s;

  :root[data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.45);
  }

  &:hover {
    color: #3b5998;
    :root[data-theme='dark'] & {
      color: #60a5fa;
    }
  }

  .view-all-icon {
    font-size: 0.7rem;
    opacity: 0.75;
  }
}
</style>
