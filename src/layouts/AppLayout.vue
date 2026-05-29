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

      <!-- 3. 主导航菜单列表（垂直） -->
      <div class="sidebar-nav">
        <!-- 新建对话 nav-item：合并自原有按钮，删除独立"AI 对话"入口 -->
        <!-- 点击 = createSession() + 跳转门户页 / 让用户在门户页输入问题 -->
        <div
          class="nav-item"
          :class="{ active: activeMenuId === 'portal' }"
          @click="handleNewChat"
          title="开启新科学对话"
        >
          <span class="mdi mdi-plus-circle-outline nav-icon"></span>
          <span class="nav-label" v-show="!isSidebarCollapsed">AI对话</span>
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

      <!-- T1: sidebar-spacer 已删除，sidebar-nav (flex:1) 独占剩余高度 -->

      <!-- 5. 底部：展开/收缩控制轨 -->
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

/**
 * @vibe-intent 新建对话：初始化新 session 备用，然后跳转至门户页让用户输入第一个问题
 * @vibe-model Gemini 3.5 Flash
 * @vibe-ref intents.md#2026-05-28
 */
const handleNewChat = () => {
  workspaceStore.createSession()
  router.push('/')
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
  // 废除硬编码的 router.push('/chat') 劫持，将路由跳转分流交由 HistoryAccordion 闭环控制
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

/* ======== 全局单列侧边栏 (Bohrium 微光科学灰蓝底色) ======== */
.global-sidebar {
  /**
   * @vibe-intent 注入 Bohrium 经典柔和微光灰蓝色背景底色，对标科学风低视觉疲劳度
   * @vibe-model Gemini 3.5 Flash
   * @vibe-ref intents.md#2026-05-28
   */
  width: 260px;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background-color: #ebedf3; 
  border-right: 1px solid rgba(15, 23, 42, 0.06);
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  z-index: 100;

  :root[data-theme='dark'] & {
    background-color: #0f1320;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
  }

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
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  background-color: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
  user-select: none;
  transition: all 0.2s;

  :root[data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    :root[data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  .logo-wrap {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: linear-gradient(135deg, #3b5998, #6d5dfc);
  }

  .logo-icon {
    font-size: 1.15rem;
    color: white;
  }

  .brand-title {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #1e293b;
    white-space: nowrap;

    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.9);
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

  /* 父级导航项字重下调至 500 中等，对标极简清纯质感 */
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 40px;
    padding: 0 0.75rem;
    border-radius: 8px;
    color: #475569;
    cursor: pointer;
    font-size: 0.88rem;       
    font-weight: 500;          /* 字重调为 500 */
    letter-spacing: 0.02em;
    user-select: none;
    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.65);
    }

    .nav-icon {
      font-size: 1.15rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
      color: #64748b;

      :root[data-theme='dark'] & {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .nav-label {
      white-space: nowrap;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.4);
      color: #0f172a;

      :root[data-theme='dark'] & {
        background-color: rgba(255, 255, 255, 0.05);
        color: white;
      }
    }

    /* 弱化高亮激活项背景，用极其柔和的中低对比高亮，防刺眼 */
    &.active {
      color: #3b5998;
      background-color: rgba(59, 89, 152, 0.08);
      border: 1px solid rgba(59, 89, 152, 0.12);

      :root[data-theme='dark'] & {
        color: #60a5fa;
        background-color: rgba(96, 165, 250, 0.08);
        border: 1px solid rgba(96, 165, 250, 0.12);
      }

      .nav-icon { 
        color: #3b5998; 
        :root[data-theme='dark'] & {
          color: #60a5fa;
        }
      }
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
    color: #475569;
    cursor: pointer;
    font-size: 0.88rem;    
    font-weight: 500;       /* 字重调为 500 */
    letter-spacing: 0.02em;
    transition: all 0.2s;

    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.65);
    }

    .trigger-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .chevron {
      font-size: 0.95rem;
      color: #64748b;
      opacity: 0.7;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.4);
      color: #0f172a;

      :root[data-theme='dark'] & {
        background-color: rgba(255, 255, 255, 0.05);
        color: white;
      }
    }
  }

  &.expanded {
    .accordion-trigger {
      color: #1f2937;
      :root[data-theme='dark'] & {
        color: white;
      }
    }
  }
  
  &.active {
    .accordion-trigger {
      color: #3b5998;
      :root[data-theme='dark'] & {
        color: #60a5fa;
      }
    }
  }
}

.accordion-body {
  width: 100%;
  overflow: hidden;
  background-color: transparent;
  border-radius: 8px;
  margin-top: 0.1rem;
}

.inner-list-wrap {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.1) transparent;
}

/* 4. Bohrium 科学家卡片与升级区域 */
.sidebar-user-section {
  display: flex;
  flex-direction: column;
  padding: 0.85rem;
  margin: 0 0.5rem;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  gap: 0.6rem;

  :root[data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.05);
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.4);
      :root[data-theme='dark'] & {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }

    .user-avatar-wrap {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #3b5998;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.05rem;
      flex-shrink: 0;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;

      .user-name {
        font-size: 0.76rem;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        :root[data-theme='dark'] & {
          color: white;
        }
      }

      .user-role {
        font-size: 0.64rem;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .user-arrow {
      font-size: 0.85rem;
      color: #94a3b8;
    }
  }

  .quota-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.45rem 0.65rem;
    border-radius: 6px;
    background-color: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(15, 23, 42, 0.03);

    :root[data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.04);
    }

    .quota-left {
      display: flex;
      align-items: center;
      gap: 0.35rem;

      .premium-star {
        font-size: 0.85rem;
        color: #8b5cf6;
      }

      .quota-level {
        font-size: 0.72rem;
        font-weight: 700;
        color: #4b5563;
        :root[data-theme='dark'] & { color: rgba(255, 255, 255, 0.8); }
      }

      .upgrade-btn {
        font-size: 0.6rem;
        padding: 1px 4px;
        border-radius: 4px;
        background-color: #8b5cf6;
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;

        &:hover { opacity: 0.9; }
      }
    }

    .quota-right {
      .quota-count {
        font-size: 0.7rem;
        font-weight: 600;
        color: #1e293b;
        :root[data-theme='dark'] & { color: rgba(255, 255, 255, 0.8); }
      }
    }
  }

  .aux-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.15rem 0.25rem;

    .lang-selector {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;

      &:hover { color: #1e293b; :root[data-theme='dark'] & { color: white; } }

      .mdi { font-size: 0.85rem; }
    }

    .aux-icons {
      display: flex;
      align-items: center;
      gap: 0.65rem;

      .mdi {
        font-size: 0.95rem;
        color: #64748b;
        cursor: pointer;
        transition: color 0.15s;

        &:hover { color: #1e293b; :root[data-theme='dark'] & { color: white; } }
      }
    }
  }
}

/* 5. 折叠底部 */
.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.75rem;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
  flex-shrink: 0;

  :root[data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.04);
  }

  .collapse-toggle-btn {
    background: transparent;
    border: none;
    color: #64748b;
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
      color: #1e293b;
      background-color: rgba(255, 255, 255, 0.4);
      :root[data-theme='dark'] & {
        color: white;
        background-color: rgba(255, 255, 255, 0.05);
      }
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

