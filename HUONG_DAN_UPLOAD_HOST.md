# 📖 HƯỚNG DẪN BẢO TRÌ & UPLOAD ỨNG DỤNG LÊN HOST VIE.INFO.VN

---

## 🚀 Cách Upload nhanh lên Host (Chỉ 1 thao tác)

### Cách 1: Chạy lệnh Python (Khuyên dùng)
Mở Terminal tại thư mục dự án và chạy:
```bash
python upload.py
```
*Script sẽ tự động:*
1. Biên dịch ứng dụng React mới nhất (`npm --prefix apps/web run build`).
2. Đồng bộ các file `dist` vào root.
3. Đẩy 33 file mới nhất qua FTP trực tiếp vào `/home/kjioxydi/public_html/thcs/` mà **KHÔNG BAO GIỜ XÓA DATABASE**.

### Cách 2: Double-click file batch
Nhấp đúp chuột vào tệp: **`deploy.bat`**

---

## 🔑 Thông tin Tài khoản Hosting & FTP

- **FTP Host**: `free02.123host.vn` (hoặc IP `103.200.20.12` / Domain `vie.info.vn`)
- **Tài khoản FTP**: `thcs@vie.info.vn`
- **Mật khẩu FTP**: `nguyendp`
- **Đường dẫn thư mục web trên Host**: `/home/kjioxydi/public_html/thcs/`
- **Trang web chính thức**: [https://vie.info.vn/thcs/](https://vie.info.vn/thcs/)

---

## 🛡️ Quy tắc bảo vệ Cơ sở dữ liệu (Database Rules)

1. **KHÔNG BAO GIỜ** kích hoạt `setup_db.php` khi Deploy.
2. Dữ liệu học sinh, lớp học, thời khóa biểu, điểm số, điểm danh đều lưu trực tiếp và vĩnh viễn trong MySQL Database `kjioxydi_thcs` trên host.
3. Mỗi lần Deploy code mới, cơ sở dữ liệu trên host được giữ nguyên 100%.
