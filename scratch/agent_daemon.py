# -*- coding: utf-8 -*-
"""
  @vibe-intent 编写自进化代码修改守护进程，实现自动监听 feedback_requests.json 变化，解析目标元素选择器，并在 global.scss 自动追加样式重构，再向 FastAPI 发送处理通知以广播 WS 完成闭环。
  @vibe-model Gemini 3.5 Flash (High)
  @vibe-ref intents.md#2026-05-25
"""

import os
import time
import json
import re
import urllib.request
import sys

# ==================== Windows Unicode Print Patch ====================
# 解决 Windows 默认 GBK 终端下 print 带有 Emoji 字符时抛出 UnicodeEncodeError 导致崩溃退出问题
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
# ======================================================================

# 路径定位
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEEDBACK_FILE = os.path.join(BASE_DIR, "feedback_requests.json")
SCSS_FILE = os.path.join(BASE_DIR, "frontend", "src", "styles", "global.scss")
PROCESSED_URL = "http://localhost:8000/api/feedback/{feedback_id}/processed"

print("="*60)
print("🤖 Materials Platform - Agent 页面代码自进化守护进程启动成功！")
print(f"📁 正在监听反馈数据库: {FEEDBACK_FILE}")
print(f"🎨 自动样式重构文件: {SCSS_FILE}")
print("="*60)

def process_single_feedback(fb):
    fb_id = fb.get("id")
    category = fb.get("category")
    content = fb.get("content", "")
    
    print(f"\n[GET] 侦测到全新自进化任务 #{fb_id} [改进类型: {category}]")
    
    # 1. 尝试从内容提取目标 CSS 选择器
    match = re.match(r"^\[Target Element:\s*(.*?)\]\n*(.*)$", content, re.DOTALL)
    if not match:
        print("  -> 提示: 反馈未包含具体网页元素选择器，进入常规建议归档。")
        mark_processed_on_backend(fb_id)
        return
        
    selector = match.group(1).strip()
    user_request = match.group(2).strip()
    print(f"  🎯 目标元素物理选择器: {selector}")
    print(f"  ✍️ 用户重构修改描述: {user_request}")
    
    # 2. 如果是界面重构类型，我们实现真实的“样式自进化修改”！
    if category == "ui_style":
        print("  ⚡ 正在进行 AI 自动样式重构设计...")
        
        # 极简智能匹配机制：比如用户说“改成红色”、“改背景为紫色”、“边框变成虚线”等
        style_rule = ""
        request_lower = user_request.lower()
        
        if "紫色" in request_lower or "purple" in request_lower:
            style_rule = "background: linear-gradient(135deg, #7c3aed, #c084fc) !important; color: white !important;"
        elif "红色" in request_lower or "red" in request_lower:
            style_rule = "background-color: #ef4444 !important; color: white !important;"
        elif "蓝色" in request_lower or "blue" in request_lower:
            style_rule = "background-color: #3b82f6 !important; color: white !important;"
        elif "绿色" in request_lower or "green" in request_lower:
            style_rule = "background-color: #22c55e !important; color: white !important;"
        elif "隐藏" in request_lower or "hide" in request_lower:
            style_rule = "display: none !important;"
        elif "圆角" in request_lower or "rounded" in request_lower:
            style_rule = "border-radius: 20px !important;"
        elif "阴影" in request_lower or "shadow" in request_lower:
            style_rule = "box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;"
        else:
            # 默认兜底：给元素添加一个高对比度的霓虹发光框
            style_rule = "border: 2px solid #00d2ff !important; box-shadow: 0 0 15px #00d2ff !important;"
            
        if style_rule:
            scss_append = f"\n\n/* ==================== AI 自进化重构 #{fb_id} ==================== */\n{selector} {{\n  {style_rule}\n}}"
            try:
                with open(SCSS_FILE, "a", encoding="utf-8") as f:
                    f.write(scss_append)
                print(f"  🎨 [SUCCESS] 已将自重构规则成功注入 global.scss，触发 Vite HMR 毫秒级热更新！")
            except Exception as ex:
                print(f"  ❌ 写入 global.scss 失败: {ex}")
                
    # 3. 反馈通知给 FastAPI，让后端广播 WebSocket 通知给前端弹出 Toast 吐司！
    mark_processed_on_backend(fb_id)

def mark_processed_on_backend(fb_id):
    url = PROCESSED_URL.format(feedback_id=fb_id)
    try:
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            if res_data.get("status") == "success":
                print(f"  🚀 [SUCCESS] 任务 #{fb_id} 已成功标记为 Processed，完成 WebSocket 热部署广播！")
            else:
                print(f"  ⚠️ 后端回馈提示异常: {res_data.get('message')}")
    except Exception as e:
        print(f"  ❌ 向后端回馈已处理状态失败: {e} (请确保 FastAPI 后端 main.py 正在运行于 8000 端口)")

def main_loop():
    last_processed_ids = set()
    
    # 首次启动，先加载已处理的历史以防重复运行
    initial_fbs = []
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                initial_fbs = json.load(f)
        except Exception:
            pass
            
    for fb in initial_fbs:
        if fb.get("processed"):
            last_processed_ids.add(fb.get("id"))
            
    print(f"  -> 已成功加载先前处理的 {len(last_processed_ids)} 个历史记录。")
    print("🤖 守护进程进入秒级秒轮询状态，开始倾听用户修改建议...")
    
    while True:
        if os.path.exists(FEEDBACK_FILE):
            fbs = []
            try:
                with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                    fbs = json.load(f)
            except Exception:
                pass
                
            # 从旧到新依次处理未处理的
            for fb in reversed(fbs):
                fb_id = fb.get("id")
                is_processed = fb.get("processed", False)
                
                if not is_processed and fb_id not in last_processed_ids:
                    try:
                        process_single_feedback(fb)
                    except Exception as e:
                        print(f"  ❌ 处理任务失败: {e}")
                    last_processed_ids.add(fb_id)
                    
        time.sleep(1)

if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print("\n👋 守护进程已安全退出。")
