# -*- coding: utf-8 -*-
# @vibe-intent 轻量级 FastAPI 反馈网关后端，升级注入基于 ctypes 的 Windows Anaconda SSL DLL 动态载入补丁，彻底排除环境缺失 SSL 报错并实现即插即用
# @vibe-model Gemini 3.5 Flash (High)
# @vibe-ref intents.md#2026-05-25

import os
import sys
import ctypes

# ==================== Windows Conda SSL DLL Hotfix ====================
# 针对 Windows Python 3.8+ 的 Anaconda 环境，动态且强行载入 Library/bin 下的 OpenSSL DLLs，免配置热修复 ssl 缺失报错
if sys.platform == "win32":
    libcrypto_path = os.path.join(sys.prefix, "Library", "bin", "libcrypto-1_1-x64.dll")
    libssl_path = os.path.join(sys.prefix, "Library", "bin", "libssl-1_1-x64.dll")
    if os.path.exists(libcrypto_path) and os.path.exists(libssl_path):
        try:
            ctypes.CDLL(libcrypto_path)
            ctypes.CDLL(libssl_path)
            print(f"[ENV] Successfully hot-loaded Anaconda OpenSSL DLLs via ctypes from: {sys.prefix}")
        except Exception as e:
            print(f"[ENV] Warning: Failed to hot-load DLLs via ctypes: {e}")
# ==============================================================

import json
import datetime
from typing import List, Dict, Any, Union
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Materials Platform Agent Gateway", version="1.0.0")

# 1. 跨域配置，方便跨端口调试
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEEDBACK_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "feedback_requests.json")

class FeedbackModel(BaseModel):
    id: Union[int, None] = None
    category: str
    content: str
    processed: bool = False
    timestamp: Union[str, None] = None
    screenshots: List[str] = []

# 2. WebSocket 链接管理器
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] New client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        print(f"[WS] Broadcasting: {message}")
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"[WS] Broadcast error: {e}")

manager = ConnectionManager()

# 3. 辅助文件读写函数
def read_feedbacks() -> List[Dict[str, Any]]:
    if not os.path.exists(FEEDBACK_FILE):
        return []
    try:
        with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading feedback file: {e}")
        return []

def write_feedbacks(data: List[Dict[str, Any]]):
    try:
        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error writing feedback file: {e}")

# 4. 路由定义
router = APIRouter(prefix="/api")

@router.get("/feedback", response_model=List[FeedbackModel])
def get_all_feedbacks():
    return read_feedbacks()

@router.post("/feedback")
async def create_feedback(feedback: FeedbackModel):
    feedbacks = read_feedbacks()
    
    # 自动计算自增 ID
    next_id = 1
    if feedbacks:
        next_id = max(f.get("id", 0) for f in feedbacks) + 1
        
    feedback.id = next_id
    if not feedback.timestamp:
        feedback.timestamp = datetime.datetime.now().isoformat()
        
    feedback_dict = feedback.dict()
    feedbacks.insert(0, feedback_dict)  # 新提交的放在首位
    write_feedbacks(feedbacks)
    
    # 广播给监听 of Agent 守护进程
    await manager.broadcast(json.dumps({
        "type": "feedback_submitted",
        "id": feedback.id,
        "category": feedback.category,
        "content": feedback.content
    }))
    
    return {"status": "success", "message": "反馈已提交至 Code Agent，正在排队处理。", "id": feedback.id}

@router.post("/feedback/{feedback_id}/processed")
async def mark_feedback_processed(feedback_id: int):
    feedbacks = read_feedbacks()
    found = False
    target_fb = None
    
    for fb in feedbacks:
        if fb.get("id") == feedback_id:
            fb["processed"] = True
            found = True
            target_fb = fb
            break
            
    if not found or not target_fb:
        return {"status": "error", "message": f"Feedback ID {feedback_id} not found."}
        
    write_feedbacks(feedbacks)
    
    # 广播给前端，触发自进化部署完成 Toast 提示
    await manager.broadcast(json.dumps({
        "type": "feedback_processed",
        "id": feedback_id,
        "category": target_fb.get("category"),
        "content": target_fb.get("content")
    }))
    
    return {"status": "success", "message": f"Feedback ID {feedback_id} marked as processed."}

app.include_router(router)

# 5. WebSocket 路由挂载
@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 持续接收心跳或客户端数据，保持链路活跃
            data = await websocket.receive_text()
            print(f"[WS] Received data: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
