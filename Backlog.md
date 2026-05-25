# clzh 材料智慧平台 - 研发需求积压 (Backlog)

本看板追踪材料智慧平台 (clzh) 的功能演进与排期计划。

## 🏃 Active Sprint (Sprint 1 - 架构搭建与状态对齐)
- [x] 搭建基础门户页 (Portal.vue) 模式分流器
- [x] 搭建控制台 (Console.vue) 左右三栏弹性自适应布局
- [x] 基于 Pinia 状态管理设计文档状态机与 Diff 审批态
- [x] 沉淀系统自进化元数据规范文件 (.geminirules, Backlog, Changelog, guides)
- [x] 物理前后端彻底解耦并修复 Windows/Anaconda 缺失 ssl DLL 的后端启动阻碍

## 📅 Upcoming Sprint (Sprint 2 - 核心功能补强与接入)
- [ ] 将静态文本编辑区重构为真实 Monaco Editor 并整合其内置 of Monaco Diff Editor 模式
- [ ] 研发右侧 AI 输入框 `@` 引用文件与 `/` 指令的 Autocomplete 弹出菜单组件
- [ ] 实现左侧导航栏文件树真实上传、解析及 Checkbox 多选注意力胶囊关联机制
- [ ] 研发独立小程序组件（单位换算器、数据可视化分析）并在中间 Stage区实现覆盖式单标签加载与“返回”保存流
- [ ] 对接后端大模型 API 并实现流式输出 (Server-Sent Events) 与实时日志流 (Log Streaming)
