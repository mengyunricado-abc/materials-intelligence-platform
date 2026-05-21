<template>
  <!--
   * @vibe-intent 全局壳布局，将侧边栏提升至路由层之外，实现 Portal 和 Console 双页面的
   * 导航栏全局常驻。侧边栏合并为统一的图标条（60px）+ 展开内容区，可折叠但不可隐藏。
   * Portal 页下点击导航图标跳转至 /console 并展开对应面板。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="app-layout">
    <!-- ======== 全局常驻侧边栏 ======== -->
    <aside class="global-sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- 图标导航条（始终可见 60px） -->
      <div class="icon-rail">
        <!-- Logo / 首页 -->
        <div class="rail-logo" @click="handleLogoClick" title="首页">
          <span class="mdi mdi-atom-variant logo-icon"></span>
        </div>

        <div class="rail-divider"></div>

        <!-- 新对话 -->
        <button
          class="rail-btn"
          title="新对话"
          @click="handleNewChat"
        >
          <span class="mdi mdi-plus-circle-outline"></span>
        </button>

        <!-- 历史对话（手风琴触发） -->
        <button
          class="rail-btn"
          :class="{ active: activePanel === 'history' }"
          title="历史对话"
          @click="togglePanel('history')"
        >
          <span class="mdi mdi-history"></span>
        </button>

        <!-- 文件 -->
        <button
          class="rail-btn"
          :class="{ active: activePanel === 'files' }"
          title="项目文件"
          @click="togglePanel('files')"
        >
          <span class="mdi mdi-folder-outline"></span>
        </button>

        <!-- 工具箱 -->
        <button
          class="rail-btn"
          :class="{ active: activePanel === 'tools' }"
          title="工具箱"
          @click="togglePanel('tools')"
        >
          <span class="mdi mdi-hammer-wrench"></span>
        </button>

        <div class="rail-spacer"></div>

        <!-- 折叠/展开 -->
        <button
          class="rail-btn"
          :title="isSidebarCollapsed ? '展开侧栏' : '折叠侧栏'"
          @click="isSidebarCollapsed = !isSidebarCollapsed"
        >
          <span
            class="mdi"
            :class="isSidebarCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          ></span>
        </button>
      </div>

      <!-- 展开内容面板 -->
      <div class="panel-area" v-show="!isSidebarCollapsed">
        <!-- 历史对话手风琴 -->
        <HistoryAccordion
          v-show="activePanel === 'history'"
          :is-open="true"
          :is-collapsed="false"
          @toggle="() => {}"
          @select="handleHistorySelect"
        />

        <!-- 文件树 -->
        <FileList
          v-show="activePanel === 'files'"
          @file-select="handleFileSelect"
          @file-upload="handleFileUpload"
        />

        <!-- 工具箱 -->
        <ToolList v-show="activePanel === 'tools'" />
      </div>
    </aside>

    <!-- ======== 页面内容区 ======== -->
    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTabs } from '../composables/useTabs'
import { useWorkspaceStore } from '../stores/workspace'
import HistoryAccordion from '../components/Sidebar/HistoryAccordion.vue'
import FileList from '../components/Sidebar/FileList.vue'
import ToolList from '../components/Sidebar/ToolList.vue'
import type { FileItem } from '../types/index'

const router = useRouter()
const route = useRoute()
const { openFileTab } = useTabs()
const workspaceStore = useWorkspaceStore()

// ---- 侧边栏状态 ----
const isSidebarCollapsed = ref(false)
/** 当前展开的面板：history / files / tools / null */
const activePanel = ref<'history' | 'files' | 'tools' | null>('history')

/** 点击同一图标再次点击收起，或切换到新面板 */
const togglePanel = (panel: 'history' | 'files' | 'tools') => {
  if (isSidebarCollapsed.value) {
    // 先展开侧边栏
    isSidebarCollapsed.value = false
    activePanel.value = panel
    // 若当前在 Portal 页，跳转到 Console
    if (route.name === 'Portal') {
      router.push({ name: 'Console', query: { panel } })
    }
    return
  }

  if (activePanel.value === panel) {
    // 同一图标：折叠内容区（不隐藏图标条）
    isSidebarCollapsed.value = true
    activePanel.value = null
  } else {
    activePanel.value = panel
    // 若当前在 Portal 页，跳转到 Console
    if (route.name === 'Portal') {
      router.push({ name: 'Console', query: { panel } })
    }
  }
}

/** 若在展开状态下点击 Logo，点击时若在 Console 跳回 Portal */
const handleLogoClick = () => {
  if (route.name === 'Portal') return
  router.push('/')
}

/** 新对话：若在 Portal 则跳转 Console */
const handleNewChat = () => {
  workspaceStore.createSession()
  if (route.name !== 'Console') {
    router.push('/console')
  }
}

/** 历史对话被选中：若在 Portal 则跳转 Console */
const handleHistorySelect = (id: string) => {
  if (route.name !== 'Console') {
    router.push('/console')
  }
}

/** 文件选中：在 Console 中打开 tab */
const handleFileSelect = (file: FileItem) => {
  if (route.name !== 'Console') {
    router.push('/console')
  }
  openFileTab(file)
}

const handleFileUpload = () => {
  console.log('触发文件上传')
}

// 监听 URL query 参数，支持从 Portal 页跳转后自动展开指定面板
watch(
  () => route.query.panel,
  (panel) => {
    if (panel && ['history', 'files', 'tools'].includes(panel as string)) {
      activePanel.value = panel as 'history' | 'files' | 'tools'
      isSidebarCollapsed.value = false
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

/* ======== 全局侧边栏 ======== */
.global-sidebar {
  display: flex;
  flex-shrink: 0;
  background-color: var(--glass-bg);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: calc(60px + 260px);
  overflow: hidden;

  &.collapsed {
    width: 60px;
  }
}

/* ---- 图标轨道（始终 60px） ---- */
.icon-rail {
  width: 60px;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0;
  border-right: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  gap: 0.25rem;
}

.rail-logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  margin-bottom: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-tertiary);
  }

  .logo-icon {
    font-size: 1.4rem;
    background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.rail-divider {
  width: 28px;
  height: 1px;
  background-color: var(--border-color);
  margin: 0.25rem 0;
}

.rail-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-tertiary);
  }

  &.active {
    color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.12);
  }
}

.rail-spacer {
  flex: 1;
}

/* ---- 展开内容区 ---- */
.panel-area {
  flex: 1;
  width: 260px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* ======== 页面内容区 ======== */
.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
</style>
