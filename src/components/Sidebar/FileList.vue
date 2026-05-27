<template>
  <!--
   * @vibe-intent 文件树组件，重构为 Project > Folder > File 三级层级结构。
   * 每级均支持折叠展开；项目/文件可整体勾选加入 AI 上下文引用（ContextRef），
   * 勾选整个项目时会将该项目下所有文件纳入上下文。
   * @vibe-model Claude Sonnet 4.6 (Thinking)
   * @vibe-ref intents.md#2026-05-21
  -->
  <div class="file-list">
    <div class="panel-header">
      <h3>项目文件</h3>
      <button class="icon-btn" title="上传文件" @click="emit('file-upload')">
        <span class="mdi mdi-cloud-upload-outline"></span>
      </button>
    </div>

    <div class="file-tree">
      <!-- ===== 项目层 ===== -->
      <div v-for="project in projects" :key="project.id" class="project-node">
        <!-- 项目头 -->
        <div
          class="node-row project-row"
          :class="{ 'ctx-selected': isProjectInContext(project.id) }"
        >
          <input
            type="checkbox"
            class="node-checkbox"
            :checked="isProjectInContext(project.id)"
            @change.stop="toggleProjectContext(project)"
            @click.stop
          />
          <span
            class="mdi toggle-icon"
            :class="project.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
            @click.stop="workspaceStore.toggleProject(project.id)"
          ></span>
          <span class="mdi mdi-folder-outline node-icon project-icon"></span>
          <span class="node-name project-name">{{ project.name }}</span>
        </div>

        <!-- 项目内容（文件夹 + 散落文件） -->
        <div class="project-body" v-show="project.expanded">
          <!-- ===== 文件夹层 ===== -->
          <div v-for="folder in project.folders" :key="folder.id" class="folder-node">
            <!-- 文件夹头 -->
            <div class="node-row folder-row">
              <div class="node-indent-1"></div>
              <span
                class="mdi toggle-icon"
                :class="folder.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                @click.stop="workspaceStore.toggleFolder(project.id, folder.id)"
              ></span>
              <span class="mdi mdi-folder-outline node-icon folder-icon"></span>
              <span class="node-name">{{ folder.name }}</span>
            </div>

            <!-- ===== 文件层（在文件夹内） ===== -->
            <div class="folder-body" v-show="folder.expanded">
              <div
                v-for="file in folder.files"
                :key="file.id"
                class="node-row file-row"
                :class="{ 'ctx-selected': isFileInContext(file.id) }"
                @click="emit('file-select', file)"
              >
                <div class="node-indent-2"></div>
                <input
                  type="checkbox"
                  class="node-checkbox"
                  :checked="isFileInContext(file.id)"
                  @change.stop="toggleFileContext(file)"
                  @click.stop
                />
                <span class="mdi node-icon file-icon" :class="[file.icon, file.iconClass]"></span>
                <span class="node-name file-name">{{ file.name }}</span>
              </div>
            </div>
          </div>

          <!-- ===== 项目散落文件 ===== -->
          <div
            v-for="file in project.files"
            :key="file.id"
            class="node-row file-row"
            :class="{ 'ctx-selected': isFileInContext(file.id) }"
            @click="emit('file-select', file)"
          >
            <div class="node-indent-1"></div>
            <input
              type="checkbox"
              class="node-checkbox"
              :checked="isFileInContext(file.id)"
              @change.stop="toggleFileContext(file)"
              @click.stop
            />
            <span class="mdi node-icon file-icon" :class="[file.icon, file.iconClass]"></span>
            <span class="node-name file-name">{{ file.name }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-hint" v-if="projects.length === 0">
        <span class="mdi mdi-inbox-outline"></span>
        <span>暂无项目，点击上方上传文件</span>
      </div>
    </div>

    <!-- 底部：已选上下文提示 -->
    <div class="file-footer" v-if="contextRefs.length > 0">
      <span class="mdi mdi-brain"></span>
      已挂载 {{ contextRefs.length }} 项 AI 上下文
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '../../stores/workspace'
import type { FileItem, Project, ContextRef } from '../../types/index'

const emit = defineEmits<{
  'file-select': [file: FileItem]
  'file-upload': []
}>()

const workspaceStore = useWorkspaceStore()
const { projects, contextRefs } = storeToRefs(workspaceStore)

/** 判断某文件是否在上下文中 */
const isFileInContext = (fileId: string) =>
  contextRefs.value.some(r => r.type === 'file' && r.id === fileId)

/** 判断某项目是否在上下文中 */
const isProjectInContext = (projectId: string) =>
  contextRefs.value.some(r => r.type === 'project' && r.id === projectId)

/** 勾选/取消整个项目 */
const toggleProjectContext = (project: Project) => {
  const ref_: ContextRef = {
    type: 'project',
    id: project.id,
    name: project.name,
    icon: 'mdi-folder-multiple-outline'
  }
  workspaceStore.toggleContextRef(ref_)
}

/** 勾选/取消单个文件 */
const toggleFileContext = (file: FileItem) => {
  const ref_: ContextRef = {
    type: 'file',
    id: file.id,
    name: file.name,
    icon: file.icon
  }
  workspaceStore.toggleContextRef(ref_)
}
</script>

<style scoped lang="scss">
.file-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 1rem;
  display: flex;
  align-items: center;

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
}

/* ---- 文件树 ---- */
.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

/* ---- 通用节点行 ---- */
.node-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--text-secondary);
  transition: background-color 0.15s;
  user-select: none;

  &:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);

    .node-checkbox { opacity: 1; }
  }

  &.ctx-selected {
    background-color: rgba(59, 130, 246, 0.07);
    color: var(--text-primary);

    .node-checkbox { opacity: 1; }
  }
}

/* 缩进占位 */
.node-indent-1 { min-width: 12px; }
.node-indent-2 { min-width: 24px; }

/* ---- 图标 ---- */
.toggle-icon {
  font-size: 0.85rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  cursor: pointer;
  width: 16px;
  text-align: center;
  transition: transform 0.2s;
}

.node-icon {
  font-size: 0.95rem;
  flex-shrink: 0;
}

.project-icon { color: #f59e0b; }
.folder-icon { color: #94a3b8; }

/* 文件图标颜色通过 :class 继承 iconClass */
:deep(.text-success) { color: var(--color-success); }
:deep(.text-primary) { color: var(--color-primary); }
:deep(.text-danger) { color: var(--color-danger); }
:deep(.text-warning) { color: var(--color-warning); }

/* ---- 节点名 ---- */
.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-name {
  font-weight: 600;
  color: var(--text-primary);
}

.file-name { font-size: 0.8rem; }

/* ---- 复选框 ---- */
.node-checkbox {
  opacity: 0;
  width: 13px;
  height: 13px;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
  transition: opacity 0.15s;

  &:checked { opacity: 1; }
}

/* ---- 空状态 ---- */
.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  opacity: 0.6;

  .mdi { font-size: 2rem; }
}

/* ---- 底部上下文提示 ---- */
.file-footer {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--color-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  background-color: rgba(59, 130, 246, 0.05);
}
</style>
