# 变更日志 (Changelog)

所有关于材料智慧平台 (clzh) 的版本演进和关键修改都将在此记录。

## [v0.1.1-alpha] - 2026-05-25
### 🚀 Added
- 沉淀了前后端物理架构与 Anaconda 环境排错指南：[guides/20260525-01-decoupling_and_environment_troubleshooting.md](file:///d:/2026/03project/materials-intelligence-platform/guides/20260525-01-decoupling_and_environment_troubleshooting.md)。
- 在 `backend/main.py` 内部引入了动态 DLL 路径热加载补丁，免除 Windows/Anaconda 缺失系统环境变量的 SSL DLL 载入限制，实现后端一键即用。

### 🔧 Changed
- 对齐了项目最新的元数据排期看板，将 Sprint 1 阶段关于自进化元数据构建标记为完结，并增补了 Sprint 2 后端运行环境及自适应部署状态任务。

## [v0.1.0-alpha] - 2026-05-23
### 🚀 Added
- 首次引入项目自进化对齐机制 (`a-project-evolution`)，完成基础元数据构建。
- 物理沉淀了系统核心交互与布局设计指南：[guides/20260523-01-clzh_platform_layout_and_interaction_spec.md](file:///d:/2026/03project/materials-intelligence-platform/guides/20260523-01-clzh_platform_layout_and_interaction_spec.md)。
- 首次确立了 AI 开发者规范 [.geminirules](file:///d:/2026/03project/materials-intelligence-platform/.geminirules)。
- 建立了产品研发看板 [Backlog.md](file:///d:/2026/03project/materials-intelligence-platform/Backlog.md)。
- 初始化了核心前端布局，包括门户页模式切换及控制台三栏布局骨架（Portal.vue, Console.vue）。
