/**
 * @vibe-intent 建立统一的工具注册中心，严格约束所有跨项目工具作为原生 Vue 3 组件接入。
 * @vibe-model Gemini 3.1 Pro (High)
 * @vibe-ref intents.md#2026-04-28
 */

import { defineAsyncComponent } from 'vue';

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconClass?: string;
  component: any; // Vue component definition
}

export const toolRegistry: ToolConfig[] = [
  {
    id: 'tool_unit_converter',
    name: '单位换算',
    description: '快速进行物理量与材料学单位换算',
    icon: 'mdi-calculator',
    iconClass: 'text-blue-500',
    component: defineAsyncComponent(() => import('@/components/Tools/UnitConverter.vue'))
  },
  {
    id: 'tool_chart_analysis',
    name: '数据分析',
    description: '上传并分析能谱图、阻抗谱等原始数据',
    icon: 'mdi-chart-bell-curve-cumulative',
    iconClass: 'text-emerald-500',
    component: defineAsyncComponent(() => import('@/components/Tools/ChartAnalysis.vue'))
  }
];
