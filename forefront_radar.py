import os
import sys
import time
import sqlite3

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "evolution.db"))

def check_pending():
    if not os.path.exists(db_path):
        return None
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT id, content FROM feedbacks WHERE processed = 0")
        row = c.fetchone()
        conn.close()
        return row if row else None
    except Exception:
        return None

print("[Forefront Radar] ⚡ 智能材料平台自进化雷达已上线，正在持续监听数据库事件...", flush=True)

while True:
    row = check_pending()
    if row:
        fb_id, content = row
        print(f"\n[WAKEUP_AGENT] 🚨 雷达在物理 SQLite 数据库成功捕获到新任务 #{fb_id}！", flush=True)
        print(f"[WAKEUP_AGENT] 反馈建议内容: {content}", flush=True)
        print("[WAKEUP_AGENT] 正在向当前 IDE Session 发送强唤醒信号，引爆前台 AI Agent 的大脑进入自进化...", flush=True)
        sys.exit(0) # 0 退出，引爆 Reactive Wakeup！
    time.sleep(1)
