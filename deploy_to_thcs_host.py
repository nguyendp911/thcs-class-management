import os
import sys
from ftplib import FTP, error_perm
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

FTP_HOSTS = ['free02.123host.vn', 'vie.info.vn', '103.200.20.12']
FTP_USER = 'thcs@vie.info.vn'
FTP_PASS = 'nguyendp'
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
    'api',
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
            if file.endswith('.zip') or file.endswith('.log') or file.endswith('.py'):
                continue
            local_file = os.path.join(root, file)
            rel_path = os.path.relpath(local_file, local_dir_path)
            remote_file = os.path.join(remote_dir_path, rel_path).replace('\\', '/')
            upload_file(ftp, local_file, remote_file)

def clear_current_remote_directory(ftp):
    for entry in ftp.nlst():
        name = entry.replace('\\', '/').rstrip('/').rsplit('/', 1)[-1]
        if name in ('', '.', '..'):
            continue
        try:
            ftp.delete(name)
        except error_perm:
            ftp.cwd(name)
            clear_current_remote_directory(ftp)
            ftp.cwd('..')
            ftp.rmd(name)

def clear_remote_assets(ftp):
    """Remove stale generated bundles without touching anything outside assets/."""
    original_dir = ftp.pwd()
    try:
        ftp.cwd('assets')
    except error_perm as exc:
        if str(exc).startswith('550'):
            return
        raise
    try:
        clear_current_remote_directory(ftp)
    finally:
        ftp.cwd(original_dir)

def main():
    ftp = None
    for attempt in range(3):
        for host in FTP_HOSTS:
            print(f"⚡ Attempt {attempt+1}: Connecting to FTP host {host} with user {FTP_USER}...")
            try:
                temp_ftp = FTP(host, timeout=15)
                temp_ftp.login(FTP_USER, FTP_PASS)
                temp_ftp.set_pasv(True)
                ftp = temp_ftp
                print(f"✅ Connected & Logged in to {host}!")
                break
            except Exception as e:
                print(f"⚠️ Could not connect to {host}: {e}")
        if ftp:
            break

    if not ftp:
        print("❌ All FTP connections failed.")
        sys.exit(1)

    try:
        print(f"\n📦 Starting upload directly to FTP root (/home/kjioxydi/public_html/thcs/)...")
        clear_remote_assets(ftp)
        for item in ITEMS_TO_UPLOAD:
            local_path = os.path.join(LOCAL_ROOT, item)
            if not os.path.exists(local_path):
                continue
            
            remote_path = item.replace('\\', '/')
            if os.path.isdir(local_path):
                upload_directory_recursive(ftp, local_path, remote_path)
            else:
                upload_file(ftp, local_path, remote_path)

        ftp.quit()
        print(f"\n✨ UPLOAD COMPLETE: Successfully uploaded {uploaded_count} files to host!")

        print("\n🎉 ALL DEPLOYMENT STEPS COMPLETED SUCCESSFULLY!")
        print("🔗 Live URL: https://vie.info.vn/thcs/")

    except Exception as e:
        print(f"❌ Error during upload: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
