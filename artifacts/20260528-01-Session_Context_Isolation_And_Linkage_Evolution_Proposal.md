# 项目进化对齐提案

基于最近的协作与代码变更，我们识别出以下状态漂移，并规划了高价值的架构指南沉淀与元数据文件同步。

## 1. 状态漂移分析与根因
*   **交互大屏路由跳转与还原联动（漂移 A）**：
    侧边栏历史和全部历史中点击知识库会话，能顺利携带 `sessionId` 跳转知识库大屏，但在 KnowledgePage 大屏中此前遗漏了拦截，导致 AI 面板未拉开、会话未激活且左侧目录树无法反向高亮选中。我们在本轮重构中完美打通了该项高定三端联动闭环。
*   **会话专属文献快照隔离（漂移 B）**：
    全局已挂载文献（`contextRefs` 属性）此前作为全局单例共享。当用户在不同历史会话间切换时，挂载文献呈现为最新挂载值，产生严重的上下文跨会话污染。我们在 Session 接口中扩充了快照契约并在 Store 的 switchSession、createSession 中实施了高能双向快照隔离。
*   **新建临时文档“先写后归档”保存原地升级（漂移 C）**：
    升级了 ConsoleLayout 的 Glass 路径与格式保存弹窗。由 Store 的 `upgradeDocSession` 原地升级临时会话，强制整卷重赋值物理写盘，根治了双专属会话的硬盘持久化死锁。

为了固化上述重大的顶层设计与架构演进，我们沉淀了一份高质感设计指南，并同步修改了 Changelog、Backlog 看板与 .geminirules 全局宪法。

---

## 2. 拟议进化变更

请审阅以下将被自动新建与对齐更新的文件内容：

#### [新建] `guides/20260528-02-clzh_session_isolation_and_interaction_linkage.md`
```markdown
# 科学会话文献快照隔离与大屏路由联动交互指南 (Session Context Isolation and Linkage Specification)

本指南确立了材料智慧平台中“AI 科研会话”与“挂载文献上下文引用”在跨场景流转时的物理隔离、备份快照与多端大屏路由还原的标准时序规范。

## 1. 核心设计哲学
在顶尖的科研工作站交互中，每一个独立的科学探索会话（Session）都应当具备独立、可还原的“研究上下文快照（Context Snapshot）”。
- **禁止全局污染**：不允许不同的探索会话共享同一个挂载文献列表。在会话 A 中勾选的文献，当切换到历史会话 B 时，必须瞬间、无损地还原回会话 B 当时探讨时的文献快照。
- **无感还原与双向快照**：当用户在侧栏或全部历史中点击某条会话时，不仅要在大屏内拉开 AI 面板、还原历史消息，左侧的目录树也必须反向层级回溯，高亮选中该会话绑定的项目/文件夹。

## 2. 数据契约与数据流

### 2.1 状态继承与快照
- 会话实体（`Session`）中必须强承载可选字段 `contextRefs?: ContextRef[]`。
- 新建会话时，默认继承全局当前正勾选的文献状态，复制为其 `contextRefs` 的初始快照。
- 全局 `contextRefs.value` 变动（如用户在文件树右侧点击“挂载 AI”或“叉号解绑”时），不仅更新全局状态，还应立即实时物理备份写入当前激活会话（`currentSession`）的 `contextRefs` 属性，双向持久化。

### 2.2 会话切换时序 (switchSession)
```
[User Click History] -> switchSession(targetSessionId)
                           |
                           v
              1. 备份当前 Session 状态:
                 - sessions[current].messages = messages
                 - sessions[current].contextRefs = contextRefs
                           |
                           v
              2. 激活并载入目标 Session 状态:
                 - activeSessionId = targetSessionId
                 - messages = sessions[target].messages
                 - contextRefs = sessions[target].contextRefs
```

## 3. 大屏路由拦截与高亮定位 (handleHistoryQueryRoute)
当路由中携带 `sessionId` 及 `openChat=true` 时，大屏必须进行如下联动：
1. **拉开面板**：物理将 `isKbChatOpen` 置为 `true`，模式设置跟进为 `knowledge-qa`。
2. **重置激活会话**：在 `nextTick` 中执行 `switchSession(sessionId)` 绕过默认加载，确保完整重绘。
3. **节点高亮回溯**：根据 session 对象的 `fileId`，在 projects 数据源中查找。若匹配到项目或文件夹，则将左侧的 activeNode 进行对应的反向高亮。
```

#### [修改] `Changelog.md`
```markdown
# 变更日志 (Changelog)

所有关于材料智慧平台 (clzh) 的版本演进和关键修改都将在此记录。

## [v0.5.0] - 2026-05-28
### 🚀 Added
- **会话专属文献快照隔离机制**：在 Session 接口及 Pinia store 中全面织入了文献/项目上下文引用的备份与双向还原快照，彻底消灭了会话间的挂载污染漏洞。
- **大屏路由劫持与秒级高亮联动**：开发了 handleHistoryQueryRoute 拦截器，从全部历史或侧栏历史点击时自动拉开 AI 知识库面板、激活特定会话，并反向在左侧树结构中层级高亮定位项目/文件夹节点。
- **科研定制学术标题智能生成**：在 addMessage 提问流中融入智能起标题机制，首问有文献挂载时自动重命名标题为高雅的：《关于 [文献文件名] 的文献精读》。
- **空白文档先写后归档交互闭环**：在保存时改用 Pinia 内聚 action `upgradeDocSession` 原地升级会话 ID 并强制重新赋值，100% 达成深度响应式与 localStorage 硬盘持久化同步，彻底根治新建文档双专属会话的缓存残留 Bug。
- **常用工具大屏运行隔离**：工具项点击跳转至常用科学工具大屏运行专属路由 `/tools/run?toolId=...`，确保了与控制台文档编辑的物理隔离。

## [v0.1.0-alpha] - 2026-05-23
### 🚀 Added
- 首次引入项目自进化对齐机制 (`a-project-evolution`)，完成基础元数据构建。
- 物理沉淀了系统核心交互与布局设计指南：[guides/20260523-01-clzh_platform_layout_and_interaction_spec.md](file:///d:/2026/03project/materials-intelligence-platform/guides/20260523-01-clzh_platform_layout_and_interaction_spec.md)。
- 首次确立了 AI 开发者规范 [.geminirules](file:///d:/2026/03project/materials-intelligence-platform/.geminirules)。
- 建立了产品研发看板 [Backlog.md](file:///d:/2026/03project/materials-intelligence-platform/Backlog.md)。
- 初始化了核心前端布局，包括门户页模式切换及控制台三栏布局骨架（Portal.vue, Console.vue）。
```

#### [修改] `Backlog.md`
```markdown
# clzh 材料智慧平台 - 研发需求积压 (Backlog)

本看板追踪材料智慧平台 (clzh) 的功能演进与排期计划。

## 🏃 Active Sprint (Sprint 1 - 架构搭建与状态对齐)
- [x] 搭建基础门户页 (Portal.vue) 模式分流器
- [x] 搭建控制台 (Console.vue) 左右三栏弹性自适应布局
- [x] 基于 Pinia 状态管理设计文档状态机与 Diff 审批态
- [x] 沉淀系统自进化元数据规范文件 (.geminirules, Backlog, Changelog, guides)

## 📅 Upcoming Sprint (Sprint 2 - 核心功能补强与体验治理)
- [x] 实现左侧导航栏文件树（FileList）及 Checkbox 挂载文献的上下文注意力胶囊关联机制
- [x] 空白文档免弹窗“先写后归档”保存流在编辑区的完美高阶交互闭环
- [x] 研发常用科学小程序（ToolsRun.vue）在独立页面保活运行与返回流的完全物理隔离
- [x] 会话专属文献快照隔离（contextRefs 备份与无污染还原）及大屏路由 handleHistoryQueryRoute 联动
- [ ] 将控制台中间文本区重构为真实 Monaco Editor 并整合 Monaco Diff Editor 比对模式
- [ ] 研发右侧 AI 输入框 `@` 引用文件与 `/` 指令的 Autocomplete 弹出菜单组件
- [ ] 对接后端真实大模型 API 并实现流式输出 (Server-Sent Events) 与实时日志流 (Log Streaming)
```

#### [修改] `.geminirules`
```python
# Materials Intelligence Platform - AI Developer Constitution (.geminirules)

# 1. Core Technology Stack
# - Frontend: Vue 3 + Vite + TypeScript + Pinia
# - CSS/Styling: Vanilla CSS & SCSS (TailwindCSS should be avoided unless explicitly requested)
# - Framework Paradigm: Single Page Application (SPA)

# 2. Key Architecture Standards
# - Console Layout: Always strictly maintain the 3-column layout (Sidebar, Stage, Copilot).
# - Document Modification: Always implement the "Diff View (Split Editor)" flow with explicit [Accept/Reject] approval. Direct overwrite without preview is prohibited.
# - Tool Loading: Multi-tasking tools must run in full-screen overlay over the Stage, with an explicit "Back to Document" save confirmation trigger.
# - Session Environment Isolation: Every exploration session must maintain its own contextRefs snapshot to avoid global context pollution when switching sessions.
# - Page and Panel Interactivity Linkage: When clicking historical sessions, automatically expand right AI panel, restore session state, and reverse-highlight associated tree nodes in sidebars.

# 3. Collaboration & Vibe Traceability Guidelines
# - Every code modification or component creation MUST be tagged with `@vibe-intent`, `@vibe-model`, and `@vibe-ref` in comments directly above key blocks.
# - Post-modification actions: Immediately update `./.vibe/intents.md` silently to document the technical decisions. Avoid git commit until explicit `/done` is triggered.
# - Language Rule: Always communicate, document, and write comments in Chinese (except file structures or codebase identifiers).
```
