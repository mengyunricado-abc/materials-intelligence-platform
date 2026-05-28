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
          <button class="action-btn" v-if="isTabUnsaved" @click="openSaveFileDialog">
            <span class="mdi mdi-content-save-outline"></span> 保存文档
          </button>
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

        <!-- 文档编辑区 (Markdown) -->
        <div class="tab-pane" v-show="activeTab?.type === 'doc' && activeTab?.fileType === 'md'">
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
          <button class="icon-btn" @click="createConsoleSession" title="开启新对话">
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

    <!-- 极简 Glass 保存文件选择器 -->
    <div class="glass-dialog-overlay" v-if="saveState.visible" @click="saveState.visible = false">
      <div class="glass-dialog" @click.stop>
        <h4>保存并归档学术文档</h4>
        
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">保存格式</label>
          <div class="format-options">
            <div 
              class="format-option-card" 
              :class="{ active: saveState.fileFormat === 'md' }"
              @click="saveState.fileFormat = 'md'"
            >
              <span class="mdi mdi-language-markdown format-icon text-warning"></span>
              <span class="format-label-text">Markdown</span>
            </div>
            <div 
              class="format-option-card" 
              :class="{ active: saveState.fileFormat === 'docx' }"
              @click="saveState.fileFormat = 'docx'"
            >
              <span class="mdi mdi-file-word format-icon text-primary"></span>
              <span class="format-label-text">Word</span>
            </div>
            <div 
              class="format-option-card" 
              :class="{ active: saveState.fileFormat === 'xlsx' }"
              @click="saveState.fileFormat = 'xlsx'"
            >
              <span class="mdi mdi-file-excel format-icon text-success"></span>
              <span class="format-label-text">Excel</span>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">文件名</label>
          <div class="input-with-suffix">
            <input
              v-model="saveState.fileName"
              placeholder="输入文件名"
              class="dialog-input"
              style="margin-bottom: 0;"
              @keydown.enter="submitSaveFile"
            />
            <span class="file-suffix">.{{ saveState.fileFormat }}</span>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">选择知识库 (项目)</label>
          <select v-model="saveState.selectedProjectId" class="dialog-select">
            <option v-for="proj in workspaceStore.projects" :key="proj.id" :value="proj.id">
              {{ proj.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">选择文件夹 (选填)</label>
          <select v-model="saveState.selectedFolderId" class="dialog-select">
            <option value="">（保存在项目根目录下）</option>
            <option v-for="folder in foldersForSelectedProject" :key="folder.id" :value="folder.id">
              {{ folder.name }}
            </option>
          </select>
        </div>

        <div class="dialog-actions" style="margin-top: 1.5rem;">
          <button class="dialog-btn cancel" @click="saveState.visible = false">取消</button>
          <button class="dialog-btn confirm" @click="submitSaveFile" :disabled="!saveState.fileName.trim() || !saveState.selectedProjectId">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch, reactive } from 'vue'
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
const { tabs, activeTabId, activeTab } = useTabs()

const workspaceStore = useWorkspaceStore()
const { messages, sessions, activeSessionId, allFiles } = storeToRefs(workspaceStore)

const isCopilotCollapsed = ref(false)
const isThinking = ref(false)

const recentSessions = computed(() => {
  return sessions.value.filter(s => 
    s.type === 'doc-edit' && 
    s.fileId === activeTabId.value && 
    !s.hiddenInRecent
  ).slice(0, 3)
})

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

// 监听 activeTabId 切换文档专属会话
watch(activeTabId, (newTabId) => {
  const tab = tabs.value.find(t => t.id === newTabId)
  if (tab && tab.type === 'doc') {
    workspaceStore.loadOrCreateDocSession(tab.id, tab.title)
  }
}, { immediate: true })

const createConsoleSession = () => {
  if (activeTab.value && activeTab.value.type === 'doc') {
    workspaceStore.createSession('doc-edit', activeTab.value.id)
  } else {
    workspaceStore.createSession('qa')
  }
}

// ---- 保存文件弹窗状态 ----
const saveState = reactive({
  visible: false,
  fileName: '',
  fileFormat: 'md' as 'md' | 'docx' | 'xlsx',
  selectedProjectId: '',
  selectedFolderId: ''
})

const foldersForSelectedProject = computed(() => {
  const proj = workspaceStore.projects.find(p => p.id === saveState.selectedProjectId)
  return proj ? proj.folders : []
})

const isTabUnsaved = computed(() => {
  if (!activeTab.value || activeTab.value.type !== 'doc') return false
  return !workspaceStore.allFiles.some(f => f.id === activeTabId.value)
})

const openSaveFileDialog = () => {
  const tab = activeTab.value
  let nameWithoutExt = tab ? tab.title : '未命名文档'
  let currentFormat: 'md' | 'docx' | 'xlsx' = 'md'

  if (nameWithoutExt.endsWith('.md')) {
    nameWithoutExt = nameWithoutExt.slice(0, -3)
    currentFormat = 'md'
  } else if (nameWithoutExt.endsWith('.docx')) {
    nameWithoutExt = nameWithoutExt.slice(0, -5)
    currentFormat = 'docx'
  } else if (nameWithoutExt.endsWith('.xlsx')) {
    nameWithoutExt = nameWithoutExt.slice(0, -5)
    currentFormat = 'xlsx'
  }

  saveState.fileName = nameWithoutExt
  saveState.fileFormat = currentFormat

  // 若当前 Tab 是新建的临时 Tab，联动回显其绑定的项目与文件夹
  if (tab && tab.isTemp) {
    saveState.selectedProjectId = tab.tempProjectId || workspaceStore.projects[0]?.id || ''
    saveState.selectedFolderId = tab.tempFolderId || ''
  } else {
    saveState.selectedProjectId = workspaceStore.projects[0]?.id || ''
    saveState.selectedFolderId = ''
  }
  
  saveState.visible = true
}

/**
 * @vibe-intent 校验与实现“先写后归档”物理写盘及多端联动，重塑 Tab 绑定并重绘会话
 * @vibe-model Antigravity
 * @vibe-ref intents.md#2026-05-28
 */
const submitSaveFile = () => {
  const name = saveState.fileName.trim()
  if (!name || !saveState.selectedProjectId) return

  const format = saveState.fileFormat
  const fullName = `${name}.${format}`

  let newFile = null
  if (saveState.selectedFolderId) {
    newFile = workspaceStore.createFileInFolder(saveState.selectedProjectId, saveState.selectedFolderId, fullName)
  } else {
    newFile = workspaceStore.createFileInProject(saveState.selectedProjectId, fullName)
  }

  const tempTabId = activeTabId.value
  const tabToUpdate = tabs.value.find(t => t.id === tempTabId)

  if (newFile && tabToUpdate) {
    // 1. 原地升级该临时 Tab 的专属会话，防止产生“未命名文档” and “新文件”两个历史会话残留
    workspaceStore.upgradeDocSession(tempTabId, newFile.id, newFile.name)

    // 2. 涂改原始页签数据
    tabToUpdate.id = newFile.id
    tabToUpdate.title = newFile.name
    tabToUpdate.fileType = format
    tabToUpdate.isTemp = false
    delete tabToUpdate.tempProjectId
    delete tabToUpdate.tempFolderId
    
    // 3. 更新当前页签 ID，触发 watch 自动切换专属 AI 问答，极其优雅
    activeTabId.value = newFile.id
  }

  saveState.visible = false
}

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
/* Form groups for Save dialog */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
  
  .form-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
}

.dialog-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    border-color: var(--color-primary);
  }
}

/* Glass dialog style details override */
.glass-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

.glass-dialog {
  width: 320px;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: var(--shadow-lg);
  animation: scaleIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

  h4 {
    margin: 0 0 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.dialog-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
  margin-bottom: 1.25rem;
  box-sizing: border-box;
  
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.dialog-btn {
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: none;

  &.cancel {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    &:hover { background-color: var(--bg-tertiary); color: var(--text-primary); }
  }

  &.confirm {
    background-color: var(--color-primary);
    color: white;
    &:hover:not(:disabled) { background-color: var(--color-primary-hover); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* --- 高阶“保存格式”选项组样式 --- */
.format-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.format-option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.25rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;

  .format-icon {
    font-size: 1.35rem;
  }

  .format-label-text {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  &:hover {
    border-color: var(--color-primary);
    background: var(--bg-secondary);
    transform: translateY(-1px);
    
    .format-label-text {
      color: var(--text-primary);
    }
  }

  &.active {
    background: rgba(59, 130, 246, 0.08);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);

    .format-label-text {
      color: var(--color-primary);
      font-weight: 600;
    }
  }
}

/* 带后缀的输入框容器 */
.input-with-suffix {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;

  .dialog-input {
    flex: 1;
    padding-right: 3.5rem; /* 给后缀留空间 */
    margin-bottom: 0 !important;
  }

  .file-suffix {
    position: absolute;
    right: 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    pointer-events: none; /* 防止遮挡输入框点击 */
  }
}
</style>
