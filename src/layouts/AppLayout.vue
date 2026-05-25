<template>
  <!--
   * @vibe-intent 全局单列侧边栏重构，废除原左右双列分布（60px轨道+260px面板），
   * 收敛为极简大气的 260px（折叠后为 60px）单列容器。
   * 整合 Logo、新建对话，并将“已订阅工具”和“历史对话”作为主导航手风琴在原地垂直向下展开。
   * @vibe-model Gemini 3.5 Flash (High)
   * @vibe-ref intents.md#2026-05-25
  -->
  <div class="app-layout">
    <!-- ======== 全局单列常驻侧边栏 ======== -->
    <aside class="global-sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- 1. 头部：Logo 与 标名 -->
      <div class="sidebar-header" @click="handleLogoClick" title="返回主门户">
        <div class="logo-wrap">
          <span class="mdi mdi-atom-variant logo-icon"></span>
        </div>
        <span class="brand-title" v-show="!isSidebarCollapsed">智慧材料终端</span>
      </div>

      <!-- 2. 操作区：新科学对话 -->
      <div class="sidebar-actions">
        <button
          class="new-chat-btn"
          :class="{ 'collapsed-btn': isSidebarCollapsed }"
          @click="handleNewChat"
          title="开启新科学对话"
        >
          <span class="mdi mdi-plus-circle-outline btn-icon"></span>
          <span class="btn-text" v-show="!isSidebarCollapsed">新建对话</span>
        </button>
      </div>

      <!-- 3. 主导航菜单列表（垂直） -->
      <div class="sidebar-nav">
        <!-- AI 对话 (Workspace) -->
        <div
          class="nav-item"
          :class="{ active: activeMenuId === 'chat' }"
          @click="navigateTo('chat')"
          title="AI 对话工作站"
        >
          <span class="mdi mdi-forum-outline nav-icon"></span>
          <span class="nav-label" v-show="!isSidebarCollapsed">AI 对话</span>
        </div>

        <!-- 科研知识库 (左右分布大屏) -->
        <div
          class="nav-item"
          :class="{ active: activeMenuId === 'knowledge' }"
          @click="navigateTo('knowledge')"
          title="文献与实验知识库"
        >
          <span class="mdi mdi-database-outline nav-icon"></span>
          <span class="nav-label" v-show="!isSidebarCollapsed">科研知识库</span>
        </div>

        <!-- 已订阅工具手风琴 -->
        <div 
          class="nav-item accordion-item" 
          :class="{ 
            expanded: isToolsExpanded && !isSidebarCollapsed,
            active: activeMenuId === 'tools'
          }"
        >
          <div class="accordion-trigger" @click="toggleToolsAccordion" title="常用科学工具箱">
            <div class="trigger-left">
              <span class="mdi mdi-hammer-wrench nav-icon"></span>
              <span class="nav-label" v-show="!isSidebarCollapsed">已订阅工具</span>
            </div>
            <span
              v-show="!isSidebarCollapsed"
              class="mdi chevron"
              :class="isToolsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            ></span>
          </div>

          <transition name="accordion">
            <div class="accordion-body" v-show="isToolsExpanded && !isSidebarCollapsed">
              <div class="inner-list-wrap">
                <ToolList />
              </div>
            </div>
          </transition>
        </div>

        <!-- 历史对话手风琴 -->
        <HistoryAccordion
          :is-open="isHistoryExpanded"
          :is-collapsed="isSidebarCollapsed"
          @toggle="toggleHistoryAccordion"
          @select="handleHistorySelect"
        />
      </div>

      <div class="sidebar-spacer"></div>

      <!-- 4. 底部：展开/收缩控制轨 -->
      <div class="sidebar-footer">
        <button
          class="collapse-toggle-btn"
          :title="isSidebarCollapsed ? '展开导航' : '折叠导航'"
          @click="isSidebarCollapsed = !isSidebarCollapsed"
        >
          <span
            class="mdi"
            :class="isSidebarCollapsed ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'"
          ></span>
        </button>
      </div>
    </aside>

    <!-- ======== 右侧核心页面内容区 ======== -->
    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkspaceStore } from '../stores/workspace'
import HistoryAccordion from '../components/Sidebar/HistoryAccordion.vue'
import ToolList from '../components/Sidebar/ToolList.vue'

const router = useRouter()
const route = useRoute()
const workspaceStore = useWorkspaceStore()

// ---- 侧边栏整体展开收起 ----
const isSidebarCollapsed = ref(false)

// ---- 手风琴独立展开状态 ----
const isToolsExpanded = ref(true)
const isHistoryExpanded = ref(true)

// ---- 当前激活高亮的菜单 ID ----
const activeMenuId = ref<'portal' | 'chat' | 'knowledge' | 'tools' | 'history'>('chat')

/** 处理 Logo 点击，返回主 Portal */
const handleLogoClick = () => {
  if (route.name === 'Portal') return
  router.push('/')
}

/** 新建对话 */
const handleNewChat = () => {
  workspaceStore.createSession()
  if (route.name !== 'Chat') {
    router.push('/chat')
  }
}

/** 主导航菜单点击跳转 */
const navigateTo = (menu: 'chat' | 'knowledge') => {
  activeMenuId.value = menu
  if (menu === 'chat') {
    router.push('/chat')
  } else if (menu === 'knowledge') {
    router.push('/knowledge')
  }
}

/** 工具箱手风琴折叠展开（含折叠状态弹开联动） */
const toggleToolsAccordion = () => {
  if (isSidebarCollapsed.value) {
    isSidebarCollapsed.value = false
    isToolsExpanded.value = true
    return
  }
  isToolsExpanded.value = !isToolsExpanded.value
}

/** 历史对话手风琴折叠展开（含折叠状态弹开联动） */
const toggleHistoryAccordion = () => {
  if (isSidebarCollapsed.value) {
    isSidebarCollapsed.value = false
    isHistoryExpanded.value = true
    return
  }
  isHistoryExpanded.value = !isHistoryExpanded.value
}

/** 历史列表项选中事件 */
const handleHistorySelect = () => {
  if (route.name !== 'Chat') {
    router.push('/chat')
  }
}

// ---- 路由联动侦听：自动高亮侧栏对应项 ----
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/console')) {
      activeMenuId.value = 'chat'
    } else if (path.startsWith('/knowledge')) {
      activeMenuId.value = 'knowledge'
    } else if (path.startsWith('/tools')) {
      activeMenuId.value = 'tools'
      // 跳转至全量工具页时，可默认开启左侧已订阅工具下拉
      isToolsExpanded.value = true
    } else if (path.startsWith('/history')) {
      activeMenuId.value = 'history'
      // 跳转至全量历史对话页时，可默认开启左侧历史下拉
      isHistoryExpanded.value = true
    } else if (path === '/') {
      activeMenuId.value = 'portal'
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* ======== 全局单列侧边栏 ======== */
.global-sidebar {
  width: 260px;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background-color: var(--glass-bg, rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  z-index: 100;

  &.collapsed {
    width: 60px;

    .sidebar-header {
      justify-content: center;
      padding: 0;
    }
    
    .sidebar-actions {
      padding: 0.5rem 0;
      justify-content: center;
    }

    .sidebar-nav {
      padding: 0.5rem 0;
      align-items: center;
    }

    .sidebar-footer {
      justify-content: center;
    }
  }
}

/* 1. 头部 Logo */
.sidebar-header {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0 1.25rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  flex-shrink: 0;
  user-select: none;
  transition: all 0.2s;

  &:hover {
    background-color: var(--bg-tertiary);
  }

  .logo-wrap {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  }

  .logo-icon {
    font-size: 1.15rem;
    color: white;
  }

  .brand-title {
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: linear-gradient(to right, var(--text-primary), #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
  }
}

/* 2. 新对话按钮 */
.sidebar-actions {
  padding: 0.75rem 0.75rem 0.5rem;
  display: flex;
  justify-content: center;
  flex-shrink: 0;

  .new-chat-btn {
    width: 100%;
    height: 38px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--color-primary), rgba(59, 130, 246, 0.7));
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
      background: linear-gradient(135deg, var(--color-primary-hover), #8b5cf6);
    }

    &.collapsed-btn {
      width: 36px;
      height: 36px;
      padding: 0;
      border-radius: 50%;
      
      .btn-icon {
        font-size: 1.25rem;
        margin: 0;
      }
    }
  }
}

/* 3. 垂直导航项 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 40px;
    padding: 0 0.75rem;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 500;
    user-select: none;
    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

    .nav-icon {
      font-size: 1.15rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
    }

    &:hover {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    &.active {
      color: var(--color-primary);
      background-color: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.15);
      font-weight: 600;

      .nav-icon { color: var(--color-primary); }
    }
  }
}

/* 手风琴主节点额外调整 */
.accordion-item {
  display: flex !important;
  flex-direction: column !important;
  height: auto !important;
  padding: 0 !important;
  gap: 0 !important;
  border: none !important;
  background: transparent !important;

  .accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 40px;
    padding: 0 0.75rem;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;

    .trigger-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .chevron {
      font-size: 0.95rem;
      color: var(--text-secondary);
      opacity: 0.7;
    }

    &:hover {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }
  }

  &.expanded {
    .accordion-trigger {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
  
  &.active {
    .accordion-trigger {
      color: var(--color-primary);
    }
  }
}

.accordion-body {
  width: 100%;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  margin-top: 0.2rem;
}

.inner-list-wrap {
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

/* 过渡动画 */
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  max-height: 300px;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.sidebar-spacer {
  flex: 1;
}

/* 4. 折叠底部 */
.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.75rem;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;

  .collapse-toggle-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    transition: all 0.2s;

    &:hover {
      color: var(--text-primary);
      background-color: var(--bg-secondary);
    }
  }
}

/* ======== 右侧核心内容区 ======== */
.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
</style>
