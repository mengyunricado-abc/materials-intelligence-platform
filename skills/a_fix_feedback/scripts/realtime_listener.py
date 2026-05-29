import os
import sys
import json
import asyncio
import websockets
import subprocess

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

def log(msg):
    print(f"[Realtime Listener] {msg}", flush=True)

async def listen():
    port = os.environ.get("PORT", "8090") # 默认使用新项目的 8090 伴生端口
    uri = f"ws://localhost:{port}/ws/events"
    log(f"正在连接到本地事件流 {uri}...")
    
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                log("✅ 已成功连接。正在监听反馈提交事件...")
                while True:
                    msg = await websocket.recv()
                    data = json.loads(msg)
                    if data.get("type") == "feedback_submitted":
                        fb_id = data.get("id")
                        log(f"【感知事件】检测到新反馈 (ID: {fb_id})。正在自动拉取任务...")
                        
                        # 自动运行 pull 脚本将数据库反馈解包为物理 README.md
                        pull_script = os.path.join(WORKSPACE_DIR, "skills", "a_fix_feedback", "scripts", "pull_feedbacks.py")
                        env = os.environ.copy()
                        env["PYTHONPATH"] = ""
                        
                        subprocess.run([sys.executable, pull_script, "pull", "--workspace", WORKSPACE_DIR], env=env)
                        
                        log(f"✅ 任务 #{fb_id} 已拉取并物理化在 feedbacks/incoming。")
                        log("【触发自进化】中转脚本已完成使命，正常退出以激活宿主 IDE 智能体进行物理修改...")
                        sys.exit(0)
        except (websockets.ConnectionClosed, ConnectionRefusedError):
            log("主服务端连接中断，将在 3 秒后重试...")
            await asyncio.sleep(3)
        except SystemExit:
            raise
        except Exception as e:
            log(f"发生异常: {e}，将在 3 秒后重试...")
            await asyncio.sleep(3)

if __name__ == "__main__":
    try:
        asyncio.run(listen())
    except KeyboardInterrupt:
        log("监听器已被用户手动终止。")
        sys.exit(1)
