<!--
  @vibe-intent 全面升级 Vue 3 TS 自进化抽屉组件，移去 Mock 降级，打通真实 FastAPI 后端 API，加入 WebSocket 实时热更新监听与 premium 右下角 Toast 消息弹出。
  @vibe-model Gemini 3.5 Flash (High)
  @vibe-ref intents.md#2026-05-25
-->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface FeedbackItem {
  id?: number;
  category: string;
  content: string;
  screenshots: string[];
  processed: boolean;
  timestamp: string;
}

interface ProcessedNotification {
  type: string;
  id: number;
  category: string;
  content: string;
}

const isOpen = ref(false);
const isInspecting = ref(false);
const targetSelector = ref('');
const feedbackContent = ref('');
const feedbackCategory = ref('ui_style');
const screenshots = ref<string[]>([]);
const statusMsg = ref('');
const statusType = ref<'success' | 'error' | 'loading' | ''>('');

// WS 状态
let socket: WebSocket | null = null;
const showToast = ref(false);
const toastData = ref<ProcessedNotification | null>(null);

// 切换抽屉状态
const toggleDrawer = () => {
  isOpen.value = !isOpen.value;
};

// 开启审查模式
const startInspecting = () => {
  if (isInspecting.value) return;
  isInspecting.value = true;
  
  document.body.classList.add('agent-inspecting-mode');
  
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleElementClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
};

// 退出审查模式
const stopInspecting = () => {
  if (!isInspecting.value) return;
  isInspecting.value = false;
  
  document.body.classList.remove('agent-inspecting-mode');
  
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleElementClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
};

// 悬停高亮
const handleMouseOver = (e: MouseEvent) => {
  if (!isInspecting.value) return;
  const target = e.target as HTMLElement;
  if (target.closest('.feedback-drawer')) return;
  
  e.preventDefault();
  e.stopPropagation();
  target.classList.add('agent-inspect-hover');
};

const handleMouseOut = (e: MouseEvent) => {
  if (!isInspecting.value) return;
  const target = e.target as HTMLElement;
  target.classList.remove('agent-inspect-hover');
};

// 选取确认
const handleElementClick = (e: MouseEvent) => {
  if (!isInspecting.value) return;
  const target = e.target as HTMLElement;
  if (target.closest('.feedback-drawer')) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  target.classList.remove('agent-inspect-hover');
  const selector = getUniqueSelector(target);
  targetSelector.value = selector;
  
  stopInspecting();
};

// 键盘Esc退出
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    const hovers = document.querySelectorAll('.agent-inspect-hover');
    hovers.forEach(el => el.classList.remove('agent-inspect-hover'));
    stopInspecting();
  }
};

// 计算唯一 CSS 选择器路径
const getUniqueSelector = (el: HTMLElement | null): string => {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
  if (el.id) return `#${el.id}`;
  
  const tagName = el.tagName.toLowerCase();
  const classes = Array.from(el.classList)
    .filter(c => c && c !== 'agent-inspect-hover' && !c.startsWith('inspect-') && !c.startsWith('v-'))
    .join('.');
  let name = tagName + (classes ? `.${classes}` : '');
  
  if (el === document.body) return 'body';
  
  let sibling = el.previousElementSibling;
  let nth = 1;
  while (sibling) {
    if (sibling.tagName === el.tagName) {
      nth++;
    }
    sibling = sibling.previousElementSibling;
  }
  
  const parent = el.parentNode as HTMLElement | null;
  if (parent && parent !== document.documentElement && parent.nodeType === Node.ELEMENT_NODE) {
    const parentSelector = getUniqueSelector(parent);
    const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
    if (siblings.length > 1) {
      name += `:nth-of-type(${nth})`;
    }
    return `${parentSelector} > ${name}`;
  }
  
  return name;
};

// 粘贴截图处理
const handlePaste = (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      const file = item.getAsFile();
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          screenshots.value.push(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }
};

const deleteScreenshot = (index: number) => {
  screenshots.value.splice(index, 1);
};

// 提交反馈至真实后端接口
const submitFeedback = async () => {
  if (!feedbackContent.value.trim() && screenshots.value.length === 0) {
    alert('请输入修改建议或粘贴截图！');
    return;
  }
  
  let finalContent = feedbackContent.value;
  if (targetSelector.value) {
    finalContent = `[Target Element: ${targetSelector.value}]\n${finalContent}`;
  }
  
  statusMsg.value = '正在提交反馈至真实 API 后端...';
  statusType.value = 'loading';
  
  const feedbackItem: FeedbackItem = {
    category: feedbackCategory.value,
    content: finalContent,
    screenshots: screenshots.value,
    processed: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackItem)
    });
    
    if (response.ok) {
      statusMsg.value = '反馈已成功提交！AI 进化进程已排队接单。';
      statusType.value = 'success';
      feedbackContent.value = '';
      targetSelector.value = '';
      screenshots.value = [];
      setTimeout(() => { statusMsg.value = ''; statusType.value = ''; }, 4000);
    } else {
      throw new Error(`HTTP Error ${response.status}`);
    }
  } catch (err: any) {
    statusMsg.value = `真实接口提交失败: ${err.message}`;
    statusType.value = 'error';
  }
};

// WebSocket 实时自进化部署感知连接
const initWebSocket = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // 通过 Vite 代理后，可直连同源下的 WebSockets 接口
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications`;
  
  console.log(`[WebSocket] Connecting to: ${wsUrl}`);
  try {
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("[WebSocket] Connection to real API gateway established.");
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'feedback_processed') {
          console.log("[WebSocket] Agent build hot-deploy notification received:", data);
          triggerToast(data);
        }
      } catch (err) {
        console.error("[WebSocket] Parse error:", err);
      }
    };
    
    socket.onclose = () => {
      console.log("[WebSocket] Connection lost. Reconnecting in 5s...");
      setTimeout(() => initWebSocket(), 5000);
    };
  } catch (err) {
    console.error("[WebSocket] Connection failed:", err);
  }
};

// 触发自进化吐司通知
const triggerToast = (data: ProcessedNotification) => {
  toastData.value = data;
  showToast.value = true;
  
  // 10 秒后自动淡出
  setTimeout(() => {
    showToast.value = false;
  }, 10000);
};

const closeToast = () => {
  showToast.value = false;
};

const getCategoryName = (cat: string) => {
  const names: Record<string, string> = {
    'ui_style': '🎨 界面样式',
    'data_rule': '📊 数据规则',
    'api_logic': '⚙️ 后端逻辑'
  };
  return names[cat] || '💡 改进建议';
};

onMounted(() => {
  initWebSocket();
});

onBeforeUnmount(() => {
  stopInspecting();
  if (socket) {
    socket.close();
  }
});
</script>

<template>
  <div class="feedback-container">
    <!-- 右上角精致悬浮球 -->
    <button @click="toggleDrawer" class="btn-agent-trigger">
      🤖 Agent 改进
    </button>

    <!-- 抽屉面板 -->
    <div :class="['feedback-drawer', { 'open': isOpen, 'inspect-dimmed': isInspecting }]">
      <div class="feedback-header">
        <h3>🎯 架构改进自进化控制台</h3>
        <button @click="toggleDrawer" class="btn-close">&times;</button>
      </div>

      <div class="feedback-body">
        <div class="form-group">
          <label>🎯 选取网页节点</label>
          <div class="picker-row">
            <button @click="startInspecting" class="btn-pick">
              🖱️ 点击在页面中选取目标元素
            </button>
          </div>
          <input 
            type="text" 
            v-model="targetSelector" 
            readonly 
            placeholder="未选定元素。点击上方按钮拾取..." 
            class="input-selector"
          />
        </div>

        <div class="form-group">
          <label>📝 改进类型</label>
          <select v-model="feedbackCategory" class="select-cat">
            <option value="ui_style">🎨 界面与交互重构</option>
            <option value="data_rule">📊 业务数据规则修改</option>
            <option value="api_logic">⚙️ 后端 API 与数据层重构</option>
          </select>
        </div>

        <div class="form-group">
          <label>✍️ 修改要求描述与截图粘贴</label>
          <textarea 
            v-model="feedbackContent" 
            @paste="handlePaste"
            placeholder="请输入对该元素的具体修改要求。支持直接在此处 Ctrl+V 粘贴错误截图..." 
            rows="5"
            class="textarea-content"
          ></textarea>
        </div>

        <!-- 截图预览 -->
        <div v-if="screenshots.length > 0" class="screenshots-grid">
          <div v-for="(img, idx) in screenshots" :key="idx" class="screenshot-thumb">
            <img :src="img" alt="Screenshot" />
            <button @click="deleteScreenshot(idx)" class="btn-del-img">&times;</button>
          </div>
        </div>

        <button @click="submitFeedback" class="btn-submit">
          🚀 启动自进化代码修复
        </button>

        <div v-if="statusMsg" :class="['status-box', statusType]">
          {{ statusMsg }}
        </div>
      </div>
    </div>

    <!-- 自进化部署成功 Premium Toast 卡片（仿玻璃态通知） -->
    <transition name="toast-fade">
      <div v-if="showToast && toastData" class="feedback-toast">
        <div class="toast-header">
          <span class="toast-icon">🚀</span>
          <strong class="toast-title">架构自进化更新完成</strong>
          <span @click="closeToast" class="toast-close">&times;</span>
        </div>
        <div class="toast-body">
          <div>反馈需求 <strong>#{{ toastData.id }}</strong> [{{ getCategoryName(toastData.category) }}] 已由 Agent 自动重构并成功发布！</div>
          <div class="toast-content">{{ toastData.content.replace(/\[Target Element:.*?\]\n?/, '') }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.btn-agent-trigger {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  cursor: pointer;
  z-index: 999;
  transition: transform 0.2s;
}
.btn-agent-trigger:hover {
  transform: translateY(-2px);
}
.feedback-drawer {
  position: fixed;
  top: 80px;
  right: -360px;
  width: 340px;
  height: calc(100vh - 100px);
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.5);
  transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  color: #f1f5f9;
}
.feedback-drawer.open {
  right: 20px;
}
.feedback-drawer.inspect-dimmed {
  opacity: 0.15;
  pointer-events: none;
  filter: blur(1px);
}
.feedback-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.feedback-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
}
.btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
}
.feedback-body {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 0.725rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}
.btn-pick {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-pick:hover {
  background: rgba(255, 255, 255, 0.1);
}
.input-selector {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px;
  border-radius: 6px;
  color: #38bdf8;
  font-family: monospace;
  font-size: 0.75rem;
}
.select-cat, .textarea-content {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px;
  border-radius: 6px;
  color: #f1f5f9;
  outline: none;
}
.btn-submit {
  padding: 10px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  border: none;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}
.btn-submit:hover {
  transform: scale(1.01);
}
.screenshots-grid {
  display: flex;
  gap: 8px;
}
.screenshot-thumb {
  position: relative;
  width: 60px;
  height: 60px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}
.screenshot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.btn-del-img {
  position: absolute;
  top: 1px;
  right: 1px;
  background: rgba(0,0,0,0.8);
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-box {
  padding: 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  margin-top: 8px;
}
.status-box.success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-box.error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }
.status-box.loading { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); color: #94a3b8; }

/* Premium Toast Styling */
.feedback-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(6, 182, 212, 0.35);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.2);
  color: #f1f5f9;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}
.toast-header {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(6, 182, 212, 0.08);
}
.toast-icon {
  font-size: 16px;
}
.toast-title {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 700;
  color: #06b6d4;
}
.toast-close {
  cursor: pointer;
  color: #94a3b8;
  font-size: 1.25rem;
  line-height: 1;
}
.toast-close:hover {
  color: #f1f5f9;
}
.toast-body {
  padding: 12px 14px;
  font-size: 0.775rem;
  line-height: 1.4;
  color: #cbd5e1;
}
.toast-content {
  margin-top: 6px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.7rem;
  color: #94a3b8;
  word-break: break-all;
  max-height: 60px;
  overflow-y: auto;
}

/* Vue Transition */
.toast-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from {
  transform: translateY(30px);
  opacity: 0;
}
.toast-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>
