<template>
  <div class="tool-list-container">
    <div class="list-header">
      <h3>工具箱</h3>
      <span class="badge">{{ toolRegistry.length }}</span>
    </div>
    
    <div class="tools-grid">
      <div 
        v-for="tool in toolRegistry" 
        :key="tool.id"
        class="tool-card"
        @click="openToolTab(tool.id)"
      >
        <div class="tool-icon" :class="tool.iconClass">
          <span class="mdi" :class="tool.icon"></span>
        </div>
        <div class="tool-info">
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toolRegistry } from '@/utils/toolsRegistry';
import { useTabs } from '@/composables/useTabs';

const { openToolTab } = useTabs();
</script>

<style scoped lang="scss">
.tool-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-header {
  padding: 1rem 1.5rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .badge {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
  }
}

.tools-grid {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.tool-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  
  &:hover {
    background-color: var(--card-bg-hover);
    border-color: var(--border-focus);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .tool-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background-color: var(--card-bg-hover);
    border: 1px solid var(--border-subtle);
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .tool-info {
    flex: 1;
    min-width: 0;
    
    .tool-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    
    .tool-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}
</style>
