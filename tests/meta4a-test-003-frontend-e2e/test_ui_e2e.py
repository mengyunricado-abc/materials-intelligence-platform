# -*- coding: utf-8 -*-
# @vibe-intent 编写基于 Playwright 的 Vue 3 前端 E2E 自动化测试用例，校验标题及唤起反馈面板并截图保存。
# @vibe-model Gemini 3.5 Flash (High)
# @vibe-ref intents.md#2026-05-25

import os
import sys
import time
from playwright.sync_api import sync_playwright

TARGET_WEB_URL = os.getenv("TARGET_WEB_URL", "http://host.docker.internal:5173")

def wait_for_web(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            import urllib.request
            res = urllib.request.urlopen(url, timeout=2)
            if res.status == 200:
                print("Nginx Web server or Vite dev server is online!")
                return True
        except Exception:
            pass
        print("Waiting for Nginx web server or Vite dev server...")
        time.sleep(2)
    return False

def test_ui_e2e():
    url = TARGET_WEB_URL
    print(f"Target Web URL: {url}")
    
    if not wait_for_web(url):
        print("Error: Web server did not boot in time.")
        sys.exit(1)
        
    with sync_playwright() as p:
        print("Launching headless Chromium...")
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
        page = browser.new_page()
        
        print(f"Navigating to {url}...")
        page.goto(url)
        
        # 1. 验证标题与基本渲染
        title = page.title()
        print(f"Page title: {title}")
        assert "materials" in title.lower() or "vue" in title.lower() or "meta" in title.lower(), "Page title mismatch"
        
        # 2. 验证 AI 改进抽屉面板激活
        print("Checking Agent Feedback trigger button...")
        page.wait_for_selector(".btn-agent-trigger")
        print("  -> Found agent feedback trigger button.")
        
        # 模拟点击触发
        page.click(".btn-agent-trigger")
        page.wait_for_selector(".feedback-drawer.open")
        print("  -> Successfully triggered and opened feedback drawer.")
        
        # 3. 截图验证
        os.makedirs("/screenshots", exist_ok=True)
        screenshot_path = "/screenshots/materials_feedback_panel.png"
        page.screenshot(path=screenshot_path)
        print(f"Saved E2E UI screenshot to {screenshot_path}")
        
        browser.close()
        print("\n🎉 ALL FRONTEND UI E2E TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        test_ui_e2e()
    except AssertionError as err:
        print(f"❌ UI TEST FAILED: {err}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        sys.exit(1)
