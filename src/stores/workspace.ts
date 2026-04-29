import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileItem, Session, Message } from '../types/index'

/**
 * @vibe-intent 控制台工作空间核心状态管理 Store，打通左中右三栏交互并实现局部数据持久化。
 * @vibe-model Gemini 3 Flash
 * @vibe-ref intents.md#2026-04-28
 */
export const useWorkspaceStore = defineStore('workspace', () => {
  // --- 状态 (State) ---
  // 1. 文件与上下文 (不需要持久化)
  const files = ref<FileItem[]>([
    { id: '1', name: '实验数据_锂电池_2026.csv', type: 'csv', icon: 'mdi-file-table', iconClass: 'text-success' },
    { id: '2', name: '材料微观结构分析.pdf', type: 'pdf', icon: 'mdi-file-pdf-box', iconClass: 'text-danger' },
    { id: '3', name: '文献综述框架.md', type: 'md', icon: 'mdi-file-document', iconClass: 'text-primary' }
  ])
  const selectedFileIds = ref<string[]>([])

  // 2. 对话会话与草稿 (需要持久化)
  const sessions = ref<Session[]>([
    { id: 's1', title: 'AI 在科学计算应用探讨', preview: '探索 AI 赋能科学计算的路径...', createdAt: new Date() }
  ])
  const activeSessionId = ref<string>('s1')
  const messages = ref<Message[]>([
    { id: 'm1', role: 'ai', content: '你好！我是材料智慧平台的科研助理。你可以通过 `@` 引用当前项目的文件，或使用 `/` 发起快捷指令。' }
  ])

  // 3. 中间编辑器文档与 Diff 状态 (文档需要持久化，Diff 态无需)
  const activeDocument = ref<string>('# 锂电池实验分析报告\n\n请在此处撰写或由 AI 辅助起草报告...')
  const isDiffMode = ref<boolean>(false)
  const originalContent = ref<string>('')
  const isEditorLocked = ref<boolean>(false)

  // --- 计算属性 (Getters) ---


  const selectedFiles = computed(() => 
    files.value.filter(f => selectedFileIds.value.includes(f.id))
  )

  const currentSession = computed(() => 
    sessions.value.find(s => s.id === activeSessionId.value)
  )

  // --- 行为 (Actions) ---
  function toggleFileSelection(fileId: string) {
    const index = selectedFileIds.value.indexOf(fileId)
    if (index > -1) {
      selectedFileIds.value.splice(index, 1)
    } else {
      selectedFileIds.value.push(fileId)
    }
  }

  function selectFileByIds(ids: string[]) {
    selectedFileIds.value = [...ids]
  }

  function addMessage(msg: Omit<Message, 'id'>) {
    const newMsg: Message = {
      ...msg,
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    messages.value.push(newMsg)
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
    files,
    selectedFileIds,
    selectedFiles,
    sessions,
    activeSessionId,
    messages,
    activeDocument,
    isDiffMode,
    originalContent,
    isEditorLocked,
    currentSession,
    toggleFileSelection,
    selectFileByIds,
    addMessage,
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

