<script setup lang="ts">
import { onMounted } from 'vue'

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
</template>
