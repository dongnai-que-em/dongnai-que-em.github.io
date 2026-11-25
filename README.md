# Đồng Nai Quê Em

Web tĩnh (không cần build) cho môn Giáo dục địa phương Đồng Nai, giao diện claymorphism. Gồm các mục:

- **Lịch sử**: 22 sự kiện theo 6 chương (1698 → 2065), 20 video + tranh minh họa.
- **Di tích**: 6 di tích tiêu biểu (Văn miếu Trấn Biên, Thành cổ Biên Hòa, …).
- **Sản vật**: 17 poster sản vật, làng nghề, thổ cẩm, thiên nhiên (lọc theo nhóm).
- **Văn học**: 15 tác phẩm (truyện dân gian, thơ, văn xuôi, tục ngữ – ca dao).
- **Đồng Nai trong em**: 5 bản đồ khám phá có mã QR + 8 chủ đề âm nhạc, mĩ thuật.
- **Xã phường**: tra cứu 95 xã, phường, liên kết Wikipedia.
- **Hỏi AI**: trợ lý Claude trả lời dựa trên toàn bộ học liệu, có nút mở video liên quan và đọc thành tiếng.

## Chạy trên máy

```bash
python3 -m http.server -d site 8000
```

Mở http://localhost:8000. Có trợ lý AI không cần nhập key: tạo `.env` với `ANTHROPIC_API_KEY=sk-ant-...` rồi chạy `python3 server.py`.

## Cấu trúc

- `site/index.html`, `site/style.css`, `site/app.js` (giao diện), `site/chat.js` (trợ lý AI).
- `site/data/content.js`: dữ liệu các mục (sửa chữ, thêm mục ở đây).
- `site/data/xa-phuong.js`: 95 xã phường. `site/data/poster-text.js`: chữ trên poster (cho AI). `site/data/kien-thuc.js`: thuyết minh video (cho AI).
- `site/img/<mục>/` ảnh lớn, `site/img/<mục>/t/` ảnh thu nhỏ; `site/videos/`, `site/thumbs/`.

## Cập nhật học liệu từ file zip

Giải nén `sangtaophuong.zip` ra một thư mục rồi chạy:

```bash
python3 -I scripts/import-sangtao.py /đường/dẫn/sangtaophuong
```

Script đổi tên file sang ASCII, nén ảnh (bằng `sips` của macOS) và copy video mới. Sau đó sửa `site/data/content.js` nếu có mục mới.

## Deploy

Push vào `main` là workflow `.github/workflows/pages.yml` tự deploy thư mục `site/` lên https://dongnai-que-em.github.io/. API key lấy từ secret `ANTHROPIC_API_KEY` và được nhúng vào `site/config.js` lúc deploy (ai mở web cũng đọc được key này, chỉ nên dùng cho demo).
