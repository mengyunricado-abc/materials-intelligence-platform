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
- [x] 接入前台雷达自进化体系，新增反馈抽屉、伴生 API、SQLite 自动落库与影子沙箱自修复机制
- [ ] 将控制台中间文本区重构为真实 Monaco Editor 并整合 Monaco Diff Editor 比对模式
- [ ] 研发右侧 AI 输入框 `@` 引用文件与 `/` 指令 of Autocomplete 弹出菜单组件
- [ ] 对接后端真实大模型 API 并实现流式输出 (Server-Sent Events) 与实时日志流 (Log Streaming)
