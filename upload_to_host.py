import os
import sys
import json
from ftplib import FTP, error_perm
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

FTP_HOSTS = ['free02.123host.vn', '103.200.20.12', '103.97.126.17', 'vie.info.vn']
FTP_USER = 'nguyendp9292@vie.info.vn'
FTP_PASS = '123456'
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

uploaded_count = 0

def ensure_remote_dir(ftp, remote_dir):
    if not remote_dir or remote_dir == '/':
        return
    dirs = [d for d in remote_dir.strip('/').split('/') if d]
    current = ''
    for d in dirs:
        current += '/' + d if current else d
        try:
            ftp.mkd(current)
        except error_perm as e:
            if not str(e).startswith('550'):
                pass

def upload_file(ftp, local_file_path, remote_file_path):
    global uploaded_count
    remote_dir = os.path.dirname(remote_file_path).replace('\\', '/')
    if remote_dir:
        ensure_remote_dir(ftp, remote_dir)
    
    rem_path = remote_file_path.replace('\\', '/')
    print(f"🚀 Uploading: {rem_path}")
    with open(local_file_path, 'rb') as f:
        ftp.storbinary(f'STOR {rem_path}', f)
    uploaded_count += 1

def upload_directory_recursive(ftp, local_dir_path, remote_dir_path):
    ensure_remote_dir(ftp, remote_dir_path)
    for root, dirs, files in os.walk(local_dir_path):
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'vendor', '__pycache__', 'storage']]
        for file in files:
            if file.endswith('.zip') or file.endswith('.log') or file == 'upload_to_host.py':
                continue
            local_file = os.path.join(root, file)
            rel_path = os.path.relpath(local_file, local_dir_path)
            remote_file = os.path.join(remote_dir_path, rel_path).replace('\\', '/')
            upload_file(ftp, local_file, remote_file)

def upload_all_to_target(ftp, target_base_dir):
    print(f"\n📦 Starting upload to target directory '{target_base_dir or '/'}' on host...")
    for item in ITEMS_TO_UPLOAD:
        local_path = os.path.join(LOCAL_ROOT, item)
        if not os.path.exists(local_path):
            continue
        
        remote_path = os.path.join(target_base_dir, item).replace('\\', '/') if target_base_dir else item
        
        if os.path.isdir(local_path):
            upload_directory_recursive(ftp, local_path, remote_path)
        else:
            upload_file(ftp, local_path, remote_path)

def main():
    ftp = None
    connected_host = None
    for host in FTP_HOSTS:
        print(f"⚡ Connecting to FTP host {host}...")
        try:
            ftp = FTP(host, timeout=15)
            ftp.login(FTP_USER, FTP_PASS)
            ftp.set_pasv(True)
            connected_host = host
            print(f"✅ Connected & Logged in to {host}!")
            break
        except Exception as e:
            print(f"⚠️ Failed to connect {host}: {e}")
    
    if not ftp:
        print("❌ All FTP connections failed.")
        sys.exit(1)
        
    try:
        # 1. Upload to FTP Root /
        upload_all_to_target(ftp, '')
        
        # 2. Upload to FTP /thcs/
        upload_all_to_target(ftp, 'thcs')
                
        ftp.quit()
        print(f"\n✨ UPLOAD SUMMARY: Successfully uploaded {uploaded_count} files to host!")
        
        print("\n⚙️ Triggering remote database setup (setup_db.php)...")
        setup_urls = [
            f"https://vie.info.vn/thcs/setup_db.php",
            f"https://vie.info.vn/setup_db.php"
        ]
        for url in setup_urls:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_text = response.read().decode('utf-8')
                    print(f"✅ Remote DB Setup Response from {url}:\n{res_text[:300]}")
                    break
            except Exception as e:
                print(f"  Note: {url} call: {e}")
                
        print("\n🎉 ALL DEPLOYMENT STEPS COMPLETED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ Error during upload: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
