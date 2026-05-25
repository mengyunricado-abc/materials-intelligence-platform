<template>
  <!--
   * @vibe-intent 三栏控制台：阶段五重构后移除内嵌侧边栏（已提升至 AppLayout 全局常驻），
   * 本组件仅负责 中间编辑区 + 右侧 AI Copilot 的双栏布局与数据流转。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="console-layout">

    <!-- ======== 中间编辑区 ======== -->
    <main class="workspace">
      <TabHeader />
      <header class="workspace-header" v-show="activeTab?.type === 'doc'">
        <div class="doc-info">
          <h2>{{ activeTab?.title || '未命名文档' }}</h2>
          <span class="status-badge">
            <span class="mdi mdi-cloud-check"></span> 已保存
          </span>
        </div>
        <div class="workspace-actions">
          <button class="action-btn"><span class="mdi mdi-eye-outline"></span> 预览</button>
          <button class="action-btn primary"><span class="mdi mdi-export"></span> 导出</button>
        </div>
      </header>
      <div class="workspace-content">
        <!-- 空状态看板 -->
        <div class="empty-state" v-if="!activeTabId">
          <div class="empty-glass-card">
            <div class="brand-logo">
              <span class="mdi mdi-atom-variant floating-icon"></span>
            </div>
            <h2>材料智慧科研空间</h2>
            <p>极致 AI 原生计算终端，助您的学术灵感自由穿梭。</p>
            <div class="quick-actions">
              <button class="quick-btn primary" @click="createNewDoc">
                <span class="mdi mdi-file-plus-outline"></span>
                <span>新建白板文档</span>
              </button>
              <button class="quick-btn" @click="goToTools">
                <span class="mdi mdi-toolbox-outline"></span>
                <span>工具大厅</span>
              </button>
            </div>
            <div class="shortcuts-hint">
              <span>按 <code>@</code> 引入文件引用</span>
              <span class="separator">•</span>
              <span>按 <code>/</code> 触发快捷指令</span>
            </div>
          </div>
        </div>

        <!-- 文档编辑区 (默认常驻) -->
        <div class="tab-pane" v-show="activeTabId === 'doc_default'">
          <router-view />
        </div>

        <!-- Word 文档查看器 -->
        <div class="tab-pane" v-show="isOpenWordTab">
          <WordViewer :fileName="activeTab?.title" />
        </div>

        <!-- Excel 数据查看器（占位） -->
        <div class="tab-pane excel-placeholder" v-show="isOpenExcelTab">
          <div class="placeholder-content">
            <span class="mdi mdi-file-excel" style="font-size: 3rem; color: #10b981;"></span>
            <h3>{{ activeTab?.title }}</h3>
            <p>Excel 数据预览功能即将上线</p>
          </div>
        </div>

        <!-- 工具挂载区 (常驻防卸载) -->
        <div
          v-for="tool in tabs.filter((t: any) => t.type === 'tool')"
          :key="tool.id"
          class="tab-pane"
          v-show="activeTabId === tool.id"
        >
          <component :is="getToolComponent(tool.id)" />
        </div>
      </div>
    </main>

    <!-- ======== 右侧 AI 助手 ======== -->
    <aside class="copilot" :class="{ collapsed: isCopilotCollapsed }">
      <div class="copilot-header">
        <div class="header-title">
          <span class="mdi mdi-robot-outline"></span>
          <span v-show="!isCopilotCollapsed">AI 助手</span>
        </div>
        <div class="header-actions" v-show="!isCopilotCollapsed">
          <button class="icon-btn" @click="workspaceStore.createSession" title="开启新对话">
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

      <!-- 最近会话胶囊标签栏 -->
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
          <span class="mdi mdi-close-circle close-session-icon" @click.stop="workspaceStore.deleteSession(session.id)"></span>
        </div>
      </div>

      <div class="chat-container" v-show="!isCopilotCollapsed">
        <ContextBar />
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
import { ref, computed, markRaw, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../stores/workspace'

import ContextBar from '../components/Copilot/ContextBar.vue'
import ChatMessages from '../components/Copilot/ChatMessages.vue'
import ChatInput from '../components/Copilot/ChatInput.vue'
import TabHeader from '../components/Workspace/TabHeader.vue'
import WordViewer from '../components/Workspace/WordViewer.vue'

import { useTabs } from '../composables/useTabs'
import { toolRegistry } from '../utils/toolsRegistry'
import type { Command } from '../types/index'

const router = useRouter()
const route = useRoute()
const { tabs, activeTabId, activeTab, openToolTab } = useTabs()

const workspaceStore = useWorkspaceStore()
const { messages, sessions, activeSessionId, allFiles } = storeToRefs(workspaceStore)

const isCopilotCollapsed = ref(false)
const isThinking = ref(false)

const recentSessions = computed(() => sessions.value.slice(0, 3))

/** 当前 Tab 是否是 Word 文件 */
const isOpenWordTab = computed(() =>
  activeTab.value &&
  activeTab.value.type === 'doc' &&
  activeTab.value.id !== 'doc_default' &&
  activeTab.value.fileType === 'docx'
)

/** 当前 Tab 是否是 Excel 文件 */
const isOpenExcelTab = computed(() =>
  activeTab.value &&
  activeTab.value.type === 'doc' &&
  activeTab.value.id !== 'doc_default' &&
  activeTab.value.fileType === 'xlsx'
)

// 监听 URL 传递的 toolId
watch(() => route.query.toolId, (newToolId) => {
  if (newToolId) openToolTab(newToolId as string)
}, { immediate: true })

const getToolComponent = (toolId: string) => {
  const tool = toolRegistry.find(t => t.id === toolId)
  return tool && tool.component ? markRaw(tool.component) : null
}

const createNewDoc = () => {
  const newId = `doc_${Date.now()}`
  tabs.value.push({
    id: newId,
    title: `未命名文档_${tabs.value.length + 1}.md`,
    type: 'doc',
    fileType: 'md',
    icon: 'mdi-file-document-outline',
    iconClass: 'text-blue-400'
  })
  activeTabId.value = newId
}

const goToTools = () => {
  router.push('/tools')
}

const commands: Command[] = [
  { id: 'diff',   title: '/diff',   icon: 'mdi-file-compare',     desc: '强制进入对比模式' },
  { id: 'graph',  title: '/graph',  icon: 'mdi-chart-line',        desc: '调用图表可视化工具' },
  { id: 'format', title: '/format', icon: 'mdi-format-align-left', desc: '格式化当前文档' },
  { id: 'export', title: '/export', icon: 'mdi-export',            desc: '导出文档' }
]

const handlePreviewDiff = () => {
  const modified = workspaceStore.activeDocument + '\n\n## 补充：锂电池失效机理分析\n基于拉曼光谱分析，我们发现固体电解质界面（SEI）膜的非均匀生长是导致容量衰减的主要原因。'
  workspaceStore.enterDiffMode(modified)
}

const handleSend = (message: string) => {
  workspaceStore.setEditorLock(true)
  workspaceStore.addMessage({ role: 'user', content: message })

  isThinking.value = true
  setTimeout(() => {
    isThinking.value = false
    workspaceStore.addMessage({
      role: 'ai',
      content: '收到您的指令。我已分析相关内容，以下是生成的修改建议摘要。'
    })
    workspaceStore.addMessage({
      role: 'action-card',
      content: '',
      actionCard: {
        title: '已生成修改建议',
        description: '点击预览，在中间工作区查看 Diff 对比'
      }
    })
  }, 1500)
}
</script>

<style scoped lang="scss">
.console-layout {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* --- 中间编辑区 --- */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workspace-header {
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  flex-shrink: 0;

  .doc-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-badge {
      font-size: 0.75rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }

  .workspace-actions {
    display: flex;
    gap: 0.5rem;

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

      &.primary {
        background-color: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
        &:hover { background-color: var(--color-primary-hover); }
      }
    }
  }
}

.workspace-content {
  flex: 1;
  overflow: hidden;
  background-color: var(--bg-secondary);
  display: flex;
}

.tab-pane {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Excel 占位 */
.excel-placeholder {
  align-items: center;
  justify-content: center;

  .placeholder-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;

    h3 { margin: 0; font-size: 1rem; color: var(--text-primary); }
    p { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
  }
}

/* --- 空状态看板 --- */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--bg-primary);
}

.empty-glass-card {
  max-width: 480px;
  width: 100%;
  padding: 3rem 2rem;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  text-align: center;
  box-shadow: var(--shadow-lg, 0 20px 60px rgba(0,0,0,0.1));
  animation: floatUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);

  .brand-logo {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);

    .floating-icon {
      font-size: 2rem;
      color: white;
      animation: rotate 8s linear infinite;
    }
  }

  h2 {
    font-size: 1.4rem;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 0.75rem;
    background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-top: 0;
    margin-bottom: 2rem;
  }
}

.quick-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;

  .quick-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.primary {
      background-color: var(--color-primary);
      color: white;
      border: none;
      &:hover { background-color: var(--color-primary-hover); transform: translateY(-1px); }
    }

    &:not(.primary) {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      &:hover { background-color: var(--bg-tertiary); border-color: var(--border-focus); transform: translateY(-1px); }
    }
  }
}

.shortcuts-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  code {
    background-color: var(--bg-secondary);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    color: var(--color-primary);
  }
  .separator { opacity: 0.5; }
}

@keyframes rotate { 100% { transform: rotate(360deg); } }
@keyframes floatUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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
