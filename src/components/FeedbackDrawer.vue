<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const isOpen = ref(false)
const isInspecting = ref(false)
const targetSelector = ref('')
const feedbackContent = ref('')
const submitStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const statusMessage = ref('')

// 临时高亮缓存元素
let lastHoveredEl: HTMLElement | null = null

// 1. CSS 唯一选择器生成器
const getUniqueSelector = (el: HTMLElement): string => {
  if (el.id) {
    return `#${el.id}`
  }
  if (el === document.body) {
    return 'body'
  }
  
  const path: string[] = []
  let currentEl: HTMLElement | null = el
  
  while (currentEl && currentEl !== document.documentElement) {
    if (currentEl.id) {
      path.unshift(`#${currentEl.id}`)
      break
    }
    
    let siblingIndex = 1
    let sibling = currentEl.previousElementSibling
    while (sibling) {
      if (sibling.tagName === currentEl.tagName) {
        siblingIndex++
      }
      sibling = sibling.previousElementSibling
    }
    
    let tagName = currentEl.tagName.toLowerCase()
    if (currentEl.className && typeof currentEl.className === 'string') {
      const classes = currentEl.className
        .trim()
        .split(/\s+/)
        .filter(c => c && !c.includes('inspect') && !c.includes('hover') && !c.includes('active'))
      if (classes.length > 0) {
        tagName += `.${classes[0]}`
      }
    }
    
    path.unshift(`${tagName}:nth-of-type(${siblingIndex})`)
    currentEl = currentEl.parentElement
  }
  
  return path.join(' > ')
}

// 2. DOM 审查器事件处理
const handleMouseOver = (e: MouseEvent) => {
  if (!isInspecting.value) return
  e.stopPropagation()
  
  const target = e.target as HTMLElement
  if (!target || target.closest('.feedback-drawer') || target.closest('.btn-floating-feedback')) {
    return
  }
  
  // 清理上一个高亮
  if (lastHoveredEl && lastHoveredEl !== target) {
    lastHoveredEl.classList.remove('inspect-highlight')
  }
  
  // 施加当前高亮
  target.classList.add('inspect-highlight')
  lastHoveredEl = target
}

const handleMouseClick = (e: MouseEvent) => {
  if (!isInspecting.value) return
  e.preventDefault()
  e.stopPropagation()
  
  const target = e.target as HTMLElement
  if (!target) return
  
  // 提取唯一选择器并锁定
  targetSelector.value = getUniqueSelector(target)
  
  // 退出审查模式
  disableInspectMode()
  
  // 重新打开被变暗的抽屉
  isOpen.value = true
}

const enableInspectMode = () => {
  isInspecting.value = true
  isOpen.value = false // 隐藏抽屉方便用户选点
  document.body.classList.add('inspecting-mode')
  
  document.addEventListener('mouseover', handleMouseOver, true)
  document.addEventListener('click', handleMouseClick, true)
}

const disableInspectMode = () => {
  isInspecting.value = false
  document.body.classList.remove('inspecting-mode')
  
  if (lastHoveredEl) {
    lastHoveredEl.classList.remove('inspect-highlight')
    lastHoveredEl = null
  }
  
  document.removeEventListener('mouseover', handleMouseOver, true)
  document.removeEventListener('click', handleMouseClick, true)
}

// 3. 提交反馈至伴生 API
const submitFeedback = async () => {
  if (!feedbackContent.value) {
    submitStatus.value = 'error'
    statusMessage.value = '请输入您的改进建议内容。'
    return
  }
  
  submitStatus.value = 'loading'
  statusMessage.value = '正在将您的自进化改进提交至 SQLite 数据库...'
  
  const payload = {
    category: 'ui_style',
    content: `[Target Element: ${targetSelector.value || 'body'}]\n${feedbackContent.value}`,
    screenshots: []
  }
  
  try {
    const response = await fetch('http://localhost:8090/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (response.ok) {
      submitStatus.value = 'success'
      statusMessage.value = '🎉 自进化建议已成功落库！雷达正在启动唤醒 Agent 大脑进行物理代码改写，本页面将实时热更新，请留意！'
      feedbackContent.value = ''
      targetSelector.value = ''
      
      // 3秒后自动关闭
      setTimeout(() => {
        isOpen.value = false
        submitStatus.value = 'idle'
        statusMessage.value = ''
      }, 4000)
    } else {
      throw new Error('网络响应异常')
    }
  } catch (err) {
    submitStatus.value = 'error'
    statusMessage.value = '❌ 提交失败：请确保 Docker 伴生后端容器在 8090 端口正常运行。'
  }
}

onBeforeUnmount(() => {
  disableInspectMode()
})
</script>

<template>
  <div>
    <!-- 悬浮唤起按钮 -->
    <button 
      class="btn-floating-feedback"
      @click="isOpen = !isOpen"
      title="提议自进化改进"
    >
      <span class="icon">✨</span>
      <span class="label">提议自进化</span>
    </button>

    <!-- 反馈遮罩层（仅在开启审查模式时起暗色防误触提示作用） -->
    <div 
      v-if="isInspecting" 
      class="inspect-overlay-toast"
    >
      <span>🎯 审查模式已激活。请在页面上点击需要改造的 UI 元素...</span>
      <button class="btn-cancel" @click="disableInspectMode">取消</button>
    </div>

    <!-- 反馈抽屉 -->
    <div class="feedback-drawer" :class="{ 'open': isOpen }">
      <div class="drawer-header">
        <h3>🧬 Code Agent 自进化</h3>
        <button class="btn-close" @click="isOpen = false">&times;</button>
      </div>

      <div class="drawer-body">
        <p class="drawer-info">
          点选下方审查按钮，可以直接捕获本页面上任何您不满意或希望优化的样式元素。
          大模型重构大脑将在影子沙箱内自动安全重构，跑通视觉回归靶场后物理合入！
        </p>

        <!-- 元素审查区 -->
        <div class="form-group">
          <div class="label-row">
            <label>目标元素选择器 (CSS Selector)</label>
            <button 
              type="button" 
              class="btn-sm btn-secondary"
              @click="enableInspectMode"
            >
              🎯 页面点选元素
            </button>
          </div>
          <input 
            type="text" 
            v-model="targetSelector" 
            placeholder="例如: #btn-action 或 div.card"
            readonly
          />
        </div>

        <!-- 反馈需求内容 -->
        <div class="form-group">
          <label>改进与美化需求 (意图描述)</label>
          <textarea 
            rows="5" 
            v-model="feedbackContent"
            placeholder="例如: 请将这个按钮的背景颜色修改为漂亮的紫色渐变，字体稍微加粗，并加上平滑的 hover 呼吸动画效果。"
          ></textarea>
        </div>

        <!-- 提交按钮 -->
        <button 
          class="btn-submit" 
          :disabled="submitStatus === 'loading'"
          @click="submitFeedback"
        >
          {{ submitStatus === 'loading' ? '正在提交落库...' : '🚀 触发闭环自进化' }}
        </button>

        <!-- 状态提醒 -->
        <div 
          v-if="submitStatus !== 'idle'" 
          class="submit-status"
          :class="submitStatus"
        >
          {{ statusMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
/* 全局样式注入：审查高亮 outline 效果 */
.inspecting-mode * {
  cursor: crosshair !important;
}

.inspect-highlight {
  outline: 2px dashed #ec4899 !important;
  outline-offset: 2px !important;
  background-color: rgba(236, 72, 153, 0.1) !important;
  transition: all 0.15s ease;
}
</style>

<style scoped lang="scss">
/* 局部作用域样式 */
.btn-floating-feedback {
  position: fixed;
  bottom: 25px;
  right: 25px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(236, 72, 153, 0.4);
  color: #fff;
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35), 0 0 15px rgba(236, 72, 153, 0.15);
  cursor: pointer;
  z-index: 9999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(236, 72, 153, 0.15);
    border-color: #ec4899;
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(236, 72, 153, 0.3);
  }
  
  .icon {
    font-size: 1.1rem;
    animation: spin 6s linear infinite;
  }
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* 反馈提示挂载条 */
.inspect-overlay-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #ec4899;
  color: #fff;
  padding: 12px 24px;
  border-radius: 12px;
  z-index: 10000;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.9rem;
  font-weight: 500;
  
  .btn-cancel {
    background: #ef4444;
    border: none;
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    
    &:hover {
      background: #dc2626;
    }
  }
}

/* 抽屉样式 */
.feedback-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: #0f172a;
  border-left: 1px solid rgba(255,255,255,0.08);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  z-index: 9998;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  &.open {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  
  h3 {
    font-size: 1.15rem;
    margin: 0;
    font-weight: 650;
    background: linear-gradient(135deg, #f472b6 0%, #a855f7 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .btn-close {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.8rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    
    &:hover {
      color: #fff;
    }
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drawer-info {
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #cbd5e1;
  }
  
  input, textarea {
    width: 100%;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px 12px;
    color: #fff;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.2s ease;
    
    &:focus {
      border-color: #ec4899;
      box-shadow: 0 0 10px rgba(236, 72, 153, 0.15);
    }
  }
  
  input[readonly] {
    color: #f472b6;
    font-family: monospace;
    font-size: 0.78rem;
    background: rgba(30, 41, 59, 0.8);
  }
  
  textarea {
    resize: none;
  }
}

.btn-sm {
  padding: 4px 10px;
  font-size: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary {
  background: rgba(236, 72, 153, 0.15);
  border: 1px solid rgba(236, 72, 153, 0.3);
  color: #f472b6;
  
  &:hover {
    background: rgba(236, 72, 153, 0.25);
    border-color: #ec4899;
  }
}

.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;
  
  &:hover {
    opacity: 0.95;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(236, 72, 153, 0.25);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #334155;
    color: #64748b;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.submit-status {
  padding: 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.4;
  text-align: center;
  
  &.loading {
    background: rgba(168, 85, 247, 0.1);
    border: 1px solid rgba(168, 85, 247, 0.2);
    color: #c084fc;
  }
  
  &.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: #4ade80;
    text-align: left;
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
}
</style>
