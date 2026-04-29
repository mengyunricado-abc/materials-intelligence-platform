/**
 * @vibe-intent 提取多页签核心状态流转与联动逻辑，保障组件层轻量化，为后期状态库迁移铺路。
 * @vibe-model Gemini 3.1 Pro (High)
 * @vibe-ref intents.md#2026-04-28
 */

import { ref, computed } from 'vue';
import { toolRegistry } from '../utils/toolsRegistry';

export interface TabItem {
  id: string;      
  title: string;
  type: 'doc' | 'tool';
  icon?: string;
  iconClass?: string;
}

// Global state for tabs (simulating a store)
const tabs = ref<TabItem[]>([]);
const activeTabId = ref<string>('');

// Initialize with default document
if (tabs.value.length === 0) {
  tabs.value.push({
    id: 'doc_default',
    title: '未命名文档_01.md',
    type: 'doc',
    icon: 'mdi-file-document-outline',
    iconClass: 'text-blue-400'
  });
  activeTabId.value = 'doc_default';
}

export function useTabs() {
  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value));

  const openToolTab = (toolId: string) => {
    // 1. Check if it's already open (防重机制)
    const existingTab = tabs.value.find(t => t.id === toolId);
    if (existingTab) {
      activeTabId.value = toolId;
      return;
    }

    // 2. Find tool config
    const toolConfig = toolRegistry.find(t => t.id === toolId);
    if (!toolConfig) {
      console.warn(`Tool with id ${toolId} not found in registry.`);
      return;
    }

    // 3. Add to tabs and activate
    const newTab: TabItem = {
      id: toolConfig.id,
      title: toolConfig.name,
      type: 'tool',
      icon: toolConfig.icon,
      iconClass: toolConfig.iconClass
    };
    
    tabs.value.push(newTab);
    activeTabId.value = newTab.id;
  };

  const openFileTab = (file: any) => {
    const existingTab = tabs.value.find(t => t.id === file.id);

    if (existingTab) {
      activeTabId.value = file.id;
      return;
    }

    const newTab: TabItem = {
      id: file.id,
      title: file.name,
      type: 'doc',
      icon: file.icon,
      iconClass: file.iconClass
    };
    
    tabs.value.push(newTab);
    activeTabId.value = file.id;
  };


  const closeTab = (tabId: string) => {
    const index = tabs.value.findIndex(t => t.id === tabId);
    if (index === -1) return;

    // Remove tab
    tabs.value.splice(index, 1);

    // If we closed the active tab, switch to the last available tab (or default)
    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        // Switch to the one before it, or the first one if it was index 0
        const newIndex = index > 0 ? index - 1 : 0;
        activeTabId.value = tabs.value[newIndex].id;
      } else {
        // Fallback (shouldn't happen if we prevent closing the default doc)
        activeTabId.value = '';
      }
    }
  };

  const setActiveTab = (tabId: string) => {
    activeTabId.value = tabId;
  };

  return {
    tabs,
    activeTabId,
    activeTab,
    openToolTab,
    openFileTab,
    closeTab,
    setActiveTab
  };

}
