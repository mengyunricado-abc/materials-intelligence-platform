/**
 * @vibe-intent 全局共享类型定义，为阶段二各组件提供统一的数据结构契约。
 * @vibe-model Claude Sonnet 4.6
 * @vibe-ref intents.md#2026-04-27
 */

export interface FileItem {
  id: string
  name: string
  type: 'pdf' | 'xlsx' | 'md' | 'csv' | 'other'
  /** MDI 图标类名，如 mdi-file-pdf-box */
  icon: string
  /** 图标颜色辅助类，如 text-danger */
  iconClass?: string
}

export interface Session {
  id: string
  title: string
  preview: string
  createdAt: Date
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
