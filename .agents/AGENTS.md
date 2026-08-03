# CẤU HÌNH QUY TẮC TỰ ĐỘNG HÓA DỰ ÁN (PROJECT RULES)

## Quy Tắc Tự Động Git & Deploy Sau Mỗi Cập Nhật Code:
1. **Kiểm Trả Lỗi Code**: Sau khi hoàn thành hoặc sửa đổi tính năng, phải chạy lệnh `npm run build` để xác minh không có lỗi compile/TypeScript.
2. **Tự Động Push Git**: Mỗi khi code được kiểm tra thành công không có lỗi, TỰ ĐỘNG thực hiện các bước:
   - `git add .`
   - `git commit -m "<Mô tả ngắn gọn công việc đã hoàn thành>"`
   - `git push origin main` (Đến repo `https://github.com/nguyendp911/thcs-class-management.git`).
3. **Tự Động Upload Host**: Sau khi push Git thành công, TỰ ĐỘNG chạy `python upload.py` để cập nhật trực tiếp phiên bản mới nhất lên live site `https://vie.info.vn/thcs/`.
4. Không hỏi xác nhận lại với người dùng cho các bước Git Push và Deploy này.
