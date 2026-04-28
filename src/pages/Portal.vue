<template>
  <!--
   * @vibe-intent 门户页面设计，集成工作站模式与纯对话模式分流。
   * @vibe-model Gemini 3.1 Pro (High)
   * @vibe-ref intents.md#2026-04-15
  -->
  <div class="portal-container">
    <header class="header">
      <div class="logo">
        <span class="mdi mdi-flash brand-icon"></span>
        材料智慧平台
      </div>
      <div class="actions">
        <button class="icon-btn" @click="toggleTheme" :title="isDark ? '切换至浅色模式' : '切换至深色模式'">
          <span class="mdi" :class="isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"></span>
        </button>
        
        <!-- Settings Dropdown -->
        <div class="dropdown-wrapper">
          <button 
            class="icon-btn" 
            :class="{ active: activeDropdown === 'settings' }"
            @click.stop="toggleDropdown('settings')" 
            title="设置"
          >
            <span class="mdi mdi-cog"></span>
          </button>
          <div class="dropdown-panel settings-panel" v-if="activeDropdown === 'settings'" @click.stop>
            <div class="dropdown-header">系统设置</div>
            <div class="dropdown-item">
              <span class="mdi mdi-robot"></span>
              <div class="item-info">
                <div class="item-label">AI 核心模型</div>
                <div class="item-value">Gemini 3.1 Pro (High)</div>
              </div>
              <span class="mdi mdi-chevron-right"></span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item toggle">
              <div class="item-info">
                <div class="item-label">自动保存</div>
                <div class="item-desc">编辑时实时同步云端</div>
              </div>
              <label class="switch">
                <input type="checkbox" checked>
                <span class="slider"></span>
              </label>
            </div>
            <div class="dropdown-item">
              <span class="mdi mdi-translate"></span>
              <div class="item-info">
                <div class="item-label">语言</div>
                <div class="item-value">简体中文</div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Profile Dropdown -->
        <div class="dropdown-wrapper">
          <div 
            class="avatar" 
            :class="{ active: activeDropdown === 'user' }"
            @click.stop="toggleDropdown('user')"
          >
            <span class="mdi mdi-account"></span>
          </div>
          <div class="dropdown-panel user-panel" v-if="activeDropdown === 'user'" @click.stop>
            <div class="user-info-section">
              <div class="big-avatar"><span class="mdi mdi-account"></span></div>
              <div class="user-details">
                <div class="user-name">张博士 (Dr. Zhang)</div>
                <div class="user-role">首席材料科学家</div>
                <div class="user-org">先进能源材料国家实验室</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item">
              <span class="mdi mdi-folder-account-outline"></span>
              <span>个人实验空间</span>
            </div>
            <div class="dropdown-item">
              <span class="mdi mdi-history"></span>
              <span>历史文献库</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout text-danger">
              <span class="mdi mdi-logout"></span>
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="hero">
      <h1 class="slogan">您的 AI 科研协作者</h1>
      <div class="omni-input-wrapper" :class="{ 'workstation-mode': isWorkstationMode }">
        <textarea 
          v-model="prompt" 
          placeholder="询问任何科学问题，或起草一份材料报告..."
          rows="1"
          @keydown.enter.prevent="submit"
          @input="resizeTextarea"
          ref="textareaRef"
        ></textarea>
        
        <div class="input-footer">
          <div class="mode-toggle">
            <button 
              :class="['mode-btn', !isWorkstationMode ? 'active' : '']" 
              @click="isWorkstationMode = false"
            >
              <span class="mdi mdi-chat-outline"></span> 对话模式
            </button>
            <button 
              :class="['mode-btn workstation', isWorkstationMode ? 'active' : '']" 
              @click="isWorkstationMode = true"
            >
              <span class="mdi mdi-rocket-launch"></span> 工作站模式
            </button>
          </div>
          
          <button class="send-btn" @click="submit" :disabled="!prompt.trim()">
            <span class="mdi mdi-send"></span>
          </button>
        </div>
      </div>
      
      <div class="quick-actions">
        <button class="chip" @click="openTool('tool_unit_converter')"><span class="mdi mdi-calculator"></span> 单位换算</button>
        <button class="chip"><span class="mdi mdi-file-document-outline"></span> 文献摘要分析</button>
        <button class="chip" @click="openTool('tool_chart_analysis')"><span class="mdi mdi-chart-bell-curve-cumulative"></span> 数据分析</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const prompt = ref('')
const isWorkstationMode = ref(true)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isDark = ref(false)
const activeDropdown = ref<string | null>(null)

const toggleDropdown = (name: string) => {
  if (activeDropdown.value === name) {
    activeDropdown.value = null
  } else {
    activeDropdown.value = name
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
}

// Sync theme to DOM and storage
watch(isDark, (val) => {
  const theme = val ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}, { immediate: false })

onMounted(() => {
  // Theme initialization
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme === 'dark' || 
                 (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
                 
  // Ensure DOM is in sync on mount
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')

  // Close dropdowns on click outside
  window.addEventListener('click', () => {
    activeDropdown.value = null
  })
})

const resizeTextarea = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 200) + 'px'
  }
}

const submit = () => {
  if (!prompt.value.trim()) return
  if (isWorkstationMode.value) {
    router.push({ name: 'Workspace', query: { q: prompt.value } })
  } else {
    // For local mockup, just go to workspace anyway but maybe logic differs later
    router.push({ name: 'Workspace', query: { q: prompt.value, chatOnly: '1' } })
  }
}

const openTool = (toolId: string) => {
  router.push({ name: 'Workspace', query: { toolId } })
}
</script>

<style scoped lang="scss">
.portal-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  position: relative;
  z-index: 10;
  
  .logo {
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    letter-spacing: -0.05em;
    
    .brand-icon {
      color: var(--color-primary);
      background: rgba(59, 130, 246, 0.1);
      padding: 0.25rem;
      border-radius: 8px;
    }
  }
  
  .actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .icon-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.25rem;
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      transition: all 0.2s;
      
      &:hover, &.active {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      .mdi {
        pointer-events: none;
      }
    }
    
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover, &.active {
        border-color: var(--color-primary);
        color: var(--color-primary);
        background: rgba(59, 130, 246, 0.1);
      }
    }
  }
}

/* --- Dropdown Styles --- */
.dropdown-wrapper {
  position: relative;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 260px;
  background: var(--bg-tertiary);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  z-index: 100;
  padding: 0.4rem;
  animation: dropdownIn 0.2s ease-out;
  font-size: 0.75rem;
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 14px;
    width: 12px;
    height: 12px;
    background: var(--bg-tertiary);
    border-left: 1px solid var(--border-color);
    border-top: 1px solid var(--border-color);
    transform: rotate(45deg);
  }
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-header {
  padding: 0.4rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: var(--bg-secondary);
  }
  
  .mdi {
    font-size: 1.1rem;
    color: var(--text-secondary);
  }
  
  .item-info {
    flex: 1;
    .item-label { font-size: 0.75rem; color: var(--text-primary); font-weight: 500; }
    .item-value, .item-desc { font-size: 0.6rem; color: var(--text-secondary); opacity: 0.8; }
  }
  
  &.text-danger {
    color: var(--color-danger);
    .mdi { color: var(--color-danger); }
  }
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.4rem 0;
}

/* --- User Panel Specific --- */
.user-info-section {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .big-avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.1);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
  }
  
  .user-details {
    .user-name { font-weight: 700; color: var(--text-primary); font-size: 0.85rem; }
    .user-role { font-size: 0.7rem; color: var(--text-secondary); }
    .user-org { font-size: 0.6rem; color: var(--text-secondary); opacity: 0.8; margin-top: 2px; }
  }
}

/* --- Toggle Switch Style --- */
.switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  
  input { opacity: 0; width: 0; height: 0; }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--border-color);
    transition: .4s;
    border-radius: 18px;
    
    &:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + .slider { background-color: var(--color-success); }
  input:checked + .slider:before { transform: translateX(14px); }
}

.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  padding-bottom: 12vh; /* 视觉上将内容区向上偏移，替代负 margin */
  
  .slogan {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 2.5rem;
    background: linear-gradient(135deg, var(--text-primary), var(--color-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    letter-spacing: -0.02em;
  }
}

.omni-input-wrapper {
  width: 100%;
  max-width: 800px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 1rem 1rem 0.5rem;
  transition: all 0.3s ease;
  
  &.workstation-mode {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  textarea {
    width: 100%;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 1rem;
    resize: none;
    outline: none;
    padding: 0 0.5rem 1rem;
    min-height: 44px;
    font-family: inherit;
    line-height: 1.6;
    
    &::placeholder {
      color: var(--text-secondary);
    }
  }
  
  .input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 0.5rem;
    
    .mode-toggle {
      display: flex;
      gap: 0.5rem;
      
      .mode-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 0.85rem;
        padding: 0.4rem 0.6rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 500;
        transition: all 0.2s;
        
        &:hover {
          background: var(--bg-secondary);
        }
        
        &.active {
          color: var(--text-primary);
          background: var(--bg-secondary);
          
          &.workstation {
            color: var(--color-primary);
            background: rgba(59, 130, 246, 0.1);
          }
        }
      }
    }
    
    .send-btn {
      background: var(--color-primary);
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        background: var(--color-primary-hover);
        transform: scale(1.05);
      }
      
      &:disabled {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: not-allowed;
      }
    }
  }
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  
  .chip {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;
    
    &:hover {
      background: var(--bg-secondary);
      border-color: var(--text-secondary);
      color: var(--text-primary);
    }
  }
}
</style>
