# L&F DUE – Cấu trúc file UI (Chức năng Tìm kiếm các bài đăng - Xem danh sách các bài đăng

## Danh sách file

```
lostfound-ui/
├── shared.css        ← CSS dùng chung (navbar, filter, card, tab, biến màu...)
│
├── kham-pha.html     ← Màn hình Khám phá (tab "Khám phá")
├── kham-pha.css      ← CSS riêng cho trang Khám phá
├── kham-pha.js       ← JS riêng cho trang Khám phá
│
├── danh-sach.html    ← Màn hình Danh sách đồ thất lạc
├── danh-sach.css     ← CSS riêng cho trang Danh sách
└── danh-sach.js      ← JS riêng cho trang Danh sách
```

## Cách dùng

Mỗi trang HTML load 2 file CSS:
```html
<link rel="stylesheet" href="shared.css" />   <!-- Dùng chung -->
<link rel="stylesheet" href="kham-pha.css" /> <!-- Riêng trang -->
```

Và 1 file JS ở cuối `<body>`:
```html
<script src="kham-pha.js"></script>
```

