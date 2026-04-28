<template>
  <!--
   * @vibe-intent 聊天输入框组件，将 ConsoleLayout.vue 中全部的 @ 文件引用 和 / 快捷指令
   * 联想菜单逻辑完整迁移至此。核心实现：监听光标位置，用正则检测触发字符，
   * 在输入框上方绝对定位弹出悬浮菜单，支持键盘上下键导航与 Enter 确认。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="chat-input-area">
    <!-- 联想菜单：绝对定位于输入框上方 -->
    <div class="mention-menu" v-if="mentionState.visible">
      <div class="menu-header">
        {{ mentionState.type === '@' ? '引用文件' : '快捷指令' }}
      </div>
      <div
        v-for="(item, index) in filteredList"
        :key="index"
        class="menu-item"
        :class="{ active: index === mentionState.selectedIndex }"
        @click="selectMention(item)"
        @mouseenter="mentionState.selectedIndex = index"
      >
        <span class="mdi" :class="item.icon"></span>
        <div class="item-text">
          <div class="item-title">{{ item.title }}</div>
          <div class="item-desc" v-if="item.desc">{{ item.desc }}</div>
        </div>
      </div>
      <div class="menu-empty" v-if="filteredList.length === 0">无匹配项</div>
    </div>

    <div class="input-wrapper" :class="{ focused: isFocused }">
      <textarea
        ref="textareaRef"
        v-model="inputValue"
        placeholder="输入问题或指令（输入 @ 引用文件，/ 触发指令）..."
        rows="1"
        @input="handleInput"
        @keydown="handleKeyDown"
        @focus="isFocused = true"
        @blur="isFocused = false"
      ></textarea>
      <button class="attach-btn" title="上传附件">
        <span class="mdi mdi-paperclip"></span>
      </button>
      <button class="send-btn" title="发送" @click="sendMessage" :disabled="!inputValue.trim()">
        <span class="mdi mdi-send"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { FileItem, Command } from '../../types/index'

const props = defineProps<{
  availableFiles: FileItem[]
  availableCommands: Command[]
}>()

const emit = defineEmits<{
  'send': [message: string]
}>()

const inputValue = ref('')
const isFocused = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// ---- 联想菜单状态 ----
const mentionState = ref({
  visible: false,
  type: '@' as '@' | '/',
  query: '',
  selectedIndex: 0,
  /** 触发字符在原始字符串中的位置，用于替换时精确定位 */
  triggerPos: 0
})

/** 根据触发类型和 query 过滤候选列表 */
const filteredList = computed(() => {
  const q = mentionState.value.query.toLowerCase()
  if (mentionState.value.type === '@') {
    return props.availableFiles
      .map(f => ({ id: f.id, title: f.name, icon: `${f.icon} ${f.iconClass ?? ''}`, desc: f.type.toUpperCase() }))
      .filter(item => !q || item.title.toLowerCase().includes(q))
  }
  return props.availableCommands
    .filter(cmd => !q || cmd.title.toLowerCase().includes(q))
})

/** 监听输入事件，检测 @ / / 触发字符 */
const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  
  // 自动扩展高度，去除滚动条
  target.style.height = 'auto'
  target.style.height = `${target.scrollHeight}px`

  const val = target.value
  const cursor = target.selectionStart ?? 0

  const textBeforeCursor = val.slice(0, cursor)
  const atMatch = textBeforeCursor.match(/(?:^|\s)@(\S*)$/)
  const slashMatch = textBeforeCursor.match(/(?:^|\s)\/(\S*)$/)

  if (atMatch) {
    mentionState.value = {
      visible: true,
      type: '@',
      query: atMatch[1],
      selectedIndex: 0,
      triggerPos: cursor - atMatch[1].length - 1
    }
  } else if (slashMatch) {
    mentionState.value = {
      visible: true,
      type: '/',
      query: slashMatch[1],
      selectedIndex: 0,
      triggerPos: cursor - slashMatch[1].length - 1
    }
  } else {
    mentionState.value.visible = false
  }
}

/** 键盘导航：↑ ↓ Enter Escape */
const handleKeyDown = (e: KeyboardEvent) => {
  if (!mentionState.value.visible) {
    // Enter 直接发送（Shift+Enter 换行）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    return
  }

  const len = filteredList.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    mentionState.value.selectedIndex = (mentionState.value.selectedIndex + 1) % len
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mentionState.value.selectedIndex = (mentionState.value.selectedIndex - 1 + len) % len
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (len > 0) selectMention(filteredList.value[mentionState.value.selectedIndex])
  } else if (e.key === 'Escape') {
    mentionState.value.visible = false
  }
}

/** 选中候选项，将触发词替换为胶囊标签格式 */
const selectMention = (item: { id?: string; title: string }) => {
  const val = inputValue.value
  const pos = mentionState.value.triggerPos

  // 找到触发词的结束位置（到下一个空白字符）
  let endPos = pos + 1
  while (endPos < val.length && !/\s/.test(val[endPos])) endPos++

  const insertText =
    mentionState.value.type === '@'
      ? `[@${item.title}] `
      : `${item.title} `

  inputValue.value = val.slice(0, pos) + insertText + val.slice(endPos)
  mentionState.value.visible = false

  // 恢复焦点并将光标移至插入文本末尾
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      const newPos = pos + insertText.length
      textareaRef.value.setSelectionRange(newPos, newPos)
    }
  })
}

const sendMessage = () => {
  const msg = inputValue.value.trim()
  if (!msg) return
  emit('send', msg)
  inputValue.value = ''
  mentionState.value.visible = false
  
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}
</script>

<style scoped lang="scss">
.chat-input-area {
  position: relative;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
  flex-shrink: 0;
}

.mention-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 1rem;
  right: 1rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  padding: 0.4rem 0;
  z-index: 50;
  max-height: 240px;
  overflow-y: auto;
  animation: menuIn 0.15s ease-out;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
}

@keyframes menuIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-header {
  padding: 0.25rem 1rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.45rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover, &.active {
    background-color: var(--bg-secondary);
  }

  .mdi {
    font-size: 1.1rem;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
}

.item-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.menu-empty {
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.5rem;
  transition: border-color 0.2s;

  &.focused {
    border-color: var(--color-primary);
  }

  textarea {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    resize: none;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    padding: 0.25rem;
    max-height: 150px;
    line-height: 1.5;

    &:placeholder-shown {
      overflow: hidden;
    }
    
    &:not(:placeholder-shown) {
      overflow-y: auto;
    }

    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::placeholder {
      color: var(--text-secondary);
    }
  }
}

.attach-btn, .send-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }
}

.send-btn {
  background-color: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: not-allowed;
  }
}
</style>
