import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. 创建数据库及连接池
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "evolution.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. 数据库实体定义
class DBFeedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50))
    content = Column(Text)
    processed = Column(Boolean, default=False)
    screenshots_json = Column(Text, default="[]")

Base.metadata.create_all(bind=engine)

# 3. Pydantic 契约
class FeedbackPayload(BaseModel):
    category: str
    content: str
    screenshots: List[str] = []

# 4. 初始化 FastAPI
app = FastAPI(title="Materials Intelligence Evolution API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. WebSocket 广播管理器
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# 6. API 路由定义
@app.post("/api/feedback")
async def create_feedback(payload: FeedbackPayload):
    db = SessionLocal()
    try:
        new_feedback = DBFeedback(
            category=payload.category,
            content=payload.content,
            screenshots_json=json.dumps(payload.screenshots),
            processed=False
        )
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)
        
        # 广播新提交通知给外部监听
        await manager.broadcast(json.dumps({
            "type": "feedback_submitted",
            "id": new_feedback.id,
            "category": new_feedback.category,
            "content": new_feedback.content
        }))
        
        return {"status": "success", "message": "反馈已提交，等待 Agent 处理。", "id": new_feedback.id}
    finally:
        db.close()

@app.get("/api/feedback/pending")
def get_pending_feedbacks():
    db = SessionLocal()
    try:
        pending = db.query(DBFeedback).filter(DBFeedback.processed == False).all()
        return [
            {
                "id": fb.id,
                "category": fb.category,
                "content": fb.content,
                "screenshots": json.loads(fb.screenshots_json),
                "processed": fb.processed
            }
            for fb in pending
        ]
    finally:
        db.close()

@app.post("/api/feedback/{feedback_id}/processed")
async def mark_feedback_processed(feedback_id: int):
    db = SessionLocal()
    try:
        fb = db.query(DBFeedback).filter(DBFeedback.id == feedback_id).first()
        if not fb:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        fb.processed = True
        db.commit()
        
        # 广播自进化更新事件给前端
        await manager.broadcast(json.dumps({
            "type": "feedback_processed",
            "id": feedback_id,
            "category": fb.category,
            "content": fb.content
        }))
        
        return {"status": "success", "message": f"反馈 #{feedback_id} 标记处理成功并已广播。"}
    finally:
        db.close()

# 7. WebSocket 路由
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 保持长连接心跳
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
