<template>
  <div class="tool-container">
    <div class="tool-header">
      <h2><span class="mdi mdi-calculator text-blue-500"></span> 单位换算</h2>
      <p class="desc">物理量与材料学单位快速换算工具 (外部项目迁移演示)</p>
    </div>
    
    <div class="tool-body">
      <div class="converter-card">
        <div class="form-group">
          <label>能量换算 (eV, J, kcal/mol)</label>
          <div class="input-row">
            <input type="number" v-model="value" placeholder="输入数值..." class="form-input" />
            <select v-model="unit" class="form-select">
              <option value="eV">eV</option>
              <option value="J">J</option>
              <option value="kcal">kcal/mol</option>
            </select>
          </div>
        </div>
        <div class="result-box mt-4" v-if="value">
          <div class="result-item"><strong>{{ (value * 1.602e-19).toExponential(4) }}</strong> J (if eV)</div>
          <div class="result-item"><strong>{{ (value * 23.06).toFixed(2) }}</strong> kcal/mol (if eV)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const value = ref<number | null>(null);
const unit = ref('eV');

onMounted(() => {
  console.log('UnitConverter mounted - Keep-alive test active');
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

.converter-card {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 500px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.input-row {
  display: flex;
  gap: 0.5rem;
}

.form-input, .form-select {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  
  &:focus {
    border-color: var(--color-primary);
  }
}

.form-input {
  flex: 1;
}

.result-box {
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 4px solid var(--color-primary);
  padding: 1rem;
  border-radius: 4px 8px 8px 4px;
  
  .result-item {
    color: var(--text-primary);
    font-family: monospace;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    &:last-child { margin-bottom: 0; }
  }
}

.mt-4 { margin-top: 1rem; }
</style>
