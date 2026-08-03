import os
import sys
import zipfile
from ftplib import FTP
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LOCAL_ROOT = os.path.abspath(os.path.dirname(__file__))
ZIP_PATH = os.path.join(LOCAL_ROOT, 'deploy.zip')

ITEMS_TO_ZIP = [
    'index.html',
    'assets',
    '.htaccess',
    'schema.sql',
    'setup_db.php',
    'favicon.png',
    'favicon.svg',
    'icons.svg',
    'logo.png',
    os.path.join('apps', 'api'),
]

# 1. Create clean deploy.zip
print("📦 Creating deploy.zip package...")
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)

with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as z:
    for item in ITEMS_TO_ZIP:
        local_path = os.path.join(LOCAL_ROOT, item)
        if not os.path.exists(local_path):
            continue
        if os.path.isdir(local_path):
            for root, dirs, files in os.walk(local_path):
                dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'vendor', '__pycache__', 'storage']]
                for file in files:
                    if file.endswith('.zip') or file.endswith('.log'):
                        continue
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, LOCAL_ROOT)
                    z.write(full_p, rel_p)
        else:
            z.write(local_path, item)

zip_size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
print(f"✅ Created deploy.zip ({zip_size_mb:.2f} MB)")

# 2. Prepare PHP unzip script
unzip_php = """<?php
header('Content-Type: text/plain; charset=utf-8');
echo "🚀 UNZIPPING DEPLOYMENT TO /public_html/thcs/\\n";

$zip_file = __DIR__ . '/deploy.zip';
$target_dir = '/home/kjioxydi/domains/vie.info.vn/public_html/thcs';

if (!file_exists($zip_file)) {
    die("❌ deploy.zip not found!");
}

if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$zip = new ZipArchive();
if ($zip->open($zip_file) === TRUE) {
    $zip->extractTo($target_dir);
    $zip->close();
    echo "✅ Successfully extracted deploy.zip into $target_dir\\n";
    @unlink($zip_file);
} else {
    echo "❌ Failed to open zip file\\n";
}
?>"""

# 3. Upload deploy.zip and unzip_live.php via FTP
FTP_HOSTS = ['free02.123host.vn', 'vie.info.vn', '103.200.20.12']

ftp = None
for attempt in range(5):
    for host in FTP_HOSTS:
        print(f"⚡ Attempt {attempt+1}: Connecting to FTP host {host}...")
        try:
            temp_ftp = FTP(host, timeout=15)
            temp_ftp.login('nguyendp9292@vie.info.vn', '123456')
            temp_ftp.set_pasv(True)
            ftp = temp_ftp
            print(f"✅ Connected & Logged in to {host}!")
            break
        except Exception as e:
            print(f"⚠️ Failed to connect {host}: {e}")
    if ftp:
        break

if not ftp:
    print("❌ All FTP connection attempts failed.")
    sys.exit(1)

import io
print("🚀 Uploading unzip_live.php...")
ftp.storbinary('STOR unzip_live.php', io.BytesIO(unzip_php.encode('utf-8')))

print(f"🚀 Uploading deploy.zip ({zip_size_mb:.2f} MB)...")
with open(ZIP_PATH, 'rb') as f:
    ftp.storbinary('STOR deploy.zip', f)

ftp.quit()
print("✅ FTP Upload Complete!")

# 4. Trigger PHP extraction
print("\n⚡ Triggering PHP remote extraction...")
try:
    url = 'https://vie.info.vn/download/unzip_live.php'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, timeout=15).read().decode('utf-8')
    print("--- UNZIP RESPONSE ---")
    print(res)
except Exception as e:
    print(f"❌ Unzip trigger error: {e}")

print("\n🎉 ALL STEPS COMPLETED! Check site at: https://vie.info.vn/thcs/")
