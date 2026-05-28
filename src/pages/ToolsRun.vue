<template>
  <!--
   * @vibe-intent 工具专属运行大空间（/tools/run），阶段五第二轮重构：
   * 1. 彻底解耦文档与工具，本页面以大屏单态渲染工具，无 Tab 选项卡头部；
   * 2. 右侧 AI 助手默认折叠收起，展开时自动加载/创建该工具专属对话会话；
   * 3. 剥离 ContextBar，仅保留聊天气泡和输入框，隔离知识库。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-28
  -->
  <div class="tools-run-layout">
    <!-- ======== 中间大工具运行区 ======== -->
    <main class="tool-main-space">
      <header class="tool-space-header">
        <div class="tool-title-info">
          <span class="mdi tool-header-icon" :class="[currentTool?.icon, currentTool?.iconClass]"></span>
          <h2>{{ currentTool?.name || '未知工具' }}</h2>
          <span class="tool-badge">
            <span class="mdi mdi-checkbox-marked-circle-outline"></span> 已订阅
          </span>
        </div>
        <div class="tool-actions">
          <button class="action-btn" @click="goBackToGallery"><span class="mdi mdi-arrow-left"></span> 返回大厅</button>
        </div>
      </header>

      <div class="tool-content-space">
        <div class="tool-render-wrap" v-if="currentTool">
          <component :is="getToolComponent(currentTool.id)" />
        </div>
        <div class="empty-tool-state" v-else>
          <span class="mdi mdi-alert-circle-outline"></span>
          <p>加载工具组件失败，未找到该工具配置</p>
        </div>
      </div>
    </main>

    <!-- ======== 右侧 AI 助手 (默认折叠) ======== -->
    <aside class="copilot" :class="{ collapsed: isCopilotCollapsed }">
      <div class="copilot-header">
        <div class="header-title">
          <span class="mdi mdi-robot-outline"></span>
          <span v-show="!isCopilotCollapsed">AI 助手</span>
        </div>
        <div class="header-actions" v-show="!isCopilotCollapsed">
          <button class="icon-btn" @click="createToolSession" title="开启新对话">
            <span class="mdi mdi-plus"></span>
          </button>
          <button class="icon-btn" @click="isCopilotCollapsed = !isCopilotCollapsed">
            <span class="mdi mdi-chevron-right"></span>
          </button>
        </div>
        <button class="icon-btn" v-show="isCopilotCollapsed" @click="isCopilotCollapsed = !isCopilotCollapsed">
          <span class="mdi mdi-chevron-left"></span>
        </button>
      </div>

      <!-- 最近会话胶囊标签栏 (仅展示当前工具专属的) -->
      <div class="recent-sessions-bar" v-show="!isCopilotCollapsed">
        <div
          v-for="session in recentSessions"
          :key="session.id"
          class="session-capsule"
          :class="{ active: session.id === activeSessionId }"
          @click="workspaceStore.switchSession(session.id)"
        >
          <span class="mdi mdi-chat-outline"></span>
          <span class="session-title">{{ session.title || '新对话' }}</span>
          <span class="mdi mdi-close-circle close-session-icon" @click.stop="workspaceStore.hideSessionFromRecent(session.id)"></span>
        </div>
      </div>

      <div class="chat-container" v-show="!isCopilotCollapsed">
        <ChatMessages
          :messages="messages"
          :is-thinking="isThinking"
          @preview-diff="handlePreviewDiff"
        />
        <ChatInput
          :available-files="allFiles"
          :available-commands="commands"
          @send="handleSend"
        />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../stores/workspace'

import ChatMessages from '../components/Copilot/ChatMessages.vue'
import ChatInput from '../components/Copilot/ChatInput.vue'

import { toolRegistry } from '../utils/toolsRegistry'
import type { Command } from '../types/index'

const route = useRoute()
const router = useRouter()

const workspaceStore = useWorkspaceStore()
const { messages, sessions, activeSessionId, allFiles } = storeToRefs(workspaceStore)

const isCopilotCollapsed = ref(true) // 对标 T2: 使用工具时默认是不展开 AI 助手的
const isThinking = ref(false)

const toolId = computed(() => route.query.toolId as string || '')

const currentTool = computed(() => {
  return toolRegistry.find(t => t.id === toolId.value)
})

const getToolComponent = (id: string) => {
  const tool = toolRegistry.find(t => t.id === id)
  return tool && tool.component ? markRaw(tool.component) : null
}

const goBackToGallery = () => {
  router.push('/tools')
}

// 过滤当前工具专属会话
const recentSessions = computed(() => {
  return sessions.value.filter(s => 
    s.type === 'tool-edit' && 
    s.fileId === toolId.value && 
    !s.hiddenInRecent
  ).slice(0, 3)
})

// 监听工具切换以装载专属工具会话
watch(toolId, (newToolId) => {
  if (newToolId) {
    const tool = toolRegistry.find(t => t.id === newToolId)
    workspaceStore.loadOrCreateToolSession(newToolId, tool?.name)
  }
}, { immediate: true })

const createToolSession = () => {
  if (toolId.value) {
    workspaceStore.createSession('tool-edit', toolId.value)
  } else {
    workspaceStore.createSession('qa')
  }
}

const commands: Command[] = [
  { id: 'format', title: '/format', icon: 'mdi-format-align-left', desc: '格式化分析' },
  { id: 'export', title: '/export', icon: 'mdi-export',            desc: '导出工具结果' }
]

const handlePreviewDiff = () => {
  // 工具类一般不做 Diff editor 反射，留作以后功能扩展
}

const handleSend = (message: string) => {
  workspaceStore.addMessage({ role: 'user', content: message })

  isThinking.value = true
  setTimeout(() => {
    isThinking.value = false
    workspaceStore.addMessage({
      role: 'ai',
      content: `收到针对工具《${currentTool.value?.name}》的指令。我已经分析了当前计算状态，正在为您生成实时响应...`
    })
  }, 1500)
}
</script>

<style scoped lang="scss">
.tools-run-layout {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* --- 中间大工具运行区 --- */
.tool-main-space {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tool-space-header {
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  flex-shrink: 0;

  .tool-title-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .tool-header-icon {
      font-size: 1.3rem;
    }

    h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .tool-badge {
      font-size: 0.72rem;
      color: var(--color-success);
      background-color: rgba(16, 185, 129, 0.1);
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }

  .tool-actions {
    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: var(--bg-secondary);
        transform: translateY(-1px);
      }
    }
  }
}

.tool-content-space {
  flex: 1;
  overflow: hidden;
  background-color: var(--bg-secondary);
  display: flex;
}

.tool-render-wrap {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
  box-sizing: border-box;
}

.empty-tool-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.65;

  .mdi {
    font-size: 3rem;
  }
  p {
    margin: 0;
    font-size: 0.9rem;
  }
}

/* --- 右侧 AI 助手 --- */
.copilot {
  width: 380px;
  background-color: var(--glass-bg);
  backdrop-filter: blur(12px);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  &.collapsed { width: 50px; }
}

.copilot-header {
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
  display: flex;
  align-items: center;
  font-size: 1rem;
  &:hover { color: var(--text-primary); background-color: var(--bg-secondary); }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.recent-sessions-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  .session-capsule {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    .session-title { max-width: 80px; overflow: hidden; text-overflow: ellipsis; }

    .close-session-icon {
      font-size: 0.85rem;
      opacity: 0;
      transition: opacity 0.2s;
      &:hover { color: #ef4444; }
    }

    &:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      .close-session-icon { opacity: 0.6; }
    }

    &.active {
      background-color: rgba(59, 130, 246, 0.15);
      color: var(--color-primary);
      border-color: rgba(59, 130, 246, 0.4);
      .close-session-icon { opacity: 0.6; }
    }
  }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
</style>
