<template>
  <!--
   * @vibe-intent 历史会话时间轴组件，核心功能是将会话列表按"今天/昨天/近7天/更早"自动分组。
   * 使用硬编码 Mock 数据，待阶段四接入真实 API 时仅需替换 mockSessions 的来源。
   * @vibe-model Claude Sonnet 4.6
   * @vibe-ref intents.md#2026-04-27
  -->
  <div class="history-list">
    <div class="panel-header">
      <h3>历史会话</h3>
    </div>

    <div class="session-groups">
      <template v-for="group in groupedSessions" :key="group.label">
        <div v-if="group.items.length > 0">
          <div class="group-label">{{ group.label }}</div>
          <div
            v-for="session in group.items"
            :key="session.id"
            class="session-item"
            :class="{ active: activeId === session.id }"
            @click="selectSession(session.id)"
          >
            <div class="session-body">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-preview">{{ session.preview }}</div>
            </div>
            <!-- 悬浮操作：重命名 / 删除（阶段二仅展示，逻辑留阶段四） -->
            <div class="session-actions">
              <button class="action-btn" title="重命名" @click.stop>
                <span class="mdi mdi-pencil-outline"></span>
              </button>
              <button class="action-btn danger" title="删除" @click.stop>
                <span class="mdi mdi-delete-outline"></span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Session } from '../../types/index'

const emit = defineEmits<{
  'session-select': [id: string]
}>()

const activeId = ref<string | null>('s1')

// Mock 数据：覆盖"今天 / 昨天 / 近7天 / 更早"四个分组场景
const today = new Date(2026, 3, 27)
const yesterday = new Date(2026, 3, 26)
const mockSessions: Session[] = [
  {
    id: 's1',
    title: '锂电池正极材料综述',
    preview: '分析了 NMC、LFP 等多种材料体系的电化学性能...',
    createdAt: new Date(2026, 3, 27, 10, 30)
  },
  {
    id: 's2',
    title: 'AI 辅助材料发现研究',
    preview: '基于机器学习的相图预测方法在高熵合金中的应用...',
    createdAt: new Date(2026, 3, 27, 8, 15)
  },
  {
    id: 's3',
    title: '固态电解质导离子机制',
    preview: '基于 AIMD 模拟的 Li⁺ 迁移路径分析报告...',
    createdAt: new Date(2026, 3, 26, 14, 0)
  },
  {
    id: 's4',
    title: '钙钛矿光伏效率优化',
    preview: '通过组分工程将 PCE 提升至 25.3% 的实验记录...',
    createdAt: new Date(2026, 3, 25, 16, 45)
  },
  {
    id: 's5',
    title: '高熵合金相稳定性分析',
    preview: 'Cantor 合金的第一性原理计算与实验验证对比...',
    createdAt: new Date(2026, 3, 22, 9, 20)
  },
  {
    id: 's6',
    title: '碳纳米管力学性能研究',
    preview: '基于分子动力学的拉伸模拟与断裂行为分析...',
    createdAt: new Date(2026, 3, 10, 11, 30)
  }
]

/** 判断两个 Date 是否为同一天 */
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/** 将会话列表按时间段分组 */
const groupedSessions = computed(() => {
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)

  const groups = [
    { label: '今天', items: [] as Session[] },
    { label: '昨天', items: [] as Session[] },
    { label: '近7天', items: [] as Session[] },
    { label: '更早', items: [] as Session[] }
  ]

  for (const session of mockSessions) {
    if (isSameDay(session.createdAt, today)) {
      groups[0].items.push(session)
    } else if (isSameDay(session.createdAt, yesterday)) {
      groups[1].items.push(session)
    } else if (session.createdAt >= sevenDaysAgo) {
      groups[2].items.push(session)
    } else {
      groups[3].items.push(session)
    }
  }

  return groups
})

const selectSession = (id: string) => {
  activeId.value = id
  emit('session-select', id)
}
</script>

<style scoped lang="scss">
.history-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.session-groups {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;

  /* 自定义细滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
}

.group-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.75rem 0.5rem 0.35rem;
  opacity: 0.7;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;

  &:hover {
    background-color: var(--bg-secondary);

    .session-actions {
      opacity: 1;
    }
  }

  &.active {
    background-color: rgba(59, 130, 246, 0.1);

    .session-title {
      color: var(--color-primary);
    }
  }
}

.session-body {
  flex: 1;
  overflow: hidden;
}

.session-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-preview {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  opacity: 0.75;
}

.session-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
  }
}
</style>
