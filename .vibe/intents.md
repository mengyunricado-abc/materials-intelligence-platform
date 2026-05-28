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
  [追加：重构 AI 问答区域设计与协同编辑器深度联动。① 拓扑解耦：新增 /chat 独立问答路由页 ChatPage.vue，Portal 提问携带 q 平滑跳转并自动触发流式 AI 响应。默认呈现学术搜索（中对话、右文献）布局，中部的问答宽度保留，右侧底部挂载多篇文件对话与加入知识库 Dialog。② 布局反转与 Resizable：重构 KnowledgePage.vue 大屏布局，左中 Main 呈现知识库文件，右侧挂载锁定为「知识库问答」的 AI 问答面板，边缘搭载毛玻璃阻尼 col-resize Resizable 宽度控制手把（300px-600px 范围自适应并在 Pinia 同步）。③ Word 协同编辑器升级：将只读 WordViewer 重构升级为 contenteditable 协同富文本编辑器，内置高级毛玻璃工具栏与全局 __insertWordEditorText 挂载钩子，打通 Copilot 气泡「一键插回光标处」的物理闭环。④ 侧栏联动：AppLayout.vue 点击新建/AI 对话统一跳往 /chat 并自动重置 Session，实现多端无感顺畅流转。⑤ 编译与类型验证：经 npx tsc 类型检查 100% 编译通过，无任何红线报错。]

### [2026-05-28] - 侧边栏 UI 精修与导航逻辑收敛（两大战役共9项）
- **驱动模型**: Claude Sonnet 4.6 (Thinking)
- **涉及文件**: `src/layouts/AppLayout.vue`, `src/components/Sidebar/ToolList.vue`, `src/components/Sidebar/HistoryAccordion.vue`, `src/stores/workspace.ts`, `src/pages/ChatPage.vue`, `src/pages/Portal.vue`, `src/layouts/ConsoleLayout.vue`, `src/pages/KnowledgePage.vue`, `src/types/index.ts`
- **变更逻辑摘要**:
  本次修改源于与用户的深度 /grill-me 需求对齐会话，经逐问确认后执行。核心决策如下：

  **第一战役（UI 样式）**：
  1. **侧边栏高度修复（T1）**：定位到 `.sidebar-spacer {flex:1}` 与 `.sidebar-nav {flex:1}` 并列导致高度各分一半的根因，删除 sidebar-spacer 元素，让 sidebar-nav 独占全部剩余高度，手风琴内容得以充分展开。
  2. **手风琴背景透明（T2）**：将 `.accordion-body` 的 `background-color: rgba(0,0,0,0.08)` 改为 `transparent`，消除展开后的深色背景块，回归玻尔侧边栏纯净风格。
  3. **工具列表高度解锁（T3）**：移除 `.inner-list-wrap` 的 `max-height: 240px` 硬限制，工具列表随内容自然撑开。
  4. **字体层级规范（T4）**：父级手风琴触发头（已订阅工具/历史对话）统一调整至 `0.88rem + font-weight:600`；子项（工具名称/历史对话标题）调整至 `0.78rem + font-weight:400`，形成清晰视觉层次。
  5. **工具列表精简（T5）**：将 ToolList.vue 的工具卡片由「图标圆块+名称+描述文字+卡片背景」重构为「图标+名称」的轻量一行式，去除视觉噪音，更符合侧边栏精简导航定位。

  **第二战役（导航逻辑）**：
  6. **新建对话合并（T6）**：删除独立的「AI 对话」nav-item 和原「新建对话」特殊按钮，合并为单一 nav-item（图标 `mdi-plus-circle-outline` + 换行/新建逻辑等），点击行为改为 `createSession() + router.push('/')`，引导用户回到门户页从零输入，逻辑链：新 session 备用 → 门户页输入 → Portal submit 携带 q 跳转 /chat。
  7. **工具新标签页隔离（T7）**：ToolList 工具项点击改为 `window.open('/console?tool=${toolId}', '_blank')`，将工具执行环境与知识库 Tab 体系彻底物理隔离，留 TODO 注释备后续路由精确化。
  8. **单一对话标题视图（T8）**：ChatPage.vue header 将固定文字"学术搜索对话"/"多篇文件对话"改为动态读取 `workspaceStore.currentSession?.title`，实现标题随当前 session 实时变化。
  9. **标题动态生成预留（T9）**：`workspace.ts` 的 `createSession()` 初始标题改为"新科学对话"；`addMessage()` 中拦截用户第一条消息，通过 `generateChatTitle()` 函数（截取前 10 字 + `...`）自动更新 session 标题，并留 `// TODO: 后续接入 LLM API 动态生成标题摘要` 注释钩子。

  [追加：对标 Bohrium 工作站门户与侧栏的终极学术美学优化：
  1. 侧边栏底色与字重阶梯：底色由纯白重构为柔和微光的灰蓝色（#ebedf3），并将父级菜单标题字重从 600 下调为更克制中庸的 500 (Medium)，调降高亮选中背景的高对比度噪音。
  2. 树状层级引导线与去图标静音：手风琴展开的已订阅工具和历史列表左侧引入极细的纵向垂直连接引导线，同时彻底剥离历史列表的前置气泡图标与预览副文本，以极净空的纯字排版实现超凡秩序美。
  3. 查看全部扁平化：拆碎原来突兀的蓝色虚线大胶囊按钮，重塑为与其上子项高度平齐缩进、字色淡雅、且右侧仅带一个细小 [↗] 外链图标 of 扁平无框子项。
  4. 已订阅工具头部去噪：移除 ToolList 重复的多余 h3 标题和数量大角标，使子项干净连贯地在原地铺开。
  5. 最底座追加：在侧栏底部增设 Bohrium 经典的科学家用户卡片、带渐变紫星的“Basic 升级/额度💎 58次”小组件以及“🌐 CN”语言切换帮助图标，极大地夯实了全局工作站的真实感。
  6. 科学家主门户大重塑：Portal.vue 页面背景升级为微蓝灰冷渐变（linear-gradient）极淡雅微光纹理，顶置高校福利横幅及签到大胶囊；主标题蜕变为超高雅深蓝紫色“科学家，你好”；输入框重绘为大圆角润滑大胶囊卡片（border-radius: 24px，集成闪电、期刊下拉和“深度研究 ON-OFF”交互门阀）；横向部署三联材料高频场景大卡片；下方配以带彩色渐变示意图的常见物理案例（如固/液态电池、能带缺陷模拟），辅以双矢量“换一换”及问题广场，使整个主门户极具顶尖高定级学术软件质感。]

  [追加：主门户与侧栏的二次调优与类型纠偏：
  1. 门户页降噪：根据用户指示，删除了顶部重复显眼的福利通知横幅，并把主标题文案由“科学家，你好”精调回经典高雅的“您的 AI 科研协作者”，使用户回归纯净科研视野。
  2. 侧边栏清爽化：取消并删除了最底座的 Bohrium 科学家卡片及升级升级块，使整个左侧边栏底座高度精简利落。
  3. 新建对话高亮修复：在 AppLayout.vue 中，将新建对话的高亮条件 active 修复为 activeMenuId === 'portal'，当用户位于提问门户主页时完美反向关联高亮。
  4. 参考文献 TS 编译纠错：定位并解开了 ChatPage.vue 引用参考文献作为上下文时的类型红线，toggleContextRef 的传参严格对齐了 ContextRef 接口的数据契约，补齐必填字段 icon 且剔除无效的 fileType，化解 esbuild 编译隐患。]

  [追加：侧栏绝对对齐、字阶梯队、项数限制与卡片防撑宽：
  1. 历史对话手风琴头部齐平：彻底清除了 HistoryAccordion.vue 中 .accordion-header 头部自带的左右 0.5rem margin 偏置，使之与普通 nav-item 及“已订阅工具”头部左端在垂直线上绝对对齐。
  2. 阶梯子项合适缩进对齐：将 ToolList.vue 和 HistoryAccordion.vue 中所有子项（工具、历史会话、查看全部）的 padding-left 统一定为 1.5rem。由于父级是 0.75rem，这在保持整体左端完美对齐的同时，提供了一道极其清晰自然的 12px 层级缩进阶梯。树形垂直连接线精确定位在 1.25rem 处进行对称指引，且字号调大到 0.88rem (父级一致)，“查看全部”略小为 0.78rem，前 5 项截取平铺防滚动。
  3. 卡片防撑宽：在 Portal.vue 的 .grid-card 样式里锁死 min-width: 0 且 box-sizing: border-box。完美根治了由于文字单行 nowrap 和 Grid 默认最小宽度 min-width: auto 导致的列宽被强行顶开、使右侧卡片溢出对话框物理宽度 820px 的经典撑宽 Bug，主门户所有卡片 and 输入框实现极致完美的对齐闭环。]

  [追加：材料智慧平台双物理隔离体系与文件树高级交互重构：
  1. 场景拓扑智能路由跳转分流：在 Session 接口中扩展 `type: 'qa' | 'doc-edit'`，并在 HistoryAccordion 和 HistoryPage 开启智能分流，qa 跳 /chat，doc-edit 跳 /console 并激活对应文档。
  2. 同文档多会话与 Copilot 物理隔离：切换文档 Tab 时自动调用 `loadOrCreateDocSession` 匹配专属对话；AI 最近胶囊栏只过滤展示当前文档专属的对话；支持右上角新建并绑定当前文档。
  3. 最近历史隐藏而非物理删除：侧栏和胶囊栏叉号调用 `hideSessionFromRecent` 设为最近隐藏，最近列表和胶囊栏中不可见，只有在查看全部 /history 全量管理页才物理删除。
  4. 空会话与挂载条垃圾清理：添加 `cleanupEmptySessions` 静默清理机制；剥离 Console 右侧 AI 助手的 ContextBar 上下文挂载条以进行知识库隔离。
  5. 树节点高级交互与保存落户：FileList 空文件夹折叠图标隐藏；在项目和文件夹右侧追加 row-actions 新建文件并打开 Tab；ConsoleLayout 新建白板文档在保存时弹出 Glass 路径选择器，动态归档文件树并绑定 Tab。]

  [追加：彻底排查并清理废弃 openToolTab 漏网之鱼：
  在 useTabs 中物理删除了 openToolTab 后，同步清扫了在 ToolsGallery、ConsoleLayout 内部解构中的残存引用，并打通了大厅中“打开工具”按钮向 `/tools/run` 物理隔离空间的无缝路由跳转分流，彻底杜绝 ReferenceError 未定义报错。]

  [追加：空白文档免弹窗“先写后归档”保存交互高阶闭环与体验隐患终极治理：
  1. 侧栏树与大屏新建解耦：重构了 FileList.vue 和 KnowledgePage.vue，将原来中断思路的新建文件名弹窗彻底移除，改写为在 activeTabId 中生成带有 tempProjectId/tempFolderId 临时归属字段的 `doc_temp_xxx` 临时空白 Tab，并顺滑 router.push('/console') 瞬间跳转开写，实现思维极净零阻力。
  2. useTabs.ts 接口扩充：在 TabItem 接口声明中新增了 tempProjectId、tempFolderId 以及 isTemp 三个可选字段，打通临时白板属性向下传递。
  3. 保存路径与格式高阶重塑：深度重绘了 ConsoleLayout.vue 的 Glass 归档保存弹窗。表单最上方配置了 Markdown/Word/Excel 三色选项卡，输入框右侧内嵌格式后缀，且默认智能回显临时 Tab 绑定的归宿项目/文件夹。
  4. 页签覆盖与会话自动重绘：一旦点击保存，物理写入文件树，返回物理 ID。通过 activeTab 属性深层强行覆盖更新，打通 activeTabId 双向绑定与 Tab title 实时更新，无感销毁临时态，并优雅重绘出属于该新物理文件节点的专属 Copilot AI 协同会话，完成惊艳的交互高阶闭环。
  5. 初始空白文档废除：在 useTabs.ts 中物理废除了系统一上来强行初始化的 doc_default (未命名文档_1.md) 临时占位，回归了在没有任何打开文档时最干净纯洁的 IDE “材料智慧科研空间”空状态面板，大幅净化了全局判断负担。
  6. AI 润色模拟物理删除：在 Console.vue 中物理移去了界面左上角多余、冷冰冰且硬编码的 AI 润色模拟按钮。用户能够完美通过在右侧 Copilot 发送任意指令点击气泡卡片，唤醒华丽的 Diff 对比与红绿线，保证了演示路径与真实使用逻辑 100% 呼应。
  7. 侧栏历史选择拦截漏洞根治：在 AppLayout.vue 中废除了历史对话列表被点击时强制劫持跳转到学术搜索 /chat 的硬编码 handler。自此彻底释放了 HistoryAccordion.vue 中所打造的精细化“文档跳 /console，工具跳运行，学术跳问答”的对称完美分流！
  8. 知识库多会话专属与绝对物理隔离：在大屏 KnowledgePage.vue 中引进了 recentKbSessions 胶囊以及 createKbSession 多会话支持，并在 createSession 中补充了 knowledge 专属的引导欢迎语。通过 watch 与 onMounted 强行在面板展开和切换时自动绑定加载/锁定对应知识库的会话，彻底解决了大屏右侧问答残留和被别的历史对话污染的问题。
  9. 门户提问强制生成新会话：重构了 Portal.vue 中的 submit 方法。提问时自动前置调用 `workspaceStore.createSession('academic')`，物理确保了“凡是从门户页发起的提问，一律 100% 自动创建并进入全新学术对话”，杜绝了残留旧会话被污染的历史残留。
  10. 门户快捷工具大卡片跳转修复：重构了 Portal.vue 中的 openTool 方法，将原来跳往旧控制台 Workspace 的废弃路由修正为直接跳转至常用科学工具大屏运行专属路由 `/tools/run?toolId=...`，确保了与全新的工具大屏物理隔离空间体验完美看齐！
  11. 修复 Vue 依赖导入遗漏：修复了 KnowledgePage.vue 在重构过程中 Vue 导入时遗漏 watch 与 onMounted 导致的 ReferenceError 隐患，恢复了系统的绝对稳健运行。
  12. 攻克 Vue 3 计算属性赋值死锁：解决了保存落户时直接修改 computed 计算属性 activeTab 引发响应式提前重新求值而退化为 undefined 导致的 crash 崩溃。通过 tabs.value 局部原始引用先行修改再更新 activeTabId 的高能方案，确保了页签重塑 100% 健壮运行。
  13. 攻克第三轮深度测试 4 项高阶交互漏洞与 Bug：
      - 根治新建页签保存物理落户后的“双专属会话”双重缓存漏洞：在 `workspace.ts` 中封装了高内聚的 `upgradeDocSession` action。在保存时对 sessions 数组整卷强制重新赋值，物理触发 Pinia 的 reactive 深度响应式重绘以及 `pinia-plugin-persistedstate` 的 `localStorage` 硬盘重写。
      - 补全挂载文献显示：在 `KnowledgePage.vue` 中补足了声明遗漏 of `mountedFiles` 计算属性，彻底激活了大屏顶部磨砂金色 `.kb-mounted-context-bar` 文献 chip 的显示与一键解耦。
      - 彻底打通历史跳转大屏还原联动：在 `KnowledgePage.vue` 中封装并引入了 `handleHistoryQueryRoute` 核心路由拦截器。在 `onMounted` 与路由 `watch` 时自动触发，精准还原 AI 面板的展开、专属 knowledge 会话的 switch 激活，并基于 session 的 fileId 树状回溯，自动反向点亮左侧知识树的项目/文件夹节点。
      - 智能科学改名：升级了 `workspace.ts` 的 `addMessage` 机制，在用户首次提问时智能检测，若有文献挂载，则将标题重塑为《关于 [首个文件名] 的文献精读》，夯实高定科研学术质感。
  14. 攻克已挂载文献的会话隔离与精准还原：
      - 问题根因：之前系统的 `contextRefs` 属性是全局共享的一个 ref 状态，导致在不同历史会话间切换时，挂载文献呈现为最新全局的文献，产生了严重的会话污染。
      - 物理打通：在 `types/index.ts` 的 `Session` 接口中扩充可选字段 `contextRefs?: ContextRef[]`；在 `workspace.ts` 状态机里，于 `switchSession`、`createSession` 及各 `loadOrCreateSession` 动作中，实现对 `contextRefs` 的高能备份与双向快照重塑。当进行会话切换时，能安全暂存当前会话最新的文献挂载状态，并完全还原出目标会话当时挂载文献的特定快照，达成殿堂级的会话环境无损恢复。]

