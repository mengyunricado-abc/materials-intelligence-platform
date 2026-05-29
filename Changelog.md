# 变更日志 (Changelog)

所有关于材料智慧平台 (clzh) 的版本演进和关键修改都将在此记录。

## [v0.6.0] - 2026-05-29
### 🚀 Added
- **前台雷达自进化反馈抽屉**：开发了浮动式 `FeedbackDrawer` 交互反馈组件，支持“页面审查点选”高亮定位并捕获任意 UI 元素的 CSS 唯一选择器，以极简交互流将用户改进意图一键提交。
- **本地伴生自修复后端服务**：集成 FastAPI 后端（端口 8090）与 SQLite 伴生数据库，可实时持久化反馈记录，并提供反馈流拉取及自动触发 Agent 大脑自愈接口。
- **视觉回归靶场与影子沙箱**：基于 Playwright 开发了 `test_visual_regression.py` 回归脚本，在影子沙箱重写代码后自动生成并对比 `ui_before.png` 与 `ui_after.png` 保证像素级布局无损。
- **Docker 容器化伴生部署**：编写了 `Dockerfile` 及 `docker-compose.yml`，将自进化伴生服务及其 SQLite 数据库一键封装隔离运行，保障了主机环境的安全与稳定性。
- **侧边栏与控制台导航精简**：微调了 `ConsoleLayout.vue` 与 `FileList.vue` 等侧边栏文字，使其对标 Bohrium 科学美学更简练明晰。

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
