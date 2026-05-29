import os
import sys
import time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops

TARGET_WEB_URL = os.getenv("TARGET_WEB_URL", "http://localhost:5173")

def wait_for_server(url, timeout=30):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            import urllib.request
            response = urllib.request.urlopen(url, timeout=2)
            if response.status == 200:
                print(f"[Test Server] 目标服务 {url} 已上线！")
                return True
        except Exception:
            pass
        print(f"[Test Server] 正在等待 Vite 服务 {url} 启动...")
        time.sleep(2)
    return False

def calculate_image_diff(img_path1, img_path2):
    if not os.path.exists(img_path1) or not os.path.exists(img_path2):
        raise FileNotFoundError("进行 Visual Diff 的截图文件缺失！")

    img1 = Image.open(img_path1).convert("RGB")
    img2 = Image.open(img_path2).convert("RGB")

    if img1.size != img2.size:
        raise ValueError(f"截图尺寸不一致: {img1.size} vs {img2.size}")

    diff = ImageChops.difference(img1, img2)
    bbox = diff.getbbox()
    
    if bbox is None:
        return 0.0

    width, height = img1.size
    total_pixels = width * height
    
    diff_pixels = 0
    diff_data = list(diff.getdata())
    for pixel in diff_data:
        if sum(pixel) > 15: # 容忍轻微抗锯齿渲染抖动
            diff_pixels += 1

    diff_ratio = (diff_pixels / total_pixels) * 100
    print(f"[Visual Diff] 检测到像素差异比例: {diff_ratio:.4f}% (差异像素数: {diff_pixels} / 总像素数: {total_pixels})")
    return diff_ratio

def test_ui_and_visual_regression():
    url = TARGET_WEB_URL
    print(f"\n[Test Runner] 正在启动材料智能平台自进化回归测试，目标地址: {url}")
    
    if not wait_for_server(url):
        print(f"[Test Error] 无法在规定时间内建立与服务器 {url} 的连接。")
        sys.exit(1)
        
    screenshots_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "screenshots"))
    os.makedirs(screenshots_dir, exist_ok=True)
    
    before_path = os.path.join(screenshots_dir, "ui_before.png")
    after_path = os.path.join(screenshots_dir, "ui_after.png")

    with sync_playwright() as p:
        print("[Playwright] 正在启动无头 Chromium 浏览器实例...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        # 访问 Vue 应用主页
        page.goto(url)
        # 等待主容器挂载就绪
        page.wait_for_selector("#app")
        # 额外等待 2 秒以确保 Vue Router 加载完毕以及 CSS 动画就绪
        page.wait_for_timeout(2000)
        
        # 功能测试：验证核心 DOM 未完全空白
        app_html = page.locator("#app").inner_html()
        assert len(app_html.strip()) > 0, "回归测试错误: #app 挂载点内容为空，Vue 应用可能加载崩溃！"
        print("[Playwright] ✅ Vue App DOM 存在性与基础渲染校验顺利通过！")
        
        is_modified_run = os.environ.get("IS_MODIFIED_RUN", "0") == "1"
        
        if not is_modified_run:
            page.screenshot(path=before_path)
            print(f"[Playwright] 成功捕获并保存修改前基准截图: {before_path}")
            browser.close()
            return
        else:
            page.screenshot(path=after_path)
            print(f"[Playwright] 成功捕获并保存修改后重构截图: {after_path}")
            browser.close()
            
            # 2. 进行视觉绝对差异比对
            if os.path.exists(before_path):
                diff_ratio = calculate_image_diff(before_path, after_path)
                
                assert diff_ratio > 0.005, "视觉回归错误: 样式修改未在渲染页面上产生任何变化！"
                assert diff_ratio < 2.0, f"视觉回归错误: 像素变化比例过大 ({diff_ratio:.2f}%)，判定为 UI 布局大面积塌陷或错位！"
                print(f"[Visual Regression] ✅ 视觉回归测试 100% 通过！像素差异率 {diff_ratio:.4f}% 符合工业级标准。")
            else:
                print("[Visual Regression] Warning: 未检测到 ui_before.png 基准图，跳过视觉 Visual Diff 对比。")

if __name__ == "__main__":
    try:
        test_ui_and_visual_regression()
        print("\n🎉 ALL E2E FUNCTIONAL AND VISUAL TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
    except AssertionError as err:
        print(f"\n❌ REGRESSION TEST FAILED: {err}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        sys.exit(1)
