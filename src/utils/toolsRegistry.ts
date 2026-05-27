/**
 * @vibe-intent 建立统一的工具注册中心，新增 subscribed 字段区分已订阅工具，
 * 侧边栏仅展示已订阅工具，工具大厅展示全量。
 * @vibe-model Claude Sonnet 4.6 (Thinking)
 * @vibe-ref intents.md#2026-05-21
 */

import { defineAsyncComponent } from 'vue';

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconClass?: string;
  component: any; // Vue component definition
  /** 是否已订阅：侧边栏仅展示 subscribed=true 的工具 */
  subscribed?: boolean;
  /** 工具分类标签 */
  category?: string;
}

export const toolRegistry: ToolConfig[] = [
  {
    id: 'tool_unit_converter',
    name: '单位换算',
    description: '快速进行物理量与材料学单位换算',
    icon: 'mdi-calculator',
    iconClass: 'text-blue-500',
    subscribed: true,
    category: '计算工具',
    component: defineAsyncComponent(() => import('@/components/Tools/UnitConverter.vue'))
  },
  {
    id: 'tool_chart_analysis',
    name: '数据分析',
    description: '上传并分析能谱图、阻抗谱等原始数据',
    icon: 'mdi-chart-bell-curve-cumulative',
    iconClass: 'text-emerald-500',
    subscribed: true,
    category: '数据工具',
    component: defineAsyncComponent(() => import('@/components/Tools/ChartAnalysis.vue'))
  },
  {
    id: 'tool_graphviz',
    name: 'Graphviz 绘图',
    description: '使用 DOT 语法绘制流程图与关系图',
    icon: 'mdi-graph-outline',
    iconClass: 'text-purple-500',
    subscribed: false,
    category: '可视化',
    component: null
  },
  {
    id: 'tool_formula',
    name: '化学方程式',
    description: '输入分子式，生成标准化化学方程式',
    icon: 'mdi-flask-outline',
    iconClass: 'text-orange-500',
    subscribed: false,
    category: '科研工具',
    component: null
  },
  {
    id: 'tool_reference',
    name: '参考文献管理',
    description: '批量管理、导出 APA/GB/MLA 格式引用',
    icon: 'mdi-book-open-page-variant-outline',
    iconClass: 'text-rose-500',
    subscribed: false,
    category: '写作辅助',
    component: null
  },
  {
    id: 'tool_crystal',
    name: '晶体结构查询',
    description: '查询 ICSD 数据库，可视化晶格参数',
    icon: 'mdi-cube-outline',
    iconClass: 'text-cyan-500',
    subscribed: false,
    category: '材料科学',
    component: null
  },
];
