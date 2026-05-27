<template>
  <!--
   * @vibe-intent 消息流容器，负责渲染 ChatBubble 和 ActionCard 的混合列表，
   * 并在新消息加入时自动将滚动位置对齐到底部，确保用户始终看到最新内容。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="chat-messages" ref="containerRef">
    <template v-for="msg in messages" :key="msg.id">
      <!-- 普通气泡 -->
      <ChatBubble
        v-if="msg.role === 'user' || msg.role === 'ai'"
        :role="msg.role"
        :content="msg.content"
      />
      <!-- 可操作卡片 -->
      <ActionCard
        v-else-if="msg.role === 'action-card' && msg.actionCard"
        :title="msg.actionCard.title"
        :description="msg.actionCard.description"
        @preview-diff="emit('preview-diff')"
      />
    </template>

    <!-- AI 思考中动画 -->
    <div class="thinking-indicator" v-if="isThinking">
      <div class="avatar">
        <span class="mdi mdi-robot-outline"></span>
      </div>
      <div class="dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ChatBubble from './ChatBubble.vue'
import ActionCard from './ActionCard.vue'
import type { Message } from '../../types/index'

const props = defineProps<{
  messages: Message[]
  isThinking?: boolean
}>()

const emit = defineEmits<{
  'preview-diff': []
}>()

const containerRef = ref<HTMLElement | null>(null)

/** 每当消息列表更新或思考状态变化时，自动滚动到底部 */
const scrollToBottom = () => {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
}

watch(() => props.messages.length, scrollToBottom)
watch(() => props.isThinking, scrollToBottom)
</script>

<style scoped lang="scss">
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
}

/* AI 思考中三点动画 */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.thinking-indicator .avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.dots {
  display: flex;
  gap: 5px;
  padding: 0.65rem 0.9rem;
  background-color: var(--bg-secondary);
  border-radius: 2px 12px 12px 12px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--text-secondary);
    animation: bounce 1.2s infinite ease-in-out;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
