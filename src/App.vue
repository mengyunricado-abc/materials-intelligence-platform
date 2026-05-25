<!--
  @vibe-intent 挂载全局 Agent 交互反馈拾取抽屉组件，实现跨页面元素拾取与 AI 重构入口注入。
  @vibe-model Gemini 3.5 Flash (High)
  @vibe-ref intents.md#2026-05-25
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import AgentFeedbackDrawer from './components/AgentFeedbackDrawer.vue'

onMounted(() => {
  // Check user preference for theme
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})
</script>

<template>
  <router-view></router-view>
  <AgentFeedbackDrawer />
</template>
