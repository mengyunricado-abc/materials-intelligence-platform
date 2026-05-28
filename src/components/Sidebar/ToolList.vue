<template>
  <!--
   * @vibe-intent 工具箱侧边栏面板，仅展示 subscribed=true 的已订阅工具。
   * T5: 工具列表项改为图标+名称简化一行式，去掉描述和卡片背景。
   * T7: 工具卡片点击改为 window.open 新标签页开启。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-28
  -->
  <div class="tool-list-container">
    <!-- @vibe-intent 彻底清除冗余的 list-header 与角标数字以极致防噪，与父级手风琴头融为一体 -->

    <!-- 已订阅工具列表 -->
    <div class="tools-list" v-if="subscribedTools.length > 0">
      <div
        v-for="tool in subscribedTools"
        :key="tool.id"
        class="tool-item"
        @click="openToolNewTab(tool.id)"
        :title="tool.description"
      >
        <span class="mdi tool-icon" :class="tool.icon"></span>
        <span class="tool-name">{{ tool.name }}</span>
      </div>
    </div>

    <!-- 空状态：无订阅 -->
    <div class="empty-hint" v-else>
      <span class="mdi mdi-toolbox-outline"></span>
      <p>暂未订阅任何工具</p>
    </div>

    <!-- 底部固定：查看全部工具 (Bohrium 同款无框平铺式子项，高度对齐) -->
    <div class="view-all-item" @click="goToGallery">
      <span>查看全部</span>
      <span class="mdi mdi-open-in-new view-all-icon"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { toolRegistry } from '@/utils/toolsRegistry'

const router = useRouter()

/** 仅展示已订阅工具 */
const subscribedTools = computed(() => toolRegistry.filter(t => t.subscribed))

/**
 * T7: 工具卡片点击改为在新标签页开启，将工具与知识库 Tab 体系物理隔离
 */
const openToolNewTab = (toolId: string) => {
  router.push(`/tools/run?toolId=${toolId}`)
}

const goToGallery = () => {
  router.push('/tools')
}
</script>

<style scoped lang="scss">
.tool-list-container {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.25rem;
}

/* ---- 工具树状列表（带左侧垂直引导树形线，与历史对话严格对齐）---- */
.tools-list {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0.5rem 0.25rem 0; // 去掉左侧 padding，方便子项左侧绝对对齐
 
  /**
   * @vibe-intent 引导线定位在 1.25rem 处，在 1.5rem 的子项缩进左侧构成树状连接线
   * @vibe-model Gemini 3.5 Flash
   * @vibe-ref intents.md#2026-05-28
   */
  &::before {
    content: '';
    position: absolute;
    left: 1.25rem;
    top: 0.5rem;
    bottom: 0.5rem;
    width: 1px;
    background-color: rgba(15, 23, 42, 0.08);

    :root[data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.06);
    }
  }
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: 32px;
  padding: 0 0.5rem 0 1.5rem; // 左端对齐：相对于父项 0.75rem 提供完美的 1.5rem 阶梯缩进
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 0.15rem;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.45);
    :root[data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.04);
    }
  }

  .tool-icon {
    font-size: 0.95rem;
    width: 18px;
    text-align: center;
    color: #64748b;
    flex-shrink: 0;
    opacity: 0.85;
    
    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .tool-name {
    font-size: 0.88rem;   /* 字号放大至 0.88rem，与父级菜单文字大小一致 */
    font-weight: 400;      
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    :root[data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

/* ---- 空状态 ---- */
.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  opacity: 0.6;
  padding: 1.5rem;

  .mdi { font-size: 2rem; }
  p { margin: 0; }
}

/* --- 查看全部工具 (Bohrium 同款极简子项平铺式，与历史对话完美对齐) --- */
.view-all-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: 32px;
  padding: 0 0.5rem 0 1.5rem; // 左端对齐：与上方列表项的 1.5rem 完美对齐
  margin-bottom: 0.25rem;
  cursor: pointer;
  font-size: 0.78rem;          /* 查看全部字号 0.78rem，比子列表项 0.88rem 略小 */
  color: #64748b;
  transition: color 0.15s;

  :root[data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.45);
  }

  &:hover {
    color: #3b5998;
    :root[data-theme='dark'] & {
      color: #60a5fa;
    }
  }

  .view-all-icon {
    font-size: 0.7rem;
    opacity: 0.75;
  }
}
</style>
