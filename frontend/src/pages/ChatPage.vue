<template>
  <!--
   * @vibe-intent 全局 AI 学术问答与多文件对话主战场
   * @vibe-model Gemini 3.5 Flash (High)
   * @vibe-ref intents.md#2026-05-25
   -->
  <div class="chat-page-container">
    <!-- ======== Middle: 主对话流展示区 ======== -->
    <main class="chat-main-area">
      <header class="chat-header">
        <div class="chat-title-info">
          <span class="mdi" :class="workspaceStore.currentMode === 'academic-search' ? 'mdi-school-outline' : 'mdi-file-document-multiple-outline'"></span>
          <h2>{{ workspaceStore.currentMode === 'academic-search' ? '学术搜索对话' : '多篇文件对话' }}</h2>
        </div>
        <div class="mode-badge" :class="workspaceStore.currentMode">
          {{ workspaceStore.currentMode === 'academic-search' ? '学术模式' : '文件模式' }}
        </div>
      </header>

      <!-- 对话气泡容器 -->
      <div class="chat-messages-scroller" ref="messagesScrollerRef">
        <div class="welcome-box" v-if="workspaceStore.messages.length === 0">
          <span class="mdi mdi-forum-outline large-chat-icon"></span>
          <h3>智慧材料 AI 科学对话</h3>
          <p>请输入您的科学问题，我们将为您检索全球参考文献并实时分析。</p>
        </div>

        <div v-else class="message-list">
          <div 
            v-for="msg in workspaceStore.messages" 
            :key="msg.id" 
            class="msg-bubble-wrap"
            :class="msg.role"
          >
            <div class="avatar-holder">
              <span class="mdi" :class="msg.role === 'user' ? 'mdi-account' : 'mdi-robot'"></span>
            </div>
            
            <div class="msg-bubble-content">
              <div class="sender-name">{{ msg.role === 'user' ? '张博士' : '智慧材料助理' }}</div>
              
              <!-- AI 回答支持 Markdown 解析 -->
              <div 
                class="bubble-text markdown-body" 
                v-if="msg.role === 'ai'" 
                v-html="renderMarkdown(msg.content)"
              ></div>
              <div class="bubble-text" v-else>{{ msg.content }}</div>

              <!-- 如果是 AI 生成的文档修改卡片，可点击跳转协同编辑 -->
              <div class="action-card-widget" v-if="msg.actionCard">
                <span class="mdi mdi-file-edit-outline widget-icon"></span>
                <div class="widget-info">
                  <h4>{{ msg.actionCard.title }}</h4>
                  <p>{{ msg.actionCard.description }}</p>
                </div>
                <button class="widget-action-btn" @click="handleJumpToEditor">
                  <span class="mdi mdi-arrow-right-bold-circle"></span>
                  <span>进入工作台</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Thinking 动效 -->
          <div class="msg-bubble-wrap ai" v-if="isThinking">
            <div class="avatar-holder">
              <span class="mdi mdi-robot"></span>
            </div>
            <div class="msg-bubble-content">
              <div class="sender-name">智慧材料助理</div>
              <div class="bubble-text thinking-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入框区 -->
      <footer class="chat-input-area">
        <div class="chat-input-box">
          <textarea 
            v-model="inputPrompt" 
            placeholder="询问任何科学问题，或继续深入文件分析..."
            rows="1"
            @keydown.enter.prevent="sendChatMessage"
            @input="resizeTextarea"
            ref="textareaRef"
          ></textarea>
          
          <button class="send-message-btn" @click="sendChatMessage" :disabled="!inputPrompt.trim() || isThinking">
            <span class="mdi mdi-send"></span>
          </button>
        </div>
      </footer>
    </main>

    <!-- ======== Right: 参考文献与搜索结果 / 多文件关联面板 ======== -->
    <aside class="chat-right-panel">
      <!-- 模式一：学术搜索参考文献列表 -->
      <div class="panel-section-wrap" v-if="workspaceStore.currentMode === 'academic-search'">
        <div class="panel-header">
          <span class="mdi mdi-format-list-numbered"></span>
          <h3>学术参考文献 ({{ mockReferences.length }})</h3>
        </div>
        
        <div class="references-list">
          <div 
            v-for="(refItem, index) in mockReferences" 
            :key="refItem.id" 
            class="ref-card"
          >
            <div class="ref-card-header">
              <span class="ref-num">[{{ index + 1 }}]</span>
              <span class="ref-score"><span class="mdi mdi-star-outline"></span> 关联度: {{ refItem.score }}%</span>
            </div>
            <h4 class="ref-title">{{ refItem.title }}</h4>
            <div class="ref-meta">{{ refItem.authors }} · {{ refItem.journal }} ({{ refItem.year }})</div>
            <p class="ref-abstract" v-show="expandedRefId === refItem.id">{{ refItem.abstract }}</p>
            
            <div class="ref-actions">
              <button class="ref-action-btn text-btn" @click="toggleExpandRef(refItem.id)">
                <span class="mdi" :class="expandedRefId === refItem.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"></span>
                <span>{{ expandedRefId === refItem.id ? '收起摘要' : '查看摘要' }}</span>
              </button>
              <button class="ref-action-btn link-btn" @click="applyReferenceToContext(refItem)">
                <span class="mdi mdi-plus-circle-outline"></span>
                <span>引用</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 模式二：文件对话 - 文件关联面板 -->
      <div class="panel-section-wrap" v-else>
        <div class="panel-header">
          <span class="mdi mdi-file-document-multiple-outline"></span>
          <h3>关联文件管理 ({{ workspaceStore.selectedFilesForChat.length }})</h3>
        </div>

        <div class="file-chat-manager">
          <div class="file-uploader-dropzone" @click="triggerFileUpload">
            <span class="mdi mdi-cloud-upload-outline upload-icon"></span>
            <h4>拖拽或点击上传科研文档</h4>
            <p>支持 Word (.docx) & Markdown (.md) 文件分析</p>
            <input type="file" ref="fileInputRef" style="display: none" @change="onFileUploaded" accept=".docx,.doc,.md,.xlsx,.xls" />
          </div>

          <!-- 上传进度条 -->
          <div class="upload-progress-box" v-if="isUploading">
            <div class="progress-info">
              <span>{{ uploadingFileName }}</span>
              <span>解析中... {{ uploadProgress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
            </div>
          </div>

          <!-- 已关联的文件列表 -->
          <div class="associated-files-list">
            <div 
              v-for="file in workspaceStore.selectedFilesForChat" 
              :key="file.id" 
              class="associated-file-card"
            >
              <span class="mdi file-icon" :class="file.icon || 'mdi-file-document-outline'"></span>
              <div class="file-info" @click="openAndEditFile(file)" title="点击进入协同编辑器">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-status-badge parsed">
                  <span class="mdi mdi-check-circle"></span> 已解析
                </span>
              </div>
              <button class="remove-file-btn" @click="workspaceStore.removeFileFromChat(file.id)" title="剔除本轮对话">
                <span class="mdi mdi-close"></span>
              </button>
            </div>

            <div class="empty-associated-hint" v-if="workspaceStore.selectedFilesForChat.length === 0">
              暂未关联任何文件。请上传或点击右侧参考文献进行多文件对话。
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧下方固定核心操作区 -->
      <div class="fixed-actions-footer">
        <button 
          class="footer-action-btn glass-btn" 
          @click="toggleMode"
        >
          <span class="mdi" :class="workspaceStore.currentMode === 'academic-search' ? 'mdi-file-document-multiple' : 'mdi-school'"></span>
          <span>{{ workspaceStore.currentMode === 'academic-search' ? '多篇文件对话' : '学术文献搜索' }}</span>
        </button>

        <button 
          class="footer-action-btn primary-glass-btn" 
          @click="openKnowledgeDialog"
        >
          <span class="mdi mdi-database-plus-outline"></span>
          <span>加入到知识库</span>
        </button>
      </div>
    </aside>

    <!-- ======== 磨砂玻璃 Dialog: 加入到知识库 ======== -->
    <transition name="dialog-fade">
      <div class="glass-dialog-overlay" v-if="isDialogVisible" @click.self="isDialogVisible = false">
        <div class="glass-dialog-box">
          <div class="dialog-header">
            <h3><span class="mdi mdi-folder-plus-outline"></span> 加入学术知识库</h3>
            <button class="close-dialog-btn" @click="isDialogVisible = false">
              <span class="mdi mdi-close"></span>
            </button>
          </div>
          
          <div class="dialog-body">
            <p class="dialog-intro">请选择您想要存入的已有知识库，或新建一个学术库空间。</p>

            <div class="form-group">
              <label>选择已有知识库</label>
              <div class="select-wrapper">
                <select v-model="selectedKbId" :disabled="isCreatingNewKb">
                  <option value="" disabled>-- 请选择已有库 --</option>
                  <option 
                    v-for="proj in workspaceStore.projects" 
                    :key="proj.id" 
                    :value="proj.id"
                  >
                    {{ proj.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="dialog-divider">
              <span>或</span>
            </div>

            <div class="form-group">
              <div class="checkbox-row">
                <input type="checkbox" id="create-new-kb-chk" v-model="isCreatingNewKb" />
                <label for="create-new-kb-chk">新建学术知识库</label>
              </div>
              <input 
                type="text" 
                v-model="newKbName" 
                placeholder="请输入新知识库名称..." 
                v-if="isCreatingNewKb"
                class="text-input"
              />
            </div>
          </div>

          <div class="dialog-footer">
            <button class="dialog-btn secondary" @click="isDialogVisible = false">取消</button>
            <button class="dialog-btn primary" @click="submitToKnowledgeBase">提交存入</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ======== 磨砂玻璃 Toast 消息通知 ======== -->
    <transition name="toast-slide">
      <div class="glass-toast-card" v-if="isToastVisible">
        <span class="mdi mdi-check-decagram toast-icon"></span>
        <div class="toast-content">
          <h4>操作成功</h4>
          <p>已成功存入知识库空间！</p>
        </div>
        <button class="toast-action-btn" @click="jumpToKnowledgeBase">
          <span>前往查看</span>
          <span class="mdi mdi-arrow-right"></span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkspaceStore } from '../stores/workspace'
import { useTabs } from '../composables/useTabs'
import { marked } from 'marked'
import type { FileItem } from '../types/index'

const route = useRoute()
const router = useRouter()
const workspaceStore = useWorkspaceStore()
const { openFileTab } = useTabs()

// 状态定义
const inputPrompt = ref('')
const isThinking = ref(false)
const expandedRefId = ref<string | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const messagesScrollerRef = ref<HTMLDivElement | null>(null)

// Dialog 状态
const isDialogVisible = ref(false)
const selectedKbId = ref('')
const isCreatingNewKb = ref(false)
const newKbName = ref('')

// Toast 状态
const isToastVisible = ref(false)

// 上传模拟
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadingFileName = ref('')
const uploadProgress = ref(0)

// 模拟参考文献数据
const mockReferences = ref([
  {
    id: 'ref_1',
    title: '锂离子电池富锂层状正极材料的研究进展与失效物理机制',
    authors: '陈院士, 王教授',
    journal: '先进材料技术杂志',
    year: '2025',
    score: 98,
    abstract: '本文系统论述了富锂层状正极材料在高电压循环过程中的失效表现形式。利用先进的球差校正透射电镜，揭示了微观过渡金属阳离子迁移导致的晶格重构动力学演变过程。'
  },
  {
    id: 'ref_2',
    title: '基于高维光谱关联拟合的电化学界面 SEI 膜微纳非均匀演变规律',
    authors: '张博士, 李研究员',
    journal: '国际物理化学学报',
    year: '2026',
    score: 91,
    abstract: '固体电解质界面（SEI）膜在三维空间尺度上的高度非均匀演化是电池容量急性跳变的首要成因。本文开发了流式共焦拉曼-原子力探针联用技术，以 10nm 空间分辨率还原了 SEI 锂离子通道阻塞的形态学演进。'
  },
  {
    id: 'ref_3',
    title: '固态电池高能量密度复合电解质膜制备及其全生命周期演化模型',
    authors: '周教授, 赵博士',
    journal: '储能材料科学',
    year: '2025',
    score: 85,
    abstract: '设计了一种高韧性、超薄固液复合固态电解质原位交联构筑流程，获得了全生命周期演化特征数据，并为后续智能多靶向 AI 解析提供了数值参考基础。'
  }
])

onMounted(() => {
  // 强制将对话流设为居中布局
  workspaceStore.updateMode('academic-search')
  
  // 检查是否有首发问题
  const firstQuery = route.query.q as string
  if (firstQuery) {
    inputPrompt.value = firstQuery
    sendChatMessage()
  }
})

// Markdown 渲染辅助
const renderMarkdown = (text: string) => {
  return marked(text) as string
}

// 消息滚动寻底
const scrollToBottom = async () => {
  await nextTick()
  if (messagesScrollerRef.value) {
    messagesScrollerRef.value.scrollTop = messagesScrollerRef.value.scrollHeight
  }
}

// 文本框高度自适应
const resizeTextarea = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 150) + 'px'
  }
}

// 发送 AI 对话
const sendChatMessage = () => {
  if (!inputPrompt.value.trim() || isThinking.value) return
  
  const userText = inputPrompt.value
  workspaceStore.addMessage({ role: 'user', content: userText })
  inputPrompt.value = ''
  resizeTextarea()
  scrollToBottom()

  // 模拟流式回答响应
  isThinking.value = true
  setTimeout(() => {
    isThinking.value = false
    
    // 如果包含“编辑”或“修改”字样，模拟生成修改建议的 action-card
    if (userText.includes('编辑') || userText.includes('报告') || userText.includes('修改') || userText.includes('阻抗')) {
      workspaceStore.addMessage({
        role: 'ai',
        content: `### 锂电池失效机理与阻抗分析

我已经为您系统地检索并提取了前沿参考文献的最新实验报告。基于对您提及的**电化学阻抗（EIS）数据**进行深度推演，我们发现固体电解质界面（SEI）膜的非均匀生长在 Nyquist 谱图上表现为中频区半圆半径的显著扩张。

我为您起草并生成了一份**「锂电池阻抗实验分析报告」**草稿。您可以直接点击下方的动作卡片穿越进入**协同编辑器**，我们支持对该 Markdown 总结报告进行双向实时协同交互与修改。`
      })

      // 压入动作卡片
      workspaceStore.messages.push({
        id: `m_widget_${Date.now()}`,
        role: 'action-card',
        content: '',
        actionCard: {
          title: '已为您定制起草实验报告草稿',
          description: '点击进入多标签协同工作台，一键协同润色与段落插入。'
        }
      })
    } else {
      workspaceStore.addMessage({
        role: 'ai',
        content: `### 关于您询问的内容的学术分析

根据多篇前沿高水平文献的共性共识，我们得出以下学术观点：
1. **晶格失稳成因**：富锂材料高压工作下的结构退化，主要源自晶体内部不可逆的氧释放，促使过渡金属（镍、钴、锰）发生晶格迁移，形成无序岩盐相。
2. **多尺度耦合规律**：电解质原位界面构建不仅改善了界面阻抗，更在物理形态上抑制了界面微应力的各向异性破损。

如果您想深入开展文件级别的实证分析，可以点击右侧下方 **[多篇文件对话]** 上传您的实验 Word 文档，以锁定更精确的参数。`
      })
    }
    
    scrollToBottom()
  }, 1800)
}

// 参考文献折叠展开
const toggleExpandRef = (id: string) => {
  if (expandedRefId.value === id) {
    expandedRefId.value = null
  } else {
    expandedRefId.value = id
  }
}

// 引用参考文献为上下文
const applyReferenceToContext = (refItem: any) => {
  // 模拟引用动作
  workspaceStore.toggleContextRef({
    id: refItem.id,
    name: refItem.title,
    type: 'file',
    fileType: 'md'
  })
}

// 切换学术/多文件对话模式
const toggleMode = () => {
  if (workspaceStore.currentMode === 'academic-search') {
    workspaceStore.updateMode('file-chat')
  } else {
    workspaceStore.updateMode('academic-search')
  }
}

// 协同卡片跳转到 console 工作台
const handleJumpToEditor = () => {
  // 模拟将该文档生成为工作区活动 Tab
  workspaceStore.updateDocument('# 锂电池实验分析报告\n\n## 实验背景与阻抗演变机制\n锂离子电池在高电压循环过程中，其内部电化学过程将发生不可逆重构。根据 EIS（电化学阻抗谱）Nyquist 曲线显示，中高频半圆的电荷转移电阻随着循环次数的累加呈现指数级上升趋势...\n')
  
  openFileTab({
    id: 'f4', // 绑定在 Pinia mock file f4 实验总结.md 上
    name: '实验总结.md',
    icon: 'mdi-language-markdown',
    iconClass: 'text-warning'
  })
  
  router.push('/console')
}

// 在右侧关联列表直接点击打开并编辑文件
const openAndEditFile = (file: FileItem) => {
  openFileTab(file)
  router.push('/console')
}

// 文件上传模拟
const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const onFileUploaded = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    uploadingFileName.value = file.name
    isUploading.value = true
    uploadProgress.value = 0
    
    const interval = setInterval(() => {
      uploadProgress.value += 20
      if (uploadProgress.value >= 100) {
        clearInterval(interval)
        isUploading.value = false
        
        // 推导类型并向 Pinia selectedFilesForChat 中压入
        const fileType = file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.md') ? 'md' : 'xlsx'
        const icon = fileType === 'docx' ? 'mdi-file-word' : fileType === 'md' ? 'mdi-language-markdown' : 'mdi-file-excel'
        const iconClass = fileType === 'docx' ? 'text-primary' : fileType === 'md' ? 'text-warning' : 'text-success'
        
        workspaceStore.addFileToChat({
          id: `upload_${Date.now()}`,
          name: file.name,
          type: fileType as any,
          icon,
          iconClass
        })
      }
    }, 150)
  }
}

// 弹出加入到知识库 Dialog
const openKnowledgeDialog = () => {
  isDialogVisible.value = true
}

// 提交存入知识库
const submitToKnowledgeBase = () => {
  isDialogVisible.value = false
  
  if (isCreatingNewKb.value && newKbName.value.trim()) {
    // 模拟向 Pinia store 注入一个新知识库（即 Project）
    workspaceStore.projects.push({
      id: `proj_${Date.now()}`,
      name: newKbName.value,
      expanded: false,
      folders: [],
      files: []
    })
    newKbName.value = ''
    isCreatingNewKb.value = false
  }
  
  // 弹出 Toast 通知
  isToastVisible.value = true
  setTimeout(() => {
    isToastVisible.value = false
  }, 4500)
}

// 跳转到知识库列表
const jumpToKnowledgeBase = () => {
  isToastVisible.value = false
  router.push('/knowledge')
}
</script>

<style scoped lang="scss">
.chat-page-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* ======== Middle: 主对话流区 ======== */
.chat-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--border-color);
}

.chat-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  flex-shrink: 0;

  .chat-title-info {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    .mdi {
      font-size: 1.25rem;
      color: var(--color-primary);
    }

    h2 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }
  }

  .mode-badge {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    
    &.academic-search {
      background: rgba(59, 130, 246, 0.1);
      color: var(--color-primary);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    
    &.file-chat {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }
  }
}

.chat-messages-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  scrollbar-width: thin;
  background-color: var(--bg-secondary);

  .welcome-box {
    text-align: center;
    max-width: 420px;
    margin: 15vh auto 0;
    padding: 2.5rem 1.5rem;
    background: var(--glass-bg);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    box-shadow: var(--shadow-sm);

    .large-chat-icon {
      font-size: 3rem;
      background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    h3 { margin: 1rem 0 0.5rem; font-size: 1.15rem; color: var(--text-primary); font-weight: 700; }
    p { margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; }
  }
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  max-width: 800px;
  margin: 0 auto;
}

.msg-bubble-wrap {
  display: flex;
  gap: 1rem;
  align-items: flex-start;

  .avatar-holder {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .msg-bubble-content {
    flex: 1;
    min-width: 0;

    .sender-name {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 0.35rem;
    }

    .bubble-text {
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.8rem 1rem;
      color: var(--text-primary);
      font-size: 0.88rem;
      line-height: 1.6;
      word-break: break-word;
      box-shadow: var(--shadow-sm);
    }
  }

  &.user {
    flex-direction: row-reverse;
    .avatar-holder {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.2);
      color: var(--color-primary);
    }
    .msg-bubble-content {
      text-align: right;
      .bubble-text {
        background-color: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
        display: inline-block;
        text-align: left;
      }
    }
  }
}

/* Action Card Widget 样式 */
.action-card-widget {
  margin-top: 0.75rem;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--color-primary);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: var(--shadow-md);
  
  .widget-icon {
    font-size: 1.75rem;
    color: var(--color-primary);
  }

  .widget-info {
    flex: 1;
    h4 { margin: 0 0 0.2rem; font-size: 0.82rem; color: var(--text-primary); font-weight: 600; }
    p { margin: 0; font-size: 0.7rem; color: var(--text-secondary); }
  }

  .widget-action-btn {
    background: var(--color-primary);
    border: none;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.45rem 0.8rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
    }
  }
}

/* Thinking 动效 */
.thinking-dots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: 24px;
  padding: 0 0.5rem !important;

  span {
    width: 6px;
    height: 6px;
    background-color: var(--text-secondary);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

.chat-input-area {
  padding: 1.25rem 2rem 1.5rem;
  background-color: var(--bg-primary);
  flex-shrink: 0;
  border-top: 1px solid var(--border-color);
}

.chat-input-box {
  max-width: 800px;
  margin: 0 auto;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s;

  &:focus-within {
    border-color: var(--color-primary);
  }

  textarea {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.88rem;
    resize: none;
    outline: none;
    line-height: 1.5;
    min-height: 24px;
    max-height: 150px;
    font-family: inherit;
    padding: 0.2rem 0;
    
    &::placeholder { color: var(--text-secondary); }
  }

  .send-message-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--color-primary);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      background: var(--bg-secondary);
      color: var(--text-secondary);
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: var(--color-primary-hover);
      transform: scale(1.03);
    }
  }
}

/* ======== Right: 参考文献与多文件关联区 ======== */
.chat-right-panel {
  width: 380px;
  background-color: var(--glass-bg, rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.panel-section-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.25rem 1.25rem 80px; /* 留出底部操作区高度 */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-shrink: 0;

  .mdi { font-size: 1.1rem; color: var(--color-primary); }
  h3 { margin: 0; font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
}

/* 参考文献卡片 */
.references-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ref-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.85rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;

  &:hover {
    border-color: var(--border-focus);
    transform: translateY(-1px);
  }

  .ref-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.65rem;
    margin-bottom: 0.35rem;

    .ref-num { font-weight: 700; color: var(--color-primary); }
    .ref-score { color: var(--color-success); font-weight: 500; }
  }

  .ref-title {
    margin: 0 0 0.35rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .ref-meta {
    font-size: 0.65rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .ref-abstract {
    font-size: 0.68rem;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border-radius: 6px;
    padding: 0.4rem 0.5rem;
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }

  .ref-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 0.4rem;

    .ref-action-btn {
      background: none;
      border: none;
      font-size: 0.65rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      transition: all 0.2s;

      &.text-btn {
        color: var(--text-secondary);
        &:hover { color: var(--text-primary); background: var(--bg-secondary); }
      }

      &.link-btn {
        color: var(--color-primary);
        &:hover { background: rgba(59, 130, 246, 0.1); }
      }
    }
  }
}

/* 多文件管理面板 */
.file-chat-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-uploader-dropzone {
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.01);
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.03);
  }

  .upload-icon {
    font-size: 2rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  h4 { margin: 0 0 0.25rem; font-size: 0.78rem; font-weight: 600; color: var(--text-primary); }
  p { margin: 0; font-size: 0.62rem; color: var(--text-secondary); }
}

.upload-progress-box {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  .progress-track {
    height: 4px;
    background: var(--bg-secondary);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: var(--color-primary);
    border-radius: 2px;
    transition: width 0.1s;
  }
}

.associated-files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.associated-file-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--border-focus);
  }

  .file-icon {
    font-size: 1.25rem;
  }

  .file-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    min-width: 0;

    .file-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-status-badge {
      font-size: 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.2rem;
      margin-top: 0.15rem;

      &.parsed { color: var(--color-success); }
    }
  }

  .remove-file-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    padding: 0.2rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    &:hover { color: var(--color-danger); background: var(--bg-secondary); }
  }

  .empty-associated-hint {
    text-align: center;
    padding: 1.5rem 1rem;
    font-size: 0.68rem;
    color: var(--text-secondary);
    opacity: 0.8;
  }
}

/* 右下固定操作区 */
.fixed-actions-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 68px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 0.5rem;
  z-index: 10;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.05);

  .footer-action-btn {
    flex: 1;
    height: 38px;
    border: none;
    border-radius: 8px;
    font-size: 0.72rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

    &.glass-btn {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      &:hover { background: var(--bg-secondary); border-color: var(--border-focus); }
    }

    &.primary-glass-btn {
      background: linear-gradient(135deg, var(--color-primary), rgba(59, 130, 246, 0.75));
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25); background: linear-gradient(135deg, var(--color-primary-hover), #8b5cf6); }
    }
  }
}

/* ======== 磨砂玻璃 Dialog 样式 ======== */
.glass-dialog-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.glass-dialog-box {
  width: 400px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  padding: 1.25rem 1.5rem;
  animation: dialogIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .mdi { color: var(--color-primary); }
    }

    .close-dialog-btn {
      background: none; border: none; color: var(--text-secondary); cursor: pointer;
      font-size: 1.1rem; border-radius: 4px; display: flex;
      &:hover { color: var(--text-primary); background: var(--bg-secondary); }
    }
  }

  .dialog-body {
    .dialog-intro {
      font-size: 0.72rem; color: var(--text-secondary); margin: 0 0 1rem; line-height: 1.5;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 0.75rem;

      label { font-size: 0.72rem; font-weight: 600; color: var(--text-primary); }
      
      .select-wrapper {
        position: relative;
        select {
          width: 100%; height: 36px; padding: 0 0.75rem; border-radius: 8px;
          border: 1px solid var(--border-color); background: var(--bg-secondary);
          color: var(--text-primary); font-size: 0.75rem; outline: none;
          &:disabled { opacity: 0.5; cursor: not-allowed; }
        }
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin: 0.25rem 0;
        input { width: 14px; height: 14px; cursor: pointer; }
        label { font-size: 0.72rem; cursor: pointer; }
      }

      .text-input {
        height: 36px; padding: 0 0.75rem; border-radius: 8px;
        border: 1px solid var(--border-color); background: var(--bg-secondary);
        color: var(--text-primary); font-size: 0.75rem; outline: none;
        &:focus { border-color: var(--color-primary); }
      }
    }

    .dialog-divider {
      position: relative; text-align: center; margin: 0.75rem 0;
      &::before { content: ''; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: var(--border-color); }
      span { position: relative; background: var(--bg-tertiary); padding: 0 0.5rem; font-size: 0.65rem; color: var(--text-secondary); }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;

    .dialog-btn {
      height: 32px; padding: 0 1rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
      border: none; cursor: pointer; transition: all 0.2s;

      &.secondary {
        background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);
        &:hover { background: var(--bg-tertiary); }
      }

      &.primary {
        background: var(--color-primary); color: white;
        &:hover { background: var(--color-primary-hover); }
      }
    }
  }
}

@keyframes dialogIn {
  from { opacity: 0; transform: scale(0.95) translateY(15px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 过渡动效 */
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.25s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }

/* ======== 磨砂玻璃 Toast 样式 ======== */
.glass-toast-card {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 320px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid var(--color-success);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  padding: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1000;
  animation: toastIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);

  .toast-icon { font-size: 1.5rem; color: var(--color-success); }
  
  .toast-content {
    flex: 1;
    h4 { margin: 0 0 0.15rem; font-size: 0.78rem; font-weight: 700; color: white; }
    p { margin: 0; font-size: 0.65rem; color: #94a3b8; }
  }

  .toast-action-btn {
    border: none; background: rgba(255, 255, 255, 0.08); color: white;
    font-size: 0.65rem; font-weight: 600; padding: 0.35rem 0.55rem;
    border-radius: 6px; display: flex; align-items: center; gap: 0.2rem;
    cursor: pointer; transition: all 0.2s;
    &:hover { background: var(--color-primary); }
  }
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s ease; }
.toast-slide-enter-from { opacity: 0; transform: translateY(30px); }
.toast-slide-leave-to { opacity: 0; transform: translateX(50px); }
</style>
