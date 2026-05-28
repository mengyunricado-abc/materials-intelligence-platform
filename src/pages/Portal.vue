<template>
  <!--
   * @vibe-intent 全新重构主门户页面，对标 Bohrium 极润极雅的科学工作站质感。
   * 融入微光冷渐变背景、顶置学术横幅、超大“科学家，你好”问候语、
   * 大圆角实体润滑输入卡片（集成闪电/国际期刊/深度研究 ON-OFF 状态），
   * 协同部署三联物理场景卡片、图文材料案例（换一换）及展开手风琴底栏。
   * @vibe-model Gemini 3.5 Flash
   * @vibe-ref intents.md#2026-05-28
  -->
  <div class="portal-container">
    <!-- 2. Header 导航 -->
    <header class="header">
      <div class="header-title">材料智慧平台 · 工作站</div>
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
                <div class="item-value">Gemini 3.5 Flash</div>
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

    <!-- 3. 主中央控制台 -->
    <main class="hero">
      <div class="hero-content">
        <h1 class="slogan">您的 AI 科研协作者</h1>

      <!-- 4. 极致润滑白色大圆角胶囊输入框 -->
      <div class="omni-input-card" :class="{ focused: isFocused }">
        <textarea 
          v-model="prompt" 
          placeholder="询问任何材料科学或计算模拟问题，或快速剖析一篇文献..."
          rows="1"
          @keydown.enter.prevent="submit"
          @input="resizeTextarea"
          @focus="isFocused = true"
          @blur="isFocused = false"
          ref="textareaRef"
        ></textarea>
        
        <div class="input-card-footer">
          <div class="footer-left">
            <button class="footer-icon-btn active" title="快速响应模式">
              <span class="mdi mdi-flash-outline"></span> <span>快速</span>
            </button>
            <button class="footer-icon-btn" title="火箭算力加速"><span class="mdi mdi-rocket-launch-outline"></span></button>
            <button class="footer-icon-btn" title="引用本地实验材料"><span class="mdi mdi-book-open-variant"></span></button>
            
            <div class="journal-dropdown-trigger" @click.stop="toggleJournalDropdown">
              <span class="mdi mdi-text-box-outline"></span>
              <span>国际期刊</span>
              <span class="mdi mdi-chevron-down"></span>
            </div>
          </div>
          
          <div class="footer-right">
            <button class="footer-icon-btn plus-btn" title="添加新组件"><span class="mdi mdi-plus"></span></button>
            
            <!-- 深度研究高算力开关交互 -->
            <div 
              class="deep-research-switch" 
              :class="{ active: isDeepResearch }"
              @click="isDeepResearch = !isDeepResearch"
              title="开启高算力深度检索与多轮推理"
            >
              <span class="mdi mdi-magnify-plus-outline"></span>
              <span>深度研究</span>
              <span class="switch-badge">{{ isDeepResearch ? 'ON' : 'OFF' }}</span>
            </div>
            
            <button class="send-btn-round" @click="submit" :disabled="!prompt.trim()" title="发送询问">
              <span class="mdi mdi-arrow-up"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- 5. 快捷微胶囊导航标签 -->
      <div class="quick-capsules">
        <button class="capsule-chip"><span class="mdi mdi-compass-outline"></span> 科学导航材料版</button>
        <button class="capsule-chip"><span class="mdi mdi-forum-outline"></span> 通用材料问答</button>
        <button class="capsule-chip"><span class="mdi mdi-file-document-edit-outline"></span> 文献深度解析</button>
        <button class="capsule-chip"><span class="mdi mdi-dots-horizontal"></span> 配方成分优化</button>
      </div>

      <!-- 6. 物理场景功能三联大卡片 -->
      <div class="workspace-grid-cards">
        <div class="grid-card" @click="openTool('tool_unit_converter')">
          <span class="mdi mdi-beaker-outline card-icon color-science"></span>
          <div class="card-text">
            <h4>材料配方优化助手</h4>
            <p>智能物料配比与组分物理性质评估</p>
          </div>
          <span class="mdi mdi-chevron-right arrow-icon"></span>
        </div>
        
        <div class="grid-card">
          <span class="mdi mdi-database-eye-outline card-icon color-db"></span>
          <div class="card-text">
            <h4>晶体结构生成器</h4>
            <p>输入化学式自动预估晶胞几何拓扑</p>
          </div>
          <span class="mdi mdi-chevron-right arrow-icon"></span>
        </div>
        
        <div class="grid-card" @click="openTool('tool_chart_analysis')">
          <span class="mdi mdi-chart-multiline card-icon color-chart"></span>
          <div class="card-text">
            <h4>多尺度物理特性预测</h4>
            <p>利用微观/宏观协同算法计算能带及强度</p>
          </div>
          <span class="mdi mdi-chevron-right arrow-icon"></span>
        </div>
      </div>

      <!-- 7. 图文材料模拟科学案例区 (带换一换) -->
      <div class="recommend-section">
        <div class="section-title-bar">
          <span class="mdi mdi-creation-outline"></span>
          <span>常用模拟与分析案例</span>
        </div>
        
        <div class="recommend-cards">
          <div 
            class="recommend-card" 
            v-for="(caseItem, index) in caseList" 
            :key="index" 
            @click="prompt = caseItem.text"
            title="一键装填问题"
          >
            <div class="case-image-placeholder" :style="{ background: caseItem.bg }">
              <span class="mdi" :class="caseItem.icon"></span>
            </div>
            <div class="case-title">{{ caseItem.title }}</div>
          </div>
        </div>
        
        <div class="recommend-footer-btns">
          <button class="footer-btn" @click="shuffleCases">
            <span class="mdi mdi-cached spin-icon"></span>
            <span>换一换</span>
          </button>
        </div>
        </div>
      </div>
    </main>

    <!-- 8. 为你推荐底栏 -->
    <footer class="portal-footer">
      <div class="copyright-info">
        © 2026 材料智慧计算引擎系统 | 科学智算工作站 Version 4.1
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspaceStore } from '../stores/workspace'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const prompt = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isDark = ref(false)
const activeDropdown = ref<string | null>(null)

// ---- Bohrium 高端交互数据 ----
const showBanner = ref(true)
const isFocused = ref(false)
const isDeepResearch = ref(false)

const handleGoCert = () => {
  alert('✨ 正在跳转至高校学术身份认证空间，认证后可享无限高算力模拟节点！')
}

const handleSignToday = () => {
  alert('🎉 每日签到成功！已向您的科学工作账户注入 50 点多尺度计算积分。')
}

const toggleDropdown = (name: string) => {
  if (activeDropdown.value === name) {
    activeDropdown.value = null
  } else {
    activeDropdown.value = name
  }
}

const toggleJournalDropdown = () => {
  alert('🌍 国际期刊数据库联想词已加载！提问时将优先检索 Nature/Science 材料及化学子刊。')
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

/**
 * @vibe-intent 首个问题提交后，前置强制开启纯净学术问答新 Session，携带 prompt 跳转至独立学术问答主页
 * @vibe-model Antigravity
 * @vibe-ref intents.md#2026-05-28
 */
const submit = () => {
  if (!prompt.value.trim()) return
  // 强行前置开启一个干净的学术问答新 Session，锁定问答与新对话隔离原则
  workspaceStore.createSession('academic')
  router.push({ name: 'Chat', query: { q: prompt.value } })
}

/**
 * @vibe-intent 快捷卡片跳转常用科学工具大屏运行专属路由，彻底解耦 Workspace 混杂环境
 * @vibe-model Antigravity
 * @vibe-ref intents.md#2026-05-28
 */
const openTool = (toolId: string) => {
  router.push(`/tools/run?toolId=${toolId}`)
}

// ---- 精美材料科学图文案例池 ----
const casesData = [
  { title: '液态电池的安全特性', icon: 'mdi-battery-charging-100', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', text: '请帮我评估新型液态锂离子电池在大电流充放电过程中的热失控临界温度及安全防护方案。' },
  { title: '固态电池的界面稳定性', icon: 'mdi-battery-lock', bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', text: '请给出固态电解质与锂金属负极界面在循环过程中的副反应机制及提升界面稳定性的涂层材料。' },
  { title: '晶体缺陷与能带结构预测', icon: 'mdi-crystal-ball', bg: 'linear-gradient(135deg, #eeddd3 0%, #e2d1c3 100%)', text: '请说明在氧化锌（ZnO）中掺杂氮（N）原子后，对其价带顶及导带底能带结构的具体调制效应。' },
  { title: '复合材料力学模量估算', icon: 'mdi-shield-sword-outline', bg: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', text: '如何利用 Halpin-Tsai 半经验方程对碳纤维增强树脂基复合材料的横向及纵向弹性模量进行估算？' },
  { title: '高熵合金物相组成分析', icon: 'mdi-sine-wave', bg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', text: '根据吉布斯自由能及原子半径差因子，请分析 CoCrFeNiHigh 熵合金的单相固溶体稳定性。' },
  { title: '多孔碳材料吸附孔径评估', icon: 'mdi-texture-box', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', text: '如何通过 N2 吸脱附等温曲线分析活性炭的微孔与介孔孔径分布？' },
  { title: '压电陶瓷耦合系数优化', icon: 'mdi-audio-input-rca', bg: 'linear-gradient(135deg, #abecd6 0%, #fbed96 100%)', text: '请列出掺杂改性对钛酸钡（BaTiO3）基压电陶瓷机电耦合系数及居里温度的具体影响趋势。' }
]

const caseList = ref(casesData.slice(0, 5))

const shuffleCases = () => {
  const shuffled = [...casesData].sort(() => 0.5 - Math.random())
  caseList.value = shuffled.slice(0, 5)
}
</script>

<style scoped lang="scss">
/* ======== 全局学术级灰蓝色微光冷渐变背景 ======== */
.portal-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: linear-gradient(135deg, #f4f7fb 0%, #e2e8f1 100%);
  transition: all 0.3s ease;

  :root[data-theme='dark'] & {
    background: linear-gradient(135deg, #090e1a 0%, #050810 100%);
  }
}

/* 1. 置顶学术通知福利 Banner */
.academic-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, #6d5dfc, #3b5998);
  color: white;
  padding: 0.55rem 2rem;
  font-size: 0.76rem;
  position: relative;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(109, 93, 252, 0.25);
  animation: slideDown 0.3s ease-out;

  .banner-content {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1;

    .banner-icon {
      font-size: 1.15rem;
    }

    .banner-text {
      letter-spacing: 0.01em;
      strong {
        color: #fbed96;
        font-weight: 700;
      }
    }

    .banner-btn-go {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: white;
      padding: 0.15rem 0.6rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: white;
        color: #6d5dfc;
      }
    }
  }

  .banner-btn-sign {
    background: #fbed96;
    border: none;
    color: #1e293b;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-right: 1.5rem;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s;

    &:hover {
      background: white;
      transform: scale(1.03);
    }
  }

  .banner-close {
    font-size: 1.05rem;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.15s;

    &:hover { opacity: 1; }
  }
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

/* 2. Header 样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  position: relative;
  z-index: 10;

  .header-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.05em;
    text-transform: uppercase;

    :root[data-theme='dark'] & {
      color: rgba(255,255,255,0.7);
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    
    .icon-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 1.2rem;
      padding: 0.45rem;
      border-radius: 50%;
      display: flex;
      transition: all 0.2s;

      :root[data-theme='dark'] & {
        color: rgba(255,255,255,0.6);
      }
      
      &:hover, &.active {
        background: rgba(255, 255, 255, 0.4);
        color: #1e293b;
        :root[data-theme='dark'] & {
          background: rgba(255,255,255,0.05);
          color: white;
        }
      }
    }
    
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(15, 23, 42, 0.08);
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;

      :root[data-theme='dark'] & {
        background: rgba(255,255,255,0.03);
        border-color: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.7);
      }
      
      &:hover, &.active {
        border-color: #6d5dfc;
        color: #6d5dfc;
        background: rgba(109, 93, 252, 0.06);
      }
    }
  }
}

/* --- 下拉面板样式 --- */
.dropdown-wrapper {
  position: relative;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 250px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  z-index: 100;
  padding: 0.4rem;
  animation: dropdownIn 0.2s ease-out;
  font-size: 0.75rem;

  :root[data-theme='dark'] & {
    background: rgba(26, 32, 53, 0.95);
    border-color: rgba(255,255,255,0.08);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 11px;
    width: 10px;
    height: 10px;
    background: rgba(255, 255, 255, 0.9);
    border-left: 1px solid rgba(15, 23, 42, 0.08);
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    transform: rotate(45deg);

    :root[data-theme='dark'] & {
      background: #1a2035;
      border-color: rgba(255,255,255,0.08);
    }
  }
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-header {
  padding: 0.4rem 0.75rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
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
  color: #334155;

  :root[data-theme='dark'] & {
    color: rgba(255,255,255,0.8);
  }
  
  &:hover {
    background: rgba(15, 23, 42, 0.04);
    :root[data-theme='dark'] & {
      background: rgba(255,255,255,0.05);
    }
  }
  
  .mdi {
    font-size: 1.05rem;
    color: #64748b;
  }
  
  .item-info {
    flex: 1;
    .item-label { font-size: 0.74rem; font-weight: 500; }
    .item-value, .item-desc { font-size: 0.62rem; color: #64748b; opacity: 0.85; }
  }
  
  &.text-danger {
    color: #ef4444;
    .mdi { color: #ef4444; }
  }
}

.dropdown-divider {
  height: 1px;
  background: rgba(15, 23, 42, 0.06);
  margin: 0.4rem 0;
  :root[data-theme='dark'] & {
    background: rgba(255,255,255,0.06);
  }
}

.user-info-section {
  padding: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  
  .big-avatar {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(109, 93, 252, 0.08);
    color: #6d5dfc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  
  .user-details {
    .user-name { font-weight: 700; color: #1e293b; font-size: 0.8rem; :root[data-theme='dark'] & { color: white; } }
    .user-role { font-size: 0.66rem; color: #64748b; }
    .user-org { font-size: 0.58rem; color: #94a3b8; margin-top: 1px; }
  }
}

/* Switch 开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 16px;
  
  input { opacity: 0; width: 0; height: 0; }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #cbd5e1;
    transition: .4s;
    border-radius: 16px;
    
    :root[data-theme='dark'] & {
      background-color: #475569;
    }
    
    &:before {
      position: absolute;
      content: "";
      height: 12px;
      width: 12px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + .slider { background-color: #10b981; }
  input:checked + .slider:before { transform: translateX(14px); }
}

/* 3. 主中央区域 */
.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem 5vh;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

/* @vibe-intent 提问框及下方所有场景组件的宽度物理约束为最大 820px，保证绝对齐平线 */
.hero-content {
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

/* @vibe-intent 还原经典高定的 slogan 极富立体层次的渐变科技字体样式 */
.slogan {
  font-size: 2.6rem;
  font-weight: 800;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #1e293b 0%, #3b5998 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  letter-spacing: -0.02em;

  :root[data-theme='dark'] & {
    background: linear-gradient(135deg, #ffffff 0%, #60a5fa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* 4. 润滑大圆角胶囊输入框 */
.omni-input-card {
  width: 100%;
  max-width: 820px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 24px;
  box-shadow: 0 6px 30px -10px rgba(0, 0, 0, 0.08);
  padding: 1.15rem 1.15rem 0.6rem;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  
  :root[data-theme='dark'] & {
    background: #111625;
    border-color: rgba(255, 255, 255, 0.04);
    box-shadow: 0 6px 30px -10px rgba(0, 0, 0, 0.4);
  }

  &.focused {
    border-color: #6d5dfc;
    box-shadow: 0 6px 35px -5px rgba(109, 93, 252, 0.12);
    
    :root[data-theme='dark'] & {
      border-color: #60a5fa;
      box-shadow: 0 6px 35px -5px rgba(96, 165, 250, 0.15);
    }
  }
  
  textarea {
    width: 100%;
    border: none;
    background: transparent;
    color: #1e293b;
    font-size: 0.98rem;
    resize: none;
    outline: none;
    padding: 0 0.4rem 0.85rem;
    min-height: 48px;
    font-family: inherit;
    line-height: 1.6;
    
    :root[data-theme='dark'] & {
      color: rgba(255,255,255,0.9);
    }

    &::placeholder {
      color: #94a3b8;
      :root[data-theme='dark'] & {
        color: rgba(255, 255, 255, 0.35);
      }
    }
  }
  
  .input-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(15, 23, 42, 0.04);
    padding-top: 0.6rem;

    :root[data-theme='dark'] & {
      border-top-color: rgba(255,255,255,0.03);
    }
    
    .footer-left, .footer-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .footer-icon-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(15, 23, 42, 0.04);
        color: #475569;
        :root[data-theme='dark'] & {
          background: rgba(255,255,255,0.04);
          color: white;
        }
      }

      &.active {
        background: rgba(109, 93, 252, 0.06);
        color: #6d5dfc;
        font-size: 0.74rem;
        width: auto;
        padding: 0 0.5rem;
        font-weight: 600;
        gap: 0.2rem;

        :root[data-theme='dark'] & {
          background: rgba(96, 165, 250, 0.08);
          color: #60a5fa;
        }
      }
    }

    /* 国际期刊微胶囊下拉按钮 */
    .journal-dropdown-trigger {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 500;
      color: #475569;
      background: #f1f5f9;
      border: 1px solid rgba(15, 23, 42, 0.03);
      padding: 0.2rem 0.55rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;

      :root[data-theme='dark'] & {
        background: rgba(255,255,255,0.03);
        border-color: rgba(255,255,255,0.02);
        color: rgba(255,255,255,0.7);
      }

      &:hover {
        background: #e2e8f0;
        :root[data-theme='dark'] & {
          background: rgba(255,255,255,0.06);
        }
      }

      .mdi {
        font-size: 0.85rem;
      }
    }

    .plus-btn {
      color: #64748b;
    }

    /* 深度研究交互开关 */
    .deep-research-switch {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 500;
      color: #94a3b8;
      background: transparent;
      border: 1px solid rgba(15, 23, 42, 0.06);
      padding: 0.25rem 0.55rem;
      border-radius: 14px;
      cursor: pointer;
      user-select: none;
      transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);

      :root[data-theme='dark'] & {
        border-color: rgba(255, 255, 255, 0.05);
      }

      &:hover {
        border-color: #cbd5e1;
        color: #475569;
        :root[data-theme='dark'] & {
          border-color: rgba(255,255,255,0.15);
          color: white;
        }
      }

      .switch-badge {
        font-size: 0.58rem;
        background: #cbd5e1;
        color: #475569;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 4px;
        transition: all 0.2s;

        :root[data-theme='dark'] & {
          background: #475569;
          color: rgba(255,255,255,0.8);
        }
      }

      &.active {
        background: rgba(16, 185, 129, 0.06);
        border-color: rgba(16, 185, 129, 0.25);
        color: #10b981;

        .switch-badge {
          background: #10b981;
          color: white;
        }
      }
    }

    /* 向上发送小圆按钮 */
    .send-btn-round {
      background: #3b5998;
      color: white;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      box-shadow: 0 2px 6px rgba(59, 89, 152, 0.25);
      transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      
      :root[data-theme='dark'] & {
        background: #60a5fa;
        box-shadow: 0 2px 6px rgba(96, 165, 250, 0.25);
      }

      &:hover:not(:disabled) {
        transform: translateY(-1px) scale(1.06);
        box-shadow: 0 4px 10px rgba(59, 89, 152, 0.35);
      }
      
      &:disabled {
        background: #cbd5e1;
        color: #94a3b8;
        box-shadow: none;
        cursor: not-allowed;

        :root[data-theme='dark'] & {
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.15);
        }
      }
    }
  }
}

/* 5. 快捷微胶囊芯片 */
.quick-capsules {
  display: flex;
  gap: 0.65rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 820px;
  box-sizing: border-box;
  
  .capsule-chip {
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(15, 23, 42, 0.04);
    color: #64748b;
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.74rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 500;
    transition: all 0.2s;

    :root[data-theme='dark'] & {
      background: rgba(255,255,255,0.02);
      border-color: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.6);
    }
    
    &:hover {
      background: white;
      border-color: #cbd5e1;
      color: #1e293b;
      transform: translateY(-0.5px);

      :root[data-theme='dark'] & {
        background: rgba(255,255,255,0.06);
        border-color: rgba(255,255,255,0.1);
        color: white;
      }
    }
  }
}

/* 6. 多物理场景卡片三联组 (Bohrium 同款灰蓝色微光卡片) */
.workspace-grid-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 820px;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .grid-card {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(15, 23, 42, 0.05);
    border-radius: 16px;
    padding: 0.95rem 1.15rem;
    cursor: pointer;
    min-width: 0; // @vibe-intent 锁死子项最小宽度为 0，防止长字把 Grid 卡片列宽强行顶开
    box-sizing: border-box;
    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: 0 4px 15px -8px rgba(0,0,0,0.03);

    :root[data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.04);
      box-shadow: none;
    }

    &:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -10px rgba(109, 93, 252, 0.1);
      border-color: rgba(109, 93, 252, 0.15);

      :root[data-theme='dark'] & {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(96, 165, 250, 0.15);
        box-shadow: 0 8px 25px -10px rgba(0,0,0,0.4);
      }

      .arrow-icon {
        transform: translateX(2px);
        opacity: 0.95;
      }
    }

    .card-icon {
      font-size: 1.8rem;
      margin-right: 0.85rem;
      flex-shrink: 0;

      &.color-science { color: #8b5cf6; }
      &.color-db { color: #3b5998; :root[data-theme='dark'] & { color: #60a5fa; } }
      &.color-chart { color: #10b981; }
    }

    .card-text {
      flex: 1;
      min-width: 0;

      h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.82rem;
        font-weight: 700;
        color: #1e293b;
        :root[data-theme='dark'] & { color: white; }
      }

      p {
        margin: 0;
        font-size: 0.68rem;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .arrow-icon {
      font-size: 1.15rem;
      color: #cbd5e1;
      opacity: 0.6;
      transition: all 0.2s;
    }
  }
}

/* 7. 图文科学案例区 */
.recommend-section {
  width: 100%;
  max-width: 820px;
  margin-top: 2.2rem;
  display: flex;
  flex-direction: column;

  .section-title-bar {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 0.85rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .recommend-cards {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .recommend-card {
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(15, 23, 42, 0.04);
    border-radius: 12px;
    padding: 0.55rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

    :root[data-theme='dark'] & {
      background: rgba(255,255,255,0.01);
      border-color: rgba(255,255,255,0.03);
    }

    &:hover {
      background: white;
      transform: translateY(-2.5px);
      box-shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.06);
      border-color: #cbd5e1;

      :root[data-theme='dark'] & {
        background: rgba(255,255,255,0.03);
        border-color: rgba(255,255,255,0.08);
        box-shadow: none;
      }
    }

    .case-image-placeholder {
      width: 100%;
      aspect-ratio: 1.6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.4rem;
      margin-bottom: 0.45rem;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
    }

    .case-title {
      font-size: 0.68rem;
      font-weight: 600;
      color: #475569;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;

      :root[data-theme='dark'] & {
        color: rgba(255,255,255,0.7);
      }
    }
  }

  .recommend-footer-btns {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1.15rem;

    .footer-btn {
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        color: #3b5998;
        :root[data-theme='dark'] & {
          color: #60a5fa;
        }

        .spin-icon {
          transform: rotate(180deg);
        }
      }

      .spin-icon {
        font-size: 0.85rem;
        transition: transform 0.3s ease;
      }
    }
  }
}

/* 8. 为你推荐底栏与备案 */
.portal-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 0.5rem 1rem;
  width: 100%;
  border-top: 1px solid rgba(15, 23, 42, 0.04);

  :root[data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.03);
  }

  .footer-accordion-trigger {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.15s;

    &:hover {
      color: #64748b;
    }
  }

  .copyright-info {
    font-size: 0.62rem;
    color: #94a3b8;
    text-align: center;
    opacity: 0.75;
    letter-spacing: 0.01em;
  }
}
</style>
