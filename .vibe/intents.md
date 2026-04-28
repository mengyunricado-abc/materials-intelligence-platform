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
