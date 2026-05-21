import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileItem, Project, Folder, Session, Message, ContextRef } from '../types/index'

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
    { id: 's1', title: 'AI 在科学计算应用探讨', preview: '探索 AI 赋能科学计算的路径...', createdAt: new Date() },
    { id: 's2', title: '锂电池失效机理分析', preview: '基于拉曼光谱的 SEI 膜分析...', createdAt: new Date(Date.now() - 3600000) },
    { id: 's3', title: '材料数据库检索策略', preview: '如何高效查询 ICSD...', createdAt: new Date(Date.now() - 86400000) },
    { id: 's4', title: '电化学阻抗谱解析', preview: 'Nyquist 图的等效电路拟合...', createdAt: new Date(Date.now() - 172800000) },
    { id: 's5', name: '实验方案设计', preview: '三电极体系的注意事项...', createdAt: new Date(Date.now() - 259200000) } as any,
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
  }

  function removeContextRef(id: string) {
    contextRefs.value = contextRefs.value.filter(r => r.id !== id)
  }

  function clearContextRefs() {
    contextRefs.value = []
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
      }
    }
  }

  function createSession() {
    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
    }

    const newId = `s_${Date.now()}`
    const newSession: Session = {
      id: newId,
      title: '新对话',
      preview: '开始新的探索...',
      createdAt: new Date(),
      messages: []
    }
    sessions.value.unshift(newSession)

    activeSessionId.value = newId
    messages.value = [
      { id: `m_${Date.now()}`, role: 'ai', content: '你好！我是材料智慧平台的科研助理。请随时向我提问。' }
    ]
    sessions.value[0].messages = [...messages.value]
  }

  function switchSession(sessionId: string) {
    if (sessionId === activeSessionId.value) return

    const currentIdx = sessions.value.findIndex(s => s.id === activeSessionId.value)
    if (currentIdx > -1) {
      sessions.value[currentIdx].messages = [...messages.value]
    }

    const targetSession = sessions.value.find(s => s.id === sessionId)
    if (targetSession) {
      activeSessionId.value = sessionId
      messages.value = targetSession.messages || []
    }
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
    toggleContextRef,
    removeContextRef,
    clearContextRefs,
    toggleProject,
    toggleFolder,
    addMessage,
    createSession,
    switchSession,
    deleteSession,
    enterDiffMode,
    applyDiff,
    updateDocument,
    setEditorLock
  }

}, {
  persist: {
    pick: ['sessions', 'activeSessionId', 'messages', 'activeDocument']
  }
})
