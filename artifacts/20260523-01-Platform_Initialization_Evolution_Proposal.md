# 项目进化对齐提案

基于对当前协作流的深度解析和 Git 代码状态审计，我们识别出了目前项目的“文档与规范滞后”状态（即：前端核心架构逻辑已初具雏形，但全局宪法 `.geminirules`、`Backlog.md`、`Changelog.md` 以及具体的设计指南均处于空白状态）。

为了在接下来的协作开发中建立长效、高内聚且自适应的系统架构治理，我们规划了以下项目元数据补齐路径，以对齐项目当前的架构决定和未来研发路线。

## 1. 状态漂移分析与根因
- **漂移 A（文档与宪法空白）**：代码已实现 Portal 页面的模式分流及 Console 页面基于 Pinia 驱动的 Diff 对比审批视图等，但系统未建立任何开发宪法（`.geminirules`）、产品排期积压（`Backlog.md`）和变更日志（`Changelog.md`）。
- **设计变更（沉淀核心交互规范）**：在系统开发初期，确立了“三栏式控制台布局”、“Diff 审批模式”、“覆盖式工具模式”、“@ 引用机制”等关键交互决定，这些核心决策急需固化为标准架构设计指南，以规范未来的开发实践。

## 2. 拟议进化变更
请审查以下将被自动新建、修改并对齐的文件内容：

#### [新建] `guides/20260523-01-clzh_platform_layout_and_interaction_spec.md`
```markdown
# 材料智慧平台 clzh - 布局与交互设计规范 (v1.0)

本指南沉淀了材料智慧平台 (clzh) 的核心视觉与交互设计规范，是未来所有前端页面和交互开发必须遵守的基准参考。

## 1. 全局设计语言
* **风格定位**：**理性、沉浸、极简**。主色调为“科技蓝”，辅以深灰/白色作为背景，旨在营造高度专注的科研氛围。
* **深色模式**：系统必须原生且优先支持 **Dark Mode**，确保研究人员在弱光环境下的长时间阅读体验。

## 2. 门户页 (Portal) 设计规范
* **超级输入框 (Omni-Input)**：
  - 输入框高度自适应，支持 `Shift+Enter` 换行。
  - **模式切换开关 (Mode Toggle)**：位于输入框右下角。支持 `💬 对话模式` (仅跳转聊天) 与 `🚀 工作站模式` (创建项目并跳转控制台生成文档)。
* **快捷指令 (Chips)**：提供快速操作卡片（如“单位换算”、“文献摘要分析”），点击后一键执行分流跳转。

## 3. 控制台 (Console) 三栏布局规范
控制台采用经典的 **左-中-右** 三栏自适应布局（响应式设计，最小宽度 1280px）：

### A. 左侧：资源导航栏 (Resource Sidebar)
* **宽度**：240px - 300px，支持折叠。
* **组件入口**：
  1. `➕ 新对话 (New Chat)`：清空当前上下文。
  2. `🕒 历史区 (History)`：时间轴折叠的会话列表，选中后中间区恢复文档快照。
  3. `📂 文件区 (Files)`：树状结构，支持多选（Checkbox）以关联多文件问答上下文。
  4. `🛠 工具区 (Tools)`：网格展示小程序（如单位换算器、数据分析等）。

### B. 中间：核心工作区 (The Stage)
* **宽度**：自适应，占据屏幕 50%-60%。
* **三大视图状态**：
  1. **文档编辑态 (Editor View)**：Markdown 所见即所得编辑器，支持代码高亮与 LaTeX 公式渲染。
  2. **对比审批态 (Diff View)**：AI 修改文档时触发，左右分屏显示（左侧红色高亮删除，右侧绿色高亮新增），中间或顶部悬浮 `[✅ 接受]` 与 `[❌ 拒绝]` 卡片。
  3. **工具运行态 (Tool Overlay)**：当从左侧打开工具时，触发文档保存提示，确认后全屏覆盖工作区展示，且左上角提供显眼的 `[⬅️ 返回文档]` 按钮。

### C. 右侧：AI 助手栏 (Copilot Sidebar)
* **宽度**：350px - 450px，支持折叠。
* **上下文标签**：顶部显示当前注意力引用的文件胶囊（如 `data.csv`）。
* **@/指令机制**：
  - 输入 `@`：唤起文件和当前文档引用菜单。
  - 输入 `/`：唤起系统内置快捷命令菜单（如 `/diff`）。
* **AI 建议卡片**：AI 生成修改建议后，显示带有 `[👀 预览修改]` 按钮的独立操作卡片，点击后中间区切入 Diff View。
```

#### [新建] `.geminirules`
```python
# Materials Intelligence Platform - AI Developer Constitution (.geminirules)

# 1. Core Technology Stack
# - Frontend: Vue 3 + Vite + TypeScript + Pinia
# - CSS/Styling: Vanilla CSS & SCSS (TailwindCSS should be avoided unless explicitly requested)
# - Framework Paradigm: Single Page Application (SPA)

# 2. Key Architecture Standards
# - Console Layout: Always strictly maintain the 3-column layout (Sidebar, Stage, Copilot).
# - Document Modification: Always implement the "Diff View (Split Editor)" flow with explicit [Accept/Reject] approval. Direct overwrite without preview is strictly prohibited.
# - Tool Loading: Multi-tasking tools must run in full-screen overlay over the Stage, with an explicit "Back to Document" save confirmation trigger.

# 3. Collaboration & Vibe Traceability Guidelines
# - Every code modification or component creation MUST be tagged with `@vibe-intent`, `@vibe-model`, and `@vibe-ref` in comments directly above key blocks.
# - Post-modification actions: Immediately update `./.vibe/intents.md` silently to document the technical decisions. Avoid git commit until explicit `/done` is triggered.
# - Language Rule: Always communicate, document, and write comments in Chinese (except file structures or codebase identifiers).
```

#### [新建] `Backlog.md`
```markdown
# clzh 材料智慧平台 - 研发需求积压 (Backlog)

本看板追踪材料智慧平台 (clzh) 的功能演进与排期计划。

## 🏃 Active Sprint (Sprint 1 - 架构搭建与状态对齐)
- [x] 搭建基础门户页 (Portal.vue) 模式分流器
- [x] 搭建控制台 (Console.vue) 左右三栏弹性自适应布局
- [x] 基于 Pinia 状态管理设计文档状态机与 Diff 审批态
- [x] 沉淀系统自进化元数据规范文件 (.geminirules, Backlog, Changelog, guides)

## 📅 Upcoming Sprint (Sprint 2 - 核心功能补强与接入)
- [ ] 将静态文本编辑区重构为真实 Monaco Editor 并整合其内置的 Monaco Diff Editor 模式
- [ ] 研发右侧 AI 输入框 `@` 引用文件与 `/` 指令的 Autocomplete 弹出菜单组件
- [ ] 实现左侧导航栏文件树真实上传、解析及 Checkbox 多选注意力胶囊关联机制
- [ ] 研发独立小程序组件（单位换算器、数据可视化分析）并在中间 Stage 区实现覆盖式单标签加载与“返回”保存流
- [ ] 对接后端大模型 API 并实现流式输出 (Server-Sent Events) 与实时日志流 (Log Streaming)
```

#### [新建] `Changelog.md`
```markdown
# 变更日志 (Changelog)

所有关于材料智慧平台 (clzh) 的版本演进和关键修改都将在此记录。

## [v0.1.0-alpha] - 2026-05-23
### 🚀 Added
- 首次引入项目自进化对齐机制 (`a-project-evolution`)，完成基础元数据构建。
- 物理沉淀了系统核心交互与布局设计指南：[guides/20260523-01-clzh_platform_layout_and_interaction_spec.md](file:///d:/2026/03project/materials-intelligence-platform/guides/20260523-01-clzh_platform_layout_and_interaction_spec.md)。
- 首次确立了 AI 开发者规范 [.geminirules](file:///d:/2026/03project/materials-intelligence-platform/.geminirules)。
- 建立了产品研发看板 [Backlog.md](file:///d:/2026/03project/materials-intelligence-platform/Backlog.md)。
- 初始化了核心前端布局，包括门户页模式切换及控制台三栏布局骨架（Portal.vue, Console.vue）。
```

#### [修改] `README.md`
```markdown
# 🧪 材料智慧平台 (clzh)

材料智慧平台是一个基于 **Vue 3 + TypeScript + Vite** 构建 of AI 原生科研/材料编辑工作站。

## 🌟 核心设计理念
本系统借鉴了现代化 SaaS 平台与高级 IDE（集成开发环境）的交互逻辑，旨在将复杂的底层 AI 算力与传统文档编辑工作流进行完美融合。
- **三栏弹性控制台**：高密度、高可视化的资源与编辑面板。
- **AI 协同 Diff 模式**：通过左右分屏比对让用户对 AI 修改建议一目了然。
- **上下文感知系统**：支持在对话框中通过 `@` 机制指定并关联多文件输入。

## 📂 项目结构导航
- `.geminirules` - AI 开发者宪法及架构开发守则
- `Backlog.md` - 项目研发需求与 Sprint 追踪看板
- `Changelog.md` - 系统版本迭代演进日志
- `guides/` - 系统顶层设计、网络架构与交互逻辑指南目录
- `src/` - 系统核心前端源代码目录
```
