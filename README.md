
Module này cho phép người dùng trả lời câu hỏi xác minh để nhận lại đồ vật bị mất.

Mở file `traloicauhoi.html` trực tiếp trong trình duyệt để xem giao diện.

## Tính năng

- Hiển thị chi tiết đồ vật nhặt được (hình ảnh, thông tin)
- Câu hỏi xác minh với nhiều đáp án (checkbox)
- Cho phép chọn nhiều đáp án cùng lúc
- Nút "Gửi câu trả lời" tự động kích hoạt khi chọn ít nhất 1 đáp án
- Toast notification khi gửi thành công
- Hiển thị số lần thử còn lại
- Giao diện responsive, hiện đại

## Cấu trúc thư mục

```
├── traloicauhoi.html    # File HTML chính (bao gồm inline CSS & JS)
├── traloicauhoi.css     # File CSS riêng (tùy chọn)
├── traloicauhoi.js      # File JavaScript riêng (tùy chọn)
└── README.md            # Tài liệu hướng dẫn
```

## Cài đặt & Sử dụng

### Cách 1: Mở trực tiếp

Mở file `traloicauhoi.html` trong trình duyệt web (Chrome, Firefox, Edge...)

### Cách 2: Sử dụng Live Server

```bash
# Nếu dùng VS Code, cài extension Live Server và click "Go Live"

# Hoặc dùng npx serve
npx serve
