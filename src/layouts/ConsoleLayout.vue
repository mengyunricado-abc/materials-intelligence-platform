<template>
  <!--
   * @vibe-intent 三栏式控制台纯布局容器，阶段二重构后职责仅限于：管理三栏宽度/折叠状态、
   * 持有全局会话数据（messages/files），并将数据/事件分发给各子组件。
   * 所有 UI 细节已下沉至 Sidebar/* 和 Copilot/* 各组件。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="console-layout">

    <!-- ======== 左侧导航栏 ======== -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <SidebarNav
        :active-tab="sidebarActiveTab"
        :is-collapsed="isSidebarCollapsed"
        @tab-change="sidebarActiveTab = $event"
        @collapse="isSidebarCollapsed = !isSidebarCollapsed"
        @go-home="goHome"
      />
      <div class="sidebar-content" v-show="!isSidebarCollapsed">
        <FileList
          v-if="sidebarActiveTab === 'files'"
          :files="files"
          @file-select="handleFileSelect"
          @file-upload="handleFileUpload"
          @refs-change="contextRefs = $event"
        />
        <ToolList v-else />

      </div>
    </aside>

    <!-- ======== 中间编辑区 ======== -->
    <main class="workspace">
      <TabHeader />
      <header class="workspace-header" v-show="activeTab?.type === 'doc'">
        <div class="doc-info">
          <h2>未命名文档_01.md</h2>
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
        <!-- 空状态看板 (方案 B) -->
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
              <button class="quick-btn" @click="toggleSidebarToolbox">
                <span class="mdi mdi-toolbox-outline"></span>
                <span>唤醒工具箱</span>
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

        <!-- CSV 数据网格预览组件 -->
        <div class="tab-pane" v-show="isOpenCsvTab">
          <CSVViewer :fileName="activeTab?.title" />
        </div>

        <!-- PDF 科研文献阅读器组件 -->
        <div class="tab-pane" v-show="isOpenPdfTab">
          <PDFReader :fileName="activeTab?.title" />
        </div>


        
        <!-- 工具挂载区 (常驻防卸载，天然保活) -->
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
          <button class="icon-btn" @click="toggleHistoryDrawer" title="历史记录">
            <span class="mdi mdi-history"></span>
          </button>
          <button class="icon-btn" @click="isCopilotCollapsed = !isCopilotCollapsed">
            <span
              class="mdi"
              :class="isCopilotCollapsed ? 'mdi-chevron-left' : 'mdi-chevron-right'"
            ></span>
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
        <!-- 历史记录侧滑抽屉 -->
        <div class="history-drawer" :class="{ open: isHistoryDrawerOpen }">
          <div class="drawer-header">
            <h3>历史对话</h3>
            <button class="icon-btn" @click="isHistoryDrawerOpen = false">
              <span class="mdi mdi-close"></span>
            </button>
          </div>
          <div class="drawer-list">
            <div 
              v-for="session in sessions" 
              :key="session.id"
              class="drawer-item"
              :class="{ active: session.id === activeSessionId }"
              @click="workspaceStore.switchSession(session.id)"
            >
              <div class="item-info">
                <div class="item-title">{{ session.title || '新对话' }}</div>
                <div class="item-preview">{{ session.preview }}</div>
              </div>
              <button class="delete-btn" @click.stop="workspaceStore.deleteSession(session.id)">
                <span class="mdi mdi-delete-outline"></span>
              </button>
            </div>
          </div>
        </div>

        <ContextBar
          :references="contextRefs"
          @remove-ref="removeRef"
        />
        <ChatMessages
          :messages="messages"
          :is-thinking="isThinking"
          @preview-diff="handlePreviewDiff"
        />
        <ChatInput
          :available-files="files"
          :available-commands="commands"
          @send="handleSend"
        />
      </div>
    </aside>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, watch, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../stores/workspace'

// 子组件
import SidebarNav from '../components/Sidebar/SidebarNav.vue'
import FileList from '../components/Sidebar/FileList.vue'
import ContextBar from '../components/Copilot/ContextBar.vue'

import ChatMessages from '../components/Copilot/ChatMessages.vue'
import ChatInput from '../components/Copilot/ChatInput.vue'
import ToolList from '../components/Sidebar/ToolList.vue'
import TabHeader from '../components/Workspace/TabHeader.vue'
import CSVViewer from '../components/Workspace/CSVViewer.vue'
import PDFReader from '../components/Workspace/PDFReader.vue'

// hooks & utils
import { useTabs } from '../composables/useTabs'
import { toolRegistry } from '../utils/toolsRegistry'

// 类型
import type { FileItem, Message, Command } from '../types/index'

/**
 * @vibe-intent 控制台三栏式主骨架布局，重构为使用 Pinia 状态提升，打通三栏联动。
 * @vibe-model Gemini 3 Flash
 * @vibe-ref intents.md#2026-04-28
 */
const router = useRouter()
const route = useRoute()
const { tabs, activeTabId, activeTab, openToolTab, openFileTab } = useTabs()


// Pinia Store
const workspaceStore = useWorkspaceStore()
const { 
  files, 
  selectedFiles: contextRefs, 
  messages,
  sessions,
  activeSessionId
} = storeToRefs(workspaceStore)

const isHistoryDrawerOpen = ref(false)
const toggleHistoryDrawer = () => {
  isHistoryDrawerOpen.value = !isHistoryDrawerOpen.value
}

const recentSessions = computed(() => {
  return sessions.value.slice(0, 3)
})

const isOpenCsvTab = computed(() => {
  return activeTab.value && 
         activeTab.value.type === 'doc' && 
         activeTab.value.id !== 'doc_default' &&
         activeTab.value.title &&
         activeTab.value.title.toLowerCase().endsWith('.csv')
})

const isOpenPdfTab = computed(() => {
  return activeTab.value && 
         activeTab.value.type === 'doc' && 
         activeTab.value.id !== 'doc_default' &&
         activeTab.value.title &&
         activeTab.value.title.toLowerCase().endsWith('.pdf')
})

onMounted(() => {
  if (route.query.toolId) {
    // 自动打开 URL 传递的工具
    openToolTab(route.query.toolId as string)
  }
})

// 可选：监听路由变化动态打开工具
watch(() => route.query.toolId, (newToolId) => {
  if (newToolId) {
    openToolTab(newToolId as string)
  }
})

const getToolComponent = (toolId: string) => {
  const tool = toolRegistry.find(t => t.id === toolId)
  return tool && tool.component ? markRaw(tool.component) : null
}

// ---- 布局状态 ----
const isSidebarCollapsed = ref(false)
const isCopilotCollapsed = ref(false)
const sidebarActiveTab = ref('files')

const createNewDoc = () => {
  const newId = `doc_${Date.now()}`
  tabs.value.push({
    id: newId,
    title: `未命名文档_${tabs.value.length + 1}.md`,
    type: 'doc',
    icon: 'mdi-file-document-outline',
    iconClass: 'text-blue-400'
  })
  activeTabId.value = newId
}

const toggleSidebarToolbox = () => {
  isSidebarCollapsed.value = false
  sidebarActiveTab.value = 'tools'
}

// 联动逻辑：主工作区 Tab 切换时，自动拉起对应的左侧边栏分组
watch(activeTab, (newTab) => {
  if (newTab) {
    if (newTab.type === 'tool') {
      sidebarActiveTab.value = 'tools'
    } else if (newTab.type === 'doc') {
      sidebarActiveTab.value = 'files'
    }
  }
}, { immediate: true })

const isThinking = ref(false)

// ---- 指令列表 ----
const commands: Command[] = [
  { id: 'diff',   title: '/diff',   icon: 'mdi-file-compare',     desc: '强制进入对比模式' },
  { id: 'graph',  title: '/graph',  icon: 'mdi-chart-line',        desc: '调用图表可视化工具' },
  { id: 'format', title: '/format', icon: 'mdi-format-align-left', desc: '格式化当前文档' },
  { id: 'export', title: '/export', icon: 'mdi-export',            desc: '导出文档' }
]

// ---- 事件处理 ----
const goHome = () => router.push('/')

const handleNewChat = () => {
  workspaceStore.messages = [{
    id: 'm0',
    role: 'ai',
    content: '已开启新会话。请问有什么可以帮您？'
  }]
  workspaceStore.selectedFileIds = []
}

const handleFileSelect = (file: FileItem) => {
  openFileTab(file)
}


const handleFileUpload = () => {
  console.log('触发文件上传')
}

const handleSessionSelect = (id: string) => {
  console.log('切换历史会话：', id)
}

const removeRef = (id: string) => {
  workspaceStore.toggleFileSelection(id)
}

const handlePreviewDiff = () => {
  const modified = workspaceStore.activeDocument + '\n\n## 补充：锂电池失效机理分析\n基于拉曼光谱分析，我们发现固体电解质界面（SEI）膜的非均匀生长是导致容量衰减的主要原因。'
  workspaceStore.enterDiffMode(modified)
}

const handleSend = (message: string) => {
  // 上锁防并发冲突
  workspaceStore.setEditorLock(true)

  // 追加用户消息
  workspaceStore.addMessage({
    role: 'user',
    content: message
  })


  // 模拟 AI 思考
  isThinking.value = true
  setTimeout(() => {
    isThinking.value = false
    workspaceStore.addMessage({
      role: 'ai',
      content: '收到您的指令。我已分析相关内容，以下是生成的修改建议摘要。'
    })
    // 追加操作卡片（模拟 AI 生成了文档修改建议）
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
/* 布局骨架：三栏 Flex 容器 */
.console-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* --- 左侧导航栏 --- */
.sidebar {
  width: var(--sidebar-width);
  background-color: var(--glass-bg);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--border-color);
  display: flex;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed { width: 60px; }
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tools-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.5;
  font-size: 0.875rem;

  .mdi { font-size: 2.5rem; }
  p { margin: 0; }
}

/* --- 中间编辑区 --- */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workspace-header {
  height: 60px;
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
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary);
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
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);

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

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--bg-primary);
}

.empty-glass-card {
  max-width: 500px;
  width: 100%;
  padding: 3rem 2rem;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  text-align: center;
  box-shadow: var(--shadow-lg);
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
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 0.75rem;
    background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    color: var(--text-secondary);
    font-size: 0.925rem;
    line-height: 1.6;
    margin-top: 0;
    margin-bottom: 2rem;
  }
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;

  .quick-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.primary {
      background-color: var(--color-primary);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);

      &:hover {
        background-color: var(--color-primary-hover);
        transform: translateY(-1px);
      }
    }

    &:not(.primary) {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);

      &:hover {
        background-color: var(--bg-tertiary);
        border-color: var(--border-focus);
        transform: translateY(-1px);
      }
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

  .separator {
    opacity: 0.5;
  }
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes floatUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}


/* --- 右侧 AI 助手 --- */
.copilot {
  width: var(--copilot-width);
  background-color: var(--glass-bg);
  backdrop-filter: blur(12px);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed { width: 50px; }
}

.copilot-header {
  height: 60px;
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

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
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
  background-color: rgba(15, 23, 42, 0.2);
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

    .session-title {
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .close-session-icon {
      font-size: 0.85rem;
      opacity: 0;
      transition: opacity 0.2s;
      
      &:hover {
        color: #ef4444;
      }
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

.history-drawer {
  position: absolute;
  top: 0;
  bottom: 0;
  right: -100%;
  width: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border-left: 1px solid var(--border-color);
  z-index: 60;
  display: flex;
  flex-direction: column;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.open {
    right: 0;
  }

  .drawer-header {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .drawer-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .drawer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-radius: 8px;
    background-color: var(--bg-secondary);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--bg-tertiary);
      border-color: var(--border-color);
      
      .delete-btn { opacity: 1; }
    }

    &.active {
      background-color: rgba(59, 130, 246, 0.08);
      border-color: var(--color-primary);
    }

    .item-info {
      flex: 1;
      min-width: 0;
      
      .item-title {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .item-preview {
        font-size: 0.75rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0;
      transition: all 0.2s;

      &:hover {
        color: #ef4444;
      }
    }
  }
}

</style>
