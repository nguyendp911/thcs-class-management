"""Download face-api.js model weights from GitHub to local public/models/ folder"""
import urllib.request
import os
import sys
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

BASE_URL = "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/"
OUTPUT_DIR = "apps/web/public/models"

FILES = [
    # Tiny Face Detector
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    # Face Landmark 68 Tiny
    "face_landmark_68_tiny_model-weights_manifest.json",
    "face_landmark_68_tiny_model-shard1",
    # Face Recognition Net
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
]

os.makedirs(OUTPUT_DIR, exist_ok=True)

for filename in FILES:
    url = BASE_URL + filename
    out_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(out_path):
        print(f"✓ Already exists: {filename}")
        continue
    print(f"⬇️  Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, out_path)
        size = os.path.getsize(out_path)
        print(f"   ✅ {filename} ({size:,} bytes)")
    except Exception as e:
        print(f"   ❌ FAILED: {filename} — {e}")

print("\n✨ Done downloading model weights!")
