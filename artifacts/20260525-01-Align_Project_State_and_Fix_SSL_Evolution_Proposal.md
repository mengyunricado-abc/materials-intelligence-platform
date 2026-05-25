# 项目进化对齐提案

基于最近的协作与代码变更，我们识别出以下物理架构漂移与环境依赖瓶颈，并规划了项目的进化路径。

## 1. 状态漂移分析与根因
- **物理拓扑结构重构（已落地未登记）**：项目已从单体结构彻底解耦拆分为 `frontend/`（基于 Vue 3 的前端工作区）和 `backend/`（基于 FastAPI 的轻量网关），使前端和后端彻底实现松耦合。
- **环境依赖漂移与阻碍（Conda SSL 报错）**：在 Windows + Anaconda 环境下，运行 `python main.py` 会遭遇 `ImportError: DLL load failed while importing _ssl`。该问题是由于 Windows Python 3.8+ 安全 DLL 检索机制拒绝使用 `PATH` 去加载 Anaconda `Library/bin` 目录下的 ssl/crypto 动态链接库所致。
- **指南与元数据脱节**：Changelog.md 和 Backlog.md 尚未完全对齐上述物理拓扑重构和最新的 Sprint 进度。

## 2. 拟议进化变更
请审查以下将被自动修改、新建并对齐的文件内容：

#### [新建] `guides/20260525-01-decoupling_and_environment_troubleshooting.md`
```markdown
# 前后端解耦架构与 Windows Conda 环境 SSL 修复指南

本指南记录了材料智慧平台 (clzh) 的物理前后端解耦规范，以及在 Windows/Anaconda 环境下启动后端服务的避坑指南。

## 1. 前后端物理拓扑与职责划分

为了维持系统的轻量、扁平与高可维护性，我们将单体应用完全解耦拆分为前端和后端两个物理子模块：
* **frontend/**：
  - 基于 Vue 3 + Vite + TypeScript + Pinia 构建的材料智慧工作站。
  - 职责：提供高交互、高密度的 UI 呈现（如三栏自适应控制台、文献网格、AI 问答侧边栏）与前端状态维护。
* **backend/**：
  - 基于 FastAPI 构建的轻量级长连接数据与 Agent 网关。
  - 职责：处理反馈文件（`feedback_requests.json`）的持久化，挂载 WebSocket 实时广播，并桥接大模型 Agent 底层接口。

前后端通过标准的 **HTTP API（8000 端口）** 与 **WebSocket 协议（`/ws/notifications`）** 进行实时通信。

---

## 2. Windows/Anaconda 下 `ImportError: DLL load failed` 根治方案

### 2.1 报错根源分析
在 Windows 环境下，使用 Anaconda 发行版的 Python 时，通过终端直接执行 `python main.py` 时可能遭遇以下错误：
```
ImportError: DLL load failed while importing _ssl: 找不到指定的模块。
```
**技术根源**：自 Python 3.8 起，Windows 版 Python 改变了对 C 扩展 DLL 依赖库的查找规则。它只在系统受信任目录、Python 的 DLLs 目录以及通过 `os.add_dll_directory()` 动态添加的路径中寻找 DLL，而彻底**忽略**了系统环境变量 `PATH`。
因为 Conda 将其关键依赖 DLL（如 `libcrypto-*.dll` 和 `libssl-*.dll`）放置于虚拟环境下的 `Library/bin` 目录，这导致 Python 在加载 `ssl` 扩展模块时无法加载底层依赖，引发加载失败报错。

### 2.2 优雅的动态热修复补丁 (In-Code Hotfix)
为了实现“零配置、即插即用”，我们选择直接在 `backend/main.py` 的顶部引入一段智能感知 Conda 环境的动态 DLL 热装载逻辑：
```python
import os
import sys

# 针对 Windows Python 3.8+ 的 Anaconda 环境 DLL 查找路径热装载
if sys.platform == "win32":
    conda_ssl_bin = os.path.join(sys.prefix, "Library", "bin")
    if os.path.exists(conda_ssl_bin):
        try:
            os.add_dll_directory(conda_ssl_bin)
            print(f"[ENV] Successfully hot-loaded Anaconda DLL path: {conda_ssl_bin}")
        except AttributeError:
            # 兼容 Python 3.8 以下版本
            os.environ["PATH"] = conda_ssl_bin + os.path.pathsep + os.environ["PATH"]
```
此逻辑能够自动检测当前是否处于 Windows 平台且是否存在 Conda 专有的 `Library/bin`。如果存在，则在内存中将其注册为合法的 DLL 查找域。如此一来，用户在任何 Conda 终端下直接运行 `python main.py`，无需进行复杂的系统 PATH 配置，均能瞬间成功导入 `fastapi` 及其所有的底层依赖！
```

#### [修改] `backend/main.py`
```python
# -*- coding: utf-8 -*-
# @vibe-intent 编写轻量级 FastAPI 反馈网关后端，基于平面文件（feedback_requests.json）实现零开销反馈数据读写与 WebSocket 通知推送。
# @vibe-model Gemini 3.5 Flash (High)
# @vibe-ref intents.md#2026-05-25

import os
import sys

# ==================== Conda SSL DLL Hotfix ====================
# 针对 Windows Python 3.8+ 的 Anaconda 环境，动态注册 Library/bin 为合法的 DLL 查找路径，优雅解决 ssl DLL load failed 报错
if sys.platform == "win32":
    conda_ssl_bin = os.path.join(sys.prefix, "Library", "bin")
    if os.path.exists(conda_ssl_bin):
        try:
            os.add_dll_directory(conda_ssl_bin)
            print(f"[ENV] Successfully hot-loaded Anaconda DLL path: {conda_ssl_bin}")
        except AttributeError:
            os.environ["PATH"] = conda_ssl_bin + os.path.pathsep + os.environ["PATH"]
# ==============================================================

import json
import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
```

#### [修改] `Changelog.md`
```markdown
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
- [x] 物理前后端彻底解耦并修复 Windows/Anaconda 缺失 ssl DLL 的后端启动阻碍

## 📅 Upcoming Sprint (Sprint 2 - 核心功能补强与接入)
- [ ] 将静态文本编辑区重构为真实 Monaco Editor 并整合其内置 of Monaco Diff Editor 模式
- [ ] 研发右侧 AI 输入框 `@` 引用文件与 `/` 指令的 Autocomplete 弹出菜单组件
- [ ] 实现左侧导航栏文件树真实上传、解析及 Checkbox 多选注意力胶囊关联机制
- [ ] 研发独立小程序组件（单位换算器、数据可视化分析）并在中间 Stage区实现覆盖式单标签加载与“返回”保存流
- [ ] 对接后端大模型 API 并实现流式输出 (Server-Sent Events) 与实时日志流 (Log Streaming)
```
