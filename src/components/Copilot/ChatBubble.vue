<template>
  <!--
   * @vibe-intent 单条对话气泡组件，区分 user/ai 两种角色样式。
   * AI 消息使用 marked 解析 Markdown，以支持代码块、标题等富文本格式。
   * 注意：此处 AI 生成内容为受信任来源，未额外引入 DOMPurify（如接入不可信来源需补充）。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="chat-bubble" :class="role">
    <div class="avatar">
      <span class="mdi" :class="role === 'user' ? 'mdi-account' : 'mdi-robot-outline'"></span>
    </div>
    <div class="content">
      <!-- AI 消息：渲染 Markdown -->
      <div
        v-if="role === 'ai'"
        class="markdown-body"
        v-html="renderedContent"
      ></div>
      <!-- 用户消息：纯文本 -->
      <span v-else>{{ content }}</span>

      <!-- 协同插回组件 -->
      <div class="collab-actions-wrap" v-if="canInsertToWord">
        <button class="insert-collab-btn" @click="handleInsertToWord">
          <span class="mdi mdi-arrow-left-bold-box-outline"></span>
          <span>一键插回光标处</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  role: 'user' | 'ai'
  content: string
}>()

const renderedContent = computed(() => {
  if (props.role === 'ai') {
    return marked(props.content) as string
  }
  return props.content
})

/**
 * @vibe-intent 协同联动：检测全局是否存在 Word 编辑器游标挂载钩子，
 * 若存在则允许一键将 AI 输出插回 Word 当前聚焦位置。
 * @vibe-model Gemini 3.5 Flash (High)
 * @vibe-ref intents.md#2026-05-25
 */
const canInsertToWord = computed(() => {
  return props.role === 'ai' && typeof (window as any).__insertWordEditorText === 'function'
})

const handleInsertToWord = () => {
  if (typeof (window as any).__insertWordEditorText === 'function') {
    // 提取主要段落内容传入富文本协同编辑器中
    (window as any).__insertWordEditorText(props.content)
  }
}
</script>

<style scoped lang="scss">
.chat-bubble {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;

    .content {
      background-color: var(--color-primary);
      color: white;
      border-radius: 12px 2px 12px 12px;
    }

    .avatar {
      background-color: rgba(59, 130, 246, 0.15);
      color: var(--color-primary);
    }
  }

  &.ai {
    .content {
      background-color: var(--bg-secondary);
      border-radius: 2px 12px 12px 12px;
    }

    .avatar {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--color-primary);
    }
  }
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
}

.content {
  padding: 0.65rem 0.9rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-primary);
  max-width: 85%;
  word-break: break-word;
}

/* Markdown 渲染样式覆盖 */
.markdown-body {
  :deep(p) {
    margin: 0 0 0.5em;
    &:last-child { margin-bottom: 0; }
  }

  :deep(h1), :deep(h2), :deep(h3) {
    margin: 0.75em 0 0.4em;
    font-weight: 700;
    color: var(--text-primary);
  }

  :deep(code) {
    background: rgba(0, 0, 0, 0.15);
    padding: 0.1em 0.35em;
    border-radius: 4px;
    font-family: 'Fira Code', 'JetBrains Mono', monospace;
    font-size: 0.85em;
  }

  :deep(pre) {
    background: rgba(0, 0, 0, 0.2);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.5em 0;

    code {
      background: transparent;
      padding: 0;
    }
  }

  :deep(ul), :deep(ol) {
    margin: 0.4em 0;
    padding-left: 1.4em;
  }

  :deep(li) {
    margin: 0.15em 0;
  }

  :deep(strong) {
    font-weight: 700;
    color: var(--text-primary);
  }

  :deep(blockquote) {
    border-left: 3px solid var(--color-primary);
    margin: 0.5em 0;
    padding: 0.25em 0.75em;
    color: var(--text-secondary);
    font-style: italic;
  }
}

.collab-actions-wrap {
  margin-top: 0.65rem;
  border-top: 1px solid var(--border-color);
  padding-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

.insert-collab-btn {
  background: linear-gradient(135deg, var(--color-primary), rgba(59, 130, 246, 0.8));
  border: none;
  color: white;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(59, 130, 246, 0.25);
    background: linear-gradient(135deg, var(--color-primary-hover), #8b5cf6);
  }

  &:active {
    transform: scale(0.96);
  }
}
</style>
