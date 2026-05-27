<template>
  <div class="tool-container">
    <div class="tool-header">
      <h2><span class="mdi mdi-chart-bell-curve-cumulative text-emerald-500"></span> 能谱数据分析</h2>
      <p class="desc">EIS 阻抗谱与能谱图分析 (外部项目迁移演示)</p>
    </div>
    
    <div class="tool-body">
      <div class="upload-zone">
        <span class="mdi mdi-cloud-upload text-4xl text-slate-400"></span>
        <p>拖拽或点击上传 .csv / .txt 数据文件</p>
      </div>
      
      <div class="mock-chart mt-6">
        <div class="chart-placeholder">
          <span class="mdi mdi-chart-line text-6xl text-emerald-500 opacity-50"></span>
          <p class="text-sm text-slate-400 mt-2">图表渲染区域</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  console.log('ChartAnalysis mounted - Keep-alive test active');
});
</script>

<style scoped lang="scss">
.tool-container {
  padding: 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
}

.tool-header {
  margin-bottom: 2rem;
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.5rem 0;
  }
  .desc {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin: 0;
  }
}

.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--bg-tertiary);
  
  &:hover {
    border-color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.05);
  }
}

.mock-chart {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mt-6 { margin-top: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.text-4xl { font-size: 2.25rem; }
.text-6xl { font-size: 3.75rem; }
.opacity-50 { opacity: 0.5; }
</style>
