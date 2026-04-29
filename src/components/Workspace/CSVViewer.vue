<template>
  <div class="csv-viewer">
    <div class="viewer-header">
      <div class="file-meta">
        <span class="mdi mdi-file-table file-icon"></span>
        <h3>{{ fileName }}</h3>
        <span class="data-badge">100 行数据</span>
      </div>
      <div class="actions">
        <button class="action-btn"><span class="mdi mdi-download"></span> 导出 CSV</button>
      </div>
    </div>

    <div class="table-container">
      <table class="premium-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>Cycle_Index</th>
            <th>Capacity (mAh)</th>
            <th>Voltage (V)</th>
            <th>Current (A)</th>
            <th>Temp (°C)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in mockRows" :key="index">
            <td class="index-col">{{ index + 1 }}</td>
            <td>{{ row.cycle }}</td>
            <td class="numeric-col">{{ row.capacity }}</td>
            <td class="numeric-col">{{ row.voltage }}</td>
            <td class="numeric-col">{{ row.current }}</td>
            <td class="numeric-col">{{ row.temp }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @vibe-intent 实验数据多维表格网格渲染面板，承载 CSV 格式数据的只读与交互逻辑。
 * @vibe-model Gemini 3 Flash
 * @vibe-ref intents.md#2026-04-29
 */
import { ref } from 'vue'


defineProps<{
  fileName: {
    type: String,
    default: '实验数据.csv'
  }
}>()

// 模拟科研数据
const mockRows = ref([
  { cycle: 1, capacity: 2200.5, voltage: 4.20, current: 1.0, temp: 25.2 },
  { cycle: 2, capacity: 2198.2, voltage: 4.18, current: 1.0, temp: 25.5 },
  { cycle: 3, capacity: 2195.8, voltage: 4.15, current: 1.0, temp: 25.8 },
  { cycle: 4, capacity: 2190.1, voltage: 4.12, current: 1.0, temp: 26.1 },
  { cycle: 5, capacity: 2185.4, voltage: 4.10, current: 1.0, temp: 26.4 },
  { cycle: 6, capacity: 2179.9, voltage: 4.08, current: 1.0, temp: 26.7 },
  { cycle: 7, capacity: 2175.0, voltage: 4.05, current: 1.0, temp: 26.9 },
  { cycle: 8, capacity: 2168.3, voltage: 4.02, current: 1.0, temp: 27.2 },
  { cycle: 9, capacity: 2162.1, voltage: 4.00, current: 1.0, temp: 27.4 },
  { cycle: 10, capacity: 2155.4, voltage: 3.98, current: 1.0, temp: 27.7 },
])
</script>

<style scoped lang="scss">
.csv-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  padding: 1.5rem;
  overflow: hidden;
  height: 100%;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;

  .file-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .file-icon {
      font-size: 1.5rem;
      color: #10b981;
    }

    h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-primary);
    }

    .data-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border-radius: 4px;
      font-weight: 500;
    }
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--bg-tertiary);
      border-color: var(--border-focus);
    }
  }
}

.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
}

.premium-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;

  th {
    position: sticky;
    top: 0;
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    font-weight: 600;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid var(--border-color);
    z-index: 10;
  }

  td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  tr {
    transition: background-color 0.15s;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.02);
    }
  }

  .index-col {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .numeric-col {
    font-family: 'Courier New', Courier, monospace;
    color: var(--color-primary);
  }
}
</style>
