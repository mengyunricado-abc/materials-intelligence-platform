<template>
  <!--
   * @vibe-intent 核心三栏式控制台布局，集成文件树、编辑器和右侧 AI 助手。已实现聊天框 @引用 与 /快捷指令 联想菜单。
   * @vibe-model Gemini 3.1 Pro (High)
   * @vibe-ref intents.md#2026-04-24
  -->
  <div class="console-layout">
    <!-- Left Sidebar: Navigation & Resources -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-nav">
        <button class="nav-btn primary" title="New Chat">
          <span class="mdi mdi-plus"></span>
        </button>
        <div class="nav-divider"></div>
        <button class="nav-btn active" title="Files">
          <span class="mdi mdi-folder-outline"></span>
        </button>
        <button class="nav-btn" title="History">
          <span class="mdi mdi-history"></span>
        </button>
        <button class="nav-btn" title="Tools">
          <span class="mdi mdi-hammer-wrench"></span>
        </button>
        <div class="spacer"></div>
        <button class="nav-btn" @click="isSidebarCollapsed = !isSidebarCollapsed">
          <span class="mdi" :class="isSidebarCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"></span>
        </button>
        <button class="nav-btn" @click="goHome" title="Back to Portal">
          <span class="mdi mdi-home-outline"></span>
        </button>
      </div>
      
      <div class="sidebar-content" v-show="!isSidebarCollapsed">
        <div class="panel-header">
          <h3>项目文件</h3>
          <button class="icon-btn"><span class="mdi mdi-cloud-upload-outline"></span></button>
        </div>
        <div class="file-tree">
          <div class="file-item">
            <span class="mdi mdi-file-pdf-box text-danger"></span> 
            <span>参考文献.pdf</span>
          </div>
          <div class="file-item">
            <span class="mdi mdi-file-excel-box text-success"></span> 
            <span>实验数据.xlsx</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Workspace Area -->
    <main class="workspace">
      <header class="workspace-header">
        <div class="doc-info">
          <h2>未命名文档_01.md</h2>
          <span class="status-badge"><span class="mdi mdi-cloud-check"></span> 已保存</span>
        </div>
        <div class="workspace-actions">
          <button class="action-btn"><span class="mdi mdi-eye-outline"></span> 预览</button>
          <button class="action-btn primary"><span class="mdi mdi-export"></span> 导出</button>
        </div>
      </header>
      
      <div class="workspace-content">
        <router-view></router-view>
      </div>
    </main>

    <!-- Right Sidebar: AI Copilot -->
    <aside class="copilot" :class="{ collapsed: isCopilotCollapsed }">
      <div class="copilot-header">
        <div class="header-title">
          <span class="mdi mdi-robot-outline"></span> 
          <span v-show="!isCopilotCollapsed">AI 助手</span>
        </div>
        <button class="icon-btn" @click="isCopilotCollapsed = !isCopilotCollapsed">
          <span class="mdi" :class="isCopilotCollapsed ? 'mdi-chevron-left' : 'mdi-chevron-right'"></span>
        </button>
      </div>
      
      <div class="chat-container" v-show="!isCopilotCollapsed">
        <div class="context-bar">
          <span class="context-label">已引用:</span>
          <span class="context-chip"><span class="mdi mdi-file-excel-box"></span> 实验数据.xlsx</span>
        </div>
        
        <div class="chat-messages">
          <div class="message ai">
            <div class="avatar"><span class="mdi mdi-robot-outline"></span></div>
            <div class="content">
              您好！我已经读取了相关的实验数据。请问需要我为您分析数据或是起草报告的哪一部分？
            </div>
          </div>
          <!-- Placeholder for chat simulation -->
        </div>
        
        <div class="chat-input-area">
          <!-- Mention Menu -->
          <div class="mention-menu" v-if="mentionState.visible">
            <div class="menu-header">{{ mentionState.type === '@' ? '引用文件' : '快捷指令' }}</div>
            <div 
              class="menu-item" 
              v-for="(item, index) in filteredMentionList" 
              :key="index"
              :class="{ active: index === mentionState.selectedIndex }"
              @click="selectMention(item)"
              @mouseenter="mentionState.selectedIndex = index"
            >
              <span class="mdi" :class="item.icon"></span>
              <div class="item-text">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-desc" v-if="item.desc">{{ item.desc }}</div>
              </div>
            </div>
            <div class="menu-empty" v-if="filteredMentionList.length === 0">无匹配项</div>
          </div>
          
          <div class="input-wrapper">
            <textarea 
              v-model="chatInput"
              placeholder="输入问题或指令 (输入 @ 引用文件)..." 
              rows="1"
              @input="handleInput"
              @keydown="handleKeyDown"
            ></textarea>
            <button class="attach-btn"><span class="mdi mdi-paperclip"></span></button>
            <button class="send-btn" @click="sendMessage"><span class="mdi mdi-send"></span></button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSidebarCollapsed = ref(false)
const isCopilotCollapsed = ref(false)

const goHome = () => {
  router.push('/')
}

// Chat & Mention Logic
const chatInput = ref('')

const files = [
  { id: 'curr', title: '当前文档', icon: 'mdi-file-document-outline', desc: '当前正在编辑的文档' },
  { id: 'f1', title: '参考文献.pdf', icon: 'mdi-file-pdf-box text-danger', desc: '项目文件' },
  { id: 'f2', title: '实验数据.xlsx', icon: 'mdi-file-excel-box text-success', desc: '项目文件' }
]

const commands = [
  { id: 'diff', title: '/diff', icon: 'mdi-file-compare', desc: '强制进入对比模式' },
  { id: 'graph', title: '/graph', icon: 'mdi-chart-line', desc: '调用图表可视化工具' },
  { id: 'format', title: '/format', icon: 'mdi-format-align-left', desc: '格式化当前文档' }
]

const mentionState = ref({
  visible: false,
  type: '@', // '@' or '/'
  query: '',
  selectedIndex: 0,
  cursorPosition: 0
})

const filteredMentionList = computed(() => {
  const list = mentionState.value.type === '@' ? files : commands
  if (!mentionState.value.query) return list
  return list.filter(item => item.title.toLowerCase().includes(mentionState.value.query.toLowerCase()))
})

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  const val = target.value
  const cursor = target.selectionStart

  // Simple heuristic to detect trigger
  const textBeforeCursor = val.slice(0, cursor)
  const atMatch = textBeforeCursor.match(/(?:^|\s)@(\S*)$/)
  const slashMatch = textBeforeCursor.match(/(?:^|\s)\/(\S*)$/)

  if (atMatch) {
    mentionState.value.visible = true
    mentionState.value.type = '@'
    mentionState.value.query = atMatch[1]
    mentionState.value.cursorPosition = cursor - atMatch[1].length - 1
  } else if (slashMatch) {
    mentionState.value.visible = true
    mentionState.value.type = '/'
    mentionState.value.query = slashMatch[1]
    mentionState.value.cursorPosition = cursor - slashMatch[1].length - 1
  } else {
    mentionState.value.visible = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!mentionState.value.visible) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    mentionState.value.selectedIndex = (mentionState.value.selectedIndex + 1) % filteredMentionList.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mentionState.value.selectedIndex = (mentionState.value.selectedIndex - 1 + filteredMentionList.value.length) % filteredMentionList.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredMentionList.value.length > 0) {
      selectMention(filteredMentionList.value[mentionState.value.selectedIndex])
    }
  } else if (e.key === 'Escape') {
    mentionState.value.visible = false
  }
}

const selectMention = (item: any) => {
  const val = chatInput.value
  const pos = mentionState.value.cursorPosition
  
  // Find the end of the query string
  let endPos = pos + 1
  while (endPos < val.length && !/\s/.test(val[endPos])) {
    endPos++
  }
  
  const insertText = mentionState.value.type === '@' ? `[@${item.title}] ` : `${item.title} `
  
  chatInput.value = val.slice(0, pos) + insertText + val.slice(endPos)
  mentionState.value.visible = false
  
  // Set focus back (requires ref in a real scenario, assuming native v-model updates DOM quickly)
  nextTick(() => {
    const textarea = document.querySelector('.chat-input-area textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.focus()
      const newPos = pos + insertText.length
      textarea.setSelectionRange(newPos, newPos)
    }
  })
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  // Mock sending message
  chatInput.value = ''
  mentionState.value.visible = false
}
</script>

<style scoped lang="scss">
.console-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* --- Left Sidebar --- */
.sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  display: flex;
  transition: width 0.3s ease;
  
  &.collapsed {
    width: 60px;
  }
}

.sidebar-nav {
  width: 60px;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  border-right: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  
  .nav-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    width: 40px;
    height: 40px;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: all 0.2s;
    
    &:hover {
      color: var(--text-primary);
      background-color: var(--bg-tertiary);
    }
    
    &.active {
      color: var(--color-primary);
      background-color: rgba(59, 130, 246, 0.1);
    }
    
    &.primary {
      color: var(--color-primary);
      border: 1px dashed var(--color-primary);
    }
  }
  
  .nav-divider {
    width: 24px;
    height: 1px;
    background-color: var(--border-color);
    margin: 0.5rem 0 1rem;
  }
  
  .spacer {
    flex: 1;
  }
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    
    h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .file-tree {
    padding: 0.5rem;
    flex: 1;
    overflow-y: auto;
    
    .file-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-secondary);
      transition: background 0.2s;
      
      &:hover {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
      }
      
      .text-danger { color: var(--color-danger); }
      .text-success { color: var(--color-success); }
    }
  }
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
}

/* --- Main Workspace --- */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Important for flex children to allow text truncation */
}

.workspace-header {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  
  .doc-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    h2 {
      margin: 0;
      font-size: 1.1rem;
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
      
      &:hover {
        background-color: var(--bg-secondary);
      }
      
      &.primary {
        background-color: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
        
        &:hover {
          background-color: var(--color-primary-hover);
        }
      }
    }
  }
}

.workspace-content {
  flex: 1;
  overflow: hidden;
  background-color: var(--bg-secondary); /* Darker background for editor wrapper */
  display: flex;
}

/* --- Copilot Sidebar --- */
.copilot {
  width: var(--copilot-width);
  background-color: var(--bg-tertiary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  
  &.collapsed {
    width: 50px;
    
    .header-title {
      justify-content: center;
      width: 100%;
    }
  }
}

.copilot-header {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  border-bottom: 1px solid var(--border-color);
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.context-bar {
  padding: 0.5rem 1rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  
  .context-label {
    color: var(--text-secondary);
  }
  
  .context-chip {
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--text-primary);
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  .message {
    display: flex;
    gap: 1rem;
    
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--color-primary);
      flex-shrink: 0;
    }
    
    .content {
      background-color: var(--bg-secondary);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border-top-left-radius: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--text-primary);
    }
  }
}

.chat-input-area {
  position: relative;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
  
  .input-wrapper {
    position: relative;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background-color: var(--bg-primary);
    padding: 0.5rem;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    
    &:focus-within {
      border-color: var(--color-primary);
    }
    
    textarea {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      resize: none;
      color: var(--text-primary);
      font-family: inherit;
      padding: 0.25rem;
      max-height: 150px;
      font-size: 0.875rem;
      
      &::placeholder {
        color: var(--text-secondary);
      }
    }
    
    .attach-btn, .send-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      &:hover {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
      }
    }
    
    .send-btn {
      background-color: var(--color-primary);
      color: white;
      
      &:hover {
        background-color: var(--color-primary-hover);
        color: white;
      }
    }
  }
}

.mention-menu {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 1rem;
  right: 1rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  padding: 0.5rem 0;
  z-index: 50;
  max-height: 250px;
  overflow-y: auto;
  
  .menu-header {
    padding: 0.25rem 1rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover, &.active {
      background-color: var(--bg-secondary);
    }
    
    .mdi {
      font-size: 1.25rem;
      color: var(--text-secondary);
    }
    
    .text-danger { color: var(--color-danger); }
    .text-success { color: var(--color-success); }
    
    .item-text {
      display: flex;
      flex-direction: column;
      
      .item-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .item-desc {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
  }
  
  .menu-empty {
    padding: 1rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}
</style>
