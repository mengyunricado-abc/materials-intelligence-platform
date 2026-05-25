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
