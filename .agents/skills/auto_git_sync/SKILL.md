---
name: auto_git_sync
description: Tự động kiểm tra build, commit và push mã nguồn lên GitHub repository cũng như upload lên Host mỗi khi sửa đổi/cập nhật tính năng thành công không phát sinh lỗi.
---

# Skill: Auto Git & Host Sync

## Quy trình thực hiện tự động sau khi sửa code:

1. **Kiểm tra Build & Type Check**:
   - Chạy lệnh build kiểm tra lỗi: `npm run build` (hoặc lệnh test tương ứng).
   - Đảm bảo ứng dụng không có lỗi syntax, lint hay type error.

2. **Tự động Commit & Push Git**:
   - Thực hiện `git add .`
   - Thực hiện `git commit -m "[Mô tả thay đổi tính năng rõ ràng]"`
   - Thực hiện `git push origin main` (hoặc dùng đường dẫn `C:\Program Files\Git\cmd\git.exe` nếu PATH chưa được load).
   - Repo đích: `https://github.com/nguyendp911/thcs-class-management.git`

3. **Tự động Upload Host**:
   - Thực hiện `python upload.py` để đồng bộ tệp tin mới nhất lên Web Host `https://vie.info.vn/thcs/`.
