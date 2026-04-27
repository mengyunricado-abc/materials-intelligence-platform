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
        :active-tab="activeTab"
        :is-collapsed="isSidebarCollapsed"
        @tab-change="activeTab = $event"
        @collapse="isSidebarCollapsed = !isSidebarCollapsed"
        @go-home="goHome"
        @new-chat="handleNewChat"
      />
      <div class="sidebar-content" v-show="!isSidebarCollapsed">
        <FileList
          v-if="activeTab === 'files'"
          :files="files"
          @file-select="handleFileSelect"
          @file-upload="handleFileUpload"
          @refs-change="contextRefs = $event"
        />
        <HistoryList
          v-else-if="activeTab === 'history'"
          @session-select="handleSessionSelect"
        />
        <div v-else class="tools-placeholder">
          <span class="mdi mdi-hammer-wrench"></span>
          <p>工具区（阶段三实现）</p>
        </div>
      </div>
    </aside>

    <!-- ======== 中间编辑区 ======== -->
    <main class="workspace">
      <header class="workspace-header">
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
        <router-view />
      </div>
    </main>

    <!-- ======== 右侧 AI 助手 ======== -->
    <aside class="copilot" :class="{ collapsed: isCopilotCollapsed }">
      <div class="copilot-header">
        <div class="header-title">
          <span class="mdi mdi-robot-outline"></span>
          <span v-show="!isCopilotCollapsed">AI 助手</span>
        </div>
        <button class="icon-btn" @click="isCopilotCollapsed = !isCopilotCollapsed">
          <span
            class="mdi"
            :class="isCopilotCollapsed ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          ></span>
        </button>
      </div>

      <div class="chat-container" v-show="!isCopilotCollapsed">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 子组件
import SidebarNav from '../components/Sidebar/SidebarNav.vue'
import FileList from '../components/Sidebar/FileList.vue'
import HistoryList from '../components/Sidebar/HistoryList.vue'
import ContextBar from '../components/Copilot/ContextBar.vue'
import ChatMessages from '../components/Copilot/ChatMessages.vue'
import ChatInput from '../components/Copilot/ChatInput.vue'

// 类型
import type { FileItem, Message, Command } from '../types/index'

const router = useRouter()

// ---- 布局状态 ----
const isSidebarCollapsed = ref(false)
const isCopilotCollapsed = ref(false)
const activeTab = ref('files')

// ---- 文件数据（Mock，阶段五替换为 API） ----
const files = ref<FileItem[]>([
  { id: 'f1', name: '参考文献.pdf', type: 'pdf', icon: 'mdi-file-pdf-box', iconClass: 'text-danger' },
  { id: 'f2', name: '实验数据.xlsx', type: 'xlsx', icon: 'mdi-file-excel-box', iconClass: 'text-success' }
])

// ---- 右侧对话数据 ----
const messages = ref<Message[]>([
  {
    id: 'm0',
    role: 'ai',
    content: '您好！我已读取相关实验数据。请问需要分析数据，还是起草报告的某一部分？'
  }
])
const isThinking = ref(false)
const contextRefs = ref<FileItem[]>([])

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
  messages.value = [{
    id: 'm0',
    role: 'ai',
    content: '已开启新会话。请问有什么可以帮您？'
  }]
  contextRefs.value = []
}

const handleFileSelect = (file: FileItem) => {
  console.log('打开文件：', file.name)
}

const handleFileUpload = () => {
  console.log('触发文件上传')
}

const handleSessionSelect = (id: string) => {
  console.log('切换历史会话：', id)
}

const removeRef = (id: string) => {
  contextRefs.value = contextRefs.value.filter(f => f.id !== id)
}

const handlePreviewDiff = () => {
  console.log('触发 Diff 预览（阶段三联通）')
}

const handleSend = (message: string) => {
  // 追加用户消息
  messages.value.push({
    id: `u${Date.now()}`,
    role: 'user',
    content: message
  })

  // 模拟 AI 思考
  isThinking.value = true
  setTimeout(() => {
    isThinking.value = false
    messages.value.push({
      id: `a${Date.now()}`,
      role: 'ai',
      content: '收到您的指令。我已分析相关内容，以下是生成的修改建议摘要。'
    })
    // 追加操作卡片（模拟 AI 生成了文档修改建议）
    messages.value.push({
      id: `c${Date.now()}`,
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
  background-color: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  display: flex;
  transition: width 0.3s ease;

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
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s;

      &:hover { background-color: var(--bg-secondary); }

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

/* --- 右侧 AI 助手 --- */
.copilot {
  width: var(--copilot-width);
  background-color: var(--bg-tertiary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;

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

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
