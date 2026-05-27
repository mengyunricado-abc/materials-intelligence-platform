/**
 * @vibe-intent 多页签状态流转，阶段五：移除 csv/pdf 文件类型分支，
 * 新增 word (.docx/.doc) 文件 Tab 路由支持，其他逻辑保持不变。
 * @vibe-model Claude Sonnet 4.6 (Thinking)
 * @vibe-ref intents.md#2026-05-21
 */

import { ref, computed } from 'vue';
import { toolRegistry } from '../utils/toolsRegistry';

export interface TabItem {
  id: string;
  title: string;
  type: 'doc' | 'tool';
  /** 文件子类型，用于在 ConsoleLayout 中决定渲染哪个 Viewer */
  fileType?: 'md' | 'docx' | 'xlsx' | 'other';
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
    fileType: 'md',
    icon: 'mdi-file-document-outline',
    iconClass: 'text-blue-400'
  });
  activeTabId.value = 'doc_default';
}

/** 根据文件名推断 fileType */
function inferFileType(name: string): TabItem['fileType'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.md')) return 'md';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
  return 'other';
}

export function useTabs() {
  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value));

  const openToolTab = (toolId: string) => {
    const existingTab = tabs.value.find(t => t.id === toolId);
    if (existingTab) {
      activeTabId.value = toolId;
      return;
    }

    const toolConfig = toolRegistry.find(t => t.id === toolId);
    if (!toolConfig) {
      console.warn(`Tool with id ${toolId} not found in registry.`);
      return;
    }

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
      fileType: inferFileType(file.name),
      icon: file.icon,
      iconClass: file.iconClass
    };

    tabs.value.push(newTab);
    activeTabId.value = file.id;
  };

  const closeTab = (tabId: string) => {
    const index = tabs.value.findIndex(t => t.id === tabId);
    if (index === -1) return;

    tabs.value.splice(index, 1);

    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        const newIndex = index > 0 ? index - 1 : 0;
        activeTabId.value = tabs.value[newIndex].id;
      } else {
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
