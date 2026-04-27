import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Portal',
    component: () => import('../pages/Portal.vue')
  },
  {
    path: '/console',
    name: 'Console',
    component: () => import('../layouts/ConsoleLayout.vue'),
    children: [
      {
        path: '',
        name: 'Workspace',
        component: () => import('../pages/Console.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
