<template>
  <div class="tab-header">
    <div class="tabs-scroll-container">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-item"
        :class="{ active: tab.id === activeTabId }"
        @click="setActiveTab(tab.id)"
      >
        <span v-if="tab.icon" class="mdi tab-icon" :class="[tab.icon, tab.iconClass]"></span>
        <span class="tab-title">{{ tab.title }}</span>
        <button 
          v-if="tab.type === 'tool'" 
          class="close-btn" 
          @click.stop="closeTab(tab.id)"
          title="关闭"
        >
          <span class="mdi mdi-close"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTabs } from '@/composables/useTabs';

const { tabs, activeTabId, setActiveTab, closeTab } = useTabs();
</script>

<style scoped lang="scss">
.tab-header {
  height: 40px;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: flex-end;
  padding: 0 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
}

.tabs-scroll-container {
  display: flex;
  height: 32px;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none; // Firefox
  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  height: 100%;
  background-color: var(--bg-secondary);
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  min-width: 120px;
  max-width: 200px;
  color: var(--text-secondary);
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background-color: var(--bg-primary);
  }
  
  &.active {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-color: var(--border-color);
    border-bottom: 1px solid var(--bg-primary);
    z-index: 1;
    
    // Cover the parent's bottom border
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background-color: var(--bg-primary);
    }
  }
  
  .tab-title {
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  
  .tab-icon {
    font-size: 1rem;
  }
  
  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    margin-left: 0.25rem;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }
    
    .mdi {
      font-size: 0.8rem;
    }
  }
}
</style>
