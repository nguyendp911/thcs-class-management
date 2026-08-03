import os
import subprocess
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

print("==========================================================")
print("🚀 HỆ THỐNG TỰ ĐỘNG BUILD & UPLOAD LÊN HOST VIE.INFO.VN")
print("==========================================================")

try:
    print("\n1. 🛠️ Biên dịch giao diện Web (npm --prefix apps/web run build)...")
    subprocess.run(["npm", "--prefix", "apps/web", "run", "build"], cwd=ROOT_DIR, check=True, shell=True)

    print("\n2. 📦 Đồng bộ tệp tin build vào thư mục gốc...")
    cmd = "Copy-Item -Path 'apps/web/dist/*' -Destination '.' -Recurse -Force"
    subprocess.run(["powershell", "-Command", cmd], cwd=ROOT_DIR, check=True, shell=True)

    print("\n3. ⚡ Upload trực tiếp lên FTP Host thcs@vie.info.vn...")
    subprocess.run([sys.executable, "deploy_to_thcs_host.py"], cwd=ROOT_DIR, check=True)

    print("\n🎉 HOÀN THÀNH TẤT CẢ TIẾN TRÌNH UPLOAD LÊN HOST!")
    print("🔗 Địa chỉ website: https://vie.info.vn/thcs/")

except Exception as e:
    print(f"\n❌ Lỗi trong quá trình upload: {e}")
    sys.exit(1)
