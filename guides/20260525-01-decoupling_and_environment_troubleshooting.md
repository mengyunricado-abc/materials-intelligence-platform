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
