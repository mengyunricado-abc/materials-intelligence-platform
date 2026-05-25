import os
import sys
import ctypes

try:
    # 动态拼接 Anaconda Library/bin 下的 OpenSSL DLL 绝对路径
    libcrypto_path = os.path.join(sys.prefix, "Library", "bin", "libcrypto-1_1-x64.dll")
    libssl_path = os.path.join(sys.prefix, "Library", "bin", "libssl-1_1-x64.dll")
    
    if os.path.exists(libcrypto_path) and os.path.exists(libssl_path):
        # 显式使用 ctypes 载入内存，锁定依赖
        ctypes.CDLL(libcrypto_path)
        ctypes.CDLL(libssl_path)
        print("SUCCESS: Explicitly loaded libcrypto and libssl via ctypes.")
    else:
        print("FAILED: One or both DLLs do not exist in Library/bin.")
except Exception as e:
    print(f"Exception while loading DLLs via ctypes: {e}")

try:
    import _ssl
    print("SUCCESS: imported _ssl")
except ImportError as e:
    print(f"FAILED to import _ssl: {e}")
