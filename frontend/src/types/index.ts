/**
 * @vibe-intent 全局共享类型定义：新增 Project/Folder 层级结构，收窄 FileItem.type 白名单（移除 pdf/csv），
 * 为 UI/UX 阶段五改造（全局侧边栏、文件三级树、工具订阅）提供统一数据契约。
 * @vibe-model Claude Sonnet 4.6 (Thinking)
 * @vibe-ref intents.md#2026-05-21
 */

/** 单个文件项（白名单：仅支持 word / xlsx / md） */
export interface FileItem {
  id: string
  name: string
  type: 'docx' | 'doc' | 'xlsx' | 'xls' | 'md' | 'other'
  /** MDI 图标类名，如 mdi-file-word */
  icon: string
  /** 图标颜色辅助类，如 text-blue */
  iconClass?: string
  folderId?: string
  projectId?: string
}

/** 文件夹（第二层） */
export interface Folder {
  id: string
  name: string
  projectId: string
  files: FileItem[]
  expanded?: boolean
}

/** 项目（第一层） */
export interface Project {
  id: string
  name: string
  folders: Folder[]
  /** 未归属文件夹的散落文件 */
  files: FileItem[]
  expanded?: boolean
}

export interface Session {
  id: string
  title: string
  preview: string
  createdAt: Date
  messages?: Message[]
}

export interface Message {
  id: string
  /** user: 用户消息; ai: AI 回复; action-card: 可操作卡片（触发 Diff 预览） */
  role: 'user' | 'ai' | 'action-card'
  content: string
  /** 仅 role === 'action-card' 时有效 */
  actionCard?: {
    title: string
    description?: string
  }
}

export interface Command {
  id: string
  /** 展示给用户的指令文本，如 /diff */
  title: string
  icon: string
  desc: string
}

/** AI 上下文引用项（可以是整个项目或单个文件） */
export interface ContextRef {
  type: 'project' | 'file'
  id: string
  name: string
  icon: string
}
