<template>
  <!--
   * @vibe-intent 独立历史对话管理页（/history），展示全量历史会话，
   * 支持搜索过滤、删除、点击切换到对应会话并跳转至 Console。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="history-page">
    <!-- 顶部标题区 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <span class="mdi mdi-history"></span>
          历史对话
        </h1>
        <span class="count-badge">{{ filteredSessions.length }} 条</span>
      </div>
      <div class="search-bar">
        <span class="mdi mdi-magnify search-icon"></span>
        <input
          v-model="searchQuery"
          placeholder="搜索历史对话..."
          class="search-input"
        />
      </div>
    </div>

    <!-- 会话类型分类 Tab 栏 -->
    <div class="history-tabs">
      <button class="tab-btn" :class="{ active: activeTypeTab === 'all' }" @click="activeTypeTab = 'all'">
        <span class="mdi mdi-forum-outline"></span> 全部会话
      </button>
      <button class="tab-btn" :class="{ active: activeTypeTab === 'academic' }" @click="activeTypeTab = 'academic'">
        <span class="mdi mdi-school"></span> 学术搜索问答
      </button>
      <button class="tab-btn" :class="{ active: activeTypeTab === 'knowledge' }" @click="activeTypeTab = 'knowledge'">
        <span class="mdi mdi-brain"></span> 知识库问答
      </button>
      <button class="tab-btn" :class="{ active: activeTypeTab === 'doc-edit' }" @click="activeTypeTab = 'doc-edit'">
        <span class="mdi mdi-file-document-edit-outline"></span> 控制台文档助手
      </button>
      <button class="tab-btn" :class="{ active: activeTypeTab === 'tool-edit' }" @click="activeTypeTab = 'tool-edit'">
        <span class="mdi mdi-toolbox-outline"></span> 工具运行助手
      </button>
    </div>

    <!-- 会话列表 -->
    <div class="sessions-grid">
      <div
        v-for="session in filteredSessions"
        :key="session.id"
        class="session-card"
        :class="{ active: session.id === activeSessionId }"
        @click="handleSelect(session)"
      >
        <div class="card-header">
          <div class="card-icon" :class="session.type">
            <span class="mdi" :class="getSessionIcon(session.type)"></span>
          </div>
          <div class="card-meta">
            <div class="card-title">{{ session.title || '新对话' }}</div>
            <div class="card-date">{{ formatDate(session.createdAt) }}</div>
          </div>
          <button class="del-btn" @click.stop="workspaceStore.deleteSession(session.id)" title="删除">
            <span class="mdi mdi-delete-outline"></span>
          </button>
        </div>
        <p class="card-preview">{{ session.preview || '暂无预览' }}</p>
        <div class="card-footer">
          <span class="msg-count" v-if="session.messages?.length">
            <span class="mdi mdi-message-text-outline"></span>
            {{ session.messages.length }} 条消息
          </span>
          <span class="open-btn">
            进入对话 <span class="mdi mdi-arrow-right"></span>
          </span>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="filteredSessions.length === 0">
        <span class="mdi mdi-chat-remove-outline"></span>
        <p>{{ searchQuery ? '未找到相关对话' : '暂无历史对话' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../stores/workspace'

import { useTabs } from '../composables/useTabs'

const router = useRouter()
const { openFileTab } = useTabs()
const workspaceStore = useWorkspaceStore()
const { sessions, activeSessionId } = storeToRefs(workspaceStore)

const searchQuery = ref('')
const activeTypeTab = ref('all')

const filteredSessions = computed(() => {
  let list = sessions.value
  
  if (activeTypeTab.value !== 'all') {
    list = list.filter(s => s.type === activeTypeTab.value)
  }

  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(
    s => s.title?.toLowerCase().includes(q) || s.preview?.toLowerCase().includes(q)
  )
})

const getSessionIcon = (type?: string) => {
  if (type === 'academic') return 'mdi-school'
  if (type === 'knowledge') return 'mdi-brain'
  if (type === 'doc-edit') return 'mdi-file-document-edit-outline'
  if (type === 'tool-edit') return 'mdi-toolbox-outline'
  return 'mdi-chat-processing-outline'
}

const handleSelect = (session: any) => {
  workspaceStore.switchSession(session.id)
  if (session.type === 'doc-edit' && session.fileId) {
    const file = workspaceStore.allFiles.find(f => f.id === session.fileId)
    if (file) {
      openFileTab(file)
    }
    router.push('/console')
  } else if (session.type === 'tool-edit' && session.fileId) {
    router.push(`/tools/run?toolId=${session.fileId}`)
  } else if (session.type === 'knowledge') {
    router.push(`/knowledge?sessionId=${session.id}&openChat=true`)
  } else {
    router.push('/chat')
  }
}

const formatDate = (date: Date | string) => {
  try {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = diff / (1000 * 60 * 60)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${Math.floor(hours)} 小时前`
    if (hours < 48) return '昨天'
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return '未知时间'
  }
}
</script>

<style scoped lang="scss">
.history-page {
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
  background-color: var(--bg-primary);
}

/* ---- 顶部标题区 ---- */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .page-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .mdi { color: var(--color-primary); }
  }

  .count-badge {
    background: rgba(59, 130, 246, 0.1);
    color: var(--color-primary);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.2rem 0.7rem;
    border-radius: 20px;
  }
}

/* ---- 搜索框 ---- */
.search-bar {
  position: relative;
  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    font-size: 1rem;
  }
}

.search-input {
  padding: 0.55rem 1rem 0.55rem 2.25rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  width: 280px;
  transition: all 0.2s;
  outline: none;

  &::placeholder { color: var(--text-secondary); }
  &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
}

/* ---- 会话分类 Tab 栏样式 ---- */
.history-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  flex-wrap: wrap;

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.9rem;
    border-radius: 20px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--text-primary);
      background-color: var(--bg-secondary);
    }

    &.active {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--color-primary);
      border-color: rgba(59, 130, 246, 0.2);
    }
  }
}

/* ---- 会话网格 ---- */
.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.session-card {
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    border-color: var(--border-focus);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.active {
    border-color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.04);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .mdi { font-size: 1.1rem; color: var(--color-primary); }
  
  &.academic { background: rgba(59, 130, 246, 0.12); .mdi { color: #3b82f6; } }
  &.knowledge { background: rgba(16, 185, 129, 0.12); .mdi { color: #10b981; } }
  &.doc-edit { background: rgba(139, 92, 246, 0.12); .mdi { color: #8b5cf6; } }
  &.tool-edit { background: rgba(245, 158, 11, 0.12); .mdi { color: #f59e0b; } }
}

.card-meta {
  flex: 1;
  min-width: 0;
  .card-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-date { font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.15rem; }
}

.del-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  opacity: 0.5;
  transition: all 0.2s;
  font-size: 1rem;
  display: flex;
  align-items: center;
  &:hover { opacity: 1; color: #ef4444; }
}

.card-preview {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.msg-count {
  font-size: 0.72rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  .mdi { font-size: 0.85rem; }
}

.open-btn {
  font-size: 0.78rem;
  color: var(--color-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  .mdi { font-size: 0.85rem; }
}

/* ---- 空状态 ---- */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  opacity: 0.6;
  text-align: center;
  .mdi { font-size: 3rem; }
  p { margin: 0; font-size: 0.9rem; }
}
</style>
