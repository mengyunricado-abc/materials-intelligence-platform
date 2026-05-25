<template>
  <!--
   * @vibe-intent 知识库主页面反转布局重构：
   * 1. Main（主体区域）：左侧分类树 + 中间文献网格，展示知识库详情。
   * 2. Right（右侧区域）：挂载 AI 问答侧边栏，对话模式自动锁定为「知识库问答」。
   * 3. 支持毛玻璃阻尼拉伸拖拽边缘改变宽度，并持久化宽度在 Pinia 中。
   * @vibe-model Gemini 3.5 Flash (High)
   * @vibe-ref intents.md#2026-05-25
   -->
  <div class="knowledge-page">
    
    <!-- ======== Main: 主体区域 (分类目录 + 文件列表网格) ======== -->
    <div class="kb-main-layout">
      <!-- 1. 左侧：项目与目录树 -->
      <aside class="kb-sidebar-tree">
        <div class="tree-header">
          <span class="mdi mdi-library-outline tree-header-icon"></span>
          <h2>知识分类目录</h2>
        </div>

        <div class="tree-body">
          <div 
            v-for="project in projects" 
            :key="project.id" 
            class="project-node"
            :class="{ 'node-active': activeNode?.type === 'project' && activeNode?.id === project.id }"
          >
            <!-- 项目折叠头 -->
            <div class="tree-row project-row" @click="selectNode('project', project.id)">
              <span 
                class="mdi toggle-arrow"
                :class="project.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                @click.stop="workspaceStore.toggleProject(project.id)"
              ></span>
              <span class="mdi mdi-folder-multiple project-folder-icon"></span>
              <span class="node-title">{{ project.name }}</span>
            </div>

            <!-- 项目折叠内容（子文件夹） -->
            <transition name="tree-expand">
              <div class="project-children" v-show="project.expanded">
                <!-- 文件夹节点 -->
                <div 
                  v-for="folder in project.folders" 
                  :key="folder.id" 
                  class="tree-row folder-row"
                  :class="{ 'node-active': activeNode?.type === 'folder' && activeNode?.id === folder.id }"
                  @click="selectNode('folder', folder.id, project.id)"
                >
                  <div class="indent"></div>
                  <span 
                    class="mdi toggle-arrow"
                    :class="folder.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                    @click.stop="workspaceStore.toggleFolder(project.id, folder.id)"
                  ></span>
                  <span class="mdi mdi-folder folder-icon"></span>
                  <span class="node-title">{{ folder.name }}</span>
                </div>
                
                <!-- 暂无文件夹兜底 -->
                <div class="empty-folder-hint" v-if="project.folders.length === 0">
                  <span class="indent-more"></span>
                  <span class="hint-text">暂无子文件夹</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </aside>

      <!-- 2. 中部：文件列表详情 -->
      <main class="kb-content-area">
        <!-- 顶部功能筛选条 -->
        <header class="content-header">
          <div class="breadcrumb-nav">
            <span class="breadcrumb-item" @click="clearSelection">所有项目</span>
            <template v-if="currentPath.project">
              <span class="separator">/</span>
              <span 
                class="breadcrumb-item" 
                :class="{ active: !currentPath.folder }" 
                @click="selectNode('project', currentPath.project.id)"
              >
                {{ currentPath.project.name }}
              </span>
            </template>
            <template v-if="currentPath.folder">
              <span class="separator">/</span>
              <span class="breadcrumb-item active">{{ currentPath.folder.name }}</span>
            </template>
          </div>

          <div class="action-controls">
            <!-- 开启/收回 AI 问答面板 -->
            <button class="action-btn ai-chat-toggle-btn" :class="{ open: isKbChatOpen }" @click="toggleKbChat">
              <span class="mdi mdi-robot-outline"></span>
              <span>{{ isKbChatOpen ? '收起 AI 问答' : '知识库 AI 问答' }}</span>
            </button>
            
            <!-- 上传文献数据 -->
            <button class="action-btn upload-btn" @click="triggerUpload">
              <span class="mdi mdi-cloud-upload-outline"></span>
              <span>上传文献数据</span>
            </button>
          </div>
        </header>

        <!-- 搜索及过滤栏 -->
        <section class="filter-bar">
          <div class="search-wrap">
            <span class="mdi mdi-magnify search-icon"></span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="在当前目录下检索文件..." 
              class="search-input"
            />
            <span 
              class="mdi mdi-close-circle clear-search" 
              v-show="searchQuery" 
              @click="searchQuery = ''"
            ></span>
          </div>

          <div class="type-filters">
            <button 
              v-for="filter in typeFilters" 
              :key="filter.value" 
              class="filter-tab"
              :class="{ active: activeTypeFilter === filter.value }"
              @click="activeTypeFilter = filter.value"
            >
              <span class="mdi" :class="filter.icon"></span>
              <span>{{ filter.label }}</span>
            </button>
          </div>
        </section>

        <!-- 文件主列表 -->
        <section class="files-container">
          <div class="files-grid" v-if="filteredFiles.length > 0">
            <div 
              v-for="file in filteredFiles" 
              :key="file.id" 
              class="file-glass-card"
              :class="{ 'card-in-ctx': isFileInContext(file.id) }"
            >
              <div class="card-top">
                <span class="mdi file-type-large-icon" :class="[file.icon, file.iconClass]"></span>
                <div class="ctx-checkbox-wrap" title="勾选挂载至 AI 会话上下文">
                  <input 
                    type="checkbox" 
                    :id="'chk_' + file.id" 
                    class="custom-checkbox"
                    :checked="isFileInContext(file.id)"
                    @change="toggleFileContext(file)"
                  />
                  <label :for="'chk_' + file.id" class="checkbox-label"></label>
                </div>
              </div>

              <div class="card-mid">
                <h3 class="file-name" :title="file.name">{{ file.name }}</h3>
                <p class="file-meta">
                  <span class="meta-tag">{{ file.type.toUpperCase() }} 格式</span>
                  <span class="meta-dot">•</span>
                  <span class="meta-tag">只读预览</span>
                </p>
              </div>

              <div class="card-bottom">
                <button 
                  class="card-btn ctx-btn" 
                  :class="{ 'btn-active': isFileInContext(file.id) }"
                  @click="toggleFileContext(file)"
                >
                  <span class="mdi" :class="isFileInContext(file.id) ? 'mdi-brain' : 'mdi-brain-outline'"></span>
                  <span>{{ isFileInContext(file.id) ? '已挂载 AI' : '挂载 AI' }}</span>
                </button>
                
                <button class="card-btn open-btn" @click="handleFileOpen(file)">
                  <span class="mdi mdi-play-circle-outline"></span>
                  <span>控制台打开</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 暂无文件兜底 -->
          <div class="empty-files-hint" v-else>
            <span class="mdi mdi-folder-open-outline empty-icon"></span>
            <h3>暂无匹配文献或数据</h3>
            <p>请尝试切换左侧分类目录、清除搜索或上传新文件。</p>
            <button class="quick-clear-btn" v-if="searchQuery || activeTypeFilter !== 'all'" @click="resetFilters">
              重置筛选条件
            </button>
          </div>
        </section>

        <!-- 底部常驻：已选上下文统计与指示器 -->
        <footer class="kb-footer-bar" v-if="contextRefs.length > 0">
          <div class="footer-left">
            <span class="mdi mdi-brain brain-glow"></span>
            <span class="ctx-count">
              当前科学大脑已装载 <strong>{{ contextRefs.length }}</strong> 项上下文
            </span>
          </div>
          <div class="footer-right">
            <button class="clear-ctx-btn" @click="workspaceStore.clearContextRefs">
              <span class="mdi mdi-trash-can-outline"></span>
              <span>清除装载</span>
            </button>
          </div>
        </footer>
      </main>
    </div>

    <!-- ======== Right: Resizable 毛玻璃 AI 问答面板 ======== -->
    <transition name="chat-panel-slide">
      <aside 
        class="kb-chat-panel" 
        v-if="isKbChatOpen"
        :style="{ width: workspaceStore.rightPanelWidth + 'px' }"
      >
        <!-- 拖动拉伸手柄 -->
        <div class="resize-handle" @mousedown="startResize" title="拖拽改变宽度">
          <div class="resize-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="header-left">
            <span class="mdi mdi-robot-outline header-icon"></span>
            <div class="title-wrap">
              <h3>AI 知识库问答助理</h3>
              <p>模式已锁定: 知识库问答</p>
            </div>
          </div>
          <button class="close-panel-btn" @click="isKbChatOpen = false">
            <span class="mdi mdi-close"></span>
          </button>
        </div>

        <!-- 对话消息列表 -->
        <div class="panel-messages" ref="panelMessagesRef">
          <div class="welcome-box" v-if="workspaceStore.messages.length === 0 || !hasKbChatted">
            <span class="mdi mdi-atom-variant large-icon animate-spin-slow"></span>
            <h4>学术知识库智能精读</h4>
            <p>已自动关联当前选中的分类。输入您想探寻的研究疑问，AI 将为您提炼多篇文献精华。</p>
          </div>

          <div v-else class="message-list-kb">
            <div 
              v-for="msg in workspaceStore.messages" 
              :key="msg.id" 
              class="kb-msg-bubble"
              :class="msg.role"
            >
              <div class="bubble-body">
                <div class="sender">{{ msg.role === 'user' ? '张博士' : '知识库助理' }}</div>
                <div class="text markdown-body" v-if="msg.role === 'ai'" v-html="renderMarkdown(msg.content)"></div>
                <div class="text" v-else>{{ msg.content }}</div>
              </div>
            </div>

            <!-- Thinking 动效 -->
            <div class="kb-msg-bubble ai" v-if="isThinking">
              <div class="bubble-body">
                <div class="sender">知识库助理</div>
                <div class="text thinking-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部输入框 -->
        <div class="panel-input-box">
          <div class="kb-input-wrap">
            <textarea 
              v-model="kbPrompt" 
              placeholder="对当前知识库提问..." 
              rows="1"
              @keydown.enter.prevent="sendKbMessage"
            ></textarea>
            <button class="send-kb-btn" @click="sendKbMessage" :disabled="!kbPrompt.trim() || isThinking">
              <span class="mdi mdi-send"></span>
            </button>
          </div>
        </div>
      </aside>
    </transition>

    <!-- ======== 模拟上传反馈弹窗 ======== -->
    <transition name="fade">
      <div class="upload-modal-overlay" v-if="showUploadModal" @click.self="showUploadModal = false">
        <div class="upload-modal-card">
          <div class="modal-header">
            <h3>上传文献或实验数据</h3>
            <button class="close-btn" @click="showUploadModal = false">
              <span class="mdi mdi-close"></span>
            </button>
          </div>
          <div class="modal-body">
            <div class="drag-upload-area">
              <span class="mdi mdi-cloud-upload-outline upload-icon"></span>
              <p class="upload-title">将文件拖拽到此处，或 <span class="highlight">点击上传</span></p>
              <p class="upload-subtitle">仅支持白名单格式：.docx / .xlsx / .md</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn secondary" @click="showUploadModal = false">取消</button>
            <button class="modal-btn primary" @click="simulateSuccessUpload">开始上传 (模拟)</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 磨砂玻璃态提示卡片 -->
    <transition name="toast-fade">
      <div class="glass-toast-notification" v-if="showToast">
        <span class="mdi mdi-check-circle-outline toast-icon"></span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../stores/workspace'
import { useTabs } from '../composables/useTabs'
import { marked } from 'marked'
import type { FileItem, ContextRef } from '../types/index'

const router = useRouter()
const { openFileTab } = useTabs()
const workspaceStore = useWorkspaceStore()
const { projects, contextRefs } = storeToRefs(workspaceStore)

// ---- UI 筛选状态 ----
const searchQuery = ref('')
const activeTypeFilter = ref('all')
const showUploadModal = ref(false)

// AI 面板状态
const isKbChatOpen = ref(false)
const hasKbChatted = ref(false)
const kbPrompt = ref('')
const isThinking = ref(false)
const panelMessagesRef = ref<HTMLDivElement | null>(null)

// 当前激活的目录树节点
const activeNode = ref<{ type: 'project' | 'folder'; id: string; projectId?: string } | null>(null)

// 类型过滤白名单配置
const typeFilters = [
  { label: '全部格式', value: 'all', icon: 'mdi-folder-open' },
  { label: 'Markdown', value: 'md', icon: 'mdi-language-markdown' },
  { label: 'Word 文档', value: 'docx', icon: 'mdi-file-word' },
  { label: 'Excel 表格', value: 'xlsx', icon: 'mdi-file-excel' },
]

// ---- Toast 提示状态 ----
const showToast = ref(false)
const toastMessage = ref('')

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// 展开/折叠 AI 面板
const toggleKbChat = () => {
  isKbChatOpen.value = !isKbChatOpen.value
  if (isKbChatOpen.value) {
    workspaceStore.updateMode('knowledge-qa')
  }
}

// Resizable 边缘拖动逻辑
const startResize = (e: MouseEvent) => {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = workspaceStore.rightPanelWidth
  
  const doDrag = (moveEvent: MouseEvent) => {
    // 鼠标左移时增加宽度
    const newWidth = startWidth - (moveEvent.clientX - startX)
    workspaceStore.updateRightPanelWidth(newWidth)
  }
  
  const stopDrag = () => {
    document.removeEventListener('mousemove', doDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.body.style.cursor = ''
  }
  
  document.addEventListener('mousemove', doDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'col-resize'
}

// 发送知识库问答
const sendKbMessage = () => {
  if (!kbPrompt.value.trim() || isThinking.value) return
  
  const userText = kbPrompt.value
  hasKbChatted.value = true
  workspaceStore.addMessage({ role: 'user', content: userText })
  kbPrompt.value = ''
  
  nextTick(() => {
    if (panelMessagesRef.value) {
      panelMessagesRef.value.scrollTop = panelMessagesRef.value.scrollHeight
    }
  })

  // 模拟 AI 解析知识库返回
  isThinking.value = true
  setTimeout(() => {
    isThinking.value = false
    
    // 提取当前选中的项目或文件夹作为上下文
    const locationName = currentPath.value.folder 
      ? `「${currentPath.value.folder.name}」文件夹` 
      : currentPath.value.project 
        ? `「${currentPath.value.project.name}」项目` 
        : '所有学术项目';
        
    workspaceStore.addMessage({
      role: 'ai',
      content: `基于您目前在知识库中的位置 **${locationName}**，我为您检索并关联分析了当前归档的相关科研数据。
      
经过全量知识向量的精读与拟合，我提炼出以下核心观点：
- **电化学阻抗变化**：阻抗的升高伴随微观晶粒的不可逆微裂纹演化，当前目录下的 `.xlsx` 表格呈现了这种累进趋势。
- **关联建议**：您可以随时在下方勾选某份文献，一键 **[挂载 AI]** 作为本轮问答的深度专属背景资料。`
    })

    nextTick(() => {
      if (panelMessagesRef.value) {
        panelMessagesRef.value.scrollTop = panelMessagesRef.value.scrollHeight
      }
    })
  }, 1600)
}

const renderMarkdown = (text: string) => {
  return marked(text) as string
}

/** 当前选中的路径（用于面包屑） */
const currentPath = computed(() => {
  if (!activeNode.value) return { project: null, folder: null }

  const node = activeNode.value
  const proj = projects.value.find(p => p.id === (node.type === 'project' ? node.id : node.projectId))
  const folder = node.type === 'folder' 
    ? proj?.folders.find(f => f.id === node.id) 
    : null

  return { project: proj || null, folder: folder || null }
})

/** 获取当前选中目录节点下的扁平文件列表 */
const currentDirectoryFiles = computed<FileItem[]>(() => {
  if (!activeNode.value) {
    // 默认展示全部项目下的所有文件
    const all: FileItem[] = []
    projects.value.forEach(p => {
      p.files.forEach(f => all.push(f))
      p.folders.forEach(fold => {
        fold.files.forEach(f => all.push(f))
      })
    })
    return all
  }

  const { type, id, projectId } = activeNode.value
  if (type === 'project') {
    const proj = projects.value.find(p => p.id === id)
    if (!proj) return []
    const files: FileItem[] = [...proj.files]
    proj.folders.forEach(fold => {
      fold.files.forEach(f => files.push(f))
    })
    return files
  } else if (type === 'folder') {
    const proj = projects.value.find(p => p.id === projectId)
    const folder = proj?.folders.find(f => f.id === id)
    return folder ? folder.files : []
  }

  return []
})

/** 基于检索与类型过滤后最终展现的文件 */
const filteredFiles = computed(() => {
  return currentDirectoryFiles.value.filter(file => {
    const matchSearch = file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchType = activeTypeFilter.value === 'all' || file.type === activeTypeFilter.value
    return matchSearch && matchType
  })
})

// ---- 行为交互 (Actions) ----

const selectNode = (type: 'project' | 'folder', id: string, projectId?: string) => {
  activeNode.value = { type, id, projectId }
}

const clearSelection = () => {
  activeNode.value = null
}

const resetFilters = () => {
  searchQuery.value = ''
  activeTypeFilter.value = 'all'
}

const isFileInContext = (fileId: string) => {
  return contextRefs.value.some(r => r.type === 'file' && r.id === fileId)
}

const toggleFileContext = (file: FileItem) => {
  const ref_: ContextRef = {
    type: 'file',
    id: file.id,
    name: file.name,
    icon: file.icon
  }
  workspaceStore.toggleContextRef(ref_)
}

const handleFileOpen = (file: FileItem) => {
  openFileTab(file)
  router.push('/console')
}

const triggerUpload = () => {
  showUploadModal.value = true
}

const simulateSuccessUpload = () => {
  showUploadModal.value = false
  
  let targetProj = projects.value[0]
  let targetFolder = null
  
  const node = activeNode.value
  if (node) {
    if (node.type === 'project') {
      targetProj = projects.value.find(p => p.id === node.id) || projects.value[0]
    } else if (node.type === 'folder') {
      targetProj = projects.value.find(p => p.id === node.projectId) || projects.value[0]
      targetFolder = targetProj.folders.find(f => f.id === node.id) || null
    }
  }
  
  const newFileId = `f_new_${Date.now()}`
  const newFileName = `学术润色与分析建议_${Date.now().toString().slice(-4)}.docx`
  const newFile: FileItem = {
    id: newFileId,
    name: newFileName,
    type: 'docx',
    icon: 'mdi-file-word',
    iconClass: 'text-primary',
    projectId: targetProj.id,
    folderId: targetFolder ? targetFolder.id : undefined
  }
  
  if (targetFolder) {
    targetFolder.files.push(newFile)
  } else {
    targetProj.files.push(newFile)
  }
  
  triggerToast(`已成功将「${newFileName}」上传并编入 ${targetFolder ? targetFolder.name : targetProj.name} 目录！`)
}
</script>

<style scoped lang="scss">
.knowledge-page {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.kb-main-layout {
  flex: 1;
  display: flex;
  min-width: 0;
  height: 100%;
}

/* ======== 左侧目录树 ======== */
.kb-sidebar-tree {
  width: 260px;
  border-right: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .tree-header {
    height: 56px;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0 1.25rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    flex-shrink: 0;

    .tree-header-icon { font-size: 1.2rem; color: var(--color-primary); }
    h2 { margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
  }

  .tree-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
}

/* 树节点样式 */
.tree-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }
}

.node-active {
  background-color: rgba(59, 130, 246, 0.08) !important;
  color: var(--color-primary) !important;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.15);

  .node-title { color: var(--color-primary) !important; }
}

.project-row {
  font-weight: 600;
  color: var(--text-primary);
}

.project-folder-icon { color: var(--color-warning, #f59e0b); }
.folder-icon { color: #94a3b8; }

.toggle-arrow {
  font-size: 0.85rem;
  width: 16px;
  text-align: center;
  color: var(--text-secondary);
  transition: transform 0.2s;
  cursor: pointer;
  &:hover { color: var(--text-primary); }
}

.indent { min-width: 14px; }
.indent-more { min-width: 28px; }

.project-children {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
}

.empty-folder-hint {
  display: flex;
  align-items: center;
  padding: 0.35rem 0;
  .hint-text { font-size: 0.72rem; color: var(--text-secondary); opacity: 0.5; }
}

/* ======== 右侧主区域 ======== */
.kb-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* 面包屑与顶部操作 */
.content-header {
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  flex-shrink: 0;

  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;

    .breadcrumb-item {
      color: var(--text-secondary);
      cursor: pointer;
      transition: color 0.15s;
      &:hover { color: var(--color-primary); }

      &.active {
        color: var(--text-primary);
        font-weight: 600;
        cursor: default;
        &:hover { color: var(--text-primary); }
      }
    }

    .separator { color: var(--text-secondary); opacity: 0.4; }
  }

  .action-controls {
    display: flex;
    gap: 0.5rem;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.upload-btn {
    background-color: var(--color-primary);
    color: white;
    border: none;
    &:hover { background-color: var(--color-primary-hover); transform: translateY(-1px); }
  }

  &.ai-chat-toggle-btn {
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    
    &:hover, &.open {
      background-color: rgba(59, 130, 246, 0.08);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
}

/* 过滤及搜索 */
.filter-bar {
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;

  .search-wrap {
    position: relative;
    width: 260px;

    .search-icon {
      position: absolute;
      left: 0.65rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-size: 0.95rem;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.4rem 1.75rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.8rem;
      outline: none;
      transition: all 0.25s ease;
      &:focus { border-color: var(--color-primary); }
    }

    .clear-search {
      position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%);
      color: var(--text-secondary); font-size: 0.9rem; cursor: pointer;
      &:hover { color: var(--text-primary); }
    }
  }

  .type-filters {
    display: flex;
    gap: 0.35rem;
    background-color: var(--bg-primary);
    padding: 0.2rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;

      .mdi { font-size: 0.85rem; }
      &:hover { color: var(--text-primary); }
      &.active { background-color: var(--bg-tertiary); color: var(--color-primary); }
    }
  }
}

/* 文件网格容器 */
.files-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  background-color: var(--bg-primary);
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

/* 磨砂玻璃卡片 */
.file-glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }

  &.card-in-ctx {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.03);
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  .file-type-large-icon { font-size: 2rem; }
}

/* 自定义勾选框 */
.ctx-checkbox-wrap {
  position: relative;
  display: inline-block;
  width: 15px;
  height: 15px;

  .custom-checkbox {
    opacity: 0; position: absolute; cursor: pointer; z-index: 2; width: 100%; height: 100%;

    &:checked + .checkbox-label::after {
      content: '\F012C';
      font-family: "Material Design Icons";
      font-size: 0.6rem;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:checked + .checkbox-label { background-color: var(--color-primary); border-color: var(--color-primary); }
  }

  .checkbox-label {
    position: absolute; top: 0; left: 0; width: 15px; height: 15px;
    border: 1.5px solid var(--text-secondary); border-radius: 4px;
    cursor: pointer; transition: all 0.15s ease;
    &:hover { border-color: var(--color-primary); }
  }
}

.card-mid {
  flex: 1;
  min-width: 0;

  .file-name {
    margin: 0 0 0.3rem; font-size: 0.8rem; font-weight: 600; color: var(--text-primary);
    line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; height: 2.8em;
  }

  .file-meta {
    margin: 0; display: flex; align-items: center; gap: 0.35rem; font-size: 0.68rem; color: var(--text-secondary);
    .meta-tag { opacity: 0.8; }
    .meta-dot { opacity: 0.4; }
  }
}

.card-bottom {
  display: flex;
  gap: 0.4rem;

  .card-btn {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 0.25rem; padding: 0.35rem 0; border-radius: 6px;
    font-size: 0.72rem; font-weight: 500; cursor: pointer;
    transition: all 0.18s ease;

    &.ctx-btn {
      background-color: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary);
      &:hover { background-color: var(--bg-tertiary); color: var(--text-primary); }
      &.btn-active { background-color: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: var(--color-primary); }
    }

    &.open-btn {
      background-color: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); color: var(--color-primary);
      &:hover { background-color: var(--color-primary); color: white; border-color: var(--color-primary); }
    }
  }
}

.empty-files-hint {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 4rem 2rem; color: var(--text-secondary); text-align: center;
  .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.5; }
  h3 { margin: 0 0 0.4rem; font-size: 0.95rem; color: var(--text-primary); }
  p { margin: 0 0 1.25rem; font-size: 0.78rem; max-width: 300px; line-height: 1.5; }
  
  .quick-clear-btn {
    background: transparent; border: 1px dashed var(--color-primary); color: var(--color-primary);
    padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.78rem; cursor: pointer;
    &:hover { background-color: rgba(59, 130, 246, 0.05); }
  }
}

/* ======== 底部常驻挂载条 ======== */
.kb-footer-bar {
  height: 48px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; border-top: 1px solid var(--border-color);
  background-color: rgba(59, 130, 246, 0.04); backdrop-filter: blur(10px); flex-shrink: 0;

  .footer-left {
    display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--color-primary);
    .brain-glow { font-size: 1rem; animation: pulseGlow 2s infinite ease-in-out; }
  }

  .clear-ctx-btn {
    background: transparent; border: none; color: #ef4444; cursor: pointer;
    font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;
    padding: 0.25rem 0.5rem; border-radius: 4px;
    &:hover { background-color: rgba(239, 68, 68, 0.08); }
  }
}

/* ======== Right: Resizable 毛玻璃 AI 问答面板 ======== */
.kb-chat-panel {
  position: relative;
  background-color: var(--glass-bg, rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(25px);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  z-index: 50;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: -8px 0 30px rgba(0,0,0,0.05);

  .resize-handle {
    position: absolute;
    top: 0;
    left: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--color-primary);
      .resize-dots span { background-color: white; }
    }

    .resize-dots {
      display: flex;
      flex-direction: column;
      gap: 3px;
      pointer-events: none;
      
      span {
        width: 3px;
        height: 3px;
        background-color: var(--text-secondary);
        border-radius: 50%;
        opacity: 0.8;
      }
    }
  }

  .panel-header {
    height: 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.25rem;
    border-bottom: 1px solid var(--border-color);
    background-color: rgba(255, 255, 255, 0.01);
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      
      .header-icon { font-size: 1.2rem; color: var(--color-primary); }
      
      .title-wrap {
        h3 { margin: 0; font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
        p { margin: 0; font-size: 0.62rem; color: var(--text-secondary); }
      }
    }

    .close-panel-btn {
      background: none; border: none; color: var(--text-secondary); cursor: pointer;
      font-size: 1.05rem; display: flex; padding: 0.25rem; border-radius: 4px;
      &:hover { color: var(--text-primary); background-color: var(--bg-secondary); }
    }
  }

  .panel-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    background-color: rgba(0, 0, 0, 0.02);
    scrollbar-width: thin;

    .welcome-box {
      text-align: center;
      margin-top: 10vh;
      padding: 1.5rem;

      .large-icon {
        font-size: 2.5rem;
        background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline-block;
      }

      h4 { margin: 0.75rem 0 0.35rem; font-size: 0.88rem; color: var(--text-primary); }
      p { margin: 0; font-size: 0.72rem; color: var(--text-secondary); line-height: 1.5; }
    }
  }

  .message-list-kb {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .kb-msg-bubble {
    display: flex;
    gap: 0.75rem;

    .bubble-body {
      flex: 1;
      min-width: 0;

      .sender { font-size: 0.68rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.25rem; }
      .text {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 0.65rem 0.85rem;
        color: var(--text-primary);
        font-size: 0.82rem;
        line-height: 1.55;
        word-break: break-word;
        box-shadow: var(--shadow-sm);
      }
    }

    &.user {
      flex-direction: row-reverse;
      .bubble-body {
        text-align: right;
        .text {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          display: inline-block;
          text-align: left;
        }
      }
    }
  }

  .panel-input-box {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    background-color: rgba(255, 255, 255, 0.01);
    flex-shrink: 0;
  }

  .kb-input-wrap {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.5rem;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;

    textarea {
      flex: 1; border: none; background: transparent; color: var(--text-primary);
      font-size: 0.8rem; resize: none; outline: none; line-height: 1.4;
      min-height: 24px; max-height: 100px; font-family: inherit;
      &::placeholder { color: var(--text-secondary); }
    }

    .send-kb-btn {
      width: 28px; height: 28px; border-radius: 6px; background: var(--color-primary);
      color: white; border: none; display: flex; align-items: center; justify-content: center;
      cursor: pointer; &:disabled { background: var(--bg-secondary); color: var(--text-secondary); cursor: not-allowed; }
    }
  }
}

/* 动效 */
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ======== 模拟上传弹窗 ======== */
.upload-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 999;
}

.upload-modal-card {
  background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 16px;
  width: 420px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column;
  overflow: hidden; animation: floatUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  .modal-header {
    padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border-color);
    display: flex; justify-content: space-between; align-items: center;
    h3 { margin: 0; font-size: 0.9rem; color: var(--text-primary); }
    .close-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.05rem; display: flex; &:hover { color: var(--text-primary); } }
  }

  .modal-body { padding: 1.25rem; }

  .drag-upload-area {
    border: 1.5px dashed var(--border-color); border-radius: 10px; padding: 1.75rem 1rem;
    text-align: center; display: flex; flex-direction: column; align-items: center;
    gap: 0.5rem; background-color: var(--bg-secondary); cursor: pointer;
    &:hover { border-color: var(--color-primary); background-color: var(--bg-tertiary); }
    .upload-icon { font-size: 2rem; color: var(--color-primary); }
    .upload-title { margin: 0; font-size: 0.8rem; color: var(--text-primary); .highlight { color: var(--color-primary); } }
    .upload-subtitle { margin: 0; font-size: 0.68rem; color: var(--text-secondary); }
  }

  .modal-footer {
    padding: 0.85rem 1.25rem; border-top: 1px solid var(--border-color); background-color: var(--bg-secondary);
    display: flex; justify-content: flex-end; gap: 0.5rem;

    .modal-btn {
      padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.78rem; font-weight: 500; cursor: pointer;
      &.primary { background-color: var(--color-primary); color: white; border: none; }
      &.secondary { background-color: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-secondary); }
    }
  }
}

/* ---- 动画与动画曲线 ---- */
.chat-panel-slide-enter-active, .chat-panel-slide-leave-active { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.chat-panel-slide-enter-from, .chat-panel-slide-leave-to { transform: translateX(100%); }

.tree-expand-enter-active, .tree-expand-leave-active { transition: max-height 0.25s ease, opacity 0.2s; max-height: 200px; }
.tree-expand-enter-from, .tree-expand-leave-to { max-height: 0; opacity: 0; }

@keyframes pulseGlow {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}

@keyframes floatUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.glass-toast-notification {
  position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%);
  background: rgba(17, 24, 39, 0.75); backdrop-filter: blur(16px);
  border: 1px solid rgba(59, 130, 246, 0.35); padding: 0.6rem 1.25rem;
  border-radius: 10px; display: flex; align-items: center; gap: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); z-index: 1000;
  animation: floatUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  .toast-icon { font-size: 1.1rem; color: var(--color-primary); }
  .toast-text { font-size: 0.78rem; color: #f3f4f6; font-weight: 500; }
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.25s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translate(-50%, 12px); }
</style>
