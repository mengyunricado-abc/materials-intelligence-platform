import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileItem, Project, Session, Message, ContextRef } from '../types/index'

/**
 * @vibe-intent 控制台工作空间核心状态管理 Store，阶段五升级：
 * 1. 文件体系升级为 Project > Folder > File 三级结构；
 * 2. 移除 pdf/csv，白名单收窄至 word/xlsx/md；
 * 3. 上下文引用从 FileItem[] 升级为 ContextRef[]，支持整个项目引用。
 * @vibe-model Claude Sonnet 4.6 (Thinking)
 * @vibe-ref intents.md#2026-05-21
 */
export const useWorkspaceStore = defineStore('workspace', () => {
  // --- 状态 (State) ---

  // 1. 项目/文件树（三级结构，白名单：word/xlsx/md）
  const projects = ref<Project[]>([
    {
      id: 'proj_1',
      name: '锂电池材料研究',
      expanded: true,
      folders: [
        {
          id: 'folder_1',
          name: '实验数据',
          projectId: 'proj_1',
          expanded: true,
          files: [
            { id: 'f1', name: '电化学阻抗数据_2026.xlsx', type: 'xlsx', icon: 'mdi-file-excel', iconClass: 'text-success', folderId: 'folder_1', projectId: 'proj_1' },
            { id: 'f2', name: '循环充放电测试.xlsx', type: 'xlsx', icon: 'mdi-file-excel', iconClass: 'text-success', folderId: 'folder_1', projectId: 'proj_1' },
          ]
        },
        {
          id: 'folder_2',
          name: '实验报告',
          projectId: 'proj_1',
          expanded: false,
          files: [
            { id: 'f3', name: '材料微观结构分析报告.docx', type: 'docx', icon: 'mdi-file-word', iconClass: 'text-primary', folderId: 'folder_2', projectId: 'proj_1' },
            { id: 'f4', name: '实验总结.md', type: 'md', icon: 'mdi-language-markdown', iconClass: 'text-warning', folderId: 'folder_2', projectId: 'proj_1' },
          ]
        }
      ],
      files: [
        { id: 'f5', name: '研究计划.md', type: 'md', icon: 'mdi-language-markdown', iconClass: 'text-warning', projectId: 'proj_1' }
      ]
    },
    {
      id: 'proj_2',
      name: '文献综述',
      expanded: false,
      folders: [],
      files: [
        { id: 'f6', name: '锂电池技术综述框架.md', type: 'md', icon: 'mdi-language-markdown', iconClass: 'text-warning', projectId: 'proj_2' },
        { id: 'f7', name: '参考文献整理.docx', type: 'docx', icon: 'mdi-file-word', iconClass: 'text-primary', projectId: 'proj_2' },
      ]
    }
  ])

  // 2. 上下文引用（支持项目级 & 文件级）
  const contextRefs = ref<ContextRef[]>([])

  // 3. 对话会话与草稿
  const sessions = ref<Session[]>([
    { id: 's1', title: 'AI 在科学计算应用探讨', preview: '探索 AI 赋能科学计算的路径...', createdAt: new Date(), type: 'academic' },
    { id: 's2', title: '锂电池失效机理分析', preview: '基于拉曼光谱的 SEI 膜分析...', createdAt: new Date(Date.now() - 3600000), type: 'academic' },
    { id: 's3', title: '材料数据库检索策略', preview: '如何高效查询 ICSD...', createdAt: new Date(Date.now() - 86400000), type: 'academic' },
    { id: 's4', title: '电化学阻抗谱解析', preview: 'Nyquist 图的等效电路拟合...', createdAt: new Date(Date.now() - 172800000), type: 'academic' },
    { id: 's5', title: '实验方案设计', preview: '三电极体系的注意事项...', createdAt: new Date(Date.now() - 259200000), type: 'academic' },
  ])
  const activeSessionId = ref<string>('s1')
  const messages = ref<Message[]>([
    { id: 'm1', role: 'ai', content: '你好！我是材料智慧平台的科研助理。你可以通过 `@` 引用当前项目的文件，或使用 `/` 发起快捷指令。' }
  ])

  // 4. 中间编辑器文档与 Diff 状态
  const activeDocument = ref<string>('# 锂电池实验分析报告\n\n请在此处撰写或由 AI 辅助起草报告...')
  const isDiffMode = ref<boolean>(false)
  const originalContent = ref<string>('')
  const isEditorLocked = ref<boolean>(false)
  
  /**
   * @vibe-intent 问答主战场与知识库布局状态控制
   * @vibe-model Gemini 3.5 Flash (High)
   * @vibe-ref intents.md#2026-05-25
   */
  const currentMode = ref<'academic-search' | 'file-chat' | 'knowledge-qa'>('academic-search')
  const layoutType = ref<'center-chat' | 'right-chat'>('center-chat')
  const rightPanelWidth = ref<number>(380)
  const selectedFilesForChat = ref<FileItem[]>([])

  // --- 计算属性 ---

  /** 扁平化所有文件（用于 @ 引用菜单搜索） */
  const allFiles = computed<FileItem[]>(() => {
    const files: FileItem[] = []
    projects.value.forEach(proj => {
      proj.files.forEach(f => files.push(f))
      proj.folders.forEach(folder => {
        folder.files.forEach(f => files.push(f))
      })
    })
    return files
  })

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === activeSessionId.value)
  )

  // --- 行为 (Actions) ---

  /** 切换上下文引用（项目或文件） */
  function toggleContextRef(ref_: ContextRef) {
    const idx = contextRefs.value.findIndex(r => r.id === ref_.id && r.type === ref_.type)
    if (idx > -1) {
      contextRefs.value.splice(idx, 1)
    } else {
      contextRefs.value.push(ref_)
    }
    if (currentSession.value) {
      currentSession.value.contextRefs = [...contextRefs.value]
    }
  }

  function removeContextRef(id: string) {
    contextRefs.value = contextRefs.value.filter(r => r.id !== id)
    if (currentSession.value) {
      currentSession.value.contextRefs = [...contextRefs.value]
    }
  }

  function clearContextRefs() {
    contextRefs.value = []
    if (currentSession.value) {
      currentSession.value.contextRefs = []
    }
  }

  /** 展开/折叠项目 */
  function toggleProject(projectId: string) {
    const proj = projects.value.find(p => p.id === projectId)
    if (proj) proj.expanded = !proj.expanded
  }

  /** 展开/折叠文件夹 */
  function toggleFolder(projectId: string, folderId: string) {
    const proj = projects.value.find(p => p.id === projectId)
    if (!proj) return
    const folder = proj.folders.find(f => f.id === folderId)
    if (folder) folder.expanded = !folder.expanded
  }

  /**
   * @vibe-intent 添加消息并同步到当前 session。
   * T9: 拦截用户第一条消息，自动生成对话标题（截取前 10 字加 ...）
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-28
   */
  function addMessage(msg: Omit<Message, 'id'>) {
    const newMsg: Message = {
      ...msg,
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    messages.value.push(newMsg)

    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
      if (msg.role === 'user') {
        sessions.value[currentIdx].preview = msg.content.slice(0, 30)

        /**
         * @vibe-intent 首次提问若挂载文献，智能提取首个文件名融入标题，其余采用截字
         * @vibe-model Antigravity
         * @vibe-ref intents.md#2026-05-28
         */
        const isFirstUserMessage = messages.value.filter(m => m.role === 'user').length === 1
        if (isFirstUserMessage) {
          const currentSess = sessions.value[currentIdx]
          const firstFile = contextRefs.value.find(r => r.type === 'file')
          if (currentSess.type === 'knowledge' && firstFile) {
            currentSess.title = `关于 ${firstFile.name} 的文献精读`
          } else if (currentSess.title === '新科学对话' || (currentSess.title.startsWith('关于 ') && currentSess.title.endsWith('的科学探索'))) {
            currentSess.title = generateChatTitle(msg.content)
          }
        }
      }
    }
  }

  /**
   * T9: 标题自动生成函数（v1.0 临时实现：截取前 10 字）
   * TODO: 后续接入 LLM API 动态生成标题摘要
   */
  function generateChatTitle(firstMessage: string): string {
    const trimmed = firstMessage.trim().replace(/\n/g, ' ')
    if (trimmed.length <= 10) return trimmed
    return trimmed.slice(0, 10) + '...'
  }

  function cleanupEmptySessions() {
    sessions.value = sessions.value.filter(s => {
      if (s.id === activeSessionId.value) return true
      const hasRealMessages = s.messages && s.messages.some(m => m.role === 'user')
      if (hasRealMessages) return true
      if (s.title !== '新科学对话') return true
      return false
    })
  }

  function createSession(type: 'academic' | 'knowledge' | 'doc-edit' | 'tool-edit' = 'academic', fileId?: string) {
    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
      sessions.value[currentIdx].contextRefs = [...contextRefs.value]
    }
    cleanupEmptySessions()

    const newId = `s_${Date.now()}`
    const newSession: Session = {
      id: newId,
      title: '新科学对话',
      preview: '开始新的探索...',
      createdAt: new Date(),
      messages: [],
      type,
      fileId,
      contextRefs: [...contextRefs.value]
    }
    sessions.value.unshift(newSession)

    activeSessionId.value = newId
    let content = '你好！我是材料智慧平台的科研助理。请随时向我提问。'
    if (type === 'doc-edit') {
      content = '你好！我是您的文档编写助理。请随时针对当前文档向我提问，或通过 `@` 引用其他文件。'
    } else if (type === 'tool-edit') {
      content = '你好！我是您的工具运行助理。请随时针对当前工具的操作和计算参数向我提问，或通过 `@` 引用其他文件。'
    } else if (type === 'knowledge') {
      content = '你好！我是您的知识库精读助理。您可以输入任何关于当前分类目录的研究问题，我将为您深度精读并提炼文献精华。'
    }
    messages.value = [
      { id: `m_${Date.now()}`, role: 'ai', content }
    ]
    sessions.value[0].messages = [...messages.value]
  }

  function switchSession(sessionId: string) {
    if (sessionId === activeSessionId.value) return

    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
      sessions.value[currentIdx].contextRefs = [...contextRefs.value]
    }

    const targetSession = sessions.value.find(s => s.id === sessionId)
    if (targetSession) {
      activeSessionId.value = sessionId
      messages.value = targetSession.messages || []
      contextRefs.value = targetSession.contextRefs || []
    }

    cleanupEmptySessions()
  }

  function deleteSession(sessionId: string) {
    const idx = sessions.value.findIndex(s => s.id === sessionId)
    if (idx === -1) return

    sessions.value.splice(idx, 1)

    if (activeSessionId.value === sessionId) {
      if (sessions.value.length > 0) {
        switchSession(sessions.value[0].id)
      } else {
        createSession()
      }
    }
  }

  function hideSessionFromRecent(sessionId: string) {
    const sess = sessions.value.find(s => s.id === sessionId)
    if (sess) {
      sess.hiddenInRecent = true
      sessions.value = [...sessions.value]
    }
  }

  /**
   * @vibe-intent 新建文档保存时，原地物理升级临时会话，强制重新赋值触发深度响应式与 localStorage 持久化，防止双专属历史会话 Bug
   * @vibe-model Antigravity
   * @vibe-ref intents.md#2026-05-28
   */
  function upgradeDocSession(tempFileId: string, newFileId: string, newTitle: string) {
    const oldSession = sessions.value.find(s => s.type === 'doc-edit' && s.fileId === tempFileId)
    if (oldSession) {
      oldSession.fileId = newFileId
      oldSession.title = `${newTitle} 的专属对话`
      oldSession.preview = `开启文档《${newTitle}》的 AI 协同...`
      sessions.value = [...sessions.value]
    }
  }

  function loadOrCreateDocSession(fileId: string, docTitle?: string) {
    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
      sessions.value[currentIdx].contextRefs = [...contextRefs.value]
    }

    const existingSession = sessions.value.find(s => s.type === 'doc-edit' && s.fileId === fileId && !s.hiddenInRecent)
    if (existingSession) {
      switchSession(existingSession.id)
    } else {
      const newId = `s_doc_${fileId}_${Date.now()}`
      const newSession: Session = {
        id: newId,
        title: docTitle ? `${docTitle} 的专属对话` : '新科学对话',
        preview: '开启当前文档的 AI 协同...',
        createdAt: new Date(),
        messages: [],
        type: 'doc-edit',
        fileId,
        contextRefs: [...contextRefs.value]
      }
      sessions.value.unshift(newSession)
      activeSessionId.value = newId
      messages.value = [
        { id: `m_${Date.now()}`, role: 'ai', content: `你好！我是针对文档《${docTitle || '当前文档'}》的专属 AI 助手。本会话将针对当前文件进行智能写作，您可以随时在对话框中通过 @ 引用其他文件。` }
      ]
      newSession.messages = [...messages.value]

      sessions.value[0].messages = [...messages.value]

      cleanupEmptySessions()
    }
  }

  function loadOrCreateToolSession(toolId: string, toolTitle?: string) {
    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
      sessions.value[currentIdx].contextRefs = [...contextRefs.value]
    }

    const existingSession = sessions.value.find(s => s.type === 'tool-edit' && s.fileId === toolId && !s.hiddenInRecent)
    if (existingSession) {
      switchSession(existingSession.id)
    } else {
      const newId = `s_tool_${toolId}_${Date.now()}`
      const newSession: Session = {
        id: newId,
        title: toolTitle ? `${toolTitle} 的专属对话` : '新科学对话',
        preview: '开启工具的 AI 协同...',
        createdAt: new Date(),
        messages: [],
        type: 'tool-edit',
        fileId: toolId,
        contextRefs: [...contextRefs.value]
      }
      sessions.value.unshift(newSession)
      activeSessionId.value = newId
      messages.value = [
        { id: `m_${Date.now()}`, role: 'ai', content: `你好！我是针对计算工具《${toolTitle || '当前工具'}》的专属助理。您可以针对当前工具的操作参数、分析流程向我发起提问，或通过 @ 引用项目文件。` }
      ]
      newSession.messages = [...messages.value]

      cleanupEmptySessions()
    }
  }

  function loadOrCreateKnowledgeSession(kbId: string, kbTitle?: string) {
    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
      sessions.value[currentIdx].contextRefs = [...contextRefs.value]
    }

    const existingSession = sessions.value.find(s => s.type === 'knowledge' && s.fileId === kbId && !s.hiddenInRecent)
    if (existingSession) {
      switchSession(existingSession.id)
    } else {
      const newId = `s_kb_${kbId}_${Date.now()}`
      const newSession: Session = {
        id: newId,
        title: kbTitle ? `${kbTitle} 问答会话` : '新科学对话',
        preview: '开启知识库 AI 检索问答...',
        createdAt: new Date(),
        messages: [],
        type: 'knowledge',
        fileId: kbId,
        contextRefs: [...contextRefs.value]
      }
      sessions.value.unshift(newSession)
      activeSessionId.value = newId
      messages.value = [
        { id: `m_${Date.now()}`, role: 'ai', content: `你好！我是针对知识库《${kbTitle || '全局知识库'}》的 AI 助手。本会话已锁定为知识库专属问答，您可以输入任何研究问题，我将为您精读分析并提炼文献精华。` }
      ]
      newSession.messages = [...messages.value]

      cleanupEmptySessions()
    }
  }

  function createFileInFolder(projectId: string, folderId: string, fileName: string) {
    const proj = projects.value.find(p => p.id === projectId)
    if (!proj) return null
    const folder = proj.folders.find(f => f.id === folderId)
    if (!folder) return null

    const newFile: FileItem = {
      id: `f_${Date.now()}`,
      name: fileName,
      type: fileName.endsWith('.md') ? 'md' : (fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'docx' : 'xlsx'),
      icon: fileName.endsWith('.md') ? 'mdi-language-markdown' : (fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'mdi-file-word' : 'mdi-file-excel'),
      iconClass: fileName.endsWith('.md') ? 'text-warning' : (fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'text-primary' : 'text-success'),
      folderId,
      projectId
    }

    folder.files.push(newFile)
    folder.expanded = true
    proj.expanded = true
    return newFile
  }

  function createFileInProject(projectId: string, fileName: string) {
    const proj = projects.value.find(p => p.id === projectId)
    if (!proj) return null

    const newFile: FileItem = {
      id: `f_${Date.now()}`,
      name: fileName,
      type: fileName.endsWith('.md') ? 'md' : (fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'docx' : 'xlsx'),
      icon: fileName.endsWith('.md') ? 'mdi-language-markdown' : (fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'mdi-file-word' : 'mdi-file-excel'),
      iconClass: fileName.endsWith('.md') ? 'text-warning' : (fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'text-primary' : 'text-success'),
      projectId
    }

    proj.files.push(newFile)
    proj.expanded = true
    return newFile
  }

  function enterDiffMode(modified: string) {
    originalContent.value = activeDocument.value
    activeDocument.value = modified
    isDiffMode.value = true
  }

  function setEditorLock(locked: boolean) {
    isEditorLocked.value = locked
  }

  function applyDiff(accepted: boolean) {
    if (!accepted) {
      activeDocument.value = originalContent.value
    }
    isDiffMode.value = false
    originalContent.value = ''
    isEditorLocked.value = false
  }

  function updateDocument(content: string) {
    activeDocument.value = content
  }

  /**
   * @vibe-intent 问答与工作区状态流转 Actions
   * @vibe-model Gemini 3.5 Flash (High)
   * @vibe-ref intents.md#2026-05-25
   */
  function updateMode(mode: 'academic-search' | 'file-chat' | 'knowledge-qa') {
    currentMode.value = mode
    if (mode === 'knowledge-qa') {
      layoutType.value = 'right-chat'
    } else {
      layoutType.value = 'center-chat'
    }
  }

  function updateRightPanelWidth(width: number) {
    rightPanelWidth.value = Math.max(300, Math.min(600, width))
  }

  function addFileToChat(file: FileItem) {
    if (!selectedFilesForChat.value.some(f => f.id === file.id)) {
      selectedFilesForChat.value.push(file)
    }
  }

  function removeFileFromChat(fileId: string) {
    selectedFilesForChat.value = selectedFilesForChat.value.filter(f => f.id !== fileId)
  }

  function clearChatFiles() {
    selectedFilesForChat.value = []
  }

  return {
    projects,
    contextRefs,
    allFiles,
    sessions,
    activeSessionId,
    messages,
    activeDocument,
    isDiffMode,
    originalContent,
    isEditorLocked,
    currentSession,
    currentMode,
    layoutType,
    rightPanelWidth,
    selectedFilesForChat,
    toggleContextRef,
    removeContextRef,
    clearContextRefs,
    toggleProject,
    toggleFolder,
    addMessage,
    createSession,
    switchSession,
    deleteSession,
    hideSessionFromRecent,
    upgradeDocSession,
    loadOrCreateDocSession,
    loadOrCreateToolSession,
    loadOrCreateKnowledgeSession,
    createFileInFolder,
    createFileInProject,
    enterDiffMode,
    applyDiff,
    updateDocument,
    setEditorLock,
    updateMode,
    updateRightPanelWidth,
    addFileToChat,
    removeFileFromChat,
    clearChatFiles
  }

}, {
  persist: {
    pick: [
      'sessions', 
      'activeSessionId', 
      'messages', 
      'activeDocument', 
      'rightPanelWidth', 
      'currentMode', 
      'layoutType', 
      'selectedFilesForChat'
    ]
  }
})
