<template>
  <!--
   * @vibe-intent 工具大厅页（/tools），展示全量工具，按分类分组，
   * 支持订阅/取消订阅操作，已订阅工具显示对应标记。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="tools-gallery">
    <!-- 顶部 Hero -->
    <div class="gallery-hero">
      <div class="hero-text">
        <h1 class="hero-title">工具大厅</h1>
        <p class="hero-desc">发现并订阅专属于您研究场景的科研工具，订阅后在左侧侧边栏快速访问</p>
      </div>
      <div class="hero-search">
        <span class="mdi mdi-magnify search-icon"></span>
        <input v-model="searchQuery" placeholder="搜索工具..." class="search-input" />
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat"
        class="cat-tab"
        :class="{ active: selectedCategory === cat }"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- 工具网格 -->
    <div class="tools-grid">
      <div
        v-for="tool in filteredTools"
        :key="tool.id"
        class="tool-card"
        :class="{ subscribed: tool.subscribed }"
      >
        <div class="card-top">
          <div class="tool-icon-wrap">
            <span class="mdi" :class="tool.icon"></span>
          </div>
          <div class="subscribe-toggle" @click="toggleSubscribe(tool.id)">
            <span v-if="tool.subscribed" class="mdi mdi-check-circle subscribed-icon"></span>
            <span v-else class="mdi mdi-plus-circle-outline add-icon"></span>
            {{ tool.subscribed ? '已订阅' : '订阅' }}
          </div>
        </div>

        <div class="card-body">
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.description }}</div>
          <div class="tool-category">{{ tool.category }}</div>
        </div>

        <button
          class="open-btn"
          v-if="tool.subscribed && tool.component"
          @click="openTool(tool.id)"
        >
          <span class="mdi mdi-open-in-app"></span>
          打开工具
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="filteredTools.length === 0">
      <span class="mdi mdi-toolbox-outline"></span>
      <p>暂无匹配工具</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toolRegistry } from '../utils/toolsRegistry'
import { useTabs } from '../composables/useTabs'

const router = useRouter()
const { openToolTab } = useTabs()

const searchQuery = ref('')
const selectedCategory = ref('全部')

const categories = computed(() => {
  const cats = new Set(toolRegistry.map(t => t.category || '其他'))
  return ['全部', ...cats]
})

const filteredTools = computed(() => {
  let list = toolRegistry
  if (selectedCategory.value !== '全部') {
    list = list.filter(t => t.category === selectedCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  }
  return list
})

const toggleSubscribe = (toolId: string) => {
  const tool = toolRegistry.find(t => t.id === toolId)
  if (tool) tool.subscribed = !tool.subscribed
}

const openTool = (toolId: string) => {
  openToolTab(toolId)
  router.push('/console')
}
</script>

<style scoped lang="scss">
.tools-gallery {
  height: 100%;
  overflow-y: auto;
  padding: 0;
  background-color: var(--bg-primary);
}

/* ---- Hero 区 ---- */
.gallery-hero {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(139, 92, 246, 0.06));
  border-bottom: 1px solid var(--border-color);
  padding: 2.5rem 2rem 2rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.hero-title {
  margin: 0 0 0.5rem;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
}

.hero-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  max-width: 500px;
  line-height: 1.6;
}

.hero-search {
  position: relative;
  flex-shrink: 0;
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
  padding: 0.6rem 1rem 0.6rem 2.3rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  width: 260px;
  outline: none;
  transition: all 0.2s;

  &::placeholder { color: var(--text-secondary); }
  &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
}

/* ---- 分类 Tab ---- */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.cat-tab {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover { background-color: var(--bg-secondary); color: var(--text-primary); }
  &.active {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
}

/* ---- 工具网格 ---- */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
  padding: 1.5rem 2rem;
}

.tool-card {
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    border-color: var(--border-focus);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.subscribed {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.03);
  }
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.subscribe-toggle {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  transition: all 0.2s;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);

  &:hover { color: var(--color-primary); border-color: var(--color-primary); }

  .subscribed-icon { color: var(--color-success); font-size: 0.9rem; }
  .add-icon { font-size: 0.9rem; }
}

.tool-subscribed .subscribe-toggle {
  color: var(--color-success);
  border-color: rgba(16, 185, 129, 0.3);
}

.card-body {
  flex: 1;

  .tool-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.4rem;
  }

  .tool-desc {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 0.5rem;
  }

  .tool-category {
    display: inline-block;
    font-size: 0.7rem;
    color: var(--color-primary);
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.15);
    padding: 0.1rem 0.5rem;
    border-radius: 10px;
  }
}

.open-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  transition: background-color 0.2s;
  &:hover { background-color: var(--color-primary-hover); }
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
