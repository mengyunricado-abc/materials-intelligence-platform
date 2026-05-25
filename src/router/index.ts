/**
 * @vibe-intent 路由重构：将 Portal 和 Console 均嵌套在 AppLayout 全局壳布局下，
 * 新增 /history（历史管理页）和 /tools（工具大厅页）独立路由。
 * @vibe-model Claude Sonnet 4.6 (Thinking)
 * @vibe-ref intents.md#2026-05-21
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Portal',
        component: () => import('../pages/Portal.vue')
      },
      {
        path: 'console',
        name: 'Console',
        component: () => import('../layouts/ConsoleLayout.vue'),
        children: [
          {
            path: '',
            name: 'Workspace',
            component: () => import('../pages/Console.vue')
          }
        ]
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('../pages/HistoryPage.vue')
      },
      {
        path: 'tools',
        name: 'ToolsGallery',
        component: () => import('../pages/ToolsGallery.vue')
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('../pages/KnowledgePage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
