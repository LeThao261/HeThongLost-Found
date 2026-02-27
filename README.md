# L&F DUE – Cấu trúc file UI

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

## Cấu hình API

Trong mỗi file `.js`, thay đổi `apiBaseUrl` thành URL backend thực tế:
```js
const apiBaseUrl = 'https://your-api-domain.com/api';
```

## Các endpoint API cần có

| Endpoint | Mô tả |
|---|---|
| `GET /posts?...` | Lấy danh sách bài đăng (có phân trang và filter) |
| `GET /master/nhom-do` | Lấy danh sách nhóm đồ |
| `GET /master/loai-do?maNhomDo=` | Lấy loại đồ theo nhóm |
| `GET /master/mau-sac` | Lấy danh sách màu sắc |
| `GET /master/dia-diem` | Lấy danh sách địa điểm |

## Response format cho `/posts`

```json
{
  "data": [...],
  "totalRecords": 100,
  "pageNumber": 1
}
```
