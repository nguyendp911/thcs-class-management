from ftplib import FTP
import urllib.request
import io
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. Upload do_deploy.php script to FTP
php_deploy_script = """<?php
header('Content-Type: text/plain; charset=utf-8');
echo "🚀 STARTING LIVE DEPLOYMENT TO /public_html/thcs/...\\n";

$src_dir = __DIR__ . '/thcs_build';
$dst_dir = '/home/kjioxydi/domains/vie.info.vn/public_html/thcs';

if (!file_exists($src_dir)) {
    die("❌ Source directory thcs_build not found!");
}

if (!file_exists($dst_dir)) {
    mkdir($dst_dir, 0777, true);
}

function copy_recursive($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst, 0777, true);
    $copied = 0;
    while (($file = readdir($dir)) !== false) {
        if ($file === '.' || $file === '..') continue;
        $src_file = $src . '/' . $file;
        $dst_file = $dst . '/' . $file;
        if (is_dir($src_file)) {
            $copied += copy_recursive($src_file, $dst_file);
        } else {
            if (copy($src_file, $dst_file)) {
                $copied++;
                echo "   ✅ Copied: " . str_replace('/home/kjioxydi/domains/vie.info.vn/public_html/thcs', '', $dst_file) . "\\n";
            } else {
                echo "   ❌ Failed to copy: $dst_file\\n";
            }
        }
    }
    closedir($dir);
    return $copied;
}

$count = copy_recursive($src_dir, $dst_dir);
echo "\\n🎉 LIVE DEPLOYMENT COMPLETE! Total $count files copied to /public_html/thcs/\\n";
?>"""

ftp = FTP('free02.123host.vn', timeout=15)
ftp.login('nguyendp9292@vie.info.vn', '123456')
ftp.set_pasv(True)

ftp.storbinary('STOR do_deploy.php', io.BytesIO(php_deploy_script.encode('utf-8')))

LOCAL_ROOT = os.path.abspath(os.path.dirname(__file__))
ITEMS_TO_UPLOAD = [
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

def ensure_remote_dir(remote_dir):
    dirs = [d for d in remote_dir.strip('/').split('/') if d]
    current = ''
    for d in dirs:
        current += '/' + d if current else d
        try:
            ftp.mkd(current)
        except Exception:
            pass

def upload_file(local_path, remote_path):
    remote_dir = os.path.dirname(remote_path).replace('\\', '/')
    if remote_dir:
        ensure_remote_dir(remote_dir)
    rem_path = remote_path.replace('\\', '/')
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {rem_path}', f)

def upload_dir_recursive(local_dir, remote_dir):
    ensure_remote_dir(remote_dir)
    for root, dirs, files in os.walk(local_dir):
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'vendor', '__pycache__', 'storage']]
        for file in files:
            if file.endswith('.zip') or file.endswith('.log') or file in ['upload_to_host.py', 'sync_to_live.py', 'check_server.py']:
                continue
            local_file = os.path.join(root, file)
            rel_path = os.path.relpath(local_file, local_dir)
            remote_file = os.path.join(remote_dir, rel_path).replace('\\', '/')
            upload_file(local_file, remote_file)

print("📦 Uploading release build to temporary thcs_build folder on FTP...")
for item in ITEMS_TO_UPLOAD:
    local_path = os.path.join(LOCAL_ROOT, item)
    if not os.path.exists(local_path):
        continue
    remote_path = os.path.join('thcs_build', item).replace('\\', '/')
    if os.path.isdir(local_path):
        upload_dir_recursive(local_path, remote_path)
    else:
        upload_file(local_path, remote_path)

ftp.quit()
print("✅ Uploaded release build to FTP. Triggering PHP live deployer...")

# 2. Trigger PHP live deployer
url = 'https://vie.info.vn/download/do_deploy.php'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req).read().decode('utf-8')
print("\n--- PHP LIVE DEPLOYER OUTPUT ---")
print(res)

# 3. Trigger remote database setup
print("\n⚙️ Executing remote setup_db.php...")
try:
    setup_url = 'https://vie.info.vn/thcs/setup_db.php'
    req_db = urllib.request.Request(setup_url, headers={'User-Agent': 'Mozilla/5.0'})
    res_db = urllib.request.urlopen(req_db).read().decode('utf-8')
    print("✅ DB Setup output:")
    print(res_db[:300])
except Exception as e:
    print(f"Note DB Setup: {e}")

print("\n🎉 LIVE DEPLOYMENT TO https://vie.info.vn/thcs/ COMPLETED SUCCESSFULLY!")
