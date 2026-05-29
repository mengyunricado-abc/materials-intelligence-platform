import os
import sys
import json
import time
import shutil
import re
import subprocess

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SHADOW_WS_BASE = "/tmp/shadow_ws"

def log(msg):
    print(f"[Host Supervisor] {msg}", flush=True)

class StyleReconstructor:
    """
    自进化语义重构引擎 (AST-like & LLM-driven Reconstructor)
    """
    @staticmethod
    def llm_reconstruct(css_path, readme_path):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            log("⚠️ 未检测到 GEMINI_API_KEY 环境变量，准备降级为静态语义替换...")
            return False
            
        try:
            with open(readme_path, "r", encoding="utf-8") as f:
                feedback_content = f.read()
            with open(css_path, "r", encoding="utf-8") as f:
                css_content = f.read()
                
            log("🤖正在通过 https 协议直连 Google Gemini API 大模型...")
            
            prompt = (
                "你是一个精通 CSS / SCSS 样式重构与 Web 美学的专家级 AI 编程智能体。\n"
                "现在请你根据用户的 UI 改进建议（反馈），对已有的 CSS/SCSS 代码进行增量修改或覆写，生成最新的完整代码。\n\n"
                "【用户反馈的 UI 改进意图】\n"
                f"{feedback_content}\n\n"
                "【已有的代码】\n"
                f"{css_content}\n\n"
                "【修改要求】\n"
                "1. 只返回修改后的、完整的代码内容，严禁包含任何 Markdown 格式包围符（例如 ```css 标签）或多余的解释文字。\n"
                "2. 保证原有选择器的格式、属性缩进及结构尽可能不被破坏。\n"
                "3. 根据用户建议的内容（如渐变、加粗、呼吸灯动画等），为指定元素高保真地添加或覆写样式规则。\n"
            )
            
            import urllib.request
            import json
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "text/plain"
                }
            }
            
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode("utf-8"), 
                headers=headers, 
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                llm_output = res_body["candidates"][0]["content"]["parts"][0]["text"].strip()
                
                if llm_output.startswith("```"):
                    lines = llm_output.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    llm_output = "\n".join(lines).strip()
                
                if not llm_output or "{" not in llm_output:
                    raise ValueError("大模型生成的样式格式不合规")
                    
                with open(css_path, "w", encoding="utf-8") as f:
                    f.write(llm_output)
                    
                log("🚀 Google Gemini 大模型成功对样式代码进行了全自动物理重构与改写！")
                return True
        except Exception as e:
            log(f"⚠️ 大模型调用或解析过程中发生错误 ({e})。自动降级...")
            return False

    @staticmethod
    def extract_feedback_details(readme_path):
        if not os.path.exists(readme_path):
            raise FileNotFoundError(f"未找到反馈文件: {readme_path}")
            
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        selector_match = re.search(r"\[Target Element:\s*([^\]\s]+)\]", content)
        selector = selector_match.group(1) if selector_match else "body"
        
        styles_to_apply = {}
        gradient_match = re.search(r"linear-gradient\([^)]+\)", content)
        if gradient_match:
            styles_to_apply["background"] = f"{gradient_match.group(0)};"
        elif "背景色改成" in content or "背景改成" in content:
            color_match = re.search(r"#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}", content)
            if color_match:
                styles_to_apply["background"] = f"{color_match.group(0)};"
                
        if "加粗" in content or "bold" in content.lower():
            styles_to_apply["font-weight"] = "bold;"
            
        log(f"🧠 语义解析成功。目标元素: {selector}, 拟应用样式: {styles_to_apply}")
        return selector, styles_to_apply

    @staticmethod
    def apply_style_changes(css_path, selector, styles):
        if not os.path.exists(css_path):
            raise FileNotFoundError(f"未找到样式文件: {css_path}")
            
        with open(css_path, "r", encoding="utf-8") as f:
            css_content = f.read()

        escaped_selector = re.escape(selector)
        pattern = re.compile(r"(" + escaped_selector + r"\s*\{)([^}]+)(\})", re.DOTALL)
        match = pattern.search(css_content)
        
        if match:
            header, body, footer = match.groups()
            lines = body.split("\n")
            new_lines = []
            applied_keys = set()
            
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    new_lines.append(line)
                    continue
                
                matched_prop = False
                for key, val in styles.items():
                    if stripped.startswith(f"{key}:") or stripped.startswith(f"{key} "):
                        indent = line[:line.find(stripped)]
                        new_lines.append(f"{indent}{key}: {val}")
                        applied_keys.add(key)
                        matched_prop = True
                        break
                        
                if not matched_prop:
                    new_lines.append(line)
                    
            for key, val in styles.items():
                if key not in applied_keys:
                    indent = "  "
                    new_lines.append(f"{indent}{key}: {val}")
                    
            new_body = "\n".join(new_lines)
            modified_css = css_content.replace(match.group(0), f"{header}{new_body}{footer}")
            with open(css_path, "w", encoding="utf-8") as f:
                f.write(modified_css)
            log(f"✅ 精准修改完成。选择器 {selector} 声明块已写入。")
        else:
            append_content = f"\n\n{selector} {{\n"
            for key, val in styles.items():
                append_content += f"  {key}: {val}\n"
            append_content += "}\n"
            
            with open(css_path, "a", encoding="utf-8") as f:
                f.write(append_content)
            log(f"⚠️ 未在样式表中找到选择器 {selector}，已将新规则追加至底部。")

class ShadowWorkspace:
    """工作区双缓冲影子沙箱管理器"""
    def __init__(self, source_dir):
        self.source_dir = source_dir
        self.shadow_dir = SHADOW_WS_BASE
        
    def clone(self):
        """秒级克隆工作区必要文件到隔离沙箱中"""
        if os.path.exists(self.shadow_dir):
            shutil.rmtree(self.shadow_dir)
        os.makedirs(self.shadow_dir)
        
        # 仅复制前端Vue源码与回归测试核心目录
        dirs_to_copy = ["src", "public", "backend", "tests"]
        files_to_copy = ["requirements.txt", "package.json", "vite.config.ts", "tsconfig.json", "index.html"]
        
        for d in dirs_to_copy:
            src = os.path.join(self.source_dir, d)
            dst = os.path.join(self.shadow_dir, d)
            if os.path.exists(src):
                shutil.copytree(src, dst)
                
        for f in files_to_copy:
            src = os.path.join(self.source_dir, f)
            dst = os.path.join(self.shadow_dir, f)
            if os.path.exists(src):
                shutil.copy2(src, dst)
                
        # 复制 feedbacks/ 物理反馈
        src_fb = os.path.join(self.source_dir, "feedbacks")
        dst_fb = os.path.join(self.shadow_dir, "feedbacks")
        if os.path.exists(src_fb):
            shutil.copytree(src_fb, dst_fb)
            
        log(f"🛡️ 影子沙箱双缓冲克隆成功！路径: {self.shadow_dir}")
        
    def merge_back(self):
        """将沙箱中修改无损的整个 src/ 目录增量同步回主干代码"""
        src_shadow = os.path.join(self.shadow_dir, "src")
        if os.path.exists(src_shadow):
            for root, dirs, files in os.walk(src_shadow):
                for f in files:
                    shadow_file = os.path.join(root, f)
                    rel_path = os.path.relpath(shadow_file, self.shadow_dir)
                    source_file = os.path.join(self.source_dir, rel_path)
                    
                    os.makedirs(os.path.dirname(source_file), exist_ok=True)
                    shutil.copy2(shadow_file, source_file)
                    log(f"🔗 沙箱改动安全合并回主干: {rel_path}")

class HostSupervisor:
    """宿主调度协调器"""
    def __init__(self, workspace_dir):
        self.workspace_dir = workspace_dir
        self.port = int(os.environ.get("PORT", 8090)) # 默认使用伴生端口 8090
        self.listener_process = None

    def run_command_in_shadow(self, cmd, env_vars=None):
        env = os.environ.copy()
        if env_vars:
            env.update(env_vars)
        res = subprocess.run(cmd, cwd=SHADOW_WS_BASE, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return res.returncode, res.stdout.decode("utf-8"), res.stderr.decode("utf-8")

    def find_latest_feedback_id(self):
        incoming_dir = os.path.join(self.workspace_dir, "feedbacks", "incoming")
        if not os.path.exists(incoming_dir):
            return None
            
        ids = []
        for name in os.listdir(incoming_dir):
            if name.startswith("feedback_"):
                try:
                    fb_id = int(name.replace("feedback_", ""))
                    ids.append(fb_id)
                except ValueError:
                    continue
        return max(ids) if ids else None

    def trigger_evolution_lifecycle(self, fb_id):
        log(f"⚡ 开始启动自进化任务 #{fb_id}...")
        
        # 1. 建立影子沙箱工作区
        shadow = ShadowWorkspace(self.workspace_dir)
        shadow.clone()
        
        # 2. 物理重构
        readme_path = os.path.join(SHADOW_WS_BASE, "feedbacks", "incoming", f"feedback_{fb_id}", "README.md")
        # 默认寻找全局样式表进行改写
        css_path = os.path.join(SHADOW_WS_BASE, "src", "styles", "main.scss")
        if not os.path.exists(css_path):
            # 兼容：如果不存在 main.scss，尝试寻找其他 css
            os.makedirs(os.path.dirname(css_path), exist_ok=True)
            with open(css_path, "w") as f:
                f.write("/* Auto-generated for self-evolution */\n")
        
        try:
            llm_success = StyleReconstructor.llm_reconstruct(css_path, readme_path)
            if not llm_success:
                selector, styles = StyleReconstructor.extract_feedback_details(readme_path)
                StyleReconstructor.apply_style_changes(css_path, selector, styles)
        except Exception as e:
            log(f"❌ 代码重构阶段失败: {e}")
            return False

        # 3. 运行视觉/功能回归测试
        log("🧪 回归测试阶段 A: 建立修改前的功能与页面视觉基准...")
        temp_css = css_path + ".temp"
        shutil.copy2(css_path, temp_css)
        
        # 还原物理层原本 css 跑 before
        orig_css = os.path.join(self.workspace_dir, "src", "styles", "main.scss")
        if os.path.exists(orig_css):
            shutil.copy2(orig_css, css_path)
            
        ret, out, err = self.run_command_in_shadow([sys.executable, "tests/test_visual_regression.py"], 
                                                   env_vars={"TARGET_WEB_URL": "http://localhost:5173", "IS_MODIFIED_RUN": "0"})
        if ret != 0:
            log(f"❌ 回归测试阶段 A 失败，无法生成基准页面: {err or out}")
            return False
            
        # 恢复修改后 css 跑 after
        log("🧪 回归测试阶段 B: 正在沙箱内运行功能与视觉 Visual Diff 综合对比...")
        shutil.move(temp_css, css_path)
        
        ret, out, err = self.run_command_in_shadow([sys.executable, "tests/test_visual_regression.py"], 
                                                   env_vars={"TARGET_WEB_URL": "http://localhost:5173", "IS_MODIFIED_RUN": "1"})
        
        print("-" * 50, flush=True)
        print(out, flush=True)
        if err:
            print(err, file=sys.stderr, flush=True)
        print("-" * 50, flush=True)
        
        if ret != 0:
            log("❌ 回归测试或视觉像素比对未 100% 通过！自进化已被安全阻断并回滚。")
            return False
            
        log("🎉 功能测试与 2% 图像视觉 Diff 双重校验 100% 通过！")
        
        # 4. 合并
        shadow.merge_back()
        
        # 5. 结单与 WS 广播
        log(f"⚡ 正在标记任务 #{fb_id} 为成功结单并进行 WS 广播...")
        pull_script = os.path.join(self.workspace_dir, "skills", "a_fix_feedback", "scripts", "pull_feedbacks.py")
        
        subprocess.run([sys.executable, pull_script, "done", "--workspace", self.workspace_dir, "--id", str(fb_id), "--port", str(self.port)])
        
        log(f"✅ 自进化任务 #{fb_id} 完美结单发布！")
        return True

    def start_realtime_listener(self):
        listener_script = os.path.join(self.workspace_dir, "skills", "a_fix_feedback", "scripts", "realtime_listener.py")
        env = os.environ.copy()
        env["PORT"] = str(self.port)
        
        log(f"正在拉起感知进程 realtime_listener.py (监听端口 {self.port})...")
        self.listener_process = subprocess.Popen([sys.executable, listener_script], env=env)
        log(f"已拉起，感知进程 PID: {self.listener_process.pid}")

    def start(self):
        log("=========================================")
        log("🛡️ Materials Intelligence Evolution OS 调度协调服务启动...")
        log(f"工作区: {self.workspace_dir}")
        log(f"监控伴生服务端口: {self.port}")
        log("=========================================")
        
        self.start_realtime_listener()
        
        try:
            while True:
                ret_code = self.listener_process.poll()
                if ret_code is not None:
                    if ret_code == 0:
                        log("🔥 【感知事件拦截】监听器检测到新提反馈，自动拉取任务并安全退出！")
                        fb_id = self.find_latest_feedback_id()
                        if fb_id is not None:
                            self.trigger_evolution_lifecycle(fb_id)
                        else:
                            log("Warning: 监听器退出，但 feedbacks/incoming 目录中未找到任何新反馈。")
                    else:
                        log(f"Warning: 监听器异常退出，退出码: {ret_code}。3 秒后重新拉起...")
                        time.sleep(3)
                        
                    self.start_realtime_listener()
                    
                time.sleep(1)
        except KeyboardInterrupt:
            log("收到中断信号，正在退出调度服务并关闭子进程...")
            if self.listener_process:
                self.listener_process.kill()
            sys.exit(0)

if __name__ == "__main__":
    supervisor = HostSupervisor(WORKSPACE_DIR)
    supervisor.start()
