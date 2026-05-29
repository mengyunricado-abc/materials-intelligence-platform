import os
import sys
import argparse
import sqlite3
import json
import base64
import urllib.request
import urllib.error
import shutil

def get_db_path(workspace):
    return os.path.join(workspace, "backend", "evolution.db")

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def handle_pull(args):
    workspace = os.path.abspath(args.workspace)
    db_path = get_db_path(workspace)
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}. Please run FastAPI backend first to create it.")
        sys.exit(1)
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 查询所有未处理的反馈
        cursor.execute("SELECT id, category, content, screenshots_json FROM feedbacks WHERE processed = 0")
        rows = cursor.fetchall()
        
        if not rows:
            print("No pending feedbacks found.")
            return
            
        incoming_base = os.path.join(workspace, "feedbacks", "incoming")
        ensure_dir(incoming_base)
        
        pulled_count = 0
        for row in rows:
            fb_id, category, content, screenshots_json = row
            fb_dir = os.path.join(incoming_base, f"feedback_{fb_id}")
            ensure_dir(fb_dir)
            
            # 1. 写入任务描述文件 README.md
            readme_path = os.path.join(fb_dir, "README.md")
            with open(readme_path, "w", encoding="utf-8") as f:
                f.write(f"# Feedback Task #{fb_id}\n\n")
                f.write(f"- **Category**: {category}\n")
                f.write(f"- **Status**: Pending\n\n")
                f.write(f"## Description\n\n{content}\n")
            
            # 2. 解码并存储截图
            try:
                screenshots = json.loads(screenshots_json) if screenshots_json else []
                for idx, screenshot_data in enumerate(screenshots):
                    if "," in screenshot_data:
                        # 剔除 data:image/png;base64, 等头部
                        _, base64_str = screenshot_data.split(",", 1)
                    else:
                        base64_str = screenshot_data
                        
                    img_bytes = base64.b64decode(base64_str)
                    img_path = os.path.join(fb_dir, f"screenshot_{idx}.png")
                    with open(img_path, "wb") as img_f:
                        img_f.write(img_bytes)
            except Exception as e:
                print(f"Warning: Failed to extract screenshots for feedback #{fb_id}: {e}")
                
            print(f"Pulled feedback #{fb_id} into {fb_dir}")
            pulled_count += 1
            
        print(f"Successfully pulled {pulled_count} feedback tasks.")
    finally:
        conn.close()

def handle_done(args):
    workspace = os.path.abspath(args.workspace)
    fb_id = args.id
    db_path = get_db_path(workspace)
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}.")
        sys.exit(1)
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. 更新本地 SQLite 数据库状态
        cursor.execute("SELECT id, processed FROM feedbacks WHERE id = ?", (fb_id,))
        row = cursor.fetchone()
        if not row:
            print(f"Error: Feedback #{fb_id} not found in database.")
            sys.exit(1)
            
        cursor.execute("UPDATE feedbacks SET processed = 1 WHERE id = ?", (fb_id,))
        conn.commit()
        print(f"Updated SQLite Database status for feedback #{fb_id} (processed=1)")
        
        # 2. 搬移物理文件夹从 incoming/ 到 done/
        incoming_dir = os.path.join(workspace, "feedbacks", "incoming", f"feedback_{fb_id}")
        done_base = os.path.join(workspace, "feedbacks", "done")
        done_dir = os.path.join(done_base, f"feedback_{fb_id}")
        
        ensure_dir(done_base)
        
        if os.path.exists(incoming_dir):
            if os.path.exists(done_dir):
                shutil.rmtree(done_dir)
            shutil.move(incoming_dir, done_dir)
            print(f"Moved directory {incoming_dir} to {done_dir}")
        else:
            print(f"Warning: Physical task folder not found at {incoming_dir}")
            
        # 3. 呼叫 FastAPI 接口触发 WebSocket 广播
        port = getattr(args, "port", 8000)
        url = f"http://localhost:{port}/api/feedback/{fb_id}/processed"
        print(f"Calling FastAPI notification endpoint: {url}")
        try:
            req = urllib.request.Request(url, method="POST")
            with urllib.request.urlopen(req) as response:
                res_body = response.read().decode("utf-8")
                print(f"FastAPI Response: {res_body}")
        except urllib.error.URLError as e:
            print(f"Warning: Failed to call FastAPI webhook: {e}. (This is normal if FastAPI server is running offline or on a different port)")
            print("The database state was updated, but you may need to reload the webpage manually if WS was not triggered.")
            
        print(f"Feedback #{fb_id} successfully finalized.")
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description="Skill CLI for sync feedback database with physical workspace files.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # pull 子命令
    pull_parser = subparsers.add_parser("pull", help="Pull pending feedbacks from database to files.")
    pull_parser.add_argument("--workspace", required=True, help="Absolute path to workspace directory.")
    
    # done 子命令
    done_parser = subparsers.add_parser("done", help="Mark feedback as processed and move folders.")
    done_parser.add_argument("--workspace", required=True, help="Absolute path to workspace directory.")
    done_parser.add_argument("--id", type=int, required=True, help="ID of the feedback to resolve.")
    done_parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)), help="Port of the FastAPI backend server.")
    
    args = parser.parse_args()
    
    if args.command == "pull":
        handle_pull(args)
    elif args.command == "done":
        handle_done(args)

if __name__ == "__main__":
    main()
