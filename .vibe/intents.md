### [2026-04-15] - 从零构建基于 Vue3 的材料智慧平台原型
- **驱动模型**: Gemini 3.1 Pro (High)
- **涉及文件**: `src/layouts/ConsoleLayout.vue`, `src/pages/Portal.vue`, `src/components/Editor/CodeEditor.vue`
- **变更逻辑摘要**: 
  初始化 Vite+Vue3 项目结构并根据指令将项目文件平铺提取至材料平台项目根目录。设计并实现了门户入口的分流机制（普通/工作站模式）和核心控制台的三栏沉浸式布局（文件树区、中间编辑区、右侧辅助 Copilot 区），并抽象封装了 `@guolao/vue-monaco-editor` 以支持实验报告 Markdown 的流式编辑和 AI 修改比对（Diff）审批视图。

### [2026-04-24] - 攻克核心交互体验：引入 AI 助手提及机制
- **驱动模型**: Gemini 3.1 Pro (High)
- **涉及文件**: `src/layouts/ConsoleLayout.vue`
- **变更逻辑摘要**: 
  为进一步提升科研工作站的专业级交互体验，在控制台右侧的 AI 助手聊天输入区中，实现并集成了类似 Notion/Slack 的输入联想系统。通过监听输入游标位置，支持 `@` 触发文件选择器（引用历史文件和文献）以及 `/` 触发命令菜单（如 `/diff` 等快捷指令）。采用了纯前端正则表达式截取输入与虚拟 DOM 焦点管理的轻量级实现方案，避免了重度依赖第三方富文本编辑器的性能损耗。

### [2026-04-27] - 架构优化与门户交互增强：适配 Sass 2.0 并实现功能下拉菜单
- **驱动模型**: Gemini 3 Flash
- **涉及文件**: `src/styles/global.scss`, `vite.config.ts`, `src/pages/Portal.vue`
- **变更逻辑摘要**: 
  1. **架构适配**：将全局样式表中的 `@import` 迁移为 `@use` 模块化语法，并在 `vite.config.ts` 中配置 `api: 'modern-compiler'`，彻底消除了 Sass `legacy-js-api` 弃用警告，为升级 Sass 2.0 夯实基础。
  2. **交互闭环**：为门户页面 Header 区域实现了真实的交互逻辑。新增“齿轮”设置面板（包含模型选择、自动保存开关）与“头像”用户中心面板（展示专家身份简报与快捷空间入口）。
  3. **体验优化**：引入毛玻璃视觉效果、入场动画及点击外部自动收起菜单的逻辑；同时完善了主题切换的 `localStorage` 持久化记忆功能。

### [2026-04-27] - 阶段二：UI 组件剥离与封装，ConsoleLayout 架构重构
- **驱动模型**: Claude Sonnet 4.6
- **涉及文件**: `src/types/index.ts`, `src/components/Sidebar/SidebarNav.vue`, `src/components/Sidebar/FileList.vue`, `src/components/Sidebar/HistoryList.vue`, `src/components/Copilot/ContextBar.vue`, `src/components/Copilot/ChatBubble.vue`, `src/components/Copilot/ActionCard.vue`, `src/components/Copilot/ChatMessages.vue`, `src/components/Copilot/ChatInput.vue`, `src/layouts/ConsoleLayout.vue`
- **变更逻辑摘要**: 
  将原 708 行的单体 `ConsoleLayout.vue` 拆分为 8 个职责单一的子组件，并建立 `src/types/index.ts` 统一数据契约。
  核心决策如下：
  1. **类型优先**：先定义 `FileItem / Session / Message / Command` 四个接口，强约束各组件间的数据传递，避免隐式 `any` 带来的运行时错误。
  2. **`@提及菜单` 迁移策略**：原逻辑散布在 ConsoleLayout 的 script 和 template 各处，采用"整体搬迁"方式——将 `mentionState / filteredList / handleInput / handleKeyDown / selectMention` 全部收敛至 `ChatInput.vue` 内部，仅通过 `@send` emit 向上暴露最终消息字符串，实现内部逻辑完全自洽。
  3. **`HistoryList` 时间分组**：使用 `computed` + 纯函数 `isSameDay` 对 Mock 数据分组，时间参照点硬编码为当前日期，待阶段四替换为 `new Date()` 动态获取即可。
  4. **`FileList` 多选设计**：复选框的 `opacity: 0` 平时隐藏，hover/checked 时才显现，降低视觉噪音；勾选后通过 `refs-change` emit 将选中的 `FileItem[]` 上传至父组件，与"单击打开文件"的 `file-select` emit 解耦，实现"读取上下文"与"打开文档"两种操作语义分离。
  5. **`marked` 集成**：`ChatBubble.vue` 仅对 `role === 'ai'` 的消息调用 `marked()` 转换，用户消息保持纯文本渲染，避免用户输入的 Markdown 符号被意外解析。
  6. **`ConsoleLayout` 精简目标**：重构后 ConsoleLayout 仅保留布局 CSS 和顶层状态管理（折叠状态、messages、files 等），不含任何 UI 细节，为阶段四引入 Pinia 时的状态提升打好基础。

### [2026-04-28] - 阶段三：建立可插拔的外部工具集与多 Tab 并行体系
- **驱动模型**: Gemini 3.1 Pro (High)
- **涉及文件**: `src/layouts/ConsoleLayout.vue`, `src/pages/Portal.vue`, `src/utils/toolsRegistry.ts`, `src/composables/useTabs.ts`, `src/components/Sidebar/ToolList.vue`, `src/components/Workspace/TabHeader.vue`, `vite.config.ts`
- **变更逻辑摘要**: 
  为满足跨项目工具集成，确立了纯原生 Vue3 组件集成的规范，重构了控制台工作区，实现了类似 IDE 的多标签页工作区机制。
  1. **状态解耦**：抽象出 `useTabs.ts` 管理多 Tab 数据流与激活状态。
  2. **工具注册表**：新建 `toolsRegistry.ts` 作为统一挂载中心，支持外部组件懒加载。
  3. **视图保活**：在 `ConsoleLayout` 中将原有的 `<router-view>` 升级为带有 `<keep-alive>` 的 `<component :is>` 动态挂载机制，确保在文档与多个工具间切换时状态无损。
  4. **全链路互通**：支持通过门户页快速操作区的点击，路由携带 `?toolId` 直接在工作区激活渲染对应工具组件。
  [追加：修复了因缺少 `@` 路径别名配置而导致的 Vite 模块解析报错。]
  [追加：修复了因 `defineAsyncComponent` 在 `computed` 属性中被重复声明，导致 `<keep-alive>` 触发 `parentComponent.ctx.deactivate is not a function` 异常。解决方案是提前在工具注册表与 useTabs 中静态声明 `defineAsyncComponent` 包装。]
  [追加：修复了组件实例被放入全局 `ref` 状态导致 Vue 3 深度递归 Proxy 代理而触发的响应式开销警告及 Keep-Alive 切换崩溃。优化方案为：TabItem 结构中去除 component 实体，仅存储基础元数据，并在 `ConsoleLayout.vue` 渲染侧结合 `markRaw()` 瞬时查表按需挂载。]
  [追加：终极修复：由于在 `computed` 中依然残留了对 `defineAsyncComponent` 的动态构造，导致缓存判定失效。现已重构为顶层的绝对静态组件字典 `componentCache`，杜绝二次求值生成的代理实例冲突。]
  [追加：根治策略升级：彻底废弃了在多 Tab 场景下极其脆弱的 `<keep-alive>` 与 `<component :is>` 的组合替换逻辑。转向使用 `v-show` 组件常驻显隐队列策略。文档与工具组件完全平铺，只由状态控制可见性，彻底消灭了组件卸载时生命周期函数（`deactivate` 等）丢失导致的崩溃，状态天然永久保活。]
  [追加：状态联动增强：为彻底抹平“直接由快捷卡片穿越至工作区”导致的侧边栏视觉割裂，在 `ConsoleLayout` 中引入了对主页签激活状态的侦听，实现工具开启时左侧侧边栏模块的实时、反向跟随切换。]
  [追加：波浪线消除：补齐了 `tsconfig.app.json` 中的 `baseUrl` 与 `paths: {"@/*": ["./src/*"]}` 路径重定向别名，并在 `src` 目录下挂载了 `env.d.ts`，解决了编辑器中 Vue 文件的 TS 类型提示红线。]
  [追加：对标玻尔精致重构：重构了 `variables.scss` 的排版系统与色彩阶梯，为 `ConsoleLayout` 侧栏注入毛玻璃滤镜，重绘了 `ToolList` 卡片的气泡和圆角比例，实现微交互悬浮缓冲。]
  [追加：色彩逻辑热修复：排查并修正了之前在组件库中硬编码写入深色 rgba 色值（导致在 Light Theme 亮色模式下卡片背景色彻底消失、悬浮框隐形）的严重缺陷，现已全量重构为 `var(--card-bg)` 等自适应变量池调取。]
  [追加：Monaco 资源死锁防御：拦截并化解了 `TextModel got disposed before DiffEditorWidget model got reset` 致命报错。在组件响应 `accept/reject` 卸载渲染节点前，强制调用 `diffEditorRef.value.setModel(null)` 解绑模型，确保垃圾回收闭环。]

### [2026-04-28] - 阶段四：全局状态管理与部分持久化数据流转
- **驱动模型**: Gemini 3 Flash
- **涉及文件**: `src/main.ts`, `src/stores/workspace.ts`, `src/pages/Console.vue`, `src/layouts/ConsoleLayout.vue`, `src/components/Sidebar/FileList.vue`, `src/components/Copilot/ChatInput.vue`
- **变更逻辑摘要**: 
  **状态架构重构**：引入 Pinia 状态管理，打通控制台左中右三栏的“数据孤岛”。首先在 `src/main.ts` 中注册全局状态中心，并搭载 `pinia-plugin-persistedstate` 持久化插件，为实现草稿防丢失的部分持久化能力奠定基础。
  [追加：在 `src/stores/workspace.ts` 中完成全局状态中心架构搭建，整合 `activeDocument`, `selectedFileIds`, `messages`, `isDiffMode` 等状态，按“部分持久化”策略仅缓存文档与对话记录。]
  [追加：重构中间工作区页面 `src/pages/Console.vue`，移除陈旧的 EventBus 解耦方式，全量接入 `useWorkspaceStore` 驱动 Monaco Editor 的状态变更与 Diff 操作。]
  [追加：对 `src/layouts/ConsoleLayout.vue` 进行状态提升。将会话消息、文件选择、上下文引用等视图逻辑全部下沉解耦至 Pinia 状态接口，彻底消除了底层透传的冗余代码。]
  [追加：重构 `src/components/Sidebar/FileList.vue`，将多选引用状态存取剥离至 Store，打通与右侧 AI 上下文状态栏的深度绑定。]
  [追加：持久化配置热修复：解决 `pinia-plugin-persistedstate` 高版本 API 变更引发的 TS 校验死锁，将旧版配置项 `paths` 更替为最新的 `pick` 参数。]
  [追加：优化 `src/components/Copilot/ChatInput.vue` 体验：还原 `max-height: 150px` 边界，并利用 `:placeholder-shown` 机制实现在 Placeholder 状态下隐藏原生滚动条，文字溢出时自动恢复滑块。]

### [2026-04-29] - 编辑区竞态并发锁防呆机制
- **驱动模型**: Gemini 3 Flash
- **涉及文件**: `src/stores/workspace.ts`, `src/layouts/ConsoleLayout.vue`, `src/pages/Console.vue`
- **变更逻辑摘要**: 
  **防御式设计注入**：为了杜绝用户在 AI 异步润色阶段手动更改文档导致“代码冲突式覆盖”，在 `workspace.ts` 状态机中新增 `isEditorLocked` 门阀控制。
  [追加：在 `ConsoleLayout.vue` 的指令发送通道中设置请求上锁。]
  [追加：在 `Console.vue` 中设计了视觉拦截层，并在编辑器挂载点嵌入了一道毛玻璃锁定屏障。]
  [追加：空状态兜底方案 B 落地：在 `ConsoleLayout.vue` 引入了 `empty-state` 玻璃拟态欢迎看板，防止工作区全屏关闭时的纯灰色视觉断层，支持通过按钮唤醒工具箱和建立新文档。]
  [追加：解禁页签限制：在 `TabHeader.vue` 中移除文档类 Tab 的不可关闭限制，允许用户清空一切视图。]
  
  ### [2026-04-29] - 多格式智能解析与数据联动
- **驱动模型**: Gemini 3 Flash
- **涉及文件**: `src/composables/useTabs.ts`, `src/components/Workspace/CSVViewer.vue`, `src/layouts/ConsoleLayout.vue`
- **变更逻辑摘要**: 
  **多态架构解耦**：实现了非文本工作空间向非工具类文件的多格式映射拓展。
  [追加：改写 `useTabs.ts` 暴露 `openFileTab` 映射入口。]
  [追加：开发 `CSVViewer.vue` 用于呈现实验数据源，达成主面板流式渲染闭环。]
  [追加：热修复了 `useTabs.ts` 闭合大括号缺失导致的 esbuild HMR 报错。]

### [2026-04-30] - 科研深度文献阅读 (PDF)
- **驱动模型**: Gemini 3.1 Pro (High)
- **涉及文件**: `src/components/Workspace/PDFReader.vue`, `src/layouts/ConsoleLayout.vue`
- **变更逻辑摘要**: 
  **纯前端无感预览**：基于纯前端浏览器原生 iframe 引擎，零成本零负担地实现了 PDF 文献阅读。
  [追加：新增 `PDFReader.vue` 高质感双栏阅读组件，内置“学术文献”专属红标与智能精读 AI 浮动栏。]
  [追加：在 `ConsoleLayout.vue` 中绑定 `.pdf` 的路由展示开关 `isOpenPdfTab`。]

### [2026-05-21] - 阶段五：全局 UI/UX 对标玻尔工作站深度改造
- **驱动模型**: Claude Sonnet 4.6 (Thinking)
- **涉及文件**: `src/layouts/AppLayout.vue`(NEW), `src/layouts/ConsoleLayout.vue`, `src/pages/Portal.vue`, `src/pages/HistoryPage.vue`(NEW), `src/pages/ToolsGallery.vue`(NEW), `src/components/Sidebar/SidebarNav.vue`, `src/components/Sidebar/HistoryAccordion.vue`(NEW), `src/components/Sidebar/FileList.vue`, `src/components/Sidebar/ToolList.vue`, `src/components/Copilot/ContextBar.vue`, `src/components/Workspace/WordViewer.vue`(NEW), `src/composables/useTabs.ts`, `src/utils/toolsRegistry.ts`, `src/stores/workspace.ts`, `src/types/index.ts`, `src/router/index.ts`
- **变更逻辑摘要**: 
  本次改造为最大规模的架构重构，涉及五大核心功能点，全面对标玻尔（Bohrium）工作站 UI/UX 规范：

  **1. 侧边栏全局常驻**：新建 `AppLayout.vue` 作为全局壳布局，将 Portal 和 Console 均嵌套其中。侧边栏由 60px 图标轨道（始终可见）+ 260px 展开面板组成，可折叠但不可隐藏。路由重构为 AppLayout 根嵌套结构，新增 `/history` 和 `/tools` 两个独立子路由。

  **2. History 手风琴交互**：新建 `HistoryAccordion.vue`，将历史对话从右侧 Copilot 的 `history-drawer` 迁移至左侧图标导航条。点击图标后在展开面板内手风琴展开历史列表（`max-height: 240px`），超出时底部固定显示"查看全部历史对话"按钮，跳转至 `/history` 独立管理页。在 Portal 页点击任何导航项，先跳转至 `/console?panel=xxx` 再展开对应面板，由 `watch(route.query.panel)` 监听响应。

  **3. Toolbox 树形订阅结构**：`ToolConfig` 新增 `subscribed` 和 `category` 字段；`ToolList.vue` 重构为仅展示 `subscribed=true` 的已订阅工具，底部固定"查看全部工具"入口；新建 `ToolsGallery.vue` 全量工具大厅页，支持按分类过滤、关键词搜索和订阅/取消订阅操作。

  **4. 文件类型白名单收窄**：`FileItem.type` 移除 `pdf` 和 `csv`，仅保留 `docx | doc | xlsx | xls | md`；`useTabs.ts` 新增 `fileType` 字段和 `inferFileType` 辅助函数；`ConsoleLayout.vue` 移除 CSVViewer/PDFReader 渲染分支，新增 WordViewer 和 Excel 占位；安装 `mammoth.js` 并新建 `WordViewer.vue`，支持拖拽/点击上传 `.docx` 文件，调用 mammoth 转换为样式化 HTML 渲染。

  **5. 文件管理 Project/Folder 层级**：`types/index.ts` 新增 `Project`、`Folder`、`ContextRef` 三个接口；`workspace.ts` 的 `files` 状态升级为 `projects[]` 三级树结构，新增 `allFiles` computed（扁平化供 @ 引用搜索），新增 `toggleContextRef/removeContextRef/toggleProject/toggleFolder` 等 actions；`FileList.vue` 全量重构为 Project > Folder > File 三级树形组件，支持项目整体勾选、文件夹折叠展开；`ContextBar.vue` 升级为直接读取 Pinia `contextRefs`，支持项目级引用的金色 chip 展示。

### [2026-05-25] - 纠偏与重构：全局单列手风琴侧边栏与主区知识库布局
- **驱动模型**: Gemini 3.5 Flash (High)
- **涉及文件**: `src/router/index.ts`, `src/pages/KnowledgePage.vue`(NEW), `src/layouts/AppLayout.vue`
- **变更逻辑摘要**:
  为了彻底纠正大模型刻板生成的左右双列侧栏，将侧边栏重构为高内聚、自适应手风琴展开的单列侧边栏，并将“知识库”的层级结构推移至主内容区域展示。
  1. **路由拓扑升级**：在嵌套路由中平铺引入并配置 `/knowledge` 路由。
  2. **知识库左右分布**：新建 `KnowledgePage.vue` 大屏管理面板。左侧只渲染项目与文件夹的树形结构，点击激活后在右侧毛玻璃网格中展示对应文件。右侧提供快捷搜索、类型过滤、一键装载 AI 会话上下文，以及一键“控制台打开”并跨路由自动穿越回 Console 的流畅科研协作动效。
  3. **侧边栏单列收敛**：全量重写 `AppLayout.vue`，废除 60px 轨道与 260px 面板分离的格局，收敛为一体式折叠侧栏（展开 260px，折叠 60px）。整合 Logo 与长圆角“新建对话”按钮，将 AI 对话、科研知识库、已订阅工具与历史对话纵向排列。
  4. **极佳联动与弹开动效**：通过路由 `watch` 机制使侧栏 active 高亮精准跟随；在 60px 折叠态下，点击手风琴图标可自动联动弹开侧栏并展开列表，达成高级极佳的交互闭环。
  [追加：根据 AI 静态审阅报告的意见进行精细化优化：将原生 alert() 阻断体验更替为自研磨砂玻璃 Toast 通知卡片；在 computed 计算属性中移除 activeNode 的 ! 强类型断言，提升类型健壮性与防崩溃能力；在模拟上传成功时动态往 Pinia store 状态树中压入真实的 FileItem 并且联动右侧平铺展示；为面包屑增加点击一键回退当前项目的功能，让知识库交互体验臻于完美。]
